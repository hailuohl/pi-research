import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { short, label } from "./models.js";
import { SectionTitle, Badge } from "./ui.js";
const computeReasonLabels = { ready: "\u5BB9\u91CF\u68C0\u67E5\u901A\u8FC7\uFF0C\u7B49\u5F85\u8C03\u5EA6", worker_active: "\u6267\u884C\u5668\u4ECD\u6301\u6709\u6709\u6548\u79DF\u7EA6", recovery_due: "\u5F85\u6838\u5BF9\u539F\u4F5C\u4E1A\u5E76\u6062\u590D\u76D1\u7BA1", target_unresolved: "\u8BA1\u7B97\u76EE\u6807\u5C1A\u672A\u89E3\u6790", target_unavailable: "\u8BA1\u7B97\u76EE\u6807\u6682\u4E0D\u53EF\u7528", target_changed: "\u76EE\u6807\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u9700\u8981\u6838\u5BF9", legacy_target_unknown: "\u65E7\u4F5C\u4E1A\u76EE\u6807\u672A\u77E5\uFF0C\u4FDD\u7559\u5360\u7528", request_too_large: "\u8BF7\u6C42\u8D85\u8FC7\u914D\u7F6E\u603B\u5BB9\u91CF\uFF0C\u7B49\u5F85\u4E0D\u4F1A\u81EA\u52A8\u89E3\u51B3", host_capacity: "\u7B49\u5F85\u5171\u4EAB\u5BBF\u4E3B\u5BB9\u91CF", target_capacity: "\u7B49\u5F85\u6B64\u8BA1\u7B97\u76EE\u6807\u5BB9\u91CF", earlier_job: "\u7B49\u5F85\u66F4\u65E9\u7684\u4F5C\u4E1A", recovery_backoff: "\u6062\u590D\u6682\u7F13\uFF0C\u7B49\u5F85\u4E0B\u6B21\u6838\u5BF9", manual_recovery_required: "\u65E7\u5BBF\u4E3B\u4F5C\u4E1A\u9700\u8981\u4EBA\u5DE5\u6838\u5BF9\uFF0C\u4FDD\u7559\u5360\u7528" };
const call = (projectId, name, input = {}) => api(`/operations/${name}`, { projectId, input });
const limitsFields = [{ key: "maxRuns", label: "\u6B63\u5F0F Run \u4E0A\u9650" }, { key: "maxDevelopment", label: "\u5F00\u53D1\u6D4B\u8BD5\u4E0A\u9650" }, { key: "maxJobs", label: "\u8BA1\u7B97\u4F5C\u4E1A\u603B\u4E0A\u9650" }, { key: "cpus", label: "CPU \u9884\u7B97\uFF08\u6838\uFF09", nullable: true }, { key: "memoryMb", label: "\u5185\u5B58\u9884\u7B97\uFF08MiB\uFF09", nullable: true }, { key: "maxQueued", label: "\u6392\u961F\u6570\u91CF\u4E0A\u9650", nullable: true }];
const values = (limits) => Object.fromEntries(limitsFields.map((f) => [f.key, limits[f.key] === null ? "" : String(limits[f.key])]));
function ComputeWait({ data, kind, id, onScheduler }) {
  const item = data.compute?.items.find((i) => i.kind === kind && i.id === id);
  return /* @__PURE__ */ jsxs("div", { className: "small muted", children: [
    /* @__PURE__ */ jsx("p", { children: item ? computeReasonLabels[item.reason] : data.compute ? "\u6B64\u4F5C\u4E1A\u4E0D\u5728\u5F53\u524D\u961F\u5217\u9875\u4E2D\uFF1B\u8BF7\u5230\u8D44\u6E90\u4E0E\u8C03\u5EA6\u67E5\u770B\u3002" : "\u8C03\u5EA6\u4FE1\u606F\u5F85\u52A0\u8F7D\u3002" }),
    item ? /* @__PURE__ */ jsxs("p", { children: [
      "\u9700\u6C42 ",
      item.requested.cpus,
      " CPU / ",
      item.requested.memoryMb,
      " MiB \xB7 ",
      item.held ? "\u5BB9\u91CF\u4FDD\u7559\u4E2D" : "\u5C1A\u672A\u9884\u7559\u5BB9\u91CF",
      item.state === "unknown" ? "\uFF1B\u672A\u77E5\u72B6\u6001\u4E0D\u4F1A\u81EA\u52A8\u91CA\u653E\u5BB9\u91CF" : ""
    ] }) : null,
    onScheduler ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: onScheduler, children: "\u67E5\u770B\u8D44\u6E90\u4E0E\u8C03\u5EA6" }) : null
  ] });
}
function Usage({ limits, usage, available }) {
  const remainder = (limit, used, remaining, unit) => limit === null ? `\u672A\u8BBE\u9884\u7B97\uFF1B\u5DF2\u9884\u7559 ${used} ${unit}` : `${used} / ${limit} ${unit}\uFF1B\u53EF\u7528 ${remaining ?? "\u672A\u8BBE\u9884\u7B97"}`;
  return /* @__PURE__ */ jsxs("dl", { className: "details", children: [
    /* @__PURE__ */ jsx("dt", { children: "\u8BA1\u7B97\u4F5C\u4E1A" }),
    /* @__PURE__ */ jsx("dd", { children: remainder(limits.maxJobs, usage.jobs, available.jobs, "\u4E2A") }),
    /* @__PURE__ */ jsx("dt", { children: "\u6B63\u5F0F Run" }),
    /* @__PURE__ */ jsxs("dd", { children: [
      usage.runs,
      " / ",
      limits.maxRuns,
      "\uFF1B\u53EF\u7528 ",
      available.runs
    ] }),
    /* @__PURE__ */ jsx("dt", { children: "\u5F00\u53D1\u6D4B\u8BD5" }),
    /* @__PURE__ */ jsxs("dd", { children: [
      usage.development,
      " / ",
      limits.maxDevelopment,
      "\uFF1B\u53EF\u7528 ",
      available.development
    ] }),
    /* @__PURE__ */ jsx("dt", { children: "\u6587\u6863\u89E3\u6790" }),
    /* @__PURE__ */ jsxs("dd", { children: [
      usage.documents,
      " / 1\uFF1B\u53EF\u7528 ",
      available.documents,
      "\uFF08\u53E6\u53D7\u5171\u4EAB\u603B\u9884\u7B97\u7EA6\u675F\uFF09"
    ] }),
    /* @__PURE__ */ jsx("dt", { children: "\u6587\u7A3F\u6784\u5EFA" }),
    /* @__PURE__ */ jsxs("dd", { children: [
      usage.publications ?? "\u672A\u8FD4\u56DE",
      " / 1\uFF1B\u53EF\u7528 ",
      available.publications ?? "\u672A\u8FD4\u56DE",
      "\uFF08\u53E6\u53D7\u5171\u4EAB\u603B\u9884\u7B97\u7EA6\u675F\uFF09"
    ] }),
    /* @__PURE__ */ jsx("dt", { children: "CPU \u9884\u7B97" }),
    /* @__PURE__ */ jsx("dd", { children: remainder(limits.cpus, usage.cpus, available.cpus, "\u6838") }),
    /* @__PURE__ */ jsx("dt", { children: "\u5185\u5B58\u9884\u7B97" }),
    /* @__PURE__ */ jsx("dd", { children: remainder(limits.memoryMb, usage.memoryMb, available.memoryMb, "MiB") }),
    /* @__PURE__ */ jsx("dt", { children: "\u672A\u77E5\u5360\u7528" }),
    /* @__PURE__ */ jsxs("dd", { children: [
      usage.unknown,
      " \u4E2A\uFF08\u5DF2\u5305\u542B\u5728\u4E0A\u8FF0\u4F5C\u4E1A\u5360\u7528\u4E2D\uFF0C\u4E0D\u91CD\u590D\u6263\u51CF\uFF09"
    ] })
  ] });
}
class ComputeForm extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { fields: values(this.props.configuration.limits), version: this.props.configuration.version, dirty: false, error: "", busy: false };
  }
  componentDidUpdate(prev) {
    if (prev.configuration.version !== this.props.configuration.version && !this.state.dirty) this.reset();
  }
  reset() {
    this.setState({ fields: values(this.props.configuration.limits), version: this.props.configuration.version, dirty: false, error: "" });
  }
  async save() {
    if (this.state.busy) return;
    this.setState({ busy: true, error: "" });
    try {
      await this.props.perform(async () => {
        try {
          const limits = Object.fromEntries(limitsFields.map((f) => [f.key, this.state.fields[f.key] === "" && f.nullable ? null : Number(this.state.fields[f.key])]));
          const saved = await call(this.props.projectId, "compute_capacity_configure", { expectedVersion: this.state.version, ...this.props.targetId ? { targetId: this.props.targetId } : {}, limits });
          this.setState({ fields: values(saved.limits), version: saved.version, dirty: false });
          await this.props.onSaved();
        } catch (error) {
          this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }, "\u5171\u4EAB\u8BA1\u7B97\u5BB9\u91CF\u5DF2\u4FDD\u5B58\uFF1B\u65E2\u6709\u6279\u51C6\u8D44\u6E90\u4E0D\u53D8");
    } finally {
      this.setState({ busy: false });
    }
  }
  render() {
    return /* @__PURE__ */ jsxs("form", { className: "form-body", onSubmit: (e) => {
      e.preventDefault();
      void this.save();
    }, children: [
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "CPU\u3001\u5185\u5B58\u53CA\u6392\u961F\u4E0A\u9650\u7559\u7A7A\u8868\u793A\u672A\u8BBE\u9884\u7B97\uFF0C\u4E0D\u8868\u793A\u786C\u4EF6\u7A7A\u95F2\u3002\u914D\u7F6E\u4F5C\u7528\u4E8E\u5171\u4EAB\u6B64\u6570\u636E\u76EE\u5F55\u7684\u6240\u6709\u9879\u76EE\u3002" }),
      limitsFields.map((f) => /* @__PURE__ */ jsxs("label", { children: [
        f.label,
        /* @__PURE__ */ jsx("input", { "aria-label": f.label, disabled: this.state.busy, type: "number", min: 0, max: f.key === "cpus" ? 1024 : !f.nullable ? 256 : void 0, step: f.key === "cpus" ? 1e-3 : 1, required: !f.nullable, placeholder: f.nullable ? "\u672A\u8BBE\u9884\u7B97" : void 0, value: this.state.fields[f.key], onChange: (e) => this.setState({ fields: { ...this.state.fields, [f.key]: e.target.value }, dirty: true }) })
      ] }, f.key)),
      this.state.version !== this.props.configuration.version ? /* @__PURE__ */ jsx("p", { role: "alert", className: "inline-warning", children: "\u914D\u7F6E\u5DF2\u88AB\u5176\u4ED6\u64CD\u4F5C\u66F4\u65B0\uFF1B\u5F53\u524D\u8349\u7A3F\u4FDD\u7559\uFF0C\u4FDD\u5B58\u65F6\u670D\u52A1\u7AEF\u4F1A\u68C0\u67E5\u7248\u672C\u3002" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.state.busy || !this.state.dirty, children: "\u663E\u5F0F\u4FDD\u5B58\u8BA1\u7B97\u5BB9\u91CF" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: this.state.busy, onClick: () => this.reset(), children: "\u8BFB\u53D6\u6700\u65B0\u914D\u7F6E\uFF08\u653E\u5F03\u8349\u7A3F\uFF09" })
      ] })
    ] });
  }
}
class AgentForm extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { value: String(this.props.capacity.maxWorkers), version: this.props.capacity.version, dirty: false, error: "", busy: false };
  }
  componentDidUpdate(prev) {
    if (prev.capacity.version !== this.props.capacity.version && !this.state.dirty) this.reset();
  }
  reset() {
    this.setState({ value: String(this.props.capacity.maxWorkers), version: this.props.capacity.version, dirty: false, error: "" });
  }
  render() {
    return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (this.state.busy) return;
      this.setState({ busy: true, error: "" });
      void this.props.perform(async () => {
        try {
          const saved = await call(this.props.projectId, "agent_capacity_configure", { expectedVersion: this.state.version, maxWorkers: Number(this.state.value) });
          this.setState({ version: saved.version, value: String(saved.maxWorkers), dirty: false });
          await this.props.onSaved();
        } catch (error) {
          this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }).finally(() => this.setState({ busy: false }));
    }, children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5BBF\u4E3B Pi Worker \u4E0A\u9650",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u5BBF\u4E3B Pi Worker \u4E0A\u9650", disabled: this.state.busy, type: "number", min: 1, max: 32, required: true, value: this.state.value, onChange: (e) => this.setState({ value: e.target.value, dirty: true }) })
      ] }),
      this.state.version !== this.props.capacity.version ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u670D\u52A1\u7AEF\u914D\u7F6E\u5DF2\u66F4\u65B0\uFF1B\u8349\u7A3F\u4FDD\u7559\uFF0C\u8BF7\u6838\u5BF9\u7248\u672C\u3002" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.state.busy || !this.state.dirty, children: "\u663E\u5F0F\u4FDD\u5B58 Worker \u5BB9\u91CF" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: this.state.busy, onClick: () => this.reset(), children: "\u8BFB\u53D6\u6700\u65B0\u914D\u7F6E\uFF08\u653E\u5F03\u8349\u7A3F\uFF09" })
      ] })
    ] });
  }
}
class ModelHttpForm extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { value: String(this.props.capacity.configuration.maxRequests), version: this.props.capacity.configuration.version, dirty: false, error: "", busy: false };
  }
  componentDidUpdate(prev) {
    if (prev.capacity.configuration.version !== this.props.capacity.configuration.version && !this.state.dirty) this.reset();
  }
  reset() {
    this.setState({ value: String(this.props.capacity.configuration.maxRequests), version: this.props.capacity.configuration.version, dirty: false, error: "" });
  }
  async save() {
    if (this.state.busy) return;
    this.setState({ busy: true, error: "" });
    try {
      await this.props.perform(async () => {
        try {
          const saved = await call(this.props.projectId, "model_http_configure", { expectedVersion: this.state.version, maxRequests: Number(this.state.value) });
          this.setState({ value: String(saved.configuration.maxRequests), version: saved.configuration.version, dirty: false });
          await this.props.onSaved();
        } catch (error) {
          this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }, "\u5171\u4EAB Pi \u6A21\u578B HTTP \u8BF7\u6C42\u4E0A\u9650\u5DF2\u4FDD\u5B58");
    } finally {
      this.setState({ busy: false });
    }
  }
  render() {
    return /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      void this.save();
    }, children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5171\u4EAB\u6A21\u578B HTTP \u8BF7\u6C42\u4E0A\u9650",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u5171\u4EAB\u6A21\u578B HTTP \u8BF7\u6C42\u4E0A\u9650", type: "number", min: 0, max: 32, step: 1, required: true, disabled: this.state.busy, value: this.state.value, onChange: (e) => this.setState({ value: e.target.value, dirty: true }) })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8BBE\u4E3A 0 \u6682\u505C\u6D3E\u53D1\u65B0\u8BF7\u6C42\uFF1B\u6B63\u5728\u6267\u884C\u7684\u8BF7\u6C42\u7EE7\u7EED\u5B8C\u6210\u3002" }),
      this.state.version !== this.props.capacity.configuration.version ? /* @__PURE__ */ jsx("p", { role: "alert", className: "inline-warning", children: "\u914D\u7F6E\u5DF2\u66F4\u65B0\uFF1B\u5F53\u524D\u8349\u7A3F\u4FDD\u7559\uFF0C\u4FDD\u5B58\u65F6\u670D\u52A1\u7AEF\u4F1A\u68C0\u67E5\u7248\u672C\u3002" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.state.busy || !this.state.dirty, children: "\u663E\u5F0F\u4FDD\u5B58 HTTP \u4E0A\u9650" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: this.state.busy, onClick: () => this.reset(), children: "\u8BFB\u53D6\u6700\u65B0\u914D\u7F6E\uFF08\u653E\u5F03\u8349\u7A3F\uFF09" })
      ] })
    ] });
  }
}
class TargetProbe extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { context: "desktop-linux", busy: false, error: "", result: null };
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  async probe() {
    if (this.state.busy) return;
    this.setState({ busy: true, error: "", result: null });
    try {
      await this.props.perform(async () => {
        try {
          const result = await call(this.props.projectId, "compute_target_probe", { context: this.state.context.trim() });
          if (this.mounted) this.setState({ result });
          await this.props.onConfirmed();
        } catch (error) {
          if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  render() {
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u6838\u5BF9 Docker \u76EE\u6807" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9996\u6B21\u4F7F\u7528\u6216 Context \u5DF2\u66F4\u6362\u5F15\u64CE\u65F6\uFF0C\u5148\u6838\u5BF9\u672C\u673A\u76EE\u6807\u8EAB\u4EFD\u3002\u6B64\u64CD\u4F5C\u4E0D\u542F\u52A8\u5BB9\u5668\u3001\u4E0D\u4FEE\u6539\u9650\u989D\u3001\u4E0D\u91CD\u65B0\u63D0\u4EA4\u4F5C\u4E1A\uFF0C\u4E5F\u4E0D\u91CD\u65B0\u7ED1\u5B9A\u5DF2\u6709\u4F5C\u4E1A\u3002" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        void this.probe();
      }, children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u672C\u673A Docker context",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u6838\u5BF9\u76EE\u6807\u7684 Docker context", required: true, maxLength: 100, pattern: "[A-Za-z0-9][A-Za-z0-9_.-]*", disabled: this.state.busy, value: this.state.context, onChange: (e) => this.setState({ context: e.target.value, result: null, error: "" }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.busy || !this.state.context.trim(), children: this.state.busy ? "\u6B63\u5728\u6838\u5BF9\u2026" : "\u6838\u5BF9 Docker \u76EE\u6807" })
      ] }),
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      this.state.result ? /* @__PURE__ */ jsxs("div", { role: "status", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u76EE\u6807\u8EAB\u4EFD\u5DF2\u786E\u8BA4\uFF1A",
          this.state.result.context
        ] }),
        /* @__PURE__ */ jsx("code", { className: "digest", children: this.state.result.targetId }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u6838\u5BF9\u65F6\u95F4 ",
          this.state.result.observedAt,
          "\uFF1B\u8BF7\u6839\u636E\u6700\u65B0\u5BB9\u91CF\u72B6\u6001\u51B3\u5B9A\u540E\u7EED\u64CD\u4F5C\u3002"
        ] })
      ] }) : null
    ] });
  }
}
class SchedulerView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { compute: null, agents: null, http: null, cursor: 0, httpCursor: 0, loading: false, error: "" };
    this.epoch = 0;
  }
  componentDidMount() {
    void this.refresh();
  }
  componentWillUnmount() {
    this.epoch++;
  }
  componentDidUpdate(prev) {
    if (prev.data !== this.props.data && this.state.cursor === 0 && this.state.httpCursor === 0) this.setState({ compute: this.props.data.compute ?? this.state.compute, agents: this.props.data.agentCapacity ?? this.state.agents, http: this.props.data.modelHttp ?? this.state.http });
  }
  async refresh(cursor = this.state.cursor, httpCursor = this.state.httpCursor) {
    const epoch = ++this.epoch;
    this.setState({ loading: true, error: "" });
    try {
      const [compute, agents, http] = await Promise.all([call(this.props.data.project.id, "compute_queue_inspect", { cursor, limit: 50 }), call(this.props.data.project.id, "agent_capacity_inspect"), call(this.props.data.project.id, "model_http_inspect", { cursor: httpCursor, limit: 50 })]);
      if (epoch === this.epoch) this.setState({ compute, agents, http, cursor, httpCursor });
    } catch (error) {
      if (epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (epoch === this.epoch) this.setState({ loading: false });
    }
  }
  render() {
    const c = this.state.compute ?? this.props.data.compute, a = this.state.agents ?? this.props.data.agentCapacity, h = this.state.http ?? this.props.data.modelHttp;
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u8D44\u6E90\u4E0E\u8C03\u5EA6", sub: "\u5171\u4EAB\u5BB9\u91CF\u3001\u5F53\u524D\u9879\u76EE\u961F\u5217\u548C\u4FDD\u7559\u4E2D\u7684\u672A\u77E5\u5360\u7528\u3002", children: /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading, onClick: () => void this.refresh(), children: "\u5237\u65B0\u8C03\u5EA6\u72B6\u6001" }) }),
      /* @__PURE__ */ jsx("p", { className: "notice", children: "\u5BB9\u91CF\u8BBE\u7F6E\u5F71\u54CD\u5171\u4EAB\u540C\u4E00\u6570\u636E\u76EE\u5F55\u7684\u6240\u6709\u9879\u76EE\uFF0C\u4E0D\u4FEE\u6539\u5DF2\u7ECF\u6279\u51C6\u7684\u547D\u4EE4\u3001\u955C\u50CF\u6216\u8D44\u6E90\u9700\u6C42\u3002\u4EE5\u4E0B\u6570\u5B57\u662F\u8C03\u5EA6\u9884\u7B97\uFF0C\u4E0D\u662F\u786C\u4EF6\u7A7A\u95F2\u91CF\u3001Token \u6216\u8D26\u5355\u786C\u9650\u989D\u3002" }),
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u5BBF\u4E3B Pi Worker" }),
        a ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dl", { className: "details", children: [
            /* @__PURE__ */ jsx("dt", { children: "\u5171\u4EAB\u5360\u7528" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              a.counts.held,
              " / ",
              a.maxWorkers,
              " \u4E2A Pi Worker"
            ] }),
            /* @__PURE__ */ jsx("dt", { children: "\u5BBF\u4E3B\u53EF\u7528" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              a.available,
              " \u4E2A Worker"
            ] }),
            /* @__PURE__ */ jsx("dt", { children: "\u72B6\u6001\u5206\u5E03" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              "\u9884\u7559 ",
              a.counts.reserved,
              " \xB7 \u8FD0\u884C ",
              a.counts.running,
              " \xB7 \u505C\u6B62\u4E2D ",
              a.counts.stopping,
              " \xB7 \u672A\u77E5 ",
              a.counts.unknown
            ] }),
            a.project ? /* @__PURE__ */ jsxs("div", { className: "detail-pair", children: [
              /* @__PURE__ */ jsx("dt", { children: "\u9879\u76EE\u914D\u989D" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                "Agent ",
                a.project.maxActiveAgents,
                " \xB7 \u52A9\u624B ",
                a.project.maxConcurrentAssistants,
                "\uFF1B\u5F53\u524D\u53EF\u7528 ",
                a.project.available,
                "\uFF0C\u52A9\u624B\u53EF\u7528 ",
                a.project.assistantAvailable
              ] })
            ] }) : null
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "Worker \u69FD\u4F4D\u4E0D\u7B49\u4E8E\u6A21\u578B HTTP \u8BF7\u6C42\u6570\u3002Worker \u672A\u77E5\u5360\u7528\u9700\u6838\u5BF9\uFF0C\u4E0D\u56E0\u79DF\u7EA6\u8FC7\u671F\u81EA\u52A8\u5F53\u4F5C\u7A7A\u95F2\u3002" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: "\u5F53\u524D\u9879\u76EE\u5F85\u542F\u52A8\u4F1A\u8BDD\uFF08\u6709\u754C\u5217\u8868\uFF09" }),
            a.queued?.length ? /* @__PURE__ */ jsx("ul", { children: a.queued.map((item) => /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("code", { children: short(item.sessionId) }),
              " \xB7 ",
              label(item.role),
              /* @__PURE__ */ jsx("ul", { children: item.reasons.map((reason, i) => /* @__PURE__ */ jsxs("li", { children: [
                reason.message,
                " ",
                /* @__PURE__ */ jsxs("small", { children: [
                  "(",
                  reason.code,
                  ")"
                ] })
              ] }, i)) })
            ] }, item.sessionId)) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672A\u8FD4\u56DE\u5F85\u542F\u52A8\u4F1A\u8BDD\uFF1B\u4E0D\u636E\u6B64\u63A8\u65AD\u5176\u4ED6\u9879\u76EE\u961F\u5217\u4E3A\u7A7A\u3002" })
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u4FEE\u6539\u5171\u4EAB Worker \u5BB9\u91CF" }),
            /* @__PURE__ */ jsx(AgentForm, { projectId: this.props.data.project.id, capacity: a, perform: this.props.perform, onSaved: () => this.refresh() })
          ] })
        ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: "Worker \u5BB9\u91CF\u5F85\u52A0\u8F7D\u3002" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
        /* @__PURE__ */ jsx("h2", { children: "Pi \u6A21\u578B HTTP \u8BF7\u6C42" }),
        h ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("dl", { className: "details", children: [
            /* @__PURE__ */ jsx("dt", { children: "\u5171\u4EAB\u4E0A\u9650" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              h.configuration.maxRequests,
              " \u4E2A\u5B9E\u9645 HTTP \u8BF7\u6C42 \xB7 \u53EF\u6D3E\u53D1 ",
              h.available
            ] }),
            /* @__PURE__ */ jsx("dt", { children: "\u5171\u4EAB\u72B6\u6001" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              "\u6392\u961F ",
              h.counts.queued,
              " \xB7 \u6267\u884C ",
              h.counts.active,
              " \xB7 \u672A\u77E5\u4FDD\u7559 ",
              h.counts.unknown
            ] }),
            /* @__PURE__ */ jsx("dt", { children: "\u7BA1\u7406\u8303\u56F4" }),
            /* @__PURE__ */ jsx("dd", { children: h.coverage === "legacy-workers-present" ? `\u4ECD\u6709 ${h.legacyWorkerCount} \u4E2A\u65E7 Worker\uFF1B\u65B0\u8BF7\u6C42\u6682\u4E0D\u6D3E\u53D1` : "\u53D7\u7BA1 HTTP \u8BF7\u6C42" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u6B64\u5904\u8BA1\u91CF\u53D7\u7BA1\u7684 Pi \u6A21\u578B HTTP \u8BF7\u6C42\uFF0C\u4E0E\u4E0A\u9762\u7684 Worker \u69FD\u4F4D\u5206\u522B\u8BA1\u7B97\u3002\u652F\u6301 ",
            h.supportedApis.join("\u3001"),
            "\uFF1B\u4E0D\u4EE3\u8868 Token \u6216\u4F9B\u5E94\u5546\u8D26\u5355\u9650\u989D\u3002"
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u4FEE\u6539\u5171\u4EAB\u6A21\u578B HTTP \u8BF7\u6C42\u4E0A\u9650" }),
            /* @__PURE__ */ jsx(ModelHttpForm, { projectId: this.props.data.project.id, capacity: h, perform: this.props.perform, onSaved: () => this.refresh() })
          ] }),
          /* @__PURE__ */ jsx("h3", { children: "\u5F53\u524D\u9879\u76EE HTTP \u8BF7\u6C42\u8BB0\u5F55" }),
          h.items.length ? /* @__PURE__ */ jsx("div", { className: "table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "\u8BF7\u6C42" }),
              /* @__PURE__ */ jsx("th", { children: "\u6A21\u578B" }),
              /* @__PURE__ */ jsx("th", { children: "\u72B6\u6001" }),
              /* @__PURE__ */ jsx("th", { children: "\u65F6\u95F4\u4E0E\u56DE\u6267" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: h.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsxs("td", { children: [
                /* @__PURE__ */ jsx("code", { children: short(item.id) }),
                /* @__PURE__ */ jsxs("small", { children: [
                  "\u4F1A\u8BDD ",
                  short(item.sessionId)
                ] })
              ] }),
              /* @__PURE__ */ jsxs("td", { children: [
                item.provider,
                " / ",
                item.model
              ] }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { value: item.state }) }),
              /* @__PURE__ */ jsxs("td", { children: [
                "\u6392\u961F ",
                item.queuedAt,
                item.startedAt ? /* @__PURE__ */ jsxs("p", { children: [
                  "\u5F00\u59CB ",
                  item.startedAt
                ] }) : null,
                item.endedAt ? /* @__PURE__ */ jsxs("p", { children: [
                  "\u7ED3\u675F ",
                  item.endedAt
                ] }) : null,
                item.httpStatus !== void 0 ? /* @__PURE__ */ jsxs("p", { children: [
                  "HTTP ",
                  item.httpStatus
                ] }) : null,
                item.receivedBytes !== void 0 ? /* @__PURE__ */ jsxs("p", { children: [
                  "\u63A5\u6536 ",
                  item.receivedBytes,
                  " \u5B57\u8282"
                ] }) : null,
                item.outcome ? /* @__PURE__ */ jsx("p", { children: item.outcome }) : null
              ] })
            ] }, item.id)) })
          ] }) }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5F53\u524D\u9875\u6CA1\u6709 HTTP \u8BF7\u6C42\u8BB0\u5F55\u3002" }),
          /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading || this.state.httpCursor === 0, onClick: () => void this.refresh(this.state.cursor, 0), children: "HTTP \u9996\u9875" }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading || h.nextCursor === null, onClick: () => {
              if (h.nextCursor !== null) void this.refresh(this.state.cursor, h.nextCursor);
            }, children: "HTTP \u4E0B\u4E00\u9875" })
          ] })
        ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u6A21\u578B HTTP \u8BF7\u6C42\u72B6\u6001\u5F85\u52A0\u8F7D\u3002" })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "secondary-section", children: [
        /* @__PURE__ */ jsx("summary", { children: "\u6838\u5BF9 Docker \u76EE\u6807" }),
        /* @__PURE__ */ jsx(TargetProbe, { projectId: this.props.data.project.id, perform: this.props.perform, onConfirmed: () => this.refresh() })
      ] }),
      c ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u5171\u4EAB\u8BA1\u7B97\u9884\u7B97" }),
          /* @__PURE__ */ jsx(Usage, { limits: c.configuration.limits, usage: c.usage, available: c.available }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u6392\u961F\u8BA1\u6570\uFF1A",
            c.queued,
            " \xB7 \u914D\u7F6E\u7248\u672C ",
            c.configuration.version
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u4FEE\u6539\u5171\u4EAB\u8BA1\u7B97\u5BB9\u91CF" }),
            /* @__PURE__ */ jsx(ComputeForm, { projectId: this.props.data.project.id, configuration: c.configuration, perform: this.props.perform, onSaved: () => this.refresh() })
          ] })
        ] }),
        c.targets.map((target) => /* @__PURE__ */ jsxs("section", { className: "surface report-builder", children: [
          /* @__PURE__ */ jsx("h2", { children: target.backend === "docker" ? "Docker \u8BA1\u7B97\u76EE\u6807" : "\u53D7\u4FE1\u672C\u5730\u793A\u4F8B\u76EE\u6807" }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "Context \u522B\u540D\uFF1A",
            target.contexts.join("\u3001") || "\u65E0",
            "\u3002\u540C\u4E00\u5B9E\u9645\u5F15\u64CE\u7684\u522B\u540D\u5171\u4EAB\u5BB9\u91CF\u3002"
          ] }),
          /* @__PURE__ */ jsx(Usage, { limits: target.configuration.limits, usage: target.usage, available: target.available }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u76EE\u6807\u8EAB\u4EFD\u4E0E\u5BB9\u91CF\u914D\u7F6E" }),
            /* @__PURE__ */ jsx("code", { className: "digest", children: target.targetId }),
            /* @__PURE__ */ jsx(ComputeForm, { projectId: this.props.data.project.id, targetId: target.targetId, configuration: target.configuration, perform: this.props.perform, onSaved: () => this.refresh() })
          ] })
        ] }, target.targetId)),
        /* @__PURE__ */ jsxs("section", { className: "surface", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h2", { children: "\u5F53\u524D\u9879\u76EE\u8BA1\u7B97\u961F\u5217" }),
            /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u5360\u7528\u7EDF\u8BA1\u4E3A\u5BBF\u4E3B\u5171\u4EAB\u8303\u56F4\uFF1B\u672C\u5217\u8868\u53EA\u5305\u542B\u5F53\u524D\u9879\u76EE\u3002" })
          ] }),
          c.items.length ? /* @__PURE__ */ jsx("div", { className: "table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "\u4F5C\u4E1A" }),
              /* @__PURE__ */ jsx("th", { children: "\u72B6\u6001\u4E0E\u539F\u56E0" }),
              /* @__PURE__ */ jsx("th", { children: "\u8D44\u6E90\u9700\u6C42" }),
              /* @__PURE__ */ jsx("th", { children: "\u6062\u590D\u4E0E\u5360\u7528" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: c.items.map((item) => /* @__PURE__ */ jsx(QueueRow, { item }, `${item.kind}:${item.id}`)) })
          ] }) }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5F53\u524D\u9875\u6CA1\u6709\u8BA1\u7B97\u4F5C\u4E1A\u3002" }),
          /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading || this.state.cursor === 0, onClick: () => void this.refresh(0), children: "\u8FD4\u56DE\u9996\u9875" }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: this.state.loading || c.nextCursor === null, onClick: () => {
              if (c.nextCursor !== null) void this.refresh(c.nextCursor);
            }, children: "\u4E0B\u4E00\u9875" })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u8BA1\u7B97\u5BB9\u91CF\u4E0E\u961F\u5217\u5F85\u52A0\u8F7D\u3002" })
    ] });
  }
}
function QueueRow({ item }) {
  return /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsxs("td", { children: [
      item.kind === "run" ? "\u6B63\u5F0F Run" : item.kind === "document" ? "\u6587\u6863\u89E3\u6790" : item.kind === "publication" ? "\u6587\u7A3F\u6784\u5EFA" : "\u5F00\u53D1\u6D4B\u8BD5",
      " ",
      /* @__PURE__ */ jsx("code", { children: short(item.id) }),
      /* @__PURE__ */ jsxs("small", { children: [
        "\u961F\u5217\u5E8F\u53F7 ",
        item.sequence
      ] })
    ] }),
    /* @__PURE__ */ jsxs("td", { children: [
      /* @__PURE__ */ jsx(Badge, { value: item.state }),
      /* @__PURE__ */ jsx("p", { children: computeReasonLabels[item.reason] })
    ] }),
    /* @__PURE__ */ jsxs("td", { children: [
      item.requested.cpus,
      " CPU / ",
      item.requested.memoryMb,
      " MiB"
    ] }),
    /* @__PURE__ */ jsxs("td", { children: [
      item.held ? "\u5BB9\u91CF\u4FDD\u7559\u4E2D" : "\u672A\u5360\u5BB9\u91CF",
      item.state === "unknown" ? /* @__PURE__ */ jsx("p", { children: "\u672A\u77E5\u72B6\u6001\u4ECD\u8BA1\u5165\u5360\u7528\uFF0C\u7B49\u5F85\u6838\u5BF9\u3002" }) : null,
      item.nextAttemptAt > 0 ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u4E0B\u6B21\u53EF\u6838\u5BF9\u65F6\u95F4 ",
        new Date(item.nextAttemptAt).toLocaleString("zh-CN"),
        "\uFF08\u4E0D\u662F\u5F00\u59CB\u6267\u884C\u627F\u8BFA\uFF09"
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u6062\u590D\u53CA\u76EE\u6807\u8BE6\u60C5" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u4EE3\u6B21 ",
          item.generation,
          " \xB7 ",
          label(item.backend)
        ] }),
        /* @__PURE__ */ jsx("code", { className: "digest", children: item.targetId ?? "\u76EE\u6807\u5C1A\u672A\u786E\u8BA4" }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u79DF\u7EA6\u622A\u6B62 ",
          item.leaseUntil > 0 ? new Date(item.leaseUntil).toLocaleString("zh-CN") : "\u65E0\u6709\u6548\u79DF\u7EA6",
          "\uFF1B\u8FC7\u671F\u4E0D\u4EE3\u8868\u5916\u90E8\u4F5C\u4E1A\u5DF2\u7ED3\u675F\u3002"
        ] })
      ] })
    ] })
  ] });
}
export {
  ComputeWait,
  SchedulerView,
  computeReasonLabels
};
