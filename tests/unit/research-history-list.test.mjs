import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {pmcDocument} from '../support/pmc-corpus.mjs';
import {startTeam,spec,actor} from '../support/collaboration.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {INPUT_SCHEMAS} from '../../dist/packages/contracts/operations/inputs.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {ROLE_TOOLS,AUTOMATION_TOOLS} from '../../dist/packages/policy/permissions.js';
import {CONTINUATION_TOOLS,APPROVAL_RESUME_TOOLS} from '../../dist/packages/policy/research-automation.js';

const TOOL='research_history_list';
function root(s){const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{state:'running',generation:current.generation+1,leaseUntil:Date.now()+120000,skillBundleId:s.app.skills.configuration(s.project.id).bundleId});return {type:'agent',role:'coordinator',projectId:s.project.id,sessionId:current.id,generation:current.generation+1};}
function list(s,kind,extra={},who=USER,key='history',pid=s.project.id){const result=s.app.operations.execute(who,TOOL,{kind,...extra},{projectId:pid,idempotencyKey:key});validateSchema(OUTPUT_SCHEMAS[TOOL],result,'output');return result;}
function counts(s){return [s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,s.app.store.events().length,s.app.store.db.prepare('SELECT count(*) n FROM operations').get().n];}
function fixture(s){
 const document=s.app.documents.import(USER,s.project.id,{title:'Fixed PDF',mediaType:'application/pdf',contentBase64:Buffer.from('%PDF-1.7\nPDF_BODY_SECRET').toString('base64')},'history-pdf');
 const pmc=pmcDocument(s,{content:'PMC_QUOTE_SECRET'}),text=s.app.evidence.put(s.project.id,'Observation',Buffer.from('EVIDENCE_QUOTE_SECRET'),'text/plain','user');
 const evidence=s.app.evidence.register(USER,s.project.id,text.id,0,21,'EVIDENCE_DESCRIPTION_SECRET');
 // Local fixed linkage fixtures exercise the grant boundary without starting a PDF parser.
 const pdfEvidence=s.app.store.create('evidence',s.project.id,{type:'paper',artifactId:document.original.artifactId,digest:document.original.digest,locator:{start:0,end:1},quote:'PDF_QUOTE_SECRET',description:'PDF_DESCRIPTION_SECRET',document:{documentVersionId:document.id,parseResultId:'local-parse-fixture',rawDigest:document.original.digest,pageNumber:1,textArtifactDigest:'local-digest'}});
 const pmcEvidence=s.app.store.create('evidence',s.project.id,{type:'paper',artifactId:pmc.derivedText.artifactId,digest:pmc.derivedText.digest,locator:{start:0,end:16},quote:'PMC_QUOTE_SECRET',description:'PMC_DESCRIPTION_SECRET',providerText:{documentVersionId:pmc.id,documentDigest:pmc.derivedText.digest,rawDigest:pmc.original.digest,textArtifactDigest:pmc.derivedText.digest,reportedVersion:pmc.source.reportedVersion}});
 const proposed=s.app.evidence.proposeClaim(USER,s.project.id,'CLAIM_STATEMENT_SECRET',[evidence.id],['CLAIM_LIMITATION_SECRET']),claim=s.app.evidence.decideClaim(USER,proposed.id,proposed.version,'accepted');
 const artifact=s.app.reports.create(USER,s.project.id,{title:'Saved report',claimIds:[claim.id]}),report=s.app.store.list('report',s.project.id).find(row=>row.artifactId===artifact.id);
 return {document,pmc,evidence,pdfEvidence,pmcEvidence,claim,report};
}

test('research history is a closed metadata projection and does not grant protected evidence content',async()=>{
 const s=setup();try{
  const f=fixture(s),who=root(s),tools=new ToolDispatcher(s.app),before=counts(s),pages={};
  for(const kind of ['documents','evidence','claims','reports'])pages[kind]=await tools.execute(who,TOOL,{kind},'index-'+kind);
  assert.deepEqual(counts(s),before);assert.deepEqual(Object.keys(pages.documents).sort(),['cursor','hasMore','items']);
  assert.deepEqual(pages.documents.items.map(row=>row.id),[f.document.id,f.pmc.id]);
  assert.deepEqual(Object.keys(pages.documents.items[0]).sort(),['acquiredAt','contentKind','id','source','title']);
  assert.deepEqual(pages.documents.items[0].source,{requestedVersion:null,reportedVersion:null});
  assert.deepEqual(pages.documents.items[1].source,{provider:'pubmed',requestedVersion:f.pmc.source.requestedVersion,reportedVersion:f.pmc.source.reportedVersion});
  assert.deepEqual(pages.evidence.items.map(row=>row.id),[f.evidence.id,f.pdfEvidence.id,f.pmcEvidence.id]);
  assert.deepEqual(pages.evidence.items[1],{id:f.pdfEvidence.id,type:'paper',createdAt:f.pdfEvidence.createdAt,documentVersionId:f.document.id,parseResultId:'local-parse-fixture'});
  assert.equal(pages.evidence.items[2].documentVersionId,f.pmc.id);assert.ok(!Object.hasOwn(pages.evidence.items[2],'parseResultId'));
  assert.deepEqual(pages.claims.items,[{id:f.claim.id,status:'accepted',validity:'current',createdAt:f.claim.createdAt,evidenceIds:[f.evidence.id]}]);
  assert.deepEqual(pages.reports.items,[{id:f.report.id,title:'Saved report',createdAt:f.report.createdAt,updatedAt:f.report.updatedAt,formatVersion:1,runCount:0,claimCount:1}]);
  const wire=JSON.stringify(pages);
  for(const secret of ['PDF_BODY_SECRET','PDF_QUOTE_SECRET','PMC_QUOTE_SECRET','EVIDENCE_QUOTE_SECRET','EVIDENCE_DESCRIPTION_SECRET','CLAIM_STATEMENT_SECRET','CLAIM_LIMITATION_SECRET',f.report.artifactId,f.document.original.artifactId,f.pmc.derivedText.artifactId])assert.ok(!wire.includes(secret),secret);
  for(const page of Object.values(pages)){validateSchema(OUTPUT_SCHEMAS[TOOL],page,'output');assert.throws(()=>validateSchema(OUTPUT_SCHEMAS[TOOL],{...page,content:'unapproved'},'output'),{code:'INVALID_OUTPUT'});assert.throws(()=>validateSchema(OUTPUT_SCHEMAS[TOOL],{...page,items:[{...page.items[0],artifactId:'unapproved'}]},'output'),{code:'INVALID_OUTPUT'});}
  assert.throws(()=>validateSchema(OUTPUT_SCHEMAS[TOOL],{...pages.documents,items:[{...pages.documents.items[0],source:{...pages.documents.items[0].source,sourceUrl:'private'}}]},'output'),{code:'INVALID_OUTPUT'});
  await assert.rejects(tools.execute(who,'evidence_read',{evidenceId:f.pdfEvidence.id},'pdf-content'),{code:'PERMISSION_DENIED'});
  await assert.rejects(tools.execute(who,'evidence_read',{evidenceId:f.pmcEvidence.id},'pmc-content'),{code:'PMC_OWNER_ONLY'});
  assert.equal((await tools.execute(who,'evidence_read',{evidenceId:f.evidence.id},'ordinary-content')).quote,'EVIDENCE_QUOTE_SECRET');
 }finally{s.close();}
});

test('history pagination has bounded defaults, stable rowid cursors, empty pages and project isolation',()=>{
 const s=setup();try{
  const base=s.app.documents.import(USER,s.project.id,{title:'First',mediaType:'text/plain',contentBase64:Buffer.from('private body').toString('base64')},'first');
  const rows=[base];for(let i=1;i<23;i++)rows.push(s.app.store.create('document-version',s.project.id,{...base,title:'Document '+i}));
  const other=s.app.projects.create(USER,{name:'Other'}),foreign=s.app.store.create('document-version',other.id,{...base,title:'FOREIGN_DOCUMENT_SECRET'}),who=root(s),before=counts(s);
  assert.deepEqual(list(s,'evidence'),{items:[],cursor:0,hasMore:false});assert.deepEqual(list(s,'claims',{cursor:13}),{items:[],cursor:13,hasMore:false});
  const defaults=list(s,'documents');assert.equal(defaults.items.length,20);assert.equal(defaults.hasMore,true);
  const first=list(s,'documents',{limit:1});assert.equal(first.items[0].id,base.id);assert.equal(first.cursor,Number(s.app.store.db.prepare("SELECT rowid FROM records WHERE kind='document-version' AND id=?").get(base.id).rowid));
  const saved=s.app.store.get('document-version',base.id);s.app.store.update('document-version',base.id,saved.version,{title:'Updated title'});
  const next=list(s,'documents',{cursor:first.cursor,limit:100});assert.deepEqual(next.items.map(row=>row.id),rows.slice(1).map(row=>row.id));assert.equal(next.hasMore,false);assert.ok(!next.items.some(row=>row.id===foreign.id));
  assert.deepEqual(list(s,'documents',{cursor:next.cursor}),{items:[],cursor:next.cursor,hasMore:false});
  assert.throws(()=>list(s,'documents',{},who,'foreign',other.id),{code:'SCOPE_DENIED'});
  for(const kind of [undefined,null,'report','document-version','runs'])assert.throws(()=>list(s,kind),{code:'INVALID_INPUT'});
  for(const input of [{limit:0},{limit:101},{limit:1.5},{limit:null},{cursor:-1},{cursor:1.5},{cursor:null},{cursor:Number.MAX_SAFE_INTEGER+1},{projectId:other.id},{content:true}])assert.throws(()=>list(s,'documents',input),{code:'INVALID_INPUT'});
  assert.deepEqual(counts(s),before);validateSchema(INPUT_SCHEMAS[TOOL],TOOL_DEFINITIONS[TOOL].example);
 }finally{s.close();}
});

test('only the active interactive coordinator can list history; task and automation roles stay excluded',()=>{
 const s=setup();try{
  const who=root(s);assert.ok(ROLE_TOOLS.coordinator.includes(TOOL));
  for(const [role,names] of Object.entries(ROLE_TOOLS))if(role!=='coordinator')assert.ok(!names.includes(TOOL));
  for(const names of [AUTOMATION_TOOLS,CONTINUATION_TOOLS,APPROVAL_RESUME_TOOLS])assert.ok(!names.includes(TOOL));
  for(const automation of [false,true]){const names=new ToolDispatcher(s.app).definitions('coordinator',automation,s.session.id).map(row=>row.name);assert.equal(names.includes(TOOL),!automation);}
  for(const marker of [{attemptId:'task-attempt'},{teamId:'task-team'}])assert.throws(()=>list(s,'documents',{}, {...who,...marker}),{code:'TASK_SCOPE_DENIED'});
  for(const marker of [{wakeupId:'wakeup'},{wakeupId:'wakeup',continuationId:'continuation'},{wakeupId:'wakeup',approvalResumeId:'resume'}])assert.throws(()=>list(s,'documents',{}, {...who,...marker}),{code:'AUTOMATION_TOOL_DENIED'});
  const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{teamId:'task-root'});assert.throws(()=>list(s,'documents',{},who),{code:'INVALID_ROOT_SESSION'});
  const restore=s.app.store.get('session',s.session.id);s.app.store.update('session',restore.id,restore.version,{teamId:undefined,leaseUntil:Date.now()-1});assert.throws(()=>list(s,'documents',{},who),{code:'LEASE_EXPIRED'});
  const resumed=root(s);s.app.sessions.interrupt(USER,s.session.id);assert.throws(()=>list(s,'documents',{},resumed),{code:'LEASE_EXPIRED'});
  const team=startTeam(s,[spec('history-reader')]),taskActor=actor(s.app.teams.claim(team.id));assert.throws(()=>list(s,'documents',{},taskActor),{code:'TOOL_DENIED'});
 }finally{s.close();}
});

test('same callId reads current saved state, readOnly works, and reopening preserves history and pending decisions',async()=>{
 const s=setup();try{
  const f=fixture(s),who=root(s),key='fresh-history',tools=new ToolDispatcher(s.app),first=await tools.execute(who,TOOL,{kind:'claims'},key);
  const intent=s.app.operations.execute(USER,'run_prepare',{experimentId:s.baseline.id},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'pending-history-run'}),pending=s.app.store.get('approval',intent.approvalId);
  assert.equal(pending.status,'pending');
  const claim=s.app.store.get('claim',f.claim.id);s.app.store.update('claim',claim.id,claim.version,{validity:'stale'});
  assert.equal(first.items[0].validity,'current');const changed=await tools.execute(who,TOOL,{kind:'claims'},key);assert.equal(changed.items[0].validity,'stale');
  const config=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:config.version});
  assert.deepEqual(await tools.execute(who,TOOL,{kind:'claims'},key),changed);
  const expected=Object.fromEntries(['documents','evidence','claims','reports'].map(kind=>[kind,list(s,kind,{},who,'reopen-'+kind)]));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  for(const [kind,page] of Object.entries(expected))assert.deepEqual(list(s,kind,{},who,'reopen-'+kind),page);
  assert.deepEqual(s.app.store.get('approval',pending.id),pending);assert.equal(s.app.store.get('run-intent',intent.id).status,'prepared');assert.equal(s.app.store.list('run',s.project.id).length,0);
  assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM operations WHERE scope=? AND key=?').get('agent:'+who.sessionId,key).n,0);
  const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{generation:session.generation+1});assert.throws(()=>list(s,'claims',{},who,key),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});
