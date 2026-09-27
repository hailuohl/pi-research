import { TextEvidencePanel } from './text-evidence.js';
import { api, artifactText, downloadArtifact } from './api.js';
import { short, date } from './models.js';
import { Icon, Badge, Empty, SectionTitle } from './ui.js';
export class WorkspaceView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { files: [], path: '', content: '', digest: null, dirty: false, loading: false };
        this.loadId = 0;
    }
    componentDidMount() { void this.loadFiles(); }
    async loadFiles() {
        const files = await api(`/projects/${this.props.data.project.id}/files`);
        this.setState({ files });
        if (!this.state.path && files.length)
            await this.open(files[0].path);
    }
    async open(path) {
        if (this.state.dirty && !confirm('有未保存修改，放弃后切换文件？'))
            return;
        const seq = ++this.loadId;
        this.setState({ loading: true });
        try {
            const f = await api(`/projects/${this.props.data.project.id}/files?path=${encodeURIComponent(path)}`);
            if (seq === this.loadId)
                this.setState({ path, content: f.content, digest: f.digest, dirty: false, loading: false });
        }
        catch (e) {
            this.setState({ loading: false });
            this.props.perform(async () => { throw e; });
        }
    }
    render() {
        return React.createElement("div", { className: "page-scroll workspace-page" },
            React.createElement(SectionTitle, { title: "\u9879\u76EE\u5DE5\u4F5C\u533A", sub: "\u7F16\u8F91\u7684\u662F\u51C6\u5907\u533A\uFF0C\u4E0D\u4F1A\u6539\u53D8\u5DF2\u7ECF\u63D0\u4EA4\u7684\u5B9E\u9A8C\u5FEB\u7167\u3002" },
                React.createElement("button", { className: "secondary", onClick: () => {
                        const path = prompt('新文件相对路径，例如 notes/research.md');
                        if (path)
                            this.setState({ path, content: '', digest: null, dirty: true });
                    } },
                    React.createElement(Icon, { name: "plus", size: 15 }),
                    "\u65B0\u5EFA\u6587\u4EF6")),
            React.createElement("div", { className: "workspace-grid" },
                React.createElement("nav", { className: "file-tree", "aria-label": "\u9879\u76EE\u6587\u4EF6" },
                    React.createElement("div", { className: "small-label" }, "SOURCE FILES"),
                    this.state.files.map(f => React.createElement("button", { key: f.path, className: this.state.path === f.path ? 'active' : '', onClick: () => this.open(f.path) },
                        React.createElement(Icon, { name: "evidence", size: 15 }),
                        React.createElement("span", null, f.path))),
                    React.createElement("p", { className: "small muted" }, ".git\u3001\u53EF\u6267\u884C Pi \u914D\u7F6E\u4E0E\u654F\u611F\u914D\u7F6E\u4E0D\u4F5C\u4E3A\u666E\u901A\u5DE5\u4F5C\u533A\u8D44\u6E90\u52A0\u8F7D\u3002")),
                React.createElement("div", { className: "editor" },
                    React.createElement("div", { className: "editor-toolbar" },
                        React.createElement("code", null, this.state.path || '选择文件'),
                        this.state.dirty ? React.createElement("span", { className: "dirty-dot", title: "\u672A\u4FDD\u5B58" }) : null,
                        React.createElement("span", { className: "grow" }),
                        React.createElement("button", { className: "text-button", onClick: () => this.state.path && this.open(this.state.path) }, "\u91CD\u65B0\u8BFB\u53D6"),
                        React.createElement("button", { className: "primary compact", disabled: !this.state.path || !this.state.dirty || this.state.loading, onClick: () => this.props.perform(async () => { const f = await api(`/projects/${this.props.data.project.id}/files`, { path: this.state.path, content: this.state.content, expectedDigest: this.state.digest }); this.setState({ digest: f.digest, dirty: false }); await this.loadFiles(); }, '文件已保存') }, "\u4FDD\u5B58\u6587\u4EF6")),
                    React.createElement("textarea", { "aria-label": "\u6587\u4EF6\u5185\u5BB9", spellCheck: false, value: this.state.content, onChange: (e) => this.setState({ content: e.target.value, dirty: true }) }),
                    React.createElement("div", { className: "editor-status" },
                        React.createElement("span", null, "UTF-8"),
                        React.createElement("span", null,
                            this.state.content.split('\n').length,
                            " \u884C"),
                        React.createElement("span", null,
                            "\u7248\u672C\u6821\u9A8C ",
                            short(this.state.digest)),
                        React.createElement("span", { className: "grow" }),
                        React.createElement("span", null, "\u51B2\u7A81\u65F6\u4FDD\u7559\u5F53\u524D\u7F16\u8F91\uFF0C\u4E0D\u8986\u76D6\u65B0\u7248\u672C")))),
            React.createElement("div", { className: "notice" },
                React.createElement(Icon, { name: "folder" }),
                React.createElement("p", null, "\u8FD9\u91CC\u4E0D\u63D0\u4F9B\u5BBF\u4E3B Shell\u3002\u4EFB\u610F\u5B9E\u9A8C\u4EE3\u7801\u5FC5\u987B\u8FDB\u5165\u53D7\u63A7 Docker Runner\uFF1B\u5F53\u524D\u73AF\u5883\u672A\u5B8C\u6210 Docker \u7684\u771F\u5B9E\u6267\u884C\u9A8C\u6536\u3002")));
    }
}
export class EvidenceView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { active: '', content: '', query: '' };
    }
    async open(id) { await this.props.perform(async () => { const content = await artifactText(id); this.setState({ active: id, content }); }); }
    render() {
        const { data, perform } = this.props;
        const artifact = data.artifacts.find(a => a.id === this.state.active);
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u8D44\u6599\u4E0E\u8BC1\u636E", sub: "\u8D44\u6599\u662F\u539F\u59CB\u8F93\u5165\uFF1B\u53EA\u6709\u660E\u786E\u5B9A\u4F4D\u5E76\u6821\u9A8C\u540E\u7684\u7247\u6BB5\uFF0C\u624D\u662F\u8BC1\u636E\u3002" },
                React.createElement("label", { className: "secondary file-upload" },
                    React.createElement(Icon, { name: "plus", size: 15 }),
                    "\u5BFC\u5165\u6587\u672C\u8D44\u6599",
                    React.createElement("input", { type: "file", accept: ".txt,.md,.csv,.json,.py,.tex,.mjs", onChange: (e) => {
                            const file = e.target.files?.[0];
                            if (!file)
                                return;
                            perform(async () => {
                                if (file.size > 1024 * 1024)
                                    throw Error('当前文本导入限制为 1 MiB');
                                const content = await file.text();
                                if (content.includes('\0'))
                                    throw Error('此入口不接受二进制文件；PDF全文模块尚未实现');
                                const a = await api('/artifacts', { projectId: data.project.id, title: file.name, content, mediaType: 'text/plain' });
                                this.setState({ active: a.id, content });
                            }, '文本资料已保存');
                            e.target.value = '';
                        } }))),
            React.createElement("div", { className: "evidence-grid" },
                React.createElement("section", { className: "surface artifact-list" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, "\u6587\u4EF6\u4EA7\u7269"),
                        React.createElement("span", null, data.artifacts.length)),
                    React.createElement("div", { className: "search-field" },
                        React.createElement(Icon, { name: "search", size: 16 }),
                        React.createElement("input", { "aria-label": "\u641C\u7D22\u4EA7\u7269", placeholder: "\u641C\u7D22\u6587\u4EF6\u540D", value: this.state.query, onChange: (e) => this.setState({ query: e.target.value }) })),
                    data.artifacts.filter(a => a.title.includes(this.state.query)).slice().reverse().map(a => React.createElement("button", { key: a.id, className: 'artifact-item ' + (a.id === this.state.active ? 'active' : ''), onClick: () => this.open(a.id) },
                        React.createElement(Icon, { name: "evidence" }),
                        React.createElement("div", null,
                            React.createElement("strong", null, a.title),
                            React.createElement("small", null,
                                (a.size / 1024).toFixed(1),
                                " KB \u00B7 ",
                                a.origin.startsWith('run') ? '实际运行产物' : a.origin === 'report' ? '确定性报告' : '已存储文件')))),
                    !data.artifacts.length ? React.createElement("div", { className: "inline-empty" }, "\u5BFC\u5165\u6587\u672C\uFF0C\u6216\u5B8C\u6210\u4E00\u6B21\u5B9E\u9A8C\u4EE5\u83B7\u53D6\u771F\u5B9E\u4EA7\u7269\u3002") : null),
                React.createElement("section", { className: "surface artifact-preview" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, artifact?.title ?? '产物预览'),
                        artifact ? React.createElement("div", { className: "actions" },
                            React.createElement("button", { className: "text-button", onClick: () => perform(() => downloadArtifact(artifact.id, artifact.title)) }, "\u4E0B\u8F7D"),
                            React.createElement("button", { className: "secondary compact", onClick: () => this.props.onRegister(artifact.id, this.state.content) }, "\u767B\u8BB0\u4E3A\u8BC1\u636E")) : null),
                    artifact ? React.createElement("div", null,
                        React.createElement("div", { className: "preview-meta" },
                            "SHA-256 ",
                            React.createElement("code", null, artifact.digest)),
                        React.createElement("pre", { className: "document-preview" }, this.state.content)) : React.createElement(Empty, { title: "\u9009\u62E9\u4E00\u4EFD\u8D44\u6599" },
                        React.createElement("p", null, "HTML\u3001SVG \u7B49\u5185\u5BB9\u5747\u6309\u6587\u672C\u9884\u89C8\uFF0C\u4E0D\u6267\u884C\u5176\u4E2D\u7684\u811A\u672C\u3002")))),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u8BC1\u636E\u7D22\u5F15"),
                    React.createElement("span", { className: "small muted" }, "\u6BCF\u6761\u8BC1\u636E\u56FA\u5B9A\u539F\u6587\u3001\u4F4D\u7F6E\u4E0E\u5185\u5BB9\u6458\u8981")),
                data.evidence.length ? data.evidence.map(e => React.createElement("details", { className: "evidence-record", key: e.id },
                    React.createElement("summary", null,
                        React.createElement("span", { className: "evidence-type" }, e.type.toUpperCase()),
                        React.createElement("strong", null, e.description),
                        React.createElement("code", null, short(e.id))),
                    React.createElement("blockquote", null, e.quote),
                    React.createElement("p", { className: "small muted" },
                        "UTF-16 \u5B57\u7B26\u4F4D\u7F6E ",
                        e.locator.start,
                        "\u2013",
                        e.locator.end,
                        " \u00B7 \u4EA7\u7269 ",
                        short(e.artifactId)),
                    React.createElement("button", { className: "text-button", onClick: () => this.open(e.artifactId) }, "\u67E5\u770B\u539F\u59CB\u4EA7\u7269"))) : React.createElement("div", { className: "inline-empty" }, "\u68C0\u7D22\u547D\u4E2D\u6216\u6587\u4EF6\u5B58\u5728\uFF0C\u4E0D\u81EA\u52A8\u4EE3\u8868\u7ED3\u8BBA\u5DF2\u88AB\u8BC1\u636E\u652F\u6301\u3002")),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u7ED3\u8BBA\u5019\u9009\u4E0E\u9A8C\u6536"),
                    React.createElement("button", { className: "secondary compact", disabled: !data.evidence.length, onClick: this.props.onClaim }, "\u63D0\u51FA\u7ED3\u8BBA\u5019\u9009")),
                data.claims.map(c => React.createElement("div", { className: "claim-record", key: c.id },
                    React.createElement(Badge, { value: c.status }),
                    React.createElement("p", null, c.statement),
                    c.validity === 'stale' ? React.createElement("p", { className: "inline-warning" }, "\u524D\u63D0\u6216\u5BA1\u67E5\u5DF2\u5931\u6548\uFF1A\u4EC5\u4FDD\u7559\u5386\u53F2\uFF0C\u4E0D\u7528\u4E8E\u65B0\u62A5\u544A\u3002") : null,
                    React.createElement("p", { className: "small muted" },
                        "\u9650\u5236\uFF1A",
                        c.limitations.join('；') || '未填写',
                        " \u00B7 \u8BC1\u636E ",
                        c.evidenceIds.map(short).join(', ')),
                    c.status === 'proposal' && c.validity !== 'stale' ? React.createElement("div", { className: "actions" },
                        React.createElement("button", { className: "secondary compact", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'accepted' }), '结论已由用户采纳') }, "\u4EBA\u5DE5\u786E\u8BA4\u91C7\u7EB3"),
                        React.createElement("button", { className: "text-button", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'disputed' })) }, "\u6807\u4E3A\u4E89\u8BAE"),
                        React.createElement("button", { className: "text-button danger", onClick: () => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'rejected' })) }, "\u62D2\u7EDD")) : null)),
                !data.claims.length ? React.createElement("div", { className: "inline-empty" }, "\u5C1A\u65E0\u7ED3\u8BBA\u5019\u9009\u3002\u591A\u4E2A Agent \u4E00\u81F4\u540C\u610F\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u5DF2\u91C7\u7EB3\u4E8B\u5B9E\u3002") : null));
    }
}
export class ReportsView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { title: '研究结果报告', content: '', artifactId: '', selected: null };
    }
    async open(id) { await this.props.perform(async () => this.setState({ artifactId: id, content: await artifactText(id) })); }
    render() {
        const { data, perform } = this.props;
        const eligible = data.runs.filter(r => ['succeeded', 'failed', 'cancelled'].includes(r.state));
        const selected = this.state.selected ?? eligible.map(r => r.id);
        const reports = data.artifacts.filter(a => a.origin === 'report');
        const current = data.artifacts.find(a => a.id === this.state.artifactId);
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u62A5\u544A\u4E0E\u6210\u679C", sub: "\u4ECE\u5B9E\u9645\u7ED3\u679C\u751F\u6210\u771F\u5B9E\u6587\u4EF6\uFF0C\u4E0D\u8865\u5199\u672A\u6D4B\u91CF\u7684\u6570\u636E\u3002" }),
            React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null, "\u751F\u6210\u53EF\u8FFD\u6EAF\u7ED3\u679C\u8BB0\u5F55"),
                React.createElement("label", null,
                    "\u62A5\u544A\u540D\u79F0",
                    React.createElement("input", { "aria-label": "\u62A5\u544A\u540D\u79F0", value: this.state.title, onChange: (e) => this.setState({ title: e.target.value }) })),
                React.createElement("div", { className: "run-selection" }, eligible.map(r => React.createElement("label", { key: r.id },
                    React.createElement("input", { type: "checkbox", checked: selected.includes(r.id), onChange: (e) => this.setState({ selected: e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id) }) }),
                    React.createElement("span", null,
                        data.experiments.find(e => e.id === r.experimentId)?.title,
                        React.createElement("small", null, short(r.id))),
                    React.createElement(Badge, { value: r.integrity })))),
                React.createElement("div", { className: "actions" },
                    React.createElement("button", { className: "primary", disabled: !selected.length || !this.state.title.trim(), onClick: () => perform(async () => { const a = await api('/reports', { projectId: data.project.id, title: this.state.title, runIds: selected, claimIds: data.claims.filter(c => c.status === 'accepted' && c.validity !== 'stale').map(c => c.id) }); this.setState({ artifactId: a.id, content: await artifactText(a.id) }); }, '已生成实际 Markdown 报告') },
                        React.createElement(Icon, { name: "report", size: 16 }),
                        "\u751F\u6210\u7ED3\u679C\u62A5\u544A"),
                    React.createElement("span", { className: "small muted" },
                        "\u53EA\u7EB3\u5165\u9009\u4E2D\u7EC8\u6001 Run \u4E0E\u5F53\u524D\u6709\u6548\u7684\u5DF2\u91C7\u7EB3 Claim\uFF1B",
                        data.claims.filter(c => c.validity === 'stale').length,
                        " \u6761\u5931\u6548\u7ED3\u8BBA\u4FDD\u7559\u5728\u5386\u53F2\u4E2D\uFF0C\u4E0D\u7EB3\u5165\u672C\u6B21\u62A5\u544A"))),
            React.createElement("div", { className: "evidence-grid" },
                React.createElement("section", { className: "surface artifact-list" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, "\u5DF2\u751F\u6210\u62A5\u544A")),
                    reports.map(a => React.createElement("button", { className: 'artifact-item ' + (a.id === this.state.artifactId ? 'active' : ''), onClick: () => this.open(a.id), key: a.id },
                        React.createElement(Icon, { name: "report" }),
                        React.createElement("div", null,
                            React.createElement("strong", null, a.title),
                            React.createElement("small", null, date(a.createdAt))))),
                    !reports.length ? React.createElement("div", { className: "inline-empty" }, "\u5C1A\u672A\u751F\u6210\u62A5\u544A\u3002") : null),
                React.createElement("section", { className: "surface artifact-preview" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, current?.title ?? '报告预览'),
                        current ? React.createElement("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(current.id, current.title)) }, "\u4E0B\u8F7D Markdown") : null),
                    this.state.content ? React.createElement("pre", { className: "document-preview" }, this.state.content) : React.createElement(Empty, { title: "\u8BC1\u636E\u5148\u4E8E\u7ED3\u8BBA" },
                        React.createElement("p", null, "\u62A5\u544A\u5C06\u4FDD\u7559\u8FD0\u884C\u72B6\u6001\u3001\u5B9E\u6D4B\u6307\u6807\u3001\u5FEB\u7167\u548C\u8BC1\u636E ID\u3002LaTeX \u4E0E PDF \u7F16\u8BD1\u5C1A\u672A\u5B9E\u73B0\u3002")))));
    }
}
export class LiteratureView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { query: '', searching: false };
    }
    render() { return React.createElement("div", { className: "page-scroll" },
        React.createElement(SectionTitle, { title: "\u6587\u732E\u68C0\u7D22", sub: "\u5143\u6570\u636E\u68C0\u7D22\u4E0E\u672C\u5730\u539F\u6587\u8BC1\u636E\u5206\u5F00\u8BB0\u5F55\u3002" }),
        React.createElement(TextEvidencePanel, { data: this.props.data, perform: this.props.perform }),
        React.createElement("div", { className: "notice" },
            React.createElement(Icon, { name: "evidence" }),
            React.createElement("p", null, "\u68C0\u7D22\u6761\u76EE\u4E0D\u7B49\u4E8E\u5DF2\u9605\u8BFB\u5168\u6587\u3002\u591A\u6E90\u8BED\u4E49\u68C0\u7D22\u3001\u8BBA\u6587 PDF \u9605\u8BFB\u548C\u539F\u59CB\u56FE\u8868\u5B9A\u4F4D\u5C1A\u672A\u5B9E\u73B0\uFF0C\u4E5F\u672A\u5728\u672C\u73AF\u5883\u9A8C\u8BC1\u5916\u90E8\u63A5\u53E3\u3002")),
        React.createElement("form", { className: "search-panel", onSubmit: (e) => { e.preventDefault(); this.setState({ searching: true }); this.props.perform(() => api('/literature-search', { projectId: this.props.data.project.id, query: this.state.query, limit: 8 })).finally(() => this.setState({ searching: false })); } },
            React.createElement(Icon, { name: "search" }),
            React.createElement("input", { "aria-label": "\u6587\u732E\u68C0\u7D22\u8BCD", placeholder: "\u8F93\u5165\u7814\u7A76\u5173\u952E\u8BCD", value: this.state.query, onChange: (e) => this.setState({ query: e.target.value }) }),
            React.createElement("button", { className: "primary", disabled: this.state.searching || !this.state.query.trim() }, this.state.searching ? '检索中…' : '检索文献')),
        this.props.data.searches.slice().reverse().map(s => React.createElement("section", { className: "surface", key: s.id },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, s.query),
                React.createElement("span", { className: "small muted" },
                    "Crossref \u00B7 ",
                    date(s.createdAt),
                    " \u00B7 \u4EC5\u5143\u6570\u636E")),
            s.items.length ? s.items.map((item, i) => React.createElement("article", { className: "paper-item", key: item.doi || i },
                React.createElement("div", { className: "paper-number" }, String(i + 1).padStart(2, '0')),
                React.createElement("div", null,
                    React.createElement("h3", null, item.title),
                    React.createElement("p", null, item.authors.join(', ')),
                    React.createElement("span", { className: "small muted" },
                        item.journal,
                        " \u00B7 ",
                        item.date.join('-'),
                        " \u00B7 \u672A\u8BFB\u5168\u6587"),
                    item.url ? React.createElement("a", { href: item.url, target: "_blank", rel: "noopener noreferrer" },
                        "\u6253\u5F00\u6765\u6E90 ",
                        React.createElement(Icon, { name: "arrow", size: 14 })) : null))) : React.createElement("div", { className: "inline-empty" }, "\u6B64\u6765\u6E90\u672A\u8FD4\u56DE\u5339\u914D\u6761\u76EE\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u4E3A\u4E0D\u5B58\u5728\u76F8\u5173\u7814\u7A76\u3002")))); }
}
export class SettingsView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { provider: this.props.boot.model.provider, model: this.props.boot.model.model, thinking: this.props.boot.model.thinking, apply: true };
    }
    render() {
        const { boot, session, perform } = this.props;
        return React.createElement("div", { className: "page-scroll settings-page" },
            React.createElement(SectionTitle, { title: "\u8BBE\u7F6E\u4E0E\u80FD\u529B\u72B6\u6001", sub: "\u914D\u7F6E\u4E0D\u4EE3\u8868\u9A8C\u6536\u901A\u8FC7\u3002\u6240\u6709\u672A\u9A8C\u8BC1\u6216\u672A\u5B9E\u73B0\u7684\u80FD\u529B\u90FD\u4F1A\u660E\u786E\u4FDD\u7559\u3002" }),
            React.createElement("section", { className: "surface settings-model" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "Pi \u6A21\u578B\u914D\u7F6E"),
                    React.createElement("span", { className: 'connection-state ' + (boot.runtime.ready ? 'ready' : '') },
                        React.createElement("span", { className: 'status-dot ' + (boot.runtime.ready ? '' : 'amber') }),
                        boot.runtime.ready ? '已配置 · 待真实验证' : '尚未就绪')),
                React.createElement("p", { className: "muted" }, boot.runtime.message),
                React.createElement("form", { onSubmit: (e) => {
                        e.preventDefault();
                        perform(async () => {
                            await api('/settings/model', { provider: this.state.provider, model: this.state.model, thinking: this.state.thinking });
                            if (this.state.apply && session && !session.taskId)
                                await api(`/sessions/${session.id}/model`, { expectedVersion: session.version });
                        }, '模型配置已保存；保存不代表供应商连接成功');
                    } },
                    React.createElement("div", { className: "form-columns" },
                        React.createElement("label", null,
                            "\u4F9B\u5E94\u5546\u6807\u8BC6",
                            React.createElement("input", { required: true, "aria-label": "\u4F9B\u5E94\u5546\u6807\u8BC6", placeholder: "Pi \u4E2D\u7684 provider ID", value: this.state.provider, onChange: (e) => this.setState({ provider: e.target.value }) })),
                        React.createElement("label", null,
                            "\u6A21\u578B ID",
                            React.createElement("input", { required: true, "aria-label": "\u6A21\u578B ID", placeholder: "\u5B9E\u9645\u53EF\u7528\u7684\u6A21\u578B\u6807\u8BC6", value: this.state.model, onChange: (e) => this.setState({ model: e.target.value }) })),
                        React.createElement("label", null,
                            "\u601D\u8003\u914D\u7F6E",
                            React.createElement("select", { "aria-label": "\u601D\u8003\u914D\u7F6E", value: this.state.thinking, onChange: (e) => this.setState({ thinking: e.target.value }) }, ['off', 'minimal', 'low', 'medium', 'high', 'xhigh'].map(v => React.createElement("option", { value: v, key: v }, v))))),
                    React.createElement("label", { className: "checkbox-label" },
                        React.createElement("input", { type: "checkbox", checked: this.state.apply, disabled: !session || session.state === 'running', onChange: (e) => this.setState({ apply: e.target.checked }) }),
                        "\u540C\u65F6\u7528\u4E8E\u5F53\u524D\u7A7A\u95F2\u4E3B\u4F1A\u8BDD\uFF1B\u5DF2\u6279\u51C6\u56E2\u961F\u7684\u6A21\u578B\u914D\u7F6E\u4FDD\u6301\u56FA\u5B9A"),
                    React.createElement("button", { className: "primary", type: "submit" }, "\u4FDD\u5B58\u6A21\u578B\u914D\u7F6E")),
                React.createElement("div", { className: "setup-notes" },
                    React.createElement("h3", null, "\u672C\u5730\u63A5\u5165"),
                    React.createElement("p", null,
                        "1. \u4F7F\u7528 Node.js \u226522.19.0\uFF08\u5EFA\u8BAE 24\uFF09\u3002\u5F53\u524D\u5185\u6838\uFF1A",
                        React.createElement("code", null, boot.runtime.node),
                        "\u3002"),
                    React.createElement("p", null,
                        "2. \u5728\u9879\u76EE\u76EE\u5F55\u6267\u884C ",
                        React.createElement("code", null, "npm run setup:pi"),
                        "\uFF0C\u5B89\u88C5\u56FA\u5B9A Pi ",
                        boot.runtime.expectedVersion,
                        "\u3002"),
                    React.createElement("p", null,
                        "3. \u5C06\u6240\u9009\u4F9B\u5E94\u5546\u5BC6\u94A5\u5199\u5165\u672C\u5730 ",
                        React.createElement("code", null, ".env"),
                        " \u7684 ",
                        React.createElement("code", null, "PI_API_KEY"),
                        "\uFF0C\u518D\u91CD\u542F\u670D\u52A1\u3002\u4E0D\u8981\u628A\u5BC6\u94A5\u53D1\u5230\u804A\u5929\u3001\u653E\u8FDB\u7814\u7A76\u4ED3\u5E93\u6216\u62A5\u544A\u3002"),
                    React.createElement("p", null,
                        "4. \u81EA\u5B9A\u4E49\u6A21\u578B\u53EF\u7531\u7528\u6237\u914D\u7F6E\u6570\u636E\u76EE\u5F55\u4E0B\u7684 ",
                        React.createElement("code", null, "models.json"),
                        "\u3002\u771F\u5B9E\u8C03\u7528\u4ECD\u9700\u9A8C\u8BC1\u63A5\u53E3\u517C\u5BB9\u6027\u3002"))),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u80FD\u529B\u4E0E\u9A8C\u6536\u77E9\u9635"),
                    React.createElement("span", { className: "small muted" }, "v0.2 \u00B7 \u672A\u5B8C\u6210 M0\u2014M9 \u5168\u91CF\u590D\u523B")),
                React.createElement("div", { className: "table-wrap" },
                    React.createElement("table", { className: "capability-table" },
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                React.createElement("th", null, "\u80FD\u529B"),
                                React.createElement("th", null, "\u72B6\u6001"),
                                React.createElement("th", null, "\u9A8C\u8BC1\u4E0E\u8303\u56F4"))),
                        React.createElement("tbody", null, boot.capabilities.map(c => React.createElement("tr", { key: c.id },
                            React.createElement("td", null,
                                React.createElement("strong", null, c.name),
                                React.createElement("small", null, c.stage)),
                            React.createElement("td", null,
                                React.createElement(Badge, { value: c.status })),
                            React.createElement("td", null,
                                React.createElement("span", null, c.verification),
                                React.createElement("small", null, c.notes)))))))),
            React.createElement("div", { className: "notice" },
                React.createElement(Icon, { name: "settings" }),
                React.createElement("p", null, "\u5F53\u524D\u90E8\u7F72\u662F\u56DE\u73AF\u5730\u5740\u3001\u5355\u7528\u6237\u672C\u5730\u5DE5\u4F5C\u53F0\u3002\u672A\u5B9E\u73B0\u591A\u79DF\u6237\u8BA4\u8BC1\u3001\u8FDC\u7A0B\u6258\u7BA1\u670D\u52A1\u4E0E\u6574\u673A\u7EA7 Agent \u6C99\u7BB1\uFF1B\u8BF7\u52FF\u76F4\u63A5\u66B4\u9732\u5230\u516C\u7F51\u3002")));
    }
}
