import * as React from 'react';
import {ProjectEventFeed} from './event-feed.js';
import {EnvironmentView} from './environment-view.js';
import {IntegrationsView} from './integrations.js';
import { api } from './api.js';
import type { Bootstrap, Project, ProjectState, Row, Session, SessionCatalogItem, SessionCatalogPage, DocumentLocation, SessionHistoryPage, SessionView } from './models.js';
import { short, label } from './models.js';
import {Icon, Modal, nativeSelectButton} from './ui.js';
import { Chat, Experiments, Inspector, type Perform } from './workbench.js';
import type {QueueMessage} from './message-queue.js';
import {SessionList} from './session-list.js';
import {ProjectCreationModal} from './github-controls.js';
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from './data-views.js';
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
    sessionCreationSignal:number;
}
const navigation = [['chat', '研究会话', 'chat'], ['environment','环境','settings'], ['experiments', '实验与运行', 'experiment'], ['workspace', '项目工作区', 'folder'], ['literature', '文献检索', 'search'], ['integrations', '技能与连接器', 'skills'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report'], ['settings', '设置与能力', 'settings']];
const navigationGroups = [
    { name: '研究', ids: ['chat', 'experiments'] },
    { name: '管理', ids: ['integrations', 'environment', 'settings'] },
];
const normalizeView = (tab:string) => tab==='scheduler'?'environment':['campaigns','implementation','changes'].includes(tab) ? 'chat' : tab;
function saved() {
    try {
        return JSON.parse(localStorage.getItem('pi-research-ui-v1') ?? '{}');
    }
    catch {
        return {};
    }
}
export class App extends React.Component<{}, State> {
    state: State = { boot: null, data: null, projectId: saved().projectId ?? '', sessionId: saved().sessionId ?? '', tab: normalizeView(saved().tab ?? 'chat'), selectedExp: saved().selectedExp ?? '', selectedRun:saved().selectedRun??'',selectedReport:saved().selectedReport??'',selectedCampaign:saved().selectedCampaign??'',selectedDiscoveryGrant:saved().selectedDiscoveryGrant??'',selectedDocument:saved().selectedDocument??null, messages: [],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false, history:null,historyAnchor:saved().historyAnchor&&saved().historyAnchor.projectId===saved().projectId&&saved().historyAnchor.sessionId===saved().sessionId?saved().historyAnchor.anchor:null, stream: '',streamTruncated:false,activity:null,eventNotice:'', modal: '', modalData: null, busy: false, error: '', notice: '', connected: false, navigationOpen: false,sessionCreationSignal:0 };
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
    private creatingSession=false;
    private noticeTimer?: number;
    componentDidMount() {
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
        const epoch=this.refreshEpoch,controller=new AbortController();this.readController=controller;
        try{
            const boot=await api<Bootstrap>('/bootstrap',undefined,'GET',controller.signal);
            const projectId=boot.projects.some(p=>p.id===this.state.projectId)?this.state.projectId:boot.projects[0]?.id??'';
            const requestedSession=projectId===this.state.projectId?this.state.sessionId:'';
            let data=projectId?await api<ProjectState>(`/projects/${projectId}/state${requestedSession?'?sessionId='+encodeURIComponent(requestedSession):''}`,undefined,'GET',controller.signal):null;
            const sessionId=requestedSession||(data?.sessions.find(s=>s.role==='coordinator'&&s.state!=='archived')?.id??'');
            const anchor=requestedSession?this.state.historyAnchor:null;
            const view=sessionId?await api<CurrentSessionView>(`/sessions/${sessionId}/view${anchor?'?'+(anchor.direction==='before'?'beforeMessageId':'afterMessageId')+'='+encodeURIComponent(anchor.id):''}`,undefined,'GET',controller.signal):null;
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(view&&view.session.id!==sessionId)throw Error('会话快照与当前选择不一致');
            if(data&&view)data={...data,sessions:data.sessions.some(s=>s.id===sessionId)?data.sessions.map(s=>s.id===sessionId?view.session:s):[...data.sessions,view.session]};
            const active=!!view?.progress.active&&view.progress.generation===view.session.generation;
            const requestedExp=projectId===this.state.projectId?this.state.selectedExp:this.experimentSelections[projectId]??'';
            const selectedExp=data?.experiments.some(e=>e.id===requestedExp)?requestedExp:data?.experiments[0]?.id??'';
            await new Promise<void>(resolve=>this.setState({boot,data,projectId,sessionId,messages:view?.messages??[],pendingMessages:view?.pendingMessages??[],pendingTotal:view?.pendingTotal??0,pendingNextCursor:view?.pendingNextCursor??null,canSteer:view?.progress?.canSteer??false,history:view?.history??null,historyAnchor:anchor,selectedExp,stream:!anchor&&active?view!.progress.content:'',streamTruncated:!anchor&&active&&!!view?.progress.truncated,activity:!anchor&&active?view?.progress.activity??null:null,connected:true},resolve));
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(this.feed?.projectId!==projectId){this.feed?.stop();this.feed=undefined;if(projectId){const feed=new ProjectEventFeed(projectId,()=>this.refresh(true),eventNotice=>{if(this.mounted&&this.feed===feed)this.setState({eventNotice});});this.feed=feed;feed.start();}}
            return true;
        }catch(error){
            if(!this.mounted||epoch!==this.refreshEpoch||controller.signal.aborted)return false;
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
    private sessionSelection(id:string,tab=this.state.tab):Pick<State,'sessionId'|'tab'|'messages'|'pendingMessages'|'pendingTotal'|'pendingNextCursor'|'canSteer'|'history'|'historyAnchor'|'stream'|'streamTruncated'|'activity'|'error'> {
        return {sessionId:id,tab:normalizeView(tab),messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',streamTruncated:false,activity:null,error:''};
    }
    switchProject(id: string) { this.projectSelectionEpoch++;if(this.state.data?.experiments.some(e=>e.id===this.state.selectedExp))this.experimentSelections[this.state.projectId]=this.state.selectedExp;this.invalidateRead();this.feed?.stop();this.feed=undefined; this.setState({ ...this.sessionSelection(''),projectId: id, selectedExp: this.experimentSelections[id]??'', navigationOpen:false, selectedRun:'',selectedReport:'',selectedCampaign:'',selectedDiscoveryGrant:'',selectedDocument:null,eventNotice:'', data: null }, () => { void this.refresh(); }); }
    selectSession(id: string,tab='chat') { this.invalidateRead(); this.setState(this.sessionSelection(id,tab), () => { void this.refresh(); }); }
    selectExperiment=(id:string,runId='')=>{const data=this.state.data;if(!data?.experiments.some(e=>e.id===id)||runId&&!data.runs.some(r=>r.id===runId&&r.experimentId===id)){this.setState({error:'指定实验或运行不在当前项目中。'});return;}this.invalidateRead();this.setState({selectedExp:id,selectedRun:runId,tab:'experiments'});};
    selectHistory=(anchor:{direction:'before'|'after';id:string}|null)=>{this.invalidateRead();this.setState({messages:[],historyAnchor:anchor,stream:'',streamTruncated:false,activity:null},()=>void this.refresh());};
    open(modal: string, data: any = null) { this.setState({ modal, modalData: data, error: '' }); }
    close = () => {
        if (!this.state.busy)
            this.setState({ modal: '', modalData: null });
    };
    useParsedDocument=(target:{documentVersionId:string;parseResultId:string})=>{
        const projectId=this.state.projectId,sessionId=this.state.sessionId,epoch=this.projectSelectionEpoch;
        const current=()=>{const s=this.state.data?.sessions.find(s=>s.id===sessionId);return this.mounted&&this.state.projectId===projectId&&this.state.sessionId===sessionId&&this.projectSelectionEpoch===epoch&&!this.state.data?.project.archived&&s?.role==='coordinator'&&!s.taskId&&!s.teamId&&s.state!=='archived';};
        if(this.state.busy||!current())return;
        void this.perform(async()=>{if(!current())return;await api(`/sessions/${encodeURIComponent(sessionId)}/messages`,{content:'我选择将这份固定解析资料带入当前会话。请先核对资料，再与我明确需要视觉读取的物理页范围；资料附件本身不授予原文或图片读取权限。',parsedDocumentAttachments:[target]});if(current())this.selectSession(sessionId,'chat');},'已带入固定解析资料；视觉页范围仍需准确批准');
    };
    async newSession() {
        const projectId=this.state.projectId,currentSessionId=this.state.sessionId,epoch=this.projectSelectionEpoch;
        if (!this.mounted||!projectId||this.state.busy||this.creatingSession)
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
                    if(!session){session=await api<Row<Session>>('/sessions',{projectId,title:'新的研究会话'});if(!current())return;}
                    const closeNavigation=this.state.navigationOpen,sessionId=session.id;
                    await new Promise<void>(resolve=>this.setState({...this.sessionSelection(sessionId,'chat'),navigationOpen:false,sessionCreationSignal:this.state.sessionCreationSignal+1},()=>{if(closeNavigation)this.navigationToggle?.focus();resolve();}));
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
        const done = () => this.setState({ modal: '', modalData: null });
        if (modal === 'project')
            return <ProjectCreationModal {...base} onCreate={(input,key)=>this.perform(async()=>{const p=await api<Row<Project>>('/projects',input,'POST',undefined,key);const s=await api<Row<Session>>('/sessions',{projectId:p.id,title:'研究主会话'},'POST',undefined,key+'-session');await new Promise<void>(resolve=>this.setState({...this.sessionSelection(s.id,'chat'),projectId:p.id,selectedExp:'',selectedRun:'',selectedReport:'',selectedCampaign:'',selectedDiscoveryGrant:'',selectedDocument:null,data:null},resolve));done();},input.github?'本地项目已创建；GitHub 同步状态可在设置中查看。':'本地项目已创建')}/>;
        if (modal === 'config')
            return <Modal {...base} wide title="实验只读配置" submitLabel="关闭配置" onSubmit={() => done()}><p className="small muted">配置由研究对话中的智能体管理。</p><label>配置源码<textarea aria-label="配置源码" className="code-input" rows={12} readOnly defaultValue={modalData.content}/></label></Modal>;
        if (modal === 'directive')
            return <Modal {...base} title="给团队发送指令" submitLabel="保存指令" onSubmit={fd => this.perform(async () => { await api(`/teams/${modalData}/directives`, { kind: fd.get('kind'), content: fd.get('content') }); done(); })}><label>指令语义<select name="kind">{nativeSelectButton}<option value="steer">引导当前工作 · 不修改研究目标</option><option value="follow_up">后续指令 · 当前任务结束后处理</option><option value="revise">改变研究目标 · 旧任务失效，暂停重新规划</option></select></label><label>指令内容<textarea name="content" rows={6} required/></label><p className="small muted">修改目标会保存新需求版本，不删除已有实验或结果。取消正式 Run 需单独操作。</p></Modal>;
        if (modal === 'evidence')
            return <Modal {...base} wide title="登记原文证据" submitLabel="保存证据" onSubmit={fd => this.perform(async () => { await api('/evidence', { projectId: data!.project.id, artifactId: modalData.artifactId, start: Number(fd.get('start')), end: Number(fd.get('end')), description: fd.get('description') }); done(); }, '证据已定位并校验')}><label>证据说明<input name="description" required placeholder="此片段用于支持什么观察？"/></label><div className="form-columns"><label>起始字符<input type="number" name="start" min={0} defaultValue={0}/></label><label>结束字符<input type="number" name="end" min={1} max={modalData.content.length} defaultValue={Math.min(modalData.content.length, 2000)}/></label></div><p className="small muted">使用 JavaScript UTF-16 字符位置，不是 PDF 页码或日志字节位置。</p><pre className="modal-preview">{modalData.content.slice(0, 4000)}</pre></Modal>;
        if (modal === 'claim')
            return <Modal {...base} title="提出结论候选" submitLabel="保存候选待验收" onSubmit={fd => this.perform(async () => { await api('/claims', { projectId: data!.project.id, statement: fd.get('statement'), evidenceIds: [fd.get('evidenceId')], limitations: String(fd.get('limitations')).split('\n').filter(Boolean) }); done(); })}><label>结论陈述<textarea name="statement" required rows={4}/></label><label>证据来源<select name="evidenceId">{nativeSelectButton}{data!.evidence.map(e => <option value={e.id} key={e.id}>{e.description} · {short(e.id)}</option>)}</select></label><label>限制（每行一条）<textarea name="limitations" required placeholder="样本规模、条件、未执行的验证等"/></label></Modal>;
        return null;
    }
    selectTab = (tab:string) => {
        const returnFocus=this.state.navigationOpen;
        this.setState({tab:normalizeView(tab),navigationOpen:false},()=>{if(returnFocus)this.navigationToggle?.focus();});
    };
    toggleNavigation = () => {
        const navigationOpen = !this.state.navigationOpen;
        this.setState({ navigationOpen }, () => document.getElementById(navigationOpen ? 'navigation-close' : 'navigation-toggle')?.focus());
    };
    render() {
        const { boot, data, tab } = this.state;
        const currentSession = data?.sessions.find(s => s.id === this.state.sessionId), experiment = data?.experiments.find(e => e.id === this.state.selectedExp), collaborationSessionId = currentSession?.taskId ? data?.teams.find(t => t.id === currentSession.teamId)?.rootSessionId ?? '' : this.state.sessionId;
        return <div className={'app-shell' + (this.state.navigationOpen ? ' navigation-open' : '')} onKeyDown={event=>{if(event.key==='Escape'&&this.state.navigationOpen)this.toggleNavigation();}}><nav id="main-navigation" className="sidebar" aria-label="主导航"><div className="sidebar-brand"><a className="brand" href="#" onClick={(e: any) => { e.preventDefault(); this.setState({ tab: 'chat', navigationOpen: false }); }}><span>π</span><div>Pi Research<small>科研工作台</small></div></a><button id="navigation-close" className="icon-button mobile-navigation" aria-label="关闭导航" onClick={this.toggleNavigation}><Icon name="close"/></button></div>
 <label className="sidebar-project">项目<select aria-label="当前项目" value={this.state.projectId} onChange={(e: any) => this.switchProject(e.target.value)}>{nativeSelectButton}{!boot?.projects.length ? <option value="">尚未创建项目</option> : boot.projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><button className="new-project" onClick={() => this.setState({ navigationOpen: false },()=>this.open('project'))}><Icon name="plus" size={16}/>新建项目</button>
  <div className="sidebar-body"><div className="nav-groups">{navigationGroups.map(group=><details key={group.name} open={group.name==='研究'||group.ids.includes(tab)}><summary>{group.name}</summary><div className="nav-list">{group.ids.map(id=>{const entry=navigation.find(item=>item[0]===id)!;return <button key={id} aria-current={id!=='chat'&&tab===id?'page':undefined} className={id!=='chat'&&tab===id?'active':''} disabled={id==='chat'&&(!this.state.projectId||this.state.busy)} onClick={()=>id==='chat'?this.newSession():this.selectTab(id)}><Icon name={entry[2]} size={18}/><span>{id==='chat'?'新建会话':entry[1]}</span>{id==='experiments'&&data?.experiments.length?<em>{data.experiments.length}</em>:null}</button>;})}</div></details>)}</div>
  <SessionList projectId={this.state.projectId} selectedId={this.state.sessionId} selected={currentSession} creationSignal={this.state.sessionCreationSignal} busy={this.state.busy} onSelect={id=>{this.setState({navigationOpen:false});this.selectSession(id);}}/></div><div className="sidebar-footer"><div className="local-avatar"><Icon name="folder"/></div><div><strong>本地工作空间</strong><small>数据由你掌握</small></div><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/></div></nav>
 {this.state.navigationOpen?<button className="navigation-backdrop" aria-label="收起导航" onClick={this.toggleNavigation}/>:null}<div className="workspace-shell" inert={this.state.navigationOpen?true:undefined}><header className="topbar"><button id="navigation-toggle" ref={node=>{this.navigationToggle=node;}} className="icon-button mobile-navigation" aria-label="打开导航" aria-expanded={this.state.navigationOpen} aria-controls="main-navigation" onClick={this.toggleNavigation}><Icon name="menu"/></button><div className="breadcrumb"><span>{data?.project.name??'项目'}</span><Icon name="chevron" size={12}/><strong>{navigation.find(item=>item[0]===tab)?.[1]??'研究会话'}</strong></div><div className="topbar-right"><details id="workspace-tool-menu" className="workspace-tool-menu"><summary aria-label="工作区工具" title="查看文件、文献、证据与成果"><Icon name="folder" size={18}/><span>工作区</span></summary><div className="workspace-tool-items">{navigation.filter(item=>['workspace','literature','evidence','reports'].includes(item[0])).map(([id,name,icon])=><button key={id} aria-current={tab===id?'page':undefined} className={tab===id?'active':''} onClick={event=>{const menu=event.currentTarget.closest('details');menu?.removeAttribute('open');menu?.querySelector('summary')?.focus();this.selectTab(id);}}><Icon name={icon} size={17}/><span>{name}</span></button>)}</div></details><span className={'connection-state ' + (this.state.connected ? 'ready' : '')}><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/>{this.state.connected ? '本地服务在线' : '正在重连'}</span></div></header>
 {this.state.eventNotice?<p className="small muted" role="status">{this.state.eventNotice}</p>:null}{this.state.error ? <div className="global-error" role="alert"><strong>操作未完成</strong><span>{this.state.error}</span><button className="icon-button" aria-label="关闭错误提示" onClick={() => this.setState({ error: '' })}><Icon name="close" size={16}/></button></div> : null}{this.state.notice ? <div className="toast" role="status"><Icon name="check" size={16}/>{this.state.notice}</div> : null}
 <div className={'workbench-content ' + (['chat', 'experiments'].includes(tab) && data ? 'with-inspector' : '')}>
 <main className={'main-pane page-' + tab + (tab === 'chat' ? ' chat-pane' : '')}>
{boot&&data?<div className="chat-view-container" hidden={tab!=='chat'}><Chat key={data.project.id+':'+(currentSession?.id??'')} data={data} boot={boot} session={currentSession} busy={this.state.busy} messages={this.state.messages} pendingMessages={this.state.pendingMessages} pendingTotal={this.state.pendingTotal} pendingNextCursor={this.state.pendingNextCursor} canSteer={this.state.canSteer} history={this.state.history} historyAnchor={this.state.historyAnchor} onHistory={this.selectHistory} stream={this.state.stream} streamTruncated={this.state.streamTruncated} activity={this.state.activity} perform={this.perform} onToggle={() => this.toggle()} onNew={() => this.newSession()} onExperiments={() => this.setState({ tab: 'experiments' })} onWorkspace={() => this.setState({ tab: 'workspace' })} onSession={id=>this.selectSession(id)} onExperiment={this.selectExperiment} onRun={(runId,experimentId)=>this.selectExperiment(experimentId,runId)}/></div>:null}
 {!boot ? <div className="boot-screen">正在读取本地项目…</div> : tab === 'settings' ? <SettingsView boot={boot} projectId={this.state.projectId} session={currentSession} perform={this.perform}/> : tab === 'environment' ? <EnvironmentView/> : !data ? <div className="first-project"><div className="welcome-mark">π</div><h1>每一个研究，<br />从清晰的起点开始。</h1><p>建立本地项目，保存源代码、实验快照和证据。<br />也可以先运行随包的真实数值示例，检查完整流程。</p><button className="primary" onClick={() => this.open('project')}>创建第一个项目 <Icon name="arrow" size={17}/></button><p className="small muted">Pi 是唯一 Agent 执行内核。没有 ORX 运行时依赖。</p></div> :
                tab === 'chat' ? null :
                    tab === 'experiments' ? <Experiments key={data.project.id} onSession={id=>this.selectSession(id)} onChat={()=>this.setState({tab:'chat'})} data={data} selected={this.state.selectedExp} onSelect={selectedExp => { this.invalidateRead(); this.setState({ selectedExp,selectedRun:'' }); }} onRun={(selectedRun,selectedExp)=>{if(!data.runs.some(r=>r.id===selectedRun&&r.experimentId===selectedExp)||!data.experiments.some(e=>e.id===selectedExp)){this.setState({error:'指定 Run 不在当前项目中，未跳转到其他运行。'});return;}this.invalidateRead();this.setState({selectedRun,selectedExp});}}/> :
                        tab === 'workspace' ? <WorkspaceView key={data.project.id} data={data} perform={this.perform}/> :
                            tab === 'integrations' ? <IntegrationsView key={data.project.id} projectId={data.project.id} sessionId={this.state.sessionId} refreshToken={data} readOnly={data.project.archived} onLiterature={()=>this.setState({tab:'literature'})}/> :
                            tab === 'literature' ? <LiteratureView key={data.project.id} data={data} perform={this.perform} session={currentSession} onUseDocument={this.useParsedDocument} selectedDiscoveryGrant={this.state.selectedDiscoveryGrant} onSelectDiscoveryGrant={selectedDiscoveryGrant=>this.setState({selectedDiscoveryGrant})} onSession={id=>this.selectSession(id)} selectedDocument={this.state.selectedDocument??undefined} onDocument={selectedDocument=>this.setState({selectedDocument})} onSources={()=>this.setState({tab:'integrations'})}/> :
                                tab === 'evidence' ? <EvidenceView onDocument={selectedDocument=>this.setState({selectedDocument,tab:'literature'})} key={data.project.id} data={data} perform={this.perform} onRegister={(artifactId, content) => this.open('evidence', { artifactId, content })} onClaim={() => this.open('claim')}/> :
                                    tab === 'reports' ? <ReportsView onCampaign={selectedCampaign=>{const clearHistory={messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,stream:'',streamTruncated:false};const campaign=data.campaigns.find(c=>c.id===selectedCampaign);if(!campaign){this.setState({...clearHistory,error:'指定研究活动不在当前项目中，未跳转到其他活动。'});return;}if(!campaign.rootSessionId){this.setState({...clearHistory,error:'指定研究活动没有可打开的主会话。'});return;}this.setState({selectedCampaign},()=>this.selectSession(campaign.rootSessionId));}} onSession={id=>this.selectSession(id)} onDocument={selectedDocument=>this.setState({selectedDocument,tab:'literature'})} key={data.project.id} data={data} perform={this.perform} selectedReport={this.state.selectedReport} onSelect={selectedReport=>this.setState({selectedReport})} onRun={(selectedRun,selectedExp)=>{if(!data.runs.some(r=>r.id===selectedRun&&r.experimentId===selectedExp)||!data.experiments.some(e=>e.id===selectedExp)){this.setState({error:'指定报告 Run 不在当前项目中，未跳转到其他运行。'});return;}this.invalidateRead();this.setState({selectedRun,selectedExp,tab:'experiments'});}}/> : null}
 </main>{data && boot && ['chat', 'experiments'].includes(tab) ? <Inspector data={data} boot={boot} tab={tab} sessionId={collaborationSessionId} inlineWorkflows={tab==='chat'&&currentSession?.role==='coordinator'&&!currentSession.taskId} experiment={experiment} selectedRun={this.state.selectedRun} onRun={selectedRun=>this.setState({selectedRun})} perform={this.perform} onConfig={() => {
                    if (experiment)
                        this.perform(async () => { const file = await api(`/experiments/${experiment.id}/files?path=config.json`); this.open('config', { ...file }); });
                }} onDirective={teamId => this.open('directive', teamId)}/> : null}</div></div>{this.modalView()}</div>;
    }
}
