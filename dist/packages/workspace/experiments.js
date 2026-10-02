import { captureSourceRevision, validateSourceRevision, copySourceRevision } from './source-access.js';
import { assertOutcomeBoundary } from '../runners/outcome.js';
import { assertProjectWritable, assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { scope, userOnly } from '../policy/permissions.js';
import { object, text, integer } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { listFiles, safePath, readText, writeText, copySourceModes, setSourceModes } from './files.js';
import { verifySnapshot } from './files.js';
import { readStableFile } from './stable-file.js';
import { EXAMPLE_CONTRACT, validateContract } from '../runners/contracts.js';
export class ExperimentService {
    c;
    projects;
    constructor(c, projects) {
        this.c = c;
        this.projects = projects;
    }
    get(actor, id) { const e = this.c.store.get('experiment', id); scope(actor, e.projectId); return e; }
    /** Internal fixed-plan derivation; source is an immutable revision, never a caller filesystem path. */
    createFromRevision(actor, projectId, snapshotId, spec) {
        userOnly(actor);
        scope(actor, projectId);
        assertProjectWritable(this.c.store, projectId);
        const source = validateSourceRevision(this.c, projectId, snapshotId), parent = this.get(actor, source.experimentId);
        ensure(parent.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能派生');
        const id = randomUUID(), workspace = join(this.c.dataDir, 'experiments', id, 'source');
        mkdirSync(workspace, { recursive: true, mode: 0o700 });
        copySourceRevision(source, workspace, true, this.c.store.paths);
        if (spec.config !== undefined) {
            const prior = source.snapshot.files.some(f => f.path === 'config.json') ? object(JSON.parse(readStableFile(this.c.store.paths.physical(source.snapshot.path), 'config.json', 1024 * 1024).toString('utf8'))) : {};
            writeFileSync(join(workspace, 'config.json'), JSON.stringify({ ...prior, ...object(spec.config) }, null, 2), { mode: 0o600 });
        }
        const child = this.c.store.create('experiment', projectId, { title: text(spec.title, 'title', 200), hypothesis: text(spec.hypothesis, 'hypothesis', 10000), parentId: parent.id, lifecycle: 'provisional', contract: parent.contract, contractDigest: parent.contractDigest, workspace: this.c.store.paths.reference(workspace), notes: [], revision: 1 }, id);
        captureSourceRevision(this.c, child);
        this.c.store.event(projectId, 'experiment.created', { id, parentId: parent.id, parentSourceRevisionId: source.id });
        return child;
    }
    create(actor, projectId, input) {
        scope(actor, projectId);
        const x = object(input);
        ensure(x.expectedParentRevision === undefined || !!x.parentId, 'INVALID_INPUT', 'expectedParentRevision需要parentId');
        return this.c.store.transaction(() => {
            assertProjectWritable(this.c.store, projectId);
            const p = this.projects.get(actor, projectId);
            const parent = x.parentId ? this.c.store.get('experiment', text(x.parentId, 'parentId'), projectId) : undefined;
            if (parent) {
                ensure(parent.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能派生新源码');
                assertExperimentSourceCurrent(this.c.store, parent);
            }
            if (x.expectedParentRevision !== undefined)
                ensure(parent.revision === integer(x.expectedParentRevision, 'expectedParentRevision', 1), 'EXPERIMENT_REVISION_CHANGED', '父实验修订已变化，请重新读取配置再准备候选');
            const contract = parent ? parent.contract : x.contract ? validateContract(x.contract) : structuredClone(EXAMPLE_CONTRACT);
            if (parent && x.contract)
                ensure(digest(x.contract) === parent.contractDigest, 'CONTRACT_CHANGED', '子实验必须继承固定运行契约', 400);
            const id = randomUUID(), workspace = join(this.c.dataDir, 'experiments', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            const source = this.c.store.paths.physical(parent?.workspace ?? p.workspace);
            for (const f of listFiles(source)) {
                ensure(f.size <= 16 * 1024 * 1024, 'FILE_TOO_LARGE', '请独立版本化大型数据集', 413);
                const dest = safePath(workspace, f.path);
                mkdirSync(dirname(dest), { recursive: true });
                writeFileSync(dest, readFileSync(safePath(source, f.path)), { mode: 0o600 });
            }
            copySourceModes(source, workspace, listFiles(source));
            if (x.config !== undefined) {
                object(x.config);
                writeFileSync(join(workspace, 'config.json'), JSON.stringify(x.config, null, 2), { mode: 0o600 });
            }
            const e = this.c.store.create('experiment', projectId, { title: text(x.title, 'title', 200), hypothesis: text(x.hypothesis ?? '尚未填写假设', 'hypothesis', 10000), parentId: parent?.id ?? null, lifecycle: 'provisional', contract, contractDigest: digest(contract), workspace: this.c.store.paths.reference(workspace), notes: [], revision: 1 }, id);
            captureSourceRevision(this.c, e);
            this.c.store.event(projectId, 'experiment.created', { id, parentId: e.parentId });
            return e;
        });
    }
    /** Host-only integration of a fixed proposal; never takes caller-supplied filesystem paths. */
    createApprovedChild(actor, proposal) {
        userOnly(actor);
        const stored = this.c.store.get('change-proposal', proposal.id);
        ensure(stored.digest === proposal.digest && stored.candidateSnapshot.digest === proposal.candidateSnapshot.digest, 'CHANGE_PROPOSAL_CORRUPTED', '提案记录不一致');
        const p = this.c.store.get('approval', stored.approvalId);
        ensure(p.status === 'approved' && p.digest === stored.digest && p.scope === 'change.integrate' && p.subjectId === stored.id, 'APPROVAL_REQUIRED', '需要整合批准');
        const parent = this.get(actor, stored.baseExperimentId), snapshot = stored.candidateSnapshot;
        assertProjectWritable(this.c.store, parent.projectId);
        assertExperimentSourceCurrent(this.c.store, parent);
        verifySnapshot(this.c.store.paths.physical(snapshot.path), snapshot.files);
        const id = randomUUID(), workspace = join(this.c.dataDir, 'experiments', id, 'source');
        mkdirSync(workspace, { recursive: true, mode: 0o700 });
        for (const f of snapshot.files) {
            const dest = safePath(workspace, f.path);
            mkdirSync(dirname(dest), { recursive: true });
            const bytes = readStableFile(this.c.store.paths.physical(snapshot.path), f.path, 64 * 1024 * 1024);
            ensure(digest(bytes) === f.digest && bytes.length === f.size, 'SNAPSHOT_CORRUPTED', '复制的字节与批准的快照不一致');
            writeFileSync(dest, bytes, { mode: 0o600 });
        }
        setSourceModes(workspace, snapshot.files);
        const child = this.c.store.create('experiment', parent.projectId, { title: stored.title, hypothesis: stored.hypothesis, parentId: parent.id, lifecycle: 'provisional', contract: parent.contract, contractDigest: parent.contractDigest, workspace: this.c.store.paths.reference(workspace), notes: [], revision: 1, changeProposalId: stored.id }, id);
        captureSourceRevision(this.c, child);
        this.c.store.event(parent.projectId, 'experiment.created', { id, parentId: parent.id, changeProposalId: stored.id });
        return child;
    }
    readFile(actor, id, path) { return readText(this.c.store.paths.physical(this.get(actor, id).workspace), path); }
    writeFile(actor, id, path, content, expectedDigest, expectedVersion) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const e = this.get(actor, id);
            assertProjectWritable(this.c.store, e.projectId);
            assertExperimentSourceCurrent(this.c.store, e);
            ensure(e.lifecycle === 'provisional', 'EXPERIMENT_FROZEN', '已获得结果的节点不可修改，请派生子实验');
            assertOutcomeBoundary(this.c.store, e, true);
            ensure(e.version === expectedVersion, 'VERSION_CONFLICT', '实验已更新');
            ensure(this.c.store.list('run', e.projectId).filter(r => r.experimentId === id).every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'WORKSPACE_BUSY', '实验仍在执行；请派生新候选而不是修改运行节点');
            captureSourceRevision(this.c, e);
            const result = writeText(this.c.store.paths.physical(e.workspace), path, content, expectedDigest, this.c.store);
            const revised = this.c.store.update('experiment', id, e.version, { revision: e.revision + 1 });
            captureSourceRevision(this.c, revised);
            this.c.store.event(e.projectId, 'experiment.revised', { id, path });
            return result;
        });
    }
    note(actor, id, content) { userOnly(actor); const e = this.get(actor, id); assertProjectWritable(this.c.store, e.projectId); ensure(e.lifecycle !== 'archived', 'EXPERIMENT_ARCHIVED', '归档实验不能增加新备注'); return this.c.store.update('experiment', id, e.version, { notes: [...e.notes, text(content, 'note', 10000)] }); }
}
//# sourceMappingURL=experiments.js.map