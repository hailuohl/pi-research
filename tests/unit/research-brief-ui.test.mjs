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

const runData=()=>{const d=data(null);d.experiments=[{id:'experiment',title:'Fixed experiment'}];d.intents=[{id:'intent',rootSessionId:'root',experimentId:'experiment',status:'submitted',runId:'run',manifestDigest:'a'.repeat(64),manifest:{}}];d.runs=[{id:'run',experimentId:'experiment',intentId:'intent',state:'succeeded',integrity:'complete',exitCode:0,manifestDigest:'a'.repeat(64),manifest:{snapshotDigest:'b'.repeat(64),contract:{command:['python','run.py']}},artifactIds:[]}];return d;};
const summaryView=ui=>{const n=nodes(ui.render()).find(n=>n.type?.name==='SessionWorkSummaryCard');return n.type(n.props);};
test('manual current validation uses one GET, preserves original identity and expires on refresh or disconnection',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,method:options.method});return {ok:true,json:async()=>({projectId:'project',sessionId:'root',kind:'run',id:'run',manifestDigest:'a'.repeat(64),sourceDigest:'b'.repeat(64),receiptCheck:'pass',applicability:'current',checkedAt:'2026-10-22T01:00:00.000Z'})};};
 const ui=view(runData());assert.match(content(summaryView(ui)),/当前适用性：未核对/);await ui.checkCurrentValidation();assert.equal(requests.length,1);assert.equal(requests[0].method,'GET');assert.match(requests[0].url,/\/validation\?/);assert.match(content(summaryView(ui)),/核对时观察到一致/);
 const prev=ui.props;ui.props={...ui.props,readCurrent:false};ui.componentDidUpdate(prev);assert.match(content(summaryView(ui)),/当前适用性：未知/);const disconnected=ui.props;ui.props={...ui.props,readCurrent:true};ui.componentDidUpdate(disconnected);assert.doesNotMatch(content(summaryView(ui)),/核对时观察到一致/);
 const reopened=view(runData());assert.match(content(summaryView(reopened)),/当前适用性：未核对/);assert.equal(requests.length,1,'reopening never executes or checks automatically');
});
test('late validation and skipped perform cannot attach a result to another object or stay pending',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let release;globalThis.fetch=()=>new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({projectId:'project',sessionId:'root',kind:'run',id:'run',manifestDigest:'a'.repeat(64),sourceDigest:'b'.repeat(64),receiptCheck:'pass',applicability:'current',checkedAt:'now'})}));
 const ui=view(runData()),pending=ui.checkCurrentValidation(),prev=ui.props;ui.props={...ui.props,session:{...session,id:'other'}};ui.componentDidUpdate(prev);release();await pending;assert.equal(ui.state.validationResult,null);
 const skipped=view(runData());skipped.props={...skipped.props,perform:async()=>undefined};await skipped.checkCurrentValidation();assert.equal(skipped.state.validationPending,false);assert.doesNotMatch(content(summaryView(skipped)),/核对时观察到一致/);
});
test('known current revision changes keep the original successful historical receipt visible',()=>{
 const d=runData();d.experiments[0].revision=2;d.runs[0].manifest.experimentRevision=1;const rendered=summaryView(view(d));assert.match(content(rendered),/当前已知来源状态：已失效/);assert.ok(nodes(rendered).some(n=>n.props?.value==='pass'&&n.props?.caption==='通过'),'the old succeeded complete exit0 history remains pass');
});
test('a later snapshot refresh or another busy operation withdraws current applicability, while own final refresh can finish',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const result={projectId:'project',sessionId:'root',kind:'run',id:'run',manifestDigest:'a'.repeat(64),sourceDigest:'b'.repeat(64),observedSourceDigest:'b'.repeat(64),receiptCheck:'pass',applicability:'current',checkedAt:'2026-10-22T01:00:00.000Z'};globalThis.fetch=async()=>({ok:true,json:async()=>result});
 const ui=view(runData());ui.props={...ui.props,perform:async fn=>{const oldProps=ui.props;ui.props={...ui.props,busy:true};ui.componentDidUpdate(oldProps);const value=await fn(),busyProps=ui.props;ui.props={...ui.props,data:runData(),busy:false};ui.componentDidUpdate(busyProps);return value;}};await ui.checkCurrentValidation();assert.match(content(summaryView(ui)),/核对时观察到一致/);assert.match(content(summaryView(ui)),/本次观察源码摘要：b{64}/);
 const previous=ui.props;ui.props={...ui.props,data:runData()};ui.componentDidUpdate(previous);assert.doesNotMatch(content(summaryView(ui)),/核对时观察到一致/);await ui.checkCurrentValidation();const beforeBusy=ui.props;ui.props={...ui.props,busy:true};ui.componentDidUpdate(beforeBusy);assert.doesNotMatch(content(summaryView(ui)),/核对时观察到一致/);assert.equal(ui.state.validationResult,null);
});
test('host check reasons are visible as safe descriptions and codes without filesystem error text',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);globalThis.fetch=async()=>({ok:true,json:async()=>({projectId:'project',sessionId:'root',kind:'run',id:'run',manifestDigest:'a'.repeat(64),sourceDigest:'b'.repeat(64),receiptCheck:'unknown',applicability:'unknown',receiptReason:'READ_MISSING',applicabilityReason:'RECEIPT_NOT_VERIFIED',checkedAt:'now'})});const ui=view(runData());await ui.checkCurrentValidation();assert.match(content(summaryView(ui)),/所需文件或记录缺失.*READ_MISSING/);assert.match(content(summaryView(ui)),/尚无本次成功回执核验/);
});
test('own final refresh cannot restore current after a confirmed experiment revision or contract change',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);
 for(const change of ['revision','contract']){
  let finishGet,finishRefresh;globalThis.fetch=()=>new Promise(resolve=>finishGet=()=>resolve({ok:true,json:async()=>({projectId:'project',sessionId:'root',kind:'run',id:'run',manifestDigest:'a'.repeat(64),sourceDigest:'b'.repeat(64),receiptCheck:'pass',applicability:'current',checkedAt:'2026-10-22T01:00:00.000Z'})}));
  const initial=runData();Object.assign(initial.experiments[0],{revision:1,contractDigest:'original-contract'});Object.assign(initial.runs[0].manifest,{experimentRevision:1,contractDigest:'original-contract'});const ui=view(initial);
  ui.props={...ui.props,perform:async fn=>{const previous=ui.props;ui.props={...ui.props,busy:true};ui.componentDidUpdate(previous);const result=await fn();return new Promise(resolve=>finishRefresh=()=>{const previous=ui.props,updated=structuredClone(ui.props.data);if(change==='revision')updated.experiments[0].revision=2;else updated.experiments[0].contractDigest='new-contract';ui.props={...ui.props,data:updated,busy:false};ui.componentDidUpdate(previous);resolve(result);});}};
  const pending=ui.checkCurrentValidation();assert.equal(ui.state.validationPending,true);finishGet();await new Promise(resolve=>setImmediate(resolve));finishRefresh();await pending;const rendered=summaryView(ui);assert.match(content(rendered),/当前已知来源状态：已失效/);assert.doesNotMatch(content(rendered),/核对时观察到一致/);assert.equal(ui.state.validationPending,false);assert.ok(nodes(rendered).some(n=>n.props?.value==='pass'&&n.props?.caption==='通过'));
 }
});

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
  assert.equal(requests[0].url,'/api/operations/workflow_confirm');
  assert.equal(requests[0].body.sessionId,'root');assert.deepEqual(requests[0].body.input,{sourceKind:'brief',sourceId:'brief',sourceDigest:'fixed',expectedVersion:1});
  assert.equal(requests.length,1);
  const key=requests[0].key;assert.equal(key,'workflow-confirm:brief:brief:fixed:1:0');await ui.continueResearchBrief();assert.equal(requests[1].key,key);
  const reopened=view(data(brief({status:'confirmed',version:2})));await reopened.continueResearchBrief();
  assert.equal(requests.length,3);assert.equal(requests[2].url,'/api/operations/workflow_confirm');assert.equal(requests[2].key,'workflow-confirm:brief:brief:fixed:2:0');
  let release;globalThis.fetch=()=>new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({})}));
  const switched=view(data()),pending=switched.continueResearchBrief();switched.props={...switched.props,session:{...session,id:'other'}};release();
  await assert.rejects(pending,/当前对话或版本已变化/);
});

test('queue failure keeps the confirmed plan available for retry',async t=>{
  const before=globalThis.fetch;t.after(()=>globalThis.fetch=before);
  globalThis.fetch=async(url)=>url.endsWith('/workflow_confirm')?{ok:false,status:503,json:async()=>({error:{code:'TEST_FAILURE',message:'队列暂不可用'}})}:{ok:true,json:async()=>({})};
  await assert.rejects(view(data()).continueResearchBrief(),/队列暂不可用/);
  const reopened=view(data(brief({status:'confirmed',version:2})));
  assert.equal(button(reopened,'继续已确认计划').props.disabled,false);
});

test('current task summary links to the original Run and separates execution, validation and scientific judgment',()=>{
  const d=data(null);d.experiments=[{id:'experiment',title:'Fixed experiment'}];
  d.intents=[{id:'intent',rootSessionId:'root',experimentId:'experiment',status:'submitted',runId:'run',manifestDigest:'fixed-manifest',manifest:{}}];
  d.runs=[{id:'run',experimentId:'experiment',intentId:'intent',state:'unknown',integrity:'pending',exitCode:null,manifestDigest:'fixed-manifest',artifactIds:[]}];
  let opened;
  const ui=synchronousState(new ChatWorkflows({data:d,session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun:(runId,experimentId)=>opened={runId,experimentId}}));
  const rendered=ui.render();
  const summaryNode=nodes(rendered).find(n=>typeof n.type==='function'&&n.type.name==='SessionWorkSummaryCard');
  assert.ok(summaryNode,'current summary component is mounted in the conversation task panel');
  const summaryRendered=summaryNode.type(summaryNode.props),text=content(summaryRendered);
  assert.ok(text.includes('当前任务摘要'));
  assert.ok(text.includes('状态未知'));
  assert.ok(text.includes('验证依据与原始记录'));
  assert.ok(text.includes('不要自动重跑'));
  assert.ok(text.includes('未评估'));
  nodes(summaryRendered).find(n=>n.type==='button'&&content(n)==='打开原始运行').props.onClick();
  assert.deepEqual(opened,{runId:'run',experimentId:'experiment'});
});

test('an unreadable bound plan mounts a safe summary even when no other task cards exist',()=>{
  const d=data(null);d.researchBrief={brief:null,latestId:'original-brief',blockedReason:'BRIEF_CORRUPTED',history:[{id:'original-brief',question:'Unreadable private question'}],evidenceChecks:[]};
  const ui=view(d);ui.props={...ui.props,session:{...session,researchBriefId:'original-brief'}};
  const summaryNode=nodes(ui.render()).find(n=>typeof n.type==='function'&&n.type.name==='SessionWorkSummaryCard');
  assert.ok(summaryNode,'the failed brief must not leave an empty task panel');
  const summaryRendered=summaryNode.type(summaryNode.props),text=content(summaryRendered);
  assert.match(text,/当前任务摘要/);assert.match(text,/original-brief/);assert.match(text,/执行状态：受阻/);
  assert.ok(nodes(summaryRendered).some(n=>n.props?.value==='unknown'&&n.props.caption==='状态未知'),'validation remains explicitly unknown');
  assert.match(text,/原记录/);assert.match(text,/不要自动重跑/);
  assert.doesNotMatch(text,/Unreadable private question/);
  assert.equal(nodes(summaryRendered).some(n=>n.type==='button'),false,'failed reads offer no execution action');
  ui.props={...ui.props,session:{...session,researchBriefId:'another-brief'}};
  assert.equal(ui.render(),null,'switching sessions must not expose the previous failed brief');
  ui.props={...ui.props,session:{...session,researchBriefId:'original-brief'}};
  const reopened=nodes(ui.render()).find(n=>typeof n.type==='function'&&n.type.name==='SessionWorkSummaryCard');
  assert.equal(reopened.props.summary.source.id,'original-brief');
});
