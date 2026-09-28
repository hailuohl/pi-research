import { api, eventStream } from './api.js';
const validCursor = (value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
/** Wake frames never acknowledge delivery; only a successfully applied snapshot advances GET's cursor. */
export class ProjectEventFeed {
    emitStatus() { if (!this.stopped)
        this.status(this.pageError ? '事件补拉暂不可用，仍通过权威快照恢复。' : this.disconnected ? '事件推送已断开；自动重连，20 秒快照兜底仍有效。' : ''); }
    constructor(projectId, apply, status) {
        this.projectId = projectId;
        this.apply = apply;
        this.status = status;
        this.cursor = 0;
        this.stopped = false;
        this.draining = false;
        this.pending = false;
        this.controller = new AbortController();
        this.backoff = 1000;
        this.pageError = false;
        this.disconnected = true;
        try {
            const saved = Number(localStorage.getItem(this.key()));
            if (validCursor(saved))
                this.cursor = saved;
        }
        catch { }
    }
    key() { return `pi-research-events:${this.projectId}`; }
    start() { void this.connect(); this.wake(); }
    stop() { this.stopped = true; this.controller.abort(); this.connection?.abort(); clearTimeout(this.scheduled); clearTimeout(this.retry); }
    wake() { if (this.stopped)
        return; this.pending = true; if (this.draining || this.scheduled !== undefined)
        return; this.scheduled = setTimeout(() => { this.scheduled = undefined; void this.drain(); }, 500); }
    async drain() {
        if (this.stopped || this.draining)
            return;
        this.draining = true;
        this.pending = false;
        let next = this.cursor, more = false, read = false, failed = false;
        try {
            try {
                for (let page = 0; page < 3; page++) {
                    const result = await api(`/events?projectId=${encodeURIComponent(this.projectId)}&after=${next}&limit=200`, undefined, 'GET', this.controller.signal);
                    if (!validCursor(result.cursor) || !validCursor(result.latestCursor) || (!result.reset && result.cursor < next))
                        throw Error('事件游标无效');
                    const prior = next;
                    next = result.cursor;
                    more = result.hasMore;
                    read = true;
                    if (!more || next === prior)
                        break;
                }
                this.pageError = false;
                this.emitStatus();
            }
            catch {
                failed = true;
                this.pageError = true;
                this.emitStatus();
            }
            if (this.stopped)
                return;
            const applied = await this.apply().catch(() => false);
            if (this.stopped)
                return;
            if (applied && read) {
                this.cursor = next;
                try {
                    localStorage.setItem(this.key(), String(next));
                }
                catch { }
            }
            if (more && applied && read && !failed)
                this.pending = true;
        }
        finally {
            this.draining = false;
            if (this.pending && !this.stopped)
                this.wake();
        }
    }
    async connect() {
        if (this.stopped)
            return;
        const connection = new AbortController();
        this.connection = connection;
        let idle;
        try {
            idle = setTimeout(() => connection.abort(), 40000);
            const body = await eventStream(`/events/stream?projectId=${encodeURIComponent(this.projectId)}&after=${this.cursor}`, connection.signal);
            this.disconnected = false;
            this.emitStatus();
            this.backoff = 1000;
            this.wake();
            const reader = body.getReader(), decoder = new TextDecoder();
            let buffer = '';
            try {
                while (!this.stopped) {
                    const chunk = await reader.read();
                    if (chunk.done)
                        break;
                    clearTimeout(idle);
                    idle = setTimeout(() => connection.abort(), 40000);
                    buffer = (buffer + decoder.decode(chunk.value, { stream: true })).replace(/\r\n/g, '\n');
                    let boundary;
                    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
                        const frame = buffer.slice(0, boundary);
                        buffer = buffer.slice(boundary + 2);
                        if (frame.split('\n').some(line => line === 'event:wake' || line === 'event: wake'))
                            this.wake();
                    }
                    if (buffer.length > 8192)
                        throw Error('事件唤醒帧超过上限');
                }
            }
            finally {
                await reader.cancel().catch(() => { });
                reader.releaseLock();
            }
        }
        catch { /* A disconnected wake channel never discards a successful authoritative snapshot. */ }
        finally {
            clearTimeout(idle);
            if (!this.stopped) {
                this.disconnected = true;
                this.emitStatus();
                this.retry = setTimeout(() => void this.connect(), this.backoff);
                this.backoff = Math.min(20000, this.backoff * 2);
            }
        }
    }
}
