import * as React from 'react';
import {api} from './api.js';
import type {SessionCatalogPage,Row,Session} from './models.js';
import {Icon, Modal, nativeSelectButton} from './ui.js';

type Role='all'|'coordinator'|'literature'|'designer'|'implementer'|'analyst'|'reviewer'|'writer';
type StateFilter='active'|'archived'|'all';
type CatalogPage=SessionCatalogPage&{stateFilter:StateFilter};
interface Props {projectId:string;selectedId:string;selected?:Row<Session>;onSelect:(id:string)=>void;creationSignal:number;busy:boolean;projectArchived?:boolean;onChanged?:(session:Row<Session>,action:LifecycleAction)=>void;}
type LifecycleAction='archive'|'unarchive'|'delete';
interface Target {projectId:string;selectedId:string;id:string;version:number;title:string;action:LifecycleAction;key:string;}
const actionLabels={archive:'归档会话',unarchive:'取消归档会话',delete:'删除会话'};
interface State {draft:string;query:string;role:Role;stateFilter:StateFilter;page:CatalogPage|null;cursors:(string|undefined)[];index:number;busy:boolean;error:string;target:Target|null;confirmTitle:string;actionBusy:boolean;actionError:string;}
const roles:Record<Role,string>={all:'全部角色',coordinator:'主协调者',literature:'文献',designer:'设计',implementer:'实现',analyst:'分析',reviewer:'审查',writer:'写作'};
const filters:Record<StateFilter,string>={active:'活跃',archived:'已归档',all:'全部'};

export class SessionList extends React.Component<Props,State> {
    state:State={draft:'',query:'',role:'coordinator',stateFilter:'active',page:null,cursors:[undefined],index:0,busy:false,error:'',target:null,confirmTitle:'',actionBusy:false,actionError:''};
    private generation=0;
    private lifecycleEpoch=0;
    private submitting=false;
    componentDidMount(){void this.load();}
    componentDidUpdate(previous:Props){if(previous.projectId!==this.props.projectId||previous.selectedId!==this.props.selectedId){this.lifecycleEpoch++;this.submitting=false;this.setState({target:null,actionBusy:false,actionError:'',confirmTitle:''});}if(previous.projectId!==this.props.projectId){this.generation++;this.setState({draft:'',query:'',role:'coordinator',stateFilter:'active',page:null,cursors:[undefined],index:0,error:''},()=>void this.load());}else if(previous.creationSignal!==this.props.creationSignal){this.generation++;this.setState({stateFilter:'active',page:null,cursors:[undefined],index:0},()=>void this.load(undefined,this.state.query,this.state.role,'active'));}else if(previous.selectedId!==this.props.selectedId&&this.state.index===0&&!this.state.query||previous.selectedId===this.props.selectedId&&(previous.selected?.title!==this.props.selected?.title||previous.selected?.state!==this.props.selected?.state))void this.load();}
    componentWillUnmount(){this.generation++;this.lifecycleEpoch++;}
    async load(cursor=this.state.cursors[this.state.index],query=this.state.query,role=this.state.role,stateFilter=this.state.stateFilter){
        if(!this.props.projectId)return;
        const generation=++this.generation,projectId=this.props.projectId;
        this.setState({busy:true,error:''});
        try{
            const page=await api<CatalogPage>('/operations/session_list',{projectId,input:{query,role,stateFilter,limit:10,...(cursor?{beforeSessionId:cursor}:{})}});
            if(generation===this.generation&&projectId===this.props.projectId)this.setState({page,busy:false});
        }catch(error){if(generation===this.generation)this.setState({busy:false,error:error instanceof Error?error.message:String(error)});}
    }
    search=(event:React.FormEvent)=>{event.preventDefault();this.generation++;this.setState({query:this.state.draft.trim(),cursors:[undefined],index:0,page:null},()=>void this.load());};
    changeRole=(role:Role)=>{this.generation++;this.setState({role,cursors:[undefined],index:0,page:null},()=>void this.load());};
    changeStateFilter=(stateFilter:StateFilter)=>{if(stateFilter===this.state.stateFilter)return;this.generation++;this.setState({stateFilter,cursors:[undefined],index:0,page:null},()=>void this.load(undefined,this.state.query,this.state.role,stateFilter));};
    next=()=>{const cursor=this.state.page?.nextCursor;if(!cursor)return;const cursors=[...this.state.cursors.slice(0,this.state.index+1),cursor];this.setState({cursors,index:this.state.index+1},()=>void this.load());};
    previous=()=>{if(this.state.index===0)return;this.setState({index:this.state.index-1},()=>void this.load());};
    openAction=(item:{id:string;version:number;title:string},action:LifecycleAction)=>{if(this.submitting)return;this.setState({target:{projectId:this.props.projectId,selectedId:this.props.selectedId,id:item.id,version:item.version,title:item.title,action,key:crypto.randomUUID()},confirmTitle:'',actionError:''});};
    submitAction=async()=>{
        const target=this.state.target;if(!target||this.submitting||this.props.projectArchived||this.props.busy||target.action==='delete'&&this.state.confirmTitle!==target.title)return;
        const epoch=this.lifecycleEpoch,current=()=>epoch===this.lifecycleEpoch&&this.state.target===target&&this.props.projectId===target.projectId&&this.props.selectedId===target.selectedId;
        this.submitting=true;this.setState({actionBusy:true,actionError:''});
        try{
            const result=await api<Row<Session>>(`/sessions/${encodeURIComponent(target.id)}/${target.action}`,{expectedVersion:target.version,...(target.action==='delete'?{confirmTitle:target.title}:{})},'POST',undefined,target.key);
            if(!current())return;
            if(result.id!==target.id||result.projectId!==target.projectId||!Number.isInteger(result.version)||result.version<=target.version||result.state!==(target.action==='unarchive'?'idle':'archived')||(target.action==='delete'?!result.deletedAt:!!result.deletedAt))throw Error('会话回执与确认目标不一致');
            this.props.onChanged?.(result,target.action);
            if(!current())return;
            this.setState({target:null,actionBusy:false,page:null,cursors:[undefined],index:0},()=>void this.load());
        }catch(error){if(current())this.setState({actionError:error instanceof Error?error.message:String(error)});}
        finally{if(epoch===this.lifecycleEpoch){this.submitting=false;this.setState({actionBusy:false});}}
    };
    render(){
        const {selectedId,selected,onSelect}=this.props,{page,busy,error,index,stateFilter}=this.state;
        const items=(page?.items??[]).filter(item=>!('deletedAt'in item&&item.deletedAt)).map(item=>item.id===selectedId&&selected?.id===item.id&&selected.version>=item.version?{...item,title:selected.title,state:selected.state,version:selected.version}:item);
        const selectedMatchesFilter=selected&&!selected.deletedAt&&(stateFilter==='all'||(stateFilter==='archived'?selected.state==='archived':selected.state!=='archived'));
        const selectedOutside=selectedMatchesFilter&&selectedId&&!items.some(item=>item.id===selectedId);
        const row=(item:{id:string;state:string;title:string;version:number;taskId?:string})=>{
            const disabled=this.props.busy||this.props.projectArchived||this.state.actionBusy||item.state==='running'||!!item.taskId;
            return <div key={item.id} className="session-list-row"><button className={item.id===selectedId?'selected-session':''} aria-current={item.id===selectedId?'page':undefined} title={item.title} onClick={()=>onSelect(item.id)}><Icon name={item.state==='archived'?'archive':'chat'} size={16}/><span className="session-label">{item.title}</span>{item.state==='archived'?<span className="session-state-pill">已归档</span>:item.state==='running'?<span className="session-state-pill s-running">运行中</span>:null}</button><div className="session-row-actions"><button type="button" aria-label={`${item.state==='archived'?'取消归档':'归档'}会话：${item.title}`} title={item.state==='archived'?'取消归档':'归档'} disabled={disabled} onClick={()=>this.openAction(item,item.state==='archived'?'unarchive':'archive')}><Icon name="archive" size={14}/></button><button type="button" aria-label={`删除会话：${item.title}`} title="删除会话" disabled={disabled} onClick={()=>this.openAction(item,'delete')}><Icon name="close" size={14}/></button></div></div>;
        };
        return <div className="sidebar-sessions"><div className="sidebar-caption"><span>会话</span><label className="session-state-filter"><Icon name="filter" size={14}/><select aria-label="会话分类" value={stateFilter} disabled={!this.props.projectId||this.props.busy} onChange={event=>this.changeStateFilter(event.target.value as StateFilter)}>{nativeSelectButton}{Object.entries(filters).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label></div>
            <details className="session-filters"><summary>查找与筛选{this.state.query?' · 已筛选':''}</summary><form className="session-search" onSubmit={this.search}><input aria-label="搜索会话" placeholder="搜索会话" value={this.state.draft} onChange={event=>this.setState({draft:event.target.value})}/><button type="submit" disabled={busy}>搜索</button></form>
            <select className="session-role" aria-label="会话角色" value={this.state.role} onChange={event=>this.changeRole(event.target.value as Role)}>{nativeSelectButton}{Object.entries(roles).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></details>
            {selectedOutside?row(selected):null}
            {items.map(row)}
            {error?<p role="alert" className="small error-text">{error}</p>:null}
            {!busy&&page&&items.length===0?<p className="small muted">{this.state.query?'没有匹配的会话':stateFilter==='active'?'暂无活跃会话':stateFilter==='archived'?'暂无已归档会话':'没有匹配的会话'}</p>:null}
            {this.state.target?<Modal title={actionLabels[this.state.target.action]} submitLabel={actionLabels[this.state.target.action]} busy={this.state.actionBusy} closeDisabled={this.state.actionBusy} submitDisabled={this.props.projectArchived||this.props.busy||this.state.target.action==='delete'&&this.state.confirmTitle!==this.state.target.title} onClose={()=>{if(!this.submitting)this.setState({target:null});}} onSubmit={this.submitAction}>
                <p>{this.state.target.title}</p><p className="muted">{this.state.target.action==='delete'?'删除后不会出现在会话目录中，不能取消删除。消息、文件、分支和科研记录保留。请输入完整会话标题确认。':this.state.target.action==='archive'?'归档后可从已归档分类查看和取消归档。未开始的队列与旧执行权限将失效。':'取消归档后回到空闲状态，旧队列和旧执行权限不会恢复。'}</p>
                {this.state.target.action==='delete'?<label>确认会话标题<input aria-label="确认会话标题" value={this.state.confirmTitle} disabled={this.state.actionBusy} onChange={event=>this.setState({confirmTitle:event.target.value})}/></label>:null}
                {this.state.actionError?<p role="alert" className="error-text">{this.state.actionError}</p>:null}
            </Modal>:null}
            <div className="session-pages"><button type="button" disabled={busy||index===0} onClick={this.previous}>上一页</button><span>{index+1}</span><button type="button" disabled={busy||!page?.nextCursor} onClick={this.next}>下一页</button></div>
        </div>;
    }
}
