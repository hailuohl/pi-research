import { api, artifactBlob, downloadArtifact } from './api.js';
import { verifiedPageImage } from './literature-view.js';
import { short, label } from './models.js';
import { Badge } from './ui.js';
import { PublicationReviewPanel } from './publication-review-view.js';
function publicationPath(path) { return !!path && path.length <= 240 && path.split('/').every(part => /^[A-Za-z0-9_][A-Za-z0-9_. -]*$/.test(part) && !/[. ]$/.test(part) && !/^AGENTS(?:\.|$)/i.test(part) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part)); }
export function publicationSourcePath(path) { return publicationPath(path) && /\.(tex|bib|sty|cls|bst|txt|csv)$/i.test(path); }
function publicationPathAvailable(path, files) { const target = path.toLowerCase(); return publicationPath(path) && !files.some(f => { const existing = f.path.toLowerCase(); return existing === target || existing.startsWith(target + '/') || target.startsWith(existing + '/'); }); }
export function publicationLineRange(content, line) { if (!Number.isSafeInteger(line) || line < 1)
    return null; const lines = content.split('\n'); if (line > lines.length)
    return null; const start = lines.slice(0, line - 1).reduce((sum, value) => sum + value.length + 1, 0); return { start, end: start + lines[line - 1].length }; }
function publicationSourceSignature(data, revision, job) {
    const artifactIds = new Set(revision.files.map(f => f.artifactId)), sourceIds = new Set(revision.files.map(f => f.provenance.id)), approvalIds = new Set([job.approvalId, ...revision.files.map(f => f.provenance.approvalId)]);
    const runs = (data.runs ?? []).filter(r => sourceIds.has(r.id)), sandbox = (data.sandboxJobs ?? []).filter(j => sourceIds.has(j.id));
    const versions = (rows) => (rows ?? []).map(row => { const r = row; return [r.id, r.version ?? null, r.state ?? null, r.status ?? null, r.sourceDigest ?? null]; }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return JSON.stringify([data.project.id, data.project.version, data.project.archived, versions(data.approvals.filter(a => approvalIds.has(a.id))), versions(data.artifacts.filter(a => artifactIds.has(a.id))), versions(runs), versions((data.intents ?? []).filter(i => runs.some(r => r.intentId === i.id))), versions(sandbox), versions((data.developmentTasks ?? []).filter(t => sandbox.some(j => j.developmentTaskId === t.id))), versions(data.experiments), versions(data.sessions), versions(data.teams), versions(data.tasks)]);
}
export class PublicationView extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { templates: [], status: null, revisions: [], nextRevision: null, revision: null, jobs: [], nextJob: null, job: null, result: null, sourcePath: '', source: '', sourceComplete: false, sourceLine: null, busy: false, loading: false, error: '', context: 'desktop-linux', image: '', seedVersion: 0, pollStopped: false, sourceChecking: false, sourceCheckError: '', selectedReviewId: '' };
        this.workspaceElement = null;
        this.mounted = true;
        this.selectionEpoch = 0;
        this.sourceEpoch = 0;
        this.jobEpoch = 0;
        this.refreshEpoch = 0;
        this.polls = 0;
        this.sourceElement = null;
    }
    call(name, input = {}) { return api(`/operations/${name}`, { projectId: this.props.data.project.id, input }); }
    storageKey() { return `pi-publication:${this.props.data.project.id}`; }
    remember(revisionId, jobId = '') { try {
        localStorage.setItem(this.storageKey(), JSON.stringify({ revisionId, jobId }));
    }
    catch { } }
    componentDidMount() { void this.initialize(); }
    componentDidUpdate(prev) { const { revision, job } = this.state; if (revision && job && publicationSourceSignature(prev.data, revision, job) !== publicationSourceSignature(this.props.data, revision, job))
        void this.refreshJob(job.id); }
    componentWillUnmount() { this.mounted = false; this.selectionEpoch++; this.sourceEpoch++; this.jobEpoch++; this.refreshEpoch++; clearTimeout(this.timer); }
    async initialize() { const selection = this.selectionEpoch; this.setState({ loading: true, error: '' }); try {
        const [templates, status, list] = await Promise.all([this.call('publication_templates'), this.call('publication_status'), this.call('manuscript_list', { cursor: 0, limit: 30 })]);
        if (!this.mounted)
            return;
        this.setState({ templates, status, revisions: list.items, nextRevision: list.nextCursor });
        let saved;
        try {
            saved = JSON.parse(localStorage.getItem(this.storageKey()) ?? 'null');
        }
        catch { }
        if (selection === this.selectionEpoch && typeof saved?.revisionId === 'string')
            await this.openRevision(saved.revisionId, typeof saved.jobId === 'string' ? saved.jobId : undefined);
    }
    catch (error) {
        if (this.mounted)
            this.setState({ error: String(error) });
    }
    finally {
        if (this.mounted)
            this.setState({ loading: false });
    } }
    async moreRevisions() { if (this.state.nextRevision === null)
        return; const list = await this.call('manuscript_list', { cursor: this.state.nextRevision, limit: 30 }); if (this.mounted)
        this.setState({ revisions: [...this.state.revisions, ...list.items.filter(r => !this.state.revisions.some(old => old.id === r.id))], nextRevision: list.nextCursor }); }
    async run(action) { if (this.state.busy)
        return; this.setState({ busy: true, error: '' }); try {
        await this.props.perform(action);
    }
    catch (error) {
        if (this.mounted)
            this.setState({ error: String(error) });
    }
    finally {
        if (this.mounted)
            this.setState({ busy: false });
    } }
    async freeze(draft) { await this.run(async () => { const { assets, files, ...settings } = draft, revision = await this.call('manuscript_create', { ...settings, files: [...files.map(f => ({ path: f.path, contentBase64: publicationBase64(f.content) })), ...assets] }); if (!this.mounted)
        return; this.setState({ revisions: [revision, ...this.state.revisions.filter(r => r.id !== revision.id)] }); await this.openRevision(revision.id); }); }
    async openRevision(id, jobId) { const epoch = ++this.selectionEpoch; this.sourceEpoch++; this.jobEpoch++; clearTimeout(this.timer); this.remember(id, jobId); this.setState({ selectedReviewId: '', revision: null, job: null, result: null, jobs: [], source: '', sourcePath: '', sourceComplete: false, sourceLine: null, error: '', loading: true, pollStopped: false, sourceChecking: false, sourceCheckError: '' }); try {
        const [revision, list] = await Promise.all([this.call('manuscript_inspect', { revisionId: id }), this.call('publication_build_list', { revisionId: id, cursor: 0, limit: 30 })]);
        if (revision.id !== id)
            throw Error('返回的文稿不是所选修订。');
        if (!this.mounted || epoch !== this.selectionEpoch)
            return;
        this.setState({ revision, jobs: list.items, nextJob: list.nextCursor });
        await this.readSource(revision.mainFile);
        if (jobId && this.mounted && epoch === this.selectionEpoch)
            await this.openJob(jobId);
    }
    catch (error) {
        if (this.mounted && epoch === this.selectionEpoch)
            this.setState({ error: String(error) });
    }
    finally {
        if (this.mounted && epoch === this.selectionEpoch)
            this.setState({ loading: false });
    } }
    async sourceContent(revision, path, epoch) { const file = revision.files.find(f => f.path === path); if (!file || !publicationSourcePath(path) || !file.mediaType.startsWith('text/'))
        throw Error('此路径不属于当前文稿的文本文件。'); let content = '', cursor = 0; for (let page = 0; page < 34; page++) {
        const part = await this.call('manuscript_source_read', { revisionId: revision.id, path, cursor, limit: 64000 });
        if (!this.mounted || epoch !== this.selectionEpoch)
            throw Error('文稿选择已改变。');
        if (part.path !== path || part.digest !== file.digest || part.cursor !== cursor || part.end - cursor !== part.content.length || !part.complete && part.end <= cursor)
            throw Error('源文件窗口或摘要不匹配。');
        content += part.content;
        cursor = part.end;
        if (part.complete)
            return content;
    } throw Error('源文件超过有界读取上限，未把部分内容用作完整草稿。'); }
    async readSource(path, line = null) { const revision = this.state.revision; if (!revision)
        return; const epoch = ++this.sourceEpoch, selection = this.selectionEpoch; this.setState({ sourcePath: path, source: '', sourceComplete: false, sourceLine: line, error: '' }); try {
        const source = await this.sourceContent(revision, path, selection);
        if (!this.mounted || epoch !== this.sourceEpoch || selection !== this.selectionEpoch)
            return;
        this.setState({ source, sourceComplete: true }, () => { const range = publicationLineRange(source, line); if (range && this.sourceElement) {
            this.sourceElement.focus();
            this.sourceElement.setSelectionRange(range.start, range.end);
            this.sourceElement.scrollTop = Math.max(0, (line - 3) * 20);
        } });
    }
    catch (error) {
        if (this.mounted && epoch === this.sourceEpoch && selection === this.selectionEpoch)
            this.setState({ error: String(error) });
    } }
    async editRevision() { const revision = this.state.revision; if (!revision)
        return; const selection = this.selectionEpoch; await this.run(async () => { const files = [], assets = []; for (const f of revision.files) {
        if (f.mediaType.startsWith('text/') && publicationSourcePath(f.path))
            files.push({ path: f.path, content: await this.sourceContent(revision, f.path, selection) });
        else
            assets.push({ path: f.path, artifactId: f.artifactId });
    } if (this.mounted && selection === this.selectionEpoch)
        this.setState({ seed: { title: revision.title, engine: revision.engine, mainFile: revision.mainFile, bibliography: revision.bibliography, files, assets }, seedVersion: this.state.seedVersion + 1 }); }); }
    async openJob(id) { const revision = this.state.revision; if (!revision)
        return; const epoch = ++this.jobEpoch, selection = this.selectionEpoch; clearTimeout(this.timer); this.polls = 0; this.remember(revision.id, id); this.setState({ selectedReviewId: '', job: null, result: null, error: '', pollStopped: false }); await this.refreshJob(id, epoch, selection); }
    async refreshJob(id, epoch = this.jobEpoch, selection = this.selectionEpoch) { const request = ++this.refreshEpoch; clearTimeout(this.timer); this.setState({ sourceChecking: true, sourceCheckError: '' }); try {
        const job = await this.call('publication_inspect', { jobId: id });
        if (!this.mounted || epoch !== this.jobEpoch || selection !== this.selectionEpoch || request !== this.refreshEpoch)
            return;
        const revision = this.state.revision;
        if (job.id !== id || !revision || job.revisionId !== revision.id || job.sourceDigest !== revision.sourceDigest)
            throw Error('构建任务不属于当前固定文稿。');
        this.setState({ job, jobs: [job, ...this.state.jobs.filter(j => j.id !== id)] });
        if (job.resultId) {
            const result = await this.call('publication_result', { resultId: job.resultId });
            if (result.id !== job.resultId || result.jobId !== id || result.revisionId !== revision.id || result.sourceDigest !== revision.sourceDigest || result.manifestDigest !== job.manifestDigest)
                throw Error('构建结果绑定与所选任务不一致。');
            if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch)
                this.setState({ result });
        }
        if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch && ['queued', 'starting', 'running', 'unknown'].includes(job.state)) {
            if (++this.polls <= 40)
                this.timer = setTimeout(() => void this.refreshJob(id, epoch, selection), 3000);
            else
                this.setState({ pollStopped: true });
        }
    }
    catch (error) {
        if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch)
            this.setState({ error: String(error), sourceCheckError: String(error), pollStopped: true });
    }
    finally {
        if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch)
            this.setState({ sourceChecking: false });
    } }
    async moreJobs() { const revision = this.state.revision, selection = this.selectionEpoch; if (!revision || this.state.nextJob === null)
        return; const list = await this.call('publication_build_list', { revisionId: revision.id, cursor: this.state.nextJob, limit: 30 }); if (this.mounted && selection === this.selectionEpoch)
        this.setState({ jobs: [...this.state.jobs, ...list.items.filter(j => !this.state.jobs.some(old => old.id === j.id))], nextJob: list.nextCursor }); }
    async openFixed(revisionId, jobId, reviewId) { const opening = this.openRevision(revisionId, jobId), selection = this.selectionEpoch; await opening; if (this.mounted && selection === this.selectionEpoch && this.state.revision?.id === revisionId && this.state.job?.id === jobId) {
        this.setState({ selectedReviewId: reviewId ?? '' });
        this.workspaceElement?.focus();
    } }
    selectableResult() { const s = this.state, r = s.result, j = s.job; return !s.loading && !s.sourceChecking && !s.sourceCheckError && j?.state === 'succeeded' && j.integrity === 'complete' && r?.status === 'succeeded' && r.converged && !r.hadErrors && !!r.pdf && r.sourceValidity === 'current' && r.id === j.resultId && r.jobId === j.id && r.revisionId === s.revision?.id ? r : null; }
    selectResult() { const result = this.selectableResult(); if (result)
        this.props.onSelectResult?.(result, this.state.revision.title); }
    render() { const s = this.state, r = s.revision, j = s.job, approval = this.props.data.approvals.find(a => a.id === j?.approvalId); return React.createElement("div", { "aria-label": "\u6587\u7A3F\u6784\u5EFA\u5DE5\u4F5C\u533A" },
        React.createElement(ManuscriptEditor, { key: s.seedVersion, seed: s.seed, templates: s.templates, data: this.props.data, busy: s.busy, onFreeze: draft => void this.freeze(draft) }),
        React.createElement("section", { className: "surface report-builder", tabIndex: -1, ref: (node) => { this.workspaceElement = node; }, "aria-label": "\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\u56DE\u67E5" },
            React.createElement("h2", null, "\u9694\u79BB\u6587\u7A3F\u6784\u5EFA"),
            s.loading ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u8BFB\u53D6\u56FA\u5B9A\u6587\u7A3F\u2026") : null,
            s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
            React.createElement("details", null,
                React.createElement("summary", null, "\u56FA\u5B9A\u7F16\u8BD1\u73AF\u5883\u914D\u7F6E"),
                React.createElement("p", null, s.status?.configured ? '固定编译镜像已配置，每个构建另行批准。' : '编译环境未配置；需在宿主准备固定镜像。页面不会下载或安装依赖。'),
                s.status?.configuration ? React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } }, s.status.configuration.imageDigest) : null,
                React.createElement("form", { onSubmit: (e) => { e.preventDefault(); void this.run(async () => { const status = await this.call('publication_configure', { expectedVersion: s.status.version, dockerContext: s.context, imageDigest: s.image.trim() }); if (this.mounted)
                        this.setState({ status }); }); } },
                    React.createElement("label", null,
                        "\u7F16\u8BD1 Docker context",
                        React.createElement("input", { "aria-label": "\u7F16\u8BD1 Docker context", required: true, value: s.context, onChange: (e) => this.setState({ context: e.target.value }) })),
                    React.createElement("label", null,
                        "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u6458\u8981",
                        React.createElement("input", { "aria-label": "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u6458\u8981", required: true, pattern: "(?:.+@)?sha256:[a-f0-9]{64}", value: s.image, onChange: (e) => this.setState({ image: e.target.value }) })),
                    React.createElement("button", { className: "secondary", disabled: !s.status || s.busy }, "\u663E\u5F0F\u4FDD\u5B58\u7F16\u8BD1\u914D\u7F6E"))),
            React.createElement("label", null,
                "\u5386\u53F2\u56FA\u5B9A\u6587\u7A3F",
                React.createElement("select", { "aria-label": "\u5386\u53F2\u56FA\u5B9A\u6587\u7A3F", value: r?.id ?? '', onChange: (e) => { if (e.target.value)
                        void this.openRevision(e.target.value); } },
                    React.createElement("option", { value: "" }, "\u9009\u62E9\u56FA\u5B9A\u4FEE\u8BA2"),
                    (r && !s.revisions.some(row => row.id === r.id) ? [r, ...s.revisions] : s.revisions).map(row => React.createElement("option", { key: row.id, value: row.id },
                        row.title,
                        " \u00B7 ",
                        short(row.id),
                        " \u00B7 ",
                        row.engine)))),
            s.nextRevision !== null ? React.createElement("button", { className: "text-button", onClick: () => void this.run(() => this.moreRevisions()) }, "\u8BFB\u53D6\u66F4\u591A\u5386\u53F2\u4FEE\u8BA2") : null,
            r ? React.createElement("div", null,
                React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                    "\u6587\u7A3F\u6E90\u7801 SHA-256 ",
                    r.sourceDigest),
                React.createElement("p", null,
                    r.engine,
                    " \u00B7 \u4E3B\u6587\u4EF6 ",
                    r.mainFile,
                    " \u00B7 \u53C2\u8003\u6587\u732E ",
                    r.bibliography),
                React.createElement("button", { className: "secondary", onClick: () => this.props.perform(() => downloadArtifact(r.manifestArtifactId, 'manuscript-manifest.json')) }, "\u4E0B\u8F7D\u56FA\u5B9A\u6587\u7A3F\u6E05\u5355"),
                React.createElement("div", { className: "actions wrap" },
                    React.createElement("button", { className: "secondary", disabled: s.busy, onClick: () => void this.editRevision() }, "\u590D\u5236\u6587\u672C\u5230\u53EF\u7F16\u8F91\u65B0\u8349\u7A3F\uFF08\u91CD\u65B0\u5F52\u6863\u6587\u672C\uFF09"),
                    React.createElement("button", { className: "primary", disabled: s.busy || !s.status?.configured, onClick: () => void this.run(async () => { const selection = this.selectionEpoch, job = await this.call('publication_prepare', { revisionId: r.id }); if (this.mounted && selection === this.selectionEpoch)
                            await this.openJob(job.id); }) }, "\u51C6\u5907\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA")),
                React.createElement("p", { className: "small muted" }, "\u590D\u5236\u6587\u672C\u4F1A\u8F6C\u6362\u4E3A\u53EF\u7F16\u8F91\u5185\u5BB9\uFF0C\u518D\u51BB\u7ED3\u65F6\u91CD\u65B0\u5F52\u6863\uFF1B\u539F\u6587\u672C\u4EA7\u7269\u7ED1\u5B9A\u4E0D\u6CBF\u7528\uFF0C\u65E7\u4FEE\u8BA2\u4E0E\u539F\u4EA7\u7269\u4FDD\u7559\u3002"),
                React.createElement("details", null,
                    React.createElement("summary", null, "\u56FA\u5B9A\u6587\u4EF6\u4E0E\u5DF2\u77E5\u6765\u6E90"),
                    r.files.map(f => React.createElement("div", { className: "inspector-section", key: f.path },
                        React.createElement("strong", null, f.path),
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                            "\u4EA7\u7269 ID ",
                            f.artifactId),
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                            "SHA-256 ",
                            f.digest),
                        React.createElement("p", { className: "small muted" },
                            f.provenance.kind,
                            " \u00B7 ",
                            f.provenance.id ?? '来源未知',
                            " \u00B7 ",
                            f.provenance.sourceDigest ?? '未提供源码来源'),
                        React.createElement("button", { className: "text-button", onClick: () => this.props.perform(() => downloadArtifact(f.artifactId, f.path.split('/').pop())) },
                            "\u4E0B\u8F7D\u6E90\u6587\u4EF6 ",
                            f.path)))),
                React.createElement("label", null,
                    "\u56FA\u5B9A\u6E90\u6587\u4EF6",
                    React.createElement("select", { "aria-label": "\u56FA\u5B9A\u6E90\u6587\u4EF6", value: s.sourcePath, onChange: (e) => void this.readSource(e.target.value) }, r.files.filter(f => f.mediaType.startsWith('text/') && publicationSourcePath(f.path)).map(f => React.createElement("option", { key: f.path, value: f.path }, f.path)))),
                React.createElement("label", null,
                    "\u56FA\u5B9A\u6E90\u7801\uFF08\u53EA\u8BFB\uFF09",
                    React.createElement("textarea", { "aria-label": "\u56FA\u5B9A\u6E90\u7801\u5B9A\u4F4D", ref: (node) => { this.sourceElement = node; }, readOnly: true, rows: 14, spellCheck: false, value: s.source })),
                React.createElement("p", { className: "small muted" },
                    s.sourceComplete ? '固定源码已完整读取' : '固定源码尚未完整读取',
                    s.sourceLine !== null ? ` · 诊断行 ${s.sourceLine}${publicationLineRange(s.source, s.sourceLine) ? '（已选中）' : '（不在当前文件范围内）'}` : ''),
                React.createElement("h3", null, "\u6301\u4E45\u6784\u5EFA\u4EFB\u52A1"),
                s.jobs.length ? React.createElement("label", null,
                    "\u5386\u53F2\u6784\u5EFA",
                    React.createElement("select", { "aria-label": "\u5386\u53F2\u6587\u7A3F\u6784\u5EFA", value: j?.id ?? '', onChange: (e) => { if (e.target.value)
                            void this.openJob(e.target.value); } },
                        React.createElement("option", { value: "" }, "\u9009\u62E9\u6784\u5EFA\u4EFB\u52A1"),
                        s.jobs.map(job => React.createElement("option", { key: job.id, value: job.id },
                            short(job.id),
                            " \u00B7 ",
                            label(job.state))))) : React.createElement("p", { className: "inline-empty" }, "\u6B64\u4FEE\u8BA2\u5C1A\u65E0\u6784\u5EFA\u4EFB\u52A1\u3002"),
                s.nextJob !== null ? React.createElement("button", { className: "text-button", onClick: () => void this.run(() => this.moreJobs()) }, "\u8BFB\u53D6\u66F4\u591A\u6784\u5EFA") : null,
                j ? React.createElement("div", { className: "inspector-section" },
                    React.createElement("h3", null,
                        "\u6784\u5EFA ",
                        short(j.id)),
                    React.createElement(Badge, { value: j.state }),
                    React.createElement(Badge, { value: j.integrity }),
                    React.createElement("p", null,
                        "\u5F15\u64CE ",
                        j.engine,
                        " \u00B7 \u5165\u53E3 ",
                        j.mainFile,
                        " \u00B7 \u53C2\u8003\u6587\u732E ",
                        j.bibliography),
                    React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                        "\u56FA\u5B9A\u6765\u6E90 ",
                        j.sourceDigest),
                    React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                        "\u6784\u5EFA\u6E05\u5355 ",
                        j.manifestDigest),
                    React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                        "\u955C\u50CF ",
                        j.imageDigest),
                    React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                        "\u7F16\u8BD1\u914D\u7F6E ",
                        j.profileDigest),
                    React.createElement("details", null,
                        React.createElement("summary", null, "\u56FA\u5B9A\u6784\u5EFA\u811A\u672C\u4E0E\u4F9D\u8D56"),
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                            "\u811A\u672C ",
                            j.scriptDigest),
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                            "\u4F9D\u8D56\u9501 ",
                            j.lockDigest),
                        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                            "Dockerfile ",
                            j.dockerfileDigest)),
                    React.createElement("p", { className: "small muted" },
                        j.dockerContext,
                        " \u00B7 ",
                        Object.entries(j.resources).map(([key, value]) => `${key}=${value}`).join(' · ')),
                    j.error ? React.createElement("p", { role: "alert", className: "error-text" }, j.error) : null,
                    React.createElement("div", { className: "actions wrap" },
                        j.state === 'prepared' && approval?.status === 'pending' ? React.createElement("button", { className: "primary", disabled: s.busy, onClick: () => void this.run(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }); }) }, "\u6279\u51C6\u6B64\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA") : null,
                        j.state === 'prepared' && approval?.status === 'pending' ? React.createElement("button", { className: "secondary", disabled: s.busy, onClick: () => void this.run(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false }); }) }, "\u62D2\u7EDD\u6587\u7A3F\u6784\u5EFA") : null,
                        j.state === 'prepared' && approval?.status === 'approved' ? React.createElement("button", { className: "primary", disabled: s.busy, onClick: () => void this.run(async () => { const epoch = this.jobEpoch, selection = this.selectionEpoch; await this.call('publication_submit', { jobId: j.id }); if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch)
                                await this.openJob(j.id); }) }, "\u63D0\u4EA4\u5DF2\u6279\u51C6\u6587\u7A3F\u6784\u5EFA") : null,
                        ['prepared', 'queued', 'starting', 'running', 'unknown'].includes(j.state) ? React.createElement("button", { className: "text-button danger", disabled: s.busy, onClick: () => void this.run(async () => { const epoch = this.jobEpoch, selection = this.selectionEpoch; await this.call('publication_cancel', { jobId: j.id }); if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch)
                                await this.openJob(j.id); }) }, "\u8BF7\u6C42\u53D6\u6D88\u6587\u7A3F\u6784\u5EFA") : null,
                        React.createElement("button", { className: "secondary", onClick: () => void this.openJob(j.id) }, "\u5237\u65B0\u6B64\u6784\u5EFA\u72B6\u6001")),
                    s.pollStopped ? React.createElement("p", { role: "status" }, "\u81EA\u52A8\u8F6E\u8BE2\u5DF2\u505C\u6B62\uFF1B\u540E\u53F0\u4EFB\u52A1\u4E0D\u53D7\u5F71\u54CD\uFF0C\u53EF\u624B\u52A8\u5237\u65B0\u6B64\u6784\u5EFA\u3002") : null,
                    s.result ? React.createElement("div", null,
                        s.sourceChecking ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u91CD\u65B0\u6838\u9A8C\u5F53\u524D\u6765\u6E90\u72B6\u6001\u2026") : s.sourceCheckError ? React.createElement("p", { role: "alert", className: "inline-warning" },
                            "\u5F53\u524D\u6765\u6E90\u6838\u9A8C\u5931\u8D25\uFF1B\u4FDD\u7559\u5386\u53F2\u6784\u5EFA\u4F9B\u56DE\u67E5\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002",
                            s.sourceCheckError) : s.result.sourceValidity === 'stale' ? React.createElement("p", { role: "alert", className: "inline-warning" },
                            "\u5386\u53F2\u6784\u5EFA\uFF0C\u5F53\u524D\u6765\u6E90\u5931\u6548\u3002",
                            s.result.sourceError ?? 'PUBLICATION_SOURCE_STALE',
                            "\uFF1B\u5386\u53F2 PDF \u4E0E\u56FA\u5B9A\u6E90\u6587\u4EF6\u4ECD\u53EF\u56DE\u67E5\u3002") : React.createElement("p", { className: "small muted" }, s.result.sourceValidity === 'current' ? '当前来源有效（最近一次核验）' : '当前来源状态未知，请刷新此构建。'),
                        this.props.onSelectResult ? React.createElement("button", { className: "secondary", disabled: !this.selectableResult() || this.props.selectedResultIds?.includes(s.result.id) || (this.props.selectedResultIds?.length ?? 0) >= 20, onClick: () => this.selectResult() }, this.props.selectedResultIds?.includes(s.result.id) ? '已纳入待生成报告' : '纳入此固定构建') : null,
                        React.createElement(PublicationReviewPanel, { key: s.result.id, data: this.props.data, result: s.result, ready: !!this.selectableResult(), perform: this.props.perform, onSession: this.props.onSession, selectedReviewId: s.selectedReviewId }),
                        React.createElement("h3", null, "\u56FA\u5B9A\u6784\u5EFA\u8BCA\u65AD"),
                        s.result.diagnostics.length ? React.createElement("ul", null, s.result.diagnostics.map((d, i) => React.createElement("li", { key: i },
                            d.severity,
                            " \u00B7 ",
                            d.code,
                            " \u00B7 ",
                            d.message,
                            " ",
                            React.createElement("span", null,
                                d.file ?? '文件未知',
                                ":",
                                d.line ?? '行号未知'),
                            d.file && publicationSourcePath(d.file) && r.files.some(f => f.path === d.file && f.mediaType.startsWith('text/')) && d.line !== null ? React.createElement("button", { className: "text-button", onClick: () => void this.readSource(d.file, d.line) },
                                "\u5B9A\u4F4D ",
                                d.file,
                                ":",
                                d.line) : null))) : React.createElement("p", null, "\u672A\u8BB0\u5F55\u8BCA\u65AD\u3002"),
                        React.createElement(PublicationPreview, { key: s.result.id, result: s.result, ready: j.state === 'succeeded' && j.integrity === 'complete', perform: this.props.perform })) : null) : null) : React.createElement("p", { className: "inline-empty" }, "\u9009\u62E9\u5386\u53F2\u4FEE\u8BA2\u6216\u51BB\u7ED3\u4E00\u4EFD\u65B0\u6587\u7A3F\u3002"))); }
}
export function publicationBase64(content) { const bytes = new TextEncoder().encode(content); if (bytes.length > 2 * 1024 * 1024)
    throw Error('单个文本文件最多 2 MiB'); let binary = ''; for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(binary); }
class ManuscriptEditor extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { title: '研究文稿', templateId: '', engine: 'pdflatex', mainFile: 'main.tex', bibliography: 'none', files: [], assets: [], selected: '', newPath: 'references.bib', assetId: '', assetPath: 'main.tex', error: '', checking: false, preview: '', previewComplete: false };
        this.epoch = 0;
        this.mounted = true;
    }
    componentDidMount() { if (this.props.seed)
        this.setState({ ...this.props.seed, templateId: this.props.seed.templateId ?? '', selected: this.props.seed.mainFile }); }
    componentWillUnmount() { this.mounted = false; this.epoch++; }
    changeAsset(patch) { this.epoch++; this.setState({ ...patch, checking: false, preview: '', previewComplete: false, error: '' }); }
    template(id) { this.changeAsset({}); const t = this.props.templates.find(t => t.id === id); if (!t)
        return; if (t.files.some(f => !publicationPathAvailable(f.path, this.state.assets))) {
        this.setState({ error: '模板与固定文件路径冲突；请先移除冲突引用，现有草稿未改变。' });
        return;
    } this.setState({ templateId: t.id, engine: t.engine, mainFile: t.mainFile, bibliography: t.bibliography, files: t.files.map(f => ({ ...f })), selected: t.mainFile, error: '' }); }
    addFile() { const path = this.state.newPath.trim(); if (!publicationSourcePath(path) || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets])) {
        this.setState({ error: '请输入唯一的相对文本文件路径，例如 sections/method.tex。' });
        return;
    } this.setState({ files: [...this.state.files, { path, content: '' }], selected: path, error: '' }); }
    readArtifact(artifactId) { return api('/operations/artifact_read', { projectId: this.props.data.project.id, input: { artifactId, cursor: 0 } }); }
    async addAsset() {
        if (this.state.checking || this.props.busy)
            return;
        const { assetId, assetPath } = this.state, path = assetPath.trim(), projectId = this.props.data.project.id, artifact = this.props.data.artifacts.find(a => a.id === assetId && a.projectId === projectId);
        if (!artifact || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets]) || !publicationSourcePath(path) && !/\.(png|jpe?g|pdf)$/i.test(path)) {
            this.setState({ error: '请选择当前项目的产物，并指定唯一且受支持的相对目标路径。' });
            return;
        }
        const epoch = ++this.epoch;
        this.setState({ checking: true, error: '', preview: '', previewComplete: false });
        try {
            if (!Number.isSafeInteger(artifact.size) || artifact.size < 0 || artifact.size > (publicationSourcePath(path) ? 2 : 8) * 1024 * 1024)
                throw Error('产物超过单文件上限：文本 2 MiB，图形 8 MiB。');
            let preview = '', previewComplete = false;
            if (publicationSourcePath(path)) {
                const part = await this.readArtifact(assetId);
                if (part.artifactId !== assetId || part.digest !== artifact.digest || typeof part.content !== 'string' || part.content.length > 16000 || part.cursor !== part.content.length || typeof part.complete !== 'boolean' || !part.complete && part.cursor !== 16000 || part.content.includes('\0'))
                    throw Error('固定文本预览的产物、摘要或窗口不匹配。');
                preview = part.content;
                previewComplete = part.complete;
            }
            if (!this.mounted || epoch !== this.epoch || this.props.data.project.id !== projectId)
                return;
            const current = this.props.data.artifacts.find(a => a.id === assetId && a.projectId === projectId);
            if (!current || current.digest !== artifact.digest || current.size !== artifact.size || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets]))
                throw Error('产物或目标路径已改变，请重新选择。');
            this.setState({ assets: [...this.state.assets, { path, artifactId: assetId }], preview, previewComplete, error: '' });
        }
        catch (error) {
            if (this.mounted && epoch === this.epoch)
                this.setState({ error: String(error) });
        }
        finally {
            if (this.mounted && epoch === this.epoch)
                this.setState({ checking: false });
        }
    }
    render() { const s = this.state, file = s.files.find(f => f.path === s.selected), artifact = this.props.data.artifacts.find(a => a.id === s.assetId), allFiles = [...s.files, ...s.assets]; return React.createElement("section", { className: "surface report-builder" },
        React.createElement("h2", null, "\u56FA\u5B9A\u6587\u7A3F\u4FEE\u8BA2"),
        React.createElement("p", { className: "small muted" }, "\u9009\u62E9\u5DF2\u5F52\u6863 TeX \u56FA\u5B9A\u5F15\u7528\uFF0C\u6216\u4ECE\u53D7\u7BA1\u6A21\u677F\u7F16\u8F91\uFF1B\u51BB\u7ED3\u65F6\u521B\u5EFA\u65B0\u4FEE\u8BA2\uFF0C\u65E7\u6E90\u6587\u4EF6\u4E0E PDF \u4FDD\u7559\u3002\u7F16\u8BD1\u901A\u8FC7\u4E0D\u4EE3\u8868\u79D1\u5B66\u5BA1\u67E5\u901A\u8FC7\u3002"),
        React.createElement("label", null,
            "\u57FA\u7840\u6A21\u677F",
            React.createElement("select", { "aria-label": "\u6587\u7A3F\u57FA\u7840\u6A21\u677F", value: s.templateId, onChange: (e) => this.template(e.target.value) },
                React.createElement("option", { value: "" }, "\u9009\u62E9\u6A21\u677F"),
                this.props.templates.map(t => React.createElement("option", { key: t.id, value: t.id }, t.title)))),
        React.createElement("label", null,
            "\u6587\u7A3F\u6807\u9898",
            React.createElement("input", { "aria-label": "\u6587\u7A3F\u6807\u9898", maxLength: 200, value: s.title, onChange: (e) => this.setState({ title: e.target.value }) })),
        React.createElement("div", { className: "form-columns" },
            React.createElement("label", null,
                "\u7F16\u8BD1\u5F15\u64CE",
                React.createElement("select", { "aria-label": "\u6587\u7A3F\u7F16\u8BD1\u5F15\u64CE", value: s.engine, onChange: (e) => this.setState({ engine: e.target.value }) }, ['pdflatex', 'xelatex', 'lualatex'].map(engine => React.createElement("option", { key: engine, value: engine }, engine)))),
            React.createElement("label", null,
                "\u53C2\u8003\u6587\u732E\u7B56\u7565",
                React.createElement("select", { "aria-label": "\u53C2\u8003\u6587\u732E\u7B56\u7565", value: s.bibliography, onChange: (e) => this.setState({ bibliography: e.target.value }) }, ['none', 'auto', 'bibtex', 'biber'].map(mode => React.createElement("option", { key: mode, value: mode }, mode)))),
            React.createElement("label", null,
                "\u4E3B TeX \u6587\u4EF6",
                React.createElement("select", { "aria-label": "\u4E3B TeX \u6587\u4EF6", value: s.mainFile, onChange: (e) => this.setState({ mainFile: e.target.value }) },
                    React.createElement("option", { value: "" }, "\u9009\u62E9\u4E3B\u6587\u4EF6"),
                    allFiles.filter(f => f.path.endsWith('.tex')).map(f => React.createElement("option", { key: f.path, value: f.path },
                        f.path,
                        'artifactId' in f ? ' · 固定产物' : ''))))),
        React.createElement("label", null,
            "\u7F16\u8F91\u8349\u7A3F\u6587\u4EF6",
            React.createElement("select", { "aria-label": "\u7F16\u8F91\u8349\u7A3F\u6587\u4EF6", value: s.selected, onChange: (e) => this.setState({ selected: e.target.value }) }, s.files.map(f => React.createElement("option", { key: f.path, value: f.path }, f.path)))),
        file ? React.createElement("div", null,
            React.createElement("label", null,
                file.path,
                React.createElement("textarea", { "aria-label": "\u6587\u7A3F\u6E90\u6587\u4EF6\u5185\u5BB9", rows: 18, spellCheck: false, value: file.content, onChange: (e) => this.setState({ files: s.files.map(f => f.path === file.path ? { ...f, content: e.target.value } : f) }) })),
            React.createElement("button", { className: "text-button danger", disabled: file.path === s.mainFile, onClick: () => this.setState({ files: s.files.filter(f => f.path !== file.path), selected: s.mainFile }) }, "\u5220\u9664\u5F53\u524D\u8349\u7A3F\u6587\u4EF6")) : React.createElement("p", { className: "inline-empty" }, "\u5DF2\u5F52\u6863\u6E90\u7801\u4FDD\u6301\u53EA\u8BFB\u5F15\u7528\uFF1B\u9700\u8981\u7F16\u8F91\u65F6\u53EF\u9009\u6A21\u677F\u6216\u6DFB\u52A0\u65B0\u8349\u7A3F\u6587\u4EF6\u3002"),
        React.createElement("div", { className: "form-columns" },
            React.createElement("label", null,
                "\u65B0\u589E\u6587\u672C\u6587\u4EF6\u8DEF\u5F84",
                React.createElement("input", { "aria-label": "\u65B0\u589E\u6587\u672C\u6587\u4EF6\u8DEF\u5F84", value: s.newPath, onChange: (e) => this.setState({ newPath: e.target.value }) })),
            React.createElement("button", { className: "secondary", onClick: () => this.addFile() }, "\u6DFB\u52A0\u8349\u7A3F\u6587\u4EF6")),
        React.createElement("h3", null, "\u5DF2\u5F52\u6863\u6E90\u7801\u4E0E\u8D44\u4EA7"),
        React.createElement("p", { className: "small muted" }, "\u56FA\u5B9A\u6E90\u6587\u4EF6\u4FDD\u6301\u539F\u4EA7\u7269\u7ED1\u5B9A\uFF0C\u4E0D\u8FDB\u5165\u7F16\u8F91\u533A\uFF1B\u52A0\u5165\u4E0E\u51BB\u7ED3\u4E0D\u4F1A\u542F\u52A8\u7F16\u8BD1\u3002"),
        React.createElement("label", null,
            "\u5F53\u524D\u9879\u76EE\u5DF2\u5F52\u6863\u4EA7\u7269",
            React.createElement("select", { "aria-label": "\u6587\u7A3F\u56FA\u5B9A\u8D44\u4EA7", value: s.assetId, onChange: (e) => this.changeAsset({ assetId: e.target.value }) },
                React.createElement("option", { value: "" }, "\u9009\u62E9\u4EA7\u7269"),
                this.props.data.artifacts.filter(a => a.projectId === this.props.data.project.id).map(a => React.createElement("option", { key: a.id, value: a.id },
                    a.title,
                    " \u00B7 ",
                    short(a.id),
                    " \u00B7 ",
                    short(a.digest))))),
        artifact ? React.createElement("div", { className: "inspector-section" },
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u4EA7\u7269 ID ",
                artifact.id),
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "SHA-256 ",
                artifact.digest),
            React.createElement("p", { className: "small muted" },
                artifact.size,
                " \u5B57\u8282 \u00B7 ",
                artifact.mediaType),
            artifact.origin ? React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u767B\u8BB0 origin\uFF1A",
                artifact.origin) : null,
            artifact.taskId ? React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u767B\u8BB0 taskId\uFF1A",
                artifact.taskId) : null,
            React.createElement("p", { className: "small muted" }, "\u4EE5\u4E0A\u4E3A\u65E2\u6709\u767B\u8BB0\u4FE1\u606F\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u6838\u9A8C\u6765\u6E90\u6216\u79D1\u5B66\u5BA1\u67E5\u901A\u8FC7\u3002")) : null,
        React.createElement("label", null,
            "\u8D44\u4EA7\u5728\u6587\u7A3F\u4E2D\u7684\u8DEF\u5F84",
            React.createElement("input", { "aria-label": "\u8D44\u4EA7\u76EE\u6807\u8DEF\u5F84", value: s.assetPath, onChange: (e) => this.changeAsset({ assetPath: e.target.value }) })),
        React.createElement("button", { className: "secondary", disabled: s.checking || this.props.busy, onClick: () => void this.addAsset() }, publicationSourcePath(s.assetPath.trim()) ? '加入固定源文件' : '加入固定资产'),
        s.checking ? React.createElement("p", { role: "status" }, "\u6B63\u5728\u6838\u9A8C\u5B8C\u6574\u6587\u672C\u4E0E\u56FA\u5B9A\u4EA7\u7269\u6458\u8981\u2026") : null,
        s.preview || s.previewComplete ? React.createElement("div", null,
            React.createElement("label", null,
                "\u56FA\u5B9A\u6587\u672C\u9884\u89C8\uFF08\u53EA\u8BFB\uFF09",
                React.createElement("textarea", { "aria-label": "\u56FA\u5B9A\u6587\u672C\u9884\u89C8\uFF08\u53EA\u8BFB\uFF09", readOnly: true, rows: 8, value: s.preview })),
            React.createElement("p", { className: "small muted" },
                s.previewComplete ? '预览已完整显示' : '仅显示前 16,000 字符，未将部分预览用作完整草稿',
                "\uFF1B\u5B8C\u6574\u539F\u4EA7\u7269\u4FDD\u6301\u56FA\u5B9A\u5F15\u7528\u3002")) : null,
        React.createElement("ul", null, s.assets.map(a => React.createElement("li", { key: a.path },
            a.path,
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "\u4EA7\u7269 ID ",
                a.artifactId),
            React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
                "SHA-256 ",
                this.props.data.artifacts.find(row => row.id === a.artifactId)?.digest ?? '产物记录不可用'),
            " ",
            React.createElement("button", { className: "text-button danger", disabled: a.path === s.mainFile || s.checking, onClick: () => this.setState({ assets: s.assets.filter(f => f.path !== a.path) }) },
                "\u79FB\u9664 ",
                a.path)))),
        s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null,
        React.createElement("button", { className: "primary", disabled: this.props.busy || s.checking || !s.title.trim() || !s.mainFile.endsWith('.tex') || !allFiles.some(f => f.path === s.mainFile), onClick: () => this.props.onFreeze({ title: s.title, engine: s.engine, mainFile: s.mainFile, bibliography: s.bibliography, ...(s.templateId ? { templateId: s.templateId } : {}), files: s.files, assets: s.assets }) }, "\u51BB\u7ED3\u4E3A\u65B0\u6587\u7A3F\u4FEE\u8BA2")); }
}
class PublicationPreview extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { page: 1, imageURL: '', error: '', loading: false };
        this.epoch = 0;
        this.mounted = true;
        this.url = '';
    }
    componentDidMount() { if (this.props.ready)
        void this.load(1); }
    componentWillUnmount() { this.mounted = false; this.epoch++; this.controller?.abort(); this.revoke(); }
    revoke() { if (this.url) {
        URL.revokeObjectURL(this.url);
        this.url = '';
    } }
    async load(page) { const preview = this.props.result.previews.find(p => p.pageNumber === page); if (!preview)
        return; const epoch = ++this.epoch; this.controller?.abort(); const controller = new AbortController(); this.controller = controller; this.revoke(); this.setState({ page, imageURL: '', loading: true, error: '' }); try {
        const image = await verifiedPageImage(await artifactBlob(preview.artifactId, controller.signal), preview.digest);
        if (!this.mounted || epoch !== this.epoch)
            return;
        this.url = URL.createObjectURL(image);
        this.setState({ imageURL: this.url });
    }
    catch (error) {
        if (this.mounted && epoch === this.epoch)
            this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        if (this.mounted && epoch === this.epoch)
            this.setState({ loading: false });
    } }
    render() { const r = this.props.result, s = this.state; return React.createElement("div", { className: "inspector-section" },
        React.createElement("h3", null, "\u56FA\u5B9A\u6784\u5EFA\u7ED3\u679C"),
        React.createElement("p", null,
            r.status,
            " \u00B7 \u6536\u655B ",
            r.converged ? '是' : '否',
            " \u00B7 \u7F16\u8BD1 ",
            r.passes,
            " \u8F6E \u00B7 ",
            r.engineVersion),
        React.createElement("code", { className: "digest code-wrap", style: { display: 'block' } },
            "Manifest ",
            r.manifestDigest),
        React.createElement("div", { className: "actions wrap" },
            React.createElement("button", { className: "secondary", onClick: () => this.props.perform(() => downloadArtifact(r.manifestArtifactId, 'build-manifest.json')) }, "\u4E0B\u8F7D\u56FA\u5B9A\u6784\u5EFA\u6E05\u5355"),
            this.props.ready && r.status === 'succeeded' && r.converged && !r.hadErrors && r.pdf ? React.createElement("button", { className: "primary", onClick: () => this.props.perform(() => downloadArtifact(r.pdf.artifactId, 'manuscript.pdf')) }, "\u4E0B\u8F7D\u56FA\u5B9A PDF") : null,
            r.logs.map((log, i) => React.createElement("button", { key: log.artifactId, className: "text-button", onClick: () => this.props.perform(() => downloadArtifact(log.artifactId, `build-${i + 1}.log`)) },
                "\u4E0B\u8F7D\u7F16\u8BD1\u65E5\u5FD7 ",
                i + 1))),
        this.props.ready && r.status === 'succeeded' && r.converged && !r.hadErrors && r.previews.length ? React.createElement("div", null,
            React.createElement("label", null,
                "\u6587\u7A3F\u7269\u7406\u9875",
                React.createElement("select", { "aria-label": "\u6587\u7A3F\u7269\u7406\u9875", value: s.page, onChange: (e) => void this.load(Number(e.target.value)) }, r.previews.map(p => React.createElement("option", { key: p.pageNumber, value: p.pageNumber },
                    "\u7B2C ",
                    p.pageNumber,
                    " \u9875")))),
            s.imageURL ? React.createElement("img", { src: s.imageURL, alt: `固定文稿第 ${s.page} 页`, style: { maxWidth: '100%', height: 'auto' }, onError: () => this.setState({ error: '浏览器无法解码固定 PNG 页图；可下载 PDF 核对。' }) }) : React.createElement("p", { role: "status" }, s.loading ? '正在核对 PNG 签名和摘要…' : '页图不可用')) : null,
        s.error ? React.createElement("p", { role: "alert", className: "error-text" }, s.error) : null); }
}
