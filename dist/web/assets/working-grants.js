import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { short, label } from "./models.js";
import { Badge, nativeSelectButton } from "./ui.js";
const localExpiry = () => {
  const date = new Date(Date.now() + 36e5);
  return new Date(date.getTime() - date.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
};
function readWorkingGrantDraft(fd) {
  const expires = new Date(String(fd.get("expiresAt")));
  if (!Number.isFinite(expires.getTime())) throw Error("\u8BF7\u9009\u62E9\u6709\u6548\u7684\u6388\u6743\u622A\u6B62\u65F6\u95F4");
  return { developmentTaskId: String(fd.get("developmentTaskId")), editablePaths: [.../* @__PURE__ */ new Set([...fd.getAll("editablePaths").map(String), ...String(fd.get("newPaths") ?? "").split(/\r?\n/).map((p) => p.trim()).filter(Boolean)])], maxTests: Number(fd.get("maxTests")), maxChangedBytes: Number(fd.get("maxChangedBytes")), expiresAt: expires.toISOString() };
}
const signature = (props) => JSON.stringify([(props.data.workingGrants ?? []).filter((g) => g.sessionId === props.session.id), props.session.workingGrantId, props.data.approvals]);
class WorkingGrants extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { selected: "", template: "", files: [], inspection: null, reading: false, error: "" };
    this.mounted = true;
    this.epoch = 0;
    this.filesEpoch = 0;
  }
  componentDidMount() {
    void this.loadFiles();
    const selected = this.props.session.workingGrantId ?? (this.props.data.workingGrants ?? []).filter((g) => g.sessionId === this.props.session.id).slice(-1)[0]?.id;
    if (selected) void this.inspect(selected);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.epoch++;
    this.filesEpoch++;
  }
  componentDidUpdate(previous) {
    if (previous.session.id !== this.props.session.id || previous.data.project.id !== this.props.data.project.id) {
      this.epoch++;
      this.filesEpoch++;
      this.setState({ selected: "", template: "", files: [], inspection: null, reading: false, error: "" });
      void this.loadFiles();
      if (this.props.session.workingGrantId) void this.inspect(this.props.session.workingGrantId);
    } else if (signature(previous) !== signature(this.props) && this.state.selected) void this.inspect(this.state.selected);
  }
  call(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input });
  }
  async loadFiles() {
    const epoch = ++this.filesEpoch, sessionId = this.props.session.id, projectId = this.props.data.project.id;
    try {
      const files = await api("/operations/workspace_list", { projectId, sessionId, input: { source: "session" } });
      if (this.mounted && epoch === this.filesEpoch && sessionId === this.props.session.id && projectId === this.props.data.project.id) this.setState({ files });
    } catch (error) {
      if (this.mounted && epoch === this.filesEpoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  async inspect(grantId) {
    const epoch = ++this.epoch, sessionId = this.props.session.id, projectId = this.props.data.project.id;
    this.setState({ selected: grantId, inspection: null, reading: true, error: "" });
    try {
      const grant = await this.call("working_grant_inspect", { grantId });
      if (grant.id !== grantId || grant.sessionId !== sessionId) throw Error("\u6388\u6743\u4E0D\u5C5E\u4E8E\u6240\u9009\u5B9E\u73B0\u4F1A\u8BDD");
      if (this.mounted && epoch === this.epoch && sessionId === this.props.session.id && projectId === this.props.data.project.id) this.setState({ inspection: grant });
    } catch (error) {
      if (this.mounted && epoch === this.epoch) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.mounted && epoch === this.epoch) this.setState({ reading: false });
    }
  }
  async prepare(fd) {
    const epoch = this.epoch, sessionId = this.props.session.id, projectId = this.props.data.project.id;
    await this.props.perform(async () => {
      const grant = await this.call("working_grant_prepare", readWorkingGrantDraft(fd));
      if (this.mounted && epoch === this.epoch && sessionId === this.props.session.id && projectId === this.props.data.project.id) await this.inspect(grant.id);
    }, "WorkingGrant \u8349\u6848\u5DF2\u4FDD\u5B58\uFF1B\u5C1A\u672A\u6279\u51C6\u6216\u6FC0\u6D3B\uFF0C\u4E5F\u672A\u542F\u52A8\u6A21\u578B\u6216\u6D4B\u8BD5");
  }
  render() {
    const { data, session, busy, dirty, perform } = this.props, grants = (data.workingGrants ?? []).filter((g) => g.sessionId === session.id), templates = (data.developmentTasks ?? []).filter((t) => t.sessionId === session.id && t.state === "prepared" && !t.jobId && !t.manifest.workingGrant), template = templates.find((t) => t.id === this.state.template), grant = this.state.inspection, approval = grant ? data.approvals.find((a) => a.id === grant.approvalId) : void 0;
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u79C1\u6709\u5B9E\u73B0\u4E0E\u6709\u9650\u6D4B\u8BD5\u6388\u6743" }) }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4E00\u6B21\u6279\u51C6\u6307\u5B9A\u8DEF\u5F84\u7684\u79C1\u6709\u5B9E\u73B0\u548C\u6709\u9650\u5F00\u53D1\u6D4B\u8BD5\u3002\u6A21\u578B\u8C03\u7528\u3001\u534F\u4F5C\u5BA1\u67E5\u3001\u6574\u5408\u3001\u6B63\u5F0F Run\u3001\u53D1\u73B0\u4E0E\u53D1\u5E03\u4ECD\u5404\u81EA\u6279\u51C6\u3002\u521B\u5EFA\u8349\u6848\u548C\u6FC0\u6D3B\u4E0D\u4F1A\u542F\u52A8\u6A21\u578B\u6216\u6D4B\u8BD5\u3002" }),
      session.workingGrantId ? /* @__PURE__ */ jsxs("p", { className: "notice-inline", children: [
        "\u6B64\u4F1A\u8BDD\u5DF2\u6301\u4E45\u7ED1\u5B9A WorkingGrant ",
        short(session.workingGrantId),
        "\u3002\u65E7\u5355\u6B21\u6D4B\u8BD5\u6E05\u5355\u4E0D\u80FD\u7ED5\u8FC7\u6388\u6743\uFF1B\u65B0\u6D4B\u8BD5\u8BF7\u91CD\u65B0\u51C6\u5907\u3002\u4FEE\u6539\u8303\u56F4\u6216\u7EED\u671F\u987B\u65B0\u5EFA\u4E13\u7528\u4F1A\u8BDD\u3002"
      ] }) : null,
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u4ECE\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5\u6A21\u677F\u51C6\u5907\u6388\u6743" }),
        /* @__PURE__ */ jsxs("form", { className: "form-body", onSubmit: (e) => {
          e.preventDefault();
          void this.prepare(new FormData(e.currentTarget));
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5DF2\u51C6\u5907\u7684\u6D4B\u8BD5\u6A21\u677F",
            /* @__PURE__ */ jsxs("select", { name: "developmentTaskId", value: this.state.template, required: true, onChange: (e) => this.setState({ template: e.target.value }), children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6B64\u4F1A\u8BDD\u7684\u56FA\u5B9A\u6D4B\u8BD5\u6E05\u5355" }),
              templates.map((t) => /* @__PURE__ */ jsxs("option", { value: t.id, children: [
                t.title,
                " \xB7 ",
                short(t.id)
              ] }, t.id))
            ] })
          ] }),
          template ? /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { children: "\u6765\u6E90\u6458\u8981" }),
            /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: template.sourceDigest }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u56FA\u5B9A\u547D\u4EE4\uFF1A",
              /* @__PURE__ */ jsx("code", { children: JSON.stringify(template.manifest.command) })
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u56FA\u5B9A\u955C\u50CF\uFF1A",
              /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: template.manifest.environmentImageDigest })
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Docker context\uFF1A",
              template.manifest.dockerContext
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u8D44\u6E90\uFF1A",
              Object.entries(template.manifest.resources).map(([k, v]) => `${k}=${v}`).join(" \xB7 ")
            ] })
          ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5148\u5728\u4E0B\u65B9\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5\u6E05\u5355\uFF1B\u6A21\u677F\u4E0D\u9700\u8981\u5148\u6279\u51C6\u6216\u63D0\u4EA4\u3002" }),
          /* @__PURE__ */ jsxs("fieldset", { children: [
            /* @__PURE__ */ jsx("legend", { children: "\u5141\u8BB8\u7F16\u8F91\u7684\u7CBE\u786E\u6587\u4EF6\u8DEF\u5F84" }),
            this.state.files.map((file) => /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", name: "editablePaths", value: file.path }),
              /* @__PURE__ */ jsx("code", { children: file.path })
            ] }, file.path)),
            /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: busy, onClick: () => void this.loadFiles(), children: "\u5237\u65B0\u79C1\u6709\u6587\u4EF6\u5217\u8868" })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5141\u8BB8\u65B0\u5EFA\u7684\u76F8\u5BF9\u8DEF\u5F84\uFF08\u53EF\u9009\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
            /* @__PURE__ */ jsx("textarea", { name: "newPaths", rows: 2, placeholder: "\u4F8B\u5982 tests/check.py\uFF1B\u4E0D\u652F\u6301\u901A\u914D\u7B26" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6700\u591A\u6D4B\u8BD5\u63D0\u4EA4\u6B21\u6570",
              /* @__PURE__ */ jsx("input", { name: "maxTests", type: "number", required: true, min: 1, max: 20, defaultValue: 2 })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u53D8\u5316\u5B57\u8282\u4E0A\u9650",
              /* @__PURE__ */ jsx("input", { name: "maxChangedBytes", type: "number", required: true, min: 1, max: 2097152, defaultValue: 262144 })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6388\u6743\u622A\u6B62\uFF08\u672C\u5730\u65F6\u95F4\uFF09",
            /* @__PURE__ */ jsx("input", { name: "expiresAt", type: "datetime-local", required: true, defaultValue: localExpiry() })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || dirty || !template || !session.sourceRevisionId || !!session.workingGrantId, children: "\u4FDD\u5B58\u56FA\u5B9A\u6388\u6743\u8349\u6848" })
        ] })
      ] }),
      grants.length ? /* @__PURE__ */ jsxs("label", { children: [
        "\u67E5\u770B\u6388\u6743",
        /* @__PURE__ */ jsxs("select", { value: this.state.selected, onChange: (e) => void this.inspect(e.target.value), children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "\u9009\u62E9\u6388\u6743\u8BB0\u5F55" }),
          grants.map((g) => /* @__PURE__ */ jsxs("option", { value: g.id, children: [
            short(g.id),
            " \xB7 ",
            g.state
          ] }, g.id))
        ] })
      ] }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6B64\u4F1A\u8BDD\u5C1A\u65E0 WorkingGrant\uFF1B\u672A\u7ED1\u5B9A\u6388\u6743\u7684\u5386\u53F2\u4F1A\u8BDD\u7EE7\u7EED\u9010\u6B21\u6279\u51C6\u6D4B\u8BD5\u3002" }),
      this.state.selected ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: this.state.reading, onClick: () => void this.inspect(this.state.selected), children: "\u91CD\u65B0\u6838\u9A8C\u6B64\u6388\u6743" }) : null,
      this.state.reading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u6B63\u5728\u6838\u5BF9\u6388\u6743\u4E0E\u7528\u91CF\u2026" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      grant ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { children: [
          "\u56FA\u5B9A\u6388\u6743 ",
          short(grant.id)
        ] }),
        /* @__PURE__ */ jsx(Badge, { value: grant.state }),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u5F53\u524D\u6709\u6548\u72B6\u6001\uFF1A",
          grant.effectiveState,
          " \xB7 ",
          grant.validity
        ] }),
        grant.reasons.map((reason, i) => /* @__PURE__ */ jsx("p", { className: "notice-inline", role: "status", children: reason }, i)),
        /* @__PURE__ */ jsxs("p", { children: [
          "\u6D4B\u8BD5\u63D0\u4EA4\u6B21\u6570\uFF1A\u5DF2\u7528 ",
          grant.usage.used,
          " / \u6700\u591A ",
          grant.usage.limit,
          " / \u5269\u4F59 ",
          grant.usage.remaining,
          "\u3002\u5931\u8D25\u3001\u53D6\u6D88\u6216\u672A\u77E5\u72B6\u6001\u5747\u8BA1\u6B21\uFF0C\u4E0D\u81EA\u52A8\u9000\u8FD8\u3002"
        ] }),
        /* @__PURE__ */ jsxs("dl", { className: "details", children: [
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u4E3B\u4F1A\u8BDD" }),
          /* @__PURE__ */ jsx("dd", { children: short(grant.sessionId) }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u6A21\u578B" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            grant.model.provider,
            " / ",
            grant.model.model
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u8D77\u59CB\u79C1\u6709\u6E90\u7801" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: grant.baselineSnapshot.digest }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u6765\u6E90\u4FEE\u8BA2" }),
          /* @__PURE__ */ jsx("dd", { children: grant.sourceRevisionId }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A argv" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: JSON.stringify(grant.command) }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u955C\u50CF" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: grant.environmentImageDigest }) }),
          /* @__PURE__ */ jsx("dt", { children: "Docker context" }),
          /* @__PURE__ */ jsx("dd", { children: grant.dockerContext }),
          /* @__PURE__ */ jsx("dt", { children: "\u8D44\u6E90\u4E0A\u9650" }),
          /* @__PURE__ */ jsx("dd", { children: Object.entries(grant.resources).map(([k, v]) => `${k}=${v}`).join(" \xB7 ") }),
          /* @__PURE__ */ jsx("dt", { children: "\u53D8\u5316\u5B57\u8282\u4E0A\u9650" }),
          /* @__PURE__ */ jsx("dd", { children: grant.maxChangedBytes }),
          /* @__PURE__ */ jsx("dt", { children: "\u6388\u6743\u622A\u6B62" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            new Date(grant.expiresAt).toLocaleString(),
            " \xB7 ",
            grant.expiresAt
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u53EF\u7F16\u8F91\u7CBE\u786E\u8DEF\u5F84" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("ul", { children: grant.editablePaths.map((path) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("code", { children: path }) }, path)) }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u5FC5\u9700\u6D4B\u8BD5\u4EA7\u7269" }),
          /* @__PURE__ */ jsx("dd", { children: grant.expectedArtifacts.join("\u3001") || "\u65E0\u58F0\u660E\u6587\u4EF6" }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u8F93\u5165\u6570\u636E" }),
          /* @__PURE__ */ jsx("dd", { children: grant.dataArtifacts.length ? /* @__PURE__ */ jsx("ul", { children: grant.dataArtifacts.map((a) => /* @__PURE__ */ jsxs("li", { children: [
            data.artifacts.find((item) => item.id === a.id)?.title ?? short(a.id),
            " \xB7 ",
            a.size,
            " \u5B57\u8282",
            /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: a.digest })
          ] }, a.id)) }) : "\u65E0\u989D\u5916\u6570\u636E\u4EA7\u7269" })
        ] }),
        /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u5B8C\u6574\u56FA\u5B9A\u6388\u6743\u4E0E\u6D3E\u751F\u7528\u91CF\u8BB0\u5F55" }),
          /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify(grant, null, 2) })
        ] }),
        /* @__PURE__ */ jsx("h4", { children: "\u5DF2\u8BA1\u6B21\u6D4B\u8BD5" }),
        grant.uses.length ? /* @__PURE__ */ jsx("ul", { children: grant.uses.map((use) => {
          const job = data.sandboxJobs?.find((j) => j.id === use.jobId);
          return /* @__PURE__ */ jsxs("li", { children: [
            "\u6D4B\u8BD5 ",
            short(use.jobId),
            " \xB7 ",
            label(job?.state ?? "\u7B49\u5F85\u72B6\u6001\u5237\u65B0"),
            " \xB7 \u56FA\u5B9A\u6E05\u5355 ",
            short(use.developmentTaskId)
          ] }, use.id);
        }) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5C1A\u65E0\u6D4B\u8BD5\u63D0\u4EA4\uFF1B\u51C6\u5907\u6E05\u5355\u4E0D\u8BA1\u6B21\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          grant.state === "draft" && approval?.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || dirty || grant.validity !== "current" || grant.effectiveState !== "draft", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u5DF2\u6279\u51C6\u56FA\u5B9A\u6388\u6743\uFF1B\u5C1A\u672A\u6FC0\u6D3B"), children: "\u6279\u51C6\u6B64\u56FA\u5B9A\u5B9E\u73B0\u4E0E\u6D4B\u8BD5\u8303\u56F4" }) : null,
          grant.state === "draft" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || dirty || grant.validity !== "current" || grant.effectiveState !== "draft", onClick: () => perform(() => this.call("working_grant_activate", { grantId: grant.id, expectedVersion: grant.version }), "\u6388\u6743\u5DF2\u6FC0\u6D3B\uFF1B\u672A\u542F\u52A8\u6A21\u578B\u6216\u6D4B\u8BD5"), children: "\u6FC0\u6D3B\u5DF2\u6279\u51C6\u6388\u6743" }) : null,
          grant.state !== "revoked" ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => this.call("working_grant_revoke", { grantId: grant.id, expectedVersion: grant.version }), "\u5DF2\u64A4\u9500\u6388\u6743\uFF1B\u5386\u53F2\u4FDD\u7559\uFF0C\u5728\u9014\u6D4B\u8BD5\u4EE5\u6267\u884C\u5668\u5B9E\u9645\u9000\u51FA\u4E3A\u51C6"), children: "\u64A4\u9500\u6B64\u6388\u6743" }) : null
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5230\u671F\u963B\u6B62\u65B0\u7684\u526F\u4F5C\u7528\uFF0C\u5DF2\u5B8C\u6210\u8BB0\u5F55\u4ECD\u53EF\u6838\u9A8C\uFF1B\u663E\u5F0F\u64A4\u9500\u4F1A\u4F7F\u4F9D\u8D56\u8BE5\u6388\u6743\u7684\u65B0\u5BA1\u67E5\u3001\u6574\u5408\u3001\u8FD0\u884C\u548C\u4EA4\u4ED8\u5931\u6548\u3002\u53D6\u6D88\u4E0E\u65E5\u5FD7\u8BFB\u53D6\u7EE7\u7EED\u4FDD\u7559\u3002" })
      ] }) : null
    ] });
  }
}
export {
  WorkingGrants,
  readWorkingGrantDraft
};
