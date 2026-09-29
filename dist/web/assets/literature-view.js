import { api, artifactBlob, artifactText, downloadArtifact } from './api.js';
import { short } from './models.js';
import { SectionTitle, Badge, Empty } from './ui.js';
import { TextEvidencePanel } from './text-evidence.js';
import { DiscoveryGrants } from './discovery-grants.js';
const sources = ['alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref'];
const contentNames = { metadata: '仅元数据', abstract: '仅摘要', 'provider-text': '供应商提取文本（非原 PDF）', 'original-pdf': '已固定原始 PDF 字节', 'user-text': '用户导入文本' };
const call = (projectId, name, input = {}) => api(`/operations/${name}`, { projectId, input });
export function literatureRequestedVersion(target) {
    if (target.requestedVersion)
        return `请求版本 ${target.requestedVersion}`;
    const version = target.source === 'alphaxiv' ? target.id.match(/v([1-9]\d*)$/) : null;
    return version ? `地址指定 v${version[1]}` : '未指定版本';
}
export async function verifiedPageImage(blob, expectedDigest) {
    if (blob.size > 16 * 1024 * 1024)
        throw Error('页图超过固定16 MiB上限');
    const bytes = new Uint8Array(await blob.arrayBuffer()), signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (signature.some((value, index) => bytes[index] !== value))
        throw Error('固定页图不是有效 PNG');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(n => n.toString(16).padStart(2, '0')).join('');
    if (hash !== expectedDigest)
        throw Error('固定页图摘要不匹配');
    return new Blob([bytes], { type: 'image/png' });
}
export function literatureSourceURL(value) { try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
}
catch {
    return undefined;
} }
async function fileBase64(file) { if (!file.size)
    throw Error('文档不能为空'); if (file.size > 32 * 1024 * 1024)
    throw Error('单份文档最多 32 MiB'); return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(Error('文档读取失败')); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.readAsDataURL(file); }); }
export class LiteratureView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { query: '', sources: ['crossref'], config: null, error: '', format: 'provider-text', requestedVersion: '', result: null, document: null, loading: false, importLicense: '' };
        this.mounted = true;
        this.documentEpoch = 0;
        this.taskEpoch = 0;
    }
    componentDidMount() { void this.loadConfig(); if (this.props.selectedDocument)
        void this.loadDocument(this.props.selectedDocument.documentVersionId); }
    componentWillUnmount() { this.mounted = false; this.documentEpoch++; this.taskEpoch++; }
    componentDidUpdate(prev) { if (prev.selectedDocument?.documentVersionId !== this.props.selectedDocument?.documentVersionId) {
        if (this.props.selectedDocument)
            void this.loadDocument(this.props.selectedDocument.documentVersionId);
        else {
            this.documentEpoch++;
            this.setState({ document: null });
        }
    } }
    async loadConfig() { try {
        const config = await api(`/projects/${this.props.data.project.id}/connectors`);
        if (this.mounted)
            this.setState({ config, sources: this.state.sources.filter(s => config.enabled[s]) });
    }
    catch (error) {
        if (this.mounted)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    } }
    async loadDocument(id) { const epoch = ++this.documentEpoch; this.setState({ loading: true, error: '', document: null }); try {
        const document = await call(this.props.data.project.id, 'document_inspect', { documentVersionId: id });
        if (this.mounted && epoch === this.documentEpoch)
            this.setState({ document });
    }
    catch (error) {
        if (this.mounted && epoch === this.documentEpoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        if (this.mounted && epoch === this.documentEpoch)
            this.setState({ loading: false });
    } }
    selectDocument(target) { if (this.props.onDocument)
        this.props.onDocument(target);
    else
        void this.loadDocument(target.documentVersionId); }
    async inspectTask(task) { const epoch = ++this.taskEpoch, projectId = this.props.data.project.id; await this.props.perform(async () => { const result = await call(projectId, 'literature_task_inspect', { taskId: task.id }); if (!this.mounted || epoch !== this.taskEpoch || projectId !== this.props.data.project.id)
        return; if (result.documentVersionId)
        this.selectDocument({ documentVersionId: result.documentVersionId }); if (result.searchResult)
        this.setState({ result: result.searchResult, error: '' });
    else if (result.resultSearchId)
        this.setState({ error: '固定检索结果尚不可读，未显示其他查询结果。' }); }); }
    render() {
        const { data, perform } = this.props, s = this.state, resultGrant = (data.discoveryGrants ?? []).find(g => g.id === s.result?.discoveryGrant?.id && g.digest === s.result?.discoveryGrant?.digest);
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u6587\u732E\u4EFB\u52A1\u4E0E\u539F\u6587", sub: "\u663E\u5F0F\u63D0\u4EA4\u3001\u56FA\u5B9A\u53D6\u5F97\u7684\u5B57\u8282\uFF0C\u518D\u6309\u9875\u6BB5\u56DE\u67E5\uFF1B\u6458\u8981\u548C\u4F9B\u5E94\u5546\u6587\u672C\u4E0D\u5192\u5145\u539F PDF\u3002" },
                this.props.onSources ? React.createElement("button", { className: "secondary", onClick: this.props.onSources }, "\u7BA1\u7406\u6765\u6E90\u6388\u6743") : null,
                React.createElement("button", { className: "secondary", onClick: () => void this.loadConfig() }, "\u5237\u65B0\u6765\u6E90\u72B6\u6001")),
            s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
            React.createElement(DiscoveryGrants, { data: data, perform: perform, selectedGrant: this.props.selectedDiscoveryGrant, onSelect: this.props.onSelectDiscoveryGrant, onSession: this.props.onSession, onSearch: (search, discoveryGrantId) => void perform(() => call(data.project.id, 'literature_task_create', { kind: 'search', search, discoveryGrantId }), '授权内固定检索已提交'), onTarget: (target, discoveryGrantId) => void perform(() => call(data.project.id, 'literature_task_create', { kind: 'retrieve', target, discoveryGrantId }), '授权内明确资料获取已提交') }),
            React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null, "\u63D0\u4EA4\u672A\u7ED1\u5B9A\u7684\u6301\u4E45\u68C0\u7D22\u4EFB\u52A1"),
                React.createElement("p", { className: "small muted" }, "\u542F\u7528\u4EE3\u8868\u5141\u8BB8\u53D1\u9001\u67E5\u8BE2\uFF0C\u4E0D\u7B49\u4E8E\u6765\u6E90\u5065\u5EB7\u3002\u5931\u8D25\u4E0D\u4F1A\u5199\u6210\u96F6\u7ED3\u679C\uFF1B\u5173\u95ED\u9875\u9762\u4E0D\u53D6\u6D88\u5DF2\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1\u3002\u5DF2\u7ED1\u5B9A DiscoveryGrant \u7684\u4E3B\u4F1A\u8BDD\u8BF7\u4ECE\u4E0A\u65B9\u56FA\u5B9A\u8303\u56F4\u63D0\u4EA4\u3002"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void perform(() => call(data.project.id, 'literature_task_create', { kind: 'search', search: { query: s.query, sources: s.sources, limit: 8, strategy: 'keyword', prioritize: 'default' } }), '文献检索任务已提交'); } },
                    React.createElement("label", null,
                        "\u6587\u732E\u68C0\u7D22\u8BCD",
                        React.createElement("input", { "aria-label": "\u6587\u732E\u68C0\u7D22\u8BCD", required: true, maxLength: 500, value: s.query, onChange: (e) => this.setState({ query: e.target.value }) })),
                    React.createElement("div", { className: "connector-switches" }, sources.map(source => React.createElement("label", { key: source },
                        React.createElement("input", { type: "checkbox", disabled: !s.config?.enabled[source], checked: s.sources.includes(source), onChange: (e) => this.setState({ sources: e.target.checked ? [...s.sources, source] : s.sources.filter(x => x !== source) }) }),
                        source,
                        " \u00B7 ",
                        s.config?.enabled[source] ? '已授权' : '未授权'))),
                    React.createElement("button", { className: "primary", disabled: !s.query.trim() || !s.sources.length || !s.config || s.sources.some(source => !s.config.enabled[source]) }, "\u63D0\u4EA4\u68C0\u7D22\u4EFB\u52A1"))),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u6301\u4E45\u4EFB\u52A1\u8BB0\u5F55"),
                    React.createElement("span", { className: "small muted" }, "\u6700\u8FD1 30 \u6761\uFF1B\u72B6\u6001\u6765\u81EA\u670D\u52A1\u7AEF")),
                (data.literatureTasks ?? []).map(task => React.createElement("div", { className: "inspector-section", key: task.id },
                    React.createElement("h3", null,
                        task.kindOfTask === 'search' ? '检索' : '获取原文',
                        " \u00B7 ",
                        short(task.id)),
                    React.createElement(Badge, { value: task.state }),
                    React.createElement("p", { className: "small muted" }, task.request.kind === 'search' ? task.request.search.query : `${task.request.target.source} · ${task.request.target.id} · ${literatureRequestedVersion(task.request.target)}`),
                    task.cancelRequested && !['cancelled', 'failed', 'succeeded', 'partial', 'interrupted'].includes(task.state) ? React.createElement("p", { role: "status" }, "\u5DF2\u8BF7\u6C42\u53D6\u6D88\uFF0C\u7B49\u5F85\u6267\u884C\u5668\u786E\u8BA4\uFF1B\u5C1A\u672A\u6807\u4E3A\u7EC8\u6001\u3002") : null,
                    React.createElement("p", null,
                        "\u9636\u6BB5\uFF1A",
                        task.phase ?? '等待服务端阶段记录'),
                    task.error ? React.createElement("p", { className: "error-text" },
                        task.error.code,
                        "\uFF1A",
                        task.error.message) : null,
                    React.createElement("div", { className: "actions wrap" },
                        React.createElement("button", { className: "secondary compact", onClick: () => void this.inspectTask(task) }, "\u67E5\u770B\u56FA\u5B9A\u7ED3\u679C"),
                        ['queued', 'running', 'cancelling'].includes(task.state) ? React.createElement("button", { className: "text-button danger", onClick: () => perform(() => call(data.project.id, 'literature_task_cancel', { taskId: task.id })) }, "\u8BF7\u6C42\u53D6\u6D88\u4EFB\u52A1") : null,
                        ['failed', 'cancelled', 'interrupted'].includes(task.state) ? React.createElement("button", { className: "secondary compact", onClick: () => perform(() => call(data.project.id, 'literature_task_retry', { taskId: task.id, expectedVersion: task.version }), '已显式请求新尝试') }, "\u663E\u5F0F\u91CD\u8BD5") : null))),
                !data.literatureTasks?.length ? React.createElement("p", { className: "inline-empty" }, "\u5C1A\u65E0\u6587\u732E\u4EFB\u52A1\u3002\u6CA1\u6709\u7ED3\u679C\u4E0D\u8868\u793A\u4E0D\u5B58\u5728\u76F8\u5173\u7814\u7A76\u3002") : null),
            s.result ? React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null,
                    "\u56FA\u5B9A\u68C0\u7D22\u7ED3\u679C\uFF1A",
                    s.result.query),
                React.createElement("p", { className: "small muted" }, s.result.discoveryGrant ? `DiscoveryGrant ${short(s.result.discoveryGrant.id)} · 授权内命中` : '未绑定授权的检索'),
                s.result.sources.map(source => React.createElement("p", { key: source.source },
                    source.source,
                    " \u00B7 ",
                    source.status,
                    " \u00B7 ",
                    source.count,
                    " \u6761 ",
                    source.error ?? '')),
                React.createElement("p", { className: "small muted" }, "\u7ED3\u679C\u4EC5\u8986\u76D6\u6240\u9009\u6765\u6E90\u7684\u6709\u754C\u5019\u9009\u6C60\uFF0C\u4E0D\u4EE3\u8868\u7A77\u5C3D\u68C0\u7D22\u6216\u9605\u8BFB\u5168\u6587\u3002"),
                React.createElement("div", { className: "form-columns" },
                    React.createElement("label", null,
                        "\u83B7\u53D6\u5185\u5BB9",
                        React.createElement("select", { "aria-label": "\u83B7\u53D6\u5185\u5BB9\u7C7B\u578B", value: s.format, onChange: (e) => this.setState({ format: e.target.value }) },
                            React.createElement("option", { value: "provider-text" }, "\u6765\u6E90\u63D0\u4F9B\u7684\u6587\u672C / \u6458\u8981 / \u5143\u6570\u636E"),
                            React.createElement("option", { value: "original-pdf" }, "\u539F\u59CB PDF\uFF08\u4E0D\u53EF\u53D6\u5F97\u65F6\u660E\u786E\u5931\u8D25\uFF09"))),
                    React.createElement("label", null,
                        "\u8BF7\u6C42\u7248\u672C\uFF08\u53EF\u9009\uFF09",
                        React.createElement("input", { "aria-label": "\u8BF7\u6C42\u539F\u6587\u7248\u672C", value: s.requestedVersion, onChange: (e) => this.setState({ requestedVersion: e.target.value }), placeholder: "\u4F8B\u5982 v2\uFF1B\u7559\u7A7A\u4E0D\u4FDD\u8BC1\u6307\u5B9A\u7248\u672C" }))),
                s.result.items.map(hit => React.createElement("article", { className: "inspector-section", key: hit.source + ':' + hit.id },
                    React.createElement("h3", null, hit.title),
                    React.createElement("p", { className: "small muted" },
                        hit.source,
                        " \u00B7 ",
                        hit.id,
                        " \u00B7 \u5C1A\u672A\u6838\u9A8C\u539F PDF"),
                    React.createElement("p", { className: "prose-text" }, hit.abstract ?? '未提供摘要'),
                    literatureSourceURL(hit.url) ? React.createElement("a", { href: literatureSourceURL(hit.url), target: "_blank", rel: "noopener noreferrer" }, "\u6253\u5F00\u6765\u6E90\u9875\u9762") : null,
                    s.result.discoveryGrant ? React.createElement("button", { className: "secondary compact", disabled: !resultGrant || resultGrant.effectiveState !== 'active' || resultGrant.validity !== 'current' || !resultGrant.allowSearchResults || !resultGrant.formats.includes(s.format) || resultGrant.usage.remaining < 1, onClick: () => perform(() => call(data.project.id, 'literature_task_create', { kind: 'retrieve', target: { source: hit.source, id: hit.id, format: s.format, ...(s.requestedVersion.trim() ? { requestedVersion: s.requestedVersion.trim() } : {}) }, discoveryGrantId: s.result.discoveryGrant.id }), '授权内命中资料获取已提交') }, "\u4EE5\u539F\u68C0\u7D22\u6388\u6743\u83B7\u53D6\u6B64\u547D\u4E2D") : React.createElement("button", { className: "secondary compact", disabled: !s.config?.enabled[hit.source], onClick: () => perform(() => call(data.project.id, 'literature_task_create', { kind: 'retrieve', target: { source: hit.source, id: hit.id, format: s.format, ...(s.requestedVersion.trim() ? { requestedVersion: s.requestedVersion.trim() } : {}) } }), '原文获取任务已提交') }, "\u63D0\u4EA4\u6B64\u6587\u732E\u83B7\u53D6\u4EFB\u52A1")))) : null,
            React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null, "\u5BFC\u5165\u672C\u5730\u56FA\u5B9A\u6587\u6863"),
                React.createElement("label", null,
                    "\u8BB8\u53EF\u8BC1\u8BF4\u660E\uFF08\u672A\u77E5\u53EF\u7559\u7A7A\uFF09",
                    React.createElement("input", { "aria-label": "\u5BFC\u5165\u6587\u6863\u8BB8\u53EF\u8BC1", value: s.importLicense, onChange: (e) => this.setState({ importLicense: e.target.value }) })),
                React.createElement("label", { className: "secondary file-upload" },
                    "\u9009\u62E9 PDF \u6216 UTF-8 \u6587\u672C\uFF08\u6700\u591A32 MiB\uFF09",
                    React.createElement("input", { type: "file", accept: ".pdf,.txt,.md,application/pdf,text/plain", onChange: (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file)
                            void perform(async () => { const mediaType = /\.pdf$/i.test(file.name) ? 'application/pdf' : 'text/plain', document = await call(data.project.id, 'document_import', { title: file.name, mediaType, contentBase64: await fileBase64(file), ...(s.importLicense.trim() ? { license: s.importLicense.trim() } : {}) }); this.selectDocument({ documentVersionId: document.id }); }, '原始文档字节已固定保存'); } })),
                React.createElement("p", { className: "small muted" }, "\u4EC5\u5904\u7406\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6\uFF1B\u4E0D\u81EA\u52A8\u8BFB\u53D6\u5BBF\u4E3B\u76EE\u5F55\uFF0C\u4E5F\u4E0D\u52A0\u5165\u672C\u5730\u68C0\u7D22\u8BED\u6599\u3002")),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u56FA\u5B9A\u6587\u6863\u7248\u672C"),
                    React.createElement("span", { className: "small muted" }, "\u6700\u8FD130\u4EFD\uFF1B\u5386\u53F2\u6307\u5B9A\u7248\u672C\u53EF\u76F4\u63A5\u56DE\u67E5")),
                (data.documents ?? []).slice().reverse().map(document => React.createElement("button", { className: "artifact-item", key: document.id, onClick: () => this.selectDocument({ documentVersionId: document.id }) },
                    React.createElement("div", null,
                        React.createElement("strong", null, document.title),
                        React.createElement("small", null,
                            contentNames[document.contentKind],
                            " \u00B7 ",
                            short(document.id),
                            " \u00B7 ",
                            short(document.original.digest))))),
                !data.documents?.length ? React.createElement("p", { className: "inline-empty" }, "\u5C1A\u65E0\u56FA\u5B9A DocumentVersion\u3002") : null),
            s.loading ? React.createElement("p", { role: "status" }, "\u8BFB\u53D6\u56FA\u5B9A\u6587\u6863\u2026") : s.document ? React.createElement(DocumentPane, { key: s.document.id, document: s.document, data: data, perform: perform, location: this.props.selectedDocument, onLocation: target => this.selectDocument(target) }) : React.createElement(Empty, { title: "\u9009\u62E9\u6587\u6863\u7248\u672C" },
                React.createElement("p", null, "\u539F\u59CB\u6587\u4EF6\u53D6\u5F97\u3001\u6587\u672C\u63D0\u53D6\u548C\u79D1\u5B66\u6838\u9A8C\u662F\u4E0D\u540C\u9636\u6BB5\u3002")),
            React.createElement(TextEvidencePanel, { data: data, perform: perform }));
    }
}
class DocumentPane extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { parser: null, error: '', context: 'desktop-linux', image: '', text: '' };
        this.mounted = true;
    }
    componentDidMount() { void this.status(); }
    componentWillUnmount() { this.mounted = false; }
    async status() { try {
        const parser = await call(this.props.data.project.id, 'document_parser_status');
        if (this.mounted)
            this.setState({ parser, error: '' });
    }
    catch (error) {
        if (this.mounted)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    } }
    render() {
        const { document: d, data, perform } = this.props;
        return React.createElement("section", { className: "surface report-builder" },
            React.createElement("h2", null, d.title),
            React.createElement("p", null,
                contentNames[d.contentKind],
                " \u00B7 \u83B7\u53D6\u65F6\u95F4 ",
                d.acquiredAt),
            React.createElement("code", { className: "digest" },
                "\u539F\u59CB SHA-256 ",
                d.original.digest),
            React.createElement("dl", { className: "details" },
                React.createElement("dt", null, "\u8BF7\u6C42\u7248\u672C"),
                React.createElement("dd", null, d.source.requestedVersion ?? '未指定'),
                React.createElement("dt", null, "\u6765\u6E90\u62A5\u544A\u7248\u672C"),
                React.createElement("dd", null, d.source.reportedVersion ?? '未知'),
                React.createElement("dt", null, "\u7248\u672C\u4FDD\u8BC1"),
                React.createElement("dd", null, d.source.versionAssurance),
                React.createElement("dt", null, "\u8BB8\u53EF\u8BC1"),
                React.createElement("dd", null,
                    d.license.value ?? '未知',
                    " \u00B7 ",
                    d.license.assurance),
                React.createElement("dt", null, "\u6765\u6E90 ID"),
                React.createElement("dd", null, d.source.requestedId ?? '用户本地导入')),
            literatureSourceURL(d.source.sourceUrl) ? React.createElement("a", { href: literatureSourceURL(d.source.sourceUrl), target: "_blank", rel: "noopener noreferrer" }, "\u67E5\u770B\u6765\u6E90\u5730\u5740") : null,
            React.createElement("ul", null, d.limitations.map((value, i) => React.createElement("li", { key: i }, value))),
            React.createElement("button", { className: "secondary", onClick: () => perform(() => downloadArtifact(d.original.artifactId, d.contentKind === 'original-pdf' && !/\.pdf$/i.test(d.title) ? d.title + '.pdf' : d.title)) }, "\u4E0B\u8F7D\u56FA\u5B9A\u539F\u59CB\u6587\u4EF6"),
            React.createElement("p", { className: "small muted" }, "\u53D6\u5F97 PDF \u5B57\u8282\u4E0D\u7B49\u4E8E\u5DF2\u9605\u8BFB\u6216\u901A\u8FC7\u79D1\u5B66\u6838\u9A8C\uFF1B\u4E0D\u4F1A\u5728\u9875\u9762\u6267\u884C PDF \u811A\u672C\u6216\u5D4C\u5165\u5185\u5BB9\u3002"),
            this.state.error ? React.createElement("p", { role: "alert", className: "error-text" }, this.state.error) : null,
            d.contentKind !== 'original-pdf' ? React.createElement("div", null,
                React.createElement("button", { className: "secondary", onClick: () => perform(async () => { const content = await artifactText((d.derivedText ?? d.original).artifactId); if (this.mounted)
                        this.setState({ text: content.slice(0, 65536) + (content.length > 65536 ? '\n…只预览前65,536字符；下载查看完整原件。' : '') }); }) },
                    "\u67E5\u770B",
                    d.derivedText ? '派生' : '已固定',
                    "\u6587\u672C\uFF1A",
                    contentNames[d.contentKind],
                    "\uFF08\u65E0 PDF \u9875\u6620\u5C04\uFF09"),
                d.derivedText ? React.createElement("div", null,
                    React.createElement("p", { className: "small muted" }, "\u6D3E\u751F\u6458\u8981/\u683C\u5F0F\u5316\u5143\u6570\u636E/\u63D0\u53D6\u6587\u672C\u4E0E\u539F\u59CB\u7F51\u7EDC\u54CD\u5E94\u5206\u522B\u4FDD\u5B58\uFF1B\u6B64\u9605\u8BFB\u5185\u5BB9\u4E0D\u662F\u539F PDF\u3002"),
                    React.createElement("code", { className: "digest" },
                        "\u6D3E\u751F\u6587\u672C SHA-256 ",
                        d.derivedText.digest),
                    React.createElement("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(d.derivedText.artifactId, `${d.title}-derived.txt`)) }, "\u5355\u72EC\u4E0B\u8F7D\u6D3E\u751F\u6587\u672C")) : null,
                this.state.text ? React.createElement("pre", { className: "document-preview" }, this.state.text) : null) : null,
            React.createElement("h3", null, "\u9694\u79BB\u89E3\u6790\u914D\u7F6E"),
            React.createElement("p", { className: "small muted" }, "\u89E3\u6790\u5668\u9700\u8981\u9884\u5148\u914D\u7F6E\u56FA\u5B9A\u955C\u50CF\u3002\u672A\u5C31\u7EEA\u65F6\u8BF7\u6309\u5BBF\u4E3B setup-document-parser \u6307\u5F15\u51C6\u5907\uFF1B\u9875\u9762\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5\u3002"),
            React.createElement("button", { className: "text-button", onClick: () => void this.status() }, "\u5237\u65B0\u89E3\u6790\u5668\u72B6\u6001"),
            this.state.parser ? React.createElement("div", null,
                React.createElement("p", null, this.state.parser.configured ? '固定解析镜像已配置；每次解析仍需单独批准' : '解析器未配置；请先在宿主运行 setup-document-parser 指引'),
                React.createElement("p", { className: "small muted" },
                    "\u914D\u7F6E\u7248\u672C ",
                    this.state.parser.version,
                    " \u00B7 ",
                    this.state.parser.profileId,
                    " \u00B7 \u6700\u591A ",
                    this.state.parser.limits.maxPages,
                    " \u9875\uFF1BOCR\u4E0D\u9ED8\u8BA4\u542F\u7528\u3002"),
                this.state.parser.configuration ? React.createElement("code", { className: "digest" }, this.state.parser.configuration.imageDigest) : null) : null,
            React.createElement("details", null,
                React.createElement("summary", null, "\u914D\u7F6E\u5DF2\u5B58\u5728\u7684\u56FA\u5B9A\u89E3\u6790\u955C\u50CF"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void perform(async () => { await call(data.project.id, 'document_parser_configure', { expectedVersion: this.state.parser.version, dockerContext: this.state.context, imageDigest: this.state.image.trim() }); await this.status(); }); } },
                    React.createElement("label", null,
                        "\u89E3\u6790 Docker context",
                        React.createElement("input", { required: true, value: this.state.context, onChange: (e) => this.setState({ context: e.target.value }) })),
                    React.createElement("label", null,
                        "\u56FA\u5B9A\u89E3\u6790\u955C\u50CF\u6458\u8981",
                        React.createElement("input", { required: true, pattern: "(?:.+@)?sha256:[a-f0-9]{64}", value: this.state.image, onChange: (e) => this.setState({ image: e.target.value }) })),
                    React.createElement("button", { className: "secondary", disabled: !this.state.parser }, "\u663E\u5F0F\u4FDD\u5B58\u89E3\u6790\u914D\u7F6E"))),
            React.createElement("button", { className: "primary", disabled: d.contentKind !== 'original-pdf' || !this.state.parser?.configured, onClick: () => perform(() => call(data.project.id, 'document_parse_prepare', { documentVersionId: d.id }), '固定解析任务已准备；仍需用户批准') }, "\u51C6\u5907\u56FA\u5B9A\u6587\u6863\u89E3\u6790"),
            (data.documentParseJobs ?? []).filter(job => job.documentVersionId === d.id).slice().reverse().map(job => { const approval = data.approvals.find(a => a.id === job.approvalId); return React.createElement("div", { className: "inspector-section", key: job.id },
                React.createElement("h3", null,
                    "\u56FA\u5B9A\u89E3\u6790\u4EFB\u52A1 ",
                    short(job.id)),
                React.createElement("div", { className: "actions" },
                    React.createElement(Badge, { value: job.state }),
                    React.createElement(Badge, { value: job.integrity })),
                React.createElement("dl", { className: "details" },
                    React.createElement("dt", null, "\u539F\u4EF6\u6458\u8981"),
                    React.createElement("dd", null,
                        React.createElement("code", { className: "digest" }, job.rawDigest)),
                    React.createElement("dt", null, "\u89E3\u6790\u955C\u50CF"),
                    React.createElement("dd", null,
                        React.createElement("code", { className: "digest" }, job.imageDigest)),
                    React.createElement("dt", null, "\u89E3\u6790\u914D\u7F6E"),
                    React.createElement("dd", null, job.profileId),
                    React.createElement("dt", null, "\u8D44\u6E90"),
                    React.createElement("dd", null, Object.entries(job.resources).map(([key, value]) => `${key}=${value}`).join(' · '))),
                job.error ? React.createElement("p", { className: "error-text" }, job.error) : null,
                job.state === 'prepared' && approval?.status === 'pending' ? React.createElement("div", { className: "actions" },
                    React.createElement("button", { className: "primary", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), '已批准固定解析，尚未提交') }, "\u6279\u51C6\u56FA\u5B9A\u6587\u6863\u89E3\u6790"),
                    React.createElement("button", { className: "secondary", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })) }, "\u62D2\u7EDD\u89E3\u6790")) : null,
                job.state === 'prepared' && approval?.status === 'approved' ? React.createElement("button", { className: "primary", onClick: () => perform(() => call(data.project.id, 'document_parse_submit', { jobId: job.id }), '解析已进入共享计算队列') }, "\u63D0\u4EA4\u5DF2\u6279\u51C6\u89E3\u6790") : null,
                ['prepared', 'queued', 'starting', 'running', 'unknown'].includes(job.state) ? React.createElement("button", { className: "text-button danger", onClick: () => perform(() => call(data.project.id, 'document_parse_cancel', { jobId: job.id })) }, "\u8BF7\u6C42\u53D6\u6D88\u89E3\u6790") : null,
                job.state === 'succeeded' && job.integrity === 'complete' && job.resultId ? React.createElement("button", { className: "secondary", onClick: () => this.props.onLocation({ documentVersionId: d.id, parseResultId: job.resultId, pageNumber: 1 }) }, "\u67E5\u770B\u6B64\u56FA\u5B9A\u89E3\u6790\u7ED3\u679C") : null); }),
            this.props.location?.parseResultId ? React.createElement(DocumentPages, { key: this.props.location.parseResultId, document: d, projectId: data.project.id, resultId: this.props.location.parseResultId, pageNumber: this.props.location.pageNumber ?? 1, start: this.props.location.start, end: this.props.location.end, onPage: pageNumber => this.props.onLocation({ documentVersionId: d.id, parseResultId: this.props.location.parseResultId, pageNumber }), perform: perform }) : null);
    }
}
class DocumentPages extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { list: null, page: null, content: '', base: 0, cursor: 0, complete: false, imageURL: '', loading: false, error: '', start: 0, end: 0, description: '' };
        this.epoch = 0;
        this.listEpoch = 0;
        this.imageURL = '';
        this.mounted = true;
    }
    componentDidMount() { void this.loadList(); void this.readPage(); }
    componentDidUpdate(prev) { if (prev.pageNumber !== this.props.pageNumber)
        void this.loadList(); if (prev.pageNumber !== this.props.pageNumber || prev.start !== this.props.start || prev.end !== this.props.end)
        void this.readPage(); }
    componentWillUnmount() { this.mounted = false; this.epoch++; this.listEpoch++; this.controller?.abort(); this.revokeImage(); }
    revokeImage() { if (this.imageURL) {
        URL.revokeObjectURL(this.imageURL);
        this.imageURL = '';
    } }
    verify(value) { if (value.resultId !== this.props.resultId || value.documentVersionId !== this.props.document.id || value.rawDigest !== this.props.document.original.digest)
        throw Error('解析结果不属于所选固定原件，未显示其他版本。'); }
    async loadList(cursor = Math.floor((this.props.pageNumber - 1) / 20) * 20) { const epoch = ++this.listEpoch; try {
        const list = await call(this.props.projectId, 'document_pages', { parseResultId: this.props.resultId, cursor, limit: 20 });
        this.verify(list);
        if (this.mounted && epoch === this.listEpoch)
            this.setState({ list });
    }
    catch (error) {
        if (this.mounted && epoch === this.listEpoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    } }
    async readPage(append = false) {
        if (append && this.state.loading)
            return;
        const epoch = ++this.epoch;
        this.controller?.abort();
        const controller = new AbortController();
        this.controller = controller;
        if (!append) {
            this.revokeImage();
            this.setState({ page: null, content: '', base: this.props.start ?? 0, cursor: this.props.start ?? 0, complete: false, imageURL: '', start: this.props.start ?? 0, end: this.props.end ?? 0, description: '' });
        }
        const cursor = append ? this.state.cursor : this.props.start ?? 0;
        this.setState({ loading: true, error: '' });
        try {
            if ((this.props.start !== undefined || this.props.end !== undefined) && (!Number.isSafeInteger(this.props.start) || !Number.isSafeInteger(this.props.end) || this.props.start < 0 || this.props.end <= this.props.start))
                throw Error('证据引用区间无效，未替换为页首。');
            const page = await api('/operations/document_page_read', { projectId: this.props.projectId, input: { parseResultId: this.props.resultId, pageNumber: this.props.pageNumber, cursor, limit: 16000 } }, 'POST', controller.signal);
            this.verify(page);
            if (page.pageNumber !== this.props.pageNumber)
                throw Error('返回物理页号与选择不一致。');
            if (page.cursor !== cursor || page.end - page.cursor !== page.content.length)
                throw Error('页文本窗口与请求区间不一致。');
            if (!this.mounted || epoch !== this.epoch)
                return;
            this.setState({ page, content: (append ? this.state.content : '') + page.content, cursor: page.end, complete: page.complete, ...(!append ? { base: page.cursor, start: this.props.start ?? page.cursor, end: this.props.end ?? Math.min(page.end, page.cursor + 2000) } : {}) });
            if (!append) {
                const png = await verifiedPageImage(await artifactBlob(page.imageArtifactId, controller.signal), page.imageArtifactDigest);
                if (!this.mounted || epoch !== this.epoch)
                    return;
                this.imageURL = URL.createObjectURL(png);
                this.setState({ imageURL: this.imageURL });
            }
        }
        catch (error) {
            if (this.mounted && epoch === this.epoch && !controller.signal.aborted)
                this.setState({ error: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (this.mounted && epoch === this.epoch)
                this.setState({ loading: false });
        }
    }
    render() {
        const s = this.state, p = s.page, list = s.list;
        return React.createElement("div", { className: "inspector-section" },
            React.createElement("h3", null,
                "\u56FA\u5B9A\u89E3\u6790\u7248\u672C ",
                short(this.props.resultId)),
            list ? React.createElement("div", null,
                React.createElement("p", null,
                    "\u7269\u7406\u9875\u603B\u6570 ",
                    list.pageCount,
                    " \u00B7 PDF\u7248\u672C\u6838\u9A8C ",
                    list.versionAssurance,
                    " \u00B7 \u8BF7\u6C42 ",
                    list.requestedVersion ?? '未指定',
                    " / \u89C2\u5BDF ",
                    list.observedVersion ?? '未知'),
                React.createElement("p", { className: "small muted" },
                    "\u9605\u8BFB\u987A\u5E8F ",
                    list.quality.readingOrder,
                    "\uFF1B\u6BB5\u843D ",
                    list.quality.paragraphs,
                    "\uFF1B\u8868\u683C ",
                    list.quality.tables,
                    "\uFF1B\u56FE\u7ED3\u6784 ",
                    list.quality.figures,
                    "\uFF1BOCR ",
                    list.quality.ocr ? '已启用' : '未启用',
                    "\u3002\u9875\u56FE\u53EF\u56DE\u770B\u539F\u56FE\u8868\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u7ECF\u53EF\u9760\u62BD\u53D6\u7ED3\u6784\u3002"),
                React.createElement("label", null,
                    "\u56FA\u5B9A\u7269\u7406\u9875",
                    React.createElement("select", { "aria-label": "\u56FA\u5B9A\u7269\u7406\u9875", value: list.items.some(x => x.pageNumber === this.props.pageNumber) ? this.props.pageNumber : '', onChange: (e) => { if (e.target.value)
                            this.props.onPage(Number(e.target.value)); } },
                        React.createElement("option", { value: "" }, "\u9009\u62E9\u6B64\u6E05\u5355\u4E2D\u7684\u7269\u7406\u9875"),
                        list.items.map(page => React.createElement("option", { key: page.pageNumber, value: page.pageNumber },
                            "\u7269\u7406\u9875 ",
                            page.pageNumber,
                            " \u00B7 \u9875\u6807\u7B7E ",
                            page.pageLabel ?? '未知')))),
                React.createElement("div", { className: "actions wrap" },
                    React.createElement("button", { className: "secondary compact", disabled: list.cursor === 0, onClick: () => void this.loadList(Math.max(0, list.cursor - 20)) }, "\u4E0A\u4E00\u6279\u9875\u6E05\u5355"),
                    React.createElement("button", { className: "secondary compact", disabled: list.complete, onClick: () => void this.loadList(list.end) }, "\u4E0B\u4E00\u6279\u9875\u6E05\u5355"))) : React.createElement("p", { role: "status" }, "\u8BFB\u53D6\u9875\u6E05\u5355\u2026"),
            s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
            p ? React.createElement("div", null,
                React.createElement("h4", null,
                    "\u7269\u7406\u9875 ",
                    p.pageNumber,
                    " \u00B7 \u9875\u6807\u7B7E ",
                    p.pageLabel ?? '未知'),
                React.createElement("p", { className: "small muted" }, "\u539F\u4EF6\u6458\u8981"),
                React.createElement("code", { className: "digest" }, this.props.document.original.digest),
                React.createElement("p", { className: "small muted" }, "\u9875\u6587\u672C\u6458\u8981"),
                React.createElement("code", { className: "digest" }, p.textArtifactDigest),
                s.imageURL ? React.createElement("img", { src: s.imageURL, alt: `固定原文物理页 ${p.pageNumber}`, style: { maxWidth: '100%', height: 'auto' }, onError: () => this.setState({ error: '浏览器无法解码已固定页图，请重新读取或下载原始 PDF 核对。' }) }) : React.createElement("p", { role: "status" }, s.loading ? '正在读取并核对固定 PNG 页图…' : '页图尚不可用。'),
                p.textStatus === 'no-text-layer' ? React.createElement("p", { className: "inline-warning" }, "\u6B64\u9875\u6CA1\u6709\u53EF\u63D0\u53D6\u6587\u5B57\u5C42\uFF1B\u672A\u542F\u52A8 OCR\uFF0C\u4E0D\u80FD\u51ED\u9875\u56FE\u4F2A\u9020\u6587\u672C\u5B9A\u4F4D\u3002") : null,
                React.createElement("pre", { className: "document-preview" }, s.content || '（此页无提取文本）'),
                React.createElement("p", { className: "small muted" },
                    "\u5F53\u524D\u7A97\u53E3 UTF-16 \u533A\u95F4 [",
                    s.base,
                    ", ",
                    s.cursor,
                    ")",
                    s.complete ? '，已到该页文本末尾' : '；后续文本尚未加载',
                    s.base > 0 ? '；本窗口不包含此前原文' : '',
                    "\u3002"),
                this.props.start !== undefined ? React.createElement("p", { className: "small muted" },
                    "\u5F15\u7528\u533A\u95F4 [",
                    this.props.start,
                    ", ",
                    this.props.end,
                    ")",
                    this.props.end > s.cursor ? ' 尚未完整载入，请继续读取后续文本。' : ' 已定位，起止位置已预选。') : null,
                React.createElement("button", { className: "secondary compact", disabled: s.loading || s.complete, onClick: () => void this.readPage(true) }, "\u8BFB\u53D6\u6B64\u9875\u540E\u7EED\u6587\u672C"),
                React.createElement("button", { className: "text-button", disabled: s.loading, onClick: () => void this.readPage() }, "\u91CD\u65B0\u8BFB\u53D6\u6B64\u7269\u7406\u9875"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void this.props.perform(() => call(this.props.projectId, 'document_evidence_register', { documentVersionId: this.props.document.id, parseResultId: this.props.resultId, pageNumber: p.pageNumber, start: s.start, end: s.end, description: s.description }), '已登记绑定原件和解析版本的页段证据'); } },
                    React.createElement("label", null,
                        "\u9009\u62E9\u5DF2\u52A0\u8F7D\u7684\u63D0\u53D6\u6BB5\u843D",
                        React.createElement("select", { "aria-label": "\u63D0\u53D6\u6BB5\u843D", defaultValue: "", onChange: (e) => { const paragraph = p.paragraphs.find(x => String(x.index) === e.target.value); if (paragraph)
                                this.setState({ start: paragraph.start, end: paragraph.end }); } },
                            React.createElement("option", { value: "" }, "\u624B\u52A8\u6307\u5B9A\u533A\u95F4\u6216\u9009\u62E9\u6BB5\u843D"),
                            p.paragraphs.map(x => React.createElement("option", { key: x.index, value: x.index, disabled: x.start < s.base || x.end > s.cursor },
                                "\u6BB5\u843D ",
                                x.index,
                                " \u00B7 [",
                                x.start,
                                ", ",
                                x.end,
                                ")",
                                x.start < s.base || x.end > s.cursor ? '（不在当前窗口）' : '')))),
                    React.createElement("div", { className: "form-columns" },
                        React.createElement("label", null,
                            "\u8D77\u59CB UTF-16 \u4F4D\u7F6E",
                            React.createElement("input", { type: "number", min: s.base, max: s.cursor, required: true, value: s.start, onChange: (e) => this.setState({ start: Number(e.target.value) }) })),
                        React.createElement("label", null,
                            "\u7ED3\u675F UTF-16 \u4F4D\u7F6E",
                            React.createElement("input", { type: "number", min: s.start + 1, max: s.cursor, required: true, value: s.end, onChange: (e) => this.setState({ end: Number(e.target.value) }) }))),
                    React.createElement("label", null,
                        "\u8BC1\u636E\u8BF4\u660E",
                        React.createElement("input", { required: true, "aria-label": "\u9875\u6BB5\u8BC1\u636E\u8BF4\u660E", value: s.description, onChange: (e) => this.setState({ description: e.target.value }) })),
                    React.createElement("blockquote", { "aria-label": "\u9009\u4E2D\u8BC1\u636E\u539F\u6587" }, s.content.slice(Math.max(0, s.start - s.base), Math.max(0, s.end - s.base))),
                    React.createElement("button", { className: "primary", disabled: s.loading || !!s.error || !s.content.slice(s.start - s.base, s.end - s.base).trim() || s.end > s.cursor || s.start < s.base || s.end <= s.start || !s.description.trim() }, "\u767B\u8BB0\u56FA\u5B9A\u9875\u6BB5\u8BC1\u636E"))) : null);
    }
}
