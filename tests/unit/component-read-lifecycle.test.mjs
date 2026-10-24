import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {ComposerControls} from '../../dist/web/assets/composer-controls.js';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import {PermissionActions} from '../../dist/web/assets/permission-actions.js';
import {Chat} from '../../dist/web/assets/workbench.js';
import {App} from '../../dist/web/assets/app.js';

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const model={provider:'test',model:'fixture',thinking:'off'};
const session={id:'s',projectId:'p',role:'coordinator',state:'idle',model};
const project={id:'p',archived:false,settings:{enabled:false}};
const data={project,sessions:[session],teams:[],wakeups:[],approvals:[],experiments:[],runs:[],artifacts:[],reports:[],claims:[],tasks:[]};
const boot={projects:[project],model,models:[model],runtime:{ready:true,hostAccess:{available:true}}};
const permission={sessionId:'s',mode:'confirm',version:1,epoch:1,available:true,hostAccess:{version:1,available:true,enabled:false,jobs:[]},actions:[{id:'retained',state:'stale',approval:{id:'a',status:'stale'}}]};
const response=value=>({ok:true,json:async()=>value});
const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const composerProps=extra=>({boot,projectId:'p',projectArchived:false,session,attachments:[],busy:false,perform:fn=>fn(),...extra});
function harness(t){
    const old={fetch:globalThis.fetch,window:globalThis.window,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
    const reads=[],timers=new Set(),views=[];
    globalThis.window={addEventListener(){},removeEventListener(){}};
    globalThis.setInterval=fn=>{timers.add(fn);return fn;};globalThis.clearInterval=fn=>timers.delete(fn);
    globalThis.fetch=(url,init)=>{
        if(url.endsWith('/connectors'))return Promise.resolve(response({version:1,enabled:{}}));
        return new Promise((resolve,reject)=>reads.push({url,method:init.method,signal:init.signal,resolve:value=>resolve(response(value)),reject}));
    };
    t.after(()=>{for(const view of views)view.componentWillUnmount();Object.assign(globalThis,old);});
    return {reads,poll:()=>{for(const fn of timers)fn();},mount:view=>{views.push(view);view.componentDidMount();return view;}};
}
function update(view,patch){const previous=view.props;view.props={...previous,...patch};view.componentDidUpdate(previous);}

test('archived and noninteractive composers skip capability reads and editable reopening restores them',async t=>{
    const h=harness(t);
    for(const extra of [{projectArchived:true},{session:{...session,state:'archived'}},{session:{...session,taskId:'task'}},{session:{...session,teamId:'team'}},{session:{...session,role:'worker'}}]){
        const view=synchronousState(new ComposerControls(composerProps(extra)));
        const reading=view.loadAttachmentTypes();assert.equal(h.reads.length,0);await reading;assert.equal(view.state.uploadError,'');view.componentWillUnmount();
    }
    const view=h.mount(synchronousState(new ComposerControls(composerProps({projectArchived:true}))));
    assert.equal(h.reads.length,0);update(view,{projectArchived:false});assert.equal(h.reads.length,1);
    h.reads[0].resolve({model,types:[]});await tick();assert.deepEqual(view.state.attachmentTypes.types,[]);
});

test('archive, management suspension and unmount abort capability reads without stale upload errors',async t=>{
    const h=harness(t),view=h.mount(synchronousState(new ComposerControls(composerProps())));
    assert.equal(h.reads.length,1);update(view,{projectArchived:true});assert.equal(h.reads[0].signal.aborted,true);
    h.reads[0].reject(Error('old archived failure'));await tick();assert.equal(view.state.uploadError,'');
    update(view,{projectArchived:false});assert.equal(h.reads.length,2);update(view,{readSuspended:true});assert.equal(h.reads[1].signal.aborted,true);
    h.reads[1].resolve({model,types:[{mediaType:'old'}]});await tick();assert.equal(view.state.attachmentTypes,null);
    update(view,{readSuspended:false});assert.equal(h.reads.length,3);h.reads[2].reject(Error('current capability failure'));await tick();assert.equal(view.state.uploadError,'current capability failure');
    const reading=view.loadAttachmentTypes(),last=h.reads.at(-1);view.componentWillUnmount();assert.equal(last.signal.aborted,true);
    last.reject(Error('late failure'));await reading;assert.equal(view.state.uploadError,'current capability failure');
});

test('project management also aborts composer source reads before the project can enter trash',async t=>{
    const h=harness(t),reads=[];globalThis.fetch=(url,init)=>new Promise((resolve,reject)=>reads.push({url,signal:init.signal,resolve,reject}));
    const view=h.mount(synchronousState(new ComposerControls(composerProps())));assert.equal(reads.length,2);
    update(view,{readSuspended:true});assert.ok(reads.every(read=>read.signal.aborted));
    for(const read of reads)read.reject(Error('old PROJECT_DELETED'));await tick();assert.equal(view.state.loadingError,'');assert.equal(view.state.uploadError,'');
    update(view,{readSuspended:false});assert.equal(reads.length,4);
    reads[2].resolve(response({version:2,enabled:{}}));reads[3].resolve(response({model,types:[]}));await tick();assert.equal(view.state.config.version,2);
});

for(const failure of [false,true])for(const resumeBeforeReply of [false,true]){
    test('source save '+(failure?'failure':'success')+' settles across management pause with '+(resumeBeforeReply?'early':'late')+' resume',async t=>{
        const h=harness(t);let finish,version=1,enabled=false,sourceReads=0;
        globalThis.fetch=async(url,init)=>{
            if(url.endsWith('/attachment-types'))return response({model,types:[]});
            if(init.method==='POST')return new Promise(resolve=>finish=()=>{if(failure)resolve({ok:false,status:409,json:async()=>({error:{code:'SAVE_DENIED',message:'source save failed'}})});else{version=2;enabled=true;resolve(response({version,enabled:{alphaxiv:enabled}}));}});
            sourceReads++;return response({version,enabled:{alphaxiv:enabled}});
        };
        const view=h.mount(synchronousState(new ComposerControls(composerProps())));await tick();
        const saving=view.configureSource('alphaxiv',true);assert.equal(view.state.saving,true);update(view,{readSuspended:true});
        if(resumeBeforeReply)update(view,{readSuspended:false});
        finish();await saving;assert.equal(view.state.saving,false);
        if(!resumeBeforeReply){assert.equal(sourceReads,1,'paused save must not issue a recovery GET');update(view,{readSuspended:false});}
        await tick();assert.equal(view.state.loading,false);assert.equal(view.state.config.version,failure?1:2);assert.equal(view.state.sourceDraft.alphaxiv,!failure);
        if(failure)assert.match(view.state.loadingError,/source save failed/);else assert.equal(view.state.loadingError,'');
    });
}

for(const failure of [false,true])test('a source save '+(failure?'failure':'success')+' cannot change a project selected after an A to B to A switch',async t=>{
    const h=harness(t);let finish,version=1;
    globalThis.fetch=async(url,init)=>{
        if(url.endsWith('/attachment-types'))return response({model,types:[]});
        if(init.method==='POST')return new Promise(resolve=>finish=()=>resolve(failure?{ok:false,status:409,json:async()=>({error:{message:'old source failure'}})}:response({version:2,enabled:{alphaxiv:true}})));
        return response({version,enabled:{alphaxiv:false}});
    };
    const view=h.mount(synchronousState(new ComposerControls(composerProps())));await tick();const saving=view.configureSource('alphaxiv',true);
    version=7;update(view,{projectId:'q'});await tick();version=9;update(view,{projectId:'p'});await tick();finish();await saving;
    assert.equal(view.state.config.version,9);assert.equal(view.state.sourceDraft.alphaxiv,false);assert.equal(view.state.saving,false);assert.equal(view.state.loadingError,'');
});

for(const mediaType of ['image/png','application/pdf'])test('a retained '+mediaType+' draft has no false unsupported alert while archived or capability reads are paused',async t=>{
    const h=harness(t),attachment={documentVersionId:'doc',title:'retained',mediaType,size:10};
    const view=h.mount(synchronousState(new ComposerControls(composerProps({attachments:[attachment],canSend:true,hasDraft:true}))));
    const types={model,types:[{mediaType,extensions:[],maxBytes:1024,native:true}]};h.reads[0].resolve(types);await tick();
    const alerts=()=>nodes(view.render()).filter(node=>node.props?.role==='alert'),send=()=>nodes(view.render()).find(node=>node.props?.['aria-label']==='发送');
    assert.equal(alerts().length,0);update(view,{projectArchived:true,canSend:false});assert.equal(alerts().length,0);assert.equal(h.reads.length,1);assert.equal(view.props.attachments[0],attachment);
    update(view,{projectArchived:false,readSuspended:true,canSend:true});assert.equal(alerts().length,0);assert.equal(h.reads.length,1);assert.equal(send().props.disabled,true);
    update(view,{readSuspended:false});assert.equal(h.reads.length,2);assert.equal(alerts().length,0);assert.equal(send().props.disabled,true);
    assert.ok(nodes(view.render()).some(node=>node.props?.role==='status'&&String(node.props.children).includes('附件已保留')));
    h.reads[1].resolve({model,types:[]});await tick();assert.equal(alerts().length,1);assert.equal(send().props.disabled,true);
    const reading=view.loadAttachmentTypes();h.reads.at(-1).resolve(types);await reading;assert.equal(alerts().length,0);assert.equal(send().props.disabled,false);
});

for(const Component of [HostAccessControl,PermissionActions]){
    test(Component.name+' invalidates pending reads before a permission change and preserves operation failures',async t=>{
        const h=harness(t),view=h.mount(synchronousState(new Component({sessionId:'s',archived:false,busy:false,perform:fn=>fn()})));
        if(Component===HostAccessControl)Object.assign(view.state,{permission,status:permission.hostAccess});
        const change=Component===HostAccessControl?view.saveMode('readOnly'):view.decide({id:'action',version:1,approval:{version:1}},true);
        assert.equal(h.reads[0].signal.aborted,true);h.reads[1].reject(Error('operation response lost'));await tick();
        assert.equal(h.reads[2].method,'GET');h.reads[2].resolve(permission);await assert.rejects(change,/operation response lost/);
        assert.equal(view.state.error,'operation response lost');h.reads[0].resolve(permission);await tick();assert.equal(view.state.error,'operation response lost');
        update(view,{readSuspended:true});assert.equal(view.state.error,'operation response lost');
        update(view,{readSuspended:false});h.reads.at(-1).resolve(permission);await tick();assert.equal(view.state.error,'operation response lost');
    });
    test(Component.name+' preserves archived history without polling or overlapping active reads',async t=>{
        const h=harness(t),view=h.mount(synchronousState(new Component({sessionId:'s',archived:true,busy:false,perform:fn=>fn()})));
        assert.equal(h.reads.length,1);h.reads[0].resolve(permission);await tick();h.poll();h.poll();assert.equal(h.reads.length,1);
        if(Component===PermissionActions)assert.equal(view.state.actions[0].id,'retained');else assert.equal(view.state.permission.sessionId,'s');
        update(view,{archived:false});assert.equal(h.reads.length,2);h.poll();h.poll();assert.equal(h.reads.length,2);
        h.reads[1].resolve(permission);await tick();h.poll();assert.equal(h.reads.length,3);
    });
    test(Component.name+' suspends before project changes, ignores late replies and resumes current errors',async t=>{
        const h=harness(t),view=h.mount(synchronousState(new Component({sessionId:'s',archived:false,readSuspended:true,busy:false,perform:fn=>fn()})));
        assert.equal(h.reads.length,0);update(view,{readSuspended:false});assert.equal(h.reads.length,1);
        update(view,{readSuspended:true});assert.equal(h.reads[0].signal.aborted,true);h.poll();assert.equal(h.reads.length,1);
        h.reads[0].reject(Error('old PROJECT_DELETED'));await tick();assert.equal(view.state.error,'');
        update(view,{readSuspended:false,sessionId:'new'});assert.equal(h.reads.length,2);
        h.reads[1].reject(Error('current read failed'));await tick();assert.equal(view.state.error,'current read failed');
        h.poll();assert.equal(h.reads.length,3);h.reads[2].resolve({...permission,sessionId:'new'});await tick();assert.equal(view.state.error,'');
        h.poll();const last=h.reads.at(-1);view.componentWillUnmount();assert.equal(last.signal.aborted,true);last.reject(Error('late unmounted failure'));await tick();assert.equal(view.state.error,'');
    });
}

test('project management pauses child reads before mutations and closing resumes archived history',()=>{
    const app=synchronousState(new App({}));Object.assign(app.state,{boot,data,projectId:'p',sessionId:'s',modal:'projects'});
    const chatNode=nodes(app.render()).find(n=>n.type===Chat);assert.equal(chatNode.props.readSuspended,true);
    const chat=synchronousState(new Chat({...chatNode.props,data:{...data,project:{...project,archived:true}}}));
    const tree=nodes(chat.render()),controls=tree.find(n=>n.type===ComposerControls),actions=tree.find(n=>n.type===PermissionActions);
    assert.equal(controls.props.readSuspended,true);assert.equal(controls.props.permissionControl.props.readSuspended,true);assert.equal(actions.props.readSuspended,true);
    app.state.modal='';assert.equal(nodes(app.render()).find(n=>n.type===Chat).props.readSuspended,false);
});
