import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
// The optional module is used only to replay these regressions against the exact pre-fix Git source.
const {captureWritePreimage,TextWriteRecovery}=await import(process.env.PI_TEST_RECOVERY_MODULE??'../../dist/packages/workspace/text-write-recovery.js');
function setup(){const dir=fs.mkdtempSync(join(tmpdir(),'pi-preimage-bounds-')),root=join(dir,'workspace'),database=join(dir,'state.db');fs.mkdirSync(root);const path=join(root,'a.txt'),db=new DatabaseSync(':memory:'),recovery=new TextWriteRecovery(db,database);fs.writeFileSync(path,Buffer.alloc(128*1024,97));return {dir,root,path,db,recovery,database,close(){recovery.release();db.close();fs.rmSync(dir,{recursive:true,force:true});}};}
function injectGrowth(path,run){const read=fs.readSync,whole=fs.readFileSync;let grew=false,wholeReads=0;const grow=()=>{if(!grew){grew=true;fs.appendFileSync(path,Buffer.alloc(128*1024,120));}};
 fs.readSync=function(fd,...args){const result=read.call(this,fd,...args);if(fs.fstatSync(fd).ino===fs.lstatSync(path).ino)grow();return result;};
 fs.readFileSync=function(file,...args){if(String(file)===path){wholeReads++;grow();}return whole.call(this,file,...args);};syncBuiltinESMExports();
 try{run();assert.equal(grew,true);assert.equal(wholeReads,0,'live comparison must not allocate the changing file');}finally{fs.readSync=read;fs.readFileSync=whole;syncBuiltinESMExports();}
}
test('write unchanged comparison detects growth using bounded reads before journaling',()=>{const s=setup();try{
 const before=captureWritePreimage(s.root,'a.txt');
 injectGrowth(s.path,()=>assert.throws(()=>s.recovery.write(s.root,'a.txt',Buffer.from('new'),before.mode,false,before),{code:'FILE_VERSION_CONFLICT'}));
 assert.equal(fs.statSync(s.path).size,256*1024);assert.equal(fs.existsSync(s.root+'.text-write-pending'),false);
}finally{s.close();}});

function journal(s){const path=join(s.database+'.text-writes',fs.readdirSync(s.database+'.text-writes').find(n=>n.endsWith('.json')));return {path,value:JSON.parse(JSON.parse(fs.readFileSync(path,'utf8')).data)};}
for(const metadata of [false,true])test(`manual original restoration may retain a different inode: metadata=${metadata}`,()=>{const s=setup();try{
 const path=metadata?s.root+'.source-modes.json':s.path;if(metadata)fs.writeFileSync(path,'{"a":1}\n');const before=captureWritePreimage(s.root,metadata?'':'a.txt',metadata),oldIno=fs.lstatSync(path).ino;
 s.recovery.write(s.root,metadata?'':'a.txt',Buffer.from('after'),before.mode,metadata,before);const restored=join(s.root,'manual-restore');fs.writeFileSync(restored,before.bytes);fs.chmodSync(restored,before.mode);fs.renameSync(restored,path);const newIno=fs.lstatSync(path).ino;assert.notEqual(newIno,oldIno);
 s.recovery.rollback();assert.equal(fs.lstatSync(path).ino,newIno);assert.ok(fs.readFileSync(path).equals(before.bytes));assert.equal(fs.existsSync(s.root+'.text-write-pending'),false);assert.equal(fs.readdirSync(s.database+'.text-writes').filter(n=>n.endsWith('.json')).length,0);
}finally{s.close();}});
function tailMutation(path,at,mutate,run){const original=fs.fstatSync,ino=fs.lstatSync(path).ino;let checks=0,injected=false;
 fs.fstatSync=function(fd,...args){const result=original.call(this,fd,...args);if(result.ino===ino&&++checks===at){mutate(result);injected=true;}return result;};syncBuiltinESMExports();
 try{run();assert.equal(injected,true,'must mutate after the old final fstat was captured');}finally{fs.fstatSync=original;syncBuiltinESMExports();}
}
for(const metadata of [false,true])test(`write tail stat rejects same-inode append and retains staged journal: metadata=${metadata}`,()=>{const s=setup();try{
 const path=metadata?s.root+'.source-modes.json':s.path;if(metadata)fs.writeFileSync(path,'{"a":1}\n');const before=captureWritePreimage(s.root,metadata?'':'a.txt',metadata),append=Buffer.from('EXTERNAL APPEND'),expected=Buffer.concat([before.bytes,append]);
 s.db.exec('BEGIN');try{tailMutation(path,4,()=>fs.appendFileSync(path,append),()=>assert.throws(()=>s.recovery.write(s.root,metadata?'':'a.txt',Buffer.from(metadata?'{"a":2}\n':'new'),before.mode,metadata,before),{code:'TEXT_WRITE_RECOVERY_CONFLICT'}));}finally{s.db.exec('ROLLBACK');}
 assert.ok(fs.readFileSync(path).equals(expected));const pending=journal(s),entry=pending.value.entries[0];assert.ok(fs.existsSync(entry.stage));assert.equal(fs.existsSync(entry.backup),false,'refusal occurs before the backup link');assert.ok(fs.existsSync(s.root+'.text-write-pending'));
 assert.throws(()=>s.recovery.rollback(),{code:'TEXT_WRITE_RECOVERY_CONFLICT'});s.recovery.release();s.recovery.recover();assert.equal(s.recovery.conflicts.length,1);assert.ok(fs.existsSync(pending.path));assert.ok(fs.existsSync(entry.stage));assert.ok(fs.readFileSync(path).equals(expected));
}finally{s.close();}});

for(const metadata of [false,true])for(const target of ['target','backup'])test(`rollback tail stat rejects changed ${target} and preserves journal/backup: metadata=${metadata}`,()=>{const s=setup();try{
 const path=metadata?s.root+'.source-modes.json':s.path;if(metadata)fs.writeFileSync(path,'{"a":1}\n');const before=captureWritePreimage(s.root,metadata?'':'a.txt',metadata),after=metadata?Buffer.from('{"a":2}\n'):Buffer.alloc(before.bytes.length,98);
 s.recovery.write(s.root,metadata?'':'a.txt',after,before.mode,metadata,before);const pending=journal(s),backup=pending.value.entries[0].backup,victim=target==='target'?path:backup,append=Buffer.from('EXTERNAL APPEND');
 tailMutation(victim,target==='target'?3:2,()=>fs.appendFileSync(victim,append),()=>assert.throws(()=>s.recovery.rollback(),{code:'TEXT_WRITE_RECOVERY_CONFLICT'}));
 assert.ok(fs.readFileSync(path).equals(target==='target'?Buffer.concat([after,append]):after));assert.ok(fs.readFileSync(backup).equals(target==='backup'?Buffer.concat([before.bytes,append]):before.bytes));assert.ok(fs.existsSync(pending.path));assert.ok(fs.existsSync(s.root+'.text-write-pending'));
}finally{s.close();}});

for(const metadata of [false,true])for(const mutation of ['mtime','mode'])test(`preimage identity remains bound after streamed comparison: ${mutation}, metadata=${metadata}`,()=>{const s=setup(),original=fs.lstatSync;let injected=false,checks=0;try{
 const path=metadata?s.root+'.source-modes.json':s.path;if(metadata)fs.writeFileSync(path,'{"a":1}\n');const before=captureWritePreimage(s.root,metadata?'':'a.txt',metadata);
 // The second unchanged check's final pre-read identity is observation 14; mutate after returning that old snapshot, before the stream takes its initial stat.
 fs.lstatSync=function(file,...args){const result=original.call(this,file,...args);if(String(file)===path&&++checks===14){if(mutation==='mtime')fs.utimesSync(path,result.atime,new Date(result.mtimeMs+2000));else fs.chmodSync(path,0o444);injected=true;}return result;};syncBuiltinESMExports();
 assert.throws(()=>s.recovery.write(s.root,metadata?'':'a.txt',Buffer.from('new'),before.mode,metadata,before),{code:'TEXT_WRITE_RECOVERY_CONFLICT'});assert.equal(injected,true);assert.ok(fs.readFileSync(path).equals(before.bytes));assert.ok(fs.existsSync(s.root+'.text-write-pending'));assert.ok(fs.existsSync(journal(s).path));
}finally{fs.lstatSync=original;syncBuiltinESMExports();if(injected){const path=metadata?s.root+'.source-modes.json':s.path;fs.chmodSync(path,0o600);}s.close();}});
test('rollback comparison detects growth and preserves the target and original journal',()=>{const s=setup();try{
 const before=captureWritePreimage(s.root,'a.txt');s.recovery.write(s.root,'a.txt',Buffer.alloc(128*1024,98),before.mode,false,before);
 injectGrowth(s.path,()=>assert.throws(()=>s.recovery.rollback(),{code:'TEXT_WRITE_RECOVERY_CONFLICT'}));
 assert.equal(fs.statSync(s.path).size,256*1024);assert.equal(fs.existsSync(s.root+'.text-write-pending'),true);assert.equal(fs.readdirSync(s.database+'.text-writes').filter(n=>n.endsWith('.json')).length,1);
}finally{s.close();}});
test('rollback backup comparison detects growth without buffering the changed backup',()=>{const s=setup();try{
 const before=captureWritePreimage(s.root,'a.txt');s.recovery.write(s.root,'a.txt',Buffer.alloc(128*1024,98),before.mode,false,before);
 const journalPath=join(s.database+'.text-writes',fs.readdirSync(s.database+'.text-writes').find(n=>n.endsWith('.json'))),journal=JSON.parse(JSON.parse(fs.readFileSync(journalPath,'utf8')).data),backup=journal.entries[0].backup;
 injectGrowth(backup,()=>assert.throws(()=>s.recovery.rollback(),{code:'TEXT_WRITE_RECOVERY_CONFLICT'}));assert.equal(fs.statSync(backup).size,256*1024);assert.equal(fs.statSync(s.path).size,128*1024);assert.ok(fs.existsSync(journalPath));assert.ok(fs.existsSync(s.root+'.text-write-pending'));
}finally{s.close();}});
test('legacy journal preimages above the new content budget still restore without a global recovery cap',()=>{const s=setup();try{
 const legacy=captureWritePreimage(s.root,'a.txt'),bytes=Buffer.alloc(2*1024*1024+1,97);fs.writeFileSync(s.path,bytes);const stat=fs.lstatSync(s.path);
 // Fixture the pre-upgrade preimage format; this bypasses only new capture, never the normal write API.
 legacy.bytes=bytes;legacy.identity=`${stat.dev}:${stat.ino}:${stat.birthtimeMs}:${stat.mode}:${stat.mtimeMs}`;legacy.mode=stat.mode&0o777;
 s.recovery.write(s.root,'a.txt',Buffer.from('new'),legacy.mode,false,legacy);s.recovery.rollback();assert.equal(fs.statSync(s.path).size,bytes.length);assert.ok(fs.readFileSync(s.path).equals(bytes));assert.equal(fs.existsSync(s.root+'.text-write-pending'),false);
 if(process.platform==='win32'){fs.writeFileSync(s.root+'.source-modes.json',Buffer.alloc(2*1024*1024+1,32));assert.equal(captureWritePreimage(s.root,'',true).bytes.length,2*1024*1024+1);}
}finally{s.close();}});
