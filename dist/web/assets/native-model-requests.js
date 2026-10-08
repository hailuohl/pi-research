import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Icon } from "./ui.js";
const MAX_BYTES = 20 * 1024 * 1024;
const sourceKey = (source) => JSON.stringify([source.kind, source.id]);
const requestNames = { pending: "\u5F85\u6279\u51C6", approved: "\u5DF2\u6279\u51C6\uFF0C\u5C1A\u672A\u6267\u884C", rejected: "\u5DF2\u62D2\u7EDD", stale: "\u6279\u51C6\u5DF2\u5931\u6548", running: "\u6B63\u5728\u6267\u884C", completed: "\u5DF2\u5B8C\u6210", incomplete: "\u7ED3\u679C\u672A\u5B8C\u6210", failed: "\u6267\u884C\u5931\u8D25", cancelled: "\u5DF2\u53D6\u6D88", unknown: "\u6267\u884C\u72B6\u6001\u672A\u77E5" };
const size = (bytes) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KiB` : `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
const safeUrl = (raw) => {
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};
function base64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
function mergeRows(current, incoming) {
  const rows = new Map(current.map((row) => [row.id, row]));
  for (const row of incoming) if ((rows.get(row.id)?.version ?? -1) <= row.version) rows.set(row.id, row);
  return [...rows.values()];
}
class NativeModelRequests extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { open: false, prompt: "", selected: [], search: false, maxOutputTokens: "1024", maxOutputDirty: false, draftVersion: 0, sources: [], availability: null, requests: [], nextCursor: null, active: "", loading: false, pending: false, error: "", message: "" };
    this.alive = true;
    this.epoch = 0;
    this.reading = 0;
    this.working = false;
    this.executingId = "";
    this.cancelling = false;
    this.uncertain = /* @__PURE__ */ new Set();
    this.mutations = /* @__PURE__ */ new Map();
    this.dialog = React.createRef();
    this.trigger = React.createRef();
  }
  componentDidUpdate(previous) {
    if (previous.session.id !== this.props.session.id || previous.projectId !== this.props.projectId) {
      this.epoch++;
      this.reading++;
      this.working = false;
      this.executingId = "";
      this.cancelling = false;
      this.uncertain.clear();
      this.mutations.clear();
      this.setState({ ...this.state, prompt: "", selected: [], search: false, maxOutputTokens: "1024", maxOutputDirty: false, draftVersion: 0, sources: [], availability: null, requests: [], nextCursor: null, active: "", loading: false, pending: false, error: "", message: "" }, () => {
        if (this.state.open) void this.load();
      });
    }
  }
  componentWillUnmount() {
    this.alive = false;
    this.epoch++;
    this.reading++;
  }
  operationContext() {
    return { sessionId: this.props.session.id, projectId: this.props.projectId, epoch: this.epoch };
  }
  current(context) {
    return this.alive && context.epoch === this.epoch && context.sessionId === this.props.session.id && context.projectId === this.props.projectId;
  }
  blocked() {
    return !this.alive || this.props.busy || this.props.archived || this.working || this.props.session.state === "archived" || !!this.props.session.taskId;
  }
  edit(update) {
    this.setState((current) => ({ ...current, ...update, maxOutputDirty: update.maxOutputTokens !== void 0 || current.maxOutputDirty, draftVersion: current.draftVersion + 1, message: "" }));
  }
  close() {
    if (this.dialog.current?.open) this.dialog.current.close();
    this.setState({ open: false });
    this.trigger.current?.focus();
  }
  toggle() {
    if (!this.alive) return;
    if (this.state.open) {
      this.close();
      return;
    }
    this.setState({ open: true }, () => {
      if (this.dialog.current && !this.dialog.current.open) this.dialog.current.showModal();
    });
    if (!this.state.loading) void this.load();
  }
  outputLimit(availability = this.state.availability) {
    const limit = availability?.maxOutputTokens;
    return typeof limit === "number" && Number.isSafeInteger(limit) && limit >= 1 ? Math.min(8192, limit) : 8192;
  }
  safeView(view) {
    const response = view.response;
    if (!response) return view;
    const { text, citations, searchCalls, usage, responseId, stopReason, status, continuationUnavailable } = response;
    return { ...view, response: { text, citations, searchCalls, usage, ...responseId ? { responseId } : {}, stopReason, status, ...continuationUnavailable ? { continuationUnavailable } : {} } };
  }
  mergeRequest(view) {
    if (view.sessionId !== this.props.session.id || view.projectId !== this.props.projectId) return;
    const safe = this.safeView(view);
    this.setState((current) => {
      const old = current.requests.find((row) => row.id === safe.id);
      return { requests: old && old.version > safe.version ? current.requests : [safe, ...current.requests.filter((row) => row.id !== safe.id)] };
    });
  }
  async load(more = false) {
    const context = this.operationContext(), read = ++this.reading, cursor = more ? this.state.nextCursor : null;
    if (more && cursor === null) return;
    this.setState({ loading: true, error: "" });
    try {
      const result = await api(`/sessions/${encodeURIComponent(context.sessionId)}/native-requests?limit=20${cursor !== null ? `&cursor=${cursor}` : ""}`);
      if (!this.current(context) || read !== this.reading) return;
      const rows = result.requests.filter((row) => row.sessionId === context.sessionId && row.projectId === context.projectId).map((row) => this.safeView(row));
      this.setState((current) => ({ availability: result.availability, maxOutputTokens: current.maxOutputDirty ? current.maxOutputTokens : String(Math.min(1024, this.outputLimit(result.availability))), sources: [...new Map([...current.sources, ...result.sources].map((source) => [sourceKey(source), source])).values()], requests: more ? mergeRows(current.requests, rows) : mergeRows(current.requests, rows).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), nextCursor: result.nextCursor }));
    } catch (error) {
      if (this.current(context) && read === this.reading) this.setState({ error: String(error) });
    } finally {
      if (this.current(context) && read === this.reading) this.setState({ loading: false });
    }
  }
  key(scope, body) {
    const encoded = JSON.stringify(body), old = this.mutations.get(scope);
    if (old?.body === encoded) return old.key;
    const key = crypto.randomUUID();
    this.mutations.set(scope, { body: encoded, key });
    return key;
  }
  async write(path, body, scope, execute = false) {
    return api(path, body, "POST", void 0, this.key(scope, body), execute ? 125e3 : 22e3);
  }
  selectedSources() {
    return this.state.sources.filter((source) => this.state.selected.includes(sourceKey(source)));
  }
  chooseSource(source, checked) {
    const selected = checked ? [.../* @__PURE__ */ new Set([...this.state.selected, sourceKey(source)])] : this.state.selected.filter((key) => key !== sourceKey(source));
    const total = this.state.sources.filter((source2) => selected.includes(sourceKey(source2))).reduce((sum, source2) => sum + source2.size, 0);
    if (total > MAX_BYTES) {
      this.setState({ error: "\u9009\u62E9\u7684\u6574\u6587\u4EF6\u603B\u91CF\u6700\u591A 20 MiB\u3002" });
      return;
    }
    this.edit({ selected });
  }
  async importFiles(files) {
    if (this.blocked() || !files.length) return;
    const context = this.operationContext(), total = this.selectedSources().reduce((sum, row) => sum + row.size, 0) + files.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_BYTES || files.some((file) => file.size > MAX_BYTES)) {
      this.setState({ error: "\u6BCF\u4E2A\u539F\u4EF6\u53CA\u672C\u6B21\u9009\u62E9\u7684\u539F\u4EF6\u603B\u91CF\u6700\u591A 20 MiB\u3002" });
      return;
    }
    this.working = true;
    this.setState({ pending: true, error: "", message: "" });
    try {
      for (const file of files) {
        if (!this.current(context)) return;
        const isPdf = /\.pdf$/i.test(file.name) && (!file.type || file.type === "application/pdf"), isVideo = /\.mp4$/i.test(file.name) && (!file.type || file.type === "video/mp4");
        if (!isPdf && !isVideo) throw Error("\u8BF7\u9009\u62E9 PDF \u539F\u4EF6\u6216 MP4 \u89C6\u9891\uFF0C\u540E\u7AEF\u5C06\u6821\u9A8C\u5B9E\u9645\u6587\u4EF6\u5934\u3002");
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!this.current(context)) return;
        const contentBase64 = base64(bytes);
        let source;
        if (isPdf) {
          const imported = await this.write("/operations/document_import", { projectId: context.projectId, input: { title: file.name, mediaType: "application/pdf", contentBase64 } }, `import:${context.sessionId}:pdf:${file.name}`);
          source = { kind: "document", id: imported.id, artifactId: imported.original.artifactId, title: imported.title, digest: imported.original.digest, size: imported.original.size, mediaType: "application/pdf", scope: "whole-file" };
        } else source = await this.write(`/sessions/${encodeURIComponent(context.sessionId)}/native-media`, { title: file.name, mediaType: "video/mp4", contentBase64 }, `import:${context.sessionId}:video:${file.name}`);
        if (!this.current(context)) return;
        this.setState((current) => ({ sources: [...current.sources.filter((row) => sourceKey(row) !== sourceKey(source)), source], selected: [.../* @__PURE__ */ new Set([...current.selected, sourceKey(source)])], draftVersion: current.draftVersion + 1, message: "\u539F\u4EF6\u5DF2\u4FDD\u5B58\u5E76\u9009\u4E2D\uFF1B\u51C6\u5907\u8BF7\u6C42\u4E0D\u4F1A\u5916\u53D1\u6587\u4EF6\u3002" }));
      }
    } catch (error) {
      if (this.current(context)) this.setState({ error: String(error) });
    } finally {
      if (this.current(context)) {
        this.working = false;
        this.setState({ pending: false });
      }
    }
  }
  async prepare(previous) {
    if (this.blocked() || !this.state.availability) return;
    const context = this.operationContext(), draftVersion = this.state.draftVersion, sources = previous ? previous.sources : this.selectedSources(), maxOutputTokens = previous ? previous.maxOutputTokens : Number(this.state.maxOutputTokens), prompt = previous ? previous.prompt : this.state.prompt.trim(), search = previous ? previous.search : this.state.search;
    if (previous && (previous.state !== "incomplete" || !previous.continuationAvailable || previous.sessionId !== context.sessionId || previous.projectId !== context.projectId)) {
      this.setState({ error: "\u5F53\u524D\u56DE\u6267\u4E0D\u80FD\u51C6\u5907\u7EED\u8BF7\u6C42\u3002" });
      return;
    }
    const limit = this.outputLimit();
    if (!prompt || !Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > limit) {
      this.setState({ error: `\u8BF7\u586B\u5199\u8BF7\u6C42\u5185\u5BB9\uFF0C\u8F93\u51FA\u4E0A\u9650\u987B\u4E3A 1\u2013${limit} \u7684\u6574\u6570\u3002` });
      return;
    }
    if (!sources.length && !search) {
      this.setState({ error: "\u8BF7\u9009\u62E9\u6574\u6587\u4EF6\u539F\u4EF6\uFF0C\u6216\u660E\u786E\u542F\u7528\u539F\u751F\u8054\u7F51\u641C\u7D22\u3002" });
      return;
    }
    if (sources.reduce((sum, row) => sum + row.size, 0) > MAX_BYTES) {
      this.setState({ error: "\u9009\u62E9\u7684\u6574\u6587\u4EF6\u603B\u91CF\u6700\u591A 20 MiB\u3002" });
      return;
    }
    if (search && this.state.availability.nativeWebSearch.state !== "available" || sources.some((source) => (source.mediaType === "application/pdf" ? this.state.availability.pdf : this.state.availability.video).state !== "available")) {
      this.setState({ error: "\u5F53\u524D\u8FDE\u63A5\u4E0D\u652F\u6301\u6240\u9009\u7684\u539F\u4EF6\u6216\u539F\u751F\u8054\u7F51\u80FD\u529B\uFF0C\u8BF7\u6838\u5BF9\u5B9E\u9645\u53EF\u7528\u72B6\u6001\u3002" });
      return;
    }
    const body = { expectedSessionVersion: this.props.session.version, prompt, sources: sources.map(({ kind, id }) => ({ kind, id })).sort((a, b) => sourceKey(a).localeCompare(sourceKey(b))), search, maxOutputTokens, ...previous ? { previousRequestId: previous.id } : {} };
    this.working = true;
    this.setState({ pending: true, error: "", message: "" });
    try {
      const request = await this.write(`/sessions/${encodeURIComponent(context.sessionId)}/native-requests`, body, `prepare:${context.sessionId}:${previous?.id ?? "new"}`);
      if (!this.current(context)) return;
      this.mergeRequest(request);
      this.setState({ active: request.id, message: this.state.draftVersion === draftVersion ? "\u8BF7\u6C42\u5DF2\u56FA\u5B9A\uFF0C\u5C1A\u672A\u6279\u51C6\u6216\u6267\u884C\u3002" : "\u65E7\u8349\u7A3F\u7684\u8BF7\u6C42\u5DF2\u56FA\u5B9A\uFF1B\u5F53\u524D\u65B0\u7F16\u8F91\u4FDD\u7559\uFF0C\u672A\u5916\u53D1\u3002" });
    } catch (error) {
      if (this.current(context)) this.setState({ error: String(error) });
    } finally {
      if (this.current(context)) {
        this.working = false;
        this.setState({ pending: false });
      }
    }
  }
  activeRequest() {
    return this.state.requests.find((row) => row.id === this.state.active);
  }
  fixedScope(request) {
    return JSON.stringify({ id: request.id, projectId: request.projectId, sessionId: request.sessionId, prompt: request.prompt, model: { provider: request.model.provider, model: request.model.model, thinking: request.model.thinking }, destination: { baseUrl: request.destination.baseUrl, api: request.destination.api, profile: request.destination.profile }, sources: request.sources.map(({ kind, id, artifactId, title, digest, size: size2, mediaType, scope }) => ({ kind, id, artifactId, title, digest, size: size2, mediaType, scope })), search: request.search, maxOutputTokens: request.maxOutputTokens, expiresAt: request.expiresAt, dispatchBudget: request.dispatchBudget, previousRequestId: request.previousRequestId, approvalId: request.approval.id });
  }
  async read(id) {
    const context = this.operationContext();
    try {
      const request = await api(`/native-requests/${encodeURIComponent(id)}`);
      if (!this.current(context)) return;
      this.mergeRequest(request);
    } catch (error) {
      if (this.current(context)) this.setState({ error: String(error) });
    }
  }
  async act(id, action, expectedVersion, expectedApprovalVersion, expectedScope) {
    const cancelExecuting = action === "cancel" && this.executingId === id;
    if (this.blocked() && !cancelExecuting || !this.alive || this.cancelling) return;
    const request = this.state.requests.find((row) => row.id === id);
    if (!request || request.sessionId !== this.props.session.id || request.projectId !== this.props.projectId) return;
    if (!cancelExecuting && (expectedVersion !== void 0 && request.version !== expectedVersion || expectedApprovalVersion !== void 0 && request.approval.version !== expectedApprovalVersion)) {
      this.setState({ error: "\u56FA\u5B9A\u8BF7\u6C42\u7248\u672C\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u5F53\u524D\u5361\u7247\u540E\u64CD\u4F5C\u3002" });
      return;
    }
    if ((action === "approve" || action === "reject") && request.state !== "pending" || action === "execute" && (request.state !== "approved" || request.approval.status !== "approved" || request.dispatched !== 0 || this.uncertain.has(id)) || action === "cancel" && !["pending", "approved", "running"].includes(request.state)) return;
    if ((action === "approve" || action === "execute") && Date.parse(request.expiresAt) <= Date.now()) {
      this.setState({ error: "\u6B64\u8BF7\u6C42\u5DF2\u5230\u671F\uFF0C\u8BF7\u6838\u5BF9\u72B6\u6001\u5E76\u91CD\u65B0\u51C6\u5907\u3002" });
      return;
    }
    const context = this.operationContext(), decision = action === "approve" || action === "reject", body = decision ? { expectedVersion: request.version, expectedApprovalVersion: request.approval.version, approved: action === "approve" } : { expectedVersion: request.version }, path = `/native-requests/${encodeURIComponent(id)}/${decision ? "decide" : action}`;
    if (cancelExecuting) {
      this.cancelling = true;
      this.setState({ error: "", message: "\u6B63\u5728\u6838\u5BF9\u5E76\u53D6\u6D88\u540C\u4E00\u56FA\u5B9A\u8BF7\u6C42\uFF1B\u5DF2\u5916\u53D1\u65F6\u4ECD\u9700\u6838\u5BF9\u4F9B\u5E94\u5546\u5904\u7406\u4E0E\u8D39\u7528\u3002" });
      try {
        const latest = await api(`/native-requests/${encodeURIComponent(id)}`);
        if (!this.current(context)) return;
        if (this.fixedScope(latest) !== (expectedScope ?? this.fixedScope(request))) throw Error("\u8BF7\u6C42\u5F52\u5C5E\u6216\u56FA\u5B9A\u8303\u56F4\u5DF2\u53D8\u5316\uFF0C\u672A\u53D1\u9001\u53D6\u6D88\u3002");
        this.mergeRequest(latest);
        if (!["pending", "approved", "running"].includes(latest.state)) {
          this.setState({ message: `\u5F53\u524D\u8BF7\u6C42\u5DF2\u4E3A\u201C${requestNames[latest.state]}\u201D\uFF0C\u4EC5\u663E\u793A\u72B6\u6001\uFF0C\u6CA1\u6709\u53D1\u9001\u53D6\u6D88\u3002` });
          return;
        }
        const result = await this.write(path, { expectedVersion: latest.version }, `${context.sessionId}:${id}:cancel`);
        if (this.current(context)) {
          this.mergeRequest(result);
          this.setState({ message: "\u53D6\u6D88\u54CD\u5E94\u5DF2\u8FD4\u56DE\uFF0C\u8BF7\u4EE5\u5F53\u524D\u56DE\u6267\u72B6\u6001\u4E3A\u51C6\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\u3002" });
        }
      } catch (error) {
        if (this.current(context)) {
          this.setState({ error: String(error) + " \u53D6\u6D88\u672A\u786E\u8BA4\uFF0C\u8BF7\u4EC5\u6838\u5BF9\u8BF7\u6C42\u72B6\u6001\u3002" });
          await this.read(id);
        }
      } finally {
        if (this.current(context)) {
          this.cancelling = false;
          this.setState({ message: this.state.message });
        }
      }
      return;
    }
    this.working = true;
    if (action === "execute") this.executingId = id;
    this.setState({ pending: true, error: "", message: "" });
    try {
      await this.props.perform(async () => {
        try {
          const result = await this.write(path, body, `${context.sessionId}:${id}:${action}`, action === "execute");
          if (!this.current(context)) return;
          this.mergeRequest(result);
          this.setState({ message: action === "execute" ? "\u6267\u884C\u8BF7\u6C42\u5DF2\u8FD4\u56DE\u72B6\u6001\uFF0C\u8BF7\u4EE5\u5F53\u524D\u56DE\u6267\u4E3A\u51C6\u3002" : action === "approve" ? "\u5DF2\u6279\u51C6\uFF1B\u53EA\u6709\u518D\u6B21\u70B9\u51FB\u6267\u884C\u624D\u4F1A\u5916\u53D1\u3002" : action === "reject" ? "\u5DF2\u62D2\u7EDD\u6B64\u56FA\u5B9A\u8BF7\u6C42\u3002" : "\u53D6\u6D88\u7ED3\u679C\u5DF2\u8FD4\u56DE\uFF1B\u5DF2\u5916\u53D1\u65F6\u4ECD\u9700\u6838\u5BF9\u4F9B\u5E94\u5546\u5904\u7406\u4E0E\u8D39\u7528\u3002" });
        } catch (error) {
          if (this.current(context)) {
            const ambiguous = action === "execute" && !(error instanceof ApiError && [400, 401, 403, 404, 409, 422].includes(error.status));
            if (ambiguous) {
              this.uncertain.add(id);
              this.mergeRequest({ ...request, state: "unknown", error: "\u672C\u6B21\u6267\u884C\u672A\u786E\u8BA4\uFF0C\u8BF7\u4EC5\u6838\u5BF9\u56DE\u6267\u72B6\u6001\u3002" });
            }
            this.setState({ error: String(error) + (action === "execute" ? " \u5C06\u53EA\u8BFB\u53D6\u72B6\u6001\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\u3002" : " \u5F53\u524D\u56FA\u5B9A\u8BF7\u6C42\u4FDD\u7559\uFF0C\u8BF7\u6838\u5BF9\u72B6\u6001\u3002") });
            await this.read(id);
          }
          throw error;
        }
      });
    } catch {
    } finally {
      if (this.current(context)) {
        this.working = false;
        if (action === "execute") this.executingId = "";
        this.setState({ pending: false });
      }
    }
  }
  render() {
    const s = this.state, id = `native-model-panel-${this.props.session.id}`, request = this.activeRequest(), blocked = this.blocked(), selected = this.selectedSources(), availability = s.availability;
    const capability = (title, key) => {
      const value = availability?.[key];
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: title }),
        /* @__PURE__ */ jsx("span", { "data-state": value?.state ?? "unknown", children: value?.state === "available" ? "\u5F53\u524D\u9002\u914D\u53EF\u51C6\u5907" : value?.state === "unsupported" ? "\u5F53\u524D\u9002\u914D\u4E0D\u652F\u6301" : value?.state === "disabled" ? "\u5F53\u524D\u6A21\u578B\u672A\u542F\u7528" : "\u5C1A\u672A\u8BFB\u53D6" }),
        /* @__PURE__ */ jsx("small", { children: value?.reason ?? "\u8BFB\u53D6\u540E\u663E\u793A\u5F53\u524D\u6A21\u578B\u7684\u771F\u5B9E\u80FD\u529B\u8FB9\u754C\u3002" })
      ] });
    };
    return /* @__PURE__ */ jsxs("div", { className: "native-model-requests", children: [
      /* @__PURE__ */ jsxs("button", { ref: this.trigger, type: "button", className: "secondary native-panel-trigger", "aria-expanded": s.open, "aria-controls": id, onClick: () => this.toggle(), children: [
        /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 15 }),
        "\u539F\u4EF6\u5206\u6790 / \u539F\u751F\u8054\u7F51"
      ] }),
      /* @__PURE__ */ jsxs("dialog", { ref: this.dialog, id, className: "native-panel", "aria-modal": "true", "aria-label": "\u539F\u4EF6\u5206\u6790\u4E0E\u539F\u751F\u8054\u7F51", onCancel: (e) => {
        e.preventDefault();
        this.close();
      }, onClose: () => {
        if (this.state.open) this.setState({ open: false });
      }, children: [
        /* @__PURE__ */ jsxs("header", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { children: "\u539F\u4EF6\u5206\u6790 / \u539F\u751F\u8054\u7F51" }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u8BF7\u6C42\u6A21\u578B\uFF1A",
              this.props.session.model.provider,
              " / ",
              this.props.session.model.model
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "native-header-actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: s.loading, onClick: () => void this.load(), children: "\u5237\u65B0\u8BB0\u5F55\u4E0E\u80FD\u529B" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED\u539F\u751F\u8BF7\u6C42\u9762\u677F", autoFocus: true, onClick: () => this.close(), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 18 }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "native-availability", children: [
          capability("PDF \u539F\u4EF6", "pdf"),
          capability("MP4 \u89C6\u9891", "video"),
          capability("\u539F\u751F\u8054\u7F51", "nativeWebSearch")
        ] }),
        availability?.reason ? /* @__PURE__ */ jsx("p", { className: "native-note", children: availability.reason }) : null,
        s.error ? /* @__PURE__ */ jsx("p", { className: "native-error", role: "alert", children: s.error }) : null,
        s.message ? /* @__PURE__ */ jsx("p", { className: "native-message", role: "status", children: s.message }) : null,
        s.loading ? /* @__PURE__ */ jsx("p", { className: "native-note", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u539F\u4EF6\u4E0E\u8BF7\u6C42\u8BB0\u5F55\u2026" }) : null,
        Number(s.maxOutputTokens) > this.outputLimit() ? /* @__PURE__ */ jsxs("p", { className: "native-error", role: "alert", children: [
          "\u5F53\u524D\u6A21\u578B\u8F93\u51FA\u4E0A\u9650\u4E3A ",
          this.outputLimit(),
          " tokens\uFF0C\u5DF2\u6709\u8F93\u5165\u4FDD\u7559\uFF0C\u8BF7\u4FEE\u6539\u540E\u518D\u51C6\u5907\u3002"
        ] }) : null,
        /* @__PURE__ */ jsxs("form", { className: "native-prepare-form", onSubmit: (e) => {
          e.preventDefault();
          void this.prepare();
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BF7\u6C42\u5185\u5BB9",
            /* @__PURE__ */ jsx("textarea", { "aria-label": "\u539F\u751F\u8BF7\u6C42\u5185\u5BB9", required: true, maxLength: 32e3, rows: 4, value: s.prompt, onChange: (e) => this.edit({ prompt: e.target.value }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "native-source-heading", children: [
            /* @__PURE__ */ jsx("h3", { children: "\u9009\u62E9\u6574\u6587\u4EF6\u539F\u4EF6" }),
            /* @__PURE__ */ jsxs("label", { className: "secondary native-file-upload", children: [
              /* @__PURE__ */ jsx(Icon, { name: "plus", size: 14 }),
              "\u5BFC\u5165 PDF / MP4",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u5BFC\u5165\u539F\u751F\u5206\u6790\u539F\u4EF6", type: "file", accept: ".pdf,.mp4,application/pdf,video/mp4", multiple: true, disabled: blocked, onChange: (e) => {
                const files = Array.from(e.currentTarget.files ?? []);
                e.currentTarget.value = "";
                void this.importFiles(files);
              } })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "native-note", children: "\u5B9E\u9645\u5916\u53D1\u6240\u9009\u6587\u4EF6\u7684\u5168\u90E8\u5B57\u8282\uFF1B\u5F53\u524D\u6CA1\u6709\u9875\u7801\u6216\u65F6\u95F4\u88C1\u526A\u3002\u6BCF\u4E2A\u6587\u4EF6\u548C\u6240\u9009\u603B\u91CF\u6700\u591A 20 MiB\u3002" }),
          /* @__PURE__ */ jsxs("div", { className: "native-source-list", children: [
            s.sources.map((source) => /* @__PURE__ */ jsxs("label", { className: "native-source", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": `\u6574\u6587\u4EF6 ${source.title}`, checked: s.selected.includes(sourceKey(source)), disabled: (source.mediaType === "application/pdf" ? availability?.pdf : availability?.video)?.state !== "available", onChange: (e) => this.chooseSource(source, e.target.checked) }),
              /* @__PURE__ */ jsxs("span", { children: [
                /* @__PURE__ */ jsx("strong", { children: source.title }),
                /* @__PURE__ */ jsxs("small", { children: [
                  source.mediaType === "application/pdf" ? "PDF \u539F\u4EF6" : "MP4 \u89C6\u9891",
                  " \xB7 ",
                  size(source.size),
                  " \xB7 \u6574\u6587\u4EF6",
                  this.props.attachments?.some((attachment) => attachment.documentVersionId === source.id) ? " \xB7 Chat \u8349\u7A3F\u4E2D\u5DF2\u6709" : ""
                ] })
              ] })
            ] }, sourceKey(source))),
            !s.sources.length ? /* @__PURE__ */ jsx("p", { className: "native-note", children: "\u5C1A\u65E0\u53EF\u9009\u62E9\u539F\u4EF6\uFF0C\u53EF\u5148\u5BFC\u5165\u6587\u4EF6\u3002" }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "native-options", children: [
            /* @__PURE__ */ jsxs("label", { className: "native-check", children: [
              /* @__PURE__ */ jsx("input", { "aria-label": "\u542F\u7528\u539F\u751F\u8054\u7F51\u641C\u7D22", type: "checkbox", checked: s.search, disabled: availability?.nativeWebSearch.state !== "available", onChange: (e) => this.edit({ search: e.target.checked }) }),
              "\u542F\u7528\u539F\u751F\u8054\u7F51\u641C\u7D22"
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u8F93\u51FA token \u4E0A\u9650",
              /* @__PURE__ */ jsx("input", { "aria-label": "\u539F\u751F\u8F93\u51FA token \u4E0A\u9650", type: "number", required: true, min: 1, max: this.outputLimit(), step: 1, value: s.maxOutputTokens, onChange: (e) => this.edit({ maxOutputTokens: e.target.value }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "native-note", children: [
            "\u5DF2\u9009 ",
            selected.length,
            " \u4E2A\u6574\u6587\u4EF6 \xB7 ",
            size(selected.reduce((sum, row) => sum + row.size, 0)),
            "\u3002\u51C6\u5907\u53EA\u56FA\u5B9A\u8303\u56F4\uFF0C\u4E0D\u5916\u53D1\uFF1B\u5B9E\u9645\u8F93\u51FA\u4E0A\u9650\u8FD8\u987B\u7B26\u5408\u6A21\u578B\u914D\u7F6E\u3002"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: blocked || !availability, children: "\u51C6\u5907\u8BF7\u6C42\uFF0C\u8FDB\u5165\u5BA1\u9605" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "native-history-heading", children: [
          /* @__PURE__ */ jsx("h3", { children: "\u56FA\u5B9A\u8BF7\u6C42\u4E0E\u56DE\u6267" }),
          /* @__PURE__ */ jsxs("span", { children: [
            s.requests.length,
            " \u6761\u5DF2\u8BFB\u53D6"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "native-history", "aria-label": "\u539F\u751F\u8BF7\u6C42\u5386\u53F2", children: [
          s.requests.map((row) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": row.id === s.active, onClick: () => this.setState({ active: row.id }), children: [
            /* @__PURE__ */ jsx("strong", { children: row.prompt.slice(0, 70) }),
            /* @__PURE__ */ jsxs("small", { children: [
              requestNames[row.state],
              " \xB7 ",
              new Date(row.createdAt).toLocaleString(),
              " \xB7 ",
              row.sources.length,
              " \u4E2A\u539F\u4EF6",
              row.search ? " \xB7 \u539F\u751F\u8054\u7F51" : ""
            ] })
          ] }, row.id)),
          !s.requests.length ? /* @__PURE__ */ jsx("p", { className: "native-note", children: "\u6CA1\u6709\u5DF2\u56FA\u5B9A\u8BF7\u6C42\u3002\u91CD\u65B0\u6253\u5F00\u9762\u677F\u4F1A\u8BFB\u53D6\u5DF2\u6709\u56DE\u6267\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u53D1\u9001\u8BF7\u6C42\u3002" }) : null
        ] }),
        s.nextCursor !== null ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: s.loading, onClick: () => void this.load(true), children: "\u8BFB\u53D6\u66F4\u65E9\u8BB0\u5F55" }) : null,
        request ? /* @__PURE__ */ jsxs("article", { className: "native-request-review", "aria-label": "\u56FA\u5B9A\u8BF7\u6C42\u5BA1\u9605", children: [
          /* @__PURE__ */ jsxs("div", { className: "native-review-heading", children: [
            /* @__PURE__ */ jsx("h3", { children: this.executingId === request.id ? "\u6267\u884C\u5DF2\u63D0\u4EA4\uFF0C\u6B63\u5728\u7B49\u5F85\u56DE\u6267" : this.uncertain.has(request.id) ? "\u6267\u884C\u5F85\u6838\u5BF9" : requestNames[request.state] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => void this.read(request.id), children: "\u6838\u5BF9\u8BF7\u6C42 / \u56DE\u6267\u72B6\u6001" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "native-fixed-prompt", children: request.prompt }),
          /* @__PURE__ */ jsxs("dl", { children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u8BF7\u6C42\u6A21\u578B" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                request.model.provider,
                " / ",
                request.model.model,
                " \xB7 ",
                request.model.thinking
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u76EE\u6807\u8FDE\u63A5" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                /* @__PURE__ */ jsx("code", { children: request.destination.baseUrl }),
                " \xB7 ",
                request.destination.api,
                " \xB7 ",
                request.destination.profile
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u539F\u751F\u8054\u7F51" }),
              /* @__PURE__ */ jsx("dd", { children: request.search ? "\u660E\u786E\u542F\u7528" : "\u672A\u542F\u7528" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u8F93\u51FA\u4E0A\u9650" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                request.maxOutputTokens,
                " tokens"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u5916\u53D1\u9884\u7B97" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                "\u4EC5 1 \u6B21\u4F9B\u5E94\u5546 HTTP \u8BF7\u6C42 \xB7 \u5DF2\u5916\u53D1 ",
                request.dispatched,
                " \u6B21 \xB7 \u53EF\u80FD\u4EA7\u751F\u6A21\u578B\u4E0E\u8054\u7F51\u8D39\u7528"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("dt", { children: "\u6279\u51C6\u671F\u9650" }),
              /* @__PURE__ */ jsx("dd", { children: new Date(request.expiresAt).toLocaleString() })
            ] })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "native-fixed-sources", children: request.sources.map((source) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: source.title }),
            /* @__PURE__ */ jsxs("span", { children: [
              source.mediaType,
              " \xB7 ",
              size(source.size),
              " \xB7 \u6574\u6587\u4EF6\u5168\u90E8\u5B57\u8282"
            ] }),
            /* @__PURE__ */ jsxs("code", { children: [
              "SHA-256 ",
              source.digest
            ] })
          ] }, sourceKey(source))) }),
          request.previousRequestId ? /* @__PURE__ */ jsxs("p", { className: "native-note", children: [
            "\u7EED\u8BF7\u6C42\u6765\u6E90\uFF1A",
            request.previousRequestId,
            "\u3002\u4FDD\u7559\u539F\u6A21\u578B\u3001\u539F\u4EF6\u4E0E\u8054\u7F51\u8303\u56F4\uFF0C\u4ECD\u9700\u91CD\u65B0\u6279\u51C6\u5E76\u6267\u884C\u4E00\u6B21\u3002"
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "native-review-actions", children: [
            request.state === "pending" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "primary", disabled: blocked || Date.parse(request.expiresAt) <= Date.now(), onClick: () => void this.act(request.id, "approve", request.version, request.approval.version), children: "\u6279\u51C6\u6B64\u56FA\u5B9A\u8BF7\u6C42" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: blocked, onClick: () => void this.act(request.id, "reject", request.version, request.approval.version), children: "\u62D2\u7EDD" })
            ] }) : null,
            request.state === "approved" && request.approval.status === "approved" && request.dispatched === 0 && !this.uncertain.has(request.id) ? /* @__PURE__ */ jsx("button", { type: "button", className: "primary", disabled: blocked || Date.parse(request.expiresAt) <= Date.now(), onClick: () => void this.act(request.id, "execute", request.version), children: "\u6267\u884C\u4E00\u6B21\uFF0C\u5916\u53D1\u6240\u5217\u539F\u4EF6\u4E0E\u8BF7\u6C42" }) : null,
            ["pending", "approved", "running"].includes(request.state) ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: blocked && this.executingId !== request.id || this.cancelling, onClick: () => void this.act(request.id, "cancel", request.version, void 0, this.fixedScope(request)), children: "\u53D6\u6D88\u6B64\u8BF7\u6C42" }) : null,
            request.state === "incomplete" && request.continuationAvailable ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: blocked, onClick: () => void this.prepare(request), children: "\u51C6\u5907\u7EED\u8BF7\u6C42\uFF0C\u91CD\u65B0\u5BA1\u9605\u4E0E\u6279\u51C6" }) : null
          ] }),
          request.state === "unknown" || request.state === "failed" || request.state === "cancelled" ? /* @__PURE__ */ jsx("p", { className: "native-note", children: "\u8BF7\u6838\u5BF9\u56DE\u6267\u4E0E\u4F9B\u5E94\u5546\u8D39\u7528\uFF1B\u6B64\u539F\u8BF7\u6C42\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\uFF0C\u72B6\u6001\u672A\u77E5\u65F6\u4E0D\u80FD\u518D\u6B21\u6267\u884C\u3002" }) : null,
          request.error ? /* @__PURE__ */ jsx("p", { className: "native-error", role: "alert", children: request.error }) : null,
          request.approval.reason ? /* @__PURE__ */ jsxs("p", { className: "native-note", children: [
            "\u6279\u51C6\u72B6\u6001\uFF1A",
            request.approval.status,
            " \xB7 ",
            request.approval.reason
          ] }) : null,
          request.response ? /* @__PURE__ */ jsxs("div", { className: "native-response", children: [
            /* @__PURE__ */ jsx("h4", { children: "\u4F9B\u5E94\u5546\u8FD4\u56DE\u7ED3\u679C" }),
            /* @__PURE__ */ jsx("div", { className: "native-response-text", children: request.response.text }),
            request.response.citations.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("h4", { children: "\u8FD4\u56DE\u6765\u6E90" }),
              /* @__PURE__ */ jsx("p", { className: "native-note", children: "\u6765\u6E90\u7531\u4F9B\u5E94\u5546\u8FD4\u56DE\uFF0C\u4E0D\u81EA\u52A8\u6210\u4E3A\u5DF2\u6838\u9A8C\u7684\u79D1\u7814\u8BC1\u636E\u6216\u7ED3\u8BBA\u3002" }),
              /* @__PURE__ */ jsx("ul", { children: request.response.citations.map((citation, index) => {
                const url = safeUrl(citation.url);
                return /* @__PURE__ */ jsxs("li", { children: [
                  url ? /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noreferrer noopener", children: citation.title || url }) : /* @__PURE__ */ jsx("span", { children: citation.title || "\u65E0\u5B89\u5168\u94FE\u63A5" }),
                  citation.citedText ? /* @__PURE__ */ jsx("blockquote", { children: citation.citedText }) : null
                ] }, index);
              }) })
            ] }) : null,
            /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u8C03\u7528\u3001\u7528\u91CF\u4E0E\u7ED3\u675F\u539F\u56E0" }),
              /* @__PURE__ */ jsxs("p", { children: [
                "\u7ED3\u675F\u539F\u56E0\uFF1A",
                request.response.stopReason,
                " \xB7 ",
                request.response.status
              ] }),
              /* @__PURE__ */ jsx("dl", { children: Object.entries(request.response.usage).map(([key, value]) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("dt", { children: key }),
                /* @__PURE__ */ jsx("dd", { children: value })
              ] }, key)) }),
              request.response.searchCalls.map((call, index) => /* @__PURE__ */ jsxs("div", { className: "native-search-call", children: [
                /* @__PURE__ */ jsx("strong", { children: call.status }),
                call.query ? /* @__PURE__ */ jsx("p", { children: call.query }) : null,
                call.queries?.map((query, index2) => /* @__PURE__ */ jsx("p", { children: query }, index2)),
                call.action ? /* @__PURE__ */ jsx("p", { children: call.action }) : null,
                call.targetUrl && safeUrl(call.targetUrl) ? /* @__PURE__ */ jsx("a", { href: safeUrl(call.targetUrl), target: "_blank", rel: "noreferrer noopener", children: call.targetUrl }) : null,
                call.sources.map((source, index2) => {
                  const url = safeUrl(source.url);
                  return url ? /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noreferrer noopener", children: source.title || url }) }, index2) : null;
                }),
                call.error ? /* @__PURE__ */ jsx("p", { children: call.error }) : null
              ] }, index))
            ] }),
            request.response.continuationUnavailable ? /* @__PURE__ */ jsx("p", { className: "native-note", children: request.response.continuationUnavailable }) : null
          ] }) : null,
          request.receipt ? /* @__PURE__ */ jsxs("p", { className: "native-receipt", children: [
            "\u5DF2\u4FDD\u5B58\u56DE\u6267 ",
            /* @__PURE__ */ jsx("code", { children: request.receipt.artifactId }),
            /* @__PURE__ */ jsx("br", {}),
            "SHA-256 ",
            /* @__PURE__ */ jsx("code", { children: request.receipt.digest })
          ] }) : null
        ] }) : null
      ] })
    ] });
  }
}
export {
  NativeModelRequests
};
