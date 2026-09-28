import {operationRoute} from './operation-routes.js';
import {randomUUID} from 'node:crypto';
import {readIntegrationRoute,writeIntegrationRoute} from './integration-routes.js';
import { readCampaignRoute, writeCampaignRoute } from './campaign-routes.js';
import { listFiles } from '../../packages/workspace/files.js';
import type { ResearchApp } from '../../packages/research-app.js';
import type { AgentHost } from '../../packages/scheduler/agent-host.js';
import { USER, type Session } from '../../packages/domain/types.js';
import { DomainError, ensure } from '../../packages/domain/errors.js';
import { object, text, integer, bool, strings, oneOf } from '../../packages/contracts/validation.js';
import { CAPABILITIES } from '../../packages/contracts/capabilities.js';
export function readRoute(app: ResearchApp, host: AgentHost, path: string, url: URL): unknown {
    const integration=readIntegrationRoute(app,path,url); if(integration!==undefined)return integration;
    const research = readCampaignRoute(app, path);
    if (research !== undefined) return research;
    const parts = path.split('/').filter(Boolean);
    const [kind, id, action] = parts;
    if (path === '/bootstrap')
        return { version: '0.3.1-experimental', projects: app.store.list('project').filter(p => !p.archived), model: app.sessions.model(), runtime: host.status(), capabilities: CAPABILITIES };
    if (path === '/capabilities')
        return CAPABILITIES;
    if (path === '/events') {
        const after = integer(Number(url.searchParams.get('after') ?? 0), 'after', 0);
        const items = app.store.events(after, url.searchParams.get('projectId') ?? undefined);
        return { items, cursor: items.length ? items[items.length - 1].seq : after };
    }
    if (kind === 'change-proposals' && id) return action === 'diff' ? app.changes.inspect(USER,id) : app.changes.get(USER,id);
    if (kind === 'projects' && !id)
        return app.store.list('project').filter(p => !p.archived);
    if (kind === 'projects' && id) {
        const p = app.projects.get(USER, id);
        if (action === 'text-evidence') return app.textEvidence.status(USER,id);
        if (action === 'state')
            return { textEvidence: app.textEvidence.status(USER,id), project: p, changeProposals: app.store.list('change-proposal',id), sessions: app.store.list('session', id), experiments: app.store.list('experiment', id), intents: app.store.list('run-intent', id), runs: app.store.list('run', id), approvals: app.store.list('approval', id), teams: app.store.list('team', id), tasks: app.store.list('task', id), artifacts: app.store.list('artifact', id), evidence: app.store.list('evidence', id), claims: app.store.list('claim', id), reports: app.store.list('report', id), searches: app.store.list('literature-search', id), usage: app.store.list('model-usage', id), campaigns: app.store.list('campaign', id), rounds: app.store.list('research-round', id), members: app.store.list('campaign-member', id), observations: app.store.list('run-observation', id), decisions: app.store.list('campaign-decision', id), wakeups: app.store.list('wakeup', id), budgets: [...app.store.list('team', id).map(t => ({ teamId: t.id, ...app.budget.summary(t.id) })), ...app.store.list('campaign', id).map(c => ({ campaignId: c.id, ...app.budget.summary(c.id) }))] };
        if (action === 'files')
            return app.operations.execute(USER, url.searchParams.has('path') ? 'workspace_read' : 'workspace_list', {source: 'project', ...(url.searchParams.has('path') ? {path: url.searchParams.get('path')} : {})}, {projectId: id});
        if (action === 'collaboration-settings')
            return p.settings;
        if (!action)
            return p;
    }
    if (kind === 'sessions' && id) {
        if (action === 'messages')
            return app.sessions.messages(USER, id);
        if (!action)
            return app.sessions.get(USER, id);
    }
    if (kind === 'teams' && id) {
        if (action === 'tasks')
            return app.operations.execute(USER, 'task_inspect', {teamId: id}, {projectId: app.teams.get(USER, id).projectId!});
        if (action === 'plan')
            return app.store.list('team-plan').find(p => p.teamId === id);
        if (!action)
            return app.teams.get(USER, id);
    }
    if (kind === 'tasks' && id) {
        const t = app.store.get('task', id);
        return action === 'result' ? t.result ?? null : t;
    }
    if (kind === 'experiments' && id) {
        if (action === 'files') {
            ensure([...url.searchParams.keys()].every(key => key === 'path') && url.searchParams.getAll('path').length <= 1, 'INVALID_INPUT', '当前实验文件接口只接受 path；指定版本请使用 experiment_source_read', 400);
            const path = url.searchParams.get('path');
            return path ? app.experiments.readFile(USER, id, path) : listFiles(app.experiments.get(USER, id).workspace);
        }
        return app.experiments.get(USER, id);
    }
    if (kind === 'runs' && id) {
        if (action === 'logs')
            return app.operations.execute(USER, 'run_logs', {runId: id, cursor: integer(Number(url.searchParams.get('cursor') ?? 0), 'cursor', 0)}, {projectId: app.runs.get(USER, id).projectId!});
        if (action === 'manifest')
            return app.runs.get(USER, id).manifest;
        return app.operations.execute(USER, 'run_inspect', {runId: id}, {projectId: app.runs.get(USER, id).projectId!});
    }
    if (kind === 'evidence' && id) {
        const e = app.store.get('evidence', id);
        return app.operations.execute(USER, 'evidence_read', {evidenceId: id}, {projectId: e.projectId!});
    }
    throw new DomainError('NOT_FOUND', '接口不存在', 404);
}
export function writeRoute(app: ResearchApp, host: AgentHost, path: string, body: unknown, method = 'POST'): unknown {
    // Direct in-process callers retain the same thin compatibility translation as HTTP.
    if (path !== '/connectors/paper') {
        const migrated = operationRoute(app, path, body, randomUUID(), new AbortController().signal, method, '');
        if (migrated) return migrated.result;
    }
    const integration=writeIntegrationRoute(app,path,body); if(integration!==undefined)return integration;
    const x = object(body), [kind, id, action] = path.split('/').filter(Boolean);
    const research = writeCampaignRoute(app, path, x);
    if (research !== undefined) return research;
    if (kind === 'projects' && id && action === 'text-evidence') return app.textEvidence.configure(USER,id,x);
    if (kind === 'change-proposals' && id && action === 'apply') return app.changes.apply(USER,id);
    if (path === '/projects/import')
        return app.projects.importDirectory(USER, x);
    if (path === '/projects')
        return app.projects.create(USER, x);
    if (kind === 'projects' && id) {
        if (action === 'collaboration-settings') {
            const p = app.projects.settings(USER, id, x);
            if (!p.settings.enabled)
                for (const t of app.store.list('team', id))
                    app.teams.disable(USER, t.id);
            return p;
        }
        if (action === 'archive')
            return app.projects.archive(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
        if (!action)
            return app.projects.update(USER, id, x);
    }
    if (path === '/sessions')
        return app.sessions.create(USER, text(x.projectId, 'projectId', 100), x);
    if (kind === 'sessions' && id) {
        if (action === 'messages') {
            host.ensureReady(app.sessions.get(USER, id));
            return app.sessions.send(USER, id, x);
        }
        if (action === 'interrupt')
            return app.sessions.interrupt(USER, id);
        if (action === 'branch')
            return app.sessions.branch(USER, id, text(x.messageId, 'messageId', 100));
        if (action === 'retry')
            return app.sessions.retry(USER, id, text(x.messageId, 'messageId', 100));
        if (action === 'archive')
            return app.sessions.archive(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
        if (action === 'model') {
            const s = app.sessions.get(USER, id);
            ensure(s.state !== 'running' && !s.taskId, 'SESSION_BUSY', '不能改变运行中或已分配助手的模型');
            return app.store.update<Session>('session', id, integer(x.expectedVersion, 'expectedVersion', 1), { model: app.sessions.model() });
        }
        if (!action)
            return app.sessions.rename(USER, id, text(x.title, 'title', 160), integer(x.expectedVersion, 'expectedVersion', 1));
    }
    if (kind === 'teams' && id) {
        if (action === 'activate')
            return app.teams.activate(USER, id);
        if (action === 'disable-delegation')
            return app.teams.disable(USER, id);
        if (action === 'pause')
            return app.teams.pause(USER, id);
        if (action === 'resume')
            return app.teams.resume(USER, id);
        if (action === 'directives')
            return app.teams.directive(USER, id, x);
    }
    if (kind === 'tasks' && id) {
        if (action === 'cancel')
            return app.teams.cancel(USER, id);
        if (action === 'retry')
            return app.teams.retry(USER, id);
        if (action === 'manual-review')
            return app.teams.manualReview(USER, id, x);
    }
    if (kind === 'experiments' && id) {
        if (action === 'files')
            return app.experiments.writeFile(USER, id, text(x.path, 'path', 1000), text(x.content, 'content', 2 * 1024 * 1024, true), x.expectedDigest === null ? null : text(x.expectedDigest, 'expectedDigest', 64), integer(x.expectedVersion, 'expectedVersion', 1));
        if (action === 'notes')
            return app.experiments.note(USER, id, text(x.note, 'note', 10000));
    }
    if (kind === 'runs' && id && action === 'outcome-review') return app.runs.reviewOutcome(USER,id,x);
    if (kind === 'runs' && id && action === 'cancel')
        return app.runs.cancel(USER, id);
    if (kind === 'approvals' && id && action === 'decide')
        return app.approvals.decide(USER, id, integer(x.expectedVersion, 'expectedVersion', 1), bool(x.approved, 'approved'));
    if (path === '/claims')
        return app.evidence.proposeClaim(USER, text(x.projectId, 'projectId', 100), text(x.statement, 'statement', 10000), strings(x.evidenceIds, 'evidenceIds'), strings(x.limitations ?? [], 'limitations'));
    if (kind === 'claims' && id && action === 'decide')
        return app.evidence.decideClaim(USER, id, integer(x.expectedVersion, 'expectedVersion', 1), oneOf(x.status, ['accepted', 'rejected', 'disputed'] as const, 'status'));
    if (path === '/reports')
        return app.reports.create(USER, text(x.projectId, 'projectId', 100), x);
    if (path === '/settings/model')
        return app.sessions.configure(USER, x);
    throw new DomainError('NOT_FOUND', '此操作未实现', 404);
}
