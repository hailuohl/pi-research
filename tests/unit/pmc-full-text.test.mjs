import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {DocumentService} from '../../dist/packages/documents/service.js';
import {digest} from '../../dist/packages/storage/store.js';
import {parsePmcFullText} from '../../dist/packages/connectors/pmc.js';
import {verifyPmcText} from '../../dist/packages/documents/pmc-text.js';
import {ResearchApp} from '../../dist/packages/research-app.js';

const PMID='34285670',PMCID='PMC8270360';
const mappingXml=(pmid=PMID,pmcids=[PMCID])=>`<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>${pmid}</PMID><Article><ArticleTitle>Fixture article</ArticleTitle><Abstract><AbstractText>Archived abstract.</AbstractText></Abstract></Article></MedlineCitation><PubmedData><ArticleIdList>${pmcids.map(id=>`<ArticleId IdType="pmc">${id}</ArticleId>`).join('')}</ArticleIdList></PubmedData></PubmedArticle></PubmedArticleSet>`;
const jatsXml=({pmid=PMID,pmcid=PMCID,version=`${PMCID}.1`,openAccess='yes',license='Creative Commons Attribution 4.0 International (CC BY 4.0).',body='<p>A linked &amp; readable paragraph.</p>',doctype='<!DOCTYPE pmc-articleset PUBLIC "-//NLM//DTD JATS Journal Archiving and Interchange DTD v1.3 20210610//EN" "JATS-archivearticle1-3.dtd">'}={})=>`${doctype}<pmc-articleset><article><front><article-meta><title-group><article-title>Fixture full text</article-title></title-group><article-id pub-id-type="pmid">${pmid}</article-id><article-id pub-id-type="pmcid">${pmcid}</article-id><article-id pub-id-type="pmcid-ver">${version}</article-id><custom-meta-group><custom-meta><meta-name>pmc-prop-open-access</meta-name><meta-value>${openAccess}</meta-value></custom-meta></custom-meta-group><permissions><license><license-p>${license}</license-p></license></permissions></article-meta></front><body><sec><title>Introduction</title>${body}</sec></body></article></pmc-articleset>`;
function connect(s,fetcher,requestLimit=20){
 const connectors=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher,minIntervalMs:0}),credentials:()=>({})});
 connectors.configure(USER,s.project.id,{expectedVersion:0,enabled:{pubmed:true},requestLimit});s.app.connectors=connectors;s.app.documents=new DocumentService(s.app.context,s.app.evidence,connectors);return connectors;
}
const createTask=(s,input,key)=>s.app.operations.execute(USER,'literature_task_create',input,{projectId:s.project.id,idempotencyKey:key});
function start(s,id){const row=s.app.store.get('literature-task',id);return s.app.store.update('literature-task',id,row.version,{state:'running',phase:'requesting',generation:row.generation+1,leaseUntil:Date.now()+30000,deadline:Date.now()+60000}).generation;}
function response(text,status=200){return new Response(text,{status,headers:{'Content-Type':'text/xml'}});}

test('owner OA task binds ordered source responses, reported version, license, text, and prior history',async()=>{
 const s=setup(),sent=[],tableBody='<p>A linked &amp; readable paragraph.</p><table-wrap><label>Table 1.</label><caption><title>Included databases</title></caption><table><thead><tr><th>Database</th><th>Coverage</th></tr></thead><tbody><tr><td>Embase</td><td><italic>Ovid</italic>, <p>Subscription-based</p>, Indexed database, Health, biomedicine, pharmacology</td></tr></tbody></table></table-wrap>';let calls=0;
 try{
  const c=connect(s,async raw=>{calls++;const url=new URL(raw);sent.push(url);if(url.pathname.endsWith('/esearch.fcgi'))return Response.json({esearchresult:{count:'1',retstart:'0',retmax:'1',idlist:[PMID]}});if(url.searchParams.get('db')==='pmc')return response(jatsXml({body:tableBody}));return response(mappingXml());});
  const search=await createTask(s,{kind:'search',search:{query:'fixed history',sources:['pubmed'],limit:1}},'prior-search');await s.app.literatureTasks.execute(search.id,start(s,search.id));const searchDone=s.app.literatureTasks.inspect(USER,s.project.id,search.id),abstract=await s.app.documents.acquire(USER,s.project.id,{source:'pubmed',id:PMID,format:'provider-text'},'prior-abstract');
  const input={kind:'retrieve',target:{source:'pubmed',id:PMID,format:'oa-full-text'}},before=calls,task=await createTask(s,input,'pmc-oa');assert.equal(task.state,'queued');assert.equal(calls,before);
  await s.app.literatureTasks.execute(task.id,start(s,task.id));const done=s.app.literatureTasks.inspect(USER,s.project.id,task.id),doc=s.app.documents.inspect(USER,s.project.id,done.documentVersionId),paper=s.app.store.list('paper-read',s.project.id).find(p=>p.contentKind==='full_text');
  assert.equal(done.state,'succeeded');assert.equal(calls,5);assert.deepEqual(sent.slice(3).map(url=>[url.searchParams.get('db'),url.searchParams.get('id'),url.searchParams.get('retmode')]),[['pubmed',PMID,'xml'],['pmc','8270360','xml']]);
  const docApi=await s.app.operations.execute(USER,'document_inspect',{documentVersionId:doc.id},{projectId:s.project.id});assert.equal(docApi.pageMapping,'unavailable');assert.equal(doc.contentKind,'provider-text');assert.equal(doc.original.mediaType,'application/xml');assert.equal(doc.source.requestedId,PMID);assert.equal(doc.source.resolvedId,'PMC8270360.1');assert.equal(doc.source.reportedVersion,'PMC8270360.1');assert.equal(doc.source.requestedVersion,null);assert.equal(doc.license.assurance,'provider-reported');assert.match(doc.license.value,/CC BY 4\.0/);assert.equal(doc.pageMapping,'unavailable');
  assert.equal(docApi.pmcTextProfile,'pmc-jats-text-v2');assert.equal(paper.pmcTextProfile,doc.pmcTextProfile);
  assert.deepEqual(doc.rawResponseArtifactIds,paper.rawArtifactIds);assert.equal(paper.rawArtifactIds.length,2);assert.equal(s.app.evidence.read(USER,paper.rawArtifactIds[0]).artifact.mediaType,'application/xml');assert.deepEqual(s.app.evidence.read(USER,paper.rawArtifactIds[0]).bytes,Buffer.from(jatsXml({body:tableBody})));assert.deepEqual(s.app.evidence.read(USER,paper.rawArtifactIds[1]).bytes,Buffer.from(mappingXml()));
  assert.equal(doc.derivedText.mediaType,'text/plain');const derivedText=s.app.evidence.read(USER,doc.derivedText.artifactId).bytes.toString();assert.match(derivedText,/Introduction\n\nA linked & readable paragraph\./);assert.match(derivedText,/Table 1\.\n\nIncluded databases\n\nDatabase\tCoverage\n\nEmbase\tOvid, Subscription-based, Indexed database, Health, biomedicine, pharmacology/);assert.equal(derivedText.match(/Subscription-based/g)?.length,1);assert.equal(paper.fullTextRead,true);assert.equal(paper.pageMapping,'unavailable');assert.equal(paper.scopeSessionId,null);assert.equal(paper.scopeTaskId,null);
  const callsUsed=s.app.connectors.settings(USER,s.project.id).requestsUsed,ledger=s.app.store.list('connector-call',s.project.id),operationScope=`connector-oa-full-text:${s.project.id}:user:root`,operationKey=`document:literature-task:${task.id}`;assert.equal(callsUsed,5);assert.equal(new Set(ledger.map(v=>v.id)).size,5);assert.deepEqual(ledger.slice(-2).map(v=>v.id),[digest({operationScope,key:operationKey,step:'pubmed-pmid-to-pmcid'}),digest({operationScope,key:operationKey,step:'pmc-pmcid-to-jats'})]);
  let cfg=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:false}});assert.equal(s.app.documents.inspect(USER,s.project.id,doc.id).id,doc.id);assert.equal(s.app.documents.inspect(USER,s.project.id,abstract.id).id,abstract.id);assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,search.id).searchResult.id,searchDone.searchResult.id);assert.equal(c.settings(USER,s.project.id).requestsUsed,callsUsed);cfg=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:true}});assert.equal(s.app.documents.inspect(USER,s.project.id,doc.id).id,doc.id);assert.equal(c.settings(USER,s.project.id).requestsUsed,callsUsed);
  const other=s.app.projects.create(USER,{name:'other project'});assert.throws(()=>s.app.documents.get(USER,other.id,doc.id));
 }finally{s.close();}
});

test('unmarked table-bearing PMC history remains byte-exact and its evidence and report stay current beside v2 acquisition and after reopen',async()=>{
 const s=setup(),pid=s.project.id,xml=jatsXml({body:'<p>Control adsorption paragraph.</p><table-wrap><label>Table 1.</label><caption><title>Databases</title></caption><table><tr><th>Database</th><th>Coverage</th></tr><tr><td>Embase</td><td>Ovid <p>Subscription-based</p></td></tr></table></table-wrap><p>Final control paragraph.</p>'});let reopened;
 // Frozen v1 bytes, deliberately independent of the current parser.
 const legacy='Introduction\n\nControl adsorption paragraph.\n\nTable 1.\n\nDatabases\n\nSubscription-based\n\nFinal control paragraph.';
 try{
  const raw=s.app.evidence.put(pid,'legacy.xml',Buffer.from(xml),'application/xml','connector:pubmed:raw'),text=s.app.evidence.put(pid,'legacy.txt',Buffer.from(legacy),'text/plain','connector:pubmed:provider-text');
  const paper=s.app.store.create('paper-read',pid,{source:'pubmed',idInSource:PMCID,requestedId:PMID,resolvedId:`${PMCID}.1`,reportedVersion:`${PMCID}.1`,versionAssurance:'provider-record',title:'Legacy table fixture',contentKind:'full_text',license:'Creative Commons Attribution 4.0 International (CC BY 4.0).',pageMapping:'unavailable',rawArtifactIds:[raw.id],artifactId:text.id,artifactDigest:text.digest,retrievedAt:new Date().toISOString(),scopeSessionId:null,scopeTaskId:null});
  const old=s.app.documents.get(USER,pid,s.app.documents.createFromPaper(USER,pid,paper.id,'legacy-document').id);assert.equal(Object.hasOwn(old,'pmcTextProfile'),false);
  let corpus=s.app.textEvidence.configure(USER,pid,{enabled:true,pmcDocuments:[{documentVersionId:old.id}],expectedVersion:0});
  const search=s.app.textEvidence.search(USER,pid,{query:'adsorption',pmcDocuments:[{documentVersionId:old.id}],corpusId:corpus.corpusId,configurationVersion:corpus.version},'legacy-search'),evidence=s.app.evidence.verify(pid,search.hits[0].evidenceId);
  const proposed=s.app.evidence.proposeClaim(USER,pid,'Synthetic historical claim',[evidence.id]),claim=s.app.evidence.decideClaim(USER,proposed.id,proposed.version,'accepted');
  const reportArtifact=s.app.reports.create(USER,pid,{title:'Historical table report',claimIds:[claim.id]}),report=s.app.store.list('report',pid).find(r=>r.artifactId===reportArtifact.id),reportBytes=s.app.evidence.read(USER,reportArtifact.id).bytes;
  const c=connect(s,async url=>response(new URL(url).searchParams.get('db')==='pmc'?xml:mappingXml()));
  const next=await s.app.documents.acquire(USER,pid,{source:'pubmed',id:PMID,format:'oa-full-text'},'new-v2');
  assert.notEqual(next.id,old.id);assert.equal(next.pmcTextProfile,'pmc-jats-text-v2');assert.equal(next.original.digest,old.original.digest);assert.notEqual(next.derivedText.digest,old.derivedText.digest);
  assert.equal(verifyPmcText(s.app.context,pid,old.id).content,legacy);assert.match(verifyPmcText(s.app.context,pid,next.id).content,/Database\tCoverage\n\nEmbase\tOvid Subscription-based/);
  corpus=s.app.textEvidence.configure(USER,pid,{enabled:true,pmcDocuments:[{documentVersionId:old.id},{documentVersionId:next.id}],expectedVersion:corpus.version});
  const newSearch=s.app.textEvidence.search(USER,pid,{query:'Embase',pmcDocuments:[{documentVersionId:old.id},{documentVersionId:next.id}],corpusId:corpus.corpusId,configurationVersion:corpus.version},'v2-table-search');
  assert.ok(newSearch.hits.length);assert.ok(newSearch.hits.every(h=>h.providerText.documentVersionId===next.id));
  c.configure(USER,pid,{enabled:{pubmed:false},expectedVersion:c.settings(USER,pid).version});s.app.textEvidence.configure(USER,pid,{enabled:false,expectedVersion:corpus.version});
  reopened=new ResearchApp(s.dir,process.cwd());
  for(const app of [s.app,reopened]){
   assert.deepEqual(app.store.get('document-version',old.id,pid),old);assert.deepEqual(app.store.get('paper-read',paper.id,pid),paper);assert.deepEqual(app.store.get('report',report.id,pid),report);
   assert.deepEqual(app.evidence.read(USER,old.original.artifactId).bytes,Buffer.from(xml));assert.deepEqual(app.evidence.read(USER,old.derivedText.artifactId).bytes,Buffer.from(legacy));assert.deepEqual(app.evidence.read(USER,reportArtifact.id).bytes,reportBytes);
   assert.deepEqual(app.evidence.verify(pid,evidence.id),evidence);const inspected=app.reports.inspect(USER,pid,report.id);assert.equal(inspected.integrity,'verified');assert.equal(inspected.validity,'current');
   assert.equal(verifyPmcText(app.context,pid,next.id).document.pmcTextProfile,'pmc-jats-text-v2');
  }
  for(const profile of ['pmc-jats-text-v99','',null]){
   const current=s.app.store.get('document-version',next.id,pid);s.app.store.update('document-version',next.id,current.version,{pmcTextProfile:profile});
   assert.throws(()=>verifyPmcText(s.app.context,pid,next.id),{code:'PMC_SOURCE_INVALID'});
   const changed=s.app.store.update('paper-read',paper.id,s.app.store.get('paper-read',paper.id,pid).version,{pmcTextProfile:profile});
   assert.throws(()=>s.app.documents.createFromPaper(USER,pid,changed.id,`bad-${profile}`),{code:'INVALID_INPUT'});
  }
 }finally{reopened?.close();s.close();}
});

test('PMC v1 keeps legacy fallback and nested paragraph bytes; unknown derivation profiles never fall back',()=>{
 const xml=jatsXml({body:'<table><tr><td>plain</td><td><p>Nested paragraph.</p></td></tr></table>'});
 for(const profile of [undefined,'pmc-jats-text-v1'])assert.equal(parsePmcFullText(xml,PMID,PMCID,profile).content,'Introduction\n\nNested paragraph.');
 const onlyTable=xml.replace('<title>Introduction</title>','').replace('<p>Nested paragraph.</p>','cell');
 assert.equal(parsePmcFullText(onlyTable,PMID,PMCID).content,'plaincell');
 assert.equal(parsePmcFullText(onlyTable,PMID,PMCID,'pmc-jats-text-v2').content,'plain\tcell');
 for(const profile of ['unknown','',null])assert.throws(()=>parsePmcFullText(xml,PMID,PMCID,profile),{code:'PMC_SOURCE_INVALID'});
});

test('OA import rejects mismatched, non-open, malformed, entity-bearing, and oversized responses without publication',async()=>{
 const bad=[
  {name:'wrong PMID mapping',mapping:mappingXml('999'),count:1,code:'PROVIDER_IDENTITY_MISMATCH'},
  {name:'ambiguous PMCID mapping',mapping:mappingXml(PMID,[PMCID,PMCID]),count:1,code:'PROVIDER_SCHEMA_INVALID'},
  {name:'multiple mapping articles',mapping:`${mappingXml('999').replace('</PubmedArticleSet>','')}${mappingXml().replace('<PubmedArticleSet>','').replace('</PubmedArticleSet>','')}</PubmedArticleSet>`,count:1,code:'PROVIDER_SCHEMA_INVALID'},
  {name:'non OA',jats:jatsXml({openAccess:'no'}),count:2,code:'FULL_TEXT_NOT_OPEN_ACCESS'},
  {name:'wrong JATS PMID',jats:jatsXml({pmid:'999'}),count:2,code:'PROVIDER_IDENTITY_MISMATCH'},
  {name:'wrong JATS PMCID',jats:jatsXml({pmcid:'PMC123456'}),count:2,code:'PROVIDER_IDENTITY_MISMATCH'},
  {name:'invalid version',jats:jatsXml({version:'PMC8270360'}),count:2,code:'PROVIDER_SCHEMA_INVALID'},
  {name:'missing license',jats:jatsXml({license:''}),count:2,code:'PROVIDER_SCHEMA_INVALID'},
  {name:'unknown entity',jats:jatsXml({body:'<p>&unknown;</p>',doctype:''}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'internal DTD',jats:jatsXml({body:'<p>&x;</p>',doctype:'<!DOCTYPE pmc-articleset [<!ENTITY x "unsafe">]>'}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'DOCTYPE inside root',jats:jatsXml({body:'<p>text</p><!DOCTYPE pmc-articleset SYSTEM "nested.dtd">',doctype:''}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'raw less-than in attribute',jats:jatsXml({body:'<p data-value="bad<node">text</p>'}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'invalid control character',jats:jatsXml({body:'<p>bad\u0001text</p>',doctype:''}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'malformed XML',jats:jatsXml({body:'<p>unclosed</body>'}),count:2,code:'PROVIDER_XML_INVALID'},
  {name:'oversized PMC response',oversized:true,count:2,code:'CONNECTOR_RESPONSE_TOO_LARGE'}
 ];
 for(const [i,item]of bad.entries()){
  const s=setup();let calls=0;
  try{
   connect(s,async raw=>{calls++;const url=new URL(raw);if(url.searchParams.get('db')==='pmc')return item.oversized?response('x'.repeat(2*1024*1024+1)):response(item.jats??jatsXml());return response(item.mapping??mappingXml());});
   await assert.rejects(s.app.documents.acquire(USER,s.project.id,{source:'pubmed',id:PMID,format:'oa-full-text'},`bad-${i}`),{code:item.code},item.name);
   assert.equal(calls,item.count,item.name);assert.equal(s.app.store.list('connector-call',s.project.id).length,item.count,item.name);assert.equal(s.app.store.list('paper-read',s.project.id).length,0,item.name);assert.equal(s.app.store.list('document-version',s.project.id).length,0,item.name);assert.equal(s.app.store.list('artifact',s.project.id).length,0,item.name);
  }finally{s.close();}
 }
});

test('OA preflight, disabled source, bound owner, and old provider-text grant cannot expand authority',async()=>{
 const s=setup();let calls=0;try{
  const c=connect(s,async()=>{calls++;return response(mappingXml());},1);
  await assert.rejects(s.app.documents.acquire(USER,s.project.id,{source:'pubmed',id:PMID,format:'oa-full-text'},'no-budget'),{code:'CONNECTOR_BUDGET_EXCEEDED'});assert.equal(calls,0);assert.equal(c.settings(USER,s.project.id).requestsUsed,0);
  const target={kind:'retrieve',target:{source:'pubmed',id:PMID,format:'oa-full-text'}};assert.throws(()=>s.app.literatureTasks.create({...USER,sessionId:s.session.id},s.project.id,target),{code:'FULL_TEXT_OWNER_ONLY'});
  assert.throws(()=>s.app.literatureTasks.create(USER,s.project.id,{kind:'retrieve',target:{source:'crossref',id:'10.1234/fixture',format:'oa-full-text'}}),{code:'PAPER_SOURCE_MISMATCH'});
  const cfg=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:true},requestLimit:5});
  const grant=s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[],targets:[{source:'pubmed',id:PMID,format:'provider-text'}],allowSearchResults:false,formats:['provider-text'],maxRequests:2,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()});approve(s.app,grant.approvalId);s.app.discoveryGrants.activate(USER,s.project.id,{grantId:grant.id,expectedVersion:grant.version});
  assert.throws(()=>createTask(s,{...target,discoveryGrantId:grant.id},'old-grant'),{code:'FULL_TEXT_DISCOVERY_GRANT_UNSUPPORTED'});assert.equal(calls,0);
  const current=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:current.version,enabled:{pubmed:false}});assert.throws(()=>s.app.literatureTasks.create(USER,s.project.id,target),{code:'SOURCE_DISABLED'});assert.equal(calls,0);
 }finally{s.close();}
});

test('second EFetch failure stays counted, leaves no published rows, and does not auto-retry',async()=>{
 const s=setup();let calls=0;try{
  const c=connect(s,async raw=>{calls++;return calls===1?response(mappingXml()):new Response('unavailable',{status:503});});
  const task=await createTask(s,{kind:'retrieve',target:{source:'pubmed',id:PMID,format:'oa-full-text'}},'second-failure');await s.app.literatureTasks.execute(task.id,start(s,task.id));
  const failed=s.app.literatureTasks.inspect(USER,s.project.id,task.id),records=s.app.store.list('connector-call',s.project.id);assert.equal(failed.state,'failed');assert.equal(calls,2);assert.equal(records.length,2);assert.deepEqual(records.map(r=>r.status),['succeeded','failed-or-unknown']);assert.equal(c.settings(USER,s.project.id).requestsUsed,2);assert.equal(s.app.store.list('paper-read',s.project.id).length,0);assert.equal(s.app.store.list('document-version',s.project.id).length,0);assert.equal(s.app.store.list('artifact',s.project.id).length,0);let cfg=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:false}});assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,task.id).id,failed.id);cfg=c.settings(USER,s.project.id);c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{pubmed:true}});assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,task.id).state,'failed');assert.equal(calls,2);
 }finally{s.close();}
});
