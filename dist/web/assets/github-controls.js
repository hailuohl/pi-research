import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Modal, nativeSelectButton } from "./ui.js";
const statusNames = { local: "\u4EC5\u672C\u5730", queued: "\u7B49\u5F85\u4E0A\u4F20", creating: "\u6B63\u5728\u521B\u5EFA\u4ED3\u5E93", uploading: "\u6B63\u5728\u4E0A\u4F20", synced: "\u5DF2\u540C\u6B65", failed: "\u540C\u6B65\u5931\u8D25", unknown: "\u6B63\u5728\u7B49\u5F85\u6838\u5BF9", paused: "\u5DF2\u6682\u505C" };
function GitHubReadiness({ status, error }) {
  return /* @__PURE__ */ jsxs("div", { "aria-live": "polite", children: [
    /* @__PURE__ */ jsx("p", { className: "small muted", children: error || status?.message || "\u6B63\u5728\u68C0\u6D4B\u672C\u673A GitHub CLI\u2026" }),
    status?.account ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
      "GitHub \u8D26\u53F7\uFF1A",
      status.account.login
    ] }) : null,
    status && !status.cliInstalled ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
      "\u5B89\u88C5 ",
      /* @__PURE__ */ jsx("a", { href: "https://cli.github.com/", target: "_blank", rel: "noreferrer", children: "GitHub CLI" }),
      " \u540E\u53EF\u542F\u7528\u4E0A\u4F20\uFF1B\u672C\u5730\u9879\u76EE\u59CB\u7EC8\u53EF\u7528\u3002"
    ] }) : null,
    status?.state === "unauthenticated" ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
      "\u767B\u5F55\u547D\u4EE4\uFF1A",
      /* @__PURE__ */ jsx("code", { children: "gh auth login" })
    ] }) : null
  ] });
}
class ProjectCreationModal extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { status: null, upload: false, statusError: "", error: "", submitting: false };
    this.mounted = false;
    this.epoch = 0;
    this.requestKey = crypto.randomUUID();
    this.submitting = false;
    this.onFocus = () => {
      void this.loadStatus();
    };
  }
  componentDidMount() {
    this.mounted = true;
    window.addEventListener("focus", this.onFocus);
    void this.loadStatus();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    window.removeEventListener("focus", this.onFocus);
  }
  async loadStatus() {
    const epoch = ++this.epoch;
    try {
      const status = await api("/github/status");
      if (this.mounted && epoch === this.epoch) this.setState({ status, statusError: "" });
    } catch (e) {
      if (this.mounted && epoch === this.epoch) this.setState({ status: null, statusError: String(e) });
    }
  }
  changed() {
    this.requestKey = crypto.randomUUID();
  }
  async submit(fd) {
    if (this.submitting) return;
    if (this.props.busy) {
      this.setState({ error: "\u5F53\u524D\u64CD\u4F5C\u5C1A\u672A\u5B8C\u6210\uFF0C\u672C\u6B21\u521B\u5EFA\u672A\u63D0\u4EA4\u3002\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" });
      return;
    }
    const { status, upload } = this.state;
    if (upload && (!status?.ready || !status.account)) {
      this.setState({ error: "GitHub CLI \u5C1A\u672A\u5C31\u7EEA\u3002\u8BF7\u53D6\u6D88\u52FE\u9009\u4EE5\u521B\u5EFA\u672C\u5730\u9879\u76EE\uFF0C\u6216\u5B8C\u6210\u767B\u5F55\u540E\u8FD4\u56DE\u3002" });
      return;
    }
    const input = { name: String(fd.get("name") ?? ""), description: String(fd.get("description") ?? ""), template: String(fd.get("template") ?? "empty"), ...upload ? { github: { enabled: true, expectedAccountId: status.account.id } } : {} };
    this.submitting = true;
    this.setState({ submitting: true, error: "" });
    try {
      await this.props.onCreate(input, this.requestKey);
    } catch (e) {
      if (this.mounted) this.setState({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      this.submitting = false;
      if (this.mounted) this.setState({ submitting: false });
    }
  }
  render() {
    const s = this.state, busy = this.props.busy || s.submitting;
    return /* @__PURE__ */ jsx(Modal, { title: "\u65B0\u5EFA\u9879\u76EE", submitLabel: "\u521B\u5EFA\u9879\u76EE", busy, closeDisabled: busy, onClose: this.props.onClose, onSubmit: (fd) => void this.submit(fd), children: /* @__PURE__ */ jsxs("div", { onChange: () => this.changed(), children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u9879\u76EE\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { "aria-label": "\u9879\u76EE\u540D\u79F0", name: "name", required: true, maxLength: 120, disabled: busy, placeholder: "\u4F8B\u5982\uFF1A\u6750\u6599\u7B5B\u9009\u7814\u7A76" })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u9879\u76EE\u8BF4\u660E",
        /* @__PURE__ */ jsx("textarea", { name: "description", disabled: busy, placeholder: "\u7814\u7A76\u76EE\u6807\u3001\u8303\u56F4\u6216\u8F93\u5165\u8D44\u6599" })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u9879\u76EE\u6A21\u677F",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u9879\u76EE\u6A21\u677F", name: "template", defaultValue: "curve-fit", disabled: busy, children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "curve-fit", children: "\u771F\u5B9E\u66F2\u7EBF\u62DF\u5408\u793A\u4F8B \xB7 \u53EF\u76F4\u63A5\u8FD0\u884C" }),
          /* @__PURE__ */ jsx("option", { value: "empty", children: "\u7A7A\u9879\u76EE \xB7 \u81EA\u884C\u51C6\u5907\u6587\u4EF6" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u66F2\u7EBF\u62DF\u5408\u6A21\u677F\u662F\u7528\u4E8E\u7CFB\u7EDF\u9A8C\u8BC1\u7684\u56FA\u5B9A\u6570\u503C\u793A\u4F8B\u3002" }),
      /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", "aria-label": "\u521B\u5EFA GitHub \u79C1\u5BC6\u4ED3\u5E93\u5E76\u81EA\u52A8\u540C\u6B65\u5DF2\u63D0\u4EA4\u6E90\u7801\u53CA\u5176 Git \u5386\u53F2", checked: s.upload, disabled: busy || !s.status?.ready && !s.upload, onChange: (e) => {
          if (!e.target.checked || s.status?.ready) this.setState({ upload: e.target.checked });
        } }),
        "\u521B\u5EFA GitHub \u79C1\u5BC6\u4ED3\u5E93\u5E76\u81EA\u52A8\u540C\u6B65\u5DF2\u63D0\u4EA4\u6E90\u7801\u53CA\u5176 Git \u5386\u53F2"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9ED8\u8BA4\u4EC5\u672C\u5730\u4FDD\u5B58\u3002\u4ED3\u5E93\u4F7F\u7528\u9879\u76EE\u540D\u6216\u4E2D\u6587\u62FC\u97F3\uFF1B\u91CD\u540D\u81EA\u52A8\u52A0 -1\u3001-2\u3002\u6570\u636E\u5E93\u3001\u4F1A\u8BDD\u548C\u72EC\u7ACB\u79D1\u7814\u8D44\u6599\u7559\u5728\u672C\u5730\u3002" }),
      /* @__PURE__ */ jsx(GitHubReadiness, { status: s.status, error: s.statusError }),
      s.error ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: s.error }) : null
    ] }) });
  }
}
class GitHubSettings extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { status: null, project: null, statusError: "", error: "", busy: false };
    this.mounted = false;
    this.cliEpoch = 0;
    this.projectEpoch = 0;
    this.onFocus = () => {
      void this.loadStatus();
      void this.loadProject();
    };
  }
  componentDidMount() {
    this.mounted = true;
    window.addEventListener("focus", this.onFocus);
    this.onFocus();
  }
  componentDidUpdate(prev) {
    const projectChanged = prev.projectId !== this.props.projectId;
    if (projectChanged) {
      this.projectEpoch++;
      clearTimeout(this.timer);
      this.mutation = void 0;
      this.setState({ project: null, error: "", busy: false });
    }
    if (!this.props.active) clearTimeout(this.timer);
    if (!prev.active && this.props.active) this.onFocus();
    else if (projectChanged) void this.loadProject();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.cliEpoch++;
    this.projectEpoch++;
    clearTimeout(this.timer);
    window.removeEventListener("focus", this.onFocus);
  }
  async loadStatus() {
    if (!this.mounted || !this.props.active) return;
    const epoch = ++this.cliEpoch;
    try {
      const status = await api("/github/status");
      if (this.mounted && epoch === this.cliEpoch) this.setState({ status, statusError: "" });
    } catch (e) {
      if (this.mounted && epoch === this.cliEpoch) this.setState({ status: null, statusError: String(e) });
    }
  }
  async loadProject() {
    clearTimeout(this.timer);
    if (!this.mounted || !this.props.active) return;
    const pid = this.props.projectId, epoch = ++this.projectEpoch;
    if (!pid) return;
    try {
      const project = await api(`/projects/${encodeURIComponent(pid)}/github`);
      if (!this.mounted || epoch !== this.projectEpoch || pid !== this.props.projectId) return;
      this.setState({ project });
      if (this.props.active && ["queued", "creating", "uploading"].includes(project.state)) this.timer = setTimeout(() => void this.loadProject(), 2e3);
    } catch (e) {
      if (this.mounted && epoch === this.projectEpoch) this.setState({ error: String(e) });
    }
  }
  async change(action) {
    const p = this.state.project, pid = this.props.projectId;
    if (!p || !pid || this.state.busy || this.props.readOnly) return;
    if (action !== "pause" && !this.state.status?.ready) {
      this.setState({ error: "\u8BF7\u5148\u4F7F\u672C\u673A GitHub CLI \u5C31\u7EEA\u3002" });
      return;
    }
    if (this.mutation?.action !== action || this.mutation.version !== p.version) this.mutation = { action, version: p.version, key: crypto.randomUUID() };
    const key = this.mutation.key;
    this.setState({ busy: true, error: "" });
    try {
      await api(`/projects/${encodeURIComponent(pid)}/github${action === "retry" ? "/retry" : ""}`, { expectedVersion: p.version, ...action !== "retry" ? { enabled: action === "resume" } : {} }, "POST", void 0, key);
    } catch (e) {
      if (this.mounted && pid === this.props.projectId) this.setState({ error: String(e) });
    } finally {
      if (this.mounted && pid === this.props.projectId) {
        this.setState({ busy: false });
        await this.loadProject();
      }
    }
  }
  render() {
    const { status, project: p } = this.state, accountChanged = !!(p?.account && status?.account && p.account.id !== status.account.id);
    return /* @__PURE__ */ jsxs("section", { className: "surface settings-model", "aria-label": "GitHub \u72B6\u6001", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "GitHub" }),
        /* @__PURE__ */ jsx("span", { className: "connection-state " + (status?.ready ? "ready" : ""), children: status?.ready ? "\u5DF2\u5C31\u7EEA" : "\u5C1A\u672A\u5C31\u7EEA" })
      ] }),
      status ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "Git ",
        status.gitInstalled ? "\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5",
        " \xB7 GitHub CLI ",
        status.cliInstalled ? status.version ?? "\u5DF2\u5B89\u88C5" : "\u672A\u5B89\u88C5"
      ] }) : null,
      /* @__PURE__ */ jsx(GitHubReadiness, { status, error: this.state.statusError }),
      p ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5F53\u524D\u9879\u76EE\uFF1A",
          statusNames[p.state] ?? p.state,
          p.pendingCount > 0 ? ` \xB7 ${p.pendingCount} \u9879\u5F85\u540C\u6B65` : ""
        ] }),
        p.repository ? /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("a", { className: "code-wrap", href: p.repository.url, target: "_blank", rel: "noreferrer", children: p.repository.fullName }),
          " \xB7 \u79C1\u5BC6\u4ED3\u5E93"
        ] }) : null,
        accountChanged ? /* @__PURE__ */ jsxs("p", { role: "alert", children: [
          "\u6B64\u9879\u76EE\u7ED1\u5B9A ",
          p.account.login,
          "\uFF0C\u8BF7\u5207\u6362\u5230\u8BE5 GitHub \u8D26\u53F7\u3002"
        ] }) : null,
        p.error ? /* @__PURE__ */ jsx("p", { role: "alert", children: p.error.message }) : null,
        p.state !== "local" ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: this.props.readOnly || this.state.busy || !p.enabled && (!status?.ready || accountChanged), onClick: () => void this.change(p.enabled ? "pause" : "resume"), children: p.enabled ? "\u6682\u505C GitHub \u540C\u6B65" : "\u6062\u590D GitHub \u540C\u6B65" }),
          p.retryable && p.enabled ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: this.props.readOnly || this.state.busy || !status?.ready || accountChanged, onClick: () => void this.change("retry"), children: "\u91CD\u8BD5\u540C\u6B65" }) : null
        ] }) : null,
        !p.enabled && p.state !== "local" ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6682\u505C\u4E0D\u5220\u9664\u8FDC\u7AEF\u5185\u5BB9\uFF1B\u6062\u590D\u540E\u540C\u6B65\u65B0\u63D0\u4EA4\uFF0C\u65B0\u63D0\u4EA4\u4F1A\u5305\u542B\u5176\u6240\u4F9D\u8D56\u7684 Git \u5386\u53F2\u3002" }) : null
      ] }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", children: this.state.error }) : null
    ] });
  }
}
export {
  GitHubSettings,
  ProjectCreationModal
};
