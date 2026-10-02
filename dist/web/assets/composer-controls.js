import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
const SOURCES = ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
const SOURCE_NAMES = { alphaxiv: "alphaXiv", openalex: "OpenAlex", biorxiv: "bioRxiv", pubmed: "PubMed", crossref: "Crossref" };
const configCopy = (config) => Object.fromEntries(SOURCES.map((source) => [source, !!config.enabled?.[source]]));
const modelKey = (model) => JSON.stringify([model.provider, model.model, model.thinking]);
function fileType(file) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") ? "application/pdf" : name.endsWith(".txt") ? "text/plain" : name.endsWith(".md") ? "text/markdown" : void 0;
}
function toBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32768)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return btoa(binary);
}
class ComposerControls extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { config: null, sourceDraft: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: false }, sourcesOpen: false, loading: true, loadingError: "", uploadError: "", uploading: false };
    this.mounted = true;
    this.request = 0;
    this.saveSources = () => {
      const { config } = this.state;
      if (!config || this.props.busy || this.props.projectArchived) return;
      const projectId = this.props.projectId;
      return this.props.perform(async () => {
        const saved = await api(`/projects/${encodeURIComponent(projectId)}/connectors`, { expectedVersion: config.version, enabled: this.state.sourceDraft });
        if (this.mounted && projectId === this.props.projectId)
          this.setState({ config: saved, sourceDraft: configCopy(saved), sourcesOpen: false, loadingError: "" });
      }, "\u5DF2\u4FDD\u5B58\u9879\u76EE\u7EA7\u6587\u732E\u6765\u6E90\u5F00\u5173\uFF1B\u6CA1\u6709\u53D1\u8D77\u7F51\u7EDC\u68C0\u7D22");
    };
  }
  componentDidMount() {
    void this.loadSources();
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId) void this.loadSources();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.request++;
  }
  async loadSources() {
    const request = ++this.request, projectId = this.props.projectId;
    this.setState({ loading: true, loadingError: "" });
    try {
      const config = await api(`/projects/${encodeURIComponent(projectId)}/connectors`);
      if (this.mounted && request === this.request && projectId === this.props.projectId)
        this.setState({ config, sourceDraft: configCopy(config), loading: false });
    } catch (error) {
      if (this.mounted && request === this.request)
        this.setState({ loading: false, loadingError: error instanceof Error ? error.message : String(error) });
    }
  }
  async addFiles(files) {
    const { attachments, projectId, session } = this.props;
    if (!session || this.state.uploading) return;
    if (attachments.length + files.length > 5) {
      this.setState({ uploadError: "\u8349\u7A3F\u6700\u591A\u9644\u52A0 5 \u4E2A\u6587\u4EF6\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" });
      return;
    }
    const typed = files.map((file) => ({ file, mediaType: fileType(file) }));
    const invalid = typed.find((item) => !item.mediaType || !item.file.size || item.file.size > 32 * 1024 * 1024);
    if (invalid) {
      this.setState({ uploadError: !invalid.mediaType ? "\u4EC5\u652F\u6301 PDF\u3001TXT\u3001MD \u6587\u4EF6\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" : "\u6587\u4EF6\u987B\u4E3A 1 byte\u201332 MiB\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" });
      return;
    }
    const sessionId = session.id;
    this.setState({ uploading: true, uploadError: "" });
    try {
      for (const { file, mediaType } of typed) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const document = await api("/operations/document_import", { projectId, input: { title: file.name, mediaType, contentBase64: toBase64(bytes) } });
        if (!this.mounted || this.props.projectId !== projectId || this.props.session?.id !== sessionId) return;
        this.props.onAddAttachment({ documentVersionId: document.id, artifactId: document.original.artifactId, digest: document.original.digest, title: document.title, mediaType: document.original.mediaType, size: document.original.size });
      }
    } catch (error) {
      if (this.mounted) this.setState({ uploadError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted) this.setState({ uploading: false });
    }
  }
  modelOptions() {
    const { boot, session } = this.props, models = [...boot.models ?? [], boot.model, ...session ? [session.model] : []];
    const unique = /* @__PURE__ */ new Map();
    for (const model of models) if (model?.provider && model.model) unique.set(modelKey(model), model);
    return [...unique.values()];
  }
  render() {
    const { boot, session, projectArchived, modelLocked, busy, attachments, canSend, hasDraft } = this.props;
    const { config, sourceDraft, sourcesOpen, loading, loadingError, uploadError, uploading } = this.state;
    const currentModel = session?.model, options = this.modelOptions(), modelDisabled = !session || projectArchived || busy || modelLocked || !!session.taskId || session.role !== "coordinator" || ["running", "queued", "archived"].includes(session.state);
    const uploadDisabled = !session || projectArchived || !!session.taskId || session.state === "archived" || uploading || attachments.length >= 5;
    const sourceCount = SOURCES.filter((source) => sourceDraft[source]).length;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      attachments.length ? /* @__PURE__ */ jsx("div", { className: "composer-attachment-list", "aria-label": "\u5F85\u53D1\u9001\u9644\u4EF6", children: attachments.map((attachment) => /* @__PURE__ */ jsxs("span", { className: "composer-attachment", children: [
        /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 14 }),
        /* @__PURE__ */ jsx("span", { title: `\u5DF2\u4FDD\u5B58\u9879\u76EE\u8D44\u6599\uFF1A${attachment.title}`, children: attachment.title }),
        /* @__PURE__ */ jsx("small", { children: attachment.mediaType === "application/pdf" ? "\u9879\u76EE\u8D44\u6599 \xB7 PDF \u539F\u4EF6 \xB7 \u9700\u663E\u5F0F\u89E3\u6790" : "\u9879\u76EE\u8D44\u6599 \xB7 \u6587\u672C\u539F\u4EF6" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `\u4ECE\u8349\u7A3F\u79FB\u9664 ${attachment.title}`, title: "\u53EA\u79FB\u9664\u8349\u7A3F\u5F15\u7528\uFF0C\u4E0D\u5220\u9664\u9879\u76EE\u539F\u4EF6", disabled: busy, onClick: () => this.props.onRemoveAttachment(attachment.documentVersionId), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 13 }) })
      ] }, attachment.documentVersionId)) }) : null,
      uploadError ? /* @__PURE__ */ jsx("p", { className: "error-text composer-control-error", role: "alert", children: uploadError }) : null,
      /* @__PURE__ */ jsxs("div", { className: "composer-toolbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "composer-control-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "source-control", children: [
            /* @__PURE__ */ jsxs("button", { type: "button", className: "composer-tool-button", "aria-expanded": sourcesOpen, "aria-controls": "composer-source-menu", disabled: !session || projectArchived || busy, onClick: () => this.setState({ sourcesOpen: !sourcesOpen }), children: [
              /* @__PURE__ */ jsx(Icon, { name: "database", size: 16 }),
              /* @__PURE__ */ jsx("span", { children: "\u6765\u6E90" }),
              /* @__PURE__ */ jsxs("small", { children: [
                sourceCount,
                "/5"
              ] })
            ] }),
            sourcesOpen ? /* @__PURE__ */ jsxs("div", { className: "composer-popover", id: "composer-source-menu", role: "group", "aria-label": "\u9879\u76EE\u6587\u732E\u6765\u6E90", onKeyDown: (event) => {
              if (event.key === "Escape") this.setState({ sourcesOpen: false });
            }, children: [
              /* @__PURE__ */ jsxs("div", { className: "composer-popover-heading", children: [
                /* @__PURE__ */ jsx("strong", { children: "\u6587\u732E\u6765\u6E90" }),
                /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u5173\u95ED\u6765\u6E90\u8BBE\u7F6E", onClick: () => this.setState({ sourcesOpen: false }), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 14 }) })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53EA\u4FDD\u5B58\u9879\u76EE\u7EA7\u5F00\u5173\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u68C0\u7D22\u3002" }),
              loading ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }) : null,
              loadingError ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: loadingError }) : null,
              SOURCES.map((source) => /* @__PURE__ */ jsxs("label", { className: "composer-source-option", children: [
                /* @__PURE__ */ jsx(Icon, { name: source === "openalex" ? "network" : source === "biorxiv" ? "microscope" : source === "crossref" ? "link" : "book-open", size: 15 }),
                /* @__PURE__ */ jsx("span", { children: SOURCE_NAMES[source] }),
                /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u542F\u7528 ${SOURCE_NAMES[source]}`, checked: sourceDraft[source], disabled: !config || busy || projectArchived, onChange: (event) => this.setState({ sourceDraft: { ...sourceDraft, [source]: event.target.checked } }) })
              ] }, source)),
              /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: !config || loading || busy || projectArchived, onClick: this.saveSources, children: "\u4FDD\u5B58\u6765\u6E90\u5F00\u5173" })
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "composer-tool-button composer-file-button" + (uploadDisabled ? " disabled" : ""), "aria-label": "\u6DFB\u52A0 PDF\u3001TXT \u6216 MD \u9644\u4EF6", children: [
            /* @__PURE__ */ jsx(Icon, { name: "paperclip", size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "\u9644\u4EF6" }),
            attachments.length ? /* @__PURE__ */ jsx("small", { children: attachments.length }) : null,
            /* @__PURE__ */ jsx("input", { type: "file", multiple: true, accept: ".pdf,.txt,.md,application/pdf,text/plain,text/markdown", disabled: uploadDisabled, onChange: (event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              void this.addFiles(files);
            } })
          ] }),
          this.props.children
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grow" }),
        session?.state === "running" && !session.taskId ? /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => this.props.perform(() => api(`/sessions/${session.id}/interrupt`, {}), "\u5DF2\u505C\u6B62 Agent\uFF1B\u6B63\u5F0F\u5B9E\u9A8C\u672A\u53D6\u6D88"), children: [
          /* @__PURE__ */ jsx(Icon, { name: "stop", size: 14 }),
          "\u505C\u6B62 Agent"
        ] }) : null,
        /* @__PURE__ */ jsxs("label", { className: "composer-model-control", children: [
          /* @__PURE__ */ jsx(Icon, { name: "cpu", size: 15 }),
          /* @__PURE__ */ jsx("span", { children: "\u6A21\u578B" }),
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u4F1A\u8BDD\u6A21\u578B\u4E0E\u601D\u8003\u7B49\u7EA7", value: currentModel?.provider && currentModel.model ? modelKey(currentModel) : "", disabled: modelDisabled, title: modelLocked ? "\u5F53\u524D\u4F1A\u8BDD\u5DF2\u7ED1\u5B9A\u56FA\u5B9A\u6388\u6743\uFF0C\u6A21\u578B\u4E0D\u80FD\u66F4\u6539" : "\u5F53\u524D\u4F1A\u8BDD\u8FD0\u884C\u6216\u6388\u6743\u72B6\u6001\u4E0B\u6682\u4E0D\u53EF\u66F4\u6539\u6A21\u578B", onChange: (event) => {
            const selected = options.find((model) => modelKey(model) === event.target.value);
            if (selected && (!currentModel || modelKey(selected) !== modelKey(currentModel))) this.props.onSendModel(selected);
          }, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: currentModel?.provider && currentModel.model ? "\u9009\u62E9\u6A21\u578B" : "\u672A\u914D\u7F6E\u6A21\u578B" }),
            options.map((model) => /* @__PURE__ */ jsxs("option", { value: modelKey(model), children: [
              model.provider,
              " / ",
              model.model,
              " \xB7 ",
              model.thinking,
              modelKey(model) === modelKey(boot.model) ? "\uFF08\u9ED8\u8BA4\uFF09" : ""
            ] }, modelKey(model)))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "primary compact", type: "submit", disabled: !canSend || !hasDraft || !session, children: [
          /* @__PURE__ */ jsx(Icon, { name: "arrow", size: 16 }),
          "\u53D1\u9001"
        ] })
      ] })
    ] });
  }
}
export {
  ComposerControls
};
