import { api, artifactText, downloadArtifact } from './api.js';
import { short, label } from './models.js';
import { SectionTitle, Badge, Empty } from './ui.js';
import { PublicationView } from './publication-view.js';
import { publicationReviewStatus } from './publication-review-view.js';
const referenceTypes = { run: '正式运行', 'run-source': '固定运行源码', artifact: '原始产物', evidence: '定位证据', 'development-job': '开发测试', 'development-review': '独立审查', claim: '已采纳结论', publication: '固定文稿构建', 'publication-review': '固定论文审查', 'figure-source': '图形生成来源', 'figure-source-code': '图形生成源码' };
function provenanceSignature(data, reportId) {
    const versions = (rows) => (rows ?? []).map(row => { const r = row; return [r.id, r.version ?? null, r.status ?? null, r.state ?? null, r.integrity ?? null, r.sourceDigest ?? null]; }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify([data.project.id, data.project.version, data.project.archived,
        versions(data.claims), versions(data.approvals), versions(data.tasks), versions(data.teams), versions(data.changeProposals), versions(data.experiments), versions(data.reviews), versions(data.sandboxJobs), versions(data.developmentTasks), versions(data.intents), versions(data.sessions),
        versions(data.runs), versions(data.documents), versions(data.evidence), versions(data.artifacts),
        (data.documentParseJobs ?? []).map(j => [j.id, j.state, j.integrity, j.resultId ?? null, j.manifestDigest, j.rawDigest, j.approvalId]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))]);
}
function sameReference(a, b) {
    const keys = ['id', 'type', 'targetId', 'digest', 'runId', 'path', 'relation'];
    const documentKeys = ['documentVersionId', 'rawDigest', 'parseResultId', 'pageNumber', 'textArtifactDigest', 'start', 'end', 'pageLabel', 'rawArtifactId', 'imageArtifactId'];
    return keys.every(key => a[key] === b[key]) && (!a.document && !b.document || !!a.document && !!b.document && documentKeys.every(key => a.document[key] === b.document[key]));
}
function validDocument(ref) {
    const d = ref.document;
    return ref.type === 'evidence' && d && ['documentVersionId', 'rawDigest', 'parseResultId', 'textArtifactDigest', 'rawArtifactId', 'imageArtifactId'].every(key => typeof d[key] === 'string' && !!d[key]) && Number.isSafeInteger(d.pageNumber) && d.pageNumber > 0 && Number.isSafeInteger(d.start) && d.start >= 0 && Number.isSafeInteger(d.end) && d.end > d.start;
}
export class ReportsView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { publications: [], title: '研究结果记录', selected: [], selectedClaims: [], pendingArtifactId: '', report: null, body: '', loading: false, error: '', checking: false, verificationError: '', reference: null, verifiedReference: null, content: '', cursor: 0, complete: false, reading: false, referenceError: '', exported: null };
        this.publicationView = null;
        this.reportEpoch = 0;
        this.referenceEpoch = 0;
        this.inspectionEpoch = 0;
        this.mounted = true;
    }
    componentDidMount() { if (this.props.selectedReport)
        void this.open(this.props.selectedReport); }
    componentWillUnmount() { this.mounted = false; this.reportEpoch++; this.referenceEpoch++; }
    componentDidUpdate(prev) {
        if (this.props.data.project.id !== prev.data.project.id) {
            this.reportEpoch++;
            this.referenceEpoch++;
            this.inspectionEpoch++;
            this.setState({ publications: [], selected: [], selectedClaims: [], pendingArtifactId: '', report: null, body: '', reference: null, verifiedReference: null, content: '', cursor: 0, complete: false, reading: false, exported: null, error: '', loading: false, checking: false, verificationError: '', referenceError: '' });
            if (this.props.selectedReport)
                void this.open(this.props.selectedReport);
            return;
        }
        if (this.props.selectedReport !== prev.selectedReport) {
            if (this.props.selectedReport)
                void this.open(this.props.selectedReport);
            else {
                this.reportEpoch++;
                this.referenceEpoch++;
                this.setState({ report: null, body: '', reference: null, verifiedReference: null, content: '', exported: null, error: '' });
            }
        }
        else if (this.state.report && provenanceSignature(prev.data, this.state.report.id) !== provenanceSignature(this.props.data, this.state.report.id))
            void this.reinspect();
        if (this.state.pendingArtifactId) {
            const row = this.props.data.reports.find(r => r.artifactId === this.state.pendingArtifactId);
            if (row)
                this.setState({ pendingArtifactId: '' }, () => this.select(row.id));
        }
    }
    call(name, input) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input }); }
    select(id) { if (this.props.onSelect && id !== this.props.selectedReport)
        this.props.onSelect(id);
    else
        void this.open(id); }
    async reinspect() {
        const report = this.state.report;
        if (!report)
            return;
        const epoch = ++this.inspectionEpoch, selection = this.reportEpoch;
        this.setState({ checking: true, verificationError: '' });
        try {
            const next = await this.call('report_inspect', { reportId: report.id });
            if (next.id !== report.id || next.artifactId !== report.artifactId)
                throw Error('报告绑定与所选记录不一致。');
            if (this.mounted && epoch === this.inspectionEpoch && selection === this.reportEpoch)
                this.setState({ report: next, checking: false });
        }
        catch (error) {
            if (this.mounted && epoch === this.inspectionEpoch && selection === this.reportEpoch)
                this.setState({ checking: false, verificationError: '来源重新核验失败，暂停导出：' + (error instanceof Error ? error.message : String(error)) });
        }
    }
    async open(id) {
        const epoch = ++this.reportEpoch, signature = provenanceSignature(this.props.data, id);
        this.referenceEpoch++;
        this.setState({ report: null, body: '', loading: true, error: '', checking: false, verificationError: '', reference: null, verifiedReference: null, content: '', cursor: 0, complete: false, reading: false, exported: null });
        try {
            const row = this.props.data.reports.find(r => r.id === id);
            if (!row)
                throw Error('此报告不在当前项目中；请选择有效记录。');
            const [report, body] = await Promise.all([this.call('report_inspect', { reportId: id }), artifactText(row.artifactId)]);
            if (report.id !== id || report.artifactId !== row.artifactId)
                throw Error('报告绑定与所选记录不一致。');
            if (this.mounted && epoch === this.reportEpoch)
                this.setState({ report, body }, () => { if (signature !== provenanceSignature(this.props.data, id))
                    void this.reinspect(); });
        }
        catch (error) {
            if (this.mounted && epoch === this.reportEpoch)
                this.setState({ error: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (this.mounted && epoch === this.reportEpoch)
                this.setState({ loading: false });
        }
    }
    async readReference(referenceId, append = false) {
        const report = this.state.report, reference = report?.references.find(r => r.id === referenceId);
        if (!report || !reference || !Object.prototype.hasOwnProperty.call(referenceTypes, reference.type))
            return;
        if (append && (this.state.reading || this.state.reference?.id !== referenceId || this.state.complete))
            return;
        const epoch = ++this.referenceEpoch, reportEpoch = this.reportEpoch, cursor = append ? this.state.cursor : 0;
        this.setState({ reference, verifiedReference: null, reading: true, referenceError: '', ...(!append ? { content: '', cursor: 0, complete: false } : {}) });
        try {
            const result = await this.call('report_reference_read', { reportId: report.id, referenceId, cursor, limit: 16000 });
            if (!sameReference(result.reference, reference) || (reference.document && !validDocument(result.reference)))
                throw Error('返回的证据不属于所选引用。');
            if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch)
                this.setState({ verifiedReference: result.reference, content: (append ? this.state.content : '') + result.content, cursor: result.end, complete: result.complete });
        }
        catch (error) {
            if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch)
                this.setState({ referenceError: error instanceof Error ? error.message : String(error) });
        }
        finally {
            if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch)
                this.setState({ reading: false });
        }
    }
    documentReference() {
        const s = this.state, ref = s.verifiedReference;
        return this.mounted && !s.reading && !s.referenceError && !s.checking && !s.verificationError && s.report?.integrity === 'verified' && ref && ref.id === s.reference?.id && s.report.references.some(r => sameReference(r, ref)) && validDocument(ref) ? ref.document : null;
    }
    openDocument() { const d = this.documentReference(); if (d)
        this.props.onDocument?.({ documentVersionId: d.documentVersionId, parseResultId: d.parseResultId, pageNumber: d.pageNumber, start: d.start, end: d.end }); }
    async downloadDocument(kind) {
        const d = this.documentReference();
        if (!d)
            return;
        await this.props.perform(() => downloadArtifact(kind === 'raw' ? d.rawArtifactId : d.imageArtifactId, kind === 'raw' ? `${d.documentVersionId}.pdf` : `${d.documentVersionId}-page-${d.pageNumber}.png`));
    }
    addPublication(result, title) { if (this.state.publications.length >= 20 || this.state.publications.some(p => p.result.id === result.id) || result.status !== 'succeeded' || !result.converged || result.hadErrors || !result.pdf || result.sourceValidity !== 'current')
        return; this.setState({ publications: [...this.state.publications, { result, title }] }); }
    openPublication(resultId) { const publication = this.state.report?.publications?.find(p => p.resultId === resultId); if (!publication || this.state.report?.integrity !== 'verified' || !this.publicationView)
        return; void this.publicationView.openFixed(publication.revisionId, publication.jobId); }
    openPublicationReview(resultId, reviewId) { const report = this.state.report, review = report?.publicationReviews?.find(p => p.resultId === resultId)?.reviews.find(r => r.id === reviewId); if (!review || review.publicationResultId !== resultId || report?.integrity !== 'verified' || this.state.checking || this.state.verificationError)
        return; void this.publicationView?.openFixed(review.revisionId, review.jobId, review.id); }
    async downloadReference() { const report = this.state.report, ref = this.state.reference; if (!this.mounted || !report || report.integrity !== 'verified' || this.state.checking || this.state.verificationError || ref?.type !== 'artifact' || !report.references.some(r => sameReference(r, ref)))
        return; await this.props.perform(() => downloadArtifact(ref.targetId, ref.path?.split('/').pop() ?? ref.label)); }
    async create() {
        const projectId = this.props.data.project.id;
        await this.props.perform(async () => {
            const artifact = await this.call('report_create', { title: this.state.title, runIds: this.state.selected, claimIds: this.state.selectedClaims, ...(this.state.publications.length ? { publicationResultIds: this.state.publications.map(p => p.result.id) } : {}) });
            if (!this.mounted || projectId !== this.props.data.project.id)
                return;
            const row = this.props.data.reports.find(r => r.artifactId === artifact.id);
            if (row)
                this.select(row.id);
            else
                this.setState({ pendingArtifactId: artifact.id });
        }, '报告已生成；正在读取固定引用');
    }
    async exportReport() { const report = this.state.report; if (!report || this.state.checking || this.state.verificationError || report.integrity !== 'verified' || report.validity !== 'current')
        return; const epoch = this.reportEpoch; await this.props.perform(async () => { const artifact = await this.call('report_export', { reportId: report.id }); if (this.mounted && epoch === this.reportEpoch)
        this.setState({ exported: artifact }); }, '离线包已生成；请下载并保留摘要'); }
    openRun(runId, experimentId) { const row = this.props.data.runs.find(r => r.id === runId && r.experimentId === experimentId); if (!row) {
        this.setState({ error: '指定 Run 不在当前项目中，未跳转到其他运行。' });
        return;
    } this.props.onRun?.(runId, experimentId); }
    render() {
        const { data, perform } = this.props, s = this.state, report = s.report, eligible = data.runs.filter(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), claims = data.claims.filter(c => c.status === 'accepted' && c.validity !== 'stale');
        const selectedRuns = data.runs.filter(r => s.selected.includes(r.id)), mixed = new Set(selectedRuns.map(r => r.manifest.contractDigest)).size > 1;
        const available = s.selected.every(id => eligible.some(r => r.id === id)) && s.selectedClaims.every(id => claims.some(c => c.id === id));
        return React.createElement("div", { className: "page-scroll" },
            React.createElement(SectionTitle, { title: "\u62A5\u544A\u4E0E\u6210\u679C", sub: "\u56FA\u5B9A\u6587\u6863\u3001\u8FD0\u884C\u8BC1\u636E\u548C\u79BB\u7EBF\u4EA4\u4ED8\uFF1B\u62A5\u544A\u4E0D\u4EE3\u66FF\u79D1\u7814\u5224\u65AD\u3002" }),
            React.createElement(PublicationView, { key: data.project.id, ref: (view) => { this.publicationView = view; }, data: data, perform: perform, onSession: this.props.onSession, selectedResultIds: s.publications.map(p => p.result.id), onSelectResult: (result, title) => this.addPublication(result, title) }),
            React.createElement("section", { className: "surface report-builder" },
                React.createElement("h2", null, "\u751F\u6210\u53EF\u8FFD\u6EAF\u7ED3\u679C\u8BB0\u5F55"),
                React.createElement("label", null,
                    "\u62A5\u544A\u540D\u79F0",
                    React.createElement("input", { "aria-label": "\u62A5\u544A\u540D\u79F0", required: true, maxLength: 200, value: s.title, onChange: (e) => this.setState({ title: e.target.value }) })),
                React.createElement("fieldset", null,
                    React.createElement("legend", null,
                        "\u7EB3\u5165\u7684\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\uFF08",
                        s.publications.length,
                        "/20\uFF09"),
                    React.createElement("p", { className: "small muted" }, "\u5728\u4E0A\u65B9\u9009\u62E9\u6210\u529F\u4E14\u6765\u6E90\u6709\u6548\u7684\u6784\u5EFA\uFF0C\u70B9\u51FB\u201C\u7EB3\u5165\u6B64\u56FA\u5B9A\u6784\u5EFA\u201D\u3002\u4EC5\u6709\u6587\u7A3F\u4E5F\u53EF\u751F\u6210\u62A5\u544A\u3002"),
                    s.publications.map(p => React.createElement("div", { className: "inspector-section", key: p.result.id },
                        React.createElement("strong", null, p.title),
                        React.createElement("p", { className: "small muted" },
                            "\u4FEE\u8BA2 ",
                            short(p.result.revisionId),
                            " \u00B7 \u6784\u5EFA ",
                            short(p.result.jobId)),
                        React.createElement("code", { className: "digest" }, p.result.sourceDigest),
                        React.createElement("button", { className: "text-button danger", onClick: () => this.setState({ publications: s.publications.filter(row => row.result.id !== p.result.id) }) },
                            "\u79FB\u9664\u6784\u5EFA ",
                            short(p.result.jobId))))),
                React.createElement("div", { className: "run-selection" }, eligible.map(r => React.createElement("label", { key: r.id },
                    React.createElement("input", { type: "checkbox", checked: s.selected.includes(r.id), onChange: (e) => this.setState({ selected: e.target.checked ? [...s.selected, r.id] : s.selected.filter(id => id !== r.id) }) }),
                    React.createElement("span", null,
                        data.experiments.find(e => e.id === r.experimentId)?.title ?? '历史实验',
                        React.createElement("small", null,
                            "Run ",
                            short(r.id),
                            " \u00B7 \u4FEE\u8BA2 ",
                            r.manifest.experimentRevision)),
                    React.createElement(Badge, { value: r.state }),
                    React.createElement(Badge, { value: r.integrity })))),
                claims.length ? React.createElement("fieldset", null,
                    React.createElement("legend", null, "\u7EB3\u5165\u7684\u5DF2\u91C7\u7EB3\u7ED3\u8BBA"),
                    claims.map(c => React.createElement("label", { className: "checkbox-label", key: c.id },
                        React.createElement("input", { type: "checkbox", checked: s.selectedClaims.includes(c.id), onChange: (e) => this.setState({ selectedClaims: e.target.checked ? [...s.selectedClaims, c.id] : s.selectedClaims.filter(id => id !== c.id) }) }),
                        c.statement))) : null,
                mixed ? React.createElement("p", { role: "alert", className: "error-text" }, "\u6240\u9009 Run \u7684\u8FD0\u884C\u5951\u7EA6\u4E0D\u540C\uFF0C\u8BF7\u5206\u5F00\u751F\u6210\u62A5\u544A\u3002") : null,
                !available ? React.createElement("p", { role: "alert", className: "error-text" }, "\u90E8\u5206\u6240\u9009\u8BB0\u5F55\u5DF2\u4E0D\u53EF\u7528\u6216\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002") : null,
                React.createElement("button", { className: "primary", disabled: !s.title.trim() || !(s.selected.length + s.selectedClaims.length + s.publications.length) || mixed || !available || !!s.pendingArtifactId, onClick: () => void this.create() }, "\u751F\u6210\u56FA\u5B9A\u7ED3\u679C\u62A5\u544A"),
                React.createElement("p", { className: "small muted" }, "\u670D\u52A1\u7AEF\u91CD\u65B0\u6838\u9A8C\u6765\u6E90\u4E0E\u539F\u59CB\u6307\u6807\u3002\u5931\u8D25\u6216\u4E0D\u5B8C\u6574\u7684 Run \u4F1A\u4FDD\u7559\u5176\u771F\u5B9E\u72B6\u6001\uFF0C\u4E0D\u8865\u5199\u7ED3\u679C\u3002"),
                s.pendingArtifactId ? React.createElement("p", { role: "status" },
                    "\u62A5\u544A\u4EA7\u7269\u5DF2\u4FDD\u5B58\uFF0C\u7B49\u5F85\u9879\u76EE\u8BB0\u5F55\u5237\u65B0\u3002",
                    React.createElement("button", { className: "text-button", onClick: () => perform(async () => { }) }, "\u5237\u65B0\u8BB0\u5F55")) : null),
            React.createElement("div", { className: "evidence-grid" },
                React.createElement("section", { className: "surface artifact-list" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, "\u5DF2\u751F\u6210\u62A5\u544A")),
                    data.reports.map(row => { const artifact = data.artifacts.find(a => a.id === row.artifactId); return React.createElement("button", { className: 'artifact-item ' + (row.id === (report?.id ?? this.props.selectedReport) ? 'active' : ''), key: row.id, onClick: () => this.select(row.id) },
                        React.createElement("div", null,
                            React.createElement("strong", null, artifact?.title ?? '历史报告'),
                            React.createElement("small", null, short(row.id)))); }),
                    !data.reports.length ? React.createElement("p", { className: "inline-empty" }, "\u5C1A\u672A\u751F\u6210\u62A5\u544A\u3002") : null),
                React.createElement("section", { className: "surface artifact-preview" },
                    React.createElement("div", { className: "surface-heading" },
                        React.createElement("h2", null, report?.title ?? '报告预览'),
                        report ? React.createElement("button", { className: "text-button", onClick: () => void this.reinspect() }, "\u91CD\u65B0\u6838\u9A8C") : null),
                    s.loading ? React.createElement("p", { role: "status", className: "inline-empty" }, "\u6B63\u5728\u8BFB\u53D6\u62A5\u544A\u4E0E\u56FA\u5B9A\u5F15\u7528\u2026") : null,
                    s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
                    report ? React.createElement("div", null,
                        s.checking ? React.createElement("p", { role: "status" }, "\u6765\u6E90\u8BB0\u5F55\u5DF2\u53D8\u5316\uFF0C\u6B63\u5728\u91CD\u65B0\u6838\u9A8C\u2026") : null,
                        s.verificationError ? React.createElement("p", { role: "alert", className: "error-text" }, s.verificationError) : null,
                        React.createElement("div", { className: "preview-meta" },
                            "\u5B8C\u6574\u6027\uFF1A",
                            report.integrity === 'verified' ? '已核验' : '无效',
                            " \u00B7 \u6765\u6E90\uFF1A",
                            report.validity === 'current' ? '当前有效' : report.validity === 'legacy' ? '旧版缺少历史固定绑定' : '已失效',
                            " \u00B7 \u683C\u5F0F v",
                            report.formatVersion),
                        report.reasons.length ? React.createElement("ul", null, report.reasons.map((reason, i) => React.createElement("li", { key: i }, reason))) : null,
                        report.validity !== 'current' || report.integrity !== 'verified' ? React.createElement("p", { className: "inline-warning" }, "\u4FDD\u7559\u5386\u53F2\u539F\u6587\u4F9B\u56DE\u67E5\uFF1B\u5F53\u524D\u72B6\u6001\u4E0D\u5141\u8BB8\u751F\u6210\u65B0\u7684\u79BB\u7EBF\u4EA4\u4ED8\u5305\u3002") : null,
                        React.createElement("div", { className: "actions wrap" },
                            React.createElement("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(report.artifactId, data.artifacts.find(a => a.id === report.artifactId)?.title ?? `${report.title}.md`)) }, "\u4E0B\u8F7D\u539F\u62A5\u544A Markdown"),
                            React.createElement("button", { className: "primary compact", disabled: s.checking || !!s.verificationError || report.validity !== 'current' || report.integrity !== 'verified', onClick: () => void this.exportReport() }, "\u751F\u6210\u79BB\u7EBF\u4EA4\u4ED8\u5305")),
                        s.exported ? React.createElement("div", { className: "inspector-section" },
                            React.createElement("h3", null, s.exported.title),
                            React.createElement("p", null,
                                s.exported.size,
                                " \u5B57\u8282"),
                            React.createElement("code", { className: "digest" },
                                "SHA-256 ",
                                s.exported.digest),
                            React.createElement("button", { className: "secondary", onClick: () => perform(() => downloadArtifact(s.exported.id, s.exported.title)) }, "\u4E0B\u8F7D\u79BB\u7EBF\u5305"),
                            React.createElement("p", { className: "small muted" }, "\u751F\u6210\u4E0E\u53D1\u8D77\u4E0B\u8F7D\u4E0D\u4EE3\u8868\u6587\u4EF6\u5DF2\u843D\u76D8\uFF1B\u8BF7\u5728\u4E0B\u8F7D\u76EE\u5F55\u6838\u5BF9\u3002")) : null,
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u56FA\u5B9A\u8FD0\u884C\u4E0E\u5B9E\u6D4B\u6307\u6807"),
                            !report.runs.length ? React.createElement("p", { className: "small muted" }, "\u672C\u62A5\u544A\u672A\u7EB3\u5165\u6B63\u5F0F\u8FD0\u884C\uFF1B\u6587\u7A3F\u4E0E\u6587\u6863\u6765\u6E90\u4E0D\u4EE3\u8868\u8FD0\u884C\u5B9E\u6D4B\u7ED3\u679C\u3002") : null,
                            report.runs.map(run => React.createElement("div", { className: "inspector-section", key: run.runId },
                                React.createElement("h3", null,
                                    "Run ",
                                    short(run.runId),
                                    " \u00B7 \u4FEE\u8BA2 ",
                                    run.revision),
                                React.createElement("p", null,
                                    label(run.state),
                                    " \u00B7 ",
                                    label(run.integrity),
                                    " \u00B7 \u79D1\u7814\u5224\u65AD ",
                                    run.judgment),
                                React.createElement("code", { className: "digest" },
                                    "\u6E90\u7801 ",
                                    run.sourceDigest),
                                run.gitCommit ? React.createElement("code", { className: "digest" },
                                    "Git ",
                                    run.gitCommit) : null,
                                React.createElement("button", { className: "text-button", onClick: () => this.openRun(run.runId, run.experimentId) },
                                    "\u6253\u5F00\u6B64 Run ",
                                    short(run.runId)),
                                React.createElement("ul", null, run.metrics.map(metric => React.createElement("li", { key: metric.name },
                                    metric.name,
                                    ": ",
                                    React.createElement("button", { className: "text-button numeric", disabled: !report.references.some(ref => ref.id === metric.referenceId), onClick: () => void this.readReference(metric.referenceId) },
                                        String(metric.value),
                                        " ",
                                        metric.unit))))))),
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u56FA\u5B9A\u6587\u7A3F\u4E0E\u56FE\u5F62\u6765\u6E90"),
                            report.publications?.length ? report.publications.map(p => React.createElement("div", { className: "inspector-section", key: p.resultId },
                                React.createElement("h3", null, p.title),
                                React.createElement("p", null,
                                    "\u4FEE\u8BA2 ",
                                    short(p.revisionId),
                                    " \u00B7 \u6784\u5EFA ",
                                    short(p.jobId),
                                    " \u00B7 ",
                                    p.pages,
                                    " \u9875"),
                                React.createElement("code", { className: "digest" },
                                    "\u6E90\u7801 ",
                                    p.sourceDigest),
                                React.createElement("code", { className: "digest" },
                                    "PDF ",
                                    p.pdfDigest),
                                React.createElement("div", { className: "actions wrap" },
                                    React.createElement("button", { className: "secondary compact", disabled: report.integrity !== 'verified', onClick: () => this.openPublication(p.resultId) }, "\u56DE\u67E5\u56FA\u5B9A\u6587\u7A3F\u4E0E PDF"),
                                    React.createElement("button", { className: "text-button", onClick: () => void this.readReference(p.referenceId) }, "\u8BFB\u53D6\u56FA\u5B9A\u6784\u5EFA\u6765\u6E90")))) : React.createElement("p", { className: "small muted" }, "\u672C\u62A5\u544A\u672A\u7EB3\u5165\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\u3002"),
                            React.createElement("p", { className: "small muted" }, "\u56FE\u5F62\u751F\u6210\u6E90\u7801\u3001\u8F93\u5165\u6570\u636E\u4E0E\u540C\u4F5C\u4E1A\u8F93\u51FA\u6309\u4E0B\u65B9\u56FA\u5B9A\u5F15\u7528\u56DE\u67E5\uFF1B\u5DF2\u77E5\u751F\u6210\u5173\u7CFB\u4E0D\u4EE3\u8868\u9010\u70B9\u6570\u503C\u9A8C\u8BC1\u3002")),
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u56FA\u5B9A\u8BBA\u6587\u5BA1\u67E5\u5FEB\u7167"),
                            report.publicationReviews ? report.publicationReviews.map(group => React.createElement("div", { className: "inspector-section", key: group.resultId },
                                React.createElement("h3", null,
                                    "\u6784\u5EFA\u7ED3\u679C ",
                                    short(group.resultId)),
                                !group.reviewIds.length ? React.createElement("p", null, "\u672A\u5BA1\u67E5") : null,
                                group.reviews.map(review => React.createElement("div", { key: review.id },
                                    React.createElement("h4", null,
                                        "\u5BA1\u67E5 ",
                                        short(review.id)),
                                    React.createElement("p", null,
                                        "\u62A5\u544A\u751F\u6210\u65F6\uFF1A",
                                        publicationReviewStatus(review.status),
                                        " \u00B7 ",
                                        review.validity === 'current' ? '当时有效' : '当时已失效',
                                        " \u00B7 \u8BBA\u6587\u610F\u89C1\uFF1A",
                                        review.verdict ?? '尚无固定审查意见'),
                                    review.summary ? React.createElement("pre", { className: "document-preview" }, review.summary) : null,
                                    React.createElement("p", { className: "small muted" }, "\u8FD9\u662F\u62A5\u544A\u751F\u6210\u65F6\u7684\u56FA\u5B9A\u5FEB\u7167\uFF1B\u5F53\u524D\u6709\u6548\u6027\u89C1\u62A5\u544A\u6838\u9A8C\u72B6\u6001\uFF0C\u56DE\u67E5\u53EF\u6838\u9A8C\u5F53\u524D\u5BA1\u67E5\u3002"),
                                    React.createElement("button", { className: "text-button", onClick: () => void this.readReference(review.referenceId) }, "\u8BFB\u53D6\u56FA\u5B9A\u5BA1\u67E5\u8BB0\u5F55"),
                                    React.createElement("button", { className: "secondary", disabled: report.integrity !== 'verified' || s.checking || !!s.verificationError, onClick: () => this.openPublicationReview(group.resultId, review.id) }, "\u56DE\u67E5\u6B64\u6784\u5EFA\u4E0E\u5BA1\u67E5"))))) : React.createElement("p", { className: "small muted" }, "\u65E7\u62A5\u544A\u672A\u8BB0\u5F55\u8BBA\u6587\u5BA1\u67E5\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u5B9A\u5DF2\u901A\u8FC7\u3002")),
                        React.createElement("details", { open: true },
                            React.createElement("summary", null, "\u7ED1\u5B9A\u7684\u8BC1\u636E\u4E0E\u6765\u6E90"),
                            report.references.length ? React.createElement("ul", null, report.references.map(ref => React.createElement("li", { key: ref.id },
                                React.createElement("button", { className: "text-button", disabled: !Object.prototype.hasOwnProperty.call(referenceTypes, ref.type), onClick: () => void this.readReference(ref.id) }, ref.label),
                                React.createElement("small", null,
                                    " \u00B7 ",
                                    referenceTypes[ref.type] ?? '未知引用类型',
                                    ref.relation === 'ancestry' ? ' · 祖先来源（非当前源码）' : ref.relation === 'exact' ? ' · 精确绑定' : '')))) : React.createElement("p", { className: "small muted" }, "\u6B64\u5386\u53F2\u62A5\u544A\u6CA1\u6709\u53EF\u6838\u9A8C\u7684\u56FA\u5B9A\u5F15\u7528\u6E05\u5355\uFF1B\u4FDD\u7559\u539F\u6587\u4E2D\u7684 ID\u3002")),
                        s.reference ? React.createElement("section", { className: "inspector-section", "aria-label": "\u7ED1\u5B9A\u8BC1\u636E\u9884\u89C8" },
                            React.createElement("h3", null, s.reference.label),
                            React.createElement("p", { className: "small muted" },
                                referenceTypes[s.reference.type],
                                " \u00B7 ",
                                s.reference.path ?? s.reference.targetId),
                            s.reference.digest ? React.createElement("code", { className: "digest" }, s.reference.digest) : null,
                            s.referenceError ? React.createElement("p", { role: "alert", className: "error-text" }, s.referenceError) : null,
                            s.reference.type === 'artifact' ? React.createElement("button", { className: "secondary compact", disabled: report.integrity !== 'verified' || s.checking || !!s.verificationError || !report.references.some(ref => sameReference(ref, s.reference)), onClick: () => void this.downloadReference() }, "\u4E0B\u8F7D\u56FA\u5B9A\u539F\u59CB\u4EA7\u7269") : null,
                            s.reference.document ? React.createElement("div", null,
                                React.createElement("p", { className: "small muted" },
                                    "\u7269\u7406\u9875 ",
                                    s.reference.document.pageNumber,
                                    " \u00B7 \u9875\u6807\u7B7E ",
                                    s.reference.document.pageLabel ?? '未知',
                                    " \u00B7 UTF-16 [",
                                    s.reference.document.start,
                                    ", ",
                                    s.reference.document.end,
                                    ")"),
                                React.createElement("div", { className: "actions wrap" },
                                    React.createElement("button", { className: "secondary compact", disabled: !this.documentReference() || !this.props.onDocument, onClick: () => this.openDocument() }, "\u56DE\u5230\u56FA\u5B9A\u9875\u6BB5"),
                                    React.createElement("button", { className: "secondary compact", disabled: !this.documentReference(), onClick: () => void this.downloadDocument('raw') }, "\u4E0B\u8F7D\u539F\u4EF6 PDF"),
                                    React.createElement("button", { className: "secondary compact", disabled: !this.documentReference(), onClick: () => void this.downloadDocument('image') }, "\u4E0B\u8F7D\u5F15\u7528\u9875 PNG")),
                                React.createElement("p", { className: "small muted" }, "\u6765\u6E90\u3001\u7248\u672C\u3001\u8BB8\u53EF\u548C\u89E3\u6790\u8D28\u91CF\u89C1\u4E0B\u65B9\u56FA\u5B9A\u8BB0\u5F55\uFF1B\u8BB8\u53EF\u672A\u77E5\u4E0D\u4EE3\u8868\u83B7\u5F97\u518D\u5206\u53D1\u8BB8\u53EF\u3002")) : null,
                            React.createElement("pre", { className: "document-preview" }, s.content || (s.reading ? '读取固定内容…' : '（空内容）')),
                            React.createElement("button", { className: "secondary compact", disabled: s.reading || s.complete, onClick: () => void this.readReference(s.reference.id, true) }, s.reading ? '读取中…' : s.complete ? '已完整读取' : '读取后续内容')) : null,
                        React.createElement("details", null,
                            React.createElement("summary", null, "\u539F\u59CB Markdown\uFF08\u7EAF\u6587\u672C\uFF09"),
                            React.createElement("pre", { className: "document-preview" }, s.body))) : !s.loading && !s.error ? React.createElement(Empty, { title: "\u9009\u62E9\u62A5\u544A\u56DE\u67E5\u8BC1\u636E" },
                        React.createElement("p", null, "\u6B63\u6587\u3001\u4EE3\u7801\u548C URL \u5747\u6309\u7EAF\u6587\u672C\u5C55\u793A\uFF0C\u5F15\u7528\u53EA\u8BFB\u53D6\u62A5\u544A\u4E2D\u5DF2\u7ED1\u5B9A\u7684\u8BB0\u5F55\u3002")) : null)));
    }
}
