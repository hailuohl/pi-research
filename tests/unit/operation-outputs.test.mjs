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
  const current=s.app.store.get('session',s.session.id);
  s.app.store.update('session',current.id,current.version,{state:'running',generation:1,skillBundleId:s.app.skills.configuration(s.project.id).bundleId,leaseUntil:Date.now()+120000});
  const root={type:'agent',projectId:s.project.id,sessionId:s.session.id,generation:1,role:'coordinator'}, tools=new ToolDispatcher(s.app);
  let serial=0;
  const check=(name,value)=>{validateSchema(OUTPUT_SCHEMAS[name],value,'output');seen.add(name);return value;};
  const call=async(name,input={},a=root)=>check(name,await tools.execute(a,name,input,`schema-${++serial}`));
  await call('research_skill_list');
  await call('research_skill_read',{skillId:'pi-research-overview'});
  await call('connector_status');
  await call('project_inspect');
  await call('workspace_list',{source:'project'});
  await call('workspace_write',{path:'sample.txt',content:'sample',expectedDigest:null});
  await call('workspace_read',{path:'sample.txt'});
  const artifact=await call('artifact_create',{title:'text.txt',content:'measured original text'});
  await call('artifact_read',{artifactId:artifact.id});
  const evidence=await call('evidence_register',{artifactId:artifact.id,start:0,end:8,description:'fixture quotation'});
  await call('evidence_read',{evidenceId:evidence.id});
  const notice=s.app.sessions.system(s.session.id,'host notice');
  await call('session_notice_read',{messageId:notice.id});
  await call('experiment_plan_submit',{title:'Candidate',parentId:s.baseline.id,config:{polynomialDegree:2}});
  const c=campaign(s,{limits:{deadline:new Date(Date.now()+3600000).toISOString()}});
  const intent=await call('run_prepare',{experimentId:s.baseline.id});
  await call('campaign_enroll',{campaignId:c.id,intentId:intent.id,expectedVersion:c.version});
  await call('approval_request');approve(s.app,intent.approvalId);
  const run=await call('run_submit',{intentId:intent.id});
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
  // Source-access and grant operations are covered by their own feature tests;
  // text-evidence.test.mjs exercises all four TextCorpusGrant operations through Registry.
  const expected=Object.keys(TOOL_DEFINITIONS).filter(name=>!Object.hasOwn(SESSION_HISTORY_INPUT_SCHEMAS,name)&&!Object.hasOwn(RUN_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(WORKING_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(DISCOVERY_GRANT_INPUT_SCHEMAS,name)&&!Object.hasOwn(RESEARCH_PLAN_INPUT_SCHEMAS,name)&&!Object.hasOwn(SOURCE_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(DEVELOPMENT_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(GIT_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(REVIEW_OUTPUT_SCHEMAS,name)&&!Object.hasOwn(REPORT_INPUT_SCHEMAS,name)&&!Object.hasOwn(SCHEDULER_INPUT_SCHEMAS,name)&&!Object.hasOwn(DOCUMENT_INPUT_SCHEMAS,name)&&!Object.hasOwn(SKILL_INPUT_SCHEMAS,name)&&!Object.hasOwn(PUBLICATION_INPUT_SCHEMAS,name)&&name!=='reviewed_change_prepare'&&!name.startsWith('text_corpus_grant_'));
  assert.deepEqual([...seen].sort(),expected.sort());
  const corrupt=structuredClone(evidence);corrupt.locator.typo=1;
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.evidence_read,corrupt,'output'),{code:'INVALID_OUTPUT'});
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.task_context_read,{taskId:'incomplete'},'output'),{code:'INVALID_OUTPUT'});
 } finally {globalThis.fetch=savedFetch;s.close();}
});
