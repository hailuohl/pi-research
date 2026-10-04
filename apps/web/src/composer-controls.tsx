import * as React from 'react';
import { api } from './api.js';
import type { Bootstrap, MessageAttachment, ModelConfig, Row, Session } from './models.js';
import type { Perform } from './workbench.js';
import {Icon, nativeSelectButton} from './ui.js';

const SOURCES = ['alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref'] as const;
const SOURCE_NAMES: Record<typeof SOURCES[number], string> = { alphaxiv: 'alphaXiv', openalex: 'OpenAlex', biorxiv: 'bioRxiv', pubmed: 'PubMed', crossref: 'Crossref' };
const SOURCE_LOGOS:Record<typeof SOURCES[number],string>={alphaxiv:'alphaxiv.svg',openalex:'openalex.svg',biorxiv:'biorxiv.svg',pubmed:'pubmed.png',crossref:'crossref.ico'};
type SourceId = typeof SOURCES[number];
interface ConnectorConfig { version: number; enabled: Record<SourceId, boolean> }
interface ImportedDocument { id: string; title: string; original: { artifactId: string; digest: string; size: number; mediaType: MessageAttachment['mediaType'] } }
interface Props {
    boot: Bootstrap;
    projectId: string;
    projectArchived: boolean;
    modelLocked: boolean;
    session?: Row<Session>;
    busy: boolean;
    perform: Perform;
    attachments: MessageAttachment[];
    children?: React.ReactNode;
    onAddAttachment: (attachment: MessageAttachment) => void;
    onRemoveAttachment: (documentVersionId: string) => void;
    canSend: boolean;
    hasDraft: boolean;
    onSendModel: (model: ModelConfig) => void;
}
interface State { config: ConnectorConfig | null; sourceDraft: Record<SourceId, boolean>; sourcesOpen: boolean; loading: boolean; loadingError: string; saving: boolean; uploadError: string; uploading: boolean }

const configCopy = (config: ConnectorConfig) => Object.fromEntries(SOURCES.map(source => [source, !!config.enabled?.[source]])) as Record<SourceId, boolean>;
const modelKey = (model: ModelConfig) => JSON.stringify([model.provider, model.model, model.thinking]);
function fileType(file: File): MessageAttachment['mediaType'] | undefined {
    const name = file.name.toLowerCase();
    return name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.txt') ? 'text/plain' : name.endsWith('.md') ? 'text/markdown' : undefined;
}
function toBase64(bytes: Uint8Array) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
}

export class ComposerControls extends React.Component<Props, State> {
    state: State = { config: null, sourceDraft: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: false }, sourcesOpen: false, loading: true, loadingError: '', saving: false, uploadError: '', uploading: false };
    private mounted = true;
    private request = 0;

    componentDidMount() { void this.loadSources(); }
    componentDidUpdate(previous: Props) { if (previous.projectId !== this.props.projectId) void this.loadSources(); }
    componentWillUnmount() { this.mounted = false; this.request++; }

    private async loadSources() {
        const request = ++this.request, projectId = this.props.projectId;
        this.setState({ loading: true, loadingError: '' });
        try {
            const config = await api<ConnectorConfig>(`/projects/${encodeURIComponent(projectId)}/connectors`);
            if (this.mounted && request === this.request && projectId === this.props.projectId)
                this.setState({ config, sourceDraft: configCopy(config), loading: false });
        }
        catch (error) {
            if (this.mounted && request === this.request)
                this.setState({ loading: false, loadingError: error instanceof Error ? error.message : String(error) });
        }
    }

    async configureSource(source:SourceId, enabled:boolean) {
        const { config } = this.state;
        if (!config || this.state.loading || this.state.saving || this.props.busy || this.props.projectArchived) return;
        const projectId = this.props.projectId, request=this.request, current=()=>this.mounted&&request===this.request&&projectId===this.props.projectId;
        this.setState({saving:true,loadingError:'',sourceDraft:{...this.state.sourceDraft,[source]:enabled}});
        await this.props.perform(async()=>{
        try {
            const saved = await api<ConnectorConfig>(`/projects/${encodeURIComponent(projectId)}/connectors`, { expectedVersion: config.version, enabled: {[source]:enabled} });
            if(current())this.setState({config:saved,sourceDraft:configCopy(saved)});
        } catch(error) {
            if(!current())return;
            const message=error instanceof Error?error.message:String(error);
            try {const latest=await api<ConnectorConfig>(`/projects/${encodeURIComponent(projectId)}/connectors`);if(current())this.setState({config:latest,sourceDraft:configCopy(latest),loadingError:message});}
            catch {if(current())this.setState({config:null,sourceDraft:configCopy(config),loadingError:message+'；来源状态未确认，请重新打开菜单重试。'});}
        } finally {if(current())this.setState({saving:false});}
        });
    }

    private async addFiles(files: File[]) {
        const { attachments, projectId, session } = this.props;
        if (!session || this.state.uploading) return;
        if (attachments.length + files.length > 5) { this.setState({ uploadError: '草稿最多附加 5 个文件；已上传的附件引用已保留。' }); return; }
        const typed = files.map(file => ({ file, mediaType: fileType(file) }));
        const invalid = typed.find(item => !item.mediaType || !item.file.size || item.file.size > 32 * 1024 * 1024);
        if (invalid) { this.setState({ uploadError: !invalid.mediaType ? '仅支持 PDF、TXT、MD 文件；已上传的附件引用已保留。' : '文件须为 1 byte–32 MiB；已上传的附件引用已保留。' }); return; }
        const sessionId = session.id;
        this.setState({ uploading: true, uploadError: '' });
        try {
            for (const { file, mediaType } of typed) {
                const bytes = new Uint8Array(await file.arrayBuffer());
                const document = await api<ImportedDocument>('/operations/document_import', { projectId, input: { title: file.name, mediaType, contentBase64: toBase64(bytes) } });
                if (!this.mounted || this.props.projectId !== projectId || this.props.session?.id !== sessionId) return;
                this.props.onAddAttachment({ documentVersionId: document.id, artifactId: document.original.artifactId, digest: document.original.digest, title: document.title, mediaType: document.original.mediaType, size: document.original.size });
            }
        }
        catch (error) {
            if (this.mounted) this.setState({ uploadError: error instanceof Error ? error.message : String(error) });
        }
        finally { if (this.mounted) this.setState({ uploading: false }); }
    }

    private modelOptions() {
        const { boot, session } = this.props, models = [...(boot.models ?? []), boot.model, ...(session ? [session.model] : [])];
        const unique = new Map<string, ModelConfig>();
        for (const model of models) if (model?.provider && model.model) unique.set(modelKey(model), model);
        return [...unique.values()];
    }

    stopSession(sessionId:string) {
        const {session,busy,projectArchived}=this.props;
        if(!this.mounted||session?.id!==sessionId||busy||projectArchived||session.taskId||!['running','queued'].includes(session.state))return;
        return this.props.perform(()=>api(`/sessions/${sessionId}/interrupt`,{}),'已停止模型；正式实验未取消');
    }

    render() {
        const { boot, session, projectArchived, modelLocked, busy, attachments, canSend, hasDraft } = this.props;
        const { config, sourceDraft, sourcesOpen, loading, loadingError, uploadError, uploading } = this.state;
        const currentModel = session?.model, options = this.modelOptions(), modelDisabled = !session || projectArchived || busy || modelLocked || !!session.taskId || session.role !== 'coordinator' || ['running', 'queued', 'archived'].includes(session.state);
        const uploadDisabled = !session || projectArchived || !!session.taskId || session.state === 'archived' || uploading || attachments.length >= 5;
        const sourceCount = SOURCES.filter(source => sourceDraft[source]).length;
        const executing=!!session&&!session.taskId&&['running','queued'].includes(session.state),showStop=executing&&!hasDraft;
        return <>
            {attachments.length ? <div className="composer-attachment-list" aria-label="待发送附件">{attachments.map(attachment => <span className="composer-attachment" key={attachment.documentVersionId}><Icon name="evidence" size={14}/><span title={`已保存项目资料：${attachment.title}`}>{attachment.title}</span><small>{attachment.mediaType === 'application/pdf' ? '项目资料 · PDF 原件 · 需显式解析' : '项目资料 · 文本原件'}</small><button type="button" aria-label={`从草稿移除 ${attachment.title}`} title="只移除草稿引用，不删除项目原件" disabled={busy} onClick={() => this.props.onRemoveAttachment(attachment.documentVersionId)}><Icon name="close" size={13}/></button></span>)}</div> : null}
            {uploadError ? <p className="error-text composer-control-error" role="alert">{uploadError}</p> : null}
            <div className="composer-toolbar">
                <div className="composer-control-left">
                    <div className="source-control">
                        <button type="button" className="composer-tool-button" aria-expanded={sourcesOpen} aria-controls="composer-source-menu" disabled={!session || projectArchived || busy} onClick={() => { const opening=!sourcesOpen; this.setState({sourcesOpen:opening}); if(opening&&!this.state.config)void this.loadSources(); }}><Icon name="database" size={16}/><span>来源</span><small>{sourceCount}/5</small></button>
                        {sourcesOpen ? <div className="composer-popover" id="composer-source-menu" role="group" aria-label="项目文献来源" onKeyDown={(event: any) => { if (event.key === 'Escape') this.setState({ sourcesOpen: false }); }}><div className="composer-popover-heading"><strong>文献来源</strong><button type="button" aria-label="关闭来源设置" onClick={() => this.setState({ sourcesOpen: false })}><Icon name="close" size={14}/></button></div>{loading ? <p className="small muted">正在读取设置…</p> : null}{loadingError ? <p className="error-text" role="alert">{loadingError}</p> : null}{SOURCES.map(source => <label className="composer-source-option" key={source}><img className="composer-source-logo" src={'/source-logos/'+SOURCE_LOGOS[source]} width={16} height={16} alt="" aria-hidden="true"/><span>{SOURCE_NAMES[source]}</span><input type="checkbox" aria-label={`启用 ${SOURCE_NAMES[source]}`} checked={sourceDraft[source]} disabled={!config || loading || this.state.saving || busy || projectArchived} onChange={(event: any) => { void this.configureSource(source,event.target.checked); }}/></label>)}</div> : null}
                    </div>
                    <label className={'composer-tool-button composer-file-button'+(uploadDisabled?' disabled':'')} aria-label="添加 PDF、TXT 或 MD 附件"><Icon name="paperclip" size={16}/><span>附件</span>{attachments.length ? <small>{attachments.length}</small> : null}<input type="file" multiple accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" disabled={uploadDisabled} onChange={(event: any) => { const files = Array.from(event.currentTarget.files ?? []) as File[]; event.currentTarget.value = ''; void this.addFiles(files); }}/></label>
                    {this.props.children}
                </div>
                <div className="grow"/>
                <label className="composer-model-control"><Icon name="cpu" size={15}/><span>模型</span><select aria-label="会话模型与思考等级" value={currentModel?.provider&&currentModel.model ? modelKey(currentModel) : ''} disabled={modelDisabled} title={modelLocked ? '当前会话已绑定固定授权，模型不能更改' : '当前会话运行或授权状态下暂不可更改模型'} onChange={(event: any) => { const selected = options.find(model => modelKey(model) === event.target.value); if (selected && (!currentModel || modelKey(selected) !== modelKey(currentModel))) this.props.onSendModel(selected); }}>{nativeSelectButton}<option value="">{currentModel?.provider&&currentModel.model?'选择模型':'未配置模型'}</option>{options.map(model => <option key={modelKey(model)} value={modelKey(model)}>{model.provider} / {model.model} · {model.thinking}{modelKey(model) === modelKey(boot.model) ? '（默认）' : ''}</option>)}</select></label>
                <button className="primary compact composer-submit-control" type={showStop?'button':'submit'} aria-label={showStop?'停止模型':executing?'排队发送':'发送'} title={showStop?'停止当前对话任务':executing?'发送到队列':'发送消息'} data-action={showStop?'stop':'send'} disabled={showStop?busy||projectArchived:!canSend||!hasDraft||!session} onClick={showStop?()=>this.stopSession(session!.id):undefined}><Icon name={showStop?'stop':'arrow'} size={16}/>{showStop?'停止':'发送'}</button>
            </div>
        </>;
    }
}
