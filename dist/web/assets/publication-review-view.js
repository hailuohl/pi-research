import { api } from './api.js';
import { short, label } from './models.js';
export function publicationReviewStatus(status) { return status === 'passed' ? '审查通过' : label(status); }
export class PublicationReviewPanel extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { reviews: [], rootSessionId: '', inputEvidenceIds: [], busy: false, loading: false, loaded: false, error: '' };
        this.mounted = true;
        this.epoch = 0;
        this.preparationEpoch = 0;
    }
    call(name, input) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input }); }
    componentDidMount() { void this.refresh(); }
    componentWillUnmount() { this.mounted = false; this.epoch++; this.preparationEpoch++; }
    componentDidUpdate(prev) { if (prev.result.id !== this.props.result.id || prev.data.project.id !== this.props.data.project.id) {
        this.epoch++;
        this.preparationEpoch++;
        this.setState({ reviews: [], rootSessionId: '', inputEvidenceIds: [], busy: false, loaded: false, error: '' });
        void this.refresh();
    }
    else if (prev.data !== this.props.data || prev.selectedReviewId !== this.props.selectedReviewId)
        void this.refresh(); }
    matches(review) { const r = this.props.result; return review.publicationResultId === r.id && review.revisionId === r.revisionId && review.jobId === r.jobId && review.sourceDigest === r.sourceDigest && review.pdfDigest === r.pdf?.digest; }
    async refresh() { const epoch = ++this.epoch; this.setState({ loading: true, error: '' }); try {
        const reviews = await this.call('publication_review_list', { resultId: this.props.result.id });
        if (!this.mounted || epoch !== this.epoch)
            return;
        if (!Array.isArray(reviews) || reviews.some(r => !this.matches(r)))
            throw Error('审查记录与所选固定构建不一致。');
        this.setState({ reviews, loaded: true });
    }
    catch (error) {
        if (this.mounted && epoch === this.epoch)
            this.setState({ error: String(error), loaded: false });
    }
    finally {
        if (this.mounted && epoch === this.epoch)
            this.setState({ loading: false });
    } }
    async prepare() {
        const { data, result } = this.props, s = this.state, session = data.sessions.find(row => row.id === s.rootSessionId && row.role === 'coordinator' && !row.taskId && !row.parentSessionId && row.state !== 'archived');
        if (!this.props.ready || s.busy || !session || s.inputEvidenceIds.some(id => !data.evidence.some(e => e.id === id)))
            return;
        const epoch = ++this.preparationEpoch;
        this.epoch++;
        this.setState({ busy: true, loading: false, error: '' });
        try {
            await this.props.perform(async () => { const review = await this.call('publication_review_prepare', { resultId: result.id, rootSessionId: session.id, ...(s.inputEvidenceIds.length ? { inputEvidenceIds: s.inputEvidenceIds } : {}) }); if (!this.mounted || epoch !== this.preparationEpoch)
                return; if (!this.matches(review))
                throw Error('准备的审查未绑定所选构建。'); this.epoch++; this.setState({ loading: false, reviews: [...this.state.reviews.filter(r => r.id !== review.id), review], loaded: true }); });
        }
        catch (error) {
            if (this.mounted && epoch === this.preparationEpoch)
                this.setState({ error: String(error) });
        }
        finally {
            if (this.mounted && epoch === this.preparationEpoch)
                this.setState({ busy: false });
        }
    }
    render() { const s = this.state, { data, result } = this.props, roots = (data.sessions ?? []).filter(row => row.role === 'coordinator' && !row.taskId && !row.parentSessionId && row.state !== 'archived'); return React.createElement("section", { className: "inspector-section", "aria-label": "\u56FA\u5B9A\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5" },
        React.createElement("h3", null, "\u56FA\u5B9A\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5"),
        React.createElement("p", { className: "small muted" }, "\u5BA1\u67E5\u53EA\u9488\u5BF9\u6B64\u6784\u5EFA\u7684\u56FA\u5B9A\u6587\u672C\u3001\u7F16\u8BD1\u65E5\u5FD7\u4E0E\u8BC1\u636E\uFF1B\u4E0D\u4EE3\u8868\u6A21\u578B\u89C6\u89C9\u68C0\u67E5\u4E86 PDF\u3002\u666E\u901A reviewer \u4F1A\u8BDD\u4E0D\u4F1A\u81EA\u52A8\u4F5C\u4E3A\u8BBA\u6587\u5BA1\u67E5\u3002"),
        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
            "\u7ED3\u679C ",
            result.id,
            " \u00B7 \u4FEE\u8BA2 ",
            result.revisionId,
            " \u00B7 \u6784\u5EFA ",
            result.jobId),
        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
            "\u6E90\u7801 ",
            result.sourceDigest),
        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
            "PDF ",
            result.pdf?.digest ?? '无 PDF'),
        React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void this.prepare(); } },
            React.createElement("label", null,
                "\u8BBA\u6587\u5BA1\u67E5\u4E3B\u534F\u8C03\u4F1A\u8BDD",
                React.createElement("select", { "aria-label": "\u8BBA\u6587\u5BA1\u67E5\u4E3B\u534F\u8C03\u4F1A\u8BDD", value: s.rootSessionId, disabled: s.busy, onChange: (e) => this.setState({ rootSessionId: e.target.value }) },
                    React.createElement("option", { value: "" }, "\u9009\u62E9\u4E3B\u534F\u8C03\u4F1A\u8BDD"),
                    roots.map(row => React.createElement("option", { key: row.id, value: row.id },
                        row.title,
                        " \u00B7 ",
                        short(row.id))))),
            React.createElement("details", null,
                React.createElement("summary", null, "\u663E\u5F0F\u9644\u52A0\u9879\u76EE\u8BC1\u636E\uFF08\u53EF\u9009\uFF09"),
                (data.evidence ?? []).map(evidence => React.createElement("label", { className: "checkbox-label", key: evidence.id },
                    React.createElement("input", { type: "checkbox", disabled: s.busy, checked: s.inputEvidenceIds.includes(evidence.id), onChange: (e) => this.setState({ inputEvidenceIds: e.target.checked ? [...s.inputEvidenceIds, evidence.id] : s.inputEvidenceIds.filter(id => id !== evidence.id) }) }),
                    evidence.description,
                    " \u00B7 ",
                    short(evidence.id)))),
            React.createElement("button", { className: "primary", disabled: !this.props.ready || s.busy || !roots.some(r => r.id === s.rootSessionId) }, "\u51C6\u5907\u6B64\u56FA\u5B9A\u8BBA\u6587\u5BA1\u67E5")),
        React.createElement("p", { className: "small muted" }, "\u51C6\u5907\u4EC5\u521B\u5EFA\u5F85\u6279\u51C6\u56E2\u961F\u8BA1\u5212\uFF0C\u4E0D\u4F1A\u6279\u51C6\u6216\u8C03\u7528\u6A21\u578B\u3002\u968F\u540E\u6253\u5F00\u5BF9\u5E94\u4E3B\u4F1A\u8BDD\uFF0C\u5728\u56E2\u961F\u8BA1\u5212\u4E2D\u5355\u72EC\u6279\u51C6\u3002"),
        React.createElement("button", { className: "secondary", disabled: s.busy || s.loading, onClick: () => void this.refresh() }, "\u5237\u65B0\u5168\u90E8\u8BBA\u6587\u5BA1\u67E5"),
        s.loading ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u6838\u9A8C\u8BBA\u6587\u5BA1\u67E5\u2026") : null,
        s.error ? React.createElement("p", { role: "alert", className: "error-text" },
            s.error,
            "\uFF1B\u5F53\u524D\u6838\u9A8C\u672A\u5B8C\u6210\uFF0C\u4FDD\u7559\u8BB0\u5F55\u4EC5\u4F9B\u56DE\u67E5\u3002") : null,
        s.loaded && !s.reviews.length ? React.createElement("p", null, "\u672A\u5BA1\u67E5") : null,
        s.loaded && this.props.selectedReviewId && !s.reviews.some(r => r.id === this.props.selectedReviewId) ? React.createElement("p", { role: "alert" }, "\u6307\u5B9A\u5BA1\u67E5\u4E0D\u5728\u6B64\u56FA\u5B9A\u6784\u5EFA\u4E2D\uFF1B\u672A\u66FF\u6362\u4E3A\u5176\u4ED6\u5BA1\u67E5\u3002") : null,
        s.reviews.map(review => { const task = data.tasks?.find(t => t.id === review.taskId); return React.createElement("div", { key: review.id, className: "inspector-section", "aria-label": `论文审查 ${review.id}` },
            React.createElement("h4", null,
                review.id === this.props.selectedReviewId ? '所选固定审查 · ' : '',
                short(review.id)),
            React.createElement("p", null,
                "\u5BA1\u67E5\u72B6\u6001\uFF1A",
                publicationReviewStatus(review.status),
                " \u00B7 \u6700\u8FD1\u6838\u9A8C\u6709\u6548\u6027\uFF1A",
                review.validity === 'current' ? '当前有效' : '已失效'),
            React.createElement("p", null,
                "\u4EFB\u52A1\u9A8C\u6536\uFF1A",
                task ? label(task.acceptance) : '尚无任务验收记录',
                "\uFF1B\u4EFB\u52A1\u9A8C\u6536\u4E0E\u8BBA\u6587\u5BA1\u67E5\u610F\u89C1\u5206\u522B\u8BB0\u5F55\u3002"),
            React.createElement("p", null,
                "\u8BBA\u6587\u610F\u89C1\uFF1A",
                review.verdict ?? '尚无固定审查意见'),
            review.summary ? React.createElement("pre", { className: "document-preview" }, review.summary) : null,
            review.reason ? React.createElement("p", { className: "inline-warning" }, review.reason) : null,
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u5BA1\u67E5 ",
                review.id,
                " \u00B7 \u56E2\u961F ",
                review.teamId,
                " \u00B7 \u4EFB\u52A1 ",
                review.taskId,
                " \u00B7 \u6279\u51C6 ",
                review.approvalId),
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u5BA1\u67E5\u7ED1\u5B9A\u6458\u8981 ",
                review.digest),
            React.createElement("p", { className: "small muted" },
                "\u5FC5\u9700\u8BC1\u636E\uFF1A",
                review.requiredEvidenceIds.join('、')),
            this.props.onSession ? React.createElement("button", { className: "secondary", onClick: () => this.props.onSession?.(review.rootSessionId) }, "\u6253\u5F00\u4E3B\u4F1A\u8BDD\u4E0E\u56E2\u961F\u6279\u51C6") : React.createElement("p", { className: "small muted" },
                "\u5728\u5DE6\u4FA7\u4F1A\u8BDD\u5217\u8868\u6253\u5F00\u4E3B\u4F1A\u8BDD ",
                data.sessions?.find(row => row.id === review.rootSessionId)?.title ?? review.rootSessionId,
                "\uFF0C\u67E5\u770B\u56E2\u961F\u8BA1\u5212\u4E0E\u6279\u51C6\u3002")); })); }
}
