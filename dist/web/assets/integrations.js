import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { SectionTitle, Icon } from "./ui.js";
import { SkillManager } from "./skill-manager.js";
import { ComputeConnections } from "./compute-connections.js";
import { ExecutionEnvironments } from "./execution-environments.js";
class IntegrationsView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { activePanel: "skills", connectionsVisited: false };
  }
  panelId(panel) {
    return `integrations-${this.props.projectId}-${panel}`;
  }
  setPanel(panel, focus = false) {
    this.setState({ activePanel: panel, connectionsVisited: this.state.connectionsVisited || panel === "connectors" }, () => {
      if (focus) document.getElementById(this.panelId(panel) + "-tab")?.focus();
    });
  }
  tabKey(e, panel) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      this.setPanel(panel === "skills" ? "connectors" : "skills", true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      this.setPanel(e.key === "Home" ? "skills" : "connectors", true);
    }
  }
  render() {
    const s = this.state;
    return /* @__PURE__ */ jsx("div", { className: "page-scroll integrations-page", children: /* @__PURE__ */ jsxs("div", { className: "integration-workspace", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668", sub: s.activePanel === "skills" ? "\u4E0A\u4F20\u6280\u80FD\u7528\u4E8E\u65B0\u4F1A\u8BDD\u3002" : void 0 }),
      /* @__PURE__ */ jsx("div", { className: "integration-tabs", role: "tablist", "aria-label": "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668\u5206\u7C7B", children: ["skills", "connectors"].map((panel) => /* @__PURE__ */ jsxs("button", { type: "button", role: "tab", id: this.panelId(panel) + "-tab", "aria-controls": this.panelId(panel), "aria-selected": s.activePanel === panel, tabIndex: s.activePanel === panel ? 0 : -1, onClick: () => this.setPanel(panel), onKeyDown: (e) => this.tabKey(e, panel), children: [
        /* @__PURE__ */ jsx(Icon, { name: panel === "skills" ? "skills" : "link" }),
        panel === "skills" ? "\u6280\u80FD" : "\u8FDE\u63A5\u5668"
      ] }, panel)) }),
      /* @__PURE__ */ jsx("section", { className: "integration-panel", id: this.panelId("skills"), role: "tabpanel", "aria-labelledby": this.panelId("skills") + "-tab", hidden: s.activePanel !== "skills", children: /* @__PURE__ */ jsx(SkillManager, { projectId: this.props.projectId, sessionId: this.props.sessionId, refreshToken: this.props.refreshToken, readOnly: this.props.readOnly }, this.props.projectId) }),
      /* @__PURE__ */ jsxs("section", { className: "integration-panel", id: this.panelId("connectors"), role: "tabpanel", "aria-labelledby": this.panelId("connectors") + "-tab", hidden: s.activePanel !== "connectors", children: [
        s.connectionsVisited ? /* @__PURE__ */ jsx(ComputeConnections, { projectId: this.props.projectId, active: s.activePanel === "connectors", refreshToken: this.props.refreshToken, readOnly: this.props.readOnly }, `${this.props.projectId}:connections`) : null,
        s.connectionsVisited ? /* @__PURE__ */ jsx(ExecutionEnvironments, { projectId: this.props.projectId, active: s.activePanel === "connectors", readOnly: this.props.readOnly, localOnly: true }, `${this.props.projectId}:environment`) : null
      ] })
    ] }) });
  }
}
export {
  IntegrationsView
};
