import { DomainError, ensure } from '../domain/errors.js';
import { setTimeout as delay } from 'node:timers/promises';
const HOSTS = new Set(['api.alphaxiv.org', 'www.alphaxiv.org', 'api.openalex.org', 'api.biorxiv.org', 'eutils.ncbi.nlm.nih.gov', 'api.crossref.org', 'arxiv.org', 'www.biorxiv.org', 'content.openalex.org']);
export const DEFAULT_CONNECTOR_TIMEOUT_MS = 12000;
export const PAPER_READ_TIMEOUT_MS = 60000;
/** Fixed HTTPS hosts, no redirects/proxies supplied by agents, bounded bodies and no implicit retries. */
export class ConnectorTransport {
    fetcher;
    active = 0;
    ncbiNext = 0;
    interval;
    constructor(options = {}) { this.fetcher = options.fetcher ?? ((...args) => fetch(...args)); this.interval = options.minIntervalMs ?? 350; }
    async bytes(url, headers, validate, maxBytes = 2 * 1024 * 1024, signal, observe, beforeSend, timeoutMs = DEFAULT_CONNECTOR_TIMEOUT_MS) {
        ensure(url.protocol === 'https:' && HOSTS.has(url.hostname) && !url.port && !url.username && !url.password && !url.hash, 'CONNECTOR_HOST_DENIED', '只允许固定文献来源 HTTPS 地址', 403);
        const controller = new AbortController();
        const deadline = setTimeout(() => controller.abort(), timeoutMs);
        const abort = () => controller.abort();
        signal?.addEventListener('abort', abort, { once: true });
        let acquired = false;
        let checkError;
        const poll = setInterval(() => { try {
            validate();
        }
        catch (e) {
            checkError = e;
            controller.abort();
        } }, 150);
        try {
            validate();
            ensure(!signal?.aborted, 'CONNECTOR_CANCELLED', '请求已取消');
            while (this.active >= 3) {
                await delay(30, undefined, { signal: controller.signal });
                validate();
            }
            this.active++;
            acquired = true;
            if (url.hostname === 'eutils.ncbi.nlm.nih.gov') {
                const wait = Math.max(0, this.ncbiNext - Date.now());
                this.ncbiNext = Date.now() + wait + this.interval;
                if (wait)
                    await delay(wait, undefined, { signal: controller.signal });
            }
            validate();
            beforeSend?.();
            const response = await this.fetcher(url, { headers: { 'User-Agent': 'PiResearch-Connectors/1.0', 'Accept': 'application/json, application/xml, text/markdown, text/plain', ...headers }, redirect: 'error', signal: controller.signal });
            const retry = response.headers.get('retry-after');
            const retryAfter = retry && /^\d{1,10}$/.test(retry) ? retry : retry && /^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(retry) && !Number.isNaN(Date.parse(retry)) ? new Date(retry).toUTCString() : null;
            observe?.({ httpStatus: response.status, retryAfter });
            if (response.status < 200 || response.status >= 300)
                await response.body?.cancel().catch(() => { });
            ensure(response.status >= 200 && response.status < 300, response.status === 429 ? 'CONNECTOR_RATE_LIMITED' : response.status === 404 ? 'PAPER_NOT_FOUND' : 'CONNECTOR_HTTP_ERROR', `文献来源返回 HTTP ${response.status}`, response.status === 404 ? 404 : 502);
            const length = response.headers.get('content-length');
            const allowedLength = length === null || /^\d+$/.test(length) && +length <= maxBytes;
            if (!allowedLength)
                await response.body?.cancel().catch(() => { });
            ensure(allowedLength, 'CONNECTOR_RESPONSE_TOO_LARGE', '文献响应超过大小限制', 413);
            const reader = response.body?.getReader();
            ensure(reader, 'PROVIDER_SCHEMA_INVALID', '文献响应没有正文', 502);
            let bytes = 0;
            const chunks = [];
            try {
                while (true) {
                    validate();
                    const item = await reader.read();
                    if (item.done)
                        break;
                    bytes += item.value.length;
                    ensure(bytes <= maxBytes, 'CONNECTOR_RESPONSE_TOO_LARGE', '文献响应超过大小限制', 413);
                    chunks.push(item.value);
                }
            }
            catch (e) {
                await reader.cancel().catch(() => { });
                throw e;
            }
            finally {
                reader.releaseLock();
            }
            validate();
            return { body: Buffer.concat(chunks), bytes, contentType: response.headers.get('content-type') ?? '', status: response.status, rateLimitRemaining: response.headers.get('x-ratelimit-remaining') };
        }
        catch (e) {
            if (checkError)
                throw checkError;
            if (e instanceof DomainError)
                throw e;
            throw new DomainError(controller.signal.aborted ? 'CONNECTOR_CANCELLED' : 'CONNECTOR_UNAVAILABLE', controller.signal.aborted ? '连接器请求超时或已取消' : '无法取得文献来源响应；这不代表没有相关论文', 503);
        }
        finally {
            clearTimeout(deadline);
            clearInterval(poll);
            signal?.removeEventListener('abort', abort);
            if (acquired)
                this.active--;
        }
    }
    async text(url, headers, validate, maxBytes = 2 * 1024 * 1024, signal, observe, beforeSend, timeoutMs = DEFAULT_CONNECTOR_TIMEOUT_MS) {
        const r = await this.bytes(url, headers, validate, maxBytes, signal, observe, beforeSend, timeoutMs);
        try {
            return { ...r, text: new TextDecoder('utf-8', { fatal: true }).decode(r.body) };
        }
        catch {
            throw new DomainError('PROVIDER_SCHEMA_INVALID', '来源没有返回有效 UTF-8 文本', 502);
        }
    }
}
//# sourceMappingURL=transport.js.map