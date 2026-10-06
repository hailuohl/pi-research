import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon } from "./ui.js";
const key = (model) => JSON.stringify([model.provider, model.model, model.thinking]);
const sameModel = (a, b) => a.provider === b.provider && a.model === b.model;
const thinkingLabels = { off: "\u9ED8\u8BA4", minimal: "\u6700\u4F4E", low: "\u4F4E", medium: "\u4E2D", high: "\u9AD8", xhigh: "\u8D85\u9AD8" };
class ComposerModelMenu extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { open: false };
    this.alive = true;
    this.trigger = React.createRef();
    this.menu = React.createRef();
    this.position = () => {
      const menu = this.menu.current, trigger = this.trigger.current;
      if (!menu?.matches(":popover-open") || !trigger) return;
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      menu.style.width = Math.min(320, width - 32) + "px";
      const r = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect(), above = r.top - m.height - 8, below = r.bottom + 8;
      menu.style.left = Math.max(16, Math.min(r.right - m.width, width - m.width - 16)) + "px";
      menu.style.top = Math.max(16, Math.min(above >= 16 ? above : below + m.height <= height - 16 ? below : 16, height - m.height - 16)) + "px";
    };
    this.close = () => {
      if (this.menu.current?.matches(":popover-open")) this.menu.current.hidePopover();
    };
    this.keys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
        this.trigger.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        this.close();
        this.trigger.current?.focus();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(this.menu.current?.querySelectorAll('button[role="menuitemradio"]:not(:disabled)') ?? []);
      if (!items.length) return;
      const current = items.indexOf(document.activeElement), next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    };
    this.choose = (model) => {
      if (!this.alive || this.props.disabled || !this.props.options.some((option) => key(option) === key(model))) return;
      this.close();
      this.trigger.current?.focus();
      if (!this.props.current || key(model) !== key(this.props.current)) this.props.onSelect(model);
    };
    this.chooseModel = (model) => {
      const variants = this.props.options.filter((option) => sameModel(option, model)), target = variants.find((option) => option.thinking === this.props.current?.thinking) ?? variants[0];
      if (target) this.choose(target);
    };
  }
  componentDidMount() {
    window.addEventListener("resize", this.position);
    window.addEventListener("scroll", this.position, true);
  }
  componentWillUnmount() {
    this.alive = false;
    window.removeEventListener("resize", this.position);
    window.removeEventListener("scroll", this.position, true);
  }
  componentDidUpdate(previous) {
    if (this.props.disabled || previous.sessionId !== this.props.sessionId || key(previous.current ?? { provider: "", model: "", thinking: "off" }) !== key(this.props.current ?? { provider: "", model: "", thinking: "off" })) this.close();
  }
  render() {
    const { current, options, disabled, locked } = this.props, id = "composer-model-menu-" + this.props.sessionId, models = options.filter((model, index) => options.findIndex((option) => sameModel(option, model)) === index), variants = current ? options.filter((option) => sameModel(option, current)) : [];
    return /* @__PURE__ */ jsxs("div", { className: "composer-model-control composer-model-picker", children: [
      /* @__PURE__ */ jsxs("button", { ref: this.trigger, type: "button", className: "composer-model-trigger", popoverTarget: id, "aria-haspopup": "menu", "aria-controls": id, "aria-expanded": this.state.open, "aria-label": "\u4F1A\u8BDD\u6A21\u578B\u4E0E\u601D\u8003\u7B49\u7EA7", disabled, title: locked ? "\u5F53\u524D\u4F1A\u8BDD\u5DF2\u7ED1\u5B9A\u56FA\u5B9A\u6388\u6743\uFF0C\u6A21\u578B\u4E0D\u80FD\u66F4\u6539" : current ? current.provider + " / " + current.model + " \xB7 " + thinkingLabels[current.thinking] : "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6A21\u578B", children: [
        /* @__PURE__ */ jsx("span", { className: "composer-model-name", children: current?.model || "\u9009\u62E9\u6A21\u578B" }),
        current && current.thinking !== "off" ? /* @__PURE__ */ jsx("span", { className: "composer-thinking-value", children: thinkingLabels[current.thinking] }) : null,
        /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 11 })
      ] }),
      /* @__PURE__ */ jsxs("div", { ref: this.menu, id, popover: "auto", role: "menu", "aria-label": "\u9009\u62E9\u4F1A\u8BDD\u6A21\u578B", className: "composer-model-menu", onKeyDown: this.keys, onToggle: (event) => {
        const open = event.newState === "open";
        this.setState({ open });
        if (open) {
          this.position();
          (this.menu.current?.querySelector('button[aria-checked="true"]:not(:disabled)') ?? this.menu.current?.querySelector('button[role="menuitemradio"]:not(:disabled)'))?.focus();
        }
      }, children: [
        /* @__PURE__ */ jsxs("div", { className: "composer-model-heading", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u9009\u62E9\u6A21\u578B" }),
          /* @__PURE__ */ jsx("small", { children: "\u4EC5\u5F53\u524D\u4F1A\u8BDD" })
        ] }),
        /* @__PURE__ */ jsx("div", { role: "group", "aria-label": "\u5DF2\u914D\u7F6E\u6A21\u578B", children: models.map((model) => /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": !!current && sameModel(current, model), disabled, className: "composer-model-option", onClick: () => this.chooseModel(model), children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: model.model }),
            /* @__PURE__ */ jsx("small", { children: model.provider })
          ] }),
          current && sameModel(current, model) ? /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }) : null
        ] }, JSON.stringify([model.provider, model.model]))) }),
        variants.length > 1 ? /* @__PURE__ */ jsxs("div", { role: "group", "aria-label": "\u601D\u8003\u5F3A\u5EA6", className: "composer-reasoning-group", children: [
          /* @__PURE__ */ jsx("strong", { children: "\u601D\u8003\u5F3A\u5EA6" }),
          /* @__PURE__ */ jsx("div", { children: variants.map((model) => /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": model.thinking === current?.thinking, disabled, onClick: () => this.choose(model), children: [
            thinkingLabels[model.thinking],
            model.thinking === current?.thinking ? /* @__PURE__ */ jsx(Icon, { name: "check", size: 12 }) : null
          ] }, key(model))) })
        ] }) : null,
        /* @__PURE__ */ jsx("p", { className: "composer-model-note", children: models.length ? "\u4F7F\u7528\u5DF2\u4FDD\u5B58\u7684\u6A21\u578B\u914D\u7F6E\uFF1B\u9879\u76EE\u9ED8\u8BA4\u6A21\u578B\u4FDD\u6301\u4E0D\u53D8\u3002" : "\u8FD8\u6CA1\u6709\u53EF\u7528\u6A21\u578B\uFF0C\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u3002" })
      ] })
    ] });
  }
}
export {
  ComposerModelMenu
};
