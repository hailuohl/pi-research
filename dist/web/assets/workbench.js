import { WakeupPanel } from './campaigns.js';
import { comparableRuns, comparisonMetric } from './models.js';
import { api, artifactText, downloadArtifact } from './api.js';
import { short, number, date, label } from './models.js';
import { Icon, Badge, Empty, SectionTitle } from './ui.js';
export class Chat extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { draft: '', mode: 'prompt' };
    }
    render() {
        const { data, boot, session, messages } = this.props;
        const canSend = boot.runtime.ready && !!session?.model.provider && !!session?.model.model;
        return React.createElement("div", { className: "chat-page" },
            React.createElement("div", { className: "chat-heading" },
                React.createElement("div", null,
                    React.createElement("h1", null, session?.title ?? '研究会话'),
                    React.createElement("span", { className: "muted" }, session ? `${session.model.provider || '未配置供应商'} / ${session.model.model || '未配置模型'}` : '每个主会话都有独立历史和工作区')),
                session ? React.createElement("div", { className: "actions" },
                    React.createElement(Badge, { value: session.state }),
                    React.createElement("button", { className: "icon-button", title: "\u91CD\u547D\u540D\u4F1A\u8BDD", "aria-label": "\u91CD\u547D\u540D\u4F1A\u8BDD", onClick: () => {
                            const title = prompt('会话名称', session.title);
                            if (title)
                                this.props.perform(() => api(`/sessions/${session.id}`, { title, expectedVersion: session.version }));
                        } },
                        React.createElement(Icon, { name: "evidence" }))) : null),
            !canSend ? React.createElement("div", { className: "notice runtime-notice" },
                React.createElement("span", { className: "status-dot amber" }),
                React.createElement("div", null,
                    React.createElement("strong", null, "Pi \u5C1A\u672A\u5C31\u7EEA"),
                    React.createElement("p", null,
                        boot.runtime.message,
                        " \u9879\u76EE\u3001\u5FEB\u7167\u3001\u771F\u5B9E\u6570\u503C\u5B9E\u9A8C\u548C\u8BC1\u636E\u7BA1\u7406\u4ECD\u53EF\u4F7F\u7528\u3002"))) : null,
            React.createElement("div", { className: "conversation", "aria-live": "polite" },
                messages.length === 0 ? React.createElement("div", { className: "welcome" },
                    React.createElement("div", { className: "welcome-mark" }, "\u03C0"),
                    React.createElement("h2", null,
                        "\u8BA9\u7814\u7A76\u8FC7\u7A0B\uFF0C",
                        React.createElement("br", null),
                        "\u6709\u8FF9\u53EF\u5FAA\u3002"),
                    React.createElement("p", null,
                        "\u4ECE\u95EE\u9898\u5230\u5B9E\u9A8C\uFF0C\u518D\u5230\u53EF\u4FE1\u8BC1\u636E\u3002",
                        React.createElement("br", null),
                        "\u6BCF\u4E00\u6B21\u8FD0\u884C\u90FD\u6709\u81EA\u5DF1\u7684\u5FEB\u7167\uFF0C\u6BCF\u4E00\u6B65\u51B3\u5B9A\u90FD\u4FDD\u7559\u4F9D\u636E\u3002"),
                    React.createElement("div", { className: "welcome-actions" },
                        React.createElement("button", { onClick: this.props.onExperiments },
                            React.createElement(Icon, { name: "experiment" }),
                            React.createElement("span", null, "\u5EFA\u7ACB\u4E00\u4E2A\u53EF\u590D\u73B0\u7684\u5B9E\u9A8C"),
                            React.createElement(Icon, { name: "arrow" })),
                        React.createElement("button", { onClick: this.props.onWorkspace },
                            React.createElement(Icon, { name: "folder" }),
                            React.createElement("span", null, "\u67E5\u770B\u9879\u76EE\u4EE3\u7801\u4E0E\u914D\u7F6E"),
                            React.createElement(Icon, { name: "arrow" }))),
                    React.createElement("p", { className: "small muted" }, "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u7684\u5F15\u5BFC\u754C\u9762\uFF0C\u4E0D\u662F\u6A21\u578B\u751F\u6210\u7684\u7814\u7A76\u7ED3\u679C\u3002")) : messages.map(m => React.createElement("article", { className: 'message message-' + m.role, key: m.id },
                    React.createElement("div", { className: "message-avatar" }, m.role === 'user' ? '我' : m.role === 'assistant' ? 'π' : '·'),
                    React.createElement("div", { className: "message-body" },
                        React.createElement("div", { className: "message-meta" },
                            React.createElement("strong", null, m.role === 'user' ? '你' : m.role === 'assistant' ? (m.wakeupId ? 'Pi · 结果分析' : 'Pi') : (m.wakeupId ? '持久化结果通知' : '工作台状态通知')),
                            React.createElement("span", null, date(m.createdAt)),
                            m.status === 'failed' || m.status === 'cancelled' ? React.createElement(Badge, { value: m.status }) : null),
                        React.createElement("div", { className: "prose-text" }, m.content || '（本次响应没有可展示的文本）'),
                        m.error ? React.createElement("p", { className: "error-text" }, m.error) : null,
                        React.createElement("div", { className: "message-tools" },
                            React.createElement("button", { onClick: () => this.props.perform(async () => { const fork = await api(`/sessions/${session.id}/branch`, { messageId: m.id }); return fork; }, '已创建对话分支；实验记录保持不变') }, "\u4ECE\u6B64\u5904\u5206\u652F"),
                            m.role === 'user' && ['failed', 'cancelled'].includes(m.status) ? React.createElement("button", { onClick: () => this.props.perform(() => api(`/sessions/${session.id}/retry`, { messageId: m.id })) }, "\u91CD\u8BD5\u6B64\u6D88\u606F") : null)))),
                React.createElement(WakeupPanel, { data: data, busy: false, sessionId: session?.id, perform: this.props.perform, onSession: this.props.onSession }),
                this.props.stream ? React.createElement("article", { className: "message" },
                    React.createElement("div", { className: "message-avatar" }, "\u03C0"),
                    React.createElement("div", { className: "message-body" },
                        React.createElement("div", { className: "message-meta" }, "Pi \u00B7 \u6D41\u5F0F\u8F93\u51FA\uFF0C\u7B49\u5F85\u6700\u7EC8\u6D88\u606F"),
                        React.createElement("div", { className: "prose-text" }, this.props.stream))) : null),
            React.createElement("div", { className: "composer-wrap" },
                React.createElement("form", { className: "composer", onSubmit: (e) => {
                        e.preventDefault();
                        if (!session || !this.state.draft.trim())
                            return;
                        const content = this.state.draft;
                        this.props.perform(async () => { await api(`/sessions/${session.id}/messages`, { content, mode: this.state.mode }); this.setState({ draft: '' }); });
                    } },
                    React.createElement("textarea", { "aria-label": "\u7814\u7A76\u95EE\u9898", placeholder: canSend ? '描述研究问题，或发消息引导当前任务…' : '配置 Pi 供应商和模型后，在这里开始研究…', value: this.state.draft, onChange: (e) => this.setState({ draft: e.target.value }), onKeyDown: (e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                e.currentTarget.form.requestSubmit();
                            }
                        } }),
                    React.createElement("div", { className: "composer-toolbar" },
                        React.createElement("select", { "aria-label": "\u6D88\u606F\u65B9\u5F0F", value: this.state.mode, onChange: (e) => this.setState({ mode: e.target.value }) },
                            React.createElement("option", { value: "prompt" }, "\u666E\u901A\u6D88\u606F"),
                            React.createElement("option", { value: "steer" }, "\u5F15\u5BFC\u5F53\u524D\u4EFB\u52A1"),
                            React.createElement("option", { value: "follow_up" }, "\u5F53\u524D\u7ED3\u675F\u540E\u6267\u884C")),
                        React.createElement("span", { className: "small muted" }, data.project.settings.enabled ? '按需协作已开启' : '单智能体模式'),
                        React.createElement("div", { className: "grow" }),
                        session?.state === 'running' ? React.createElement("button", { type: "button", className: "secondary compact", onClick: () => this.props.perform(() => api(`/sessions/${session.id}/interrupt`, {}), '已停止 Agent；正式实验未取消') },
                            React.createElement(Icon, { name: "stop", size: 14 }),
                            "\u505C\u6B62 Agent") : null,
                        React.createElement("button", { className: "primary compact", disabled: !canSend || !this.state.draft.trim() || !session },
                            React.createElement(Icon, { name: "arrow", size: 16 }),
                            "\u53D1\u9001"))),
                React.createElement("div", { className: "composer-caption" },
                    "\u56FA\u5B9A\u5FEB\u7167 \u00B7 \u663E\u5F0F\u5BA1\u6279 \u00B7 \u53EF\u8FFD\u6EAF\u8BC1\u636E ",
                    React.createElement("span", null, "Ctrl + Enter \u53D1\u9001"))));
    }
}
export function Experiments({ data, selected, onSelect, onCreate, onChild, onRun }) {
    const roots = data.experiments.filter(e => !e.parentId);
    const tree = (e, depth = 0) => React.createElement("div", { className: "experiment-branch", key: e.id },
        React.createElement("button", { className: 'experiment-node ' + (selected === e.id ? 'selected' : ''), style: { marginLeft: Math.min(depth, 6) * 20 }, onClick: () => onSelect(e.id) },
            React.createElement("span", { className: "node-symbol" },
                React.createElement(Icon, { name: e.parentId ? 'branch' : 'experiment' })),
            React.createElement("span", { className: "node-content" },
                React.createElement("strong", null, e.title),
                React.createElement("span", null,
                    short(e.id),
                    " ",
                    React.createElement("i", null, "\u00B7"),
                    " ",
                    e.parentId ? '派生自 ' + short(e.parentId) : '固定协议的基线实验')),
            React.createElement(Badge, { value: e.lifecycle })),
        data.experiments.filter(c => c.parentId === e.id).map(c => tree(c, depth + 1)));
    const measured = comparableRuns(data, selected);
    const metric = comparisonMetric(data, selected);
    const max = Math.max(...measured.map(r => Math.abs(r.metrics[metric.key])), 0.000001);
    return React.createElement("div", { className: "page-scroll" },
        React.createElement(SectionTitle, { title: "\u5B9E\u9A8C\u4E0E\u8FD0\u884C", sub: "\u5B9E\u9A8C\u8840\u7F18\u3001\u56FA\u5B9A\u534F\u8BAE\u4E0E\u771F\u5B9E\u89C2\u6D4B\uFF0C\u59CB\u7EC8\u5206\u5F00\u8BB0\u5F55\u3002" },
            React.createElement("button", { className: "primary", onClick: onCreate },
                React.createElement(Icon, { name: "plus", size: 16 }),
                "\u65B0\u5EFA\u5B9E\u9A8C")),
        React.createElement("div", { className: "section-kpis" },
            React.createElement("div", null,
                React.createElement("strong", null, data.experiments.length.toString().padStart(2, '0')),
                React.createElement("span", null, "\u5B9E\u9A8C\u8282\u70B9")),
            React.createElement("div", null,
                React.createElement("strong", null, data.runs.length.toString().padStart(2, '0')),
                React.createElement("span", null, "\u6B63\u5F0F\u8FD0\u884C")),
            React.createElement("div", null,
                React.createElement("strong", null, data.runs.filter(r => r.integrity === 'complete').length.toString().padStart(2, '0')),
                React.createElement("span", null, "\u5B8C\u6574\u7ED3\u679C")),
            React.createElement("div", null,
                React.createElement("strong", null, data.evidence.length.toString().padStart(2, '0')),
                React.createElement("span", null, "\u8BC1\u636E\u8BB0\u5F55"))),
        React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u5B9E\u9A8C\u8840\u7F18"),
                React.createElement("span", { className: "small muted" }, "\u5206\u652F\u4FDD\u5B58\u7814\u7A76\u53D8\u5316\uFF0C\u4E0D\u81EA\u52A8\u5408\u5E76\u5019\u9009")),
            roots.length ? React.createElement("div", { className: "experiment-tree" }, roots.map(e => tree(e))) : React.createElement(Empty, { title: "\u8FD8\u6CA1\u6709\u5B9E\u9A8C\u8282\u70B9" },
                React.createElement("p", null, "\u4ECE\u9879\u76EE\u6E90\u7801\u5EFA\u7ACB\u57FA\u7EBF\u3002\u65B9\u6848\u53D8\u5316\u540E\uFF0C\u53EF\u4ECE\u9009\u4E2D\u7684\u8282\u70B9\u6D3E\u751F\u3002"),
                React.createElement("button", { className: "secondary", onClick: onCreate }, "\u521B\u5EFA\u57FA\u7EBF\u5B9E\u9A8C"))),
        React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u8FD0\u884C\u8BB0\u5F55"),
                React.createElement("span", { className: "small muted" }, "\u9000\u51FA\u6210\u529F \u2260 \u5047\u8BBE\u6210\u7ACB")),
            data.runs.length ? React.createElement("div", { className: "table-wrap" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "\u5B9E\u9A8C / Run"),
                            React.createElement("th", null, "\u6267\u884C"),
                            React.createElement("th", null, "\u5B8C\u6574\u6027"),
                            React.createElement("th", null, "\u5B9E\u6D4B\u6307\u6807\uFF08\u6309\u8FD0\u884C\u5951\u7EA6\uFF09"))),
                    React.createElement("tbody", null, data.runs.slice().reverse().map(r => React.createElement("tr", { key: r.id, onClick: () => onSelect(r.experimentId), className: r.experimentId === selected ? 'selected-row' : '' },
                        React.createElement("td", null,
                            React.createElement("button", { className: "text-button", onClick: (event) => { event.stopPropagation(); if (onRun)
                                    onRun(r.id, r.experimentId);
                                else
                                    onSelect(r.experimentId); } },
                                data.experiments.find(e => e.id === r.experimentId)?.title,
                                " \u00B7 ",
                                short(r.id)),
                            React.createElement("small", null, date(r.createdAt))),
                        React.createElement("td", null,
                            React.createElement(Badge, { value: r.state })),
                        React.createElement("td", null,
                            React.createElement(Badge, { value: r.integrity })),
                        React.createElement("td", { className: "numeric" }, Object.entries(r.manifest.contract.metrics).map(([k, m]) => React.createElement("div", { key: k },
                            k,
                            ": ",
                            number(r.metrics?.[k]),
                            " ",
                            m.unit)))))))) : React.createElement("div", { className: "inline-empty" }, "\u51C6\u5907\u5FEB\u7167\u5E76\u83B7\u5F97\u6279\u51C6\u540E\uFF0C\u8FD0\u884C\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002")),
        measured.length ? React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u540C\u534F\u8BAE\u7ED3\u679C\u901F\u89C8"),
                React.createElement("span", { className: "small muted" },
                    metric.key,
                    " \u00B7 ",
                    metric.direction === 'max' ? '越高越好' : '越低越好',
                    " \u00B7 ",
                    metric.unit,
                    " \u00B7 \u540C\u4E00\u5951\u7EA6")),
            React.createElement("div", { className: "metric-bars" }, measured.map(r => React.createElement("div", { className: "metric-row", key: r.id },
                React.createElement("span", null, data.experiments.find(e => e.id === r.experimentId)?.title),
                React.createElement("div", { className: "metric-track" },
                    React.createElement("div", { style: { width: Math.max(0.5, Math.abs(r.metrics[metric.key]) / max * 100) + '%' } })),
                React.createElement("code", null, number(r.metrics[metric.key]))))),
            React.createElement("p", { className: "footnote" }, "\u957F\u5EA6\u8868\u793A\u7EDD\u5BF9\u503C\uFF0C\u4EC5\u4F5C\u6570\u503C\u901F\u89C8\uFF1B\u4F18\u52A3\u7531\u6307\u6807\u65B9\u5411\u53CA\u5B8C\u6574\u8BC1\u636E\u5224\u65AD\u3002\u4E0D\u540C\u5951\u7EA6\u4E0D\u6DF7\u6BD4\uFF0C\u6267\u884C\u6210\u529F\u4E0D\u7B49\u4E8E\u5047\u8BBE\u6210\u7ACB\u3002")) : null);
}
export function OutcomeReview({ run, perform }) {
    if (!['succeeded', 'failed', 'cancelled'].includes(run.state))
        return null;
    const disposition = run.answerDisposition ?? (run.metrics ? 'answered' : run.state === 'cancelled' && !run.startedAt ? 'unanswered' : 'needs_review');
    if (disposition !== 'needs_review')
        return React.createElement("p", { className: "small muted" },
            "\u95EE\u9898\u56DE\u7B54\u72B6\u6001\uFF1A",
            disposition === 'answered' ? '已有结果，源码受保护' : '用户确认未回答，可准备有界修复');
    const review = (disposition) => { const reason = prompt('先检查日志与原始产物，再说明此次运行是否回答研究问题：'); if (reason)
        void perform(() => api(`/runs/${run.id}/outcome-review`, { expectedVersion: run.version, disposition, reason }), '已保存结果评议；不会自动启动计算'); };
    return React.createElement("div", { className: "approval-card" },
        React.createElement("h4", null, "\u6B64\u6B21\u8FD0\u884C\u662F\u5426\u56DE\u7B54\u7814\u7A76\u95EE\u9898\uFF1F"),
        React.createElement("p", { className: "small" }, "\u65E0\u6709\u6548\u6570\u503C\u4E0D\u4E00\u5B9A\u8868\u793A\u6CA1\u6709\u7814\u7A76\u7ED3\u679C\u3002\u8BF7\u7ED3\u5408\u5047\u8BBE\u4E0E\u771F\u5B9E\u65E5\u5FD7\u5224\u65AD\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u4FEE\u6539\u6267\u884C\u72B6\u6001\u3001\u4EA7\u7269\u5B8C\u6574\u6027\u6216\u5047\u8BBE\u7ED3\u8BBA\u3002"),
        React.createElement("div", { className: "stack-actions" },
            React.createElement("button", { className: "secondary", onClick: () => review('unanswered') }, "\u672A\u56DE\u7B54\uFF1A\u5141\u8BB8\u51C6\u5907\u4FEE\u590D"),
            React.createElement("button", { className: "secondary", onClick: () => review('answered') }, "\u5DF2\u56DE\u7B54\uFF1A\u51BB\u7ED3\u8282\u70B9")));
}
class RunFiles extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { stream: 'stdout', logs: '', cursor: 0, logComplete: false, logLoading: false, logError: '', artifactId: '', artifactContent: '', artifactLoading: false, artifactError: '', files: [], sourceLoaded: false, sourcePath: '', sourceContent: '', sourceCursor: 0, sourceComplete: false, sourceLoading: false, sourceError: '', gitCommit: this.props.run.manifest.gitCommit ?? '' };
        this.logEpoch = 0;
        this.sourceEpoch = 0;
        this.artifactEpoch = 0;
    }
    componentDidMount() { void this.loadLogs(); this.timer = window.setInterval(() => { if (!this.state.logComplete)
        void this.loadLogs(); }, 1500); }
    componentWillUnmount() { clearInterval(this.timer); this.logEpoch++; this.sourceEpoch++; this.artifactEpoch++; }
    async loadLogs() {
        if (this.state.logLoading)
            return;
        const epoch = this.logEpoch, { stream, cursor } = this.state;
        this.setState({ logLoading: true, logError: '' });
        try {
            const page = await api(`/runs/${this.props.run.id}/logs?stream=${stream}&cursor=${cursor}`);
            if (epoch === this.logEpoch)
                this.setState({ logs: this.state.logs + page.content, cursor: page.cursor, logComplete: page.complete });
        }
        catch (error) {
            if (epoch === this.logEpoch)
                this.setState({ logError: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (epoch === this.logEpoch)
                this.setState({ logLoading: false });
        }
    }
    selectStream(stream) { this.logEpoch++; this.setState({ stream, logs: '', cursor: 0, logComplete: false, logLoading: false, logError: '' }, () => void this.loadLogs()); }
    async openArtifact(id) {
        const epoch = ++this.artifactEpoch;
        this.setState({ artifactId: id, artifactContent: '', artifactLoading: true, artifactError: '' });
        try {
            const content = await artifactText(id);
            if (content.includes('\0'))
                throw Error('二进制产物请下载查看。');
            if (epoch === this.artifactEpoch)
                this.setState({ artifactContent: content.length > 65536 ? content.slice(0, 65536) + '\n…预览到此，下载可查看完整文件。' : content });
        }
        catch (error) {
            if (epoch === this.artifactEpoch)
                this.setState({ artifactError: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (epoch === this.artifactEpoch)
                this.setState({ artifactLoading: false });
        }
    }
    sourceOperation(name, input) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input: { runId: this.props.run.id, ...input } }); }
    async loadSource() {
        const epoch = ++this.sourceEpoch;
        this.setState({ sourceLoading: true, sourceError: '' });
        try {
            const result = await this.sourceOperation('run_source_list', {});
            if (result.sourceDigest !== this.props.run.manifest.snapshotDigest)
                throw Error('源码摘要与所选运行不一致。');
            if (epoch === this.sourceEpoch)
                this.setState({ files: result.files, sourceLoaded: true, gitCommit: result.gitCommit ?? '' });
        }
        catch (error) {
            if (epoch === this.sourceEpoch)
                this.setState({ sourceError: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (epoch === this.sourceEpoch)
                this.setState({ sourceLoading: false });
        }
    }
    async readSource(path, append = false) {
        if (append && this.state.sourceLoading)
            return;
        const epoch = ++this.sourceEpoch, cursor = append ? this.state.sourceCursor : 0;
        this.setState({ sourceLoading: true, sourceError: '', sourcePath: path, ...(!append ? { sourceContent: '', sourceCursor: 0, sourceComplete: false } : {}) });
        try {
            const result = await this.sourceOperation('run_source_read', { path, cursor, limit: 16000 });
            if (result.sourceDigest !== this.props.run.manifest.snapshotDigest)
                throw Error('源码摘要与所选运行不一致。');
            if (epoch === this.sourceEpoch)
                this.setState({ sourceContent: (append ? this.state.sourceContent : '') + result.content, sourceCursor: result.end, sourceComplete: result.complete });
        }
        catch (error) {
            if (epoch === this.sourceEpoch)
                this.setState({ sourceError: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (epoch === this.sourceEpoch)
                this.setState({ sourceLoading: false });
        }
    }
    render() {
        const { run, data, perform } = this.props, artifacts = run.artifactIds.map(id => data.artifacts.find(a => a.id === id)).filter(a => !!a), file = this.state.files.find(f => f.path === this.state.sourcePath);
        return React.createElement("div", null,
            React.createElement("details", { open: true },
                React.createElement("summary", null, "\u771F\u5B9E\u8FD0\u884C\u65E5\u5FD7"),
                React.createElement("label", null,
                    "\u65E5\u5FD7\u6D41",
                    React.createElement("select", { "aria-label": "\u65E5\u5FD7\u6D41", value: this.state.stream, onChange: (e) => this.selectStream(e.target.value) },
                        React.createElement("option", { value: "stdout" }, "\u6807\u51C6\u8F93\u51FA stdout"),
                        React.createElement("option", { value: "stderr" }, "\u9519\u8BEF\u8F93\u51FA stderr"))),
                React.createElement("pre", { className: "logs", "aria-label": `${this.state.stream} 日志` }, this.state.logs || (this.state.logLoading ? '读取日志…' : '此流暂无内容。')),
                this.state.logError ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.logError) : null,
                React.createElement("button", { className: "secondary compact", disabled: this.state.logLoading || this.state.logComplete, onClick: () => void this.loadLogs() }, this.state.logLoading ? '正在读取…' : this.state.logComplete ? '已读至日志结尾' : '加载后续日志'),
                React.createElement("p", { className: "small muted" },
                    "\u5DF2\u8BFB\u53D6 ",
                    this.state.cursor,
                    " \u5B57\u8282\uFF1B\u8FD0\u884C\u671F\u95F4\u81EA\u52A8\u7EE7\u7EED\u8BFB\u53D6\u3002")),
            React.createElement("details", { open: true },
                React.createElement("summary", null, "\u539F\u59CB\u6307\u6807\u4E0E\u4EA7\u7269"),
                artifacts.length ? React.createElement("ul", null, artifacts.map(a => React.createElement("li", { key: a.id },
                    React.createElement("button", { className: "text-button", onClick: () => void this.openArtifact(a.id) }, a.title),
                    React.createElement("button", { className: "text-button", "aria-label": `下载 ${a.title}`, onClick: () => perform(() => downloadArtifact(a.id, a.title)) }, "\u4E0B\u8F7D"),
                    React.createElement("small", { className: "muted" },
                        a.size,
                        " \u5B57\u8282 \u00B7 ",
                        short(a.digest))))) : React.createElement("p", { className: "small muted" }, "\u5C1A\u65E0\u5F52\u6863\u4EA7\u7269\u3002\u6267\u884C\u7ED3\u675F\u540E\u5728\u8FD9\u91CC\u67E5\u770B\u539F\u59CB metrics.json \u4E0E\u8F93\u51FA\u6587\u4EF6\u3002"),
                this.state.artifactLoading ? React.createElement("p", { role: "status" }, "\u8BFB\u53D6\u4EA7\u7269\u2026") : null,
                this.state.artifactError ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.artifactError) : null,
                this.state.artifactId && !this.state.artifactLoading && !this.state.artifactError ? React.createElement("pre", { className: "logs", "aria-label": "\u539F\u59CB\u4EA7\u7269\u5185\u5BB9" }, this.state.artifactContent || '（空文件）') : null),
            React.createElement("details", null,
                React.createElement("summary", null, "\u672C\u6B21\u8FD0\u884C\u7684\u56FA\u5B9A\u6E90\u7801"),
                React.createElement("p", { className: "small muted" },
                    "\u5B9E\u9A8C\u4FEE\u8BA2 v",
                    run.manifest.experimentRevision,
                    " \u00B7 \u6E90\u7801 SHA-256"),
                React.createElement("code", { className: "digest" }, run.manifest.snapshotDigest),
                this.state.gitCommit ? React.createElement("p", null,
                    "Git commit ",
                    React.createElement("code", { className: "digest" }, this.state.gitCommit)) : null,
                React.createElement("button", { className: "secondary compact", disabled: this.state.sourceLoading, onClick: () => void this.loadSource() }, "\u8BFB\u53D6\u8FD0\u884C\u6E90\u7801\u6E05\u5355"),
                this.state.sourceLoaded ? React.createElement("label", null,
                    "\u56FA\u5B9A\u6E90\u7801\u6587\u4EF6",
                    React.createElement("select", { "aria-label": "\u56FA\u5B9A\u6E90\u7801\u6587\u4EF6", value: this.state.sourcePath, onChange: (e) => { if (e.target.value)
                            void this.readSource(e.target.value); } },
                        React.createElement("option", { value: "" }, "\u9009\u62E9\u6587\u4EF6"),
                        this.state.files.map(f => React.createElement("option", { key: f.path, value: f.path },
                            f.path,
                            " \u00B7 ",
                            f.size,
                            " \u5B57\u8282")))) : null,
                this.state.sourceError ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.sourceError) : null,
                file ? React.createElement("div", null,
                    React.createElement("p", { className: "small muted" },
                        file.path,
                        " \u00B7 ",
                        file.mode ?? '旧版未记录模式'),
                    React.createElement("code", { className: "digest" }, file.digest),
                    React.createElement("pre", { className: "logs", "aria-label": "\u56FA\u5B9A\u8FD0\u884C\u6E90\u7801" }, this.state.sourceContent || (this.state.sourceLoading ? '读取源码…' : '（空文件）')),
                    React.createElement("button", { className: "secondary compact", disabled: this.state.sourceLoading || this.state.sourceComplete, onClick: () => void this.readSource(file.path, true) }, this.state.sourceComplete ? '源码已完整读取' : '读取后续源码')) : null));
    }
}
export class Inspector extends React.Component {
    currentRun() { const runs = this.props.data.runs.filter(r => r.experimentId === this.props.experiment?.id); return runs.find(r => r.id === this.props.selectedRun) ?? runs[runs.length - 1]; }
    render() {
        const { data, boot, experiment: e, perform } = this.props;
        const teams = data.teams.slice().reverse();
        const team = teams[0];
        const tasks = team ? data.tasks.filter(t => t.teamId === team.id) : [];
        const budget = data.budgets.find(b => b.teamId === team?.id);
        const run = this.currentRun();
        const intents = data.intents.filter(i => i.experimentId === e?.id), intent = intents[intents.length - 1], approval = data.approvals.find(a => a.id === intent?.approvalId);
        const pendingTeams = data.approvals.filter(a => a.subjectKind === 'team' && a.status === 'pending');
        return React.createElement("aside", { className: "inspector" },
            React.createElement("div", { className: "inspector-title" },
                React.createElement(Icon, { name: this.props.tab === 'experiments' ? 'experiment' : 'branch' }),
                React.createElement("h2", null, this.props.tab === 'experiments' ? '实验详情' : '协作空间'),
                React.createElement("span", { className: "small muted" }, "\u672C\u5730")),
            this.props.tab === 'experiments' && e ? React.createElement("div", { className: "inspector-section" },
                React.createElement("div", { className: "detail-title" },
                    React.createElement("h3", null, e.title),
                    React.createElement("div", { "data-testid": "selected-experiment-state" },
                        React.createElement(Badge, { value: e.lifecycle }))),
                React.createElement("p", { className: "detail-hypothesis" }, e.hypothesis),
                React.createElement("dl", { className: "details" },
                    React.createElement("dt", null, "\u5B9E\u9A8C ID"),
                    React.createElement("dd", null,
                        React.createElement("code", null, short(e.id))),
                    React.createElement("dt", null, "\u65B9\u6848\u4FEE\u8BA2"),
                    React.createElement("dd", null,
                        "v",
                        e.revision),
                    React.createElement("dt", null, "\u56FA\u5B9A\u5165\u53E3"),
                    React.createElement("dd", null,
                        React.createElement("code", null, e.contract.command.join(' '))),
                    React.createElement("dt", null, "\u8BA1\u7B97\u65B9\u5F0F"),
                    React.createElement("dd", null, e.contract.runner === 'trusted-example' ? '受信本地数值示例' : 'Docker · 固定镜像隔离运行'),
                    React.createElement("dt", null, "\u6570\u636E\u7248\u672C"),
                    React.createElement("dd", null, e.contract.datasetVersion)),
                React.createElement("div", { className: "stack-actions" },
                    React.createElement("button", { className: "primary", onClick: this.props.onPrepare, disabled: !!(intent?.status === 'prepared' && approval?.status === 'pending' && intent.manifest.experimentRevision === e.revision) },
                        React.createElement(Icon, { name: "run", size: 15 }),
                        "\u51C6\u5907\u8FD0\u884C"),
                    React.createElement("div", { className: "actions" },
                        React.createElement("button", { className: "secondary", onClick: this.props.onChild },
                            React.createElement(Icon, { name: "branch", size: 15 }),
                            "\u6D3E\u751F\u5B50\u5B9E\u9A8C"),
                        React.createElement("button", { className: "secondary", onClick: this.props.onConfig }, "\u67E5\u770B\u914D\u7F6E"))),
                intent?.status === 'prepared' && approval ? React.createElement("div", { className: "approval-card" },
                    React.createElement("div", { className: "small-label" }, "\u6B63\u5F0F\u8FD0\u884C\u5BA1\u6279"),
                    React.createElement(Badge, { value: approval.status }),
                    React.createElement("p", null, "\u6B64\u6279\u51C6\u53EA\u6388\u6743\u5F53\u524D\u56FA\u5B9A\u5FEB\u7167\u4E0E\u8BA1\u7B97\u5951\u7EA6\u3002"),
                    React.createElement("code", { className: "digest" },
                        intent.manifest.snapshotDigest.slice(0, 20),
                        "\u2026"),
                    React.createElement("dl", { className: "details" },
                        React.createElement("dt", null, "\u6267\u884C\u53C2\u6570"),
                        React.createElement("dd", null,
                            React.createElement("code", null, JSON.stringify(intent.manifest.contract.command))),
                        React.createElement("dt", null, "\u955C\u50CF"),
                        React.createElement("dd", null,
                            React.createElement("code", null, intent.manifest.contract.image ?? '受信示例')),
                        React.createElement("dt", null, "\u8D44\u6E90"),
                        React.createElement("dd", null,
                            intent.manifest.contract.cpus,
                            " CPU \u00B7 ",
                            intent.manifest.contract.memoryMb,
                            " MiB \u00B7 ",
                            intent.manifest.contract.timeoutSeconds,
                            " \u79D2"),
                        React.createElement("dt", null, "\u5FC5\u9700\u4EA7\u7269"),
                        React.createElement("dd", null, intent.manifest.contract.expectedArtifacts.join('、'))),
                    approval.status === 'pending' ? React.createElement("div", { className: "stack-actions" },
                        React.createElement("button", { className: "primary", onClick: () => perform(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }); const submitted = await api(`/run-intents/${intent.id}/submit`, {}); this.props.onRun?.(submitted.id); }, '已提交真实运行') }, "\u6279\u51C6\u5E76\u63D0\u4EA4"),
                        React.createElement("button", { className: "text-button", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false }), '已拒绝运行') }, "\u62D2\u7EDD")) : approval.status === 'approved' ? React.createElement("button", { className: "primary", onClick: () => perform(async () => { const submitted = await api(`/run-intents/${intent.id}/submit`, {}); this.props.onRun?.(submitted.id); }) }, "\u63D0\u4EA4\u5DF2\u6279\u51C6\u8FD0\u884C") : null) : null,
                run ? React.createElement("div", { className: "run-detail" },
                    React.createElement("label", null,
                        "\u67E5\u770B\u8FD0\u884C",
                        React.createElement("select", { "aria-label": "\u67E5\u770B\u8FD0\u884C", value: run.id, onChange: (event) => this.props.onRun?.(event.target.value) }, data.runs.filter(r => r.experimentId === e.id).slice().reverse().map(r => React.createElement("option", { key: r.id, value: r.id },
                            date(r.createdAt),
                            " \u00B7 ",
                            short(r.id),
                            " \u00B7 ",
                            label(r.state))))),
                    React.createElement("h4", null,
                        "\u8FD0\u884C ",
                        React.createElement("code", null, short(run.id))),
                    run.execution ? React.createElement("dl", { className: "details" },
                        React.createElement("dt", null, "Docker context"),
                        React.createElement("dd", null, run.execution.dockerContext),
                        React.createElement("dt", null, "\u5B9E\u9645\u955C\u50CF ID"),
                        React.createElement("dd", null,
                            React.createElement("code", { className: "digest" }, run.execution.imageId ?? '等待容器预检'))) : null,
                    React.createElement("div", { className: "actions" },
                        React.createElement(Badge, { value: run.state }),
                        React.createElement(Badge, { value: run.integrity })),
                    run.metrics ? React.createElement("dl", { className: "details" }, Object.entries(run.metrics).map(([k, v]) => React.createElement("div", { className: "detail-pair", key: k },
                        React.createElement("dt", null, k),
                        React.createElement("dd", { className: "numeric" }, number(v))))) : null,
                    React.createElement(OutcomeReview, { run: run, perform: perform }),
                    React.createElement("p", { className: "small muted" },
                        "\u79D1\u7814\u5224\u65AD\uFF1A",
                        run.judgment === 'pending' ? '尚未判定' : run.judgment),
                    run.error ? React.createElement("p", { className: "error-text" }, run.error) : null,
                    ['queued', 'running', 'submitting'].includes(run.state) ? React.createElement("button", { className: "danger-outline", onClick: () => perform(() => api(`/runs/${run.id}/cancel`, {}), '已请求取消指定实验') }, "\u53D6\u6D88\u8FD9\u4E2A\u5B9E\u9A8C") : null,
                    React.createElement(RunFiles, { key: run.id, run: run, data: data, perform: perform })) : null) : null,
            React.createElement("div", { className: "inspector-section" },
                React.createElement("div", { className: "toggle-heading" },
                    React.createElement("div", null,
                        React.createElement("h3", null, "\u591A\u667A\u80FD\u4F53\u534F\u4F5C"),
                        React.createElement("p", { className: "small muted" }, "\u6309\u9700\u5206\u5DE5\uFF0C\u72EC\u7ACB\u9A8C\u6536")),
                    React.createElement("button", { role: "switch", "aria-label": "\u591A\u667A\u80FD\u4F53\u534F\u4F5C", "aria-checked": data.project.settings.enabled ? 'true' : 'false', className: 'switch ' + (data.project.settings.enabled ? 'on' : ''), onClick: this.props.onToggle },
                        React.createElement("span", null))),
                React.createElement("p", { className: "small muted" }, "\u5F00\u542F\u53EA\u5141\u8BB8\u59D4\u6D3E\uFF0C\u4E0D\u6269\u5927\u8BA1\u7B97\u3001\u5408\u5E76\u6216\u53D1\u5E03\u6743\u9650\u3002"),
                React.createElement("div", { className: "limits" },
                    React.createElement("span", null,
                        "\u52A9\u624B\u4E0A\u9650 ",
                        React.createElement("b", null, data.project.settings.maxConcurrentAssistants)),
                    React.createElement("span", null,
                        "\u6B63\u5F0F\u8FD0\u884C ",
                        React.createElement("b", null, "1"))),
                React.createElement("button", { className: "secondary full", onClick: this.props.onTeam, disabled: !data.project.settings.enabled },
                    React.createElement(Icon, { name: "plus", size: 15 }),
                    "\u521B\u5EFA\u534F\u4F5C\u8BA1\u5212")),
            pendingTeams.map(a => React.createElement("div", { className: "inspector-section", key: a.id },
                React.createElement("div", { className: "small-label" }, "\u5F85\u6279\u51C6\u7684\u534F\u4F5C\u8BA1\u5212"),
                React.createElement("h3", null, data.teams.find(t => t.id === a.subjectId)?.goal),
                React.createElement("p", { className: "small muted" }, a.reason),
                React.createElement("button", { className: "primary full", onClick: () => perform(async () => { await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }); await api(`/teams/${a.subjectId}/activate`, {}); }, '协作计划已批准') }, "\u6279\u51C6\u5E76\u542F\u52A8\u534F\u4F5C"),
                React.createElement("button", { className: "text-button", onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false })) }, "\u62D2\u7EDD\u6B64\u8BA1\u5212"))),
            team ? React.createElement("div", { className: "inspector-section" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h3", null, "\u5F53\u524D\u56E2\u961F"),
                    React.createElement(Badge, { value: team.state })),
                React.createElement("p", { className: "team-goal" }, team.goal),
                team.blockReason ? React.createElement("p", { className: "inline-warning" }, team.blockReason) : null,
                team.state === 'active' && !boot.runtime.ready ? React.createElement("p", { className: "inline-warning" }, "\u5C1A\u672A\u542F\u52A8\u52A9\u624B\uFF1APi \u672A\u5C31\u7EEA\u3002\u4EFB\u52A1\u4ECD\u4FDD\u5B58\u5728\u961F\u5217\u4E2D\uFF0C\u6CA1\u6709\u6A21\u62DF\u6267\u884C\u3002") : null,
                React.createElement("div", { className: "team-progress" },
                    React.createElement("strong", null,
                        tasks.filter(t => t.acceptance === 'accepted').length,
                        React.createElement("span", null,
                            " / ",
                            tasks.length)),
                    React.createElement("span", null, "\u4EFB\u52A1\u5DF2\u9A8C\u6536")),
                tasks.map(t => React.createElement("div", { className: "task-card", key: t.id },
                    React.createElement("div", { className: "task-top" },
                        React.createElement("div", { className: 'role-mark role-' + t.role }, label(t.role).slice(0, 1)),
                        React.createElement("div", null,
                            React.createElement("strong", null,
                                label(t.role),
                                " ",
                                React.createElement("code", null, t.key)),
                            React.createElement("span", null, label(t.execution)))),
                    React.createElement("p", null, t.objective),
                    React.createElement("div", { className: "task-footer" },
                        React.createElement("span", null,
                            "\u9A8C\u6536\uFF1A",
                            label(t.acceptance)),
                        React.createElement("span", null, t.reviewOf ? '审查 ' + t.reviewOf : t.dependencies.length ? '依赖 ' + t.dependencies.join(', ') : '无前置依赖')),
                    t.blockReason ? React.createElement("p", { className: "small error-text" }, t.blockReason) : null,
                    ['running', 'pending'].includes(t.execution) ? React.createElement("button", { className: "text-button danger", onClick: () => perform(() => api(`/tasks/${t.id}/cancel`, {})) }, "\u505C\u6B62\u6B64\u52A9\u624B") : null,
                    ['failed', 'cancelled', 'blocked'].includes(t.execution) ? React.createElement("button", { className: "text-button", onClick: () => perform(() => api(`/tasks/${t.id}/retry`, {})) }, "\u65B0\u5C1D\u8BD5\u91CD\u8BD5") : null,
                    t.result ? React.createElement("details", null,
                        React.createElement("summary", null, "\u7ED3\u679C\u4E0E\u9650\u5236"),
                        React.createElement("p", { className: "small prose-text" }, t.result.summary)) : null,
                    t.execution === 'output_submitted' && ['pending', 'rejected', 'disputed'].includes(t.acceptance) ? React.createElement("button", { className: "text-button", onClick: () => {
                            const reason = prompt('人工审查依据（将保留记录）');
                            if (reason)
                                perform(() => api(`/tasks/${t.id}/manual-review`, { verdict: 'accepted', reason }));
                        } }, "\u4EBA\u5DE5\u786E\u8BA4\u9A8C\u6536") : null)),
                budget ? React.createElement("div", { className: "budget-note" },
                    "\u5C1D\u8BD5\u989D\u5EA6\uFF1A",
                    budget.used,
                    " \u5DF2\u7ED3\u7B97 / ",
                    budget.reserved,
                    " \u5DF2\u9884\u7559 / ",
                    budget.unknown,
                    " \u5F85\u5BF9\u8D26",
                    React.createElement("br", null),
                    "\u603B\u989D\u5EA6 ",
                    budget.limit,
                    " \u6B21\u3002\u6B64\u989D\u5EA6\u4E0D\u662F\u4F9B\u5E94\u5546\u8D26\u5355\u4E0A\u9650\u3002") : null,
                React.createElement("div", { className: "actions wrap" },
                    team.state === 'active' ? React.createElement("button", { className: "secondary compact", onClick: () => perform(() => api(`/teams/${team.id}/pause`, {})) }, "\u6682\u505C\u5206\u914D") : null,
                    team.state === 'paused' ? React.createElement("button", { className: "secondary compact", onClick: () => perform(() => api(`/teams/${team.id}/resume`, {})) }, "\u6062\u590D") : null,
                    React.createElement("button", { className: "secondary compact", onClick: () => this.props.onDirective(team.id) }, "\u5F15\u5BFC / \u6539\u53D8\u76EE\u6807"))) : React.createElement("div", { className: "inspector-section muted small" }, "\u534F\u4F5C\u8BA1\u5212\u3001\u52A9\u624B\u72B6\u6001\u4E0E\u5BA1\u67E5\u7ED3\u679C\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002\u4E0D\u4F1A\u4E3A\u5C55\u793A\u6548\u679C\u81EA\u52A8\u521B\u5EFA Agent\u3002"),
            React.createElement("div", { className: "inspector-footer" },
                React.createElement("span", { className: "status-dot" }),
                "\u6240\u6709\u7ED3\u679C\u5199\u5165\u672C\u5730\u6570\u636E\u5E93"));
    }
}
