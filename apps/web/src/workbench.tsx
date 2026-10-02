import * as React from 'react';
import {RunGrants,runGrantUsable} from './run-grants.js';
import {LogView,type LogPage} from './log-view.js';
import {SessionHistory} from './session-history.js';
import {MessageQueue,type QueueMessage} from './message-queue.js';
import {ComputeWait} from './scheduler-view.js';
import { WakeupPanel } from './campaigns.js';
import { comparableRuns, comparisonMetric } from './models.js';
import { ExperimentGraph } from './experiment-graph.js';
import {ChatWorkflows} from './chat-workflows.js';
import {ComposerControls} from './composer-controls.js';
import { api, artifactText, downloadArtifact } from './api.js';
import type { Bootstrap, MessageAttachment, ModelConfig, ProjectState, Row, Session, Experiment, Run, SessionHistoryPage } from './models.js';
import { short, number, date, label } from './models.js';
import { Icon, Badge, Empty, SectionTitle } from './ui.js';
export type Perform = (fn: () => Promise<any>, success?: string) => Promise<any>;
export class Chat extends React.Component<{
    data: ProjectState;
    boot: Bootstrap;
    session: Row<Session> | undefined;
    messages: QueueMessage[];
    pendingMessages:QueueMessage[];
    pendingTotal:number;
    pendingNextCursor:string|null;
    canSteer:boolean;
    history:SessionHistoryPage|null;
    historyAnchor:{direction:'before'|'after';id:string}|null;
    onHistory:(anchor:{direction:'before'|'after';id:string}|null)=>void;
    stream: string;
    streamTruncated?:boolean;
    busy:boolean;
    perform: Perform;
    onToggle: () => void;
    onNew: () => void;
    onExperiments: () => void;
    onWorkspace: () => void;
    onSession: (id:string) => void;
    onExperiment: (id:string) => void;
    onRun: (runId:string,experimentId:string) => void;
}, {draft:string;draftVersion:number;attachments:MessageAttachment[]}> {
    state:{draft:string;draftVersion:number;attachments:MessageAttachment[]}={draft:'',draftVersion:0,attachments:[]};
    private mounted=true;
    componentWillUnmount(){this.mounted=false;}
    render() {
        const { data, boot, session, messages } = this.props;
        const canSend = boot.runtime.ready && !this.props.busy && !data.project.archived && !!session && !!session.model.provider && !!session.model.model && !session.taskId && session.state!=='archived' && !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest);
        const hasDraft=!!this.state.draft.trim()||this.state.attachments.length>0;
        return <div className="chat-page"><div className="chat-heading"><div><h1>{session?.title ?? '研究会话'}</h1><span className="muted">{session ? `${session.model.provider || '未配置供应商'} / ${session.model.model || '未配置模型'}` : '每个主会话都有独立历史和工作区'}</span></div>{session ? <div className="actions"><Badge value={session.state}/><button className="icon-button" title="重命名会话" aria-label="重命名会话" onClick={() => {
                    const title = prompt('会话名称', session.title);
                    if (title)
                        this.props.perform(() => api(`/sessions/${session.id}`, { title, expectedVersion: session.version }));
                }}><Icon name="evidence"/></button></div> : null}</div>
 {!boot.runtime.ready ? <div className="notice runtime-notice"><span className="status-dot amber"/><div><strong>Pi 尚未就绪</strong><p>{boot.runtime.message} 项目、快照、真实数值实验和证据管理仍可使用。</p></div></div> : null}
 {session?.taskId?<p className="notice runtime-notice">这是团队任务会话。请通过团队任务控件发送指令或管理任务。</p>:session?.state==='archived'?<p className="notice runtime-notice">此会话已归档，不能发送消息。</p>:null}
 <div className="conversation" aria-live="polite">{messages.length === 0 && !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) ? <div className="welcome"><div className="welcome-mark">π</div><h2>今天想研究什么？</h2><p>从一个问题开始，逐步形成实验与结果。</p><div className="welcome-actions"><button onClick={this.props.onExperiments}><Icon name="experiment"/><span>查看实验</span><Icon name="arrow"/></button><button onClick={this.props.onWorkspace}><Icon name="folder"/><span>查看项目文件</span><Icon name="arrow"/></button></div><p className="small muted">这是工作台的引导界面，不是模型生成的研究结果。</p></div> : <SessionHistory projectId={data.project.id} sessionId={session?.id??''} messages={messages} history={this.props.history} historyAnchor={this.props.historyAnchor} onNavigate={this.props.onHistory} perform={this.props.perform}/>}{!this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) ? <WakeupPanel data={data} busy={false} sessionId={session?.id} perform={this.props.perform} onSession={this.props.onSession}/> : null}{!this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) && this.props.stream ? <article className="message"><div className="message-avatar">π</div><div className="message-body"><div className="message-meta">Pi · 流式输出，等待最终消息</div><div className="prose-text">{this.props.stream}</div>{this.props.streamTruncated?<p className="small muted">仅显示当前输出尾部，前文已省略；完整内容以原生会话记录为准。</p>:null}</div></article> : null}{session && !this.props.historyAnchor && (!this.props.history || this.props.history.atLatest) ? <ChatWorkflows data={data} session={session} busy={this.props.busy} perform={this.props.perform} onSession={this.props.onSession} onExperiment={this.props.onExperiment} onRun={this.props.onRun}/> : null}</div>
 <div className="composer-wrap"><div className="composer-stack">{session?.role==='coordinator'?<MessageQueue key={data.project.id+':'+session.id} projectId={data.project.id} sessionId={session.id} messages={this.props.pendingMessages} total={this.props.pendingTotal} nextCursor={this.props.pendingNextCursor} canSteer={this.props.canSteer} disabled={data.project.archived||!!session.taskId||session.state==='archived'||!!this.props.historyAnchor||!!this.props.history&&!this.props.history.atLatest} busy={this.props.busy} perform={this.props.perform}/>:null}<form className="composer" onSubmit={(e: any) => {
                e.preventDefault();
                if (!session || !canSend || !this.state.draft.trim()&&!this.state.attachments.length)return;
                const draft=this.state.draft, draftVersion=this.state.draftVersion, attachments=this.state.attachments.slice(), content=draft.trim()?draft:'请查看附件。', sentIds=new Set(attachments.map(attachment=>attachment.documentVersionId));
                this.props.perform(async()=>{await api(`/sessions/${session.id}/messages`,{content,...(attachments.length?{attachmentDocumentIds:attachments.map(attachment=>attachment.documentVersionId)}:{})});if(this.mounted&&this.props.session?.id===session.id)this.setState(current=>({draft:current.draftVersion===draftVersion&&current.draft===draft?'':current.draft,attachments:current.attachments.filter(attachment=>!sentIds.has(attachment.documentVersionId))}));});
            }}><textarea aria-label="研究问题" placeholder={session?.taskId ? '请通过团队任务控件操作' : session?.state==='archived' ? '已归档会话不可发送' : this.props.historyAnchor||this.props.history&&!this.props.history.atLatest ? '返回最新消息后可发送' : canSend ? '描述研究问题…' : '配置 Pi 供应商和模型后，在这里开始研究…'} value={this.state.draft} disabled={!!session?.taskId||session?.state==='archived'} onChange={(e: any) => this.setState(current=>({ draft: e.target.value, draftVersion: current.draftVersion+1 }))} onKeyDown={(e: any) => {
                if(e.key!=='Enter'||e.shiftKey||e.isComposing||e.nativeEvent?.isComposing||e.keyCode===229||e.nativeEvent?.keyCode===229)return;
                e.preventDefault();e.currentTarget.form.requestSubmit();
            }}/><ComposerControls key={`${data.project.id}:${session?.id??''}`} boot={boot} projectId={data.project.id} projectArchived={data.project.archived} modelLocked={!!session?.workingGrantId||!!session?.textCorpusGrantId||!!session?.discoveryGrantId||!!session?.runGrantId||!!data.teams?.some(team=>team.rootSessionId===session?.id&&!['completed','partial','failed','cancelled'].includes(team.state))} session={session} busy={this.props.busy} perform={this.props.perform} attachments={this.state.attachments} onAddAttachment={attachment=>this.setState(current=>({attachments:[...current.attachments,attachment]}))} onRemoveAttachment={documentVersionId=>this.setState(current=>({attachments:current.attachments.filter(attachment=>attachment.documentVersionId!==documentVersionId)}))} canSend={canSend} hasDraft={hasDraft} onSendModel={(model:ModelConfig)=>{if(session)this.props.perform(()=>api(`/sessions/${session.id}/model`,{expectedVersion:session.version,model}),'已更新当前会话模型；项目默认模型未更改');}}><div className="chat-collaboration-control"><button type="button" role="switch" aria-label="多智能体模式" aria-checked={data.project.settings.enabled ? 'true' : 'false'} title="项目级设置，同项目所有研究会话共享" className={'switch ' + (data.project.settings.enabled ? 'on' : '')} disabled={this.props.busy || data.project.archived || !session || !!session.taskId || session.state === 'archived'} onClick={this.props.onToggle}><span/></button><span>多智能体</span></div></ComposerControls></form></div><div className="composer-caption">固定快照 · 显式审批 · 可追溯证据 <span>Enter 发送 · Shift + Enter 换行 · Ctrl/⌘ + Enter 发送</span></div></div></div>;
    }
}
export function Experiments({ data, selected, onSelect, onCreate, onChild, onRun, perform, busy, onSession, selectedRunGrant, onSelectRunGrant }: {
    data: ProjectState;
    selected: string;
    perform?:Perform;busy?:boolean;onSession?:(id:string)=>void;selectedRunGrant?:string;onSelectRunGrant?:(id:string)=>void;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onChild: () => void;
    onRun?: (runId:string,experimentId:string)=>void;
}) {
    const measured = comparableRuns(data, selected);
    const metric=comparisonMetric(data,selected);
    const max=Math.max(...measured.map(r=>Math.abs(r.metrics![metric.key])),0.000001);
    return <div className="page-scroll"><SectionTitle title="实验与运行" sub="实验血缘、固定协议与真实观测，始终分开记录。"><button className="primary" onClick={onCreate}><Icon name="plus" size={16}/>新建实验</button></SectionTitle>
 {data.experiments.length ? <ExperimentGraph key={data.project.id} data={data} selected={selected} onSelect={onSelect}/> : <section className="surface"><div className="surface-heading"><h2>实验血缘</h2></div><Empty title="还没有实验节点"><p>从项目源码建立基线。方案变化后，可从选中的节点派生。</p><button className="secondary" onClick={onCreate}>创建基线实验</button></Empty></section>}
 {perform?<details className="experiment-run-grants" open={!!selectedRunGrant}><summary>有界运行授权</summary><RunGrants key={data.project.id} data={data} perform={perform} busy={!!busy} selectedGrant={selectedRunGrant} onSelect={onSelectRunGrant} onSession={onSession} onRun={onRun}/></details>:null}
 <div className="section-kpis"><div><strong>{data.experiments.length.toString().padStart(2, '0')}</strong><span>实验节点</span></div><div><strong>{data.runs.length.toString().padStart(2, '0')}</strong><span>正式运行</span></div><div><strong>{data.runs.filter(r => r.integrity === 'complete').length.toString().padStart(2, '0')}</strong><span>完整结果</span></div><div><strong>{data.evidence.length.toString().padStart(2, '0')}</strong><span>证据记录</span></div></div>
 <section className="surface"><div className="surface-heading"><h2>运行记录</h2><span className="small muted">退出成功 ≠ 假设成立</span></div>{data.runs.length ? <div className="table-wrap"><table><thead><tr><th>实验 / Run</th><th>执行</th><th>完整性</th><th>实测指标（按运行契约）</th></tr></thead><tbody>{data.runs.slice().reverse().map(r => <tr key={r.id} onClick={() => onSelect(r.experimentId)} className={r.experimentId === selected ? 'selected-row' : ''}><td><button className="text-button" onClick={(event:any)=>{event.stopPropagation();if(onRun)onRun(r.id,r.experimentId);else onSelect(r.experimentId);}}>{data.experiments.find(e => e.id === r.experimentId)?.title} · {short(r.id)}</button><small>{date(r.createdAt)}</small></td><td><Badge value={r.state}/></td><td><Badge value={r.integrity}/></td><td className="numeric">{Object.entries(r.manifest.contract.metrics).map(([k,m])=><div key={k}>{k}: {number(r.metrics?.[k])} {m.unit}</div>)}</td></tr>)}</tbody></table></div> : <div className="inline-empty">准备快照并获得批准后，运行会显示在这里。</div>}</section>
 {measured.length ? <section className="surface"><div className="surface-heading"><h2>同协议结果速览</h2><span className="small muted">{metric.key} · {metric.direction==='max'?'越高越好':'越低越好'} · {metric.unit} · 同一契约</span></div><div className="metric-bars">{measured.map(r => <div className="metric-row" key={r.id}><span>{data.experiments.find(e => e.id === r.experimentId)?.title}</span><div className="metric-track"><div style={{ width: Math.max(0.5, Math.abs(r.metrics![metric.key]) / max * 100) + '%' }}/></div><code>{number(r.metrics![metric.key])}</code></div>)}</div><p className="footnote">长度表示绝对值，仅作数值速览；优劣由指标方向及完整证据判断。不同契约不混比，执行成功不等于假设成立。</p></section> : null}</div>;
}
export function OutcomeReview({run,perform}:{run:Row<Run>;perform:Perform}) {
    if(!['succeeded','failed','cancelled'].includes(run.state))return null;
    const disposition=run.answerDisposition??(run.metrics?'answered':run.state==='cancelled'&&!run.startedAt?'unanswered':'needs_review');
    if(disposition!=='needs_review')return <p className="small muted">问题回答状态：{disposition==='answered'?'已有结果，源码受保护':'用户确认未回答，可准备有界修复'}</p>;
    const review=(disposition:'answered'|'unanswered')=>{const reason=prompt('先检查日志与原始产物，再说明此次运行是否回答研究问题：');if(reason)void perform(()=>api(`/runs/${run.id}/outcome-review`,{expectedVersion:run.version,disposition,reason}),'已保存结果评议；不会自动启动计算');};
    return <div className="approval-card"><h4>此次运行是否回答研究问题？</h4><p className="small">无有效数值不一定表示没有研究结果。请结合假设与真实日志判断；此操作不会修改执行状态、产物完整性或假设结论。</p><div className="stack-actions"><button className="secondary" onClick={()=>review('unanswered')}>未回答：允许准备修复</button><button className="secondary" onClick={()=>review('answered')}>已回答：冻结节点</button></div></div>;
}
type RunSourceFile={path:string;size:number;digest:string;mode?:string};
class RunFiles extends React.Component<{run:Row<Run>;data:ProjectState;perform:Perform},{
    artifactId:string; artifactContent:string; artifactLoading:boolean; artifactError:string;
    files:RunSourceFile[]; sourceLoaded:boolean; sourcePath:string; sourceContent:string; sourceCursor:number; sourceComplete:boolean; sourceLoading:boolean; sourceError:string; gitCommit:string;
}> {
    state={artifactId:'',artifactContent:'',artifactLoading:false,artifactError:'',files:[] as RunSourceFile[],sourceLoaded:false,sourcePath:'',sourceContent:'',sourceCursor:0,sourceComplete:false,sourceLoading:false,sourceError:'',gitCommit:this.props.run.manifest.gitCommit??''};
    private sourceEpoch=0;
    private artifactEpoch=0;
    componentWillUnmount(){this.sourceEpoch++;this.artifactEpoch++;}
    async openArtifact(id:string){
        const epoch=++this.artifactEpoch;this.setState({artifactId:id,artifactContent:'',artifactLoading:true,artifactError:''});
        try {const content=await artifactText(id);if(content.includes('\0'))throw Error('二进制产物请下载查看。');if(epoch===this.artifactEpoch)this.setState({artifactContent:content.length>65536?content.slice(0,65536)+'\n…预览到此，下载可查看完整文件。':content});}
        catch(error){if(epoch===this.artifactEpoch)this.setState({artifactError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.artifactEpoch)this.setState({artifactLoading:false});}
    }
    sourceOperation(name:string,input:any){return api(`/operations/${name}`,{projectId:this.props.data.project.id,input:{runId:this.props.run.id,...input}});}
    async loadSource(){
        const epoch=++this.sourceEpoch;this.setState({sourceLoading:true,sourceError:''});
        try {const result=await this.sourceOperation('run_source_list',{});if(result.sourceDigest!==this.props.run.manifest.snapshotDigest)throw Error('源码摘要与所选运行不一致。');if(epoch===this.sourceEpoch)this.setState({files:result.files,sourceLoaded:true,gitCommit:result.gitCommit??''});}
        catch(error){if(epoch===this.sourceEpoch)this.setState({sourceError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.sourceEpoch)this.setState({sourceLoading:false});}
    }
    async readSource(path:string,append=false){
        if(append&&this.state.sourceLoading)return;
        const epoch=++this.sourceEpoch,cursor=append?this.state.sourceCursor:0;
        this.setState(previous=>({...previous,sourceLoading:true,sourceError:'',sourcePath:path,...(!append?{sourceContent:'',sourceCursor:0,sourceComplete:false}:{})}));
        try {const result=await this.sourceOperation('run_source_read',{path,cursor,limit:16000});if(result.sourceDigest!==this.props.run.manifest.snapshotDigest)throw Error('源码摘要与所选运行不一致。');if(epoch===this.sourceEpoch)this.setState({sourceContent:(append?this.state.sourceContent:'')+result.content,sourceCursor:result.end,sourceComplete:result.complete});}
        catch(error){if(epoch===this.sourceEpoch)this.setState({sourceError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.sourceEpoch)this.setState({sourceLoading:false});}
    }
    render(){
        const {run,data,perform}=this.props,artifacts=run.artifactIds.map(id=>data.artifacts.find(a=>a.id===id)).filter(a=>!!a),file=this.state.files.find(f=>f.path===this.state.sourcePath);
        return <div>
            <details open><summary>真实运行日志</summary><LogView streamLabel="日志流" read={(request,signal)=>api<LogPage>(`/runs/${run.id}/logs?stream=${request.stream}&cursor=${request.cursor}${request.identity?'&identity='+encodeURIComponent(request.identity):''}`,undefined,'GET',signal)}/></details>
            <details open><summary>原始指标与产物</summary>{artifacts.length?<ul>{artifacts.map(a=><li key={a.id}><button className="text-button" onClick={()=>void this.openArtifact(a.id)}>{a.title}</button><button className="text-button" aria-label={`下载 ${a.title}`} onClick={()=>perform(()=>downloadArtifact(a.id,a.title))}>下载</button><small className="muted">{a.size} 字节 · {short(a.digest)}</small></li>)}</ul>:<p className="small muted">尚无归档产物。执行结束后在这里查看原始 metrics.json 与输出文件。</p>}{this.state.artifactLoading?<p role="status">读取产物…</p>:null}{this.state.artifactError?<p role="alert" className="error-text">{this.state.artifactError}</p>:null}{this.state.artifactId&&!this.state.artifactLoading&&!this.state.artifactError?<pre className="logs" aria-label="原始产物内容">{this.state.artifactContent||'（空文件）'}</pre>:null}</details>
            <details><summary>本次运行的固定源码</summary><p className="small muted">实验修订 v{run.manifest.experimentRevision} · 源码 SHA-256</p><code className="digest">{run.manifest.snapshotDigest}</code>{this.state.gitCommit?<p>Git commit <code className="digest">{this.state.gitCommit}</code></p>:null}<button className="secondary compact" disabled={this.state.sourceLoading} onClick={()=>void this.loadSource()}>读取运行源码清单</button>{this.state.sourceLoaded?<label>固定源码文件<select aria-label="固定源码文件" value={this.state.sourcePath} onChange={(e:any)=>{if(e.target.value)void this.readSource(e.target.value);}}><option value="">选择文件</option>{this.state.files.map(f=><option key={f.path} value={f.path}>{f.path} · {f.size} 字节</option>)}</select></label>:null}{this.state.sourceError?<p role="alert" className="error-text">{this.state.sourceError}</p>:null}{file?<div><p className="small muted">{file.path} · {file.mode??'旧版未记录模式'}</p><code className="digest">{file.digest}</code><pre className="logs" aria-label="固定运行源码">{this.state.sourceContent||(this.state.sourceLoading?'读取源码…':'（空文件）')}</pre><button className="secondary compact" disabled={this.state.sourceLoading||this.state.sourceComplete} onClick={()=>void this.readSource(file.path,true)}>{this.state.sourceComplete?'源码已完整读取':'读取后续源码'}</button></div>:null}</details>
        </div>;
    }
}
export class Inspector extends React.Component<{
    data: ProjectState;
    boot: Bootstrap;
    tab: string;
    sessionId:string;
    inlineWorkflows?:boolean;
    experiment: Row<Experiment> | undefined;
    perform: Perform;
    onPrepare: () => void;
    onChild: () => void;
    onConfig: () => void;
    onDirective: (teamId: string) => void;
    onScheduler?:()=>void;
    selectedRun?:string;
    onRun?:(id:string)=>void;
}> {
    currentRun() { const runs=this.props.data.runs.filter(r=>r.experimentId===this.props.experiment?.id);return this.props.selectedRun?runs.find(r=>r.id===this.props.selectedRun):runs[runs.length-1]; }
    render() {
        const { data, boot, experiment: e, perform } = this.props;
        const teams = data.teams.slice().reverse().filter(t => this.props.tab !== 'chat' || t.rootSessionId === this.props.sessionId);
        const team = teams[0];
        const tasks = team ? data.tasks.filter(t => t.teamId === team.id) : [];
        const budget = data.budgets.find(b => b.teamId === team?.id);
        const run = this.currentRun();
        const intents = data.intents.filter(i => i.experimentId === e?.id), intent = intents[intents.length - 1], approval = data.approvals.find(a => a.id === intent?.approvalId);
        const runGrantRef=intent?.runGrant??approval?.runGrant,runGrant=(data.runGrants??[]).find(g=>g.id===runGrantRef?.id);
        const teamIds = new Set(teams.map(t => t.id));
        const inlineReviewTeams=new Set(this.props.inlineWorkflows?(data.reviews??[]).filter(r=>r.producerSessionId===this.props.sessionId).map(r=>r.teamId):[]);
        const pendingTeams = data.approvals.filter(a => a.subjectKind === 'team' && a.status === 'pending' && teamIds.has(a.subjectId) && !inlineReviewTeams.has(a.subjectId));
        return <aside className="inspector">
 <div className="inspector-title"><Icon name={this.props.tab === 'experiments' ? 'experiment' : 'branch'}/><h2>{this.props.tab === 'experiments' ? '实验详情' : '协作空间'}</h2><span className="small muted">本地</span></div>
 {this.props.tab === 'experiments' && e ? <div className="inspector-section"><div className="detail-title"><h3>{e.title}</h3><div data-testid="selected-experiment-state"><Badge value={e.lifecycle}/></div></div><p className="detail-hypothesis">{e.hypothesis}</p><dl className="details"><dt>实验 ID</dt><dd><code>{short(e.id)}</code></dd><dt>方案修订</dt><dd>v{e.revision}</dd><dt>固定入口</dt><dd><code>{e.contract.command.join(' ')}</code></dd><dt>计算方式</dt><dd>{e.contract.runner === 'trusted-example' ? '受信本地数值示例' : 'Docker · 固定镜像隔离运行'}</dd><dt>数据版本</dt><dd>{e.contract.datasetVersion}</dd></dl><div className="stack-actions"><button className="primary" onClick={this.props.onPrepare} disabled={!!(intent?.status === 'prepared' && approval?.status === 'pending' && intent.manifest.experimentRevision === e.revision)}><Icon name="run" size={15}/>准备运行</button><div className="actions"><button className="secondary" onClick={this.props.onChild}><Icon name="branch" size={15}/>派生子实验</button><button className="secondary" onClick={this.props.onConfig}>查看配置</button></div></div>
 {intent?.status === 'prepared' && approval ? <div className="approval-card"><div className="small-label">正式运行审批</div><Badge value={approval.status}/><p>此批准只授权当前固定快照与计算契约。</p>{runGrantRef?<p className="notice-inline">绑定 RunGrant {short(runGrantRef.id)} · {runGrant?.effectiveState??'等待核验'}；不能改用独立单次批准。</p>:null}<code className="digest">{intent.manifest.snapshotDigest.slice(0, 20)}…</code><dl className="details"><dt>执行参数</dt><dd><code>{JSON.stringify(intent.manifest.contract.command)}</code></dd><dt>镜像</dt><dd><code>{intent.manifest.contract.image??'受信示例'}</code></dd><dt>资源</dt><dd>{intent.manifest.contract.cpus} CPU · {intent.manifest.contract.memoryMb} MiB · {intent.manifest.contract.timeoutSeconds} 秒</dd><dt>必需产物</dt><dd>{intent.manifest.contract.expectedArtifacts.join('、')}</dd></dl>{approval.status === 'pending'&&!runGrantRef ? <div className="stack-actions"><button className="primary" onClick={() => perform(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }); const submitted=await api(`/run-intents/${intent.id}/submit`, {});this.props.onRun?.(submitted.id); }, '已提交真实运行')}>批准并提交</button><button className="text-button" onClick={() => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false }), '已拒绝运行')}>拒绝</button></div> : approval.status === 'approved' ? <button className="primary" disabled={!!runGrantRef&&!runGrantUsable(runGrant)} onClick={() => perform(async()=>{const submitted=await api(`/run-intents/${intent.id}/submit`, {});this.props.onRun?.(submitted.id);})}>{runGrantRef?'提交授权内固定运行（计一次）':'提交已批准运行'}</button> : null}</div> : null}
 {this.props.selectedRun&&!run?<p role="alert" className="error-text">指定 Run 不属于当前实验或已不可用，未显示其他运行。</p>:null}{run ? <div className="run-detail"><label>查看运行<select aria-label="查看运行" value={run.id} onChange={(event:any)=>this.props.onRun?.(event.target.value)}>{data.runs.filter(r=>r.experimentId===e.id).slice().reverse().map(r=><option key={r.id} value={r.id}>{date(r.createdAt)} · {short(r.id)} · {label(r.state)}</option>)}</select></label><h4>运行 <code>{short(run.id)}</code></h4>{run.execution?<dl className="details"><dt>Docker context</dt><dd>{run.execution.dockerContext}</dd><dt>实际镜像 ID</dt><dd><code className="digest">{run.execution.imageId??'等待容器预检'}</code></dd></dl>:null}<div className="actions"><Badge value={run.state}/><Badge value={run.integrity}/></div>{run.metrics ? <dl className="details">{Object.entries(run.metrics).map(([k, v]) => <div className="detail-pair" key={k}><dt>{k}</dt><dd className="numeric">{number(v)}</dd></div>)}</dl> : null}{['queued','submitting','running','cancelling','unknown'].includes(run.state)?<ComputeWait data={data} kind="run" id={run.id} onScheduler={this.props.onScheduler}/>:null}<OutcomeReview run={run} perform={perform}/><p className="small muted">科研判断：{run.judgment === 'pending' ? '尚未判定' : run.judgment}</p>{run.error ? <p className="error-text">{run.error}</p> : null}{['queued', 'running', 'submitting'].includes(run.state) ? <button className="danger-outline" onClick={() => perform(() => api(`/runs/${run.id}/cancel`, {}), '已请求取消指定实验')}>取消这个实验</button> : null}<RunFiles key={run.id} run={run} data={data} perform={perform}/></div> : null}</div> : null}
 <details className="inspector-collaboration" open={pendingTeams.length>0||['active','paused','draining'].includes(team?.state??'')||this.props.tab==='chat'&&teams.length>0}><summary>协作计划与结果<span>{pendingTeams.length?'待审批':team?label(team.state):'暂无任务'}</span></summary><div className="inspector-section">{this.props.tab==='chat'?<p className="small muted">协作计划由当前主会话中的 Pi 根据对话需要生成；已有任务状态和结果会保留在这里。</p>:<p className="small muted">协作计划由主会话中的 Pi 根据对话需要生成；已有任务状态和结果会保留在这里。</p>}{this.props.onScheduler?<button className="text-button" onClick={this.props.onScheduler}>查看资源与调度</button>:null}</div>
 {pendingTeams.map(a => {
     const pendingTeam=teams.find(t=>t.id===a.subjectId),canStart=data.project.settings.enabled&&pendingTeam?.state==='awaiting_approval'&&pendingTeam.delegationEnabled;
     return <div className="inspector-section" key={a.id}><div className="small-label">待批准的协作计划</div><h3>{pendingTeam?.goal}</h3><p className="small muted">{a.reason}</p>{!canStart?<p className="small muted" role="status">此计划已停止；请在对话中重新提出任务。</p>:null}<button className="primary full" disabled={!canStart} onClick={() => { if (!canStart) return; perform(async () => { await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }); await api(`/teams/${a.subjectId}/activate`, {}); }, '协作计划已批准'); }}>批准并启动协作</button><button className="text-button" onClick={() => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false }))}>拒绝此计划</button></div>;
 })}
 {team ? <div className="inspector-section"><div className="surface-heading"><h3>当前团队</h3><Badge value={team.state}/></div><p className="team-goal">{team.goal}</p>{team.blockReason?<p className="inline-warning">{team.blockReason}</p>:null}{team.state === 'active' && !boot.runtime.ready ? <p className="inline-warning">尚未启动助手：Pi 未就绪。任务仍保存在队列中，没有模拟执行。</p> : null}<div className="team-progress"><strong>{tasks.filter(t => t.acceptance === 'accepted').length}<span> / {tasks.length}</span></strong><span>任务已验收</span></div>{tasks.map(t => <div className="task-card" key={t.id}><div className="task-top"><div className={'role-mark role-' + t.role}>{label(t.role).slice(0, 1)}</div><div><strong>{label(t.role)} <code>{t.key}</code></strong><span>{label(t.execution)}</span></div></div><p>{t.objective}</p><div className="task-footer"><span>验收：{label(t.acceptance)}</span><span>{t.reviewOf ? '审查 ' + t.reviewOf : t.dependencies.length ? '依赖 ' + t.dependencies.join(', ') : '无前置依赖'}</span></div>{t.blockReason ? <p className="small error-text">{t.blockReason}</p> : null}{['running','pending'].includes(t.execution) ? <button className="text-button danger" onClick={() => perform(() => api(`/tasks/${t.id}/cancel`, {}))}>停止此助手</button> : null}{['failed','cancelled','blocked'].includes(t.execution) ? <button className="text-button" onClick={() => perform(() => api(`/tasks/${t.id}/retry`, {}))}>新尝试重试</button> : null}{t.result ? <details><summary>结果与限制</summary>{t.role === 'reviewer' ? <p className="small" role="status">审查意见：{t.result.verdict === 'accept' ? '接受' : t.result.verdict === 'reject' ? '拒绝' : t.result.verdict === 'disputed' ? '存在争议' : '未提供；不能视为通过'}（独立于任务验收状态）</p> : null}<p className="small prose-text">{t.result.summary}</p></details> : null}{t.execution === 'output_submitted' && ['pending','rejected','disputed'].includes(t.acceptance) ? <button className="text-button" onClick={() => {
                            const reason = prompt('人工审查依据（将保留记录）');
                            if (reason)
                                perform(() => api(`/tasks/${t.id}/manual-review`, { verdict: 'accepted', reason }));
 }}>人工确认验收</button> : null}</div>)}{budget ? <div className="budget-note">尝试额度：{budget.used} 已结算 / {budget.reserved} 已预留 / {budget.unknown} 待对账<br />总额度 {budget.limit} 次。此额度不是供应商账单上限。</div> : null}<div className="actions wrap">{team.state === 'active' ? <button className="secondary compact" onClick={() => perform(() => api(`/teams/${team.id}/pause`, {}))}>暂停分配</button> : null}{team.state === 'paused' ? <button className="secondary compact" onClick={() => perform(() => api(`/teams/${team.id}/resume`, {}))}>恢复</button> : null}<button className="secondary compact" onClick={() => this.props.onDirective(team.id)}>引导 / 改变目标</button></div></div> : <div className="inspector-section muted small">{this.props.tab==='chat'?'协作计划由当前主会话中的 Pi 按需生成；不会在 Inspector 中手动创建，已有结果会保留。':'协作计划由主会话中的 Pi 按需生成；已有结果会保留。'}</div>}
</details>
 <div className="inspector-footer"><span className="status-dot"/>所有结果写入本地数据库</div></aside>;
    }
}
