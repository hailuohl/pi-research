import * as React from 'react';
import {api} from './api.js';
import {Icon} from './ui.js';
import type {Perform} from './workbench.js';
import type {Approval,Row,Session} from './models.js';
import {automaticApprovalLabel} from './models.js';
interface Action {id:string;sessionId?:string;version:number;operation:string;input:Record<string,unknown>;state:string;createdAt:string;reason?:string;error?:string;before?:{path:string;content:string|null;digest:string|null}|null;approval:{id:string;version:number;status:string;reason?:string;automaticApproval?:Approval['automaticApproval'];automaticExecution?:Approval['automaticExecution']};}
const names:Record<string,string>={document_page_image_read:'允许固定原文页范围视觉读取',publication_page_image_read:'发送固定文稿页给模型',workspace_write:'编辑文件',workspace_prepare_from_revision:'准备会话工作区',workspace_history_set_mode:'修改文件权限',workspace_history_commit:'保存源码提交',literature_search:'联网检索',literature_discover:'联网发现文献',paper_read:'获取论文',artifact_create:'保存产物',evidence_register:'登记证据',text_evidence_search:'检索并登记文本证据',research_brief_save:'保存研究计划',experiment_plan_submit:'准备实验方案',development_prepare:'准备开发测试',development_submit:'提交开发测试',run_prepare:'准备实验运行',run_submit:'提交实验运行',collaboration_plan_submit:'准备协作计划',agent_delegate:'准备助手任务',manuscript_create:'保存文稿'};
const labels:Record<string,string>={pending:'等待确认',approved:'已批准，等待执行',rejected:'已拒绝',stale:'已失效',executing:'正在执行',running:'正在执行',completed:'已执行',succeeded:'已执行',failed:'执行失败',unknown:'效果待核对',consumed:'已使用本次批准'};
export class PermissionActions extends React.Component<{sessionId:string;projectId?:string;session?:Row<Session>;archived:boolean;readSuspended?:boolean;busy:boolean;perform:Perform;onPendingChange?:(approvalIds:string[])=>void},{actions:Action[];hasMore:boolean;saving:string;error:string}> {
    state={actions:[] as Action[],hasMore:false,saving:'',error:''};
    private alive=true;private request=0;private preparing=false;private timer?:ReturnType<typeof setInterval>;
    private readController?:AbortController;
    private readError='';
    componentDidMount(){void this.load();this.timer=setInterval(()=>{if(!this.state.saving&&!this.props.archived&&!this.props.readSuspended)void this.load();},1500);}
    componentDidUpdate(previous:Readonly<PermissionActions['props']>){if(previous.sessionId!==this.props.sessionId||previous.archived!==this.props.archived||previous.readSuspended!==this.props.readSuspended){this.invalidateRead();if(previous.sessionId!==this.props.sessionId){this.readError='';this.setState({error:''});}void this.load();}}
    private invalidateRead(){this.request++;this.readController?.abort();this.readController=undefined;}
    componentWillUnmount(){this.alive=false;this.invalidateRead();clearInterval(this.timer);}
    private async load(){
        if(!this.alive||this.props.readSuspended||this.readController)return;
        const request=++this.request,controller=new AbortController();this.readController=controller;
        try{const result=await api<{actions:Action[];hasMoreActions?:boolean}>(`/sessions/${encodeURIComponent(this.props.sessionId)}/permissions`,undefined,'GET',controller.signal);if(this.alive&&!controller.signal.aborted&&request===this.request){const actions=result.actions??[],priorError=this.readError;this.readError='';this.setState(current=>({actions,hasMore:!!result.hasMoreActions,error:current.error===priorError?'':current.error}));this.props.onPendingChange?.(actions.filter(action=>!action.approval.automaticApproval&&action.state==='pending'&&action.approval.status==='pending').map(action=>action.approval.id));}}
        catch(error){if(this.alive&&!controller.signal.aborted&&request===this.request){this.readError=error instanceof Error?error.message:String(error);this.setState({error:this.readError});}}
        finally{if(this.readController===controller)this.readController=undefined;}
    }
    private async decide(action:Action,approved:boolean){if(this.state.saving||this.props.busy||this.props.archived)return;this.invalidateRead();this.setState({saving:action.id,error:''});await this.props.perform(async()=>{try{await api(`/sessions/${encodeURIComponent(this.props.sessionId)}/permission-actions/${encodeURIComponent(action.id)}/decide`,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved});}catch(error){if(this.alive)this.setState({error:error instanceof Error?error.message:String(error)});throw error;}finally{if(this.alive){this.setState({saving:''});await this.load();}}},approved?'已批准本次操作':'已拒绝本次操作');}
    private fixedWorkspaceSource(action:Action){
        const {session,sessionId,projectId}=this.props,{experimentId,revision}=action.input;
        if(action.approval.automaticApproval||!projectId||!session||session.id!==sessionId||session.projectId!==projectId||session.role!=='coordinator'||session.taskId||session.teamId||session.parentSessionId||action.sessionId!==sessionId||action.state!=='failed'||action.operation!=='workspace_prepare_from_revision'||['rejected','stale'].includes(action.approval.status))return null;
        return Object.keys(action.input).length===2&&typeof experimentId==='string'&&experimentId.length>0&&experimentId.length<=100&&experimentId.trim()===experimentId&&typeof revision==='number'&&Number.isSafeInteger(revision)&&revision>=1?{experimentId,revision}:null;
    }
    private workspacePreparationDisabled(){return this.props.archived||this.props.busy||!!this.state.saving||this.preparing||['running','queued','archived'].includes(this.props.session?.state??'')||!!this.props.session?.sourceRevisionId;}
    private async prepareWorkspace(action:Action){
        const input=this.fixedWorkspaceSource(action);if(!this.alive||!input||this.workspacePreparationDisabled())return;
        const {projectId,sessionId}=this.props;this.preparing=true;this.invalidateRead();this.setState({saving:action.id,error:''});
        try{await this.props.perform(async()=>{try{await api('/operations/workspace_prepare_from_revision',{projectId,sessionId,input},'POST',undefined,`owner-workspace-prepare:${action.id}`);}catch(error){if(this.alive)this.setState({error:error instanceof Error?error.message:String(error)});throw error;}finally{if(this.alive)await this.load();}},'固定版本工作区已准备');}
        finally{this.preparing=false;if(this.alive)this.setState({saving:''});}
    }
    private card(action:Action){const status=['rejected','stale'].includes(action.approval.status)?action.approval.status:action.state==='pending'?action.approval.status:action.state,pending=status==='pending'&&!action.approval.automaticApproval,path=typeof action.input.path==='string'?action.input.path:null,source=this.fixedWorkspaceSource(action);return <article className="workflow-card permission-action" key={action.id}>
        <div className="permission-action-heading"><Icon name={path?'edit':'settings'} size={16}/><strong>{names[action.operation]??'确认研究操作'}</strong><span className="permission-action-status">{automaticApprovalLabel(action.approval)??labels[status]??status}</span></div>
        <p className="small">{path?<><code>{path}</code> · 仅当前会话工作区</>:(['publication_page_image_read','document_page_image_read'].includes(action.operation)?action.approval.reason:action.reason)??'只允许下面固定的一次操作；现有来源和专门审批仍需有效。'}</p>
        <details open={pending&&!!path}><summary>{path?'查看固定文件变更':'查看准确操作内容'}</summary>{path?<div className="permission-action-diff"><section><h4>变更前</h4><pre className="file-preview">{action.before? action.before.content??'（文件不存在）':'（旧正文不可用，请核对目标摘要）'}</pre><p className="small muted">目标摘要：{String(action.input.expectedDigest??'文件不存在')}</p></section><section><h4>变更后</h4><pre className="file-preview">{typeof action.input.content==='string'?action.input.content:JSON.stringify(action.input,null,2)}</pre></section></div>:<pre className="file-preview">{JSON.stringify({operation:action.operation,input:action.input},null,2)}</pre>}{source?<div><p className="small">当前主会话：<code>{this.props.sessionId}</code> · 固定实验：<code>{source.experimentId}</code> · 修订 {source.revision}。原失败记录保留；点击将以你的身份准备此固定来源。</p><button type="button" className="secondary compact" disabled={this.workspacePreparationDisabled()} onClick={()=>{void this.prepareWorkspace(action);}}>准备这一固定版本的工作区</button></div>:null}</details>
        {pending?<div className="actions wrap"><button type="button" className="primary compact" disabled={this.props.archived||this.props.busy||!!this.state.saving} onClick={()=>{void this.decide(action,true);}}>允许本次</button><button type="button" className="secondary compact" disabled={this.props.archived||this.props.busy||!!this.state.saving} onClick={()=>{void this.decide(action,false);}}>拒绝</button></div>:null}
        {status==='stale'?<p className="small muted">权限、来源或目标版本已变化，需要重新准备操作。</p>:null}
        {action.error?<p className="small error-text">{action.error}</p>:null}
    </article>;}
    render(){const current=this.state.actions.filter(a=>a.approval.status!=='rejected'&&a.approval.status!=='stale'&&['pending','approved','executing','running'].includes(a.state)),history=this.state.actions.filter(a=>!current.includes(a));if(!current.length&&!history.length)return null;return <section className="permission-actions" aria-label="会话操作审批">{current.map(a=>this.card(a))}{history.length?<details className="workflow-history"><summary>操作审批历史（{history.length}）</summary>{history.map(a=>this.card(a))}</details>:null}{this.state.hasMore?<p className="small muted">这里显示最近 20 条操作，较早的审批记录仍保留。</p>:null}{this.state.error?<p className="error-text" role="status">{this.state.error}</p>:null}</section>;}
}
