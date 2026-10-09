import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {readRoute,writeRoute} from '../../dist/apps/server/routes.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {Store} from '../../dist/packages/storage/store.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
const snapshot=app=>JSON.stringify({rows:app.store.db.prepare('SELECT * FROM records ORDER BY kind,id').all(),events:app.store.db.prepare('SELECT * FROM events ORDER BY seq').all(),operations:app.store.db.prepare('SELECT * FROM operations ORDER BY scope,key').all()});
const read=(app,path)=>readRoute(app,{status:()=>({})},path.split('?')[0],new URL('http://localhost'+path));
const archive=s=>s.app.projects.archive(USER,s.project.id,s.app.store.get('project',s.project.id).version);

test('archive and unarchive retain fixed history, expose canonical lifecycle, and keep reads pure',()=>{const s=setup();try{
 const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);
 const original=s.app.sources.read(USER,s.project.id,{experimentId:s.baseline.id,revision:1,path:'config.json'});
 const workspace=s.app.projects.readFile(USER,s.project.id,'README.md');
 const a=archive(s);assert.equal(a.status,'archived');assert.equal(a.lifecycleEpoch,1);assert.equal(a.archived,true);
 assert.deepEqual(read(s.app,'/projects'),[]);assert.equal(read(s.app,'/projects?status=archived')[0].id,a.id);
 const before=snapshot(s.app);assert.equal(read(s.app,'/projects/'+a.id).status,'archived');assert.equal(read(s.app,'/projects/'+a.id+'/state').project.id,a.id);
 assert.equal(read(s.app,'/sessions/'+s.session.id).id,s.session.id);assert.equal(s.app.sources.read(USER,a.id,{experimentId:s.baseline.id,revision:1,path:'config.json'}).digest,original.digest);
 assert.equal(s.app.operations.execute(USER,'workspace_read',{source:'project',path:'README.md'},{projectId:a.id}).content,workspace.content);
 assert.equal(snapshot(s.app),before);assert.throws(()=>s.app.sessions.send(USER,s.session.id,{content:'new work'}),{code:'PROJECT_ARCHIVED'});
 assert.throws(()=>s.app.projects.unarchive(USER,a.id,a.version-1),{code:'VERSION_CONFLICT'});
 const restored=writeRoute(s.app,{},'/projects/'+a.id+'/unarchive',{expectedVersion:a.version});assert.equal(restored.id,a.id);assert.equal(restored.lifecycleEpoch,2);assert.equal(restored.status,'active');assert.equal(s.app.store.get('approval',intent.approvalId).status,'stale');
 assert.equal(s.app.store.list('experiment',a.id).length,1);assert.equal(s.app.store.list('source-revision',a.id).length,1);
 assert.equal(JSON.parse(s.app.store.db.prepare("SELECT data FROM records WHERE kind='project' AND id=?").get(a.id).data).archived,undefined);
}finally{s.close();}});

test('every admitted execution class rejects archival atomically, including unknown transports and live leases',()=>{
 const cases=[['sandbox-job',{state:'queued',manifest:{resources:{cpus:1,memoryMb:512},dockerContext:'fixture'}}],['agent-admission',{state:'unknown'}],['model-http-request',{state:'active'}],['model-http-request',{state:'interrupted',ownerKind:'owner-native',transportEnded:false}],['host-command',{state:'unknown'}],['native-request',{state:'unknown'}],['git-operation',{state:'running'}],['github-upload-job',{state:'unknown'}],['workspace-lease',{until:Date.now()+60000}],['task-attempt',{state:'unknown'}],['operation-pending',{operation:'document_import'}],['session-action',{state:'executing'}],['wakeup',{state:'queued'}]];
 for(const [kind,fields]of cases){const s=setup();try{s.app.store.create(kind,s.project.id,fields);const before=snapshot(s.app);assert.throws(()=>archive(s),{code:'PROJECT_BUSY'},kind);assert.equal(snapshot(s.app),before,kind);}finally{s.close();}}
 const s=setup();try{s.app.sessions.send(USER,s.session.id,{content:'accepted queue'});assert.throws(()=>archive(s),{code:'PROJECT_BUSY'});}finally{s.close();}
});

test('restore and reopen never revive revoked grants, permissions, queued history or previously unscanned automation',()=>{const s=setup();try{
 for(const kind of ['working-grant','run-grant','discovery-grant','text-corpus-grant'])s.app.store.create(kind,s.project.id,{state:'active'});
 s.app.store.create('host-access',s.project.id,{sessionId:s.session.id,state:'enabled',epoch:3,runtimeId:'old'},s.session.id);
 s.app.store.create('session-permission',s.project.id,{sessionId:s.session.id,mode:'autoEdit',epoch:4},s.session.id);
 const m=s.app.store.create('message',s.project.id,{sessionId:s.session.id,role:'user',status:'queued',content:'old queue'});
 const team=s.app.store.create('team',s.project.id,{state:'completed',rootSessionId:s.session.id,autoSummarize:true,goal:'old result',planVersion:1,directiveVersion:1});
 let a=archive(s);a=s.app.projects.unarchive(USER,a.id,a.version);
 for(const kind of ['working-grant','run-grant','discovery-grant','text-corpus-grant'])assert.equal(s.app.store.list(kind,a.id)[0].state,'revoked');
 assert.equal(s.app.store.get('host-access',s.session.id).state,'revoked');assert.equal(s.app.store.get('host-access',s.session.id).epoch,4);assert.equal(s.app.store.get('session-permission',s.session.id).epoch,5);assert.equal(s.app.sessionPermissions.capture(s.session.id).mode,'confirm');assert.equal(s.app.store.get('message',m.id).status,'cancelled');
 s.app.wakeups.reconcile();assert.equal(s.app.store.list('wakeup',a.id).length,0);assert.equal(s.app.store.get('team',team.id).state,'completed');
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());s.app.wakeups.reconcile();assert.equal(s.app.store.list('wakeup',a.id).length,0);assert.equal(s.app.store.get('project',a.id).lifecycleEpoch,2);
}finally{s.close();}});

test('legacy archived fixtures normalize to one persistent state and reopening migrates legacy rows',()=>{const s=setup();try{
 const p=s.app.store.create('project',null,{archived:false});assert.equal(p.status,'active');let next=s.app.store.update('project',p.id,p.version,{archived:true});assert.equal(next.status,'archived');assert.equal(next.lifecycleEpoch,1);next=s.app.store.update('project',p.id,next.version,{archived:false});assert.equal(next.status,'active');assert.equal(next.lifecycleEpoch,2);
 const data=JSON.parse(s.app.store.db.prepare("SELECT data FROM records WHERE kind='project' AND id=?").get(p.id).data);delete data.status;delete data.lifecycleEpoch;data.archived=true;s.app.store.db.prepare("UPDATE records SET data=? WHERE kind='project' AND id=?").run(JSON.stringify(data),p.id);
 s.app.store.db.exec('DROP TRIGGER project_record_epoch_insert; DROP TABLE project_record_epochs; DELETE FROM schema_migrations WHERE version=12');
 const reopened=new Store(s.app.store.path);try{const row=reopened.get('project',p.id);assert.equal(row.status,'archived');assert.equal(row.lifecycleEpoch,0);assert.equal(JSON.parse(reopened.db.prepare("SELECT data FROM records WHERE kind='project' AND id=?").get(p.id).data).archived,undefined);}finally{reopened.close();}
}finally{s.close();}});

test('async connector final acceptance rejects archive-restore ABA despite active status',async()=>{const s=setup();try{
 const c=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({minIntervalMs:0,fetcher:async()=>{const a=archive(s);s.app.projects.unarchive(USER,a.id,a.version);return Response.json({results:[{id:'https://openalex.org/W123',title:'Old response'}]});}})});
 c.configure(USER,s.project.id,{expectedVersion:0,enabled:{openalex:true}});
 await assert.rejects(c.discover(USER,s.project.id,{query:'old',sources:['openalex']},'aba'),{code:'PROJECT_LIFECYCLE_STALE'});
 assert.equal(s.app.store.list('connector-search',s.project.id).length,0);assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(s.app.store.get('project',s.project.id).status,'active');
}finally{s.close();}});

test('trash and purging states fail closed on direct-ID history routes and operation reads',()=>{const s=setup();try{
 for(const status of ['trashed','purging']){const p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{status});assert.throws(()=>read(s.app,'/sessions/'+s.session.id),{code:'PROJECT_UNAVAILABLE'});assert.throws(()=>s.app.operations.execute(USER,'workspace_list',{source:'project'},{projectId:p.id}),{code:'PROJECT_UNAVAILABLE'});}
}finally{s.close();}});
