import test from 'node:test';
import assert from 'node:assert/strict';
import {App} from '../../dist/web/assets/app.js';
import {synchronousState} from '../support/ui.mjs';

const response=data=>({ok:true,json:async()=>data});
const boot={projects:[],model:{provider:'configured',model:'science',thinking:'brief'},models:[]};
const catalog={schemaVersion:2,version:7,providers:[{provider:'configured',models:[{model:'science',name:'Configured science',reasoning:{defaultLevel:'brief',levels:[{id:'brief',label:'简短分析',piLevel:'low'},{id:'investigate',label:'充分分析',piLevel:'high'}]}}]}]};
function appFor(t){
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  const app=synchronousState(new App({}));
  t.after(()=>{app.componentWillUnmount();globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
  return app;
}

test('app refresh carries configured model names, level IDs and labels without boot reconstruction',async t=>{
  const app=appFor(t),paths=[];
  globalThis.fetch=async path=>{paths.push(path);return response(path.endsWith('/bootstrap')?boot:catalog);};
  assert.equal(await app.refresh(),true);
  assert.deepEqual(app.state.boot.modelManagement,catalog);
  assert.equal(app.state.boot.modelManagement.providers[0].models[0].reasoning.levels[1].label,'充分分析');
  assert.equal(app.state.boot.modelManagementError,'');
  assert.deepEqual(paths,['/api/bootstrap','/api/settings/model-management']);
});

test('model metadata failure keeps the app usable and exposes no fallback catalogue',async t=>{
  const app=appFor(t);
  for(const failed of [()=>{throw Error('catalogue offline');},()=>response({schemaVersion:1,providers:[]})]){
    globalThis.fetch=async path=>path.endsWith('/bootstrap')?response(boot):failed();
    assert.equal(await app.refresh(),true);
    assert.equal(app.state.connected,true);
    assert.equal(app.state.boot.modelManagement,null);
    assert.ok(app.state.boot.modelManagementError);
    assert.deepEqual(app.state.boot.model,boot.model);
  }
});

test('a delayed catalogue cannot publish after app unmount',async t=>{
  const app=appFor(t);let finish;
  globalThis.fetch=async path=>path.endsWith('/bootstrap')?response(boot):new Promise(resolve=>{finish=()=>resolve(response(catalog));});
  const read=app.refresh();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof finish,'function');
  app.componentWillUnmount();finish();
  assert.equal(await read,false);
  assert.equal(app.state.boot,null);
});

test('confirmed session model remains visible if the following refresh fails, without replacing history',async t=>{
  const app=appFor(t),before={id:'s',projectId:'p',version:2,model:boot.model},confirmed={...before,version:3,model:{...boot.model,thinking:'investigate'}};
  Object.assign(app.state,{projectId:'p',sessionId:'s',data:{project:{id:'p'},sessions:[before]},messages:[{id:'retained-history'}]});
  app.confirmSessionModel(confirmed);
  globalThis.fetch=async()=>{throw Error('refresh unavailable');};
  assert.equal(await app.refresh(),false);
  assert.deepEqual(app.state.data.sessions[0],confirmed);
  assert.deepEqual(app.state.messages,[{id:'retained-history'}]);
  app.confirmSessionModel(before);
  assert.deepEqual(app.state.data.sessions[0],confirmed,'late lower-version confirmations cannot revert the selection');
});

test('a confirmation for a departed project or session does not publish into the current conversation',t=>{
  const app=appFor(t),current={id:'s',projectId:'p',version:2,model:boot.model};
  Object.assign(app.state,{projectId:'p',sessionId:'s',data:{project:{id:'p'},sessions:[current]}});
  for(const other of [{...current,id:'other',version:3},{...current,projectId:'other',version:3}])app.confirmSessionModel(other);
  assert.deepEqual(app.state.data.sessions,[current]);
  app.componentWillUnmount();app.confirmSessionModel({...current,version:3});
  assert.deepEqual(app.state.data.sessions,[current]);
});
