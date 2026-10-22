import * as React from 'react';
import {api} from './api.js';
import {Badge} from './ui.js';
import {short,date} from './models.js';
import type {ProjectState,Row,Session,DocumentLocation,ResearchActionDTO} from './models.js';
import type {Perform} from './workbench.js';
import {LiteratureView,EvidenceView,ReportsView} from './data-views.js';

type Decision='confirm'|'reject'|'accepted'|'rejected'|'disputed'|'dismiss';
type Props={data:ProjectState;session:Row<Session>;busy:boolean;perform:Perform;onSession:(id:string)=>void;onRun:(runId:string,experimentId:string)=>void;onCampaign?:(id:string)=>void;onRegister?:(id:string,content:string)=>void;onClaim?:()=>void;onUseDocument?:(target:{documentVersionId:string;parseResultId:string})=>void;onSources?:()=>void};
const titles={text_grant:'确认原文检索范围',claim_decision:'确认研究结论',report_compose:'确认报告来源',history:'查看项目历史'};

export class ResearchActionCards extends React.Component<Props> {
    render(){const {data,session}=this.props;if(session.role!=='coordinator'||session.taskId)return null;
        const requests=(data.researchActions??[]).filter(r=>r.sessionId===session.id&&r.projectId===data.project.id);
        if(!requests.length)return null;
        const current=requests.filter(r=>r.state==='pending'),history=requests.filter(r=>r.state!=='pending');
        return <section className="chat-workflows" aria-label="按需研究操作">{current.map(request=><ResearchActionCard key={request.id} {...this.props} request={request}/>)}{history.length?<details className="workflow-history"><summary>已处理的确认（{history.length}）</summary>{history.map(request=><ResearchActionCard key={request.id} {...this.props} request={request}/>)}</details>:null}</section>;
    }
}

export class ResearchActionCard extends React.Component<Props&{request:ResearchActionDTO},{saving:boolean;error:string;document:DocumentLocation|undefined;reportId:string;showReport:boolean}> {
    state={saving:false,error:'',document:undefined as DocumentLocation|undefined,reportId:'',showReport:false};
    private mounted=true;private sending=false;
    componentWillUnmount(){this.mounted=false;}
    private matches(projectId:string,sessionId:string,requestId:string){return this.mounted&&this.props.data.project.id===projectId&&this.props.session.id===sessionId&&this.props.request.id===requestId;}
    async decide(decision:Decision){
        const {data,session,request}=this.props,closing=decision==='reject'||decision==='dismiss';
        if(this.sending||this.props.busy||request.projectId!==data.project.id||request.sessionId!==session.id||data.project.archived||session.state==='archived'||request.state!=='pending'||!closing&&request.effectiveState!=='pending')return;
        const projectId=data.project.id,sessionId=session.id,requestId=request.id,expectedVersion=request.version,key=`research-action:${requestId}:${expectedVersion}:${decision}`;
        this.sending=true;this.setState({saving:true,error:''});
        try{await this.props.perform(async()=>{if(!this.matches(projectId,sessionId,requestId))return;try{
            await api('/operations/research_action_decide',{projectId,sessionId,input:{requestId,expectedVersion,decision}},'POST',undefined,key);
        }catch(error){if(!this.matches(projectId,sessionId,requestId))return;this.setState({error:error instanceof Error?error.message:String(error)});throw error;}});}
        finally{this.sending=false;if(this.matches(projectId,sessionId,requestId))this.setState({saving:false});}
    }
    private historyView(){
        const {data,session,request,perform}=this.props;if(request.input.kind!=='history'||request.state!=='pending'||request.reasons.includes('RESEARCH_ACTION_CORRUPTED'))return null;
        const kind=request.input.history.kind,scoped={...data,sessions:[session],textCorpusGrants:(data.textCorpusGrants??[]).filter(g=>g.sessionId===session.id)};
        const onDocument=(document:DocumentLocation)=>{if(this.mounted)this.setState({document});};
        if(kind==='documents'||this.state.document)return <LiteratureView readOnly allowDocumentSelection embedded onUseDocument={this.props.onUseDocument} data={scoped} session={session} perform={perform} selectedDocument={this.state.document} onDocument={onDocument}/>;
        if(kind==='reports')return <ReportsView readOnly embedded data={data} perform={perform} selectedReport={this.state.reportId||undefined} onSelect={reportId=>this.setState({reportId})} onDocument={onDocument} onSession={this.props.onSession} onCampaign={this.props.onCampaign} onRun={this.props.onRun}/>;
        return <EvidenceView readOnly embedded data={data} perform={perform} onDocument={onDocument} onRegister={()=>{}} onClaim={()=>{}}/>;
    }
    render(){const {data,session,request}=this.props;if(request.projectId!==data.project.id||request.sessionId!==session.id)return null;const input=request.input,pending=request.effectiveState==='pending',disabled=this.props.busy||this.state.saving||!!data.project.archived||session.state==='archived';
        const claim=input.kind==='claim_decision'?data.claims.find(c=>c.id===input.claim.claimId):undefined,reportRef=request.resultRef&&'reportId' in request.resultRef?request.resultRef.reportId:undefined,grantRef=request.resultRef&&'grantId' in request.resultRef?request.resultRef.grantId:undefined;
        return <details className="workflow-card research-action-card" open={request.state==='pending'}><summary>{titles[input.kind]}<Badge value={request.effectiveState}/></summary>
            <p className="small muted">当前会话：{session.title} · 有效期至 {date(request.expiresAt)}</p>
            {request.reasons.length?<p role="status" className="inline-warning">请求已失效：{request.reasons.join('；')}。原记录保留，确认操作不会执行。</p>:null}
            {input.kind==='text_grant'?<div><p>只授权下面的固定原文在本会话中检索 {input.textGrant.maxSearches} 次，截止 {date(input.textGrant.expiresAt)}。</p><ul>{input.textGrant.documents.map(d=><li key={d.documentVersionId+':'+d.parseResultId}>{data.documents?.find(row=>row.id===d.documentVersionId)?.title??short(d.documentVersionId)} · 固定解析 {short(d.parseResultId)}</li>)}{input.textGrant.pmcDocuments?.map(d=><li key={d.documentVersionId}>{data.documents?.find(row=>row.id===d.documentVersionId)?.title??short(d.documentVersionId)} · 固定全文</li>)}</ul><p className="small muted">不授权联网、原件下载、计算或科学结论；已有固定授权不会被覆盖。</p>{pending?<button type="button" className="primary compact" disabled={disabled} onClick={()=>void this.decide('confirm')}>确认并启用此原文范围</button>:null}{grantRef?<p>已保存固定授权 {short(grantRef)}；{data.textCorpusGrants?.find(g=>g.id===grantRef)?.effectiveState??'请刷新核对状态'}。</p>:null}</div>:null}
            {input.kind==='claim_decision'?<div>{claim?<><p>{claim.statement}</p><p className="small muted">限制：{claim.limitations.join('；')||'未填写'} · 固定结论版本 {input.claim.expectedVersion}</p><p>证据：{claim.evidenceIds.map(short).join('、')}</p></>:<p role="status">结论暂不可读，请刷新；不会替换成其他结论。</p>}{pending&&claim?<div className="actions wrap"><button type="button" className="primary compact" disabled={disabled} onClick={()=>void this.decide('accepted')}>采纳此结论</button><button type="button" className="secondary compact" disabled={disabled} onClick={()=>void this.decide('disputed')}>标为争议</button><button type="button" className="text-button danger" disabled={disabled} onClick={()=>void this.decide('rejected')}>拒绝此结论</button></div>:null}</div>:null}
            {input.kind==='report_compose'?<div><p><strong>{input.report.title}</strong></p><ul>{input.report.runIds.map(id=><li key={'run:'+id}>正式运行 {short(id)}</li>)}{input.report.claimIds.map(id=><li key={'claim:'+id}>已采纳结论 {data.claims.find(c=>c.id===id)?.statement??short(id)}</li>)}{input.report.publicationResultIds.map(id=><li key={'publication:'+id}>固定文稿构建 {short(id)}</li>)}{input.report.campaignIds?.map(id=><li key={'campaign:'+id}>固定研究活动 {short(id)}</li>)}</ul><p className="small muted">确认时重新核验这些固定来源，未通过的来源不会替换或补造。</p>{pending?<button type="button" className="primary compact" disabled={disabled} onClick={()=>void this.decide('confirm')}>确认并生成此固定报告</button>:null}{reportRef?<><button type="button" className="secondary compact" onClick={()=>this.setState({showReport:!this.state.showReport})}>{this.state.showReport?'收起报告':'查看或导出固定报告'}</button>{this.state.showReport?<ReportsView readOnly embedded data={data} perform={this.props.perform} selectedReport={reportRef} onSession={this.props.onSession} onCampaign={this.props.onCampaign} onRun={this.props.onRun}/>:null}</>:null}</div>:null}
            {input.kind==='history'?this.historyView():null}
            {request.state==='pending'?<button type="button" className="text-button" disabled={disabled} onClick={()=>void this.decide(input.kind==='claim_decision'||input.kind==='history'?'dismiss':'reject')}>{input.kind==='claim_decision'||input.kind==='history'?'关闭这张卡片':'拒绝此请求'}</button>:null}
            {this.state.error?<p role="alert" className="error-text">{this.state.error}</p>:null}
        </details>;
    }
}
