import {IntegrationsView} from './integrations.js';
import {ChangesView} from './changes.js';
import { CampaignView } from './campaigns.js';
import { api, ApiError, hasToken, setToken } from './api.js';
import type { Bootstrap, ProjectState, Row, Message } from './models.js';
import { short, label } from './models.js';
import { Icon, Modal, Empty } from './ui.js';
import { Chat, Experiments, Inspector, type Perform } from './workbench.js';
import { WorkspaceView, EvidenceView, ReportsView, LiteratureView, SettingsView } from './data-views.js';
interface State {
    boot: Bootstrap | null;
    data: ProjectState | null;
    projectId: string;
    sessionId: string;
    tab: string;
    selectedExp: string;
    messages: Row<Message>[];
    stream: string;
    modal: string;
    modalData: any;
    busy: boolean;
    error: string;
    notice: string;
    connected: boolean;
    tokenDraft: string;
    loggedIn: boolean;
}
const navigation = [['chat', '研究会话', 'chat'], ['campaigns', '研究活动', 'branch'], ['experiments', '实验与运行', 'experiment'], ['workspace', '项目工作区', 'folder'], ['changes','变更提案','branch'], ['literature', '文献检索', 'search'], ['integrations', '技能与连接器', 'settings'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report'], ['settings', '设置与能力', 'settings']];
const manualTasks = [{ key: 'sources', role: 'literature', objective: '整理用户已提供资料及候选文献；检索策略与最终排序由主协调者负责。明确未阅读的全文。', dependencies: [] }, { key: 'analysis', role: 'analyst', objective: '核查已有运行指标及其证据；缺少必要输入则阻塞，不编造结果。', dependencies: [], critical: true }, { key: 'review', role: 'reviewer', objective: '独立核查分析结论与真实证据。', dependencies: ['sources'], reviewOf: 'analysis' }, { key: 'report', role: 'writer', objective: '根据已验收的输入形成实际报告产物，说明限制。', dependencies: ['analysis', 'review'], expectedOutputs:[{kind:'report',schemaId:'report',required:true}], acceptanceRuleIds:['artifact-required'] }];
function saved() {
    try {
        return JSON.parse(localStorage.getItem('pi-research-ui-v1') ?? '{}');
    }
    catch {
        return {};
    }
}
class App extends React.Component<{}, State> {
    state: State = { boot: null, data: null, projectId: saved().projectId ?? '', sessionId: saved().sessionId ?? '', tab: saved().tab ?? 'chat', selectedExp: saved().selectedExp ?? '', messages: [], stream: '', modal: '', modalData: null, busy: false, error: '', notice: '', connected: false, tokenDraft: '', loggedIn: hasToken() };
    private timer?: number;
    private refreshing = false;
    private refreshEpoch = 0;
    private cursor = 0;
    private noticeTimer?: number;
    componentDidMount() {
        if (this.state.loggedIn)
            void this.refresh();
        this.timer = window.setInterval(() => {
            if (this.state.loggedIn)
                void this.refresh(true);
        }, 1300);
    }
    componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.noticeTimer); }
    componentDidUpdate(_: any, prev: State) {
        if (['projectId', 'sessionId', 'tab', 'selectedExp'].some(k => (prev as any)[k] !== (this.state as any)[k]))
            localStorage.setItem('pi-research-ui-v1', JSON.stringify({ projectId: this.state.projectId, sessionId: this.state.sessionId, tab: this.state.tab, selectedExp: this.state.selectedExp }));
    }
    async refresh(quiet = false) {
        if (this.refreshing || quiet && this.state.busy)
            return;
        this.refreshing = true;
        const epoch = this.refreshEpoch;
        try {
            const boot = await api<Bootstrap>('/bootstrap');
            const projectId = boot.projects.some(p => p.id === this.state.projectId) ? this.state.projectId : boot.projects[0]?.id ?? '';
            const data = projectId ? await api<ProjectState>(`/projects/${projectId}/state`) : null;
            const sessionId = data?.sessions.some(s => s.id === this.state.sessionId) ? this.state.sessionId : data?.sessions.find(s => s.role === 'coordinator' && s.state !== 'archived')?.id ?? '';
            const [messages, events] = await Promise.all([sessionId ? api<Row<Message>[]>(`/sessions/${sessionId}/messages`) : Promise.resolve([]), api(`/events?after=${this.cursor}`)]);
            let stream = this.state.stream;
            for (const event of events.items) {
                if (event.payload.sessionId === sessionId) {
                    if (event.type === 'session.delta')
                        stream += event.payload.text;
                    if (['session.message_completed', 'agent.finished'].includes(event.type))
                        stream = '';
                }
            }
            if (epoch !== this.refreshEpoch)
                return;
            this.cursor = events.cursor;
            const selectedExp = data?.experiments.some(e => e.id === this.state.selectedExp) ? this.state.selectedExp : data?.experiments[0]?.id ?? '';
            this.setState({ boot, data, projectId, sessionId, messages, selectedExp, stream: stream.slice(-32000), connected: true });
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 401)
                this.setState({ loggedIn: false, error: error.message });
            else
                this.setState({ connected: false, ...(!quiet ? { error: error instanceof Error ? error.message : String(error) } : {}) });
        }
        finally {
            this.refreshing = false;
        }
    }
    perform: Perform = async (fn, success) => {
        if (this.state.busy)
            return;
        this.refreshEpoch++;
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
    switchProject(id: string) { this.refreshEpoch++; this.cursor = 0; this.setState({ projectId: id, sessionId: '', selectedExp: '', stream: '', data: null }, () => { void this.refresh(); }); }
    selectSession(id: string) { this.refreshEpoch++; this.setState({ sessionId: id, tab: 'chat', stream: '' }, () => { void this.refresh(); }); }
    open(modal: string, data: any = null) { this.setState({ modal, modalData: data, error: '' }); }
    close = () => {
        if (!this.state.busy)
            this.setState({ modal: '', modalData: null });
    };
    async newSession() {
        if (!this.state.projectId)
            return;
        await this.perform(async () => { const s = await api('/sessions', { projectId: this.state.projectId, title: '新的研究会话' }); this.setState({ sessionId: s.id, tab: 'chat', messages: [], stream: '' }); });
    }
    async toggle() { const p = this.state.data!.project; await this.perform(() => api(`/projects/${p.id}/collaboration-settings`, { expectedVersion: p.version, enabled: !p.settings.enabled })); }
    modalView() {
        const { modal, modalData, data, busy } = this.state;
        if (!modal)
            return null;
        const base = { onClose: this.close, busy };
        const done = () => this.setState({ modal: '', modalData: null });
        if (modal === 'project')
            return <Modal {...base} title="新建本地项目" submitLabel="创建项目" onSubmit={fd => this.perform(async () => { const p = await api('/projects', { name: fd.get('name'), description: fd.get('description'), template: fd.get('template') }); const s = await api('/sessions', { projectId: p.id, title: '研究主会话' }); this.setState({ projectId: p.id, sessionId: s.id, selectedExp: '', tab: 'chat' }); done(); })}><label>项目名称<input aria-label="项目名称" name="name" required maxLength={120} placeholder="例如：材料筛选研究"/></label><label>项目说明<textarea name="description" placeholder="研究目标、范围或输入资料"/></label><label>项目模板<select aria-label="项目模板" name="template" defaultValue="curve-fit"><option value="curve-fit">真实曲线拟合示例 · 可直接运行</option><option value="empty">空项目 · 自行准备文件</option></select></label><div className="notice"><p>曲线拟合使用固定合成数据，真实执行数值计算。它用于验证系统，不是材料研究或 LLM 模拟。</p></div></Modal>;
        if (modal === 'experiment')
            return <Modal {...base} wide title={modalData?.parentId ? '派生子实验' : '建立实验草案'} submitLabel="保存实验草案" onSubmit={fd => this.perform(async () => { const e = await api('/experiments', { projectId: data!.project.id, title: fd.get('title'), hypothesis: fd.get('hypothesis'), ...(modalData?.parentId ? { parentId: modalData.parentId } : {}), config: JSON.parse(String(fd.get('config'))) }); this.setState({ selectedExp: e.id, tab: 'experiments' }); done(); })}><label>实验名称<input aria-label="实验名称" name="title" defaultValue={modalData?.parentId ? '新候选实验' : '基线实验'} required/></label><label>研究假设<textarea aria-label="研究假设" name="hypothesis" required placeholder="要检验的假设、对照条件和预期结果"/></label><label>版本化配置 JSON<textarea aria-label="版本化配置 JSON" name="config" className="code-input" defaultValue={JSON.stringify({ polynomialDegree: modalData?.parentId ? 2 : 1, ridge: 0.000001 }, null, 2)} required rows={5}/></label><p className="small muted">配置随代码进入快照，不通过临时命令行参数修改实验条件。派生实验继承父节点运行契约。</p></Modal>;
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
                        this.setState({ sessionId });
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
        return <div className="app-shell"><nav className="sidebar" aria-label="主导航"><a className="brand" href="#" onClick={(e: any) => { e.preventDefault(); this.setState({ tab: 'chat' }); }}><span>π</span><div>Pi Research<small>RESEARCH WORKSPACE</small></div></a><button className="new-project" onClick={() => this.open('project')}><Icon name="plus" size={16}/>新建项目</button><div className="sidebar-caption">WORKSPACE</div><div className="nav-list">{navigation.map(([id, name, icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => this.setState({ tab: id })}><Icon name={icon} size={18}/><span>{name}</span>{id === 'experiments' && data?.experiments.length ? <em>{data.experiments.length}</em> : null}</button>)}</div><div className="sidebar-sessions"><div className="sidebar-caption">会话<button aria-label="新建会话" title="新建会话" className="icon-button" disabled={!data} onClick={() => this.newSession()}><Icon name="plus" size={15}/></button></div>{data?.sessions.filter(s => s.role === 'coordinator' && s.state !== 'archived').map(s => <button key={s.id} className={s.id === this.state.sessionId ? 'selected-session' : ''} onClick={() => this.selectSession(s.id)}><span className={'session-dot ' + (s.state === 'running' ? 'live' : '')}/><span>{s.title}</span></button>)}</div><div className="sidebar-footer"><div className="local-avatar"><Icon name="folder"/></div><div><strong>本地工作空间</strong><small>数据由你掌握</small></div><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/></div></nav>
 <div className="workspace-shell"><header className="topbar"><div className="breadcrumb"><span>项目</span><Icon name="chevron" size={12}/><select aria-label="当前项目" value={this.state.projectId} onChange={(e: any) => this.switchProject(e.target.value)}>{!boot?.projects.length ? <option value="">尚未创建项目</option> : boot.projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></div><div className="topbar-right"><span className={'connection-state ' + (this.state.connected ? 'ready' : '')}><span className={'status-dot ' + (this.state.connected ? '' : 'amber')}/>{this.state.connected ? '本地服务在线' : '正在重连'}</span><span className="version-label">v0.2 · 开发版</span></div></header>
 {this.state.error ? <div className="global-error" role="alert"><strong>操作未完成</strong><span>{this.state.error}</span><button className="icon-button" aria-label="关闭错误提示" onClick={() => this.setState({ error: '' })}><Icon name="close" size={16}/></button></div> : null}{this.state.notice ? <div className="toast" role="status"><Icon name="check" size={16}/>{this.state.notice}</div> : null}
 <div className={'workbench-content ' + (['chat', 'experiments'].includes(tab) && data ? 'with-inspector' : '')}>
 <main className={'main-pane ' + (tab === 'chat' ? 'chat-pane' : '')}>
 {!boot ? <div className="boot-screen">正在读取本地项目…</div> : tab === 'settings' ? <SettingsView boot={boot} session={currentSession} perform={this.perform}/> : !data ? <div className="first-project"><div className="welcome-mark">π</div><h1>每一个研究，<br />从清晰的起点开始。</h1><p>建立本地项目，保存源代码、实验快照和证据。<br />也可以先运行随包的真实数值示例，检查完整流程。</p><button className="primary" onClick={() => this.open('project')}>创建第一个项目 <Icon name="arrow" size={17}/></button><p className="small muted">Pi 是唯一 Agent 执行内核。没有 ORX 运行时依赖。</p></div> :
                tab === 'chat' ? <Chat data={data} boot={boot} session={currentSession} messages={this.state.messages} stream={this.state.stream} perform={this.perform} onNew={() => this.newSession()} onExperiments={() => this.setState({ tab: 'experiments' })} onWorkspace={() => this.setState({ tab: 'workspace' })} onSession={id=>this.selectSession(id)}/> :
                    tab === 'campaigns' ? <CampaignView key={data.project.id} data={data} busy={this.state.busy} perform={this.perform} onSession={id => this.selectSession(id)} onExperiment={id => this.setState({selectedExp:id,tab:'experiments'})}/> :
                    tab === 'experiments' ? <Experiments data={data} selected={this.state.selectedExp} onSelect={selectedExp => { this.refreshEpoch++; this.setState({ selectedExp }); }} onCreate={() => this.open('experiment')} onChild={() => this.open('experiment', { parentId: experiment?.id })}/> :
                        tab === 'changes' ? <ChangesView key={data.project.id} data={data} perform={this.perform}/> :
                        tab === 'workspace' ? <WorkspaceView key={data.project.id} data={data} perform={this.perform}/> :
                            tab === 'integrations' ? <IntegrationsView key={data.project.id} projectId={data.project.id}/> :
                            tab === 'literature' ? <LiteratureView key={data.project.id} data={data} perform={this.perform}/> :
                                tab === 'evidence' ? <EvidenceView key={data.project.id} data={data} perform={this.perform} onRegister={(artifactId, content) => this.open('evidence', { artifactId, content })} onClaim={() => this.open('claim')}/> :
                                    tab === 'reports' ? <ReportsView key={data.project.id} data={data} perform={this.perform}/> : null}
 </main>{data && boot && ['chat', 'experiments'].includes(tab) ? <Inspector data={data} boot={boot} tab={tab} experiment={experiment} perform={this.perform} onToggle={() => this.toggle()} onTeam={() => this.open('team')} onPrepare={() => {
                    if (experiment)
                        this.perform(() => api('/run-intents', { experimentId: experiment.id }), '已准备不可变快照，等待人工批准');
                }} onChild={() => this.open('experiment', { parentId: experiment?.id })} onConfig={() => {
                    if (experiment)
                        this.perform(async () => { const file = await api(`/experiments/${experiment.id}/files?path=config.json`); this.open('config', { id: experiment.id, version: experiment.version, frozen: experiment.lifecycle === 'frozen', ...file }); });
                }} onDirective={teamId => this.open('directive', teamId)}/> : null}</div></div>{this.modalView()}</div>;
    }
}
ReactDOM.render(<App />, document.getElementById('root'));
