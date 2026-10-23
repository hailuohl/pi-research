import {captureSourceRevision,validateSourceRevision,copySourceRevision} from './source-access.js';
import {assertOutcomeBoundary} from '../runners/outcome.js';
import {assertProjectReadable,assertProjectWritable, assertExperimentSourceCurrent} from '../policy/lifecycle.js';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, ResearchBriefRef, ResearchContract, Run, Row, ChangeProposal, Session } from '../domain/types.js';
import type { ResearchBriefService } from '../research-workflows/briefs.js';
import { scope, userOnly } from '../policy/permissions.js';
import { object, text, integer } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { ProjectService } from './projects.js';
import { listFiles, safePath, readText, writeText, copySourceModes, setSourceModes } from './files.js';
import { verifySnapshot } from './files.js';
import { readStableFile } from './stable-file.js';
import { EXAMPLE_CONTRACT, validateContract } from '../runners/contracts.js';
export function effectiveExperimentContract(input:unknown,parent?:Pick<Experiment,'contract'|'contractDigest'>):ResearchContract {
    if(parent){
        if(input)ensure(digest(input)===parent.contractDigest,'CONTRACT_CHANGED','子实验必须继承固定运行契约',400);
        validateContract(parent.contract);
        return parent.contract;
    }
    const contract=input?validateContract(input):structuredClone(EXAMPLE_CONTRACT);
    if(contract.runner==='docker')contract.threadLimit??=contract.cpus;
    return contract;
}
export class ExperimentService {
    automation?:import('../policy/research-automation.js').ResearchAutomationService;
    constructor(private c: AppContext, private projects: ProjectService, private briefs?: ResearchBriefService) { }
    get(actor: Actor, id: string) { const e = this.c.store.get<Experiment>('experiment', id); scope(actor, e.projectId!);assertProjectReadable(this.c.store,e.projectId!,actor); return e; }
    preflightContract(actor:Actor,projectId:string,value:unknown) {
        scope(actor,projectId);assertProjectReadable(this.c.store,projectId,actor);const input=object(value),parent=input.parentId?this.c.store.get<Experiment>('experiment',text(input.parentId,'parentId'),projectId):undefined;
        return effectiveExperimentContract(input.contract,parent);
    }
    /** Internal fixed-plan derivation; source is an immutable revision, never a caller filesystem path. */
    createFromRevision(actor:Actor,projectId:string,snapshotId:string,spec:{title:string;hypothesis:string;config?:Record<string,unknown>}) {
        userOnly(actor);scope(actor,projectId);assertProjectWritable(this.c.store,projectId);
        const source=validateSourceRevision(this.c,projectId,snapshotId),parent=this.get(actor,source.experimentId);
        ensure(parent.lifecycle!=='archived','EXPERIMENT_ARCHIVED','归档实验不能派生');
        const id=randomUUID(),workspace=join(this.c.dataDir,'experiments',id,'source');mkdirSync(workspace,{recursive:true,mode:0o700});copySourceRevision(source,workspace,true,this.c.store.paths);
        if(spec.config!==undefined){const prior=source.snapshot.files.some(f=>f.path==='config.json')?object(JSON.parse(readStableFile(this.c.store.paths.physical(source.snapshot.path),'config.json',1024*1024).toString('utf8'))):{};writeFileSync(join(workspace,'config.json'),JSON.stringify({...prior,...object(spec.config)},null,2),{mode:0o600});}
        const child=this.c.store.create<Experiment>('experiment',projectId,{title:text(spec.title,'title',200),hypothesis:text(spec.hypothesis,'hypothesis',10000),parentId:parent.id,lifecycle:'provisional',contract:parent.contract,contractDigest:parent.contractDigest,workspace:this.c.store.paths.reference(workspace),notes:[],revision:1},id);
        captureSourceRevision(this.c,child);this.c.store.event(projectId,'experiment.created',{id,parentId:parent.id,parentSourceRevisionId:source.id});return child;
    }
    create(actor: Actor, projectId: string, input: unknown, selectedRootSessionId?: string) {
        scope(actor, projectId);
        const x = object(input);
        ensure(!x.repair||actor.continuationId,'AUTOMATION_REPAIR_DENIED','技术修复候选需要当前持久任务身份');
        ensure(x.expectedParentRevision===undefined||!!x.parentId,'INVALID_INPUT','expectedParentRevision需要parentId');
        return this.c.store.transaction(() => {
            assertProjectWritable(this.c.store,projectId);
            const fixed=actor.continuationId?this.automation!.variantSource(actor,projectId,x):undefined;
            const p=this.projects.get(actor,projectId);
            const parent = x.parentId ? this.c.store.get<Experiment>('experiment', text(x.parentId, 'parentId'), projectId) : undefined;
            const interactiveRoot=actor.type==='user'||actor.type==='agent'&&actor.role==='coordinator';
            const rootSessionId=actor.type==='agent'&&actor.role==='coordinator'?actor.sessionId:actor.type==='user'?selectedRootSessionId:undefined;
            if(actor.type==='agent'&&actor.role==='coordinator')ensure(rootSessionId,'RUN_SESSION_REQUIRED','交互协调会话需要主会话身份');
            if(interactiveRoot&&parent?.researchBrief&&!rootSessionId)ensure(false,'RUN_SESSION_REQUIRED','从绑定研究计划的实验派生需要主会话');
            const root=rootSessionId?this.c.store.get<Session>('session',rootSessionId,projectId):undefined;
            ensure(root?.researchBriefId===undefined||this.briefs,'BRIEF_CAPTURE_UNAVAILABLE','研究简报服务未初始化');
            const researchBrief:ResearchBriefRef|undefined=rootSessionId?this.briefs?.capture(actor,projectId,rootSessionId):undefined;
            if(interactiveRoot&&parent?.researchBrief)ensure(researchBrief,'BRIEF_REQUIRED','从绑定研究计划派生需要当前主会话的已确认研究计划');
            if (parent) { ensure(parent.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能派生新源码'); assertExperimentSourceCurrent(this.c.store, parent); }
            if(x.expectedParentRevision!==undefined)ensure(parent!.revision===integer(x.expectedParentRevision,'expectedParentRevision',1),'EXPERIMENT_REVISION_CHANGED','父实验修订已变化，请重新读取配置再准备候选');
            const contract = effectiveExperimentContract(x.contract,parent);
            const id = randomUUID(), workspace = join(this.c.dataDir, 'experiments', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            const source = this.c.store.paths.physical(fixed?.snapshot.path??parent?.workspace ?? p.workspace);
            for (const f of listFiles(source)) {
                ensure(f.size <= 16 * 1024 * 1024, 'FILE_TOO_LARGE', '请独立版本化大型数据集', 413);
                const dest = safePath(workspace, f.path);
                mkdirSync(dirname(dest), { recursive: true });
                writeFileSync(dest, readFileSync(safePath(source, f.path)), { mode: 0o600 });
            }
            copySourceModes(source,workspace,listFiles(source));
            if (x.config !== undefined && !x.repair) {
                object(x.config);
                writeFileSync(join(workspace, 'config.json'), JSON.stringify(x.config, null, 2), { mode: 0o600 });
            }
            const e = this.c.store.create<Experiment>('experiment', projectId, { title: text(x.title, 'title', 200), hypothesis: text(x.hypothesis ?? '尚未填写假设', 'hypothesis', 10000), parentId: parent?.id ?? null, lifecycle: 'provisional', contract, contractDigest: digest(contract), workspace:this.c.store.paths.reference(workspace), notes: [], revision: 1,...(researchBrief?{researchBrief}:{}) }, id);
            captureSourceRevision(this.c,e);
            if(fixed)this.automation!.recordVariant(actor,e,fixed);
            this.c.store.event(projectId, 'experiment.created', { id, parentId: e.parentId });
            return e;
        });
    }
    /** Host-only integration of a fixed proposal; never takes caller-supplied filesystem paths. */
    createApprovedChild(actor:Actor, proposal:Row<ChangeProposal>) {
        userOnly(actor);
        const stored=this.c.store.get<ChangeProposal>('change-proposal',proposal.id);
        ensure(stored.digest===proposal.digest && stored.candidateSnapshot.digest===proposal.candidateSnapshot.digest,'CHANGE_PROPOSAL_CORRUPTED','提案记录不一致');
        const p=this.c.store.get<import('../domain/types.js').Approval>('approval',stored.approvalId);
        ensure(p.status==='approved' && p.digest===stored.digest && p.scope==='change.integrate' && p.subjectId===stored.id,'APPROVAL_REQUIRED','需要整合批准');
        const parent=this.get(actor,stored.baseExperimentId), snapshot=stored.candidateSnapshot;
        assertProjectWritable(this.c.store,parent.projectId!);assertExperimentSourceCurrent(this.c.store,parent);
        verifySnapshot(this.c.store.paths.physical(snapshot.path),snapshot.files);
        const id=randomUUID(),workspace=join(this.c.dataDir,'experiments',id,'source');mkdirSync(workspace,{recursive:true,mode:0o700});
        for(const f of snapshot.files){const dest=safePath(workspace,f.path);mkdirSync(dirname(dest),{recursive:true});const bytes=readStableFile(this.c.store.paths.physical(snapshot.path),f.path,64*1024*1024);ensure(digest(bytes)===f.digest&&bytes.length===f.size,'SNAPSHOT_CORRUPTED','复制的字节与批准的快照不一致');writeFileSync(dest,bytes,{mode:0o600});}
        setSourceModes(workspace,snapshot.files);
        const child=this.c.store.create<Experiment>('experiment',parent.projectId,{title:stored.title,hypothesis:stored.hypothesis,parentId:parent.id,lifecycle:'provisional',contract:parent.contract,contractDigest:parent.contractDigest,workspace:this.c.store.paths.reference(workspace),notes:[],revision:1,changeProposalId:stored.id},id);
        captureSourceRevision(this.c,child);
        this.c.store.event(parent.projectId,'experiment.created',{id,parentId:parent.id,changeProposalId:stored.id});return child;
    }
    readFile(actor: Actor, id: string, path: string) { return readText(this.c.store.paths.physical(this.get(actor, id).workspace), path); }
    writeFile(actor: Actor, id: string, path: string, content: string, expectedDigest: string | null, expectedVersion: number) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const e = this.get(actor, id);
            assertProjectWritable(this.c.store, e.projectId!);
            assertExperimentSourceCurrent(this.c.store, e);
            ensure(e.lifecycle === 'provisional', 'EXPERIMENT_FROZEN', '已获得结果的节点不可修改，请派生子实验');
            assertOutcomeBoundary(this.c.store,e,true);
            ensure(e.version === expectedVersion, 'VERSION_CONFLICT', '实验已更新');
            ensure(this.c.store.list<Run>('run', e.projectId!).filter(r => r.experimentId === id).every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'WORKSPACE_BUSY', '实验仍在执行；请派生新候选而不是修改运行节点');
            captureSourceRevision(this.c,e);
            const result = writeText(this.c.store.paths.physical(e.workspace), path, content, expectedDigest, this.c.store);
            const revised=this.c.store.update<Experiment>('experiment', id, e.version, { revision: e.revision + 1 });
            captureSourceRevision(this.c,revised);
            this.c.store.event(e.projectId, 'experiment.revised', { id, path });
            return result;
        });
    }
    note(actor: Actor, id: string, content: string) { userOnly(actor); const e = this.get(actor, id); assertProjectWritable(this.c.store,e.projectId!); ensure(e.lifecycle!=='archived','EXPERIMENT_ARCHIVED','归档实验不能增加新备注'); return this.c.store.update<Experiment>('experiment', id, e.version, { notes: [...e.notes, text(content, 'note', 10000)] }); }
}
