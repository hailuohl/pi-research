import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Badge } from "./ui.js";
import { short, label, number } from "./models.js";
import { DevelopmentJob } from "./implementation.js";
import { ResearchPlanPanel } from "./research-plan.js";
import { WorkingGrants } from "./working-grants.js";
import { runGrantUsable } from "./run-grants.js";
import { PublicationDialogue } from "./publication-dialogue.js";
function proposalSession(data, proposal) {
  return proposal.rootSessionId || (data.reviews ?? []).find((r) => r.id === proposal.reviewId)?.producerSessionId || (data.sandboxJobs ?? []).find((j) => j.id === proposal.testJobId)?.sessionId;
}
class ChatWorkflows extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { previews: {}, runIntentRevision: 0 };
    this.mounted = true;
    this.readEpoch = 0;
    this.messageKeys = /* @__PURE__ */ new Map();
    this.approvedRunIntents = /* @__PURE__ */ new Set();
    this.queuedRunIntents = /* @__PURE__ */ new Set();
  }
  componentWillUnmount() {
    this.mounted = false;
    this.readEpoch++;
  }
  call(name, input = {}) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, sessionId: this.props.session.id, input });
  }
  decide(approval, approved) {
    return api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved });
  }
  async approved(approval) {
    if (!approval || !["pending", "approved"].includes(approval.status)) throw Error("\u6B64\u56FA\u5B9A\u4E8B\u9879\u5C1A\u672A\u53D6\u5F97\u6709\u6548\u6279\u51C6");
    if (approval.status === "pending") await this.decide(approval, true);
  }
  dialogueMatches(projectId, sessionId) {
    const { data, session } = this.props;
    return this.mounted && !data.project.archived && data.project.id === projectId && session.id === sessionId && session.role === "coordinator" && !session.taskId && session.state !== "archived";
  }
  async continueResearchBrief() {
    const { data, session } = this.props, view = data.researchBrief, brief = view?.brief;
    if (!brief || view?.latestId !== brief.id || brief.rootSessionId !== session.id) throw Error("\u7814\u7A76\u8BA1\u5212\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5BF9\u8BDD\u7684\u6700\u65B0\u4FEE\u8BA2");
    const projectId = data.project.id, sessionId = session.id, id = brief.id, digest = brief.digest;
    const matches = () => this.dialogueMatches(projectId, sessionId) && this.props.data.researchBrief?.latestId === id && this.props.data.researchBrief?.brief?.digest === digest;
    if (!matches() || view.evidenceChecks.some((e) => !e.current)) throw Error("\u7814\u7A76\u8BA1\u5212\u6216\u8BC1\u636E\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5148\u5237\u65B0\u6838\u5BF9");
    if (brief.status === "ready") await this.call("research_brief_confirm", { briefId: id, expectedVersion: brief.version });
    else if (brief.status !== "confirmed") throw Error("\u8BF7\u5148\u5728\u5BF9\u8BDD\u4E2D\u8865\u9F50\u7814\u7A76\u95EE\u9898\u4E0E\u8BA1\u5212");
    if (!matches()) throw Error("\u5DF2\u786E\u8BA4\u8BA1\u5212\uFF0C\u5F53\u524D\u5BF9\u8BDD\u5DF2\u5207\u6362\uFF1B\u8BF7\u56DE\u539F\u4F1A\u8BDD\u7EE7\u7EED");
    await api(`/sessions/${sessionId}/messages`, { content: `\u7814\u7A76\u95EE\u9898\u4E0E\u8BA1\u5212\u5DF2\u7531\u7528\u6237\u786E\u8BA4\u3002\u5148\u8C03\u7528research_brief_inspect({briefId:"${id}"})\u6838\u5BF9latestId\u4ECD\u4E3A\u8BE5ID\u3001digest\u4E3A"${digest}"\u3001status\u4E3Aconfirmed\u4E14\u6765\u6E90\u5F53\u524D\u6709\u6548\uFF0C\u518D\u6309\u6B65\u9AA4\u7EE7\u7EED\u5F53\u524D\u7814\u7A76\u4EFB\u52A1\u3002\u53EA\u5728\u5DF2\u6709\u5DE5\u5177\u4E0E\u6388\u6743\u8303\u56F4\u5185\u63A8\u8FDB\uFF0C\u8BA1\u7B97\u3001\u4EE3\u7801\u6574\u5408\u548C\u53D1\u5E03\u4ECD\u4F7F\u7528\u5404\u81EA\u56FA\u5B9A\u6279\u51C6\uFF1B\u82E5\u8BA1\u5212\u6216\u6765\u6E90\u5931\u6548\uFF0C\u8BF4\u660E\u539F\u56E0\uFF0C\u4E0D\u7528\u65E7\u7248\u672C\u66FF\u4EE3\u3002` }, "POST", void 0, `research-brief-continue:${id}:${digest}`);
  }
  researchBriefCard(disabled) {
    const { data, session, perform } = this.props, view = data.researchBrief, brief = view?.brief;
    if (!view || !brief || brief.rootSessionId !== session.id) return null;
    const current = view.latestId === brief.id, valid = view.evidenceChecks.every((e) => e.current), confirmed = brief.status === "confirmed";
    return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: brief.status !== "confirmed", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        "\u7814\u7A76\u95EE\u9898\u4E0E\u8BA1\u5212 \xB7 \u7B2C ",
        brief.revision,
        " \u7248",
        /* @__PURE__ */ jsx(Badge, { value: confirmed ? "approved" : brief.status === "ready" ? "pending" : "draft", caption: confirmed ? "\u5DF2\u786E\u8BA4" : brief.status === "ready" ? "\u5F85\u786E\u8BA4" : "\u5F85\u6F84\u6E05" })
      ] }),
      /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: brief.question }) }),
      /* @__PURE__ */ jsx("p", { children: brief.scope }),
      brief.clarificationQuestions.length ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "\u5F85\u660E\u786E\u7684\u95EE\u9898" }),
        /* @__PURE__ */ jsx("ul", { children: brief.clarificationQuestions.map((q, i) => /* @__PURE__ */ jsx("li", { children: q }, i)) })
      ] }) : null,
      brief.successCriteria.length ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "\u5224\u65AD\u6807\u51C6" }),
        /* @__PURE__ */ jsx("ul", { children: brief.successCriteria.map((q, i) => /* @__PURE__ */ jsx("li", { children: q }, i)) })
      ] }) : null,
      brief.steps.length ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u7814\u7A76\u6B65\u9AA4\uFF08",
          brief.steps.length,
          "\uFF09"
        ] }),
        /* @__PURE__ */ jsx("ol", { children: brief.steps.map((step, i) => /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("strong", { children: step.title }),
          " \xB7 ",
          step.description
        ] }, i)) })
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u6587\u732E\u3001\u5047\u8BBE\u4E0E\u7EA6\u675F \xB7 ",
          brief.evidenceIds.length,
          " \u9879\u8BC1\u636E"
        ] }),
        /* @__PURE__ */ jsx("p", { children: brief.literatureSummary }),
        brief.hypotheses.map((h, i) => /* @__PURE__ */ jsxs("p", { children: [
          h.statement,
          " \xB7 \u8BC1\u636E ",
          h.evidenceIds.length
        ] }, i)),
        brief.constraints.map((c, i) => /* @__PURE__ */ jsx("p", { children: c }, i))
      ] }),
      !valid ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u90E8\u5206\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u5386\u53F2\u5185\u5BB9\u4FDD\u7559\uFF1B\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u91CD\u65B0\u6838\u5BF9\u8D44\u6599\u3002" }) : null,
      current && brief.status !== "clarifying" ? /* @__PURE__ */ jsx("div", { className: "actions", children: /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: disabled || !valid, onClick: () => perform(() => this.continueResearchBrief(), "\u7814\u7A76\u8BA1\u5212\u5DF2\u786E\u8BA4\uFF0C\u7EE7\u7EED\u5F53\u524D\u5BF9\u8BDD"), children: confirmed ? "\u7EE7\u7EED\u5DF2\u786E\u8BA4\u8BA1\u5212" : "\u786E\u8BA4\u7814\u7A76\u95EE\u9898\u4E0E\u8BA1\u5212" }) }) : null,
      view.history.length > 1 ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u5386\u53F2\u4FEE\u8BA2\uFF08",
          view.history.length,
          "\uFF09"
        ] }),
        view.history.map((h) => /* @__PURE__ */ jsxs("p", { children: [
          "\u7B2C ",
          h.revision,
          " \u7248 \xB7 ",
          h.status === "confirmed" ? "\u5DF2\u786E\u8BA4" : h.status === "ready" ? "\u5F85\u786E\u8BA4" : "\u5F85\u6F84\u6E05",
          " \xB7 ",
          short(h.digest)
        ] }, h.id))
      ] }) : null
    ] });
  }
  runIntentInScope(projectId, sessionId, intentId, manifestDigest, campaignId) {
    const { data } = this.props;
    if (!this.dialogueMatches(projectId, sessionId)) return false;
    const intent = data.intents.find((i) => i.id === intentId);
    if (!intent || intent.manifestDigest !== manifestDigest || intent.status !== "prepared" || intent.runId) return false;
    if (!campaignId) return intent.rootSessionId === sessionId;
    const campaign = data.campaigns.find((c) => c.id === campaignId), member = data.members.some((m) => m.campaignId === campaignId && m.intentId === intentId) || (data.researchCandidates ?? []).some((c) => c.campaignId === campaignId && c.intentId === intentId);
    if (campaign?.rootSessionId !== sessionId || !member) return false;
    if (intent.rootSessionId === sessionId || intent.rootSessionId == null) return true;
    const approval = data.approvals.find((a) => a.id === intent.approvalId), bound = intent.runGrant ?? approval?.runGrant, grant = (data.runGrants ?? []).find((g) => g.id === bound?.id);
    return !!bound && !grant?.taskBinding && grant?.sessionId === sessionId && runGrantUsable(grant);
  }
  async continueRunIntent(intent, campaignId) {
    const { data, session } = this.props, projectId = data.project.id, sessionId = session.id, intentId = intent.id, digest = intent.manifestDigest, approvalId = intent.approvalId, keyId = `${intentId}:${digest}`;
    const messageKey = this.messageKeys.get(keyId) ?? crypto.randomUUID();
    this.messageKeys.set(keyId, messageKey);
    const bound = intent.runGrant ?? data.approvals.find((a) => a.id === approvalId)?.runGrant, inspect = intent.rootSessionId === sessionId ? `\u5148\u8C03\u7528 project_inspect({runIntentId:"${intentId}"})\uFF0C\u6838\u5BF9\u552F\u4E00 RunIntent\u3002` : intent.rootSessionId == null && campaignId ? `\u8C03\u7528 campaign_inspect({campaignId:"${campaignId}"})\uFF0C\u6838\u5BF9\u5F53\u524D\u6D3B\u52A8\u6210\u5458\u6216\u5019\u9009\u4E2D\u5305\u542B\u8BE5\u56FA\u5B9A RunIntent\u3002` : `\u6B64\u9879\u4F9D\u8D56\u5F53\u524D\u4F1A\u8BDD\u5DF2\u6838\u9A8C\u7684 RunGrant ${bound?.id ?? ""}\uFF08${bound?.digest ?? ""}\uFF09\uFF1B\u6309\u8BE5\u7ED1\u5B9A\u6388\u6743\u8EAB\u4EFD\u63D0\u4EA4\u3002`, content = `\u7EE7\u7EED\u6267\u884C\u8FD9\u4EFD\u5DF2\u786E\u8BA4\u7684\u56FA\u5B9A\u6B63\u5F0F\u8FD0\u884C\u3002${inspect}\u786E\u8BA4 manifestDigest \u7B49\u4E8E "${digest}"\u3001\u5BA1\u6279\u6709\u6548\u4E14\u4ECD\u53EF\u63D0\u4EA4\uFF1B\u7136\u540E\u53EA\u8C03\u7528 run_submit({intentId:"${intentId}"})\u3002\u63D0\u4EA4\u540E\u7528\u8FD4\u56DE\u7684 Run id \u8C03\u7528 run_inspect \u56DE\u67E5\u72B6\u6001\u3001\u771F\u5B9E\u6307\u6807\u548C\u4EA7\u7269\uFF0C\u5FC5\u8981\u65F6\u8BFB\u53D6 run_logs\u3002\u82E5\u610F\u5411\u5931\u6548\u3001\u88AB\u62D2\u7EDD\u6216\u56FA\u5B9A\u6388\u6743\u4E0D\u53EF\u7528\uFF0C\u8BF4\u660E\u539F\u56E0\uFF0C\u4E0D\u521B\u5EFA\u66FF\u4EE3\u610F\u5411\u6216\u8865\u8DD1\u3002\u82E5 Run \u5C1A\u672A\u7ED3\u675F\uFF0C\u62A5\u544A\u5F53\u524D\u72B6\u6001\u5E76\u7ED3\u675F\u672C\u8F6E\uFF0C\u4E0D\u5FD9\u8F6E\u8BE2\u3002`;
    if (!this.dialogueMatches(projectId, sessionId)) return;
    await this.props.perform(async () => {
      if (!this.dialogueMatches(projectId, sessionId)) return;
      if (!this.runIntentInScope(projectId, sessionId, intentId, digest, campaignId)) throw Error("\u56FA\u5B9A RunIntent \u5DF2\u5931\u6548\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5BF9\u8BDD\uFF1B\u672A\u6279\u51C6\u3001\u672A\u53D1\u9001\u6D88\u606F\uFF0C\u4E5F\u672A\u521B\u5EFA\u66FF\u4EE3\u610F\u5411\u3002");
      const current = this.props.data.intents.find((i) => i.id === intentId), approval = this.props.data.approvals.find((a) => a.id === approvalId), grantRef = current?.runGrant ?? approval?.runGrant, expectedRef = intent.runGrant ?? data.approvals.find((a) => a.id === approvalId)?.runGrant;
      const sameGrant = !grantRef && !expectedRef || !!grantRef && !!expectedRef && grantRef.id === expectedRef.id && grantRef.digest === expectedRef.digest && grantRef.approvalId === expectedRef.approvalId;
      if (!current || current.approvalId !== approvalId || !approval || !sameGrant) throw Error("\u56FA\u5B9A RunIntent \u7684\u5BA1\u6279\u6216\u6388\u6743\u5F15\u7528\u5DF2\u53D8\u5316\uFF1B\u672A\u53D1\u9001\u6267\u884C\u6D88\u606F\u3002");
      if (grantRef) {
        const grant = (this.props.data.runGrants ?? []).find((g) => g.id === grantRef.id);
        if (grant?.taskBinding) throw Error("\u6B64 RunIntent \u7ED1\u5B9A\u4EFB\u52A1\u7EA7\u6388\u6743\uFF0C\u53EA\u80FD\u7531\u5BF9\u5E94\u7684\u5DF2\u6388\u6743\u4EFB\u52A1\u63D0\u4EA4\u3002");
        if (approval.status !== "approved" || grant?.sessionId !== sessionId || !runGrantUsable(grant)) throw Error("\u7ED1\u5B9A\u6388\u6743\u5C1A\u4E0D\u53EF\u7528\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5BF9\u8BDD\uFF1B\u672A\u53D1\u9001\u6267\u884C\u6D88\u606F\u3002");
      } else if (approval.status === "pending" && !this.approvedRunIntents.has(keyId)) {
        await this.decide(approval, true);
        if (!this.dialogueMatches(projectId, sessionId)) return;
        if (!this.runIntentInScope(projectId, sessionId, intentId, digest, campaignId)) throw Error("\u6279\u51C6\u5B8C\u6210\u540E\u56FA\u5B9A RunIntent \u5DF2\u53D8\u5316\uFF1B\u672A\u53D1\u9001\u6267\u884C\u6D88\u606F\u3002");
        this.approvedRunIntents.add(keyId);
        this.setState((state) => ({ runIntentRevision: state.runIntentRevision + 1 }));
      } else if (approval.status !== "approved" && !(approval.status === "pending" && this.approvedRunIntents.has(keyId))) throw Error("\u6B64\u56FA\u5B9A RunIntent \u672A\u83B7\u6709\u6548\u6279\u51C6\uFF1B\u672A\u53D1\u9001\u6267\u884C\u6D88\u606F\u3002");
      if (!this.dialogueMatches(projectId, sessionId)) return;
      if (!this.runIntentInScope(projectId, sessionId, intentId, digest, campaignId)) throw Error("\u5F53\u524D\u5BF9\u8BDD\u6216\u56FA\u5B9A RunIntent \u5DF2\u53D8\u5316\uFF1B\u672A\u53D1\u9001\u6267\u884C\u6D88\u606F\u3002");
      try {
        await api(`/sessions/${sessionId}/messages`, { content }, "POST", void 0, messageKey);
      } catch (error) {
        if (!this.dialogueMatches(projectId, sessionId)) return;
        throw error;
      }
      this.messageKeys.delete(keyId);
      this.approvedRunIntents.delete(keyId);
      this.queuedRunIntents.add(keyId);
      if (this.dialogueMatches(projectId, sessionId)) this.setState((state) => ({ runIntentRevision: state.runIntentRevision + 1 }));
    });
  }
  runIntentCard(intent, disabled, campaignId) {
    const { data, session } = this.props, approval = data.approvals.find((a) => a.id === intent.approvalId), bound = intent.runGrant ?? approval?.runGrant, grant = (data.runGrants ?? []).find((g) => g.id === bound?.id), run = data.runs.find((r) => r.id === intent.runId && r.experimentId === intent.experimentId), keyId = `${intent.id}:${intent.manifestDigest}`, taskBound = !!grant?.taskBinding, grantUsable = !!grant && grant.sessionId === session.id && runGrantUsable(grant), campaignOwned = !!campaignId && data.campaigns.some((c) => c.id === campaignId && c.rootSessionId === session.id) && (data.members.some((m) => m.campaignId === campaignId && m.intentId === intent.id) || (data.researchCandidates ?? []).some((c) => c.campaignId === campaignId && c.intentId === intent.id)), owned = campaignId ? campaignOwned && (intent.rootSessionId === session.id || intent.rootSessionId == null || !!bound && !taskBound && grantUsable) : intent.rootSessionId === session.id, approved = approval?.status === "approved" || approval?.status === "pending" && this.approvedRunIntents.has(keyId), queued = this.queuedRunIntents.has(keyId), canContinue = owned && intent.status === "prepared" && !intent.runId && !run && !queued && !!approval && (!bound && ["pending", "approved"].includes(approval.status) || !!bound && !taskBound && grantUsable && approval.status === "approved");
    return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: canContinue || queued, children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        "\u6B63\u5F0F\u5B9E\u9A8C \xB7 ",
        data.experiments.find((e) => e.id === intent.experimentId)?.title ?? short(intent.experimentId),
        /* @__PURE__ */ jsx(Badge, { value: run?.state ?? (approved ? "approved" : approval?.status ?? intent.status) })
      ] }),
      intent.manifest.researchBrief ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u7814\u7A76\u4F9D\u636E\uFF1A\u7B2C ",
        intent.manifest.researchBrief.revision,
        " \u7248\u8BA1\u5212"
      ] }) : null,
      intent.manifest.analysis ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u7ED3\u675F\u540E\u7531 ",
        intent.manifest.analysis.model.provider,
        "/",
        intent.manifest.analysis.model.model,
        " \u81EA\u52A8\u5206\u6790\u4E00\u6B21\uFF0C\u4EC5\u8BFB\u53D6\u672C\u6B21\u7ED3\u679C\u5E76\u7ED9\u51FA\u5EFA\u8BAE\u3002"
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u51BB\u7ED3\u53C2\u6570\u3001\u8BA1\u7B97\u5951\u7EA6\u4E0E\u6388\u6743" }),
        /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ intentId: intent.id, manifestDigest: intent.manifestDigest, manifest: intent.manifest, runGrant: bound }, null, 2) })
      ] }),
      canContinue ? /* @__PURE__ */ jsx("button", { className: "primary compact", disabled, onClick: () => this.continueRunIntent(intent, campaignId), children: "\u786E\u8BA4\u5E76\u8BA9\u667A\u80FD\u4F53\u6267\u884C" }) : null,
      queued && intent.status === "prepared" && !run ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6267\u884C\u6D88\u606F\u5DF2\u5165\u961F\uFF0C\u7B49\u5F85\u667A\u80FD\u4F53\u56DE\u67E5\u56FA\u5B9A\u8FD0\u884C\u3002" }) : taskBound ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6B64\u56FA\u5B9A\u8FD0\u884C\u7ED1\u5B9A\u4EFB\u52A1\u7EA7\u6388\u6743\uFF0C\u7531\u5BF9\u5E94\u7684\u5DF2\u6388\u6743\u4EFB\u52A1\u63D0\u4EA4\u3002" }) : bound && !grantUsable ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u7ED1\u5B9A\u6388\u6743\u4E0D\u53EF\u7528\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D\u4E3B\u4F1A\u8BDD\uFF1B\u4FDD\u7559\u56FA\u5B9A\u5386\u53F2\uFF0C\u4E0D\u63D0\u4F9B\u63D0\u4EA4\u5165\u53E3\u3002" }) : !owned ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6B64\u56FA\u5B9A\u8FD0\u884C\u672A\u7ED1\u5B9A\u5F53\u524D\u5BF9\u8BDD\uFF0C\u53EA\u8BFB\u4FDD\u7559\u3002" }) : approval && ["rejected", "stale"].includes(approval.status) ? /* @__PURE__ */ jsxs("p", { className: "small muted", role: "status", children: [
        "\u56FA\u5B9A\u8FD0\u884C\u5BA1\u6279\u5DF2",
        approval.status === "rejected" ? "\u62D2\u7EDD" : "\u5931\u6548",
        "\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u521B\u5EFA\u66FF\u4EE3\u610F\u5411\u3002"
      ] }) : intent.status !== "prepared" && !run ? /* @__PURE__ */ jsxs("p", { className: "small muted", role: "status", children: [
        "\u56FA\u5B9A RunIntent \u72B6\u6001\u4E3A ",
        label(intent.status),
        "\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u8865\u8DD1\u3002"
      ] }) : null,
      run ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onRun(run.id, run.experimentId), children: "\u67E5\u770B\u5B9E\u9645\u8FD0\u884C\u65E5\u5FD7\u4E0E\u7ED3\u679C" }),
        run.metrics ? /* @__PURE__ */ jsx("p", { className: "small", children: Object.entries(run.metrics).map(([name, value]) => `${name}=${number(value)}${run.manifest.contract.metrics[name]?.unit ? ` ${run.manifest.contract.metrics[name].unit}` : ""}`).join(" \xB7 ") }) : null
      ] }) : null
    ] }, intent.id);
  }
  async preview(proposal) {
    const epoch = ++this.readEpoch;
    await this.props.perform(async () => {
      const result = await api(`/change-proposals/${proposal.id}/diff`);
      if (result.proposal.id !== proposal.id || result.proposal.digest !== proposal.digest || result.files.length !== proposal.changes.length || new Set(result.files.map((f) => f.path)).size !== proposal.changes.length || !result.files.every((f) => proposal.changes.some((c) => c.path === f.path))) throw Error("\u56FA\u5B9A\u5DEE\u5F02\u4E0E\u6240\u9009\u63D0\u6848\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6");
      if (this.mounted && epoch === this.readEpoch) this.setState({ previews: { ...this.state.previews, [proposal.id]: result } });
    });
  }
  campaignCard(c, disabled) {
    const { data, perform, onSession, onExperiment, onRun, busy } = this.props, a = data.approvals.find((a2) => a2.id === c.approvalId), baseline = data.experiments.find((e) => e.id === c.baselineExperimentId);
    const observations = data.observations.filter((o) => o.campaignId === c.id);
    const intentIds = /* @__PURE__ */ new Set([...data.members.filter((m) => m.campaignId === c.id).map((m) => m.intentId), ...(data.researchCandidates ?? []).filter((v) => v.campaignId === c.id).flatMap((v) => v.intentId ? [v.intentId] : [])]);
    return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: c.state === "draft", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        "\u7814\u7A76\u8BA1\u5212 \xB7 ",
        c.goal,
        /* @__PURE__ */ jsx(Badge, { value: c.state })
      ] }),
      /* @__PURE__ */ jsx("p", { children: c.goal }),
      /* @__PURE__ */ jsxs("dl", { className: "details", children: [
        /* @__PURE__ */ jsx("dt", { children: "\u57FA\u7EBF" }),
        /* @__PURE__ */ jsx("dd", { children: baseline?.title ?? short(c.baselineExperimentId) }),
        /* @__PURE__ */ jsx("dt", { children: "\u8BC4\u4EF7\u6307\u6807" }),
        /* @__PURE__ */ jsxs("dd", { children: [
          c.primaryMetric,
          " \xB7 ",
          c.direction === "min" ? "\u8D8A\u5C0F\u8D8A\u597D" : "\u8D8A\u5927\u8D8A\u597D"
        ] }),
        /* @__PURE__ */ jsx("dt", { children: "\u5DF2\u7ED1\u5B9A\u6A21\u578B" }),
        /* @__PURE__ */ jsxs("dd", { children: [
          c.rootModel.provider || "\u672A\u914D\u7F6E\u4F9B\u5E94\u5546",
          " / ",
          c.rootModel.model || "\u672A\u914D\u7F6E\u6A21\u578B"
        ] }),
        /* @__PURE__ */ jsx("dt", { children: "\u7ED3\u679C\u5206\u6790" }),
        /* @__PURE__ */ jsx("dd", { children: c.autoAnalyze ? "\u6279\u51C6\u540E\u5141\u8BB8\u6709\u754C\u81EA\u52A8\u5206\u6790" : "\u7531\u5BF9\u8BDD\u6307\u4EE4\u8BF7\u6C42\u5206\u6790" })
      ] }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6765\u6E90\u3001\u989D\u5EA6\u4E0E\u622A\u6B62\u6761\u4EF6" }),
        /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ id: c.id, rootSessionId: c.rootSessionId, contractDigest: c.contractDigest, planDigest: c.planDigest, limits: c.limits, rootModel: c.rootModel }, null, 2) })
      ] }),
      c.state === "draft" && a && ["pending", "approved"].includes(a.status) ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "primary compact", disabled, onClick: () => perform(async () => {
          await this.approved(a);
          await api(`/campaigns/${c.id}/activate`, { expectedVersion: c.version });
        }, "\u7814\u7A76\u8BA1\u5212\u5DF2\u542F\u52A8\uFF1B\u6B63\u5F0F\u5B9E\u9A8C\u4ECD\u6309\u56FA\u5B9A\u6388\u6743\u63D0\u4EA4"), children: a.status === "approved" ? "\u542F\u52A8\u5DF2\u6279\u51C6\u7814\u7A76\u8BA1\u5212" : "\u6279\u51C6\u5E76\u542F\u52A8\u7814\u7A76\u8BA1\u5212" }),
        a.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.decide(a, false)), children: "\u62D2\u7EDD\u7814\u7A76\u8BA1\u5212" }) : null
      ] }) : null,
      a ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u6279\u51C6\u72B6\u6001\uFF1A",
        label(a.status)
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        c.state === "active" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled, onClick: () => perform(() => api(`/campaigns/${c.id}/pause`, { expectedVersion: c.version })), children: "\u6682\u505C\u7814\u7A76\u8BA1\u5212" }) : null,
        c.state === "paused" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled, onClick: () => perform(() => api(`/campaigns/${c.id}/resume`, { expectedVersion: c.version })), children: "\u6062\u590D\u7814\u7A76\u8BA1\u5212" }) : null,
        ["active", "paused"].includes(c.state) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", disabled, onClick: () => perform(() => api(`/campaigns/${c.id}/stop`, { expectedVersion: c.version, reason: "\u7528\u6237\u5728\u539F\u5BF9\u8BDD\u4E2D\u505C\u6B62\u7814\u7A76\u8BA1\u5212" })), children: "\u505C\u6B62\u7814\u7A76\u8BA1\u5212" }) : null,
        /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => onExperiment(c.focusExperimentId), children: "\u67E5\u770B\u5F53\u524D\u5B9E\u9A8C" })
      ] }),
      observations.length ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u5B9E\u9645\u89C2\u6D4B\u4E0E\u8BC1\u636E\uFF08",
          observations.length,
          "\uFF09"
        ] }),
        observations.map((o) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => onRun(o.runId, o.experimentId), children: [
            "Run ",
            short(o.runId)
          ] }),
          /* @__PURE__ */ jsx(Badge, { value: o.validation }),
          /* @__PURE__ */ jsxs("p", { children: [
            c.primaryMetric,
            "=",
            number(o.metrics[c.primaryMetric]),
            " \xB7 ",
            o.explanation
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u89C2\u6D4B ",
            short(o.id),
            " \xB7 \u8BC1\u636E ",
            o.evidenceIds.map(short).join("\u3001") || "\u672A\u53D6\u5F97"
          ] })
        ] }, o.id))
      ] }) : null,
      data.intents.filter((i) => intentIds.has(i.id)).map((i) => this.runIntentCard(i, disabled, c.id)),
      data.decisions.filter((d) => d.campaignId === c.id).map((d) => {
        const approval = data.approvals.find((a2) => a2.id === d.approvalId);
        return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: d.status === "proposed", children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "\u7814\u7A76\u51B3\u5B9A \xB7 ",
            label(d.action),
            /* @__PURE__ */ jsx(Badge, { value: d.status })
          ] }),
          /* @__PURE__ */ jsx("p", { children: d.reason }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u4F9D\u636E\u3001\u5019\u9009\u914D\u7F6E\u4E0E\u56FA\u5B9A\u65B9\u6848" }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify(d, null, 2) }),
            (data.experimentPlans ?? []).filter((p) => p.id === d.planRevisionId).map((p) => /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify(p, null, 2) }, p.id))
          ] }),
          d.status === "proposed" && approval && ["pending", "approved"].includes(approval.status) ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "primary compact", disabled, onClick: () => perform(async () => {
              await this.approved(approval);
              await api(`/campaign-decisions/${d.id}/apply`, { expectedVersion: d.version });
            }, "\u7814\u7A76\u51B3\u5B9A\u5DF2\u5E94\u7528"), children: approval.status === "approved" ? "\u5E94\u7528\u5DF2\u6279\u51C6\u7814\u7A76\u51B3\u5B9A" : "\u6279\u51C6\u5E76\u5E94\u7528\u7814\u7A76\u51B3\u5B9A" }),
            approval.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.decide(approval, false)), children: "\u62D2\u7EDD\u7814\u7A76\u51B3\u5B9A" }) : null
          ] }) : null
        ] }, d.id);
      }),
      (data.experimentPlans ?? []).some((p) => p.campaignId === c.id) ? /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u5DF2\u751F\u6210\u7684\u65B9\u6848\u3001\u5019\u9009\u4E0E\u7ED3\u679C\u6BD4\u8F83" }),
        /* @__PURE__ */ jsx(ResearchPlanPanel, { data, campaign: c, busy: busy || disabled, perform, onExperiment, onImplementation: onSession, onRun })
      ] }) : null
    ] }, c.id);
  }
  proposalCard(p, disabled, readOnly = false) {
    const { data, perform, onExperiment } = this.props, a = data.approvals.find((a2) => a2.id === p.approvalId), preview = this.state.previews[p.id], current = preview?.proposal.digest === p.digest;
    return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: !readOnly && p.state === "prepared" && a?.status === "pending", children: [
      /* @__PURE__ */ jsxs("summary", { children: [
        "\u4EE3\u7801\u53D8\u66F4 \xB7 ",
        p.title,
        /* @__PURE__ */ jsx(Badge, { value: p.state })
      ] }),
      /* @__PURE__ */ jsx("p", { children: p.hypothesis }),
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u7236\u5B9E\u9A8C ",
        short(p.baseExperimentId),
        " \xB7 \u56FA\u5B9A\u4FEE\u8BA2 ",
        p.baseRevision,
        " \xB7 \u6D4B\u8BD5 ",
        label(p.testsStatus),
        " \xB7 \u5BA1\u67E5 ",
        short(p.reviewId)
      ] }),
      p.sourceValidity === "stale" ? /* @__PURE__ */ jsx("p", { role: "status", className: "error-text", children: "\u6765\u6E90\u5DF2\u5931\u6548\uFF1B\u65E7\u5DEE\u5F02\u4FDD\u7559\uFF0C\u4E0D\u80FD\u6574\u5408\u3002" }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6765\u6E90\u4E0E\u6D4B\u8BD5\u3001\u5BA1\u67E5\u4F9D\u636E" }),
        /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ id: p.id, digest: p.digest, baseDigest: p.baseSnapshot.digest, candidateDigest: p.candidateSnapshot.digest, testJobId: p.testJobId, reviewId: p.reviewId, reviewAcceptanceId: p.reviewAcceptanceId, sourceValidity: p.sourceValidity, flow: p.flow }, null, 2) })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: this.props.busy, onClick: () => this.preview(p), children: "\u67E5\u770B\u5B8C\u6574\u56FA\u5B9A\u5DEE\u5F02" }),
      current ? /* @__PURE__ */ jsx("div", { children: preview.files.map((f) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsxs("h4", { children: [
          f.path,
          " \xB7 ",
          f.beforeMode ?? "\u672A\u8BB0\u5F55",
          " \u2192 ",
          f.afterMode ?? "\u672A\u8BB0\u5F55"
        ] }),
        /* @__PURE__ */ jsxs("details", { open: true, children: [
          /* @__PURE__ */ jsx("summary", { children: "\u53D8\u66F4\u524D" }),
          /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.before ?? "\uFF08\u4E0D\u5B58\u5728\uFF09" })
        ] }),
        /* @__PURE__ */ jsxs("details", { open: true, children: [
          /* @__PURE__ */ jsx("summary", { children: "\u53D8\u66F4\u540E" }),
          /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.after ?? "\uFF08\u5220\u9664\uFF09" })
        ] })
      ] }, f.path)) }) : null,
      !readOnly && p.state === "prepared" && p.sourceValidity !== "stale" && a && ["pending", "approved"].includes(a.status) ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: disabled || !current, onClick: () => perform(async () => {
          await this.approved(a);
          await api(`/change-proposals/${p.id}/apply`, {});
        }, "\u56FA\u5B9A\u53D8\u66F4\u5DF2\u6574\u5408\u4E3A\u5B50\u5B9E\u9A8C\uFF0C\u672A\u542F\u52A8\u6B63\u5F0F\u8FD0\u884C"), children: a.status === "approved" ? "\u6574\u5408\u5DF2\u6279\u51C6\u53D8\u66F4" : "\u6279\u51C6\u5E76\u6574\u5408\u56FA\u5B9A\u53D8\u66F4" }),
        a.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.decide(a, false)), children: "\u62D2\u7EDD\u4EE3\u7801\u53D8\u66F4" }) : null
      ] }) : null,
      p.appliedExperimentId ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => onExperiment(p.appliedExperimentId), children: "\u67E5\u770B\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C" }) : null,
      readOnly ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u5386\u53F2\u63D0\u6848\u672A\u7ED1\u5B9A\u4E3B\u4F1A\u8BDD\uFF0C\u53EA\u8BFB\u4FDD\u7559\uFF1B\u53EF\u5728\u5BF9\u8BDD\u4E2D\u91CD\u65B0\u51C6\u5907\u6709\u660E\u786E\u5F52\u5C5E\u7684\u53D8\u66F4\u3002" }) : null
    ] }, p.id);
  }
  render() {
    const { data, session, perform, busy, onExperiment } = this.props;
    if (session.taskId || session.role !== "coordinator") return null;
    const disabled = busy || data.project.archived || session.state === "archived", campaigns = (data.campaigns ?? []).filter((c) => c.rootSessionId === session.id), tasks = (data.developmentTasks ?? []).filter((t) => t.sessionId === session.id), jobs = (data.sandboxJobs ?? []).filter((j) => j.sessionId === session.id), reviews = (data.reviews ?? []).filter((r) => r.producerSessionId === session.id), proposals = (data.changeProposals ?? []).filter((p) => proposalSession(data, p) === session.id), unbound = (data.changeProposals ?? []).filter((p) => !proposalSession(data, p)), campaignIntentIds = new Set(campaigns.flatMap((c) => [...data.members.filter((m) => m.campaignId === c.id).map((m) => m.intentId), ...(data.researchCandidates ?? []).filter((v) => v.campaignId === c.id).flatMap((v) => v.intentId ? [v.intentId] : [])])), runIntents = data.intents.filter((i) => i.rootSessionId === session.id && !campaignIntentIds.has(i.id));
    if (!data.researchBrief?.brief && !campaigns.length && !tasks.length && !jobs.length && !reviews.length && !proposals.length && !unbound.length && !runIntents.length && !session.sourceRevisionId && !(data.manuscripts ?? []).some((r) => r.rootSessionId === session.id)) return null;
    return /* @__PURE__ */ jsxs("section", { className: "chat-workflows", "aria-label": "\u5F53\u524D\u5BF9\u8BDD\u4EFB\u52A1", children: [
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EFB\u52A1\u7531\u5BF9\u8BDD\u4E2D\u7684 Pi \u51C6\u5907\uFF1B\u9700\u8981\u786E\u8BA4\u7684\u56FA\u5B9A\u4E8B\u9879\u663E\u793A\u5728\u8FD9\u91CC\u3002\u72B6\u6001\u4F1A\u66F4\u65B0\uFF0C\u540E\u7EED\u8981\u6C42\u7EE7\u7EED\u5728\u8F93\u5165\u6846\u8BF4\u660E\u3002" }),
      this.researchBriefCard(disabled),
      /* @__PURE__ */ jsx(PublicationDialogue, { data, session, disabled, busy, perform }),
      campaigns.slice().reverse().map((c) => this.campaignCard(c, disabled)),
      runIntents.map((i) => this.runIntentCard(i, disabled)),
      session.sourceRevisionId ? /* @__PURE__ */ jsxs("details", { className: "workflow-card", children: [
        /* @__PURE__ */ jsx("summary", { children: "\u79C1\u6709\u5B9E\u73B0\u6765\u6E90\u4E0E\u6709\u9650\u6388\u6743" }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u56FA\u5B9A\u6765\u6E90 ",
          short(session.sourceRevisionId),
          "\u3002\u53EF\u5728\u5BF9\u8BDD\u4E2D\u8981\u6C42 Pi \u7F16\u5199\u4EE3\u7801\u3001\u6D4B\u8BD5\u6216\u4FEE\u590D\u3002"
        ] }),
        /* @__PURE__ */ jsx(WorkingGrants, { data, session, busy: disabled, perform, dirty: false })
      ] }) : null,
      tasks.slice().reverse().map((t) => {
        const a = data.approvals.find((a2) => a2.id === t.grantId), derived = t.manifest.workingGrant, grant = (data.workingGrants ?? []).find((g) => g.id === session.workingGrantId), oldTemplate = !!session.workingGrantId && !derived, grantOpen = !session.workingGrantId || derived?.id === session.workingGrantId && grant?.effectiveState === "active" && grant.validity === "current" && Date.parse(grant.expiresAt) > Date.now(), actionable = !t.jobId && !oldTemplate && !!a && ["pending", "approved"].includes(a.status);
        return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: actionable, children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "\u5F00\u53D1\u6D4B\u8BD5 \xB7 ",
            t.title,
            /* @__PURE__ */ jsx(Badge, { value: a?.status ?? t.state })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u6E90\u7801 ",
            short(t.sourceDigest),
            " \xB7 \u56FA\u5B9A\u547D\u4EE4 ",
            JSON.stringify(t.manifest.command)
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u56FA\u5B9A\u6E90\u7801\u3001\u955C\u50CF\u3001\u8D44\u6E90\u4E0E\u4EA7\u7269" }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ developmentTaskId: t.id, sourceDigest: t.sourceDigest, manifest: t.manifest }, null, 2) })
          ] }),
          oldTemplate ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u5DF2\u7ED1\u5B9A\u6709\u754C\u6388\u6743\uFF0C\u65E7\u5355\u6B21\u6D4B\u8BD5\u6A21\u677F\u4E0D\u53EF\u63D0\u4EA4\uFF1B\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u8981\u6C42\u91CD\u65B0\u51C6\u5907\u3002" }) : null,
          actionable ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: disabled || !grantOpen, onClick: () => perform(async () => {
              await this.approved(a);
              await this.call("development_submit", { developmentTaskId: t.id });
            }, "\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5\u5DF2\u63D0\u4EA4\uFF0C\u7ED3\u679C\u4F1A\u5728\u672C\u5BF9\u8BDD\u66F4\u65B0"), children: a.status === "approved" ? "\u63D0\u4EA4\u5DF2\u6279\u51C6\u5F00\u53D1\u6D4B\u8BD5" : "\u6279\u51C6\u5E76\u63D0\u4EA4\u5F00\u53D1\u6D4B\u8BD5" }),
            a.status === "pending" && !derived ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.decide(a, false)), children: "\u62D2\u7EDD\u5F00\u53D1\u6D4B\u8BD5" }) : null
          ] }) : null
        ] }, t.id);
      }),
      jobs.slice().reverse().map((j) => /* @__PURE__ */ jsxs("details", { className: "workflow-card", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u6D4B\u8BD5\u7ED3\u679C \xB7 ",
          short(j.id),
          /* @__PURE__ */ jsx(Badge, { value: j.state }),
          /* @__PURE__ */ jsx(Badge, { value: j.integrity })
        ] }),
        /* @__PURE__ */ jsx(DevelopmentJob, { job: j, data, sessionId: session.id, perform })
      ] }, j.id)),
      reviews.map((r) => {
        const a = data.approvals.find((a2) => a2.id === r.approvalId), task = data.tasks.find((t) => t.id === r.taskId), team = data.teams.find((t) => t.id === r.teamId), canStart = data.project.settings.enabled && team?.state === "awaiting_approval" && team.delegationEnabled;
        return /* @__PURE__ */ jsxs("details", { className: "workflow-card", open: r.status === "awaiting_approval", children: [
          /* @__PURE__ */ jsxs("summary", { children: [
            "\u72EC\u7ACB\u5BA1\u67E5 \xB7 ",
            short(r.id),
            /* @__PURE__ */ jsx(Badge, { value: r.status })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u56FA\u5B9A\u6D4B\u8BD5 ",
            short(r.jobId),
            " \xB7 \u6E90\u7801 ",
            short(r.sourceDigest)
          ] }),
          /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u5BA1\u67E5\u5BF9\u8C61\u4E0E\u8BC1\u636E" }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ review: r, taskId: task?.id, inputEvidenceIds: task?.inputEvidenceIds }, null, 2) })
          ] }),
          task?.result ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "\u6267\u884C ",
              label(task.execution),
              " \xB7 \u9A8C\u6536 ",
              label(task.acceptance),
              " \xB7 \u610F\u89C1 ",
              task.result.verdict === "accept" ? "\u63A5\u53D7" : task.result.verdict === "reject" ? "\u62D2\u7EDD" : task.result.verdict === "disputed" ? "\u4E89\u8BAE" : "\u672A\u63D0\u4F9B"
            ] }),
            /* @__PURE__ */ jsx("p", { children: task.result.summary })
          ] }) : null,
          r.status === "stale" ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6D4B\u8BD5\u6216\u5BA1\u67E5\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u5386\u53F2\u610F\u89C1\u4E0D\u80FD\u7528\u4E8E\u65B0\u6574\u5408\u3002" }) : null,
          canStart && a && ["pending", "approved"].includes(a.status) ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            /* @__PURE__ */ jsx("button", { className: "primary compact", disabled, onClick: () => perform(async () => {
              await this.approved(a);
              await api(`/teams/${r.teamId}/activate`, {});
            }, "\u72EC\u7ACB\u5BA1\u67E5\u5DF2\u542F\u52A8"), children: a.status === "approved" ? "\u542F\u52A8\u5DF2\u6279\u51C6\u72EC\u7ACB\u5BA1\u67E5" : "\u6279\u51C6\u5E76\u542F\u52A8\u72EC\u7ACB\u5BA1\u67E5" }),
            a.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled, onClick: () => perform(() => this.decide(a, false)), children: "\u62D2\u7EDD\u72EC\u7ACB\u5BA1\u67E5" }) : null
          ] }) : null,
          !data.project.settings.enabled && r.status === "awaiting_approval" ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u5F00\u542F\u8F93\u5165\u6846\u65C1\u7684\u591A\u667A\u80FD\u4F53\u6A21\u5F0F\u540E\u624D\u80FD\u5206\u914D\u72EC\u7ACB\u5BA1\u67E5\u3002" }) : null
        ] }, r.id);
      }),
      proposals.slice().reverse().map((p) => this.proposalCard(p, disabled)),
      unbound.length ? /* @__PURE__ */ jsxs("details", { className: "workflow-card", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u672A\u7ED1\u5B9A\u4F1A\u8BDD\u7684\u5386\u53F2\u63D0\u6848\uFF08",
          unbound.length,
          "\uFF0C\u53EA\u8BFB\uFF09"
        ] }),
        unbound.map((p) => this.proposalCard(p, true, true))
      ] }) : null
    ] });
  }
}
export {
  ChatWorkflows,
  proposalSession
};
