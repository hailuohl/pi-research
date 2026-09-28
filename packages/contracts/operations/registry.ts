import {digest} from '../../storage/store.js';
import {routePaperId, parseSearch} from '../../connectors/contracts.js';
import type {ResearchApp} from '../../research-app.js';
import type {Actor, Session, Row, Task, TaskAttempt, Project} from '../../domain/types.js';
import {ensure} from '../../domain/errors.js';
import {text, object, integer} from '../validation.js';
import {scope, toolAllowed, AUTOMATION_TOOLS} from '../../policy/permissions.js';
import {assertProjectWritable} from '../../policy/lifecycle.js';
import {readText, writeText, listFiles} from '../../workspace/files.js';
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
    requiresSession?: boolean;
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

function authorizeRegistered(c: OperationContext, name: string, x: Record<string, unknown>) {
    if (name === 'workspace_list') workspaceScope(c, x);
    if (name === 'text_evidence_search') {
        if (c.actor.type === 'agent') c.app.operations.authorizeAgent(c.actor, name);
        c.app.textEvidence.authorizeSearch(c.actor, c.projectId, x);
    }
    if (name === 'task_context_read')
        ensure(c.actor.type === 'agent' && c.actor.taskId && c.actor.attemptId, 'PERMISSION_DENIED', '需要宿主派发的任务身份', 403);
    if (name === 'task_progress_report') ensure(c.actor.type === 'agent', 'PERMISSION_DENIED', '需要宿主派发的 Agent 身份', 403);
    if (name === 'task_inspect') c.app.store.get('team', c.session?.teamId ?? text(x.teamId, 'teamId', 100), c.projectId);
    if (name === 'task_result_read') {
        const task = c.app.store.get<Task>('task', x.taskId as string, c.projectId);
        ensure(!c.session?.teamId || task.teamId === c.session.teamId, 'SCOPE_DENIED', '任务不属于当前团队', 403);
    }
    if (name.startsWith('campaign_')) {
        const campaign = c.app.campaigns.get(c.actor, x.campaignId as string);
        ensure(campaign.projectId === c.projectId, 'SCOPE_DENIED', '研究活动不属于当前项目', 403);
        c.app.campaigns.coordinator(c.actor, campaign);
        if (c.actor.wakeupId) {
            const w = c.app.wakeups.assertActive(c.actor);
            ensure(w.sourceKind === 'campaign-result' && w.ownerId === campaign.id, 'AUTOMATION_SCOPE_DENIED', '只能分析本次通知所属研究活动', 403);
        }
    }
}
function externalReplay(c: OperationContext, name: string, x: Record<string, unknown>) {
    if (name === 'paper_read') return paperReplay(c, x);
    const discover = name === 'literature_discover';
    const serviceScope = discover ? `connector-search:${c.projectId}:${c.actor.sessionId ?? 'user'}:${c.actor.attemptId ?? 'root'}` : `literature:${c.projectId}`;
    const request = discover ? parseSearch(x) : {projectId: c.projectId, query: x.query, limit: x.limit ?? 8};
    const preferred = c.actor.type === 'agent' ? `${c.session!.id}:${c.idempotencyKey}` : c.idempotencyKey!;
    const keys = [...new Set([preferred, ...(c.actor.type === 'user' ? [`${discover ? 'http' : 'user'}:${c.idempotencyKey}`] : [])])];
    const cached = keys.map(key => ({key, result: c.app.store.operationResult<unknown>(serviceScope, key, request)})).filter(entry => entry.result.found);
    ensure(new Set(cached.map(entry => entry.result.found && digest(entry.result.value))).size <= 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本存在不同检索结果，需人工核对');
    return {key: cached[0]?.key ?? preferred, completed: cached.length > 0};
}

function executeRegistered(c: OperationContext, name: string, x: Record<string, unknown>): unknown {
    const {app, actor, session, projectId: pid} = c;
        const ownOrProject = () => { ensure(!x.source || x.source === 'session' || x.source === 'project' && (session?.role ?? 'coordinator') === 'coordinator', 'SCOPE_DENIED', '助手只能访问自己的工作区', 403); return x.source === 'project' ? app.projects.get(actor, pid).workspace : session!.workspace; };
        if (name.startsWith('campaign_')) {
            const campaignId = text(x.campaignId, 'campaignId', 100);
            if (actor.wakeupId) {
                const w = app.wakeups.assertActive(actor);
                ensure(w.sourceKind === 'campaign-result' && w.ownerId === campaignId, 'AUTOMATION_SCOPE_DENIED', '只能分析本次通知所属研究活动', 403);
            }
            const c = app.campaigns.get(actor, campaignId);
            app.campaigns.coordinator(actor, c);
            if (name === 'campaign_inspect') return { campaign: c, members: app.campaigns.members(actor, c.id), rounds: app.campaigns.rounds(actor, c.id), observations: app.campaigns.observations(actor, c.id), decisions: app.campaigns.decisions(actor, c.id) };
            if (name === 'campaign_enroll') return app.campaigns.enroll(actor, c.id, x);
            if (name === 'campaign_decision_submit') return app.decisions.propose(actor, c.id, x);
        }
        switch (name) {
            case 'text_evidence_search': return app.textEvidence.search(actor,pid,x);
            case 'research_skill_list': return {bundleId:app.skills.bundleId,skills:app.skills.list((session?.role ?? 'coordinator'))};
            case 'research_skill_read': return app.skills.read((session?.role ?? 'coordinator'),text(x.skillId,'skillId',100),x.resource===undefined?undefined:text(x.resource,'resource',200));
            case 'connector_status': return app.connectors.settings(actor,pid);
            case 'session_notice_read': {
                const m = app.sessions.messages(actor, session!.id).find(m => m.id === text(x.messageId, 'messageId', 100));
                ensure(m && m.role === 'system' && m.origin !== 'automation', 'SCOPE_DENIED', '只能读取自己的宿主通知', 403);
                const cursor = integer(x.cursor ?? 0, 'cursor', 0, m.content.length), end = Math.min(cursor + 16000, m.content.length);
                return {messageId: m.id, content: m.content.slice(cursor, end), cursor: end, complete: end === m.content.length};
            }
            case 'project_inspect': {
                const grant = actor.taskId ? app.teams.resources(actor) : actor.wakeupId ? app.wakeups.resources(actor) : null;
                const runs = app.store.list('run', pid).filter(r => !grant || grant.runIds.has(r.id));
                return { textCorpus: app.textEvidence.status(actor,pid), project: { id: pid, name: app.projects.get(actor, pid).name }, experiments: app.store.list('experiment', pid).filter(e => !grant || runs.some(r => r.experimentId === e.id)).map(e => ({ id: e.id, title: e.title, lifecycle: e.lifecycle, revision: e.revision })), runs: runs.map(r => ({ id: r.id, state: r.state, integrity: r.integrity, evidenceIds: (r.evidenceIds as string[]).filter(id => !grant || grant.evidenceIds.has(id)) })), evidenceIds: app.store.list('evidence', pid).filter(e => !grant || grant.evidenceIds.has(e.id)).map(e => e.id) };
            }
            case 'workspace_list': return listFiles(ownOrProject());
            case 'artifact_read': {
                const {artifact,bytes}=app.evidence.read(actor,text(x.artifactId,'artifactId',100));
                ensure(!bytes.includes(0) && bytes.length<=2*1024*1024,'ARTIFACT_TEXT_REQUIRED','该产物不能通过文本工具读取',415);
                const content=new TextDecoder('utf-8',{fatal:true}).decode(bytes),cursor=integer(x.cursor??0,'cursor',0,content.length),end=Math.min(cursor+16000,content.length);
                return {artifactId:artifact.id,digest:artifact.digest,title:artifact.title,mediaType:artifact.mediaType,content:content.slice(cursor,end),cursor:end,complete:end===content.length};
            }
            case 'artifact_create': return app.evidence.put(pid, text(x.title, 'title', 200), Buffer.from(text(x.content, 'content', 2 * 1024 * 1024, true)), text(x.mediaType ?? 'text/plain', 'mediaType', 100), actor.type === 'user' ? 'user' : `agent:${session!.id}`, actor.taskId ? { taskId: actor.taskId } : actor.wakeupId ? { wakeupId: actor.wakeupId } : {});
            case 'evidence_register': return app.evidence.register(actor, pid, text(x.artifactId, 'artifactId', 100), integer(x.start, 'start', 0), integer(x.end, 'end', 1), text(x.description, 'description', 2000));
            case 'evidence_read': return app.evidence.verify(pid, text(x.evidenceId, 'evidenceId', 100));
            case 'experiment_plan_submit': return app.experiments.create(actor, pid, x);
            case 'run_inspect': return app.store.get('run', text(x.runId, 'runId', 100), pid);
            case 'run_logs':
                app.store.get('run', text(x.runId, 'runId', 100), pid);
                return app.runs.logs(actor, x.runId as string, integer(x.cursor ?? 0, 'cursor', 0));
            case 'approval_request': return app.store.list('approval', pid).filter(a => a.status === 'pending');
            case 'collaboration_plan_submit':
            case 'agent_delegate': return app.teams.create(actor, session!.id, x);
            case 'task_inspect': {
                const tasks = app.teams.tasks(actor, session?.teamId ?? text(x.teamId, 'teamId', 100));
                const grant = actor.taskId ? app.teams.resources(actor) : actor.wakeupId ? app.wakeups.resources(actor) : null;
                return tasks.filter(t => !grant || grant.taskIds.has(t.id));
            }
            case 'task_result_read': {
                const t = app.store.get<Task>('task', text(x.taskId, 'taskId', 100), pid);
                ensure(!session?.teamId || t.teamId === session?.teamId, 'SCOPE_DENIED', '任务不属于当前团队', 403);
                return { id: t.id, key: t.key, execution: t.execution, acceptance: t.acceptance, result: t.result };
            }
            case 'task_context_read':
                ensure(!!actor.attemptId, 'TASK_REQUIRED', '主会话没有助手简报');
                return app.store.list('context-snapshot', pid).find(c => c.attemptId === actor.attemptId)?.content ?? null;
            case 'task_progress_report': return app.store.event(pid, 'task.progress', { sessionId: session!.id, taskId: actor.taskId, message: text(x.message, 'message', 2000) });
            default: throw new Error(`Missing handler for approved tool: ${name}`);
        }
}

const SPECS: OperationSpec[] = [
    make('development_prepare', {idempotencyPolicy:'key-required',requiresSession:true,authorize:noPrecondition,preconditions:noPrecondition,execute:(c,x)=>c.app.development.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('development_submit', {idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.submit(c.actor,c.projectId,x.developmentTaskId as string)}),
    make('development_inspect', {idempotencyPolicy:'read-only',authorize:(c,x)=>{x.jobId?c.app.development.inspect(c.actor,c.projectId,x.jobId as string):c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string);},preconditions:noPrecondition,execute:(c,x)=>x.jobId?c.app.development.inspect(c.actor,c.projectId,x.jobId as string):c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string)}),
    make('development_logs', {idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.development.inspect(c.actor,c.projectId,x.jobId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.logs(c.actor,c.projectId,x.jobId as string,x.stream??'stdout',x.cursor??0)}),
    make('development_cancel', {idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.development.inspect(c.actor,c.projectId,x.jobId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.cancel(c.actor,c.projectId,x.jobId as string)}),
    make('experiment_source_list', {idempotencyPolicy: 'read-only', authorize: (c,x) => {c.app.sources.resolve(c.actor,c.projectId,x); if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_list');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.list(c.actor,c.projectId,x)}),
    make('experiment_source_read', {idempotencyPolicy: 'read-only', authorize: (c,x) => {const {path,cursor,limit,...selector}=x;c.app.sources.resolve(c.actor,c.projectId,selector);if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_read');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.read(c.actor,c.projectId,x)}),
    make('experiment_source_diff', {idempotencyPolicy: 'read-only', authorize: (c,x) => {c.app.sources.resolve(c.actor,c.projectId,x.from);c.app.sources.resolve(c.actor,c.projectId,x.to);if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_diff');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.diff(c.actor,c.projectId,x)}),
    make('workspace_prepare_from_revision', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: noPrecondition, preconditions: noPrecondition, execute: (c,x) => c.app.sources.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('text_evidence_search', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'text_evidence_search', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'text_evidence_search', x)}),
    make('research_skill_list', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'research_skill_list', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'research_skill_list', x)}),
    make('research_skill_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'research_skill_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'research_skill_read', x)}),
    make('connector_status', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'connector_status', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'connector_status', x)}),
    make('session_notice_read', {idempotencyPolicy: 'read-only', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'session_notice_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'session_notice_read', x)}),
    make('project_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'project_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'project_inspect', x)}),
    make('workspace_list', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'workspace_list', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'workspace_list', x)}),
    make('artifact_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'artifact_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'artifact_read', x)}),
    make('artifact_create', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'artifact_create', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'artifact_create', x)}),
    make('evidence_register', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'evidence_register', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'evidence_register', x)}),
    make('evidence_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'evidence_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'evidence_read', x)}),
    make('experiment_plan_submit', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'experiment_plan_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'experiment_plan_submit', x)}),
    make('run_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'run_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'run_inspect', x)}),
    make('run_logs', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'run_logs', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'run_logs', x)}),
    make('approval_request', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'approval_request', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'approval_request', x)}),
    make('collaboration_plan_submit', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'collaboration_plan_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'collaboration_plan_submit', x)}),
    make('agent_delegate', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'agent_delegate', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'agent_delegate', x)}),
    make('task_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'task_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_inspect', x)}),
    make('task_result_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'task_result_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_result_read', x)}),
    make('task_context_read', {idempotencyPolicy: 'read-only', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'task_context_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_context_read', x)}),
    make('task_progress_report', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'task_progress_report', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'task_progress_report', x)}),
    make('campaign_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'campaign_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'campaign_inspect', x)}),
    make('campaign_enroll', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'campaign_enroll', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'campaign_enroll', x)}),
    make('campaign_decision_submit', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'campaign_decision_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'campaign_decision_submit', x)}),
    make('literature_discover', {idempotencyPolicy: 'key-required', asynchronous: true, authorize: noPrecondition, preconditions: noPrecondition, execute: (c, x) => c.app.connectors.discover(c.actor, c.projectId, x, externalReplay(c, 'literature_discover', x).key, c.validate, c.signal)}),
    make('literature_search', {idempotencyPolicy: 'key-required', asynchronous: true, authorize: noPrecondition, preconditions: noPrecondition, execute: (c, x) => c.app.literature.search(c.projectId, text(x.query, 'query', 500), integer(x.limit ?? 8, 'limit', 1, 20), externalReplay(c, 'literature_search', x).key, c.validate)}),
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
        : writeText(c.session!.workspace, x.path as string, x.content as string, x.expectedDigest as string | null, c.app.store)}),
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
    specs() { return SPECS.map(({id, inputSchema, outputSchema, idempotencyPolicy, requiresSession}) => ({id, inputSchema, outputSchema, idempotencyPolicy, ...(requiresSession ? {requiresSession} : {})})); }
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
        let session = actor.type === 'agent' ? this.agentIdentity(actor, id) : undefined;
        const spec = SPECS.find(item => item.id === id);
        ensure(spec, 'OPERATION_NOT_FOUND', '领域操作不存在', 404);
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
        if (spec.requiresSession) ensure(session, 'SESSION_REQUIRED', '需要指定项目内的会话', 400);
        for (const [field, kind] of [['evidenceId', 'evidence'], ['artifactId', 'artifact'], ['runId', 'run'], ['taskId', 'task']] as const) {
            if (typeof input[field] !== 'string') continue;
            this.app.store.get(kind, input[field] as string, pid);
            if (actor.taskId || actor.wakeupId) (actor.taskId ? this.app.teams : this.app.wakeups).assertResource(actor, kind, input[field] as string);
        }
        spec.authorize(context, input);
        const workspaceId = spec.requiresSession || ['task_inspect', 'task_result_read', 'research_skill_list', 'research_skill_read'].includes(id) || id.startsWith('workspace_') && input.source !== 'project' ? session?.id : undefined;
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
            const projectPaths: Record<string, string> = {text_evidence_search: '/text-evidence-search', artifact_create: '/artifacts', evidence_register: '/evidence', experiment_plan_submit: '/experiments'};
            if (projectPaths[id]) { path = projectPaths[id]; body = {projectId: pid, ...input}; }
            if (id === 'campaign_enroll' || id === 'campaign_decision_submit') { path = `/campaigns/${input.campaignId}/${id === 'campaign_enroll' ? 'members' : 'decisions'}`; const {campaignId, ...rest} = input; body = rest; }
            if (id === 'collaboration_plan_submit' || id === 'agent_delegate') { path = `/sessions/${session!.id}/teams`; body = input; }
            if (id === 'experiment_plan_submit' && input.parentId) { const {parentId, ...childBody} = input; for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) aliases.push({scope: `${method}:/experiments/${parentId}/children`, input: {body: childBody, query: ''}}); }
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
                    ensure(externalReplay(context, id, input).completed, 'OPERATION_IN_PROGRESS', '同键请求尚在执行或上次结果待对账；不会重复发出外部请求');
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
