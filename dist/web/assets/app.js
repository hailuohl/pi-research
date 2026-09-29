import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { ProjectEventFeed } from "./event-feed.js";
import { SchedulerView } from "./scheduler-view.js";
import { IntegrationsView } from "./integrations.js";
import { ChangesView } from "./changes.js";
import { ImplementationView } from "./implementation.js";
import { CampaignView } from "./campaigns.js";
import { api, ApiError, hasToken, setToken } from "./api.js";
import { short } from "./models.js";
import { Icon, Modal } from "./ui.js";
import { Chat, Experiments, Inspector } from "./workbench.js";
import { SessionList } from "./session-list.js";
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from "./data-views.js";
const navigation = [["chat", "\u7814\u7A76\u4F1A\u8BDD", "chat"], ["scheduler", "\u8D44\u6E90\u4E0E\u8C03\u5EA6", "settings"], ["implementation", "\u5B9E\u73B0\u4E0E\u5BA1\u67E5", "branch"], ["campaigns", "\u7814\u7A76\u6D3B\u52A8", "branch"], ["experiments", "\u5B9E\u9A8C\u4E0E\u8FD0\u884C", "experiment"], ["workspace", "\u9879\u76EE\u5DE5\u4F5C\u533A", "folder"], ["changes", "\u53D8\u66F4\u63D0\u6848", "branch"], ["literature", "\u6587\u732E\u68C0\u7D22", "search"], ["integrations", "\u6280\u80FD\u4E0E\u8FDE\u63A5\u5668", "settings"], ["evidence", "\u8D44\u6599\u4E0E\u8BC1\u636E", "evidence"], ["reports", "\u62A5\u544A\u4E0E\u6210\u679C", "report"], ["settings", "\u8BBE\u7F6E\u4E0E\u80FD\u529B", "settings"]];
const manualTasks = [{ key: "sources", role: "literature", objective: "\u6574\u7406\u7528\u6237\u5DF2\u63D0\u4F9B\u8D44\u6599\u53CA\u5019\u9009\u6587\u732E\uFF1B\u68C0\u7D22\u7B56\u7565\u4E0E\u6700\u7EC8\u6392\u5E8F\u7531\u4E3B\u534F\u8C03\u8005\u8D1F\u8D23\u3002\u660E\u786E\u672A\u9605\u8BFB\u7684\u5168\u6587\u3002", dependencies: [] }, { key: "analysis", role: "analyst", objective: "\u6838\u67E5\u5DF2\u6709\u8FD0\u884C\u6307\u6807\u53CA\u5176\u8BC1\u636E\uFF1B\u7F3A\u5C11\u5FC5\u8981\u8F93\u5165\u5219\u963B\u585E\uFF0C\u4E0D\u7F16\u9020\u7ED3\u679C\u3002", dependencies: [], critical: true }, { key: "review", role: "reviewer", objective: "\u72EC\u7ACB\u6838\u67E5\u5206\u6790\u7ED3\u8BBA\u4E0E\u771F\u5B9E\u8BC1\u636E\u3002", dependencies: ["sources"], reviewOf: "analysis" }, { key: "report", role: "writer", objective: "\u6839\u636E\u5DF2\u9A8C\u6536\u7684\u8F93\u5165\u5F62\u6210\u5B9E\u9645\u62A5\u544A\u4EA7\u7269\uFF0C\u8BF4\u660E\u9650\u5236\u3002", dependencies: ["analysis", "review"], expectedOutputs: [{ kind: "report", schemaId: "report", required: true }], acceptanceRuleIds: ["artifact-required"] }];
function saved() {
  try {
    return JSON.parse(localStorage.getItem("pi-research-ui-v1") ?? "{}");
  } catch {
    return {};
  }
}
class ExperimentModal extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { runner: "trusted-example", metrics: [0], error: "" };
    this.nextMetric = 1;
  }
  render() {
    const { parent, busy, onClose, perform, onSave } = this.props, docker = !parent && this.state.runner === "docker";
    return /* @__PURE__ */ jsxs(Modal, { busy, onClose, wide: true, title: parent ? "\u6D3E\u751F\u5B50\u5B9E\u9A8C" : "\u5EFA\u7ACB\u5B9E\u9A8C\u8349\u6848", submitLabel: "\u4FDD\u5B58\u5B9E\u9A8C\u8349\u6848", onSubmit: (fd) => perform(async () => {
      this.setState({ error: "" });
      try {
        const config = String(fd.get("config") ?? "").trim();
        const input = { title: fd.get("title"), hypothesis: fd.get("hypothesis"), ...parent ? { parentId: parent.id } : {}, ...config ? { config: JSON.parse(config) } : {} };
        if (docker) {
          const metrics = /* @__PURE__ */ Object.create(null);
          for (const id of this.state.metrics) {
            const name = String(fd.get(`metric-${id}`)).trim();
            if (Object.prototype.hasOwnProperty.call(metrics, name)) throw Error("\u6307\u6807\u540D\u79F0\u4E0D\u80FD\u91CD\u590D");
            metrics[name] = { unit: String(fd.get(`unit-${id}`)).trim(), direction: String(fd.get(`direction-${id}`)) };
          }
          const outputs = String(fd.get("outputs")).split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
          const args = String(fd.get("args") ?? "");
          input.contract = { runner: "docker", image: String(fd.get("image")).trim(), dockerContext: String(fd.get("context")).trim(), command: [String(fd.get("executable")).trim(), ...args ? args.split(/\r?\n/) : []], environment: {}, datasetVersion: String(fd.get("dataset")).trim(), evaluationProtocolVersion: String(fd.get("protocol")).trim(), metrics, expectedArtifacts: [.../* @__PURE__ */ new Set(["metrics.json", ...outputs])], cpus: Number(fd.get("cpus")), memoryMb: Number(fd.get("memory")), timeoutSeconds: Number(fd.get("timeout")) };
        }
        await onSave(input);
      } catch (error) {
        this.setState({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    }), children: [
      this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
      /* @__PURE__ */ jsxs("label", { children: [
        "\u5B9E\u9A8C\u540D\u79F0",
        /* @__PURE__ */ jsx("input", { name: "title", "aria-label": "\u5B9E\u9A8C\u540D\u79F0", defaultValue: parent ? "\u65B0\u5019\u9009\u5B9E\u9A8C" : "\u57FA\u7EBF\u5B9E\u9A8C", required: true, maxLength: 200 })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7814\u7A76\u5047\u8BBE",
        /* @__PURE__ */ jsx("textarea", { name: "hypothesis", "aria-label": "\u7814\u7A76\u5047\u8BBE", required: true, placeholder: "\u8981\u68C0\u9A8C\u7684\u5047\u8BBE\u3001\u5BF9\u7167\u6761\u4EF6\u548C\u9884\u671F\u7ED3\u679C" })
      ] }),
      parent ? /* @__PURE__ */ jsxs("p", { className: "notice", children: [
        "\u7EE7\u627F\u7236\u5B9E\u9A8C\u8FD0\u884C\u534F\u8BAE\uFF1A",
        parent.contract.runner === "docker" ? "Docker" : "\u53D7\u4FE1\u6570\u503C\u793A\u4F8B",
        "\uFF0C\u5165\u53E3 ",
        parent.contract.command.join(" "),
        "\u3002\u6B64\u5904\u4E0D\u4FEE\u6539\u955C\u50CF\u3001\u6307\u6807\u6216\u8D44\u6E90\u5951\u7EA6\u3002"
      ] }) : /* @__PURE__ */ jsxs("label", { children: [
        "\u8FD0\u884C\u65B9\u5F0F",
        /* @__PURE__ */ jsxs("select", { name: "runner", "aria-label": "\u8FD0\u884C\u65B9\u5F0F", value: this.state.runner, onChange: (e) => this.setState({ runner: e.target.value }), children: [
          /* @__PURE__ */ jsx("option", { value: "trusted-example", children: "\u53D7\u4FE1\u66F2\u7EBF\u62DF\u5408\u793A\u4F8B" }),
          /* @__PURE__ */ jsx("option", { value: "docker", children: "Docker \xB7 \u81EA\u6709\u7814\u7A76\u7A0B\u5E8F" })
        ] })
      ] }),
      docker ? /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u56FA\u5B9A\u955C\u50CF\u6458\u8981",
          /* @__PURE__ */ jsx("input", { name: "image", "aria-label": "\u56FA\u5B9A\u955C\u50CF\u6458\u8981", required: true, placeholder: "python@sha256:\u2026", pattern: ".+@sha256:[a-f0-9]{64}", maxLength: 250 })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u672C\u5730 Docker context",
          /* @__PURE__ */ jsx("input", { name: "context", "aria-label": "Docker context", defaultValue: "desktop-linux", required: true, maxLength: 100 })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u586B\u5199\u672C\u673A\u5DF2\u914D\u7F6E\u7684 Linux Docker context \u548C\u5DF2\u5B58\u5728\u7684\u56FA\u5B9A\u955C\u50CF\uFF1B\u4FDD\u5B58\u4E0D\u4F1A\u4E0B\u8F7D\u955C\u50CF\uFF0C\u4E5F\u4E0D\u4EE3\u8868\u5F15\u64CE\u9A8C\u8BC1\u901A\u8FC7\u3002" }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u53EF\u6267\u884C\u7A0B\u5E8F",
          /* @__PURE__ */ jsx("input", { name: "executable", "aria-label": "\u53EF\u6267\u884C\u7A0B\u5E8F", defaultValue: "python", required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u53C2\u6570\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u4FDD\u7559\u7A7A\u683C\uFF09",
          /* @__PURE__ */ jsx("textarea", { name: "args", "aria-label": "\u7A0B\u5E8F\u53C2\u6570", defaultValue: "main.py", rows: 3 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u6570\u636E\u7248\u672C",
            /* @__PURE__ */ jsx("input", { name: "dataset", "aria-label": "\u6570\u636E\u7248\u672C", required: true, placeholder: "\u4F8B\u5982 dataset-v1", maxLength: 200 })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8BC4\u4F30\u534F\u8BAE\u7248\u672C",
            /* @__PURE__ */ jsx("input", { name: "protocol", "aria-label": "\u8BC4\u4F30\u534F\u8BAE\u7248\u672C", required: true, placeholder: "\u4F8B\u5982 holdout-v1", maxLength: 200 })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("fieldset", { children: [
          /* @__PURE__ */ jsx("legend", { children: "\u5B9E\u6D4B\u6307\u6807" }),
          this.state.metrics.map((id, index) => /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
            /* @__PURE__ */ jsxs("label", { children: [
              "\u6307\u6807\u540D\u79F0 ",
              index + 1,
              /* @__PURE__ */ jsx("input", { name: `metric-${id}`, required: true, maxLength: 80, defaultValue: index === 0 ? "mse" : "" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u5355\u4F4D ",
              index + 1,
              /* @__PURE__ */ jsx("input", { name: `unit-${id}`, required: true, maxLength: 100, placeholder: "\u4F8B\u5982 dimensionless" })
            ] }),
            /* @__PURE__ */ jsxs("label", { children: [
              "\u65B9\u5411 ",
              index + 1,
              /* @__PURE__ */ jsxs("select", { name: `direction-${id}`, children: [
                /* @__PURE__ */ jsx("option", { value: "min", children: "\u8D8A\u4F4E\u8D8A\u597D" }),
                /* @__PURE__ */ jsx("option", { value: "max", children: "\u8D8A\u9AD8\u8D8A\u597D" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "text-button", disabled: this.state.metrics.length === 1, onClick: () => this.setState({ metrics: this.state.metrics.filter((n) => n !== id) }), children: [
              "\u79FB\u9664\u6307\u6807 ",
              index + 1
            ] })
          ] }, id)),
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary compact", onClick: () => this.setState({ metrics: [...this.state.metrics, this.nextMetric++] }), children: "\u6DFB\u52A0\u6307\u6807" })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u5FC5\u9700\u4EA7\u7269\uFF08\u6BCF\u884C\u4E00\u4E2A\u76F8\u5BF9\u8DEF\u5F84\uFF09",
          /* @__PURE__ */ jsx("textarea", { name: "outputs", "aria-label": "\u5FC5\u9700\u4EA7\u7269", defaultValue: "metrics.json", rows: 3 })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "metrics.json \u59CB\u7EC8\u5FC5\u9700\uFF1B\u7A0B\u5E8F\u5C06\u6307\u6807\u53CA\u6587\u4EF6\u5199\u5165 PI_OUTPUT_DIR \u6307\u5B9A\u7684\u8F93\u51FA\u76EE\u5F55\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "form-columns", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "CPU \u6838\u6570",
            /* @__PURE__ */ jsx("input", { name: "cpus", type: "number", min: 1, max: 64, defaultValue: 1, required: true })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u5185\u5B58 MiB",
            /* @__PURE__ */ jsx("input", { name: "memory", type: "number", min: 64, max: 65536, defaultValue: 256, required: true })
          ] }),
          /* @__PURE__ */ jsxs("label", { children: [
            "\u8D85\u65F6\u79D2\u6570",
            /* @__PURE__ */ jsx("input", { name: "timeout", type: "number", min: 1, max: 86400, defaultValue: 60, required: true })
          ] })
        ] })
      ] }) : null,
      /* @__PURE__ */ jsxs("label", { children: [
        "\u7248\u672C\u5316\u914D\u7F6E JSON\uFF08\u53EF\u9009\uFF09",
        /* @__PURE__ */ jsx("textarea", { name: "config", "aria-label": "\u7248\u672C\u5316\u914D\u7F6E JSON", className: "code-input", defaultValue: (parent?.contract.runner ?? this.state.runner) === "trusted-example" ? JSON.stringify({ polynomialDegree: parent ? 2 : 1, ridge: 1e-6 }, null, 2) : "", rows: 5 }, parent?.id ?? this.state.runner)
      ] }),
      /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u7559\u7A7A\u4FDD\u7559\u6765\u6E90\u6587\u4EF6\uFF1B\u586B\u5199\u65F6\u5C06\u914D\u7F6E\u4FDD\u5B58\u4E3A config.json\u3002\u521B\u5EFA\u5B9E\u9A8C\u4E0D\u4F1A\u8FD0\u884C\u4EE3\u7801\uFF0C\u6B63\u5F0F\u8FD0\u884C\u53E6\u884C\u51C6\u5907\u5E76\u6279\u51C6\u3002" })
    ] });
  }
}
class App extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { boot: null, data: null, projectId: saved().projectId ?? "", sessionId: saved().sessionId ?? "", tab: saved().tab ?? "chat", selectedExp: saved().selectedExp ?? "", selectedRun: saved().selectedRun ?? "", selectedReport: saved().selectedReport ?? "", selectedCampaign: saved().selectedCampaign ?? "", selectedRunGrant: saved().selectedRunGrant ?? "", selectedDiscoveryGrant: saved().selectedDiscoveryGrant ?? "", selectedDocument: saved().selectedDocument ?? null, messages: [], history: null, historyAnchor: saved().historyAnchor && saved().historyAnchor.projectId === saved().projectId && saved().historyAnchor.sessionId === saved().sessionId ? saved().historyAnchor.anchor : null, stream: "", streamTruncated: false, eventNotice: "", modal: "", modalData: null, busy: false, error: "", notice: "", connected: false, tokenDraft: "", loggedIn: hasToken() };
    this.refreshEpoch = 0;
    this.mounted = true;
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
    this.selectHistory = (anchor) => {
      this.invalidateRead();
      this.setState({ messages: [], historyAnchor: anchor, stream: "", streamTruncated: false }, () => void this.refresh());
    };
    this.close = () => {
      if (!this.state.busy)
        this.setState({ modal: "", modalData: null });
    };
  }
  componentDidMount() {
    if (this.state.loggedIn) void this.refresh();
    this.timer = window.setInterval(() => {
      if (this.state.loggedIn) {
        if (this.feed) this.feed.wake();
        else void this.refresh(true);
      }
    }, 2e4);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.invalidateRead();
    this.feed?.stop();
    clearInterval(this.timer);
    clearTimeout(this.noticeTimer);
  }
  componentDidUpdate(_, prev) {
    if (["projectId", "sessionId", "tab", "selectedExp", "selectedRun", "selectedReport", "selectedCampaign", "selectedRunGrant", "selectedDiscoveryGrant", "selectedDocument", "historyAnchor"].some((k) => prev[k] !== this.state[k]))
      localStorage.setItem("pi-research-ui-v1", JSON.stringify({ projectId: this.state.projectId, sessionId: this.state.sessionId, tab: this.state.tab, selectedExp: this.state.selectedExp, selectedRun: this.state.selectedRun, selectedReport: this.state.selectedReport, selectedCampaign: this.state.selectedCampaign, selectedRunGrant: this.state.selectedRunGrant, selectedDiscoveryGrant: this.state.selectedDiscoveryGrant, selectedDocument: this.state.selectedDocument, historyAnchor: { projectId: this.state.projectId, sessionId: this.state.sessionId, anchor: this.state.historyAnchor } }));
    if (!this.state.loggedIn && prev.loggedIn) {
      this.feed?.stop();
      this.feed = void 0;
      this.invalidateRead();
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
      const selectedExp = data?.experiments.some((e) => e.id === this.state.selectedExp) ? this.state.selectedExp : data?.experiments[0]?.id ?? "";
      await new Promise((resolve) => this.setState({ boot, data, projectId, sessionId, messages: view?.messages ?? [], history: view?.history ?? null, historyAnchor: anchor, selectedExp, stream: !anchor && active ? view.progress.content : "", streamTruncated: !anchor && active && !!view?.progress.truncated, connected: true }, resolve));
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
      if (error instanceof ApiError && error.status === 401) this.setState({ loggedIn: false, error: error.message });
      else this.setState((previous) => ({ ...previous, connected: false, ...!quiet ? { error: error instanceof Error ? error.message : String(error) } : {} }));
      return false;
    } finally {
      if (this.readController === controller) this.readController = void 0;
    }
  }
  sessionSelection(id, tab = this.state.tab) {
    return { sessionId: id, tab, messages: [], history: null, historyAnchor: null, stream: "", streamTruncated: false, error: "" };
  }
  switchProject(id) {
    this.invalidateRead();
    this.feed?.stop();
    this.feed = void 0;
    this.setState({ ...this.sessionSelection(""), projectId: id, selectedExp: "", selectedRun: "", selectedReport: "", selectedCampaign: "", selectedRunGrant: "", selectedDiscoveryGrant: "", selectedDocument: null, eventNotice: "", data: null }, () => {
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
    if (!this.state.projectId)
      return;
    await this.perform(async () => {
      const s = await api("/sessions", { projectId: this.state.projectId, title: "\u65B0\u7684\u7814\u7A76\u4F1A\u8BDD" });
      await new Promise((resolve) => this.setState(this.sessionSelection(s.id, "chat"), resolve));
    });
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
      return /* @__PURE__ */ jsxs(Modal, { ...base, title: "\u65B0\u5EFA\u672C\u5730\u9879\u76EE", submitLabel: "\u521B\u5EFA\u9879\u76EE", onSubmit: (fd) => this.perform(async () => {
        const p = await api("/projects", { name: fd.get("name"), description: fd.get("description"), template: fd.get("template") });
        const s = await api("/sessions", { projectId: p.id, title: "\u7814\u7A76\u4E3B\u4F1A\u8BDD" });
        await new Promise((resolve) => this.setState({ ...this.sessionSelection(s.id, "chat"), projectId: p.id, selectedExp: "", selectedRun: "", selectedReport: "", selectedCampaign: "", selectedRunGrant: "", selectedDiscoveryGrant: "", selectedDocument: null, data: null }, resolve));
        done();
      }), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9879\u76EE\u540D\u79F0",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u9879\u76EE\u540D\u79F0", name: "name", required: true, maxLength: 120, placeholder: "\u4F8B\u5982\uFF1A\u6750\u6599\u7B5B\u9009\u7814\u7A76" })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9879\u76EE\u8BF4\u660E",
          /* @__PURE__ */ jsx("textarea", { name: "description", placeholder: "\u7814\u7A76\u76EE\u6807\u3001\u8303\u56F4\u6216\u8F93\u5165\u8D44\u6599" })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9879\u76EE\u6A21\u677F",
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u9879\u76EE\u6A21\u677F", name: "template", defaultValue: "curve-fit", children: [
            /* @__PURE__ */ jsx("option", { value: "curve-fit", children: "\u771F\u5B9E\u66F2\u7EBF\u62DF\u5408\u793A\u4F8B \xB7 \u53EF\u76F4\u63A5\u8FD0\u884C" }),
            /* @__PURE__ */ jsx("option", { value: "empty", children: "\u7A7A\u9879\u76EE \xB7 \u81EA\u884C\u51C6\u5907\u6587\u4EF6" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "notice", children: /* @__PURE__ */ jsx("p", { children: "\u66F2\u7EBF\u62DF\u5408\u4F7F\u7528\u56FA\u5B9A\u5408\u6210\u6570\u636E\uFF0C\u771F\u5B9E\u6267\u884C\u6570\u503C\u8BA1\u7B97\u3002\u5B83\u7528\u4E8E\u9A8C\u8BC1\u7CFB\u7EDF\uFF0C\u4E0D\u662F\u6750\u6599\u7814\u7A76\u6216 LLM \u6A21\u62DF\u3002" }) })
      ] });
    if (modal === "experiment")
      return /* @__PURE__ */ jsx(ExperimentModal, { ...base, parent: data.experiments.find((e) => e.id === modalData?.parentId), perform: this.perform, onSave: async (input) => {
        const e = await api("/experiments", { projectId: data.project.id, ...input });
        this.setState({ selectedExp: e.id, tab: "experiments" });
        done();
      } });
    if (modal === "config")
      return /* @__PURE__ */ jsxs(Modal, { ...base, wide: true, title: "\u5B9E\u9A8C\u7248\u672C\u5316\u914D\u7F6E", submitLabel: modalData.frozen ? "\u5173\u95ED\u53EA\u8BFB\u914D\u7F6E" : "\u4FDD\u5B58\u914D\u7F6E\u4FEE\u8BA2", onSubmit: (fd) => this.perform(async () => {
        if (!modalData.frozen)
          await api(`/experiments/${modalData.id}/files`, { path: "config.json", content: fd.get("content"), expectedDigest: modalData.digest, expectedVersion: modalData.version });
        done();
      }), children: [
        /* @__PURE__ */ jsx("p", { className: "small muted", children: modalData.frozen ? "\u5DF2\u51BB\u7ED3\u8282\u70B9\u4E0D\u80FD\u4FEE\u6539\uFF1B\u9700\u8981\u53D8\u66F4\u65F6\u8BF7\u6D3E\u751F\u5B50\u5B9E\u9A8C\u3002" : "\u4FDD\u5B58\u4F1A\u589E\u52A0\u65B9\u6848\u4FEE\u8BA2\uFF0C\u4E4B\u524D\u51C6\u5907\u7684\u8FD0\u884C\u6279\u51C6\u4E0D\u518D\u9002\u7528\u3002" }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u914D\u7F6E\u6E90\u7801",
          /* @__PURE__ */ jsx("textarea", { name: "content", "aria-label": "\u914D\u7F6E\u6E90\u7801", className: "code-input", rows: 12, readOnly: modalData.frozen, defaultValue: modalData.content })
        ] })
      ] });
    if (modal === "team")
      return /* @__PURE__ */ jsxs(Modal, { ...base, wide: true, title: "\u624B\u52A8\u7F16\u5199\u534F\u4F5C\u8BA1\u5212", submitLabel: "\u63D0\u4EA4\u8BA1\u5212\u5F85\u6279\u51C6", onSubmit: (fd) => this.perform(async () => {
        let sessionId = this.state.sessionId;
        if (!sessionId) {
          const s = await api("/sessions", { projectId: data.project.id, title: "\u534F\u4F5C\u4E3B\u4F1A\u8BDD" });
          sessionId = s.id;
          await new Promise((resolve) => this.setState(this.sessionSelection(sessionId), resolve));
        }
        await api(`/sessions/${sessionId}/teams`, { goal: fd.get("goal"), tasks: JSON.parse(String(fd.get("tasks"))), budget: Number(fd.get("budget")), autoSummarize: fd.get("autoSummarize") === "on" });
        done();
      }), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u534F\u4F5C\u76EE\u6807",
          /* @__PURE__ */ jsx("input", { name: "goal", "aria-label": "\u534F\u4F5C\u76EE\u6807", required: true, placeholder: "\u9700\u8981\u5171\u540C\u5B8C\u6210\u7684\u76EE\u6807" })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u4EFB\u52A1\u4F9D\u8D56 JSON",
          /* @__PURE__ */ jsx("textarea", { className: "code-input", "aria-label": "\u4EFB\u52A1\u4F9D\u8D56 JSON", name: "tasks", defaultValue: JSON.stringify(manualTasks.map((t) => t.key === "analysis" ? { ...t, inputEvidenceIds: data?.evidence.map((e) => e.id) ?? [] } : t), null, 2), rows: 13, required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6700\u5927\u5C1D\u8BD5\u989D\u5EA6",
          /* @__PURE__ */ jsx("input", { type: "number", name: "budget", min: 5, max: 100, defaultValue: 12 })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "check-label", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", name: "autoSummarize", defaultChecked: true }),
          "\u534F\u4F5C\u7ED3\u675F\u540E\u81EA\u52A8\u5524\u9192\u4E3B Pi \u7EFC\u5408\uFF08\u5360\u7528\u56E2\u961F\u5C1D\u8BD5\u989D\u5EA6\uFF09"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FD9\u662F\u624B\u52A8\u8BA1\u5212\u6A21\u677F\uFF0C\u4E0D\u662F\u6A21\u578B\u751F\u6210\u7684\u5EFA\u8BAE\u3002\u5173\u952E\u4EFB\u52A1\u901A\u8FC7 reviewOf \u5B89\u6392\u72EC\u7ACB\u5BA1\u67E5\uFF1B\u989D\u5EA6\u6309\u4EFB\u52A1\u5C1D\u8BD5\u8BA1\uFF0C\u4E0D\u662F\u5B9E\u9645\u8D26\u5355\u4E0A\u9650\u3002" })
      ] });
    if (modal === "directive")
      return /* @__PURE__ */ jsxs(Modal, { ...base, title: "\u7ED9\u56E2\u961F\u53D1\u9001\u6307\u4EE4", submitLabel: "\u4FDD\u5B58\u6307\u4EE4", onSubmit: (fd) => this.perform(async () => {
        await api(`/teams/${modalData}/directives`, { kind: fd.get("kind"), content: fd.get("content") });
        done();
      }), children: [
        /* @__PURE__ */ jsxs("label", { children: [
          "\u6307\u4EE4\u8BED\u4E49",
          /* @__PURE__ */ jsxs("select", { name: "kind", children: [
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
          /* @__PURE__ */ jsx("select", { name: "evidenceId", children: data.evidence.map((e) => /* @__PURE__ */ jsxs("option", { value: e.id, children: [
            e.description,
            " \xB7 ",
            short(e.id)
          ] }, e.id)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          "\u9650\u5236\uFF08\u6BCF\u884C\u4E00\u6761\uFF09",
          /* @__PURE__ */ jsx("textarea", { name: "limitations", required: true, placeholder: "\u6837\u672C\u89C4\u6A21\u3001\u6761\u4EF6\u3001\u672A\u6267\u884C\u7684\u9A8C\u8BC1\u7B49" })
        ] })
      ] });
    return null;
  }
  render() {
    const { boot, data, loggedIn, tab } = this.state;
    if (!loggedIn)
      return /* @__PURE__ */ jsxs("main", { className: "login", children: [
        /* @__PURE__ */ jsxs("div", { className: "brand", children: [
          /* @__PURE__ */ jsx("span", { children: "\u03C0" }),
          "Pi Research"
        ] }),
        /* @__PURE__ */ jsx("h1", { children: "\u6253\u5F00\u4F60\u7684\u79D1\u7814\u5DE5\u4F5C\u53F0" }),
        /* @__PURE__ */ jsx("p", { children: "\u8BF7\u4F7F\u7528\u542F\u52A8\u7EC8\u7AEF\u4E2D\u7684\u5B8C\u6574\u5730\u5740\uFF0C\u6216\u5728\u8FD9\u91CC\u7C98\u8D34\u672C\u673A\u8BBF\u95EE\u4EE4\u724C\u3002" }),
        /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          setToken(this.state.tokenDraft);
          this.setState({ loggedIn: true, error: "" }, () => {
            void this.refresh();
          });
        }, children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u672C\u5730\u8BBF\u95EE\u4EE4\u724C",
            /* @__PURE__ */ jsx("input", { "aria-label": "\u672C\u5730\u8BBF\u95EE\u4EE4\u724C", type: "password", value: this.state.tokenDraft, onChange: (e) => this.setState({ tokenDraft: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "primary", children: "\u8FDB\u5165\u5DE5\u4F5C\u53F0" })
        ] }),
        this.state.error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.error }) : null,
        /* @__PURE__ */ jsx("small", { children: "\u53EA\u7ED1\u5B9A 127.0.0.1\u3002\u4EE4\u724C\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u4F1A\u8BDD\u4E2D\uFF0C\u4E0D\u653E\u5165\u8BF7\u6C42 URL\u3002" })
      ] });
    const currentSession = data?.sessions.find((s) => s.id === this.state.sessionId), experiment = data?.experiments.find((e) => e.id === this.state.selectedExp);
    return /* @__PURE__ */ jsxs("div", { className: "app-shell", children: [
      /* @__PURE__ */ jsxs("nav", { className: "sidebar", "aria-label": "\u4E3B\u5BFC\u822A", children: [
        /* @__PURE__ */ jsxs("a", { className: "brand", href: "#", onClick: (e) => {
          e.preventDefault();
          this.setState({ tab: "chat" });
        }, children: [
          /* @__PURE__ */ jsx("span", { children: "\u03C0" }),
          /* @__PURE__ */ jsxs("div", { children: [
            "Pi Research",
            /* @__PURE__ */ jsx("small", { children: "RESEARCH WORKSPACE" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "new-project", onClick: () => this.open("project"), children: [
          /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
          "\u65B0\u5EFA\u9879\u76EE"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "sidebar-caption", children: "WORKSPACE" }),
        /* @__PURE__ */ jsx("div", { className: "nav-list", children: navigation.map(([id, name, icon]) => /* @__PURE__ */ jsxs("button", { className: tab === id ? "active" : "", onClick: () => this.setState({ tab: id }), children: [
          /* @__PURE__ */ jsx(Icon, { name: icon, size: 18 }),
          /* @__PURE__ */ jsx("span", { children: name }),
          id === "experiments" && data?.experiments.length ? /* @__PURE__ */ jsx("em", { children: data.experiments.length }) : null
        ] }, id)) }),
        /* @__PURE__ */ jsx(SessionList, { projectId: this.state.projectId, selectedId: this.state.sessionId, selected: currentSession, onSelect: (id) => this.selectSession(id), onNew: () => this.newSession() }),
        /* @__PURE__ */ jsxs("div", { className: "sidebar-footer", children: [
          /* @__PURE__ */ jsx("div", { className: "local-avatar", children: /* @__PURE__ */ jsx(Icon, { name: "folder" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "\u672C\u5730\u5DE5\u4F5C\u7A7A\u95F4" }),
            /* @__PURE__ */ jsx("small", { children: "\u6570\u636E\u7531\u4F60\u638C\u63E1" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "status-dot " + (this.state.connected ? "" : "amber") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "workspace-shell", children: [
        /* @__PURE__ */ jsxs("header", { className: "topbar", children: [
          /* @__PURE__ */ jsxs("div", { className: "breadcrumb", children: [
            /* @__PURE__ */ jsx("span", { children: "\u9879\u76EE" }),
            /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 12 }),
            /* @__PURE__ */ jsx("select", { "aria-label": "\u5F53\u524D\u9879\u76EE", value: this.state.projectId, onChange: (e) => this.switchProject(e.target.value), children: !boot?.projects.length ? /* @__PURE__ */ jsx("option", { value: "", children: "\u5C1A\u672A\u521B\u5EFA\u9879\u76EE" }) : boot.projects.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "topbar-right", children: [
            /* @__PURE__ */ jsxs("span", { className: "connection-state " + (this.state.connected ? "ready" : ""), children: [
              /* @__PURE__ */ jsx("span", { className: "status-dot " + (this.state.connected ? "" : "amber") }),
              this.state.connected ? "\u672C\u5730\u670D\u52A1\u5728\u7EBF" : "\u6B63\u5728\u91CD\u8FDE"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "version-label", children: "v0.2 \xB7 \u5F00\u53D1\u7248" })
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
          /* @__PURE__ */ jsx("main", { className: "main-pane " + (tab === "chat" ? "chat-pane" : ""), children: !boot ? /* @__PURE__ */ jsx("div", { className: "boot-screen", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u9879\u76EE\u2026" }) : tab === "settings" ? /* @__PURE__ */ jsx(SettingsView, { boot, session: currentSession, perform: this.perform }) : !data ? /* @__PURE__ */ jsxs("div", { className: "first-project", children: [
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
          ] }) : tab === "chat" ? /* @__PURE__ */ jsx(Chat, { data, boot, session: currentSession, messages: this.state.messages, history: this.state.history, historyAnchor: this.state.historyAnchor, onHistory: this.selectHistory, stream: this.state.stream, streamTruncated: this.state.streamTruncated, perform: this.perform, onNew: () => this.newSession(), onExperiments: () => this.setState({ tab: "experiments" }), onWorkspace: () => this.setState({ tab: "workspace" }), onSession: (id) => this.selectSession(id) }) : tab === "scheduler" ? /* @__PURE__ */ jsx(SchedulerView, { data, perform: this.perform }, data.project.id) : tab === "implementation" ? /* @__PURE__ */ jsx(ImplementationView, { onScheduler: () => this.setState({ tab: "scheduler" }), data, sessionId: this.state.sessionId, busy: this.state.busy, perform: this.perform, onSession: (sessionId) => this.selectSession(sessionId, "implementation"), onChat: (id) => this.selectSession(id), onExperiment: (selectedExp) => this.setState({ selectedExp, selectedRun: "", tab: "experiments" }) }, data.project.id) : tab === "campaigns" ? /* @__PURE__ */ jsx(CampaignView, { onRun: (selectedRun, selectedExp) => {
            if (!data.runs.some((r) => r.id === selectedRun && r.experimentId === selectedExp) || !data.experiments.some((e) => e.id === selectedExp)) {
              this.setState({ error: "\u6307\u5B9A\u6D3B\u52A8 Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
              return;
            }
            this.invalidateRead();
            this.setState({ selectedRun, selectedExp, tab: "experiments" });
          }, selectedCampaign: this.state.selectedCampaign, onSelect: (selectedCampaign) => this.setState({ selectedCampaign }), onImplementation: (sessionId) => this.selectSession(sessionId, "implementation"), data, busy: this.state.busy, perform: this.perform, onSession: (id) => this.selectSession(id), onExperiment: (id) => this.setState({ selectedExp: id, selectedRun: "", tab: "experiments" }) }, data.project.id) : tab === "experiments" ? /* @__PURE__ */ jsx(Experiments, { perform: this.perform, busy: this.state.busy, selectedRunGrant: this.state.selectedRunGrant, onSelectRunGrant: (selectedRunGrant) => this.setState({ selectedRunGrant }), onSession: (id) => this.selectSession(id), data, selected: this.state.selectedExp, onSelect: (selectedExp) => {
            this.invalidateRead();
            this.setState({ selectedExp, selectedRun: "" });
          }, onRun: (selectedRun, selectedExp) => {
            if (!data.runs.some((r) => r.id === selectedRun && r.experimentId === selectedExp) || !data.experiments.some((e) => e.id === selectedExp)) {
              this.setState({ error: "\u6307\u5B9A Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
              return;
            }
            this.invalidateRead();
            this.setState({ selectedRun, selectedExp });
          }, onCreate: () => this.open("experiment"), onChild: () => this.open("experiment", { parentId: experiment?.id }) }) : tab === "changes" ? /* @__PURE__ */ jsx(ChangesView, { data, perform: this.perform }, data.project.id) : tab === "workspace" ? /* @__PURE__ */ jsx(WorkspaceView, { data, perform: this.perform }, data.project.id) : tab === "integrations" ? /* @__PURE__ */ jsx(IntegrationsView, { projectId: data.project.id, sessionId: this.state.sessionId, onLiterature: () => this.setState({ tab: "literature" }) }, data.project.id) : tab === "literature" ? /* @__PURE__ */ jsx(LiteratureView, { data, perform: this.perform, selectedDiscoveryGrant: this.state.selectedDiscoveryGrant, onSelectDiscoveryGrant: (selectedDiscoveryGrant) => this.setState({ selectedDiscoveryGrant }), onSession: (id) => this.selectSession(id), selectedDocument: this.state.selectedDocument ?? void 0, onDocument: (selectedDocument) => this.setState({ selectedDocument }), onSources: () => this.setState({ tab: "integrations" }) }, data.project.id) : tab === "evidence" ? /* @__PURE__ */ jsx(EvidenceView, { onDocument: (selectedDocument) => this.setState({ selectedDocument, tab: "literature" }), data, perform: this.perform, onRegister: (artifactId, content) => this.open("evidence", { artifactId, content }), onClaim: () => this.open("claim") }, data.project.id) : tab === "reports" ? /* @__PURE__ */ jsx(ReportsView, { onCampaign: (selectedCampaign) => {
            if (!data.campaigns.some((c) => c.id === selectedCampaign)) {
              this.setState({ error: "\u6307\u5B9A\u7814\u7A76\u6D3B\u52A8\u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u6D3B\u52A8\u3002" });
              return;
            }
            this.setState({ selectedCampaign, tab: "campaigns" });
          }, onSession: (id) => this.selectSession(id), onDocument: (selectedDocument) => this.setState({ selectedDocument, tab: "literature" }), data, perform: this.perform, selectedReport: this.state.selectedReport, onSelect: (selectedReport) => this.setState({ selectedReport }), onRun: (selectedRun, selectedExp) => {
            if (!data.runs.some((r) => r.id === selectedRun && r.experimentId === selectedExp) || !data.experiments.some((e) => e.id === selectedExp)) {
              this.setState({ error: "\u6307\u5B9A\u62A5\u544A Run \u4E0D\u5728\u5F53\u524D\u9879\u76EE\u4E2D\uFF0C\u672A\u8DF3\u8F6C\u5230\u5176\u4ED6\u8FD0\u884C\u3002" });
              return;
            }
            this.invalidateRead();
            this.setState({ selectedRun, selectedExp, tab: "experiments" });
          } }, data.project.id) : null }),
          data && boot && ["chat", "experiments"].includes(tab) ? /* @__PURE__ */ jsx(Inspector, { onScheduler: () => this.setState({ tab: "scheduler" }), data, boot, tab, experiment, selectedRun: this.state.selectedRun, onRun: (selectedRun) => this.setState({ selectedRun }), perform: this.perform, onToggle: () => this.toggle(), onTeam: () => this.open("team"), onPrepare: () => {
            if (experiment)
              this.perform(() => api("/run-intents", { experimentId: experiment.id }), "\u5DF2\u51C6\u5907\u4E0D\u53EF\u53D8\u5FEB\u7167\uFF0C\u7B49\u5F85\u4EBA\u5DE5\u6279\u51C6");
          }, onChild: () => this.open("experiment", { parentId: experiment?.id }), onConfig: () => {
            if (experiment)
              this.perform(async () => {
                const file = await api(`/experiments/${experiment.id}/files?path=config.json`);
                this.open("config", { id: experiment.id, version: experiment.version, frozen: experiment.lifecycle === "frozen", ...file });
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
