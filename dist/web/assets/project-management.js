import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Modal, Icon } from "./ui.js";
import { short } from "./models.js";
class ProjectManagement extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { active: [], archived: [], loading: true, busy: false, error: "", target: null, conflict: false, notice: "" };
    this.mounted = true;
    this.readEpoch = 0;
    this.changing = false;
    this.close = () => {
      if (this.state.busy) return;
      if (this.state.target) this.setState({ target: null, error: "", conflict: false, notice: "" });
      else this.props.onClose();
    };
  }
  componentDidMount() {
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.readEpoch++;
  }
  async load() {
    const epoch = ++this.readEpoch;
    this.setState({ loading: true, error: "" });
    try {
      const [active, archived] = await Promise.all([api("/projects?status=active"), api("/projects?status=archived")]);
      if (!Array.isArray(active) || !Array.isArray(archived)) throw Error("\u9879\u76EE\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25");
      if (this.mounted && epoch === this.readEpoch) this.setState({ active, archived });
    } catch (error) {
      if (this.mounted && epoch === this.readEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.readEpoch) this.setState({ loading: false });
    }
  }
  choose(project, action) {
    if (this.changing) return;
    this.setState({ target: { project, action, key: crypto.randomUUID() }, conflict: false, error: "", notice: "" });
  }
  async reloadTarget() {
    const target = this.state.target;
    if (!target || this.changing) return;
    this.setState({ busy: true, error: "" });
    try {
      const project = await api(`/projects/${encodeURIComponent(target.project.id)}`);
      if (project.id !== target.project.id || project.archived !== (target.action === "unarchive")) throw Error("\u9879\u76EE\u72B6\u6001\u5DF2\u6539\u53D8\uFF0C\u8BF7\u8FD4\u56DE\u9879\u76EE\u5217\u8868\u91CD\u65B0\u9009\u62E9\u64CD\u4F5C");
      if (this.mounted && this.state.target === target) this.setState({ target: { ...target, project, key: crypto.randomUUID() }, conflict: false, notice: "\u5DF2\u5237\u65B0\u76EE\u6807\u7248\u672C\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u9879\u76EE\u5E76\u786E\u8BA4\u3002" });
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  async confirm() {
    const target = this.state.target;
    if (!target || this.changing || this.state.busy || this.state.conflict) return;
    this.changing = true;
    const token = this.props.selectionToken(), onChanged = this.props.onChanged;
    this.setState({ busy: true, error: "", notice: "" });
    try {
      const project = await api(`/projects/${encodeURIComponent(target.project.id)}/${target.action}`, { expectedVersion: target.project.version }, "POST", void 0, target.key);
      if (project.id !== target.project.id || project.archived !== (target.action === "archive")) throw Error("\u9879\u76EE\u54CD\u5E94\u4E0E\u786E\u8BA4\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u9879\u76EE\u72B6\u6001");
      if (!this.mounted) return;
      await onChanged(project, token);
      if (!this.mounted) return;
      this.setState({ target: null, conflict: false, notice: target.action === "archive" ? "\u9879\u76EE\u5DF2\u5F52\u6863\uFF0C\u5386\u53F2\u4FDD\u7559\u4E14\u53EA\u8BFB\u3002" : "\u5DF2\u53D6\u6D88\u5F52\u6863\uFF0C\u65E7\u5BA1\u6279\u3001\u6743\u9650\u4E0E\u961F\u5217\u4E0D\u4F1A\u6062\u590D\u3002" });
      await this.load();
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error), conflict: error instanceof ApiError && (error.status === 409 && (error.code.includes("VERSION") || error.code.includes("CONFLICT"))) });
    } finally {
      this.changing = false;
      if (this.mounted) this.setState({ busy: false });
    }
  }
  render() {
    const { target, busy, loading, error, notice, conflict } = this.state;
    return /* @__PURE__ */ jsxs(Modal, { title: target ? target.action === "archive" ? "\u5F52\u6863\u9879\u76EE" : "\u53D6\u6D88\u9879\u76EE\u5F52\u6863" : "\u9879\u76EE\u7BA1\u7406", description: target ? target.action === "archive" ? "\u5F52\u6863\u540E\u9879\u76EE\u4ECE\u6D3B\u52A8\u5217\u8868\u9690\u85CF\uFF0C\u4F1A\u8BDD\u3001\u6E90\u7801\u4E0E\u5DF2\u6709\u6210\u679C\u4FDD\u7559\u4E3A\u53EA\u8BFB\u3002\u5C1A\u672A\u5B8C\u6210\u7684\u4F5C\u4E1A\u6216\u8BF7\u6C42\u4F1A\u963B\u6B62\u5F52\u6863\u3002" : "\u53D6\u6D88\u5F52\u6863\u4FDD\u7559\u9879\u76EE ID \u4E0E\u5386\u53F2\u3002\u65E7\u5BA1\u6279\u3001\u6388\u6743\u548C\u6D88\u606F\u961F\u5217\u4E0D\u4F1A\u91CD\u65B0\u751F\u6548\u3002\u5DF2\u6709\u6388\u6743\u7ED1\u5B9A\u7684\u65E7\u4F1A\u8BDD\u4ECD\u53EF\u67E5\u770B\uFF1B\u8BF7\u65B0\u5EFA\u4F1A\u8BDD\u5E76\u91CD\u65B0\u6388\u6743\u540E\u7EE7\u7EED\u5DE5\u4F5C\u3002" : "\u6253\u5F00\u6D3B\u52A8\u9879\u76EE\uFF0C\u6216\u67E5\u770B\u4E0E\u6062\u590D\u5DF2\u5F52\u6863\u9879\u76EE\u3002", alert: !!target, wide: !target, onClose: this.close, onSubmit: () => void this.confirm(), submitLabel: target?.action === "archive" ? "\u786E\u8BA4\u5F52\u6863" : "\u786E\u8BA4\u53D6\u6D88\u5F52\u6863", submitDisabled: conflict, hideSubmit: !target, cancelLabel: target ? "\u8FD4\u56DE\u9879\u76EE\u5217\u8868" : "\u5173\u95ED", busy, children: [
      error ? /* @__PURE__ */ jsxs("div", { role: "alert", className: "error-text", children: [
        /* @__PURE__ */ jsx("p", { children: error }),
        target && !conflict ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u7F51\u7EDC\u5931\u8054\u65F6\u518D\u6B21\u786E\u8BA4\u4F1A\u590D\u7528\u540C\u4E00\u8BF7\u6C42\uFF0C\u907F\u514D\u91CD\u590D\u64CD\u4F5C\u3002" }) : null
      ] }) : null,
      notice ? /* @__PURE__ */ jsx("p", { role: "status", children: notice }) : null,
      target ? /* @__PURE__ */ jsxs("div", { className: "project-confirmation", children: [
        /* @__PURE__ */ jsx("strong", { children: target.project.name }),
        /* @__PURE__ */ jsxs("code", { children: [
          short(target.project.id),
          " \xB7 \u7248\u672C ",
          target.project.version
        ] }),
        conflict ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: busy, onClick: () => void this.reloadTarget(), children: "\u5237\u65B0\u76EE\u6807\u540E\u91CD\u65B0\u786E\u8BA4" }) : null
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "project-management-toolbar", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: loading || busy, onClick: () => void this.load(), children: "\u5237\u65B0\u9879\u76EE\u5217\u8868" }),
          loading ? /* @__PURE__ */ jsx("span", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" }) : null
        ] }),
        ["active", "archived"].map((status) => /* @__PURE__ */ jsxs("section", { className: "project-management-group", "aria-label": status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : "\u5DF2\u5F52\u6863\u9879\u76EE", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : "\u5DF2\u5F52\u6863\u9879\u76EE",
            " ",
            /* @__PURE__ */ jsx("span", { className: "muted", children: this.state[status].length })
          ] }),
          /* @__PURE__ */ jsx("ul", { children: this.state[status].map((project) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: project.name }),
              /* @__PURE__ */ jsxs("small", { children: [
                short(project.id),
                status === "archived" ? " \xB7 \u53EA\u8BFB\u5386\u53F2" : ""
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => this.props.onOpen(project.id), children: [
                "\u6253\u5F00",
                status === "archived" ? "\u5386\u53F2" : ""
              ] }),
              /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", disabled: busy, onClick: () => this.choose(project, status === "active" ? "archive" : "unarchive"), children: [
                /* @__PURE__ */ jsx(Icon, { name: "archive", size: 15 }),
                status === "active" ? "\u5F52\u6863" : "\u53D6\u6D88\u5F52\u6863"
              ] })
            ] })
          ] }, project.id)) }),
          !loading && !this.state[status].length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: status === "active" ? "\u6682\u65E0\u6D3B\u52A8\u9879\u76EE\u3002" : "\u6682\u65E0\u5DF2\u5F52\u6863\u9879\u76EE\u3002" }) : null
        ] }, status))
      ] })
    ] });
  }
}
export {
  ProjectManagement
};
