import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon, SectionTitle } from "./ui.js";
import { GitHubSettings } from "./github-controls.js";
import { TemplateLibraryView } from "./template-library-view.js";
import { ModelManagementPanel } from "./model-management-view.js";
import { LiteratureView } from "./literature-view.js";
import { PublicationCompilerConfiguration } from "./research-configuration.js";
import { ModelManagementPanel as ModelManagementPanel2 } from "./model-management-view.js";
class SettingsView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { section: "models" };
  }
  render() {
    return /* @__PURE__ */ jsx("div", { className: "page-scroll settings-page", children: /* @__PURE__ */ jsxs("div", { className: "settings-workspace", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u6A21\u578B\u4E0E\u6A21\u677F", sub: "\u7BA1\u7406\u6A21\u578B\u3001\u8FDE\u63A5\u6D4B\u8BD5\u3001GitHub \u540C\u6B65\u4E0E\u4E2A\u4EBA\u6587\u7A3F\u6A21\u677F\u3002" }),
      /* @__PURE__ */ jsx("nav", { className: "settings-sections", "aria-label": "\u8BBE\u7F6E\u5206\u533A", children: [{ id: "models", title: "\u6A21\u578B\u7BA1\u7406", icon: "cpu" }, { id: "github", title: "GitHub \u72B6\u6001", icon: "branch" }, { id: "templates", title: "\u6587\u7A3F\u6A21\u677F\u5E93", icon: "book-open" }, { id: "sources", title: "\u539F\u6587\u4E0E\u7F16\u8BD1\u914D\u7F6E", icon: "settings" }].map((section) => /* @__PURE__ */ jsxs("button", { type: "button", "aria-pressed": this.state.section === section.id, "aria-controls": `settings-${section.id}`, onClick: () => this.setState({ section: section.id }), children: [
        /* @__PURE__ */ jsx(Icon, { name: section.icon, size: 16 }),
        section.title
      ] }, section.id)) }),
      /* @__PURE__ */ jsx("div", { id: "settings-models", className: "settings-panel", hidden: this.state.section !== "models", children: /* @__PURE__ */ jsx(ModelManagementPanel, { boot: this.props.boot, perform: this.props.perform }) }),
      /* @__PURE__ */ jsx("div", { id: "settings-github", className: "settings-panel", hidden: this.state.section !== "github", children: /* @__PURE__ */ jsx(GitHubSettings, { readOnly: this.props.readOnly, projectId: this.props.projectId }) }),
      /* @__PURE__ */ jsx("div", { id: "settings-templates", className: "settings-panel", hidden: this.state.section !== "templates", children: /* @__PURE__ */ jsx(TemplateLibraryView, {}) }),
      /* @__PURE__ */ jsx("div", { id: "settings-sources", className: "settings-panel", hidden: this.state.section !== "sources", children: this.state.section === "sources" && this.props.data ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(LiteratureView, { embedded: true, setupOnly: true, data: this.props.data, perform: this.props.perform }),
        /* @__PURE__ */ jsx(PublicationCompilerConfiguration, { projectId: this.props.data.project.id, readOnly: this.props.readOnly, perform: this.props.perform })
      ] }) : null })
    ] }) });
  }
}
export {
  ModelManagementPanel2 as ModelManagementPanel,
  SettingsView
};
