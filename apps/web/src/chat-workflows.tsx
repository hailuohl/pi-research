import * as React from 'react';
import {api} from './api.js';
import {Badge} from './ui.js';
import {automaticApprovalLabel,short,label,number} from './models.js';
import type {ProjectState,Session,Row,Approval,ChangeProposal,Campaign,RunIntent} from './models.js';
import type {Perform} from './workbench.js';
import {DevelopmentJob} from './implementation.js';
import {ResearchPlanPanel} from './research-plan.js';
import {WorkingGrants} from './working-grants.js';
import {runGrantUsable} from './run-grants.js';
import {PublicationDialogue} from './publication-dialogue.js';
import {summarizeSessionWork} from './task-summary-model.js';
import type {SessionWorkSummary} from './task-summary-model.js';
import type {ValidationBinding,ValidationResult} from './models.js';
export {summarizeSessionWork};

export function proposalSession(data:ProjectState,proposal:Row<ChangeProposal>):string|undefined {
    return (proposal as any).rootSessionId || (data.reviews??[]).find(r=>r.id===proposal.reviewId)?.producerSessionId || (data.sandboxJobs??[]).find(j=>j.id===proposal.testJobId)?.sessionId;
}

const summaryCaptions:Record<string,string>={
    confirmed:'已确认',awaiting_confirmation:'待确认',awaiting_approval:'待审批',ready_to_submit:'可提交',
    running:'执行中',stopping:'停止状态待核对',completed:'已完成',completed_with_issue:'完成但验证不完整',
    failed:'失败',cancelled:'已取消',blocked:'受阻',unknown:'状态未知',
    pass:'通过',fail:'失败',skip:'已跳过',not_run:'未运行',stale:'已失效',
    not_assessed:'未评估',needs_review:'待研究判断',reviewed:'已有判断记录',complete:'完整',pending:'待定',incomplete:'不完整',
};
function summaryCaption(value:string){return summaryCaptions[value]??value;}
function validationReason(value:string){
    const captions:Record<string,string>={SOURCE_CHANGED:'本次读取的源码摘要与原快照不同',EXPERIMENT_REVISION_CHANGED:'当前实验修订与原运行不同',EXPERIMENT_CONTRACT_CHANGED:'当前计算契约与原运行不同',READ_MISSING:'所需文件或记录缺失，尚不能完成核验',READ_DENIED:'所需文件当前不可读取',READ_FAILED:'本次读取未完成',SOURCE_UNREADABLE:'源码或固定快照当前不可读取',ARTIFACT_CHANGED:'读取期间文件发生变化，尚不能确认',ARTIFACT_CORRUPTED:'归档产物摘要校验失败',SNAPSHOT_CORRUPTED:'固定快照字节、大小或模式校验失败',MANIFEST_CORRUPTED:'原固定清单摘要或身份校验失败',RECEIPT_INVALID:'本次回执核对失败，当前结果不可复用',RECEIPT_NOT_VERIFIED:'尚无本次成功回执核验',CHANGE_SOURCE_STALE:'来源审查或采纳已失效',ACCEPTANCE_STALE:'来源采纳记录已变化',DEVELOPMENT_SOURCE_STALE:'开发来源绑定已变化',SESSION_PERMISSION_STALE:'原会话权限依据已变化',WORKING_GRANT_REVOKED:'原开发授权已撤销',RUN_GRANT_REVOKED:'原运行授权已撤销',APPROVAL_STALE:'原批准依据已变化'};
    return (captions[value]??'宿主校验未能确认此项证据')+'（'+value+'）';
}

function SessionWorkSummaryCard({summary,onRun,onCheck,validation,pending=false,unavailable=false,checked=false,busy=false}:{summary:SessionWorkSummary;onRun:(runId:string,experimentId:string)=>void;onCheck?:()=>void;validation?:ValidationResult|null;pending?:boolean;unavailable?:boolean;checked?:boolean;busy?:boolean}) {
    const isRun=summary.source.kind==='run'&&!!summary.experimentId;
    return <details className="workflow-card session-work-summary" open={['blocked','unknown','failed','awaiting_confirmation','awaiting_approval','ready_to_submit','running','stopping','completed_with_issue'].includes(summary.operationStatus)}>
        <summary>当前任务摘要 <Badge value={summary.operationStatus} caption={summaryCaption(summary.operationStatus)}/></summary>
        <p><strong>目标：</strong>{summary.goal||'当前研究工作'}</p>
        <p><strong>范围：</strong>{summary.scope||'尚未明确固定范围'}</p>
        <div className="summary-status-grid">
            <p><strong>执行状态：</strong>{summaryCaption(summary.operationStatus)}</p>
            <p><strong>历史验证状态（原固定快照）：</strong><Badge value={summary.recordedVerificationStatus??summary.verificationStatus} caption={summaryCaption(summary.recordedVerificationStatus??summary.verificationStatus)}/></p>
            <p><strong>科学判断：</strong>{summaryCaption(summary.scientificStatus)}</p>
        </div>
        {summary.recordedVerificationStatus&&summary.verificationStatus==='stale'?<p>当前已知来源状态：已失效；原固定回执保留。</p>:null}
        {onCheck?<div aria-live="polite"><p>本次回执核对：{pending?'核对中':validation?summaryCaption(validation.receiptCheck):unavailable||checked?'未知':'未核对'}</p><p>当前适用性：{unavailable?'未知':pending?'核对中':validation?.applicability==='current'?'核对时观察到一致':validation?.applicability==='stale'?'来源已变化，不能复用':validation||checked?'未知':'未核对'}</p>{validation?<><p className="small muted">本次读取观察时间：{validation.checkedAt}。此后外部编辑需重新核对；本次核对不改变原回执或科学判断。</p>{validation.receiptReason?<p>回执核对说明：{validationReason(validation.receiptReason)}</p>:null}{validation.applicabilityReason?<p>适用性说明：{validationReason(validation.applicabilityReason)}</p>:null}</>:null}<button type="button" className="secondary compact" disabled={busy||pending||unavailable} onClick={onCheck}>核对当前适用性</button></div>:null}
        {summary.blocker?<p role="status" className="inline-warning"><strong>阻塞/限制：</strong>{summary.blocker}</p>:null}
        <p><strong>下一步：</strong>{summary.nextAction}</p>
        <details>
            <summary>验证依据与原始记录</summary>
            <p>原始对象：{summary.source.kind} · {summary.source.id}</p>
            <p>固定快照摘要：{summary.snapshotDigest??'未记录，不能据此认定当前源码已验证'}</p>
            {validation?<p>本次观察源码摘要：{validation.observedSourceDigest??'未能读取'}</p>:null}
            {summary.validationEvidence?<div className="validation-evidence-detail">
                <p>固定清单摘要：{summary.validationEvidence.manifestDigest??'未记录'}</p>
                <p>固定输入摘要：{summary.validationEvidence.inputDigests?.length?summary.validationEvidence.inputDigests.map(a=>a.id+' · '+a.digest).join('；'):'未提供'}</p>
                <p>固定命令：{summary.validationEvidence.command?.length?JSON.stringify(summary.validationEvidence.command):'未记录'}</p>
                <p>实际退出码：{summary.validationEvidence.exitCode===undefined?'未记录':summary.validationEvidence.exitCode===null?'未知/未返回':summary.validationEvidence.exitCode}</p>
                <p>产物完整性：{summary.validationEvidence.integrity?summaryCaption(summary.validationEvidence.integrity):'未记录'}</p>
                <p>执行时间：{summary.validationEvidence.startedAt??'未记录'} → {summary.validationEvidence.endedAt??'未记录'}</p>
                {summary.validationEvidence.metrics&&Object.keys(summary.validationEvidence.metrics).length?<p>实际指标：{Object.entries(summary.validationEvidence.metrics).map(([name,value])=>name+'='+number(value)).join(' · ')}</p>:null}
                <p>标准测试统计（总数/通过/失败/跳过）：未提供</p>
            </div>:<p>当前没有实际验证回执；不能把计划、审批或文件存在视为验证通过。</p>}
            <p>归档产物：{summary.artifactIds.length?summary.artifactIds.map(short).join('、'):'暂无已登记产物'}</p>
            <p className="small muted">验证通过仅表示记录中的工程检查满足其执行条件；不等于科学结论成立。未运行、未知和过期状态不会被当作通过。</p>
        </details>
        {isRun?<button type="button" className="secondary compact" onClick={()=>onRun(summary.source.id,summary.experimentId!)}>打开原始运行</button>:null}
    </details>;
}

export class ChatWorkflows extends React.Component<{
    data:ProjectState;session:Row<Session>;busy:boolean;perform:Perform;readCurrent?:boolean;validationPerform?:Perform;
    onSession:(id:string)=>void;onExperiment:(id:string)=>void;onRun:(runId:string,experimentId:string)=>void;
},{previews:Record<string,any>;runIntentRevision:number;validationResult:ValidationResult|null;validationPending:boolean;validationChecked:boolean}> {
    state={previews:{} as Record<string,any>,runIntentRevision:0,validationResult:null as ValidationResult|null,validationPending:false,validationChecked:false};
    private mounted=true;private readEpoch=0;
    private validationEpoch=0;private validationData:ProjectState|null=null;
    private messageKeys=new Map<string,string>();private approvedRunIntents=new Set<string>();private queuedRunIntents=new Set<string>();
    componentWillUnmount(){this.mounted=false;this.readEpoch++;this.validationEpoch++;}
    private validationBinding(props=this.props):ValidationBinding|null {
        const summary=summarizeSessionWork(props.data,props.session),kind=summary?.source.kind;
        if(!summary||(kind!=='run'&&kind!=='development-job'))return null;
        const manifestDigest=summary.validationEvidence?.manifestDigest,sourceDigest=summary.validationEvidence?.sourceDigest;
        if(!manifestDigest||!sourceDigest)return null;
        return {projectId:props.data.project.id,sessionId:props.session.id,kind,id:summary.source.id,manifestDigest,sourceDigest};
    }
    componentDidUpdate(previous:Readonly<ChatWorkflows['props']>){
        const scopeChanged=previous.data.project.id!==this.props.data.project.id||previous.session.id!==this.props.session.id||JSON.stringify(this.validationBinding(previous))!==JSON.stringify(this.validationBinding());
        const disconnected=this.props.readCurrent===false;
        const changed=scopeChanged||disconnected||!this.state.validationPending&&(previous.data!==this.props.data||this.props.busy&&!previous.busy);
        if(changed&&(this.state.validationPending||this.state.validationResult||scopeChanged)){
            this.validationEpoch++;this.validationData=null;this.setState({validationResult:null,validationPending:false,validationChecked:!scopeChanged});
        }
    }
    async checkCurrentValidation(){
        const binding=this.validationBinding();if(!binding||this.props.busy||this.props.readCurrent===false)return;
        const epoch=++this.validationEpoch,matches=()=>this.mounted&&epoch===this.validationEpoch&&this.props.readCurrent!==false&&JSON.stringify(this.validationBinding())===JSON.stringify(binding);
        this.validationData=null;this.setState({validationResult:null,validationPending:true,validationChecked:true});
        let executed=false;
        try{
            const result=await (this.props.validationPerform??this.props.perform)(async()=>{executed=true;return api(`/projects/${binding.projectId}/validation?${new URLSearchParams({kind:binding.kind,id:binding.id,sessionId:binding.sessionId,manifestDigest:binding.manifestDigest,sourceDigest:binding.sourceDigest})}`);});
            if(!matches())return;
            if(executed&&result&&Object.entries(binding).every(([k,v])=>result[k]===v)&&['pass','fail','unknown','not_run'].includes(result.receiptCheck)&&['current','stale','unknown'].includes(result.applicability)&&typeof result.checkedAt==='string'&&(result.applicability!=='current'||summarizeSessionWork(this.props.data,this.props.session)?.verificationStatus!=='stale')){
                this.validationData=this.props.data;this.setState({validationResult:result});
            }
        }finally{if(this.mounted&&epoch===this.validationEpoch)this.setState({validationPending:false});}
    }
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
        return <details key="research-brief" className="workflow-card" open={brief.status!=='confirmed'||!valid}><summary>研究问题与计划 · 第 {brief.revision} 版<Badge value={confirmed?'approved':brief.status==='ready'?'pending':'draft'} caption={brief.automaticApproval?'自动处理':confirmed?'已确认':brief.status==='ready'?'待确认':'待澄清'}/></summary>
            <p><strong>{brief.question}</strong></p><p>{brief.scope}</p>
            {brief.clarificationQuestions.length?<div><strong>待明确的问题</strong><ul>{brief.clarificationQuestions.map((q,i)=><li key={i}>{q}</li>)}</ul></div>:null}
            {brief.successCriteria.length?<div><strong>判断标准</strong><ul>{brief.successCriteria.map((q,i)=><li key={i}>{q}</li>)}</ul></div>:null}
            {brief.steps.length?<details><summary>研究步骤（{brief.steps.length}）</summary><ol>{brief.steps.map((step,i)=><li key={i}><strong>{step.title}</strong> · {step.description}</li>)}</ol></details>:null}
            <details><summary>文献、假设与约束 · {brief.evidenceIds.length} 项证据</summary><p>{brief.literatureSummary}</p>{brief.hypotheses.map((h,i)=><p key={i}>{h.statement} · 证据 {h.evidenceIds.length}</p>)}{brief.constraints.map((c,i)=><p key={i}>{c}</p>)}</details>
            {!valid?<p role="status">部分来源已失效，历史内容保留；请在对话中重新核对资料。</p>:null}
            {brief.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(brief)}</p>:null}{current&&!brief.automaticApproval&&brief.status!=='clarifying'?<div className="actions"><button className="primary compact" disabled={disabled||!valid} onClick={()=>perform(()=>this.continueResearchBrief(),'研究计划已确认，继续当前对话')}>{confirmed?'继续已确认计划':'确认研究问题与计划'}</button></div>:null}
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
        const {data,session}=this.props,approval=data.approvals.find(a=>a.id===intent.approvalId),bound=intent.runGrant??approval?.runGrant,grant=(data.runGrants??[]).find(g=>g.id===bound?.id),run=data.runs.find(r=>r.id===intent.runId&&r.experimentId===intent.experimentId),keyId=`${intent.id}:${intent.manifestDigest}`,taskBound=!!grant?.taskBinding,grantUsable=!!grant&&grant.sessionId===session.id&&runGrantUsable(grant),campaignOwned=!!campaignId&&data.campaigns.some(c=>c.id===campaignId&&c.rootSessionId===session.id)&&(data.members.some(m=>m.campaignId===campaignId&&m.intentId===intent.id)||(data.researchCandidates??[]).some(c=>c.campaignId===campaignId&&c.intentId===intent.id)),owned=campaignId?campaignOwned&&(intent.rootSessionId===session.id||intent.rootSessionId==null||!!bound&&!taskBound&&grantUsable):intent.rootSessionId===session.id,approved=approval?.status==='approved'||approval?.status==='pending'&&this.approvedRunIntents.has(keyId),queued=this.queuedRunIntents.has(keyId),canContinue=!approval?.automaticApproval&&owned&&intent.status==='prepared'&&!intent.runId&&!run&&!queued&&!!approval&&(!bound&&['pending','approved'].includes(approval.status)||!!bound&&!taskBound&&grantUsable&&approval.status==='approved');
        return <details className="workflow-card" key={intent.id} open={canContinue||queued}><summary>正式实验 · {data.experiments.find(e=>e.id===intent.experimentId)?.title??short(intent.experimentId)}<Badge value={run?.state??(approved?'approved':approval?.status??intent.status)} caption={!run&&approval?.automaticApproval?'自动审批':undefined}/></summary>{approval?.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(approval)}</p>:null}{intent.manifest.contract?.runner==='local'?<p className="small">本地执行：使用当前用户权限，文件和网络不隔离。运行环境 {intent.manifest.contract.localRuntimeId}</p>:null}{intent.manifest.contract?.gpu?<p className="small code-wrap">NVIDIA 设备：{intent.manifest.contract.gpu.deviceIds.join('、')}</p>:null}{intent.manifest.researchBrief?<p className="small muted">研究依据：第 {intent.manifest.researchBrief.revision} 版计划</p>:null}{intent.manifest.analysis?<p className="small muted">结束后由 {intent.manifest.analysis.model.provider}/{intent.manifest.analysis.model.model} 自动分析一次，仅读取本次结果并给出建议。</p>:null}<details><summary>冻结参数、计算契约与授权</summary><pre className="file-preview">{JSON.stringify({intentId:intent.id,manifestDigest:intent.manifestDigest,manifest:intent.manifest,runGrant:bound},null,2)}</pre></details>{canContinue?<button className="primary compact" disabled={disabled} onClick={()=>this.continueRunIntent(intent,campaignId)}>确认并让智能体执行</button>:null}{queued&&intent.status==='prepared'&&!run?<p className="small muted" role="status">执行消息已入队，等待智能体回查固定运行。</p>:taskBound?<p className="small muted" role="status">此固定运行绑定任务级授权，由对应的已授权任务提交。</p>:bound&&!grantUsable?<p className="small muted" role="status">绑定授权不可用或不属于当前主会话；保留固定历史，不提供提交入口。</p>:!owned?<p className="small muted" role="status">此固定运行未绑定当前对话，只读保留。</p>:approval&&['rejected','stale'].includes(approval.status)?<p className="small muted" role="status">固定运行审批已{approval.status==='rejected'?'拒绝':'失效'}；不会自动创建替代意向。</p>:intent.status!=='prepared'&&!run?<p className="small muted" role="status">固定 RunIntent 状态为 {label(intent.status)}；不会自动补跑。</p>:null}{run?<div><button className="text-button" onClick={()=>this.props.onRun(run.id,run.experimentId)}>查看实际运行日志与结果</button>{run.metrics?<p className="small">{Object.entries(run.metrics).map(([name,value])=>`${name}=${number(value)}${run.manifest.contract.metrics[name]?.unit?` ${run.manifest.contract.metrics[name].unit}`:''}`).join(' · ')}</p>:null}</div>:null}</details>;
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
        return <details key={c.id} className="workflow-card" open={c.state==='draft'||data.decisions.some(d=>d.campaignId===c.id&&d.status==='proposed')||data.intents.some(i=>intentIds.has(i.id)&&i.status==='prepared'&&!i.runId)||data.runs.some(r=>data.intents.some(i=>intentIds.has(i.id)&&i.runId===r.id)&&['failed','unknown'].includes(r.state))}><summary>研究计划 · {c.goal}<Badge value={c.state}/></summary>
            <p>{c.goal}</p><dl className="details"><dt>基线</dt><dd>{baseline?.title??short(c.baselineExperimentId)}</dd><dt>评价指标</dt><dd>{c.primaryMetric} · {c.direction==='min'?'越小越好':'越大越好'}</dd><dt>已绑定模型</dt><dd>{c.rootModel.provider||'未配置供应商'} / {c.rootModel.model||'未配置模型'}</dd><dt>结果分析</dt><dd>{c.autoAnalyze?'批准后允许有界自动分析':'由对话指令请求分析'}</dd></dl>
            <details><summary>固定来源、额度与截止条件</summary><pre className="file-preview">{JSON.stringify({id:c.id,rootSessionId:c.rootSessionId,contractDigest:c.contractDigest,planDigest:c.planDigest,limits:c.limits,rootModel:c.rootModel},null,2)}</pre></details>
            {c.state==='draft'&&a&&!a.automaticApproval&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(a);await api(`/campaigns/${c.id}/activate`,{expectedVersion:c.version});},'研究计划已启动；正式实验仍按固定授权提交')}>{a.status==='approved'?'启动已批准研究计划':'批准并启动研究计划'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝研究计划</button>:null}</div>:null}
            {a?<p className="small muted">批准状态：{automaticApprovalLabel(a)??label(a.status)}</p>:null}
            <div className="actions wrap">{c.state==='active'?<button className="secondary compact" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/pause`,{expectedVersion:c.version}))}>暂停研究计划</button>:null}{c.state==='paused'?<button className="secondary compact" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/resume`,{expectedVersion:c.version}))}>恢复研究计划</button>:null}{['active','paused'].includes(c.state)?<button className="text-button danger" disabled={disabled} onClick={()=>perform(()=>api(`/campaigns/${c.id}/stop`,{expectedVersion:c.version,reason:'用户在原对话中停止研究计划'}))}>停止研究计划</button>:null}<button className="text-button" onClick={()=>onExperiment(c.focusExperimentId)}>查看当前实验</button></div>
            {observations.length?<details><summary>实际观测与证据（{observations.length}）</summary>{observations.map(o=><div className="inspector-section" key={o.id}><button className="text-button" onClick={()=>onRun(o.runId,o.experimentId)}>Run {short(o.runId)}</button><Badge value={o.validation}/><p>{c.primaryMetric}={number(o.metrics[c.primaryMetric])} · {o.explanation}</p><p className="small muted">观测 {short(o.id)} · 证据 {o.evidenceIds.map(short).join('、')||'未取得'}</p></div>)}</details>:null}
            {data.intents.filter(i=>intentIds.has(i.id)).map(i=>this.runIntentCard(i,disabled,c.id))}
            {data.decisions.filter(d=>d.campaignId===c.id).map(d=>{const approval=data.approvals.find(a=>a.id===d.approvalId);return <details className="workflow-card" key={d.id} open={d.status==='proposed'}><summary>研究决定 · {label(d.action)}<Badge value={d.status} caption={d.status==='proposed'&&approval?.automaticApproval?'自动审批':undefined}/></summary><p>{d.reason}</p>{approval?.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(approval)}</p>:null}<details><summary>依据、候选配置与固定方案</summary><pre className="file-preview">{JSON.stringify(d,null,2)}</pre>{(data.experimentPlans??[]).filter(p=>p.id===d.planRevisionId).map(p=><pre className="file-preview" key={p.id}>{JSON.stringify(p,null,2)}</pre>)}</details>{d.status==='proposed'&&approval&&!approval.automaticApproval&&['pending','approved'].includes(approval.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(approval);await api(`/campaign-decisions/${d.id}/apply`,{expectedVersion:d.version});},'研究决定已应用')}>{approval.status==='approved'?'应用已批准研究决定':'批准并应用研究决定'}</button>{approval.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(approval,false))}>拒绝研究决定</button>:null}</div>:null}</details>;})}
            {(data.experimentPlans??[]).some(p=>p.campaignId===c.id)?<details><summary>已生成的方案、候选与结果比较</summary><ResearchPlanPanel data={data} campaign={c} busy={busy} perform={perform} onExperiment={onExperiment} onImplementation={onSession} onRun={onRun}/></details>:null}
        </details>;
    }
    proposalCard(p:Row<ChangeProposal>,disabled:boolean,readOnly=false){
        const {data,perform,onExperiment}=this.props,a=data.approvals.find(a=>a.id===p.approvalId),preview=this.state.previews[p.id],current=preview?.proposal.digest===p.digest;
        return <details key={p.id} className="workflow-card" open={!readOnly&&p.state==='prepared'&&a?.status==='pending'}><summary>代码变更 · {p.title}<Badge value={p.state}/></summary>{a?.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(a)}</p>:null}<p>{p.hypothesis}</p><p className="small muted">父实验 {short(p.baseExperimentId)} · 固定修订 {p.baseRevision} · 测试 {label(p.testsStatus)} · 审查 {short(p.reviewId)}</p>{p.sourceValidity==='stale'?<p role="status" className="error-text">来源已失效；旧差异保留，不能整合。</p>:null}
            <details><summary>固定来源与测试、审查依据</summary><pre className="file-preview">{JSON.stringify({id:p.id,digest:p.digest,baseDigest:p.baseSnapshot.digest,candidateDigest:p.candidateSnapshot.digest,testJobId:p.testJobId,reviewId:p.reviewId,reviewAcceptanceId:p.reviewAcceptanceId,sourceValidity:p.sourceValidity,flow:p.flow},null,2)}</pre></details>
            <button className="secondary compact" disabled={this.props.busy} onClick={()=>this.preview(p)}>查看完整固定差异</button>
            {current?<div>{preview.files.map((f:any)=><div className="inspector-section" key={f.path}><h4>{f.path} · {f.beforeMode??'未记录'} → {f.afterMode??'未记录'}</h4><details open><summary>变更前</summary><pre className="file-preview">{f.before??'（不存在）'}</pre></details><details open><summary>变更后</summary><pre className="file-preview">{f.after??'（删除）'}</pre></details></div>)}</div>:null}
            {!readOnly&&p.state==='prepared'&&p.sourceValidity!=='stale'&&a&&!a.automaticApproval&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled||!current} onClick={()=>perform(async()=>{await this.approved(a);await api(`/change-proposals/${p.id}/apply`,{});},'固定变更已整合为子实验，未启动正式运行')}>{a.status==='approved'?'整合已批准变更':'批准并整合固定变更'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝代码变更</button>:null}</div>:null}
            {p.appliedExperimentId?<button className="text-button" onClick={()=>onExperiment(p.appliedExperimentId!)}>查看已创建子实验</button>:null}{readOnly?<p className="small muted">此历史提案未绑定主会话，只读保留；可在对话中重新准备有明确归属的变更。</p>:null}
        </details>;
    }
    render(){
        const {data,session,perform,busy,onExperiment}=this.props;
        if(session.taskId||session.role!=='coordinator')return null;
        const summary=summarizeSessionWork(data,session);
        const disabled=busy||data.project.archived||session.state==='archived',campaigns=(data.campaigns??[]).filter(c=>c.rootSessionId===session.id),tasks=(data.developmentTasks??[]).filter(t=>t.sessionId===session.id),jobs=(data.sandboxJobs??[]).filter(j=>j.sessionId===session.id),reviews=(data.reviews??[]).filter(r=>r.producerSessionId===session.id),proposals=(data.changeProposals??[]).filter(p=>proposalSession(data,p)===session.id),unbound=(data.changeProposals??[]).filter(p=>!proposalSession(data,p)),campaignIntentIds=new Set(campaigns.flatMap(c=>[...data.members.filter(m=>m.campaignId===c.id).map(m=>m.intentId),...(data.researchCandidates??[]).filter(v=>v.campaignId===c.id).flatMap(v=>v.intentId?[v.intentId]:[])])),runIntents=data.intents.filter(i=>i.rootSessionId===session.id&&!campaignIntentIds.has(i.id));
        if(!summary&&!data.researchBrief?.brief&&!campaigns.length&&!tasks.length&&!jobs.length&&!reviews.length&&!proposals.length&&!unbound.length&&!runIntents.length&&!session.sourceRevisionId&&!(data.manuscripts??[]).some(r=>r.rootSessionId===session.id))return null;
        const completedIds=new Set<string>([
            ...(data.researchBrief?.brief?.status==='confirmed'&&data.researchBrief.evidenceChecks.every(e=>e.current)?['research-brief']:[]),
            ...runIntents.filter(i=>data.runs.some(r=>r.id===i.runId&&r.state==='succeeded')).map(i=>i.id),
            ...campaigns.filter(c=>c.state==='stopped'&&!data.decisions.some(d=>d.campaignId===c.id&&d.status==='proposed')&&!data.intents.some(i=>(data.members.some(m=>m.campaignId===c.id&&m.intentId===i.id)||(data.researchCandidates??[]).some(v=>v.campaignId===c.id&&v.intentId===i.id))&&(!i.runId||data.runs.some(r=>r.id===i.runId&&r.state!=='succeeded')))).map(c=>c.id),
            ...tasks.filter(t=>jobs.some(j=>j.id===t.jobId&&j.state==='succeeded')).map(t=>t.id),
            ...jobs.filter(j=>j.state==='succeeded').map(j=>j.id),
            ...reviews.filter(r=>r.status==='passed'&&data.tasks.some(t=>t.id===r.taskId&&t.result?.verdict==='accept')).map(r=>r.id),
            ...proposals.filter(p=>p.state==='applied'&&p.sourceValidity!=='stale').map(p=>p.id),
        ]);
        const content=<section className="chat-workflows" aria-label="当前对话任务"><p className="small muted">在对话中提出任务；执行状态与记录显示在这里。</p>
            {summary?<SessionWorkSummaryCard summary={summary} onRun={this.props.onRun} onCheck={this.validationBinding()?()=>void this.checkCurrentValidation():undefined} validation={this.validationData===data&&!busy?this.state.validationResult:null} pending={this.state.validationPending} checked={this.state.validationChecked} unavailable={this.props.readCurrent===false} busy={busy}/>:null}
            {this.researchBriefCard(disabled)}
            <PublicationDialogue data={data} session={session} disabled={disabled} busy={busy} perform={perform}/>
            {campaigns.slice().reverse().map(c=>this.campaignCard(c,disabled))}
            {runIntents.map(i=>this.runIntentCard(i,disabled))}
            {session.sourceRevisionId?<details className="workflow-card"><summary>私有实现来源与有限授权</summary><p>固定来源 {short(session.sourceRevisionId)}。</p><WorkingGrants data={data} session={session} busy={disabled} perform={perform} dirty={false}/></details>:null}
            {tasks.slice().reverse().map(t=>{const a=data.approvals.find(a=>a.id===t.grantId),derived=t.manifest.workingGrant,grant=(data.workingGrants??[]).find(g=>g.id===session.workingGrantId),oldTemplate=!!session.workingGrantId&&!derived,grantOpen=!session.workingGrantId||derived?.id===session.workingGrantId&&grant?.effectiveState==='active'&&grant.validity==='current'&&Date.parse(grant.expiresAt)>Date.now(),expired=Date.parse(t.manifest.deadline)<=Date.now(),actionable=!expired&&!t.jobId&&!oldTemplate&&!!a&&!a.automaticApproval&&['pending','approved'].includes(a.status);return <details key={t.id} className="workflow-card" open={actionable}><summary>开发测试 · {t.title}<Badge value={a?.status??t.state} caption={a?.automaticApproval?'自动审批':undefined}/></summary>{a?.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(a)}</p>:null}<p>源码 {short(t.sourceDigest)} · 固定命令 {JSON.stringify(t.manifest.command)}</p><details><summary>固定源码、镜像、资源与产物</summary><pre className="file-preview">{JSON.stringify({developmentTaskId:t.id,sourceDigest:t.sourceDigest,manifest:t.manifest},null,2)}</pre></details>{expired&&!t.jobId?<p role="status">固定测试清单已过期；原批准与源码保留。请在对话中重新准备测试，不会延长或补跑此清单。</p>:null}{oldTemplate?<p role="status">已绑定有界授权，旧单次测试模板不可提交；请在对话中要求重新准备。</p>:null}{actionable?<div className="actions wrap"><button className="primary compact" disabled={disabled||!grantOpen} onClick={()=>perform(async()=>{await this.approved(a);await this.call('development_submit',{developmentTaskId:t.id});},'固定开发测试已提交，结果会在本对话更新')}>{a!.status==='approved'?'提交已批准开发测试':'批准并提交开发测试'}</button>{a!.status==='pending'&&!derived?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a!,false))}>拒绝开发测试</button>:null}</div>:null}</details>;})}
            {jobs.slice().reverse().map(j=><details key={j.id} className="workflow-card"><summary>测试结果 · {short(j.id)}<Badge value={j.state}/><Badge value={j.integrity}/></summary><DevelopmentJob job={j} data={data} sessionId={session.id} perform={perform}/></details>)}
            {reviews.map(r=>{const a=data.approvals.find(a=>a.id===r.approvalId),task=data.tasks.find(t=>t.id===r.taskId),team=data.teams.find(t=>t.id===r.teamId),canStart=data.project.settings.enabled&&team?.state==='awaiting_approval'&&team.delegationEnabled;return <details key={r.id} className="workflow-card" open={r.status==='awaiting_approval'}><summary>独立审查 · {short(r.id)}<Badge value={r.status} caption={r.status==='awaiting_approval'&&a?.automaticApproval?'自动审批':undefined}/></summary>{a?.automaticApproval?<p className="small muted" role="status">{automaticApprovalLabel(a)}</p>:null}<p>固定测试 {short(r.jobId)} · 源码 {short(r.sourceDigest)}</p><details><summary>审查对象与证据</summary><pre className="file-preview">{JSON.stringify({review:r,taskId:task?.id,inputEvidenceIds:task?.inputEvidenceIds},null,2)}</pre></details>{task?.result?<div><p>执行 {label(task.execution)} · 验收 {label(task.acceptance)} · 意见 {task.result.verdict==='accept'?'接受':task.result.verdict==='reject'?'拒绝':task.result.verdict==='disputed'?'争议':'未提供'}</p><p>{task.result.summary}</p></div>:null}{r.status==='stale'?<p role="status">测试或审查来源已失效，历史意见不能用于新整合。</p>:null}{canStart&&a&&!a.automaticApproval&&['pending','approved'].includes(a.status)?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(async()=>{await this.approved(a);await api(`/teams/${r.teamId}/activate`,{});},'独立审查已启动')}>{a.status==='approved'?'启动已批准独立审查':'批准并启动独立审查'}</button>{a.status==='pending'?<button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.decide(a,false))}>拒绝独立审查</button>:null}</div>:null}{!data.project.settings.enabled&&r.status==='awaiting_approval'?<p role="status">开启输入框旁的多智能体模式后才能分配独立审查。</p>:null}</details>;})}
            {proposals.slice().reverse().map(p=>this.proposalCard(p,disabled))}
            {unbound.length?<details className="workflow-card"><summary>未绑定会话的历史提案（{unbound.length}，只读）</summary>{unbound.map(p=>this.proposalCard(p,true,true))}</details>:null}
        </section>;
        const current:React.ReactNode[]=[],completed:React.ReactNode[]=[];
        React.Children.forEach(content.props.children,child=>{(React.isValidElement(child)&&completedIds.has(String(child.key))?completed:current).push(child);});
        return <section className="chat-workflows" aria-label="当前对话任务">{current}{completed.length?<details className="workflow-history"><summary>已完成事项（{completed.length}）</summary>{completed}</details>:null}</section>;
    }
}
