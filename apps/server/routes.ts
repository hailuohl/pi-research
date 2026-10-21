import {assertProjectReadable,assertProjectWritable} from '../../packages/policy/lifecycle.js';
import {operationRoute} from './operation-routes.js';
import {readEnvironment} from './environment-routes.js';
import {inspectModelConnections} from '../../packages/pi-adapter/model-connections.js';
import {randomUUID} from 'node:crypto';
import {readIntegrationRoute,writeIntegrationRoute} from './integration-routes.js';
import { readCampaignRoute, writeCampaignRoute } from './campaign-routes.js';
import { listFiles } from '../../packages/workspace/files.js';
import type { ResearchApp } from '../../packages/research-app.js';
import type { AgentHost } from '../../packages/scheduler/agent-host.js';
import { USER, type Session, type Task, type TaskAttempt, type TaskResult } from '../../packages/domain/types.js';
import {publicRecord} from '../../packages/domain/public-record.js';
import { DomainError, ensure } from '../../packages/domain/errors.js';
import { object, text, integer, bool, strings, oneOf } from '../../packages/contracts/validation.js';
import { CAPABILITIES } from '../../packages/contracts/capabilities.js';
import {eventQuery} from './event-stream.js';
/** Apply the lifecycle boundary before by-ID routes reach their individual services. */
export function guardProjectRoute(app:ResearchApp,path:string,write=false) {
    const [kind,id,action]=path.split('/').filter(Boolean);
    if(!id||kind==='operations'||kind==='settings')return;
    if(kind==='projects'&&action==='purge'){ensure(path===`/projects/${id}/purge`,'INVALID_INPUT','永久清理只接受规范路径');if(!write)app.projects.purgeStatus(USER,id);return;}
    if(kind==='projects'&&((!write&&action==='lifecycle')||(write&&['trash','restore'].includes(action)))) {app.projects.lifecycle(USER,id);return;}
    const row=kind==='projects'?app.store.maybe('project',id):app.store.db.prepare('SELECT project_id FROM records WHERE id=? AND project_id IS NOT NULL LIMIT 1').get(id);
    const pid=kind==='projects'?row?.id:row?.project_id;
    if(typeof pid==='string') {
        if(write&&!(kind==='projects'&&action==='unarchive'))assertProjectWritable(app.store,pid);
        else assertProjectReadable(app.store,pid,USER);
    }
}
export function readRoute(app: ResearchApp, host: AgentHost, path: string, url: URL): unknown {
    guardProjectRoute(app,path);
    if(path==='/settings/environment')return readEnvironment(app,url);
    if(path==='/settings/model-connections'){ensure(url.search==='','INVALID_INPUT','模型连接目录不接受查询参数',400);return inspectModelConnections(app.context,USER);}
    if(path==='/publication-templates') {ensure(url.search==='','INVALID_INPUT','模板目录不接受查询参数');return app.publicationTemplates.list(USER);}
    const template=path.match(/^\/publication-templates\/([^/]+)(\/files)?$/);
    if(template){ensure([...url.searchParams.keys()].every(k=>template[2]&&k==='path')&&url.searchParams.getAll('path').length<=1,'INVALID_INPUT','模板文件接口只接受一个 path');return template[2]?app.publicationTemplates.read(USER,template[1],text(url.searchParams.get('path'),'path',240)):app.publicationTemplates.inspect(USER,template[1]);}
    const integration=readIntegrationRoute(app,path,url); if(integration!==undefined)return integration;
    const research = readCampaignRoute(app, path);
    if (research !== undefined) return research;
    const parts = path.split('/').filter(Boolean);
    const [kind, id, action] = parts;
    if(kind==='projects'&&id&&action==='github'&&parts.length===3)return app.github.inspect(USER,id);
    if(kind==='sessions'&&id&&action==='research-continuations')return app.researchAutomation.list(USER,id);
    if(kind==='research-continuations'&&id)return app.researchAutomation.inspect(USER,id);
    if(kind==='sessions'&&id&&action==='host-access')return app.hostAccess.status(USER,id);
    if(kind==='sessions'&&id&&action==='permissions')return app.sessionPermissions.status(USER,id);
    if (path === '/bootstrap')
        return { version: '0.3.1-experimental', projects: app.store.list('project').filter(p => p.status==='active'), model: app.sessions.model(), modelVersion:app.store.maybe('app-settings','global')?.version??0, models:app.sessions.models(), runtime: host.status(), capabilities: CAPABILITIES };
    if (path === '/capabilities')
        return CAPABILITIES;
    if (path === '/events') {
        const query=eventQuery(url);if(query.projectId)app.projects.read(USER,query.projectId);
        return app.store.eventPage(query.after,query.projectId,query.limit);
    }
    if (kind === 'change-proposals' && id) return action === 'diff' ? app.changes.inspect(USER,id) : app.changes.get(USER,id);
    if (kind === 'projects' && !id) {
        ensure([...url.searchParams.keys()].every(k=>k==='status')&&url.searchParams.getAll('status').length<=1,'INVALID_INPUT','项目列表只接受一个 status');
        const status=oneOf(url.searchParams.get('status')??'active',['active','archived','trashed','purging'] as const,'status');
        return app.store.list('project').filter(p=>p.status===status).map(p=>['trashed','purging'].includes(status)?app.projects.lifecycle(USER,p.id):p);
    }
    if (kind === 'projects' && id) {
        if(action==='purge'){ensure(url.search==='','INVALID_INPUT','清理进度不接受查询参数');return app.projects.purgeStatus(USER,id);}
        if(action==='lifecycle'){ensure(parts.length===3&&url.search==='','INVALID_INPUT','生命周期摘要不接受查询参数');return app.projects.lifecycle(USER,id);}
        const p = app.projects.read(USER, id);
        if (action === 'text-evidence') return app.textEvidence.status(USER,id);
        if (action === 'state') {
            ensure([...url.searchParams.keys()].every(k=>k==='sessionId')&&url.searchParams.getAll('sessionId').length<=1,'INVALID_INPUT','项目快照只接受一个所选会话');
            const sessions=app.sessions.recent(USER,id,url.searchParams.has('sessionId')?text(url.searchParams.get('sessionId'),'sessionId',100):undefined),selectedId=url.searchParams.get('sessionId'),root=sessions.find(s=>selectedId?s.id===selectedId:s.role==='coordinator'&&!s.taskId&&!s.teamId&&s.state!=='archived');
            const researchBrief=root?.role==='coordinator'&&!root.taskId&&!root.teamId?app.researchBriefs.inspect(USER,id,root.id):null;
            const publicationRoot=root?.role==='coordinator'&&!root.taskId&&!root.teamId?root.id:null;
            const researchActions=publicationRoot?app.researchActions.list(USER,id,publicationRoot):[];
            const manuscripts=publicationRoot?app.store.db.prepare("SELECT data FROM records WHERE kind='manuscript-revision' AND project_id=? AND json_extract(data,'$.rootSessionId')=? ORDER BY rowid DESC LIMIT 30").all(id,publicationRoot).map(r=>JSON.parse(r.data as string)):[];
            const publicationJobs=publicationRoot?app.store.db.prepare("SELECT id FROM records WHERE kind='publication-build-job' AND project_id=? AND json_extract(data,'$.revisionId') IN (SELECT id FROM records WHERE kind='manuscript-revision' AND project_id=? AND json_extract(data,'$.rootSessionId')=?) ORDER BY rowid DESC LIMIT 30").all(id,id,publicationRoot).map(r=>app.publicationBuilds.inspect(USER,id,String(r.id))):[];
            const publicationReviews=publicationRoot?app.store.db.prepare("SELECT id FROM records WHERE kind='publication-review' AND project_id=? AND json_extract(data,'$.rootSessionId')=? ORDER BY rowid DESC LIMIT 30").all(id,publicationRoot).map(r=>app.publicationReviews.inspect(USER,id,String(r.id))):[];
            const reports=app.store.list<{bindings?:{publications?:Array<{resultId:string}>}}>('report',id).map(r=>({...r,publicationResultIds:r.bindings?.publications?.map(p=>p.resultId)??[]}));
            const publicationResultIds=new Set(publicationJobs.flatMap(j=>j.resultId?[j.resultId]:[])),publicationReportIds=new Set(reports.filter(r=>r.publicationResultIds.some(resultId=>publicationResultIds.has(resultId))).map(r=>r.id));
            const publicationExports=app.store.list<{reportId:string;artifactId:string}>('report-export',id).filter(r=>publicationReportIds.has(r.reportId)).map(r=>({reportId:r.reportId,artifactId:r.artifactId}));
            const tasks=app.store.list<Task>('task',id).map(task=>{
                const attempts=app.store.db.prepare("SELECT data FROM records WHERE kind='task-attempt' AND project_id=? AND json_extract(data,'$.taskId')=? ORDER BY rowid DESC LIMIT 10").all(id,task.id).map(row=>{
                    const attempt=JSON.parse(row.data as string) as import('../../packages/domain/types.js').Row<TaskAttempt>;
                    const resultRow=app.store.db.prepare("SELECT data FROM records WHERE kind='task-result' AND project_id=? AND json_extract(data,'$.attemptId')=? ORDER BY rowid DESC LIMIT 1").get(id,attempt.id);
                    const result=resultRow?(JSON.parse(resultRow.data as string) as {result:TaskResult}).result:undefined;
                    return {id:attempt.id,generation:attempt.generation,state:attempt.state,createdAt:attempt.createdAt,updatedAt:attempt.updatedAt,error:attempt.error,...(result?{result:{outcome:result.outcome,summary:result.summary.slice(0,2000),summaryTruncated:result.summary.length>2000}}:{})};
                });
                return {...task,retry:app.teams.retryEligibility(USER,task.id),attempts};
            });
            return { researchActions,manuscripts,publicationJobs,publicationReviews,publicationExports,researchBrief,textCorpusGrants:app.store.list('text-corpus-grant',id).map(g=>app.textCorpusGrants.inspect(USER,id,g.id)),discoveryGrants:app.store.list('discovery-grant',id).map(g=>app.discoveryGrants.inspect(USER,id,g.id)),runGrants:app.store.list('run-grant',id).map(g=>app.runGrants.inspect(USER,id,g.id)),workingGrants:app.store.list('working-grant',id).map(g=>app.workingGrants.inspect(USER,id,g.id)),experimentPlans:app.store.list('experiment-plan-revision',id),researchCandidates:app.store.list('research-candidate',id),literatureTasks:app.literatureTasks.list(USER,id),documents:app.store.db.prepare("SELECT data FROM records WHERE kind='document-version' AND project_id=? ORDER BY rowid DESC LIMIT 30").all(id).map(r=>JSON.parse(r.data as string)),documentParseJobs:app.store.db.prepare("SELECT id FROM records WHERE kind='document-parse-job' AND project_id=? ORDER BY rowid DESC LIMIT 30").all(id).map(r=>app.documentParsing.inspect(USER,id,String(r.id))),documentParseResults:app.store.db.prepare("SELECT data FROM records WHERE kind='document-parse-result' AND project_id=? ORDER BY rowid DESC LIMIT 30").all(id).map(r=>{const {pages,...summary}=JSON.parse(r.data as string);return summary;}),compute:app.compute.inspect(USER,id),agentCapacity:app.agentAdmission.inspect(USER,id),modelHttp:app.modelHttp.inspect(USER,id),developmentTasks:app.store.list('development-task',id).map(t=>app.development.get(USER,id,t.id)),sandboxJobs:app.store.list('sandbox-job',id).map(j=>app.development.inspect(USER,id,j.id)),reviews:app.store.list('development-review',id).map(r=>app.developmentReviews.inspect(USER,id,r.id)),textEvidence: app.textEvidence.status(USER,id),textEvidenceSearches:app.store.db.prepare("SELECT data FROM records WHERE kind='text-evidence-search' AND project_id=? ORDER BY rowid DESC LIMIT 10").all(id).map(r=>JSON.parse(r.data as string)), project: p, changeProposals: app.store.list('change-proposal',id), sessions:sessions.map(publicRecord), experiments: app.store.list('experiment', id), intents: app.store.list('run-intent', id), runs: app.store.list('run', id).map(publicRecord), approvals: app.store.list('approval', id), teams: app.store.list('team', id).map(publicRecord), tasks, artifacts: app.store.list('artifact', id), evidence: app.store.list('evidence', id), claims: app.store.list('claim', id), reports, searches: app.store.list('literature-search', id), usage: app.store.list('model-usage', id), campaigns: app.store.list('campaign', id), rounds: app.store.list('research-round', id), members: app.store.list('campaign-member', id), observations: app.store.list('run-observation', id), decisions: app.store.list('campaign-decision', id), wakeups: app.store.list('wakeup', id), budgets: [...app.store.list('team', id).map(t => ({ teamId: t.id, ...app.budget.summary(t.id) })), ...app.store.list('campaign', id).map(c => ({ campaignId: c.id, ...app.budget.summary(c.id) }))] };
        }
        if (action === 'files')
            return app.operations.execute(USER, url.searchParams.has('path') ? 'workspace_read' : 'workspace_list', {source: 'project', ...(url.searchParams.has('path') ? {path: url.searchParams.get('path')} : {})}, {projectId: id});
        if (action === 'collaboration-settings')
            return p.settings;
        if (!action)
            return p;
    }
    if (kind === 'sessions' && id) {
        if(action==='queue'){ensure([...url.searchParams.keys()].every(k=>['afterMessageId','limit'].includes(k))&&[...url.searchParams.keys()].every(k=>url.searchParams.getAll(k).length===1),'INVALID_INPUT','队列参数无效');return app.sessions.queue(USER,id,Object.fromEntries([...url.searchParams.entries()].map(([k,v])=>[k,k==='limit'?Number(v):v])));}
        if(action==='view') {ensure([...url.searchParams.keys()].every(k=>['beforeMessageId','afterMessageId','limit'].includes(k))&&[...url.searchParams.keys()].every(k=>url.searchParams.getAll(k).length===1),'INVALID_INPUT','消息页参数无效');return app.operations.execute(USER,'session_view',{sessionId:id,...Object.fromEntries([...url.searchParams.entries()].map(([k,v])=>[k,k==='limit'?Number(v):v]))},{projectId:app.sessions.get(USER,id).projectId!});}
        if (action === 'messages')
            return app.sessions.messages(USER, id).map(publicRecord);
        if (!action)
            return publicRecord(app.sessions.get(USER, id));
    }
    if (kind === 'teams' && id) {
        if (action === 'tasks')
            return app.operations.execute(USER, 'task_inspect', {teamId: id}, {projectId: app.teams.get(USER, id).projectId!});
        if (action === 'plan')
            return publicRecord(app.store.list('team-plan').find(p => p.teamId === id));
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
            return path ? app.experiments.readFile(USER, id, path) : listFiles(app.store.paths.physical(app.experiments.get(USER, id).workspace));
        }
        return app.experiments.get(USER, id);
    }
    if (kind === 'runs' && id) {
        if (action === 'logs')
            return app.operations.execute(USER, 'run_logs', {runId: id, cursor: integer(Number(url.searchParams.get('cursor') ?? 0), 'cursor', 0,Number.MAX_SAFE_INTEGER),...(url.searchParams.has('stream')?{stream:url.searchParams.get('stream')}:{}),...(url.searchParams.has('identity')?{identity:url.searchParams.get('identity')}:{})}, {projectId: app.runs.get(USER, id).projectId!});
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
    guardProjectRoute(app,path,true);
    const integration=writeIntegrationRoute(app,path,body); if(integration!==undefined)return integration;
    const x = object(body), [kind, id, action] = path.split('/').filter(Boolean);
    if(kind==='projects'&&id&&action==='github'){ensure(method==='POST','METHOD_NOT_ALLOWED','GitHub 设置需要 POST',405);const parts=path.split('/').filter(Boolean);ensure(parts.length===3||parts.length===4&&parts[3]==='retry','NOT_FOUND','GitHub 路径不存在',404);return parts[3]==='retry'?app.github.retry(USER,id,x):app.github.configure(USER,id,x);}
    if(kind==='sessions'&&id&&action==='permissions'){ensure(method==='POST','METHOD_NOT_ALLOWED','权限设置只接受 POST',405);return app.sessionPermissions.set(USER,id,x);}
    if(kind==='sessions'&&id&&action==='permission-actions'){const parts=path.split('/').filter(Boolean);ensure(method==='POST'&&parts.length===5&&parts[4]==='decide','METHOD_NOT_ALLOWED','审批只接受 decide POST',405);return app.sessionPermissions.decide(USER,id,parts[3],x);}
    if(kind==='research-continuations'&&id){ensure(method==='POST','METHOD_NOT_ALLOWED','任务控制只接受 POST',405);return app.researchAutomation.control(USER,id,x);}
    if(kind==='sessions'&&id&&action==='host-access'){ensure(method==='POST','METHOD_NOT_ALLOWED','宿主权限设置只接受 POST',405);const {enabled,...input}=x;ensure(typeof enabled==='boolean','INVALID_INPUT','enabled 必须为布尔值');return enabled?app.hostAccess.enable(USER,id,input):app.hostAccess.revoke(USER,id,input);}
    const research = writeCampaignRoute(app, path, x);
    if (research !== undefined) return research;
    if (kind === 'projects' && id && action === 'text-evidence') return app.textEvidence.configure(USER,id,x);
    if (kind === 'projects' && id && action === 'git-enable') {ensure(Object.keys(x).length===0,'INVALID_INPUT','启用 Git 不接受额外字段',400);return app.git.enable(USER,id);}
    if (kind === 'projects' && id && action === 'git-retry') {ensure(Object.keys(x).length===1&&'operationId' in x,'INVALID_INPUT','恢复需要 operationId',400);return app.git.retry(USER,id,text(x.operationId,'operationId',100));}
    if (kind === 'change-proposals' && id && action === 'apply') return app.changes.apply(USER,id);
    if (path === '/projects/import')
        return app.projects.importDirectory(USER, x);
    if (path === '/projects')
        return app.projects.create(USER, x);
    if (kind === 'projects' && id) {
        if(action==='purge'){ensure(method==='POST','METHOD_NOT_ALLOWED','清理请求只接受POST',405);return app.projects.purge(USER,id,x,randomUUID());}
        if (action === 'collaboration-settings') {
            const p = app.projects.settings(USER, id, x);
            if (!p.settings.enabled)
                for (const t of app.store.list('team', id))
                    app.teams.disable(USER, t.id);
            return p;
        }
        if (action === 'archive'||action==='unarchive'||action==='trash'||action==='restore') {
            ensure(method==='POST'&&path===`/projects/${id}/${action}`&&Object.keys(x).length===1&&'expectedVersion' in x,'INVALID_INPUT','生命周期变更只接受 POST expectedVersion');
            return app.projects[action](USER,id,integer(x.expectedVersion,'expectedVersion',1));
        }
        if (!action)
            return app.projects.update(USER, id, x);
    }
    if (path === '/sessions'){
        const session=app.sessions.create(USER, text(x.projectId, 'projectId', 100), x);app.sessionPermissions.initialize(session.id);return session;
    }
    if (kind === 'sessions' && id) {
        if(action==='queue'){ensure(method==='POST','INVALID_INPUT','队列操作只接受 POST');return app.sessions.queueAction(USER,id,x);}
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
            return app.sessions.selectModel(USER,id,x);
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
    if (kind === 'approvals' && id && action === 'decide'){
        ensure(app.store.get('approval',id).subjectKind!=='session-action','SESSION_ACTION_DECISION_REQUIRED','会话操作请从对应会话权限审批',403);
        return app.approvals.decide(USER, id, integer(x.expectedVersion, 'expectedVersion', 1), bool(x.approved, 'approved'));
    }
    if (path === '/claims')
        return app.evidence.proposeClaim(USER, text(x.projectId, 'projectId', 100), text(x.statement, 'statement', 10000), strings(x.evidenceIds, 'evidenceIds'), strings(x.limitations ?? [], 'limitations'));
    if (kind === 'claims' && id && action === 'decide')
        return app.evidence.decideClaim(USER, id, integer(x.expectedVersion, 'expectedVersion', 1), oneOf(x.status, ['accepted', 'rejected', 'disputed'] as const, 'status'));
    if (path === '/settings/model')
        return app.sessions.configure(USER, x);
    throw new DomainError('NOT_FOUND', '此操作未实现', 404);
}
