import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {publicRecord} from '../../dist/packages/domain/public-record.js';

function source(state,kind){
 if(kind==='brief')return state.app.researchBriefs.save(USER,state.project.id,state.session.id,{question:'UNIT fixed workflow',scope:'Synthetic only',constraints:[],successCriteria:['Read actual result'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect the fixed source'}],status:'ready',expectedRevisionId:null});
 if(kind==='campaign')return state.app.campaigns.prepare(USER,state.project.id,state.session.id,{goal:'UNIT fixed workflow',baselineExperimentId:state.baseline.id});
 const artifact=state.app.evidence.put(state.project.id,'config.json',Buffer.from('{"polynomialDegree":2,"ridge":0.000001}')),base=state.app.experiments.readFile(USER,state.baseline.id,'config.json');
 return state.app.operations.execute(USER,'change_proposal_prepare',{baseExperimentId:state.baseline.id,expectedRevision:1,title:'UNIT fixed source',hypothesis:'Synthetic only',changes:[{path:'config.json',artifactId:artifact.id,expectedDigest:base.digest}]},{projectId:state.project.id,sessionId:state.session.id,idempotencyKey:'prepare'});
}
function input(state,kind,row){return {sourceKind:kind,sourceId:row.id,sourceDigest:row.digest??row.planDigest,expectedVersion:row.version,...(row.approvalId?{approvalId:row.approvalId,expectedApprovalVersion:state.app.store.get('approval',row.approvalId).version}:{})};}
function confirm(state,value,key='confirm'){return state.app.operations.execute(USER,'workflow_confirm',value,{projectId:state.project.id,sessionId:state.session.id,idempotencyKey:key});}

for(const kind of ['brief','campaign','change'])test(`${kind} commits its exact action and one nonhuman continuation across keys and reopen`,()=>{
 const state=setup();try{
  assert.equal(state.app.operations.has('workflow_confirm'),true,'the domain action must expose an atomic continuation boundary');
  const row=source(state,kind),request=input(state,kind,row),first=confirm(state,request);
  assert.equal(first.sourceId,row.id);assert.equal(first.state,'queued');assert.equal(first.route,'workflow');
  assert.deepEqual(confirm(state,request),first);assert.equal(confirm(state,request,'other-key').id,first.id);
  if(row.approvalId)assert.throws(()=>confirm(state,{...request,approvalId:'unrelated-approval'},'wrong-replay'),{code:'APPROVAL_STALE'});
  const messages=state.app.sessions.messages(USER,state.session.id);assert.equal(messages.length,1);assert.equal(messages[0].role,'system');assert.equal(messages[0].origin,'automation');assert.equal(messages[0].workflowContinuationId,first.id);assert.equal(messages[0].wakeupId,undefined);
  assert.equal(publicRecord(messages[0]).workflowContinuationId,undefined);
  if(kind==='change')assert.equal(state.app.store.list('experiment',state.project.id).filter(item=>item.changeProposalId===row.id).length,1);
  state.app.close();state.app=new ResearchApp(state.dir,process.cwd());assert.equal(confirm(state,request,'after-reopen').id,first.id);assert.equal(state.app.sessions.messages(USER,state.session.id).length,1);
 }finally{state.close();}
});

test('notice persistence failure rolls back the domain confirmation and approval',()=>{
 for(const kind of ['brief','campaign','change']){const state=setup();try{
  const row=source(state,kind),request=input(state,kind,row),create=state.app.store.create.bind(state.app.store);
  state.app.store.create=(recordKind,...args)=>{if(recordKind==='message')throw Error('UNIT queue persistence failure');return create(recordKind,...args);};
  assert.throws(()=>confirm(state,request),/UNIT queue persistence failure/);
  const actual=state.app.store.get(kind==='brief'?'research-brief':kind==='campaign'?'campaign':'change-proposal',row.id);assert.equal(actual.status??actual.state,row.status??row.state);
  if(row.approvalId)assert.equal(state.app.store.get('approval',row.approvalId).status,'pending');
  assert.equal(state.app.store.list('workflow-continuation').length,0);
 }finally{state.close();}}
});

test('closed workflow input and foreign sources never create authority',()=>{
 const state=setup();try{
  const row=source(state,'brief'),request=input(state,'brief',row),other=state.app.sessions.create(USER,state.project.id,{title:'Other root'});
  assert.throws(()=>confirm(state,{...request,requestRef:{originMessageId:'forged'}}),{code:'INVALID_INPUT'});
  assert.throws(()=>state.app.operations.execute(USER,'workflow_confirm',request,{projectId:state.project.id,sessionId:other.id,idempotencyKey:'foreign'}),{code:'SCOPE_DENIED'});
  assert.throws(()=>confirm(state,{...request,sourceDigest:'0'.repeat(64)},'wrong-digest'),{code:'WORKFLOW_SOURCE_STALE'});
  assert.equal(state.app.store.list('workflow-continuation').length,0);assert.equal(state.app.sessions.messages(USER,state.session.id).length,0);
 }finally{state.close();}
});

test('source revisions, changed permissions and model round trips cannot refresh a saved binding',()=>{
 for(const change of ['brief','permission','model','receipt']){const state=setup();try{
  state.app.sessionPermissions.initialize(state.session.id,'confirm');const row=source(state,'brief'),receipt=confirm(state,input(state,'brief',row)),stored=state.app.store.get('workflow-continuation',receipt.id);
  if(change==='brief')state.app.researchBriefs.save(USER,state.project.id,state.session.id,{question:'UNIT replacement',scope:'New scope',constraints:[],successCriteria:[],clarificationQuestions:['Clarify'],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[],status:'clarifying',expectedRevisionId:row.id});
  if(change==='permission'){const status=state.app.sessionPermissions.status(USER,state.session.id);state.app.sessionPermissions.set(USER,state.session.id,{mode:'autoEdit',expectedVersion:status.version,expectedHostVersion:status.hostAccess.version});}
  if(change==='model')state.app.store.event(state.project.id,'session.model_changed',{sessionId:state.session.id,model:state.session.model});
  if(change==='receipt')state.app.store.update('workflow-continuation',stored.id,stored.version,{humanMessageId:'invented-origin'});
  assert.throws(()=>state.app.workflowContinuations.assertClaim(state.app.store.get('message',stored.initialMessageId)));
  const status=state.app.workflowContinuations.list(USER,state.project.id,state.session.id)[0];assert.equal(status.state,'superseded');assert.equal(state.app.store.list('workflow-continuation').length,1);assert.equal(state.app.store.list('message').length,1);
 }finally{state.close();}}
});

test('a later consumed human replaces the binding without altering the approved source',()=>{
 const state=setup();try{
  const row=source(state,'brief'),receipt=confirm(state,input(state,'brief',row)),human=state.app.sessions.send(USER,state.session.id,{content:'UNIT a new independent question'}),root=state.app.store.get('session',state.session.id);
  state.app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});state.app.store.update('message',human.id,human.version,{status:'running',generation:1});state.app.workflowContinuations.humanConsumed(root.id,human.id);
  assert.equal(state.app.store.get('workflow-continuation',receipt.id).invalidatedReasonCode,'WORKFLOW_REQUEST_CHANGED');assert.equal(state.app.store.get('research-brief',row.id).status,'confirmed');assert.equal(state.app.store.get('research-brief',row.id).requestRef,undefined);assert.equal(state.app.store.get('session',root.id).lastConsumedHumanMessageId,human.id);
 }finally{state.close();}
});

test('existing handoff markers never fall back when their service or request is unavailable',()=>{
 for(const marker of ['processingNotice','requestRef']){const state=setup();try{
  const row=source(state,'brief');state.app.researchBriefs.confirm(USER,state.project.id,state.session.id,{briefId:row.id,expectedVersion:row.version});let saved=state.app.store.get('research-brief',row.id);
  saved=state.app.store.update('research-brief',row.id,saved.version,marker==='processingNotice'?{processingNotice:'UNIT existing processing marker'}:{requestRef:{rootSessionId:'foreign'}});
  const currentService=state.app.researchHandoffs;state.app.researchHandoffs=undefined;
  const result=confirm(state,input(state,'brief',saved));assert.equal(result.route,'existing-handoff');assert.equal(result.reasonCode,'HANDOFF_SERVICE_UNAVAILABLE');assert.equal(state.app.store.list('workflow-continuation').length,0);assert.equal(state.app.store.list('message').length,0);
  state.app.researchHandoffs=currentService;const checked=state.app.workflowContinuations.existingHandoffStatus(state.project.id,state.session.id,{sourceKind:'brief',sourceId:saved.id,sourceDigest:saved.digest});assert.equal(checked.reasonCode,currentService?'HANDOFF_INVALID':'HANDOFF_SERVICE_UNAVAILABLE');assert.equal(checked.route,'existing-handoff');assert.equal(state.app.store.list('workflow-continuation').length,0);
 }finally{state.close();}}
});

test('rejected and full-access approvals cannot mint a workflow continuation',()=>{
 for(const denied of ['rejected','fullAccess','automaticApproval']){const state=setup();try{
  const row=source(state,'campaign'),approval=state.app.store.get('approval',row.approvalId);state.app.store.update('approval',approval.id,approval.version,denied==='rejected'?{status:'rejected'}:{[denied]:{fixture:true}});
  assert.throws(()=>confirm(state,input(state,'campaign',row)));assert.equal(state.app.store.get('campaign',row.id).state,'draft');assert.equal(state.app.store.list('workflow-continuation').length,0);
 }finally{state.close();}}
});

for(const operation of ['interrupt','archive'])test(`queued workflow ${operation} preserves caller CAS, cancellation and reopened history`,()=>{
 for(const olderInvalidated of [false,true]){const state=setup();try{
  if(olderInvalidated){const older=source(state,'brief'),saved=confirm(state,input(state,'brief',older),'older'),binding=state.app.store.get('workflow-continuation',saved.id);state.app.workflowContinuations.fail(state.app.store.get('message',binding.initialMessageId),'WORKFLOW_MODEL_UNAVAILABLE');}
  const kind=olderInvalidated?'campaign':'brief',row=source(state,kind),receipt=confirm(state,input(state,kind,row),'current'),binding=state.app.store.get('workflow-continuation',receipt.id),before=state.app.store.get('session',state.session.id),savedSource=state.app.store.get(kind==='brief'?'research-brief':'campaign',row.id),messages=state.app.sessions.messages(USER,before.id);
  assert.equal(before.state,'queued');
  if(operation==='archive'){
   assert.throws(()=>state.app.sessions.archive(USER,before.id,before.version+1),{code:'VERSION_CONFLICT'});
   assert.deepEqual(state.app.store.get('session',before.id),before);assert.deepEqual(state.app.store.get('workflow-continuation',binding.id),binding);assert.deepEqual(state.app.sessions.messages(USER,before.id),messages);
  }
  const stopped=operation==='archive'?state.app.sessions.archive(USER,before.id,before.version):state.app.sessions.interrupt(USER,before.id);
  assert.equal(stopped.state,operation==='archive'?'archived':'interrupted');assert.equal(stopped.version,before.version+1);
  assert.equal(state.app.store.get('workflow-continuation',binding.id).invalidatedReasonCode,'WORKFLOW_STOPPED');assert.equal(state.app.store.get('message',binding.initialMessageId).status,'cancelled');assert.deepEqual(state.app.store.get(savedSource.kind,savedSource.id),savedSource);
  assert.equal(state.app.store.list('message').length,olderInvalidated?2:1);assert.equal(state.app.store.list('run').length,0);
  state.app.close();state.app=new ResearchApp(state.dir,process.cwd());assert.equal(state.app.store.get('session',before.id).state,stopped.state);assert.equal(state.app.store.get('workflow-continuation',binding.id).invalidatedReasonCode,'WORKFLOW_STOPPED');assert.equal(state.app.store.get('message',binding.initialMessageId).status,'cancelled');assert.deepEqual(state.app.store.get(savedSource.kind,savedSource.id),savedSource);assert.equal(state.app.store.list('message').length,olderInvalidated?2:1);
 }finally{state.close();}}
});
