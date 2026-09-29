import * as React from 'react';
import { api, artifactText } from './api.js';
import type { DocumentLocation, ProjectState } from './models.js';
import { short } from './models.js';
import type { Perform } from './workbench.js';
/** Optional local retrieval; nothing runs until the owner selects and enables a corpus. */
type DocumentChoice = {documentVersionId:string;parseResultId:string};
const pair = (value:DocumentChoice) => `${value.documentVersionId}:${value.parseResultId}`;
export class TextEvidencePanel extends React.Component<{data: ProjectState; perform: Perform; onDocument?:(target:DocumentLocation)=>void}, {
    selected: string[] | null; selectedDocuments:DocumentChoice[] | null; query: string; mmrLambda: number; result: any; loading: boolean; sourcePreview: string;
}> {
    state = {selected: null as string[] | null, selectedDocuments:null as DocumentChoice[]|null, query: '', mmrLambda: 1, result: null as any, loading: false, sourcePreview: ''};
    render() {
        const {data, perform} = this.props;
        const config = data.textEvidence ?? {enabled: false, version: 0, sources: []};
        const eligible = data.artifacts.filter(a => a.origin === 'user' && !a.taskId && !a.runId && !a.wakeupId &&
            ['text/plain', 'text/markdown'].includes(a.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(a.title));
        const saved = config.sources.map((s: any) => s.artifactId) as string[];
        const savedDocuments = (config.documents??[]).map(({documentVersionId,parseResultId})=>({documentVersionId,parseResultId}));
        const parsed = (data.documentParseJobs??[]).filter(job=>job.state==='succeeded'&&job.integrity==='complete'&&job.resultId)
            .map(job=>({documentVersionId:job.documentVersionId,parseResultId:job.resultId!,title:(data.documents??[]).find(d=>d.id===job.documentVersionId&&d.contentKind==='original-pdf')?.title}))
            .filter((value):value is DocumentChoice&{title:string}=>!!value.title);
        const selected = this.state.selected ?? saved;
        const selectedDocuments = this.state.selectedDocuments ?? savedDocuments;
        const selectionChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...saved].sort()) ||
            JSON.stringify(selectedDocuments.map(pair).sort()) !== JSON.stringify(savedDocuments.map(pair).sort());
        const history = data.textEvidenceSearches??[];
        const result = this.state.result??history[0]??null, stale = result && (result.configurationVersion !== config.version || !config.enabled);
        return <section className="surface">
            <div className="surface-heading"><h2>本地原文检索 · 试验功能</h2><span className="small muted">{config.enabled ? '已启用' : '默认关闭'}</span></div>
            <p className="small muted">本地词项评分与精确重复分组；PaperQA MMR 选择流程可选，默认不启用；不调用模型、不联网、不生成摘要或答案。仅处理显式选定的用户文本或已批准解析的固定 PDF；不是 OCR、语义问答或完整 PaperQA，不证明科学结论。</p>
            <details open={!config.enabled}><summary>选择允许检索的原文（文本文件或固定 PDF，最多 30 份）</summary>
                {!eligible.length && !parsed.length ? <p className="inline-empty">先导入 UTF-8 文本，或完成固定 PDF 的批准解析。模型产物不会加入原文集合。</p> : null}
                <div className="run-selection">{eligible.map(a => <label key={a.id}>
                    <input type="checkbox" checked={selected.includes(a.id)} disabled={this.state.loading} onChange={(e: any) => this.setState({selected: e.target.checked ? [...selected, a.id] : selected.filter(id => id !== a.id), result: null})}/>
                    <span>{a.title}<small>{short(a.id)}</small></span>
                </label>)}{parsed.map(d=><label key={pair(d)}><input type="checkbox" checked={selectedDocuments.some(value=>pair(value)===pair(d))} disabled={this.state.loading} onChange={(e:any)=>this.setState({selectedDocuments:e.target.checked?[...selectedDocuments,{documentVersionId:d.documentVersionId,parseResultId:d.parseResultId}]:selectedDocuments.filter(value=>pair(value)!==pair(d)),result:null})}/><span>{d.title}<small>固定 PDF · 解析 {short(d.parseResultId)}</small></span></label>)}</div>
                <div className="actions wrap"><button className="secondary" disabled={!(selected.length+selectedDocuments.length) || this.state.loading} onClick={() => perform(async () => {
                    await api(`/projects/${data.project.id}/text-evidence`, {enabled: true, artifactIds: selected, documents:selectedDocuments, expectedVersion: config.version});
                    this.setState({selected: null, selectedDocuments:null, result: null});
                }, '已保存固定原文范围；不会自动调用模型')}>保存范围并启用</button>
                {config.enabled ? <button className="secondary" disabled={this.state.loading} onClick={() => perform(async () => {
                    await api(`/projects/${data.project.id}/text-evidence`, {enabled: false, expectedVersion: config.version}); this.setState({result: null});
                }, '已关闭检索，历史文件与引用保留')}>关闭检索</button> : null}</div>
            </details>
            <form className="search-panel" onSubmit={(e: any) => {e.preventDefault();this.setState({loading: true});void perform(async () => {
                const response = await api('/text-evidence-search', {projectId: data.project.id, query: this.state.query, artifactIds: saved, ...(savedDocuments.length?{documents:savedDocuments,corpusId:config.corpusId,configurationVersion:config.version}:{}), limit: 5, mmrLambda: this.state.mmrLambda});
                this.setState({result: response, sourcePreview: ''});
            }).finally(() => this.setState({loading: false}));}}>
                <input aria-label="本地原文关键词" placeholder="输入关键词；中文可使用短语" value={this.state.query} disabled={this.state.loading} onChange={(e: any) => this.setState({query: e.target.value})}/>
                <select aria-label="检索排序策略" value={this.state.mmrLambda} disabled={this.state.loading} onChange={(e:any)=>this.setState({mmrLambda:Number(e.target.value),result:null})}><option value={1}>精确去重＋相关性（默认）</option><option value={0.65}>精确去重＋MMR 0.65（试验）</option></select>
                <button className="primary" disabled={!config.enabled || selectionChanged || !this.state.query.trim() || this.state.loading}>{this.state.loading ? '检索中…' : '查找原文'}</button>
            </form>
            {selectionChanged ? <p className="small muted">文档选择已改变，请先保存范围。</p> : null}
            {history.length?<details><summary>历史检索（最近 {history.length} 条，关闭后仍可读）</summary>{history.map(item=><button className="text-button" key={item.id} onClick={()=>this.setState({result:item,sourcePreview:''})}>{item.query} · {item.hits.length} 个片段 · {short(item.id)}</button>)}</details>:null}
            {stale ? <p className="inline-warning">集合已变更或功能已关闭；下方是历史查询，请重新检索。</p> : null}
            {result ? <div>
                <p className="small muted">{result.status === 'no_lexical_match' ? '未找到词项匹配；不表示文献中没有答案。' : `返回 ${result.hits.length} 个原文片段。相关性不是科学正确性。`}</p>
                {result.coverage ? <p className="small muted">已搜索选定 {result.coverage.sourceCount} 份原文 / {result.coverage.totalChunks} 个分块；{result.coverage.matchingChunks} 个词项匹配；合并 {result.coverage.exactDuplicatesGrouped} 个相同片段并保留其他来源。{result.coverage.resultsTruncated ? '当前展示受数量限制，可缩小查询或增大接口 limit（最多10）。' : ''}</p> : null}
                {result.hits.map((h: any) => <article className="inspector-section" key={h.chunkId}>
                    <h3>{h.title}</h3><p className="small muted">{h.document?`固定 PDF 物理第 ${h.page} 页`:`原文件第 ${h.lineStart}–${h.lineEnd} 行 · 无 PDF 页码`} · UTF-16 区间 [{h.locator.start}, {h.locator.end})</p>
                    <pre className="document-preview">{h.quote}</pre>{h.alternativeSources?.length?<p className="small muted">相同原文还出现于：{h.alternativeSources.map((a:any)=>`${a.title}（${a.document?`PDF 第 ${a.page} 页`:`行${a.lineStart}–${a.lineEnd}`}）`).join('；')}。副本不计为新的独立支持。</p>:null}<p className="small muted">证据 <code>{h.evidenceId}</code> · 源摘要 <code>{short(h.digest)}</code></p>
                    {h.document?<button className="text-button" onClick={()=>this.props.onDocument?.({documentVersionId:h.document.documentVersionId,parseResultId:h.document.parseResultId,pageNumber:h.page,start:h.locator.start,end:h.locator.end})}>返回固定 PDF 原页</button>:<button className="text-button" onClick={() => perform(async () => this.setState({sourcePreview: await artifactText(h.artifactId)}))}>读取对应原文件</button>}
                </article>)}
                <p className="small muted">{result.limitations.join(' ')}</p>
            </div> : null}
            {this.state.sourcePreview ? <details open><summary>原文件文本（不是模型摘要）</summary><pre className="file-preview">{this.state.sourcePreview}</pre></details> : null}
        </section>;
    }
}
