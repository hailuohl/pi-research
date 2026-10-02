import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';

test('session categories filter before pagination and combine with literal search and role',()=>{
 const s=setup();try{
  const archived=[];
  for(let i=0;i<24;i++){const session=s.app.sessions.create(USER,s.project.id,{title:`Old archived ${i}`});archived.push(s.app.sessions.archive(USER,session.id,session.version));}
  for(let i=0;i<25;i++){const session=s.app.sessions.create(USER,s.project.id,{title:`Active ${i}`});if(i===0)s.app.store.update('session',session.id,session.version,{state:'failed'});}
  const other=s.app.projects.create(USER,{name:'Foreign',template:'empty'}),foreign=s.app.sessions.create(USER,other.id,{title:'Old archived foreign'});s.app.sessions.archive(USER,foreign.id,foreign.version);
  const list=input=>s.app.operations.execute(USER,'session_list',input,{projectId:s.project.id});
  let cursor;const ids=[];
  do{const page=list({stateFilter:'archived',limit:10,...(cursor?{beforeSessionId:cursor}:{})});assert.equal(page.stateFilter,'archived');assert.ok(page.items.every(r=>r.state==='archived'));ids.push(...page.items.map(r=>r.id));cursor=page.nextCursor;}while(cursor);
  assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);assert.deepEqual(ids,archived.map(r=>r.id).reverse());
  const active=list({stateFilter:'active',limit:50});assert.ok(active.items.every(r=>r.state!=='archived'));assert.ok(active.items.some(r=>r.state==='failed'));
  const all=list({stateFilter:'all',limit:50});assert.equal(all.items.length,50);assert.ok(all.items.some(r=>r.state==='archived'));
  assert.deepEqual(list({limit:50}),all,'default remains all for older clients');
  const match=list({stateFilter:'archived',query:'Old archived 7',role:'coordinator'});assert.equal(match.items.length,1);assert.equal(match.items[0].id,archived[7].id);
  assert.equal(list({stateFilter:'active',query:'Old archived 7'}).items.length,0);
  assert.throws(()=>list({stateFilter:'recent'}),{code:'INVALID_INPUT'});
  assert.throws(()=>list({stateFilter:'archived',beforeSessionId:foreign.id}),{code:'SCOPE_DENIED'});
 }finally{s.close();}
});
