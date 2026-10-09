import * as React from 'react';
import { api } from './api.js';
import { ExperimentGraph } from './experiment-graph.js';
import { Icon } from './ui.js';
import type { ProjectState } from './models.js';
import { PANEL_VIEWS, readPanelPreference, savePanelPreference, type PanelView } from './conversation-panel-layout.js';

type FileEntry = { path: string; size: number };
type FileNode = { name: string; path: string; file?: FileEntry; children: Map<string, FileNode> };
export function projectFileTree(files: FileEntry[]): FileNode[] {
    const root = new Map<string, FileNode>();
    for (const file of files) {
        const parts = file.path.split('/');
        if (parts.some(part => !part || part === '.' || part === '..' || part.includes('\\'))) continue;
        let children = root;
        for (let i = 0; i < parts.length; i++) {
            const name = parts[i];
            if (!children.has(name)) children.set(name, { name, path: parts.slice(0, i + 1).join('/'), children: new Map() });
            const node = children.get(name)!;
            if (i === parts.length - 1) node.file = file;
            children = node.children;
        }
    }
    return [...root.values()];
}
type FileProps = { projectId: string; active: boolean; onWorkspace: () => void };
type FileState = { files: FileEntry[]; loaded: boolean; loading: boolean; error: string; path: string; content: string; fileLoading: boolean; fileError: string };
export class ConversationFiles extends React.Component<FileProps, FileState> {
    state: FileState = { files: [], loaded: false, loading: false, error: '', path: '', content: '', fileLoading: false, fileError: '' };
    private listController?: AbortController;
    private fileController?: AbortController;
    private mounted = false;
    componentDidMount() { this.mounted = true; if (this.props.active) void this.loadFiles(); }
    componentDidUpdate(previous: FileProps) {
        if (previous.projectId !== this.props.projectId) {
            this.cancelReads();
            this.setState({ files: [], loaded: false, loading: false, error: '', path: '', content: '', fileLoading: false, fileError: '' }, () => { if (this.props.active) void this.loadFiles(); });
        } else if (previous.active && !this.props.active) { this.cancelReads(); this.setState({ loading: false, fileLoading: false, fileError: this.state.fileLoading ? '文件读取已暂停，请重试。' : this.state.fileError }); }
        else if (!previous.active && this.props.active && !this.state.loaded) void this.loadFiles();
    }
    componentWillUnmount() { this.mounted = false; this.cancelReads(); }
    private cancelReads() { this.listController?.abort(); this.fileController?.abort(); }
    async loadFiles() {
        this.listController?.abort();
        const controller = new AbortController(), projectId = this.props.projectId;
        this.listController = controller; this.setState({ loading: true, error: '' });
        const current = () => this.mounted && this.props.active && this.props.projectId === projectId && this.listController === controller && !controller.signal.aborted;
        try {
            const files = await api<FileEntry[]>(`/projects/${encodeURIComponent(projectId)}/files`, undefined, 'GET', controller.signal);
            if (!Array.isArray(files) || files.some(file => typeof file.path !== 'string' || typeof file.size !== 'number')) throw Error('项目目录返回了无效清单');
            if (current()) this.setState({ files, loaded: true, loading: false });
        } catch (error) { if (current()) this.setState({ loading: false, error: error instanceof Error ? error.message : '项目目录读取失败' }); }
    }
    async openFile(path: string) {
        if (!this.props.active || !this.state.files.some(file => file.path === path)) return;
        this.fileController?.abort();
        const controller = new AbortController(), projectId = this.props.projectId;
        this.fileController = controller; this.setState({ path, content: '', fileLoading: true, fileError: '' });
        const current = () => this.mounted && this.props.active && this.props.projectId === projectId && this.fileController === controller && !controller.signal.aborted;
        try {
            const file = await api<{ content: string }>(`/projects/${encodeURIComponent(projectId)}/files?path=${encodeURIComponent(path)}`, undefined, 'GET', controller.signal);
            if (typeof file.content !== 'string') throw Error('此文件不能以文本预览');
            if (current()) this.setState({ content: file.content, fileLoading: false });
        } catch (error) { if (current()) this.setState({ fileLoading: false, fileError: error instanceof Error ? error.message : '文件读取失败' }); }
    }
    private renderNodes(nodes: FileNode[]): React.ReactNode {
        return nodes.map(node => node.children.size ? <details className="conversation-directory" key={node.path}><summary><Icon name="chevron" size={10}/><Icon name="folder" size={15}/>{node.name}</summary><div>{this.renderNodes([...node.children.values()])}</div></details> : <button type="button" key={node.path} className={'conversation-file' + (this.state.path === node.path ? ' is-selected' : '')} aria-pressed={this.state.path === node.path} title={node.path} onClick={() => void this.openFile(node.path)}><Icon name="evidence" size={15}/><span>{node.name}</span></button>);
    }
    render() {
        const { loading, error, loaded, files, path, content, fileLoading, fileError } = this.state;
        return <div className="conversation-files"><div className="conversation-panel-heading"><h2>项目共享工作区</h2><button type="button" className="text-button" onClick={this.props.onWorkspace}>打开工作区</button></div><p className="small muted conversation-panel-note">准备区文件；实验固定源码请从运行详情读取。</p>
            {loading ? <p className="inline-empty" role="status">正在读取项目目录…</p> : error ? <div className="conversation-panel-error" role="alert"><p>{error}</p><button type="button" className="secondary compact" onClick={() => void this.loadFiles()}>重试目录</button></div> : loaded && !files.length ? <p className="inline-empty">项目共享工作区暂无文件。</p> : <nav className="conversation-file-tree" aria-label="项目共享工作区文件">{this.renderNodes(projectFileTree(files))}</nav>}
            {path ? <section className="conversation-file-preview"><h3>{path}</h3>{fileLoading ? <p role="status">正在读取文件…</p> : fileError ? <div role="alert"><p>{fileError}</p><button type="button" className="secondary compact" onClick={() => void this.openFile(path)}>重试文件</button></div> : <pre aria-label="项目文件只读预览">{content || '（空文件）'}</pre>}</section> : null}
            <p className="small muted conversation-panel-note">.git、可执行 Pi 配置与敏感配置不作为普通工作区资源加载。</p>
        </div>;
    }
}

type PanelProps = { projectId: string; active: boolean; data: ProjectState | null; collaboration: React.ReactNode; selectedExperiment: string; onExperiment: (id: string) => void; onWorkspace: () => void; onChooseProject: () => void; onRetry: () => void; error: string };
export class ConversationPanel extends React.Component<PanelProps, { view: PanelView }> {
    state = { view: readPanelPreference(this.props.projectId).view };
    private tabs = new Map<PanelView, HTMLButtonElement>();
    private select = (view: PanelView) => { this.setState({ view }); savePanelPreference(this.props.projectId, { view }); };
    private tabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, view: PanelView) => {
        const index = PANEL_VIEWS.findIndex(([id]) => id === view);
        const next = event.key === 'ArrowRight' ? (index + 1) % PANEL_VIEWS.length : event.key === 'ArrowLeft' ? (index + PANEL_VIEWS.length - 1) % PANEL_VIEWS.length : event.key === 'Home' ? 0 : event.key === 'End' ? PANEL_VIEWS.length - 1 : null;
        if (next !== null) { event.preventDefault(); const selected = PANEL_VIEWS[next][0]; this.select(selected); this.tabs.get(selected)?.focus(); }
    };
    render() {
        const { data, projectId, active } = this.props, { view } = this.state;
        return <aside id="conversation-panel" className="conversation-panel" hidden={!active} aria-label="会话右侧面板"><div className="conversation-panel-tabs" role="tablist" aria-label="右侧视图">{PANEL_VIEWS.map(([id, title]) => <button type="button" role="tab" id={'conversation-tab-' + id} key={id} ref={node => { if (node) this.tabs.set(id, node); else this.tabs.delete(id); }} aria-selected={view === id} aria-controls={'conversation-view-' + id} tabIndex={view === id ? 0 : -1} onClick={() => this.select(id)} onKeyDown={event => this.tabKeyDown(event, id)}>{title}</button>)}</div>
            {PANEL_VIEWS.map(([id]) => <div className="conversation-panel-view" role="tabpanel" id={'conversation-view-' + id} aria-labelledby={'conversation-tab-' + id} hidden={view !== id} tabIndex={0} key={id}>
                {!projectId ? <div className="inline-empty">先选择项目。<button type="button" className="text-button" onClick={this.props.onChooseProject}>选择或创建项目</button></div> : !data ? this.props.error ? <div className="conversation-panel-error" role="alert"><p>{this.props.error}</p><button type="button" className="secondary compact" onClick={this.props.onRetry}>重试读取项目</button></div> : <p className="inline-empty" role="status">正在读取项目…</p> : id === 'collaboration' ? this.props.collaboration : id === 'experiments' ? <><div className="conversation-panel-heading"><h2>项目实验树</h2></div>{data.experiments.length ? <ExperimentGraph data={data} selected={this.props.selectedExperiment} onSelect={this.props.onExperiment} preserveViewportOnResize headingId="conversation-experiment-heading"/> : <p className="inline-empty">当前项目尚无实验；已有实验与运行会显示在这里。</p>}</> : <ConversationFiles projectId={projectId} active={active && view === 'files'} onWorkspace={this.props.onWorkspace}/>}
            </div>)}
        </aside>;
    }
}
