import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, artifactBlob, artifactText, downloadArtifact } from "./api.js";
import { short } from "./models.js";
import { SectionTitle, Badge, Empty } from "./ui.js";
import { TextEvidencePanel } from "./text-evidence.js";
import { DiscoveryGrants } from "./discovery-grants.js";
const sources = ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
const contentNames = { metadata: "\u4EC5\u5143\u6570\u636E", abstract: "\u4EC5\u6458\u8981", "provider-text": "\u6765\u6E90\u5168\u6587\u6587\u672C\uFF08\u65E0 PDF \u9875\u6620\u5C04\uFF09", "original-pdf": "\u5DF2\u56FA\u5B9A\u539F\u59CB PDF \u5B57\u8282", "user-text": "\u7528\u6237\u5BFC\u5165\u6587\u672C" };
const call = (projectId, name, input = {}) => api(`/operations/${name}`, { projectId, input });
function literatureRequestedVersion(target) {
  if (target.requestedVersion) return `\u8BF7\u6C42\u7248\u672C ${target.requestedVersion}`;
  const version = target.source === "alphaxiv" ? target.id.match(/v([1-9]\d*)$/) : null;
  return version ? `\u5730\u5740\u6307\u5B9A v${version[1]}` : "\u672A\u6307\u5B9A\u7248\u672C";
}
async function verifiedPageImage(blob, expectedDigest) {
  if (blob.size > 16 * 1024 * 1024) throw Error("\u9875\u56FE\u8D85\u8FC7\u56FA\u5B9A16 MiB\u4E0A\u9650");
  const bytes = new Uint8Array(await blob.arrayBuffer()), signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (signature.some((value, index) => bytes[index] !== value)) throw Error("\u56FA\u5B9A\u9875\u56FE\u4E0D\u662F\u6709\u6548 PNG");
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((n) => n.toString(16).padStart(2, "0")).join("");
  if (hash !== expectedDigest) throw Error("\u56FA\u5B9A\u9875\u56FE\u6458\u8981\u4E0D\u5339\u914D");
  return new Blob([bytes], { type: "image/png" });
}
function literatureSourceURL(value) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password ? url.href : void 0;
  } catch {
    return void 0;
  }
}
async function fileBase64(file) {
  if (!file.size) throw Error("\u6587\u6863\u4E0D\u80FD\u4E3A\u7A7A");
  if (file.size > 32 * 1024 * 1024) throw Error("\u5355\u4EFD\u6587\u6863\u6700\u591A 32 MiB");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(Error("\u6587\u6863\u8BFB\u53D6\u5931\u8D25"));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}
class LiteratureView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { query: "", sources: ["crossref"], config: null, error: "", format: "provider-text", requestedVersion: "", result: null, document: null, loading: false, importLicense: "", paging: false };
    this.mounted = true;
    this.documentEpoch = 0;
    this.taskEpoch = 0;
  }
  componentDidMount() {
    void this.loadConfig();
    if (this.props.selectedDocument) void this.loadDocument(this.props.selectedDocument.documentVersionId);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.documentEpoch++;
    this.taskEpoch++;
  }
  componentDidUpdate(prev) {
    if (prev.selectedDocument?.documentVersionId !== this.props.selectedDocument?.documentVersionId) {
      if (this.props.selectedDocument) void this.loadDocument(this.props.selectedDocument.documentVersionId);
      else {
        this.documentEpoch++;
        this.setState({ document: null });
      }
    }
    const target = this.pendingEvidenceScroll;
    if (target && this.state.document?.id === target.documentVersionId && this.props.selectedDocument?.parseResultId === target.parseResultId) {
      const page = document.getElementById("fixed-document-page");
      if (page) {
        page.scrollIntoView({ block: "start" });
        this.pendingEvidenceScroll = void 0;
      }
    }
  }
  async loadConfig() {
    try {
      const config = await api(`/projects/${this.props.data.project.id}/connectors`);
      if (this.mounted) this.setState({ config, sources: this.state.sources.filter((s) => config.enabled[s]) });
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  async loadDocument(id) {
    const epoch = ++this.documentEpoch;
    this.setState({ loading: true, error: "", document: null });
    try {
      const document2 = await call(this.props.data.project.id, "document_inspect", { documentVersionId: id });
      if (this.mounted && epoch === this.documentEpoch) this.setState({ document: document2 });
    } catch (error) {
      if (this.mounted && epoch === this.documentEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.documentEpoch) this.setState({ loading: false });
    }
  }
  selectDocument(target, fromEvidence = false) {
    this.pendingEvidenceScroll = fromEvidence ? target : void 0;
    if (this.props.onDocument) this.props.onDocument(target);
    else void this.loadDocument(target.documentVersionId);
  }
  async inspectTask(task) {
    const epoch = ++this.taskEpoch, projectId = this.props.data.project.id;
    await this.props.perform(async () => {
      const result = await call(projectId, "literature_task_inspect", { taskId: task.id });
      if (!this.mounted || epoch !== this.taskEpoch || projectId !== this.props.data.project.id) return;
      if (result.documentVersionId) this.selectDocument({ documentVersionId: result.documentVersionId });
      if (result.searchResult) this.setState({ result: result.searchResult, error: "" });
      else if (result.resultSearchId) this.setState({ error: "\u56FA\u5B9A\u68C0\u7D22\u7ED3\u679C\u5C1A\u4E0D\u53EF\u8BFB\uFF0C\u672A\u663E\u793A\u5176\u4ED6\u67E5\u8BE2\u7ED3\u679C\u3002" });
    });
  }
  render() {
    const { data, perform } = this.props, s = this.state, resultGrant = (data.discoveryGrants ?? []).find((g) => g.id === s.result?.discoveryGrant?.id && g.digest === s.result?.discoveryGrant?.digest), nextTask = (data.literatureTasks ?? []).find((task) => task.request.pageRequest?.previousSearchId === s.result?.id), page = s.result?.page, pageExpired = !!page?.nextCursorExpiresAt && Date.now() >= Date.parse(page.nextCursorExpiresAt), pageSource = s.result?.sources.length === 1 ? s.result.sources[0].source : null, pageName = pageSource === "openalex" ? "OpenAlex" : pageSource === "crossref" ? "Crossref" : pageSource === "biorxiv" ? "bioRxiv" : pageSource === "pubmed" ? "PubMed" : "\u672A\u77E5\u6765\u6E90";
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsxs(SectionTitle, { title: "\u6587\u732E\u4EFB\u52A1\u4E0E\u539F\u6587", sub: "\u663E\u5F0F\u63D0\u4EA4\u3001\u56FA\u5B9A\u53D6\u5F97\u7684\u5B57\u8282\uFF0C\u518D\u6309\u9875\u6BB5\u56DE\u67E5\uFF1B\u6458\u8981\u548C\u4F9B\u5E94\u5546\u6587\u672C\u4E0D\u5192\u5145\u539F PDF\u3002", children: [
        this.props.onSources ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: this.props.onSources, children: "\u7BA1\u7406\u6765\u6E90\u6388\u6743" }) : null,
        /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => void this.loadConfig(), children: "\u5237\u65B0\u6765\u6E90\u72B6\u6001" })
      ] }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      /* @__PURE__ */ jsxs("details", { className: "secondary-section", open: !!this.props.selectedDiscoveryGrant, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u68C0\u7D22\u6388\u6743\u4E0E\u8BF7\u6C42\u8303\u56F4" }),
        /* @__PURE__ */ jsx(DiscoveryGrants, { data, perform, selectedGrant: this.props.selectedDiscoveryGrant, onSelect: this.props.onSelectDiscoveryGrant, onSession: this.props.onSession, onSearch: (search, discoveryGrantId) => void perform(() => call(data.project.id, "literature_task_create", { kind: "search", search, discoveryGrantId }), "\u6388\u6743\u5185\u56FA\u5B9A\u68C0\u7D22\u5DF2\u63D0\u4EA4"), onTarget: (target, discoveryGrantId) => void perform(() => call(data.project.id, "literature_task_create", { kind: "retrieve", target, discoveryGrantId }), "\u6388\u6743\u5185\u660E\u786E\u8D44\u6599\u83B7\u53D6\u5DF2\u63D0\u4EA4") })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u63D0\u4EA4\u672A\u7ED1\u5B9A\u7684\u6301\u4E45\u68C0\u7D22\u4EFB\u52A1" }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u542F\u7528\u4EE3\u8868\u5141\u8BB8\u53D1\u9001\u67E5\u8BE2\uFF0C\u4E0D\u7B49\u4E8E\u6765\u6E90\u5065\u5EB7\u3002\u5931\u8D25\u4E0D\u4F1A\u5199\u6210\u96F6\u7ED3\u679C\uFF1B\u5173\u95ED\u9875\u9762\u4E0D\u53D6\u6D88\u5DF2\u63D0\u4EA4\u540E\u53F0\u4EFB\u52A1\u3002\u5DF2\u7ED1\u5B9A DiscoveryGrant \u7684\u4E3B\u4F1A\u8BDD\u8BF7\u4ECE\u4E0A\u65B9\u56FA\u5B9A\u8303\u56F4\u63D0\u4EA4\u3002" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          void perform(() => call(data.project.id, "literature_task_create", { kind: "search", search: { query: s.query, sources: s.sources, limit: 8, strategy: "keyword", prioritize: "default" } }), "\u6587\u732E\u68C0\u7D22\u4EFB\u52A1\u5DF2\u63D0\u4EA4");
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6587\u732E\u68C0\u7D22\u8BCD",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u6587\u732E\u68C0\u7D22\u8BCD", required: true, maxLength: 500, value: s.query, onChange: (e) => this.setState({ query: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "connector-switches", children: sources.map((source) => /* @__PURE__ */ jsxs("label", { children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", disabled: !s.config?.enabled[source], checked: s.sources.includes(source), onChange: (e) => this.setState({ sources: e.target.checked ? [...s.sources, source] : s.sources.filter((x) => x !== source) }) }),
            source,
            " \xB7 ",
            s.config?.enabled[source] ? "\u5DF2\u6388\u6743" : "\u672A\u6388\u6743"
          ] }, source)) }),
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: !s.query.trim() || !s.sources.length || !s.config || s.sources.some((source) => !s.config.enabled[source]), children: "\u63D0\u4EA4\u68C0\u7D22\u4EFB\u52A1" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u6301\u4E45\u4EFB\u52A1\u8BB0\u5F55" }),
          /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u6700\u8FD1 30 \u6761\uFF1B\u72B6\u6001\u6765\u81EA\u670D\u52A1\u7AEF" })
        ] }),
        (data.literatureTasks ?? []).map((task) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            task.kindOfTask === "search" ? "\u68C0\u7D22" : "\u83B7\u53D6\u539F\u6587",
            " \xB7 ",
            short(task.id),
            task.request.pageRequest ? " \xB7 \u7B2C " + task.request.pageRequest.number + " \u9875" : ""
          ] }),
          /* @__PURE__ */ jsx(Badge, { value: task.state }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: task.request.kind === "search" ? task.request.search.query : `${task.request.target.source} \xB7 ${task.request.target.id} \xB7 ${literatureRequestedVersion(task.request.target)}` }),
          task.cancelRequested && !["cancelled", "failed", "succeeded", "partial", "interrupted"].includes(task.state) ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u5DF2\u8BF7\u6C42\u53D6\u6D88\uFF0C\u7B49\u5F85\u6267\u884C\u5668\u786E\u8BA4\uFF1B\u5C1A\u672A\u6807\u4E3A\u7EC8\u6001\u3002" }) : null,
          /* @__PURE__ */ jsxs("p", { children: [
            "\u9636\u6BB5\uFF1A",
            task.phase ?? "\u7B49\u5F85\u670D\u52A1\u7AEF\u9636\u6BB5\u8BB0\u5F55"
          ] }),
          task.error ? /* @__PURE__ */ jsxs("p", { className: "error-text", children: [
            task.error.code,
            "\uFF1A",
            task.error.message
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => void this.inspectTask(task), children: "\u67E5\u770B\u56FA\u5B9A\u7ED3\u679C" }),
            ["queued", "running", "cancelling"].includes(task.state) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", onClick: () => perform(() => call(data.project.id, "literature_task_cancel", { taskId: task.id })), children: "\u8BF7\u6C42\u53D6\u6D88\u4EFB\u52A1" }) : null,
            ["failed", "cancelled", "interrupted"].includes(task.state) ? /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => call(data.project.id, "literature_task_retry", { taskId: task.id, expectedVersion: task.version }), "\u5DF2\u663E\u5F0F\u8BF7\u6C42\u65B0\u5C1D\u8BD5"), children: "\u663E\u5F0F\u91CD\u8BD5" }) : null
          ] })
        ] }, task.id)),
        !data.literatureTasks?.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u6587\u732E\u4EFB\u52A1\u3002\u6CA1\u6709\u7ED3\u679C\u4E0D\u8868\u793A\u4E0D\u5B58\u5728\u76F8\u5173\u7814\u7A76\u3002" }) : null
      ] }),
      s.result ? /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          "\u56FA\u5B9A\u68C0\u7D22\u7ED3\u679C\uFF1A",
          s.result.query
        ] }),
        page ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
            pageName,
            " \u5143\u6570\u636E\u7B2C ",
            page.number,
            " \u9875 \xB7 \u6765\u6E90\u539F\u59CB\u8FD4\u56DE ",
            page.rawItemCount,
            " \u6761\uFF1B\u4EC5\u6B64\u9875\uFF0C\u4E0D\u4EE3\u8868\u5B8C\u6574\u8986\u76D6\u3002"
          ] }),
          page.previousSearchId ? /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
            "\u524D\u9875 ",
            short(page.previousSearchId),
            " \u53EF\u4ECE\u6301\u4E45\u4EFB\u52A1\u56DE\u67E5\u3002"
          ] }) : null,
          page.nextCursor ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: s.paging || !!nextTask || pageExpired || !pageSource || !s.config?.enabled[pageSource], onClick: () => {
            if (s.paging) return;
            this.setState({ paging: true });
            void perform(() => call(data.project.id, "literature_task_create", { kind: "search", previousSearchId: s.result.id }), "\u4E0B\u4E00\u9875\u6301\u4E45\u4EFB\u52A1\u5DF2\u63D0\u4EA4").finally(() => {
              if (this.mounted) this.setState({ paging: false });
            });
          }, children: "\u663E\u5F0F\u83B7\u53D6\u4E0B\u4E00\u9875" }) : /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u6B64\u9875\u5DF2\u65E0\u4E0B\u4E00\u6E38\u6807\u3002" }),
          pageExpired ? /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u6E38\u6807\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u63D0\u4EA4\u68C0\u7D22\u3002" }) : null,
          nextTask ? /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
            "\u4E0B\u4E00\u9875\u4EFB\u52A1 ",
            short(nextTask.id),
            " \u5DF2\u8BB0\u5F55\uFF0C\u8BF7\u5728\u4E0A\u65B9\u56DE\u67E5\u3002"
          ] }) : null
        ] }) : s.result.sources.some((source) => source.source === "alphaxiv") ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "alphaXiv \u5F53\u524D\u68C0\u7D22\u4EC5\u4E3A\u6709\u9650\u5019\u9009\u7A97\u53E3\uFF1B\u5C1A\u65E0\u5DF2\u9A8C\u8BC1\u7684\u7EED\u9875\u5951\u7EA6\uFF0C\u4E0D\u4EE3\u8868\u7ED3\u679C\u5DF2\u7A77\u5C3D\u3002" }) : null,
        pageSource === "pubmed" && s.result.coverage ? /* @__PURE__ */ jsx("p", { className: "small muted", children: s.result.coverage }) : null,
        /* @__PURE__ */ jsx("p", { className: "small muted", children: s.result.discoveryGrant ? `DiscoveryGrant ${short(s.result.discoveryGrant.id)} \xB7 \u6388\u6743\u5185\u547D\u4E2D` : "\u672A\u7ED1\u5B9A\u6388\u6743\u7684\u68C0\u7D22" }),
        s.result.sources.map((source) => /* @__PURE__ */ jsxs("p", { children: [
          source.source,
          " \xB7 ",
          source.status,
          " \xB7 ",
          source.count,
          " \u6761 ",
          source.error ?? ""
        ] }, source.source)),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u7ED3\u679C\u4EC5\u8986\u76D6\u6240\u9009\u6765\u6E90\u7684\u6709\u754C\u5019\u9009\u6C60\uFF0C\u4E0D\u4EE3\u8868\u7A77\u5C3D\u68C0\u7D22\u6216\u9605\u8BFB\u5168\u6587\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u83B7\u53D6\u5185\u5BB9",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u83B7\u53D6\u5185\u5BB9\u7C7B\u578B", value: s.format, onChange: (e) => this.setState({ format: e.target.value, requestedVersion: e.target.value === "oa-full-text" ? "" : this.state.requestedVersion }), children: [
              /* @__PURE__ */ jsx("option", { value: "provider-text", children: "\u6765\u6E90\u63D0\u4F9B\u7684\u6587\u672C / \u6458\u8981 / \u5143\u6570\u636E" }),
              /* @__PURE__ */ jsx("option", { value: "original-pdf", children: "\u539F\u59CB PDF\uFF08\u4E0D\u53EF\u53D6\u5F97\u65F6\u660E\u786E\u5931\u8D25\uFF09" }),
              /* @__PURE__ */ jsx("option", { value: "oa-full-text", children: "PMC \u5F00\u653E\u83B7\u53D6\u5168\u6587\uFF08\u4EC5 PubMed\uFF1B\u65E0 PDF \u9875\u6620\u5C04\uFF09" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BF7\u6C42\u7248\u672C\uFF08\u53EF\u9009\uFF09",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u8BF7\u6C42\u539F\u6587\u7248\u672C", disabled: s.format === "oa-full-text", value: s.requestedVersion, onChange: (e) => this.setState({ requestedVersion: e.target.value }), placeholder: "\u4F8B\u5982 v2\uFF1B\u7559\u7A7A\u4E0D\u4FDD\u8BC1\u6307\u5B9A\u7248\u672C" })
          ] })
        ] }),
        s.result.items.map((hit) => /* @__PURE__ */ jsxs("article", { className: "inspector-section", children: [
          /* @__PURE__ */ jsx("h3", { children: hit.title }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            hit.source,
            " \xB7 ",
            hit.id,
            " \xB7 \u5C1A\u672A\u6838\u9A8C\u539F PDF"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "prose-text", children: hit.abstract ?? "\u672A\u63D0\u4F9B\u6458\u8981" }),
          literatureSourceURL(hit.url) ? /* @__PURE__ */ jsx("a", { href: literatureSourceURL(hit.url), target: "_blank", rel: "noopener noreferrer", children: "\u6253\u5F00\u6765\u6E90\u9875\u9762" }) : null,
          s.result.discoveryGrant ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !resultGrant || resultGrant.effectiveState !== "active" || resultGrant.validity !== "current" || !resultGrant.allowSearchResults || (s.format === "oa-full-text" || !resultGrant.formats.includes(s.format)) || resultGrant.usage.remaining < 1, onClick: () => perform(() => call(data.project.id, "literature_task_create", { kind: "retrieve", target: { source: hit.source, id: hit.id, format: s.format, ...s.requestedVersion.trim() ? { requestedVersion: s.requestedVersion.trim() } : {} }, discoveryGrantId: s.result.discoveryGrant.id }), "\u6388\u6743\u5185\u547D\u4E2D\u8D44\u6599\u83B7\u53D6\u5DF2\u63D0\u4EA4"), children: "\u4EE5\u539F\u68C0\u7D22\u6388\u6743\u83B7\u53D6\u6B64\u547D\u4E2D" }) : /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !s.config?.enabled[hit.source] || s.format === "oa-full-text" && hit.source !== "pubmed", onClick: () => perform(() => call(data.project.id, "literature_task_create", { kind: "retrieve", target: { source: hit.source, id: hit.id, format: s.format, ...s.requestedVersion.trim() ? { requestedVersion: s.requestedVersion.trim() } : {} } }), "\u539F\u6587\u83B7\u53D6\u4EFB\u52A1\u5DF2\u63D0\u4EA4"), children: "\u63D0\u4EA4\u6B64\u6587\u732E\u83B7\u53D6\u4EFB\u52A1" })
        ] }, hit.source + ":" + hit.id))
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { className: "secondary-section", children: [
        /* @__PURE__ */ jsx("summary", { children: "\u5BFC\u5165\u672C\u5730\u6587\u6863" }),
        /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BB8\u53EF\u8BC1\u8BF4\u660E\uFF08\u672A\u77E5\u53EF\u7559\u7A7A\uFF09",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u5BFC\u5165\u6587\u6863\u8BB8\u53EF\u8BC1", value: s.importLicense, onChange: (e) => this.setState({ importLicense: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "secondary file-upload", children: [
            "\u9009\u62E9 PDF \u6216 UTF-8 \u6587\u672C\uFF08\u6700\u591A32 MiB\uFF09",
            /* @__PURE__ */ jsx("input", { type: "file", accept: ".pdf,.txt,.md,application/pdf,text/plain", onChange: (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void perform(async () => {
                const mediaType = /\.pdf$/i.test(file.name) ? "application/pdf" : "text/plain", document2 = await call(data.project.id, "document_import", { title: file.name, mediaType, contentBase64: await fileBase64(file), ...s.importLicense.trim() ? { license: s.importLicense.trim() } : {} });
                this.selectDocument({ documentVersionId: document2.id });
              }, "\u539F\u59CB\u6587\u6863\u5B57\u8282\u5DF2\u56FA\u5B9A\u4FDD\u5B58");
            } })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u5904\u7406\u7528\u6237\u9009\u62E9\u7684\u6587\u4EF6\uFF1B\u4E0D\u81EA\u52A8\u8BFB\u53D6\u5BBF\u4E3B\u76EE\u5F55\uFF0C\u4E5F\u4E0D\u52A0\u5165\u672C\u5730\u68C0\u7D22\u8BED\u6599\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u56FA\u5B9A\u6587\u6863\u7248\u672C" }),
          /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u6700\u8FD130\u4EFD\uFF1B\u5386\u53F2\u6307\u5B9A\u7248\u672C\u53EF\u76F4\u63A5\u56DE\u67E5" })
        ] }),
        (data.documents ?? []).slice().reverse().map((document2) => /* @__PURE__ */ jsx("button", { className: "artifact-item", onClick: () => this.selectDocument({ documentVersionId: document2.id }), children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: document2.title }),
          /* @__PURE__ */ jsxs("small", { children: [
            contentNames[document2.contentKind],
            " \xB7 ",
            short(document2.id),
            " \xB7 ",
            short(document2.original.digest)
          ] })
        ] }) }, document2.id)),
        !data.documents?.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5C1A\u65E0\u56FA\u5B9A DocumentVersion\u3002" }) : null
      ] }),
      s.loading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u8BFB\u53D6\u56FA\u5B9A\u6587\u6863\u2026" }) : s.document ? /* @__PURE__ */ jsx(DocumentPane, { document: s.document, data, perform, location: this.props.selectedDocument, onLocation: (target) => this.selectDocument(target) }, s.document.id) : /* @__PURE__ */ jsx(Empty, { title: "\u9009\u62E9\u6587\u6863\u7248\u672C", children: /* @__PURE__ */ jsx("p", { children: "\u539F\u59CB\u6587\u4EF6\u53D6\u5F97\u3001\u6587\u672C\u63D0\u53D6\u548C\u79D1\u5B66\u6838\u9A8C\u662F\u4E0D\u540C\u9636\u6BB5\u3002" }) }),
      /* @__PURE__ */ jsx(TextEvidencePanel, { data, perform, onDocument: (target) => this.selectDocument(target, true), onSession: this.props.onSession })
    ] });
  }
}
class DocumentPane extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { parser: null, error: "", context: "desktop-linux", image: "", text: "" };
    this.mounted = true;
  }
  componentDidMount() {
    void this.status();
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  async status() {
    try {
      const parser = await call(this.props.data.project.id, "document_parser_status");
      if (this.mounted) this.setState({ parser, error: "" });
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    const { document: d, data, perform } = this.props;
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
      /* @__PURE__ */ jsx("h2", { children: d.title }),
      /* @__PURE__ */ jsxs("p", { children: [
        contentNames[d.contentKind],
        " \xB7 \u83B7\u53D6\u65F6\u95F4 ",
        d.acquiredAt
      ] }),
      /* @__PURE__ */ jsxs("code", { className: "digest", children: [
        "\u539F\u59CB SHA-256 ",
        d.original.digest
      ] }),
      /* @__PURE__ */ jsxs("dl", { className: "details", children: [
        /* @__PURE__ */ jsx("dt", { children: "\u8BF7\u6C42\u7248\u672C" }),
        /* @__PURE__ */ jsx("dd", { children: d.source.requestedVersion ?? "\u672A\u6307\u5B9A" }),
        /* @__PURE__ */ jsx("dt", { children: "\u6765\u6E90\u62A5\u544A\u7248\u672C" }),
        /* @__PURE__ */ jsx("dd", { children: d.source.reportedVersion ?? "\u672A\u77E5" }),
        /* @__PURE__ */ jsx("dt", { children: "\u7248\u672C\u4FDD\u8BC1" }),
        /* @__PURE__ */ jsx("dd", { children: d.source.versionAssurance }),
        /* @__PURE__ */ jsx("dt", { children: "\u8BB8\u53EF\u8BC1" }),
        /* @__PURE__ */ jsxs("dd", { children: [
          d.license.value ?? "\u672A\u77E5",
          " \xB7 ",
          d.license.assurance
        ] }),
        /* @__PURE__ */ jsx("dt", { children: "\u6765\u6E90 ID" }),
        /* @__PURE__ */ jsx("dd", { children: d.source.requestedId ?? "\u7528\u6237\u672C\u5730\u5BFC\u5165" })
      ] }),
      literatureSourceURL(d.source.sourceUrl) ? /* @__PURE__ */ jsx("a", { href: literatureSourceURL(d.source.sourceUrl), target: "_blank", rel: "noopener noreferrer", children: "\u67E5\u770B\u6765\u6E90\u5730\u5740" }) : null,
      /* @__PURE__ */ jsx("ul", { children: d.limitations.map((value, i) => /* @__PURE__ */ jsx("li", { children: value }, i)) }),
      /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => perform(() => downloadArtifact(d.original.artifactId, d.contentKind === "original-pdf" && !/\.pdf$/i.test(d.title) ? d.title + ".pdf" : d.title)), children: "\u4E0B\u8F7D\u56FA\u5B9A\u539F\u59CB\u6587\u4EF6" }),
      d.contentKind === "original-pdf" ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53D6\u5F97 PDF \u5B57\u8282\u4E0D\u7B49\u4E8E\u5DF2\u9605\u8BFB\u6216\u901A\u8FC7\u79D1\u5B66\u6838\u9A8C\uFF1B\u4E0D\u4F1A\u5728\u9875\u9762\u6267\u884C PDF \u811A\u672C\u6216\u5D4C\u5165\u5185\u5BB9\u3002" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      d.contentKind !== "original-pdf" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("button", { className: "secondary", onClick: () => perform(async () => {
          const content = await artifactText((d.derivedText ?? d.original).artifactId);
          if (this.mounted) this.setState({ text: content.slice(0, 65536) + (content.length > 65536 ? "\n\u2026\u53EA\u9884\u89C8\u524D65,536\u5B57\u7B26\uFF1B\u4E0B\u8F7D\u67E5\u770B\u5B8C\u6574\u539F\u4EF6\u3002" : "") });
        }), children: [
          "\u67E5\u770B",
          d.derivedText ? "\u6D3E\u751F" : "\u5DF2\u56FA\u5B9A",
          "\u6587\u672C\uFF1A",
          contentNames[d.contentKind],
          "\uFF08\u65E0 PDF \u9875\u6620\u5C04\uFF09"
        ] }),
        d.derivedText ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6D3E\u751F\u6458\u8981/\u683C\u5F0F\u5316\u5143\u6570\u636E/\u63D0\u53D6\u6587\u672C\u4E0E\u539F\u59CB\u7F51\u7EDC\u54CD\u5E94\u5206\u522B\u4FDD\u5B58\uFF1B\u6B64\u9605\u8BFB\u5185\u5BB9\u4E0D\u662F\u539F PDF\u3002" }),
          /* @__PURE__ */ jsxs("code", { className: "digest", children: [
            "\u6D3E\u751F\u6587\u672C SHA-256 ",
            d.derivedText.digest
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => downloadArtifact(d.derivedText.artifactId, `${d.title}-derived.txt`)), children: "\u5355\u72EC\u4E0B\u8F7D\u6D3E\u751F\u6587\u672C" })
        ] }) : null,
        this.state.text ? /* @__PURE__ */ jsx("pre", { className: "document-preview", children: this.state.text }) : null
      ] }) : null,
      /* @__PURE__ */ jsx("h3", { children: "\u9694\u79BB\u89E3\u6790\u914D\u7F6E" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u89E3\u6790\u5668\u9700\u8981\u9884\u5148\u914D\u7F6E\u56FA\u5B9A\u955C\u50CF\u3002\u672A\u5C31\u7EEA\u65F6\u8BF7\u6309\u5BBF\u4E3B setup-document-parser \u6307\u5F15\u51C6\u5907\uFF1B\u9875\u9762\u4E0D\u4F1A\u81EA\u52A8\u5B89\u88C5\u3002" }),
      /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.status(), children: "\u5237\u65B0\u89E3\u6790\u5668\u72B6\u6001" }),
      this.state.parser ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { children: this.state.parser.configured ? "\u56FA\u5B9A\u89E3\u6790\u955C\u50CF\u5DF2\u914D\u7F6E\uFF1B\u6BCF\u6B21\u89E3\u6790\u4ECD\u9700\u5355\u72EC\u6279\u51C6" : "\u89E3\u6790\u5668\u672A\u914D\u7F6E\uFF1B\u8BF7\u5148\u5728\u5BBF\u4E3B\u8FD0\u884C setup-document-parser \u6307\u5F15" }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u914D\u7F6E\u7248\u672C ",
          this.state.parser.version,
          " \xB7 ",
          this.state.parser.profileId,
          " \xB7 \u6700\u591A ",
          this.state.parser.limits.maxPages,
          " \u9875\uFF1BOCR\u4E0D\u9ED8\u8BA4\u542F\u7528\u3002"
        ] }),
        this.state.parser.configuration ? /* @__PURE__ */ jsx("code", { className: "digest", children: this.state.parser.configuration.imageDigest }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u914D\u7F6E\u5DF2\u5B58\u5728\u7684\u56FA\u5B9A\u89E3\u6790\u955C\u50CF" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          void perform(async () => {
            await call(data.project.id, "document_parser_configure", { expectedVersion: this.state.parser.version, dockerContext: this.state.context, imageDigest: this.state.image.trim() });
            await this.status();
          });
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u89E3\u6790 Docker context",
            /* @__PURE__ */ jsx("input", { required: true, value: this.state.context, onChange: (e) => this.setState({ context: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u56FA\u5B9A\u89E3\u6790\u955C\u50CF\u6458\u8981",
            /* @__PURE__ */ jsx("input", { required: true, pattern: "(?:.+@)?sha256:[a-f0-9]{64}", value: this.state.image, onChange: (e) => this.setState({ image: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: !this.state.parser, children: "\u663E\u5F0F\u4FDD\u5B58\u89E3\u6790\u914D\u7F6E" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "primary", disabled: d.contentKind !== "original-pdf" || !this.state.parser?.configured, onClick: () => perform(() => call(data.project.id, "document_parse_prepare", { documentVersionId: d.id }), "\u56FA\u5B9A\u89E3\u6790\u4EFB\u52A1\u5DF2\u51C6\u5907\uFF1B\u4ECD\u9700\u7528\u6237\u6279\u51C6"), children: "\u51C6\u5907\u56FA\u5B9A\u6587\u6863\u89E3\u6790" }),
      (data.documentParseJobs ?? []).filter((job) => job.documentVersionId === d.id).slice().reverse().map((job) => {
        const approval = data.approvals.find((a) => a.id === job.approvalId);
        return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            "\u56FA\u5B9A\u89E3\u6790\u4EFB\u52A1 ",
            short(job.id)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx(Badge, { value: job.state }),
            /* @__PURE__ */ jsx(Badge, { value: job.integrity })
          ] }),
          /* @__PURE__ */ jsxs("dl", { className: "details", children: [
            /* @__PURE__ */ jsx("dt", { children: "\u539F\u4EF6\u6458\u8981" }),
            /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest", children: job.rawDigest }) }),
            /* @__PURE__ */ jsx("dt", { children: "\u89E3\u6790\u955C\u50CF" }),
            /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest", children: job.imageDigest }) }),
            /* @__PURE__ */ jsx("dt", { children: "\u89E3\u6790\u914D\u7F6E" }),
            /* @__PURE__ */ jsx("dd", { children: job.profileId }),
            /* @__PURE__ */ jsx("dt", { children: "\u8D44\u6E90" }),
            /* @__PURE__ */ jsx("dd", { children: Object.entries(job.resources).map(([key, value]) => `${key}=${value}`).join(" \xB7 ") })
          ] }),
          job.error ? /* @__PURE__ */ jsx("p", { className: "error-text", children: job.error }) : null,
          job.state === "prepared" && approval?.status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u5DF2\u6279\u51C6\u56FA\u5B9A\u89E3\u6790\uFF0C\u5C1A\u672A\u63D0\u4EA4"), children: "\u6279\u51C6\u56FA\u5B9A\u6587\u6863\u89E3\u6790" }),
            /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })), children: "\u62D2\u7EDD\u89E3\u6790" })
          ] }) : null,
          job.state === "prepared" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => perform(() => call(data.project.id, "document_parse_submit", { jobId: job.id }), "\u89E3\u6790\u5DF2\u8FDB\u5165\u5171\u4EAB\u8BA1\u7B97\u961F\u5217"), children: "\u63D0\u4EA4\u5DF2\u6279\u51C6\u89E3\u6790" }) : null,
          ["prepared", "queued", "starting", "running", "unknown"].includes(job.state) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", onClick: () => perform(() => call(data.project.id, "document_parse_cancel", { jobId: job.id })), children: "\u8BF7\u6C42\u53D6\u6D88\u89E3\u6790" }) : null,
          job.state === "succeeded" && job.integrity === "complete" && job.resultId ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => this.props.onLocation({ documentVersionId: d.id, parseResultId: job.resultId, pageNumber: 1 }), children: "\u67E5\u770B\u6B64\u56FA\u5B9A\u89E3\u6790\u7ED3\u679C" }) : null
        ] }, job.id);
      }),
      this.props.location?.parseResultId ? /* @__PURE__ */ jsx(DocumentPages, { document: d, projectId: data.project.id, resultId: this.props.location.parseResultId, pageNumber: this.props.location.pageNumber ?? 1, start: this.props.location.start, end: this.props.location.end, onPage: (pageNumber) => this.props.onLocation({ documentVersionId: d.id, parseResultId: this.props.location.parseResultId, pageNumber }), perform }, this.props.location.parseResultId) : null
    ] });
  }
}
function PageImageCandidates({ page, imageURL, loading, onError }) {
  const candidates = page.imageCandidates;
  return /* @__PURE__ */ jsxs("div", { children: [
    imageURL ? /* @__PURE__ */ jsxs("div", { style: { position: "relative", display: "inline-block", maxWidth: "100%" }, children: [
      /* @__PURE__ */ jsx("img", { src: imageURL, alt: `\u56FA\u5B9A\u539F\u6587\u7269\u7406\u9875 ${page.pageNumber}`, style: { display: "block", maxWidth: "100%", height: "auto" }, onError }),
      candidates?.map((item) => {
        const b = item.pixelBounds;
        return /* @__PURE__ */ jsx("span", { "aria-hidden": "true", style: { position: "absolute", boxSizing: "border-box", border: "2px solid #a74132", left: `${100 * b.left / page.imageWidth}%`, top: `${100 * b.top / page.imageHeight}%`, width: `${100 * (b.right - b.left) / page.imageWidth}%`, height: `${100 * (b.bottom - b.top) / page.imageHeight}%`, pointerEvents: "none" } }, item.index);
      })
    ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: loading ? "\u6B63\u5728\u8BFB\u53D6\u5E76\u6838\u5BF9\u56FA\u5B9A PNG \u9875\u56FE\u2026" : "\u9875\u56FE\u5C1A\u4E0D\u53EF\u7528\u3002" }),
    candidates === void 0 ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u5386\u53F2\u89E3\u6790\u7248\u672C\u672A\u68C0\u6D4B\u5D4C\u5165\u56FE\u50CF\u3002" }) : candidates.length === 0 ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u56FA\u5B9A\u89E3\u6790\u7248\u672C\u672A\u53D1\u73B0\u53EF\u5B9A\u4F4D\u7684\u5D4C\u5165\u6805\u683C\u5BF9\u8C61\uFF1B\u77E2\u91CF\u56FE\u4E0E\u56FE\u7ED3\u6784\u4ECD\u672A\u77E5\u3002" }) : /* @__PURE__ */ jsxs("section", { "aria-label": "\u5D4C\u5165\u56FE\u50CF\u5019\u9009", children: [
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5019\u9009\u6846\u6765\u81EA\u5F53\u524D\u56FA\u5B9A\u89E3\u6790\u7248\u672C\u7684\u5D4C\u5165\u6805\u683C\u5BF9\u8C61\uFF0C\u4E0D\u5224\u5B9A\u79D1\u5B66 Figure\u3001\u56FE\u6CE8\u6216\u56FE\u4E2D\u6570\u503C\u3002" }),
      /* @__PURE__ */ jsx("ol", { children: candidates.map((item) => {
        const b = item.pixelBounds;
        return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "\u5019\u9009 ",
            item.index,
            " \xB7 \u9875\u56FE\u50CF\u7D20 [",
            b.left,
            ", ",
            b.top,
            ", ",
            b.right,
            ", ",
            b.bottom,
            "]"
          ] }),
          imageURL ? /* @__PURE__ */ jsx("div", { style: { maxWidth: "100%", overflowX: "auto" }, children: /* @__PURE__ */ jsx("div", { style: { position: "relative", width: b.right - b.left, height: b.bottom - b.top, overflow: "hidden" }, children: /* @__PURE__ */ jsx("img", { src: imageURL, alt: `\u7269\u7406\u9875 ${page.pageNumber} \u5D4C\u5165\u56FE\u50CF\u5019\u9009 ${item.index} \u7684\u9875\u56FE\u88C1\u526A`, style: { position: "absolute", left: -b.left, top: -b.top, width: page.imageWidth, height: page.imageHeight, maxWidth: "none" }, onError }) }) }) : /* @__PURE__ */ jsx("p", { children: "\u9875\u56FE\u8F7D\u5165\u540E\u53EF\u56DE\u770B\u6B64\u533A\u57DF\u3002" })
        ] }) }, item.index);
      }) })
    ] })
  ] });
}
class DocumentPages extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { list: null, page: null, content: "", base: 0, cursor: 0, complete: false, imageURL: "", loading: false, error: "", start: 0, end: 0, description: "" };
    this.epoch = 0;
    this.listEpoch = 0;
    this.imageURL = "";
    this.mounted = true;
  }
  componentDidMount() {
    void this.loadList();
    void this.readPage();
  }
  componentDidUpdate(prev) {
    if (prev.pageNumber !== this.props.pageNumber) void this.loadList();
    if (prev.pageNumber !== this.props.pageNumber || prev.start !== this.props.start || prev.end !== this.props.end) void this.readPage();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.listEpoch++;
    this.controller?.abort();
    this.revokeImage();
  }
  revokeImage() {
    if (this.imageURL) {
      URL.revokeObjectURL(this.imageURL);
      this.imageURL = "";
    }
  }
  verify(value) {
    if (value.resultId !== this.props.resultId || value.documentVersionId !== this.props.document.id || value.rawDigest !== this.props.document.original.digest) throw Error("\u89E3\u6790\u7ED3\u679C\u4E0D\u5C5E\u4E8E\u6240\u9009\u56FA\u5B9A\u539F\u4EF6\uFF0C\u672A\u663E\u793A\u5176\u4ED6\u7248\u672C\u3002");
  }
  async loadList(cursor = Math.floor((this.props.pageNumber - 1) / 20) * 20) {
    const epoch = ++this.listEpoch;
    try {
      const list = await call(this.props.projectId, "document_pages", { parseResultId: this.props.resultId, cursor, limit: 20 });
      this.verify(list);
      if (this.mounted && epoch === this.listEpoch) this.setState({ list });
    } catch (error) {
      if (this.mounted && epoch === this.listEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  async readPage(append = false) {
    if (append && this.state.loading) return;
    const epoch = ++this.epoch;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    if (!append) {
      this.revokeImage();
      this.setState({ page: null, content: "", base: this.props.start ?? 0, cursor: this.props.start ?? 0, complete: false, imageURL: "", start: this.props.start ?? 0, end: this.props.end ?? 0, description: "" });
    }
    const cursor = append ? this.state.cursor : this.props.start ?? 0;
    this.setState({ loading: true, error: "" });
    try {
      if ((this.props.start !== void 0 || this.props.end !== void 0) && (!Number.isSafeInteger(this.props.start) || !Number.isSafeInteger(this.props.end) || this.props.start < 0 || this.props.end <= this.props.start)) throw Error("\u8BC1\u636E\u5F15\u7528\u533A\u95F4\u65E0\u6548\uFF0C\u672A\u66FF\u6362\u4E3A\u9875\u9996\u3002");
      const page = await api("/operations/document_page_read", { projectId: this.props.projectId, input: { parseResultId: this.props.resultId, pageNumber: this.props.pageNumber, cursor, limit: 16e3 } }, "POST", controller.signal);
      this.verify(page);
      if (page.pageNumber !== this.props.pageNumber) throw Error("\u8FD4\u56DE\u7269\u7406\u9875\u53F7\u4E0E\u9009\u62E9\u4E0D\u4E00\u81F4\u3002");
      if (page.cursor !== cursor || page.end - page.cursor !== page.content.length) throw Error("\u9875\u6587\u672C\u7A97\u53E3\u4E0E\u8BF7\u6C42\u533A\u95F4\u4E0D\u4E00\u81F4\u3002");
      if (!this.mounted || epoch !== this.epoch) return;
      this.setState((previous) => ({ ...previous, page, content: (append ? previous.content : "") + page.content, cursor: page.end, complete: page.complete, ...!append ? { base: page.cursor, start: this.props.start ?? page.cursor, end: this.props.end ?? Math.min(page.end, page.cursor + 2e3) } : {} }));
      if (!append) {
        const png = await verifiedPageImage(await artifactBlob(page.imageArtifactId, controller.signal), page.imageArtifactDigest);
        if (!this.mounted || epoch !== this.epoch) return;
        this.imageURL = URL.createObjectURL(png);
        this.setState({ imageURL: this.imageURL });
      }
    } catch (error) {
      if (this.mounted && epoch === this.epoch && !controller.signal.aborted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ loading: false });
    }
  }
  render() {
    const s = this.state, p = s.page, list = s.list;
    return /* @__PURE__ */ jsxs("div", { id: "fixed-document-page", className: "inspector-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        "\u56FA\u5B9A\u89E3\u6790\u7248\u672C ",
        short(this.props.resultId)
      ] }),
      list ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u7269\u7406\u9875\u603B\u6570 ",
          list.pageCount,
          " \xB7 PDF\u7248\u672C\u6838\u9A8C ",
          list.versionAssurance,
          " \xB7 \u8BF7\u6C42 ",
          list.requestedVersion ?? "\u672A\u6307\u5B9A",
          " / \u89C2\u5BDF ",
          list.observedVersion ?? "\u672A\u77E5"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u9605\u8BFB\u987A\u5E8F ",
          list.quality.readingOrder,
          "\uFF1B\u6BB5\u843D ",
          list.quality.paragraphs,
          "\uFF1B\u8868\u683C ",
          list.quality.tables,
          "\uFF1B\u56FE\u7ED3\u6784 ",
          list.quality.figures,
          "\uFF1BOCR ",
          list.quality.ocr ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528",
          "\u3002\u9875\u56FE\u53EF\u56DE\u770B\u539F\u56FE\u8868\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u7ECF\u53EF\u9760\u62BD\u53D6\u7ED3\u6784\u3002"
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u56FA\u5B9A\u7269\u7406\u9875",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u56FA\u5B9A\u7269\u7406\u9875", value: list.items.some((x) => x.pageNumber === this.props.pageNumber) ? this.props.pageNumber : "", onChange: (e) => {
            if (e.target.value) this.props.onPage(Number(e.target.value));
          }, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6B64\u6E05\u5355\u4E2D\u7684\u7269\u7406\u9875" }),
            list.items.map((page) => /* @__PURE__ */ jsxs("option", { value: page.pageNumber, children: [
              "\u7269\u7406\u9875 ",
              page.pageNumber,
              " \xB7 \u9875\u6807\u7B7E ",
              page.pageLabel ?? "\u672A\u77E5"
            ] }, page.pageNumber))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: list.cursor === 0, onClick: () => void this.loadList(Math.max(0, list.cursor - 20)), children: "\u4E0A\u4E00\u6279\u9875\u6E05\u5355" }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: list.complete, onClick: () => void this.loadList(list.end), children: "\u4E0B\u4E00\u6279\u9875\u6E05\u5355" })
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u8BFB\u53D6\u9875\u6E05\u5355\u2026" }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : null,
      p ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          "\u7269\u7406\u9875 ",
          p.pageNumber,
          " \xB7 \u9875\u6807\u7B7E ",
          p.pageLabel ?? "\u672A\u77E5"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u539F\u4EF6\u6458\u8981" }),
        /* @__PURE__ */ jsx("code", { className: "digest", children: this.props.document.original.digest }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9875\u6587\u672C\u6458\u8981" }),
        /* @__PURE__ */ jsx("code", { className: "digest", children: p.textArtifactDigest }),
        /* @__PURE__ */ jsx(PageImageCandidates, { page: p, imageURL: s.imageURL, loading: s.loading, onError: () => this.setState({ error: "\u6D4F\u89C8\u5668\u65E0\u6CD5\u89E3\u7801\u5DF2\u56FA\u5B9A\u9875\u56FE\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u6216\u4E0B\u8F7D\u539F\u59CB PDF \u6838\u5BF9\u3002" }) }),
        p.textStatus === "no-text-layer" ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u6B64\u9875\u6CA1\u6709\u53EF\u63D0\u53D6\u6587\u5B57\u5C42\uFF1B\u672A\u542F\u52A8 OCR\uFF0C\u4E0D\u80FD\u51ED\u9875\u56FE\u4F2A\u9020\u6587\u672C\u5B9A\u4F4D\u3002" }) : null,
        /* @__PURE__ */ jsx("pre", { className: "document-preview", children: s.content || "\uFF08\u6B64\u9875\u65E0\u63D0\u53D6\u6587\u672C\uFF09" }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5F53\u524D\u7A97\u53E3 UTF-16 \u533A\u95F4 [",
          s.base,
          ", ",
          s.cursor,
          ")",
          s.complete ? "\uFF0C\u5DF2\u5230\u8BE5\u9875\u6587\u672C\u672B\u5C3E" : "\uFF1B\u540E\u7EED\u6587\u672C\u5C1A\u672A\u52A0\u8F7D",
          s.base > 0 ? "\uFF1B\u672C\u7A97\u53E3\u4E0D\u5305\u542B\u6B64\u524D\u539F\u6587" : "",
          "\u3002"
        ] }),
        this.props.start !== void 0 ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5F15\u7528\u533A\u95F4 [",
          this.props.start,
          ", ",
          this.props.end,
          ")",
          this.props.end > s.cursor ? " \u5C1A\u672A\u5B8C\u6574\u8F7D\u5165\uFF0C\u8BF7\u7EE7\u7EED\u8BFB\u53D6\u540E\u7EED\u6587\u672C\u3002" : " \u5DF2\u5B9A\u4F4D\uFF0C\u8D77\u6B62\u4F4D\u7F6E\u5DF2\u9884\u9009\u3002"
        ] }) : null,
        /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: s.loading || s.complete, onClick: () => void this.readPage(true), children: "\u8BFB\u53D6\u6B64\u9875\u540E\u7EED\u6587\u672C" }),
        /* @__PURE__ */ jsx("button", { className: "text-button", disabled: s.loading, onClick: () => void this.readPage(), children: "\u91CD\u65B0\u8BFB\u53D6\u6B64\u7269\u7406\u9875" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          void this.props.perform(() => call(this.props.projectId, "document_evidence_register", { documentVersionId: this.props.document.id, parseResultId: this.props.resultId, pageNumber: p.pageNumber, start: s.start, end: s.end, description: s.description }), "\u5DF2\u767B\u8BB0\u7ED1\u5B9A\u539F\u4EF6\u548C\u89E3\u6790\u7248\u672C\u7684\u9875\u6BB5\u8BC1\u636E");
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u9009\u62E9\u5DF2\u52A0\u8F7D\u7684\u63D0\u53D6\u6BB5\u843D",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u63D0\u53D6\u6BB5\u843D", defaultValue: "", onChange: (e) => {
              const paragraph = p.paragraphs.find((x) => String(x.index) === e.target.value);
              if (paragraph) this.setState({ start: paragraph.start, end: paragraph.end });
            }, children: [
              /* @__PURE__ */ jsx("option", { value: "", children: "\u624B\u52A8\u6307\u5B9A\u533A\u95F4\u6216\u9009\u62E9\u6BB5\u843D" }),
              p.paragraphs.map((x) => /* @__PURE__ */ jsxs("option", { value: x.index, disabled: x.start < s.base || x.end > s.cursor, children: [
                "\u6BB5\u843D ",
                x.index,
                " \xB7 [",
                x.start,
                ", ",
                x.end,
                ")",
                x.start < s.base || x.end > s.cursor ? "\uFF08\u4E0D\u5728\u5F53\u524D\u7A97\u53E3\uFF09" : ""
              ] }, x.index))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u8D77\u59CB UTF-16 \u4F4D\u7F6E",
              /* @__PURE__ */ jsx("input", { type: "number", min: s.base, max: s.cursor, required: true, value: s.start, onChange: (e) => this.setState({ start: Number(e.target.value) }) })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u7ED3\u675F UTF-16 \u4F4D\u7F6E",
              /* @__PURE__ */ jsx("input", { type: "number", min: s.start + 1, max: s.cursor, required: true, value: s.end, onChange: (e) => this.setState({ end: Number(e.target.value) }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BC1\u636E\u8BF4\u660E",
            /* @__PURE__ */ jsx("input", { required: true, "aria-label": "\u9875\u6BB5\u8BC1\u636E\u8BF4\u660E", value: s.description, onChange: (e) => this.setState({ description: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsx("blockquote", { "aria-label": "\u9009\u4E2D\u8BC1\u636E\u539F\u6587", children: s.content.slice(Math.max(0, s.start - s.base), Math.max(0, s.end - s.base)) }),
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: s.loading || !!s.error || !s.content.slice(s.start - s.base, s.end - s.base).trim() || s.end > s.cursor || s.start < s.base || s.end <= s.start || !s.description.trim(), children: "\u767B\u8BB0\u56FA\u5B9A\u9875\u6BB5\u8BC1\u636E" })
        ] })
      ] }) : null
    ] });
  }
}
export {
  LiteratureView,
  literatureRequestedVersion,
  literatureSourceURL,
  verifiedPageImage
};
