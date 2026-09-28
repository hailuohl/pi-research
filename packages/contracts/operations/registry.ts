import {digest} from '../../storage/store.js';
import {routePaperId} from '../../connectors/contracts.js';
import type {ResearchApp} from '../../research-app.js';
import type {Actor, Session, Row, Task, TaskAttempt, Project} from '../../domain/types.js';
import {ensure} from '../../domain/errors.js';
import {text, object} from '../validation.js';
import {scope, toolAllowed, AUTOMATION_TOOLS} from '../../policy/permissions.js';
import {assertProjectWritable} from '../../policy/lifecycle.js';
import {readText, writeText} from '../../workspace/files.js';
import {INPUT_SCHEMAS} from './inputs.js';
import {OUTPUT_SCHEMAS} from './outputs.js';
import {validateSchema, type JsonSchema} from './schema.js';

export interface OperationScope {
    projectId: string;
    sessionId?: string;
    idempotencyKey?: string;
    signal?: AbortSignal;
    /** Only trusted legacy adapters provide these, never request JSON. */
    legacy?: {scope: string; input: unknown};
}
interface OperationContext extends OperationScope {
    app: ResearchApp;
    actor: Actor;
    session?: Row<Session>;
    validate: () => void;
}
export interface OperationSpec {
    id: string;
    inputSchema: JsonSchema;
    outputSchema: JsonSchema;
    idempotencyPolicy: 'read-only' | 'key-required';
    asynchronous?: boolean;
    authorize: (context: OperationContext, input: Record<string, unknown>) => void;
    preconditions: (context: OperationContext, input: Record<string, unknown>) => void;
    execute: (context: OperationContext, input: Record<string, unknown>) => unknown;
}
const recordScope = (kind: string, field: string) => (c: OperationContext, x: Record<string, unknown>) => { c.app.store.get(kind, x[field] as string, c.projectId); };
const workspaceScope = (c: OperationContext, x: Record<string, unknown>) => {
    if (x.source === 'project') {
        ensure(c.actor.type === 'user' || c.session?.role === 'coordinator', 'SCOPE_DENIED', '助手只能访问自己的工作区', 403);
    } else ensure(c.session, 'SESSION_REQUIRED', '需要指定项目内的会话工作区', 400);
};
const noPrecondition = () => {};
const make = (id: string, definition: Omit<OperationSpec, 'id' | 'inputSchema' | 'outputSchema'>): OperationSpec => ({id, inputSchema: INPUT_SCHEMAS[id as keyof typeof INPUT_SCHEMAS], outputSchema: OUTPUT_SCHEMAS[id as keyof typeof OUTPUT_SCHEMAS], ...definition});
function paperReplay(c: OperationContext, x: Record<string, unknown>) {
    const target = routePaperId(x.id, x.source), serviceScope = `connector-paper:${c.projectId}:${c.actor.sessionId ?? 'user'}:${c.actor.attemptId ?? 'root'}`;
    const preferred = c.actor.type === 'agent' ? `${c.session!.id}:${c.idempotencyKey}` : c.idempotencyKey!;
    const keys = [...new Set([preferred, ...(c.actor.type === 'user' ? [`http:${c.idempotencyKey}`] : [])])];
    const cached = keys.map(key => ({key, result: c.app.store.operationResult<unknown>(serviceScope, key, target)})).filter(entry => entry.result.found);
    ensure(new Set(cached.map(entry => entry.result.found && digest(entry.result.value))).size <= 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本已有不同论文读取结果，需人工核对');

    return {key: cached[0]?.key ?? preferred, completed: cached.length > 0};
}
const SPECS: OperationSpec[] = [
    make('run_prepare', {idempotencyPolicy: 'key-required', authorize: recordScope('experiment', 'experimentId'), preconditions: noPrecondition,
        execute: (c, x) => c.app.runs.prepare(c.actor, x.experimentId as string)}),
    make('run_submit', {idempotencyPolicy: 'key-required', authorize: recordScope('run-intent', 'intentId'), preconditions: noPrecondition,
        execute: (c, x) => c.app.runs.submit(c.actor, x.intentId as string)}),
    make('workspace_read', {idempotencyPolicy: 'read-only', authorize: workspaceScope, preconditions: noPrecondition,
        execute: (c, x) => x.source === 'project' ? c.app.projects.readFile(c.actor, c.projectId, x.path as string) : readText(c.session!.workspace, x.path as string)}),
    make('workspace_write', {idempotencyPolicy: 'key-required', authorize: (c, x) => {
        workspaceScope(c, x);
        ensure(c.actor.type === 'user' || x.source !== 'project', 'SCOPE_DENIED', '不能通过助手写入项目共享工作区', 403);
    }, preconditions: (c, x) => {
        assertProjectWritable(c.app.store, c.projectId);
        if (x.source !== 'project') ensure(c.session!.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');
    }, execute: (c, x) => x.source === 'project'
        ? c.app.projects.writeFile(c.actor, c.projectId, x.path as string, x.content as string, x.expectedDigest as string | null)
        : writeText(c.session!.workspace, x.path as string, x.content as string, x.expectedDigest as string | null)}),
    make('change_proposal_prepare', {idempotencyPolicy: 'key-required', authorize: recordScope('experiment', 'baseExperimentId'), preconditions: noPrecondition,
        execute: (c, x) => c.app.changes.prepare(c.actor, c.projectId, x)}),
    make('task_result_submit', {idempotencyPolicy: 'key-required', authorize: c => {
        ensure(c.actor.type === 'agent' && c.actor.taskId && c.actor.attemptId, 'PERMISSION_DENIED', '需要宿主派发的任务身份', 403);
    }, preconditions: noPrecondition, execute: (c, x) => c.app.teams.submit(c.actor, x)}),
    make('paper_read', {idempotencyPolicy: 'key-required', asynchronous: true, authorize: noPrecondition, preconditions: noPrecondition,
        execute: (c, x) => {
            return c.app.connectors.paper(c.actor, c.projectId, x, paperReplay(c, x).key, c.validate, c.signal);
        }}),
];

/** One domain boundary for the migrated HTTP, CLI and Pi actions. */
export class OperationRegistry {
    private pending = new Map<string, {hash: string; promise: Promise<unknown>}>();
    constructor(private app: ResearchApp) {}
    has(id: string) { return SPECS.some(spec => spec.id === id); }
    specs() { return SPECS.map(({id, inputSchema, outputSchema, idempotencyPolicy}) => ({id, inputSchema, outputSchema, idempotencyPolicy})); }
    /** Identity and fencing still apply to completed-call replay. */
    agentIdentity(actor: Actor, name: string) {
        ensure(actor.type === 'agent' && actor.sessionId && actor.projectId, 'PERMISSION_DENIED', '需要宿主派发的 Agent 身份', 403);
        const s = this.app.sessions.get(actor, actor.sessionId);
        ensure(s.role === actor.role && s.projectId === actor.projectId && s.taskId === actor.taskId, 'SCOPE_DENIED', '角色或任务与会话归属不一致', 403);
        toolAllowed(actor, name);
        if (actor.wakeupId) {
            ensure(AUTOMATION_TOOLS.includes(name), 'AUTOMATION_TOOL_DENIED', '自动分析不能执行计算、修改工作区、批准或继续委派', 403);
            const w = this.app.wakeups.get(actor, actor.wakeupId);
            ensure(w.rootSessionId === s.id && w.generation === actor.generation, 'SCOPE_DENIED', '通知与会话执行不匹配', 403);
        }
        ensure(s.state !== 'archived' && !this.app.store.get<Project>('project', s.projectId!).archived, 'SCOPE_DENIED', '归档项目或会话不可由 Agent 继续访问', 403);
        if (actor.taskId) {
            ensure(actor.attemptId, 'PERMISSION_DENIED', '缺少任务尝试身份', 403);
            const t = this.app.store.get<Task>('task', actor.taskId, actor.projectId), a = this.app.store.get<TaskAttempt>('task-attempt', actor.attemptId, actor.projectId);
            ensure(t.execution !== 'superseded', 'TASK_INPUT_STALE', '任务需求已失效');
            ensure(t.attemptId === a.id && a.sessionId === s.id && a.taskId === t.id && a.generation === actor.generation && t.generation === actor.generation, 'LEASE_EXPIRED', '任务尝试已被替代');
        } else ensure(s.generation === actor.generation, 'LEASE_EXPIRED', '旧 Worker 已失去会话写入权');
        return s;
    }
    authorizeAgent(actor: Actor, name: string) {
        const s = this.agentIdentity(actor, name);
        if (actor.wakeupId) this.app.wakeups.assertActive(actor);
        if (actor.taskId) this.app.teams.active(actor);
        else ensure(s.state === 'running' && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话已中止或租约过期');
        return s;
    }
    execute(actor: Actor, id: string, raw: unknown, options: OperationScope): unknown {
        const spec = SPECS.find(item => item.id === id);
        ensure(spec, 'OPERATION_NOT_FOUND', '领域操作不存在', 404);
        let session = actor.type === 'agent' ? this.agentIdentity(actor, id) : undefined;
        validateSchema(spec.inputSchema, raw);
        const input = object(raw), pid = text(options.projectId, 'projectId', 100);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '操作需要用户或宿主派发的 Agent 身份', 403);
        scope(actor, pid);
        this.app.store.get('project', pid);
        if (options.sessionId) {
            const selected = this.app.store.get<Session>('session', text(options.sessionId, 'sessionId', 100), pid);
            ensure(!session || selected.id === session.id, 'SCOPE_DENIED', '不能切换 Agent 的会话工作区', 403);
            session = selected;
        }
        const key = options.idempotencyKey;
        const cached = actor.type === 'agent' || spec.idempotencyPolicy === 'key-required';
        if (cached) ensure(typeof key === 'string' && key.trim() && key.length <= 200, 'OPERATION_ID_REQUIRED', '写操作需要 Idempotency-Key', 400);
        const context: OperationContext = {...options, app: this.app, actor, session, validate: () => {
            ensure(!options.signal?.aborted, 'CONNECTOR_CANCELLED', '连接请求已取消或超时', 409);
            if (actor.type === 'agent') this.authorizeAgent(actor, id);
            else assertProjectWritable(this.app.store, pid);
        }};
        spec.authorize(context, input);
        const workspaceId = id.startsWith('workspace_') && input.source !== 'project' ? session?.id : undefined;
        const request = {name: id, input}, operationScope = actor.type === 'agent' ? `agent:${session!.id}` : `operation:user:${pid}:${workspaceId ?? 'project'}`;
        const output = (value: unknown) => {
            // Validate the wire value: optional undefined properties are omitted by all transports.
            const result: unknown = JSON.parse(JSON.stringify(value));
            validateSchema(spec.outputSchema, result, 'output');
            return result;
        };
        const aliases: {scope: string; input: unknown}[] = options.legacy ? [options.legacy] : [];
        if (!options.legacy && actor.type === 'user') {
            let path: string | undefined, body: unknown;
            if (id === 'run_prepare') { path = '/run-intents'; body = input; }
            if (id === 'run_submit') { path = `/run-intents/${input.intentId}/submit`; body = {}; }
            if (id === 'change_proposal_prepare') { path = '/change-proposals'; body = {projectId: pid, ...input}; }
            if (id === 'workspace_write' && input.source === 'project') { path = `/projects/${pid}/files`; const {source, ...rest} = input; body = rest; }
            if (path) for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) aliases.push({scope: `${method}:${path}`, input: {body, query: ''}});
        }
        const lookup = () => {
            const previous = !cached ? {found: false as const} : actor.type === 'agent'
                ? this.app.store.agentOperationResult<unknown>(session!.id, key!, request)
                : this.app.store.operationResult<unknown>(operationScope, key!, request);
            const history = aliases.map(alias => this.app.store.operationResult<unknown>(alias.scope, key!, alias.input));
            const found = [previous, ...history].filter((entry): entry is {found: true; value: unknown} => entry.found);
            ensure(new Set(found.map(entry => digest(entry.value))).size <= 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本存在不同幂等结果，禁止重复执行');
            return found[0];
        };
        const save = (value: unknown) => {
            const result = output(value);
            const write = () => cached ? this.app.store.operation(operationScope, key!, request, () => result) : result;
            return options.legacy ? this.app.store.operation(options.legacy.scope, key!, options.legacy.input, write) : write();
        };
        const invoke = () => {
            if (actor.type === 'agent') this.authorizeAgent(actor, id);
            spec.preconditions(context, input);
            return spec.execute(context, input);
        };
        if (spec.asynchronous) {
            context.validate();
            const hash = digest(request), pendingId = digest({scope: operationScope, key});
            const inFlight = this.pending.get(pendingId);
            if (inFlight) {
                ensure(inFlight.hash === hash, 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                context.validate();
                return inFlight.promise.then(value => { context.validate(); return value; });
            }
            let reserved = false;
            this.app.store.transaction(() => {
                if (lookup()) return;
                const prior = this.app.store.maybe<{hash: string}>('operation-pending', pendingId);
                if (prior) {
                    ensure(prior.hash === hash, 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                    // A committed connector receipt proves the external read finished before a crash.
                    ensure(id === 'paper_read' && paperReplay(context, input).completed, 'OPERATION_IN_PROGRESS', '同键请求尚在执行或上次结果待对账；不会重复发出外部请求');
                    reserved = true;
                    return;
                }
                this.app.store.create('operation-pending', pid, {hash, operation: id}, pendingId);
                reserved = true;
            });
            const clear = () => { if (reserved) this.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('operation-pending', pendingId); };
            const promise = Promise.resolve().then(invoke).then(value => {
                context.validate();
                return this.app.store.transaction(() => { const result = save(value); clear(); return result; });
            }).catch(error => { clear(); throw error; }).finally(() => { this.pending.delete(pendingId); });
            this.pending.set(pendingId, {hash, promise});
            return promise;
        }
        if (!cached) return output(invoke());
        // Recheck under the write lock before invoking: other HTTP/CLI processes share this DB.
        return this.app.store.transaction(() => {
            const previous = lookup();
            if (previous) return save(previous.value);
            const pending = this.app.store.maybe<{hash: string}>('operation-pending', digest({scope: operationScope, key}));
            if (pending) {
                ensure(pending.hash === digest(request), 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                ensure(false, 'OPERATION_IN_PROGRESS', '同键外部操作结果仍待对账');
            }
            const result = save(invoke());
            this.app.store.event(pid, actor.type === 'agent' ? 'tool.executed' : 'operation.executed', {sessionId: session?.id, taskId: actor.taskId, attemptId: actor.attemptId, tool: id, callId: key});
            return result;
        });
    }
}
