import { ensure } from '../../packages/domain/errors.js';
import { integer, text } from '../../packages/contracts/validation.js';
export const MAX_EVENT_STREAMS = 32;
export function eventQuery(url, stream = false, lastEventId) {
    const allowed = stream ? ['projectId', 'after'] : ['projectId', 'after', 'limit'];
    ensure([...url.searchParams.keys()].every(key => allowed.includes(key)) && allowed.every(key => url.searchParams.getAll(key).length <= 1), 'INVALID_INPUT', '事件接口参数无效；令牌只能放在 Authorization header', 400);
    const number = (raw, label) => { ensure(/^\d+$/.test(raw), 'INVALID_INPUT', `${label} 必须是非负整数`, 400); return integer(Number(raw), label, 0, Number.MAX_SAFE_INTEGER); };
    const after = url.searchParams.has('after') ? number(url.searchParams.get('after'), 'after') : undefined;
    const header = lastEventId === undefined ? undefined : number(lastEventId, 'Last-Event-ID');
    ensure(header === undefined || after === undefined || header === after, 'INVALID_INPUT', '事件 header 与 query 游标不一致', 400);
    return { after: after ?? header ?? 0, projectId: url.searchParams.has('projectId') ? text(url.searchParams.get('projectId'), 'projectId', 100) : undefined, limit: integer(number(url.searchParams.get('limit') ?? '200', 'limit'), 'limit', 1, 500) };
}
/** Only tiny wakeups are streamed. Durable events and business records remain separate reads. */
export class EventStreamHub {
    store;
    connections = new Set();
    closed = false;
    constructor(store) {
        this.store = store;
    }
    get size() { return this.connections.size; }
    open(req, res, { after, projectId }) {
        ensure(!this.closed, 'SERVER_CLOSING', '控制服务正在关闭', 503);
        ensure(this.connections.size < MAX_EVENT_STREAMS, 'EVENT_STREAM_LIMIT', '事件连接数已达上限', 429);
        let cursor = after, blocked = false, ended = false, initial = true, lastWake = 0, lastWrite = Date.now();
        const close = (shutdown = false) => { if (ended)
            return; ended = true; clearInterval(timer); this.connections.delete(close); req.off('aborted', onClose); res.off('close', onClose); res.off('error', onClose); res.off('drain', drain); if (shutdown) {
            res.end();
            res.destroy();
        } };
        const onClose = () => close();
        const write = (frame) => { blocked = !res.write(frame); lastWrite = Date.now(); };
        const tick = () => {
            if (ended || blocked)
                return;
            try {
                const now = Date.now(), latest = this.store.visibleEventCursor(projectId);
                if (initial || latest !== cursor && now - lastWake >= 150) {
                    const reset = cursor > latest;
                    cursor = latest;
                    initial = false;
                    lastWake = now;
                    write(`event: wake\nid: ${cursor}\ndata: ${JSON.stringify({ cursor, reset })}\n\n`);
                }
                else if (now - lastWrite >= 15000)
                    write(': heartbeat\n\n');
            }
            catch (error) {
                if (projectId && error.code === 'PROJECT_DELETED') {
                    close();
                    res.end(`event: wake\nid: ${cursor}\ndata: ${JSON.stringify({ cursor, reset: true })}\n\n`);
                }
                else
                    close(true);
            }
        };
        const drain = () => { blocked = false; tick(); };
        const timer = setInterval(tick, 150);
        timer.unref();
        this.connections.add(close);
        req.on('aborted', onClose);
        res.on('close', onClose);
        res.on('error', onClose);
        res.on('drain', drain);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        tick();
    }
    close() { this.closed = true; for (const close of [...this.connections])
        close(true); }
}
//# sourceMappingURL=event-stream.js.map