import {FORMAL_REPORT_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/formal-report-review-schemas.js';
import {RUN_GRANT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/run-grant-schemas.js';
import {WORKING_GRANT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/working-grant-schemas.js';
import {DISCOVERY_GRANT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/discovery-grant-schemas.js';
import {RESEARCH_PLAN_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/research-plan-schemas.js';
import {PUBLICATION_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/publication-schemas.js';
import {DOCUMENT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/document-schemas.js';
import {SKILL_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/skill-schemas.js';
import {REVIEW_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/review-schemas.js';
import {REPORT_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/report-schemas.js';
import {SCHEDULER_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/scheduler-schemas.js';
import {DEVELOPMENT_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/development-schemas.js';
import {GIT_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/git-schemas.js';
import {SESSION_HISTORY_INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/session-schemas.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {setup, USER, approve, campaign, fixtureFinish} from '../support/research.mjs';
import {spec, actor, result} from '../support/collaboration.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {SOURCE_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/source-schemas.js';
import {INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/inputs.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {digest} from '../../dist/packages/storage/store.js';
import {startTeam} from '../support/collaboration.mjs';

async function dockerGpuFixture(fn){
 const saved=childProcess.spawn;
 childProcess.spawn=(executable,argv)=>{
  assert.equal(executable,'docker');assert.deepEqual(argv.slice(0,2),['--context','schema-gpu']);const args=argv.slice(2);let stdout;
  if(args[0]==='context'&&args[1]==='inspect')stdout=JSON.stringify([{Endpoints:{docker:{Host:'unix:///schema-gpu.sock'}}}]);
  else if(args[0]==='info')stdout=args.at(-1)==='{{.OSType}}'?'linux':JSON.stringify({OSType:'linux',ID:'schema-engine'});
  else if(args[0]==='image'&&args[1]==='inspect')stdout='sha256:'+'a'.repeat(64);
  else if(args[0]==='run'){assert.ok(args.includes('nvidia-smi'));assert.ok(args.includes('--pull'));stdout='GPU-11111111-1111-1111-1111-111111111111, deterministic schema fixture, 1024';}
  else assert.fail('Unexpected Docker fixture operation: '+JSON.stringify(args));
  const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>child.emit('close',null);queueMicrotask(()=>{child.stdout.end(stdout);child.stderr.end();child.emit('close',0);});return child;
 };
 syncBuiltinESMExports();try{return await fn();}finally{childProcess.spawn=saved;syncBuiltinESMExports();}
}

test('Task context output carries the fixed RunGrant reference and intent IDs',()=>{
  validateSchema(OUTPUT_SCHEMAS.task_context_read,{schemaVersion:1,taskId:'task',teamId:'team',goal:'goal',objective:'objective',role:'analyst',planVersion:1,directiveVersion:1,inputEvidenceIds:[],expectedOutputs:[],acceptanceRuleIds:[],upstream:[],reviewOf:null,restrictions:[],stopConditions:[],skillBundleId:'bundle',skillIds:[],runGrant:{id:'grant',digest:'a'.repeat(64),approvalId:'approval'},runIntentIds:['intent']},'output');
});

test('every input and advertised tool has a matching output contract',()=>{
 assert.deepEqual(Object.keys(OUTPUT_SCHEMAS).sort(),Object.keys(INPUT_SCHEMAS).sort());
 for(const name of Object.keys(TOOL_DEFINITIONS)) assert.ok(OUTPUT_SCHEMAS[name],name);
});

test('persisted text-only searches remain valid without PDF metadata fields',()=>{
 const record={id:'old-search',kind:'text-evidence-search',projectId:'project',version:1,createdAt:'2026-09-29T00:00:00.000Z',updatedAt:'2026-09-29T00:00:00.000Z',
  query:'adsorption',limit:5,mmrLambda:1,deduplicateExact:true,artifactIds:['text-1'],corpusId:'corpus-1',configurationVersion:1,method:'local-tfidf-exact-dedup-mmr-v1',status:'matches',
  hits:[{chunkId:'chunk-1',artifactId:'text-1',digest:'d',title:'paper.txt',locator:{start:0,end:10},lineStart:1,lineEnd:1,quote:'adsorption',alternativeSources:[{artifactId:'text-2',digest:'d',title:'copy.txt',locator:{start:0,end:10},lineStart:1,lineEnd:1}],score:0.5,evidenceId:'evidence-1',sourceKind:'user_imported_text',offsetUnit:'utf16-code-unit',page:null}],
  coverage:{sourceCount:1,totalChunks:1,matchingChunks:1,exactDuplicatesGrouped:0,uniqueChunks:1,candidatesConsidered:1,candidateLimitReached:false,resultsTruncated:false},usage:{modelCalls:0,networkCalls:0},limitations:[]};
 assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.text_evidence_search,record,'output'));
});

test('legacy search records and frozen Crossref page metadata both satisfy the output contract',()=>{
 const search={id:'s',kind:'connector-search',projectId:'project',version:1,createdAt:'2026-09-29T00:00:00.000Z',updatedAt:'2026-09-29T00:00:00.000Z',query:'q',settingsVersion:1,scopeSessionId:null,scopeTaskId:null,scopeAttemptId:null,request:{query:'q',sources:['crossref'],limit:1,strategy:'keyword',prioritize:'default'},items:[],sources:[{source:'crossref',status:'succeeded',count:0}],status:'complete',retrievedAt:'2026-09-29T00:00:00.000Z',coverage:'fixture'};
 assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.literature_discover,search,'output'));
 assert.doesNotThrow(()=>validateSchema(OUTPUT_SCHEMAS.literature_discover,{...search,page:{number:1,previousSearchId:null,cursor:'*',expiresAt:null,nextCursor:'cursor-2',nextCursorExpiresAt:'2026-09-29T00:04:00.000Z',rawItemCount:1}},'output'));
});

// Exercise real service output, using deterministic provider/runner fixtures only.
test('all existing public tools have closed, literal success contracts exercised with service records', async () => {
 const s=setup(), savedFetch=globalThis.fetch, seen=new Set();
 try {
  s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});
  const current=s.app.store.get('session',s.session.id);
  s.app.store.update('session',current.id,current.version,{state:'running',generation:1,skillBundleId:s.app.skills.configuration(s.project.id).bundleId,leaseUntil:Date.now()+120000});
  const root={type:'agent',projectId:s.project.id,sessionId:s.session.id,generation:1,role:'coordinator'}, tools=new ToolDispatcher(s.app);
  let serial=0;
  const check=(name,value)=>{validateSchema(OUTPUT_SCHEMAS[name],value,'output');seen.add(name);return value;};
  const call=async(name,input={},a=root)=>check(name,await tools.execute(a,name,input,`schema-${++serial}`));
  const fixedSession=s.app.sessions.create(USER,s.project.id,{title:'Fixed approval schema'});s.app.sessionPermissions.initialize(fixedSession.id,'confirm');
  s.app.store.update('session',fixedSession.id,fixedSession.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
  const fixedActor={...root,sessionId:fixedSession.id},fixedInput={path:'fixed.txt',content:'Approved exact input',expectedDigest:null};
  await assert.rejects(tools.execute(fixedActor,'workspace_write',fixedInput,'schema-fixed-prepare'),{code:'APPROVAL_REQUIRED'});
  const fixedAction=s.app.sessionPermissions.status(USER,fixedSession.id).actions.at(-1);
  s.app.sessionPermissions.decide(USER,fixedSession.id,fixedAction.id,{expectedVersion:fixedAction.version,expectedApprovalVersion:fixedAction.approval.version,approved:true});
  const fixedRead=await call('session_action_inspect',{actionId:fixedAction.id},fixedActor);assert.deepEqual(fixedRead.input,fixedInput);assert.equal(fixedRead.blockedReason,null);
  const fixedSaved=await call('session_action_execute',{actionId:fixedAction.id},fixedActor);assert.equal(fixedSaved.operation,'workspace_write');assert.equal(fixedSaved.result.digest,digest(Buffer.from(fixedInput.content)));
  await assert.rejects(tools.execute(fixedActor,'artifact_create',{title:'Resume contract',content:'Fixed approved artifact'},'schema-resume-prepare'),{code:'APPROVAL_REQUIRED'});
  const resumeAction=s.app.sessionPermissions.status(USER,fixedSession.id).actions.at(-1);s.app.sessionPermissions.decide(USER,fixedSession.id,resumeAction.id,{expectedVersion:resumeAction.version,expectedApprovalVersion:resumeAction.approval.version,approved:true});
  const resumeNotice=s.app.sessions.messages(USER,fixedSession.id).find(m=>m.approvalNoticeId===resumeAction.id);s.app.store.update('message',resumeNotice.id,resumeNotice.version,{status:'running',generation:1});
  const resumed=await call('session_action_resume',{}, {...fixedActor,permission:s.app.sessionPermissions.capture(fixedSession.id),approvalNoticeMessageId:resumeNotice.id});assert.equal(resumed.operation,'artifact_create');assert.equal(resumed.actionId,resumeAction.id);
  const actionMessage=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'user',content:'Read saved reports',mode:'prompt',status:'running',generation:1});
  const actionActor={...root,messageId:actionMessage.id,researchModelDigest:s.app.researchAutomation.modelIdentity(s.app.store.get('session',s.session.id))};
  const action=await call('research_action_prepare',{kind:'history',history:{kind:'reports'}},actionActor);
  await call('research_action_inspect',{requestId:action.id},actionActor);
  check('research_action_decide',s.app.operations.execute(USER,'research_action_decide',{requestId:action.id,expectedVersion:1,decision:'dismiss'},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'schema-action-dismiss'}));
  const hostResult=await call('host_execute',{argv:[process.execPath,'-e','console.log("closed host contract")']});assert.equal(hostResult.state,'succeeded');assert.equal(hostResult.stdout.trim(),'closed host contract');
  const owner=async(name,input)=>check(name,await s.app.operations.execute(USER,name,input,{projectId:s.project.id,idempotencyKey:`owner-schema-${++serial}`}));
  await owner('local_runtime_configure',{id:'schema-node',executable:'node',expectedVersion:0});
  const identityFile=join(s.dir,'schema-identity'),knownHostsFile=join(s.dir,'schema-known-hosts');writeFileSync(identityFile,'deterministic identity fixture');writeFileSync(knownHostsFile,'deterministic known-hosts fixture');
  await owner('ssh_target_configure',{id:'schema-ssh',host:'schema.invalid',user:'research',identityFile,knownHostsFile,remoteRoot:'/srv/schema/jobs',expectedVersion:0,gpuProtocol:true});
  const request=s.app.sshTargets.request;s.app.sshTargets.request=async()=>({engineId:'schema-ssh-engine',protocolDigest:digest(readFileSync('scripts/ssh-runner-gpu.py'))});
  try{await owner('ssh_target_probe',{id:'schema-ssh'});}finally{s.app.sshTargets.request=request;}
  const gpu=await dockerGpuFixture(()=>owner('gpu_target_probe',{backend:'docker',context:'schema-gpu',image:'python@sha256:'+'a'.repeat(64)}));assert.equal(gpu.devices.length,1);assert.deepEqual(s.app.gpus.list(),[gpu]);
  const environments=await call('execution_environment_list');assert.equal(environments.local.runtimes[0].id,'schema-node');assert.equal(environments.sshTargets[0].id,'schema-ssh');assert.deepEqual(environments.gpuTargets,[gpu]);assert.equal(JSON.stringify(environments).includes(s.dir),false);
  for(const [name,value] of [['gpu_target_probe',gpu],['execution_environment_list',environments]])assert.throws(()=>validateSchema(OUTPUT_SCHEMAS[name],{...value,unexpected:true},'output'),{code:'INVALID_OUTPUT'});
  const scan=s.app.sshTargets.scan,onboarding=s.app.sshTargets.onboarding;
  s.app.sshTargets.scan=async()=>[{keyType:'ssh-ed25519',key:Buffer.concat([Buffer.from([0,0,0,11]),Buffer.from('ssh-ed25519'),Buffer.from([0,0,0,32]),Buffer.alloc(32,7)]).toString('base64'),fingerprint:'SHA256:fixture'}];
  s.app.sshTargets.onboarding=async()=>({supervisor:'ready',workspace:'ready',docker:'ready',engineId:'schema-onboard-engine',protocolDigest:digest(readFileSync('scripts/ssh-runner-gpu.py'))});
  try{const challenge=await owner('ssh_target_challenge',{id:'schema-onboard',host:'onboard.invalid',user:'research',identityFile,remoteRoot:'/srv/schema/jobs',expectedVersion:0});await owner('ssh_target_confirm',{challengeId:challenge.challengeId,fingerprint:challenge.fingerprint});await owner('ssh_target_setup',{id:'schema-onboard',expectedVersion:1});}finally{s.app.sshTargets.scan=scan;s.app.sshTargets.onboarding=onboarding;}
  await call('research_skill_list');
  await call('research_skill_read',{skillId:'pi-research-overview'});
  const methods=await call('research_method_compile',{specification:{version:1,literatureSources:[],quantitative:{type:'descriptive'}}});assert.equal(methods.compilerVersion,'method-contract-v1');assert.deepEqual(methods.specification.quantitative,{type:'descriptive'});
  const fixtureRoot=s.app.sessions.create(USER,s.project.id,{title:'UNIT separate fixture workflow'});s.app.store.update('session',fixtureRoot.id,fixtureRoot.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});const fixture=await call('research_fixture_prepare',{profile:'numeric-regression-v1'},{...root,sessionId:fixtureRoot.id});assert.equal(fixture.inputPath,`/data/${fixture.fixtureRef.id}`);assert.equal(fixture.fixtureRef.generatorVersion,'numeric-regression-v1');
  await call('connector_status');
  await call('project_inspect');
  const preparedCampaign=await call('campaign_prepare',{goal:'schema fixture',baselineExperimentId:s.baseline.id});
  assert.equal(preparedCampaign.state,'draft');assert.equal(s.app.store.get('approval',preparedCampaign.approvalId).status,'pending');
  const projectIndex=await call('project_inspect');assert.deepEqual(projectIndex.campaigns,[{id:preparedCampaign.id,goal:'schema fixture',state:'draft'}]);
  await call('workspace_list',{source:'project'});
  await call('workspace_write',{path:'sample.txt',content:'sample',expectedDigest:null});
  const sampleRead=await call('workspace_read',{path:'sample.txt'});
  const artifact=await call('artifact_create',{title:'text.txt',content:'measured original text'});
  const preparedText=await call('artifact_text_prepare',{artifactId:artifact.id,sourceDigest:artifact.digest});assert.equal(preparedText.status,'ready');assert.equal(preparedText.readProtocol,'fixed-text-v1');
  const fixedPage=await call('artifact_read',{artifactId:artifact.id,sourceDigest:artifact.digest,textSourceId:preparedText.textSourceId,readProtocol:'fixed-text-v1'});assert.equal(fixedPage.content,'measured original text');assert.equal(fixedPage.sourceDigest,artifact.digest);
  await call('artifact_read',{artifactId:artifact.id});
  const evidence=await call('evidence_register',{artifactId:artifact.id,exactQuote:'measured'});
  await call('evidence_read',{evidenceId:evidence.id});
  const brief=await call('research_brief_save',{draftFiles:[{path:'sample.txt',readId:sampleRead.draftReadId}],expectedRevisionId:null,question:'A fixed research question',scope:'Controlled comparison',constraints:[],successCriteria:['Check real metrics'],clarificationQuestions:[],literatureSummary:'Original source fixture',hypotheses:[{statement:'A hypothesis for later testing',evidenceIds:[evidence.id]}],evidenceIds:[evidence.id],steps:[{title:'Baseline',description:'Separate run approval required'}],status:'ready'});
  await call('research_brief_inspect');
  check('research_brief_confirm',s.app.operations.execute(USER,'research_brief_confirm',{briefId:brief.id,expectedVersion:brief.version},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'schema-brief-confirm'}));
  const workflowSession=s.app.sessions.create(USER,s.project.id,{title:'UNIT workflow output contract'});s.app.sessionPermissions.initialize(workflowSession.id,'confirm');
  const workflowBrief=s.app.researchBriefs.save(USER,s.project.id,workflowSession.id,{question:'UNIT workflow output contract',scope:'Synthetic contract fixture only',constraints:[],successCriteria:['Closed workflow output'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Check the fixed source'}],status:'ready',expectedRevisionId:null});
  check('workflow_confirm',s.app.operations.execute(USER,'workflow_confirm',{sourceKind:'brief',sourceId:workflowBrief.id,sourceDigest:workflowBrief.digest,expectedVersion:workflowBrief.version},{projectId:s.project.id,sessionId:workflowSession.id,idempotencyKey:'schema-workflow-confirm'}));
  const notice=s.app.sessions.system(s.session.id,'host notice');
  await call('session_notice_read',{messageId:notice.id});
  await call('experiment_plan_submit',{title:'Candidate',parentId:s.baseline.id,config:{polynomialDegree:2}});
  const c=campaign(s,{limits:{deadline:new Date(Date.now()+3600000).toISOString()}});
  const intent=await call('run_prepare',{experimentId:s.baseline.id});
  await call('campaign_enroll',{campaignId:c.id,intentId:intent.id,expectedVersion:c.version});
  await call('approval_request');approve(s.app,intent.approvalId);
  const run=await call('run_submit',{intentId:intent.id});
  const withdrawable=s.app.runs.prepare(USER,s.baseline.id,s.session.id),withdrawApproval=approve(s.app,withdrawable.approvalId);
  check('run_intent_withdraw',s.app.operations.execute(USER,'run_intent_withdraw',{intentId:withdrawable.id,expectedVersion:withdrawable.version,approvalId:withdrawApproval.id,expectedApprovalVersion:withdrawApproval.version,manifestDigest:withdrawable.manifestDigest},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'schema-withdraw'}));
  check('run_list',s.app.operations.execute(USER,'run_list',{cursor:0,limit:20},{projectId:s.project.id}));
  check('research_history_list',s.app.operations.execute(USER,'research_history_list',{kind:'evidence',cursor:0,limit:20},{projectId:s.project.id}));
  fixtureFinish(s,run);s.app.campaigns.observe();
  await call('run_inspect',{runId:run.id});
  await call('run_logs',{runId:run.id});
  await call('run_source_list',{runId:run.id});
  await call('run_source_read',{runId:run.id,path:'config.json',cursor:0,limit:32});
  const inspected=await call('campaign_inspect',{campaignId:c.id});
  const d=await call('campaign_decision_submit',{campaignId:c.id,expectedVersion:inspected.campaign.version,action:'promote',selectedRunId:run.id,observationIds:inspected.observations.map(o=>o.id),reason:'fixture',candidates:[{title:'child',hypothesis:'test',config:{polynomialDegree:2,ridge:0.000001}}]});
  approve(s.app,d.approvalId);s.app.decisions.apply(USER,d.id,d.version);
  await call('campaign_inspect',{campaignId:c.id});
  const imported=s.app.evidence.put(s.project.id,'original.txt',Buffer.from('adsorption defects are measured\n\nsecond independent measurement'));
  const duplicate=s.app.evidence.put(s.project.id,'duplicate.txt',s.app.evidence.read(USER,imported.id).bytes);
  s.app.textEvidence.configure(USER,s.project.id,{expectedVersion:0,enabled:true,artifactIds:[imported.id,duplicate.id]});
  const matches=await call('text_evidence_search',{query:'adsorption',artifactIds:[imported.id,duplicate.id]});
  assert.equal(matches.hits[0].alternativeSources.length,1);
  await call('text_evidence_search',{query:'absentword',artifactIds:[imported.id]});
  await call('project_inspect');
  const p=s.app.projects.get(USER,s.project.id);s.app.projects.settings(USER,p.id,{expectedVersion:p.version,enabled:true});
  const t=await call('collaboration_plan_submit',{goal:'fixture',tasks:[spec('first',{expectedOutputs:[{kind:'text',schemaId:'text',required:false,title:'note',mediaType:'text/plain',minBytes:1}]}),spec('review',{role:'reviewer',reviewOf:'first'})],budget:5});
  await call('agent_delegate',{goal:'other fixture',tasks:[spec('other')],budget:3});
  await call('task_inspect',{teamId:t.id});
  const pending=s.app.teams.tasks(USER,t.id)[0];await call('task_result_read',{taskId:pending.id});
  approve(s.app,t.approvalId);s.app.teams.activate(USER,t.id);
  const claimed=s.app.teams.claim(t.id), assistant=actor(claimed);
  const session=s.app.store.get('session',assistant.sessionId);s.app.store.update('session',session.id,session.version,{state:'running',leaseUntil:Date.now()+120000,generation:assistant.generation});
  await call('task_context_read',{},assistant);
  await call('task_progress_report',{message:'working'},assistant);
  const snapshot=s.app.store.list('context-snapshot',s.project.id).find(x=>x.attemptId===assistant.attemptId);
  s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('context-snapshot',snapshot.id);
  assert.equal(await call('task_context_read',{},assistant),null);
  await call('task_result_submit',result(),assistant);
  await call('task_result_read',{taskId:pending.id});
  const reviewer=s.app.teams.claim(t.id);check('task_context_read',reviewer.context);
  await call('task_inspect',{teamId:t.id});
  globalThis.fetch=async()=>Response.json({message:{items:[{DOI:'10.1234/test',title:['Paper'],author:[{given:'A',family:'B'}],published:{'date-parts':[[2025,1,1]]},'container-title':['Journal'],URL:'https://doi.org/10.1234/test'}]}});
  await call('literature_search',{query:'paper'});
  await call('literature_discover',{query:'paper',sources:['crossref','openalex']});
  const cfg=s.app.connectors.settings(USER,s.project.id);
  s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{alphaxiv:true,openalex:true}});
  globalThis.fetch=async url=>new URL(url).hostname==='api.alphaxiv.org'
   ?Response.json([{paperId:'2401.01234',title:'Snippet paper',votes:4,snippets:[{snippet:'quoted',pageNumber:2},{snippet:'unmapped'}]}])
   :Response.json({results:[{id:'https://openalex.org/W123',title:'Cited paper',cited_by_count:3,publication_date:'2025-01-01'}]});
  const optionalHits=await call('literature_discover',{query:'optionals',sources:['alphaxiv','openalex']});
  assert.equal(optionalHits.status,'complete');assert.equal(optionalHits.items[0].snippets[1].reportedPage,null);
  assert.equal(optionalHits.items[1].citations,3);
  globalThis.fetch=async url=>new URL(url).hostname==='api.alphaxiv.org'?new Response('unavailable',{status:503}):Response.json({results:[]});
  const partial=await call('literature_discover',{query:'failed source',sources:['alphaxiv','openalex']});
  assert.equal(partial.sources[0].status,'failed');
  globalThis.fetch=async()=>Response.json({message:{DOI:'10.1234/test',title:['Paper']}});
  await call('paper_read',{id:'10.1234/test',source:'crossref'});
  const changeArtifact=s.app.evidence.put(s.project.id,'change.txt',Buffer.from('new source'),'text/plain',`agent:${root.sessionId}`);
  await call('change_proposal_prepare',{baseExperimentId:s.baseline.id,expectedRevision:1,title:'patch',hypothesis:'fixture',changes:[{path:'new.txt',expectedDigest:null,artifactId:changeArtifact.id}]});
  const durable=setup();
  try {
   const app=durable.app,pid=durable.project.id,sid=durable.session.id;
   app.hostAccess.enable(USER,sid,{expectedVersion:0,acknowledgedSameUserAccess:true,acknowledgedResearchAutomation:true,researchAutomationPolicy:{version:2,limits:{development:null,run:null,continuations:null,durationMs:null},recoverAfterRestart:true}});
   app.researchAutomation.startOwner();
   const origin=app.sessions.send(USER,sid,{content:'UNIT fixed checkpoint output contract'}),session=app.store.get('session',sid);
   app.store.update('session',sid,session.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});
   app.store.update('message',origin.id,origin.version,{status:'running',generation:1});
   const first={type:'agent',role:'coordinator',projectId:pid,sessionId:sid,messageId:origin.id,generation:1,permission:app.sessionPermissions.capture(sid),researchModelDigest:app.researchAutomation.modelIdentity(session)};
   app.runs.prepare(first,durable.baseline.id);
   const input=app.store.get('message',origin.id),running=app.store.get('session',sid);
   app.store.update('message',input.id,input.version,{status:'completed'});app.store.update('session',sid,running.version,{state:'idle',leaseUntil:0});
   app.wakeups.reconcile();const wakeup=app.wakeups.list(USER,pid).find(w=>w.jobKind==='prepared');assert.ok(wakeup);
   const dispatch=app.wakeups.dispatch(wakeup.id,{ready:true});assert.ok(dispatch);const idle=app.store.get('session',sid);
   app.store.update('session',sid,idle.version,{state:'running',generation:2,leaseUntil:Date.now()+120000});app.store.update('message',dispatch.message.id,dispatch.message.version,{status:'running',generation:2});app.wakeups.markStarted(wakeup.id,sid,2,dispatch.message.id);
   const continuation={...first,generation:2,messageId:dispatch.message.id,wakeupId:wakeup.id,continuationId:wakeup.continuationId,permission:dispatch.message.permission};
   const checkpoint=check('research_task_checkpoint',await new ToolDispatcher(app).execute(continuation,'research_task_checkpoint',{state:'waiting',summary:'UNIT existing prepared work awaits the next phase',runIds:[],developmentJobIds:[]},'schema-checkpoint'));
   assert.equal(checkpoint.continuationId,wakeup.continuationId);assert.equal(checkpoint.scientificConclusion,false);assert.equal(app.researchAutomation.inspect(USER,wakeup.continuationId).checkpoint.state,'waiting');
  } finally {durable.close();}
  // Source-access and grant operations are covered by their own feature tests;
  // text-evidence.test.mjs exercises all four TextCorpusGrant operations through Registry.
  const expected=Object.keys(TOOL_DEFINITIONS).filter(name=>!Object.hasOwn(SESSION_HISTORY_INPUT_SCHEMAS,name)&&!Object.hasOwn(RUN_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(WORKING_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(DISCOVERY_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(RESEARCH_PLAN_INPUT_SCHEMAS,name)&&!Object.hasOwn(SOURCE_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(DEVELOPMENT_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(GIT_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(REVIEW_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(FORMAL_REPORT_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(REPORT_INPUT_SCHEMAS,name)&&!Object.hasOwn(SCHEDULER_INPUT_SCHEMAS,name)&&!Object.hasOwn(DOCUMENT_INPUT_SCHEMAS,name)&&!Object.hasOwn(SKILL_INPUT_SCHEMAS,name)&&!Object.hasOwn(PUBLICATION_INPUT_SCHEMAS,name)&&!['docker_connection_probe','ssh_target_inspect','ssh_target_preferences_configure'].includes(name)&&name!=='reviewed_change_prepare'&&!name.startsWith('text_corpus_grant_'));
  assert.deepEqual([...seen].sort(),expected.sort());
  const corrupt=structuredClone(evidence);corrupt.locator.typo=1;
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.evidence_read,corrupt,'output'),{code:'INVALID_OUTPUT'});
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.task_context_read,{taskId:'incomplete'},'output'),{code:'INVALID_OUTPUT'});
 } finally {globalThis.fetch=savedFetch;s.close();}
});

test('execution environment catalog is read-only for an interactive coordinator; tasks and wakeups cannot configure or probe',async()=>{
 const s=setup();try{
  s.app.localRuntimes.configure(USER,{id:'saved-node',executable:'node',expectedVersion:0});const status=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:status.version});
  const current=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});const who={type:'agent',role:'coordinator',projectId:s.project.id,sessionId:s.session.id,generation:1},tools=new ToolDispatcher(s.app);
  const savedSpawn=childProcess.spawn,savedSpawnSync=childProcess.spawnSync;childProcess.spawn=childProcess.spawnSync=()=>assert.fail('Saved catalog must not launch a process');syncBuiltinESMExports();
  try{const view=await tools.execute(who,'execution_environment_list',{},'read-catalog');validateSchema(OUTPUT_SCHEMAS.execution_environment_list,view,'output');assert.equal(view.local.runtimes[0].id,'saved-node');assert.deepEqual(view.local.runTargets,[{runner:'local',localRuntimeId:'saved-node'}]);assert.equal(view.local.status,'configured');}finally{childProcess.spawn=savedSpawn;childProcess.spawnSync=savedSpawnSync;syncBuiltinESMExports();}
  const taskRoot=s.app.sessions.create(USER,s.project.id,{title:'Owner-approved task fixture'}),team=startTeam({...s,session:taskRoot},[spec('environment-reader')]),claimed=s.app.teams.claim(team.id),taskActor=actor(claimed),taskSession=s.app.sessions.get(USER,taskActor.sessionId);s.app.store.update('session',taskSession.id,taskSession.version,{state:'running',generation:taskActor.generation,leaseUntil:Date.now()+120000});
  await assert.rejects(tools.execute(taskActor,'execution_environment_list',{},'task-catalog'),{code:'TOOL_DENIED'});const wakeup={...who,wakeupId:'automatic-fixture'};await assert.rejects(tools.execute(wakeup,'execution_environment_list',{},'automatic-catalog'),{code:'AUTOMATION_TOOL_DENIED'});
  for(const caller of [who,taskActor,wakeup])for(const name of ['local_runtime_configure','gpu_target_probe','ssh_target_configure','ssh_target_challenge','ssh_target_confirm','ssh_target_setup','ssh_target_probe','docker_connection_probe','ssh_target_inspect','ssh_target_preferences_configure'])await assert.rejects(tools.execute(caller,name,{},'denied-'+name),{code:'TOOL_DENIED'});
  assert.equal(s.app.localRuntimes.list().length,1);assert.equal(s.app.gpus.list().length,0);assert.equal(s.app.sshTargets.list(USER).length,0);
 }finally{s.close();}
});
