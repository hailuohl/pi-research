import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,existsSync,rmSync,unlinkSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {createDataBackup,verifyDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {digest} from '../../dist/packages/storage/store.js';

test('an interrupted source swap cannot publish a backup with nonportable recovery identities',async()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-source-backup-')),data=join(parent,'data'),target=join(parent,'backup');mkdirSync(data);
 try{const child=spawnSync(process.execPath,[resolve('tests/fixtures/audit-source-crash.mjs'),data,'after-install'],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(child.status,86,child.stderr);const metadata=JSON.parse(readFileSync(join(data,'test-source.json'),'utf8'));unlinkSync(join(data,'test-source.json'));const marker=metadata.workspace+'.source-prepare-pending',before=readFileSync(marker);await assert.rejects(()=>createDataBackup(data,target,{offline:true}),{code:'BACKUP_RECOVERY_PENDING'});assert.equal(existsSync(target),false);assert.deepEqual(readFileSync(marker),before);assert.ok(existsSync(join(metadata.workspace,'config.json')));
 }finally{rmSync(parent,{recursive:true,force:true});}
});

test('a self-consistent backup manifest with an unresolved source journal is rejected before restoration',async()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-source-manifest-')),data=join(parent,'data'),backup=join(parent,'backup'),target=join(parent,'restored');const app=new ResearchApp(data,process.cwd());let open=true;
 try{const p=app.projects.create({type:'user'},{name:'Manifest fixture',template:'empty'}),s=app.sessions.create({type:'user'},p.id,{});await app.close();open=false;await createDataBackup(data,backup,{offline:true});const path=`sessions/${s.id}/workspace.source-prepare-pending`,bytes=Buffer.from('{"fixture":"unresolved"}');writeFileSync(join(backup,'data',...path.split('/')),bytes);const file=join(backup,'manifest.json'),manifest=JSON.parse(readFileSync(file,'utf8'));manifest.entries.push({path,type:'file',mode:0o600,size:bytes.length,digest:digest(bytes)});const {manifestDigest,...body}=manifest;manifest.manifestDigest=digest(body);writeFileSync(file,JSON.stringify(manifest));await assert.rejects(()=>verifyDataBackup(backup),{code:'BACKUP_INVALID'});await assert.rejects(()=>restoreDataBackup(backup,target,{offline:true,relocate:true}),{code:'BACKUP_INVALID'});assert.equal(existsSync(target),false);
 }finally{if(open)await app.close();rmSync(parent,{recursive:true,force:true});}
});
