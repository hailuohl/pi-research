import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {synchronousState} from '../support/ui.mjs';
import {ProjectManagement,powershellPurgeCommand} from '../../dist/web/assets/project-management.js';
import {App} from '../../dist/web/assets/app.js';
import {WorkspaceView,EvidenceView} from '../../dist/web/assets/data-views.js';
import {Chat,Inspector} from '../../dist/web/assets/workbench.js';

const reply=data=>({ok:true,json:async()=>data});
const failure=(code,status=409)=>({ok:false,status,json:async()=>({error:{code,message:code}})});
const project=(id='p',archived=false,version=3)=>({id,name:`Project ${id}`,status:archived?'archived':'active',lifecycleEpoch:0,archived,version,createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T00:00:00Z',settings:{enabled:false}});
const lifecycle=(status='trashed',restoreStatus='active',version=4)=>({id:'p',name:'Project p',status,restoreStatus,version,lifecycleEpoch:2,archived:status!=='active',createdAt:'2026-10-09T00:00:00Z',updatedAt:'2026-10-09T01:00:00Z',deletedAt:'2026-10-09T01:00:00Z'});
const purge=(projectId='p',state='pending',extra={})=>({projectId,purgeId:'purge-'+projectId,state,phase:state==='completed'?'completed':'waiting_offline',completedPaths:0,totalPaths:0,updatedAt:'2026-10-09T01:00:00Z',dataDir:'D:\\research data',offlineRequired:true,...extra});
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
    pending[4].resolve(reply([project('new')]));pending[5].resolve(reply([]));pending[6].resolve(reply([]));pending[7].resolve(reply([]));await second;pending[0].resolve(reply([project('old')]));pending[1].resolve(reply([project('gone',true)]));pending[2].resolve(reply([]));pending[3].resolve(reply([]));await first;
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
    assert.equal(await v.refresh(),false);assert.equal(v.state.projectId,'p');assert.equal(v.state.data,prior);assert.match(v.state.projectReadError,/READ_FAILED/);assert.equal(v.state.error,'');
    deleted=true;v.feed={projectId:'a',stop(){}};assert.equal(await v.refresh(),true);assert.equal(v.state.projectId,'a');assert.equal(v.state.projectReadError,'');
});

test('a stale archived read or lifecycle reply cannot take over another project selection',async t=>{
    const v=app(t);let release;
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('q')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?new Promise(resolve=>release=()=>resolve(reply(project('p',true)))):url.startsWith('/api/projects/q/state')?reply(data(project('q'))):url.startsWith('/api/projects/p/state')?reply(data(project('p',true))):assert.fail(url));
    const stale=v.refresh();await tick();await v.switchProject('q');v.feed={projectId:'q',stop(){}};await v.refresh();release();await stale;assert.equal(v.state.projectId,'q');assert.equal(v.state.data.project.id,'q');
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

test('recycle bin reload reads only management summaries and never exposes history',async t=>{
    const requests=[],v=manager();mockFetch(t,async url=>{requests.push(url);return reply(url.endsWith('status=trashed')?[lifecycle()]:[]);});
    await v.load();const group=nodes(v.render()).find(n=>n.type==='section'&&n.props['aria-label']==='回收站');
    assert.match(text(group),/Project p.*删除前：活动.*移入时间/s);assert.equal(button(group,'还原').props.disabled,false);
    assert.ok(!nodes(group).some(n=>n.type==='button'&&/打开|归档|清空/.test(text(n))));assert.equal(button(group,'永久删除').props.disabled,false);assert.ok(requests.every(url=>url.includes('/projects?status=')));
    await v.load();assert.equal(v.state.trashed[0].id,'p');assert.equal(requests.filter(url=>url.endsWith('status=trashed')).length,2);
});

test('moving active or archived projects to trash confirms retained files and retries lost replies with the same request',async t=>{
    for(const archived of [false,true]){
        const requests=[],changed=[],v=manager({onChanged:async p=>changed.push(p)});v.choose(project('p',archived),'trash');
        assert.match(renderToStaticMarkup(v.render()),/文件保留且可还原/);assert.match(renderToStaticMarkup(v.render()),/确认移入回收站/);
        mockFetch(t,async(url,options)=>{if(url.includes('?status='))return reply([]);requests.push({url,body:options.body,key:options.headers['Idempotency-Key']});if(requests.length===1)throw Error('lost trash reply');return reply(lifecycle('trashed',archived?'archived':'active'));});
        await v.confirm();assert.ok(v.state.target);assert.deepEqual(changed,[]);await v.confirm();assert.deepEqual(requests[0],requests[1]);assert.ok(requests[0].url.endsWith('/trash'));assert.equal(changed[0].status,'trashed');assert.equal(changed[0].settings,undefined);
    }
});

test('restore returns to its recorded active or archived status without reopening old authority',async t=>{
    for(const status of ['active','archived']){
        const changed=[],v=manager({onChanged:async p=>changed.push(p)});v.choose(lifecycle('trashed',status),'restore');
        const markup=renderToStaticMarkup(v.render());assert.match(markup,/旧审批、权限、消息队列和自动化不会重新生效/);assert.match(markup,/确认还原/);
        mockFetch(t,async url=>url.includes('?status=')?reply([]):reply(lifecycle(status,status,5)));
        await v.confirm();assert.equal(changed[0].id,'p');assert.equal(changed[0].status,status);assert.equal(v.state.target,null);
    }
});

test('restore status mismatch preserves confirmation and a version conflict refreshes through lifecycle only',async t=>{
    const requests=[],changed=[],v=manager({onChanged:async p=>changed.push(p)});v.choose(lifecycle('trashed','archived'),'restore');let mode='conflict';
    mockFetch(t,async(url,options)=>{requests.push({url,key:options.headers['Idempotency-Key']});if(url.endsWith('/lifecycle'))return reply(lifecycle('trashed','archived',7));if(url.includes('?status='))return reply([]);return mode==='conflict'?failure('VERSION_CONFLICT'):reply(lifecycle('active','archived',8));});
    await v.confirm();assert.equal(v.state.conflict,true);await v.reloadTarget();assert.ok(requests.at(-1).url.endsWith('/lifecycle'));assert.equal(v.state.target.project.version,7);assert.equal(requests.length,2);
    mode='wrong-result';await v.confirm();assert.match(v.state.error,/响应与确认目标不一致/);assert.ok(v.state.target);assert.deepEqual(changed,[]);assert.notEqual(requests[0].key,requests[2].key);
});

test('a trash summary clears current research data before bootstrap and a late reply does not take over a newer selection',async t=>{
    const v=app(t,project()),selected=[];Object.assign(v.state,{sessionId:'s',messages:[{id:'secret'}],pendingMessages:[{id:'queue'}],stream:'old stream',selectedRun:'run',selectedReport:'report',selectedDocument:{documentVersionId:'doc'},modal:'projects'});
    let release;mockFetch(t,url=>new Promise(resolve=>release=()=>resolve(reply(boot([project('a')])))));
    v.switchProject=id=>{selected.push(id);v.projectSelectionEpoch++;v.state.projectId=id;v.state.data=data(project(id));};
    const changing=v.projectLifecycleChanged(lifecycle(),0);await tick();assert.equal(v.state.data,null);assert.equal(v.state.projectId,'');assert.equal(v.state.sessionId,'');assert.deepEqual(v.state.messages,[]);assert.deepEqual(v.state.pendingMessages,[]);assert.equal(v.state.stream,'');assert.equal(v.state.selectedDocument,null);assert.equal(v.state.selectedRun,'');assert.equal(v.state.selectedReport,'');assert.equal(v.state.modal,'projects');
    v.switchProject('q');release();await changing;assert.deepEqual(selected,['q']);assert.equal(v.state.data.project.id,'q');
});

test('minimal archived lifecycle summaries preserve complete project fields while switching safely',async t=>{
    const v=app(t,project());let release;mockFetch(t,url=>new Promise(resolve=>release=()=>resolve(reply(boot([])))));v.switchProject=id=>{v.state.projectId=id;v.state.data=null;};
    const changing=v.projectLifecycleChanged(lifecycle('archived'),0);await tick();assert.ok(v.state.data.project.settings);assert.equal(v.state.data.project.archived,true);assert.doesNotThrow(()=>v.render());release();await changing;assert.equal(v.state.projectId,'');
});

test('a newer selection made during deleted-view clearing is preserved before bootstrap begins',async t=>{
    const v=app(t,project());mockFetch(t,async url=>assert.fail('no bootstrap should take over the newer selection: '+url));
    const originalSetState=v.setState;v.setState=(update,callback)=>originalSetState(update,()=>{if(update.projectId===''){v.projectSelectionEpoch++;v.state.projectId='q';v.state.data=data(project('q'));}callback?.();});
    await v.projectLifecycleChanged(lifecycle(),0);assert.equal(v.state.projectId,'q');assert.equal(v.state.data.project.id,'q');
});

test('a deleted cold reopen clears cached research even when the fallback active project cannot be read',async t=>{
    const v=app(t);v.state.sessionId='old';v.state.messages=[{id:'old'}];v.state.stream='old';v.state.selectedReport='report';
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('q')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url==='/api/projects/p'?failure('PROJECT_DELETED',410):url.startsWith('/api/projects/q/state')?failure('READ_FAILED',503):assert.fail(url));
    assert.equal(await v.refresh(),false);assert.equal(v.state.data,null);assert.equal(v.state.sessionId,'');assert.deepEqual(v.state.messages,[]);assert.equal(v.state.stream,'');assert.equal(v.state.selectedReport,'');assert.match(v.state.projectReadError,/READ_FAILED/);assert.equal(v.state.error,'');
});

test('a delayed deleted-session response clears the old view and safely falls back',async t=>{
    const v=app(t,project());v.state.sessionId='s';v.state.messages=[{id:'old'}];let release;
    mockFetch(t,async url=>url==='/api/bootstrap'?reply(boot([project('p'),project('q')])):url==='/api/settings/model-management'?reply({schemaVersion:2,providers:[]}):url.startsWith('/api/projects/p/state')?reply(data(project())):url.startsWith('/api/sessions/s/view')?new Promise(resolve=>release=()=>resolve(failure('PROJECT_DELETED',410))):url.startsWith('/api/projects/q/state')?reply(data(project('q'))):url.startsWith('/api/events')?failure('NO_STREAM',503):assert.fail(url));
    const reading=v.refresh();await tick();release();assert.equal(await reading,true);assert.equal(v.state.projectId,'q');assert.equal(v.state.data.project.id,'q');assert.equal(v.state.sessionId,'');assert.deepEqual(v.state.messages,[]);
});

test('permanent deletion requires the exact name, shows the full ID and cannot be submitted by bypassing the disabled button',async t=>{
    const calls=[],v=manager(),p={...lifecycle(),id:'11111111-1111-1111-1111-111111111111',name:'Same project name'};v.choose(p,'purge');
    mockFetch(t,async url=>{calls.push(url);return reply(purge(p.id));});
    const markup=renderToStaticMarkup(v.render());assert.match(markup,new RegExp(p.id));assert.match(markup,/不能再还原/);assert.match(markup,/不自动停止或杀死任何任务/);assert.equal(v.render().props.submitDisabled,true);
    await v.confirm();v.state.confirmName='same project name';await v.confirm();v.state.confirmName=p.name+' ';await v.confirm();assert.deepEqual(calls,[]);
    const input=nodes(v.render()).find(n=>n.props?.['aria-label']==='永久删除确认项目名称');assert.equal(input.props['aria-invalid'],true);input.props.onChange({target:{value:p.name}});assert.equal(v.render().props.submitDisabled,false);
});

test('a lost purge reply reuses the exact name, version and key then enters pending progress without invoking App lifecycle callbacks',async t=>{
    const calls=[],changed=[],v=manager({onChanged:async p=>changed.push(p)});v.choose(lifecycle(),'purge');v.state.confirmName='Project p';
    mockFetch(t,async(url,options)=>{if(url.includes('?status='))return reply([]);calls.push({url,body:options.body,key:options.headers['Idempotency-Key']});if(calls.length===1)throw Error('lost reply');return reply(purge());});
    await v.confirm();assert.ok(v.state.target);assert.equal(v.state.conflict,false);await v.confirm();assert.deepEqual(calls[0],calls[1]);assert.deepEqual(JSON.parse(calls[0].body),{expectedVersion:4,confirmName:'Project p'});assert.deepEqual(changed,[]);
    assert.equal(v.state.target,null);assert.equal(v.state.purge.state,'pending');assert.equal(v.state.notice,'');const html=renderToStaticMarkup(v.render());assert.match(html,/待离线清理/);assert.doesNotMatch(html,/永久删除已完成/);assert.match(html,/PowerShell/);
});

test('purge version conflicts refresh lifecycle explicitly and require typing the refreshed name again',async t=>{
    const calls=[],v=manager();v.choose(lifecycle(),'purge');v.state.confirmName='Project p';let mode='conflict';
    mockFetch(t,async(url,options)=>{calls.push({url,key:options.headers['Idempotency-Key'],body:options.body});if(url.endsWith('/lifecycle'))return reply({...lifecycle('trashed','active',9),name:'New name'});if(url.includes('?status='))return reply([]);return mode==='conflict'?failure('VERSION_CONFLICT'):reply(purge());});
    await v.confirm();assert.equal(v.state.conflict,true);await v.confirm();assert.equal(calls.length,1);await v.reloadTarget();assert.equal(v.state.confirmName,'');assert.equal(v.render().props.submitDisabled,true);assert.ok(calls[1].url.endsWith('/lifecycle'));
    mode='success';await v.confirm();assert.equal(calls.length,2);v.state.confirmName='New name';await v.confirm();assert.deepEqual(JSON.parse(calls[2].body),{expectedVersion:9,confirmName:'New name'});assert.notEqual(calls[0].key,calls[2].key);
});

test('purging rows only open management progress and have no restore or permanent deletion actions',()=>{
    const v=manager();v.state.purging=[lifecycle('purging')];v.state.loading=false;const group=nodes(v.render()).find(n=>n.type==='section'&&n.props['aria-label']==='正在永久删除');
    assert.equal(nodes(group).filter(n=>n.type==='button').length,1);assert.ok(button(group,'查看清理状态'));assert.ok(!button(group,'还原'));assert.ok(!button(group,'永久删除'));
});

test('PowerShell command quotes every argument safely, uses the returned data directory and adds resume for unfinished failed work',()=>{
    const p={id:'id with space',name:"Lab 'quoted' $name; $(Get-Secret)"},pending=purge(p.id,'pending',{dataDir:"D:\\owner's data; $profile"});
    const command=powershellPurgeCommand(p,pending);assert.equal(command,"& 'node' 'dist/apps/cli/index.js' 'project' 'purge' '--project' 'id with space' '--data' 'D:\\owner''s data; $profile' '--offline' '--confirm-name' 'Lab ''quoted'' $name; $(Get-Secret)'");
    assert.ok(!command.includes('--resume'));assert.ok(powershellPurgeCommand(p,{...pending,state:'failed'}).endsWith("'--resume'"));assert.equal(powershellPurgeCommand(p,{...pending,state:'completed',phase:'completed'}),'');assert.throws(()=>powershellPurgeCommand({id:'other',name:'wrong'},pending),/所选项目/);
});

test('progress refresh displays failures and only a completed receipt declares completion',async t=>{
    const v=manager(),p=lifecycle('purging');let status=purge('p','failed',{phase:'planning',error:'Ownership unknown; data retained'});const calls=[];
    mockFetch(t,async url=>{calls.push(url);return reply(status);});await v.openPurge('p',p);let html=renderToStaticMarkup(v.render());assert.match(html,/清理失败，未完全删除/);assert.match(html,/Ownership unknown/);assert.match(html,/--resume/);assert.doesNotMatch(html,/永久删除已完成/);
    status=purge('p','completed');await v.openPurge('p',p);html=renderToStaticMarkup(v.render());assert.match(html,/永久删除已完成/);assert.doesNotMatch(html,/PowerShell 离线清理命令/);assert.ok(calls.every(url=>url==='/api/projects/p/purge'));assert.equal(v.state.notice,'');
});

test('late progress and late lifecycle-name responses cannot replace a newer selected purge task',async t=>{
    const pending=[],v=manager();mockFetch(t,url=>new Promise(resolve=>pending.push({url,resolve})));
    const old=v.openPurge('p'),current=v.openPurge('q',{...lifecycle('purging'),id:'q',name:'Q project'});pending[1].resolve(reply(purge('q')));await current;pending[0].resolve(reply(purge('p')));await old;assert.equal(v.state.purge.projectId,'q');assert.equal(v.state.purgeProject.name,'Q project');assert.equal(pending.length,2);
    const reading=v.openPurge('p');pending[2].resolve(reply(purge('p')));await tick();assert.ok(pending[3].url.endsWith('/p/lifecycle'));const newer=v.openPurge('q',{...lifecycle('purging'),id:'q',name:'Q project'});pending[4].resolve(reply(purge('q')));await newer;pending[3].resolve(reply({...lifecycle('purging'),name:'Old P name'}));await reading;
    assert.equal(v.state.purge.projectId,'q');assert.equal(v.state.purgeProject.name,'Q project');assert.doesNotMatch(renderToStaticMarkup(v.render()),/Old P name/);
});

test('a mismatched purge task ID and a missing saved receipt show retryable errors without another project command',async t=>{
    const v=manager(),p=lifecycle('purging');let replyValue=reply(purge());mockFetch(t,async()=>replyValue);await v.openPurge('p',p);replyValue=reply(purge('p','pending',{purgeId:'different-task'}));await v.openPurge('p',p);assert.match(v.state.purgeError,/任务不一致/);assert.equal(v.state.purge,null);
    replyValue=failure('NOT_FOUND',404);await v.openPurge('p');assert.match(v.state.purgeError,/可返回项目列表/);assert.doesNotMatch(renderToStaticMarkup(v.render()),/PowerShell 离线清理命令/);v.close();assert.equal(v.state.purgeProjectId,'');
});

test('reopening remembers only a successfully read project ID and fetches authoritative progress and the same project name',async t=>{
    const old=globalThis.localStorage,values=new Map();globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};t.after(()=>{globalThis.localStorage=old;});
    const requests=[],v=manager();mockFetch(t,async url=>{requests.push(url);return reply(url.endsWith('/purge')?purge():lifecycle('purging'));});await v.openPurge('p');assert.deepEqual([...values.values()],['p']);assert.equal(v.state.purgeProject.id,'p');
    const reopened=manager();assert.equal(reopened.state.lastPurgeId,'p');button(reopened.render(),'查看上次清理状态').props.onClick();await tick();assert.equal(reopened.state.purge.projectId,'p');assert.equal(reopened.state.purgeProject.id,'p');assert.deepEqual([...values.values()],['p']);assert.ok(requests.every(url=>url==='/api/projects/p/purge'||url==='/api/projects/p/lifecycle'));
});
