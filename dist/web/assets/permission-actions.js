import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
const names = { document_page_image_read: "\u5141\u8BB8\u56FA\u5B9A\u539F\u6587\u9875\u8303\u56F4\u89C6\u89C9\u8BFB\u53D6", publication_page_image_read: "\u53D1\u9001\u56FA\u5B9A\u6587\u7A3F\u9875\u7ED9\u6A21\u578B", workspace_write: "\u7F16\u8F91\u6587\u4EF6", workspace_prepare_from_revision: "\u51C6\u5907\u4F1A\u8BDD\u5DE5\u4F5C\u533A", workspace_history_set_mode: "\u4FEE\u6539\u6587\u4EF6\u6743\u9650", workspace_history_commit: "\u4FDD\u5B58\u6E90\u7801\u63D0\u4EA4", literature_search: "\u8054\u7F51\u68C0\u7D22", literature_discover: "\u8054\u7F51\u53D1\u73B0\u6587\u732E", paper_read: "\u83B7\u53D6\u8BBA\u6587", artifact_create: "\u4FDD\u5B58\u4EA7\u7269", evidence_register: "\u767B\u8BB0\u8BC1\u636E", text_evidence_search: "\u68C0\u7D22\u5E76\u767B\u8BB0\u6587\u672C\u8BC1\u636E", research_brief_save: "\u4FDD\u5B58\u7814\u7A76\u8BA1\u5212", experiment_plan_submit: "\u51C6\u5907\u5B9E\u9A8C\u65B9\u6848", development_prepare: "\u51C6\u5907\u5F00\u53D1\u6D4B\u8BD5", development_submit: "\u63D0\u4EA4\u5F00\u53D1\u6D4B\u8BD5", run_prepare: "\u51C6\u5907\u5B9E\u9A8C\u8FD0\u884C", run_submit: "\u63D0\u4EA4\u5B9E\u9A8C\u8FD0\u884C", collaboration_plan_submit: "\u51C6\u5907\u534F\u4F5C\u8BA1\u5212", agent_delegate: "\u51C6\u5907\u52A9\u624B\u4EFB\u52A1", manuscript_create: "\u4FDD\u5B58\u6587\u7A3F" };
const labels = { pending: "\u7B49\u5F85\u786E\u8BA4", approved: "\u5DF2\u6279\u51C6\uFF0C\u7B49\u5F85\u6267\u884C", rejected: "\u5DF2\u62D2\u7EDD", stale: "\u5DF2\u5931\u6548", executing: "\u6B63\u5728\u6267\u884C", running: "\u6B63\u5728\u6267\u884C", completed: "\u5DF2\u6267\u884C", succeeded: "\u5DF2\u6267\u884C", failed: "\u6267\u884C\u5931\u8D25", unknown: "\u6548\u679C\u5F85\u6838\u5BF9", consumed: "\u5DF2\u4F7F\u7528\u672C\u6B21\u6279\u51C6" };
class PermissionActions extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { actions: [], hasMore: false, saving: "", error: "" };
    this.alive = true;
    this.request = 0;
    this.preparing = false;
  }
  componentDidMount() {
    void this.load();
    this.timer = setInterval(() => {
      if (!this.state.saving) void this.load();
    }, 1500);
  }
  componentWillUnmount() {
    this.alive = false;
    this.request++;
    clearInterval(this.timer);
  }
  async load() {
    const request = ++this.request;
    try {
      const result = await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`);
      if (this.alive && request === this.request) this.setState({ actions: result.actions ?? [], hasMore: !!result.hasMoreActions });
    } catch (error) {
      if (this.alive && request === this.request) this.setState({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  async decide(action, approved) {
    if (this.state.saving || this.props.busy || this.props.archived) return;
    this.request++;
    this.setState({ saving: action.id, error: "" });
    await this.props.perform(async () => {
      try {
        await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permission-actions/${encodeURIComponent(action.id)}/decide`, { expectedVersion: action.version, expectedApprovalVersion: action.approval.version, approved });
      } catch (error) {
        if (this.alive) this.setState({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        if (this.alive) {
          this.setState({ saving: "" });
          await this.load();
        }
      }
    }, approved ? "\u5DF2\u6279\u51C6\u672C\u6B21\u64CD\u4F5C" : "\u5DF2\u62D2\u7EDD\u672C\u6B21\u64CD\u4F5C");
  }
  fixedWorkspaceSource(action) {
    const { session, sessionId, projectId } = this.props, { experimentId, revision } = action.input;
    if (!projectId || !session || session.id !== sessionId || session.projectId !== projectId || session.role !== "coordinator" || session.taskId || session.teamId || session.parentSessionId || action.sessionId !== sessionId || action.state !== "failed" || action.operation !== "workspace_prepare_from_revision" || ["rejected", "stale"].includes(action.approval.status)) return null;
    return Object.keys(action.input).length === 2 && typeof experimentId === "string" && experimentId.length > 0 && experimentId.length <= 100 && experimentId.trim() === experimentId && typeof revision === "number" && Number.isSafeInteger(revision) && revision >= 1 ? { experimentId, revision } : null;
  }
  workspacePreparationDisabled() {
    return this.props.archived || this.props.busy || !!this.state.saving || this.preparing || ["running", "queued", "archived"].includes(this.props.session?.state ?? "") || !!this.props.session?.sourceRevisionId;
  }
  async prepareWorkspace(action) {
    const input = this.fixedWorkspaceSource(action);
    if (!this.alive || !input || this.workspacePreparationDisabled()) return;
    const { projectId, sessionId } = this.props;
    this.preparing = true;
    this.request++;
    this.setState({ saving: action.id, error: "" });
    try {
      await this.props.perform(async () => {
        try {
          await api("/operations/workspace_prepare_from_revision", { projectId, sessionId, input }, "POST", void 0, `owner-workspace-prepare:${action.id}`);
        } catch (error) {
          if (this.alive) this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        } finally {
          if (this.alive) await this.load();
        }
      }, "\u56FA\u5B9A\u7248\u672C\u5DE5\u4F5C\u533A\u5DF2\u51C6\u5907");
    } finally {
      this.preparing = false;
      if (this.alive) this.setState({ saving: "" });
    }
  }
  card(action) {
    const status = ["rejected", "stale"].includes(action.approval.status) ? action.approval.status : action.state === "pending" ? action.approval.status : action.state, pending = status === "pending", path = typeof action.input.path === "string" ? action.input.path : null, source = this.fixedWorkspaceSource(action);
    return /* @__PURE__ */ jsxs("article", { className: "workflow-card permission-action", children: [
      /* @__PURE__ */ jsxs("div", { className: "permission-action-heading", children: [
        /* @__PURE__ */ jsx(Icon, { name: path ? "edit" : "settings", size: 16 }),
        /* @__PURE__ */ jsx("strong", { children: names[action.operation] ?? "\u786E\u8BA4\u7814\u7A76\u64CD\u4F5C" }),
        /* @__PURE__ */ jsx("span", { className: "permission-action-status", children: labels[status] ?? status })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small", children: path ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("code", { children: path }),
        " \xB7 \u4EC5\u5F53\u524D\u4F1A\u8BDD\u5DE5\u4F5C\u533A"
      ] }) : (["publication_page_image_read", "document_page_image_read"].includes(action.operation) ? action.approval.reason : action.reason) ?? "\u53EA\u5141\u8BB8\u4E0B\u9762\u56FA\u5B9A\u7684\u4E00\u6B21\u64CD\u4F5C\uFF1B\u73B0\u6709\u6765\u6E90\u548C\u4E13\u95E8\u5BA1\u6279\u4ECD\u9700\u6709\u6548\u3002" }),
      /* @__PURE__ */ jsxs("details", { open: pending && !!path, children: [
        /* @__PURE__ */ jsx("summary", { children: path ? "\u67E5\u770B\u56FA\u5B9A\u6587\u4EF6\u53D8\u66F4" : "\u67E5\u770B\u51C6\u786E\u64CD\u4F5C\u5185\u5BB9" }),
        path ? /* @__PURE__ */ jsxs("div", { className: "permission-action-diff", children: [
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h4", { children: "\u53D8\u66F4\u524D" }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: action.before ? action.before.content ?? "\uFF08\u6587\u4EF6\u4E0D\u5B58\u5728\uFF09" : "\uFF08\u65E7\u6B63\u6587\u4E0D\u53EF\u7528\uFF0C\u8BF7\u6838\u5BF9\u76EE\u6807\u6458\u8981\uFF09" }),
            /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
              "\u76EE\u6807\u6458\u8981\uFF1A",
              String(action.input.expectedDigest ?? "\u6587\u4EF6\u4E0D\u5B58\u5728")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("section", { children: [
            /* @__PURE__ */ jsx("h4", { children: "\u53D8\u66F4\u540E" }),
            /* @__PURE__ */ jsx("pre", { className: "file-preview", children: typeof action.input.content === "string" ? action.input.content : JSON.stringify(action.input, null, 2) })
          ] })
        ] }) : /* @__PURE__ */ jsx("pre", { className: "file-preview", children: JSON.stringify({ operation: action.operation, input: action.input }, null, 2) }),
        source ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "small", children: [
            "\u5F53\u524D\u4E3B\u4F1A\u8BDD\uFF1A",
            /* @__PURE__ */ jsx("code", { children: this.props.sessionId }),
            " \xB7 \u56FA\u5B9A\u5B9E\u9A8C\uFF1A",
            /* @__PURE__ */ jsx("code", { children: source.experimentId }),
            " \xB7 \u4FEE\u8BA2 ",
            source.revision,
            "\u3002\u539F\u5931\u8D25\u8BB0\u5F55\u4FDD\u7559\uFF1B\u70B9\u51FB\u5C06\u4EE5\u4F60\u7684\u8EAB\u4EFD\u51C6\u5907\u6B64\u56FA\u5B9A\u6765\u6E90\u3002"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: this.workspacePreparationDisabled(), onClick: () => {
            void this.prepareWorkspace(action);
          }, children: "\u51C6\u5907\u8FD9\u4E00\u56FA\u5B9A\u7248\u672C\u7684\u5DE5\u4F5C\u533A" })
        ] }) : null
      ] }),
      pending ? /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "primary compact", disabled: this.props.archived || this.props.busy || !!this.state.saving, onClick: () => {
          void this.decide(action, true);
        }, children: "\u5141\u8BB8\u672C\u6B21" }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", disabled: this.props.archived || this.props.busy || !!this.state.saving, onClick: () => {
          void this.decide(action, false);
        }, children: "\u62D2\u7EDD" })
      ] }) : null,
      status === "stale" ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6743\u9650\u3001\u6765\u6E90\u6216\u76EE\u6807\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u9700\u8981\u91CD\u65B0\u51C6\u5907\u64CD\u4F5C\u3002" }) : null,
      action.error ? /* @__PURE__ */ jsx("p", { className: "small error-text", children: action.error }) : null
    ] }, action.id);
  }
  render() {
    const current = this.state.actions.filter((a) => a.approval.status !== "rejected" && a.approval.status !== "stale" && ["pending", "approved", "executing", "running"].includes(a.state)), history = this.state.actions.filter((a) => !current.includes(a));
    if (!current.length && !history.length) return null;
    return /* @__PURE__ */ jsxs("section", { className: "permission-actions", "aria-label": "\u4F1A\u8BDD\u64CD\u4F5C\u5BA1\u6279", children: [
      current.map((a) => this.card(a)),
      history.length ? /* @__PURE__ */ jsxs("details", { className: "workflow-history", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u64CD\u4F5C\u5BA1\u6279\u5386\u53F2\uFF08",
          history.length,
          "\uFF09"
        ] }),
        history.map((a) => this.card(a))
      ] }) : null,
      this.state.hasMore ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FD9\u91CC\u663E\u793A\u6700\u8FD1 20 \u6761\u64CD\u4F5C\uFF0C\u8F83\u65E9\u7684\u5BA1\u6279\u8BB0\u5F55\u4ECD\u4FDD\u7559\u3002" }) : null,
      this.state.error ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "status", children: this.state.error }) : null
    ] });
  }
}
export {
  PermissionActions
};
