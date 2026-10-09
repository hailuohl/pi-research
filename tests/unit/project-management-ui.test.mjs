import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {synchronousState} from '../support/ui.mjs';
import {ProjectManagement} from '../../dist/web/assets/project-management.js';
import {App} from '../../dist/web/assets/app.js';
import {WorkspaceView,EvidenceView} from '../../dist/web/assets/data-views.js';
import {Chat,Inspector} from '../../dist/web/assets/workbench.js';

const reply=data=>({ok:true,json:async()=>data});
const failure=(code,status=409)=>({ok:false,status,json:async()=>({error:{code,message:code}})});
const project=(id='p',archived=false,version=3)=>({id,name:`Project ${id}`,archived,version,settings:{enabled:false}});
const data=p=>({project:p,sessions:[],experiments:[],runs:[],artifacts:[],evidence:[],claims:[],reports:[],teams:[],tasks:[],budgets:[],approvals:[],wakeups:[],campaigns:[],members:[],observations:[],decisions:[],intents:[],changeProposals:[]});
const boot=projects=>({projects,runtime:{ready:false,code:'UNAVAILABLE',message:'not configured'},models:[]});
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):'';
const button=(tree,title)=>nodes(tree).find(n=>n.type==='button'&&text(n)===title);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function mockFetch(t,fn){const old=globalThis.fetch;globalThis.fetch=fn;t.after(()=>globalThis.fetch=old);}
function manager(extra={}){return synchronousState(new ProjectManagement({onClose(){},onOpen(){},selectionToken:()=>7,onChanged:async()=>{},...extra}));}
function app(t,p=project('p',true)){const view=synchronousState(new App({}));view.feed={projectId:p.id,stop(){}};view.state.projectId=p.id;view.state.data=data(p);t.after(()=>view.componentWillUnmount());return view;}

test('project management exposes archived history and an accessible named confirmation',()=>{
    const opened=[],v=manager({onOpen:id=>opened.push(id)});v.state.active=[project('a')];v.state.archived=[project('p',true)];v.state.loading=false;
    const html=renderToStaticMarkup(v.render());assert.match(html,/活动项目/);assert.match(html,/已归档项目/);assert.match(html,/打开历史/);
    button(v.render(),'打开历史').props.onClick();assert.deepEqual(opened,['p']);
    v.choose(v.state.archived[0],'unarchive');const confirmation=renderToStaticMarkup(v.render());assert.match(confirmation,/role="alertdialog"/);assert.match(confirmation,/aria-describedby="modal-description"/);assert.match(confirmation,/旧审批、授权和消息队列不会重新生效/);assert.match(confirmation,/新建会话并重新授权/);assert.match(confirmation,/确认取消归档/);
});

test('lost lifecycle reply retries the same version and idempotency key',async t=>{
    const requests=[],changed=[],v=manager({onChanged:async(p,token)=>changed.push([p.id,token])});v.choose(project(),'archive');
    mockFetch(t,async(url,options)=>{if(url.includes('?status='))return reply([]);requests.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});if(requests.length===1)throw Error('network disconnected');return reply(project('p',true,4));});
    await v.confirm();assert.ok(v.state.target);assert.equal(v.state.conflict,false);assert.deepEqual(changed,[]);
    await v.confirm();assert.deepEqual(requests[0],requests[1]);assert.deepEqual(requests[0].body,{expectedVersion:3});assert.deepEqual(changed,[['p',7]]);assert.equal(v.state.target,null);
});

test('version conflict requires refreshing and confirming target again; busy rejection preserves current target',async t=>{
    const requests=[],v=manager();v.choose(project(),'archive');let mode='conflict';
    mockFetch(t,async(url,options)=>{if(url.includes('?status='))return reply([]);if(!options.body)return reply(project('p',false,8));requests.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return mode==='success'?reply(project('p',true,9)):failure(mode==='conflict'?'VERSION_CONFLICT':'PROJECT_BUSY');});
    await v.confirm();assert.equal(v.state.conflict,true);await v.confirm();assert.equal(requests.length,1);assert.equal(v.render().props.submitDisabled,true);
    await v.reloadTarget();assert.equal(v.state.target.project.version,8);assert.equal(v.state.conflict,false);assert.equal(requests.length,1);
    mode='busy';await v.confirm();assert.equal(v.state.target.project.id,'p');assert.equal(v.state.conflict,false);assert.match(v.state.error,/PROJECT_BUSY/);assert.notEqual(requests[0].key,requests[1].key);
    mode='success';await v.confirm();assert.deepEqual(requests[1],requests[2]);assert.equal(v.state.target,null);
});

test('late management list responses cannot replace the latest project catalog',async t=>{
    const pending=[];mockFetch(t,url=>new Promise(resolve=>pending.push({url,resolve})));const v=manager();const first=v.load(),second=v.load();
    pending[2].resolve(reply([project('new')]));pending[3].resolve(reply([]));await second;pending[0].resolve(reply([project('old')]));pending[1].resolve(reply([project('gone',true)]));await first;
    assert.equal(v.state.active[0].id,'new');assert.deepEqual(v.state.archived,[]);v.componentWillUnmount();
});

test('cold reopen and refresh retain an archived selected project and its explicit old session',async t=>{
    const v=app(t);v.state.sessionId='old';v.state.historyAnchor={direction:'before',id:'m'};
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('a')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?reply(project('p',true)):url.startsWith('/api/projects/p/state')?reply(data(project('p',true))):url.startsWith('/api/sessions/old/view')?reply({session:{id:'old'},messages:[{id:'m',content:'retained'}],progress:{active:false},history:{atLatest:false}}):assert.fail(url));
    assert.equal(await v.refresh(),true);assert.equal(v.state.projectId,'p');assert.equal(v.state.sessionId,'old');assert.equal(v.state.messages[0].content,'retained');assert.equal(v.state.data.project.archived,true);
    assert.equal(await v.refresh(),true);assert.equal(v.state.projectId,'p');
});

test('archived project metadata read errors retain current view; deleted project falls back to active',async t=>{
    const v=app(t),prior=v.state.data;let deleted=false;
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('a')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?deleted?failure('PROJECT_DELETED',404):failure('READ_FAILED',503):url.startsWith('/api/projects/a/state')?reply(data(project('a'))):assert.fail(url));
    assert.equal(await v.refresh(),false);assert.equal(v.state.projectId,'p');assert.equal(v.state.data,prior);assert.match(v.state.error,/READ_FAILED/);
    deleted=true;v.feed={projectId:'a',stop(){}};assert.equal(await v.refresh(),true);assert.equal(v.state.projectId,'a');
});

test('a stale archived read or lifecycle reply cannot take over another project selection',async t=>{
    const v=app(t);let release;
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('q')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?new Promise(resolve=>release=()=>resolve(reply(project('p',true)))):url.startsWith('/api/projects/q/state')?reply(data(project('q'))):url.startsWith('/api/projects/p/state')?reply(data(project('p',true))):assert.fail(url));
    const stale=v.refresh();await tick();v.switchProject('q');v.feed={projectId:'q',stop(){}};await v.refresh();release();await stale;assert.equal(v.state.projectId,'q');assert.equal(v.state.data.project.id,'q');
    await v.projectLifecycleChanged(project('p',true,4),0);assert.equal(v.state.projectId,'q');assert.equal(v.state.data.project.id,'q');
});

test('archiving the currently selected project moves to another active project or an empty selection',async t=>{
    for(const remaining of [[project('q')],[]]){
        const v=app(t,project()),selected=[];v.switchProject=id=>{selected.push(id);v.state.projectId=id;v.state.data=null;};
        mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot(remaining)):assert.fail(url));
        await v.projectLifecycleChanged(project('p',true,4),0);assert.deepEqual(selected,[remaining[0]?.id??'']);assert.equal(v.state.projectId,remaining[0]?.id??'');
    }
});

test('a project deleted between metadata and state reads falls back without carrying its session',async t=>{
    const v=app(t);v.state.sessionId='old';v.feed={projectId:'a',stop(){}};const requested=[];
    mockFetch(t,async url=>{requested.push(url);return url==='/api/bootstrap'?reply(boot([project('a')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?reply(project('p',true)):url.startsWith('/api/projects/p/state')?failure('PROJECT_DELETED',404):url==='/api/projects/a/state'?reply(data(project('a'))):assert.fail(url);});
    assert.equal(await v.refresh(),true);assert.equal(v.state.projectId,'a');assert.equal(v.state.sessionId,'');assert.ok(!requested.some(url=>url.startsWith('/api/sessions/old')));
});

test('archived source stays readable and write controls are disabled without disabling browsing',()=>{
    const d=data(project('p',true)),workspace=synchronousState(new WorkspaceView({data:d,perform:fn=>fn()}));workspace.state.files=[{path:'notes.md',size:3}];workspace.state.path='notes.md';workspace.state.content='old';workspace.state.dirty=true;
    const tree=workspace.render();assert.equal(button(tree,'新建文件').props.disabled,true);assert.equal(button(tree,'保存文件').props.disabled,true);assert.equal(button(tree,'notes.md').props.disabled,undefined);assert.equal(nodes(tree).find(n=>n.type==='textarea').props.readOnly,true);
    const evidence=synchronousState(new EvidenceView({data:d,perform:fn=>fn(),onRegister(){},onClaim(){}}));assert.equal(nodes(evidence.render()).find(n=>n.type==='input'&&n.props.type==='file').props.disabled,true);
    const session={id:'s',title:'history',state:'idle',role:'coordinator',model:{provider:'fixture',model:'fixture'}};
    const chat=new Chat({data:d,boot:boot([]),session,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,onHistory(){},stream:'',busy:false,perform:fn=>fn(),onToggle(){},onNew(){},onExperiments(){},onWorkspace(){},onSession(){},onExperiment(){},onRun(){}});
    assert.equal(nodes(chat.render()).find(n=>n.type==='textarea').props.disabled,true);assert.equal(nodes(chat.render()).find(n=>n.props?.['aria-label']==='重命名会话').props.disabled,true);
    assert.match(renderToStaticMarkup(createElement(WorkspaceView,{data:d,perform:fn=>fn()})),/已归档项目源码只读/);
});

test('archived Inspector approval and rejection stay disabled and direct handlers cannot mutate',()=>{
    const d=data(project('p',true)),performed=[];d.project.settings.enabled=true;
    d.teams=[{id:'team',rootSessionId:'s',goal:'retained plan',state:'awaiting_approval',delegationEnabled:true}];
    d.approvals=[{id:'approval',subjectKind:'team',subjectId:'team',status:'pending',version:1}];
    const view=new Inspector({data:d,boot:boot([]),tab:'chat',sessionId:'s',perform:fn=>{performed.push(fn);return Promise.resolve();},onConfig(){},onDirective(){}});
    const approve=button(view.render(),'批准并启动协作'),reject=button(view.render(),'拒绝此计划');
    assert.equal(approve.props.disabled,true);assert.equal(reject.props.disabled,true);
    approve.props.onClick();reject.props.onClick();assert.deepEqual(performed,[]);
    assert.match(text(view.render()),/retained plan/);
});
