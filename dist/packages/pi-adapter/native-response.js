import { ensure } from '../domain/errors.js';
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const list = (value) => Array.isArray(value) ? value : [];
const MAX_TEXT = 128000, MAX_ITEMS = 1000;
/** Keep provider citations as untrusted links; they do not establish locally verified evidence. */
export function parseNativeResponse(api, value, redact = value => value) {
    const root = record(value), citations = [], searchCalls = [], usage = {};
    let text = '', stopReason = '', complete = true;
    const safe = (value, max = 4000) => typeof value === 'string' ? redact(value).slice(0, max) : '';
    const append = (value) => { ensure(typeof value === 'string', 'NATIVE_RESPONSE_INVALID', '原生模型返回缺少文字', 502); text += redact(value); ensure(text.length <= MAX_TEXT, 'NATIVE_RESPONSE_LIMIT', '原生模型输出超过128000字符', 502); };
    const citation = (value) => {
        const c = record(value), raw = typeof c.url === 'string' ? c.url : '';
        if (!raw || raw.length > 4000 || redact(raw) !== raw)
            return;
        let url;
        try {
            url = new URL(raw);
        }
        catch {
            return;
        }
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
            return;
        const result = { url: url.href, title: safe(c.title) || url.hostname };
        if (Number.isSafeInteger(c.start_index) && Number.isSafeInteger(c.end_index) && c.start_index >= 0 && c.end_index >= c.start_index) {
            result.startIndex = c.start_index;
            result.endIndex = c.end_index;
        }
        if (typeof c.cited_text === 'string')
            result.citedText = safe(c.cited_text, 16000);
        return result;
    };
    const addCitation = (value, offset = 0, length) => { const c = citation(value); if (c) {
        if (c.startIndex !== undefined && c.endIndex !== undefined) {
            if (length !== undefined && c.endIndex > length) {
                delete c.startIndex;
                delete c.endIndex;
            }
            else {
                c.startIndex += offset;
                c.endIndex += offset;
            }
        }
        ensure(citations.length < MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生模型引用数量过多', 502);
        citations.push(c);
    } };
    const addCall = (call) => { ensure(searchCalls.length < MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生搜索调用数量过多', 502); searchCalls.push(call); };
    const addUsage = (source, prefix = '') => { for (const [key, value] of Object.entries(record(source))) {
        if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && /^[a-z_]{1,80}$/.test(key))
            usage[prefix + key] = value;
    } };
    let continuation, continuationUnavailable;
    if (api === 'openai-completions') {
        const choices = list(root.choices);
        ensure(choices.length === 1, 'NATIVE_RESPONSE_INVALID', '原生模型返回须包含一个答案', 502);
        const choice = record(choices[0]), message = record(choice.message);
        append(message.content);
        for (const annotation of list(message.annotations)) {
            const a = record(annotation);
            if (a.type === 'url_citation')
                addCitation(record(a.url_citation), 0, text.length);
        }
        stopReason = safe(choice.finish_reason, 100);
        complete = stopReason === 'stop';
        // Chat exposes citations but no complete server-search call transcript.
        if (citations.length)
            addCall({ status: 'citations-returned', sources: [...citations] });
        if (list(message.tool_calls).length)
            complete = false;
        addUsage(root.usage);
    }
    else if (api === 'openai-responses') {
        const output = list(root.output);
        ensure(output.length <= MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生模型输出块过多', 502);
        for (const raw of output) {
            const item = record(raw);
            if (item.type === 'message') {
                for (const rawContent of list(item.content)) {
                    const content = record(rawContent);
                    if (content.type === 'output_text') {
                        const offset = text.length;
                        append(content.text);
                        for (const annotation of list(content.annotations)) {
                            const a = record(annotation);
                            if (a.type === 'url_citation')
                                addCitation(a, offset, text.length - offset);
                        }
                    }
                    else if (content.type === 'refusal') {
                        append(content.refusal);
                        complete = false;
                    }
                    else
                        complete = false;
                }
            }
            else if (item.type === 'web_search_call') {
                const action = record(item.action), sources = list(action.sources).map(citation).filter((c) => !!c);
                ensure(sources.length <= MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生搜索来源数量过多', 502);
                const target = citation({ url: action.url }), queries = list(action.queries);
                ensure(queries.length <= MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生搜索查询数量过多', 502);
                addCall({ ...(safe(item.id, 200) ? { id: safe(item.id, 200) } : {}), status: safe(item.status, 100) || 'unknown', ...(typeof action.query === 'string' ? { query: safe(action.query, 16000) } : {}), ...(queries.length ? { queries: queries.filter(v => typeof v === 'string').map(v => safe(v, 16000)) } : {}), ...(typeof action.type === 'string' ? { action: safe(action.type, 100) } : {}), ...(target ? { targetUrl: target.url } : {}), ...(typeof action.pattern === 'string' ? { pattern: safe(action.pattern, 4000) } : {}), sources });
                if (item.status !== 'completed')
                    complete = false;
            }
            else if (item.type !== 'reasoning')
                complete = false;
        }
        stopReason = safe(root.status, 100);
        complete = complete && root.status === 'completed' && !root.error;
        addUsage(root.usage);
        addUsage(record(root.usage).input_tokens_details, 'input_');
        addUsage(record(root.usage).output_tokens_details, 'output_');
    }
    else {
        const blocks = list(root.content);
        ensure(blocks.length <= MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生模型输出块过多', 502);
        const calls = new Map();
        for (const raw of blocks) {
            const block = record(raw);
            if (block.type === 'text') {
                append(block.text);
                for (const c of list(block.citations))
                    addCitation(c);
            }
            else if (block.type === 'server_tool_use' && block.name === 'web_search') {
                const id = safe(block.id, 200), input = record(block.input), call = { ...(id ? { id } : {}), status: 'requested', ...(typeof input.query === 'string' ? { query: safe(input.query, 16000) } : {}), sources: [] };
                addCall(call);
                if (id)
                    calls.set(id, call);
            }
            else if (block.type === 'web_search_tool_result') {
                const id = safe(block.tool_use_id, 200), call = calls.get(id) ?? { ...(id ? { id } : {}), status: 'unknown', sources: [] };
                if (!calls.has(id)) {
                    addCall(call);
                    if (id)
                        calls.set(id, call);
                }
                if (Array.isArray(block.content)) {
                    ensure(block.content.length <= MAX_ITEMS, 'NATIVE_RESPONSE_LIMIT', '原生搜索来源数量过多', 502);
                    call.status = 'completed';
                    for (const source of block.content) {
                        const c = citation(source);
                        if (c)
                            call.sources.push(c);
                    }
                }
                else {
                    call.status = 'failed';
                    call.error = safe(record(block.content).error_code, 100) || 'web-search-failed';
                    complete = false;
                }
            }
            else if (!['thinking', 'redacted_thinking'].includes(block.type))
                complete = false;
        }
        stopReason = safe(root.stop_reason, 100);
        complete = complete && stopReason === 'end_turn';
        addUsage(root.usage);
        addUsage(record(root.usage).server_tool_use, 'server_');
        if (stopReason === 'pause_turn') {
            // Retain exact server blocks for an explicitly approved continuation; never silently reconstruct them.
            const pending = [blocks];
            let safeContinuation = true, count = 0;
            while (pending.length) {
                const item = pending.pop();
                ensure(++count <= 100000, 'NATIVE_RESPONSE_LIMIT', '原生续跑返回结构过大', 502);
                if (typeof item === 'string') {
                    if (redact(item) !== item)
                        safeContinuation = false;
                }
                else if (Array.isArray(item)) {
                    for (const child of item)
                        pending.push(child);
                }
                else if (item && typeof item === 'object') {
                    for (const child of Object.values(item))
                        pending.push(child);
                }
            }
            const allowed = new Set(['text', 'thinking', 'redacted_thinking', 'web_search_tool_result']);
            if (blocks.some(raw => { const b = record(raw); return !allowed.has(b.type) && !(b.type === 'server_tool_use' && b.name === 'web_search'); }))
                safeContinuation = false;
            if (safeContinuation)
                continuation = blocks;
            else
                continuationUnavailable = '续跑原生数据包含受保护内容或未支持的工具，须新建请求。';
        }
    }
    if (searchCalls.some(call => !['completed', 'citations-returned'].includes(call.status)))
        complete = false;
    ensure(text.length > 0 || searchCalls.length > 0 || stopReason === 'pause_turn', 'NATIVE_RESPONSE_INVALID', '原生模型未返回可保存的答案或搜索回执', 502);
    const responseId = safe(root.id, 200);
    return { text, citations, searchCalls, usage, ...(responseId ? { responseId } : {}), stopReason, status: complete ? 'completed' : 'incomplete', ...(continuation ? { continuation } : {}), ...(continuationUnavailable ? { continuationUnavailable } : {}) };
}
//# sourceMappingURL=native-response.js.map