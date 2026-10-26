import { assertWorkspaceInput, workspaceSelections, ordinaryWorkspaceReader } from './workspace-inputs.js';
import { assertAttachmentInput, attachmentInputs, attachmentSelectionFingerprint } from './attachment-inputs.js';
import { dirname, basename, relative, resolve, sep } from 'node:path';
import { DomainError, ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { safePath } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { acceptedResearchBrief } from './briefs.js';
import { assertWorkspaceReadBytes, deliverWorkspaceRead, hasWorkspaceCoverage, offerWorkspaceRead, readBinding, recordWorkspaceRead, replayWorkspaceRead } from './workspace-read-delivery.js';
const MAX_INPUTS = 32, MAX_BYTES = 8 * 1024 * 1024, MAX_FILE = 2 * 1024 * 1024;
const pathKey = (workspace, path) => digest({ workspace, path: process.platform === 'win32' ? path.toLowerCase() : path });
function acceptedInputs(store, pid, sessionId, inputs) {
    return store.list('research-brief', pid).some(b => { if (b.rootSessionId !== sessionId || b.sourceInputs === undefined || digest(b.sourceInputs) !== digest(inputs))
        return false; try {
        acceptedResearchBrief(store, pid, sessionId, b.id, false);
        return true;
    }
    catch {
        return false;
    } });
}
export function assertSourceInputs(store, pid, sessionId, inputs, integrity) {
    if (inputs === undefined)
        return;
    ensure(Array.isArray(inputs) && inputs.length <= MAX_INPUTS && new Set(inputs.map(i => pathKey(i.workspace, i.path))).size === inputs.length, 'BRIEF_SOURCE_CORRUPTED', '固定研究输入清单无效');
    let total = 0, legacyAccepted;
    for (const input of inputs) {
        if (input.sourceKind === 'workspace-snapshot') {
            assertWorkspaceInput(store, pid, sessionId, input, integrity);
            continue;
        }
        ensure(input.sourceKind === undefined && input.textSourceId === undefined, 'BRIEF_SOURCE_CORRUPTED', '旧输入不能伪装固定工作区来源');
        if (input.readProtocol === 'fixed-text-v1') {
            assertAttachmentInput(store, pid, sessionId, input, integrity);
            continue;
        }
        ensure(input.purpose === undefined && input.documentVersionId === undefined, 'BRIEF_SOURCE_CORRUPTED', '旧研究输入不能改写读取模式');
        const read = store.get('research-input-read', input.readId, pid), artifact = store.get('artifact', input.artifactId, pid);
        ensure(!read.blockedReason && read.sessionId === sessionId && read.workspace === input.workspace && read.path === input.path && read.digest === input.digest && read.size === input.size && artifact.origin === `research-input:${sessionId}` && artifact.digest === input.digest && artifact.size === input.size, 'BRIEF_SOURCE_CORRUPTED', `固定研究输入来源不符：${input.path}`);
        ensure(read.protocolVersion === 1 ? hasWorkspaceCoverage(store, 'research-input-read', read) : (legacyAccepted ??= acceptedInputs(store, pid, sessionId, inputs)), 'BRIEF_SOURCE_READ_REQUIRED', '研究输入必须来自实际交付或准确已保存历史');
        const physical = store.paths.physical(artifact.path), bytes = readStableFile(dirname(physical), basename(physical), MAX_FILE);
        total += bytes.length;
        ensure(total <= MAX_BYTES && bytes.length === input.size && digest(bytes) === input.digest, 'BRIEF_SOURCE_CORRUPTED', `固定研究输入字节已改变：${input.path}`);
    }
}
export class SourceInputService {
    app;
    constructor(app) {
        this.app = app;
    }
    recordRead(actor, selectedSession, file, callId, requestedBindingId) {
        if (!ordinaryWorkspaceReader(actor) || !selectedSession || actor.sessionId !== selectedSession.id)
            return;
        // The registry's pre-lock snapshot selects the session, never the read's current anchor.
        const session = this.app.store.get('session', selectedSession.id, actor.projectId);
        ensure(session.projectId === actor.projectId && session.role === 'coordinator' && !session.taskId && !session.teamId, 'TASK_SCOPE_DENIED', '研究输入读取必须属于当前主协调会话', 403);
        ensure(session.state === 'running' && session.generation === actor.generation && session.leaseUntil > Date.now(), 'LEASE_EXPIRED', '研究输入读取的主会话租约已失效', 403);
        const project = this.app.store.get('project', session.projectId), root = this.app.store.paths.physical(project.workspace);
        const path = relative(resolve(root), safePath(root, file.path)).split(sep).join('/'), bytes = Buffer.from(file.content);
        const blockedReason = path !== file.path || !path.split('/').every(p => !!p && !/[\x00-\x1f:]/.test(p) && !/[. ]$/.test(p)) ? 'BRIEF_SOURCE_PATH_INVALID' : !file.readProtocol && (bytes.length !== file.size || digest(bytes) !== file.digest) ? 'BRIEF_SOURCE_ENCODING_INVALID' : undefined;
        ensure(!file.readProtocol || !blockedReason, 'BRIEF_SOURCE_PATH_INVALID', '分页需要规范项目相对路径');
        const read = recordWorkspaceRead(this.app, 'research-input-read', actor, session, { sessionId: session.id, workspace: project.workspace, anchorBriefId: session.researchBriefId ?? null, path, digest: file.digest, size: file.size, callId, ...(blockedReason ? { blockedReason } : {}) }, file, requestedBindingId);
        if (!requestedBindingId && !workspaceSelections(this.app.store, session).some(s => pathKey(s.workspace, s.path) === pathKey(project.workspace, path))) {
            const id = digest({ sessionId: session.id, key: pathKey(project.workspace, path) }), old = this.app.store.maybe('research-input-selection', id), value = { sessionId: session.id, workspace: project.workspace, path, bindingId: read.bindingId };
            if (old)
                this.app.store.update('research-input-selection', id, old.version, value);
            else
                this.app.store.create('research-input-selection', session.projectId, value, id);
        }
        return blockedReason ? { sourceInputReadBlockedReason: blockedReason } : { sourceInputReadId: read.id, ...(file.readProtocol ? { readBindingId: read.bindingId } : {}) };
    }
    selections(session) { const fixed = workspaceSelections(this.app.store, session); return this.app.store.list('research-input-selection', session.projectId).filter(s => s.sessionId === session.id && !fixed.some(f => pathKey(f.workspace, f.path) === pathKey(s.workspace, s.path))); }
    collect(session, anchorBriefId, inherited, status = 'ready') {
        assertSourceInputs(this.app.store, session.projectId, session.id, inherited);
        const inputs = new Map(inherited.map(i => [pathKey(i.workspace, i.path), { ...i }]));
        const reads = new Map();
        for (const read of this.app.store.list('research-input-read', session.projectId))
            if (read.sessionId === session.id && read.anchorBriefId === anchorBriefId && !read.protocolVersion && !inherited.some(i => i.readId === read.id))
                reads.set(pathKey(read.workspace, read.path), read);
        for (const selection of this.selections(session)) {
            const read = this.app.store.get('research-input-read', selection.bindingId, session.projectId);
            ensure(read.sessionId === session.id && read.bindingId === read.id && read.workspace === selection.workspace && read.path === selection.path, 'BRIEF_SOURCE_CORRUPTED', '研究输入选择绑定损坏');
            reads.set(pathKey(read.workspace, read.path), read);
        }
        const project = this.app.store.get('project', session.projectId);
        const selections = workspaceSelections(this.app.store, session);
        for (const [key, read] of reads) {
            if (selections.some(s => pathKey(s.workspace, s.path) === key))
                continue;
            if (inherited.some(i => i.readId === read.id && pathKey(i.workspace, i.path) === key))
                continue;
            const delivered = !read.blockedReason && hasWorkspaceCoverage(this.app.store, 'research-input-read', read);
            if (status === 'clarifying' && !delivered)
                continue;
            ensure(delivered, 'BRIEF_SOURCE_READ_REQUIRED', `研究输入需要完整SDK交付，请用新callId重新workspace_read(source=project)：${read.path}`);
            ensure(!read.blockedReason, 'BRIEF_SOURCE_READ_REQUIRED', `研究输入尚未获得完整读取记录，请修复并用规范path、新callId重新workspace_read(source=project)：${read.path} (${read.blockedReason})`);
            ensure(project.workspace === read.workspace, 'BRIEF_SOURCE_CHANGED', `项目输入工作区已变化，请重新workspace_read(source=project)：${read.path}`);
            let bytes;
            try {
                bytes = readStableFile(this.app.store.paths.physical(read.workspace), read.path, MAX_FILE);
            }
            catch {
                throw new DomainError('BRIEF_SOURCE_CHANGED', `研究输入不可读取，请修复后重新workspace_read(source=project)：${read.path}`);
            }
            ensure(bytes.length === read.size && digest(bytes) === read.digest, 'BRIEF_SOURCE_CHANGED', `研究输入已变化，请用新callId重新workspace_read(source=project)：${read.path}`);
            try {
                new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            }
            catch {
                throw new DomainError('BRIEF_SOURCE_ENCODING_INVALID', `研究输入不是UTF-8文本：${read.path}`);
            }
            const old = inputs.get(key);
            ensure(!old?.readProtocol, 'BRIEF_SOURCE_BINDING_CHANGED', '旧workspace读取不能覆盖固定附件输入');
            inputs.set(key, { path: read.path, workspace: read.workspace, digest: read.digest, size: read.size, readId: read.id, ...(old?.artifactId && old.digest === read.digest && old.size === read.size ? { artifactId: old.artifactId } : { bytes }) });
        }
        for (const input of attachmentInputs(this.app.store, session, inherited.filter(i => i.readProtocol === 'fixed-text-v1' && !i.sourceKind).map(i => i.readId), status)) {
            const key = pathKey(input.workspace, input.path), old = inputs.get(key);
            ensure(!old || old.readProtocol === 'fixed-text-v1' && old.documentVersionId === input.documentVersionId, 'BRIEF_SOURCE_BINDING_CHANGED', '固定附件不能覆盖旧workspace输入');
            inputs.set(key, input);
        }
        for (const input of this.app.workspaceInputs.inputs(session, inherited, status)) {
            const key = pathKey(input.workspace, input.path), old = inputs.get(key);
            ensure(!old || !old.readProtocol || old.sourceKind === 'workspace-snapshot', 'BRIEF_SOURCE_BINDING_CHANGED', '工作区快照不能覆盖固定附件身份');
            inputs.set(key, input);
        }
        const result = [...inputs.values()].sort((a, b) => pathKey(a.workspace, a.path).localeCompare(pathKey(b.workspace, b.path)));
        ensure(result.length <= MAX_INPUTS && result.reduce((n, i) => n + (i.readProtocol ? 0 : i.size), 0) <= MAX_BYTES, 'BRIEF_SOURCE_LIMIT', '固定研究输入最多32份、每份2MiB、合计8MiB');
        return result;
    }
    selectionFingerprint(session) { const attachments = attachmentSelectionFingerprint(this.app.store, session), workspace = workspaceSelections(this.app.store, session), legacy = this.selections(session).map(s => ({ sourceKind: 'workspace-legacy', workspace: s.workspace, path: s.path, bindingId: s.bindingId, version: s.version })).sort((a, b) => pathKey(a.workspace, a.path).localeCompare(pathKey(b.workspace, b.path))); return [...attachments, ...workspace.map(s => ({ sourceKind: 'workspace-snapshot', ...s })), ...legacy]; }
    preview(session, anchorBriefId, inherited, status = 'ready') { return this.collect(session, anchorBriefId, inherited, status).map(({ bytes, ...meta }) => meta); }
    previewBytes(session, anchorBriefId, inherited, bytePaths) {
        return this.collect(session, anchorBriefId, inherited).map(input => {
            if (!bytePaths.includes(input.path))
                return { ...input, bytes: undefined, verifiedReference: true };
            if (input.bytes)
                return { ...input, bytes: input.bytes };
            const a = this.app.store.get('artifact', input.artifactId, session.projectId), physical = this.app.store.paths.physical(a.path);
            return { ...input, bytes: readStableFile(dirname(physical), basename(physical), MAX_FILE) };
        });
    }
    freeze(session, anchorBriefId, inherited, status = 'ready') {
        return this.collect(session, anchorBriefId, inherited, status).map(({ bytes, ...meta }) => {
            if (meta.artifactId)
                return meta;
            const prepared = this.app.evidence.prepareArtifact(session.projectId, meta.path.slice(0, 200), bytes, 'text/plain', `research-input:${session.id}`), artifact = this.app.evidence.publishPrepared(session.projectId, prepared);
            return { ...meta, artifactId: artifact.id };
        });
    }
    check(read) { const r = read; if (r.protocolVersion)
        readBinding(this.app.store, 'research-input-read', r); const project = this.app.store.get('project', r.projectId); ensure(!r.blockedReason && project.workspace === r.workspace, 'BRIEF_SOURCE_CHANGED', '项目输入工作区已变化'); assertWorkspaceReadBytes(this.app.store, r); }
    offer(actor, id, callId) { return offerWorkspaceRead(this.app, actor, 'research-input-read', id, callId, r => this.check(r)); }
    deliver(actor, id, callId) { return deliverWorkspaceRead(this.app, actor, 'research-input-read', id, callId, r => this.check(r)); }
    replay(actor, id) { const r = this.app.store.get('research-input-read', id, actor.projectId); ensure(ordinaryWorkspaceReader(actor) && r.sessionId === actor.sessionId, 'TASK_SCOPE_DENIED', '读取凭据不属于当前普通主会话', 403); this.check(r); replayWorkspaceRead(this.app.store, 'research-input-read', id, actor.projectId); }
}
//# sourceMappingURL=source-inputs.js.map