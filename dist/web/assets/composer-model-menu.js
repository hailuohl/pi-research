import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon } from "./ui.js";
const key = (model) => JSON.stringify(model ? [model.provider, model.model, model.thinking] : null);
class ComposerModelMenu extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { open: false, modelsOpen: false, saving: false, preview: null, visual: null, dragging: false, pointer: false, error: "" };
    this.alive = true;
    this.trigger = React.createRef();
    this.menu = React.createRef();
    this.range = React.createRef();
    this.models = () => this.props.management?.providers.filter((p) => p.enabled && !p.deletedAt && !p.requiresCredential).flatMap((provider) => provider.models.filter((m) => m.enabled && !m.deletedAt).map((model) => ({ provider, model }))) ?? [];
    this.selected = () => this.models().find((row) => row.provider.provider === this.props.current?.provider && row.model.model === this.props.current?.model);
    this.unavailable = () => !this.props.management || !!this.props.error;
    this.blocked = () => !this.alive || this.props.disabled || this.props.locked || this.props.busy || this.state.saving || this.unavailable();
    this.position = () => {
      const menu = this.menu.current, trigger = this.trigger.current;
      if (!menu?.matches(":popover-open") || !trigger) return;
      const width = document.documentElement.clientWidth, height = window.innerHeight;
      menu.style.width = Math.max(0, Math.min(320, width - 32)) + "px";
      const r = trigger.getBoundingClientRect(), m = menu.getBoundingClientRect();
      menu.style.left = Math.max(16, Math.min(r.left + r.width / 2 - m.width / 2, width - m.width - 16)) + "px";
      menu.style.top = Math.max(16, Math.min(r.top - m.height - 8, height - m.height - 16)) + "px";
    };
    this.resetPreview = () => {
      this.pointerStart = void 0;
      if (this.state.preview !== null || this.state.visual !== null || this.state.pointer || this.state.dragging) this.setState({ preview: null, visual: null, pointer: false, dragging: false });
    };
    this.close = () => {
      this.resetPreview();
      if (this.menu.current?.matches(":popover-open")) this.menu.current.hidePopover();
      if (this.state.open) this.setState({ open: false, modelsOpen: false });
    };
    this.keys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.close();
        this.trigger.current?.focus();
        return;
      }
      if (event.target.tagName === "INPUT" || !this.state.modelsOpen || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const items = Array.from(this.menu.current?.querySelectorAll('button[role="menuitemradio"]:not(:disabled)') ?? []);
      if (!items.length) return;
      const current = items.indexOf(document.activeElement), next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    };
    this.choose = async (model) => {
      if (this.blocked() || !this.models().some((row) => row.provider.provider === model.provider && row.model.model === model.model && row.model.reasoning.levels.some((level) => level.id === model.thinking))) return;
      this.pointerStart = void 0;
      this.setState({ modelsOpen: false, error: "", pointer: false, dragging: false });
      if (key(model) === key(this.props.current)) {
        this.resetPreview();
        return;
      }
      if (this.state.preview !== null) this.setState({ preview: Math.round(this.state.preview) });
      const request = { sessionId: this.props.sessionId, selection: model };
      this.pending = request;
      this.setState({ saving: true });
      let saved = false;
      try {
        const confirmed = await this.props.onSelect(model);
        if (!this.alive || this.pending !== request || this.props.sessionId !== request.sessionId) return;
        saved = confirmed?.id === request.sessionId && key(confirmed.model) === key(model);
        if (!saved) this.setState({ error: "\u6A21\u578B\u9009\u62E9\u672A\u4FDD\u5B58\uFF0C\u8BF7\u6838\u5BF9\u5F53\u524D\u4F1A\u8BDD\u540E\u91CD\u8BD5\u3002" });
      } catch (error) {
        if (this.alive && this.pending === request) this.setState({ error: error instanceof Error ? error.message : String(error) });
      } finally {
        if (this.alive && this.pending === request) {
          this.pending = void 0;
          if (!saved || key(this.props.current) !== key(model)) this.resetPreview();
          this.setState({ saving: false });
        }
      }
    };
    this.chooseModel = (provider, model) => {
      if (this.blocked()) return;
      const row = this.models().find((row2) => row2.provider.provider === provider && row2.model.model === model);
      if (!row) return;
      const levels = row.model.reasoning.levels, current = this.props.current, same = current?.provider === provider && current.model === model;
      const thinking = same && levels.some((level) => level.id === current.thinking) ? current.thinking : row.model.reasoning.defaultLevel;
      if (levels.some((level) => level.id === thinking)) {
        this.resetPreview();
        return this.choose({ provider, model, thinking });
      }
    };
    this.preview = (value) => {
      const levels = this.selected()?.model.reasoning.levels ?? [];
      if (this.blocked() || levels.length < 2 || !Number.isFinite(value)) return;
      const bounded = Math.max(0, Math.min(value, levels.length - 1)), index = this.state.dragging ? bounded : Math.round(bounded);
      this.setState({ preview: index, visual: index });
    };
    this.confirmedIndex = () => this.selected()?.model.reasoning.levels.findIndex((level) => level.id === this.props.current?.thinking) ?? -1;
    this.commit = () => {
      const row = this.selected(), index = this.state.preview;
      if (!row || index === null) return;
      const level = row.model.reasoning.levels[Math.round(index)];
      if (level) return this.choose({ provider: row.provider.provider, model: row.model.model, thinking: level.id });
    };
    this.pointerDown = (event) => {
      if (this.blocked() || event.button !== 0) return;
      this.pointerStart = { id: event.pointerId, x: event.clientX };
      event.currentTarget.setPointerCapture?.(event.pointerId);
      this.setState({ pointer: true, dragging: false });
    };
    this.pointerMove = (event) => {
      if (!this.pointerStart || event.pointerId !== this.pointerStart.id || this.blocked()) return;
      if (!this.state.dragging && Math.abs(event.clientX - this.pointerStart.x) <= 3) return;
      const rect = event.currentTarget.getBoundingClientRect(), count = this.selected()?.model.reasoning.levels.length ?? 0;
      if (rect.width <= 36 || count < 2) return;
      const value = Math.max(0, Math.min(1, (event.clientX - rect.left - 18) / (rect.width - 36))) * (count - 1);
      this.setState({ dragging: true, preview: value, visual: value });
    };
    this.pointerEnd = (event, cancel = false) => {
      if (!this.pointerStart || event.pointerId !== this.pointerStart.id) return;
      this.pointerStart = void 0;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      this.setState({ pointer: false, dragging: false, visual: this.state.dragging && this.state.preview !== null ? Math.round(this.state.preview) : this.state.visual });
      if (cancel) this.resetPreview();
      else void this.commit();
    };
    this.toggle = (event) => {
      const open = event.newState === "open";
      if (open && this.blocked()) {
        this.close();
        return;
      }
      this.resetPreview();
      this.setState({ open, modelsOpen: open && !this.selected(), error: "" }, () => {
        if (open) {
          this.position();
          (this.range.current && !this.range.current.disabled ? this.range.current : this.menu.current?.querySelector("button:not(:disabled)"))?.focus();
        }
      });
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
    const changed = previous.sessionId !== this.props.sessionId, currentChanged = key(previous.current) !== key(this.props.current);
    if (changed) {
      this.pending = void 0;
      this.setState({ saving: false, error: "" });
      this.close();
    } else if (this.props.disabled || this.props.locked || this.unavailable() || this.props.busy && !this.state.saving) this.close();
    else if (currentChanged && (!this.pending || key(this.pending.selection) !== key(this.props.current))) this.close();
    if (previous.management !== this.props.management && this.state.open) {
      const target = this.pending?.selection ?? this.props.current;
      if (target && !this.models().some((row) => row.provider.provider === target.provider && row.model.model === target.model && row.model.reasoning.levels.some((level) => level.id === target.thinking))) this.close();
      const old = previous.management?.providers.find((p) => p.provider === this.props.current?.provider)?.models.find((m) => m.model === this.props.current?.model);
      if (JSON.stringify(old?.reasoning.levels.map((level) => level.id)) !== JSON.stringify(this.selected()?.model.reasoning.levels.map((level) => level.id))) this.resetPreview();
    }
    if (this.state.open) this.position();
  }
  render() {
    const { current, disabled, busy, locked, sessionId, management } = this.props, models = this.models(), selected = this.selected(), levels = selected?.model.reasoning.levels ?? [];
    const scope = () => this.props.sessionId === sessionId && key(this.props.current) === key(current) && this.props.management === management;
    const confirmedIndex = this.confirmedIndex(), valid = confirmedIndex >= 0, configured = !!current?.provider && !!current.model, label = valid ? levels[confirmedIndex].label : configured ? "\u4E0D\u53EF\u7528" : "";
    const index = this.state.preview ?? confirmedIndex, level = levels[Math.round(index)], visual = this.state.visual ?? confirmedIndex, progress = levels.length > 1 && visual >= 0 ? visual / (levels.length - 1) * 100 : 0;
    const blocked = this.blocked(), id = "composer-model-menu-" + sessionId, error = this.props.error || this.state.error;
    const style = { "--thinking-progress": progress + "%", "--thinking-fill-width": progress >= 100 ? "100%" : `calc(18px + (100% - 36px) * ${progress / 100})`, "--thinking-violet": progress / 100 };
    return /* @__PURE__ */ jsxs("div", { className: "composer-model-control composer-model-picker", children: [
      /* @__PURE__ */ jsxs("button", { ref: this.trigger, type: "button", className: "composer-model-trigger", popoverTarget: id, "aria-haspopup": "dialog", "aria-controls": id, "aria-expanded": this.state.open, "aria-label": "\u4F1A\u8BDD\u6A21\u578B\u4E0E\u601D\u8003\u7B49\u7EA7", disabled: disabled || locked || busy || this.state.saving || this.unavailable() || !models.length, title: locked ? "\u5F53\u524D\u4F1A\u8BDD\u5DF2\u7ED1\u5B9A\u56FA\u5B9A\u6388\u6743\uFF0C\u6A21\u578B\u4E0D\u80FD\u66F4\u6539" : error || (!models.length ? "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u4FDD\u5B58\u4F9B\u5E94\u5546\u3001\u6A21\u578B\u4E0E\u601D\u8003\u6863\u4F4D" : current ? current.provider + " / " + current.model + " \xB7 " + label : "\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6A21\u578B"), children: [
        this.state.open && !this.state.modelsOpen ? /* @__PURE__ */ jsx("span", { className: "composer-thinking-value", children: "\u9009\u62E9\u5F3A\u5EA6" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "composer-model-name", children: selected?.model.name || current?.model || "\u9009\u62E9\u6A21\u578B" }),
          label ? /* @__PURE__ */ jsx("span", { className: "composer-thinking-value", children: label }) : null
        ] }),
        /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 11 })
      ] }),
      this.unavailable() && error ? /* @__PURE__ */ jsx("span", { className: "composer-model-error", role: "status", children: error }) : null,
      /* @__PURE__ */ jsxs("div", { ref: this.menu, id, popover: "auto", role: "dialog", "aria-label": "\u9009\u62E9\u4F1A\u8BDD\u6A21\u578B\u4E0E\u601D\u8003\u5F3A\u5EA6", className: "composer-model-menu", onKeyDown: this.keys, onToggle: this.toggle, children: [
        /* @__PURE__ */ jsxs("div", { className: "composer-model-strength", "data-expanded": !this.state.modelsOpen, inert: this.state.modelsOpen, "aria-hidden": this.state.modelsOpen, children: [
          /* @__PURE__ */ jsxs("div", { className: "composer-model-heading", children: [
            /* @__PURE__ */ jsx("strong", { className: "composer-thinking-level", children: level?.label || (current ? "\u5F53\u524D\u914D\u7F6E\u4E0D\u53EF\u7528" : "\u9009\u62E9\u6A21\u578B") }),
            /* @__PURE__ */ jsxs("button", { type: "button", className: "composer-model-name", "aria-expanded": this.state.modelsOpen, "aria-controls": id + "-models", disabled: blocked, onClick: () => {
              if (!scope() || this.blocked()) return;
              this.resetPreview();
              this.setState({ modelsOpen: !this.state.modelsOpen });
            }, children: [
              selected?.model.name || current?.model || "\u9009\u62E9\u6A21\u578B",
              /* @__PURE__ */ jsx(Icon, { name: "chevron", size: 11 })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "composer-thinking-picker", "data-dragging": this.state.dragging, "data-pointer": this.state.pointer, "data-ultra": levels.length > 1 && Math.round(index) === levels.length - 1, style, children: /* @__PURE__ */ jsxs("div", { className: "composer-thinking-range-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "composer-thinking-rail", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("span", { className: "composer-thinking-fill" }),
              /* @__PURE__ */ jsx("span", { className: "composer-thinking-gradient" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "composer-thinking-ticks", "aria-hidden": "true", children: levels.map((level2, i) => /* @__PURE__ */ jsx("span", { style: { left: (levels.length > 1 ? i / (levels.length - 1) * 100 : 0) + "%" } }, level2.id)) }),
            /* @__PURE__ */ jsx("span", { className: "composer-thinking-stars", "aria-hidden": "true", children: Array.from({ length: 12 }, (_, index2) => /* @__PURE__ */ jsx("span", {}, index2)) }),
            /* @__PURE__ */ jsx("span", { className: "composer-thinking-thumb-lane", "aria-hidden": "true", children: /* @__PURE__ */ jsx("span", { className: "composer-thinking-thumb" }) }),
            /* @__PURE__ */ jsx("input", { ref: this.range, className: "composer-thinking-input", type: "range", min: 0, max: Math.max(0, levels.length - 1), step: this.state.pointer ? "any" : 1, value: Math.max(0, index), disabled: blocked || levels.length < 2 || !valid, "aria-label": "\u601D\u8003\u5F3A\u5EA6", "aria-valuetext": level?.label || "\u5F53\u524D\u914D\u7F6E\u4E0D\u53EF\u7528", onChange: (event) => {
              if (scope()) this.preview(Number(event.currentTarget.value));
            }, onPointerDown: (event) => {
              if (scope()) this.pointerDown(event);
            }, onPointerMove: (event) => {
              if (scope()) this.pointerMove(event);
            }, onPointerUp: (event) => this.pointerEnd(event, !scope()), onPointerCancel: (event) => this.pointerEnd(event, true), onKeyUp: (event) => {
              if (scope() && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) void this.commit();
            }, onBlur: () => {
              if (scope() && !this.state.pointer) void this.commit();
            } })
          ] }) }),
          !valid ? /* @__PURE__ */ jsx("p", { className: "composer-model-error", role: "status", children: "\u5F53\u524D\u6A21\u578B\u6216\u601D\u8003\u7B49\u7EA7\u4E0D\u53EF\u7528\uFF0C\u8BF7\u660E\u786E\u9009\u62E9\u5DF2\u914D\u7F6E\u6A21\u578B\u3002" }) : null
        ] }),
        /* @__PURE__ */ jsx("div", { id: id + "-models", className: "composer-model-models-view", "data-expanded": this.state.modelsOpen, inert: !this.state.modelsOpen, "aria-hidden": !this.state.modelsOpen, children: /* @__PURE__ */ jsx("div", { role: "group", "aria-label": "\u5DF2\u914D\u7F6E\u6A21\u578B", children: models.map((row) => /* @__PURE__ */ jsxs("button", { type: "button", role: "menuitemradio", "aria-checked": current?.provider === row.provider.provider && current.model === row.model.model, disabled: blocked || !row.model.reasoning.levels.some((level2) => level2.id === row.model.reasoning.defaultLevel), className: "composer-model-option", onClick: () => {
          if (scope()) void this.chooseModel(row.provider.provider, row.model.model);
        }, children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: row.model.name }),
            /* @__PURE__ */ jsx("small", { children: row.provider.name })
          ] }),
          current?.provider === row.provider.provider && current.model === row.model.model ? /* @__PURE__ */ jsx(Icon, { name: "check", size: 15 }) : null
        ] }, JSON.stringify([row.provider.provider, row.model.model]))) }) }),
        this.state.saving ? /* @__PURE__ */ jsx("p", { className: "composer-model-note", role: "status", children: "\u6B63\u5728\u4FDD\u5B58\u2026" }) : error ? /* @__PURE__ */ jsx("p", { className: "composer-model-error", role: "alert", children: error }) : !models.length ? /* @__PURE__ */ jsx("p", { className: "composer-model-note", children: "\u8FD8\u6CA1\u6709\u53EF\u7528\u6A21\u578B\uFF0C\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u3002" }) : null
      ] })
    ] });
  }
}
export {
  ComposerModelMenu
};
