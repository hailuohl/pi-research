import { sessionCatalog, sessionMessagePage, sessionMessageContent, sessionQueue, canSteerSession } from './session-history.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { object, text, oneOf, integer } from '../contracts/validation.js';
export class SessionService {
    c;
    constructor(c) {
        this.c = c;
    }
    model() {
        return this.c.store.maybe('app-settings', 'global')?.model ?? { provider: process.env.PI_PROVIDER ?? '', model: process.env.PI_MODEL ?? '', thinking: 'off' };
    }
    configure(actor, value) {
        userOnly(actor);
        const x = object(value);
        const model = { provider: text(x.provider, 'provider', 100), model: text(x.model, 'model', 160), thinking: oneOf(x.thinking ?? 'off', ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'], 'thinking') };
        const old = this.c.store.maybe('app-settings', 'global');
        if (old)
            return this.c.store.update('app-settings', 'global', old.version, { model });
        return this.c.store.create('app-settings', null, { model }, 'global');
    }
    get(actor, id) { const s = this.c.store.get('session', id); scope(actor, s.projectId); return s; }
    create(actor, projectId, input, internal) {
        scope(actor, projectId);
        ensure(actor.type === 'user' || actor.type === 'system', 'PERMISSION_DENIED', '助手会话只能由调度器创建', 403);
        assertProjectWritable(this.c.store, projectId);
        const x = object(input), id = randomUUID();
        const workspace = internal?.workspace ? this.c.store.paths.physical(internal.workspace) : join(this.c.dataDir, 'sessions', id, 'workspace');
        mkdirSync(workspace, { recursive: true, mode: 0o700 });
        const s = this.c.store.create('session', projectId, { title: text(x.title ?? '新研究会话', 'title', 160), role: internal?.role ?? 'coordinator', state: 'idle', workspace: this.c.store.paths.reference(workspace), piSessionPath: null, model: this.model(), generation: 0, leaseUntil: 0, ...(internal?.teamId ? { teamId: internal.teamId } : {}), ...(internal?.taskId ? { taskId: internal.taskId } : {}) }, id);
        this.c.store.event(projectId, 'session.created', { sessionId: id, role: s.role });
        return s;
    }
    send(actor, id, value) {
        userOnly(actor);
        const x = object(value);
        return this.c.store.transaction(() => {
            const s = this.get(actor, id);
            ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
            ensure(!s.taskId, 'TASK_MESSAGE_REQUIRED', '请通过任务引导发送消息');
            assertProjectWritable(this.c.store, s.projectId);
            const pending = this.c.store.db.prepare("SELECT 1 FROM records WHERE kind='message' AND project_id=? AND json_extract(data,'$.sessionId')=? AND json_extract(data,'$.role')='user' AND json_extract(data,'$.status') IN ('queued','running') LIMIT 1").get(s.projectId, id);
            const mode = oneOf(x.mode ?? (s.state === 'running' || pending ? 'follow_up' : 'prompt'), ['prompt', 'steer', 'follow_up'], 'mode');
            const msg = this.c.store.create('message', s.projectId, { sessionId: id, role: 'user', content: text(x.content, 'content', 32000), mode, status: 'queued', ...(mode === 'steer' ? { steerGeneration: s.generation } : {}) });
            if (s.state !== 'running')
                this.c.store.update('session', id, s.version, { state: 'queued', lastError: undefined });
            this.c.store.event(s.projectId, 'session.message_queued', { sessionId: id, messageId: msg.id, mode });
            return msg;
        });
    }
    queue(actor, id, input = {}) { userOnly(actor); return this.c.store.readSnapshot(() => sessionQueue(this.c.store, this.get(actor, id), input)); }
    queueAction(actor, id, value) {
        userOnly(actor);
        const x = object(value);
        ensure(Object.keys(x).every(k => ['messageId', 'expectedVersion', 'action', 'content'].includes(k)), 'INVALID_INPUT', '队列操作包含未知字段');
        const action = oneOf(x.action, ['edit', 'cancel', 'steer'], 'action'), messageId = text(x.messageId, 'messageId', 100), version = integer(x.expectedVersion, 'expectedVersion', 1);
        ensure(action === 'edit' || x.content === undefined, 'INVALID_INPUT', '只有编辑操作接受正文');
        const content = action === 'edit' ? text(x.content, 'content', 32000) : undefined;
        return this.c.store.transaction(() => {
            const s = this.get(actor, id);
            assertProjectWritable(this.c.store, s.projectId);
            ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
            ensure(!s.taskId, 'TASK_MESSAGE_REQUIRED', '请通过任务引导发送消息');
            const m = this.c.store.get('message', messageId, s.projectId);
            ensure(m.sessionId === id && m.role === 'user' && m.origin !== 'automation' && !m.wakeupId, 'SCOPE_DENIED', '消息不属于此用户队列', 403);
            ensure(m.version === version, 'VERSION_CONFLICT', '消息版本已变化，请刷新队列');
            ensure(m.status === 'queued', 'MESSAGE_STALE', '消息已被领取，不能再修改');
            if (action === 'steer')
                ensure(canSteerSession(this.c.store, s), 'SESSION_BUSY', '当前会话不能接收立即引导');
            const updated = this.c.store.update('message', m.id, m.version, action === 'edit' ? { content } : action === 'cancel' ? { status: 'cancelled', queueRemoved: true } : { mode: 'steer', steerGeneration: s.generation });
            if (action === 'cancel' && s.state === 'queued' && !this.messages(actor, id).some(v => v.status === 'queued'))
                this.c.store.update('session', s.id, s.version, { state: 'idle' });
            this.c.store.event(s.projectId, 'session.queue_changed', { sessionId: id, messageId: m.id, action });
            return updated;
        });
    }
    rename(actor, id, title, expectedVersion) { userOnly(actor); this.get(actor, id); return this.c.store.update('session', id, expectedVersion, { title: text(title, 'title', 160) }); }
    archive(actor, id, expectedVersion) { userOnly(actor); const s = this.get(actor, id); ensure(s.state !== 'running' && !s.taskId, 'SESSION_BUSY', '运行中或任务会话不能归档'); return this.c.store.update('session', id, expectedVersion, { state: 'archived' }); }
    interrupt(actor, id) {
        userOnly(actor);
        const s = this.get(actor, id);
        return this.c.store.transaction(() => {
            for (const m of this.messages(actor, id).filter(m => (m.role === 'user' || m.origin === 'automation') && ['queued', 'running'].includes(m.status)))
                this.c.store.update('message', m.id, m.version, { status: 'cancelled' });
            const next = this.c.store.update('session', id, s.version, { state: 'interrupted', generation: s.generation + 1, leaseUntil: 0 });
            this.c.store.event(s.projectId, 'session.interrupted', { sessionId: id });
            return next;
        });
    }
    messages(actor, id) { const s = this.get(actor, id); return this.c.store.db.prepare("SELECT data FROM records WHERE kind='message' AND json_extract(data,'$.sessionId')=? AND project_id=? ORDER BY rowid").all(id, s.projectId).map(r => JSON.parse(r.data)); }
    list(actor, pid, input = {}) { userOnly(actor); scope(actor, pid); this.c.store.get('project', pid); return this.c.store.readSnapshot(() => sessionCatalog(this.c.store, pid, input)); }
    recent(actor, pid, selectedId) { userOnly(actor); scope(actor, pid); const rows = this.c.store.db.prepare("SELECT data FROM records WHERE kind='session' AND project_id=? ORDER BY rowid DESC LIMIT 30").all(pid).map(r => JSON.parse(r.data)); const selected = selectedId ? this.c.store.get('session', selectedId, pid) : (() => { const row = this.c.store.db.prepare("SELECT data FROM records WHERE kind='session' AND project_id=? AND json_extract(data,'$.role')='coordinator' AND json_extract(data,'$.state')<>'archived' ORDER BY rowid DESC LIMIT 1").get(pid); return row ? JSON.parse(row.data) : undefined; })(); if (selected && !rows.some(s => s.id === selected.id))
        rows.unshift(selected); return rows; }
    messageRead(actor, id, input) { userOnly(actor); return this.c.store.readSnapshot(() => sessionMessageContent(this.c.store, this.get(actor, id), input)); }
    /** Durable messages and the current generation's bounded preview share one read snapshot. */
    view(actor, id, input = {}) {
        userOnly(actor);
        return this.c.store.readSnapshot(() => {
            const session = this.get(actor, id), pid = session.projectId, page = sessionMessagePage(this.c.store, session, input), cursor = this.c.store.eventCursor(pid);
            const queue = sessionQueue(this.c.store, session), pending = { pendingMessages: queue.items, pendingTotal: queue.total, pendingNextCursor: queue.nextCursor };
            const progress = { generation: session.generation, active: session.state === 'running', canSteer: queue.canSteer, content: '', truncated: false, cursor };
            if (!progress.active)
                return { session, ...page, ...pending, progress };
            const start = this.c.store.db.prepare("SELECT seq,json_extract(payload,'$.generation') generation FROM events WHERE project_id=? AND json_extract(payload,'$.sessionId')=? AND type='agent.started' ORDER BY seq DESC LIMIT 1").get(pid, id);
            // Legacy events did not identify an execution generation; never replay them into a new turn.
            if (!start || start.generation !== session.generation)
                return { session, ...page, ...pending, progress };
            const completed = this.c.store.db.prepare("SELECT seq FROM events WHERE project_id=? AND json_extract(payload,'$.sessionId')=? AND type='session.message_completed' AND seq>? AND json_extract(payload,'$.generation')=? ORDER BY seq DESC LIMIT 1").get(pid, id, start.seq, session.generation);
            const rows = this.c.store.db.prepare("SELECT seq,substr(json_extract(payload,'$.text'),1,4000) text,COALESCE(json_extract(payload,'$.truncated'),0) truncated FROM events WHERE project_id=? AND json_extract(payload,'$.sessionId')=? AND type='session.delta' AND seq>? AND json_extract(payload,'$.generation')=? ORDER BY seq DESC LIMIT 257").all(pid, id, completed?.seq ?? start.seq, session.generation);
            const visible = rows.slice(0, 256).reverse(), content = visible.map(r => typeof r.text === 'string' ? r.text : '').join('');
            progress.content = content.slice(-32000);
            progress.truncated = rows.length > 256 || content.length > 32000 || visible.some(r => !!r.truncated);
            // Avoid starting the preview in the middle of a UTF-16 surrogate pair.
            if (progress.content.length && /[\uDC00-\uDFFF]/.test(progress.content[0])) {
                progress.content = progress.content.slice(1);
                progress.truncated = true;
            }
            return { session, ...page, ...pending, progress };
        });
    }
    /** Host-only persisted input; never masquerades as a user-authored message. */
    automation(id, wakeupId, content) {
        const s = this.c.store.get('session', id);
        ensure(!s.taskId && s.role === 'coordinator' && !['running', 'archived'].includes(s.state), 'SESSION_BUSY', '主会话不能接收新的自动输入');
        const message = this.c.store.create('message', s.projectId, { sessionId: id, role: 'system', origin: 'automation', wakeupId,
            content, mode: 'prompt', status: 'queued' });
        this.c.store.update('session', id, s.version, { state: 'queued', lastError: undefined });
        this.c.store.event(s.projectId, 'session.automation_queued', { sessionId: id, messageId: message.id, wakeupId });
        return message;
    }
    system(id, content) { const s = this.c.store.get('session', id); const m = this.c.store.create('message', s.projectId, { sessionId: id, role: 'system', content, mode: 'follow_up', status: 'completed' }); this.c.store.event(s.projectId, 'session.message_completed', { sessionId: id, messageId: m.id }); return m; }
    /** Host notices are transported as data, never as new system instructions.
     * Delivery is at-least-once until a successful prompt checkpoint is acknowledged. */
    pendingNotices(id) {
        const s = this.c.store.get('session', id);
        let total = 0;
        return this.messages({ type: 'system' }, id).filter(m => m.role === 'system' && m.origin !== 'automation' && m.status === 'completed')
            .filter(m => !s.piSessionPath || !this.c.store.maybe('session-context-delivery', digest({ sessionId: id, file: s.piSessionPath, messageId: m.id })))
            .filter(m => { if (total >= 64000)
            return false; total += Math.min(m.content.length, 16000); return true; })
            .map(m => ({ id: m.id, content: m.content.slice(0, 16000), truncated: m.content.length > 16000 }));
    }
    acknowledgeNotices(id, messageIds) {
        const s = this.c.store.get('session', id);
        if (!s.piSessionPath)
            return;
        for (const messageId of messageIds) {
            const m = this.c.store.get('message', messageId, s.projectId);
            ensure(m.sessionId === id && m.role === 'system' && m.origin !== 'automation', 'SCOPE_DENIED', '通知不属于此会话', 403);
            const key = digest({ sessionId: id, file: s.piSessionPath, messageId });
            if (!this.c.store.maybe('session-context-delivery', key))
                this.c.store.create('session-context-delivery', s.projectId, { sessionId: id, piSessionPath: s.piSessionPath, messageId }, key);
        }
    }
    branch(actor, id, throughMessageId) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            const original = this.get(actor, id), messages = this.messages(actor, id);
            const index = messages.findIndex(m => m.id === throughMessageId);
            ensure(index >= 0, 'NOT_FOUND', '分支消息不存在', 404);
            const s = this.create(actor, original.projectId, { title: original.title + ' · 分支' });
            const branch = this.c.store.update('session', s.id, s.version, { parentSessionId: id, model: original.model });
            for (const m of messages.slice(0, index + 1))
                this.c.store.create('message', s.projectId, { sessionId: s.id, role: m.role, content: m.content, mode: m.mode, status: m.queueRemoved ? 'cancelled' : 'completed', ...(m.queueRemoved ? { queueRemoved: true } : {}) });
            this.c.store.event(s.projectId, 'session.branched', { parentId: id, sessionId: s.id, throughMessageId });
            return branch;
        });
    }
    retry(actor, id, messageId) { userOnly(actor); const m = this.messages(actor, id).find(m => m.id === messageId); ensure(m && m.role === 'user' && ['failed', 'cancelled'].includes(m.status), 'MESSAGE_NOT_RETRYABLE', '只能重试失败或中断的用户消息'); return this.send(actor, id, { content: m.content, mode: 'prompt' }); }
}
//# sourceMappingURL=sessions.js.map