import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { short, number } from "./models.js";
import { Badge } from "./ui.js";
const lines = (value) => String(value ?? "").split("\n").map((v) => v.trim()).filter(Boolean);
function readResearchPlan(fd, primaryMetric) {
  return { hypothesis: String(fd.get("planHypothesis")), controlRunIds: fd.getAll("controlRuns").map(String), changedFactors: lines(fd.get("factors")), dataSplit: String(fd.get("dataSplit")), dataArtifactIds: fd.getAll("dataArtifacts").map(String), primaryMetric, guardrailMetrics: fd.getAll("guardrails").map(String), repetitions: { count: Number(fd.get("repeatCount")), rationale: String(fd.get("repeatRationale")) }, successCriteria: String(fd.get("success")), inconclusiveCriteria: String(fd.get("inconclusive")), stoppingCriteria: String(fd.get("stopping")), ...fd.get("previousPlan") ? { previousRevisionId: String(fd.get("previousPlan")) } : {} };
}
function readPlanCandidates(fd) {
  return fd.getAll("candidateIndex").map((value) => {
    const prefix = `candidate${value}`, implementation = String(fd.get(`${prefix}Implementation`));
    const config = {};
    if (implementation === "config") {
      const keys = fd.getAll(`${prefix}Key`), values = fd.getAll(`${prefix}Value`);
      keys.forEach((key, i) => {
        const k = String(key).trim();
        if (!k) return;
        if (Object.prototype.hasOwnProperty.call(config, k)) throw new Error(`\u91CD\u590D\u914D\u7F6E\u9879\uFF1A${k}`);
        const raw = String(values[i] ?? "");
        let parsed = raw;
        try {
          parsed = JSON.parse(raw);
        } catch {
        }
        Object.defineProperty(config, k, { value: parsed, enumerable: true, configurable: true, writable: true });
      });
    }
    return { title: String(fd.get(`${prefix}Title`)), hypothesis: String(fd.get(`${prefix}Hypothesis`)), implementation, ...implementation === "config" ? { config } : {} };
  });
}
class CandidateFields extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { implementation: "config", parameters: 2 };
  }
  render() {
    const { index, repair } = this.props, prefix = `candidate${index}`, implementation = repair ? "reviewed-code" : this.state.implementation;
    return /* @__PURE__ */ jsxs("fieldset", { children: [
      /* @__PURE__ */ jsxs("legend", { children: [
        "\u5019\u9009 ",
        index + 1
      ] }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "candidateIndex", value: index }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5019\u9009\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { name: `${prefix}Title`, required: true, maxLength: 200 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5019\u9009\u5047\u8BBE",
        /* @__PURE__ */ jsx("textarea", { name: `${prefix}Hypothesis`, required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5B9E\u73B0\u65B9\u5F0F",
        /* @__PURE__ */ jsxs("select", { name: `${prefix}Implementation`, value: implementation, disabled: repair, onChange: (e) => this.setState({ implementation: e.target.value }), children: [
          /* @__PURE__ */ jsx("option", { value: "config", children: "\u56FA\u5B9A\u7236\u6E90\u7801\u7684\u53C2\u6570\u5019\u9009" }),
          /* @__PURE__ */ jsx("option", { value: "reviewed-code", children: "\u6539\u4EE3\u7801\uFF0C\u7ECF\u6D4B\u8BD5\u548C\u72EC\u7ACB\u5BA1\u67E5" })
        ] })
      ] }),
      repair ? /* @__PURE__ */ jsx("input", { type: "hidden", name: `${prefix}Implementation`, value: "reviewed-code" }) : null,
      implementation === "config" ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u586B\u5199\u53D8\u5316\u53C2\u6570\uFF1B\u6570\u503C\u3001\u5E03\u5C14\u503C\u6309\u5BF9\u5E94\u7C7B\u578B\u4FDD\u5B58\uFF0C\u666E\u901A\u6587\u5B57\u4F5C\u4E3A\u5B57\u7B26\u4E32\u3002" }),
        Array.from({ length: this.state.parameters }, (_, i) => /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u53C2\u6570\u540D\u79F0 ",
            i + 1,
            /* @__PURE__ */ jsx("input", { name: `${prefix}Key`, maxLength: 200 })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u53C2\u6570\u503C ",
            i + 1,
            /* @__PURE__ */ jsx("input", { name: `${prefix}Value` })
          ] })
        ] }, i)),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ parameters: this.state.parameters + 1 }), children: "\u6DFB\u52A0\u53C2\u6570" })
      ] }) : /* @__PURE__ */ jsx("p", { className: "notice-inline", children: "\u6279\u51C6\u65B9\u6848\u540E\u51C6\u5907\u79C1\u6709\u5B9E\u73B0\uFF1B\u5F00\u53D1\u6D4B\u8BD5\u3001\u5BA1\u67E5\u3001\u6574\u5408\u548C\u6B63\u5F0F Run \u5404\u81EA\u6279\u51C6\u3002\u539F\u5931\u8D25 Run \u4FDD\u7559\u3002" })
    ] });
  }
}
class ResearchPlanFields extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { count: 1 };
  }
  render() {
    const { data, campaign: c, repair } = this.props, metric = data.experiments.find((e) => e.id === c.focusExperimentId)?.contract?.metrics ?? {}, plans = data.experimentPlans ?? [];
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7814\u7A76\u5047\u8BBE",
        /* @__PURE__ */ jsx("textarea", { name: "planHypothesis", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { children: [
        /* @__PURE__ */ jsx("legend", { children: "\u5B9E\u9645\u5BF9\u7167 Run" }),
        data.runs.filter((r) => r.manifest.contractDigest === c.contractDigest && r.state === "succeeded" && r.integrity === "complete").map((r) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", name: "controlRuns", value: r.id }),
          short(r.id),
          " \xB7 ",
          c.primaryMetric,
          "=",
          number(r.metrics?.[c.primaryMetric]),
          " ",
          metric[c.primaryMetric]?.unit ?? ""
        ] }, r.id))
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u53D8\u5316\u56E0\u7D20\uFF08\u6BCF\u884C\u4E00\u9879\uFF09",
        /* @__PURE__ */ jsx("textarea", { name: "factors", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u6570\u636E\u4E0E\u5207\u5206\u534F\u8BAE",
        /* @__PURE__ */ jsx("textarea", { name: "dataSplit", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u9009\u62E9\u989D\u5916\u56FA\u5B9A\u6570\u636E\u4EA7\u7269\uFF08\u53EF\u9009\uFF09" }),
        /* @__PURE__ */ jsxs("fieldset", { children: [
          /* @__PURE__ */ jsx("legend", { children: "\u56FA\u5B9A\u6570\u636E\u4EA7\u7269\uFF08\u9009\u7528\u65F6\u7ED1\u5B9A\u6458\u8981\uFF09" }),
          (data.artifacts ?? []).map((a) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", name: "dataArtifacts", value: a.id }),
            a.title,
            " \xB7 ",
            short(a.id)
          ] }, a.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { children: [
        "\u4E3B\u6307\u6807\uFF1A",
        c.primaryMetric,
        " \xB7 ",
        metric[c.primaryMetric]?.unit ?? "\u5355\u4F4D\u7531\u56FA\u5B9A\u5951\u7EA6\u6838\u5BF9"
      ] }),
      /* @__PURE__ */ jsxs("fieldset", { children: [
        /* @__PURE__ */ jsx("legend", { children: "\u4FDD\u62A4\u6307\u6807" }),
        Object.keys(metric).filter((k) => k !== c.primaryMetric).map((k) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", name: "guardrails", value: k }),
          k,
          " \xB7 ",
          metric[k].unit
        ] }, k))
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u91CD\u590D\u6B21\u6570",
          /* @__PURE__ */ jsx("input", { name: "repeatCount", type: "number", min: 1, max: 24, defaultValue: 1, required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u91CD\u590D\u6B21\u6570\u4F9D\u636E",
          /* @__PURE__ */ jsx("input", { name: "repeatRationale", required: true })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u6210\u529F\u6761\u4EF6",
        /* @__PURE__ */ jsx("textarea", { name: "success", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u65E0\u7ED3\u8BBA\u6761\u4EF6",
        /* @__PURE__ */ jsx("textarea", { name: "inconclusive", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u505C\u6B62\u6761\u4EF6",
        /* @__PURE__ */ jsx("textarea", { name: "stopping", required: true, rows: 2 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u4FEE\u8BA2\u81EA\uFF08\u53EF\u9009\uFF09",
        /* @__PURE__ */ jsxs("select", { name: "previousPlan", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "\u65B0\u65B9\u6848" }),
          plans.filter((p) => p.campaignId === c.id).map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: short(p.id) }, p.id))
        ] })
      ] }),
      Array.from({ length: repair ? 1 : this.state.count }, (_, i) => /* @__PURE__ */ jsx(CandidateFields, { index: i, repair }, i)),
      !repair && this.state.count < c.limits.maxCandidatesPerRound ? /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: () => this.setState({ count: this.state.count + 1 }), children: "\u6DFB\u52A0\u5019\u9009" }) : null,
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FD9\u4E9B\u6761\u4EF6\u662F\u5F85\u68C0\u9A8C\u7684\u7814\u7A76\u58F0\u660E\u3002\u670D\u52A1\u7AEF\u51BB\u7ED3\u6765\u6E90\u3001\u89C2\u6D4B\u548C\u5951\u7EA6\uFF1B\u4FEE\u6539\u987B\u4FDD\u5B58\u65B0\u4FEE\u8BA2\uFF0C\u4E0D\u80FD\u8986\u76D6\u65E7\u65B9\u6848\u3002" })
    ] });
  }
}
class ResearchPlanPanel extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { comparison: null };
    this.epoch = 0;
    this.mounted = true;
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  componentDidUpdate(previous) {
    if (previous.campaign.id !== this.props.campaign.id || previous.campaign.version !== this.props.campaign.version || JSON.stringify([previous.data.observations, previous.data.researchCandidates, previous.data.experimentPlans, previous.data.approvals]) !== JSON.stringify([this.props.data.observations, this.props.data.researchCandidates, this.props.data.experimentPlans, this.props.data.approvals])) {
      this.epoch++;
      if (this.state.comparison) this.setState({ comparison: null });
    }
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  async compare() {
    const seq = ++this.epoch, id = this.props.campaign.id, version = this.props.campaign.version;
    await this.props.perform(async () => {
      const comparison = await this.call("campaign_comparison", { campaignId: id });
      if (this.mounted && seq === this.epoch && id === this.props.campaign.id && version === this.props.campaign.version) this.setState({ comparison });
    });
  }
  render() {
    const { data, campaign: c, busy, perform, onExperiment, onImplementation, onRun } = this.props, plans = (data.experimentPlans ?? []).filter((p) => p.campaignId === c.id), candidates = (data.researchCandidates ?? []).filter((v) => v.campaignId === c.id), comparison = this.state.comparison;
    return /* @__PURE__ */ jsxs("section", { className: "campaign-section", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u56FA\u5B9A\u7814\u7A76\u65B9\u6848\u4E0E\u5B9E\u73B0" }),
      !plans.length ? /* @__PURE__ */ jsx("p", { className: "muted", children: "\u6682\u65E0\u56FA\u5B9A\u65B9\u6848\u3002\u65E7\u51B3\u5B9A\u5C5E\u4E8E\u5386\u53F2\u517C\u5BB9\u8BB0\u5F55\uFF0C\u672A\u8FFD\u8BA4\u7ED1\u5B9A\u3002" }) : null,
      plans.map((p) => /* @__PURE__ */ jsxs("article", { className: "decision-row", children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          "\u65B9\u6848 ",
          short(p.id)
        ] }),
        /* @__PURE__ */ jsx("p", { children: p.hypothesis }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u56FA\u5B9A\u7236\u5B9E\u9A8C ",
          /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => onExperiment(p.parentSource.experimentId), children: short(p.parentSource.experimentId) }),
          " \xB7 \u4FEE\u8BA2 ",
          p.parentSource.revision
        ] }),
        /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: p.parentSource.sourceDigest }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u4E3B\u6307\u6807 ",
          p.primaryMetric,
          " \xB7 \u5BF9\u7167 ",
          p.controlRunIds.map(short).join("\u3001") || "\u672A\u9009",
          " \xB7 \u91CD\u590D ",
          p.repetitions.count,
          " \u6B21\uFF1A",
          p.repetitions.rationale
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u53D8\u5316\u56E0\u7D20\uFF1A",
          p.changedFactors.join("\uFF1B"),
          "\uFF1B\u6570\u636E/\u5207\u5206\uFF1A",
          p.dataSplit
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u4FDD\u62A4\u6307\u6807\uFF1A",
          p.guardrailMetrics.join("\u3001") || "\u672A\u9009"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u6210\u529F\u6761\u4EF6\uFF1A",
          p.successCriteria
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u65E0\u7ED3\u8BBA\u6761\u4EF6\uFF1A",
          p.inconclusiveCriteria
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u505C\u6B62\u6761\u4EF6\uFF1A",
          p.stoppingCriteria
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u4E0D\u53EF\u53D8\u65B9\u6848\u4E0E\u7ED1\u5B9A\u6458\u8981" }),
          /* @__PURE__ */ jsx("pre", { children: JSON.stringify(p, null, 2) })
        ] })
      ] }, p.id)),
      candidates.map((candidate) => {
        const intent = data.intents.find((i) => i.id === candidate.intentId), run = intent?.runId ? data.runs.find((r) => r.id === intent.runId && r.experimentId === candidate.experimentId) : void 0;
        const proposals = (data.changeProposals ?? []).filter((p) => p.state === "applied" && p.flow === "reviewed-development" && p.baseExperimentId === candidate.parentSource.experimentId && p.baseRevision === candidate.parentSource.revision && p.sourceValidity !== "stale");
        return /* @__PURE__ */ jsxs("article", { className: "decision-row", children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            candidate.spec.title,
            " ",
            /* @__PURE__ */ jsx(Badge, { value: candidate.state })
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u65B9\u6848 ",
            short(candidate.planRevisionId),
            " \xB7 ",
            candidate.spec.implementation === "reviewed-code" ? "\u53D7\u5BA1\u4EE3\u7801\u5019\u9009" : "\u53C2\u6570\u5019\u9009"
          ] }),
          /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
            "\u56FA\u5B9A\u7236\u6E90\u7801 ",
            candidate.parentSource.sourceDigest
          ] }),
          candidate.repairOfMemberId ? /* @__PURE__ */ jsxs("p", { children: [
            "\u4FEE\u590D\u539F\u5019\u9009 ",
            short(candidate.repairOfMemberId),
            " \xB7 \u5171\u4EAB\u4FEE\u590D\u94FE ",
            short(candidate.repairRootMemberId)
          ] }) : null,
          candidate.experimentId ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: !!intent?.runId && (!run || !onRun), onClick: () => {
            if (run) onRun?.(run.id, candidate.experimentId);
            else if (!intent?.runId) onExperiment(candidate.experimentId);
          }, children: "\u67E5\u770B\u5019\u9009\u5B9E\u9A8C\u3001\u65E5\u5FD7\u4E0E\u56FA\u5B9A Run" }) : null,
          candidate.sessionId && onImplementation ? /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => onImplementation(candidate.sessionId), children: "\u6253\u5F00\u6B64\u5019\u9009\u7684\u7814\u7A76\u5BF9\u8BDD" }) : null,
          candidate.state === "awaiting_implementation" && !candidate.sessionId ? /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void perform(() => this.call("campaign_candidate_prepare", { candidateId: candidate.id, sessionId: fd.get("sessionId") }), "\u5DF2\u7ED1\u5B9A\u56FA\u5B9A\u79C1\u6709\u6765\u6E90\uFF1B\u6D4B\u8BD5\u5C1A\u672A\u6279\u51C6");
          }, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u79C1\u6709\u5B9E\u73B0\u4E3B\u4F1A\u8BDD",
              /* @__PURE__ */ jsxs("select", { name: "sessionId", required: true, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4E13\u7528\u4E3B\u4F1A\u8BDD" }),
                data.sessions.filter((s) => s.role === "coordinator" && !s.taskId && s.state !== "archived").map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
                  s.title,
                  " \xB7 ",
                  short(s.id)
                ] }, s.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || c.state !== "active", children: "\u51C6\u5907\u56FA\u5B9A\u6765\u6E90\u7684\u79C1\u6709\u5B9E\u73B0" })
          ] }) : null,
          candidate.state === "awaiting_implementation" && candidate.sessionId ? /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void perform(() => this.call("campaign_candidate_attach", { candidateId: candidate.id, proposalId: fd.get("proposalId") }), "\u5DF2\u63A5\u5165\u5019\u9009\uFF1B\u6B63\u5F0F Run \u4ECD\u987B\u5355\u72EC\u6279\u51C6");
          }, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u5DF2\u6279\u51C6\u5E76\u6574\u5408\u7684\u53D7\u5BA1\u53D8\u66F4",
              /* @__PURE__ */ jsxs("select", { name: "proposalId", required: true, children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u5E94\u7528\u53D8\u66F4" }),
                proposals.map((p) => /* @__PURE__ */ jsxs("option", { value: p.id, children: [
                  p.title,
                  " \xB7 ",
                  short(p.id)
                ] }, p.id))
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || !proposals.length || c.state !== "active", children: "\u6838\u5BF9\u53D7\u5BA1\u6765\u6E90\u5E76\u63A5\u5165\u6D3B\u52A8" })
          ] }) : null,
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u6D4B\u8BD5 ",
            short(candidate.testJobId),
            " \xB7 \u5BA1\u67E5 ",
            short(candidate.reviewId),
            " \xB7 \u6574\u5408 ",
            short(candidate.proposalId),
            " \xB7 RunIntent ",
            short(candidate.intentId)
          ] })
        ] }, candidate.id);
      }),
      /* @__PURE__ */ jsx("h3", { children: "\u5B9E\u9645\u89C2\u6D4B\u6BD4\u8F83" }),
      /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: busy, onClick: () => void this.compare(), children: "\u6838\u5BF9\u56FA\u5B9A\u65B9\u6848\u4E0E\u5B9E\u9645\u6307\u6807" }),
      comparison ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { children: [
          comparison.primaryMetric,
          " \xB7 ",
          comparison.unit,
          " \xB7 ",
          comparison.direction === "min" ? "\u8D8A\u5C0F\u8D8A\u597D" : "\u8D8A\u5927\u8D8A\u597D"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5DF2\u6838\u9A8C\u89C2\u6D4B ",
          comparison.results.filter((r) => r.validation === "verified").length,
          " \xB7 \u65E0\u7ED3\u8BBA/\u672A\u6838\u9A8C ",
          comparison.results.filter((r) => r.validation !== "verified").length
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u56FA\u5B9A\u5BF9\u7167\uFF1A",
          (comparison.controls ?? []).length,
          " \u9879"
        ] }),
        (comparison.controls ?? []).map((control) => /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsxs("button", { className: "text-button", disabled: !onRun, onClick: () => onRun?.(control.runId, control.experimentId), children: [
            "\u5BF9\u7167 Run ",
            short(control.runId)
          ] }),
          " \xB7 ",
          comparison.primaryMetric,
          "=",
          number(control.metrics[comparison.primaryMetric]),
          " ",
          comparison.unit
        ] }, control.runId)),
        comparison.blockers.map((reason, i) => /* @__PURE__ */ jsx("p", { role: "status", className: "notice-inline", children: reason }, i)),
        comparison.plans.filter((p) => p.validity === "stale").map((p) => /* @__PURE__ */ jsxs("p", { className: "error-text", children: [
          "\u65B9\u6848 ",
          short(p.plan.id),
          " \u5DF2\u5931\u6548\uFF1A",
          p.reasons.join("\uFF1B")
        ] }, p.plan.id)),
        /* @__PURE__ */ jsx("div", { className: "table-scroll", children: /* @__PURE__ */ jsxs("table", { children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { children: "\u5B9E\u9645 Run" }),
            /* @__PURE__ */ jsx("th", { children: "\u6838\u9A8C\u72B6\u6001" }),
            /* @__PURE__ */ jsx("th", { children: "\u5B9E\u6D4B\u4E3B\u6307\u6807" }),
            /* @__PURE__ */ jsx("th", { children: "\u8BC1\u636E" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: comparison.results.map((r) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("button", { className: "text-button", disabled: !onRun, onClick: () => onRun?.(r.runId, r.experimentId), children: short(r.runId) }) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { value: r.validation }) }),
            /* @__PURE__ */ jsxs("td", { children: [
              number(r.metrics[comparison.primaryMetric]),
              " ",
              comparison.unit
            ] }),
            /* @__PURE__ */ jsx("td", { children: r.evidenceIds.map(short).join("\u3001") || "\u65E0" })
          ] }, r.observationId)) })
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6BD4\u8F83\u9700\u7814\u7A76\u8005\u5BA1\u9605\uFF1B\u6267\u884C\u6210\u529F\u6216\u6307\u6807\u53D8\u5316\u4E0D\u81EA\u52A8\u5224\u5B9A\u79D1\u5B66\u6210\u529F\u3002" })
      ] }) : null
    ] });
  }
}
export {
  ResearchPlanFields,
  ResearchPlanPanel,
  readPlanCandidates,
  readResearchPlan
};
