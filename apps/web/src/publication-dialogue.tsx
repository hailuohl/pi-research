import * as React from 'react';
import {api,downloadArtifact} from './api.js';
import {PublicationPreview} from './publication-view.js';
import {Badge} from './ui.js';
import {short} from './models.js';
import type {ProjectState,Row,Session,ManuscriptRevision,PublicationBuildJobDTO,PublicationBuildResultDTO,Artifact} from './models.js';
import type {Perform} from './workbench.js';

export class PublicationDialogue extends React.Component<{data:ProjectState;session:Row<Session>;disabled:boolean;busy?:boolean;perform:Perform},{results:Record<string,PublicationBuildResultDTO>;drafts:Record<string,{content:string;complete:boolean}>;previewJobId:string;cancellingJobIds:string[]}> {
    state={results:{} as Record<string,PublicationBuildResultDTO>,drafts:{} as Record<string,{content:string;complete:boolean}>,previewJobId:'',cancellingJobIds:[] as string[]};
    private mounted=true;
    private cancelling=new Set<string>();
    componentWillUnmount(){this.mounted=false;}
    componentDidUpdate(previous:Readonly<PublicationDialogue['props']>){if(previous.session.id!==this.props.session.id||previous.data.project.id!==this.props.data.project.id)this.setState({results:{},drafts:{},previewJobId:'',cancellingJobIds:[]});}
    private dialogue(){return {projectId:this.props.data.project.id,sessionId:this.props.session.id};}
    private matches(c:ReturnType<PublicationDialogue['dialogue']>){return this.mounted&&c.projectId===this.props.data.project.id&&c.sessionId===this.props.session.id;}
    private call<T=any>(c:ReturnType<PublicationDialogue['dialogue']>,name:string,input:unknown,key?:string){return api<T>(`/operations/${name}`,{...c,input},'POST',undefined,key);}
    private owns(job:PublicationBuildJobDTO){return (this.props.data.manuscripts??[]).some(r=>r.id===job.revisionId&&r.rootSessionId===this.props.session.id&&r.sourceDigest===job.sourceDigest);}
    private assertJob(c:ReturnType<PublicationDialogue['dialogue']>,job:PublicationBuildJobDTO){if(!this.matches(c)||!this.owns(job)||!(this.props.data.publicationJobs??[]).some(j=>j.id===job.id&&j.manifestDigest===job.manifestDigest))throw Error('当前对话或固定文稿已变化，请重新核对。');}
    async draft(revision:Row<ManuscriptRevision>){
        const c=this.dialogue(),own=()=>this.matches(c)&&(this.props.data.manuscripts??[]).some(r=>r.id===revision.id&&r.rootSessionId===c.sessionId&&r.sourceDigest===revision.sourceDigest);
        if(!own())throw Error('文稿不属于当前对话。');
        const source=await this.call<{content:string;complete:boolean;digest:string}>(c,'manuscript_source_read',{revisionId:revision.id,path:revision.mainFile,cursor:0,limit:64000});
        if(!own()||source.digest!==revision.files.find(f=>f.path===revision.mainFile)?.digest)throw Error('文稿或当前对话已变化。');
        this.setState(s=>({drafts:{...s.drafts,[revision.id]:{content:source.content,complete:source.complete}}}));
    }
    async submit(job:PublicationBuildJobDTO){
        const c=this.dialogue();this.assertJob(c,job);
        const approval=this.props.data.approvals.find(a=>a.id===job.approvalId&&a.subjectId===job.id&&a.scope==='publication.build'&&a.digest===job.manifestDigest);
        if(!approval||!['pending','approved'].includes(approval.status))throw Error('此固定编译尚未取得有效批准。');
        if(approval.status==='pending')await api(`/approvals/${approval.id}/decide`,{expectedVersion:approval.version,approved:true});
        this.assertJob(c,job);await this.call(c,'publication_submit',{jobId:job.id});
    }
    async cancel(job:PublicationBuildJobDTO){
        const c=this.dialogue();this.assertJob(c,job);
        const {data,session,disabled,busy}=this.props;
        if(disabled||busy||data.project.archived||session.state==='archived'||session.role!=='coordinator'||session.taskId||session.teamId)throw Error('当前会话不可取消文稿编译。');
        if(this.cancelling.has(job.id)||job.cancelRequested||!['queued','starting','running','unknown'].includes(job.state))return;
        this.cancelling.add(job.id);this.setState(s=>({cancellingJobIds:[...s.cancellingJobIds,job.id]}));
        try{await this.call(c,'publication_cancel',{jobId:job.id},`publication-cancel:${job.id}:${job.manifestDigest}`);}
        finally{this.cancelling.delete(job.id);if(this.matches(c))this.setState(s=>({cancellingJobIds:s.cancellingJobIds.filter(id=>id!==job.id)}));}
    }
    async refreshJob(job:PublicationBuildJobDTO){
        const c=this.dialogue();this.assertJob(c,job);
        const fresh=await this.call<PublicationBuildJobDTO>(c,'publication_inspect',{jobId:job.id});
        this.assertJob(c,job);if(fresh.id!==job.id||fresh.revisionId!==job.revisionId||fresh.manifestDigest!==job.manifestDigest||fresh.sourceDigest!==job.sourceDigest)throw Error('编译任务与固定文稿不一致。');
        return fresh;
    }
    async result(job:PublicationBuildJobDTO){
        const c=this.dialogue();this.assertJob(c,job);if(!job.resultId)throw Error('编译尚未产生结果。');
        const result=await this.call<PublicationBuildResultDTO>(c,'publication_result',{resultId:job.resultId});
        this.assertJob(c,job);if(result.jobId!==job.id||result.revisionId!==job.revisionId||result.manifestDigest!==job.manifestDigest)throw Error('编译结果与固定文稿不一致。');
        this.setState(s=>({results:{...s.results,[job.id]:result}}));return result;
    }
    async preview(job:PublicationBuildJobDTO){
        const c=this.dialogue(),result=await this.result(job);this.assertJob(c,job);
        if(job.state!=='succeeded'||job.integrity!=='complete'||result.status!=='succeeded'||!result.converged||result.hadErrors||!result.pdf)throw Error('本次编译没有完整成功 PDF，请查看诊断。');
        this.setState({previewJobId:job.id});
    }
    async export(job:PublicationBuildJobDTO){
        const c=this.dialogue(),result=await this.result(job),revision=(this.props.data.manuscripts??[]).find(r=>r.id===job.revisionId)!;
        if(!result.pdf||result.sourceValidity!=='current'||result.status!=='succeeded')throw Error('只有来源有效的成功文稿才能生成新的成果包。');
        const runIds=[...new Set(revision.files.filter(f=>f.provenance.kind==='run').flatMap(f=>f.provenance.id?[f.provenance.id]:[]))];
        const report=await this.call<Row<Artifact>>(c,'report_create',{title:revision.title,runIds,claimIds:[],publicationResultIds:[result.id]});
        this.assertJob(c,job);const fresh=await api<ProjectState>(`/projects/${c.projectId}/state?sessionId=${encodeURIComponent(c.sessionId)}`),record=fresh.reports.find(r=>r.artifactId===report.id);
        this.assertJob(c,job);if(!record)throw Error('固定报告已保存，暂未读取到回执，请刷新后继续。');
        const archive=await this.call<Row<Artifact>>(c,'report_export',{reportId:record.id},`publication-export:${record.id}`);
        this.assertJob(c,job);await downloadArtifact(archive.id,archive.title);
    }
    async startReview(reviewId:string){
        const c=this.dialogue(),review=(this.props.data.publicationReviews??[]).find(r=>r.id===reviewId&&r.rootSessionId===c.sessionId),approval=this.props.data.approvals.find(a=>a.id===review?.approvalId);
        const team=this.props.data.teams.find(t=>t.id===review?.teamId);
        if(!review||review.validity!=='current'||!approval||!['pending','approved'].includes(approval.status)||!this.props.data.project.settings.enabled||!team?.delegationEnabled)throw Error('请核对固定审查及其分工授权，并启用输入框旁的多智能体模式。');
        if(approval.status==='pending')await api(`/approvals/${approval.id}/decide`,{expectedVersion:approval.version,approved:true});
        if(!this.matches(c))throw Error('已批准审查，当前对话已切换；请回原对话启动。');
        await api(`/teams/${review.teamId}/activate`,{});
    }
    render(){
        const {data,session,disabled,busy,perform}=this.props,revisions=(data.manuscripts??[]).filter(r=>r.rootSessionId===session.id);
        if(!revisions.length)return null;
        const superseded=new Set(revisions.flatMap(r=>r.previousRevisionId?[r.previousRevisionId]:[]));
        const needsAttention=(j:PublicationBuildJobDTO)=>['prepared','queued','starting','running','failed','unknown','timed_out','cancelled'].includes(j.state)||!!j.error||(data.publicationReviews??[]).some(r=>r.publicationResultId===j.resultId&&r.status==='awaiting_approval');
        const isCurrent=(r:Row<ManuscriptRevision>)=>!superseded.has(r.id)||(data.publicationJobs??[]).some(j=>j.revisionId===r.id&&needsAttention(j));
        const renderRevision=(revision:Row<ManuscriptRevision>)=>{const jobs=(data.publicationJobs??[]).filter(j=>j.revisionId===revision.id);return <details className="workflow-card" key={revision.id} open={!jobs.length||jobs.some(needsAttention)}><summary>文稿 · {revision.title}<span>版本 {short(revision.id)}</span></summary>
            {revision.previousRevisionId?<p>修订自 {short(revision.previousRevisionId)} · 旧版本保留</p>:null}
            <p>{revision.files.length} 个固定文件 · {revision.engine}</p>
            <button className="text-button" disabled={busy} onClick={()=>perform(()=>this.draft(revision))}>查看文稿源码</button>
            {this.state.drafts[revision.id]?<details open><summary>{revision.mainFile} · 只读</summary><pre className="file-preview">{this.state.drafts[revision.id].content}</pre>{!this.state.drafts[revision.id].complete?<p>已展示前64000字符；完整源码保留在固定稿件中。</p>:null}</details>:null}
            {!jobs.length?<p>稿件已保存。在对话中要求智能体准备编译或修改内容。</p>:null}
            {jobs.map(job=>{const result=this.state.results[job.id],reviews=(data.publicationReviews??[]).filter(r=>r.publicationResultId===job.resultId&&r.rootSessionId===session.id),reportIds=new Set(data.reports.filter(r=>r.publicationResultIds?.includes(job.resultId??'')).map(r=>r.id));return <div key={job.id}>
                <p>编译 {short(job.id)} <Badge value={job.state}/><Badge value={job.integrity}/></p>
                <details><summary>固定编译范围</summary><p>{job.engine} · {job.mainFile} · {job.resources.cpus} CPU / {job.resources.memoryMb} MB · 最长 {job.resources.timeoutSeconds} 秒</p><p>构建镜像 {short(job.imageDigest)} · 源码 {short(job.sourceDigest)}</p></details>
                {job.state==='prepared'?<div className="actions wrap"><button className="primary compact" disabled={disabled} onClick={()=>perform(()=>this.submit(job),'固定文稿编译已提交')}>批准并编译</button></div>:null}
                {['queued','starting','running','unknown'].includes(job.state)?<div className="actions wrap"><button className="text-button danger" disabled={disabled||busy||data.project.archived||session.state==='archived'||job.cancelRequested||this.state.cancellingJobIds.includes(job.id)} onClick={()=>perform(()=>this.cancel(job))}>{this.state.cancellingJobIds.includes(job.id)?'正在请求取消…':'请求取消文稿编译'}</button></div>:null}
                {job.cancelRequested&&['queued','starting','running','unknown'].includes(job.state)?<p role="status">已请求取消，等待执行器确认；编译尚未确认停止。</p>:null}
                <button className="text-button" disabled={busy} onClick={()=>perform(()=>this.refreshJob(job))}>刷新此编译状态</button>
                {job.resultId?<div className="actions wrap"><button className="text-button" disabled={busy} onClick={()=>perform(()=>this.result(job))}>查看编译诊断</button>{job.state==='succeeded'?<><button className="text-button" disabled={busy} onClick={()=>perform(()=>this.preview(job))}>预览 PDF</button><button className="text-button" disabled={disabled} onClick={()=>perform(()=>this.export(job),'固定 PDF、源码及复现材料已打包')}>导出成果包</button></>:null}</div>:null}
                {job.error?<p role="status">{job.error}</p>:null}
                {result?<details open><summary>编译诊断 · {result.diagnostics.length} 项</summary>{result.sourceValidity==='stale'?<p>来源已失效，保留历史结果；不能用于新编译或导出。</p>:null}{result.diagnostics.length?result.diagnostics.slice(0,30).map((d,i)=><p key={i}>{d.severity} · {d.message}{d.file?` · ${d.file}:${d.line??''}`:''}</p>):<p>本次固定编译未报告诊断。</p>}</details>:null}
                {reviews.map(review=><details key={review.id} open={review.status==='awaiting_approval'}><summary>论文独立审查 <Badge value={review.status}/></summary><p>{review.summary??'仅审查这一固定文稿及获准证据。'}</p>{review.reason?<p>{review.reason}</p>:null}{review.status==='awaiting_approval'&&review.validity==='current'?<button className="primary compact" disabled={disabled||!data.project.settings.enabled||!data.teams.find(t=>t.id===review.teamId)?.delegationEnabled} onClick={()=>perform(()=>this.startReview(review.id),'论文独立审查已启动')}>批准并启动审查</button>:null}{!data.project.settings.enabled&&review.status==='awaiting_approval'?<p>启用多智能体开关后可执行独立审查。</p>:null}</details>)}
                {(data.publicationExports??[]).filter(e=>reportIds.has(e.reportId)).map(e=><button key={e.artifactId} className="text-button" onClick={()=>perform(()=>downloadArtifact(e.artifactId,`report-${e.reportId}.tar.gz`))}>下载已归档成果包</button>)}
            </div>;})}
        </details>;};
        const older=revisions.filter(r=>!isCurrent(r)),previewJob=(data.publicationJobs??[]).find(j=>j.id===this.state.previewJobId&&this.owns(j)),previewResult=previewJob?this.state.results[previewJob.id]:undefined;
        return <>{revisions.filter(isCurrent).map(renderRevision)}{older.length?<details className="workflow-history"><summary>历史文稿（{older.length}）</summary>{older.map(renderRevision)}</details>:null}{previewJob&&previewResult?<details className="workflow-card" open><summary>文稿 {short(previewJob.revisionId)} · PDF</summary><button className="text-button" onClick={()=>this.setState({previewJobId:''})}>关闭预览</button><PublicationPreview key={previewResult.id} result={previewResult} ready={previewJob.state==='succeeded'&&previewJob.integrity==='complete'} perform={perform}/></details>:null}</>;
    }
}
