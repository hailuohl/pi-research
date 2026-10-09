import {projectPurgeView} from '../storage/project-purge.js';
import { assertProjectWritable, assertProjectReadable, assertProjectIdle, retireProjectAuthority } from '../policy/lifecycle.js';
import { mkdirSync, copyFileSync, existsSync, writeFileSync, lstatSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { randomUUID,createHash } from 'node:crypto';
import type { AppContext } from '../domain/context.js';
import { DEFAULT_COLLABORATION, type Actor, type Project, type CollaborationSettings, type ProjectLifecycleView } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { bool, integer, object, oneOf, text } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { listFiles, readText, writeText, safePath,readSourceMode,setSourceModes,copySourceModes,type SourceMode } from './files.js';
import {readStableFile} from './stable-file.js';
import {GitCommand,type GitImport} from './git-command.js';
import {digest} from '../storage/store.js';
interface ImportPlan {inputDigest:string;source:string;entries:Array<{path:string;bytes:Buffer;mode:SourceMode}>;sourceDigest:string;git:GitImport|null;dirty:boolean;}
export interface PreparedProjectImport {sourceDigest:string;}
const IMPORT_EXCLUDED=['.git','.gitmodules (rejected)','node_modules','.pi','.env','.env.*','.DS_Store','.pi-research','.pi-runtime','.npmrc','.pypirc'];
function hasGitMetadata(source:string) {for(let path=source;;path=dirname(path)){if(existsSync(join(path,'.git')))return true;if(dirname(path)===path)return false;}}
export class ProjectService {
    private readonly importPlans=new WeakMap<PreparedProjectImport,ImportPlan>();
    constructor(private c: AppContext) { }
    get(actor: Actor, id: string) { scope(actor, id); return assertProjectWritable(this.c.store,id); }
    read(actor:Actor,id:string) {scope(actor,id);return assertProjectReadable(this.c.store,id,actor);}
    create(actor: Actor, input: unknown) {
        userOnly(actor);
        const x = object(input);
        ensure(x.github===undefined,'GITHUB_PREFLIGHT_REQUIRED','GitHub 项目需通过宿主异步预检入口创建',400);
        const name = text(x.name, 'name', 120);
        return this.c.store.transaction(() => {
            const id = randomUUID();
            const workspace = join(this.c.dataDir, 'projects', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            this.c.store.onRollback(()=>rmSync(safePath(this.c.dataDir,`projects/${id}`),{recursive:true,force:true}));
            if (x.template === 'curve-fit') {
                for (const file of ['experiment.mjs', 'config.json', 'README.md'])
                    copyFileSync(join(this.c.repoRoot, 'examples', 'curve-fit', file), join(workspace, file));
                copySourceModes(join(this.c.repoRoot,'examples','curve-fit'),workspace,['experiment.mjs','config.json','README.md'].map(path=>({path})));
            }
            else {
                ensure(x.template === undefined || x.template === 'empty', 'INVALID_INPUT', '不支持的模板', 400);
                writeFileSync(join(workspace, 'README.md'), `# ${name}\n\n项目文件由用户导入。\n`, { mode: 0o600 });
            }
            const p = this.c.store.create<Project>('project', id, { name, description: text(x.description ?? '', 'description', 2000, true), workspace:this.c.store.paths.reference(workspace), status:'active', lifecycleEpoch:0, settings: { ...DEFAULT_COLLABORATION } }, id);
            this.c.store.event(id, 'project.created', { id, name });
            return p;
        });
    }
    private importInput(input:unknown) {
        const x=object(input);ensure(Object.keys(x).every(k=>['name','description','sourcePath'].includes(k)),'INVALID_INPUT','导入只接受名称、描述和源码目录',400);
        return {name:text(x.name,'name',120),description:text(x.description??'','description',2000,true),sourcePath:resolve(text(x.sourcePath,'sourcePath',4096))};
    }
    private checkImportSource(source:string) {
        ensure(existsSync(source) && lstatSync(source).isDirectory() && !lstatSync(source).isSymbolicLink(), 'PATH_DENIED', '导入源必须是本机真实目录', 403);
        for(const root of [this.c.dataDir,...this.c.store.paths.legacyRoots]){const rel=relative(resolve(root),source);ensure(rel!==''&&(rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel)),'PATH_DENIED','不能将当前或历史应用数据目录作为项目源码导入',403);}
    }
    private captureImport(input:ReturnType<ProjectService['importInput']>,git:GitImport|null):ImportPlan {
        const source=input.sourcePath;this.checkImportSource(source);
        const files = listFiles(source);
        ensure(files.length > 0, 'EMPTY_WORKSPACE', '导入目录没有可用源码文件', 400);
        ensure(!files.some(f=>f.path.split('/').includes('.gitmodules')),'UNSUPPORTED_SUBMODULE','导入不自动展开 Git 子模块',422);
        const tracked=new Map(git?.files.map(f=>[f.path,f])??[]);let total=0;
        const entries=files.map(f=>{const bytes=readStableFile(source,f.path,64*1024*1024);total+=bytes.length;ensure(total<=64*1024*1024,'SNAPSHOT_TOO_LARGE','当前导入上限为64 MiB；大数据集需单独版本化',413);ensure(!bytes.subarray(0,150).toString().startsWith('version https://git-lfs.github.com/spec'),'UNSUPPORTED_LFS','请先解析 Git LFS 文件再导入',422);return {path:f.path,bytes,mode:process.platform==='win32'?(tracked.get(f.path)?.mode??'100644'):readSourceMode(source,f.path)};});
        const sourceDigest=digest(entries.map(f=>({path:f.path,size:f.bytes.length,digest:digest(f.bytes),mode:f.mode})).sort((a,b)=>a.path.localeCompare(b.path)));
        const dirty=!!git&&(entries.length!==git.files.length||entries.some(f=>{const old=tracked.get(f.path);return !old||old.mode!==f.mode||old.oid!==createHash('sha1').update(`blob ${f.bytes.length}\0`).update(f.bytes).digest('hex');}));
        return {inputDigest:digest(input),source,entries,sourceDigest,git,dirty};
    }
    /** Git and source I/O preflight runs before the caller opens its SQLite write transaction. */
    async prepareImport(actor:Actor,input:unknown):Promise<PreparedProjectImport> {
        userOnly(actor);const x=this.importInput(input);this.checkImportSource(x.sourcePath);
        const git=hasGitMetadata(x.sourcePath)?await GitCommand.readImport(x.sourcePath):null,plan=this.captureImport(x,git),prepared={sourceDigest:plan.sourceDigest};
        this.importPlans.set(prepared,plan);return prepared;
    }
    importDirectory(actor:Actor,input:unknown,prepared?:PreparedProjectImport) {
        userOnly(actor);const x=this.importInput(input);
        let plan:ImportPlan;
        if(prepared){const p=this.importPlans.get(prepared);ensure(p&&p.inputDigest===digest(x),'IMPORT_PLAN_INVALID','需要匹配请求的宿主导入预检',400);plan=p;}
        else {this.checkImportSource(x.sourcePath);ensure(!hasGitMetadata(x.sourcePath),'IMPORT_PREFLIGHT_REQUIRED','Git 项目需要先完成异步导入预检',409);plan=this.captureImport(x,null);}
        return this.c.store.transaction(()=>{
            const p=this.create(actor,{name:x.name,description:x.description,template:'empty'}),workspace=this.c.store.paths.physical(p.workspace);rmSync(join(workspace,'README.md'),{force:true});
            for(const f of plan.entries){const path=safePath(workspace,f.path);mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,f.bytes,{mode:0o600,flag:'wx'});}
            setSourceModes(workspace,plan.entries);
            this.c.store.create('project-import',p.id,{sourcePath:plan.source,fileCount:plan.entries.length,sourceDigest:plan.sourceDigest,mode:'copy-without-git-metadata',excluded:IMPORT_EXCLUDED,untracked:'included unless excluded',submodules:'rejected',lfs:'unresolved pointers rejected',...(plan.git?{commit:plan.git.commit,remote:plan.git.remote,dirty:plan.dirty,dirtyMeaning:'imported snapshot differs from recorded HEAD; includes excluded tracked files',gitHistory:'observed working-copy import; original history not copied'}:{})});
            this.c.store.event(p.id,'project.imported',{projectId:p.id,fileCount:plan.entries.length,sourceDigest:plan.sourceDigest});return p;
        });
    }
    update(actor: Actor, id: string, input: unknown) { userOnly(actor); const p = this.get(actor, id), x = object(input); const version = integer(x.expectedVersion, 'expectedVersion', 1); return this.c.store.transaction(() => {assertProjectWritable(this.c.store,id,p.lifecycleEpoch); const next = this.c.store.update<Project>('project', id, version, { name: x.name === undefined ? p.name : text(x.name, 'name', 120), description: x.description === undefined ? p.description : text(x.description, 'description', 2000, true) }); this.c.store.event(id, 'project.updated', { id, version: next.version }); return next; }); }
    archive(actor: Actor, id: string, version: number) {
        userOnly(actor);
        return this.c.store.transaction(()=>{
            const project=this.get(actor,id);
            ensure(project.version===version,'VERSION_CONFLICT','项目已更新，请刷新后重试');
            assertProjectIdle(this.c.store,id);
            const next=this.c.store.update<Project>('project',id,version,{status:'archived'});
            retireProjectAuthority(this.c.store,id);
            this.c.store.event(id,'project.archived',{projectId:id,lifecycleEpoch:next.lifecycleEpoch});return next;
        });
    }

    unarchive(actor:Actor,id:string,version:number) {
        userOnly(actor);scope(actor,id);
        return this.c.store.transaction(()=>{
            const project=this.c.store.get<Project>('project',id);
            ensure(project.version===version,'VERSION_CONFLICT','项目已更新，请刷新后重试');
            ensure(project.status==='archived','PROJECT_NOT_ARCHIVED','只能取消归档已归档项目');
            const next=this.c.store.update<Project>('project',id,version,{status:'active'});
            this.c.store.event(id,'project.unarchived',{projectId:id,lifecycleEpoch:next.lifecycleEpoch});return next;
        });
    }

    lifecycle(actor:Actor,id:string):ProjectLifecycleView {
        userOnly(actor);const p=this.c.store.get<Project>('project',id);
        return {id:p.id,name:p.name,version:p.version,status:p.status,lifecycleEpoch:p.lifecycleEpoch,archived:p.status!=='active',createdAt:p.createdAt,updatedAt:p.updatedAt,...(p.deletedAt?{deletedAt:p.deletedAt}:{}),...(p.restoreStatus?{restoreStatus:p.restoreStatus}:{})};
    }
    trash(actor:Actor,id:string,version:number) {
        userOnly(actor);return this.c.store.transaction(()=>{
            const p=this.c.store.get<Project>('project',id);ensure(p.version===version,'VERSION_CONFLICT','项目已更新，请刷新后重试');
            this.read(actor,id);assertProjectIdle(this.c.store,id);
            this.c.store.update<Project>('project',id,version,{status:'trashed',restoreStatus:p.status as 'active'|'archived',deletedAt:new Date().toISOString()});
            retireProjectAuthority(this.c.store,id);
            const next=this.lifecycle(actor,id);this.c.store.event(id,'project.trashed',{projectId:id,lifecycleEpoch:next.lifecycleEpoch});return next;
        });
    }
    restore(actor:Actor,id:string,version:number) {
        userOnly(actor);return this.c.store.transaction(()=>{
            const p=this.c.store.get<Project>('project',id);ensure(p.version===version,'VERSION_CONFLICT','项目已更新，请刷新后重试');
            ensure(p.status==='trashed','PROJECT_NOT_TRASHED','只能还原回收站中的项目');
            ensure(p.restoreStatus==='active'||p.restoreStatus==='archived','PROJECT_RESTORE_INVALID','原项目状态缺失，不能自动还原');assertProjectIdle(this.c.store,id);
            this.c.store.update<Project>('project',id,version,{status:p.restoreStatus,restoreStatus:undefined,deletedAt:undefined});
            const next=this.lifecycle(actor,id);this.c.store.event(id,'project.restored',{projectId:id,lifecycleEpoch:next.lifecycleEpoch});return next;
        });
    }

    purgeStatus(actor:Actor,id:string){userOnly(actor);return projectPurgeView(this.c.store.db,this.c.dataDir,id);}
    purge(actor:Actor,id:string,value:unknown,key:string) {
        userOnly(actor);const x=object(value);ensure(Object.keys(x).length===2&&'expectedVersion'in x&&'confirmName'in x,'INVALID_INPUT','永久清理只接受版本和精确项目名称');
        const version=integer(x.expectedVersion,'expectedVersion',1),name=text(x.confirmName,'confirmName',120);text(key,'Idempotency-Key',200);const requestHash=digest(x);
        return this.c.store.transaction(()=>{
            const old=this.c.store.db.prepare('SELECT request_key,request_hash FROM project_purges WHERE project_id=?').get(id);
            if(old){ensure(old.request_key===key,'PURGE_ALREADY_REQUESTED','此项目已有永久清理请求，请查看管理进度');ensure(old.request_hash===requestHash,'IDEMPOTENCY_CONFLICT','同一清理请求标识不能改变内容');return this.purgeStatus(actor,id);}
            const p=this.c.store.get<Project>('project',id);ensure(p.status==='trashed','PURGE_NOT_TRASHED','只有回收站项目可以请求永久清理');ensure(p.version===version,'VERSION_CONFLICT','项目已更新，请刷新后重试');ensure(name===p.name,'PURGE_NAME_MISMATCH','请精确输入项目名称');assertProjectIdle(this.c.store,id);
            this.c.store.update<Project>('project',id,version,{status:'purging'});retireProjectAuthority(this.c.store,id);
            const purgeId=randomUUID();this.c.store.db.prepare("INSERT INTO project_purges(id,project_id,state,phase,updated_at,name_hash,request_key,request_hash) VALUES(?,?,'pending','waiting_offline',?,?,?,?)").run(purgeId,id,new Date().toISOString(),digest(name),key,requestHash);this.c.store.event(id,'project.purge_requested',{projectId:id,purgeId});return this.purgeStatus(actor,id);
        });
    }

    settings(actor: Actor, id: string, input: unknown) {
        userOnly(actor);
        const p = this.get(actor, id), x = object(input);
        const next: CollaborationSettings = { ...p.settings };
        if (x.enabled !== undefined)
            next.enabled = bool(x.enabled, 'enabled');
        if (x.strategy !== undefined)
            next.strategy = oneOf(x.strategy, ['adaptive', 'manual'] as const, 'strategy');
        if (x.maxActiveAgents !== undefined)
            next.maxActiveAgents = integer(x.maxActiveAgents, 'maxActiveAgents', 2, 8);
        if (x.maxConcurrentAssistants !== undefined)
            next.maxConcurrentAssistants = integer(x.maxConcurrentAssistants, 'maxConcurrentAssistants', 1, 7);
        ensure(next.maxConcurrentAssistants < next.maxActiveAgents, 'INVALID_INPUT', '必须给主协调者保留一个名额', 400);
        return this.c.store.transaction(() => {assertProjectWritable(this.c.store,id,p.lifecycleEpoch); const updated = this.c.store.update<Project>('project', id, integer(x.expectedVersion, 'expectedVersion', 1), { settings: next }); this.c.store.event(id, 'project.collaboration_changed', { enabled: next.enabled }); return updated; });
    }
    listFiles(actor: Actor, id: string) { return listFiles(this.c.store.paths.physical(this.read(actor, id).workspace)); }
    readFile(actor: Actor, id: string, path: string) { return readText(this.c.store.paths.physical(this.read(actor, id).workspace), path); }
    writeFile(actor: Actor, id: string, path: string, content: string, expectedDigest: string | null) { userOnly(actor); return this.c.store.transaction(() => { const p = this.get(actor, id); const result = writeText(this.c.store.paths.physical(p.workspace), path, content, expectedDigest, this.c.store); this.c.store.event(id, 'workspace.file_changed', { path, digest: result.digest }); return result; }); }
}
