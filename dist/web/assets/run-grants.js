import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { short, label } from "./models.js";
import { Badge, nativeSelectButton } from "./ui.js";
const expiry = () => {
  const d = new Date(Date.now() + 36e5);
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};
const signature = (p) => JSON.stringify([p.data.runGrants, p.data.approvals, p.data.intents.map((i) => [i.id, i.version, i.status, i.runId]), p.data.sessions.map((s) => [s.id, s.version, s.runGrantId])]);
const runGrantUsable = (grant) => !!grant && grant.validity === "current" && grant.effectiveState === "active" && grant.usage.remaining > 0 && Date.parse(grant.expiresAt) > Date.now();
function readRunGrantDraft(fd) {
  const intentIds = fd.getAll("intentIds").map(String), maxRuns = Number(fd.get("maxRuns")), expiresAt = new Date(String(fd.get("expiresAt")));
  if (!intentIds.length || intentIds.length > 20 || new Set(intentIds).size !== intentIds.length || !Number.isInteger(maxRuns) || maxRuns < 1 || maxRuns > intentIds.length) throw Error("\u8BF7\u9009\u62E9 1\u201320 \u4EFD\u4E0D\u540C\u6E05\u5355\uFF0C\u5E76\u5C06\u989D\u5EA6\u8BBE\u5728\u96C6\u5408\u6570\u91CF\u4EE5\u5185");
  if (!Number.isFinite(expiresAt.getTime())) throw Error("\u6388\u6743\u622A\u6B62\u65F6\u95F4\u65E0\u6548");
  return { sessionId: String(fd.get("sessionId")), intentIds, maxRuns, expiresAt: expiresAt.toISOString() };
}
class RunGrants extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: "", intentIds: [], inspection: null, reading: false, error: "" };
    this.epoch = 0;
    this.mounted = true;
  }
  componentDidMount() {
    const id = this.props.selectedGrant || (this.props.data.runGrants ?? []).slice(-1)[0]?.id;
    if (id) void this.inspect(id);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
  }
  componentDidUpdate(previous) {
    if (previous.data.project.id !== this.props.data.project.id) {
      this.epoch++;
      this.setState({ selected: "", intentIds: [], inspection: null, reading: false, error: "" });
      if (this.props.selectedGrant) void this.inspect(this.props.selectedGrant);
    } else if (previous.selectedGrant !== this.props.selectedGrant) {
      if (this.props.selectedGrant) void this.inspect(this.props.selectedGrant);
      else {
        this.epoch++;
        this.setState({ selected: "", inspection: null, reading: false, error: "" });
      }
    } else if (signature(previous) !== signature(this.props) && this.state.selected) void this.inspect(this.state.selected);
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  select(id) {
    if (this.props.onSelect && id !== this.props.selectedGrant) this.props.onSelect(id);
    else void this.inspect(id);
  }
  async inspect(grantId) {
    const epoch = ++this.epoch, projectId = this.props.data.project.id;
    this.setState({ selected: grantId, inspection: null, reading: true, error: "" });
    try {
      const grant = await this.call("run_grant_inspect", { grantId });
      if (grant.id !== grantId || grant.projectId !== projectId) throw Error("\u6388\u6743\u4E0D\u5C5E\u4E8E\u6240\u9009\u9879\u76EE\u4E0E\u8BB0\u5F55");
      if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id) this.setState({ inspection: grant });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ reading: false });
    }
  }
  async prepare(fd) {
    const epoch = this.epoch, projectId = this.props.data.project.id;
    await this.props.perform(async () => {
      const grant = await this.call("run_grant_prepare", readRunGrantDraft(fd));
      if (this.mounted && epoch === this.epoch && projectId === this.props.data.project.id) {
        this.setState({ intentIds: [] });
        this.select(grant.id);
      }
    }, "\u51BB\u7ED3\u96C6\u5408\u8349\u6848\u5DF2\u4FDD\u5B58\uFF1B\u5C1A\u672A\u6279\u51C6\u6216\u6FC0\u6D3B\uFF0C\u672A\u542F\u52A8\u6A21\u578B\u6216\u8BA1\u7B97");
  }
  async submit(intentId, experimentId) {
    await this.props.perform(async () => {
      const run = await this.call("run_submit", { intentId });
      if (run.experimentId !== experimentId) throw Error("\u8FD4\u56DE\u7684 Run \u4E0D\u5C5E\u4E8E\u56FA\u5B9A\u5B9E\u9A8C");
    }, "\u5DF2\u63D0\u4EA4\u56FA\u5B9A Run\uFF1B\u8BE5\u63D0\u4EA4\u6C38\u4E45\u8BA1\u6B21\uFF0C\u5237\u65B0\u540E\u53EF\u56DE\u67E5\u5B9E\u9645\u8FD0\u884C");
  }
  render() {
    const { data, busy, perform } = this.props, grants = data.runGrants ?? [], grant = this.state.inspection, approval = data.approvals.find((a) => a.id === grant?.approvalId), eligible = data.intents.filter((i) => i.status === "prepared" && !i.runId && !i.runGrant && data.approvals.some((a) => a.id === i.approvalId && a.status === "pending" && !a.runGrant)), available = this.state.intentIds.every((id) => eligible.some((i) => i.id === id));
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u6709\u9650\u51BB\u7ED3\u8FD0\u884C\u6388\u6743" }) }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4ECE\u5DF2\u51C6\u5907\u6E05\u5355\u4E2D\u6279\u51C6\u4E00\u4E2A\u6709\u9650\u96C6\u5408\uFF0C\u53EA\u8986\u76D6\u56FA\u5B9A\u6E90\u7801\u4E0E\u5951\u7EA6\u3002\u6279\u51C6\u548C\u6FC0\u6D3B\u4E0D\u542F\u52A8\u6A21\u578B\u6216\u8BA1\u7B97\uFF1B\u672A\u77E5\u65B0\u6E05\u5355\u4E0D\u81EA\u52A8\u52A0\u5165\u3002\u4FEE\u6539\u8303\u56F4\u6216\u7EED\u671F\u8BF7\u4F7F\u7528\u65B0\u7684\u4E13\u7528\u4E3B\u4F1A\u8BDD\u3002" }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u51C6\u5907 RunGrant \u8349\u6848" }),
        /* @__PURE__ */ jsxs("form", { className: "form-body", onSubmit: (e) => {
          e.preventDefault();
          void this.prepare(new FormData(e.currentTarget));
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u4E13\u7528\u4E3B\u534F\u8C03\u4F1A\u8BDD",
            /* @__PURE__ */ jsxs("select", { name: "sessionId", required: true, children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5C1A\u672A\u7ED1\u5B9A RunGrant \u7684\u4E3B\u4F1A\u8BDD" }),
              data.sessions.filter((s) => s.role === "coordinator" && !s.taskId && s.state !== "archived" && !s.runGrantId).map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
                s.title,
                " \xB7 ",
                short(s.id)
              ] }, s.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsxs("legend", { children: [
              "\u56FA\u5B9A\u8FD0\u884C\u6E05\u5355\uFF08\u5DF2\u9009 ",
              this.state.intentIds.length,
              "/20\uFF09"
            ] }),
            data.intents.filter((i) => eligible.some((row) => row.id === i.id) || this.state.intentIds.includes(i.id)).map((i) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", name: "intentIds", value: i.id, checked: this.state.intentIds.includes(i.id), disabled: !this.state.intentIds.includes(i.id) && this.state.intentIds.length >= 20, onChange: (e) => this.setState({ intentIds: e.target.checked ? [...this.state.intentIds, i.id] : this.state.intentIds.filter((id) => id !== i.id) }) }),
              data.experiments.find((e) => e.id === i.experimentId)?.title ?? short(i.experimentId),
              " \xB7 \u6E05\u5355 ",
              short(i.id),
              " \xB7 \u4FEE\u8BA2 ",
              i.manifest.experimentRevision,
              !eligible.some((row) => row.id === i.id) ? " \xB7 \u5DF2\u4E0D\u53EF\u7528\u4E8E\u65B0\u6388\u6743" : ""
            ] }, i.id)),
            !eligible.length ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5148\u5728\u5B9E\u9A8C\u8BE6\u60C5\u51C6\u5907\u8FD0\u884C\uFF0C\u4FDD\u7559\u539F\u6279\u51C6\u4E3A\u5F85\u6279\u51C6\u72B6\u6001\uFF1B\u5DF2\u63D0\u4EA4\u6216\u5DF2\u7ED1\u5B9A\u6E05\u5355\u4E0D\u80FD\u52A0\u5165\u3002" }) : null
          ] }),
          this.state.intentIds.length ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => this.setState({ intentIds: [] }), children: "\u6E05\u7A7A\u6E05\u5355\u9009\u62E9" }) : null,
          !available ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u6240\u9009\u6E05\u5355\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u3002" }) : null,
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6700\u591A\u8FD0\u884C\u63D0\u4EA4\u6B21\u6570",
              /* @__PURE__ */ jsx("input", { name: "maxRuns", type: "number", required: true, min: 1, max: Math.max(1, this.state.intentIds.length), defaultValue: 1 })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6388\u6743\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF09",
              /* @__PURE__ */ jsx("input", { name: "expiresAt", type: "datetime-local", required: true, defaultValue: expiry() })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || !available || !this.state.intentIds.length, children: "\u4FDD\u5B58\u51BB\u7ED3\u96C6\u5408\u8349\u6848" })
        ] })
      ] }),
      grants.length ? /* @__PURE__ */ jsxs("label", { children: [
        "\u67E5\u770B\u8FD0\u884C\u6388\u6743",
        /* @__PURE__ */ jsxs("select", { value: this.state.selected, onChange: (e) => this.select(e.target.value), children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6388\u6743\u8BB0\u5F55" }),
          grants.map((g) => /* @__PURE__ */ jsxs("option", { value: g.id, children: [
            short(g.id),
            " \xB7 ",
            g.state
          ] }, g.id))
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6682\u65E0 RunGrant\uFF1B\u672A\u7ED1\u5B9A\u6E05\u5355\u4ECD\u53EF\u7531\u7528\u6237\u72EC\u7ACB\u9010\u6B21\u6279\u51C6\u3002" }),
      this.state.selected ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: this.state.reading, onClick: () => void this.inspect(this.state.selected), children: "\u91CD\u65B0\u6838\u9A8C\u6B64\u8FD0\u884C\u6388\u6743" }) : null,
      this.state.reading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u56FA\u5B9A\u96C6\u5408\u4E0E\u7528\u91CF\u2026" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      grant ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          "RunGrant ",
          short(grant.id),
          " ",
          /* @__PURE__ */ jsx(Badge, { value: grant.state })
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5F53\u524D\u72B6\u6001\uFF1A",
          grant.effectiveState,
          " \xB7 ",
          grant.validity
        ] }),
        grant.reasons.map((reason, i) => /* @__PURE__ */ jsx("p", { className: "notice-inline", role: "status", children: reason }, i)),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5DF2\u7528 ",
          grant.usage.used,
          " / \u989D\u5EA6 ",
          grant.usage.limit,
          " / \u5269\u4F59 ",
          grant.usage.remaining,
          " \u6B21\u3002\u5931\u8D25\u3001\u53D6\u6D88\u6216\u672A\u77E5\u72B6\u6001\u4E0D\u9000\u6B21\u6570\uFF1B\u91CD\u653E\u540C\u4E00\u6E05\u5355\u4E0D\u521B\u5EFA\u7B2C\u4E8C\u4E2A Run\u3002"
        ] }),
        /* @__PURE__ */ jsxs("dl", { className: "details", children: [
          /* @__PURE__ */ jsx("dt", { children: "\u6307\u5B9A\u4E3B\u4F1A\u8BDD" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            short(grant.sessionId),
            this.props.onSession ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: !data.sessions.some((s) => s.id === grant.sessionId), onClick: () => this.props.onSession?.(grant.sessionId), children: "\u6253\u5F00\u6307\u5B9A Pi \u4F1A\u8BDD" }) : null
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u6A21\u578B" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            grant.model.provider,
            " / ",
            grant.model.model
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6388\u6743\u622A\u6B62" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            new Date(grant.expiresAt).toLocaleString(),
            " \xB7 ",
            grant.expiresAt
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u6388\u6743\u6279\u51C6" }),
          /* @__PURE__ */ jsx("dd", { children: short(grant.approvalId) }),
          /* @__PURE__ */ jsx("dt", { children: "\u96C6\u5408\u6458\u8981" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: grant.digest }) })
        ] }),
        grant.manifests.map((item) => {
          const intent = data.intents.find((i) => i.id === item.intentId), runId = grant.uses.find((use) => use.intentId === item.intentId)?.runId ?? intent?.runId, run = data.runs.find((r) => r.id === runId && r.experimentId === item.experimentId);
          return /* @__PURE__ */ jsxs("article", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h4", { children: [
              data.experiments.find((e) => e.id === item.experimentId)?.title ?? short(item.experimentId),
              " \xB7 \u6E05\u5355 ",
              short(item.intentId)
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u56FA\u5B9A\u4FEE\u8BA2 ",
              item.experimentRevision,
              " \xB7 \u539F\u6279\u51C6 ",
              short(item.approvalId),
              " \xB7 ",
              label(data.approvals.find((a) => a.id === item.approvalId)?.status ?? "pending")
            ] }),
            /* @__PURE__ */ jsxs("code", { className: "digest code-wrap", style: { display: "block" }, children: [
              "\u6E90\u7801 ",
              item.sourceDigest
            ] }),
            /* @__PURE__ */ jsxs("dl", { className: "details", children: [
              /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A argv" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: JSON.stringify(item.contract.command) }) }),
              /* @__PURE__ */ jsx("dt", { children: "\u6267\u884C\u73AF\u5883" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: item.contract.runner === "local" ? `\u672C\u5730 ${item.contract.localRuntimeId} \xB7 \u5F53\u524D\u7528\u6237\u6743\u9650\uFF0C\u6587\u4EF6\u4E0E\u7F51\u7EDC\u4E0D\u9694\u79BB` : item.contract.image ?? "\u53D7\u4FE1\u672C\u5730\u6570\u503C\u793A\u4F8B" }) }),
              /* @__PURE__ */ jsx("dt", { children: "Docker context" }),
              /* @__PURE__ */ jsx("dd", { children: item.contract.dockerContext ?? "\u4E0D\u9002\u7528" }),
              /* @__PURE__ */ jsx("dt", { children: "\u8D44\u6E90" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                item.contract.cpus,
                " CPU \xB7 ",
                item.contract.memoryMb,
                " MiB \xB7 ",
                item.contract.timeoutSeconds,
                " \u79D2",
                item.contract.gpu ? /* @__PURE__ */ jsxs("p", { className: "code-wrap", children: [
                  "NVIDIA\uFF1A",
                  item.contract.gpu.deviceIds.join("\u3001")
                ] }) : null
              ] }),
              /* @__PURE__ */ jsx("dt", { children: "\u6570\u636E / \u534F\u8BAE" }),
              /* @__PURE__ */ jsxs("dd", { children: [
                item.contract.datasetVersion,
                " / ",
                item.contract.evaluationProtocolVersion
              ] })
            ] }),
            runId ? /* @__PURE__ */ jsxs("button", { className: "secondary compact", disabled: !run || !this.props.onRun, onClick: () => this.props.onRun?.(runId, item.experimentId), children: [
              "\u67E5\u770B\u5B9E\u9645 Run ",
              short(runId),
              " \xB7 ",
              label(run?.state ?? "\u7B49\u5F85\u8BB0\u5F55\u5237\u65B0")
            ] }) : /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: busy || !runGrantUsable(grant) || intent?.runGrant?.id !== grant.id, onClick: () => void this.submit(item.intentId, item.experimentId), children: "\u63D0\u4EA4\u6B64\u56FA\u5B9A\u6E05\u5355\uFF08\u8BA1\u4E00\u6B21\uFF09" })
          ] }, item.intentId);
        }),
        /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          grant.state === "draft" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || grant.validity !== "current" || grant.effectiveState !== "draft", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u56FA\u5B9A\u96C6\u5408\u5DF2\u6279\u51C6\uFF1B\u5C1A\u672A\u6FC0\u6D3B"), children: "\u6279\u51C6\u6B64\u56FA\u5B9A\u96C6\u5408" }) : null,
          grant.state === "draft" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || grant.validity !== "current" || grant.effectiveState !== "draft", onClick: () => perform(() => this.call("run_grant_activate", { grantId: grant.id, expectedVersion: grant.version }), "\u8FD0\u884C\u6388\u6743\u5DF2\u6FC0\u6D3B\uFF1B\u672A\u542F\u52A8\u6A21\u578B\u6216 Run"), children: "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u8FD0\u884C\u6388\u6743" }) : null,
          grant.state !== "revoked" ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => this.call("run_grant_revoke", { grantId: grant.id, expectedVersion: grant.version }), "\u5DF2\u64A4\u9500\u8FD0\u884C\u6388\u6743\uFF1B\u5386\u53F2\u5B57\u8282\u4E0E\u53D6\u6D88\u5165\u53E3\u4FDD\u7559"), children: "\u64A4\u9500\u8FD0\u884C\u6388\u6743" }) : null
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u5B8C\u6574\u56FA\u5B9A\u96C6\u5408\u4E0E\u8BA1\u6B21\u8BB0\u5F55" }),
          /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify(grant, null, 2) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u81EA\u7136\u5230\u671F\u4E0D\u4F5C\u5E9F\u5DF2\u5B8C\u6210\u8BC1\u636E\uFF1B\u663E\u5F0F\u64A4\u9500\u963B\u65AD\u4F9D\u8D56\u8BE5\u6388\u6743\u7684\u65B0\u4EA4\u4ED8\u3002\u5B9E\u9645\u8FD0\u884C\u7684\u65E5\u5FD7\u4E0E\u53D6\u6D88\u5165\u53E3\u5728\u7CBE\u786E Run \u8BE6\u60C5\u4E2D\u3002" })
      ] }) : null
    ] });
  }
}
export {
  RunGrants,
  readRunGrantDraft,
  runGrantUsable
};
