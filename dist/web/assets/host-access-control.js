import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { api } from "./api.js";
import { Icon, Modal } from "./ui.js";
class HostAccessControl extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { status: null, open: false, error: "", saving: false };
    this.alive = true;
    this.request = 0;
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
      const status = await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`);
      if (this.alive && request === this.request) this.setState({ status });
    } catch (error) {
      if (this.alive && request === this.request) this.setState({ status: null, error: error instanceof Error ? error.message : String(error) });
    }
  }
  async save(enabled) {
    const status = this.state.status;
    if (!status || this.state.saving || this.props.busy) return;
    this.request++;
    this.setState({ saving: true, error: "" });
    await this.props.perform(async () => {
      try {
        await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`, { enabled, expectedVersion: status.version, ...enabled ? { acknowledgedSameUserAccess: true, ...status.unknownCommands ? { acknowledgedUnknownEffects: true } : {} } : {} });
        if (this.alive) this.setState({ open: false });
      } catch (error) {
        if (this.alive) this.setState({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        if (this.alive) {
          this.setState({ saving: false });
          await this.load();
        }
      }
    }, enabled ? "\u5DF2\u542F\u7528\u672C\u673A\u5B8C\u5168\u8BBF\u95EE\uFF1B\u4E0D\u63D0\u4F9B\u540C\u7528\u6237\u9694\u79BB" : "\u5DF2\u64A4\u9500\u65B0\u5BBF\u4E3B\u547D\u4EE4\u6388\u6743\uFF1B\u53D7\u7BA1\u547D\u4EE4\u6B63\u5728\u505C\u6B62");
  }
  render() {
    const { status, open, error, saving } = this.state;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { type: "button", className: "host-access-trigger" + (status?.enabled ? " enabled" : ""), "aria-label": status?.enabled ? "\u672C\u673A\u5B8C\u5168\u8BBF\u95EE\u5DF2\u542F\u7528\uFF0C\u67E5\u770B\u6216\u64A4\u9500" : status && !status.available ? "\u67E5\u770B\u672C\u673A\u5B8C\u5168\u8BBF\u95EE\u9650\u5236" : "\u542F\u7528\u672C\u673A\u5B8C\u5168\u8BBF\u95EE", disabled: this.props.archived || !status, onClick: () => this.setState({ open: true, error: "" }), children: [
        /* @__PURE__ */ jsx(Icon, { name: "cpu", size: 13 }),
        /* @__PURE__ */ jsx("span", { children: status?.enabled ? "\u5B8C\u5168\u8BBF\u95EE" : status?.available ? "\u5B8C\u5168\u8BBF\u95EE \xB7 \u53EF\u542F\u7528" : "\u5B8C\u5168\u8BBF\u95EE \xB7 \u53D7\u9650" }),
        /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 11 })
      ] }),
      open && status ? /* @__PURE__ */ jsxs(Modal, { title: status.enabled ? "\u672C\u673A\u5B8C\u5168\u8BBF\u95EE" : "\u542F\u7528\u672C\u673A\u5B8C\u5168\u8BBF\u95EE", onClose: () => {
        if (!saving) this.setState({ open: false });
      }, onSubmit: () => {
        void this.save(!status.enabled);
      }, submitLabel: status.enabled ? "\u64A4\u9500\u5B8C\u5168\u8BBF\u95EE" : "\u542F\u7528\u5B8C\u5168\u8BBF\u95EE", busy: saving || this.props.busy || !status.enabled && !status.available, children: [
        /* @__PURE__ */ jsx("p", { children: "\u4F7F\u7528\u5F53\u524D\u7CFB\u7EDF\u7528\u6237\u6743\u9650\u5185\u7684\u771F\u5B9E\u6587\u4EF6\u3001\u547D\u4EE4\u4E0E\u666E\u901A\u7F51\u7EDC\u3002\u4EC5\u5F53\u524D\u4EA4\u4E92\u4E3B\u4F1A\u8BDD\u4F7F\u7528\uFF0C\u5B50\u4EFB\u52A1\u548C\u81EA\u52A8\u5524\u9192\u4E0D\u7EE7\u627F\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "host-access-notice", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u672C\u673A\u53EF\u4FE1\u6A21\u5F0F \xB7 \u672A\u9694\u79BB" }),
          /* @__PURE__ */ jsx("p", { children: "\u547D\u4EE4\u4E5F\u80FD\u63A5\u89E6\u8BE5\u7528\u6237\u7684\u5E94\u7528\u6570\u636E\u3001\u51ED\u636E\u3001\u8FDB\u7A0B\u53CA\u7B2C\u4E09\u65B9\u8D26\u6237\u6743\u9650\u3002\u4E0D\u80FD\u4FDD\u8BC1\u5E94\u7528\u5BA1\u6279\u6570\u636E\u4E0E\u672C\u673A\u547D\u4EE4\u9694\u79BB\u3002" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u64A4\u9500\u4F1A\u62D2\u7EDD\u65B0\u547D\u4EE4\u5E76\u505C\u6B62\u80FD\u8DDF\u8E2A\u7684\u8FDB\u7A0B\uFF1B\u65E0\u6CD5\u64A4\u56DE\u5DF2\u7ECF\u5199\u5165\u7684\u6587\u4EF6\u3001\u53D1\u51FA\u7684\u8BF7\u6C42\u6216\u4FDD\u8BC1\u6E05\u9664\u8131\u7BA1\u8FDB\u7A0B\u3002\u670D\u52A1\u91CD\u542F\u540E\u9700\u8981\u91CD\u65B0\u542F\u7528\u3002" }),
        status.revokedOnRestart ? /* @__PURE__ */ jsx("p", { className: "host-access-note", children: "\u4E0A\u6B21\u6388\u6743\u4E0D\u5C5E\u4E8E\u5F53\u524D\u6267\u884C\u7AEF\uFF0C\u9700\u8981\u91CD\u65B0\u542F\u7528\uFF1B\u5386\u53F2\u8BB0\u5F55\u5DF2\u4FDD\u7559\u3002" }) : null,
        status.activeCommands ? /* @__PURE__ */ jsxs("p", { role: "status", children: [
          status.activeCommands,
          " \u6761\u53D7\u7BA1\u547D\u4EE4\u6B63\u5728\u6267\u884C\u6216\u505C\u6B62\u3002"
        ] }) : null,
        status.unknownCommands ? /* @__PURE__ */ jsxs("p", { className: "host-access-note", role: "status", children: [
          status.unknownCommands,
          " \u6761\u5386\u53F2\u547D\u4EE4\u9000\u51FA\u72B6\u6001\u672A\u786E\u8BA4\uFF0C\u8BF7\u6838\u5BF9\u539F\u8FDB\u7A0B\u4E0E\u5916\u90E8\u6548\u679C\u540E\u51B3\u5B9A\u662F\u5426\u7EE7\u7EED\u3002"
        ] }) : null,
        status.jobs.filter((job) => job.state === "unknown").map((job) => /* @__PURE__ */ jsxs("p", { className: "small muted", children: [
          "\u547D\u4EE4 ",
          job.id.slice(0, 8),
          " \xB7 PID ",
          job.pid ?? "\u65E0\u6CD5\u786E\u8BA4"
        ] }, job.id)),
        !status.enabled ? /* @__PURE__ */ jsxs("label", { className: "host-access-ack", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", required: true, "aria-label": "\u63A5\u53D7\u672C\u673A\u5B8C\u5168\u8BBF\u95EE\u7684\u672A\u9694\u79BB\u8303\u56F4" }),
          "\u6211\u7406\u89E3\u672C\u673A\u672A\u9694\u79BB\u53CA\u540C\u7528\u6237\u6570\u636E\u53EF\u8FBE\uFF0C\u5E76\u4E3A\u6B64\u4F1A\u8BDD\u542F\u7528\u3002"
        ] }) : null,
        !status.enabled && status.unknownCommands ? /* @__PURE__ */ jsxs("label", { className: "host-access-ack", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", required: true, "aria-label": "\u5DF2\u6838\u5BF9\u672A\u77E5\u547D\u4EE4\u7684\u8FDB\u7A0B\u548C\u5916\u90E8\u6548\u679C" }),
          "\u6211\u5DF2\u6838\u5BF9\u4E0A\u8FF0\u672A\u77E5\u547D\u4EE4\u7684\u539F\u8FDB\u7A0B\u53CA\u5916\u90E8\u6548\u679C\uFF0C\u5E76\u660E\u786E\u5141\u8BB8\u65B0\u7684\u6267\u884C\u3002"
        ] }) : null,
        !status.available && !status.enabled ? /* @__PURE__ */ jsx("p", { role: "alert", children: status.reason }) : null,
        error ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: error }) : null
      ] }) : null
    ] });
  }
}
export {
  HostAccessControl
};
