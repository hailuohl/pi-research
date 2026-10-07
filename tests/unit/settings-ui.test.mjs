import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {SettingsView} from '../../dist/web/assets/data-views.js';
import {GitHubSettings} from '../../dist/web/assets/github-controls.js';
import {TemplateLibraryView} from '../../dist/web/assets/template-library-view.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const find=(tree,predicate)=>elements(tree).find(predicate);
const model={provider:'first',model:'default',thinking:'low'};
const boot={model,models:[{...model,thinking:'off'},{provider:'first',model:'large',thinking:'high'},{provider:'second',model:'fast',thinking:'minimal'}],runtime:{ready:true,message:'Runtime installed',node:'v24',expectedVersion:'pi'},capabilities:[{id:'matrix-only',name:'能力与验收矩阵'}]};
const view=()=>synchronousState(new SettingsView({boot,projectId:'project',perform:async fn=>fn()}));
const response=data=>({ok:true,json:async()=>data});
const connection={provider:'first',name:'Research',baseUrl:'https://api.example.com/v1',api:'openai-responses',hasApiKey:true};
const connectionData=(version=0,connections=[connection])=>({version,connections,supportedApis:['openai-completions','openai-responses','anthropic-messages'],liveVerified:false});

test('settings have three native navigation choices and preserve draft and mounted history on switch',()=>{
 const settings=view(),nav=find(settings.render(),n=>n.type==='nav'&&n.props['aria-label']==='设置分区');
 assert.equal(elements(nav).filter(n=>n.type==='button').length,3);
 find(settings.render(),n=>n.type==='input'&&n.props['aria-label']==='模型 ID').props.onChange({target:{value:'unfinished-model'}});
 for(const id of ['github','templates','models']){
  const button=find(settings.render(),n=>n.type==='button'&&n.props['aria-controls']===`settings-${id}`);button.props.onClick();
  const tree=settings.render();assert.equal(find(tree,n=>n.props.id===`settings-${id}`).props.hidden,false);
  assert.equal(find(tree,n=>n.type==='input'&&n.props['aria-label']==='模型 ID').props.value,'unfinished-model');
  assert.ok(find(tree,n=>n.type===GitHubSettings));assert.ok(find(tree,n=>n.type===TemplateLibraryView));
 }
 assert.doesNotMatch(JSON.stringify(settings.render()),/能力与验收矩阵|matrix-only/);
});

test('provider selection filters the saved model list, retaining identifiers and input limits',()=>{
 const settings=view(),rail=find(settings.render(),n=>n.type==='nav'&&n.props['aria-label']==='模型提供商');
 const providers=elements(rail).filter(n=>n.type==='button'&&n.props['aria-pressed']!==undefined);assert.equal(providers.length,2);
 providers[1].props.onClick();assert.equal(settings.state.provider,'second');assert.equal(settings.state.model,'fast');assert.equal(settings.state.thinking,'minimal');
 const catalog=find(settings.render(),n=>n.props.className==='settings-model-catalog');assert.equal(elements(catalog).filter(n=>n.type==='button').length,1);
 assert.match(JSON.stringify(catalog),/fast/);assert.doesNotMatch(JSON.stringify(catalog),/large/);
 const tree=settings.render();for(const [label,limit] of [['供应商标识',100],['模型 ID',160]]){const input=find(tree,n=>n.type==='input'&&n.props['aria-label']===label);assert.equal(input.props.required,true);assert.equal(input.props.maxLength,limit);}
 assert.match(JSON.stringify(tree),/运行时已配置 · 连接待验证/);assert.doesNotMatch(JSON.stringify(tree),/连接成功/);
 assert.match(JSON.stringify(tree),/使用现有本地配置/);assert.equal(find(tree,n=>n.type==='button'&&n.props.type==='submit'&&n.props.children==='保存为默认模型（用于新会话）').props.disabled,false);
});

test('connection read never populates a saved key and saving submits an explicit key once then clears it',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const requests=[];
 globalThis.fetch=async(url,init)=>{if(!init?.body)return response(connectionData(7,[{...connection,apiKey:'must-not-return'}]));requests.push({url,body:JSON.parse(init.body)});return response(connectionData(8));};
 const settings=view();await settings.loadConnections();assert.equal(settings.draft().apiKey,'');assert.doesNotMatch(JSON.stringify(settings.state.connections),/must-not-return/);
 const field=find(settings.render(),n=>n.type==='input'&&n.props['aria-label']==='连接 API Key');assert.equal(field.props.type,'password');assert.equal(field.props.required,false);assert.equal(field.props.value,'');
 settings.updateDraft({apiKey:'private-test-key'});await settings.saveConnection();
 assert.deepEqual(requests,[{url:'/api/settings/model-connections',body:{expectedVersion:7,provider:'first',name:'Research',baseUrl:'https://api.example.com/v1',api:'openai-responses',apiKey:'private-test-key'}}]);
 assert.equal(settings.draft().apiKey,'');assert.equal(settings.state.connections.version,8);assert.match(settings.state.connectionMessage,/待验证/);assert.doesNotMatch(JSON.stringify(settings.render()),/private-test-key|must-not-return/);
 await settings.saveConnection();assert.equal(Object.hasOwn(requests[1].body,'apiKey'),false,'a blank existing key means preserve, not clear');
});

test('connection conflict keeps drafts across provider switches and version refresh, including a provider without models',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let version=2,fail=true,posts=0;
 const noModel={...connection,provider:'no-model',name:'Only connection'};
 globalThis.fetch=async(_url,init)=>{if(!init?.body)return response(connectionData(version,[connection,noModel]));posts++;if(fail)return {ok:false,status:409,json:async()=>({error:{message:'version conflict'}})};return response(connectionData(4,[connection,noModel]));};
 const settings=view();await settings.loadConnections();settings.updateDraft({name:'Unsaved name',baseUrl:'https://draft.example.com/v1',apiKey:'retain-key'});
 settings.chooseProvider('no-model');assert.equal(settings.state.provider,'no-model');assert.equal(settings.state.model,'');assert.equal(elements(find(settings.render(),n=>n.props.className==='settings-model-catalog')).filter(n=>n.type==='button').length,0);
 settings.chooseProvider('first');assert.equal(settings.draft().name,'Unsaved name');assert.equal(settings.draft().apiKey,'retain-key');
 await settings.saveConnection();assert.equal(settings.draft().name,'Unsaved name');assert.equal(settings.draft().apiKey,'retain-key');assert.match(settings.state.connectionError,/刷新连接版本.*保留/);assert.equal(settings.state.connectionBusy,false);
 version=3;await settings.loadConnections();assert.equal(settings.state.connections.version,3);assert.equal(settings.draft().baseUrl,'https://draft.example.com/v1');assert.equal(settings.draft().apiKey,'retain-key');
 fail=false;await settings.saveConnection();assert.equal(posts,2);assert.equal(settings.state.connections.version,4);assert.equal(settings.draft().apiKey,'');
});

test('new connection requires a key and is created only by explicit save, retaining its draft on navigation',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let posts=0;
 globalThis.fetch=async(_url,init)=>{if(init?.body)posts++;return response(connectionData());};
 const settings=view();await settings.loadConnections();settings.chooseProvider('');settings.updateDraft({provider:'new-provider',name:'New provider',baseUrl:'http://localhost:8080/v1'});
 settings.chooseProvider('first');settings.chooseProvider('');assert.equal(settings.draft().provider,'new-provider');assert.equal(posts,0);
 await settings.saveConnection();assert.match(settings.state.connectionError,/API Key/);assert.equal(posts,0);
 assert.equal(find(settings.render(),n=>n.type==='input'&&n.props['aria-label']==='连接 API Key').props.required,true);
});

test('default model CAS failure keeps draft and supports refreshing only the saved version before retry',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const requests=[];let fail=true;
 globalThis.fetch=async(url,init)=>{if(!init?.body)return response({...boot,modelVersion:11});requests.push({url,body:JSON.parse(init.body)});if(fail)return {ok:false,status:409,json:async()=>({error:{message:'model version conflict'}})};return response({version:12,model:requests.at(-1).body});};
 const settings=view();settings.setState({model:'draft-model',thinking:'xhigh'});await settings.saveModel();assert.equal(settings.state.model,'draft-model');assert.match(settings.state.modelError,/刷新默认模型版本.*保留/);assert.equal(settings.state.modelBusy,false);
 await settings.refreshDefault();assert.equal(settings.state.model,'draft-model');assert.equal(settings.state.thinking,'xhigh');assert.equal(settings.state.modelVersion,11);
 fail=false;await settings.saveModel();assert.deepEqual(requests.at(-1),{url:'/api/settings/model',body:{provider:'first',model:'draft-model',thinking:'xhigh',expectedVersion:11}});assert.equal(settings.state.modelVersion,12);assert.equal(settings.state.currentDefault.model,'draft-model');
});

test('unchanged connection and default-model retries reuse independent idempotency keys after a lost response',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const posts=[];
 globalThis.fetch=async(url,init)=>{if(!init?.body)return response(connectionData());posts.push({url,key:init.headers['Idempotency-Key'],body:JSON.parse(init.body)});throw Error('response lost');};
 const settings=view();await settings.loadConnections();settings.updateDraft({apiKey:'retry-key'});
 await settings.saveConnection();await settings.saveConnection();assert.equal(posts[0].key,posts[1].key);assert.equal(settings.draft().apiKey,'retry-key');
 settings.updateDraft({name:'Changed'});await settings.saveConnection();assert.notEqual(posts[1].key,posts[2].key);
 await settings.saveModel();await settings.saveModel();assert.equal(posts[3].key,posts[4].key);assert.notEqual(posts[2].key,posts[3].key);
 settings.setState({thinking:'high'});await settings.saveModel();assert.notEqual(posts[4].key,posts[5].key);
});

test('provider identifiers matching object properties keep their own connection drafts',()=>{
 for(const provider of ['constructor','toString','__proto__']){
  const settings=view();settings.chooseProvider(provider);
  assert.equal(settings.draft().provider,provider);assert.equal(settings.draft().apiKey,'');
  settings.updateDraft({name:'Own draft',apiKey:'FAKE_draft_key'});settings.chooseProvider('first');settings.chooseProvider(provider);
  assert.equal(settings.draft().name,'Own draft');assert.equal(settings.draft().apiKey,'FAKE_draft_key');
 }
});

test('background bootstrap observes the latest default without upgrading an unsaved model draft CAS baseline',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const posts=[];
 const firstBoot={...boot,modelVersion:1},latestBoot={...boot,modelVersion:2,model:{...model,model:'other-window-model',thinking:'high'}};
 globalThis.fetch=async(_url,init)=>{if(!init?.body)return response(latestBoot);const body=JSON.parse(init.body);posts.push(body);return body.expectedVersion===2?response({version:3,model:{provider:body.provider,model:body.model,thinking:body.thinking}}):{ok:false,status:409,json:async()=>({error:{message:'model version conflict'}})};};
 for(const [label,next,original] of [['供应商标识','draft-provider',model.provider],['模型 ID','draft-model',model.model],['思考配置','xhigh',model.thinking]]){
  const settings=synchronousState(new SettingsView({boot:firstBoot,perform:async fn=>fn()}));
  find(settings.render(),n=>n.props['aria-label']===label).props.onChange({target:{value:next}});assert.equal(settings.state.modelDirty,true);
  find(settings.render(),n=>n.props['aria-label']===label).props.onChange({target:{value:original}});assert.equal(settings.state.modelDirty,false);
  settings.choose(model);assert.equal(settings.state.modelDirty,false);settings.choose(boot.models[1]);assert.equal(settings.state.modelDirty,true);
 }
 const settings=synchronousState(new SettingsView({boot:firstBoot,perform:async fn=>fn()}));
 find(settings.render(),n=>n.type==='input'&&n.props['aria-label']==='模型 ID').props.onChange({target:{value:'draft-model'}});
 const previous=settings.props;settings.props={...previous,boot:latestBoot};settings.componentDidUpdate(previous);
 assert.equal(settings.state.savedVersion,2);assert.equal(settings.state.currentDefault.model,'other-window-model');assert.equal(settings.state.modelVersion,1);assert.equal(settings.state.model,'draft-model');assert.equal(settings.state.modelDirty,true);
 await settings.saveModel();assert.equal(posts[0].expectedVersion,1);assert.match(settings.state.modelError,/version conflict/);assert.equal(settings.state.model,'draft-model');assert.equal(settings.state.modelVersion,1);
 await settings.refreshDefault();assert.equal(settings.state.model,'draft-model');assert.equal(settings.state.modelVersion,2);assert.equal(settings.state.modelDirty,true);
 await settings.saveModel();assert.equal(posts[1].expectedVersion,2);assert.equal(settings.state.modelVersion,3);assert.equal(settings.state.savedVersion,3);assert.equal(settings.state.modelDirty,false);assert.equal(settings.state.currentDefault.model,'draft-model');
 const pristine=synchronousState(new SettingsView({boot:firstBoot,perform:async fn=>fn()})),oldProps=pristine.props;pristine.props={...oldProps,boot:latestBoot};pristine.componentDidUpdate(oldProps);
 assert.equal(pristine.state.modelVersion,2);assert.equal(pristine.state.model,'other-window-model');assert.equal(pristine.state.thinking,'high');assert.equal(pristine.state.modelDirty,false);
});

test('refreshing provider B cannot upgrade provider A unsaved connection CAS baseline',async t=>{
 const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let version=1;const posts=[];
 const second={...connection,provider:'second',name:'Second connection'},serverFirst={...connection};
 globalThis.fetch=async(_url,init)=>{if(!init?.body)return response(connectionData(version,[serverFirst,second]));const body=JSON.parse(init.body);posts.push(body);if(body.expectedVersion!==version)return {ok:false,status:409,json:async()=>({error:{message:'connection version conflict'}})};Object.assign(serverFirst,{baseUrl:body.baseUrl,name:body.name});version++;return response(connectionData(version,[serverFirst,second]));};
 const settings=view();await settings.loadConnections();settings.updateDraft({baseUrl:'https://draft-first.example.com/v1',apiKey:'FAKE_first_draft_key'});assert.equal(settings.draft().version,1);
 settings.chooseProvider('second');settings.updateDraft({name:'Unsaved second name'});version=2;serverFirst.baseUrl='https://other-window.example.com/v1';await settings.loadConnections();assert.equal(settings.draft().version,2);
 settings.chooseProvider('first');assert.equal(settings.draft().version,1);assert.equal(settings.draft().baseUrl,'https://draft-first.example.com/v1');await settings.saveConnection();
 assert.equal(posts[0].expectedVersion,1);assert.match(settings.state.connectionError,/version conflict/);assert.equal(settings.draft().apiKey,'FAKE_first_draft_key');assert.equal(serverFirst.baseUrl,'https://other-window.example.com/v1');
 await settings.loadConnections();assert.equal(settings.draft().version,2);assert.equal(settings.draft().baseUrl,'https://draft-first.example.com/v1');assert.equal(settings.draft().apiKey,'FAKE_first_draft_key');await settings.saveConnection();
 assert.equal(posts[1].expectedVersion,2);assert.equal(version,3);assert.equal(settings.draft().version,3);assert.equal(settings.draft().dirty,false);assert.equal(settings.draft().apiKey,'');
 settings.chooseProvider('second');assert.equal(settings.draft().version,2,'saving A must not rebase hidden B edits');assert.equal(settings.draft().name,'Unsaved second name');
});
