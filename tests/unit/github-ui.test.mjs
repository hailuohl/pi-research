import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ProjectCreationModal,GitHubSettings} from '../../dist/web/assets/github-controls.js';
import {App} from '../../dist/web/assets/app.js';
const ready={ready:true,gitInstalled:true,cliInstalled:true,version:'2.101.0',account:{id:42,login:'example'},state:'ready',message:'已就绪',checkedAt:'2026-10-07T00:00:00Z'};
const local={version:0,enabled:false,state:'local',pendingCount:0,retryable:false};
const fields=()=>{const fd=new FormData();fd.set('name','材料筛选研究');fd.set('description','');fd.set('template','empty');return fd;};
function nodes(node,out=[]){if(Array.isArray(node)){for(const x of node)nodes(x,out);}else if(node&&typeof node==='object'){out.push(node);nodes(node.props?.children,out);}return out;}
const response=(body,status=200)=>new Response(JSON.stringify(body),{status});
function creation(t){
 const previous={fetch:globalThis.fetch,localStorage:globalThis.localStorage,window:globalThis.window};
 globalThis.localStorage={getItem:()=>null,setItem(){}};globalThis.window={setTimeout:()=>0,removeEventListener(){}};
 const app=synchronousState(new App({}));app.refresh=async()=>true;Object.assign(app.state,{modal:'project',projectId:'old-project',sessionId:'old-session'});
 const element=app.modalView(),view=synchronousState(new ProjectCreationModal(element.props));view.mounted=true;
 t.after(()=>{view.mounted=false;app.componentWillUnmount();Object.assign(globalThis,previous);});
 return {app,view,key:element.key};
}

test('real App creation failures stay in the dialog, preserve the body and retry identity, then allow corrected success',async t=>{
 const {app,view}=creation(t),calls=[],fd=fields();fd.set('name','   ');fd.set('description','PROJECT_CREATE_UI_20261012');
 globalThis.fetch=async(url,init)=>{if(url.endsWith('/github/status'))return response(ready);calls.push({url,...init});return url.endsWith('/projects')?(JSON.parse(init.body).name.trim()?response({id:'new-project'}):response({error:{code:'INVALID_INPUT',message:'name 必须是长度不超过 120 的文本'}},400)):response({id:'new-session'});};
 await view.submit(fd);
 assert.match(view.state.error,/name 必须/);assert.ok(nodes(view.render()).some(n=>n.props?.role==='alert'&&String(n.props.children).includes('name 必须')));
 assert.equal(app.state.modal,'project');assert.equal(app.state.projectId,'old-project');assert.equal(app.state.sessionId,'old-session');assert.equal(app.state.notice,'');assert.equal(calls.length,1);
 await view.loadStatus();assert.match(view.state.error,/name 必须/);
 const fetch=globalThis.fetch;globalThis.fetch=async()=>{throw Error('CLI check unavailable');};await view.loadStatus();assert.match(view.state.error,/name 必须/);assert.match(view.state.statusError,/CLI check unavailable/);globalThis.fetch=fetch;
 await view.submit(fd);assert.equal(calls.length,2);assert.equal(calls[0].body,calls[1].body);assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);assert.equal(fd.get('name'),'   ');assert.equal(fd.get('description'),'PROJECT_CREATE_UI_20261012');
 fd.set('name','Corrected project');view.changed();await view.submit(fd);
 assert.equal(calls.length,4);assert.notEqual(calls[1].headers['Idempotency-Key'],calls[2].headers['Idempotency-Key']);assert.equal(calls[3].headers['Idempotency-Key'],calls[2].headers['Idempotency-Key']+'-session');assert.equal(app.state.modal,'');assert.equal(app.state.projectId,'new-project');assert.equal(app.state.sessionId,'new-session');assert.match(app.state.notice,/本地项目已创建/);
});

test('real App project success followed by session failure retries the exact two bodies and keys',async t=>{
 const {app,view}=creation(t),calls=[];let sessions=0,projects=0;const projectsByKey=new Map();
 globalThis.fetch=async(url,init)=>{calls.push({url,...init});if(url.endsWith('/projects')){const key=init.headers['Idempotency-Key'];if(!projectsByKey.has(key)){projects++;projectsByKey.set(key,{id:'one-project'});}return response(projectsByKey.get(key));}return ++sessions===1?response({error:{message:'session unavailable'}},503):response({id:'one-session'});};
 await view.submit(fields());assert.match(view.state.error,/session unavailable/);assert.equal(app.state.projectId,'old-project');assert.equal(app.state.notice,'');
 await view.submit(fields());assert.equal(projects,1);assert.deepEqual(calls.map(c=>c.url),['/api/projects','/api/sessions','/api/projects','/api/sessions']);assert.equal(calls[0].body,calls[2].body);assert.equal(calls[1].body,calls[3].body);assert.equal(calls[0].headers['Idempotency-Key'],calls[2].headers['Idempotency-Key']);assert.equal(calls[1].headers['Idempotency-Key'],calls[3].headers['Idempotency-Key']);assert.equal(app.state.modal,'');
});

test('real App network failure can be cancelled and reopened without carrying the failed dialog or old callback',async t=>{
 const {app,view,key}=creation(t),calls=[];globalThis.fetch=async(url)=>{calls.push(url);throw Error('network unavailable');};
 await view.submit(fields());assert.match(view.state.error,/network unavailable/);const old=view.props.onCreate;
 app.close();view.componentWillUnmount();await app.open('project');const element=app.modalView(),next=synchronousState(new ProjectCreationModal(element.props));next.mounted=true;
 assert.notEqual(element.key,key);assert.equal(next.state.error,'');await assert.rejects(old({name:'Old',description:'',template:'empty'},'old-key'),/未提交/);assert.deepEqual(calls,['/api/projects']);assert.equal(app.state.modal,'project');assert.equal(app.state.projectId,'old-project');assert.equal(next.state.error,'');
});

test('parent busy skip is an explicit unsubmitted dialog failure and never reaches fetch',async t=>{
 const {app,view}=creation(t);app.state.busy=true;let calls=0;globalThis.fetch=async()=>{calls++;return response({});};
 await view.submit(fields());assert.match(view.state.error,/未提交/);assert.equal(app.state.modal,'project');assert.equal(app.state.notice,'');assert.equal(calls,0);
});

test('late creation success or failure cannot select a project, close or report into a newer dialog',async t=>{
 for(const stage of ['project','session'])for(const fail of [false,true])await t.test(`late ${stage} ${fail?'failure':'success'}`,async t=>{
  const {app,view}=creation(t),calls=[];let resolve;globalThis.fetch=async(url)=>{calls.push(url);return new Promise(r=>{resolve=r;});};
  const submit=view.submit(fields());assert.equal(app.state.busy,true);assert.equal(view.render().props.busy,true);
  const duplicate=view.submit(fields());await duplicate;assert.equal(calls.length,1);
  if(stage==='session'){resolve(response({id:'late-project'}));await new Promise(r=>setImmediate(r));assert.equal(calls.length,2);}
  await app.open('config',{content:'new dialog'});view.componentWillUnmount();resolve(fail?response({error:{message:'late rejected'}},400):response({id:'late-result'}));await submit;
  assert.equal(app.state.modal,'config');assert.equal(app.state.projectId,'old-project');assert.equal(app.state.sessionId,'old-session');assert.equal(app.state.notice,'');assert.equal(app.state.error,'');assert.equal(calls.length,stage==='session'?2:1);assert.equal(view.state.error,'');
 });
});

test('creation is complete even when the subsequent App refresh fails',async t=>{
 const {app,view}=creation(t);app.refresh=async()=>{throw Error('refresh unavailable');};globalThis.fetch=async url=>response(url.endsWith('/projects')?{id:'new-project'}:{id:'new-session'});
 await view.submit(fields());assert.equal(view.state.error,'');assert.equal(app.state.modal,'');assert.equal(app.state.projectId,'new-project');assert.match(app.state.notice,/本地项目已创建/);assert.match(app.state.error,/refresh unavailable/);
});

test('queued creation selection rechecks the modal intent when the update commits and still settles',async t=>{
 const {app,view}=creation(t),queue=[],apply=app.setState;let settled=false;
 globalThis.fetch=async url=>response(url.endsWith('/projects')?{id:'created-project'}:{id:'created-session'});
 app.setState=(update,callback)=>{if(callback)queue.push({update,callback});else apply(update);};
 const submit=view.submit(fields()).then(()=>{settled=true;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(queue.length,1);assert.equal(settled,false);assert.equal(app.state.projectId,'old-project');
 await app.open('config',{content:'new dialog'});view.componentWillUnmount();
 const pending=queue.shift();apply(pending.update,pending.callback);await submit;
 assert.equal(settled,true);assert.equal(app.state.projectId,'old-project');assert.equal(app.state.sessionId,'old-session');assert.equal(app.state.modal,'config');assert.equal(app.state.modalData.content,'new dialog');assert.equal(app.state.notice,'');assert.equal(app.state.error,'');assert.equal(app.state.busy,false);
});

test('new project stays local without gh, gates opt-in and keeps one request identity across retries',async()=>{
 const calls=[],v=synchronousState(new ProjectCreationModal({busy:false,onClose(){},onCreate:async(input,key)=>calls.push({input,key})}));
 v.mounted=true;
 const checkbox=()=>nodes(v.render()).find(n=>n.type==='input'&&n.props.type==='checkbox');
 assert.equal(checkbox().props.checked,false);assert.equal(checkbox().props.disabled,true);
 await v.submit(fields());await v.submit(fields());assert.equal(calls.length,2);assert.ok(!('github'in calls[0].input));assert.equal(calls[0].key,calls[1].key);
 v.state.upload=true;await v.submit(fields());assert.equal(calls.length,2);assert.match(v.state.error,/尚未就绪/);
 v.state.status=ready;v.changed();assert.equal(checkbox().props.disabled,false);await v.submit(fields());assert.deepEqual(calls[2].input.github,{enabled:true,expectedAccountId:42});assert.notEqual(calls[2].key,calls[1].key);
});

test('GitHub settings never replace a newly selected project with a late status response',async()=>{
 const original=global.fetch,pending=[];global.fetch=async(url)=>new Promise(resolve=>pending.push({url,resolve}));
 const v=synchronousState(new GitHubSettings({projectId:'first'}));v.mounted=true;
 try{const first=v.loadProject();v.props={projectId:'second'};const second=v.loadProject();assert.match(pending[0].url,/first\/github$/);assert.match(pending[1].url,/second\/github$/);
 pending[1].resolve(new Response(JSON.stringify({...local,version:2})));await second;
 pending[0].resolve(new Response(JSON.stringify({...local,version:1})));await first;assert.equal(v.state.project.version,2);
 }finally{v.mounted=false;clearTimeout(v.timer);global.fetch=original;}
});

test('CLI state cannot be replaced by an older account check or a response after unmount',async()=>{
 const original=global.fetch,pending=[];global.fetch=async()=>new Promise(resolve=>pending.push(resolve));
 const v=synchronousState(new ProjectCreationModal({busy:false,onClose(){},onCreate:async()=>{}}));v.mounted=true;
 try{const first=v.loadStatus(),second=v.loadStatus();pending[1](new Response(JSON.stringify(ready)));await second;pending[0](new Response(JSON.stringify({...ready,account:{id:7,login:'old'}})));await first;assert.equal(v.state.status.account.id,42);
 const third=v.loadStatus();v.mounted=false;pending[2](new Response(JSON.stringify({...ready,ready:false})));await third;assert.equal(v.state.status.ready,true);
 }finally{global.fetch=original;}
});
