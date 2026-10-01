import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactText, downloadArtifact } from "./api.js";
import { short, label } from "./models.js";
import { SectionTitle, Badge, Empty } from "./ui.js";
import { PublicationView } from "./publication-view.js";
import { publicationReviewStatus } from "./publication-review-view.js";
const referenceTypes = { run: "\u6B63\u5F0F\u8FD0\u884C", "run-source": "\u56FA\u5B9A\u8FD0\u884C\u6E90\u7801", artifact: "\u539F\u59CB\u4EA7\u7269", evidence: "\u5B9A\u4F4D\u8BC1\u636E", "development-job": "\u5F00\u53D1\u6D4B\u8BD5", "development-review": "\u72EC\u7ACB\u5BA1\u67E5", claim: "\u5DF2\u91C7\u7EB3\u7ED3\u8BBA", publication: "\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA", "publication-review": "\u56FA\u5B9A\u8BBA\u6587\u5BA1\u67E5", "figure-source": "\u56FE\u5F62\u751F\u6210\u6765\u6E90", "figure-source-code": "\u56FE\u5F62\u751F\u6210\u6E90\u7801", "research-comparison": "\u56FA\u5B9A\u7814\u7A76\u6BD4\u8F83", "experiment-plan": "\u56FA\u5B9A\u7814\u7A76\u65B9\u6848" };
function provenanceSignature(data, reportId) {
  const versions = (rows) => (rows ?? []).map((row) => {
    const r = row;
    return [r.id, r.version ?? null, r.status ?? null, r.state ?? null, r.integrity ?? null, r.sourceDigest ?? null];
  }).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  return JSON.stringify([
    data.project.id,
    data.project.version,
    data.project.archived,
    versions(data.claims),
    versions(data.approvals),
    versions(data.tasks),
    versions(data.teams),
    versions(data.changeProposals),
    versions(data.experiments),
    versions(data.reviews),
    versions(data.sandboxJobs),
    versions(data.developmentTasks),
    versions(data.intents),
    versions(data.sessions),
    versions(data.campaigns),
    versions(data.rounds),
    versions(data.members),
    versions(data.observations),
    versions(data.decisions),
    versions(data.experimentPlans),
    versions(data.researchCandidates),
    versions(data.runs),
    versions(data.documents),
    versions(data.evidence),
    versions(data.artifacts),
    (data.documentParseJobs ?? []).map((j) => [j.id, j.state, j.integrity, j.resultId ?? null, j.manifestDigest, j.rawDigest, j.approvalId]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  ]);
}
function sameReference(a, b) {
  const keys = ["id", "type", "targetId", "digest", "runId", "path", "relation"];
  const documentKeys = ["documentVersionId", "rawDigest", "parseResultId", "pageNumber", "textArtifactDigest", "start", "end", "pageLabel", "rawArtifactId", "imageArtifactId"];
  const providerTextKeys = ["documentVersionId", "documentDigest", "rawDigest", "textArtifactDigest", "reportedVersion", "start", "end", "rawArtifactId", "textArtifactId"];
  return keys.every((key) => a[key] === b[key]) && (!a.document && !b.document || !!a.document && !!b.document && documentKeys.every((key) => a.document[key] === b.document[key])) && (!a.providerText && !b.providerText || !!a.providerText && !!b.providerText && providerTextKeys.every((key) => a.providerText[key] === b.providerText[key]));
}
function validDocument(ref) {
  const d = ref.document;
  return ref.type === "evidence" && d && ["documentVersionId", "rawDigest", "parseResultId", "textArtifactDigest", "rawArtifactId", "imageArtifactId"].every((key) => typeof d[key] === "string" && !!d[key]) && Number.isSafeInteger(d.pageNumber) && d.pageNumber > 0 && Number.isSafeInteger(d.start) && d.start >= 0 && Number.isSafeInteger(d.end) && d.end > d.start;
}
function validProviderText(ref) {
  const p = ref.providerText;
  return ref.type === "evidence" && !ref.document && p && ["documentVersionId", "documentDigest", "rawDigest", "textArtifactDigest", "reportedVersion", "rawArtifactId", "textArtifactId"].every((key) => typeof p[key] === "string" && !!p[key]) && Number.isSafeInteger(p.start) && p.start >= 0 && Number.isSafeInteger(p.end) && p.end > p.start;
}
class ReportsView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { publicationOpen: false, publications: [], title: "\u7814\u7A76\u7ED3\u679C\u8BB0\u5F55", selected: [], selectedClaims: [], selectedCampaigns: [], pendingArtifactId: "", report: null, body: "", loading: false, error: "", checking: false, verificationError: "", reference: null, verifiedReference: null, content: "", cursor: 0, complete: false, reading: false, referenceError: "", exported: null };
    this.publicationView = null;
    this.reportEpoch = 0;
    this.referenceEpoch = 0;
    this.inspectionEpoch = 0;
    this.mounted = true;
  }
  componentDidMount() {
    if (this.props.selectedReport) void this.open(this.props.selectedReport);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.reportEpoch++;
    this.referenceEpoch++;
  }
  componentDidUpdate(prev) {
    if (this.props.data.project.id !== prev.data.project.id) {
      this.reportEpoch++;
      this.referenceEpoch++;
      this.inspectionEpoch++;
      this.setState({ publications: [], selected: [], selectedClaims: [], selectedCampaigns: [], pendingArtifactId: "", report: null, body: "", reference: null, verifiedReference: null, content: "", cursor: 0, complete: false, reading: false, exported: null, error: "", loading: false, checking: false, verificationError: "", referenceError: "" });
      if (this.props.selectedReport) void this.open(this.props.selectedReport);
      return;
    }
    if (this.props.selectedReport !== prev.selectedReport) {
      if (this.props.selectedReport) void this.open(this.props.selectedReport);
      else {
        this.reportEpoch++;
        this.referenceEpoch++;
        this.setState({ report: null, body: "", reference: null, verifiedReference: null, content: "", exported: null, error: "" });
      }
    } else if (this.state.report && provenanceSignature(prev.data, this.state.report.id) !== provenanceSignature(this.props.data, this.state.report.id)) void this.reinspect();
    if (this.state.pendingArtifactId) {
      const row = this.props.data.reports.find((r) => r.artifactId === this.state.pendingArtifactId);
      if (row) this.setState({ pendingArtifactId: "" }, () => this.select(row.id));
    }
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  select(id) {
    if (this.props.onSelect && id !== this.props.selectedReport) this.props.onSelect(id);
    else void this.open(id);
  }
  async reinspect() {
    const report = this.state.report;
    if (!report) return;
    const epoch = ++this.inspectionEpoch, selection = this.reportEpoch;
    this.setState({ checking: true, verificationError: "" });
    try {
      const next = await this.call("report_inspect", { reportId: report.id });
      if (next.id !== report.id || next.artifactId !== report.artifactId) throw Error("\u62A5\u544A\u7ED1\u5B9A\u4E0E\u6240\u9009\u8BB0\u5F55\u4E0D\u4E00\u81F4\u3002");
      if (this.mounted && epoch === this.inspectionEpoch && selection === this.reportEpoch) this.setState({ report: next, checking: false });
    } catch (error) {
      if (this.mounted && epoch === this.inspectionEpoch && selection === this.reportEpoch) this.setState({ checking: false, verificationError: "\u6765\u6E90\u91CD\u65B0\u6838\u9A8C\u5931\u8D25\uFF0C\u6682\u505C\u5BFC\u51FA\uFF1A" + (error instanceof Error ? error.message : String(error)) });
    }
  }
  async open(id) {
    const epoch = ++this.reportEpoch, signature = provenanceSignature(this.props.data, id);
    this.referenceEpoch++;
    this.setState({ report: null, body: "", loading: true, error: "", checking: false, verificationError: "", reference: null, verifiedReference: null, content: "", cursor: 0, complete: false, reading: false, exported: null });
    try {
      const row = this.props.data.reports.find((r) => r.id === id);
      if (!row) throw Error("\u6B64\u62A5\u544A\u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF1B\u8BF7\u9009\u62E9\u6709\u6548\u8BB0\u5F55\u3002");
      const [report, body] = await Promise.all([this.call("report_inspect", { reportId: id }), artifactText(row.artifactId)]);
      if (report.id !== id || report.artifactId !== row.artifactId) throw Error("\u62A5\u544A\u7ED1\u5B9A\u4E0E\u6240\u9009\u8BB0\u5F55\u4E0D\u4E00\u81F4\u3002");
      if (this.mounted && epoch === this.reportEpoch) this.setState({ report, body }, () => {
        if (signature !== provenanceSignature(this.props.data, id)) void this.reinspect();
      });
    } catch (error) {
      if (this.mounted && epoch === this.reportEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.reportEpoch) this.setState({ loading: false });
    }
  }
  async readReference(referenceId, append = false) {
    const report = this.state.report, reference = report?.references.find((r) => r.id === referenceId);
    if (!report || !reference || !Object.prototype.hasOwnProperty.call(referenceTypes, reference.type)) return;
    if (append && (this.state.reading || this.state.reference?.id !== referenceId || this.state.complete)) return;
    const epoch = ++this.referenceEpoch, reportEpoch = this.reportEpoch, cursor = append ? this.state.cursor : 0;
    this.setState((previous) => ({ ...previous, reference, verifiedReference: null, reading: true, referenceError: "", ...!append ? { content: "", cursor: 0, complete: false } : {} }));
    try {
      const result = await this.call("report_reference_read", { reportId: report.id, referenceId, cursor, limit: 16e3 });
      if (!sameReference(result.reference, reference) || reference.document && !validDocument(result.reference) || reference.providerText && !validProviderText(result.reference)) throw Error("\u8FD4\u56DE\u7684\u8BC1\u636E\u4E0D\u5C5E\u4E8E\u6240\u9009\u5F15\u7528\u3002");
      if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch) this.setState({ verifiedReference: result.reference, content: (append ? this.state.content : "") + result.content, cursor: result.end, complete: result.complete });
    } catch (error) {
      if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch) this.setState({ referenceError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.referenceEpoch && reportEpoch === this.reportEpoch) this.setState({ reading: false });
    }
  }
  documentReference() {
    const s = this.state, ref = s.verifiedReference;
    return this.mounted && !s.reading && !s.referenceError && !s.checking && !s.verificationError && s.report?.integrity === "verified" && ref && ref.id === s.reference?.id && s.report.references.some((r) => sameReference(r, ref)) && validDocument(ref) ? ref.document : null;
  }
  openDocument() {
    const d = this.documentReference();
    if (d) this.props.onDocument?.({ documentVersionId: d.documentVersionId, parseResultId: d.parseResultId, pageNumber: d.pageNumber, start: d.start, end: d.end });
  }
  providerTextReference() {
    const s = this.state, ref = s.verifiedReference;
    return this.mounted && !s.reading && !s.referenceError && !s.checking && !s.verificationError && s.report?.integrity === "verified" && ref && ref.id === s.reference?.id && s.report.references.some((r) => sameReference(r, ref)) && validProviderText(ref) ? ref.providerText : null;
  }
  openProviderText() {
    const p = this.providerTextReference();
    if (p) this.props.onDocument?.({ documentVersionId: p.documentVersionId });
  }
  async downloadDocument(kind) {
    const d = this.documentReference();
    if (!d) return;
    await this.props.perform(() => downloadArtifact(kind === "raw" ? d.rawArtifactId : d.imageArtifactId, kind === "raw" ? `${d.documentVersionId}.pdf` : `${d.documentVersionId}-page-${d.pageNumber}.png`));
  }
  addPublication(result, title) {
    if (this.state.publications.length >= 20 || this.state.publications.some((p) => p.result.id === result.id) || result.status !== "succeeded" || !result.converged || result.hadErrors || !result.pdf || result.sourceValidity !== "current") return;
    this.setState({ publications: [...this.state.publications, { result, title }] });
  }
  openPublication(resultId) {
    const publication = this.state.report?.publications?.find((p) => p.resultId === resultId);
    if (!publication || this.state.report?.integrity !== "verified" || !this.publicationView) return;
    this.setState({ publicationOpen: true }, () => {
      void this.publicationView?.openFixed(publication.revisionId, publication.jobId);
    });
  }
  openPublicationReview(resultId, reviewId) {
    const report = this.state.report, review = report?.publicationReviews?.find((p) => p.resultId === resultId)?.reviews.find((r) => r.id === reviewId);
    if (!review || review.publicationResultId !== resultId || report?.integrity !== "verified" || this.state.checking || this.state.verificationError) return;
    this.setState({ publicationOpen: true }, () => {
      void this.publicationView?.openFixed(review.revisionId, review.jobId, review.id);
    });
  }
  async downloadReference() {
    const report = this.state.report, ref = this.state.reference;
    if (!this.mounted || !report || report.integrity !== "verified" || this.state.checking || this.state.verificationError || ref?.type !== "artifact" || !report.references.some((r) => sameReference(r, ref))) return;
    await this.props.perform(() => downloadArtifact(ref.targetId, ref.path?.split("/").pop() ?? ref.label));
  }
  async create() {
    const projectId = this.props.data.project.id;
    await this.props.perform(async () => {
      const artifact = await this.call("report_create", { title: this.state.title, runIds: this.state.selected, claimIds: this.state.selectedClaims, ...this.state.selectedCampaigns.length ? { campaignIds: this.state.selectedCampaigns } : {}, ...this.state.publications.length ? { publicationResultIds: this.state.publications.map((p) => p.result.id) } : {} });
      if (!this.mounted || projectId !== this.props.data.project.id) return;
      const row = this.props.data.reports.find((r) => r.artifactId === artifact.id);
      if (row) this.select(row.id);
      else this.setState({ pendingArtifactId: artifact.id });
    }, "\u62A5\u544A\u5DF2\u751F\u6210\uFF1B\u6B63\u5728\u8BFB\u53D6\u56FA\u5B9A\u5F15\u7528");
  }
  async exportReport() {
    const report = this.state.report;
    if (!report || this.state.checking || this.state.verificationError || report.integrity !== "verified" || report.validity !== "current") return;
    const epoch = this.reportEpoch;
    await this.props.perform(async () => {
      const artifact = await this.call("report_export", { reportId: report.id });
      if (this.mounted && epoch === this.reportEpoch) this.setState({ exported: artifact });
    }, "\u79BB\u7EBF\u5305\u5DF2\u751F\u6210\uFF1B\u8BF7\u4E0B\u8F7D\u5E76\u4FDD\u7559\u6458\u8981");
  }
  openRun(runId, experimentId) {
    const row = this.props.data.runs.find((r) => r.id === runId && r.experimentId === experimentId);
    if (!row) {
      this.setState({ error: "\u6307\u5B9A Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
      return;
    }
    this.props.onRun?.(runId, experimentId);
  }
  render() {
    const { data, perform } = this.props, s = this.state, report = s.report, providerText = this.providerTextReference(), eligible = data.runs.filter((r) => ["succeeded", "failed", "cancelled"].includes(r.state)), claims = data.claims.filter((c) => c.status === "accepted" && c.validity !== "stale");
    const selectedRuns = data.runs.filter((r) => s.selected.includes(r.id)), mixed = new Set(selectedRuns.map((r) => r.manifest.contractDigest)).size > 1;
    const available = s.selectedCampaigns.every((id) => (data.campaigns ?? []).some((c) => c.id === id) && (data.experimentPlans ?? []).some((p) => p.campaignId === id)) && s.selected.every((id) => eligible.some((r) => r.id === id)) && s.selectedClaims.every((id) => claims.some((c) => c.id === id));
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u62A5\u544A\u4E0E\u6210\u679C", sub: "\u56FA\u5B9A\u6587\u6863\u3001\u8FD0\u884C\u8BC1\u636E\u548C\u79BB\u7EBF\u4EA4\u4ED8\uFF1B\u62A5\u544A\u4E0D\u4EE3\u66FF\u79D1\u7814\u5224\u65AD\u3002" }),
      /* @__PURE__ */ jsxs("details", { className: "secondary-section", open: s.publicationOpen, onToggle: (event) => {
        const publicationOpen = event.currentTarget.open;
        if (publicationOpen !== this.state.publicationOpen) this.setState({ publicationOpen });
      }, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u6587\u7A3F\u3001\u7F16\u8BD1\u4E0E\u8BBA\u6587\u5BA1\u67E5" }),
        /* @__PURE__ */ jsx(PublicationView, { ref: (view) => {
          this.publicationView = view;
        }, data, perform, onSession: this.props.onSession, selectedResultIds: s.publications.map((p) => p.result.id), onSelectResult: (result, title) => this.addPublication(result, title) }, data.project.id)
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "secondary-section", open: !s.report, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u65B0\u5EFA\u53EF\u8FFD\u6EAF\u62A5\u544A" }),
        /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u62A5\u544A\u540D\u79F0",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u62A5\u544A\u540D\u79F0", required: true, maxLength: 200, value: s.title, onChange: (e) => this.setState({ title: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsxs("legend", { children: [
              "\u7EB3\u5165\u7684\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\uFF08",
              s.publications.length,
              "/20\uFF09"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5728\u4E0A\u65B9\u9009\u62E9\u6210\u529F\u4E14\u6765\u6E90\u6709\u6548\u7684\u6784\u5EFA\uFF0C\u70B9\u51FB\u201C\u7EB3\u5165\u6B64\u56FA\u5B9A\u6784\u5EFA\u201D\u3002\u4EC5\u6709\u6587\u7A3F\u4E5F\u53EF\u751F\u6210\u62A5\u544A\u3002" }),
            s.publications.map((p) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsx("strong", { children: p.title }),
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                "\u4FEE\u8BA2 ",
                short(p.result.revisionId),
                " \xB7 \u6784\u5EFA ",
                short(p.result.jobId)
              ] }),
              /* @__PURE__ */ jsx("code", { className: "digest", children: p.result.sourceDigest }),
              /* @__PURE__ */ jsxs("button", { className: "text-button danger", onClick: () => this.setState({ publications: s.publications.filter((row) => row.result.id !== p.result.id) }), children: [
                "\u79FB\u9664\u6784\u5EFA ",
                short(p.result.jobId)
              ] })
            ] }, p.result.id))
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsxs("legend", { children: [
              "\u7EB3\u5165\u56FA\u5B9A\u7814\u7A76\u6D3B\u52A8\uFF08",
              s.selectedCampaigns.length,
              "/5\uFF09"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u81EA\u52A8\u7EB3\u5165\u8BE5\u6D3B\u52A8\u7684\u771F\u5B9E\u89C2\u6D4B\u548C\u5BF9\u7167 Run\uFF0C\u4FDD\u7559\u5931\u8D25\u3001\u65E0\u7ED3\u8BBA\u4E0E\u505C\u6B62\u539F\u56E0\uFF1B\u65B9\u6848\u58F0\u660E\u4E0D\u7B49\u4E8E\u79D1\u5B66\u7ED3\u8BBA\u3002" }),
            (data.campaigns ?? []).filter((c) => (data.experimentPlans ?? []).some((p) => p.campaignId === c.id)).map((c) => /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.selectedCampaigns.includes(c.id), disabled: !s.selectedCampaigns.includes(c.id) && s.selectedCampaigns.length >= 5, onChange: (e) => this.setState({ selectedCampaigns: e.target.checked ? [...s.selectedCampaigns, c.id] : s.selectedCampaigns.filter((id) => id !== c.id) }) }),
              c.goal,
              " \xB7 ",
              label(c.state)
            ] }, c.id))
          ] }),
          /* @__PURE__ */ jsx("div", { className: "run-selection", children: eligible.map((r) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.selected.includes(r.id), onChange: (e) => this.setState({ selected: e.target.checked ? [...s.selected, r.id] : s.selected.filter((id) => id !== r.id) }) }),
            /* @__PURE__ */ jsxs("span", { children: [
              data.experiments.find((e) => e.id === r.experimentId)?.title ?? "\u5386\u53F2\u5B9E\u9A8C",
              /* @__PURE__ */ jsxs("small", { children: [
                "Run ",
                short(r.id),
                " \xB7 \u4FEE\u8BA2 ",
                r.manifest.experimentRevision
              ] })
            ] }),
            /* @__PURE__ */ jsx(Badge, { value: r.state }),
            /* @__PURE__ */ jsx(Badge, { value: r.integrity })
          ] }, r.id)) }),
          claims.length ? /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u7EB3\u5165\u7684\u5DF2\u91C7\u7EB3\u7ED3\u8BBA" }),
            claims.map((c) => /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.selectedClaims.includes(c.id), onChange: (e) => this.setState({ selectedClaims: e.target.checked ? [...s.selectedClaims, c.id] : s.selectedClaims.filter((id) => id !== c.id) }) }),
              c.statement
            ] }, c.id))
          ] }) : null,
          mixed ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u6240\u9009 Run \u7684\u8FD0\u884C\u5951\u7EA6\u4E0D\u540C\uFF0C\u8BF7\u5206\u5F00\u751F\u6210\u62A5\u544A\u3002" }) : null,
          !available ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u90E8\u5206\u6240\u9009\u8BB0\u5F55\u5DF2\u4E0D\u53EF\u7528\u6216\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002" }) : null,
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: !s.title.trim() || !(s.selected.length + s.selectedClaims.length + s.publications.length + s.selectedCampaigns.length) || mixed || !available || !!s.pendingArtifactId, onClick: () => void this.create(), children: "\u751F\u6210\u56FA\u5B9A\u7ED3\u679C\u62A5\u544A" }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u670D\u52A1\u7AEF\u91CD\u65B0\u6838\u9A8C\u6765\u6E90\u4E0E\u539F\u59CB\u6307\u6807\u3002\u5931\u8D25\u6216\u4E0D\u5B8C\u6574\u7684 Run \u4F1A\u4FDD\u7559\u5176\u771F\u5B9E\u72B6\u6001\uFF0C\u4E0D\u8865\u5199\u7ED3\u679C\u3002" }),
          s.pendingArtifactId ? /* @__PURE__ */ jsxs("p", { role: "status", children: [
            "\u62A5\u544A\u4EA7\u7269\u5DF2\u4FDD\u5B58\uFF0C\u7B49\u5F85\u9879\u76EE\u8BB0\u5F55\u5237\u65B0\u3002",
            /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(async () => {
            }), children: "\u5237\u65B0\u8BB0\u5F55" })
          ] }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "evidence-grid", children: [
        /* @__PURE__ */ jsxs("section", { className: "surface artifact-list", children: [
          /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u5DF2\u751F\u6210\u62A5\u544A" }) }),
          data.reports.map((row) => {
            const artifact = data.artifacts.find((a) => a.id === row.artifactId);
            return /* @__PURE__ */ jsx("button", { className: "artifact-item " + (row.id === (report?.id ?? this.props.selectedReport) ? "active" : ""), onClick: () => this.select(row.id), children: /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: artifact?.title ?? "\u5386\u53F2\u62A5\u544A" }),
              /* @__PURE__ */ jsx("small", { children: short(row.id) })
            ] }) }, row.id);
          }),
          !data.reports.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u672A\u751F\u6210\u62A5\u544A\u3002" }) : null
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "surface artifact-preview", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: report?.title ?? "\u62A5\u544A\u9884\u89C8" }),
            report ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.reinspect(), children: "\u91CD\u65B0\u6838\u9A8C" }) : null
          ] }),
          s.loading ? /* @__PURE__ */ jsx("p", { role: "status", className: "inline-empty", children: "\u6B63\u5728\u8BFB\u53D6\u62A5\u544A\u4E0E\u56FA\u5B9A\u5F15\u7528\u2026" }) : null,
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
          report ? /* @__PURE__ */ jsxs("div", { children: [
            s.checking ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6765\u6E90\u8BB0\u5F55\u5DF2\u53D8\u5316\uFF0C\u6B63\u5728\u91CD\u65B0\u6838\u9A8C\u2026" }) : null,
            s.verificationError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.verificationError }) : null,
            /* @__PURE__ */ jsxs("div", { className: "preview-meta", children: [
              "\u5B8C\u6574\u6027\uFF1A",
              report.integrity === "verified" ? "\u5DF2\u6838\u9A8C" : "\u65E0\u6548",
              " \xB7 \u6765\u6E90\uFF1A",
              report.validity === "current" ? "\u5F53\u524D\u6709\u6548" : report.validity === "legacy" ? "\u65E7\u7248\u7F3A\u5C11\u5386\u53F2\u56FA\u5B9A\u7ED1\u5B9A" : "\u5DF2\u5931\u6548",
              " \xB7 \u683C\u5F0F v",
              report.formatVersion
            ] }),
            report.reasons.length ? /* @__PURE__ */ jsx("ul", { children: report.reasons.map((reason, i) => /* @__PURE__ */ jsx("li", { children: reason }, i)) }) : null,
            report.validity !== "current" || report.integrity !== "verified" ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u4FDD\u7559\u5386\u53F2\u539F\u6587\u4F9B\u56DE\u67E5\uFF1B\u5F53\u524D\u72B6\u6001\u4E0D\u5141\u8BB8\u751F\u6210\u65B0\u7684\u79BB\u7EBF\u4EA4\u4ED8\u5305\u3002" }) : null,
            /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
              /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(report.artifactId, data.artifacts.find((a) => a.id === report.artifactId)?.title ?? `${report.title}.md`)), children: "\u4E0B\u8F7D\u539F\u62A5\u544A Markdown" }),
              /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: s.checking || !!s.verificationError || report.validity !== "current" || report.integrity !== "verified", onClick: () => void this.exportReport(), children: "\u751F\u6210\u79BB\u7EBF\u4EA4\u4ED8\u5305" })
            ] }),
            s.exported ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsx("h3", { children: s.exported.title }),
              /* @__PURE__ */ jsxs("p", { children: [
                s.exported.size,
                " \u5B57\u8282"
              ] }),
              /* @__PURE__ */ jsxs("code", { className: "digest", children: [
                "SHA-256 ",
                s.exported.digest
              ] }),
              /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => perform(() => downloadArtifact(s.exported.id, s.exported.title)), children: "\u4E0B\u8F7D\u79BB\u7EBF\u5305" }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u751F\u6210\u4E0E\u53D1\u8D77\u4E0B\u8F7D\u4E0D\u4EE3\u8868\u6587\u4EF6\u5DF2\u843D\u76D8\uFF1B\u8BF7\u5728\u4E0B\u8F7D\u76EE\u5F55\u6838\u5BF9\u3002" })
            ] }) : null,
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u7814\u7A76\u65B9\u6848\u4E0E\u6BD4\u8F83\u5FEB\u7167" }),
              report.researchCampaigns?.length ? report.researchCampaigns.map((c) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
                /* @__PURE__ */ jsxs("h3", { children: [
                  "\u6D3B\u52A8 ",
                  short(c.campaignId)
                ] }),
                /* @__PURE__ */ jsxs("p", { children: [
                  "\u62A5\u544A\u751F\u6210\u65F6\uFF1A",
                  label(c.state),
                  " \xB7 ",
                  c.primaryMetric,
                  "\uFF08",
                  c.unit,
                  "\uFF09\xB7 \u9700\u8981\u7814\u7A76\u8005\u5BA1\u9605"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4E0B\u65B9\u8BB0\u5F55\u662F\u751F\u6210\u65F6\u7684\u56FA\u5B9A\u5FEB\u7167\uFF1B\u5F53\u524D\u6709\u6548\u6027\u89C1\u62A5\u544A\u6838\u9A8C\u72B6\u6001\u3002\u6267\u884C\u6210\u529F\u4E0D\u81EA\u52A8\u5224\u5B9A\u79D1\u5B66\u6210\u529F\u3002" }),
                /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.readReference(c.referenceId), children: "\u8BFB\u53D6\u56FA\u5B9A\u6BD4\u8F83\u4E0E\u771F\u5B9E\u89C2\u6D4B" }),
                c.planReferences.map((p) => /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => void this.readReference(p.referenceId), children: [
                  "\u8BFB\u53D6\u56FA\u5B9A\u65B9\u6848 ",
                  short(p.planRevisionId)
                ] }, p.planRevisionId)),
                /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !this.props.onCampaign || report.integrity !== "verified" || !(data.campaigns ?? []).some((item) => item.id === c.campaignId), onClick: () => this.props.onCampaign?.(c.campaignId), children: "\u56DE\u67E5\u6B64\u7814\u7A76\u6D3B\u52A8" })
              ] }, c.campaignId)) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u62A5\u544A\u672A\u7ED1\u5B9A\u56FA\u5B9A\u7814\u7A76\u65B9\u6848\uFF0C\u4E0D\u80FD\u8FFD\u8BA4\u5386\u53F2\u65B9\u6848\u6216\u6BD4\u8F83\u3002" })
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u8FD0\u884C\u4E0E\u5B9E\u6D4B\u6307\u6807" }),
              !report.runs.length ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u62A5\u544A\u672A\u7EB3\u5165\u6B63\u5F0F\u8FD0\u884C\uFF1B\u6587\u7A3F\u4E0E\u6587\u6863\u6765\u6E90\u4E0D\u4EE3\u8868\u8FD0\u884C\u5B9E\u6D4B\u7ED3\u679C\u3002" }) : null,
              report.runs.map((run) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
                /* @__PURE__ */ jsxs("h3", { children: [
                  "Run ",
                  short(run.runId),
                  " \xB7 \u4FEE\u8BA2 ",
                  run.revision
                ] }),
                /* @__PURE__ */ jsxs("p", { children: [
                  label(run.state),
                  " \xB7 ",
                  label(run.integrity),
                  " \xB7 \u79D1\u7814\u5224\u65AD ",
                  run.judgment
                ] }),
                /* @__PURE__ */ jsxs("code", { className: "digest", children: [
                  "\u6E90\u7801 ",
                  run.sourceDigest
                ] }),
                run.gitCommit ? /* @__PURE__ */ jsxs("code", { className: "digest", children: [
                  "Git ",
                  run.gitCommit
                ] }) : null,
                /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => this.openRun(run.runId, run.experimentId), children: [
                  "\u6253\u5F00\u6B64 Run ",
                  short(run.runId)
                ] }),
                /* @__PURE__ */ jsx("ul", { children: run.metrics.map((metric) => /* @__PURE__ */ jsxs("li", { children: [
                  metric.name,
                  ": ",
                  /* @__PURE__ */ jsxs("button", { className: "text-button numeric", disabled: !report.references.some((ref) => ref.id === metric.referenceId), onClick: () => void this.readReference(metric.referenceId), children: [
                    String(metric.value),
                    " ",
                    metric.unit
                  ] })
                ] }, metric.name)) })
              ] }, run.runId))
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6587\u7A3F\u4E0E\u56FE\u5F62\u6765\u6E90" }),
              report.publications?.length ? report.publications.map((p) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
                /* @__PURE__ */ jsx("h3", { children: p.title }),
                /* @__PURE__ */ jsxs("p", { children: [
                  "\u4FEE\u8BA2 ",
                  short(p.revisionId),
                  " \xB7 \u6784\u5EFA ",
                  short(p.jobId),
                  " \xB7 ",
                  p.pages,
                  " \u9875"
                ] }),
                /* @__PURE__ */ jsxs("code", { className: "digest", children: [
                  "\u6E90\u7801 ",
                  p.sourceDigest
                ] }),
                /* @__PURE__ */ jsxs("code", { className: "digest", children: [
                  "PDF ",
                  p.pdfDigest
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
                  /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: report.integrity !== "verified", onClick: () => this.openPublication(p.resultId), children: "\u56DE\u67E5\u56FA\u5B9A\u6587\u7A3F\u4E0E PDF" }),
                  /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.readReference(p.referenceId), children: "\u8BFB\u53D6\u56FA\u5B9A\u6784\u5EFA\u6765\u6E90" })
                ] })
              ] }, p.resultId)) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u62A5\u544A\u672A\u7EB3\u5165\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA\u3002" }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u56FE\u5F62\u751F\u6210\u6E90\u7801\u3001\u8F93\u5165\u6570\u636E\u4E0E\u540C\u4F5C\u4E1A\u8F93\u51FA\u6309\u4E0B\u65B9\u56FA\u5B9A\u5F15\u7528\u56DE\u67E5\uFF1B\u5DF2\u77E5\u751F\u6210\u5173\u7CFB\u4E0D\u4EE3\u8868\u9010\u70B9\u6570\u503C\u9A8C\u8BC1\u3002" })
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u8BBA\u6587\u5BA1\u67E5\u5FEB\u7167" }),
              report.publicationReviews ? report.publicationReviews.map((group) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
                /* @__PURE__ */ jsxs("h3", { children: [
                  "\u6784\u5EFA\u7ED3\u679C ",
                  short(group.resultId)
                ] }),
                !group.reviewIds.length ? /* @__PURE__ */ jsx("p", { children: "\u672A\u5BA1\u67E5" }) : null,
                group.reviews.map((review) => /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h4", { children: [
                    "\u5BA1\u67E5 ",
                    short(review.id)
                  ] }),
                  /* @__PURE__ */ jsxs("p", { children: [
                    "\u62A5\u544A\u751F\u6210\u65F6\uFF1A",
                    publicationReviewStatus(review.status),
                    " \xB7 ",
                    review.validity === "current" ? "\u5F53\u65F6\u6709\u6548" : "\u5F53\u65F6\u5DF2\u5931\u6548",
                    " \xB7 \u8BBA\u6587\u610F\u89C1\uFF1A",
                    review.verdict ?? "\u5C1A\u65E0\u56FA\u5B9A\u5BA1\u67E5\u610F\u89C1"
                  ] }),
                  review.summary ? /* @__PURE__ */ jsx("pre", { className: "document-preview", children: review.summary }) : null,
                  /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FD9\u662F\u62A5\u544A\u751F\u6210\u65F6\u7684\u56FA\u5B9A\u5FEB\u7167\uFF1B\u5F53\u524D\u6709\u6548\u6027\u89C1\u62A5\u544A\u6838\u9A8C\u72B6\u6001\uFF0C\u56DE\u67E5\u53EF\u6838\u9A8C\u5F53\u524D\u5BA1\u67E5\u3002" }),
                  /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.readReference(review.referenceId), children: "\u8BFB\u53D6\u56FA\u5B9A\u5BA1\u67E5\u8BB0\u5F55" }),
                  /* @__PURE__ */ jsx("button", { className: "secondary", disabled: report.integrity !== "verified" || s.checking || !!s.verificationError, onClick: () => this.openPublicationReview(group.resultId, review.id), children: "\u56DE\u67E5\u6B64\u6784\u5EFA\u4E0E\u5BA1\u67E5" })
                ] }, review.id))
              ] }, group.resultId)) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u65E7\u62A5\u544A\u672A\u8BB0\u5F55\u8BBA\u6587\u5BA1\u67E5\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u5B9A\u5DF2\u901A\u8FC7\u3002" })
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u7ED1\u5B9A\u7684\u8BC1\u636E\u4E0E\u6765\u6E90" }),
              report.references.length ? /* @__PURE__ */ jsx("ul", { children: report.references.map((ref) => /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsx("button", { className: "text-button", disabled: !Object.prototype.hasOwnProperty.call(referenceTypes, ref.type), onClick: () => void this.readReference(ref.id), children: ref.label }),
                /* @__PURE__ */ jsxs("small", { children: [
                  " \xB7 ",
                  referenceTypes[ref.type] ?? "\u672A\u77E5\u5F15\u7528\u7C7B\u578B",
                  ref.relation === "ancestry" ? " \xB7 \u7956\u5148\u6765\u6E90\uFF08\u975E\u5F53\u524D\u6E90\u7801\uFF09" : ref.relation === "exact" ? " \xB7 \u7CBE\u786E\u7ED1\u5B9A" : ""
                ] })
              ] }, ref.id)) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u5386\u53F2\u62A5\u544A\u6CA1\u6709\u53EF\u6838\u9A8C\u7684\u56FA\u5B9A\u5F15\u7528\u6E05\u5355\uFF1B\u4FDD\u7559\u539F\u6587\u4E2D\u7684 ID\u3002" })
            ] }),
            s.reference ? /* @__PURE__ */ jsxs("section", { className: "inspector-section", "aria-label": "\u7ED1\u5B9A\u8BC1\u636E\u9884\u89C8", children: [
              /* @__PURE__ */ jsx("h3", { children: s.reference.label }),
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                referenceTypes[s.reference.type],
                " \xB7 ",
                s.reference.path ?? s.reference.targetId
              ] }),
              s.reference.digest ? /* @__PURE__ */ jsx("code", { className: "digest", children: s.reference.digest }) : null,
              s.referenceError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.referenceError }) : null,
              s.reference.type === "artifact" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: report.integrity !== "verified" || s.checking || !!s.verificationError || !report.references.some((ref) => sameReference(ref, s.reference)), onClick: () => void this.downloadReference(), children: "\u4E0B\u8F7D\u56FA\u5B9A\u539F\u59CB\u4EA7\u7269" }) : null,
              s.reference.document ? /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                  "\u7269\u7406\u9875 ",
                  s.reference.document.pageNumber,
                  " \xB7 \u9875\u6807\u7B7E ",
                  s.reference.document.pageLabel ?? "\u672A\u77E5",
                  " \xB7 UTF-16 [",
                  s.reference.document.start,
                  ", ",
                  s.reference.document.end,
                  ")"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
                  /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !this.documentReference() || !this.props.onDocument, onClick: () => this.openDocument(), children: "\u56DE\u5230\u56FA\u5B9A\u9875\u6BB5" }),
                  /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !this.documentReference(), onClick: () => void this.downloadDocument("raw"), children: "\u4E0B\u8F7D\u539F\u4EF6 PDF" }),
                  /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !this.documentReference(), onClick: () => void this.downloadDocument("image"), children: "\u4E0B\u8F7D\u5F15\u7528\u9875 PNG" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6765\u6E90\u3001\u7248\u672C\u3001\u8BB8\u53EF\u548C\u89E3\u6790\u8D28\u91CF\u89C1\u4E0B\u65B9\u56FA\u5B9A\u8BB0\u5F55\uFF1B\u8BB8\u53EF\u672A\u77E5\u4E0D\u4EE3\u8868\u83B7\u5F97\u518D\u5206\u53D1\u8BB8\u53EF\u3002" })
              ] }) : null,
              /* @__PURE__ */ jsx("pre", { className: "document-preview", children: s.content || (s.reading ? "\u8BFB\u53D6\u56FA\u5B9A\u5185\u5BB9\u2026" : "\uFF08\u7A7A\u5185\u5BB9\uFF09") }),
              /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.reading || s.complete, onClick: () => void this.readReference(s.reference.id, true), children: s.reading ? "\u8BFB\u53D6\u4E2D\u2026" : s.complete ? "\u5DF2\u5B8C\u6574\u8BFB\u53D6" : "\u8BFB\u53D6\u540E\u7EED\u5185\u5BB9" })
            ] }) : null,
            providerText ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                "\u56FA\u5B9A PMC OA \u5168\u6587 ",
                providerText.reportedVersion,
                " \xB7 \u65E0 PDF \u9875\u7801 \xB7 UTF-16 [",
                providerText.start,
                ", ",
                providerText.end,
                ")"
              ] }),
              /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !this.props.onDocument, onClick: () => this.openProviderText(), children: "\u56DE\u5230\u56FA\u5B9A PMC \u6587\u6863" }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8BB8\u53EF\u4E0E XML/\u6587\u672C\u6458\u8981\u4FDD\u7559\u5728\u56FA\u5B9A\u5F15\u7528\u548C\u6587\u6863\u8BB0\u5F55\u4E2D\uFF1B\u672C\u5730\u6253\u5305\u4E0D\u6388\u4E88\u518D\u5206\u53D1\u8BB8\u53EF\u3002" })
            ] }) : null,
            /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u539F\u59CB Markdown\uFF08\u7EAF\u6587\u672C\uFF09" }),
              /* @__PURE__ */ jsx("pre", { className: "document-preview", children: s.body })
            ] })
          ] }) : !s.loading && !s.error ? /* @__PURE__ */ jsx(Empty, { title: "\u9009\u62E9\u62A5\u544A\u56DE\u67E5\u8BC1\u636E", children: /* @__PURE__ */ jsx("p", { children: "\u6B63\u6587\u3001\u4EE3\u7801\u548C URL \u5747\u6309\u7EAF\u6587\u672C\u5C55\u793A\uFF0C\u5F15\u7528\u53EA\u8BFB\u53D6\u62A5\u544A\u4E2D\u5DF2\u7ED1\u5B9A\u7684\u8BB0\u5F55\u3002" }) }) : null
        ] })
      ] })
    ] });
  }
}
export {
  ReportsView
};
