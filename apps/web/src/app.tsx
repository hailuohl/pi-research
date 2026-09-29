import * as React from 'react';
import {ProjectEventFeed} from './event-feed.js';
import {SchedulerView} from './scheduler-view.js';
import {IntegrationsView} from './integrations.js';
import {ChangesView} from './changes.js';
import {ImplementationView} from './implementation.js';
import { CampaignView } from './campaigns.js';
import { api, ApiError, hasToken, setToken } from './api.js';
import type { Bootstrap, ProjectState, Row, DocumentLocation, SessionHistoryPage, SessionView } from './models.js';
import { short, label } from './models.js';
import { Icon, Modal, Empty } from './ui.js';
import { Chat, Experiments, Inspector, type Perform } from './workbench.js';
import {SessionList} from './session-list.js';
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from './data-views.js';
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
    selectedRunGrant:string;
    selectedDiscoveryGrant:string;
    selectedDocument:DocumentLocation|null;
    messages: SessionView['messages'];
    history:SessionHistoryPage|null;
    historyAnchor:{direction:'before'|'after';id:string}|null;
    stream: string;
    streamTruncated:boolean;
    eventNotice:string;
    modal: string;
    modalData: any;
    busy: boolean;
    error: string;
    notice: string;
    connected: boolean;
    tokenDraft: string;
    loggedIn: boolean;
}
const navigation = [['chat', '研究会话', 'chat'], ['scheduler','资源与调度','settings'], ['implementation','实现与审查','branch'], ['campaigns', '研究活动', 'branch'], ['experiments', '实验与运行', 'experiment'], ['workspace', '项目工作区', 'folder'], ['changes','变更提案','branch'], ['literature', '文献检索', 'search'], ['integrations', '技能与连接器', 'settings'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report'], ['settings', '设置与能力', 'settings']];
const manualTasks = [{ key: 'sources', role: 'literature', objective: '整理用户已提供资料及候选文献；检索策略与最终排序由主协调者负责。明确未阅读的全文。', dependencies: [] }, { key: 'analysis', role: 'analyst', objective: '核查已有运行指标及其证据；缺少必要输入则阻塞，不编造结果。', dependencies: [], critical: true }, { key: 'review', role: 'reviewer', objective: '独立核查分析结论与真实证据。', dependencies: ['sources'], reviewOf: 'analysis' }, { key: 'report', role: 'writer', objective: '根据已验收的输入形成实际报告产物，说明限制。', dependencies: ['analysis', 'review'], expectedOutputs:[{kind:'report',schemaId:'report',required:true}], acceptanceRuleIds:['artifact-required'] }];
function saved() {
    try {
        return JSON.parse(localStorage.getItem('pi-research-ui-v1') ?? '{}');
    }
    catch {
        return {};
    }
}
class ExperimentModal extends React.Component<{
    busy:boolean; parent?:any; onClose:()=>void; perform:Perform; onSave:(input:any)=>Promise<void>;
}, {runner:string; metrics:number[];error:string}> {
    state={runner:'trusted-example',metrics:[0],error:''};
    private nextMetric=1;
    render() {
        const {parent,busy,onClose,perform,onSave}=this.props,docker=!parent&&this.state.runner==='docker';
        return <Modal busy={busy} onClose={onClose} wide title={parent?'派生子实验':'建立实验草案'} submitLabel="保存实验草案" onSubmit={fd=>perform(async()=>{
            this.setState({error:''});
            try {
            const config=String(fd.get('config')??'').trim();
            const input:any={title:fd.get('title'),hypothesis:fd.get('hypothesis'),...(parent?{parentId:parent.id}:{}),...(config?{config:JSON.parse(config)}:{})};
            if(docker){
                const metrics:Record<string,{unit:string;direction:string}>=Object.create(null);
                for(const id of this.state.metrics){const name=String(fd.get(`metric-${id}`)).trim();if(Object.prototype.hasOwnProperty.call(metrics,name))throw Error('指标名称不能重复');metrics[name]={unit:String(fd.get(`unit-${id}`)).trim(),direction:String(fd.get(`direction-${id}`))};}
                const outputs=String(fd.get('outputs')).split(/\r?\n/).map(p=>p.trim()).filter(Boolean);
                const args=String(fd.get('args')??'');
                input.contract={runner:'docker',image:String(fd.get('image')).trim(),dockerContext:String(fd.get('context')).trim(),command:[String(fd.get('executable')).trim(),...(args?args.split(/\r?\n/):[])],environment:{},datasetVersion:String(fd.get('dataset')).trim(),evaluationProtocolVersion:String(fd.get('protocol')).trim(),metrics,expectedArtifacts:[...new Set(['metrics.json',...outputs])],cpus:Number(fd.get('cpus')),memoryMb:Number(fd.get('memory')),timeoutSeconds:Number(fd.get('timeout'))};
            }
            await onSave(input);
            } catch(error){this.setState({error:error instanceof Error?error.message:String(error)});throw error;}
        })}>
            {this.state.error?<p role="alert" className="error-text">{this.state.error}</p>:null}
            <label>实验名称<input name="title" aria-label="实验名称" defaultValue={parent?'新候选实验':'基线实验'} required maxLength={200}/></label>
            <label>研究假设<textarea name="hypothesis" aria-label="研究假设" required placeholder="要检验的假设、对照条件和预期结果"/></label>
            {parent?<p className="notice">继承父实验运行协议：{parent.contract.runner==='docker'?'Docker':'受信数值示例'}，入口 {parent.contract.command.join(' ')}。此处不修改镜像、指标或资源契约。</p>:<label>运行方式<select name="runner" aria-label="运行方式" value={this.state.runner} onChange={(e:any)=>this.setState({runner:e.target.value})}><option value="trusted-example">受信曲线拟合示例</option><option value="docker">Docker · 自有研究程序</option></select></label>}
            {docker?<div>
                <label>固定镜像摘要<input name="image" aria-label="固定镜像摘要" required placeholder="python@sha256:…" pattern=".+@sha256:[a-f0-9]{64}" maxLength={250}/></label>
                <label>本地 Docker context<input name="context" aria-label="Docker context" defaultValue="desktop-linux" required maxLength={100}/></label>
                <p className="small muted">填写本机已配置的 Linux Docker context 和已存在的固定镜像；保存不会下载镜像，也不代表引擎验证通过。</p>
                <label>可执行程序<input name="executable" aria-label="可执行程序" defaultValue="python" required/></label>
                <label>参数（每行一个，保留空格）<textarea name="args" aria-label="程序参数" defaultValue="main.py" rows={3}/></label>
                <div className="form-columns"><label>数据版本<input name="dataset" aria-label="数据版本" required placeholder="例如 dataset-v1" maxLength={200}/></label><label>评估协议版本<input name="protocol" aria-label="评估协议版本" required placeholder="例如 holdout-v1" maxLength={200}/></label></div>
                <fieldset><legend>实测指标</legend>{this.state.metrics.map((id,index)=><div className="form-columns" key={id}><label>指标名称 {index+1}<input name={`metric-${id}`} required maxLength={80} defaultValue={index===0?'mse':''}/></label><label>单位 {index+1}<input name={`unit-${id}`} required maxLength={100} placeholder="例如 dimensionless"/></label><label>方向 {index+1}<select name={`direction-${id}`}><option value="min">越低越好</option><option value="max">越高越好</option></select></label><button type="button" className="text-button" disabled={this.state.metrics.length===1} onClick={()=>this.setState({metrics:this.state.metrics.filter(n=>n!==id)})}>移除指标 {index+1}</button></div>)}<button type="button" className="secondary compact" onClick={()=>this.setState({metrics:[...this.state.metrics,this.nextMetric++]})}>添加指标</button></fieldset>
                <label>必需产物（每行一个相对路径）<textarea name="outputs" aria-label="必需产物" defaultValue="metrics.json" rows={3}/></label><p className="small muted">metrics.json 始终必需；程序将指标及文件写入 PI_OUTPUT_DIR 指定的输出目录。</p>
                <div className="form-columns"><label>CPU 核数<input name="cpus" type="number" min={1} max={64} defaultValue={1} required/></label><label>内存 MiB<input name="memory" type="number" min={64} max={65536} defaultValue={256} required/></label><label>超时秒数<input name="timeout" type="number" min={1} max={86400} defaultValue={60} required/></label></div>
            </div>:null}
            <label>版本化配置 JSON（可选）<textarea key={parent?.id??this.state.runner} name="config" aria-label="版本化配置 JSON" className="code-input" defaultValue={(parent?.contract.runner??this.state.runner)==='trusted-example'?JSON.stringify({polynomialDegree:parent?2:1,ridge:0.000001},null,2):''} rows={5}/></label>
            <p className="small muted">留空保留来源文件；填写时将配置保存为 config.json。创建实验不会运行代码，正式运行另行准备并批准。</p>
        </Modal>;
    }
}
export class App extends React.Component<{}, State> {
    state: State = { boot: null, data: null, projectId: saved().projectId ?? '', sessionId: saved().sessionId ?? '', tab: saved().tab ?? 'chat', selectedExp: saved().selectedExp ?? '', selectedRun:saved().selectedRun??'',selectedReport:saved().selectedReport??'',selectedCampaign:saved().selectedCampaign??'',selectedRunGrant:saved().selectedRunGrant??'',selectedDiscoveryGrant:saved().selectedDiscoveryGrant??'',selectedDocument:saved().selectedDocument??null, messages: [], history:null,historyAnchor:saved().historyAnchor&&saved().historyAnchor.projectId===saved().projectId&&saved().historyAnchor.sessionId===saved().sessionId?saved().historyAnchor.anchor:null, stream: '',streamTruncated:false,eventNotice:'', modal: '', modalData: null, busy: false, error: '', notice: '', connected: false, tokenDraft: '', loggedIn: hasToken() };
    private timer?: number;
    private refreshing?:Promise<boolean>;
    private refreshEpoch = 0;
    private readController?:AbortController;
    private feed?:ProjectEventFeed;
    private mounted=true;
    private noticeTimer?: number;
    componentDidMount() {
        if(this.state.loggedIn)void this.refresh();
        this.timer=window.setInterval(()=>{if(this.state.loggedIn){if(this.feed)this.feed.wake();else void this.refresh(true);}},20000);
    }
    componentWillUnmount(){this.mounted=false;this.invalidateRead();this.feed?.stop();clearInterval(this.timer);clearTimeout(this.noticeTimer);}
    componentDidUpdate(_:any,prev:State){
        if(['projectId','sessionId','tab','selectedExp','selectedRun','selectedReport','selectedCampaign','selectedRunGrant','selectedDiscoveryGrant','selectedDocument','historyAnchor'].some(k=>(prev as any)[k] !==(this.state as any)[k]))
            localStorage.setItem('pi-research-ui-v1',JSON.stringify({projectId:this.state.projectId,sessionId:this.state.sessionId,tab:this.state.tab,selectedExp:this.state.selectedExp,selectedRun:this.state.selectedRun,selectedReport:this.state.selectedReport,selectedCampaign:this.state.selectedCampaign,selectedRunGrant:this.state.selectedRunGrant,selectedDiscoveryGrant:this.state.selectedDiscoveryGrant,selectedDocument:this.state.selectedDocument,historyAnchor:{projectId:this.state.projectId,sessionId:this.state.sessionId,anchor:this.state.historyAnchor}}));
        if(!this.state.loggedIn&&prev.loggedIn){this.feed?.stop();this.feed=undefined;this.invalidateRead();}
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
            const view=sessionId?await api<SessionView>(`/sessions/${sessionId}/view${anchor?'?'+(anchor.direction==='before'?'beforeMessageId':'afterMessageId')+'='+encodeURIComponent(anchor.id):''}`,undefined,'GET',controller.signal):null;
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(view&&view.session.id!==sessionId)throw Error('会话快照与当前选择不一致');
            if(data&&view)data={...data,sessions:data.sessions.some(s=>s.id===sessionId)?data.sessions.map(s=>s.id===sessionId?view.session:s):[...data.sessions,view.session]};
            const active=!!view?.progress.active&&view.progress.generation===view.session.generation;
            const selectedExp=data?.experiments.some(e=>e.id===this.state.selectedExp)?this.state.selectedExp:data?.experiments[0]?.id??'';
            await new Promise<void>(resolve=>this.setState({boot,data,projectId,sessionId,messages:view?.messages??[],history:view?.history??null,historyAnchor:anchor,selectedExp,stream:!anchor&&active?view!.progress.content:'',streamTruncated:!anchor&&active&&!!view?.progress.truncated,connected:true},resolve));
            if(!this.mounted||epoch!==this.refreshEpoch)return false;
            if(this.feed?.projectId!==projectId){this.feed?.stop();this.feed=undefined;if(projectId){const feed=new ProjectEventFeed(projectId,()=>this.refresh(true),eventNotice=>{if(this.mounted&&this.feed===feed)this.setState({eventNotice});});this.feed=feed;feed.start();}}
            return true;
        }catch(error){
            if(!this.mounted||epoch!==this.refreshEpoch||controller.signal.aborted)return false;
            if(error instanceof ApiError&&error.status===401)this.setState({loggedIn:false,error:error.message});
            else this.setState(previous=>({...previous,connected:false,...(!quiet?{error:error instanceof Error?error.message:String(error)}:{})}));
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
    private sessionSelection(id:string,tab=this.state.tab):Pick<State,'sessionId'|'tab'|'messages'|'history'|'historyAnchor'|'stream'|'streamTruncated'|'error'> {
        return {sessionId:id,tab,messages:[],history:null,historyAnchor:null,stream:'',streamTruncated:false,error:''};
    }
    switchProject(id: string) { this.invalidateRead();this.feed?.stop();this.feed=undefined; this.setState({ ...this.sessionSelection(''),projectId: id, selectedExp: '', selectedRun:'',selectedReport:'',selectedCampaign:'',selectedRunGrant:'',selectedDiscoveryGrant:'',selectedDocument:null,eventNotice:'', data: null }, () => { void this.refresh(); }); }
    selectSession(id: string,tab='chat') { this.invalidateRead(); this.setState(this.sessionSelection(id,tab), () => { void this.refresh(); }); }
    selectHistory=(anchor:{direction:'before'|'after';id:string}|null)=>{this.invalidateRead();this.setState({messages:[],historyAnchor:anchor,stream:'',streamTruncated:false},()=>void this.refresh());};
    open(modal: string, data: any = null) { this.setState({ modal, modalData: data, error: '' }); }
    close = () => {
        if (!this.state.busy)
            this.setState({ modal: '', modalData: null });
    };
    async newSession() {
        if (!this.state.projectId)
            return;
        await this.perform(async () => { const s = await api('/sessions', { projectId: this.state.projectId, title: '新的研究会话' }); await new Promise<void>(resolve=>this.setState(this.sessionSelection(s.id,'chat'),resolve)); });
    }
    async toggle() { const p = this.state.data!.project; await this.perform(() => api(`/projects/${p.id}/collaboration-settings`, { expectedVersion: p.version, enabled: !p.settings.enabled })); }
    modalView() {
        const { modal, modalData, data, busy } = this.state;
        if (!modal)
            return null;
        const base = { onClose: this.close, busy };
        const done = () => this.setState({ modal: '', modalData: null });
        if (modal === 'project')
            return <Modal {...base} title="新建本地项目" submitLabel="创建项目" onSubmit={fd => this.perform(async () => { const p = await api('/projects', { name: fd.get('name'), description: fd.get('description'), template: fd.get('template') }); const s = await api('/sessions', { projectId: p.id, title: '研究主会话' }); await new Promise<void>(resolve=>this.setState({ ...this.sessionSelection(s.id,'chat'),projectId:p.id,selectedExp:'',selectedRun:'',selectedReport:'',selectedCampaign:'',selectedRunGrant:'',selectedDiscoveryGrant:'',selectedDocument:null,data:null },resolve)); done(); })}><label>项目名称<input aria-label="项目名称" name="name" required maxLength={120} placeholder="例如：材料筛选研究"/></label><label>项目说明<textarea name="description" placeholder="研究目标、范围或输入资料"/></label><label>项目模板<select aria-label="项目模板" name="template" defaultValue="curve-fit"><option value="curve-fit">真实曲线拟合示例 · 可直接运行</option><option value="empty">空项目 · 自行准备文件</option></select></label><div className="notice"><p>曲线拟合使用固定合成数据，真实执行数值计算。它用于验证系统，不是材料研究或 LLM 模拟。</p></div></Modal>;
        if (modal === 'experiment')
            return <ExperimentModal {...base} parent={data!.experiments.find(e=>e.id===modalData?.parentId)} perform={this.perform} onSave={async input=>{const e=await api('/experiments',{projectId:data!.project.id,...input});this.setState({selectedExp:e.id,tab:'experiments'});done();}}/>;
        if (modal === 'config')
            return <Modal {...base} wide title="实验版本化配置" submitLabel={modalData.frozen ? '关闭只读配置' : '保存配置修订'} onSubmit={fd => this.perform(async () => {
                    if (!modalData.frozen)
                        await api(`/experiments/${modalData.id}/files`, { path: 'config.json', content: fd.get('content'), expectedDigest: modalData.digest, expectedVersion: modalData.version });
                    done();
                })}><p className="small muted">{modalData.frozen ? '已冻结节点不能修改；需要变更时请派生子实验。' : '保存会增加方案修订，之前准备的运行批准不再适用。'}</p><label>配置源码<textarea name="content" aria-label="配置源码" className="code-input" rows={12} readOnly={modalData.frozen} defaultValue={modalData.content}/></label></Modal>;
        if (modal === 'team')
            return <Modal {...base} wide title="手动编写协作计划" submitLabel="提交计划待批准" onSubmit={fd => this.perform(async () => {
                    let sessionId = this.state.sessionId;
                    if (!sessionId) {
                        const s = await api('/sessions', { projectId: data!.project.id, title: '协作主会话' });
                        sessionId = s.id;
                        await new Promise<void>(resolve=>this.setState(this.sessionSelection(sessionId),resolve));
                    }
                    await api(`/sessions/${sessionId}/teams`, { goal: fd.get('goal'), tasks: JSON.parse(String(fd.get('tasks'))), budget: Number(fd.get('budget')), autoSummarize: fd.get('autoSummarize') === 'on' });
                    done();
                })}><label>协作目标<input name="goal" aria-label="协作目标" required placeholder="需要共同完成的目标"/></label><label>任务依赖 JSON<textarea className="code-input" aria-label="任务依赖 JSON" name="tasks" defaultValue={JSON.stringify(manualTasks.map(t => t.key === 'analysis' ? { ...t, inputEvidenceIds: data?.evidence.map(e => e.id) ?? [] } : t), null, 2)} rows={13} required/></label><label>最大尝试额度<input type="number" name="budget" min={5} max={100} defaultValue={12}/></label><label className="check-label"><input type="checkbox" name="autoSummarize" defaultChecked/>协作结束后自动唤醒主 Pi 综合（占用团队尝试额度）</label><p className="small muted">这是手动计划模板，不是模型生成的建议。关键任务通过 reviewOf 安排独立审查；额度按任务尝试计，不是实际账单上限。</p></Modal>;
        if (modal === 'directive')
            return <Modal {...base} title="给团队发送指令" submitLabel="保存指令" onSubmit={fd => this.perform(async () => { await api(`/teams/${modalData}/directives`, { kind: fd.get('kind'), content: fd.get('content') }); done(); })}><label>指令语义<select name="kind"><option value="steer">引导当前工作 · 不修改研究目标</option><option value="follow_up">后续指令 · 当前任务结束后处理</option><option value="revise">改变研究目标 · 旧任务失效，暂停重新规划</option></select></label><label>指令内容<textarea name="content" rows={6} required/></label><p className="small muted">修改目标会保存新需求版本，不删除已有实验或结果。取消正式 Run 需单独操作。</p></Modal>;
        if (modal === 'evidence')
            return <Modal {...base} wide title="登记原文证据" submitLabel="保存证据" onSubmit={fd => this.perform(async () => { await api('/evidence', { projectId: data!.project.id, artifactId: modalData.artifactId, start: Number(fd.get('start')), end: Number(fd.get('end')), description: fd.get('description') }); done(); }, '证据已定位并校验')}><label>证据说明<input name="description" required placeholder="此片段用于支持什么观察？"/></label><div className="form-columns"><label>起始字符<input type="number" name="start" min={0} defaultValue={0}/></label><label>结束字符<input type="number" name="end" min={1} max={modalData.content.length} defaultValue={Math.min(modalData.content.length, 2000)}/></label></div><p className="small muted">使用 JavaScript UTF-16 字符位置，不是 PDF 页码或日志字节位置。</p><pre className="modal-preview">{modalData.content.slice(0, 4000)}</pre></Modal>;
        if (modal === 'claim')
            return <Modal {...base} title="提出结论候选" submitLabel="保存候选待验收" onSubmit={fd => this.perform(async () => { await api('/claims', { projectId: data!.project.id, statement: fd.get('statement'), evidenceIds: [fd.get('evidenceId')], limitations: String(fd.get('limitations')).split('\n').filter(Boolean) }); done(); })}><label>结论陈述<textarea name="statement" required rows={4}/></label><label>证据来源<select name="evidenceId">{data!.evidence.map(e => <option value={e.id} key={e.id}>{e.description} · {short(e.id)}</option>)}</select></label><label>限制（每行一条）<textarea name="limitations" required placeholder="样本规模、条件、未执行的验证等"/></label></Modal>;
        return null;
    }
    render() {
        const { boot, data, loggedIn, tab } = this.state;
        if (!loggedIn)
            return <main className="login"><div className="brand"><span>π</span>Pi Research</div><h1>打开你的科研工作台</h1><p>请使用启动终端中的完整地址，或在这里粘贴本机访问令牌。</p><form onSubmit={(e: any) => { e.preventDefault(); setToken(this.state.tokenDraft); this.setState({ loggedIn: true, error: '' }, () => { void this.refresh(); }); }}><label>本地访问令牌<input aria-label="本地访问令牌" type="password" value={this.state.tokenDraft} onChange={(e: any) => this.setState({ tokenDraft: e.target.value })} required/></label><button className="primary">进入工作台</button></form>{this.state.error ? <p role="alert" className="error-text">{this.state.error}</p> : null}<small>只绑定 127.0.0.1。令牌保存在当前浏览器会话中，不放入请求 URL。</small></main>;
        const currentSession = data?.sessions.find(s => s.id === this.state.sessionId), experiment = data?.experiments.find(e => e.id === this.state.selectedExp);
        return <div className="app-shell"><nav className="sidebar" aria-label="主导航"><a className="brand" href="#" onClick={(e: any) => { e.preventDefault(); this.setState({ tab: 'chat' }); }}><span>π</span><div>Pi Research<small>RESEARCH WORKSPACE</small></div></a><button className="new-project" onClick={() => this.open('project')}><Icon name="plus" size={16}/>新建项目</button><div className="sidebar-caption">WORKSPACE</div><div className="nav-list">{navigation.map(([id, name, icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => this.setState({ tab: id })}><Icon name={icon} size={18}/><span>{name}</span>{id === 'experiments' && data?.experiments.length ? <em>{data.experiments.length}</em> : null}</button>)}</div><SessionList projectId={this.state.projectId} selectedId={this.state.sessionId} selected={currentSession} onSelect={id=>this.selectSession(id)} onNew={()=>this.newSession()}/><div className="sidebar-footer"><div className="local-avatar"><Icon name="folder"/></div><div><strong>本地工作空间</strong><small>数据由你掌握</small></div><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/></div></nav>
 <div className="workspace-shell"><header className="topbar"><div className="breadcrumb"><span>项目</span><Icon name="chevron" size={12}/><select aria-label="当前项目" value={this.state.projectId} onChange={(e: any) => this.switchProject(e.target.value)}>{!boot?.projects.length ? <option value="">尚未创建项目</option> : boot.projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div className="topbar-right"><span className={'connection-state ' + (this.state.connected ? 'ready' : '')}><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/>{this.state.connected ? '本地服务在线' : '正在重连'}</span><span className="version-label">v0.2 · 开发版</span></div></header>
 {this.state.eventNotice?<p className="small muted" role="status">{this.state.eventNotice}</p>:null}{this.state.error ? <div className="global-error" role="alert"><strong>操作未完成</strong><span>{this.state.error}</span><button className="icon-button" aria-label="关闭错误提示" onClick={() => this.setState({ error: '' })}><Icon name="close" size={16}/></button></div> : null}{this.state.notice ? <div className="toast" role="status"><Icon name="check" size={16}/>{this.state.notice}</div> : null}
 <div className={'workbench-content ' + (['chat', 'experiments'].includes(tab) && data ? 'with-inspector' : '')}>
 <main className={'main-pane ' + (tab === 'chat' ? 'chat-pane' : '')}>
 {!boot ? <div className="boot-screen">正在读取本地项目…</div> : tab === 'settings' ? <SettingsView boot={boot} session={currentSession} perform={this.perform}/> : !data ? <div className="first-project"><div className="welcome-mark">π</div><h1>每一个研究，<br />从清晰的起点开始。</h1><p>建立本地项目，保存源代码、实验快照和证据。<br />也可以先运行随包的真实数值示例，检查完整流程。</p><button className="primary" onClick={() => this.open('project')}>创建第一个项目 <Icon name="arrow" size={17}/></button><p className="small muted">Pi 是唯一 Agent 执行内核。没有 ORX 运行时依赖。</p></div> :
                tab === 'chat' ? <Chat data={data} boot={boot} session={currentSession} messages={this.state.messages} history={this.state.history} historyAnchor={this.state.historyAnchor} onHistory={this.selectHistory} stream={this.state.stream} streamTruncated={this.state.streamTruncated} perform={this.perform} onNew={() => this.newSession()} onExperiments={() => this.setState({ tab: 'experiments' })} onWorkspace={() => this.setState({ tab: 'workspace' })} onSession={id=>this.selectSession(id)}/> :
                    tab === 'scheduler' ? <SchedulerView key={data.project.id} data={data} perform={this.perform}/> :
                    tab === 'implementation' ? <ImplementationView onScheduler={()=>this.setState({tab:'scheduler'})} key={data.project.id} data={data} sessionId={this.state.sessionId} busy={this.state.busy} perform={this.perform} onSession={sessionId=>this.selectSession(sessionId,'implementation')} onChat={id=>this.selectSession(id)} onExperiment={selectedExp=>this.setState({selectedExp,selectedRun:'',tab:'experiments'})}/> :
                    tab === 'campaigns' ? <CampaignView onRun={(selectedRun,selectedExp)=>{if(!data.runs.some(r=>r.id===selectedRun&&r.experimentId===selectedExp)||!data.experiments.some(e=>e.id===selectedExp)){this.setState({error:'指定活动 Run 不在当前项目中，未跳转到其他运行。'});return;}this.invalidateRead();this.setState({selectedRun,selectedExp,tab:'experiments'});}} selectedCampaign={this.state.selectedCampaign} onSelect={selectedCampaign=>this.setState({selectedCampaign})} onImplementation={sessionId=>this.selectSession(sessionId,'implementation')} key={data.project.id} data={data} busy={this.state.busy} perform={this.perform} onSession={id => this.selectSession(id)} onExperiment={id => this.setState({selectedExp:id,selectedRun:'',tab:'experiments'})}/> :
                    tab === 'experiments' ? <Experiments perform={this.perform} busy={this.state.busy} selectedRunGrant={this.state.selectedRunGrant} onSelectRunGrant={selectedRunGrant=>this.setState({selectedRunGrant})} onSession={id=>this.selectSession(id)} data={data} selected={this.state.selectedExp} onSelect={selectedExp => { this.invalidateRead(); this.setState({ selectedExp,selectedRun:'' }); }} onRun={(selectedRun,selectedExp)=>{if(!data.runs.some(r=>r.id===selectedRun&&r.experimentId===selectedExp)||!data.experiments.some(e=>e.id===selectedExp)){this.setState({error:'指定 Run 不在当前项目中，未跳转到其他运行。'});return;}this.invalidateRead();this.setState({selectedRun,selectedExp});}} onCreate={() => this.open('experiment')} onChild={() => this.open('experiment', { parentId: experiment?.id })}/> :
                        tab === 'changes' ? <ChangesView key={data.project.id} data={data} perform={this.perform}/> :
                        tab === 'workspace' ? <WorkspaceView key={data.project.id} data={data} perform={this.perform}/> :
                            tab === 'integrations' ? <IntegrationsView key={data.project.id} projectId={data.project.id} sessionId={this.state.sessionId} onLiterature={()=>this.setState({tab:'literature'})}/> :
                            tab === 'literature' ? <LiteratureView key={data.project.id} data={data} perform={this.perform} selectedDiscoveryGrant={this.state.selectedDiscoveryGrant} onSelectDiscoveryGrant={selectedDiscoveryGrant=>this.setState({selectedDiscoveryGrant})} onSession={id=>this.selectSession(id)} selectedDocument={this.state.selectedDocument??undefined} onDocument={selectedDocument=>this.setState({selectedDocument})} onSources={()=>this.setState({tab:'integrations'})}/> :
                                tab === 'evidence' ? <EvidenceView onDocument={selectedDocument=>this.setState({selectedDocument,tab:'literature'})} key={data.project.id} data={data} perform={this.perform} onRegister={(artifactId, content) => this.open('evidence', { artifactId, content })} onClaim={() => this.open('claim')}/> :
                                    tab === 'reports' ? <ReportsView onCampaign={selectedCampaign=>{if(!data.campaigns.some(c=>c.id===selectedCampaign)){this.setState({error:'指定研究活动不在当前项目中，未跳转到其他活动。'});return;}this.setState({selectedCampaign,tab:'campaigns'});}} onSession={id=>this.selectSession(id)} onDocument={selectedDocument=>this.setState({selectedDocument,tab:'literature'})} key={data.project.id} data={data} perform={this.perform} selectedReport={this.state.selectedReport} onSelect={selectedReport=>this.setState({selectedReport})} onRun={(selectedRun,selectedExp)=>{if(!data.runs.some(r=>r.id===selectedRun&&r.experimentId===selectedExp)||!data.experiments.some(e=>e.id===selectedExp)){this.setState({error:'指定报告 Run 不在当前项目中，未跳转到其他运行。'});return;}this.invalidateRead();this.setState({selectedRun,selectedExp,tab:'experiments'});}}/> : null}
 </main>{data && boot && ['chat', 'experiments'].includes(tab) ? <Inspector onScheduler={()=>this.setState({tab:'scheduler'})} data={data} boot={boot} tab={tab} experiment={experiment} selectedRun={this.state.selectedRun} onRun={selectedRun=>this.setState({selectedRun})} perform={this.perform} onToggle={() => this.toggle()} onTeam={() => this.open('team')} onPrepare={() => {
                    if (experiment)
                        this.perform(() => api('/run-intents', { experimentId: experiment.id }), '已准备不可变快照，等待人工批准');
                }} onChild={() => this.open('experiment', { parentId: experiment?.id })} onConfig={() => {
                    if (experiment)
                        this.perform(async () => { const file = await api(`/experiments/${experiment.id}/files?path=config.json`); this.open('config', { id: experiment.id, version: experiment.version, frozen: experiment.lifecycle === 'frozen', ...file }); });
                }} onDirective={teamId => this.open('directive', teamId)}/> : null}</div></div>{this.modalView()}</div>;
    }
}
