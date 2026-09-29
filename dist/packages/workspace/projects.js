import { mkdirSync, copyFileSync, existsSync, writeFileSync, lstatSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative, isAbsolute } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { DEFAULT_COLLABORATION } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { bool, integer, object, oneOf, text } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { listFiles, readText, writeText, safePath, readSourceMode, setSourceModes, copySourceModes } from './files.js';
import { readStableFile } from './stable-file.js';
import { GitCommand } from './git-command.js';
import { digest } from '../storage/store.js';
const IMPORT_EXCLUDED = ['.git', '.gitmodules (rejected)', 'node_modules', '.pi', '.env', '.env.*', '.DS_Store', '.pi-research', '.pi-runtime', '.npmrc', '.pypirc'];
function hasGitMetadata(source) { for (let path = source;; path = dirname(path)) {
    if (existsSync(join(path, '.git')))
        return true;
    if (dirname(path) === path)
        return false;
} }
export class ProjectService {
    c;
    importPlans = new WeakMap();
    constructor(c) {
        this.c = c;
    }
    get(actor, id) { scope(actor, id); const p = this.c.store.get('project', id); ensure(!p.archived, 'PROJECT_ARCHIVED', '项目已归档', 409); return p; }
    create(actor, input) {
        userOnly(actor);
        const x = object(input);
        const name = text(x.name, 'name', 120);
        return this.c.store.transaction(() => {
            const id = randomUUID();
            const workspace = join(this.c.dataDir, 'projects', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            this.c.store.onRollback(() => rmSync(safePath(this.c.dataDir, `projects/${id}`), { recursive: true, force: true }));
            if (x.template === 'curve-fit') {
                for (const file of ['experiment.mjs', 'config.json', 'README.md'])
                    copyFileSync(join(this.c.repoRoot, 'examples', 'curve-fit', file), join(workspace, file));
                copySourceModes(join(this.c.repoRoot, 'examples', 'curve-fit'), workspace, ['experiment.mjs', 'config.json', 'README.md'].map(path => ({ path })));
            }
            else {
                ensure(x.template === undefined || x.template === 'empty', 'INVALID_INPUT', '不支持的模板', 400);
                writeFileSync(join(workspace, 'README.md'), `# ${name}\n\n项目文件由用户导入。\n`, { mode: 0o600 });
            }
            const p = this.c.store.create('project', id, { name, description: text(x.description ?? '', 'description', 2000, true), workspace: this.c.store.paths.reference(workspace), archived: false, settings: { ...DEFAULT_COLLABORATION } }, id);
            this.c.store.event(id, 'project.created', { id, name });
            return p;
        });
    }
    importInput(input) {
        const x = object(input);
        ensure(Object.keys(x).every(k => ['name', 'description', 'sourcePath'].includes(k)), 'INVALID_INPUT', '导入只接受名称、描述和源码目录', 400);
        return { name: text(x.name, 'name', 120), description: text(x.description ?? '', 'description', 2000, true), sourcePath: resolve(text(x.sourcePath, 'sourcePath', 4096)) };
    }
    checkImportSource(source) {
        ensure(existsSync(source) && lstatSync(source).isDirectory() && !lstatSync(source).isSymbolicLink(), 'PATH_DENIED', '导入源必须是本机真实目录', 403);
        for (const root of [this.c.dataDir, ...this.c.store.paths.legacyRoots]) {
            const rel = relative(resolve(root), source);
            ensure(rel !== '' && (rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)), 'PATH_DENIED', '不能将当前或历史应用数据目录作为项目源码导入', 403);
        }
    }
    captureImport(input, git) {
        const source = input.sourcePath;
        this.checkImportSource(source);
        const files = listFiles(source);
        ensure(files.length > 0, 'EMPTY_WORKSPACE', '导入目录没有可用源码文件', 400);
        ensure(!files.some(f => f.path.split('/').includes('.gitmodules')), 'UNSUPPORTED_SUBMODULE', '导入不自动展开 Git 子模块', 422);
        const tracked = new Map(git?.files.map(f => [f.path, f]) ?? []);
        let total = 0;
        const entries = files.map(f => { const bytes = readStableFile(source, f.path, 64 * 1024 * 1024); total += bytes.length; ensure(total <= 64 * 1024 * 1024, 'SNAPSHOT_TOO_LARGE', '当前导入上限为64 MiB；大数据集需单独版本化', 413); ensure(!bytes.subarray(0, 150).toString().startsWith('version https://git-lfs.github.com/spec'), 'UNSUPPORTED_LFS', '请先解析 Git LFS 文件再导入', 422); return { path: f.path, bytes, mode: process.platform === 'win32' ? (tracked.get(f.path)?.mode ?? '100644') : readSourceMode(source, f.path) }; });
        const sourceDigest = digest(entries.map(f => ({ path: f.path, size: f.bytes.length, digest: digest(f.bytes), mode: f.mode })).sort((a, b) => a.path.localeCompare(b.path)));
        const dirty = !!git && (entries.length !== git.files.length || entries.some(f => { const old = tracked.get(f.path); return !old || old.mode !== f.mode || old.oid !== createHash('sha1').update(`blob ${f.bytes.length}\0`).update(f.bytes).digest('hex'); }));
        return { inputDigest: digest(input), source, entries, sourceDigest, git, dirty };
    }
    /** Git and source I/O preflight runs before the caller opens its SQLite write transaction. */
    async prepareImport(actor, input) {
        userOnly(actor);
        const x = this.importInput(input);
        this.checkImportSource(x.sourcePath);
        const git = hasGitMetadata(x.sourcePath) ? await GitCommand.readImport(x.sourcePath) : null, plan = this.captureImport(x, git), prepared = { sourceDigest: plan.sourceDigest };
        this.importPlans.set(prepared, plan);
        return prepared;
    }
    importDirectory(actor, input, prepared) {
        userOnly(actor);
        const x = this.importInput(input);
        let plan;
        if (prepared) {
            const p = this.importPlans.get(prepared);
            ensure(p && p.inputDigest === digest(x), 'IMPORT_PLAN_INVALID', '需要匹配请求的宿主导入预检', 400);
            plan = p;
        }
        else {
            this.checkImportSource(x.sourcePath);
            ensure(!hasGitMetadata(x.sourcePath), 'IMPORT_PREFLIGHT_REQUIRED', 'Git 项目需要先完成异步导入预检', 409);
            plan = this.captureImport(x, null);
        }
        return this.c.store.transaction(() => {
            const p = this.create(actor, { name: x.name, description: x.description, template: 'empty' }), workspace = this.c.store.paths.physical(p.workspace);
            rmSync(join(workspace, 'README.md'), { force: true });
            for (const f of plan.entries) {
                const path = safePath(workspace, f.path);
                mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
                writeFileSync(path, f.bytes, { mode: 0o600, flag: 'wx' });
            }
            setSourceModes(workspace, plan.entries);
            this.c.store.create('project-import', p.id, { sourcePath: plan.source, fileCount: plan.entries.length, sourceDigest: plan.sourceDigest, mode: 'copy-without-git-metadata', excluded: IMPORT_EXCLUDED, untracked: 'included unless excluded', submodules: 'rejected', lfs: 'unresolved pointers rejected', ...(plan.git ? { commit: plan.git.commit, remote: plan.git.remote, dirty: plan.dirty, dirtyMeaning: 'imported snapshot differs from recorded HEAD; includes excluded tracked files', gitHistory: 'observed working-copy import; original history not copied' } : {}) });
            this.c.store.event(p.id, 'project.imported', { projectId: p.id, fileCount: plan.entries.length, sourceDigest: plan.sourceDigest });
            return p;
        });
    }
    update(actor, id, input) { userOnly(actor); const p = this.get(actor, id), x = object(input); const version = integer(x.expectedVersion, 'expectedVersion', 1); return this.c.store.transaction(() => { const next = this.c.store.update('project', id, version, { name: x.name === undefined ? p.name : text(x.name, 'name', 120), description: x.description === undefined ? p.description : text(x.description, 'description', 2000, true) }); this.c.store.event(id, 'project.updated', { id, version: next.version }); return next; }); }
    archive(actor, id, version) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            this.get(actor, id);
            ensure(this.c.store.list('run', id).every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'PROJECT_BUSY', '项目仍有未结束运行，不能归档');
            ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE project_id=? AND kind IN ('document','publication') AND (held=1 OR phase='queued') LIMIT 1").get(id), 'PROJECT_BUSY', '项目仍有未结束文档解析或文稿构建，请取消或核对后归档');
            ensure(!this.c.store.db.prepare("SELECT 1 FROM records WHERE kind='literature-task' AND project_id=? AND json_extract(data,'$.state') IN ('queued','running') LIMIT 1").get(id), 'PROJECT_BUSY', '项目仍有文献任务，请取消后归档');
            ensure(this.c.store.list('session', id).every(s => s.state !== 'running'), 'PROJECT_BUSY', '项目仍有活跃 Agent');
            ensure(this.c.store.list('task', id).every(t => t.execution !== 'running'), 'PROJECT_BUSY', '项目仍有活跃助手');
            const next = this.c.store.update('project', id, version, { archived: true });
            for (const a of this.c.store.list('approval', id).filter(a => ['pending', 'approved'].includes(a.status)))
                this.c.store.update('approval', a.id, a.version, { status: 'stale' });
            for (const m of this.c.store.list('message', id).filter(m => m.status === 'queued'))
                this.c.store.update('message', m.id, m.version, { status: 'cancelled', error: '项目已归档，未开始的请求已取消' });
            for (const s of this.c.store.list('session', id).filter(s => s.state === 'queued'))
                this.c.store.update('session', s.id, s.version, { state: 'idle' });
            for (const t of this.c.store.list('team', id).filter(t => ['active', 'paused', 'awaiting_approval'].includes(t.state)))
                this.c.store.update('team', t.id, t.version, { state: 'paused', blockReason: '项目已归档；禁止新委派' });
            this.c.store.event(id, 'project.archived', { projectId: id });
            return next;
        });
    }
    settings(actor, id, input) {
        userOnly(actor);
        const p = this.get(actor, id), x = object(input);
        const next = { ...p.settings };
        if (x.enabled !== undefined)
            next.enabled = bool(x.enabled, 'enabled');
        if (x.strategy !== undefined)
            next.strategy = oneOf(x.strategy, ['adaptive', 'manual'], 'strategy');
        if (x.maxActiveAgents !== undefined)
            next.maxActiveAgents = integer(x.maxActiveAgents, 'maxActiveAgents', 2, 8);
        if (x.maxConcurrentAssistants !== undefined)
            next.maxConcurrentAssistants = integer(x.maxConcurrentAssistants, 'maxConcurrentAssistants', 1, 7);
        ensure(next.maxConcurrentAssistants < next.maxActiveAgents, 'INVALID_INPUT', '必须给主协调者保留一个名额', 400);
        return this.c.store.transaction(() => { const updated = this.c.store.update('project', id, integer(x.expectedVersion, 'expectedVersion', 1), { settings: next }); this.c.store.event(id, 'project.collaboration_changed', { enabled: next.enabled }); return updated; });
    }
    listFiles(actor, id) { return listFiles(this.c.store.paths.physical(this.get(actor, id).workspace)); }
    readFile(actor, id, path) { return readText(this.c.store.paths.physical(this.get(actor, id).workspace), path); }
    writeFile(actor, id, path, content, expectedDigest) { userOnly(actor); return this.c.store.transaction(() => { const p = this.get(actor, id); const result = writeText(this.c.store.paths.physical(p.workspace), path, content, expectedDigest, this.c.store); this.c.store.event(id, 'workspace.file_changed', { path, digest: result.digest }); return result; }); }
}
//# sourceMappingURL=projects.js.map