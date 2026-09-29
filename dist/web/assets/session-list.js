import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
const roles = { all: "\u5168\u90E8\u89D2\u8272", coordinator: "\u4E3B\u534F\u8C03\u8005", literature: "\u6587\u732E", designer: "\u8BBE\u8BA1", implementer: "\u5B9E\u73B0", analyst: "\u5206\u6790", reviewer: "\u5BA1\u67E5", writer: "\u5199\u4F5C" };
class SessionList extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { draft: "", query: "", role: "coordinator", page: null, cursors: [void 0], index: 0, busy: false, error: "" };
    this.generation = 0;
    this.search = (event) => {
      event.preventDefault();
      this.setState({ query: this.state.draft.trim(), cursors: [void 0], index: 0, page: null }, () => void this.load());
    };
    this.changeRole = (role) => this.setState({ role, cursors: [void 0], index: 0, page: null }, () => void this.load());
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
      this.setState({ draft: "", query: "", role: "coordinator", page: null, cursors: [void 0], index: 0, error: "" }, () => void this.load());
    } else if (previous.selectedId !== this.props.selectedId && this.state.index === 0 && !this.state.query) void this.load();
  }
  componentWillUnmount() {
    this.generation++;
  }
  async load(cursor = this.state.cursors[this.state.index], query = this.state.query, role = this.state.role) {
    if (!this.props.projectId) return;
    const generation = ++this.generation, projectId = this.props.projectId;
    this.setState({ busy: true, error: "" });
    try {
      const page = await api("/operations/session_list", { projectId, input: { query, role, limit: 10, ...cursor ? { beforeSessionId: cursor } : {} } });
      if (generation === this.generation && projectId === this.props.projectId) this.setState({ page, busy: false });
    } catch (error) {
      if (generation === this.generation) this.setState({ busy: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    const { selectedId, selected, onSelect, onNew } = this.props, { page, busy, error, index } = this.state;
    const items = page?.items ?? [];
    const selectedOutside = selected && selectedId && !items.some((item) => item.id === selectedId);
    const row = (item) => /* @__PURE__ */ jsxs("button", { className: item.id === selectedId ? "selected-session" : "", onClick: () => onSelect(item.id), children: [
      /* @__PURE__ */ jsx("span", { className: "session-dot " + (item.state === "running" ? "live" : "") }),
      /* @__PURE__ */ jsx("span", { children: item.title })
    ] }, item.id);
    return /* @__PURE__ */ jsxs("div", { className: "sidebar-sessions", children: [
      /* @__PURE__ */ jsxs("div", { className: "sidebar-caption", children: [
        "\u4F1A\u8BDD",
        /* @__PURE__ */ jsx("button", { "aria-label": "\u65B0\u5EFA\u4F1A\u8BDD", title: "\u65B0\u5EFA\u4F1A\u8BDD", className: "icon-button", disabled: !this.props.projectId, onClick: onNew, children: "\uFF0B" })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "session-search", onSubmit: this.search, children: [
        /* @__PURE__ */ jsx("input", { "aria-label": "\u641C\u7D22\u4F1A\u8BDD", placeholder: "\u641C\u7D22\u4F1A\u8BDD", value: this.state.draft, onChange: (event) => this.setState({ draft: event.target.value }) }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: busy, children: "\u641C\u7D22" })
      ] }),
      /* @__PURE__ */ jsx("select", { className: "session-role", "aria-label": "\u4F1A\u8BDD\u89D2\u8272", value: this.state.role, onChange: (event) => this.changeRole(event.target.value), children: Object.entries(roles).map(([value, name]) => /* @__PURE__ */ jsx("option", { value, children: name }, value)) }),
      selectedOutside ? row(selected) : null,
      items.map(row),
      error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "small error-text", children: error }) : null,
      !busy && page && items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD" }) : null,
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
