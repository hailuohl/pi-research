import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api, downloadArtifact } from "./api.js";
import { date } from "./models.js";
import { Badge, Icon } from "./ui.js";
const READ_LIMIT = 16e3;
class SessionHistory extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { messageId: "", page: null, busy: false, error: "" };
    this.generation = 0;
    this.close = () => {
      this.generation++;
      this.setState({ messageId: "", page: null, busy: false, error: "" });
    };
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId || previous.sessionId !== this.props.sessionId || this.state.messageId && previous.messages.find((message) => message.id === this.state.messageId)?.version !== this.props.messages.find((message) => message.id === this.state.messageId)?.version) this.close();
  }
  componentWillUnmount() {
    this.generation++;
  }
  async read(messageId, cursor = 0, expectedVersion) {
    const generation = ++this.generation, projectId = this.props.projectId, sessionId = this.props.sessionId;
    this.setState({ messageId, page: null, busy: true, error: "" });
    try {
      const page = await api("/operations/session_message_read", { projectId, input: { sessionId, messageId, cursor, limit: READ_LIMIT, ...expectedVersion === void 0 ? {} : { expectedVersion } } });
      if (page.sessionId !== sessionId || page.messageId !== messageId || page.cursorUnit !== "utf8-byte" || expectedVersion !== void 0 && page.version !== expectedVersion || ![page.version, page.cursor, page.end, page.total].every(Number.isSafeInteger) || page.version < 1 || page.cursor < Math.max(0, cursor - 3) || page.cursor > cursor || page.end < page.cursor || page.end > page.total || page.end > page.cursor + READ_LIMIT || page.end <= cursor && !page.complete || page.complete !== (page.end === page.total) || new TextEncoder().encode(page.content).byteLength !== page.end - page.cursor)
        throw Error("\u6D88\u606F\u539F\u6587\u54CD\u5E94\u4E0E\u8BF7\u6C42\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u5237\u65B0\u5386\u53F2\u9875\u540E\u91CD\u8BD5");
      if (generation === this.generation && projectId === this.props.projectId && sessionId === this.props.sessionId) this.setState({ page, busy: false });
    } catch (error) {
      if (generation === this.generation) this.setState({ busy: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  render() {
    const { sessionId, messages, history, historyAnchor, onNavigate, perform } = this.props, { messageId, page, busy, error } = this.state;
    const transcript = messages.filter((message) => !(message.role === "user" && message.status === "queued" && message.origin !== "automation"));
    const active = messages.find((message) => message.id === messageId);
    const controls = /* @__PURE__ */ jsxs("div", { className: "history-controls", children: [
      /* @__PURE__ */ jsx("button", { type: "button", disabled: !history?.beforeMessageId, onClick: () => history?.beforeMessageId && onNavigate({ direction: "before", id: history.beforeMessageId }), children: "\u66F4\u65E9\u6D88\u606F" }),
      /* @__PURE__ */ jsx("button", { type: "button", disabled: !history?.afterMessageId, onClick: () => history?.afterMessageId && onNavigate({ direction: "after", id: history.afterMessageId }), children: "\u66F4\u65B0\u6D88\u606F" }),
      historyAnchor || !history?.atLatest ? /* @__PURE__ */ jsx("button", { type: "button", onClick: () => onNavigate(null), children: "\u8FD4\u56DE\u6700\u65B0" }) : null
    ] });
    const content = (message) => /* @__PURE__ */ jsx(Fragment, { children: active?.id === message.id ? /* @__PURE__ */ jsxs("div", { className: "message-reader", children: [
      /* @__PURE__ */ jsxs("div", { className: "history-controls", children: [
        /* @__PURE__ */ jsx("strong", { children: "\u6D88\u606F\u539F\u6587" }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: this.close, children: "\u5173\u95ED\u539F\u6587" })
      ] }),
      busy ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6B63\u5728\u8BFB\u53D6\u2026" }) : null,
      error ? /* @__PURE__ */ jsx("p", { role: "alert", className: "error-text", children: error }) : null,
      page ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("pre", { className: "prose-text message-window", children: page.content }),
        /* @__PURE__ */ jsxs("div", { className: "history-controls", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            page.cursor + 1,
            "\u2013",
            page.end,
            " / ",
            page.total,
            " \u5B57\u8282"
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: busy || page.cursor === 0, onClick: () => void this.read(message.id, Math.max(0, page.cursor - READ_LIMIT), page.version), children: "\u4E0A\u4E00\u6BB5" }),
          /* @__PURE__ */ jsx("button", { type: "button", disabled: busy || page.complete, onClick: () => void this.read(message.id, page.end, page.version), children: "\u4E0B\u4E00\u6BB5" })
        ] }),
        page.sourceTruncated ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6570\u636E\u5E93\u4E2D\u7684\u6D88\u606F\u6B63\u6587\u5DF2\u622A\u65AD\uFF1B\u8FD9\u91CC\u53EA\u80FD\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u90E8\u5206\uFF0C\u539F\u751F\u4F1A\u8BDD\u8BB0\u5F55\u53EF\u80FD\u4ECD\u4FDD\u7559\u5168\u6587\u3002" }) : null
      ] }) : null
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "prose-text", children: message.content || "\uFF08\u672C\u6B21\u54CD\u5E94\u6CA1\u6709\u53EF\u5C55\u793A\u7684\u6587\u672C\uFF09" }),
      message.previewTruncated ? /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
        "\u9884\u89C8 ",
        message.contentBytes,
        " \u5B57\u8282\u4E2D\u7684\u524D\u6BB5\u3002",
        /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", onClick: () => void this.read(message.id, 0, message.version), children: "\u5206\u6BB5\u67E5\u770B\u539F\u6587" })
      ] }) : null,
      message.contentTruncated ? /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u6570\u636E\u5E93\u4E2D\u7684\u6D88\u606F\u6B63\u6587\u5DF2\u622A\u65AD\uFF1B\u8FD9\u91CC\u53EA\u80FD\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u7684\u90E8\u5206\uFF0C\u539F\u751F\u4F1A\u8BDD\u8BB0\u5F55\u53EF\u80FD\u4ECD\u4FDD\u7559\u5168\u6587\u3002" }) : null
    ] }) });
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      history ? controls : null,
      transcript.map((message) => /* @__PURE__ */ jsxs("article", { className: "message message-" + message.role, children: [
        /* @__PURE__ */ jsx("div", { className: "message-avatar", children: message.role === "user" ? "\u6211" : message.role === "assistant" ? "\u03C0" : "\xB7" }),
        /* @__PURE__ */ jsxs("div", { className: "message-body", children: [
          /* @__PURE__ */ jsxs("div", { className: "message-meta", children: [
            /* @__PURE__ */ jsx("strong", { children: message.role === "user" ? "\u4F60" : message.role === "assistant" ? message.wakeupId ? "Pi \xB7 \u7ED3\u679C\u5206\u6790" : "Pi" : message.wakeupId ? "\u6301\u4E45\u5316\u7ED3\u679C\u901A\u77E5" : "\u5DE5\u4F5C\u53F0\u72B6\u6001\u901A\u77E5" }),
            /* @__PURE__ */ jsx("span", { children: date(message.createdAt) }),
            message.queueRemoved ? /* @__PURE__ */ jsx("span", { className: "badge s-cancelled", children: "\u5DF2\u79FB\u51FA\u961F\u5217" }) : message.status === "failed" || message.status === "cancelled" ? /* @__PURE__ */ jsx(Badge, { value: message.status }) : null
          ] }),
          message.queueRemoved ? /* @__PURE__ */ jsxs("details", { className: "removed-message-content", children: [
            /* @__PURE__ */ jsx("summary", { children: "\u67E5\u770B\u5DF2\u79FB\u51FA\u961F\u5217\u7684\u539F\u6D88\u606F" }),
            content(message)
          ] }) : content(message),
          message.attachments?.length ? /* @__PURE__ */ jsx("div", { className: "message-attachments", "aria-label": "\u6D88\u606F\u9644\u4EF6", children: message.attachments.map((attachment) => /* @__PURE__ */ jsxs("div", { className: "message-attachment", children: [
            /* @__PURE__ */ jsx(Icon, { name: "evidence", size: 15 }),
            /* @__PURE__ */ jsx("span", { title: attachment.title, children: attachment.title }),
            /* @__PURE__ */ jsx("small", { children: attachment.mediaType === "application/pdf" ? "PDF \u539F\u4EF6 \xB7 \u9700\u663E\u5F0F\u89E3\u6790" : "\u6587\u672C\u539F\u4EF6" }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "text-button", "aria-label": `\u4E0B\u8F7D\u9644\u4EF6\u539F\u4EF6 ${attachment.title}`, onClick: () => perform(() => downloadArtifact(attachment.artifactId, attachment.title)), children: "\u4E0B\u8F7D\u539F\u4EF6" })
          ] }, attachment.documentVersionId)) }) : null,
          message.error ? /* @__PURE__ */ jsx("p", { className: "error-text", children: message.error }) : null,
          /* @__PURE__ */ jsxs("div", { className: "message-tools", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => perform(() => api(`/sessions/${sessionId}/branch`, { messageId: message.id }), "\u5DF2\u521B\u5EFA\u5BF9\u8BDD\u5206\u652F\uFF1B\u5B9E\u9A8C\u8BB0\u5F55\u4FDD\u6301\u4E0D\u53D8"), children: "\u4ECE\u6B64\u5904\u5206\u652F" }),
            !message.queueRemoved && message.role === "user" && ["failed", "cancelled"].includes(message.status) ? /* @__PURE__ */ jsx("button", { onClick: () => perform(() => api(`/sessions/${sessionId}/retry`, { messageId: message.id })), children: "\u91CD\u8BD5\u6B64\u6D88\u606F" }) : null
          ] })
        ] })
      ] }, message.id)),
      history ? controls : null
    ] });
  }
}
export {
  SessionHistory
};
