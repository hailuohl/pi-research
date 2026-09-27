import { api, artifactText } from './api.js';
import { short } from './models.js';
/** Optional local retrieval; nothing runs until the owner selects and enables a corpus. */
export class TextEvidencePanel extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { selected: null, query: '', mmrLambda: 1, result: null, loading: false, sourcePreview: '' };
    }
    render() {
        const { data, perform } = this.props;
        const config = data.textEvidence ?? { enabled: false, version: 0, sources: [] };
        const eligible = data.artifacts.filter(a => a.origin === 'user' && !a.taskId && !a.runId && !a.wakeupId &&
            ['text/plain', 'text/markdown'].includes(a.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(a.title));
        const saved = config.sources.map((s) => s.artifactId);
        const selected = this.state.selected ?? saved;
        const selectionChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort());
        const result = this.state.result, stale = result && (result.configurationVersion !== config.version || !config.enabled);
        return React.createElement("section", { className: "surface" },
            React.createElement("div", { className: "surface-heading" },
                React.createElement("h2", null, "\u672C\u5730\u539F\u6587\u68C0\u7D22 \u00B7 \u8BD5\u9A8C\u529F\u80FD"),
                React.createElement("span", { className: "small muted" }, config.enabled ? '已启用' : '默认关闭')),
            React.createElement("p", { className: "small muted" }, "\u672C\u5730\u8BCD\u9879\u8BC4\u5206\u4E0E\u7CBE\u786E\u91CD\u590D\u5206\u7EC4\uFF1BPaperQA MMR \u9009\u62E9\u6D41\u7A0B\u53EF\u9009\uFF0C\u9ED8\u8BA4\u4E0D\u542F\u7528\uFF1B\u4E0D\u8C03\u7528\u6A21\u578B\u3001\u4E0D\u8054\u7F51\u3001\u4E0D\u751F\u6210\u6458\u8981\u6216\u7B54\u6848\u3002\u4EC5\u5904\u7406\u9009\u5B9A\u7528\u6237\u6587\u672C\uFF0C\u4E0D\u89E3\u6790 PDF\uFF0C\u4E0D\u8BC1\u660E\u79D1\u5B66\u7ED3\u8BBA\u3002"),
            React.createElement("details", { open: !config.enabled },
                React.createElement("summary", null, "\u9009\u62E9\u5141\u8BB8\u68C0\u7D22\u7684\u539F\u6587\u6587\u4EF6\uFF08\u6700\u591A 30 \u4EFD\uFF09"),
                !eligible.length ? React.createElement("p", { className: "inline-empty" }, "\u5148\u5728\u201C\u8D44\u6599\u4E0E\u8BC1\u636E\u201D\u5BFC\u5165 UTF-8 \u6587\u672C\u6216 Markdown\u3002\u6B64\u5165\u53E3\u4E0D\u628A\u6A21\u578B\u4EA7\u7269\u5F53\u8BBA\u6587\u539F\u6587\u3002") : null,
                React.createElement("div", { className: "run-selection" }, eligible.map(a => React.createElement("label", { key: a.id },
                    React.createElement("input", { type: "checkbox", checked: selected.includes(a.id), disabled: this.state.loading, onChange: (e) => this.setState({ selected: e.target.checked ? [...selected, a.id] : selected.filter(id => id !== a.id), result: null }) }),
                    React.createElement("span", null,
                        a.title,
                        React.createElement("small", null, short(a.id)))))),
                React.createElement("div", { className: "actions wrap" },
                    React.createElement("button", { className: "secondary", disabled: !selected.length || this.state.loading, onClick: () => perform(async () => {
                            await api(`/projects/${data.project.id}/text-evidence`, { enabled: true, artifactIds: selected, expectedVersion: config.version });
                            this.setState({ selected: null, result: null });
                        }, '已保存本地文本范围；不会自动调用模型') }, "\u4FDD\u5B58\u8303\u56F4\u5E76\u542F\u7528"),
                    config.enabled ? React.createElement("button", { className: "secondary", disabled: this.state.loading, onClick: () => perform(async () => {
                            await api(`/projects/${data.project.id}/text-evidence`, { enabled: false, expectedVersion: config.version });
                            this.setState({ result: null });
                        }, '已关闭检索，历史文件与引用保留') }, "\u5173\u95ED\u68C0\u7D22") : null)),
            React.createElement("form", { className: "search-panel", onSubmit: (e) => {
                    e.preventDefault();
                    this.setState({ loading: true });
                    void perform(async () => {
                        const response = await api('/text-evidence-search', { projectId: data.project.id, query: this.state.query, artifactIds: saved, limit: 5, mmrLambda: this.state.mmrLambda });
                        this.setState({ result: response, sourcePreview: '' });
                    }).finally(() => this.setState({ loading: false }));
                } },
                React.createElement("input", { "aria-label": "\u672C\u5730\u539F\u6587\u5173\u952E\u8BCD", placeholder: "\u8F93\u5165\u5173\u952E\u8BCD\uFF1B\u4E2D\u6587\u53EF\u4F7F\u7528\u77ED\u8BED", value: this.state.query, disabled: this.state.loading, onChange: (e) => this.setState({ query: e.target.value }) }),
                React.createElement("select", { "aria-label": "\u68C0\u7D22\u6392\u5E8F\u7B56\u7565", value: this.state.mmrLambda, disabled: this.state.loading, onChange: (e) => this.setState({ mmrLambda: Number(e.target.value), result: null }) },
                    React.createElement("option", { value: 1 }, "\u7CBE\u786E\u53BB\u91CD\uFF0B\u76F8\u5173\u6027\uFF08\u9ED8\u8BA4\uFF09"),
                    React.createElement("option", { value: 0.65 }, "\u7CBE\u786E\u53BB\u91CD\uFF0BMMR 0.65\uFF08\u8BD5\u9A8C\uFF09")),
                React.createElement("button", { className: "primary", disabled: !config.enabled || selectionChanged || !this.state.query.trim() || this.state.loading }, this.state.loading ? '检索中…' : '查找原文')),
            selectionChanged ? React.createElement("p", { className: "small muted" }, "\u6587\u6863\u9009\u62E9\u5DF2\u6539\u53D8\uFF0C\u8BF7\u5148\u4FDD\u5B58\u8303\u56F4\u3002") : null,
            stale ? React.createElement("p", { className: "inline-warning" }, "\u96C6\u5408\u5DF2\u53D8\u66F4\u6216\u529F\u80FD\u5DF2\u5173\u95ED\uFF1B\u4E0B\u65B9\u662F\u5386\u53F2\u67E5\u8BE2\uFF0C\u8BF7\u91CD\u65B0\u68C0\u7D22\u3002") : null,
            result ? React.createElement("div", null,
                React.createElement("p", { className: "small muted" }, result.status === 'no_lexical_match' ? '未找到词项匹配；不表示文献中没有答案。' : `返回 ${result.hits.length} 个原文片段。相关性不是科学正确性。`),
                result.coverage ? React.createElement("p", { className: "small muted" },
                    "\u5DF2\u641C\u7D22\u9009\u5B9A ",
                    result.coverage.sourceCount,
                    " \u4EFD\u6587\u672C / ",
                    result.coverage.totalChunks,
                    " \u4E2A\u5206\u5757\uFF1B",
                    result.coverage.matchingChunks,
                    " \u4E2A\u8BCD\u9879\u5339\u914D\uFF1B\u5408\u5E76 ",
                    result.coverage.exactDuplicatesGrouped,
                    " \u4E2A\u76F8\u540C\u7247\u6BB5\u5E76\u4FDD\u7559\u5176\u4ED6\u6765\u6E90\u3002",
                    result.coverage.resultsTruncated ? '当前展示受数量限制，可缩小查询或增大接口 limit（最多10）。' : '') : null,
                result.hits.map((h) => React.createElement("article", { className: "inspector-section", key: h.chunkId },
                    React.createElement("h3", null, h.title),
                    React.createElement("p", { className: "small muted" },
                        "\u539F\u6587\u4EF6\u7B2C ",
                        h.lineStart,
                        "\u2013",
                        h.lineEnd,
                        " \u884C \u00B7 UTF-16 \u533A\u95F4 [",
                        h.locator.start,
                        ", ",
                        h.locator.end,
                        ") \u00B7 \u65E0 PDF \u9875\u7801"),
                    React.createElement("pre", { className: "document-preview" }, h.quote),
                    h.alternativeSources?.length ? React.createElement("p", { className: "small muted" },
                        "\u76F8\u540C\u539F\u6587\u8FD8\u51FA\u73B0\u4E8E\uFF1A",
                        h.alternativeSources.map((a) => `${a.title}（行${a.lineStart}–${a.lineEnd}）`).join('；'),
                        "\u3002\u526F\u672C\u4E0D\u8BA1\u4E3A\u65B0\u7684\u72EC\u7ACB\u652F\u6301\u3002") : null,
                    React.createElement("p", { className: "small muted" },
                        "\u8BC1\u636E ",
                        React.createElement("code", null, h.evidenceId),
                        " \u00B7 \u6E90\u6458\u8981 ",
                        React.createElement("code", null, short(h.digest))),
                    React.createElement("button", { className: "text-button", onClick: () => perform(async () => this.setState({ sourcePreview: await artifactText(h.artifactId) })) }, "\u8BFB\u53D6\u5BF9\u5E94\u539F\u6587\u4EF6"))),
                React.createElement("p", { className: "small muted" }, result.limitations.join(' '))) : null,
            this.state.sourcePreview ? React.createElement("details", { open: true },
                React.createElement("summary", null, "\u539F\u6587\u4EF6\u6587\u672C\uFF08\u4E0D\u662F\u6A21\u578B\u6458\u8981\uFF09"),
                React.createElement("pre", { className: "file-preview" }, this.state.sourcePreview)) : null);
    }
}
