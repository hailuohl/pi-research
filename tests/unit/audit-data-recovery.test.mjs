import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,readdirSync,existsSync,rmSync,mkdirSync,renameSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {runOfflinePurge} from '../../dist/packages/storage/project-purge.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {SESSION_HISTORY_OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/session-schemas.js';
import {createDataBackup} from '../../dist/packages/storage/backup.js';
const USER={type:'user'};
const temporary=()=>mkdtempSync(join(tmpdir(),'pi-audit-recovery-'));
function committedSourceRecovery(data,failure='throw') {
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';
 const [data,failure]=process.argv.slice(1),rmdir=fs.rmdirSync;let prefix;
 fs.rmdirSync=(path,...args)=>{if(prefix&&String(path).startsWith(prefix)){prefix=undefined;if(failure==='exit')process.exit(86);throw Object.assign(Error('injected source cleanup failure'),{code:'EACCES'});}return rmdir(path,...args);};syncBuiltinESMExports();
 const {ResearchApp}=await import('./dist/packages/research-app.js'),user={type:'user'},app=new ResearchApp(data,process.cwd());
 const p=app.projects.create(user,{name:'Receipt cleanup',template:'curve-fit'}),s=app.sessions.create(user,p.id,{}),e=app.experiments.create(user,p.id,{title:'Baseline'}),workspace=app.store.paths.physical(s.workspace);
 console.log(JSON.stringify({projectId:p.id,sessionId:s.id,experimentId:e.id,workspace}));prefix=workspace+'-empty-';
 try{app.operations.execute(user,'workspace_prepare_from_revision',{experimentId:e.id,revision:1},{projectId:p.id,sessionId:s.id,idempotencyKey:'source-original-key'});throw Error('injection did not fire');}catch(error){if(error.code!=='POST_COMMIT_CLEANUP_FAILED')throw error;}app.close();`,data,failure],{encoding:'utf8',timeout:30000,windowsHide:true});
 assert.equal(child.status,failure==='exit'?86:0,child.stderr);return JSON.parse(child.stdout.trim().split(/\r?\n/)[0]);
}
for(const failure of ['throw','exit'])test(`same-key source receipt replay settles committed cleanup after ${failure} without re-preparing or altering later edits`,async()=>{
 const root=temporary(),data=join(root,'data');let app;try{
  const m=committedSourceRecovery(data,failure),marker=m.workspace+'.source-prepare-pending';assert.ok(existsSync(marker));
  writeFileSync(join(m.workspace,'config.json'),'later user edit');app=new ResearchApp(data,process.cwd());
  const scope=`operation:user:${m.projectId}:${m.sessionId}`,before=app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,'source-original-key'),receipt=JSON.parse(before.response);
  assert.equal(receipt.prepared,true);const session=app.store.get('session',m.sessionId),e=app.store.get('experiment',m.experimentId);app.store.update('experiment',e.id,e.version,{lifecycle:'archived'});
  const records=app.store.db.prepare('SELECT kind,id,data FROM records ORDER BY kind,id').all(),events=app.store.eventCursor();
  app.sources.prepare=()=>{throw Error('receipt replay must not prepare source or renew authorization');};
  const result=app.operations.execute(USER,'workspace_prepare_from_revision',{experimentId:m.experimentId,revision:1},{projectId:m.projectId,sessionId:m.sessionId,idempotencyKey:'source-original-key'});
  assert.deepEqual(result,receipt);assert.equal(existsSync(marker),false);assert.equal(readFileSync(join(m.workspace,'config.json'),'utf8'),'later user edit');
  assert.deepEqual(app.store.get('session',m.sessionId),session);assert.deepEqual(app.store.db.prepare('SELECT * FROM operations WHERE scope=? AND key=?').get(scope,'source-original-key'),before);assert.deepEqual(app.store.db.prepare('SELECT kind,id,data FROM records ORDER BY kind,id').all(),records);assert.equal(app.store.eventCursor(),events);
  await app.close();app=undefined;const backup=await createDataBackup(data,join(root,'backup'),{offline:true});assert.ok(backup.files>0);
 }finally{await app?.close();rmSync(root,{recursive:true,force:true});}
});
for(const changed of ['tampered-marker','different-source'])test(`same-key source receipt replay preserves unresolved ${changed}`,()=>{
 const root=temporary(),data=join(root,'data');let app;try{
  const m=committedSourceRecovery(data),marker=m.workspace+'.source-prepare-pending';app=new ResearchApp(data,process.cwd());
  if(changed==='tampered-marker')writeFileSync(marker,'{"data":"tampered","mac":"wrong"}');
  else {const s=app.store.get('session',m.sessionId);app.store.update('session',s.id,s.version,{sourceRevisionId:'other-fixed-source',sourceDigest:'other-fixed-digest'});}
  const markerBytes=readFileSync(marker),workspaceBytes=readFileSync(join(m.workspace,'config.json')),session=app.store.get('session',m.sessionId),before=app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all();
  const replay=()=>app.operations.execute(USER,'workspace_prepare_from_revision',{experimentId:m.experimentId,revision:1},{projectId:m.projectId,sessionId:m.sessionId,idempotencyKey:'source-original-key'});
  if(changed==='tampered-marker')assert.throws(replay,{code:'SOURCE_PREPARE_RECOVERY_CONFLICT'});else assert.equal(replay().prepared,true);
  assert.deepEqual(readFileSync(marker),markerBytes);assert.deepEqual(readFileSync(join(m.workspace,'config.json')),workspaceBytes);assert.deepEqual(app.store.get('session',m.sessionId),session);assert.deepEqual(app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all(),before);
 }finally{app?.close();rmSync(root,{recursive:true,force:true});}
});
test('same-key source receipt replay rechecks the binding when post-commit cleanup obtains its writer lock',()=>{
 const root=temporary(),data=join(root,'data');let app;try{
  const m=committedSourceRecovery(data),marker=m.workspace+'.source-prepare-pending';app=new ResearchApp(data,process.cwd());
  const before=readFileSync(marker),afterCommit=app.store.afterCommit.bind(app.store);
  app.store.afterCommit=callback=>afterCommit(()=>{
   app.store.transaction(()=>{const s=app.store.get('session',m.sessionId);app.store.update('session',s.id,s.version,{sourceRevisionId:'newer-source',sourceDigest:'newer-digest'});});
   callback();
  });
  assert.throws(()=>app.operations.execute(USER,'workspace_prepare_from_revision',{experimentId:m.experimentId,revision:1},{projectId:m.projectId,sessionId:m.sessionId,idempotencyKey:'source-original-key'}),{code:'POST_COMMIT_CLEANUP_FAILED'});
  assert.deepEqual(readFileSync(marker),before);assert.equal(app.store.get('session',m.sessionId).sourceRevisionId,'newer-source');
 }finally{app?.close();rmSync(root,{recursive:true,force:true});}
});
for(const command of [false,true,'unknown-field','unknown-record'])test(`purge ${String(command)} identifies history by record type and preserves external files`,async()=>{
 const dir=temporary(),outside=temporary();try {
  const child=spawnSync(process.execPath,['--input-type=module','-e',`import {ResearchApp} from './dist/packages/research-app.js';import {writeFileSync} from 'node:fs';import {join} from 'node:path';const USER={type:'user'};
  const [dir,outside,command]=process.argv.slice(1),app=new ResearchApp(dir,process.cwd());
  const p=app.projects.create(USER,{name:'Purge audit',template:'empty'}),s=app.sessions.create(USER,p.id,{}),other=app.projects.create(USER,{name:'Keep',template:'empty'});
  const keep=join(app.store.paths.physical(other.workspace),'keep.txt'),external=join(outside,'keep.txt');writeFileSync(keep,'keep');writeFileSync(external,'outside');
  if(command!=='false'){
   app.hostAccess.enable(USER,s.id,{expectedVersion:0,acknowledgedSameUserAccess:true});app.store.update('session',s.id,s.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});
   const result=await app.hostAccess.execute({type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:1},{argv:[process.execPath,'--version']},'node-version');if(result.state!=='succeeded')throw Error('Host command failed');
   app.store.create('host-command',p.id,{sessionId:s.id,cwd:outside,argv:[process.execPath,keep,external,app.store.paths.physical(s.workspace)],state:'succeeded'});
   if(command==='unknown-field')app.store.create('host-command',p.id,{sessionId:s.id,unknownResource:app.store.paths.physical(s.workspace),state:'succeeded'});
   if(command==='unknown-record')app.store.create('unknown-kind',p.id,{cwd:app.store.paths.physical(s.workspace)});
   const latest=app.store.get('session',s.id);app.store.update('session',s.id,latest.version,{state:'idle',leaseUntil:0});
  }
  const trashed=app.projects.trash(USER,p.id,app.store.get('project',p.id).version);app.projects.purge(USER,p.id,{expectedVersion:trashed.version,confirmName:p.name},'purge');app.close();
  console.log(JSON.stringify({projectId:p.id,name:p.name,keep,external}));`,dir,outside,String(command)],{encoding:'utf8',timeout:30000,windowsHide:true});
  assert.equal(child.status,0,child.stderr);const made=JSON.parse(child.stdout.trim().split(/\r?\n/).at(-1));
  if(typeof command==='string')assert.throws(()=>runOfflinePurge(dir,made.projectId,{offline:true,confirmName:made.name}),{code:'PURGE_UNKNOWN_REFERENCE'});
  else assert.equal(runOfflinePurge(dir,made.projectId,{offline:true,confirmName:made.name}).state,'completed');
  assert.equal(readFileSync(made.keep,'utf8'),'keep');assert.equal(readFileSync(made.external,'utf8'),'outside');
 }finally{rmSync(dir,{recursive:true,force:true});rmSync(outside,{recursive:true,force:true});}
});
test('branch preserves historical truncation and description without native execution bindings',()=>{
 const dir=temporary(),app=new ResearchApp(dir,process.cwd());try{
  const p=app.projects.create(USER,{name:'Branch',template:'empty'}),s=app.sessions.create(USER,p.id,{});
  const m=app.store.create('message',p.id,{sessionId:s.id,role:'assistant',phase:'final_answer',toolCalls:['read'],content:'x'.repeat(32000),contentTruncated:true,nativeRequestId:'private-request',permission:{epoch:3},approvalNoticeId:'approval',nativeAttachmentContextIds:['private-context'],mode:'prompt',status:'completed'});
  const b=app.sessions.branch(USER,s.id,m.id),copy=app.sessions.messages(USER,b.id)[0];
  assert.equal(app.sessions.messageRead(USER,b.id,{messageId:copy.id}).sourceTruncated,true);
  assert.equal(copy.phase,'final_answer');assert.deepEqual(copy.toolCalls,['read']);assert.deepEqual(copy.branchSource,{sessionId:s.id,messageId:m.id});
  for(const key of ['nativeRequestId','permission','approvalNoticeId','nativeAttachmentContextIds'])assert.equal(copy[key],undefined);
  const view=app.sessions.view(USER,b.id);assert.deepEqual(view.messages[0].branchSource,copy.branchSource);validateSchema(SESSION_HISTORY_OUTPUT_SCHEMAS.session_view,view,'output');
  assert.throws(()=>app.sessions.messageRead(USER,b.id,{messageId:m.id}),{code:'SCOPE_DENIED'});
 }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});
for(const changed of ['hidden-file','empty-backup','journal','revoked-source'])test(`source crash recovery refuses ${changed} without losing files or renewing approval`,()=>{
 const dir=temporary();let app;try{
  const child=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),dir,'after-install'],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(child.status,86,child.stderr);
  const m=JSON.parse(readFileSync(join(dir,'test-source.json'),'utf8')),marker=m.workspace+'.source-prepare-pending',parent=resolve(m.workspace,'..');
  if(changed==='hidden-file')writeFileSync(join(m.workspace,'.env'),'user-owned');
  if(changed==='empty-backup'){const backup=join(parent,readdirSync(parent).find(n=>n.startsWith('workspace-empty-')));renameSync(backup,backup+'-retained');mkdirSync(backup);}
  if(changed==='journal'){const envelope=JSON.parse(readFileSync(marker,'utf8'));envelope.data=envelope.data.replace('sourceDigest','tamperedDigest');writeFileSync(marker,JSON.stringify(envelope));}
  app=new ResearchApp(dir,process.cwd());
  if(changed==='revoked-source'){const e=app.store.get('experiment',m.experimentId);app.store.update('experiment',e.id,e.version,{lifecycle:'archived'});}
  assert.throws(()=>app.sources.prepare(USER,m.projectId,m.sessionId,{experimentId:m.experimentId,revision:1}),{code:changed==='revoked-source'?'EXPERIMENT_ARCHIVED':'SOURCE_PREPARE_RECOVERY_CONFLICT'});
  assert.equal(app.store.get('session',m.sessionId).sourceRevisionId,undefined);assert.ok(existsSync(join(m.workspace,'config.json')));assert.ok(existsSync(marker));
  if(changed==='hidden-file')assert.equal(readFileSync(join(m.workspace,'.env'),'utf8'),'user-owned');
 }finally{app?.close();rmSync(dir,{recursive:true,force:true});}
});
test('source preparation committed before hard exit only cleans its verified empty backup and keeps later edits',()=>{
 const dir=temporary();let app;try{
  const child=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),dir,'after-commit'],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(child.status,86,child.stderr);
  const m=JSON.parse(readFileSync(join(dir,'test-source.json'),'utf8'));writeFileSync(join(m.workspace,'config.json'),'later edit');app=new ResearchApp(dir,process.cwd());
  assert.ok(app.store.get('session',m.sessionId).sourceRevisionId);
  assert.equal(app.sources.prepare(USER,m.projectId,m.sessionId,{experimentId:m.experimentId,revision:1}).prepared,false);
  assert.equal(readFileSync(join(m.workspace,'config.json'),'utf8'),'later edit');assert.equal(existsSync(m.workspace+'.source-prepare-pending'),false);
 }finally{app?.close();rmSync(dir,{recursive:true,force:true});}
});
test('offline purge refuses an unfinished source directory recovery',()=>{
 const dir=temporary();try{
  const crashed=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),dir,'after-install'],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(crashed.status,86,crashed.stderr);
  const m=JSON.parse(readFileSync(join(dir,'test-source.json'),'utf8'));
  const requested=spawnSync(process.execPath,['--input-type=module','-e',`import {ResearchApp} from './dist/packages/research-app.js';const [dir,id]=process.argv.slice(1),app=new ResearchApp(dir,process.cwd()),user={type:'user'},p=app.store.get('project',id),trashed=app.projects.trash(user,id,p.version);app.projects.purge(user,id,{expectedVersion:trashed.version,confirmName:p.name},'purge-pending-source');app.close();`,dir,m.projectId],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(requested.status,0,requested.stderr);
  assert.throws(()=>runOfflinePurge(dir,m.projectId,{offline:true,confirmName:'Source crash recovery'}),{code:'PURGE_BUSY'});
  assert.ok(existsSync(m.workspace+'.source-prepare-pending'));assert.ok(existsSync(join(m.workspace,'config.json')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
for(const point of ['before-swap','after-empty','after-install',...(process.platform==='win32'?['after-modes']:[])])test(`source prepare recovers hard exit ${point} on reopen and retry`,()=>{
 const dir=temporary();let app;try{
  const child=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),dir,point],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(child.status,86,child.stderr);
  const m=JSON.parse(readFileSync(join(dir,'test-source.json'),'utf8'));app=new ResearchApp(dir,process.cwd());
  assert.equal(app.store.get('session',m.sessionId).sourceRevisionId,undefined);
  const result=app.sources.prepare(USER,m.projectId,m.sessionId,{experimentId:m.experimentId,revision:1});assert.equal(result.prepared,true);
  assert.equal(app.store.get('session',m.sessionId).sourceRevisionId,result.snapshotId);assert.ok(readdirSync(m.workspace).length>0);
  assert.equal(app.sources.prepare(USER,m.projectId,m.sessionId,{experimentId:m.experimentId,revision:1}).prepared,false);
  assert.equal(existsSync(m.workspace+'.source-prepare-pending'),false);
 }finally{app?.close();rmSync(dir,{recursive:true,force:true});}
});
test('source crash recovery refuses user edits and preserves their bytes',()=>{
 const dir=temporary();let app;try{
  const child=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),dir,'after-install'],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(child.status,86,child.stderr);
  const m=JSON.parse(readFileSync(join(dir,'test-source.json'),'utf8'));writeFileSync(join(m.workspace,'config.json'),'user change');app=new ResearchApp(dir,process.cwd());
  assert.throws(()=>app.sources.prepare(USER,m.projectId,m.sessionId,{experimentId:m.experimentId,revision:1}),{code:'SOURCE_PREPARE_RECOVERY_CONFLICT'});
  assert.equal(readFileSync(join(m.workspace,'config.json'),'utf8'),'user change');assert.equal(app.store.get('session',m.sessionId).sourceRevisionId,undefined);
 }finally{app?.close();rmSync(dir,{recursive:true,force:true});}
});
test('source binding failure restores exact preexisting mode metadata bytes',()=>{
 const dir=temporary(),app=new ResearchApp(dir,process.cwd());try{
  const p=app.projects.create(USER,{name:'Rollback',template:'curve-fit'}),s=app.sessions.create(USER,p.id,{}),e=app.experiments.create(USER,p.id,{title:'Baseline'}),workspace=app.store.paths.physical(s.workspace),before=Buffer.from('{\n "kept.sh": "100755"\n}');
  writeFileSync(workspace+'.source-modes.json',before);const event=app.store.event.bind(app.store);
  app.store.event=(pid,type,payload)=>{if(type==='workspace.source_prepared')throw Error('injected binding failure');return event(pid,type,payload);};
  assert.throws(()=>app.sources.prepare(USER,p.id,s.id,{experimentId:e.id,revision:1}),/injected binding failure/);
  assert.deepEqual(readFileSync(workspace+'.source-modes.json'),before);assert.deepEqual(readdirSync(workspace),[]);
 }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});
