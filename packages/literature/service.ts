import {ConnectorTransport} from '../connectors/transport.js';
import {connectorSettings,assertSourceEnabled} from '../connectors/settings.js';
import {assertProjectWritable} from '../policy/lifecycle.js';
import { randomUUID } from 'node:crypto';
import type { AppContext } from '../domain/context.js';
import { ensure, DomainError } from '../domain/errors.js';
import { text, integer } from '../contracts/validation.js';
export class LiteratureService {
    constructor(private c: AppContext) { }
    /** Metadata-only Crossref search. A search hit is never full-text evidence. */
    async search(projectId: string, query: string, limit = 8, key: string = randomUUID(), validate: () => void = () => { }) {
        const settingsVersion=connectorSettings(this.c.store,projectId).version;
        const previousValidate=validate;
        validate=()=>{assertProjectWritable(this.c.store,projectId);ensure(connectorSettings(this.c.store,projectId).version===settingsVersion,'CONNECTOR_SETTINGS_CHANGED','来源设置已改变');assertSourceEnabled(this.c.store,projectId,'crossref');previousValidate();};
        validate();
        const request = { projectId, query, limit }, scope = `literature:${projectId}`;
        const previous = this.c.store.operationResult<any>(scope, key, request);
        if (previous.found)
            return previous.value;
        this.c.store.get('project', projectId);
        text(query, 'query', 500);
        integer(limit, 'limit', 1, 20);
        const url = new URL('https://api.crossref.org/works');
        url.searchParams.set('query', query);
        url.searchParams.set('rows', String(limit));
        url.searchParams.set('select', 'DOI,title,author,published,URL,container-title');
        const call=this.c.store.transaction(()=>{validate();const cfg=connectorSettings(this.c.store,projectId);ensure(this.c.store.list('connector-call',projectId).length<cfg.requestLimit,'CONNECTOR_BUDGET_EXCEEDED','项目网络请求次数已用完');return this.c.store.create('connector-call',projectId,{source:'crossref',host:url.hostname,status:'reserved',startedAt:new Date().toISOString()});});
        let raw:string;
        try {
            const response=await new ConnectorTransport().text(url,{},validate);
            raw=response.text;
            this.c.store.update('connector-call',call.id,call.version,{status:'succeeded',bytes:response.bytes});
        } catch (e) {
            this.c.store.update('connector-call',call.id,call.version,{status:'failed-or-unknown',error:e instanceof DomainError?e.code:'CONNECTOR_FAILED'});
            validate();
            throw new DomainError('LITERATURE_PROVIDER_UNAVAILABLE','Crossref 请求失败；不能据此判断没有相关论文',503);
        }
        const data = JSON.parse(raw);
        ensure(Array.isArray(data?.message?.items), 'PROVIDER_SCHEMA_INVALID', 'Crossref 响应格式错误', 502);
        const items = data.message.items.map((v: any) => ({ doi: String(v.DOI ?? ''), title: Array.isArray(v.title) ? String(v.title[0] ?? '') : '', authors: (v.author ?? []).slice(0, 10).map((a: any) => [a.given, a.family].filter(Boolean).join(' ')), date: v.published?.['date-parts']?.[0] ?? [], journal: v['container-title']?.[0] ?? '', url: typeof v.URL === 'string' && /^https:\/\//.test(v.URL) ? v.URL : '', fullTextRead: false, source: 'crossref' }));
        validate();
        return this.c.store.operation(scope, key, request, () => { const record = this.c.store.create('literature-search', projectId, { query, source: 'crossref', retrievedAt: new Date().toISOString(), coverage: 'metadata-only', items }); this.c.store.event(projectId, 'literature.searched', { searchId: record.id, count: items.length, coverage: 'metadata-only' }); return record; });
    }
}
