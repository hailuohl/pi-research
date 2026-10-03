import * as React from 'react';
import {api} from './api.js';
import {Badge} from './ui.js';
import {short,label,number} from './models.js';
import type {ProjectState,Session,Row,Approval,ChangeProposal,Campaign,RunIntent} from './models.js';
import type {Perform} from './workbench.js';
import {DevelopmentJob} from './implementation.js';
import {ResearchPlanPanel} from './research-plan.js';
import {WorkingGrants} from './working-grants.js';
import {runGrantUsable} from './run-grants.js';
import {PublicationDialogue} from './publication-dialogue.js';

export function proposalSession(data:ProjectState,proposal:Row<ChangeProposal>):string|undefined {
    return (proposal as any).rootSessionId || (data.reviews??[]).find(r=>r.id===proposal.reviewId)?.producerSessionId || (data.sandboxJobs??[]).find(j=>j.id===proposal.testJobId)?.sessionId;
}
export class ChatWorkflows extends React.Component<{
    data:ProjectState;session:Row<Session>;busy:boolean;perform:Perform;
    onSession:(id:string)=>void;onExperiment:(id:string)=>void;onRun:(runId:string,experimentId:string)=>void;
},{previews:Record<string,any>;runIntentRevision:number}> {
    state={previews:{} as Record<string,any>,runIntentRevision:0};
    private mounted=true;private readEpoch=0;
    private messageKeys=new Map<string,string>();private approvedRunIntents=new Set<string>();private queuedRunIntents=new Set<string>();
    componentWillUnmount(){this.mounted=false;this.readEpoch++;}
    call(name:string,input:unknown={}){return api(`/operations/${name}`,{projectId:this.props.data.project.id,sessionId:this.props.session.id,input});}
    decide(approval:Row<Approval>,approved:boolean){return api(`/approvals/${approval.id}/decide`,{expectedVersion:approval.version,approved});}
    async approved(approval:Row<Approval>|undefined){
        if(!approval||!['pending','approved'].includes(approval.status))throw Error('此固定事项尚未取得有效批准');
        if(approval.status==='pending')await this.decide(approval,true);
    }
    private dialogueMatches(projectId:string,sessionId:string){const {data,session}=this.props;return this.mounted&&!data.project.archived&&data.project.id===projectId&&session.id===sessionId&&session.role==='coordinator'&&!session.taskId&&session.state!=='archived';}
    async continueResearchBrief(){
        const {data,session}=this.props,view=data.researchBrief,brief=view?.brief;
        if(!brief||view?.latestId!==brief.id||brief.rootSessionId!==session.id)throw Error('研究计划不属于当前对话的最新修订');
        const projectId=data.project.id,sessionId=session.id,id=brief.id,digest=brief.digest;
        const matches=()=>this.dialogueMatches(projectId,sessionId)&&this.props.data.researchBrief?.latestId===id&&this.props.data.researchBrief?.brief?.digest===digest;
        if(!matches()||view.evidenceChecks.some(e=>!e.current))throw Error('研究计划或证据已变化，请先刷新核对');
        if(brief.status==='ready')await this.call('research_brief_confirm',{briefId:id,expectedVersion:brief.version});
        else if(brief.status!=='confirmed')throw Error('请先在对话中补齐研究问题与计划');
        if(!matches())throw Error('已确认计划，当前对话已切换；请回原会话继续');
        await api(`/sessions/${sessionId}/messages`,{content:`研究问题与计划已由用户确认。先调用research_brief_inspect({briefId:"${id}"})核对latestId仍为该ID、digest为"${digest}"、status为confirmed且来源当前有效，再按步骤继续当前研究任务。只在已有工具与授权范围内推进，计算、代码整合和发布仍使用各自固定批准；若计划或来源失效，说明原因，不用旧版本替代。`},'POST',undefined,`research-brief-continue:${id}:${digest}`);
    }
    researchBriefCard(disabled:boolean){
        const {data,session,perform}=this.props,view=data.researchBrief,brief=view?.brief;
        if(!view||!brief||brief.rootSessionId!==session.id)return null;
        const current=view.latestId===brief.id,valid=view.evidenceChecks.every(e=>e.current),confirmed=brief.status==='confirmed';
        return <details className="workflow-card" open={brief.status!=='confirmed'}><summary>研究问题与计划 · 第 {brief.revision} 版<Badge value={confirmed?'approved':brief.status==='ready'?'pending':'draft'} caption={confirmed?'已确认':brief.status==='ready'?'待确认':'待澄清'}/></summary>
            <p><strong>{brief.question}</strong></p><p>{brief.scope}</p>
            {brief.clarificationQuestions.length?<div><strong>待明确的问题</strong><ul>{brief.clarificationQuestions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>:null}
            {brief.successCriteria.length?<div><strong>判断标准</strong><ul>{brief.successCriteria.map((q,i)=><li key={i}>{q}</li>)}</ul></div>:null}
            {brief.steps.length?<details><summary>研究步骤（{brief.steps.length}）</summary><ol>{brief.steps.map((step,i)=><li key={i}><strong>{step.title}</strong> · {step.description}</li>)}</ol></details>:null}
            <details><summary>文献、假设与约束 · {brief.evidenceIds.length} 项证据</summary><p>{brief.literatureSummary}</p>{brief.hypotheses.map((h,i)=><p key={i}>{h.statement} · 证据 {h.evidenceIds.length}</p>)}{brief.constraints.map((c,i)=><p key={i}>{c}</p>)}</details>
            {!valid?<p role="status">部分来源已失效，历史内容保留；请在对话中重新核对资料。</p>:null}
            {current&&brief.status!=='clarifying'?<div className="actions"><button className="primary compact" disabled={disabled||!valid} onClick={()=>perform(()=>this.continueResearchBrief(),'研究计划已确认，继续当前对话')}>{confirmed?'继续已确认计划':'确认研究问题与计划'}</button></div>:null}
            {view.history.length>1?<details><summary>历史修订（{view.history.length}）</summary>{view.history.map(h=><p key={h.id}>第 {h.revision} 版 · {h.status==='confirmed'?'已确认':h.status==='ready'?'待确认':'待澄清'} · {short(h.digest)}</p>)}</details>:null}
        </details>;
    }
    private runIntentInScope(projectId:string,sessionId:string,intentId:string,manifestDigest:string,campaignId?:string){
        const {data}=this.props;
        if(!this.dialogueMatches(projectId,sessionId))return false;
        const intent=data.intents.find(i=>i.id===intentId);
        if(!intent||intent.manifestDigest!==manifestDigest||intent.status!=='prepared'||intent.runId)return false;
        if(!campaignId)return intent.rootSessionId===sessionId;
        const campaign=data.campaigns.find(c=>c.id===campaignId),member=data.members.some(m=>m.campaignId===campaignId&&m.intentId===intentId)||(data.researchCandidates??[]).some(c=>c.campaignId===campaignId&&c.intentId===intentId);
        if(campaign?.rootSessionId!==sessionId||!member)return false;
        if(intent.rootSessionId===sessionId||intent.rootSessionId==null)return true;
        const approval=data.approvals.find(a=>a.id===intent.approvalId),bound=intent.runGrant??approval?.runGrant,grant=(data.runGrants??[]).find(g=>g.id===bound?.id);
        return !!bound&&!grant?.taskBinding&&grant?.sessionId===sessionId&&runGrantUsable(grant);
    }
    async continueRunIntent(intent:Row<RunIntent>,campaignId?:string){
        const {data,session}=this.props,projectId=data.project.id,sessionId=session.id,intentId=intent.id,digest=intent.manifestDigest,approvalId=intent.approvalId,keyId=`${intentId}:${digest}`;
        const messageKey=this.messageKeys.get(keyId)??crypto.randomUUID();this.messageKeys.set(keyId,messageKey);
        const bound=intent.runGrant??data.approvals.find(a=>a.id===approvalId)?.runGrant,inspect=intent.rootSessionId===sessionId?`先调用 project_inspect({runIntentId:"${intentId}"})，核对唯一 RunIntent。`:intent.rootSessionId==null&&campaignId?`调用 campaign_inspect({campaignId:"${campaignId}"})，核对当前活动成员或候选中包含该固定 RunIntent。`: `此项依赖当前会话已核验的 RunGrant ${bound?.id??''}（${bound?.digest??''}）；按该绑定授权身份提交。`,content=`继续执行这份已确认的固定正式运行。${inspect}确认 manifestDigest 等于 "${digest}"、审批有效且仍可提交；然后只调用 run_submit({intentId:"${intentId}"})。提交后用返回的 Run id 调用 run_inspect 回查状态、真实指标和产物，必要时读取 run_logs。若意向失效、被拒绝或固定授权不可用，说明原因，不创建替代意向或补跑。若 Run 尚未结束，报告当前状态并结束本轮，不忙轮询。`;
        if(!this.dialogueMatches(projectId,sessionId))return;
        await this.props.perform(async()=>{
            if(!this.dialogueMatches(projectId,sessionId))return;
            if(!this.runIntentInScope(projectId,sessionId,intentId,digest,campaignId))throw Error('固定 RunIntent 已失效或不属于当前对话；未批准、未发送消息，也未创建替代意向。');
            const current=this.props.data.intents.find(i=>i.id===intentId),approval=this.props.data.approvals.find(a=>a.id===approvalId),grantRef=current?.runGrant??approval?.runGrant,expectedRef=intent.runGrant??data.approvals.find(a=>a.id===approvalId)?.runGrant;
            const sameGrant=(!grantRef&&!expectedRef)||(!!grantRef&&!!expectedRef&&grantRef.id===expectedRef.id&&grantRef.digest===expectedRef.digest&&grantRef.approvalId===expectedRef.approvalId);
            if(!current||current.approvalId!==approvalId||!approval||!sameGrant)throw Error('固定 RunIntent 的审批或授权引用已变化；未发送执行消息。');
            if(grantRef){
                const grant=(this.props.data.runGrants??[]).find(g=>g.id===grantRef.id);
                if(grant?.taskBinding)throw Error('此 RunIntent 绑定任务级授权，只能由对应的已授权任务提交。');
                if(approval.status!=='approved'||grant?.sessionId!==sessionId||!runGrantUsable(grant))throw Error('绑定授权尚不可用或不属于当前对话；未发送执行消息。');
            }else if(approval.status==='pending'&&!this.approvedRunIntents.has(keyId)){
                await this.decide(approval,true);
                if(!this.dialogueMatches(projectId,sessionId))return;
                if(!this.runIntentInScope(projectId,sessionId,intentId,digest,campaignId))throw Error('批准完成后固定 RunIntent 已变化；未发送执行消息。');
                this.approvedRunIntents.add(keyId);this.setState(state=>({runIntentRevision:state.runIntentRevision+1}));
            }else if(approval.status!=='approved'&&!(approval.status==='pending'&&this.approvedRunIntents.has(keyId)))throw Error('此固定 RunIntent 未获有效批准；未发送执行消息。');
            if(!this.dialogueMatches(projectId,sessionId))return;
            if(!this.runIntentInScope(projectId,sessionId,intentId,digest,campaignId))throw Error('当前对话或固定 RunIntent 已变化；未发送执行消息。');
            try{await api(`/sessions/${sessionId}/messages`,{content},'POST',undefined,messageKey);}catch(error){if(!this.dialogueMatches(projectId,sessionId))return;throw error;}
            this.messageKeys.delete(keyId);this.approvedRunIntents.delete(keyId);this.queuedRunIntents.add(keyId);
            if(this.dialogueMatches(projectId,sessionId))this.setState(state=>({runIntentRevision:state.runIntentRevision+1}));
        });
    }
    runIntentCard(intent:Row<RunIntent>,disabled:boolean,campaignId?:string){
        const {data,session}=this.props,approval=data.approvals.find(a=>a.id===intent.approvalId),bound=intent.runGrant??approval?.runGrant,grant=(data.runGrants??[]).find(g=>g.id===bound?.id),run=data.runs.find(r=>r.id===intent.runId&&r.experimentId===intent.experimentId),keyId=`${intent.id}:${intent.manifestDigest}`,taskBound=!!grant?.taskBinding,grantUsable=!!grant&&grant.sessionId===session.id&&runGrantUsable(grant),campaignOwned=!!campaignId&&data.campaigns.some(c=>c.id===campaignId&&c.rootSessionId===session.id)&&(data.members.some(m=>m.campaignId===campaignId&&m.intentId===intent.id)||(data.researchCandidates??[]).some(c=>c.campaignId===campaignId&&c.intentId===intent.id)),owned=campaignId?campaignOwned&&(intent.rootSessionId===session.id||intent.rootSessionId==null||!!bound&&!taskBound&&grantUsable):intent.rootSessionId===session.id,approved=approval?.status==='approved'||approval?.status==='pending'&&this.approvedRunIntents.has(keyId),queued=this.queuedRunIntents.has(keyId),canContinue=owned&&intent.status==='prepared'&&!intent.runId&&!run&&!queued&&!!approval&&(!bound&&['pending','approved'].includes(approval.status)||!!bound&&!taskBound&&grantUsable&&approval.status==='approved');
        return <details className="workflow-card" key={intent.id} open={canContinue||queued}><summary>正式实验 · {data.experiments.find(e=>e.id===intent.experimentId)?.title??short(intent.experimentId)}<Badge value={run?.state??(approved?'approved':approval?.status??intent.status)}/></summary>{intent.manifest.researchBrief?<p className="small muted">研究依据：第 {intent.manifest.researchBrief.revision} 版计划</p>:null}{intent.manifest.analysis?<p className="small muted">结束后由 {intent.manifest.analysis.model.provider}/{intent.manifest.analysis.model.model} 自动分析一次，仅读取本次结果并给出建议。</p>:null}<details><summary>冻结参数、计算契约与授权</summary><pre className="file-preview">{JSON.stringify({intentId:intent.id,manifestDigest:intent.manifestDigest,manifest:intent.manifest,runGrant:bound},null,2)}</pre></details>{canContinue?<button className="primary compact" disabled={disabled} onClick={()=>this.continueRunIntent(intent,campaignId)}>确认并让智能体执行</button>:null}{queued&&intent.status==='prepared'&&!run?<p className="small muted" role="status">执行消息已入队，等待智能体回查固定运行。</p>:taskBound?<p className="small muted" role="status">此固定运行绑定任务级授权，由对应的已授权任务提交。</p>:bound&&!grantUsable?<p className="small muted" role="status">绑定授权不可用或不属于当前主会话；保留固定历史，不提供提交入口。</p>:!owned?<p className="small muted" role="status">此固定运行未绑定当前对话，只读保留。</p>:approval&&['rejected','stale'].includes(approval.status)?<p className="small muted" role="status">固定运行审批已{approval.status==='rejected'?'拒绝':'失效'}；不会自动创建替代意向。</p>:intent.status!=='prepared'&&!run?<p className="small muted" role="status">固定 RunIntent 状态为 {label(intent.status)}；不会自动补跑。</p>:null}{run?<div><button className="text-button" onClick={()=>this.props.onRun(run.id,run.experimentId)}>查看实际运行日志与结果</button>{run.metrics?<p className="small">{Object.entries(run.metrics).map(([name,value])=>`${name}=${number(value)}${run.manifest.contract.metrics[name]?.unit?` ${run.manifest.contract.metrics[name].unit}`:''}`).join(' · ')}</p>:null}</div>:null}</details>;
    }
    async preview(proposal:Row<ChangeProposal>){
        const epoch=++this.readEpoch;
        await this.props.perform(async()=>{
            const result=await api(`/change-proposals/${proposal.id}/diff`);
            if(result.proposal.id!==proposal.id||result.proposal.digest!==proposal.digest||result.files.length!==proposal.changes.length||new Set(result.files.map((f:any)=>f.path)).size!==proposal.changes.length||!result.files.every((f:any)=>proposal.changes.some(c=>c.path===f.path)))throw Error('固定差异与所选提案不一致，请重新读取');
            if(this.mounted&&epoch===this.readEpoch)this.setState({previews:{...this.state.previews,[proposal.id]:result}});
        });
    }
    campaignCard(c:Row<Campaign>,disabled:boolean){
        const {data,perform,onSession,onExperiment,onRun,busy}=this.props,a=data.approvals.find(a=>a.id===c.approvalId),baseline=data.experiments.find(e=>e.id===c.baselineExperimentId);
        const observations=data.observations.filter(o=>o.campaignId===c.id);
        const intentIds=new Set([...data.members.filter(m=>m.campaignId===c.id).map(m=>m.intentId),...(data.researchCandidates??[]).filter(v=>v.campaignId===c.id).flatMap(v=>v.intentId?[v.intentId]:[])]);
        return <details key={c.id} className="workflow-card" open={c.state==='draft'}><summary>研究计划 · {c.goal}<Badge value={c.state}/></summary>
            <p>{c.goal}</p><dl className="details"><dt>基线</dt><dd>{baseline?.title??short(c.baselineExperimentId)}</dd><dt>评价指标</dt><dd>{c.primaryMetric} · {c.direction==='min'?'越小越好':'越大越好'}</dd><dt>已绑定模型</dt><dd>{c.rootModel.provider||'未配置供应商'} / {c.rootModel.model||'未配置模型'}</dd><dt>结果分析</dt><dd>{c.autoAnalyze?'批准后允许有界自动分析':'由对话指令请求分析'}</dd></dl>
            <details><summary>固定来源、额度与截止条件</summary><pre className="file-preview">{JSON.stringify({id:c.id,rootSessionId:c.rootSessionId,contractDigest:c.contractDigest,planDigest:c.planDigest,limits:c.limits,rootModel:c.rootModel},null,2)}</pre></details>
            {c.state==='draft'&&a&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(a);await api(`/campaigns/${c.id}/activate`,{expectedVersion:c.version});},'研究计划已启动；正式实验仍按固定授权提交')}>{a.status==='approved'?'启动已批准研究计划':'批准并启动研究计划'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝研究计划</button>:null}</div>:null}
            {a?<p className="small muted">批准状态：{label(a.status)}</p>:null}
            <div className="actions wrap">{c.state==='active'?<button className="secondary compact" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/pause`,{expectedVersion:c.version}))}>暂停研究计划</button>:null}{c.state==='paused'?<button className="secondary compact" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/resume`,{expectedVersion:c.version}))}>恢复研究计划</button>:null}{['active','paused'].includes(c.state)?<button className="text-button danger" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/stop`,{expectedVersion:c.version,reason:'用户在原对话中停止研究计划'}))}>停止研究计划</button>:null}<button className="text-button" onClick={()=>onExperiment(c.focusExperimentId)}>查看当前实验</button></div>
            {observations.length?<details><summary>实际观测与证据（{observations.length}）</summary>{observations.map(o=><div className="inspector-section" key={o.id}><button className="text-button" onClick={()=>onRun(o.runId,o.experimentId)}>Run {short(o.runId)}</button><Badge value={o.validation}/><p>{c.primaryMetric}={number(o.metrics[c.primaryMetric])} · {o.explanation}</p><p className="small muted">观测 {short(o.id)} · 证据 {o.evidenceIds.map(short).join('、')||'未取得'}</p></div>)}</details>:null}
            {data.intents.filter(i=>intentIds.has(i.id)).map(i=>this.runIntentCard(i,disabled,c.id))}
            {data.decisions.filter(d=>d.campaignId===c.id).map(d=>{const approval=data.approvals.find(a=>a.id===d.approvalId);return <details className="workflow-card" key={d.id} open={d.status==='proposed'}><summary>研究决定 · {label(d.action)}<Badge value={d.status}/></summary><p>{d.reason}</p><details><summary>依据、候选配置与固定方案</summary><pre className="file-preview">{JSON.stringify(d,null,2)}</pre>{(data.experimentPlans??[]).filter(p=>p.id===d.planRevisionId).map(p=><pre className="file-preview" key={p.id}>{JSON.stringify(p,null,2)}</pre>)}</details>{d.status==='proposed'&&approval&&['pending','approved'].includes(approval.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(approval);await api(`/campaign-decisions/${d.id}/apply`,{expectedVersion:d.version});},'研究决定已应用')}>{approval.status==='approved'?'应用已批准研究决定':'批准并应用研究决定'}</button>{approval.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(approval,false))}>拒绝研究决定</button>:null}</div>:null}</details>;})}
            {(data.experimentPlans??[]).some(p=>p.campaignId===c.id)?<details><summary>已生成的方案、候选与结果比较</summary><ResearchPlanPanel data={data} campaign={c} busy={busy||disabled} perform={perform} onExperiment={onExperiment} onImplementation={onSession} onRun={onRun}/></details>:null}
        </details>;
    }
    proposalCard(p:Row<ChangeProposal>,disabled:boolean,readOnly=false){
        const {data,perform,onExperiment}=this.props,a=data.approvals.find(a=>a.id===p.approvalId),preview=this.state.previews[p.id],current=preview?.proposal.digest===p.digest;
        return <details key={p.id} className="workflow-card" open={!readOnly&&p.state==='prepared'&&a?.status==='pending'}><summary>代码变更 · {p.title}<Badge value={p.state}/></summary><p>{p.hypothesis}</p><p className="small muted">父实验 {short(p.baseExperimentId)} · 固定修订 {p.baseRevision} · 测试 {label(p.testsStatus)} · 审查 {short(p.reviewId)}</p>{p.sourceValidity==='stale'?<p role="status" className="error-text">来源已失效；旧差异保留，不能整合。</p>:null}
            <details><summary>固定来源与测试、审查依据</summary><pre className="file-preview">{JSON.stringify({id:p.id,digest:p.digest,baseDigest:p.baseSnapshot.digest,candidateDigest:p.candidateSnapshot.digest,testJobId:p.testJobId,reviewId:p.reviewId,reviewAcceptanceId:p.reviewAcceptanceId,sourceValidity:p.sourceValidity,flow:p.flow},null,2)}</pre></details>
            <button className="secondary compact" disabled={this.props.busy} onClick={()=>this.preview(p)}>查看完整固定差异</button>
            {current?<div>{preview.files.map((f:any)=><div className="inspector-section" key={f.path}><h4>{f.path} · {f.beforeMode??'未记录'} → {f.afterMode??'未记录'}</h4><details open><summary>变更前</summary><pre className="file-preview">{f.before??'（不存在）'}</pre></details><details open><summary>变更后</summary><pre className="file-preview">{f.after??'（删除）'}</pre></details></div>)}</div>:null}
            {!readOnly&&p.state==='prepared'&&p.sourceValidity!=='stale'&&a&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled||!current} onClick={()=>perform(async()=>{await this.approved(a);await api(`/change-proposals/${p.id}/apply`,{});},'固定变更已整合为子实验，未启动正式运行')}>{a.status==='approved'?'整合已批准变更':'批准并整合固定变更'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝代码变更</button>:null}</div>:null}
            {p.appliedExperimentId?<button className="text-button" onClick={()=>onExperiment(p.appliedExperimentId!)}>查看已创建子实验</button>:null}{readOnly?<p className="small muted">此历史提案未绑定主会话，只读保留；可在对话中重新准备有明确归属的变更。</p>:null}
        </details>;
    }
    render(){
        const {data,session,perform,busy,onExperiment}=this.props;
        if(session.taskId||session.role!=='coordinator')return null;
        const disabled=busy||data.project.archived||session.state==='archived',campaigns=(data.campaigns??[]).filter(c=>c.rootSessionId===session.id),tasks=(data.developmentTasks??[]).filter(t=>t.sessionId===session.id),jobs=(data.sandboxJobs??[]).filter(j=>j.sessionId===session.id),reviews=(data.reviews??[]).filter(r=>r.producerSessionId===session.id),proposals=(data.changeProposals??[]).filter(p=>proposalSession(data,p)===session.id),unbound=(data.changeProposals??[]).filter(p=>!proposalSession(data,p)),campaignIntentIds=new Set(campaigns.flatMap(c=>[...data.members.filter(m=>m.campaignId===c.id).map(m=>m.intentId),...(data.researchCandidates??[]).filter(v=>v.campaignId===c.id).flatMap(v=>v.intentId?[v.intentId]:[])])),runIntents=data.intents.filter(i=>i.rootSessionId===session.id&&!campaignIntentIds.has(i.id));
        if(!data.researchBrief?.brief&&!campaigns.length&&!tasks.length&&!jobs.length&&!reviews.length&&!proposals.length&&!unbound.length&&!runIntents.length&&!session.sourceRevisionId&&!(data.manuscripts??[]).some(r=>r.rootSessionId===session.id))return null;
        return <section className="chat-workflows" aria-label="当前对话任务"><p className="small muted">任务由对话中的 Pi 准备；需要确认的固定事项显示在这里。状态会更新，后续要求继续在输入框说明。</p>
            {this.researchBriefCard(disabled)}
            <PublicationDialogue data={data} session={session} disabled={disabled} busy={busy} perform={perform}/>
            {campaigns.slice().reverse().map(c=>this.campaignCard(c,disabled))}
            {runIntents.map(i=>this.runIntentCard(i,disabled))}
            {session.sourceRevisionId?<details className="workflow-card"><summary>私有实现来源与有限授权</summary><p>固定来源 {short(session.sourceRevisionId)}。可在对话中要求 Pi 编写代码、测试或修复。</p><WorkingGrants data={data} session={session} busy={disabled} perform={perform} dirty={false}/></details>:null}
            {tasks.slice().reverse().map(t=>{const a=data.approvals.find(a=>a.id===t.grantId),derived=t.manifest.workingGrant,grant=(data.workingGrants??[]).find(g=>g.id===session.workingGrantId),oldTemplate=!!session.workingGrantId&&!derived,grantOpen=!session.workingGrantId||derived?.id===session.workingGrantId&&grant?.effectiveState==='active'&&grant.validity==='current'&&Date.parse(grant.expiresAt)>Date.now(),actionable=!t.jobId&&!oldTemplate&&!!a&&['pending','approved'].includes(a.status);return <details key={t.id} className="workflow-card" open={actionable}><summary>开发测试 · {t.title}<Badge value={a?.status??t.state}/></summary><p>源码 {short(t.sourceDigest)} · 固定命令 {JSON.stringify(t.manifest.command)}</p><details><summary>固定源码、镜像、资源与产物</summary><pre className="file-preview">{JSON.stringify({developmentTaskId:t.id,sourceDigest:t.sourceDigest,manifest:t.manifest},null,2)}</pre></details>{oldTemplate?<p role="status">已绑定有界授权，旧单次测试模板不可提交；请在对话中要求重新准备。</p>:null}{actionable?<div className="actions wrap"><button className="primary compact" disabled={disabled||!grantOpen} onClick={()=>perform(async()=>{await this.approved(a);await this.call('development_submit',{developmentTaskId:t.id});},'固定开发测试已提交，结果会在本对话更新')}>{a!.status==='approved'?'提交已批准开发测试':'批准并提交开发测试'}</button>{a!.status==='pending'&&!derived?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a!,false))}>拒绝开发测试</button>:null}</div>:null}</details>;})}
            {jobs.slice().reverse().map(j=><details key={j.id} className="workflow-card"><summary>测试结果 · {short(j.id)}<Badge value={j.state}/><Badge value={j.integrity}/></summary><DevelopmentJob job={j} data={data} sessionId={session.id} perform={perform}/></details>)}
            {reviews.map(r=>{const a=data.approvals.find(a=>a.id===r.approvalId),task=data.tasks.find(t=>t.id===r.taskId),team=data.teams.find(t=>t.id===r.teamId),canStart=data.project.settings.enabled&&team?.state==='awaiting_approval'&&team.delegationEnabled;return <details key={r.id} className="workflow-card" open={r.status==='awaiting_approval'}><summary>独立审查 · {short(r.id)}<Badge value={r.status}/></summary><p>固定测试 {short(r.jobId)} · 源码 {short(r.sourceDigest)}</p><details><summary>审查对象与证据</summary><pre className="file-preview">{JSON.stringify({review:r,taskId:task?.id,inputEvidenceIds:task?.inputEvidenceIds},null,2)}</pre></details>{task?.result?<div><p>执行 {label(task.execution)} · 验收 {label(task.acceptance)} · 意见 {task.result.verdict==='accept'?'接受':task.result.verdict==='reject'?'拒绝':task.result.verdict==='disputed'?'争议':'未提供'}</p><p>{task.result.summary}</p></div>:null}{r.status==='stale'?<p role="status">测试或审查来源已失效，历史意见不能用于新整合。</p>:null}{canStart&&a&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(a);await api(`/teams/${r.teamId}/activate`,{});},'独立审查已启动')}>{a.status==='approved'?'启动已批准独立审查':'批准并启动独立审查'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝独立审查</button>:null}</div>:null}{!data.project.settings.enabled&&r.status==='awaiting_approval'?<p role="status">开启输入框旁的多智能体模式后才能分配独立审查。</p>:null}</details>;})}
            {proposals.slice().reverse().map(p=>this.proposalCard(p,disabled))}
            {unbound.length?<details className="workflow-card"><summary>未绑定会话的历史提案（{unbound.length}，只读）</summary>{unbound.map(p=>this.proposalCard(p,true,true))}</details>:null}
        </section>;
    }
}
