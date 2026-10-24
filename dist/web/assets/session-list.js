import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon, Modal, nativeSelectButton } from "./ui.js";
const actionLabels = { archive: "\u5F52\u6863\u4F1A\u8BDD", unarchive: "\u53D6\u6D88\u5F52\u6863\u4F1A\u8BDD", delete: "\u5220\u9664\u4F1A\u8BDD" };
const roles = { all: "\u5168\u90E8\u89D2\u8272", coordinator: "\u4E3B\u534F\u8C03\u8005", literature: "\u6587\u732E", designer: "\u8BBE\u8BA1", implementer: "\u5B9E\u73B0", analyst: "\u5206\u6790", reviewer: "\u5BA1\u67E5", writer: "\u5199\u4F5C" };
const filters = { active: "\u6D3B\u8DC3", archived: "\u5DF2\u5F52\u6863", all: "\u5168\u90E8" };
class SessionList extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { draft: "", query: "", role: "coordinator", stateFilter: "active", page: null, cursors: [void 0], index: 0, busy: false, error: "", target: null, confirmTitle: "", actionBusy: false, actionError: "" };
    this.generation = 0;
    this.lifecycleEpoch = 0;
    this.submitting = false;
    this.search = (event) => {
      event.preventDefault();
      this.generation++;
      this.setState({ query: this.state.draft.trim(), cursors: [void 0], index: 0, page: null }, () => void this.load());
    };
    this.changeRole = (role) => {
      this.generation++;
      this.setState({ role, cursors: [void 0], index: 0, page: null }, () => void this.load());
    };
    this.changeStateFilter = (stateFilter) => {
      if (stateFilter === this.state.stateFilter) return;
      this.generation++;
      this.setState({ stateFilter, cursors: [void 0], index: 0, page: null }, () => void this.load(void 0, this.state.query, this.state.role, stateFilter));
    };
    this.next = () => {
      const cursor = this.state.page?.nextCursor;
      if (!cursor) return;
      const cursors = [...this.state.cursors.slice(0, this.state.index + 1), cursor];
      this.setState({ cursors, index: this.state.index + 1 }, () => void this.load());
    };
    this.previous = () => {
      if (this.state.index === 0) return;
      this.setState({ index: this.state.index - 1 }, () => void this.load());
    };
    this.openAction = (item, action) => {
      if (this.submitting) return;
      this.setState({ target: { projectId: this.props.projectId, selectedId: this.props.selectedId, id: item.id, version: item.version, title: item.title, action, key: crypto.randomUUID() }, confirmTitle: "", actionError: "" });
    };
    this.submitAction = async () => {
      const target = this.state.target;
      if (!target || this.submitting || this.props.projectArchived || this.props.busy || target.action === "delete" && this.state.confirmTitle !== target.title) return;
      const epoch = this.lifecycleEpoch, current = () => epoch === this.lifecycleEpoch && this.state.target === target && this.props.projectId === target.projectId && this.props.selectedId === target.selectedId;
      this.submitting = true;
      this.setState({ actionBusy: true, actionError: "" });
      try {
        const result = await api(`/sessions/${encodeURIComponent(target.id)}/${target.action}`, { expectedVersion: target.version, ...target.action === "delete" ? { confirmTitle: target.title } : {} }, "POST", void 0, target.key);
        if (!current()) return;
        if (result.id !== target.id || result.projectId !== target.projectId || !Number.isInteger(result.version) || result.version <= target.version || result.state !== (target.action === "unarchive" ? "idle" : "archived") || (target.action === "delete" ? !result.deletedAt : !!result.deletedAt)) throw Error("\u4F1A\u8BDD\u56DE\u6267\u4E0E\u786E\u8BA4\u76EE\u6807\u4E0D\u4E00\u81F4");
        this.props.onChanged?.(result, target.action);
        if (!current()) return;
        this.setState({ target: null, actionBusy: false, page: null, cursors: [void 0], index: 0 }, () => void this.load());
      } catch (error) {
        if (current()) this.setState({ actionError: error instanceof Error ? error.message : String(error) });
      } finally {
        if (epoch === this.lifecycleEpoch) {
          this.submitting = false;
          this.setState({ actionBusy: false });
        }
      }
    };
  }
  componentDidMount() {
    void this.load();
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId || previous.selectedId !== this.props.selectedId) {
      this.lifecycleEpoch++;
      this.submitting = false;
      this.setState({ target: null, actionBusy: false, actionError: "", confirmTitle: "" });
    }
    if (previous.projectId !== this.props.projectId) {
      this.generation++;
      this.setState({ draft: "", query: "", role: "coordinator", stateFilter: "active", page: null, cursors: [void 0], index: 0, error: "" }, () => void this.load());
    } else if (previous.creationSignal !== this.props.creationSignal) {
      this.generation++;
      this.setState({ stateFilter: "active", page: null, cursors: [void 0], index: 0 }, () => void this.load(void 0, this.state.query, this.state.role, "active"));
    } else if (previous.selectedId !== this.props.selectedId && this.state.index === 0 && !this.state.query || previous.selectedId === this.props.selectedId && (previous.selected?.title !== this.props.selected?.title || previous.selected?.state !== this.props.selected?.state)) void this.load();
  }
  componentWillUnmount() {
    this.generation++;
    this.lifecycleEpoch++;
  }
  async load(cursor = this.state.cursors[this.state.index], query = this.state.query, role = this.state.role, stateFilter = this.state.stateFilter) {
    if (!this.props.projectId) return;
    const generation = ++this.generation, projectId = this.props.projectId;
    this.setState({ busy: true, error: "" });
    try {
      const page = await api("/operations/session_list", { projectId, input: { query, role, stateFilter, limit: 10, ...cursor ? { beforeSessionId: cursor } : {} } });
      if (generation === this.generation && projectId === this.props.projectId) this.setState({ page, busy: false });
    } catch (error) {
      if (generation === this.generation) this.setState({ busy: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    const { selectedId, selected, onSelect } = this.props, { page, busy, error, index, stateFilter } = this.state;
    const items = (page?.items ?? []).filter((item) => !("deletedAt" in item && item.deletedAt)).map((item) => item.id === selectedId && selected?.id === item.id && selected.version >= item.version ? { ...item, title: selected.title, state: selected.state, version: selected.version } : item);
    const selectedMatchesFilter = selected && !selected.deletedAt && (stateFilter === "all" || (stateFilter === "archived" ? selected.state === "archived" : selected.state !== "archived"));
    const selectedOutside = selectedMatchesFilter && selectedId && !items.some((item) => item.id === selectedId);
    const row = (item) => {
      const disabled = this.props.busy || this.props.projectArchived || this.state.actionBusy || item.state === "running" || !!item.taskId;
      return /* @__PURE__ */ jsxs("div", { className: "session-list-row", children: [
        /* @__PURE__ */ jsxs("button", { className: item.id === selectedId ? "selected-session" : "", "aria-current": item.id === selectedId ? "page" : void 0, title: item.title, onClick: () => onSelect(item.id), children: [
          /* @__PURE__ */ jsx(Icon, { name: item.state === "archived" ? "archive" : "chat", size: 16 }),
          /* @__PURE__ */ jsx("span", { className: "session-label", children: item.title }),
          item.state === "archived" ? /* @__PURE__ */ jsx("span", { className: "session-state-pill", children: "\u5DF2\u5F52\u6863" }) : item.state === "running" ? /* @__PURE__ */ jsx("span", { className: "session-state-pill s-running", children: "\u8FD0\u884C\u4E2D" }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "session-row-actions", children: [
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `${item.state === "archived" ? "\u53D6\u6D88\u5F52\u6863" : "\u5F52\u6863"}\u4F1A\u8BDD\uFF1A${item.title}`, title: item.state === "archived" ? "\u53D6\u6D88\u5F52\u6863" : "\u5F52\u6863", disabled, onClick: () => this.openAction(item, item.state === "archived" ? "unarchive" : "archive"), children: /* @__PURE__ */ jsx(Icon, { name: "archive", size: 14 }) }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": `\u5220\u9664\u4F1A\u8BDD\uFF1A${item.title}`, title: "\u5220\u9664\u4F1A\u8BDD", disabled, onClick: () => this.openAction(item, "delete"), children: /* @__PURE__ */ jsx(Icon, { name: "close", size: 14 }) })
        ] })
      ] }, item.id);
    };
    return /* @__PURE__ */ jsxs("div", { className: "sidebar-sessions", children: [
      /* @__PURE__ */ jsxs("div", { className: "sidebar-caption", children: [
        /* @__PURE__ */ jsx("span", { children: "\u4F1A\u8BDD" }),
        /* @__PURE__ */ jsxs("label", { className: "session-state-filter", children: [
          /* @__PURE__ */ jsx(Icon, { name: "filter", size: 14 }),
          /* @__PURE__ */ jsxs("select", { "aria-label": "\u4F1A\u8BDD\u5206\u7C7B", value: stateFilter, disabled: !this.props.projectId || this.props.busy, onChange: (event) => this.changeStateFilter(event.target.value), children: [
            nativeSelectButton,
            Object.entries(filters).map(([value, name]) => /* @__PURE__ */ jsx("option", { value, children: name }, value))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("details", { className: "session-filters", children: [
        /* @__PURE__ */ jsxs("summary", { children: [
          "\u67E5\u627E\u4E0E\u7B5B\u9009",
          this.state.query ? " \xB7 \u5DF2\u7B5B\u9009" : ""
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "session-search", onSubmit: this.search, children: [
          /* @__PURE__ */ jsx("input", { "aria-label": "\u641C\u7D22\u4F1A\u8BDD", placeholder: "\u641C\u7D22\u4F1A\u8BDD", value: this.state.draft, onChange: (event) => this.setState({ draft: event.target.value }) }),
          /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, children: "\u641C\u7D22" })
        ] }),
        /* @__PURE__ */ jsxs("select", { className: "session-role", "aria-label": "\u4F1A\u8BDD\u89D2\u8272", value: this.state.role, onChange: (event) => this.changeRole(event.target.value), children: [
          nativeSelectButton,
          Object.entries(roles).map(([value, name]) => /* @__PURE__ */ jsx("option", { value, children: name }, value))
        ] })
      ] }),
      selectedOutside ? row(selected) : null,
      items.map(row),
      error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "small error-text", children: error }) : null,
      !busy && page && items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "small muted", children: this.state.query ? "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD" : stateFilter === "active" ? "\u6682\u65E0\u6D3B\u8DC3\u4F1A\u8BDD" : stateFilter === "archived" ? "\u6682\u65E0\u5DF2\u5F52\u6863\u4F1A\u8BDD" : "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD" }) : null,
      this.state.target ? /* @__PURE__ */ jsxs(Modal, { title: actionLabels[this.state.target.action], submitLabel: actionLabels[this.state.target.action], busy: this.state.actionBusy, closeDisabled: this.state.actionBusy, submitDisabled: this.props.projectArchived || this.props.busy || this.state.target.action === "delete" && this.state.confirmTitle !== this.state.target.title, onClose: () => {
        if (!this.submitting) this.setState({ target: null });
      }, onSubmit: this.submitAction, children: [
        /* @__PURE__ */ jsx("p", { children: this.state.target.title }),
        /* @__PURE__ */ jsx("p", { className: "muted", children: this.state.target.action === "delete" ? "\u5220\u9664\u540E\u4E0D\u4F1A\u51FA\u73B0\u5728\u4F1A\u8BDD\u76EE\u5F55\u4E2D\uFF0C\u4E0D\u80FD\u53D6\u6D88\u5220\u9664\u3002\u6D88\u606F\u3001\u6587\u4EF6\u3001\u5206\u652F\u548C\u79D1\u7814\u8BB0\u5F55\u4FDD\u7559\u3002\u8BF7\u8F93\u5165\u5B8C\u6574\u4F1A\u8BDD\u6807\u9898\u786E\u8BA4\u3002" : this.state.target.action === "archive" ? "\u5F52\u6863\u540E\u53EF\u4ECE\u5DF2\u5F52\u6863\u5206\u7C7B\u67E5\u770B\u548C\u53D6\u6D88\u5F52\u6863\u3002\u672A\u5F00\u59CB\u7684\u961F\u5217\u4E0E\u65E7\u6267\u884C\u6743\u9650\u5C06\u5931\u6548\u3002" : "\u53D6\u6D88\u5F52\u6863\u540E\u56DE\u5230\u7A7A\u95F2\u72B6\u6001\uFF0C\u65E7\u961F\u5217\u548C\u65E7\u6267\u884C\u6743\u9650\u4E0D\u4F1A\u6062\u590D\u3002" }),
        this.state.target.action === "delete" ? /* @__PURE__ */ jsxs("label", { children: [
          "\u786E\u8BA4\u4F1A\u8BDD\u6807\u9898",
          /* @__PURE__ */ jsx("input", { "aria-label": "\u786E\u8BA4\u4F1A\u8BDD\u6807\u9898", value: this.state.confirmTitle, disabled: this.state.actionBusy, onChange: (event) => this.setState({ confirmTitle: event.target.value }) })
        ] }) : null,
        this.state.actionError ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: this.state.actionError }) : null
      ] }) : null,
      /* @__PURE__ */ jsxs("div", { className: "session-pages", children: [
        /* @__PURE__ */ jsx("button", { type: "button", disabled: busy || index === 0, onClick: this.previous, children: "\u4E0A\u4E00\u9875" }),
        /* @__PURE__ */ jsx("span", { children: index + 1 }),
        /* @__PURE__ */ jsx("button", { type: "button", disabled: busy || !page?.nextCursor, onClick: this.next, children: "\u4E0B\u4E00\u9875" })
      ] })
    ] });
  }
}
export {
  SessionList
};
