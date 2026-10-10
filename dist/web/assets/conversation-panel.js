import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { ExperimentGraph } from "./experiment-graph.js";
import { Icon } from "./ui.js";
import { PANEL_VIEWS, readPanelPreference, savePanelPreference } from "./conversation-panel-layout.js";
function projectFileTree(files) {
  const root = /* @__PURE__ */ new Map();
  for (const file of files) {
    const parts = file.path.split("/");
    if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) continue;
    let children = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      if (!children.has(name)) children.set(name, { name, path: parts.slice(0, i + 1).join("/"), children: /* @__PURE__ */ new Map() });
      const node = children.get(name);
      if (i === parts.length - 1) node.file = file;
      children = node.children;
    }
  }
  return [...root.values()];
}
class ConversationFiles extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { files: [], loaded: false, loading: false, error: "", path: "", content: "", fileLoading: false, fileError: "" };
    this.mounted = false;
  }
  componentDidMount() {
    this.mounted = true;
    if (this.props.active) void this.loadFiles();
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId) {
      this.cancelReads();
      this.setState({ files: [], loaded: false, loading: false, error: "", path: "", content: "", fileLoading: false, fileError: "" }, () => {
        if (this.props.active) void this.loadFiles();
      });
    } else if (previous.active && !this.props.active) {
      this.cancelReads();
      this.setState({ loading: false, fileLoading: false, fileError: this.state.fileLoading ? "\u6587\u4EF6\u8BFB\u53D6\u5DF2\u6682\u505C\uFF0C\u8BF7\u91CD\u8BD5\u3002" : this.state.fileError });
    } else if (!previous.active && this.props.active && !this.state.loaded) void this.loadFiles();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.cancelReads();
  }
  cancelReads() {
    this.listController?.abort();
    this.fileController?.abort();
  }
  async loadFiles() {
    this.listController?.abort();
    const controller = new AbortController(), projectId = this.props.projectId;
    this.listController = controller;
    this.setState({ loading: true, error: "" });
    const current = () => this.mounted && this.props.active && this.props.projectId === projectId && this.listController === controller && !controller.signal.aborted;
    try {
      const files = await api(`/projects/${encodeURIComponent(projectId)}/files`, void 0, "GET", controller.signal);
      if (!Array.isArray(files) || files.some((file) => typeof file.path !== "string" || typeof file.size !== "number")) throw Error("\u9879\u76EE\u76EE\u5F55\u8FD4\u56DE\u4E86\u65E0\u6548\u6E05\u5355");
      if (current()) this.setState({ files, loaded: true, loading: false });
    } catch (error) {
      if (current()) this.setState({ loading: false, error: error instanceof Error ? error.message : "\u9879\u76EE\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25" });
    }
  }
  async openFile(path) {
    if (!this.props.active || !this.state.files.some((file) => file.path === path)) return;
    this.fileController?.abort();
    const controller = new AbortController(), projectId = this.props.projectId;
    this.fileController = controller;
    this.setState({ path, content: "", fileLoading: true, fileError: "" });
    const current = () => this.mounted && this.props.active && this.props.projectId === projectId && this.fileController === controller && !controller.signal.aborted;
    try {
      const file = await api(`/projects/${encodeURIComponent(projectId)}/files?path=${encodeURIComponent(path)}`, void 0, "GET", controller.signal);
      if (typeof file.content !== "string") throw Error("\u6B64\u6587\u4EF6\u4E0D\u80FD\u4EE5\u6587\u672C\u9884\u89C8");
      if (current()) this.setState({ content: file.content, fileLoading: false });
    } catch (error) {
      if (current()) this.setState({ fileLoading: false, fileError: error instanceof Error ? error.message : "\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25" });
    }
  }
  renderNodes(nodes) {
    return nodes.map((node) => node.children.size ? /* @__PURE__ */ jsxs("details", { className: "conversation-directory", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 10 }),
        /* @__PURE__ */ jsx(Icon, { name: "folder", size: 15 }),
        node.name
      ] }),
      /* @__PURE__ */ jsx("div", { children: this.renderNodes([...node.children.values()]) })
    ] }, node.path) : /* @__PURE__ */ jsxs("button", { type: "button", className: "conversation-file" + (this.state.path === node.path ? " is-selected" : ""), "aria-pressed": this.state.path === node.path, title: node.path, onClick: () => void this.openFile(node.path), children: [
      /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 15 }),
      /* @__PURE__ */ jsx("span", { children: node.name })
    ] }, node.path));
  }
  render() {
    const { loading, error, loaded, files, path, content, fileLoading, fileError } = this.state;
    return /* @__PURE__ */ jsxs("div", { className: "conversation-files", children: [
      /* @__PURE__ */ jsxs("div", { className: "conversation-panel-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u9879\u76EE\u5171\u4EAB\u5DE5\u4F5C\u533A" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: this.props.onWorkspace, children: "\u6253\u5F00\u5DE5\u4F5C\u533A" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted conversation-panel-note", children: "\u51C6\u5907\u533A\u6587\u4EF6\uFF1B\u5B9E\u9A8C\u56FA\u5B9A\u6E90\u7801\u8BF7\u4ECE\u8FD0\u884C\u8BE6\u60C5\u8BFB\u53D6\u3002" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "inline-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u76EE\u5F55\u2026" }) : error ? /* @__PURE__ */ jsxs("div", { className: "conversation-panel-error", role: "alert", children: [
        /* @__PURE__ */ jsx("p", { children: error }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => void this.loadFiles(), children: "\u91CD\u8BD5\u76EE\u5F55" })
      ] }) : loaded && !files.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u9879\u76EE\u5171\u4EAB\u5DE5\u4F5C\u533A\u6682\u65E0\u6587\u4EF6\u3002" }) : /* @__PURE__ */ jsx("nav", { className: "conversation-file-tree", "aria-label": "\u9879\u76EE\u5171\u4EAB\u5DE5\u4F5C\u533A\u6587\u4EF6", children: this.renderNodes(projectFileTree(files)) }),
      path ? /* @__PURE__ */ jsxs("section", { className: "conversation-file-preview", children: [
        /* @__PURE__ */ jsx("h3", { children: path }),
        fileLoading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u6587\u4EF6\u2026" }) : fileError ? /* @__PURE__ */ jsxs("div", { role: "alert", children: [
          /* @__PURE__ */ jsx("p", { children: fileError }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => void this.openFile(path), children: "\u91CD\u8BD5\u6587\u4EF6" })
        ] }) : /* @__PURE__ */ jsx("pre", { "aria-label": "\u9879\u76EE\u6587\u4EF6\u53EA\u8BFB\u9884\u89C8", children: content || "\uFF08\u7A7A\u6587\u4EF6\uFF09" })
      ] }) : null,
      /* @__PURE__ */ jsx("p", { className: "small muted conversation-panel-note", children: ".git\u3001\u53EF\u6267\u884C Pi \u914D\u7F6E\u4E0E\u654F\u611F\u914D\u7F6E\u4E0D\u4F5C\u4E3A\u666E\u901A\u5DE5\u4F5C\u533A\u8D44\u6E90\u52A0\u8F7D\u3002" })
    ] });
  }
}
class ConversationPanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { view: readPanelPreference(this.props.projectId).view };
    this.tabs = /* @__PURE__ */ new Map();
    this.select = (view) => {
      this.setState({ view });
      savePanelPreference(this.props.projectId, { view });
    };
    this.showExperiments = () => this.select("experiments");
    this.tabKeyDown = (event, view) => {
      const index = PANEL_VIEWS.findIndex(([id]) => id === view);
      const next = event.key === "ArrowRight" ? (index + 1) % PANEL_VIEWS.length : event.key === "ArrowLeft" ? (index + PANEL_VIEWS.length - 1) % PANEL_VIEWS.length : event.key === "Home" ? 0 : event.key === "End" ? PANEL_VIEWS.length - 1 : null;
      if (next !== null) {
        event.preventDefault();
        const selected = PANEL_VIEWS[next][0];
        this.select(selected);
        this.tabs.get(selected)?.focus();
      }
    };
  }
  render() {
    const { data, projectId, active } = this.props, { view } = this.state;
    return /* @__PURE__ */ jsxs("aside", { id: "conversation-panel", className: "conversation-panel", hidden: !active, "aria-label": "\u4F1A\u8BDD\u53F3\u4FA7\u9762\u677F", children: [
      /* @__PURE__ */ jsx("div", { className: "conversation-panel-tabs", role: "tablist", "aria-label": "\u53F3\u4FA7\u89C6\u56FE", children: PANEL_VIEWS.map(([id, title]) => /* @__PURE__ */ jsx("button", { type: "button", role: "tab", id: "conversation-tab-" + id, ref: (node) => {
        if (node) this.tabs.set(id, node);
        else this.tabs.delete(id);
      }, "aria-selected": view === id, "aria-controls": "conversation-view-" + id, tabIndex: view === id ? 0 : -1, onClick: () => this.select(id), onKeyDown: (event) => this.tabKeyDown(event, id), children: title }, id)) }),
      PANEL_VIEWS.map(([id]) => /* @__PURE__ */ jsx("div", { className: "conversation-panel-view", role: "tabpanel", id: "conversation-view-" + id, "aria-labelledby": "conversation-tab-" + id, hidden: view !== id, tabIndex: 0, children: !projectId ? /* @__PURE__ */ jsxs("div", { className: "inline-empty", children: [
        "\u5148\u9009\u62E9\u9879\u76EE\u3002",
        /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: this.props.onChooseProject, children: "\u9009\u62E9\u6216\u521B\u5EFA\u9879\u76EE" })
      ] }) : !data ? this.props.error ? /* @__PURE__ */ jsxs("div", { className: "conversation-panel-error", role: "alert", children: [
        /* @__PURE__ */ jsx("p", { children: this.props.error }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: this.props.onRetry, children: "\u91CD\u8BD5\u8BFB\u53D6\u9879\u76EE" })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" }) : id === "collaboration" ? this.props.collaboration : id === "experiments" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "conversation-panel-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u9879\u76EE\u5B9E\u9A8C\u6811" }) }),
        /* @__PURE__ */ jsx("p", { className: "small muted conversation-panel-note", children: "\u5728\u7814\u7A76\u5BF9\u8BDD\u4E2D\u63CF\u8FF0\u5B9E\u9A8C\u76EE\u6807\uFF1B\u8FD9\u91CC\u56DE\u67E5\u5DF2\u6709\u5B9E\u9A8C\u4E0E\u8FD0\u884C\u3002" }),
        data.experiments.length ? /* @__PURE__ */ jsx(ExperimentGraph, { data, selected: this.props.selectedExperiment, onSelect: this.props.onExperiment, preserveViewportOnResize: true, headingId: "conversation-experiment-heading" }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u5F53\u524D\u9879\u76EE\u5C1A\u65E0\u5B9E\u9A8C\uFF1B\u5DF2\u6709\u5B9E\u9A8C\u4E0E\u8FD0\u884C\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" }),
        this.props.experimentDetails
      ] }) : /* @__PURE__ */ jsx(ConversationFiles, { projectId, active: active && view === "files", onWorkspace: this.props.onWorkspace }) }, id))
    ] });
  }
}
export {
  ConversationFiles,
  ConversationPanel,
  projectFileTree
};
