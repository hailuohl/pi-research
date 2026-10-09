import test from 'node:test';
import assert from 'node:assert/strict';
import { synchronousState } from '../support/ui.mjs';

const elements = node => Array.isArray(node) ? node.flatMap(elements) : !node || typeof node !== 'object' ? [] : [node, ...elements(node.props?.children)];
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const memoryStorage = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
const load = () => Promise.all([import('../../dist/web/assets/conversation-panel-layout.js'), import('../../dist/web/assets/conversation-panel.js')]);

test('panel width reserves the complete conversation column and stacks below 774px', async () => {
    const [{ panelBounds, clampPanelWidth }] = await load();
    assert.deepEqual(panelBounds(773), { stacked: true, max: 280 });
    assert.deepEqual(panelBounds(774), { stacked: false, max: 280 });
    assert.equal(clampPanelWidth(640, 1000), 506);
    assert.equal(clampPanelWidth(9999, 1800), 640);
    assert.equal(clampPanelWidth(-10, 1000), 280);
});

test('project preferences restore independently and malformed storage falls back safely', async () => {
    const prior = globalThis.localStorage; globalThis.localStorage = memoryStorage();
    try {
        const [{ readPanelPreference, savePanelPreference }] = await load();
        assert.deepEqual(readPanelPreference('a'), { view: 'collaboration', width: 320 });
        savePanelPreference('a', { view: 'files', width: 560 });
        savePanelPreference('b', { width: 400 });
        assert.deepEqual(readPanelPreference('a'), { view: 'files', width: 560 });
        assert.deepEqual(readPanelPreference('b'), { view: 'collaboration', width: 400 });
        localStorage.setItem('pi-research-conversation-panel:a', '{"view":"unknown","width":900}');
        assert.deepEqual(readPanelPreference('a'), { view: 'collaboration', width: 320 });
        localStorage.setItem('pi-research-conversation-panel:a', 'null');
        assert.deepEqual(readPanelPreference('a'), { view: 'collaboration', width: 320 });
    } finally { globalThis.localStorage = prior; }
});

test('pointer, keyboard and reset adjust one column; passive resize retains the preference', async () => {
    const prior = globalThis.localStorage; globalThis.localStorage = memoryStorage();
    try {
        const [{ ConversationLayout, readPanelPreference }] = await load();
        const main = { type: 'main', props: { children: 'conversation and composer' } };
        const layout = synchronousState(new ConversationLayout({ projectId: 'p', active: true, children: main, panel: 'panel', inspector: null }));
        layout.container = { clientWidth: 1200 }; layout.measure();
        const separator = () => elements(layout.render()).find(node => node.props?.role === 'separator');
        const target = { focus() {}, setPointerCapture() {}, hasPointerCapture() { return false; } };
        separator().props.onPointerDown({ button: 0, pointerId: 1, clientX: 900, currentTarget: target, preventDefault() {} });
        separator().props.onPointerMove({ pointerId: 1, clientX: 820 });
        assert.equal(layout.state.preferredWidth, 400);
        separator().props.onPointerUp({ pointerId: 1, currentTarget: target });
        separator().props.onKeyDown({ key: 'ArrowLeft', shiftKey: true, preventDefault() {} });
        assert.equal(layout.state.preferredWidth, 432);
        separator().props.onKeyDown({ key: 'End', preventDefault() {} });
        assert.equal(layout.state.preferredWidth, 640);
        layout.container.clientWidth = 900; layout.measure();
        assert.equal(separator().props['aria-valuenow'], 406);
        assert.equal(readPanelPreference('p').width, 640);
        layout.container.clientWidth = 773; layout.measure();
        assert.equal(separator().props.hidden, true);
        assert.equal(separator().props.tabIndex, -1);
        separator().props.onKeyDown({ key: 'Home', preventDefault() { assert.fail('stacked separator must be inactive'); } });
        assert.equal(readPanelPreference('p').width, 640);
        layout.container.clientWidth = 1200; layout.measure();
        separator().props.onDoubleClick();
        assert.equal(readPanelPreference('p').width, 320);
        assert.equal(elements(layout.render()).find(node => node.type === 'main'), main);
        const next = ConversationLayout.getDerivedStateFromProps({ projectId: 'other' }, layout.state);
        assert.equal(next.preferredWidth, 320);
    } finally { globalThis.localStorage = prior; }
});

test('tabs use roving focus while all three content panels remain mounted', async () => {
    const prior = globalThis.localStorage; globalThis.localStorage = memoryStorage();
    try {
        const [, { ConversationPanel }] = await load();
        const panel = synchronousState(new ConversationPanel({ projectId: '', active: true, data: null, collaboration: 'real inspector', selectedExperiment: '', onExperiment() {}, onWorkspace() {}, onChooseProject() {}, onRetry() {}, error: '' }));
        const tabs = () => elements(panel.render()).filter(node => node.props?.role === 'tab');
        assert.deepEqual(tabs().map(node => node.props['aria-selected']), [true, false, false]);
        let focused = false;
        tabs()[1].props.ref({ focus() { focused = true; } });
        tabs()[0].props.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
        assert.equal(focused, true);
        assert.deepEqual(tabs().map(node => node.props.tabIndex), [-1, 0, -1]);
        assert.deepEqual(elements(panel.render()).filter(node => node.props?.role === 'tabpanel').map(node => node.props.hidden), [true, false, true]);
        assert.equal(elements(panel.render()).filter(node => node.props?.role === 'tabpanel').length, 3);
    } finally { globalThis.localStorage = prior; }
});

test('file tree derives directories only from listed safe relative paths', async () => {
    const [, { projectFileTree }] = await load();
    const tree = projectFileTree([{ path: 'src/a.py', size: 2 }, { path: 'src/b.py', size: 1 }, { path: 'README.md', size: 3 }, { path: '../secret', size: 9 }, { path: '/absolute', size: 9 }]);
    assert.deepEqual(tree.map(node => node.name), ['src', 'README.md']);
    assert.deepEqual([...tree[0].children.keys()], ['a.py', 'b.py']);
    assert.equal(tree[0].children.get('a.py').file.path, 'src/a.py');
});

test('late directory and file reads cannot populate a switched project or hidden view', async () => {
    const prior = globalThis.fetch, requests = [];
    globalThis.fetch = (url, options) => { const response = deferred(); requests.push({ url, options, response }); return response.promise; };
    try {
        const [, { ConversationFiles }] = await load();
        const view = synchronousState(new ConversationFiles({ projectId: 'a', active: true, onWorkspace() {} }));
        view.mounted = true;
        const oldList = view.loadFiles();
        const previous = view.props; view.props = { ...previous, projectId: 'b' }; view.componentDidUpdate(previous);
        requests[0].response.resolve({ ok: true, json: async () => [{ path: 'old.txt', size: 4 }] }); await oldList;
        assert.deepEqual(view.state.files, []);
        assert.equal(requests[0].options.signal.aborted, true);
        requests[1].response.resolve({ ok: true, json: async () => [{ path: 'new.txt', size: 3 }] });
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(view.state.files.map(file => file.path), ['new.txt']);
        await view.openFile('not-listed.txt'); assert.equal(requests.length, 2);
        const fileRead = view.openFile('new.txt');
        const visible = view.props; view.props = { ...visible, active: false }; view.componentDidUpdate(visible);
        requests[2].response.resolve({ ok: true, json: async () => ({ content: '<script>private stale text</script>' }) }); await fileRead;
        assert.equal(view.state.content, '');
        assert.equal(view.state.fileLoading, false);
        assert.match(view.state.fileError, /暂停/);
        assert.equal(requests[2].options.signal.aborted, true);
        view.componentWillUnmount();
    } finally { globalThis.fetch = prior; }
});

test('read failures stay local with retry and text previews remain inert', async () => {
    const prior = globalThis.fetch;
    try {
        const [, { ConversationFiles }] = await load();
        const view = synchronousState(new ConversationFiles({ projectId: 'p', active: true, onWorkspace() {} })); view.mounted = true;
        globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ error: { message: '不可读取此文件', code: 'FORBIDDEN' } }) });
        await view.loadFiles(); assert.equal(view.state.error, '不可读取此文件');
        assert.ok(elements(view.render()).some(node => node.props?.role === 'alert'));
        globalThis.fetch = async () => ({ ok: true, json: async () => [{ path: 'notes.html', size: 10 }] });
        await view.loadFiles(); assert.equal(view.state.error, '');
        globalThis.fetch = async () => ({ ok: true, json: async () => ({ content: '<script>alert(1)</script>' }) });
        await view.openFile('notes.html');
        const preview = elements(view.render()).find(node => node.type === 'pre');
        assert.equal(preview.props.children, '<script>alert(1)</script>');
        assert.equal(preview.props.dangerouslySetInnerHTML, undefined);
        view.componentWillUnmount();
    } finally { globalThis.fetch = prior; }
});
