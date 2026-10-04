import * as React from 'react';
import {api} from './api.js';
import type {SessionCatalogPage,Row,Session} from './models.js';
import {Icon} from './ui.js';

type Role='all'|'coordinator'|'literature'|'designer'|'implementer'|'analyst'|'reviewer'|'writer';
type StateFilter='active'|'archived'|'all';
type CatalogPage=SessionCatalogPage&{stateFilter:StateFilter};
interface Props {projectId:string;selectedId:string;selected?:Row<Session>;onSelect:(id:string)=>void;creationSignal:number;busy:boolean;}
interface State {draft:string;query:string;role:Role;stateFilter:StateFilter;page:CatalogPage|null;cursors:(string|undefined)[];index:number;busy:boolean;error:string;}
const roles:Record<Role,string>={all:'全部角色',coordinator:'主协调者',literature:'文献',designer:'设计',implementer:'实现',analyst:'分析',reviewer:'审查',writer:'写作'};
const filters:Record<StateFilter,string>={active:'活跃',archived:'已归档',all:'全部'};

export class SessionList extends React.Component<Props,State> {
    state:State={draft:'',query:'',role:'coordinator',stateFilter:'active',page:null,cursors:[undefined],index:0,busy:false,error:''};
    private generation=0;
    componentDidMount(){void this.load();}
    componentDidUpdate(previous:Props){if(previous.projectId!==this.props.projectId){this.generation++;this.setState({draft:'',query:'',role:'coordinator',stateFilter:'active',page:null,cursors:[undefined],index:0,error:''},()=>void this.load());}else if(previous.creationSignal!==this.props.creationSignal){this.generation++;this.setState({stateFilter:'active',page:null,cursors:[undefined],index:0},()=>void this.load(undefined,this.state.query,this.state.role,'active'));}else if(previous.selectedId!==this.props.selectedId&&this.state.index===0&&!this.state.query)void this.load();}
    componentWillUnmount(){this.generation++;}
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
    render(){
        const {selectedId,selected,onSelect}=this.props,{page,busy,error,index,stateFilter}=this.state;
        const items=page?.items??[];
        const selectedMatchesFilter=selected&&(stateFilter==='all'||(stateFilter==='archived'?selected.state==='archived':selected.state!=='archived'));
        const selectedOutside=selectedMatchesFilter&&selectedId&&!items.some(item=>item.id===selectedId);
        const row=(item:{id:string;state:string;title:string})=><button key={item.id} className={item.id===selectedId?'selected-session':''} aria-current={item.id===selectedId?'page':undefined} title={item.title} onClick={()=>onSelect(item.id)}><Icon name={item.state==='archived'?'archive':'chat'} size={16}/><span className="session-label">{item.title}</span>{item.state==='archived'?<span className="session-state-pill">已归档</span>:item.state==='running'?<span className="session-state-pill s-running">运行中</span>:null}</button>;
        return <div className="sidebar-sessions"><div className="sidebar-caption"><span>会话</span><label className="session-state-filter"><Icon name="filter" size={14}/><select aria-label="会话分类" value={stateFilter} disabled={!this.props.projectId||this.props.busy} onChange={event=>this.changeStateFilter(event.target.value as StateFilter)}>{Object.entries(filters).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label></div>
            <details className="session-filters"><summary>查找与筛选{this.state.query?' · 已筛选':''}</summary><form className="session-search" onSubmit={this.search}><input aria-label="搜索会话" placeholder="搜索会话" value={this.state.draft} onChange={event=>this.setState({draft:event.target.value})}/><button type="submit" disabled={busy}>搜索</button></form>
            <select className="session-role" aria-label="会话角色" value={this.state.role} onChange={event=>this.changeRole(event.target.value as Role)}>{Object.entries(roles).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></details>
            {selectedOutside?row(selected):null}
            {items.map(row)}
            {error?<p role="alert" className="small error-text">{error}</p>:null}
            {!busy&&page&&items.length===0?<p className="small muted">{this.state.query?'没有匹配的会话':stateFilter==='active'?'暂无活跃会话':stateFilter==='archived'?'暂无已归档会话':'没有匹配的会话'}</p>:null}
            <div className="session-pages"><button type="button" disabled={busy||index===0} onClick={this.previous}>上一页</button><span>{index+1}</span><button type="button" disabled={busy||!page?.nextCursor} onClick={this.next}>下一页</button></div>
        </div>;
    }
}
