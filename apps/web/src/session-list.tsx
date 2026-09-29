import * as React from 'react';
import {api} from './api.js';
import type {SessionCatalogPage,Row,Session} from './models.js';

type Role='all'|'coordinator'|'literature'|'designer'|'implementer'|'analyst'|'reviewer'|'writer';
interface Props {projectId:string;selectedId:string;selected?:Row<Session>;onSelect:(id:string)=>void;onNew:()=>void;}
interface State {draft:string;query:string;role:Role;page:SessionCatalogPage|null;cursors:(string|undefined)[];index:number;busy:boolean;error:string;}
const roles:Record<Role,string>={all:'全部角色',coordinator:'主协调者',literature:'文献',designer:'设计',implementer:'实现',analyst:'分析',reviewer:'审查',writer:'写作'};

export class SessionList extends React.Component<Props,State> {
    state:State={draft:'',query:'',role:'coordinator',page:null,cursors:[undefined],index:0,busy:false,error:''};
    private generation=0;
    componentDidMount(){void this.load();}
    componentDidUpdate(previous:Props){if(previous.projectId!==this.props.projectId){this.generation++;this.setState({draft:'',query:'',role:'coordinator',page:null,cursors:[undefined],index:0,error:''},()=>void this.load());}else if(previous.selectedId!==this.props.selectedId&&this.state.index===0&&!this.state.query)void this.load();}
    componentWillUnmount(){this.generation++;}
    async load(cursor=this.state.cursors[this.state.index],query=this.state.query,role=this.state.role){
        if(!this.props.projectId)return;
        const generation=++this.generation,projectId=this.props.projectId;
        this.setState({busy:true,error:''});
        try{
            const page=await api<SessionCatalogPage>('/operations/session_list',{projectId,input:{query,role,limit:10,...(cursor?{beforeSessionId:cursor}:{})}});
            if(generation===this.generation&&projectId===this.props.projectId)this.setState({page,busy:false});
        }catch(error){if(generation===this.generation)this.setState({busy:false,error:error instanceof Error?error.message:String(error)});}
    }
    search=(event:React.FormEvent)=>{event.preventDefault();this.setState({query:this.state.draft.trim(),cursors:[undefined],index:0,page:null},()=>void this.load());};
    changeRole=(role:Role)=>this.setState({role,cursors:[undefined],index:0,page:null},()=>void this.load());
    next=()=>{const cursor=this.state.page?.nextCursor;if(!cursor)return;const cursors=[...this.state.cursors.slice(0,this.state.index+1),cursor];this.setState({cursors,index:this.state.index+1},()=>void this.load());};
    previous=()=>{if(this.state.index===0)return;this.setState({index:this.state.index-1},()=>void this.load());};
    render(){
        const {selectedId,selected,onSelect,onNew}=this.props,{page,busy,error,index}=this.state;
        const items=page?.items??[];
        const selectedOutside=selected&&selectedId&&!items.some(item=>item.id===selectedId);
        const row=(item:{id:string;state:string;title:string})=><button key={item.id} className={item.id===selectedId?'selected-session':''} onClick={()=>onSelect(item.id)}><span className={'session-dot '+(item.state==='running'?'live':'')}/><span>{item.title}</span></button>;
        return <div className="sidebar-sessions"><div className="sidebar-caption">会话<button aria-label="新建会话" title="新建会话" className="icon-button" disabled={!this.props.projectId} onClick={onNew}>＋</button></div>
            <form className="session-search" onSubmit={this.search}><input aria-label="搜索会话" placeholder="搜索会话" value={this.state.draft} onChange={event=>this.setState({draft:event.target.value})}/><button type="submit" disabled={busy}>搜索</button></form>
            <select className="session-role" aria-label="会话角色" value={this.state.role} onChange={event=>this.changeRole(event.target.value as Role)}>{Object.entries(roles).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select>
            {selectedOutside?row(selected):null}
            {items.map(row)}
            {error?<p role="alert" className="small error-text">{error}</p>:null}
            {!busy&&page&&items.length===0?<p className="small muted">没有匹配的会话</p>:null}
            <div className="session-pages"><button type="button" disabled={busy||index===0} onClick={this.previous}>上一页</button><span>{index+1}</span><button type="button" disabled={busy||!page?.nextCursor} onClick={this.next}>下一页</button></div>
        </div>;
    }
}
