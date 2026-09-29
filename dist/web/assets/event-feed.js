import { api, eventStream } from "./api.js";
const validCursor = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
class ProjectEventFeed {
  constructor(projectId, apply, status) {
    this.projectId = projectId;
    this.apply = apply;
    this.status = status;
    this.cursor = 0;
    this.stopped = false;
    this.draining = false;
    this.pending = false;
    this.controller = new AbortController();
    this.backoff = 1e3;
    this.pageError = false;
    this.disconnected = true;
    try {
      const saved = Number(localStorage.getItem(this.key()));
      if (validCursor(saved)) this.cursor = saved;
    } catch {
    }
  }
  emitStatus() {
    if (!this.stopped) this.status(this.pageError ? "\u4E8B\u4EF6\u8865\u62C9\u6682\u4E0D\u53EF\u7528\uFF0C\u4ECD\u901A\u8FC7\u6743\u5A01\u5FEB\u7167\u6062\u590D\u3002" : this.disconnected ? "\u4E8B\u4EF6\u63A8\u9001\u5DF2\u65AD\u5F00\uFF1B\u81EA\u52A8\u91CD\u8FDE\uFF0C20 \u79D2\u5FEB\u7167\u515C\u5E95\u4ECD\u6709\u6548\u3002" : "");
  }
  key() {
    return `pi-research-events:${this.projectId}`;
  }
  start() {
    void this.connect();
    this.wake();
  }
  stop() {
    this.stopped = true;
    this.controller.abort();
    this.connection?.abort();
    clearTimeout(this.scheduled);
    clearTimeout(this.retry);
  }
  wake() {
    if (this.stopped) return;
    this.pending = true;
    if (this.draining || this.scheduled !== void 0) return;
    this.scheduled = setTimeout(() => {
      this.scheduled = void 0;
      void this.drain();
    }, 500);
  }
  async drain() {
    if (this.stopped || this.draining) return;
    this.draining = true;
    this.pending = false;
    let next = this.cursor, more = false, read = false, failed = false;
    try {
      try {
        for (let page = 0; page < 3; page++) {
          const result = await api(`/events?projectId=${encodeURIComponent(this.projectId)}&after=${next}&limit=200`, void 0, "GET", this.controller.signal);
          if (!validCursor(result.cursor) || !validCursor(result.latestCursor) || !result.reset && result.cursor < next) throw Error("\u4E8B\u4EF6\u6E38\u6807\u65E0\u6548");
          const prior = next;
          next = result.cursor;
          more = result.hasMore;
          read = true;
          if (!more || next === prior) break;
        }
        this.pageError = false;
        this.emitStatus();
      } catch {
        failed = true;
        this.pageError = true;
        this.emitStatus();
      }
      if (this.stopped) return;
      const applied = await this.apply().catch(() => false);
      if (this.stopped) return;
      if (applied && read) {
        this.cursor = next;
        try {
          localStorage.setItem(this.key(), String(next));
        } catch {
        }
      }
      if (more && applied && read && !failed) this.pending = true;
    } finally {
      this.draining = false;
      if (this.pending && !this.stopped) this.wake();
    }
  }
  async connect() {
    if (this.stopped) return;
    const connection = new AbortController();
    this.connection = connection;
    let idle;
    try {
      idle = setTimeout(() => connection.abort(), 4e4);
      const body = await eventStream(`/events/stream?projectId=${encodeURIComponent(this.projectId)}&after=${this.cursor}`, connection.signal);
      this.disconnected = false;
      this.emitStatus();
      this.backoff = 1e3;
      this.wake();
      const reader = body.getReader(), decoder = new TextDecoder();
      let buffer = "";
      try {
        while (!this.stopped) {
          const chunk = await reader.read();
          if (chunk.done) break;
          clearTimeout(idle);
          idle = setTimeout(() => connection.abort(), 4e4);
          buffer = (buffer + decoder.decode(chunk.value, { stream: true })).replace(/\r\n/g, "\n");
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            if (frame.split("\n").some((line) => line === "event:wake" || line === "event: wake")) this.wake();
          }
          if (buffer.length > 8192) throw Error("\u4E8B\u4EF6\u5524\u9192\u5E27\u8D85\u8FC7\u4E0A\u9650");
        }
      } finally {
        await reader.cancel().catch(() => {
        });
        reader.releaseLock();
      }
    } catch {
    } finally {
      clearTimeout(idle);
      if (!this.stopped) {
        this.disconnected = true;
        this.emitStatus();
        this.retry = setTimeout(() => void this.connect(), this.backoff);
        this.backoff = Math.min(2e4, this.backoff * 2);
      }
    }
  }
}
export {
  ProjectEventFeed
};
