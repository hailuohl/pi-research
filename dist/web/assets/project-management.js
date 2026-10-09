import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Modal, Icon } from "./ui.js";
import { short, date } from "./models.js";
const titles = { archive: "\u5F52\u6863\u9879\u76EE", unarchive: "\u53D6\u6D88\u9879\u76EE\u5F52\u6863", trash: "\u79FB\u5165\u56DE\u6536\u7AD9", restore: "\u8FD8\u539F\u9879\u76EE" };
const notices = { archive: "\u9879\u76EE\u5DF2\u5F52\u6863\uFF0C\u5386\u53F2\u4FDD\u7559\u4E14\u53EA\u8BFB\u3002", unarchive: "\u5DF2\u53D6\u6D88\u5F52\u6863\uFF0C\u65E7\u5BA1\u6279\u3001\u6743\u9650\u4E0E\u961F\u5217\u4E0D\u4F1A\u6062\u590D\u3002", trash: "\u9879\u76EE\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9\uFF1B\u6587\u4EF6\u4FDD\u7559\uFF0C\u666E\u901A\u5165\u53E3\u4E0D\u518D\u53EF\u8BFB\u3002", restore: "\u9879\u76EE\u5DF2\u8FD8\u539F\uFF1B\u65E7\u5BA1\u6279\u3001\u6743\u9650\u3001\u961F\u5217\u548C\u81EA\u52A8\u5316\u4E0D\u4F1A\u6062\u590D\u3002" };
function summary(project) {
  const status = project.status ?? (project.archived ? "archived" : "active");
  return { id: project.id, name: project.name, version: project.version, status, lifecycleEpoch: project.lifecycleEpoch, archived: status !== "active", createdAt: project.createdAt, updatedAt: project.updatedAt, ..."deletedAt" in project && project.deletedAt ? { deletedAt: project.deletedAt } : {}, ...project.restoreStatus ? { restoreStatus: project.restoreStatus } : {} };
}
function resultStatus(target) {
  if (target.action === "restore") {
    if (!target.project.restoreStatus) throw Error("\u8FD8\u539F\u76EE\u6807\u7F3A\u5C11\u5220\u9664\u524D\u72B6\u6001\uFF0C\u8BF7\u5237\u65B0\u9879\u76EE\u540E\u91CD\u65B0\u786E\u8BA4");
    return target.project.restoreStatus;
  }
  return target.action === "archive" ? "archived" : target.action === "unarchive" ? "active" : "trashed";
}
class ProjectManagement extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { active: [], archived: [], trashed: [], loading: true, busy: false, error: "", target: null, conflict: false, notice: "" };
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
      const [active, archived, trashed] = await Promise.all([api("/projects?status=active"), api("/projects?status=archived"), api("/projects?status=trashed")]);
      if (!Array.isArray(active) || !Array.isArray(archived) || !Array.isArray(trashed)) throw Error("\u9879\u76EE\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25");
      if (this.mounted && epoch === this.readEpoch) this.setState({ active, archived, trashed });
    } catch (error) {
      if (this.mounted && epoch === this.readEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.readEpoch) this.setState({ loading: false });
    }
  }
  choose(project, action) {
    if (this.changing) return;
    this.setState({ target: { project: summary(project), action, key: crypto.randomUUID() }, conflict: false, error: "", notice: "" });
  }
  async reloadTarget() {
    const target = this.state.target;
    if (!target || this.changing) return;
    this.setState({ busy: true, error: "" });
    try {
      const project = await api(`/projects/${encodeURIComponent(target.project.id)}/lifecycle`);
      if (project.id !== target.project.id || project.status !== target.project.status) throw Error("\u9879\u76EE\u72B6\u6001\u5DF2\u6539\u53D8\uFF0C\u8BF7\u8FD4\u56DE\u9879\u76EE\u5217\u8868\u91CD\u65B0\u9009\u62E9\u64CD\u4F5C");
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
      const expectedStatus = resultStatus(target), project = summary(await api(`/projects/${encodeURIComponent(target.project.id)}/${target.action}`, { expectedVersion: target.project.version }, "POST", void 0, target.key));
      if (project.id !== target.project.id || project.status !== expectedStatus) throw Error("\u9879\u76EE\u54CD\u5E94\u4E0E\u786E\u8BA4\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u9879\u76EE\u72B6\u6001");
      if (!this.mounted) return;
      await onChanged(project, token);
      if (!this.mounted) return;
      this.setState({ target: null, conflict: false, notice: notices[target.action] });
      await this.load();
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error), conflict: error instanceof ApiError && (error.status === 409 && (error.code.includes("VERSION") || error.code.includes("CONFLICT"))) });
    } finally {
      this.changing = false;
      if (this.mounted) this.setState({ busy: false });
    }
  }
  description(target) {
    switch (target.action) {
      case "archive":
        return "\u5F52\u6863\u540E\u9879\u76EE\u4ECE\u6D3B\u52A8\u5217\u8868\u9690\u85CF\uFF0C\u4F1A\u8BDD\u3001\u6E90\u7801\u4E0E\u5DF2\u6709\u6210\u679C\u4FDD\u7559\u4E3A\u53EA\u8BFB\u3002\u5C1A\u672A\u5B8C\u6210\u7684\u4F5C\u4E1A\u6216\u8BF7\u6C42\u4F1A\u963B\u6B62\u5F52\u6863\u3002";
      case "unarchive":
        return "\u53D6\u6D88\u5F52\u6863\u4FDD\u7559\u9879\u76EE ID \u4E0E\u5386\u53F2\u3002\u65E7\u5BA1\u6279\u3001\u6388\u6743\u548C\u6D88\u606F\u961F\u5217\u4E0D\u4F1A\u91CD\u65B0\u751F\u6548\u3002\u5DF2\u6709\u6388\u6743\u7ED1\u5B9A\u7684\u65E7\u4F1A\u8BDD\u4ECD\u53EF\u67E5\u770B\uFF1B\u8BF7\u65B0\u5EFA\u4F1A\u8BDD\u5E76\u91CD\u65B0\u6388\u6743\u540E\u7EE7\u7EED\u5DE5\u4F5C\u3002";
      case "trash":
        return "\u9879\u76EE\u79FB\u5165\u56DE\u6536\u7AD9\u540E\uFF0C\u4F1A\u8BDD\u3001\u6E90\u7801\u4E0E\u6210\u679C\u505C\u6B62\u901A\u8FC7\u666E\u901A\u5165\u53E3\u8BFB\u53D6\uFF0C\u6587\u4EF6\u4FDD\u7559\u4E14\u53EF\u8FD8\u539F\u5230\u5F53\u524D\u72B6\u6001\u3002\u65E7\u5BA1\u6279\u3001\u6743\u9650\u3001\u6D88\u606F\u961F\u5217\u548C\u81EA\u52A8\u5316\u4E0D\u4F1A\u6062\u590D\u3002\u5C1A\u672A\u5B8C\u6210\u7684\u4F5C\u4E1A\u6216\u8BF7\u6C42\u4F1A\u963B\u6B62\u6B64\u64CD\u4F5C\u3002";
      case "restore":
        return `\u9879\u76EE\u5C06\u8FD8\u539F\u4E3A${target.project.restoreStatus === "archived" ? "\u5DF2\u5F52\u6863\uFF0C\u53EA\u8BFB\u67E5\u770B\u5386\u53F2" : "\u6D3B\u52A8\u9879\u76EE"}\uFF0C\u4FDD\u7559\u539F\u9879\u76EE ID \u548C\u5386\u53F2\u3002\u65E7\u5BA1\u6279\u3001\u6743\u9650\u3001\u6D88\u606F\u961F\u5217\u548C\u81EA\u52A8\u5316\u4E0D\u4F1A\u91CD\u65B0\u751F\u6548\uFF1B\u5DF2\u6709\u6388\u6743\u7ED1\u5B9A\u7684\u65E7\u4F1A\u8BDD\u8BF7\u901A\u8FC7\u65B0\u5EFA\u4F1A\u8BDD\u5E76\u91CD\u65B0\u6388\u6743\u540E\u7EE7\u7EED\u5DE5\u4F5C\u3002`;
    }
  }
  render() {
    const { target, busy, loading, error, notice, conflict } = this.state;
    return /* @__PURE__ */ jsxs(Modal, { title: target ? titles[target.action] : "\u9879\u76EE\u7BA1\u7406", description: target ? this.description(target) : "\u6253\u5F00\u6D3B\u52A8\u6216\u5DF2\u5F52\u6863\u9879\u76EE\uFF0C\u7BA1\u7406\u56DE\u6536\u7AD9\u4E2D\u7684\u4FDD\u7559\u9879\u76EE\u3002", alert: !!target, wide: !target, onClose: this.close, onSubmit: () => void this.confirm(), submitLabel: target ? { archive: "\u786E\u8BA4\u5F52\u6863", unarchive: "\u786E\u8BA4\u53D6\u6D88\u5F52\u6863", trash: "\u786E\u8BA4\u79FB\u5165\u56DE\u6536\u7AD9", restore: "\u786E\u8BA4\u8FD8\u539F" }[target.action] : "", submitDisabled: conflict, hideSubmit: !target, cancelLabel: target ? "\u8FD4\u56DE\u9879\u76EE\u5217\u8868" : "\u5173\u95ED", busy, children: [
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
        target.action === "trash" ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u8FD8\u539F\u540E\u72B6\u6001\uFF1A",
          target.project.status === "archived" ? "\u5DF2\u5F52\u6863" : "\u6D3B\u52A8"
        ] }) : null,
        conflict ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: busy, onClick: () => void this.reloadTarget(), children: "\u5237\u65B0\u76EE\u6807\u540E\u91CD\u65B0\u786E\u8BA4" }) : null
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "project-management-toolbar", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: loading || busy, onClick: () => void this.load(), children: "\u5237\u65B0\u9879\u76EE\u5217\u8868" }),
          loading ? /* @__PURE__ */ jsx("span", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" }) : null
        ] }),
        ["active", "archived", "trashed"].map((status) => /* @__PURE__ */ jsxs("section", { className: "project-management-group", "aria-label": status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : status === "archived" ? "\u5DF2\u5F52\u6863\u9879\u76EE" : "\u56DE\u6536\u7AD9", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : status === "archived" ? "\u5DF2\u5F52\u6863\u9879\u76EE" : "\u56DE\u6536\u7AD9",
            " ",
            /* @__PURE__ */ jsx("span", { className: "muted", children: this.state[status].length })
          ] }),
          /* @__PURE__ */ jsx("ul", { children: this.state[status].map((project) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: project.name }),
              /* @__PURE__ */ jsxs("small", { children: [
                short(project.id),
                status === "archived" ? " \xB7 \u53EA\u8BFB\u5386\u53F2" : status === "trashed" ? ` \xB7 \u5220\u9664\u524D\uFF1A${project.restoreStatus === "archived" ? "\u5DF2\u5F52\u6863" : "\u6D3B\u52A8"}` : ""
              ] }),
              status === "trashed" && "deletedAt" in project ? /* @__PURE__ */ jsxs("small", { children: [
                "\u79FB\u5165\u65F6\u95F4\uFF1A",
                date(project.deletedAt)
              ] }) : null
            ] }),
            /* @__PURE__ */ jsx("div", { className: "actions", children: status === "trashed" ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => this.choose(project, "restore"), children: "\u8FD8\u539F" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => this.props.onOpen(project.id), children: [
                "\u6253\u5F00",
                status === "archived" ? "\u5386\u53F2" : ""
              ] }),
              /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", disabled: busy, onClick: () => this.choose(project, status === "active" ? "archive" : "unarchive"), children: [
                /* @__PURE__ */ jsx(Icon, { name: "archive", size: 15 }),
                status === "active" ? "\u5F52\u6863" : "\u53D6\u6D88\u5F52\u6863"
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled: busy, onClick: () => this.choose(project, "trash"), children: "\u79FB\u5165\u56DE\u6536\u7AD9" })
            ] }) })
          ] }, project.id)) }),
          !loading && !this.state[status].length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: status === "active" ? "\u6682\u65E0\u6D3B\u52A8\u9879\u76EE\u3002" : status === "archived" ? "\u6682\u65E0\u5DF2\u5F52\u6863\u9879\u76EE\u3002" : "\u56DE\u6536\u7AD9\u4E3A\u7A7A\u3002" }) : null
        ] }, status))
      ] })
    ] });
  }
}
export {
  ProjectManagement
};
