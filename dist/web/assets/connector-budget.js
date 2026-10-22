import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ApiError, api } from "./api.js";
class ConnectorBudget extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { version: 0, requestLimit: "", currentLimit: 0, requestsUsed: 0, loaded: false, dirty: false, loading: false, saving: false, error: "" };
    this.mounted = false;
    this.epoch = 0;
    this.loading = false;
    this.saving = false;
  }
  componentDidMount() {
    this.mounted = true;
    void this.refresh();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  componentDidUpdate(prev) {
    if (prev.projectId !== this.props.projectId) {
      this.epoch++;
      this.loading = false;
      this.saving = false;
      this.setState({ version: 0, requestLimit: "", currentLimit: 0, requestsUsed: 0, loaded: false, dirty: false, loading: false, saving: false, error: "" });
      void this.refresh();
    }
  }
  current(epoch, projectId) {
    return this.mounted && epoch === this.epoch && projectId === this.props.projectId;
  }
  async refresh() {
    if (this.loading || this.saving) return false;
    const projectId = this.props.projectId, epoch = this.epoch;
    this.loading = true;
    this.setState({ loading: true, error: "" });
    try {
      const config = await api(`/projects/${encodeURIComponent(projectId)}/connectors`);
      if (this.current(epoch, projectId)) this.setState((state) => ({ version: config.version, requestLimit: state.dirty ? state.requestLimit : String(config.requestLimit), currentLimit: config.requestLimit, requestsUsed: config.requestsUsed, loaded: true }));
      return this.current(epoch, projectId);
    } catch (error) {
      if (this.current(epoch, projectId)) this.setState({ error: error instanceof Error ? error.message : String(error) });
      return false;
    } finally {
      if (epoch === this.epoch) {
        this.loading = false;
        if (this.current(epoch, projectId)) this.setState({ loading: false });
      }
    }
  }
  setLimit(requestLimit) {
    if (!this.props.readOnly && !this.saving) this.setState({ requestLimit, dirty: true, error: "" });
  }
  async save() {
    if (this.props.readOnly || this.loading || this.saving || !this.state.loaded) return false;
    const requestLimit = Number(this.state.requestLimit);
    if (!Number.isInteger(requestLimit) || requestLimit < 1 || requestLimit > 1e4) {
      this.setState({ error: "\u8BF7\u6C42\u989D\u5EA6\u5FC5\u987B\u662F 1 \u81F3 10000 \u4E4B\u95F4\u7684\u6574\u6570\u3002" });
      return false;
    }
    const projectId = this.props.projectId, epoch = this.epoch, expectedVersion = this.state.version;
    this.saving = true;
    this.setState({ saving: true, error: "" });
    try {
      const saved = await api(`/projects/${encodeURIComponent(projectId)}/connectors`, { expectedVersion, requestLimit });
      if (this.current(epoch, projectId)) this.setState({ version: saved.version, requestLimit: String(saved.requestLimit), currentLimit: saved.requestLimit, requestsUsed: saved.requestsUsed, dirty: false });
      return this.current(epoch, projectId);
    } catch (error) {
      if (this.current(epoch, projectId)) this.setState({ error: error instanceof ApiError && error.code === "VERSION_CONFLICT" ? "\u8BBE\u7F6E\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5148\u5237\u65B0\u5E76\u6838\u5BF9\u5F53\u524D\u989D\u5EA6\uFF0C\u518D\u4FDD\u5B58\u8349\u7A3F\u3002" : error instanceof Error ? error.message : String(error) });
      return false;
    } finally {
      if (epoch === this.epoch) {
        this.saving = false;
        if (this.current(epoch, projectId)) this.setState({ saving: false });
      }
    }
  }
  render() {
    const disabled = !!this.props.readOnly || this.state.saving;
    return /* @__PURE__ */ jsxs("section", { className: "surface report-builder", "aria-label": "\u6587\u732E\u8FDE\u63A5\u5668\u8BF7\u6C42\u989D\u5EA6", "aria-busy": this.state.loading || this.state.saving, children: [
      /* @__PURE__ */ jsx("h2", { children: "\u6587\u732E\u8FDE\u63A5\u5668\u8BF7\u6C42\u989D\u5EA6" }),
      /* @__PURE__ */ jsx("p", { children: this.state.loaded ? `\u5DF2\u7528 HTTP \u5C1D\u8BD5\uFF1A${this.state.requestsUsed} / ${this.state.currentLimit} \u6B21` : "\u5F53\u524D\u989D\u5EA6\u548C\u5386\u53F2\u7528\u91CF\u5C1A\u672A\u8BFB\u53D6\u3002" }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u989D\u5EA6\u6309 HTTP \u8BF7\u6C42\u5C1D\u8BD5\u7D2F\u8BA1\uFF0C\u5931\u8D25\u5C1D\u8BD5\u4E5F\u8BA1\u5165\uFF1B\u4E0D\u4F1A\u6BCF\u5929\u81EA\u52A8\u91CD\u7F6E\u3002" }),
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("form", { onSubmit: (event) => {
        event.preventDefault();
        void this.save();
      }, children: [
        /* @__PURE__ */ jsxs("fieldset", { disabled, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BF7\u6C42\u4E0A\u9650",
            /* @__PURE__ */ jsx("input", { type: "number", "aria-label": "\u6587\u732E\u8FDE\u63A5\u5668\u8BF7\u6C42\u4E0A\u9650", min: 1, max: 1e4, step: 1, required: true, value: this.state.requestLimit, onChange: (event) => this.setLimit(event.target.value) })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "primary", type: "submit", disabled: disabled || !this.state.loaded || this.state.loading, children: this.state.saving ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u663E\u5F0F\u4FDD\u5B58\u989D\u5EA6" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "secondary", type: "button", disabled: this.state.loading || this.state.saving, onClick: () => void this.refresh(), children: this.state.loading ? "\u6B63\u5728\u5237\u65B0\u2026" : "\u5237\u65B0\u5E76\u6838\u5BF9\u5F53\u524D\u989D\u5EA6" })
      ] })
    ] });
  }
}
export {
  ConnectorBudget
};
