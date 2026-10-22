import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Badge } from "./ui.js";
import { short, date } from "./models.js";
import { LiteratureView, EvidenceView, ReportsView } from "./data-views.js";
const titles = { text_grant: "\u786E\u8BA4\u539F\u6587\u68C0\u7D22\u8303\u56F4", claim_decision: "\u786E\u8BA4\u7814\u7A76\u7ED3\u8BBA", report_compose: "\u786E\u8BA4\u62A5\u544A\u6765\u6E90", history: "\u67E5\u770B\u9879\u76EE\u5386\u53F2" };
class ResearchActionCards extends React.Component {
  render() {
    const { data, session } = this.props;
    if (session.role !== "coordinator" || session.taskId) return null;
    const requests = (data.researchActions ?? []).filter((r) => r.sessionId === session.id && r.projectId === data.project.id);
    if (!requests.length) return null;
    const current = requests.filter((r) => r.state === "pending"), history = requests.filter((r) => r.state !== "pending");
    return /* @__PURE__ */ jsxs("section", { className: "chat-workflows", "aria-label": "\u6309\u9700\u7814\u7A76\u64CD\u4F5C", children: [
      current.map((request) => /* @__PURE__ */ jsx(ResearchActionCard, { ...this.props, request }, request.id)),
      history.length ? /* @__PURE__ */ jsxs("details", { className: "workflow-history", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u5DF2\u5904\u7406\u7684\u786E\u8BA4\uFF08",
          history.length,
          "\uFF09"
        ] }),
        history.map((request) => /* @__PURE__ */ jsx(ResearchActionCard, { ...this.props, request }, request.id))
      ] }) : null
    ] });
  }
}
class ResearchActionCard extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { saving: false, error: "", document: void 0, reportId: "", showReport: false };
    this.mounted = true;
    this.sending = false;
  }
  componentWillUnmount() {
    this.mounted = false;
  }
  matches(projectId, sessionId, requestId) {
    return this.mounted && this.props.data.project.id === projectId && this.props.session.id === sessionId && this.props.request.id === requestId;
  }
  async decide(decision) {
    const { data, session, request } = this.props, closing = decision === "reject" || decision === "dismiss";
    if (this.sending || this.props.busy || request.projectId !== data.project.id || request.sessionId !== session.id || data.project.archived || session.state === "archived" || request.state !== "pending" || !closing && request.effectiveState !== "pending") return;
    const projectId = data.project.id, sessionId = session.id, requestId = request.id, expectedVersion = request.version, key = `research-action:${requestId}:${expectedVersion}:${decision}`;
    this.sending = true;
    this.setState({ saving: true, error: "" });
    try {
      await this.props.perform(async () => {
        if (!this.matches(projectId, sessionId, requestId)) return;
        try {
          await api("/operations/research_action_decide", { projectId, sessionId, input: { requestId, expectedVersion, decision } }, "POST", void 0, key);
        } catch (error) {
          if (!this.matches(projectId, sessionId, requestId)) return;
          this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      });
    } finally {
      this.sending = false;
      if (this.matches(projectId, sessionId, requestId)) this.setState({ saving: false });
    }
  }
  historyView() {
    const { data, session, request, perform } = this.props;
    if (request.input.kind !== "history" || request.state !== "pending" || request.reasons.includes("RESEARCH_ACTION_CORRUPTED")) return null;
    const kind = request.input.history.kind, scoped = { ...data, sessions: [session], textCorpusGrants: (data.textCorpusGrants ?? []).filter((g) => g.sessionId === session.id) };
    const onDocument = (document) => {
      if (this.mounted) this.setState({ document });
    };
    if (kind === "documents" || this.state.document) return /* @__PURE__ */ jsx(LiteratureView, { readOnly: true, allowDocumentSelection: true, embedded: true, onUseDocument: this.props.onUseDocument, data: scoped, session, perform, selectedDocument: this.state.document, onDocument });
    if (kind === "reports") return /* @__PURE__ */ jsx(ReportsView, { readOnly: true, embedded: true, data, perform, selectedReport: this.state.reportId || void 0, onSelect: (reportId) => this.setState({ reportId }), onDocument, onSession: this.props.onSession, onCampaign: this.props.onCampaign, onRun: this.props.onRun });
    return /* @__PURE__ */ jsx(EvidenceView, { readOnly: true, embedded: true, data, perform, onDocument, onRegister: () => {
    }, onClaim: () => {
    } });
  }
  render() {
    const { data, session, request } = this.props;
    if (request.projectId !== data.project.id || request.sessionId !== session.id) return null;
    const input = request.input, pending = request.effectiveState === "pending", disabled = this.props.busy || this.state.saving || !!data.project.archived || session.state === "archived";
    const claim = input.kind === "claim_decision" ? data.claims.find((c) => c.id === input.claim.claimId) : void 0, reportRef = request.resultRef && "reportId" in request.resultRef ? request.resultRef.reportId : void 0, grantRef = request.resultRef && "grantId" in request.resultRef ? request.resultRef.grantId : void 0;
    return /* @__PURE__ */ jsxs("details", { className: "workflow-card research-action-card", open: request.state === "pending", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        titles[input.kind],
        /* @__PURE__ */ jsx(Badge, { value: request.effectiveState })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u5F53\u524D\u4F1A\u8BDD\uFF1A",
        session.title,
        " \xB7 \u6709\u6548\u671F\u81F3 ",
        date(request.expiresAt)
      ] }),
      request.reasons.length ? /* @__PURE__ */ jsxs("p", { role: "status", className: "inline-warning", children: [
        "\u8BF7\u6C42\u5DF2\u5931\u6548\uFF1A",
        request.reasons.join("\uFF1B"),
        "\u3002\u539F\u8BB0\u5F55\u4FDD\u7559\uFF0C\u786E\u8BA4\u64CD\u4F5C\u4E0D\u4F1A\u6267\u884C\u3002"
      ] }) : null,
      input.kind === "text_grant" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { children: [
          "\u53EA\u6388\u6743\u4E0B\u9762\u7684\u56FA\u5B9A\u539F\u6587\u5728\u672C\u4F1A\u8BDD\u4E2D\u68C0\u7D22 ",
          input.textGrant.maxSearches,
          " \u6B21\uFF0C\u622A\u6B62 ",
          date(input.textGrant.expiresAt),
          "\u3002"
        ] }),
        /* @__PURE__ */ jsxs("ul", { children: [
          input.textGrant.documents.map((d) => /* @__PURE__ */ jsxs("li", { children: [
            data.documents?.find((row) => row.id === d.documentVersionId)?.title ?? short(d.documentVersionId),
            " \xB7 \u56FA\u5B9A\u89E3\u6790 ",
            short(d.parseResultId)
          ] }, d.documentVersionId + ":" + d.parseResultId)),
          input.textGrant.pmcDocuments?.map((d) => /* @__PURE__ */ jsxs("li", { children: [
            data.documents?.find((row) => row.id === d.documentVersionId)?.title ?? short(d.documentVersionId),
            " \xB7 \u56FA\u5B9A\u5168\u6587"
          ] }, d.documentVersionId))
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4E0D\u6388\u6743\u8054\u7F51\u3001\u539F\u4EF6\u4E0B\u8F7D\u3001\u8BA1\u7B97\u6216\u79D1\u5B66\u7ED3\u8BBA\uFF1B\u5DF2\u6709\u56FA\u5B9A\u6388\u6743\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002" }),
        pending ? /* @__PURE__ */ jsx("button", { type: "button", className: "primary compact", disabled, onClick: () => void this.decide("confirm"), children: "\u786E\u8BA4\u5E76\u542F\u7528\u6B64\u539F\u6587\u8303\u56F4" }) : null,
        grantRef ? /* @__PURE__ */ jsxs("p", { children: [
          "\u5DF2\u4FDD\u5B58\u56FA\u5B9A\u6388\u6743 ",
          short(grantRef),
          "\uFF1B",
          data.textCorpusGrants?.find((g) => g.id === grantRef)?.effectiveState ?? "\u8BF7\u5237\u65B0\u6838\u5BF9\u72B6\u6001",
          "\u3002"
        ] }) : null
      ] }) : null,
      input.kind === "claim_decision" ? /* @__PURE__ */ jsxs("div", { children: [
        claim ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("p", { children: claim.statement }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u9650\u5236\uFF1A",
            claim.limitations.join("\uFF1B") || "\u672A\u586B\u5199",
            " \xB7 \u56FA\u5B9A\u7ED3\u8BBA\u7248\u672C ",
            input.claim.expectedVersion
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u8BC1\u636E\uFF1A",
            claim.evidenceIds.map(short).join("\u3001")
          ] })
        ] }) : /* @__PURE__ */ jsx("p", { role: "status", children: "\u7ED3\u8BBA\u6682\u4E0D\u53EF\u8BFB\uFF0C\u8BF7\u5237\u65B0\uFF1B\u4E0D\u4F1A\u66FF\u6362\u6210\u5176\u4ED6\u7ED3\u8BBA\u3002" }),
        pending && claim ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "primary compact", disabled, onClick: () => void this.decide("accepted"), children: "\u91C7\u7EB3\u6B64\u7ED3\u8BBA" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled, onClick: () => void this.decide("disputed"), children: "\u6807\u4E3A\u4E89\u8BAE" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "text-button danger", disabled, onClick: () => void this.decide("rejected"), children: "\u62D2\u7EDD\u6B64\u7ED3\u8BBA" })
        ] }) : null
      ] }) : null,
      input.kind === "report_compose" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: input.report.title }) }),
        /* @__PURE__ */ jsxs("ul", { children: [
          input.report.runIds.map((id) => /* @__PURE__ */ jsxs("li", { children: [
            "\u6B63\u5F0F\u8FD0\u884C ",
            short(id)
          ] }, "run:" + id)),
          input.report.claimIds.map((id) => /* @__PURE__ */ jsxs("li", { children: [
            "\u5DF2\u91C7\u7EB3\u7ED3\u8BBA ",
            data.claims.find((c) => c.id === id)?.statement ?? short(id)
          ] }, "claim:" + id)),
          input.report.publicationResultIds.map((id) => /* @__PURE__ */ jsxs("li", { children: [
            "\u56FA\u5B9A\u6587\u7A3F\u6784\u5EFA ",
            short(id)
          ] }, "publication:" + id)),
          input.report.campaignIds?.map((id) => /* @__PURE__ */ jsxs("li", { children: [
            "\u56FA\u5B9A\u7814\u7A76\u6D3B\u52A8 ",
            short(id)
          ] }, "campaign:" + id))
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u786E\u8BA4\u65F6\u91CD\u65B0\u6838\u9A8C\u8FD9\u4E9B\u56FA\u5B9A\u6765\u6E90\uFF0C\u672A\u901A\u8FC7\u7684\u6765\u6E90\u4E0D\u4F1A\u66FF\u6362\u6216\u8865\u9020\u3002" }),
        pending ? /* @__PURE__ */ jsx("button", { type: "button", className: "primary compact", disabled, onClick: () => void this.decide("confirm"), children: "\u786E\u8BA4\u5E76\u751F\u6210\u6B64\u56FA\u5B9A\u62A5\u544A" }) : null,
        reportRef ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ showReport: !this.state.showReport }), children: this.state.showReport ? "\u6536\u8D77\u62A5\u544A" : "\u67E5\u770B\u6216\u5BFC\u51FA\u56FA\u5B9A\u62A5\u544A" }),
          this.state.showReport ? /* @__PURE__ */ jsx(ReportsView, { readOnly: true, embedded: true, data, perform: this.props.perform, selectedReport: reportRef, onSession: this.props.onSession, onCampaign: this.props.onCampaign, onRun: this.props.onRun }) : null
        ] }) : null
      ] }) : null,
      input.kind === "history" ? this.historyView() : null,
      request.state === "pending" ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled, onClick: () => void this.decide(input.kind === "claim_decision" || input.kind === "history" ? "dismiss" : "reject"), children: input.kind === "claim_decision" || input.kind === "history" ? "\u5173\u95ED\u8FD9\u5F20\u5361\u7247" : "\u62D2\u7EDD\u6B64\u8BF7\u6C42" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null
    ] });
  }
}
export {
  ResearchActionCard,
  ResearchActionCards
};
