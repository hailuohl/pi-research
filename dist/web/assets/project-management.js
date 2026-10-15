import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, ApiError } from "./api.js";
import { Modal, Icon } from "./ui.js";
import { short, date } from "./models.js";
const titles = { archive: "\u5F52\u6863\u9879\u76EE", unarchive: "\u53D6\u6D88\u9879\u76EE\u5F52\u6863", trash: "\u79FB\u5165\u56DE\u6536\u7AD9", restore: "\u8FD8\u539F\u9879\u76EE", purge: "\u6C38\u4E45\u5220\u9664\u9879\u76EE" };
const notices = { archive: "\u9879\u76EE\u5DF2\u5F52\u6863\uFF0C\u5386\u53F2\u4FDD\u7559\u4E14\u53EA\u8BFB\u3002", unarchive: "\u5DF2\u53D6\u6D88\u5F52\u6863\uFF0C\u65E7\u5BA1\u6279\u3001\u6743\u9650\u4E0E\u961F\u5217\u4E0D\u4F1A\u6062\u590D\u3002", trash: "\u9879\u76EE\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9\uFF1B\u6587\u4EF6\u4FDD\u7559\uFF0C\u666E\u901A\u5165\u53E3\u4E0D\u518D\u53EF\u8BFB\u3002", restore: "\u9879\u76EE\u5DF2\u8FD8\u539F\uFF1B\u65E7\u5BA1\u6279\u3001\u6743\u9650\u3001\u961F\u5217\u548C\u81EA\u52A8\u5316\u4E0D\u4F1A\u6062\u590D\u3002" };
const lastPurgeKey = "pi-research-last-project-purge-v1";
function savedPurgeId() {
  try {
    const id = localStorage.getItem(lastPurgeKey);
    return typeof id === "string" && id.length > 0 && id.length <= 200 ? id : "";
  } catch {
    return "";
  }
}
function verifyPurge(view, id, purgeId) {
  if (view.projectId !== id || typeof view.purgeId !== "string" || !view.purgeId || purgeId && view.purgeId !== purgeId) throw Error("\u6E05\u7406\u72B6\u6001\u4E0E\u6240\u9009\u9879\u76EE\u6216\u4EFB\u52A1\u4E0D\u4E00\u81F4\uFF0C\u672A\u663E\u793A\u5176\u4ED6\u9879\u76EE\u8BB0\u5F55");
  if (!["pending", "running", "failed", "completed"].includes(view.state) || !["waiting_offline", "planning", "files", "records", "verify", "completed"].includes(view.phase) || !Number.isSafeInteger(view.completedPaths) || !Number.isSafeInteger(view.totalPaths) || view.completedPaths < 0 || view.totalPaths < view.completedPaths || typeof view.dataDir !== "string" || !view.dataDir || view.offlineRequired !== true || view.state === "completed" && view.phase !== "completed") throw Error("\u6E05\u7406\u72B6\u6001\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
}
function powershellPurgeCommand(project, view) {
  verifyPurge(view, project.id);
  if (view.state === "completed") return "";
  const args = ["node", "dist/apps/cli/index.js", "project", "purge", "--project", project.id, "--data", view.dataDir, "--offline", "--confirm-name", project.name, ...view.state === "failed" || view.state === "running" ? ["--resume"] : []];
  return "& " + args.map((value) => "'" + value.replace(/'/g, "''") + "'").join(" ");
}
function summary(project) {
  const status = project.status ?? (project.archived ? "archived" : "active");
  return { id: project.id, name: project.name, version: project.version, status, lifecycleEpoch: project.lifecycleEpoch, archived: status !== "active", createdAt: project.createdAt, updatedAt: project.updatedAt, ..."deletedAt" in project && project.deletedAt ? { deletedAt: project.deletedAt } : {}, ...project.restoreStatus ? { restoreStatus: project.restoreStatus } : {} };
}
function resultStatus(target) {
  if (target.action === "restore") {
    if (!target.project.restoreStatus) throw Error("\u8FD8\u539F\u76EE\u6807\u7F3A\u5C11\u5220\u9664\u524D\u72B6\u6001\uFF0C\u8BF7\u5237\u65B0\u9879\u76EE\u540E\u91CD\u65B0\u786E\u8BA4");
    return target.project.restoreStatus;
  }
  return target.action === "archive" ? "archived" : target.action === "unarchive" ? "active" : target.action === "purge" ? "purging" : "trashed";
}
class ProjectManagement extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { active: [], archived: [], trashed: [], purging: [], loading: true, busy: false, error: "", target: null, confirmName: "", conflict: false, notice: "", purgeProjectId: "", purgeProject: null, purge: null, purgeReading: false, purgeError: "", lastPurgeId: savedPurgeId() };
    this.mounted = true;
    this.readEpoch = 0;
    this.changing = false;
    this.purgeReadEpoch = 0;
    this.purgeTaskIds = /* @__PURE__ */ new Map();
    this.close = () => {
      if (this.state.busy) return;
      this.purgeReadEpoch++;
      if (this.state.target || this.state.purgeProjectId) this.setState({ target: null, confirmName: "", error: "", conflict: false, notice: "", purgeProjectId: "", purgeProject: null, purge: null, purgeReading: false, purgeError: "" });
      else this.props.onClose();
    };
  }
  componentDidMount() {
    void this.load();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.readEpoch++;
    this.purgeReadEpoch++;
  }
  async load() {
    const epoch = ++this.readEpoch;
    this.setState({ loading: true, error: "" });
    try {
      const [active, archived, trashed, purging] = await Promise.all([api("/projects?status=active"), api("/projects?status=archived"), api("/projects?status=trashed"), api("/projects?status=purging")]);
      if (!Array.isArray(active) || !Array.isArray(archived) || !Array.isArray(trashed) || !Array.isArray(purging)) throw Error("\u9879\u76EE\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25");
      if (this.mounted && epoch === this.readEpoch) this.setState({ active, archived, trashed, purging });
    } catch (error) {
      if (this.mounted && epoch === this.readEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.readEpoch) this.setState({ loading: false });
    }
  }
  choose(project, action) {
    if (this.changing) return;
    this.purgeReadEpoch++;
    this.setState({ target: { project: summary(project), action, key: crypto.randomUUID() }, confirmName: "", conflict: false, error: "", notice: "", purgeProjectId: "", purge: null, purgeProject: null, purgeError: "", purgeReading: false });
  }
  async reloadTarget() {
    const target = this.state.target;
    if (!target || this.changing) return;
    this.setState({ busy: true, error: "" });
    try {
      const project = await api(`/projects/${encodeURIComponent(target.project.id)}/lifecycle`);
      if (project.id !== target.project.id || project.status !== target.project.status) throw Error("\u9879\u76EE\u72B6\u6001\u5DF2\u6539\u53D8\uFF0C\u8BF7\u8FD4\u56DE\u9879\u76EE\u5217\u8868\u91CD\u65B0\u9009\u62E9\u64CD\u4F5C");
      if (this.mounted && this.state.target === target) this.setState({ target: { ...target, project, key: crypto.randomUUID() }, confirmName: "", conflict: false, notice: "\u5DF2\u5237\u65B0\u76EE\u6807\u7248\u672C\uFF0C\u8BF7\u91CD\u65B0\u6838\u5BF9\u9879\u76EE\u5E76\u786E\u8BA4\u3002" });
    } catch (error) {
      if (this.mounted) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted) this.setState({ busy: false });
    }
  }
  async confirm() {
    const target = this.state.target;
    if (!target || this.changing || this.state.busy || this.state.conflict) return;
    if (target.action === "purge" && (target.project.status !== "trashed" || this.state.confirmName !== target.project.name)) return;
    this.changing = true;
    const token = this.props.selectionToken(), onChanged = this.props.onChanged;
    this.setState({ busy: true, error: "", notice: "" });
    try {
      if (target.action === "purge") {
        const epoch = this.purgeReadEpoch, view = await api(`/projects/${encodeURIComponent(target.project.id)}/purge`, { expectedVersion: target.project.version, confirmName: target.project.name }, "POST", void 0, target.key);
        verifyPurge(view, target.project.id, this.purgeTaskIds.get(target.project.id));
        if (!this.mounted || this.state.target !== target || epoch !== this.purgeReadEpoch) return;
        this.purgeTaskIds.set(view.projectId, view.purgeId);
        this.rememberPurge(view.projectId);
        this.purgeReadEpoch++;
        this.setState({ target: null, conflict: false, purgeProjectId: view.projectId, purgeProject: target.project, purge: view, purgeReading: false, purgeError: "", notice: "" });
        await this.load();
        return;
      }
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
  rememberPurge(id) {
    try {
      localStorage.setItem(lastPurgeKey, id);
    } catch {
    }
    this.setState({ lastPurgeId: id });
  }
  async openPurge(id, project) {
    const epoch = ++this.purgeReadEpoch;
    this.setState({ target: null, purgeProjectId: id, purgeProject: project?.id === id ? project : null, purge: null, purgeReading: true, purgeError: "", notice: "", error: "" });
    try {
      const view = await api(`/projects/${encodeURIComponent(id)}/purge`);
      verifyPurge(view, id, this.purgeTaskIds.get(id));
      if (!this.mounted || epoch !== this.purgeReadEpoch || this.state.purgeProjectId !== id) return;
      this.purgeTaskIds.set(id, view.purgeId);
      this.rememberPurge(id);
      this.setState({ purge: view });
      if (view.state !== "completed" && !project) {
        const current = await api(`/projects/${encodeURIComponent(id)}/lifecycle`);
        if (current.id !== id || current.status !== "purging") throw Error("\u5F53\u524D\u6E05\u7406\u9879\u76EE\u6458\u8981\u672A\u901A\u8FC7\u6838\u9A8C\uFF0C\u672A\u63D0\u4F9B\u79BB\u7EBF\u547D\u4EE4");
        if (this.mounted && epoch === this.purgeReadEpoch && this.state.purgeProjectId === id) this.setState({ purgeProject: current });
      }
    } catch (error) {
      if (this.mounted && epoch === this.purgeReadEpoch) this.setState({ purgeError: error instanceof ApiError && error.status === 404 ? "\u6B64\u9879\u76EE\u5C1A\u65E0\u53EF\u8BFB\u53D6\u7684\u6E05\u7406\u72B6\u6001\u6216\u56DE\u6267\uFF1B\u53EF\u8FD4\u56DE\u9879\u76EE\u5217\u8868\u3002" : error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.purgeReadEpoch) this.setState({ purgeReading: false });
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
      case "purge":
        return "\u786E\u8BA4\u540E\u9879\u76EE\u8FDB\u5165\u6C38\u4E45\u5220\u9664\u6D41\u7A0B\uFF0C\u4E0D\u80FD\u518D\u8FD8\u539F\u3002\u7269\u7406\u6E05\u7406\u987B\u5728\u5168\u90E8\u6B63\u5E38\u5199\u5165\u8FDB\u7A0B\u9000\u51FA\u3001\u5168\u5C40\u4EFB\u52A1\u4E0E\u672A\u77E5\u72B6\u6001\u5DF2\u6838\u5BF9\u540E\u79BB\u7EBF\u8FD0\u884C\u547D\u4EE4\u3002\u672C\u9875\u9762\u53EA\u767B\u8BB0\u6E05\u7406\u8BF7\u6C42\uFF0C\u4E0D\u81EA\u52A8\u6E05\u7A7A\u6570\u636E\uFF0C\u4E5F\u4E0D\u81EA\u52A8\u505C\u6B62\u6216\u6740\u6B7B\u4EFB\u4F55\u4EFB\u52A1\u3002";
    }
  }
  async copyPurgeCommand() {
    const { purge, purgeProject } = this.state;
    if (!purge || !purgeProject || purgeProject.id !== purge.projectId) return;
    const epoch = this.purgeReadEpoch;
    try {
      await navigator.clipboard.writeText(powershellPurgeCommand(purgeProject, purge));
      if (this.mounted && epoch === this.purgeReadEpoch) this.setState({ notice: "PowerShell \u547D\u4EE4\u5DF2\u590D\u5236\uFF1B\u8BF7\u81EA\u884C\u6838\u5BF9\u5E76\u79BB\u7EBF\u8FD0\u884C\u3002" });
    } catch {
      if (this.mounted && epoch === this.purgeReadEpoch) this.setState({ purgeError: "\u65E0\u6CD5\u81EA\u52A8\u590D\u5236\uFF0C\u8BF7\u4ECE\u4E0B\u65B9\u9009\u4E2D\u547D\u4EE4\u624B\u52A8\u590D\u5236\u3002" });
    }
  }
  purgeView() {
    const { purge, purging, purgeProject, purgeProjectId, purgeReading, purgeError } = this.state;
    const project = purgeProject?.id === purgeProjectId ? purgeProject : purging.find((row) => row.id === purgeProjectId), command = purge && project ? powershellPurgeCommand(project, purge) : "";
    const phases = { waiting_offline: "\u7B49\u5F85\u79BB\u7EBF", planning: "\u6838\u5BF9\u6E05\u7406\u8BA1\u5212", files: "\u6E05\u7406\u5DF2\u786E\u8BA4\u6587\u4EF6", records: "\u6E05\u7406\u9879\u76EE\u8BB0\u5F55", verify: "\u6838\u9A8C\u7ED3\u679C", completed: "\u5B8C\u6210" };
    return /* @__PURE__ */ jsxs("section", { className: "project-purge-status", "aria-label": "\u9879\u76EE\u6C38\u4E45\u5220\u9664\u8FDB\u5EA6", children: [
      /* @__PURE__ */ jsx("h3", { children: project?.name ?? "\u9879\u76EE\u6E05\u7406\u56DE\u6267" }),
      /* @__PURE__ */ jsxs("code", { children: [
        "\u9879\u76EE ID\uFF1A",
        purgeProjectId
      ] }),
      purgeReading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6E05\u7406\u72B6\u6001\u2026" }) : null,
      purgeError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: purgeError }) : null,
      purge ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("p", { role: "status", children: /* @__PURE__ */ jsx("strong", { children: purge.state === "completed" ? "\u6C38\u4E45\u5220\u9664\u5DF2\u5B8C\u6210" : purge.state === "failed" ? "\u6E05\u7406\u5931\u8D25\uFF0C\u672A\u5B8C\u5168\u5220\u9664" : purge.state === "running" ? "\u79BB\u7EBF\u6E05\u7406\u6B63\u5728\u8FDB\u884C" : "\u5F85\u79BB\u7EBF\u6E05\u7406" }) }),
        /* @__PURE__ */ jsxs("dl", { className: "details", children: [
          /* @__PURE__ */ jsx("dt", { children: "\u6E05\u7406\u4EFB\u52A1" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: purge.purgeId }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u9636\u6BB5" }),
          /* @__PURE__ */ jsx("dd", { children: phases[purge.phase] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6587\u4EF6\u8FDB\u5EA6" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            purge.completedPaths,
            " / ",
            purge.totalPaths
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6700\u8FD1\u66F4\u65B0" }),
          /* @__PURE__ */ jsx("dd", { children: date(purge.updatedAt) })
        ] }),
        purge.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: purge.error }) : null,
        purge.state === "completed" ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5DF2\u6536\u5230\u5B9E\u9645\u5B8C\u6210\u56DE\u6267\u3002\u4FDD\u7559\u7684\u5171\u4EAB\u8D44\u6E90\u3001\u51ED\u636E\u3001\u539F\u59CB\u5BFC\u5165\u6587\u4EF6\u3001GitHub\u3001\u5916\u90E8\u8D44\u6E90\u548C\u65E7\u5907\u4EFD\u4E0D\u5C5E\u4E8E\u6B64\u6B21\u9879\u76EE\u6E05\u7406\u8303\u56F4\u3002" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u9879\u76EE\u5DF2\u4E0D\u53EF\u8FD8\u539F\uFF0C\u5C1A\u672A\u5B8C\u5168\u5220\u9664\u3002\u672A\u767B\u8BB0\u5185\u5BB9\u6216\u65E0\u6CD5\u8BC1\u660E\u6240\u6709\u6743\u7684\u6587\u4EF6\u4F1A\u4F7F\u79BB\u7EBF\u6838\u9A8C\u4FDD\u5B88\u62D2\u7EDD\u5E76\u4FDD\u7559\u6570\u636E\uFF1B\u8BF7\u6839\u636E\u9519\u8BEF\u6838\u5BF9\uFF0C\u518D\u663E\u5F0F\u7EED\u6E05\u3002" }),
          /* @__PURE__ */ jsx("p", { children: "\u8BF7\u81EA\u884C\u9000\u51FA\u6240\u6709\u6B63\u5E38\u5199\u5165\u8FDB\u7A0B\u5E76\u6838\u5BF9\u5168\u90E8\u4EFB\u52A1\u4E0E\u672A\u77E5\u72B6\u6001\uFF0C\u7136\u540E\u5728\u9879\u76EE\u4EE3\u7801\u76EE\u5F55\u6253\u5F00 PowerShell \u8FD0\u884C\u3002\u6B64\u9875\u9762\u4E0D\u4F1A\u6267\u884C\u547D\u4EE4\u6216\u505C\u6B62\u8FDB\u7A0B\u3002" }),
          command ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "PowerShell \u79BB\u7EBF\u6E05\u7406\u547D\u4EE4",
              /* @__PURE__ */ jsx("textarea", { "aria-label": "PowerShell \u79BB\u7EBF\u6E05\u7406\u547D\u4EE4", readOnly: true, rows: 4, value: command })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: purgeReading, onClick: () => void this.copyPurgeCommand(), children: "\u590D\u5236 PowerShell \u547D\u4EE4" })
          ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5F53\u524D\u9879\u76EE\u540D\u79F0\u5C1A\u672A\u6838\u9A8C\uFF0C\u5237\u65B0\u72B6\u6001\u540E\u518D\u83B7\u53D6\u547D\u4EE4\u3002" })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: purgeReading, onClick: () => void this.openPurge(purgeProjectId, project), children: "\u5237\u65B0\u6E05\u7406\u72B6\u6001" })
    ] });
  }
  render() {
    const { target, busy, loading, error, notice, conflict, purgeProjectId, confirmName } = this.state;
    return /* @__PURE__ */ jsxs(Modal, { title: target ? titles[target.action] : purgeProjectId ? "\u6C38\u4E45\u5220\u9664\u72B6\u6001" : "\u9879\u76EE\u7BA1\u7406", description: target ? this.description(target) : purgeProjectId ? "\u4ECE\u7BA1\u7406\u72B6\u6001\u6838\u5BF9\u79BB\u7EBF\u6E05\u7406\u8FDB\u5EA6\uFF1B\u5237\u65B0\u4E0D\u4F1A\u542F\u52A8\u6216\u6062\u590D\u6E05\u7406\u3002" : "\u6253\u5F00\u6D3B\u52A8\u6216\u5DF2\u5F52\u6863\u9879\u76EE\uFF0C\u7BA1\u7406\u56DE\u6536\u7AD9\u4E2D\u7684\u4FDD\u7559\u9879\u76EE\u3002", alert: !!target, wide: !target, onClose: this.close, onSubmit: () => void this.confirm(), submitLabel: target ? { archive: "\u786E\u8BA4\u5F52\u6863", unarchive: "\u786E\u8BA4\u53D6\u6D88\u5F52\u6863", trash: "\u786E\u8BA4\u79FB\u5165\u56DE\u6536\u7AD9", restore: "\u786E\u8BA4\u8FD8\u539F", purge: "\u786E\u8BA4\u6C38\u4E45\u5220\u9664" }[target.action] : "", submitDisabled: conflict || target?.action === "purge" && confirmName !== target.project.name, hideSubmit: !target, cancelLabel: target || purgeProjectId ? "\u8FD4\u56DE\u9879\u76EE\u5217\u8868" : "\u5173\u95ED", busy, children: [
      error ? /* @__PURE__ */ jsxs("div", { role: "alert", className: "error-text", children: [
        /* @__PURE__ */ jsx("p", { children: error }),
        target && !conflict ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u7F51\u7EDC\u5931\u8054\u65F6\u518D\u6B21\u786E\u8BA4\u4F1A\u590D\u7528\u540C\u4E00\u8BF7\u6C42\uFF0C\u907F\u514D\u91CD\u590D\u64CD\u4F5C\u3002" }) : null
      ] }) : null,
      notice ? /* @__PURE__ */ jsx("p", { role: "status", children: notice }) : null,
      target ? /* @__PURE__ */ jsxs("div", { className: "project-confirmation", children: [
        /* @__PURE__ */ jsx("strong", { children: target.project.name }),
        /* @__PURE__ */ jsxs("code", { children: [
          target.action === "purge" ? target.project.id : short(target.project.id),
          " \xB7 \u7248\u672C ",
          target.project.version
        ] }),
        target.action === "purge" ? /* @__PURE__ */ jsxs("label", { children: [
          "\u8F93\u5165\u5B8C\u6574\u9879\u76EE\u540D\u79F0\u4EE5\u786E\u8BA4",
          /* @__PURE__ */ jsx("input", { required: true, "aria-label": "\u6C38\u4E45\u5220\u9664\u786E\u8BA4\u9879\u76EE\u540D\u79F0", "aria-describedby": "project-purge-name-help", "aria-invalid": !!confirmName && confirmName !== target.project.name, autoComplete: "off", disabled: busy, value: confirmName, onChange: (event) => this.setState({ confirmName: event.target.value }) }),
          /* @__PURE__ */ jsx("span", { id: "project-purge-name-help", className: "small muted", children: "\u5FC5\u987B\u5B8C\u5168\u4E00\u81F4\uFF0C\u5305\u62EC\u7A7A\u683C\u4E0E\u5927\u5C0F\u5199\u3002\u786E\u8BA4\u540E\u4E0D\u53EF\u8FD8\u539F\u3002" })
        ] }) : null,
        target.action === "trash" ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u8FD8\u539F\u540E\u72B6\u6001\uFF1A",
          target.project.status === "archived" ? "\u5DF2\u5F52\u6863" : "\u6D3B\u52A8"
        ] }) : null,
        conflict ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: busy, onClick: () => void this.reloadTarget(), children: "\u5237\u65B0\u76EE\u6807\u540E\u91CD\u65B0\u786E\u8BA4" }) : null
      ] }) : purgeProjectId ? this.purgeView() : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "project-management-toolbar", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: loading || busy, onClick: () => void this.load(), children: "\u5237\u65B0\u9879\u76EE\u5217\u8868" }),
          this.state.lastPurgeId ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: busy, onClick: () => void this.openPurge(this.state.lastPurgeId), children: "\u67E5\u770B\u4E0A\u6B21\u6E05\u7406\u72B6\u6001" }) : null,
          loading ? /* @__PURE__ */ jsx("span", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" }) : null
        ] }),
        ["active", "archived", "trashed", "purging"].map((status) => /* @__PURE__ */ jsxs("section", { className: "project-management-group", "aria-label": status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : status === "archived" ? "\u5DF2\u5F52\u6863\u9879\u76EE" : status === "purging" ? "\u6B63\u5728\u6C38\u4E45\u5220\u9664" : "\u56DE\u6536\u7AD9", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            status === "active" ? "\u6D3B\u52A8\u9879\u76EE" : status === "archived" ? "\u5DF2\u5F52\u6863\u9879\u76EE" : status === "purging" ? "\u6B63\u5728\u6C38\u4E45\u5220\u9664" : "\u56DE\u6536\u7AD9",
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
            /* @__PURE__ */ jsx("div", { className: "actions", children: status === "purging" ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => void this.openPurge(project.id, summary(project)), children: "\u67E5\u770B\u6E05\u7406\u72B6\u6001" }) : status === "trashed" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: busy, onClick: () => this.choose(project, "restore"), children: "\u8FD8\u539F" }),
              /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled: busy, onClick: () => this.choose(project, "purge"), children: "\u6C38\u4E45\u5220\u9664" })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
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
          !loading && !this.state[status].length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: status === "active" ? "\u6682\u65E0\u6D3B\u52A8\u9879\u76EE\u3002" : status === "archived" ? "\u6682\u65E0\u5DF2\u5F52\u6863\u9879\u76EE\u3002" : status === "purging" ? "\u6682\u65E0\u5F85\u5B8C\u6210\u7684\u6C38\u4E45\u5220\u9664\u3002" : "\u56DE\u6536\u7AD9\u4E3A\u7A7A\u3002" }) : null
        ] }, status))
      ] })
    ] });
  }
}
export {
  ProjectManagement,
  powershellPurgeCommand
};
