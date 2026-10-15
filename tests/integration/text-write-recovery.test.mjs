import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,renameSync,existsSync,readdirSync,rmSync,chmodSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {Store,digest} from '../../dist/packages/storage/store.js';
import {writeText,readText,setSourceMode,readSourceMode} from '../../dist/packages/workspace/files.js';

test('text writes reconcile hard exits, retain conflicts, and fence readers',async()=>{
    const dir=mkdtempSync(join(tmpdir(),'pi-text-recovery-'));
    const run=(body)=>{const result=spawnSync(process.execPath,['--input-type=module','-e',`import {Store,digest} from ${JSON.stringify(pathToFileURL(resolve('dist/packages/storage/store.js')).href)};import {writeText,snapshotDirectory} from ${JSON.stringify(pathToFileURL(resolve('dist/packages/workspace/files.js')).href)};${body}`],{encoding:'utf8'});assert.equal(result.status,42,result.stderr);};
    try {
    for(const committed of [false,true]) {
        const root=join(dir,committed?'committed':'rolled-back'),db=root+'.sqlite';mkdirSync(root);writeFileSync(join(root,'a.txt'),'before');
        setSourceMode(root,'a.txt','100755');
        run(`const s=new Store(${JSON.stringify(db)});s.transaction(()=>{${committed?"s.afterCommit(()=>process.exit(42));":""}writeText(${JSON.stringify(root)},'a.txt','one',digest('before'),s);writeText(${JSON.stringify(root)},'a.txt','two',digest('one'),s);snapshotDirectory(${JSON.stringify(root)},${JSON.stringify(join(dir,'cas'))});${committed?"":"process.exit(42);"}});`);
        assert.throws(()=>readText(root,'a.txt'),{code:'TEXT_WRITE_RECOVERY_CONFLICT'});
        const s=new Store(db);assert.equal(readText(root,'a.txt').content,committed?'two':'before');assert.equal(readSourceMode(root,'a.txt'),'100755');s.close();
        const again=new Store(db);assert.equal(readText(root,'a.txt').content,committed?'two':'before');again.close();
    }
    for(const replacedRoot of [false,true]) {
        const root=join(dir,replacedRoot?'replaced':'external'),db=root+'.sqlite';mkdirSync(root);writeFileSync(join(root,'a.txt'),'before');
        run(`const s=new Store(${JSON.stringify(db)});s.transaction(()=>{writeText(${JSON.stringify(root)},'a.txt','after',digest('before'),s);process.exit(42);});`);
        if(replacedRoot){renameSync(root,root+'.original');mkdirSync(root);}writeFileSync(join(root,'a.txt'),'external');
        const s=new Store(db);assert.equal(s.textWrites.conflicts.length,1);assert.equal(readFileSync(join(root,'a.txt'),'utf8'),'external');assert.throws(()=>readText(root,'a.txt'),{code:'TEXT_WRITE_RECOVERY_CONFLICT'});assert.ok(existsSync(root+'.text-write-pending'));s.close();
        if(!replacedRoot){writeFileSync(join(root,'a.txt'),'before');const recovered=new Store(db);assert.equal(readText(root,'a.txt').content,'before');assert.equal(recovered.textWrites.conflicts.length,0);recovered.close();}
    }
    for(const change of ['replacement','permissions']) {
        const root=join(dir,change),db=root+'.sqlite';mkdirSync(root);writeFileSync(join(root,'a.txt'),'before');
        run(`const s=new Store(${JSON.stringify(db)});s.transaction(()=>{writeText(${JSON.stringify(root)},'a.txt','after',digest('before'),s);process.exit(42);});`);
        const target=join(root,'a.txt');
        if(change==='replacement'){writeFileSync(join(root,'other'),'after');renameSync(join(root,'other'),target);}else chmodSync(target,0o444);
        const identity=lstatSync(target),s=new Store(db);
        try {assert.equal(s.textWrites.conflicts.length,1);assert.equal(lstatSync(target).ino,identity.ino);assert.equal(lstatSync(target).mode,identity.mode);assert.equal(readFileSync(target,'utf8'),'after');}finally{s.close();chmodSync(target,0o600);}
    }
    for(const metadata of process.platform==='win32'?[false,true]:[false]) {
        const root=join(dir,metadata?'metadata-preimage':'text-preimage'),db=root+'.sqlite';mkdirSync(root);writeFileSync(join(root,'a.txt'),'before');
        if(metadata)writeFileSync(root+'.source-modes.json','{}');
        const s=new Store(db),write=s.textWrites.write.bind(s.textWrites);
        s.textWrites.write=(...args)=>{
            if(args[4]===metadata)writeFileSync(metadata?root+'.source-modes.json':join(root,'a.txt'),metadata?JSON.stringify({'b.txt':'100755'}):'external');
            return write(...args);
        };
        try {
            assert.throws(()=>writeText(root,'a.txt','after',digest('before'),s),{code:'FILE_VERSION_CONFLICT'});
            assert.equal(readFileSync(join(root,'a.txt'),'utf8'),metadata?'before':'external');
            if(metadata)assert.deepEqual(JSON.parse(readFileSync(root+'.source-modes.json','utf8')),{'b.txt':'100755'});
            assert.equal(existsSync(root+'.text-write-pending'),false);
        } finally {s.close();}
    }
    const root=join(dir,'normal'),db=root+'.sqlite';mkdirSync(root);const s=new Store(db);
    const input={path:'a.txt',content:'new'};const first=s.operation('text','key',input,()=>writeText(root,'a.txt','new',null,s),{kind:'global'});
    assert.deepEqual(s.operation('text','key',input,()=>{throw Error('replayed');},{kind:'global'}),first);
    assert.throws(()=>s.transaction(()=>{writeText(root,'a.txt','one',digest('new'),s);writeText(root,'a.txt','two',digest('one'),s);throw Error('rollback');}),/rollback/);
    assert.equal(readText(root,'a.txt').content,'new');assert.equal(readdirSync(db+'.text-writes').filter(n=>n.endsWith('.json')).length,0);s.close();
    } finally {rmSync(dir,{recursive:true,force:true});}
});
