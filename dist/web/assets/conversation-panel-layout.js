import { jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { Icon } from "./ui.js";
const PANEL_VIEWS = [["collaboration", "\u534F\u4F5C\u7A7A\u95F4"], ["experiments", "\u5B9E\u9A8C\u6811"], ["files", "\u9879\u76EE\u76EE\u5F55"]];
const DEFAULT_PANEL_WIDTH = 320;
const MIN_PANEL_WIDTH = 280;
const PANEL_GAP = 14;
const MIN_CONVERSATION_WIDTH = 480;
function panelBounds(available) {
  return { stacked: available < MIN_CONVERSATION_WIDTH + MIN_PANEL_WIDTH + PANEL_GAP, max: Math.max(MIN_PANEL_WIDTH, Math.min(640, available - MIN_CONVERSATION_WIDTH - PANEL_GAP)) };
}
function clampPanelWidth(width, available) {
  return Math.max(MIN_PANEL_WIDTH, Math.min(panelBounds(available).max, width));
}
function readPanelPreference(projectId) {
  try {
    const value = JSON.parse(localStorage.getItem("pi-research-conversation-panel:" + projectId) ?? "{}");
    return { view: PANEL_VIEWS.some(([view]) => view === value.view) ? value.view : "collaboration", width: Number.isFinite(value.width) && value.width >= MIN_PANEL_WIDTH && value.width <= 640 ? value.width : DEFAULT_PANEL_WIDTH };
  } catch {
    return { view: "collaboration", width: DEFAULT_PANEL_WIDTH };
  }
}
function savePanelPreference(projectId, patch) {
  if (!projectId) return;
  try {
    localStorage.setItem("pi-research-conversation-panel:" + projectId, JSON.stringify({ ...readPanelPreference(projectId), ...patch }));
  } catch {
  }
}
class ConversationLayout extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { projectId: this.props.projectId, preferredWidth: readPanelPreference(this.props.projectId).width, available: 0, dragging: false };
    this.container = null;
    this.drag = null;
    this.measure = () => {
      if (!this.container) return;
      const available = this.container.clientWidth;
      if (available !== this.state.available) this.setState({ available, dragging: panelBounds(available).stacked ? false : this.state.dragging });
      if (panelBounds(available).stacked) this.drag = null;
    };
    this.setWidth = (width) => {
      const preferredWidth = clampPanelWidth(width, this.state.available);
      this.setState({ preferredWidth });
      savePanelPreference(this.props.projectId, { width: preferredWidth });
    };
    this.pointerDown = (event) => {
      if (event.button !== 0 || panelBounds(this.state.available).stacked) return;
      event.preventDefault();
      event.currentTarget.focus();
      this.drag = { pointerId: event.pointerId, x: event.clientX, width: clampPanelWidth(this.state.preferredWidth, this.state.available) };
      event.currentTarget.setPointerCapture(event.pointerId);
      this.setState({ dragging: true });
    };
    this.pointerMove = (event) => {
      if (this.drag?.pointerId === event.pointerId) this.setWidth(this.drag.width + this.drag.x - event.clientX);
    };
    this.pointerUp = (event) => {
      this.drag = null;
      this.setState({ dragging: false });
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    this.keyDown = (event) => {
      const bounds = panelBounds(this.state.available);
      if (bounds.stacked) return;
      const width = clampPanelWidth(this.state.preferredWidth, this.state.available), step = event.shiftKey ? 32 : 16;
      const next = event.key === "ArrowLeft" ? width + step : event.key === "ArrowRight" ? width - step : event.key === "Home" ? MIN_PANEL_WIDTH : event.key === "End" ? bounds.max : null;
      if (next !== null) {
        event.preventDefault();
        this.setWidth(next);
      }
    };
  }
  static getDerivedStateFromProps(props, state) {
    return props.projectId !== state.projectId ? { projectId: props.projectId, preferredWidth: readPanelPreference(props.projectId).width, dragging: false } : null;
  }
  componentDidMount() {
    this.measure();
    if (typeof ResizeObserver !== "undefined" && this.container) {
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(this.container);
    } else window.addEventListener("resize", this.measure);
  }
  componentDidUpdate(previous) {
    if (previous.projectId !== this.props.projectId || previous.active !== this.props.active) this.drag = null;
  }
  componentWillUnmount() {
    this.observer?.disconnect();
    if (!this.observer) window.removeEventListener("resize", this.measure);
  }
  render() {
    const { active } = this.props, { stacked, max } = panelBounds(this.state.available), width = clampPanelWidth(this.state.preferredWidth, this.state.available);
    return /* @__PURE__ */ jsxs("div", { ref: (node) => {
      this.container = node;
    }, className: "workbench-content" + (active ? " conversation-layout" + (stacked ? " is-stacked" : "") + (this.state.dragging ? " is-resizing" : "") : this.props.inspector ? " with-inspector" : ""), style: active ? { "--conversation-panel-width": width + "px" } : void 0, children: [
      this.props.children,
      /* @__PURE__ */ jsx("div", { hidden: !active || stacked, className: "conversation-resizer", role: "separator", "aria-label": "\u8C03\u6574\u53F3\u4FA7\u9762\u677F\u5BBD\u5EA6", "aria-orientation": "vertical", "aria-controls": "conversation-panel", "aria-valuemin": MIN_PANEL_WIDTH, "aria-valuemax": max, "aria-valuenow": width, "aria-valuetext": width + " \u50CF\u7D20", tabIndex: active && !stacked ? 0 : -1, title: "\u62D6\u52A8\u8C03\u6574\u5BBD\u5EA6\uFF1B\u53CC\u51FB\u6062\u590D\u9ED8\u8BA4\u5BBD\u5EA6", onPointerDown: this.pointerDown, onPointerMove: this.pointerMove, onPointerUp: this.pointerUp, onPointerCancel: this.pointerUp, onLostPointerCapture: this.pointerUp, onKeyDown: this.keyDown, onDoubleClick: () => {
        this.setState({ preferredWidth: DEFAULT_PANEL_WIDTH });
        savePanelPreference(this.props.projectId, { width: DEFAULT_PANEL_WIDTH });
      }, children: /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: /* @__PURE__ */ jsx(Icon, { name: "menu", size: 12 }) }) }),
      this.props.panel,
      this.props.inspector
    ] });
  }
}
export {
  ConversationLayout,
  DEFAULT_PANEL_WIDTH,
  MIN_CONVERSATION_WIDTH,
  MIN_PANEL_WIDTH,
  PANEL_GAP,
  PANEL_VIEWS,
  clampPanelWidth,
  panelBounds,
  readPanelPreference,
  savePanelPreference
};
