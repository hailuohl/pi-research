import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ChatWorkflows,proposalSession} from '../../dist/web/assets/chat-workflows.js';

const elements=n=>Array.isArray(n)?n.flatMap(elements):!n||typeof n!=='object'?[]:[n,...elements(n.props?.children)];
const text=n=>Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):typeof n==='string'?n:'';
const button=(view,name)=>elements(view.render()).find(n=>n.type==='button'&&text(n)===name);
const session={id:'root-a',role:'coordinator',state:'idle',model:{provider:'test',model:'fixture'}};
const base=()=>({project:{id:'p',archived:false,settings:{enabled:true}},sessions:[session],campaigns:[],members:[],observations:[],decisions:[],experiments:[],runs:[],intents:[],developmentTasks:[],sandboxJobs:[],reviews:[],tasks:[],teams:[],changeProposals:[],approvals:[],workingGrants:[],researchCandidates:[],experimentPlans:[]});
const proposal=(extra={})=>({id:'proposal',rootSessionId:'root-a',title:'Own fixed change',hypothesis:'Fixture, not a research result',state:'prepared',baseExperimentId:'e',baseRevision:1,baseSnapshot:{digest:'base'},candidateSnapshot:{digest:'candidate'},digest:'fixed',approvalId:'change-approval',changes:[{path:'main.py'}],testsStatus:'passed',...extra});
const campaign=(extra={})=>({id:'campaign',goal:'Own conversation plan',rootSessionId:'root-a',state:'draft',version:1,baselineExperimentId:'e',focusExperimentId:'e',rootModel:session.model,primaryMetric:'loss',direction:'min',limits:{maxRounds:2},planDigest:'plan',contractDigest:'contract',approvalId:'campaign-approval',autoAnalyze:false,...extra});
const runIntent=(extra={})=>({id:'run-intent',rootSessionId:'root-a',experimentId:'e',approvalId:'run-approval',status:'prepared',manifestDigest:'fixed-manifest',manifest:{snapshotDigest:'source',contractDigest:'contract',contract:{command:['python','main.py'],metrics:{loss:{unit:'mse'}}}},...extra});
const view=(data,extra={})=>synchronousState(new ChatWorkflows({data,session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){},...extra}));
test('native Run approval visibly states host authority and exact NVIDIA devices outside collapsed details',()=>{
 const data=base(),uuid='GPU-11111111-1111-1111-1111-111111111111';data.intents=[runIntent({manifest:{contract:{runner:'local',localRuntimeId:'python',gpu:{vendor:'nvidia',deviceIds:[uuid]}}}})];data.approvals=[{id:'run-approval',status:'pending',version:1}];const paragraphs=elements(view(data).render()).filter(n=>n.type==='p').map(text).join('\n');assert.match(paragraphs,/本地执行.*文件和网络不隔离.*python/);assert.ok(paragraphs.includes(uuid));
});

test('dialogue task cards exclude other main sessions while retaining scoped and unbound history',()=>{
  const data=base();
  data.campaigns=[campaign(),campaign({id:'foreign-campaign',rootSessionId:'root-b',goal:'Foreign goal'})];
  data.developmentTasks=[{id:'foreign-test',sessionId:'root-b',title:'Foreign test'}];
  data.reviews=[{id:'old-review',producerSessionId:'root-a',jobId:'old-job',taskId:'old-task',teamId:'old-team',status:'passed'},{id:'foreign-review',producerSessionId:'root-b'}];
  data.tasks=[{id:'old-task',execution:'output_submitted',acceptance:'accepted',result:{verdict:'accept',summary:'Older accepted result'}}];
  data.changeProposals=[proposal(),proposal({id:'old',rootSessionId:undefined,reviewId:'old-review',title:'Older scoped change',state:'applied'}),proposal({id:'foreign',rootSessionId:'root-b',title:'Foreign change'}),proposal({id:'legacy',rootSessionId:undefined,title:'Unbound old change'})];
  const rendered=text(view(data).render());
  assert.match(rendered,/Own conversation plan/);assert.match(rendered,/Older accepted result/);assert.match(rendered,/Older scoped change/);
  assert.match(rendered,/未绑定会话的历史提案/);assert.match(rendered,/Unbound old change/);
  assert.doesNotMatch(rendered,/Foreign goal|Foreign test|Foreign change/);
  assert.equal(proposalSession(data,data.changeProposals[1]),'root-a');
  assert.equal(proposalSession(data,data.changeProposals[3]),undefined);
  assert.equal(view(data,{session:{...session,taskId:'assistant-task'}}).render(),null);
});

test('approval followed by a failed development submission resumes at the exact approved object',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),approval={id:'dev-approval',status:'pending',version:2};data.approvals=[approval];
  data.developmentTasks=[{id:'dev-task',sessionId:'root-a',title:'Fixed test',grantId:approval.id,sourceDigest:'source',state:'prepared',manifest:{command:['python','main.py']}}];
  let fail=true;const requests=[];
  globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});if(url.endsWith('development_submit')&&fail)return{ok:false,status:409,json:async()=>({error:{message:'temporary queue conflict'}})};return{ok:true,json:async()=>({id:'job'})};};
  const ui=view(data);
  await assert.rejects(button(ui,'批准并提交开发测试').props.onClick(),/temporary queue conflict/);
  assert.deepEqual(requests.map(r=>r.url),['/api/approvals/dev-approval/decide','/api/operations/development_submit']);
  assert.deepEqual(requests[1].body,{projectId:'p',sessionId:'root-a',input:{developmentTaskId:'dev-task'}});
  approval.status='approved';fail=false;requests.length=0;
  await button(ui,'提交已批准开发测试').props.onClick();
  assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/operations/development_submit');
});

test('fixed differences must be complete and current before integrating, and delayed reads cannot outlive the dialogue',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),p=proposal();data.changeProposals=[p];data.approvals=[{id:p.approvalId,status:'pending',version:1}];
  const ui=view(data);assert.equal(button(ui,'批准并整合固定变更').props.disabled,true);
  let response={proposal:p,files:[]};globalThis.fetch=async()=>({ok:true,json:async()=>response});
  await assert.rejects(ui.preview(p),/固定差异与所选提案不一致/);
  response={proposal:{...p},files:[{path:'main.py',before:'old',after:'new',beforeMode:'100644',afterMode:'100644'}]};
  await ui.preview(p);assert.equal(button(ui,'批准并整合固定变更').props.disabled,false);
  p.digest='new-digest';assert.equal(button(ui,'批准并整合固定变更').props.disabled,true);
  p.sourceValidity='stale';assert.equal(button(ui,'批准并整合固定变更'),undefined);
  const history=view({...data,changeProposals:[proposal({rootSessionId:undefined,reviewId:undefined,testJobId:undefined})]});
  assert.equal(button(history,'批准并整合固定变更'),undefined);
  let release;globalThis.fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>response});});
  const late=view(data),waiting=late.preview({...p,digest:'fixed'});late.componentWillUnmount();release();await waiting;
  assert.deepEqual(late.state.previews,{});
});

test('research plan activation uses its fixed version and recovers after the approval already succeeded',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),c=campaign(),a={id:c.approvalId,status:'approved',version:2};data.campaigns=[c];data.approvals=[a];
  const requests=[];globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return{ok:true,json:async()=>({})};};
  await button(view(data),'启动已批准研究计划').props.onClick();
  assert.deepEqual(requests,[{url:'/api/campaigns/campaign/activate',body:{expectedVersion:1}}]);
  assert.equal(button(view(data,{session:{...session,state:'archived'}}),'启动已批准研究计划').props.disabled,true);
});

test('dialogue Run cards keep a bound RunGrant gate and never offer one-shot approval as fallback',()=>{
  const data=base();data.campaigns=[campaign({state:'active'})];
  data.members=[{campaignId:'campaign',intentId:'bound-intent'}];
  data.intents=[{id:'bound-intent',rootSessionId:'root-a',experimentId:'e',approvalId:'run-approval',status:'prepared',manifest:{},manifestDigest:'fixed',runGrant:{id:'revoked-grant'}}];
  data.approvals=[{id:'run-approval',status:'pending'}];
  const ui=view(data);
  assert.equal(button(ui,'确认并让智能体执行'),undefined);
  assert.match(text(ui.render()),/绑定授权不可用/);
  assert.doesNotMatch(text(ui.render()),/提交授权内正式实验|批准并提交正式实验/);
});

test('root-owned RunIntent cards approve once and retry the same queued message key',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),i=runIntent(),approval={id:i.approvalId,status:'pending',version:1};data.intents=[i];data.approvals=[approval];
  const requests=[];let failMessage=true;
  globalThis.fetch=async(url,init)=>{requests.push({url,init,body:JSON.parse(init.body)});if(url.endsWith('/messages')&&failMessage){failMessage=false;return{ok:false,status:503,json:async()=>({error:{message:'queue response lost'}})};}return{ok:true,json:async()=>({id:'queued'})};};
  const ui=view(data),confirm=button(ui,'确认并让智能体执行');assert.ok(confirm);
  await assert.rejects(confirm.props.onClick(),/queue response lost/);
  assert.deepEqual(requests.map(r=>r.url),['/api/approvals/run-approval/decide','/api/sessions/root-a/messages']);
  const content=requests[1].body.content;assert.match(content,/project_inspect\(\{runIntentId:"run-intent"\}\)/);assert.match(content,/fixed-manifest/);assert.match(content,/run_submit\(\{intentId:"run-intent"\}\)/);assert.match(content,/run_inspect/);assert.match(content,/不创建替代意向或补跑/);assert.doesNotMatch(content,/run_prepare\(/);
  await button(ui,'确认并让智能体执行').props.onClick();
  assert.equal(requests.length,3);assert.equal(requests[2].url,'/api/sessions/root-a/messages');
  assert.equal(requests[1].init.headers['Idempotency-Key'],requests[2].init.headers['Idempotency-Key']);
  assert.deepEqual(requests[2].body,requests[1].body);
  assert.equal(button(ui,'确认并让智能体执行'),undefined);assert.match(text(ui.render()),/执行消息已入队/);
});

test('legacy campaign intent continuation checks campaign membership and never owner-submits',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),c=campaign({state:'active'}),i=runIntent({rootSessionId:undefined});data.campaigns=[c];data.members=[{campaignId:c.id,intentId:i.id}];data.intents=[i];data.approvals=[{id:i.approvalId,status:'pending',version:1}];
  const requests=[];globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return{ok:true,json:async()=>({id:'queued'})};};
  const ui=view(data);await button(ui,'确认并让智能体执行').props.onClick();
  assert.deepEqual(requests.map(r=>r.url),['/api/approvals/run-approval/decide','/api/sessions/root-a/messages']);
  assert.match(requests[1].body.content,/campaign_inspect\(\{campaignId:"campaign"\}\)/);
  assert.doesNotMatch(requests[1].body.content,/project_inspect\(\{runIntentId|\/run-intents\/|run_submit\([^)]*sessionId/);
});

test('root RunGrant cards require an active grant bound to the current main session and keep task grants read-only',()=>{
  const data=base(),i=runIntent({runGrant:{id:'root-grant',digest:'grant-digest',approvalId:'grant-approval'}}),grant={id:'root-grant',sessionId:'root-a',validity:'current',effectiveState:'active',usage:{remaining:1},expiresAt:'2099-01-01T00:00:00.000Z'};data.intents=[i];data.approvals=[{id:i.approvalId,status:'approved',runGrant:i.runGrant}];data.runGrants=[grant];
  assert.ok(button(view(data),'确认并让智能体执行'));
  const foreign={...grant,sessionId:'root-b'};assert.equal(button(view({...data,runGrants:[foreign]}),'确认并让智能体执行'),undefined);
  const task={...grant,taskBinding:{taskId:'task-a'}};const taskView=view({...data,runGrants:[task]});assert.equal(button(taskView,'确认并让智能体执行'),undefined);assert.match(text(taskView.render()),/对应的已授权任务提交/);
  const exhausted={...grant,usage:{remaining:0}};assert.equal(button(view({...data,runGrants:[exhausted]}),'确认并让智能体执行'),undefined);
});

test('campaign membership cannot borrow another root intent unless its active RunGrant is bound here',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const c=campaign({state:'active'}),baseData=base();baseData.campaigns=[c];baseData.members=[{campaignId:c.id,intentId:'foreign-intent'}];
  const foreign=runIntent({id:'foreign-intent',rootSessionId:'root-b'}),foreignView=view({...baseData,intents:[foreign],approvals:[{id:foreign.approvalId,status:'approved'}]});
  assert.equal(button(foreignView,'确认并让智能体执行'),undefined);assert.match(text(foreignView.render()),/未绑定当前对话/);
  const ref={id:'root-grant',digest:'grant-digest',approvalId:'grant-approval'},i={...foreign,runGrant:ref},grant={id:ref.id,digest:ref.digest,approvalId:ref.approvalId,sessionId:'root-a',validity:'current',effectiveState:'active',usage:{remaining:1},expiresAt:'2099-01-01T00:00:00.000Z'};
  const data={...baseData,intents:[i],approvals:[{id:i.approvalId,status:'approved',runGrant:ref}],runGrants:[grant]},requests=[];
  globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return{ok:true,json:async()=>({id:'queued'})};};
  await button(view(data),'确认并让智能体执行').props.onClick();
  assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/sessions/root-a/messages');
  assert.match(requests[0].body.content,/root-grant/);assert.match(requests[0].body.content,/grant-digest/);assert.doesNotMatch(requests[0].body.content,/project_inspect|campaign_inspect/);
});

test('switching root after owner approval prevents the old card from queueing a message',async t=>{
  const previous=globalThis.fetch;t.after(()=>{globalThis.fetch=previous;});
  const data=base(),i=runIntent();data.intents=[i];data.approvals=[{id:i.approvalId,status:'pending',version:1}];let finishApproval;const requests=[];
  globalThis.fetch=(url,init)=>{requests.push(url);return new Promise(resolve=>{finishApproval=()=>resolve({ok:true,json:async()=>({})});});};
  const ui=view(data),pending=button(ui,'确认并让智能体执行').props.onClick();
  ui.props={...ui.props,session:{...session,id:'root-b'}};finishApproval();
  await assert.doesNotReject(pending);
  assert.deepEqual(requests,['/api/approvals/run-approval/decide']);
});

test('submitted Run history keeps its exact result link and measured metrics in the dialogue card',()=>{
  const data=base(),i=runIntent({status:'submitted',runId:'run-a'});data.intents=[i];data.approvals=[{id:i.approvalId,status:'approved'}];data.runs=[{id:'run-a',experimentId:'e',state:'failed',manifest:i.manifest,metrics:{loss:4.5}}];
  const ui=view(data),link=button(ui,'查看实际运行日志与结果');assert.ok(link);link.props.onClick();assert.match(text(ui.render()),/loss=4\.50000 mse/);assert.equal(button(ui,'确认并让智能体执行'),undefined);
});
