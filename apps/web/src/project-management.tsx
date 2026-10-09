import * as React from 'react';
import {api,ApiError} from './api.js';
import type {Project,ProjectLifecycleView,Row} from './models.js';
import {Modal,Icon} from './ui.js';
import {short,date} from './models.js';

type Action='archive'|'unarchive'|'trash'|'restore';
type Target={project:ProjectLifecycleView;action:Action;key:string};
const titles:Record<Action,string>={archive:'归档项目',unarchive:'取消项目归档',trash:'移入回收站',restore:'还原项目'};
const notices:Record<Action,string>={archive:'项目已归档，历史保留且只读。',unarchive:'已取消归档，旧审批、权限与队列不会恢复。',trash:'项目已移入回收站；文件保留，普通入口不再可读。',restore:'项目已还原；旧审批、权限、队列和自动化不会恢复。'};
function summary(project:Row<Project>|ProjectLifecycleView):ProjectLifecycleView{
    const status=project.status??(project.archived?'archived':'active');
    return {id:project.id,name:project.name,version:project.version,status,lifecycleEpoch:project.lifecycleEpoch,archived:status!=='active',createdAt:project.createdAt,updatedAt:project.updatedAt,...('deletedAt' in project&&project.deletedAt?{deletedAt:project.deletedAt}:{}),...(project.restoreStatus?{restoreStatus:project.restoreStatus}:{})};
}
function resultStatus(target:Target):ProjectLifecycleView['status']{
    if(target.action==='restore'){
        if(!target.project.restoreStatus)throw Error('还原目标缺少删除前状态，请刷新项目后重新确认');
        return target.project.restoreStatus;
    }
    return target.action==='archive'?'archived':target.action==='unarchive'?'active':'trashed';
}
export class ProjectManagement extends React.Component<{
    onClose:()=>void;onOpen:(id:string)=>void;
    selectionToken:()=>number;
    onChanged:(project:ProjectLifecycleView,token:number)=>Promise<void>;
},{active:Row<Project>[];archived:Row<Project>[];trashed:ProjectLifecycleView[];loading:boolean;busy:boolean;error:string;target:Target|null;conflict:boolean;notice:string}> {
    state={active:[] as Row<Project>[],archived:[] as Row<Project>[],trashed:[] as ProjectLifecycleView[],loading:true,busy:false,error:'',target:null as Target|null,conflict:false,notice:''};
    private mounted=true;private readEpoch=0;private changing=false;
    componentDidMount(){void this.load();}
    componentWillUnmount(){this.mounted=false;this.readEpoch++;}
    async load(){
        const epoch=++this.readEpoch;this.setState({loading:true,error:''});
        try{
            const [active,archived,trashed]=await Promise.all([api<Row<Project>[]>('/projects?status=active'),api<Row<Project>[]>('/projects?status=archived'),api<ProjectLifecycleView[]>('/projects?status=trashed')]);
            if(!Array.isArray(active)||!Array.isArray(archived)||!Array.isArray(trashed))throw Error('项目目录读取失败');
            if(this.mounted&&epoch===this.readEpoch)this.setState({active,archived,trashed});
        }catch(error){if(this.mounted&&epoch===this.readEpoch)this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted&&epoch===this.readEpoch)this.setState({loading:false});}
    }
    choose(project:Row<Project>|ProjectLifecycleView,action:Action){if(this.changing)return;this.setState({target:{project:summary(project),action,key:crypto.randomUUID()},conflict:false,error:'',notice:''});}
    async reloadTarget(){
        const target=this.state.target;if(!target||this.changing)return;this.setState({busy:true,error:''});
        try{
            const project=await api<ProjectLifecycleView>(`/projects/${encodeURIComponent(target.project.id)}/lifecycle`);
            if(project.id!==target.project.id||project.status!==target.project.status)throw Error('项目状态已改变，请返回项目列表重新选择操作');
            if(this.mounted&&this.state.target===target)this.setState({target:{...target,project,key:crypto.randomUUID()},conflict:false,notice:'已刷新目标版本，请重新核对项目并确认。'});
        }catch(error){if(this.mounted)this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted)this.setState({busy:false});}
    }
    async confirm(){
        const target=this.state.target;if(!target||this.changing||this.state.busy||this.state.conflict)return;
        this.changing=true;const token=this.props.selectionToken(),onChanged=this.props.onChanged;this.setState({busy:true,error:'',notice:''});
        try{
            const expectedStatus=resultStatus(target),project=summary(await api<ProjectLifecycleView>(`/projects/${encodeURIComponent(target.project.id)}/${target.action}`,{expectedVersion:target.project.version},'POST',undefined,target.key));
            if(project.id!==target.project.id||project.status!==expectedStatus)throw Error('项目响应与确认目标不一致，请刷新项目状态');
            if(!this.mounted)return;await onChanged(project,token);if(!this.mounted)return;
            this.setState({target:null,conflict:false,notice:notices[target.action]});await this.load();
        }catch(error){if(this.mounted)this.setState({error:error instanceof Error?error.message:String(error),conflict:error instanceof ApiError&&(error.status===409&&(error.code.includes('VERSION')||error.code.includes('CONFLICT')))});}
        finally{this.changing=false;if(this.mounted)this.setState({busy:false});}
    }
    close=()=>{if(this.state.busy)return;if(this.state.target)this.setState({target:null,error:'',conflict:false,notice:''});else this.props.onClose();};
    description(target:Target){
        switch(target.action){
            case 'archive':return '归档后项目从活动列表隐藏，会话、源码与已有成果保留为只读。尚未完成的作业或请求会阻止归档。';
            case 'unarchive':return '取消归档保留项目 ID 与历史。旧审批、授权和消息队列不会重新生效。已有授权绑定的旧会话仍可查看；请新建会话并重新授权后继续工作。';
            case 'trash':return '项目移入回收站后，会话、源码与成果停止通过普通入口读取，文件保留且可还原到当前状态。旧审批、权限、消息队列和自动化不会恢复。尚未完成的作业或请求会阻止此操作。';
            case 'restore':return `项目将还原为${target.project.restoreStatus==='archived'?'已归档，只读查看历史':'活动项目'}，保留原项目 ID 和历史。旧审批、权限、消息队列和自动化不会重新生效；已有授权绑定的旧会话请通过新建会话并重新授权后继续工作。`;
        }
    }
    render(){
        const {target,busy,loading,error,notice,conflict}=this.state;
        return <Modal title={target?titles[target.action]:'项目管理'} description={target?this.description(target):'打开活动或已归档项目，管理回收站中的保留项目。'} alert={!!target} wide={!target} onClose={this.close} onSubmit={()=>void this.confirm()} submitLabel={target?({archive:'确认归档',unarchive:'确认取消归档',trash:'确认移入回收站',restore:'确认还原'})[target.action]:''} submitDisabled={conflict} hideSubmit={!target} cancelLabel={target?'返回项目列表':'关闭'} busy={busy}>
            {error?<div role="alert" className="error-text"><p>{error}</p>{target&&!conflict?<p className="small muted">网络失联时再次确认会复用同一请求，避免重复操作。</p>:null}</div>:null}{notice?<p role="status">{notice}</p>:null}
            {target?<div className="project-confirmation"><strong>{target.project.name}</strong><code>{short(target.project.id)} · 版本 {target.project.version}</code>{target.action==='trash'?<p className="small muted">还原后状态：{target.project.status==='archived'?'已归档':'活动'}</p>:null}{conflict?<button type="button" className="secondary" disabled={busy} onClick={()=>void this.reloadTarget()}>刷新目标后重新确认</button>:null}</div>:<>
                <div className="project-management-toolbar"><button type="button" className="secondary compact" disabled={loading||busy} onClick={()=>void this.load()}>刷新项目列表</button>{loading?<span role="status">正在读取项目…</span>:null}</div>
                {(['active','archived','trashed'] as const).map(status=><section className="project-management-group" key={status} aria-label={status==='active'?'活动项目':status==='archived'?'已归档项目':'回收站'}><h3>{status==='active'?'活动项目':status==='archived'?'已归档项目':'回收站'} <span className="muted">{this.state[status].length}</span></h3><ul>{this.state[status].map(project=><li key={project.id}><div><strong>{project.name}</strong><small>{short(project.id)}{status==='archived'?' · 只读历史':status==='trashed'?` · 删除前：${project.restoreStatus==='archived'?'已归档':'活动'}`:''}</small>{status==='trashed'&&'deletedAt' in project?<small>移入时间：{date(project.deletedAt as string)}</small>:null}</div><div className="actions">{status==='trashed'?<button type="button" className="secondary compact" disabled={busy} onClick={()=>this.choose(project,'restore')}>还原</button>:<><button type="button" className="secondary compact" disabled={busy} onClick={()=>this.props.onOpen(project.id)}>打开{status==='archived'?'历史':''}</button><button type="button" className="text-button" disabled={busy} onClick={()=>this.choose(project,status==='active'?'archive':'unarchive')}><Icon name="archive" size={15}/>{status==='active'?'归档':'取消归档'}</button><button type="button" className="text-button danger" disabled={busy} onClick={()=>this.choose(project,'trash')}>移入回收站</button></>}</div></li>)}</ul>{!loading&&!this.state[status].length?<p className="inline-empty">{status==='active'?'暂无活动项目。':status==='archived'?'暂无已归档项目。':'回收站为空。'}</p>:null}</section>)}
            </>}
        </Modal>;
    }
}
