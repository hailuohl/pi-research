import * as React from 'react';
import { Icon } from './ui.js';

export type PanelView = 'collaboration' | 'experiments' | 'files';
export const PANEL_VIEWS: Array<[PanelView, string]> = [['collaboration', '协作空间'], ['experiments', '实验树'], ['files', '项目目录']];
export const DEFAULT_PANEL_WIDTH = 320;
export const MIN_PANEL_WIDTH = 280;
export const PANEL_GAP = 14;
export const MIN_CONVERSATION_WIDTH = 480;
export function panelBounds(available: number) {
    return { stacked: available < MIN_CONVERSATION_WIDTH + MIN_PANEL_WIDTH + PANEL_GAP, max: Math.max(MIN_PANEL_WIDTH, Math.min(640, available - MIN_CONVERSATION_WIDTH - PANEL_GAP)) };
}
export function clampPanelWidth(width: number, available: number) {
    return Math.max(MIN_PANEL_WIDTH, Math.min(panelBounds(available).max, width));
}
export function readPanelPreference(projectId: string): { view: PanelView; width: number } {
    try {
        const value = JSON.parse(localStorage.getItem('pi-research-conversation-panel:' + projectId) ?? '{}');
        return { view: PANEL_VIEWS.some(([view]) => view === value.view) ? value.view : 'collaboration', width: Number.isFinite(value.width) && value.width >= MIN_PANEL_WIDTH && value.width <= 640 ? value.width : DEFAULT_PANEL_WIDTH };
    } catch { return { view: 'collaboration', width: DEFAULT_PANEL_WIDTH }; }
}
export function savePanelPreference(projectId: string, patch: Partial<{ view: PanelView; width: number }>) {
    if (!projectId) return;
    try { localStorage.setItem('pi-research-conversation-panel:' + projectId, JSON.stringify({ ...readPanelPreference(projectId), ...patch })); } catch { /* Layout remains usable without browser storage. */ }
}

type Props = { projectId: string; active: boolean; children: React.ReactNode; panel: React.ReactNode; inspector: React.ReactNode };
type State = { projectId: string; preferredWidth: number; available: number; dragging: boolean };
export class ConversationLayout extends React.Component<Props, State> {
    state: State = { projectId: this.props.projectId, preferredWidth: readPanelPreference(this.props.projectId).width, available: 0, dragging: false };
    private container: HTMLDivElement | null = null;
    private observer?: ResizeObserver;
    private drag: { pointerId: number; x: number; width: number } | null = null;
    static getDerivedStateFromProps(props: Props, state: State) {
        return props.projectId !== state.projectId ? { projectId: props.projectId, preferredWidth: readPanelPreference(props.projectId).width, dragging: false } : null;
    }
    componentDidMount() {
        this.measure();
        if (typeof ResizeObserver !== 'undefined' && this.container) { this.observer = new ResizeObserver(this.measure); this.observer.observe(this.container); }
        else window.addEventListener('resize', this.measure);
    }
    componentDidUpdate(previous: Props) { if (previous.projectId !== this.props.projectId || previous.active !== this.props.active) this.drag = null; }
    componentWillUnmount() { this.observer?.disconnect(); if (!this.observer) window.removeEventListener('resize', this.measure); }
    private measure = () => {
        if (!this.container) return;
        const available = this.container.clientWidth;
        if (available !== this.state.available) this.setState({ available, dragging: panelBounds(available).stacked ? false : this.state.dragging });
        if (panelBounds(available).stacked) this.drag = null;
    };
    private setWidth = (width: number) => {
        const preferredWidth = clampPanelWidth(width, this.state.available);
        this.setState({ preferredWidth });
        savePanelPreference(this.props.projectId, { width: preferredWidth });
    };
    private pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || panelBounds(this.state.available).stacked) return;
        event.preventDefault(); event.currentTarget.focus();
        this.drag = { pointerId: event.pointerId, x: event.clientX, width: clampPanelWidth(this.state.preferredWidth, this.state.available) };
        event.currentTarget.setPointerCapture(event.pointerId); this.setState({ dragging: true });
    };
    private pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (this.drag?.pointerId === event.pointerId) this.setWidth(this.drag.width + this.drag.x - event.clientX);
    };
    private pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        this.drag = null; this.setState({ dragging: false });
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    };
    private keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const bounds = panelBounds(this.state.available);
        if (bounds.stacked) return;
        const width = clampPanelWidth(this.state.preferredWidth, this.state.available), step = event.shiftKey ? 32 : 16;
        const next = event.key === 'ArrowLeft' ? width + step : event.key === 'ArrowRight' ? width - step : event.key === 'Home' ? MIN_PANEL_WIDTH : event.key === 'End' ? bounds.max : null;
        if (next !== null) { event.preventDefault(); this.setWidth(next); }
    };
    render() {
        const { active } = this.props, { stacked, max } = panelBounds(this.state.available), width = clampPanelWidth(this.state.preferredWidth, this.state.available);
        return <div ref={node => { this.container = node; }} className={'workbench-content' + (active ? ' conversation-layout' + (stacked ? ' is-stacked' : '') + (this.state.dragging ? ' is-resizing' : '') : this.props.inspector ? ' with-inspector' : '')} style={active ? { '--conversation-panel-width': width + 'px' } as React.CSSProperties : undefined}>
            {this.props.children}
            <div hidden={!active || stacked} className="conversation-resizer" role="separator" aria-label="调整右侧面板宽度" aria-orientation="vertical" aria-controls="conversation-panel" aria-valuemin={MIN_PANEL_WIDTH} aria-valuemax={max} aria-valuenow={width} aria-valuetext={width + ' 像素'} tabIndex={active && !stacked ? 0 : -1} title="拖动调整宽度；双击恢复默认宽度" onPointerDown={this.pointerDown} onPointerMove={this.pointerMove} onPointerUp={this.pointerUp} onPointerCancel={this.pointerUp} onLostPointerCapture={this.pointerUp} onKeyDown={this.keyDown} onDoubleClick={() => { this.setState({ preferredWidth: DEFAULT_PANEL_WIDTH }); savePanelPreference(this.props.projectId, { width: DEFAULT_PANEL_WIDTH }); }}><span aria-hidden="true"><Icon name="menu" size={12}/></span></div>
            {this.props.panel}{this.props.inspector}
        </div>;
    }
}
