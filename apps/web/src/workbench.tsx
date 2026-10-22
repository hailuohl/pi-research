import * as React from 'react';
import {createPortal} from 'react-dom';
import {HostAccessControl} from './host-access-control.js';
import {PermissionActions} from './permission-actions.js';
import {LogView,type LogPage} from './log-view.js';
import {ConversationActivity} from './session-history.js';
import {ScrollHistory} from './scroll-history.js';
import {MessageQueue,type QueueMessage} from './message-queue.js';
import {ComputeWait} from './compute-wait.js';
import { WakeupPanel } from './campaigns.js';
import {ChatWorkflows,proposalSession} from './chat-workflows.js';
import {ResearchActionCards} from './research-action-cards.js';
import {ComposerControls} from './composer-controls.js';
import { api, artifactText, downloadArtifact } from './api.js';
import type { Bootstrap, MessageAttachment, ModelConfig, ProjectState, Row, Session, Message, Experiment, Run, SessionHistoryPage,SessionView } from './models.js';
import { short, number, date, label } from './models.js';
import {Icon, Badge, Modal, nativeSelectButton} from './ui.js';
export type Perform = (fn: () => Promise<any>, success?: string) => Promise<any>;
type RenameTarget={projectId:string;sessionId:string;version:number;originalTitle:string;epoch:number};
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
    activity?:SessionView['progress']['activity'];
    busy:boolean;
    readCurrent?:boolean;
    validationPerform?:Perform;
    perform: Perform;
    onModelConfirmed?:(session:Row<Session>)=>void;
    onBranchConfirmed?:(session:Row<Session>)=>void;
    onMessageConfirmed?:(message:Row<Message>)=>void;
    onToggle: () => void;
    onNew: () => void;
    onExperiments: () => void;
    onWorkspace: () => void;
    archivedHistory?:React.ReactNode;
    onArchivedHistoryClose?:()=>void;
    onRegister?:(id:string,content:string)=>void;
    onClaim?:()=>void;
    onUseDocument?:(target:{documentVersionId:string;parseResultId:string})=>void;
    onSources?:()=>void;
    onCampaign?:(id:string)=>void;
    onSession: (id:string) => void;
    onExperiment: (id:string) => void;
    onRun: (runId:string,experimentId:string) => void;
}, {draft:string;draftVersion:number;attachments:MessageAttachment[];sending:boolean;drawerOpen:boolean;permissionPending:string[];sentMessageId:string;renameTarget:RenameTarget|null;renameTitle:string;renameError:string;renameSaving:boolean}> {
    state={draft:'',draftVersion:0,attachments:[] as MessageAttachment[],sending:false,drawerOpen:false,permissionPending:[] as string[],sentMessageId:'',renameTarget:null as RenameTarget|null,renameTitle:'',renameError:'',renameSaving:false};
    private drawerClose=React.createRef<HTMLButtonElement>();
    private drawerContent=React.createRef<HTMLDivElement>();
    private drawerTrigger:HTMLButtonElement|null=null;
    private openDrawer=(trigger:HTMLButtonElement,history=false,archive=false)=>{
        this.drawerTrigger=trigger;
        this.setState({drawerOpen:true},()=>{
            if(!this.mounted)return;
            const content=this.drawerContent.current,details=history?content?.querySelector<HTMLDetailsElement>('details.workflow-history,details.notification-history'):null;
            if(details)details.open=true;
            const target=archive?content?.querySelector<HTMLElement>('[aria-label="归档项目历史"]'):history?(details?.querySelector<HTMLElement>('summary')??content?.querySelector<HTMLElement>('.chat-drawer-history-note')):this.drawerClose.current;
            target?.focus({preventScroll:true});
            if((history||archive)&&content&&target)content.scrollTop+=target.getBoundingClientRect().top-content.getBoundingClientRect().top;
        });
    };
    openArchivedHistory=(trigger:HTMLButtonElement)=>{if(this.mounted&&this.props.archivedHistory)this.openDrawer(trigger,false,true);};
    closeDrawer=()=>this.setState({drawerOpen:false},()=>{if(!this.mounted)return;if(this.props.archivedHistory)this.props.onArchivedHistoryClose?.();this.drawerTrigger?.focus({preventScroll:true});});
    private permissionPending=(ids:string[])=>{
        if(this.mounted&&(ids.length!==this.state.permissionPending.length||ids.some((id,index)=>id!==this.state.permissionPending[index])))this.setState({permissionPending:ids});
    };
    private mounted=true;
    private sending=false;
    private composerControls=React.createRef<ComposerControls>();
    private modelSave?:Promise<Row<Session>|undefined>;
    private pendingSend?:{projectId:string;sessionId:string;draft:string;draftVersion:number;attachments:MessageAttachment[];body:{content:string;mode:Message['mode'];attachmentDocumentIds?:string[]};key:string;clearUploadError?:()=>void};
    private renaming=false;
    private renameEpoch=0;
    private renameInput=React.createRef<HTMLInputElement>();
    private renameRequest?:{target:RenameTarget;title:string;sent:boolean;confirmed?:Row<Session>;finished:boolean};
    componentWillUnmount(){this.mounted=false;this.renameEpoch++;}
    componentDidUpdate(previous:Readonly<Chat['props']>){
        if(previous.data.project.id!==this.props.data.project.id||previous.session?.id!==this.props.session?.id||previous.session?.version!==this.props.session?.version||previous.session?.title!==this.props.session?.title||previous.data.project.archived!==this.props.data.project.archived){
            const request=this.renameRequest;
            // A refresh can see this rename before its HTTP receipt; verify that exact version on arrival.
            const ownRename=request?.sent&&this.renameActive(request.target)&&this.props.session?.title===request.title&&this.props.session.version>request.target.version&&(!request.confirmed||this.props.session.version===request.confirmed.version);
            if(!ownRename){
                this.renameEpoch++;this.renaming=false;
                if(this.state.renameTarget)this.setState({renameSaving:false,renameError:'会话或项目已变化，请关闭后重新打开改名窗口。'});
            }
        }
        this.finishRename();
    }
    private renameActive=(target:RenameTarget)=>this.mounted&&this.state.renameTarget===target&&this.renameEpoch===target.epoch&&this.props.data.project.id===target.projectId&&this.props.session?.id===target.sessionId&&!this.props.data.project.archived;
    private renameCurrent=(target:RenameTarget)=>this.renameActive(target)&&this.props.session?.version===target.version&&this.props.session.title===target.originalTitle;
    private finishRename=()=>{
        const request=this.renameRequest;
        if(!request?.finished||!request.confirmed||!this.renameActive(request.target)||this.props.busy)return;
        if(!this.renameCurrent(request.target)&&(this.props.session?.version!==request.confirmed.version||this.props.session.title!==request.confirmed.title))return;
        // Close after perform releases busy so Modal can return focus to the enabled opener.
        this.renameEpoch++;this.renaming=false;this.renameRequest=undefined;
        this.setState({renameTarget:null,renameSaving:false,renameError:''});
    };
    private closeRename=()=>{
        if(!this.mounted||this.renaming||this.state.renameSaving)return;
        this.renameEpoch++;this.setState({renameTarget:null,renameError:''});
    };
    private renameSession=()=>{
        const {session,data}=this.props;
        if(!this.mounted||!session||session.projectId!==data.project.id||this.state.renameTarget||this.renaming||this.props.busy||data.project.archived)return;
        const target={projectId:data.project.id,sessionId:session.id,version:session.version,originalTitle:session.title,epoch:++this.renameEpoch};
        this.setState({renameTarget:target,renameTitle:session.title,renameError:'',renameSaving:false},()=>{if(this.renameCurrent(target))this.renameInput.current?.focus();});
    };
    private submitRename=async(target:RenameTarget)=>{
        if(!this.renameCurrent(target)||this.renaming||this.props.busy)return;
        const title=this.state.renameTitle.trim();
        if(!title||title.length>160){this.setState({renameError:'会话名称不能为空，且不能超过 160 个字符。'});return;}
        const request:{target:RenameTarget;title:string;sent:boolean;confirmed?:Row<Session>;finished:boolean}={target,title,sent:false,finished:false};this.renameRequest=request;
        this.renaming=true;this.setState({renameSaving:true,renameError:''});
        try{
            return await this.props.perform(async()=>{
                if(!this.renameCurrent(target))return;
                try{
                    request.sent=true;
                    const confirmed=await api<Row<Session>>(`/sessions/${encodeURIComponent(target.sessionId)}`,{title,expectedVersion:target.version});
                    if(!this.renameActive(target))return;
                    if(confirmed.id!==target.sessionId||confirmed.projectId!==target.projectId||confirmed.title!==title||!Number.isSafeInteger(confirmed.version)||confirmed.version<=target.version||!confirmed.model||typeof confirmed.model.provider!=='string'||typeof confirmed.model.model!=='string'||typeof confirmed.model.thinking!=='string')throw Error('改名回执与当前会话不一致，请刷新后重试');
                    if(!this.renameCurrent(target)&&(this.props.session?.version!==confirmed.version||this.props.session.title!==confirmed.title)){
                        this.renameEpoch++;this.renaming=false;this.setState({renameSaving:false,renameError:'会话或项目已变化，请关闭后重新打开改名窗口。'});return;
                    }
                    request.confirmed=confirmed;
                    this.props.onModelConfirmed?.(confirmed);return confirmed;
                }catch(error){if(this.renameActive(target)){this.setState({renameError:error instanceof Error?error.message:String(error)});throw error;}}
            });
        }catch(error){if(this.renameActive(target))this.setState({renameError:error instanceof Error?error.message:String(error)});}
        finally{
            request.finished=true;
            if(request.confirmed&&this.renameActive(target))this.finishRename();
            else{if(this.renameRequest===request)this.renameRequest=undefined;if(this.renameActive(target)){this.renaming=false;this.setState({renameSaving:false});}}
        }
    };
    private changeModel=(model:ModelConfig)=>{
        const {session,data}=this.props;
        if(!session||!this.mounted)return Promise.resolve(undefined);
        const saving=(async()=>{
            const confirmed=await api<Row<Session>>(`/sessions/${session.id}/model`,{expectedVersion:session.version,model});
            if(!this.mounted||this.props.session?.id!==session.id||this.props.data.project.id!==data.project.id||confirmed.id!==session.id||confirmed.projectId!==data.project.id||confirmed.model.provider!==model.provider||confirmed.model.model!==model.model||confirmed.model.thinking!==model.thinking)return;
            this.props.onModelConfirmed?.(confirmed);
            return confirmed;
        })();
        this.modelSave=saving;
        const clear=()=>{if(this.modelSave===saving)this.modelSave=undefined;};
        void saving.then(clear,clear);
        return saving;
    };
    private canSend=()=>{
        const {data,boot,session,busy,historyAnchor,history}=this.props;
        const runtimeAvailable=boot.runtime.ready||boot.runtime.code==='MODEL_NOT_CONFIGURED';
        const modelAvailable=!!session?.model.provider&&!!session.model.model&&(!boot.models||boot.models.some(model=>model.provider===session.model.provider&&model.model===session.model.model&&model.thinking===session.model.thinking));
        return this.mounted&&!this.sending&&runtimeAvailable&&modelAvailable&&!busy&&!data.project.archived&&!!session&&session.projectId===data.project.id&&!session.taskId&&session.state!=='archived'&&!historyAnchor&&(!history||history.atLatest);
    };
    private submit=async(event:{preventDefault:()=>void})=>{
        event.preventDefault();
        const {session,data}=this.props;
        if(!session||!this.canSend()||!this.state.draft.trim()&&!this.state.attachments.length)return;
        const {draft,draftVersion}=this.state,attachments=this.state.attachments.slice(),previous=this.pendingSend;
        const unchanged=previous?.projectId===data.project.id&&previous.sessionId===session.id&&previous.draftVersion===draftVersion&&previous.draft===draft&&JSON.stringify(previous.attachments)===JSON.stringify(attachments);
        const mode:Message['mode']=session.state==='running'?'follow_up':'prompt';
        const request=unchanged?previous!:{projectId:data.project.id,sessionId:session.id,draft,draftVersion,attachments,body:{content:draft.trim()?draft:'请查看附件。',mode,...(attachments.length?{attachmentDocumentIds:attachments.map(attachment=>attachment.documentVersionId)}:{})},key:crypto.randomUUID(),clearUploadError:this.composerControls.current?.captureUploadError()};
        const modelSave=this.modelSave;
        const current=()=>this.mounted&&this.props.data.project.id===request.projectId&&this.props.session?.id===request.sessionId;
        this.pendingSend=request;this.sending=true;this.setState({sending:true});
        try{
            return await this.props.perform(async()=>{
                if(modelSave){
                    let model:Row<Session>|undefined;
                    try{model=await modelSave;}catch(error){if(!current())return;throw error;}
                    if(!current())return;
                    if(!model)throw Error('当前模型选择未保存；消息草稿与附件已保留。');
                }
                if(!current()||this.props.data.project.archived||this.props.session?.state==='archived'||this.props.session?.taskId||this.props.historyAnchor||this.props.history&&!this.props.history.atLatest)return;
                let confirmed:Row<Message>;
                try{
                    confirmed=await api<Row<Message>>(`/sessions/${session.id}/messages`,request.body,'POST',undefined,request.key);
                    if(confirmed.projectId!==request.projectId||confirmed.sessionId!==request.sessionId||confirmed.role!=='user'||typeof confirmed.id!=='string'||confirmed.content!==request.body.content||confirmed.mode!==request.body.mode||!Number.isSafeInteger(confirmed.version)||confirmed.version<1||!['queued','running','completed','failed','cancelled'].includes(confirmed.status))throw Error('发送回执与当前会话不一致；草稿与附件已保留。');
                }catch(error){if(!current())return;throw error;}
                if(this.pendingSend===request)this.pendingSend=undefined;
                if(!this.mounted||this.props.data.project.id!==request.projectId||this.props.session?.id!==request.sessionId)return confirmed;
                this.props.onMessageConfirmed?.(confirmed);
                request.clearUploadError?.();
                const sent=new Set(request.attachments.map(attachment=>attachment.documentVersionId));
                this.setState(current=>({draft:current.draftVersion===request.draftVersion&&current.draft===request.draft?'':current.draft,attachments:current.attachments.filter(attachment=>!sent.has(attachment.documentVersionId)),sentMessageId:confirmed.id}));
                return confirmed;
            });
        }finally{this.sending=false;if(this.mounted)this.setState({sending:false});}
    };
    render() {
        const { data, boot, session, messages } = this.props;
        const runtimeAvailable=boot.runtime.ready||boot.runtime.code==='MODEL_NOT_CONFIGURED';
        const sessionModelAvailable=!!session?.model.provider&&!!session.model.model&&(!boot.models||boot.models.some(model=>model.provider===session.model.provider&&model.model===session.model.model&&model.thinking===session.model.thinking));
        const sessionFailure=session?.state==='failed'?session.lastError:undefined;
        const canSend = this.canSend();
        const hasDraft=!!this.state.draft.trim()||this.state.attachments.length>0;
        const latest=!this.props.historyAnchor&&(!this.props.history||this.props.history.atLatest),pending=new Set(latest?this.state.permissionPending:[]);
        if(latest&&session?.role==='coordinator'&&!session.taskId){
            const campaigns=(data.campaigns??[]).filter(row=>row.rootSessionId===session.id),campaignIds=new Set(campaigns.map(row=>row.id)),
                campaignIntents=new Set([...(data.members??[]).filter(row=>campaignIds.has(row.campaignId)).map(row=>row.intentId),...(data.researchCandidates??[]).filter(row=>campaignIds.has(row.campaignId)).map(row=>row.intentId)]),
                grant=(data.workingGrants??[]).find(row=>row.id===session.workingGrantId);
            const approvalIds=new Set([
                ...campaigns.filter(row=>row.state==='draft').map(row=>row.approvalId),
                ...(data.decisions??[]).filter(row=>campaignIds.has(row.campaignId)&&row.status==='proposed').map(row=>row.approvalId),
                ...(data.intents??[]).filter(row=>(row.rootSessionId===session.id||row.rootSessionId==null&&campaignIntents.has(row.id))&&row.status==='prepared'&&!row.runId&&!row.runGrant&&!data.approvals.find(approval=>approval.id===row.approvalId)?.runGrant).map(row=>row.approvalId),
                ...(data.developmentTasks??[]).filter(row=>row.sessionId===session.id&&!row.jobId&&Date.parse(row.manifest?.deadline??'')>Date.now()&&(!session.workingGrantId||row.manifest.workingGrant?.id===session.workingGrantId&&grant?.effectiveState==='active'&&grant.validity==='current'&&Date.parse(grant.expiresAt)>Date.now())).map(row=>row.grantId),
                ...(data.reviews??[]).filter(row=>row.producerSessionId===session.id&&data.project.settings.enabled&&data.teams.some(team=>team.id===row.teamId&&team.state==='awaiting_approval'&&team.delegationEnabled)).map(row=>row.approvalId),
                ...(data.changeProposals??[]).filter(row=>proposalSession(data,row)===session.id&&row.state==='prepared'&&row.sourceValidity!=='stale').map(row=>row.approvalId),
            ]);
            for(const approval of data.approvals??[])if(approval.status==='pending'&&approvalIds.has(approval.id))pending.add(approval.id);
            for(const request of data.researchActions??[])if(request.projectId===data.project.id&&request.sessionId===session.id&&request.state==='pending')pending.add('research:'+request.id);
        }
        return <div className="chat-page" onKeyDown={event=>{if(event.key==='Escape'&&this.state.drawerOpen&&!event.defaultPrevented&&!(event.target as HTMLElement).closest('[role="dialog"]')){event.preventDefault();this.closeDrawer();}}}><div className="chat-heading"><div><h1>{session?.title ?? '研究会话'}</h1><span className="muted">{session ? `${session.model.provider || '未配置供应商'} / ${session.model.model || '未配置模型'}` : '每个主会话都有独立历史和工作区'}</span></div>{session ? <div className="actions chat-heading-actions"><Badge value={session.state} caption={session.state==='queued'?'正在处理':undefined}/><button type="button" className="secondary compact chat-task-trigger" aria-expanded={this.state.drawerOpen} aria-controls="chat-task-drawer" onClick={event=>this.state.drawerOpen?this.closeDrawer():this.openDrawer(event.currentTarget)}><Icon name="settings" size={15}/>任务与审批{pending.size?<span className="chat-pending-count">已知待确认 {pending.size}</span>:null}</button><button type="button" className="secondary compact" aria-expanded={this.state.drawerOpen} aria-controls="chat-task-drawer" onClick={event=>this.openDrawer(event.currentTarget,true)}><Icon name="report" size={15}/>历史</button><button className="icon-button" disabled={this.props.busy||data.project.archived} title="重命名会话" aria-label="重命名会话" onClick={this.renameSession}><Icon name="edit"/></button></div> : null}</div>
 {!runtimeAvailable ? <div className="notice runtime-notice"><span className="status-dot amber"/><div><strong>Pi 尚未就绪</strong><p>{boot.runtime.message} 项目、快照、真实数值实验和证据管理仍可使用。</p></div></div> : runtimeAvailable&&session&&!sessionModelAvailable?<p className="notice runtime-notice">当前会话模型不可用，请选择已启用配置或新建会话。</p>:null}
 {session?.state==='failed'?<div className="notice runtime-notice" role="alert"><div><strong>会话已失败</strong><p>{sessionFailure?.includes('SKILL_REVOKED')?'此会话绑定的技能版本已撤销，无法启动。请创建新会话；已有消息与历史保留。':'此会话已失败。已有消息与历史保留。'}</p>{sessionFailure?<details><summary>查看失败原因</summary><p className="small error-text code-wrap">{sessionFailure}</p></details>:null}</div></div>:null}
 {session?.taskId?<p className="notice runtime-notice">这是团队任务会话。请通过团队任务控件发送指令或管理任务。</p>:session?.state==='archived'?<p className="notice runtime-notice">此会话已归档，不能发送消息。</p>:null}
 <div className={'chat-work-region'+(this.state.drawerOpen?' is-drawer-open':'')}>
 <div className="conversation" aria-live="polite">{messages.length === 0 && latest ? <div className="welcome"><div className="welcome-mark">π</div><h2>今天想研究什么？</h2><div className="welcome-actions"><button onClick={this.props.onExperiments}><Icon name="experiment"/><span>查看实验</span><Icon name="arrow"/></button><button onClick={this.props.onWorkspace}><Icon name="folder"/><span>查看项目文件</span><Icon name="arrow"/></button></div></div> : <ScrollHistory projectId={data.project.id} sessionId={session?.id??''} messages={messages} history={this.props.history} historyAnchor={this.props.historyAnchor} onNavigate={this.props.onHistory} perform={this.props.perform} activeGeneration={session?.state==='running'?session.generation:undefined} liveKey={this.props.stream} confirmedMessageId={this.state.sentMessageId} readOnly={!!data.project.archived||!session} sessionArchived={session?.state==='archived'} busy={this.props.busy} onBranch={this.props.onBranchConfirmed}/>} {latest?<ConversationActivity content={this.props.stream} active={session?.state==='running'} activity={this.props.activity} truncated={this.props.streamTruncated}/>:null}</div>
 <aside id="chat-task-drawer" className="chat-task-drawer" hidden={!this.state.drawerOpen} aria-labelledby="chat-task-drawer-title"><header><h2 id="chat-task-drawer-title">任务与审批</h2><button type="button" ref={this.drawerClose} className="icon-button" aria-label="关闭任务与审批" onClick={this.closeDrawer}><Icon name="close"/></button></header><div className="chat-task-drawer-content" ref={this.drawerContent}>
 <p className="small muted">本会话的任务、审批与结果通知。操作仍按原有固定范围确认。</p>
 {session&&latest?<PermissionActions key={session.id} sessionId={session.id} projectId={data.project.id} session={session} archived={data.project.archived||session.state==='archived'} busy={this.props.busy} perform={this.props.perform} onPendingChange={this.permissionPending}/>:null}
 {session&&latest?<ChatWorkflows data={data} session={session} busy={this.props.busy} readCurrent={this.props.readCurrent} validationPerform={this.props.validationPerform} perform={this.props.perform} onSession={this.props.onSession} onExperiment={this.props.onExperiment} onRun={this.props.onRun}/>:null}
 {session?<ResearchActionCards data={data} session={session} busy={this.props.busy} perform={this.props.perform} onSession={this.props.onSession} onRun={this.props.onRun} onCampaign={this.props.onCampaign} onRegister={this.props.onRegister} onClaim={this.props.onClaim} onUseDocument={this.props.onUseDocument} onSources={this.props.onSources}/>:null}
 {latest?<WakeupPanel data={data} busy={this.props.busy} sessionId={session?.id} perform={this.props.perform} onSession={this.props.onSession}/>:null}
 <p className="small muted chat-drawer-history-note" tabIndex={-1}>历史记录保留在操作审批历史、结果通知和已完成事项中；可展开已有记录。</p>{!latest?<p className="small muted">正在查看消息历史，返回最新消息后显示当前任务与审批。</p>:null}{this.props.archivedHistory}
 </div></aside></div>
 <div className="composer-wrap"><div className="composer-stack">{session?.role==='coordinator'?<MessageQueue key={data.project.id+':'+session.id} projectId={data.project.id} sessionId={session.id} messages={this.props.pendingMessages} total={this.props.pendingTotal} nextCursor={this.props.pendingNextCursor} canSteer={this.props.canSteer} disabled={data.project.archived||!!session.taskId||session.state==='archived'||!!this.props.historyAnchor||!!this.props.history&&!this.props.history.atLatest} busy={this.props.busy} perform={this.props.perform}/>:null}<form className="composer" onSubmit={this.submit}><textarea aria-label="研究问题" placeholder={data.project.archived ? '已归档项目，只读查看历史' : session?.taskId ? '请通过团队任务控件操作' : session?.state==='archived' ? '已归档会话不可发送' : this.props.historyAnchor||this.props.history&&!this.props.history.atLatest ? '返回最新消息后可发送' : !runtimeAvailable ? 'Pi 尚未就绪，请查看上方说明…' : !session ? '选择或新建会话后开始研究…' : !sessionModelAvailable ? '配置 Pi 供应商和模型后，在这里开始研究…' : '描述研究问题…'} value={this.state.draft} disabled={data.project.archived||!!session?.taskId||session?.state==='archived'} onChange={(e: any) => this.setState(current=>({ draft: e.target.value, draftVersion: current.draftVersion+1 }))} onKeyDown={(e: any) => {
                if(e.key!=='Enter'||e.shiftKey||e.isComposing||e.nativeEvent?.isComposing||e.keyCode===229||e.nativeEvent?.keyCode===229)return;
                e.preventDefault();e.currentTarget.form.requestSubmit();
            }}/><ComposerControls ref={this.composerControls} permissionControl={boot.runtime.hostAccess?.available&&session&&!session.taskId?<HostAccessControl key={session.id} sessionId={session.id} archived={data.project.archived||session.state==='archived'} busy={this.props.busy} perform={this.props.perform}/>:null} key={`${data.project.id}:${session?.id??''}`} boot={boot} projectId={data.project.id} projectArchived={!!data.project.archived} modelLocked={!!session?.workingGrantId||!!session?.textCorpusGrantId||!!session?.discoveryGrantId||!!session?.runGrantId||!!data.teams?.some(team=>team.rootSessionId===session?.id&&!['completed','partial','failed','cancelled'].includes(team.state))} session={session} busy={this.props.busy} perform={this.props.perform} attachments={this.state.attachments} onAddAttachment={attachment=>this.setState(current=>({attachments:[...current.attachments,attachment]}))} onRemoveAttachment={documentVersionId=>this.setState(current=>({attachments:current.attachments.filter(attachment=>attachment.documentVersionId!==documentVersionId)}))} canSend={canSend} hasDraft={hasDraft} onSendModel={model=>session&&this.props.session?.id===session.id&&this.props.data.project.id===data.project.id?this.changeModel(model):Promise.resolve(undefined)}><div className="chat-collaboration-control"><button type="button" role="switch" aria-label="多智能体模式" aria-checked={data.project.settings.enabled ? 'true' : 'false'} title="项目级设置，同项目所有研究会话共享" className={'switch ' + (data.project.settings.enabled ? 'on' : '')} disabled={this.props.busy || data.project.archived || !session || !!session.taskId || session.state === 'archived'} onClick={this.props.onToggle}><span/></button><span>多智能体</span></div></ComposerControls></form></div><div className="composer-caption composer-caption-note"><span aria-hidden="true"/><span>Enter 发送<span className="host-extra-key"> · Shift + Enter 换行 · Ctrl/⌘ + Enter 发送</span></span></div></div>{this.renderRename()}</div>;
    }
    private renderRename(){
        const {renameTarget:target,renameTitle,renameError,renameSaving}=this.state;
        if(!target)return null;
        const dialog=<div onSubmit={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><Modal title="重命名会话" submitLabel="保存名称" busy={renameSaving} closeDisabled={renameSaving} submitDisabled={!this.renameCurrent(target)||this.props.busy||!renameTitle.trim()||renameTitle.trim().length>160} onClose={this.closeRename} onSubmit={()=>this.submitRename(target)}><label>会话名称<input ref={this.renameInput} name="title" required maxLength={160} value={renameTitle} disabled={renameSaving} onChange={event=>{if(this.renameCurrent(target)&&!this.renaming)this.setState({renameTitle:event.target.value,renameError:''});}}/></label>{renameError?<p role="alert" className="error-text">{renameError}</p>:null}</Modal></div>;
        return typeof document!=='undefined'?createPortal(dialog,document.body):dialog;
    }
}
type OutcomeReviewTarget={id:string;version:number;projectId:Row<Run>['projectId'];experimentId:string;state:Run['state'];disposition:'answered'|'unanswered';epoch:number};
interface OutcomeReviewState {target:OutcomeReviewTarget|null;reason:string;error:string;saving:boolean;}
export class OutcomeReview extends React.Component<{run:Row<Run>;perform:Perform;readOnly?:boolean},OutcomeReviewState> {
    state:OutcomeReviewState={target:null,reason:'',error:'',saving:false};
    private pending:OutcomeReviewTarget|null=null;
    private disposed=false;
    private epoch=0;
    private disposition=(run:Row<Run>)=>run.metrics&&Object.keys(run.metrics).length?'answered':run.answerDisposition??(run.state==='cancelled'&&!run.startedAt?'unanswered':'needs_review');
    private eligible=()=>['succeeded','failed','cancelled'].includes(this.props.run.state)&&this.disposition(this.props.run)==='needs_review';
    private active=(target:OutcomeReviewTarget)=>!this.disposed&&this.state.target===target&&this.epoch===target.epoch;
    private current=(target:OutcomeReviewTarget)=>this.active(target)&&!this.props.readOnly&&this.eligible()&&target.id===this.props.run.id&&target.version===this.props.run.version&&target.projectId===this.props.run.projectId&&target.experimentId===this.props.run.experimentId&&target.state===this.props.run.state;
    componentWillUnmount(){this.disposed=true;this.epoch++;this.pending=null;}
    componentDidUpdate(previous:Readonly<OutcomeReview['props']>){
        const run=this.props.run,old=previous.run;
        if(old.id!==run.id||old.version!==run.version||old.projectId!==run.projectId||old.experimentId!==run.experimentId||old.state!==run.state||this.disposition(old)!==this.disposition(run)||previous.readOnly!==this.props.readOnly){
            this.epoch++;this.pending=null;
            if(this.state.target)this.setState({saving:false,error:'运行记录或项目状态已变化，请关闭弹窗后重新核对。'});else this.setState({saving:false});
        }
    }
    open(disposition:'answered'|'unanswered',run=this.props.run,epoch=this.epoch){
        if(run!==this.props.run||epoch!==this.epoch||this.disposed||this.props.readOnly||this.state.target||this.pending||!this.eligible())return;
        const {id,version,projectId,experimentId,state}=this.props.run;this.setState({target:{id,version,projectId,experimentId,state,disposition,epoch:++this.epoch},reason:'',error:'',saving:false});
    }
    close(target=this.state.target){if(!this.disposed&&target===this.state.target&&this.pending!==target){this.epoch++;this.setState({target:null,reason:'',error:'',saving:false});}}
    async save(target=this.state.target){
        if(!target||this.disposed||target!==this.state.target||this.pending)return;
        if(!this.current(target)){this.setState({error:'运行记录或项目状态已变化，请关闭弹窗后重新核对。'});return;}
        const reason=this.state.reason.trim();
        if(!reason||reason.length>4000){this.setState({error:'评议理由不能为空，且不能超过 4000 个字符。'});return;}
        let sent=false;
        this.pending=target;this.setState({saving:true,error:''});
        try{
            await this.props.perform(async()=>{
                if(!this.current(target))throw Error('运行记录或项目状态已变化，请关闭弹窗后重新核对。');
                if(sent)throw Error('本次评议已提交，请等待处理完成。');
                try{
                    sent=true;
                    const result=await api(`/runs/${target.id}/outcome-review`,{expectedVersion:target.version,disposition:target.disposition,reason});
                    if(this.current(target)){this.epoch++;this.pending=null;this.setState({target:null,reason:'',error:'',saving:false});}
                    return result;
                }catch(error){if(this.current(target))this.setState({error:error instanceof Error?error.message:String(error)});throw error;}
            },'已保存结果评议；不会自动启动计算');
            if(!sent&&this.current(target))this.setState({error:'当前操作未执行，请等待其他操作完成后重试。'});
        }catch(error){if(this.current(target))this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.pending===target)this.pending=null;if(this.active(target))this.setState({saving:false});}
    }
    render(){
        const {run,readOnly}=this.props,{target,reason,error,saving}=this.state;
        const disposition=this.disposition(run),terminal=['succeeded','failed','cancelled'].includes(run.state),epoch=this.epoch;
        const stale=!!target&&!this.current(target);
        const dialog=target?<div onSubmit={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><Modal title="运行结果评议" description="先检查日志与原始产物，再说明此次运行是否回答研究问题。" submitLabel={target.disposition==='unanswered'?'确认未回答，允许准备修复':'确认已回答，冻结节点'} busy={saving} closeDisabled={saving} submitDisabled={!!readOnly||stale||!reason.trim()||reason.trim().length>4000} onClose={()=>this.close(target)} onSubmit={()=>this.save(target)}>
            <p>运行 <code>{short(target.id)}</code> · 版本 {target.version} · {target.disposition==='unanswered'?'未回答研究问题':'已回答研究问题'}</p>
            <label>评议理由<textarea name="reason" aria-label="评议理由" rows={5} required maxLength={4000} value={reason} disabled={saving||readOnly||stale} onChange={event=>{if(this.current(target)&&!this.pending)this.setState({reason:event.target.value,error:''});}} placeholder="请结合日志和原始产物说明判断依据…"/></label>
            <p className="small muted">{target.disposition==='unanswered'?'保存后可准备有界修复，不会自动启动计算。':'保存后该节点源码受保护，后续改动需派生新子实验。'}</p>
            {error||stale||readOnly?<p className="error-text" role="alert">{error||(readOnly?'项目已归档，不能保存评议。':'运行记录已变化，请关闭弹窗后重新核对。')} 当前输入保留。</p>:null}
        </Modal></div>:null;
        return <>{terminal?(disposition!=='needs_review'?<p className="small muted">问题回答状态：{disposition==='answered'?'已有结果，源码受保护':'用户确认未回答，可准备有界修复'}</p>:<div className="approval-card"><h4>此次运行是否回答研究问题？</h4><p className="small">无有效数值不一定表示没有研究结果。请结合假设与真实日志判断；此操作不会修改执行状态、产物完整性或假设结论。</p><div className="stack-actions"><button type="button" className="secondary" disabled={readOnly||saving} onClick={()=>this.open('unanswered',run,epoch)}>未回答：允许准备修复</button><button type="button" className="secondary" disabled={readOnly||saving} onClick={()=>this.open('answered',run,epoch)}>已回答：冻结节点</button></div></div>):null}{dialog&&typeof document!=='undefined'?createPortal(dialog,document.body):dialog}</>;
    }
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
            <details open><summary>原始指标与产物</summary>{artifacts.length?<ul>{artifacts.map(a=><li key={a.id}><button className="text-button" onClick={()=>void this.openArtifact(a.id)}>{a.title}</button><button className="text-button" aria-label={`下载 ${a.title}`} onClick={()=>perform(()=>downloadArtifact(a.id,a.title))}>下载</button><small className="muted">{a.size} 字节 · {short(a.digest)}</small></li>)}</ul>:<p className="small muted">暂无归档产物。</p>}{this.state.artifactLoading?<p role="status">读取产物…</p>:null}{this.state.artifactError?<p role="alert" className="error-text">{this.state.artifactError}</p>:null}{this.state.artifactId&&!this.state.artifactLoading&&!this.state.artifactError?<pre className="logs" aria-label="原始产物内容">{this.state.artifactContent||'（空文件）'}</pre>:null}</details>
            <details><summary>本次运行的固定源码</summary><p className="small muted">实验修订 v{run.manifest.experimentRevision} · 源码 SHA-256</p><code className="digest">{run.manifest.snapshotDigest}</code>{this.state.gitCommit?<p>Git commit <code className="digest">{this.state.gitCommit}</code></p>:null}<button className="secondary compact" disabled={this.state.sourceLoading} onClick={()=>void this.loadSource()}>读取运行源码清单</button>{this.state.sourceLoaded?<label>固定源码文件<select aria-label="固定源码文件" value={this.state.sourcePath} onChange={(e:any)=>{if(e.target.value)void this.readSource(e.target.value);}}>{nativeSelectButton}<option value="">选择文件</option>{this.state.files.map(f=><option key={f.path} value={f.path}>{f.path} · {f.size} 字节</option>)}</select></label>:null}{this.state.sourceError?<p role="alert" className="error-text">{this.state.sourceError}</p>:null}{file?<div><p className="small muted">{file.path} · {file.mode??'旧版未记录模式'}</p><code className="digest">{file.digest}</code><pre className="logs" aria-label="固定运行源码">{this.state.sourceContent||(this.state.sourceLoading?'读取源码…':'（空文件）')}</pre><button className="secondary compact" disabled={this.state.sourceLoading||this.state.sourceComplete} onClick={()=>void this.readSource(file.path,true)}>{this.state.sourceComplete?'源码已完整读取':'读取后续源码'}</button></div>:null}</details>
        </div>;
    }
}
type ManualReviewTarget={projectId:string;sessionId:string;teamId:string;taskId:string;taskVersion:number;key:string;objective:string;context:string;epoch:number};
export class Inspector extends React.Component<{
    data: ProjectState;
    boot: Bootstrap;
    tab: string;
    sessionId:string;
    inlineWorkflows?:boolean;
    embedded?:boolean;
    experiment: Row<Experiment> | undefined;
    perform: Perform;
    onConfig: () => void;
    onDirective: (teamId: string) => void;

    selectedRun?:string;
    onRun?:(id:string)=>void;
}, {reviewTarget:ManualReviewTarget|null;reviewReason:string;reviewError:string;reviewSaving:boolean}> {
    state={reviewTarget:null as ManualReviewTarget|null,reviewReason:'',reviewError:'',reviewSaving:false};
    private reviewPending=false;
    private reviewDisposed=false;
    private reviewEpoch=0;
    private reviewDialog:ManualReviewTarget|null=null;
    private reviewTeam=(props=this.props)=>props.data.teams.slice().reverse().find(team=>props.tab!=='chat'||team.rootSessionId===props.sessionId);
    private reviewContext=(props=this.props)=>{
        const team=this.reviewTeam(props),session=props.data.sessions?.find(row=>row.id===props.sessionId);
        return JSON.stringify([props.data.project.id,props.data.project.archived,props.data.project.settings.enabled,props.sessionId,session?.state,props.tab,props.embedded,props.inlineWorkflows,props.experiment?.id,props.selectedRun,team?.id,team?.version,team?.rootSessionId,team?.state,props.data.tasks.filter(task=>task.teamId===team?.id).map(task=>[task.id,task.version,task.key,task.objective,task.execution,task.acceptance,task.reviewOf])]);
    };
    componentWillUnmount(){this.reviewDisposed=true;this.reviewDialog=null;this.reviewEpoch++;}
    componentDidUpdate(previous:Readonly<Inspector['props']>){
        if(this.state.reviewTarget&&this.reviewContext(previous)!==this.reviewContext()){
            this.reviewEpoch++;
            this.setState({reviewError:'任务或页面上下文已变化，请关闭后重新打开人工审查窗口。'});
        }
    }
    private reviewActive=(target:ManualReviewTarget)=>!this.reviewDisposed&&this.reviewDialog===target&&this.state.reviewTarget===target&&target.epoch===this.reviewEpoch;
    private reviewCurrent=(target:ManualReviewTarget)=>this.reviewActive(target)&&!this.props.data.project.archived&&this.reviewContext()===target.context;
    private closeReview=(target:ManualReviewTarget)=>{
        if(this.reviewDisposed||this.reviewPending||this.reviewDialog!==target)return;
        this.reviewDialog=null;this.reviewEpoch++;
        this.setState(state=>state.reviewTarget===target?{reviewTarget:null,reviewError:''}:null);
    };
    private openReview=(taskId:string)=>{
        const {data,sessionId}=this.props,team=this.reviewTeam(),task=data.tasks.find(row=>row.id===taskId&&row.teamId===team?.id);
        if(this.reviewDisposed||this.reviewPending||this.reviewDialog||data.project.archived||this.props.tab==='experiments'||!team||!task||task.projectId!==data.project.id||task.execution!=='output_submitted'||!['pending','rejected','disputed'].includes(task.acceptance))return;
        const target={projectId:data.project.id,sessionId,teamId:team.id,taskId:task.id,taskVersion:task.version,key:task.key,objective:task.objective,context:this.reviewContext(),epoch:++this.reviewEpoch};
        this.reviewDialog=target;
        this.setState({reviewTarget:target,reviewReason:'',reviewError:'',reviewSaving:false});
    };
    private submitReview=async(target:ManualReviewTarget)=>{
        if(!this.reviewCurrent(target)||this.reviewPending)return;
        const reason=this.state.reviewReason.trim();
        if(!reason||reason.length>4000){this.setState({reviewError:'审查依据不能为空，且不能超过 4000 个字符。'});return;}
        let invoked=false;
        this.reviewPending=true;this.setState({reviewSaving:true,reviewError:''});
        try{
            return await this.props.perform(async()=>{
                invoked=true;
                if(!this.reviewCurrent(target))throw Error('任务或页面上下文已变化，人工审查已失效。');
                try{
                    const confirmed=await api(`/tasks/${encodeURIComponent(target.taskId)}/manual-review`,{verdict:'accepted',reason,expectedVersion:target.taskVersion});
                    if(this.reviewCurrent(target)){this.reviewDialog=null;this.reviewEpoch++;this.setState({reviewTarget:null,reviewSaving:false,reviewError:''});}
                    return confirmed;
                }catch(error){if(this.reviewActive(target))this.setState({reviewError:error instanceof Error?error.message:String(error)});throw error;}
            });
        }catch(error){if(this.reviewActive(target))this.setState({reviewError:error instanceof Error?error.message:String(error)});}
        finally{
            this.reviewPending=false;
            if(!this.reviewDisposed&&this.state.reviewTarget===target)this.setState(state=>({reviewSaving:false,reviewError:!invoked&&this.reviewActive(target)?'当前操作繁忙，人工审查未提交；依据已保留，请稍后重试。':state.reviewError}));
        }
    };
    private renderReview(){
        const {reviewTarget:target,reviewReason,reviewError,reviewSaving}=this.state;
        if(!target)return null;
        const dialog=<div onSubmit={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}><Modal title="人工确认验收" submitLabel="确认验收" busy={reviewSaving} closeDisabled={reviewSaving} submitDisabled={!this.reviewCurrent(target)||!reviewReason.trim()||reviewReason.trim().length>4000} onClose={()=>this.closeReview(target)} onSubmit={()=>this.submitReview(target)}><p className="small muted">任务 <code>{target.key}</code> · v{target.taskVersion}</p><p className="prose-text">{target.objective}</p><label>人工审查依据（将保留记录）<textarea name="reason" rows={6} required maxLength={4000} value={reviewReason} disabled={reviewSaving} onChange={event=>{if(this.reviewCurrent(target)&&!this.reviewPending)this.setState({reviewReason:event.target.value,reviewError:''});}}/></label>{reviewError?<p role="alert" className="error-text">{reviewError}</p>:null}</Modal></div>;
        return typeof document!=='undefined'?createPortal(dialog,document.body):dialog;
    }
    currentRun() { const runs=this.props.data.runs.filter(r=>r.experimentId===this.props.experiment?.id);return this.props.selectedRun?runs.find(r=>r.id===this.props.selectedRun):runs[runs.length-1]; }
    render() {
        const { data, boot, experiment: e, perform } = this.props;
        const teams = data.teams.slice().reverse().filter(t => this.props.tab !== 'chat' || t.rootSessionId === this.props.sessionId);
        const team = teams[0];
        const tasks = team ? data.tasks.filter(t => t.teamId === team.id) : [];
        const budget = data.budgets.find(b => b.teamId === team?.id);
        const run = this.currentRun();
        const teamIds = new Set(teams.map(t => t.id));
        const inlineReviewTeams=new Set(this.props.inlineWorkflows?(data.reviews??[]).filter(r=>r.producerSessionId===this.props.sessionId).map(r=>r.teamId):[]);
        const pendingTeams = data.approvals.filter(a => a.subjectKind === 'team' && (a.status === 'pending' || a.status === 'approved' && teams.some(t=>t.id===a.subjectId&&t.state==='awaiting_approval')) && teamIds.has(a.subjectId) && !inlineReviewTeams.has(a.subjectId));
        return <aside className={'inspector' + (this.props.embedded ? ' embedded-inspector' : '')} aria-label={this.props.tab==='experiments'?'实验与运行详情':this.props.embedded ? '当前会话协作空间' : undefined}>
 {!this.props.embedded||this.props.tab==='experiments' ? <div className="inspector-title"><Icon name={this.props.tab === 'experiments' ? 'experiment' : 'branch'}/><h2>{this.props.tab === 'experiments' ? '实验详情' : '协作空间'}</h2><span className="small muted">本地</span></div> : null}
 {this.props.tab === 'experiments' && e ? <div className="inspector-section"><div className="detail-title"><h3>{e.title}</h3><div data-testid="selected-experiment-state"><Badge value={e.lifecycle}/></div></div><p className="detail-hypothesis">{e.hypothesis}</p><dl className="details"><dt>实验 ID</dt><dd><code>{short(e.id)}</code></dd><dt>方案修订</dt><dd>v{e.revision}</dd><dt>固定入口</dt><dd><code>{e.contract.command.join(' ')}</code></dd><dt>计算方式</dt><dd>{e.contract.runner === 'trusted-example' ? '受信本地数值示例' : e.contract.runner === 'local' ? '本地 · 当前用户权限（不隔离）' : e.contract.runner === 'ssh' ? 'SSH · 固定镜像隔离运行' : 'Docker · 固定镜像隔离运行'}</dd><dt>数据版本</dt><dd>{e.contract.datasetVersion}</dd></dl><button className="secondary" onClick={this.props.onConfig}>查看只读配置</button>
 {this.props.selectedRun&&!run?<p role="alert" className="error-text">指定 Run 不属于当前实验或已不可用，未显示其他运行。</p>:null}{run ? <div className="run-detail"><label>查看运行<select aria-label="查看运行" value={run.id} onChange={(event:any)=>this.props.onRun?.(event.target.value)}>{nativeSelectButton}{data.runs.filter(r=>r.experimentId===e.id).slice().reverse().map(r=><option key={r.id} value={r.id}>{date(r.createdAt)} · {short(r.id)} · {label(r.state)}</option>)}</select></label><h4>运行 <code>{short(run.id)}</code></h4>{run.execution?<dl className="details"><dt>Docker context</dt><dd>{run.execution.dockerContext}</dd><dt>实际镜像 ID</dt><dd><code className="digest">{run.execution.imageId??'等待容器预检'}</code></dd></dl>:null}<div className="actions"><Badge value={run.state}/><Badge value={run.integrity}/></div>{run.metrics ? <dl className="details">{Object.entries(run.metrics).map(([k, v]) => <div className="detail-pair" key={k}><dt>{k}</dt><dd className="numeric">{number(v)} {e.contract.metrics[k]?.unit}{e.contract.metrics[k]?' · '+(e.contract.metrics[k].direction==='max'?'越高越好':'越低越好'):null}</dd></div>)}</dl> : null}{['queued','submitting','running','cancelling','unknown'].includes(run.state)?<ComputeWait data={data} kind="run" id={run.id} />:null}<OutcomeReview key={`outcome:${run.id}`} run={run} perform={perform} readOnly={data.project.archived}/><p className="small muted">科研判断：{run.judgment === 'pending' ? '尚未判定' : run.judgment}</p>{run.error ? <p className="error-text">{run.error}</p> : null}{['queued', 'running', 'submitting'].includes(run.state) ? <button className="danger-outline" disabled={data.project.archived} onClick={() => perform(() => api(`/runs/${run.id}/cancel`, {}), '已请求取消指定实验')}>取消这个实验</button> : null}<RunFiles key={run.id} run={run} data={data} perform={perform}/></div> : null}</div> : null}
 {this.props.tab!=='experiments'?<details className="inspector-collaboration" open={pendingTeams.length>0||['active','paused','draining','failed','partial'].includes(team?.state??'')}><summary>协作计划与结果<span>{pendingTeams.length?'待审批':team?label(team.state):'暂无任务'}</span></summary>
 {pendingTeams.map(a => {
     const pendingTeam=teams.find(t=>t.id===a.subjectId),canStart=data.project.settings.enabled&&pendingTeam?.state==='awaiting_approval'&&pendingTeam.delegationEnabled;
     return <div className="inspector-section" key={a.id}><div className="small-label">{a.status==='approved'?'已批准的协作计划':'待批准的协作计划'}</div><h3>{pendingTeam?.goal}</h3><p className="small muted">{a.reason}</p>{!canStart?<p className="small muted" role="status">此计划已停止；请在对话中重新提出任务。</p>:null}<button className="primary full" disabled={data.project.archived||!canStart} onClick={() => { if (this.props.data.project.archived||!canStart) return; perform(async () => { if(a.status==='pending') await api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: true }); await api(`/teams/${a.subjectId}/activate`, {}); }, '协作计划已启动'); }}>{a.status==='approved'?'启动已批准协作':'批准并启动协作'}</button>{a.status==='pending'?<button className="text-button" disabled={data.project.archived?true:undefined} onClick={() => { if(this.props.data.project.archived)return; return perform(() => api(`/approvals/${a.id}/decide`, { expectedVersion: a.version, approved: false })); }}>拒绝此计划</button>:null}</div>;
 })}
 {team ? <div className="inspector-section"><div className="surface-heading"><h3>当前团队</h3><Badge value={team.state}/></div><p className="team-goal">{team.goal}</p>{team.blockReason?<p className="inline-warning">{team.blockReason}</p>:null}{team.state === 'active' && !boot.runtime.ready ? <p className="inline-warning">尚未启动助手：Pi 未就绪。任务仍保存在队列中，没有模拟执行。</p> : null}<div className="team-progress"><strong>{tasks.filter(t => t.acceptance === 'accepted').length}<span> / {tasks.length}</span></strong><span>任务已验收</span></div>{tasks.map(t => <div className="task-card" key={t.id}><div className="task-top"><div className={'role-mark role-' + t.role}>{label(t.role).slice(0, 1)}</div><div><strong>{label(t.role)} <code>{t.key}</code></strong><span>{label(t.execution)}</span></div></div><p>{t.objective}</p><div className="task-footer"><span>验收：{label(t.acceptance)}</span><span>{t.reviewOf ? '审查 ' + t.reviewOf : t.dependencies.length ? '依赖 ' + t.dependencies.join(', ') : '无前置依赖'}</span></div>{t.blockReason ? <p className="small error-text">{t.blockReason}</p> : null}{['running','pending'].includes(t.execution) ? <button className="text-button danger" disabled={data.project.archived} onClick={() => perform(() => api(`/tasks/${t.id}/cancel`, {}))}>停止此助手</button> : null}{['failed','cancelled','blocked'].includes(t.execution) ? <><button className="text-button" disabled={data.project.archived||!t.retry?.eligible} onClick={() => {if(!data.project.archived&&t.retry?.eligible) perform(() => api(`/tasks/${t.id}/retry`, {}));}}>新尝试重试</button>{t.retry&&!t.retry.eligible?<p className="small error-text" role="status">不能重试：{t.retry.code} — {t.retry.reason}</p>:null}</> : null}{t.attempts?.length?<details><summary>尝试历史（最近至多 10 次；较早记录仍保留）</summary>{t.attempts.map(a=><div key={a.id}><p className="small">尝试 <code>{short(a.id)}</code> · {label(a.state)} · {date(a.updatedAt)}</p>{a.error?<p className="small error-text">{a.error}</p>:null}{a.result?<p className="small prose-text">{label(a.result.outcome)}：{a.result.summary}{a.result.summaryTruncated?'（历史摘要已截断）':null}</p>:null}</div>)}</details>:null}{t.result ? <details><summary>结果与限制</summary>{t.role === 'reviewer' ? <p className="small" role="status">审查意见：{t.result.verdict === 'accept' ? '接受' : t.result.verdict === 'reject' ? '拒绝' : t.result.verdict === 'disputed' ? '存在争议' : '未提供；不能视为通过'}（独立于任务验收状态）</p> : null}<p className="small prose-text">{t.result.summary}</p></details> : null}{t.execution === 'output_submitted' && ['pending','rejected','disputed'].includes(t.acceptance) ? <button type="button" className="text-button" disabled={data.project.archived} onClick={() => {
                            this.openReview(t.id);
 }}>人工确认验收</button> : null}</div>)}{budget ? <div className="budget-note">尝试额度：{budget.used} 已结算 / {budget.reserved} 已预留 / {budget.unknown} 待对账<br />总额度 {budget.limit} 次。此额度不是供应商账单上限。</div> : null}<div className="actions wrap">{team.state === 'active' ? <button className="secondary compact" disabled={data.project.archived} onClick={() => perform(() => api(`/teams/${team.id}/pause`, {}))}>暂停分配</button> : null}{team.state === 'paused' ? <button className="secondary compact" disabled={data.project.archived} onClick={() => perform(() => api(`/teams/${team.id}/resume`, {}))}>恢复</button> : null}<button className="secondary compact" disabled={data.project.archived} onClick={() => this.props.onDirective(team.id)}>引导 / 改变目标</button></div></div> : <div className="inspector-section muted small">在对话中提出协作任务。</div>}
</details>:null}
 {this.renderReview()}</aside>;
    }
}
