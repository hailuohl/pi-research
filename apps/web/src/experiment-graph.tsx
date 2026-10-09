import * as React from 'react';
import type { Experiment, ProjectState, Row, Run } from './models.js';
import { number, short } from './models.js';
import { Badge, Icon } from './ui.js';

export const EXPERIMENT_CARD_WIDTH = 224;
export const EXPERIMENT_CARD_HEIGHT = 116;
const HORIZONTAL_GAP = 48;
const VERTICAL_GAP = 52;
const GRAPH_PADDING = 48;

export type ExperimentGraphNode = {
    experiment: Row<Experiment>;
    x: number;
    y: number;
    depth: number;
    parentId: string | null;
    missingParentId?: string;
    inCycle: boolean;
    brokenCycle: boolean;
};

export type ExperimentGraphEdge = { parentId: string; childId: string };
export type ExperimentGraphLayout = {
    nodes: ExperimentGraphNode[];
    edges: ExperimentGraphEdge[];
    width: number;
    height: number;
};

export function layoutExperiments(experiments: Row<Experiment>[]): ExperimentGraphLayout {
    const byId = new Map(experiments.map(experiment => [experiment.id, experiment]));
    const parents = new Map<string, string | null>();
    const missingParents = new Map<string, string>();
    for (const experiment of experiments) {
        const parentId = experiment.parentId;
        if (!parentId) parents.set(experiment.id, null);
        else if (!byId.has(parentId)) {
            parents.set(experiment.id, null);
            missingParents.set(experiment.id, parentId);
        } else parents.set(experiment.id, parentId);
    }

    const checked = new Set<string>();
    const cycleNodes = new Set<string>();
    const brokenCycleRoots = new Set<string>();
    for (const experiment of experiments) {
        if (checked.has(experiment.id)) continue;
        const path: string[] = [];
        const pathIndex = new Map<string, number>();
        let current: string | null = experiment.id;
        while (current && !checked.has(current) && !pathIndex.has(current)) {
            pathIndex.set(current, path.length);
            path.push(current);
            current = parents.get(current) ?? null;
        }
        if (current && pathIndex.has(current)) {
            const cycle = path.slice(pathIndex.get(current)!);
            for (const id of cycle) cycleNodes.add(id);
            const root = cycle.reduce((first, id) => id < first ? id : first);
            parents.set(root, null);
            brokenCycleRoots.add(root);
        }
        for (const id of path) checked.add(id);
    }

    const children = new Map<string, string[]>(experiments.map(experiment => [experiment.id, []]));
    for (const experiment of experiments) {
        const parentId = parents.get(experiment.id);
        if (parentId) children.get(parentId)?.push(experiment.id);
    }
    const roots = experiments.filter(experiment => parents.get(experiment.id) === null);
    const subtreeWidths = new Map<string, number>();
    for (const root of roots) {
        const stack: Array<{ id: string; visitChildren: boolean }> = [{ id: root.id, visitChildren: false }];
        while (stack.length) {
            const item = stack.pop()!;
            const childIds = children.get(item.id) ?? [];
            if (!item.visitChildren) {
                stack.push({ id: item.id, visitChildren: true });
                for (let i = childIds.length - 1; i >= 0; i--) stack.push({ id: childIds[i], visitChildren: false });
                continue;
            }
            const childrenWidth = childIds.reduce((sum, id) => sum + subtreeWidths.get(id)!, 0) + Math.max(0, childIds.length - 1) * HORIZONTAL_GAP;
            subtreeWidths.set(item.id, Math.max(EXPERIMENT_CARD_WIDTH, childrenWidth));
        }
    }

    const positions = new Map<string, { x: number; y: number; depth: number }>();
    const order: string[] = [];
    let rootLeft = GRAPH_PADDING;
    for (const root of roots) {
        const stack: Array<{ id: string; left: number; depth: number }> = [{ id: root.id, left: rootLeft, depth: 0 }];
        while (stack.length) {
            const item = stack.pop()!;
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
            const childTasks: Array<{ id: string; left: number; depth: number }> = [];
            for (const childId of childIds) {
                childTasks.push({ id: childId, left: childLeft, depth: item.depth + 1 });
                childLeft += (subtreeWidths.get(childId) ?? EXPERIMENT_CARD_WIDTH) + HORIZONTAL_GAP;
            }
            for (let i = childTasks.length - 1; i >= 0; i--) stack.push(childTasks[i]);
        }
        rootLeft += (subtreeWidths.get(root.id) ?? EXPERIMENT_CARD_WIDTH) + HORIZONTAL_GAP;
    }

    const nodes = order.map(id => {
        const position = positions.get(id)!;
        const experiment = byId.get(id)!;
        return {
            experiment,
            ...position,
            parentId: parents.get(id) ?? null,
            ...(missingParents.has(id) ? { missingParentId: missingParents.get(id)! } : {}),
            inCycle: cycleNodes.has(id),
            brokenCycle: brokenCycleRoots.has(id)
        };
    });
    const edges = nodes.filter(node => node.parentId).map(node => ({ parentId: node.parentId!, childId: node.experiment.id }));
    const deepestY = nodes.reduce((max, node) => Math.max(max, node.y), GRAPH_PADDING);
    return {
        nodes,
        edges,
        width: Math.max(EXPERIMENT_CARD_WIDTH + GRAPH_PADDING * 2, rootLeft - HORIZONTAL_GAP + GRAPH_PADDING),
        height: deepestY + EXPERIMENT_CARD_HEIGHT + GRAPH_PADDING
    };
}

type GraphView = 'graph' | 'list';
type Props = { data: ProjectState; selected: string; onSelect: (id: string) => void; preserveViewportOnResize?: boolean; headingId?: string };
type State = { view: GraphView; x: number; y: number; scale: number; viewportWidth: number; viewportHeight: number };
type Drag = { pointerId: number; clientX: number; clientY: number; x: number; y: number };

const preferenceKey = (projectId: string) => `pi-research:experiment-graph:${projectId}:view`;
function readView(projectId: string): GraphView {
    try {
        return typeof window !== 'undefined' && window.localStorage.getItem(preferenceKey(projectId)) === 'list' ? 'list' : 'graph';
    } catch { return 'graph'; }
}
function saveView(projectId: string, view: GraphView) {
    try { if (typeof window !== 'undefined') window.localStorage.setItem(preferenceKey(projectId), view); } catch { /* storage can be unavailable */ }
}
function structureSignature(experiments: Row<Experiment>[]) {
    return JSON.stringify(experiments.map(experiment => [experiment.id, experiment.parentId]));
}

function relationNote(node: ExperimentGraphNode) {
    if (node.brokenCycle) return '循环关系异常 · 原父连线已断开';
    if (node.inCycle) return '关系链包含循环 · 已断开异常连线';
    if (node.missingParentId) return `父节点缺失 · ${short(node.missingParentId)}（作为根节点保留）`;
    return node.parentId ? `派生自 ${short(node.parentId)}` : '基线实验';
}

function metricPreview(runs: Row<Run>[]) {
    for (let i = runs.length - 1; i >= 0; i--) {
        const run = runs[i];
        if (run.integrity !== 'complete') continue;
        for (const [key, definition] of Object.entries(run.manifest.contract.metrics ?? {})) {
            const value = run.metrics?.[key];
            if (typeof value === 'number' && Number.isFinite(value)) return `最近完整指标 · ${key} ${number(value)}${definition.unit ? ` ${definition.unit}` : ''}`;
        }
    }
    return '暂无有效指标';
}

function ExperimentCard({ node, runs, selected, onSelect, parentTitle, list = false }: {
    node: ExperimentGraphNode;
    runs: Row<Run>[];
    selected: boolean;
    onSelect: (id: string) => void;
    parentTitle?: string;
    list?: boolean;
}) {
    const experiment = node.experiment;
    const latestRun = runs[runs.length - 1];
    const metric = metricPreview(runs);
    const indent = `${Math.min(node.depth, 6) * 20}px`;
    const narrowIndent = `${Math.min(node.depth, 6) * 12}px`;
    return <button
        type="button"
        className={`experiment-graph-card${!latestRun?' is-unrun':''}${selected ? ' is-selected' : ''}${list ? ' is-list' : ''}`}
        data-experiment-id={experiment.id}
        style={list ? { '--tree-indent': indent, '--tree-indent-narrow': narrowIndent } as React.CSSProperties : undefined}
        aria-pressed={selected}
        onPointerDown={event => event.stopPropagation()}
        onClick={() => onSelect(experiment.id)}
    >
        <span className="experiment-graph-card-heading">
            <span className="experiment-graph-title"><Icon name={node.parentId ? 'branch' : 'experiment'} size={16}/><strong>{experiment.title}</strong></span>
            <Badge value={experiment.lifecycle}/>
        </span>
        <span className="experiment-graph-run">
            {latestRun ? <>
                <span className="experiment-graph-run-id">Run {short(latestRun.id)}</span>
                <span className="experiment-graph-run-badges"><Badge value={latestRun.state}/><Badge value={latestRun.integrity}/></span>
            </> : <span className="experiment-graph-run-empty">暂无运行</span>}
        </span>
        <span className="experiment-graph-metric" title={metric}>{metric}</span>
        <span className="experiment-graph-relation">{(parentTitle?`派生自 ${parentTitle}`:relationNote(node))+(experiment.researchBrief?` · 第${experiment.researchBrief.revision}版计划`:" ").trimEnd()}</span>
        {node.inCycle || node.missingParentId ? <span className="experiment-graph-warning" role="note">{relationNote(node)}</span> : null}
    </button>;
}

export class ExperimentGraph extends React.Component<Props, State> {
    state: State = { view: readView(this.props.data.project.id), x: GRAPH_PADDING, y: GRAPH_PADDING, scale: 1, viewportWidth: 0, viewportHeight: 0 };
    private viewport: HTMLDivElement | null = null;
    private observer?: ResizeObserver;
    private drag: Drag | null = null;
    private layoutCache: { source: Row<Experiment>[]; layout: ExperimentGraphLayout } | null = null;
    private fittedViewport = false;

    componentDidMount() {
        if (!this.viewport) return;
        this.measureViewport();
        if (typeof ResizeObserver !== 'undefined') {
            this.observer = new ResizeObserver(this.measureViewport);
            this.observer.observe(this.viewport);
        } else if (typeof window !== 'undefined') window.addEventListener('resize', this.measureViewport);
    }

    componentDidUpdate(previous: Props) {
        if (previous.data.project.id !== this.props.data.project.id) {
            this.layoutCache = null;
            this.fittedViewport = false;
            this.setState({ view: readView(this.props.data.project.id), x: GRAPH_PADDING, y: GRAPH_PADDING, scale: 1 }, this.fitAll);
        } else if (structureSignature(previous.data.experiments) !== structureSignature(this.props.data.experiments)) {
            this.layoutCache = null;
            this.fitAll();
        }
    }

    componentWillUnmount() {
        this.observer?.disconnect();
        if (!this.observer && typeof window !== 'undefined') window.removeEventListener('resize', this.measureViewport);
    }

    private getLayout() {
        const experiments = this.props.data.experiments;
        if (this.layoutCache?.source !== experiments) this.layoutCache = { source: experiments, layout: layoutExperiments(experiments) };
        return this.layoutCache.layout;
    }

    private measureViewport = () => {
        if (!this.viewport) return;
        const viewportWidth = this.viewport.clientWidth;
        const viewportHeight = this.viewport.clientHeight;
        if (viewportWidth === this.state.viewportWidth && viewportHeight === this.state.viewportHeight) return;
        this.setState({ viewportWidth, viewportHeight }, () => {
            if (!this.props.preserveViewportOnResize || !this.fittedViewport) this.fitAll();
        });
    };

    private fitAll = () => {
        const { viewportWidth, viewportHeight } = this.state;
        const layout = this.getLayout();
        if (!layout.nodes.length || !viewportWidth || !viewportHeight) return;
        this.fittedViewport = true;
        const scale = Math.min(1.2, (viewportWidth - 40) / layout.width, (viewportHeight - 40) / layout.height);
        this.setState({ scale, x: (viewportWidth - layout.width * scale) / 2, y: (viewportHeight - layout.height * scale) / 2 });
    };

    private zoom = (factor: number) => {
        const scale = Math.max(Number.EPSILON, Math.min(2.5, this.state.scale * factor));
        const centerX = this.state.viewportWidth / 2;
        const centerY = this.state.viewportHeight / 2;
        const ratio = scale / this.state.scale;
        this.setState({ scale, x: centerX - (centerX - this.state.x) * ratio, y: centerY - (centerY - this.state.y) * ratio });
    };

    private selectView = (view: GraphView) => {
        this.setState({ view }, () => saveView(this.props.data.project.id, view));
    };

    private pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || event.target !== event.currentTarget) return;
        this.drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: this.state.x, y: this.state.y };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    private pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        this.setState({ x: this.drag.x + event.clientX - this.drag.clientX, y: this.drag.y + event.clientY - this.drag.clientY });
    };

    private pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!this.drag || event.pointerId !== this.drag.pointerId) return;
        this.drag = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };

    private keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Home') {
            event.preventDefault();
            this.fitAll();
        } else {
            const offsets: Record<string, [number, number]> = { ArrowLeft: [48, 0], ArrowRight: [-48, 0], ArrowUp: [0, 48], ArrowDown: [0, -48] };
            const offset = offsets[event.key];
            if (offset) {
                event.preventDefault();
                this.setState(state => ({ x: state.x + offset[0], y: state.y + offset[1] }));
            }
        }
    };

    render() {
        const { data, selected, onSelect } = this.props;
        const layout = this.getLayout();
        const positioned = new Map(layout.nodes.map(node => [node.experiment.id, node]));
        const byExperiment = new Map<string, Row<Run>[]>(data.experiments.map(experiment => [experiment.id, []]));
        for (const run of data.runs) byExperiment.get(run.experimentId)?.push(run);
        const { view, x, y, scale } = this.state;
        const headingId = this.props.headingId ?? 'experiment-lineage-heading';
        return <section className="surface experiment-lineage" aria-labelledby={headingId}>
            <div className="experiment-graph-toolbar">
                <div className="experiment-graph-heading">
                    <h2 id={headingId}>实验血缘</h2>
                    <span>拖动画布 · Home 适应全部 · 方向键平移</span>
                </div>
                <div className="experiment-graph-controls">
                    <div className="experiment-graph-view-switch" role="group" aria-label="实验血缘视图">
                        <button type="button" data-view-mode="graph" aria-pressed={view === 'graph'} onClick={() => this.selectView('graph')}>树状图</button>
                        <button type="button" data-view-mode="list" aria-pressed={view === 'list'} onClick={() => this.selectView('list')}>列表</button>
                    </div>
                    <button type="button" aria-label="缩小" title="缩小" disabled={view !== 'graph'} onClick={() => this.zoom(1 / 1.2)}>−</button>
                    <button type="button" aria-label="放大" title="放大" disabled={view !== 'graph'} onClick={() => this.zoom(1.2)}>+</button>
                    <button type="button" className="experiment-graph-fit" onClick={this.fitAll} disabled={view !== 'graph'}>适应全部</button>
                </div>
            </div>
            <div
                className={`experiment-graph-viewport${view === 'list' ? ' is-list-view' : ''}`}
                ref={element => { this.viewport = element; }}
                role="region"
                aria-label={view === 'graph' ? '实验血缘树图' : '实验血缘列表'}
                tabIndex={0}
                onPointerDown={view === 'graph' ? this.pointerDown : undefined}
                onPointerMove={view === 'graph' ? this.pointerMove : undefined}
                onPointerUp={view === 'graph' ? this.pointerUp : undefined}
                onPointerCancel={view === 'graph' ? this.pointerUp : undefined}
                onLostPointerCapture={view === 'graph' ? this.pointerUp : undefined}
                onKeyDown={view === 'graph' ? this.keyDown : undefined}
            >
                {view === 'graph' ? <div className="experiment-graph-world" style={{ width: layout.width, height: layout.height, transform: `translate(${x}px, ${y}px) scale(${scale})` }}>
                    <svg className="experiment-graph-edges" width={layout.width} height={layout.height} aria-hidden="true">
                        {layout.edges.map(edge => {
                            const parent = positioned.get(edge.parentId)!;
                            const child = positioned.get(edge.childId)!;
                            const startX = parent.x + EXPERIMENT_CARD_WIDTH / 2;
                            const startY = parent.y + EXPERIMENT_CARD_HEIGHT;
                            const endX = child.x + EXPERIMENT_CARD_WIDTH / 2;
                            const middleY = (startY + child.y) / 2;
                            return <path key={`${edge.parentId}:${edge.childId}`} d={`M ${startX} ${startY} C ${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${child.y}`}/>;
                        })}
                    </svg>
                    {layout.nodes.map(node => <div className="experiment-graph-positioned-node" key={node.experiment.id} style={{ left: node.x, top: node.y }}>
                        <ExperimentCard node={node} parentTitle={node.parentId?positioned.get(node.parentId)?.experiment.title:undefined} runs={byExperiment.get(node.experiment.id) ?? []} selected={selected === node.experiment.id} onSelect={onSelect}/>
                    </div>)}
                </div> : <div className="experiment-graph-list">
                    {layout.nodes.map(node => <ExperimentCard key={node.experiment.id} node={node} parentTitle={node.parentId?positioned.get(node.parentId)?.experiment.title:undefined} runs={byExperiment.get(node.experiment.id) ?? []} selected={selected === node.experiment.id} onSelect={onSelect} list/>)}
                </div>}
            </div>
        </section>;
    }
}
