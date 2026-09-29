import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactText } from "./api.js";
import { short } from "./models.js";
const pair = (value) => `${value.documentVersionId}:${value.parseResultId}`;
class TextEvidencePanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: null, selectedDocuments: null, query: "", mmrLambda: 1, result: null, loading: false, sourcePreview: "" };
  }
  render() {
    const { data, perform } = this.props;
    const config = data.textEvidence ?? { enabled: false, version: 0, sources: [] };
    const eligible = data.artifacts.filter((a) => a.origin === "user" && !a.taskId && !a.runId && !a.wakeupId && ["text/plain", "text/markdown"].includes(a.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(a.title));
    const saved = config.sources.map((s) => s.artifactId);
    const savedDocuments = (config.documents ?? []).map(({ documentVersionId, parseResultId }) => ({ documentVersionId, parseResultId }));
    const parsed = (data.documentParseJobs ?? []).filter((job) => job.state === "succeeded" && job.integrity === "complete" && job.resultId).map((job) => ({ documentVersionId: job.documentVersionId, parseResultId: job.resultId, title: (data.documents ?? []).find((d) => d.id === job.documentVersionId && d.contentKind === "original-pdf")?.title })).filter((value) => !!value.title);
    const selected = this.state.selected ?? saved;
    const selectedDocuments = this.state.selectedDocuments ?? savedDocuments;
    const selectionChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort()) || JSON.stringify(selectedDocuments.map(pair).sort()) !== JSON.stringify(savedDocuments.map(pair).sort());
    const history = data.textEvidenceSearches ?? [];
    const result = this.state.result ?? history[0] ?? null, stale = result && (result.configurationVersion !== config.version || !config.enabled);
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u672C\u5730\u539F\u6587\u68C0\u7D22 \xB7 \u8BD5\u9A8C\u529F\u80FD" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: config.enabled ? "\u5DF2\u542F\u7528" : "\u9ED8\u8BA4\u5173\u95ED" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u5730\u8BCD\u9879\u8BC4\u5206\u4E0E\u7CBE\u786E\u91CD\u590D\u5206\u7EC4\uFF1BPaperQA MMR \u9009\u62E9\u6D41\u7A0B\u53EF\u9009\uFF0C\u9ED8\u8BA4\u4E0D\u542F\u7528\uFF1B\u4E0D\u8C03\u7528\u6A21\u578B\u3001\u4E0D\u8054\u7F51\u3001\u4E0D\u751F\u6210\u6458\u8981\u6216\u7B54\u6848\u3002\u4EC5\u5904\u7406\u663E\u5F0F\u9009\u5B9A\u7684\u7528\u6237\u6587\u672C\u6216\u5DF2\u6279\u51C6\u89E3\u6790\u7684\u56FA\u5B9A PDF\uFF1B\u4E0D\u662F OCR\u3001\u8BED\u4E49\u95EE\u7B54\u6216\u5B8C\u6574 PaperQA\uFF0C\u4E0D\u8BC1\u660E\u79D1\u5B66\u7ED3\u8BBA\u3002" }),
      /* @__PURE__ */ jsxs("details", { open: !config.enabled, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u9009\u62E9\u5141\u8BB8\u68C0\u7D22\u7684\u539F\u6587\uFF08\u6587\u672C\u6587\u4EF6\u6216\u56FA\u5B9A PDF\uFF0C\u6700\u591A 30 \u4EFD\uFF09" }),
        !eligible.length && !parsed.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5148\u5BFC\u5165 UTF-8 \u6587\u672C\uFF0C\u6216\u5B8C\u6210\u56FA\u5B9A PDF \u7684\u6279\u51C6\u89E3\u6790\u3002\u6A21\u578B\u4EA7\u7269\u4E0D\u4F1A\u52A0\u5165\u539F\u6587\u96C6\u5408\u3002" }) : null,
        /* @__PURE__ */ jsxs("div", { className: "run-selection", children: [
          eligible.map((a) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selected.includes(a.id), disabled: this.state.loading, onChange: (e) => this.setState({ selected: e.target.checked ? [...selected, a.id] : selected.filter((id) => id !== a.id), result: null }) }),
            /* @__PURE__ */ jsxs("span", { children: [
              a.title,
              /* @__PURE__ */ jsx("small", { children: short(a.id) })
            ] })
          ] }, a.id)),
          parsed.map((d) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selectedDocuments.some((value) => pair(value) === pair(d)), disabled: this.state.loading, onChange: (e) => this.setState({ selectedDocuments: e.target.checked ? [...selectedDocuments, { documentVersionId: d.documentVersionId, parseResultId: d.parseResultId }] : selectedDocuments.filter((value) => pair(value) !== pair(d)), result: null }) }),
            /* @__PURE__ */ jsxs("span", { children: [
              d.title,
              /* @__PURE__ */ jsxs("small", { children: [
                "\u56FA\u5B9A PDF \xB7 \u89E3\u6790 ",
                short(d.parseResultId)
              ] })
            ] })
          ] }, pair(d)))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !(selected.length + selectedDocuments.length) || this.state.loading, onClick: () => perform(async () => {
            await api(`/projects/${data.project.id}/text-evidence`, { enabled: true, artifactIds: selected, documents: selectedDocuments, expectedVersion: config.version });
            this.setState({ selected: null, selectedDocuments: null, result: null });
          }, "\u5DF2\u4FDD\u5B58\u56FA\u5B9A\u539F\u6587\u8303\u56F4\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u8C03\u7528\u6A21\u578B"), children: "\u4FDD\u5B58\u8303\u56F4\u5E76\u542F\u7528" }),
          config.enabled ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading, onClick: () => perform(async () => {
            await api(`/projects/${data.project.id}/text-evidence`, { enabled: false, expectedVersion: config.version });
            this.setState({ result: null });
          }, "\u5DF2\u5173\u95ED\u68C0\u7D22\uFF0C\u5386\u53F2\u6587\u4EF6\u4E0E\u5F15\u7528\u4FDD\u7559"), children: "\u5173\u95ED\u68C0\u7D22" }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "search-panel", onSubmit: (e) => {
        e.preventDefault();
        this.setState({ loading: true });
        void perform(async () => {
          const response = await api("/text-evidence-search", { projectId: data.project.id, query: this.state.query, artifactIds: saved, ...savedDocuments.length ? { documents: savedDocuments, corpusId: config.corpusId, configurationVersion: config.version } : {}, limit: 5, mmrLambda: this.state.mmrLambda });
          this.setState({ result: response, sourcePreview: "" });
        }).finally(() => this.setState({ loading: false }));
      }, children: [
        /* @__PURE__ */ jsx("input", { "aria-label": "\u672C\u5730\u539F\u6587\u5173\u952E\u8BCD", placeholder: "\u8F93\u5165\u5173\u952E\u8BCD\uFF1B\u4E2D\u6587\u53EF\u4F7F\u7528\u77ED\u8BED", value: this.state.query, disabled: this.state.loading, onChange: (e) => this.setState({ query: e.target.value }) }),
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u68C0\u7D22\u6392\u5E8F\u7B56\u7565", value: this.state.mmrLambda, disabled: this.state.loading, onChange: (e) => this.setState({ mmrLambda: Number(e.target.value), result: null }), children: [
          /* @__PURE__ */ jsx("option", { value: 1, children: "\u7CBE\u786E\u53BB\u91CD\uFF0B\u76F8\u5173\u6027\uFF08\u9ED8\u8BA4\uFF09" }),
          /* @__PURE__ */ jsx("option", { value: 0.65, children: "\u7CBE\u786E\u53BB\u91CD\uFF0BMMR 0.65\uFF08\u8BD5\u9A8C\uFF09" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: !config.enabled || selectionChanged || !this.state.query.trim() || this.state.loading, children: this.state.loading ? "\u68C0\u7D22\u4E2D\u2026" : "\u67E5\u627E\u539F\u6587" })
      ] }),
      selectionChanged ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6587\u6863\u9009\u62E9\u5DF2\u6539\u53D8\uFF0C\u8BF7\u5148\u4FDD\u5B58\u8303\u56F4\u3002" }) : null,
      history.length ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u5386\u53F2\u68C0\u7D22\uFF08\u6700\u8FD1 ",
          history.length,
          " \u6761\uFF0C\u5173\u95ED\u540E\u4ECD\u53EF\u8BFB\uFF09"
        ] }),
        history.map((item) => /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => this.setState({ result: item, sourcePreview: "" }), children: [
          item.query,
          " \xB7 ",
          item.hits.length,
          " \u4E2A\u7247\u6BB5 \xB7 ",
          short(item.id)
        ] }, item.id))
      ] }) : null,
      stale ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u96C6\u5408\u5DF2\u53D8\u66F4\u6216\u529F\u80FD\u5DF2\u5173\u95ED\uFF1B\u4E0B\u65B9\u662F\u5386\u53F2\u67E5\u8BE2\uFF0C\u8BF7\u91CD\u65B0\u68C0\u7D22\u3002" }) : null,
      result ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", children: result.status === "no_lexical_match" ? "\u672A\u627E\u5230\u8BCD\u9879\u5339\u914D\uFF1B\u4E0D\u8868\u793A\u6587\u732E\u4E2D\u6CA1\u6709\u7B54\u6848\u3002" : `\u8FD4\u56DE ${result.hits.length} \u4E2A\u539F\u6587\u7247\u6BB5\u3002\u76F8\u5173\u6027\u4E0D\u662F\u79D1\u5B66\u6B63\u786E\u6027\u3002` }),
        result.coverage ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5DF2\u641C\u7D22\u9009\u5B9A ",
          result.coverage.sourceCount,
          " \u4EFD\u539F\u6587 / ",
          result.coverage.totalChunks,
          " \u4E2A\u5206\u5757\uFF1B",
          result.coverage.matchingChunks,
          " \u4E2A\u8BCD\u9879\u5339\u914D\uFF1B\u5408\u5E76 ",
          result.coverage.exactDuplicatesGrouped,
          " \u4E2A\u76F8\u540C\u7247\u6BB5\u5E76\u4FDD\u7559\u5176\u4ED6\u6765\u6E90\u3002",
          result.coverage.resultsTruncated ? "\u5F53\u524D\u5C55\u793A\u53D7\u6570\u91CF\u9650\u5236\uFF0C\u53EF\u7F29\u5C0F\u67E5\u8BE2\u6216\u589E\u5927\u63A5\u53E3 limit\uFF08\u6700\u591A10\uFF09\u3002" : ""
        ] }) : null,
        result.hits.map((h) => /* @__PURE__ */ jsxs("article", { className: "inspector-section", children: [
          /* @__PURE__ */ jsx("h3", { children: h.title }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            h.document ? `\u56FA\u5B9A PDF \u7269\u7406\u7B2C ${h.page} \u9875` : `\u539F\u6587\u4EF6\u7B2C ${h.lineStart}\u2013${h.lineEnd} \u884C \xB7 \u65E0 PDF \u9875\u7801`,
            " \xB7 UTF-16 \u533A\u95F4 [",
            h.locator.start,
            ", ",
            h.locator.end,
            ")"
          ] }),
          /* @__PURE__ */ jsx("pre", { className: "document-preview", children: h.quote }),
          h.alternativeSources?.length ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u76F8\u540C\u539F\u6587\u8FD8\u51FA\u73B0\u4E8E\uFF1A",
            h.alternativeSources.map((a) => `${a.title}\uFF08${a.document ? `PDF \u7B2C ${a.page} \u9875` : `\u884C${a.lineStart}\u2013${a.lineEnd}`}\uFF09`).join("\uFF1B"),
            "\u3002\u526F\u672C\u4E0D\u8BA1\u4E3A\u65B0\u7684\u72EC\u7ACB\u652F\u6301\u3002"
          ] }) : null,
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u8BC1\u636E ",
            /* @__PURE__ */ jsx("code", { children: h.evidenceId }),
            " \xB7 \u6E90\u6458\u8981 ",
            /* @__PURE__ */ jsx("code", { children: short(h.digest) })
          ] }),
          h.document ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onDocument?.({ documentVersionId: h.document.documentVersionId, parseResultId: h.document.parseResultId, pageNumber: h.page, start: h.locator.start, end: h.locator.end }), children: "\u8FD4\u56DE\u56FA\u5B9A PDF \u539F\u9875" }) : /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(async () => this.setState({ sourcePreview: await artifactText(h.artifactId) })), children: "\u8BFB\u53D6\u5BF9\u5E94\u539F\u6587\u4EF6" })
        ] }, h.chunkId)),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: result.limitations.join(" ") })
      ] }) : null,
      this.state.sourcePreview ? /* @__PURE__ */ jsxs("details", { open: true, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u539F\u6587\u4EF6\u6587\u672C\uFF08\u4E0D\u662F\u6A21\u578B\u6458\u8981\uFF09" }),
        /* @__PURE__ */ jsx("pre", { className: "file-preview", children: this.state.sourcePreview })
      ] }) : null
    ] });
  }
}
export {
  TextEvidencePanel
};
