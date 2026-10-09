import * as React from 'react';
import { api, artifactText, downloadArtifact } from './api.js';
import type { ProjectState, DocumentLocation, DocumentEvidenceLink } from './models.js';
import { short, date, label } from './models.js';
import {Icon, Badge, Empty, SectionTitle} from './ui.js';
import type { Perform } from './workbench.js';
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
}> {
    state = { files: [] as Array<{
            path: string;
            size: number;
        }>, path: '', content: '', digest: null as string | null, dirty: false, loading: false };
    private loadId = 0;
    componentDidMount() { void this.loadFiles(); }
    async loadFiles() {
        const files = await api(`/projects/${this.props.data.project.id}/files`);
        this.setState({ files });
        if (!this.state.path && files.length)
            await this.open(files[0].path);
    }
    async open(path: string) {
        if (this.state.dirty && !confirm('有未保存修改，放弃后切换文件？'))
            return;
        const seq = ++this.loadId;
        this.setState({ loading: true });
        try {
            const f = await api(`/projects/${this.props.data.project.id}/files?path=${encodeURIComponent(path)}`);
            if (seq === this.loadId)
                this.setState({ path, content: f.content, digest: f.digest, dirty: false, loading: false });
        }
        catch (e) {
            this.setState({ loading: false });
            this.props.perform(async () => { throw e; });
        }
    }
    render() {
        return <div className="page-scroll workspace-page"><SectionTitle title="项目工作区" sub={this.props.data.project.archived?"已归档项目源码只读，实验快照与准备区文件保留。":"编辑的是准备区，不会改变已经提交的实验快照。"}><button className="secondary" disabled={this.props.data.project.archived} onClick={() => {
                const path = prompt('新文件相对路径，例如 notes/research.md');
                if (path)
                    this.setState({ path, content: '', digest: null, dirty: true });
            }}><Icon name="plus" size={15}/>新建文件</button></SectionTitle><div className="workspace-grid"><nav className="file-tree" aria-label="项目文件"><div className="small-label">SOURCE FILES</div>{this.state.files.map(f => <button key={f.path} className={this.state.path === f.path ? 'active' : ''} onClick={() => this.open(f.path)}><Icon name="evidence" size={15}/><span>{f.path}</span></button>)}<p className="small muted">.git、可执行 Pi 配置与敏感配置不作为普通工作区资源加载。</p></nav><div className="editor"><div className="editor-toolbar"><code>{this.state.path || '选择文件'}</code>{this.state.dirty ? <span className="dirty-dot" title="未保存"/> : null}<span className="grow"/><button className="text-button" onClick={() => this.state.path && this.open(this.state.path)}>重新读取</button><button className="primary compact" disabled={this.props.data.project.archived || !this.state.path || !this.state.dirty || this.state.loading} onClick={() => this.props.perform(async () => { const f = await api(`/projects/${this.props.data.project.id}/files`, { path: this.state.path, content: this.state.content, expectedDigest: this.state.digest }); this.setState({ digest: f.digest, dirty: false }); await this.loadFiles(); }, '文件已保存')}>保存文件</button></div><textarea aria-label="文件内容" readOnly={this.props.data.project.archived} spellCheck={false} value={this.state.content} onChange={(e: any) => this.setState({ content: e.target.value, dirty: true })}/><div className="editor-status"><span>UTF-8</span><span>{this.state.content.split('\n').length} 行</span><span>版本校验 {short(this.state.digest)}</span><span className="grow"/><span>冲突时保留当前编辑，不覆盖新版本</span></div></div></div><div className="notice"><Icon name="folder"/><p>实验代码可使用本地、Docker 或 SSH；源码、执行环境和资源在运行前单独批准。本地代码拥有当前用户权限，文件与网络不隔离。</p></div></div>;
    }
}
export class EvidenceView extends React.Component<{
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
        return <div className="page-scroll"><SectionTitle title="资料与证据" sub="资料是原始输入；只有明确定位并校验后的片段，才是证据。"><label className="secondary file-upload"><Icon name="plus" size={15}/>导入文本资料<input type="file" disabled={data.project.archived} accept=".txt,.md,.csv,.json,.py,.tex,.mjs" onChange={(e: any) => {
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
            }}/></label></SectionTitle>
 <div className="evidence-grid"><section className="surface artifact-list"><div className="surface-heading"><h2>文件产物</h2><span>{data.artifacts.length}</span></div><div className="search-field"><Icon name="search" size={16}/><input aria-label="搜索产物" placeholder="搜索文件名" value={this.state.query} onChange={(e: any) => this.setState({ query: e.target.value })}/></div>{data.artifacts.filter(a => a.title.includes(this.state.query)).slice().reverse().map(a => <button key={a.id} className={'artifact-item ' + (a.id === this.state.active ? 'active' : '')} onClick={() => this.open(a.id)}><Icon name="evidence"/><div><strong>{a.title}</strong><small>{(a.size / 1024).toFixed(1)} KB · {a.origin.startsWith('run') ? '实际运行产物' : a.origin === 'report' ? '确定性报告' : '已存储文件'}</small></div></button>)}{!data.artifacts.length ? <div className="inline-empty">导入文本，或完成一次实验以获取真实产物。</div> : null}</section><section className="surface artifact-preview"><div className="surface-heading"><h2>{artifact?.title ?? '产物预览'}</h2>{artifact ? <div className="actions"><button className="text-button" onClick={() => perform(() => downloadArtifact(artifact.id, artifact.title))}>下载</button><button className="secondary compact" disabled={data.project.archived} onClick={() => this.props.onRegister(artifact.id, this.state.content)}>登记为证据</button></div> : null}</div>{artifact ? <div><div className="preview-meta">SHA-256 <code>{artifact.digest}</code></div><pre className="document-preview">{this.state.content}</pre></div> : <Empty title="选择一份资料"><p>HTML、SVG 等内容均按文本预览，不执行其中的脚本。</p></Empty>}</section></div>
 <section className="surface"><div className="surface-heading"><h2>证据索引</h2><span className="small muted">每条证据固定原文、位置与内容摘要</span></div>{data.evidence.length ? data.evidence.map(e => <details className="evidence-record" key={e.id}><summary><span className="evidence-type">{e.type.toUpperCase()}</span><strong>{e.description}</strong><code>{short(e.id)}</code></summary><blockquote>{e.quote}</blockquote><p className="small muted">UTF-16 字符位置 {e.locator.start}–{e.locator.end} · 产物 {short(e.artifactId)}</p><button className="text-button" onClick={() => this.open(e.artifactId)}>查看原始产物</button>{(e as typeof e & {document?:DocumentEvidenceLink}).document&&this.props.onDocument?<button className="secondary compact" onClick={()=>{const link=(e as typeof e & {document:DocumentEvidenceLink}).document;this.props.onDocument?.({documentVersionId:link.documentVersionId,parseResultId:link.parseResultId,pageNumber:link.pageNumber,start:e.locator.start,end:e.locator.end});}}>回查固定文档页 {(e as typeof e & {document:DocumentEvidenceLink}).document.pageNumber}</button>:null}</details>) : <div className="inline-empty">检索命中或文件存在，不自动代表结论已被证据支持。</div>}</section>
 <section className="surface"><div className="surface-heading"><h2>结论候选与验收</h2><button className="secondary compact" disabled={data.project.archived||!data.evidence.length} onClick={this.props.onClaim}>提出结论候选</button></div>{data.claims.map(c => <div className="claim-record" key={c.id}><Badge value={c.status}/><p>{c.statement}</p>{c.validity==='stale'?<p className="inline-warning">前提或审查已失效：仅保留历史，不用于新报告。</p>:null}<p className="small muted">限制：{c.limitations.join('；') || '未填写'} · 证据 {c.evidenceIds.map(short).join(', ')}</p>{!data.project.archived && c.status === 'proposal' && c.validity !== 'stale' ? <div className="actions"><button className="secondary compact" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'accepted' }), '结论已由用户采纳')}>人工确认采纳</button><button className="text-button" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'disputed' }))}>标为争议</button><button className="text-button danger" onClick={() => perform(() => api(`/claims/${c.id}/decide`, { expectedVersion: c.version, status: 'rejected' }))}>拒绝</button></div> : null}</div>)}{!data.claims.length ? <div className="inline-empty">尚无结论候选。多个 Agent 一致同意，不会自动生成已采纳事实。</div> : null}</section></div>;
    }
}
export {ReportsView} from './report-view.js';
export {LiteratureView} from './literature-view.js';
export {SettingsView} from './settings-view.js';
