import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronousState } from '../support/ui.mjs';
import { ComposerControls } from '../../dist/web/assets/composer-controls.js';
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

test('source popover saves a project version and keeps its draft after a failed save or close', async t => {
    const oldFetch = globalThis.fetch; t.after(() => { globalThis.fetch = oldFetch; });
    let fail = true, request;
    globalThis.fetch = async (url, init) => {
        if (!init?.body) return response({ version: 4, enabled: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: true } });
        request = { url, body: JSON.parse(init.body) };
        return fail ? { ok: false, status: 409, json: async () => ({ error: { message: 'version conflict' } }) } : response({ version: 5, enabled: request.body.enabled });
    };
    const perform = async fn => { try { return await fn(); } catch { return undefined; } };
    const view = synchronousState(new ComposerControls(controlsProps({ perform })));
    await view.loadSources();
    view.setState({ sourcesOpen: true });
    const checkbox = find(view.render(), node => node.type === 'input' && node.props['aria-label'] === '启用 alphaXiv');
    checkbox.props.onChange({ target: { checked: true } });
    await view.saveSources();
    assert.equal(request.url, '/api/projects/p/connectors');
    assert.equal(request.body.expectedVersion, 4);
    assert.equal(request.body.enabled.alphaxiv, true);
    assert.equal(view.state.sourceDraft.alphaxiv, true);
    assert.equal(view.state.config.version, 4);
    view.setState({ sourcesOpen: false }); view.setState({ sourcesOpen: true });
    assert.equal(find(view.render(), node => node.type === 'input' && node.props['aria-label'] === '启用 alphaXiv').props.checked, true);
    fail = false; await view.saveSources();
    assert.equal(view.state.config.version, 5);
    assert.equal(view.state.sourcesOpen, false);
});

test('current-session model menu sends only the selected saved config and respects fixed grants', () => {
    const selected = [];
    const view = synchronousState(new ComposerControls(controlsProps({ onSendModel: value => selected.push(value) })));
    const select = find(view.render(), node => node.type === 'select' && node.props['aria-label'] === '会话模型与思考等级');
    const option = elements(select.props.children).find(child => child.type === 'option' && child.props.value === JSON.stringify(['other', 'large', 'high']));
    select.props.onChange({ target: { value: option.props.value } });
    assert.deepEqual(selected, [{ provider: 'other', model: 'large', thinking: 'high' }]);
    const locked = synchronousState(new ComposerControls(controlsProps({ modelLocked: true })));
    assert.equal(find(locked.render(), node => node.type === 'select' && node.props['aria-label'] === '会话模型与思考等级').props.disabled, true);
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
    find(settings.render(), node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await pending[0];
    assert.deepEqual(calls, [{ url: '/api/settings/model', body: { provider: 'other', model: 'large', thinking: 'high' } }]);
    const history = synchronousState(new SessionHistory({ projectId: 'p', sessionId: 's', messages: [{ id: 'm', version: 1, role: 'user', status: 'completed', content: 'see this', attachments: [{ ...attachment('doc-1', 'paper.pdf'), mediaType: 'application/pdf' }] }], history: null, historyAnchor: null, onNavigate() {}, perform() {} }));
    const tree = history.render();
    assert.match(JSON.stringify(tree), /paper\.pdf/);
    assert.match(JSON.stringify(tree), /PDF 原件 · 需显式解析/);
    assert.ok(find(tree, node => node.type === 'button' && node.props['aria-label'] === '下载附件原件 paper.pdf'));
});
