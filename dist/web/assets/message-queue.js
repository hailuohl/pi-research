import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon } from "./ui.js";
const PAGE_LIMIT = 20, READ_LIMIT = 64e3, MAX_CONTENT = 32e3;
const signature = (p) => JSON.stringify([p.total, p.nextCursor, p.canSteer, p.messages.map((m) => [m.id, m.version, m.status, m.contentBytes])]);
const isQueuedUser = (m) => m.role === "user" && m.status === "queued" && m.origin !== "automation";
class MessageQueue extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { items: this.props.messages.filter(isQueuedUser), total: this.props.total, nextCursor: this.props.nextCursor, canSteer: this.props.canSteer, pageStarts: [null], pageIndex: 0, loading: false, error: "", readingId: "", editingId: "", editingMessage: null, editVersion: 0, draft: "", actionBusy: false, steerRequested: [] };
    this.pageGeneration = 0;
    this.readGeneration = 0;
    this.suppressParentReload = false;
    this.closeEdit = () => this.setState({ editingId: "", editingMessage: null, editVersion: 0, draft: "", error: "" });
    this.mounted = true;
  }
  componentDidUpdate(previous) {
    if (signature(previous) === signature(this.props)) return;
    if (this.state.pageIndex === 0) this.setState({ items: this.props.messages.filter(isQueuedUser), total: this.props.total, nextCursor: this.props.nextCursor, canSteer: this.props.canSteer, pageStarts: [null] });
    else if (this.suppressParentReload) this.suppressParentReload = false;
    else void this.loadPage(this.state.pageStarts[this.state.pageIndex] ?? null, this.state.pageIndex);
  }
  componentWillUnmount() {
    this.mounted = false;
    this.pageGeneration++;
    this.readGeneration++;
  }
  async loadPage(cursor, index) {
    const generation = ++this.pageGeneration, { projectId, sessionId } = this.props;
    this.setState({ loading: true, error: "" });
    try {
      const query = new URLSearchParams({ limit: String(PAGE_LIMIT), ...cursor ? { afterMessageId: cursor } : {} });
      const page = await api(`/sessions/${sessionId}/queue?${query}`, void 0, "GET");
      if (!Array.isArray(page.items) || page.items.length > PAGE_LIMIT || !Number.isSafeInteger(page.total) || page.total < page.items.length || typeof page.canSteer !== "boolean" || page.items.some((m) => m.sessionId !== sessionId || m.projectId !== projectId || !isQueuedUser(m)) || page.nextCursor !== null && typeof page.nextCursor !== "string" || page.nextCursor !== null && page.items[page.items.length - 1]?.id !== page.nextCursor)
        throw Error("\u961F\u5217\u54CD\u5E94\u4E0E\u5F53\u524D\u4F1A\u8BDD\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
      if (generation !== this.pageGeneration || projectId !== this.props.projectId || sessionId !== this.props.sessionId) return;
      if (index > 0 && !page.items.length) {
        this.setState({ items: this.props.messages.filter(isQueuedUser), total: this.props.total, nextCursor: this.props.nextCursor, canSteer: this.props.canSteer, pageStarts: [null], pageIndex: 0, loading: false });
        return;
      }
      const starts = this.state.pageStarts.slice(0, index);
      starts[index] = cursor;
      this.setState({ items: page.items, total: page.total, nextCursor: page.nextCursor, canSteer: page.canSteer, pageStarts: starts, pageIndex: index, loading: false });
    } catch (error) {
      if (generation === this.pageGeneration) this.setState({ loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  async readComplete(message) {
    let cursor = 0, total, content = "";
    for (; ; ) {
      const page = await api("/operations/session_message_read", { projectId: this.props.projectId, input: { sessionId: this.props.sessionId, messageId: message.id, cursor, limit: READ_LIMIT, expectedVersion: message.version } });
      const bytes = new TextEncoder().encode(page.content).byteLength;
      if (page.sessionId !== this.props.sessionId || page.messageId !== message.id || page.cursorUnit !== "utf8-byte" || page.version !== message.version || ![page.version, page.cursor, page.end, page.total].every(Number.isSafeInteger) || page.version < 1 || page.cursor < Math.max(0, cursor - 3) || page.cursor > cursor || page.end < page.cursor || page.end > page.total || page.end > page.cursor + READ_LIMIT || page.end <= cursor && !page.complete || page.complete !== (page.end === page.total) || bytes !== page.end - page.cursor || total !== void 0 && total !== page.total)
        throw Error("\u6D88\u606F\u539F\u6587\u54CD\u5E94\u4E0E\u8BF7\u6C42\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u961F\u5217\u540E\u91CD\u8BD5");
      if (page.sourceTruncated) throw Error("\u6570\u636E\u5E93\u4E2D\u7684\u6D88\u606F\u6B63\u6587\u5DF2\u622A\u65AD\uFF0C\u4E0D\u80FD\u5B89\u5168\u7F16\u8F91\uFF1B\u8BF7\u4FDD\u7559\u539F\u6D88\u606F\u3002");
      total = page.total;
      content += page.content;
      if (content.length > MAX_CONTENT) throw Error("\u6D88\u606F\u6B63\u6587\u8D85\u8FC7 32000 \u5B57\u7B26\uFF0C\u4E0D\u80FD\u7F16\u8F91\u3002");
      if (page.complete) return content;
      cursor = page.end;
    }
  }
  async beginEdit(message) {
    const generation = ++this.readGeneration;
    this.setState({ readingId: message.id, error: "" });
    try {
      const content = await this.readComplete(message);
      if (generation === this.readGeneration && message.projectId === this.props.projectId && message.sessionId === this.props.sessionId) this.setState({ readingId: "", editingId: message.id, editingMessage: message, editVersion: message.version, draft: content });
    } catch (error) {
      if (generation === this.readGeneration) this.setState({ readingId: "", error: error instanceof Error ? error.message : String(error) });
    }
  }
  get staleEdit() {
    const current = this.state.items.find((m) => m.id === this.state.editingId);
    return !!this.state.editingId && (!current || current.version !== this.state.editVersion);
  }
  async action(message, action, content) {
    if (this.props.disabled || this.props.busy || this.state.loading || this.state.actionBusy || action === "steer" && (!this.state.canSteer || this.state.steerRequested.includes(message.id)) || action === "edit" && this.staleEdit) return;
    if (action === "edit" && content !== void 0 && (content.length > MAX_CONTENT || !content.trim())) {
      this.setState({ error: !content.trim() ? "\u6D88\u606F\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\u3002" : "\u6D88\u606F\u5185\u5BB9\u6700\u591A 32000 \u5B57\u7B26\u3002" });
      return;
    }
    const index = this.state.pageIndex, cursor = this.state.pageStarts[index] ?? null;
    this.suppressParentReload = true;
    this.setState({ actionBusy: true, error: "" });
    let result, failure = "";
    try {
      result = await this.props.perform(() => api(`/sessions/${this.props.sessionId}/queue`, { messageId: message.id, expectedVersion: action === "edit" ? this.state.editVersion : message.version, action, ...content === void 0 ? {} : { content } }), action === "steer" ? "\u5DF2\u8BF7\u6C42\u7ACB\u5373\u5F15\u5BFC\uFF1B\u5C06\u5728\u5F53\u524D\u4EFB\u52A1\u7684\u4E0B\u4E00\u5DE5\u5177\u6216\u56DE\u5408\u8FB9\u754C\u751F\u6548\uFF0C\u4E0D\u4F1A\u505C\u6B62\u6B63\u5F0F\u8FD0\u884C" : action === "cancel" ? "\u5DF2\u4ECE\u5F85\u53D1\u961F\u5217\u79FB\u51FA" : "\u5DF2\u66F4\u65B0\u6392\u961F\u6D88\u606F");
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    this.suppressParentReload = false;
    if (this.mounted && result && action === "steer" && !this.state.steerRequested.includes(message.id)) this.setState((previous) => ({ steerRequested: [...previous.steerRequested, message.id] }));
    if (this.mounted && result && action === "edit") this.closeEdit();
    if (this.mounted && index > 0 && result) void this.loadPage(cursor, index);
    if (this.mounted) this.setState({ actionBusy: false, error: result ? "" : failure || "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF1B\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u68C0\u67E5\u9875\u9762\u9519\u8BEF\u540E\u91CD\u8BD5\u3002" });
  }
  componentDidMount() {
    this.mounted = true;
  }
  get displayedItems() {
    const items = this.state.items.slice();
    if (this.state.editingMessage && !items.some((m) => m.id === this.state.editingId)) items.push(this.state.editingMessage);
    return items;
  }
  render() {
    if (!this.props.sessionId) return null;
    const { pageIndex, total, nextCursor, loading, error, editingId, draft } = this.state, locked = this.props.disabled || this.props.busy || loading || this.state.actionBusy || !!this.state.readingId;
    const items = this.displayedItems;
    if (!total && !items.length && !editingId && !this.state.readingId && !loading && !error && !this.state.actionBusy) return null;
    return /* @__PURE__ */ jsxs("section", { className: "message-queue", "aria-label": "\u5F85\u53D1\u6D88\u606F\u961F\u5217", children: [
      total > 0 ? /* @__PURE__ */ jsxs("div", { className: "message-queue-heading", children: [
        /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
          "\u6392\u961F\u4E2D \xB7 ",
          total
        ] }),
        pageIndex > 0 ? /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", disabled: locked, onClick: () => this.setState({ items: this.props.messages.filter(isQueuedUser), total: this.props.total, nextCursor: this.props.nextCursor, canSteer: this.props.canSteer, pageStarts: [null], pageIndex: 0, error: "" }), children: "\u961F\u9996" }) : null
      ] }) : null,
      error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text queue-error", children: error }) : null,
      items.length ? /* @__PURE__ */ jsx("ol", { className: "message-queue-list", children: items.map((message) => {
        const editing = editingId === message.id, stale = editing && this.staleEdit, steerRequested = this.state.steerRequested.includes(message.id), rowLocked = locked || !!editingId && !editing;
        return /* @__PURE__ */ jsxs("li", { className: "message-queue-row", children: [
          /* @__PURE__ */ jsxs("div", { className: "message-queue-preview", children: [
            /* @__PURE__ */ jsx("span", { children: message.content || "\uFF08\u7A7A\u6D88\u606F\uFF09" }),
            message.previewTruncated ? /* @__PURE__ */ jsxs("small", { children: [
              "\u9884\u89C8 ",
              message.contentBytes,
              " \u5B57\u8282\u4E2D\u7684\u4E00\u90E8\u5206"
            ] }) : null
          ] }),
          editing ? /* @__PURE__ */ jsxs("div", { className: "message-queue-editor", children: [
            /* @__PURE__ */ jsx("textarea", { "aria-label": "\u7F16\u8F91\u6392\u961F\u6D88\u606F", maxLength: MAX_CONTENT, value: draft, disabled: this.state.actionBusy, onChange: (e) => this.setState({ draft: e.target.value, error: "" }) }),
            stale ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: "\u6D88\u606F\u7248\u672C\u5DF2\u53D8\u5316\u6216\u5DF2\u79BB\u5F00\u961F\u5217\u3002\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u53D6\u6D88\u540E\u91CD\u65B0\u8BFB\u53D6\u3002" }) : null,
            /* @__PURE__ */ jsxs("div", { className: "message-queue-actions", children: [
              /* @__PURE__ */ jsx("button", { type: "button", disabled: locked || stale || !draft.trim(), onClick: () => void this.action(message, "edit", draft), children: "\u4FDD\u5B58" }),
              /* @__PURE__ */ jsx("button", { type: "button", disabled: this.state.actionBusy, onClick: this.closeEdit, children: "\u53D6\u6D88\u7F16\u8F91" })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "message-queue-actions", children: [
            /* @__PURE__ */ jsxs("button", { type: "button", disabled: rowLocked || !this.state.canSteer || steerRequested, className: "queue-now", "aria-label": steerRequested ? "\u5DF2\u8BF7\u6C42\u7ACB\u5373\u5F15\u5BFC" : "\u7ACB\u5373\u5F15\u5BFC", title: !this.state.canSteer ? "\u5F53\u524D\u6CA1\u6709\u53EF\u63A5\u6536\u5F15\u5BFC\u7684\u4EFB\u52A1" : "\u5728\u5F53\u524D\u4EFB\u52A1\u7684\u4E0B\u4E00\u5904\u7406\u8FB9\u754C\u751F\u6548", onClick: () => void this.action(message, "steer"), children: [
              /* @__PURE__ */ jsx(Icon, { name: "arrow", size: 14 }),
              steerRequested ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { children: "\u5DF2\u8BF7\u6C42" }),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: " \xB7 \u7B49\u5F85\u8FB9\u754C" })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { children: "\u7ACB\u5373" }),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u5F15\u5BFC" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", disabled: rowLocked || this.state.readingId === message.id, "aria-label": "\u7F16\u8F91", title: "\u7F16\u8F91\u6392\u961F\u6D88\u606F", className: "queue-icon", onClick: () => void this.beginEdit(message), children: [
              /* @__PURE__ */ jsx(Icon, { name: "edit", size: 15 }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: this.state.readingId === message.id ? "\u8BFB\u53D6\u5168\u6587\u2026" : "\u7F16\u8F91" })
            ] }),
            /* @__PURE__ */ jsxs("button", { type: "button", disabled: rowLocked, "aria-label": "\u5220\u9664", title: "\u5220\u9664\u6392\u961F\u6D88\u606F", className: "queue-icon", onClick: () => void this.action(message, "cancel"), children: [
              /* @__PURE__ */ jsx(Icon, { name: "close", size: 15 }),
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u5220\u9664" })
            ] })
          ] })
        ] }, message.id);
      }) }) : loading ? /* @__PURE__ */ jsx("p", { className: "small muted", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u5F85\u53D1\u6D88\u606F\u2026" }) : null,
      total > PAGE_LIMIT || pageIndex > 0 ? /* @__PURE__ */ jsxs("div", { className: "message-queue-pages", children: [
        /* @__PURE__ */ jsxs("span", { className: "small muted", children: [
          "\u7B2C ",
          pageIndex + 1,
          " \u9875"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", disabled: locked || pageIndex === 0, onClick: () => pageIndex === 1 ? this.setState({ items: this.props.messages.filter(isQueuedUser), total: this.props.total, nextCursor: this.props.nextCursor, canSteer: this.props.canSteer, pageStarts: [null], pageIndex: 0, error: "" }) : void this.loadPage(this.state.pageStarts[pageIndex - 1] ?? null, pageIndex - 1), children: "\u4E0A\u4E00\u9875" }),
        /* @__PURE__ */ jsx("button", { type: "button", disabled: locked || !nextCursor, onClick: () => nextCursor && void this.loadPage(nextCursor, pageIndex + 1), children: "\u4E0B\u4E00\u9875" })
      ] }) : null
    ] });
  }
}
export {
  MessageQueue
};
