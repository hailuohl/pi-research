import { USER } from '../../packages/domain/types.js';
import { ensure } from '../../packages/domain/errors.js';
import { text } from '../../packages/contracts/validation.js';
import { filePolicy } from '../../packages/storage/file-policy.js';
import { guardProjectRoute } from './routes.js';
export const DOCUMENT_UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;
function query(url, allowed, required = []) { ensure([...url.searchParams.keys()].every(key => allowed.includes(key) && url.searchParams.getAll(key).length === 1) && required.every(key => url.searchParams.has(key)), 'INVALID_INPUT', '查询参数缺失、重复或不支持', 400); }
function cursor(url, key) { const value = url.searchParams.get(key); if (value === null)
    return undefined; ensure(/^(0|[1-9][0-9]*)$/.test(value), 'INVALID_INPUT', `${key} 必须是非负整数`, 400); return Number(value); }
/** Owner-only binary transport; deliberately separate from the legacy JSON operation and agent tool registry. */
export async function documentFileRoute(app, route, url, req, res) {
    const upload = route.match(/^\/projects\/([^/]+)\/documents\/upload$/), read = route.match(/^\/projects\/([^/]+)\/documents\/([^/]+)\/text$/), policy = route.match(/^\/projects\/([^/]+)\/document-file-policy$/);
    if (!upload && !read && !policy)
        return;
    ensure(req.method === (upload ? 'POST' : 'GET'), 'METHOD_NOT_ALLOWED', upload ? '原件上传只接受 POST' : '原件分页只接受 GET', 405);
    guardProjectRoute(app, route, !!upload);
    if (policy) {
        query(url, []);
        app.projects.read(USER, policy[1]);
        return { result: { ...filePolicy(), uploadTimeoutMs: DOCUMENT_UPLOAD_TIMEOUT_MS, cursorUnit: 'utf8-byte' } };
    }
    if (read) {
        query(url, ['sourceDigest', 'cursor', 'limit'], ['sourceDigest']);
        const sourceDigest = text(url.searchParams.get('sourceDigest'), 'sourceDigest', 64);
        ensure(/^[a-f0-9]{64}$/.test(sourceDigest), 'INVALID_INPUT', 'sourceDigest 必须是原件 SHA-256', 400);
        return { result: app.documents.readText(USER, read[1], read[2], { sourceDigest, cursor: cursor(url, 'cursor'), limit: cursor(url, 'limit') }) };
    }
    query(url, ['title', 'mediaType', 'license'], ['title', 'mediaType']);
    ensure(req.headers.origin === undefined || req.headers.origin === `http://${req.headers.host}`, 'ORIGIN_DENIED', '上传只允许本机同源请求', 403);
    ensure(req.headers['sec-fetch-site'] !== 'cross-site', 'ORIGIN_DENIED', '上传不接受跨站请求', 403);
    ensure(req.headers['content-type']?.toLowerCase() === 'application/octet-stream', 'UNSUPPORTED_MEDIA_TYPE', '原件上传需要 application/octet-stream 二进制正文', 415);
    ensure(req.headers['content-encoding'] === undefined || req.headers['content-encoding'] === 'identity', 'UNSUPPORTED_MEDIA_TYPE', '原件上传不接受压缩正文', 415);
    const key = text(req.headers['idempotency-key'], 'Idempotency-Key', 200), max = filePolicy().maxFileBytes, declared = req.headers['content-length'];
    if (declared !== undefined)
        ensure(/^[0-9]+$/.test(declared) && Number.isSafeInteger(Number(declared)) && Number(declared) <= max, 'ARTIFACT_TOO_LARGE', `原始文本或数据文件最多 ${max} bytes`, 413);
    const controller = new AbortController(), cancel = () => { if (!res.writableEnded)
        controller.abort(); };
    res.on('close', cancel);
    const timeout = setTimeout(() => { controller.abort(); req.destroy(); }, DOCUMENT_UPLOAD_TIMEOUT_MS);
    timeout.unref();
    try {
        const title = text(url.searchParams.get('title'), 'title', 200), mediaType = text(url.searchParams.get('mediaType'), 'mediaType', 100), license = url.searchParams.get('license') ?? undefined;
        async function* bytes() { let size = 0; for await (const chunk of req) {
            size += chunk.length;
            yield chunk;
        } ensure(req.complete && (declared === undefined || size === Number(declared)), 'DOCUMENT_UPLOAD_INCOMPLETE', '原件上传未完成', 400); }
        return { result: await app.documents.importStream(USER, upload[1], { title, mediaType, license }, bytes(), key, controller.signal) };
    }
    finally {
        clearTimeout(timeout);
        res.off('close', cancel);
    }
}
//# sourceMappingURL=document-file-routes.js.map