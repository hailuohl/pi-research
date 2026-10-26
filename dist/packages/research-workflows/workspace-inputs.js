import { verifySourceBlob } from '../storage/source-integrity.js';
import { randomUUID } from 'node:crypto';
import { open } from 'node:fs/promises';
import { lstatSync, constants } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { safePath } from '../workspace/files.js';
import { interactiveCoordinator } from '../policy/permissions.js';
import { assertProjectReadable } from '../policy/lifecycle.js';
import { filePolicy } from '../storage/file-policy.js';
import { prepareStreamedText, publishStreamedText, verifyStreamedBlob, readStreamedText, assertStreamedIndex } from '../storage/streamed-blob.js';
import { documentPublication } from '../storage/document-publication.js';
import { ARTIFACT_TEXT_PREPARE_TIMEOUT_MS } from '../contracts/tool-budgets.js';
export function ordinaryWorkspaceReader(actor) { return actor.type === 'agent' && actor.role === 'coordinator' && !actor.taskId && !actor.attemptId && !actor.wakeupId && !actor.continuationId && !actor.approvalResumeId && !actor.workflowContinuationId && !actor.approvalNoticeMessageId && !actor.workflowNoticeMessageId && !actor.permissionActionId; }
export const workspacePathKey = (workspace, path) => digest({ workspace, path: process.platform === 'win32' ? path.toLowerCase() : path });
const blob = (a) => ({ blobPath: a.path, digest: a.digest, size: a.size });
function fixed(store, pid, b) {
    const a = store.get('artifact', b.artifactId, pid), source = store.get('artifact-text-source', b.textSourceId, pid), index = store.get('artifact', source.indexArtifactId, pid);
    ensure(a.origin === `workspace-snapshot:${b.sessionId}` && !a.taskId && !a.runId && !a.wakeupId && !a.discoveryGrant && a.digest === b.sourceDigest && a.size === b.size && source.artifactId === a.id && source.sourceDigest === a.digest && source.size === a.size && index.origin === 'artifact:text-index' && !index.taskId && !index.runId && !index.wakeupId && !index.discoveryGrant, 'BRIEF_SOURCE_CORRUPTED', '工作区固定来源绑定无效');
    return { source: blob(a), indexBlob: blob(index), index: source.index };
}
function coverage(store, pid, b) {
    const reads = store.list('artifact-text-read', pid).filter(r => r.artifactId === b.artifactId && r.textSourceId === b.textSourceId && r.sourceDigest === b.sourceDigest && r.delivery === 'delivered' && r.workspaceInputEligible === true && !r.replayed && r.actor.type === 'agent' && r.actor.projectId === pid && r.actor.sessionId === b.sessionId && r.actor.role === 'coordinator' && !r.actor.taskId && !r.actor.attemptId && !r.actor.wakeupId && !r.actor.continuationId && !r.actor.approvalResumeId && !r.actor.workflowContinuationId).sort((a, b) => a.cursor - b.cursor);
    if (b.size === 0)
        return b.purpose === 'whole-text' && reads.some(r => r.cursor === 0 && r.end === 0 && r.contentDigest === digest(Buffer.alloc(0)));
    const nonempty = reads.filter(r => r.end > r.cursor);
    if (b.purpose === 'dataset-reference')
        return nonempty.length > 0;
    let end = 0;
    for (const r of nonempty) {
        if (r.cursor > end)
            break;
        end = Math.max(end, r.end);
    }
    return end === b.size;
}
export function assertWorkspaceInput(store, pid, sessionId, input, integrity) {
    const b = store.get('workspace-input-binding', input.readId, pid);
    ensure(b.sessionId === sessionId && input.sourceKind === 'workspace-snapshot' && input.readProtocol === 'fixed-text-v1' && input.documentVersionId === undefined && input.purpose === b.purpose && input.artifactId === b.artifactId && input.textSourceId === b.textSourceId && input.path === b.path && input.workspace === b.workspace && input.digest === b.sourceDigest && input.size === b.size, 'BRIEF_SOURCE_CORRUPTED', '工作区固定输入与不可变绑定不符');
    ensure(coverage(store, pid, b), 'BRIEF_SOURCE_READ_REQUIRED', b.purpose === 'whole-text' ? 'whole-text需要完整SDK已送达覆盖；空原件也需要EOF回执' : 'dataset-reference需要SDK已送达的非空检查页');
    const f = fixed(store, pid, b);
    verifySourceBlob(store, f.source, integrity);
    verifySourceBlob(store, f.indexBlob, integrity);
    if (integrity)
        assertStreamedIndex(store, f.source, f.indexBlob, f.index);
    else
        readStreamedText(store, f.source, f.indexBlob, f.index, 0, 4);
}
export function workspaceSelections(store, session) { return store.list('workspace-input-selection', session.projectId).filter(s => s.sessionId === session.id).map(s => { const b = store.get('workspace-input-binding', s.bindingId, session.projectId); ensure(b.sessionId === s.sessionId && b.workspace === s.workspace && b.path === s.path, 'BRIEF_SOURCE_CORRUPTED', '工作区选择归属不符'); return { workspace: s.workspace, path: s.path, bindingId: b.id, version: s.version, purpose: b.purpose, artifactId: b.artifactId, sourceDigest: b.sourceDigest, size: b.size, textSourceId: b.textSourceId }; }).sort((a, b) => workspacePathKey(a.workspace, a.path).localeCompare(workspacePathKey(b.workspace, b.path))); }
export class WorkspaceInputService {
    app;
    constructor(app) {
        this.app = app;
    }
    authorize(actor, pid, sessionId) { const { app } = this; ensure(ordinaryWorkspaceReader(actor), 'TASK_SCOPE_DENIED', '固定工作区输入仅支持普通主协调会话', 403); const s = app.operations.authorizeAgent(actor, 'workspace_text_prepare'); ensure(s.id === sessionId, 'SCOPE_DENIED', '不能切换工作区输入会话', 403); interactiveCoordinator(actor, pid, s); assertProjectReadable(app.store, pid, actor); if (actor.permission)
        app.sessionPermissions.assert(actor.permission, false); return s; }
    replay(actor, pid, sessionId, value, signal) { const deadline = Date.now() + ARTIFACT_TEXT_PREPARE_TIMEOUT_MS, budget = () => { ensure(Date.now() < deadline, 'ARTIFACT_TEXT_PREPARE_TIMEOUT', '固定工作区回放超过服务期限', 409); ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '固定工作区回放已取消', 409); }; budget(); this.authorize(actor, pid, sessionId); const p = value, b = this.app.store.get('workspace-input-binding', p.workspaceBindingId, pid); ensure(b.sessionId === sessionId, 'SCOPE_DENIED', '快照属于另一会话', 403); const f = fixed(this.app.store, pid, b); verifyStreamedBlob(this.app.store, f.source, budget); verifyStreamedBlob(this.app.store, f.indexBlob, budget); budget(); const result = this.descriptor(actor, pid, b); ensure(digest(result) === digest(value), 'BRIEF_SOURCE_CORRUPTED', '缓存快照描述已改变'); return result; }
    descriptor(actor, pid, b) { return { ...this.app.artifactTexts.descriptor(actor, pid, b), sourceKind: 'workspace-snapshot', workspace: b.workspace, path: b.path, purpose: b.purpose, workspaceBindingId: b.id }; }
    async prepare(actor, pid, sessionId, input, key, validate, signal, commitPrepared) {
        const { app } = this, session = this.authorize(actor, pid, sessionId), project = app.store.get('project', pid), permission = actor.permission ?? app.sessionPermissions.capture(sessionId), deadline = Date.now() + ARTIFACT_TEXT_PREPARE_TIMEOUT_MS;
        // Keep the mutable path stable until commit; replay verifies only the immutable snapshot.
        let stablePath;
        const budget = () => { ensure(Date.now() < deadline, 'ARTIFACT_TEXT_PREPARE_TIMEOUT', '固定工作区准备超过服务期限', 409); ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '固定工作区准备已取消', 409); };
        const check = () => { budget(); stablePath?.(); validate(); budget(); this.authorize(actor, pid, sessionId); app.sessionPermissions.assert(permission, false); const current = app.store.get('session', sessionId, pid); ensure((current.researchBriefId ?? null) === (session.researchBriefId ?? null) && app.store.get('project', pid).workspace === project.workspace, 'BRIEF_SOURCE_CHANGED', '准备期间当前研究计划或工作区已改变', 409); };
        check();
        const root = app.store.paths.physical(project.workspace), path = input.path, file = safePath(root, path);
        if (process.platform === 'win32')
            safePath(root, path.toLowerCase());
        ensure(relative(resolve(root), file).split(sep).join('/') === path && path.split('/').every(p => !!p && !/[\x00-\x1f:]/.test(p) && !/[. ]$/.test(p)), 'PATH_DENIED', '需要规范项目相对路径', 403);
        const before = lstatSync(file), max = filePolicy().maxFileBytes;
        ensure(before.isFile(), 'ARTIFACT_NOT_FILE', '只支持普通项目文件', 400);
        ensure(before.size <= max, 'ARTIFACT_TOO_LARGE', '项目文件超过配置大小限制', 413);
        const same = (s) => ensure(s.isFile() && !s.isSymbolicLink() && s.dev === before.dev && s.ino === before.ino && s.size === before.size && s.mtimeMs === before.mtimeMs && s.ctimeMs === before.ctimeMs, 'ARTIFACT_CHANGED', '固定采集期间项目文件改变', 409);
        stablePath = () => same(lstatSync(safePath(root, path)));
        async function* chunks() { check(); const fd = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); try {
            same(await fd.stat());
            check();
            let nextCheckpoint = 1024 * 1024;
            for (let offset = 0; offset < before.size;) {
                budget();
                if (offset >= nextCheckpoint) {
                    check();
                    nextCheckpoint += 1024 * 1024;
                }
                const bytes = Buffer.allocUnsafe(Math.min(64 * 1024, before.size - offset)), r = await fd.read(bytes, 0, bytes.length, offset);
                ensure(r.bytesRead > 0, 'ARTIFACT_CHANGED', '固定采集期间项目文件截断', 409);
                offset += r.bytesRead;
                yield bytes.subarray(0, r.bytesRead);
            }
            check();
            same(await fd.stat());
            same(lstatSync(safePath(root, path)));
            check();
        }
        finally {
            await fd.close();
        } }
        const prepared = await prepareStreamedText(app.store, pid, chunks(), max, budget, true), scope = `workspace-text-prepare:${sessionId}`, request = { path, purpose: input.purpose };
        try {
            const prior = app.store.transaction(() => { check(); const old = app.store.operationResult(scope, key, request); if (old.found)
                return this.replay(actor, pid, sessionId, old.value, signal); const intent = app.store.create('document-blob-publication', pid, prepared.publication, prepared.publication.stagingId); documentPublication(app.store.paths, pid, { ...intent }); check(); });
            if (prior) {
                check();
                return prior;
            }
            check();
            await publishStreamedText(app.store, prepared.publication, budget, check);
            check();
            await prepared.dispose();
            const result = app.store.transaction(() => {
                check();
                const result = app.store.operation(scope, key, request, () => {
                    const artifact = app.evidence.publishPrepared(pid, { title: path.slice(0, 200), mediaType: 'text/plain', origin: `workspace-snapshot:${sessionId}`, path: prepared.blob.blobPath, digest: prepared.blob.digest, size: prepared.blob.size }), index = app.evidence.publishPrepared(pid, { title: 'UTF-8 fixed workspace index', mediaType: 'application/octet-stream', origin: 'artifact:text-index', path: prepared.indexBlob.blobPath, digest: prepared.indexBlob.digest, size: prepared.indexBlob.size }), textSourceId = randomUUID();
                    app.store.create('artifact-text-source', pid, { artifactId: artifact.id, sourceDigest: artifact.digest, size: artifact.size, indexArtifactId: index.id, index: prepared.index }, textSourceId);
                    const binding = app.store.create('workspace-input-binding', pid, { sessionId, anchorBriefId: session.researchBriefId ?? null, workspace: project.workspace, path, purpose: input.purpose, artifactId: artifact.id, sourceDigest: artifact.digest, size: artifact.size, textSourceId }), selectionId = digest({ sessionId, path: workspacePathKey(project.workspace, path) }), selection = app.store.maybe('workspace-input-selection', selectionId);
                    if (selection)
                        app.store.update('workspace-input-selection', selection.id, selection.version, { bindingId: binding.id, path });
                    else
                        app.store.create('workspace-input-selection', pid, { sessionId, workspace: project.workspace, path, bindingId: binding.id }, selectionId);
                    return this.descriptor(actor, pid, binding);
                });
                app.store.db.prepare("DELETE FROM records WHERE kind='document-blob-publication' AND id=? AND project_id=?").run(prepared.publication.stagingId, pid); // The tool receipt and current selection commit atomically.
                check();
                commitPrepared?.(result);
                check();
                return result;
            });
            check();
            return result;
        }
        finally {
            await prepared.dispose();
        }
    }
    inputs(session, inherited, status) {
        const { app } = this, selections = workspaceSelections(app.store, session);
        if (!selections.length)
            return [];
        assertProjectReadable(app.store, session.projectId, { type: 'user' });
        ensure(session.role === 'coordinator' && !session.taskId && !session.teamId && session.state !== 'archived', 'INVALID_ROOT_SESSION', '新的固定输入需要当前主会话', 403);
        return selections.flatMap(s => { const b = app.store.get('workspace-input-binding', s.bindingId, session.projectId); if (status === 'clarifying' && !inherited.some(i => i.readId === b.id) && !coverage(app.store, session.projectId, b))
            return []; const input = { sourceKind: 'workspace-snapshot', readProtocol: 'fixed-text-v1', path: b.path, workspace: b.workspace, artifactId: b.artifactId, digest: b.sourceDigest, size: b.size, readId: b.id, textSourceId: b.textSourceId, purpose: b.purpose }; assertWorkspaceInput(app.store, session.projectId, session.id, input); return [input]; });
    }
}
//# sourceMappingURL=workspace-inputs.js.map