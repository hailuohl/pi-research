import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronousState } from '../support/ui.mjs';
import { ComposerControls } from '../../dist/web/assets/composer-controls.js';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import { Chat } from '../../dist/web/assets/workbench.js';
import { SettingsView } from '../../dist/web/assets/data-views.js';
import {ModelManagementPanel} from '../../dist/web/assets/model-management-view.js';
import { SessionHistory } from '../../dist/web/assets/session-history.js';

const elements = node => Array.isArray(node) ? node.flatMap(elements) : !node || typeof node !== 'object' ? [] : [node, ...elements(node.props?.children)];
const find = (tree, predicate) => elements(tree).find(predicate);
const response = data => ({ ok: true, json: async () => data });
const model = { provider: 'test', model: 'default', thinking: 'low' };
const managed=(id,thinking)=>({model:id,name:id+' configured',enabled:true,deletedAt:null,reasoning:{defaultLevel:thinking,levels:[{id:thinking,label:'Configured '+thinking,piLevel:'high',parameters:{}}]}});
const boot = { model, models: [model, { provider: 'other', model: 'large', thinking: 'high' }], modelManagement:{providers:[{provider:'test',name:'test',enabled:true,deletedAt:null,models:[managed('default','low')]},{provider:'other',name:'other',enabled:true,deletedAt:null,models:[managed('large','high')]}]}, runtime: { ready: true, message: '', node: 'v22', expectedVersion: 'pi' }, capabilities: [] };
const session = { id: 's', projectId:'p', version: 3, role: 'coordinator', state: 'idle', model, title: 'Research' };
const submitted=(content='Look at this',mode='prompt',extra={})=>({id:'sent',kind:'message',projectId:'p',sessionId:'s',version:1,createdAt:'2026-10-10T00:00:00Z',updatedAt:'2026-10-10T00:00:00Z',role:'user',status:'queued',content,mode,...extra});
const attachment = (id, title = `${id}.txt`) => ({ documentVersionId: id, artifactId: `${id}-artifact`, digest: 'digest', title, mediaType: 'text/plain', size: 5 });
function controlsProps(overrides = {}) {
    return { boot, projectId: 'p', projectArchived: false, modelLocked: false, session, busy: false, perform: async fn => fn(), attachments: [], onAddAttachment() {}, onRemoveAttachment() {}, collaborationEnabled: false, collaborationDisabled: false, onToggleCollaboration() {}, canSend: true, hasDraft: true, onSendModel() {}, ...overrides };
}
function chatProps(overrides = {}) {
    return { data: { project: { id: 'p', archived: false, settings: { enabled: false } }, teams: [], wakeups: [] }, boot, session, messages: [], pendingMessages: [], pendingTotal: 0, pendingNextCursor: null, canSteer: false, history: null, historyAnchor: null, onHistory() {}, stream: '', busy: false, perform: async fn => fn(), onToggle() {}, onNew() {}, onExperiments() {}, onWorkspace() {}, onSession() {}, onExperiment() {}, onRun() {}, ...overrides };
}

test('composer shares one send/stop button and keeps queued drafts sendable during execution',()=>{
    for(const state of ['idle','queued','running','interrupted']){
        const view=synchronousState(new ComposerControls(controlsProps({session:{...session,state},hasDraft:false})));
        const buttons=elements(view.render()).filter(n=>n.type==='button'&&n.props.className?.includes('composer-submit-control'));
        assert.equal(buttons.length,1);const active=['queued','running'].includes(state);
        assert.equal(buttons[0].props.type,active?'button':'submit');assert.equal(buttons[0].props['aria-label'],active?'停止模型':'发送');assert.equal(buttons[0].props.disabled,!active);
        assert.doesNotMatch(JSON.stringify(view.render()),/停止 Agent/);
        if(active){view.props={...view.props,hasDraft:true};const send=find(view.render(),n=>n.type==='button'&&n.props.className?.includes('composer-submit-control'));assert.equal(send.props.type,'submit');assert.equal(send.props['aria-label'],'排队发送');assert.equal(send.props.disabled,false);assert.equal(send.props.onClick,undefined);}
    }
});

test('composer stop interrupts the exact current session and stale or ineligible clicks do nothing',async t=>{
    const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const requests=[];
    globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return response({});};
    const view=synchronousState(new ComposerControls(controlsProps({session:{...session,state:'running'},hasDraft:false})));
    const stop=find(view.render(),n=>n.type==='button'&&n.props['aria-label']==='停止模型');assert.ok(stop);
    await stop.props.onClick();assert.deepEqual(requests,[{url:'/api/sessions/s/interrupt',body:{}}]);
    for(const override of [{busy:true},{projectArchived:true},{session:{...session,id:'other',state:'running'}},{session:{...session,state:'idle'}},{session:{...session,state:'running',taskId:'task'}},{session:{...session,state:'archived'}}]){
        view.props={...controlsProps({session:{...session,state:'running'},hasDraft:false}),...override};await stop.props.onClick();
    }
    view.props=controlsProps({session:{...session,state:'running'},hasDraft:false});view.componentWillUnmount();await stop.props.onClick();assert.equal(requests.length,1);
});

test('stop request failure remains a failure and preserves the running control for retry',async t=>{
    const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);
    globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'stop not acknowledged'}})});
    const view=synchronousState(new ComposerControls(controlsProps({session:{...session,state:'running'},hasDraft:false})));
    const stop=find(view.render(),n=>n.type==='button'&&n.props['aria-label']==='停止模型');
    await assert.rejects(stop.props.onClick(),/stop not acknowledged/);assert.equal(find(view.render(),n=>n.type==='button'&&n.props['aria-label']==='停止模型').props.disabled,false);
});

test('source checkboxes apply immediately, reload confirmed flags on failure and preserve selection on close', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let fail = true, failRead = false, request;
    let config = { version: 4, enabled: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: true } };
    globalThis.fetch = async (url, init) => {
        if (!init?.body) { if(failRead)throw Error('state read failed'); return response(config); }
        request = { url, body: JSON.parse(init.body) };
        if (fail) return { ok: false, status: 409, json: async () => ({ error: { message: 'version conflict' } }) };
        config = { version: config.version + 1, enabled: { ...config.enabled, ...request.body.enabled } };
        return response(config);
    };
    const view = synchronousState(new ComposerControls(controlsProps()));
    await view.loadSources(); view.setState({ sourcesOpen: true });
    assert.equal(find(view.render(), node => node.type === 'button' && node.props.children === '保存来源开关'), undefined);
    await view.configureSource('alphaxiv', true);
    assert.deepEqual(request, { url: '/api/projects/p/connectors', body: { expectedVersion: 4, enabled: { alphaxiv: true } } });
    assert.equal(view.state.sourceDraft.alphaxiv, false, 'failed enable must not claim the source is enabled');
    assert.equal(view.state.config.version, 4); assert.equal(view.state.saving, false); assert.match(view.state.loadingError, /version conflict/);
    fail = false; await view.configureSource('alphaxiv', true);
    assert.equal(view.state.config.version, 5); assert.equal(view.state.sourceDraft.alphaxiv, true); assert.equal(view.state.sourcesOpen, true);
    view.setState({ sourcesOpen: false }); view.setState({ sourcesOpen: true });
    assert.equal(find(view.render(), node => node.type === 'input' && node.props['aria-label'] === '启用 alphaXiv').props.checked, true);
    await view.configureSource('alphaxiv', false);
    assert.equal(request.body.expectedVersion, 5); assert.deepEqual(request.body.enabled, { alphaxiv: false }); assert.equal(view.state.sourceDraft.alphaxiv, false); assert.equal(view.state.sourceDraft.crossref, true);
    fail=true;failRead=true;await view.configureSource('openalex',true);
    assert.equal(view.state.config,null);assert.equal(view.state.sourceDraft.openalex,false);assert.match(view.state.loadingError,/来源状态未确认/);
    assert.ok(find(view.render(), node=>node.type==='input'&&node.props['aria-label']==='启用 OpenAlex').props.disabled);
    failRead=false;
    find(view.render(),node=>node.type==='button'&&node.props['aria-controls']==='composer-source-menu').props.onClick();
    find(view.render(),node=>node.type==='button'&&node.props['aria-controls']==='composer-source-menu').props.onClick();
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(view.state.config.version,6);assert.equal(view.state.loading,false);
});

test('source updates serialize versioned clicks and cannot publish a late response after unmount', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let resolvePost, posts = 0;
    const config = { version: 2, enabled: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: true } };
    globalThis.fetch = async (_url, init) => !init?.body ? response(config) : (++posts, new Promise(resolve => { resolvePost = resolve; }));
    const view = synchronousState(new ComposerControls(controlsProps())); await view.loadSources(); view.setState({ sourcesOpen: true });
    const updating = view.configureSource('openalex', true); await view.configureSource('biorxiv', true);
    assert.equal(posts, 1); assert.equal(view.state.saving, true);
    assert.ok(find(view.render(), node => node.type === 'input' && node.props['aria-label'] === '启用 bioRxiv').props.disabled);
    view.componentWillUnmount(); resolvePost(response({ version: 3, enabled: { ...config.enabled, openalex: true } })); await updating;
    assert.equal(view.state.config.version, 2, 'late completion cannot mutate the unmounted source controller');
});

test('current-session model menu sends only the selected saved config and respects fixed grants', async () => {
    const selected = [];
    const view = synchronousState(new ComposerControls(controlsProps({ onSendModel: async value => {selected.push(value);return {id:'s',model:value};} })));
    const menu = find(view.render(), node => node.type === ComposerModelMenu);
    const picker = synchronousState(new ComposerModelMenu(menu.props));
    assert.equal(menu.props.management,boot.modelManagement);await picker.chooseModel('other','large');
    assert.deepEqual(selected, [{ provider: 'other', model: 'large', thinking: 'high' }]);
    await picker.choose({provider:'unknown',model:'injected',thinking:'high'});assert.equal(selected.length,1);
    const locked = synchronousState(new ComposerControls(controlsProps({ modelLocked: true })));
    assert.equal(find(locked.render(), node => node.type === ComposerModelMenu).props.disabled, true);
    for(const override of [{session:undefined},{busy:true},{projectArchived:true},{session:{...session,taskId:'task'}},{session:{...session,teamId:'team'}},{session:{...session,role:'reviewer'}},...['running','queued','archived'].map(state=>({session:{...session,state}}))]){
        const disabled=synchronousState(new ComposerControls(controlsProps(override)));
        const props=find(disabled.render(),node=>node.type===ComposerModelMenu).props;assert.equal(props.disabled||props.busy,true);
    }
});

test('model API confirmation is returned and propagated before refresh, and late responses cannot update another session',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const selected={provider:'other',model:'large',thinking:'high'},confirmed={...session,version:4,model:selected},receipts=[],requests=[];
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return response(confirmed);};
 const view=synchronousState(new Chat(chatProps({onModelConfirmed:row=>receipts.push(row)}))),controls=find(view.render(),node=>node.type===ComposerControls);
 assert.equal(await controls.props.onSendModel(selected),confirmed);assert.deepEqual(receipts,[confirmed]);assert.deepEqual(requests,[{url:'/api/sessions/s/model',body:{expectedVersion:3,model:selected}}]);
 view.props={...view.props,session:{...session,id:'new-session'}};assert.equal(await controls.props.onSendModel(selected),undefined);assert.equal(requests.length,1);
 view.props=chatProps({onModelConfirmed:row=>receipts.push(row)});let resolve;globalThis.fetch=()=>new Promise(done=>resolve=done);
 const pending=find(view.render(),node=>node.type===ComposerControls).props.onSendModel(selected);view.props={...view.props,session:{...session,id:'next'}};resolve(response(confirmed));assert.equal(await pending,undefined);assert.equal(receipts.length,1);
 view.props=chatProps({onModelConfirmed:row=>receipts.push(row)});globalThis.fetch=async()=>response({...confirmed,model});await find(view.render(),node=>node.type===ComposerControls).props.onSendModel(selected);assert.equal(receipts.length,1,'a mismatched model receipt cannot confirm the requested selection');
});

test('boot model triples cannot bypass missing or failed configured metadata',async()=>{
 for(const modelManagement of [undefined,null]){
  const selected=[],view=synchronousState(new ComposerControls(controlsProps({boot:{...boot,modelManagement},onSendModel:async value=>selected.push(value)}))),menu=find(view.render(),node=>node.type===ComposerModelMenu),picker=synchronousState(new ComposerModelMenu(menu.props));
  assert.equal(find(picker.render(),node=>node.props?.className==='composer-model-trigger').props.disabled,true);await picker.chooseModel('other','large');assert.equal(selected.length,0);
 }
});

test('permissions are inside the composer toolbar and absent from the outside caption',()=>{
    const view=synchronousState(new Chat(chatProps({boot:{...boot,runtime:{...boot.runtime,hostAccess:{available:true}}}}))),form=find(view.render(),node=>node.type==='form'&&node.props.className==='composer');
    const controls=find(form,node=>node.type===ComposerControls);assert.equal(controls.props.permissionControl.type,HostAccessControl);assert.equal(controls.props.permissionControl.props.sessionId,session.id);
    const caption=find(view.render(),node=>node.props?.className?.includes('composer-caption-note'));assert.equal(find(caption,node=>node.type===HostAccessControl),undefined);
    const composed=synchronousState(new ComposerControls(controls.props));const toolbar=find(composed.render(),node=>node.props?.className==='composer-toolbar');assert.ok(find(toolbar,node=>node.type===HostAccessControl));
});
test('document imports add each successful project reference and keep it if a later import fails', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    const imported = [], calls = [];
    globalThis.fetch = async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        if (calls.length === 1) return response({ id: 'doc-1', title: 'notes.txt', original: { artifactId: 'art-1', digest: 'd1', size: 5, mediaType: 'text/plain' } });
        return { ok: false, status: 400, json: async () => ({ error: { message: 'invalid UTF-8' } }) };
    };
    const view = synchronousState(new ComposerControls(controlsProps({ onAddAttachment: item => imported.push(item) })));
    const file = (name, value) => ({ name, size: value.length, arrayBuffer: async () => new TextEncoder().encode(value).buffer });
    await view.addFiles([file('notes.txt', 'hello'), file('bad.txt', 'world')]);
    assert.deepEqual(calls.map(call => call.url), ['/api/sessions/s/attachments', '/api/sessions/s/attachments']);
    assert.deepEqual(calls[0].body, { title: 'notes.txt', mediaType: 'text/plain', contentBase64: 'aGVsbG8=' });
    assert.deepEqual(imported, [{ documentVersionId: 'doc-1', artifactId: 'art-1', digest: 'd1', title: 'notes.txt', mediaType: 'text/plain', size: 5 }]);
    assert.match(view.state.uploadError, /invalid UTF-8/);
});

test('attachment types follow the saved model, reject forged types and retain unsupported draft references',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const posts=[];globalThis.fetch=async(url,init)=>{posts.push({url,body:JSON.parse(init.body)});return response({id:'image',title:'image.png',original:{artifactId:'image-art',digest:'image-digest',size:4,mediaType:'image/png'}});};
 const refs=[],view=synchronousState(new ComposerControls(controlsProps({onAddAttachment:item=>refs.push(item)})));assert.equal(find(view.render(),n=>n.type==='input'&&n.props.type==='file').props.accept,'.txt,text/plain,.md,text/markdown');
 const file={name:'image.png',size:4,arrayBuffer:async()=>new Uint8Array([1,2,3,4]).buffer};await view.addFiles([file]);assert.equal(posts.length,0);
 view.setState({attachmentTypes:{model,types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:33554432,native:false},{mediaType:'image/png',extensions:['.png'],maxBytes:20971520,native:true}],maxFiles:5,nativeBytes:20971520}});assert.match(find(view.render(),n=>n.type==='input'&&n.props.type==='file').props.accept,/image\/png/);await view.addFiles([file]);assert.equal(posts[0].url,'/api/sessions/s/attachments');assert.equal(refs[0].mediaType,'image/png');
 view.props={...view.props,attachments:refs,session:{...session,model:{provider:'other',model:'text',thinking:'off'}}};const tree=view.render();assert.doesNotMatch(find(tree,n=>n.type==='input'&&n.props.type==='file').props.accept,/image\/png/);assert.equal(find(tree,n=>n.props['data-action']==='send').props.disabled,true);assert.match(JSON.stringify(tree),/附件已保留/);assert.equal(view.props.attachments.length,1);
});

test('late attachment-type responses cannot revive the previous model capabilities',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const pending=[];globalThis.fetch=async()=>new Promise(resolve=>pending.push(resolve));const view=synchronousState(new ComposerControls(controlsProps()));const first=view.loadAttachmentTypes();view.props={...view.props,session:{...session,model:{provider:'other',model:'text',thinking:'off'}}};const second=view.loadAttachmentTypes();pending[1](response({model:view.props.session.model,types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:33554432,native:false}]}));await second;pending[0](response({model,types:[{mediaType:'application/pdf',extensions:['.pdf'],maxBytes:20971520,native:true}]}));await first;assert.equal(view.state.attachmentTypes.model.provider,'other');assert.doesNotMatch(find(view.render(),n=>n.type==='input'&&n.props.type==='file').props.accept,/pdf/);
});

test('attachment send preserves new typing and attachments added while the request is pending', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let resolve; const sent = [];
    globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Promise(done => { resolve = () => done(response(submitted())); }); };
    const work = [], view = synchronousState(new Chat(chatProps({ perform: fn => { const pending = fn(); work.push(pending); return pending; } })));
    view.state.draft = 'Look at this'; view.state.attachments = [attachment('doc-1')];
    find(view.render(), node => node.type === 'form' && node.props.className === 'composer').props.onSubmit({ preventDefault() {} });
    view.setState({ draft: 'next message', draftVersion: 1, attachments: [attachment('doc-1'), attachment('doc-2')] });
    resolve(); await work[0];
    assert.equal(sent[0].url, '/api/sessions/s/messages');
    assert.deepEqual(sent[0].body, { content: 'Look at this', mode:'prompt', attachmentDocumentIds: ['doc-1'] });
    assert.equal(view.state.draft, 'next message');
    assert.deepEqual(view.state.attachments.map(item => item.documentVersionId), ['doc-2']);
});

test('attachment-only send uses the short prompt; send failure keeps its draft and reference', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let body;
    globalThis.fetch = async (_url, init) => { body = JSON.parse(init.body); return { ok: false, status: 409, json: async () => ({ error: { message: 'send failed' } }) }; };
    const pending = [], view = synchronousState(new Chat(chatProps({ perform: fn => { const task = fn().catch(() => undefined); pending.push(task); return task; } })));
    view.state.attachments = [attachment('doc-1')];
    find(view.render(), node => node.type === 'form' && node.props.className === 'composer').props.onSubmit({ preventDefault() {} });
    await pending[0];
    assert.deepEqual(body, { content: '请查看附件。', mode:'prompt', attachmentDocumentIds: ['doc-1'] });
    assert.equal(view.state.draft, '');
    assert.equal(view.state.attachments[0].documentVersionId, 'doc-1');
});

test('settings save the default only, and persisted message history exposes downloadable originals', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    const calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined }); return response({}); };
    const pending = [], shell = synchronousState(new SettingsView({ boot, session, perform: fn => { const task = fn(); pending.push(task); return task; } })), panel = find(shell.render(), node => node.type === ModelManagementPanel), settings = synchronousState(new ModelManagementPanel(panel.props));
    const capabilities={text:true,image:false,pdf:false,video:false,structuredOutput:false,nativeWebSearch:false,midConversationSystem:false};
    settings.observe({schemaVersion:2,version:0,defaultModel:boot.model,defaultModelVersion:0,defaultUsable:true,presets:[],supportedApis:['openai-responses'],providers:boot.models.map((config,index)=>({provider:config.provider,name:config.provider,enabled:true,deletedAt:null,order:index,source:'managed',baseUrl:'https://api.example.com/v1',api:'openai-responses',hasApiKey:true,test:null,models:[{...config,name:config.model,nativeProfile:'none',contextWindow:32768,maxTokens:4096,capabilities,reasoning:{defaultLevel:config.thinking,levels:[{id:config.thinking,label:config.thinking,piLevel:config.thinking,parameters:{}}]},parameters:{},structuredOutput:null,configuration:{mode:'manual',overrides:[]},enabled:true,deletedAt:null,order:0,revision:1,source:'managed',effectiveCapabilities:{},test:null}]}))});
    settings.openEditor('default');
    const select = find(settings.render(), node => node.type === 'select' && node.props['aria-label'] === '选择已有模型');
    const option = elements(select.props.children).find(child => child.type === 'option' && child.props.value === JSON.stringify(['other', 'large']));
    select.props.onChange({ target: { value: option.props.value } });
    find(settings.render(), node => node.type === 'form' && node.props.className === 'settings-default-form').props.onSubmit({ preventDefault() {} });
    await pending[0];
    assert.deepEqual(calls, [{ url: '/api/settings/model', body: { provider: 'other', model: 'large', thinking: 'high', expectedVersion: 0 } }]);
    const history = synchronousState(new SessionHistory({ projectId: 'p', sessionId: 's', messages: [{ id: 'm', version: 1, role: 'user', status: 'completed', content: 'see this', attachments: [{ ...attachment('doc-1', 'paper.pdf'), mediaType: 'application/pdf' }] }], history: null, historyAnchor: null, onNavigate() {}, perform() {} }));
    const tree = history.render();
    assert.match(JSON.stringify(tree), /paper\.pdf/);
    assert.match(JSON.stringify(tree), /PDF 原件 · 需显式解析/);
    assert.ok(find(tree, node => node.type === 'button' && node.props['aria-label'] === '下载附件原件 paper.pdf'));
});

test('disabled or deleted current/default models remain visible only as current and never resurrect as selectable options',async()=>{
    const active={provider:'enabled',model:'live',thinking:'deep-research'},removed={provider:'removed',model:'old',thinking:'max'};
    for(const excluded of ['disabled-model','deleted-model','disabled-provider','deleted-provider'])for(const models of [[],[active]]){
        const removedModel={...managed('old','max'),...(excluded==='disabled-model'?{enabled:false}:{}),...(excluded==='deleted-model'?{deletedAt:'deleted'}:{})};
        const modelManagement={providers:[{provider:'removed',name:'removed',enabled:excluded!=='disabled-provider',deletedAt:excluded==='deleted-provider'?'deleted':null,models:[removedModel]},...models.map(config=>({provider:config.provider,name:config.provider,enabled:true,deletedAt:null,models:[managed(config.model,config.thinking)]}))]};
        const selected=[],view=synchronousState(new ComposerControls(controlsProps({boot:{...boot,model:removed,models:[removed,...models],modelManagement},session:{...session,model:removed},onSendModel:async value=>{selected.push(value);return {...session,model:value};}}))),menu=find(view.render(),node=>node.type===ComposerModelMenu),picker=synchronousState(new ComposerModelMenu(menu.props));
        assert.equal(menu.props.management,modelManagement);assert.deepEqual(menu.props.current,removed);
        const tree=picker.render(),rows=elements(tree).filter(node=>node.props?.role==='menuitemradio');assert.deepEqual(rows.map(row=>row.key),models.map(config=>JSON.stringify([config.provider,config.model])));
        const trigger=find(tree,node=>node.props?.className==='composer-model-trigger');assert.match(JSON.stringify(trigger),/old/);assert.match(JSON.stringify(trigger),/不可用/);
        await picker.choose(removed);assert.equal(selected.length,0,'history and boot triples cannot revive the excluded model');
        if(models.length){await picker.choose(active);assert.deepEqual(selected,[active]);}
    }
    const legacy=synchronousState(new ComposerControls(controlsProps({boot:{...boot,models:undefined,modelManagement:undefined}}))),legacyMenu=find(legacy.render(),node=>node.type===ComposerModelMenu),legacyPicker=synchronousState(new ComposerModelMenu(legacyMenu.props));
    assert.equal(elements(legacyPicker.render()).filter(node=>node.props?.role==='menuitemradio').length,0);assert.equal(find(legacyPicker.render(),node=>node.props?.className==='composer-model-trigger').props.disabled,true);
});


test('new messages wait for the current reply regardless of available steer capability',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);
 for(const [state,canSteer,mode] of [['idle',false,'prompt'],['queued',true,'follow_up'],['running',true,'follow_up'],['running',false,'follow_up']]){
  const posts=[],receipts=[];globalThis.fetch=async(url,init)=>{const body=JSON.parse(init.body);posts.push({url,body});return response(submitted(body.content,body.mode));};
  const view=synchronousState(new Chat(chatProps({session:{...session,state},canSteer,onMessageConfirmed:row=>receipts.push(row)})));view.state.draft='current request';
  await find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});
  assert.deepEqual(posts,[{url:'/api/sessions/s/messages',body:{content:'current request',mode}}]);assert.equal(receipts[0].status,'queued');assert.equal(view.state.draft,'');
  const controls=synchronousState(new ComposerControls(controlsProps({session:{...session,state},canSteer})));
  if(state==='running')assert.ok(find(controls.render(),node=>node.props?.['aria-label']==='排队发送'));
 }
});

test('same-tick submits have one request and its receipt is shown before a delayed refresh completes',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);let finishSend,finishRefresh;const receipts=[],posts=[];
 const refresh=new Promise(resolve=>finishRefresh=resolve),view=synchronousState(new Chat(chatProps({onMessageConfirmed:row=>receipts.push(row),perform:async fn=>{const row=await fn();await refresh;return row;}})));
 const setState=view.setState;view.setState=(update,callback)=>queueMicrotask(()=>setState(update,callback));
 globalThis.fetch=async(url,init)=>{posts.push({url,body:JSON.parse(init.body)});return new Promise(resolve=>finishSend=resolve);};
 view.state.draft='submit once';const form=find(view.render(),node=>node.type==='form'&&node.props.className==='composer');
 const sending=form.props.onSubmit({preventDefault(){}});await form.props.onSubmit({preventDefault(){}});assert.equal(posts.length,1);
 finishSend(response(submitted('submit once')));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(receipts.length,1);assert.equal(receipts[0].content,'submit once');assert.equal(receipts[0].status,'queued');assert.equal(view.state.draft,'');assert.equal(view.state.sending,true);
 view.setState({draft:'new edit',draftVersion:1});finishRefresh();await sending;await new Promise(resolve=>setImmediate(resolve));assert.equal(view.state.draft,'new edit');assert.equal(view.state.sending,false);
});

test('a failed queued send retries its frozen body, attachment IDs and key even after the reply finishes',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const posts=[],view=synchronousState(new Chat(chatProps({session:{...session,state:'running'},canSteer:true,perform:async fn=>fn().catch(()=>undefined)})));
 view.state.draft='next round';view.state.attachments=[attachment('doc-1')];
 globalThis.fetch=async(url,init)=>{const body=JSON.parse(init.body);posts.push({url,body,key:init.headers['Idempotency-Key']});return {ok:false,status:409,json:async()=>({error:{code:'SEND_FAILED',message:'response unavailable'}})};};
 const submit=()=>find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});
 await submit();assert.equal(view.state.draft,'next round');assert.equal(view.state.attachments.length,1);view.props={...view.props,session:{...session,state:'idle'},canSteer:false};await submit();assert.deepEqual(posts[1],posts[0]);assert.equal(posts[0].body.mode,'follow_up');assert.ok(posts[0].key);
 view.setState({draft:'different request',draftVersion:1});await submit();assert.notEqual(posts[2].key,posts[0].key);assert.equal(posts[2].body.mode,'prompt');assert.equal(view.state.draft,'different request');assert.equal(view.state.attachments.length,1);
});

test('lost send responses replay one key and late receipts cannot clear another session or new attachments',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const posts=[],receipts=[],view=synchronousState(new Chat(chatProps({onMessageConfirmed:row=>receipts.push(row),perform:async fn=>fn().catch(()=>undefined)})));
 view.state.draft='saved once';globalThis.fetch=async(url,init)=>{posts.push({body:JSON.parse(init.body),key:init.headers['Idempotency-Key']});if(posts.length===1)throw Error('response lost');return response(submitted('saved once'));};
 const submit=()=>find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});
 await submit();assert.equal(view.state.draft,'saved once');await submit();assert.deepEqual(posts[1],posts[0]);assert.equal(receipts.length,1);assert.equal(view.state.draft,'');
 let finish;globalThis.fetch=()=>new Promise(resolve=>finish=resolve);view.state.draft='old session request';const sending=submit();
 view.props={...view.props,session:{...session,id:'new-session'}};view.setState({draft:'new session edit',draftVersion:2,attachments:[attachment('new-document')]});finish(response(submitted('old session request')));await sending;
 assert.equal(receipts.length,1);assert.equal(view.state.draft,'new session edit');assert.equal(view.state.attachments[0].documentVersionId,'new-document');
});

test('invalid or out-of-scope sends preserve the current draft and attachments',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);let requests=0;globalThis.fetch=async()=>{requests++;return response(submitted('kept draft', 'prompt', {projectId:'foreign'}));};
 for(const override of [{data:{...chatProps().data,project:{id:'p',archived:true,settings:{enabled:false}}}},{session:{...session,state:'archived'}},{session:{...session,taskId:'task'}},{session:{...session,projectId:'foreign'}},{historyAnchor:{direction:'before',id:'cursor'}},{history:{atLatest:false}}]){
  const view=synchronousState(new Chat(chatProps(override)));view.state.draft='kept draft';view.state.attachments=[attachment('doc-1')];await find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});assert.equal(view.state.draft,'kept draft');assert.equal(view.state.attachments.length,1);
 }
 assert.equal(requests,0);
 const view=synchronousState(new Chat(chatProps({perform:async fn=>fn().catch(()=>undefined)})));view.state.draft='kept draft';view.state.attachments=[attachment('doc-1')];await find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});assert.equal(requests,1);assert.equal(view.state.draft,'kept draft');assert.equal(view.state.attachments.length,1);
});

test('thinking-only confirmation keeps attachment capability and avoids the global refresh workflow',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const selected={...model,thinking:'high'},confirmed={...session,version:4,model:selected},requests=[];
 globalThis.fetch=async(url,init)=>{requests.push(url);return response(confirmed);};
 const history={atLatest:false},anchor={direction:'before',id:'cursor'},receipts=[],view=synchronousState(new Chat(chatProps({history,historyAnchor:anchor,onModelConfirmed:row=>receipts.push(row),perform(){assert.fail('model change must stay local');}})));
 view.state.draft='preserved';view.state.attachments=[attachment('doc-1')];const controls=find(view.render(),node=>node.type===ComposerControls);await controls.props.onSendModel(selected);
 assert.deepEqual(requests,['/api/sessions/s/model']);assert.deepEqual(receipts,[confirmed]);assert.equal(view.state.draft,'preserved');assert.equal(view.state.attachments.length,1);assert.equal(view.props.history,history);assert.equal(view.props.historyAnchor,anchor);
 const picker=synchronousState(new ComposerControls(controlsProps())),types={model,types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:33554432,native:false}]};picker.state.attachmentTypes=types;
 picker.loadAttachmentTypes=()=>assert.fail('thinking level does not change media capability');const before=picker.props;picker.props={...before,session:confirmed};picker.componentDidUpdate(before);assert.equal(picker.state.attachmentTypes,types);
});


test('one send click waits for a pending model confirmation and preserves edits made while waiting',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);let finishModel,savedModel=model;const selected={provider:'other',model:'large',thinking:'high'},confirmed={...session,version:4,model:selected},requests=[],receipts=[];
 globalThis.fetch=async(url,init)=>{
  const body=JSON.parse(init.body);requests.push({url,body});
  if(url.endsWith('/model'))return new Promise(resolve=>finishModel=()=>{savedModel=selected;resolve(response(confirmed));});
  assert.deepEqual(savedModel,selected,'message must use the newly confirmed server model');return response(submitted(body.content,body.mode));
 };
 const view=synchronousState(new Chat(chatProps({onModelConfirmed:row=>{view.props={...view.props,session:row};},onMessageConfirmed:row=>receipts.push(row)})));view.state.draft='send after model save';view.state.attachments=[attachment('doc-1')];
 const controls=find(view.render(),node=>node.type===ComposerControls),changing=controls.props.onSendModel(selected),form=find(view.render(),node=>node.type==='form'&&node.props.className==='composer');
 const sending=form.props.onSubmit({preventDefault(){}});await form.props.onSubmit({preventDefault(){}});assert.deepEqual(requests.map(row=>row.url),['/api/sessions/s/model']);assert.equal(view.state.sending,true);
 view.setState({draft:'new typing',draftVersion:1,attachments:[attachment('doc-1'),attachment('doc-2')]});finishModel();await Promise.all([changing,sending]);
 assert.deepEqual(requests.map(row=>row.url),['/api/sessions/s/model','/api/sessions/s/messages']);assert.deepEqual(requests[1].body,{content:'send after model save',mode:'prompt',attachmentDocumentIds:['doc-1']});assert.equal(receipts.length,1);assert.equal(view.state.draft,'new typing');assert.deepEqual(view.state.attachments.map(row=>row.documentVersionId),['doc-2']);assert.equal(view.state.sending,false);
});

test('failed, mismatched or stale model confirmations never send the waiting draft',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const selected={provider:'other',model:'large',thinking:'high'},confirmed={...session,version:4,model:selected};
 for(const scenario of ['failure','mismatch','switch','unmount']){
  let finishModel;const requests=[],receipts=[],view=synchronousState(new Chat(chatProps({perform:async fn=>fn().catch(()=>undefined),onMessageConfirmed:row=>receipts.push(row)})));view.state.draft='preserve waiting draft';view.state.attachments=[attachment('doc-1')];
  globalThis.fetch=async(url)=>{requests.push(url);assert.ok(url.endsWith('/model'));return new Promise(resolve=>finishModel=resolve);};
  const changing=find(view.render(),node=>node.type===ComposerControls).props.onSendModel(selected).catch(()=>undefined),sending=find(view.render(),node=>node.type==='form'&&node.props.className==='composer').props.onSubmit({preventDefault(){}});
  if(scenario==='switch')view.props={...view.props,session:{...session,id:'new-session'}};if(scenario==='unmount')view.componentWillUnmount();
  finishModel(scenario==='failure'?{ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'model save failed'}})}:response(scenario==='mismatch'?{...confirmed,model}:confirmed));await Promise.all([changing,sending]);
  assert.deepEqual(requests,['/api/sessions/s/model'],scenario);assert.equal(view.state.draft,'preserve waiting draft',scenario);assert.equal(view.state.attachments.length,1,scenario);assert.equal(receipts.length,0,scenario);
 }
});


test('an in-flight attachment capability read survives thinking-only changes and same-catalog refreshes',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);let finish;const requests=[],catalog={...boot.modelManagement,version:7},view=synchronousState(new ComposerControls(controlsProps({boot:{...boot,modelManagement:catalog}})));
 globalThis.fetch=async(url)=>{requests.push(url);return new Promise(resolve=>finish=resolve);};
 const reading=view.loadAttachmentTypes(),before=view.props;view.props={...before,boot:{...before.boot,modelManagement:{...catalog}},session:{...session,model:{...model,thinking:'high'}}};view.componentDidUpdate(before);assert.equal(requests.length,1);
 const types={model,types:[{mediaType:'image/png',extensions:['.png'],maxBytes:20971520,native:true}]};finish(response(types));await reading;assert.equal(view.state.attachmentTypes,types);
 const confirmed=view.props;view.props={...confirmed,boot:{...confirmed.boot,modelManagement:{...catalog}}};view.componentDidUpdate(confirmed);assert.equal(requests.length,1);assert.equal(view.state.attachmentTypes,types);assert.match(find(view.render(),node=>node.type==='input'&&node.props.type==='file').props.accept,/image\/png/);
});

test('catalog versions and catalogue read errors invalidate capabilities and reject older in-flight results',async t=>{
 const previous=globalThis.fetch;t.after(()=>globalThis.fetch=previous);const pending=[],catalog={...boot.modelManagement,version:7},view=synchronousState(new ComposerControls(controlsProps({boot:{...boot,modelManagement:catalog}})));
 globalThis.fetch=async()=>new Promise(resolve=>pending.push(resolve));const first=view.loadAttachmentTypes(),before=view.props;view.props={...before,boot:{...before.boot,modelManagement:{...catalog,version:8}}};view.componentDidUpdate(before);assert.equal(pending.length,2);assert.equal(view.state.attachmentTypes,null);
 const updated={model,types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:33554432,native:false}]};pending[1](response(updated));await new Promise(resolve=>setImmediate(resolve));pending[0](response({model,types:[{mediaType:'image/png',extensions:['.png'],maxBytes:20971520,native:true}]}));await first;assert.equal(view.state.attachmentTypes,updated);assert.doesNotMatch(find(view.render(),node=>node.type==='input'&&node.props.type==='file').props.accept,/image\/png/);
 const current=view.props;view.props={...current,boot:{...current.boot,modelManagementError:'catalog unavailable'}};view.componentDidUpdate(current);assert.equal(pending.length,3);assert.equal(view.state.attachmentTypes,null);pending[2](response(updated));await new Promise(resolve=>setImmediate(resolve));assert.equal(view.state.attachmentTypes,updated);
});
