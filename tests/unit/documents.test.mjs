import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,chmodSync} from 'node:fs';
import {setup,USER} from '../support/research.mjs';
import {DocumentService} from '../../dist/packages/documents/service.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {pdfTarget} from '../../dist/packages/connectors/providers.js';
import {digest} from '../../dist/packages/storage/store.js';
function fixture(fetcher=async()=>{throw Error('unexpected network');},credentials=()=>({})){
 const s=setup();const c=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher,minIntervalMs:0}),credentials});
 c.configure(USER,s.project.id,{expectedVersion:0,enabled:{alphaxiv:true,biorxiv:true,openalex:true,pubmed:true},requestLimit:25});
 return {...s,c,d:new DocumentService(s.app.context,s.app.evidence,c)};
}
const pdf=Buffer.from('%PDF-1.7\nfixture only, parser should reject this incomplete PDF\n');
test('document upload retains exact bytes, immutable versions, bounded list and idempotency',()=>{const s=fixture();try{
 const input={title:'fixture',mediaType:'application/pdf',contentBase64:pdf.toString('base64')};
 const d=s.d.import(USER,s.project.id,input,'one');assert.equal(s.d.import(USER,s.project.id,input,'one').id,d.id);
 assert.equal(d.original.digest,digest(pdf));assert.deepEqual(s.app.evidence.read(USER,d.original.artifactId).bytes,pdf);
 const second=s.d.import(USER,s.project.id,{...input,contentBase64:Buffer.from('%PDF-1.7\nsecond').toString('base64')},'two');assert.notEqual(second.id,d.id);
 const page=s.d.list(USER,s.project.id,{limit:1});assert.equal(page.hasMore,true);assert.equal(s.d.list(USER,s.project.id,{cursor:page.cursor}).items[0].id,second.id);
 assert.equal(s.d.inspect(USER,s.project.id,d.id).original.digest,d.original.digest);
 assert.throws(()=>s.d.import({type:'agent'},s.project.id,input,'agent'));
 const p=s.app.projects.create(USER,{name:'other'});assert.throws(()=>s.d.get(USER,p.id,d.id));
 for(const contentBase64 of ['bad','@@@=',Buffer.from('<html/>').toString('base64')])assert.throws(()=>s.d.import(USER,s.project.id,{...input,contentBase64},contentBase64));
 const artifactPath=s.app.store.get('artifact',d.original.artifactId).path;chmodSync(artifactPath,0o600);writeFileSync(artifactPath,'corrupted');assert.throws(()=>s.d.inspect(USER,s.project.id,d.id),{code:'ARTIFACT_CORRUPTED'});
}finally{s.close();}});
test('provider raw response preserves UTF8 BOM; provider text is not a PDF or verified version',async()=>{let calls=0;const body=Buffer.from('\ufeff# Source paper\n中文');const s=fixture(async()=>{calls++;return new Response(body,{headers:{'Content-Type':'text/markdown'}});});try{
 const d=await s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',format:'provider-text'},'text');
 assert.equal(d.contentKind,'provider-text');assert.equal(d.source.requestedVersion,'1');assert.equal(d.source.versionAssurance,'requested-address-unverified');assert.deepEqual(s.app.evidence.read(USER,d.original.artifactId).bytes,body);
 assert.equal((await s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',format:'provider-text'},'text')).id,d.id);assert.equal(calls,1);
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',requestedVersion:'2',format:'provider-text'},'wrong'),{code:'PAPER_VERSION_MISMATCH'});
}finally{s.close();}});
test('PDF acquisition requires fixed official routes and no silent abstract or latest fallback',async()=>{let calls=0;const s=fixture(async(url,options)=>{calls++;assert.equal(String(url),'https://arxiv.org/pdf/1706.03762v1');assert.equal(options.redirect,'error');return new Response(pdf,{headers:{'Content-Type':'application/pdf'}});});try{
 const input={source:'alphaxiv',id:'1706.03762v1',format:'original-pdf'};
 const [a,b]=await Promise.all([s.d.acquire(USER,s.project.id,input,'pdf'),s.d.acquire(USER,s.project.id,input,'pdf')]);assert.equal(a.id,b.id);assert.equal(calls,1);assert.equal(a.contentKind,'original-pdf');assert.equal(a.source.reportedVersion,null);
 const ledger=s.app.store.list('connector-call',s.project.id);assert.equal(ledger[0].httpStatus,200);
 await assert.rejects(s.d.acquire(USER,s.project.id,{...input,id:'1706.03762'},'latest'),{code:'PAPER_VERSION_REQUIRED'});
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'pubmed',id:'123',format:'original-pdf'},'pubmed'),{code:'FULL_TEXT_UNAVAILABLE'});
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'openalex',id:'W123',format:'original-pdf'},'oa'),{code:'CONNECTOR_CREDENTIAL_REQUIRED'});
 assert.equal(calls,1);
 assert.equal(pdfTarget('biorxiv','10.1101/322859','2',{}).url.href,'https://www.biorxiv.org/content/10.1101/322859v2.full.pdf');
 assert.throws(()=>pdfTarget('alphaxiv','1706.03762v1','2',{}),{code:'PAPER_VERSION_MISMATCH'});
}finally{s.close();}});
test('PDF HTTP failure records status and sanitized retry-after without creating document; revocation blocks commit',async()=>{let s=fixture(async()=>new Response('limited',{status:429,headers:{'Retry-After':'120'}}));try{
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',format:'original-pdf'},'limited'),{code:'CONNECTOR_RATE_LIMITED'});
 const call=s.app.store.list('connector-call',s.project.id)[0];assert.equal(call.httpStatus,429);assert.equal(call.retryAfter,'120');assert.equal(s.d.list(USER,s.project.id).items.length,0);
}finally{s.close();}
 s=fixture(async()=>{const cfg=s.c.settings(USER,s.project.id);s.c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{alphaxiv:false}});return new Response(pdf);});try{
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',format:'original-pdf'},'revoked'),{code:'CONNECTOR_SETTINGS_CHANGED'});assert.equal(s.d.list(USER,s.project.id).items.length,0);assert.equal(s.app.store.list('artifact',s.project.id).length,0);
}finally{s.close();}});
test('bioRxiv abstract keeps provider version and license without declaring original PDF',async()=>{const s=fixture(async()=>Response.json({collection:[{doi:'10.1101/322859',version:'2',title:'Fixture',abstract:'Abstract only',license:'cc_by'}]}));try{
 const d=await s.d.acquire(USER,s.project.id,{source:'biorxiv',id:'10.1101/322859',format:'provider-text'},'bio');assert.equal(d.contentKind,'abstract');assert.ok(d.derivedText);assert.equal(JSON.parse(s.app.evidence.read(USER,d.original.artifactId).bytes.toString()).collection[0].abstract,'Abstract only');assert.equal(s.app.evidence.read(USER,d.derivedText.artifactId).bytes.toString(),'Abstract only');assert.equal(d.source.reportedVersion,'2');assert.deepEqual(d.license,{value:'cc_by',assurance:'provider-reported'});
}finally{s.close();}});
test('OpenAlex PDF credential is confined to request and never persisted',async()=>{const key='secret-fixture-openalex-key';const s=fixture(async url=>{assert.equal(new URL(url).searchParams.get('api_key'),key);return new Response(pdf);},()=>({openalexKey:key}));try{
 const d=await s.d.acquire(USER,s.project.id,{source:'openalex',id:'W123',format:'original-pdf'},'oa');assert.equal(d.source.sourceUrl,'https://content.openalex.org/works/W123.pdf');assert.doesNotMatch(JSON.stringify(s.app.store.list('paper-read'))+JSON.stringify(s.app.store.list('connector-call'))+JSON.stringify(d),new RegExp(key));
}finally{s.close();}});

test('document evidence verifies raw PDF, parse job, fixed page text and page image bindings',()=>{const s=fixture();try{
 const d=s.d.import(USER,s.project.id,{title:'PDF unit fixture',mediaType:'application/pdf',contentBase64:pdf.toString('base64')},'pdf');
 const text=s.app.evidence.put(s.project.id,'page1.txt',Buffer.from('A measured fixture statement.'),'text/plain','document:derived');
 const image=s.app.evidence.put(s.project.id,'page1.png',Buffer.from('unit PNG placeholder'),'image/png','document:derived');
 const paragraphs=[{index:0,start:0,end:29}];
 const output={formatVersion:1,profileId:'pdfium-text-pages-v1',rawDigest:d.original.digest,pageCount:1,quality:{readingOrder:'unverified',paragraphs:'heuristic',tables:'unknown',figures:'unknown',ocr:false,score:null},pages:[{pageNumber:1,textDigest:text.digest,imageDigest:image.digest,paragraphs,textStatus:'text-extracted'}]};
 const manifestArtifact=s.app.evidence.put(s.project.id,'manifest.json',Buffer.from(JSON.stringify(output)),'application/json','document:derived');
 const manifest={documentDigest:digest(d),rawDigest:d.original.digest,rawArtifactId:d.original.artifactId};
 const job=s.app.store.create('document-parse-job',s.project.id,{documentVersionId:d.id,manifest,manifestDigest:digest(manifest),state:'succeeded',integrity:'complete'});
 const result=s.app.store.create('document-parse-result',s.project.id,{documentVersionId:d.id,jobId:job.id,rawDigest:d.original.digest,manifestDigest:job.manifestDigest,pageCount:1,pages:[{pageNumber:1,textArtifactId:text.id,textArtifactDigest:text.digest,imageArtifactId:image.id,imageArtifactDigest:image.digest,paragraphs,textStatus:'text-extracted'}],manifestArtifactId:manifestArtifact.id,manifestArtifactDigest:manifestArtifact.digest});
 s.app.store.update('document-parse-job',job.id,job.version,{resultId:result.id});
 const e=s.app.evidence.registerDocument(USER,s.project.id,{documentVersionId:d.id,parseResultId:result.id,pageNumber:1,start:0,end:10,description:'unit provenance fixture, not a scientific result'});
 assert.equal(s.app.evidence.verify(s.project.id,e.id).document.rawDigest,d.original.digest);
 const claim=s.app.evidence.proposeClaim(USER,s.project.id,'Unit provenance claim only',[e.id]);s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');
 assert.throws(()=>s.app.reports.create(USER,s.project.id,{title:'Cannot omit PDF provenance',claimIds:[claim.id]}),{code:'REPORT_DOCUMENT_BINDING_PENDING'});
 const other=s.d.import(USER,s.project.id,{title:'other',mediaType:'application/pdf',contentBase64:Buffer.from('%PDF-other').toString('base64')},'other');
 assert.throws(()=>s.app.evidence.registerDocument(USER,s.project.id,{documentVersionId:other.id,parseResultId:result.id,pageNumber:1,start:0,end:10,description:'forged'}),{code:'EVIDENCE_INVALID'});
 const replacement=s.app.evidence.put(s.project.id,'forged-image.png',Buffer.from('different image'),'image/png','document:derived');
 s.app.store.update('document-parse-result',result.id,result.version,{pages:[{...result.pages[0],imageArtifactId:replacement.id,imageArtifactDigest:replacement.digest}]});
 assert.throws(()=>s.app.evidence.verify(s.project.id,e.id),{code:'EVIDENCE_INVALID'});
}finally{s.close();}});

test('artifact staging stays outside write transaction; document receipts hash compact metadata and replay without staging',()=>{const s=fixture();try{
 const original=s.app.evidence.prepareArtifact.bind(s.app.evidence);let stages=0;
 s.app.evidence.prepareArtifact=(...args)=>{assert.equal(s.app.store.db.isTransaction,false);stages++;return original(...args);};
 const input={title:'stage fixture',mediaType:'application/pdf',contentBase64:pdf.toString('base64')};
 const d=s.d.import(USER,s.project.id,input,'stage');assert.equal(stages,1);assert.equal(s.d.import(USER,s.project.id,input,'stage').id,d.id);assert.equal(stages,1);
 const receipt=s.app.store.operationResult(`document-import:${s.project.id}`,'stage',{title:input.title,mediaType:input.mediaType,license:null,digest:digest(pdf)});assert.equal(receipt.found,true);
 const staged=s.app.evidence.prepareArtifact(s.project.id,'unpublished.txt',Buffer.from('not published'));assert.ok(staged.digest);assert.equal(s.app.store.list('artifact',s.project.id).length,1);
}finally{s.close();}});
test('connector stages original bytes before the publish transaction and rechecks source revocation after staging',async()=>{const s=fixture(async()=>new Response(pdf,{headers:{'Content-Type':'application/pdf'}}));try{
 const original=s.app.evidence.prepareArtifact.bind(s.app.evidence);s.app.evidence.prepareArtifact=(...args)=>{assert.equal(s.app.store.db.isTransaction,false);const prepared=original(...args);const cfg=s.c.settings(USER,s.project.id);s.c.configure(USER,s.project.id,{expectedVersion:cfg.version,enabled:{alphaxiv:false}});return prepared;};
 await assert.rejects(s.d.acquire(USER,s.project.id,{source:'alphaxiv',id:'1706.03762v1',format:'original-pdf'},'staged-revoked'),{code:'CONNECTOR_SETTINGS_CHANGED'});
 assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(s.app.store.list('paper-read',s.project.id).length,0);assert.equal(s.d.list(USER,s.project.id).items.length,0);
}finally{s.close();}});
