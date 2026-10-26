import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {digest} from '../../dist/packages/storage/store.js';
import {listFiles,safePath} from '../../dist/packages/workspace/files.js';

const synthetic='SYNTHETIC_CASE_EXCLUSION_FIXTURE\n';
const excludedNames=[['.env','.ENV'],['.env.local','.EnV.LoCaL'],['.git','.GIT'],['node_modules','NODE_MODULES'],['.pi','.PI'],['.DS_Store','.ds_store'],['.pi-research','.PI-RESEARCH'],['.pi-runtime','.PI-RUNTIME'],['.npmrc','.NPMRC'],['.pypirc','.PYPIRC'],['model-connections.json','MODEL-CONNECTIONS.JSON'],['environment-variables.json.old.tmp','ENVIRONMENT-VARIABLES.JSON.OLD.TMP']];
function actor(s){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.project.id,sessionId:row.id,role:'coordinator',generation:1};}
function op(s,who,name,input){return s.app.operations.execute(who,name,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:crypto.randomUUID()});}
function fixture(s,source){const root=s.app.store.paths.physical(source==='project'?s.project.workspace:s.session.workspace),nested=join(root,'case-fixture');fs.mkdirSync(nested);for(const [name]of excludedNames)fs.writeFileSync(join(nested,name),synthetic);return {root,nested};}

for(const source of ['project','session'])for(const paged of [false,true])test(`Win32 excluded aliases deny ${source} ${paged?'page':'default'} reads without receipts`,{skip:process.platform!=='win32'},()=>{const s=setup();try{
 const who=actor(s),{nested}=fixture(s,source);for(const [name,alias]of excludedNames){assert.throws(()=>op(s,who,'workspace_read',{source,path:`case-fixture/${alias}`,...(paged?{readProtocol:'workspace-text-v1',limit:16000}:{})}),{code:'PATH_DENIED'},alias);assert.equal(fs.readFileSync(join(nested,name),'utf8'),synthetic);}
 assert.equal(s.app.store.list('research-input-read').length,0);assert.equal(s.app.store.list('research-input-selection').length,0);assert.equal(s.app.store.list('workspace-draft-read').length,0);
}finally{s.close();}});

for(const source of ['project','session'])test(`Win32 excluded aliases cannot overwrite synthetic ${source} files`,{skip:process.platform!=='win32'},()=>{const s=setup();try{
 actor(s);const {nested}=fixture(s,source);for(const [name,alias]of excludedNames){assert.throws(()=>op(s,USER,'workspace_write',{source,path:`case-fixture/${alias}`,content:'must not replace synthetic marker',expectedDigest:digest(synthetic)}),{code:'PATH_DENIED'},alias);assert.equal(fs.readFileSync(join(nested,name),'utf8'),synthetic);}
 assert.equal(s.app.store.list('workspace-draft-write').length,0);
}finally{s.close();}});

test('Win32 normal mixed-case files remain readable in both modes and writable',{skip:process.platform!=='win32'},()=>{const s=setup();try{
 const who=actor(s);for(const source of ['project','session']){const written=op(s,USER,'workspace_write',{source,path:'OrdinaryCase.txt',content:'ordinary text',expectedDigest:null});
 for(const paged of [false,true]){const read=op(s,who,'workspace_read',{source,path:'ORDINARYCASE.TXT',...(paged?{readProtocol:'workspace-text-v1',limit:16000}:{})});assert.equal(read.content,'ordinary text');assert.equal(read.digest,written.digest);assert.ok(source==='project'?read.sourceInputReadId:read.draftReadId);}
 const revised=op(s,USER,'workspace_write',{source,path:'ordinarycase.txt',content:'revised ordinary text',expectedDigest:written.digest});assert.equal(revised.digest,digest('revised ordinary text'));}
}finally{s.close();}});

test('Win32 listing skips all excluded-name aliases and excluded directories',{skip:process.platform!=='win32'},()=>{const s=setup();try{
 const root=s.app.store.paths.physical(s.project.workspace),nested=join(root,'listing-fixture');fs.mkdirSync(nested);for(const [,alias]of excludedNames)fs.writeFileSync(join(nested,alias),synthetic);fs.mkdirSync(join(nested,'DEEP'));fs.mkdirSync(join(nested,'DEEP','.Pi'));fs.writeFileSync(join(nested,'DEEP','.Pi','private.txt'),synthetic);fs.writeFileSync(join(nested,'VISIBLE.txt'),'ordinary');
 assert.deepEqual(listFiles(root,'listing-fixture').map(f=>f.path),['listing-fixture/VISIBLE.txt']);for(const path of ['../escape','a\\b','/absolute'])assert.throws(()=>safePath(root,path),{code:'PATH_DENIED'});
}finally{s.close();}});

test('POSIX preserves case-sensitive excluded names and env prefixes',{skip:process.platform==='win32'},()=>{const s=setup();try{
 const root=s.app.store.paths.physical(s.project.workspace);for(const path of ['.ENV','.ENV.local','.ds_store','NODE_MODULES'])assert.equal(safePath(root,path),join(root,path));for(const path of ['.env','.env.local','.DS_Store','node_modules'])assert.throws(()=>safePath(root,path),{code:'PATH_DENIED'});
}finally{s.close();}});
