import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactBlob, downloadArtifact } from "./api.js";
import { Badge } from "./ui.js";
import { short } from "./models.js";
class PublicationDialogue extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { results: {}, drafts: {}, pdfUrl: "", pdfTitle: "" };
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
    this.releasePdf();
  }
  componentDidUpdate(previous) {
    if (previous.session.id !== this.props.session.id || previous.data.project.id !== this.props.data.project.id) {
      this.releasePdf();
      this.setState({ results: {}, drafts: {}, pdfUrl: "", pdfTitle: "" });
    }
  }
  releasePdf() {
    if (this.state.pdfUrl) URL.revokeObjectURL(this.state.pdfUrl);
  }
  dialogue() {
    return { projectId: this.props.data.project.id, sessionId: this.props.session.id };
  }
  matches(c) {
    return this.mounted && c.projectId === this.props.data.project.id && c.sessionId === this.props.session.id;
  }
  call(c, name, input, key) {
    return api(`/operations/${name}`, { ...c, input }, "POST", void 0, key);
  }
  owns(job) {
    return (this.props.data.manuscripts ?? []).some((r) => r.id === job.revisionId && r.rootSessionId === this.props.session.id && r.sourceDigest === job.sourceDigest);
  }
  assertJob(c, job) {
    if (!this.matches(c) || !this.owns(job) || !(this.props.data.publicationJobs ?? []).some((j) => j.id === job.id && j.manifestDigest === job.manifestDigest)) throw Error("\u5F53\u524D\u5BF9\u8BDD\u6216\u56FA\u5B9A\u6587\u7A3F\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u3002");
  }
  async draft(revision) {
    const c = this.dialogue(), own = () => this.matches(c) && (this.props.data.manuscripts ?? []).some((r) => r.id === revision.id && r.rootSessionId === c.sessionId && r.sourceDigest === revision.sourceDigest);
    if (!own()) throw Error("\u6587\u7A3F\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5BF9\u8BDD\u3002");
    const source = await this.call(c, "manuscript_source_read", { revisionId: revision.id, path: revision.mainFile, cursor: 0, limit: 64e3 });
    if (!own() || source.digest !== revision.files.find((f) => f.path === revision.mainFile)?.digest) throw Error("\u6587\u7A3F\u6216\u5F53\u524D\u5BF9\u8BDD\u5DF2\u53D8\u5316\u3002");
    this.setState((s) => ({ drafts: { ...s.drafts, [revision.id]: { content: source.content, complete: source.complete } } }));
  }
  async submit(job) {
    const c = this.dialogue();
    this.assertJob(c, job);
    const approval = this.props.data.approvals.find((a) => a.id === job.approvalId && a.subjectId === job.id && a.scope === "publication.build" && a.digest === job.manifestDigest);
    if (!approval || !["pending", "approved"].includes(approval.status)) throw Error("\u6B64\u56FA\u5B9A\u7F16\u8BD1\u5C1A\u672A\u53D6\u5F97\u6709\u6548\u6279\u51C6\u3002");
    if (approval.status === "pending") await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true });
    this.assertJob(c, job);
    await this.call(c, "publication_submit", { jobId: job.id });
  }
  async result(job) {
    const c = this.dialogue();
    this.assertJob(c, job);
    if (!job.resultId) throw Error("\u7F16\u8BD1\u5C1A\u672A\u4EA7\u751F\u7ED3\u679C\u3002");
    const result = await this.call(c, "publication_result", { resultId: job.resultId });
    this.assertJob(c, job);
    if (result.jobId !== job.id || result.revisionId !== job.revisionId || result.manifestDigest !== job.manifestDigest) throw Error("\u7F16\u8BD1\u7ED3\u679C\u4E0E\u56FA\u5B9A\u6587\u7A3F\u4E0D\u4E00\u81F4\u3002");
    this.setState((s) => ({ results: { ...s.results, [job.id]: result } }));
    return result;
  }
  async preview(job) {
    const c = this.dialogue(), result = await this.result(job);
    if (!result.pdf) throw Error("\u672C\u6B21\u7F16\u8BD1\u6CA1\u6709\u6210\u529F PDF\uFF0C\u8BF7\u67E5\u770B\u8BCA\u65AD\u3002");
    const blob = await artifactBlob(result.pdf.artifactId);
    this.assertJob(c, job);
    this.releasePdf();
    this.setState({ pdfUrl: URL.createObjectURL(blob), pdfTitle: `\u6587\u7A3F ${short(job.revisionId)}` });
  }
  async export(job) {
    const c = this.dialogue(), result = await this.result(job), revision = (this.props.data.manuscripts ?? []).find((r) => r.id === job.revisionId);
    if (!result.pdf || result.sourceValidity !== "current" || result.status !== "succeeded") throw Error("\u53EA\u6709\u6765\u6E90\u6709\u6548\u7684\u6210\u529F\u6587\u7A3F\u624D\u80FD\u751F\u6210\u65B0\u7684\u6210\u679C\u5305\u3002");
    const runIds = [...new Set(revision.files.filter((f) => f.provenance.kind === "run").flatMap((f) => f.provenance.id ? [f.provenance.id] : []))];
    const report = await this.call(c, "report_create", { title: revision.title, runIds, claimIds: [], publicationResultIds: [result.id] });
    this.assertJob(c, job);
    const fresh = await api(`/projects/${c.projectId}/state?sessionId=${encodeURIComponent(c.sessionId)}`), record = fresh.reports.find((r) => r.artifactId === report.id);
    this.assertJob(c, job);
    if (!record) throw Error("\u56FA\u5B9A\u62A5\u544A\u5DF2\u4FDD\u5B58\uFF0C\u6682\u672A\u8BFB\u53D6\u5230\u56DE\u6267\uFF0C\u8BF7\u5237\u65B0\u540E\u7EE7\u7EED\u3002");
    const archive = await this.call(c, "report_export", { reportId: record.id }, `publication-export:${record.id}`);
    this.assertJob(c, job);
    await downloadArtifact(archive.id, archive.title);
  }
  async startReview(reviewId) {
    const c = this.dialogue(), review = (this.props.data.publicationReviews ?? []).find((r) => r.id === reviewId && r.rootSessionId === c.sessionId), approval = this.props.data.approvals.find((a) => a.id === review?.approvalId);
    const team = this.props.data.teams.find((t) => t.id === review?.teamId);
    if (!review || review.validity !== "current" || !approval || !["pending", "approved"].includes(approval.status) || !this.props.data.project.settings.enabled || !team?.delegationEnabled) throw Error("\u8BF7\u6838\u5BF9\u56FA\u5B9A\u5BA1\u67E5\u53CA\u5176\u5206\u5DE5\u6388\u6743\uFF0C\u5E76\u542F\u7528\u8F93\u5165\u6846\u65C1\u7684\u591A\u667A\u80FD\u4F53\u6A21\u5F0F\u3002");
    if (approval.status === "pending") await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true });
    if (!this.matches(c)) throw Error("\u5DF2\u6279\u51C6\u5BA1\u67E5\uFF0C\u5F53\u524D\u5BF9\u8BDD\u5DF2\u5207\u6362\uFF1B\u8BF7\u56DE\u539F\u5BF9\u8BDD\u542F\u52A8\u3002");
    await api(`/teams/${review.teamId}/activate`, {});
  }
  render() {
    const { data, session, disabled, busy, perform } = this.props, revisions = (data.manuscripts ?? []).filter((r) => r.rootSessionId === session.id);
    if (!revisions.length) return null;
    const superseded = new Set(revisions.flatMap((r) => r.previousRevisionId ? [r.previousRevisionId] : []));
    const needsAttention = (j) => ["prepared", "failed", "unknown", "timed_out", "cancelled"].includes(j.state) || !!j.error || (data.publicationReviews ?? []).some((r) => r.publicationResultId === j.resultId && r.status === "awaiting_approval");
    const isCurrent = (r) => !superseded.has(r.id) || (data.publicationJobs ?? []).some((j) => j.revisionId === r.id && needsAttention(j));
    const renderRevision = (revision) => {
      const jobs = (data.publicationJobs ?? []).filter((j) => j.revisionId === revision.id);
      return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: !jobs.length || jobs.some(needsAttention), children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u6587\u7A3F \xB7 ",
          revision.title,
          /* @__PURE__ */ jsxs("span", { children: [
            "\u7248\u672C ",
            short(revision.id)
          ] })
        ] }),
        revision.previousRevisionId ? /* @__PURE__ */ jsxs("p", { children: [
          "\u4FEE\u8BA2\u81EA ",
          short(revision.previousRevisionId),
          " \xB7 \u65E7\u7248\u672C\u4FDD\u7559"
        ] }) : null,
        /* @__PURE__ */ jsxs("p", { children: [
          revision.files.length,
          " \u4E2A\u56FA\u5B9A\u6587\u4EF6 \xB7 ",
          revision.engine
        ] }),
        /* @__PURE__ */ jsx("button", { className: "text-button", disabled: busy, onClick: () => perform(() => this.draft(revision)), children: "\u67E5\u770B\u6587\u7A3F\u6E90\u7801" }),
        this.state.drafts[revision.id] ? /* @__PURE__ */ jsxs("details", { open: true, children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            revision.mainFile,
            " \xB7 \u53EA\u8BFB"
          ] }),
          /* @__PURE__ */ jsx("pre", { className: "file-preview", children: this.state.drafts[revision.id].content }),
          !this.state.drafts[revision.id].complete ? /* @__PURE__ */ jsx("p", { children: "\u5DF2\u5C55\u793A\u524D64000\u5B57\u7B26\uFF1B\u5B8C\u6574\u6E90\u7801\u4FDD\u7559\u5728\u56FA\u5B9A\u7A3F\u4EF6\u4E2D\u3002" }) : null
        ] }) : null,
        !jobs.length ? /* @__PURE__ */ jsx("p", { children: "\u7A3F\u4EF6\u5DF2\u4FDD\u5B58\u3002\u5728\u5BF9\u8BDD\u4E2D\u8981\u6C42\u667A\u80FD\u4F53\u51C6\u5907\u7F16\u8BD1\u6216\u4FEE\u6539\u5185\u5BB9\u3002" }) : null,
        jobs.map((job) => {
          const result = this.state.results[job.id], reviews = (data.publicationReviews ?? []).filter((r) => r.publicationResultId === job.resultId && r.rootSessionId === session.id), reportIds = new Set(data.reports.filter((r) => r.publicationResultIds?.includes(job.resultId ?? "")).map((r) => r.id));
          return /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "\u7F16\u8BD1 ",
              short(job.id),
              " ",
              /* @__PURE__ */ jsx(Badge, { value: job.state }),
              /* @__PURE__ */ jsx(Badge, { value: job.integrity })
            ] }),
            /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u7F16\u8BD1\u8303\u56F4" }),
              /* @__PURE__ */ jsxs("p", { children: [
                job.engine,
                " \xB7 ",
                job.mainFile,
                " \xB7 ",
                job.resources.cpus,
                " CPU / ",
                job.resources.memoryMb,
                " MB \xB7 \u6700\u957F ",
                job.resources.timeoutSeconds,
                " \u79D2"
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                "\u6784\u5EFA\u955C\u50CF ",
                short(job.imageDigest),
                " \xB7 \u6E90\u7801 ",
                short(job.sourceDigest)
              ] })
            ] }),
            job.state === "prepared" ? /* @__PURE__ */ jsx("div", { className: "actions wrap", children: /* @__PURE__ */ jsx("button", { className: "primary compact", disabled, onClick: () => perform(() => this.submit(job), "\u56FA\u5B9A\u6587\u7A3F\u7F16\u8BD1\u5DF2\u63D0\u4EA4"), children: "\u6279\u51C6\u5E76\u7F16\u8BD1" }) }) : null,
            job.resultId ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", disabled: busy, onClick: () => perform(() => this.result(job)), children: "\u67E5\u770B\u7F16\u8BD1\u8BCA\u65AD" }),
              job.state === "succeeded" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { className: "text-button", disabled: busy, onClick: () => perform(() => this.preview(job)), children: "\u9884\u89C8 PDF" }),
                /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.export(job), "\u56FA\u5B9A PDF\u3001\u6E90\u7801\u53CA\u590D\u73B0\u6750\u6599\u5DF2\u6253\u5305"), children: "\u5BFC\u51FA\u6210\u679C\u5305" })
              ] }) : null
            ] }) : null,
            job.error ? /* @__PURE__ */ jsx("p", { role: "status", children: job.error }) : null,
            result ? /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsxs("summary", { children: [
                "\u7F16\u8BD1\u8BCA\u65AD \xB7 ",
                result.diagnostics.length,
                " \u9879"
              ] }),
              result.sourceValidity === "stale" ? /* @__PURE__ */ jsx("p", { children: "\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u4FDD\u7559\u5386\u53F2\u7ED3\u679C\uFF1B\u4E0D\u80FD\u7528\u4E8E\u65B0\u7F16\u8BD1\u6216\u5BFC\u51FA\u3002" }) : null,
              result.diagnostics.length ? result.diagnostics.slice(0, 30).map((d, i) => /* @__PURE__ */ jsxs("p", { children: [
                d.severity,
                " \xB7 ",
                d.message,
                d.file ? ` \xB7 ${d.file}:${d.line ?? ""}` : ""
              ] }, i)) : /* @__PURE__ */ jsx("p", { children: "\u672C\u6B21\u56FA\u5B9A\u7F16\u8BD1\u672A\u62A5\u544A\u8BCA\u65AD\u3002" })
            ] }) : null,
            reviews.map((review) => /* @__PURE__ */ jsxs("details", { open: review.status === "awaiting_approval", children: [
              /* @__PURE__ */ jsxs("summary", { children: [
                "\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5 ",
                /* @__PURE__ */ jsx(Badge, { value: review.status })
              ] }),
              /* @__PURE__ */ jsx("p", { children: review.summary ?? "\u4EC5\u5BA1\u67E5\u8FD9\u4E00\u56FA\u5B9A\u6587\u7A3F\u53CA\u83B7\u51C6\u8BC1\u636E\u3002" }),
              review.reason ? /* @__PURE__ */ jsx("p", { children: review.reason }) : null,
              review.status === "awaiting_approval" && review.validity === "current" ? /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: disabled || !data.project.settings.enabled || !data.teams.find((t) => t.id === review.teamId)?.delegationEnabled, onClick: () => perform(() => this.startReview(review.id), "\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5\u5DF2\u542F\u52A8"), children: "\u6279\u51C6\u5E76\u542F\u52A8\u5BA1\u67E5" }) : null,
              !data.project.settings.enabled && review.status === "awaiting_approval" ? /* @__PURE__ */ jsx("p", { children: "\u542F\u7528\u591A\u667A\u80FD\u4F53\u5F00\u5173\u540E\u53EF\u6267\u884C\u72EC\u7ACB\u5BA1\u67E5\u3002" }) : null
            ] }, review.id)),
            (data.publicationExports ?? []).filter((e) => reportIds.has(e.reportId)).map((e) => /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => downloadArtifact(e.artifactId, `report-${e.reportId}.tar.gz`)), children: "\u4E0B\u8F7D\u5DF2\u5F52\u6863\u6210\u679C\u5305" }, e.artifactId))
          ] }, job.id);
        })
      ] }, revision.id);
    };
    const older = revisions.filter((r) => !isCurrent(r));
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      revisions.filter(isCurrent).map(renderRevision),
      older.length ? /* @__PURE__ */ jsxs("details", { className: "workflow-history", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u5386\u53F2\u6587\u7A3F\uFF08",
          older.length,
          "\uFF09"
        ] }),
        older.map(renderRevision)
      ] }) : null,
      this.state.pdfUrl ? /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: true, children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          this.state.pdfTitle,
          " \xB7 PDF"
        ] }),
        /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => {
          this.releasePdf();
          this.setState({ pdfUrl: "", pdfTitle: "" });
        }, children: "\u5173\u95ED\u9884\u89C8" }),
        /* @__PURE__ */ jsx("iframe", { title: this.state.pdfTitle, src: this.state.pdfUrl, style: { width: "100%", height: "70vh", border: 0 } })
      ] }) : null
    ] });
  }
}
export {
  PublicationDialogue
};
