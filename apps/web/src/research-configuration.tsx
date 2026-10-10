import * as React from 'react';
import {api} from './api.js';
import type {PublicationCompilerStatus} from './models.js';
import type {Perform} from './workbench.js';

export class PublicationCompilerConfiguration extends React.Component<{projectId:string;readOnly?:boolean;perform:Perform},{status:PublicationCompilerStatus|null;context:string;image:string;error:string}> {
    state={status:null as PublicationCompilerStatus|null,context:'desktop-linux',image:'',error:''};private mounted=true;
    componentDidMount(){void this.load();}componentWillUnmount(){this.mounted=false;}
    private async load(){try{const status=await api<PublicationCompilerStatus>('/operations/publication_status',{projectId:this.props.projectId,input:{}});if(this.mounted)this.setState({status,context:status.configuration?.dockerContext??'desktop-linux',image:status.configuration?.imageDigest??''});}catch(error){if(this.mounted)this.setState({error:error instanceof Error?error.message:String(error)});}}
    render(){return <section className="surface"><h2>固定文稿编译环境</h2><p className="small muted">只配置已存在的镜像；文稿和编译仍在主会话中准备并确认。</p>{this.state.error?<p role="alert">{this.state.error}</p>:null}<form onSubmit={event=>{event.preventDefault();if(this.props.readOnly||!this.state.status)return;void this.props.perform(async()=>{const status=await api<PublicationCompilerStatus>('/operations/publication_configure',{projectId:this.props.projectId,input:{expectedVersion:this.state.status!.version,dockerContext:this.state.context,imageDigest:this.state.image.trim()}});if(this.mounted)this.setState({status});});}}><label>Docker context<input required value={this.state.context} onChange={event=>this.setState({context:event.target.value})}/></label><label>固定编译镜像摘要<input required pattern="(?:.+@)?sha256:[a-f0-9]{64}" value={this.state.image} onChange={event=>this.setState({image:event.target.value})}/></label><button className="secondary" disabled={this.props.readOnly||!this.state.status}>保存编译配置</button></form></section>;}
}
