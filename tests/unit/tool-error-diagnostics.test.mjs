import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,mkdirSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {safeToolDiagnostic,toolResultDiagnostic,toolFailureMessage} from '../../dist/packages/pi-adapter/tool-diagnostic.js';
import {DomainError} from '../../dist/packages/domain/errors.js';

async function failedTool(s,error,tool='artifact_read'){
 const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
 const host=new AgentHost(s.app),sent=[],a={sessionId:session.id,generation:1,ended:false,actor:{type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:1},child:{connected:true,send:value=>sent.push(value)},advertisedTools:new Set(['artifact_read'])};
 host.tools.execute=async()=>{throw error;};
 await host.onMessage(a,{type:'tool',tool,toolCallId:'private-call-id-canary',requestId:1,input:{artifactId:'private-input-canary'}},join(s.dir,'sessions',session.id));
 return {host,a,sent};
}

test('permission failures retain a fixed safe diagnostic through SDK results and public host notices',async()=>{
 const code='PERMISSION_DENIED',privateMessage='private-error-canary sk-secret-canary D:/private-data/file.txt';
 const diagnostic=safeToolDiagnostic({},code,privateMessage);
 assert.deepEqual(diagnostic,{code});
 assert.deepEqual(toolResultDiagnostic({},{content:[{type:'text',text:`${code}: ${privateMessage}`}]}),{code});
 assert.equal(safeToolDiagnostic({},`${code}suffix`,privateMessage),undefined);
 const message=toolFailureMessage('artifact_read',diagnostic);
 assert.match(message,/PERMISSION_DENIED/);assert.match(message,/授权/);assert.doesNotMatch(message,/private-|sk-secret|D:\//);
 const s=setup();try{
  const {host,a,sent}=await failedTool(s,new DomainError(code,privateMessage,403));
  const response=sent.at(-1).error;assert.equal(response.code,code);
  assert.deepEqual(toolResultDiagnostic({},{content:[{type:'text',text:`${response.code}: ${response.message}`}]}),{code});
  await host.onMessage(a,{type:'tool_execution_end',tool:'artifact_read',toolCallId:'private-call-id-canary',isError:true},join(s.dir,'sessions',s.session.id));
  const notice=s.app.sessions.messages(USER,s.session.id).filter(m=>m.role==='system').at(-1);
  assert.equal(notice.status,'failed');assert.equal(notice.content,message);assert.doesNotMatch(notice.content,/private-|sk-secret|D:\//);
 }finally{s.close();}
});

test('internal tool failures persist safe local diagnostics and correlate the public failure without raw values',async()=>{
 const s=setup();try{
  const error=new Error('private-error-canary sk-secret-canary and D:/private-data/file.txt');error.code='ENOENT';error.syscall='open';
  error.stack=`Error: ${error.message}\n    at privateFunction (${resolve('dist/packages/contracts/operations/registry.js')}:162:7)\n    at privateUser (D:/private-data/file.txt:1:2)`;
  const {host,a,sent}=await failedTool(s,error),dir=join(s.dir,'sessions',s.session.id,'diagnostics');
  assert.ok(existsSync(dir),'a local record must exist for the unexpected failure');const files=readdirSync(dir);assert.equal(files.length,1);
  const bytes=readFileSync(join(dir,files[0]),'utf8'),record=JSON.parse(bytes);assert.equal(record.error.name,'Error');assert.equal(record.error.code,'ENOENT');assert.equal(record.error.syscall,'open');
  assert.deepEqual(record.error.frames,[{file:'dist/packages/contracts/operations/registry.js',line:162,column:7}]);
  assert.doesNotMatch(bytes,/private-|secret-canary|privateFunction|D:\/|D:\\\\|artifactId/);assert.equal(record.tool,'artifact_read');assert.match(record.id,/^[a-f0-9-]{36}$/);
  assert.equal(sent.at(-1).error.code,'INTERNAL_ERROR');assert.equal(sent.at(-1).error.diagnosticId,record.id);assert.doesNotMatch(JSON.stringify(sent),/private-|secret-canary/);
  await host.onMessage(a,{type:'tool_execution_end',tool:'artifact_read',toolCallId:'private-call-id-canary',isError:true,diagnostic:{code:'INTERNAL_ERROR',diagnosticId:'forged-id'}},join(s.dir,'sessions',s.session.id));
  const notice=s.app.sessions.messages(USER,s.session.id).filter(m=>m.role==='system').at(-1);assert.equal(notice.status,'failed');assert.ok(notice.content.includes(record.id));assert.doesNotMatch(notice.content,/private-|forged-id|secret-canary/);
 }finally{s.close();}
});

test('unwritable or linked diagnostics never replace the original tool failure or write outside the data root',async()=>{
 const s=setup();try{
  const outside=join(s.dir,'outside'),session=join(s.dir,'sessions',s.session.id);mkdirSync(outside);mkdirSync(session,{recursive:true});symlinkSync(outside,join(session,'diagnostics'),process.platform==='win32'?'junction':'dir');
  const {sent}=await failedTool(s,new Error('private-error-canary'));assert.equal(sent.at(-1).error.code,'INTERNAL_ERROR');assert.equal(sent.at(-1).error.diagnosticId,undefined);assert.match(sent.at(-1).error.message,/诊断未保存/);assert.deepEqual(readdirSync(outside),[]);
 }finally{s.close();}
});

test('unexpected thrown objects and error getters cannot serialize private properties or replace the failure',async()=>{
 for(const error of [{secret:'private-object-canary'},Object.defineProperty(new Error('private-message-canary'),'stack',{get(){throw new Error('private-getter-canary');}})]){
  const s=setup();try{const {sent}=await failedTool(s,error);assert.equal(sent.at(-1).error.code,'INTERNAL_ERROR');assert.doesNotMatch(JSON.stringify(sent),/private-/);
   const dir=join(s.dir,'sessions',s.session.id,'diagnostics');if(existsSync(dir))for(const f of readdirSync(dir))assert.doesNotMatch(readFileSync(join(dir,f),'utf8'),/private-/);
  }finally{s.close();}
 }
});

test('diagnostic properties are captured once before allowlisting changing getters',async()=>{
 const s=setup();try{
  const error=new Error('private-error-canary');error.stack='Error: private-stack-canary';const reads={name:0,code:0,syscall:0};
  for(const [field,safe] of Object.entries({name:'TypeError',code:'ENOENT',syscall:'open'}))Object.defineProperty(error,field,{get(){return ++reads[field]===1?safe:'private-getter-canary';}});
  await failedTool(s,error);const dir=join(s.dir,'sessions',s.session.id,'diagnostics'),files=readdirSync(dir);assert.equal(files.length,1);
  const raw=readFileSync(join(dir,files[0]),'utf8'),record=JSON.parse(raw);assert.doesNotMatch(raw,/private-/);assert.equal(record.error.name,'TypeError');assert.equal(record.error.code,'ENOENT');assert.equal(record.error.syscall,'open');assert.deepEqual(reads,{name:1,code:1,syscall:1});
 }finally{s.close();}
});

test('non-null invalid UTF-8 artifacts produce a safe domain failure instead of an internal exception',()=>{
 const s=setup();try{
  const artifact=s.app.evidence.put(s.project.id,'invalid text',Buffer.from([255]),'text/plain','user');
  assert.throws(()=>s.app.operations.execute(USER,'artifact_read',{artifactId:artifact.id,cursor:0},{projectId:s.project.id}),{code:'ARTIFACT_TEXT_REQUIRED'});
 }finally{s.close();}
});
