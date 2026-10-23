import test from 'node:test';
import assert from 'node:assert/strict';
import {ChatWorkflows} from '../../dist/web/assets/chat-workflows.js';
import {synchronousState} from '../support/ui.mjs';
const session={id:'root',role:'coordinator',state:'idle'};
const brief={id:'brief',rootSessionId:'root',version:1,revision:1,status:'ready',digest:'a'.repeat(64),question:'UNIT scope',scope:'Synthetic',constraints:[],successCriteria:[],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[]};
const data=()=>({project:{id:'project',archived:false,settings:{enabled:false}},researchBrief:{brief,latestId:brief.id,evidenceChecks:[],history:[]},sessions:[session],campaigns:[],changeProposals:[],approvals:[],experiments:[],runs:[],intents:[],developmentTasks:[],sandboxJobs:[],reviews:[],tasks:[],teams:[],members:[],observations:[],decisions:[],researchCandidates:[],experimentPlans:[]});
function view(){return synchronousState(new ChatWorkflows({data:data(),session,busy:false,perform:fn=>fn(),onSession(){},onExperiment(){},onRun(){}}));}
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):node&&typeof node==='object'?[node,...nodes(node.props?.children)]:[];
const content=node=>Array.isArray(node)?node.map(content).join(''):node&&typeof node==='object'?content(node.props?.children):typeof node==='string'?node:'';
test('a plan confirmation uses one atomic request with exact source and no human prompt',async()=>{
 const before=globalThis.fetch,requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return {ok:true,json:async()=>({id:'receipt',route:'workflow',state:'queued'})};};
 try{await view().continueResearchBrief();assert.equal(requests.length,1);assert.equal(requests[0].url,'/api/operations/workflow_confirm');assert.deepEqual(requests[0].body.input,{sourceKind:'brief',sourceId:'brief',sourceDigest:brief.digest,expectedVersion:1});assert.equal(requests[0].body.sessionId,'root');assert.ok(requests[0].key.length<=200);}finally{globalThis.fetch=before;}
});
test('late confirmation cannot act on a newly selected dialogue or version',async()=>{
 const before=globalThis.fetch;let release;const requests=[];globalThis.fetch=async url=>{requests.push(url);return new Promise(resolve=>release=()=>resolve({ok:true,json:async()=>({})}));};
 try{const ui=view(),pending=ui.continueResearchBrief();ui.props={...ui.props,session:{...session,id:'other'}};release();await assert.rejects(pending,/切换|变化/);assert.deepEqual(requests,['/api/operations/workflow_confirm']);}finally{globalThis.fetch=before;}
});

test('the fixed change button uses its preview and one atomic approval plus integration request',async()=>{
 const previous=globalThis.fetch,ui=view(),proposal={id:'change',version:1,rootSessionId:'root',title:'UNIT fixed change',hypothesis:'Synthetic',state:'prepared',baseExperimentId:'base',baseRevision:1,baseSnapshot:{digest:'base'},candidateSnapshot:{digest:'candidate'},digest:'b'.repeat(64),approvalId:'approval',changes:[{path:'main.py'}],testsStatus:'passed'},approval={id:'approval',version:3,status:'pending'};
 ui.props.data.changeProposals=[proposal];ui.props.data.approvals=[approval];const button=()=>nodes(ui.render()).find(node=>node.type==='button'&&content(node)==='批准并整合固定变更');assert.equal(button().props.disabled,true);
 const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,body:options.body?JSON.parse(options.body):undefined});return {ok:true,json:async()=>url.endsWith('/diff')?{proposal,files:[{path:'main.py',before:'before',after:'after'}]}:{route:'workflow',state:'queued'}};};
 try{
  await ui.preview(proposal);assert.equal(button().props.disabled,false);requests.length=0;await button().props.onClick();assert.deepEqual(requests,[{url:'/api/operations/workflow_confirm',body:{projectId:'project',sessionId:'root',input:{sourceKind:'change',sourceId:'change',sourceDigest:proposal.digest,expectedVersion:1,approvalId:'approval',expectedApprovalVersion:3}}}]);
  const oldClick=button().props.onClick;ui.props={...ui.props,data:{...ui.props.data,approvals:[{...approval,version:4,status:'rejected'}]}};await assert.rejects(oldClick(),/变化/);assert.equal(requests.length,1);
 }finally{globalThis.fetch=previous;}
});

test('a saved continuation has a visible safe status and cannot be automatically reissued on reopen',()=>{
 const ui=view();ui.props.data.researchBrief.brief={...brief,status:'confirmed'};ui.props.data.workflowContinuations=[{id:'receipt',sourceKind:'brief',sourceId:'brief',sourceDigest:brief.digest,route:'workflow',state:'superseded',reasonCode:'WORKFLOW_MODEL_UNAVAILABLE',reason:'模型尚未就绪；请配置后发新的人工指令继续。'}];
 const rendered=ui.render();assert.match(content(rendered),/续接已失效.*模型尚未就绪/);const button=nodes(rendered).find(node=>node.type==='button'&&content(node)==='继续已确认计划');assert.equal(button.props.disabled,true);
 const history=nodes(rendered).find(node=>node.props?.className==='workflow-history');assert.ok(!history||!content(history).includes('后续处理'),'a blocked continuation cannot disappear inside completed history');assert.equal(nodes(rendered).find(node=>node.key==='research-brief').props.open,true);
});
