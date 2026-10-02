import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { number, short } from "./models.js";
import { Badge, Icon } from "./ui.js";
const EXPERIMENT_CARD_WIDTH = 224;
const EXPERIMENT_CARD_HEIGHT = 116;
const HORIZONTAL_GAP = 48;
const VERTICAL_GAP = 52;
const GRAPH_PADDING = 48;
function layoutExperiments(experiments) {
  const byId = new Map(experiments.map((experiment) => [experiment.id, experiment]));
  const parents = /* @__PURE__ */ new Map();
  const missingParents = /* @__PURE__ */ new Map();
  for (const experiment of experiments) {
    const parentId = experiment.parentId;
    if (!parentId) parents.set(experiment.id, null);
    else if (!byId.has(parentId)) {
      parents.set(experiment.id, null);
      missingParents.set(experiment.id, parentId);
    } else parents.set(experiment.id, parentId);
  }
  const checked = /* @__PURE__ */ new Set();
  const cycleNodes = /* @__PURE__ */ new Set();
  const brokenCycleRoots = /* @__PURE__ */ new Set();
  for (const experiment of experiments) {
    if (checked.has(experiment.id)) continue;
    const path = [];
    const pathIndex = /* @__PURE__ */ new Map();
    let current = experiment.id;
    while (current && !checked.has(current) && !pathIndex.has(current)) {
      pathIndex.set(current, path.length);
      path.push(current);
      current = parents.get(current) ?? null;
    }
    if (current && pathIndex.has(current)) {
      const cycle = path.slice(pathIndex.get(current));
      for (const id of cycle) cycleNodes.add(id);
      const root = cycle.reduce((first, id) => id < first ? id : first);
      parents.set(root, null);
      brokenCycleRoots.add(root);
    }
    for (const id of path) checked.add(id);
  }
  const children = new Map(experiments.map((experiment) => [experiment.id, []]));
  for (const experiment of experiments) {
    const parentId = parents.get(experiment.id);
    if (parentId) children.get(parentId)?.push(experiment.id);
  }
  const roots = experiments.filter((experiment) => parents.get(experiment.id) === null);
  const subtreeWidths = /* @__PURE__ */ new Map();
  for (const root of roots) {
    const stack = [{ id: root.id, visitChildren: false }];
    while (stack.length) {
      const item = stack.pop();
      const childIds = children.get(item.id) ?? [];
      if (!item.visitChildren) {
        stack.push({ id: item.id, visitChildren: true });
        for (let i = childIds.length - 1; i >= 0; i--) stack.push({ id: childIds[i], visitChildren: false });
        continue;
      }
      const childrenWidth = childIds.reduce((sum, id) => sum + subtreeWidths.get(id), 0) + Math.max(0, childIds.length - 1) * HORIZONTAL_GAP;
      subtreeWidths.set(item.id, Math.max(EXPERIMENT_CARD_WIDTH, childrenWidth));
    }
  }
  const positions = /* @__PURE__ */ new Map();
  const order = [];
  let rootLeft = GRAPH_PADDING;
  for (const root of roots) {
    const stack = [{ id: root.id, left: rootLeft, depth: 0 }];
    while (stack.length) {
      const item = stack.pop();
      const width = subtreeWidths.get(item.id) ?? EXPERIMENT_CARD_WIDTH;
      const childIds = children.get(item.id) ?? [];
      const childrenWidth = childIds.reduce((sum, id) => sum + (subtreeWidths.get(id) ?? EXPERIMENT_CARD_WIDTH), 0) + Math.max(0, childIds.length - 1) * HORIZONTAL_GAP;
      positions.set(item.id, {
        x: item.left + (width - EXPERIMENT_CARD_WIDTH) / 2,
        y: GRAPH_PADDING + item.depth * (EXPERIMENT_CARD_HEIGHT + VERTICAL_GAP),
        depth: item.depth
      });
      order.push(item.id);
      let childLeft = item.left + (width - childrenWidth) / 2;
      const childTasks = [];
      for (const childId of childIds) {
        childTasks.push({ id: childId, left: childLeft, depth: item.depth + 1 });
        childLeft += (subtreeWidths.get(childId) ?? EXPERIMENT_CARD_WIDTH) + HORIZONTAL_GAP;
      }
      for (let i = childTasks.length - 1; i >= 0; i--) stack.push(childTasks[i]);
    }
    rootLeft += (subtreeWidths.get(root.id) ?? EXPERIMENT_CARD_WIDTH) + HORIZONTAL_GAP;
  }
  const nodes = order.map((id) => {
    const position = positions.get(id);
    const experiment = byId.get(id);
    return {
      experiment,
      ...position,
      parentId: parents.get(id) ?? null,
      ...missingParents.has(id) ? { missingParentId: missingParents.get(id) } : {},
      inCycle: cycleNodes.has(id),
      brokenCycle: brokenCycleRoots.has(id)
    };
  });
  const edges = nodes.filter((node) => node.parentId).map((node) => ({ parentId: node.parentId, childId: node.experiment.id }));
  const deepestY = nodes.reduce((max, node) => Math.max(max, node.y), GRAPH_PADDING);
  return {
    nodes,
    edges,
    width: Math.max(EXPERIMENT_CARD_WIDTH + GRAPH_PADDING * 2, rootLeft - HORIZONTAL_GAP + GRAPH_PADDING),
    height: deepestY + EXPERIMENT_CARD_HEIGHT + GRAPH_PADDING
  };
}
const preferenceKey = (projectId) => `pi-research:experiment-graph:${projectId}:view`;
function readView(projectId) {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(preferenceKey(projectId)) === "list" ? "list" : "graph";
  } catch {
    return "graph";
  }
}
function saveView(projectId, view) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(preferenceKey(projectId), view);
  } catch {
  }
}
function structureSignature(experiments) {
  return JSON.stringify(experiments.map((experiment) => [experiment.id, experiment.parentId]));
}
function relationNote(node) {
  if (node.brokenCycle) return "\u5FAA\u73AF\u5173\u7CFB\u5F02\u5E38 \xB7 \u539F\u7236\u8FDE\u7EBF\u5DF2\u65AD\u5F00";
  if (node.inCycle) return "\u5173\u7CFB\u94FE\u5305\u542B\u5FAA\u73AF \xB7 \u5DF2\u65AD\u5F00\u5F02\u5E38\u8FDE\u7EBF";
  if (node.missingParentId) return `\u7236\u8282\u70B9\u7F3A\u5931 \xB7 ${short(node.missingParentId)}\uFF08\u4F5C\u4E3A\u6839\u8282\u70B9\u4FDD\u7559\uFF09`;
  return node.parentId ? `\u6D3E\u751F\u81EA ${short(node.parentId)}` : "\u57FA\u7EBF\u5B9E\u9A8C";
}
function metricPreview(runs) {
  for (let i = runs.length - 1; i >= 0; i--) {
    const run = runs[i];
    if (run.integrity !== "complete") continue;
    for (const [key, definition] of Object.entries(run.manifest.contract.metrics ?? {})) {
      const value = run.metrics?.[key];
      if (typeof value === "number" && Number.isFinite(value)) return `\u6700\u8FD1\u5B8C\u6574\u6307\u6807 \xB7 ${key} ${number(value)}${definition.unit ? ` ${definition.unit}` : ""}`;
    }
  }
  return "\u6682\u65E0\u6709\u6548\u6307\u6807";
}
function ExperimentCard({ node, runs, selected, onSelect, parentTitle, list = false }) {
  const experiment = node.experiment;
  const latestRun = runs[runs.length - 1];
  const metric = metricPreview(runs);
  const indent = `${Math.min(node.depth, 6) * 20}px`;
  const narrowIndent = `${Math.min(node.depth, 6) * 12}px`;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      className: `experiment-graph-card${!latestRun ? " is-unrun" : ""}${selected ? " is-selected" : ""}${list ? " is-list" : ""}`,
      "data-experiment-id": experiment.id,
      style: list ? { "--tree-indent": indent, "--tree-indent-narrow": narrowIndent } : void 0,
      "aria-pressed": selected,
      onPointerDown: (event) => event.stopPropagation(),
      onClick: () => onSelect(experiment.id),
      children: [
        /* @__PURE__ */ jsxs("span", { className: "experiment-graph-card-heading", children: [
          /* @__PURE__ */ jsxs("span", { className: "experiment-graph-title", children: [
            /* @__PURE__ */ jsx(Icon, { name: node.parentId ? "branch" : "experiment", size: 16 }),
            /* @__PURE__ */ jsx("strong", { children: experiment.title })
          ] }),
          /* @__PURE__ */ jsx(Badge, { value: experiment.lifecycle })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "experiment-graph-run", children: latestRun ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("span", { className: "experiment-graph-run-id", children: [
            "Run ",
            short(latestRun.id)
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "experiment-graph-run-badges", children: [
            /* @__PURE__ */ jsx(Badge, { value: latestRun.state }),
            /* @__PURE__ */ jsx(Badge, { value: latestRun.integrity })
          ] })
        ] }) : /* @__PURE__ */ jsx("span", { className: "experiment-graph-run-empty", children: "\u6682\u65E0\u8FD0\u884C" }) }),
        /* @__PURE__ */ jsx("span", { className: "experiment-graph-metric", title: metric, children: metric }),
        /* @__PURE__ */ jsx("span", { className: "experiment-graph-relation", children: (parentTitle ? `\u6D3E\u751F\u81EA ${parentTitle}` : relationNote(node)) + (experiment.researchBrief ? ` \xB7 \u7B2C${experiment.researchBrief.revision}\u7248\u8BA1\u5212` : " ").trimEnd() }),
        node.inCycle || node.missingParentId ? /* @__PURE__ */ jsx("span", { className: "experiment-graph-warning", role: "note", children: relationNote(node) }) : null
      ]
    }
  );
}
class ExperimentGraph extends React.Component {
  constructor() {
    super(...arguments);
    this.state = { view: readView(this.props.data.project.id), x: GRAPH_PADDING, y: GRAPH_PADDING, scale: 1, viewportWidth: 0, viewportHeight: 0 };
    this.viewport = null;
    this.drag = null;
    this.layoutCache = null;
    this.measureViewport = () => {
      if (!this.viewport) return;
      const viewportWidth = this.viewport.clientWidth;
      const viewportHeight = this.viewport.clientHeight;
      if (viewportWidth === this.state.viewportWidth && viewportHeight === this.state.viewportHeight) return;
      this.setState({ viewportWidth, viewportHeight }, this.fitAll);
    };
    this.fitAll = () => {
      const { viewportWidth, viewportHeight } = this.state;
      const layout = this.getLayout();
      if (!layout.nodes.length || !viewportWidth || !viewportHeight) return;
      const scale = Math.min(1.2, (viewportWidth - 40) / layout.width, (viewportHeight - 40) / layout.height);
      this.setState({ scale, x: (viewportWidth - layout.width * scale) / 2, y: (viewportHeight - layout.height * scale) / 2 });
    };
    this.zoom = (factor) => {
      const scale = Math.max(Number.EPSILON, Math.min(2.5, this.state.scale * factor));
      const centerX = this.state.viewportWidth / 2;
      const centerY = this.state.viewportHeight / 2;
      const ratio = scale / this.state.scale;
      this.setState({ scale, x: centerX - (centerX - this.state.x) * ratio, y: centerY - (centerY - this.state.y) * ratio });
    };
    this.selectView = (view) => {
      this.setState({ view }, () => saveView(this.props.data.project.id, view));
    };
    this.pointerDown = (event) => {
      if (event.button !== 0 || event.target !== event.currentTarget) return;
      this.drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: this.state.x, y: this.state.y };
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    this.pointerMove = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      this.setState({ x: this.drag.x + event.clientX - this.drag.clientX, y: this.drag.y + event.clientY - this.drag.clientY });
    };
    this.pointerUp = (event) => {
      if (!this.drag || event.pointerId !== this.drag.pointerId) return;
      this.drag = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    this.keyDown = (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Home") {
        event.preventDefault();
        this.fitAll();
      } else {
        const offsets = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] };
        const offset = offsets[event.key];
        if (offset) {
          event.preventDefault();
          this.setState((state) => ({ x: state.x + offset[0], y: state.y + offset[1] }));
        }
      }
    };
  }
  componentDidMount() {
    if (!this.viewport) return;
    this.measureViewport();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(this.measureViewport);
      this.observer.observe(this.viewport);
    } else if (typeof window !== "undefined") window.addEventListener("resize", this.measureViewport);
  }
  componentDidUpdate(previous) {
    if (previous.data.project.id !== this.props.data.project.id) {
      this.layoutCache = null;
      this.setState({ view: readView(this.props.data.project.id), x: GRAPH_PADDING, y: GRAPH_PADDING, scale: 1 }, this.fitAll);
    } else if (structureSignature(previous.data.experiments) !== structureSignature(this.props.data.experiments)) {
      this.layoutCache = null;
      this.fitAll();
    }
  }
  componentWillUnmount() {
    this.observer?.disconnect();
    if (!this.observer && typeof window !== "undefined") window.removeEventListener("resize", this.measureViewport);
  }
  getLayout() {
    const experiments = this.props.data.experiments;
    if (this.layoutCache?.source !== experiments) this.layoutCache = { source: experiments, layout: layoutExperiments(experiments) };
    return this.layoutCache.layout;
  }
  render() {
    const { data, selected, onSelect } = this.props;
    const layout = this.getLayout();
    const positioned = new Map(layout.nodes.map((node) => [node.experiment.id, node]));
    const byExperiment = new Map(data.experiments.map((experiment) => [experiment.id, []]));
    for (const run of data.runs) byExperiment.get(run.experimentId)?.push(run);
    const { view, x, y, scale } = this.state;
    return /* @__PURE__ */ jsxs("section", { className: "surface experiment-lineage", "aria-labelledby": "experiment-lineage-heading", children: [
      /* @__PURE__ */ jsxs("div", { className: "experiment-graph-toolbar", children: [
        /* @__PURE__ */ jsxs("div", { className: "experiment-graph-heading", children: [
          /* @__PURE__ */ jsx("h2", { id: "experiment-lineage-heading", children: "\u5B9E\u9A8C\u8840\u7F18" }),
          /* @__PURE__ */ jsx("span", { children: "\u62D6\u52A8\u753B\u5E03 \xB7 Home \u9002\u5E94\u5168\u90E8 \xB7 \u65B9\u5411\u952E\u5E73\u79FB" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "experiment-graph-controls", children: [
          /* @__PURE__ */ jsxs("div", { className: "experiment-graph-view-switch", role: "group", "aria-label": "\u5B9E\u9A8C\u8840\u7F18\u89C6\u56FE", children: [
            /* @__PURE__ */ jsx("button", { type: "button", "data-view-mode": "graph", "aria-pressed": view === "graph", onClick: () => this.selectView("graph"), children: "\u6811\u72B6\u56FE" }),
            /* @__PURE__ */ jsx("button", { type: "button", "data-view-mode": "list", "aria-pressed": view === "list", onClick: () => this.selectView("list"), children: "\u5217\u8868" })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u7F29\u5C0F", title: "\u7F29\u5C0F", disabled: view !== "graph", onClick: () => this.zoom(1 / 1.2), children: "\u2212" }),
          /* @__PURE__ */ jsx("button", { type: "button", "aria-label": "\u653E\u5927", title: "\u653E\u5927", disabled: view !== "graph", onClick: () => this.zoom(1.2), children: "+" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "experiment-graph-fit", onClick: this.fitAll, disabled: view !== "graph", children: "\u9002\u5E94\u5168\u90E8" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `experiment-graph-viewport${view === "list" ? " is-list-view" : ""}`,
          ref: (element) => {
            this.viewport = element;
          },
          role: "region",
          "aria-label": view === "graph" ? "\u5B9E\u9A8C\u8840\u7F18\u6811\u56FE" : "\u5B9E\u9A8C\u8840\u7F18\u5217\u8868",
          tabIndex: 0,
          onPointerDown: view === "graph" ? this.pointerDown : void 0,
          onPointerMove: view === "graph" ? this.pointerMove : void 0,
          onPointerUp: view === "graph" ? this.pointerUp : void 0,
          onPointerCancel: view === "graph" ? this.pointerUp : void 0,
          onLostPointerCapture: view === "graph" ? this.pointerUp : void 0,
          onKeyDown: view === "graph" ? this.keyDown : void 0,
          children: view === "graph" ? /* @__PURE__ */ jsxs("div", { className: "experiment-graph-world", style: { width: layout.width, height: layout.height, transform: `translate(${x}px, ${y}px) scale(${scale})` }, children: [
            /* @__PURE__ */ jsx("svg", { className: "experiment-graph-edges", width: layout.width, height: layout.height, "aria-hidden": "true", children: layout.edges.map((edge) => {
              const parent = positioned.get(edge.parentId);
              const child = positioned.get(edge.childId);
              const startX = parent.x + EXPERIMENT_CARD_WIDTH / 2;
              const startY = parent.y + EXPERIMENT_CARD_HEIGHT;
              const endX = child.x + EXPERIMENT_CARD_WIDTH / 2;
              const middleY = (startY + child.y) / 2;
              return /* @__PURE__ */ jsx("path", { d: `M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${child.y}` }, `${edge.parentId}:${edge.childId}`);
            }) }),
            layout.nodes.map((node) => /* @__PURE__ */ jsx("div", { className: "experiment-graph-positioned-node", style: { left: node.x, top: node.y }, children: /* @__PURE__ */ jsx(ExperimentCard, { node, parentTitle: node.parentId ? positioned.get(node.parentId)?.experiment.title : void 0, runs: byExperiment.get(node.experiment.id) ?? [], selected: selected === node.experiment.id, onSelect }) }, node.experiment.id))
          ] }) : /* @__PURE__ */ jsx("div", { className: "experiment-graph-list", children: layout.nodes.map((node) => /* @__PURE__ */ jsx(ExperimentCard, { node, parentTitle: node.parentId ? positioned.get(node.parentId)?.experiment.title : void 0, runs: byExperiment.get(node.experiment.id) ?? [], selected: selected === node.experiment.id, onSelect, list: true }, node.experiment.id)) })
        }
      )
    ] });
  }
}
export {
  EXPERIMENT_CARD_HEIGHT,
  EXPERIMENT_CARD_WIDTH,
  ExperimentGraph,
  layoutExperiments
};
