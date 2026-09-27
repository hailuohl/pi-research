import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DomainError, ensure } from '../domain/errors.js';
export function stable(value) {
    if (Array.isArray(value))
        return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object')
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    return JSON.stringify(value) ?? 'null';
}
export const digest = (value) => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
export const now = () => new Date().toISOString();
export class Store {
    path;
    db;
    depth = 0;
    constructor(path) {
        this.path = path;
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        this.db = new DatabaseSync(path);
        this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,project_id TEXT,version INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
 CREATE INDEX IF NOT EXISTS records_project ON records(kind,project_id);
 CREATE TABLE IF NOT EXISTS operations(scope TEXT NOT NULL,key TEXT NOT NULL,hash TEXT NOT NULL,response TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(scope,key));
 CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,project_id TEXT,type TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS inbox(consumer TEXT NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(consumer,event_id));
 INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));`);
    }
    transaction(fn) {
        if (this.depth > 0)
            return fn();
        this.db.exec('BEGIN IMMEDIATE');
        this.depth++;
        try {
            const result = fn();
            ensure(!(result instanceof Promise), 'ASYNC_TRANSACTION', '事务回调必须同步', 500);
            this.db.exec('COMMIT');
            return result;
        }
        catch (e) {
            this.db.exec('ROLLBACK');
            throw e;
        }
        finally {
            this.depth--;
        }
    }
    create(kind, projectId, data, id = randomUUID()) { const time = now(); const row = { ...data, id, kind, projectId, version: 1, createdAt: time, updatedAt: time }; this.db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(kind, id, projectId, 1, JSON.stringify(row)); return row; }
    get(kind, id, projectId) {
        const r = this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind, id);
        if (!r)
            throw new DomainError('NOT_FOUND', `${kind} 不存在`, 404);
        const row = JSON.parse(r.data);
        if (projectId !== undefined && row.projectId !== projectId)
            throw new DomainError('SCOPE_DENIED', '不能访问其他项目的记录', 403);
        return row;
    }
    maybe(kind, id) {
        try {
            return this.get(kind, id);
        }
        catch (e) {
            if (e instanceof DomainError && e.code === 'NOT_FOUND')
                return;
            throw e;
        }
    }
    list(kind, projectId) { const rows = projectId === undefined ? this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY rowid').all(kind) : this.db.prepare('SELECT data FROM records WHERE kind=? AND project_id=? ORDER BY rowid').all(kind, projectId); return rows.map(x => JSON.parse(x.data)); }
    update(kind, id, version, patch) { const previous = this.get(kind, id); ensure(previous.version === version, 'VERSION_CONFLICT', '内容已更新，请刷新后重试'); const row = { ...previous, ...patch, id: previous.id, kind: previous.kind, projectId: previous.projectId, createdAt: previous.createdAt, updatedAt: now(), version: version + 1 }; const result = this.db.prepare('UPDATE records SET data=?,version=? WHERE kind=? AND id=? AND version=?').run(JSON.stringify(row), row.version, kind, id, version); ensure(result.changes === 1, 'VERSION_CONFLICT', '并发更新冲突'); return row; }
    event(projectId, type, payload) { const id = randomUUID(); const at = now(); const result = this.db.prepare('INSERT INTO events(id,project_id,type,payload,created_at) VALUES(?,?,?,?,?)').run(id, projectId, type, JSON.stringify(payload), at); return { seq: Number(result.lastInsertRowid), id, projectId, type, payload, createdAt: at }; }
    events(after = 0, projectId, limit = 500) { const rows = projectId === undefined ? this.db.prepare('SELECT * FROM events WHERE seq>? ORDER BY seq LIMIT ?').all(after, limit) : this.db.prepare('SELECT * FROM events WHERE seq>? AND project_id=? ORDER BY seq LIMIT ?').all(after, projectId, limit); return rows.map(r => ({ seq: Number(r.seq), id: r.id, projectId: r.project_id, type: r.type, payload: JSON.parse(r.payload), createdAt: r.created_at })); }
    consume(consumer, eventId, fn) {
        return this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM inbox WHERE consumer=? AND event_id=?').get(consumer, eventId))
                return false;
            fn();
            this.db.prepare('INSERT INTO inbox VALUES(?,?)').run(consumer, eventId);
            return true;
        });
    }
    operationResult(scope, key, input) {
        const old = this.db.prepare('SELECT hash,response FROM operations WHERE scope=? AND key=?').get(scope, key);
        if (!old)
            return { found: false };
        ensure(old.hash === digest(input), 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
        return { found: true, value: JSON.parse(old.response) };
    }
    /** v0.2 stored operations under lease generations. Reuse a unique historic result,
     * but never silently choose between already-duplicated side effects. */
    agentOperationResult(sessionId, key, input) {
        const scope = `agent:${sessionId}`;
        const rows = this.db.prepare("SELECT hash,response FROM operations WHERE key=? AND (scope=? OR substr(scope,1,?)=?)")
            .all(key, scope, scope.length + 1, scope + ':');
        if (!rows.length)
            return { found: false };
        ensure(rows.every(r => r.hash === digest(input)), 'IDEMPOTENCY_CONFLICT', '相同会话工具标识不能复用于不同请求');
        ensure(new Set(rows.map(r => digest(JSON.parse(r.response)))).size === 1, 'LEGACY_OPERATION_AMBIGUOUS', '旧版本已记录多个不同结果；请人工对账，禁止再次执行');
        return { found: true, value: JSON.parse(rows[0].response) };
    }
    operation(scope, key, input, fn) {
        ensure(typeof key === 'string' && key.length > 0 && key.length <= 200, 'OPERATION_ID_REQUIRED', '写操作需要 Idempotency-Key', 400);
        return this.transaction(() => {
            const hash = digest(input);
            const old = this.db.prepare('SELECT hash,response FROM operations WHERE scope=? AND key=?').get(scope, key);
            if (old) {
                ensure(old.hash === hash, 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                return JSON.parse(old.response);
            }
            const result = fn();
            this.db.prepare('INSERT INTO operations VALUES(?,?,?,?,?)').run(scope, key, hash, JSON.stringify(result), now());
            return result;
        });
    }
    close() { this.db.close(); }
}
//# sourceMappingURL=store.js.map