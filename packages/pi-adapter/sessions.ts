import { assertProjectWritable } from '../policy/lifecycle.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppContext } from '../domain/context.js';
import type { Actor, Session, Message, ModelConfig, Role } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { digest } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
import { object, text, oneOf, integer } from '../contracts/validation.js';
export class SessionService {
    constructor(private c: AppContext) { }
    model(): ModelConfig {
        return this.c.store.maybe<{
            model: ModelConfig;
        }>('app-settings', 'global')?.model ?? { provider: process.env.PI_PROVIDER ?? '', model: process.env.PI_MODEL ?? '', thinking: 'off' };
    }
    configure(actor: Actor, value: unknown) {
        userOnly(actor);
        const x = object(value);
        const model: ModelConfig = { provider: text(x.provider, 'provider', 100), model: text(x.model, 'model', 160), thinking: oneOf(x.thinking ?? 'off', ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'] as const, 'thinking') };
        const old = this.c.store.maybe<{
            model: ModelConfig;
        }>('app-settings', 'global');
        if (old)
            return this.c.store.update('app-settings', 'global', old.version, { model });
        return this.c.store.create('app-settings', null, { model }, 'global');
    }
    get(actor: Actor, id: string) { const s = this.c.store.get<Session>('session', id); scope(actor, s.projectId!); return s; }
    create(actor: Actor, projectId: string, input: unknown, internal?: {
        role: Role;
        teamId?: string;
        taskId?: string;
        workspace?: string;
    }) {
        scope(actor, projectId);
        ensure(actor.type === 'user' || actor.type === 'system', 'PERMISSION_DENIED', '助手会话只能由调度器创建', 403);
        assertProjectWritable(this.c.store,projectId);
        const x = object(input), id = randomUUID();
        const workspace = internal?.workspace ?? join(this.c.dataDir, 'sessions', id, 'workspace');
        mkdirSync(workspace, { recursive: true, mode: 0o700 });
        const s = this.c.store.create<Session>('session', projectId, { title: text(x.title ?? '新研究会话', 'title', 160), role: internal?.role ?? 'coordinator', state: 'idle', workspace, piSessionPath: null, model: this.model(), generation: 0, leaseUntil: 0, ...(internal?.teamId ? { teamId: internal.teamId } : {}), ...(internal?.taskId ? { taskId: internal.taskId } : {}) }, id);
        this.c.store.event(projectId, 'session.created', { sessionId: id, role: s.role });
        return s;
    }
    send(actor: Actor, id: string, value: unknown) {
        userOnly(actor);
        const s = this.get(actor, id), x = object(value);
        ensure(s.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
        ensure(!s.taskId, 'TASK_MESSAGE_REQUIRED', '请通过任务引导发送消息');
        return this.c.store.transaction(() => {
            assertProjectWritable(this.c.store,s.projectId!);
            const msg = this.c.store.create<Message>('message', s.projectId, { sessionId: id, role: 'user', content: text(x.content, 'content', 32000), mode: oneOf(x.mode ?? 'prompt', ['prompt', 'steer', 'follow_up'] as const, 'mode'), status: 'queued' });
            if (s.state !== 'running')
                this.c.store.update<Session>('session', id, s.version, { state: 'queued', lastError: undefined });
            this.c.store.event(s.projectId, 'session.message_queued', { sessionId: id, messageId: msg.id, mode: msg.mode });
            return msg;
        });
    }
    rename(actor: Actor, id: string, title: string, expectedVersion: number) { userOnly(actor); this.get(actor, id); return this.c.store.update<Session>('session', id, expectedVersion, { title: text(title, 'title', 160) }); }
    archive(actor: Actor, id: string, expectedVersion: number) { userOnly(actor); const s = this.get(actor, id); ensure(s.state !== 'running' && !s.taskId, 'SESSION_BUSY', '运行中或任务会话不能归档'); return this.c.store.update<Session>('session', id, expectedVersion, { state: 'archived' }); }
    interrupt(actor: Actor, id: string) {
        userOnly(actor);
        const s = this.get(actor, id);
        return this.c.store.transaction(() => {
            for (const m of this.messages(actor, id).filter(m => (m.role === 'user' || m.origin === 'automation') && ['queued', 'running'].includes(m.status)))
                this.c.store.update<Message>('message', m.id, m.version, { status: 'cancelled' });
            const next = this.c.store.update<Session>('session', id, s.version, { state: 'interrupted', generation: s.generation + 1, leaseUntil: 0 });
            this.c.store.event(s.projectId, 'session.interrupted', { sessionId: id });
            return next;
        });
    }
    messages(actor: Actor, id: string) { const s = this.get(actor, id); return this.c.store.list<Message>('message', s.projectId!).filter(m => m.sessionId === id); }
    /** Host-only persisted input; never masquerades as a user-authored message. */
    automation(id: string, wakeupId: string, content: string) {
        const s = this.c.store.get<Session>('session', id);
        ensure(!s.taskId && s.role === 'coordinator' && !['running', 'archived'].includes(s.state), 'SESSION_BUSY', '主会话不能接收新的自动输入');
        const message = this.c.store.create<Message>('message', s.projectId, { sessionId: id, role: 'system', origin: 'automation', wakeupId,
            content, mode: 'prompt', status: 'queued' });
        this.c.store.update<Session>('session', id, s.version, { state: 'queued', lastError: undefined });
        this.c.store.event(s.projectId, 'session.automation_queued', { sessionId: id, messageId: message.id, wakeupId });
        return message;
    }
    system(id: string, content: string) { const s = this.c.store.get<Session>('session', id); const m = this.c.store.create<Message>('message', s.projectId, { sessionId: id, role: 'system', content, mode: 'follow_up', status: 'completed' }); this.c.store.event(s.projectId, 'session.message_completed', { sessionId: id, messageId: m.id }); return m; }
    /** Host notices are transported as data, never as new system instructions.
     * Delivery is at-least-once until a successful prompt checkpoint is acknowledged. */
    pendingNotices(id: string) {
        const s = this.c.store.get<Session>('session', id);
        let total = 0;
        return this.messages({type: 'system'}, id).filter(m => m.role === 'system' && m.origin !== 'automation' && m.status === 'completed')
            .filter(m => !s.piSessionPath || !this.c.store.maybe('session-context-delivery', digest({sessionId: id, file: s.piSessionPath, messageId: m.id})))
            .filter(m => { if (total >= 64000) return false; total += Math.min(m.content.length, 16000); return true; })
            .map(m => ({id: m.id, content: m.content.slice(0, 16000), truncated: m.content.length > 16000}));
    }
    acknowledgeNotices(id: string, messageIds: string[]) {
        const s = this.c.store.get<Session>('session', id);
        if (!s.piSessionPath) return;
        for (const messageId of messageIds) {
            const m = this.c.store.get<Message>('message', messageId, s.projectId!);
            ensure(m.sessionId === id && m.role === 'system' && m.origin !== 'automation', 'SCOPE_DENIED', '通知不属于此会话', 403);
            const key = digest({sessionId: id, file: s.piSessionPath, messageId});
            if (!this.c.store.maybe('session-context-delivery', key))
                this.c.store.create('session-context-delivery', s.projectId, {sessionId: id, piSessionPath: s.piSessionPath, messageId}, key);
        }
    }
    branch(actor: Actor, id: string, throughMessageId: string) {
        userOnly(actor);
        const original = this.get(actor, id), messages = this.messages(actor, id);
        const index = messages.findIndex(m => m.id === throughMessageId);
        ensure(index >= 0, 'NOT_FOUND', '分支消息不存在', 404);
        return this.c.store.transaction(() => {
            const s = this.create(actor, original.projectId!, { title: original.title + ' · 分支' });
            const branch = this.c.store.update<Session>('session', s.id, s.version, { parentSessionId: id, model: original.model });
            for (const m of messages.slice(0, index + 1))
                this.c.store.create<Message>('message', s.projectId, { sessionId: s.id, role: m.role, content: m.content, mode: m.mode, status: 'completed' });
            this.c.store.event(s.projectId, 'session.branched', { parentId: id, sessionId: s.id, throughMessageId });
            return branch;
        });
    }
    retry(actor: Actor, id: string, messageId: string) { userOnly(actor); const m = this.messages(actor, id).find(m => m.id === messageId); ensure(m && m.role === 'user' && ['failed', 'cancelled'].includes(m.status), 'MESSAGE_NOT_RETRYABLE', '只能重试失败或中断的用户消息'); return this.send(actor, id, { content: m.content, mode: 'prompt' }); }
}
