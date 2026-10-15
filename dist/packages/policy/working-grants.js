import { assertDiscoveryArtifact } from './discovery-grant-validation.js';
import { randomUUID } from 'node:crypto';
import { join, dirname, basename } from 'node:path';
import { assertRunGrantArtifact } from './run-grant-validation.js';
import { object, integer, strings, text } from '../contracts/validation.js';
import { ensure, asError } from '../domain/errors.js';
import { scope, userOnly } from './permissions.js';
import { assertProjectWritable } from './lifecycle.js';
import { assertAcceptanceCurrent } from '../evidence/acceptance.js';
import { digest, now } from '../storage/store.js';
import { listFiles, readSourceMode, safePath, snapshotDirectory, verifySnapshot } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { validateSourceRevision } from '../workspace/source-access.js';
import { assertWorkspaceReady } from '../workspace/git-service.js';
import { assertWorkingGrantRecord, assertWorkingGrantReference, assertWorkingGrantManifest, assertWorkingGrantDelta, workingGrantReference } from './working-grant-validation.js';
export { assertWorkingGrantJob } from './working-grant-validation.js';
const maxBytes = 2 * 1024 * 1024;
/** Exact private paths and a permanent submission ledger; no model or formal Run permission. */
export class WorkingGrantService {
    app;
    constructor(app) {
        this.app = app;
    }
    session(actor, pid, id) {
        scope(actor, pid);
        const s = this.app.store.get('session', id, pid);
        ensure(s.role === 'coordinator' && !s.taskId && s.sourceRevisionId, 'WORKING_GRANT_SESSION_REQUIRED', '本批仅支持绑定固定来源的独立主协调会话');
        ensure(actor.type === 'user' || actor.type === 'agent' && actor.sessionId === s.id && actor.role === 'coordinator' && !actor.taskId && !actor.wakeupId, 'PERMISSION_DENIED', '只能操作获准的指定私有会话', 403);
        if (actor.type === 'agent')
            ensure(s.state === 'running' && s.generation === actor.generation && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话执行租约已失效');
        return s;
    }
    path(workspace, value) {
        workspace = this.app.store.paths.physical(workspace);
        const path = text(value, 'path', 1000);
        ensure(path.split('/').every(p => p && p !== '.' && p !== '..' && !p.includes(':') && !/[. ]$/.test(p)), 'PATH_DENIED', '授权路径必须是规范精确相对文件路径', 403);
        safePath(workspace, path);
        return path;
    }
    origin(g) {
        validateSourceRevision(this.app.context, g.projectId, g.sourceRevisionId);
        verifySnapshot(this.app.store.paths.physical(g.baselineSnapshot.path), g.baselineSnapshot.files);
        for (const a of g.dataArtifacts) {
            const actual = this.app.store.get('artifact', a.id, g.projectId), bytes = readStableFile(dirname(this.app.store.paths.physical(a.path)), basename(this.app.store.paths.physical(a.path)), 32 * 1024 * 1024);
            assertRunGrantArtifact(this.app.store, g.projectId, actual);
            assertDiscoveryArtifact(this.app.store, g.projectId, actual);
            ensure(actual.path === a.path && actual.digest === a.digest && actual.size === a.size && bytes.length === a.size && digest(bytes) === a.digest, 'ARTIFACT_CORRUPTED', '授权数据内容或来源已改变');
            if (a.sourceAcceptanceId)
                assertAcceptanceCurrent(this.app.store, g.projectId, a.sourceAcceptanceId);
        }
    }
    uses(pid, id) { return this.app.store.list('working-grant-use', pid).filter(u => u.grantId === id); }
    inspect(actor, pid, id) {
        userOnly(actor);
        scope(actor, pid);
        const g = this.app.store.get('working-grant', id, pid), uses = this.uses(pid, id), reasons = [];
        try {
            const checked = assertWorkingGrantRecord(this.app.store, pid, id);
            this.origin(g);
            if (g.state === 'draft')
                ensure(['pending', 'approved'].includes(checked.approval.status), 'APPROVAL_STALE', '授权草案的批准已失效');
            else if (g.state === 'active')
                assertWorkingGrantReference(this.app.store, pid, workingGrantReference(g));
        }
        catch (error) {
            reasons.push(asError(error).code);
        }
        if (g.state === 'revoked')
            reasons.push('WORKING_GRANT_REVOKED');
        const { baselineSnapshot, dataArtifacts, ...fields } = g, remaining = Math.max(0, g.maxTests - uses.length);
        const effectiveState = g.state === 'revoked' ? 'revoked' : reasons.length ? 'stale' : g.state === 'draft' ? 'draft' : Date.now() >= Date.parse(g.expiresAt) ? 'expired' : remaining === 0 ? 'exhausted' : 'active';
        return { ...fields, baselineSnapshot: { digest: baselineSnapshot.digest, files: baselineSnapshot.files }, dataArtifacts: dataArtifacts.map(({ path, ...a }) => a), effectiveState, validity: reasons.length ? 'stale' : 'current', reasons, usage: { limit: g.maxTests, used: uses.length, remaining, unit: 'test-submission' }, uses };
    }
    prepare(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['developmentTaskId', 'editablePaths', 'maxTests', 'maxChangedBytes', 'expiresAt'].includes(k)), 'INVALID_INPUT', '私有实现授权草案包含未知字段', 400);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const template = this.app.store.get('development-task', text(x.developmentTaskId, 'developmentTaskId', 100), pid), m = template.manifest, s = this.session(actor, pid, template.sessionId);
            ensure(!s.workingGrantId && !m.workingGrant, 'WORKING_GRANT_ALREADY_BOUND', '会话已绑定授权；更改范围请使用新的专用会话');
            assertWorkspaceReady(this.app.context, s.id);
            ensure(s.state !== 'archived' && m.sessionId === s.id && m.sourceRevisionId === s.sourceRevisionId && !m.scopeTaskId && !m.scopeAttemptId && m.scopeGeneration === undefined, 'WORKING_GRANT_TEMPLATE_STALE', '模板会话或固定来源已经变化');
            ensure(digest(m) === template.manifestDigest && m.inputSnapshot.digest === template.sourceDigest && digest(m.inputSnapshot.files) === m.inputSnapshot.digest, 'MANIFEST_CORRUPTED', '测试模板摘要不一致');
            validateSourceRevision(this.app.context, pid, s.sourceRevisionId);
            verifySnapshot(this.app.store.paths.physical(m.inputSnapshot.path), m.inputSnapshot.files);
            const current = snapshotDirectory(this.app.store.paths.physical(s.workspace), join(this.app.context.dataDir, 'snapshots'), { legacy: m.inputSnapshot.files.every(f => f.mode === undefined) });
            ensure(current.digest === m.inputSnapshot.digest, 'WORKING_GRANT_TEMPLATE_STALE', '私有工作区已偏离测试模板，请先重新准备');
            const paths = strings(x.editablePaths, 'editablePaths', 32).map(p => this.path(s.workspace, p));
            ensure(paths.length > 0 && new Set(paths.map(p => process.platform === 'win32' ? p.toLowerCase() : p)).size === paths.length, 'INVALID_INPUT', '需要不重复的精确可编辑路径', 400);
            const expiresAt = text(x.expiresAt, 'expiresAt', 50);
            ensure(Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > Date.now() && Date.parse(expiresAt) <= Date.now() + 24 * 60 * 60 * 1000, 'INVALID_INPUT', '授权期限必须在未来24小时内', 400);
            const fixed = { developmentTaskId: template.id, templateManifestDigest: template.manifestDigest, sessionId: s.id, sourceRevisionId: s.sourceRevisionId, model: s.model, baselineSnapshot: m.inputSnapshot, command: m.command, environmentImageDigest: m.environmentImageDigest, dockerContext: m.dockerContext, resources: m.resources, dataArtifacts: m.dataArtifacts, expectedArtifacts: m.expectedArtifacts, editablePaths: paths, maxTests: integer(x.maxTests, 'maxTests', 1, 20), maxChangedBytes: integer(x.maxChangedBytes, 'maxChangedBytes', 1, maxBytes), expiresAt: new Date(expiresAt).toISOString() };
            const id = randomUUID(), approval = this.app.approvals.request(pid, 'working-grant', id, '', 'working-grant.activate', `只授权指定私有文件及最多${fixed.maxTests}次固定开发测试提交；不授权模型、网络、审查、整合或正式Run`), hash = digest({ ...fixed, approvalId: approval.id });
            this.app.store.update('approval', approval.id, approval.version, { digest: hash });
            const g = this.app.store.create('working-grant', pid, { ...fixed, digest: hash, approvalId: approval.id, state: 'draft' }, id);
            this.origin(g);
            this.app.store.event(pid, 'working-grant.prepared', { grantId: id, sessionId: s.id, approvalId: approval.id });
            return this.inspect(actor, pid, id);
        });
    }
    activate(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, pid);
            const { grant: g } = assertWorkingGrantRecord(this.app.store, pid, text(x.grantId, 'grantId', 100)), s = this.session(actor, pid, g.sessionId);
            if (g.state === 'active') {
                ensure(s.workingGrantId === g.id, 'WORKING_GRANT_STALE', '会话授权绑定不符');
                return this.inspect(actor, pid, g.id);
            }
            ensure(g.state === 'draft', 'WORKING_GRANT_REVOKED', '已撤销授权不能重新激活');
            ensure(g.version === integer(x.expectedVersion, 'expectedVersion', 1), 'VERSION_CONFLICT', '授权草案已更新');
            ensure(!s.workingGrantId, 'WORKING_GRANT_ALREADY_BOUND', '会话不能替换已有授权');
            ensure(s.state !== 'archived' && s.sourceRevisionId === g.sourceRevisionId && digest(s.model) === digest(g.model), 'WORKING_GRANT_SCOPE_CHANGED', '会话模型或来源已改变');
            assertWorkspaceReady(this.app.context, s.id);
            ensure(Date.parse(g.expiresAt) > Date.now(), 'WORKING_GRANT_EXPIRED', '授权已到期');
            this.origin(g);
            ensure(snapshotDirectory(this.app.store.paths.physical(s.workspace), join(this.app.context.dataDir, 'snapshots'), { legacy: g.baselineSnapshot.files.every(f => f.mode === undefined) }).digest === g.baselineSnapshot.digest, 'WORKING_GRANT_TEMPLATE_STALE', '批准后私有源码已改变，请重新准备授权');
            this.app.approvals.assert(g.approvalId, pid, g.id, g.digest, 'working-grant.activate');
            this.app.store.update('session', s.id, s.version, { workingGrantId: g.id });
            this.app.store.update('working-grant', g.id, g.version, { state: 'active', activatedAt: now() });
            this.app.store.event(pid, 'working-grant.activated', { grantId: g.id, sessionId: s.id });
            return this.inspect(actor, pid, g.id);
        });
    }
    revoke(actor, pid, value) {
        userOnly(actor);
        scope(actor, pid);
        const x = object(value);
        return this.app.store.transaction(() => { const g = this.app.store.get('working-grant', text(x.grantId, 'grantId', 100), pid); if (g.state === 'revoked')
            return this.inspect(actor, pid, g.id); this.app.store.update('working-grant', g.id, integer(x.expectedVersion, 'expectedVersion', 1), { state: 'revoked', revokedAt: now() }); this.app.approvals.stale(g.id); this.app.store.event(pid, 'working-grant.revoked', { grantId: g.id, sessionId: g.sessionId }); return this.inspect(actor, pid, g.id); });
    }
    /** Host-only binding lookup: caller cannot omit a grant to restore legacy permissions. */
    forPreparation(actor, pid, sessionId) {
        const s = this.app.store.get('session', sessionId, pid);
        if (!s.workingGrantId)
            return undefined;
        this.session(actor, pid, sessionId);
        assertProjectWritable(this.app.store, pid);
        const g = this.app.store.get('working-grant', s.workingGrantId, pid);
        assertWorkingGrantReference(this.app.store, pid, workingGrantReference(g), true);
        this.origin(g);
        return g;
    }
    assertSourcePreparation(actor, pid, sessionId) { const g = this.forPreparation(actor, pid, sessionId); ensure(!g, 'WORKING_GRANT_SOURCE_LOCKED', '已授权的私有会话不能重新准备或替换来源'); }
    workspaceFiles(s, g) {
        let total = 0;
        return listFiles(this.app.store.paths.physical(s.workspace)).map(f => { const bytes = readStableFile(this.app.store.paths.physical(s.workspace), f.path, 64 * 1024 * 1024); total += bytes.length; ensure(total <= 64 * 1024 * 1024, 'SNAPSHOT_TOO_LARGE', '私有源码超过64MiB'); return { path: f.path, size: bytes.length, digest: digest(bytes), ...(g.baselineSnapshot.files.every(b => b.mode === undefined) ? {} : { mode: readSourceMode(this.app.store.paths.physical(s.workspace), f.path) }) }; });
    }
    assertWrite(actor, pid, sessionId, path, content, mode) {
        const g = this.forPreparation(actor, pid, sessionId);
        if (!g)
            return;
        const s = this.app.store.get('session', sessionId, pid), relative = this.path(s.workspace, path);
        ensure(g.editablePaths.includes(relative), 'WORKING_GRANT_PATH_DENIED', '文件不在私有实现授权的精确路径内', 403);
        const files = this.workspaceFiles(s, g), existing = files.find(f => f.path === relative);
        if (content !== undefined) {
            const bytes = Buffer.from(content);
            const value = { path: relative, size: bytes.length, digest: digest(bytes), ...(existing?.mode ? { mode: existing.mode } : g.baselineSnapshot.files.every(f => f.mode === undefined) ? {} : { mode: '100644' }) };
            if (existing)
                files[files.indexOf(existing)] = value;
            else
                files.push(value);
        }
        if (mode !== undefined) {
            ensure(existing, 'NOT_FOUND', '模式修改必须指向现有文件', 404);
            files[files.findIndex(f => f.path === relative)] = { ...existing, mode };
        }
        assertWorkingGrantDelta(g, files);
    }
    assertWorkspace(actor, pid, sessionId) { const g = this.forPreparation(actor, pid, sessionId); if (g)
        assertWorkingGrantDelta(g, this.workspaceFiles(this.app.store.get('session', sessionId, pid), g)); }
    authorizeManifest(g, manifest) { assertWorkingGrantReference(this.app.store, g.projectId, workingGrantReference(g), true); assertWorkingGrantManifest(g, manifest); return workingGrantReference(g); }
    /** Called in the submission transaction after the exact per-test manifest passed validation. */
    consume(pid, task, jobId) {
        const ref = task.manifest.workingGrant;
        if (!ref)
            return;
        const g = assertWorkingGrantReference(this.app.store, pid, ref, true);
        assertWorkingGrantManifest(g, task.manifest);
        const id = digest({ grantId: g.id, developmentTaskId: task.id });
        const old = this.app.store.maybe('working-grant-use', id);
        ensure(!old, 'WORKING_GRANT_USE_MISMATCH', '测试已计次但作业绑定不完整，不能重复提交');
        ensure(this.uses(pid, g.id).length < g.maxTests, 'WORKING_GRANT_EXHAUSTED', '授权的测试提交次数已用完；失败、取消和未知状态不退还次数');
        const use = this.app.store.create('working-grant-use', pid, { grantId: g.id, grantDigest: g.digest, grantApprovalId: g.approvalId, developmentTaskId: task.id, manifestDigest: task.manifestDigest, approvalId: task.grantId, jobId }, id);
        this.app.store.event(pid, 'working-grant.used', { grantId: g.id, developmentTaskId: task.id, jobId, useId: use.id });
        return use;
    }
}
//# sourceMappingURL=working-grants.js.map