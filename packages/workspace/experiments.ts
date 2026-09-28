import {captureSourceRevision} from './source-access.js';
import {assertOutcomeBoundary} from '../runners/outcome.js';
import {assertProjectWritable, assertExperimentSourceCurrent} from '../policy/lifecycle.js';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { AppContext } from '../domain/context.js';
import type { Actor, Experiment, ResearchContract, Run, Row, ChangeProposal } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { object, text, integer } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { ProjectService } from './projects.js';
import { listFiles, safePath, readText, writeText } from './files.js';
import { verifySnapshot } from './files.js';
import { readStableFile } from './stable-file.js';
import { EXAMPLE_CONTRACT, validateContract } from '../runners/contracts.js';
export class ExperimentService {
    constructor(private c: AppContext, private projects: ProjectService) { }
    get(actor: Actor, id: string) { const e = this.c.store.get<Experiment>('experiment', id); scope(actor, e.projectId!); return e; }
    create(actor: Actor, projectId: string, input: unknown) {
        scope(actor, projectId);
        const p = this.projects.get(actor, projectId), x = object(input);
        const parent = x.parentId ? this.c.store.get<Experiment>('experiment', text(x.parentId, 'parentId'), projectId) : undefined;
        if (parent) { ensure(parent.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能派生新源码'); assertExperimentSourceCurrent(this.c.store, parent); }
        const contract = parent ? parent.contract : x.contract ? validateContract(x.contract) : structuredClone(EXAMPLE_CONTRACT);
        if (parent && x.contract)
            ensure(digest(x.contract) === parent.contractDigest, 'CONTRACT_CHANGED', '子实验必须继承固定运行契约', 400);
        return this.c.store.transaction(() => {
            const id = randomUUID(), workspace = join(this.c.dataDir, 'experiments', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            const source = parent?.workspace ?? p.workspace;
            for (const f of listFiles(source)) {
                ensure(f.size <= 16 * 1024 * 1024, 'FILE_TOO_LARGE', '请独立版本化大型数据集', 413);
                const dest = safePath(workspace, f.path);
                mkdirSync(dirname(dest), { recursive: true });
                writeFileSync(dest, readFileSync(safePath(source, f.path)), { mode: 0o600 });
            }
            if (x.config !== undefined) {
                object(x.config);
                writeFileSync(join(workspace, 'config.json'), JSON.stringify(x.config, null, 2), { mode: 0o600 });
            }
            const e = this.c.store.create<Experiment>('experiment', projectId, { title: text(x.title, 'title', 200), hypothesis: text(x.hypothesis ?? '尚未填写假设', 'hypothesis', 10000), parentId: parent?.id ?? null, lifecycle: 'provisional', contract, contractDigest: digest(contract), workspace, notes: [], revision: 1 }, id);
            captureSourceRevision(this.c,e);
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
        verifySnapshot(snapshot.path,snapshot.files);
        const id=randomUUID(),workspace=join(this.c.dataDir,'experiments',id,'source');mkdirSync(workspace,{recursive:true,mode:0o700});
        for(const f of snapshot.files){const dest=safePath(workspace,f.path);mkdirSync(dirname(dest),{recursive:true});const bytes=readStableFile(snapshot.path,f.path,64*1024*1024);ensure(digest(bytes)===f.digest&&bytes.length===f.size,'SNAPSHOT_CORRUPTED','复制的字节与批准的快照不一致');writeFileSync(dest,bytes,{mode:0o600});}
        const child=this.c.store.create<Experiment>('experiment',parent.projectId,{title:stored.title,hypothesis:stored.hypothesis,parentId:parent.id,lifecycle:'provisional',contract:parent.contract,contractDigest:parent.contractDigest,workspace,notes:[],revision:1,changeProposalId:stored.id},id);
        captureSourceRevision(this.c,child);
        this.c.store.event(parent.projectId,'experiment.created',{id,parentId:parent.id,changeProposalId:stored.id});return child;
    }
    readFile(actor: Actor, id: string, path: string) { return readText(this.get(actor, id).workspace, path); }
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
            const result = writeText(e.workspace, path, content, expectedDigest, this.c.store);
            const revised=this.c.store.update<Experiment>('experiment', id, e.version, { revision: e.revision + 1 });
            captureSourceRevision(this.c,revised);
            this.c.store.event(e.projectId, 'experiment.revised', { id, path });
            return result;
        });
    }
    note(actor: Actor, id: string, content: string) { userOnly(actor); const e = this.get(actor, id); assertProjectWritable(this.c.store,e.projectId!); ensure(e.lifecycle!=='archived','EXPERIMENT_ARCHIVED','归档实验不能增加新备注'); return this.c.store.update<Experiment>('experiment', id, e.version, { notes: [...e.notes, text(content, 'note', 10000)] }); }
}
