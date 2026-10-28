import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {setup,USER,approve,campaign,enroll,submit,fixtureFinish} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {inspectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {BUILTIN_RELEASES} from '../../dist/packages/skills/releases.js';
import {digest} from '../../dist/packages/storage/store.js';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {METHOD_REQUIREMENTS_SCHEMA} from '../../dist/packages/contracts/operations/method-contract-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const historical='3301d03e99d733a987b74b4c51dc4f7a9f92577bd7483445a24da577fba730a6';
const current='92adf4d0f0bfa17cd7c8ff8e00578d556c018feaa921ec31952c104fed70c6e1';
const sha=value=>createHash('sha256').update(value).digest('hex');
function pin(s,bundleId=historical){const row=s.app.store.get('session',s.session.id);return s.app.store.update('session',row.id,row.version,{skillBundleId:bundleId,generation:1,piSessionPath:'preserved-history.jsonl'});}
function disabledBundle(s){const body={projectId:s.project.id,builtinBundleId:historical,revisionIds:[],disabledBuiltinIds:['pi-research-evidence']},id=digest(body),{projectId,...data}=body;s.app.store.create('skill-bundle',projectId,{...data,contentDigest:id},id);return id;}
function incompatible(error){assert.equal(error.code,'SKILL_CAPABILITY_MISSING');assert.match(error.message,/SKILL_RUNTIME_INCOMPATIBLE/);return true;}

test('recovered history retains every exact resource and metadata without changing current or older supported releases',()=>{const s=setup();try{
 assert.equal(s.app.skills.bundleId,current);
 const release=BUILTIN_RELEASES.find(r=>r.bundleId===historical);assert.ok(release,'the recorded historical pin must be registered');
 const raw=readFileSync(join('skills/releases',historical,'manifest.json'));
 assert.equal(sha(raw),'d24768ac5c191728b5295b26062b918855343c779d7d2b9bd657e3c82bfc9558');
 assert.equal(sha(JSON.stringify(release.skills)),historical);
 for(const skill of release.skills)for(const resource of [undefined,...skill.resources.map(r=>r.path)]){
  const text=s.app.skills.bundleRead(s.project.id,'coordinator',historical,skill.id,resource);
  assert.equal(text.bundleId,historical);assert.equal(sha(text.content),text.digest);
  assert.equal(text.content,readFileSync(join('skills/releases',historical,'blobs',text.digest),'utf8'));
 }
 const paired=release.skills.find(s=>s.id==='pi-research-evidence').resources.find(r=>r.path==='references/paired-polynomial-comparison.md');
 assert.deepEqual(paired.methodRequirements,['structured-paired-protocol','closed-paired-evidence','scientific-planning']);
 for(const name of ['protocolSourceVersion','planningClaimsVersion','sourceIntakeVersion','metricsSourceVersion','measurementAssessmentVersion','canonicalPairedOutputsVersion','developmentValidationVersion','reviewExpressionVersion','reviewTargetReadVersion'])assert.equal(paired[name],1);
 assert.throws(()=>s.app.skills.ensureBundleStartAllowed(s.project.id,historical),{code:'SKILL_RUNTIME_INCOMPATIBLE'});
 for(const release of BUILTIN_RELEASES.filter(r=>r.bundleId!==historical))assert.doesNotThrow(()=>s.app.skills.ensureBundleStartAllowed(s.project.id,release.bundleId));
 assert.throws(()=>s.app.skills.bundleRead(s.project.id,'coordinator','f'.repeat(64),'pi-research-overview'),{code:'SKILL_BUNDLE_UNKNOWN'});
 assert.throws(()=>s.app.skills.read('reviewer','pi-research-agent-delegation',undefined,historical),{code:'SKILL_SCOPE_DENIED'});
}finally{s.close();}});

for(const disabled of [false,true])test(`incompatible owner pin stays unready across reopen and host claim rolls back admission and permissions${disabled?' with disabled evidence':''}`,()=>{const s=setup();try{
 const bundleId=disabled?disabledBundle(s):historical,before=pin(s,bundleId),permission=s.app.sessionPermissions.capture(before.id),read=s.app.skills.bundleRead(s.project.id,'coordinator',bundleId,'pi-research-overview');
 if(disabled){assert.equal(s.app.skills.bundleCatalog(s.project.id,'coordinator',bundleId).builtinBundleId,historical);assert.throws(()=>s.app.skills.bundleRead(s.project.id,'coordinator',bundleId,'pi-research-evidence'),{code:'SKILL_DISABLED'});}
 for(let reopen=0;reopen<2;reopen++){
  const status=inspectSessionSkills(s.app,USER,s.project.id,before.id);assert.equal(status.ready,false);assert.ok(status.missing.some(m=>m.reason.includes('SKILL_RUNTIME_INCOMPATIBLE')));
  const host=new AgentHost(s.app);assert.throws(()=>host.claimSession(s.app.store.get('session',before.id)),incompatible);
  assert.deepEqual(s.app.store.get('session',before.id),before);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
  assert.deepEqual(s.app.sessionPermissions.capture(before.id),permission);assert.deepEqual(s.app.skills.bundleRead(s.project.id,'coordinator',bundleId,'pi-research-overview'),read);
  if(!reopen){s.app.close();s.app=new ResearchApp(s.dir,process.cwd());}
 }
}finally{s.close();}});

for(const disabled of [false,true])for(const retry of [false,true])test(`incompatible task ${retry?'retry':'first claim'} cannot consume an attempt or reserve budget${disabled?' with disabled evidence':''}`,()=>{const s=setup();try{
 const bundleId=disabled?disabledBundle(s):historical,team=startTeam(s,[spec('a')]);
 if(retry){const claimed=s.app.teams.claim(team.id);assert.ok(claimed);s.app.teams.fail(claimed.attempt.id,'UNIT previous attempt');const attempt=s.app.store.get('task-attempt',claimed.attempt.id);s.app.store.update('task-attempt',attempt.id,attempt.version,{skillBundleId:bundleId});const session=s.app.store.get('session',attempt.sessionId);s.app.store.update('session',session.id,session.version,{skillBundleId:bundleId});s.app.teams.retry(USER,claimed.task.id);}
 else if(disabled)s.app.store.create('skill-configuration',s.project.id,{bundleId,revisionIds:[]},s.project.id);
 else s.app.skills.configure(USER,s.project.id,{expectedVersion:0,builtinBundleId:historical,revisionIds:[]});
 const attempts=s.app.store.list('task-attempt').length;
 assert.equal(s.app.teams.claim(team.id),null);const task=s.app.teams.tasks(USER,team.id)[0];assert.equal(task.execution,'blocked');assert.match(task.blockReason,/SKILL_RUNTIME_INCOMPATIBLE/);
 assert.equal(s.app.store.list('task-attempt').length,attempts);assert.equal(s.app.budget.summary(team.id).reserved,0);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
}finally{s.close();}});

test('incompatible automatic wakeup rolls back its attempt before worker launch',async()=>{const s=setup(),host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE',message:'fixture'}),fork(){assert.fail('must not launch a worker');}});try{
 const c=campaign(s,{autoAnalyze:true}),run=submit(s,enroll(s,c));fixtureFinish(s,run);pin(s);host.tick();
 const wakeup=s.app.wakeups.list(USER,s.project.id)[0];assert.ok(wakeup);assert.equal(wakeup.attempts,0);assert.equal(wakeup.state,'pending');assert.match(wakeup.blockReason,/SKILL_RUNTIME_INCOMPATIBLE/);
 assert.equal(s.app.budget.summary(wakeup.ownerId).reserved,0);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);assert.equal(s.app.store.get('session',s.session.id).skillBundleId,historical);
}finally{await host.stop();s.close();}});

for(const disabled of [false,true])test(`incompatible workflow continuation leaves its queued receipt and fixed session untouched${disabled?' with disabled evidence':''}`,()=>{const s=setup();try{
 const brief=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{question:'UNIT archive compatibility',scope:'Synthetic only',constraints:[],successCriteria:['Read fixed history'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Read exact historical text'}],status:'ready',expectedRevisionId:null});
 const receipt=s.app.operations.execute(USER,'workflow_confirm',{sourceKind:'brief',sourceId:brief.id,sourceDigest:brief.digest,expectedVersion:brief.version},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'confirm-archive-fixture'});
 const before=pin(s,disabled?disabledBundle(s):historical),continuation=s.app.store.get('workflow-continuation',receipt.id),message=s.app.store.get('message',continuation.initialMessageId),host=new AgentHost(s.app);
 assert.throws(()=>host.claimSession(before,message.id),incompatible);assert.deepEqual(s.app.store.get('session',before.id),before);
 assert.deepEqual(s.app.store.get('message',message.id),message);assert.deepEqual(s.app.store.get('workflow-continuation',receipt.id),continuation);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
}finally{s.close();}});

test('owner operation and HTTP display unknown historical metadata without activation or pin changes',async()=>{const dir=mkdtempSync(join(tmpdir(),'pi-archive-metadata-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});try{
 const app=server.app,project=app.projects.create(USER,{name:'UNIT metadata history'}),session=app.sessions.create(USER,project.id,{}),before=pin({app,session}),input={skillId:'pi-research-evidence',resource:'references/paired-polynomial-comparison.md'},scope={projectId:project.id,sessionId:session.id};
 const expected=app.skills.bundleRead(project.id,'coordinator',historical,input.skillId,input.resource),result=app.operations.execute(USER,'research_skill_read',input,scope);
 assert.deepEqual(result,expected);assert.ok(result.methodRequirements.includes('scientific-planning'));assert.deepEqual(app.store.list('research-method-activation'),[]);
 const port=await server.listen(),base=`http://127.0.0.1:${port}/api`,get=await fetch(`${base}/skills/${input.skillId}?bundleId=${historical}&resource=${encodeURIComponent(input.resource)}`);assert.equal(get.status,200);assert.deepEqual(await get.json(),expected);
 const response=await fetch(`${base}/operations/research_skill_read`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...scope,input})});assert.equal(response.status,200);assert.deepEqual(await response.json(),expected);
 assert.deepEqual(app.store.get('session',session.id),before);assert.deepEqual(app.store.list('research-method-activation'),[]);
 const running=app.store.update('session',session.id,before.version,{state:'running',leaseUntil:Date.now()+60000}),actor={type:'agent',role:'coordinator',projectId:project.id,sessionId:session.id,generation:running.generation};
 assert.throws(()=>app.operations.execute(actor,'research_skill_read',input,{...scope,idempotencyKey:'unknown-agent-read'}),{code:'SKILL_RUNTIME_INCOMPATIBLE'});assert.deepEqual(app.store.list('research-method-activation'),[]);
}finally{await server.close();rmSync(dir,{recursive:true,force:true});}});

test('historical metadata strings stay bounded while executable method enums remain closed',()=>{
 const read={id:'fixture',resource:'SKILL.md',content:'history',digest:'a'.repeat(64),bundleId:historical,methodRequirements:['future-requirement']};
 assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.research_skill_read,read,'output'));
 assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.research_skill_read,{...read,prerequisites:[read]},'output'));
 for(const methodRequirements of [[''],['x'.repeat(101)],[42],Array.from({length:17},(_,i)=>`future-${i}`),['future','future']])assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.research_skill_read,{...read,methodRequirements},'output'),{code:'INVALID_OUTPUT'});
 assert.throws(()=>validateSchema(METHOD_REQUIREMENTS_SCHEMA,['scientific-planning']),{code:'INVALID_INPUT'});
});

test('agent cached historical metadata cannot bypass runtime compatibility or rewrite its receipt',()=>{const s=setup();try{
 const pinned=pin(s),session=s.app.store.update('session',pinned.id,pinned.version,{state:'running',leaseUntil:Date.now()+60000}),actor={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:session.id,generation:session.generation},input={skillId:'pi-research-evidence',resource:'references/paired-polynomial-comparison.md'},key='legacy-metadata-read',scope=`agent:${session.id}`,request={name:'research_skill_read',input},value=s.app.skills.bundleRead(s.project.id,'coordinator',historical,input.skillId,input.resource);
 s.app.store.operation(scope,key,request,()=>value);const before=s.app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key);
 assert.throws(()=>s.app.operations.execute(actor,'research_skill_read',input,{projectId:s.project.id,sessionId:session.id,idempotencyKey:key}),{code:'SKILL_RUNTIME_INCOMPATIBLE'});
 assert.deepEqual(s.app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,key),before);assert.deepEqual(s.app.store.list('research-method-activation'),[]);
}finally{s.close();}});

test('agent historical reads of revoked known-profile uploads do not reuse startup approval checks',()=>{const s=setup();try{
 const revision=s.app.skills.import(USER,s.project.id,{packageId:'unit-revoked-history',revisionTag:'one',description:'UNIT original text',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('UNIT retained reviewed history').toString('base64')}]},'import-known');
 s.app.skills.review(USER,s.project.id,{revisionId:revision.id,decision:'approved',note:'UNIT reviewed'});const configured=s.app.skills.configure(USER,s.project.id,{expectedVersion:0,revisionIds:[revision.id]}),pinned=pin(s,configured.bundleId),running=s.app.store.update('session',pinned.id,pinned.version,{state:'running',leaseUntil:Date.now()+60000}),actor={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:running.id,generation:running.generation},input={skillId:revision.packageId},scope={projectId:s.project.id,sessionId:running.id};
 const before=s.app.operations.execute(actor,'research_skill_read',input,{...scope,idempotencyKey:'before-revoke'});s.app.skills.revoke(USER,s.project.id,{revisionId:revision.id,note:'UNIT stop future starts'});
 assert.throws(()=>s.app.skills.ensureBundleStartAllowed(s.project.id,configured.bundleId),{code:'SKILL_REVOKED'});assert.deepEqual(s.app.operations.execute(actor,'research_skill_read',input,{...scope,idempotencyKey:'after-revoke'}),before);assert.deepEqual(s.app.operations.execute(actor,'research_skill_read',input,{...scope,idempotencyKey:'before-revoke'}),before);
}finally{s.close();}});

for(const automatic of [false,true])test(`incompatible ${automatic?'research continuation':'approval resume'} cannot claim its queued message`,async()=>{const s=setup();try{
 if(automatic){s.app.researchAutomation.startOwner();s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true,acknowledgedResearchAutomation:true});s.app.researchAutomation.heartbeatOwner();s.app.compute.probe=async()=>({targetId:'docker-fixture',engineId:'fixture',endpoint:'unix:///fixture/docker.sock'});await s.app.compute.probeContext(USER,'default');}
 const human=s.app.sessions.send(USER,s.session.id,{content:'UNIT prepare this fixed research run'}),root=s.app.store.get('session',s.session.id);
 s.app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});s.app.store.update('message',human.id,human.version,{status:'running',generation:1});
 const actor={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:root.id,generation:1,messageId:human.id,permission:s.app.sessionPermissions.capture(root.id),researchModelDigest:s.app.researchAutomation.modelIdentity(s.app.store.get('session',root.id))};
 const execute=(name,input)=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,sessionId:root.id,idempotencyKey:name});
 if(!automatic)writeFileSync(join(s.app.store.paths.physical(root.workspace),'main.py'),'assert True');
 const prepared=automatic?execute('run_prepare',{experimentId:s.baseline.id}):execute('development_prepare',{command:['python','main.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64)}),approvalId=automatic?prepared.approvalId:prepared.grantId,run=automatic?execute('run_submit',{intentId:prepared.id}):undefined;
 const running=s.app.store.get('session',root.id),message=s.app.store.get('message',human.id);s.app.store.update('session',root.id,running.version,{state:'idle',leaseUntil:0});s.app.store.update('message',message.id,message.version,{status:'completed'});
 if(automatic)fixtureFinish(s,run);else approve(s.app,approvalId);
 s.app.wakeups.reconcile();const wakeup=s.app.wakeups.list(USER,s.project.id)[0];assert.ok(wakeup);if(automatic)assert.ok(wakeup.continuationId);else assert.equal(wakeup.approvalId,approvalId);
 const dispatch=s.app.wakeups.dispatch(wakeup.id,{ready:true});assert.ok(dispatch);const before=pin(s),notice=s.app.store.get('message',dispatch.message.id),queued=s.app.wakeups.get(USER,wakeup.id),permission=s.app.sessionPermissions.capture(root.id),host=new AgentHost(s.app);
 assert.throws(()=>host.claimSession(before,notice.id),incompatible);assert.deepEqual(s.app.store.get('session',before.id),before);assert.deepEqual(s.app.store.get('message',notice.id),notice);assert.deepEqual(s.app.wakeups.get(USER,wakeup.id),queued);assert.deepEqual(s.app.sessionPermissions.capture(root.id),permission);assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
}finally{s.close();}});
