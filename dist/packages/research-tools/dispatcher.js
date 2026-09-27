import { toolAllowed, ROLE_TOOLS, AUTOMATION_TOOLS } from '../policy/permissions.js';
import { ensure } from '../domain/errors.js';
import { object, text, integer } from '../contracts/validation.js';
import { readText, writeText, listFiles } from '../workspace/files.js';
import { TOOL_DEFINITIONS } from './definitions.js';
export class ToolDispatcher {
    app;
    constructor(app) {
        this.app = app;
    }
    definitions(role, automation = false) { return (ROLE_TOOLS[role] ?? []).filter(name => TOOL_DEFINITIONS[name] && (!automation || AUTOMATION_TOOLS.includes(name))).map(name => ({ name, ...TOOL_DEFINITIONS[name] })); }
    /** Ownership and fencing apply even to replays; completed calls may only return their stored response. */
    identity(actor, name) {
        ensure(actor.type === 'agent' && !!actor.sessionId && !!actor.projectId, 'PERMISSION_DENIED', '需要宿主派发的 Agent 身份', 403);
        const s = this.app.sessions.get(actor, actor.sessionId);
        ensure(s.role === actor.role && s.projectId === actor.projectId && s.taskId === actor.taskId, 'SCOPE_DENIED', '角色或任务与会话归属不一致', 403);
        toolAllowed(actor, name);
        if (actor.wakeupId) {
            ensure(AUTOMATION_TOOLS.includes(name), 'AUTOMATION_TOOL_DENIED', '自动分析不能执行计算、修改工作区、批准或继续委派', 403);
            const w = this.app.wakeups.get(actor, actor.wakeupId);
            ensure(w.rootSessionId === s.id && w.generation === actor.generation, 'SCOPE_DENIED', '通知与会话执行不匹配', 403);
        }
        ensure(s.state !== 'archived' && !this.app.store.get('project', s.projectId).archived, 'SCOPE_DENIED', '归档项目或会话不可由 Agent 继续访问', 403);
        if (actor.taskId) {
            ensure(!!actor.attemptId, 'PERMISSION_DENIED', '缺少任务尝试身份', 403);
            const t = this.app.store.get('task', actor.taskId, actor.projectId), a = this.app.store.get('task-attempt', actor.attemptId, actor.projectId);
            ensure(t.execution !== 'superseded', 'TASK_INPUT_STALE', '任务需求已失效');
            ensure(t.attemptId === a.id && a.sessionId === s.id && a.taskId === t.id && a.generation === actor.generation && t.generation === actor.generation, 'LEASE_EXPIRED', '任务尝试已被替代');
        }
        else
            ensure(s.generation === actor.generation, 'LEASE_EXPIRED', '旧 Worker 已失去会话写入权');
        return s;
    }
    authorize(actor, name) {
        const s = this.identity(actor, name);
        if (actor.wakeupId)
            this.app.wakeups.assertActive(actor);
        if (actor.taskId)
            this.app.teams.active(actor);
        else
            ensure(s.state === 'running' && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话已中止或租约过期');
        return s;
    }
    async execute(actor, name, raw, callId) {
        const session = this.identity(actor, name), input = object(raw), pid = session.projectId;
        text(callId, 'toolCallId', 200);
        const request = { name, input }, scope = `agent:${session.id}`;
        if (name === 'text_evidence_search') {
            this.authorize(actor, name);
            this.app.textEvidence.authorizeSearch(actor, pid, input);
        }
        const previous = this.app.store.agentOperationResult(session.id, callId, request);
        if (previous.found)
            return previous.value;
        this.authorize(actor, name);
        if (name === 'literature_discover' || name === 'paper_read') {
            const result = name === 'literature_discover'
                ? await this.app.connectors.discover(actor, pid, input, `${session.id}:${callId}`, () => { this.authorize(actor, name); })
                : await this.app.connectors.paper(actor, pid, input, `${session.id}:${callId}`, () => { this.authorize(actor, name); });
            this.authorize(actor, name);
            return this.app.store.operation(scope, callId, request, () => { this.app.store.event(pid, 'tool.executed', { sessionId: session.id, taskId: actor.taskId, tool: name, callId }); return result; });
        }
        if (name === 'literature_search') {
            const result = await this.app.literature.search(pid, text(input.query, 'query', 500), integer(input.limit ?? 8, 'limit', 1, 20), `${actor.sessionId}:${callId}`, () => { this.authorize(actor, name); });
            this.authorize(actor, name);
            return this.app.store.operation(scope, callId, request, () => result);
        }
        return this.app.store.operation(scope, callId, request, () => {
            this.authorize(actor, name);
            const result = this.invoke(actor, session, name, input, pid);
            this.app.store.event(pid, 'tool.executed', { sessionId: session.id, taskId: actor.taskId, attemptId: actor.attemptId, tool: name, callId });
            return result;
        });
    }
    invoke(actor, session, name, x, pid) {
        const ownOrProject = () => { ensure(!x.source || x.source === 'session' || x.source === 'project' && session.role === 'coordinator', 'SCOPE_DENIED', '助手只能访问自己的工作区', 403); return x.source === 'project' ? this.app.projects.get(actor, pid).workspace : session.workspace; };
        if (actor.taskId || actor.wakeupId) {
            for (const [field, kind] of [['evidenceId', 'evidence'], ['artifactId', 'artifact'], ['runId', 'run'], ['taskId', 'task']])
                if (typeof x[field] === 'string')
                    (actor.taskId ? this.app.teams : this.app.wakeups).assertResource(actor, kind, x[field]);
        }
        if (name.startsWith('campaign_')) {
            const campaignId = text(x.campaignId, 'campaignId', 100);
            if (actor.wakeupId) {
                const w = this.app.wakeups.assertActive(actor);
                ensure(w.sourceKind === 'campaign-result' && w.ownerId === campaignId, 'AUTOMATION_SCOPE_DENIED', '只能分析本次通知所属研究活动', 403);
            }
            const c = this.app.campaigns.get(actor, campaignId);
            this.app.campaigns.coordinator(actor, c);
            if (name === 'campaign_inspect')
                return { campaign: c, members: this.app.campaigns.members(actor, c.id), rounds: this.app.campaigns.rounds(actor, c.id), observations: this.app.campaigns.observations(actor, c.id), decisions: this.app.campaigns.decisions(actor, c.id) };
            if (name === 'campaign_enroll')
                return this.app.campaigns.enroll(actor, c.id, x);
            if (name === 'campaign_decision_submit')
                return this.app.decisions.propose(actor, c.id, x);
        }
        switch (name) {
            case 'text_evidence_search': return this.app.textEvidence.search(actor, pid, x);
            case 'research_skill_list': return { bundleId: this.app.skills.bundleId, skills: this.app.skills.list(session.role) };
            case 'research_skill_read': return this.app.skills.read(session.role, text(x.skillId, 'skillId', 100), x.resource === undefined ? undefined : text(x.resource, 'resource', 200));
            case 'connector_status': return this.app.connectors.settings(actor, pid);
            case 'session_notice_read': {
                const m = this.app.sessions.messages(actor, session.id).find(m => m.id === text(x.messageId, 'messageId', 100));
                ensure(m && m.role === 'system' && m.origin !== 'automation', 'SCOPE_DENIED', '只能读取自己的宿主通知', 403);
                const cursor = integer(x.cursor ?? 0, 'cursor', 0, m.content.length), end = Math.min(cursor + 16000, m.content.length);
                return { messageId: m.id, content: m.content.slice(cursor, end), cursor: end, complete: end === m.content.length };
            }
            case 'project_inspect': {
                const grant = actor.taskId ? this.app.teams.resources(actor) : actor.wakeupId ? this.app.wakeups.resources(actor) : null;
                const runs = this.app.store.list('run', pid).filter(r => !grant || grant.runIds.has(r.id));
                return { textCorpus: this.app.textEvidence.status(actor, pid), project: { id: pid, name: this.app.projects.get(actor, pid).name }, experiments: this.app.store.list('experiment', pid).filter(e => !grant || runs.some(r => r.experimentId === e.id)).map(e => ({ id: e.id, title: e.title, lifecycle: e.lifecycle })), runs: runs.map(r => ({ id: r.id, state: r.state, integrity: r.integrity, evidenceIds: r.evidenceIds.filter(id => !grant || grant.evidenceIds.has(id)) })), evidenceIds: this.app.store.list('evidence', pid).filter(e => !grant || grant.evidenceIds.has(e.id)).map(e => e.id) };
            }
            case 'workspace_list': return listFiles(ownOrProject());
            case 'workspace_read': return readText(ownOrProject(), text(x.path, 'path', 1000));
            case 'workspace_write':
                ensure(x.source !== 'project', 'SCOPE_DENIED', '不能通过助手写入项目共享工作区', 403);
                return writeText(session.workspace, text(x.path, 'path', 1000), text(x.content, 'content', 2 * 1024 * 1024, true), x.expectedDigest === null ? null : text(x.expectedDigest, 'expectedDigest', 64));
            case 'change_proposal_prepare': return this.app.changes.prepare(actor, pid, x);
            case 'artifact_read': {
                const { artifact, bytes } = this.app.evidence.read(actor, text(x.artifactId, 'artifactId', 100));
                ensure(!bytes.includes(0) && bytes.length <= 2 * 1024 * 1024, 'ARTIFACT_TEXT_REQUIRED', '该产物不能通过文本工具读取', 415);
                const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes), cursor = integer(x.cursor ?? 0, 'cursor', 0, content.length), end = Math.min(cursor + 16000, content.length);
                return { artifactId: artifact.id, digest: artifact.digest, title: artifact.title, mediaType: artifact.mediaType, content: content.slice(cursor, end), cursor: end, complete: end === content.length };
            }
            case 'artifact_create': return this.app.evidence.put(pid, text(x.title, 'title', 200), Buffer.from(text(x.content, 'content', 2 * 1024 * 1024, true)), text(x.mediaType ?? 'text/plain', 'mediaType', 100), `agent:${session.id}`, actor.taskId ? { taskId: actor.taskId } : actor.wakeupId ? { wakeupId: actor.wakeupId } : {});
            case 'evidence_register': return this.app.evidence.register(actor, pid, text(x.artifactId, 'artifactId', 100), integer(x.start, 'start', 0), integer(x.end, 'end', 1), text(x.description, 'description', 2000));
            case 'evidence_read': return this.app.evidence.verify(pid, text(x.evidenceId, 'evidenceId', 100));
            case 'experiment_plan_submit': return this.app.experiments.create(actor, pid, x);
            case 'run_prepare':
                this.app.store.get('experiment', text(x.experimentId, 'experimentId', 100), pid);
                return this.app.runs.prepare(actor, x.experimentId);
            case 'run_submit':
                this.app.store.get('run-intent', text(x.intentId, 'intentId', 100), pid);
                return this.app.runs.submit(actor, x.intentId);
            case 'run_inspect': return this.app.store.get('run', text(x.runId, 'runId', 100), pid);
            case 'run_logs':
                this.app.store.get('run', text(x.runId, 'runId', 100), pid);
                return this.app.runs.logs(actor, x.runId, integer(x.cursor ?? 0, 'cursor', 0));
            case 'approval_request': return this.app.store.list('approval', pid).filter(a => a.status === 'pending');
            case 'collaboration_plan_submit':
            case 'agent_delegate': return this.app.teams.create(actor, session.id, x);
            case 'task_inspect': {
                const tasks = this.app.teams.tasks(actor, session.teamId ?? text(x.teamId, 'teamId', 100));
                const grant = actor.taskId ? this.app.teams.resources(actor) : actor.wakeupId ? this.app.wakeups.resources(actor) : null;
                return tasks.filter(t => !grant || grant.taskIds.has(t.id));
            }
            case 'task_result_read': {
                const t = this.app.store.get('task', text(x.taskId, 'taskId', 100), pid);
                ensure(!session.teamId || t.teamId === session.teamId, 'SCOPE_DENIED', '任务不属于当前团队', 403);
                return { id: t.id, key: t.key, execution: t.execution, acceptance: t.acceptance, result: t.result };
            }
            case 'task_context_read':
                ensure(!!actor.attemptId, 'TASK_REQUIRED', '主会话没有助手简报');
                return this.app.store.list('context-snapshot', pid).find(c => c.attemptId === actor.attemptId)?.content ?? null;
            case 'task_progress_report': return this.app.store.event(pid, 'task.progress', { sessionId: session.id, taskId: actor.taskId, message: text(x.message, 'message', 2000) });
            case 'task_result_submit': return this.app.teams.submit(actor, x);
            default: throw new Error(`Missing handler for approved tool: ${name}`);
        }
    }
}
//# sourceMappingURL=dispatcher.js.map