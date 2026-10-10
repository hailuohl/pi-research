import * as React from 'react';
import {Icon} from './ui.js';

export type ResourceView = 'literature' | 'evidence' | 'reports';
const resourceViews: Array<[ResourceView, string, string]> = [['literature', '文献与原文', 'search'], ['evidence', '资料与证据', 'evidence'], ['reports', '报告与成果', 'report']];
export function resourceView(value:unknown):ResourceView|'' { return resourceViews.some(([id])=>id===value)?value as ResourceView:''; }

export class ConversationResources extends React.Component<{
    view:ResourceView|'';onView:(view:ResourceView|'')=>void;views:Record<ResourceView,React.ReactNode>;
},{visited:ResourceView[]}> {
    state={visited:this.props.view?[this.props.view]:[]};
    static getDerivedStateFromProps(props:ConversationResources['props'],state:ConversationResources['state']) {
        return props.view&&!state.visited.includes(props.view)?{visited:[...state.visited,props.view]}:null;
    }
    render(){const {view,onView,views}=this.props;return <details className="workflow-history conversation-resources" aria-label="项目资料与成果" aria-live="off" open={!!view} onToggle={event=>{
        if(event.target!==event.currentTarget)return;
        if(event.newState==='closed'&&view)onView('');
        else if(event.newState==='open'&&!view)onView('literature');
    }}><summary>项目资料与成果</summary><p className="small muted">查看项目历史，核对原文、授权范围和结论；研究任务继续在当前对话中推进。</p><div className="actions wrap" aria-label="资料分类">{resourceViews.map(([id,title,icon])=><button key={id} type="button" className="secondary compact" aria-pressed={view===id} onClick={()=>onView(id)}><Icon name={icon} size={15}/><span>{title}</span></button>)}</div>{this.state.visited.map(id=><section key={id} hidden={view!==id} aria-label={resourceViews.find(([value])=>value===id)![1]}>{views[id]}</section>)}</details>;}
}
