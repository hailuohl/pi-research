import { api, artifactText, downloadArtifact } from './api.js';
import { short } from './models.js';
import { Badge } from './ui.js';
const sources = ['crossref', 'alphaxiv', 'openalex', 'biorxiv', 'pubmed'];
const initialSearch = () => ({ query: '', sources: ['crossref'], limit: 2, strategy: 'keyword', prioritize: 'default' });
const initialTarget = () => ({ source: 'crossref', id: '', format: 'provider-text' });
const expiry = () => { const d = new Date(Date.now() + 3600000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
export function discoveryDraft(input) {
    const searches = input.searches.filter(s => s.query.trim()).map(s => ({ ...s, query: s.query.trim() })), targets = input.targets.filter(t => t.id.trim()).map(t => ({ ...t, id: t.id.trim(), ...(t.requestedVersion?.trim() ? { requestedVersion: t.requestedVersion.trim() } : {}) }));
    const maxRequests = Number(input.maxRequests), maxResponseBytes = Number(input.maxResponseBytes), date = new Date(input.expiresAt), duration = date.getTime() - Date.now();
    if (!input.sessionId || !searches.length && !targets.length)
        throw Error('请选择主会话并填写至少一项精确检索或资料');
    if (searches.length > 8 || targets.length > 20)
        throw Error('最多8项检索和20项目标');
    if (searches.some(s => !s.sources.length || !Number.isInteger(s.limit) || s.limit < 1 || s.limit > 20))
        throw Error('每项检索需要来源，结果上限为 1–20');
    if (!input.formats.length || targets.some(t => !input.formats.includes(t.format)))
        throw Error('请选择允许的内容格式，明确资料格式须在范围内');
    if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 100 || !Number.isInteger(maxResponseBytes) || maxResponseBytes < 1024 || maxResponseBytes > 33554432)
        throw Error('HTTP次数须为1–100，单响应字节上限须为1 KiB–32 MiB');
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 3600000)
        throw Error('截止时间须在未来24小时内');
    return { sessionId: input.sessionId, searches, targets, formats: input.formats, allowSearchResults: input.allowSearchResults && searches.length > 0, maxRequests, maxResponseBytes, expiresAt: date.toISOString() };
}
export const discoveryUsable = (g) => !!g && g.effectiveState === 'active' && g.validity === 'current' && g.usage.remaining > 0 && Date.parse(g.expiresAt) > Date.now();
const signature = (p) => JSON.stringify([p.data.discoveryGrants, p.data.approvals, p.data.sessions.map(s => [s.id, s.version, s.discoveryGrantId])]);
export class DiscoveryGrants extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { selected: '', inspection: null, reading: false, error: '', preview: '', sessionId: '', searches: [initialSearch()], targets: [], allowSearchResults: true, formats: ['provider-text'], maxRequests: 2, maxResponseBytes: 262144, expiresAt: expiry() };
        this.mounted = true;
        this.epoch = 0;
    }
    componentDidMount() { const id = this.props.selectedGrant || (this.props.data.discoveryGrants ?? []).slice(-1)[0]?.id; if (id)
        void this.inspect(id); }
    componentWillUnmount() { this.mounted = false; this.epoch++; }
    componentDidUpdate(previous) { if (previous.data.project.id !== this.props.data.project.id) {
        this.epoch++;
        this.setState({ selected: '', inspection: null, reading: false, error: '' });
    }
    else if (previous.selectedGrant !== this.props.selectedGrant) {
        if (this.props.selectedGrant)
            void this.inspect(this.props.selectedGrant);
        else {
            this.epoch++;
            this.setState({ selected: '', inspection: null, reading: false, error: '' });
        }
    }
    else if (signature(previous) !== signature(this.props) && this.state.selected)
        void this.inspect(this.state.selected); }
    call(name, input) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input }); }
    select(id) { if (this.props.onSelect && id !== this.props.selectedGrant)
        this.props.onSelect(id);
    else
        void this.inspect(id); }
    async inspect(grantId) { const epoch = ++this.epoch, projectId = this.props.data.project.id; this.setState({ selected: grantId, inspection: null, reading: true, error: '', preview: '' }); try {
        const grant = await this.call('discovery_grant_inspect', { grantId });
        if (grant.id !== grantId || grant.projectId !== projectId)
            throw Error('授权不属于所选项目与记录');
        if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id)
            this.setState({ inspection: grant });
    }
    catch (error) {
        if (this.mounted && epoch === this.epoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        if (this.mounted && epoch === this.epoch)
            this.setState({ reading: false });
    } }
    async readPaper(artifactId) { const epoch = this.epoch; await this.props.perform(async () => { const content = await artifactText(artifactId); if (this.mounted && epoch === this.epoch)
        this.setState({ preview: content.slice(0, 65536) + (content.length > 65536 ? '\n…只预览前65,536字符。' : '') }); }); }
    async prepare() { let input; try {
        input = discoveryDraft(this.state);
    }
    catch (error) {
        this.setState({ error: error instanceof Error ? error.message : String(error) });
        return;
    } const epoch = this.epoch, projectId = this.props.data.project.id; await this.props.perform(async () => { const grant = await this.call('discovery_grant_prepare', input); if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id)
        this.select(grant.id); }, '文献发现授权草案已保存；等待单独批准'); }
    render() {
        const { data, perform } = this.props, s = this.state, g = s.inspection, approval = data.approvals.find(a => a.id === g?.approvalId);
        return React.createElement("section", { className: "surface report-builder" },
            React.createElement("h2", null, "\u9650\u5B9A\u6587\u732E\u53D1\u73B0\u6388\u6743"),
            React.createElement("p", { className: "small muted" }, "\u56FA\u5B9A\u4E3B\u4F1A\u8BDD\u3001\u7CBE\u786E\u68C0\u7D22\u4E0E\u8D44\u6599\u3001\u6765\u6E90\u3001\u683C\u5F0F\u3001\u5355\u54CD\u5E94\u5927\u5C0F\u3001HTTP\u8BF7\u6C42\u6B21\u6570\u548C\u671F\u9650\u3002\u51C6\u5907\u3001\u6279\u51C6\u548C\u6FC0\u6D3B\u5747\u4E0D\u53D1\u9001\u7F51\u7EDC\u8BF7\u6C42\uFF0C\u4E5F\u4E0D\u542F\u7528\u6765\u6E90\u3002"),
            React.createElement("details", null,
                React.createElement("summary", null, "\u51C6\u5907 DiscoveryGrant \u8349\u6848"),
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void this.prepare(); } },
                    React.createElement("label", null,
                        "\u6307\u5B9A\u4E3B\u534F\u8C03\u4F1A\u8BDD",
                        React.createElement("select", { "aria-label": "\u53D1\u73B0\u6388\u6743\u4E3B\u4F1A\u8BDD", required: true, value: s.sessionId, onChange: (e) => this.setState({ sessionId: e.target.value }) },
                            React.createElement("option", { value: "" }, "\u9009\u62E9\u672A\u7ED1\u5B9A\u53D1\u73B0\u6388\u6743\u7684\u4E3B\u4F1A\u8BDD"),
                            data.sessions.filter(row => row.role === 'coordinator' && !row.taskId && row.state !== 'archived' && !row.discoveryGrantId).map(row => React.createElement("option", { key: row.id, value: row.id },
                                row.title,
                                " \u00B7 ",
                                short(row.id))))),
                    React.createElement("fieldset", null,
                        React.createElement("legend", null, "\u51BB\u7ED3\u7684\u7CBE\u786E\u68C0\u7D22"),
                        s.searches.map((search, index) => React.createElement("div", { className: "inspector-section", key: index },
                            React.createElement("label", null,
                                "\u68C0\u7D22\u8BCD ",
                                index + 1,
                                React.createElement("input", { "aria-label": `授权检索词 ${index + 1}`, maxLength: 500, value: search.query, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, query: e.target.value } : item) }) })),
                            React.createElement("div", { className: "form-columns" },
                                React.createElement("label", null,
                                    "\u6765\u6E90",
                                    React.createElement("select", { "aria-label": `授权检索来源 ${index + 1}`, value: search.sources[0], onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, sources: [e.target.value] } : item) }) }, sources.map(source => React.createElement("option", { key: source }, source)))),
                                React.createElement("label", null,
                                    "\u6700\u591A\u7ED3\u679C",
                                    React.createElement("input", { "aria-label": `授权结果上限 ${index + 1}`, type: "number", min: 1, max: 20, value: search.limit, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, limit: Number(e.target.value) } : item) }) })),
                                React.createElement("label", null,
                                    "\u7B56\u7565",
                                    React.createElement("select", { value: search.strategy, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, strategy: e.target.value } : item) }) },
                                        React.createElement("option", { value: "keyword" }, "\u5173\u952E\u8BCD"),
                                        React.createElement("option", { value: "embedding" }, "\u8BED\u4E49"))),
                                React.createElement("label", null,
                                    "\u6392\u5E8F",
                                    React.createElement("select", { value: search.prioritize, onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, prioritize: e.target.value } : item) }) },
                                        React.createElement("option", { value: "default" }, "\u9ED8\u8BA4"),
                                        React.createElement("option", { value: "recency" }, "\u6700\u8FD1"),
                                        React.createElement("option", { value: "historical" }, "\u5386\u53F2"),
                                        React.createElement("option", { value: "popular" }, "\u70ED\u95E8"))),
                                React.createElement("label", null,
                                    "\u53D1\u8868\u65E5\u671F\u8D77",
                                    React.createElement("input", { type: "date", value: search.publishedAfter ?? '', onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, publishedAfter: e.target.value || undefined } : item) }) })),
                                React.createElement("label", null,
                                    "\u53D1\u8868\u65E5\u671F\u6B62",
                                    React.createElement("input", { type: "date", value: search.publishedBefore ?? '', onChange: (e) => this.setState({ searches: s.searches.map((item, i) => i === index ? { ...item, publishedBefore: e.target.value || undefined } : item) }) }))),
                            React.createElement("button", { type: "button", className: "text-button", onClick: () => this.setState({ searches: s.searches.filter((_, i) => i !== index) }) }, "\u79FB\u9664\u6B64\u68C0\u7D22"))),
                        React.createElement("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ searches: [...s.searches, initialSearch()] }) }, "\u6DFB\u52A0\u68C0\u7D22")),
                    React.createElement("fieldset", null,
                        React.createElement("legend", null, "\u660E\u786E\u8D44\u6599\u6807\u8BC6\uFF08\u53EF\u9009\uFF09"),
                        s.targets.map((target, index) => React.createElement("div", { className: "inspector-section", key: index },
                            React.createElement("div", { className: "form-columns" },
                                React.createElement("label", null,
                                    "\u6765\u6E90",
                                    React.createElement("select", { value: target.source, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, source: e.target.value } : item) }) }, sources.map(source => React.createElement("option", { key: source }, source)))),
                                React.createElement("label", null,
                                    "\u8D44\u6599 ID",
                                    React.createElement("input", { "aria-label": `资料标识 ${index + 1}`, value: target.id, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, id: e.target.value } : item) }) })),
                                React.createElement("label", null,
                                    "\u5185\u5BB9\u683C\u5F0F",
                                    React.createElement("select", { value: target.format, onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, format: e.target.value } : item) }) },
                                        React.createElement("option", { value: "provider-text" }, "\u4F9B\u5E94\u5546\u6587\u672C/\u5143\u6570\u636E"),
                                        React.createElement("option", { value: "original-pdf" }, "\u539F\u59CB PDF"))),
                                React.createElement("label", null,
                                    "\u8BF7\u6C42\u7248\u672C",
                                    React.createElement("input", { value: target.requestedVersion ?? '', onChange: (e) => this.setState({ targets: s.targets.map((item, i) => i === index ? { ...item, requestedVersion: e.target.value } : item) }) }))),
                            React.createElement("button", { type: "button", className: "text-button", onClick: () => this.setState({ targets: s.targets.filter((_, i) => i !== index) }) }, "\u79FB\u9664\u6B64\u8D44\u6599"))),
                        React.createElement("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ targets: [...s.targets, initialTarget()] }) }, "\u6DFB\u52A0\u660E\u786E\u8D44\u6599")),
                    React.createElement("label", { className: "check-label" },
                        React.createElement("input", { type: "checkbox", disabled: !s.searches.some(search => search.query.trim()), checked: s.allowSearchResults && s.searches.some(search => search.query.trim()), onChange: (e) => this.setState({ allowSearchResults: e.target.checked }) }),
                        "\u5141\u8BB8\u8BFB\u53D6\u672C\u6388\u6743\u68C0\u7D22\u547D\u4E2D\u7684\u8D44\u6599"),
                    React.createElement("fieldset", null,
                        React.createElement("legend", null, "\u5141\u8BB8\u7684\u5185\u5BB9\u683C\u5F0F"),
                        ['provider-text', 'original-pdf'].map(format => React.createElement("label", { className: "check-label", key: format },
                            React.createElement("input", { type: "checkbox", checked: s.formats.includes(format), onChange: (e) => this.setState({ formats: e.target.checked ? [...s.formats, format] : s.formats.filter(x => x !== format) }) }),
                            format === 'provider-text' ? '供应商文本/元数据' : '原始 PDF'))),
                    React.createElement("div", { className: "form-columns" },
                        React.createElement("label", null,
                            "\u6700\u591A HTTP \u8BF7\u6C42\u6B21\u6570",
                            React.createElement("input", { type: "number", min: 1, max: 100, required: true, value: s.maxRequests, onChange: (e) => this.setState({ maxRequests: Number(e.target.value) }) })),
                        React.createElement("label", null,
                            "\u5355\u54CD\u5E94\u5B57\u8282\u4E0A\u9650",
                            React.createElement("input", { type: "number", min: 1024, max: 33554432, required: true, value: s.maxResponseBytes, onChange: (e) => this.setState({ maxResponseBytes: Number(e.target.value) }) })),
                        React.createElement("label", null,
                            "\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF0C24\u5C0F\u65F6\u5185\uFF09",
                            React.createElement("input", { type: "datetime-local", required: true, value: s.expiresAt, onChange: (e) => this.setState({ expiresAt: e.target.value }) }))),
                    React.createElement("button", { className: "secondary", disabled: !s.sessionId }, "\u4FDD\u5B58\u56FA\u5B9A\u8303\u56F4\u8349\u6848"))),
            (data.discoveryGrants ?? []).length ? React.createElement("label", null,
                "\u67E5\u770B\u53D1\u73B0\u6388\u6743",
                React.createElement("select", { "aria-label": "\u67E5\u770B\u53D1\u73B0\u6388\u6743", value: s.selected, onChange: (e) => this.select(e.target.value) },
                    React.createElement("option", { value: "", disabled: true }, "\u9009\u62E9\u6388\u6743"),
                    (data.discoveryGrants ?? []).map(row => React.createElement("option", { key: row.id, value: row.id },
                        short(row.id),
                        " \u00B7 ",
                        row.state)))) : React.createElement("p", { className: "inline-empty" }, "\u6682\u65E0 DiscoveryGrant\u3002"),
            s.selected ? React.createElement("button", { className: "text-button", onClick: () => void this.inspect(s.selected) }, "\u5237\u65B0\u56FA\u5B9A\u8303\u56F4\u4E0E\u8BA1\u6B21") : null,
            s.reading ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u56DE\u67E5\u53D1\u73B0\u6388\u6743\u2026") : null,
            s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
            g ? React.createElement("div", null,
                React.createElement("h3", null,
                    "DiscoveryGrant ",
                    short(g.id),
                    " ",
                    React.createElement(Badge, { value: g.state })),
                React.createElement("p", null,
                    "\u72B6\u6001\uFF1A",
                    g.effectiveState,
                    " \u00B7 ",
                    g.validity,
                    " \u00B7 \u5DF2\u7528 ",
                    g.usage.used,
                    "/",
                    g.usage.limit,
                    " \u6B21 HTTP \u8BF7\u6C42\u5C1D\u8BD5\uFF0C\u5269\u4F59 ",
                    g.usage.remaining,
                    " \u6B21\u3002\u5931\u8D25\u548C\u672A\u77E5\u8BF7\u6C42\u4E0D\u9000\u6B3E\u3002"),
                g.reasons?.map((reason, i) => React.createElement("p", { key: i, role: "status" }, reason)),
                React.createElement("dl", { className: "details" },
                    React.createElement("dt", null, "\u4E3B\u4F1A\u8BDD"),
                    React.createElement("dd", null,
                        short(g.sessionId),
                        " ",
                        this.props.onSession ? React.createElement("button", { className: "text-button", onClick: () => this.props.onSession?.(g.sessionId) }, "\u6253\u5F00\u4F1A\u8BDD") : null),
                    React.createElement("dt", null, "\u56FA\u5B9A\u6A21\u578B"),
                    React.createElement("dd", null,
                        g.model.provider,
                        " / ",
                        g.model.model),
                    React.createElement("dt", null, "\u6765\u6E90 / \u8BBE\u7F6E\u7248\u672C"),
                    React.createElement("dd", null,
                        g.sources.join('、'),
                        " / ",
                        g.settingsVersion),
                    React.createElement("dt", null, "\u6279\u51C6\u8BB0\u5F55"),
                    React.createElement("dd", null, short(g.approvalId)),
                    React.createElement("dt", null, "\u56FA\u5B9A\u6458\u8981"),
                    React.createElement("dd", null,
                        React.createElement("code", { className: "digest code-wrap" }, g.digest)),
                    React.createElement("dt", null, "\u622A\u6B62"),
                    React.createElement("dd", null, g.expiresAt),
                    React.createElement("dt", null, "\u5355\u54CD\u5E94\u4E0A\u9650"),
                    React.createElement("dd", null,
                        g.maxResponseBytes,
                        " \u5B57\u8282"),
                    React.createElement("dt", null, "\u5141\u8BB8\u683C\u5F0F"),
                    React.createElement("dd", null, g.formats.join('、'))),
                React.createElement("h4", null, "\u7CBE\u786E\u68C0\u7D22"),
                g.searches.map((search, i) => React.createElement("div", { className: "inspector-section", key: i },
                    React.createElement("p", null,
                        search.query,
                        " \u00B7 ",
                        search.sources.join('、'),
                        " \u00B7 \u6700\u591A ",
                        search.limit,
                        " \u6761 \u00B7 ",
                        search.strategy,
                        "/",
                        search.prioritize,
                        " ",
                        search.publishedAfter ?? '',
                        " ",
                        search.publishedBefore ?? ''),
                    React.createElement("button", { className: "secondary compact", disabled: !discoveryUsable(g), onClick: () => this.props.onSearch?.(search, g.id) }, "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u68C0\u7D22"))),
                !g.searches.length ? React.createElement("p", null, "\u672A\u5305\u542B\u68C0\u7D22\u8BF7\u6C42") : null,
                React.createElement("h4", null, "\u660E\u786E\u8D44\u6599"),
                g.targets.map((target, i) => React.createElement("div", { className: "inspector-section", key: i },
                    React.createElement("p", null,
                        target.source,
                        " \u00B7 ",
                        target.id,
                        " \u00B7 ",
                        target.format,
                        " \u00B7 ",
                        target.requestedVersion ?? '未指定版本'),
                    React.createElement("button", { className: "secondary compact", disabled: !discoveryUsable(g), onClick: () => this.props.onTarget?.(target, g.id) }, "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u8D44\u6599\u83B7\u53D6"))),
                React.createElement("p", null,
                    "\u68C0\u7D22\u547D\u4E2D\u8D44\u6599\uFF1A",
                    g.allowSearchResults ? '允许（仅限本授权任务产生的命中）' : '不允许'),
                React.createElement("div", { className: "actions" },
                    g.state === 'draft' && approval?.status === 'pending' ? React.createElement("button", { className: "primary", disabled: g.validity !== 'current', onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), '发现授权已批准，尚未激活') }, "\u6279\u51C6\u56FA\u5B9A\u8303\u56F4") : null,
                    g.state === 'draft' && approval?.status === 'approved' ? React.createElement("button", { className: "primary", disabled: g.validity !== 'current', onClick: () => perform(() => this.call('discovery_grant_activate', { grantId: g.id, expectedVersion: g.version }), '发现授权已激活；未发网络请求') }, "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u6388\u6743") : null,
                    g.state !== 'revoked' ? React.createElement("button", { className: "secondary", onClick: () => perform(() => this.call('discovery_grant_revoke', { grantId: g.id, expectedVersion: g.version }), '发现授权已撤销') }, "\u64A4\u9500\u6388\u6743") : null),
                React.createElement("h4", null, "\u5B9E\u9645 HTTP \u8BF7\u6C42\u8BB0\u5F55"),
                g.calls.length ? g.calls.map(call => React.createElement("div", { className: "inspector-section", key: call.id },
                    React.createElement("p", null,
                        short(call.id),
                        " \u00B7 ",
                        call.source,
                        " \u00B7 ",
                        call.host,
                        " \u00B7 ",
                        call.status,
                        " \u00B7 ",
                        call.startedAt),
                    React.createElement("p", null,
                        "HTTP ",
                        call.httpStatus ?? '—',
                        " \u00B7 ",
                        call.bytes ?? '—',
                        " \u5B57\u8282 \u00B7 ",
                        call.error ?? '无错误'))) : React.createElement("p", { className: "inline-empty" }, "\u5C1A\u65E0\u8BF7\u6C42\u8BB0\u5F55\uFF1B\u6279\u51C6\u548C\u6FC0\u6D3B\u4E0D\u4F1A\u4EA7\u751F\u8BF7\u6C42\u3002"),
                React.createElement("h4", null, "\u672C\u6388\u6743\u56FA\u5B9A\u68C0\u7D22\u8BB0\u5F55"),
                g.searchResults.map(record => React.createElement("div", { className: "inspector-section", key: record.id },
                    React.createElement("p", null,
                        record.query,
                        " \u00B7 ",
                        short(record.id),
                        " \u00B7 ",
                        record.status,
                        " \u00B7 ",
                        record.retrievedAt),
                    React.createElement("p", null,
                        record.items.length,
                        " \u6761\u5019\u9009\uFF1B\u6765\u6E90 ",
                        record.sources.map(source => `${source.source}:${source.status}`).join('、')))),
                !g.searchResults.length ? React.createElement("p", { className: "inline-empty" }, "\u5C1A\u65E0\u56FA\u5B9A\u68C0\u7D22\u7ED3\u679C\u3002") : null,
                React.createElement("h4", null, "\u672C\u6388\u6743\u5DF2\u5F52\u6863\u8D44\u6599"),
                g.papers.map(paper => React.createElement("div", { className: "inspector-section", key: paper.id },
                    React.createElement("p", null,
                        paper.title,
                        " \u00B7 ",
                        paper.source,
                        "/",
                        paper.idInSource,
                        " \u00B7 ",
                        short(paper.id)),
                    React.createElement("p", null,
                        paper.contentKind,
                        " \u00B7 ",
                        paper.fullTextRead ? '已读取正文' : '未读取全文',
                        " \u00B7 \u56FA\u5B9A\u539F\u4EF6 ",
                        paper.rawArtifactIds.map(short).join('、')),
                    React.createElement("button", { className: "secondary compact", onClick: () => void this.readPaper(paper.artifactId) }, "\u67E5\u770B\u5DF2\u5F52\u6863\u5185\u5BB9"),
                    paper.rawArtifactIds.map((id, index) => React.createElement("button", { className: "secondary compact", key: id, onClick: () => perform(() => downloadArtifact(id, `discovery-response-${short(paper.id)}-${index + 1}`)) },
                        "\u4E0B\u8F7D\u539F\u59CB\u54CD\u5E94 ",
                        index + 1)))),
                !g.papers.length ? React.createElement("p", { className: "inline-empty" }, "\u5C1A\u65E0\u672C\u6388\u6743\u5F52\u6863\u8D44\u6599\u3002") : null,
                s.preview ? React.createElement("pre", { className: "document-preview" }, s.preview) : null) : null);
    }
}
