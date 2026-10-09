import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {writeRoute} from '../../dist/apps/server/routes.js';
const actions=['archive','unarchive','trash','restore'];
function prepare(s,action){let p=s.app.store.get('project',s.project.id);if(action==='unarchive')p=s.app.projects.archive(USER,p.id,p.version);if(action==='restore')p=s.app.projects.trash(USER,p.id,p.version);return p;}
const snapshot=app=>JSON.stringify({records:app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()});
function request(s,path,p){const body={expectedVersion:p.version};return s.app.store.operation('POST:'+path,'same-key',{body,query:''},()=>writeRoute(s.app,{},path,body));}
for(const action of actions){
 test(`canonical ${action} retains identical same-key lifecycle replay`,()=>{const s=setup();try{const p=prepare(s,action),path=`/projects/${p.id}/${action}`,first=request(s,path,p),before=snapshot(s.app);assert.deepEqual(request(s,path,p),first);assert.equal(snapshot(s.app),before);}finally{s.close();}});
 for(const malformed of ['trailing slash','duplicate slash'])test(`${action} rejects ${malformed} before any lifecycle mutation`,()=>{const s=setup();try{const p=prepare(s,action),path=malformed==='trailing slash'?`/projects/${p.id}/${action}/`:`/projects//${p.id}/${action}`,before=snapshot(s.app);assert.throws(()=>request(s,path,p),{code:'INVALID_INPUT'});assert.equal(snapshot(s.app),before);}finally{s.close();}});
}
