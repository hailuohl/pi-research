import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { label } from "./models.js";
/*! Lucide Icons and Contributors; ISC / Feather MIT.
 * Full licenses are shipped at /icons/LICENSE.lucide.txt.
 * Static glyphs from https://github.com/lucide-icons/lucide/tree/aace268b9be318c4f6d8a09a35139f860d07d9c5/icons
 * Key mappings follow docs/design/ui-redesign-2026-10-03/icon-sources.json;
 * additional check, stop (square), run (play), book-open, network, microscope and link use the same revision.
 */
const iconPaths = {
  "plus": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
    /* @__PURE__ */ jsx("path", { d: "M12 5v14" })
  ] }),
  "chat": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" }) }),
  "chat-empty": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M14 3h2" }),
    /* @__PURE__ */ jsx("path", { d: "M16 19h-2" }),
    /* @__PURE__ */ jsx("path", { d: "M2 12v-2" }),
    /* @__PURE__ */ jsx("path", { d: "M2 16v5.286a.71.71 0 0 0 1.212.502l1.149-1.149" }),
    /* @__PURE__ */ jsx("path", { d: "M20 19a2 2 0 0 0 2-2v-1" }),
    /* @__PURE__ */ jsx("path", { d: "M22 10v2" }),
    /* @__PURE__ */ jsx("path", { d: "M22 6V5a2 2 0 0 0-2-2" }),
    /* @__PURE__ */ jsx("path", { d: "M4 3a2 2 0 0 0-2 2v1" }),
    /* @__PURE__ */ jsx("path", { d: "M8 19h2" }),
    /* @__PURE__ */ jsx("path", { d: "M8 3h2" })
  ] }),
  "experiment": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" }),
    /* @__PURE__ */ jsx("path", { d: "M6.453 15h11.094" }),
    /* @__PURE__ */ jsx("path", { d: "M8.5 2h7" })
  ] }),
  "folder": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" }) }),
  "evidence": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" }),
    /* @__PURE__ */ jsx("path", { d: "M14 2v5a1 1 0 0 0 1 1h5" }),
    /* @__PURE__ */ jsx("path", { d: "M10 9H8" }),
    /* @__PURE__ */ jsx("path", { d: "M16 13H8" }),
    /* @__PURE__ */ jsx("path", { d: "M16 17H8" })
  ] }),
  "report": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M2 6h4" }),
    /* @__PURE__ */ jsx("path", { d: "M2 10h4" }),
    /* @__PURE__ */ jsx("path", { d: "M2 14h4" }),
    /* @__PURE__ */ jsx("path", { d: "M2 18h4" }),
    /* @__PURE__ */ jsx("rect", { width: "16", height: "20", x: "4", y: "2", rx: "2" }),
    /* @__PURE__ */ jsx("path", { d: "M9.5 8h5" }),
    /* @__PURE__ */ jsx("path", { d: "M9.5 12H16" }),
    /* @__PURE__ */ jsx("path", { d: "M9.5 16H14" })
  ] }),
  "settings": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M10 5H3" }),
    /* @__PURE__ */ jsx("path", { d: "M12 19H3" }),
    /* @__PURE__ */ jsx("path", { d: "M14 3v4" }),
    /* @__PURE__ */ jsx("path", { d: "M16 17v4" }),
    /* @__PURE__ */ jsx("path", { d: "M21 12h-9" }),
    /* @__PURE__ */ jsx("path", { d: "M21 19h-5" }),
    /* @__PURE__ */ jsx("path", { d: "M21 5h-7" }),
    /* @__PURE__ */ jsx("path", { d: "M8 10v4" }),
    /* @__PURE__ */ jsx("path", { d: "M8 12H3" })
  ] }),
  "search": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "m21 21-4.34-4.34" }),
    /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "8" })
  ] }),
  "arrow": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M5 12h14" }),
    /* @__PURE__ */ jsx("path", { d: "m12 5 7 7-7 7" })
  ] }),
  "close": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M18 6 6 18" }),
    /* @__PURE__ */ jsx("path", { d: "m6 6 12 12" })
  ] }),
  "chevron": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "m9 18 6-6-6-6" }) }),
  "branch": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M15 6a9 9 0 0 0-9 9V3" }),
    /* @__PURE__ */ jsx("circle", { cx: "18", cy: "6", r: "3" }),
    /* @__PURE__ */ jsx("circle", { cx: "6", cy: "18", r: "3" })
  ] }),
  "edit": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }),
    /* @__PURE__ */ jsx("path", { d: "m15 5 4 4" })
  ] }),
  "skills": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" }) }),
  "resources": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" }) }),
  "filter": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M2 5h20" }),
    /* @__PURE__ */ jsx("path", { d: "M6 12h12" }),
    /* @__PURE__ */ jsx("path", { d: "M9 19h6" })
  ] }),
  "menu": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M4 5h16" }),
    /* @__PURE__ */ jsx("path", { d: "M4 12h16" }),
    /* @__PURE__ */ jsx("path", { d: "M4 19h16" })
  ] }),
  "archive": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }),
    /* @__PURE__ */ jsx("path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }),
    /* @__PURE__ */ jsx("path", { d: "M10 12h4" })
  ] }),
  "database": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }),
    /* @__PURE__ */ jsx("path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }),
    /* @__PURE__ */ jsx("path", { d: "M3 12A9 3 0 0 0 21 12" })
  ] }),
  "paperclip": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" }) }),
  "cpu": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M12 20v2" }),
    /* @__PURE__ */ jsx("path", { d: "M12 2v2" }),
    /* @__PURE__ */ jsx("path", { d: "M17 20v2" }),
    /* @__PURE__ */ jsx("path", { d: "M17 2v2" }),
    /* @__PURE__ */ jsx("path", { d: "M2 12h2" }),
    /* @__PURE__ */ jsx("path", { d: "M2 17h2" }),
    /* @__PURE__ */ jsx("path", { d: "M2 7h2" }),
    /* @__PURE__ */ jsx("path", { d: "M20 12h2" }),
    /* @__PURE__ */ jsx("path", { d: "M20 17h2" }),
    /* @__PURE__ */ jsx("path", { d: "M20 7h2" }),
    /* @__PURE__ */ jsx("path", { d: "M7 20v2" }),
    /* @__PURE__ */ jsx("path", { d: "M7 2v2" }),
    /* @__PURE__ */ jsx("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2" }),
    /* @__PURE__ */ jsx("rect", { x: "8", y: "8", width: "8", height: "8", rx: "1" })
  ] }),
  "book-open": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M12 5v16" }),
    /* @__PURE__ */ jsx("path", { d: "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" })
  ] }),
  "network": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }),
    /* @__PURE__ */ jsx("rect", { x: "2", y: "16", width: "6", height: "6", rx: "1" }),
    /* @__PURE__ */ jsx("rect", { x: "9", y: "2", width: "6", height: "6", rx: "1" }),
    /* @__PURE__ */ jsx("path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }),
    /* @__PURE__ */ jsx("path", { d: "M12 12V8" })
  ] }),
  "microscope": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M6 18h8" }),
    /* @__PURE__ */ jsx("path", { d: "M3 22h18" }),
    /* @__PURE__ */ jsx("path", { d: "M14 22a7 7 0 1 0 0-14h-1" }),
    /* @__PURE__ */ jsx("path", { d: "M9 14h2" }),
    /* @__PURE__ */ jsx("path", { d: "M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" }),
    /* @__PURE__ */ jsx("path", { d: "M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" })
  ] }),
  "link": /* @__PURE__ */ jsxs("g", { children: [
    /* @__PURE__ */ jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
    /* @__PURE__ */ jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })
  ] }),
  "check": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M20 6 9 17l-5-5" }) }),
  "stop": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }) }),
  "run": /* @__PURE__ */ jsx("g", { children: /* @__PURE__ */ jsx("path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }) })
};
function Icon({ name, size = 18 }) {
  return /* @__PURE__ */ jsx("svg", { className: "ui-icon", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false", children: iconPaths[name] ?? iconPaths.report });
}
function Badge({ value, caption }) {
  return /* @__PURE__ */ jsx("span", { className: "badge s-" + value, children: caption ?? label(value) });
}
function Empty({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "empty", children: [
    /* @__PURE__ */ jsx("div", { className: "empty-symbol", children: /* @__PURE__ */ jsx(Icon, { name: "experiment", size: 30 }) }),
    /* @__PURE__ */ jsx("h3", { children: title }),
    /* @__PURE__ */ jsx("div", { className: "muted", children })
  ] });
}
function SectionTitle({ title, sub, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "section-title", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { children: title }),
      sub ? /* @__PURE__ */ jsx("p", { children: sub }) : null
    ] }),
    /* @__PURE__ */ jsx("div", { className: "actions", children })
  ] });
}
class Modal extends React.Component {
  constructor() {
    super(...arguments);
    this.el = null;
    this.previous = null;
  }
  componentDidMount() {
    this.previous = document.activeElement;
    this.el?.querySelector("input,textarea,select,button")?.focus();
  }
  componentWillUnmount() {
    this.previous?.focus?.();
  }
  render() {
    return /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onMouseDown: (e) => {
      if (e.target === e.currentTarget)
        this.props.onClose();
    }, children: /* @__PURE__ */ jsxs("section", { ref: (el) => {
      this.el = el;
    }, role: "dialog", "aria-modal": "true", "aria-label": this.props.title, className: "modal " + (this.props.wide ? "wide" : ""), onKeyDown: (e) => {
      if (e.key === "Escape")
        this.props.onClose();
      if (e.key === "Tab") {
        const els = Array.from(this.el.querySelectorAll("button:not(:disabled),input,select,textarea"));
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }, children: [
      /* @__PURE__ */ jsxs("header", { children: [
        /* @__PURE__ */ jsx("h2", { children: this.props.title }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "icon-button", "aria-label": "\u5173\u95ED\u5BF9\u8BDD\u6846", onClick: this.props.onClose, children: /* @__PURE__ */ jsx(Icon, { name: "close" }) })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        this.props.onSubmit(new FormData(e.currentTarget));
      }, children: [
        /* @__PURE__ */ jsx("div", { className: "form-body", children: this.props.children }),
        /* @__PURE__ */ jsxs("footer", { children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: "secondary", onClick: this.props.onClose, children: "\u53D6\u6D88" }),
          /* @__PURE__ */ jsx("button", { className: "primary", disabled: this.props.busy, children: this.props.busy ? "\u6B63\u5728\u5904\u7406\u2026" : this.props.submitLabel })
        ] })
      ] })
    ] }) });
  }
}
export {
  Badge,
  Empty,
  Icon,
  Modal,
  SectionTitle
};
