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
const view=(data,extra={})=>synchronousState(new ChatWorkflows({data,session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){},...extra}));

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
  data.intents=[{id:'bound-intent',experimentId:'e',approvalId:'run-approval',status:'prepared',manifest:{},manifestDigest:'fixed',runGrant:{id:'revoked-grant'}}];
  data.approvals=[{id:'run-approval',status:'pending'}];
  const ui=view(data);
  assert.equal(button(ui,'提交授权内正式实验').props.disabled,true);
  assert.equal(button(ui,'批准并提交正式实验'),undefined);
});
