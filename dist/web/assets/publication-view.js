import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactBlob, downloadArtifact } from "./api.js";
import { verifiedPageImage } from "./literature-view.js";
import { short, label } from "./models.js";
import { Badge } from "./ui.js";
import { PublicationReviewPanel } from "./publication-review-view.js";
function publicationPath(path) {
  return !!path && path.length <= 240 && path.split("/").every((part) => /^[A-Za-z0-9_][A-Za-z0-9_. -]*$/.test(part) && !/[. ]$/.test(part) && !/^AGENTS(?:\.|$)/i.test(part) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part));
}
function publicationSourcePath(path) {
  return publicationPath(path) && /\.(tex|bib|sty|cls|bst|txt|csv)$/i.test(path);
}
function publicationPathAvailable(path, files) {
  const target = path.toLowerCase();
  return publicationPath(path) && !files.some((f) => {
    const existing = f.path.toLowerCase();
    return existing === target || existing.startsWith(target + "/") || target.startsWith(existing + "/");
  });
}
function publicationLineRange(content, line) {
  if (!Number.isSafeInteger(line) || line < 1) return null;
  const lines = content.split("\n");
  if (line > lines.length) return null;
  const start = lines.slice(0, line - 1).reduce((sum, value) => sum + value.length + 1, 0);
  return { start, end: start + lines[line - 1].length };
}
function publicationSourceSignature(data, revision, job) {
  const artifactIds = new Set(revision.files.map((f) => f.artifactId)), sourceIds = new Set(revision.files.map((f) => f.provenance.id)), approvalIds = /* @__PURE__ */ new Set([job.approvalId, ...revision.files.map((f) => f.provenance.approvalId)]);
  const runs = (data.runs ?? []).filter((r) => sourceIds.has(r.id)), sandbox = (data.sandboxJobs ?? []).filter((j) => sourceIds.has(j.id));
  const versions = (rows) => (rows ?? []).map((row) => {
    const r = row;
    return [r.id, r.version ?? null, r.state ?? null, r.status ?? null, r.sourceDigest ?? null];
  }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return JSON.stringify([data.project.id, data.project.version, data.project.archived, versions(data.approvals.filter((a) => approvalIds.has(a.id))), versions(data.artifacts.filter((a) => artifactIds.has(a.id))), versions(runs), versions((data.intents ?? []).filter((i) => runs.some((r) => r.intentId === i.id))), versions(sandbox), versions((data.developmentTasks ?? []).filter((t) => sandbox.some((j) => j.developmentTaskId === t.id))), versions(data.experiments), versions(data.sessions), versions(data.teams), versions(data.tasks)]);
}
class PublicationView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { templates: [], status: null, revisions: [], nextRevision: null, revision: null, jobs: [], nextJob: null, job: null, result: null, sourcePath: "", source: "", sourceComplete: false, sourceLine: null, busy: false, loading: false, error: "", context: "desktop-linux", image: "", seedVersion: 0, pollStopped: false, sourceChecking: false, sourceCheckError: "", selectedReviewId: "" };
    this.workspaceElement = null;
    this.mounted = true;
    this.selectionEpoch = 0;
    this.sourceEpoch = 0;
    this.jobEpoch = 0;
    this.refreshEpoch = 0;
    this.polls = 0;
    this.sourceElement = null;
  }
  call(name, input = {}) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  storageKey() {
    return `pi-publication:${this.props.data.project.id}`;
  }
  remember(revisionId, jobId = "") {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify({ revisionId, jobId }));
    } catch {
    }
  }
  componentDidMount() {
    void this.initialize();
  }
  componentDidUpdate(prev) {
    const { revision, job } = this.state;
    if (revision && job && publicationSourceSignature(prev.data, revision, job) !== publicationSourceSignature(this.props.data, revision, job)) void this.refreshJob(job.id);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.selectionEpoch++;
    this.sourceEpoch++;
    this.jobEpoch++;
    this.refreshEpoch++;
    clearTimeout(this.timer);
  }
  async initialize() {
    const selection = this.selectionEpoch;
    this.setState({ loading: true, error: "" });
    try {
      const [templates, status, list] = await Promise.all([this.call("publication_templates"), this.call("publication_status"), this.call("manuscript_list", { cursor: 0, limit: 30 })]);
      if (!this.mounted) return;
      this.setState({ templates, status, revisions: list.items, nextRevision: list.nextCursor });
      let saved;
      try {
        saved = JSON.parse(localStorage.getItem(this.storageKey()) ?? "null");
      } catch {
      }
      if (selection === this.selectionEpoch && typeof saved?.revisionId === "string") await this.openRevision(saved.revisionId, typeof saved.jobId === "string" ? saved.jobId : void 0);
    } catch (error) {
      if (this.mounted) this.setState({ error: String(error) });
    } finally {
      if (this.mounted) this.setState({ loading: false });
    }
  }
  async moreRevisions() {
    if (this.state.nextRevision === null) return;
    const list = await this.call("manuscript_list", { cursor: this.state.nextRevision, limit: 30 });
    if (this.mounted) this.setState({ revisions: [...this.state.revisions, ...list.items.filter((r) => !this.state.revisions.some((old) => old.id === r.id))], nextRevision: list.nextCursor });
  }
  async run(action) {
    if (this.state.busy) return;
    this.setState({ busy: true, error: "" });
    try {
      await this.props.perform(action);
    } catch (error) {
      if (this.mounted) this.setState({ error: String(error) });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  async freeze(draft) {
    await this.run(async () => {
      const { assets, files, ...settings } = draft, revision = await this.call("manuscript_create", { ...settings, files: [...files.map((f) => ({ path: f.path, contentBase64: publicationBase64(f.content) })), ...assets] });
      if (!this.mounted) return;
      this.setState({ revisions: [revision, ...this.state.revisions.filter((r) => r.id !== revision.id)] });
      await this.openRevision(revision.id);
    });
  }
  async openRevision(id, jobId) {
    const epoch = ++this.selectionEpoch;
    this.sourceEpoch++;
    this.jobEpoch++;
    clearTimeout(this.timer);
    this.remember(id, jobId);
    this.setState({ selectedReviewId: "", revision: null, job: null, result: null, jobs: [], source: "", sourcePath: "", sourceComplete: false, sourceLine: null, error: "", loading: true, pollStopped: false, sourceChecking: false, sourceCheckError: "" });
    try {
      const [revision, list] = await Promise.all([this.call("manuscript_inspect", { revisionId: id }), this.call("publication_build_list", { revisionId: id, cursor: 0, limit: 30 })]);
      if (revision.id !== id) throw Error("\u8FD4\u56DE\u7684\u6587\u7A3F\u4E0D\u662F\u6240\u9009\u4FEE\u8BA2\u3002");
      if (!this.mounted || epoch !== this.selectionEpoch) return;
      this.setState({ revision, jobs: list.items, nextJob: list.nextCursor });
      await this.readSource(revision.mainFile);
      if (jobId && this.mounted && epoch === this.selectionEpoch) await this.openJob(jobId);
    } catch (error) {
      if (this.mounted && epoch === this.selectionEpoch) this.setState({ error: String(error) });
    } finally {
      if (this.mounted && epoch === this.selectionEpoch) this.setState({ loading: false });
    }
  }
  async sourceContent(revision, path, epoch) {
    const file = revision.files.find((f) => f.path === path);
    if (!file || !publicationSourcePath(path) || !file.mediaType.startsWith("text/")) throw Error("\u6B64\u8DEF\u5F84\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6587\u7A3F\u7684\u6587\u672C\u6587\u4EF6\u3002");
    let content = "", cursor = 0;
    for (let page = 0; page < 34; page++) {
      const part = await this.call("manuscript_source_read", { revisionId: revision.id, path, cursor, limit: 64e3 });
      if (!this.mounted || epoch !== this.selectionEpoch) throw Error("\u6587\u7A3F\u9009\u62E9\u5DF2\u6539\u53D8\u3002");
      if (part.path !== path || part.digest !== file.digest || part.cursor !== cursor || part.end - cursor !== part.content.length || !part.complete && part.end <= cursor) throw Error("\u6E90\u6587\u4EF6\u7A97\u53E3\u6216\u6458\u8981\u4E0D\u5339\u914D\u3002");
      content += part.content;
      cursor = part.end;
      if (part.complete) return content;
    }
    throw Error("\u6E90\u6587\u4EF6\u8D85\u8FC7\u6709\u754C\u8BFB\u53D6\u4E0A\u9650\uFF0C\u672A\u628A\u90E8\u5206\u5185\u5BB9\u7528\u4F5C\u5B8C\u6574\u8349\u7A3F\u3002");
  }
  async readSource(path, line = null) {
    const revision = this.state.revision;
    if (!revision) return;
    const epoch = ++this.sourceEpoch, selection = this.selectionEpoch;
    this.setState({ sourcePath: path, source: "", sourceComplete: false, sourceLine: line, error: "" });
    try {
      const source = await this.sourceContent(revision, path, selection);
      if (!this.mounted || epoch !== this.sourceEpoch || selection !== this.selectionEpoch) return;
      this.setState({ source, sourceComplete: true }, () => {
        const range = publicationLineRange(source, line);
        if (range && this.sourceElement) {
          this.sourceElement.focus();
          this.sourceElement.setSelectionRange(range.start, range.end);
          this.sourceElement.scrollTop = Math.max(0, (line - 3) * 20);
        }
      });
    } catch (error) {
      if (this.mounted && epoch === this.sourceEpoch && selection === this.selectionEpoch) this.setState({ error: String(error) });
    }
  }
  async editRevision() {
    const revision = this.state.revision;
    if (!revision) return;
    const selection = this.selectionEpoch;
    await this.run(async () => {
      const files = [], assets = [];
      for (const f of revision.files) {
        if (f.mediaType.startsWith("text/") && publicationSourcePath(f.path)) files.push({ path: f.path, content: await this.sourceContent(revision, f.path, selection) });
        else assets.push({ path: f.path, artifactId: f.artifactId });
      }
      if (this.mounted && selection === this.selectionEpoch) this.setState({ seed: { title: revision.title, engine: revision.engine, mainFile: revision.mainFile, bibliography: revision.bibliography, files, assets }, seedVersion: this.state.seedVersion + 1 });
    });
  }
  async openJob(id) {
    const revision = this.state.revision;
    if (!revision) return;
    const epoch = ++this.jobEpoch, selection = this.selectionEpoch;
    clearTimeout(this.timer);
    this.polls = 0;
    this.remember(revision.id, id);
    this.setState({ selectedReviewId: "", job: null, result: null, error: "", pollStopped: false });
    await this.refreshJob(id, epoch, selection);
  }
  async refreshJob(id, epoch = this.jobEpoch, selection = this.selectionEpoch) {
    const request = ++this.refreshEpoch;
    clearTimeout(this.timer);
    this.setState({ sourceChecking: true, sourceCheckError: "" });
    try {
      const job = await this.call("publication_inspect", { jobId: id });
      if (!this.mounted || epoch !== this.jobEpoch || selection !== this.selectionEpoch || request !== this.refreshEpoch) return;
      const revision = this.state.revision;
      if (job.id !== id || !revision || job.revisionId !== revision.id || job.sourceDigest !== revision.sourceDigest) throw Error("\u6784\u5EFA\u4EFB\u52A1\u4E0D\u5C5E\u4E8E\u5F53\u524D\u56FA\u5B9A\u6587\u7A3F\u3002");
      this.setState({ job, jobs: [job, ...this.state.jobs.filter((j) => j.id !== id)] });
      if (job.resultId) {
        const result = await this.call("publication_result", { resultId: job.resultId });
        if (result.id !== job.resultId || result.jobId !== id || result.revisionId !== revision.id || result.sourceDigest !== revision.sourceDigest || result.manifestDigest !== job.manifestDigest) throw Error("\u6784\u5EFA\u7ED3\u679C\u7ED1\u5B9A\u4E0E\u6240\u9009\u4EFB\u52A1\u4E0D\u4E00\u81F4\u3002");
        if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch) this.setState({ result });
      }
      if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch && ["queued", "starting", "running", "unknown"].includes(job.state)) {
        if (++this.polls <= 40) this.timer = setTimeout(() => void this.refreshJob(id, epoch, selection), 3e3);
        else this.setState({ pollStopped: true });
      }
    } catch (error) {
      if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch) this.setState({ error: String(error), sourceCheckError: String(error), pollStopped: true });
    } finally {
      if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch && request === this.refreshEpoch) this.setState({ sourceChecking: false });
    }
  }
  async moreJobs() {
    const revision = this.state.revision, selection = this.selectionEpoch;
    if (!revision || this.state.nextJob === null) return;
    const list = await this.call("publication_build_list", { revisionId: revision.id, cursor: this.state.nextJob, limit: 30 });
    if (this.mounted && selection === this.selectionEpoch) this.setState({ jobs: [...this.state.jobs, ...list.items.filter((j) => !this.state.jobs.some((old) => old.id === j.id))], nextJob: list.nextCursor });
  }
  async openFixed(revisionId, jobId, reviewId) {
    const opening = this.openRevision(revisionId, jobId), selection = this.selectionEpoch;
    await opening;
    if (this.mounted && selection === this.selectionEpoch && this.state.revision?.id === revisionId && this.state.job?.id === jobId) {
      this.setState({ selectedReviewId: reviewId ?? "" });
      this.workspaceElement?.focus();
    }
  }
  selectableResult() {
    const s = this.state, r = s.result, j = s.job;
    return !s.loading && !s.sourceChecking && !s.sourceCheckError && j?.state === "succeeded" && j.integrity === "complete" && r?.status === "succeeded" && r.converged && !r.hadErrors && !!r.pdf && r.sourceValidity === "current" && r.id === j.resultId && r.jobId === j.id && r.revisionId === s.revision?.id ? r : null;
  }
  selectResult() {
    const result = this.selectableResult();
    if (result) this.props.onSelectResult?.(result, this.state.revision.title);
  }
  render() {
    const s = this.state, r = s.revision, j = s.job, approval = this.props.data.approvals.find((a) => a.id === j?.approvalId);
    return /* @__PURE__ */ jsxs("div", { "aria-label": "\u6587\u7A3F\u6784\u5EFA\u5DE5\u4F5C\u533A", children: [
      /* @__PURE__ */ jsx(ManuscriptEditor, { seed: s.seed, templates: s.templates, data: this.props.data, busy: s.busy, onFreeze: (draft) => void this.freeze(draft) }, s.seedVersion),
      /* @__PURE__ */ jsxs("section", { className: "surface report-builder", tabIndex: -1, ref: (node) => {
        this.workspaceElement = node;
      }, "aria-label": "\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\u56DE\u67E5", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u9694\u79BB\u6587\u7A3F\u6784\u5EFA" }),
        s.loading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FA\u5B9A\u6587\u7A3F\u2026" }) : null,
        s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u7F16\u8BD1\u73AF\u5883\u914D\u7F6E" }),
          /* @__PURE__ */ jsx("p", { children: s.status?.configured ? "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u5DF2\u914D\u7F6E\uFF0C\u6BCF\u4E2A\u6784\u5EFA\u53E6\u884C\u6279\u51C6\u3002" : "\u7F16\u8BD1\u73AF\u5883\u672A\u914D\u7F6E\uFF1B\u9700\u5728\u5BBF\u4E3B\u51C6\u5907\u56FA\u5B9A\u955C\u50CF\u3002\u9875\u9762\u4E0D\u4F1A\u4E0B\u8F7D\u6216\u5B89\u88C5\u4F9D\u8D56\u3002" }),
          s.status?.configuration ? /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: s.status.configuration.imageDigest }) : null,
          /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            void this.run(async () => {
              const status = await this.call("publication_configure", { expectedVersion: s.status.version, dockerContext: s.context, imageDigest: s.image.trim() });
              if (this.mounted) this.setState({ status });
            });
          }, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u7F16\u8BD1 Docker context",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u7F16\u8BD1 Docker context", required: true, value: s.context, onChange: (e) => this.setState({ context: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u6458\u8981",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u56FA\u5B9A\u7F16\u8BD1\u955C\u50CF\u6458\u8981", required: true, pattern: "(?:.+@)?sha256:[a-f0-9]{64}", value: s.image, onChange: (e) => this.setState({ image: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !s.status || s.busy, children: "\u663E\u5F0F\u4FDD\u5B58\u7F16\u8BD1\u914D\u7F6E" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u5386\u53F2\u56FA\u5B9A\u6587\u7A3F",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u5386\u53F2\u56FA\u5B9A\u6587\u7A3F", value: r?.id ?? "", onChange: (e) => {
            if (e.target.value) void this.openRevision(e.target.value);
          }, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u56FA\u5B9A\u4FEE\u8BA2" }),
            (r && !s.revisions.some((row) => row.id === r.id) ? [r, ...s.revisions] : s.revisions).map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
              row.title,
              " \xB7 ",
              short(row.id),
              " \xB7 ",
              row.engine
            ] }, row.id))
          ] })
        ] }),
        s.nextRevision !== null ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.run(() => this.moreRevisions()), children: "\u8BFB\u53D6\u66F4\u591A\u5386\u53F2\u4FEE\u8BA2" }) : null,
        r ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
            "\u6587\u7A3F\u6E90\u7801 SHA-256 ",
            r.sourceDigest
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            r.engine,
            " \xB7 \u4E3B\u6587\u4EF6 ",
            r.mainFile,
            " \xB7 \u53C2\u8003\u6587\u732E ",
            r.bibliography
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => this.props.perform(() => downloadArtifact(r.manifestArtifactId, "manuscript-manifest.json")), children: "\u4E0B\u8F7D\u56FA\u5B9A\u6587\u7A3F\u6E05\u5355" }),
          /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => void this.editRevision(), children: "\u590D\u5236\u6587\u672C\u5230\u53EF\u7F16\u8F91\u65B0\u8349\u7A3F\uFF08\u91CD\u65B0\u5F52\u6863\u6587\u672C\uFF09" }),
            /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy || !s.status?.configured, onClick: () => void this.run(async () => {
              const selection = this.selectionEpoch, job = await this.call("publication_prepare", { revisionId: r.id });
              if (this.mounted && selection === this.selectionEpoch) await this.openJob(job.id);
            }), children: "\u51C6\u5907\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u590D\u5236\u6587\u672C\u4F1A\u8F6C\u6362\u4E3A\u53EF\u7F16\u8F91\u5185\u5BB9\uFF0C\u518D\u51BB\u7ED3\u65F6\u91CD\u65B0\u5F52\u6863\uFF1B\u539F\u6587\u672C\u4EA7\u7269\u7ED1\u5B9A\u4E0D\u6CBF\u7528\uFF0C\u65E7\u4FEE\u8BA2\u4E0E\u539F\u4EA7\u7269\u4FDD\u7559\u3002" }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6587\u4EF6\u4E0E\u5DF2\u77E5\u6765\u6E90" }),
            r.files.map((f) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsx("strong", { children: f.path }),
              /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
                "\u4EA7\u7269 ID ",
                f.artifactId
              ] }),
              /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
                "SHA-256 ",
                f.digest
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                f.provenance.kind,
                " \xB7 ",
                f.provenance.id ?? "\u6765\u6E90\u672A\u77E5",
                " \xB7 ",
                f.provenance.sourceDigest ?? "\u672A\u63D0\u4F9B\u6E90\u7801\u6765\u6E90"
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => this.props.perform(() => downloadArtifact(f.artifactId, f.path.split("/").pop())), children: [
                "\u4E0B\u8F7D\u6E90\u6587\u4EF6 ",
                f.path
              ] })
            ] }, f.path))
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u56FA\u5B9A\u6E90\u6587\u4EF6",
            /* @__PURE__ */ jsx("select", { "aria-label": "\u56FA\u5B9A\u6E90\u6587\u4EF6", value: s.sourcePath, onChange: (e) => void this.readSource(e.target.value), children: r.files.filter((f) => f.mediaType.startsWith("text/") && publicationSourcePath(f.path)).map((f) => /* @__PURE__ */ jsx("option", { value: f.path, children: f.path }, f.path)) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u56FA\u5B9A\u6E90\u7801\uFF08\u53EA\u8BFB\uFF09",
            /* @__PURE__ */ jsx("textarea", { "aria-label": "\u56FA\u5B9A\u6E90\u7801\u5B9A\u4F4D", ref: (node) => {
              this.sourceElement = node;
            }, readOnly: true, rows: 14, spellCheck: false, value: s.source })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            s.sourceComplete ? "\u56FA\u5B9A\u6E90\u7801\u5DF2\u5B8C\u6574\u8BFB\u53D6" : "\u56FA\u5B9A\u6E90\u7801\u5C1A\u672A\u5B8C\u6574\u8BFB\u53D6",
            s.sourceLine !== null ? ` \xB7 \u8BCA\u65AD\u884C ${s.sourceLine}${publicationLineRange(s.source, s.sourceLine) ? "\uFF08\u5DF2\u9009\u4E2D\uFF09" : "\uFF08\u4E0D\u5728\u5F53\u524D\u6587\u4EF6\u8303\u56F4\u5185\uFF09"}` : ""
          ] }),
          /* @__PURE__ */ jsx("h3", { children: "\u6301\u4E45\u6784\u5EFA\u4EFB\u52A1" }),
          s.jobs.length ? /* @__PURE__ */ jsxs("label", { children: [
            "\u5386\u53F2\u6784\u5EFA",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u5386\u53F2\u6587\u7A3F\u6784\u5EFA", value: j?.id ?? "", onChange: (e) => {
              if (e.target.value) void this.openJob(e.target.value);
            }, children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6784\u5EFA\u4EFB\u52A1" }),
              s.jobs.map((job) => /* @__PURE__ */ jsxs("option", { value: job.id, children: [
                short(job.id),
                " \xB7 ",
                label(job.state)
              ] }, job.id))
            ] })
          ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6B64\u4FEE\u8BA2\u5C1A\u65E0\u6784\u5EFA\u4EFB\u52A1\u3002" }),
          s.nextJob !== null ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.run(() => this.moreJobs()), children: "\u8BFB\u53D6\u66F4\u591A\u6784\u5EFA" }) : null,
          j ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              "\u6784\u5EFA ",
              short(j.id)
            ] }),
            /* @__PURE__ */ jsx(Badge, { value: j.state }),
            /* @__PURE__ */ jsx(Badge, { value: j.integrity }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u5F15\u64CE ",
              j.engine,
              " \xB7 \u5165\u53E3 ",
              j.mainFile,
              " \xB7 \u53C2\u8003\u6587\u732E ",
              j.bibliography
            ] }),
            /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
              "\u56FA\u5B9A\u6765\u6E90 ",
              j.sourceDigest
            ] }),
            /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
              "\u6784\u5EFA\u6E05\u5355 ",
              j.manifestDigest
            ] }),
            /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
              "\u955C\u50CF ",
              j.imageDigest
            ] }),
            /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
              "\u7F16\u8BD1\u914D\u7F6E ",
              j.profileDigest
            ] }),
            /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6784\u5EFA\u811A\u672C\u4E0E\u4F9D\u8D56" }),
              /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
                "\u811A\u672C ",
                j.scriptDigest
              ] }),
              /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
                "\u4F9D\u8D56\u9501 ",
                j.lockDigest
              ] }),
              /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
                "Dockerfile ",
                j.dockerfileDigest
              ] })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              j.dockerContext,
              " \xB7 ",
              Object.entries(j.resources).map(([key, value]) => `${key}=${value}`).join(" \xB7 ")
            ] }),
            j.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: j.error }) : null,
            /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
              j.state === "prepared" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy, onClick: () => void this.run(async () => {
                await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true });
              }), children: "\u6279\u51C6\u6B64\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA" }) : null,
              j.state === "prepared" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy, onClick: () => void this.run(async () => {
                await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false });
              }), children: "\u62D2\u7EDD\u6587\u7A3F\u6784\u5EFA" }) : null,
              j.state === "prepared" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.busy, onClick: () => void this.run(async () => {
                const epoch = this.jobEpoch, selection = this.selectionEpoch;
                await this.call("publication_submit", { jobId: j.id });
                if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch) await this.openJob(j.id);
              }), children: "\u63D0\u4EA4\u5DF2\u6279\u51C6\u6587\u7A3F\u6784\u5EFA" }) : null,
              ["prepared", "queued", "starting", "running", "unknown"].includes(j.state) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", disabled: s.busy, onClick: () => void this.run(async () => {
                const epoch = this.jobEpoch, selection = this.selectionEpoch;
                await this.call("publication_cancel", { jobId: j.id });
                if (this.mounted && epoch === this.jobEpoch && selection === this.selectionEpoch) await this.openJob(j.id);
              }), children: "\u8BF7\u6C42\u53D6\u6D88\u6587\u7A3F\u6784\u5EFA" }) : null,
              /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => void this.openJob(j.id), children: "\u5237\u65B0\u6B64\u6784\u5EFA\u72B6\u6001" })
            ] }),
            s.pollStopped ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u81EA\u52A8\u8F6E\u8BE2\u5DF2\u505C\u6B62\uFF1B\u540E\u53F0\u4EFB\u52A1\u4E0D\u53D7\u5F71\u54CD\uFF0C\u53EF\u624B\u52A8\u5237\u65B0\u6B64\u6784\u5EFA\u3002" }) : null,
            s.result ? /* @__PURE__ */ jsxs("div", { children: [
              s.sourceChecking ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u91CD\u65B0\u6838\u9A8C\u5F53\u524D\u6765\u6E90\u72B6\u6001\u2026" }) : s.sourceCheckError ? /* @__PURE__ */ jsxs("p", { role: "alert", className: "inline-warning", children: [
                "\u5F53\u524D\u6765\u6E90\u6838\u9A8C\u5931\u8D25\uFF1B\u4FDD\u7559\u5386\u53F2\u6784\u5EFA\u4F9B\u56DE\u67E5\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002",
                s.sourceCheckError
              ] }) : s.result.sourceValidity === "stale" ? /* @__PURE__ */ jsxs("p", { role: "alert", className: "inline-warning", children: [
                "\u5386\u53F2\u6784\u5EFA\uFF0C\u5F53\u524D\u6765\u6E90\u5931\u6548\u3002",
                s.result.sourceError ?? "PUBLICATION_SOURCE_STALE",
                "\uFF1B\u5386\u53F2 PDF \u4E0E\u56FA\u5B9A\u6E90\u6587\u4EF6\u4ECD\u53EF\u56DE\u67E5\u3002"
              ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: s.result.sourceValidity === "current" ? "\u5F53\u524D\u6765\u6E90\u6709\u6548\uFF08\u6700\u8FD1\u4E00\u6B21\u6838\u9A8C\uFF09" : "\u5F53\u524D\u6765\u6E90\u72B6\u6001\u672A\u77E5\uFF0C\u8BF7\u5237\u65B0\u6B64\u6784\u5EFA\u3002" }),
              this.props.onSelectResult ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !this.selectableResult() || this.props.selectedResultIds?.includes(s.result.id) || (this.props.selectedResultIds?.length ?? 0) >= 20, onClick: () => this.selectResult(), children: this.props.selectedResultIds?.includes(s.result.id) ? "\u5DF2\u7EB3\u5165\u5F85\u751F\u6210\u62A5\u544A" : "\u7EB3\u5165\u6B64\u56FA\u5B9A\u6784\u5EFA" }) : null,
              /* @__PURE__ */ jsx(PublicationReviewPanel, { data: this.props.data, result: s.result, ready: !!this.selectableResult(), perform: this.props.perform, onSession: this.props.onSession, selectedReviewId: s.selectedReviewId }, s.result.id),
              /* @__PURE__ */ jsx("h3", { children: "\u56FA\u5B9A\u6784\u5EFA\u8BCA\u65AD" }),
              s.result.diagnostics.length ? /* @__PURE__ */ jsx("ul", { children: s.result.diagnostics.map((d, i) => /* @__PURE__ */ jsxs("li", { children: [
                d.severity,
                " \xB7 ",
                d.code,
                " \xB7 ",
                d.message,
                " ",
                /* @__PURE__ */ jsxs("span", { children: [
                  d.file ?? "\u6587\u4EF6\u672A\u77E5",
                  ":",
                  d.line ?? "\u884C\u53F7\u672A\u77E5"
                ] }),
                d.file && publicationSourcePath(d.file) && r.files.some((f) => f.path === d.file && f.mediaType.startsWith("text/")) && d.line !== null ? /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => void this.readSource(d.file, d.line), children: [
                  "\u5B9A\u4F4D ",
                  d.file,
                  ":",
                  d.line
                ] }) : null
              ] }, i)) }) : /* @__PURE__ */ jsx("p", { children: "\u672A\u8BB0\u5F55\u8BCA\u65AD\u3002" }),
              /* @__PURE__ */ jsx(PublicationPreview, { result: s.result, ready: j.state === "succeeded" && j.integrity === "complete", perform: this.props.perform }, s.result.id)
            ] }) : null
          ] }) : null
        ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u9009\u62E9\u5386\u53F2\u4FEE\u8BA2\u6216\u51BB\u7ED3\u4E00\u4EFD\u65B0\u6587\u7A3F\u3002" })
      ] })
    ] });
  }
}
function publicationBase64(content) {
  const bytes = new TextEncoder().encode(content);
  if (bytes.length > 2 * 1024 * 1024) throw Error("\u5355\u4E2A\u6587\u672C\u6587\u4EF6\u6700\u591A 2 MiB");
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
class ManuscriptEditor extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { title: "\u7814\u7A76\u6587\u7A3F", templateId: "", engine: "pdflatex", mainFile: "main.tex", bibliography: "none", files: [], assets: [], selected: "", newPath: "references.bib", assetId: "", assetPath: "main.tex", error: "", checking: false, preview: "", previewComplete: false };
    this.epoch = 0;
    this.mounted = true;
  }
  componentDidMount() {
    if (this.props.seed) this.setState({ ...this.props.seed, templateId: this.props.seed.templateId ?? "", selected: this.props.seed.mainFile });
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  changeAsset(patch) {
    this.epoch++;
    this.setState((previous) => ({ ...previous, ...patch, checking: false, preview: "", previewComplete: false, error: "" }));
  }
  template(id) {
    this.changeAsset({});
    const t = this.props.templates.find((t2) => t2.id === id);
    if (!t) return;
    if (t.files.some((f) => !publicationPathAvailable(f.path, this.state.assets))) {
      this.setState({ error: "\u6A21\u677F\u4E0E\u56FA\u5B9A\u6587\u4EF6\u8DEF\u5F84\u51B2\u7A81\uFF1B\u8BF7\u5148\u79FB\u9664\u51B2\u7A81\u5F15\u7528\uFF0C\u73B0\u6709\u8349\u7A3F\u672A\u6539\u53D8\u3002" });
      return;
    }
    this.setState({ templateId: t.id, engine: t.engine, mainFile: t.mainFile, bibliography: t.bibliography, files: t.files.map((f) => ({ ...f })), selected: t.mainFile, error: "" });
  }
  addFile() {
    const path = this.state.newPath.trim();
    if (!publicationSourcePath(path) || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets])) {
      this.setState({ error: "\u8BF7\u8F93\u5165\u552F\u4E00\u7684\u76F8\u5BF9\u6587\u672C\u6587\u4EF6\u8DEF\u5F84\uFF0C\u4F8B\u5982 sections/method.tex\u3002" });
      return;
    }
    this.setState({ files: [...this.state.files, { path, content: "" }], selected: path, error: "" });
  }
  readArtifact(artifactId) {
    return api("/operations/artifact_read", { projectId: this.props.data.project.id, input: { artifactId, cursor: 0 } });
  }
  async addAsset() {
    if (this.state.checking || this.props.busy) return;
    const { assetId, assetPath } = this.state, path = assetPath.trim(), projectId = this.props.data.project.id, artifact = this.props.data.artifacts.find((a) => a.id === assetId && a.projectId === projectId);
    if (!artifact || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets]) || !publicationSourcePath(path) && !/\.(png|jpe?g|pdf)$/i.test(path)) {
      this.setState({ error: "\u8BF7\u9009\u62E9\u5F53\u524D\u9879\u76EE\u7684\u4EA7\u7269\uFF0C\u5E76\u6307\u5B9A\u552F\u4E00\u4E14\u53D7\u652F\u6301\u7684\u76F8\u5BF9\u76EE\u6807\u8DEF\u5F84\u3002" });
      return;
    }
    const epoch = ++this.epoch;
    this.setState({ checking: true, error: "", preview: "", previewComplete: false });
    try {
      if (!Number.isSafeInteger(artifact.size) || artifact.size < 0 || artifact.size > (publicationSourcePath(path) ? 2 : 8) * 1024 * 1024) throw Error("\u4EA7\u7269\u8D85\u8FC7\u5355\u6587\u4EF6\u4E0A\u9650\uFF1A\u6587\u672C 2 MiB\uFF0C\u56FE\u5F62 8 MiB\u3002");
      let preview = "", previewComplete = false;
      if (publicationSourcePath(path)) {
        const part = await this.readArtifact(assetId);
        if (part.artifactId !== assetId || part.digest !== artifact.digest || typeof part.content !== "string" || part.content.length > 16e3 || part.cursor !== part.content.length || typeof part.complete !== "boolean" || !part.complete && part.cursor !== 16e3 || part.content.includes("\0")) throw Error("\u56FA\u5B9A\u6587\u672C\u9884\u89C8\u7684\u4EA7\u7269\u3001\u6458\u8981\u6216\u7A97\u53E3\u4E0D\u5339\u914D\u3002");
        preview = part.content;
        previewComplete = part.complete;
      }
      if (!this.mounted || epoch !== this.epoch || this.props.data.project.id !== projectId) return;
      const current = this.props.data.artifacts.find((a) => a.id === assetId && a.projectId === projectId);
      if (!current || current.digest !== artifact.digest || current.size !== artifact.size || !publicationPathAvailable(path, [...this.state.files, ...this.state.assets])) throw Error("\u4EA7\u7269\u6216\u76EE\u6807\u8DEF\u5F84\u5DF2\u6539\u53D8\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002");
      this.setState({ assets: [...this.state.assets, { path, artifactId: assetId }], preview, previewComplete, error: "" });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ checking: false });
    }
  }
  render() {
    const s = this.state, file = s.files.find((f) => f.path === s.selected), artifact = this.props.data.artifacts.find((a) => a.id === s.assetId), allFiles = [...s.files, ...s.assets];
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u56FA\u5B9A\u6587\u7A3F\u4FEE\u8BA2" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9009\u62E9\u5DF2\u5F52\u6863 TeX \u56FA\u5B9A\u5F15\u7528\uFF0C\u6216\u4ECE\u53D7\u7BA1\u6A21\u677F\u7F16\u8F91\uFF1B\u51BB\u7ED3\u65F6\u521B\u5EFA\u65B0\u4FEE\u8BA2\uFF0C\u65E7\u6E90\u6587\u4EF6\u4E0E PDF \u4FDD\u7559\u3002\u7F16\u8BD1\u901A\u8FC7\u4E0D\u4EE3\u8868\u79D1\u5B66\u5BA1\u67E5\u901A\u8FC7\u3002" }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u57FA\u7840\u6A21\u677F",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u6587\u7A3F\u57FA\u7840\u6A21\u677F", value: s.templateId, onChange: (e) => this.template(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6A21\u677F" }),
          this.props.templates.map((t) => /* @__PURE__ */ jsx("option", { value: t.id, children: t.title }, t.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u6587\u7A3F\u6807\u9898",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u6587\u7A3F\u6807\u9898", maxLength: 200, value: s.title, onChange: (e) => this.setState({ title: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u7F16\u8BD1\u5F15\u64CE",
          /* @__PURE__ */ jsx("select", { "aria-label": "\u6587\u7A3F\u7F16\u8BD1\u5F15\u64CE", value: s.engine, onChange: (e) => this.setState({ engine: e.target.value }), children: ["pdflatex", "xelatex", "lualatex"].map((engine) => /* @__PURE__ */ jsx("option", { value: engine, children: engine }, engine)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u53C2\u8003\u6587\u732E\u7B56\u7565",
          /* @__PURE__ */ jsx("select", { "aria-label": "\u53C2\u8003\u6587\u732E\u7B56\u7565", value: s.bibliography, onChange: (e) => this.setState({ bibliography: e.target.value }), children: ["none", "auto", "bibtex", "biber"].map((mode) => /* @__PURE__ */ jsx("option", { value: mode, children: mode }, mode)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u4E3B TeX \u6587\u4EF6",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u4E3B TeX \u6587\u4EF6", value: s.mainFile, onChange: (e) => this.setState({ mainFile: e.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4E3B\u6587\u4EF6" }),
            allFiles.filter((f) => f.path.endsWith(".tex")).map((f) => /* @__PURE__ */ jsxs("option", { value: f.path, children: [
              f.path,
              "artifactId" in f ? " \xB7 \u56FA\u5B9A\u4EA7\u7269" : ""
            ] }, f.path))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7F16\u8F91\u8349\u7A3F\u6587\u4EF6",
        /* @__PURE__ */ jsx("select", { "aria-label": "\u7F16\u8F91\u8349\u7A3F\u6587\u4EF6", value: s.selected, onChange: (e) => this.setState({ selected: e.target.value }), children: s.files.map((f) => /* @__PURE__ */ jsx("option", { value: f.path, children: f.path }, f.path)) })
      ] }),
      file ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { children: [
          file.path,
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u6587\u7A3F\u6E90\u6587\u4EF6\u5185\u5BB9", rows: 18, spellCheck: false, value: file.content, onChange: (e) => this.setState({ files: s.files.map((f) => f.path === file.path ? { ...f, content: e.target.value } : f) }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "text-button danger", disabled: file.path === s.mainFile, onClick: () => this.setState({ files: s.files.filter((f) => f.path !== file.path), selected: s.mainFile }), children: "\u5220\u9664\u5F53\u524D\u8349\u7A3F\u6587\u4EF6" })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5DF2\u5F52\u6863\u6E90\u7801\u4FDD\u6301\u53EA\u8BFB\u5F15\u7528\uFF1B\u9700\u8981\u7F16\u8F91\u65F6\u53EF\u9009\u6A21\u677F\u6216\u6DFB\u52A0\u65B0\u8349\u7A3F\u6587\u4EF6\u3002" }),
      /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u65B0\u589E\u6587\u672C\u6587\u4EF6\u8DEF\u5F84",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u65B0\u589E\u6587\u672C\u6587\u4EF6\u8DEF\u5F84", value: s.newPath, onChange: (e) => this.setState({ newPath: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => this.addFile(), children: "\u6DFB\u52A0\u8349\u7A3F\u6587\u4EF6" })
      ] }),
      /* @__PURE__ */ jsx("h3", { children: "\u5DF2\u5F52\u6863\u6E90\u7801\u4E0E\u8D44\u4EA7" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u56FA\u5B9A\u6E90\u6587\u4EF6\u4FDD\u6301\u539F\u4EA7\u7269\u7ED1\u5B9A\uFF0C\u4E0D\u8FDB\u5165\u7F16\u8F91\u533A\uFF1B\u52A0\u5165\u4E0E\u51BB\u7ED3\u4E0D\u4F1A\u542F\u52A8\u7F16\u8BD1\u3002" }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5F53\u524D\u9879\u76EE\u5DF2\u5F52\u6863\u4EA7\u7269",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u6587\u7A3F\u56FA\u5B9A\u8D44\u4EA7", value: s.assetId, onChange: (e) => this.changeAsset({ assetId: e.target.value }), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4EA7\u7269" }),
          this.props.data.artifacts.filter((a) => a.projectId === this.props.data.project.id).map((a) => /* @__PURE__ */ jsxs("option", { value: a.id, children: [
            a.title,
            " \xB7 ",
            short(a.id),
            " \xB7 ",
            short(a.digest)
          ] }, a.id))
        ] })
      ] }),
      artifact ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "\u4EA7\u7269 ID ",
          artifact.id
        ] }),
        /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "SHA-256 ",
          artifact.digest
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          artifact.size,
          " \u5B57\u8282 \xB7 ",
          artifact.mediaType
        ] }),
        artifact.origin ? /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "\u767B\u8BB0 origin\uFF1A",
          artifact.origin
        ] }) : null,
        artifact.taskId ? /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "\u767B\u8BB0 taskId\uFF1A",
          artifact.taskId
        ] }) : null,
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EE5\u4E0A\u4E3A\u65E2\u6709\u767B\u8BB0\u4FE1\u606F\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u6838\u9A8C\u6765\u6E90\u6216\u79D1\u5B66\u5BA1\u67E5\u901A\u8FC7\u3002" })
      ] }) : null,
      /* @__PURE__ */ jsxs("label", { children: [
        "\u8D44\u4EA7\u5728\u6587\u7A3F\u4E2D\u7684\u8DEF\u5F84",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u8D44\u4EA7\u76EE\u6807\u8DEF\u5F84", value: s.assetPath, onChange: (e) => this.changeAsset({ assetPath: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.checking || this.props.busy, onClick: () => void this.addAsset(), children: publicationSourcePath(s.assetPath.trim()) ? "\u52A0\u5165\u56FA\u5B9A\u6E90\u6587\u4EF6" : "\u52A0\u5165\u56FA\u5B9A\u8D44\u4EA7" }),
      s.checking ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u6838\u9A8C\u5B8C\u6574\u6587\u672C\u4E0E\u56FA\u5B9A\u4EA7\u7269\u6458\u8981\u2026" }) : null,
      s.preview || s.previewComplete ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u56FA\u5B9A\u6587\u672C\u9884\u89C8\uFF08\u53EA\u8BFB\uFF09",
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u56FA\u5B9A\u6587\u672C\u9884\u89C8\uFF08\u53EA\u8BFB\uFF09", readOnly: true, rows: 8, value: s.preview })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          s.previewComplete ? "\u9884\u89C8\u5DF2\u5B8C\u6574\u663E\u793A" : "\u4EC5\u663E\u793A\u524D 16,000 \u5B57\u7B26\uFF0C\u672A\u5C06\u90E8\u5206\u9884\u89C8\u7528\u4F5C\u5B8C\u6574\u8349\u7A3F",
          "\uFF1B\u5B8C\u6574\u539F\u4EA7\u7269\u4FDD\u6301\u56FA\u5B9A\u5F15\u7528\u3002"
        ] })
      ] }) : null,
      /* @__PURE__ */ jsx("ul", { children: s.assets.map((a) => /* @__PURE__ */ jsxs("li", { children: [
        a.path,
        /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "\u4EA7\u7269 ID ",
          a.artifactId
        ] }),
        /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
          "SHA-256 ",
          this.props.data.artifacts.find((row) => row.id === a.artifactId)?.digest ?? "\u4EA7\u7269\u8BB0\u5F55\u4E0D\u53EF\u7528"
        ] }),
        " ",
        /* @__PURE__ */ jsxs("button", { className: "text-button danger", disabled: a.path === s.mainFile || s.checking, onClick: () => this.setState({ assets: s.assets.filter((f) => f.path !== a.path) }), children: [
          "\u79FB\u9664 ",
          a.path
        ] })
      ] }, a.path)) }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.props.busy || s.checking || !s.title.trim() || !s.mainFile.endsWith(".tex") || !allFiles.some((f) => f.path === s.mainFile), onClick: () => this.props.onFreeze({ title: s.title, engine: s.engine, mainFile: s.mainFile, bibliography: s.bibliography, ...s.templateId ? { templateId: s.templateId } : {}, files: s.files, assets: s.assets }), children: "\u51BB\u7ED3\u4E3A\u65B0\u6587\u7A3F\u4FEE\u8BA2" })
    ] });
  }
}
class PublicationPreview extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { page: 1, imageURL: "", error: "", loading: false };
    this.epoch = 0;
    this.mounted = true;
    this.url = "";
  }
  componentDidMount() {
    if (this.props.ready) void this.load(1);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.controller?.abort();
    this.revoke();
  }
  revoke() {
    if (this.url) {
      URL.revokeObjectURL(this.url);
      this.url = "";
    }
  }
  async load(page) {
    const preview = this.props.result.previews.find((p) => p.pageNumber === page);
    if (!preview) return;
    const epoch = ++this.epoch;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.revoke();
    this.setState({ page, imageURL: "", loading: true, error: "" });
    try {
      const image = await verifiedPageImage(await artifactBlob(preview.artifactId, controller.signal), preview.digest);
      if (!this.mounted || epoch !== this.epoch) return;
      this.url = URL.createObjectURL(image);
      this.setState({ imageURL: this.url });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ loading: false });
    }
  }
  render() {
    const r = this.props.result, s = this.state;
    return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
      /* @__PURE__ */ jsx("h3", { children: "\u56FA\u5B9A\u6784\u5EFA\u7ED3\u679C" }),
      /* @__PURE__ */ jsxs("p", { children: [
        r.status,
        " \xB7 \u6536\u655B ",
        r.converged ? "\u662F" : "\u5426",
        " \xB7 \u7F16\u8BD1 ",
        r.passes,
        " \u8F6E \xB7 ",
        r.engineVersion
      ] }),
      /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
        "Manifest ",
        r.manifestDigest
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => this.props.perform(() => downloadArtifact(r.manifestArtifactId, "build-manifest.json")), children: "\u4E0B\u8F7D\u56FA\u5B9A\u6784\u5EFA\u6E05\u5355" }),
        this.props.ready && r.status === "succeeded" && r.converged && !r.hadErrors && r.pdf ? /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => this.props.perform(() => downloadArtifact(r.pdf.artifactId, "manuscript.pdf")), children: "\u4E0B\u8F7D\u56FA\u5B9A PDF" }) : null,
        r.logs.map((log, i) => /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => this.props.perform(() => downloadArtifact(log.artifactId, `build-${i + 1}.log`)), children: [
          "\u4E0B\u8F7D\u7F16\u8BD1\u65E5\u5FD7 ",
          i + 1
        ] }, log.artifactId))
      ] }),
      this.props.ready && r.status === "succeeded" && r.converged && !r.hadErrors && r.previews.length ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6587\u7A3F\u7269\u7406\u9875",
          /* @__PURE__ */ jsx("select", { "aria-label": "\u6587\u7A3F\u7269\u7406\u9875", value: s.page, onChange: (e) => void this.load(Number(e.target.value)), children: r.previews.map((p) => /* @__PURE__ */ jsxs("option", { value: p.pageNumber, children: [
            "\u7B2C ",
            p.pageNumber,
            " \u9875"
          ] }, p.pageNumber)) })
        ] }),
        s.imageURL ? /* @__PURE__ */ jsx("img", { src: s.imageURL, alt: `\u56FA\u5B9A\u6587\u7A3F\u7B2C ${s.page} \u9875`, style: { maxWidth: "100%", height: "auto" }, onError: () => this.setState({ error: "\u6D4F\u89C8\u5668\u65E0\u6CD5\u89E3\u7801\u56FA\u5B9A PNG \u9875\u56FE\uFF1B\u53EF\u4E0B\u8F7D PDF \u6838\u5BF9\u3002" }) }) : /* @__PURE__ */ jsx("p", { role: "status", children: s.loading ? "\u6B63\u5728\u6838\u5BF9 PNG \u7B7E\u540D\u548C\u6458\u8981\u2026" : "\u9875\u56FE\u4E0D\u53EF\u7528" })
      ] }) : null,
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null
    ] });
  }
}
export {
  PublicationView,
  publicationBase64,
  publicationLineRange,
  publicationSourcePath
};
