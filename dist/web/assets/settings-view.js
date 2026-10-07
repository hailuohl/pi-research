import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Icon, SectionTitle, nativeSelectButton } from "./ui.js";
import { GitHubSettings } from "./github-controls.js";
import { TemplateLibraryView } from "./template-library-view.js";
const modelKey = (model) => JSON.stringify([model.provider, model.model]);
const sameModel = (first, second) => modelKey(first) === modelKey(second) && first.thinking === second.thinking;
const apiNames = { "openai-completions": "OpenAI Chat Completions", "openai-responses": "OpenAI Responses", "anthropic-messages": "Anthropic Messages" };
class SettingsView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { provider: this.props.boot.model.provider, model: this.props.boot.model.model, thinking: this.props.boot.model.thinking, savedChoice: modelKey(this.props.boot.model), section: "models", activeProvider: this.props.boot.model.provider, connections: null, drafts: {}, connectionLoading: false, connectionBusy: false, connectionError: "", connectionMessage: "", modelBusy: false, modelRefreshing: false, modelError: "", modelMessage: "", modelVersion: this.props.boot.modelVersion ?? 0, savedVersion: this.props.boot.modelVersion ?? 0, modelDirty: false, currentDefault: this.props.boot.model, savedModels: [] };
    this.disposed = false;
    this.loadEpoch = 0;
  }
  componentDidMount() {
    void this.loadConnections(false);
  }
  componentDidUpdate(previous) {
    if (previous.boot.modelVersion !== this.props.boot.modelVersion || !sameModel(previous.boot.model, this.props.boot.model)) {
      const { model, modelVersion = 0 } = this.props.boot;
      this.setState((current) => ({ ...current, savedVersion: modelVersion, currentDefault: model, savedModels: [], ...!current.modelDirty ? { modelVersion, provider: model.provider, model: model.model, thinking: model.thinking, savedChoice: modelKey(model) } : {} }));
    }
  }
  componentWillUnmount() {
    this.disposed = true;
    this.loadEpoch++;
  }
  models() {
    return [...new Map([...this.props.boot.models ?? [], ...this.state.savedModels, this.state.currentDefault].filter((model) => model.provider && model.model).map((model) => [modelKey(model), model])).values()].slice(-20);
  }
  connection() {
    return this.state.connections?.connections.find((connection) => connection.provider === this.state.activeProvider);
  }
  draft() {
    const saved = this.connection(), key = this.state.activeProvider || "__new", own = Object.prototype.hasOwnProperty.call(this.state.drafts, key) ? this.state.drafts[key] : null;
    return own?.dirty ? own : { provider: this.state.activeProvider, name: saved?.name ?? "", baseUrl: saved?.baseUrl ?? "", api: saved?.api ?? this.state.connections?.supportedApis[0] ?? "openai-completions", apiKey: "", dirty: false, version: this.state.connections?.version ?? 0 };
  }
  updateDraft(update) {
    const key = this.state.activeProvider || "__new", draft = this.draft();
    this.setState((current) => ({ drafts: { ...current.drafts, [key]: { ...draft, ...update, dirty: true } }, connectionMessage: "" }));
  }
  updateModel(update, savedChoice = "") {
    this.setState((current) => {
      const model = { provider: current.provider, model: current.model, thinking: current.thinking, ...update }, modelDirty = !sameModel(model, current.currentDefault);
      return { ...model, savedChoice, modelDirty, modelVersion: modelDirty ? current.modelVersion : current.savedVersion, modelMessage: "" };
    });
  }
  choose(model) {
    if (this.state.connectionBusy || this.state.modelBusy || this.state.modelRefreshing) return;
    this.updateModel(model, modelKey(model));
    this.setState({ activeProvider: model.provider, connectionError: "", connectionMessage: "", modelError: "" });
  }
  chooseProvider(provider) {
    if (this.state.connectionBusy || this.state.modelBusy || this.state.modelRefreshing) return;
    const model = this.models().find((model2) => model2.provider === provider);
    if (model) this.choose(model);
    else {
      this.updateModel({ provider, model: "", thinking: "off" });
      this.setState({ activeProvider: provider, connectionError: "", connectionMessage: "", modelError: "" });
    }
  }
  async loadConnections(acceptCurrentDraft = true) {
    const epoch = ++this.loadEpoch, draftKey = this.state.activeProvider || "__new";
    this.setState({ connectionLoading: true, connectionError: "" });
    try {
      const data = this.safeConnections(await api("/settings/model-connections"));
      if (!this.disposed && epoch === this.loadEpoch) this.setState((current) => ({ connections: data, drafts: acceptCurrentDraft && Object.prototype.hasOwnProperty.call(current.drafts, draftKey) && current.drafts[draftKey].dirty ? { ...current.drafts, [draftKey]: { ...current.drafts[draftKey], version: data.version } } : current.drafts }));
    } catch (error) {
      if (!this.disposed && epoch === this.loadEpoch) this.setState({ connectionError: String(error) });
    } finally {
      if (!this.disposed && epoch === this.loadEpoch) this.setState({ connectionLoading: false });
    }
  }
  safeConnections(data) {
    return { version: data.version, supportedApis: data.supportedApis, liveVerified: false, connections: data.connections.map(({ provider, name, baseUrl, api: api2, hasApiKey }) => ({ provider, name, baseUrl, api: api2, hasApiKey })) };
  }
  async saveConnection() {
    if (this.state.connectionBusy || this.state.modelBusy || this.state.connectionLoading || !this.state.connections) return;
    const draft = this.draft(), draftKey = this.state.activeProvider || "__new", saved = this.connection();
    if (!draft.apiKey.trim() && !saved?.hasApiKey) {
      this.setState({ connectionError: "\u9996\u6B21\u4FDD\u5B58\u8FDE\u63A5\u9700\u8981 API Key\u3002" });
      return;
    }
    const request = { expectedVersion: draft.dirty ? draft.version : this.state.connections.version, provider: draft.provider.trim(), name: draft.name.trim(), baseUrl: draft.baseUrl.trim(), api: draft.api, ...draft.apiKey ? { apiKey: draft.apiKey } : {} };
    const body = JSON.stringify(request);
    if (this.connectionMutation?.body !== body) this.connectionMutation = { body, key: crypto.randomUUID() };
    const requestKey = this.connectionMutation.key;
    this.setState({ connectionBusy: true, connectionError: "", connectionMessage: "" });
    try {
      await this.props.perform(async () => {
        try {
          const result = this.safeConnections(await api("/settings/model-connections", request, "POST", void 0, requestKey));
          this.connectionMutation = void 0;
          if (this.disposed) return;
          const connection = result.connections.find((row) => row.provider === request.provider);
          this.setState((current) => {
            const drafts = { ...current.drafts };
            delete drafts[draftKey];
            drafts[connection.provider] = { provider: connection.provider, name: connection.name, baseUrl: connection.baseUrl, api: connection.api, apiKey: "", dirty: false, version: result.version };
            const modelDirty = !sameModel({ provider: connection.provider, model: current.model, thinking: current.thinking }, current.currentDefault);
            return { connections: result, drafts, activeProvider: connection.provider, provider: connection.provider, modelDirty, modelVersion: modelDirty ? current.modelVersion : current.savedVersion, savedChoice: current.provider === connection.provider ? current.savedChoice : "", connectionMessage: "\u8FDE\u63A5\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u771F\u5B9E\u8FDE\u63A5\u5F85\u9A8C\u8BC1\u3002" };
          });
        } catch (error) {
          if (!this.disposed) this.setState({ connectionError: this.errorMessage(error, draft.apiKey) + (error instanceof ApiError && error.status === 409 ? " \u8BF7\u5237\u65B0\u8FDE\u63A5\u7248\u672C\u540E\u91CD\u8BD5\uFF0C\u5F53\u524D\u8F93\u5165\u4F1A\u4FDD\u7559\u3002" : "") });
          throw new Error(this.errorMessage(error, draft.apiKey));
        }
      }, "\u8FDE\u63A5\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u771F\u5B9E\u8FDE\u63A5\u5F85\u9A8C\u8BC1");
    } catch {
    } finally {
      if (!this.disposed) this.setState({ connectionBusy: false });
    }
  }
  errorMessage(error, key = "") {
    const message = error instanceof Error ? error.message : String(error);
    return key ? message.split(key).join("[\u5DF2\u9690\u85CF]") : message;
  }
  async refreshDefault() {
    if (this.state.modelBusy || this.state.connectionBusy || this.state.modelRefreshing) return;
    this.setState({ modelRefreshing: true, modelError: "" });
    try {
      const boot = await api("/bootstrap");
      if (!this.disposed) this.setState((current) => ({ modelVersion: boot.modelVersion ?? 0, savedVersion: boot.modelVersion ?? 0, modelDirty: !sameModel({ provider: current.provider, model: current.model, thinking: current.thinking }, boot.model), currentDefault: boot.model, savedModels: boot.models ?? [], modelMessage: "\u9ED8\u8BA4\u6A21\u578B\u7248\u672C\u5DF2\u5237\u65B0\uFF0C\u5F53\u524D\u7F16\u8F91\u4FDD\u7559\u3002" }));
    } catch (error) {
      if (!this.disposed) this.setState({ modelError: this.errorMessage(error) });
    } finally {
      if (!this.disposed) this.setState({ modelRefreshing: false });
    }
  }
  async saveModel() {
    if (this.state.modelBusy || this.state.connectionBusy || this.state.modelRefreshing) return;
    const model = { provider: this.state.provider, model: this.state.model, thinking: this.state.thinking };
    const request = { ...model, expectedVersion: this.state.modelVersion }, body = JSON.stringify(request);
    if (this.modelMutation?.body !== body) this.modelMutation = { body, key: crypto.randomUUID() };
    const requestKey = this.modelMutation.key;
    this.setState({ modelBusy: true, modelError: "", modelMessage: "" });
    try {
      await this.props.perform(async () => {
        try {
          const saved = await api("/settings/model", request, "POST", void 0, requestKey);
          this.modelMutation = void 0;
          if (!this.disposed) this.setState({ savedChoice: modelKey(saved.model ?? model), modelVersion: saved.version ?? this.state.modelVersion, savedVersion: saved.version ?? this.state.savedVersion, modelDirty: false, provider: (saved.model ?? model).provider, model: (saved.model ?? model).model, thinking: (saved.model ?? model).thinking, currentDefault: saved.model ?? model, savedModels: saved.models ?? this.state.savedModels, modelMessage: "\u9ED8\u8BA4\u6A21\u578B\u5DF2\u4FDD\u5B58\uFF0C\u4EC5\u7528\u4E8E\u65B0\u4F1A\u8BDD\u3002" });
        } catch (error) {
          if (!this.disposed) this.setState({ modelError: this.errorMessage(error) + (error instanceof ApiError && error.status === 409 ? " \u8BF7\u5237\u65B0\u9ED8\u8BA4\u6A21\u578B\u7248\u672C\u540E\u91CD\u8BD5\uFF0C\u5F53\u524D\u8F93\u5165\u4F1A\u4FDD\u7559\u3002" : "") });
          throw error;
        }
      }, "\u5DF2\u4FDD\u5B58\u9ED8\u8BA4\u6A21\u578B\uFF1B\u4FDD\u5B58\u4E0D\u4EE3\u8868\u4F9B\u5E94\u5546\u8FDE\u63A5\u6210\u529F");
    } catch {
    } finally {
      if (!this.disposed) this.setState({ modelBusy: false });
    }
  }
  render() {
    const { boot } = this.props, s = this.state, models = this.models(), connections = s.connections?.connections ?? [];
    const providers = [.../* @__PURE__ */ new Set([...models.map((model) => model.provider), ...connections.map((connection2) => connection2.provider)])];
    const providerModels = models.filter((model) => model.provider === s.activeProvider), connection = this.connection(), draft = this.draft(), locked = s.connectionBusy || s.modelBusy || s.modelRefreshing, currentDefault = s.currentDefault;
    return /* @__PURE__ */ jsx("div", { className: "page-scroll settings-page", children: /* @__PURE__ */ jsxs("div", { className: "settings-workspace", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u8BBE\u7F6E", sub: "\u7BA1\u7406\u6A21\u578B\u8FDE\u63A5\u3001GitHub \u540C\u6B65\u4E0E\u4E2A\u4EBA\u6587\u7A3F\u6A21\u677F\u3002" }),
      /* @__PURE__ */ jsx("nav", { className: "settings-sections", "aria-label": "\u8BBE\u7F6E\u5206\u533A", children: [{ id: "models", title: "\u6A21\u578B\u914D\u7F6E", icon: "cpu" }, { id: "github", title: "GitHub \u72B6\u6001", icon: "branch" }, { id: "templates", title: "\u6587\u7A3F\u6A21\u677F\u5E93", icon: "book-open" }].map((section) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": s.section === section.id, "aria-controls": `settings-${section.id}`, onClick: () => this.setState({ section: section.id }), children: [
        /* @__PURE__ */ jsx(Icon, { name: section.icon, size: 16 }),
        section.title
      ] }, section.id)) }),
      /* @__PURE__ */ jsx("div", { id: "settings-models", className: "settings-panel", hidden: s.section !== "models", children: /* @__PURE__ */ jsxs("div", { className: "settings-model-workspace", children: [
        /* @__PURE__ */ jsxs("nav", { className: "settings-provider-list", "aria-label": "\u6A21\u578B\u63D0\u4F9B\u5546", children: [
          /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: "\u63D0\u4F9B\u5546" }),
            /* @__PURE__ */ jsx("span", { children: providers.length })
          ] }),
          providers.map((provider) => {
            const saved = connections.find((row) => row.provider === provider);
            return /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": s.activeProvider === provider, disabled: locked, onClick: () => this.chooseProvider(provider), children: [
              /* @__PURE__ */ jsx("span", { className: "settings-provider-avatar", "aria-hidden": "true", children: (saved?.name || provider).slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ jsxs("span", { className: "settings-provider-copy", children: [
                /* @__PURE__ */ jsx("strong", { children: saved?.name || provider }),
                /* @__PURE__ */ jsxs("small", { children: [
                  provider,
                  " \xB7 ",
                  models.filter((model) => model.provider === provider).length,
                  " \u4E2A\u6A21\u578B",
                  provider === currentDefault.provider ? " \xB7 \u9ED8\u8BA4" : "",
                  s.drafts[provider]?.dirty ? " \xB7 \u672A\u4FDD\u5B58" : ""
                ] })
              ] }),
              /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 14 })
            ] }, provider);
          }),
          /* @__PURE__ */ jsxs("button", { className: "settings-provider-add", type: "button", disabled: locked, onClick: () => this.chooseProvider(""), children: [
            /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
            "\u6DFB\u52A0\u63D0\u4F9B\u5546"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "surface settings-provider-detail", "aria-label": "\u63D0\u4F9B\u5546\u6A21\u578B\u914D\u7F6E", children: [
          /* @__PURE__ */ jsxs("header", { className: "settings-detail-heading", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "settings-eyebrow", children: s.activeProvider || "\u65B0\u8FDE\u63A5" }),
              /* @__PURE__ */ jsx("h2", { children: connection?.name || s.activeProvider || "\u6DFB\u52A0\u63D0\u4F9B\u5546" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "settings-runtime-state", children: boot.runtime.ready ? "\u8FD0\u884C\u65F6\u5DF2\u914D\u7F6E \xB7 \u8FDE\u63A5\u5F85\u9A8C\u8BC1" : "\u8FD0\u884C\u65F6\u5C1A\u672A\u5C31\u7EEA" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "settings-runtime-message small muted", children: boot.runtime.message }),
          /* @__PURE__ */ jsxs("form", { className: "settings-connection-form", onSubmit: (e) => {
            e.preventDefault();
            void this.saveConnection();
          }, children: [
            /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
              /* @__PURE__ */ jsx("h3", { children: "\u8FDE\u63A5\u914D\u7F6E" }),
              /* @__PURE__ */ jsx("span", { children: connection?.hasApiKey ? "\u51ED\u636E\u5DF2\u914D\u7F6E" : providerModels.length ? "\u4F7F\u7528\u73B0\u6709\u672C\u5730\u914D\u7F6E" : "\u5C1A\u65E0\u9875\u9762\u8FDE\u63A5\u914D\u7F6E" })
            ] }),
            !connection && providerModels.length ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u63D0\u4F9B\u5546\u6CBF\u7528\u73B0\u6709\u672C\u5730\u914D\u7F6E\uFF0C\u53EF\u76F4\u63A5\u9009\u62E9\u6216\u4FDD\u5B58\u9ED8\u8BA4\u6A21\u578B\u3002" }) : null,
            /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u8FDE\u63A5\u540D\u79F0",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5\u540D\u79F0", required: true, maxLength: 100, value: draft.name, disabled: locked, placeholder: "\u4F8B\u5982\uFF1A\u7814\u7A76\u4E3B\u8FDE\u63A5", onChange: (e) => this.updateDraft({ name: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u63D0\u4F9B\u5546 ID",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5\u63D0\u4F9B\u5546 ID", required: true, pattern: "[A-Za-z0-9._-]+", maxLength: 100, value: draft.provider, disabled: locked || !!connection, placeholder: "\u7A33\u5B9A\u7684 provider \u6807\u8BC6", onChange: (e) => this.updateDraft({ provider: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { className: "settings-field-wide", children: [
                "Base URL",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5 Base URL", type: "url", required: true, maxLength: 2e3, value: draft.baseUrl, disabled: locked, placeholder: "https://api.example.com/v1", onChange: (e) => this.updateDraft({ baseUrl: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "API \u683C\u5F0F",
                /* @__PURE__ */ jsxs("select", { "aria-label": "\u8FDE\u63A5 API \u683C\u5F0F", value: draft.api, disabled: locked || !s.connections, onChange: (e) => this.updateDraft({ api: e.target.value }), children: [
                  nativeSelectButton,
                  (s.connections?.supportedApis ?? [draft.api]).map((value) => /* @__PURE__ */ jsx("option", { value, children: apiNames[value] ?? value }, value))
                ] })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "API Key",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5 API Key", type: "password", autoComplete: "new-password", required: !connection?.hasApiKey, maxLength: 8192, value: draft.apiKey, disabled: locked, placeholder: connection?.hasApiKey ? "\u5DF2\u914D\u7F6E\uFF1B\u7559\u7A7A\u4FDD\u7559" : "\u9996\u6B21\u4FDD\u5B58\u65F6\u586B\u5199", onChange: (e) => this.updateDraft({ apiKey: e.target.value }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "HTTPS \u63A5\u53E3\u6216\u672C\u673A HTTP \u5730\u5740\u3002\u5BC6\u94A5\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u56DE\u663E\uFF1B\u5DF2\u6709\u5BC6\u94A5\u7559\u7A7A\u4FDD\u7559\u3002" }),
            /* @__PURE__ */ jsxs("div", { className: "settings-connection-actions", children: [
              /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: locked || s.connectionLoading || !s.connections, children: s.connectionBusy ? "\u6B63\u5728\u4FDD\u5B58\u8FDE\u63A5\u2026" : "\u4FDD\u5B58\u8FDE\u63A5" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled: locked || s.connectionLoading, onClick: () => void this.loadConnections(), children: s.connectionLoading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u5237\u65B0\u8FDE\u63A5\u7248\u672C" })
            ] }),
            s.connectionError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text settings-feedback", children: s.connectionError }) : null,
            s.connectionMessage ? /* @__PURE__ */ jsx("p", { role: "status", className: "settings-feedback", children: s.connectionMessage }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "settings-model-catalog", children: [
            /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
              /* @__PURE__ */ jsx("h3", { children: "\u5DF2\u4FDD\u5B58\u6A21\u578B" }),
              /* @__PURE__ */ jsx("span", { children: providerModels.length })
            ] }),
            providerModels.length ? providerModels.map((model) => /* @__PURE__ */ jsxs("button", { type: "button", disabled: locked, "aria-pressed": s.savedChoice === modelKey(model), onClick: () => this.choose(model), children: [
              /* @__PURE__ */ jsx(Icon, { name: "cpu", size: 16 }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: model.model }),
                /* @__PURE__ */ jsxs("small", { children: [
                  "\u601D\u8003\u914D\u7F6E \xB7 ",
                  model.thinking
                ] })
              ] }),
              modelKey(model) === modelKey(currentDefault) ? /* @__PURE__ */ jsx("span", { className: "settings-default-tag", children: "\u9ED8\u8BA4" }) : null,
              s.savedChoice === modelKey(model) ? /* @__PURE__ */ jsx(Icon, { name: "check", size: 16 }) : null
            ] }, modelKey(model))) : /* @__PURE__ */ jsx("p", { className: "settings-empty", children: "\u6B64\u63D0\u4F9B\u5546\u8FD8\u6CA1\u6709\u5DF2\u4FDD\u5B58\u6A21\u578B\uFF0C\u586B\u5199\u6A21\u578B\u6807\u8BC6\u540E\u53EF\u4FDD\u5B58\u4E3A\u9ED8\u8BA4\u3002" })
          ] }),
          /* @__PURE__ */ jsxs("form", { className: "settings-model-form", onSubmit: (e) => {
            e.preventDefault();
            void this.saveModel();
          }, children: [
            /* @__PURE__ */ jsx("div", { className: "settings-list-heading", children: /* @__PURE__ */ jsx("h3", { children: "\u7F16\u8F91\u6A21\u578B" }) }),
            /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u4F9B\u5E94\u5546\u6807\u8BC6",
                /* @__PURE__ */ jsx("input", { required: true, maxLength: 100, "aria-label": "\u4F9B\u5E94\u5546\u6807\u8BC6", placeholder: "Pi \u4E2D\u7684 provider ID", value: s.provider, disabled: locked, onChange: (e) => this.updateModel({ provider: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u6A21\u578B ID",
                /* @__PURE__ */ jsx("input", { required: true, maxLength: 160, "aria-label": "\u6A21\u578B ID", placeholder: "\u5B9E\u9645\u53EF\u7528\u7684\u6A21\u578B\u6807\u8BC6", value: s.model, disabled: locked, onChange: (e) => this.updateModel({ model: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u601D\u8003\u914D\u7F6E",
                /* @__PURE__ */ jsxs("select", { "aria-label": "\u601D\u8003\u914D\u7F6E", value: s.thinking, disabled: locked, onChange: (e) => this.updateModel({ thinking: e.target.value }), children: [
                  nativeSelectButton,
                  ["off", "minimal", "low", "medium", "high", "xhigh"].map((value) => /* @__PURE__ */ jsx("option", { value, children: value }, value))
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("details", { className: "settings-all-models", children: [
              /* @__PURE__ */ jsx("summary", { children: "\u4ECE\u5168\u90E8\u5DF2\u4FDD\u5B58\u6A21\u578B\u4E2D\u9009\u62E9" }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u5DF2\u6709\u6A21\u578B",
                /* @__PURE__ */ jsxs("select", { "aria-label": "\u9009\u62E9\u5DF2\u6709\u6A21\u578B", value: s.savedChoice, disabled: locked, onChange: (e) => {
                  const model = models.find((item) => modelKey(item) === e.target.value);
                  if (model) this.choose(model);
                  else this.setState({ savedChoice: "" });
                }, children: [
                  nativeSelectButton,
                  /* @__PURE__ */ jsx("option", { value: "", children: "\u624B\u52A8\u914D\u7F6E" }),
                  models.map((model) => /* @__PURE__ */ jsxs("option", { value: modelKey(model), children: [
                    model.provider,
                    " / ",
                    model.model,
                    " \xB7 ",
                    model.thinking
                  ] }, modelKey(model)))
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "settings-save-default", children: [
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u7528\u4E8E\u65B0\u4F1A\u8BDD\uFF1B\u5F53\u524D\u4F1A\u8BDD\u53EF\u5728 Chat \u5DE5\u5177\u680F\u5355\u72EC\u9009\u62E9\u3002" }),
              /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: locked, children: s.modelBusy ? "\u6B63\u5728\u4FDD\u5B58\u9ED8\u8BA4\u6A21\u578B\u2026" : "\u4FDD\u5B58\u4E3A\u9ED8\u8BA4\u6A21\u578B\uFF08\u7528\u4E8E\u65B0\u4F1A\u8BDD\uFF09" }),
              /* @__PURE__ */ jsx("button", { className: "text-button", type: "button", disabled: locked, onClick: () => void this.refreshDefault(), children: s.modelRefreshing ? "\u6B63\u5728\u5237\u65B0\u2026" : "\u5237\u65B0\u9ED8\u8BA4\u6A21\u578B\u7248\u672C" })
            ] }),
            s.modelError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text settings-feedback", children: s.modelError }) : null,
            s.modelMessage ? /* @__PURE__ */ jsx("p", { role: "status", className: "settings-feedback", children: s.modelMessage }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "settings-current-default", children: [
            /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }),
            /* @__PURE__ */ jsxs("span", { children: [
              "\u5F53\u524D\u9ED8\u8BA4 ",
              /* @__PURE__ */ jsxs("strong", { children: [
                currentDefault.provider,
                " / ",
                currentDefault.model
              ] }),
              /* @__PURE__ */ jsxs("small", { children: [
                "\u601D\u8003\u914D\u7F6E \xB7 ",
                currentDefault.thinking
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "settings-disclosure", children: [
            /* @__PURE__ */ jsx("summary", { children: "\u8FDE\u63A5\u4E0E\u63A5\u5165\u8BF4\u660E" }),
            /* @__PURE__ */ jsxs("div", { className: "settings-disclosure-body", children: [
              /* @__PURE__ */ jsxs("p", { children: [
                "\u4F7F\u7528 Node.js \u226522.19.0\uFF08\u5EFA\u8BAE 24\uFF09\uFF0C\u5F53\u524D\uFF1A",
                /* @__PURE__ */ jsx("code", { children: boot.runtime.node }),
                "\u3002\u5728\u9879\u76EE\u76EE\u5F55\u6267\u884C ",
                /* @__PURE__ */ jsx("code", { children: "npm run setup:pi" }),
                "\uFF0C\u5B89\u88C5 Pi ",
                boot.runtime.expectedVersion,
                "\u3002"
              ] }),
              /* @__PURE__ */ jsx("p", { children: "\u5148\u4FDD\u5B58\u8FDE\u63A5\uFF0C\u518D\u5355\u72EC\u4FDD\u5B58\u9ED8\u8BA4\u6A21\u578B\u3002\u4FDD\u5B58\u53EA\u8868\u793A\u914D\u7F6E\u5DF2\u6301\u4E45\u5316\uFF0C\u771F\u5B9E\u8FDE\u63A5\u4ECD\u5F85\u9A8C\u8BC1\u3002" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "\u5DF2\u6709 ",
                /* @__PURE__ */ jsx("code", { children: ".env" }),
                " \u4E2D\u7684 ",
                /* @__PURE__ */ jsx("code", { children: "PI_API_KEY" }),
                " \u4E0E\u6570\u636E\u76EE\u5F55\u4E0B\u7684 ",
                /* @__PURE__ */ jsx("code", { children: "models.json" }),
                " \u4ECD\u53EF\u7528\u4E8E\u65E7\u63A5\u5165\u3002\u65B0\u8FDE\u63A5\u7684\u63D0\u4F9B\u5546 ID \u5E94\u4E0E\u6A21\u578B\u7684\u4F9B\u5E94\u5546\u6807\u8BC6\u4E00\u81F4\u3002"
              ] })
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx("div", { id: "settings-github", className: "settings-panel", hidden: s.section !== "github", children: /* @__PURE__ */ jsx(GitHubSettings, { projectId: this.props.projectId }) }),
      /* @__PURE__ */ jsx("div", { id: "settings-templates", className: "settings-panel", hidden: s.section !== "templates", children: /* @__PURE__ */ jsx(TemplateLibraryView, {}) })
    ] }) });
  }
}
export {
  SettingsView
};
