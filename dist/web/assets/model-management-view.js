import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Icon, nativeSelectButton } from "./ui.js";
const identity = (provider, model) => JSON.stringify([provider, model ?? null]);
const sameSelection = (a, b) => a.provider === b.provider && a.model === b.model && a.thinking === b.thinking;
const own = (rows, key) => Object.prototype.hasOwnProperty.call(rows, key) ? rows[key] : void 0;
const apiNames = { "openai-completions": "OpenAI Chat Completions", "openai-responses": "OpenAI Responses", "anthropic-messages": "Anthropic Messages" };
const capabilityNames = { text: "\u6587\u672C", image: "\u56FE\u7247", pdf: "\u539F\u751F PDF", video: "\u539F\u751F\u89C6\u9891", structuredOutput: "\u7ED3\u6784\u5316\u8F93\u51FA", midConversationSystem: "\u4F1A\u8BDD\u4E2D\u7CFB\u7EDF\u6D88\u606F" };
const effectiveNames = { available: "\u53EF\u7528", disabled: "\u672A\u58F0\u660E", unsupported: "\u6682\u4E0D\u652F\u6301" };
const piLevels = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
const defaultCapabilities = { text: true, image: false, pdf: false, video: false, structuredOutput: false, nativeWebSearch: false, midConversationSystem: false };
class ModelManagementPanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { data: null, loading: false, busy: false, error: "", message: "", provider: this.props.boot.model.provider, model: this.props.boot.model.model, providerDrafts: {}, modelDrafts: {}, selection: this.props.boot.model, defaultVersion: this.props.boot.modelVersion ?? 0, defaultDirty: false, recommendation: null, recommendationLoading: false, acknowledgedCost: false, preset: "", editorOpen: false, editorView: "connection", modelTab: "basic", levelId: "", jsonTarget: null, jsonBuffers: {} };
    this.disposed = false;
    this.epoch = 0;
    this.recommendationEpoch = 0;
    this.pending = false;
    this.mutations = /* @__PURE__ */ new Map();
    this.selectedModels = /* @__PURE__ */ new Map();
    this.editorSequence = 0;
    this.editor = React.createRef();
    this.returnFocus = null;
    this.jsonInput = React.createRef();
  }
  componentDidMount() {
    void this.load(false);
  }
  componentWillUnmount() {
    this.disposed = true;
    this.epoch++;
    this.recommendationEpoch++;
  }
  componentDidUpdate(previous) {
    if (previous.boot.modelVersion !== this.props.boot.modelVersion || !sameSelection(previous.boot.model, this.props.boot.model)) {
      const selection = this.props.boot.model, version = this.props.boot.modelVersion ?? 0;
      this.setState((current) => ({ ...current, data: current.data ? { ...current.data, defaultModel: selection, defaultModelVersion: version } : null, ...!current.defaultDirty ? { selection, defaultVersion: version } : {} }));
    }
  }
  safeData(data) {
    return { ...data, defaultModel: { provider: data.defaultModel.provider, model: data.defaultModel.model, thinking: data.defaultModel.thinking }, providers: data.providers.map(({ provider, name, enabled, deletedAt, order, source, baseUrl, api: api2, hasApiKey, requiresCredential, models, test }) => ({ provider, name, enabled, deletedAt, order, source, baseUrl, api: api2, hasApiKey, ...requiresCredential === true ? { requiresCredential: true } : {}, models, test })) };
  }
  observe(data) {
    this.setState((current) => ({ ...current, data, ...!current.defaultDirty ? { selection: data.defaultModel, defaultVersion: data.defaultModelVersion } : {} }));
  }
  async load(acceptCurrent = true, acceptDefault = false) {
    if (this.disposed) return;
    const epoch = ++this.epoch, providerKey = identity(this.state.provider), modelKey = identity(this.state.provider, this.state.model);
    this.setState({ loading: true, error: "" });
    try {
      const data = this.safeData(await api("/settings/model-management"));
      if (this.disposed || epoch !== this.epoch) return;
      this.setState((current) => {
        const providerDraft = own(current.providerDrafts, providerKey), modelDraft = own(current.modelDrafts, modelKey);
        return { ...current, data, providerDrafts: acceptCurrent && providerDraft?.dirty ? { ...current.providerDrafts, [providerKey]: { ...providerDraft, version: data.version } } : current.providerDrafts, modelDrafts: acceptCurrent && modelDraft && (modelDraft.dirty || modelDraft.frozen) ? { ...current.modelDrafts, [modelKey]: { ...modelDraft, version: data.version } } : current.modelDrafts, ...acceptDefault ? { defaultVersion: data.defaultModelVersion, defaultDirty: !sameSelection(current.selection, data.defaultModel) } : !current.defaultDirty ? { selection: data.defaultModel, defaultVersion: data.defaultModelVersion } : {} };
      });
    } catch (error) {
      if (!this.disposed && epoch === this.epoch) this.setState({ error: this.errorMessage(error) });
    } finally {
      if (!this.disposed && epoch === this.epoch) this.setState({ loading: false });
    }
  }
  providers() {
    return [...this.state.data?.providers ?? []].filter((p) => !p.deletedAt).sort((a, b) => a.order - b.order);
  }
  provider() {
    return this.state.data?.providers.find((row) => row.provider === this.state.provider);
  }
  models() {
    return [...this.provider()?.models ?? []].filter((m) => !m.deletedAt).sort((a, b) => a.order - b.order);
  }
  managedModel() {
    return this.provider()?.models.find((row) => row.model === this.state.model);
  }
  providerDraft() {
    const key = identity(this.state.provider), draft = own(this.state.providerDrafts, key), saved = this.provider();
    return draft?.dirty ? draft : { provider: saved?.provider ?? this.state.provider, name: saved?.name ?? "", baseUrl: saved?.baseUrl ?? "", api: saved?.api ?? this.state.data?.supportedApis[0] ?? "openai-completions", apiKey: "", version: this.state.data?.version ?? 0, dirty: false };
  }
  definitionDraft() {
    const key = identity(this.state.provider, this.state.model), draft = own(this.state.modelDrafts, key), saved = this.managedModel();
    return draft && (draft.dirty || draft.frozen) ? draft : this.toDraft(saved ?? { model: this.state.model, name: "", nativeProfile: "none", contextWindow: 32768, maxTokens: 4096, capabilities: { ...defaultCapabilities }, reasoning: { defaultLevel: "off", levels: [{ id: "off", label: "\u5173\u95ED", piLevel: "off", parameters: {} }] }, parameters: {}, structuredOutput: null, configuration: { mode: "manual", overrides: [] } }, this.state.data?.version ?? 0);
  }
  toDraft(value, version) {
    return { model: value.model, name: value.name, nativeProfile: value.nativeProfile, contextWindow: String(value.contextWindow), maxTokens: String(value.maxTokens), capabilities: { ...value.capabilities }, defaultLevel: value.reasoning.defaultLevel, levels: value.reasoning.levels.map((level) => ({ ...level, parameters: JSON.stringify(level.parameters, null, 2) })), parameters: JSON.stringify(value.parameters, null, 2), structuredOutput: JSON.stringify(value.structuredOutput, null, 2), mode: value.configuration.mode, overrides: [...value.configuration.overrides], version, dirty: false };
  }
  updateProvider(update) {
    const key = identity(this.state.provider), draft = this.providerDraft();
    this.setState((current) => ({ providerDrafts: { ...current.providerDrafts, [key]: { ...draft, ...update, dirty: true } }, message: "" }));
  }
  updateDefinition(update) {
    const key = identity(this.state.provider, this.state.model), draft = this.definitionDraft();
    this.setState((current) => ({ modelDrafts: { ...current.modelDrafts, [key]: { ...draft, ...update, dirty: true } }, message: "" }));
  }
  chooseProvider(provider) {
    if (this.pending) return;
    this.editorSequence++;
    this.recommendationEpoch++;
    this.selectedModels.set(this.state.provider, this.state.model);
    const saved = this.state.data?.providers.find((row) => row.provider === provider), remembered = this.selectedModels.get(provider), model = remembered === "" ? "" : saved?.models.some((row) => row.model === remembered && !row.deletedAt) ? remembered : saved?.models.filter((row) => !row.deletedAt).sort((a, b) => a.order - b.order)[0]?.model ?? "";
    this.setState({ provider, model, error: "", message: "", recommendation: null, acknowledgedCost: false, preset: "", recommendationLoading: false, jsonTarget: null, levelId: "" });
  }
  chooseModel(model) {
    if (this.pending) return;
    this.editorSequence++;
    this.recommendationEpoch++;
    this.selectedModels.set(this.state.provider, model);
    this.setState({ model, error: "", message: "", recommendation: null, acknowledgedCost: false, recommendationLoading: false, jsonTarget: null, levelId: "" });
  }
  errorMessage(error) {
    let message = error instanceof Error ? error.message : String(error);
    for (const draft of Object.values(this.state.providerDrafts)) if (draft.apiKey) message = message.split(draft.apiKey).join("[\u5DF2\u9690\u85CF]");
    return message;
  }
  async mutate(command, scope) {
    if (this.disposed || this.pending || this.state.loading) return null;
    const body = JSON.stringify(command);
    let mutation = this.mutations.get(scope);
    if (mutation?.body !== body) {
      mutation = { body, key: crypto.randomUUID() };
      this.mutations.set(scope, mutation);
    }
    this.pending = true;
    this.setState({ busy: true, error: "", message: "" });
    let result = null;
    try {
      await this.props.perform(async () => {
        try {
          result = this.safeData(await api("/settings/model-management", command, "POST", void 0, mutation.key));
          this.mutations.delete(scope);
          if (!this.disposed) this.observe(result);
        } catch (error) {
          const message = this.errorMessage(error) + (error instanceof ApiError && error.status === 409 ? " \u8BF7\u5237\u65B0\u5F53\u524D\u7248\u672C\u540E\u91CD\u8BD5\uFF0C\u5F53\u524D\u8F93\u5165\u4E0E\u5176\u4ED6\u8349\u7A3F\u5747\u4FDD\u7559\u3002" : "");
          if (!this.disposed) this.setState({ error: message });
          throw new Error(message);
        }
      });
    } catch {
    } finally {
      this.pending = false;
      if (!this.disposed) this.setState({ busy: false });
    }
    return result;
  }
  async saveProvider() {
    const draft = this.providerDraft(), saved = this.provider(), key = identity(this.state.provider);
    if (!this.state.data) return;
    if (saved?.deletedAt) {
      this.setState({ error: "\u6B64\u63D0\u4F9B\u5546\u5DF2\u5220\u9664\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u8FDE\u63A5\uFF1B\u539F\u8349\u7A3F\u4FDD\u7559\u3002" });
      return;
    }
    if (!draft.apiKey.trim() && (saved?.requiresCredential || !saved?.hasApiKey && saved?.source !== "legacy")) {
      this.setState({ error: "\u9996\u6B21\u4FDD\u5B58\u6216\u6062\u590D\u8FDE\u63A5\u9700\u8981 API Key\u3002" });
      return;
    }
    if (!this.state.provider && this.state.data.providers.some((p) => p.provider === draft.provider.trim())) {
      this.setState({ error: "\u63D0\u4F9B\u5546 ID \u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u5DF2\u6709\u8FDE\u63A5\u7F16\u8F91\uFF1B\u5F53\u524D\u8349\u7A3F\u4FDD\u7559\u3002" });
      return;
    }
    const result = await this.mutate({ expectedVersion: draft.version, action: "provider.upsert", provider: draft.provider.trim(), value: { name: draft.name.trim(), baseUrl: draft.baseUrl.trim(), api: draft.api, ...draft.apiKey ? { apiKey: draft.apiKey } : {} } }, `provider:${key}`);
    if (result && !this.disposed) this.setState((current) => {
      const drafts = { ...current.providerDrafts };
      delete drafts[key];
      return { providerDrafts: drafts, provider: draft.provider.trim(), message: "\u8FDE\u63A5\u5DF2\u4FDD\u5B58\uFF1B\u6D4B\u8BD5\u4E0E\u9ED8\u8BA4\u6A21\u578B\u9700\u5355\u72EC\u64CD\u4F5C\u3002" };
    });
  }
  json(text, field) {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw Error(`${field}\u5FC5\u987B\u662F JSON \u5BF9\u8C61`);
    return value;
  }
  definitionValue(draft = this.definitionDraft()) {
    const structured = JSON.parse(draft.structuredOutput);
    return { model: draft.model.trim(), name: draft.name.trim(), nativeProfile: draft.nativeProfile, contextWindow: Number(draft.contextWindow), maxTokens: Number(draft.maxTokens), capabilities: { ...draft.capabilities }, reasoning: { defaultLevel: draft.defaultLevel, levels: draft.levels.map((level) => ({ ...level, parameters: this.json(level.parameters, "\u601D\u8003\u53C2\u6570") })) }, parameters: this.json(draft.parameters, "\u6A21\u578B\u53C2\u6570"), structuredOutput: structured, configuration: { mode: draft.mode, overrides: [...draft.overrides] } };
  }
  async saveDefinition() {
    if (!this.state.data) return;
    if (this.pendingJson().length) {
      this.setState({ error: "\u5F53\u524D\u6A21\u578B\u4ECD\u6709\u672A\u5E94\u7528 JSON\uFF0C\u8BF7\u5148\u5E94\u7528\u5230\u8349\u7A3F\u6216\u660E\u786E\u53D6\u6D88\u672C\u6B21 JSON \u7F16\u8F91\u3002" });
      return;
    }
    const draft = this.definitionDraft(), key = identity(this.state.provider, this.state.model);
    try {
      if (this.provider()?.deletedAt || this.managedModel()?.deletedAt) throw Error("\u6B64\u6A21\u578B\u6216\u63D0\u4F9B\u5546\u5DF2\u5220\u9664\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u6761\u76EE\uFF1B\u539F\u8349\u7A3F\u4FDD\u7559\u3002");
      const value = this.definitionValue(draft);
      if (!this.state.model && this.provider()?.models.some((row) => row.model === value.model)) throw Error("\u6A21\u578B ID \u5DF2\u5B58\u5728\uFF0C\u8BF7\u9009\u62E9\u5DF2\u6709\u6A21\u578B\u7F16\u8F91\uFF1B\u5F53\u524D\u8349\u7A3F\u4FDD\u7559\u3002");
      const result = await this.mutate({ expectedVersion: draft.version, action: "model.upsert", provider: this.state.provider, model: value.model, value }, `model:${key}`);
      if (result && !this.disposed) this.setState((current) => {
        const drafts = { ...current.modelDrafts };
        delete drafts[key];
        return { modelDrafts: drafts, model: value.model, message: "\u6A21\u578B\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF0C\u9ED8\u8BA4\u6A21\u578B\u672A\u6539\u53D8\u3002" };
      });
    } catch (error) {
      this.setState({ error: this.errorMessage(error) });
    }
  }
  isDefault(provider, model) {
    const saved = this.state.data?.defaultModel;
    return !!saved?.provider && saved.provider === provider && (model === void 0 || saved.model === model);
  }
  async setEnabled(kind, enabled, provider = this.state.provider, model = this.state.model, version = this.state.data?.version) {
    if (!this.state.data) return;
    if (!enabled && this.isDefault(provider, kind === "model" ? model : void 0)) {
      this.setState({ error: "\u8BF7\u5148\u5207\u6362\u6216\u6E05\u7A7A\u9ED8\u8BA4\u6A21\u578B\uFF0C\u518D\u505C\u7528\u3002" });
      return;
    }
    await this.mutate(kind === "provider" ? { expectedVersion: version ?? this.state.data.version, action: "provider.enabled", provider, value: { enabled } } : { expectedVersion: version ?? this.state.data.version, action: "model.enabled", provider, model, value: { enabled } }, `${kind}.enabled:${identity(provider, model)}`);
  }
  async remove(kind) {
    if (!this.state.data) return;
    if (this.isDefault(this.state.provider, kind === "model" ? this.state.model : void 0)) {
      this.setState({ error: "\u8BF7\u5148\u5207\u6362\u6216\u6E05\u7A7A\u9ED8\u8BA4\u6A21\u578B\uFF0C\u518D\u5220\u9664\u3002" });
      return;
    }
    if (!confirm("\u5220\u9664\u540E\u4FDD\u7559\u5386\u53F2\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u6062\u590D\u6B64\u6807\u8BC6\u3002\u7EE7\u7EED\u5220\u9664\uFF1F")) return;
    const result = await this.mutate(kind === "provider" ? { expectedVersion: this.state.data.version, action: "provider.delete", provider: this.state.provider } : { expectedVersion: this.state.data.version, action: "model.delete", provider: this.state.provider, model: this.state.model }, `${kind}.delete:${identity(this.state.provider, this.state.model)}`);
    if (result) {
      if (kind === "provider") this.chooseProvider(result.providers.filter((p) => !p.deletedAt).sort((a, b) => a.order - b.order)[0]?.provider ?? "");
      else this.chooseModel(result.providers.find((p) => p.provider === this.state.provider)?.models.filter((m) => !m.deletedAt).sort((a, b) => a.order - b.order)[0]?.model ?? "");
    }
  }
  async reorder(kind, id, target) {
    if (!this.state.data || id === target) return;
    const ids = kind === "providers" ? this.providers().map((p) => p.provider) : this.models().map((m) => m.model), from = ids.indexOf(id), to = ids.indexOf(target);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    await this.mutate(kind === "providers" ? { expectedVersion: this.state.data.version, action: "providers.reorder", value: { providers: ids } } : { expectedVersion: this.state.data.version, action: "models.reorder", provider: this.state.provider, value: { models: ids } }, `${kind}.reorder:${this.state.provider}`);
  }
  drop(kind, target) {
    const dragged = this.dragged;
    this.dragged = void 0;
    if (dragged?.kind === kind && (kind === "providers" || dragged.provider === this.state.provider)) void this.reorder(kind, dragged.id, target);
  }
  applyPreset(id) {
    const preset = this.state.data?.presets.find((row) => row.id === id);
    if (!preset) return;
    this.setState({ preset: id });
    this.updateProvider({ name: preset.name, baseUrl: preset.baseUrl, api: preset.api, ...!this.state.provider ? { provider: preset.providerBrand || preset.id } : {} });
  }
  async previewRecommendation() {
    if (this.disposed || !this.state.provider || !this.definitionDraft().model.trim()) return;
    const epoch = ++this.recommendationEpoch;
    this.setState({ recommendationLoading: true, error: "" });
    try {
      const recommendation = await api(`/settings/model-recommendations?provider=${encodeURIComponent(this.state.provider)}&model=${encodeURIComponent(this.definitionDraft().model.trim())}`);
      if (!this.disposed && epoch === this.recommendationEpoch) this.setState({ recommendation });
    } catch (error) {
      if (!this.disposed && epoch === this.recommendationEpoch) this.setState({ error: this.errorMessage(error) });
    } finally {
      if (!this.disposed && epoch === this.recommendationEpoch) this.setState({ recommendationLoading: false });
    }
  }
  applyRecommendation() {
    const recommendation = this.state.recommendation;
    if (!recommendation?.value) return;
    const draft = this.definitionDraft(), next = this.toDraft({ ...recommendation.value, model: draft.model, configuration: { mode: "matched", overrides: draft.overrides } }, draft.version);
    for (const field of draft.overrides) {
      if (field.startsWith("capabilities.")) {
        const key = field.slice(13);
        next.capabilities[key] = draft.capabilities[key];
      } else if (field === "reasoning") {
        next.levels = draft.levels;
        next.defaultLevel = draft.defaultLevel;
      } else if (field === "parameters") next.parameters = draft.parameters;
      else if (field === "structuredOutput") next.structuredOutput = draft.structuredOutput;
      else if (field === "contextWindow") next.contextWindow = draft.contextWindow;
      else if (field === "maxTokens") next.maxTokens = draft.maxTokens;
      else if (field === "nativeProfile") next.nativeProfile = draft.nativeProfile;
      else if (field === "name") next.name = draft.name;
    }
    this.updateDefinition(next);
  }
  toggleOverride(field, checked) {
    const draft = this.definitionDraft();
    this.updateDefinition({ overrides: checked ? [.../* @__PURE__ */ new Set([...draft.overrides, field])] : draft.overrides.filter((value) => value !== field) });
  }
  updateSelection(update) {
    this.setState((current) => {
      const selection = { ...current.selection, ...update }, dirty = !!current.data && !sameSelection(selection, current.data.defaultModel);
      return { selection, defaultDirty: dirty, defaultVersion: dirty ? current.defaultVersion : current.data?.defaultModelVersion ?? current.defaultVersion, message: "" };
    });
  }
  chooseDefault(value) {
    const [provider, model] = JSON.parse(value), row = this.state.data?.providers.find((p) => p.provider === provider && p.enabled && !p.deletedAt && !p.requiresCredential), saved = row?.models.find((m) => m.model === model && m.enabled && !m.deletedAt);
    if (saved) this.updateSelection({ provider, model, thinking: saved.reasoning.defaultLevel });
  }
  async saveDefault(clear = false) {
    if (this.disposed || this.pending || !this.state.data) return;
    const selection = this.state.selection, request = clear ? { clear: true, expectedVersion: this.state.defaultVersion } : { ...selection, expectedVersion: this.state.defaultVersion }, body = JSON.stringify(request), scope = "default";
    let mutation = this.mutations.get(scope);
    if (mutation?.body !== body) {
      mutation = { body, key: crypto.randomUUID() };
      this.mutations.set(scope, mutation);
    }
    this.pending = true;
    this.setState({ busy: true, error: "", message: "" });
    try {
      await this.props.perform(async () => {
        try {
          const saved = await api("/settings/model", request, "POST", void 0, mutation.key);
          this.mutations.delete(scope);
          if (this.disposed) return;
          const current = clear ? { provider: "", model: "", thinking: "off" } : saved.model ?? selection, version = saved.version ?? this.state.defaultVersion;
          this.setState((state) => ({ selection: current, defaultVersion: version, defaultDirty: false, data: state.data ? { ...state.data, defaultModel: current, defaultModelVersion: version, defaultUsable: !clear } : null, message: clear ? "\u9ED8\u8BA4\u6A21\u578B\u5DF2\u6E05\u7A7A\uFF1B\u65B0\u4F1A\u8BDD\u9700\u8981\u660E\u786E\u9009\u62E9\u6A21\u578B\u3002" : "\u9ED8\u8BA4\u6A21\u578B\u5DF2\u4FDD\u5B58\uFF0C\u4EC5\u7528\u4E8E\u65B0\u4F1A\u8BDD\u3002" }));
        } catch (error) {
          const message = this.errorMessage(error) + (error instanceof ApiError && error.status === 409 ? " \u8BF7\u5237\u65B0\u9ED8\u8BA4\u6A21\u578B\u7248\u672C\u540E\u91CD\u8BD5\uFF0C\u5F53\u524D\u9009\u62E9\u4FDD\u7559\u3002" : "");
          if (!this.disposed) this.setState({ error: message });
          throw new Error(message);
        }
      });
    } catch {
    } finally {
      this.pending = false;
      if (!this.disposed) this.setState({ busy: false });
    }
  }
  async runTest(kind) {
    if (this.disposed || !this.state.data || this.pending || !this.state.acknowledgedCost) return;
    const provider = this.provider(), model = this.managedModel();
    if (!provider || provider.deletedAt || !provider.enabled || kind === "model" && (!model || model.deletedAt || !model.enabled)) return;
    if (this.providerDraft().dirty || kind === "model" && (this.definitionDraft().dirty || this.pendingJson().length > 0)) {
      this.setState({ error: "\u8BF7\u5148\u4FDD\u5B58\u5F53\u524D\u914D\u7F6E\uFF0C\u518D\u8FDB\u884C\u4E00\u6B21\u771F\u5B9E\u6D4B\u8BD5\u3002" });
      return;
    }
    const request = { expectedVersion: this.state.data.version, provider: provider.provider, ...kind === "model" ? { model: model.model } : {}, kind, acknowledgedCost: true }, body = JSON.stringify(request), scope = `test:${identity(provider.provider, kind === "model" ? model.model : void 0)}`;
    let mutation = this.mutations.get(scope);
    if (mutation?.body !== body) {
      mutation = { body, key: crypto.randomUUID() };
      this.mutations.set(scope, mutation);
    }
    this.pending = true;
    this.setState({ busy: true, error: "", message: "" });
    try {
      const result = await api("/settings/model-tests", request, "POST", void 0, mutation.key);
      this.mutations.delete(scope);
      if (!this.disposed) this.setState((current) => ({ data: current.data ? { ...current.data, providers: current.data.providers.map((p) => p.provider !== provider.provider ? p : kind === "connection" ? { ...p, test: result } : { ...p, models: p.models.map((m) => m.model === model.model ? { ...m, test: result } : m) }) } : null, message: "\u5DF2\u5B8C\u6210\u4E00\u6B21\u6D4B\u8BD5\uFF1B\u6B64\u7ED3\u679C\u4EC5\u9002\u7528\u4E8E\u5F53\u524D\u914D\u7F6E\u3002" }));
    } catch (error) {
      if (!this.disposed) this.setState({ error: this.errorMessage(error) + " \u6D4B\u8BD5\u672A\u786E\u8BA4\uFF0C\u5237\u65B0\u67E5\u770B\u72B6\u6001\uFF1B\u91CD\u8BD5\u4ECD\u53EF\u80FD\u4EA7\u751F\u8D39\u7528\u3002" });
    } finally {
      this.pending = false;
      if (!this.disposed) this.setState({ busy: false, acknowledgedCost: false });
    }
  }
  renderProbe(result, dirty) {
    const state = dirty ? "stale" : result?.state ?? "unknown", names = { passed: "\u6D4B\u8BD5\u901A\u8FC7", failed: "\u6D4B\u8BD5\u5931\u8D25", stale: "\u914D\u7F6E\u5DF2\u4FEE\u6539\uFF0C\u7ED3\u679C\u5931\u6548", running: "\u6D4B\u8BD5\u4E2D", unknown: "\u5C1A\u672A\u786E\u8BA4\u6D4B\u8BD5" }, categories = { success: "\u6210\u529F", authentication: "\u8BA4\u8BC1\u5931\u8D25", model_not_found: "\u6A21\u578B\u4E0D\u5B58\u5728", rate_limit: "\u9650\u6D41", network: "\u7F51\u7EDC\u9519\u8BEF", server: "\u670D\u52A1\u9519\u8BEF", invalid_request: "\u8BF7\u6C42\u65E0\u6548", unsupported: "\u534F\u8BAE\u4E0D\u652F\u6301", unknown: "\u539F\u56E0\u5F85\u786E\u8BA4" };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("p", { className: "management-test-result", role: "status", "data-state": state, children: [
        names[state] ?? state,
        result && !dirty ? ` \xB7 ${categories[result.category] ?? result.category} \xB7 ${result.requests} \u6B21\u8BF7\u6C42${result.httpStatus ? ` \xB7 HTTP ${result.httpStatus}` : ""} \xB7 ${new Date(result.checkedAt).toLocaleString()}` : ""
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u9A8C\u8BC1\u8FDE\u63A5\u6216\u6A21\u578B\u7684\u6700\u5C0F\u8BF7\u6C42\uFF0C\u4E0D\u9A8C\u8BC1\u63A8\u7406\u6620\u5C04\u3001\u7ED3\u6784\u5316\u8F93\u51FA\u3001\u5177\u4F53\u6587\u4EF6\u8F93\u5165\u80FD\u529B\u3002" })
    ] });
  }
  renderOverride(field, scope) {
    const draft = this.definitionDraft();
    return draft.mode === "matched" ? /* @__PURE__ */ jsxs("label", { className: "management-override", children: [
      /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u624B\u52A8\u8986\u5199 ${field}`, checked: draft.overrides.includes(field), disabled: this.state.busy, onChange: (e) => {
        if (!scope || this.editorCurrent(scope)) this.toggleOverride(field, e.target.checked);
      } }),
      "\u624B\u52A8\u8986\u5199"
    ] }) : null;
  }
  editable(field) {
    const draft = this.definitionDraft();
    return !this.state.busy && !this.state.loading && !this.provider()?.deletedAt && !this.managedModel()?.deletedAt && (draft.mode === "manual" || draft.overrides.includes(field));
  }
  editorScope() {
    return { sequence: this.editorSequence, provider: this.state.provider, model: this.state.model, view: this.state.editorView, tab: this.state.modelTab };
  }
  editorCurrent(scope) {
    return !this.disposed && !this.pending && this.state.editorOpen && this.editorSequence === scope.sequence && scope.provider === this.state.provider && scope.model === this.state.model && scope.view === this.state.editorView && scope.tab === this.state.modelTab;
  }
  editDefinition(scope, update) {
    if (this.editorCurrent(scope) && scope.view === "model" && !this.state.jsonTarget) this.updateDefinition(update);
  }
  openEditor(view, trigger) {
    if (this.pending) return;
    this.editorSequence++;
    this.returnFocus = trigger ?? (typeof document !== "undefined" ? document.activeElement : null);
    this.setState((current) => ({ ...current, editorOpen: true, editorView: view, ...view !== "model" ? { jsonTarget: null } : {} }), () => {
      if (this.editor.current && !this.editor.current.open) this.editor.current.showModal();
    });
  }
  closeEditor() {
    this.editorSequence++;
    if (this.editor.current?.open) this.editor.current.close();
    this.setState({ editorOpen: false });
    if (this.returnFocus?.isConnected !== false) this.returnFocus?.focus();
  }
  changeTab(tab) {
    if (this.pending) return;
    this.editorSequence++;
    this.setState({ modelTab: tab, jsonTarget: null });
  }
  tabKeys(event) {
    const tabs = ["basic", "capabilities", "reasoning", "advanced"];
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.indexOf(this.state.modelTab), next = event.key === "Home" ? 0 : event.key === "End" ? 3 : (index + (event.key === "ArrowRight" ? 1 : -1) + 4) % 4;
    this.changeTab(tabs[next]);
    event.currentTarget.querySelector(`button[data-tab="${tabs[next]}"]`)?.focus();
  }
  selectedLevel() {
    const draft = this.definitionDraft();
    return draft.levels.find((level) => level.id === this.state.levelId) ?? draft.levels[0];
  }
  selectLevel(id) {
    if (this.pending) return;
    this.editorSequence++;
    this.setState({ levelId: id, jsonTarget: null });
  }
  editLevel(scope, id, update) {
    if (!this.editorCurrent(scope) || this.state.jsonTarget || this.selectedLevel()?.id !== id) return;
    const draft = this.definitionDraft();
    if (!draft.levels.some((level) => level.id === id)) return;
    if (update.id !== void 0 && draft.levels.some((level) => level.id !== id && level.id === update.id)) {
      this.setState({ error: "\u7B49\u7EA7 ID \u5DF2\u5B58\u5728\uFF0C\u8BF7\u4F7F\u7528\u552F\u4E00 ID\u3002" });
      return;
    }
    this.updateDefinition({ levels: draft.levels.map((level) => level.id === id ? { ...level, ...update } : level), ...update.id !== void 0 && draft.defaultLevel === id ? { defaultLevel: update.id } : {} });
    if (update.id !== void 0) {
      this.editorSequence++;
      this.setState({ levelId: update.id });
    }
  }
  addLevel(scope) {
    if (!this.editorCurrent(scope)) return;
    const draft = this.definitionDraft();
    let number = draft.levels.length + 1;
    while (draft.levels.some((level) => level.id === `level-${number}`)) number++;
    const id = `level-${number}`;
    this.updateDefinition({ levels: [...draft.levels, { id, label: "\u81EA\u5B9A\u4E49", piLevel: "high", parameters: "{}" }] });
    this.selectLevel(id);
  }
  removeLevel(scope, id) {
    if (!this.editorCurrent(scope) || this.selectedLevel()?.id !== id) return;
    const draft = this.definitionDraft();
    if (draft.levels.length <= 1) return;
    if (draft.defaultLevel === id) {
      this.setState({ error: "\u8BF7\u5148\u660E\u786E\u9009\u62E9\u5176\u4ED6\u6A21\u578B\u9ED8\u8BA4\u7B49\u7EA7\uFF0C\u518D\u79FB\u9664\u6B64\u7B49\u7EA7\u3002" });
      return;
    }
    this.updateDefinition({ levels: draft.levels.filter((level) => level.id !== id) });
    this.selectLevel(draft.levels.find((level) => level.id !== id).id);
  }
  jsonKey(field, levelId) {
    return JSON.stringify([this.state.provider, this.state.model, field, levelId ?? null]);
  }
  pendingJson(provider = this.state.provider, model = this.state.model) {
    return Object.entries(this.state.jsonBuffers).filter(([, buffer]) => buffer.provider === provider && buffer.model === model && buffer.dirty);
  }
  jsonTitle(buffer) {
    return buffer.field === "level" ? `\u7B49\u7EA7 ${buffer.levelId} \u7684\u53C2\u6570` : buffer.field === "parameters" ? "\u6A21\u578B\u989D\u5916\u53C2\u6570" : "\u7ED3\u6784\u5316\u8F93\u51FA";
  }
  jsonSummary(text) {
    try {
      const value = JSON.parse(text);
      return value === null ? "\u672A\u542F\u7528" : value && typeof value === "object" && !Array.isArray(value) ? `${Object.keys(value).length} \u9879\u5B57\u6BB5` : "\u5F85\u4FEE\u6B63 JSON";
    } catch {
      return "\u5F85\u4FEE\u6B63 JSON";
    }
  }
  validateJson(text, field) {
    try {
      const value = JSON.parse(text);
      if (field === "structuredOutput" && value === null) return { error: "", position: null };
      if (!value || typeof value !== "object" || Array.isArray(value)) return { error: field === "structuredOutput" ? "\u7ED3\u6784\u5316\u8F93\u51FA\u987B\u4E3A null \u6216 JSON \u5BF9\u8C61\u3002" : "\u53C2\u6570\u987B\u4E3A JSON \u5BF9\u8C61\u3002", position: null };
      return { error: "", position: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error), match = /position\s+(\d+)/i.exec(message), position = match ? Number(match[1]) : /end of json/i.test(message) ? text.length : null;
      let locator = "";
      if (position !== null) {
        const before = text.slice(0, position), line = before.split("\n").length, column = position - (before.lastIndexOf("\n") + 1) + 1;
        locator = `\u7B2C ${line} \u884C\uFF0C\u7B2C ${column} \u5217\uFF1A`;
      }
      return { error: locator + message, position };
    }
  }
  openJson(field, levelId) {
    if (!this.state.editorOpen || this.state.editorView !== "model" || this.pending) return;
    const draft = this.definitionDraft(), level = field === "level" ? draft.levels.find((row) => row.id === levelId) : null;
    if (field === "level" && (!level || draft.levels.filter((row) => row.id === levelId).length !== 1)) return;
    const key = this.jsonKey(field, levelId), existing = own(this.state.jsonBuffers, key), text = field === "parameters" ? draft.parameters : field === "structuredOutput" ? draft.structuredOutput : level.parameters;
    this.editorSequence++;
    this.setState((current) => ({ modelDrafts: { ...current.modelDrafts, [identity(current.provider, current.model)]: { ...draft, frozen: true } }, jsonBuffers: { ...current.jsonBuffers, [key]: existing?.dirty ? existing : { provider: current.provider, model: current.model, modelId: draft.model, field, levelId, text, original: text, dirty: false, ...this.validateJson(text, field) } }, jsonTarget: key }));
  }
  resumeJson(key) {
    const buffer = own(this.state.jsonBuffers, key);
    if (!buffer || buffer.provider !== this.state.provider || buffer.model !== this.state.model) return;
    this.editorSequence++;
    this.setState({ jsonTarget: key, editorView: "model" });
  }
  jsonCurrent(key, sequence) {
    const buffer = own(this.state.jsonBuffers, key);
    return !this.disposed && !this.pending && this.state.editorOpen && this.state.editorView === "model" && this.state.jsonTarget === key && this.editorSequence === sequence && buffer?.provider === this.state.provider && buffer?.model === this.state.model;
  }
  editJson(key, sequence, text) {
    if (!this.jsonCurrent(key, sequence)) return;
    const buffer = own(this.state.jsonBuffers, key);
    this.setState((current) => ({ jsonBuffers: { ...current.jsonBuffers, [key]: { ...buffer, text, dirty: text !== buffer.original, ...this.validateJson(text, buffer.field) } } }));
  }
  returnFromJson() {
    this.editorSequence++;
    this.setState({ jsonTarget: null });
  }
  finishJson(key, cancel) {
    const buffer = own(this.state.jsonBuffers, key);
    if (!buffer) return;
    this.editorSequence++;
    this.setState((current) => {
      const buffers = { ...current.jsonBuffers };
      delete buffers[key];
      const modelKey = identity(buffer.provider, buffer.model), draft = own(current.modelDrafts, modelKey), hasOther = Object.values(buffers).some((row) => row.provider === buffer.provider && row.model === buffer.model);
      return { ...current, jsonBuffers: buffers, jsonTarget: null, modelDrafts: draft && !hasOther && !draft.dirty ? { ...current.modelDrafts, [modelKey]: { ...draft, frozen: false } } : current.modelDrafts, ...cancel ? { message: "\u672C\u6B21 JSON \u7F13\u51B2\u5DF2\u53D6\u6D88\uFF1B\u5176\u4ED6\u6A21\u578B\u8349\u7A3F\u4FDD\u7559\u3002" } : {} };
    });
  }
  cancelJson(key, sequence) {
    if (this.jsonCurrent(key, sequence)) this.finishJson(key, true);
  }
  applyJson(key, sequence) {
    if (!this.jsonCurrent(key, sequence)) return;
    const buffer = own(this.state.jsonBuffers, key), draft = this.definitionDraft();
    if (buffer.modelId !== draft.model || buffer.field === "level" && draft.levels.filter((level) => level.id === buffer.levelId).length !== 1) {
      this.setState({ error: "JSON \u76EE\u6807\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u5E94\u7528\u5230\u5176\u4ED6\u6A21\u578B\u6216\u7B49\u7EA7\uFF1B\u8BF7\u53D6\u6D88\u6B64\u7F13\u51B2\u540E\u91CD\u65B0\u7F16\u8F91\u3002" });
      return;
    }
    const validation = this.validateJson(buffer.text, buffer.field);
    if (validation.error) {
      this.setState((current) => ({ jsonBuffers: { ...current.jsonBuffers, [key]: { ...buffer, ...validation } } }));
      this.focusJsonError(validation.position);
      return;
    }
    const text = JSON.stringify(JSON.parse(buffer.text), null, 2);
    this.updateDefinition(buffer.field === "parameters" ? { parameters: text } : buffer.field === "structuredOutput" ? { structuredOutput: text } : { levels: draft.levels.map((level) => level.id === buffer.levelId ? { ...level, parameters: text } : level) });
    this.finishJson(key, false);
    this.setState({ message: "JSON \u5DF2\u5E94\u7528\u5230\u6A21\u578B\u8349\u7A3F\uFF1B\u4FDD\u5B58\u6A21\u578B\u914D\u7F6E\u540E\u624D\u4F1A\u6301\u4E45\u5316\u3002" });
  }
  focusJsonError(position) {
    this.jsonInput.current?.focus();
    if (position !== null) this.jsonInput.current?.setSelectionRange(position, position + 1);
  }
  overviewCurrent(provider, version) {
    return !this.disposed && !this.pending && provider === this.state.provider && version === this.state.data?.version;
  }
  renderJson(buffer, key, scope) {
    const sequence = scope.sequence, draft = this.definitionDraft(), targetChanged = buffer.modelId !== draft.model || buffer.field === "level" && !draft.levels.some((level) => level.id === buffer.levelId);
    return /* @__PURE__ */ jsxs("div", { className: "management-json-page", children: [
      /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button management-back", onClick: (event) => {
        event.preventDefault();
        if (this.jsonCurrent(key, sequence)) this.returnFromJson();
      }, children: [
        /* @__PURE__ */ jsx(Icon, { name: "arrow", size: 15 }),
        "\u8FD4\u56DE",
        buffer.field === "level" ? "\u601D\u8003" : "\u9AD8\u7EA7",
        "\u914D\u7F6E"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "settings-eyebrow", children: [
        buffer.provider,
        " / ",
        buffer.modelId || "\u65B0\u6A21\u578B",
        " / ",
        this.jsonTitle(buffer)
      ] }),
      /* @__PURE__ */ jsxs("h3", { children: [
        "\u7F16\u8F91",
        this.jsonTitle(buffer)
      ] }),
      targetChanged ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "JSON \u76EE\u6807\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u5E94\u7528\u5230\u5176\u4ED6\u6A21\u578B\u6216\u7B49\u7EA7\uFF1B\u53EF\u53D6\u6D88\u6B64\u7F13\u51B2\u540E\u91CD\u65B0\u7F16\u8F91\u3002" }) : null,
      /* @__PURE__ */ jsxs("label", { className: "management-json-input-label", children: [
        "JSON \u7F16\u8F91\u5668",
        /* @__PURE__ */ jsxs("div", { className: "management-json-code", children: [
          /* @__PURE__ */ jsx("pre", { "aria-hidden": "true", children: buffer.text.split("\n").map((_, index) => index + 1).join("\n") }),
          /* @__PURE__ */ jsx("textarea", { ref: this.jsonInput, "aria-label": "\u5C40\u90E8 JSON \u7F16\u8F91\u5668", spellCheck: false, value: buffer.text, onChange: (e) => this.editJson(key, sequence, e.target.value), onScroll: (e) => {
            const gutter = e.currentTarget.previousElementSibling;
            if (gutter) gutter.scrollTop = e.currentTarget.scrollTop;
          } })
        ] })
      ] }),
      buffer.error ? /* @__PURE__ */ jsxs("div", { className: "management-json-feedback", children: [
        /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: buffer.error }),
        buffer.position !== null ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => this.focusJsonError(buffer.position), children: "\u5B9A\u4F4D\u9519\u8BEF" }) : null
      ] }) : /* @__PURE__ */ jsxs("p", { role: "status", className: "management-json-valid", children: [
        /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }),
        "JSON \u8BED\u6CD5\u4E0E\u9876\u5C42\u7C7B\u578B\u6709\u6548"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        buffer.field === "structuredOutput" ? "\u53EF\u4F7F\u7528 null \u5173\u95ED\uFF0C\u6216\u586B\u5199\u5305\u542B name\u3001schema\u3001strict \u7684\u5BF9\u8C61\u3002" : "\u53C2\u6570\u5E94\u4E3A JSON \u5BF9\u8C61\u3002",
        " \u53EF\u7528\u5B57\u6BB5\u5C06\u5728\u4FDD\u5B58\u6A21\u578B\u65F6\u8FDB\u4E00\u6B65\u6821\u9A8C\u3002"
      ] })
    ] });
  }
  renderConnection(scope) {
    const s = this.state, provider = this.provider(), draft = this.providerDraft(), locked = s.busy || s.loading, groups = [...new Set(s.data.presets.map((p) => p.group))], edit = (update) => {
      if (this.editorCurrent(scope)) this.updateProvider(update);
    };
    return /* @__PURE__ */ jsxs("form", { id: "management-connection-form", className: "settings-connection-form", onSubmit: (e) => {
      e.preventDefault();
      if (this.editorCurrent(scope)) void this.saveProvider();
    }, children: [
      provider?.requiresCredential ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: "\u6B64\u8FDE\u63A5\u4ECE\u5907\u4EFD\u6062\u590D\uFF0C\u539F\u5BC6\u94A5\u4E0D\u5728\u5907\u4EFD\u4E2D\uFF1B\u8BF7\u91CD\u65B0\u914D\u7F6E\u540E\u518D\u9009\u62E9\u5168\u5C40\u9ED8\u8BA4\u3002" }) : null,
      /* @__PURE__ */ jsxs("label", { children: [
        "\u63D0\u4F9B\u5546\u9884\u8BBE",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u63D0\u4F9B\u5546\u9884\u8BBE", value: s.preset, disabled: locked, onChange: (e) => {
          if (this.editorCurrent(scope)) this.applyPreset(e.target.value);
        }, children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "", children: "\u81EA\u5B9A\u4E49\u8FDE\u63A5" }),
          groups.map((group) => /* @__PURE__ */ jsx("optgroup", { label: group, children: s.data.presets.filter((p) => p.group === group).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) }, group))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u8FDE\u63A5\u540D\u79F0",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5\u540D\u79F0", required: true, maxLength: 100, value: draft.name, disabled: locked, onChange: (e) => edit({ name: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u63D0\u4F9B\u5546 ID",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5\u63D0\u4F9B\u5546 ID", required: true, pattern: "[A-Za-z0-9._-]+", maxLength: 100, value: draft.provider, disabled: locked || !!provider, onChange: (e) => edit({ provider: e.target.value }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "Base URL",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5 Base URL", type: "url", required: true, maxLength: 2e3, value: draft.baseUrl, disabled: locked, placeholder: "https://api.example.com/v1", onChange: (e) => edit({ baseUrl: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "API \u683C\u5F0F",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u8FDE\u63A5 API \u683C\u5F0F", value: draft.api, disabled: locked, onChange: (e) => edit({ api: e.target.value }), children: [
          nativeSelectButton,
          s.data.supportedApis.map((value) => /* @__PURE__ */ jsx("option", { value, children: apiNames[value] }, value))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "API Key",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u8FDE\u63A5 API Key", type: "password", autoComplete: "new-password", required: !!provider?.requiresCredential || !provider?.hasApiKey && provider?.source !== "legacy", maxLength: 8192, value: draft.apiKey, disabled: locked, placeholder: provider?.requiresCredential ? "\u6062\u590D\u540E\u9700\u91CD\u65B0\u914D\u7F6E\u5BC6\u94A5" : provider?.hasApiKey ? "\u5DF2\u914D\u7F6E\uFF1B\u7559\u7A7A\u4FDD\u7559" : provider?.source === "legacy" ? "\u73B0\u6709\u672C\u5730\u914D\u7F6E\uFF1B\u7559\u7A7A\u4FDD\u7559" : "\u9996\u6B21\u4FDD\u5B58\u65F6\u586B\u5199", onChange: (e) => edit({ apiKey: e.target.value }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5BC6\u94A5\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u56DE\u663E\u3002\u73B0\u6709\u5BC6\u94A5\u7559\u7A7A\u4FDD\u7559\uFF0C\u63D0\u4F9B\u5546 ID \u4FDD\u5B58\u540E\u56FA\u5B9A\u3002" }),
      provider ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "management-inline-actions", children: [
          /* @__PURE__ */ jsxs("label", { className: "management-check", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": "\u542F\u7528\u63D0\u4F9B\u5546", checked: provider.enabled, disabled: locked || this.isDefault(s.provider) && provider.enabled, onChange: (e) => {
              if (this.editorCurrent(scope)) void this.setEnabled("provider", e.target.checked);
            } }),
            "\u542F\u7528"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled: locked || this.isDefault(s.provider), onClick: () => {
            if (this.editorCurrent(scope)) void this.remove("provider");
          }, children: "\u5220\u9664\u63D0\u4F9B\u5546" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "management-sheet-test", children: [
          this.renderProbe(provider.test, draft.dirty),
          this.renderTestControls("connection", scope)
        ] })
      ] }) : null
    ] });
  }
  renderTestControls(kind, scope) {
    const s = this.state, provider = this.provider(), model = this.managedModel(), dirty = this.providerDraft().dirty || kind === "model" && (this.definitionDraft().dirty || this.pendingJson().length > 0);
    return /* @__PURE__ */ jsxs("div", { className: "management-test-controls", children: [
      /* @__PURE__ */ jsxs("label", { className: "management-check", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": "\u786E\u8BA4\u6D4B\u8BD5\u53EF\u80FD\u4EA7\u751F\u5C11\u91CF\u8D39\u7528", checked: s.acknowledgedCost, disabled: s.busy || s.loading, onChange: (e) => {
          if (this.editorCurrent(scope)) this.setState({ acknowledgedCost: e.target.checked });
        } }),
        "\u6211\u786E\u8BA4\u4E00\u6B21\u771F\u5B9E\u6D4B\u8BD5\u53EF\u80FD\u4EA7\u751F\u5C11\u91CF\u8D39\u7528"
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: s.busy || s.loading || !s.acknowledgedCost || dirty || !provider?.enabled || kind === "model" && !model?.enabled, onClick: () => {
        if (this.editorCurrent(scope)) void this.runTest(kind);
      }, children: kind === "connection" ? "\u6D4B\u8BD5\u8FDE\u63A5\u4E00\u6B21" : "\u6D4B\u8BD5\u5F53\u524D\u6A21\u578B\u4E00\u6B21" })
    ] });
  }
  renderModel(scope) {
    const s = this.state, draft = this.definitionDraft(), model = this.managedModel(), level = this.selectedLevel(), locked = s.busy || s.loading, edit = (update) => this.editDefinition(scope, update);
    return /* @__PURE__ */ jsxs("form", { id: "management-model-form", className: "settings-model-form management-definition", onSubmit: (e) => {
      e.preventDefault();
      if (this.editorCurrent(scope) && !s.jsonTarget) void this.saveDefinition();
    }, children: [
      /* @__PURE__ */ jsx("nav", { className: "management-sheet-tabs", role: "tablist", "aria-label": "\u6A21\u578B\u914D\u7F6E\u5206\u533A", onKeyDown: (e) => this.tabKeys(e), children: [{ id: "basic", label: "\u57FA\u672C" }, { id: "capabilities", label: "\u80FD\u529B" }, { id: "reasoning", label: "\u601D\u8003" }, { id: "advanced", label: "\u9AD8\u7EA7" }].map((tab) => /* @__PURE__ */ jsx("button", { type: "button", role: "tab", "data-tab": tab.id, "aria-selected": s.modelTab === tab.id, "aria-controls": `management-tab-${tab.id}`, tabIndex: s.modelTab === tab.id ? 0 : -1, onClick: () => {
        if (this.editorCurrent(scope)) this.changeTab(tab.id);
      }, children: tab.label }, tab.id)) }),
      /* @__PURE__ */ jsxs("div", { id: `management-tab-${s.modelTab}`, role: "tabpanel", className: "management-tab-content", children: [
        s.modelTab === "basic" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6A21\u578B ID",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u6A21\u578B ID", required: true, maxLength: 160, value: draft.model, disabled: locked || !!model, onChange: (e) => {
                if (this.editorCurrent(scope)) {
                  this.recommendationEpoch++;
                  this.setState({ recommendation: null, recommendationLoading: false });
                  edit({ model: e.target.value });
                }
              } })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u663E\u793A\u540D\u79F0",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u6A21\u578B\u663E\u793A\u540D\u79F0", required: true, maxLength: 100, value: draft.name, disabled: !this.editable("name"), onChange: (e) => edit({ name: e.target.value }) })
              ] }),
              this.renderOverride("name", scope)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u4E0A\u4E0B\u6587\u7A97\u53E3",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u4E0A\u4E0B\u6587\u7A97\u53E3", type: "number", min: 1, required: true, value: draft.contextWindow, disabled: !this.editable("contextWindow"), onChange: (e) => edit({ contextWindow: e.target.value }) })
              ] }),
              this.renderOverride("contextWindow", scope)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u6700\u5927\u8F93\u51FA tokens",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u6700\u5927\u8F93\u51FA tokens", type: "number", min: 1, required: true, value: draft.maxTokens, disabled: !this.editable("maxTokens"), onChange: (e) => edit({ maxTokens: e.target.value }) })
              ] }),
              this.renderOverride("maxTokens", scope)
            ] })
          ] }),
          model ? /* @__PURE__ */ jsxs("div", { className: "management-inline-actions", children: [
            /* @__PURE__ */ jsxs("label", { className: "management-check", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": "\u542F\u7528\u6A21\u578B", checked: model.enabled, disabled: locked || this.isDefault(s.provider, s.model) && model.enabled, onChange: (e) => {
                if (this.editorCurrent(scope)) void this.setEnabled("model", e.target.checked, s.provider, s.model, s.data.version);
              } }),
              "\u542F\u7528\u6A21\u578B"
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled: locked || this.isDefault(s.provider, s.model), onClick: () => {
              if (this.editorCurrent(scope)) void this.remove("model");
            }, children: "\u5220\u9664\u6A21\u578B" })
          ] }) : null
        ] }) : null,
        s.modelTab === "capabilities" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u80FD\u529B\u58F0\u660E\u4E0D\u4EE3\u8868\u771F\u5B9E\u8C03\u7528\u5DF2\u9A8C\u8BC1\u3002" }),
          /* @__PURE__ */ jsx("div", { className: "management-capabilities", children: Object.keys(capabilityNames).map((key) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "management-check", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u6A21\u578B\u80FD\u529B ${key}`, checked: draft.capabilities[key], disabled: !this.editable(`capabilities.${key}`), onChange: (e) => edit({ capabilities: { ...draft.capabilities, [key]: e.target.checked } }) }),
              capabilityNames[key]
            ] }),
            this.renderOverride(`capabilities.${key}`, scope),
            /* @__PURE__ */ jsx("small", { children: draft.dirty ? "\u58F0\u660E\u5DF2\u4FEE\u6539\uFF0C\u4FDD\u5B58\u540E\u6838\u5BF9\u6709\u6548\u72B6\u6001" : model?.effectiveCapabilities[key] ? effectiveNames[model.effectiveCapabilities[key].state] + " \xB7 " + model.effectiveCapabilities[key].reason : "\u4FDD\u5B58\u540E\u7531\u9002\u914D\u5668\u6838\u5BF9\u6709\u6548\u72B6\u6001" })
          ] }, key)) })
        ] }) : null,
        s.modelTab === "reasoning" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6A21\u578B\u9ED8\u8BA4\u601D\u8003\u7B49\u7EA7",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u6A21\u578B\u9ED8\u8BA4\u601D\u8003\u7B49\u7EA7", value: draft.defaultLevel, disabled: !this.editable("reasoning"), onChange: (e) => edit({ defaultLevel: e.target.value }), children: [
                nativeSelectButton,
                draft.levels.map((row, index) => /* @__PURE__ */ jsx("option", { value: row.id, children: row.label || row.id }, index))
              ] })
            ] }),
            this.renderOverride("reasoning", scope),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u4FEE\u6539\u6B64\u6A21\u578B\u9ED8\u8BA4\u7B49\u7EA7\uFF1B\u65B0\u4F1A\u8BDD\u7684\u5168\u5C40\u9ED8\u8BA4\u6A21\u578B\u4E0E\u601D\u8003\u9009\u62E9\u4E0D\u53D8\u3002" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
            /* @__PURE__ */ jsx("h3", { children: "\u601D\u8003\u7B49\u7EA7\u914D\u7F6E" }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", disabled: !this.editable("reasoning"), onClick: () => this.addLevel(scope), children: [
              /* @__PURE__ */ jsx(Icon, { name: "plus", size: 14 }),
              "\u6DFB\u52A0\u7B49\u7EA7"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "management-level-list", role: "listbox", "aria-label": "\u601D\u8003\u7B49\u7EA7\u5217\u8868", onKeyDown: (e) => {
            if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
            e.preventDefault();
            const index = draft.levels.findIndex((row) => row.id === level?.id), next = e.key === "Home" ? 0 : e.key === "End" ? draft.levels.length - 1 : (index + (e.key === "ArrowDown" ? 1 : -1) + draft.levels.length) % draft.levels.length;
            this.selectLevel(draft.levels[next].id);
            e.currentTarget.querySelectorAll("button")[next]?.focus();
          }, children: draft.levels.map((row, index) => /* @__PURE__ */ jsxs("button", { type: "button", role: "option", "aria-selected": row.id === level?.id, tabIndex: row.id === level?.id ? 0 : -1, onClick: () => {
            if (this.editorCurrent(scope)) this.selectLevel(row.id);
          }, children: [
            /* @__PURE__ */ jsx(Icon, { name: row.id === level?.id ? "check" : "cpu", size: 15 }),
            /* @__PURE__ */ jsx("strong", { children: row.label || row.id }),
            /* @__PURE__ */ jsxs("span", { children: [
              "ID: ",
              row.id
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "Pi: ",
              row.piLevel
            ] }),
            row.id === draft.defaultLevel ? /* @__PURE__ */ jsx("small", { children: "\u9ED8\u8BA4" }) : null
          ] }, index)) }),
          level ? /* @__PURE__ */ jsxs("section", { className: "management-level-editor", "aria-label": "\u5355\u6761\u601D\u8003\u7B49\u7EA7\u7F16\u8F91", children: [
            /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
              /* @__PURE__ */ jsxs("h3", { children: [
                "\u7F16\u8F91\u300C",
                level.label || level.id,
                "\u300D\u7B49\u7EA7"
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled: !this.editable("reasoning") || draft.levels.length <= 1, onClick: () => this.removeLevel(scope, level.id), children: "\u79FB\u9664\u6B64\u7B49\u7EA7" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u7B49\u7EA7\u540D\u79F0",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u5F53\u524D\u7B49\u7EA7\u540D\u79F0", required: true, maxLength: 100, value: level.label, disabled: !this.editable("reasoning"), onChange: (e) => this.editLevel(scope, level.id, { label: e.target.value }) })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u7B49\u7EA7 ID",
                /* @__PURE__ */ jsx("input", { "aria-label": "\u5F53\u524D\u7B49\u7EA7 ID", required: true, maxLength: 100, value: level.id, disabled: !this.editable("reasoning"), onChange: (e) => this.editLevel(scope, level.id, { id: e.target.value }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "Pi \u63A8\u7406\u6863\u4F4D",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u5F53\u524D\u7B49\u7EA7 Pi \u6863\u4F4D", value: level.piLevel, disabled: !this.editable("reasoning"), onChange: (e) => this.editLevel(scope, level.id, { piLevel: e.target.value }), children: [
                nativeSelectButton,
                piLevels.map((value) => /* @__PURE__ */ jsx("option", { value, children: value }, value))
              ] })
            ] }),
            this.renderJsonEntry("level", scope, level.id)
          ] }) : null
        ] }) : null,
        s.modelTab === "advanced" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u914D\u7F6E\u65B9\u5F0F",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u6A21\u578B\u914D\u7F6E\u65B9\u5F0F", value: draft.mode, disabled: locked, onChange: (e) => edit({ mode: e.target.value }), children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "manual", children: "\u624B\u52A8\u914D\u7F6E" }),
              /* @__PURE__ */ jsx("option", { value: "matched", children: "\u672C\u5730\u76EE\u5F55\u667A\u80FD\u5339\u914D" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "management-inline-actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked || s.recommendationLoading || !draft.model.trim(), onClick: () => {
              if (this.editorCurrent(scope)) void this.previewRecommendation();
            }, children: s.recommendationLoading ? "\u6B63\u5728\u5339\u914D\u2026" : "\u9884\u89C8\u672C\u5730\u63A8\u8350" }),
            s.recommendation?.value ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked, onClick: () => {
              if (this.editorCurrent(scope)) this.applyRecommendation();
            }, children: "\u5E94\u7528\u63A8\u8350\u5230\u8349\u7A3F" }) : null
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u5339\u914D\u5DF2\u5B89\u88C5 Pi \u7684\u672C\u5730\u6A21\u578B\u76EE\u5F55\uFF1B\u672A\u77E5\u6A21\u578B\u9700\u624B\u52A8\u914D\u7F6E\uFF0C\u624B\u52A8\u8986\u5199\u4FDD\u7559\u3002" }),
          s.recommendation ? /* @__PURE__ */ jsxs("div", { className: "management-recommendation", children: [
            /* @__PURE__ */ jsx("p", { children: s.recommendation.matched ? `\u5339\u914D\u6765\u6E90\uFF1A${s.recommendation.source?.provider} / ${s.recommendation.source?.model} \xB7 Pi ${s.recommendation.source?.sdkVersion}` : "\u672A\u627E\u5230\u672C\u5730\u76EE\u5F55\u5339\u914D\uFF0C\u8BF7\u4F7F\u7528\u624B\u52A8\u914D\u7F6E\u3002" }),
            s.recommendation.changes.length ? /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsxs("summary", { children: [
                s.recommendation.changes.length,
                " \u9879\u5EFA\u8BAE\u53D8\u66F4"
              ] }),
              /* @__PURE__ */ jsx("ul", { children: s.recommendation.changes.map((change) => /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsx("code", { children: change.field }),
                "\uFF1A",
                JSON.stringify(change.current) ?? "\u672A\u8BBE\u7F6E",
                " \u2192 ",
                JSON.stringify(change.recommended) ?? "\u672A\u8BBE\u7F6E"
              ] }, change.field)) })
            ] }) : null
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u539F\u751F\u9002\u914D profile",
              /* @__PURE__ */ jsxs("select", { "aria-label": "\u539F\u751F\u9002\u914D profile", value: draft.nativeProfile, disabled: !this.editable("nativeProfile"), onChange: (e) => edit({ nativeProfile: e.target.value }), children: [
                nativeSelectButton,
                ["none", "openai", "anthropic", "qwen", "openrouter"].map((value) => /* @__PURE__ */ jsx("option", { value, children: value === "none" ? "none \xB7 \u4E0D\u4F7F\u7528\u539F\u751F\u6269\u5C55" : value }, value))
              ] })
            ] }),
            this.renderOverride("nativeProfile", scope)
          ] }),
          this.renderJsonEntry("parameters", scope),
          this.renderJsonEntry("structuredOutput", scope),
          model ? /* @__PURE__ */ jsxs("div", { className: "management-sheet-test", children: [
            this.renderProbe(model.test, draft.dirty || this.providerDraft().dirty || this.pendingJson().length > 0),
            this.renderTestControls("model", scope)
          ] }) : null
        ] }) : null
      ] })
    ] });
  }
  renderJsonEntry(field, scope, levelId) {
    const draft = this.definitionDraft(), text = field === "parameters" ? draft.parameters : field === "structuredOutput" ? draft.structuredOutput : draft.levels.find((row) => row.id === levelId)?.parameters ?? "{}", buffer = own(this.state.jsonBuffers, this.jsonKey(field, levelId)), override = field === "level" ? "reasoning" : field;
    return /* @__PURE__ */ jsxs("div", { className: "management-json-entry", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: field === "level" ? "\u7B49\u7EA7\u53C2\u6570" : field === "parameters" ? "\u6A21\u578B\u989D\u5916\u53C2\u6570" : "\u7ED3\u6784\u5316\u8F93\u51FA" }),
        /* @__PURE__ */ jsx("small", { children: buffer?.dirty ? "\u6709\u672A\u5E94\u7528 JSON" : this.jsonSummary(text) })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", disabled: !this.editable(override), onClick: () => {
        if (this.editorCurrent(scope)) this.openJson(field, levelId);
      }, children: [
        /* @__PURE__ */ jsx(Icon, { name: "edit", size: 14 }),
        buffer?.dirty ? "\u7EE7\u7EED\u7F16\u8F91 JSON" : "\u7F16\u8F91 JSON"
      ] }),
      field !== "level" ? this.renderOverride(field, scope) : null
    ] });
  }
  renderDefault(scope) {
    const s = this.state, usable = s.data.providers.filter((p) => p.enabled && !p.deletedAt && !p.requiresCredential).flatMap((p) => p.models.filter((m) => m.enabled && !m.deletedAt).map((m) => ({ provider: p, model: m }))), selected = usable.find((row) => row.provider.provider === s.selection.provider && row.model.model === s.selection.model), locked = s.busy || s.loading;
    return /* @__PURE__ */ jsxs("form", { id: "management-default-form", className: "settings-default-form", onSubmit: (e) => {
      e.preventDefault();
      if (this.editorCurrent(scope)) void this.saveDefault();
    }, children: [
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5F53\u524D\u4F1A\u8BDD\u4E0E\u5404\u6A21\u578B\u9ED8\u8BA4\u7B49\u7EA7\u4E0D\u53D7\u5F71\u54CD\u3002" }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5DF2\u6709\u6A21\u578B",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u9009\u62E9\u5DF2\u6709\u6A21\u578B", value: identity(s.selection.provider, s.selection.model), disabled: locked, onChange: (e) => {
          if (this.editorCurrent(scope)) this.chooseDefault(e.target.value);
        }, children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: identity("", ""), children: "\u9009\u62E9\u6A21\u578B" }),
          usable.map((row) => /* @__PURE__ */ jsxs("option", { value: identity(row.provider.provider, row.model.model), children: [
            row.provider.name,
            " / ",
            row.model.name,
            " \xB7 ",
            row.model.model
          ] }, identity(row.provider.provider, row.model.model)))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u601D\u8003\u914D\u7F6E",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u601D\u8003\u914D\u7F6E", value: s.selection.thinking, disabled: locked || !selected, onChange: (e) => {
          if (this.editorCurrent(scope)) this.updateSelection({ thinking: e.target.value });
        }, children: [
          nativeSelectButton,
          selected?.model.reasoning.levels.map((level) => /* @__PURE__ */ jsxs("option", { value: level.id, children: [
            level.label,
            " \xB7 ",
            level.piLevel
          ] }, level.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "management-inline-actions", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked || !s.data.defaultModel.provider, onClick: () => {
          if (this.editorCurrent(scope)) void this.saveDefault(true);
        }, children: "\u6E05\u7A7A\u9ED8\u8BA4\u6A21\u578B" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: locked, onClick: () => {
          if (this.editorCurrent(scope)) void this.load(false, true);
        }, children: "\u5237\u65B0\u9ED8\u8BA4\u6A21\u578B\u7248\u672C" })
      ] }),
      !s.data.defaultUsable && s.data.defaultModel.provider ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u5F53\u524D\u9ED8\u8BA4\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u660E\u786E\u9009\u62E9\u4E00\u4E2A\u5DF2\u542F\u7528\u4E14\u51ED\u636E\u53EF\u7528\u7684\u6A21\u578B\u3002" }) : null
    ] });
  }
  render() {
    const s = this.state, data = s.data, provider = this.provider(), model = this.managedModel(), draft = this.providerDraft(), definition = this.definitionDraft(), providers = this.providers(), models = this.models(), scope = this.editorScope(), locked = s.busy || s.loading, buffer = s.jsonTarget ? own(s.jsonBuffers, s.jsonTarget) : void 0;
    if (!data) return /* @__PURE__ */ jsxs("section", { className: "surface management-loading", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u6A21\u578B\u7BA1\u7406" }),
      s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: s.error }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6A21\u578B\u7BA1\u7406\u76EE\u5F55\u2026" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: s.loading, onClick: () => void this.load(false), children: s.loading ? "\u6B63\u5728\u8BFB\u53D6\u2026" : "\u91CD\u65B0\u8BFB\u53D6" })
    ] });
    const brand = (p) => data.presets.find((preset) => preset.providerBrand === p.provider || preset.baseUrl === p.baseUrl)?.group ?? "\u81EA\u5B9A\u4E49\u4E0E\u672C\u5730", currentDefault = data.providers.find((p) => p.provider === data.defaultModel.provider)?.models.find((m) => m.model === data.defaultModel.model), usableDefault = data.providers.some((p) => p.enabled && !p.deletedAt && !p.requiresCredential && p.models.some((m) => m.enabled && !m.deletedAt && m.model === s.selection.model) && p.provider === s.selection.provider);
    const orderButtons = (kind, ids, id) => {
      const index = ids.indexOf(id);
      return /* @__PURE__ */ jsxs("div", { className: "management-order", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": `\u4E0A\u79FB ${id}`, disabled: locked || index <= 0, onClick: () => {
          if (this.overviewCurrent(s.provider, data.version)) void this.reorder(kind, id, ids[index - 1]);
        }, children: "\u2191" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": `\u4E0B\u79FB ${id}`, disabled: locked || index < 0 || index === ids.length - 1, onClick: () => {
          if (this.overviewCurrent(s.provider, data.version)) void this.reorder(kind, id, ids[index + 1]);
        }, children: "\u2193" })
      ] });
    };
    const sheetDirty = s.editorView === "connection" ? draft.dirty : s.editorView === "default" ? s.defaultDirty : definition.dirty || this.pendingJson().length > 0, title = s.editorView === "connection" ? `${provider?.name || "\u6DFB\u52A0\u63D0\u4F9B\u5546"} / \u8FDE\u63A5\u914D\u7F6E` : s.editorView === "default" ? "\u65B0\u4F1A\u8BDD\u5168\u5C40\u9ED8\u8BA4" : `${model?.name || definition.name || "\u6DFB\u52A0\u6A21\u578B"} / \u6A21\u578B\u914D\u7F6E`;
    return /* @__PURE__ */ jsxs("div", { className: "management-page-body", children: [
      /* @__PURE__ */ jsxs("div", { className: "management-toolbar", children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: locked, onClick: () => void this.load(false), children: "\u5237\u65B0\u6982\u89C8" })
      ] }),
      s.error && !s.editorOpen ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text settings-feedback", children: s.error }) : null,
      s.message && !s.editorOpen ? /* @__PURE__ */ jsx("p", { role: "status", className: "settings-feedback", children: s.message }) : null,
      /* @__PURE__ */ jsxs("div", { className: "settings-model-workspace management-overview", children: [
        /* @__PURE__ */ jsxs("nav", { className: "settings-provider-list", "aria-label": "\u6A21\u578B\u63D0\u4F9B\u5546", children: [
          /* @__PURE__ */ jsxs("div", { className: "settings-list-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: "\u63D0\u4F9B\u5546" }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", disabled: locked, onClick: (e) => {
              this.chooseProvider("");
              this.openEditor("connection", e.currentTarget);
            }, children: [
              /* @__PURE__ */ jsx(Icon, { name: "plus", size: 14 }),
              "\u6DFB\u52A0"
            ] })
          ] }),
          [...new Set(providers.map(brand))].map((group) => /* @__PURE__ */ jsxs("div", { className: "management-provider-group", children: [
            /* @__PURE__ */ jsx("h3", { children: group }),
            providers.filter((p) => brand(p) === group).map((p) => /* @__PURE__ */ jsx("div", { className: "management-provider-row", draggable: !locked, onDragStart: () => {
              this.dragged = { kind: "providers", id: p.provider, provider: p.provider };
            }, onDragEnd: () => {
              this.dragged = void 0;
            }, onDragOver: (e) => {
              if (this.dragged?.kind === "providers") e.preventDefault();
            }, onDrop: (e) => {
              e.preventDefault();
              if (this.overviewCurrent(s.provider, data.version)) this.drop("providers", p.provider);
            }, children: /* @__PURE__ */ jsxs("button", { type: "button", disabled: locked, "aria-pressed": p.provider === s.provider, onClick: () => this.chooseProvider(p.provider), children: [
              /* @__PURE__ */ jsx("span", { className: "settings-provider-avatar", "aria-hidden": "true", children: p.name.slice(0, 1).toUpperCase() }),
              /* @__PURE__ */ jsxs("span", { className: "settings-provider-copy", children: [
                /* @__PURE__ */ jsx("strong", { children: p.name }),
                /* @__PURE__ */ jsxs("small", { children: [
                  p.provider,
                  " \xB7 ",
                  p.enabled ? "\u542F\u7528" : "\u5DF2\u505C\u7528",
                  p.requiresCredential ? " \xB7 \u5F85\u6062\u590D\u5BC6\u94A5" : "",
                  this.isDefault(p.provider) ? " \xB7 \u9ED8\u8BA4" : "",
                  own(s.providerDrafts, identity(p.provider))?.dirty ? " \xB7 \u672A\u4FDD\u5B58" : ""
                ] })
              ] }),
              /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 14 })
            ] }) }, p.provider))
          ] }, group)),
          /* @__PURE__ */ jsx("p", { className: "small muted management-sort-hint", children: "\u62D6\u52A8\u63D0\u4F9B\u5546\u53EF\u8C03\u6574\u987A\u5E8F\u3002" })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "management-overview-main", "aria-label": "\u6A21\u578B\u7BA1\u7406\u6982\u89C8", children: [
          /* @__PURE__ */ jsxs("header", { className: "settings-detail-heading", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { children: provider?.name || "\u9009\u62E9\u6216\u6DFB\u52A0\u63D0\u4F9B\u5546" }),
              /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
                "\u63D0\u4F9B\u5546 ID\uFF1A",
                provider?.provider || "\u5C1A\u672A\u9009\u62E9"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "management-inline-actions", children: [
              /* @__PURE__ */ jsx("span", { className: "settings-default-tag", children: provider?.requiresCredential ? "\u5F85\u6062\u590D\u5BC6\u94A5" : provider?.source === "legacy" ? "\u672C\u5730\u914D\u7F6E" : provider ? "\u5DF2\u4FDD\u5B58" : "\u672A\u914D\u7F6E" }),
              /* @__PURE__ */ jsx("span", { className: "settings-default-tag", children: draft.dirty ? "\u7F16\u8F91\u672A\u4FDD\u5B58 \xB7 \u6D4B\u8BD5\u5931\u6548" : provider?.test?.state === "passed" ? "\u6700\u5C0F\u6D4B\u8BD5\u901A\u8FC7" : provider?.test?.state === "failed" ? "\u6700\u5C0F\u6D4B\u8BD5\u5931\u8D25" : provider?.test?.state === "stale" ? "\u6D4B\u8BD5\u5DF2\u5931\u6548" : "\u672A\u6D4B\u8BD5" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked, onClick: (e) => this.openEditor("connection", e.currentTarget), children: "\u7F16\u8F91\u8FDE\u63A5" })
            ] })
          ] }),
          provider ? /* @__PURE__ */ jsxs("p", { className: "management-connection-summary", children: [
            /* @__PURE__ */ jsx("span", { children: apiNames[provider.api] }),
            /* @__PURE__ */ jsx("code", { children: provider.baseUrl || "\u4F7F\u7528\u73B0\u6709\u672C\u5730\u63A5\u5165" })
          ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6DFB\u52A0\u8FDE\u63A5\u540E\uFF0C\u518D\u72EC\u7ACB\u6DFB\u52A0\u6A21\u578B\u548C\u9009\u62E9\u5168\u5C40\u9ED8\u8BA4\u3002" }),
          /* @__PURE__ */ jsxs("div", { className: "settings-list-heading management-model-heading", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              "\u6A21\u578B\u5217\u8868 ",
              /* @__PURE__ */ jsx("span", { children: models.length })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary", disabled: locked || !provider, onClick: (e) => {
              this.chooseModel("");
              this.openEditor("model", e.currentTarget);
            }, children: [
              /* @__PURE__ */ jsx(Icon, { name: "plus", size: 14 }),
              "\u6DFB\u52A0\u6A21\u578B"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("table", { className: "management-model-table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "\u6A21\u578B\u540D\u79F0 / ID" }),
              /* @__PURE__ */ jsx("th", { children: "\u6A21\u578B\u9ED8\u8BA4\u7B49\u7EA7" }),
              /* @__PURE__ */ jsx("th", { children: "\u542F\u7528" }),
              /* @__PURE__ */ jsx("th", { children: "\u6392\u5E8F" }),
              /* @__PURE__ */ jsx("th", { children: "\u64CD\u4F5C" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: models.map((m) => /* @__PURE__ */ jsxs("tr", { className: "management-model-row", "data-selected": m.model === s.model, draggable: !locked, onDragStart: () => {
              this.dragged = { kind: "models", id: m.model, provider: s.provider };
            }, onDragEnd: () => {
              this.dragged = void 0;
            }, onDragOver: (e) => {
              if (this.dragged?.kind === "models" && this.dragged.provider === s.provider) e.preventDefault();
            }, onDrop: (e) => {
              e.preventDefault();
              if (this.overviewCurrent(s.provider, data.version)) this.drop("models", m.model);
            }, children: [
              /* @__PURE__ */ jsxs("td", { "data-label": "\u6A21\u578B", children: [
                /* @__PURE__ */ jsx("strong", { children: m.name || m.model }),
                /* @__PURE__ */ jsx("code", { children: m.model }),
                this.isDefault(s.provider, m.model) ? /* @__PURE__ */ jsx("small", { className: "settings-default-tag", children: "\u5168\u5C40\u9ED8\u8BA4" }) : null,
                own(s.modelDrafts, identity(s.provider, m.model))?.dirty || this.pendingJson(s.provider, m.model).length ? /* @__PURE__ */ jsx("small", { className: "management-unsaved", children: "\u6709\u672A\u4FDD\u5B58\u7F16\u8F91" }) : null
              ] }),
              /* @__PURE__ */ jsx("td", { "data-label": "\u6A21\u578B\u9ED8\u8BA4\u7B49\u7EA7", children: m.reasoning.levels.find((level) => level.id === m.reasoning.defaultLevel)?.label || m.reasoning.defaultLevel }),
              /* @__PURE__ */ jsx("td", { "data-label": "\u542F\u7528", children: /* @__PURE__ */ jsxs("label", { className: "management-check", children: [
                /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u542F\u7528\u6A21\u578B ${m.model}`, checked: m.enabled, disabled: locked || this.isDefault(s.provider, m.model) && m.enabled, onChange: (e) => {
                  if (this.overviewCurrent(s.provider, data.version)) {
                    this.chooseModel(m.model);
                    void this.setEnabled("model", e.target.checked, s.provider, m.model, data.version);
                  }
                } }),
                /* @__PURE__ */ jsxs("span", { className: "sr-only", children: [
                  "\u542F\u7528 ",
                  m.model
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { "data-label": "\u6392\u5E8F", children: orderButtons("models", models.map((row) => row.model), m.model) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", "aria-label": `\u7F16\u8F91\u6A21\u578B ${m.model}`, disabled: locked, onClick: (e) => {
                this.chooseModel(m.model);
                this.openEditor("model", e.currentTarget);
              }, children: [
                /* @__PURE__ */ jsx(Icon, { name: "edit", size: 15 }),
                "\u7F16\u8F91"
              ] }) })
            ] }, m.model)) })
          ] }),
          !models.length ? /* @__PURE__ */ jsx("p", { className: "settings-empty", children: "\u5C1A\u65E0\u5DF2\u4FDD\u5B58\u6A21\u578B\u3002" }) : null,
          /* @__PURE__ */ jsxs("section", { className: "management-default-summary", "aria-label": "\u9ED8\u8BA4\u6A21\u578B", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { children: "\u65B0\u4F1A\u8BDD\u5168\u5C40\u9ED8\u8BA4" }),
              /* @__PURE__ */ jsx("p", { children: data.defaultModel.provider ? `${currentDefault?.name || data.defaultModel.model} \xB7 ${currentDefault?.reasoning.levels.find((level) => level.id === data.defaultModel.thinking)?.label || data.defaultModel.thinking}` : "\u5C1A\u672A\u8BBE\u7F6E\u5168\u5C40\u9ED8\u8BA4" }),
              /* @__PURE__ */ jsx("small", { children: data.defaultModel.provider ? `${data.defaultModel.provider} / ${data.defaultModel.model}` : "\u65B0\u4F1A\u8BDD\u9700\u8981\u660E\u786E\u9009\u62E9\u6A21\u578B" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked, onClick: (e) => this.openEditor("default", e.currentTarget), children: "\u66F4\u6539\u9ED8\u8BA4" })
          ] }),
          !data.defaultUsable && data.defaultModel.provider ? /* @__PURE__ */ jsx("p", { className: "error-text small", role: "alert", children: "\u5F53\u524D\u5168\u5C40\u9ED8\u8BA4\u4E0D\u53EF\u7528\uFF0C\u8BF7\u66F4\u6539\u6216\u660E\u786E\u6E05\u7A7A\u3002" }) : null,
          /* @__PURE__ */ jsxs("details", { className: "management-history", children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "\u5220\u9664\u5386\u53F2 \xB7 ",
              data.providers.filter((p) => p.deletedAt).length,
              " \u4E2A\u63D0\u4F9B\u5546 / ",
              data.providers.reduce((sum, p) => sum + p.models.filter((m) => m.deletedAt).length, 0),
              " \u4E2A\u6A21\u578B"
            ] }),
            data.providers.flatMap((p) => [...p.deletedAt ? [/* @__PURE__ */ jsxs("p", { children: [
              p.name,
              " \xB7 ",
              p.provider,
              " \xB7 \u5220\u9664\u4E8E ",
              p.deletedAt
            ] }, p.provider)] : [], ...p.models.filter((m) => m.deletedAt).map((m) => /* @__PURE__ */ jsxs("p", { children: [
              p.provider,
              " / ",
              m.name,
              " \xB7 ",
              m.model,
              " \xB7 \u5220\u9664\u4E8E ",
              m.deletedAt
            ] }, identity(p.provider, m.model)))]),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4FDD\u7559\u5BA1\u8BA1\u4E0E\u65E7\u4F1A\u8BDD\u914D\u7F6E\uFF0C\u5DF2\u5220\u9664\u6807\u8BC6\u4E0D\u53EF\u91CD\u65B0\u4F7F\u7528\u3002" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.editor, className: "management-editor", "aria-modal": "true", "aria-label": title, onCancel: (e) => {
        e.preventDefault();
        this.closeEditor();
      }, onClose: () => {
        if (s.editorOpen) {
          this.editorSequence++;
          this.setState({ editorOpen: false });
        }
      }, children: [
        /* @__PURE__ */ jsxs("header", { className: "management-editor-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { children: title }),
            s.editorView === "default" ? null : /* @__PURE__ */ jsx("p", { children: `\u63D0\u4F9B\u5546\uFF1A${s.provider || "\u65B0\u8FDE\u63A5"}${s.editorView === "model" ? ` \xB7 \u6A21\u578B ID\uFF1A${definition.model || "\u65B0\u6A21\u578B"}` : ""}` }),
            s.editorView !== "default" && !buffer ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button management-header-refresh", disabled: locked, onClick: () => {
              if (this.editorCurrent(scope)) void this.load(true);
            }, children: "\u5237\u65B0\u5F53\u524D\u7248\u672C" }) : null
          ] }),
          /* @__PURE__ */ jsx("span", { className: "management-editor-state " + (sheetDirty ? "dirty" : ""), children: sheetDirty ? "\u672A\u4FDD\u5B58" : s.editorView === "connection" && !provider || s.editorView === "model" && !model ? "\u5C1A\u672A\u4FDD\u5B58" : "\u5DF2\u4FDD\u5B58\u914D\u7F6E" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED\u914D\u7F6E\u7F16\u8F91\u680F", onClick: () => this.closeEditor(), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 18 }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "management-editor-scroll", children: [
          s.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text settings-feedback", children: s.error }) : null,
          s.message ? /* @__PURE__ */ jsx("p", { role: "status", className: "settings-feedback", children: s.message }) : null,
          buffer && s.jsonTarget ? this.renderJson(buffer, s.jsonTarget, scope) : s.editorView === "connection" ? this.renderConnection(scope) : s.editorView === "default" ? this.renderDefault(scope) : this.renderModel(scope),
          !buffer && s.editorView === "model" && this.pendingJson().length ? /* @__PURE__ */ jsxs("div", { className: "management-pending-json", role: "status", children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              "\u6709 ",
              this.pendingJson().length,
              " \u9879 JSON \u672A\u5E94\u7528\uFF0C\u4FDD\u5B58\u6A21\u578B\u524D\u9700\u660E\u786E\u5904\u7406\u3002"
            ] }),
            this.pendingJson().map(([key, row]) => /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", onClick: () => this.resumeJson(key), children: [
              "\u7EE7\u7EED\u7F16\u8F91 ",
              this.jsonTitle(row)
            ] }, key))
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx("footer", { className: "management-editor-footer", children: buffer && s.jsonTarget ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { children: "\u5E94\u7528\u540E\u8FD4\u56DE\u914D\u7F6E\uFF1B\u4FDD\u5B58\u6A21\u578B\u540E\u624D\u751F\u6548\u3002" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: locked, onClick: (event) => {
              event.preventDefault();
              this.cancelJson(s.jsonTarget, scope.sequence);
            }, children: "\u53D6\u6D88\u672C\u6B21\u7F16\u8F91" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "primary", disabled: locked || !!buffer.error, onClick: (event) => {
              event.preventDefault();
              this.applyJson(s.jsonTarget, scope.sequence);
            }, children: "\u5E94\u7528\u5230\u6A21\u578B\u8349\u7A3F" })
          ] }, "json-local-actions")
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { children: s.editorView === "model" ? "\u5DF2\u4FEE\u6539\u5185\u5BB9\u4EC5\u5728\u4FDD\u5B58\u6A21\u578B\u540E\u751F\u6548\uFF1B\u6D4B\u8BD5\u4E0E\u5168\u5C40\u9ED8\u8BA4\u72EC\u7ACB\u3002" : s.editorView === "connection" ? "\u4EC5\u4FDD\u5B58\u8FDE\u63A5\uFF1B\u4E0D\u8C03\u7528\u4F9B\u5E94\u5546\uFF0C\u4E0D\u6539\u53D8\u6A21\u578B\u9ED8\u8BA4\u3002" : "\u4EC5\u4FDD\u5B58\u65B0\u4F1A\u8BDD\u5168\u5C40\u9ED8\u8BA4\uFF1B\u4E0D\u4FEE\u6539\u6A21\u578B\u914D\u7F6E\u3002" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: () => this.closeEditor(), children: "\u5173\u95ED\uFF0C\u4FDD\u7559\u8349\u7A3F" }),
            /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", form: s.editorView === "connection" ? "management-connection-form" : s.editorView === "model" ? "management-model-form" : "management-default-form", disabled: locked || s.editorView === "model" && this.pendingJson().length > 0 || s.editorView === "default" && !usableDefault, children: s.editorView === "connection" ? "\u4FDD\u5B58\u8FDE\u63A5" : s.editorView === "model" ? "\u4FDD\u5B58\u6A21\u578B\u914D\u7F6E" : "\u4FDD\u5B58\u4E3A\u9ED8\u8BA4\u6A21\u578B\uFF08\u7528\u4E8E\u65B0\u4F1A\u8BDD\uFF09" })
          ] }, "persisted-actions")
        ] }) })
      ] })
    ] });
  }
}
export {
  ModelManagementPanel
};
