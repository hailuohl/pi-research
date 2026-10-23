import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {Chat,Inspector} from '../../dist/web/assets/workbench.js';
import {ChatWorkflows} from '../../dist/web/assets/chat-workflows.js';
import {PermissionActions} from '../../dist/web/assets/permission-actions.js';
import {ResearchActionCard} from '../../dist/web/assets/research-action-cards.js';
import {PublicationDialogue} from '../../dist/web/assets/publication-dialogue.js';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import {Modal} from '../../dist/web/assets/ui.js';
import * as modelHelpers from '../../dist/web/assets/models.js';

const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):typeof n==='string'?n:'';
const buttons=n=>nodes(n).filter(n=>n.type==='button').map(text);
const automaticApproval={grantId:'new-grant',scope:1};
const session={id:'root',projectId:'p',role:'coordinator',title:'Main',state:'idle',model:{provider:'test',model:'fixture'}};
const base=()=>({project:{id:'p',settings:{enabled:true}},sessions:[session],campaigns:[],members:[],observations:[],decisions:[],experiments:[],runs:[],intents:[],developmentTasks:[],sandboxJobs:[],reviews:[],tasks:[],teams:[],changeProposals:[],approvals:[],researchCandidates:[],experimentPlans:[],budgets:[],reports:[],claims:[],researchActions:[]});
const workflow=data=>synchronousState(new ChatWorkflows({data,session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){}}));

test('automatic approvals retain all fixed workflow records without repeat approval or execution buttons',()=>{
 for(const marked of [false,true]){
  const data=base(),approval=id=>({id,status:'approved',version:1,...(marked?{automaticApproval,automaticExecution:{state:'failed',reason:`failed-${id}`}}:{fullAccess:{continuationId:'old-task',digest:'old'}})});
  data.approvals=['run','campaign','decision','change','development','review'].map(approval);
  data.intents=[{id:'intent',projectId:'p',rootSessionId:'root',approvalId:'run',status:'prepared',experimentId:'e',manifestDigest:'fixed',manifest:{}}];
  Object.assign(data.approvals.find(record=>record.id==='run'),{projectId:'p',subjectKind:'run-intent',subjectId:'intent',scope:'run.submit',digest:'fixed'});
  data.campaigns=[{id:'campaign',rootSessionId:'root',approvalId:'campaign',state:'draft',rootModel:session.model,limits:{},goal:'Fixed campaign'}];
  data.decisions=[{id:'decision',campaignId:'campaign',approvalId:'decision',status:'proposed',action:'stop',reason:'Fixed decision'}];
  data.changeProposals=[{id:'change',rootSessionId:'root',approvalId:'change',state:'prepared',title:'Fixed change',digest:'fixed',baseSnapshot:{digest:'base'},candidateSnapshot:{digest:'candidate'},changes:[]}];
  data.developmentTasks=[{id:'development',sessionId:'root',grantId:'development',title:'Fixed test',manifest:{command:['python','test.py'],deadline:'2099-01-01'}}];
  data.teams=[{id:'team',state:'awaiting_approval',delegationEnabled:true}];
  data.reviews=[{id:'review',producerSessionId:'root',approvalId:'review',teamId:'team',status:'awaiting_approval'}];
  const ui=workflow(data),rendered=ui.render(),names=buttons(rendered);
  for(const name of ['确认并让智能体执行','启动已批准研究计划','应用已批准研究决定','整合已批准变更','提交已批准开发测试','启动已批准独立审查'])assert.equal(names.includes(name),!marked,name);
  for(const detail of ['Fixed campaign','Fixed decision','Fixed test'])assert.ok(text(rendered).includes(detail));
  if(marked)for(const id of ['run','campaign','decision','change','development','review'])assert.ok(text(rendered).includes(`failed-${id}`),id);
 }
});

test('automatic brief confirmation remains a record while old ready plans remain actionable',()=>{
 const data=base(),brief={id:'brief',rootSessionId:'root',status:'ready',revision:1,digest:'fixed',question:'Fixed question',constraints:[],hypotheses:[],evidenceIds:[],successCriteria:[],clarificationQuestions:[],steps:[]};
 data.researchBrief={brief,latestId:'brief',history:[],evidenceChecks:[]};
 assert.ok(buttons(workflow(data).render()).includes('确认研究问题与计划'));
 brief.automaticApproval=automaticApproval;
 brief.automaticExecution={state:'needs_attention',reason:'Specify success criteria'};
 assert.ok(!buttons(workflow(data).render()).includes('确认研究问题与计划'));
 assert.match(text(workflow(data).render()),/Fixed question/);assert.match(text(workflow(data).render()),/Specify success criteria/);
});

test('automatic permission action has no repeat allow, deny or owner retry and does not count as pending',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});let ids;
 const approval={id:'a',version:1,status:'pending',automaticApproval,automaticExecution:{state:'unknown',reason:'Unknown operation effect'}},action={id:'a',sessionId:'root',version:1,operation:'workspace_prepare_from_revision',state:'pending',input:{experimentId:'e',revision:1},approval};
 const ui=synchronousState(new PermissionActions({sessionId:'root',projectId:'p',session,archived:false,busy:false,perform:fn=>fn(),onPendingChange:value=>{ids=value;}}));
 globalThis.fetch=async()=>({ok:true,json:async()=>({actions:[action]})});await ui.load();
 assert.deepEqual(ids,[]);assert.deepEqual(buttons(ui.render()),[]);assert.match(text(ui.render()),/Unknown operation effect/);assert.doesNotMatch(text(ui.render()),/等待确认/);
 action.state='failed';approval.status='approved';action.error='SOURCE_CHANGED';ui.state.actions=[action];
 assert.deepEqual(buttons(ui.render()),[]);assert.match(text(ui.render()),/SOURCE_CHANGED/);
});

test('automatic research requests keep fixed details without inventing a scientific decision',()=>{
 for(const input of [{kind:'claim_decision',claim:{claimId:'claim',expectedVersion:1}},{kind:'text_grant',textGrant:{documents:[],maxSearches:2,expiresAt:'2099-01-01'}},{kind:'report_compose',report:{title:'Fixed report',runIds:[],claimIds:[],publicationResultIds:[]}}]){
  const data=base();data.claims=[{id:'claim',statement:'Unproven claim',limitations:['not measured'],evidenceIds:[]}];
  const request={id:'request',version:1,projectId:'p',sessionId:'root',input,state:'pending',effectiveState:'pending',reasons:[],expiresAt:'2099-01-01',automaticApproval,automaticExecution:{state:'needs_attention',reason:'Scientific decision is missing'}};
  const ui=synchronousState(new ResearchActionCard({data,session,request,busy:false,perform:fn=>fn(),onSession(){},onRun(){}}));
  assert.deepEqual(buttons(ui.render()),[],input.kind);assert.doesNotMatch(text(ui.render()),/已采纳/);assert.match(text(ui.render()),/Scientific decision is missing/);
 }
});

test('automatic records do not create task drawer pending reminders or collaboration approval buttons',()=>{
 const data=base();data.campaigns=[{id:'c',rootSessionId:'root',state:'draft',approvalId:'a'}];data.approvals=[{id:'a',subjectKind:'team',subjectId:'team',status:'pending',reason:'Fixed automatic approval scope',automaticApproval}];data.researchActions=[{id:'r',projectId:'p',sessionId:'root',state:'pending',automaticApproval}];
 data.teams=[{id:'team',rootSessionId:'root',goal:'Automatic team',state:'awaiting_approval',delegationEnabled:true}];
 const props={data,session,boot:{runtime:{ready:true}},busy:false,messages:[],history:null,historyAnchor:null,stream:'',perform:fn=>fn()};
 const chat=synchronousState(new Chat(props));
 assert.ok(!nodes(chat.render()).some(n=>n.props?.className==='chat-pending-count'));
 const inspector=new Inspector({...props,tab:'chat',sessionId:'root',onDirective(){}}),rendered=inspector.render();
 assert.ok(!buttons(rendered).some(n=>/批准并启动协作|拒绝此计划/.test(n)));assert.match(text(rendered),/Automatic team/);assert.match(text(rendered),/Fixed automatic approval scope/);
});

test('automatic manuscript build and review retain diagnostics without repeat start buttons',()=>{
 const data=base();data.manuscripts=[{id:'revision',rootSessionId:'root',title:'Fixed manuscript',files:[],sourceDigest:'source'}];
 data.publicationJobs=[{id:'job',revisionId:'revision',approvalId:'build',state:'prepared',resources:{},error:'SOURCE_CHANGED',resultId:'result'}];
 data.publicationReviews=[{id:'review',publicationResultId:'result',rootSessionId:'root',approvalId:'review',status:'awaiting_approval',validity:'current'}];
 data.approvals=[{id:'build',status:'approved',automaticApproval,automaticExecution:{state:'failed',reason:'Build could not submit'}},{id:'review',status:'approved',automaticApproval,automaticExecution:{state:'needs_attention',reason:'Review model is missing'}}];
 const ui=new PublicationDialogue({data,session,disabled:false,perform:fn=>fn()}),rendered=ui.render(),names=buttons(rendered);
 assert.ok(!names.includes('批准并编译'));assert.ok(!names.includes('批准并启动审查'));assert.ok(names.includes('查看编译诊断'));assert.match(text(rendered),/SOURCE_CHANGED/);assert.match(text(rendered),/Build could not submit/);assert.match(text(rendered),/Review model is missing/);
});

test('automatic team result acceptance stays records-only while manual teams retain human acceptance',()=>{
 for(const marked of [false,true])for(const acceptance of ['pending','disputed']){
  const data=base();data.teams=[{id:'team',approvalId:'team-approval',rootSessionId:'root',goal:'Fixed team',state:'active'}];
  data.approvals=[{id:'team-approval',subjectId:'team',subjectKind:'team',status:'approved',...(marked?{automaticApproval}:{})}];
  data.tasks=[{id:'task',teamId:'team',role:'reviewer',key:'review',objective:'Fixed unresolved task',dependencies:[],execution:'output_submitted',acceptance,blockReason:'Evidence missing',result:{summary:'Result remains disputed',verdict:'disputed'}}];
  const view=new Inspector({data,boot:{runtime:{ready:true}},tab:'chat',sessionId:'root',perform:fn=>fn(),onDirective(){}}),rendered=view.render();
  assert.equal(buttons(rendered).includes('人工确认验收'),!marked);
  assert.ok(buttons(rendered).includes('暂停分配'));assert.ok(text(rendered).includes(modelHelpers.label(acceptance)));assert.match(text(rendered),/Evidence missing/);assert.match(text(rendered),/Result remains disputed/);assert.doesNotMatch(text(rendered),/审查意见：接受/);
 }
});

test('automatic status wording separates process completion from scientific success and preserves unknown reasons',()=>{
 assert.equal(modelHelpers.automaticApprovalLabel({status:'approved'}),null);
 assert.equal(modelHelpers.automaticApprovalLabel({automaticApproval}),'自动审批 · 等待自动处理');
 for(const [state,caption] of [['completed','本项自动处理已完成'],['failed','自动处理失败'],['unknown','自动处理效果未知'],['needs_attention','自动处理需要补充信息'],['waiting','等待自动执行']]){
  const label=modelHelpers.automaticApprovalLabel({automaticApproval,automaticExecution:{state,reason:'Fixed reason'}});assert.ok(label.includes(caption));assert.ok(label.includes('Fixed reason'));assert.doesNotMatch(label,/科学成功|审查通过|实验成功/);
 }
});

test('enabling new full access acknowledges all process approvals with the existing single scope checkbox',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});let posted;
 const status={version:1,available:true,enabled:false,pending:false,jobs:[]},ui=synchronousState(new HostAccessControl({sessionId:'root',archived:false,busy:false,perform:fn=>fn()}));ui.state.status=status;ui.state.permission={mode:'confirm',hostAccess:status};ui.showDetails();
 const modal=nodes(ui.render()).find(n=>n.type===Modal),copy=text(modal.props.children);
 for(const phrase of ['独立审查','正式整合','文稿构建','页图','原文授权','报告','科学失败','争议','旧完全访问'])assert.ok(copy.includes(phrase),phrase);
 assert.equal(nodes(modal.props.children).filter(n=>n.type==='input').length,1);
 globalThis.fetch=async(url,options)=>{if(options.method==='POST')posted=JSON.parse(options.body);return {ok:true,json:async()=>url.endsWith('/permissions')?{mode:'fullAccess',hostAccess:{...status,enabled:true}}:{...status,enabled:true}};};
 await ui.save(true);assert.equal(posted.acknowledgedAutomaticApprovals,true);assert.equal(posted.researchAutomationPolicy.version,2);
});
