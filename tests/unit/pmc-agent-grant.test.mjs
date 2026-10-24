import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,writeFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {setup,USER,approve} from '../support/research.mjs';
import {pmcDocument,pmcContent} from '../support/pmc-corpus.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';

const op=(s,actor,name,input,key=name)=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,idempotencyKey:key});
function fixture(s,maxSearches=2){
 const document=pmcDocument(s),other=pmcDocument(s),pmcDocuments=[{documentVersionId:document.id}];
 const config=s.app.textEvidence.configure(USER,s.project.id,{enabled:true,pmcDocuments:[...pmcDocuments,{documentVersionId:other.id}],expectedVersion:0});
 const input={query:'adsorption',pmcDocuments,corpusId:config.corpusId,configurationVersion:config.version};
 const prepare={sessionId:s.session.id,documents:[],pmcDocuments,corpusId:config.corpusId,configurationVersion:config.version,maxSearches,expiresAt:new Date(Date.now()+60000).toISOString()};
 const draft=op(s,USER,'text_corpus_grant_prepare',prepare);
 const session=s.app.store.get('session',s.session.id),active=s.app.store.update('session',session.id,session.version,{state:'running',generation:session.generation+1,leaseUntil:Date.now()+300000});
 const actor={type:'agent',projectId:s.project.id,sessionId:active.id,role:'coordinator',generation:active.generation};
 return {document,other,config,input,prepare,draft,actor};
}
function activate(s,f){approve(s.app,f.draft.approvalId);return op(s,USER,'text_corpus_grant_activate',{grantId:f.draft.id,expectedVersion:f.draft.version});}
const search=(s,f,key='search',extra={})=>op(s,f.actor,'text_evidence_search',{...f.input,...extra},key);
const read=(s,f,evidenceId,key='read')=>op(s,f.actor,'evidence_read',{evidenceId},key);

test('PMC grant requires separate approval and activation, persists bounded offline results and owner history',()=>{
 const s=setup(),fetch=globalThis.fetch;let reopened;
 try{
  globalThis.fetch=()=>{throw Error('network forbidden');};
  const f=fixture(s);assert.deepEqual(f.draft.documents,[]);assert.equal(f.draft.pmcDocuments.length,1);
  assert.throws(()=>search(s,f),{code:'PERMISSION_DENIED'});
  assert.throws(()=>op(s,USER,'text_corpus_grant_activate',{grantId:f.draft.id,expectedVersion:f.draft.version}),{code:'APPROVAL_REQUIRED'});
  approve(s.app,f.draft.approvalId);assert.throws(()=>search(s,f),{code:'PERMISSION_DENIED'});
  const grant=op(s,USER,'text_corpus_grant_activate',{grantId:f.draft.id,expectedVersion:f.draft.version});
  const status=s.app.textEvidence.status(f.actor,s.project.id);assert.deepEqual(status.pmcDocuments,[{documentVersionId:f.document.id,title:f.document.title,reportedVersion:'PMC12345.1'}]);
  const first=search(s,f),hit=first.hits[0];assert.ok(first.hits.length<=10);assert.ok(first.hits.every(h=>h.quote.length<=1200));
  assert.equal(hit.providerText.documentDigest,digest(f.document));assert.equal(hit.providerText.rawDigest,f.document.original.digest);assert.equal(hit.page,null);assert.equal(hit.document,null);
  assert.equal(hit.quote,pmcContent.slice(hit.locator.start,hit.locator.end));assert.equal(read(s,f,hit.evidenceId).quote,hit.quote);
  assert.equal(search(s,f).id,first.id);assert.equal(search(s,f,'same-request').id,first.id);
  const second=search(s,f,'second',{query:'absentword'});assert.equal(second.status,'no_lexical_match');
  for(const key of ['search','same-request','third'])assert.throws(()=>search(s,f,key),{code:'TEXT_GRANT_EXHAUSTED'});
  assert.equal(read(s,f,hit.evidenceId).quote,hit.quote);assert.equal(read(s,f,hit.evidenceId,'new-read').quote,hit.quote);
  for(const kind of ['connector-call','model-usage','run','sandbox-job'])assert.equal(s.app.store.list(kind).length,0);
  reopened=new ResearchApp(s.dir,process.cwd());const history=reopened.textCorpusGrants.inspect(USER,s.project.id,grant.id);assert.equal(history.usage.used,2);assert.equal(history.searchResults[0].id,first.id);reopened.close();reopened=null;
  op(s,USER,'text_corpus_grant_revoke',{grantId:grant.id,expectedVersion:grant.version});
  assert.throws(()=>search(s,f),{code:'TEXT_GRANT_REVOKED'});assert.throws(()=>read(s,f,hit.evidenceId),{code:'TEXT_GRANT_REVOKED'});
  s.app.textEvidence.configure(USER,s.project.id,{enabled:false,expectedVersion:f.config.version});
  assert.equal(op(s,USER,'evidence_read',{evidenceId:hit.evidenceId}).quote,hit.quote);
  reopened=new ResearchApp(s.dir,process.cwd());assert.equal(reopened.textCorpusGrants.inspect(USER,s.project.id,grant.id).searchResults[0].hits[0].quote,hit.quote);assert.equal(reopened.evidence.verify(s.project.id,hit.evidenceId,false).quote,hit.quote);
 }finally{globalThis.fetch=fetch;reopened?.close();s.close();}
});

test('PMC grant rejects non-owner preparation, mixed or extra documents, unrelated evidence and generic tools',()=>{const s=setup();try{
 const f=fixture(s);assert.throws(()=>s.app.textCorpusGrants.prepare({...USER,sessionId:s.session.id},s.project.id,f.prepare),{code:'PMC_OWNER_ONLY'});
 assert.throws(()=>s.app.textCorpusGrants.prepare(USER,s.project.id,{...f.prepare,pmcDocuments:[...f.prepare.pmcDocuments,{documentVersionId:f.other.id}]}),{code:'TEXT_SOURCE_REQUIRED'});
 activate(s,f);
 const owner=op(s,USER,'text_evidence_search',{...f.input,query:'control'},'owner-result'),generic=s.app.evidence.register(USER,s.project.id,f.document.derivedText.artifactId,0,10,'generic');
 assert.throws(()=>read(s,f,owner.hits[0].evidenceId),{code:'TEXT_GRANT_EVIDENCE_DENIED'});assert.throws(()=>read(s,f,generic.id),{code:'PMC_OWNER_ONLY'});
 assert.throws(()=>search(s,f,'outside',{pmcDocuments:[{documentVersionId:f.other.id}]}),{code:'TEXT_GRANT_SOURCE_DENIED'});
 assert.throws(()=>search(s,f,'pdf-mix',{documents:[{documentVersionId:'pdf',parseResultId:'parse'}]}),{code:'PERMISSION_DENIED'});
 assert.throws(()=>search(s,f,'raw-mix',{artifactIds:[f.document.derivedText.artifactId]}),{code:'TEXT_GRANT_SOURCE_DENIED'});
 for(const extra of [{},{taskId:'task'},{wakeupId:'wakeup'}]){
  const actor={...f.actor,...extra};
  if(Object.keys(extra).length)assert.throws(()=>s.app.textEvidence.search(actor,s.project.id,f.input),{code:'PERMISSION_DENIED'});
  for(const artifactId of [f.document.original.artifactId,f.document.derivedText.artifactId]){
   assert.throws(()=>s.app.evidence.read(actor,artifactId),{code:'PMC_OWNER_ONLY'});
   assert.throws(()=>s.app.evidence.register(actor,s.project.id,artifactId,0,5,'bypass'),{code:'PMC_OWNER_ONLY'});
  }
 }
 assert.throws(()=>s.app.textEvidence.search({...f.actor,projectId:'other'},s.project.id,f.input),{code:'SCOPE_DENIED'});
 const first=search(s,f),hit=first.hits[0];assert.equal(read(s,f,hit.evidenceId).quote,hit.quote);
 for(const extra of [{taskId:'task'},{wakeupId:'wakeup'}])assert.throws(()=>s.app.textCorpusGrants.authorizeContent({...f.actor,...extra},s.project.id,'evidence_read',{evidenceId:hit.evidenceId}),{code:'PMC_OWNER_ONLY'});
 const otherSession=s.app.sessions.create(USER,s.project.id,{title:'Other'}),row=s.app.store.update('session',otherSession.id,otherSession.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
 assert.throws(()=>op(s,{...f.actor,sessionId:row.id,generation:1},'evidence_read',{evidenceId:hit.evidenceId}),{code:'PMC_OWNER_ONLY'});
 assert.equal(s.app.store.list('text-corpus-grant-use').length,1);
}finally{s.close();}});

test('PMC cached search and evidence reject raw/text/document tampering and altered returned locators',()=>{
 for(const target of ['original','derivedText','document','evidence']){const s=setup();try{
  const f=fixture(s);activate(s,f);const hit=search(s,f).hits[0];read(s,f,hit.evidenceId);
  if(target==='document')s.app.store.update('document-version',f.document.id,f.document.version,{title:'changed'});
  else if(target==='evidence'){
   const e=s.app.store.get('evidence',hit.evidenceId),start=pmcContent.indexOf('The control');
   s.app.store.update('evidence',e.id,e.version,{locator:{start,end:pmcContent.length},quote:pmcContent.slice(start)});
  }else{const a=s.app.store.get('artifact',f.document[target].artifactId),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'corrupted bytes');}
  assert.throws(()=>read(s,f,hit.evidenceId));assert.throws(()=>read(s,f,hit.evidenceId,'new-read'));
  if(target!=='evidence'){assert.throws(()=>search(s,f));assert.throws(()=>search(s,f,'fresh',{query:'control'}));}
  assert.equal(s.app.store.list('text-corpus-grant-use').length,1);
 }finally{s.close();}}
});

test('PMC expiry, settings changes, source removal and model changes fence search and evidence receipts',()=>{
 for(const reason of ['expiry','disabled','configuration','removed','model']){const s=setup(),realNow=Date.now;try{
  const f=fixture(s);activate(s,f);const hit=search(s,f).hits[0];read(s,f,hit.evidenceId);
  const code=reason==='expiry'?'TEXT_GRANT_EXPIRED':reason==='disabled'?'TEXT_EVIDENCE_DISABLED':reason==='model'?'TEXT_GRANT_SCOPE_CHANGED':'TEXT_EVIDENCE_CONFIGURATION_CHANGED';
  if(reason==='expiry')Date.now=()=>Date.parse(f.draft.expiresAt)+1;
  if(reason==='disabled')s.app.textEvidence.configure(USER,s.project.id,{enabled:false,expectedVersion:f.config.version});
  if(reason==='configuration'){const c=s.app.store.get('text-evidence-settings',s.project.id);s.app.store.update('text-evidence-settings',c.id,c.version,{});}
  if(reason==='removed')s.app.textEvidence.configure(USER,s.project.id,{enabled:true,pmcDocuments:[{documentVersionId:f.other.id}],expectedVersion:f.config.version});
  if(reason==='model'){const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{model:{...session.model,model:'changed'}});}
  assert.throws(()=>search(s,f),{code});assert.throws(()=>read(s,f,hit.evidenceId),{code});
  assert.equal(s.app.textEvidence.status(f.actor,s.project.id).pmcDocuments,undefined);
  assert.equal(op(s,USER,'evidence_read',{evidenceId:hit.evidenceId}).quote,hit.quote);
 }finally{Date.now=realNow;s.close();}}
});

test('PMC receipt authorization is repeated under writer lock after concurrent revoke',()=>{
 for(const tool of ['text_evidence_search','evidence_read']){const s=setup();try{
  const f=fixture(s),grant=activate(s,f),hit=search(s,f).hits[0];read(s,f,hit.evidenceId);
  const service=tool==='text_evidence_search'?s.app.textEvidence:s.app.textCorpusGrants,method=tool==='text_evidence_search'?'authorizeSearch':'authorizeContent',original=service[method].bind(service);let once=true;
  service[method]=(...args)=>{const result=original(...args);if(once){once=false;s.app.textCorpusGrants.revoke(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});}return result;};
  assert.throws(()=>tool==='text_evidence_search'?search(s,f):read(s,f,hit.evidenceId),{code:'TEXT_GRANT_REVOKED'});
 }finally{s.close();}}
});

test('PMC failed registration rolls back count, evidence, search and tool receipt',()=>{const s=setup();try{
 const f=fixture(s);activate(s,f);const original=s.app.evidence.registerGrantedProviderText.bind(s.app.evidence);
 s.app.evidence.registerGrantedProviderText=(...args)=>{original(...args);throw Error('injected after PMC evidence write');};
 assert.throws(()=>search(s,f),/injected after PMC evidence write/);
 for(const kind of ['text-corpus-grant-use','text-evidence-search','text-chunk-link','evidence'])assert.equal(s.app.store.list(kind).length,0);
 assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM operations WHERE scope=? AND key=?').get('agent:'+f.actor.sessionId,'search').n,0);
 s.app.evidence.registerGrantedProviderText=original;assert.ok(search(s,f).hits.length);
}finally{s.close();}});

test('two PMC controllers share one final search slot and cannot replay after exhaustion',async()=>{const s=setup();try{
 const f=fixture(s,1);activate(s,f);const buffer=new SharedArrayBuffer(4);let ready=0;
 const workers=[0,1].map(i=>new Worker(`const {parentPort,workerData:d}=require('node:worker_threads');(async()=>{const {ResearchApp}=await import(d.module);const app=new ResearchApp(d.dir,d.repo);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(d.buffer),0,0);try{const result=app.operations.execute(d.actor,'text_evidence_search',{...d.input,query:'adsorption '+d.i},{projectId:d.actor.projectId,idempotencyKey:'race-'+d.i});parentPort.postMessage({id:result.id});}catch(e){parentPort.postMessage({code:e.code??String(e)});}finally{app.close();}})().catch(e=>parentPort.postMessage({code:e.code??String(e)}));`,{eval:true,workerData:{module:new URL('../../dist/packages/research-app.js',import.meta.url).href,dir:s.dir,repo:process.cwd(),actor:f.actor,input:f.input,buffer,i}}));
 const exits=workers.map(w=>new Promise(r=>w.on('exit',r))),results=workers.map(w=>new Promise((resolve,reject)=>{w.on('message',m=>{if(m.ready){if(++ready===2){Atomics.store(new Int32Array(buffer),0,1);Atomics.notify(new Int32Array(buffer),0);}}else resolve(m);});w.on('error',reject);}));
 const done=await Promise.all(results);await Promise.all(exits);assert.equal(done.filter(r=>r.id).length,1);assert.deepEqual(done.filter(r=>r.code).map(r=>r.code),['TEXT_GRANT_EXHAUSTED']);
 assert.equal(s.app.store.list('text-corpus-grant-use').length,1);assert.equal(s.app.store.list('text-evidence-search').length,1);
 const result=s.app.store.list('text-evidence-search')[0];assert.equal(read(s,f,result.hits[0].evidenceId).quote,result.hits[0].quote);
 for(const i of [0,1])assert.throws(()=>search(s,f,'race-'+i,{query:'adsorption '+i}),{code:'TEXT_GRANT_EXHAUSTED'});
}finally{s.close();}});


test('retired PMC grant preserves old evidence reads while refusing new provider-text evidence',()=>{const s=setup();try{
 const f=fixture(s),grant=activate(s,f),found=search(s,f,'retired-pmc-original'),hit=found.hits[0],before={grant:s.app.store.get('text-corpus-grant',grant.id),approval:s.app.store.get('approval',grant.approvalId),uses:s.app.store.list('text-corpus-grant-use'),evidence:s.app.store.list('evidence')};let current=s.app.sessions.get(USER,s.session.id);current=s.app.store.update('session',current.id,current.version,{state:'idle',leaseUntil:0});const a=s.app.sessions.archive(USER,current.id,current.version);s.app.sessions.unarchive(USER,current.id,a.version);current=s.app.sessions.get(USER,s.session.id);const live=s.app.store.update('session',current.id,current.version,{state:'running',generation:current.generation+1,leaseUntil:Date.now()+30000});f.actor={...f.actor,generation:live.generation};
 assert.equal(read(s,f,hit.evidenceId,'retired-pmc-history').id,hit.evidenceId);assert.throws(()=>s.app.evidence.registerGrantedProviderText(f.actor,s.project.id,hit.providerText,hit.locator.start,hit.locator.end,'new evidence',{id:grant.id,digest:grant.digest,approvalId:grant.approvalId}),{code:'GRANT_RETIRED'});assert.throws(()=>search(s,f,'retired-pmc-new'),{code:'GRANT_RETIRED'});assert.deepEqual({grant:s.app.store.get('text-corpus-grant',grant.id),approval:s.app.store.get('approval',grant.approvalId),uses:s.app.store.list('text-corpus-grant-use'),evidence:s.app.store.list('evidence')},before);
}finally{s.close();}});
