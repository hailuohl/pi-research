import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
import { ComposerModelMenu } from "./composer-model-menu.js";
const SOURCES = ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
const SOURCE_NAMES = { alphaxiv: "alphaXiv", openalex: "OpenAlex", biorxiv: "bioRxiv", pubmed: "PubMed", crossref: "Crossref" };
const SOURCE_LOGOS = { alphaxiv: "alphaxiv.svg", openalex: "openalex.svg", biorxiv: "biorxiv.svg", pubmed: "pubmed.png", crossref: "crossref.ico" };
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
    this.state = { config: null, sourceDraft: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: false }, sourcesOpen: false, loading: true, loadingError: "", saving: false, uploadError: "", uploading: false };
    this.mounted = true;
    this.request = 0;
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
  async configureSource(source, enabled) {
    const { config } = this.state;
    if (!config || this.state.loading || this.state.saving || this.props.busy || this.props.projectArchived) return;
    const projectId = this.props.projectId, request = this.request, current = () => this.mounted && request === this.request && projectId === this.props.projectId;
    this.setState({ saving: true, loadingError: "", sourceDraft: { ...this.state.sourceDraft, [source]: enabled } });
    await this.props.perform(async () => {
      try {
        const saved = await api(`/projects/${encodeURIComponent(projectId)}/connectors`, { expectedVersion: config.version, enabled: { [source]: enabled } });
        if (current()) this.setState({ config: saved, sourceDraft: configCopy(saved) });
      } catch (error) {
        if (!current()) return;
        const message = error instanceof Error ? error.message : String(error);
        try {
          const latest = await api(`/projects/${encodeURIComponent(projectId)}/connectors`);
          if (current()) this.setState({ config: latest, sourceDraft: configCopy(latest), loadingError: message });
        } catch {
          if (current()) this.setState({ config: null, sourceDraft: configCopy(config), loadingError: message + "\uFF1B\u6765\u6E90\u72B6\u6001\u672A\u786E\u8BA4\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u83DC\u5355\u91CD\u8BD5\u3002" });
        }
      } finally {
        if (current()) this.setState({ saving: false });
      }
    });
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
    const { boot } = this.props, models = boot.models ?? [boot.model];
    const unique = /* @__PURE__ */ new Map();
    for (const model of models) if (model?.provider && model.model) unique.set(modelKey(model), model);
    return [...unique.values()];
  }
  stopSession(sessionId) {
    const { session, busy, projectArchived } = this.props;
    if (!this.mounted || session?.id !== sessionId || busy || projectArchived || session.taskId || !["running", "queued"].includes(session.state)) return;
    return this.props.perform(() => api(`/sessions/${sessionId}/interrupt`, {}), "\u5DF2\u505C\u6B62\u6A21\u578B\uFF1B\u6B63\u5F0F\u5B9E\u9A8C\u672A\u53D6\u6D88");
  }
  render() {
    const { boot, session, projectArchived, modelLocked, busy, attachments, canSend, hasDraft } = this.props;
    const { config, sourceDraft, sourcesOpen, loading, loadingError, uploadError, uploading } = this.state;
    const currentModel = session?.model, options = this.modelOptions(), modelDisabled = !session || projectArchived || busy || modelLocked || !!session.taskId || session.role !== "coordinator" || ["running", "queued", "archived"].includes(session.state);
    const uploadDisabled = !session || projectArchived || !!session.taskId || session.state === "archived" || uploading || attachments.length >= 5;
    const sourceCount = SOURCES.filter((source) => sourceDraft[source]).length;
    const executing = !!session && !session.taskId && ["running", "queued"].includes(session.state), showStop = executing && !hasDraft;
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
            /* @__PURE__ */ jsxs("button", { type: "button", className: "composer-tool-button", "aria-expanded": sourcesOpen, "aria-controls": "composer-source-menu", disabled: !session || projectArchived || busy, onClick: () => {
              const opening = !sourcesOpen;
              this.setState({ sourcesOpen: opening });
              if (opening && !this.state.config) void this.loadSources();
            }, children: [
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
              loading ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B63\u5728\u8BFB\u53D6\u8BBE\u7F6E\u2026" }) : null,
              loadingError ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: loadingError }) : null,
              SOURCES.map((source) => /* @__PURE__ */ jsxs("label", { className: "composer-source-option", children: [
                /* @__PURE__ */ jsx("img", { className: "composer-source-logo", src: "/source-logos/" + SOURCE_LOGOS[source], width: 16, height: 16, alt: "", "aria-hidden": "true" }),
                /* @__PURE__ */ jsx("span", { children: SOURCE_NAMES[source] }),
                /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u542F\u7528 ${SOURCE_NAMES[source]}`, checked: sourceDraft[source], disabled: !config || loading || this.state.saving || busy || projectArchived, onChange: (event) => {
                  void this.configureSource(source, event.target.checked);
                } })
              ] }, source))
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
        /* @__PURE__ */ jsx(ComposerModelMenu, { sessionId: session?.id ?? "none", current: currentModel, options, disabled: modelDisabled, locked: modelLocked, onSelect: this.props.onSendModel }),
        this.props.permissionControl,
        /* @__PURE__ */ jsxs("button", { className: "primary compact composer-submit-control", type: showStop ? "button" : "submit", "aria-label": showStop ? "\u505C\u6B62\u6A21\u578B" : executing ? "\u6392\u961F\u53D1\u9001" : "\u53D1\u9001", title: showStop ? "\u505C\u6B62\u5F53\u524D\u5BF9\u8BDD\u4EFB\u52A1" : executing ? "\u53D1\u9001\u5230\u961F\u5217" : "\u53D1\u9001\u6D88\u606F", "data-action": showStop ? "stop" : "send", disabled: showStop ? busy || projectArchived : !canSend || !hasDraft || !session, onClick: showStop ? () => this.stopSession(session.id) : void 0, children: [
          /* @__PURE__ */ jsx(Icon, { name: showStop ? "stop" : "arrow", size: 16 }),
          showStop ? "\u505C\u6B62" : "\u53D1\u9001"
        ] })
      ] })
    ] });
  }
}
export {
  ComposerControls
};
