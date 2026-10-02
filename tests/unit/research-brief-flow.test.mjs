import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,waitRun} from '../support/research.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

const plan=(previous=null,extra={})=>({expectedRevisionId:previous,question:'Compare polynomial degrees',scope:'Fixed local test protocol',constraints:[],successCriteria:['Report real test MSE'],clarificationQuestions:[],literatureSummary:'Software acceptance only',hypotheses:[],evidenceIds:[],steps:[{title:'Baseline and variants',description:'Keep data fixed and compare results'}],status:'ready',...extra});
function confirm(s,sid=s.session.id,extra={}){const row=s.app.researchBriefs.save(USER,s.project.id,sid,plan(null,extra));return s.app.researchBriefs.confirm(USER,s.project.id,sid,{briefId:row.id,expectedVersion:row.version});}
function actor(s){const row=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.project.id,sessionId:row.id,generation:1,role:'coordinator'};}

test('source inspection, sibling experiments and actual runs retain the approved research plan',async()=>{
 const s=setup();try{
  const brief=confirm(s),root=actor(s),tools=new ToolDispatcher(s.app);
  const index=await tools.execute(root,'project_inspect',{},'source-index');
  assert.deepEqual(index.projectSource.files.map(f=>f.path).sort(),['README.md','config.json','experiment.mjs']);assert.equal(index.projectSource.hasMore,false);
  const parent=await tools.execute(root,'experiment_plan_submit',{title:'Dialogue baseline',hypothesis:'A measured software comparison'},'baseline');
  const config=JSON.parse(s.app.experiments.readFile(USER,parent.id,'config.json').content);
  const children=[];for(const degree of [2,3])children.push(await tools.execute(root,'experiment_plan_submit',{title:`Degree ${degree}`,hypothesis:'Unverified until run',parentId:parent.id,expectedParentRevision:parent.revision,config:{...config,polynomialDegree:degree}},`child-${degree}`));
  assert.ok(children.every(e=>e.parentId===parent.id&&e.researchBrief.id===brief.id));
  const unsupported=await tools.execute(root,'experiment_plan_submit',{title:'Unsupported degree 9',hypothesis:'Must not run outside the trusted example contract',parentId:parent.id,expectedParentRevision:parent.revision,config:{...config,polynomialDegree:9}},'unsupported-degree');
  await assert.rejects(tools.execute(root,'run_prepare',{experimentId:unsupported.id},'prepare-unsupported'),{code:'INVALID_INPUT'});
  assert.equal(s.app.store.list('run-intent',s.project.id).length,0);
  for(const e of [parent,...children]){
   const intent=await tools.execute(root,'run_prepare',{experimentId:e.id},`prepare-${e.id}`);assert.equal(intent.manifest.researchBrief.id,brief.id);
   await assert.rejects(tools.execute(root,'run_submit',{intentId:intent.id},`unapproved-${e.id}`),{code:'APPROVAL_REQUIRED'});
   approve(s.app,intent.approvalId);const run=await tools.execute(root,'run_submit',{intentId:intent.id},`submit-${e.id}`),done=await waitRun(s,run.id);
   assert.equal(done.state,'succeeded');assert.equal(done.integrity,'complete');assert.equal(typeof done.metrics.mse,'number');assert.equal(done.manifest.researchBrief.id,brief.id);
   assert.ok(s.app.runs.logs(USER,done.id,0).content.length>0);
  }
 }finally{s.close();}
});

test('owned experiment receipts cannot cross roots or borrow legacy aliases',()=>{
 const s=setup();try{
  const a=confirm(s),second=s.app.sessions.create(USER,s.project.id,{title:'Other research'}),b=confirm(s,second.id),input={title:'Fixed experiment',hypothesis:'A pending comparison'};
  const execute=(sid,key)=>s.app.operations.execute(USER,'experiment_plan_submit',input,{projectId:s.project.id,sessionId:sid,idempotencyKey:key});
  const first=execute(s.session.id,'same-key');assert.equal(first.researchBrief.id,a.id);
  assert.throws(()=>execute(second.id,'same-key'),{code:'IDEMPOTENCY_CONFLICT'});
  assert.equal(execute(second.id,'other-key').researchBrief.id,b.id);
  const legacy=s.app.experiments.create(USER,s.project.id,input);
  s.app.store.operation('POST:/experiments','legacy-key',{body:{projectId:s.project.id,...input},query:''},()=>legacy);
  const modern=execute(s.session.id,'legacy-key');assert.notEqual(modern.id,legacy.id);assert.equal(modern.researchBrief.id,a.id);
 }finally{s.close();}
});

test('cached experiment creation cannot return evidence-derived text after revocation or lease expiry',async()=>{
 const s=setup();try{
  const artifact=s.app.evidence.put(s.project.id,'source.txt',Buffer.from('fixed source')),
   evidence=s.app.evidence.register(USER,s.project.id,artifact.id,0,5,'Original quotation');
  confirm(s,s.session.id,{evidenceIds:[evidence.id]});const root=actor(s),tools=new ToolDispatcher(s.app),input={title:'Evidence-derived node',hypothesis:'Derived hypothesis'};
  await tools.execute(root,'experiment_plan_submit',input,'cached-node');s.app.store.update('evidence',evidence.id,evidence.version,{quote:'changed'});
  await assert.rejects(tools.execute(root,'experiment_plan_submit',input,'cached-node'),{code:'EVIDENCE_INVALID'});
  const session=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',session.id,session.version,{leaseUntil:Date.now()-1});
  await assert.rejects(tools.execute(root,'experiment_plan_submit',input,'cached-node'),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});
