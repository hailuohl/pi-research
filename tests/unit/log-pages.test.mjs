import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {readLogPage} from '../../dist/packages/execution/log-page.js';
import {setup,USER,approve} from '../support/research.mjs';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';

function files(){const root=fs.mkdtempSync(join(tmpdir(),'log-pages-'));return {root,path:join(root,'stdout.log'),close(){fs.rmSync(root,{recursive:true,force:true});}};}

test('UTF-8 page boundaries retain Chinese, emoji and BOM with byte-accurate repeatable cursors',()=>{
 const f=files();try{const text='x'.repeat(65535)+'中😀结束';fs.writeFileSync(f.path,text);const first=readLogPage(f.root,'stdout.log',0,{terminal:true});assert.equal(first.cursor,65535);assert.equal(first.start,0);assert.equal(first.size,Buffer.byteLength(text));assert.equal(first.complete,false);assert.equal(first.identity.length,64);
  assert.deepEqual(readLogPage(f.root,'stdout.log',0,{terminal:true,identity:first.identity}),first);const second=readLogPage(f.root,'stdout.log',first.cursor,{terminal:true,identity:first.identity});assert.equal(first.content+second.content,text);assert.equal(second.complete,true);assert.equal(second.cursor,Buffer.byteLength(text));
  fs.writeFileSync(f.path,'\uFEFF中😀尾');let cursor=0,joined='';for(let i=0;i<10;i++){const page=readLogPage(f.root,'stdout.log',cursor,{terminal:true,maxBytes:4});joined+=page.content;assert.ok(page.cursor>cursor);cursor=page.cursor;if(page.complete)break;}assert.equal(joined,'\uFEFF中😀尾');
 }finally{f.close();}
});

test('a growing half-character EOF does not advance, append preserves identity, and only terminal EOF completes',()=>{
 const f=files();try{const chinese=Buffer.from('中'),emoji=Buffer.from('😀');fs.writeFileSync(f.path,chinese.subarray(0,1));const first=readLogPage(f.root,'stdout.log',0,{terminal:false});assert.equal(first.content,'');assert.equal(first.cursor,0);assert.equal(first.complete,false);assert.equal(first.size,1);
  fs.appendFileSync(f.path,Buffer.concat([chinese.subarray(1),emoji.subarray(0,3)]));const second=readLogPage(f.root,'stdout.log',0,{terminal:false,identity:first.identity});assert.equal(second.content,'中');assert.equal(second.cursor,3);assert.equal(second.identity,first.identity);
  fs.appendFileSync(f.path,Buffer.concat([emoji.subarray(3),Buffer.from('!')]));const third=readLogPage(f.root,'stdout.log',second.cursor,{terminal:false,identity:first.identity});assert.equal(third.content,'😀!');assert.equal(third.complete,false);assert.equal(third.cursor,8);
  assert.equal(readLogPage(f.root,'stdout.log',third.cursor,{terminal:false,identity:first.identity}).complete,false);assert.equal(readLogPage(f.root,'stdout.log',third.cursor,{terminal:true,identity:first.identity}).complete,true);
 }finally{f.close();}
});

test('terminal truncated characters and illegal UTF-8 explicitly fail without changing log bytes',()=>{
 const f=files();try{for(const bytes of [Buffer.from([0xe4]),Buffer.from([0xf0,0x9f,0x98]),Buffer.from([0x61,0xff]),Buffer.from([0xc0,0xaf])]){fs.writeFileSync(f.path,bytes);assert.throws(()=>readLogPage(f.root,'stdout.log',0,{terminal:true}),{code:'LOG_ENCODING_INVALID'});assert.deepEqual(fs.readFileSync(f.path),bytes);}fs.writeFileSync(f.path,Buffer.from([0x61,0xff]));assert.throws(()=>readLogPage(f.root,'stdout.log',0,{terminal:false}),{code:'LOG_ENCODING_INVALID'});
 }finally{f.close();}
});

test('missing, replaced, shrinking and out-of-range logs reset explicitly instead of clamping',()=>{
 const f=files();try{assert.deepEqual(readLogPage(f.root,'stdout.log',0,{terminal:false}),{content:'',cursor:0,complete:false,start:0,size:0,identity:null});assert.throws(()=>readLogPage(f.root,'stdout.log',1,{terminal:false}),{code:'LOG_RESET'});assert.throws(()=>readLogPage(f.root,'stdout.log',0,{terminal:false,identity:'old'}),{code:'LOG_RESET'});
  fs.writeFileSync(f.path,'abc');const initial=readLogPage(f.root,'stdout.log',0,{terminal:false});assert.throws(()=>readLogPage(f.root,'stdout.log',4,{terminal:false}),{code:'LOG_RESET'});fs.truncateSync(f.path,1);assert.throws(()=>readLogPage(f.root,'stdout.log',initial.cursor,{terminal:false,identity:initial.identity}),{code:'LOG_RESET'});
  fs.renameSync(f.path,join(f.root,'previous.log'));fs.writeFileSync(f.path,'replacement is longer than old cursor');assert.throws(()=>readLogPage(f.root,'stdout.log',initial.cursor,{terminal:false,identity:initial.identity}),{code:'LOG_RESET'});const replacement=readLogPage(f.root,'stdout.log',0,{terminal:true,identity:null});assert.notEqual(replacement.identity,initial.identity);fs.unlinkSync(f.path);assert.throws(()=>readLogPage(f.root,'stdout.log',0,{terminal:true,identity:replacement.identity}),{code:'LOG_RESET'});
 }finally{f.close();}
});

test('physical bytes read remain bounded even with short reads; the helper never whole-reads a log',()=>{
 const f=files(),read=fs.readSync,whole=fs.readFileSync;try{fs.writeFileSync(f.path,Buffer.alloc(2*1024*1024,120));let actual=0,calls=0;
  fs.readSync=(fd,buffer,offset,length,position)=>{assert.ok(length<=65536);const n=read(fd,buffer,offset,Math.min(length,257),position);actual+=n;calls++;return n;};fs.readFileSync=()=>{throw new Error('whole-file read forbidden');};syncBuiltinESMExports();
  const page=readLogPage(f.root,'stdout.log',1024*1024,{terminal:false});assert.equal(actual,65536);assert.ok(calls>1);assert.equal(page.start,1024*1024);assert.equal(page.cursor,1024*1024+65536);assert.equal(page.content.length,65536);
 }finally{fs.readSync=read;fs.readFileSync=whole;syncBuiltinESMExports();f.close();}
});

test('replacement or shrink during an open read is detected and path escapes remain denied',()=>{
 const f=files(),read=fs.readSync;try{for(const change of ['shrink','replace']){fs.writeFileSync(f.path,'x'.repeat(50));let changed=false;fs.readSync=(...args)=>{const n=read(...args);if(!changed){changed=true;if(change==='shrink')fs.truncateSync(f.path,0);else{fs.renameSync(f.path,join(f.root,'old-read.log'));fs.writeFileSync(f.path,'replacement'.repeat(10));}}return n;};syncBuiltinESMExports();assert.throws(()=>readLogPage(f.root,'stdout.log',0,{terminal:false}),{code:'LOG_RESET'});fs.readSync=read;syncBuiltinESMExports();}
  assert.throws(()=>readLogPage(f.root,'../outside',0,{terminal:false}),{code:'PATH_DENIED'});fs.symlinkSync(f.root,join(f.root,'stderr.log'),'junction');assert.throws(()=>readLogPage(f.root,'stderr.log',0,{terminal:false}),{code:'PATH_DENIED'});
 }finally{fs.readSync=read;syncBuiltinESMExports();f.close();}
});

test('Run and development operations share safe-integer cursors, identities and the new closed output contract',()=>{
 const s=setup();try{const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id),bytes=Buffer.alloc(2*1024*1024,120);fs.writeFileSync(join(s.app.store.paths.physical(run.outputDir),'stdout.log'),bytes);
  fs.writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'main.py'),'print("fixture only")');const task=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','main.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`});approve(s.app,task.grantId);const job=s.app.development.submit(USER,s.project.id,task.id),stored=s.app.store.get('sandbox-job',job.id);fs.writeFileSync(join(s.app.store.paths.physical(stored.controlDir),'stdout.log'),bytes);
  const call=(name,input,pid=s.project.id)=>{const value=s.app.operations.execute(USER,name,input,{projectId:pid});validateSchema(OUTPUT_SCHEMAS[name],value,'output');return value;};
  const cursor=1024*1024+3,a=call('run_logs',{runId:run.id,cursor,identity:null}),b=call('development_logs',{jobId:job.id,stream:'stdout',cursor});assert.equal(a.start,cursor);assert.equal(b.start,cursor);assert.equal(a.content,b.content);assert.equal(a.cursor,b.cursor);assert.equal(b.jobId,job.id);assert.equal(b.stream,'stdout');assert.notEqual(a.identity,b.identity);
  assert.deepEqual(call('run_logs',{runId:run.id,cursor,identity:a.identity}),a);assert.throws(()=>call('development_logs',{jobId:job.id,cursor,identity:a.identity}),{code:'LOG_RESET'});assert.throws(()=>call('run_logs',{runId:run.id,cursor:bytes.length+1}),{code:'LOG_RESET'});assert.throws(()=>call('run_logs',{runId:run.id,cursor:Number.MAX_SAFE_INTEGER+1}),{code:'INVALID_INPUT'});
  const other=s.app.projects.create(USER,{name:'Other project'});assert.throws(()=>call('development_logs',{jobId:job.id},other.id),{code:'SCOPE_DENIED'});assert.throws(()=>call('run_logs',{runId:run.id},other.id),{code:'SCOPE_DENIED'});
  s.app.runs.finalize(run.id,1,'failed','Unit fixture: no workload executed');s.app.development.cancel(USER,s.project.id,job.id);assert.equal(call('run_logs',{runId:run.id,cursor:bytes.length,identity:a.identity}).complete,true);assert.equal(call('development_logs',{jobId:job.id,cursor:bytes.length,identity:b.identity}).complete,true);
 }finally{s.close();}
});
