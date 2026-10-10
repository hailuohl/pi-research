import * as React from 'react';
import { api } from './api.js';
import type { Bootstrap, MessageAttachment, ModelConfig, Row, Session,AttachmentTypes } from './models.js';
import type { Perform } from './workbench.js';
import {Icon} from './ui.js';
import {ComposerModelMenu} from './composer-model-menu.js';

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
    permissionControl?: React.ReactNode;
    onAddAttachment: (attachment: MessageAttachment) => void;
    onRemoveAttachment: (documentVersionId: string) => void;
    canSend: boolean;
    hasDraft: boolean;
    onSendModel: (model: ModelConfig) => Promise<Row<Session>|undefined>;
}
interface State { config: ConnectorConfig | null; sourceDraft: Record<SourceId, boolean>; sourcesOpen: boolean; loading: boolean; loadingError: string; saving: boolean; uploadError: string; uploading: boolean;attachmentTypes:AttachmentTypes|null }

const configCopy = (config: ConnectorConfig) => Object.fromEntries(SOURCES.map(source => [source, !!config.enabled?.[source]])) as Record<SourceId, boolean>;
const modelKey = (model: Pick<ModelConfig,'provider'|'model'>) => JSON.stringify([model.provider, model.model]);
function fileType(file: File): MessageAttachment['mediaType'] | undefined {
    const name = file.name.toLowerCase();
    const extensions:Record<string,string>={pdf:'application/pdf',txt:'text/plain',md:'text/markdown',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',mp4:'video/mp4'};
    return extensions[name.slice(name.lastIndexOf('.')+1)];
}
function toBase64(bytes: Uint8Array) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
}

export class ComposerControls extends React.Component<Props, State> {
    state: State = { config: null, sourceDraft: { alphaxiv: false, openalex: false, biorxiv: false, pubmed: false, crossref: false }, sourcesOpen: false, loading: true, loadingError: '', saving: false, uploadError: '', uploading: false,attachmentTypes:null };
    private mounted = true;
    private request = 0;
    private attachmentRequest=0;

    componentDidMount() { void this.loadSources();void this.loadAttachmentTypes(); }
    componentDidUpdate(previous: Props) { if (previous.projectId !== this.props.projectId) void this.loadSources();if(previous.boot.modelManagement?.version!==this.props.boot.modelManagement?.version||previous.boot.modelManagementError!==this.props.boot.modelManagementError||previous.session?.id!==this.props.session?.id||previous.session?.model.provider!==this.props.session?.model.provider||previous.session?.model.model!==this.props.session?.model.model)void this.loadAttachmentTypes(); }
    componentWillUnmount() { this.mounted = false; this.request++;this.attachmentRequest++; }
    private async loadAttachmentTypes(){const session=this.props.session,request=++this.attachmentRequest;this.setState({attachmentTypes:null});if(!session)return;try{const types=await api<AttachmentTypes>(`/sessions/${session.id}/attachment-types`);if(this.mounted&&request===this.attachmentRequest&&this.props.session?.id===session.id&&modelKey(this.props.session.model)===modelKey(session.model)&&modelKey(types.model)===modelKey(session.model))this.setState({attachmentTypes:types,uploadError:''});}catch(error){if(this.mounted&&request===this.attachmentRequest)this.setState({uploadError:error instanceof Error?error.message:String(error)});}}
    private allowedTypes(){const available=this.state.attachmentTypes,model=this.props.session?.model;return available&&available.model.provider===model?.provider&&available.model.model===model?.model?available.types:[{mediaType:'text/plain',extensions:['.txt'],maxBytes:32*1024*1024,native:false},{mediaType:'text/markdown',extensions:['.md'],maxBytes:32*1024*1024,native:false}];}

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
        const typed = files.map(file => ({ file, mediaType: fileType(file) })),allowed=this.allowedTypes();
        const invalid = typed.find(item => !allowed.some(t=>t.mediaType===item.mediaType)||!item.file.size||item.file.size>allowed.find(t=>t.mediaType===item.mediaType)!.maxBytes);
        if (invalid) { this.setState({ uploadError: '文件类型或大小不符合当前确认的附件能力；已上传的附件引用已保留。'+(this.state.attachmentTypes?.fileCapabilityReason??'正在读取当前模型附件能力。') }); return; }
        if(attachments.filter(a=>!a.mediaType.startsWith('text/')).reduce((n,a)=>n+a.size,0)+typed.filter(a=>!a.mediaType!.startsWith('text/')).reduce((n,a)=>n+a.file.size,0)>20*1024*1024){this.setState({uploadError:'草稿原生附件合计最多20 MiB；已上传的附件引用已保留。'});return;}
        const sessionId = session.id;
        this.setState({ uploading: true, uploadError: '' });
        try {
            for (const { file, mediaType } of typed) {
                const bytes = new Uint8Array(await file.arrayBuffer());
                if(this.props.session?.id!==sessionId||modelKey(this.props.session.model)!==modelKey(session.model))return;
                const document = await api<ImportedDocument>(`/sessions/${sessionId}/attachments`, { title: file.name, mediaType, contentBase64: toBase64(bytes) });
                if (!this.mounted || this.props.projectId !== projectId || this.props.session?.id !== sessionId) return;
                this.props.onAddAttachment({ documentVersionId: document.id, artifactId: document.original.artifactId, digest: document.original.digest, title: document.title, mediaType: document.original.mediaType, size: document.original.size });
            }
        }
        catch (error) {
            if (this.mounted) this.setState({ uploadError: error instanceof Error ? error.message : String(error) });
        }
        finally { if (this.mounted) this.setState({ uploading: false }); }
    }

    stopSession(sessionId:string) {
        const {session,busy,projectArchived}=this.props;
        if(!this.mounted||session?.id!==sessionId||busy||projectArchived||session.taskId||!['running','queued'].includes(session.state))return;
        return this.props.perform(()=>api(`/sessions/${sessionId}/interrupt`,{}),'已停止模型；正式实验未取消');
    }

    render() {
        const { boot, session, projectArchived, modelLocked, busy, attachments, canSend, hasDraft } = this.props;
        const { config, sourceDraft, sourcesOpen, loading, loadingError, uploadError, uploading } = this.state;
        const currentModel = session?.model, modelDisabled = !session || projectArchived || modelLocked || !!session.taskId || !!session.teamId || session.role !== 'coordinator' || ['running', 'queued', 'archived'].includes(session.state);
        const uploadDisabled = !session || projectArchived || !!session.taskId || session.state === 'archived' || uploading || attachments.length >= 5;
        const sourceCount = SOURCES.filter(source => sourceDraft[source]).length;
        const allowed=this.allowedTypes(),unsupported=attachments.some(a=>!allowed.some(t=>t.mediaType===a.mediaType)),accept=allowed.flatMap(t=>[...t.extensions,t.mediaType]).join(',');
        const executing=!!session&&!session.taskId&&['running','queued'].includes(session.state),showStop=executing&&!hasDraft;
        return <>
            {attachments.length ? <div className="composer-attachment-list" aria-label="待发送附件">{attachments.map(attachment => <span className="composer-attachment" key={attachment.documentVersionId}><Icon name="evidence" size={14}/><span title={`已保存项目资料：${attachment.title}`}>{attachment.title}</span><small>{attachment.mediaType.startsWith('text/')?'项目资料 · 文本原件':'项目资料 · 整文件随消息发送'}</small><button type="button" aria-label={`从草稿移除 ${attachment.title}`} title="只移除草稿引用，不删除项目原件" disabled={busy} onClick={() => this.props.onRemoveAttachment(attachment.documentVersionId)}><Icon name="close" size={13}/></button></span>)}</div> : null}
            {unsupported?<p className="error-text composer-control-error" role="alert">草稿附件超出当前确认的输入能力；附件已保留，请切换支持的模型或移除引用。{this.state.attachmentTypes?.fileCapabilityReason}</p>:null}
            {uploadError ? <p className="error-text composer-control-error" role="alert">{uploadError}</p> : null}
            <div className="composer-toolbar">
                <div className="composer-control-left">
                    <div className="source-control">
                        <button type="button" className="composer-tool-button" aria-expanded={sourcesOpen} aria-controls="composer-source-menu" disabled={!session || projectArchived || busy} onClick={() => { const opening=!sourcesOpen; this.setState({sourcesOpen:opening}); if(opening&&!this.state.config)void this.loadSources(); }}><Icon name="database" size={16}/><span>来源</span><small>{sourceCount}/5</small></button>
                        {sourcesOpen ? <div className="composer-popover" id="composer-source-menu" role="group" aria-label="项目文献来源" onKeyDown={(event: any) => { if (event.key === 'Escape') this.setState({ sourcesOpen: false }); }}><div className="composer-popover-heading"><strong>文献来源</strong><button type="button" aria-label="关闭来源设置" onClick={() => this.setState({ sourcesOpen: false })}><Icon name="close" size={14}/></button></div>{loading ? <p className="small muted">正在读取设置…</p> : null}{loadingError ? <p className="error-text" role="alert">{loadingError}</p> : null}{SOURCES.map(source => <label className="composer-source-option" key={source}><img className="composer-source-logo" src={'/source-logos/'+SOURCE_LOGOS[source]} width={16} height={16} alt="" aria-hidden="true"/><span>{SOURCE_NAMES[source]}</span><input type="checkbox" aria-label={`启用 ${SOURCE_NAMES[source]}`} checked={sourceDraft[source]} disabled={!config || loading || this.state.saving || busy || projectArchived} onChange={(event: any) => { void this.configureSource(source,event.target.checked); }}/></label>)}</div> : null}
                    </div>
                    <label className={'composer-tool-button composer-file-button'+(uploadDisabled?' disabled':'')} aria-label="添加当前模型支持的附件"><Icon name="paperclip" size={16}/><span>附件</span>{attachments.length ? <small>{attachments.length}</small> : null}<input type="file" multiple accept={accept} disabled={uploadDisabled} onChange={(event: any) => { const files = Array.from(event.currentTarget.files ?? []) as File[]; event.currentTarget.value = ''; void this.addFiles(files); }}/></label>
                    {this.props.children}
                </div>
                <div className="grow"/>
                <ComposerModelMenu sessionId={session?.id??'none'} current={currentModel} management={boot.modelManagement} error={boot.modelManagementError} busy={busy} disabled={modelDisabled} locked={modelLocked} onSelect={this.props.onSendModel}/>
                {this.props.permissionControl}
                <button className="primary compact composer-submit-control" type={showStop?'button':'submit'} aria-label={showStop?'停止模型':session?.state==='running'?'排队发送':'发送'} title={showStop?'停止当前对话任务':session?.state==='running'?'当前工作结束后处理':'发送消息'} data-action={showStop?'stop':'send'} disabled={showStop?busy||projectArchived:!canSend||!hasDraft||!session||unsupported} onClick={showStop?()=>this.stopSession(session!.id):undefined}><Icon name={showStop?'stop':'arrow'} size={16}/>{showStop?'停止':'发送'}</button>
            </div>
        </>;
    }
}
