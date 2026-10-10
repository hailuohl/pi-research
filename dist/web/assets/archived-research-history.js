import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { EvidenceView, LiteratureView, ReportsView } from "./data-views.js";
class ArchivedResearchHistory extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { kind: "reports", document: void 0, reportId: "" };
  }
  render() {
    const { data, perform } = this.props;
    return /* @__PURE__ */ jsxs("section", { className: "workflow-card research-action-card", "aria-label": "\u5F52\u6863\u9879\u76EE\u5386\u53F2", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u5F52\u6863\u5386\u53F2 \xB7 \u53EA\u8BFB\u67E5\u770B" }),
      /* @__PURE__ */ jsx("div", { className: "actions wrap", children: [["documents", "\u539F\u6587"], ["evidence", "\u8BC1\u636E\u4E0E\u7ED3\u8BBA"], ["reports", "\u62A5\u544A"]].map(([kind, title]) => /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", "aria-pressed": this.state.kind === kind, onClick: () => this.setState({ kind, document: void 0 }), children: title }, kind)) }),
      this.state.kind === "documents" || this.state.document ? /* @__PURE__ */ jsx(LiteratureView, { readOnly: true, embedded: true, data, perform, selectedDocument: this.state.document, onDocument: (document) => this.setState({ document }) }) : this.state.kind === "reports" ? /* @__PURE__ */ jsx(ReportsView, { readOnly: true, embedded: true, data, perform, selectedReport: this.state.reportId || void 0, onSelect: (reportId) => this.setState({ reportId }), onDocument: (document) => this.setState({ document }) }) : /* @__PURE__ */ jsx(EvidenceView, { readOnly: true, embedded: true, data, perform, onRegister: () => {
      }, onClaim: () => {
      }, onDocument: (document) => this.setState({ document }) })
    ] });
  }
}
export {
  ArchivedResearchHistory
};
