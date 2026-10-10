import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { nativeSelectButton } from "./ui.js";
import { api } from "./api.js";
import { short, label } from "./models.js";
function publicationReviewStatus(status) {
  return status === "passed" ? "\u5BA1\u67E5\u901A\u8FC7" : label(status);
}
class PublicationReviewPanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { reviews: [], rootSessionId: "", inputEvidenceIds: [], busy: false, loading: false, loaded: false, error: "" };
    this.mounted = true;
    this.epoch = 0;
    this.preparationEpoch = 0;
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  componentDidMount() {
    void this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.preparationEpoch++;
  }
  componentDidUpdate(prev) {
    if (prev.result.id !== this.props.result.id || prev.data.project.id !== this.props.data.project.id) {
      this.epoch++;
      this.preparationEpoch++;
      this.setState({ reviews: [], rootSessionId: "", inputEvidenceIds: [], busy: false, loaded: false, error: "" });
      void this.refresh();
    } else if (prev.data !== this.props.data || prev.selectedReviewId !== this.props.selectedReviewId) void this.refresh();
  }
  matches(review) {
    const r = this.props.result;
    return review.publicationResultId === r.id && review.revisionId === r.revisionId && review.jobId === r.jobId && review.sourceDigest === r.sourceDigest && review.pdfDigest === r.pdf?.digest;
  }
  async refresh() {
    const epoch = ++this.epoch;
    this.setState({ loading: true, error: "" });
    try {
      const reviews = await this.call("publication_review_list", { resultId: this.props.result.id });
      if (!this.mounted || epoch !== this.epoch) return;
      if (!Array.isArray(reviews) || reviews.some((r) => !this.matches(r))) throw Error("\u5BA1\u67E5\u8BB0\u5F55\u4E0E\u6240\u9009\u56FA\u5B9A\u6784\u5EFA\u4E0D\u4E00\u81F4\u3002");
      this.setState({ reviews, loaded: true });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: String(error), loaded: false });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ loading: false });
    }
  }
  async prepare() {
    const { data, result } = this.props, s = this.state, session = data.sessions.find((row) => row.id === s.rootSessionId && row.role === "coordinator" && !row.taskId && !row.parentSessionId && row.state !== "archived");
    if (this.props.readOnly || data.project.archived || !this.props.ready || s.busy || !session || s.inputEvidenceIds.some((id) => !data.evidence.some((e) => e.id === id))) return;
    const epoch = ++this.preparationEpoch;
    this.epoch++;
    this.setState({ busy: true, loading: false, error: "" });
    try {
      await this.props.perform(async () => {
        const review = await this.call("publication_review_prepare", { resultId: result.id, rootSessionId: session.id, ...s.inputEvidenceIds.length ? { inputEvidenceIds: s.inputEvidenceIds } : {} });
        if (!this.mounted || epoch !== this.preparationEpoch) return;
        if (!this.matches(review)) throw Error("\u51C6\u5907\u7684\u5BA1\u67E5\u672A\u7ED1\u5B9A\u6240\u9009\u6784\u5EFA\u3002");
        this.epoch++;
        this.setState({ loading: false, reviews: [...this.state.reviews.filter((r) => r.id !== review.id), review], loaded: true });
      });
    } catch (error) {
      if (this.mounted && epoch === this.preparationEpoch) this.setState({ error: String(error) });
    } finally {
      if (this.mounted && epoch === this.preparationEpoch) this.setState({ busy: false });
    }
  }
  render() {
    const s = this.state, { data, result } = this.props, roots = (data.sessions ?? []).filter((row) => row.role === "coordinator" && !row.taskId && !row.parentSessionId && row.state !== "archived");
    return /* @__PURE__ */ jsxs("section", { className: "inspector-section", "aria-label": "\u56FA\u5B9A\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5", children: [
      /* @__PURE__ */ jsx("h3", { children: "\u56FA\u5B9A\u8BBA\u6587\u72EC\u7ACB\u5BA1\u67E5" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5BA1\u67E5\u53EA\u9488\u5BF9\u6B64\u6784\u5EFA\u7684\u56FA\u5B9A\u6587\u672C\u3001\u7F16\u8BD1\u65E5\u5FD7\u4E0E\u8BC1\u636E\uFF1B\u4E0D\u4EE3\u8868\u6A21\u578B\u89C6\u89C9\u68C0\u67E5\u4E86 PDF\u3002\u666E\u901A reviewer \u4F1A\u8BDD\u4E0D\u4F1A\u81EA\u52A8\u4F5C\u4E3A\u8BBA\u6587\u5BA1\u67E5\u3002" }),
      /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
        "\u7ED3\u679C ",
        result.id,
        " \xB7 \u4FEE\u8BA2 ",
        result.revisionId,
        " \xB7 \u6784\u5EFA ",
        result.jobId
      ] }),
      /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
        "\u6E90\u7801 ",
        result.sourceDigest
      ] }),
      /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
        "PDF ",
        result.pdf?.digest ?? "\u65E0 PDF"
      ] }),
      !this.props.readOnly && !data.project.archived ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          void this.prepare();
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BBA\u6587\u5BA1\u67E5\u4E3B\u534F\u8C03\u4F1A\u8BDD",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u8BBA\u6587\u5BA1\u67E5\u4E3B\u534F\u8C03\u4F1A\u8BDD", value: s.rootSessionId, disabled: s.busy, onChange: (e) => this.setState({ rootSessionId: e.target.value }), children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4E3B\u534F\u8C03\u4F1A\u8BDD" }),
              roots.map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
                row.title,
                " \xB7 ",
                short(row.id)
              ] }, row.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u663E\u5F0F\u9644\u52A0\u9879\u76EE\u8BC1\u636E\uFF08\u53EF\u9009\uFF09" }),
            (data.evidence ?? []).map((evidence) => /* @__PURE__ */ jsxs("label", { className: "checkbox-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: s.busy, checked: s.inputEvidenceIds.includes(evidence.id), onChange: (e) => this.setState({ inputEvidenceIds: e.target.checked ? [...s.inputEvidenceIds, evidence.id] : s.inputEvidenceIds.filter((id) => id !== evidence.id) }) }),
              evidence.description,
              " \xB7 ",
              short(evidence.id)
            ] }, evidence.id))
          ] }),
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: data.project.archived || !this.props.ready || s.busy || !roots.some((r) => r.id === s.rootSessionId), children: "\u51C6\u5907\u6B64\u56FA\u5B9A\u8BBA\u6587\u5BA1\u67E5" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u51C6\u5907\u4EC5\u521B\u5EFA\u5F85\u6279\u51C6\u56E2\u961F\u8BA1\u5212\uFF0C\u4E0D\u4F1A\u6279\u51C6\u6216\u8C03\u7528\u6A21\u578B\u3002\u968F\u540E\u6253\u5F00\u5BF9\u5E94\u4E3B\u4F1A\u8BDD\uFF0C\u5728\u56E2\u961F\u8BA1\u5212\u4E2D\u5355\u72EC\u6279\u51C6\u3002" })
      ] }) : null,
      /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.busy || s.loading, onClick: () => void this.refresh(), children: "\u5237\u65B0\u5168\u90E8\u8BBA\u6587\u5BA1\u67E5" }),
      s.loading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u6838\u9A8C\u8BBA\u6587\u5BA1\u67E5\u2026" }) : null,
      s.error ? /* @__PURE__ */ jsxs("p", { role: "alert", className: "error-text", children: [
        s.error,
        "\uFF1B\u5F53\u524D\u6838\u9A8C\u672A\u5B8C\u6210\uFF0C\u4FDD\u7559\u8BB0\u5F55\u4EC5\u4F9B\u56DE\u67E5\u3002"
      ] }) : null,
      s.loaded && !s.reviews.length ? /* @__PURE__ */ jsx("p", { children: "\u672A\u5BA1\u67E5" }) : null,
      s.loaded && this.props.selectedReviewId && !s.reviews.some((r) => r.id === this.props.selectedReviewId) ? /* @__PURE__ */ jsx("p", { role: "alert", children: "\u6307\u5B9A\u5BA1\u67E5\u4E0D\u5728\u6B64\u56FA\u5B9A\u6784\u5EFA\u4E2D\uFF1B\u672A\u66FF\u6362\u4E3A\u5176\u4ED6\u5BA1\u67E5\u3002" }) : null,
      s.reviews.map((review) => {
        const task = data.tasks?.find((t) => t.id === review.taskId);
        return /* @__PURE__ */ jsxs("div", { className: "inspector-section", "aria-label": `\u8BBA\u6587\u5BA1\u67E5 ${review.id}`, children: [
          /* @__PURE__ */ jsxs("h4", { children: [
            review.id === this.props.selectedReviewId ? "\u6240\u9009\u56FA\u5B9A\u5BA1\u67E5 \xB7 " : "",
            short(review.id)
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u5BA1\u67E5\u72B6\u6001\uFF1A",
            publicationReviewStatus(review.status),
            " \xB7 \u6700\u8FD1\u6838\u9A8C\u6709\u6548\u6027\uFF1A",
            review.validity === "current" ? "\u5F53\u524D\u6709\u6548" : "\u5DF2\u5931\u6548"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u4EFB\u52A1\u9A8C\u6536\uFF1A",
            task ? label(task.acceptance) : "\u5C1A\u65E0\u4EFB\u52A1\u9A8C\u6536\u8BB0\u5F55",
            "\uFF1B\u4EFB\u52A1\u9A8C\u6536\u4E0E\u8BBA\u6587\u5BA1\u67E5\u610F\u89C1\u5206\u522B\u8BB0\u5F55\u3002"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u8BBA\u6587\u610F\u89C1\uFF1A",
            review.verdict ?? "\u5C1A\u65E0\u56FA\u5B9A\u5BA1\u67E5\u610F\u89C1"
          ] }),
          review.summary ? /* @__PURE__ */ jsx("pre", { className: "document-preview", children: review.summary }) : null,
          review.reason ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: review.reason }) : null,
          /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
            "\u5BA1\u67E5 ",
            review.id,
            " \xB7 \u56E2\u961F ",
            review.teamId,
            " \xB7 \u4EFB\u52A1 ",
            review.taskId,
            " \xB7 \u6279\u51C6 ",
            review.approvalId
          ] }),
          /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
            "\u5BA1\u67E5\u7ED1\u5B9A\u6458\u8981 ",
            review.digest
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u5FC5\u9700\u8BC1\u636E\uFF1A",
            review.requiredEvidenceIds.join("\u3001")
          ] }),
          this.props.onSession ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => this.props.onSession?.(review.rootSessionId), children: this.props.readOnly || data.project.archived ? "\u67E5\u770B\u4E3B\u4F1A\u8BDD" : "\u6253\u5F00\u4E3B\u4F1A\u8BDD\u4E0E\u56E2\u961F\u6279\u51C6" }) : /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u5728\u5DE6\u4FA7\u4F1A\u8BDD\u5217\u8868\u6253\u5F00\u4E3B\u4F1A\u8BDD ",
            data.sessions?.find((row) => row.id === review.rootSessionId)?.title ?? review.rootSessionId,
            "\uFF0C\u67E5\u770B\u56E2\u961F\u8BA1\u5212\u4E0E\u6279\u51C6\u3002"
          ] })
        ] }, review.id);
      })
    ] });
  }
}
export {
  PublicationReviewPanel,
  publicationReviewStatus
};
