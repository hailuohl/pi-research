import * as React from 'react';
import {EvidenceView,LiteratureView,ReportsView} from './data-views.js';
import type {DocumentLocation,ProjectState} from './models.js';
import type {Perform} from './workbench.js';

export class ArchivedResearchHistory extends React.Component<{data:ProjectState;perform:Perform},{kind:string;document:DocumentLocation|undefined;reportId:string}> {
    state={kind:'reports',document:undefined as DocumentLocation|undefined,reportId:''};
    render(){const {data,perform}=this.props;return <section className="workflow-card research-action-card" aria-label="归档项目历史" tabIndex={-1}><h2>归档历史 · 只读查看</h2><div className="actions wrap">{[['documents','原文'],['evidence','证据与结论'],['reports','报告']].map(([kind,title])=><button type="button" key={kind} className="secondary compact" aria-pressed={this.state.kind===kind} onClick={()=>this.setState({kind,document:undefined})}>{title}</button>)}</div>{this.state.kind==='documents'||this.state.document?<LiteratureView readOnly embedded data={data} perform={perform} selectedDocument={this.state.document} onDocument={document=>this.setState({document})}/>:this.state.kind==='reports'?<ReportsView readOnly embedded data={data} perform={perform} selectedReport={this.state.reportId||undefined} onSelect={reportId=>this.setState({reportId})} onDocument={document=>this.setState({document})}/>:<EvidenceView readOnly embedded data={data} perform={perform} onRegister={()=>{}} onClaim={()=>{}} onDocument={document=>this.setState({document})}/>}</section>;}
}
