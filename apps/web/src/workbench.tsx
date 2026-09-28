import { WakeupPanel } from './campaigns.js';
import { comparableRuns, comparisonMetric } from './models.js';
import { api, artifactText, downloadArtifact } from './api.js';
import type { Bootstrap, ProjectState, Row, Session, Message, Experiment, Run } from './models.js';
import { short, number, date, label } from './models.js';
import { Icon, Badge, Empty, SectionTitle } from './ui.js';
export type Perform = (fn: () => Promise<any>, success?: string) => Promise<any>;
export class Chat extends React.Component<{
    data: ProjectState;
    boot: Bootstrap;
    session: Row<Session> | undefined;
    messages: Row<Message>[];
    stream: string;
    perform: Perform;
    onNew: () => void;
    onExperiments: () => void;
    onWorkspace: () => void;
    onSession: (id:string) => void;
}, {
    draft: string;
    mode: string;
}> {
    state = { draft: '', mode: 'prompt' };
    render() {
        const { data, boot, session, messages } = this.props;
        const canSend = boot.runtime.ready && !!session?.model.provider && !!session?.model.model;
        return <div className="chat-page"><div className="chat-heading"><div><h1>{session?.title ?? '研究会话'}</h1><span className="muted">{session ? `${session.model.provider || '未配置供应商'} / ${session.model.model || '未配置模型'}` : '每个主会话都有独立历史和工作区'}</span></div>{session ? <div className="actions"><Badge value={session.state}/><button className="icon-button" title="重命名会话" aria-label="重命名会话" onClick={() => {
                    const title = prompt('会话名称', session.title);
                    if (title)
                        this.props.perform(() => api(`/sessions/${session.id}`, { title, expectedVersion: session.version }));
                }}><Icon name="evidence"/></button></div> : null}</div>
 {!canSend ? <div className="notice runtime-notice"><span className="status-dot amber"/><div><strong>Pi 尚未就绪</strong><p>{boot.runtime.message} 项目、快照、真实数值实验和证据管理仍可使用。</p></div></div> : null}
 <div className="conversation" aria-live="polite">{messages.length === 0 ? <div className="welcome"><div className="welcome-mark">π</div><h2>让研究过程，<br />有迹可循。</h2><p>从问题到实验，再到可信证据。<br />每一次运行都有自己的快照，每一步决定都保留依据。</p><div className="welcome-actions"><button onClick={this.props.onExperiments}><Icon name="experiment"/><span>建立一个可复现的实验</span><Icon name="arrow"/></button><button onClick={this.props.onWorkspace}><Icon name="folder"/><span>查看项目代码与配置</span><Icon name="arrow"/></button></div><p className="small muted">这是工作台的引导界面，不是模型生成的研究结果。</p></div> : messages.map(m => <article className={'message message-' + m.role} key={m.id}><div className="message-avatar">{m.role === 'user' ? '我' : m.role === 'assistant' ? 'π' : '·'}</div><div className="message-body"><div className="message-meta"><strong>{m.role === 'user' ? '你' : m.role === 'assistant' ? (m.wakeupId ? 'Pi · 结果分析' : 'Pi') : (m.wakeupId ? '持久化结果通知' : '工作台状态通知')}</strong><span>{date(m.createdAt)}</span>{m.status === 'failed' || m.status === 'cancelled' ? <Badge value={m.status}/> : null}</div><div className="prose-text">{m.content || '（本次响应没有可展示的文本）'}</div>{m.error ? <p className="error-text">{m.error}</p> : null}<div className="message-tools"><button onClick={() => this.props.perform(async () => { const fork = await api(`/sessions/${session!.id}/branch`, { messageId: m.id }); return fork; }, '已创建对话分支；实验记录保持不变')}>从此处分支</button>{m.role === 'user' && ['failed', 'cancelled'].includes(m.status) ? <button onClick={() => this.props.perform(() => api(`/sessions/${session!.id}/retry`, { messageId: m.id }))}>重试此消息</button> : null}</div></div></article>)}<WakeupPanel data={data} busy={false} sessionId={session?.id} perform={this.props.perform} onSession={this.props.onSession}/>{this.props.stream ? <article className="message"><div className="message-avatar">π</div><div className="message-body"><div className="message-meta">Pi · 流式输出，等待最终消息</div><div className="prose-text">{this.props.stream}</div></div></article> : null}</div>
 <div className="composer-wrap"><form className="composer" onSubmit={(e: any) => {
                e.preventDefault();
                if (!session || !this.state.draft.trim())
                    return;
                const content = this.state.draft;
                this.props.perform(async () => { await api(`/sessions/${session.id}/messages`, { content, mode: this.state.mode }); this.setState({ draft: '' }); });
            }}><textarea aria-label="研究问题" placeholder={canSend ? '描述研究问题，或发消息引导当前任务…' : '配置 Pi 供应商和模型后，在这里开始研究…'} value={this.state.draft} onChange={(e: any) => this.setState({ draft: e.target.value })} onKeyDown={(e: any) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    e.currentTarget.form.requestSubmit();
                }
            }}/><div className="composer-toolbar"><select aria-label="消息方式" value={this.state.mode} onChange={(e: any) => this.setState({ mode: e.target.value })}><option value="prompt">普通消息</option><option value="steer">引导当前任务</option><option value="follow_up">当前结束后执行</option></select><span className="small muted">{data.project.settings.enabled ? '按需协作已开启' : '单智能体模式'}</span><div className="grow"/>{session?.state === 'running' ? <button type="button" className="secondary compact" onClick={() => this.props.perform(() => api(`/sessions/${session.id}/interrupt`, {}), '已停止 Agent；正式实验未取消')}><Icon name="stop" size={14}/>停止 Agent</button> : null}<button className="primary compact" disabled={!canSend || !this.state.draft.trim() || !session}><Icon name="arrow" size={16}/>发送</button></div></form><div className="composer-caption">固定快照 · 显式审批 · 可追溯证据 <span>Ctrl + Enter 发送</span></div></div></div>;
    }
}
export function Experiments({ data, selected, onSelect, onCreate, onChild, onRun }: {
    data: ProjectState;
    selected: string;
    onSelect: (id: string) => void;
    onCreate: () => void;
    onChild: () => void;
    onRun?: (runId:string,experimentId:string)=>void;
}) {
    const roots = data.experiments.filter(e => !e.parentId);
    const tree = (e: Row<Experiment>, depth = 0): any => <div className="experiment-branch" key={e.id}><button className={'experiment-node ' + (selected === e.id ? 'selected' : '')} style={{ marginLeft: Math.min(depth, 6) * 20 }} onClick={() => onSelect(e.id)}><span className="node-symbol"><Icon name={e.parentId ? 'branch' : 'experiment'}/></span><span className="node-content"><strong>{e.title}</strong><span>{short(e.id)} <i>·</i> {e.parentId ? '派生自 ' + short(e.parentId) : '固定协议的基线实验'}</span></span><Badge value={e.lifecycle}/></button>{data.experiments.filter(c => c.parentId === e.id).map(c => tree(c, depth + 1))}</div>;
    const measured = comparableRuns(data, selected);
    const metric=comparisonMetric(data,selected);
    const max=Math.max(...measured.map(r=>Math.abs(r.metrics![metric.key])),0.000001);
    return <div className="page-scroll"><SectionTitle title="实验与运行" sub="实验血缘、固定协议与真实观测，始终分开记录。"><button className="primary" onClick={onCreate}><Icon name="plus" size={16}/>新建实验</button></SectionTitle>
 <div className="section-kpis"><div><strong>{data.experiments.length.toString().padStart(2, '0')}</strong><span>实验节点</span></div><div><strong>{data.runs.length.toString().padStart(2, '0')}</strong><span>正式运行</span></div><div><strong>{data.runs.filter(r => r.integrity === 'complete').length.toString().padStart(2, '0')}</strong><span>完整结果</span></div><div><strong>{data.evidence.length.toString().padStart(2, '0')}</strong><span>证据记录</span></div></div>
 <section className="surface"><div className="surface-heading"><h2>实验血缘</h2><span className="small muted">分支保存研究变化，不自动合并候选</span></div>{roots.length ? <div className="experiment-tree">{roots.map(e => tree(e))}</div> : <Empty title="还没有实验节点"><p>从项目源码建立基线。方案变化后，可从选中的节点派生。</p><button className="secondary" onClick={onCreate}>创建基线实验</button></Empty>}</section>
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
    stream:'stdout'|'stderr'; logs:string; cursor:number; logComplete:boolean; logLoading:boolean; logError:string;
    artifactId:string; artifactContent:string; artifactLoading:boolean; artifactError:string;
    files:RunSourceFile[]; sourceLoaded:boolean; sourcePath:string; sourceContent:string; sourceCursor:number; sourceComplete:boolean; sourceLoading:boolean; sourceError:string; gitCommit:string;
}> {
    state={stream:'stdout' as 'stdout'|'stderr',logs:'',cursor:0,logComplete:false,logLoading:false,logError:'',artifactId:'',artifactContent:'',artifactLoading:false,artifactError:'',files:[] as RunSourceFile[],sourceLoaded:false,sourcePath:'',sourceContent:'',sourceCursor:0,sourceComplete:false,sourceLoading:false,sourceError:'',gitCommit:this.props.run.manifest.gitCommit??''};
    private timer?:number;
    private logEpoch=0;
    private sourceEpoch=0;
    private artifactEpoch=0;
    componentDidMount(){void this.loadLogs();this.timer=window.setInterval(()=>{if(!this.state.logComplete)void this.loadLogs();},1500);}
    componentWillUnmount(){clearInterval(this.timer);this.logEpoch++;this.sourceEpoch++;this.artifactEpoch++;}
    async loadLogs(){
        if(this.state.logLoading)return;
        const epoch=this.logEpoch,{stream,cursor}=this.state;
        this.setState({logLoading:true,logError:''});
        try {const page=await api(`/runs/${this.props.run.id}/logs?stream=${stream}&cursor=${cursor}`);if(epoch===this.logEpoch)this.setState({logs:this.state.logs+page.content,cursor:page.cursor,logComplete:page.complete});}
        catch(error){if(epoch===this.logEpoch)this.setState({logError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.logEpoch)this.setState({logLoading:false});}
    }
    selectStream(stream:'stdout'|'stderr'){this.logEpoch++;this.setState({stream,logs:'',cursor:0,logComplete:false,logLoading:false,logError:''},()=>void this.loadLogs());}
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
        this.setState({sourceLoading:true,sourceError:'',sourcePath:path,...(!append?{sourceContent:'',sourceCursor:0,sourceComplete:false}:{})});
        try {const result=await this.sourceOperation('run_source_read',{path,cursor,limit:16000});if(result.sourceDigest!==this.props.run.manifest.snapshotDigest)throw Error('源码摘要与所选运行不一致。');if(epoch===this.sourceEpoch)this.setState({sourceContent:(append?this.state.sourceContent:'')+result.content,sourceCursor:result.end,sourceComplete:result.complete});}
        catch(error){if(epoch===this.sourceEpoch)this.setState({sourceError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.sourceEpoch)this.setState({sourceLoading:false});}
    }
    render(){
        const {run,data,perform}=this.props,artifacts=run.artifactIds.map(id=>data.artifacts.find(a=>a.id===id)).filter(a=>!!a),file=this.state.files.find(f=>f.path===this.state.sourcePath);
        return <div>
            <details open><summary>真实运行日志</summary><label>日志流<select aria-label="日志流" value={this.state.stream} onChange={(e:any)=>this.selectStream(e.target.value)}><option value="stdout">标准输出 stdout</option><option value="stderr">错误输出 stderr</option></select></label><pre className="logs" aria-label={`${this.state.stream} 日志`}>{this.state.logs||(this.state.logLoading?'读取日志…':'此流暂无内容。')}</pre>{this.state.logError?<p role="alert" className="error-text">{this.state.logError}</p>:null}<button className="secondary compact" disabled={this.state.logLoading||this.state.logComplete} onClick={()=>void this.loadLogs()}>{this.state.logLoading?'正在读取…':this.state.logComplete?'已读至日志结尾':'加载后续日志'}</button><p className="small muted">已读取 {this.state.cursor} 字节；运行期间自动继续读取。</p></details>
            <details open><summary>原始指标与产物</summary>{artifacts.length?<ul>{artifacts.map(a=><li key={a.id}><button className="text-button" onClick={()=>void this.openArtifact(a.id)}>{a.title}</button><button className="text-button" aria-label={`下载 ${a.title}`} onClick={()=>perform(()=>downloadArtifact(a.id,a.title))}>下载</button><small className="muted">{a.size} 字节 · {short(a.digest)}</small></li>)}</ul>:<p className="small muted">尚无归档产物。执行结束后在这里查看原始 metrics.json 与输出文件。</p>}{this.state.artifactLoading?<p role="status">读取产物…</p>:null}{this.state.artifactError?<p role="alert" className="error-text">{this.state.artifactError}</p>:null}{this.state.artifactId&&!this.state.artifactLoading&&!this.state.artifactError?<pre className="logs" aria-label="原始产物内容">{this.state.artifactContent||'（空文件）'}</pre>:null}</details>
            <details><summary>本次运行的固定源码</summary><p className="small muted">实验修订 v{run.manifest.experimentRevision} · 源码 SHA-256</p><code className="digest">{run.manifest.snapshotDigest}</code>{this.state.gitCommit?<p>Git commit <code className="digest">{this.state.gitCommit}</code></p>:null}<button className="secondary compact" disabled={this.state.sourceLoading} onClick={()=>void this.loadSource()}>读取运行源码清单</button>{this.state.sourceLoaded?<label>固定源码文件<select aria-label="固定源码文件" value={this.state.sourcePath} onChange={(e:any)=>{if(e.target.value)void this.readSource(e.target.value);}}><option value="">选择文件</option>{this.state.files.map(f=><option key={f.path} value={f.path}>{f.path} · {f.size} 字节</option>)}</select></label>:null}{this.state.sourceError?<p role="alert" className="error-text">{this.state.sourceError}</p>:null}{file?<div><p className="small muted">{file.path} · {file.mode??'旧版未记录模式'}</p><code className="digest">{file.digest}</code><pre className="logs" aria-label="固定运行源码">{this.state.sourceContent||(this.state.sourceLoading?'读取源码…':'（空文件）')}</pre><button className="secondary compact" disabled={this.state.sourceLoading||this.state.sourceComplete} onClick={()=>void this.readSource(file.path,true)}>{this.state.sourceComplete?'源码已完整读取':'读取后续源码'}</button></div>:null}</details>
        </div>;
    }
}
export class Inspector extends React.Component<{
    data: ProjectState;
    boot: Bootstrap;
    tab: string;
    experiment: Row<Experiment> | undefined;
    perform: Perform;
    onToggle: () => void;
    onTeam: () => void;
    onPrepare: () => void;
    onChild: () => void;
    onConfig: () => void;
    onDirective: (teamId: string) => void;
    selectedRun?:string;
    onRun?:(id:string)=>void;
}> {
    currentRun() { const runs=this.props.data.runs.filter(r=>r.experimentId===this.props.experiment?.id);return runs.find(r=>r.id===this.props.selectedRun)??runs[runs.length-1]; }
    render() {
        const { data, boot, experiment: e, perform } = this.props;
        const teams = data.teams.slice().reverse();
        const team = teams[0];
        const tasks = team ? data.tasks.filter(t => t.teamId === team.id) : [];
        const budget = data.budgets.find(b => b.teamId === team?.id);
        const run = this.currentRun();
        const intents = data.intents.filter(i => i.experimentId === e?.id), intent = intents[intents.length - 1], approval = data.approvals.find(a => a.id === intent?.approvalId);
        const pendingTeams = data.approvals.filter(a => a.subjectKind === 'team' && a.status === 'pending');
        return <aside className="inspector">
 <div className="inspector-title"><Icon name={this.props.tab === 'experiments' ? 'experiment' : 'branch'}/><h2>{this.props.tab === 'experiments' ? '实验详情' : '协作空间'}</h2><span className="small muted">本地</span></div>
 {this.props.tab === 'experiments' && e ? <div className="inspector-section"><div className="detail-title"><h3>{e.title}</h3><div data-testid="selected-experiment-state"><Badge value={e.lifecycle}/></div></div><p className="detail-hypothesis">{e.hypothesis}</p><dl className="details"><dt>实验 ID</dt><dd><code>{short(e.id)}</code></dd><dt>方案修订</dt><dd>v{e.revision}</dd><dt>固定入口</dt><dd><code>{e.contract.command.join(' ')}</code></dd><dt>计算方式</dt><dd>{e.contract.runner === 'trusted-example' ? '受信本地数值示例' : 'Docker · 固定镜像隔离运行'}</dd><dt>数据版本</dt><dd>{e.contract.datasetVersion}</dd></dl><div className="stack-actions"><button className="primary" onClick={this.props.onPrepare} disabled={!!(intent?.status === 'prepared' && approval?.status === 'pending' && intent.manifest.experimentRevision === e.revision)}><Icon name="run" size={15}/>准备运行</button><div className="actions"><button className="secondary" onClick={this.props.onChild}><Icon name="branch" size={15}/>派生子实验</button><button className="secondary" onClick={this.props.onConfig}>查看配置</button></div></div>
 {intent?.status === 'prepared' && approval ? <div className="approval-card"><div className="small-label">正式运行审批</div><Badge value={approval.status}/><p>此批准只授权当前固定快照与计算契约。</p><code className="digest">{intent.manifest.snapshotDigest.slice(0, 20)}…</code><dl className="details"><dt>执行参数</dt><dd><code>{JSON.stringify(intent.manifest.contract.command)}</code></dd><dt>镜像</dt><dd><code>{intent.manifest.contract.image??'受信示例'}</code></dd><dt>资源</dt><dd>{intent.manifest.contract.cpus} CPU · {intent.manifest.contract.memoryMb} MiB · {intent.manifest.contract.timeoutSeconds} 秒</dd><dt>必需产物</dt><dd>{intent.manifest.contract.expectedArtifacts.join('、')}</dd></dl>{approval.status === 'pending' ? <div className="stack-actions"><button className="primary" onClick={() => perform(async () => { await api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: true }); const submitted=await api(`/run-intents/${intent.id}/submit`, {});this.props.onRun?.(submitted.id); }, '已提交真实运行')}>批准并提交</button><button className="text-button" onClick={() => perform(() => api(`/approvals/${approval.id}/decide`, { expectedVersion: approval.version, approved: false }), '已拒绝运行')}>拒绝</button></div> : approval.status === 'approved' ? <button className="primary" onClick={() => perform(async()=>{const submitted=await api(`/run-intents/${intent.id}/submit`, {});this.props.onRun?.(submitted.id);})}>提交已批准运行</button> : null}</div> : null}
 {run ? <div className="run-detail"><label>查看运行<select aria-label="查看运行" value={run.id} onChange={(event:any)=>this.props.onRun?.(event.target.value)}>{data.runs.filter(r=>r.experimentId===e.id).slice().reverse().map(r=><option key={r.id} value={r.id}>{date(r.createdAt)} · {short(r.id)} · {label(r.state)}</option>)}</select></label><h4>运行 <code>{short(run.id)}</code></h4>{run.execution?<dl className="details"><dt>Docker context</dt><dd>{run.execution.dockerContext}</dd><dt>实际镜像 ID</dt><dd><code className="digest">{run.execution.imageId??'等待容器预检'}</code></dd></dl>:null}<div className="actions"><Badge value={run.state}/><Badge value={run.integrity}/></div>{run.metrics ? <dl className="details">{Object.entries(run.metrics).map(([k, v]) => <div className="detail-pair" key={k}><dt>{k}</dt><dd className="numeric">{number(v)}</dd></div>)}</dl> : null}<OutcomeReview run={run} perform={perform}/><p className="small muted">科研判断：{run.judgment === 'pending' ? '尚未判定' : run.judgment}</p>{run.error ? <p className="error-text">{run.error}</p> : null}{['queued', 'running', 'submitting'].includes(run.state) ? <button className="danger-outline" onClick={() => perform(() => api(`/runs/${run.id}/cancel`, {}), '已请求取消指定实验')}>取消这个实验</button> : null}<RunFiles key={run.id} run={run} data={data} perform={perform}/></div> : null}</div> : null}
 <div className="inspector-section"><div className="toggle-heading"><div><h3>多智能体协作</h3><p className="small muted">按需分工，独立验收</p></div><button role="switch" aria-label="多智能体协作" aria-checked={data.project.settings.enabled ? 'true' : 'false'} className={'switch ' + (data.project.settings.enabled ? 'on' : '')} onClick={this.props.onToggle}><span /></button></div><p className="small muted">开启只允许委派，不扩大计算、合并或发布权限。</p><div className="limits"><span>助手上限 <b>{data.project.settings.maxConcurrentAssistants}</b></span><span>正式运行 <b>1</b></span></div><button className="secondary full" onClick={this.props.onTeam} disabled={!data.project.settings.enabled}><Icon name="plus" size={15}/>创建协作计划</button></div>
 {pendingTeams.map(a => <div className="inspector-section" key={a.id}><div className="small-label">待批准的协作计划</div><h3>{data.teams.find(t => t.id === a.subjectId)?.goal}</h3><p className="small muted">{a.reason}</p><button className="primary full" onClick={() => perform(async () => { await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }); await api(`/teams/${a.subjectId}/activate`, {}); }, '协作计划已批准')}>批准并启动协作</button><button className="text-button" onClick={() => perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false }))}>拒绝此计划</button></div>)}
 {team ? <div className="inspector-section"><div className="surface-heading"><h3>当前团队</h3><Badge value={team.state}/></div><p className="team-goal">{team.goal}</p>{team.blockReason?<p className="inline-warning">{team.blockReason}</p>:null}{team.state === 'active' && !boot.runtime.ready ? <p className="inline-warning">尚未启动助手：Pi 未就绪。任务仍保存在队列中，没有模拟执行。</p> : null}<div className="team-progress"><strong>{tasks.filter(t => t.acceptance === 'accepted').length}<span> / {tasks.length}</span></strong><span>任务已验收</span></div>{tasks.map(t => <div className="task-card" key={t.id}><div className="task-top"><div className={'role-mark role-' + t.role}>{label(t.role).slice(0, 1)}</div><div><strong>{label(t.role)} <code>{t.key}</code></strong><span>{label(t.execution)}</span></div></div><p>{t.objective}</p><div className="task-footer"><span>验收：{label(t.acceptance)}</span><span>{t.reviewOf ? '审查 ' + t.reviewOf : t.dependencies.length ? '依赖 ' + t.dependencies.join(', ') : '无前置依赖'}</span></div>{t.blockReason ? <p className="small error-text">{t.blockReason}</p> : null}{['running','pending'].includes(t.execution) ? <button className="text-button danger" onClick={() => perform(() => api(`/tasks/${t.id}/cancel`, {}))}>停止此助手</button> : null}{['failed','cancelled','blocked'].includes(t.execution) ? <button className="text-button" onClick={() => perform(() => api(`/tasks/${t.id}/retry`, {}))}>新尝试重试</button> : null}{t.result ? <details><summary>结果与限制</summary><p className="small prose-text">{t.result.summary}</p></details> : null}{t.execution === 'output_submitted' && ['pending','rejected','disputed'].includes(t.acceptance) ? <button className="text-button" onClick={() => {
                            const reason = prompt('人工审查依据（将保留记录）');
                            if (reason)
                                perform(() => api(`/tasks/${t.id}/manual-review`, { verdict: 'accepted', reason }));
                        }}>人工确认验收</button> : null}</div>)}{budget ? <div className="budget-note">尝试额度：{budget.used} 已结算 / {budget.reserved} 已预留 / {budget.unknown} 待对账<br />总额度 {budget.limit} 次。此额度不是供应商账单上限。</div> : null}<div className="actions wrap">{team.state === 'active' ? <button className="secondary compact" onClick={() => perform(() => api(`/teams/${team.id}/pause`, {}))}>暂停分配</button> : null}{team.state === 'paused' ? <button className="secondary compact" onClick={() => perform(() => api(`/teams/${team.id}/resume`, {}))}>恢复</button> : null}<button className="secondary compact" onClick={() => this.props.onDirective(team.id)}>引导 / 改变目标</button></div></div> : <div className="inspector-section muted small">协作计划、助手状态与审查结果会出现在这里。不会为展示效果自动创建 Agent。</div>}
 <div className="inspector-footer"><span className="status-dot"/>所有结果写入本地数据库</div></aside>;
    }
}
