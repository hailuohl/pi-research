import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,renameSync,rmSync,existsSync,chmodSync,readdirSync,symlinkSync,realpathSync,truncateSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {execFileSync,spawn} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {ResearchApp} from '../../dist/packages/research-app.js';import {USER} from '../../dist/packages/domain/types.js';
import {createDataBackup,verifyDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {digest} from '../../dist/packages/storage/store.js';import {readSourceMode,setSourceMode} from '../../dist/packages/workspace/files.js';
import {createHttpServer} from '../../dist/apps/server/http.js';import {gitEnvironment} from '../../dist/packages/workspace/git-command.js';
import {WorkspaceLeases} from '../../dist/packages/workspace/leases.js';
import {approve,waitRun} from '../support/research.mjs';
import {publicationFixture,publicationPng} from '../support/publication.mjs';
import {teamWakeupSource,wakeupId} from '../../dist/packages/scheduler/wakeups.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
function fixture(){const parent=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-backup-')),data=join(parent,'data'),app=new ResearchApp(data,process.cwd()),project=app.projects.create(USER,{name:'本地备份夹具',template:'curve-fit'}),session=app.sessions.create(USER,project.id,{title:'保留的会话'});app.sessions.system(session.id,'软件备份夹具，不是模型结果');const artifact=app.evidence.put(project.id,'原文',Buffer.from('固定证据\n'));const experiment=app.experiments.create(USER,project.id,{title:'保留源码'}),intent=app.runs.prepare(USER,experiment.id);return {parent,data,app,project,session,artifact,experiment,intent,backup:join(parent,'backup'),close(){this.app.close();rmSync(parent,{recursive:true,force:true});}};}
function records(data){const db=new DatabaseSync(join(data,'state.db'),{readOnly:true});try{return db.prepare('SELECT kind,id,version,data FROM records ORDER BY kind,id').all();}finally{db.close();}}
function rewriteManifest(path,fn){const file=join(path,'manifest.json'),m=JSON.parse(readFileSync(file));fn(m);delete m.manifestDigest;m.manifestDigest=digest(m);writeFileSync(file,JSON.stringify(m));}
function treeSnapshot(root){const entries={};function walk(path,key){for(const entry of readdirSync(path,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const name=key?key+'/'+entry.name:entry.name,file=join(path,entry.name);entries[name]=entry.isDirectory()?null:digest(readFileSync(file));if(entry.isDirectory())walk(file,name);}}walk(root,'');return entries;}
function writeRecord(s,kind,id,value){s.app.store.db.prepare('UPDATE records SET data=? WHERE kind=? AND id=?').run(JSON.stringify(value),kind,id);}
const physical = (s, reference) => s.app.store.paths.physical(reference);

function figureReportFixture(s){
 writeFileSync(join(physical(s,s.session.workspace),'plot.py'),'# UNIT frozen figure source');
 const input=s.app.evidence.put(s.project.id,'figure-input.csv',Buffer.from('x,y\n1,2\n'),'text/csv');
 const task=s.app.development.prepare(USER,s.project.id,s.session.id,{command:['python','plot.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64),dataArtifactIds:[input.id],expectedArtifacts:['figure.png']});
 approve(s.app,task.grantId);const submitted=s.app.development.submit(USER,s.project.id,task.id),job=s.app.store.get('sandbox-job',submitted.id);
 writeFileSync(join(physical(s,job.outputDir),'figure.png'),publicationPng);
 const completed=s.app.development.finalize(job.id,{state:'succeeded',exitCode:0}),figure=completed.artifactIds.map(id=>s.app.store.get('artifact',id)).find(a=>a.title==='output/figure.png');
 const publication=publicationFixture(s.app,s.project.id,{files:[{path:'figure.png',artifactId:figure.id}]}),saved=s.app.reports.create(USER,s.project.id,{publicationResultIds:[publication.result.id]}),report=s.app.store.list('report',s.project.id).find(r=>r.artifactId===saved.id);
 assert.equal(report.bindings.figureSources[0].dataArtifacts[0].id,input.id);assert.equal('path' in report.bindings.figureSources[0].dataArtifacts[0],false);
 return {input,report};
}

test('offline backup excludes SSH private target configuration and retains supported migration history',async()=>{
 const s=fixture();try{writeFileSync(join(s.data,'ssh-targets.json'),JSON.stringify({fixture:{identityFile:'private-identity-path',knownHostsFile:'private-hostkeys-path',remoteRoot:'/private/remote/root'}}));s.app.close();
  const created=await createDataBackup(s.data,s.backup,{offline:true});assert.ok(created.excluded.includes('ssh-targets.json'));assert.equal(existsSync(join(s.backup,'data','ssh-targets.json')),false);assert.ok(created.schema.includes(10));assert.equal((await verifyDataBackup(s.backup)).manifestDigest,created.manifestDigest);
 }finally{s.close();}
});

test('schema 11 backup excludes local runtime configuration and preserves terminal GPU fixture history after relocation',async()=>{
 const s=fixture();let restored;
 try{
  const runtime=s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0}),uuid='GPU-11111111-1111-1111-1111-111111111111';
  // Storage fixture only: this test neither probes a GPU nor represents measured GPU output.
  s.app.store.create('gpu-target',null,{target:{backend:'local',targetId:runtime.hostId,observedAt:new Date().toISOString(),devices:[{uuid,name:'storage fixture',memoryMb:1024}]}},'backup-gpu-fixture');
  const experiment=s.app.experiments.create(USER,s.project.id,{title:'GPU storage fixture',contract:{runner:'local',localRuntimeId:'node',command:['node','experiment.mjs'],environment:{},datasetVersion:'storage-fixture',evaluationProtocolVersion:'storage-fixture',metrics:{value:{unit:'fixture',direction:'max'}},expectedArtifacts:['metrics.json'],networkPolicy:'host',gpu:{vendor:'nvidia',deviceIds:[uuid]},timeoutSeconds:10,cpus:1,memoryMb:128}});
  const intent=s.app.runs.prepare(USER,experiment.id);approve(s.app,intent.approvalId);const queued=s.app.runs.submit(USER,intent.id);
  const claimed=s.app.compute.withAdmission('run',queued.id,()=>s.app.store.update('run',queued.id,queued.version,{state:'running',execution:{...queued.execution,generation:1,startRequested:true,leaseUntil:Date.now()+60000}}));
  assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,1);
  const control=physical(s,claimed.execution.controlDir);mkdirSync(control,{recursive:true});writeFileSync(join(control,'stdout.log'),'storage fixture, no GPU executed\n');writeFileSync(join(control,'stderr.log'),'');writeFileSync(join(physical(s,claimed.outputDir),'metrics.json'),'{"value":42}');
  const done=s.app.runs.finalize(claimed.id,0,'succeeded','storage fixture',{generation:1,state:'succeeded',exitCode:0,incomplete:false,logTruncated:false,outputExceeded:false});assert.equal(done.integrity,'complete');assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,0);
  const frozen=JSON.stringify(done.manifest),artifacts=done.artifactIds.map(id=>({id,bytes:s.app.evidence.read(USER,id).bytes}));writeFileSync(join(s.data,'local-runtimes.json.tmp'),'private pending path');s.app.close();
  const created=await createDataBackup(s.data,s.backup,{offline:true});assert.ok(created.schema.includes(11));for(const path of ['local-runtimes.json','local-runtimes.json.tmp']){assert.ok(created.excluded.includes(path));assert.equal(existsSync(join(s.backup,'data',path)),false);}
  const destination=join(s.parent,'relocated');await restoreDataBackup(s.backup,destination,{offline:true,relocate:true});restored=new ResearchApp(destination,process.cwd());assert.deepEqual(restored.localRuntimes.list(),[]);const historical=restored.runs.get(USER,done.id);assert.equal(JSON.stringify(historical.manifest),frozen);assert.equal(historical.manifestDigest,done.manifestDigest);assert.deepEqual(historical.metrics,{value:42});assert.ok(restored.runs.sourceList(USER,done.id).files.length);assert.match(restored.runs.logs(USER,done.id).content,/storage fixture/);for(const a of artifacts)assert.deepEqual(restored.evidence.read(USER,a.id).bytes,a.bytes);assert.equal(restored.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,0);
 }finally{restored?.close();s.close();}
});

test('offline backup refuses an unreconciled GPU claim without deleting it or publishing a backup',async()=>{
 const s=fixture();try{s.app.store.db.prepare('INSERT INTO compute_gpu_claims(uuid,kind,id) VALUES(?,?,?)').run('GPU-11111111-1111-1111-1111-111111111111','run','unreconciled-fixture');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_BUSY'});assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM compute_gpu_claims').get().n,1);assert.equal(existsSync(s.backup),false);}finally{s.close();}
});

test('offline backup resolves report figure inputs from their fixed artifact IDs',async()=>{
 const s=fixture();try{figureReportFixture(s);s.app.close();const created=await createDataBackup(s.data,s.backup,{offline:true});assert.equal((await verifyDataBackup(s.backup)).manifestDigest,created.manifestDigest);}finally{s.close();}
});

test('offline backup rejects missing, cross-project, malformed or changed report figure inputs',async()=>{
 const s=fixture();try{
  const {input,report}=figureReportFixture(s),otherProject=s.app.projects.create(USER,{name:'同摘要的另一项目'}),other=s.app.evidence.put(otherProject.id,'same-input.csv',Buffer.from('x,y\n1,2\n'),'text/csv');
  const originalArtifact=s.app.store.get('artifact',input.id),originalJob=s.app.store.list('sandbox-job')[0],missingManifestPath=structuredClone(originalJob),directManifestArtifact=structuredClone(originalJob),nestedManifestArtifact=structuredClone(originalJob);delete missingManifestPath.manifest.dataArtifacts[0].path;directManifestArtifact.manifest.dataArtifacts={...directManifestArtifact.manifest.dataArtifacts[0]};delete directManifestArtifact.manifest.dataArtifacts.path;nestedManifestArtifact.manifest.dataArtifacts=[[{id:input.id,digest:input.digest,size:input.size}]];
  const bindingOf=r=>r.bindings.figureSources[0].dataArtifacts[0],cases=[
   ['missing ID','BACKUP_REFERENCE_INVALID',r=>{delete bindingOf(r).id;}],
   ['empty ID','BACKUP_REFERENCE_INVALID',r=>{bindingOf(r).id='';}],
   ['missing artifact','BACKUP_REFERENCE_MISSING',r=>{bindingOf(r).id='missing-artifact';}],
   ['same digest from another project','BACKUP_REFERENCE_INVALID',r=>Object.assign(bindingOf(r),{id:other.id,digest:other.digest,size:other.size})],
   ['invalid digest format','BACKUP_REFERENCE_INVALID',r=>{bindingOf(r).digest='A'.repeat(64);}],
   ['changed digest','BACKUP_CONTENT_MISMATCH',r=>{bindingOf(r).digest='b'.repeat(64);}],
   ['invalid size','BACKUP_REFERENCE_INVALID',r=>{bindingOf(r).size=-1;}],
   ['changed size','BACKUP_CONTENT_MISMATCH',r=>{bindingOf(r).size++;}],
   ['null path','BACKUP_REFERENCE_INVALID',r=>{bindingOf(r).path=null;}],
   ['empty path','STORAGE_PATH_INVALID',r=>{bindingOf(r).path='';}],
   ['non-string path','BACKUP_REFERENCE_INVALID',r=>{bindingOf(r).path=7;}],
   ['missing dataArtifacts','BACKUP_REFERENCE_INVALID',r=>{delete r.bindings.figureSources[0].dataArtifacts;}],
   ['non-array dataArtifacts','BACKUP_REFERENCE_INVALID',r=>{r.bindings.figureSources[0].dataArtifacts={};}],
   ['non-object dataArtifacts entry','BACKUP_REFERENCE_INVALID',r=>{r.bindings.figureSources[0].dataArtifacts=[null];}],
   ['non-array figureSources','BACKUP_REFERENCE_INVALID',r=>{r.bindings.figureSources={};}],
   ['non-object figureSources entry','BACKUP_REFERENCE_INVALID',r=>{r.bindings.figureSources=[null];}],
   ['artifact JSON ID mismatch','BACKUP_REFERENCE_INVALID',null,{artifact:{...originalArtifact,id:'forged-id'}}],
   ['artifact JSON project mismatch','BACKUP_REFERENCE_INVALID',null,{artifact:{...originalArtifact,projectId:otherProject.id}}],
   ['artifact SQL project mismatch','BACKUP_REFERENCE_INVALID',null,{sqlProject:['artifact',otherProject.id]}],
   ['report JSON project mismatch','BACKUP_REFERENCE_INVALID',r=>{r.projectId=otherProject.id;}],
   ['report SQL project mismatch','BACKUP_REFERENCE_INVALID',null,{sqlProject:['report',otherProject.id]}],
   ['missing execution manifest artifact path','BACKUP_REFERENCE_INVALID',null,{job:missingManifestPath}],
   ['pathless direct manifest artifact','BACKUP_REFERENCE_INVALID',null,{job:directManifestArtifact}],
   ['nested pathless execution manifest artifact','BACKUP_REFERENCE_INVALID',null,{job:nestedManifestArtifact}],
  ];
  for(const [name,code,mutate,extra={}] of cases){
   const changed=structuredClone(report);if(mutate)mutate(changed);writeRecord(s,'report',report.id,changed);if(extra.artifact)writeRecord(s,'artifact',input.id,extra.artifact);if(extra.job)writeRecord(s,'sandbox-job',originalJob.id,extra.job);if(extra.sqlProject)s.app.store.db.prepare('UPDATE records SET project_id=? WHERE kind=? AND id=?').run(extra.sqlProject[1],extra.sqlProject[0],extra.sqlProject[0]==='report'?report.id:input.id);
   try{await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code},name);assert.equal(existsSync(s.backup),false,name);}
   finally{writeRecord(s,'report',report.id,report);writeRecord(s,'artifact',input.id,originalArtifact);if(extra.job)writeRecord(s,'sandbox-job',originalJob.id,originalJob);if(extra.sqlProject)s.app.store.db.prepare('UPDATE records SET project_id=? WHERE kind=? AND id=?').run(extra.sqlProject[0]==='report'?report.projectId:input.projectId,extra.sqlProject[0],extra.sqlProject[0]==='report'?report.id:input.id);}
  }
  const artifactPath=physical(s,originalArtifact.path),bytes=readFileSync(artifactPath);chmodSync(artifactPath,0o600);writeFileSync(artifactPath,'changed entity bytes');
  try{await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_CONTENT_MISMATCH'});assert.equal(existsSync(s.backup),false);}
  finally{writeFileSync(artifactPath,bytes);}
 }finally{s.close();}
});

test('offline backup and original-path restore retain SQLite history, native bytes, real Git worktree and logical modes',async()=>{
 const s=fixture();let server;try{
  const a=s.app.store.get('approval',s.intent.approvalId);s.app.approvals.decide(USER,a.id,a.version,true);const run=s.app.runs.submit(USER,s.intent.id);assert.equal((await waitRun(s,run.id)).state,'succeeded');
  s.app.git.enable(USER,s.project.id);s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.experiment.id,revision:1});await s.app.git.drain();await s.app.git.stop();
  for(const lease of s.app.store.list('workspace-lease'))if(lease.until>Date.now())new WorkspaceLeases(s.app.store).release(lease.projectId,lease.branch,lease.owner,lease.generation);
  const session=s.app.sessions.get(USER,s.session.id),sessionWorkspace=physical(s,session.workspace),projectWorkspace=physical(s,s.project.workspace),pi=join(s.data,'sessions',session.id,'pi');mkdirSync(pi,{recursive:true});const native=join(pi,'fixture.jsonl'),bytes=Buffer.from('{"type":"session","version":3,"id":"fixture","timestamp":"2026-09-29T00:00:00.000Z"}\n');writeFileSync(native,bytes);s.app.store.update('session',session.id,session.version,{piSessionPath:native,state:'failed'});
  s.app.store.create('message',s.project.id,{sessionId:session.id,status:'queued',role:'user',mode:'prompt',content:'旧失败会话中的未派发历史，必须保持且不能在重开时调用模型'});
  const agent=join(s.data,'sessions',session.id,'agent');mkdirSync(agent,{recursive:true});writeFileSync(join(agent,'auth.json'),'fixture credential excluded');writeFileSync(join(s.data,'access.token'),'old-token-'.repeat(8));writeFileSync(join(s.data,'models.json'),'fixture provider config excluded');
  setSourceMode(sessionWorkspace,'experiment.mjs','100755');mkdirSync(join(projectWorkspace,'empty'));const before=records(s.data),approval=s.app.store.get('approval',s.intent.approvalId),repo=join(s.data,'projects',s.project.id,'git','repository.git');
  const git=args=>execFileSync('git',['--git-dir',repo,...args],{windowsHide:true,env:gitEnvironment(),encoding:'utf8'}),refs=git(['show-ref']),binding=s.app.store.list('git-source-binding')[0];s.app.close();
  const object=join(repo,'objects',binding.gitCommit.slice(0,2),binding.gitCommit.slice(2)),objectBytes=readFileSync(object);chmodSync(object,0o600);rmSync(object);await assert.rejects(createDataBackup(s.data,join(s.parent,'missing-git'),{offline:true}),{code:'BACKUP_GIT_INVALID'});writeFileSync(object,objectBytes,{mode:0o444});
  const gitPointer=join(sessionWorkspace,'.git'),gitPointerBytes=readFileSync(gitPointer),replacePointer=bytes=>{writeFileSync(gitPointer,bytes,{flag:'r+'});truncateSync(gitPointer,bytes.length);};replacePointer(Buffer.from('gitdir: '+s.parent+'\n'));await assert.rejects(createDataBackup(s.data,join(s.parent,'external-git'),{offline:true}),{code:'BACKUP_EXTERNAL_REFERENCE'});replacePointer(gitPointerBytes);
  const created=await createDataBackup(s.data,s.backup,{offline:true});assert.ok(created.files>20);assert.deepEqual(records(s.data),before);assert.ok(created.excluded.includes('access.token'));assert.ok(created.excluded.some(x=>x.endsWith('/agent/')));assert.equal(existsSync(join(s.backup,'data','access.token')),false);
  assert.equal((await verifyDataBackup(s.backup)).manifestDigest,created.manifestDigest);renameSync(s.data,join(s.parent,'retained-original'));await restoreDataBackup(s.backup,s.data,{offline:true});assert.deepEqual(records(s.data),before);assert.deepEqual(readFileSync(native),bytes);assert.equal(readSourceMode(sessionWorkspace,'experiment.mjs'),'100755');assert.ok(existsSync(join(projectWorkspace,'empty')));assert.equal(git(['show-ref']),refs);git(['fsck','--full']);
  const check=new ResearchApp(s.data,process.cwd());let forks=0;const host=new AgentHost(check,{inspect:()=>({ready:true,code:'READY',message:'test readiness, never call provider'}),fork:()=>{forks++;throw Error('Unexpected model start');}});host.tick();await host.stop();check.close();assert.equal(forks,0);
  server=createHttpServer({dataDir:s.data,repoRoot:process.cwd(),port:0});const port=await server.listen();const response=await fetch(`http://127.0.0.1:${port}/api/projects`,{headers:{}});assert.equal(response.status,200);assert.ok((await response.json()).some(p=>p.id===s.project.id));await new Promise(r=>setTimeout(r,650));assert.deepEqual(server.app.store.get('approval',approval.id),approval);assert.deepEqual(records(s.data),before);assert.deepEqual(readFileSync(native),bytes);assert.equal(existsSync(join(s.data,'access.token')),false);assert.deepEqual(server.app.store.list('run').map(r=>r.id),[run.id]);
 }finally{if(server)await server.close();s.close();}
});

test('complete backups validate every retained skill revision blob, including missing or corrupt bodies',async()=>{
 const s=fixture();try{const revision=s.app.skills.import(USER,s.project.id,{packageId:'backup-guide',revisionTag:'v1',description:'backup fixture',roles:['coordinator'],license:null,requirements:{tools:[],backends:[],artifactIds:[]},files:[{path:'SKILL.md',contentBase64:Buffer.from('# retained skill\n').toString('base64')}]},'backup-skill-fixture');s.app.close();const path=join(s.data,'skill-blobs',revision.files[0].digest),bytes=readFileSync(path);chmodSync(path,0o600);rmSync(path);await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_REFERENCE_MISSING'});writeFileSync(path,'changed');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_CONTENT_MISMATCH'});writeFileSync(path,bytes);await createDataBackup(s.data,s.backup,{offline:true});const manifest=JSON.parse(readFileSync(join(s.backup,'manifest.json'))),entry=manifest.entries.find(e=>e.path==='skill-blobs/'+revision.files[0].digest);rmSync(join(s.backup,'data',entry.path));rewriteManifest(s.backup,m=>{m.entries=m.entries.filter(e=>e.path!==entry.path);});await assert.rejects(verifyDataBackup(s.backup),{code:'BACKUP_REFERENCE_MISSING'});}finally{s.close();}
});

test('offline backups refuse active or dispatchable work, pending recovery, unknown content and missing/external required refs',async()=>{
 const s=fixture();try{
  await assert.rejects(createDataBackup(s.data,s.backup,{offline:false}),{code:'BACKUP_OFFLINE_REQUIRED'});
  for(const [kind,value] of [['run',{state:'unknown'}],['team',{state:'active'}],['team',{state:'completed',autoSummarize:true}],['campaign',{state:'active',autoAnalyze:true}],['wakeup',{state:'pending',automatic:true}],['wakeup',{state:'pending',requested:true}],['model-http-request',{state:'queued'}],['message',{status:'queued'}],['workspace-lease',{until:Date.now()+60000}]]){
   const r=s.app.store.create(kind,s.project.id,value);await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_BUSY'});s.app.store.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,r.id);s.app.store.db.prepare('DELETE FROM compute_queue WHERE id=?').run(r.id);
  }
  const before=records(s.data),recovery=join(s.data,'state.db.text-writes');mkdirSync(recovery);writeFileSync(join(recovery,'pending.json'),'unresolved');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_RECOVERY_PENDING'});rmSync(recovery,{recursive:true});
  writeFileSync(join(s.data,'unknown-private.txt'),'preserve');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_UNKNOWN_CONTENT'});rmSync(join(s.data,'unknown-private.txt'));
  const artifactPath=physical(s,s.artifact.path),original=readFileSync(artifactPath);chmodSync(artifactPath,0o600);writeFileSync(artifactPath,'corrupt');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_CONTENT_MISMATCH'});writeFileSync(artifactPath,original);
  const persisted=s.app.store.db.prepare("SELECT data FROM records WHERE kind='project' AND id=?").get(s.project.id).data,p=JSON.parse(persisted);s.app.store.db.prepare('UPDATE records SET data=? WHERE kind=? AND id=?').run(JSON.stringify({...p,workspace:s.parent}),'project',p.id);await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_EXTERNAL_REFERENCE'});s.app.store.db.prepare('UPDATE records SET data=? WHERE kind=? AND id=?').run(persisted,'project',p.id);
  const projectWorkspace=physical(s,s.project.workspace);symlinkSync(s.parent,join(projectWorkspace,'escape'),'junction');await assert.rejects(createDataBackup(s.data,s.backup,{offline:true}),{code:'BACKUP_PATH_DENIED'});rmSync(join(projectWorkspace,'escape'));
  assert.deepEqual(records(s.data),before);assert.equal(existsSync(s.backup),false);
 }finally{s.close();}
});

test('a finished automatic summary is preserved, while a changed summary source still blocks backup',async()=>{
 const s=fixture();try{const team=s.app.store.create('team',s.project.id,{rootSessionId:s.session.id,state:'completed',autoSummarize:true,goal:'fixed goal',planVersion:1,directiveVersion:1});const source=teamWakeupSource(team,[]);s.app.store.create('wakeup',s.project.id,{...source,requested:false,state:'completed',attempts:1,maxAttempts:2},wakeupId(source));await createDataBackup(s.data,s.backup,{offline:true});s.app.store.update('team',team.id,team.version,{directiveVersion:2});await assert.rejects(createDataBackup(s.data,join(s.parent,'changed'),{offline:true}),{code:'BACKUP_BUSY'});}finally{s.close();}
});

test('restore rejects existing/different targets, corruption, missing files, forged traversal and credential entries',async()=>{
 const s=fixture();try{
  s.app.close();await createDataBackup(s.data,s.backup,{offline:true});await assert.rejects(restoreDataBackup(s.backup,s.data,{offline:true}),{code:'BACKUP_TARGET_EXISTS'});await assert.rejects(restoreDataBackup(s.backup,join(s.parent,'different'),{offline:true}),{code:'BACKUP_RELOCATION_UNSUPPORTED'});
  const manifest=readFileSync(join(s.backup,'manifest.json')),m=JSON.parse(manifest),file=m.entries.find(x=>x.type==='file'&&x.path.startsWith('artifacts/')),path=join(s.backup,'data',file.path),bytes=readFileSync(path);chmodSync(path,0o600);writeFileSync(path,'bad');await assert.rejects(verifyDataBackup(s.backup),{code:'BACKUP_CONTENT_MISMATCH'});writeFileSync(path,bytes);rmSync(path);await assert.rejects(verifyDataBackup(s.backup),{code:'BACKUP_CONTENT_MISMATCH'});writeFileSync(path,bytes);
  rewriteManifest(s.backup,m=>{m.entries.find(x=>x.path===file.path).path='../escape';});await assert.rejects(verifyDataBackup(s.backup),{code:'BACKUP_PATH_DENIED'});writeFileSync(join(s.backup,'manifest.json'),manifest);
  rewriteManifest(s.backup,m=>m.entries.push({path:'access.token',type:'file',mode:0o600,size:3,digest:digest('bad')}));await assert.rejects(verifyDataBackup(s.backup),{code:'BACKUP_INVALID'});writeFileSync(join(s.backup,'manifest.json'),manifest);assert.equal(existsSync(join(s.parent,'escape')),false);
 }finally{s.close();}
});

test('Windows backup rejects case-equivalent nested destinations before changing either tree',{skip:process.platform!=='win32'},async t=>{
 for(const operation of ['create','restore'])for(const upperInput of [false,true])await t.test(`${operation}, uppercase ${upperInput?'input':'destination'}`,async()=>{
  const s=fixture();try{
   s.app.close();await createDataBackup(s.data,s.backup,{offline:true});const original=operation==='create'?s.data:s.backup;
   const input=upperInput?original.toUpperCase():original,target=join(upperInput?original:original.toUpperCase(),'nested');
   const sourceBefore=treeSnapshot(s.data),backupBefore=treeSnapshot(s.backup),siblingsBefore=readdirSync(s.parent).sort();
   await assert.rejects(operation==='create'?createDataBackup(input,target,{offline:true}):restoreDataBackup(input,target,{offline:true,relocate:true}),{code:'BACKUP_PATH_DENIED'});
   assert.equal(existsSync(target),false);assert.deepEqual(readdirSync(s.parent).sort(),siblingsBefore);
   assert.deepEqual(treeSnapshot(s.data),sourceBefore);assert.deepEqual(treeSnapshot(s.backup),backupBefore);
   await verifyDataBackup(s.backup);assert.deepEqual(treeSnapshot(s.backup),backupBefore);
  }finally{s.close();}
 });
});

test('backup allows adjacent names and still rejects an existing destination or ancestor',async()=>{
 const s=fixture();try{
  s.app.close();const originalRecords=records(s.data),adjacentBackup=s.data+'-backup',adjacentRestore=adjacentBackup+'-restored';
  await createDataBackup(s.data,adjacentBackup,{offline:true});const sourceBefore=treeSnapshot(s.data),backupBefore=treeSnapshot(adjacentBackup);
  for(const target of [adjacentBackup,s.parent])await assert.rejects(restoreDataBackup(adjacentBackup,target,{offline:true,relocate:true}),{code:'BACKUP_TARGET_EXISTS'});
  await restoreDataBackup(adjacentBackup,adjacentRestore,{offline:true,relocate:true});assert.deepEqual(records(adjacentRestore),originalRecords);
  assert.deepEqual(treeSnapshot(s.data),sourceBefore);assert.deepEqual(treeSnapshot(adjacentBackup),backupBefore);await verifyDataBackup(adjacentBackup);
 }finally{s.close();}
});

test('POSIX backup preserves distinct case-sensitive sibling paths',{skip:process.platform==='win32'},async t=>{
 const s=fixture();try{
  s.app.close();const other=join(s.parent,'DATA');mkdirSync(other,{recursive:true});
  if(realpathSync.native(other)===realpathSync.native(s.data)){t.skip('Filesystem is not case-sensitive');return;}
  const backup=join(other,'backup');await createDataBackup(s.data,backup,{offline:true});const before=treeSnapshot(backup);
  await restoreDataBackup(backup,join(s.parent,'Data'),{offline:true,relocate:true});assert.deepEqual(treeSnapshot(backup),before);await verifyDataBackup(backup);
 }finally{s.close();}
});

test('hard interruption leaves unpublished staging and retry restores without touching the original backup',async()=>{
 const s=fixture();try{
  s.app.close();const api=pathToFileURL(join(process.cwd(),'dist/packages/storage/backup.js')).href;
  async function killed(mode){const code=`import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';import {createDataBackup,restoreDataBackup} from ${JSON.stringify(api)};const open=fs.openSync,write=fs.writeSync;const outputs=new Set();fs.openSync=function(path,...args){const fd=open.call(this,path,...args);if(String(path).includes(${JSON.stringify(mode==='create'?'.pi-backup-':'.pi-restore-')}))outputs.add(fd);return fd;};fs.writeSync=function(fd,...args){const n=write.call(this,fd,...args);if(outputs.has(fd)){process.stdout.write('BOUNDARY\\n');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,60000);}return n;};syncBuiltinESMExports();await ${mode==='create'?'createDataBackup':'restoreDataBackup'}(${JSON.stringify(mode==='create'?s.data:s.backup)},${JSON.stringify(mode==='create'?s.backup:s.data)},{offline:true});`;
   await new Promise((done,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',code],{windowsHide:true,stdio:['ignore','pipe','pipe']});let ready=false,error='';const timeout=setTimeout(()=>{child.kill('SIGKILL');reject(Error('No interruption boundary '+error));},15000);child.stderr.on('data',x=>error+=x);child.stdout.on('data',x=>{if(String(x).includes('BOUNDARY')){ready=true;child.kill('SIGKILL');}});child.once('error',reject);child.once('exit',()=>{clearTimeout(timeout);ready?done():reject(Error(error));});});}
  await killed('create');assert.equal(existsSync(s.backup),false);const partial=readdirSync(s.parent).find(x=>x.startsWith('.pi-backup-'));await assert.rejects(verifyDataBackup(join(s.parent,partial)));await createDataBackup(s.data,s.backup,{offline:true});const frozen=readFileSync(join(s.backup,'manifest.json'));renameSync(s.data,join(s.parent,'retained-original'));await killed('restore');assert.equal(existsSync(s.data),false);await restoreDataBackup(s.backup,s.data,{offline:true});assert.deepEqual(readFileSync(join(s.backup,'manifest.json')),frozen);assert.deepEqual(records(s.data),records(join(s.parent,'retained-original')));
 }finally{s.close();}
});


test('schema thirteen backup retains trashed project history and restores through its management lifecycle',async()=>{
 const s=fixture();try{
  const project=s.app.store.get('project',s.project.id),deleted=s.app.projects.trash(USER,project.id,project.version),before=records(s.data),bytes=readFileSync(physical(s,s.artifact.path));s.app.close();
  const saved=await createDataBackup(s.data,s.backup,{offline:true});assert.ok(saved.schema.includes(13));await verifyDataBackup(s.backup);const destination=join(s.parent,'restored');await restoreDataBackup(s.backup,destination,{offline:true,relocate:true});
  const restored=new ResearchApp(destination,process.cwd());try{assert.equal(restored.projects.lifecycle(USER,project.id).status,'trashed');assert.throws(()=>restored.evidence.read(USER,s.artifact.id),{code:'PROJECT_DELETED'});const active=restored.projects.restore(USER,project.id,deleted.version);assert.equal(active.status,'active');assert.deepEqual(restored.evidence.read(USER,s.artifact.id).bytes,bytes);assert.equal(restored.store.get('session',s.session.id).id,s.session.id);}finally{restored.close();}
  assert.deepEqual(records(s.data),before);
 }finally{s.close();}
});
