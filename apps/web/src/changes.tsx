import {api} from './api.js';
import type {ProjectState} from './models.js';
import {short} from './models.js';
import {SectionTitle,Badge,Empty} from './ui.js';
import type {Perform} from './workbench.js';
/** Human-controlled, single-file form; multi-file proposals are supported by the same API. */
export class ChangesView extends React.Component<{data:ProjectState;perform:Perform},{baseId:string;artifactId:string;path:string;title:string;hypothesis:string;preview:any;inspected:string}> {
    state={baseId:'',artifactId:'',path:'',title:'',hypothesis:'',preview:null as any,inspected:''};
    private async preview(id:string){await this.props.perform(async()=>{const result=await api(`/change-proposals/${id}/diff`);this.setState({preview:result,inspected:id});});}
    private async prepare(){await this.props.perform(async()=>{
        const base=this.props.data.experiments.find(e=>e.id===this.state.baseId);if(!base)throw new Error('请选择父实验');
        const files=await api<Array<{path:string}>>(`/experiments/${base.id}/files`);
        const before=files.some(f=>f.path===this.state.path)?await api(`/experiments/${base.id}/files?path=${encodeURIComponent(this.state.path)}`):null;
        const p=await api('/change-proposals',{projectId:this.props.data.project.id,baseExperimentId:base.id,expectedRevision:base.revision,title:this.state.title,hypothesis:this.state.hypothesis,changes:[{path:this.state.path,artifactId:this.state.artifactId,expectedDigest:before?.digest??null}]});
        const preview=await api(`/change-proposals/${p.id}/diff`);this.setState({preview,inspected:p.id});
    },'已准备固定变更；请检查前后内容再批准');}
    render(){const {data,perform}=this.props,proposals=data.changeProposals??[];
        const selectable=data.artifacts.filter(a=>!a.taskId || data.tasks.some(t=>t.id===a.taskId&&t.acceptance==='accepted'&&t.execution==='output_submitted'&&t.result?.artifactIds.includes(a.id)));
        return <div className="page-scroll"><SectionTitle title="变更提案" sub="把已验收产物整合为新子实验，而不是覆盖共享代码。"/>
        <p className="inline-warning">整合不会自动运行测试或正式计算。当前只支持文本文件；运行仍需单独批准。没有测试记录不表示测试通过。</p>
        <section className="surface"><div className="surface-heading"><h2>传统产物变更入口</h2></div>
        <form className="form-body" onSubmit={(e:any)=>{e.preventDefault();void this.prepare();}}>
        <label>父实验<select aria-label="父实验" required value={this.state.baseId} onChange={(e:any)=>this.setState({baseId:e.target.value})}><option value="">选择固定基准</option>{data.experiments.filter(e=>e.lifecycle!=='archived').map(e=><option key={e.id} value={e.id}>{e.title} · 修订 {e.revision}</option>)}</select></label>
        <label>代码或配置产物<select aria-label="代码或配置产物" required value={this.state.artifactId} onChange={(e:any)=>{const a=selectable.find(a=>a.id===e.target.value);this.setState({artifactId:e.target.value,path:a?.title??this.state.path});}}><option value="">选择不可变文本产物</option>{selectable.map(a=><option key={a.id} value={a.id}>{a.title} · {short(a.id)}</option>)}</select></label>
        <label>目标相对路径<input aria-label="目标相对路径" required value={this.state.path} onChange={(e:any)=>this.setState({path:e.target.value})} placeholder="例如 config.json 或 src/model.py"/></label>
        <label>新子实验名称<input required aria-label="新子实验名称" value={this.state.title} onChange={(e:any)=>this.setState({title:e.target.value})}/></label>
        <label>研究变化与依据<textarea required aria-label="研究变化与依据" value={this.state.hypothesis} onChange={(e:any)=>this.setState({hypothesis:e.target.value})}/></label>
        <button className="secondary" disabled={!selectable.length||!data.experiments.length}>准备并预览</button></form></section>
        <section className="surface"><div className="surface-heading"><h2>整合记录</h2></div>{!proposals.length?<Empty title="尚未准备变更提案"><p>先让主助手或实现助手保存实际文件产物；助手产物须完成验收，再选择父实验。</p></Empty>:proposals.slice().reverse().map(p=>{
            const a=data.approvals.find(a=>a.id===p.approvalId);return <div className="inspector-section" key={p.id}><h3>{p.title} <Badge value={p.state}/></h3><p>{p.hypothesis}</p>{(p as any).reviewId?<p className="small muted">受审流程 · 审查 {short((p as any).reviewId)} · 测试 {short(p.testJobId)}</p>:<p className="small muted">传统流程记录；不代表通过本次独立审查门。</p>}{p.sourceValidity==='stale'?<p className="inline-warning">来源审查已失效。历史提案保留；重新研究并批准后才能用于新操作。</p>:null}<p className="small muted">基准 {short(p.baseExperimentId)} · 修订 {p.baseRevision} · {p.changes.length} 个文件 · {p.testsStatus==='passed'?'已通过绑定源码的开发检查':'未运行开发测试'}</p>
            <div className="actions wrap"><button className="secondary compact" onClick={()=>void this.preview(p.id)}>查看固定差异</button>
            {p.state==='prepared'&&p.sourceValidity!=='stale'&&a?.status==='pending'?<div><button className="primary compact" disabled={this.state.inspected!==p.id} onClick={()=>perform(()=>api(`/approvals/${a.id}/decide`,{expectedVersion:a.version,approved:true}),'已批准固定变更；尚未创建子实验')}>批准变更</button><button className="secondary compact" onClick={()=>perform(()=>api(`/approvals/${a.id}/decide`,{expectedVersion:a.version,approved:false}))}>拒绝</button></div>:null}
            {p.state==='prepared'&&p.sourceValidity!=='stale'&&a?.status==='approved'?<button className="primary compact" onClick={()=>perform(()=>api(`/change-proposals/${p.id}/apply`,{}),'新子实验已创建；没有启动计算')}>创建新子实验</button>:null}</div>
            {p.appliedExperimentId?<p>已创建子实验：<code>{p.appliedExperimentId}</code></p>:null}
            </div>;})}</section>
        {this.state.preview?<section className="surface"><div className="surface-heading"><h2>固定内容前后对照</h2><span className="small muted">{short(this.state.preview.proposal.digest)}</span></div>{this.state.preview.files.map((f:any)=><div className="inspector-section" key={f.path}><h3>{f.path}</h3><p className="small muted">文件模式 {f.beforeMode??'未记录'} → {f.afterMode??'未记录'}</p><details open><summary>变更前 · {f.expectedDigest??'不存在'}</summary><pre className="file-preview">{f.before??'（新增文件）'}</pre></details><details open><summary>变更后 · {f.artifactDigest??'删除'}</summary><pre className="file-preview">{f.after??'（删除文件）'}</pre></details></div>)}</section>:null}
        </div>;
    }
}
