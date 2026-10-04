import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { WorkingGrants } from "./working-grants.js";
import { LogView } from "./log-view.js";
import { ComputeWait } from "./scheduler-view.js";
import { api, artifactText, downloadArtifact } from "./api.js";
import { short, label } from "./models.js";
import { SectionTitle, Badge, Empty, nativeSelectButton } from "./ui.js";
const op = (projectId, sessionId, name, input = {}) => api(`/operations/${name}`, { projectId, sessionId, input });
const message = (error) => error instanceof Error ? error.message : String(error);
class PrivateWorkspace extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { git: null, diff: null, files: [], path: "", content: "", digest: null, dirty: false, error: "" };
    this.mounted = true;
    this.reading = 0;
    this.polling = false;
  }
  componentDidMount() {
    void this.poll();
    this.timer = window.setInterval(() => void this.poll(), 2e3);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.reading++;
    clearInterval(this.timer);
  }
  call(name, input = {}) {
    return op(this.props.projectId, this.props.session.id, name, input);
  }
  async poll() {
    if (this.polling) return;
    this.polling = true;
    try {
      const git = await this.call("workspace_history_inspect");
      const files = await this.call("workspace_list", { source: "session" });
      const diff = git.state === "ready" ? await this.call("workspace_history_diff") : null;
      if (this.mounted) {
        this.setState({ git, files, diff, error: "" });
        this.props.onReady(git.state === "ready");
      }
    } catch (error) {
      if (this.mounted) {
        this.setState({ error: message(error) });
        this.props.onReady(false);
      }
    } finally {
      this.polling = false;
    }
  }
  async open(path) {
    if (this.state.dirty && !confirm("\u6709\u672A\u4FDD\u5B58\u7684\u79C1\u6709\u6E90\u7801\uFF0C\u653E\u5F03\u540E\u5207\u6362\u6587\u4EF6\uFF1F")) return;
    const seq = ++this.reading;
    await this.props.perform(async () => {
      const file = await this.call("workspace_read", { source: "session", path });
      if (this.mounted && seq === this.reading) {
        this.setState({ path, content: file.content, digest: file.digest, dirty: false });
        this.props.onDirty(false);
      }
    });
  }
  render() {
    const { git, diff } = this.state, ready = git?.state === "ready", { session, perform, busy, blocked, editablePaths } = this.props, writable = ready && !blocked && (!editablePaths || editablePaths.includes(this.state.path));
    return /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u79C1\u6709\u6E90\u7801\u4E0E Git" }),
        git ? /* @__PURE__ */ jsx(Badge, { value: git.state }) : /* @__PURE__ */ jsx("span", { children: "\u8BFB\u53D6\u72B6\u6001\u2026" })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u4F1A\u8BDD ",
        short(session.id),
        " \xB7 \u6765\u6E90 ",
        short(session.sourceRevisionId),
        "\u3002\u8FD9\u91CC\u53EA\u7F16\u8F91\u6240\u9009\u4F1A\u8BDD\uFF0C\u9879\u76EE\u521D\u59CB\u6587\u4EF6\u4FDD\u6301\u539F\u6837\u3002"
      ] }),
      git?.head ? /* @__PURE__ */ jsxs("code", { className: "digest", children: [
        "HEAD ",
        git.head
      ] }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      git?.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: git.error }) : null,
      ["failed", "conflict"].includes(git?.state) ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(async () => {
        await api(`/projects/${this.props.projectId}/git-retry`, { operationId: git.operationId });
        await this.poll();
      }), children: "\u6062\u590D\u6B64 Git \u64CD\u4F5C" }) : null,
      blocked ? /* @__PURE__ */ jsx("p", { className: "notice-inline", children: "\u5F53\u524D WorkingGrant \u4E0D\u5141\u8BB8\u65B0\u589E\u7F16\u8F91\u6216\u6D4B\u8BD5\uFF1B\u56FA\u5B9A\u5386\u53F2\u3001\u65E5\u5FD7\u4E0E\u53D6\u6D88\u5165\u53E3\u4ECD\u53EF\u4F7F\u7528\u3002" }) : null,
      !ready ? /* @__PURE__ */ jsx("p", { className: "notice", children: "Git \u5C31\u7EEA\u540E\u624D\u80FD\u7F16\u8F91\u3001\u63D0\u4EA4\u548C\u51C6\u5907\u6D4B\u8BD5\u3002\u5931\u8D25\u6216\u51B2\u7A81\u65F6\u4FDD\u7559\u539F\u5DE5\u4F5C\u533A\uFF0C\u8BF7\u67E5\u770B\u9519\u8BEF\u540E\u663E\u5F0F\u6062\u590D\u3002" }) : null,
      /* @__PURE__ */ jsxs("label", { children: [
        "\u79C1\u6709\u6E90\u7801\u6587\u4EF6",
        /* @__PURE__ */ jsxs("select", { "aria-label": "\u79C1\u6709\u6E90\u7801\u6587\u4EF6", value: this.state.path, onChange: (e) => {
          if (e.target.value) void this.open(e.target.value);
        }, children: [
          nativeSelectButton,
          /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u6587\u4EF6" }),
          this.state.files.map((f) => /* @__PURE__ */ jsxs("option", { value: f.path, children: [
            f.path,
            " \xB7 ",
            f.size,
            " \u5B57\u8282"
          ] }, f.path))
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: !ready || busy || blocked, onClick: () => {
        if (this.state.dirty && !confirm("\u653E\u5F03\u672A\u4FDD\u5B58\u5185\u5BB9\u5E76\u65B0\u5EFA\u6587\u4EF6\uFF1F")) return;
        const path = prompt("\u79C1\u6709\u6587\u4EF6\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4F8B\u5982 main.py");
        if (path) {
          if (editablePaths && !editablePaths.includes(path)) {
            this.setState({ error: "\u6B64\u8DEF\u5F84\u4E0D\u5728\u56FA\u5B9A\u6388\u6743\u8303\u56F4\u5185\uFF0C\u8BF7\u9009\u62E9\u5DF2\u6279\u51C6\u7684\u7CBE\u786E\u8DEF\u5F84\u3002" });
            return;
          }
          this.reading++;
          this.setState({ path, content: "", digest: null, dirty: true });
          this.props.onDirty(true);
        }
      }, children: "\u65B0\u5EFA\u79C1\u6709\u6587\u4EF6" }),
      this.state.path ? /* @__PURE__ */ jsxs("div", { children: [
        editablePaths && !editablePaths.includes(this.state.path) ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B64\u6587\u4EF6\u53EF\u8BFB\u53D6\uFF0C\u4F46\u4E0D\u5728\u6388\u6743\u53EF\u7F16\u8F91\u8DEF\u5F84\u4E2D\u3002" }) : null,
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("code", { children: this.state.path }),
          this.state.dirty ? " \xB7 \u672A\u4FDD\u5B58" : ""
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u79C1\u6709\u6E90\u7801\u5185\u5BB9",
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u79C1\u6709\u6E90\u7801\u5185\u5BB9", className: "code-input", rows: 14, spellCheck: false, readOnly: !writable || busy, value: this.state.content, onChange: (e) => {
            this.setState({ content: e.target.value, dirty: true });
            this.props.onDirty(true);
          } })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          /* @__PURE__ */ jsx("button", { className: "primary compact", disabled: !writable || busy || !this.state.dirty, onClick: () => perform(async () => {
            const file = await this.call("workspace_write", { source: "session", path: this.state.path, content: this.state.content, expectedDigest: this.state.digest });
            if (this.mounted) {
              this.setState({ digest: file.digest, dirty: false });
              this.props.onDirty(false);
              await this.poll();
            }
          }, "\u79C1\u6709\u6E90\u7801\u5DF2\u4FDD\u5B58"), children: "\u4FDD\u5B58\u79C1\u6709\u6E90\u7801" }),
          /* @__PURE__ */ jsx("button", { className: "text-button", disabled: busy, onClick: () => void this.open(this.state.path), children: "\u91CD\u65B0\u8BFB\u53D6" })
        ] })
      ] }) : null,
      diff ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { children: "\u4E0E\u5DF2\u4FDD\u5B58 Git \u7248\u672C\u7684\u5DEE\u5F02" }),
        diff.files.length ? /* @__PURE__ */ jsx("ul", { children: diff.files.map((f) => /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("code", { children: f.path }),
          " \xB7 ",
          f.status,
          " \xB7 ",
          f.beforeMode ?? "\u65E0",
          " \u2192 ",
          f.afterMode ?? "\u65E0"
        ] }, f.path)) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5F53\u524D\u6CA1\u6709\u672A\u63D0\u4EA4\u7684\u6E90\u7801\u53D8\u5316\u3002" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          void perform(async () => {
            await this.call("workspace_history_commit", { expectedHead: git.head, message: fd.get("message") });
            await this.poll();
          }, "\u5DF2\u6392\u961F\u4FDD\u5B58 Git \u7248\u672C");
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u63D0\u4EA4\u8BF4\u660E",
            /* @__PURE__ */ jsx("input", { name: "message", "aria-label": "Git \u63D0\u4EA4\u8BF4\u660E", required: true, maxLength: 1e3, defaultValue: "\u4FDD\u5B58\u672C\u6B21\u7814\u7A76\u5B9E\u73B0" })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || blocked || this.state.dirty || !diff.files.length, children: "\u4FDD\u5B58 Git \u7248\u672C" })
        ] })
      ] }) : null
    ] });
  }
}
class DevelopmentJob extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { expanded: false, artifact: "" };
    this.artifactEpoch = 0;
  }
  componentWillUnmount() {
    this.artifactEpoch++;
  }
  render() {
    const { job, data, perform } = this.props, terminal = ["succeeded", "failed", "cancelled", "timed_out"].includes(job.state);
    return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
      /* @__PURE__ */ jsxs("h3", { children: [
        "\u5F00\u53D1\u6D4B\u8BD5\u4F5C\u4E1A ",
        short(job.id)
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "actions", children: [
        /* @__PURE__ */ jsx(Badge, { value: job.state }),
        /* @__PURE__ */ jsx(Badge, { value: job.integrity }),
        /* @__PURE__ */ jsxs("span", { children: [
          "\u9000\u51FA\u7801 ",
          job.exitCode ?? "\u2014"
        ] })
      ] }),
      /* @__PURE__ */ jsx("code", { className: "digest code-wrap", style: { display: "block" }, children: job.sourceDigest }),
      job.manifest.workingGrant ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u6D3E\u751F\u6388\u6743 WorkingGrant ",
        short(job.manifest.workingGrant.id),
        " \xB7 \u539F\u6279\u51C6 ",
        short(job.manifest.workingGrant.approvalId),
        "\uFF1B\u6B64\u63D0\u4EA4\u5DF2\u8BA1\u6B21\u3002"
      ] }) : null,
      !terminal ? /* @__PURE__ */ jsx(ComputeWait, { data, kind: "development", id: job.id, onScheduler: this.props.onScheduler }) : null,
      job.error ? /* @__PURE__ */ jsx("p", { className: "error-text", children: job.error }) : null,
      /* @__PURE__ */ jsxs("details", { open: this.state.expanded, onToggle: (e) => {
        const expanded = e.currentTarget.open;
        if (expanded !== this.state.expanded) this.setState({ expanded });
      }, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u5F00\u53D1\u6D4B\u8BD5\u65E5\u5FD7\u4E0E\u4EA7\u7269" }),
        this.state.expanded ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(LogView, { streamLabel: "\u5F00\u53D1\u6D4B\u8BD5\u65E5\u5FD7\u6D41", read: (request, signal) => api("/operations/development_logs", { projectId: data.project.id, sessionId: this.props.sessionId, input: { jobId: job.id, ...request } }, "POST", signal) }),
          /* @__PURE__ */ jsx("ul", { children: job.artifactIds.map((id) => {
            const a = data.artifacts.find((a2) => a2.id === id);
            return /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => {
                const seq = ++this.artifactEpoch;
                void perform(async () => {
                  const content = await artifactText(id);
                  if (seq === this.artifactEpoch) this.setState({ artifact: content.slice(0, 65536) });
                });
              }, children: a?.title ?? short(id) }),
              /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => downloadArtifact(id, a?.title ?? id)), children: "\u4E0B\u8F7D" })
            ] }, id);
          }) }),
          this.state.artifact ? /* @__PURE__ */ jsx("pre", { className: "logs", children: this.state.artifact }) : null
        ] }) : null
      ] }),
      !terminal ? /* @__PURE__ */ jsx("button", { className: "text-button danger", onClick: () => perform(() => op(data.project.id, this.props.sessionId, "development_cancel", { jobId: job.id })), children: "\u53D6\u6D88\u5F00\u53D1\u6D4B\u8BD5" }) : null
    ] });
  }
}
class ImplementationView extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { experimentId: "", revision: 1, dirty: false, gitReady: false, preview: null, reviewContent: "" };
  }
  session() {
    return this.props.data.sessions.find((s) => s.id === this.props.sessionId && s.role === "coordinator" && !s.taskId && s.state !== "archived");
  }
  call(name, input = {}) {
    return op(this.props.data.project.id, this.props.sessionId, name, input);
  }
  async preview(id) {
    await this.props.perform(async () => this.setState({ preview: await api(`/change-proposals/${id}/diff`) }));
  }
  render() {
    const { data, busy, perform } = this.props, session = this.session(), workingGrant = (data.workingGrants ?? []).find((g) => g.id === session?.workingGrantId), grantWritable = !!workingGrant && workingGrant.validity === "current" && ["active", "exhausted"].includes(workingGrant.effectiveState) && Date.parse(workingGrant.expiresAt) > Date.now(), grantOpen = grantWritable && workingGrant?.effectiveState === "active", tasks = (data.developmentTasks ?? []).filter((t) => t.sessionId === session?.id), jobs = (data.sandboxJobs ?? []).filter((j) => j.sessionId === session?.id), reviews = (data.reviews ?? []).filter((r) => r.producerSessionId === session?.id), selected = data.experiments.find((e) => e.id === this.state.experimentId), proposals = data.changeProposals.filter((p) => reviews.some((r) => r.id === p.reviewId));
    return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
      /* @__PURE__ */ jsx(SectionTitle, { title: "\u5B9E\u73B0\u4E0E\u5BA1\u67E5", sub: "\u79C1\u6709\u5B9E\u73B0\u3001\u5F00\u53D1\u6D4B\u8BD5\u3001\u72EC\u7ACB\u5BA1\u67E5\u548C\u6574\u5408\u5206\u522B\u7559\u8BC1\u3001\u5206\u522B\u6279\u51C6\u3002", children: session ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || this.state.dirty, onClick: () => this.props.onChat(session.id), children: "\u56DE\u5230\u6B64\u4F1A\u8BDD\u53D1\u9001\u5B9E\u73B0\u6216\u53CD\u9988\u6307\u4EE4" }) : null }),
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u9009\u62E9\u5B9E\u73B0\u6765\u6E90" }) }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u5B9E\u73B0\u4E3B\u4F1A\u8BDD",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u5B9E\u73B0\u4E3B\u4F1A\u8BDD", value: session?.id ?? "", onChange: (e) => {
            if (this.state.dirty && !confirm("\u79C1\u6709\u6E90\u7801\u6709\u672A\u4FDD\u5B58\u4FEE\u6539\uFF0C\u653E\u5F03\u540E\u5207\u6362\u4F1A\u8BDD\uFF1F")) return;
            this.setState({ dirty: false, gitReady: false, preview: null, reviewContent: "" });
            this.props.onSession(e.target.value);
          }, children: [
            nativeSelectButton,
            /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u4E3B\u534F\u8C03\u8005\u4F1A\u8BDD" }),
            data.sessions.filter((s) => s.role === "coordinator" && !s.taskId && s.state !== "archived").map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
              s.title,
              " \xB7 ",
              short(s.id)
            ] }, s.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6765\u6E90\u5B9E\u9A8C",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u5B9E\u73B0\u6765\u6E90\u5B9E\u9A8C", value: this.state.experimentId, onChange: (e) => {
              const ex = data.experiments.find((x) => x.id === e.target.value);
              this.setState({ experimentId: e.target.value, revision: ex?.revision ?? 1 });
            }, children: [
              nativeSelectButton,
              /* @__PURE__ */ jsx("option", { value: "", children: "\u9009\u62E9\u5DF2\u6709\u5B9E\u9A8C" }),
              data.experiments.filter((e) => e.lifecycle !== "archived").map((e) => /* @__PURE__ */ jsxs("option", { value: e.id, children: [
                e.title,
                " \xB7 \u5F53\u524D\u4FEE\u8BA2 ",
                e.revision
              ] }, e.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u56FA\u5B9A\u4FEE\u8BA2",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u5B9E\u73B0\u6765\u6E90\u4FEE\u8BA2", type: "number", min: 1, max: selected?.revision ?? 1, value: this.state.revision, onChange: (e) => this.setState({ revision: Number(e.target.value) }) })
          ] })
        ] }),
        !data.project.gitHistoryEnabled ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/projects/${data.project.id}/git-enable`, {}), "\u53D7\u7BA1 Git \u5DF2\u663E\u5F0F\u542F\u7528"), children: "\u542F\u7528\u6B64\u9879\u76EE\u53D7\u7BA1 Git" }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53D7\u7BA1 Git \u5DF2\u542F\u7528\uFF1B\u53EA\u4FDD\u5B58\u672C\u5730\u5386\u53F2\uFF0C\u4E0D\u63A8\u9001\u3002" }),
        /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || !session || !!session.workingGrantId || session.state === "running" || !selected || !Number.isInteger(this.state.revision) || this.state.revision < 1 || this.state.revision > selected.revision || !data.project.gitHistoryEnabled || this.state.dirty, onClick: () => perform(() => this.call("workspace_prepare_from_revision", { experimentId: this.state.experimentId, revision: this.state.revision }), "\u5DF2\u8BF7\u6C42\u51C6\u5907\u56FA\u5B9A\u79C1\u6709\u6E90\u7801"), children: "\u51C6\u5907\u9009\u5B9A\u7248\u672C\u7684\u79C1\u6709\u5DE5\u4F5C\u533A" }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5DF2\u6709\u6765\u6E90\u6216\u672C\u5730\u6587\u4EF6\u4E0D\u4F1A\u88AB\u8986\u76D6\u3002\u6539\u9009\u6765\u6E90\u65F6\u8BF7\u4F7F\u7528\u65B0\u7684\u4E3B\u4F1A\u8BDD\uFF1B\u51C6\u5907\u8FC7\u7A0B\u4E2D\u53EF\u7B49\u5F85\uFF0C\u4E0D\u9700\u8981\u4FDD\u6301\u6A21\u578B\u8FD0\u884C\u3002" })
      ] }),
      session ? /* @__PURE__ */ jsx(PrivateWorkspace, { projectId: data.project.id, session, perform, busy, blocked: !!session.workingGrantId && !grantWritable, editablePaths: session.workingGrantId ? workingGrant?.editablePaths ?? [] : void 0, onDirty: (dirty) => this.setState({ dirty }), onReady: (gitReady) => {
        if (gitReady !== this.state.gitReady) this.setState({ gitReady });
      } }, session.id) : /* @__PURE__ */ jsx(Empty, { title: "\u5148\u9009\u62E9\u4E3B\u4F1A\u8BDD", children: /* @__PURE__ */ jsx("p", { children: "\u53EF\u5728\u4FA7\u680F\u65B0\u5EFA\u4F1A\u8BDD\uFF0C\u7136\u540E\u56DE\u5230\u6B64\u9875\u9009\u62E9\u3002" }) }),
      session ? /* @__PURE__ */ jsxs("details", { className: "secondary-section", children: [
        /* @__PURE__ */ jsx("summary", { children: "\u6709\u9650\u5B9E\u73B0\u4E0E\u6D4B\u8BD5\u6388\u6743" }),
        /* @__PURE__ */ jsx(WorkingGrants, { data, session, perform, busy, dirty: this.state.dirty }, session.id)
      ] }) : null,
      session ? /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u5F00\u53D1\u6D4B\u8BD5\u4E0E\u7528\u6237\u6279\u51C6" }) }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "Pi \u53EF\u81EA\u884C\u8BF7\u6C42\u6D4B\u8BD5\u3002\u4E0B\u9762\u4E5F\u53EF\u624B\u52A8\u51C6\u5907\uFF1B\u6279\u51C6\u53EA\u9002\u7528\u4E8E\u663E\u793A\u7684\u6E90\u7801\u3001\u547D\u4EE4\u3001\u955C\u50CF\u4E0E\u8D44\u6E90\uFF0C\u4E0D\u7B49\u4E8E\u6279\u51C6\u6B63\u5F0F Run\u3002" }),
        session.workingGrantId ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "notice-inline", children: "\u6309\u5DF2\u7ED1\u5B9A\u6388\u6743\u91CD\u65B0\u51C6\u5907\u5F53\u524D\u6E90\u7801\u6D4B\u8BD5\uFF1B\u539F\u6A21\u677F\u4E0D\u80FD\u63D0\u4EA4\uFF0C\u6D3E\u751F\u6279\u51C6\u4E0D\u9700\u8981\u518D\u9010\u6B21\u624B\u52A8\u6279\u51C6\u3002" }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || this.state.dirty || !this.state.gitReady || !grantWritable, onClick: () => {
            if (!workingGrant) return;
            void perform(() => this.call("development_prepare", { title: "WorkingGrant \u8303\u56F4\u5185\u7684\u5F53\u524D\u5B9E\u73B0\u6D4B\u8BD5", command: workingGrant.command, environmentImageDigest: workingGrant.environmentImageDigest, dockerContext: workingGrant.dockerContext, resources: workingGrant.resources, expectedArtifacts: workingGrant.expectedArtifacts, dataArtifactIds: workingGrant.dataArtifacts.map((a) => a.id), deadline: new Date(Math.min(Date.now() + 18e5, Date.parse(workingGrant.expiresAt))).toISOString() }), "\u5DF2\u51BB\u7ED3\u5F53\u524D\u6E90\u7801\u5E76\u6D3E\u751F\u6D4B\u8BD5\u6279\u51C6\uFF1B\u5C1A\u672A\u63D0\u4EA4");
          }, children: "\u6309\u56FA\u5B9A\u6388\u6743\u51C6\u5907\u5F53\u524D\u6E90\u7801\u6D4B\u8BD5" })
        ] }) : /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u624B\u52A8\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5" }),
          /* @__PURE__ */ jsxs("form", { className: "form-body", onSubmit: (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget), args = String(fd.get("args") ?? "");
            void perform(() => this.call("development_prepare", { title: fd.get("title"), command: [String(fd.get("program")), ...args ? args.split(/\r?\n/) : []], environmentImageDigest: fd.get("image"), dockerContext: fd.get("context"), resources: { timeoutSeconds: Number(fd.get("timeout")) }, expectedArtifacts: String(fd.get("outputs") ?? "").split(/\r?\n/).map((p) => p.trim()).filter(Boolean) }), "\u5F00\u53D1\u6D4B\u8BD5\u5DF2\u51C6\u5907\uFF0C\u7B49\u5F85\u6279\u51C6");
          }, children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6D4B\u8BD5\u540D\u79F0",
              /* @__PURE__ */ jsx("input", { name: "title", required: true, defaultValue: "\u9A8C\u8BC1\u5F53\u524D\u5B9E\u73B0", maxLength: 200 })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u53EF\u6267\u884C\u7A0B\u5E8F",
              /* @__PURE__ */ jsx("input", { name: "program", required: true, defaultValue: "python" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF09",
              /* @__PURE__ */ jsx("textarea", { name: "args", defaultValue: "main.py", rows: 3 })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u56FA\u5B9A\u955C\u50CF\u6458\u8981",
              /* @__PURE__ */ jsx("input", { name: "image", required: true, pattern: ".+@sha256:[a-f0-9]{64}", placeholder: "python@sha256:\u2026" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u672C\u5730 Docker context",
              /* @__PURE__ */ jsx("input", { name: "context", required: true, defaultValue: "desktop-linux" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u8D85\u65F6\u79D2\u6570",
              /* @__PURE__ */ jsx("input", { name: "timeout", required: true, type: "number", min: 1, max: 600, defaultValue: 60 })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u5FC5\u9700\u6D4B\u8BD5\u4EA7\u7269\uFF08\u53EF\u7A7A\uFF0C\u6BCF\u884C\u4E00\u4E2A\uFF09",
              /* @__PURE__ */ jsx("textarea", { name: "outputs", rows: 2 })
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || this.state.dirty || !session.sourceRevisionId || !this.state.gitReady, children: "\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5" })
          ] })
        ] }),
        tasks.length ? tasks.slice().reverse().map((t) => {
          const approval = data.approvals.find((a) => a.id === t.grantId), derived = t.manifest.workingGrant, oldTemplate = !!session.workingGrantId && !derived, canSubmit = !session.workingGrantId || derived?.id === session.workingGrantId && grantOpen;
          return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              t.title,
              " \xB7 ",
              short(t.id)
            ] }),
            /* @__PURE__ */ jsx(Badge, { value: approval?.status ?? t.state }),
            derived ? /* @__PURE__ */ jsxs("p", { className: "notice-inline", children: [
              "\u4F9D\u636E WorkingGrant ",
              short(derived.id),
              " \u6D3E\u751F\u6279\u51C6 \xB7 ",
              short(derived.digest),
              "\uFF1B\u663E\u5F0F\u63D0\u4EA4\u624D\u8BA1\u4E00\u6B21\uFF0C\u5931\u8D25/\u53D6\u6D88/\u672A\u77E5\u4E5F\u4E0D\u9000\u8FD8\u3002"
            ] }) : oldTemplate && !t.jobId ? /* @__PURE__ */ jsx("p", { className: "notice-inline", children: "\u6B64\u65E7\u5355\u6B21\u6A21\u677F\u4E0D\u80FD\u5728\u5DF2\u7ED1\u5B9A\u6388\u6743\u7684\u4F1A\u8BDD\u63D0\u4EA4\uFF0C\u8BF7\u6309\u4E0A\u65B9\u56FA\u5B9A\u6388\u6743\u91CD\u65B0\u51C6\u5907\u3002" }) : null,
            /* @__PURE__ */ jsxs("dl", { className: "details", children: [
              /* @__PURE__ */ jsx("dt", { children: "\u6E90\u7801\u6458\u8981" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest", children: t.sourceDigest }) }),
              /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A argv" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: JSON.stringify(t.manifest.command) }) }),
              /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u955C\u50CF" }),
              /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest", children: t.manifest.environmentImageDigest }) }),
              /* @__PURE__ */ jsx("dt", { children: "Context" }),
              /* @__PURE__ */ jsx("dd", { children: t.manifest.dockerContext }),
              /* @__PURE__ */ jsx("dt", { children: "\u8D44\u6E90" }),
              /* @__PURE__ */ jsx("dd", { children: Object.entries(t.manifest.resources).map(([k, v]) => `${k}=${v}`).join(" \xB7 ") }),
              /* @__PURE__ */ jsx("dt", { children: "\u6388\u6743\u622A\u6B62" }),
              /* @__PURE__ */ jsx("dd", { children: t.manifest.deadline }),
              /* @__PURE__ */ jsx("dt", { children: "\u5FC5\u9700\u4EA7\u7269" }),
              /* @__PURE__ */ jsx("dd", { children: t.manifest.expectedArtifacts.join("\u3001") || "\u65E0\u58F0\u660E\u6587\u4EF6" })
            ] }),
            !t.jobId && !derived && !oldTemplate && approval?.status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u5DF2\u6279\u51C6\u56FA\u5B9A\u5F00\u53D1\u6D4B\u8BD5\uFF0C\u5C1A\u672A\u63D0\u4EA4"), children: "\u6279\u51C6\u6B64\u5F00\u53D1\u6D4B\u8BD5" }),
              /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })), children: "\u62D2\u7EDD" })
            ] }) : null,
            !t.jobId && !oldTemplate && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || this.state.dirty || !canSubmit, onClick: () => perform(() => this.call("development_submit", { developmentTaskId: t.id }), "\u5DF2\u63D0\u4EA4\u72EC\u7ACB\u5F00\u53D1\u6D4B\u8BD5"), children: derived ? "\u63D0\u4EA4\u6388\u6743\u5185\u56FA\u5B9A\u6D4B\u8BD5\uFF08\u8BA1\u4E00\u6B21\uFF09" : "\u63D0\u4EA4\u5DF2\u6279\u51C6\u5F00\u53D1\u6D4B\u8BD5" }) : null
          ] }, t.id);
        }) : /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u6B64\u4F1A\u8BDD\u5C1A\u672A\u8BF7\u6C42\u5F00\u53D1\u6D4B\u8BD5\u3002\u53EF\u56DE\u5230\u804A\u5929\u8BA9 Pi \u5B8C\u6210\u5B9E\u73B0\u5E76\u8BF7\u6C42\u6D4B\u8BD5\u3002" }),
        jobs.slice().reverse().map((j) => /* @__PURE__ */ jsx(DevelopmentJob, { onScheduler: this.props.onScheduler, job: j, data, sessionId: session.id, perform }, j.id))
      ] }) : null,
      session ? /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u72EC\u7ACB\u5BA1\u67E5" }) }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u53EA\u6709\u6210\u529F\u4E14\u5B8C\u6574\u7684\u56FA\u5B9A\u6D4B\u8BD5\u53EF\u4EE5\u53D1\u8D77\u5BA1\u67E5\uFF1B\u5BA1\u67E5\u610F\u89C1\u548C\u4EFB\u52A1\u5B8C\u6210\u72B6\u6001\u5206\u5F00\u663E\u793A\u3002" }),
        !data.project.settings.enabled ? /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/projects/${data.project.id}/collaboration-settings`, { expectedVersion: data.project.version, enabled: true }), "\u5DF2\u663E\u5F0F\u542F\u7528\u534F\u4F5C\uFF1B\u5BA1\u67E5\u4ECD\u9700\u5355\u72EC\u6279\u51C6"), children: "\u542F\u7528\u534F\u4F5C\u4EE5\u51C6\u5907\u72EC\u7ACB\u5BA1\u67E5" }) : null,
        jobs.filter((j) => j.state === "succeeded" && j.integrity === "complete" && j.exitCode === 0).map((j) => /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          /* @__PURE__ */ jsxs("code", { children: [
            "\u6D4B\u8BD5 ",
            short(j.id),
            " \xB7 ",
            short(j.sourceDigest)
          ] }),
          /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy || !data.project.settings.enabled || reviews.some((r) => r.jobId === j.id), onClick: () => perform(() => this.call("development_review_prepare", { jobId: j.id }), "\u72EC\u7ACB\u5BA1\u67E5\u8BA1\u5212\u5DF2\u51C6\u5907\uFF0C\u7B49\u5F85\u7528\u6237\u6279\u51C6"), children: "\u51C6\u5907\u6B64\u6D4B\u8BD5\u7684\u72EC\u7ACB\u5BA1\u67E5" })
        ] }, j.id)),
        reviews.map((r) => {
          const task = data.tasks.find((t) => t.id === r.taskId), team = data.teams.find((t) => t.id === r.teamId), approval = data.approvals.find((a) => a.id === r.approvalId), passed = r.status === "passed" && task?.execution === "output_submitted" && task.acceptance === "accepted" && task.result?.outcome === "completed" && task.result.verdict === "accept";
          const verdict = task?.result?.verdict;
          return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              "\u5BA1\u67E5 ",
              short(r.id),
              " \xB7 ",
              /* @__PURE__ */ jsx(Badge, { value: r.status })
            ] }),
            r.status === "stale" ? /* @__PURE__ */ jsx("p", { className: "error-text", children: "\u6D4B\u8BD5\u6216\u5BA1\u67E5\u4F9D\u636E\u5DF2\u5931\u6548\uFF0C\u5386\u53F2\u610F\u89C1\u4FDD\u7559\uFF0C\u4E0D\u80FD\u7528\u4E8E\u65B0\u6574\u5408\u3002" }) : null,
            /* @__PURE__ */ jsxs("p", { children: [
              "\u72EC\u7ACB\u4EFB\u52A1 ",
              short(r.taskId),
              " \xB7 \u6D4B\u8BD5 ",
              short(r.jobId)
            ] }),
            /* @__PURE__ */ jsx("code", { className: "digest", children: r.sourceDigest }),
            /* @__PURE__ */ jsxs("p", { children: [
              "\u5BA1\u67E5\u610F\u89C1\uFF1A",
              verdict === "accept" ? "\u901A\u8FC7" : verdict === "reject" ? "\u62D2\u7EDD" : verdict === "disputed" ? "\u6709\u4E89\u8BAE / \u5F85\u8865\u8BC1" : task?.result?.outcome === "blocked" || task?.result?.outcome === "partial" ? "\u5F85\u8865\u8BC1" : "\u7B49\u5F85\u5BA1\u67E5\u7ED3\u679C",
              " \xB7 \u4EFB\u52A1 ",
              label(task?.execution ?? "pending"),
              " \xB7 \u9A8C\u6536 ",
              label(task?.acceptance ?? "pending")
            ] }),
            task?.result ? /* @__PURE__ */ jsx("p", { className: "prose-text", children: task.result.summary }) : null,
            task?.blockReason ? /* @__PURE__ */ jsx("p", { className: "error-text", children: task.blockReason }) : null,
            /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u5BA1\u67E5\u8F93\u5165\u4E0E\u5F15\u7528\u8BC1\u636E" }),
              /* @__PURE__ */ jsx("ul", { children: [.../* @__PURE__ */ new Set([...task?.inputEvidenceIds ?? [], ...task?.result?.evidenceIds ?? []])].map((id) => {
                const evidence = data.evidence.find((e) => e.id === id), artifact = data.artifacts.find((a) => a.id === evidence?.artifactId);
                return /* @__PURE__ */ jsxs("li", { children: [
                  evidence?.description ?? short(id),
                  artifact ? /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: () => perform(async () => this.setState({ reviewContent: (await artifactText(artifact.id)).slice(0, 65536) })), children: [
                    "\u67E5\u770B ",
                    artifact.title
                  ] }) : null
                ] }, id);
              }) })
            ] }),
            approval?.status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy, onClick: () => perform(async () => {
                await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true });
                await api(`/teams/${r.teamId}/activate`, {});
              }, "\u5DF2\u6279\u51C6\u5E76\u542F\u52A8\u72EC\u7ACB\u5BA1\u67E5"), children: "\u6279\u51C6\u5E76\u542F\u52A8\u72EC\u7ACB\u5BA1\u67E5" }),
              /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })), children: "\u62D2\u7EDD\u5BA1\u67E5\u8BA1\u5212" })
            ] }) : approval?.status === "approved" && team?.state === "awaiting_approval" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy, onClick: () => perform(() => api(`/teams/${r.teamId}/activate`, {})), children: "\u542F\u52A8\u5DF2\u6279\u51C6\u5BA1\u67E5" }) : null,
            passed ? /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void perform(async () => {
                const p = await this.call("reviewed_change_prepare", { reviewId: r.id, title: fd.get("title"), hypothesis: fd.get("hypothesis") });
                this.setState({ preview: await api(`/change-proposals/${p.id}/diff`) });
              }, "\u5DF2\u51C6\u5907\u53D7\u5BA1\u5B8C\u6574\u53D8\u66F4\uFF0C\u8BF7\u6838\u5BF9\u5DEE\u5F02");
            }, children: [
              /* @__PURE__ */ jsxs("label", { children: [
                "\u65B0\u5B50\u5B9E\u9A8C\u540D\u79F0",
                /* @__PURE__ */ jsx("input", { name: "title", required: true, maxLength: 200, defaultValue: "\u5DF2\u6D4B\u8BD5\u5E76\u5BA1\u67E5\u7684\u5019\u9009" })
              ] }),
              /* @__PURE__ */ jsxs("label", { children: [
                "\u7814\u7A76\u53D8\u5316\u4E0E\u4F9D\u636E",
                /* @__PURE__ */ jsx("textarea", { name: "hypothesis", required: true })
              ] }),
              /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy, children: "\u51C6\u5907\u7ED1\u5B9A\u6D4B\u8BD5\u4E0E\u5BA1\u67E5\u7684\u5B8C\u6574\u53D8\u66F4" })
            ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5BA1\u67E5\u672A\u660E\u786E\u901A\u8FC7\u524D\uFF0C\u4E0D\u80FD\u51C6\u5907\u53D7\u5BA1\u6574\u5408\u3002" })
          ] }, r.id);
        }),
        this.state.reviewContent ? /* @__PURE__ */ jsx("pre", { className: "file-preview", children: this.state.reviewContent }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("section", { className: "surface", children: [
        /* @__PURE__ */ jsx("div", { className: "surface-heading", children: /* @__PURE__ */ jsx("h2", { children: "\u53D7\u5BA1\u6574\u5408" }) }),
        proposals.map((p) => {
          const approval = data.approvals.find((a) => a.id === p.approvalId);
          return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h3", { children: [
              p.title,
              " \xB7 ",
              /* @__PURE__ */ jsx(Badge, { value: p.state })
            ] }),
            /* @__PURE__ */ jsx("p", { children: p.hypothesis }),
            /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => void this.preview(p.id), children: "\u67E5\u770B\u5B8C\u6574\u56FA\u5B9A\u5DEE\u5F02" }),
            p.sourceValidity === "stale" ? /* @__PURE__ */ jsx("p", { className: "error-text", children: "\u5BA1\u67E5\u6765\u6E90\u5DF2\u5931\u6548\uFF0C\u4E0D\u80FD\u6574\u5408\u3002" }) : p.state === "prepared" && approval?.status === "pending" ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
              /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy || this.state.preview?.proposal.id !== p.id, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }), "\u5DF2\u6279\u51C6\u56FA\u5B9A\u6574\u5408\uFF1B\u5C1A\u672A\u521B\u5EFA\u5B50\u5B9E\u9A8C"), children: "\u6279\u51C6\u6B64\u53D7\u5BA1\u6574\u5408" }),
              /* @__PURE__ */ jsx("button", { className: "secondary", disabled: busy, onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false })), children: "\u62D2\u7EDD" })
            ] }) : p.state === "prepared" && approval?.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: busy, onClick: () => perform(async () => {
              const child = await api(`/change-proposals/${p.id}/apply`, {});
              this.props.onExperiment(child.id);
            }, "\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C\uFF0C\u6B63\u5F0F Run \u4ECD\u9700\u5355\u72EC\u6279\u51C6"), children: "\u521B\u5EFA\u65B0\u5B50\u5B9E\u9A8C\u5E76\u67E5\u770B" }) : null,
            p.appliedExperimentId ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => this.props.onExperiment(p.appliedExperimentId), children: "\u524D\u5F80\u5DF2\u521B\u5EFA\u5B50\u5B9E\u9A8C" }) : null
          ] }, p.id);
        }),
        !proposals.length ? /* @__PURE__ */ jsx("p", { className: "inline-empty", children: "\u901A\u8FC7\u6D4B\u8BD5\u548C\u72EC\u7ACB\u5BA1\u67E5\u540E\uFF0C\u5728\u4E0A\u65B9\u51C6\u5907\u5B8C\u6574\u53D8\u66F4\u3002" }) : null,
        this.state.preview ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { children: [
            "\u56FA\u5B9A\u5DEE\u5F02 \xB7 ",
            short(this.state.preview.proposal.id)
          ] }),
          this.state.preview.files.map((f) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsxs("h4", { children: [
              f.path,
              " \xB7 ",
              f.beforeMode ?? "\u65E0",
              " \u2192 ",
              f.afterMode ?? "\u65E0"
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u53D8\u66F4\u524D" }),
              /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.before ?? "\uFF08\u4E0D\u5B58\u5728\uFF09" })
            ] }),
            /* @__PURE__ */ jsxs("details", { open: true, children: [
              /* @__PURE__ */ jsx("summary", { children: "\u53D8\u66F4\u540E" }),
              /* @__PURE__ */ jsx("pre", { className: "file-preview", children: f.after ?? "\uFF08\u5220\u9664\uFF09" })
            ] })
          ] }, f.path))
        ] }) : null
      ] })
    ] });
  }
}
export {
  DevelopmentJob,
  ImplementationView
};
