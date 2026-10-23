import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import { HostAccessControl } from "./host-access-control.js";
import { PermissionActions } from "./permission-actions.js";
import { LogView } from "./log-view.js";
import { ConversationActivity } from "./session-history.js";
import { ScrollHistory } from "./scroll-history.js";
import { MessageQueue } from "./message-queue.js";
import { ComputeWait } from "./compute-wait.js";
import { WakeupPanel } from "./campaigns.js";
import { ChatWorkflows, proposalSession } from "./chat-workflows.js";
import { ResearchActionCards } from "./research-action-cards.js";
import { ComposerControls } from "./composer-controls.js";
import { readComposerDraft, saveComposerDraft } from "./composer-draft.js";
import { api, artifactText, downloadArtifact } from "./api.js";
import { automaticApprovalLabel, short, number, date, label } from "./models.js";
import { Icon, Badge, Modal, nativeSelectButton } from "./ui.js";
class Chat extends React.Component {
  constructor() {
    super(...arguments);
    this.initialDraft = readComposerDraft(this.props.data.project.id, this.props.session?.id ?? "");
    this.pendingDraft = this.initialDraft.pending;
    this.state = { draft: this.initialDraft.draft, draftVersion: this.initialDraft.draftVersion, attachments: this.initialDraft.attachments, draftSaveError: "", sending: false, drawerOpen: false, permissionPending: [], sentMessageId: "", renameTarget: null, renameTitle: "", renameError: "", renameSaving: false, stoppedPreview: "" };
    this.drawerClose = React.createRef();
    this.drawerContent = React.createRef();
    this.drawerTrigger = null;
    this.openDrawer = (trigger, history = false, archive = false) => {
      this.drawerTrigger = trigger;
      this.setState({ drawerOpen: true }, () => {
        if (!this.mounted) return;
        const content = this.drawerContent.current, details = history ? content?.querySelector("details.workflow-history,details.notification-history") : null;
        if (details) details.open = true;
        const target = archive ? content?.querySelector('[aria-label="\u5F52\u6863\u9879\u76EE\u5386\u53F2"]') : history ? details?.querySelector("summary") ?? content?.querySelector(".chat-drawer-history-note") : this.drawerClose.current;
        target?.focus({ preventScroll: true });
        if ((history || archive) && content && target) content.scrollTop += target.getBoundingClientRect().top - content.getBoundingClientRect().top;
      });
    };
    this.openArchivedHistory = (trigger) => {
      if (this.mounted && this.props.archivedHistory) this.openDrawer(trigger, false, true);
    };
    this.closeDrawer = () => this.setState({ drawerOpen: false }, () => {
      if (!this.mounted) return;
      if (this.props.archivedHistory) this.props.onArchivedHistoryClose?.();
      this.drawerTrigger?.focus({ preventScroll: true });
    });
    this.permissionPending = (ids) => {
      if (this.mounted && (ids.length !== this.state.permissionPending.length || ids.some((id, index) => id !== this.state.permissionPending[index]))) this.setState({ permissionPending: ids });
    };
    this.mounted = true;
    this.sending = false;
    this.composerControls = React.createRef();
    this.scrollHistory = React.createRef();
    this.capturePreviewScroll = () => this.scrollHistory.current?.capturePreviewScroll();
    this.renaming = false;
    this.renameEpoch = 0;
    this.renameInput = React.createRef();
    this.persistDraft = (projectId = this.props.data.project.id, sessionId = this.props.session?.id ?? "") => {
      const request = this.pendingSend, pending = request?.projectId === projectId && request.sessionId === sessionId ? { key: request.key, mode: request.body.mode, draft: request.draft, draftVersion: request.draftVersion, attachmentIds: request.attachments.map((a) => a.documentVersionId) } : this.pendingDraft;
      return saveComposerDraft(projectId, sessionId, { draft: this.state.draft, draftVersion: this.state.draftVersion, attachments: this.state.attachments, ...pending ? { pending } : {} });
    };
    this.beforeUnload = (event) => {
      if (!this.persistDraft() && (this.state.draft || this.state.attachments.length)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    this.renameActive = (target) => this.mounted && this.state.renameTarget === target && this.renameEpoch === target.epoch && this.props.data.project.id === target.projectId && this.props.session?.id === target.sessionId && !this.props.data.project.archived;
    this.renameCurrent = (target) => this.renameActive(target) && this.props.session?.version === target.version && this.props.session.title === target.originalTitle;
    this.finishRename = () => {
      const request = this.renameRequest;
      if (!request?.finished || !request.confirmed || !this.renameActive(request.target) || this.props.busy) return;
      if (!this.renameCurrent(request.target) && (this.props.session?.version !== request.confirmed.version || this.props.session.title !== request.confirmed.title)) return;
      this.renameEpoch++;
      this.renaming = false;
      this.renameRequest = void 0;
      this.setState({ renameTarget: null, renameSaving: false, renameError: "" });
    };
    this.closeRename = () => {
      if (!this.mounted || this.renaming || this.state.renameSaving) return;
      this.renameEpoch++;
      this.setState({ renameTarget: null, renameError: "" });
    };
    this.renameSession = () => {
      const { session, data } = this.props;
      if (!this.mounted || !session || session.projectId !== data.project.id || this.state.renameTarget || this.renaming || this.props.busy || data.project.archived) return;
      const target = { projectId: data.project.id, sessionId: session.id, version: session.version, originalTitle: session.title, epoch: ++this.renameEpoch };
      this.setState({ renameTarget: target, renameTitle: session.title, renameError: "", renameSaving: false }, () => {
        if (this.renameCurrent(target)) this.renameInput.current?.focus();
      });
    };
    this.submitRename = async (target) => {
      if (!this.renameCurrent(target) || this.renaming || this.props.busy) return;
      const title = this.state.renameTitle.trim();
      if (!title || title.length > 160) {
        this.setState({ renameError: "\u4F1A\u8BDD\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u4E14\u4E0D\u80FD\u8D85\u8FC7 160 \u4E2A\u5B57\u7B26\u3002" });
        return;
      }
      const request = { target, title, sent: false, finished: false };
      this.renameRequest = request;
      this.renaming = true;
      this.setState({ renameSaving: true, renameError: "" });
      try {
        return await this.props.perform(async () => {
          if (!this.renameCurrent(target)) return;
          try {
            request.sent = true;
            const confirmed = await api(`/sessions/${encodeURIComponent(target.sessionId)}`, { title, expectedVersion: target.version });
            if (!this.renameActive(target)) return;
            if (confirmed.id !== target.sessionId || confirmed.projectId !== target.projectId || confirmed.title !== title || !Number.isSafeInteger(confirmed.version) || confirmed.version <= target.version || !confirmed.model || typeof confirmed.model.provider !== "string" || typeof confirmed.model.model !== "string" || typeof confirmed.model.thinking !== "string") throw Error("\u6539\u540D\u56DE\u6267\u4E0E\u5F53\u524D\u4F1A\u8BDD\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
            if (!this.renameCurrent(target) && (this.props.session?.version !== confirmed.version || this.props.session.title !== confirmed.title)) {
              this.renameEpoch++;
              this.renaming = false;
              this.setState({ renameSaving: false, renameError: "\u4F1A\u8BDD\u6216\u9879\u76EE\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6253\u5F00\u6539\u540D\u7A97\u53E3\u3002" });
              return;
            }
            request.confirmed = confirmed;
            this.props.onModelConfirmed?.(confirmed);
            return confirmed;
          } catch (error) {
            if (this.renameActive(target)) {
              this.setState({ renameError: error instanceof Error ? error.message : String(error) });
              throw error;
            }
          }
        });
      } catch (error) {
        if (this.renameActive(target)) this.setState({ renameError: error instanceof Error ? error.message : String(error) });
      } finally {
        request.finished = true;
        if (request.confirmed && this.renameActive(target)) this.finishRename();
        else {
          if (this.renameRequest === request) this.renameRequest = void 0;
          if (this.renameActive(target)) {
            this.renaming = false;
            this.setState({ renameSaving: false });
          }
        }
      }
    };
    this.changeModel = (model) => {
      const { session, data } = this.props;
      if (!session || !this.mounted) return Promise.resolve(void 0);
      const saving = (async () => {
        const confirmed = await api(`/sessions/${session.id}/model`, { expectedVersion: session.version, model: { provider: model.provider, model: model.model, thinking: model.thinking } });
        if (!this.mounted || this.props.session?.id !== session.id || this.props.data.project.id !== data.project.id || confirmed.id !== session.id || confirmed.projectId !== data.project.id || confirmed.model.provider !== model.provider || confirmed.model.model !== model.model || confirmed.model.thinking !== model.thinking) return;
        this.props.onModelConfirmed?.(confirmed);
        return confirmed;
      })();
      this.modelSave = saving;
      const clear = () => {
        if (this.modelSave === saving) this.modelSave = void 0;
      };
      void saving.then(clear, clear);
      return saving;
    };
    this.canSend = () => {
      const { data, boot, session, busy, historyAnchor, history } = this.props;
      const runtimeAvailable = boot.runtime.ready || boot.runtime.code === "MODEL_NOT_CONFIGURED";
      const modelAvailable = !!session?.model.provider && !!session.model.model && (!boot.models || boot.models.some((model) => model.provider === session.model.provider && model.model === session.model.model && model.thinking === session.model.thinking && (model.restoreEpoch ?? 0) === (session.model.restoreEpoch ?? 0)));
      return this.mounted && !this.sending && runtimeAvailable && modelAvailable && !busy && !data.project.archived && !!session && session.projectId === data.project.id && !session.taskId && session.state !== "archived" && !historyAnchor && (!history || history.atLatest);
    };
    this.submit = async (event) => {
      event.preventDefault();
      const { session, data } = this.props;
      if (!session || !this.canSend() || !this.state.draft.trim() && !this.state.attachments.length) return;
      const { draft, draftVersion } = this.state, attachments = this.state.attachments.slice(), previous = this.pendingSend;
      const unchanged = previous?.projectId === data.project.id && previous.sessionId === session.id && previous.draftVersion === draftVersion && previous.draft === draft && JSON.stringify(previous.attachments) === JSON.stringify(attachments);
      const saved = readComposerDraft(data.project.id, session.id).pending, resume = saved && saved.draft === draft && saved.draftVersion === draftVersion && JSON.stringify(saved.attachmentIds) === JSON.stringify(attachments.map((a) => a.documentVersionId)) ? saved : void 0;
      const mode = resume?.mode ?? (session.state === "running" ? "follow_up" : "prompt");
      const request = unchanged ? previous : { projectId: data.project.id, sessionId: session.id, draft, draftVersion, attachments, body: { content: draft.trim() ? draft : "\u8BF7\u67E5\u770B\u9644\u4EF6\u3002", mode, ...attachments.length ? { attachmentDocumentIds: attachments.map((attachment) => attachment.documentVersionId) } : {} }, key: resume?.key ?? crypto.randomUUID(), clearUploadError: this.composerControls.current?.captureUploadError() };
      const modelSave = this.modelSave;
      const current = () => this.mounted && this.props.data.project.id === request.projectId && this.props.session?.id === request.sessionId;
      this.pendingSend = request;
      this.persistDraft();
      this.sending = true;
      this.setState({ sending: true });
      try {
        return await this.props.perform(async () => {
          if (modelSave) {
            let model;
            try {
              model = await modelSave;
            } catch (error) {
              if (!current()) return;
              throw error;
            }
            if (!current()) return;
            if (!model) throw Error("\u5F53\u524D\u6A21\u578B\u9009\u62E9\u672A\u4FDD\u5B58\uFF1B\u6D88\u606F\u8349\u7A3F\u4E0E\u9644\u4EF6\u5DF2\u4FDD\u7559\u3002");
          }
          if (!current() || this.props.data.project.archived || this.props.session?.state === "archived" || this.props.session?.taskId || this.props.historyAnchor || this.props.history && !this.props.history.atLatest) return;
          let confirmed;
          try {
            confirmed = await api(`/sessions/${session.id}/messages`, request.body, "POST", void 0, request.key);
            if (confirmed.projectId !== request.projectId || confirmed.sessionId !== request.sessionId || confirmed.role !== "user" || typeof confirmed.id !== "string" || confirmed.content !== request.body.content || confirmed.mode !== request.body.mode || !Number.isSafeInteger(confirmed.version) || confirmed.version < 1 || !["queued", "running", "completed", "failed", "cancelled"].includes(confirmed.status)) throw Error("\u53D1\u9001\u56DE\u6267\u4E0E\u5F53\u524D\u4F1A\u8BDD\u4E0D\u4E00\u81F4\uFF1B\u8349\u7A3F\u4E0E\u9644\u4EF6\u5DF2\u4FDD\u7559\u3002");
          } catch (error) {
            if (!current()) return;
            throw error;
          }
          if (this.pendingSend === request) {
            this.pendingSend = void 0;
            this.pendingDraft = void 0;
          }
          if (!this.mounted || this.props.data.project.id !== request.projectId || this.props.session?.id !== request.sessionId) return confirmed;
          this.props.onMessageConfirmed?.(confirmed);
          request.clearUploadError?.();
          const sent = new Set(request.attachments.map((attachment) => attachment.documentVersionId));
          this.setState((current2) => ({ draft: current2.draftVersion === request.draftVersion && current2.draft === request.draft ? "" : current2.draft, attachments: current2.attachments.filter((attachment) => !sent.has(attachment.documentVersionId)), sentMessageId: confirmed.id }));
          return confirmed;
        });
      } finally {
        this.sending = false;
        if (this.mounted) this.setState({ sending: false });
      }
    };
  }
  componentDidMount() {
    if (typeof window !== "undefined") window.addEventListener?.("beforeunload", this.beforeUnload);
  }
  componentWillUnmount() {
    this.persistDraft();
    this.mounted = false;
    this.renameEpoch++;
    if (typeof window !== "undefined") window.removeEventListener?.("beforeunload", this.beforeUnload);
  }
  componentDidUpdate(previous, previousState) {
    if (previous.data.project.id !== this.props.data.project.id || previous.session?.id !== this.props.session?.id) {
      this.persistDraft(previous.data.project.id, previous.session?.id ?? "");
      this.pendingSend = void 0;
      const restored = readComposerDraft(this.props.data.project.id, this.props.session?.id ?? "");
      this.pendingDraft = restored.pending;
      this.setState({ draft: restored.draft, draftVersion: restored.draftVersion, attachments: restored.attachments, draftSaveError: "" });
    } else if (!previousState || previousState.draft !== this.state.draft || previousState.draftVersion !== this.state.draftVersion || previousState.attachments !== this.state.attachments) {
      const error = this.persistDraft() ? "" : "\u6D4F\u89C8\u5668\u6682\u65F6\u65E0\u6CD5\u4FDD\u5B58\u8349\u7A3F\uFF0C\u5F53\u524D\u6807\u7B7E\u9875\u5185\u4ECD\u4FDD\u7559\uFF1B\u5173\u95ED\u9875\u9762\u53EF\u80FD\u4E22\u5931\u3002";
      if (error !== this.state.draftSaveError) this.setState({ draftSaveError: error });
    }
    if (previous.data.project.id !== this.props.data.project.id || previous.session?.id !== this.props.session?.id || previous.session?.version !== this.props.session?.version || previous.session?.title !== this.props.session?.title || previous.data.project.archived !== this.props.data.project.archived) {
      const request = this.renameRequest;
      const ownRename = request?.sent && this.renameActive(request.target) && this.props.session?.title === request.title && this.props.session.version > request.target.version && (!request.confirmed || this.props.session.version === request.confirmed.version);
      if (!ownRename) {
        this.renameEpoch++;
        this.renaming = false;
        if (this.state.renameTarget) this.setState({ renameSaving: false, renameError: "\u4F1A\u8BDD\u6216\u9879\u76EE\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6253\u5F00\u6539\u540D\u7A97\u53E3\u3002" });
      }
    }
    this.finishRename();
  }
  render() {
    const { data, boot, session, messages } = this.props;
    const runtimeAvailable = boot.runtime.ready || boot.runtime.code === "MODEL_NOT_CONFIGURED";
    const sessionModelAvailable = !!session?.model.provider && !!session.model.model && (!boot.models || boot.models.some((model) => model.provider === session.model.provider && model.model === session.model.model && model.thinking === session.model.thinking && (model.restoreEpoch ?? 0) === (session.model.restoreEpoch ?? 0)));
    const sessionFailure = session?.state === "failed" ? session.lastError : void 0;
    const previewKey = JSON.stringify([data.project.id, session?.id, session?.generation]);
    const canSend = this.canSend();
    const hasDraft = !!this.state.draft.trim() || this.state.attachments.length > 0;
    const latest = !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest), pending = new Set(latest ? this.state.permissionPending : []);
    if (latest && session?.role === "coordinator" && !session.taskId) {
      const campaigns = (data.campaigns ?? []).filter((row) => row.rootSessionId === session.id), campaignIds = new Set(campaigns.map((row) => row.id)), campaignIntents = /* @__PURE__ */ new Set([...(data.members ?? []).filter((row) => campaignIds.has(row.campaignId)).map((row) => row.intentId), ...(data.researchCandidates ?? []).filter((row) => campaignIds.has(row.campaignId)).map((row) => row.intentId)]), grant = (data.workingGrants ?? []).find((row) => row.id === session.workingGrantId);
      const approvalIds = /* @__PURE__ */ new Set([
        ...campaigns.filter((row) => row.state === "draft").map((row) => row.approvalId),
        ...(data.decisions ?? []).filter((row) => campaignIds.has(row.campaignId) && row.status === "proposed").map((row) => row.approvalId),
        ...(data.intents ?? []).filter((row) => (row.rootSessionId === session.id || row.rootSessionId == null && campaignIntents.has(row.id)) && row.status === "prepared" && !row.runId && !row.runGrant && !data.approvals.find((approval) => approval.id === row.approvalId)?.runGrant).map((row) => row.approvalId),
        ...(data.developmentTasks ?? []).filter((row) => row.sessionId === session.id && !row.jobId && Date.parse(row.manifest?.deadline ?? "") > Date.now() && (!session.workingGrantId || row.manifest.workingGrant?.id === session.workingGrantId && grant?.effectiveState === "active" && grant.validity === "current" && Date.parse(grant.expiresAt) > Date.now())).map((row) => row.grantId),
        ...(data.reviews ?? []).filter((row) => row.producerSessionId === session.id && data.project.settings.enabled && data.teams.some((team) => team.id === row.teamId && team.state === "awaiting_approval" && team.delegationEnabled)).map((row) => row.approvalId),
        ...(data.changeProposals ?? []).filter((row) => proposalSession(data, row) === session.id && row.state === "prepared" && row.sourceValidity !== "stale").map((row) => row.approvalId)
      ]);
      for (const approval of data.approvals ?? []) if (approval.status === "pending" && !approval.automaticApproval && approvalIds.has(approval.id)) pending.add(approval.id);
      for (const request of data.researchActions ?? []) if (request.projectId === data.project.id && request.sessionId === session.id && request.state === "pending" && !request.automaticApproval) pending.add("research:" + request.id);
    }
    return /* @__PURE__ */ jsxs("div", { className: "chat-page", onKeyDown: (event) => {
      if (event.key === "Escape" && this.state.drawerOpen && !event.defaultPrevented && !event.target.closest('[role="dialog"]')) {
        event.preventDefault();
        this.closeDrawer();
      }
    }, children: [
      /* @__PURE__ */ jsxs("div", { className: "chat-heading", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { children: session?.title ?? "\u7814\u7A76\u4F1A\u8BDD" }),
          /* @__PURE__ */ jsx("span", { className: "muted", children: session ? `${session.model.provider || "\u672A\u914D\u7F6E\u4F9B\u5E94\u5546"} / ${session.model.model || "\u672A\u914D\u7F6E\u6A21\u578B"}` : "\u6BCF\u4E2A\u4E3B\u4F1A\u8BDD\u90FD\u6709\u72EC\u7ACB\u5386\u53F2\u548C\u5DE5\u4F5C\u533A" })
        ] }),
        session ? /* @__PURE__ */ jsxs("div", { className: "actions chat-heading-actions", children: [
          /* @__PURE__ */ jsx(Badge, { value: session.state, caption: session.state === "queued" ? "\u6B63\u5728\u5904\u7406" : void 0 }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact chat-task-trigger", "aria-expanded": this.state.drawerOpen, "aria-controls": "chat-task-drawer", onClick: (event) => this.state.drawerOpen ? this.closeDrawer() : this.openDrawer(event.currentTarget), children: [
            /* @__PURE__ */ jsx(Icon, { name: "settings", size: 15 }),
            "\u4EFB\u52A1\u4E0E\u5BA1\u6279",
            pending.size ? /* @__PURE__ */ jsxs("span", { className: "chat-pending-count", children: [
              "\u5DF2\u77E5\u5F85\u786E\u8BA4 ",
              pending.size
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", "aria-expanded": this.state.drawerOpen, "aria-controls": "chat-task-drawer", onClick: (event) => this.openDrawer(event.currentTarget, true), children: [
            /* @__PURE__ */ jsx(Icon, { name: "report", size: 15 }),
            "\u5386\u53F2"
          ] }),
          /* @__PURE__ */ jsx("button", { className: "icon-button", disabled: this.props.busy || data.project.archived, title: "\u91CD\u547D\u540D\u4F1A\u8BDD", "aria-label": "\u91CD\u547D\u540D\u4F1A\u8BDD", onClick: this.renameSession, children: /* @__PURE__ */ jsx(Icon, { name: "edit" }) })
        ] }) : null
      ] }),
      !runtimeAvailable ? /* @__PURE__ */ jsxs("div", { className: "notice runtime-notice", children: [
        /* @__PURE__ */ jsx("span", { className: "status-dot amber" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Pi \u5C1A\u672A\u5C31\u7EEA" }),
          /* @__PURE__ */ jsxs("p", { children: [
            boot.runtime.message,
            " \u9879\u76EE\u3001\u5FEB\u7167\u3001\u771F\u5B9E\u6570\u503C\u5B9E\u9A8C\u548C\u8BC1\u636E\u7BA1\u7406\u4ECD\u53EF\u4F7F\u7528\u3002"
          ] })
        ] })
      ] }) : runtimeAvailable && session && !sessionModelAvailable ? /* @__PURE__ */ jsx("p", { className: "notice runtime-notice", children: "\u5F53\u524D\u4F1A\u8BDD\u6A21\u578B\u4E0D\u53EF\u7528\uFF0C\u8BF7\u9009\u62E9\u5DF2\u542F\u7528\u914D\u7F6E\u6216\u65B0\u5EFA\u4F1A\u8BDD\u3002" }) : null,
      session?.state === "failed" ? /* @__PURE__ */ jsx("div", { className: "notice runtime-notice", role: "alert", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: "\u4F1A\u8BDD\u5DF2\u5931\u8D25" }),
        /* @__PURE__ */ jsx("p", { children: sessionFailure?.includes("SKILL_REVOKED") ? "\u6B64\u4F1A\u8BDD\u7ED1\u5B9A\u7684\u6280\u80FD\u7248\u672C\u5DF2\u64A4\u9500\uFF0C\u65E0\u6CD5\u542F\u52A8\u3002\u8BF7\u521B\u5EFA\u65B0\u4F1A\u8BDD\uFF1B\u5DF2\u6709\u6D88\u606F\u4E0E\u5386\u53F2\u4FDD\u7559\u3002" : "\u6B64\u4F1A\u8BDD\u5DF2\u5931\u8D25\u3002\u5DF2\u6709\u6D88\u606F\u4E0E\u5386\u53F2\u4FDD\u7559\u3002" }),
        sessionFailure ? /* @__PURE__ */ jsxs("details", { children: [
          /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u5931\u8D25\u539F\u56E0" }),
          /* @__PURE__ */ jsx("p", { className: "small error-text code-wrap", children: sessionFailure })
        ] }) : null
      ] }) }) : null,
      session?.taskId ? /* @__PURE__ */ jsx("p", { className: "notice runtime-notice", children: "\u8FD9\u662F\u56E2\u961F\u4EFB\u52A1\u4F1A\u8BDD\u3002\u8BF7\u901A\u8FC7\u56E2\u961F\u4EFB\u52A1\u63A7\u4EF6\u53D1\u9001\u6307\u4EE4\u6216\u7BA1\u7406\u4EFB\u52A1\u3002" }) : session?.state === "archived" ? /* @__PURE__ */ jsx("p", { className: "notice runtime-notice", children: "\u6B64\u4F1A\u8BDD\u5DF2\u5F52\u6863\uFF0C\u4E0D\u80FD\u53D1\u9001\u6D88\u606F\u3002" }) : null,
      /* @__PURE__ */ jsxs("div", { className: "chat-work-region" + (this.state.drawerOpen ? " is-drawer-open" : ""), children: [
        /* @__PURE__ */ jsxs("div", { className: "conversation", "aria-live": "polite", children: [
          messages.length === 0 && latest ? /* @__PURE__ */ jsxs("div", { className: "welcome", children: [
            /* @__PURE__ */ jsx("div", { className: "welcome-mark", children: "\u03C0" }),
            /* @__PURE__ */ jsx("h2", { children: "\u4ECA\u5929\u60F3\u7814\u7A76\u4EC0\u4E48\uFF1F" }),
            /* @__PURE__ */ jsxs("div", { className: "welcome-actions", children: [
              /* @__PURE__ */ jsxs("button", { onClick: this.props.onExperiments, children: [
                /* @__PURE__ */ jsx(Icon, { name: "experiment" }),
                /* @__PURE__ */ jsx("span", { children: "\u67E5\u770B\u5B9E\u9A8C" }),
                /* @__PURE__ */ jsx(Icon, { name: "arrow" })
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: this.props.onWorkspace, children: [
                /* @__PURE__ */ jsx(Icon, { name: "folder" }),
                /* @__PURE__ */ jsx("span", { children: "\u67E5\u770B\u9879\u76EE\u6587\u4EF6" }),
                /* @__PURE__ */ jsx(Icon, { name: "arrow" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsx(ScrollHistory, { ref: this.scrollHistory, projectId: data.project.id, sessionId: session?.id ?? "", messages, history: this.props.history, historyAnchor: this.props.historyAnchor, onNavigate: this.props.onHistory, perform: this.props.perform, activeGeneration: session?.state === "running" ? session.generation : void 0, liveKey: this.props.stream, confirmedMessageId: this.state.sentMessageId, readOnly: !!data.project.archived || !session, sessionArchived: session?.state === "archived", busy: this.props.busy, onBranch: this.props.onBranchConfirmed }),
          " ",
          latest ? /* @__PURE__ */ jsx(ConversationActivity, { onBeforeReveal: this.capturePreviewScroll, content: this.props.stream, active: session?.state === "running" && this.state.stoppedPreview !== previewKey, activity: this.props.activity, truncated: this.props.streamTruncated }, previewKey) : null
        ] }),
        /* @__PURE__ */ jsxs("aside", { id: "chat-task-drawer", className: "chat-task-drawer", hidden: !this.state.drawerOpen, "aria-labelledby": "chat-task-drawer-title", children: [
          /* @__PURE__ */ jsxs("header", { children: [
            /* @__PURE__ */ jsx("h2", { id: "chat-task-drawer-title", children: "\u4EFB\u52A1\u4E0E\u5BA1\u6279" }),
            /* @__PURE__ */ jsx("button", { type: "button", ref: this.drawerClose, className: "icon-button", "aria-label": "\u5173\u95ED\u4EFB\u52A1\u4E0E\u5BA1\u6279", onClick: this.closeDrawer, children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "chat-task-drawer-content", ref: this.drawerContent, children: [
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u672C\u4F1A\u8BDD\u7684\u4EFB\u52A1\u3001\u5BA1\u6279\u4E0E\u7ED3\u679C\u8BB0\u5F55\uFF1B\u5404\u9879\u8BB0\u5F55\u663E\u793A\u5F53\u524D\u5904\u7406\u72B6\u6001\u3002" }),
            session && latest ? /* @__PURE__ */ jsx(PermissionActions, { sessionId: session.id, projectId: data.project.id, session, archived: data.project.archived || session.state === "archived", busy: this.props.busy, perform: this.props.perform, onPendingChange: this.permissionPending }, session.id) : null,
            session && latest ? /* @__PURE__ */ jsx(ChatWorkflows, { data, session, busy: this.props.busy, readCurrent: this.props.readCurrent, validationPerform: this.props.validationPerform, perform: this.props.perform, onSession: this.props.onSession, onExperiment: this.props.onExperiment, onRun: this.props.onRun }) : null,
            session ? /* @__PURE__ */ jsx(ResearchActionCards, { data, session, busy: this.props.busy, perform: this.props.perform, onSession: this.props.onSession, onRun: this.props.onRun, onCampaign: this.props.onCampaign, onRegister: this.props.onRegister, onClaim: this.props.onClaim, onUseDocument: this.props.onUseDocument, onSources: this.props.onSources }) : null,
            latest ? /* @__PURE__ */ jsx(WakeupPanel, { data, busy: this.props.busy, sessionId: session?.id, perform: this.props.perform, onSession: this.props.onSession }) : null,
            /* @__PURE__ */ jsx("p", { className: "small muted chat-drawer-history-note", tabIndex: -1, children: "\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559\u5728\u64CD\u4F5C\u5BA1\u6279\u5386\u53F2\u3001\u7ED3\u679C\u901A\u77E5\u548C\u5DF2\u5B8C\u6210\u4E8B\u9879\u4E2D\uFF1B\u53EF\u5C55\u5F00\u5DF2\u6709\u8BB0\u5F55\u3002" }),
            !latest ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B63\u5728\u67E5\u770B\u6D88\u606F\u5386\u53F2\uFF0C\u8FD4\u56DE\u6700\u65B0\u6D88\u606F\u540E\u663E\u793A\u5F53\u524D\u4EFB\u52A1\u4E0E\u5BA1\u6279\u3002" }) : null,
            this.props.archivedHistory
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "composer-wrap", children: [
        this.state.draftSaveError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.draftSaveError }) : null,
        /* @__PURE__ */ jsxs("div", { className: "composer-stack", children: [
          session?.role === "coordinator" ? /* @__PURE__ */ jsx(MessageQueue, { projectId: data.project.id, sessionId: session.id, messages: this.props.pendingMessages, total: this.props.pendingTotal, nextCursor: this.props.pendingNextCursor, canSteer: this.props.canSteer, disabled: data.project.archived || !!session.taskId || session.state === "archived" || !!this.props.historyAnchor || !!this.props.history && !this.props.history.atLatest, busy: this.props.busy, perform: this.props.perform }, data.project.id + ":" + session.id) : null,
          /* @__PURE__ */ jsxs("form", { className: "composer", onSubmit: this.submit, children: [
            /* @__PURE__ */ jsx("textarea", { "aria-label": "\u7814\u7A76\u95EE\u9898", placeholder: data.project.archived ? "\u5DF2\u5F52\u6863\u9879\u76EE\uFF0C\u53EA\u8BFB\u67E5\u770B\u5386\u53F2" : session?.taskId ? "\u8BF7\u901A\u8FC7\u56E2\u961F\u4EFB\u52A1\u63A7\u4EF6\u64CD\u4F5C" : session?.state === "archived" ? "\u5DF2\u5F52\u6863\u4F1A\u8BDD\u4E0D\u53EF\u53D1\u9001" : this.props.historyAnchor || this.props.history && !this.props.history.atLatest ? "\u8FD4\u56DE\u6700\u65B0\u6D88\u606F\u540E\u53EF\u53D1\u9001" : !runtimeAvailable ? "Pi \u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u67E5\u770B\u4E0A\u65B9\u8BF4\u660E\u2026" : !session ? "\u9009\u62E9\u6216\u65B0\u5EFA\u4F1A\u8BDD\u540E\u5F00\u59CB\u7814\u7A76\u2026" : !sessionModelAvailable ? "\u914D\u7F6E Pi \u4F9B\u5E94\u5546\u548C\u6A21\u578B\u540E\uFF0C\u5728\u8FD9\u91CC\u5F00\u59CB\u7814\u7A76\u2026" : "\u63CF\u8FF0\u7814\u7A76\u95EE\u9898\u2026", value: this.state.draft, disabled: data.project.archived || !!session?.taskId || session?.state === "archived", onChange: (e) => this.setState((current) => ({ draft: e.target.value, draftVersion: current.draftVersion + 1 })), onKeyDown: (e) => {
              if (e.key !== "Enter" || e.shiftKey || e.isComposing || e.nativeEvent?.isComposing || e.keyCode === 229 || e.nativeEvent?.keyCode === 229) return;
              e.preventDefault();
              e.currentTarget.form.requestSubmit();
            } }),
            /* @__PURE__ */ jsx(ComposerControls, { onStopped: () => {
              if (this.mounted && JSON.stringify([this.props.data.project.id, this.props.session?.id, this.props.session?.generation]) === previewKey) this.setState({ stoppedPreview: previewKey });
            }, ref: this.composerControls, permissionControl: boot.runtime.hostAccess?.available && session && !session.taskId ? /* @__PURE__ */ jsx(HostAccessControl, { sessionId: session.id, archived: data.project.archived || session.state === "archived", busy: this.props.busy, perform: this.props.perform }, session.id) : null, boot, projectId: data.project.id, projectArchived: !!data.project.archived, modelLocked: !!session?.workingGrantId || !!session?.textCorpusGrantId || !!session?.discoveryGrantId || !!session?.runGrantId || !!data.teams?.some((team) => team.rootSessionId === session?.id && !["completed", "partial", "failed", "cancelled"].includes(team.state)), session, busy: this.props.busy, perform: this.props.perform, attachments: this.state.attachments, onAddAttachment: (attachment) => this.setState((current) => ({ attachments: [...current.attachments, attachment] })), onRemoveAttachment: (documentVersionId) => this.setState((current) => ({ attachments: current.attachments.filter((attachment) => attachment.documentVersionId !== documentVersionId) })), canSend, hasDraft, onSendModel: (model) => session && this.props.session?.id === session.id && this.props.data.project.id === data.project.id ? this.changeModel(model) : Promise.resolve(void 0), children: /* @__PURE__ */ jsxs("div", { className: "chat-collaboration-control", children: [
              /* @__PURE__ */ jsx("button", { type: "button", role: "switch", "aria-label": "\u591A\u667A\u80FD\u4F53\u6A21\u5F0F", "aria-checked": data.project.settings.enabled ? "true" : "false", title: "\u9879\u76EE\u7EA7\u8BBE\u7F6E\uFF0C\u540C\u9879\u76EE\u6240\u6709\u7814\u7A76\u4F1A\u8BDD\u5171\u4EAB", className: "switch " + (data.project.settings.enabled ? "on" : ""), disabled: this.props.busy || data.project.archived || !session || !!session.taskId || session.state === "archived", onClick: this.props.onToggle, children: /* @__PURE__ */ jsx("span", {}) }),
              /* @__PURE__ */ jsx("span", { children: "\u591A\u667A\u80FD\u4F53" })
            ] }) }, `${data.project.id}:${session?.id ?? ""}`)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "composer-caption composer-caption-note", children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Enter \u53D1\u9001",
            /* @__PURE__ */ jsx("span", { className: "host-extra-key", children: " \xB7 Shift + Enter \u6362\u884C \xB7 Ctrl/\u2318 + Enter \u53D1\u9001" })
          ] })
        ] })
      ] }),
      this.renderRename()
    ] });
  }
  renderRename() {
    const { renameTarget: target, renameTitle, renameError, renameSaving } = this.state;
    if (!target) return null;
    const dialog = /* @__PURE__ */ jsx("div", { onSubmit: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: /* @__PURE__ */ jsxs(Modal, { title: "\u91CD\u547D\u540D\u4F1A\u8BDD", submitLabel: "\u4FDD\u5B58\u540D\u79F0", busy: renameSaving, closeDisabled: renameSaving, submitDisabled: !this.renameCurrent(target) || this.props.busy || !renameTitle.trim() || renameTitle.trim().length > 160, onClose: this.closeRename, onSubmit: () => this.submitRename(target), children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "\u4F1A\u8BDD\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { ref: this.renameInput, name: "title", required: true, maxLength: 160, value: renameTitle, disabled: renameSaving, onChange: (event) => {
          if (this.renameCurrent(target) && !this.renaming) this.setState({ renameTitle: event.target.value, renameError: "" });
        } })
      ] }),
      renameError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: renameError }) : null
    ] }) });
    return typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
  }
}
class OutcomeReview extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { target: null, reason: "", error: "", saving: false };
    this.pending = null;
    this.disposed = false;
    this.epoch = 0;
    this.disposition = (run) => run.metrics && Object.keys(run.metrics).length ? "answered" : run.answerDisposition ?? (run.state === "cancelled" && !run.startedAt ? "unanswered" : "needs_review");
    this.eligible = () => ["succeeded", "failed", "cancelled"].includes(this.props.run.state) && this.disposition(this.props.run) === "needs_review";
    this.active = (target) => !this.disposed && this.state.target === target && this.epoch === target.epoch;
    this.current = (target) => this.active(target) && !this.props.readOnly && this.eligible() && target.id === this.props.run.id && target.version === this.props.run.version && target.projectId === this.props.run.projectId && target.experimentId === this.props.run.experimentId && target.state === this.props.run.state;
  }
  componentWillUnmount() {
    this.disposed = true;
    this.epoch++;
    this.pending = null;
  }
  componentDidUpdate(previous) {
    const run = this.props.run, old = previous.run;
    if (old.id !== run.id || old.version !== run.version || old.projectId !== run.projectId || old.experimentId !== run.experimentId || old.state !== run.state || this.disposition(old) !== this.disposition(run) || previous.readOnly !== this.props.readOnly) {
      this.epoch++;
      this.pending = null;
      if (this.state.target) this.setState({ saving: false, error: "\u8FD0\u884C\u8BB0\u5F55\u6216\u9879\u76EE\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u5F39\u7A97\u540E\u91CD\u65B0\u6838\u5BF9\u3002" });
      else this.setState({ saving: false });
    }
  }
  open(disposition, run = this.props.run, epoch = this.epoch) {
    if (run !== this.props.run || epoch !== this.epoch || this.disposed || this.props.readOnly || this.state.target || this.pending || !this.eligible()) return;
    const { id, version, projectId, experimentId, state } = this.props.run;
    this.setState({ target: { id, version, projectId, experimentId, state, disposition, epoch: ++this.epoch }, reason: "", error: "", saving: false });
  }
  close(target = this.state.target) {
    if (!this.disposed && target === this.state.target && this.pending !== target) {
      this.epoch++;
      this.setState({ target: null, reason: "", error: "", saving: false });
    }
  }
  async save(target = this.state.target) {
    if (!target || this.disposed || target !== this.state.target || this.pending) return;
    if (!this.current(target)) {
      this.setState({ error: "\u8FD0\u884C\u8BB0\u5F55\u6216\u9879\u76EE\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u5F39\u7A97\u540E\u91CD\u65B0\u6838\u5BF9\u3002" });
      return;
    }
    const reason = this.state.reason.trim();
    if (!reason || reason.length > 4e3) {
      this.setState({ error: "\u8BC4\u8BAE\u7406\u7531\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u4E14\u4E0D\u80FD\u8D85\u8FC7 4000 \u4E2A\u5B57\u7B26\u3002" });
      return;
    }
    let sent = false;
    this.pending = target;
    this.setState({ saving: true, error: "" });
    try {
      await this.props.perform(async () => {
        if (!this.current(target)) throw Error("\u8FD0\u884C\u8BB0\u5F55\u6216\u9879\u76EE\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u5F39\u7A97\u540E\u91CD\u65B0\u6838\u5BF9\u3002");
        if (sent) throw Error("\u672C\u6B21\u8BC4\u8BAE\u5DF2\u63D0\u4EA4\uFF0C\u8BF7\u7B49\u5F85\u5904\u7406\u5B8C\u6210\u3002");
        try {
          sent = true;
          const result = await api(`/runs/${target.id}/outcome-review`, { expectedVersion: target.version, disposition: target.disposition, reason });
          if (this.current(target)) {
            this.epoch++;
            this.pending = null;
            this.setState({ target: null, reason: "", error: "", saving: false });
          }
          return result;
        } catch (error) {
          if (this.current(target)) this.setState({ error: error instanceof Error ? error.message : String(error) });
          throw error;
        }
      }, "\u5DF2\u4FDD\u5B58\u7ED3\u679C\u8BC4\u8BAE\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u542F\u52A8\u8BA1\u7B97");
      if (!sent && this.current(target)) this.setState({ error: "\u5F53\u524D\u64CD\u4F5C\u672A\u6267\u884C\uFF0C\u8BF7\u7B49\u5F85\u5176\u4ED6\u64CD\u4F5C\u5B8C\u6210\u540E\u91CD\u8BD5\u3002" });
    } catch (error) {
      if (this.current(target)) this.setState({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      if (this.pending === target) this.pending = null;
      if (this.active(target)) this.setState({ saving: false });
    }
  }
  render() {
    const { run, readOnly } = this.props, { target, reason, error, saving } = this.state;
    const disposition = this.disposition(run), terminal = ["succeeded", "failed", "cancelled"].includes(run.state), epoch = this.epoch;
    const stale = !!target && !this.current(target);
    const dialog = target ? /* @__PURE__ */ jsx("div", { onSubmit: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: /* @__PURE__ */ jsxs(Modal, { title: "\u8FD0\u884C\u7ED3\u679C\u8BC4\u8BAE", description: "\u5148\u68C0\u67E5\u65E5\u5FD7\u4E0E\u539F\u59CB\u4EA7\u7269\uFF0C\u518D\u8BF4\u660E\u6B64\u6B21\u8FD0\u884C\u662F\u5426\u56DE\u7B54\u7814\u7A76\u95EE\u9898\u3002", submitLabel: target.disposition === "unanswered" ? "\u786E\u8BA4\u672A\u56DE\u7B54\uFF0C\u5141\u8BB8\u51C6\u5907\u4FEE\u590D" : "\u786E\u8BA4\u5DF2\u56DE\u7B54\uFF0C\u51BB\u7ED3\u8282\u70B9", busy: saving, closeDisabled: saving, submitDisabled: !!readOnly || stale || !reason.trim() || reason.trim().length > 4e3, onClose: () => this.close(target), onSubmit: () => this.save(target), children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "\u8FD0\u884C ",
        /* @__PURE__ */ jsx("code", { children: short(target.id) }),
        " \xB7 \u7248\u672C ",
        target.version,
        " \xB7 ",
        target.disposition === "unanswered" ? "\u672A\u56DE\u7B54\u7814\u7A76\u95EE\u9898" : "\u5DF2\u56DE\u7B54\u7814\u7A76\u95EE\u9898"
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u8BC4\u8BAE\u7406\u7531",
        /* @__PURE__ */ jsx("textarea", { name: "reason", "aria-label": "\u8BC4\u8BAE\u7406\u7531", rows: 5, required: true, maxLength: 4e3, value: reason, disabled: saving || readOnly || stale, onChange: (event) => {
          if (this.current(target) && !this.pending) this.setState({ reason: event.target.value, error: "" });
        }, placeholder: "\u8BF7\u7ED3\u5408\u65E5\u5FD7\u548C\u539F\u59CB\u4EA7\u7269\u8BF4\u660E\u5224\u65AD\u4F9D\u636E\u2026" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: target.disposition === "unanswered" ? "\u4FDD\u5B58\u540E\u53EF\u51C6\u5907\u6709\u754C\u4FEE\u590D\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u542F\u52A8\u8BA1\u7B97\u3002" : "\u4FDD\u5B58\u540E\u8BE5\u8282\u70B9\u6E90\u7801\u53D7\u4FDD\u62A4\uFF0C\u540E\u7EED\u6539\u52A8\u9700\u6D3E\u751F\u65B0\u5B50\u5B9E\u9A8C\u3002" }),
      error || stale || readOnly ? /* @__PURE__ */ jsxs("p", { className: "error-text", role: "alert", children: [
        error || (readOnly ? "\u9879\u76EE\u5DF2\u5F52\u6863\uFF0C\u4E0D\u80FD\u4FDD\u5B58\u8BC4\u8BAE\u3002" : "\u8FD0\u884C\u8BB0\u5F55\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u5F39\u7A97\u540E\u91CD\u65B0\u6838\u5BF9\u3002"),
        " \u5F53\u524D\u8F93\u5165\u4FDD\u7559\u3002"
      ] }) : null
    ] }) }) : null;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      terminal ? disposition !== "needs_review" ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u95EE\u9898\u56DE\u7B54\u72B6\u6001\uFF1A",
        disposition === "answered" ? "\u5DF2\u6709\u7ED3\u679C\uFF0C\u6E90\u7801\u53D7\u4FDD\u62A4" : "\u7528\u6237\u786E\u8BA4\u672A\u56DE\u7B54\uFF0C\u53EF\u51C6\u5907\u6709\u754C\u4FEE\u590D"
      ] }) : /* @__PURE__ */ jsxs("div", { className: "approval-card", children: [
        /* @__PURE__ */ jsx("h4", { children: "\u6B64\u6B21\u8FD0\u884C\u662F\u5426\u56DE\u7B54\u7814\u7A76\u95EE\u9898\uFF1F" }),
        /* @__PURE__ */ jsx("p", { className: "small", children: "\u65E0\u6709\u6548\u6570\u503C\u4E0D\u4E00\u5B9A\u8868\u793A\u6CA1\u6709\u7814\u7A76\u7ED3\u679C\u3002\u8BF7\u7ED3\u5408\u5047\u8BBE\u4E0E\u771F\u5B9E\u65E5\u5FD7\u5224\u65AD\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u4FEE\u6539\u6267\u884C\u72B6\u6001\u3001\u4EA7\u7269\u5B8C\u6574\u6027\u6216\u5047\u8BBE\u7ED3\u8BBA\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "stack-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: readOnly || saving, onClick: () => this.open("unanswered", run, epoch), children: "\u672A\u56DE\u7B54\uFF1A\u5141\u8BB8\u51C6\u5907\u4FEE\u590D" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", disabled: readOnly || saving, onClick: () => this.open("answered", run, epoch), children: "\u5DF2\u56DE\u7B54\uFF1A\u51BB\u7ED3\u8282\u70B9" })
        ] })
      ] }) : null,
      dialog && typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog
    ] });
  }
}
class RunFiles extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { artifactId: "", artifactContent: "", artifactLoading: false, artifactError: "", files: [], sourceLoaded: false, sourcePath: "", sourceContent: "", sourceCursor: 0, sourceComplete: false, sourceLoading: false, sourceError: "", gitCommit: this.props.run.manifest.gitCommit ?? "" };
    this.sourceEpoch = 0;
    this.artifactEpoch = 0;
  }
  componentWillUnmount() {
    this.sourceEpoch++;
    this.artifactEpoch++;
  }
  async openArtifact(id) {
    const epoch = ++this.artifactEpoch;
    this.setState({ artifactId: id, artifactContent: "", artifactLoading: true, artifactError: "" });
    try {
      const content = await artifactText(id);
      if (content.includes("\0")) throw Error("\u4E8C\u8FDB\u5236\u4EA7\u7269\u8BF7\u4E0B\u8F7D\u67E5\u770B\u3002");
      if (epoch === this.artifactEpoch) this.setState({ artifactContent: content.length > 65536 ? content.slice(0, 65536) + "\n\u2026\u9884\u89C8\u5230\u6B64\uFF0C\u4E0B\u8F7D\u53EF\u67E5\u770B\u5B8C\u6574\u6587\u4EF6\u3002" : content });
    } catch (error) {
      if (epoch === this.artifactEpoch) this.setState({ artifactError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (epoch === this.artifactEpoch) this.setState({ artifactLoading: false });
    }
  }
  sourceOperation(name, input) {
    return api(`/operations/${name}`, { projectId: this.props.data.project.id, input: { runId: this.props.run.id, ...input } });
  }
  async loadSource() {
    const epoch = ++this.sourceEpoch;
    this.setState({ sourceLoading: true, sourceError: "" });
    try {
      const result = await this.sourceOperation("run_source_list", {});
      if (result.sourceDigest !== this.props.run.manifest.snapshotDigest) throw Error("\u6E90\u7801\u6458\u8981\u4E0E\u6240\u9009\u8FD0\u884C\u4E0D\u4E00\u81F4\u3002");
      if (epoch === this.sourceEpoch) this.setState({ files: result.files, sourceLoaded: true, gitCommit: result.gitCommit ?? "" });
    } catch (error) {
      if (epoch === this.sourceEpoch) this.setState({ sourceError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (epoch === this.sourceEpoch) this.setState({ sourceLoading: false });
    }
  }
  async readSource(path, append = false) {
    if (append && this.state.sourceLoading) return;
    const epoch = ++this.sourceEpoch, cursor = append ? this.state.sourceCursor : 0;
    this.setState((previous) => ({ ...previous, sourceLoading: true, sourceError: "", sourcePath: path, ...!append ? { sourceContent: "", sourceCursor: 0, sourceComplete: false } : {} }));
    try {
      const result = await this.sourceOperation("run_source_read", { path, cursor, limit: 16e3 });
      if (result.sourceDigest !== this.props.run.manifest.snapshotDigest) throw Error("\u6E90\u7801\u6458\u8981\u4E0E\u6240\u9009\u8FD0\u884C\u4E0D\u4E00\u81F4\u3002");
      if (epoch === this.sourceEpoch) this.setState({ sourceContent: (append ? this.state.sourceContent : "") + result.content, sourceCursor: result.end, sourceComplete: result.complete });
    } catch (error) {
      if (epoch === this.sourceEpoch) this.setState({ sourceError: error instanceof Error ? error.message : String(error) });
    } finally {
      if (epoch === this.sourceEpoch) this.setState({ sourceLoading: false });
    }
  }
  render() {
    const { run, data, perform } = this.props, artifacts = run.artifactIds.map((id) => data.artifacts.find((a) => a.id === id)).filter((a) => !!a), file = this.state.files.find((f) => f.path === this.state.sourcePath);
    return /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("details", { open: true, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u771F\u5B9E\u8FD0\u884C\u65E5\u5FD7" }),
        /* @__PURE__ */ jsx(LogView, { streamLabel: "\u65E5\u5FD7\u6D41", read: (request, signal) => api(`/runs/${run.id}/logs?stream=${request.stream}&cursor=${request.cursor}${request.identity ? "&identity=" + encodeURIComponent(request.identity) : ""}`, void 0, "GET", signal) })
      ] }),
      /* @__PURE__ */ jsxs("details", { open: true, children: [
        /* @__PURE__ */ jsx("summary", { children: "\u539F\u59CB\u6307\u6807\u4E0E\u4EA7\u7269" }),
        artifacts.length ? /* @__PURE__ */ jsx("ul", { children: artifacts.map((a) => /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => void this.openArtifact(a.id), children: a.title }),
          /* @__PURE__ */ jsx("button", { className: "text-button", "aria-label": `\u4E0B\u8F7D ${a.title}`, onClick: () => perform(() => downloadArtifact(a.id, a.title)), children: "\u4E0B\u8F7D" }),
          /* @__PURE__ */ jsxs("small", { className: "muted", children: [
            a.size,
            " \u5B57\u8282 \xB7 ",
            short(a.digest)
          ] })
        ] }, a.id)) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6682\u65E0\u5F52\u6863\u4EA7\u7269\u3002" }),
        this.state.artifactLoading ? /* @__PURE__ */ jsx("p", { role: "status", children: "\u8BFB\u53D6\u4EA7\u7269\u2026" }) : null,
        this.state.artifactError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.artifactError }) : null,
        this.state.artifactId && !this.state.artifactLoading && !this.state.artifactError ? /* @__PURE__ */ jsx("pre", { className: "logs", "aria-label": "\u539F\u59CB\u4EA7\u7269\u5185\u5BB9", children: this.state.artifactContent || "\uFF08\u7A7A\u6587\u4EF6\uFF09" }) : null
      ] }),
      /* @__PURE__ */ jsxs("details", { children: [
        /* @__PURE__ */ jsx("summary", { children: "\u672C\u6B21\u8FD0\u884C\u7684\u56FA\u5B9A\u6E90\u7801" }),
        /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5B9E\u9A8C\u4FEE\u8BA2 v",
          run.manifest.experimentRevision,
          " \xB7 \u6E90\u7801 SHA-256"
        ] }),
        /* @__PURE__ */ jsx("code", { className: "digest", children: run.manifest.snapshotDigest }),
        this.state.gitCommit ? /* @__PURE__ */ jsxs("p", { children: [
          "Git commit ",
          /* @__PURE__ */ jsx("code", { className: "digest", children: this.state.gitCommit })
        ] }) : null,
        /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: this.state.sourceLoading, onClick: () => void this.loadSource(), children: "\u8BFB\u53D6\u8FD0\u884C\u6E90\u7801\u6E05\u5355" }),
        this.state.sourceLoaded ? /* @__PURE__ */ jsxs("label", { children: [
          "\u56FA\u5B9A\u6E90\u7801\u6587\u4EF6",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u56FA\u5B9A\u6E90\u7801\u6587\u4EF6", value: this.state.sourcePath, onChange: (e) => {
            if (e.target.value) void this.readSource(e.target.value);
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
        ] }) : null,
        this.state.sourceError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.sourceError }) : null,
        file ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            file.path,
            " \xB7 ",
            file.mode ?? "\u65E7\u7248\u672A\u8BB0\u5F55\u6A21\u5F0F"
          ] }),
          /* @__PURE__ */ jsx("code", { className: "digest", children: file.digest }),
          /* @__PURE__ */ jsx("pre", { className: "logs", "aria-label": "\u56FA\u5B9A\u8FD0\u884C\u6E90\u7801", children: this.state.sourceContent || (this.state.sourceLoading ? "\u8BFB\u53D6\u6E90\u7801\u2026" : "\uFF08\u7A7A\u6587\u4EF6\uFF09") }),
          /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: this.state.sourceLoading || this.state.sourceComplete, onClick: () => void this.readSource(file.path, true), children: this.state.sourceComplete ? "\u6E90\u7801\u5DF2\u5B8C\u6574\u8BFB\u53D6" : "\u8BFB\u53D6\u540E\u7EED\u6E90\u7801" })
        ] }) : null
      ] })
    ] });
  }
}
class Inspector extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { reviewTarget: null, reviewReason: "", reviewError: "", reviewSaving: false };
    this.reviewPending = false;
    this.reviewDisposed = false;
    this.reviewEpoch = 0;
    this.reviewDialog = null;
    this.reviewTeam = (props = this.props) => props.data.teams.slice().reverse().find((team) => props.tab !== "chat" || team.rootSessionId === props.sessionId);
    this.reviewContext = (props = this.props) => {
      const team = this.reviewTeam(props), session = props.data.sessions?.find((row) => row.id === props.sessionId);
      return JSON.stringify([props.data.project.id, props.data.project.archived, props.data.project.settings.enabled, props.sessionId, session?.state, props.tab, props.embedded, props.inlineWorkflows, props.experiment?.id, props.selectedRun, team?.id, team?.version, team?.rootSessionId, team?.state, props.data.tasks.filter((task) => task.teamId === team?.id).map((task) => [task.id, task.version, task.key, task.objective, task.execution, task.acceptance, task.reviewOf])]);
    };
    this.reviewActive = (target) => !this.reviewDisposed && this.reviewDialog === target && this.state.reviewTarget === target && target.epoch === this.reviewEpoch;
    this.reviewCurrent = (target) => this.reviewActive(target) && !this.props.data.project.archived && this.reviewContext() === target.context;
    this.closeReview = (target) => {
      if (this.reviewDisposed || this.reviewPending || this.reviewDialog !== target) return;
      this.reviewDialog = null;
      this.reviewEpoch++;
      this.setState((state) => state.reviewTarget === target ? { reviewTarget: null, reviewError: "" } : null);
    };
    this.openReview = (taskId) => {
      const { data, sessionId } = this.props, team = this.reviewTeam(), task = data.tasks.find((row) => row.id === taskId && row.teamId === team?.id);
      if (this.reviewDisposed || this.reviewPending || this.reviewDialog || data.project.archived || this.props.tab === "experiments" || !team || !task || task.projectId !== data.project.id || task.execution !== "output_submitted" || !["pending", "rejected", "disputed"].includes(task.acceptance)) return;
      const target = { projectId: data.project.id, sessionId, teamId: team.id, taskId: task.id, taskVersion: task.version, key: task.key, objective: task.objective, context: this.reviewContext(), epoch: ++this.reviewEpoch };
      this.reviewDialog = target;
      this.setState({ reviewTarget: target, reviewReason: "", reviewError: "", reviewSaving: false });
    };
    this.submitReview = async (target) => {
      if (!this.reviewCurrent(target) || this.reviewPending) return;
      const reason = this.state.reviewReason.trim();
      if (!reason || reason.length > 4e3) {
        this.setState({ reviewError: "\u5BA1\u67E5\u4F9D\u636E\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u4E14\u4E0D\u80FD\u8D85\u8FC7 4000 \u4E2A\u5B57\u7B26\u3002" });
        return;
      }
      let invoked = false;
      this.reviewPending = true;
      this.setState({ reviewSaving: true, reviewError: "" });
      try {
        return await this.props.perform(async () => {
          invoked = true;
          if (!this.reviewCurrent(target)) throw Error("\u4EFB\u52A1\u6216\u9875\u9762\u4E0A\u4E0B\u6587\u5DF2\u53D8\u5316\uFF0C\u4EBA\u5DE5\u5BA1\u67E5\u5DF2\u5931\u6548\u3002");
          try {
            const confirmed = await api(`/tasks/${encodeURIComponent(target.taskId)}/manual-review`, { verdict: "accepted", reason, expectedVersion: target.taskVersion });
            if (this.reviewCurrent(target)) {
              this.reviewDialog = null;
              this.reviewEpoch++;
              this.setState({ reviewTarget: null, reviewSaving: false, reviewError: "" });
            }
            return confirmed;
          } catch (error) {
            if (this.reviewActive(target)) this.setState({ reviewError: error instanceof Error ? error.message : String(error) });
            throw error;
          }
        });
      } catch (error) {
        if (this.reviewActive(target)) this.setState({ reviewError: error instanceof Error ? error.message : String(error) });
      } finally {
        this.reviewPending = false;
        if (!this.reviewDisposed && this.state.reviewTarget === target) this.setState((state) => ({ reviewSaving: false, reviewError: !invoked && this.reviewActive(target) ? "\u5F53\u524D\u64CD\u4F5C\u7E41\u5FD9\uFF0C\u4EBA\u5DE5\u5BA1\u67E5\u672A\u63D0\u4EA4\uFF1B\u4F9D\u636E\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002" : state.reviewError }));
      }
    };
  }
  componentWillUnmount() {
    this.reviewDisposed = true;
    this.reviewDialog = null;
    this.reviewEpoch++;
  }
  componentDidUpdate(previous) {
    if (this.state.reviewTarget && this.reviewContext(previous) !== this.reviewContext()) {
      this.reviewEpoch++;
      this.setState({ reviewError: "\u4EFB\u52A1\u6216\u9875\u9762\u4E0A\u4E0B\u6587\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5173\u95ED\u540E\u91CD\u65B0\u6253\u5F00\u4EBA\u5DE5\u5BA1\u67E5\u7A97\u53E3\u3002" });
    }
  }
  renderReview() {
    const { reviewTarget: target, reviewReason, reviewError, reviewSaving } = this.state;
    if (!target) return null;
    const dialog = /* @__PURE__ */ jsx("div", { onSubmit: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: /* @__PURE__ */ jsxs(Modal, { title: "\u4EBA\u5DE5\u786E\u8BA4\u9A8C\u6536", submitLabel: "\u786E\u8BA4\u9A8C\u6536", busy: reviewSaving, closeDisabled: reviewSaving, submitDisabled: !this.reviewCurrent(target) || !reviewReason.trim() || reviewReason.trim().length > 4e3, onClose: () => this.closeReview(target), onSubmit: () => this.submitReview(target), children: [
      /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u4EFB\u52A1 ",
        /* @__PURE__ */ jsx("code", { children: target.key }),
        " \xB7 v",
        target.taskVersion
      ] }),
      /* @__PURE__ */ jsx("p", { className: "prose-text", children: target.objective }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u4EBA\u5DE5\u5BA1\u67E5\u4F9D\u636E\uFF08\u5C06\u4FDD\u7559\u8BB0\u5F55\uFF09",
        /* @__PURE__ */ jsx("textarea", { name: "reason", rows: 6, required: true, maxLength: 4e3, value: reviewReason, disabled: reviewSaving, onChange: (event) => {
          if (this.reviewCurrent(target) && !this.reviewPending) this.setState({ reviewReason: event.target.value, reviewError: "" });
        } })
      ] }),
      reviewError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: reviewError }) : null
    ] }) });
    return typeof document !== "undefined" ? createPortal(dialog, document.body) : dialog;
  }
  currentRun() {
    const runs = this.props.data.runs.filter((r) => r.experimentId === this.props.experiment?.id);
    return this.props.selectedRun ? runs.find((r) => r.id === this.props.selectedRun) : runs[runs.length - 1];
  }
  render() {
    const { data, boot, experiment: e, perform } = this.props;
    const teams = data.teams.slice().reverse().filter((t) => this.props.tab !== "chat" || t.rootSessionId === this.props.sessionId);
    const team = teams[0];
    const tasks = team ? data.tasks.filter((t) => t.teamId === team.id) : [];
    const budget = data.budgets.find((b) => b.teamId === team?.id);
    const run = this.currentRun();
    const teamIds = new Set(teams.map((t) => t.id));
    const inlineReviewTeams = new Set(this.props.inlineWorkflows ? (data.reviews ?? []).filter((r) => r.producerSessionId === this.props.sessionId).map((r) => r.teamId) : []);
    const pendingTeams = data.approvals.filter((a) => a.subjectKind === "team" && (a.status === "pending" || a.status === "approved" && teams.some((t) => t.id === a.subjectId && t.state === "awaiting_approval")) && teamIds.has(a.subjectId) && !inlineReviewTeams.has(a.subjectId));
    const manualPendingTeams = pendingTeams.filter((a) => !a.automaticApproval);
    return /* @__PURE__ */ jsxs("aside", { className: "inspector" + (this.props.embedded ? " embedded-inspector" : ""), "aria-label": this.props.tab === "experiments" ? "\u5B9E\u9A8C\u4E0E\u8FD0\u884C\u8BE6\u60C5" : this.props.embedded ? "\u5F53\u524D\u4F1A\u8BDD\u534F\u4F5C\u7A7A\u95F4" : void 0, children: [
      !this.props.embedded || this.props.tab === "experiments" ? /* @__PURE__ */ jsxs("div", { className: "inspector-title", children: [
        /* @__PURE__ */ jsx(Icon, { name: this.props.tab === "experiments" ? "experiment" : "branch" }),
        /* @__PURE__ */ jsx("h2", { children: this.props.tab === "experiments" ? "\u5B9E\u9A8C\u8BE6\u60C5" : "\u534F\u4F5C\u7A7A\u95F4" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u672C\u5730" })
      ] }) : null,
      this.props.tab === "experiments" && e ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsxs("div", { className: "detail-title", children: [
          /* @__PURE__ */ jsx("h3", { children: e.title }),
          /* @__PURE__ */ jsx("div", { "data-testid": "selected-experiment-state", children: /* @__PURE__ */ jsx(Badge, { value: e.lifecycle }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "detail-hypothesis", children: e.hypothesis }),
        /* @__PURE__ */ jsxs("dl", { className: "details", children: [
          /* @__PURE__ */ jsx("dt", { children: "\u5B9E\u9A8C ID" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: short(e.id) }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u65B9\u6848\u4FEE\u8BA2" }),
          /* @__PURE__ */ jsxs("dd", { children: [
            "v",
            e.revision
          ] }),
          /* @__PURE__ */ jsx("dt", { children: "\u56FA\u5B9A\u5165\u53E3" }),
          /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: e.contract.command.join(" ") }) }),
          /* @__PURE__ */ jsx("dt", { children: "\u8BA1\u7B97\u65B9\u5F0F" }),
          /* @__PURE__ */ jsx("dd", { children: e.contract.runner === "trusted-example" ? "\u53D7\u4FE1\u672C\u5730\u6570\u503C\u793A\u4F8B" : e.contract.runner === "local" ? "\u672C\u5730 \xB7 \u5F53\u524D\u7528\u6237\u6743\u9650\uFF08\u4E0D\u9694\u79BB\uFF09" : e.contract.runner === "ssh" ? "SSH \xB7 \u56FA\u5B9A\u955C\u50CF\u9694\u79BB\u8FD0\u884C" : "Docker \xB7 \u56FA\u5B9A\u955C\u50CF\u9694\u79BB\u8FD0\u884C" }),
          /* @__PURE__ */ jsx("dt", { children: "\u6570\u636E\u7248\u672C" }),
          /* @__PURE__ */ jsx("dd", { children: e.contract.datasetVersion })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "secondary", onClick: this.props.onConfig, children: "\u67E5\u770B\u53EA\u8BFB\u914D\u7F6E" }),
        this.props.selectedRun && !run ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u6307\u5B9A Run \u4E0D\u5C5E\u4E8E\u5F53\u524D\u5B9E\u9A8C\u6216\u5DF2\u4E0D\u53EF\u7528\uFF0C\u672A\u663E\u793A\u5176\u4ED6\u8FD0\u884C\u3002" }) : null,
        run ? /* @__PURE__ */ jsxs("div", { className: "run-detail", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u67E5\u770B\u8FD0\u884C",
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u67E5\u770B\u8FD0\u884C", value: run.id, onChange: (event) => this.props.onRun?.(event.target.value), children: [
              nativeSelectButton,
              data.runs.filter((r) => r.experimentId === e.id).slice().reverse().map((r) => /* @__PURE__ */ jsxs("option", { value: r.id, children: [
                date(r.createdAt),
                " \xB7 ",
                short(r.id),
                " \xB7 ",
                label(r.state)
              ] }, r.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("h4", { children: [
            "\u8FD0\u884C ",
            /* @__PURE__ */ jsx("code", { children: short(run.id) })
          ] }),
          run.execution ? /* @__PURE__ */ jsxs("dl", { className: "details", children: [
            /* @__PURE__ */ jsx("dt", { children: "Docker context" }),
            /* @__PURE__ */ jsx("dd", { children: run.execution.dockerContext }),
            /* @__PURE__ */ jsx("dt", { children: "\u5B9E\u9645\u955C\u50CF ID" }),
            /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { className: "digest", children: run.execution.imageId ?? "\u7B49\u5F85\u5BB9\u5668\u9884\u68C0" }) })
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsx(Badge, { value: run.state }),
            /* @__PURE__ */ jsx(Badge, { value: run.integrity })
          ] }),
          run.metrics ? /* @__PURE__ */ jsx("dl", { className: "details", children: Object.entries(run.metrics).map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "detail-pair", children: [
            /* @__PURE__ */ jsx("dt", { children: k }),
            /* @__PURE__ */ jsxs("dd", { className: "numeric", children: [
              number(v),
              " ",
              e.contract.metrics[k]?.unit,
              e.contract.metrics[k] ? " \xB7 " + (e.contract.metrics[k].direction === "max" ? "\u8D8A\u9AD8\u8D8A\u597D" : "\u8D8A\u4F4E\u8D8A\u597D") : null
            ] })
          ] }, k)) }) : null,
          ["queued", "submitting", "running", "cancelling", "unknown"].includes(run.state) ? /* @__PURE__ */ jsx(ComputeWait, { data, kind: "run", id: run.id }) : null,
          /* @__PURE__ */ jsx(OutcomeReview, { run, perform, readOnly: data.project.archived }, `outcome:${run.id}`),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u79D1\u7814\u5224\u65AD\uFF1A",
            run.judgment === "pending" ? "\u5C1A\u672A\u5224\u5B9A" : run.judgment
          ] }),
          run.error ? /* @__PURE__ */ jsx("p", { className: "error-text", children: run.error }) : null,
          ["queued", "running", "submitting"].includes(run.state) ? /* @__PURE__ */ jsx("button", { className: "danger-outline", disabled: data.project.archived, onClick: () => perform(() => api(`/runs/${run.id}/cancel`, {}), "\u5DF2\u8BF7\u6C42\u53D6\u6D88\u6307\u5B9A\u5B9E\u9A8C"), children: "\u53D6\u6D88\u8FD9\u4E2A\u5B9E\u9A8C" }) : null,
          /* @__PURE__ */ jsx(RunFiles, { run, data, perform }, run.id)
        ] }) : null
      ] }) : null,
      this.props.tab !== "experiments" ? /* @__PURE__ */ jsxs("details", { className: "inspector-collaboration", open: manualPendingTeams.length > 0 || ["active", "paused", "draining", "failed", "partial"].includes(team?.state ?? ""), children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u534F\u4F5C\u8BA1\u5212\u4E0E\u7ED3\u679C",
          /* @__PURE__ */ jsx("span", { children: manualPendingTeams.length ? "\u5F85\u5BA1\u6279" : pendingTeams.length ? "\u81EA\u52A8\u5904\u7406\u8BB0\u5F55" : team ? label(team.state) : "\u6682\u65E0\u4EFB\u52A1" })
        ] }),
        pendingTeams.map((a) => {
          const pendingTeam = teams.find((t) => t.id === a.subjectId), canStart = data.project.settings.enabled && pendingTeam?.state === "awaiting_approval" && pendingTeam.delegationEnabled;
          return /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
            /* @__PURE__ */ jsx("div", { className: "small-label", children: automaticApprovalLabel(a) ?? (a.status === "approved" ? "\u5DF2\u6279\u51C6\u7684\u534F\u4F5C\u8BA1\u5212" : "\u5F85\u6279\u51C6\u7684\u534F\u4F5C\u8BA1\u5212") }),
            /* @__PURE__ */ jsx("h3", { children: pendingTeam?.goal }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: a.reason }),
            !a.automaticApproval && !canStart ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6B64\u8BA1\u5212\u5DF2\u505C\u6B62\uFF1B\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u91CD\u65B0\u63D0\u51FA\u4EFB\u52A1\u3002" }) : null,
            !a.automaticApproval ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { className: "primary full", disabled: data.project.archived || !canStart, onClick: () => {
                if (this.props.data.project.archived || !canStart) return;
                perform(async () => {
                  if (a.status === "pending") await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true });
                  await api(`/teams/${a.subjectId}/activate`, {});
                }, "\u534F\u4F5C\u8BA1\u5212\u5DF2\u542F\u52A8");
              }, children: a.status === "approved" ? "\u542F\u52A8\u5DF2\u6279\u51C6\u534F\u4F5C" : "\u6279\u51C6\u5E76\u542F\u52A8\u534F\u4F5C" }),
              a.status === "pending" ? /* @__PURE__ */ jsx("button", { className: "text-button", disabled: data.project.archived ? true : void 0, onClick: () => {
                if (this.props.data.project.archived) return;
                return perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false }));
              }, children: "\u62D2\u7EDD\u6B64\u8BA1\u5212" }) : null
            ] }) : null
          ] }, a.id);
        }),
        team ? /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
          /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
            /* @__PURE__ */ jsx("h3", { children: "\u5F53\u524D\u56E2\u961F" }),
            /* @__PURE__ */ jsx(Badge, { value: team.state })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "team-goal", children: team.goal }),
          team.blockReason ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: team.blockReason }) : null,
          team.state === "active" && !boot.runtime.ready ? /* @__PURE__ */ jsx("p", { className: "inline-warning", children: "\u5C1A\u672A\u542F\u52A8\u52A9\u624B\uFF1APi \u672A\u5C31\u7EEA\u3002\u4EFB\u52A1\u4ECD\u4FDD\u5B58\u5728\u961F\u5217\u4E2D\uFF0C\u6CA1\u6709\u6A21\u62DF\u6267\u884C\u3002" }) : null,
          /* @__PURE__ */ jsxs("div", { className: "team-progress", children: [
            /* @__PURE__ */ jsxs("strong", { children: [
              tasks.filter((t) => t.acceptance === "accepted").length,
              /* @__PURE__ */ jsxs("span", { children: [
                " / ",
                tasks.length
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { children: "\u4EFB\u52A1\u5DF2\u9A8C\u6536" })
          ] }),
          tasks.map((t) => /* @__PURE__ */ jsxs("div", { className: "task-card", children: [
            /* @__PURE__ */ jsxs("div", { className: "task-top", children: [
              /* @__PURE__ */ jsx("div", { className: "role-mark role-" + t.role, children: label(t.role).slice(0, 1) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("strong", { children: [
                  label(t.role),
                  " ",
                  /* @__PURE__ */ jsx("code", { children: t.key })
                ] }),
                /* @__PURE__ */ jsx("span", { children: label(t.execution) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { children: t.objective }),
            /* @__PURE__ */ jsxs("div", { className: "task-footer", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "\u9A8C\u6536\uFF1A",
                label(t.acceptance)
              ] }),
              /* @__PURE__ */ jsx("span", { children: t.reviewOf ? "\u5BA1\u67E5 " + t.reviewOf : t.dependencies.length ? "\u4F9D\u8D56 " + t.dependencies.join(", ") : "\u65E0\u524D\u7F6E\u4F9D\u8D56" })
            ] }),
            t.blockReason ? /* @__PURE__ */ jsx("p", { className: "small error-text", children: t.blockReason }) : null,
            ["running", "pending"].includes(t.execution) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", disabled: data.project.archived, onClick: () => perform(() => api(`/tasks/${t.id}/cancel`, {})), children: "\u505C\u6B62\u6B64\u52A9\u624B" }) : null,
            ["failed", "cancelled", "blocked"].includes(t.execution) ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { className: "text-button", disabled: data.project.archived || !t.retry?.eligible, onClick: () => {
                if (!data.project.archived && t.retry?.eligible) perform(() => api(`/tasks/${t.id}/retry`, {}));
              }, children: "\u65B0\u5C1D\u8BD5\u91CD\u8BD5" }),
              t.retry && !t.retry.eligible ? /* @__PURE__ */ jsxs("p", { className: "small error-text", role: "status", children: [
                "\u4E0D\u80FD\u91CD\u8BD5\uFF1A",
                t.retry.code,
                " \u2014 ",
                t.retry.reason
              ] }) : null
            ] }) : null,
            t.attempts?.length ? /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u5C1D\u8BD5\u5386\u53F2\uFF08\u6700\u8FD1\u81F3\u591A 10 \u6B21\uFF1B\u8F83\u65E9\u8BB0\u5F55\u4ECD\u4FDD\u7559\uFF09" }),
              t.attempts.map((a) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("p", { className: "small", children: [
                  "\u5C1D\u8BD5 ",
                  /* @__PURE__ */ jsx("code", { children: short(a.id) }),
                  " \xB7 ",
                  label(a.state),
                  " \xB7 ",
                  date(a.updatedAt)
                ] }),
                a.error ? /* @__PURE__ */ jsx("p", { className: "small error-text", children: a.error }) : null,
                a.result ? /* @__PURE__ */ jsxs("p", { className: "small prose-text", children: [
                  label(a.result.outcome),
                  "\uFF1A",
                  a.result.summary,
                  a.result.summaryTruncated ? "\uFF08\u5386\u53F2\u6458\u8981\u5DF2\u622A\u65AD\uFF09" : null
                ] }) : null
              ] }, a.id))
            ] }) : null,
            t.result ? /* @__PURE__ */ jsxs("details", { children: [
              /* @__PURE__ */ jsx("summary", { children: "\u7ED3\u679C\u4E0E\u9650\u5236" }),
              t.role === "reviewer" ? /* @__PURE__ */ jsxs("p", { className: "small", role: "status", children: [
                "\u5BA1\u67E5\u610F\u89C1\uFF1A",
                t.result.verdict === "accept" ? "\u63A5\u53D7" : t.result.verdict === "reject" ? "\u62D2\u7EDD" : t.result.verdict === "disputed" ? "\u5B58\u5728\u4E89\u8BAE" : "\u672A\u63D0\u4F9B\uFF1B\u4E0D\u80FD\u89C6\u4E3A\u901A\u8FC7",
                "\uFF08\u72EC\u7ACB\u4E8E\u4EFB\u52A1\u9A8C\u6536\u72B6\u6001\uFF09"
              ] }) : null,
              /* @__PURE__ */ jsx("p", { className: "small prose-text", children: t.result.summary })
            ] }) : null,
            t.execution === "output_submitted" && !data.approvals.find((a) => a.id === team.approvalId)?.automaticApproval && ["pending", "rejected", "disputed"].includes(t.acceptance) ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: data.project.archived, onClick: () => {
              this.openReview(t.id);
            }, children: "\u4EBA\u5DE5\u786E\u8BA4\u9A8C\u6536" }) : null
          ] }, t.id)),
          budget ? /* @__PURE__ */ jsxs("div", { className: "budget-note", children: [
            "\u5C1D\u8BD5\u989D\u5EA6\uFF1A",
            budget.used,
            " \u5DF2\u7ED3\u7B97 / ",
            budget.reserved,
            " \u5DF2\u9884\u7559 / ",
            budget.unknown,
            " \u5F85\u5BF9\u8D26",
            /* @__PURE__ */ jsx("br", {}),
            "\u603B\u989D\u5EA6 ",
            budget.limit,
            " \u6B21\u3002\u6B64\u989D\u5EA6\u4E0D\u662F\u4F9B\u5E94\u5546\u8D26\u5355\u4E0A\u9650\u3002"
          ] }) : null,
          /* @__PURE__ */ jsxs("div", { className: "actions wrap", children: [
            team.state === "active" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived, onClick: () => perform(() => api(`/teams/${team.id}/pause`, {})), children: "\u6682\u505C\u5206\u914D" }) : null,
            team.state === "paused" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived, onClick: () => perform(() => api(`/teams/${team.id}/resume`, {})), children: "\u6062\u590D" }) : null,
            /* @__PURE__ */ jsx("button", { className: "secondary compact", disabled: data.project.archived, onClick: () => this.props.onDirective(team.id), children: "\u5F15\u5BFC / \u6539\u53D8\u76EE\u6807" })
          ] })
        ] }) : /* @__PURE__ */ jsx("div", { className: "inspector-section muted small", children: "\u5728\u5BF9\u8BDD\u4E2D\u63D0\u51FA\u534F\u4F5C\u4EFB\u52A1\u3002" })
      ] }) : null,
      this.renderReview()
    ] });
  }
}
export {
  Chat,
  Inspector,
  OutcomeReview
};
