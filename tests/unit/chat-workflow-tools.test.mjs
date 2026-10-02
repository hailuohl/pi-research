import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {startTeam,actor as taskActor,spec} from '../support/collaboration.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

function coordinator(s){
 const session=s.app.store.get('session',s.session.id);
 s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
 return {type:'agent',projectId:s.project.id,sessionId:session.id,generation:1,role:'coordinator'};
}
const campaignInput=(s,extra={})=>({goal:'当前对话的有界研究目标',baselineExperimentId:s.baseline.id,...extra});
test('campaign_prepare creates only a current-dialogue draft and reopens with its owner',async()=>{
 const s=setup();
 try{
  const root=coordinator(s),tools=new ToolDispatcher(s.app),input=campaignInput(s);
  const prepared=await tools.execute(root,'campaign_prepare',input,'dialogue-campaign');
  assert.equal(prepared.state,'draft');assert.equal(prepared.rootSessionId,s.session.id);
  assert.equal(s.app.store.get('approval',prepared.approvalId).status,'pending');
  assert.equal(s.app.store.list('campaign',s.project.id).length,1);
  const other=s.app.sessions.create(USER,s.project.id,{title:'Other root'});
  s.app.campaigns.prepare(USER,s.project.id,other.id,input);
  const index=await tools.execute(root,'project_inspect',{},'dialogue-index');
  assert.deepEqual(index.campaigns,[{id:prepared.id,goal:input.goal,state:'draft'}]);
  await assert.rejects(tools.execute(root,'campaign_prepare',{...input,rootSessionId:s.session.id},'injected-root'),{code:'INVALID_INPUT'});
  await assert.rejects(tools.execute({...root,wakeupId:'automation'},'campaign_prepare',input,'automation-campaign'),{code:'AUTOMATION_TOOL_DENIED'});
  const otherActor={...root,sessionId:other.id};
  assert.throws(()=>s.app.campaigns.prepare(otherActor,s.project.id,s.session.id,input),{code:'TOOL_DENIED'});
  assert.equal(tools.definitions('coordinator',true).some(tool=>tool.name==='campaign_prepare'),false);

  const artifact=s.app.evidence.put(s.project.id,'config.json',Buffer.from('{"polynomialDegree":2,"ridge":0.000001}'));
  const base=s.app.experiments.readFile(USER,s.baseline.id,'config.json');
  const proposalInput={baseExperimentId:s.baseline.id,expectedRevision:1,title:'Current dialogue change',hypothesis:'Keep the change pending user review',changes:[{path:'config.json',artifactId:artifact.id,expectedDigest:base.digest}]};
  const proposal=await tools.execute(root,'change_proposal_prepare',proposalInput,'dialogue-change');
  assert.equal(proposal.rootSessionId,s.session.id);
  const legacy=s.app.changes.prepare(USER,s.project.id,proposalInput);
  assert.equal(legacy.rootSessionId,undefined);
  assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.change_proposal_prepare,legacy,'output'));

  const dir=s.dir;s.app.close();s.app=new ResearchApp(dir,process.cwd());
  assert.equal(s.app.store.get('campaign',prepared.id,s.project.id).rootSessionId,s.session.id);
  assert.equal(s.app.store.get('change-proposal',proposal.id,s.project.id).rootSessionId,s.session.id);
  assert.equal(s.app.store.get('change-proposal',legacy.id,s.project.id).rootSessionId,undefined);
  assert.equal(s.app.changes.inspect(USER,proposal.id).proposal.rootSessionId,s.session.id);
  assert.equal(s.app.changes.inspect(USER,legacy.id).proposal.rootSessionId,undefined);
 }finally{s.close();}
});

test('campaign preparation rejects assistants, invalid limits, archived owners and expired leases',async()=>{
 const s=setup();
 try{
  const root=coordinator(s),tools=new ToolDispatcher(s.app),input=campaignInput(s);
  const team=startTeam(s,[spec('analysis')]),claimed=s.app.teams.claim(team.id),assistant=taskActor(claimed);
  const session=s.app.store.get('session',assistant.sessionId);
  s.app.store.update('session',session.id,session.version,{state:'running',leaseUntil:Date.now()+120000});
  assert.equal(tools.definitions('analyst').some(tool=>tool.name==='campaign_prepare'),false);
  await assert.rejects(tools.execute(assistant,'campaign_prepare',input,'assistant-campaign'),{code:'TOOL_DENIED'});
  assert.throws(()=>s.app.campaigns.prepare(root,s.project.id,s.session.id,campaignInput(s,{limits:{deadline:new Date(Date.now()-1000).toISOString()}})),{code:'INVALID_INPUT'});
  const current=s.app.store.get('session',s.session.id);
  s.app.store.update('session',current.id,current.version,{leaseUntil:Date.now()-1000});
  await assert.rejects(tools.execute(root,'campaign_prepare',input,'expired-campaign'),{code:'LEASE_EXPIRED'});
  const archived=s.app.store.get('session',s.session.id);
  s.app.store.update('session',archived.id,archived.version,{state:'archived'});
  assert.throws(()=>s.app.campaigns.prepare(USER,s.project.id,s.session.id,input),{code:'INVALID_ROOT_SESSION'});
 }finally{s.close();}
});
