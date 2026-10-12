import * as React from 'react';
import {createPortal} from 'react-dom';
import { api, artifactText, downloadArtifact } from './api.js';
import type { ProjectState, DocumentLocation, DocumentEvidenceLink } from './models.js';
import { short, date, label } from './models.js';
import {Icon, Badge, Empty, SectionTitle, Modal} from './ui.js';
import type { Perform } from './workbench.js';
type WorkspaceDialog={kind:'discard'|'path';projectId:string;generation:number;intent:number;archived:boolean;path:string;content:string;digest:string|null};
export class WorkspaceView extends React.Component<{
    data: ProjectState;
    perform: Perform;
}, {
    files: Array<{
        path: string;
        size: number;
    }>;
    path: string;
    content: string;
    digest: string | null;
    dirty: boolean;
    loading: boolean;
    saving: boolean;
    dialog: WorkspaceDialog | null;
    newPath: string;
    dialogError: string;
}> {
    state = { files: [] as Array<{
            path: string;
            size: number;
        }>, path: '', content: '', digest: null as string | null, dirty: false, loading: false, saving: false, dialog:null as WorkspaceDialog|null,newPath:'',dialogError:'' };
    private loadId = 0;
    private listId = 0;
    private mounted = true;
    private saving = false;
    draftGeneration=0;
    // 同步标记，避免输入后 React 尚未提交 dirty 时直接离开。
    private edited=false;
    private intent=0;
    private dialogTarget?:WorkspaceDialog;
    private discardResolve?: (accepted:boolean)=>void;
    private beforeUnload = (event: BeforeUnloadEvent) => {
        if (!this.state.dirty && !this.edited && !this.state.saving && !this.saving) return;
        event.preventDefault();
        event.returnValue = '';
    };
    componentDidMount() { window.addEventListener('beforeunload', this.beforeUnload); void this.loadFiles(); }
    componentWillUnmount() { this.mounted = false; this.loadId++; this.listId++;this.intent++;this.finishDialog(this.dialogTarget,false); if (typeof window !== 'undefined') window.removeEventListener('beforeunload', this.beforeUnload); }
    componentDidUpdate(previous:Readonly<WorkspaceView['props']>){if(previous.data.project.id!==this.props.data.project.id||previous.data.project.archived!==this.props.data.project.archived){this.loadId++;this.listId++;this.intent++;this.changedDraft();this.setState({loading:false});}}
    private snapshot(intent:number):WorkspaceDialog{return {kind:'discard',projectId:this.props.data.project.id,generation:this.draftGeneration,intent,archived:!!this.props.data.project.archived,path:this.state.path,content:this.state.content,digest:this.state.digest};}
    private current(target:WorkspaceDialog){return this.mounted&&target.intent===this.intent&&target.generation===this.draftGeneration&&target.projectId===this.props.data.project.id&&target.archived===!!this.props.data.project.archived&&target.path===this.state.path&&target.content===this.state.content&&target.digest===this.state.digest;}
    private finishDialog(target:WorkspaceDialog|undefined,accepted:boolean){
        if(!target||this.dialogTarget!==target)return;
        const resolve=this.discardResolve;this.discardResolve=undefined;this.dialogTarget=undefined;
        if(!this.mounted){resolve?.(false);return;}
        this.setState(state=>state.dialog===target?{dialog:null,dialogError:''}:null,()=>resolve?.(accepted&&this.current(target)));
    }
    private changedDraft(){this.draftGeneration++;this.finishDialog(this.dialogTarget,false);}
    async confirmDiscard(intent?:number):Promise<boolean>{
        if(!this.mounted||this.dialogTarget)return false;
        intent??=++this.intent;
        if(!this.state.dirty&&!this.edited&&!this.state.saving&&!this.saving)return true;
        const target=this.snapshot(intent);this.dialogTarget=target;
        const accepted=new Promise<boolean>(resolve=>{this.discardResolve=resolve;});
        this.setState(()=>this.dialogTarget===target?{dialog:target,newPath:'',dialogError:''}:null);
        return await accepted&&this.current(target);
    }
    async loadFiles() {
        const seq = ++this.listId, projectId = this.props.data.project.id, selection = this.loadId,intent=this.intent;
        try {
            const files = await api(`/projects/${projectId}/files`);
            if (!this.mounted || seq !== this.listId || projectId !== this.props.data.project.id) return;
            this.setState({ files });
            if (!this.state.path && files.length && selection === this.loadId&&intent===this.intent) await this.open(files[0].path);
        } catch (e) {
            if (this.mounted && seq === this.listId && projectId === this.props.data.project.id)
                await this.props.perform(async () => { throw e; });
        }
    }
    async open(path: string) {
        if(this.dialogTarget)return;
        const target=this.snapshot(++this.intent);
        if (!await this.confirmDiscard(target.intent)||!this.current(target)) return;
        this.changedDraft();
        const seq = ++this.loadId, projectId = this.props.data.project.id;
        const generation=this.draftGeneration,current = () => this.mounted && seq === this.loadId && generation===this.draftGeneration&&projectId === this.props.data.project.id;
        this.setState({ loading: true });
        try {
            const f = await api(`/projects/${projectId}/files?path=${encodeURIComponent(path)}`);
            if (current()){
                this.changedDraft();this.edited=false;
                this.setState({ path, content: f.content, digest: f.digest, dirty: false, loading: false });
            }
        }
        catch (e) {
            if (!current()) return;
            this.setState({ loading: false });
            await this.props.perform(async () => { throw e; });
        }
    }
    newFile = async () => {
        if (this.props.data.project.archived||this.dialogTarget) return;
        const target=this.snapshot(++this.intent);
        if(!await this.confirmDiscard(target.intent)||!this.current(target)||this.props.data.project.archived)return;
        const dialog={...target,kind:'path' as const};this.dialogTarget=dialog;
        this.setState(()=>this.dialogTarget===dialog?{dialog,newPath:'',dialogError:''}:null);
    };
    private createFile(target:WorkspaceDialog,fd:FormData){
        if(this.dialogTarget!==target)return;
        if(!this.current(target)||this.props.data.project.archived){this.finishDialog(target,false);return;}
        const path=String(fd.get('path')??'');
        const excluded=['.git','node_modules','.pi','.env','.ds_store','.pi-research','.pi-runtime','.npmrc','.pypirc'];
        if(!path||!path.trim()||path.length>1000||/^[\/]|[\\:<>"|?*\x00-\x1f]/.test(path)||path.split('/').some(part=>{
            const name=part.toLowerCase();
            return !part||part==='.'||part==='..'||/[. ]$/.test(part)||/^(?:con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part)||name==='conin$'||name==='conout$'||excluded.includes(name)||name.startsWith('.env.')||/^(?:model-connections|environment-variables)\.json(?:\.[\w-]+\.tmp)?$/i.test(part);
        })){this.setState({newPath:path,dialogError:'请输入合法的相对文件路径，不能使用尾点、尾空格、Windows 保留名称或敏感配置路径。'});return;}
        this.finishDialog(target,false);this.loadId++;this.changedDraft();this.edited=true;
        this.setState({path,content:'',digest:null,dirty:true,loading:false});
    }
    save = async () => {
        if (this.saving || this.props.data.project.archived || !this.state.path || !this.state.dirty || this.state.loading) return;
        const { path, content, digest } = this.state, projectId = this.props.data.project.id, seq = this.loadId;
        const current = () => this.mounted && seq === this.loadId && projectId === this.props.data.project.id && path === this.state.path;
        this.saving = true;
        this.changedDraft();
        this.setState({ saving: true });
        try {
            await this.props.perform(async () => {
                try {
                    const f = await api(`/projects/${projectId}/files`, { path, content, expectedDigest: digest });
                    if (!current()) return;
                    this.changedDraft();this.edited=this.state.content!==content;
                    await new Promise<void>(resolve => this.setState(state => current() ? { digest: f.digest, dirty: state.content !== content } : null, resolve));
                    if (current()) await this.loadFiles();
                } catch (e) { if (current()) throw e; }
            });
        } finally {
            this.saving = false;
            if(current())this.changedDraft();
            if (this.mounted) this.setState({ saving: false });
        }
    };
    render() {
        const target=this.state.dialog,dialog=target?<div onKeyDown={event=>event.stopPropagation()} onSubmit={event=>event.stopPropagation()}><Modal key={target.kind+':'+target.intent} title={target.kind==='discard'?'放弃当前工作区草稿？':'新建文件'} alert={target.kind==='discard'} busy={false} submitLabel={target.kind==='discard'?'放弃草稿并继续':'新建文件'} onClose={()=>this.finishDialog(target,false)} onSubmit={fd=>target.kind==='discard'?this.finishDialog(target,true):this.createFile(target,fd)}>{target.kind==='discard'?<p>文件 {target.path||'当前草稿'} 有未保存修改或正在保存。继续操作会放弃当前草稿；取消会保留全部编辑。</p>:<label>新文件相对路径<input name="path" required maxLength={1000} value={this.state.newPath} placeholder="notes/research.md" onChange={event=>this.setState({newPath:event.target.value,dialogError:''})}/></label>}{this.state.dialogError?<p role="alert">{this.state.dialogError}</p>:null}</Modal></div>:null;
        return <div className="page-scroll workspace-page"><SectionTitle title="项目工作区" sub={this.props.data.project.archived?"已归档项目源码只读，实验快照与准备区文件保留。":"编辑的是准备区，不会改变已经提交的实验快照。"}><button className="secondary" disabled={this.props.data.project.archived} onClick={this.newFile}><Icon name="plus" size={15}/>新建文件</button></SectionTitle><div className="workspace-grid"><nav className="file-tree" aria-label="项目文件"><div className="small-label">SOURCE FILES</div>{this.state.files.map(f => <button key={f.path} className={this.state.path === f.path ? 'active' : ''} onClick={() => this.open(f.path)}><Icon name="evidence" size={15}/><span>{f.path}</span></button>)}<p className="small muted">.git、可执行 Pi 配置与敏感配置不作为普通工作区资源加载。</p></nav><div className="editor"><div className="editor-toolbar"><code>{this.state.path || '选择文件'}</code>{this.state.dirty ? <span className="dirty-dot" title="未保存"/> : null}<span className="grow"/><button className="text-button" onClick={() => this.state.path && this.open(this.state.path)}>重新读取</button><button className="primary compact" disabled={this.props.data.project.archived || !this.state.path || !this.state.dirty || this.state.loading || this.state.saving} onClick={this.save}>保存文件</button></div><textarea aria-label="文件内容" readOnly={this.props.data.project.archived || this.state.loading} spellCheck={false} value={this.state.content} onChange={(e: any) => { if (!this.props.data.project.archived && !this.state.loading) {this.edited=true;this.changedDraft();this.setState({ content: e.target.value, dirty: true });} }}/><div className="editor-status"><span>UTF-8</span><span>{this.state.content.split('\n').length} 行</span><span>版本校验 {short(this.state.digest)}</span><span className="grow"/><span>冲突时保留当前编辑，不覆盖新版本</span></div></div></div><div className="notice"><Icon name="folder"/><p>实验代码可使用本地、Docker 或 SSH；源码、执行环境和资源在运行前单独批准。本地代码拥有当前用户权限，文件与网络不隔离。</p></div>{dialog&&(typeof document!=='undefined'&&document.body?createPortal(dialog,document.body):dialog)}</div>;
    }
}
export class EvidenceView extends React.Component<{
    readOnly?:boolean;
    embedded?:boolean;
    data: ProjectState;
    perform: Perform;
    onRegister: (artifactId: string, content: string) => void;
    onClaim: () => void;
    onDocument?:(target:DocumentLocation)=>void;
}, {
    active: string;
    content: string;
    query: string;
}> {
    state = { active: '', content: '', query: '' };
    async open(id: string) { await this.props.perform(async () => { const content = await artifactText(id); this.setState({ active: id, content }); }); }
    render() {
        const { data, perform } = this.props;
        const artifact = data.artifacts.find(a => a.id === this.state.active);
        return <div className="page-scroll"><SectionTitle level={this.props.embedded?2:1} title="资料与证据" sub="资料是原始输入；只有明确定位并校验后的片段，才是证据。">{!this.props.readOnly?<label className="secondary file-upload"><Icon name="plus" size={15}/>导入文本资料<input type="file" disabled={data.project.archived} accept=".txt,.md,.csv,.json,.py,.tex,.mjs" onChange={(e: any) => {
                const file = e.target.files?.[0];
                if (!file)
                    return;
                perform(async () => {
                    if (file.size > 1024 * 1024)
                        throw Error('当前文本导入限制为 1 MiB');
                    const content = await file.text();
                    if (content.includes('\0'))
                        throw Error('此入口只接受文本；PDF 请到“文献任务与原文”导入');
                    const a = await api('/artifacts', { projectId: data.project.id, title: file.name, content, mediaType: 'text/plain' });
                    this.setState({ active: a.id, content });
                }, '文本资料已保存');
                e.target.value = '';
            }}/></label>:null}</SectionTitle>
 <div className="evidence-grid"><section className="surface artifact-list"><div className="surface-heading"><h2>文件产物</h2><span>{data.artifacts.length}</span></div><div className="search-field"><Icon name="search" size={16}/><input aria-label="搜索产物" placeholder="搜索文件名" value={this.state.query} onChange={(e: any) => this.setState({ query: e.target.value })}/></div>{data.artifacts.filter(a => a.title.includes(this.state.query)).slice().reverse().map(a => <button key={a.id} className={'artifact-item ' + (a.id === this.state.active ? 'active' : '')} onClick={() => this.open(a.id)}><Icon name="evidence"/><div><strong>{a.title}</strong><small>{(a.size / 1024).toFixed(1)} KB · {a.origin.startsWith('run') ? '实际运行产物' : a.origin === 'report' ? '确定性报告' : '已存储文件'}</small></div></button>)}{!data.artifacts.length ? <div className="inline-empty">导入文本，或完成一次实验以获取真实产物。</div> : null}</section><section className="surface artifact-preview"><div className="surface-heading"><h2>{artifact?.title ?? '产物预览'}</h2>{artifact ? <div className="actions"><button className="text-button" onClick={() => perform(() => downloadArtifact(artifact.id, artifact.title))}>下载</button>{!this.props.readOnly?<button className="secondary compact" disabled={data.project.archived} onClick={() => this.props.onRegister(artifact.id, this.state.content)}>登记为证据</button>:null}</div> : null}</div>{artifact ? <div><div className="preview-meta">SHA-256 <code>{artifact.digest}</code></div><pre className="document-preview">{this.state.content}</pre></div> : <Empty title="选择一份资料"><p>HTML、SVG 等内容均按文本预览，不执行其中的脚本。</p></Empty>}</section></div>
 <section className="surface"><div className="surface-heading"><h2>证据索引</h2><span className="small muted">每条证据固定原文、位置与内容摘要</span></div>{data.evidence.length ? data.evidence.map(e => <details className="evidence-record" key={e.id}><summary><span className="evidence-type">{e.type.toUpperCase()}</span><strong>{e.description}</strong><code>{short(e.id)}</code></summary><blockquote>{e.quote}</blockquote><p className="small muted">UTF-16 字符位置 {e.locator.start}–{e.locator.end} · 产物 {short(e.artifactId)}</p><button className="text-button" onClick={() => this.open(e.artifactId)}>查看原始产物</button>{(e as typeof e & {document?:DocumentEvidenceLink}).document&&this.props.onDocument?<button className="secondary compact" onClick={()=>{const link=(e as typeof e & {document:DocumentEvidenceLink}).document;this.props.onDocument?.({documentVersionId:link.documentVersionId,parseResultId:link.parseResultId,pageNumber:link.pageNumber,start:e.locator.start,end:e.locator.end});}}>回查固定文档页 {(e as typeof e & {document:DocumentEvidenceLink}).document.pageNumber}</button>:null}</details>) : <div className="inline-empty">检索命中或文件存在，不自动代表结论已被证据支持。</div>}</section>
 <section className="surface"><div className="surface-heading"><h2>结论候选与验收</h2>{!this.props.readOnly?<button className="secondary compact" disabled={data.project.archived||!data.evidence.length} onClick={this.props.onClaim}>提出结论候选</button>:null}</div>{data.claims.map(c => <div className="claim-record" key={c.id}><Badge value={c.status}/><p>{c.statement}</p>{c.validity==='stale'?<p className="inline-warning">前提或审查已失效：仅保留历史，不用于新报告。</p>:null}<p className="small muted">限制：{c.limitations.join('；') || '未填写'} · 证据 {c.evidenceIds.map(short).join(', ')}</p>{!this.props.readOnly && !data.project.archived && c.status === 'proposal' && c.validity !== 'stale' ? <div className="actions"><button className="secondary compact" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'accepted' }), '结论已由用户采纳')}>人工确认采纳</button><button className="text-button" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'disputed' }))}>标为争议</button><button className="text-button danger" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'rejected' }))}>拒绝</button></div> : null}</div>)}{!data.claims.length ? <div className="inline-empty">尚无结论候选。多个 Agent 一致同意，不会自动生成已采纳事实。</div> : null}</section></div>;
    }
}
export {ReportsView} from './report-view.js';
export {LiteratureView} from './literature-view.js';
export {SettingsView} from './settings-view.js';
