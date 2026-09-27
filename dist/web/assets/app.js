import { IntegrationsView } from './integrations.js';
import { ChangesView } from './changes.js';
import { CampaignView } from './campaigns.js';
import { api, ApiError, hasToken, setToken } from './api.js';
import { short } from './models.js';
import { Icon, Modal } from './ui.js';
import { Chat, Experiments, Inspector } from './workbench.js';
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from './data-views.js';
const navigation = [['chat', '研究会话', 'chat'], ['campaigns', '研究活动', 'branch'], ['experiments', '实验与运行', 'experiment'], ['workspace', '项目工作区', 'folder'], ['changes', '变更提案', 'branch'], ['literature', '文献检索', 'search'], ['integrations', '技能与连接器', 'settings'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report'], ['settings', '设置与能力', 'settings']];
const manualTasks = [{ key: 'sources', role: 'literature', objective: '整理用户已提供资料及候选文献；检索策略与最终排序由主协调者负责。明确未阅读的全文。', dependencies: [] }, { key: 'analysis', role: 'analyst', objective: '核查已有运行指标及其证据；缺少必要输入则阻塞，不编造结果。', dependencies: [], critical: true }, { key: 'review', role: 'reviewer', objective: '独立核查分析结论与真实证据。', dependencies: ['sources'], reviewOf: 'analysis' }, { key: 'report', role: 'writer', objective: '根据已验收的输入形成实际报告产物，说明限制。', dependencies: ['analysis', 'review'], expectedOutputs: [{ kind: 'report', schemaId: 'report', required: true }], acceptanceRuleIds: ['artifact-required'] }];
function saved() {
    try {
        return JSON.parse(localStorage.getItem('pi-research-ui-v1') ?? '{}');
    }
    catch {
        return {};
    }
}
class App extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { boot: null, data: null, projectId: saved().projectId ?? '', sessionId: saved().sessionId ?? '', tab: saved().tab ?? 'chat', selectedExp: saved().selectedExp ?? '', messages: [], stream: '', modal: '', modalData: null, busy: false, error: '', notice: '', connected: false, tokenDraft: '', loggedIn: hasToken() };
        this.refreshing = false;
        this.refreshEpoch = 0;
        this.cursor = 0;
        this.perform = async (fn, success) => {
            if (this.state.busy)
                return;
            this.refreshEpoch++;
            this.setState({ busy: true, error: '' });
            try {
                const result = await fn();
                if (success) {
                    clearTimeout(this.noticeTimer);
                    this.setState({ notice: success });
                    this.noticeTimer = window.setTimeout(() => this.setState({ notice: '' }), 4500);
                }
                await this.refresh();
                return result;
            }
            catch (e) {
                this.setState({ error: e instanceof Error ? e.message : String(e) });
                return undefined;
            }
            finally {
                this.setState({ busy: false });
            }
        };
        this.close = () => {
            if (!this.state.busy)
                this.setState({ modal: '', modalData: null });
        };
    }
    componentDidMount() {
        if (this.state.loggedIn)
            void this.refresh();
        this.timer = window.setInterval(() => {
            if (this.state.loggedIn)
                void this.refresh(true);
        }, 1300);
    }
    componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.noticeTimer); }
    componentDidUpdate(_, prev) {
        if (['projectId', 'sessionId', 'tab', 'selectedExp'].some(k => prev[k] !== this.state[k]))
            localStorage.setItem('pi-research-ui-v1', JSON.stringify({ projectId: this.state.projectId, sessionId: this.state.sessionId, tab: this.state.tab, selectedExp: this.state.selectedExp }));
    }
    async refresh(quiet = false) {
        if (this.refreshing || quiet && this.state.busy)
            return;
        this.refreshing = true;
        const epoch = this.refreshEpoch;
        try {
            const boot = await api('/bootstrap');
            const projectId = boot.projects.some(p => p.id === this.state.projectId) ? this.state.projectId : boot.projects[0]?.id ?? '';
            const data = projectId ? await api(`/projects/${projectId}/state`) : null;
            const sessionId = data?.sessions.some(s => s.id === this.state.sessionId) ? this.state.sessionId : data?.sessions.find(s => s.role === 'coordinator' && s.state !== 'archived')?.id ?? '';
            const [messages, events] = await Promise.all([sessionId ? api(`/sessions/${sessionId}/messages`) : Promise.resolve([]), api(`/events?after=${this.cursor}`)]);
            let stream = this.state.stream;
            for (const event of events.items) {
                if (event.payload.sessionId === sessionId) {
                    if (event.type === 'session.delta')
                        stream += event.payload.text;
                    if (['session.message_completed', 'agent.finished'].includes(event.type))
                        stream = '';
                }
            }
            if (epoch !== this.refreshEpoch)
                return;
            this.cursor = events.cursor;
            const selectedExp = data?.experiments.some(e => e.id === this.state.selectedExp) ? this.state.selectedExp : data?.experiments[0]?.id ?? '';
            this.setState({ boot, data, projectId, sessionId, messages, selectedExp, stream: stream.slice(-32000), connected: true });
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 401)
                this.setState({ loggedIn: false, error: error.message });
            else
                this.setState({ connected: false, ...(!quiet ? { error: error instanceof Error ? error.message : String(error) } : {}) });
        }
        finally {
            this.refreshing = false;
        }
    }
    switchProject(id) { this.refreshEpoch++; this.cursor = 0; this.setState({ projectId: id, sessionId: '', selectedExp: '', stream: '', data: null }, () => { void this.refresh(); }); }
    selectSession(id) { this.refreshEpoch++; this.setState({ sessionId: id, tab: 'chat', stream: '' }, () => { void this.refresh(); }); }
    open(modal, data = null) { this.setState({ modal, modalData: data, error: '' }); }
    async newSession() {
        if (!this.state.projectId)
            return;
        await this.perform(async () => { const s = await api('/sessions', { projectId: this.state.projectId, title: '新的研究会话' }); this.setState({ sessionId: s.id, tab: 'chat', messages: [], stream: '' }); });
    }
    async toggle() { const p = this.state.data.project; await this.perform(() => api(`/projects/${p.id}/collaboration-settings`, { expectedVersion: p.version, enabled: !p.settings.enabled })); }
    modalView() {
        const { modal, modalData, data, busy } = this.state;
        if (!modal)
            return null;
        const base = { onClose: this.close, busy };
        const done = () => this.setState({ modal: '', modalData: null });
        if (modal === 'project')
            return React.createElement(Modal, { ...base, title: "\u65B0\u5EFA\u672C\u5730\u9879\u76EE", submitLabel: "\u521B\u5EFA\u9879\u76EE", onSubmit: fd => this.perform(async () => { const p = await api('/projects', { name: fd.get('name'), description: fd.get('description'), template: fd.get('template') }); const s = await api('/sessions', { projectId: p.id, title: '研究主会话' }); this.setState({ projectId: p.id, sessionId: s.id, selectedExp: '', tab: 'chat' }); done(); }) },
                React.createElement("label", null,
                    "\u9879\u76EE\u540D\u79F0",
                    React.createElement("input", { "aria-label": "\u9879\u76EE\u540D\u79F0", name: "name", required: true, maxLength: 120, placeholder: "\u4F8B\u5982\uFF1A\u6750\u6599\u7B5B\u9009\u7814\u7A76" })),
                React.createElement("label", null,
                    "\u9879\u76EE\u8BF4\u660E",
                    React.createElement("textarea", { name: "description", placeholder: "\u7814\u7A76\u76EE\u6807\u3001\u8303\u56F4\u6216\u8F93\u5165\u8D44\u6599" })),
                React.createElement("label", null,
                    "\u9879\u76EE\u6A21\u677F",
                    React.createElement("select", { "aria-label": "\u9879\u76EE\u6A21\u677F", name: "template", defaultValue: "curve-fit" },
                        React.createElement("option", { value: "curve-fit" }, "\u771F\u5B9E\u66F2\u7EBF\u62DF\u5408\u793A\u4F8B \u00B7 \u53EF\u76F4\u63A5\u8FD0\u884C"),
                        React.createElement("option", { value: "empty" }, "\u7A7A\u9879\u76EE \u00B7 \u81EA\u884C\u51C6\u5907\u6587\u4EF6"))),
                React.createElement("div", { className: "notice" },
                    React.createElement("p", null, "\u66F2\u7EBF\u62DF\u5408\u4F7F\u7528\u56FA\u5B9A\u5408\u6210\u6570\u636E\uFF0C\u771F\u5B9E\u6267\u884C\u6570\u503C\u8BA1\u7B97\u3002\u5B83\u7528\u4E8E\u9A8C\u8BC1\u7CFB\u7EDF\uFF0C\u4E0D\u662F\u6750\u6599\u7814\u7A76\u6216 LLM \u6A21\u62DF\u3002")));
        if (modal === 'experiment')
            return React.createElement(Modal, { ...base, wide: true, title: modalData?.parentId ? '派生子实验' : '建立实验草案', submitLabel: "\u4FDD\u5B58\u5B9E\u9A8C\u8349\u6848", onSubmit: fd => this.perform(async () => { const e = await api('/experiments', { projectId: data.project.id, title: fd.get('title'), hypothesis: fd.get('hypothesis'), ...(modalData?.parentId ? { parentId: modalData.parentId } : {}), config: JSON.parse(String(fd.get('config'))) }); this.setState({ selectedExp: e.id, tab: 'experiments' }); done(); }) },
                React.createElement("label", null,
                    "\u5B9E\u9A8C\u540D\u79F0",
                    React.createElement("input", { "aria-label": "\u5B9E\u9A8C\u540D\u79F0", name: "title", defaultValue: modalData?.parentId ? '新候选实验' : '基线实验', required: true })),
                React.createElement("label", null,
                    "\u7814\u7A76\u5047\u8BBE",
                    React.createElement("textarea", { "aria-label": "\u7814\u7A76\u5047\u8BBE", name: "hypothesis", required: true, placeholder: "\u8981\u68C0\u9A8C\u7684\u5047\u8BBE\u3001\u5BF9\u7167\u6761\u4EF6\u548C\u9884\u671F\u7ED3\u679C" })),
                React.createElement("label", null,
                    "\u7248\u672C\u5316\u914D\u7F6E JSON",
                    React.createElement("textarea", { "aria-label": "\u7248\u672C\u5316\u914D\u7F6E JSON", name: "config", className: "code-input", defaultValue: JSON.stringify({ polynomialDegree: modalData?.parentId ? 2 : 1, ridge: 0.000001 }, null, 2), required: true, rows: 5 })),
                React.createElement("p", { className: "small muted" }, "\u914D\u7F6E\u968F\u4EE3\u7801\u8FDB\u5165\u5FEB\u7167\uFF0C\u4E0D\u901A\u8FC7\u4E34\u65F6\u547D\u4EE4\u884C\u53C2\u6570\u4FEE\u6539\u5B9E\u9A8C\u6761\u4EF6\u3002\u6D3E\u751F\u5B9E\u9A8C\u7EE7\u627F\u7236\u8282\u70B9\u8FD0\u884C\u5951\u7EA6\u3002"));
        if (modal === 'config')
            return React.createElement(Modal, { ...base, wide: true, title: "\u5B9E\u9A8C\u7248\u672C\u5316\u914D\u7F6E", submitLabel: modalData.frozen ? '关闭只读配置' : '保存配置修订', onSubmit: fd => this.perform(async () => {
                    if (!modalData.frozen)
                        await api(`/experiments/${modalData.id}/files`, { path: 'config.json', content: fd.get('content'), expectedDigest: modalData.digest, expectedVersion: modalData.version });
                    done();
                }) },
                React.createElement("p", { className: "small muted" }, modalData.frozen ? '已冻结节点不能修改；需要变更时请派生子实验。' : '保存会增加方案修订，之前准备的运行批准不再适用。'),
                React.createElement("label", null,
                    "\u914D\u7F6E\u6E90\u7801",
                    React.createElement("textarea", { name: "content", "aria-label": "\u914D\u7F6E\u6E90\u7801", className: "code-input", rows: 12, readOnly: modalData.frozen, defaultValue: modalData.content })));
        if (modal === 'team')
            return React.createElement(Modal, { ...base, wide: true, title: "\u624B\u52A8\u7F16\u5199\u534F\u4F5C\u8BA1\u5212", submitLabel: "\u63D0\u4EA4\u8BA1\u5212\u5F85\u6279\u51C6", onSubmit: fd => this.perform(async () => {
                    let sessionId = this.state.sessionId;
                    if (!sessionId) {
                        const s = await api('/sessions', { projectId: data.project.id, title: '协作主会话' });
                        sessionId = s.id;
                        this.setState({ sessionId });
                    }
                    await api(`/sessions/${sessionId}/teams`, { goal: fd.get('goal'), tasks: JSON.parse(String(fd.get('tasks'))), budget: Number(fd.get('budget')), autoSummarize: fd.get('autoSummarize') === 'on' });
                    done();
                }) },
                React.createElement("label", null,
                    "\u534F\u4F5C\u76EE\u6807",
                    React.createElement("input", { name: "goal", "aria-label": "\u534F\u4F5C\u76EE\u6807", required: true, placeholder: "\u9700\u8981\u5171\u540C\u5B8C\u6210\u7684\u76EE\u6807" })),
                React.createElement("label", null,
                    "\u4EFB\u52A1\u4F9D\u8D56 JSON",
                    React.createElement("textarea", { className: "code-input", "aria-label": "\u4EFB\u52A1\u4F9D\u8D56 JSON", name: "tasks", defaultValue: JSON.stringify(manualTasks.map(t => t.key === 'analysis' ? { ...t, inputEvidenceIds: data?.evidence.map(e => e.id) ?? [] } : t), null, 2), rows: 13, required: true })),
                React.createElement("label", null,
                    "\u6700\u5927\u5C1D\u8BD5\u989D\u5EA6",
                    React.createElement("input", { type: "number", name: "budget", min: 5, max: 100, defaultValue: 12 })),
                React.createElement("label", { className: "check-label" },
                    React.createElement("input", { type: "checkbox", name: "autoSummarize", defaultChecked: true }),
                    "\u534F\u4F5C\u7ED3\u675F\u540E\u81EA\u52A8\u5524\u9192\u4E3B Pi \u7EFC\u5408\uFF08\u5360\u7528\u56E2\u961F\u5C1D\u8BD5\u989D\u5EA6\uFF09"),
                React.createElement("p", { className: "small muted" }, "\u8FD9\u662F\u624B\u52A8\u8BA1\u5212\u6A21\u677F\uFF0C\u4E0D\u662F\u6A21\u578B\u751F\u6210\u7684\u5EFA\u8BAE\u3002\u5173\u952E\u4EFB\u52A1\u901A\u8FC7 reviewOf \u5B89\u6392\u72EC\u7ACB\u5BA1\u67E5\uFF1B\u989D\u5EA6\u6309\u4EFB\u52A1\u5C1D\u8BD5\u8BA1\uFF0C\u4E0D\u662F\u5B9E\u9645\u8D26\u5355\u4E0A\u9650\u3002"));
        if (modal === 'directive')
            return React.createElement(Modal, { ...base, title: "\u7ED9\u56E2\u961F\u53D1\u9001\u6307\u4EE4", submitLabel: "\u4FDD\u5B58\u6307\u4EE4", onSubmit: fd => this.perform(async () => { await api(`/teams/${modalData}/directives`, { kind: fd.get('kind'), content: fd.get('content') }); done(); }) },
                React.createElement("label", null,
                    "\u6307\u4EE4\u8BED\u4E49",
                    React.createElement("select", { name: "kind" },
                        React.createElement("option", { value: "steer" }, "\u5F15\u5BFC\u5F53\u524D\u5DE5\u4F5C \u00B7 \u4E0D\u4FEE\u6539\u7814\u7A76\u76EE\u6807"),
                        React.createElement("option", { value: "follow_up" }, "\u540E\u7EED\u6307\u4EE4 \u00B7 \u5F53\u524D\u4EFB\u52A1\u7ED3\u675F\u540E\u5904\u7406"),
                        React.createElement("option", { value: "revise" }, "\u6539\u53D8\u7814\u7A76\u76EE\u6807 \u00B7 \u65E7\u4EFB\u52A1\u5931\u6548\uFF0C\u6682\u505C\u91CD\u65B0\u89C4\u5212"))),
                React.createElement("label", null,
                    "\u6307\u4EE4\u5185\u5BB9",
                    React.createElement("textarea", { name: "content", rows: 6, required: true })),
                React.createElement("p", { className: "small muted" }, "\u4FEE\u6539\u76EE\u6807\u4F1A\u4FDD\u5B58\u65B0\u9700\u6C42\u7248\u672C\uFF0C\u4E0D\u5220\u9664\u5DF2\u6709\u5B9E\u9A8C\u6216\u7ED3\u679C\u3002\u53D6\u6D88\u6B63\u5F0F Run \u9700\u5355\u72EC\u64CD\u4F5C\u3002"));
        if (modal === 'evidence')
            return React.createElement(Modal, { ...base, wide: true, title: "\u767B\u8BB0\u539F\u6587\u8BC1\u636E", submitLabel: "\u4FDD\u5B58\u8BC1\u636E", onSubmit: fd => this.perform(async () => { await api('/evidence', { projectId: data.project.id, artifactId: modalData.artifactId, start: Number(fd.get('start')), end: Number(fd.get('end')), description: fd.get('description') }); done(); }, '证据已定位并校验') },
                React.createElement("label", null,
                    "\u8BC1\u636E\u8BF4\u660E",
                    React.createElement("input", { name: "description", required: true, placeholder: "\u6B64\u7247\u6BB5\u7528\u4E8E\u652F\u6301\u4EC0\u4E48\u89C2\u5BDF\uFF1F" })),
                React.createElement("div", { className: "form-columns" },
                    React.createElement("label", null,
                        "\u8D77\u59CB\u5B57\u7B26",
                        React.createElement("input", { type: "number", name: "start", min: 0, defaultValue: 0 })),
                    React.createElement("label", null,
                        "\u7ED3\u675F\u5B57\u7B26",
                        React.createElement("input", { type: "number", name: "end", min: 1, max: modalData.content.length, defaultValue: Math.min(modalData.content.length, 2000) }))),
                React.createElement("p", { className: "small muted" }, "\u4F7F\u7528 JavaScript UTF-16 \u5B57\u7B26\u4F4D\u7F6E\uFF0C\u4E0D\u662F PDF \u9875\u7801\u6216\u65E5\u5FD7\u5B57\u8282\u4F4D\u7F6E\u3002"),
                React.createElement("pre", { className: "modal-preview" }, modalData.content.slice(0, 4000)));
        if (modal === 'claim')
            return React.createElement(Modal, { ...base, title: "\u63D0\u51FA\u7ED3\u8BBA\u5019\u9009", submitLabel: "\u4FDD\u5B58\u5019\u9009\u5F85\u9A8C\u6536", onSubmit: fd => this.perform(async () => { await api('/claims', { projectId: data.project.id, statement: fd.get('statement'), evidenceIds: [fd.get('evidenceId')], limitations: String(fd.get('limitations')).split('\n').filter(Boolean) }); done(); }) },
                React.createElement("label", null,
                    "\u7ED3\u8BBA\u9648\u8FF0",
                    React.createElement("textarea", { name: "statement", required: true, rows: 4 })),
                React.createElement("label", null,
                    "\u8BC1\u636E\u6765\u6E90",
                    React.createElement("select", { name: "evidenceId" }, data.evidence.map(e => React.createElement("option", { value: e.id, key: e.id },
                        e.description,
                        " \u00B7 ",
                        short(e.id))))),
                React.createElement("label", null,
                    "\u9650\u5236\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
                    React.createElement("textarea", { name: "limitations", required: true, placeholder: "\u6837\u672C\u89C4\u6A21\u3001\u6761\u4EF6\u3001\u672A\u6267\u884C\u7684\u9A8C\u8BC1\u7B49" })));
        return null;
    }
    render() {
        const { boot, data, loggedIn, tab } = this.state;
        if (!loggedIn)
            return React.createElement("main", { className: "login" },
                React.createElement("div", { className: "brand" },
                    React.createElement("span", null, "\u03C0"),
                    "Pi Research"),
                React.createElement("h1", null, "\u6253\u5F00\u4F60\u7684\u79D1\u7814\u5DE5\u4F5C\u53F0"),
                React.createElement("p", null, "\u8BF7\u4F7F\u7528\u542F\u52A8\u7EC8\u7AEF\u4E2D\u7684\u5B8C\u6574\u5730\u5740\uFF0C\u6216\u5728\u8FD9\u91CC\u7C98\u8D34\u672C\u673A\u8BBF\u95EE\u4EE4\u724C\u3002"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); setToken(this.state.tokenDraft); this.setState({ loggedIn: true, error: '' }, () => { void this.refresh(); }); } },
                    React.createElement("label", null,
                        "\u672C\u5730\u8BBF\u95EE\u4EE4\u724C",
                        React.createElement("input", { "aria-label": "\u672C\u5730\u8BBF\u95EE\u4EE4\u724C", type: "password", value: this.state.tokenDraft, onChange: (e) => this.setState({ tokenDraft: e.target.value }), required: true })),
                    React.createElement("button", { className: "primary" }, "\u8FDB\u5165\u5DE5\u4F5C\u53F0")),
                this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
                React.createElement("small", null, "\u53EA\u7ED1\u5B9A 127.0.0.1\u3002\u4EE4\u724C\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4F1A\u8BDD\u4E2D\uFF0C\u4E0D\u653E\u5165\u8BF7\u6C42 URL\u3002"));
        const currentSession = data?.sessions.find(s => s.id === this.state.sessionId), experiment = data?.experiments.find(e => e.id === this.state.selectedExp);
        return React.createElement("div", { className: "app-shell" },
            React.createElement("nav", { className: "sidebar", "aria-label": "\u4E3B\u5BFC\u822A" },
                React.createElement("a", { className: "brand", href: "#", onClick: (e) => { e.preventDefault(); this.setState({ tab: 'chat' }); } },
                    React.createElement("span", null, "\u03C0"),
                    React.createElement("div", null,
                        "Pi Research",
                        React.createElement("small", null, "RESEARCH WORKSPACE"))),
                React.createElement("button", { className: "new-project", onClick: () => this.open('project') },
                    React.createElement(Icon, { name: "plus", size: 16 }),
                    "\u65B0\u5EFA\u9879\u76EE"),
                React.createElement("div", { className: "sidebar-caption" }, "WORKSPACE"),
                React.createElement("div", { className: "nav-list" }, navigation.map(([id, name, icon]) => React.createElement("button", { key: id, className: tab === id ? 'active' : '', onClick: () => this.setState({ tab: id }) },
                    React.createElement(Icon, { name: icon, size: 18 }),
                    React.createElement("span", null, name),
                    id === 'experiments' && data?.experiments.length ? React.createElement("em", null, data.experiments.length) : null))),
                React.createElement("div", { className: "sidebar-sessions" },
                    React.createElement("div", { className: "sidebar-caption" },
                        "\u4F1A\u8BDD",
                        React.createElement("button", { "aria-label": "\u65B0\u5EFA\u4F1A\u8BDD", title: "\u65B0\u5EFA\u4F1A\u8BDD", className: "icon-button", disabled: !data, onClick: () => this.newSession() },
                            React.createElement(Icon, { name: "plus", size: 15 }))),
                    data?.sessions.filter(s => s.role === 'coordinator' && s.state !== 'archived').map(s => React.createElement("button", { key: s.id, className: s.id === this.state.sessionId ? 'selected-session' : '', onClick: () => this.selectSession(s.id) },
                        React.createElement("span", { className: 'session-dot ' + (s.state === 'running' ? 'live' : '') }),
                        React.createElement("span", null, s.title)))),
                React.createElement("div", { className: "sidebar-footer" },
                    React.createElement("div", { className: "local-avatar" },
                        React.createElement(Icon, { name: "folder" })),
                    React.createElement("div", null,
                        React.createElement("strong", null, "\u672C\u5730\u5DE5\u4F5C\u7A7A\u95F4"),
                        React.createElement("small", null, "\u6570\u636E\u7531\u4F60\u638C\u63E1")),
                    React.createElement("span", { className: 'status-dot ' + (this.state.connected ? '' : 'amber') }))),
            React.createElement("div", { className: "workspace-shell" },
                React.createElement("header", { className: "topbar" },
                    React.createElement("div", { className: "breadcrumb" },
                        React.createElement("span", null, "\u9879\u76EE"),
                        React.createElement(Icon, { name: "chevron", size: 12 }),
                        React.createElement("select", { "aria-label": "\u5F53\u524D\u9879\u76EE", value: this.state.projectId, onChange: (e) => this.switchProject(e.target.value) }, !boot?.projects.length ? React.createElement("option", { value: "" }, "\u5C1A\u672A\u521B\u5EFA\u9879\u76EE") : boot.projects.map(p => React.createElement("option", { value: p.id, key: p.id }, p.name)))),
                    React.createElement("div", { className: "topbar-right" },
                        React.createElement("span", { className: 'connection-state ' + (this.state.connected ? 'ready' : '') },
                            React.createElement("span", { className: 'status-dot ' + (this.state.connected ? '' : 'amber') }),
                            this.state.connected ? '本地服务在线' : '正在重连'),
                        React.createElement("span", { className: "version-label" }, "v0.2 \u00B7 \u5F00\u53D1\u7248"))),
                this.state.error ? React.createElement("div", { className: "global-error", role: "alert" },
                    React.createElement("strong", null, "\u64CD\u4F5C\u672A\u5B8C\u6210"),
                    React.createElement("span", null, this.state.error),
                    React.createElement("button", { className: "icon-button", "aria-label": "\u5173\u95ED\u9519\u8BEF\u63D0\u793A", onClick: () => this.setState({ error: '' }) },
                        React.createElement(Icon, { name: "close", size: 16 }))) : null,
                this.state.notice ? React.createElement("div", { className: "toast", role: "status" },
                    React.createElement(Icon, { name: "check", size: 16 }),
                    this.state.notice) : null,
                React.createElement("div", { className: 'workbench-content ' + (['chat', 'experiments'].includes(tab) && data ? 'with-inspector' : '') },
                    React.createElement("main", { className: 'main-pane ' + (tab === 'chat' ? 'chat-pane' : '') }, !boot ? React.createElement("div", { className: "boot-screen" }, "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u9879\u76EE\u2026") : tab === 'settings' ? React.createElement(SettingsView, { boot: boot, session: currentSession, perform: this.perform }) : !data ? React.createElement("div", { className: "first-project" },
                        React.createElement("div", { className: "welcome-mark" }, "\u03C0"),
                        React.createElement("h1", null,
                            "\u6BCF\u4E00\u4E2A\u7814\u7A76\uFF0C",
                            React.createElement("br", null),
                            "\u4ECE\u6E05\u6670\u7684\u8D77\u70B9\u5F00\u59CB\u3002"),
                        React.createElement("p", null,
                            "\u5EFA\u7ACB\u672C\u5730\u9879\u76EE\uFF0C\u4FDD\u5B58\u6E90\u4EE3\u7801\u3001\u5B9E\u9A8C\u5FEB\u7167\u548C\u8BC1\u636E\u3002",
                            React.createElement("br", null),
                            "\u4E5F\u53EF\u4EE5\u5148\u8FD0\u884C\u968F\u5305\u7684\u771F\u5B9E\u6570\u503C\u793A\u4F8B\uFF0C\u68C0\u67E5\u5B8C\u6574\u6D41\u7A0B\u3002"),
                        React.createElement("button", { className: "primary", onClick: () => this.open('project') },
                            "\u521B\u5EFA\u7B2C\u4E00\u4E2A\u9879\u76EE ",
                            React.createElement(Icon, { name: "arrow", size: 17 })),
                        React.createElement("p", { className: "small muted" }, "Pi \u662F\u552F\u4E00 Agent \u6267\u884C\u5185\u6838\u3002\u6CA1\u6709 ORX \u8FD0\u884C\u65F6\u4F9D\u8D56\u3002")) :
                        tab === 'chat' ? React.createElement(Chat, { data: data, boot: boot, session: currentSession, messages: this.state.messages, stream: this.state.stream, perform: this.perform, onNew: () => this.newSession(), onExperiments: () => this.setState({ tab: 'experiments' }), onWorkspace: () => this.setState({ tab: 'workspace' }), onSession: id => this.selectSession(id) }) :
                            tab === 'campaigns' ? React.createElement(CampaignView, { key: data.project.id, data: data, busy: this.state.busy, perform: this.perform, onSession: id => this.selectSession(id), onExperiment: id => this.setState({ selectedExp: id, tab: 'experiments' }) }) :
                                tab === 'experiments' ? React.createElement(Experiments, { data: data, selected: this.state.selectedExp, onSelect: selectedExp => { this.refreshEpoch++; this.setState({ selectedExp }); }, onCreate: () => this.open('experiment'), onChild: () => this.open('experiment', { parentId: experiment?.id }) }) :
                                    tab === 'changes' ? React.createElement(ChangesView, { key: data.project.id, data: data, perform: this.perform }) :
                                        tab === 'workspace' ? React.createElement(WorkspaceView, { key: data.project.id, data: data, perform: this.perform }) :
                                            tab === 'integrations' ? React.createElement(IntegrationsView, { key: data.project.id, projectId: data.project.id }) :
                                                tab === 'literature' ? React.createElement(LiteratureView, { key: data.project.id, data: data, perform: this.perform }) :
                                                    tab === 'evidence' ? React.createElement(EvidenceView, { key: data.project.id, data: data, perform: this.perform, onRegister: (artifactId, content) => this.open('evidence', { artifactId, content }), onClaim: () => this.open('claim') }) :
                                                        tab === 'reports' ? React.createElement(ReportsView, { key: data.project.id, data: data, perform: this.perform }) : null),
                    data && boot && ['chat', 'experiments'].includes(tab) ? React.createElement(Inspector, { data: data, boot: boot, tab: tab, experiment: experiment, perform: this.perform, onToggle: () => this.toggle(), onTeam: () => this.open('team'), onPrepare: () => {
                            if (experiment)
                                this.perform(() => api('/run-intents', { experimentId: experiment.id }), '已准备不可变快照，等待人工批准');
                        }, onChild: () => this.open('experiment', { parentId: experiment?.id }), onConfig: () => {
                            if (experiment)
                                this.perform(async () => { const file = await api(`/experiments/${experiment.id}/files?path=config.json`); this.open('config', { id: experiment.id, version: experiment.version, frozen: experiment.lifecycle === 'frozen', ...file }); });
                        }, onDirective: teamId => this.open('directive', teamId) }) : null)),
            this.modalView());
    }
}
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
