import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, readdirSync, chmodSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,approve} from '../support/research.mjs';
import {SourceAccessService} from '../../dist/packages/workspace/source-access.js';
const physical = (s, reference) => s.app.store.paths.physical(reference);

test('actual source revisions read immutable bytes, ranges, diff and preserve local edits',()=>{
 const s=setup();try {
  const api=new SourceAccessService(s.app),sel={experimentId:s.baseline.id,revision:1};
  const old=api.read(USER,s.project.id,{...sel,path:'config.json'});
  const config=JSON.parse(old.content);config.polynomialDegree=2;
  s.app.experiments.writeFile(USER,s.baseline.id,'config.json',JSON.stringify(config),old.digest,s.baseline.version);
  const next={experimentId:s.baseline.id,revision:2};
  assert.equal(JSON.parse(api.read(USER,s.project.id,{...sel,path:'config.json'}).content).polynomialDegree,1);
  assert.equal(JSON.parse(api.read(USER,s.project.id,{...next,path:'config.json'}).content).polynomialDegree,2);
  assert.equal(api.diff(USER,s.project.id,{from:sel,to:next}).files[0].status,'modified');
  const page=api.read(USER,s.project.id,{...next,path:'config.json',cursor:1,limit:4});assert.equal(page.end,5);assert.equal(page.content.length,4);assert.equal(page.complete,false);
  const prepared=api.prepare(USER,s.project.id,s.session.id,next);assert.equal(prepared.prepared,true);
  writeFileSync(join(physical(s,s.session.workspace),'config.json'),'local edits');
  assert.equal(api.prepare(USER,s.project.id,s.session.id,next).prepared,false);
  assert.equal(readFileSync(join(physical(s,s.session.workspace),'config.json'),'utf8'),'local edits');
  assert.equal(JSON.parse(api.read(USER,s.project.id,{...next,path:'config.json'}).content).polynomialDegree,2);
  assert.throws(()=>api.prepare(USER,s.project.id,s.session.id,sel),{code:'WORKSPACE_NOT_EMPTY'});
  assert.throws(()=>api.read(USER,s.project.id,{...next,path:'../config.json'}),{code:'PATH_DENIED'});
  assert.throws(()=>api.list(USER,s.project.id,{...next,snapshotId:old.snapshotId}),{code:'INVALID_INPUT'});
  const other=s.app.projects.create(USER,{name:'other',template:'curve-fit'});
  assert.throws(()=>api.list(USER,other.id,{snapshotId:old.snapshotId}),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});

test('legacy source capture is explicit current-only preparation, never a read side effect',()=>{
 const s=setup();try {
  const api=new SourceAccessService(s.app),sel={experimentId:s.baseline.id,revision:1};
  s.app.store.db.prepare("DELETE FROM records WHERE kind='source-revision'").run();
  assert.throws(()=>api.list(USER,s.project.id,sel),{code:'NOT_FOUND'});
  assert.equal(s.app.store.list('source-revision').length,0);
  const prepared=api.prepare(USER,s.project.id,s.session.id,sel);
  assert.equal(s.app.store.get('source-revision',prepared.snapshotId).captureKind,'observed-now');
  assert.throws(()=>api.list(USER,s.project.id,{...sel,revision:2}),{code:'NOT_FOUND'});
 }finally{s.close();}
});

test('claimed assistants receive only approved source binding and private source copy',()=>{
 const s=setup();try {
  const api=new SourceAccessService(s.app),sel={experimentId:s.baseline.id,revision:1};
  const prepared=api.prepare(USER,s.project.id,s.session.id,sel);
  const p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{settings:{...p.settings,enabled:true}});
  const team=s.app.teams.create(USER,s.session.id,{goal:'read actual source',tasks:[{key:'code',role:'implementer',objective:'inspect code',dependencies:[]}]});
  approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);
  const claimed=s.app.teams.claim(team.id),session=s.app.store.get('session',claimed.attempt.sessionId);
  assert.equal(session.sourceRevisionId,prepared.snapshotId);assert.equal(claimed.context.source.sourceDigest,prepared.sourceDigest);
  assert.equal(JSON.parse(readFileSync(join(physical(s,session.workspace),'config.json'),'utf8')).polynomialDegree,1);
  const actor={type:'agent',projectId:s.project.id,sessionId:session.id,role:'implementer',taskId:claimed.task.id,attemptId:claimed.attempt.id};
  assert.equal(api.list(actor,s.project.id,sel).snapshotId,prepared.snapshotId);
  const child=s.app.experiments.create(USER,s.project.id,{title:'child',parentId:s.baseline.id,config:{polynomialDegree:2}});
  assert.throws(()=>api.list(actor,s.project.id,{experimentId:child.id,revision:1}),{code:'TASK_SCOPE_DENIED'});
  s.app.teams.cancel(USER,claimed.task.id);
  assert.throws(()=>api.list(actor,s.project.id,sel),{code:'TASK_SCOPE_DENIED'});
 }finally{s.close();}
});

test('preparation restores the empty workspace on a rejected binding and rejects corrupted CAS',()=>{
 const s=setup();try {
  const api=new SourceAccessService(s.app),sel={experimentId:s.baseline.id,revision:1};
  const event=s.app.store.event.bind(s.app.store);
  s.app.store.event=(pid,type,payload)=>{if(type==='workspace.source_prepared')throw new Error('injected event failure');return event(pid,type,payload);};
  assert.throws(()=>api.prepare(USER,s.project.id,s.session.id,sel),/injected event failure/);
  assert.deepEqual(readdirSync(physical(s,s.session.workspace)),[]);assert.equal(s.app.store.get('session',s.session.id).sourceRevisionId,undefined);
  s.app.store.event=event;assert.equal(api.prepare(USER,s.project.id,s.session.id,sel).prepared,true);
  const r=s.app.store.list('source-revision')[0],file=join(physical(s,r.snapshot.path),'config.json');chmodSync(file,0o600);writeFileSync(file,'tampered');
  assert.throws(()=>api.list(USER,s.project.id,sel),{code:'SNAPSHOT_CORRUPTED'});
 }finally{s.close();}
});

test('a failed revision capture transaction restores the mutable source bytes',()=>{
 const s=setup();try {
  const original=s.app.experiments.readFile(USER,s.baseline.id,'config.json');
  const event=s.app.store.event.bind(s.app.store);
  s.app.store.event=(pid,type,payload)=>{if(type==='experiment.revised')throw new Error('injected revision failure');return event(pid,type,payload);};
  assert.throws(()=>s.app.experiments.writeFile(USER,s.baseline.id,'config.json','{}',original.digest,s.baseline.version),/injected revision failure/);
  assert.equal(s.app.experiments.readFile(USER,s.baseline.id,'config.json').content,original.content);
  assert.equal(s.app.experiments.get(USER,s.baseline.id).revision,1);
  assert.equal(s.app.store.list('source-revision').length,1);
 }finally{s.close();}
});

test('empty draft source is versioned while formal runs still reject an empty workspace',()=>{
 const s=setup();try {
  const project=s.app.projects.create(USER,{name:'empty draft',template:'empty'});unlinkSync(join(physical(s,project.workspace),'README.md'));
  const e=s.app.experiments.create(USER,project.id,{title:'empty draft'}),api=new SourceAccessService(s.app);
  assert.deepEqual(api.list(USER,project.id,{experimentId:e.id,revision:1}).files,[]);
  assert.throws(()=>s.app.runs.prepare(USER,e.id),{code:'EMPTY_WORKSPACE'});
 }finally{s.close();}
});

test('source task-context.json remains project data when an assistant is claimed',()=>{
 const s=setup();try {
  const bytes='{"projectOwned":"preserve these exact bytes"}\n';
  s.app.experiments.writeFile(USER,s.baseline.id,'task-context.json',bytes,null,s.baseline.version);
  const api=new SourceAccessService(s.app),source=api.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:2});
  const p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{settings:{...p.settings,enabled:true}});
  const team=s.app.teams.create(USER,s.session.id,{goal:'inspect source',tasks:[{key:'code',role:'implementer',objective:'read source',dependencies:[]}]});
  approve(s.app,team.approvalId);s.app.teams.activate(USER,team.id);
  const claimed=s.app.teams.claim(team.id);assert.ok(claimed);
  assert.equal(readFileSync(join(physical(s,claimed.attempt.workspace),'task-context.json'),'utf8'),bytes);
  const context=s.app.store.list('context-snapshot',s.project.id).find(c=>c.attemptId===claimed.attempt.id);
  assert.equal(context.content.source.snapshotId,source.snapshotId);
  assert.equal(context.content.source.sourceDigest,source.sourceDigest);
  assert.ok(context.content.restrictions.some(r=>r.includes('task_context_read')));
 }finally{s.close();}
});

test('outer transaction failure restores prepared workspace and permits retry',()=>{
 const s=setup();try {
  const api=new SourceAccessService(s.app),sel={experimentId:s.baseline.id,revision:1};
  assert.throws(()=>s.app.store.transaction(()=>{
   api.prepare(USER,s.project.id,s.session.id,sel);
   assert.ok(readdirSync(physical(s,s.session.workspace)).length);
   throw new Error('outer operation failure');
  }),/outer operation failure/);
  assert.deepEqual(readdirSync(physical(s,s.session.workspace)),[]);
  assert.equal(s.app.store.get('session',s.session.id).sourceRevisionId,undefined);
  assert.equal(api.prepare(USER,s.project.id,s.session.id,sel).prepared,true);
 }finally{s.close();}
});

test('outer transaction failure restores changed and newly created experiment files',()=>{
 const s=setup();try {
  const old=s.app.experiments.readFile(USER,s.baseline.id,'config.json');
  assert.throws(()=>s.app.store.transaction(()=>{
   s.app.experiments.writeFile(USER,s.baseline.id,'config.json','{}',old.digest,s.baseline.version);
   const current=s.app.experiments.get(USER,s.baseline.id);
   s.app.experiments.writeFile(USER,s.baseline.id,'new-file.txt','new',null,current.version);
   throw new Error('outer revision failure');
  }),/outer revision failure/);
  assert.equal(s.app.experiments.readFile(USER,s.baseline.id,'config.json').content,old.content);
  assert.throws(()=>s.app.experiments.readFile(USER,s.baseline.id,'new-file.txt'),{code:'NOT_FOUND'});
  assert.equal(s.app.experiments.get(USER,s.baseline.id).revision,1);
  assert.equal(s.app.store.list('source-revision').length,1);
  s.app.experiments.writeFile(USER,s.baseline.id,'config.json','{}',old.digest,s.baseline.version);
  assert.equal(s.app.experiments.get(USER,s.baseline.id).revision,2);
 }finally{s.close();}
});

test('archived projects preserve fixed source reads but reject new revisions, preparation and notes',()=>{
 const s=setup();try {
  const selector={experimentId:s.baseline.id,revision:1}, original=s.app.sources.read(USER,s.project.id,{...selector,path:'config.json'});
  const project=s.app.projects.get(USER,s.project.id);s.app.projects.archive(USER,project.id,project.version);
  assert.equal(s.app.sources.read(USER,s.project.id,{...selector,path:'config.json'}).digest,original.digest);
  assert.throws(()=>s.app.experiments.writeFile(USER,s.baseline.id,'config.json','{}',original.digest,s.baseline.version),{code:'PROJECT_ARCHIVED'});
  assert.throws(()=>s.app.sources.prepare(USER,s.project.id,s.session.id,selector),{code:'PROJECT_ARCHIVED'});
  assert.throws(()=>s.app.experiments.note(USER,s.baseline.id,'new note'),{code:'PROJECT_ARCHIVED'});
  assert.equal(s.app.store.list('source-revision').length,1);
 }finally{s.close();}
});

