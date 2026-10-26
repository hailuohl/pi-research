import type {Actor} from '../domain/types.js';
import {parseSearch} from '../connectors/contracts.js';
import {discoveryContext,assertDiscoveryContext,discoveryScope,reserveConnectorCall,discoveryProof} from '../policy/discovery-grant-validation.js';
import {ConnectorTransport,SEARCH_NETWORK_POLICY,searchDeadline} from '../connectors/transport.js';
import {connectorSettings,assertSourceEnabled} from '../connectors/settings.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
import { randomUUID } from 'node:crypto';
import type { AppContext } from '../domain/context.js';
import { ensure, DomainError } from '../domain/errors.js';
import { text, integer } from '../contracts/validation.js';
export class LiteratureService {
    constructor(private c: AppContext) { }
    /** Metadata-only Crossref search. A search hit is never full-text evidence. */
    async search(projectId: string, query: string, limit = 8, key: string = randomUUID(), validate: () => void = () => { }, actor:Actor={type:'user'},signal?:AbortSignal) {
        const deadline=searchDeadline(signal);try{
        const ctx=discoveryContext(this.c.store,projectId,actor,{kind:'search',search:parseSearch({query,sources:['crossref'],limit})},key);ensure(!ctx?.taskId,'DISCOVERY_TASK_OPERATION_DENIED','任务级发现授权只允许固定 Connector 检索入口');const settingsVersion=connectorSettings(this.c.store,projectId).version;
        const previousValidate=validate,lifecycleEpoch=assertProjectWritable(this.c.store,projectId).lifecycleEpoch;
        validate=()=>{if(ctx)assertDiscoveryContext(this.c.store,projectId,ctx);assertProjectWritable(this.c.store,projectId,lifecycleEpoch);ensure(connectorSettings(this.c.store,projectId).version===settingsVersion,'CONNECTOR_SETTINGS_CHANGED','来源设置已改变');assertSourceEnabled(this.c.store,projectId,'crossref');deadline.checkCaller();previousValidate();deadline.check();};
        validate();
        const request = { projectId, query, limit }, scope = discoveryScope(`literature:${projectId}`,ctx);
        const previous = this.c.store.operationResult<any>(scope, key, request);
        if (previous.found)
            return previous.value;
        if(ctx)assertDiscoveryContext(this.c.store,projectId,ctx,true);
        this.c.store.get('project', projectId);
        text(query, 'query', 500);
        integer(limit, 'limit', 1, 20);
        const url = new URL('https://api.crossref.org/works');
        url.searchParams.set('query', query);
        url.searchParams.set('rows', String(limit));
        url.searchParams.set('select', 'DOI,title,author,published,URL,container-title');
        const call=this.c.store.transaction(()=>{validate();return reserveConnectorCall(this.c.store,projectId,'crossref',url,ctx);});
        let raw:string;
        try {
            const response=await new ConnectorTransport().text(url,{},validate,ctx?Math.min(2*1024*1024,assertDiscoveryContext(this.c.store,projectId,ctx).maxResponseBytes):2*1024*1024,deadline.signal,observation=>{const latest=this.c.store.get('connector-call',call.id);this.c.store.update('connector-call',call.id,latest.version,observation);},()=>{if(ctx)assertDiscoveryContext(this.c.store,projectId,ctx,true);},SEARCH_NETWORK_POLICY);
            raw=response.text;
            this.c.store.transaction(()=>{const latest=this.c.store.get('connector-call',call.id);this.c.store.update('connector-call',call.id,latest.version,{status:'succeeded',bytes:response.bytes});});
        } catch (e) {
            this.c.store.transaction(()=>{const latest=this.c.store.get('connector-call',call.id);this.c.store.update('connector-call',call.id,latest.version,{status:'failed-or-unknown',error:e instanceof DomainError?e.code:'CONNECTOR_FAILED'});});
            validate();
            if(e instanceof DomainError)throw e;
            throw new DomainError('LITERATURE_PROVIDER_UNAVAILABLE','Crossref 请求失败；不能据此判断没有相关论文',503);
        }
        const data = JSON.parse(raw);
        ensure(Array.isArray(data?.message?.items), 'PROVIDER_SCHEMA_INVALID', 'Crossref 响应格式错误', 502);
        const items = data.message.items.map((v: any) => ({ doi: String(v.DOI ?? ''), title: Array.isArray(v.title) ? String(v.title[0] ?? '') : '', authors: (v.author ?? []).slice(0, 10).map((a: any) => [a.given, a.family].filter(Boolean).join(' ')), date: v.published?.['date-parts']?.[0] ?? [], journal: v['container-title']?.[0] ?? '', url: typeof v.URL === 'string' && /^https:\/\//.test(v.URL) ? v.URL : '', fullTextRead: false, source: 'crossref' }));
        validate();
        return this.c.store.operation(scope, key, request, () => { validate();const record = this.c.store.create('literature-search', projectId, {...discoveryProof(ctx), query, source: 'crossref', retrievedAt: new Date().toISOString(), coverage: 'metadata-only', items }); this.c.store.event(projectId, 'literature.searched', { searchId: record.id, count: items.length, coverage: 'metadata-only' }); return record; });
        }finally{deadline.dispose();}
    }
}
