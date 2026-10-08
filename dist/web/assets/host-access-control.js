import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { createPortal } from "react-dom";
import { api } from "./api.js";
import { Icon, Modal } from "./ui.js";
const modeLabels = { readOnly: "\u53EA\u8BFB", confirm: "\u53D8\u66F4\u524D\u786E\u8BA4", autoEdit: "\u81EA\u52A8\u7F16\u8F91", fullAccess: "\u5B8C\u5168\u8BBF\u95EE", legacy: "\u73B0\u6709\u53D7\u63A7\u5DE5\u5177" };
function permissionDialog(dialog) {
  const boundary = /* @__PURE__ */ jsx("div", { onSubmit: (event) => event.stopPropagation(), children: dialog });
  return typeof document === "undefined" ? boundary : createPortal(boundary, document.body);
}
class HostAccessControl extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { status: null, permission: null, open: false, menuOpen: false, error: "", saving: false };
    this.alive = true;
    this.request = 0;
    this.trigger = React.createRef();
    this.menu = React.createRef();
    this.dialogEnabled = false;
    this.dialogPending = false;
    this.positionMenu = () => {
      const menu = this.menu.current, trigger = this.trigger.current;
      if (!menu?.matches(":popover-open") || !trigger) return;
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      menu.style.width = Math.min(320, width - 32) + "px";
      const r = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect();
      const above = r.top - m.height - 8, below = r.bottom + 8;
      menu.style.left = Math.max(16, Math.min(r.left, width - m.width - 16)) + "px";
      menu.style.top = Math.max(16, Math.min(above >= 16 ? above : below + m.height <= height - 16 ? below : 16, height - m.height - 16)) + "px";
    };
    this.closeMenu = () => {
      if (this.menu.current?.matches(":popover-open")) this.menu.current.hidePopover();
    };
    this.showDetails = () => {
      const status = this.state.status;
      if (!status) return;
      this.dialogEnabled = status.enabled;
      this.dialogPending = !!status.pending;
      this.closeMenu();
      this.trigger.current?.focus();
      this.setState({ open: true, error: "" });
    };
    this.menuKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.closeMenu();
        this.trigger.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        this.closeMenu();
        this.trigger.current?.focus();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(this.menu.current?.querySelectorAll('button[role^="menuitem"]:not(:disabled)') ?? []);
      if (!items.length) return;
      const current = items.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    };
  }
  componentDidMount() {
    void this.load();
    this.timer = setInterval(() => {
      if (!this.state.saving) void this.load();
    }, 1500);
    window.addEventListener("resize", this.positionMenu);
    window.addEventListener("scroll", this.positionMenu, true);
  }
  componentWillUnmount() {
    this.alive = false;
    this.request++;
    clearInterval(this.timer);
    window.removeEventListener("resize", this.positionMenu);
    window.removeEventListener("scroll", this.positionMenu, true);
  }
  async load() {
    const request = ++this.request;
    try {
      const permission = await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`);
      if (this.alive && request === this.request) this.setState({ permission, status: permission.hostAccess });
    } catch (error) {
      if (this.alive && request === this.request) this.setState({ status: null, permission: null, error: error instanceof Error ? error.message : String(error) });
    }
  }
  async saveMode(mode) {
    const permission = this.state.permission, status = this.state.status;
    if (!permission || !status || this.state.saving || this.props.busy) return;
    this.closeMenu();
    this.trigger.current?.focus();
    if (permission.mode === mode) {
      if (status.pending) await this.save(false);
      return;
    }
    this.request++;
    this.setState({ saving: true, error: "" });
    await this.props.perform(async () => {
      try {
        await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`, { mode, expectedVersion: permission.version, expectedHostVersion: status.version });
      } catch (error) {
        if (this.alive) this.setState({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        if (this.alive) {
          this.setState({ saving: false });
          await this.load();
        }
      }
    }, "\u4F1A\u8BDD\u6743\u9650\u5DF2\u66F4\u65B0\u4E3A" + modeLabels[mode]);
  }
  async save(enabled) {
    const status = this.state.status;
    if (!status || this.state.saving || this.props.busy) return;
    if (enabled ? status.enabled || status.pending : !status.enabled && !status.pending) {
      this.setState({ open: false, error: "\u6743\u9650\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9" });
      return;
    }
    this.request++;
    this.setState({ saving: true, error: "" });
    await this.props.perform(async () => {
      try {
        const result = await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/host-access`, { enabled, expectedVersion: status.version, ...enabled ? { acknowledgedSameUserAccess: true, ...status.unknownCommands ? { acknowledgedUnknownEffects: true } : {} } : {} });
        if (this.alive) {
          if (result.pending) {
            this.dialogEnabled = false;
            this.dialogPending = true;
          }
          this.setState({ status: result, open: result.pending });
        }
      } catch (error) {
        if (this.alive) this.setState({ error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        if (this.alive) {
          this.setState({ saving: false });
          await this.load();
        }
      }
    }, enabled ? "\u5DF2\u63A5\u53D7\u5B8C\u5168\u8BBF\u95EE\u8BF7\u6C42\uFF1B\u6267\u884C\u4E2D\u4F1A\u5728\u540E\u53F0\u81EA\u52A8\u751F\u6548" : status.pending ? "\u5DF2\u53D6\u6D88\u5B8C\u5168\u8BBF\u95EE\u542F\u7528\u8BF7\u6C42" : "\u5DF2\u64A4\u9500\u65B0\u5BBF\u4E3B\u547D\u4EE4\u6388\u6743\uFF1B\u53D7\u7BA1\u547D\u4EE4\u6B63\u5728\u505C\u6B62");
  }
  render() {
    const { status, permission, open, menuOpen, error, saving } = this.state, menuId = "host-permission-menu-" + this.props.sessionId, enabled = this.dialogEnabled, pending = this.dialogPending, mode = permission?.mode ?? (status?.enabled ? "fullAccess" : "legacy");
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("button", { ref: this.trigger, type: "button", className: "host-access-trigger" + (status?.enabled ? " enabled" : ""), "aria-label": "\u4F1A\u8BDD\u6743\u9650\uFF1A" + modeLabels[mode] + (status?.pending ? "\uFF1B\u5B8C\u5168\u8BBF\u95EE\u5F85\u542F\u7528" : ""), "aria-haspopup": "menu", "aria-expanded": menuOpen, "aria-controls": menuId, popoverTarget: menuId, disabled: this.props.archived || !status || saving, children: [
        /* @__PURE__ */ jsx(Icon, { name: "cpu", size: 13 }),
        /* @__PURE__ */ jsx("span", { children: status?.pending ? "\u5B8C\u5168\u8BBF\u95EE\u5F85\u542F\u7528" : mode === "legacy" ? "\u53D7\u63A7\u5DE5\u5177" : modeLabels[mode] }),
        /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 11 })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: this.menu, id: menuId, popover: "auto", role: "menu", "aria-label": "\u4F1A\u8BDD\u6743\u9650", className: "host-permission-menu", onKeyDown: this.menuKeys, onToggle: (event) => {
        const opening = event.newState === "open";
        this.setState({ menuOpen: opening });
        if (opening) {
          this.positionMenu();
          this.menu.current?.querySelector('button[role^="menuitem"]:not(:disabled)')?.focus();
        }
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "host-permission-heading", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u4F1A\u8BDD\u6743\u9650" }),
          /* @__PURE__ */ jsx("small", { children: "\u4EC5\u5F53\u524D\u4F1A\u8BDD" })
        ] }),
        /* @__PURE__ */ jsxs("div", { role: "group", "aria-label": "\u6743\u9650\u6863\u4F4D", children: [
          [{ mode: "readOnly", icon: "book-open", description: "\u67E5\u770B\u5DF2\u6709\u8D44\u6599\uFF0C\u4E0D\u7F16\u8F91\u3001\u8054\u7F51\u6216\u6267\u884C" }, { mode: "confirm", icon: "settings", description: "\u53D8\u66F4\u4E0E\u65B0\u8054\u7F51\u8BF7\u6C42\u5148\u7531\u4F60\u786E\u8BA4" }, { mode: "autoEdit", icon: "edit", description: "\u79C1\u6709\u5DE5\u4F5C\u533A\u81EA\u52A8\u7F16\u8F91\uFF0C\u6267\u884C\u4ECD\u9700\u786E\u8BA4" }].map((item) => /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": mode === item.mode, disabled: !permission?.available || saving || this.props.busy, className: "host-permission-row" + (mode === item.mode ? " selected" : ""), onClick: () => {
            void this.saveMode(item.mode);
          }, children: [
            /* @__PURE__ */ jsx(Icon, { name: item.icon }),
            /* @__PURE__ */ jsxs("span", { className: "host-permission-copy", children: [
              /* @__PURE__ */ jsx("strong", { children: modeLabels[item.mode] }),
              /* @__PURE__ */ jsx("small", { children: item.description })
            ] }),
            mode === item.mode ? /* @__PURE__ */ jsx(Icon, { name: "check" }) : null
          ] }, item.mode)),
          /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": !!status?.enabled, disabled: !status || !status.available && !status.enabled && !status.pending || saving || this.props.busy, onClick: this.showDetails, className: "host-permission-row" + (status?.enabled ? " selected" : ""), children: [
            /* @__PURE__ */ jsx(Icon, { name: "cpu" }),
            /* @__PURE__ */ jsxs("span", { className: "host-permission-copy", children: [
              /* @__PURE__ */ jsx("strong", { children: "\u5B8C\u5168\u8BBF\u95EE" }),
              /* @__PURE__ */ jsx("small", { children: status?.pending ? "\u8BF7\u6C42\u5DF2\u63A5\u53D7\uFF0C\u5F53\u524D\u6267\u884C\u7ED3\u675F\u540E\u81EA\u52A8\u542F\u7528" : "\u672C\u673A\u6587\u4EF6\u3001\u547D\u4EE4\u4E0E\u7F51\u7EDC \xB7 \u672A\u9694\u79BB" })
            ] }),
            status?.enabled ? /* @__PURE__ */ jsx(Icon, { name: "check" }) : null
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "host-permission-footer", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "\u5F53\u524D\uFF1A",
            modeLabels[mode]
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", role: "menuitem", onClick: status?.enabled || status?.pending ? this.showDetails : () => {
            this.closeMenu();
            this.trigger.current?.focus();
          }, className: "host-permission-secondary", children: status?.pending ? "\u67E5\u770B\u4E0E\u53D6\u6D88" : status?.enabled ? "\u8303\u56F4\u4E0E\u64A4\u9500" : "\u5173\u95ED" })
        ] }),
        permission && !permission.available ? /* @__PURE__ */ jsx("p", { className: "host-permission-reason", children: permission.reason }) : null,
        status && !status.available && !status.enabled ? /* @__PURE__ */ jsx("p", { className: "host-permission-reason", children: status.reason }) : null,
        error ? /* @__PURE__ */ jsx("p", { className: "host-permission-reason", role: "status", children: error }) : null
      ] }),
      open && status ? permissionDialog(/* @__PURE__ */ jsxs(Modal, { title: pending && status.pending ? "\u5B8C\u5168\u8BBF\u95EE\u5F85\u542F\u7528" : enabled || pending ? "\u672C\u673A\u5B8C\u5168\u8BBF\u95EE" : "\u542F\u7528\u672C\u673A\u5B8C\u5168\u8BBF\u95EE", onClose: () => {
        if (!saving) this.setState({ open: false });
      }, onSubmit: () => {
        void this.save(!enabled && !pending);
      }, submitLabel: pending && status.pending ? "\u53D6\u6D88\u542F\u7528" : enabled || pending ? "\u64A4\u9500\u5B8C\u5168\u8BBF\u95EE" : "\u542F\u7528\u5B8C\u5168\u8BBF\u95EE", busy: saving || this.props.busy || !enabled && !pending && (!status.available || status.pending), children: [
        /* @__PURE__ */ jsx("p", { children: "\u4F7F\u7528\u5F53\u524D\u7CFB\u7EDF\u7528\u6237\u6743\u9650\u5185\u7684\u771F\u5B9E\u6587\u4EF6\u3001\u547D\u4EE4\u4E0E\u666E\u901A\u7F51\u7EDC\u3002\u4EC5\u5F53\u524D\u4EA4\u4E92\u4E3B\u4F1A\u8BDD\u4F7F\u7528\uFF0C\u5B50\u4EFB\u52A1\u548C\u81EA\u52A8\u5524\u9192\u4E0D\u7EE7\u627F\u3002" }),
        /* @__PURE__ */ jsxs("div", { className: "host-access-notice", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u672C\u673A\u53EF\u4FE1\u6A21\u5F0F \xB7 \u672A\u9694\u79BB" }),
          /* @__PURE__ */ jsx("p", { children: "\u547D\u4EE4\u4E5F\u80FD\u63A5\u89E6\u8BE5\u7528\u6237\u7684\u5E94\u7528\u6570\u636E\u3001\u51ED\u636E\u3001\u8FDB\u7A0B\u53CA\u7B2C\u4E09\u65B9\u8D26\u6237\u6743\u9650\u3002\u4E0D\u80FD\u4FDD\u8BC1\u5E94\u7528\u5BA1\u6279\u6570\u636E\u4E0E\u672C\u673A\u547D\u4EE4\u9694\u79BB\u3002" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "small muted", children: "\u64A4\u9500\u4F1A\u62D2\u7EDD\u65B0\u547D\u4EE4\u5E76\u505C\u6B62\u80FD\u8DDF\u8E2A\u7684\u8FDB\u7A0B\uFF1B\u65E0\u6CD5\u64A4\u56DE\u5DF2\u7ECF\u5199\u5165\u7684\u6587\u4EF6\u3001\u53D1\u51FA\u7684\u8BF7\u6C42\u6216\u4FDD\u8BC1\u6E05\u9664\u8131\u7BA1\u8FDB\u7A0B\u3002\u670D\u52A1\u91CD\u542F\u540E\u9700\u8981\u91CD\u65B0\u542F\u7528\u3002" }),
        status.pending ? /* @__PURE__ */ jsx("p", { className: "host-access-note", role: "status", children: "\u542F\u7528\u8BF7\u6C42\u5DF2\u63A5\u53D7\u3002\u5F53\u524D\u6267\u884C\u7EE7\u7EED\uFF0C\u7ED3\u675F\u540E\u540E\u53F0\u81EA\u52A8\u542F\u7528\u5E76\u5904\u7406\u6392\u961F\u6D88\u606F\uFF0C\u65E0\u9700\u518D\u6B21\u64CD\u4F5C\uFF1B\u751F\u6548\u524D\u53EF\u53D6\u6D88\u3002" }) : null,
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
        !enabled && !pending ? /* @__PURE__ */ jsxs("label", { className: "host-access-ack", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", required: true, "aria-label": "\u63A5\u53D7\u672C\u673A\u5B8C\u5168\u8BBF\u95EE\u7684\u672A\u9694\u79BB\u8303\u56F4" }),
          "\u6211\u7406\u89E3\u672C\u673A\u672A\u9694\u79BB\u53CA\u540C\u7528\u6237\u6570\u636E\u53EF\u8FBE\uFF0C\u5E76\u4E3A\u6B64\u4F1A\u8BDD\u542F\u7528\u3002"
        ] }) : null,
        !enabled && !pending && status.unknownCommands ? /* @__PURE__ */ jsxs("label", { className: "host-access-ack", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", required: true, "aria-label": "\u5DF2\u6838\u5BF9\u672A\u77E5\u547D\u4EE4\u7684\u8FDB\u7A0B\u548C\u5916\u90E8\u6548\u679C" }),
          "\u6211\u5DF2\u6838\u5BF9\u4E0A\u8FF0\u672A\u77E5\u547D\u4EE4\u7684\u539F\u8FDB\u7A0B\u53CA\u5916\u90E8\u6548\u679C\uFF0C\u5E76\u660E\u786E\u5141\u8BB8\u65B0\u7684\u6267\u884C\u3002"
        ] }) : null,
        !status.available && !status.enabled ? /* @__PURE__ */ jsx("p", { role: "alert", children: status.reason }) : null,
        error ? /* @__PURE__ */ jsx("p", { className: "error-text", role: "alert", children: error }) : null
      ] })) : null
    ] });
  }
}
export {
  HostAccessControl
};
