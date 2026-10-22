import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';
import {ProjectEventFeed} from '../../dist/web/assets/event-feed.js';

const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const project=id=>({id,name:'Project '+id,settings:{enabled:false}});
const snapshot=id=>({project:project(id),sessions:[{id:id+'-session',projectId:id,role:'coordinator',generation:0}],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],wakeups:[],intents:[]});
const boot={projects:[project('a'),project('b')]};
function fixture(t){
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage,oldStart=ProjectEventFeed.prototype.start;
  globalThis.localStorage={getItem:()=>null,setItem(){}};ProjectEventFeed.prototype.start=function(){};
  const app=synchronousState(new App({})),requests=[];
  t.after(()=>{app.componentWillUnmount();globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;ProjectEventFeed.prototype.start=oldStart;});
  const serve=url=>url==='/api/bootstrap'?response(boot):url==='/api/settings/model-management'?response({schemaVersion:2,providers:[]}):url.includes('/state')?response(snapshot(url.split('/')[3])):url.includes('/view')?response({session:{id:url.split('/')[3],generation:0},messages:[{id:'message-'+url.split('/')[3]}],progress:{active:false}}):Promise.reject(Error('Unexpected read '+url));
  globalThis.fetch=async(url,options)=>{requests.push({url,method:options.method});return serve(url);};
  return {app,requests,serve,hook:handler=>{globalThis.fetch=async(url,options)=>{requests.push({url,method:options.method});return handler(url,options);};}};
}
const main=app=>nodes(app.render()).find(node=>node.type==='main');
const retry=app=>nodes(main(app)).find(node=>node.type==='button'&&text(node)==='重试读取项目');

test('switching an existing project shows loading until its snapshot, never welcome or old content',async t=>{
  const {app,hook,serve}=fixture(t);Object.assign(app.state,{boot,data:snapshot('a'),projectId:'a',sessionId:'a-session',messages:[{id:'old-message'}]});
  let release;hook(url=>url==='/api/projects/b/state'?new Promise(resolve=>{release=()=>resolve(response(snapshot('b')));}):serve(url));
  await app.switchProject('b');await flush();
  assert.equal(app.state.data,null);assert.deepEqual(app.state.messages,[]);assert.match(text(main(app)),/正在读取项目/);assert.doesNotMatch(text(main(app)),/创建第一个项目|每一个研究/);
  assert.ok(!nodes(main(app)).some(node=>['Chat','WorkspaceView'].includes(node.type?.name)));
  const panel=nodes(app.render()).find(node=>node.type?.name==='ConversationLayout').props.panel;
  assert.equal(panel.props.active,false,'missing snapshot does not expose a second loading/error region');
  release();assert.equal(await app.refresh(),true);assert.equal(app.state.data.project.id,'b');assert.equal(app.state.messages[0].id,'message-b-session');
});

test('failed project reads expose GET-only retry and recovery preserves unrelated operation error',async t=>{
  const {app,hook,serve,requests}=fixture(t);Object.assign(app.state,{boot,projectId:'b',error:'Unrelated operation failed'});let failing=true;
  hook(url=>url==='/api/projects/b/state'&&failing?Promise.reject(Error('Snapshot unavailable')):serve(url));
  assert.equal(await app.refresh(),false);assert.match(text(main(app)),/读取项目失败/);assert.match(text(main(app)),/Snapshot unavailable/);assert.doesNotMatch(text(main(app)),/创建第一个项目/);
  assert.equal(nodes(main(app)).filter(node=>node.props?.role==='alert').length,1);assert.equal(app.state.error,'Unrelated operation failed');assert.ok(retry(app));
  failing=false;retry(app).props.onClick();assert.equal(await app.refresh(),true);
  assert.equal(app.state.projectReadError,'');assert.equal(app.state.error,'Unrelated operation failed');assert.equal(app.state.data.project.id,'b');assert.ok(requests.every(request=>request.method==='GET'));
});

test('bootstrap failure is retryable while completed empty workspace keeps welcome and management views',async t=>{
  const {app,hook,serve,requests}=fixture(t);let failing=true;
  hook(url=>url==='/api/bootstrap'?(failing?Promise.reject(Error('Bootstrap unavailable')):response({projects:[]})):serve(url));
  assert.equal(await app.refresh(),false);assert.match(text(main(app)),/Bootstrap unavailable/);assert.ok(retry(app));assert.doesNotMatch(text(main(app)),/创建第一个项目/);
  failing=false;retry(app).props.onClick();assert.equal(await app.refresh(),true);assert.match(text(main(app)),/创建第一个项目/);assert.doesNotMatch(text(main(app)),/正在读取|读取项目失败/);
  app.selectTab('settings');assert.ok(nodes(main(app)).some(node=>node.type?.name==='SettingsView'));
  app.selectTab('environment');assert.ok(nodes(main(app)).some(node=>node.type?.name==='EnvironmentView'));assert.ok(requests.every(request=>request.method==='GET'));
});

test('known projects without a selected id cannot render welcome before first snapshot',t=>{
  const {app}=fixture(t);app.state.boot=boot;assert.match(text(main(app)),/正在读取项目/);assert.doesNotMatch(text(main(app)),/创建第一个项目/);
});

test('quiet failures keep an existing view quiet but missing snapshots report failure',async t=>{
  const {app,hook}=fixture(t);Object.assign(app.state,{boot,projectId:'a',sessionId:'a-session',data:snapshot('a')});hook(()=>Promise.reject(Error('Read unavailable')));
  assert.equal(await app.refresh(true),false);assert.equal(app.state.projectReadError,'');assert.equal(app.state.error,'');assert.equal(app.state.data.project.id,'a');
  assert.equal(await app.refresh(),false);assert.equal(app.state.projectReadError,'Read unavailable');assert.match(text(app.render()),/读取项目失败/);assert.equal(app.state.data.project.id,'a');
  app.state.data=null;app.state.projectReadError='';assert.equal(await app.refresh(true),false);assert.match(text(main(app)),/Read unavailable/);assert.ok(retry(app));
  app.selectTab('settings');assert.ok(nodes(main(app)).some(node=>node.type?.name==='SettingsView'));
  app.selectTab('environment');assert.ok(nodes(main(app)).some(node=>node.type?.name==='EnvironmentView'));
});

test('explicit retry clears only the read error during waiting and keeps the mounted draft view',async t=>{
  const {app,hook,serve}=fixture(t);Object.assign(app.state,{boot,projectId:'a',sessionId:'a-session',data:snapshot('a'),error:'Operation failed'});
  const chatBefore=nodes(main(app)).find(node=>node.type?.name==='Chat'),chat=synchronousState(new chatBefore.type(chatBefore.props));chat.state.draft='Unsent draft';chat.state.attachments=[{artifactId:'kept'}];
  hook(()=>Promise.reject(Error('Refresh failed')));assert.equal(await app.refresh(),false);assert.equal(app.state.projectReadError,'Refresh failed');
  let release;hook(url=>url==='/api/bootstrap'?new Promise(resolve=>{release=()=>resolve(response(boot));}):serve(url));const pending=app.refresh();
  assert.equal(app.state.projectReadError,'');assert.equal(app.state.error,'Operation failed');assert.equal(nodes(main(app)).find(node=>node.type?.name==='Chat').key,chatBefore.key);
  release();assert.equal(await pending,true);assert.equal(app.state.error,'Operation failed');chat.props=nodes(main(app)).find(node=>node.type?.name==='Chat').props;assert.equal(chat.state.draft,'Unsent draft');assert.deepEqual(chat.state.attachments,[{artifactId:'kept'}]);
});

test('A to B to A rejects late B success and failure, including a queued selection update',async t=>{
  const {app,hook,serve}=fixture(t);
  for(const outcome of ['success','failure']){
    Object.assign(app.state,{boot,projectId:'a',sessionId:'a-session',data:snapshot('a')});let finish;
    hook(url=>url==='/api/projects/b/state'?new Promise((resolve,reject)=>{finish=()=>outcome==='success'?resolve(response(snapshot('b'))):reject(Error('Stale B failure'));}):serve(url));
    await app.switchProject('b');await flush();const oldRead=app.refresh(),updates=[],apply=app.setState;
    app.setState=(update,callback)=>updates.push([update,callback]);const switched=app.switchProject('a');
    finish();assert.equal(await oldRead,false);assert.equal(updates.length,1,'late read cannot enqueue a state overwrite while selection awaits React');
    app.setState=apply;for(const [update,callback]of updates)apply(update,callback);assert.equal(await switched,true);assert.equal(await app.refresh(),true);
    assert.equal(app.state.projectId,'a');assert.equal(app.state.data.project.id,'a');assert.equal(app.state.messages[0].id,'message-a-session');assert.equal(app.state.projectReadError,'');
  }
});

test('manual operations preserve the actual receipt after failed final refresh and pass connection freshness to the task panel',async t=>{
 const {app,hook}=fixture(t);Object.assign(app.state,{boot,projectId:'a',sessionId:'a-session',data:snapshot('a'),connected:true});
 assert.equal(nodes(main(app)).find(n=>n.type?.name==='Chat').props.readCurrent,true);
 hook(()=>Promise.reject(Error('Refresh unavailable')));const receipt={receiptCheck:'pass',applicability:'current'},result=await app.perform(async()=>receipt);assert.equal(result,receipt);assert.equal(app.state.connected,false);assert.equal(app.state.data.project.id,'a');const chat=nodes(main(app)).find(n=>n.type?.name==='Chat');assert.equal(chat.props.readCurrent,false);assert.equal(await chat.props.validationPerform(async()=>receipt),undefined,'D3 alone withholds current after its failed final refresh');
});
