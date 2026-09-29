import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,writeFileSync} from 'node:fs';
import {setup,USER} from '../support/research.mjs';
import {pmcDocument,pmcContent} from '../support/pmc-corpus.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
const configure=(s,d,extra={})=>s.app.textEvidence.configure(USER,s.project.id,{enabled:true,pmcDocuments:[{documentVersionId:d.id}],expectedVersion:s.app.textEvidence.status(USER,s.project.id).version,...extra});
const input=(d,c)=>({query:'adsorption',pmcDocuments:[{documentVersionId:d.id}],corpusId:c.corpusId,configurationVersion:c.version});
const op=(s,name,x,key='query',actor=USER)=>s.app.operations.execute(actor,name,x,{projectId:s.project.id,idempotencyKey:key});

test('PMC corpus is explicit, bound, offline, page-free, and retains history across disable and reopen',()=>{
 const s=setup(),fetch=globalThis.fetch;let reopened;
 try{
  globalThis.fetch=()=>{throw Error('network forbidden');};
  const d=pmcDocument(s);assert.equal(s.app.textEvidence.status(USER,s.project.id).enabled,false);assert.equal(s.app.store.list('text-corpus').length,0);
  assert.throws(()=>op(s,'text_evidence_search',input(d,{corpusId:'unset',version:0})),{code:'TEXT_EVIDENCE_DISABLED'});
  const c=configure(s,d);assert.deepEqual(c.pmcDocuments,[{documentVersionId:d.id,title:d.title,reportedVersion:'PMC12345.1'}]);
  assert.throws(()=>s.app.textEvidence.search({...USER,sessionId:s.session.id},s.project.id,input(d,c)),{code:'PMC_OWNER_ONLY'});
  const x=input(d,c),r=op(s,'text_evidence_search',x),h=r.hits[0],e=op(s,'evidence_read',{evidenceId:h.evidenceId});
  assert.equal(h.sourceKind,'pmc_oa_text');assert.equal(h.page,null);assert.equal(h.document,null);assert.deepEqual(e.providerText,h.providerText);assert.equal(e.document,undefined);
  assert.deepEqual(h.providerText,{documentVersionId:d.id,documentDigest:digest(d),rawDigest:d.original.digest,textArtifactDigest:d.derivedText.digest,reportedVersion:'PMC12345.1'});
  assert.equal(h.quote,pmcContent.slice(h.locator.start,h.locator.end));assert.equal(op(s,'text_evidence_search',x).id,r.id);
  assert.deepEqual(r.usage,{modelCalls:0,networkCalls:0});for(const kind of ['connector-call','model-usage','sandbox-job','run'])assert.equal(s.app.store.list(kind).length,0);
  const claim=s.app.evidence.proposeClaim(USER,s.project.id,'Synthetic only',[e.id]);s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');
  assert.throws(()=>s.app.reports.create(USER,s.project.id,{title:'unsupported',claimIds:[claim.id]}),{code:'REPORT_PROVIDER_TEXT_UNSUPPORTED'});
  s.app.textEvidence.configure(USER,s.project.id,{enabled:false,expectedVersion:c.version});assert.throws(()=>op(s,'text_evidence_search',x),{code:'TEXT_EVIDENCE_DISABLED'});assert.equal(op(s,'evidence_read',{evidenceId:e.id}).id,e.id);
  reopened=new ResearchApp(s.dir,process.cwd());assert.equal(reopened.textEvidence.status(USER,s.project.id).enabled,false);assert.deepEqual(reopened.store.get('text-evidence-search',r.id),r);assert.deepEqual(reopened.evidence.verify(s.project.id,e.id,false),e);
 }finally{reopened?.close();globalThis.fetch=fetch;s.close();}
});

test('PMC selection rejects non-OA, missing license, abstract, other provider, bad text and crossed project',()=>{
 for(const options of [{oa:'no'},{license:''},{contentKind:'abstract'},{source:'alphaxiv'},{content:'replacement text'},{reportedVersion:'PMC12345.2'},{scopeSessionId:'foreign'}]){const s=setup();try{const d=pmcDocument(s,options);assert.throws(()=>configure(s,d));assert.equal(s.app.store.list('text-corpus').length,0);}finally{s.close();}}
 const s=setup();try{const d=pmcDocument(s),other=s.app.projects.create(USER,{name:'other'});assert.throws(()=>s.app.textEvidence.configure(USER,other.id,{enabled:true,pmcDocuments:[{documentVersionId:d.id}],expectedVersion:0}));assert.throws(()=>s.app.textEvidence.configure({...USER,sessionId:s.session.id},s.project.id,{enabled:true,pmcDocuments:[{documentVersionId:d.id}],expectedVersion:0}),{code:'PMC_OWNER_ONLY'});
  assert.throws(()=>configure(s,d,{artifactIds:[d.derivedText.artifactId],pmcDocuments:[]}),{code:'TEXT_SOURCE_NOT_ORIGINAL'});
 }finally{s.close();}
});

test('PMC byte or document tamper fences fresh search, operation replay and historical evidence',()=>{
 for(const target of ['original','derivedText','document']){const s=setup();try{
  const d=pmcDocument(s),c=configure(s,d),x=input(d,c),r=op(s,'text_evidence_search',x);
  if(target==='document')s.app.store.update('document-version',d.id,d.version,{title:'changed title'});
  else{const a=s.app.store.get('artifact',d[target].artifactId),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'corrupted source');}
  assert.throws(()=>op(s,'text_evidence_search',x));assert.throws(()=>op(s,'text_evidence_search',{...x,query:'control'},'fresh'));assert.throws(()=>op(s,'evidence_read',{evidenceId:r.hits[0].evidenceId}));
 }finally{s.close();}}
});

test('PMC generic reads stay owner-only for root, task, wakeup agents after source removal',()=>{const s=setup();try{
 const d=pmcDocument(s),c=configure(s,d),x=input(d,c),r=op(s,'text_evidence_search',x),plain=s.app.evidence.put(s.project.id,'legacy.txt',Buffer.from(pmcContent));
 const legacy=s.app.evidence.register(USER,s.project.id,d.derivedText.artifactId,0,10,'legacy generic');
 for(const extra of [{},{taskId:'task'},{wakeupId:'wakeup'}]){const actor={type:'agent',projectId:s.project.id,...extra};
  assert.throws(()=>s.app.textEvidence.search(actor,s.project.id,x),{code:'PERMISSION_DENIED'});
  for(const artifactId of [d.original.artifactId,d.derivedText.artifactId]){assert.throws(()=>s.app.evidence.read(actor,artifactId),{code:'PMC_OWNER_ONLY'});assert.throws(()=>s.app.evidence.register(actor,s.project.id,artifactId,0,2,'bypass'),{code:'PMC_OWNER_ONLY'});}
  for(const evidenceId of [r.hits[0].evidenceId,legacy.id])assert.throws(()=>s.app.textCorpusGrants.authorizeContent(actor,s.project.id,'evidence_read',{evidenceId}),{code:'PMC_OWNER_ONLY'});
 }
 const next=configure(s,d,{pmcDocuments:[],artifactIds:[plain.id]});assert.throws(()=>op(s,'text_evidence_search',x),{code:'TEXT_EVIDENCE_CONFIGURATION_CHANGED'});assert.throws(()=>op(s,'text_evidence_search',input(d,next),'removed'),{code:'TEXT_SOURCE_NOT_APPROVED'});
 const actor={type:'agent',projectId:s.project.id};assert.throws(()=>s.app.evidence.read(actor,d.derivedText.artifactId),{code:'PMC_OWNER_ONLY'});assert.equal(s.app.evidence.verify(s.project.id,r.hits[0].evidenceId,false).id,r.hits[0].evidenceId);
 const textResult=op(s,'text_evidence_search',{query:'adsorption',artifactIds:[plain.id]},'legacy');assert.equal(textResult.hits[0].sourceKind,'user_imported_text');assert.equal(textResult.pmcDocuments,undefined);assert.equal(s.app.store.get('text-corpus',next.corpusId).pmcDocuments,undefined);
 }finally{s.close();}});

test('PMC duplicate alternatives retain independent bindings',()=>{const s=setup();try{
 const d=pmcDocument(s),other=pmcDocument(s),c=configure(s,d,{pmcDocuments:[{documentVersionId:d.id},{documentVersionId:other.id}]}),r=op(s,'text_evidence_search',{...input(d,c),pmcDocuments:[{documentVersionId:d.id},{documentVersionId:other.id}]}),h=r.hits[0];
 assert.equal(h.alternativeSources.length,1);const alt=h.alternativeSources[0];assert.equal(alt.sourceKind,'pmc_oa_text');assert.equal(alt.page,null);assert.notEqual(alt.providerText.documentVersionId,h.providerText.documentVersionId);assert.deepEqual(s.app.evidence.verify(s.project.id,alt.evidenceId).providerText,alt.providerText);
 }finally{s.close();}});

test('reports reject generic PMC XML and text evidence without blocking PubMed abstracts or user imports',()=>{const s=setup();try{
 const d=pmcDocument(s);
 const claimFor=(artifactId)=>{const e=op(s,'evidence_register',{artifactId,start:0,end:10,description:'Generic owner evidence'},'generic-'+artifactId);assert.equal(e.providerText,undefined);const claim=s.app.evidence.proposeClaim(USER,s.project.id,'Synthetic report check',[e.id]);return s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');};
 for(const artifactId of [d.original.artifactId,d.derivedText.artifactId]){const claim=claimFor(artifactId);assert.throws(()=>s.app.reports.create(USER,s.project.id,{title:'PMC generic bypass',claimIds:[claim.id]}),{code:'REPORT_PROVIDER_TEXT_UNSUPPORTED'});}
 assert.equal(s.app.store.list('report',s.project.id).length,0);
 const raw=s.app.evidence.put(s.project.id,'abstract-response.xml',Buffer.from('<abstract>Ordinary PubMed abstract</abstract>'),'application/xml','connector:pubmed:raw');
 const abstract=s.app.evidence.put(s.project.id,'abstract.txt',Buffer.from('Ordinary PubMed abstract text'),'text/plain','connector:pubmed:abstract');
 s.app.store.create('paper-read',s.project.id,{source:'pubmed',contentKind:'abstract',artifactId:abstract.id,rawArtifactIds:[raw.id]});
 const imported=s.app.evidence.put(s.project.id,'import.txt',Buffer.from('User imported research text'),'text/plain','user');
 for(const a of [raw,abstract,imported]){const claim=claimFor(a.id);assert.ok(s.app.reports.create(USER,s.project.id,{title:'Supported existing evidence',claimIds:[claim.id]}).id);}
 assert.equal(s.app.store.list('report',s.project.id).length,3);
 }finally{s.close();}});
