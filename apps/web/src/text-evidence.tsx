import * as React from 'react';
import {nativeSelectButton} from './ui.js';
import { api, artifactText } from './api.js';
import type { DocumentLocation, ProjectState, TextCorpusGrantDTO } from './models.js';
import { short } from './models.js';
import type { Perform } from './workbench.js';
/** Optional local retrieval; nothing runs until the owner selects and enables a corpus. */
type DocumentChoice = {documentVersionId:string;parseResultId:string};
const pair = (value:DocumentChoice) => `${value.documentVersionId}:${value.parseResultId}`;
export class TextEvidencePanel extends React.Component<{data: ProjectState; perform: Perform; onDocument?:(target:DocumentLocation)=>void; onSession?:(id:string)=>void}, {
    selected: string[] | null; selectedDocuments:DocumentChoice[] | null; selectedPmcDocuments:string[]|null; query: string; mmrLambda: number; result: any; loading: boolean; sourcePreview: string;
}> {
    state = {selected: null as string[] | null, selectedDocuments:null as DocumentChoice[]|null, selectedPmcDocuments:null as string[]|null, query: '', mmrLambda: 1, result: null as any, loading: false, sourcePreview: ''};
    render() {
        const {data, perform} = this.props;
        const config = data.textEvidence ?? {enabled: false, version: 0, sources: [], documents: [], pmcDocuments: []};
        const eligible = data.artifacts.filter(a => a.origin === 'user' && !a.taskId && !a.runId && !a.wakeupId &&
            ['text/plain', 'text/markdown'].includes(a.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(a.title));
        const saved = config.sources.map((s: any) => s.artifactId) as string[];
        const savedDocuments = (config.documents??[]).map(({documentVersionId,parseResultId})=>({documentVersionId,parseResultId}));
        const savedPmcDocuments=(config.pmcDocuments??[]).map(({documentVersionId})=>documentVersionId);
        const pmcDocuments=[...new Map([...(config.pmcDocuments??[]),...(data.documents??[]).filter(d=>d.contentKind==='provider-text'&&d.source.provider==='pubmed'&&/^PMC[1-9]\d*\.[1-9]\d*$/.test(d.source.reportedVersion??'')&&d.original.mediaType==='application/xml'&&!!d.derivedText&&d.license.assurance==='provider-reported'&&!!d.license.value).map(d=>({documentVersionId:d.id,title:d.title,reportedVersion:d.source.reportedVersion!}))].map(d=>[d.documentVersionId,d])).values()];
        const parsed = (data.documentParseJobs??[]).filter(job=>job.state==='succeeded'&&job.integrity==='complete'&&job.resultId)
            .map(job=>({documentVersionId:job.documentVersionId,parseResultId:job.resultId!,title:(data.documents??[]).find(d=>d.id===job.documentVersionId&&d.contentKind==='original-pdf')?.title}))
            .filter((value):value is DocumentChoice&{title:string}=>!!value.title);
        const selected = this.state.selected ?? saved;
        const selectedDocuments = this.state.selectedDocuments ?? savedDocuments;
        const selectedPmcDocuments=this.state.selectedPmcDocuments??savedPmcDocuments;
        const selectionChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort()) ||
            JSON.stringify(selectedDocuments.map(pair).sort()) !== JSON.stringify(savedDocuments.map(pair).sort()) ||
            JSON.stringify([...selectedPmcDocuments].sort()) !== JSON.stringify([...savedPmcDocuments].sort());
        const history = data.textEvidenceSearches??[];
        const result = this.state.result??history[0]??null, stale = result && (result.configurationVersion !== config.version || !config.enabled);
        return <section className="surface">
            <div className="surface-heading"><h2>本地原文检索 · 试验功能</h2><span className="small muted">{config.enabled ? '已启用' : '默认关闭'}</span></div>
            <p className="small muted">本地词项评分与精确重复分组；PaperQA MMR 选择流程可选，默认不启用；不调用模型、不联网、不生成摘要或答案。仅处理显式选定的用户文本、已批准解析的固定 PDF 或 PMC OA 全文派生文本；不是 OCR、语义问答或完整 PaperQA，不证明科学结论。</p>
            <details open={!config.enabled}><summary>选择允许检索的原文（文本、固定 PDF 或 PMC OA 全文，最多 30 份）</summary>
                {!eligible.length && !parsed.length && !pmcDocuments.length ? <p className="inline-empty">先导入 UTF-8 文本、完成固定 PDF 的批准解析，或显式取得 PMC OA 全文。模型产物不会加入原文集合。</p> : null}
                <div className="run-selection">{eligible.map(a => <label key={a.id}>
                    <input type="checkbox" checked={selected.includes(a.id)} disabled={this.state.loading} onChange={(e: any) => this.setState({selected: e.target.checked ? [...selected, a.id] : selected.filter(id => id !== a.id), result: null})}/>
                    <span>{a.title}<small>{short(a.id)}</small></span>
                </label>)}{parsed.map(d=><label key={pair(d)}><input type="checkbox" checked={selectedDocuments.some(value=>pair(value)===pair(d))} disabled={this.state.loading} onChange={(e:any)=>this.setState({selectedDocuments:e.target.checked?[...selectedDocuments,{documentVersionId:d.documentVersionId,parseResultId:d.parseResultId}]:selectedDocuments.filter(value=>pair(value)!==pair(d)),result:null})}/><span>{d.title}<small>固定 PDF · 解析 {short(d.parseResultId)}</small></span></label>)}{pmcDocuments.map(d=><label key={d.documentVersionId}><input type="checkbox" checked={selectedPmcDocuments.includes(d.documentVersionId)} disabled={this.state.loading} onChange={(e:any)=>this.setState({selectedPmcDocuments:e.target.checked?[...selectedPmcDocuments,d.documentVersionId]:selectedPmcDocuments.filter(id=>id!==d.documentVersionId),result:null})}/><span>{d.title}<small>PMC OA · {d.reportedVersion} · 文档 {short(d.documentVersionId)} · 无 PDF 页码</small></span></label>)}</div>
                <div className="actions wrap"><button className="secondary" disabled={data.project.archived||(!(selected.length+selectedDocuments.length+selectedPmcDocuments.length) || this.state.loading)} onClick={() => perform(async () => {
                    await api(`/projects/${data.project.id}/text-evidence`, {enabled: true, artifactIds: selected, documents:selectedDocuments,...(selectedPmcDocuments.length?{pmcDocuments:selectedPmcDocuments.map(documentVersionId=>({documentVersionId}))}:{}), expectedVersion: config.version});
                    this.setState({selected: null, selectedDocuments:null, selectedPmcDocuments:null, result: null});
                }, '已保存固定原文范围；不会自动调用模型')}>保存范围并启用</button>
                {config.enabled ? <button className="secondary" disabled={data.project.archived||(this.state.loading)} onClick={() => perform(async () => {
                    await api(`/projects/${data.project.id}/text-evidence`, {enabled: false, expectedVersion: config.version}); this.setState({result: null});
                }, '已关闭检索，历史文件与引用保留')}>关闭检索</button> : null}</div>
            </details>
            <form className="search-panel" onSubmit={(e: any) => {e.preventDefault();this.setState({loading: true});void perform(async () => {
                const response = await api('/text-evidence-search', {projectId: data.project.id, query: this.state.query, artifactIds: saved, ...(savedDocuments.length?{documents:savedDocuments}:{}),...(savedPmcDocuments.length?{pmcDocuments:savedPmcDocuments.map(documentVersionId=>({documentVersionId}))}:{}),...((savedDocuments.length||savedPmcDocuments.length)?{corpusId:config.corpusId,configurationVersion:config.version}:{}), limit: 5, mmrLambda: this.state.mmrLambda});
                this.setState({result: response, sourcePreview: ''});
            }).finally(() => this.setState({loading: false}));}}>
                <input aria-label="本地原文关键词" placeholder="输入关键词；中文可使用短语" value={this.state.query} disabled={this.state.loading} onChange={(e: any) => this.setState({query: e.target.value})}/>
                <select aria-label="检索排序策略" value={this.state.mmrLambda} disabled={this.state.loading} onChange={(e:any)=>this.setState({mmrLambda:Number(e.target.value),result:null})}>{nativeSelectButton}<option value={1}>精确去重＋相关性（默认）</option><option value={0.65}>精确去重＋MMR 0.65（试验）</option></select>
                <button className="primary" disabled={data.project.archived||(!config.enabled || selectionChanged || !this.state.query.trim() || this.state.loading)}>{this.state.loading ? '检索中…' : '查找原文'}</button>
            </form>
            {selectionChanged ? <p className="small muted">文档选择已改变，请先保存范围。</p> : null}
            {history.length?<details><summary>历史检索（最近 {history.length} 条，关闭后仍可读）</summary>{history.map(item=><button className="text-button" key={item.id} onClick={()=>this.setState({result:item,sourcePreview:''})}>{item.query} · {item.hits.length} 个片段 · {short(item.id)}</button>)}</details>:null}
            {stale ? <p className="inline-warning">集合已变更或功能已关闭；下方是历史查询，请重新检索。</p> : null}
            {result ? <div>
                <p className="small muted">{result.status === 'no_lexical_match' ? '未找到词项匹配；不表示文献中没有答案。' : `返回 ${result.hits.length} 个原文片段。相关性不是科学正确性。`}</p>
                {result.coverage ? <p className="small muted">已搜索选定 {result.coverage.sourceCount} 份原文 / {result.coverage.totalChunks} 个分块；{result.coverage.matchingChunks} 个词项匹配；合并 {result.coverage.exactDuplicatesGrouped} 个相同片段并保留其他来源。{result.coverage.resultsTruncated ? '当前展示受数量限制，可缩小查询或增大接口 limit（最多10）。' : ''}</p> : null}
                {result.hits.map((h: any) => <article className="inspector-section" key={h.chunkId}>
                    <h3>{h.title}</h3><p className="small muted">{h.document?`固定 PDF 物理第 ${h.page} 页`:h.providerText?`固定 PMC OA 全文 ${h.providerText.reportedVersion} · 无 PDF 页码`:`原文件第 ${h.lineStart}–${h.lineEnd} 行 · 无 PDF 页码`} · UTF-16 区间 [{h.locator.start}, {h.locator.end})</p>
                    <pre className="document-preview">{h.quote}</pre>{h.alternativeSources?.length?<p className="small muted">相同原文还出现于：{h.alternativeSources.map((a:any)=>`${a.title}（${a.document?`PDF 第 ${a.page} 页`:a.providerText?`PMC ${a.providerText.reportedVersion} · 无 PDF 页码`:`行${a.lineStart}–${a.lineEnd}`}）`).join('；')}。副本不计为新的独立支持。</p>:null}<p className="small muted">证据 <code>{h.evidenceId}</code> · 源摘要 <code>{short(h.digest)}</code></p>
                    {h.document?<button className="text-button" onClick={()=>this.props.onDocument?.({documentVersionId:h.document.documentVersionId,parseResultId:h.document.parseResultId,pageNumber:h.page,start:h.locator.start,end:h.locator.end})}>返回固定 PDF 原页</button>:h.providerText?<button className="text-button" onClick={()=>this.props.onDocument?.({documentVersionId:h.providerText.documentVersionId})}>返回固定 PMC 文档</button>:<button className="text-button" onClick={() => perform(async () => this.setState({sourcePreview: await artifactText(h.artifactId)}))}>读取对应原文件</button>}
                </article>)}
                <p className="small muted">{result.limitations.join(' ')}</p>
            </div> : null}
            {this.state.sourcePreview ? <details open><summary>原文件文本（不是模型摘要）</summary><pre className="file-preview">{this.state.sourcePreview}</pre></details> : null}
            <TextCorpusGrantPanel data={data} perform={perform} onSession={this.props.onSession}/>
        </section>;
    }
}

const grantExpiry=()=>{const d=new Date(Date.now()+3600000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
export class TextCorpusGrantPanel extends React.Component<{data:ProjectState;perform:Perform;onSession?:(id:string)=>void},{sessionId:string;documents:DocumentChoice[];pmcDocuments:string[];maxSearches:number;expiresAt:string;selectedId:string;error:string}>{
    state={sessionId:'',documents:[] as DocumentChoice[],pmcDocuments:[] as string[],maxSearches:2,expiresAt:grantExpiry(),selectedId:'',error:''};
    componentDidUpdate(previous:Readonly<TextCorpusGrantPanel['props']>){if(previous.data.project.id!==this.props.data.project.id)this.setState({sessionId:'',documents:[],pmcDocuments:[],maxSearches:2,expiresAt:grantExpiry(),selectedId:'',error:''});else if(previous.data.textEvidence?.corpusId!==this.props.data.textEvidence?.corpusId)this.setState({documents:[],pmcDocuments:[]});}
    private call(name:string,input:unknown){return api<TextCorpusGrantDTO>(`/operations/${name}`,{projectId:this.props.data.project.id,input});}
    private prepare(){const {data,perform}=this.props,s=this.state,config=data.textEvidence;try{
        if(!config?.enabled||!config.corpusId||!s.sessionId||(!s.documents.length&&!s.pmcDocuments.length)||s.documents.length>0&&s.pmcDocuments.length>0||s.pmcDocuments.length>1)throw Error('请先启用语料，再选择 PDF 范围或一份 PMC 全文及主会话');
        const date=new Date(s.expiresAt),remaining=date.getTime()-Date.now();if(!Number.isFinite(remaining)||remaining<=0||remaining>86400000)throw Error('截止时间须在未来24小时内');
        this.setState({error:''});void perform(async()=>{const grant=await this.call('text_corpus_grant_prepare',{sessionId:s.sessionId,documents:s.documents,...(s.pmcDocuments.length?{pmcDocuments:s.pmcDocuments.map(documentVersionId=>({documentVersionId}))}:{}),corpusId:config.corpusId,configurationVersion:config.version,maxSearches:s.maxSearches,expiresAt:date.toISOString()});this.setState({selectedId:grant.id});},'固定原文授权草案已保存，等待单独批准');
    }catch(error){this.setState({error:error instanceof Error?error.message:String(error)});}}
    render(){const {data,perform}=this.props,s=this.state,config=data.textEvidence,available=config?.documents??[],availablePmc=config?.pmcDocuments??[],grants=data.textCorpusGrants??[],selectedId=s.selectedId||grants[grants.length-1]?.id||'',g=grants.find(row=>row.id===selectedId),approval=data.approvals.find(row=>row.id===g?.approvalId);return <div className="inspector-section">
        <h3>指定 Pi 会话检索固定原文</h3><p className="small muted">只授权选定的 PDF 解析页或一份 PMC OA 全文、指定主会话和有限次本地词项检索；不授权原件下载、联网、计算或科学结论。准备、批准和激活不调用模型。</p>
        <details><summary>准备固定原文检索授权</summary><form onSubmit={(e:any)=>{e.preventDefault();this.prepare();}}><label>指定主协调会话<select aria-label="原文检索授权主会话" required value={s.sessionId} onChange={(e:any)=>this.setState({sessionId:e.target.value})}>{nativeSelectButton}<option value="">选择尚未绑定原文授权的会话</option>{data.sessions.filter(row=>row.role==='coordinator'&&!row.taskId&&row.state!=='archived'&&!row.textCorpusGrantId).map(row=><option key={row.id} value={row.id}>{row.title} · {short(row.id)}</option>)}</select></label>
            <fieldset><legend>固定 PDF 及解析版本</legend>{available.map(item=><label className="check-label" key={pair(item)}><input type="checkbox" checked={s.documents.some(value=>pair(value)===pair(item))} onChange={(e:any)=>this.setState({documents:e.target.checked?[...s.documents,{documentVersionId:item.documentVersionId,parseResultId:item.parseResultId}]:s.documents.filter(value=>pair(value)!==pair(item)),pmcDocuments:e.target.checked?[]:s.pmcDocuments})}/>{item.title} · {short(item.documentVersionId)} / {short(item.parseResultId)}</label>)}{!available.length?<p className="inline-empty">当前语料没有已批准解析的固定 PDF。</p>:null}</fieldset>
            <fieldset><legend>固定 PMC OA 全文（只选一份，无 PDF 页码）</legend>{availablePmc.map(item=><label className="check-label" key={item.documentVersionId}><input type="checkbox" aria-label={`PMC 授权文档 ${item.documentVersionId}`} checked={s.pmcDocuments.includes(item.documentVersionId)} onChange={(e:any)=>this.setState({pmcDocuments:e.target.checked?[item.documentVersionId]:[],documents:e.target.checked?[]:s.documents})}/>{item.title} · {item.reportedVersion}</label>)}{!availablePmc.length?<p className="inline-empty">当前语料没有显式选入的 PMC OA 全文。</p>:null}</fieldset>
            <div className="form-columns"><label>最多新检索次数<select aria-label="原文授权检索次数" value={s.maxSearches} onChange={(e:any)=>this.setState({maxSearches:Number(e.target.value)})}>{nativeSelectButton}<option value={1}>1 次</option><option value={2}>2 次</option></select></label><label>截止（本地时间，24小时内）<input aria-label="原文授权截止" type="datetime-local" required value={s.expiresAt} onChange={(e:any)=>this.setState({expiresAt:e.target.value})}/></label></div><button className="secondary" disabled={data.project.archived||!config?.enabled||!s.sessionId||!(s.documents.length+s.pmcDocuments.length)}>保存固定授权草案</button></form></details>
        {grants.length?<label>查看固定原文授权<select aria-label="查看固定原文授权" value={selectedId} onChange={(e:any)=>this.setState({selectedId:e.target.value})}>{nativeSelectButton}{grants.map(row=><option key={row.id} value={row.id}>{short(row.id)} · {row.state}</option>)}</select></label>:<p className="inline-empty">暂无固定原文会话授权。</p>}
        {s.error?<p role="alert" className="error-text">{s.error}</p>:null}
        {g?<div><p>状态：{g.effectiveState} · {g.validity} · 已用 {g.usage.used}/{g.usage.limit} 次新检索，剩余 {g.usage.remaining} 次。</p>{g.reasons?.map((reason,i)=><p role="status" key={i}>{reason}</p>)}<p>主会话 {short(g.sessionId)} · 模型 {g.model.provider}/{g.model.model} {this.props.onSession?<button className="text-button" onClick={()=>this.props.onSession?.(g.sessionId)}>打开会话</button>:null}</p><p>语料 {short(g.corpusId)} / 配置版本 {g.configurationVersion} · 截止 {g.expiresAt}</p>{g.documents.map(item=><p className="small muted" key={pair(item)}>固定 PDF {short(item.documentVersionId)} · 解析 {short(item.parseResultId)} · 来源摘要 {short(item.sourceDigest)}</p>)}{g.pmcDocuments?.map(item=><p className="small muted" key={item.documentVersionId}>固定 PMC {short(item.documentVersionId)} · 来源摘要 {short(item.sourceDigest)} · 无 PDF 页码</p>)}
            <div className="actions wrap">{g.state==='draft'&&approval?.status==='pending'?<button className="primary" disabled={data.project.archived||(g.validity!=='current')} onClick={()=>perform(()=>api(`/approvals/${approval.id}/decide`,{expectedVersion:approval.version,approved:true}),'固定原文检索授权已批准，尚未激活')}>批准固定原文范围</button>:null}{g.state==='draft'&&approval?.status==='approved'?<button className="primary" disabled={data.project.archived||(g.validity!=='current')} onClick={()=>perform(()=>this.call('text_corpus_grant_activate',{grantId:g.id,expectedVersion:g.version}),'指定会话的固定原文检索授权已激活')}>激活已批准授权</button>:null}{g.state!=='revoked'?<button className="secondary" onClick={()=>perform(()=>this.call('text_corpus_grant_revoke',{grantId:g.id,expectedVersion:g.version}),'固定原文检索授权已撤销，历史保留')} disabled={data.project.archived}>撤销授权</button>:null}</div>
            <p className="small muted">批准记录 {short(g.approvalId)} · 固定摘要 <code>{short(g.digest)}</code></p><p className="small muted">已完成检索 {g.searchResults?.length??0} 条；固定证据可从上方历史检索回查。额度仅计已提交的新本地检索，不计 HTTP。</p></div>:null}
    </div>;}
}
