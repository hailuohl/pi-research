import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ProjectEventFeed } from "./event-feed.js";
import { EnvironmentView } from "./environment-view.js";
import { IntegrationsView } from "./integrations.js";
import { api } from "./api.js";
import { short } from "./models.js";
import { Icon, Modal, nativeSelectButton } from "./ui.js";
import { Chat, Experiments, Inspector } from "./workbench.js";
import { SessionList } from "./session-list.js";
import { ProjectCreationModal } from "./github-controls.js";
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from "./data-views.js";
const navigation = [["chat", "\u7814\u7A76\u4F1A\u8BDD", "chat"], ["environment", "\u73AF\u5883", "settings"], ["experiments", "\u5B9E\u9A8C\u4E0E\u8FD0\u884C", "experiment"], ["workspace", "\u9879\u76EE\u5DE5\u4F5C\u533A", "folder"], ["literature", "\u6587\u732E\u68C0\u7D22", "search"], ["integrations", "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668", "skills"], ["evidence", "\u8D44\u6599\u4E0E\u8BC1\u636E", "evidence"], ["reports", "\u62A5\u544A\u4E0E\u6210\u679C", "report"], ["settings", "\u8BBE\u7F6E\u4E0E\u80FD\u529B", "settings"]];
const navigationGroups = [
  { name: "\u7814\u7A76", ids: ["chat", "experiments"] },
  { name: "\u7BA1\u7406", ids: ["integrations", "environment", "settings"] }
];
const normalizeView = (tab) => tab === "scheduler" ? "environment" : ["campaigns", "implementation", "changes"].includes(tab) ? "chat" : tab;
function saved() {
  try {
    return JSON.parse(localStorage.getItem("pi-research-ui-v1") ?? "{}");
  } catch {
    return {};
  }
}
class App extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { boot: null, data: null, projectId: saved().projectId ?? "", sessionId: saved().sessionId ?? "", tab: normalizeView(saved().tab ?? "chat"), selectedExp: saved().selectedExp ?? "", selectedRun: saved().selectedRun ?? "", selectedReport: saved().selectedReport ?? "", selectedCampaign: saved().selectedCampaign ?? "", selectedDiscoveryGrant: saved().selectedDiscoveryGrant ?? "", selectedDocument: saved().selectedDocument ?? null, messages: [], pendingMessages: [], pendingTotal: 0, pendingNextCursor: null, canSteer: false, history: null, historyAnchor: saved().historyAnchor && saved().historyAnchor.projectId === saved().projectId && saved().historyAnchor.sessionId === saved().sessionId ? saved().historyAnchor.anchor : null, stream: "", streamTruncated: false, activity: null, eventNotice: "", modal: "", modalData: null, busy: false, error: "", notice: "", connected: false, navigationOpen: false, sessionCreationSignal: 0 };
    this.experimentSelections = Object.fromEntries(Object.entries(saved().experimentSelections ?? {}).filter(([, value]) => typeof value === "string"));
    this.closeNavigationOnResize = () => {
      if (window.innerWidth > 760 && this.state.navigationOpen) this.setState({ navigationOpen: false });
    };
    this.navigationToggle = null;
    this.refreshEpoch = 0;
    this.mounted = true;
    this.projectSelectionEpoch = 0;
    this.creatingSession = false;
    this.perform = async (fn, success) => {
      if (this.state.busy)
        return;
      this.invalidateRead();
      this.setState({ busy: true, error: "" });
      try {
        const result = await fn();
        if (success) {
          clearTimeout(this.noticeTimer);
          this.setState({ notice: success });
          this.noticeTimer = window.setTimeout(() => this.setState({ notice: "" }), 4500);
        }
        await this.refresh();
        return result;
      } catch (e) {
        this.setState({ error: e instanceof Error ? e.message : String(e) });
        return void 0;
      } finally {
        this.setState({ busy: false });
      }
    };
    this.selectExperiment = (id, runId = "") => {
      const data = this.state.data;
      if (!data?.experiments.some((e) => e.id === id) || runId && !data.runs.some((r) => r.id === runId && r.experimentId === id)) {
        this.setState({ error: "\u6307\u5B9A\u5B9E\u9A8C\u6216\u8FD0\u884C\u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\u3002" });
        return;
      }
      this.invalidateRead();
      this.setState({ selectedExp: id, selectedRun: runId, tab: "experiments" });
    };
    this.selectHistory = (anchor) => {
      this.invalidateRead();
      this.setState({ messages: [], historyAnchor: anchor, stream: "", streamTruncated: false, activity: null }, () => void this.refresh());
    };
    this.close = () => {
      if (!this.state.busy)
        this.setState({ modal: "", modalData: null });
    };
    this.useParsedDocument = (target) => {
      const projectId = this.state.projectId, sessionId = this.state.sessionId, epoch = this.projectSelectionEpoch;
      const current = () => {
        const s = this.state.data?.sessions.find((s2) => s2.id === sessionId);
        return this.mounted && this.state.projectId === projectId && this.state.sessionId === sessionId && this.projectSelectionEpoch === epoch && !this.state.data?.project.archived && s?.role === "coordinator" && !s.taskId && !s.teamId && s.state !== "archived";
      };
      if (this.state.busy || !current()) return;
      void this.perform(async () => {
        if (!current()) return;
        await api(`/sessions/${encodeURIComponent(sessionId)}/messages`, { content: "\u6211\u9009\u62E9\u5C06\u8FD9\u4EFD\u56FA\u5B9A\u89E3\u6790\u8D44\u6599\u5E26\u5165\u5F53\u524D\u4F1A\u8BDD\u3002\u8BF7\u5148\u6838\u5BF9\u8D44\u6599\uFF0C\u518D\u4E0E\u6211\u660E\u786E\u9700\u8981\u89C6\u89C9\u8BFB\u53D6\u7684\u7269\u7406\u9875\u8303\u56F4\uFF1B\u8D44\u6599\u9644\u4EF6\u672C\u8EAB\u4E0D\u6388\u4E88\u539F\u6587\u6216\u56FE\u7247\u8BFB\u53D6\u6743\u9650\u3002", parsedDocumentAttachments: [target] });
        if (current()) this.selectSession(sessionId, "chat");
      }, "\u5DF2\u5E26\u5165\u56FA\u5B9A\u89E3\u6790\u8D44\u6599\uFF1B\u89C6\u89C9\u9875\u8303\u56F4\u4ECD\u9700\u51C6\u786E\u6279\u51C6");
    };
    this.selectTab = (tab) => {
      const returnFocus = this.state.navigationOpen;
      this.setState({ tab: normalizeView(tab), navigationOpen: false }, () => {
        if (returnFocus) this.navigationToggle?.focus();
      });
    };
    this.toggleNavigation = () => {
      const navigationOpen = !this.state.navigationOpen;
      this.setState({ navigationOpen }, () => document.getElementById(navigationOpen ? "navigation-close" : "navigation-toggle")?.focus());
    };
  }
  componentDidMount() {
    window.addEventListener("resize", this.closeNavigationOnResize);
    void this.refresh();
    this.timer = window.setInterval(() => {
      if (this.feed) this.feed.wake();
      else void this.refresh(true);
    }, 2e4);
  }
  componentWillUnmount() {
    if (typeof window !== "undefined") window.removeEventListener?.("resize", this.closeNavigationOnResize);
    this.mounted = false;
    this.invalidateRead();
    this.feed?.stop();
    clearInterval(this.timer);
    clearTimeout(this.noticeTimer);
  }
  componentDidUpdate(_, prev) {
    if (this.state.data?.project.id === this.state.projectId && this.state.data.experiments.some((e) => e.id === this.state.selectedExp)) this.experimentSelections[this.state.projectId] = this.state.selectedExp;
    try {
      if (["projectId", "sessionId", "tab", "selectedExp", "selectedRun", "selectedReport", "selectedCampaign", "selectedDiscoveryGrant", "selectedDocument", "historyAnchor"].some((k) => prev[k] !== this.state[k]))
        localStorage.setItem("pi-research-ui-v1", JSON.stringify({ experimentSelections: this.experimentSelections, projectId: this.state.projectId, sessionId: this.state.sessionId, tab: this.state.tab, selectedExp: this.state.selectedExp, selectedRun: this.state.selectedRun, selectedReport: this.state.selectedReport, selectedCampaign: this.state.selectedCampaign, selectedDiscoveryGrant: this.state.selectedDiscoveryGrant, selectedDocument: this.state.selectedDocument, historyAnchor: { projectId: this.state.projectId, sessionId: this.state.sessionId, anchor: this.state.historyAnchor } }));
    } catch {
    }
  }
  invalidateRead() {
    this.refreshEpoch++;
    this.readController?.abort();
    this.refreshing = void 0;
  }
  refresh(quiet = false) {
    if (!this.mounted || quiet && this.state.busy) return Promise.resolve(false);
    if (this.refreshing) return this.refreshing;
    const reading = this.readState(quiet);
    this.refreshing = reading;
    void reading.finally(() => {
      if (this.refreshing === reading) this.refreshing = void 0;
    });
    return reading;
  }
  async readState(quiet) {
    const epoch = this.refreshEpoch, controller = new AbortController();
    this.readController = controller;
    try {
      const boot = await api("/bootstrap", void 0, "GET", controller.signal);
      const projectId = boot.projects.some((p) => p.id === this.state.projectId) ? this.state.projectId : boot.projects[0]?.id ?? "";
      const requestedSession = projectId === this.state.projectId ? this.state.sessionId : "";
      let data = projectId ? await api(`/projects/${projectId}/state${requestedSession ? "?sessionId=" + encodeURIComponent(requestedSession) : ""}`, void 0, "GET", controller.signal) : null;
      const sessionId = requestedSession || (data?.sessions.find((s) => s.role === "coordinator" && s.state !== "archived")?.id ?? "");
      const anchor = requestedSession ? this.state.historyAnchor : null;
      const view = sessionId ? await api(`/sessions/${sessionId}/view${anchor ? "?" + (anchor.direction === "before" ? "beforeMessageId" : "afterMessageId") + "=" + encodeURIComponent(anchor.id) : ""}`, void 0, "GET", controller.signal) : null;
      if (!this.mounted || epoch !== this.refreshEpoch) return false;
      if (view && view.session.id !== sessionId) throw Error("\u4F1A\u8BDD\u5FEB\u7167\u4E0E\u5F53\u524D\u9009\u62E9\u4E0D\u4E00\u81F4");
      if (data && view) data = { ...data, sessions: data.sessions.some((s) => s.id === sessionId) ? data.sessions.map((s) => s.id === sessionId ? view.session : s) : [...data.sessions, view.session] };
      const active = !!view?.progress.active && view.progress.generation === view.session.generation;
      const requestedExp = projectId === this.state.projectId ? this.state.selectedExp : this.experimentSelections[projectId] ?? "";
      const selectedExp = data?.experiments.some((e) => e.id === requestedExp) ? requestedExp : data?.experiments[0]?.id ?? "";
      await new Promise((resolve) => this.setState({ boot, data, projectId, sessionId, messages: view?.messages ?? [], pendingMessages: view?.pendingMessages ?? [], pendingTotal: view?.pendingTotal ?? 0, pendingNextCursor: view?.pendingNextCursor ?? null, canSteer: view?.progress?.canSteer ?? false, history: view?.history ?? null, historyAnchor: anchor, selectedExp, stream: !anchor && active ? view.progress.content : "", streamTruncated: !anchor && active && !!view?.progress.truncated, activity: !anchor && active ? view?.progress.activity ?? null : null, connected: true }, resolve));
      if (!this.mounted || epoch !== this.refreshEpoch) return false;
      if (this.feed?.projectId !== projectId) {
        this.feed?.stop();
        this.feed = void 0;
        if (projectId) {
          const feed = new ProjectEventFeed(projectId, () => this.refresh(true), (eventNotice) => {
            if (this.mounted && this.feed === feed) this.setState({ eventNotice });
          });
          this.feed = feed;
          feed.start();
        }
      }
      return true;
    } catch (error) {
      if (!this.mounted || epoch !== this.refreshEpoch || controller.signal.aborted) return false;
      this.setState((previous) => ({ ...previous, connected: false, ...!quiet ? { error: error instanceof Error ? error.message : String(error) } : {} }));
      return false;
    } finally {
      if (this.readController === controller) this.readController = void 0;
    }
  }
  sessionSelection(id, tab = this.state.tab) {
    return { sessionId: id, tab: normalizeView(tab), messages: [], pendingMessages: [], pendingTotal: 0, pendingNextCursor: null, canSteer: false, history: null, historyAnchor: null, stream: "", streamTruncated: false, activity: null, error: "" };
  }
  switchProject(id) {
    this.projectSelectionEpoch++;
    if (this.state.data?.experiments.some((e) => e.id === this.state.selectedExp)) this.experimentSelections[this.state.projectId] = this.state.selectedExp;
    this.invalidateRead();
    this.feed?.stop();
    this.feed = void 0;
    this.setState({ ...this.sessionSelection(""), projectId: id, selectedExp: this.experimentSelections[id] ?? "", navigationOpen: false, selectedRun: "", selectedReport: "", selectedCampaign: "", selectedDiscoveryGrant: "", selectedDocument: null, eventNotice: "", data: null }, () => {
      void this.refresh();
    });
  }
  selectSession(id, tab = "chat") {
    this.invalidateRead();
    this.setState(this.sessionSelection(id, tab), () => {
      void this.refresh();
    });
  }
  open(modal, data = null) {
    this.setState({ modal, modalData: data, error: "" });
  }
  async newSession() {
    const projectId = this.state.projectId, currentSessionId = this.state.sessionId, epoch = this.projectSelectionEpoch;
    if (!this.mounted || !projectId || this.state.busy || this.creatingSession)
      return;
    this.creatingSession = true;
    const current = () => this.mounted && this.state.projectId === projectId && this.projectSelectionEpoch === epoch;
    const eligible = (s) => s.projectId === projectId && s.role === "coordinator" && s.state === "idle" && !s.taskId && !s.teamId;
    const seen = /* @__PURE__ */ new Set();
    const emptySession = async (id) => {
      seen.add(id);
      const session = await api(`/sessions/${encodeURIComponent(id)}`);
      if (!current()) return null;
      if (session.id !== id) throw Error("\u4F1A\u8BDD\u5FEB\u7167\u4E0E\u8BF7\u6C42\u4E0D\u4E00\u81F4");
      if (!eligible(session) || session.parentSessionId || session.piSessionPath !== null || session.generation !== 0 || session.leaseUntil !== 0) return null;
      const messages = await api(`/sessions/${encodeURIComponent(id)}/messages`);
      if (!current()) return null;
      if (!Array.isArray(messages)) throw Error("\u4F1A\u8BDD\u6D88\u606F\u8BFB\u53D6\u672A\u8FD4\u56DE\u5B8C\u6574\u5386\u53F2");
      return messages.length === 0 ? session : null;
    };
    try {
      await this.perform(async () => {
        try {
          const project = await api(`/projects/${encodeURIComponent(projectId)}`);
          if (!current()) return;
          if (project.id !== projectId || typeof project.archived !== "boolean") throw Error("\u9879\u76EE\u5FEB\u7167\u4E0E\u8BF7\u6C42\u4E0D\u4E00\u81F4");
          if (project.archived) throw Error("\u5DF2\u5F52\u6863\u9879\u76EE\u4E0D\u53EF\u65B0\u5EFA\u4F1A\u8BDD");
          let session = currentSessionId ? await emptySession(currentSessionId) : null;
          if (!current()) return;
          let cursor;
          const cursors = /* @__PURE__ */ new Set();
          while (!session) {
            const page = await api("/operations/session_list", { projectId, input: { role: "coordinator", stateFilter: "active", limit: 50, ...cursor ? { beforeSessionId: cursor } : {} } });
            if (!current()) return;
            if (!Array.isArray(page.items)) throw Error("\u4F1A\u8BDD\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25");
            for (const item of page.items) {
              if (seen.has(item.id) || !eligible(item)) continue;
              session = await emptySession(item.id);
              if (!current()) return;
              if (session) break;
            }
            if (session || !page.nextCursor) break;
            if (cursors.has(page.nextCursor)) throw Error("\u4F1A\u8BDD\u76EE\u5F55\u6E38\u6807\u91CD\u590D");
            cursor = page.nextCursor;
            cursors.add(cursor);
          }
          if (!session) {
            session = await api("/sessions", { projectId, title: "\u65B0\u7684\u7814\u7A76\u4F1A\u8BDD" });
            if (!current()) return;
          }
          const closeNavigation = this.state.navigationOpen, sessionId = session.id;
          await new Promise((resolve) => this.setState({ ...this.sessionSelection(sessionId, "chat"), navigationOpen: false, sessionCreationSignal: this.state.sessionCreationSignal + 1 }, () => {
            if (closeNavigation) this.navigationToggle?.focus();
            resolve();
          }));
        } catch (error) {
          if (current()) throw error;
        }
      });
    } finally {
      this.creatingSession = false;
    }
  }
  async toggle() {
    const p = this.state.data.project;
    await this.perform(() => api(`/projects/${p.id}/collaboration-settings`, { expectedVersion: p.version, enabled: !p.settings.enabled }));
  }
  modalView() {
    const { modal, modalData, data, busy } = this.state;
    if (!modal)
      return null;
    const base = { onClose: this.close, busy };
    const done = () => this.setState({ modal: "", modalData: null });
    if (modal === "project")
      return /* @__PURE__ */ jsx(ProjectCreationModal, { ...base, onCreate: (input, key) => this.perform(async () => {
        const p = await api("/projects", input, "POST", void 0, key);
        const s = await api("/sessions", { projectId: p.id, title: "\u7814\u7A76\u4E3B\u4F1A\u8BDD" }, "POST", void 0, key + "-session");
        await new Promise((resolve) => this.setState({ ...this.sessionSelection(s.id, "chat"), projectId: p.id, selectedExp: "", selectedRun: "", selectedReport: "", selectedCampaign: "", selectedDiscoveryGrant: "", selectedDocument: null, data: null }, resolve));
        done();
      }, input.github ? "\u672C\u5730\u9879\u76EE\u5DF2\u521B\u5EFA\uFF1BGitHub \u540C\u6B65\u72B6\u6001\u53EF\u5728\u8BBE\u7F6E\u4E2D\u67E5\u770B\u3002" : "\u672C\u5730\u9879\u76EE\u5DF2\u521B\u5EFA") });
    if (modal === "config")
      return /* @__PURE__ */ jsxs(Modal, { ...base, wide: true, title: "\u5B9E\u9A8C\u53EA\u8BFB\u914D\u7F6E", submitLabel: "\u5173\u95ED\u914D\u7F6E", onSubmit: () => done(), children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u914D\u7F6E\u7531\u7814\u7A76\u5BF9\u8BDD\u4E2D\u7684\u667A\u80FD\u4F53\u7BA1\u7406\u3002" }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u914D\u7F6E\u6E90\u7801",
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u914D\u7F6E\u6E90\u7801", className: "code-input", rows: 12, readOnly: true, defaultValue: modalData.content })
        ] })
      ] });
    if (modal === "directive")
      return /* @__PURE__ */ jsxs(Modal, { ...base, title: "\u7ED9\u56E2\u961F\u53D1\u9001\u6307\u4EE4", submitLabel: "\u4FDD\u5B58\u6307\u4EE4", onSubmit: (fd) => this.perform(async () => {
        await api(`/teams/${modalData}/directives`, { kind: fd.get("kind"), content: fd.get("content") });
        done();
      }), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6307\u4EE4\u8BED\u4E49",
          /* @__PURE__ */ jsxs("select", { name: "kind", children: [
            nativeSelectButton,
            /* @__PURE__ */ jsx("option", { value: "steer", children: "\u5F15\u5BFC\u5F53\u524D\u5DE5\u4F5C \xB7 \u4E0D\u4FEE\u6539\u7814\u7A76\u76EE\u6807" }),
            /* @__PURE__ */ jsx("option", { value: "follow_up", children: "\u540E\u7EED\u6307\u4EE4 \xB7 \u5F53\u524D\u4EFB\u52A1\u7ED3\u675F\u540E\u5904\u7406" }),
            /* @__PURE__ */ jsx("option", { value: "revise", children: "\u6539\u53D8\u7814\u7A76\u76EE\u6807 \xB7 \u65E7\u4EFB\u52A1\u5931\u6548\uFF0C\u6682\u505C\u91CD\u65B0\u89C4\u5212" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6307\u4EE4\u5185\u5BB9",
          /* @__PURE__ */ jsx("textarea", { name: "content", rows: 6, required: true })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4FEE\u6539\u76EE\u6807\u4F1A\u4FDD\u5B58\u65B0\u9700\u6C42\u7248\u672C\uFF0C\u4E0D\u5220\u9664\u5DF2\u6709\u5B9E\u9A8C\u6216\u7ED3\u679C\u3002\u53D6\u6D88\u6B63\u5F0F Run \u9700\u5355\u72EC\u64CD\u4F5C\u3002" })
      ] });
    if (modal === "evidence")
      return /* @__PURE__ */ jsxs(Modal, { ...base, wide: true, title: "\u767B\u8BB0\u539F\u6587\u8BC1\u636E", submitLabel: "\u4FDD\u5B58\u8BC1\u636E", onSubmit: (fd) => this.perform(async () => {
        await api("/evidence", { projectId: data.project.id, artifactId: modalData.artifactId, start: Number(fd.get("start")), end: Number(fd.get("end")), description: fd.get("description") });
        done();
      }, "\u8BC1\u636E\u5DF2\u5B9A\u4F4D\u5E76\u6821\u9A8C"), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u8BC1\u636E\u8BF4\u660E",
          /* @__PURE__ */ jsx("input", { name: "description", required: true, placeholder: "\u6B64\u7247\u6BB5\u7528\u4E8E\u652F\u6301\u4EC0\u4E48\u89C2\u5BDF\uFF1F" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8D77\u59CB\u5B57\u7B26",
            /* @__PURE__ */ jsx("input", { type: "number", name: "start", min: 0, defaultValue: 0 })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u7ED3\u675F\u5B57\u7B26",
            /* @__PURE__ */ jsx("input", { type: "number", name: "end", min: 1, max: modalData.content.length, defaultValue: Math.min(modalData.content.length, 2e3) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4F7F\u7528 JavaScript UTF-16 \u5B57\u7B26\u4F4D\u7F6E\uFF0C\u4E0D\u662F PDF \u9875\u7801\u6216\u65E5\u5FD7\u5B57\u8282\u4F4D\u7F6E\u3002" }),
        /* @__PURE__ */ jsx("pre", { className: "modal-preview", children: modalData.content.slice(0, 4e3) })
      ] });
    if (modal === "claim")
      return /* @__PURE__ */ jsxs(Modal, { ...base, title: "\u63D0\u51FA\u7ED3\u8BBA\u5019\u9009", submitLabel: "\u4FDD\u5B58\u5019\u9009\u5F85\u9A8C\u6536", onSubmit: (fd) => this.perform(async () => {
        await api("/claims", { projectId: data.project.id, statement: fd.get("statement"), evidenceIds: [fd.get("evidenceId")], limitations: String(fd.get("limitations")).split("\n").filter(Boolean) });
        done();
      }), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u7ED3\u8BBA\u9648\u8FF0",
          /* @__PURE__ */ jsx("textarea", { name: "statement", required: true, rows: 4 })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u8BC1\u636E\u6765\u6E90",
          /* @__PURE__ */ jsxs("select", { name: "evidenceId", children: [
            nativeSelectButton,
            data.evidence.map((e) => /* @__PURE__ */ jsxs("option", { value: e.id, children: [
              e.description,
              " \xB7 ",
              short(e.id)
            ] }, e.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9650\u5236\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
          /* @__PURE__ */ jsx("textarea", { name: "limitations", required: true, placeholder: "\u6837\u672C\u89C4\u6A21\u3001\u6761\u4EF6\u3001\u672A\u6267\u884C\u7684\u9A8C\u8BC1\u7B49" })
        ] })
      ] });
    return null;
  }
  render() {
    const { boot, data, tab } = this.state;
    const currentSession = data?.sessions.find((s) => s.id === this.state.sessionId), experiment = data?.experiments.find((e) => e.id === this.state.selectedExp), collaborationSessionId = currentSession?.taskId ? data?.teams.find((t) => t.id === currentSession.teamId)?.rootSessionId ?? "" : this.state.sessionId;
    return /* @__PURE__ */ jsxs("div", { className: "app-shell" + (this.state.navigationOpen ? " navigation-open" : ""), onKeyDown: (event) => {
      if (event.key === "Escape" && this.state.navigationOpen) this.toggleNavigation();
    }, children: [
      /* @__PURE__ */ jsxs("nav", { id: "main-navigation", className: "sidebar", "aria-label": "\u4E3B\u5BFC\u822A", children: [
        /* @__PURE__ */ jsxs("div", { className: "sidebar-brand", children: [
          /* @__PURE__ */ jsxs("a", { className: "brand", href: "#", onClick: (e) => {
            e.preventDefault();
            this.setState({ tab: "chat", navigationOpen: false });
          }, children: [
            /* @__PURE__ */ jsx("span", { children: "\u03C0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Pi Research",
              /* @__PURE__ */ jsx("small", { children: "\u79D1\u7814\u5DE5\u4F5C\u53F0" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { id: "navigation-close", className: "icon-button mobile-navigation", "aria-label": "\u5173\u95ED\u5BFC\u822A", onClick: this.toggleNavigation, children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "sidebar-project", children: [
          "\u9879\u76EE",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u5F53\u524D\u9879\u76EE", value: this.state.projectId, onChange: (e) => this.switchProject(e.target.value), children: [
            nativeSelectButton,
            !boot?.projects.length ? /* @__PURE__ */ jsx("option", { value: "", children: "\u5C1A\u672A\u521B\u5EFA\u9879\u76EE" }) : boot.projects.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "new-project", onClick: () => this.setState({ navigationOpen: false }, () => this.open("project")), children: [
          /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
          "\u65B0\u5EFA\u9879\u76EE"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sidebar-body", children: [
          /* @__PURE__ */ jsx("div", { className: "nav-groups", children: navigationGroups.map((group) => /* @__PURE__ */ jsxs("details", { open: group.name === "\u7814\u7A76" || group.ids.includes(tab), children: [
            /* @__PURE__ */ jsx("summary", { children: group.name }),
            /* @__PURE__ */ jsx("div", { className: "nav-list", children: group.ids.map((id) => {
              const entry = navigation.find((item) => item[0] === id);
              return /* @__PURE__ */ jsxs("button", { "aria-current": id !== "chat" && tab === id ? "page" : void 0, className: id !== "chat" && tab === id ? "active" : "", disabled: id === "chat" && (!this.state.projectId || this.state.busy), onClick: () => id === "chat" ? this.newSession() : this.selectTab(id), children: [
                /* @__PURE__ */ jsx(Icon, { name: entry[2], size: 18 }),
                /* @__PURE__ */ jsx("span", { children: id === "chat" ? "\u65B0\u5EFA\u4F1A\u8BDD" : entry[1] }),
                id === "experiments" && data?.experiments.length ? /* @__PURE__ */ jsx("em", { children: data.experiments.length }) : null
              ] }, id);
            }) })
          ] }, group.name)) }),
          /* @__PURE__ */ jsx(SessionList, { projectId: this.state.projectId, selectedId: this.state.sessionId, selected: currentSession, creationSignal: this.state.sessionCreationSignal, busy: this.state.busy, onSelect: (id) => {
            this.setState({ navigationOpen: false });
            this.selectSession(id);
          } })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "sidebar-footer", children: [
          /* @__PURE__ */ jsx("div", { className: "local-avatar", children: /* @__PURE__ */ jsx(Icon, { name: "folder" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "\u672C\u5730\u5DE5\u4F5C\u7A7A\u95F4" }),
            /* @__PURE__ */ jsx("small", { children: "\u6570\u636E\u7531\u4F60\u638C\u63E1" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "status-dot " + (this.state.connected ? "" : "amber") })
        ] })
      ] }),
      this.state.navigationOpen ? /* @__PURE__ */ jsx("button", { className: "navigation-backdrop", "aria-label": "\u6536\u8D77\u5BFC\u822A", onClick: this.toggleNavigation }) : null,
      /* @__PURE__ */ jsxs("div", { className: "workspace-shell", inert: this.state.navigationOpen ? true : void 0, children: [
        /* @__PURE__ */ jsxs("header", { className: "topbar", children: [
          /* @__PURE__ */ jsx("button", { id: "navigation-toggle", ref: (node) => {
            this.navigationToggle = node;
          }, className: "icon-button mobile-navigation", "aria-label": "\u6253\u5F00\u5BFC\u822A", "aria-expanded": this.state.navigationOpen, "aria-controls": "main-navigation", onClick: this.toggleNavigation, children: /* @__PURE__ */ jsx(Icon, { name: "menu" }) }),
          /* @__PURE__ */ jsxs("div", { className: "breadcrumb", children: [
            /* @__PURE__ */ jsx("span", { children: data?.project.name ?? "\u9879\u76EE" }),
            /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 12 }),
            /* @__PURE__ */ jsx("strong", { children: navigation.find((item) => item[0] === tab)?.[1] ?? "\u7814\u7A76\u4F1A\u8BDD" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "topbar-right", children: [
            /* @__PURE__ */ jsxs("details", { id: "workspace-tool-menu", className: "workspace-tool-menu", children: [
              /* @__PURE__ */ jsxs("summary", { "aria-label": "\u5DE5\u4F5C\u533A\u5DE5\u5177", title: "\u67E5\u770B\u6587\u4EF6\u3001\u6587\u732E\u3001\u8BC1\u636E\u4E0E\u6210\u679C", children: [
                /* @__PURE__ */ jsx(Icon, { name: "folder", size: 18 }),
                /* @__PURE__ */ jsx("span", { children: "\u5DE5\u4F5C\u533A" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "workspace-tool-items", children: navigation.filter((item) => ["workspace", "literature", "evidence", "reports"].includes(item[0])).map(([id, name, icon]) => /* @__PURE__ */ jsxs("button", { "aria-current": tab === id ? "page" : void 0, className: tab === id ? "active" : "", onClick: (event) => {
                const menu = event.currentTarget.closest("details");
                menu?.removeAttribute("open");
                menu?.querySelector("summary")?.focus();
                this.selectTab(id);
              }, children: [
                /* @__PURE__ */ jsx(Icon, { name: icon, size: 17 }),
                /* @__PURE__ */ jsx("span", { children: name })
              ] }, id)) })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "connection-state " + (this.state.connected ? "ready" : ""), children: [
              /* @__PURE__ */ jsx("span", { className: "status-dot " + (this.state.connected ? "" : "amber") }),
              this.state.connected ? "\u672C\u5730\u670D\u52A1\u5728\u7EBF" : "\u6B63\u5728\u91CD\u8FDE"
            ] })
          ] })
        ] }),
        this.state.eventNotice ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: this.state.eventNotice }) : null,
        this.state.error ? /* @__PURE__ */ jsxs("div", { className: "global-error", role: "alert", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u64CD\u4F5C\u672A\u5B8C\u6210" }),
          /* @__PURE__ */ jsx("span", { children: this.state.error }),
          /* @__PURE__ */ jsx("button", { className: "icon-button", "aria-label": "\u5173\u95ED\u9519\u8BEF\u63D0\u793A", onClick: () => this.setState({ error: "" }), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 16 }) })
        ] }) : null,
        this.state.notice ? /* @__PURE__ */ jsxs("div", { className: "toast", role: "status", children: [
          /* @__PURE__ */ jsx(Icon, { name: "check", size: 16 }),
          this.state.notice
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "workbench-content " + (["chat", "experiments"].includes(tab) && data ? "with-inspector" : ""), children: [
          /* @__PURE__ */ jsxs("main", { className: "main-pane page-" + tab + (tab === "chat" ? " chat-pane" : ""), children: [
            boot && data ? /* @__PURE__ */ jsx("div", { className: "chat-view-container", hidden: tab !== "chat", children: /* @__PURE__ */ jsx(Chat, { data, boot, session: currentSession, busy: this.state.busy, messages: this.state.messages, pendingMessages: this.state.pendingMessages, pendingTotal: this.state.pendingTotal, pendingNextCursor: this.state.pendingNextCursor, canSteer: this.state.canSteer, history: this.state.history, historyAnchor: this.state.historyAnchor, onHistory: this.selectHistory, stream: this.state.stream, streamTruncated: this.state.streamTruncated, activity: this.state.activity, perform: this.perform, onToggle: () => this.toggle(), onNew: () => this.newSession(), onExperiments: () => this.setState({ tab: "experiments" }), onWorkspace: () => this.setState({ tab: "workspace" }), onSession: (id) => this.selectSession(id), onExperiment: this.selectExperiment, onRun: (runId, experimentId) => this.selectExperiment(experimentId, runId) }, data.project.id + ":" + (currentSession?.id ?? "")) }) : null,
            !boot ? /* @__PURE__ */ jsx("div", { className: "boot-screen", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u9879\u76EE\u2026" }) : tab === "settings" ? /* @__PURE__ */ jsx(SettingsView, { boot, projectId: this.state.projectId, session: currentSession, perform: this.perform }) : tab === "environment" ? /* @__PURE__ */ jsx(EnvironmentView, {}) : !data ? /* @__PURE__ */ jsxs("div", { className: "first-project", children: [
              /* @__PURE__ */ jsx("div", { className: "welcome-mark", children: "\u03C0" }),
              /* @__PURE__ */ jsxs("h1", { children: [
                "\u6BCF\u4E00\u4E2A\u7814\u7A76\uFF0C",
                /* @__PURE__ */ jsx("br", {}),
                "\u4ECE\u6E05\u6670\u7684\u8D77\u70B9\u5F00\u59CB\u3002"
              ] }),
              /* @__PURE__ */ jsxs("p", { children: [
                "\u5EFA\u7ACB\u672C\u5730\u9879\u76EE\uFF0C\u4FDD\u5B58\u6E90\u4EE3\u7801\u3001\u5B9E\u9A8C\u5FEB\u7167\u548C\u8BC1\u636E\u3002",
                /* @__PURE__ */ jsx("br", {}),
                "\u4E5F\u53EF\u4EE5\u5148\u8FD0\u884C\u968F\u5305\u7684\u771F\u5B9E\u6570\u503C\u793A\u4F8B\uFF0C\u68C0\u67E5\u5B8C\u6574\u6D41\u7A0B\u3002"
              ] }),
              /* @__PURE__ */ jsxs("button", { className: "primary", onClick: () => this.open("project"), children: [
                "\u521B\u5EFA\u7B2C\u4E00\u4E2A\u9879\u76EE ",
                /* @__PURE__ */ jsx(Icon, { name: "arrow", size: 17 })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "small muted", children: "Pi \u662F\u552F\u4E00 Agent \u6267\u884C\u5185\u6838\u3002\u6CA1\u6709 ORX \u8FD0\u884C\u65F6\u4F9D\u8D56\u3002" })
            ] }) : tab === "chat" ? null : tab === "experiments" ? /* @__PURE__ */ jsx(Experiments, { onSession: (id) => this.selectSession(id), onChat: () => this.setState({ tab: "chat" }), data, selected: this.state.selectedExp, onSelect: (selectedExp) => {
              this.invalidateRead();
              this.setState({ selectedExp, selectedRun: "" });
            }, onRun: (selectedRun, selectedExp) => {
              if (!data.runs.some((r) => r.id === selectedRun && r.experimentId === selectedExp) || !data.experiments.some((e) => e.id === selectedExp)) {
                this.setState({ error: "\u6307\u5B9A Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
                return;
              }
              this.invalidateRead();
              this.setState({ selectedRun, selectedExp });
            } }, data.project.id) : tab === "workspace" ? /* @__PURE__ */ jsx(WorkspaceView, { data, perform: this.perform }, data.project.id) : tab === "integrations" ? /* @__PURE__ */ jsx(IntegrationsView, { projectId: data.project.id, sessionId: this.state.sessionId, refreshToken: data, readOnly: data.project.archived, onLiterature: () => this.setState({ tab: "literature" }) }, data.project.id) : tab === "literature" ? /* @__PURE__ */ jsx(LiteratureView, { data, perform: this.perform, session: currentSession, onUseDocument: this.useParsedDocument, selectedDiscoveryGrant: this.state.selectedDiscoveryGrant, onSelectDiscoveryGrant: (selectedDiscoveryGrant) => this.setState({ selectedDiscoveryGrant }), onSession: (id) => this.selectSession(id), selectedDocument: this.state.selectedDocument ?? void 0, onDocument: (selectedDocument) => this.setState({ selectedDocument }), onSources: () => this.setState({ tab: "integrations" }) }, data.project.id) : tab === "evidence" ? /* @__PURE__ */ jsx(EvidenceView, { onDocument: (selectedDocument) => this.setState({ selectedDocument, tab: "literature" }), data, perform: this.perform, onRegister: (artifactId, content) => this.open("evidence", { artifactId, content }), onClaim: () => this.open("claim") }, data.project.id) : tab === "reports" ? /* @__PURE__ */ jsx(ReportsView, { onCampaign: (selectedCampaign) => {
              const clearHistory = { messages: [], pendingMessages: [], pendingTotal: 0, pendingNextCursor: null, canSteer: false, history: null, historyAnchor: null, stream: "", streamTruncated: false };
              const campaign = data.campaigns.find((c) => c.id === selectedCampaign);
              if (!campaign) {
                this.setState({ ...clearHistory, error: "\u6307\u5B9A\u7814\u7A76\u6D3B\u52A8\u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u6D3B\u52A8\u3002" });
                return;
              }
              if (!campaign.rootSessionId) {
                this.setState({ ...clearHistory, error: "\u6307\u5B9A\u7814\u7A76\u6D3B\u52A8\u6CA1\u6709\u53EF\u6253\u5F00\u7684\u4E3B\u4F1A\u8BDD\u3002" });
                return;
              }
              this.setState({ selectedCampaign }, () => this.selectSession(campaign.rootSessionId));
            }, onSession: (id) => this.selectSession(id), onDocument: (selectedDocument) => this.setState({ selectedDocument, tab: "literature" }), data, perform: this.perform, selectedReport: this.state.selectedReport, onSelect: (selectedReport) => this.setState({ selectedReport }), onRun: (selectedRun, selectedExp) => {
              if (!data.runs.some((r) => r.id === selectedRun && r.experimentId === selectedExp) || !data.experiments.some((e) => e.id === selectedExp)) {
                this.setState({ error: "\u6307\u5B9A\u62A5\u544A Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
                return;
              }
              this.invalidateRead();
              this.setState({ selectedRun, selectedExp, tab: "experiments" });
            } }, data.project.id) : null
          ] }),
          data && boot && ["chat", "experiments"].includes(tab) ? /* @__PURE__ */ jsx(Inspector, { data, boot, tab, sessionId: collaborationSessionId, inlineWorkflows: tab === "chat" && currentSession?.role === "coordinator" && !currentSession.taskId, experiment, selectedRun: this.state.selectedRun, onRun: (selectedRun) => this.setState({ selectedRun }), perform: this.perform, onConfig: () => {
            if (experiment)
              this.perform(async () => {
                const file = await api(`/experiments/${experiment.id}/files?path=config.json`);
                this.open("config", { ...file });
              });
          }, onDirective: (teamId) => this.open("directive", teamId) }) : null
        ] })
      ] }),
      this.modalView()
    ] });
  }
}
export {
  App
};
