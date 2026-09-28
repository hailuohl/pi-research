import { api } from './api.js';
import { short } from './models.js';
import { SectionTitle, Badge, Empty } from './ui.js';
/** Human-controlled, single-file form; multi-file proposals are supported by the same API. */
export class ChangesView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { baseId: '', artifactId: '', path: '', title: '', hypothesis: '', preview: null, inspected: '' };
    }
    async preview(id) { await this.props.perform(async () => { const result = await api(`/change-proposals/${id}/diff`); this.setState({ preview: result, inspected: id }); }); }
    async prepare() {
        await this.props.perform(async () => {
            const base = this.props.data.experiments.find(e => e.id === this.state.baseId);
            if (!base)
                throw new Error('请选择父实验');
            const files = await api(`/experiments/${base.id}/files`);
            const before = files.some(f => f.path === this.state.path) ? await api(`/experiments/${base.id}/files?path=${encodeURIComponent(this.state.path)}`) : null;
            const p = await api('/change-proposals', { projectId: this.props.data.project.id, baseExperimentId: base.id, expectedRevision: base.revision, title: this.state.title, hypothesis: this.state.hypothesis, changes: [{ path: this.state.path, artifactId: this.state.artifactId, expectedDigest: before?.digest ?? null }] });
            const preview = await api(`/change-proposals/${p.id}/diff`);
            this.setState({ preview, inspected: p.id });
        }, '已准备固定变更；请检查前后内容再批准');
    }
    render() {
        const { data, perform } = this.props, proposals = data.changeProposals ?? [];
        const selectable = data.artifacts.filter(a => !a.taskId || data.tasks.some(t => t.id === a.taskId && t.acceptance === 'accepted' && t.execution === 'output_submitted' && t.result?.artifactIds.includes(a.id)));
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u53D8\u66F4\u63D0\u6848", sub: "\u628A\u5DF2\u9A8C\u6536\u4EA7\u7269\u6574\u5408\u4E3A\u65B0\u5B50\u5B9E\u9A8C\uFF0C\u800C\u4E0D\u662F\u8986\u76D6\u5171\u4EAB\u4EE3\u7801\u3002" }),
            React.createElement("p", { className: "inline-warning" }, "\u6574\u5408\u4E0D\u4F1A\u81EA\u52A8\u8FD0\u884C\u6D4B\u8BD5\u6216\u6B63\u5F0F\u8BA1\u7B97\u3002\u5F53\u524D\u53EA\u652F\u6301\u6587\u672C\u6587\u4EF6\uFF1B\u8FD0\u884C\u4ECD\u9700\u5355\u72EC\u6279\u51C6\u3002\u6CA1\u6709\u6D4B\u8BD5\u8BB0\u5F55\u4E0D\u8868\u793A\u6D4B\u8BD5\u901A\u8FC7\u3002"),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u4ECE\u4EA7\u7269\u51C6\u5907\u53D8\u66F4")),
                React.createElement("form", { className: "form-body", onSubmit: (e) => { e.preventDefault(); void this.prepare(); } },
                    React.createElement("label", null,
                        "\u7236\u5B9E\u9A8C",
                        React.createElement("select", { "aria-label": "\u7236\u5B9E\u9A8C", required: true, value: this.state.baseId, onChange: (e) => this.setState({ baseId: e.target.value }) },
                            React.createElement("option", { value: "" }, "\u9009\u62E9\u56FA\u5B9A\u57FA\u51C6"),
                            data.experiments.filter(e => e.lifecycle !== 'archived').map(e => React.createElement("option", { key: e.id, value: e.id },
                                e.title,
                                " \u00B7 \u4FEE\u8BA2 ",
                                e.revision)))),
                    React.createElement("label", null,
                        "\u4EE3\u7801\u6216\u914D\u7F6E\u4EA7\u7269",
                        React.createElement("select", { "aria-label": "\u4EE3\u7801\u6216\u914D\u7F6E\u4EA7\u7269", required: true, value: this.state.artifactId, onChange: (e) => { const a = selectable.find(a => a.id === e.target.value); this.setState({ artifactId: e.target.value, path: a?.title ?? this.state.path }); } },
                            React.createElement("option", { value: "" }, "\u9009\u62E9\u4E0D\u53EF\u53D8\u6587\u672C\u4EA7\u7269"),
                            selectable.map(a => React.createElement("option", { key: a.id, value: a.id },
                                a.title,
                                " \u00B7 ",
                                short(a.id))))),
                    React.createElement("label", null,
                        "\u76EE\u6807\u76F8\u5BF9\u8DEF\u5F84",
                        React.createElement("input", { "aria-label": "\u76EE\u6807\u76F8\u5BF9\u8DEF\u5F84", required: true, value: this.state.path, onChange: (e) => this.setState({ path: e.target.value }), placeholder: "\u4F8B\u5982 config.json \u6216 src/model.py" })),
                    React.createElement("label", null,
                        "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0",
                        React.createElement("input", { required: true, "aria-label": "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0", value: this.state.title, onChange: (e) => this.setState({ title: e.target.value }) })),
                    React.createElement("label", null,
                        "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E",
                        React.createElement("textarea", { required: true, "aria-label": "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E", value: this.state.hypothesis, onChange: (e) => this.setState({ hypothesis: e.target.value }) })),
                    React.createElement("button", { className: "secondary", disabled: !selectable.length || !data.experiments.length }, "\u51C6\u5907\u5E76\u9884\u89C8"))),
            React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u6574\u5408\u8BB0\u5F55")),
                !proposals.length ? React.createElement(Empty, { title: "\u5C1A\u672A\u51C6\u5907\u53D8\u66F4\u63D0\u6848" },
                    React.createElement("p", null, "\u5148\u8BA9\u4E3B\u52A9\u624B\u6216\u5B9E\u73B0\u52A9\u624B\u4FDD\u5B58\u5B9E\u9645\u6587\u4EF6\u4EA7\u7269\uFF1B\u52A9\u624B\u4EA7\u7269\u987B\u5B8C\u6210\u9A8C\u6536\uFF0C\u518D\u9009\u62E9\u7236\u5B9E\u9A8C\u3002")) : proposals.slice().reverse().map(p => {
                    const a = data.approvals.find(a => a.id === p.approvalId);
                    return React.createElement("div", { className: "inspector-section", key: p.id },
                        React.createElement("h3", null,
                            p.title,
                            " ",
                            React.createElement(Badge, { value: p.state })),
                        React.createElement("p", null, p.hypothesis),
                        p.sourceValidity === 'stale' ? React.createElement("p", { className: "inline-warning" }, "\u6765\u6E90\u5BA1\u67E5\u5DF2\u5931\u6548\u3002\u5386\u53F2\u63D0\u6848\u4FDD\u7559\uFF1B\u91CD\u65B0\u7814\u7A76\u5E76\u6279\u51C6\u540E\u624D\u80FD\u7528\u4E8E\u65B0\u64CD\u4F5C\u3002") : null,
                        React.createElement("p", { className: "small muted" },
                            "\u57FA\u51C6 ",
                            short(p.baseExperimentId),
                            " \u00B7 \u4FEE\u8BA2 ",
                            p.baseRevision,
                            " \u00B7 ",
                            p.changes.length,
                            " \u4E2A\u6587\u4EF6 \u00B7 ",
                            p.testsStatus === 'passed' ? '已通过绑定源码的开发检查' : '未运行开发测试'),
                        React.createElement("div", { className: "actions wrap" },
                            React.createElement("button", { className: "secondary compact", onClick: () => void this.preview(p.id) }, "\u67E5\u770B\u56FA\u5B9A\u5DEE\u5F02"),
                            p.state === 'prepared' && p.sourceValidity !== 'stale' && a?.status === 'pending' ? React.createElement(React.Fragment, null,
                                React.createElement("button", { className: "primary compact", disabled: this.state.inspected !== p.id, onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }), '已批准固定变更；尚未创建子实验') }, "\u6279\u51C6\u53D8\u66F4"),
                                React.createElement("button", { className: "secondary compact", onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false })) }, "\u62D2\u7EDD")) : null,
                            p.state === 'prepared' && p.sourceValidity !== 'stale' && a?.status === 'approved' ? React.createElement("button", { className: "primary compact", onClick: () => perform(() => api(`/change-proposals/${p.id}/apply`, {}), '新子实验已创建；没有启动计算') }, "\u521B\u5EFA\u65B0\u5B50\u5B9E\u9A8C") : null),
                        p.appliedExperimentId ? React.createElement("p", null,
                            "\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C\uFF1A",
                            React.createElement("code", null, p.appliedExperimentId)) : null);
                })),
            this.state.preview ? React.createElement("section", { className: "surface" },
                React.createElement("div", { className: "surface-heading" },
                    React.createElement("h2", null, "\u56FA\u5B9A\u5185\u5BB9\u524D\u540E\u5BF9\u7167"),
                    React.createElement("span", { className: "small muted" }, short(this.state.preview.proposal.digest))),
                this.state.preview.files.map((f) => React.createElement("div", { className: "inspector-section", key: f.path },
                    React.createElement("h3", null, f.path),
                    React.createElement("details", { open: true },
                        React.createElement("summary", null,
                            "\u53D8\u66F4\u524D \u00B7 ",
                            f.expectedDigest ?? '不存在'),
                        React.createElement("pre", { className: "file-preview" }, f.before ?? '（新增文件）')),
                    React.createElement("details", { open: true },
                        React.createElement("summary", null,
                            "\u53D8\u66F4\u540E \u00B7 ",
                            f.artifactDigest ?? '删除'),
                        React.createElement("pre", { className: "file-preview" }, f.after ?? '（删除文件）'))))) : null);
    }
}
