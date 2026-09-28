import { api, artifactText, downloadArtifact } from './api.js';
import { short, label } from './models.js';
import { SectionTitle, Badge, Empty } from './ui.js';
const op = (projectId, sessionId, name, input = {}) => api(`/operations/${name}`, { projectId, sessionId, input });
const message = (error) => error instanceof Error ? error.message : String(error);
class PrivateWorkspace extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { git: null, diff: null, files: [], path: '', content: '', digest: null, dirty: false, error: '' };
        this.mounted = true;
        this.reading = 0;
        this.polling = false;
    }
    componentDidMount() { void this.poll(); this.timer = window.setInterval(() => void this.poll(), 2000); }
    componentWillUnmount() { this.mounted = false; this.reading++; clearInterval(this.timer); }
    call(name, input = {}) { return op(this.props.projectId, this.props.session.id, name, input); }
    async poll() { if (this.polling)
        return; this.polling = true; try {
        const git = await this.call('workspace_history_inspect');
        const files = await this.call('workspace_list', { source: 'session' });
        const diff = git.state === 'ready' ? await this.call('workspace_history_diff') : null;
        if (this.mounted) {
            this.setState({ git, files, diff, error: '' });
            this.props.onReady(git.state === 'ready');
        }
    }
    catch (error) {
        if (this.mounted) {
            this.setState({ error: message(error) });
            this.props.onReady(false);
        }
    }
    finally {
        this.polling = false;
    } }
    async open(path) { if (this.state.dirty && !confirm('有未保存的私有源码，放弃后切换文件？'))
        return; const seq = ++this.reading; await this.props.perform(async () => { const file = await this.call('workspace_read', { source: 'session', path }); if (this.mounted && seq === this.reading) {
        this.setState({ path, content: file.content, digest: file.digest, dirty: false });
        this.props.onDirty(false);
    } }); }
    render() {
        const { git, diff } = this.state, ready = git?.state === 'ready', { session, perform, busy } = this.props;
        return React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u79C1\u6709\u6E90\u7801\u4E0E Git"),
                git ? React.createElement(Badge, { value: git.state }) : React.createElement("span", null, "\u8BFB\u53D6\u72B6\u6001\u2026")),
            React.createElement("p", { className: "small muted" },
                "\u4F1A\u8BDD ",
                short(session.id),
                " \u00B7 \u6765\u6E90 ",
                short(session.sourceRevisionId),
                "\u3002\u8FD9\u91CC\u53EA\u7F16\u8F91\u6240\u9009\u4F1A\u8BDD\uFF0C\u9879\u76EE\u521D\u59CB\u6587\u4EF6\u4FDD\u6301\u539F\u6837\u3002"),
            git?.head ? React.createElement("code", { className: "digest" },
                "HEAD ",
                git.head) : null,
            this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
            git?.error ? React.createElement("p", { role: "alert", className: "error-text" }, git.error) : null,
            ['failed', 'conflict'].includes(git?.state) ? React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(async () => { await api(`/projects/${this.props.projectId}/git-retry`, { operationId: git.operationId }); await this.poll(); }) }, "\u6062\u590D\u6B64 Git \u64CD\u4F5C") : null,
            !ready ? React.createElement("p", { className: "notice" }, "Git \u5C31\u7EEA\u540E\u624D\u80FD\u7F16\u8F91\u3001\u63D0\u4EA4\u548C\u51C6\u5907\u6D4B\u8BD5\u3002\u5931\u8D25\u6216\u51B2\u7A81\u65F6\u4FDD\u7559\u539F\u5DE5\u4F5C\u533A\uFF0C\u8BF7\u67E5\u770B\u9519\u8BEF\u540E\u663E\u5F0F\u6062\u590D\u3002") : null,
            React.createElement("label", null,
                "\u79C1\u6709\u6E90\u7801\u6587\u4EF6",
                React.createElement("select", { "aria-label": "\u79C1\u6709\u6E90\u7801\u6587\u4EF6", value: this.state.path, onChange: (e) => { if (e.target.value)
                        void this.open(e.target.value); } },
                    React.createElement("option", { value: "" }, "\u9009\u62E9\u6587\u4EF6"),
                    this.state.files.map(f => React.createElement("option", { key: f.path, value: f.path },
                        f.path,
                        " \u00B7 ",
                        f.size,
                        " \u5B57\u8282")))),
            React.createElement("button", { className: "secondary compact", disabled: !ready || busy, onClick: () => { if (this.state.dirty && !confirm('放弃未保存内容并新建文件？'))
                    return; const path = prompt('私有文件相对路径，例如 main.py'); if (path) {
                    this.reading++;
                    this.setState({ path, content: '', digest: null, dirty: true });
                    this.props.onDirty(true);
                } } }, "\u65B0\u5EFA\u79C1\u6709\u6587\u4EF6"),
            this.state.path ? React.createElement("div", null,
                React.createElement("p", null,
                    React.createElement("code", null, this.state.path),
                    this.state.dirty ? ' · 未保存' : ''),
                React.createElement("label", null,
                    "\u79C1\u6709\u6E90\u7801\u5185\u5BB9",
                    React.createElement("textarea", { "aria-label": "\u79C1\u6709\u6E90\u7801\u5185\u5BB9", className: "code-input", rows: 14, spellCheck: false, readOnly: !ready || busy, value: this.state.content, onChange: (e) => { this.setState({ content: e.target.value, dirty: true }); this.props.onDirty(true); } })),
                React.createElement("div", { className: "actions" },
                    React.createElement("button", { className: "primary compact", disabled: !ready || busy || !this.state.dirty, onClick: () => perform(async () => { const file = await this.call('workspace_write', { source: 'session', path: this.state.path, content: this.state.content, expectedDigest: this.state.digest }); if (this.mounted) {
                            this.setState({ digest: file.digest, dirty: false });
                            this.props.onDirty(false);
                            await this.poll();
                        } }, '私有源码已保存') }, "\u4FDD\u5B58\u79C1\u6709\u6E90\u7801"),
                    React.createElement("button", { className: "text-button", disabled: busy, onClick: () => void this.open(this.state.path) }, "\u91CD\u65B0\u8BFB\u53D6"))) : null,
            diff ? React.createElement("div", null,
                React.createElement("h3", null, "\u4E0E\u5DF2\u4FDD\u5B58 Git \u7248\u672C\u7684\u5DEE\u5F02"),
                diff.files.length ? React.createElement("ul", null, diff.files.map((f) => React.createElement("li", { key: f.path },
                    React.createElement("code", null, f.path),
                    " \u00B7 ",
                    f.status,
                    " \u00B7 ",
                    f.beforeMode ?? '无',
                    " \u2192 ",
                    f.afterMode ?? '无'))) : React.createElement("p", { className: "small muted" }, "\u5F53\u524D\u6CA1\u6709\u672A\u63D0\u4EA4\u7684\u6E90\u7801\u53D8\u5316\u3002"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); void perform(async () => { await this.call('workspace_history_commit', { expectedHead: git.head, message: fd.get('message') }); await this.poll(); }, '已排队保存 Git 版本'); } },
                    React.createElement("label", null,
                        "\u63D0\u4EA4\u8BF4\u660E",
                        React.createElement("input", { name: "message", "aria-label": "Git \u63D0\u4EA4\u8BF4\u660E", required: true, maxLength: 1000, defaultValue: "\u4FDD\u5B58\u672C\u6B21\u7814\u7A76\u5B9E\u73B0" })),
                    React.createElement("button", { className: "secondary", disabled: busy || this.state.dirty || !diff.files.length }, "\u4FDD\u5B58 Git \u7248\u672C"))) : null);
    }
}
class DevelopmentJob extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { job: this.props.job, stream: 'stdout', logs: '', cursor: 0, complete: false, error: '', artifact: '' };
        this.epoch = 0;
        this.fetching = false;
        this.artifactEpoch = 0;
    }
    componentDidMount() { void this.poll(); this.timer = window.setInterval(() => void this.poll(), 1800); }
    componentWillUnmount() { clearInterval(this.timer); this.epoch++; this.artifactEpoch++; }
    async poll() { if (this.fetching)
        return; this.fetching = true; const epoch = this.epoch; try {
        const { project } = this.props.data;
        const job = await op(project.id, this.props.sessionId, 'development_inspect', { jobId: this.props.job.id });
        const page = this.state.complete ? null : await op(project.id, this.props.sessionId, 'development_logs', { jobId: job.id, stream: this.state.stream, cursor: this.state.cursor });
        if (epoch === this.epoch)
            this.setState({ job, error: '', ...(page ? { logs: this.state.logs + page.content, cursor: page.cursor, complete: page.complete } : {}) });
    }
    catch (error) {
        if (epoch === this.epoch)
            this.setState({ error: message(error) });
    }
    finally {
        if (epoch === this.epoch)
            this.fetching = false;
    } }
    render() { const { job } = this.state, { data, perform } = this.props, terminal = ['succeeded', 'failed', 'cancelled', 'timed_out'].includes(job.state); return React.createElement("div", { className: "inspector-section" },
        React.createElement("h3", null,
            "\u5F00\u53D1\u6D4B\u8BD5\u4F5C\u4E1A ",
            short(job.id)),
        React.createElement("div", { className: "actions" },
            React.createElement(Badge, { value: job.state }),
            React.createElement(Badge, { value: job.integrity }),
            React.createElement("span", null,
                "\u9000\u51FA\u7801 ",
                job.exitCode ?? '—')),
        React.createElement("code", { className: "digest" }, job.sourceDigest),
        job.error ? React.createElement("p", { className: "error-text" }, job.error) : null,
        this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
        React.createElement("label", null,
            "\u5F00\u53D1\u6D4B\u8BD5\u65E5\u5FD7\u6D41",
            React.createElement("select", { "aria-label": "\u5F00\u53D1\u6D4B\u8BD5\u65E5\u5FD7\u6D41", value: this.state.stream, onChange: (e) => { this.epoch++; this.fetching = false; this.setState({ stream: e.target.value, logs: '', cursor: 0, complete: false }, () => void this.poll()); } },
                React.createElement("option", { value: "stdout" }, "stdout"),
                React.createElement("option", { value: "stderr" }, "stderr"))),
        React.createElement("pre", { className: "logs" }, this.state.logs || '此流暂无日志。'),
        React.createElement("button", { className: "text-button", disabled: this.state.complete, onClick: () => void this.poll() }, this.state.complete ? '日志已完整读取' : '加载后续日志'),
        !terminal ? React.createElement("button", { className: "text-button danger", onClick: () => perform(() => op(data.project.id, this.props.sessionId, 'development_cancel', { jobId: job.id })) }, "\u53D6\u6D88\u5F00\u53D1\u6D4B\u8BD5") : null,
        React.createElement("ul", null, job.artifactIds.map(id => { const a = data.artifacts.find(a => a.id === id); return React.createElement("li", { key: id },
            React.createElement("button", { className: "text-button", onClick: () => { const seq = ++this.artifactEpoch; void perform(async () => { const content = await artifactText(id); if (seq === this.artifactEpoch)
                    this.setState({ artifact: content.slice(0, 65536) }); }); } }, a?.title ?? short(id)),
            React.createElement("button", { className: "text-button", onClick: () => perform(() => downloadArtifact(id, a?.title ?? id)) }, "\u4E0B\u8F7D")); })),
        this.state.artifact ? React.createElement("pre", { className: "logs" }, this.state.artifact) : null); }
}
export class ImplementationView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { experimentId: '', revision: 1, dirty: false, gitReady: false, preview: null, reviewContent: '' };
    }
    session() { return this.props.data.sessions.find(s => s.id === this.props.sessionId && s.role === 'coordinator' && !s.taskId && s.state !== 'archived'); }
    call(name, input = {}) { return op(this.props.data.project.id, this.props.sessionId, name, input); }
    async preview(id) { await this.props.perform(async () => this.setState({ preview: await api(`/change-proposals/${id}/diff`) })); }
    render() {
        const { data, busy, perform } = this.props, session = this.session(), tasks = (data.developmentTasks ?? []).filter(t => t.sessionId === session?.id), jobs = (data.sandboxJobs ?? []).filter(j => j.sessionId === session?.id), reviews = (data.reviews ?? []).filter(r => r.producerSessionId === session?.id), selected = data.experiments.find(e => e.id === this.state.experimentId), proposals = data.changeProposals.filter(p => reviews.some(r => r.id === p.reviewId));
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u5B9E\u73B0\u4E0E\u5BA1\u67E5", sub: "\u79C1\u6709\u5B9E\u73B0\u3001\u5F00\u53D1\u6D4B\u8BD5\u3001\u72EC\u7ACB\u5BA1\u67E5\u548C\u6574\u5408\u5206\u522B\u7559\u8BC1\u3001\u5206\u522B\u6279\u51C6\u3002" }, session ? React.createElement("button", { className: "primary", disabled: busy || this.state.dirty, onClick: () => this.props.onChat(session.id) }, "\u56DE\u5230\u6B64\u4F1A\u8BDD\u53D1\u9001\u5B9E\u73B0\u6216\u53CD\u9988\u6307\u4EE4") : null),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u9009\u62E9\u5B9E\u73B0\u6765\u6E90")),
                React.createElement("label", null,
                    "\u5B9E\u73B0\u4E3B\u4F1A\u8BDD",
                    React.createElement("select", { "aria-label": "\u5B9E\u73B0\u4E3B\u4F1A\u8BDD", value: session?.id ?? '', onChange: (e) => { if (this.state.dirty && !confirm('私有源码有未保存修改，放弃后切换会话？'))
                            return; this.setState({ dirty: false, gitReady: false, preview: null, reviewContent: '' }); this.props.onSession(e.target.value); } },
                        React.createElement("option", { value: "" }, "\u9009\u62E9\u4E3B\u534F\u8C03\u8005\u4F1A\u8BDD"),
                        data.sessions.filter(s => s.role === 'coordinator' && !s.taskId && s.state !== 'archived').map(s => React.createElement("option", { key: s.id, value: s.id },
                            s.title,
                            " \u00B7 ",
                            short(s.id))))),
                React.createElement("div", { className: "form-columns" },
                    React.createElement("label", null,
                        "\u6765\u6E90\u5B9E\u9A8C",
                        React.createElement("select", { "aria-label": "\u5B9E\u73B0\u6765\u6E90\u5B9E\u9A8C", value: this.state.experimentId, onChange: (e) => { const ex = data.experiments.find(x => x.id === e.target.value); this.setState({ experimentId: e.target.value, revision: ex?.revision ?? 1 }); } },
                            React.createElement("option", { value: "" }, "\u9009\u62E9\u5DF2\u6709\u5B9E\u9A8C"),
                            data.experiments.filter(e => e.lifecycle !== 'archived').map(e => React.createElement("option", { key: e.id, value: e.id },
                                e.title,
                                " \u00B7 \u5F53\u524D\u4FEE\u8BA2 ",
                                e.revision)))),
                    React.createElement("label", null,
                        "\u56FA\u5B9A\u4FEE\u8BA2",
                        React.createElement("input", { "aria-label": "\u5B9E\u73B0\u6765\u6E90\u4FEE\u8BA2", type: "number", min: 1, max: selected?.revision ?? 1, value: this.state.revision, onChange: (e) => this.setState({ revision: Number(e.target.value) }) }))),
                !data.project.gitHistoryEnabled ? React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/projects/${data.project.id}/git-enable`, {}), '受管 Git 已显式启用') }, "\u542F\u7528\u6B64\u9879\u76EE\u53D7\u7BA1 Git") : React.createElement("p", { className: "small muted" }, "\u53D7\u7BA1 Git \u5DF2\u542F\u7528\uFF1B\u53EA\u4FDD\u5B58\u672C\u5730\u5386\u53F2\uFF0C\u4E0D\u63A8\u9001\u3002"),
                React.createElement("button", { className: "primary", disabled: busy || !session || session.state === 'running' || !selected || !Number.isInteger(this.state.revision) || this.state.revision < 1 || this.state.revision > selected.revision || !data.project.gitHistoryEnabled || this.state.dirty, onClick: () => perform(() => this.call('workspace_prepare_from_revision', { experimentId: this.state.experimentId, revision: this.state.revision }), '已请求准备固定私有源码') }, "\u51C6\u5907\u9009\u5B9A\u7248\u672C\u7684\u79C1\u6709\u5DE5\u4F5C\u533A"),
                React.createElement("p", { className: "small muted" }, "\u5DF2\u6709\u6765\u6E90\u6216\u672C\u5730\u6587\u4EF6\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u6539\u9009\u6765\u6E90\u65F6\u8BF7\u4F7F\u7528\u65B0\u7684\u4E3B\u4F1A\u8BDD\uFF1B\u51C6\u5907\u8FC7\u7A0B\u4E2D\u53EF\u7B49\u5F85\uFF0C\u4E0D\u9700\u8981\u4FDD\u6301\u6A21\u578B\u8FD0\u884C\u3002")),
            session ? React.createElement(PrivateWorkspace, { key: session.id, projectId: data.project.id, session: session, perform: perform, busy: busy, onDirty: dirty => this.setState({ dirty }), onReady: gitReady => { if (gitReady !== this.state.gitReady)
                    this.setState({ gitReady }); } }) : React.createElement(Empty, { title: "\u5148\u9009\u62E9\u4E3B\u4F1A\u8BDD" },
                React.createElement("p", null, "\u53EF\u5728\u4FA7\u680F\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u7136\u540E\u56DE\u5230\u6B64\u9875\u9009\u62E9\u3002")),
            session ? React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u5F00\u53D1\u6D4B\u8BD5\u4E0E\u7528\u6237\u6279\u51C6")),
                React.createElement("p", { className: "small muted" }, "Pi \u53EF\u81EA\u884C\u8BF7\u6C42\u6D4B\u8BD5\u3002\u4E0B\u9762\u4E5F\u53EF\u624B\u52A8\u51C6\u5907\uFF1B\u6279\u51C6\u53EA\u9002\u7528\u4E8E\u663E\u793A\u7684\u6E90\u7801\u3001\u547D\u4EE4\u3001\u955C\u50CF\u4E0E\u8D44\u6E90\uFF0C\u4E0D\u7B49\u4E8E\u6279\u51C6\u6B63\u5F0F Run\u3002"),
                React.createElement("details", null,
                    React.createElement("summary", null, "\u624B\u52A8\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5"),
                    React.createElement("form", { className: "form-body", onSubmit: (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget), args = String(fd.get('args') ?? ''); void perform(() => this.call('development_prepare', { title: fd.get('title'), command: [String(fd.get('program')), ...(args ? args.split(/\r?\n/) : [])], environmentImageDigest: fd.get('image'), dockerContext: fd.get('context'), resources: { timeoutSeconds: Number(fd.get('timeout')) }, expectedArtifacts: String(fd.get('outputs') ?? '').split(/\r?\n/).map(p => p.trim()).filter(Boolean) }), '开发测试已准备，等待批准'); } },
                        React.createElement("label", null,
                            "\u6D4B\u8BD5\u540D\u79F0",
                            React.createElement("input", { name: "title", required: true, defaultValue: "\u9A8C\u8BC1\u5F53\u524D\u5B9E\u73B0", maxLength: 200 })),
                        React.createElement("label", null,
                            "\u53EF\u6267\u884C\u7A0B\u5E8F",
                            React.createElement("input", { name: "program", required: true, defaultValue: "python" })),
                        React.createElement("label", null,
                            "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09",
                            React.createElement("textarea", { name: "args", defaultValue: "main.py", rows: 3 })),
                        React.createElement("label", null,
                            "\u56FA\u5B9A\u955C\u50CF\u6458\u8981",
                            React.createElement("input", { name: "image", required: true, pattern: ".+@sha256:[a-f0-9]{64}", placeholder: "python@sha256:\u2026" })),
                        React.createElement("label", null,
                            "\u672C\u5730 Docker context",
                            React.createElement("input", { name: "context", required: true, defaultValue: "desktop-linux" })),
                        React.createElement("label", null,
                            "\u8D85\u65F6\u79D2\u6570",
                            React.createElement("input", { name: "timeout", required: true, type: "number", min: 1, max: 600, defaultValue: 60 })),
                        React.createElement("label", null,
                            "\u5FC5\u9700\u6D4B\u8BD5\u4EA7\u7269\uFF08\u53EF\u7A7A\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
                            React.createElement("textarea", { name: "outputs", rows: 2 })),
                        React.createElement("button", { className: "secondary", disabled: busy || this.state.dirty || !session.sourceRevisionId || !this.state.gitReady }, "\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5"))),
                tasks.length ? tasks.slice().reverse().map(t => { const approval = data.approvals.find(a => a.id === t.grantId); return React.createElement("div", { className: "inspector-section", key: t.id },
                    React.createElement("h3", null,
                        t.title,
                        " \u00B7 ",
                        short(t.id)),
                    React.createElement(Badge, { value: approval?.status ?? t.state }),
                    React.createElement("dl", { className: "details" },
                        React.createElement("dt", null, "\u6E90\u7801\u6458\u8981"),
                        React.createElement("dd", null,
                            React.createElement("code", { className: "digest" }, t.sourceDigest)),
                        React.createElement("dt", null, "\u56FA\u5B9A argv"),
                        React.createElement("dd", null,
                            React.createElement("code", null, JSON.stringify(t.manifest.command))),
                        React.createElement("dt", null, "\u56FA\u5B9A\u955C\u50CF"),
                        React.createElement("dd", null,
                            React.createElement("code", { className: "digest" }, t.manifest.environmentImageDigest)),
                        React.createElement("dt", null, "Context"),
                        React.createElement("dd", null, t.manifest.dockerContext),
                        React.createElement("dt", null, "\u8D44\u6E90"),
                        React.createElement("dd", null, Object.entries(t.manifest.resources).map(([k, v]) => `${k}=${v}`).join(' · ')),
                        React.createElement("dt", null, "\u6388\u6743\u622A\u6B62"),
                        React.createElement("dd", null, t.manifest.deadline),
                        React.createElement("dt", null, "\u5FC5\u9700\u4EA7\u7269"),
                        React.createElement("dd", null, t.manifest.expectedArtifacts.join('、') || '无声明文件')),
                    !t.jobId && approval?.status === 'pending' ? React.createElement("div", { className: "actions" },
                        React.createElement("button", { className: "primary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), '已批准固定开发测试，尚未提交') }, "\u6279\u51C6\u6B64\u5F00\u53D1\u6D4B\u8BD5"),
                        React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })) }, "\u62D2\u7EDD")) : null,
                    !t.jobId && approval?.status === 'approved' ? React.createElement("button", { className: "primary", disabled: busy || this.state.dirty, onClick: () => perform(() => this.call('development_submit', { developmentTaskId: t.id }), '已提交独立开发测试') }, "\u63D0\u4EA4\u5DF2\u6279\u51C6\u5F00\u53D1\u6D4B\u8BD5") : null); }) : React.createElement("p", { className: "inline-empty" }, "\u6B64\u4F1A\u8BDD\u5C1A\u672A\u8BF7\u6C42\u5F00\u53D1\u6D4B\u8BD5\u3002\u53EF\u56DE\u5230\u804A\u5929\u8BA9 Pi \u5B8C\u6210\u5B9E\u73B0\u5E76\u8BF7\u6C42\u6D4B\u8BD5\u3002"),
                jobs.slice().reverse().map(j => React.createElement(DevelopmentJob, { key: j.id, job: j, data: data, sessionId: session.id, perform: perform }))) : null,
            session ? React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u72EC\u7ACB\u5BA1\u67E5")),
                React.createElement("p", { className: "small muted" }, "\u53EA\u6709\u6210\u529F\u4E14\u5B8C\u6574\u7684\u56FA\u5B9A\u6D4B\u8BD5\u53EF\u4EE5\u53D1\u8D77\u5BA1\u67E5\uFF1B\u5BA1\u67E5\u610F\u89C1\u548C\u4EFB\u52A1\u5B8C\u6210\u72B6\u6001\u5206\u5F00\u663E\u793A\u3002"),
                !data.project.settings.enabled ? React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/projects/${data.project.id}/collaboration-settings`, { expectedVersion: data.project.version, enabled: true }), '已显式启用协作；审查仍需单独批准') }, "\u542F\u7528\u534F\u4F5C\u4EE5\u51C6\u5907\u72EC\u7ACB\u5BA1\u67E5") : null,
                jobs.filter(j => j.state === 'succeeded' && j.integrity === 'complete' && j.exitCode === 0).map(j => React.createElement("div", { className: "actions", key: j.id },
                    React.createElement("code", null,
                        "\u6D4B\u8BD5 ",
                        short(j.id),
                        " \u00B7 ",
                        short(j.sourceDigest)),
                    React.createElement("button", { className: "secondary", disabled: busy || !data.project.settings.enabled || reviews.some(r => r.jobId === j.id), onClick: () => perform(() => this.call('development_review_prepare', { jobId: j.id }), '独立审查计划已准备，等待用户批准') }, "\u51C6\u5907\u6B64\u6D4B\u8BD5\u7684\u72EC\u7ACB\u5BA1\u67E5"))),
                reviews.map(r => { const task = data.tasks.find(t => t.id === r.taskId), team = data.teams.find(t => t.id === r.teamId), approval = data.approvals.find(a => a.id === r.approvalId), passed = r.status === 'passed' && task?.execution === 'output_submitted' && task.acceptance === 'accepted' && task.result?.outcome === 'completed' && task.result.verdict === 'accept'; const verdict = task?.result?.verdict; return React.createElement("div", { className: "inspector-section", key: r.id },
                    React.createElement("h3", null,
                        "\u5BA1\u67E5 ",
                        short(r.id),
                        " \u00B7 ",
                        React.createElement(Badge, { value: r.status })),
                    r.status === 'stale' ? React.createElement("p", { className: "error-text" }, "\u6D4B\u8BD5\u6216\u5BA1\u67E5\u4F9D\u636E\u5DF2\u5931\u6548\uFF0C\u5386\u53F2\u610F\u89C1\u4FDD\u7559\uFF0C\u4E0D\u80FD\u7528\u4E8E\u65B0\u6574\u5408\u3002") : null,
                    React.createElement("p", null,
                        "\u72EC\u7ACB\u4EFB\u52A1 ",
                        short(r.taskId),
                        " \u00B7 \u6D4B\u8BD5 ",
                        short(r.jobId)),
                    React.createElement("code", { className: "digest" }, r.sourceDigest),
                    React.createElement("p", null,
                        "\u5BA1\u67E5\u610F\u89C1\uFF1A",
                        verdict === 'accept' ? '通过' : verdict === 'reject' ? '拒绝' : verdict === 'disputed' ? '有争议 / 待补证' : task?.result?.outcome === 'blocked' || task?.result?.outcome === 'partial' ? '待补证' : '等待审查结果',
                        " \u00B7 \u4EFB\u52A1 ",
                        label(task?.execution ?? 'pending'),
                        " \u00B7 \u9A8C\u6536 ",
                        label(task?.acceptance ?? 'pending')),
                    task?.result ? React.createElement("p", { className: "prose-text" }, task.result.summary) : null,
                    task?.blockReason ? React.createElement("p", { className: "error-text" }, task.blockReason) : null,
                    React.createElement("details", null,
                        React.createElement("summary", null, "\u5BA1\u67E5\u8F93\u5165\u4E0E\u5F15\u7528\u8BC1\u636E"),
                        React.createElement("ul", null, [...new Set([...(task?.inputEvidenceIds ?? []), ...(task?.result?.evidenceIds ?? [])])].map(id => { const evidence = data.evidence.find(e => e.id === id), artifact = data.artifacts.find(a => a.id === evidence?.artifactId); return React.createElement("li", { key: id },
                            evidence?.description ?? short(id),
                            artifact ? React.createElement("button", { className: "text-button", onClick: () => perform(async () => this.setState({ reviewContent: (await artifactText(artifact.id)).slice(0, 65536) })) },
                                "\u67E5\u770B ",
                                artifact.title) : null); }))),
                    approval?.status === 'pending' ? React.createElement("div", { className: "actions" },
                        React.createElement("button", { className: "primary", disabled: busy, onClick: () => perform(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }); await api(`/teams/${r.teamId}/activate`, {}); }, '已批准并启动独立审查') }, "\u6279\u51C6\u5E76\u542F\u52A8\u72EC\u7ACB\u5BA1\u67E5"),
                        React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })) }, "\u62D2\u7EDD\u5BA1\u67E5\u8BA1\u5212")) : approval?.status === 'approved' && team?.state === 'awaiting_approval' ? React.createElement("button", { className: "primary", disabled: busy, onClick: () => perform(() => api(`/teams/${r.teamId}/activate`, {})) }, "\u542F\u52A8\u5DF2\u6279\u51C6\u5BA1\u67E5") : null,
                    passed ? React.createElement("form", { onSubmit: (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); void perform(async () => { const p = await this.call('reviewed_change_prepare', { reviewId: r.id, title: fd.get('title'), hypothesis: fd.get('hypothesis') }); this.setState({ preview: await api(`/change-proposals/${p.id}/diff`) }); }, '已准备受审完整变更，请核对差异'); } },
                        React.createElement("label", null,
                            "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0",
                            React.createElement("input", { name: "title", required: true, maxLength: 200, defaultValue: "\u5DF2\u6D4B\u8BD5\u5E76\u5BA1\u67E5\u7684\u5019\u9009" })),
                        React.createElement("label", null,
                            "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E",
                            React.createElement("textarea", { name: "hypothesis", required: true })),
                        React.createElement("button", { className: "primary", disabled: busy }, "\u51C6\u5907\u7ED1\u5B9A\u6D4B\u8BD5\u4E0E\u5BA1\u67E5\u7684\u5B8C\u6574\u53D8\u66F4")) : React.createElement("p", { className: "small muted" }, "\u5BA1\u67E5\u672A\u660E\u786E\u901A\u8FC7\u524D\uFF0C\u4E0D\u80FD\u51C6\u5907\u53D7\u5BA1\u6574\u5408\u3002")); }),
                this.state.reviewContent ? React.createElement("pre", { className: "file-preview" }, this.state.reviewContent) : null) : null,
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u53D7\u5BA1\u6574\u5408")),
                proposals.map(p => { const approval = data.approvals.find(a => a.id === p.approvalId); return React.createElement("div", { className: "inspector-section", key: p.id },
                    React.createElement("h3", null,
                        p.title,
                        " \u00B7 ",
                        React.createElement(Badge, { value: p.state })),
                    React.createElement("p", null, p.hypothesis),
                    React.createElement("button", { className: "secondary", disabled: busy, onClick: () => void this.preview(p.id) }, "\u67E5\u770B\u5B8C\u6574\u56FA\u5B9A\u5DEE\u5F02"),
                    p.sourceValidity === 'stale' ? React.createElement("p", { className: "error-text" }, "\u5BA1\u67E5\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u4E0D\u80FD\u6574\u5408\u3002") : p.state === 'prepared' && approval?.status === 'pending' ? React.createElement("div", { className: "actions" },
                        React.createElement("button", { className: "primary", disabled: busy || this.state.preview?.proposal.id !== p.id, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), '已批准固定整合；尚未创建子实验') }, "\u6279\u51C6\u6B64\u53D7\u5BA1\u6574\u5408"),
                        React.createElement("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })) }, "\u62D2\u7EDD")) : p.state === 'prepared' && approval?.status === 'approved' ? React.createElement("button", { className: "primary", disabled: busy, onClick: () => perform(async () => { const child = await api(`/change-proposals/${p.id}/apply`, {}); this.props.onExperiment(child.id); }, '已创建子实验，正式 Run 仍需单独批准') }, "\u521B\u5EFA\u65B0\u5B50\u5B9E\u9A8C\u5E76\u67E5\u770B") : null,
                    p.appliedExperimentId ? React.createElement("button", { className: "text-button", onClick: () => this.props.onExperiment(p.appliedExperimentId) }, "\u524D\u5F80\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C") : null); }),
                !proposals.length ? React.createElement("p", { className: "inline-empty" }, "\u901A\u8FC7\u6D4B\u8BD5\u548C\u72EC\u7ACB\u5BA1\u67E5\u540E\uFF0C\u5728\u4E0A\u65B9\u51C6\u5907\u5B8C\u6574\u53D8\u66F4\u3002") : null,
                this.state.preview ? React.createElement("div", null,
                    React.createElement("h3", null,
                        "\u56FA\u5B9A\u5DEE\u5F02 \u00B7 ",
                        short(this.state.preview.proposal.id)),
                    this.state.preview.files.map((f) => React.createElement("div", { className: "inspector-section", key: f.path },
                        React.createElement("h4", null,
                            f.path,
                            " \u00B7 ",
                            f.beforeMode ?? '无',
                            " \u2192 ",
                            f.afterMode ?? '无'),
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u53D8\u66F4\u524D"),
                            React.createElement("pre", { className: "file-preview" }, f.before ?? '（不存在）')),
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u53D8\u66F4\u540E"),
                            React.createElement("pre", { className: "file-preview" }, f.after ?? '（删除）'))))) : null));
    }
}
