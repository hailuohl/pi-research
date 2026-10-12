import * as React from 'react';
import {ProjectEventFeed} from './event-feed.js';
import {EnvironmentView} from './environment-view.js';
import {IntegrationsView} from './integrations.js';
import { api,ApiError } from './api.js';
import type { Bootstrap, Project, ProjectLifecycleView, ProjectState, Row, Session, Message, SessionCatalogItem, SessionCatalogPage, DocumentLocation, SessionHistoryPage, SessionView, ModelManagementView } from './models.js';
import { short, label } from './models.js';
import {Icon, Modal, nativeSelectButton} from './ui.js';
import { Chat, Inspector, type Perform } from './workbench.js';
import type {QueueMessage} from './message-queue.js';
import {SessionList} from './session-list.js';
import {ProjectCreationModal} from './github-controls.js';
import {ProjectManagement} from './project-management.js';
import { WorkspaceView, SettingsView } from './data-views.js';
import { ConversationLayout } from './conversation-panel-layout.js';
import { ConversationPanel } from './conversation-panel.js';
import {ArchivedResearchHistory} from './archived-research-history.js';
type CurrentSessionView=Omit<SessionView,'messages'|'progress'>&{messages:QueueMessage[];pendingMessages:QueueMessage[];pendingTotal:number;pendingNextCursor:string|null;progress:SessionView['progress']&{canSteer:boolean}};
interface State {
    boot: Bootstrap | null;
    data: ProjectState | null;
    projectId: string;
    sessionId: string;
    tab: string;
    selectedExp: string;
    selectedRun: string;
    selectedReport:string;
    selectedCampaign:string;
    selectedDiscoveryGrant:string;
    selectedDocument:DocumentLocation|null;
    messages: QueueMessage[];
    pendingMessages:QueueMessage[];
    pendingTotal:number;
    pendingNextCursor:string|null;
    canSteer:boolean;
    history:SessionHistoryPage|null;
    historyAnchor:{direction:'before'|'after';id:string}|null;
    stream: string;
    streamTruncated:boolean;
    activity:SessionView['progress']['activity'];
    eventNotice:string;
    modal: string;
    modalData: any;
    busy: boolean;
    error: string;
    notice: string;
    connected: boolean;
    navigationOpen: boolean;
    archiveHistoryOpen:boolean;
    sessionCreationSignal:number;
}
const navigation = [['chat', '研究会话', 'chat'], ['environment','环境','settings'], ['workspace', '项目工作区', 'folder'], ['literature', '文献检索', 'search'], ['integrations', '技能与连接器', 'skills'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report'], ['settings', '模型与模板', 'settings']];
const navigationGroups = [
    { name: '研究', ids: ['chat', 'workspace'] },
    { name: '管理', ids: ['integrations', 'environment', 'settings'] },
];
const normalizeView = (tab:string) => tab==='scheduler'?'environment':['experiments','campaigns','implementation','changes','literature','evidence','reports'].includes(tab) ? 'chat' : tab;
const deletedRead=(error:unknown)=>error instanceof ApiError&&(error.status===404||error.status===410||error.code==='PROJECT_DELETED');
function saved() {
    try {
        return JSON.parse(localStorage.getItem('pi-research-ui-v1') ?? '{}');
    }
    catch {
        return {};
    }
}
export class App extends React.Component<{}, State> {
    state: State = { boot: null, data: null, projectId: saved().projectId ?? '', sessionId: saved().sessionId ?? '', tab: normalizeView(saved().tab ?? 'chat'), selectedExp: saved().selectedExp ?? '', selectedRun:saved().selectedRun??'',selectedReport:saved().selectedReport??'',selectedCampaign:saved().selectedCampaign??'',selectedDiscoveryGrant:saved().selectedDiscoveryGrant??'',selectedDocument:saved().selectedDocument??null, messages: [],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false, history:null,historyAnchor:saved().historyAnchor&&saved().historyAnchor.projectId===saved().projectId&&saved().historyAnchor.sessionId===saved().sessionId?saved().historyAnchor.anchor:null, stream: '',streamTruncated:false,activity:null,eventNotice:'', modal: '', modalData: null, busy: false, error: '', notice: '', connected: false, navigationOpen: false,archiveHistoryOpen:false,sessionCreationSignal:0 };
    private experimentSelections:Record<string,string> = Object.fromEntries(Object.entries(saved().experimentSelections ?? {}).filter(([,value])=>typeof value==='string')) as Record<string,string>;
    private closeNavigationOnResize = () => { if(window.innerWidth>760&&this.state.navigationOpen)this.setState({navigationOpen:false}); };
    private navigationToggle:HTMLButtonElement|null=null;
    private timer?: number;
    private refreshing?:Promise<boolean>;
    private refreshEpoch = 0;
    private readController?:AbortController;
    private feed?:ProjectEventFeed;
    private mounted=true;
    private projectSelectionEpoch=0;
    private projectIntent=0;
    private modalIntent=0;
    private creatingSession=false;
    private pendingSessionCreate?:{projectId:string;epoch:number;body:unknown;key:string};
    private noticeTimer?: number;
    private conversationPanel=React.createRef<ConversationPanel>();
    private workspace=React.createRef<WorkspaceView>();
    private chat=React.createRef<Chat>();
    private toggleArchiveHistory=(event:React.MouseEvent<HTMLButtonElement>)=>{
        const trigger=event.currentTarget,projectId=this.state.projectId,sessionId=this.state.sessionId,open=!this.state.archiveHistoryOpen;
        this.setState({tab:'chat',archiveHistoryOpen:open},()=>{
            if(!this.mounted||this.state.projectId!==projectId||this.state.sessionId!==sessionId||this.state.archiveHistoryOpen!==open)return;
            if(open)this.chat.current?.openArchivedHistory(trigger);else this.chat.current?.closeDrawer();
        });
    };
    componentDidMount() {
        if(saved().tab==='experiments')this.conversationPanel.current?.showExperiments();
        window.addEventListener('resize',this.closeNavigationOnResize);
        void this.refresh();
        this.timer=window.setInterval(()=>{if(this.feed)this.feed.wake();else void this.refresh(true);},20000);
    }
    componentWillUnmount(){if(typeof window!=='undefined')window.removeEventListener?.('resize',this.closeNavigationOnResize);this.mounted=false;this.invalidateRead();this.feed?.stop();clearInterval(this.timer);clearTimeout(this.noticeTimer);}
    componentDidUpdate(_:any,prev:State){
        if(this.state.data?.project.id===this.state.projectId&&this.state.data.experiments.some(e=>e.id===this.state.selectedExp))this.experimentSelections[this.state.projectId]=this.state.selectedExp;
        try { if(['projectId','sessionId','tab','selectedExp','selectedRun','selectedReport','selectedCampaign','selectedDiscoveryGrant','selectedDocument','historyAnchor'].some(k=>(prev as any)[k] !==(this.state as any)[k]))
            localStorage.setItem('pi-research-ui-v1',JSON.stringify({experimentSelections:this.experimentSelections,projectId:this.state.projectId,sessionId:this.state.sessionId,tab:this.state.tab,selectedExp:this.state.selectedExp,selectedRun:this.state.selectedRun,selectedReport:this.state.selectedReport,selectedCampaign:this.state.selectedCampaign,selectedDiscoveryGrant:this.state.selectedDiscoveryGrant,selectedDocument:this.state.selectedDocument,historyAnchor:{projectId:this.state.projectId,sessionId:this.state.sessionId,anchor:this.state.historyAnchor}})); } catch { /* Viewing stays usable when browser storage is unavailable. */ }
    }
    private invalidateRead(){this.refreshEpoch++;this.readController?.abort();this.refreshing=undefined;}
    refresh(quiet=false):Promise<boolean>{
        if(!this.mounted||quiet&&this.state.busy)return Promise.resolve(false);
        if(this.refreshing)return this.refreshing;
        const reading=this.readState(quiet);this.refreshing=reading;
        void reading.finally(()=>{if(this.refreshing===reading)this.refreshing=undefined;});return reading;
    }
    private async readState(quiet:boolean):Promise<boolean>{
        const epoch=this.refreshEpoch,requestedProjectId=this.state.projectId,controller=new AbortController();this.readController=controller;
        let fallbackProjects:Bootstrap['projects']=[];
        let recoveringDeleted=false;
        try{
            const boot=await api<Bootstrap>('/bootstrap',undefined,'GET',controller.signal);
            fallbackProjects=boot.projects;
            const modelManagementRead=api<ModelManagementView>('/settings/model-management',undefined,'GET',controller.signal).then(data=>{
                if(data.schemaVersion!==2||!Array.isArray(data.providers))throw Error('模型设置目录格式不正确，请刷新后重试');
                return {data,error:''};
            }).catch(error=>({data:null,error:error instanceof Error?error.message:String(error)}));
            let projectId=this.state.projectId;
            if(projectId&&!boot.projects.some(p=>p.id===projectId)){
                try{const project=await api<Row<Project>>(`/projects/${encodeURIComponent(projectId)}`,undefined,'GET',controller.signal);if(project.id!==projectId)throw Error('项目快照与当前选择不一致');if(!project.archived)projectId=boot.projects[0]?.id??'';}
                catch(error){if(deletedRead(error)){recoveringDeleted=true;if(this.mounted&&epoch===this.refreshEpoch)await this.clearDeletedView(projectId);projectId=boot.projects.find(p=>p.id!==projectId)?.id??'';}else throw error;}
            }
            if(!projectId)projectId=boot.projects[0]?.id??'';
            let requestedSession=projectId===this.state.projectId?this.state.sessionId:'';
            let data:ProjectState|null=null;
            try{data=projectId?await api<ProjectState>(`/projects/${projectId}/state${requestedSession?'?sessionId='+encodeURIComponent(requestedSession):''}`,undefined,'GET',controller.signal):null;}
            catch(error){
                if(!deletedRead(error))throw error;
                recoveringDeleted=true;
                if(this.mounted&&epoch===this.refreshEpoch)await this.clearDeletedView(projectId);
                projectId=boot.projects.find(p=>p.id!==projectId)?.id??'';requestedSession='';
                data=projectId?await api<ProjectState>(`/projects/${projectId}/state`,undefined,'GET',controller.signal):null;
            }
            const sessionId=requestedSession||(data?.sessions.find(s=>s.role==='coordinator'&&s.state!=='archived')?.id??'');
            const anchor=requestedSession?this.state.historyAnchor:null;
            const view=sessionId?await api<CurrentSessionView>(`/sessions/${sessionId}/view${anchor?'?'+(anchor.direction==='before'?'beforeMessageId':'afterMessageId')+'='+encodeURIComponent(anchor.id):''}`,undefined,'GET',controller.signal):null;
            const modelManagement=await modelManagementRead;
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(view&&view.session.id!==sessionId)throw Error('会话快照与当前选择不一致');
            if(data&&view)data={...data,sessions:data.sessions.some(s=>s.id===sessionId)?data.sessions.map(s=>s.id===sessionId?view.session:s):[...data.sessions,view.session]};
            const active=!!view?.progress.active&&view.progress.generation===view.session.generation;
            const requestedExp=projectId===this.state.projectId?this.state.selectedExp:this.experimentSelections[projectId]??'';
            const selectedExp=data?.experiments.some(e=>e.id===requestedExp)?requestedExp:data?.experiments[0]?.id??'';
            await new Promise<void>(resolve=>this.setState({boot:{...boot,modelManagement:modelManagement.data,modelManagementError:modelManagement.error},data,projectId,sessionId,messages:view?.messages??[],pendingMessages:view?.pendingMessages??[],pendingTotal:view?.pendingTotal??0,pendingNextCursor:view?.pendingNextCursor??null,canSteer:view?.progress?.canSteer??false,history:view?.history??null,historyAnchor:anchor,selectedExp,stream:!anchor&&active?view!.progress.content:'',streamTruncated:!anchor&&active&&!!view?.progress.truncated,activity:!anchor&&active?view?.progress.activity??null:null,connected:true},resolve));
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(this.feed?.projectId!==projectId){this.feed?.stop();this.feed=undefined;if(projectId){const feed=new ProjectEventFeed(projectId,()=>this.refresh(true),eventNotice=>{if(this.mounted&&this.feed===feed)this.setState({eventNotice});});this.feed=feed;feed.start();}}
            return true;
        }catch(error){
            if(!this.mounted||epoch!==this.refreshEpoch||controller.signal.aborted)return false;
            if(deletedRead(error)&&requestedProjectId&&!recoveringDeleted){
                await this.clearDeletedView(requestedProjectId);
                if(!this.mounted||epoch!==this.refreshEpoch)return false;
                if(!await this.switchProject(fallbackProjects.find(p=>p.id!==requestedProjectId)?.id??''))return false;
                return this.refresh();
            }
            this.setState(previous=>({...previous,connected:false,...(!quiet?{error:error instanceof Error?error.message:String(error)}:{})}));
            return false;
        }finally{if(this.readController===controller)this.readController=undefined;}
    }
    perform: Perform = async (fn, success) => {
        if (this.state.busy)
            return;
        this.invalidateRead();
        this.setState({ busy: true, error: '' });
        try {
            const result = await fn();
            if (success) {
                clearTimeout(this.noticeTimer);
                this.setState({ notice: success });
                this.noticeTimer = window.setTimeout(() => this.setState({ notice: '' }), 4500);
            }
            await this.refresh();
            return result;
        }
        catch (e) {
            this.setState({ error: e instanceof Error ? e.message : String(e) });
            return undefined;
        }
        finally {
            this.setState({ busy: false });
        }
    };
    private confirmSessionModel=(session:Row<Session>)=>{
        if(!this.mounted||this.state.sessionId!==session.id||this.state.projectId!==session.projectId||this.state.data?.project.id!==session.projectId)return;
        this.invalidateRead();
        this.setState(current=>{
            if(!this.mounted||current.sessionId!==session.id||current.projectId!==session.projectId||current.data?.project.id!==session.projectId)return null;
            const existing=current.data.sessions.find(item=>item.id===session.id);
            if(existing&&existing.version>session.version)return null;
            return {data:{...current.data,sessions:existing?current.data.sessions.map(item=>item.id===session.id?session:item):[...current.data.sessions,session]}};
        });
    };
    private confirmSessionBranch=(session:Row<Session>)=>{
        if(!this.mounted||this.state.sessionId!==session.parentSessionId||this.state.projectId!==session.projectId||this.state.data?.project.id!==session.projectId||this.state.data.project.archived)return;
        if(this.state.data.sessions.find(item=>item.id===session.id)?.state==='archived')throw Error('分支会话已归档，请在已归档会话目录中查看');
        this.invalidateRead();
        this.setState(current=>{
            if(!this.mounted||current.sessionId!==session.parentSessionId||current.projectId!==session.projectId||current.data?.project.id!==session.projectId||current.data.project.archived)return null;
            const existing=current.data.sessions.find(item=>item.id===session.id);
            if(existing?.state==='archived')return {...current,error:'分支会话已归档，请在已归档会话目录中查看'};
            const confirmed=existing&&existing.version>session.version?existing:session;
            return {...this.sessionSelection(confirmed.id,'chat'),navigationOpen:false,sessionCreationSignal:current.sessionCreationSignal+1,data:{...current.data,sessions:existing?current.data.sessions.map(item=>item.id===confirmed.id?confirmed:item):[...current.data.sessions,confirmed]}};
        });
    };
    private confirmSessionMessage=(message:Row<Message>)=>{
        this.setState(current=>{
            if(!this.mounted||current.sessionId!==message.sessionId||current.projectId!==message.projectId||current.data?.project.id!==message.projectId||current.historyAnchor||current.history&&!current.history.atLatest)return null;
            const existing=current.messages.find(item=>item.id===message.id);
            const pending=current.pendingMessages.find(item=>item.id===message.id);
            if(existing&&existing.version>=message.version||pending&&pending.version>message.version)return null;
            const row:QueueMessage={...message,previewTruncated:false,contentBytes:new TextEncoder().encode(message.content).byteLength};
            const queued=message.role==='user'&&message.status==='queued'&&message.origin!=='automation'&&message.wakeupId==null&&(message.mode==='follow_up'||message.mode==='steer');
            const pendingMessages=queued?(pending?current.pendingMessages.map(item=>item.id===message.id?row:item):current.pendingMessages.length<20?[...current.pendingMessages,row]:current.pendingMessages):current.pendingMessages,pendingTotal=queued?current.pendingTotal+(pending?0:1):current.pendingTotal,pendingNextCursor=queued&&!pending&&pendingTotal>20&&current.pendingNextCursor===null?pendingMessages[pendingMessages.length-1]?.id??null:current.pendingNextCursor;
            return {messages:existing?current.messages.map(item=>item.id===message.id?row:item):[...current.messages,row],pendingMessages,pendingTotal,pendingNextCursor};
        });
    };
    private sessionSelection(id:string,tab=this.state.tab):Pick<State,'sessionId'|'tab'|'messages'|'pendingMessages'|'pendingTotal'|'pendingNextCursor'|'canSteer'|'history'|'historyAnchor'|'stream'|'streamTruncated'|'activity'|'error'|'archiveHistoryOpen'> {
        return {sessionId:id,tab:normalizeView(tab),archiveHistoryOpen:false,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',streamTruncated:false,activity:null,error:''};
    }
    async switchProject(id: string):Promise<boolean> {
        const intent=++this.projectIntent,sourceId=this.state.projectId,epoch=this.projectSelectionEpoch,modalIntent=this.modalIntent,workspace=this.workspace.current,generation=workspace?.draftGeneration,archived=this.state.data?.project.archived;
        if(!this.mounted)return false;
        if(id===sourceId)return true;
        const current=(selectionEpoch=epoch)=>this.mounted&&intent===this.projectIntent&&modalIntent===this.modalIntent&&sourceId===this.state.projectId&&selectionEpoch===this.projectSelectionEpoch&&workspace===this.workspace.current&&generation===workspace?.draftGeneration&&archived===this.state.data?.project.archived;
        if(workspace&&!await workspace.confirmDiscard()||!current())return false;
        if(this.state.data?.experiments.some(e=>e.id===this.state.selectedExp))this.experimentSelections[sourceId]=this.state.selectedExp;
        const selectionEpoch=++this.projectSelectionEpoch;
        this.invalidateRead();this.feed?.stop();this.feed=undefined;
        return new Promise<boolean>(resolve=>this.setState(()=>current(selectionEpoch)?{...this.sessionSelection(''),projectId:id,selectedExp:this.experimentSelections[id]??'',navigationOpen:false,selectedRun:'',selectedReport:'',archiveHistoryOpen:false,selectedCampaign:'',selectedDiscoveryGrant:'',selectedDocument:null,eventNotice:'',data:null}:null,()=>{
            const switched=this.mounted&&intent===this.projectIntent&&modalIntent===this.modalIntent&&this.state.projectId===id&&this.projectSelectionEpoch===selectionEpoch;
            if(switched)void this.refresh();resolve(switched);
        }));
    }
    private async clearDeletedView(id:string){
        if(this.state.projectId!==id)return;
        const selectionEpoch=++this.projectSelectionEpoch;this.projectIntent++;if(this.state.modal!=='projects')this.modalIntent++;this.feed?.stop();this.feed=undefined;
        await new Promise<void>(resolve=>this.setState({...this.sessionSelection(''),projectId:'',data:null,selectedExp:'',selectedRun:'',selectedReport:'',archiveHistoryOpen:false,selectedCampaign:'',selectedDiscoveryGrant:'',selectedDocument:null,eventNotice:'',modal:this.state.modal==='projects'?'projects':'',modalData:null},resolve));
        return selectionEpoch;
    }
    projectLifecycleChanged=async(project:ProjectLifecycleView,selectionEpoch:number)=>{
        if(!this.mounted)return;
        this.invalidateRead();
        if(this.state.projectId===project.id&&this.projectSelectionEpoch===selectionEpoch&&project.status!=='active'){
            const deleted=project.status==='trashed'||project.status==='purging';
            const currentEpoch=deleted?await this.clearDeletedView(project.id):selectionEpoch,currentId=deleted?'':project.id;
            if(!this.mounted||this.state.projectId!==currentId||this.projectSelectionEpoch!==currentEpoch)return;
            if(!deleted)
                this.setState(current=>current.data&&current.data.project.id===project.id?{data:{...current.data,project:{...current.data.project,status:project.status,archived:true,version:project.version,lifecycleEpoch:project.lifecycleEpoch}}}:null);
            const boot=await api<Bootstrap>('/bootstrap');
            if(!this.mounted||this.state.projectId!==currentId||this.projectSelectionEpoch!==currentEpoch)return;
            await this.switchProject(boot.projects[0]?.id??'');
        }else await this.refresh();
    };
    selectSession(id: string,tab='chat') { this.invalidateRead(); this.setState(this.sessionSelection(id,tab), () => { void this.refresh(); }); }
    private showExperiments=()=>this.setState({tab:'chat'},()=>this.conversationPanel.current?.showExperiments());
    selectExperiment=(id:string,runId='')=>{const data=this.state.data;if(!data?.experiments.some(e=>e.id===id)||runId&&!data.runs.some(r=>r.id===runId&&r.experimentId===id)){this.setState({error:'指定实验或运行不在当前项目中。'});return;}this.setState({selectedExp:id,selectedRun:runId,tab:'chat'},()=>this.conversationPanel.current?.showExperiments());};
    selectHistory=(anchor:{direction:'before'|'after';id:string}|null)=>{this.invalidateRead();this.setState({messages:[],historyAnchor:anchor,stream:'',streamTruncated:false,activity:null},()=>void this.refresh());};
    async open(modal: string, data: any = null) {
        const intent=++this.modalIntent,projectId=this.state.projectId,epoch=this.projectSelectionEpoch,projectIntent=this.projectIntent,workspace=this.workspace.current,generation=workspace?.draftGeneration,archived=this.state.data?.project.archived;
        if(modal==='project'&&workspace&&!await workspace.confirmDiscard())return;
        const current=()=>this.mounted&&intent===this.modalIntent&&(modal!=='project'||projectId===this.state.projectId&&epoch===this.projectSelectionEpoch&&projectIntent===this.projectIntent&&workspace===this.workspace.current&&generation===workspace?.draftGeneration&&archived===this.state.data?.project.archived);
        if(current())this.setState(()=>current()?{modal,modalData:data,error:''}:null);
    }
    close = () => {
        if (!this.state.busy){
            this.modalIntent++;
            this.setState({ modal: '', modalData: null });
        }
    };
    useParsedDocument=(target:{documentVersionId:string;parseResultId:string})=>{
        const projectId=this.state.projectId,sessionId=this.state.sessionId,epoch=this.projectSelectionEpoch;
        const current=()=>{const s=this.state.data?.sessions.find(s=>s.id===sessionId);return this.mounted&&this.state.projectId===projectId&&this.state.sessionId===sessionId&&this.projectSelectionEpoch===epoch&&!this.state.data?.project.archived&&s?.role==='coordinator'&&!s.taskId&&!s.teamId&&s.state!=='archived';};
        if(this.state.busy||!current())return;
        void this.perform(async()=>{if(!current())return;await api(`/sessions/${encodeURIComponent(sessionId)}/messages`,{content:'我选择将这份固定解析资料带入当前会话。请先核对资料，再与我明确需要视觉读取的物理页范围；资料附件本身不授予原文或图片读取权限。',parsedDocumentAttachments:[target]});if(current())this.selectSession(sessionId,'chat');},'已带入固定解析资料；视觉页范围仍需准确批准');
    };
    async newSession() {
        const projectId=this.state.projectId,currentSessionId=this.state.sessionId,epoch=this.projectSelectionEpoch;
        if (!this.mounted||!projectId||this.state.busy||this.creatingSession||this.state.data?.project.archived)
            return;
        this.creatingSession=true;
        const current=()=>this.mounted&&this.state.projectId===projectId&&this.projectSelectionEpoch===epoch;
        const eligible=(s:SessionCatalogItem)=>s.projectId===projectId&&s.role==='coordinator'&&s.state==='idle'&&!s.taskId&&!s.teamId;
        const seen=new Set<string>();
        const emptySession=async(id:string):Promise<Row<Session>|null>=>{
            seen.add(id);
            const session=await api<Row<Session>>(`/sessions/${encodeURIComponent(id)}`);
            if(!current())return null;
            if(session.id!==id)throw Error('会话快照与请求不一致');
            if(!eligible(session)||session.parentSessionId||session.piSessionPath!==null||session.generation!==0||session.leaseUntil!==0)return null;
            const messages=await api<unknown>(`/sessions/${encodeURIComponent(id)}/messages`);
            if(!current())return null;
            if(!Array.isArray(messages))throw Error('会话消息读取未返回完整历史');
            return messages.length===0?session:null;
        };
        try{
            await this.perform(async()=>{
                try{
                    const project=await api<Row<Project>>(`/projects/${encodeURIComponent(projectId)}`);
                    if(!current())return;
                    if(project.id!==projectId||typeof project.archived!=='boolean')throw Error('项目快照与请求不一致');
                    if(project.archived)throw Error('已归档项目不可新建会话');
                    let session=currentSessionId?await emptySession(currentSessionId):null;
                    if(!current())return;
                    let cursor:string|undefined;
                    const cursors=new Set<string>();
                    while(!session){
                        const page=await api<SessionCatalogPage>('/operations/session_list',{projectId,input:{role:'coordinator',stateFilter:'active',limit:50,...(cursor?{beforeSessionId:cursor}:{})}});
                        if(!current())return;
                        if(!Array.isArray(page.items))throw Error('会话目录读取失败');
                        for(const item of page.items){
                            if(seen.has(item.id)||!eligible(item))continue;
                            session=await emptySession(item.id);
                            if(!current())return;
                            if(session)break;
                        }
                        if(session||!page.nextCursor)break;
                        if(cursors.has(page.nextCursor))throw Error('会话目录游标重复');
                        cursor=page.nextCursor;cursors.add(cursor);
                    }
                    const body=session?{projectId,reuseSessionId:session.id,expectedVersion:session.version}:{projectId,title:'新的研究会话'};
                    const pending=this.pendingSessionCreate?.projectId===projectId&&this.pendingSessionCreate.epoch===epoch?this.pendingSessionCreate:{projectId,epoch,body,key:crypto.randomUUID()};this.pendingSessionCreate=pending;
                    try{session=await api<Row<Session>>('/sessions',pending.body,'POST',undefined,pending.key);this.pendingSessionCreate=undefined;}catch(error){if(error instanceof ApiError&&error.status<500)this.pendingSessionCreate=undefined;throw error;}
                    if(!current()||this.state.sessionId!==currentSessionId)return;
                    const closeNavigation=this.state.navigationOpen,sessionId=session.id;
                    await new Promise<void>(resolve=>this.setState({...this.sessionSelection(sessionId,'chat'),navigationOpen:false,sessionCreationSignal:this.state.sessionCreationSignal+1},()=>{if(current()&&this.state.sessionId===sessionId&&this.state.data?.sessions.find(item=>item.id===sessionId)!==session)this.confirmSessionModel(session!);if(closeNavigation)this.navigationToggle?.focus();resolve();}));
                }catch(error){if(current())throw error;}
            });
        }finally{this.creatingSession=false;}
    }
    async toggle() { const p = this.state.data!.project; await this.perform(() => api(`/projects/${p.id}/collaboration-settings`, { expectedVersion: p.version, enabled: !p.settings.enabled })); }
    modalView() {
        const { modal, modalData, data, busy } = this.state;
        if (!modal)
            return null;
        const base = { onClose: this.close, busy };
        const modalIntent=this.modalIntent,done = () => {if(this.mounted&&modalIntent===this.modalIntent&&this.state.modal===modal){this.modalIntent++;this.setState({modal:'',modalData:null});}};
        if(modal==='projects')return <ProjectManagement onClose={this.close} onOpen={async id=>{if(this.mounted&&modalIntent===this.modalIntent&&this.state.modal===modal&&await this.switchProject(id))done();}} selectionToken={()=>this.projectSelectionEpoch} onChanged={this.projectLifecycleChanged}/>;
        if (modal === 'project')
            return <ProjectCreationModal {...base} onCreate={(input,key)=>this.perform(async()=>{const p=await api<Row<Project>>('/projects',input,'POST',undefined,key);const s=await api<Row<Session>>('/sessions',{projectId:p.id,title:'研究主会话'},'POST',undefined,key+'-session');await new Promise<void>(resolve=>this.setState({...this.sessionSelection(s.id,'chat'),projectId:p.id,selectedExp:'',selectedRun:'',selectedReport:'',archiveHistoryOpen:false,selectedCampaign:'',selectedDiscoveryGrant:'',selectedDocument:null,data:null},resolve));done();},input.github?'本地项目已创建；GitHub 同步状态可在设置中查看。':'本地项目已创建')}/>;
        if (modal === 'config')
            return <Modal {...base} wide title="实验只读配置" submitLabel="关闭配置" onSubmit={() => done()}><p className="small muted">配置变更请在研究对话中提出。</p><label>配置源码<textarea aria-label="配置源码" className="code-input" rows={12} readOnly defaultValue={modalData.content}/></label></Modal>;
        if (modal === 'directive')
            return <Modal {...base} title="给团队发送指令" submitLabel="保存指令" onSubmit={fd => this.perform(async () => { await api(`/teams/${modalData}/directives`, { kind: fd.get('kind'), content: fd.get('content') }); done(); })}><label>指令语义<select name="kind">{nativeSelectButton}<option value="steer">引导当前工作 · 不修改研究目标</option><option value="follow_up">后续指令 · 当前任务结束后处理</option><option value="revise">改变研究目标 · 旧任务失效，暂停重新规划</option></select></label><label>指令内容<textarea name="content" rows={6} required/></label><p className="small muted">修改目标会保存新需求版本，不删除已有实验或结果。取消正式 Run 需单独操作。</p></Modal>;
        if (modal === 'evidence')
            return <Modal {...base} wide title="登记原文证据" submitLabel="保存证据" onSubmit={fd => this.perform(async () => { await api('/evidence', { projectId: data!.project.id, artifactId: modalData.artifactId, start: Number(fd.get('start')), end: Number(fd.get('end')), description: fd.get('description') }); done(); }, '证据已定位并校验')}><label>证据说明<input name="description" required placeholder="此片段用于支持什么观察？"/></label><div className="form-columns"><label>起始字符<input type="number" name="start" min={0} defaultValue={0}/></label><label>结束字符<input type="number" name="end" min={1} max={modalData.content.length} defaultValue={Math.min(modalData.content.length, 2000)}/></label></div><p className="small muted">使用 JavaScript UTF-16 字符位置，不是 PDF 页码或日志字节位置。</p><pre className="modal-preview">{modalData.content.slice(0, 4000)}</pre></Modal>;
        if (modal === 'claim')
            return <Modal {...base} title="提出结论候选" submitLabel="保存候选待验收" onSubmit={fd => this.perform(async () => { await api('/claims', { projectId: data!.project.id, statement: fd.get('statement'), evidenceIds: [fd.get('evidenceId')], limitations: String(fd.get('limitations')).split('\n').filter(Boolean) }); done(); })}><label>结论陈述<textarea name="statement" required rows={4}/></label><label>证据来源<select name="evidenceId">{nativeSelectButton}{data!.evidence.map(e => <option value={e.id} key={e.id}>{e.description} · {short(e.id)}</option>)}</select></label><label>限制（每行一条）<textarea name="limitations" required placeholder="样本规模、条件、未执行的验证等"/></label></Modal>;
        return null;
    }
    selectCampaign = (selectedCampaign:string)=>{const data=this.state.data;const clearHistory={messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',streamTruncated:false};const campaign=data?.campaigns.find(c=>c.id===selectedCampaign);if(!campaign){this.setState({...clearHistory,error:'指定研究活动不在当前项目中，未跳转到其他活动。'});return;}if(!campaign.rootSessionId){this.setState({...clearHistory,error:'指定研究活动没有可打开的主会话。'});return;}this.setState({selectedCampaign},()=>this.selectSession(campaign.rootSessionId));};
    selectTab = (tab:string) => {
        this.projectIntent++;
        const returnFocus=this.state.navigationOpen;
        this.setState({tab:normalizeView(tab),navigationOpen:false},()=>{if(returnFocus)this.navigationToggle?.focus();});
    };
    toggleNavigation = () => {
        this.projectIntent++;
        const navigationOpen = !this.state.navigationOpen;
        this.setState({ navigationOpen }, () => document.getElementById(navigationOpen ? 'navigation-close' : 'navigation-toggle')?.focus());
    };
    private chooseProject=(id:string)=>{
        if(!id)return;
        const intent=++this.projectIntent,projectId=this.state.projectId,epoch=this.projectSelectionEpoch,modalIntent=this.modalIntent,workspace=this.workspace.current,generation=workspace?.draftGeneration,returnFocus=this.state.navigationOpen;
        this.setState({navigationOpen:false},()=>{
            if(!this.mounted||intent!==this.projectIntent||projectId!==this.state.projectId||epoch!==this.projectSelectionEpoch||modalIntent!==this.modalIntent||workspace!==this.workspace.current||generation!==workspace?.draftGeneration||this.state.navigationOpen)return;
            if(returnFocus)this.navigationToggle?.focus();
            void this.switchProject(id);
        });
    };
    render() {
        const { boot, data } = this.state,tab=normalizeView(this.state.tab);
        const currentSession = data?.sessions.find(s => s.id === this.state.sessionId), experiment = data?.experiments.find(e => e.id === this.state.selectedExp), collaborationSessionId = currentSession?.taskId ? data?.teams.find(t => t.id === currentSession.teamId)?.rootSessionId ?? '' : this.state.sessionId;
        const inspector = data && boot ? <Inspector data={data} boot={boot} tab="chat" embedded sessionId={collaborationSessionId} inlineWorkflows={currentSession?.role==='coordinator'&&!currentSession.taskId} experiment={experiment} selectedRun={this.state.selectedRun} onRun={selectedRun=>experiment&&this.selectExperiment(experiment.id,selectedRun)} perform={this.perform} onConfig={() => {
            if (experiment) this.perform(async () => { const file = await api(`/experiments/${experiment.id}/files?path=config.json`); this.open('config', { ...file }); });
        }} onDirective={teamId => this.open('directive', teamId)}/> : null;
        return <div className={'app-shell' + (this.state.navigationOpen ? ' navigation-open' : '')} onKeyDown={event=>{if(event.key==='Escape'&&this.state.navigationOpen)this.toggleNavigation();}}><nav id="main-navigation" className="sidebar" aria-label="主导航"><div className="sidebar-brand"><a className="brand" href="#" onClick={(e: any) => { e.preventDefault(); this.setState({ tab: 'chat', navigationOpen: false }); }}><span>π</span><div>Pi Research<small>科研工作台</small></div></a><button id="navigation-close" className="icon-button mobile-navigation" aria-label="关闭导航" onClick={this.toggleNavigation}><Icon name="close"/></button></div>
 <label className="sidebar-project">项目<select aria-label="当前项目" value={data?.project.archived?'':this.state.projectId} onChange={(e: any) => {const id=String(e.target.value);this.chooseProject(id);}}>{nativeSelectButton}{data?.project.archived?<option value="" disabled>{data.project.name} · 已归档</option>:!boot?.projects.length?<option value="">尚未创建项目</option>:null}{boot?.projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><div className="sidebar-project-actions"><button className="new-project" onClick={() => this.setState({ navigationOpen: false },()=>void this.open('project'))}><Icon name="plus" size={16}/>新建项目</button><button className="text-button project-management-trigger" onClick={()=>this.setState({navigationOpen:false},()=>void this.open('projects'))}><Icon name="archive" size={15}/>项目管理</button></div>
  <div className="sidebar-body"><div className="nav-groups">{navigationGroups.map(group=><details key={group.name} open={group.name==='研究'||group.ids.includes(tab)}><summary>{group.name}</summary><div className="nav-list">{group.ids.map(id=>{const entry=navigation.find(item=>item[0]===id)!;return <button key={id} aria-current={id!=='chat'&&tab===id?'page':undefined} className={id!=='chat'&&tab===id?'active':''} disabled={id==='chat'&&(!this.state.projectId||this.state.busy||!!data?.project.archived)} onClick={()=>id==='chat'?this.newSession():this.selectTab(id)}><Icon name={entry[2]} size={18}/><span>{id==='chat'?'新建会话':entry[1]}</span></button>;})}</div></details>)}</div>
  <SessionList projectId={this.state.projectId} selectedId={this.state.sessionId} selected={currentSession} creationSignal={this.state.sessionCreationSignal} busy={this.state.busy} onSelect={id=>{this.setState({navigationOpen:false});this.selectSession(id);}}/></div><div className="sidebar-footer"><div className="local-avatar"><Icon name="folder"/></div><div><strong>本地工作空间</strong></div><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/></div></nav>
 {this.state.navigationOpen?<button className="navigation-backdrop" aria-label="收起导航" onClick={this.toggleNavigation}/>:null}<div className="workspace-shell" inert={this.state.navigationOpen?true:undefined}><header className="topbar"><button id="navigation-toggle" ref={node=>{this.navigationToggle=node;}} className="icon-button mobile-navigation" aria-label="打开导航" aria-expanded={this.state.navigationOpen} aria-controls="main-navigation" onClick={this.toggleNavigation}><Icon name="menu"/></button><div className="breadcrumb"><span>{data?.project.name??'项目'}</span><Icon name="chevron" size={12}/><strong>{navigation.find(item=>item[0]===tab)?.[1]??'研究会话'}</strong></div><div className="topbar-right"><span className={'connection-state ' + (this.state.connected ? 'ready' : '')}><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/>{this.state.connected ? '本地服务在线' : '正在重连'}</span></div></header>
 {data?.project.archived?<div className="project-readonly-notice" role="status"><Icon name="archive" size={16}/><span>已归档项目 · 只读查看会话、源码与已有成果</span><button className="text-button" onClick={()=>void this.open('projects')}>管理归档</button><button type="button" className="text-button" aria-expanded={this.state.archiveHistoryOpen} aria-controls="chat-task-drawer" onClick={this.toggleArchiveHistory}>{this.state.archiveHistoryOpen?'收起历史资料':'查看历史资料'}</button></div>:null}{this.state.eventNotice?<p className="small muted" role="status">{this.state.eventNotice}</p>:null}{this.state.error ? <div className="global-error" role="alert"><strong>操作未完成</strong><span>{this.state.error}</span><button className="icon-button" aria-label="关闭错误提示" onClick={() => this.setState({ error: '' })}><Icon name="close" size={16}/></button></div> : null}{this.state.notice ? <div className="toast" role="status"><Icon name="check" size={16}/>{this.state.notice}</div> : null}
 <ConversationLayout projectId={this.state.projectId} active={tab==='chat'} inspector={null} panel={<ConversationPanel ref={this.conversationPanel} key={this.state.projectId} projectId={this.state.projectId} active={tab==='chat'} data={data} collaboration={inspector} experimentDetails={inspector?React.cloneElement(inspector,{tab:'experiments',inlineWorkflows:false}):null} selectedExperiment={this.state.selectedExp} onExperiment={this.selectExperiment} onWorkspace={()=>this.selectTab('workspace')} onChooseProject={()=>{if(boot?.projects.length){this.setState({navigationOpen:true},()=>document.querySelector<HTMLSelectElement>('.sidebar-project select')?.focus());}else void this.open('project');}} onRetry={()=>void this.refresh()} error={this.state.error}/>}>
 <main className={'main-pane page-' + tab + (tab === 'chat' ? ' chat-pane' : '')}>
{boot&&data?<div className="chat-view-container" hidden={tab!=='chat'}><Chat ref={this.chat} key={data.project.id+':'+this.state.sessionId} data={data} boot={boot} session={currentSession} archivedHistory={data.project.archived&&this.state.archiveHistoryOpen?<ArchivedResearchHistory key={data.project.id} data={data} perform={this.perform}/>:null} onArchivedHistoryClose={()=>this.setState({archiveHistoryOpen:false})} onRegister={(artifactId,content)=>this.open('evidence',{artifactId,content})} onClaim={()=>this.open('claim')} onUseDocument={this.useParsedDocument} onSources={()=>this.selectTab('integrations')} onCampaign={this.selectCampaign} onModelConfirmed={this.confirmSessionModel} onBranchConfirmed={this.confirmSessionBranch} onMessageConfirmed={this.confirmSessionMessage} busy={this.state.busy} messages={this.state.messages} pendingMessages={this.state.pendingMessages} pendingTotal={this.state.pendingTotal} pendingNextCursor={this.state.pendingNextCursor} canSteer={this.state.canSteer} history={this.state.history} historyAnchor={this.state.historyAnchor} onHistory={this.selectHistory} stream={this.state.stream} streamTruncated={this.state.streamTruncated} activity={this.state.activity} perform={this.perform} onToggle={() => this.toggle()} onNew={() => this.newSession()} onExperiments={this.showExperiments} onWorkspace={() => this.setState({ tab: 'workspace' })} onSession={id=>this.selectSession(id)} onExperiment={this.selectExperiment} onRun={(runId,experimentId)=>this.selectExperiment(experimentId,runId)}/></div>:null}
{boot&&data?<div hidden={tab!=='workspace'}><WorkspaceView ref={this.workspace} key={data.project.id} data={data} perform={this.perform}/></div>:null}
 {!boot ? <div className="boot-screen">正在读取本地项目…</div> : tab === 'settings' ? <SettingsView boot={boot} data={data??undefined} readOnly={data?.project.archived} projectId={this.state.projectId} session={currentSession} perform={this.perform}/> : tab === 'environment' ? <EnvironmentView/> : !data ? <div className="first-project"><div className="welcome-mark">π</div><h1>每一个研究，<br />从清晰的起点开始。</h1><p>建立本地项目，保存源代码、实验快照和证据。<br />也可以先运行随包的真实数值示例，检查完整流程。</p><button className="primary" onClick={() => void this.open('project')}>创建第一个项目 <Icon name="arrow" size={17}/></button></div> :
                tab === 'chat' ? null :
                        tab === 'workspace' ? null :
                            tab === 'integrations' ? <IntegrationsView key={data.project.id} projectId={data.project.id} sessionId={this.state.sessionId} refreshToken={data} readOnly={data.project.archived}/> : null}

 </main></ConversationLayout></div>{this.modalView()}</div>;
    }
}
