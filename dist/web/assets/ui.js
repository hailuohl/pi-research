import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { label } from "./models.js";
function Icon({ name, size = 18 }) {
  const paths = { chat: /* @__PURE__ */ jsx("path", { d: "M4 4h16v12H9l-5 4z" }), experiment: /* @__PURE__ */ jsx("path", { d: "M9 3h6m-5 0v6L4 20h16L14 9V3M7 15h10" }), folder: /* @__PURE__ */ jsx("path", { d: "M3 6h7l2 2h9v12H3z" }), evidence: /* @__PURE__ */ jsx("path", { d: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" }), report: /* @__PURE__ */ jsx("path", { d: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h4" }), settings: /* @__PURE__ */ jsx("path", { d: "M4 7h16M4 17h16M8 4v6M16 14v6" }), plus: /* @__PURE__ */ jsx("path", { d: "M12 5v14M5 12h14" }), search: /* @__PURE__ */ jsx("path", { d: "M15 15l6 6M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14" }), arrow: /* @__PURE__ */ jsx("path", { d: "M5 12h14M13 6l6 6-6 6" }), close: /* @__PURE__ */ jsx("path", { d: "m6 6 12 12M6 18 18 6" }), check: /* @__PURE__ */ jsx("path", { d: "m5 12 4 4L19 6" }), stop: /* @__PURE__ */ jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }), chevron: /* @__PURE__ */ jsx("path", { d: "m8 4 8 8-8 8" }), branch: /* @__PURE__ */ jsx("path", { d: "M6 4v16M6 10h6c4 0 6-2 6-6M3 4h6M3 20h6M15 4h6" }), run: /* @__PURE__ */ jsx("path", { d: "m7 4 14 8-14 8z" }) };
  return /* @__PURE__ */ jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: paths[name] ?? paths.report });
}
function Badge({ value }) {
  return /* @__PURE__ */ jsx("span", { className: "badge s-" + value, children: label(value) });
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
