import * as React from 'react';
import {api,ApiError} from './api.js';
import type {Project,ProjectLifecycleView,ProjectPurgeView,Row} from './models.js';
import {Modal,Icon} from './ui.js';
import {short,date} from './models.js';

type Action='archive'|'unarchive'|'trash'|'restore'|'purge';
type Target={project:ProjectLifecycleView;action:Action;key:string};
const titles:Record<Action,string>={archive:'归档项目',unarchive:'取消项目归档',trash:'移入回收站',restore:'还原项目',purge:'永久删除项目'};
const notices:Record<Exclude<Action,'purge'>,string>={archive:'项目已归档，历史保留且只读。',unarchive:'已取消归档，旧审批、权限与队列不会恢复。',trash:'项目已移入回收站；文件保留，普通入口不再可读。',restore:'项目已还原；旧审批、权限、队列和自动化不会恢复。'};
const lastPurgeKey='pi-research-last-project-purge-v1';
function savedPurgeId(){try{const id=localStorage.getItem(lastPurgeKey);return typeof id==='string'&&id.length>0&&id.length<=200?id:'';}catch{return '';}}
function verifyPurge(view:ProjectPurgeView,id:string,purgeId?:string){
    if(view.projectId!==id||typeof view.purgeId!=='string'||!view.purgeId||purgeId&&view.purgeId!==purgeId)throw Error('清理状态与所选项目或任务不一致，未显示其他项目记录');
    if(!['pending','running','failed','completed'].includes(view.state)||!['waiting_offline','planning','files','records','verify','completed'].includes(view.phase)||!Number.isSafeInteger(view.completedPaths)||!Number.isSafeInteger(view.totalPaths)||view.completedPaths<0||view.totalPaths<view.completedPaths||typeof view.dataDir!=='string'||!view.dataDir||view.offlineRequired!==true||view.state==='completed'&&view.phase!=='completed')throw Error('清理状态格式不正确，请刷新后重试');
}
export function powershellPurgeCommand(project:Pick<ProjectLifecycleView,'id'|'name'>,view:ProjectPurgeView){
    verifyPurge(view,project.id);if(view.state==='completed')return '';
    const args=['node','dist/apps/cli/index.js','project','purge','--project',project.id,'--data',view.dataDir,'--offline','--confirm-name',project.name,...(view.state==='failed'||view.state==='running'?['--resume']:[])];
    return '& '+args.map(value=>"'"+value.replace(/'/g,"''")+"'").join(' ');
}
function summary(project:Row<Project>|ProjectLifecycleView):ProjectLifecycleView{
    const status=project.status??(project.archived?'archived':'active');
    return {id:project.id,name:project.name,version:project.version,status,lifecycleEpoch:project.lifecycleEpoch,archived:status!=='active',createdAt:project.createdAt,updatedAt:project.updatedAt,...('deletedAt' in project&&project.deletedAt?{deletedAt:project.deletedAt}:{}),...(project.restoreStatus?{restoreStatus:project.restoreStatus}:{})};
}
function resultStatus(target:Target):ProjectLifecycleView['status']{
    if(target.action==='restore'){
        if(!target.project.restoreStatus)throw Error('还原目标缺少删除前状态，请刷新项目后重新确认');
        return target.project.restoreStatus;
    }
    return target.action==='archive'?'archived':target.action==='unarchive'?'active':target.action==='purge'?'purging':'trashed';
}
export class ProjectManagement extends React.Component<{
    onClose:()=>void;onOpen:(id:string)=>void;
    selectionToken:()=>number;
    onChanged:(project:ProjectLifecycleView,token:number)=>Promise<void>;
},{active:Row<Project>[];archived:Row<Project>[];trashed:ProjectLifecycleView[];purging:ProjectLifecycleView[];loading:boolean;busy:boolean;error:string;target:Target|null;confirmName:string;conflict:boolean;notice:string;purgeProjectId:string;purgeProject:ProjectLifecycleView|null;purge:ProjectPurgeView|null;purgeReading:boolean;purgeError:string;lastPurgeId:string}> {
    state={active:[] as Row<Project>[],archived:[] as Row<Project>[],trashed:[] as ProjectLifecycleView[],purging:[] as ProjectLifecycleView[],loading:true,busy:false,error:'',target:null as Target|null,confirmName:'',conflict:false,notice:'',purgeProjectId:'',purgeProject:null as ProjectLifecycleView|null,purge:null as ProjectPurgeView|null,purgeReading:false,purgeError:'',lastPurgeId:savedPurgeId()};
    private mounted=true;private readEpoch=0;private changing=false;private purgeReadEpoch=0;
    private purgeTaskIds=new Map<string,string>();
    componentDidMount(){void this.load();}
    componentWillUnmount(){this.mounted=false;this.readEpoch++;this.purgeReadEpoch++;}
    async load(){
        const epoch=++this.readEpoch;this.setState({loading:true,error:''});
        const read=<T,>(status:string,update:(rows:T[])=>void)=>api<T[]>(`/projects?status=${status}`).then(rows=>{
            if(!Array.isArray(rows))throw Error('项目目录读取失败');
            if(this.mounted&&epoch===this.readEpoch)update(rows);
        }).catch(error=>{if(this.mounted&&epoch===this.readEpoch)this.setState({error:error instanceof Error?error.message:String(error)});});
        try{await Promise.all([
            read<Row<Project>>('active',rows=>this.setState({active:rows})),
            read<Row<Project>>('archived',rows=>this.setState({archived:rows})),
            read<ProjectLifecycleView>('trashed',rows=>this.setState({trashed:rows})),
            read<ProjectLifecycleView>('purging',rows=>this.setState({purging:rows}))
        ]);}finally{if(this.mounted&&epoch===this.readEpoch)this.setState({loading:false});}
    }
    choose(project:Row<Project>|ProjectLifecycleView,action:Action){if(this.changing)return;this.purgeReadEpoch++;this.setState({target:{project:summary(project),action,key:crypto.randomUUID()},confirmName:'',conflict:false,error:'',notice:'',purgeProjectId:'',purge:null,purgeProject:null,purgeError:'',purgeReading:false});}
    async reloadTarget(){
        const target=this.state.target;if(!target||this.changing)return;this.setState({busy:true,error:''});
        try{
            const project=await api<ProjectLifecycleView>(`/projects/${encodeURIComponent(target.project.id)}/lifecycle`);
            if(project.id!==target.project.id||project.status!==target.project.status)throw Error('项目状态已改变，请返回项目列表重新选择操作');
            if(this.mounted&&this.state.target===target)this.setState({target:{...target,project,key:crypto.randomUUID()},confirmName:'',conflict:false,notice:'已刷新目标版本，请重新核对项目并确认。'});
        }catch(error){if(this.mounted)this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted)this.setState({busy:false});}
    }
    async confirm(){
        const target=this.state.target;if(!target||this.changing||this.state.busy||this.state.conflict)return;
        if(target.action==='purge'&&(target.project.status!=='trashed'||this.state.confirmName!==target.project.name))return;
        this.changing=true;const token=this.props.selectionToken(),onChanged=this.props.onChanged;this.setState({busy:true,error:'',notice:''});
        try{
            if(target.action==='purge'){
                const epoch=this.purgeReadEpoch,view=await api<ProjectPurgeView>(`/projects/${encodeURIComponent(target.project.id)}/purge`,{expectedVersion:target.project.version,confirmName:target.project.name},'POST',undefined,target.key);
                verifyPurge(view,target.project.id,this.purgeTaskIds.get(target.project.id));
                if(!this.mounted||this.state.target!==target||epoch!==this.purgeReadEpoch)return;
                this.purgeTaskIds.set(view.projectId,view.purgeId);
                this.rememberPurge(view.projectId);this.purgeReadEpoch++;
                this.setState({target:null,conflict:false,purgeProjectId:view.projectId,purgeProject:target.project,purge:view,purgeReading:false,purgeError:'',notice:''});
                await this.load();return;
            }
            const expectedStatus=resultStatus(target),project=summary(await api<ProjectLifecycleView>(`/projects/${encodeURIComponent(target.project.id)}/${target.action}`,{expectedVersion:target.project.version},'POST',undefined,target.key));
            if(project.id!==target.project.id||project.status!==expectedStatus)throw Error('项目响应与确认目标不一致，请刷新项目状态');
            if(!this.mounted)return;await onChanged(project,token);if(!this.mounted)return;
            this.setState({target:null,conflict:false,notice:notices[target.action]});await this.load();
        }catch(error){if(this.mounted)this.setState({error:error instanceof Error?error.message:String(error),conflict:error instanceof ApiError&&(error.status===409&&(error.code.includes('VERSION')||error.code.includes('CONFLICT')))});}
        finally{this.changing=false;if(this.mounted)this.setState({busy:false});}
    }
    private rememberPurge(id:string){try{localStorage.setItem(lastPurgeKey,id);}catch{}this.setState({lastPurgeId:id});}
    async openPurge(id:string,project?:ProjectLifecycleView){
        const epoch=++this.purgeReadEpoch;
        this.setState({target:null,purgeProjectId:id,purgeProject:project?.id===id?project:null,purge:null,purgeReading:true,purgeError:'',notice:'',error:''});
        try{
            const view=await api<ProjectPurgeView>(`/projects/${encodeURIComponent(id)}/purge`);verifyPurge(view,id,this.purgeTaskIds.get(id));
            if(!this.mounted||epoch!==this.purgeReadEpoch||this.state.purgeProjectId!==id)return;
            this.purgeTaskIds.set(id,view.purgeId);
            this.rememberPurge(id);this.setState({purge:view});
            if(view.state!=='completed'&&!project){
                const current=await api<ProjectLifecycleView>(`/projects/${encodeURIComponent(id)}/lifecycle`);
                if(current.id!==id||current.status!=='purging')throw Error('当前清理项目摘要未通过核验，未提供离线命令');
                if(this.mounted&&epoch===this.purgeReadEpoch&&this.state.purgeProjectId===id)this.setState({purgeProject:current});
            }
        }catch(error){if(this.mounted&&epoch===this.purgeReadEpoch)this.setState({purgeError:error instanceof ApiError&&error.status===404?'此项目尚无可读取的清理状态或回执；可返回项目列表。':error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted&&epoch===this.purgeReadEpoch)this.setState({purgeReading:false});}
    }
    close=()=>{if(this.state.busy)return;this.purgeReadEpoch++;if(this.state.target||this.state.purgeProjectId)this.setState({target:null,confirmName:'',error:'',conflict:false,notice:'',purgeProjectId:'',purgeProject:null,purge:null,purgeReading:false,purgeError:''});else{this.readEpoch++;this.props.onClose();}};
    description(target:Target){
        switch(target.action){
            case 'archive':return '归档后项目从活动列表隐藏，会话、源码与已有成果保留为只读。尚未完成的作业或请求会阻止归档。';
            case 'unarchive':return '取消归档保留项目 ID 与历史。旧审批、授权和消息队列不会重新生效。已有授权绑定的旧会话仍可查看；请新建会话并重新授权后继续工作。';
            case 'trash':return '项目移入回收站后，会话、源码与成果停止通过普通入口读取，文件保留且可还原到当前状态。旧审批、权限、消息队列和自动化不会恢复。尚未完成的作业或请求会阻止此操作。';
            case 'restore':return `项目将还原为${target.project.restoreStatus==='archived'?'已归档，只读查看历史':'活动项目'}，保留原项目 ID 和历史。旧审批、权限、消息队列和自动化不会重新生效；已有授权绑定的旧会话请通过新建会话并重新授权后继续工作。`;
            case 'purge':return '确认后项目进入永久删除流程，不能再还原。物理清理须在全部正常写入进程退出、全局任务与未知状态已核对后离线运行命令。本页面只登记清理请求，不自动清空数据，也不自动停止或杀死任何任务。';
        }
    }
    async copyPurgeCommand(){const {purge,purgeProject}=this.state;if(!purge||!purgeProject||purgeProject.id!==purge.projectId)return;const epoch=this.purgeReadEpoch;try{await navigator.clipboard.writeText(powershellPurgeCommand(purgeProject,purge));if(this.mounted&&epoch===this.purgeReadEpoch)this.setState({notice:'PowerShell 命令已复制；请自行核对并离线运行。'});}catch{if(this.mounted&&epoch===this.purgeReadEpoch)this.setState({purgeError:'无法自动复制，请从下方选中命令手动复制。'});}}
    purgeView(){
        const {purge, purging,purgeProject,purgeProjectId,purgeReading,purgeError}=this.state;
        const project=purgeProject?.id===purgeProjectId?purgeProject:purging.find(row=>row.id===purgeProjectId),command=purge&&project?powershellPurgeCommand(project,purge):'';
        const phases={waiting_offline:'等待离线',planning:'核对清理计划',files:'清理已确认文件',records:'清理项目记录',verify:'核验结果',completed:'完成'};
        return <section className="project-purge-status" aria-label="项目永久删除进度"><h3>{project?.name??'项目清理回执'}</h3><code>项目 ID：{purgeProjectId}</code>{purgeReading?<p role="status">正在读取清理状态…</p>:null}{purgeError?<p role="alert" className="error-text">{purgeError}</p>:null}
            {purge?<><p role="status"><strong>{purge.state==='completed'?'永久删除已完成':purge.state==='failed'?'清理失败，未完全删除':purge.state==='running'?'离线清理正在进行':'待离线清理'}</strong></p><dl className="details"><dt>清理任务</dt><dd><code>{purge.purgeId}</code></dd><dt>阶段</dt><dd>{phases[purge.phase]}</dd><dt>文件进度</dt><dd>{purge.completedPaths} / {purge.totalPaths}</dd><dt>最近更新</dt><dd>{date(purge.updatedAt)}</dd></dl>{purge.error?<p role="alert" className="error-text">{purge.error}</p>:null}
                {purge.state==='completed'?<p className="small muted">已收到实际完成回执。保留的共享资源、凭据、原始导入文件、GitHub、外部资源和旧备份不属于此次项目清理范围。</p>:<><p className="small muted">项目已不可还原，尚未完全删除。未登记内容或无法证明所有权的文件会使离线核验保守拒绝并保留数据；请根据错误核对，再显式续清。</p><p>请自行退出所有正常写入进程并核对全部任务与未知状态，然后在项目代码目录打开 PowerShell 运行。此页面不会执行命令或停止进程。</p>{command?<><label>PowerShell 离线清理命令<textarea aria-label="PowerShell 离线清理命令" readOnly rows={4} value={command}/></label><button type="button" className="secondary compact" disabled={purgeReading} onClick={()=>void this.copyPurgeCommand()}>复制 PowerShell 命令</button></>:<p className="small muted">当前项目名称尚未核验，刷新状态后再获取命令。</p>}</>}
            </>:null}<button type="button" className="secondary compact" disabled={purgeReading} onClick={()=>void this.openPurge(purgeProjectId,project)}>刷新清理状态</button>
        </section>;
    }
    render(){
        const {target,busy,loading,error,notice,conflict,purgeProjectId,confirmName}=this.state;
        return <Modal title={target?titles[target.action]:purgeProjectId?'永久删除状态':'项目管理'} description={target?this.description(target):purgeProjectId?'从管理状态核对离线清理进度；刷新不会启动或恢复清理。':'打开活动或已归档项目，管理回收站中的保留项目。'} alert={!!target} wide={!target} onClose={this.close} onSubmit={()=>void this.confirm()} submitLabel={target?({archive:'确认归档',unarchive:'确认取消归档',trash:'确认移入回收站',restore:'确认还原',purge:'确认永久删除'})[target.action]:''} submitDisabled={conflict||target?.action==='purge'&&confirmName!==target.project.name} hideSubmit={!target} cancelLabel={target||purgeProjectId?'返回项目列表':'关闭'} busy={busy}>
            {error?<div role="alert" className="error-text"><p>{error}</p>{target&&!conflict?<p className="small muted">网络失联时再次确认会复用同一请求，避免重复操作。</p>:null}</div>:null}{notice?<p role="status">{notice}</p>:null}
            {target?<div className="project-confirmation"><strong>{target.project.name}</strong><code>{target.action==='purge'?target.project.id:short(target.project.id)} · 版本 {target.project.version}</code>{target.action==='purge'?<label>输入完整项目名称以确认<input required aria-label="永久删除确认项目名称" aria-describedby="project-purge-name-help" aria-invalid={!!confirmName&&confirmName!==target.project.name} autoComplete="off" disabled={busy} value={confirmName} onChange={event=>this.setState({confirmName:event.target.value})}/><span id="project-purge-name-help" className="small muted">必须完全一致，包括空格与大小写。确认后不可还原。</span></label>:null}{target.action==='trash'?<p className="small muted">还原后状态：{target.project.status==='archived'?'已归档':'活动'}</p>:null}{conflict?<button type="button" className="secondary" disabled={busy} onClick={()=>void this.reloadTarget()}>刷新目标后重新确认</button>:null}</div>:purgeProjectId?this.purgeView():<>
                <div className="project-management-toolbar"><button type="button" className="secondary compact" disabled={loading||busy} onClick={()=>void this.load()}>刷新项目列表</button>{this.state.lastPurgeId?<button type="button" className="text-button" disabled={busy} onClick={()=>void this.openPurge(this.state.lastPurgeId)}>查看上次清理状态</button>:null}{loading?<span role="status" className="loading-indicator"><span className="loading-spinner" aria-hidden="true"/>正在读取项目…</span>:null}</div>
                {(['active','archived','trashed','purging'] as const).map(status=><section className="project-management-group" key={status} aria-label={status==='active'?'活动项目':status==='archived'?'已归档项目':status==='purging'?'正在永久删除':'回收站'}><h3>{status==='active'?'活动项目':status==='archived'?'已归档项目':status==='purging'?'正在永久删除':'回收站'} <span className="muted">{this.state[status].length}</span></h3><ul>{this.state[status].map(project=><li key={project.id}><div><strong>{project.name}</strong><small>{short(project.id)}{status==='archived'?' · 只读历史':status==='trashed'?` · 删除前：${project.restoreStatus==='archived'?'已归档':'活动'}`:''}</small>{status==='trashed'&&'deletedAt' in project?<small>移入时间：{date(project.deletedAt as string)}</small>:null}</div><div className="actions">{status==='purging'?<button type="button" className="secondary compact" disabled={busy} onClick={()=>void this.openPurge(project.id,summary(project))}>查看清理状态</button>:status==='trashed'?<><button type="button" className="secondary compact" disabled={busy} onClick={()=>this.choose(project,'restore')}>还原</button><button type="button" className="text-button danger" disabled={busy} onClick={()=>this.choose(project,'purge')}>永久删除</button></>:<><button type="button" className="secondary compact" disabled={busy} onClick={()=>this.props.onOpen(project.id)}>打开{status==='archived'?'历史':''}</button><button type="button" className="text-button" disabled={busy} onClick={()=>this.choose(project,status==='active'?'archive':'unarchive')}><Icon name="archive" size={15}/>{status==='active'?'归档':'取消归档'}</button><button type="button" className="text-button danger" disabled={busy} onClick={()=>this.choose(project,'trash')}>移入回收站</button></>}</div></li>)}</ul>{!loading&&!this.state[status].length?<p className="inline-empty">{status==='active'?'暂无活动项目。':status==='archived'?'暂无已归档项目。':status==='purging'?'暂无待完成的永久删除。':'回收站为空。'}</p>:null}</section>)}
            </>}
        </Modal>;
    }
}
