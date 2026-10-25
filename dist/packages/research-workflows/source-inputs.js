import { assertWorkspaceInput, workspaceSelections } from './workspace-inputs.js';
import { assertAttachmentInput, attachmentInputs, attachmentSelectionFingerprint } from './attachment-inputs.js';
import { randomUUID } from 'node:crypto';
import { dirname, basename, relative, resolve, sep } from 'node:path';
import { DomainError, ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { safePath } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
const MAX_INPUTS = 32, MAX_BYTES = 8 * 1024 * 1024, MAX_FILE = 2 * 1024 * 1024;
const pathKey = (workspace, path) => digest({ workspace, path: process.platform === 'win32' ? path.toLowerCase() : path });
export function assertSourceInputs(store, pid, sessionId, inputs) {
    if (inputs === undefined)
        return;
    ensure(Array.isArray(inputs) && inputs.length <= MAX_INPUTS && new Set(inputs.map(i => pathKey(i.workspace, i.path))).size === inputs.length, 'BRIEF_SOURCE_CORRUPTED', '固定研究输入清单无效');
    let total = 0;
    for (const input of inputs) {
        if (input.sourceKind === 'workspace-snapshot') {
            assertWorkspaceInput(store, pid, sessionId, input);
            continue;
        }
        ensure(input.sourceKind === undefined && input.textSourceId === undefined, 'BRIEF_SOURCE_CORRUPTED', '旧输入不能伪装固定工作区来源');
        if (input.readProtocol === 'fixed-text-v1') {
            assertAttachmentInput(store, pid, sessionId, input);
            continue;
        }
        ensure(input.purpose === undefined && input.documentVersionId === undefined, 'BRIEF_SOURCE_CORRUPTED', '旧研究输入不能改写读取模式');
        const read = store.get('research-input-read', input.readId, pid), artifact = store.get('artifact', input.artifactId, pid);
        ensure(!read.blockedReason && read.sessionId === sessionId && read.workspace === input.workspace && read.path === input.path && read.digest === input.digest && read.size === input.size && artifact.origin === `research-input:${sessionId}` && artifact.digest === input.digest && artifact.size === input.size, 'BRIEF_SOURCE_CORRUPTED', `固定研究输入来源不符：${input.path}`);
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
    recordRead(actor, selectedSession, file, callId) {
        if (actor.type !== 'agent' || !selectedSession || actor.sessionId !== selectedSession.id || actor.role !== 'coordinator' || actor.taskId || actor.attemptId || actor.wakeupId || actor.continuationId || actor.approvalResumeId)
            return;
        // The registry's pre-lock snapshot selects the session, never the read's current anchor.
        const session = this.app.store.get('session', selectedSession.id, actor.projectId);
        ensure(session.projectId === actor.projectId && session.role === 'coordinator' && !session.taskId && !session.teamId, 'TASK_SCOPE_DENIED', '研究输入读取必须属于当前主协调会话', 403);
        ensure(session.state === 'running' && session.generation === actor.generation && session.leaseUntil > Date.now(), 'LEASE_EXPIRED', '研究输入读取的主会话租约已失效', 403);
        const project = this.app.store.get('project', session.projectId), root = this.app.store.paths.physical(project.workspace);
        const path = relative(resolve(root), safePath(root, file.path)).split(sep).join('/'), bytes = Buffer.from(file.content);
        const blockedReason = path !== file.path || !path.split('/').every(p => !!p && !/[\x00-\x1f:]/.test(p) && !/[. ]$/.test(p)) ? 'BRIEF_SOURCE_PATH_INVALID' : bytes.length !== file.size || digest(bytes) !== file.digest ? 'BRIEF_SOURCE_ENCODING_INVALID' : undefined;
        this.app.store.create('research-input-read', session.projectId, { sessionId: session.id, workspace: project.workspace, anchorBriefId: session.researchBriefId ?? null, path, digest: file.digest, size: file.size, callId, ...(blockedReason ? { blockedReason } : {}) }, randomUUID());
        return blockedReason ? { sourceInputReadBlockedReason: blockedReason } : undefined;
    }
    collect(session, anchorBriefId, inherited, status = 'ready') {
        assertSourceInputs(this.app.store, session.projectId, session.id, inherited);
        const inputs = new Map(inherited.map(i => [pathKey(i.workspace, i.path), { ...i }]));
        const reads = new Map();
        for (const read of this.app.store.list('research-input-read', session.projectId))
            if (read.sessionId === session.id && read.anchorBriefId === anchorBriefId)
                reads.set(pathKey(read.workspace, read.path), read);
        const project = this.app.store.get('project', session.projectId);
        const selections = workspaceSelections(this.app.store, session);
        for (const [key, read] of reads) {
            if (selections.some(s => pathKey(s.workspace, s.path) === key))
                continue;
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
            if (old && old.digest === read.digest && old.size === read.size)
                continue;
            inputs.set(key, { path: read.path, workspace: read.workspace, digest: read.digest, size: read.size, readId: read.id, bytes });
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
    selectionFingerprint(session) { const attachments = attachmentSelectionFingerprint(this.app.store, session), workspace = workspaceSelections(this.app.store, session); return workspace.length ? [...attachments, ...workspace.map(s => ({ sourceKind: 'workspace-snapshot', ...s }))] : attachments; }
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
}
//# sourceMappingURL=source-inputs.js.map