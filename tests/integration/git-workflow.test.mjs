import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chmodSync, existsSync, lstatSync, readFileSync, readdirSync, unlinkSync, writeFileSync, rmdirSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setup, USER} from '../support/research.mjs';
import {GitCommand, gitEnvironment} from '../../dist/packages/workspace/git-command.js';
import {digest} from '../../dist/packages/storage/store.js';
import {snapshotDirectory} from '../../dist/packages/workspace/files.js';

const operation = (s, name, input = {}, sessionId = s.session.id, key = randomUUID()) =>
 s.app.operations.execute(USER, name, input, {projectId:s.project.id, sessionId, idempotencyKey:key});
const write = (s, path, content, sessionId = s.session.id) => operation(s, 'workspace_write', {path, content, expectedDigest:null}, sessionId);
const history = (s, sessionId = s.session.id) => operation(s, 'workspace_history_inspect', {}, sessionId);
const revision = (s, experiment = s.baseline) => s.app.store.get('source-revision', digest({projectId:s.project.id, experimentId:experiment.id, revision:experiment.revision}));
const physical = (s, reference) => s.app.store.paths.physical(reference);
const parents = (repo, commit) => execFileSync('git', ['--git-dir', repo.repoPath, 'rev-list', '--parents', '-n', '1', commit], {env:gitEnvironment(), windowsHide:true, encoding:'utf8'}).trim().split(' ').slice(1);
async function ready(s, sessionId = s.session.id) {
 const prepared = s.app.sources.prepare(USER, s.project.id, sessionId, {experimentId:s.baseline.id, revision:1});
 assert.equal(prepared.gitState, 'pending');
 await s.app.git.drain();
 const state = history(s, sessionId);
 assert.equal(state.state, 'ready', JSON.stringify(state));
 return s.app.sessions.get(USER, sessionId);
}
async function close(s) {
 await s.app.git.stop();
 // Git objects and CAS files can be read-only on Windows; only this fixture is touched.
 const writable = root => {for (const entry of readdirSync(root, {withFileTypes:true})) {const path=join(root,entry.name);if(entry.isSymbolicLink())continue;if(entry.isDirectory())writable(path);else chmodSync(path,0o600);}};
 writable(s.dir);
 s.close();
}

test('explicit Git opt-in gates pending tools and prepares two independent real worktrees', async () => {
 const s=setup();
 try {
  assert.equal(Boolean(s.app.store.get('project',s.project.id).gitHistoryEnabled),false);
  assert.equal(s.app.store.list('git-operation',s.project.id).length,0);
  assert.equal(history(s).state,'unbound');
  assert.equal(s.app.git.enable(USER,s.project.id).enabled,true);
  const original=physical(s,s.session.workspace);
  const prepared=s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});
  assert.equal(prepared.gitState,'pending');
  assert.equal(history(s).state,'pending');
  assert.equal(operation(s,'workspace_history_operation',{operationId:prepared.gitOperationId}).state,'queued');
  assert.throws(()=>write(s,'blocked.txt','must not appear'),{code:'WORKSPACE_NOT_READY'});
  assert.throws(()=>s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','main.py'],environmentImageDigest:`python@sha256:${'a'.repeat(64)}`}),{code:'WORKSPACE_NOT_READY'});
  assert.equal(existsSync(join(original,'blocked.txt')),false);
  const second=s.app.sessions.create(USER,s.project.id,{title:'Independent implementation'});
  s.app.sources.prepare(USER,s.project.id,second.id,{experimentId:s.baseline.id,revision:1});
  await s.app.git.drain();
  const firstReady=s.app.sessions.get(USER,s.session.id),secondReady=s.app.sessions.get(USER,second.id);
  const firstWorkspace=physical(s,firstReady.workspace),secondWorkspace=physical(s,secondReady.workspace);
  assert.notEqual(firstWorkspace,original);
  assert.notEqual(firstWorkspace,secondWorkspace);
  assert.ok(lstatSync(join(firstWorkspace,'.git')).isFile());
  const repo=new GitCommand(s.dir,s.project.id),firstGit=await repo.inspectWorktree(firstWorkspace),secondGit=await repo.inspectWorktree(secondWorkspace);
  assert.equal(firstGit.head,secondGit.head);
  assert.notEqual(firstGit.branch,secondGit.branch);
  assert.equal(firstGit.dirty,false);
  assert.equal(secondGit.dirty,false);
  write(s,'private.txt','first session only');
  assert.equal(existsSync(join(secondWorkspace,'private.txt')),false);
  assert.equal(existsSync(join(physical(s,s.baseline.workspace),'private.txt')),false);
  assert.equal(operation(s,'workspace_history_operation',{operationId:prepared.gitOperationId}).state,'complete');
 } finally {await close(s);}
});

test('Registry diff and commit retain ignored, untracked, deleted and executable-mode changes in Git objects', async () => {
 const s=setup();
 try {
  s.app.git.enable(USER,s.project.id);
  const session=await ready(s),before=history(s),source=revision(s),sourceBefore=structuredClone(source);
  write(s,'.gitignore','ignored.txt\n');
  write(s,'ignored.txt','ignored is still source\n');
  write(s,'untracked.txt','untracked is still source\n');
  unlinkSync(join(physical(s,session.workspace),'README.md'));
  const firstDiff=operation(s,'workspace_history_diff');
  const mode=operation(s,'workspace_history_set_mode',{path:'experiment.mjs',mode:'100755',expectedSourceDigest:firstDiff.sourceDigest});
  assert.equal(mode.mode,'100755');
  const diff=operation(s,'workspace_history_diff'),files=new Map(diff.files.map(f=>[f.path,f]));
  assert.equal(files.get('ignored.txt').status,'added');
  assert.equal(files.get('untracked.txt').status,'added');
  assert.equal(files.get('README.md').status,'deleted');
  assert.equal(files.get('experiment.mjs').beforeMode,'100644');
  assert.equal(files.get('experiment.mjs').afterMode,'100755');
  assert.equal(files.get('experiment.mjs').beforeDigest,files.get('experiment.mjs').afterDigest);
  const key=randomUUID(),input={expectedHead:before.head,message:'Save exact implementation including ignored files'};
  const queued=operation(s,'workspace_history_commit',input,s.session.id,key);
  assert.equal(queued.state,'queued');
  assert.equal(operation(s,'workspace_history_commit',input,s.session.id,key).operationId,queued.operationId);
  assert.throws(()=>write(s,'during-commit.txt','blocked'),{code:'WORKSPACE_NOT_READY'});
  await s.app.git.drain();
  const completed=operation(s,'workspace_history_operation',{operationId:queued.operationId});
  assert.equal(completed.state,'complete',JSON.stringify(completed));
  assert.notEqual(completed.gitCommit,before.head);
  const repo=new GitCommand(s.dir,s.project.id),tree=new Map((await repo.tree(completed.gitCommit)).map(f=>[f.path,f]));
  assert.deepEqual(parents(repo,completed.gitCommit),[before.head]);
  assert.equal(await repo.ref(`refs/pi/operations/${queued.operationId}`),completed.gitCommit);
  assert.equal(tree.get('experiment.mjs').mode,'100755');
  assert.equal(tree.has('README.md'),false);
  assert.equal((await repo.readBlob(tree.get('ignored.txt').oid)).toString(),'ignored is still source\n');
  assert.equal((await repo.readBlob(tree.get('untracked.txt').oid)).toString(),'untracked is still source\n');
  assert.deepEqual(operation(s,'workspace_history_diff').files,[]);
  assert.deepEqual(s.app.store.get('source-revision',source.id),sourceBefore);
  assert.equal(await repo.ref(`refs/pi/source/${source.id}`),before.head);
 } finally {await close(s);}
});

test('real Git receipt recovers SQL publication failure without a second commit and preserves legacy CAS ancestry', async () => {
 const s=setup();
 try {
  const original=revision(s),legacySnapshot=snapshotDirectory(physical(s,s.baseline.workspace),join(s.dir,'snapshots'),{legacy:true});
  const legacy=s.app.store.update('source-revision',original.id,original.version,{snapshot:legacySnapshot,sourceDigest:legacySnapshot.digest});
  assert.ok(legacy.snapshot.files.every(f=>f.mode===undefined));
  const legacyRecord=structuredClone(legacy),legacyBytes=legacy.snapshot.files.map(f=>[f.path,readFileSync(join(physical(s,legacy.snapshot.path),f.path))]);
  s.app.git.enable(USER,s.project.id);
  await ready(s);
  const initial=history(s),repo=new GitCommand(s.dir,s.project.id);
  write(s,'recovery.txt','recover the same immutable commit\n');
  const queued=operation(s,'workspace_history_commit',{expectedHead:initial.head,message:'Recover SQL publication'});
  const event=s.app.store.event.bind(s.app.store);
  let injected=0;
  s.app.store.event=(pid,type,payload)=>{if(type==='git.operation_completed'&&payload.operationId===queued.operationId){injected++;throw new Error('Injected SQL publication failure after real Git');}return event(pid,type,payload);};
  try {await s.app.git.drain();} finally {s.app.store.event=event;}
  assert.equal(injected,1);
  assert.equal(operation(s,'workspace_history_operation',{operationId:queued.operationId}).state,'failed');
  const receipt=await repo.ref(`refs/pi/operations/${queued.operationId}`);
  assert.ok(receipt);
  assert.equal(await repo.ref(initial.branch),receipt);
  assert.deepEqual(parents(repo,receipt),[initial.head]);
  assert.equal(s.app.git.retry(USER,s.project.id,queued.operationId).state,'queued');
  await s.app.git.drain();
  const recovered=operation(s,'workspace_history_operation',{operationId:queued.operationId});
  assert.equal(recovered.state,'complete',JSON.stringify(recovered));
  assert.equal(recovered.gitCommit,receipt);
  assert.equal(history(s).head,receipt);
  assert.deepEqual(parents(repo,receipt),[initial.head]);
  assert.equal(s.app.store.list('git-operation',s.project.id).filter(o=>o.action==='commit').length,1);
  const child=s.app.experiments.create(USER,s.project.id,{title:'Child source',hypothesis:'Preserve source ancestry',parentId:s.baseline.id,config:{polynomialDegree:2}}),childRevision=revision(s,child);
  const sourceOp=s.app.store.list('git-operation',s.project.id).find(o=>o.action==='source'&&o.sourceRevisionId===childRevision.id);
  assert.equal(sourceOp.parentSourceRevisionId,legacy.id);
  await s.app.git.drain();
  const childBinding=s.app.store.get('git-source-binding',childRevision.id),legacyBinding=s.app.store.get('git-source-binding',legacy.id);
  assert.deepEqual(parents(repo,childBinding.gitCommit),[legacyBinding.gitCommit]);
  assert.equal(legacyBinding.originalCreatedAt,legacy.createdAt);
  assert.equal(legacyBinding.sourceDigest,legacy.sourceDigest);
  assert.deepEqual(s.app.store.get('source-revision',legacy.id),legacyRecord);
  for(const [path,bytes] of legacyBytes)assert.deepEqual(readFileSync(join(physical(s,legacy.snapshot.path),path)),bytes);
 } finally {await close(s);}
});

test('dirty directory-to-file changes survive an interrupted unpublished checkout and explicit recovery',async()=>{
 const s=setup(),add=GitCommand.prototype.addWorktree;
 try {
  s.app.experiments.writeFile(USER,s.baseline.id,'pkg/a.py','print(1)\n',null,s.baseline.version);
  s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:2});
  const sessionWorkspace=physical(s,s.session.workspace);
  unlinkSync(join(sessionWorkspace,'pkg','a.py'));rmdirSync(join(sessionWorkspace,'pkg'));writeFileSync(join(sessionWorkspace,'pkg'),'user changed a directory into a file\n');
  s.app.git.enable(USER,s.project.id);
  let interrupted=false;
  GitCommand.prototype.addWorktree=async function(...args){const result=await add.apply(this,args);if(!interrupted){interrupted=true;unlinkSync(join(args[0],'pkg','a.py'));throw new Error('Interrupted partial checkout before snapshot restore');}return result;};
  await s.app.git.drain();GitCommand.prototype.addWorktree=add;
  const pending=history(s);assert.equal(pending.state,'failed');
  s.app.git.retry(USER,s.project.id,pending.operationId);await s.app.git.drain();
  assert.equal(history(s).state,'ready',JSON.stringify(history(s)));
  const migrated=s.app.sessions.get(USER,s.session.id);
  assert.equal(readFileSync(join(physical(s,migrated.workspace),'pkg'),'utf8'),'user changed a directory into a file\n');
  assert.equal(readFileSync(join(physical(s,s.session.workspace),'pkg'),'utf8'),'user changed a directory into a file\n');
  const changes=operation(s,'workspace_history_diff').files;assert.ok(changes.some(f=>f.path==='pkg'&&f.status==='added'));assert.ok(changes.some(f=>f.path==='pkg/a.py'&&f.status==='deleted'));
 }finally{GitCommand.prototype.addWorktree=add;await close(s);}
});
