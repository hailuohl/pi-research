import test from 'node:test';
import assert from 'node:assert/strict';
import {ChatWorkflows} from '../../dist/web/assets/chat-workflows.js';
import {synchronousState} from '../support/ui.mjs';

const root={id:'root',projectId:'project',role:'coordinator',state:'idle'};
const command=['python','-I','-S','analysis with  spaces.py','a"b','中文\\input.csv'];
function intent(id='intent-a',extra={}){return {id,projectId:'project',version:1,rootSessionId:root.id,experimentId:'experiment',approvalId:'approval-'+id,status:'prepared',manifestDigest:'manifest-'+id,manifest:{snapshotDigest:'source-'+id,sourceFiles:[{path:'analysis with spaces.py',digest:'fixed',size:12}],contract:{command,metrics:{}}},...extra};}
function approval(fixed,extra={}){return {id:fixed.approvalId,projectId:'project',version:3,subjectKind:'run-intent',subjectId:fixed.id,scope:'run.submit',digest:fixed.manifestDigest,status:'pending',...extra};}
function fixture(extra={}){const fixed=intent(),record=approval(fixed),data={project:{id:'project',archived:false,settings:{enabled:true}},sessions:[root],experiments:[{id:'experiment',title:'Same title'}],intents:[fixed],approvals:[record],runs:[],campaigns:[],members:[],researchCandidates:[],runGrants:[],tasks:[],teams:[],observations:[],decisions:[],developmentTasks:[],sandboxJobs:[],reviews:[],changeProposals:[],experimentPlans:[]};return {fixed,record,data,ui:synchronousState(new ChatWorkflows({data,session:root,busy:false,perform:operation=>operation(),onSession(){},onExperiment(){},onRun(){},...extra}))};}
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):node&&typeof node==='object'?[node,...nodes(node.props?.children)]:[];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'||typeof node==='number'?String(node):'';
const button=(card,name)=>nodes(card).find(node=>node.type==='button'&&text(node)===name);
const card=(setup,fixed=setup.fixed,campaignId)=>setup.ui.runIntentCard(fixed,false,campaignId);
function captureRequests(context,onRequest=()=>{}){const previous=globalThis.fetch,requests=[];context.after(()=>{globalThis.fetch=previous;});globalThis.fetch=async(url,init)=>{const request={url,body:JSON.parse(init.body)};requests.push(request);onRequest(request);return {ok:true,json:async()=>({})};};return requests;}

test('same-title formal cards expose distinct identity, fixed sources and exact JSON argv outside nested details',()=>{
 const setup=fixture(),second=intent('intent-b');setup.data.intents.push(second);setup.data.approvals.push(approval(second));
 const firstCard=card(setup),secondCard=card(setup,second),summary=node=>text(node.props.children.find(child=>child?.type==='summary'));
 assert.notEqual(summary(firstCard),summary(secondCard));assert.match(summary(firstCard),/intent-a/);assert.match(summary(secondCard),/intent-b/);
 for(const [rendered,fixed] of [[firstCard,setup.fixed],[secondCard,second]]){
  const visible=text(rendered.props.children.filter(child=>child?.type!=='details'));
  assert.ok(visible.includes(fixed.manifest.snapshotDigest.slice(0,8)));assert.ok(visible.includes(fixed.manifestDigest.slice(0,8)));assert.match(visible,/1 个固定文件/);assert.ok(visible.includes(JSON.stringify(command)));
  const frozenCommand=nodes(rendered).find(node=>node.type==='p'&&node.props.className?.includes('code-wrap')&&text(node).includes(JSON.stringify(command)));assert.ok(frozenCommand);assert.equal(frozenCommand.props.style?.whiteSpace,'pre-wrap');
 }
});

test('rejecting the selected pending card sends only its precise approval version and preserves reopened history',async context=>{
 const setup=fixture(),second=intent('intent-b');setup.data.intents.push(second);setup.data.approvals.push(approval(second));const before=structuredClone(setup.data.intents);
 const requests=captureRequests(context,request=>{assert.equal(request.url,'/api/approvals/'+second.approvalId+'/decide');const record=setup.data.approvals.find(row=>row.id===second.approvalId);record.status='rejected';record.version++;});
 const reject=button(card(setup,second),'拒绝此固定运行');assert.ok(reject);await reject.props.onClick();
 assert.deepEqual(requests,[{url:'/api/approvals/'+second.approvalId+'/decide',body:{expectedVersion:3,approved:false}}]);assert.deepEqual(setup.data.intents,before);assert.equal(setup.record.status,'pending');assert.deepEqual(setup.data.runs,[]);
 const reopened=fixture();reopened.ui.props={...reopened.ui.props,data:structuredClone(setup.data)};const history=reopened.ui.runIntentCard(reopened.ui.props.data.intents[1],false);
 assert.match(text(history),/固定运行审批已拒绝/);assert.equal(button(history,'拒绝此固定运行'),undefined);assert.equal(button(history,'确认并让智能体执行'),undefined);assert.ok(text(history).includes(second.manifest.snapshotDigest));
});

test('captured rejection callbacks cannot cross scope, authorization, version, lifecycle or queue boundaries',async context=>{
 const requests=captureRequests(context);
 const changes={
  automatic:setup=>{setup.record.automaticApproval={id:'automatic'};},
  'full access':setup=>{setup.record.fullAccess={continuationId:'task',digest:'fixed'};},
  'working grant':setup=>{setup.record.workingGrant={id:'grant'};},
  'intent grant':setup=>{setup.fixed.runGrant={id:'grant'};},
  'approval grant':setup=>{setup.record.runGrant={id:'grant'};},
  approved:setup=>{setup.record.status='approved';},
  rejected:setup=>{setup.record.status='rejected';},
  stale:setup=>{setup.record.status='stale';},
  'approval version':setup=>{setup.record.version++;},
  'approval subject':setup=>{setup.record.subjectId='another-intent';},
  'approval scope':setup=>{setup.record.scope='development.test';},
  'approval kind':setup=>{setup.record.subjectKind='development-task';},
  'approval digest':setup=>{setup.record.digest='changed';},
  'approval project':setup=>{setup.record.projectId='foreign';},
  'approval reference':setup=>{setup.fixed.approvalId='replacement';},
  manifest:setup=>{setup.fixed.manifestDigest='changed';},
  'intent project':setup=>{setup.fixed.projectId='foreign';},
  'intent owner':setup=>{setup.fixed.rootSessionId='foreign';},
  submitted:setup=>{setup.fixed.status='submitted';},
  run:setup=>{setup.fixed.runId='existing-run';},
  queued:setup=>{setup.ui.queuedRunIntents.add(setup.fixed.id+':'+setup.fixed.manifestDigest);},
  'locally approved':setup=>{setup.ui.approvedRunIntents.add(setup.fixed.id+':'+setup.fixed.manifestDigest);},
  task:setup=>{setup.ui.props={...setup.ui.props,session:{...root,taskId:'task'}};},
  role:setup=>{setup.ui.props={...setup.ui.props,session:{...root,role:'reviewer'}};},
  session:setup=>{setup.ui.props={...setup.ui.props,session:{...root,id:'other'}};},
  project:setup=>{setup.ui.props={...setup.ui.props,data:{...setup.data,project:{...setup.data.project,id:'other'}}};},
  'archived project':setup=>{setup.data.project.archived=true;},
  'archived session':setup=>{setup.ui.props={...setup.ui.props,session:{...root,state:'archived'}};},
  busy:setup=>{setup.ui.props={...setup.ui.props,busy:true};},
  unmounted:setup=>setup.ui.componentWillUnmount(),
 };
 for(const [name,change] of Object.entries(changes)){
  const setup=fixture(),reject=button(card(setup),'拒绝此固定运行');assert.ok(reject,name);change(setup);await reject.props.onClick();assert.deepEqual(requests,[],name);
 }
});

test('deferred rejection checks the captured tuple before deciding and duplicate clicks cannot race confirmation',async context=>{
 const requests=captureRequests(context);
 for(const change of [setup=>{setup.record.version++;},setup=>{setup.ui.props={...setup.ui.props,session:{...root,id:'other'}};},setup=>setup.ui.componentWillUnmount(),setup=>{setup.record.automaticApproval={id:'automatic'};},setup=>{setup.fixed.runGrant={id:'grant'};}]){
  let release;const setup=fixture({perform:operation=>new Promise(resolve=>{release=()=>Promise.resolve(operation()).then(resolve);})}),reject=button(card(setup),'拒绝此固定运行');assert.ok(reject);const waiting=reject.props.onClick();change(setup);await release();await waiting;assert.deepEqual(requests,[]);
 }
 let release;const setup=fixture({perform:operation=>new Promise(resolve=>{release=()=>Promise.resolve(operation()).then(resolve);})}),rendered=card(setup),reject=button(rendered,'拒绝此固定运行'),confirm=button(rendered,'确认并让智能体执行');
 const waiting=reject.props.onClick();await reject.props.onClick();await confirm.props.onClick();await release();await waiting;assert.deepEqual(requests,[{url:'/api/approvals/'+setup.record.id+'/decide',body:{expectedVersion:3,approved:false}}]);
});

test('ordinary campaign intents reject only their own approval and foreign or grant-bound members stay read-only',async context=>{
 const requests=captureRequests(context),setup=fixture(),campaign={id:'campaign',rootSessionId:root.id};setup.data.campaigns.push(campaign);setup.data.members.push({campaignId:campaign.id,intentId:setup.fixed.id});setup.fixed.rootSessionId=undefined;
 const reject=button(card(setup,setup.fixed,campaign.id),'拒绝此固定运行');assert.ok(reject);setup.data.members=[];await reject.props.onClick();assert.deepEqual(requests,[]);
 setup.data.members.push({campaignId:campaign.id,intentId:setup.fixed.id});await reject.props.onClick();assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/approvals/'+setup.record.id+'/decide');
 setup.fixed.rootSessionId='foreign';assert.equal(button(card(setup,setup.fixed,campaign.id),'拒绝此固定运行'),undefined);
 setup.fixed.runGrant={id:'task-grant'};setup.data.runGrants.push({id:'task-grant',sessionId:root.id,taskBinding:{taskId:'task'},validity:'current',effectiveState:'active',usage:{remaining:1},expiresAt:'2099-01-01T00:00:00.000Z'});assert.equal(button(card(setup,setup.fixed,campaign.id),'拒绝此固定运行'),undefined);
});

test('captured confirmation rejects newly automatic, busy or changed approval metadata without requests',async context=>{
 const requests=captureRequests(context);
 for(const change of [setup=>{setup.record.automaticApproval={id:'automatic'};},setup=>{setup.ui.props={...setup.ui.props,busy:true};},setup=>{setup.record.version++;},setup=>{setup.record.subjectId='other';},setup=>{setup.record.digest='changed';},setup=>{setup.fixed.projectId='foreign';}]){
  const setup=fixture(),confirm=button(card(setup),'确认并让智能体执行');assert.ok(confirm);change(setup);await confirm.props.onClick();assert.deepEqual(requests,[]);
 }
 let release;const setup=fixture({perform:operation=>new Promise(resolve=>{release=()=>Promise.resolve(operation()).then(resolve);})}),confirm=button(card(setup),'确认并让智能体执行'),waiting=confirm.props.onClick();setup.record.version++;await release();await waiting;assert.deepEqual(requests,[]);
});

test('valid confirmation continues the exact selected intent once and then exposes no rejection',async context=>{
 const requests=captureRequests(context),setup=fixture(),second=intent('intent-b');setup.data.intents.push(second);setup.data.approvals.push(approval(second));const confirm=button(card(setup,second),'确认并让智能体执行');
 await confirm.props.onClick();assert.deepEqual(requests.map(request=>request.url),['/api/approvals/'+second.approvalId+'/decide','/api/sessions/root/messages']);assert.deepEqual(requests[0].body,{expectedVersion:3,approved:true});assert.ok(requests[1].body.content.includes('run_submit({intentId:"'+second.id+'"})'));assert.ok(requests[1].body.content.includes(second.manifestDigest));
 await confirm.props.onClick();assert.equal(requests.length,2);assert.equal(button(card(setup,second),'拒绝此固定运行'),undefined);assert.equal(button(card(setup,second),'确认并让智能体执行'),undefined);
});

test('an approval response cannot queue a continuation after approval identity or authorization changes',async context=>{
 const previous=globalThis.fetch;context.after(()=>{globalThis.fetch=previous;});
 for(const change of [setup=>{setup.record.automaticApproval={id:'automatic'};},setup=>{setup.record.subjectId='other';},setup=>{setup.record.digest='changed';},setup=>{setup.record.status='rejected';},setup=>{setup.record.version++;},setup=>{setup.fixed.runGrant={id:'grant'};}]){
  const requests=[];let finishApproval;globalThis.fetch=(url,init)=>{requests.push({url,body:JSON.parse(init.body)});if(url.endsWith('/decide'))return new Promise(resolve=>{finishApproval=()=>resolve({ok:true,json:async()=>({})});});return Promise.resolve({ok:true,json:async()=>({})});};
  const setup=fixture(),waiting=button(card(setup),'确认并让智能体执行').props.onClick();change(setup);finishApproval();await Promise.allSettled([waiting]);assert.deepEqual(requests,[{url:'/api/approvals/'+setup.fixed.approvalId+'/decide',body:{expectedVersion:3,approved:true}}]);
 }
});

test('confirmation accepts the precise approved version reflected during its successful response',async context=>{
 const setup=fixture(),requests=captureRequests(context,request=>{if(request.url.endsWith('/decide')){setup.record.status='approved';setup.record.version++;}});
 await button(card(setup),'确认并让智能体执行').props.onClick();assert.deepEqual(requests.map(request=>request.url),['/api/approvals/'+setup.record.id+'/decide','/api/sessions/root/messages']);assert.equal(button(card(setup),'拒绝此固定运行'),undefined);
});
