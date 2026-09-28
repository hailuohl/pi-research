import { api } from './api.js';
import type { ProjectState, Campaign, Row, CampaignDecision } from './models.js';
import { short, label, number } from './models.js';
import { Badge, Empty, Modal, SectionTitle } from './ui.js';
import type { Perform } from './workbench.js';

type Props = { data: ProjectState; perform: Perform; busy: boolean; onExperiment: (id: string) => void; onSession: (id: string) => void };
const candidateExample = JSON.stringify([{title:'新的受控候选',hypothesis:'在固定协议下比较，不预设结论',config:{polynomialDegree:2,ridge:0.000001}}],null,2);

export function WakeupPanel({data, perform, busy, onSession, sessionId}: {
    data: ProjectState; perform: Perform; busy: boolean; onSession:(id:string)=>void; sessionId?: string;
}) {
    const items = data.wakeups.filter(w => !sessionId || w.rootSessionId === sessionId);
    if (!items.length) return null;
    return <section className="wakeup-panel" aria-label="持久化结果通知"><h2>结果通知与主会话分析</h2><p className="muted small">通知已保存到数据库。仅在授权、额度和 Pi 配置均有效时调用模型；暂停或取消这里的分析不会取消 Run。</p>
        {items.map(w => {const budget=data.budgets.find(b=>b.campaignId===w.ownerId||b.teamId===w.ownerId);return <article className="wakeup-row" key={w.id}>
            <div><strong>{w.sourceKind==='team'?'协作成果综合':'实验结果分析'}</strong> <Badge value={w.state}/><p className="small muted">{w.automatic?'已授权自动分析':'仅手动请求'} · 已尝试 {w.attempts}/{w.maxAttempts} · {short(w.sourceId)}</p>
                {w.blockReason||w.error?<p className="notice-inline" role="status">{w.blockReason||w.error}</p>:null}
                {budget?<p className="small muted">尝试额度：已用 {budget.used} / 预留 {budget.reserved} / 未知 {budget.unknown} / 可用 {budget.available}；不是货币账单</p>:null}
            </div><div className="actions">{sessionId===w.rootSessionId?null:<button className="secondary compact" onClick={()=>onSession(w.rootSessionId)}>查看主会话</button>}
                {w.state==='pending'?<button className="secondary compact" disabled={busy||w.requested} onClick={()=>perform(()=>api(`/wakeups/${w.id}/request`,{}),'请求已保存；就绪后执行')}>{w.requested?'已请求分析':'请求分析'}</button>:null}
                {['pending','queued','running'].includes(w.state)?<button className="text-button" disabled={busy} onClick={()=>perform(()=>api(`/wakeups/${w.id}/cancel`,{}),'已取消此分析，不影响实验')}>取消分析</button>:null}
                {['failed','cancelled'].includes(w.state)&&w.attempts<w.maxAttempts?<button className="secondary compact" disabled={busy} onClick={()=>{if(confirm('将增加一次模型尝试；之前未知的用量不会自动释放。继续？'))perform(()=>api(`/wakeups/${w.id}/retry`,{}));}}>显式重试</button>:null}
            </div></article>;})}
    </section>;
}

export class CampaignView extends React.Component<Props,{selected:string;create:boolean;decision:boolean;action:string}> {
    state={selected:'',create:false,decision:false,action:'refill'};
    private choose(){return this.props.data.campaigns.find(c=>c.id===this.state.selected)??this.props.data.campaigns[0];}
    private approve(id:string){const a=this.props.data.approvals.find(a=>a.id===id);if(!a)throw new Error('批准记录不存在，请刷新');return api(`/approvals/${id}/decide`,{expectedVersion:a.version,approved:true});}
    private createModal(){const {data,busy,perform}=this.props;return <Modal title="建立持续研究活动" wide busy={busy} onClose={()=>this.setState({create:false})} submitLabel="保存活动草案" onSubmit={fd=>perform(async()=>{
        const c=await api('/campaigns',{projectId:data.project.id,goal:fd.get('goal'),rootSessionId:fd.get('session'),baselineExperimentId:fd.get('baseline'),primaryMetric:fd.get('metric')||undefined,autoAnalyze:fd.get('automatic')==='on',limits:{maxRounds:Number(fd.get('rounds')),maxAnalysisAttempts:Number(fd.get('attempts'))}});
        this.setState({create:false,selected:c.id});
    })}><label>研究目标<textarea name="goal" required rows={3} maxLength={8000}/></label>
        <label>主协调会话<select name="session" required>{data.sessions.filter(s=>s.role==='coordinator'&&s.state!=='archived').map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
        <label>基线实验<select name="baseline" required>{data.experiments.filter(e=>e.lifecycle!=='archived').map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
        <label>主指标名称<input name="metric" placeholder="留空使用契约第一项指标" maxLength={80}/></label>
        <div className="form-columns"><label>最多轮次<input name="rounds" type="number" min={1} max={20} defaultValue={4} required/></label><label>模型分析尝试额度<input name="attempts" type="number" min={0} max={100} defaultValue={12} required/></label></div>
        <label className="check-label"><input type="checkbox" name="automatic"/>结果到达后自动唤醒主 Pi（可能产生模型费用）</label>
        <p className="small muted">活动草案需要批准后启动。审批绑定当前主会话模型；正式计算和每个研究决定仍需单独批准。关闭自动分析时，也可手动使用所有状态与决策功能。</p>
    </Modal>;}
    private decisionModal(c:Row<Campaign>){const {data,busy,perform}=this.props;const observations=data.observations.filter(o=>o.campaignId===c.id&&o.roundId===c.currentRoundId);return <Modal title="提交有证据的研究决定" wide busy={busy} onClose={()=>this.setState({decision:false})} submitLabel="保存决定提案" onSubmit={fd=>perform(async()=>{
        const action=String(fd.get('action'));await api(`/campaigns/${c.id}/decisions`,{expectedVersion:c.version,action,reason:fd.get('reason'),observationIds:fd.getAll('observations'),...(action==='promote'?{selectedRunId:fd.get('selectedRun')}:{}),candidates:['refill','promote'].includes(action)?JSON.parse(String(fd.get('candidates'))):[]});this.setState({decision:false});
    },'决定已保存，尚未应用')}>
        <label>决定类型<select name="action" value={this.state.action} onChange={(e:any)=>this.setState({action:e.target.value})}><option value="repair">Repair · 原节点无结果修复</option><option value="refill">Refill · 同一父节点补充候选</option><option value="promote">Promote · 保留结果并创建下一轮</option><option value="stop">Stop · 结束当前研究</option></select></label>
        <fieldset className="observation-choices"><legend>引用实际观测（至少一项）</legend>{observations.map(o=><label className="check-label" key={o.id}><input type="checkbox" name="observations" value={o.id} defaultChecked={o.status==='pending'}/>{data.experiments.find(e=>e.id===o.experimentId)?.title??short(o.runId)} · {label(o.validation)} · {label(o.status)}</label>)}</fieldset>
        <label>理由、证据及限制<textarea name="reason" required maxLength={8000} rows={3}/></label>
        {this.state.action==='promote'?<label>作为下一轮父节点的已测量 Run<select name="selectedRun" required>{observations.filter(o=>o.validation==='verified').map(o=><option key={o.id} value={o.runId}>{data.experiments.find(e=>e.id===o.experimentId)?.title} · {c.primaryMetric}={number(o.metrics[c.primaryMetric])}</option>)}</select></label>:null}
        {['refill','promote'].includes(this.state.action)?<label>候选配置 JSON（Promote 可填 []，随后手动登记候选）<textarea name="candidates" className="code-input" rows={8} defaultValue={candidateExample} required/></label>:null}
        <p className="small muted">必需候选尚未完成时，服务端拒绝 Promote。Repair 只授权一次无结果节点修复；它不会自动修改代码或重跑。批准绑定当前输入版本。</p>
    </Modal>;}
    private decisionCard(d:Row<CampaignDecision>){const {data,perform,busy}=this.props;const a=data.approvals.find(a=>a.id===d.approvalId);return <article className="decision-row" key={d.id}>
        <div className="actions"><strong>{d.action.toUpperCase()} · {label(d.action)}</strong><Badge value={d.status}/>{a?<Badge value={a.status}/>:null}</div>
        <p className="prose-text">{d.reason}</p><p className="small muted">引用 {d.observationIds.length} 项观测 · 新候选 {d.candidates.length} 个 · {short(d.decisionDigest)}</p>
        {d.candidates.length?<details><summary>查看候选配置和修改范围</summary><pre>{JSON.stringify(d.candidates,null,2)}</pre></details>:null}
        {d.status==='proposed'?<div className="actions">
            {a?.status==='pending'?<button className="secondary compact" disabled={busy} onClick={()=>perform(()=>this.approve(a.id),'已批准此版本，尚未应用')}>批准此决定</button>:null}
            <button className="primary compact" disabled={busy||a?.status!=='approved'} onClick={()=>perform(()=>api(`/campaign-decisions/${d.id}/apply`,{expectedVersion:d.version}),'决定已应用；新的正式 Run 仍须单独批准')}>应用已批准决定</button>
        </div>:null}
    </article>;}
    render(){const {data,perform,busy,onExperiment,onSession}=this.props,c=this.choose();const members=data.members.filter(m=>m.campaignId===c?.id),obs=data.observations.filter(o=>o.campaignId===c?.id);const approval=data.approvals.find(a=>a.id===c?.approvalId);const budget=data.budgets.find(b=>b.campaignId===c?.id);
        const available=c?data.intents.filter(i=>!members.some(m=>m.intentId===i.id)&&data.experiments.some(e=>e.id===i.experimentId&&e.contractDigest===c.contractDigest&&(e.id===c.focusExperimentId||e.parentId===c.focusExperimentId))):[];
        return <div className="campaign-page"><SectionTitle title="研究活动" sub="持久化轮次、真实观测和有界决策；不是无限运行的聊天。"><button className="primary" disabled={busy||!data.experiments.length||!data.sessions.some(s=>s.role==='coordinator'&&s.state!=='archived')} onClick={()=>this.setState({create:true})}>新建研究活动</button></SectionTitle>
        {!c?<Empty title="尚未建立研究活动">先创建主会话与基线实验，再建立活动。正式计算始终单独批准。</Empty>:<div>
            <label className="campaign-picker">当前活动<select value={c.id} onChange={(e:any)=>this.setState({selected:e.target.value})}>{data.campaigns.map(item=><option key={item.id} value={item.id}>{item.goal.slice(0,80)}</option>)}</select></label>
            <section className="campaign-overview"><div className="actions"><Badge value={c.state}/><span>第 {c.roundNumber}/{c.limits.maxRounds} 轮</span><span>指标：{c.primaryMetric} · {c.direction==='min'?'越小越好':'越大越好'}</span></div><h2>{c.goal}</h2><p className="small muted">{c.autoAnalyze?'结果到达后可自动分析':'分析仅在手动请求后执行'} · 决定与候选运行均需单独批准 · 活动版本 {c.version} · 已批准模型 {c.rootModel?.provider||'未配置'}/{c.rootModel?.model||'未配置'}</p>
                {budget?<p className="small muted">模型尝试额度 {budget.used} 已用 / {budget.reserved} 预留 / {budget.unknown} 未知 / {budget.available} 可用（非费用上限）</p>:null}
                <div className="actions"><button className="secondary compact" onClick={()=>onSession(c.rootSessionId)}>打开主协调会话</button><button className="secondary compact" onClick={()=>onExperiment(c.focusExperimentId)}>当前父实验</button>
                    {c.state==='draft'?<button className="primary compact" disabled={busy||!approval||['rejected','stale'].includes(approval.status)} onClick={()=>perform(async()=>{if(approval?.status==='pending')await this.approve(approval.id);return api(`/campaigns/${c.id}/activate`,{expectedVersion:c.version});},'活动已启动，尚未授权任何正式计算')}>批准并启动活动</button>:null}
                    {c.state==='active'?<div><button className="secondary compact" disabled={busy} onClick={()=>perform(()=>api(`/campaigns/${c.id}/pause`,{expectedVersion:c.version}))}>暂停活动</button><button className="primary compact" disabled={busy||!obs.some(o=>o.roundId===c.currentRoundId&&o.status==='pending')} onClick={()=>this.setState({decision:true})}>提交决定</button></div>:null}
                    {c.state==='paused'?<button className="primary compact" disabled={busy} onClick={()=>perform(()=>api(`/campaigns/${c.id}/resume`,{expectedVersion:c.version}))}>恢复活动</button>:null}
                    {c.state!=='stopped'?<button className="text-button" disabled={busy} onClick={()=>{if(confirm('停止新增研究决策和自动分析？已有正式 Run 继续运行，结果仍会保留。'))perform(()=>api(`/campaigns/${c.id}/stop`,{expectedVersion:c.version,reason:'用户在工作台停止活动'}));}}>停止活动</button>:null}
                </div>{c.stopReason?<p className="notice-inline">停止原因：{c.stopReason}</p>:null}
            </section>
            <section className="campaign-section"><h2>轮次与候选</h2><p className="small muted">研究轮次不是协作任务图。每个候选保留自己的实验血缘和不可变运行快照。</p>
                {data.rounds.filter(r=>r.campaignId===c.id).map(round=><div key={round.id} className="round-group"><h3>第 {round.number} 轮 <Badge value={round.state}/><button className="text-button" onClick={()=>onExperiment(round.parentExperimentId)}>父实验 {short(round.parentExperimentId)}</button></h3>
                    {members.filter(m=>m.roundId===round.id).length?<div className="table-scroll"><table><thead><tr><th>候选实验</th><th>实际 Run</th><th>观测与指标</th><th>操作</th></tr></thead><tbody>{members.filter(m=>m.roundId===round.id).map(m=>{const i=data.intents.find(i=>i.id===m.intentId),r=data.runs.find(r=>r.id===i?.runId),o=obs.find(o=>o.runId===r?.id),a=data.approvals.find(a=>a.id===i?.approvalId);return <tr key={m.id}><td><button className="text-button" onClick={()=>onExperiment(m.experimentId)}>{data.experiments.find(e=>e.id===m.experimentId)?.title??short(m.experimentId)}</button><div className="small muted">{m.required?'必需候选':'可选候选'}</div></td><td>{r?<div><Badge value={r.state}/><div className="small muted">{short(r.id)}</div></div>:<span>尚未提交</span>}</td><td>{o?<div><Badge value={o.validation}/><div>{c.primaryMetric} = {number(o.metrics[c.primaryMetric])}</div><details><summary>查看证据与限制</summary><p>{o.explanation}</p><pre>{JSON.stringify({observationId:o.id,evidenceIds:o.evidenceIds,metrics:o.metrics},null,2)}</pre></details></div>:<span className="muted">等待真实结果</span>}</td><td>{!r&&i?<div>{a?.status==='pending'?<button className="secondary compact" disabled={busy} onClick={()=>perform(()=>this.approve(a.id))}>单独批准此运行</button>:null}<button className="secondary compact" disabled={busy||a?.status!=='approved'} onClick={()=>perform(()=>api(`/run-intents/${i.id}/submit`,{}),'正式 Run 已提交')}>提交已批准运行</button></div>:<button className="text-button" onClick={()=>onExperiment(m.experimentId)}>日志与快照</button>}</td></tr>;})}</tbody></table></div>:<p className="muted">这一轮尚未登记候选。</p>}</div>)}
                {c.state==='active'?<form className="enroll-form" onSubmit={(e:any)=>{e.preventDefault();const fd=new FormData(e.currentTarget);perform(()=>api(`/campaigns/${c.id}/members`,{expectedVersion:c.version,intentId:fd.get('intent'),...(fd.get('repair')?{repairDecisionId:fd.get('repair')}:{})}),'已登记候选，未启动运行');}}><label>登记已准备的固定 RunIntent<select name="intent" required disabled={!available.length}>{available.map(i=><option key={i.id} value={i.id}>{data.experiments.find(e=>e.id===i.experimentId)?.title} · {short(i.id)}</option>)}</select></label><label>修复批准（首次登记留空）<select name="repair"><option value="">不使用修复批准</option>{data.decisions.filter(d=>d.campaignId===c.id&&d.roundId===c.currentRoundId&&d.action==='repair'&&d.status==='applied'&&!members.some(m=>m.repairDecisionId===d.id)).map(d=><option key={d.id} value={d.id}>{short(d.id)} · {d.reason.slice(0,55)}</option>)}</select></label><button className="secondary" disabled={busy||!available.length}>登记本轮候选</button></form>:null}
                {c.state==='active'&&!available.length?<p className="small muted">没有可登记的运行清单。请到「实验与运行」选择当前父实验或其子实验，先准备不可变快照。无结果节点重新登记时，需选择本轮已应用的 Repair 决定。</p>:null}
            </section>
            <section className="campaign-section"><h2>决策历史</h2>{data.decisions.filter(d=>d.campaignId===c.id).map(d=>this.decisionCard(d))}{!data.decisions.some(d=>d.campaignId===c.id)?<p className="muted">暂无决定。收到真实观测后，可由 Pi 提案或人工提交；决定不会自动执行。</p>:null}</section>
        </div>}
        <WakeupPanel data={data} busy={busy} perform={perform} onSession={onSession}/>
        {this.state.create?this.createModal():null}{this.state.decision&&c?this.decisionModal(c):null}
        </div>;
    }
}
