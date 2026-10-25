import {recordAttachmentRead} from '../../research-workflows/attachment-inputs.js';
import {prepareTaskModels,inspectThinkingPolicy,type PreparedTaskModels} from '../../pi-adapter/thinking-policy.js';
import {readCatalog,readSkill,inspectSessionSkills,selectSessionSkills} from '../../skills/runtime.js';
import {attachmentScope,readAttachment} from '../../pi-adapter/attachments.js';
import {digest} from '../../storage/store.js';
import {routePaperId, parseSearch} from '../../connectors/contracts.js';
import type {ResearchApp} from '../../research-app.js';
import type {Actor, Session, Row, Task, TaskAttempt, Project,RunIntent,ResearchBriefRef} from '../../domain/types.js';
import {ensure,DomainError} from '../../domain/errors.js';
import {publicRecords} from '../../domain/public-record.js';
import {text, object, integer} from '../validation.js';
import {CONTINUATION_TOOLS,APPROVAL_RESUME_TOOLS} from '../../policy/research-automation.js';
import {interactiveCoordinator,scope, userOnly, toolAllowed, AUTOMATION_TOOLS} from '../../policy/permissions.js';
import {assertProjectWritable,assertProjectReadable} from '../../policy/lifecycle.js';
import {readText, writeText, listFiles} from '../../workspace/files.js';
import {settleSourcePreparationReceipt} from '../../workspace/source-prepare-recovery.js';
import {INPUT_SCHEMAS} from './inputs.js';
import {OUTPUT_SCHEMAS} from './outputs.js';
import {validateSchema, type JsonSchema} from './schema.js';
import {assertWorkspaceReady} from '../../workspace/git-service.js';
import {discoveryContext,discoveryScope} from '../../policy/discovery-grant-validation.js';
import {assertRunGrantActor,assertRunGrantTaskSubmission} from '../../policy/run-grant-validation.js';
import {ComputeConnectionService,localHardware} from '../../runners/compute-connections.js';
import {currentDockerContext} from '../../runners/gpu.js';
import type {Corpus,Configuration} from '../../text-evidence/service.js';
import type {DocumentVersion} from '../../documents/types.js';
import {assertCorpusDocument} from '../../policy/text-corpus-grants.js';
import {assertDiscoveryDocument} from '../../policy/discovery-grant-validation.js';
import {assertSyntheticFixture,type SyntheticFixtureRef} from '../../research-workflows/synthetic-fixtures.js';

export interface OperationScope {
    projectId: string;
    sessionId?: string;
    idempotencyKey?: string;
    signal?: AbortSignal;
    /** Host-only binding for fixed execution; never a transport or model argument. */
    approvedActionId?: string;
    /** Only trusted legacy adapters provide these, never request JSON. */
    legacy?: {scope: string; input: unknown};
}
interface OperationContext extends OperationScope {
    preparedTaskModels?:PreparedTaskModels;
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
const publicationAccess=(c:OperationContext,name:string)=>{if(c.actor.type==='agent')c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,name));else userOnly(c.actor);};
function paperReplay(c: OperationContext, x: Record<string, unknown>) {
    const target = routePaperId(x.id, x.source), serviceScope = `connector-paper:${c.projectId}:${c.actor.sessionId ?? 'user'}:${c.actor.attemptId ?? 'root'}`;
    const preferred = c.actor.type === 'agent' ? `${c.session!.id}:${c.idempotencyKey}` : c.idempotencyKey!;
    const grant=discoveryContext(c.app.store,c.projectId,c.actor,{kind:'retrieve',target:{...target,format:'provider-text'}},preferred);
    const keys = [...new Set([preferred, ...(c.actor.type === 'user' ? [`http:${c.idempotencyKey}`] : [])])];
    const cached = keys.map(key => ({key, result: c.app.store.operationResult<unknown>(discoveryScope(serviceScope,grant), key, target)})).filter(entry => entry.result.found);
    ensure(new Set(cached.map(entry => entry.result.found && digest(entry.result.value))).size <= 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本已有不同论文读取结果，需人工核对');

    return {key: cached[0]?.key ?? preferred, completed: cached.length > 0};
}

function authorizeRegistered(c: OperationContext, name: string, x: Record<string, unknown>) {
    c.app.textCorpusGrants.authorizeContent(c.actor,c.projectId,name,x);
    if (name === 'collaboration_plan_submit' || name === 'agent_delegate') c.app.teams.validatePlan(c.actor,c.session!.id,x);
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
        if (c.actor.wakeupId&&!c.app.automaticApprovals.isContinuation(c.actor)) {
            const w = c.app.wakeups.assertActive(c.actor);
            ensure(w.sourceKind === 'campaign-result' && w.ownerId === campaign.id, 'AUTOMATION_SCOPE_DENIED', '只能分析本次通知所属研究活动', 403);
        }
    }
}
function externalReplay(c: OperationContext, name: string, x: Record<string, unknown>) {
    // Local archive reconstruction is safe; ExportService publishes once using its durable receipt.
    if (['report_export','compute_target_probe','docker_connection_probe','document_import','document_parser_configure','document_parse_prepare','skill_package_import','manuscript_create','publication_configure','publication_prepare','publication_submit'].includes(name)) return {key:c.idempotencyKey!,completed:true};
    if (name === 'paper_read') return paperReplay(c, x);
    const discover = name === 'literature_discover';
    const serviceScope = discover ? `connector-search:${c.projectId}:${c.actor.sessionId ?? 'user'}:${c.actor.attemptId ?? 'root'}` : `literature:${c.projectId}`;
    const request = discover ? parseSearch(x) : {projectId: c.projectId, query: x.query, limit: x.limit ?? 8};
    const preferred = c.actor.type === 'agent' ? `${c.session!.id}:${c.idempotencyKey}` : c.idempotencyKey!;
    const grant=discoveryContext(c.app.store,c.projectId,c.actor,{kind:'search',search:discover?request as ReturnType<typeof parseSearch>:parseSearch({query:x.query,sources:['crossref'],limit:x.limit??8})},preferred);
    ensure(discover||!grant?.taskId,'DISCOVERY_TASK_OPERATION_DENIED','任务级发现授权只允许固定 Connector 检索入口');
    const keys = [...new Set([preferred, ...(c.actor.type === 'user' ? [`${discover ? 'http' : 'user'}:${c.idempotencyKey}`] : [])])];
    const cached = keys.map(key => ({key, result: c.app.store.operationResult<unknown>(discoveryScope(serviceScope,grant), key, request)})).filter(entry => entry.result.found);
    ensure(new Set(cached.map(entry => entry.result.found && digest(entry.result.value))).size <= 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本存在不同检索结果，需人工核对');
    return {key: cached[0]?.key ?? preferred, completed: cached.length > 0};
}

function executeRegistered(c: OperationContext, name: string, x: Record<string, unknown>): unknown {
    const {app, actor, session, projectId: pid} = c;
        const ownOrProject = () => { ensure(!x.source || x.source === 'session' || x.source === 'project' && (session?.role ?? 'coordinator') === 'coordinator', 'SCOPE_DENIED', '助手只能访问自己的工作区', 403); return app.store.paths.physical(x.source === 'project' ? app.projects.read(actor, pid).workspace : session!.workspace); };
        if (name.startsWith('campaign_')) {
            const campaignId = text(x.campaignId, 'campaignId', 100);
            if (actor.wakeupId&&!app.automaticApprovals.isContinuation(actor)) {
                const w = app.wakeups.assertActive(actor);
                ensure(w.sourceKind === 'campaign-result' && w.ownerId === campaignId, 'AUTOMATION_SCOPE_DENIED', '只能分析本次通知所属研究活动', 403);
            }
            const c = app.campaigns.get(actor, campaignId);
            app.campaigns.coordinator(actor, c);
            if (name === 'campaign_inspect') return { campaign: c, members: app.campaigns.members(actor, c.id), rounds: app.campaigns.rounds(actor, c.id), observations: app.campaigns.observations(actor, c.id), decisions: app.campaigns.decisions(actor, c.id),plans:app.store.list('experiment-plan-revision',pid).filter(p=>p.campaignId===c.id),candidates:app.store.list('research-candidate',pid).filter(p=>p.campaignId===c.id) };
            if (name === 'campaign_enroll') return app.campaigns.enroll(actor, c.id, x);
            if (name === 'campaign_decision_submit') return app.decisions.propose(actor, c.id, x);
        }
        switch (name) {
            case 'text_evidence_search': return app.textEvidence.search(actor,pid,x);
            case 'research_skill_list': return session?readCatalog(app,{...actor,sessionId:session.id},pid):app.skills.bundleCatalog(pid,'coordinator',app.skills.configuration(pid).bundleId);
            case 'research_skill_read': return session?readSkill(app,{...actor,sessionId:session.id},pid,text(x.skillId,'skillId',100),x.resource as string|undefined):app.skills.bundleRead(pid,'coordinator',app.skills.configuration(pid).bundleId,text(x.skillId,'skillId',100),x.resource as string|undefined);
            case 'connector_status': return {...app.connectors.settings(actor,pid),observations:app.connectors.observations(actor,pid)};
            case 'session_notice_read': {
                const m = app.sessions.messages(actor, session!.id).find(m => m.id === text(x.messageId, 'messageId', 100));
                ensure(m && m.role === 'system' && m.origin !== 'automation', 'SCOPE_DENIED', '只能读取自己的宿主通知', 403);
                const cursor = integer(x.cursor ?? 0, 'cursor', 0, m.content.length), end = Math.min(cursor + 16000, m.content.length);
                return {messageId: m.id, content: m.content.slice(cursor, end), cursor: end, complete: end === m.content.length};
            }
            case 'project_inspect': {
                const inspect=()=>{
                const project = app.projects.read(actor, pid);
                const grant = actor.taskId ? app.teams.resources(actor) : actor.wakeupId&&!actor.continuationId ? app.wakeups.resources(actor) : null;
                const runs = app.store.list('run', pid).filter(r => !grant || grant.runIds.has(r.id));
                const campaigns = !actor.taskId && !actor.wakeupId && session?.role === 'coordinator' && !session.taskId && session.state !== 'archived'
                    ? app.store.list('campaign', pid).filter(c => c.rootSessionId === session.id).map(({id, goal, state}) => ({id, goal, state})) : [];
                const interactive=!actor.taskId&&(!actor.wakeupId||!!actor.continuationId)&&session?.role==='coordinator'&&!session.taskId&&session.state!=='archived';
                if(x.runIntentId!==undefined){ensure(interactive,'RUN_SESSION_REQUIRED','运行意向回查需要当前交互主会话');const selected=app.store.get<RunIntent>('run-intent',x.runIntentId as string,pid);ensure(selected.rootSessionId===session!.id,'RUN_SESSION_DENIED','运行意向不属于当前对话',403);}
                const intentRows=interactive?app.store.db.prepare(`SELECT i.id,json_extract(i.data,'$.experimentId') experimentId,json_extract(i.data,'$.approvalId') approvalId,json_extract(i.data,'$.manifestDigest') manifestDigest,json_extract(i.data,'$.status') status,json_extract(i.data,'$.runId') runId,json_extract(i.data,'$.runGrant') runGrant,COALESCE(json_extract(a.data,'$.status'),'missing') approvalStatus FROM records i LEFT JOIN records a ON a.kind='approval' AND a.id=json_extract(i.data,'$.approvalId') AND a.project_id=i.project_id WHERE i.kind='run-intent' AND i.project_id=? AND json_extract(i.data,'$.rootSessionId')=?${x.runIntentId!==undefined?' AND i.id=?':''} ORDER BY CASE WHEN json_extract(i.data,'$.status')='prepared' THEN 0 ELSE 1 END,i.rowid DESC LIMIT 21`).all(pid,session!.id,...(x.runIntentId!==undefined?[x.runIntentId as string]:[])):[];
                const runIntents={items:intentRows.slice(0,20).map(i=>({id:String(i.id),experimentId:String(i.experimentId),approvalId:String(i.approvalId),manifestDigest:String(i.manifestDigest),status:i.status,approvalStatus:i.approvalStatus,...(i.runId?{runId:String(i.runId)}:{}),...(i.runGrant?{runGrant:JSON.parse(String(i.runGrant))}:{})})),hasMore:intentRows.length>20};
                const projectFiles=interactive?listFiles(app.store.paths.physical(project.workspace)):null;
                const projectSource=projectFiles?{files:projectFiles.slice(0,50).map(f=>({path:f.path,size:f.size})),hasMore:projectFiles.length>50}:null;
                return {...(interactive?{thinkingPolicy:inspectThinkingPolicy(app.context,session!.model)}:{}),projectSource, textCorpus: app.textEvidence.status(actor,pid), project: { id: pid, name: project.name, collaborationEnabled: project.settings.enabled }, experiments: app.store.list('experiment', pid).filter(e => !grant || runs.some(r => r.experimentId === e.id)).map(e => ({ id: e.id, title: e.title, lifecycle: e.lifecycle, revision: e.revision })), runs: runs.map(r => ({ id: r.id, state: r.state, integrity: r.integrity, evidenceIds: (r.evidenceIds as string[]).filter(id => !grant || grant.evidenceIds.has(id)) })), evidenceIds: app.store.list('evidence', pid).filter(e => !grant || grant.evidenceIds.has(e.id)).map(e => e.id), campaigns, runIntents,...(x.githubCommit!==undefined?{github:app.github.inspectCommit(actor,pid,x.githubCommit as string)}:{}) };
                };return x.githubCommit!==undefined?app.store.readSnapshot(inspect):inspect();
            }
            case 'workspace_list': return listFiles(ownOrProject());
            case 'artifact_read': {
                const {artifact,bytes}=app.evidence.read(actor,text(x.artifactId,'artifactId',100));
                const limit=bytes.length>2*1024*1024?app.developmentReviews.archivedLogLimit(actor,pid,artifact.id)??2*1024*1024:2*1024*1024;
                ensure(!bytes.includes(0)&&bytes.length<=limit,'ARTIFACT_TEXT_REQUIRED','产物不是可读文本或超过当前读取范围',415);
                let content:string;try{content=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw new DomainError('ARTIFACT_TEXT_REQUIRED','产物不是有效 UTF-8 文本',415);}
                const cursor=integer(x.cursor??0,'cursor',0,content.length),end=Math.min(cursor+16000,content.length);
                return {artifactId:artifact.id,digest:artifact.digest,title:artifact.title,mediaType:artifact.mediaType,content:content.slice(cursor,end),cursor:end,complete:end===content.length};
            }
            case 'artifact_create': return app.evidence.put(pid, text(x.title, 'title', 200), Buffer.from(text(x.content, 'content', 2 * 1024 * 1024, true)), text(x.mediaType ?? 'text/plain', 'mediaType', 100), actor.type === 'user' ? 'user' : `agent:${session!.id}`, actor.taskId ? { taskId: actor.taskId } : actor.wakeupId ? { wakeupId: actor.wakeupId } : {});
            case 'evidence_register': return app.evidence.register(actor, pid, text(x.artifactId, 'artifactId', 100), x.exactQuote===undefined?integer(x.start, 'start', 0):x.start as number|undefined, x.exactQuote===undefined?integer(x.end, 'end', 1):x.end as number|undefined, x.exactQuote===undefined?text(x.description, 'description', 2000):'原文片段；解释与研究断言未核验','artifact',undefined,x.exactQuote as string|undefined);
            case 'evidence_read': return app.evidence.verify(pid, text(x.evidenceId, 'evidenceId', 100), false);
            case 'experiment_plan_submit': return app.experiments.create(actor, pid, x, session?.id);
            case 'run_inspect': {
                const runId=text(x.runId,'runId',100);
                if(x.includeScheduling===true)return app.store.readSnapshot(()=>({...app.store.get('run',runId,pid),scheduling:app.compute.inspectRun(actor,pid,runId)}));
                return app.store.get('run',runId,pid);
            }
            case 'run_logs':
                app.store.get('run', text(x.runId, 'runId', 100), pid);
                return app.runs.logs(actor, x.runId as string, integer(x.cursor ?? 0, 'cursor', 0,Number.MAX_SAFE_INTEGER),x.stream as 'stdout'|'stderr'|undefined,x.identity as string|null|undefined);
            case 'approval_request': return app.store.list('approval', pid).filter(a => a.status === 'pending');
            case 'collaboration_plan_submit':
            case 'agent_delegate': return app.teams.create(actor,session!.id,x,true,undefined,undefined,c.preparedTaskModels);
            case 'task_inspect': {
                const tasks = app.teams.tasks(actor, session?.teamId ?? text(x.teamId, 'teamId', 100));
                const grant = actor.taskId ? app.teams.resources(actor) : actor.wakeupId&&!actor.continuationId ? app.wakeups.resources(actor) : null;
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
    make('workflow_confirm',{idempotencyPolicy:'key-required',requiresSession:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,input)=>c.app.workflowContinuations.confirm(c.actor,c.projectId,c.session!.id,input)}),
    make('research_action_prepare',{requiresSession:true,idempotencyPolicy:'key-required',authorize:c=>{c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'research_action_prepare'));},preconditions:noPrecondition,execute:(c,x)=>c.app.researchActions.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('research_action_inspect',{requiresSession:true,idempotencyPolicy:'read-only',authorize:c=>{c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'research_action_inspect'));},preconditions:noPrecondition,execute:(c,x)=>c.app.researchActions.inspect(c.actor,c.projectId,c.session!.id,x.requestId as string)}),
    make('research_action_decide',{requiresSession:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.researchActions.decide(c.actor,c.projectId,c.session!.id,x)}),
    make('research_history_list',{idempotencyPolicy:'read-only',authorize:c=>{if(c.actor.type==='agent')c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'research_history_list'));else userOnly(c.actor);},preconditions:noPrecondition,execute:(c,x)=>c.app.store.readSnapshot(()=>{
        const kinds={documents:'document-version',evidence:'evidence',claims:'claim',reports:'report'} as const,kind=x.kind as keyof typeof kinds,cursor=(x.cursor as number|undefined)??0,limit=(x.limit as number|undefined)??20;
        const parseResults=new Map<string,string[]>(),pmcAvailable=new Set<string>();
        if(kind==='documents'){
            const config=c.app.store.maybe<Configuration>('text-evidence-settings',c.projectId),corpus=config?.enabled&&config.corpusId?c.app.store.maybe<Corpus>('text-corpus',config.corpusId):undefined;
            if(config?.projectId===c.projectId&&corpus?.projectId===c.projectId&&digest({projectId:c.projectId,sources:corpus.sources,documents:corpus.documents,parserVersion:corpus.parserVersion,...(corpus.pmcDocuments?{pmcDocuments:corpus.pmcDocuments}:{})})===corpus.id){
                for(const ref of corpus.documents??[])try{assertCorpusDocument(c.app.store,c.projectId,ref);const ids=parseResults.get(ref.documentVersionId)??[];if(!ids.includes(ref.parseResultId)&&ids.length<30)ids.push(ref.parseResultId);parseResults.set(ref.documentVersionId,ids);}catch{}
                for(const ref of corpus.pmcDocuments??[])try{const d=c.app.store.get<DocumentVersion>('document-version',ref.documentVersionId,c.projectId);ensure(digest(d)===ref.documentDigest,'PMC_SOURCE_STALE','固定 PMC 文档已改变');assertDiscoveryDocument(c.app.store,c.projectId,d);pmcAvailable.add(d.id);}catch{}
            }
        }
        const rows=c.app.store.db.prepare('SELECT rowid,data FROM records WHERE kind=? AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?').all(kinds[kind],c.projectId,cursor,limit+1),page=rows.slice(0,limit),nextCursor=page.length?Number(page.at(-1)!.rowid):cursor;
        ensure(Number.isSafeInteger(nextCursor),'HISTORY_CURSOR_UNSAFE','资料与成果游标超出安全范围',500);
        return {items:page.map(entry=>{
            const record=JSON.parse(String(entry.data));
            switch(kind){
                case 'documents':return {id:record.id,title:record.title,contentKind:record.contentKind,acquiredAt:record.acquiredAt,source:{provider:record.source.provider,requestedVersion:record.source.requestedVersion,reportedVersion:record.source.reportedVersion},parseResultIds:parseResults.get(record.id)??[],textGrantAvailable:parseResults.has(record.id)||pmcAvailable.has(record.id)};
                case 'evidence':return {id:record.id,type:record.type,createdAt:record.createdAt,documentVersionId:record.document?.documentVersionId??record.providerText?.documentVersionId,parseResultId:record.document?.parseResultId};
                case 'claims':return {id:record.id,version:record.version,status:record.status,validity:record.validity,createdAt:record.createdAt,evidenceIds:record.evidenceIds};
                case 'reports':return {id:record.id,title:record.title??c.app.store.get<{title:string}>('artifact',record.artifactId,c.projectId).title,createdAt:record.createdAt,updatedAt:record.updatedAt,formatVersion:record.formatVersion===1?1:0,runCount:record.runIds?.length??0,claimCount:record.claimIds?.length??0};
            }
        }),cursor:nextCursor,hasMore:rows.length>limit};
    })}),
    make('research_task_checkpoint',{requiresSession:true,idempotencyPolicy:'key-required',authorize:c=>{c.app.researchAutomation.assertActor(c.actor);},preconditions:noPrecondition,execute:(c,x)=>c.app.researchAutomation.checkpoint(c.actor,x)}),
    make('host_execute',{requiresSession:true,asynchronous:true,idempotencyPolicy:'key-required',authorize:(c)=>{c.app.hostAccess.assertAgent(c.actor);},preconditions:(c)=>{c.app.hostAccess.assertAgent(c.actor);},execute:(c,x)=>c.app.hostAccess.execute(c.actor,x,c.idempotencyKey!)}),
    make('research_brief_save',{idempotencyPolicy:'key-required',requiresSession:true,authorize:c=>{c.app.researchBriefs.inspect(c.actor,c.projectId,c.session!.id);},preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.researchBriefs.save(c.actor,c.projectId,c.session!.id,x)}),
    make('research_method_compile',{idempotencyPolicy:'read-only',requiresSession:true,authorize:c=>{c.app.researchBriefs.inspect(c.actor,c.projectId,c.session!.id);},preconditions:noPrecondition,execute:(c,x)=>c.app.methodContracts.compile(c.actor,c.projectId,c.session!.id,x)}),
    make('research_fixture_prepare',{idempotencyPolicy:'key-required',requiresSession:true,authorize:c=>{c.app.researchBriefs.inspect(c.actor,c.projectId,c.session!.id);},preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.syntheticFixtures.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('research_brief_inspect',{idempotencyPolicy:'read-only',requiresSession:true,authorize:noPrecondition,preconditions:noPrecondition,execute:(c,x)=>c.app.researchBriefs.inspect(c.actor,c.projectId,c.session!.id,x.briefId as string|undefined)}),
    make('research_brief_confirm',{idempotencyPolicy:'key-required',requiresSession:true,authorize:(c,x)=>{userOnly(c.actor);c.app.researchBriefs.inspect(c.actor,c.projectId,c.session!.id,x.briefId as string);},preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.researchBriefs.confirm(c.actor,c.projectId,c.session!.id,x)}),
    make('text_corpus_grant_prepare',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.textCorpusGrants.prepare(c.actor,c.projectId,x)}),
    make('text_corpus_grant_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.textCorpusGrants.inspect(c.actor,c.projectId,x.grantId as string)}),
    make('text_corpus_grant_activate',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.textCorpusGrants.activate(c.actor,c.projectId,x)}),
    make('text_corpus_grant_revoke',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.textCorpusGrants.revoke(c.actor,c.projectId,x)}),
    make('campaign_plan_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.researchPlans.inspect(c.actor,c.projectId,x.planRevisionId as string)}),
    make('campaign_candidate_prepare',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.researchPlans.prepareCandidate(c.actor,c.projectId,x)}),
    make('campaign_candidate_attach',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.researchPlans.attachCandidate(c.actor,c.projectId,x)}),
    make('campaign_comparison',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.researchPlans.comparison(c.actor,c.projectId,x)}),
    make('publication_review_prepare',{idempotencyPolicy:'key-required',authorize:c=>publicationAccess(c,'publication_review_prepare'),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.publicationReviews.prepare(c.actor,c.projectId,x)}),
    make('publication_review_inspect',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_review_inspect'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationReviews.inspect(c.actor,c.projectId,x.reviewId as string)}),
    make('publication_review_list',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_review_list'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationReviews.list(c.actor,c.projectId,{resultId:x.resultId as string})}),
    make('publication_citation_check',{idempotencyPolicy:'key-required',authorize:(c,x)=>{publicationAccess(c,'publication_citation_check');c.app.publicationBuilds.citationInputs(c.actor,c.projectId,x);},preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.publicationBuilds.citationCheck(c.actor,c.projectId,x,c.validate)}),
    make('publication_templates',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_templates'),preconditions:noPrecondition,execute:c=>c.app.publicationBuilds.templates(c.actor,c.projectId)}),
    make('publication_template_import',{idempotencyPolicy:'key-required',authorize:c=>publicationAccess(c,'publication_template_import'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationTemplates.import(c.actor,x,c.idempotencyKey!,c.validate,c.projectId)}),
    make('publication_template_inspect',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_template_inspect'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationTemplates.inspect(c.actor,x.templateId as string,c.projectId)}),
    make('publication_template_read',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_template_read'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationTemplates.read(c.actor,x.templateId as string,x.path as string,c.projectId)}),
    make('manuscript_create',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>publicationAccess(c,'manuscript_create'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.createRevision(c.actor,c.projectId,x,c.validate,c.idempotencyKey,c.session?.id)}),
    make('manuscript_list',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'manuscript_list'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.revisions(c.actor,c.projectId,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('manuscript_inspect',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'manuscript_inspect'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.revision(c.actor,c.projectId,x.revisionId as string)}),
    make('manuscript_source_read',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'manuscript_source_read'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.readSource(c.actor,c.projectId,x.revisionId as string,x.path as string,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('publication_status',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_status'),preconditions:noPrecondition,execute:c=>c.app.publicationBuilds.status(c.actor,c.projectId)}),
    make('publication_configure',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.configure(c.actor,x,c.validate,c.idempotencyKey)}),
    make('publication_prepare',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>publicationAccess(c,'publication_prepare'),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.publicationBuilds.prepare(c.actor,c.projectId,x,c.idempotencyKey,c.validate)}),
    make('publication_submit',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.submit(c.actor,c.projectId,x.jobId as string)}),
    make('publication_inspect',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_inspect'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.inspect(c.actor,c.projectId,x.jobId as string)}),
    make('publication_cancel',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.cancel(c.actor,c.projectId,x.jobId as string)}),
    make('publication_page_image_read',{idempotencyPolicy:'key-required',requiresSession:true,authorize:c=>c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'publication_page_image_read')),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.readPageImage(c.actor,c.projectId,x.publicationResultId as string,x.pageNumber as number)}),
    make('publication_result',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_result'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.result(c.actor,c.projectId,x.resultId as string)}),
    make('publication_build_list',{idempotencyPolicy:'read-only',authorize:c=>publicationAccess(c,'publication_build_list'),preconditions:noPrecondition,execute:(c,x)=>c.app.publicationBuilds.jobs(c.actor,c.projectId,x)}),
    make('skill_package_import',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.import(c.actor,c.projectId,x,c.idempotencyKey!)}),
    make('skill_package_upload',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.upload(c.actor,c.projectId,x,c.idempotencyKey!)}),
    make('skill_package_enable',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.enable(c.actor,c.projectId,x,c.idempotencyKey!)}),
    make('skill_package_list',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:c=>c.app.skills.catalog(c.actor,c.projectId)}),
    make('skill_package_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.inspect(c.actor,c.projectId,x.revisionId as string)}),
    make('skill_package_read',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.readRevision(c.actor,c.projectId,x.revisionId as string,x.resource as string|undefined)}),
    make('skill_package_review',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.review(c.actor,c.projectId,x,c.idempotencyKey)}),
    make('skill_package_revoke',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.revoke(c.actor,c.projectId,x,c.idempotencyKey)}),
    make('skill_package_delete',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.delete(c.actor,c.projectId,x,c.idempotencyKey)}),
    make('skill_bundle_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.skills.configure(c.actor,c.projectId,x,c.idempotencyKey)}),
    make('skill_session_select',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>selectSessionSkills(c.app,c.actor,c.projectId,x)}),
    make('skill_preflight',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>inspectSessionSkills(c.app,c.actor,c.projectId,x.sessionId as string)}),
    make('literature_task_create',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.literatureTasks.create(c.actor,c.projectId,x)}),
    make('literature_task_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.literatureTasks.inspect(c.actor,c.projectId,x.taskId as string)}),
    make('literature_task_cancel',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.literatureTasks.cancel(c.actor,c.projectId,x.taskId as string)}),
    make('literature_task_retry',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.literatureTasks.retry(c.actor,c.projectId,x.taskId as string,x.expectedVersion as number)}),
    make('document_import',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documents.import(c.actor,c.projectId,x as unknown as Parameters<typeof c.app.documents.import>[2],c.idempotencyKey!)}),
    make('document_from_paper',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documents.createFromPaper(c.actor,c.projectId,x.paperReadId as string,c.idempotencyKey!)}),
    make('document_list',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documents.list(c.actor,c.projectId,x)}),
    make('document_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documents.inspect(c.actor,c.projectId,x.documentVersionId as string)}),
    make('document_parser_status',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:c=>c.app.documentParsing.status(c.actor,c.projectId)}),
    make('document_parser_configure',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.configure(c.actor,x,c.validate,c.idempotencyKey!)}),
    make('document_parse_prepare',{asynchronous:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.prepare(c.actor,c.projectId,x,c.idempotencyKey!)}),
    make('document_parse_submit',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.submit(c.actor,c.projectId,x.jobId as string)}),
    make('document_parse_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.inspect(c.actor,c.projectId,x.jobId as string)}),
    make('document_parse_cancel',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.cancel(c.actor,c.projectId,x.jobId as string)}),
    make('document_page_image_read',{idempotencyPolicy:'key-required',requiresSession:true,authorize:c=>c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'document_page_image_read')),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.readPageImage(c.actor,c.projectId,x)}),
    make('document_pages',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.pages(c.actor,c.projectId,x.parseResultId as string,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('document_page_read',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.documentParsing.readPage(c.actor,c.projectId,x.parseResultId as string,x.pageNumber as number,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('document_evidence_register',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.evidence.registerDocument(c.actor,c.projectId,x as unknown as Parameters<typeof c.app.evidence.registerDocument>[2])}),
    make('local_runtime_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.localRuntimes.configure(c.actor,x)}),
    make('execution_environment_list',{idempotencyPolicy:'read-only',authorize:c=>{if(c.actor.type==='agent'){if(c.actor.continuationId)c.app.researchAutomation.assertActor(c.actor);else c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'execution_environment_list'));}else userOnly(c.actor);},preconditions:noPrecondition,execute:c=>{const runtimes=c.app.localRuntimes.list(),currentDockerContext=c.app.computeMonitor.currentDockerContext;return {local:{platform:process.platform,hostId:runtimes[0]?.hostId??'unconfigured',runtimes,runTargets:runtimes.map(r=>({runner:'local',localRuntimeId:r.id})),status:runtimes.length?'configured':'unconfigured',hardware:localHardware(),isolation:'none',resourceEnforcement:'advisory',networkIsolation:false},connections:{...new ComputeConnectionService(c.app.context).list(c.actor,c.app.sshTargets),...(currentDockerContext?{currentDockerContext}:{})},gpuTargets:c.app.gpus.list(),sshTargets:c.app.sshTargets.list({type:'user'})};}}),
    make('docker_connection_probe',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:async(c,x)=>{const connections=new ComputeConnectionService(c.app.context);let context=x.context as string|undefined;try{context??=currentDockerContext();await c.app.compute.probeContext(c.actor,context,c.validate);}catch(error){if((error as {code?:string}).code!=='COMPUTE_TARGET_UNAVAILABLE')throw error;if(!context){context='current';const attempt=connections.begin('docker:'+context);connections.finish('docker:'+context,attempt,{status:'unavailable',errorCode:'COMPUTE_TARGET_UNAVAILABLE'});}}return connections.docker(context);}}),
    make('ssh_target_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.sshTargets.inspect(c.actor,x.id as string)}),
    make('ssh_target_preferences_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>new ComputeConnectionService(c.app.context).configurePreferences(c.actor,x,c.app.sshTargets)}),
    make('gpu_target_probe',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.gpus.probe(c.actor,x)}),
    make('ssh_target_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.sshTargets.configure(c.actor,x)}),
    make('ssh_target_challenge',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.sshTargets.challenge(c.actor,x)}),
    make('ssh_target_confirm',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.sshTargets.confirm(c.actor,x)}),
    make('ssh_target_setup',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.sshTargets.setup(c.actor,x)}),
    make('ssh_target_probe',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.sshTargets.probe(c.actor,x.id as string)}),
    make('compute_target_probe',{idempotencyPolicy:'key-required',asynchronous:true,authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.compute.probeContext(c.actor,x.context as string,c.validate)}),
    make('compute_queue_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.compute.inspect(c.actor,c.projectId,x)}),
    make('compute_capacity_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.compute.configure(c.actor,x)}),
    make('agent_capacity_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:c=>c.app.agentAdmission.inspect(c.actor,c.projectId)}),
    make('agent_capacity_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.agentAdmission.configure(c.actor,x)}),
    make('session_list',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.sessions.list(c.actor,c.projectId,x)}),
    make('session_view',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:recordScope('session','sessionId'),execute:(c,x)=>{const {sessionId,...paging}=x;return c.app.sessions.view(c.actor,sessionId as string,paging);}}),
    make('session_message_read',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:recordScope('session','sessionId'),execute:(c,x)=>{const {sessionId,...paging}=x;return c.app.sessions.messageRead(c.actor,sessionId as string,paging);}}),
    make('session_attachment_read',{idempotencyPolicy:'read-only',requiresSession:true,authorize:(c,x)=>{if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'session_attachment_read');attachmentScope(c.app.store,c.actor,c.session!,x,pair=>c.app.documentParsing.attachmentMetadata(c.actor,c.session!,pair));},preconditions:noPrecondition,execute:(c,x)=>readAttachment(c.app.store,c.actor,c.session!,x,pair=>c.app.documentParsing.attachmentMetadata(c.actor,c.session!,pair))}),
    make('model_http_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.modelHttp.inspect(c.actor,c.projectId,x)}),
    make('model_http_configure',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.modelHttp.configure(c.actor,x,c.projectId)}),
    make('report_create',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:c=>assertProjectWritable(c.app.store,c.projectId),execute:(c,x)=>c.app.reports.create(c.actor,c.projectId,x)}),
    make('report_list',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.reports.list(c.actor,c.projectId,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('report_inspect',{idempotencyPolicy:'read-only',authorize:(c,x)=>{userOnly(c.actor);recordScope('report','reportId')(c,x);},preconditions:noPrecondition,execute:(c,x)=>c.app.reports.inspect(c.actor,c.projectId,x.reportId as string)}),
    make('report_reference_read',{idempotencyPolicy:'read-only',authorize:(c,x)=>{userOnly(c.actor);recordScope('report','reportId')(c,x);},preconditions:noPrecondition,execute:(c,x)=>c.app.reports.readReference(c.actor,c.projectId,x.reportId as string,x.referenceId as string,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('report_export',{idempotencyPolicy:'key-required',asynchronous:true,authorize:(c,x)=>{userOnly(c.actor);recordScope('report','reportId')(c,x);},preconditions:noPrecondition,execute:(c,x)=>c.app.exports.create(c.actor,c.projectId,{reportId:x.reportId as string},c.idempotencyKey!,c.validate)}),
    make('formal_report_review_prepare',{idempotencyPolicy:'key-required',authorize:c=>{if(c.actor.type==='agent')c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'formal_report_review_prepare'));else userOnly(c.actor);},preconditions:noPrecondition,execute:(c,x)=>c.app.formalReportReviews.prepare(c.actor,c.projectId,x)}),
    make('formal_report_review_inspect',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.formalReportReviews.authorize(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.formalReportReviews.inspect(c.actor,c.projectId,x.reviewId as string)}),
    make('formal_report_review_source_read',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.formalReportReviews.inspect(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.formalReportReviews.sourceRead(c.actor,c.projectId,x.reviewId as string,x.path as string,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('development_review_prepare',{idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.development.inspect(c.actor,c.projectId,x.jobId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.developmentReviews.prepare(c.actor,c.projectId,x)}),
    make('development_review_inspect',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.developmentReviews.inspect(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.developmentReviews.inspect(c.actor,c.projectId,x.reviewId as string)}),
    make('development_review_source_list',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.developmentReviews.sourceList(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.developmentReviews.sourceList(c.actor,c.projectId,x.reviewId as string)}),
    make('development_review_source_read',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.developmentReviews.sourceList(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.developmentReviews.sourceRead(c.actor,c.projectId,x.reviewId as string,x.path as string,x.cursor as number|undefined,x.limit as number|undefined)}),
    make('reviewed_change_prepare',{idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.developmentReviews.inspect(c.actor,c.projectId,x.reviewId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.changes.prepareReviewed(c.actor,c.projectId,x)}),
    make('run_source_list',{idempotencyPolicy:'read-only',authorize:recordScope('run','runId'),preconditions:noPrecondition,execute:(c,x)=>c.app.runs.sourceList(c.actor,x.runId as string)}),
    make('run_source_read',{idempotencyPolicy:'read-only',authorize:recordScope('run','runId'),preconditions:noPrecondition,execute:(c,x)=>c.app.runs.sourceRead(c.actor,x.runId as string,x)}),
    make('workspace_history_inspect',{idempotencyPolicy:'read-only',requiresSession:true,authorize:(c)=>{c.app.git.inspect(c.actor,c.projectId,c.session!.id);},preconditions:noPrecondition,execute:c=>c.app.git.inspect(c.actor,c.projectId,c.session!.id)}),
    make('workspace_history_diff',{idempotencyPolicy:'read-only',requiresSession:true,authorize:(c)=>{c.app.git.inspect(c.actor,c.projectId,c.session!.id);},preconditions:noPrecondition,execute:c=>c.app.git.diff(c.actor,c.projectId,c.session!.id)}),
    make('workspace_history_commit',{idempotencyPolicy:'key-required',requiresSession:true,authorize:(c)=>{c.app.git.inspect(c.actor,c.projectId,c.session!.id);},preconditions:noPrecondition,execute:(c,x)=>c.app.git.commit(c.actor,c.projectId,c.session!.id,x)}),
    make('workspace_history_set_mode',{idempotencyPolicy:'key-required',requiresSession:true,authorize:(c)=>{c.app.git.inspect(c.actor,c.projectId,c.session!.id);},preconditions:noPrecondition,execute:(c,x)=>c.app.git.setMode(c.actor,c.projectId,c.session!.id,x)}),
    make('workspace_history_operation',{idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.git.operation(c.actor,c.projectId,x.operationId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.git.operation(c.actor,c.projectId,x.operationId as string)}),
    make('working_grant_prepare',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.workingGrants.prepare(c.actor,c.projectId,x)}),
    make('working_grant_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.workingGrants.inspect(c.actor,c.projectId,x.grantId as string)}),
    make('working_grant_activate',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.workingGrants.activate(c.actor,c.projectId,x)}),
    make('working_grant_revoke',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.workingGrants.revoke(c.actor,c.projectId,x)}),
    make('discovery_grant_prepare',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.discoveryGrants.prepare(c.actor,c.projectId,x)}),
    make('discovery_grant_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.discoveryGrants.inspect(c.actor,c.projectId,x.grantId as string)}),
    make('discovery_grant_activate',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.discoveryGrants.activate(c.actor,c.projectId,x)}),
    make('discovery_grant_revoke',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.discoveryGrants.revoke(c.actor,c.projectId,x)}),
    make('development_prepare', {idempotencyPolicy:'key-required',requiresSession:true,authorize:noPrecondition,preconditions:noPrecondition,execute:(c,x)=>c.app.development.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('development_submit', {idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.submit(c.actor,c.projectId,x.developmentTaskId as string)}),
    make('development_inspect', {idempotencyPolicy:'read-only',authorize:(c,x)=>{x.jobId?c.app.development.inspect(c.actor,c.projectId,x.jobId as string):c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string);},preconditions:noPrecondition,execute:(c,x)=>x.jobId?c.app.development.inspect(c.actor,c.projectId,x.jobId as string):c.app.development.get(c.actor,c.projectId,x.developmentTaskId as string)}),
    make('development_logs', {idempotencyPolicy:'read-only',authorize:(c,x)=>{c.app.development.inspect(c.actor,c.projectId,x.jobId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.logs(c.actor,c.projectId,x.jobId as string,x.stream??'stdout',x.cursor??0,x.identity as string|null|undefined)}),
    make('development_cancel', {idempotencyPolicy:'key-required',authorize:(c,x)=>{c.app.development.inspect(c.actor,c.projectId,x.jobId as string);},preconditions:noPrecondition,execute:(c,x)=>c.app.development.cancel(c.actor,c.projectId,x.jobId as string)}),
    make('experiment_source_list', {idempotencyPolicy: 'read-only', authorize: (c,x) => {c.app.sources.resolve(c.actor,c.projectId,x,true); if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_list');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.list(c.actor,c.projectId,x)}),
    make('experiment_source_read', {idempotencyPolicy: 'read-only', authorize: (c,x) => {const {path,cursor,limit,...selector}=x;c.app.sources.resolve(c.actor,c.projectId,selector,true);if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_read');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.read(c.actor,c.projectId,x)}),
    make('experiment_source_diff', {idempotencyPolicy: 'read-only', authorize: (c,x) => {c.app.sources.resolve(c.actor,c.projectId,x.from,true);c.app.sources.resolve(c.actor,c.projectId,x.to,true);if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'experiment_source_diff');}, preconditions: noPrecondition, execute: (c,x) => c.app.sources.diff(c.actor,c.projectId,x)}),
    make('workspace_prepare_from_revision', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: noPrecondition, preconditions: noPrecondition, execute: (c,x) => c.app.sources.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('text_evidence_search', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'text_evidence_search', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'text_evidence_search', x)}),
    make('research_skill_list', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'research_skill_list', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'research_skill_list', x)}),
    make('research_skill_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'research_skill_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'research_skill_read', x)}),
    make('connector_status', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'connector_status', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'connector_status', x)}),
    make('session_action_inspect',{idempotencyPolicy:'read-only',requiresSession:true,authorize:(c)=>{c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.session!);},preconditions:noPrecondition,execute:(c,x)=>c.app.sessionPermissions.inspectAction(c.actor,c.session!.id,x.actionId as string)}),
    make('session_action_execute',{idempotencyPolicy:'key-required',requiresSession:true,authorize:(c)=>{c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.session!);},preconditions:noPrecondition,execute:(c,x)=>c.app.sessionPermissions.executeAction(c.actor,c.session!.id,x.actionId as string,c.signal)}),
    make('session_action_resume',{idempotencyPolicy:'key-required',asynchronous:true,requiresSession:true,authorize:(c)=>{c.app.sessionPermissions.boundNoticeAction(c.actor,c.session!.id);},preconditions:noPrecondition,execute:(c)=>c.app.sessionPermissions.resumeAction(c.actor,c.session!.id,c.signal)}),
    make('session_notice_read', {idempotencyPolicy: 'read-only', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'session_notice_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'session_notice_read', x)}),
    make('project_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => {if(x.githubCommit!==undefined&&c.actor.type==='agent')c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'project_inspect'));else authorizeRegistered(c,'project_inspect',x);}, preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'project_inspect', x)}),
    make('workspace_list', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'workspace_list', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'workspace_list', x)}),
    make('artifact_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'artifact_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'artifact_read', x)}),
    make('artifact_create', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'artifact_create', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'artifact_create', x)}),
    make('evidence_register', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'evidence_register', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'evidence_register', x)}),
    make('evidence_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'evidence_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'evidence_read', x)}),
    make('experiment_plan_submit', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'experiment_plan_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'experiment_plan_submit', x)}),
    make('run_list', {idempotencyPolicy: 'read-only', authorize: c => userOnly(c.actor), preconditions: noPrecondition, execute: (c, x) => c.app.runs.list(c.actor, c.projectId, x.cursor as number | undefined, x.limit as number | undefined)}),
    make('run_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => {if(x.includeScheduling===true&&c.actor.type==='agent')c.app.automaticApprovals.coordinator(c.actor,c.projectId,c.app.operations.authorizeAgent(c.actor,'run_inspect'));else authorizeRegistered(c,'run_inspect',x);}, preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'run_inspect', x)}),
    make('run_logs', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'run_logs', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'run_logs', x)}),
    make('approval_request', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'approval_request', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'approval_request', x)}),
    make('collaboration_plan_submit', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'collaboration_plan_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'collaboration_plan_submit', x)}),
    make('agent_delegate', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'agent_delegate', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'agent_delegate', x)}),
    make('task_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'task_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_inspect', x)}),
    make('task_result_read', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'task_result_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_result_read', x)}),
    make('task_context_read', {idempotencyPolicy: 'read-only', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'task_context_read', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'task_context_read', x)}),
    make('task_progress_report', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: (c, x) => authorizeRegistered(c, 'task_progress_report', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'task_progress_report', x)}),
    make('campaign_prepare', {idempotencyPolicy: 'key-required', requiresSession: true, authorize: c => { if(c.actor.type==='agent')c.app.operations.authorizeAgent(c.actor,'campaign_prepare'); c.app.campaigns.prepareSession(c.actor,c.projectId,c.session!.id); }, preconditions: c => assertProjectWritable(c.app.store,c.projectId), execute: (c,x) => c.app.campaigns.prepare(c.actor,c.projectId,c.session!.id,x)}),
    make('campaign_inspect', {idempotencyPolicy: 'read-only', authorize: (c, x) => authorizeRegistered(c, 'campaign_inspect', x), preconditions: noPrecondition, execute: (c, x) => executeRegistered(c, 'campaign_inspect', x)}),
    make('campaign_enroll', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'campaign_enroll', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'campaign_enroll', x)}),
    make('campaign_decision_submit', {idempotencyPolicy: 'key-required', authorize: (c, x) => authorizeRegistered(c, 'campaign_decision_submit', x), preconditions: c => assertProjectWritable(c.app.store, c.projectId), execute: (c, x) => executeRegistered(c, 'campaign_decision_submit', x)}),
    make('literature_discover', {idempotencyPolicy: 'key-required', asynchronous: true, authorize:(c,x)=>{externalReplay(c,'literature_discover',x);}, preconditions:noPrecondition, execute: (c, x) => c.app.connectors.discover(c.actor, c.projectId, x, externalReplay(c, 'literature_discover', x).key, c.validate, c.signal)}),
    make('literature_search', {idempotencyPolicy: 'key-required', asynchronous: true, authorize:(c,x)=>{externalReplay(c,'literature_search',x);}, preconditions:noPrecondition, execute: (c, x) => c.app.literature.search(c.projectId, text(x.query, 'query', 500), integer(x.limit ?? 8, 'limit', 1, 20), externalReplay(c, 'literature_search', x).key, c.validate,c.actor)}),
    make('run_grant_prepare',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.runGrants.prepare(c.actor,c.projectId,x)}),
    make('run_grant_inspect',{idempotencyPolicy:'read-only',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.runGrants.inspect(c.actor,c.projectId,x.grantId as string)}),
    make('run_grant_activate',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.runGrants.activate(c.actor,c.projectId,x)}),
    make('run_grant_revoke',{idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.runGrants.revoke(c.actor,c.projectId,x)}),
    make('run_prepare', {idempotencyPolicy: 'key-required', authorize: recordScope('experiment', 'experimentId'), preconditions: noPrecondition,
        execute: (c, x) => c.app.runs.prepare(c.actor, x.experimentId as string,c.session?.id,x.autoAnalyze as boolean|undefined)}),
    make('run_intent_withdraw',{requiresSession:true,idempotencyPolicy:'key-required',authorize:c=>userOnly(c.actor),preconditions:noPrecondition,execute:(c,x)=>c.app.runs.withdrawIntent(c.actor,c.projectId,c.session!.id,x)}),
    make('run_submit', {idempotencyPolicy: 'key-required', authorize: (c,x) => {
        const intent=c.app.store.get<RunIntent>('run-intent',x.intentId as string,c.projectId);
        c.app.runs.assertIntentActor(c.actor,intent);
        if(c.actor.type==='agent'&&c.actor.taskId)assertRunGrantTaskSubmission(c.app.store,c.actor,intent,!intent.runId);
        else if(intent.runGrant){const grant=c.app.store.get<{taskBinding?:unknown}>('run-grant',intent.runGrant.id,c.projectId);if(grant.taskBinding)assertRunGrantActor(c.app.store,c.actor,intent);}
    }, preconditions: noPrecondition,
        execute: (c, x) => c.app.runs.submit(c.actor, x.intentId as string)}),
    make('workspace_read', {idempotencyPolicy: 'read-only', authorize: workspaceScope, preconditions: noPrecondition,
        execute: (c, x) => {
            if(x.source==='project')return c.app.projects.readFile(c.actor,c.projectId,x.path as string);
            const file=readText(c.app.store.paths.physical(c.session!.workspace),x.path as string);
            return {...file,...c.app.draftReads.recordRead(c.actor,c.session!,file,c.idempotencyKey!)};
        }}),
    make('workspace_write', {idempotencyPolicy: 'key-required', authorize: (c, x) => {
        workspaceScope(c, x);
        ensure(c.actor.type === 'user' || x.source !== 'project', 'SCOPE_DENIED', '不能通过助手写入项目共享工作区', 403);
    }, preconditions: (c, x) => {
        assertProjectWritable(c.app.store, c.projectId);
        if (x.source !== 'project') {ensure(c.session!.state !== 'archived', 'SESSION_ARCHIVED', '会话已归档');assertWorkspaceReady(c.app.context,c.session!.id);c.app.workingGrants.assertWrite(c.actor,c.projectId,c.session!.id,x.path as string,x.content as string);}
    }, execute: (c, x) => {
        if(x.source==='project')return c.app.projects.writeFile(c.actor,c.projectId,x.path as string,x.content as string,x.expectedDigest as string|null);
        const file=writeText(c.app.store.paths.physical(c.session!.workspace),x.path as string,x.content as string,x.expectedDigest as string|null,c.app.store);
        c.app.draftReads.recordWrite(c.session!,file,c.idempotencyKey!);return file;
    }}),
    make('change_proposal_prepare', {idempotencyPolicy: 'key-required', authorize: recordScope('experiment', 'baseExperimentId'), preconditions: noPrecondition,
        execute: (c, x) => c.app.changes.prepare(c.actor, c.projectId, x, c.session?.id)}),
    make('task_result_submit', {idempotencyPolicy: 'key-required', authorize: c => {
        ensure(c.actor.type === 'agent' && c.actor.taskId && c.actor.attemptId, 'PERMISSION_DENIED', '需要宿主派发的任务身份', 403);
    }, preconditions: noPrecondition, execute: (c, x) => c.app.teams.submit(c.actor, x)}),
    make('paper_read', {idempotencyPolicy: 'key-required', asynchronous: true, authorize:(c,x)=>{paperReplay(c,x);}, preconditions:noPrecondition,
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
        if(actor.workflowContinuationId)this.app.workflowContinuations.assertActor(actor);
        ensure(actor.type === 'agent' && actor.sessionId && actor.projectId, 'PERMISSION_DENIED', '需要宿主派发的 Agent 身份', 403);
        const s = this.app.sessions.get(actor, actor.sessionId);
        ensure(s.role === actor.role && s.projectId === actor.projectId && s.taskId === actor.taskId, 'SCOPE_DENIED', '角色或任务与会话归属不一致', 403);
        toolAllowed(actor, name);
        if (actor.wakeupId) {
            ensure((actor.continuationId?this.app.automaticApprovals.continuationTools(s.id):actor.approvalResumeId?APPROVAL_RESUME_TOOLS:AUTOMATION_TOOLS).includes(name), 'AUTOMATION_TOOL_DENIED', '自动分析不能执行计算、修改工作区、批准或继续委派', 403);
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
        if(actor.continuationId)this.app.researchAutomation.assertActor(actor);
        if(actor.approvalResumeId)this.app.wakeups.assertApprovalResume(actor);
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
        const lifecycleEpoch=assertProjectReadable(this.app.store,pid,actor).lifecycleEpoch;
        if (options.sessionId) {
            const selected = this.app.sessions.get(actor,text(options.sessionId,'sessionId',100));ensure(selected.projectId===pid,'SCOPE_DENIED','会话不属于此项目',403);
            ensure(!session || selected.id === session.id, 'SCOPE_DENIED', '不能切换 Agent 的会话工作区', 403);
            session = selected;
        }
        let key = options.idempotencyKey;
        let permission:ReturnType<ResearchApp['sessionPermissions']['guard']>;
        // Fixed execution rechecks consumption each time; only its original operation stores a receipt.
        const cached = !['session_action_resume','session_action_execute','session_action_inspect','research_brief_inspect','research_history_list'].includes(id) && (actor.type === 'agent' || spec.idempotencyPolicy === 'key-required');
        if (cached||spec.idempotencyPolicy==='key-required') ensure(typeof key === 'string' && key.trim() && key.length <= 200, 'OPERATION_ID_REQUIRED', '写操作需要 Idempotency-Key', 400);
        const context: OperationContext = {...options, app: this.app, actor, session, validate: () => {
            if(session){const current=this.app.sessions.get(actor,session.id);ensure(spec.idempotencyPolicy==='read-only'||current.state!=='archived','SESSION_ARCHIVED','会话已归档');}
            ensure(!options.signal?.aborted, 'CONNECTOR_CANCELLED', '连接请求已取消或超时', 409);
            if (actor.type === 'agent') this.authorizeAgent(actor, id);
            assertProjectWritable(this.app.store, pid,lifecycleEpoch);
            if(permission){this.app.sessionPermissions.assert(permission.reference,false);if(permission.actionId&&!permission.consumed)this.app.sessionPermissions.validate(permission.reference,session!.id,id,input,permission.actionId);}
        }};
        if (spec.requiresSession) ensure(session, 'SESSION_REQUIRED', '需要指定项目内的会话', 400);
        for (const [field, kind] of [['evidenceId', 'evidence'], ['artifactId', 'artifact'], ['runId', 'run'], ['taskId', 'task']] as const) {
            if (typeof input[field] !== 'string') continue;
            if(field==='taskId'&&id.startsWith('literature_task_')){this.app.store.get('literature-task',input[field] as string,pid);continue;}
            this.app.store.get(kind, input[field] as string, pid);
            if (actor.taskId || actor.wakeupId) (actor.taskId ? this.app.teams : this.app.wakeups).assertResource(actor, kind, input[field] as string);
        }
        spec.authorize(context, input);
        if(id==='development_prepare')this.app.development.validateSyntheticPreparation(actor,pid,session!.id,input);
        if(id==='research_brief_save') {
            const mapped=actor.type==='agent'?this.app.store.maybe<{actionId:string}>('permission-call',digest({sessionId:session!.id,callId:key})):undefined;
            const receiptRequest={name:id,input},receiptKeys=[key!,...(mapped?[`permission-action:${mapped.actionId}`]:[])];
            const replay=receiptKeys.some(receiptKey=>actor.type==='agent'?this.app.store.agentOperationResult(session!.id,receiptKey,receiptRequest).found:this.app.store.operationResult(`operation:user:${pid}:${session!.id}`,receiptKey,receiptRequest).found);
            if(!replay)this.app.researchBriefs.validateReadyDrafts(actor,pid,session!.id,input);
        }
        if(id==='evidence_register'&&actor.type==='agent'&&actor.role==='coordinator'&&!actor.taskId&&!actor.wakeupId&&!options.approvedActionId)ensure(typeof input.exactQuote==='string','EVIDENCE_EXACT_QUOTE_REQUIRED','请从实际读取的正文复制 exactQuote；不接受猜测位置与自由描述。解释和研究断言另行提出，不作为已验证证据',400);
        if(options.approvedActionId){
            interactiveCoordinator(actor,pid,session!);
            ensure(['workspace_write','research_brief_save','artifact_create'].includes(id)||this.app.sessionPermissions.canResumeOperation(id)&&this.app.sessionPermissions.boundNoticeAction(actor,session!.id)===options.approvedActionId,'SESSION_ACTION_EXECUTION_DENIED','固定恢复仅允许列明操作且必须绑定当前批准通知',403);
            permission=this.app.store.transaction(()=>{
                this.app.sessionPermissions.validate(actor.permission??this.app.sessionPermissions.capture(session!.id),session!.id,id,input,options.approvedActionId);
                let fixed:ReturnType<ResearchApp['sessionPermissions']['guard']>;
                try{fixed=this.app.sessionPermissions.guard(actor,id,input,key);}catch(error){
                    if(error instanceof DomainError&&error.code==='APPROVAL_REQUIRED')throw new DomainError('APPROVAL_STALE','固定来源已变化，未创建替代审批',409);
                    throw error;
                }
                ensure(fixed&&fixed.actionId===options.approvedActionId&&!fixed.consumed,'APPROVAL_STALE','实际操作与指定的未消费批准不符',409);
                return fixed;
            });
        }else permission=this.app.sessionPermissions.guard(actor,id,input,key);
        if(permission?.key){key=permission.key;context.idempotencyKey=key;}
        const proposalOwner = id === 'change_proposal_prepare' ? session?.id : undefined;
        const intentOwner = id === 'run_prepare' ? session?.id : undefined;
        const experimentOwner = id === 'experiment_plan_submit' && actor.type==='user' ? session?.id : undefined;
        const manuscriptOwner = id === 'manuscript_create' ? session?.id : undefined;
        const agentPublicationOwner = actor.type==='agent'&&['manuscript_create','publication_prepare','publication_review_prepare'].includes(id)?session?.id:undefined;
        const workspaceId = spec.requiresSession || proposalOwner || manuscriptOwner || ['task_inspect', 'task_result_read', 'research_skill_list', 'research_skill_read'].includes(id) || id.startsWith('workspace_') && input.source !== 'project' ? session?.id : undefined;
        // Large local document bodies are hashed before any writer transaction; metadata remains part of identity.
        const request = {name: id,...(proposalOwner||intentOwner||experimentOwner||manuscriptOwner||agentPublicationOwner?{rootSessionId:proposalOwner??intentOwner??experimentOwner??manuscriptOwner??agentPublicationOwner}:{}),input:id==='document_import'?{...input,contentBase64:undefined,contentDigest:digest(input.contentBase64 as string)}:['skill_package_import','skill_package_upload','manuscript_create','publication_template_import'].includes(id)?{inputDigest:digest(input)}:input}, operationScope = actor.type === 'agent' ? `agent:${session!.id}` : `operation:user:${pid}:${workspaceId ?? 'project'}`;
        const output = (value: unknown) => {
            // Validate the wire value: optional undefined properties are omitted by all transports.
            const result: unknown = JSON.parse(JSON.stringify(publicRecords(['evidence_register','evidence_read'].includes(id)?{...value as object,verification:{quote:'source-bytes-verified',interpretation:'unverified'}}:value)));
            validateSchema(spec.outputSchema, result, 'output');
            return result;
        };
        // Legacy proposal receipts have no session identity; owned requests must not read or write them.
        const legacy = proposalOwner||intentOwner||experimentOwner ? undefined : options.legacy;
        const aliases: {scope: string; input: unknown}[] = legacy ? [legacy] : [];
        if (!legacy && actor.type === 'user') {
            let path: string | undefined, body: unknown;
            if (id === 'run_prepare'&&!intentOwner) { path = '/run-intents'; body = input; }
            if (id === 'run_submit') { path = `/run-intents/${input.intentId}/submit`; body = {}; }
            if (id === 'change_proposal_prepare' && !proposalOwner) { path = '/change-proposals'; body = {projectId: pid, ...input}; }
            if (id === 'workspace_write' && input.source === 'project') { path = `/projects/${pid}/files`; const {source, ...rest} = input; body = rest; }
            const projectPaths: Record<string, string> = {report_create:'/reports',text_evidence_search: '/text-evidence-search', artifact_create: '/artifacts', evidence_register: '/evidence', experiment_plan_submit: '/experiments'};
            if (projectPaths[id] && !(id==='experiment_plan_submit'&&experimentOwner)) { path = projectPaths[id]; body = {projectId: pid, ...input}; }
            if (id === 'campaign_enroll' || id === 'campaign_decision_submit') { path = `/campaigns/${input.campaignId}/${id === 'campaign_enroll' ? 'members' : 'decisions'}`; const {campaignId, ...rest} = input; body = rest; }
            if (id === 'collaboration_plan_submit' || id === 'agent_delegate') { path = `/sessions/${session!.id}/teams`; body = input; }
            if (id === 'experiment_plan_submit' && !experimentOwner && input.parentId) { const {parentId, ...childBody} = input; for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) aliases.push({scope: `${method}:/experiments/${parentId}/children`, input: {body: childBody, query: ''}}); }
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
        const preparedAfter=Number(this.app.store.db.prepare('SELECT COALESCE(MAX(rowid),0) n FROM records').get()!.n);
        const save = (value: unknown,fresh=true) => {
            let result = output(fresh?this.app.automaticApprovals.postPrepare(actor,id,input,value,preparedAfter):value);
            if(fresh&&id==='session_attachment_read'&&actor.type==='agent'){context.validate();const extra=recordAttachmentRead(this.app.store,actor,session!,result as Parameters<typeof recordAttachmentRead>[3],key!,input.attachmentBindingId as string|undefined);if(extra)result=output({...result as object,...extra});}
            if(fresh&&id==='research_skill_read'&&actor.type==='agent'){context.validate();this.app.methodContracts.recordSkillRead(actor,session,result);}
            if(fresh&&actor.type==='agent'&&['workspace_read','artifact_read','development_review_source_read','run_source_read','formal_report_review_source_read'].includes(id)) {
                context.validate();
                let extra=id==='workspace_read'&&input.source==='project'?this.app.sourceInputs.recordRead(actor,session,result as {path:string;content:string;digest:string;size:number},key!):id==='artifact_read'||id==='development_review_source_read'?this.app.developmentReviews.recordReading(actor,pid,id,input,result as Record<string,unknown>,key!):undefined;
                if(['artifact_read','run_source_read','formal_report_review_source_read'].includes(id))extra=this.app.formalReportReviews.recordReading(actor,pid,id,input,result as Record<string,unknown>,key!)??extra;
                if(extra)result=output({...result as object,...extra});
            }
            const write = () => cached ? this.app.store.operation(operationScope, key!, request, () => result) : result;
            const saved=legacy ? this.app.store.operation(legacy.scope, key!, legacy.input, write) : write();
            if(permission?.actionId)this.app.sessionPermissions.complete(permission.actionId);
            return saved;
        };
        const invoke = () => {
            if(session){const current=this.app.sessions.get(actor,session.id);if(spec.idempotencyPolicy!=='read-only')ensure(current.state!=='archived','SESSION_ARCHIVED','会话已归档');}
            if(spec.idempotencyPolicy!=='read-only')assertProjectWritable(this.app.store,pid,lifecycleEpoch);
            else assertProjectReadable(this.app.store,pid,actor);
            if (actor.type === 'agent') this.authorizeAgent(actor, id);
            // Supported secret updates share this writer lock, unlike the earlier readback snapshot.
            if(options.approvedActionId)this.app.sessionPermissions.assertActionInput(input);
            if(permission){this.app.sessionPermissions.assert(permission.reference,false);if(permission.actionId){this.app.sessionPermissions.validate(permission.reference,session!.id,id,input,permission.actionId);this.app.sessionPermissions.begin(permission.actionId);}}
            spec.preconditions(context, input);
            if(permission?.actionId)context.actor={...actor,permissionActionId:permission.actionId};
            const result=spec.execute(context, input);
            if(options.approvedActionId){
                this.app.sessionPermissions.assertActionInput(input);
                if(id==='artifact_create'){
                    const saved=this.app.evidence.read(actor,(result as {id:string}).id);
                    ensure(saved.bytes.equals(Buffer.from(input.content as string))&&saved.artifact.title===input.title&&saved.artifact.mediaType===(input.mediaType??'text/plain'),'SESSION_ACTION_BYTES_CHANGED','实际产物与固定批准正文不符，未发布结果',409);
                }
            }
            return result;
        };
        // Host execution owns its durable intent/receipt. Never reconstruct or rerun an unknown command.
        if(id==='host_execute'){context.validate();return Promise.resolve(invoke()).then(value=>{context.validate();this.app.hostAccess.assertAgent(actor);return output(value);});}
        // The nested operation owns its exact approval and receipt, including asynchronous failures.
        if(id==='session_action_resume'){context.validate();return Promise.resolve(invoke()).then(output);}
        if(['collaboration_plan_submit','agent_delegate'].includes(id)&&(input.tasks as Task[]).some(t=>t.thinking!==undefined)) {
            const previous=this.app.store.transaction(()=>{if(actor.type==='agent')context.validate();return lookup();});
            if(previous)return output(previous.value);
            return (async()=>{
                context.validate();ensure(!permission?.consumed,'SESSION_ACTION_CONSUMED','固定批准已消费且没有原操作回执，不能重复创建团队');
                const plan=this.app.teams.validatePlan(context.actor,session!.id,input);
                context.preparedTaskModels=await prepareTaskModels(this.app.context,plan.s,plan.tasks);
                // SDK preparation has no effects; creation and its durable receipt share one writer transaction.
                return this.app.store.transaction(()=>{
                    context.validate();const prior=lookup();if(prior)return output(prior.value);
                    const pending=this.app.store.maybe<{hash:string}>('operation-pending',digest({scope:operationScope,key}));
                    if(pending){ensure(pending.hash===digest(request),'IDEMPOTENCY_CONFLICT','相同幂等键不能用于不同请求');ensure(false,'OPERATION_IN_PROGRESS','同键旧操作仍在执行或结果待对账，不能重复创建团队');}
                    const result=save(invoke());
                    this.app.store.event(pid,actor.type==='agent'?'tool.executed':'operation.executed',{sessionId:session?.id,taskId:actor.taskId,attemptId:actor.attemptId,tool:id,callId:key});
                    return result;
                });
            })().catch(error=>{if(permission?.actionId)this.app.sessionPermissions.failed(permission.actionId,error);throw error;});
        }
        if (spec.asynchronous) {
            // Owner receipts remain readable after archival; only new effects require a writable project.
            if(actor.type==='agent')context.validate();
            if(['ssh_target_challenge','ssh_target_confirm','ssh_target_setup'].includes(id)){
                const prior=this.app.store.transaction(lookup);
                if(prior){
                    if(id==='ssh_target_confirm')return Promise.resolve(invoke()).then(output);
                    if(id==='ssh_target_setup')ensure(this.app.sshTargets.inspect(actor,input.id as string).version===input.expectedVersion,'SSH_TARGET_CHANGED','环境准备回执属于旧配置');
                    return output(prior.value);
                }
            }
            if (['report_export','compute_target_probe','docker_connection_probe','document_import','document_parser_configure','document_parse_prepare','skill_package_import','manuscript_create','publication_configure','publication_prepare','publication_submit'].includes(id)) {
                const previous=this.app.store.transaction(()=>{if(actor.type==='agent')context.validate();const found=lookup();if(found&&actor.type==='agent'){
                    if(id==='manuscript_create')this.app.publicationBuilds.revision(actor,pid,(found.value as {id:string}).id);
                    if(id==='publication_prepare')this.app.publicationBuilds.inspect(actor,pid,(found.value as {jobId:string}).jobId);
                }return found;});
                if(previous)return output(previous.value);
            }
            if(permission?.consumed){const prior=this.app.store.transaction(()=>{context.validate();const found=lookup();ensure(found,'SESSION_ACTION_CONSUMED','该批准已消费且回执待核对，不重复副作用');ensure(externalReplay(context,id,input).completed,'OPERATION_IN_PROGRESS','领域回执尚未确认，禁止重复外部请求');return found;});return output(prior.value);}
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
                context.validate();
                if (lookup()) return;
                const prior = this.app.store.maybe<{hash: string}>('operation-pending', pendingId);
                if (prior) {
                    ensure(prior.hash === hash, 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                    // A committed connector receipt proves the external read finished before a crash.
                    ensure(externalReplay(context, id, input).completed, 'OPERATION_IN_PROGRESS', '同键请求尚在执行或上次结果待对账；不会重复发出外部请求');
                    reserved = true;
                    return;
                }
                this.app.store.create('operation-pending', pid, {hash, operation: id,...(session?{sessionId:session.id}:{})}, pendingId);
                reserved = true;
            });
            const clear = () => { if (reserved) this.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('operation-pending', pendingId); };
            const promise = Promise.resolve().then(invoke).then(value => {
                context.validate();
                return this.app.store.transaction(() => { context.validate();const result = save(value); clear(); return result; });
            }).catch(error => { clear();if(permission?.actionId)this.app.sessionPermissions.failed(permission.actionId,error,true);throw error; }).finally(() => { this.pending.delete(pendingId); });
            this.pending.set(pendingId, {hash, promise});
            return promise;
        }
        if (!cached) {
            const result=output(invoke());
            if(actor.type==='agent'&&id==='research_brief_inspect')this.app.store.event(pid,'tool.executed',{sessionId:session!.id,tool:id,callId:key});
            return result;
        }
        // Recheck under the write lock before invoking: other HTTP/CLI processes share this DB.
        try {return this.app.store.transaction(() => {
            if(permission)this.app.sessionPermissions.assert(permission.reference,false);
            // PDF authority must be current under the same writer lock as cached receipt return.
            if(['publication_citation_check','text_evidence_search','artifact_read','evidence_register','evidence_read','run_submit','session_attachment_read'].includes(id))spec.authorize(context,input);
            const previous = lookup();
            if (previous) {
                if(id==='session_attachment_read'&&input.readProtocol==='fixed-text-v1'){context.validate();const fresh=spec.execute(context,input);const {attachmentReadId,attachmentBindingId,sourceInputPath,...original}=previous.value as Record<string,unknown>;ensure(digest(fresh)===digest(original),'ATTACHMENT_INVALID','缓存固定页来源已变化');return output(previous.value);}
                if(id==='publication_citation_check'){context.validate();return output(this.app.publicationBuilds.replayCitationCheck(actor,pid,input,previous.value as ReturnType<ResearchApp['publicationBuilds']['citationCheck']>));}
                ensure(!options.approvedActionId,'SESSION_ACTION_NOT_APPROVED','固定批准已被其它调用消费，请回查结果，不重复执行',409);
                if(id==='workspace_prepare_from_revision') {
                    const result=output(previous.value) as ReturnType<ResearchApp['sources']['prepare']>;
                    settleSourcePreparationReceipt(this.app.store,pid,session!.id,result);return result;
                }
                if(['research_action_prepare','research_action_inspect','research_action_decide'].includes(id)){
                    context.validate();spec.authorize(context,input);
                    if(id==='research_action_prepare')return output(this.app.researchActions.prepare(context.actor,pid,session!.id,input,(previous.value as {id:string}).id));
                    return output(spec.execute(context,input));
                }
                if(id==='document_page_image_read'){context.actor={...actor,...(permission?.actionId?{permissionActionId:permission.actionId}:{})};return output(spec.execute(context,input));}
                if(id==='publication_page_image_read'){context.actor={...actor,permissionActionId:permission?.actionId};return output(spec.execute(context,input));}
                if(actor.type==='agent'&&id==='run_inspect'&&input.includeScheduling===true){spec.authorize(context,input);return output(spec.execute(context,input));}
                if(actor.type==='agent'&&id==='project_inspect'&&input.githubCommit!==undefined){spec.authorize(context,input);return output(spec.execute(context,input));}
                if(id==='experiment_plan_submit'&&actor.type==='agent') {
                    this.authorizeAgent(actor,id);
                    const created=previous.value as {researchBrief?:ResearchBriefRef};
                    if(created.researchBrief)this.app.researchBriefs.assertReference(actor,pid,session!.id,created.researchBrief);
                }
                if(id==='research_brief_save') {
                    const receipt=previous.value as {id:string},view=this.app.researchBriefs.inspect(actor,pid,session!.id,receipt.id);
                    ensure(view.brief,'BRIEF_EVIDENCE_UNAVAILABLE','该研究计划修订当前不可读取，请重新核对来源',403);
                    return output(view.brief);
                }
                if(id==='research_fixture_prepare'){const fixed=previous.value as {fixtureRef:SyntheticFixtureRef};assertSyntheticFixture(this.app.store,pid,fixed.fixtureRef,session!.id);return output(previous.value);}
                if(id==='text_evidence_search')this.app.textEvidence.verifyReplay(actor,pid,input);
                if(id==='task_result_submit'&&actor.taskId&&this.app.store.list<{taskId:string}>('formal-report-review',pid).some(r=>r.taskId===actor.taskId))return output(this.app.teams.submit(actor,input));
                if(id.startsWith('formal_report_review_'))return output(spec.execute(context,input));
                if(actor.type==='agent'&&id==='publication_review_prepare')return output(spec.execute(context,input));
                if(actor.type==='agent'&&['publication_templates','publication_template_inspect','publication_template_read','manuscript_list','manuscript_inspect','manuscript_source_read','publication_status','publication_inspect','publication_result','publication_build_list','publication_review_inspect','publication_review_list'].includes(id))return output(spec.execute(context,input));
                if(actor.type==='user'&&assertProjectReadable(this.app.store,pid,actor).status==='archived')return output(previous.value);
                return save(previous.value,false);
            }
            // An already submitted intent is owner history, even under a new readback key.
            if(actor.type==='user'&&id==='run_submit'&&assertProjectReadable(this.app.store,pid,actor).status==='archived') {
                const intent=this.app.store.get<RunIntent>('run-intent',input.intentId as string,pid);
                if(intent.runId)return output(this.app.runs.submit(actor,intent.id));
            }
            const pending = this.app.store.maybe<{hash: string}>('operation-pending', digest({scope: operationScope, key}));
            if (pending) {
                ensure(pending.hash === digest(request), 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                ensure(false, 'OPERATION_IN_PROGRESS', '同键外部操作结果仍待对账');
            }
            const result = save(invoke());
            this.app.store.event(pid, actor.type === 'agent' ? 'tool.executed' : 'operation.executed', {sessionId: session?.id, taskId: actor.taskId, attemptId: actor.attemptId, tool: id, callId: key});
            return result;
        });}catch(error){if(permission?.actionId)this.app.sessionPermissions.failed(permission.actionId,error);throw error;}
    }
}
