import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { RunGrants, runGrantUsable } from "./run-grants.js";
import { LogView } from "./log-view.js";
import { SessionHistory } from "./session-history.js";
import { ComputeWait } from "./scheduler-view.js";
import { WakeupPanel } from "./campaigns.js";
import { comparableRuns, comparisonMetric } from "./models.js";
import { api, artifactText, downloadArtifact } from "./api.js";
import { short, number, date, label } from "./models.js";
import { Icon, Badge, Empty, SectionTitle } from "./ui.js";
class Chat extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { draft: "", mode: "prompt" };
  }
  render() {
    const { data, boot, session, messages } = this.props;
    const canSend = boot.runtime.ready && !!session && !!session.model.provider && !!session.model.model && !session.taskId && session.state !== "archived" && !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest);
    return /* @__PURE__ */ jsxs("div", { className: "chat-page", children: [
      /* @__PURE__ */ jsxs("div", { className: "chat-heading", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { children: session?.title ?? "\u7814\u7A76\u4F1A\u8BDD" }),
          /* @__PURE__ */ jsx("span", { className: "muted", children: session ? `${session.model.provider || "\u672A\u914D\u7F6E\u4F9B\u5E94\u5546"} / ${session.model.model || "\u672A\u914D\u7F6E\u6A21\u578B"}` : "\u6BCF\u4E2A\u4E3B\u4F1A\u8BDD\u90FD\u6709\u72EC\u7ACB\u5386\u53F2\u548C\u5DE5\u4F5C\u533A" })
        ] }),
        session ? /* @__PURE__ */ jsxs("div", { className: "actions", children: [
          /* @__PURE__ */ jsx(Badge, { value: session.state }),
          /* @__PURE__ */ jsx("button", { className: "icon-button", title: "\u91CD\u547D\u540D\u4F1A\u8BDD", "aria-label": "\u91CD\u547D\u540D\u4F1A\u8BDD", onClick: () => {
            const title = prompt("\u4F1A\u8BDD\u540D\u79F0", session.title);
            if (title)
              this.props.perform(() => api(`/sessions/${session.id}`, { title, expectedVersion: session.version }));
          }, children: /* @__PURE__ */ jsx(Icon, { name: "evidence" }) })
        ] }) : null
      ] }),
      !boot.runtime.ready ? /* @__PURE__ */ jsxs("div", { className: "notice runtime-notice", children: [
        /* @__PURE__ */ jsx("span", { className: "status-dot amber" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Pi \u5C1A\u672A\u5C31\u7EEA" }),
          /* @__PURE__ */ jsxs("p", { children: [
            boot.runtime.message,
            " \u9879\u76EE\u3001\u5FEB\u7167\u3001\u771F\u5B9E\u6570\u503C\u5B9E\u9A8C\u548C\u8BC1\u636E\u7BA1\u7406\u4ECD\u53EF\u4F7F\u7528\u3002"
          ] })
        ] })
      ] }) : null,
      session?.taskId ? /* @__PURE__ */ jsx("p", { className: "notice runtime-notice", children: "\u8FD9\u662F\u56E2\u961F\u4EFB\u52A1\u4F1A\u8BDD\u3002\u8BF7\u901A\u8FC7\u56E2\u961F\u4EFB\u52A1\u63A7\u4EF6\u53D1\u9001\u6307\u4EE4\u6216\u7BA1\u7406\u4EFB\u52A1\u3002" }) : session?.state === "archived" ? /* @__PURE__ */ jsx("p", { className: "notice runtime-notice", children: "\u6B64\u4F1A\u8BDD\u5DF2\u5F52\u6863\uFF0C\u4E0D\u80FD\u53D1\u9001\u6D88\u606F\u3002" }) : null,
      /* @__PURE__ */ jsxs("div", { className: "conversation", "aria-live": "polite", children: [
        messages.length === 0 && !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) ? /* @__PURE__ */ jsxs("div", { className: "welcome", children: [
          /* @__PURE__ */ jsx("div", { className: "welcome-mark", children: "\u03C0" }),
          /* @__PURE__ */ jsxs("h2", { children: [
            "\u8BA9\u7814\u7A76\u8FC7\u7A0B\uFF0C",
            /* @__PURE__ */ jsx("br", {}),
            "\u6709\u8FF9\u53EF\u5FAA\u3002"
          ] }),
          /* @__PURE__ */ jsxs("p", { children: [
            "\u4ECE\u95EE\u9898\u5230\u5B9E\u9A8C\uFF0C\u518D\u5230\u53EF\u4FE1\u8BC1\u636E\u3002",
            /* @__PURE__ */ jsx("br", {}),
            "\u6BCF\u4E00\u6B21\u8FD0\u884C\u90FD\u6709\u81EA\u5DF1\u7684\u5FEB\u7167\uFF0C\u6BCF\u4E00\u6B65\u51B3\u5B9A\u90FD\u4FDD\u7559\u4F9D\u636E\u3002"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "welcome-actions", children: [
            /* @__PURE__ */ jsxs("button", { onClick: this.props.onExperiments, children: [
              /* @__PURE__ */ jsx(Icon, { name: "experiment" }),
              /* @__PURE__ */ jsx("span", { children: "\u5EFA\u7ACB\u4E00\u4E2A\u53EF\u590D\u73B0\u7684\u5B9E\u9A8C" }),
              /* @__PURE__ */ jsx(Icon, { name: "arrow" })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: this.props.onWorkspace, children: [
              /* @__PURE__ */ jsx(Icon, { name: "folder" }),
              /* @__PURE__ */ jsx("span", { children: "\u67E5\u770B\u9879\u76EE\u4EE3\u7801\u4E0E\u914D\u7F6E" }),
              /* @__PURE__ */ jsx(Icon, { name: "arrow" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u7684\u5F15\u5BFC\u754C\u9762\uFF0C\u4E0D\u662F\u6A21\u578B\u751F\u6210\u7684\u7814\u7A76\u7ED3\u679C\u3002" })
        ] }) : /* @__PURE__ */ jsx(SessionHistory, { projectId: data.project.id, sessionId: session?.id ?? "", messages, history: this.props.history, historyAnchor: this.props.historyAnchor, onNavigate: this.props.onHistory, perform: this.props.perform }),
        !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) ? /* @__PURE__ */ jsx(WakeupPanel, { data, busy: false, sessionId: session?.id, perform: this.props.perform, onSession: this.props.onSession }) : null,
        !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) && this.props.stream ? /* @__PURE__ */ jsxs("article", { className: "message", children: [
          /* @__PURE__ */ jsx("div", { className: "message-avatar", children: "\u03C0" }),
          /* @__PURE__ */ jsxs("div", { className: "message-body", children: [
            /* @__PURE__ */ jsx("div", { className: "message-meta", children: "Pi \xB7 \u6D41\u5F0F\u8F93\u51FA\uFF0C\u7B49\u5F85\u6700\u7EC8\u6D88\u606F" }),
            /* @__PURE__ */ jsx("div", { className: "prose-text", children: this.props.stream }),
            this.props.streamTruncated ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u4EC5\u663E\u793A\u5F53\u524D\u8F93\u51FA\u5C3E\u90E8\uFF0C\u524D\u6587\u5DF2\u7701\u7565\uFF1B\u5B8C\u6574\u5185\u5BB9\u4EE5\u539F\u751F\u4F1A\u8BDD\u8BB0\u5F55\u4E3A\u51C6\u3002" }) : null
          ] })
        ] }) : null
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "composer-wrap", children: [
        /* @__PURE__ */ jsxs("form", { className: "composer", onSubmit: (e) => {
          e.preventDefault();
          if (!session || !canSend || !this.state.draft.trim())
            return;
          const content = this.state.draft;
          this.props.perform(async () => {
            await api(`/sessions/${session.id}/messages`, { content, mode: this.state.mode });
            this.setState({ draft: "" });
          });
        }, children: [
          /* @__PURE__ */ jsx("textarea", { "aria-label": "\u7814\u7A76\u95EE\u9898", placeholder: session?.taskId ? "\u8BF7\u901A\u8FC7\u56E2\u961F\u4EFB\u52A1\u63A7\u4EF6\u64CD\u4F5C" : session?.state === "archived" ? "\u5DF2\u5F52\u6863\u4F1A\u8BDD\u4E0D\u53EF\u53D1\u9001" : this.props.historyAnchor || this.props.history && !this.props.history.atLatest ? "\u8FD4\u56DE\u6700\u65B0\u6D88\u606F\u540E\u53EF\u53D1\u9001" : canSend ? "\u63CF\u8FF0\u7814\u7A76\u95EE\u9898\uFF0C\u6216\u53D1\u6D88\u606F\u5F15\u5BFC\u5F53\u524D\u4EFB\u52A1\u2026" : "\u914D\u7F6E Pi \u4F9B\u5E94\u5546\u548C\u6A21\u578B\u540E\uFF0C\u5728\u8FD9\u91CC\u5F00\u59CB\u7814\u7A76\u2026", value: this.state.draft, disabled: !!session?.taskId || session?.state === "archived", onChange: (e) => this.setState({ draft: e.target.value }), onKeyDown: (e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              e.currentTarget.form.requestSubmit();
            }
          } }),
          /* @__PURE__ */ jsxs("div", { className: "composer-toolbar", children: [
            /* @__PURE__ */ jsxs("select", { "aria-label": "\u6D88\u606F\u65B9\u5F0F", value: this.state.mode, onChange: (e) => this.setState({ mode: e.target.value }), children: [
              /* @__PURE__ */ jsx("option", { value: "prompt", children: "\u666E\u901A\u6D88\u606F" }),
              /* @__PURE__ */ jsx("option", { value: "steer", children: "\u5F15\u5BFC\u5F53\u524D\u4EFB\u52A1" }),
              /* @__PURE__ */ jsx("option", { value: "follow_up", children: "\u5F53\u524D\u7ED3\u675F\u540E\u6267\u884C" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "small muted", children: data.project.settings.enabled ? "\u6309\u9700\u534F\u4F5C\u5DF2\u5F00\u542F" : "\u5355\u667A\u80FD\u4F53\u6A21\u5F0F" }),
            /* @__PURE__ */ jsx("div", { className: "grow" }),
            session?.state === "running" && !session.taskId ? /* @__PURE__ */ jsxs("button", { type: "button", className: "secondary compact", onClick: () => this.props.perform(() => api(`/sessions/${session.id}/interrupt`, {}), "\u5DF2\u505C\u6B62 Agent\uFF1B\u6B63\u5F0F\u5B9E\u9A8C\u672A\u53D6\u6D88"), children: [
              /* @__PURE__ */ jsx(Icon, { name: "stop", size: 14 }),
              "\u505C\u6B62 Agent"
            ] }) : null,
            /* @__PURE__ */ jsxs("button", { className: "primary compact", disabled: !canSend || !this.state.draft.trim() || !session, children: [
              /* @__PURE__ */ jsx(Icon, { name: "arrow", size: 16 }),
              "\u53D1\u9001"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "composer-caption", children: [
          "\u56FA\u5B9A\u5FEB\u7167 \xB7 \u663E\u5F0F\u5BA1\u6279 \xB7 \u53EF\u8FFD\u6EAF\u8BC1\u636E ",
          /* @__PURE__ */ jsx("span", { children: "Ctrl + Enter \u53D1\u9001" })
        ] })
      ] })
    ] });
  }
}
function Experiments({ data, selected, onSelect, onCreate, onChild, onRun, perform, busy, onSession, selectedRunGrant, onSelectRunGrant }) {
  const roots = data.experiments.filter((e) => !e.parentId);
  const tree = (e, depth = 0) => /* @__PURE__ */ jsxs("div", { className: "experiment-branch", children: [
    /* @__PURE__ */ jsxs("button", { className: "experiment-node " + (selected === e.id ? "selected" : ""), style: { marginLeft: Math.min(depth, 6) * 20 }, onClick: () => onSelect(e.id), children: [
      /* @__PURE__ */ jsx("span", { className: "node-symbol", children: /* @__PURE__ */ jsx(Icon, { name: e.parentId ? "branch" : "experiment" }) }),
      /* @__PURE__ */ jsxs("span", { className: "node-content", children: [
        /* @__PURE__ */ jsx("strong", { children: e.title }),
        /* @__PURE__ */ jsxs("span", { children: [
          short(e.id),
          " ",
          /* @__PURE__ */ jsx("i", { children: "\xB7" }),
          " ",
          e.parentId ? "\u6D3E\u751F\u81EA " + short(e.parentId) : "\u56FA\u5B9A\u534F\u8BAE\u7684\u57FA\u7EBF\u5B9E\u9A8C"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Badge, { value: e.lifecycle })
    ] }),
    data.experiments.filter((c) => c.parentId === e.id).map((c) => tree(c, depth + 1))
  ] }, e.id);
  const measured = comparableRuns(data, selected);
  const metric = comparisonMetric(data, selected);
  const max = Math.max(...measured.map((r) => Math.abs(r.metrics[metric.key])), 1e-6);
  return /* @__PURE__ */ jsxs("div", { className: "page-scroll", children: [
    /* @__PURE__ */ jsx(SectionTitle, { title: "\u5B9E\u9A8C\u4E0E\u8FD0\u884C", sub: "\u5B9E\u9A8C\u8840\u7F18\u3001\u56FA\u5B9A\u534F\u8BAE\u4E0E\u771F\u5B9E\u89C2\u6D4B\uFF0C\u59CB\u7EC8\u5206\u5F00\u8BB0\u5F55\u3002", children: /* @__PURE__ */ jsxs("button", { className: "primary", onClick: onCreate, children: [
      /* @__PURE__ */ jsx(Icon, { name: "plus", size: 16 }),
      "\u65B0\u5EFA\u5B9E\u9A8C"
    ] }) }),
    perform ? /* @__PURE__ */ jsx(RunGrants, { data, perform, busy: !!busy, selectedGrant: selectedRunGrant, onSelect: onSelectRunGrant, onSession, onRun }, data.project.id) : null,
    /* @__PURE__ */ jsxs("div", { className: "section-kpis", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: data.experiments.length.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { children: "\u5B9E\u9A8C\u8282\u70B9" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: data.runs.length.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { children: "\u6B63\u5F0F\u8FD0\u884C" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: data.runs.filter((r) => r.integrity === "complete").length.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { children: "\u5B8C\u6574\u7ED3\u679C" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("strong", { children: data.evidence.length.toString().padStart(2, "0") }),
        /* @__PURE__ */ jsx("span", { children: "\u8BC1\u636E\u8BB0\u5F55" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u5B9E\u9A8C\u8840\u7F18" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u5206\u652F\u4FDD\u5B58\u7814\u7A76\u53D8\u5316\uFF0C\u4E0D\u81EA\u52A8\u5408\u5E76\u5019\u9009" })
      ] }),
      roots.length ? /* @__PURE__ */ jsx("div", { className: "experiment-tree", children: roots.map((e) => tree(e)) }) : /* @__PURE__ */ jsxs(Empty, { title: "\u8FD8\u6CA1\u6709\u5B9E\u9A8C\u8282\u70B9", children: [
        /* @__PURE__ */ jsx("p", { children: "\u4ECE\u9879\u76EE\u6E90\u7801\u5EFA\u7ACB\u57FA\u7EBF\u3002\u65B9\u6848\u53D8\u5316\u540E\uFF0C\u53EF\u4ECE\u9009\u4E2D\u7684\u8282\u70B9\u6D3E\u751F\u3002" }),
        /* @__PURE__ */ jsx("button", { className: "secondary", onClick: onCreate, children: "\u521B\u5EFA\u57FA\u7EBF\u5B9E\u9A8C" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u8FD0\u884C\u8BB0\u5F55" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u9000\u51FA\u6210\u529F \u2260 \u5047\u8BBE\u6210\u7ACB" })
      ] }),
      data.runs.length ? /* @__PURE__ */ jsx("div", { className: "table-wrap", children: /* @__PURE__ */ jsxs("table", { children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "\u5B9E\u9A8C / Run" }),
          /* @__PURE__ */ jsx("th", { children: "\u6267\u884C" }),
          /* @__PURE__ */ jsx("th", { children: "\u5B8C\u6574\u6027" }),
          /* @__PURE__ */ jsx("th", { children: "\u5B9E\u6D4B\u6307\u6807\uFF08\u6309\u8FD0\u884C\u5951\u7EA6\uFF09" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: data.runs.slice().reverse().map((r) => /* @__PURE__ */ jsxs("tr", { onClick: () => onSelect(r.experimentId), className: r.experimentId === selected ? "selected-row" : "", children: [
          /* @__PURE__ */ jsxs("td", { children: [
            /* @__PURE__ */ jsxs("button", { className: "text-button", onClick: (event) => {
              event.stopPropagation();
              if (onRun) onRun(r.id, r.experimentId);
              else onSelect(r.experimentId);
            }, children: [
              data.experiments.find((e) => e.id === r.experimentId)?.title,
              " \xB7 ",
              short(r.id)
            ] }),
            /* @__PURE__ */ jsx("small", { children: date(r.createdAt) })
          ] }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { value: r.state }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Badge, { value: r.integrity }) }),
          /* @__PURE__ */ jsx("td", { className: "numeric", children: Object.entries(r.manifest.contract.metrics).map(([k, m]) => /* @__PURE__ */ jsxs("div", { children: [
            k,
            ": ",
            number(r.metrics?.[k]),
            " ",
            m.unit
          ] }, k)) })
        ] }, r.id)) })
      ] }) }) : /* @__PURE__ */ jsx("div", { className: "inline-empty", children: "\u51C6\u5907\u5FEB\u7167\u5E76\u83B7\u5F97\u6279\u51C6\u540E\uFF0C\u8FD0\u884C\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" })
    ] }),
    measured.length ? /* @__PURE__ */ jsxs("section", { className: "surface", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-heading", children: [
        /* @__PURE__ */ jsx("h2", { children: "\u540C\u534F\u8BAE\u7ED3\u679C\u901F\u89C8" }),
        /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
          metric.key,
          " \xB7 ",
          metric.direction === "max" ? "\u8D8A\u9AD8\u8D8A\u597D" : "\u8D8A\u4F4E\u8D8A\u597D",
          " \xB7 ",
          metric.unit,
          " \xB7 \u540C\u4E00\u5951\u7EA6"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "metric-bars", children: measured.map((r) => /* @__PURE__ */ jsxs("div", { className: "metric-row", children: [
        /* @__PURE__ */ jsx("span", { children: data.experiments.find((e) => e.id === r.experimentId)?.title }),
        /* @__PURE__ */ jsx("div", { className: "metric-track", children: /* @__PURE__ */ jsx("div", { style: { width: Math.max(0.5, Math.abs(r.metrics[metric.key]) / max * 100) + "%" } }) }),
        /* @__PURE__ */ jsx("code", { children: number(r.metrics[metric.key]) })
      ] }, r.id)) }),
      /* @__PURE__ */ jsx("p", { className: "footnote", children: "\u957F\u5EA6\u8868\u793A\u7EDD\u5BF9\u503C\uFF0C\u4EC5\u4F5C\u6570\u503C\u901F\u89C8\uFF1B\u4F18\u52A3\u7531\u6307\u6807\u65B9\u5411\u53CA\u5B8C\u6574\u8BC1\u636E\u5224\u65AD\u3002\u4E0D\u540C\u5951\u7EA6\u4E0D\u6DF7\u6BD4\uFF0C\u6267\u884C\u6210\u529F\u4E0D\u7B49\u4E8E\u5047\u8BBE\u6210\u7ACB\u3002" })
    ] }) : null
  ] });
}
function OutcomeReview({ run, perform }) {
  if (!["succeeded", "failed", "cancelled"].includes(run.state)) return null;
  const disposition = run.answerDisposition ?? (run.metrics ? "answered" : run.state === "cancelled" && !run.startedAt ? "unanswered" : "needs_review");
  if (disposition !== "needs_review") return /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
    "\u95EE\u9898\u56DE\u7B54\u72B6\u6001\uFF1A",
    disposition === "answered" ? "\u5DF2\u6709\u7ED3\u679C\uFF0C\u6E90\u7801\u53D7\u4FDD\u62A4" : "\u7528\u6237\u786E\u8BA4\u672A\u56DE\u7B54\uFF0C\u53EF\u51C6\u5907\u6709\u754C\u4FEE\u590D"
  ] });
  const review = (disposition2) => {
    const reason = prompt("\u5148\u68C0\u67E5\u65E5\u5FD7\u4E0E\u539F\u59CB\u4EA7\u7269\uFF0C\u518D\u8BF4\u660E\u6B64\u6B21\u8FD0\u884C\u662F\u5426\u56DE\u7B54\u7814\u7A76\u95EE\u9898\uFF1A");
    if (reason) void perform(() => api(`/runs/${run.id}/outcome-review`, { expectedVersion: run.version, disposition: disposition2, reason }), "\u5DF2\u4FDD\u5B58\u7ED3\u679C\u8BC4\u8BAE\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u542F\u52A8\u8BA1\u7B97");
  };
  return /* @__PURE__ */ jsxs("div", { className: "approval-card", children: [
    /* @__PURE__ */ jsx("h4", { children: "\u6B64\u6B21\u8FD0\u884C\u662F\u5426\u56DE\u7B54\u7814\u7A76\u95EE\u9898\uFF1F" }),
    /* @__PURE__ */ jsx("p", { className: "small", children: "\u65E0\u6709\u6548\u6570\u503C\u4E0D\u4E00\u5B9A\u8868\u793A\u6CA1\u6709\u7814\u7A76\u7ED3\u679C\u3002\u8BF7\u7ED3\u5408\u5047\u8BBE\u4E0E\u771F\u5B9E\u65E5\u5FD7\u5224\u65AD\uFF1B\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u4FEE\u6539\u6267\u884C\u72B6\u6001\u3001\u4EA7\u7269\u5B8C\u6574\u6027\u6216\u5047\u8BBE\u7ED3\u8BBA\u3002" }),
    /* @__PURE__ */ jsxs("div", { className: "stack-actions", children: [
      /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => review("unanswered"), children: "\u672A\u56DE\u7B54\uFF1A\u5141\u8BB8\u51C6\u5907\u4FEE\u590D" }),
      /* @__PURE__ */ jsx("button", { className: "secondary", onClick: () => review("answered"), children: "\u5DF2\u56DE\u7B54\uFF1A\u51BB\u7ED3\u8282\u70B9" })
    ] })
  ] });
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
        ] }, a.id)) }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5C1A\u65E0\u5F52\u6863\u4EA7\u7269\u3002\u6267\u884C\u7ED3\u675F\u540E\u5728\u8FD9\u91CC\u67E5\u770B\u539F\u59CB metrics.json \u4E0E\u8F93\u51FA\u6587\u4EF6\u3002" }),
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
  currentRun() {
    const runs = this.props.data.runs.filter((r) => r.experimentId === this.props.experiment?.id);
    return this.props.selectedRun ? runs.find((r) => r.id === this.props.selectedRun) : runs[runs.length - 1];
  }
  render() {
    const { data, boot, experiment: e, perform } = this.props;
    const teams = data.teams.slice().reverse();
    const team = teams[0];
    const tasks = team ? data.tasks.filter((t) => t.teamId === team.id) : [];
    const budget = data.budgets.find((b) => b.teamId === team?.id);
    const run = this.currentRun();
    const intents = data.intents.filter((i) => i.experimentId === e?.id), intent = intents[intents.length - 1], approval = data.approvals.find((a) => a.id === intent?.approvalId);
    const runGrantRef = intent?.runGrant ?? approval?.runGrant, runGrant = (data.runGrants ?? []).find((g) => g.id === runGrantRef?.id);
    const pendingTeams = data.approvals.filter((a) => a.subjectKind === "team" && a.status === "pending");
    return /* @__PURE__ */ jsxs("aside", { className: "inspector", children: [
      /* @__PURE__ */ jsxs("div", { className: "inspector-title", children: [
        /* @__PURE__ */ jsx(Icon, { name: this.props.tab === "experiments" ? "experiment" : "branch" }),
        /* @__PURE__ */ jsx("h2", { children: this.props.tab === "experiments" ? "\u5B9E\u9A8C\u8BE6\u60C5" : "\u534F\u4F5C\u7A7A\u95F4" }),
        /* @__PURE__ */ jsx("span", { className: "small muted", children: "\u672C\u5730" })
      ] }),
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
          /* @__PURE__ */ jsx("dd", { children: e.contract.runner === "trusted-example" ? "\u53D7\u4FE1\u672C\u5730\u6570\u503C\u793A\u4F8B" : "Docker \xB7 \u56FA\u5B9A\u955C\u50CF\u9694\u79BB\u8FD0\u884C" }),
          /* @__PURE__ */ jsx("dt", { children: "\u6570\u636E\u7248\u672C" }),
          /* @__PURE__ */ jsx("dd", { children: e.contract.datasetVersion })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "stack-actions", children: [
          /* @__PURE__ */ jsxs("button", { className: "primary", onClick: this.props.onPrepare, disabled: !!(intent?.status === "prepared" && approval?.status === "pending" && intent.manifest.experimentRevision === e.revision), children: [
            /* @__PURE__ */ jsx(Icon, { name: "run", size: 15 }),
            "\u51C6\u5907\u8FD0\u884C"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "actions", children: [
            /* @__PURE__ */ jsxs("button", { className: "secondary", onClick: this.props.onChild, children: [
              /* @__PURE__ */ jsx(Icon, { name: "branch", size: 15 }),
              "\u6D3E\u751F\u5B50\u5B9E\u9A8C"
            ] }),
            /* @__PURE__ */ jsx("button", { className: "secondary", onClick: this.props.onConfig, children: "\u67E5\u770B\u914D\u7F6E" })
          ] })
        ] }),
        intent?.status === "prepared" && approval ? /* @__PURE__ */ jsxs("div", { className: "approval-card", children: [
          /* @__PURE__ */ jsx("div", { className: "small-label", children: "\u6B63\u5F0F\u8FD0\u884C\u5BA1\u6279" }),
          /* @__PURE__ */ jsx(Badge, { value: approval.status }),
          /* @__PURE__ */ jsx("p", { children: "\u6B64\u6279\u51C6\u53EA\u6388\u6743\u5F53\u524D\u56FA\u5B9A\u5FEB\u7167\u4E0E\u8BA1\u7B97\u5951\u7EA6\u3002" }),
          runGrantRef ? /* @__PURE__ */ jsxs("p", { className: "notice-inline", children: [
            "\u7ED1\u5B9A RunGrant ",
            short(runGrantRef.id),
            " \xB7 ",
            runGrant?.effectiveState ?? "\u7B49\u5F85\u6838\u9A8C",
            "\uFF1B\u4E0D\u80FD\u6539\u7528\u72EC\u7ACB\u5355\u6B21\u6279\u51C6\u3002"
          ] }) : null,
          /* @__PURE__ */ jsxs("code", { className: "digest", children: [
            intent.manifest.snapshotDigest.slice(0, 20),
            "\u2026"
          ] }),
          /* @__PURE__ */ jsxs("dl", { className: "details", children: [
            /* @__PURE__ */ jsx("dt", { children: "\u6267\u884C\u53C2\u6570" }),
            /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: JSON.stringify(intent.manifest.contract.command) }) }),
            /* @__PURE__ */ jsx("dt", { children: "\u955C\u50CF" }),
            /* @__PURE__ */ jsx("dd", { children: /* @__PURE__ */ jsx("code", { children: intent.manifest.contract.image ?? "\u53D7\u4FE1\u793A\u4F8B" }) }),
            /* @__PURE__ */ jsx("dt", { children: "\u8D44\u6E90" }),
            /* @__PURE__ */ jsxs("dd", { children: [
              intent.manifest.contract.cpus,
              " CPU \xB7 ",
              intent.manifest.contract.memoryMb,
              " MiB \xB7 ",
              intent.manifest.contract.timeoutSeconds,
              " \u79D2"
            ] }),
            /* @__PURE__ */ jsx("dt", { children: "\u5FC5\u9700\u4EA7\u7269" }),
            /* @__PURE__ */ jsx("dd", { children: intent.manifest.contract.expectedArtifacts.join("\u3001") })
          ] }),
          approval.status === "pending" && !runGrantRef ? /* @__PURE__ */ jsxs("div", { className: "stack-actions", children: [
            /* @__PURE__ */ jsx("button", { className: "primary", onClick: () => perform(async () => {
              await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true });
              const submitted = await api(`/run-intents/${intent.id}/submit`, {});
              this.props.onRun?.(submitted.id);
            }, "\u5DF2\u63D0\u4EA4\u771F\u5B9E\u8FD0\u884C"), children: "\u6279\u51C6\u5E76\u63D0\u4EA4" }),
            /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false }), "\u5DF2\u62D2\u7EDD\u8FD0\u884C"), children: "\u62D2\u7EDD" })
          ] }) : approval.status === "approved" ? /* @__PURE__ */ jsx("button", { className: "primary", disabled: !!runGrantRef && !runGrantUsable(runGrant), onClick: () => perform(async () => {
            const submitted = await api(`/run-intents/${intent.id}/submit`, {});
            this.props.onRun?.(submitted.id);
          }), children: runGrantRef ? "\u63D0\u4EA4\u6388\u6743\u5185\u56FA\u5B9A\u8FD0\u884C\uFF08\u8BA1\u4E00\u6B21\uFF09" : "\u63D0\u4EA4\u5DF2\u6279\u51C6\u8FD0\u884C" }) : null
        ] }) : null,
        this.props.selectedRun && !run ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u6307\u5B9A Run \u4E0D\u5C5E\u4E8E\u5F53\u524D\u5B9E\u9A8C\u6216\u5DF2\u4E0D\u53EF\u7528\uFF0C\u672A\u663E\u793A\u5176\u4ED6\u8FD0\u884C\u3002" }) : null,
        run ? /* @__PURE__ */ jsxs("div", { className: "run-detail", children: [
          /* @__PURE__ */ jsxs("label", { children: [
            "\u67E5\u770B\u8FD0\u884C",
            /* @__PURE__ */ jsx("select", { "aria-label": "\u67E5\u770B\u8FD0\u884C", value: run.id, onChange: (event) => this.props.onRun?.(event.target.value), children: data.runs.filter((r) => r.experimentId === e.id).slice().reverse().map((r) => /* @__PURE__ */ jsxs("option", { value: r.id, children: [
              date(r.createdAt),
              " \xB7 ",
              short(r.id),
              " \xB7 ",
              label(r.state)
            ] }, r.id)) })
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
            /* @__PURE__ */ jsx("dd", { className: "numeric", children: number(v) })
          ] }, k)) }) : null,
          ["queued", "submitting", "running", "cancelling", "unknown"].includes(run.state) ? /* @__PURE__ */ jsx(ComputeWait, { data, kind: "run", id: run.id, onScheduler: this.props.onScheduler }) : null,
          /* @__PURE__ */ jsx(OutcomeReview, { run, perform }),
          /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
            "\u79D1\u7814\u5224\u65AD\uFF1A",
            run.judgment === "pending" ? "\u5C1A\u672A\u5224\u5B9A" : run.judgment
          ] }),
          run.error ? /* @__PURE__ */ jsx("p", { className: "error-text", children: run.error }) : null,
          ["queued", "running", "submitting"].includes(run.state) ? /* @__PURE__ */ jsx("button", { className: "danger-outline", onClick: () => perform(() => api(`/runs/${run.id}/cancel`, {}), "\u5DF2\u8BF7\u6C42\u53D6\u6D88\u6307\u5B9A\u5B9E\u9A8C"), children: "\u53D6\u6D88\u8FD9\u4E2A\u5B9E\u9A8C" }) : null,
          /* @__PURE__ */ jsx(RunFiles, { run, data, perform }, run.id)
        ] }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsxs("div", { className: "toggle-heading", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { children: "\u591A\u667A\u80FD\u4F53\u534F\u4F5C" }),
            /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6309\u9700\u5206\u5DE5\uFF0C\u72EC\u7ACB\u9A8C\u6536" })
          ] }),
          /* @__PURE__ */ jsx("button", { role: "switch", "aria-label": "\u591A\u667A\u80FD\u4F53\u534F\u4F5C", "aria-checked": data.project.settings.enabled ? "true" : "false", className: "switch " + (data.project.settings.enabled ? "on" : ""), onClick: this.props.onToggle, children: /* @__PURE__ */ jsx("span", {}) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5F00\u542F\u53EA\u5141\u8BB8\u59D4\u6D3E\uFF0C\u4E0D\u6269\u5927\u8BA1\u7B97\u3001\u5408\u5E76\u6216\u53D1\u5E03\u6743\u9650\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "limits", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "\u9879\u76EE\u52A9\u624B\u4E0A\u9650 ",
            /* @__PURE__ */ jsx("b", { children: data.project.settings.maxConcurrentAssistants })
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "\u5171\u4EAB\u6B63\u5F0F Run \u4E0A\u9650 ",
            /* @__PURE__ */ jsx("b", { children: data.compute?.configuration.limits.maxRuns ?? "\u5F85\u52A0\u8F7D" })
          ] })
        ] }),
        data.agentCapacity ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u5BBF\u4E3B Worker ",
          data.agentCapacity.counts.held,
          "/",
          data.agentCapacity.maxWorkers,
          " \xB7 \u5BBF\u4E3B\u53EF\u7528 ",
          data.agentCapacity.available,
          " \xB7 \u672A\u77E5\u4FDD\u7559 ",
          data.agentCapacity.counts.unknown,
          " \xB7 \u672C\u9879\u76EE\u53EF\u7528 ",
          data.agentCapacity.project?.available ?? "\u5F85\u6838\u5BF9",
          "\u3002"
        ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u5BBF\u4E3B Worker \u5BB9\u91CF\u5F85\u52A0\u8F7D\u3002" }),
        data.modelHttp ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u6A21\u578B HTTP \u8BF7\u6C42 ",
          data.modelHttp.counts.active,
          "/",
          data.modelHttp.configuration.maxRequests,
          " \xB7 \u6392\u961F ",
          data.modelHttp.counts.queued,
          " \xB7 \u672A\u77E5\u4FDD\u7559 ",
          data.modelHttp.counts.unknown,
          " \xB7 \u53EF\u6D3E\u53D1 ",
          data.modelHttp.available,
          "\u3002Worker \u4E0E\u8BF7\u6C42\u5206\u522B\u8BA1\u91CF\u3002"
        ] }) : /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6A21\u578B HTTP \u8BF7\u6C42\u72B6\u6001\u5F85\u52A0\u8F7D\u3002" }),
        this.props.onScheduler ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: this.props.onScheduler, children: "\u67E5\u770B\u8D44\u6E90\u4E0E\u8C03\u5EA6" }) : null,
        /* @__PURE__ */ jsxs("button", { className: "secondary full", onClick: this.props.onTeam, disabled: !data.project.settings.enabled, children: [
          /* @__PURE__ */ jsx(Icon, { name: "plus", size: 15 }),
          "\u521B\u5EFA\u534F\u4F5C\u8BA1\u5212"
        ] })
      ] }),
      pendingTeams.map((a) => /* @__PURE__ */ jsxs("div", { className: "inspector-section", children: [
        /* @__PURE__ */ jsx("div", { className: "small-label", children: "\u5F85\u6279\u51C6\u7684\u534F\u4F5C\u8BA1\u5212" }),
        /* @__PURE__ */ jsx("h3", { children: data.teams.find((t) => t.id === a.subjectId)?.goal }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: a.reason }),
        /* @__PURE__ */ jsx("button", { className: "primary full", onClick: () => perform(async () => {
          await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true });
          await api(`/teams/${a.subjectId}/activate`, {});
        }, "\u534F\u4F5C\u8BA1\u5212\u5DF2\u6279\u51C6"), children: "\u6279\u51C6\u5E76\u542F\u52A8\u534F\u4F5C" }),
        /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false })), children: "\u62D2\u7EDD\u6B64\u8BA1\u5212" })
      ] }, a.id)),
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
          ["running", "pending"].includes(t.execution) ? /* @__PURE__ */ jsx("button", { className: "text-button danger", onClick: () => perform(() => api(`/tasks/${t.id}/cancel`, {})), children: "\u505C\u6B62\u6B64\u52A9\u624B" }) : null,
          ["failed", "cancelled", "blocked"].includes(t.execution) ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => perform(() => api(`/tasks/${t.id}/retry`, {})), children: "\u65B0\u5C1D\u8BD5\u91CD\u8BD5" }) : null,
          t.result ? /* @__PURE__ */ jsxs("details", { children: [
            /* @__PURE__ */ jsx("summary", { children: "\u7ED3\u679C\u4E0E\u9650\u5236" }),
            t.role === "reviewer" ? /* @__PURE__ */ jsxs("p", { className: "small", role: "status", children: [
              "\u5BA1\u67E5\u610F\u89C1\uFF1A",
              t.result.verdict === "accept" ? "\u63A5\u53D7" : t.result.verdict === "reject" ? "\u62D2\u7EDD" : t.result.verdict === "disputed" ? "\u5B58\u5728\u4E89\u8BAE" : "\u672A\u63D0\u4F9B\uFF1B\u4E0D\u80FD\u89C6\u4E3A\u901A\u8FC7",
              "\uFF08\u72EC\u7ACB\u4E8E\u4EFB\u52A1\u9A8C\u6536\u72B6\u6001\uFF09"
            ] }) : null,
            /* @__PURE__ */ jsx("p", { className: "small prose-text", children: t.result.summary })
          ] }) : null,
          t.execution === "output_submitted" && ["pending", "rejected", "disputed"].includes(t.acceptance) ? /* @__PURE__ */ jsx("button", { className: "text-button", onClick: () => {
            const reason = prompt("\u4EBA\u5DE5\u5BA1\u67E5\u4F9D\u636E\uFF08\u5C06\u4FDD\u7559\u8BB0\u5F55\uFF09");
            if (reason)
              perform(() => api(`/tasks/${t.id}/manual-review`, { verdict: "accepted", reason }));
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
          team.state === "active" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => api(`/teams/${team.id}/pause`, {})), children: "\u6682\u505C\u5206\u914D" }) : null,
          team.state === "paused" ? /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => perform(() => api(`/teams/${team.id}/resume`, {})), children: "\u6062\u590D" }) : null,
          /* @__PURE__ */ jsx("button", { className: "secondary compact", onClick: () => this.props.onDirective(team.id), children: "\u5F15\u5BFC / \u6539\u53D8\u76EE\u6807" })
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "inspector-section muted small", children: "\u534F\u4F5C\u8BA1\u5212\u3001\u52A9\u624B\u72B6\u6001\u4E0E\u5BA1\u67E5\u7ED3\u679C\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002\u4E0D\u4F1A\u4E3A\u5C55\u793A\u6548\u679C\u81EA\u52A8\u521B\u5EFA Agent\u3002" }),
      /* @__PURE__ */ jsxs("div", { className: "inspector-footer", children: [
        /* @__PURE__ */ jsx("span", { className: "status-dot" }),
        "\u6240\u6709\u7ED3\u679C\u5199\u5165\u672C\u5730\u6570\u636E\u5E93"
      ] })
    ] });
  }
}
export {
  Chat,
  Experiments,
  Inspector,
  OutcomeReview
};
