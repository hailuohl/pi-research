import test from 'node:test';
import assert from 'node:assert/strict';
import {Worker} from 'node:worker_threads';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {DocumentService} from '../../dist/packages/documents/service.js';
import {assertDiscoveryArtifact,assertDiscoveryDocument,normalizedDiscoveryOperation} from '../../dist/packages/policy/discovery-grant-validation.js';

const search={query:'bounded fixture',sources:['crossref'],limit:1};
const item={DOI:'10.1000/fixture',title:['Fixture metadata'],published:{'date-parts':[[2024,1,1]]}};
function network(s,fetcher=async url=>Response.json({message:url.pathname.includes('/works/')?item:{items:[item]}})){
 s.app.connectors=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher,minIntervalMs:0}),credentials:()=>({})});
 s.app.documents=new DocumentService(s.app.context,s.app.evidence,s.app.connectors);
}
function prepare(s,extra={}){return s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[search],targets:[],allowSearchResults:true,formats:['provider-text'],maxRequests:2,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString(),...extra});}
function activate(s,g=prepare(s)){approve(s.app,g.approvalId);return s.app.discoveryGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version});}
function agent(s){const r=s.app.store.get('session',s.session.id),session=s.app.store.update('session',r.id,r.version,{state:'running',generation:r.generation+1,leaseUntil:Date.now()+300000});return {type:'agent',role:'coordinator',projectId:s.project.id,sessionId:session.id,generation:session.generation};}
function revoke(s,g){const row=s.app.store.get('discovery-grant',g.id);return s.app.discoveryGrants.revoke(USER,s.project.id,{grantId:g.id,expectedVersion:row.version});}
function start(s,id){const r=s.app.store.get('literature-task',id);return s.app.store.update('literature-task',id,r.version,{state:'running',phase:'requesting',generation:r.generation+1,leaseUntil:Date.now()+30000,deadline:Date.now()+60000}).generation;}
const op=async(s,actor,name,input,key)=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,idempotencyKey:key});

test('fixed artifact pages retain Owner history but never turn revoked discovery into new evidence authority',async()=>{const s=setup();try{
 network(s);const g=activate(s),who=agent(s),found=await op(s,who,'literature_discover',search,'fixed-search'),paper=await op(s,who,'paper_read',{source:'crossref',id:found.items[0].id},'fixed-paper'),a=s.app.store.get('artifact',paper.artifactId);
 const prep={artifactId:a.id,sourceDigest:a.digest},p=await op(s,USER,'artifact_text_prepare',prep,'owner-prepare'),pageInput={...prep,textSourceId:p.textSourceId,readProtocol:'fixed-text-v1',cursor:0,limit:64},owner=await op(s,USER,'artifact_read',pageInput,'owner-page');await op(s,who,'artifact_text_prepare',prep,'agent-prepare');await op(s,who,'artifact_read',pageInput,'agent-page');
 const register={artifactId:a.id,readProtocol:'fixed-text-v1',readId:owner.artifactReadId,exactQuote:owner.content},e=await op(s,USER,'evidence_register',register,'before-revoke');revoke(s,g);
 assert.equal((await op(s,USER,'artifact_text_prepare',prep,'owner-prepare')).textSourceId,p.textSourceId);assert.equal((await op(s,USER,'artifact_read',pageInput,'owner-page')).content,owner.content);assert.equal((await op(s,USER,'evidence_read',{evidenceId:e.id},'history')).quote,e.quote);
 for(const key of ['before-revoke','after-revoke'])await assert.rejects(op(s,USER,'evidence_register',register,key),{code:'DISCOVERY_GRANT_REVOKED'});assert.throws(()=>s.app.evidence.verify(s.project.id,e.id),{code:'DISCOVERY_GRANT_REVOKED'});assert.throws(()=>s.app.evidence.proposeClaim(USER,s.project.id,'New assertion',[e.id]),{code:'DISCOVERY_GRANT_REVOKED'});
 await assert.rejects(op(s,who,'artifact_text_prepare',prep,'agent-prepare'),{code:'DISCOVERY_GRANT_REVOKED'});await assert.rejects(op(s,who,'artifact_read',pageInput,'agent-page'),{code:'DISCOVERY_GRANT_REVOKED'});await assert.rejects(op(s,who,'evidence_read',{evidenceId:e.id},'agent-history'),{code:'DISCOVERY_GRANT_REVOKED'});
}finally{s.close();}});

test('DiscoveryGrant freezes owner approval and disabled sources without creating network/model/compute work',()=>{const s=setup();try{
 const cfg=s.app.connectors.settings(USER,s.project.id),g=prepare(s);assert.equal(g.effectiveState,'draft');assert.throws(()=>s.app.discoveryGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version}),{code:'APPROVAL_REQUIRED'});
 activate(s,g);assert.equal(s.app.store.get('session',s.session.id).discoveryGrantId,g.id);assert.deepEqual(s.app.connectors.settings(USER,s.project.id),cfg);
 for(const kind of ['connector-call','model-usage','run','sandbox-job'])assert.equal(s.app.store.list(kind).length,0);
 assert.throws(()=>prepare(s),{code:'DISCOVERY_SESSION_REQUIRED'});assert.throws(()=>s.app.discoveryGrants.prepare({type:'agent'},s.project.id,{}),{code:'PERMISSION_DENIED'});
 s.app.connectors.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{openalex:false}});
 const other=s.app.sessions.create(USER,s.project.id,{title:'disabled source'});assert.throws(()=>prepare(s,{sessionId:other.id,searches:[{...search,sources:['openalex']}]}),{code:'SOURCE_DISABLED'});
}finally{s.close();}});

test('one approved search and its paper retain original references, replay safely, and survive natural expiry',async()=>{const s=setup();let calls=0;try{
 network(s,async url=>{calls++;return Response.json({message:url.pathname.includes('/works/')?item:{items:[item]}});});const g=activate(s),who=agent(s);
 const found=await op(s,who,'literature_discover',search,'search');assert.equal(found.discoveryGrant.id,g.id);const paper=await op(s,who,'paper_read',{source:'crossref',id:found.items[0].id},'paper');
 assert.equal(paper.contentKind,'metadata');assert.equal(paper.fullTextRead,false);assert.equal((await op(s,who,'paper_read',{source:'crossref',id:found.items[0].id},'paper')).id,paper.id);assert.equal(calls,2);
 const doc=s.app.documents.createFromPaper(USER,s.project.id,paper.id,'document');assert.equal(doc.discoveryGrant.id,g.id);
 const evidence=s.app.evidence.register(USER,s.project.id,paper.artifactId,0,5,'metadata quote'),claim=s.app.evidence.proposeClaim(USER,s.project.id,'Metadata only',[evidence.id]);s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');
 const artifact=s.app.reports.create(USER,s.project.id,{title:'Fixture bounded source',runIds:[],claimIds:[claim.id]}),report=s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id);
 assert.equal(s.app.reports.inspect(USER,s.project.id,report.id).validity,'current');
 const realNow=Date.now;try{Date.now=()=>Date.parse(g.expiresAt)+1;assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).effectiveState,'expired');assertDiscoveryArtifact(s.app.store,s.project.id,s.app.store.get('artifact',paper.artifactId));assert.equal(s.app.reports.inspect(USER,s.project.id,report.id).validity,'current');await assert.rejects(op(s,who,'literature_discover',search,'expired'),{code:'DISCOVERY_GRANT_EXPIRED'});}finally{Date.now=realNow;}
 revoke(s,g);assert.equal(s.app.evidence.read(USER,paper.artifactId).artifact.id,paper.artifactId);assert.equal((await op(s,USER,'evidence_read',{evidenceId:evidence.id})).id,evidence.id);assert.equal(s.app.documents.inspect(USER,s.project.id,doc.id).id,doc.id);
 assert.throws(()=>s.app.evidence.register(USER,s.project.id,paper.artifactId,0,5,'new quote'),{code:'DISCOVERY_GRANT_REVOKED'});assert.throws(()=>s.app.evidence.proposeClaim(USER,s.project.id,'new claim',[evidence.id]),{code:'DISCOVERY_GRANT_REVOKED'});assert.throws(()=>s.app.documents.createFromPaper(USER,s.project.id,paper.id,'new-document'),{code:'DISCOVERY_GRANT_REVOKED'});
 const oldReport=s.app.reports.inspect(USER,s.project.id,report.id);assert.equal(oldReport.integrity,'verified');assert.equal(oldReport.validity,'stale');assert.ok(oldReport.reasons.includes('DISCOVERY_GRANT_REVOKED'));assert.ok(s.app.reports.readReference(USER,s.project.id,report.id,oldReport.references[0].id));
 const reopened=new ResearchApp(s.dir,process.cwd());try{const restored=reopened.discoveryGrants.inspect(USER,s.project.id,g.id);assert.equal(restored.usage.used,2);assert.equal(restored.searchResults[0].id,found.id);assert.equal(restored.papers[0].id,paper.id);assert.equal(restored.effectiveState,'revoked');}finally{reopened.close();}
}finally{s.close();}});

test('bound session cannot omit scope or bypass through legacy Crossref; independent owner remains compatible',async()=>{const s=setup();let calls=0;try{
 network(s,async()=>{calls++;return Response.json({message:{items:[item]}});});activate(s);const who=agent(s);
 await assert.rejects(op(s,who,'literature_discover',{...search,query:'outside'},'outside'),{code:'DISCOVERY_REQUEST_DENIED'});
 await assert.rejects(op(s,who,'literature_search',{query:'outside',limit:1},'old-api'),{code:'DISCOVERY_REQUEST_DENIED'});
 await assert.rejects(op(s,who,'paper_read',{source:'crossref',id:item.DOI},'unseen'),{code:'DISCOVERY_TARGET_DENIED'});
 await assert.rejects(s.app.connectors.paper(who,s.project.id,{id:item.DOI},'omitted'),{code:'DISCOVERY_TARGET_DENIED'});assert.equal(calls,0);
 await s.app.connectors.discover(USER,s.project.id,{...search,query:'owner independent'},'owner');assert.equal(calls,1);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,s.app.store.get('session',s.session.id).discoveryGrantId).usage.used,0);
}finally{s.close();}});

test('failed or unknown HTTP attempts permanently count and cannot be resent with the same service key',async()=>{const s=setup();let calls=0;try{
 network(s,async()=>{calls++;return new Response('unavailable',{status:503});});const g=activate(s),who=agent(s);
 await assert.rejects(s.app.connectors.discover(who,s.project.id,search,'unknown'),{code:'CONNECTOR_ALL_FAILED'});assert.equal(calls,1);
 const second=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher:async()=>{calls++;return Response.json({message:{items:[item]}});}})});
 await assert.rejects(second.discover(who,s.project.id,search,'unknown'),{code:'CONNECTOR_ALL_FAILED'});assert.equal(calls,1);await second.discover(who,s.project.id,search,'explicit-retry');assert.equal(calls,2);
 await assert.rejects(second.discover(who,s.project.id,search,'over-quota'),{code:'CONNECTOR_ALL_FAILED'});assert.equal(calls,2);const inspected=s.app.discoveryGrants.inspect(USER,s.project.id,g.id);assert.equal(inspected.effectiveState,'exhausted');assert.equal(inspected.calls[0].status,'failed-or-unknown');
}finally{s.close();}});

test('revocation and settings changes fence in-flight response publication; size limit counts its failed attempt',async()=>{for(const action of ['revoke','settings','size']){const s=setup();let calls=0;try{
 const g=activate(s,prepare(s,{maxResponseBytes:1024})),who=agent(s);network(s,async()=>{calls++;if(action==='revoke')revoke(s,g);if(action==='settings')s.app.connectors.configure(USER,s.project.id,{expectedVersion:0,requestLimit:200});return action==='size'?new Response('x'.repeat(2048)):Response.json({message:{items:[item]}});});
 await assert.rejects(s.app.connectors.discover(who,s.project.id,search,'inflight'));assert.equal(calls,1);assert.equal(s.app.store.list('connector-search',s.project.id).length,0);assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).usage.used,1);
}finally{s.close();}}});

test('every provider step counts, including PubMed search plus fetch, and one request cannot stand for both',async()=>{for(const limit of [1,2]){const s=setup();let calls=0;try{
 s.app.connectors.configure(USER,s.project.id,{expectedVersion:0,enabled:{pubmed:true}});const q={...search,sources:['pubmed']};const g=activate(s,prepare(s,{searches:[q],maxRequests:limit})),who=agent(s);
 network(s,async url=>{calls++;return url.pathname.includes('esearch')?Response.json({esearchresult:{idlist:['123']}}):new Response('<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>123</PMID><Article><ArticleTitle>Fixture</ArticleTitle></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>');});
 if(limit===1)await assert.rejects(s.app.connectors.discover(who,s.project.id,q,'two-steps'),{code:'CONNECTOR_ALL_FAILED'});else assert.equal((await s.app.connectors.discover(who,s.project.id,q,'two-steps')).items.length,1);
 assert.equal(calls,limit);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).usage.used,limit);
}finally{s.close();}}});

test('background owner tasks preserve original authority and recover a completed grant-scoped receipt without re-fetching',async()=>{const s=setup();let calls=0;try{
 network(s,async url=>{calls++;return Response.json({message:url.pathname.includes('/works/')?item:{items:[item]}});});const g=activate(s),task=await op(s,USER,'literature_task_create',{kind:'search',search,discoveryGrantId:g.id},'task');const gen=start(s,task.id);
 await s.app.literatureTasks.execute(task.id,gen);const done=s.app.literatureTasks.inspect(USER,s.project.id,task.id);assert.equal(done.state,'succeeded');assert.equal(done.discoveryGrant.id,g.id);assert.equal(done.searchResult.scopeSessionId,s.session.id);
 const retrieve=s.app.literatureTasks.create(USER,s.project.id,{kind:'retrieve',target:{source:'crossref',id:item.DOI,format:'provider-text'},discoveryGrantId:g.id});start(s,retrieve.id);
 const d=await s.app.documents.acquire(s.app.discoveryGrants.owner(USER,s.project.id,g.id),s.project.id,retrieve.request.target,`literature-task:${retrieve.id}`);const active=s.app.store.get('literature-task',retrieve.id);s.app.store.update('literature-task',active.id,active.version,{leaseUntil:0});s.app.literatureTasks.tick();
 assert.equal(s.app.literatureTasks.inspect(USER,s.project.id,retrieve.id).documentVersionId,d.id);assert.equal(calls,2);revoke(s,g);assert.equal(s.app.documents.inspect(USER,s.project.id,d.id).id,d.id);
 assert.throws(()=>s.app.literatureTasks.create(USER,s.project.id,{kind:'search',search,discoveryGrantId:g.id}),{code:'DISCOVERY_GRANT_REVOKED'});
}finally{s.close();}});

test('two controllers compete atomically for the last request slot',async()=>{const s=setup();try{
 const g=activate(s,prepare(s,{maxRequests:1})),module=pathToFileURL(resolve('dist/packages/research-app.js')).href,validation=pathToFileURL(resolve('dist/packages/policy/discovery-grant-validation.js')).href,buffer=new SharedArrayBuffer(4);let ready=0;
 const workers=[0,1].map(i=>new Worker(`const {parentPort,workerData:d}=require('node:worker_threads');(async()=>{const {ResearchApp}=await import(d.module);const {discoveryContext,reserveConnectorCall}=await import(d.validation);const app=new ResearchApp(d.dir,d.repo);const ctx=discoveryContext(app.store,d.pid,{type:'user',sessionId:d.sid},{kind:'search',search:d.search},'request-'+d.i);parentPort.postMessage({ready:true});Atomics.wait(new Int32Array(d.buffer),0,0);try{const c=reserveConnectorCall(app.store,d.pid,'crossref',new URL('https://api.crossref.org/works'),ctx);parentPort.postMessage({id:c.id});}catch(e){parentPort.postMessage({code:e.code});}finally{app.close();}})().catch(e=>parentPort.postMessage({code:e.code??String(e)}));`,{eval:true,workerData:{module,validation,dir:s.dir,repo:process.cwd(),pid:s.project.id,sid:s.session.id,search,buffer,i}}));
 const exits=workers.map(w=>new Promise(r=>w.on('exit',r))),results=workers.map(w=>new Promise((resolve,reject)=>{w.on('message',m=>{if(m.ready){if(++ready===2){Atomics.store(new Int32Array(buffer),0,1);Atomics.notify(new Int32Array(buffer),0);}}else resolve(m);});w.on('error',reject);}));const done=await Promise.all(results);await Promise.all(exits);assert.equal(done.filter(r=>r.id).length,1);assert.deepEqual(done.filter(r=>r.code).map(r=>r.code),['DISCOVERY_GRANT_EXHAUSTED']);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).usage.used,1);
}finally{s.close();}});

test('expiry stops a reserved request still awaiting dispatch but preserves an already received response',async()=>{const s=setup();const realNow=Date.now;let calls=0;try{
 s.app.connectors.configure(USER,s.project.id,{expectedVersion:0,enabled:{pubmed:true}});const q={...search,sources:['pubmed']},g=activate(s,prepare(s,{searches:[q]}));
 const transport=new ConnectorTransport({minIntervalMs:80,fetcher:async()=>{calls++;setTimeout(()=>{Date.now=()=>Date.parse(g.expiresAt)+1;},5);return Response.json({esearchresult:{idlist:['123']}});}});
 const c=new ConnectorService(s.app.context,s.app.evidence,{transport,credentials:()=>({})});const who=s.app.discoveryGrants.owner(USER,s.project.id,g.id);
 await assert.rejects(c.discover(who,s.project.id,q,'late-dispatch'),{code:'CONNECTOR_ALL_FAILED'});assert.equal(calls,1);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).usage.used,2);
 Date.now=realNow;const other=s.app.sessions.create(USER,s.project.id,{title:'response after expiry'}),h=activate(s,prepare(s,{sessionId:other.id}));
 network(s,async()=>{Date.now=()=>Date.parse(h.expiresAt)+1;return Response.json({message:{items:[item]}});});const result=await s.app.connectors.discover(s.app.discoveryGrants.owner(USER,s.project.id,h.id),s.project.id,search,'sent-before-expiry');assert.equal(result.status,'complete');
}finally{Date.now=realNow;s.close();}});

test('PDF grants freeze canonical versions and never widen an explicit arXiv or bioRxiv target',async()=>{const s=setup();let calls=0;try{
 s.app.connectors.configure(USER,s.project.id,{expectedVersion:0,enabled:{alphaxiv:true,biorxiv:true}});const targets=[{source:'alphaxiv',id:'2401.01234',requestedVersion:'v2',format:'original-pdf'},{source:'biorxiv',id:'10.1101/123456',requestedVersion:'1',format:'original-pdf'}];
 assert.equal(normalizedDiscoveryOperation({kind:'retrieve',target:targets[0]}).target.id,'2401.01234v2');const g=activate(s,prepare(s,{searches:[],targets,allowSearchResults:false,formats:['original-pdf']}));network(s,async()=>{calls++;return new Response('%PDF-1.7\nfixture',{headers:{'Content-Type':'application/pdf'}});});
 const who=s.app.discoveryGrants.owner(USER,s.project.id,g.id);await assert.rejects(s.app.documents.acquire(who,s.project.id,{...targets[0],requestedVersion:'3'},'wrong'),{code:'DISCOVERY_TARGET_DENIED'});
 const d=await s.app.documents.acquire(who,s.project.id,targets[1],'pdf');assert.equal(d.source.requestedVersion,'1');assert.equal(d.discoveryGrant.id,g.id);assert.equal(calls,1);
}finally{s.close();}});


test('session retirement closes active and unbound draft discovery admissions without rewriting history',()=>{for(const activated of [false,true]){const s=setup();try{
 const prepared=prepare(s),g=activated?activate(s,prepared):prepared,grant=s.app.store.get('discovery-grant',g.id),approval=s.app.store.get('approval',g.approvalId),current=s.app.sessions.get(USER,s.session.id),archived=s.app.sessions.archive(USER,current.id,current.version);s.app.sessions.unarchive(USER,current.id,archived.version);
 assert.deepEqual(s.app.store.get('discovery-grant',g.id),grant);assert.deepEqual(s.app.store.get('approval',g.approvalId),approval);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,g.id).effectiveState,'stale');
 if(activated)assert.throws(()=>s.app.literatureTasks.create(USER,s.project.id,{kind:'search',search,discoveryGrantId:g.id}),{code:'GRANT_RETIRED'});else {approve(s.app,g.approvalId);assert.throws(()=>s.app.discoveryGrants.activate(USER,s.project.id,{grantId:g.id,expectedVersion:g.version}),{code:'GRANT_RETIRED'});}
 assert.equal(s.app.store.list('literature-task').length,0);assert.equal(s.app.store.list('connector-call').length,0);
}finally{s.close();}}});
test('discovery preflight and INSERT recheck reject deterministic retirement interleaving',()=>{const s=setup();try{
 const g=activate(s),transaction=s.app.store.transaction.bind(s.app.store);let entered=false;s.app.store.transaction=fn=>{if(!entered){entered=true;const current=s.app.sessions.get(USER,s.session.id),a=s.app.sessions.archive(USER,current.id,current.version);s.app.sessions.unarchive(USER,current.id,a.version);}return transaction(fn);};
 assert.throws(()=>s.app.literatureTasks.create(USER,s.project.id,{kind:'search',search,discoveryGrantId:g.id}),{code:'GRANT_RETIRED'});assert.equal(entered,true);assert.equal(s.app.store.list('literature-task').length,0);
}finally{s.close();}});


test('retired discovery grant retains historical document, artifact, approval and request proofs',async()=>{const s=setup();try{
 network(s);const g=activate(s),who=agent(s),found=await op(s,who,'literature_discover',search,'retirement-search'),paper=await op(s,who,'paper_read',{source:'crossref',id:found.items[0].id},'retirement-paper'),document=s.app.documents.createFromPaper(USER,s.project.id,paper.id,'retirement-document'),before={grant:s.app.store.get('discovery-grant',g.id),approval:s.app.store.get('approval',g.approvalId),calls:s.app.store.list('connector-call'),paper:s.app.store.get('paper-read',paper.id),document:s.app.store.get('document-version',document.id)};
 let current=s.app.sessions.get(USER,s.session.id);current=s.app.store.update('session',current.id,current.version,{state:'idle',leaseUntil:0});const a=s.app.sessions.archive(USER,current.id,current.version);s.app.sessions.unarchive(USER,current.id,a.version);
 assert.doesNotThrow(()=>assertDiscoveryArtifact(s.app.store,s.project.id,s.app.store.get('artifact',paper.artifactId)));assert.doesNotThrow(()=>assertDiscoveryDocument(s.app.store,s.project.id,s.app.store.get('document-version',document.id)));assert.deepEqual({grant:s.app.store.get('discovery-grant',g.id),approval:s.app.store.get('approval',g.approvalId),calls:s.app.store.list('connector-call'),paper:s.app.store.get('paper-read',paper.id),document:s.app.store.get('document-version',document.id)},before);
}finally{s.close();}});


test('retirement leaves independent branch admission intact and failed cleanup creates no markers',()=>{const s=setup();try{
 const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'assistant',mode:'prompt',status:'completed',content:'independent history'}),branch=s.app.sessions.branch(USER,s.session.id,m.id),rootGrant=prepare(s),branchGrant=activate(s,prepare(s,{sessionId:branch.id}));
 const current=s.app.sessions.get(USER,s.session.id);assert.throws(()=>s.app.sessions.archive(USER,current.id,current.version+1),{code:'VERSION_CONFLICT'});assert.equal(s.app.store.list('grant-retirement').length,0);const held=s.app.store.create('agent-admission',s.project.id,{sessionId:current.id,state:'reserved'});assert.throws(()=>s.app.sessions.archive(USER,current.id,current.version),{code:'SESSION_BUSY'});assert.equal(s.app.store.list('grant-retirement').length,0);s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run('agent-admission',held.id);
 const a=s.app.sessions.archive(USER,current.id,current.version);s.app.sessions.unarchive(USER,current.id,a.version);assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,rootGrant.id).effectiveState,'stale');assert.equal(s.app.discoveryGrants.inspect(USER,s.project.id,branchGrant.id).effectiveState,'active');assert.equal(s.app.literatureTasks.create(USER,s.project.id,{kind:'search',search,discoveryGrantId:branchGrant.id}).scopeSessionId,branch.id);
}finally{s.close();}});
