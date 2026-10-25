import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,openSync,closeSync,writeSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {digest} from '../../dist/packages/storage/store.js';
import {actor as taskActor,spec,startTeam} from '../support/collaboration.mjs';
import {configureEnvironment} from '../../dist/packages/runtime/environment.js';
const protocol='fixed-text-v1';
const call=(s,name,input,key=name,actor=USER)=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,idempotencyKey:key});
const prepare=(s,a,key='prepare',actor=USER)=>call(s,'artifact_text_prepare',{artifactId:a.id,sourceDigest:a.digest},key,actor);
const read=(s,a,p,extra={},key='read',actor=USER)=>call(s,'artifact_read',{artifactId:a.id,readProtocol:protocol,sourceDigest:a.digest,textSourceId:p.textSourceId,...extra},key,actor);
const quote=(s,a,p,exactQuote,key='quote',actor=USER)=>call(s,'evidence_register',{artifactId:a.id,readProtocol:protocol,readId:p.artifactReadId,exactQuote},key,actor);
function running(s){let row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation:1};}
function delivery(s,actor,page,key){const host=new AgentHost(s.app),active={actor,sessionId:actor.sessionId,generation:actor.generation,ended:false},permission=s.app.sessionPermissions.capture(actor.sessionId),epoch=s.app.store.get('project',s.project.id).lifecycleEpoch,token=host.readResponse(active,actor,'artifact_read',key,page,permission,epoch),resultDigest=digest(JSON.stringify({content:[{type:'text',text:JSON.stringify(page)}],details:{}}));return {token,ack:(extra={})=>host.completeReadDelivery(active,'artifact_read',key,{readDelivery:token,resultDigest,...extra})};}

test('ordinary Chinese creation beyond 2MiB prepares, pages, quotes and reopens with full-source integrity',async()=>{
 const s=setup();try{const content='\ufeff中文🙂\r\n'+'数据'.repeat(400000)+'尾部唯一引文';
 const a=call(s,'artifact_create',{title:'Chinese.txt',content});assert.ok(a.size>2*1024*1024);
 const p=await prepare(s,a);assert.equal(p.status,'ready');assert.equal(p.utf16Length,content.length);
 const page=read(s,a,p,{cursor:a.size-Buffer.byteLength('尾部唯一引文'),limit:64});assert.equal(page.content,'尾部唯一引文');assert.equal(page.utf16Start,content.length-page.content.length);assert.equal(page.utf16End,content.length);
 const e=quote(s,a,page,page.content);assert.deepEqual(e.locator,{start:content.length-page.content.length,end:content.length});assert.equal(call(s,'evidence_read',{evidenceId:e.id}).quote,page.content);
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());assert.equal(call(s,'evidence_read',{evidenceId:e.id}).quote,page.content);
 const path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);const fd=openSync(path,'r+');writeSync(fd,Buffer.from('X'),0,1,100);closeSync(fd);
 assert.throws(()=>call(s,'evidence_read',{evidenceId:e.id}),{code:'ARTIFACT_CORRUPTED'});
 }finally{s.close();}
});
test('stored UTF8 byte policy rejects creation before CAS while JSON argument budget remains unchanged',()=>{
 const s=setup(),old=process.env.PI_RESEARCH_MAX_FILE_BYTES;try{process.env.PI_RESEARCH_MAX_FILE_BYTES='12';const files=()=>existsSync(join(s.dir,'artifacts'))?readdirSync(join(s.dir,'artifacts')):[],before=files();
 assert.throws(()=>call(s,'artifact_create',{title:'too big',content:'中'.repeat(5)}),{code:'ARTIFACT_TOO_LARGE'});assert.deepEqual(files(),before);
 }finally{if(old===undefined)delete process.env.PI_RESEARCH_MAX_FILE_BYTES;else process.env.PI_RESEARCH_MAX_FILE_BYTES=old;s.close();}
});
test('single delivered page quote is distinct from legacy global uniqueness and owner confirmation',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'repeat',Buffer.from('same---same'));assert.throws(()=>call(s,'evidence_register',{artifactId:a.id,exactQuote:'same'}),{code:'EVIDENCE_QUOTE_AMBIGUOUS'});
 const p=await prepare(s,a),owner=read(s,a,p,{limit:4}),actor=running(s);assert.throws(()=>quote(s,a,owner,'same','borrow',actor),{code:'ARTIFACT_READ_REQUIRED'});
 assert.equal(quote(s,a,owner,'same').quote,'same');assert.equal(s.app.store.get('artifact-text-read',owner.artifactReadId).delivery,'owner-read');const page=read(s,a,p,{limit:4},'agent-page',actor);assert.throws(()=>quote(s,a,page,'same','pending',actor),{code:'ARTIFACT_READ_REQUIRED'});
 const wrong=delivery(s,actor,page,'agent-page');assert.equal(wrong.ack({resultDigest:'wrong'}),false);assert.equal(delivery(s,actor,read(s,a,p,{limit:4},'agent-page',actor),'agent-page').token,undefined);
 const fresh=read(s,a,p,{limit:4},'fresh',actor);assert.equal(delivery(s,actor,fresh,'fresh').ack(),true);const saved=quote(s,a,fresh,'same','delivered',actor);assert.equal(saved.locator.start,0);assert.deepEqual(read(s,a,p,{limit:4},'fresh',actor),fresh);assert.equal(s.app.store.get('artifact-text-read',fresh.artifactReadId).delivery,'delivered');assert.equal(s.app.evidence.verify(s.project.id,saved.id).quote,'same');assert.equal(quote(s,a,fresh,'same','after-delivered-replay',actor).quote,'same');
 const both=read(s,a,p,{limit:64},'both');assert.throws(()=>quote(s,a,both,'same','ambiguous'),{code:'EVIDENCE_QUOTE_AMBIGUOUS'});
 }finally{s.close();}
});
test('authenticated UTF16 mapping spans emoji split at 1MiB and preserves legacy BOM cursor',async()=>{
 const s=setup();try{const content='\ufeff'+'a'.repeat(1048572)+'🙂中尾',a=s.app.evidence.put(s.project.id,'split',Buffer.from(content)),p=await prepare(s,a);
 for(const cursor of [0,1048575,1048579,1048582]){const page=read(s,a,p,{cursor,limit:8},'p'+cursor);assert.equal(page.utf16Start,Buffer.from(content).subarray(0,cursor).toString('utf8').length);assert.equal(page.utf16End,page.utf16Start+page.content.length);}
 assert.throws(()=>read(s,a,p,{cursor:1048576}),{code:'DOCUMENT_CURSOR_INVALID'});
 const legacy=call(s,'artifact_read',{artifactId:a.id,cursor:1},'legacy');assert.equal(legacy.content[0],'a');assert.equal(legacy.cursor,16001);
 }finally{s.close();}
});
test('streamed document index is reused and cancellation publishes no ready source',async()=>{
 const s=setup();try{const d=await s.app.documents.importStream(USER,s.project.id,{title:'data',mediaType:'text/plain'},(async function*(){yield Buffer.from('original🙂');})(),'doc'),a=s.app.store.get('artifact',d.original.artifactId),before=readdirSync(join(s.dir,'artifacts'));
 const p=await prepare(s,a);assert.deepEqual(readdirSync(join(s.dir,'artifacts')),before);assert.equal(read(s,a,p).content,'original🙂');
 const b=s.app.evidence.put(s.project.id,'cancel',Buffer.alloc(3*1024*1024,97)),controller=new AbortController();controller.abort();await assert.rejects(async()=>s.app.operations.execute(USER,'artifact_text_prepare',{artifactId:b.id,sourceDigest:b.digest},{projectId:s.project.id,idempotencyKey:'cancel',signal:controller.signal}));assert.equal(s.app.store.list('artifact-text-source',s.project.id).some(r=>r.artifactId===b.id),false);
 }finally{s.close();}
});

test('Owner archived preparation and history survive a later lower accepting policy; registering remains a write',async()=>{
 const s=setup(),old=process.env.PI_RESEARCH_MAX_FILE_BYTES;try{const a=s.app.evidence.put(s.project.id,'history',Buffer.from('历史🙂正文'));let p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{status:'archived'});process.env.PI_RESEARCH_MAX_FILE_BYTES='1';
 const prepared=await prepare(s,a),page=read(s,a,prepared);assert.equal(page.content,'历史🙂正文');assert.deepEqual(await prepare(s,a),prepared);assert.throws(()=>quote(s,a,page,'历史'),{code:'PROJECT_ARCHIVED'});
 }finally{if(old===undefined)delete process.env.PI_RESEARCH_MAX_FILE_BYTES;else process.env.PI_RESEARCH_MAX_FILE_BYTES=old;s.close();}
});
test('SDK errors, late identity, permission changes and source changes never certify or replay a page',async()=>{
 for(const mutation of ['error','generation','permission','source']){const s=setup();try{const a=s.app.evidence.put(s.project.id,'source',Buffer.from('page source')),actor=running(s),p=await prepare(s,a,'prepare',actor),page=read(s,a,p,{limit:4},'read',actor),d=delivery(s,actor,page,'read');
  if(mutation==='generation'){const row=s.app.store.get('session',actor.sessionId);s.app.store.update('session',row.id,row.version,{generation:2});}
  if(mutation==='permission')s.app.sessionPermissions.initialize(actor.sessionId,'readOnly');
  if(mutation==='source'){const path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);const fd=openSync(path,'r+');writeSync(fd,Buffer.from('X'),0,1,0);closeSync(fd);}
  assert.equal(d.ack(mutation==='error'?{isError:true}:{}),false,mutation);assert.equal(s.app.store.get('artifact-text-read',page.artifactReadId).delivery,'pending');assert.throws(()=>quote(s,a,page,'page','quote',actor));
  if(mutation==='generation'||mutation==='source'){await assert.rejects(async()=>prepare(s,a,'prepare',actor));assert.throws(()=>read(s,a,p,{limit:4},'read',actor));}
 }finally{s.close();}}
});
test('index creation is asynchronous without a writer transaction and concurrent preparation has one ready source',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'concurrent',Buffer.alloc(3*1024*1024,97)),first=prepare(s,a,'one'),second=prepare(s,a,'two');assert.equal(typeof first.then,'function');assert.equal(s.app.store.db.isTransaction,false);s.app.evidence.put(s.project.id,'while-preparing',Buffer.from('writer still available'));
 const [p,q]=await Promise.all([first,second]);assert.equal(p.textSourceId,q.textSourceId);assert.equal(s.app.store.list('artifact-text-source',s.project.id).length,1);assert.equal(s.app.store.list('text-index-publication',s.project.id).length,0);assert.equal(read(s,a,p,{limit:4}).content,'aaaa');
 await assert.rejects(async()=>prepare(s,{...a,digest:'a'.repeat(64)},'one'),{code:'IDEMPOTENCY_CONFLICT'});
 }finally{s.close();}
});
test('native private material and a foreign project cannot prepare or borrow a derived index',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'private',Buffer.from('private protocol'),'text/plain','native-continuation');await assert.rejects(async()=>prepare(s,a),{code:'NATIVE_CONTINUATION_PRIVATE'});
 const ordinary=s.app.evidence.put(s.project.id,'ordinary',Buffer.from('source')),p=await prepare(s,ordinary),foreign=s.app.projects.create(USER,{name:'Foreign',template:'empty'}),b=s.app.evidence.put(foreign.id,'same',Buffer.from('source'));
 assert.throws(()=>s.app.operations.execute(USER,'artifact_read',{artifactId:b.id,readProtocol:protocol,sourceDigest:b.digest,textSourceId:p.textSourceId},{projectId:foreign.id}),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});
test('task-bound preparation and SDK receipts preserve the exact approved source and attempt',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'input',Buffer.from('allowed source')),e=s.app.evidence.register(USER,s.project.id,a.id,0,7,'literal'),team=startTeam(s,[spec('reader',{inputEvidenceIds:[e.id]})]),claimed=s.app.teams.claim(team.id),actor=taskActor(claimed);const session=s.app.store.get('session',actor.sessionId);s.app.store.update('session',session.id,session.version,{state:'running',generation:actor.generation,leaseUntil:Date.now()+120000});const p=await prepare(s,a,'prepare',actor),page=read(s,a,p,{limit:7},'task-page',actor);
 const outside=s.app.evidence.put(s.project.id,'outside',Buffer.from('not approved'));await assert.rejects(async()=>prepare(s,outside,'outside',actor),{code:'TASK_SCOPE_DENIED'});
 assert.equal(delivery(s,actor,page,'task-page').ack(),true);assert.equal(quote(s,a,page,'allowed','task-quote',actor).quote,'allowed');
 const pending=read(s,a,p,{limit:7},'late',actor),ack=delivery(s,actor,pending,'late'),task=s.app.store.get('task',actor.taskId);s.app.store.update('task',task.id,task.version,{attemptId:'replaced-attempt'});assert.equal(ack.ack(),false);await assert.rejects(async()=>prepare(s,a,'prepare',actor),{code:'LEASE_EXPIRED'});assert.throws(()=>read(s,a,p,{limit:7},'task-page',actor),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});
test('later UTF8 checkpoints authenticate pending emoji and quotes cannot split surrogate pairs',async()=>{
 const s=setup();try{const content='\ufeff'+'🙂'.repeat(800000),a=s.app.evidence.put(s.project.id,'many emoji',Buffer.from(content)),p=await prepare(s,a);
 for(const block of [1,2,3]){const cursor=3+4*Math.ceil((block*1048576-3)/4),page=read(s,a,p,{cursor,limit:4},'block-'+block);assert.equal(page.content,'🙂');assert.equal(page.utf16Start,1+(cursor-3)/2);assert.equal(page.utf16End,page.utf16Start+2);assert.throws(()=>quote(s,a,page,'\ud83d','split-'+block),{code:'EVIDENCE_QUOTE_MISMATCH'});const e=quote(s,a,page,'🙂','whole-'+block);assert.equal(s.app.evidence.verify(s.project.id,e.id).quote,'🙂');}
 }finally{s.close();}
});
test('registration checks full source SHA even when corruption lies outside the delivered page blocks',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'full digest',Buffer.alloc(3*1024*1024,97)),p=await prepare(s,a),page=read(s,a,p,{limit:4}),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);const fd=openSync(path,'r+');writeSync(fd,Buffer.from('X'),0,1,a.size-1);closeSync(fd);assert.throws(()=>quote(s,a,page,'aaaa'),{code:'ARTIFACT_CORRUPTED'});assert.equal(s.app.store.list('evidence',s.project.id).length,0);
 }finally{s.close();}
});
test('mid-build cancellation removes private stages without publishing a source clone or ready index',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'cancel mid-stream',Buffer.alloc(3*1024*1024,97)),before=readdirSync(join(s.dir,'artifacts'));let checks=0;
 await assert.rejects(s.app.artifactTexts.prepare(USER,s.project.id,{artifactId:a.id,sourceDigest:a.digest},()=>{if(++checks===3)throw Error('injected cancellation during stream');}),/injected cancellation/);assert.equal(s.app.store.list('artifact-text-source',s.project.id).length,0);assert.equal(s.app.store.list('text-index-publication',s.project.id).length,0);assert.deepEqual(readdirSync(join(s.dir,'artifacts')),before);assert.deepEqual(readdirSync(join(s.dir,'projects',s.project.id,'text-index-staging')),[]);
 }finally{s.close();}
});
test('existing ordinary TeX, Bib, XML and extensionless octet-stream text use actual UTF8 validation',async()=>{
 const s=setup();try{for(const mediaType of ['application/x-tex','application/x-bibtex','application/xml','application/octet-stream']){const a=call(s,'artifact_create',{title:'source',content:'\ufeff中文🙂原稿',mediaType},mediaType),p=await prepare(s,a,'prepare-'+mediaType),page=read(s,a,p,{},'page-'+mediaType);assert.equal(page.content,'\ufeff中文🙂原稿');assert.equal(quote(s,a,page,'中文🙂原稿','quote-'+mediaType).quote,'中文🙂原稿');}
 for(const bytes of [Buffer.from([0xff,0xfe,0xfd]),Buffer.from([97,0,98])]){const a=s.app.evidence.put(s.project.id,'binary',bytes,'application/octet-stream');await assert.rejects(async()=>prepare(s,a,a.id),{code:'DOCUMENT_FORMAT_INVALID'});assert.equal(s.app.store.list('artifact-text-source',s.project.id).some(r=>r.artifactId===a.id),false);}
 }finally{s.close();}
});
test('generated byte admission measures the redacted stored bytes before creating CAS',()=>{
 const s=setup(),old=process.env.PI_RESEARCH_MAX_FILE_BYTES;try{configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'RESEARCH_DUMMY',value:'xyz'},'dummy');const actor=running(s);process.env.PI_RESEARCH_MAX_FILE_BYTES='3';assert.throws(()=>call(s,'artifact_create',{title:'generated',content:'xyz'},'redacted',actor),{code:'ARTIFACT_TOO_LARGE'});assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(existsSync(join(s.dir,'artifacts')),false);
 }finally{if(old===undefined)delete process.env.PI_RESEARCH_MAX_FILE_BYTES;else process.env.PI_RESEARCH_MAX_FILE_BYTES=old;s.close();}
});
test('empty existing artifacts prepare an EOF page but cannot form an empty quote or empty document import',async()=>{
 const s=setup();try{const a=call(s,'artifact_create',{title:'empty log',content:''}),p=await prepare(s,a),page=read(s,a,p);assert.equal(p.size,0);assert.equal(p.utf16Length,0);assert.deepEqual({content:page.content,cursor:page.cursor,end:page.end,totalBytes:page.totalBytes,utf16Start:page.utf16Start,utf16End:page.utf16End,complete:page.complete},{content:'',cursor:0,end:0,totalBytes:0,utf16Start:0,utf16End:0,complete:true});assert.throws(()=>quote(s,a,page,''),{code:'INVALID_INPUT'});assert.equal(call(s,'artifact_read',{artifactId:a.id},'legacy').complete,true);
 await assert.rejects(s.app.documents.importStream(USER,s.project.id,{title:'empty',mediaType:'text/plain'},(async function*(){})(),'empty-document'),{code:'DOCUMENT_FORMAT_INVALID'});
 }finally{s.close();}
});
test('cached pending pages cannot first acquire SDK delivery even if the original response was never offered',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'pending',Buffer.from('page')),actor=running(s),p=await prepare(s,a,'prepare',actor),page=read(s,a,p,{},'page',actor);assert.equal(s.app.store.get('artifact-text-read',page.artifactReadId).offered,undefined);assert.deepEqual(read(s,a,p,{},'page',actor),page);assert.equal(delivery(s,actor,page,'page').token,undefined);assert.throws(()=>quote(s,a,page,'page','quote',actor),{code:'ARTIFACT_READ_REQUIRED'});
 }finally{s.close();}
});
