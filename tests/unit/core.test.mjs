import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../dist/packages/storage/store.js';
import { BudgetService } from '../../dist/packages/policy/budget.js';
import { safePath, readText, writeText, snapshotDirectory } from '../../dist/packages/workspace/files.js';
import { validateGraph } from '../../dist/packages/collaboration/graph.js';
const temp = () => mkdtempSync(join(tmpdir(),'pi-core-'));
function withStore(fn) { const dir=temp(); const db=new Store(join(dir,'state.db')); try { return fn(db,dir); } finally { db.close();rmSync(dir,{recursive:true,force:true}); } }
test('transactions roll back records and events together',()=>withStore(db=>{
 assert.throws(()=>db.transaction(()=>{db.create('project',null,{name:'A'});db.event(null,'created',{});throw new Error('crash');}));
 assert.equal(db.list('project').length,0); assert.equal(db.events(0).length,0);
}));
test('same operation is replayed; changed payload conflicts',()=>withStore(db=>{
 const create=()=>db.create('project',null,{name:'A'});
 const a=db.operation('user:POST:/projects','req-1',{name:'A'},create);
 const b=db.operation('user:POST:/projects','req-1',{name:'A'},create);
 assert.equal(a.id,b.id); assert.equal(db.list('project').length,1);
 assert.throws(()=>db.operation('user:POST:/projects','req-1',{name:'B'},create),{code:'IDEMPOTENCY_CONFLICT'});
}));
test('optimistic versions reject lost updates',()=>withStore(db=>{
 const a=db.create('project',null,{name:'A'});db.update('project',a.id,1,{name:'B'});
 assert.throws(()=>db.update('project',a.id,1,{name:'C'}),{code:'VERSION_CONFLICT'});
}));
test('cross-project record access fails',()=>withStore(db=>{
 const a=db.create('artifact','p1',{title:'private'});
 assert.throws(()=>db.get('artifact',a.id,'p2'),{code:'SCOPE_DENIED'});
}));
test('SQLite records survive reopening',()=>{const dir=temp();try{let db=new Store(join(dir,'x.db'));const p=db.create('project',null,{name:'persist'});db.close();db=new Store(join(dir,'x.db'));assert.equal(db.get('project',p.id).name,'persist');db.close();}finally{rmSync(dir,{recursive:true,force:true});}});
test('budget reservations are atomic and idempotent',()=>withStore(db=>{
 const budget=new BudgetService(db); budget.configure('p','t',3);
 const a=budget.reserve('p','t','attempt-1',2);assert.equal(budget.reserve('p','t','attempt-1',2).id,a.id);
 assert.throws(()=>budget.reserve('p','t','attempt-2',2),{code:'BUDGET_EXCEEDED'});
 budget.settle(a.id,1); assert.equal(budget.summary('t').available,2);
}));
test('unknown model usage retains reservation',()=>withStore(db=>{
 const budget=new BudgetService(db); budget.configure('p','t',2); const a=budget.reserve('p','t','a',2);
 budget.markUnknown(a.id);assert.equal(budget.summary('t').available,0);
}));
test('path traversal, absolute paths and symlinks are refused',()=>{const dir=temp();try{
 assert.throws(()=>safePath(dir,'../secret'),{code:'PATH_DENIED'});assert.throws(()=>safePath(dir,'/etc/passwd'),{code:'PATH_DENIED'});
 symlinkSync(dir,join(dir,'outside'),process.platform==='win32'?'junction':'dir');assert.throws(()=>safePath(dir,'outside/a'),{code:'PATH_DENIED'});
}finally{rmSync(dir,{recursive:true,force:true});}});
test('file editing checks hash and preserves newer content',()=>{const dir=temp();try{
 const a=writeText(dir,'src/a.txt','first',null);writeText(dir,'src/a.txt','second',a.digest);
 assert.throws(()=>writeText(dir,'src/a.txt','third',a.digest),{code:'FILE_VERSION_CONFLICT'});assert.equal(readText(dir,'src/a.txt').content,'second');
}finally{rmSync(dir,{recursive:true,force:true});}});
test('snapshot digest is deterministic and unaffected by later source changes',()=>{const dir=temp();try{
 mkdirSync(join(dir,'src'));writeFileSync(join(dir,'src','a.txt'),'hello'); const a=snapshotDirectory(join(dir,'src'),join(dir,'snapshots'));const b=snapshotDirectory(join(dir,'src'),join(dir,'snapshots'));assert.equal(a.digest,b.digest);
 writeFileSync(join(dir,'src','a.txt'),'changed');assert.equal(readText(a.path,'a.txt').content,'hello');assert.notEqual(snapshotDirectory(join(dir,'src'),join(dir,'snapshots')).digest,a.digest);
}finally{rmSync(dir,{recursive:true,force:true});}});
test('graph rejects cycles and unknown prerequisites',()=>{
 assert.throws(()=>validateGraph([{key:'a',role:'analyst',objective:'a',dependencies:['b']},{key:'b',role:'writer',objective:'b',dependencies:['a']}]),{code:'TASK_GRAPH_CYCLE'});
 assert.throws(()=>validateGraph([{key:'a',role:'analyst',objective:'a',dependencies:['missing']}]),{code:'TASK_DEPENDENCY_UNKNOWN'});
});
test('critical tasks need an independent review node',()=>{
 assert.throws(()=>validateGraph([{key:'a',role:'designer',objective:'design',dependencies:[],critical:true}]),{code:'REVIEW_REQUIRED'});
 assert.equal(validateGraph([{key:'a',role:'designer',objective:'design',dependencies:[],critical:true},{key:'r',role:'reviewer',objective:'review',dependencies:[],reviewOf:'a'}]).length,2);
});
