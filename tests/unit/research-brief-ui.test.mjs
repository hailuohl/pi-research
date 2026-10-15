import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ChatWorkflows} from '../../dist/web/assets/chat-workflows.js';

const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const content=n=>Array.isArray(n)?n.map(content).join(''):n&&typeof n==='object'?content(n.props?.children):typeof n==='string'?n:'';
const button=(ui,name)=>nodes(ui.render()).find(n=>n.type==='button'&&content(n)===name);
const session={id:'root',role:'coordinator',state:'idle'};
const brief=(extra={})=>({id:'brief',rootSessionId:'root',version:1,revision:1,status:'ready',digest:'fixed',question:'比较两个模型',scope:'固定数据',constraints:[],successCriteria:['误差下降'],clarificationQuestions:[],literatureSummary:'测试资料',hypotheses:[],evidenceIds:[],steps:[{title:'运行基线',description:'固定比较条件'}],...extra});
const data=(b=brief())=>({project:{id:'project',archived:false,settings:{enabled:false}},sessions:[session],campaigns:[],members:[],observations:[],decisions:[],experiments:[],runs:[],intents:[],developmentTasks:[],sandboxJobs:[],reviews:[],tasks:[],teams:[],changeProposals:[],approvals:[],researchCandidates:[],experimentPlans:[],researchBrief:b?{brief:b,latestId:b.id,history:[{id:b.id,revision:1,status:b.status,digest:b.digest}],evidenceChecks:[]}:null});
const view=(d)=>synchronousState(new ChatWorkflows({data:d,session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){}}));

test('research plan appears only in its owner dialogue and stale evidence cannot be confirmed',()=>{
  assert.equal(view(data(null)).render(),null);
  assert.equal(button(view(data(brief({rootSessionId:'other'}))),'确认研究问题与计划'),undefined);
  assert.equal(button(view(data(brief({status:'clarifying',clarificationQuestions:['指标是什么？']}))),'确认研究问题与计划'),undefined);
  const d=data();d.researchBrief.evidenceChecks=[{evidenceId:'source',current:false,code:'STALE'}];
  assert.equal(button(view(d),'确认研究问题与计划').props.disabled,true);
});

test('confirmation queues the fixed plan once with a stable key and protects switched dialogues',async t=>{
  const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);
  const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']??options.headers['idempotency-key']});return {ok:true,json:async()=>({})};};
  const ui=view(data());await ui.continueResearchBrief();
  assert.equal(requests[0].url,'/api/operations/research_brief_confirm');
  assert.equal(requests[0].body.sessionId,'root');assert.equal(requests[0].body.input.briefId,'brief');
  assert.equal(requests[1].url,'/api/sessions/root/messages');assert.match(requests[1].body.content,/digest为"fixed"/);
  const key=requests[1].key;assert.equal(key,'research-brief-continue:brief:fixed');
  const reopened=view(data(brief({status:'confirmed',version:2})));await reopened.continueResearchBrief();
  assert.equal(requests.length,3);assert.equal(requests[2].key,key);
  let release;globalThis.fetch=()=>new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({})}));
  const switched=view(data()),pending=switched.continueResearchBrief();switched.props={...switched.props,session:{...session,id:'other'}};release();
  await assert.rejects(pending,/当前对话已切换/);
});

test('queue failure keeps the confirmed plan available for retry',async t=>{
  const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);
  globalThis.fetch=async(url)=>url.endsWith('/messages')?{ok:false,status:503,json:async()=>({error:{code:'TEST_FAILURE',message:'队列暂不可用'}})}:{ok:true,json:async()=>({})};
  await assert.rejects(view(data()).continueResearchBrief(),/队列暂不可用/);
  const reopened=view(data(brief({status:'confirmed',version:2})));
  assert.equal(button(reopened,'继续已确认计划').props.disabled,false);
});
