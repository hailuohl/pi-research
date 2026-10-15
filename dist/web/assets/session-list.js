import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon, nativeSelectButton } from "./ui.js";
const roles = { all: "\u5168\u90E8\u89D2\u8272", coordinator: "\u4E3B\u534F\u8C03\u8005", literature: "\u6587\u732E", designer: "\u8BBE\u8BA1", implementer: "\u5B9E\u73B0", analyst: "\u5206\u6790", reviewer: "\u5BA1\u67E5", writer: "\u5199\u4F5C" };
const filters = { active: "\u6D3B\u8DC3", archived: "\u5DF2\u5F52\u6863", all: "\u5168\u90E8" };
class SessionList extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { draft: "", query: "", role: "coordinator", stateFilter: "active", page: null, cursors: [void 0], index: 0, busy: false, error: "" };
    this.generation = 0;
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
  }
  componentDidMount() {
    void this.load();
  }
  componentDidUpdate(previous) {
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
    const items = (page?.items ?? []).map((item) => item.id === selectedId && selected?.id === item.id && selected.version >= item.version ? { ...item, title: selected.title } : item);
    const selectedMatchesFilter = selected && (stateFilter === "all" || (stateFilter === "archived" ? selected.state === "archived" : selected.state !== "archived"));
    const selectedOutside = selectedMatchesFilter && selectedId && !items.some((item) => item.id === selectedId);
    const row = (item) => /* @__PURE__ */ jsxs("button", { className: item.id === selectedId ? "selected-session" : "", "aria-current": item.id === selectedId ? "page" : void 0, title: item.title, onClick: () => onSelect(item.id), children: [
      /* @__PURE__ */ jsx(Icon, { name: item.state === "archived" ? "archive" : "chat", size: 16 }),
      /* @__PURE__ */ jsx("span", { className: "session-label", children: item.title }),
      item.state === "archived" ? /* @__PURE__ */ jsx("span", { className: "session-state-pill", children: "\u5DF2\u5F52\u6863" }) : item.state === "running" ? /* @__PURE__ */ jsx("span", { className: "session-state-pill s-running", children: "\u8FD0\u884C\u4E2D" }) : null
    ] }, item.id);
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
