import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {PublicationDialogue} from '../../dist/web/assets/publication-dialogue.js';
import {ResearchActionCard} from '../../dist/web/assets/research-action-cards.js';
import {LiteratureView} from '../../dist/web/assets/literature-view.js';
import {readRoute} from '../../dist/apps/server/routes.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {compilerProfile} from '../../dist/packages/publications/build-service.js';
import {setup,USER,approve} from '../support/research.mjs';

const elements=node=>Array.isArray(node)?node.flatMap(elements):node&&typeof node==='object'?[node,...elements(node.props?.children)]:[];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'||typeof node==='number'?String(node):'';
const button=(tree,label)=>elements(tree).find(n=>n.type==='button'&&text(n)===label);
const root={id:'root',projectId:'project',role:'coordinator',state:'idle',title:'Main'};
const revision={id:'revision',rootSessionId:root.id,title:'Old fixed paper',sourceDigest:'source',engine:'pdflatex',files:[]};
const job={id:'job',revisionId:revision.id,manifestDigest:'manifest',sourceDigest:'source',approvalId:'approval',state:'running',integrity:'pending',generation:1,cancelRequested:false,engine:'pdflatex',mainFile:'main.tex',resources:{cpus:1,memoryMb:256,timeoutSeconds:60},imageDigest:'image'};
const data=()=>({project:{id:'project',settings:{enabled:false}},manuscripts:[revision],publicationJobs:[job],publicationReviews:[],publicationExports:[],reports:[],approvals:[],documents:[],literatureTasks:[],documentParseJobs:[]});
const dialogue=(d=data(),session=root)=>synchronousState(new PublicationDialogue({data:d,session,disabled:false,perform:async f=>f()}));
const state=(app,pid,sid)=>readRoute(app,{},`/projects/${pid}/state`,new URL(`http://localhost/projects/${pid}/state?sessionId=${sid}`));

// Removing the referenced-old-revision union must hide this real prepared job again.
test('selected snapshot keeps old pending build reachable beyond 30 revisions, bounded and root-local after reopen',()=>{
 const s=setup();let reopened;try{
  const app=s.app,pid=s.project.id,sid=s.session.id,imageId='sha256:'+'a'.repeat(64);
  app.store.create('publication-compiler-settings',null,{...compilerProfile(process.cwd()),dockerContext:'default',imageDigest:imageId,imageId},'global');
  const create=(owner,title)=>app.publicationBuilds.createRevision(USER,pid,{title,engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from('Fixed manuscript').toString('base64')}]},()=>{},undefined,owner);
  const old=create(sid,'Old pending revision'),terminalOld=create(sid,'Old terminal revision');
  const terminalJob=app.publicationBuilds.prepare(USER,pid,{revisionId:terminalOld.id});app.publicationBuilds.cancel(USER,pid,terminalJob.id);
  for(let i=0;i<35;i++)create(sid,'Recent '+i);
  const pending=app.publicationBuilds.prepare(USER,pid,{revisionId:old.id});
  const other=app.sessions.create(USER,pid,{title:'Other root'}),foreign=create(other.id,'Foreign old paper');app.publicationBuilds.prepare(USER,pid,{revisionId:foreign.id});
  const snapshot=state(app,pid,sid);assert.ok(snapshot.publicationJobs.some(j=>j.id===pending.id));assert.ok(snapshot.manuscripts.some(r=>r.id===old.id),'prepared job must include its old revision');
  assert.ok(snapshot.manuscripts.length<=60);assert.ok(snapshot.manuscripts.every(r=>r.rootSessionId===sid));assert.ok(!snapshot.publicationJobs.some(j=>j.revisionId===foreign.id));
  const ui=dialogue(snapshot,s.session);assert.ok(button(ui.render(),'批准并编译'));assert.equal(app.store.get('approval',pending.approvalId).status,'pending');
  app.close();reopened=new ResearchApp(s.dir,process.cwd());const again=state(reopened,pid,sid);assert.ok(again.manuscripts.some(r=>r.id===old.id));assert.equal(again.publicationJobs.find(j=>j.id===pending.id).state,'prepared');
  const saved=reopened.store.get('session',sid);reopened.store.update('session',sid,saved.version,{state:'archived'});const archived=state(reopened,pid,sid);assert.ok(archived.manuscripts.every(r=>r.rootSessionId===sid));assert.ok(!archived.manuscripts.some(r=>r.id===foreign.id));
 }finally{reopened?.close();s.close();}
});

// Removing the cancel handler/button must leave queued/running/unknown jobs without a user action.
test('dialogue cancellation is exact, idempotent, refreshable, and never claims a request stopped the worker',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const requests=[];let release;
 globalThis.fetch=(url,options)=>{requests.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return new Promise(resolve=>{release=()=>resolve(new Response(JSON.stringify({...job,cancelRequested:true})));});};
 for(const state of ['queued','starting','running','unknown'])assert.ok(button(dialogue({...data(),publicationJobs:[{...job,state}]}).render(),'请求取消文稿编译'),state);
 const ui=dialogue(),cancel=button(ui.render(),'请求取消文稿编译');assert.ok(cancel);const pending=ui.cancel(job),duplicate=ui.cancel(job);assert.equal(requests.length,1);release();await Promise.all([pending,duplicate]);
 assert.deepEqual(requests[0].body,{projectId:'project',sessionId:'root',input:{jobId:'job'}});assert.ok(requests[0].key);assert.match(requests[0].url,/publication_cancel$/);
 // Parent refresh/reopen supplies durable cancelRequested; it is not the cancelled terminal state.
 const requested=dialogue({...data(),publicationJobs:[{...job,cancelRequested:true}]});assert.match(text(requested.render()),/已请求取消.*等待.*确认/);assert.equal(button(requested.render(),'请求取消文稿编译').props.disabled,true);
 assert.ok(button(requested.render(),'刷新此编译状态'));
 globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify({...job,state:'cancelled',cancelRequested:true}));};
 await requested.refreshJob({...job,cancelRequested:true});assert.match(requests.at(-1).url,/publication_inspect$/);assert.equal(requests.at(-1).body.input.jobId,'job');
 assert.doesNotMatch(text(dialogue({...data(),publicationJobs:[{...job,state:'cancelled',cancelRequested:true}]}).render()),/已请求取消.*等待.*确认/);
});

test('cancel guards reject archived and foreign contexts and stale job manifests without sending',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);globalThis.fetch=async()=>assert.fail('invalid context must not send');
 for(const ui of [dialogue({...data(),project:{...data().project,archived:true}}),dialogue(data(),{...root,state:'archived'}),dialogue({...data(),manuscripts:[{...revision,rootSessionId:'foreign'}]})])await assert.rejects(ui.cancel(job));
 const ui=dialogue();await assert.rejects(ui.cancel({...job,manifestDigest:'stale'}));
});

const document={id:'document',projectId:'project',title:'Fixed PDF',contentKind:'original-pdf',acquiredAt:'2026-10-22',original:{artifactId:'raw',digest:'raw-digest'},source:{kind:'local',versionAssurance:'unknown'},license:{assurance:'unknown'},limitations:[]};
const parsed={id:'parsed-job',documentVersionId:document.id,state:'succeeded',integrity:'complete',resultId:'parse-result',rawDigest:'raw-digest',resources:{}};
function documentPane(props={}){const d={...data(),documents:[document],documentParseJobs:[parsed]},view=synchronousState(new LiteratureView({data:d,session:root,perform:async f=>f(),readOnly:true,...props}));view.state.document=document;const element=elements(view.render()).find(n=>n.type?.name==='DocumentPane');return synchronousState(new element.type(element.props));}

// Breaking either forwarding hop or conflating selection with readOnly must disable this real action.
test('requested read-only document history selects one successful fixed pair without enabling mutators',()=>{
 const selected=[],d={...data(),documents:[document],documentParseJobs:[parsed]},request={id:'request',projectId:'project',sessionId:'root',input:{kind:'history',history:{kind:'documents'}},state:'pending',effectiveState:'pending',reasons:[]};
 const card=synchronousState(new ResearchActionCard({data:d,session:root,request,busy:false,perform:async f=>f(),onSession(){},onRun(){},onUseDocument:target=>selected.push(target)}));
 const element=elements(card.render()).find(n=>n.type===LiteratureView);assert.ok(element);assert.equal(element.props.readOnly,true);const view=synchronousState(new element.type(element.props));view.state.document=document;
 const paneElement=elements(view.render()).find(n=>n.type?.name==='DocumentPane'),pane=synchronousState(new paneElement.type(paneElement.props)),tree=pane.render(),use=button(tree,'带入当前会话');
 assert.equal(use.props.disabled,false);use.props.onClick();assert.deepEqual(selected,[{documentVersionId:'document',parseResultId:'parse-result'}]);
 for(const name of ['准备固定文档解析','显式保存解析配置','批准固定文档解析','提交已批准解析','请求取消解析'])assert.equal(button(tree,name),undefined,name);
 assert.ok(!elements(view.render()).some(n=>n.type?.name==='TextEvidencePanel'||n.type?.name==='DiscoveryGrants'||n.type==='input'&&n.props.type==='file'));
});

test('fixed-document selection requires explicit selection capability and the current active coordinator',()=>{
 for(const props of [{},{allowDocumentSelection:true,session:{...root,state:'archived'}},{allowDocumentSelection:true,session:{...root,projectId:'other'}},{allowDocumentSelection:true,session:{...root,role:'reviewer'}},{allowDocumentSelection:true,session:{...root,taskId:'task'}},{allowDocumentSelection:true,session:{...root,teamId:'team'}},{allowDocumentSelection:true,data:{...data(),project:{...data().project,archived:true},documentParseJobs:[parsed]}}]){
  const pane=documentPane({onUseDocument:()=>assert.fail('invalid selection'),...props});const use=button(pane.render(),'带入当前会话');assert.equal(use.props.disabled,true);use.props.onClick();
 }
 for(const bad of [{...parsed,state:'failed'},{...parsed,integrity:'invalid'},{...parsed,resultId:undefined}]){const pane=documentPane({allowDocumentSelection:true,onUseDocument(){},data:{...data(),documentParseJobs:[bad]}});assert.equal(button(pane.render(),'带入当前会话'),undefined);}
});

test('fixed-document selection refuses a document from another project even with a selection callback',()=>{
 const pane=documentPane({allowDocumentSelection:true,onUseDocument:()=>assert.fail('foreign document must not be selected')});pane.props={...pane.props,document:{...document,projectId:'other'}};
 const use=button(pane.render(),'带入当前会话');assert.equal(use.props.disabled,true);use.props.onClick();
});

test('user cancellation persists real queued, running, and unknown job state without Agent authority',()=>{
 const s=setup();let reopened;try{
  const app=s.app,pid=s.project.id,imageId='sha256:'+'a'.repeat(64);app.store.create('publication-compiler-settings',null,{...compilerProfile(process.cwd()),dockerContext:'default',imageDigest:imageId,imageId},'global');
  const revision=app.publicationBuilds.createRevision(USER,pid,{title:'Cancel fixed paper',engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from('Fixed').toString('base64')}]},()=>{},undefined,s.session.id),ids=[];
  for(const state of ['queued','running','unknown']){
   const prepared=app.publicationBuilds.prepare(USER,pid,{revisionId:revision.id}),row=app.store.get('publication-build-job',prepared.id);approve(app,prepared.approvalId);
   app.store.update('publication-build-job',row.id,row.version,{state,...(state==='queued'?{}:{startRequested:true,containerId:'UNIT-container'})});
   const context={projectId:pid,sessionId:s.session.id,idempotencyKey:'cancel-'+row.id},cancelled=app.operations.execute(USER,'publication_cancel',{jobId:row.id},context),again=app.operations.execute(USER,'publication_cancel',{jobId:row.id},context);
   assert.equal(cancelled.cancelRequested,true);assert.equal(cancelled.state,state==='queued'?'cancelled':state);assert.deepEqual(again,cancelled);ids.push(row.id);
   assert.throws(()=>app.publicationBuilds.cancel({type:'agent',projectId:pid,sessionId:s.session.id,role:'coordinator',generation:1},pid,row.id),{code:'PERMISSION_DENIED'});
  }
  app.close();reopened=new ResearchApp(s.dir,process.cwd());for(const id of ids)assert.equal(reopened.publicationBuilds.inspect(USER,pid,id).cancelRequested,true);
 }finally{reopened?.close();s.close();}
});
