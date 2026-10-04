import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { nativeSelectButton } from "./ui.js";
import { api, artifactText } from "./api.js";
import { short } from "./models.js";
const pair = (value) => `${value.documentVersionId}:${value.parseResultId}`;
class TextEvidencePanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: null, selectedDocuments: null, selectedPmcDocuments: null, query: "", mmrLambda: 1, result: null, loading: false, sourcePreview: "" };
  }
  render() {
    const { data, perform } = this.props;
    const config = data.textEvidence ?? { enabled: false, version: 0, sources: [], documents: [], pmcDocuments: [] };
    const eligible = data.artifacts.filter((a) => a.origin === "user" && !a.taskId && !a.runId && !a.wakeupId && ["text/plain", "text/markdown"].includes(a.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(a.title));
    const saved = config.sources.map((s) => s.artifactId);
    const savedDocuments = (config.documents ?? []).map(({ documentVersionId, parseResultId }) => ({ documentVersionId, parseResultId }));
    const savedPmcDocuments = (config.pmcDocuments ?? []).map(({ documentVersionId }) => documentVersionId);
    const pmcDocuments = [...new Map([...config.pmcDocuments ?? [], ...(data.documents ?? []).filter((d) => d.contentKind === "provider-text" && d.source.provider === "pubmed" && /^PMC[1-9]\d*\.[1-9]\d*$/.test(d.source.reportedVersion ?? "") && d.original.mediaType === "application/xml" && !!d.derivedText && d.license.assurance === "provider-reported" && !!d.license.value).map((d) => ({ documentVersionId: d.id, title: d.title, reportedVersion: d.source.reportedVersion }))].map((d) => [d.documentVersionId, d])).values()];
    const parsed = (data.documentParseJobs ?? []).filter((job) => job.state === "succeeded" && job.integrity === "complete" && job.resultId).map((job) => ({ documentVersionId: job.documentVersionId, parseResultId: job.resultId, title: (data.documents ?? []).find((d) => d.id === job.documentVersionId && d.contentKind === "original-pdf")?.title })).filter((value) => !!value.title);
    const selected = this.state.selected ?? saved;
    const selectedDocuments = this.state.selectedDocuments ?? savedDocuments;
    const selectedPmcDocuments = this.state.selectedPmcDocuments ?? savedPmcDocuments;
    const selectionChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort()) || JSON.stringify(selectedDocuments.map(pair).sort()) !== JSON.stringify(savedDocuments.map(pair).sort()) || JSON.stringify([...selectedPmcDocuments].sort()) !== JSON.stringify([...savedPmcDocuments].sort());
    const history = data.textEvidenceSearches ?? [];
    const result = this.state.result ?? history[0] ?? null, stale = result && (result.configurationVersion !== config.version || !config.enabled);
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u672C\u5730\u539F\u6587\u68C0\u7D22 \xB7 \u8BD5\u9A8C\u529F\u80FD" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: config.enabled ? "\u5DF2\u542F\u7528" : "\u9ED8\u8BA4\u5173\u95ED" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u5730\u8BCD\u9879\u8BC4\u5206\u4E0E\u7CBE\u786E\u91CD\u590D\u5206\u7EC4\uFF1BPaperQA MMR \u9009\u62E9\u6D41\u7A0B\u53EF\u9009\uFF0C\u9ED8\u8BA4\u4E0D\u542F\u7528\uFF1B\u4E0D\u8C03\u7528\u6A21\u578B\u3001\u4E0D\u8054\u7F51\u3001\u4E0D\u751F\u6210\u6458\u8981\u6216\u7B54\u6848\u3002\u4EC5\u5904\u7406\u663E\u5F0F\u9009\u5B9A\u7684\u7528\u6237\u6587\u672C\u3001\u5DF2\u6279\u51C6\u89E3\u6790\u7684\u56FA\u5B9A PDF \u6216 PMC OA \u5168\u6587\u6D3E\u751F\u6587\u672C\uFF1B\u4E0D\u662F OCR\u3001\u8BED\u4E49\u95EE\u7B54\u6216\u5B8C\u6574 PaperQA\uFF0C\u4E0D\u8BC1\u660E\u79D1\u5B66\u7ED3\u8BBA\u3002" }),
      /* @__PURE__ */ jsxs("details", { open: !config.enabled, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u9009\u62E9\u5141\u8BB8\u68C0\u7D22\u7684\u539F\u6587\uFF08\u6587\u672C\u3001\u56FA\u5B9A PDF \u6216 PMC OA \u5168\u6587\uFF0C\u6700\u591A 30 \u4EFD\uFF09" }),
        !eligible.length && !parsed.length && !pmcDocuments.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5148\u5BFC\u5165 UTF-8 \u6587\u672C\u3001\u5B8C\u6210\u56FA\u5B9A PDF \u7684\u6279\u51C6\u89E3\u6790\uFF0C\u6216\u663E\u5F0F\u53D6\u5F97 PMC OA \u5168\u6587\u3002\u6A21\u578B\u4EA7\u7269\u4E0D\u4F1A\u52A0\u5165\u539F\u6587\u96C6\u5408\u3002" }) : null,
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
          ] }, pair(d))),
          pmcDocuments.map((d) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: selectedPmcDocuments.includes(d.documentVersionId), disabled: this.state.loading, onChange: (e) => this.setState({ selectedPmcDocuments: e.target.checked ? [...selectedPmcDocuments, d.documentVersionId] : selectedPmcDocuments.filter((id) => id !== d.documentVersionId), result: null }) }),
            /* @__PURE__ */ jsxs("span", { children: [
              d.title,
              /* @__PURE__ */ jsxs("small", { children: [
                "PMC OA \xB7 ",
                d.reportedVersion,
                " \xB7 \u6587\u6863 ",
                short(d.documentVersionId),
                " \xB7 \u65E0 PDF \u9875\u7801"
              ] })
            ] })
          ] }, d.documentVersionId))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !(selected.length + selectedDocuments.length + selectedPmcDocuments.length) || this.state.loading, onClick: () => perform(async () => {
            await api(`/projects/${data.project.id}/text-evidence`, { enabled: true, artifactIds: selected, documents: selectedDocuments, ...selectedPmcDocuments.length ? { pmcDocuments: selectedPmcDocuments.map((documentVersionId) => ({ documentVersionId })) } : {}, expectedVersion: config.version });
            this.setState({ selected: null, selectedDocuments: null, selectedPmcDocuments: null, result: null });
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
          const response = await api("/text-evidence-search", { projectId: data.project.id, query: this.state.query, artifactIds: saved, ...savedDocuments.length ? { documents: savedDocuments } : {}, ...savedPmcDocuments.length ? { pmcDocuments: savedPmcDocuments.map((documentVersionId) => ({ documentVersionId })) } : {}, ...savedDocuments.length || savedPmcDocuments.length ? { corpusId: config.corpusId, configurationVersion: config.version } : {}, limit: 5, mmrLambda: this.state.mmrLambda });
          this.setState({ result: response, sourcePreview: "" });
        }).finally(() => this.setState({ loading: false }));
      }, children: [
        /* @__PURE__ */ jsx("input", { "aria-label": "\u672C\u5730\u539F\u6587\u5173\u952E\u8BCD", placeholder: "\u8F93\u5165\u5173\u952E\u8BCD\uFF1B\u4E2D\u6587\u53EF\u4F7F\u7528\u77ED\u8BED", value: this.state.query, disabled: this.state.loading, onChange: (e) => this.setState({ query: e.target.value }) }),
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u68C0\u7D22\u6392\u5E8F\u7B56\u7565", value: this.state.mmrLambda, disabled: this.state.loading, onChange: (e) => this.setState({ mmrLambda: Number(e.target.value), result: null }), children: [
          nativeSelectButton,
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
            h.document ? `\u56FA\u5B9A PDF \u7269\u7406\u7B2C ${h.page} \u9875` : h.providerText ? `\u56FA\u5B9A PMC OA \u5168\u6587 ${h.providerText.reportedVersion} \xB7 \u65E0 PDF \u9875\u7801` : `\u539F\u6587\u4EF6\u7B2C ${h.lineStart}\u2013${h.lineEnd} \u884C \xB7 \u65E0 PDF \u9875\u7801`,
            " \xB7 UTF-16 \u533A\u95F4 [",
            h.locator.start,
            ", ",
            h.locator.end,
            ")"
          ] }),
          /* @__PURE__ */ jsx("pre", { className: "document-preview", children: h.quote }),
          h.alternativeSources?.length ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u76F8\u540C\u539F\u6587\u8FD8\u51FA\u73B0\u4E8E\uFF1A",
            h.alternativeSources.map((a) => `${a.title}\uFF08${a.document ? `PDF \u7B2C ${a.page} \u9875` : a.providerText ? `PMC ${a.providerText.reportedVersion} \xB7 \u65E0 PDF \u9875\u7801` : `\u884C${a.lineStart}\u2013${a.lineEnd}`}\uFF09`).join("\uFF1B"),
            "\u3002\u526F\u672C\u4E0D\u8BA1\u4E3A\u65B0\u7684\u72EC\u7ACB\u652F\u6301\u3002"
          ] }) : null,
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u8BC1\u636E ",
            /* @__PURE__ */ jsx("code", { children: h.evidenceId }),
            " \xB7 \u6E90\u6458\u8981 ",
            /* @__PURE__ */ jsx("code", { children: short(h.digest) })
          ] }),
          h.document ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onDocument?.({ documentVersionId: h.document.documentVersionId, parseResultId: h.document.parseResultId, pageNumber: h.page, start: h.locator.start, end: h.locator.end }), children: "\u8FD4\u56DE\u56FA\u5B9A PDF \u539F\u9875" }) : h.providerText ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onDocument?.({ documentVersionId: h.providerText.documentVersionId }), children: "\u8FD4\u56DE\u56FA\u5B9A PMC \u6587\u6863" }) : /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(async () => this.setState({ sourcePreview: await artifactText(h.artifactId) })), children: "\u8BFB\u53D6\u5BF9\u5E94\u539F\u6587\u4EF6" })
        ] }, h.chunkId)),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: result.limitations.join(" ") })
      ] }) : null,
      this.state.sourcePreview ? /* @__PURE__ */ jsxs("details", { open: true, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u539F\u6587\u4EF6\u6587\u672C\uFF08\u4E0D\u662F\u6A21\u578B\u6458\u8981\uFF09" }),
        /* @__PURE__ */ jsx("pre", { className: "file-preview", children: this.state.sourcePreview })
      ] }) : null,
      /* @__PURE__ */ jsx(TextCorpusGrantPanel, { data, perform, onSession: this.props.onSession })
    ] });
  }
}
const grantExpiry = () => {
  const d = new Date(Date.now() + 36e5);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};
class TextCorpusGrantPanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { sessionId: "", documents: [], pmcDocuments: [], maxSearches: 2, expiresAt: grantExpiry(), selectedId: "", error: "" };
  }
  componentDidUpdate(previous) {
    if (previous.data.project.id !== this.props.data.project.id) this.setState({ sessionId: "", documents: [], pmcDocuments: [], maxSearches: 2, expiresAt: grantExpiry(), selectedId: "", error: "" });
    else if (previous.data.textEvidence?.corpusId !== this.props.data.textEvidence?.corpusId) this.setState({ documents: [], pmcDocuments: [] });
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  prepare() {
    const { data, perform } = this.props, s = this.state, config = data.textEvidence;
    try {
      if (!config?.enabled || !config.corpusId || !s.sessionId || !s.documents.length && !s.pmcDocuments.length || s.documents.length > 0 && s.pmcDocuments.length > 0 || s.pmcDocuments.length > 1) throw Error("\u8BF7\u5148\u542F\u7528\u8BED\u6599\uFF0C\u518D\u9009\u62E9 PDF \u8303\u56F4\u6216\u4E00\u4EFD PMC \u5168\u6587\u53CA\u4E3B\u4F1A\u8BDD");
      const date = new Date(s.expiresAt), remaining = date.getTime() - Date.now();
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 864e5) throw Error("\u622A\u6B62\u65F6\u95F4\u987B\u5728\u672A\u676524\u5C0F\u65F6\u5185");
      this.setState({ error: "" });
      void perform(async () => {
        const grant = await this.call("text_corpus_grant_prepare", { sessionId: s.sessionId, documents: s.documents, ...s.pmcDocuments.length ? { pmcDocuments: s.pmcDocuments.map((documentVersionId) => ({ documentVersionId })) } : {}, corpusId: config.corpusId, configurationVersion: config.version, maxSearches: s.maxSearches, expiresAt: date.toISOString() });
        this.setState({ selectedId: grant.id });
      }, "\u56FA\u5B9A\u539F\u6587\u6388\u6743\u8349\u6848\u5DF2\u4FDD\u5B58\uFF0C\u7B49\u5F85\u5355\u72EC\u6279\u51C6");
    } catch (error) {
      this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    const { data, perform } = this.props, s = this.state, config = data.textEvidence, available = config?.documents ?? [], availablePmc = config?.pmcDocuments ?? [], grants = data.textCorpusGrants ?? [], selectedId = s.selectedId || grants[grants.length - 1]?.id || "", g = grants.find((row) => row.id === selectedId), approval = data.approvals.find((row) => row.id === g?.approvalId);
    return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
      /* @__PURE__ */ jsx("h3", { children: "\u6307\u5B9A Pi \u4F1A\u8BDD\u68C0\u7D22\u56FA\u5B9A\u539F\u6587" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53EA\u6388\u6743\u9009\u5B9A\u7684 PDF \u89E3\u6790\u9875\u6216\u4E00\u4EFD PMC OA \u5168\u6587\u3001\u6307\u5B9A\u4E3B\u4F1A\u8BDD\u548C\u6709\u9650\u6B21\u672C\u5730\u8BCD\u9879\u68C0\u7D22\uFF1B\u4E0D\u6388\u6743\u539F\u4EF6\u4E0B\u8F7D\u3001\u8054\u7F51\u3001\u8BA1\u7B97\u6216\u79D1\u5B66\u7ED3\u8BBA\u3002\u51C6\u5907\u3001\u6279\u51C6\u548C\u6FC0\u6D3B\u4E0D\u8C03\u7528\u6A21\u578B\u3002" }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u51C6\u5907\u56FA\u5B9A\u539F\u6587\u68C0\u7D22\u6388\u6743" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          this.prepare();
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6307\u5B9A\u4E3B\u534F\u8C03\u4F1A\u8BDD",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u539F\u6587\u68C0\u7D22\u6388\u6743\u4E3B\u4F1A\u8BDD", required: true, value: s.sessionId, onChange: (e) => this.setState({ sessionId: e.target.value }), children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5C1A\u672A\u7ED1\u5B9A\u539F\u6587\u6388\u6743\u7684\u4F1A\u8BDD" }),
              data.sessions.filter((row) => row.role === "coordinator" && !row.taskId && row.state !== "archived" && !row.textCorpusGrantId).map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
                row.title,
                " \xB7 ",
                short(row.id)
              ] }, row.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u56FA\u5B9A PDF \u53CA\u89E3\u6790\u7248\u672C" }),
            available.map((item) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: s.documents.some((value) => pair(value) === pair(item)), onChange: (e) => this.setState({ documents: e.target.checked ? [...s.documents, { documentVersionId: item.documentVersionId, parseResultId: item.parseResultId }] : s.documents.filter((value) => pair(value) !== pair(item)), pmcDocuments: e.target.checked ? [] : s.pmcDocuments }) }),
              item.title,
              " \xB7 ",
              short(item.documentVersionId),
              " / ",
              short(item.parseResultId)
            ] }, pair(item))),
            !available.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5F53\u524D\u8BED\u6599\u6CA1\u6709\u5DF2\u6279\u51C6\u89E3\u6790\u7684\u56FA\u5B9A PDF\u3002" }) : null
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u56FA\u5B9A PMC OA \u5168\u6587\uFF08\u53EA\u9009\u4E00\u4EFD\uFF0C\u65E0 PDF \u9875\u7801\uFF09" }),
            availablePmc.map((item) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `PMC \u6388\u6743\u6587\u6863 ${item.documentVersionId}`, checked: s.pmcDocuments.includes(item.documentVersionId), onChange: (e) => this.setState({ pmcDocuments: e.target.checked ? [item.documentVersionId] : [], documents: e.target.checked ? [] : s.documents }) }),
              item.title,
              " \xB7 ",
              item.reportedVersion
            ] }, item.documentVersionId)),
            !availablePmc.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5F53\u524D\u8BED\u6599\u6CA1\u6709\u663E\u5F0F\u9009\u5165\u7684 PMC OA \u5168\u6587\u3002" }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6700\u591A\u65B0\u68C0\u7D22\u6B21\u6570",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u539F\u6587\u6388\u6743\u68C0\u7D22\u6B21\u6570", value: s.maxSearches, onChange: (e) => this.setState({ maxSearches: Number(e.target.value) }), children: [
                nativeSelectButton,
                /* @__PURE__ */ jsx("option", { value: 1, children: "1 \u6B21" }),
                /* @__PURE__ */ jsx("option", { value: 2, children: "2 \u6B21" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF0C24\u5C0F\u65F6\u5185\uFF09",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u539F\u6587\u6388\u6743\u622A\u6B62", type: "datetime-local", required: true, value: s.expiresAt, onChange: (e) => this.setState({ expiresAt: e.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !config?.enabled || !s.sessionId || !(s.documents.length + s.pmcDocuments.length), children: "\u4FDD\u5B58\u56FA\u5B9A\u6388\u6743\u8349\u6848" })
        ] })
      ] }),
      grants.length ? /* @__PURE__ */ jsxs("label", { children: [
        "\u67E5\u770B\u56FA\u5B9A\u539F\u6587\u6388\u6743",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u67E5\u770B\u56FA\u5B9A\u539F\u6587\u6388\u6743", value: selectedId, onChange: (e) => this.setState({ selectedId: e.target.value }), children: [
          nativeSelectButton,
          grants.map((row) => /* @__PURE__ */ jsxs("option", { value: row.id, children: [
            short(row.id),
            " \xB7 ",
            row.state
          ] }, row.id))
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6682\u65E0\u56FA\u5B9A\u539F\u6587\u4F1A\u8BDD\u6388\u6743\u3002" }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      g ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u72B6\u6001\uFF1A",
          g.effectiveState,
          " \xB7 ",
          g.validity,
          " \xB7 \u5DF2\u7528 ",
          g.usage.used,
          "/",
          g.usage.limit,
          " \u6B21\u65B0\u68C0\u7D22\uFF0C\u5269\u4F59 ",
          g.usage.remaining,
          " \u6B21\u3002"
        ] }),
        g.reasons?.map((reason, i) => /* @__PURE__ */ jsx("p", { role: "status", children: reason }, i)),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u4E3B\u4F1A\u8BDD ",
          short(g.sessionId),
          " \xB7 \u6A21\u578B ",
          g.model.provider,
          "/",
          g.model.model,
          " ",
          this.props.onSession ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onSession?.(g.sessionId), children: "\u6253\u5F00\u4F1A\u8BDD" }) : null
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u8BED\u6599 ",
          short(g.corpusId),
          " / \u914D\u7F6E\u7248\u672C ",
          g.configurationVersion,
          " \xB7 \u622A\u6B62 ",
          g.expiresAt
        ] }),
        g.documents.map((item) => /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u56FA\u5B9A PDF ",
          short(item.documentVersionId),
          " \xB7 \u89E3\u6790 ",
          short(item.parseResultId),
          " \xB7 \u6765\u6E90\u6458\u8981 ",
          short(item.sourceDigest)
        ] }, pair(item))),
        g.pmcDocuments?.map((item) => /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u56FA\u5B9A PMC ",
          short(item.documentVersionId),
          " \xB7 \u6765\u6E90\u6458\u8981 ",
          short(item.sourceDigest),
          " \xB7 \u65E0 PDF \u9875\u7801"
        ] }, item.documentVersionId)),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          g.state === "draft" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: g.validity !== "current", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u56FA\u5B9A\u539F\u6587\u68C0\u7D22\u6388\u6743\u5DF2\u6279\u51C6\uFF0C\u5C1A\u672A\u6FC0\u6D3B"), children: "\u6279\u51C6\u56FA\u5B9A\u539F\u6587\u8303\u56F4" }) : null,
          g.state === "draft" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: g.validity !== "current", onClick: () => perform(() => this.call("text_corpus_grant_activate", { grantId: g.id, expectedVersion: g.version }), "\u6307\u5B9A\u4F1A\u8BDD\u7684\u56FA\u5B9A\u539F\u6587\u68C0\u7D22\u6388\u6743\u5DF2\u6FC0\u6D3B"), children: "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u6388\u6743" }) : null,
          g.state !== "revoked" ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => perform(() => this.call("text_corpus_grant_revoke", { grantId: g.id, expectedVersion: g.version }), "\u56FA\u5B9A\u539F\u6587\u68C0\u7D22\u6388\u6743\u5DF2\u64A4\u9500\uFF0C\u5386\u53F2\u4FDD\u7559"), children: "\u64A4\u9500\u6388\u6743" }) : null
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u6279\u51C6\u8BB0\u5F55 ",
          short(g.approvalId),
          " \xB7 \u56FA\u5B9A\u6458\u8981 ",
          /* @__PURE__ */ jsx("code", { children: short(g.digest) })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5DF2\u5B8C\u6210\u68C0\u7D22 ",
          g.searchResults?.length ?? 0,
          " \u6761\uFF1B\u56FA\u5B9A\u8BC1\u636E\u53EF\u4ECE\u4E0A\u65B9\u5386\u53F2\u68C0\u7D22\u56DE\u67E5\u3002\u989D\u5EA6\u4EC5\u8BA1\u5DF2\u63D0\u4EA4\u7684\u65B0\u672C\u5730\u68C0\u7D22\uFF0C\u4E0D\u8BA1 HTTP\u3002"
        ] })
      ] }) : null
    ] });
  }
}
export {
  TextCorpusGrantPanel,
  TextEvidencePanel
};
