import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const url=name=>JSON.stringify(pathToFileURL(resolve('dist/'+name)).href);
const prelude=`import {ResearchApp} from ${url('packages/research-app.js')};import {runOfflinePurge} from ${url('packages/storage/project-purge.js')};import {createDataBackup,restoreDataBackup} from ${url('packages/storage/backup.js')};import fs from 'node:fs';import fsp from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';import {join} from 'node:path';const USER={type:'user'};`;
function run(code,status=0){const r=spawnSync(process.execPath,['--input-type=module','-e',prelude+code],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(r.status,status,r.stderr||r.stdout);return r.stdout.trim()?JSON.parse(r.stdout.trim().split(/\r?\n/).at(-1)):null;}
function setup(data,mode){return run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.projects.create(USER,{name:'Index retention',template:'empty'}),a=app.evidence.put(p.id,'fixed',Buffer.from('固定source🙂正文')),controller=new AbortController();let other;
 const prepare=(pid,source,key)=>app.operations.execute(USER,'artifact_text_prepare',{artifactId:source.id,sourceDigest:source.digest},{projectId:pid,idempotencyKey:key,signal:controller.signal});
 if(${JSON.stringify(mode)}==='shared'){other=app.projects.create(USER,{name:'Retained other',template:'empty'});const source=app.evidence.publishPrepared(other.id,{title:'same',path:a.path,digest:a.digest,size:a.size,mediaType:'text/plain',origin:'user'});await prepare(other.id,source,'other');}
 const info={projectId:p.id,otherId:other?.id,name:p.name,sourcePath:app.store.paths.physical(a.path)};console.log(JSON.stringify(info));
 const create=app.store.create.bind(app.store);app.store.create=(kind,pid,...rest)=>{if(['transaction','shared'].includes(${JSON.stringify(mode)})&&kind==='artifact-text-source'&&pid===p.id)throw Error('injected final transaction failure');return create(kind,pid,...rest);};
 const link=fsp.link;fsp.link=async(...args)=>{if(${JSON.stringify(mode)}==='before'){controller.abort();throw Error('injected before link');}const result=await link(...args);if(${JSON.stringify(mode)}==='after')controller.abort();if(${JSON.stringify(mode)}==='deadline'){const now=Date.now;Date.now=()=>now()+120001;}if(${JSON.stringify(mode)}==='crash')process.exit(76);return result;};syncBuiltinESMExports();
 let error;try{await prepare(p.id,a,'key');}catch(e){error=e.code??e.message;}if(!error)throw Error('failure injection missed');fsp.link=link;syncBuiltinESMExports();const intent=app.store.list('text-index-publication',p.id)[0];console.log(JSON.stringify({...info,error,ready:app.store.list('artifact-text-source',p.id).length,intent:!!intent,indexPath:app.store.paths.physical(intent.blobs[0].blobPath)}));app.close();`,mode==='crash'?76:0);}
function request(data,pid){return run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.store.get('project',${JSON.stringify(pid)}),deleted=app.projects.trash(USER,p.id,p.version);app.projects.purge(USER,p.id,{expectedVersion:deleted.version,confirmName:p.name},'purge');app.close();`);}
const purge=(data,pid,name)=>run(`console.log(JSON.stringify(runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(pid)},{offline:true,confirmName:${JSON.stringify(name)}})));`);

for(const mode of ['before','after','deadline','transaction','crash','shared'])test(`single-index publication ${mode} retains ownership and permits safe purge`,()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-retain-')),data=join(parent,'data');try{const r=setup(data,mode);if(mode!=='crash'){assert.equal(r.ready,0);assert.equal(r.intent,true);}if(mode==='deadline')assert.equal(r.error,'ARTIFACT_TEXT_PREPARE_TIMEOUT');request(data,r.projectId);assert.equal(purge(data,r.projectId,r.name).state,'completed');
  if(r.otherId){const retained=run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),s=app.store.list('artifact-text-source',${JSON.stringify(r.otherId)})[0];console.log(JSON.stringify(app.artifactTexts.page(USER,s.projectId,{artifactId:s.artifactId,sourceDigest:s.sourceDigest,textSourceId:s.id})));app.close();`);assert.equal(retained.content,'固定source🙂正文');}
 }finally{rmSync(parent,{recursive:true,force:true});}
});
test('pending index crash survives backup relocation and retained source readback',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-backup-')),data=join(parent,'data'),backup=join(parent,'backup'),restored=join(parent,'restored');try{const r=setup(data,'crash');run(`await createDataBackup(${JSON.stringify(data)},${JSON.stringify(backup)},{offline:true});await restoreDataBackup(${JSON.stringify(backup)},${JSON.stringify(restored)},{offline:true,relocate:true});`);
  const page=run(`const app=new ResearchApp(${JSON.stringify(restored)},process.cwd()),a=app.store.list('artifact',${JSON.stringify(r.projectId)}).find(a=>a.origin==='user'),p=await app.operations.execute(USER,'artifact_text_prepare',{artifactId:a.id,sourceDigest:a.digest},{projectId:a.projectId,idempotencyKey:'retry'});console.log(JSON.stringify(app.artifactTexts.page(USER,a.projectId,{artifactId:a.id,sourceDigest:a.digest,textSourceId:p.textSourceId})));app.close();`);assert.equal(page.content,'固定source🙂正文');request(restored,r.projectId);assert.equal(purge(restored,r.projectId,r.name).state,'completed');
 }finally{rmSync(parent,{recursive:true,force:true});}
});
test('index intent only removes its internal stage link and preserves external-hardlink rejection',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-links-')),data=join(parent,'data'),external=join(parent,'external');try{const r=setup(data,'crash');run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.store.list('text-index-publication')[0];fs.linkSync(app.store.paths.physical(p.blobs[0].blobPath),${JSON.stringify(external)});app.close();`);request(data,r.projectId);
  const rejected=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(r.projectId)},{offline:true,confirmName:${JSON.stringify(r.name)}});throw Error('unexpected success');}catch(e){console.log(JSON.stringify({code:e.code,links:fs.lstatSync(${JSON.stringify(external)}).nlink}));}`);assert.equal(rejected.code,'PURGE_HARDLINK');assert.equal(rejected.links,2);
 }finally{rmSync(parent,{recursive:true,force:true});}
});
test('forged source/project/stage identity is rejected by backup and purge',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-forged-')),data=join(parent,'data'),backup=join(parent,'backup');try{const r=setup(data,'transaction');run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.store.list('text-index-publication')[0];p.blobs[0].stage.path='pi-data:/projects/'+p.projectId+'/source/README.md';app.store.update('text-index-publication',p.id,p.version,{blobs:p.blobs});app.close();`);
  const backed=run(`try{await createDataBackup(${JSON.stringify(data)},${JSON.stringify(backup)},{offline:true});throw Error('unexpected success');}catch(e){console.log(JSON.stringify({code:e.code}));}`);assert.equal(backed.code,'TEXT_INDEX_PUBLICATION_INVALID');request(data,r.projectId);
  const purged=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(r.projectId)},{offline:true,confirmName:${JSON.stringify(r.name)}});throw Error('unexpected success');}catch(e){console.log(JSON.stringify({code:e.code}));}`);assert.equal(purged.code,'TEXT_INDEX_PUBLICATION_INVALID');
 }finally{rmSync(parent,{recursive:true,force:true});}
});
test('interrupted purge resumes after deleting the intent source CAS before deleting its records',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-resume-')),data=join(parent,'data');try{const r=setup(data,'transaction');request(data,r.projectId);const interrupted=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(r.projectId)},{offline:true,confirmName:${JSON.stringify(r.name)}},{afterPath(){if(!fs.existsSync(${JSON.stringify(r.sourcePath)}))throw Error('injected partial purge');}});throw Error('unexpected success');}catch(e){console.log(JSON.stringify({message:e.message,sourceExists:fs.existsSync(${JSON.stringify(r.sourcePath)})}));}`);assert.match(interrupted.message,/injected/);assert.equal(interrupted.sourceExists,false);
  const completed=run(`console.log(JSON.stringify(runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(r.projectId)},{offline:true,confirmName:${JSON.stringify(r.name)},resume:true})));`);assert.equal(completed.state,'completed');
 }finally{rmSync(parent,{recursive:true,force:true});}
});

for(const mutation of ['stage-cleanup','corrupt-bytes','repeat-change'])test(`fixed index dedup fresh proof handles ${mutation} without rewriting CAS`,()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-index-proof-')),data=join(parent,'data');try{
  const result=run(`import {prepareFixedTextIndex,publishFixedTextIndex} from ${url('packages/storage/streamed-blob.js')};import {createHash} from 'node:crypto';
 const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.projects.create(USER,{name:'Dedup proof',template:'empty'}),a=app.evidence.put(p.id,'fixed',Buffer.alloc(3*1024*1024,97)),source={blobPath:a.path,digest:a.digest,size:a.size},first=await prepareFixedTextIndex(app.store,p.id,a.id,source,a.size,()=>{}),second=await prepareFixedTextIndex(app.store,p.id,a.id,source,a.size,()=>{});
 for(const prepared of [first,second])app.store.create('text-index-publication',p.id,prepared.publication,prepared.publication.stagingId);await publishFixedTextIndex(app.store,first.publication,()=>{});
 const target=app.store.paths.physical(first.indexBlob.blobPath),open=fsp.open,openSync=fs.openSync;let injected=false,freshOpens=0;
 fsp.open=async function(path,...args){const file=await open.call(this,path,...args);if(String(path)===target&&!injected){injected=true;await new Promise(r=>setTimeout(r,10));await first.dispose();if(${JSON.stringify(mutation)}==='corrupt-bytes'){fs.chmodSync(target,0o600);fs.writeFileSync(target,Buffer.alloc(first.indexBlob.size));}}return file;};
 fs.openSync=function(path,...args){const fd=openSync.call(this,path,...args);if(String(path)===target&&(args[0]==='r'||typeof args[0]==='number'&&(args[0]&(fs.constants.O_WRONLY|fs.constants.O_RDWR))===0)){freshOpens++;if(${JSON.stringify(mutation)}==='repeat-change')fs.chmodSync(target,0o600);}return fd;};syncBuiltinESMExports();
 let error;try{await publishFixedTextIndex(app.store,second.publication,()=>{});}catch(e){error=e.code;}fsp.open=open;fs.openSync=openSync;syncBuiltinESMExports();
 const result={injected,error,freshOpens,digest:createHash('sha256').update(fs.readFileSync(target)).digest('hex'),expected:first.indexBlob.digest,intents:app.store.list('text-index-publication',p.id).length,ready:app.store.list('artifact-text-source',p.id).length};await first.dispose();await second.dispose();app.close();console.log(JSON.stringify(result));`);
  assert.equal(result.injected,true);assert.equal(result.freshOpens,1,'one fresh proof only');assert.equal(result.intents,2);assert.equal(result.ready,0);
  if(mutation==='stage-cleanup'){assert.equal(result.error,undefined);assert.equal(result.digest,result.expected);}else assert.equal(result.error,mutation==='corrupt-bytes'?'ARTIFACT_CORRUPTED':'ARTIFACT_CHANGED');
 }finally{rmSync(parent,{recursive:true,force:true});}
});
