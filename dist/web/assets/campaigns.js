import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ResearchPlanFields, ResearchPlanPanel, readResearchPlan, readPlanCandidates } from "./research-plan.js";
import { api } from "./api.js";
import { short, label, number } from "./models.js";
import { Badge, Empty, Modal, SectionTitle, nativeSelectButton } from "./ui.js";
function WakeupPanel({ data, perform, busy, onSession, sessionId }) {
  const items = data.wakeups.filter((w) => !sessionId || w.rootSessionId === sessionId);
  if (!items.length) return null;
  const historical = (w) => ["completed", "superseded", "cancelled"].includes(w.state) && !w.error;
  const row = (w) => {
    const budget = data.budgets.find((b) => b.campaignId === w.ownerId || b.teamId === w.ownerId);
    return /* @__PURE__ */ jsxs("article", { className: "wakeup-row", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: w.sourceKind === "team" ? "\u534F\u4F5C\u6210\u679C\u7EFC\u5408" : "\u5B9E\u9A8C\u7ED3\u679C\u5206\u6790" }),
        " ",
        /* @__PURE__ */ jsx(Badge, { value: w.state }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          w.automatic ? "\u5DF2\u6388\u6743\u81EA\u52A8\u5206\u6790" : "\u4EC5\u624B\u52A8\u8BF7\u6C42",
          " \xB7 \u5DF2\u5C1D\u8BD5 ",
          w.attempts,
          "/",
          w.maxAttempts,
          " \xB7 ",
          short(w.sourceId)
        ] }),
        w.blockReason || w.error ? /* @__PURE__ */ jsx("p", { className: "notice-inline", role: "status", children: w.blockReason || w.error }) : null,
        budget ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5C1D\u8BD5\u989D\u5EA6\uFF1A\u5DF2\u7528 ",
          budget.used,
          " / \u9884\u7559 ",
          budget.reserved,
          " / \u672A\u77E5 ",
          budget.unknown,
          " / \u53EF\u7528 ",
          budget.available,
          "\uFF1B\u4E0D\u662F\u8D27\u5E01\u8D26\u5355"
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "actions", children: [
        sessionId === w.rootSessionId ? null : /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => onSession(w.rootSessionId), children: "\u67E5\u770B\u4E3B\u4F1A\u8BDD" }),
        w.state === "pending" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy || w.requested, onClick: () => perform(() => api(`/wakeups/${w.id}/request`, {}), "\u8BF7\u6C42\u5DF2\u4FDD\u5B58\uFF1B\u5C31\u7EEA\u540E\u6267\u884C"), children: w.requested ? "\u5DF2\u8BF7\u6C42\u5206\u6790" : "\u8BF7\u6C42\u5206\u6790" }) : null,
        ["pending", "queued", "running"].includes(w.state) ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: data.project.archived || busy, onClick: () => perform(() => api(`/wakeups/${w.id}/cancel`, {}), "\u5DF2\u53D6\u6D88\u6B64\u5206\u6790\uFF0C\u4E0D\u5F71\u54CD\u5B9E\u9A8C"), children: "\u53D6\u6D88\u5206\u6790" }) : null,
        ["failed", "cancelled"].includes(w.state) && w.attempts < w.maxAttempts ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy, onClick: () => {
          if (confirm("\u5C06\u589E\u52A0\u4E00\u6B21\u6A21\u578B\u5C1D\u8BD5\uFF1B\u4E4B\u524D\u672A\u77E5\u7684\u7528\u91CF\u4E0D\u4F1A\u81EA\u52A8\u91CA\u653E\u3002\u7EE7\u7EED\uFF1F")) perform(() => api(`/wakeups/${w.id}/retry`, {}));
        }, children: "\u663E\u5F0F\u91CD\u8BD5" }) : null
      ] })
    ] }, w.id);
  };
  const older = items.filter(historical), current = items.filter((w) => !historical(w));
  return /* @__PURE__ */ jsxs("section", { className: "wakeup-panel", "aria-label": "\u6301\u4E45\u5316\u7ED3\u679C\u901A\u77E5", children: [
    current.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("h2", { children: "\u7ED3\u679C\u5206\u6790" }),
      current.map(row)
    ] }) : null,
    older.length ? /* @__PURE__ */ jsxs("details", { className: "notification-history", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        "\u5DF2\u7ED3\u675F\u7684\u7ED3\u679C\u901A\u77E5\uFF08",
        older.length,
        "\uFF09"
      ] }),
      older.map(row)
    ] }) : null,
    /* @__PURE__ */ jsxs("details", { className: "notification-history", children: [
      /* @__PURE__ */ jsx("summary", { children: "\u5206\u6790\u8C03\u7528\u8BF4\u660E" }),
      /* @__PURE__ */ jsx("p", { className: "muted small", children: "\u901A\u77E5\u5DF2\u4FDD\u5B58\u5230\u6570\u636E\u5E93\u3002\u4EC5\u5728\u6388\u6743\u3001\u989D\u5EA6\u548C Pi \u914D\u7F6E\u5747\u6709\u6548\u65F6\u8C03\u7528\u6A21\u578B\uFF1B\u6682\u505C\u6216\u53D6\u6D88\u8FD9\u91CC\u7684\u5206\u6790\u4E0D\u4F1A\u53D6\u6D88 Run\u3002" })
    ] })
  ] });
}
class CampaignView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: "", create: false, decision: false, action: "refill" };
  }
  choose() {
    const id = this.props.selectedCampaign ?? this.state.selected;
    return id ? this.props.data.campaigns.find((c) => c.id === id) : this.props.data.campaigns[0];
  }
  approve(id) {
    const a = this.props.data.approvals.find((a2) => a2.id === id);
    if (!a) throw new Error("\u6279\u51C6\u8BB0\u5F55\u4E0D\u5B58\u5728\uFF0C\u8BF7\u5237\u65B0");
    return api(`/approvals/${id}/decide`, { expectedVersion: a.version, approved: true });
  }
  createModal() {
    const { data, busy, perform } = this.props;
    return /* @__PURE__ */ jsxs(Modal, { title: "\u5EFA\u7ACB\u6301\u7EED\u7814\u7A76\u6D3B\u52A8", wide: true, busy, onClose: () => this.setState({ create: false }), submitLabel: "\u4FDD\u5B58\u6D3B\u52A8\u8349\u6848", onSubmit: (fd) => perform(async () => {
      const c = await api("/campaigns", { projectId: data.project.id, goal: fd.get("goal"), rootSessionId: fd.get("session"), baselineExperimentId: fd.get("baseline"), primaryMetric: fd.get("metric") || void 0, autoAnalyze: fd.get("automatic") === "on", limits: { maxRounds: Number(fd.get("rounds")), maxAnalysisAttempts: Number(fd.get("attempts")) } });
      this.setState({ create: false, selected: c.id });
      this.props.onSelect?.(c.id);
    }), children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7814\u7A76\u76EE\u6807",
        /* @__PURE__ */ jsx("textarea", { name: "goal", required: true, rows: 3, maxLength: 8e3 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u4E3B\u534F\u8C03\u4F1A\u8BDD",
        /* @__PURE__ */ jsxs("select", { name: "session", required: true, children: [
          nativeSelectButton,
          data.sessions.filter((s) => s.role === "coordinator" && s.state !== "archived").map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.title }, s.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u57FA\u7EBF\u5B9E\u9A8C",
        /* @__PURE__ */ jsxs("select", { name: "baseline", required: true, children: [
          nativeSelectButton,
          data.experiments.filter((e) => e.lifecycle !== "archived").map((e) => /* @__PURE__ */ jsx("option", { value: e.id, children: e.title }, e.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u4E3B\u6307\u6807\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { name: "metric", placeholder: "\u7559\u7A7A\u4F7F\u7528\u5951\u7EA6\u7B2C\u4E00\u9879\u6307\u6807", maxLength: 80 })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6700\u591A\u8F6E\u6B21",
          /* @__PURE__ */ jsx("input", { name: "rounds", type: "number", min: 1, max: 20, defaultValue: 4, required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6A21\u578B\u5206\u6790\u5C1D\u8BD5\u989D\u5EA6",
          /* @__PURE__ */ jsx("input", { name: "attempts", type: "number", min: 0, max: 100, defaultValue: 12, required: true })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", name: "automatic" }),
        "\u7ED3\u679C\u5230\u8FBE\u540E\u81EA\u52A8\u5524\u9192\u4E3B Pi\uFF08\u53EF\u80FD\u4EA7\u751F\u6A21\u578B\u8D39\u7528\uFF09"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6D3B\u52A8\u8349\u6848\u9700\u8981\u6279\u51C6\u540E\u542F\u52A8\u3002\u5BA1\u6279\u7ED1\u5B9A\u5F53\u524D\u4E3B\u4F1A\u8BDD\u6A21\u578B\uFF1B\u6B63\u5F0F\u8BA1\u7B97\u548C\u6BCF\u4E2A\u7814\u7A76\u51B3\u5B9A\u4ECD\u9700\u5355\u72EC\u6279\u51C6\u3002\u5173\u95ED\u81EA\u52A8\u5206\u6790\u65F6\uFF0C\u4E5F\u53EF\u624B\u52A8\u4F7F\u7528\u6240\u6709\u72B6\u6001\u4E0E\u51B3\u7B56\u529F\u80FD\u3002" })
    ] });
  }
  decisionModal(c) {
    const { data, busy, perform } = this.props;
    const observations = data.observations.filter((o) => o.campaignId === c.id && o.roundId === c.currentRoundId);
    return /* @__PURE__ */ jsxs(Modal, { title: "\u63D0\u4EA4\u6709\u8BC1\u636E\u7684\u7814\u7A76\u51B3\u5B9A", wide: true, busy, onClose: () => this.setState({ decision: false }), submitLabel: "\u4FDD\u5B58\u51B3\u5B9A\u63D0\u6848", onSubmit: (fd) => perform(async () => {
      const action = String(fd.get("action"));
      await api(`/campaigns/${c.id}/decisions`, { expectedVersion: c.version, action, reason: fd.get("reason"), observationIds: fd.getAll("observations"), ...action === "promote" ? { selectedRunId: fd.get("selectedRun") } : {}, candidates: action === "stop" ? [] : readPlanCandidates(fd), ...action === "stop" ? {} : { experimentPlan: readResearchPlan(fd, c.primaryMetric) } });
      this.setState({ decision: false });
    }, "\u51B3\u5B9A\u5DF2\u4FDD\u5B58\uFF0C\u5C1A\u672A\u5E94\u7528"), children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u51B3\u5B9A\u7C7B\u578B",
        /* @__PURE__ */ jsxs("select", { name: "action", value: this.state.action, onChange: (e) => this.setState({ action: e.target.value }), children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "repair", children: "Repair \xB7 \u65E0\u7ED3\u679C\u5019\u9009\u7684\u53D7\u5BA1\u4FEE\u590D" }),
          /* @__PURE__ */ jsx("option", { value: "refill", children: "Refill \xB7 \u540C\u4E00\u7236\u8282\u70B9\u8865\u5145\u5019\u9009" }),
          /* @__PURE__ */ jsx("option", { value: "promote", children: "Promote \xB7 \u4FDD\u7559\u7ED3\u679C\u5E76\u521B\u5EFA\u4E0B\u4E00\u8F6E" }),
          /* @__PURE__ */ jsx("option", { value: "stop", children: "Stop \xB7 \u7ED3\u675F\u5F53\u524D\u7814\u7A76" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { className: "observation-choices", children: [
        /* @__PURE__ */ jsx("legend", { children: "\u5F15\u7528\u5B9E\u9645\u89C2\u6D4B\uFF08\u81F3\u5C11\u4E00\u9879\uFF09" }),
        observations.map((o) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", name: "observations", value: o.id, defaultChecked: o.status === "pending" }),
          data.experiments.find((e) => e.id === o.experimentId)?.title ?? short(o.runId),
          " \xB7 ",
          label(o.validation),
          " \xB7 ",
          label(o.status)
        ] }, o.id))
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7406\u7531\u3001\u8BC1\u636E\u53CA\u9650\u5236",
        /* @__PURE__ */ jsx("textarea", { name: "reason", required: true, maxLength: 8e3, rows: 3 })
      ] }),
      this.state.action === "promote" ? /* @__PURE__ */ jsxs("label", { children: [
        "\u4F5C\u4E3A\u4E0B\u4E00\u8F6E\u7236\u8282\u70B9\u7684\u5DF2\u6D4B\u91CF Run",
        /* @__PURE__ */ jsxs("select", { name: "selectedRun", required: true, children: [
          nativeSelectButton,
          observations.filter((o) => o.validation === "verified").map((o) => /* @__PURE__ */ jsxs("option", { value: o.runId, children: [
            data.experiments.find((e) => e.id === o.experimentId)?.title,
            " \xB7 ",
            c.primaryMetric,
            "=",
            number(o.metrics[c.primaryMetric])
          ] }, o.id))
        ] })
      ] }) : null,
      this.state.action !== "stop" ? /* @__PURE__ */ jsx(ResearchPlanFields, { data, campaign: c, repair: this.state.action === "repair" }, this.state.action) : null,
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5FC5\u9700\u5019\u9009\u5C1A\u672A\u5B8C\u6210\u65F6\uFF0C\u670D\u52A1\u7AEF\u62D2\u7EDD Promote\u3002Repair \u4EC5\u7528\u4E8E\u5DF2\u8BA4\u5B9A\u65E0\u7ED3\u679C\u7684\u5931\u8D25\uFF0C\u5E76\u4FDD\u7559\u539F Run\u3002\u6279\u51C6\u65B9\u6848\u53EA\u51C6\u5907\u5019\u9009\uFF1B\u6D4B\u8BD5\u3001\u5BA1\u67E5\u3001\u6574\u5408\u548C\u6B63\u5F0F Run \u4ECD\u5355\u72EC\u6279\u51C6\u3002" })
    ] });
  }
  decisionCard(d) {
    const { data, perform, busy } = this.props;
    const a = data.approvals.find((a2) => a2.id === d.approvalId);
    return /* @__PURE__ */ jsxs("article", { className: "decision-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "actions", children: [
        /* @__PURE__ */ jsxs("strong", { children: [
          d.action.toUpperCase(),
          " \xB7 ",
          label(d.action)
        ] }),
        /* @__PURE__ */ jsx(Badge, { value: d.status }),
        a ? /* @__PURE__ */ jsx(Badge, { value: a.status }) : null
      ] }),
      /* @__PURE__ */ jsx("p", { className: "prose-text", children: d.reason }),
      d.planRevisionId ? /* @__PURE__ */ jsxs("p", { children: [
        "\u56FA\u5B9A\u65B9\u6848 ",
        short(d.planRevisionId),
        " \xB7 ",
        short(d.planDigest)
      ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5386\u53F2\u517C\u5BB9\u51B3\u5B9A\uFF1A\u672A\u7ED1\u5B9A\u56FA\u5B9A\u7814\u7A76\u65B9\u6848" }),
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u5F15\u7528 ",
        d.observationIds.length,
        " \u9879\u89C2\u6D4B \xB7 \u65B0\u5019\u9009 ",
        d.candidates.length,
        " \u4E2A \xB7 ",
        short(d.decisionDigest)
      ] }),
      d.candidates.length ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u5019\u9009\u914D\u7F6E\u548C\u4FEE\u6539\u8303\u56F4" }),
        /* @__PURE__ */ jsx("pre", { children: JSON.stringify(d.candidates, null, 2) })
      ] }) : null,
      d.status === "proposed" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
        a?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy, onClick: () => perform(() => this.approve(a.id), "\u5DF2\u6279\u51C6\u6B64\u7248\u672C\uFF0C\u5C1A\u672A\u5E94\u7528"), children: "\u6279\u51C6\u6B64\u51B3\u5B9A" }) : null,
        /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: data.project.archived || busy || a?.status !== "approved", onClick: () => perform(() => api(`/campaign-decisions/${d.id}/apply`, { expectedVersion: d.version }), "\u51B3\u5B9A\u5DF2\u5E94\u7528\uFF1B\u65B0\u7684\u6B63\u5F0F Run \u4ECD\u987B\u5355\u72EC\u6279\u51C6"), children: "\u5E94\u7528\u5DF2\u6279\u51C6\u51B3\u5B9A" })
      ] }) : null
    ] }, d.id);
  }
  render() {
    const { data, perform, busy, onExperiment, onSession } = this.props, c = this.choose();
    const members = data.members.filter((m) => m.campaignId === c?.id), obs = data.observations.filter((o) => o.campaignId === c?.id);
    const approval = data.approvals.find((a) => a.id === c?.approvalId);
    const budget = data.budgets.find((b) => b.campaignId === c?.id);
    const available = c ? data.intents.filter((i) => !members.some((m) => m.intentId === i.id) && data.experiments.some((e) => e.id === i.experimentId && e.contractDigest === c.contractDigest && (e.id === c.focusExperimentId || e.parentId === c.focusExperimentId))) : [];
    return /* @__PURE__ */ jsxs("div", { className: "campaign-page", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u7814\u7A76\u6D3B\u52A8", sub: "\u6301\u4E45\u5316\u8F6E\u6B21\u3001\u771F\u5B9E\u89C2\u6D4B\u548C\u6709\u754C\u51B3\u7B56\uFF1B\u4E0D\u662F\u65E0\u9650\u8FD0\u884C\u7684\u804A\u5929\u3002", children: /* @__PURE__ */ jsx("button", { className: "primary", disabled: data.project.archived || busy || !data.experiments.length || !data.sessions.some((s) => s.role === "coordinator" && s.state !== "archived"), onClick: () => this.setState({ create: true }), children: "\u65B0\u5EFA\u7814\u7A76\u6D3B\u52A8" }) }),
      !c ? /* @__PURE__ */ jsx(Empty, { title: data.campaigns.length ? "\u6307\u5B9A\u7814\u7A76\u6D3B\u52A8\u4E0D\u53EF\u7528" : "\u5C1A\u672A\u5EFA\u7ACB\u7814\u7A76\u6D3B\u52A8", children: data.campaigns.length ? /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => {
        this.setState({ selected: data.campaigns[0].id });
        this.props.onSelect?.(data.campaigns[0].id);
      }, children: "\u660E\u786E\u9009\u62E9\u53EF\u7528\u6D3B\u52A8" }) : "\u5148\u521B\u5EFA\u4E3B\u4F1A\u8BDD\u4E0E\u57FA\u7EBF\u5B9E\u9A8C\uFF0C\u518D\u5EFA\u7ACB\u6D3B\u52A8\u3002\u6B63\u5F0F\u8BA1\u7B97\u59CB\u7EC8\u5355\u72EC\u6279\u51C6\u3002" }) : /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "campaign-picker", children: [
          "\u5F53\u524D\u6D3B\u52A8",
          /* @__PURE__ */ jsxs("select", { value: c.id, onChange: (e) => {
            this.setState({ selected: e.target.value, decision: false });
            this.props.onSelect?.(e.target.value);
          }, children: [
            nativeSelectButton,
            data.campaigns.map((item) => /* @__PURE__ */ jsx("option", { value: item.id, children: item.goal.slice(0, 80) }, item.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "campaign-overview", children: [
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx(Badge, { value: c.state }),
            /* @__PURE__ */ jsxs("span", { children: [
              "\u7B2C ",
              c.roundNumber,
              "/",
              c.limits.maxRounds,
              " \u8F6E"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "\u6307\u6807\uFF1A",
              c.primaryMetric,
              " \xB7 ",
              c.direction === "min" ? "\u8D8A\u5C0F\u8D8A\u597D" : "\u8D8A\u5927\u8D8A\u597D"
            ] })
          ] }),
          /* @__PURE__ */ jsx("h2", { children: c.goal }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            c.autoAnalyze ? "\u7ED3\u679C\u5230\u8FBE\u540E\u53EF\u81EA\u52A8\u5206\u6790" : "\u5206\u6790\u4EC5\u5728\u624B\u52A8\u8BF7\u6C42\u540E\u6267\u884C",
            " \xB7 \u51B3\u5B9A\u4E0E\u5019\u9009\u8FD0\u884C\u5747\u9700\u5355\u72EC\u6279\u51C6 \xB7 \u6D3B\u52A8\u7248\u672C ",
            c.version,
            " \xB7 \u5DF2\u6279\u51C6\u6A21\u578B ",
            c.rootModel?.provider || "\u672A\u914D\u7F6E",
            "/",
            c.rootModel?.model || "\u672A\u914D\u7F6E"
          ] }),
          budget ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u6A21\u578B\u5C1D\u8BD5\u989D\u5EA6 ",
            budget.used,
            " \u5DF2\u7528 / ",
            budget.reserved,
            " \u9884\u7559 / ",
            budget.unknown,
            " \u672A\u77E5 / ",
            budget.available,
            " \u53EF\u7528\uFF08\u975E\u8D39\u7528\u4E0A\u9650\uFF09"
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => onSession(c.rootSessionId), children: "\u6253\u5F00\u4E3B\u534F\u8C03\u4F1A\u8BDD" }),
            /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => onExperiment(c.focusExperimentId), children: "\u5F53\u524D\u7236\u5B9E\u9A8C" }),
            c.state === "draft" ? /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: data.project.archived || busy || !approval || ["rejected", "stale"].includes(approval.status), onClick: () => perform(async () => {
              if (approval?.status === "pending") await this.approve(approval.id);
              return api(`/campaigns/${c.id}/activate`, { expectedVersion: c.version });
            }, "\u6D3B\u52A8\u5DF2\u542F\u52A8\uFF0C\u5C1A\u672A\u6388\u6743\u4EFB\u4F55\u6B63\u5F0F\u8BA1\u7B97"), children: "\u6279\u51C6\u5E76\u542F\u52A8\u6D3B\u52A8" }) : null,
            c.state === "active" ? /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy, onClick: () => perform(() => api(`/campaigns/${c.id}/pause`, { expectedVersion: c.version })), children: "\u6682\u505C\u6D3B\u52A8" }),
              /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: data.project.archived || busy || !obs.some((o) => o.roundId === c.currentRoundId && o.status === "pending"), onClick: () => this.setState({ decision: true }), children: "\u63D0\u4EA4\u51B3\u5B9A" })
            ] }) : null,
            c.state === "paused" ? /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: data.project.archived || busy, onClick: () => perform(() => api(`/campaigns/${c.id}/resume`, { expectedVersion: c.version })), children: "\u6062\u590D\u6D3B\u52A8" }) : null,
            c.state !== "stopped" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: data.project.archived || busy, onClick: () => {
              if (confirm("\u505C\u6B62\u65B0\u589E\u7814\u7A76\u51B3\u7B56\u548C\u81EA\u52A8\u5206\u6790\uFF1F\u5DF2\u6709\u6B63\u5F0F Run \u7EE7\u7EED\u8FD0\u884C\uFF0C\u7ED3\u679C\u4ECD\u4F1A\u4FDD\u7559\u3002")) perform(() => api(`/campaigns/${c.id}/stop`, { expectedVersion: c.version, reason: "\u7528\u6237\u5728\u5DE5\u4F5C\u53F0\u505C\u6B62\u6D3B\u52A8" }));
            }, children: "\u505C\u6B62\u6D3B\u52A8" }) : null
          ] }),
          c.stopReason ? /* @__PURE__ */ jsxs("p", { className: "notice-inline", children: [
            "\u505C\u6B62\u539F\u56E0\uFF1A",
            c.stopReason
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("section", { className: "campaign-section", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u8F6E\u6B21\u4E0E\u5019\u9009" }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u7814\u7A76\u8F6E\u6B21\u4E0D\u662F\u534F\u4F5C\u4EFB\u52A1\u56FE\u3002\u6BCF\u4E2A\u5019\u9009\u4FDD\u7559\u81EA\u5DF1\u7684\u5B9E\u9A8C\u8840\u7F18\u548C\u4E0D\u53EF\u53D8\u8FD0\u884C\u5FEB\u7167\u3002" }),
          data.rounds.filter((r) => r.campaignId === c.id).map((round) => /* @__PURE__ */ jsxs("div", { className: "round-group", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              "\u7B2C ",
              round.number,
              " \u8F6E ",
              /* @__PURE__ */ jsx(Badge, { value: round.state }),
              /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => onExperiment(round.parentExperimentId), children: [
                "\u7236\u5B9E\u9A8C ",
                short(round.parentExperimentId)
              ] })
            ] }),
            members.filter((m) => m.roundId === round.id).length ? /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { children: "\u5019\u9009\u5B9E\u9A8C" }),
                /* @__PURE__ */ jsx("th", { children: "\u5B9E\u9645 Run" }),
                /* @__PURE__ */ jsx("th", { children: "\u89C2\u6D4B\u4E0E\u6307\u6807" }),
                /* @__PURE__ */ jsx("th", { children: "\u64CD\u4F5C" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { children: members.filter((m) => m.roundId === round.id).map((m) => {
                const i = data.intents.find((i2) => i2.id === m.intentId), r = data.runs.find((r2) => r2.id === i?.runId), o = obs.find((o2) => o2.runId === r?.id), a = data.approvals.find((a2) => a2.id === i?.approvalId);
                return /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsxs("td", { children: [
                    /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => onExperiment(m.experimentId), children: data.experiments.find((e) => e.id === m.experimentId)?.title ?? short(m.experimentId) }),
                    /* @__PURE__ */ jsx("div", { className: "small muted", children: m.required ? "\u5FC5\u9700\u5019\u9009" : "\u53EF\u9009\u5019\u9009" })
                  ] }),
                  /* @__PURE__ */ jsx("td", { children: r ? /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(Badge, { value: r.state }),
                    /* @__PURE__ */ jsx("div", { className: "small muted", children: short(r.id) })
                  ] }) : /* @__PURE__ */ jsx("span", { children: "\u5C1A\u672A\u63D0\u4EA4" }) }),
                  /* @__PURE__ */ jsx("td", { children: o ? /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx(Badge, { value: o.validation }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      c.primaryMetric,
                      " = ",
                      number(o.metrics[c.primaryMetric])
                    ] }),
                    /* @__PURE__ */ jsxs("details", { children: [
                      /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u8BC1\u636E\u4E0E\u9650\u5236" }),
                      /* @__PURE__ */ jsx("p", { children: o.explanation }),
                      /* @__PURE__ */ jsx("pre", { children: JSON.stringify({ observationId: o.id, evidenceIds: o.evidenceIds, metrics: o.metrics }, null, 2) })
                    ] })
                  ] }) : /* @__PURE__ */ jsx("span", { className: "muted", children: "\u7B49\u5F85\u771F\u5B9E\u7ED3\u679C" }) }),
                  /* @__PURE__ */ jsx("td", { children: !r && i ? /* @__PURE__ */ jsxs("div", { children: [
                    a?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy, onClick: () => perform(() => this.approve(a.id)), children: "\u5355\u72EC\u6279\u51C6\u6B64\u8FD0\u884C" }) : null,
                    /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived || busy || a?.status !== "approved", onClick: () => perform(() => api(`/run-intents/${i.id}/submit`, {}), "\u6B63\u5F0F Run \u5DF2\u63D0\u4EA4"), children: "\u63D0\u4EA4\u5DF2\u6279\u51C6\u8FD0\u884C" })
                  ] }) : /* @__PURE__ */ jsx("button", { className: "text-button", disabled: !!r && !this.props.onRun, onClick: () => {
                    if (r) this.props.onRun?.(r.id, m.experimentId);
                    else onExperiment(m.experimentId);
                  }, children: "\u65E5\u5FD7\u4E0E\u5FEB\u7167" }) })
                ] }, m.id);
              }) })
            ] }) }) : /* @__PURE__ */ jsx("p", { className: "muted", children: "\u8FD9\u4E00\u8F6E\u5C1A\u672A\u767B\u8BB0\u5019\u9009\u3002" })
          ] }, round.id)),
          c.state === "active" ? /* @__PURE__ */ jsxs("form", { className: "enroll-form", onSubmit: (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            perform(() => api(`/campaigns/${c.id}/members`, { expectedVersion: c.version, intentId: fd.get("intent"), ...fd.get("repair") ? { repairDecisionId: fd.get("repair") } : {} }), "\u5DF2\u767B\u8BB0\u5019\u9009\uFF0C\u672A\u542F\u52A8\u8FD0\u884C");
          }, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u767B\u8BB0\u5DF2\u51C6\u5907\u7684\u56FA\u5B9A RunIntent",
              /* @__PURE__ */ jsxs("select", { name: "intent", required: true, disabled: !available.length, children: [
                nativeSelectButton,
                available.map((i) => /* @__PURE__ */ jsxs("option", { value: i.id, children: [
                  data.experiments.find((e) => e.id === i.experimentId)?.title,
                  " \xB7 ",
                  short(i.id)
                ] }, i.id))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u4FEE\u590D\u6279\u51C6\uFF08\u9996\u6B21\u767B\u8BB0\u7559\u7A7A\uFF09",
              /* @__PURE__ */ jsxs("select", { name: "repair", children: [
                nativeSelectButton,
                /* @__PURE__ */ jsx("option", { value: "", children: "\u4E0D\u4F7F\u7528\u4FEE\u590D\u6279\u51C6" }),
                data.decisions.filter((d) => d.campaignId === c.id && d.roundId === c.currentRoundId && d.action === "repair" && d.status === "applied" && !members.some((m) => m.repairDecisionId === d.id)).map((d) => /* @__PURE__ */ jsxs("option", { value: d.id, children: [
                  short(d.id),
                  " \xB7 ",
                  d.reason.slice(0, 55)
                ] }, d.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: data.project.archived || busy || !available.length, children: "\u767B\u8BB0\u672C\u8F6E\u5019\u9009" })
          ] }) : null,
          c.state === "active" && !available.length ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6CA1\u6709\u53EF\u767B\u8BB0\u7684\u8FD0\u884C\u6E05\u5355\u3002\u8BF7\u5230\u300C\u5B9E\u9A8C\u4E0E\u8FD0\u884C\u300D\u9009\u62E9\u5F53\u524D\u7236\u5B9E\u9A8C\u6216\u5176\u5B50\u5B9E\u9A8C\uFF0C\u5148\u51C6\u5907\u4E0D\u53EF\u53D8\u5FEB\u7167\u3002\u65E0\u7ED3\u679C\u8282\u70B9\u91CD\u65B0\u767B\u8BB0\u65F6\uFF0C\u9700\u9009\u62E9\u672C\u8F6E\u5DF2\u5E94\u7528\u7684 Repair \u51B3\u5B9A\u3002" }) : null
        ] }),
        /* @__PURE__ */ jsx(ResearchPlanPanel, { data, campaign: c, busy, perform, onExperiment, onImplementation: this.props.onImplementation, onRun: this.props.onRun }, c.id),
        /* @__PURE__ */ jsxs("section", { className: "campaign-section", children: [
          /* @__PURE__ */ jsx("h2", { children: "\u51B3\u7B56\u5386\u53F2" }),
          data.decisions.filter((d) => d.campaignId === c.id).map((d) => this.decisionCard(d)),
          !data.decisions.some((d) => d.campaignId === c.id) ? /* @__PURE__ */ jsx("p", { className: "muted", children: "\u6682\u65E0\u51B3\u5B9A\u3002\u6536\u5230\u771F\u5B9E\u89C2\u6D4B\u540E\uFF0C\u53EF\u7531 Pi \u63D0\u6848\u6216\u4EBA\u5DE5\u63D0\u4EA4\uFF1B\u51B3\u5B9A\u4E0D\u4F1A\u81EA\u52A8\u6267\u884C\u3002" }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx(WakeupPanel, { data, busy, perform, onSession }),
      this.state.create ? this.createModal() : null,
      this.state.decision && c ? this.decisionModal(c) : null
    ] });
  }
}
export {
  CampaignView,
  WakeupPanel
};
