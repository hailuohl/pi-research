import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const url=name=>JSON.stringify(pathToFileURL(resolve('dist/'+name)).href);
const prelude=`import {ResearchApp} from ${url('packages/research-app.js')};import {runOfflinePurge} from ${url('packages/storage/project-purge.js')};import {createDataBackup,restoreDataBackup} from ${url('packages/storage/backup.js')};import fs from 'node:fs';import fsp from 'node:fs/promises';import {syncBuiltinESMExports} from 'node:module';import {join} from 'node:path';const USER={type:'user'};async function* bytes(value){yield Buffer.from(value);}const meta={title:'original.txt',mediaType:'text/plain'};`;
function run(code,status=0){const result=spawnSync(process.execPath,['--input-type=module','-e',prelude+code],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(result.status,status,result.stderr||result.stdout);return result.stdout.trim()?JSON.parse(result.stdout.trim().split(/\r?\n/).at(-1)):null;}
function setup(data,mode){return run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.projects.create(USER,{name:'Retention target',template:'empty'}),controller=new AbortController();let other;
 if(${JSON.stringify(mode)}==='shared')other=app.projects.create(USER,{name:'Retained other',template:'empty'});
 if(${JSON.stringify(mode)}==='conflict')await app.documents.importStream(USER,p.id,meta,bytes('original'),'key');
 if(other)await app.documents.importStream(USER,other.id,meta,bytes('new bytes'),'other');
 console.log(JSON.stringify({projectId:p.id,otherId:other?.id,name:p.name}));
 const create=app.store.create.bind(app.store);app.store.create=(kind,pid,...rest)=>{if(['transaction','shared'].includes(${JSON.stringify(mode)})&&kind==='document-version'&&pid===p.id)throw Error('injected final transaction failure');return create(kind,pid,...rest);};
 const link=fsp.link;let linked=0;fsp.link=async(...args)=>{const target=String(args[1]);if(/[/\\\\]artifacts[/\\\\][a-f0-9]{64}$/.test(target)&&${JSON.stringify(mode)}==='abort0'){controller.abort();throw Error('injected before first link');}const result=await link(...args);if(/[/\\\\]artifacts[/\\\\][a-f0-9]{64}$/.test(target)){linked++;if(${JSON.stringify(mode)}==='abort1'&&linked===1)controller.abort();if(${JSON.stringify(mode)}==='lifecycle2'&&linked===2){let current=app.store.get('project',p.id);app.store.update('project',p.id,current.version,{status:'archived'});current=app.store.get('project',p.id);app.store.update('project',p.id,current.version,{status:'active'});}if(${JSON.stringify(mode)}==='crash'+linked)process.exit(76);}return result;};syncBuiltinESMExports();
 let error;try{await app.documents.importStream(USER,p.id,meta,bytes('new bytes'),'key',controller.signal);}catch(e){error=e.code??e.message;}
 if(!error)throw Error('failure injection was not reached');fsp.link=link;syncBuiltinESMExports();
 console.log(JSON.stringify({projectId:p.id,otherId:other?.id,name:p.name,error,files:fs.readdirSync(join(${JSON.stringify(data)},'artifacts')).filter(n=>/^[a-f0-9]{64}$/.test(n)),artifacts:app.store.list('artifact',p.id).length,documents:app.store.list('document-version',p.id).length}));app.close();`,mode.startsWith('crash')?76:0);}
function request(data,pid){return run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),p=app.store.get('project',${JSON.stringify(pid)}),deleted=app.projects.trash(USER,p.id,p.version);app.projects.purge(USER,p.id,{expectedVersion:deleted.version,confirmName:p.name},'purge');console.log(JSON.stringify({name:p.name}));app.close();`);}
function purge(data,pid,name){return run(`console.log(JSON.stringify(runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(pid)},{offline:true,confirmName:${JSON.stringify(name)}})));`);}

for(const mode of ['conflict','abort0','abort1','lifecycle2','transaction','crash1','crash2','shared'])test(`stream publication ${mode}: process exit leaves owned cleanup and protects shared CAS`,()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-stream-retention-')),data=join(parent,'data');try{
  const result=setup(data,mode);
  if(mode==='conflict'){assert.equal(result.error,'IDEMPOTENCY_CONFLICT');assert.equal(result.files.length,2,'conflicting retry must not publish new CAS');assert.equal(result.artifacts,2);assert.equal(result.documents,1);}
  else if(!mode.startsWith('crash'))assert.equal(result.documents,0,'failed import must not publish a document');
  request(data,result.projectId);assert.equal(purge(data,result.projectId,result.name).state,'completed');
  if(result.otherId){const retained=run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),d=app.store.list('document-version',${JSON.stringify(result.otherId)})[0];console.log(JSON.stringify(app.documents.readText(USER,d.projectId,d.id,{sourceDigest:d.original.digest})));app.close();`);assert.equal(retained.content,'new bytes');}
 }finally{rmSync(parent,{recursive:true,force:true});}
});

test('backup and relocated restore preserve pending publication ownership and still permit offline purge',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-stream-retention-backup-')),data=join(parent,'data'),backup=join(parent,'backup'),restored=join(parent,'restored');try{
  const result=setup(data,'crash1');run(`await createDataBackup(${JSON.stringify(data)},${JSON.stringify(backup)},{offline:true});await restoreDataBackup(${JSON.stringify(backup)},${JSON.stringify(restored)},{offline:true,relocate:true});console.log(JSON.stringify({ok:true}));`);
  request(restored,result.projectId);assert.equal(purge(restored,result.projectId,result.name).state,'completed');
 }finally{rmSync(parent,{recursive:true,force:true});}
});

test('intent recovery removes only its internal stage link and retains the external-hardlink purge block',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-stream-retention-links-')),data=join(parent,'data'),external=join(parent,'external');try{
  const result=setup(data,'crash1');run(`const file=fs.readdirSync(join(${JSON.stringify(data)},'artifacts')).find(n=>/^[a-f0-9]{64}$/.test(n));fs.linkSync(join(${JSON.stringify(data)},'artifacts',file),${JSON.stringify(external)});console.log(JSON.stringify({ok:true}));`);
  request(data,result.projectId);const rejected=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(result.projectId)},{offline:true,confirmName:${JSON.stringify(result.name)}});throw Error('unexpected purge success');}catch(e){console.log(JSON.stringify({code:e.code,external:fs.readFileSync(${JSON.stringify(external)},'utf8'),links:fs.lstatSync(${JSON.stringify(external)}).nlink}));}`);
  assert.equal(rejected.code,'PURGE_HARDLINK');assert.equal(rejected.external,'new bytes');assert.equal(rejected.links,2,'only intent-bound internal stage link is removed');
 }finally{rmSync(parent,{recursive:true,force:true});}
});

test('forged publication stage paths cannot weaken offline ownership or backup validation',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-stream-retention-invalid-')),data=join(parent,'data'),backup=join(parent,'backup');try{
  const result=setup(data,'transaction');run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd()),intent=app.store.list('document-blob-publication')[0];intent.blobs[0].stage.path='pi-data:/projects/'+intent.projectId+'/source/README.md';app.store.update('document-blob-publication',intent.id,intent.version,{blobs:intent.blobs});console.log(JSON.stringify({ok:true}));app.close();`);
  const copied=run(`try{await createDataBackup(${JSON.stringify(data)},${JSON.stringify(backup)},{offline:true});throw Error('unexpected backup success');}catch(e){console.log(JSON.stringify({code:e.code}));}`);assert.equal(copied.code,'DOCUMENT_PUBLICATION_INVALID');
  request(data,result.projectId);const rejected=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(result.projectId)},{offline:true,confirmName:${JSON.stringify(result.name)}});throw Error('unexpected purge success');}catch(e){console.log(JSON.stringify({code:e.code,retained:fs.readFileSync(join(${JSON.stringify(data)},'projects',${JSON.stringify(result.projectId)},'source','README.md'),'utf8')}));}`);assert.equal(rejected.code,'DOCUMENT_PUBLICATION_INVALID');assert.match(rejected.retained,/Retention target/);
 }finally{rmSync(parent,{recursive:true,force:true});}
});

test('publication recovery validates the SQL record identity before unlinking any staging file',()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-stream-retention-row-')),data=join(parent,'data');try{
  const result=setup(data,'crash1');run(`const app=new ResearchApp(${JSON.stringify(data)},process.cwd());app.store.db.prepare("UPDATE records SET id='different-id' WHERE kind='document-blob-publication'").run();console.log(JSON.stringify({ok:true}));app.close();`);
  request(data,result.projectId);const rejected=run(`try{runOfflinePurge(${JSON.stringify(data)},${JSON.stringify(result.projectId)},{offline:true,confirmName:${JSON.stringify(result.name)}});throw Error('unexpected purge success');}catch(e){const name=fs.readdirSync(join(${JSON.stringify(data)},'artifacts')).find(n=>/^[a-f0-9]{64}$/.test(n));console.log(JSON.stringify({code:e.code,links:fs.lstatSync(join(${JSON.stringify(data)},'artifacts',name)).nlink}));}`);assert.equal(rejected.code,'DOCUMENT_PUBLICATION_INVALID');assert.equal(rejected.links,2,'invalid ownership must not mutate even private stage links');
 }finally{rmSync(parent,{recursive:true,force:true});}
});
