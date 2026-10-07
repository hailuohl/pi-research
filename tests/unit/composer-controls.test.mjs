import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronousState } from '../support/ui.mjs';
import { ComposerControls } from '../../dist/web/assets/composer-controls.js';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
import {HostAccessControl} from '../../dist/web/assets/host-access-control.js';
import { Chat } from '../../dist/web/assets/workbench.js';
import { SettingsView } from '../../dist/web/assets/data-views.js';
import { SessionHistory } from '../../dist/web/assets/session-history.js';

const elements = node => Array.isArray(node) ? node.flatMap(elements) : !node || typeof node !== 'object' ? [] : [node, ...elements(node.props?.children)];
const find = (tree, predicate) => elements(tree).find(predicate);
const response = data => ({ ok: true, json: async () => data });
const model = { provider: 'test', model: 'default', thinking: 'low' };
const boot = { model, models: [model, { provider: 'other', model: 'large', thinking: 'high' }], runtime: { ready: true, message: '', node: 'v22', expectedVersion: 'pi' }, capabilities: [] };
const session = { id: 's', version: 3, role: 'coordinator', state: 'idle', model, title: 'Research' };
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

test('current-session model menu sends only the selected saved config and respects fixed grants', () => {
    const selected = [];
    const view = synchronousState(new ComposerControls(controlsProps({ onSendModel: value => selected.push(value) })));
    const menu = find(view.render(), node => node.type === ComposerModelMenu);
    const picker = synchronousState(new ComposerModelMenu(menu.props));
    picker.choose(menu.props.options.find(option=>option.provider==='other'&&option.model==='large'));
    assert.deepEqual(selected, [{ provider: 'other', model: 'large', thinking: 'high' }]);
    picker.choose({provider:'unknown',model:'injected',thinking:'high'});assert.equal(selected.length,1);
    const locked = synchronousState(new ComposerControls(controlsProps({ modelLocked: true })));
    assert.equal(find(locked.render(), node => node.type === ComposerModelMenu).props.disabled, true);
    for(const override of [{session:undefined},{busy:true},{projectArchived:true},{session:{...session,taskId:'task'}},{session:{...session,role:'reviewer'}},...['running','queued','archived'].map(state=>({session:{...session,state}}))]){
        const disabled=synchronousState(new ComposerControls(controlsProps(override)));
        assert.equal(find(disabled.render(),node=>node.type===ComposerModelMenu).props.disabled,true);
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
    assert.deepEqual(calls.map(call => call.url), ['/api/operations/document_import', '/api/operations/document_import']);
    assert.deepEqual(calls[0].body, { projectId: 'p', input: { title: 'notes.txt', mediaType: 'text/plain', contentBase64: 'aGVsbG8=' } });
    assert.deepEqual(imported, [{ documentVersionId: 'doc-1', artifactId: 'art-1', digest: 'd1', title: 'notes.txt', mediaType: 'text/plain', size: 5 }]);
    assert.match(view.state.uploadError, /invalid UTF-8/);
});

test('attachment send preserves new typing and attachments added while the request is pending', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let resolve; const sent = [];
    globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Promise(done => { resolve = () => done(response({})); }); };
    const work = [], view = synchronousState(new Chat(chatProps({ perform: fn => { const pending = fn(); work.push(pending); return pending; } })));
    view.state.draft = 'Look at this'; view.state.attachments = [attachment('doc-1')];
    find(view.render(), node => node.type === 'form' && node.props.className === 'composer').props.onSubmit({ preventDefault() {} });
    view.setState({ draft: 'next message', draftVersion: 1, attachments: [attachment('doc-1'), attachment('doc-2')] });
    resolve(); await work[0];
    assert.equal(sent[0].url, '/api/sessions/s/messages');
    assert.deepEqual(sent[0].body, { content: 'Look at this', attachmentDocumentIds: ['doc-1'] });
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
    assert.deepEqual(body, { content: '请查看附件。', attachmentDocumentIds: ['doc-1'] });
    assert.equal(view.state.draft, '');
    assert.equal(view.state.attachments[0].documentVersionId, 'doc-1');
});

test('settings save the default only, and persisted message history exposes downloadable originals', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    const calls = []; globalThis.fetch = async (url, init) => { calls.push({ url, body: init?.body ? JSON.parse(init.body) : undefined }); return response({}); };
    const pending = [], settings = synchronousState(new SettingsView({ boot, session, perform: fn => { const task = fn(); pending.push(task); return task; } }));
    const select = find(settings.render(), node => node.type === 'select' && node.props['aria-label'] === '选择已有模型');
    const option = elements(select.props.children).find(child => child.type === 'option' && child.props.value === JSON.stringify(['other', 'large']));
    select.props.onChange({ target: { value: option.props.value } });
    find(settings.render(), node => node.type === 'form' && node.props.className === 'settings-model-form').props.onSubmit({ preventDefault() {} });
    await pending[0];
    assert.deepEqual(calls, [{ url: '/api/settings/model', body: { provider: 'other', model: 'large', thinking: 'high', expectedVersion: 0 } }]);
    const history = synchronousState(new SessionHistory({ projectId: 'p', sessionId: 's', messages: [{ id: 'm', version: 1, role: 'user', status: 'completed', content: 'see this', attachments: [{ ...attachment('doc-1', 'paper.pdf'), mediaType: 'application/pdf' }] }], history: null, historyAnchor: null, onNavigate() {}, perform() {} }));
    const tree = history.render();
    assert.match(JSON.stringify(tree), /paper\.pdf/);
    assert.match(JSON.stringify(tree), /PDF 原件 · 需显式解析/);
    assert.ok(find(tree, node => node.type === 'button' && node.props['aria-label'] === '下载附件原件 paper.pdf'));
});
