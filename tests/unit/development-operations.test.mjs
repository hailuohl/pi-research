import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
const physical=(app,reference)=>app.store.paths.physical(reference);
import {startTeam,spec,actor} from '../support/collaboration.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {DEVELOPMENT_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/development-schemas.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const input={command:['python','main.py',''],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`};
const options=(s,key,sessionId=s.session.id)=>({projectId:s.project.id,sessionId,idempotencyKey:key});
function check(name,value){validateSchema(DEVELOPMENT_OUTPUT_SCHEMAS[name],value,'output');assert.equal(value.manifest?.inputSnapshot.path,undefined);assert.equal(value.outputDir,undefined);assert.equal(value.controlDir,undefined);return value;}
function source(s,session=s.session){writeFileSync(join(physical(s.app,session.workspace),'main.py'),'assert 2 + 2 == 4\n');}
function prepare(s,key='prepare',session=s.session){source(s,session);return check('development_prepare',s.app.operations.execute(USER,'development_prepare',input,options(s,key,session.id)));}
function submit(s,t,key='submit'){approve(s.app,t.grantId);return check('development_submit',s.app.operations.execute(USER,'development_submit',{developmentTaskId:t.id},options(s,key)));}

test('development_prepare output is closed, exact and idempotent; invalid or unapproved requests have no job side effect',()=>{
 const s=setup();try{
  const t=prepare(s);assert.equal(t.state,'prepared');assert.deepEqual(t.manifest.command,input.command);
  assert.deepEqual(s.app.operations.execute(USER,'development_prepare',input,options(s,'prepare')),t);assert.equal(s.app.store.list('development-task').length,1);
  assert.throws(()=>s.app.operations.execute(USER,'development_prepare',input,{projectId:s.project.id,idempotencyKey:'no-session'}),{code:'SESSION_REQUIRED'});
  for(const invalid of [{...input,mounts:['C:/secret']},{...input,grantId:t.grantId},{...input,command:['']},{...input,environmentImageDigest:'python:latest'}])assert.throws(()=>s.app.operations.execute(USER,'development_prepare',invalid,options(s,'invalid')),{code:'INVALID_INPUT'});
  assert.throws(()=>s.app.operations.execute(USER,'development_submit',{developmentTaskId:t.id},options(s,'unapproved')),{code:'APPROVAL_REQUIRED'});
  assert.equal(s.app.store.list('sandbox-job').length,0);
  assert.throws(()=>validateSchema(DEVELOPMENT_OUTPUT_SCHEMAS.development_prepare,{...t,hostPath:s.dir},'output'),{code:'INVALID_OUTPUT'});
 }finally{s.close();}
});

test('development_submit returns one stable job for repeated and independently keyed approved requests',()=>{
 const s=setup();try{const t=prepare(s),j=submit(s,t);
  assert.equal(j.state,'queued');assert.equal(j.integrity,'pending');assert.equal(j.exitCode,null);assert.equal(j.sourceDigest,t.sourceDigest);
  assert.deepEqual(s.app.operations.execute(USER,'development_submit',{developmentTaskId:t.id},options(s,'submit')),j);
  assert.equal(s.app.operations.execute(USER,'development_submit',{developmentTaskId:t.id},options(s,'retry')).jobId,j.jobId);
  const other=prepare(s,'prepare-other');approve(s.app,other.grantId);
  assert.throws(()=>s.app.operations.execute(USER,'development_submit',{developmentTaskId:other.id},options(s,'submit')),{code:'IDEMPOTENCY_CONFLICT'});
  assert.equal(s.app.store.list('sandbox-job').length,1);assert.equal(s.app.store.list('run').length,0);
 }finally{s.close();}
});

test('development_inspect task and job alternatives share Registry and ToolDispatcher semantics and literal contracts',async()=>{
 const s=setup();try{
  let session=s.app.store.get('session',s.session.id);session=s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const who={type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:1},tools=new ToolDispatcher(s.app);source(s);
  const advertised=new Set(tools.definitions('coordinator').map(d=>d.name));for(const name of Object.keys(DEVELOPMENT_OUTPUT_SCHEMAS))assert.ok(advertised.has(name),name);
  const t=check('development_prepare',await tools.execute(who,'development_prepare',input,'tool-prepare'));approve(s.app,t.grantId);
  assert.deepEqual(s.app.operations.execute(who,'development_prepare',input,options(s,'tool-prepare')),t);
  const j=check('development_submit',await tools.execute(who,'development_submit',{developmentTaskId:t.id},'tool-submit'));
  for(const selector of [{developmentTaskId:t.id},{jobId:j.id}]) {
   const key=selector.jobId?'job-inspect':'task-inspect',viaTool=check('development_inspect',await tools.execute(who,'development_inspect',selector,key));
   assert.deepEqual(s.app.operations.execute(who,'development_inspect',selector,options(s,key)),viaTool);
   assert.deepEqual(s.app.operations.execute(USER,'development_inspect',selector,options(s,'owner-'+key)),viaTool);
  }
  assert.throws(()=>s.app.operations.execute(USER,'development_inspect',{jobId:j.id,developmentTaskId:t.id},options(s,'ambiguous')),{code:'INVALID_INPUT'});
  assert.throws(()=>s.app.operations.execute({...who,generation:0},'development_submit',{developmentTaskId:t.id},options(s,'tool-submit')),{code:'LEASE_EXPIRED'});
 }finally{s.close();}
});

test('development_logs and cancel outputs validate for queued, partial-page and terminal service records',async()=>{
 const s=setup();try{const t=prepare(s),j=submit(s,t),row=s.app.store.get('sandbox-job',j.id);
  let empty=check('development_logs',s.app.operations.execute(USER,'development_logs',{jobId:j.id},options(s,'logs-empty')));assert.equal(empty.content,'');assert.equal(empty.complete,false);
  const controlDir=physical(s.app,row.controlDir);writeFileSync(join(controlDir,'stdout.log'),'x'.repeat(70000));writeFileSync(join(controlDir,'stderr.log'),'fixture stderr');
  const first=check('development_logs',s.app.operations.execute(USER,'development_logs',{jobId:j.id,stream:'stdout'},options(s,'logs-first')));assert.equal(first.cursor,65536);assert.equal(first.complete,false);
  const cancelled=check('development_cancel',s.app.operations.execute(USER,'development_cancel',{jobId:j.id},options(s,'cancel')));assert.equal(cancelled.cancelRequested,true);
  assert.deepEqual(s.app.operations.execute(USER,'development_cancel',{jobId:j.id},options(s,'cancel')),cancelled);
  // Only archive deterministic local fixture bytes; no container or worker is started.
  s.app.development.finalize(j.id,{state:'cancelled',exitCode:null});
  const tail=check('development_logs',s.app.operations.execute(USER,'development_logs',{jobId:j.id,stream:'stdout',cursor:first.cursor},options(s,'logs-tail')));assert.equal(tail.content.length,4464);assert.equal(tail.complete,true);
  const terminal=check('development_inspect',s.app.operations.execute(USER,'development_inspect',{jobId:j.id},options(s,'terminal')));assert.equal(terminal.state,'cancelled');assert.ok(terminal.reportArtifactId);
  let session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
  const who={type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:1},tools=new ToolDispatcher(s.app);
  check('development_logs',await tools.execute(who,'development_logs',{jobId:j.id,stream:'stderr'},'tool-logs'));
  assert.equal(check('development_cancel',await tools.execute(who,'development_cancel',{jobId:j.id},'tool-cancel')).state,'cancelled');
 }finally{s.close();}
});

test('development operation receipts stay session scoped and cannot bypass assistant or project ownership',async()=>{
 const s=setup();try{
  const second=s.app.sessions.create(USER,s.project.id,{title:'second root'}),first=prepare(s,'same-key'),other=prepare(s,'same-key',second);assert.notEqual(first.id,other.id);assert.equal(other.sessionId,second.id);
  const team=startTeam(s,[spec('a',{role:'implementer'}),spec('b',{role:'implementer'})]),a=s.app.teams.claim(team.id),b=s.app.teams.claim(team.id),aa=actor(a),bb=actor(b),tools=new ToolDispatcher(s.app);
  source(s,s.app.store.get('session',aa.sessionId));source(s,s.app.store.get('session',bb.sessionId));
  const ta=check('development_prepare',await tools.execute(aa,'development_prepare',input,'same-tool-key')),tb=check('development_prepare',await tools.execute(bb,'development_prepare',input,'same-tool-key'));assert.notEqual(ta.id,tb.id);
  approve(s.app,ta.grantId);const ja=check('development_submit',await tools.execute(aa,'development_submit',{developmentTaskId:ta.id},'submit-shared-key'));
  check('development_inspect',await tools.execute(aa,'development_inspect',{jobId:ja.id},'read-shared-key'));
  for(const [name,raw,key] of [['development_inspect',{jobId:ja.id},'read-shared-key'],['development_logs',{jobId:ja.id},'read-shared-key'],['development_cancel',{jobId:ja.id},'cancel-shared-key'],['development_submit',{developmentTaskId:ta.id},'submit-shared-key']])await assert.rejects(()=>tools.execute(bb,name,raw,key),{code:'TASK_SCOPE_DENIED'});
  assert.throws(()=>s.app.operations.execute(bb,'development_prepare',input,options(s,'same-tool-key',aa.sessionId)),{code:'SCOPE_DENIED'});
  const foreign=s.app.projects.create(USER,{name:'foreign',template:'empty'});assert.throws(()=>s.app.operations.execute(USER,'development_inspect',{jobId:ja.id},{projectId:foreign.id}),{code:'SCOPE_DENIED'});
  assert.equal(s.app.store.list('sandbox-job').length,1);
 }finally{s.close();}
});
