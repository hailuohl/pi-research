import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync,existsSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest,Store} from '../../dist/packages/storage/store.js';
import {readRoute,writeRoute} from '../../dist/apps/server/routes.js';
const read=(app,path)=>readRoute(app,{},path.split('?')[0],new URL('http://localhost'+path));
const state=app=>JSON.stringify({records:app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()});
const fields=['id','name','version','status','lifecycleEpoch','archived','createdAt','updatedAt','deletedAt','restoreStatus'];
const summary=p=>{assert.ok(Object.keys(p).every(k=>fields.includes(k)));assert.equal(p.workspace,undefined);assert.equal(p.description,undefined);assert.equal(p.settings,undefined);};
const trashed=s=>{const p=s.app.store.get('project',s.project.id);return s.app.store.update('project',p.id,p.version,{status:'trashed',restoreStatus:p.status,deletedAt:new Date().toISOString()});};

test('trash and restore retain source and identifiers while exposing only management summaries',()=>{const s=setup();try{
 const source=s.app.sources.read(USER,s.project.id,{experimentId:s.baseline.id,revision:1,path:'config.json'}),records=s.app.store.list('source-revision',s.project.id),p=s.app.store.get('project',s.project.id);
 const deleted=s.app.projects.trash(USER,p.id,p.version);summary(deleted);assert.equal(deleted.status,'trashed');assert.equal(deleted.restoreStatus,'active');assert.equal(deleted.lifecycleEpoch,1);assert.ok(Date.parse(deleted.deletedAt));
 assert.deepEqual(read(s.app,'/projects'),[]);assert.deepEqual(read(s.app,'/projects?status=trashed'),[deleted]);assert.deepEqual(read(s.app,`/projects/${p.id}/lifecycle`),deleted);
 assert.throws(()=>read(s.app,`/projects/${p.id}`),{code:'PROJECT_DELETED',status:410});assert.throws(()=>read(s.app,`/sessions/${s.session.id}`),{code:'PROJECT_DELETED',status:410});
 assert.deepEqual(s.app.store.list('source-revision',p.id),records);assert.equal(digest(readFileSync(join(s.app.store.paths.physical(records[0].snapshot.path),'config.json'))),source.digest);
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());const restored=s.app.projects.restore(USER,p.id,deleted.version);summary(restored);assert.equal(restored.id,p.id);assert.equal(restored.status,'active');assert.equal(restored.lifecycleEpoch,2);assert.equal(restored.deletedAt,undefined);assert.equal(restored.restoreStatus,undefined);assert.equal(s.app.sources.read(USER,p.id,{experimentId:s.baseline.id,revision:1,path:'config.json'}).digest,source.digest);
 const archived=s.app.projects.archive(USER,p.id,restored.version),again=s.app.projects.trash(USER,p.id,archived.version),back=s.app.projects.restore(USER,p.id,again.version);assert.equal(back.status,'archived');assert.equal(back.lifecycleEpoch,5);
}finally{s.close();}});

test('deleted project cached operations and direct historical replay cannot expose old contents',()=>{const s=setup();try{
 const body={projectId:s.project.id},response=s.app.store.operation('POST:/sessions','retained',{body,query:''},()=>s.session),scope=`operation:user:${s.project.id}:project`,input={name:'run_prepare',input:{experimentId:s.baseline.id}};
 s.app.store.operation(scope,'canonical',input,()=>({projectId:s.project.id,private:'research-content'}));trashed(s);
 assert.throws(()=>s.app.store.operationResult('POST:/sessions','retained',{body,query:''}),{code:'PROJECT_DELETED',status:410});assert.throws(()=>s.app.store.operation('POST:/sessions','retained',{body,query:''},()=>{throw Error('must not execute');}),{code:'PROJECT_DELETED',status:410});assert.throws(()=>s.app.store.operationResult(scope,'canonical',input),{code:'PROJECT_DELETED',status:410});assert.equal(response.id,s.session.id);
}finally{s.close();}});

test('global event pages omit deleted project payloads without losing pagination progress',()=>{const s=setup();try{
 const start=s.app.store.eventCursor(),other=s.app.projects.create(USER,{name:'retained'});s.app.store.event(s.project.id,'secret',{private:'research secret'});const visible=s.app.store.event(other.id,'visible',{ok:true});s.app.store.event(s.project.id,'last-secret',{private:'last secret'});trashed(s);
 const result=read(s.app,`/events?after=${start}&limit=1`);assert.ok(result.items.every(item=>item.projectId!==s.project.id));let cursor=result.cursor,items=[...result.items];for(let n=0;n<10&&cursor<result.latestCursor;n++){const next=read(s.app,`/events?after=${cursor}&limit=1`);items.push(...next.items);assert.ok(next.cursor>cursor);cursor=next.cursor;}
 assert.ok(items.some(item=>item.seq===visible.seq));assert.ok(items.every(item=>item.projectId!==s.project.id));assert.throws(()=>read(s.app,`/events?projectId=${s.project.id}`),{code:'PROJECT_DELETED',status:410});
}finally{s.close();}});

test('trash rejects busy execution and stale versions atomically and cannot be delegated',()=>{const s=setup();try{
 const p=s.app.store.get('project',s.project.id),admission=s.app.store.create('agent-admission',p.id,{state:'unknown'}),before=state(s.app);assert.throws(()=>s.app.projects.trash(USER,p.id,p.version),{code:'PROJECT_BUSY'});assert.equal(state(s.app),before);s.app.store.update('agent-admission',admission.id,admission.version,{state:'released'});const idle=state(s.app);assert.throws(()=>s.app.projects.trash(USER,p.id,p.version+1),{code:'VERSION_CONFLICT'});assert.equal(state(s.app),idle);assert.throws(()=>s.app.projects.trash({type:'agent',projectId:p.id},p.id,p.version),{code:'PERMISSION_DENIED'});
}finally{s.close();}});


test('receipt ownership migration, strict unknown handling and explicit global proofs preserve boundaries',()=>{const s=setup();try{
 const insert=(scope,key,response)=>s.app.store.db.prepare('INSERT INTO operations(scope,key,hash,response,created_at) VALUES(?,?,?,?,?)').run(scope,key,digest({}),JSON.stringify(response),new Date().toISOString());
 insert('POST:/settings/model','known-global',{provider:'fixture',model:'fixture',thinking:'off'});insert('opaque-legacy','unknown',{secret:'unknown research'});assert.throws(()=>s.app.store.operationResult('opaque-legacy','unknown',{}),{code:'OPERATION_OWNERSHIP_UNKNOWN'});
 const global=s.app.store.operation('trusted-platform','global',{},()=>({configuration:'global'}),{kind:'global'});assert.deepEqual(s.app.store.operationResult('trusted-platform','global',{}),{found:true,value:global});
 insert('POST:/sessions/'+s.session.id+'/host-access','scoped',{sessionId:s.session.id});insert('POST:/projects','created',s.project);
 const other=s.app.projects.create(USER,{name:'other'});insert('POST:/projects/'+s.project.id,'conflict',{projectId:other.id,private:'conflict'});assert.throws(()=>s.app.store.operationResult('POST:/projects/'+s.project.id,'conflict',{}),{code:'OPERATION_OWNERSHIP_CONFLICT'});
 s.app.store.db.exec('DROP INDEX operations_project; ALTER TABLE operations DROP COLUMN owner_kind; ALTER TABLE operations DROP COLUMN project_id; DELETE FROM schema_migrations WHERE version=13');
 const db=new Store(s.app.store.path);try{assert.equal(db.db.prepare('SELECT owner_kind FROM operations WHERE key=?').get('scoped').owner_kind,'project');assert.equal(db.db.prepare('SELECT owner_kind FROM operations WHERE key=?').get('created').owner_kind,'project');assert.equal(db.db.prepare('SELECT owner_kind FROM operations WHERE key=?').get('unknown').owner_kind,'unknown');assert.equal(db.db.prepare('SELECT owner_kind FROM operations WHERE key=?').get('known-global').owner_kind,'global');const p=db.get('project',s.project.id);db.update('project',p.id,p.version,{status:'trashed'});for(const [scope,key]of [['POST:/sessions/'+s.session.id+'/host-access','scoped'],['POST:/projects','created']])assert.throws(()=>db.operationResult(scope,key,{}),{code:'PROJECT_DELETED'});assert.throws(()=>db.operationResult('opaque-legacy','unknown',{}),{code:'OPERATION_OWNERSHIP_UNKNOWN'});assert.equal(db.operationResult('POST:/settings/model','known-global',{}).value.provider,'fixture');}finally{db.close();}
}finally{s.close();}});

test('management replay is summary-only and cannot be used to return an older project response',()=>{const s=setup();try{
 const p=s.app.store.get('project',s.project.id),scope=`POST:/projects/${p.id}/trash`,input={body:{expectedVersion:p.version},query:''};
 const first=s.app.store.operation(scope,'trash',input,()=>s.app.projects.trash(USER,p.id,p.version));summary(first);assert.deepEqual(s.app.store.operation(scope,'trash',input,()=>{throw Error('must not trash twice');}),first);
 assert.throws(()=>s.app.store.operationResult(scope,'trash',input,{kind:'global'}),{code:'OPERATION_OWNERSHIP_CONFLICT'});
 s.app.store.db.prepare('UPDATE operations SET response=? WHERE scope=? AND key=?').run(JSON.stringify({...first,workspace:'private workspace'}),scope,'trash');assert.throws(()=>s.app.store.operationResult(scope,'trash',input),{code:'OPERATION_RECEIPT_INVALID'});
}finally{s.close();}});


test('hidden-only event tails reset once then remain stable and accept later visible events',()=>{const s=setup();try{
 const visible=s.app.store.event(null,'public',{ok:true}),hidden=s.app.store.event(s.project.id,'secret-tail',{private:'secret'});trashed(s);
 const reset=s.app.store.eventPage(hidden.seq);assert.equal(reset.reset,true);assert.equal(reset.cursor,visible.seq);assert.equal(reset.hasMore,false);
 const empty=s.app.store.eventPage(reset.cursor);assert.equal(empty.reset,false);assert.equal(empty.cursor,reset.cursor);assert.equal(empty.hasMore,false);assert.deepEqual(empty.items,[]);
 const next=s.app.store.event(null,'next-public',{ok:true});assert.deepEqual(s.app.store.eventPage(empty.cursor).items.map(e=>e.seq),[next.seq]);
}finally{s.close();}});


test('trash preserves every owned file and record while permanently retiring old authority and automation',()=>{const s=setup();try{
 const tree=(root,relative='')=>readdirSync(join(root,relative),{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>{const path=relative?relative+'/'+entry.name:entry.name,full=join(root,path);return entry.isDirectory()?[[path,'directory'],...tree(root,path)]:[[path,digest(readFileSync(full)),lstatSync(full).mode]];});
 s.app.evidence.put(s.project.id,'retained artifact',Buffer.from('retained bytes'));
 writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'retained-note.txt'),'retained workspace bytes');
 const files=()=>['projects','experiments','sessions','workspaces','snapshots','artifacts'].map(name=>[name,existsSync(join(s.dir,name))?tree(join(s.dir,name)):null]);
 const grant=s.app.store.create('working-grant',s.project.id,{state:'active'}),message=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'user',status:'queued',content:'old pending'}),team=s.app.store.create('team',s.project.id,{state:'completed',rootSessionId:s.session.id,autoSummarize:true,goal:'old summary',planVersion:1,directiveVersion:1});
 const before=files(),ids=s.app.store.db.prepare('SELECT kind,id FROM records WHERE project_id=? ORDER BY kind,id').all(s.project.id),p=s.app.store.get('project',s.project.id),deleted=s.app.projects.trash(USER,p.id,p.version);assert.deepEqual(files(),before);
 const restored=s.app.projects.restore(USER,p.id,deleted.version);assert.deepEqual(files(),before);for(const row of ids)assert.ok(s.app.store.maybe(row.kind,row.id));assert.equal(s.app.store.get('working-grant',grant.id).state,'revoked');assert.equal(s.app.store.get('message',message.id).status,'cancelled');assert.equal(s.app.sessionPermissions.capture(s.session.id).mode,'confirm');
 s.app.wakeups.reconcile();assert.equal(s.app.store.list('wakeup',p.id).length,0);assert.equal(s.app.store.get('team',team.id).state,'completed');assert.equal(restored.lifecycleEpoch,2);
}finally{s.close();}});
