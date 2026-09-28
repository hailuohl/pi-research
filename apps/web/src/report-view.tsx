import {api,artifactText,downloadArtifact} from './api.js';
import type {ProjectState,ReportInspection,ReportReference,Artifact,Row,DocumentLocation} from './models.js';
import {short,label} from './models.js';
import {SectionTitle,Badge,Empty} from './ui.js';
import type {Perform} from './workbench.js';

const referenceTypes:Record<ReportReference['type'],string>={run:'正式运行','run-source':'固定运行源码',artifact:'原始产物',evidence:'定位证据','development-job':'开发测试','development-review':'独立审查',claim:'已采纳结论'};
function provenanceSignature(data:ProjectState,reportId:string){
    const versions=(rows:ReadonlyArray<{id:string}>|undefined)=>(rows??[]).map(row=>{const r=row as {id:string;version?:number;status?:string};return [r.id,r.version??null,r.status??null];}).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
    const runIds=new Set(data.reports.find(r=>r.id===reportId)?.runIds??[]);
    return JSON.stringify([data.project.id,data.project.version,data.project.archived,
        versions(data.claims),versions(data.approvals),versions(data.tasks),versions(data.teams),versions(data.changeProposals),versions(data.experiments),versions(data.reviews),
        versions(data.runs.filter(r=>runIds.has(r.id))),versions(data.documents),versions(data.evidence),versions(data.artifacts),
        (data.documentParseJobs??[]).map(j=>[j.id,j.state,j.integrity,j.resultId??null,j.manifestDigest,j.rawDigest,j.approvalId]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])))]);
}
function sameReference(a:ReportReference,b:ReportReference){
    const keys=['id','type','targetId','digest','runId','path','relation'] as const;
    const documentKeys=['documentVersionId','rawDigest','parseResultId','pageNumber','textArtifactDigest','start','end','pageLabel','rawArtifactId','imageArtifactId'] as const;
    return keys.every(key=>a[key]===b[key])&&(!a.document&&!b.document||!!a.document&&!!b.document&&documentKeys.every(key=>a.document![key]===b.document![key]));
}
function validDocument(ref:ReportReference){
    const d=ref.document;
    return ref.type==='evidence'&&d&&['documentVersionId','rawDigest','parseResultId','textArtifactDigest','rawArtifactId','imageArtifactId'].every(key=>typeof d[key as keyof typeof d]==='string'&&!!d[key as keyof typeof d])&&Number.isSafeInteger(d.pageNumber)&&d.pageNumber>0&&Number.isSafeInteger(d.start)&&d.start>=0&&Number.isSafeInteger(d.end)&&d.end>d.start;
}
interface ReportState {
    title:string;selected:string[];selectedClaims:string[];pendingArtifactId:string;
    report:ReportInspection|null;body:string;loading:boolean;error:string;checking:boolean;verificationError:string;
    reference:ReportReference|null;verifiedReference:ReportReference|null;content:string;cursor:number;complete:boolean;reading:boolean;referenceError:string;
    exported:Row<Artifact>|null;
}
export class ReportsView extends React.Component<{
    data:ProjectState;perform:Perform;selectedReport?:string;onSelect?:(id:string)=>void;
    onRun?:(runId:string,experimentId:string)=>void;onDocument?:(target:DocumentLocation)=>void;
},ReportState> {
    state:ReportState={title:'研究结果记录',selected:[],selectedClaims:[],pendingArtifactId:'',report:null,body:'',loading:false,error:'',checking:false,verificationError:'',reference:null,verifiedReference:null,content:'',cursor:0,complete:false,reading:false,referenceError:'',exported:null};
    private reportEpoch=0;private referenceEpoch=0;private inspectionEpoch=0;private mounted=true;
    componentDidMount(){if(this.props.selectedReport)void this.open(this.props.selectedReport);}
    componentWillUnmount(){this.mounted=false;this.reportEpoch++;this.referenceEpoch++;}
    componentDidUpdate(prev:Readonly<ReportsView['props']>){
        if(this.props.selectedReport!==prev.selectedReport){if(this.props.selectedReport)void this.open(this.props.selectedReport);else{this.reportEpoch++;this.referenceEpoch++;this.setState({report:null,body:'',reference:null,verifiedReference:null,content:'',exported:null,error:''});}}
        else if(this.state.report&&provenanceSignature(prev.data,this.state.report.id)!==provenanceSignature(this.props.data,this.state.report.id))void this.reinspect();
        if(this.state.pendingArtifactId){const row=this.props.data.reports.find(r=>r.artifactId===this.state.pendingArtifactId);if(row)this.setState({pendingArtifactId:''},()=>this.select(row.id));}
    }
    call<T=any>(name:string,input:unknown){return api<T>(`/operations/${name}`,{projectId:this.props.data.project.id,input});}
    select(id:string){if(this.props.onSelect&&id!==this.props.selectedReport)this.props.onSelect(id);else void this.open(id);}
    async reinspect(){
        const report=this.state.report;if(!report)return;
        const epoch=++this.inspectionEpoch,selection=this.reportEpoch;
        this.setState({checking:true,verificationError:''});
        try{const next=await this.call<ReportInspection>('report_inspect',{reportId:report.id});
            if(next.id!==report.id||next.artifactId!==report.artifactId)throw Error('报告绑定与所选记录不一致。');
            if(this.mounted&&epoch===this.inspectionEpoch&&selection===this.reportEpoch)this.setState({report:next,checking:false});
        }catch(error){if(this.mounted&&epoch===this.inspectionEpoch&&selection===this.reportEpoch)this.setState({checking:false,verificationError:'来源重新核验失败，暂停导出：'+(error instanceof Error?error.message:String(error))});}
    }
    async open(id:string){
        const epoch=++this.reportEpoch,signature=provenanceSignature(this.props.data,id);this.referenceEpoch++;
        this.setState({report:null,body:'',loading:true,error:'',checking:false,verificationError:'',reference:null,verifiedReference:null,content:'',cursor:0,complete:false,reading:false,exported:null});
        try{
            const row=this.props.data.reports.find(r=>r.id===id);if(!row)throw Error('此报告不在当前项目中；请选择有效记录。');
            const [report,body]=await Promise.all([this.call<ReportInspection>('report_inspect',{reportId:id}),artifactText(row.artifactId)]);
            if(report.id!==id||report.artifactId!==row.artifactId)throw Error('报告绑定与所选记录不一致。');
            if(this.mounted&&epoch===this.reportEpoch)this.setState({report,body},()=>{if(signature!==provenanceSignature(this.props.data,id))void this.reinspect();});
        }catch(error){if(this.mounted&&epoch===this.reportEpoch)this.setState({error:error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted&&epoch===this.reportEpoch)this.setState({loading:false});}
    }
    async readReference(referenceId:string,append=false){
        const report=this.state.report,reference=report?.references.find(r=>r.id===referenceId);
        if(!report||!reference||!Object.prototype.hasOwnProperty.call(referenceTypes,reference.type))return;
        if(append&&(this.state.reading||this.state.reference?.id!==referenceId||this.state.complete))return;
        const epoch=++this.referenceEpoch,reportEpoch=this.reportEpoch,cursor=append?this.state.cursor:0;
        this.setState({reference,verifiedReference:null,reading:true,referenceError:'',...(!append?{content:'',cursor:0,complete:false}:{})});
        try{
            const result=await this.call<{reference:ReportReference;content:string;mediaType:string;cursor:number;end:number;complete:boolean}>('report_reference_read',{reportId:report.id,referenceId,cursor,limit:16000});
            if(!sameReference(result.reference,reference)||(reference.document&&!validDocument(result.reference)))throw Error('返回的证据不属于所选引用。');
            if(this.mounted&&epoch===this.referenceEpoch&&reportEpoch===this.reportEpoch)this.setState({verifiedReference:result.reference,content:(append?this.state.content:'')+result.content,cursor:result.end,complete:result.complete});
        }catch(error){if(this.mounted&&epoch===this.referenceEpoch&&reportEpoch===this.reportEpoch)this.setState({referenceError:error instanceof Error?error.message:String(error)});}
        finally{if(this.mounted&&epoch===this.referenceEpoch&&reportEpoch===this.reportEpoch)this.setState({reading:false});}
    }
    documentReference(){
        const s=this.state,ref=s.verifiedReference;
        return this.mounted&&!s.reading&&!s.referenceError&&!s.checking&&!s.verificationError&&s.report?.integrity==='verified'&&ref&&ref.id===s.reference?.id&&s.report.references.some(r=>sameReference(r,ref))&&validDocument(ref)?ref.document:null;
    }
    openDocument(){const d=this.documentReference();if(d)this.props.onDocument?.({documentVersionId:d.documentVersionId,parseResultId:d.parseResultId,pageNumber:d.pageNumber,start:d.start,end:d.end});}
    async downloadDocument(kind:'raw'|'image'){
        const d=this.documentReference();if(!d)return;
        await this.props.perform(()=>downloadArtifact(kind==='raw'?d.rawArtifactId:d.imageArtifactId,kind==='raw'?`${d.documentVersionId}.pdf`:`${d.documentVersionId}-page-${d.pageNumber}.png`));
    }
    async create(){await this.props.perform(async()=>{
        const artifact=await this.call<Row<Artifact>>('report_create',{title:this.state.title,runIds:this.state.selected,claimIds:this.state.selectedClaims});
        if(!this.mounted)return;
        const row=this.props.data.reports.find(r=>r.artifactId===artifact.id);
        if(row)this.select(row.id);else this.setState({pendingArtifactId:artifact.id});
    },'报告已生成；正在读取固定引用');}
    async exportReport(){const report=this.state.report;if(!report||this.state.checking||this.state.verificationError||report.integrity!=='verified'||report.validity!=='current')return;const epoch=this.reportEpoch;await this.props.perform(async()=>{const artifact=await this.call<Row<Artifact>>('report_export',{reportId:report.id});if(this.mounted&&epoch===this.reportEpoch)this.setState({exported:artifact});},'离线包已生成；请下载并保留摘要');}
    openRun(runId:string,experimentId:string){const row=this.props.data.runs.find(r=>r.id===runId&&r.experimentId===experimentId);if(!row){this.setState({error:'指定 Run 不在当前项目中，未跳转到其他运行。'});return;}this.props.onRun?.(runId,experimentId);}
    render(){
        const {data,perform}=this.props,s=this.state,report=s.report,eligible=data.runs.filter(r=>['succeeded','failed','cancelled'].includes(r.state)),claims=data.claims.filter(c=>c.status==='accepted'&&c.validity!=='stale');
        const selectedRuns=data.runs.filter(r=>s.selected.includes(r.id)),mixed=new Set(selectedRuns.map(r=>r.manifest.contractDigest)).size>1;
        const available=s.selected.every(id=>eligible.some(r=>r.id===id))&&s.selectedClaims.every(id=>claims.some(c=>c.id===id));
        return <div className="page-scroll"><SectionTitle title="报告与成果" sub="固定文档、运行证据和离线交付；报告不代替科研判断。"/>
            <section className="surface report-builder"><h2>生成可追溯结果记录</h2><label>报告名称<input aria-label="报告名称" required maxLength={200} value={s.title} onChange={(e:any)=>this.setState({title:e.target.value})}/></label><div className="run-selection">{eligible.map(r=><label key={r.id}><input type="checkbox" checked={s.selected.includes(r.id)} onChange={(e:any)=>this.setState({selected:e.target.checked?[...s.selected,r.id]:s.selected.filter(id=>id!==r.id)})}/><span>{data.experiments.find(e=>e.id===r.experimentId)?.title??'历史实验'}<small>Run {short(r.id)} · 修订 {r.manifest.experimentRevision}</small></span><Badge value={r.state}/><Badge value={r.integrity}/></label>)}</div>{claims.length?<fieldset><legend>纳入的已采纳结论</legend>{claims.map(c=><label className="checkbox-label" key={c.id}><input type="checkbox" checked={s.selectedClaims.includes(c.id)} onChange={(e:any)=>this.setState({selectedClaims:e.target.checked?[...s.selectedClaims,c.id]:s.selectedClaims.filter(id=>id!==c.id)})}/>{c.statement}</label>)}</fieldset>:null}{mixed?<p role="alert" className="error-text">所选 Run 的运行契约不同，请分开生成报告。</p>:null}{!available?<p role="alert" className="error-text">部分所选记录已不可用或失效，请重新选择。</p>:null}<button className="primary" disabled={!s.title.trim()||!(s.selected.length+s.selectedClaims.length)||mixed||!available||!!s.pendingArtifactId} onClick={()=>void this.create()}>生成固定结果报告</button><p className="small muted">服务端重新核验来源与原始指标。失败或不完整的 Run 会保留其真实状态，不补写结果。</p>{s.pendingArtifactId?<p role="status">报告产物已保存，等待项目记录刷新。<button className="text-button" onClick={()=>perform(async()=>{})}>刷新记录</button></p>:null}</section>
            <div className="evidence-grid"><section className="surface artifact-list"><div className="surface-heading"><h2>已生成报告</h2></div>{data.reports.map(row=>{const artifact=data.artifacts.find(a=>a.id===row.artifactId);return <button className={'artifact-item '+(row.id===(report?.id??this.props.selectedReport)?'active':'')} key={row.id} onClick={()=>this.select(row.id)}><div><strong>{artifact?.title??'历史报告'}</strong><small>{short(row.id)}</small></div></button>;})}{!data.reports.length?<p className="inline-empty">尚未生成报告。</p>:null}</section>
                <section className="surface artifact-preview"><div className="surface-heading"><h2>{report?.title??'报告预览'}</h2>{report?<button className="text-button" onClick={()=>void this.reinspect()}>重新核验</button>:null}</div>{s.loading?<p role="status" className="inline-empty">正在读取报告与固定引用…</p>:null}{s.error?<p role="alert" className="error-text">{s.error}</p>:null}{report?<div>
                    {s.checking?<p role="status">来源记录已变化，正在重新核验…</p>:null}{s.verificationError?<p role="alert" className="error-text">{s.verificationError}</p>:null}<div className="preview-meta">完整性：{report.integrity==='verified'?'已核验':'无效'} · 来源：{report.validity==='current'?'当前有效':report.validity==='legacy'?'旧版缺少历史固定绑定':'已失效'} · 格式 v{report.formatVersion}</div>{report.reasons.length?<ul>{report.reasons.map((reason,i)=><li key={i}>{reason}</li>)}</ul>:null}{report.validity!=='current'||report.integrity!=='verified'?<p className="inline-warning">保留历史原文供回查；当前状态不允许生成新的离线交付包。</p>:null}
                    <div className="actions wrap"><button className="secondary compact" onClick={()=>perform(()=>downloadArtifact(report.artifactId,data.artifacts.find(a=>a.id===report.artifactId)?.title??`${report.title}.md`))}>下载原报告 Markdown</button><button className="primary compact" disabled={s.checking||!!s.verificationError||report.validity!=='current'||report.integrity!=='verified'} onClick={()=>void this.exportReport()}>生成离线交付包</button></div>
                    {s.exported?<div className="inspector-section"><h3>{s.exported.title}</h3><p>{s.exported.size} 字节</p><code className="digest">SHA-256 {s.exported.digest}</code><button className="secondary" onClick={()=>perform(()=>downloadArtifact(s.exported!.id,s.exported!.title))}>下载离线包</button><p className="small muted">生成与发起下载不代表文件已落盘；请在下载目录核对。</p></div>:null}
                    <details open><summary>固定运行与实测指标</summary>{!report.runs.length?<p className="small muted">本报告未纳入正式运行；文档结论不代表运行实测结果。</p>:null}{report.runs.map(run=><div className="inspector-section" key={run.runId}><h3>Run {short(run.runId)} · 修订 {run.revision}</h3><p>{label(run.state)} · {label(run.integrity)} · 科研判断 {run.judgment}</p><code className="digest">源码 {run.sourceDigest}</code>{run.gitCommit?<code className="digest">Git {run.gitCommit}</code>:null}<button className="text-button" onClick={()=>this.openRun(run.runId,run.experimentId)}>打开此 Run {short(run.runId)}</button><ul>{run.metrics.map(metric=><li key={metric.name}>{metric.name}: <button className="text-button numeric" disabled={!report.references.some(ref=>ref.id===metric.referenceId)} onClick={()=>void this.readReference(metric.referenceId)}>{String(metric.value)} {metric.unit}</button></li>)}</ul></div>)}</details>
                    <details open><summary>绑定的证据与来源</summary>{report.references.length?<ul>{report.references.map(ref=><li key={ref.id}><button className="text-button" disabled={!Object.prototype.hasOwnProperty.call(referenceTypes,ref.type)} onClick={()=>void this.readReference(ref.id)}>{ref.label}</button><small> · {referenceTypes[ref.type]??'未知引用类型'}{ref.relation==='ancestry'?' · 祖先来源（非当前源码）':ref.relation==='exact'?' · 精确绑定':''}</small></li>)}</ul>:<p className="small muted">此历史报告没有可核验的固定引用清单；保留原文中的 ID。</p>}</details>
                    {s.reference?<section className="inspector-section" aria-label="绑定证据预览"><h3>{s.reference.label}</h3><p className="small muted">{referenceTypes[s.reference.type]} · {s.reference.path??s.reference.targetId}</p>{s.reference.digest?<code className="digest">{s.reference.digest}</code>:null}{s.referenceError?<p role="alert" className="error-text">{s.referenceError}</p>:null}{s.reference.document?<div><p className="small muted">物理页 {s.reference.document.pageNumber} · 页标签 {s.reference.document.pageLabel??'未知'} · UTF-16 [{s.reference.document.start}, {s.reference.document.end})</p><div className="actions wrap"><button className="secondary compact" disabled={!this.documentReference()||!this.props.onDocument} onClick={()=>this.openDocument()}>回到固定页段</button><button className="secondary compact" disabled={!this.documentReference()} onClick={()=>void this.downloadDocument('raw')}>下载原件 PDF</button><button className="secondary compact" disabled={!this.documentReference()} onClick={()=>void this.downloadDocument('image')}>下载引用页 PNG</button></div><p className="small muted">来源、版本、许可和解析质量见下方固定记录；许可未知不代表获得再分发许可。</p></div>:null}<pre className="document-preview">{s.content||(s.reading?'读取固定内容…':'（空内容）')}</pre><button className="secondary compact" disabled={s.reading||s.complete} onClick={()=>void this.readReference(s.reference!.id,true)}>{s.reading?'读取中…':s.complete?'已完整读取':'读取后续内容'}</button></section>:null}
                    <details><summary>原始 Markdown（纯文本）</summary><pre className="document-preview">{s.body}</pre></details>
                </div>:!s.loading&&!s.error?<Empty title="选择报告回查证据"><p>正文、代码和 URL 均按纯文本展示，引用只读取报告中已绑定的记录。</p></Empty>:null}</section>
            </div>
        </div>;
    }
}
