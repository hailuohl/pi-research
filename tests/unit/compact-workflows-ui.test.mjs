import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ChatWorkflows} from '../../dist/web/assets/chat-workflows.js';
import {PublicationDialogue} from '../../dist/web/assets/publication-dialogue.js';
import {WakeupPanel} from '../../dist/web/assets/campaigns.js';

const session={id:'root',role:'coordinator',state:'idle',model:{provider:'test',model:'fixture'}};
const base=()=>({project:{id:'p',archived:false,settings:{enabled:true}},sessions:[session],campaigns:[],members:[],observations:[],decisions:[],experiments:[],runs:[],intents:[],developmentTasks:[],sandboxJobs:[],reviews:[],tasks:[],teams:[],changeProposals:[],approvals:[],workingGrants:[],researchCandidates:[],experimentPlans:[],budgets:[],wakeups:[],manuscripts:[],publicationJobs:[],publicationReviews:[],reports:[]});
const props=data=>({data,session,busy:false,disabled:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){}});

test('completed runs share one closed history while pending approvals and failed runs stay outside it',()=>{
 const data=base(),manifest={snapshotDigest:'source',contractDigest:'contract',contract:{command:['node','test.mjs'],metrics:{}}};
 data.experiments=[{id:'e-done',title:'Completed run'},{id:'e-pending',title:'Needs approval'},{id:'e-failed',title:'Failed run'}];
 data.intents=['done','pending','failed'].map(key=>({id:key,rootSessionId:'root',experimentId:`e-${key}`,approvalId:`a-${key}`,status:key==='pending'?'prepared':'submitted',runId:key==='pending'?undefined:`r-${key}`,manifest,manifestDigest:key}));
 data.runs=[{id:'r-done',experimentId:'e-done',state:'succeeded'},{id:'r-failed',experimentId:'e-failed',state:'failed'}];
 data.approvals=data.intents.map(i=>({id:i.approvalId,status:i.id==='pending'?'pending':'approved',version:1}));
 const html=renderToStaticMarkup(createElement(ChatWorkflows,props(data)));
 assert.match(html,/<details class="workflow-history"><summary>已完成事项（1）<\/summary>/);
 const [current,older]=html.split('<details class="workflow-history">');
 assert.match(current,/Needs approval|确认并让智能体执行/);assert.match(current,/Failed run/);assert.doesNotMatch(current,/Completed run/);
 assert.match(older,/Completed run/);assert.doesNotMatch(older,/Needs approval|Failed run/);
});

test('completed notifications collapse together and actionable or failed notifications remain visible',()=>{
 const data=base();data.wakeups=[{id:'done',rootSessionId:'root',state:'completed',sourceKind:'run-result',sourceId:'r1',attempts:1,maxAttempts:1},{id:'pending',rootSessionId:'root',state:'pending',sourceKind:'run-result',sourceId:'r2',attempts:0,maxAttempts:1},{id:'failure',rootSessionId:'root',state:'failed',sourceKind:'run-result',sourceId:'r3',attempts:1,maxAttempts:1,error:'Actual failure must remain visible'},{id:'foreign',rootSessionId:'other-root',state:'failed',sourceKind:'run-result',sourceId:'r4',error:'Foreign failure'}];
 const html=renderToStaticMarkup(createElement(WakeupPanel,{...props(data),sessionId:'root'}));
 assert.match(html,/<details class="notification-history"><summary>已结束的结果通知（1）/);
 const current=html.split('<details class="notification-history">')[0];
 assert.match(current,/请求分析/);assert.match(current,/Actual failure must remain visible/);assert.doesNotMatch(html,/Foreign failure/);
});

test('old manuscript revisions collapse but an old pending review keeps its exact approval visible',()=>{
 const data=base();data.manuscripts=[{id:'new',previousRevisionId:'old',rootSessionId:'root',title:'Current paper',files:[],engine:'xelatex'},{id:'old',rootSessionId:'root',title:'Old paper',files:[],engine:'xelatex'}];
 const job=(id,revisionId)=>({id,revisionId,resultId:`result-${id}`,state:'succeeded',integrity:'complete',engine:'xelatex',mainFile:'main.tex',resources:{cpus:1,memoryMb:768,timeoutSeconds:150},imageDigest:'image',sourceDigest:'source'});
 data.publicationJobs=[job('j-new','new'),job('j-old','old')];
 let html=renderToStaticMarkup(createElement(PublicationDialogue,props(data)));
 assert.match(html,/<details class="workflow-history"><summary>历史文稿（1）/);
 assert.match(html.split('<details class="workflow-history">')[0],/Current paper/);
 data.publicationReviews=[{id:'review',publicationResultId:'result-j-old',rootSessionId:'root',teamId:'review-team',status:'awaiting_approval',validity:'current'}];data.teams=[{id:'review-team',delegationEnabled:true}];
 html=renderToStaticMarkup(createElement(PublicationDialogue,props(data)));
 assert.doesNotMatch(html,/历史文稿/);assert.match(html,/<details class="workflow-card" open=""><summary>文稿 · Old paper/);assert.match(html,/批准并启动审查/);
});

test('old failed or uncertain manuscript builds remain visible even after a new revision exists',()=>{
 for(const state of ['failed','unknown','timed_out','cancelled','succeeded']){
  const data=base();data.manuscripts=[{id:'new',previousRevisionId:'old',rootSessionId:'root',title:'New revision',files:[],engine:'xelatex'},{id:'old',rootSessionId:'root',title:'Old failed revision',files:[],engine:'xelatex'}];
  data.publicationJobs=[{id:'failure',revisionId:'old',state,error:'FAILED_COMPILATION_VISIBLE',integrity:'pending',engine:'xelatex',mainFile:'main.tex',resources:{cpus:1,memoryMb:768,timeoutSeconds:150},imageDigest:'image',sourceDigest:'source'}];
  const html=renderToStaticMarkup(createElement(PublicationDialogue,props(data)));
  assert.doesNotMatch(html,/历史文稿/);assert.match(html,/FAILED_COMPILATION_VISIBLE/);assert.match(html,/<details class="workflow-card" open=""><summary>文稿 · Old failed revision/);
 }
});
