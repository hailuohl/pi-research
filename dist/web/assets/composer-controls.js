import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
import { ComposerModelMenu } from "./composer-model-menu.js";
const SOURCES = ["alphaxiv", "openalex", "biorxiv", "pubmed", "crossref"];
const SOURCE_NAMES = { alphaxiv: "alphaXiv", openalex: "OpenAlex", biorxiv: "bioRxiv", pubmed: "PubMed", crossref: "Crossref" };
const SOURCE_LOGOS = { alphaxiv: "alphaxiv.svg", openalex: "openalex.svg", biorxiv: "biorxiv.svg", pubmed: "pubmed.png", crossref: "crossref.ico" };
const configCopy = (config) => Object.fromEntries(SOURCES.map((source) => [source, !!config.enabled?.[source]]));
const modelKey = (model) => JSON.stringify([model.provider, model.model]);
function fileType(file) {
  const name = file.name.toLowerCase();
  const extensions = { pdf: "application/pdf", txt: "text/plain", md: "text/markdown", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", mp4: "video/mp4" };
  return extensions[name.slice(name.lastIndexOf(".") + 1)];
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
    this.state = { config: null, sourceDraft: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: false }, sourcesOpen: false, loading: true, loadingError: "", saving: false, uploadError: "", uploading: false, attachmentTypes: null };
    this.mounted = true;
    this.request = 0;
    this.attachmentRequest = 0;
    this.uploadRequest = 0;
  }
  captureUploadError() {
    const upload = this.uploadRequest, capability = this.attachmentRequest, error = this.state.uploadError, project = this.props.projectId, session = this.props.session?.id, model = this.props.session && modelKey(this.props.session.model);
    return () => {
      if (this.mounted && upload === this.uploadRequest && capability === this.attachmentRequest && project === this.props.projectId && session === this.props.session?.id && model === (this.props.session && modelKey(this.props.session.model)) && error === this.state.uploadError && !this.state.uploading)
        this.setState({ uploadError: "" });
    };
  }
  componentDidMount() {
    void this.loadSources();
    void this.loadAttachmentTypes();
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId) {
      this.sourceWrite = void 0;
      this.setState({ saving: false });
    }
    if (previous.projectId !== this.props.projectId || previous.readSuspended !== this.props.readSuspended) void this.loadSources();
    if (previous.readSuspended !== this.props.readSuspended || previous.projectArchived !== this.props.projectArchived || previous.boot.modelManagement?.version !== this.props.boot.modelManagement?.version || previous.boot.modelManagementError !== this.props.boot.modelManagementError || previous.session?.id !== this.props.session?.id || previous.session?.state !== this.props.session?.state || previous.session?.role !== this.props.session?.role || previous.session?.taskId !== this.props.session?.taskId || previous.session?.teamId !== this.props.session?.teamId || previous.session?.model.provider !== this.props.session?.model.provider || previous.session?.model.model !== this.props.session?.model.model) void this.loadAttachmentTypes();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.sourceWrite = void 0;
    this.request++;
    this.attachmentRequest++;
    this.sourceController?.abort();
    this.attachmentController?.abort();
  }
  async loadAttachmentTypes() {
    const session = this.props.session, request = ++this.attachmentRequest;
    this.attachmentController?.abort();
    this.setState({ attachmentTypes: null });
    if (!this.mounted || this.props.readSuspended || this.props.projectArchived || !session || session.state === "archived" || session.role !== "coordinator" || session.taskId || session.teamId) {
      if (this.mounted) this.setState({ uploadError: "" });
      return;
    }
    const controller = new AbortController();
    this.attachmentController = controller;
    try {
      const types = await api(`/sessions/${session.id}/attachment-types`, void 0, "GET", controller.signal);
      if (this.mounted && !controller.signal.aborted && request === this.attachmentRequest && this.props.session?.id === session.id && modelKey(this.props.session.model) === modelKey(session.model) && modelKey(types.model) === modelKey(session.model)) this.setState({ attachmentTypes: types, uploadError: "" });
    } catch (error) {
      if (this.mounted && !controller.signal.aborted && request === this.attachmentRequest) {
        this.uploadRequest++;
        this.setState({ uploadError: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      if (this.attachmentController === controller) this.attachmentController = void 0;
    }
  }
  allowedTypes() {
    const available = this.state.attachmentTypes, model = this.props.session?.model;
    return available && available.model.provider === model?.provider && available.model.model === model?.model ? available.types : [{ mediaType: "text/plain", extensions: [".txt"], maxBytes: 32 * 1024 * 1024, native: false }, { mediaType: "text/markdown", extensions: [".md"], maxBytes: 32 * 1024 * 1024, native: false }];
  }
  async loadSources() {
    const request = ++this.request, projectId = this.props.projectId, write = this.sourceWrite;
    this.sourceController?.abort();
    if (!this.mounted) return;
    if (this.props.readSuspended || write?.pending) {
      this.setState({ loading: false, loadingError: write?.error ?? "" });
      return;
    }
    const controller = new AbortController();
    this.sourceController = controller;
    this.setState({ loading: true, loadingError: write?.error ?? "" });
    try {
      const config = await api(`/projects/${encodeURIComponent(projectId)}/connectors`, void 0, "GET", controller.signal);
      if (this.mounted && !controller.signal.aborted && request === this.request && projectId === this.props.projectId)
        this.setState({ config, sourceDraft: configCopy(config), loading: false, loadingError: write?.error ?? "" });
    } catch (error) {
      if (this.mounted && !controller.signal.aborted && request === this.request)
        this.setState((current) => ({ loading: false, config: write?.error ? null : current.config, loadingError: write?.error ? write.error + "\uFF1B\u6765\u6E90\u72B6\u6001\u672A\u786E\u8BA4\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u83DC\u5355\u91CD\u8BD5\u3002" : error instanceof Error ? error.message : String(error) }));
    } finally {
      if (this.sourceController === controller) this.sourceController = void 0;
    }
  }
  async configureSource(source, enabled) {
    const { config } = this.state;
    if (!config || this.state.loading || this.state.saving || this.props.busy || this.props.projectArchived) return;
    const projectId = this.props.projectId, write = { projectId, pending: true, error: "" }, current = () => this.mounted && this.sourceWrite === write && projectId === this.props.projectId;
    this.sourceWrite = write;
    this.request++;
    this.sourceController?.abort();
    this.setState({ saving: true, loadingError: "", sourceDraft: { ...this.state.sourceDraft, [source]: enabled } });
    await this.props.perform(async () => {
      try {
        const saved = await api(`/projects/${encodeURIComponent(projectId)}/connectors`, { expectedVersion: config.version, enabled: { [source]: enabled } });
        if (current()) this.setState({ config: saved, sourceDraft: configCopy(saved) });
      } catch (error) {
        if (!current()) return;
        write.error = error instanceof Error ? error.message : String(error);
        write.pending = false;
        this.setState({ sourceDraft: configCopy(config), loadingError: write.error });
        await this.loadSources();
      } finally {
        write.pending = false;
        if (current()) this.setState({ saving: false });
      }
    });
  }
  async addFiles(files) {
    const { attachments, projectId, session } = this.props;
    if (!session || this.state.uploading) return;
    this.uploadRequest++;
    if (attachments.length + files.length > 5) {
      this.setState({ uploadError: "\u8349\u7A3F\u6700\u591A\u9644\u52A0 5 \u4E2A\u6587\u4EF6\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" });
      return;
    }
    const typed = files.map((file) => ({ file, mediaType: fileType(file) })), allowed = this.allowedTypes();
    const invalid = typed.find((item) => !allowed.some((t) => t.mediaType === item.mediaType) || !item.file.size || item.file.size > allowed.find((t) => t.mediaType === item.mediaType).maxBytes);
    if (invalid) {
      this.setState({ uploadError: "\u6587\u4EF6\u7C7B\u578B\u6216\u5927\u5C0F\u4E0D\u7B26\u5408\u5F53\u524D\u786E\u8BA4\u7684\u9644\u4EF6\u80FD\u529B\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" + (this.state.attachmentTypes?.fileCapabilityReason ?? "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u6A21\u578B\u9644\u4EF6\u80FD\u529B\u3002") });
      return;
    }
    if (attachments.filter((a) => !a.mediaType.startsWith("text/")).reduce((n, a) => n + a.size, 0) + typed.filter((a) => !a.mediaType.startsWith("text/")).reduce((n, a) => n + a.file.size, 0) > 20 * 1024 * 1024) {
      this.setState({ uploadError: "\u8349\u7A3F\u539F\u751F\u9644\u4EF6\u5408\u8BA1\u6700\u591A20 MiB\uFF1B\u5DF2\u4E0A\u4F20\u7684\u9644\u4EF6\u5F15\u7528\u5DF2\u4FDD\u7559\u3002" });
      return;
    }
    const sessionId = session.id;
    this.setState({ uploading: true, uploadError: "" });
    try {
      for (const { file, mediaType } of typed) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (this.props.session?.id !== sessionId || modelKey(this.props.session.model) !== modelKey(session.model)) return;
        const document = await api(`/sessions/${sessionId}/attachments`, { title: file.name, mediaType, contentBase64: toBase64(bytes) });
        if (!this.mounted || this.props.projectId !== projectId || this.props.session?.id !== sessionId) return;
        this.props.onAddAttachment({ documentVersionId: document.id, artifactId: document.original.artifactId, digest: document.original.digest, title: document.title, mediaType: document.original.mediaType, size: document.original.size });
      }
    } catch (error) {
      if (this.mounted) this.setState({ uploadError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted) this.setState({ uploading: false });
    }
  }
  stopSession(sessionId) {
    const { session, busy, projectArchived } = this.props;
    if (!this.mounted || session?.id !== sessionId || busy || projectArchived || session.taskId || !["running", "queued"].includes(session.state)) return;
    const projectId = this.props.projectId, generation = session.generation, onStopped = this.props.onStopped;
    return this.props.perform(async () => {
      const result = await api(`/sessions/${sessionId}/interrupt`, {});
      if (this.mounted && this.props.projectId === projectId && this.props.session?.id === sessionId && this.props.session.generation === generation) onStopped?.();
      return result;
    }, "\u5DF2\u505C\u6B62\u6A21\u578B\uFF1B\u6B63\u5F0F\u5B9E\u9A8C\u672A\u53D6\u6D88");
  }
  render() {
    const { boot, session, projectArchived, modelLocked, busy, attachments, canSend, hasDraft } = this.props;
    const { config, sourceDraft, sourcesOpen, loading, loadingError, uploadError, uploading } = this.state;
    const currentModel = session?.model, modelDisabled = !session || projectArchived || modelLocked || !!session.taskId || !!session.teamId || session.role !== "coordinator" || ["running", "queued", "archived"].includes(session.state);
    const uploadDisabled = !session || projectArchived || !!session.taskId || session.state === "archived" || uploading || attachments.length >= 5;
    const sourceCount = SOURCES.filter((source) => sourceDraft[source]).length;
    const allowed = this.allowedTypes(), unsupported = attachments.some((a) => !allowed.some((t) => t.mediaType === a.mediaType)), accept = allowed.flatMap((t) => [...t.extensions, t.mediaType]).join(",");
    const capabilityKnown = !!session && !!this.state.attachmentTypes && modelKey(this.state.attachmentTypes.model) === modelKey(session.model);
    const executing = !!session && !session.taskId && ["running", "queued"].includes(session.state), showStop = executing && !hasDraft;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      attachments.length ? /* @__PURE__ */ jsx("div", { className: "composer-attachment-list", "aria-label": "\u5F85\u53D1\u9001\u9644\u4EF6", children: attachments.map((attachment) => /* @__PURE__ */ jsxs("span", { className: "composer-attachment", children: [
        /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 14 }),
        /* @__PURE__ */ jsx("span", { title: `\u5DF2\u4FDD\u5B58\u9879\u76EE\u8D44\u6599\uFF1A${attachment.title}`, children: attachment.title }),
        /* @__PURE__ */ jsx("small", { children: attachment.mediaType.startsWith("text/") ? "\u9879\u76EE\u8D44\u6599 \xB7 \u6587\u672C\u539F\u4EF6" : "\u9879\u76EE\u8D44\u6599 \xB7 \u6574\u6587\u4EF6\u968F\u6D88\u606F\u53D1\u9001" }),
        /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `\u4ECE\u8349\u7A3F\u79FB\u9664 ${attachment.title}`, title: "\u53EA\u79FB\u9664\u8349\u7A3F\u5F15\u7528\uFF0C\u4E0D\u5220\u9664\u9879\u76EE\u539F\u4EF6", disabled: busy, onClick: () => this.props.onRemoveAttachment(attachment.documentVersionId), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 13 }) })
      ] }, attachment.documentVersionId)) }) : null,
      unsupported && capabilityKnown && !projectArchived && !this.props.readSuspended && session?.state !== "archived" ? /* @__PURE__ */ jsxs("p", { className: "error-text composer-control-error", role: "alert", children: [
        "\u8349\u7A3F\u9644\u4EF6\u8D85\u51FA\u5F53\u524D\u786E\u8BA4\u7684\u8F93\u5165\u80FD\u529B\uFF1B\u9644\u4EF6\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5207\u6362\u652F\u6301\u7684\u6A21\u578B\u6216\u79FB\u9664\u5F15\u7528\u3002",
        this.state.attachmentTypes?.fileCapabilityReason
      ] }) : null,
      unsupported && !capabilityKnown && !projectArchived && !this.props.readSuspended && session?.state !== "archived" ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6B63\u5728\u786E\u8BA4\u5F53\u524D\u6A21\u578B\u7684\u9644\u4EF6\u80FD\u529B\uFF1B\u9644\u4EF6\u5DF2\u4FDD\u7559\u3002" }) : null,
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
          /* @__PURE__ */ jsxs("label", { className: "composer-tool-button composer-file-button" + (uploadDisabled ? " disabled" : ""), "aria-label": "\u6DFB\u52A0\u5F53\u524D\u6A21\u578B\u652F\u6301\u7684\u9644\u4EF6", children: [
            /* @__PURE__ */ jsx(Icon, { name: "paperclip", size: 16 }),
            /* @__PURE__ */ jsx("span", { children: "\u9644\u4EF6" }),
            attachments.length ? /* @__PURE__ */ jsx("small", { children: attachments.length }) : null,
            /* @__PURE__ */ jsx("input", { type: "file", multiple: true, accept, disabled: uploadDisabled, onChange: (event) => {
              const files = Array.from(event.currentTarget.files ?? []);
              event.currentTarget.value = "";
              void this.addFiles(files);
            } })
          ] }),
          this.props.children
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grow" }),
        /* @__PURE__ */ jsx(ComposerModelMenu, { sessionId: session?.id ?? "none", current: currentModel, management: boot.modelManagement, error: boot.modelManagementError, busy, disabled: modelDisabled, locked: modelLocked, onSelect: this.props.onSendModel }),
        this.props.permissionControl,
        /* @__PURE__ */ jsxs("button", { className: "primary compact composer-submit-control", type: showStop ? "button" : "submit", "aria-label": showStop ? "\u505C\u6B62\u6A21\u578B" : session?.state === "running" ? "\u6392\u961F\u53D1\u9001" : "\u53D1\u9001", title: showStop ? "\u505C\u6B62\u5F53\u524D\u5BF9\u8BDD\u4EFB\u52A1" : session?.state === "running" ? "\u5F53\u524D\u5DE5\u4F5C\u7ED3\u675F\u540E\u5904\u7406" : "\u53D1\u9001\u6D88\u606F", "data-action": showStop ? "stop" : "send", disabled: showStop ? busy || projectArchived : !canSend || !hasDraft || !session || unsupported, onClick: showStop ? () => this.stopSession(session.id) : void 0, children: [
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
