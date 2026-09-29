import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {approve,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {actor,result} from '../support/collaboration.mjs';

test('research plan owner HTTP/CLI contracts bind private implementation, reviewed attachment and actual comparison',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-research-plan-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,project=app.projects.create(USER,{name:'UNIT research plan transport',template:'curve-fit'}),session=app.sessions.create(USER,project.id,{title:'Campaign owner'}),baseline=app.experiments.create(USER,project.id,{title:'Fixed baseline'}),s={app,project,session,baseline},c=campaign(s),run=submit(s,enroll(s,c));fixtureFinish(s,run);app.campaigns.observe();
  const observation=app.campaigns.observations(USER,c.id)[0],port=await server.listen(),headers={Authorization:`Bearer ${server.token}`,'Content-Type':'application/json'};
  const call=async(name,input,key=randomUUID(),pid=project.id)=>{const response=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:pid,input})});return {status:response.status,value:await response.json()};};
  const experimentPlan={hypothesis:'Bounded software acceptance',controlRunIds:[run.id],changedFactors:['coefficient implementation and degree'],dataSplit:'Same fixed synthetic split; no scientific inference',dataArtifactIds:[],primaryMetric:'mse',guardrailMetrics:[],repetitions:{count:1,rationale:'Deterministic transport fixture'},successCriteria:'Review verified numerical outputs',inconclusiveCriteria:'Missing or invalid evidence',stoppingCriteria:'Stop within approved limits'};
  const input={campaignId:c.id,expectedVersion:app.campaigns.get(USER,c.id).version,action:'refill',reason:'A fixed next experiment plan',observationIds:[observation.id],candidates:[{title:'Parameters',hypothesis:'Degree comparison',config:{polynomialDegree:3},implementation:'config'},{title:'Code',hypothesis:'An independently reviewed implementation',implementation:'reviewed-code'}],experimentPlan},key=randomUUID();
  const proposed=await call('campaign_decision_submit',input,key);assert.equal(proposed.status,200,JSON.stringify(proposed.value));assert.ok(proposed.value.planRevisionId);assert.deepEqual(await call('campaign_decision_submit',input,key),proposed);
  assert.throws(()=>app.decisions.apply(USER,proposed.value.id,proposed.value.version),{code:'APPROVAL_REQUIRED'});
  approve(app,proposed.value.approvalId);const applied=app.decisions.apply(USER,proposed.value.id,proposed.value.version),inspection=await call('campaign_plan_inspect',{planRevisionId:proposed.value.planRevisionId});assert.equal(inspection.status,200,JSON.stringify(inspection.value));assert.equal(inspection.value.validity,'current');assert.equal(inspection.value.candidates.length,2);assert.ok(!JSON.stringify(inspection.value).includes(dir));
  const parameter=inspection.value.candidates.find(v=>v.spec.implementation==='config'),candidate=inspection.value.candidates.find(v=>v.spec.implementation==='reviewed-code');assert.ok(applied.effects.candidateIds.includes(candidate.id));assert.throws(()=>app.runs.submit(USER,parameter.intentId),{code:'APPROVAL_REQUIRED'});
  const dev=app.sessions.create(USER,project.id,{title:'Private implementation'}),prepared=await call('campaign_candidate_prepare',{candidateId:candidate.id,sessionId:dev.id});assert.equal(prepared.status,200,JSON.stringify(prepared.value));assert.equal(prepared.value.sessionId,dev.id);
  // Deterministic service fixture only; actual Docker/Pi execution is separate acceptance evidence.
  writeFileSync(join(app.store.paths.physical(dev.workspace),'candidate-test.py'),'assert 1 + 1 == 2\n');const task=app.development.prepare(USER,project.id,dev.id,{command:['python','candidate-test.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`});approve(app,task.grantId);
  const job=app.store.get('sandbox-job',app.development.submit(USER,project.id,task.id).id),controlDir=app.store.paths.physical(job.controlDir);writeFileSync(join(controlDir,'stdout.log'),'UNIT offline fixture\n');writeFileSync(join(controlDir,'stderr.log'),'');app.development.finalize(job.id,{state:'succeeded',exitCode:0});
  const current=app.projects.get(USER,project.id);app.projects.settings(USER,project.id,{expectedVersion:current.version,enabled:true});const review=app.developmentReviews.prepare(USER,project.id,{jobId:job.id});approve(app,review.approvalId);app.teams.activate(USER,review.teamId);const claim=app.teams.claim(review.teamId);app.teams.submit(actor(claim),result({verdict:'accept',evidenceIds:review.requiredEvidenceIds}));
  const proposal=app.changes.prepareReviewed(USER,project.id,{reviewId:review.id,title:'Reviewed child',hypothesis:'Fixed fixture change'});approve(app,proposal.approvalId);app.changes.apply(USER,proposal.id);
  const attached=await call('campaign_candidate_attach',{candidateId:candidate.id,proposalId:proposal.id});assert.equal(attached.status,200,JSON.stringify(attached.value));assert.equal(attached.value.state,'prepared');assert.equal(attached.value.testJobId,job.id);assert.equal(attached.value.reviewId,review.id);assert.throws(()=>app.runs.submit(USER,attached.value.intentId),{code:'APPROVAL_REQUIRED'});
  const comparison=await call('campaign_comparison',{campaignId:c.id});assert.equal(comparison.status,200,JSON.stringify(comparison.value));assert.equal(comparison.value.conclusion,'requires_review');assert.equal(comparison.value.results[0].runId,run.id);
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','campaign_comparison','--project',project.id,'--input',JSON.stringify({campaignId:c.id}),'--data',dir],{encoding:'utf8',timeout:15000,windowsHide:true});assert.equal(cli.status,0,cli.stderr);assert.deepEqual(JSON.parse(cli.stdout),comparison.value);
  const other=app.projects.create(USER,{name:'Other'});assert.notEqual((await call('campaign_plan_inspect',{planRevisionId:proposed.value.planRevisionId},randomUUID(),other.id)).status,200);
  assert.equal((await call('campaign_candidate_prepare',{candidateId:candidate.id,sessionId:dev.id,path:'../outside'})).value.error.code,'INVALID_INPUT');
  await assert.rejects(new ToolDispatcher(app).execute({type:'agent',projectId:project.id,sessionId:session.id,role:'coordinator',generation:0},'campaign_candidate_attach',{candidateId:candidate.id,proposalId:proposal.id},'denied'),{code:'TOOL_DENIED'});
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
