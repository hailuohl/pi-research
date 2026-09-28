import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DomainError, ensure } from '../domain/errors.js';
import type { Row } from '../domain/types.js';
export function stable(value: unknown): string {
    if (Array.isArray(value))
        return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object')
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable((value as Record<string, unknown>)[k])).join(',') + '}';
    return JSON.stringify(value) ?? 'null';
}
export const digest = (value: unknown) => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
export const now = () => new Date().toISOString();
function rethrowComputeGate(error:unknown):never {
    const message=(error as Error).message;
    for(const code of ['COMPUTE_TARGET_PROBE_REQUIRED','COMPUTE_TARGET_QUEUE_FULL','COMPUTE_QUEUE_FULL'])if(message.includes(code))throw new DomainError(code,code==='COMPUTE_TARGET_PROBE_REQUIRED'?'请先核对 Docker 目标身份':code==='COMPUTE_TARGET_QUEUE_FULL'?'目标等待队列已满；如已更换引擎，请先重新核对':'计算等待队列已满',409);
    throw error;
}
export class Store {
    readonly db: DatabaseSync;
    private depth = 0;
    private rollbackCallbacks: Array<() => void> = [];
    private commitCallbacks: Array<() => void> = [];
    constructor(public path: string) {
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
        this.migrateComputeQueue();
    }
    private migrateComputeQueue() {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            if(this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=2').get()){this.db.exec('COMMIT');return;}
            this.db.exec(`CREATE TABLE compute_limits(target_id TEXT PRIMARY KEY,version INTEGER NOT NULL,data TEXT NOT NULL);
INSERT INTO compute_limits VALUES('host',1,'{"maxRuns":1,"maxDevelopment":1,"maxJobs":2,"cpus":null,"memoryMb":null,"maxQueued":null}');
CREATE TABLE compute_contexts(context TEXT PRIMARY KEY,target_id TEXT,engine_id TEXT,endpoint TEXT,status TEXT NOT NULL DEFAULT 'unresolved',next_probe_at INTEGER NOT NULL DEFAULT 0,probe_until INTEGER NOT NULL DEFAULT 0,failures INTEGER NOT NULL DEFAULT 0,last_error TEXT);
CREATE TABLE compute_queue(sequence INTEGER PRIMARY KEY AUTOINCREMENT,kind TEXT NOT NULL,id TEXT NOT NULL,project_id TEXT NOT NULL,backend TEXT NOT NULL,context_name TEXT,phase TEXT NOT NULL,held INTEGER NOT NULL,cpu_millis INTEGER NOT NULL,memory_mb INTEGER NOT NULL,target_id TEXT,engine_id TEXT,endpoint TEXT,bound INTEGER NOT NULL DEFAULT 0,generation INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,next_attempt_at INTEGER NOT NULL DEFAULT 0,last_error TEXT,source_version INTEGER NOT NULL,UNIQUE(kind,id));
CREATE INDEX compute_queue_phase_sequence ON compute_queue(phase,sequence);
CREATE INDEX compute_queue_kind_phase_sequence ON compute_queue(kind,phase,sequence);
CREATE INDEX compute_queue_target_phase_sequence ON compute_queue(target_id,phase,sequence);
CREATE INDEX compute_queue_recovery ON compute_queue(kind,held,next_attempt_at,lease_until);
CREATE INDEX compute_queue_occupancy ON compute_queue(held,target_id,kind);
CREATE INDEX compute_queue_project_sequence ON compute_queue(project_id,sequence);
CREATE INDEX compute_queue_context ON compute_queue(context_name,phase);
CREATE INDEX compute_context_probe ON compute_contexts(next_probe_at,probe_until);`);
            const backend="CASE WHEN r.kind='sandbox-job' OR json_extract(r.data,'$.manifest.contract.runner')='docker' THEN 'docker' ELSE 'trusted-example' END";
            const context="CASE WHEN r.kind='sandbox-job' THEN COALESCE(json_extract(r.data,'$.manifest.dockerContext'),'default') ELSE COALESCE(json_extract(r.data,'$.manifest.contract.dockerContext'),json_extract(r.data,'$.execution.dockerContext'),'default') END";
            const values=`CASE r.kind WHEN 'sandbox-job' THEN 'development' ELSE 'run' END,r.id,r.project_id,${backend},CASE WHEN (${backend})='docker' THEN ${context} ELSE NULL END,json_extract(r.data,'$.state'),CASE WHEN json_extract(r.data,'$.state') IN ('submitting','starting','running','cancelling','unknown') THEN 1 ELSE 0 END,
CAST(ROUND(COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.manifest.resources.cpus') ELSE json_extract(r.data,'$.manifest.contract.cpus') END,1)*1000) AS INTEGER),COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.manifest.resources.memoryMb') ELSE json_extract(r.data,'$.manifest.contract.memoryMb') END,256),
CASE WHEN (${backend})='trusted-example' THEN 'host-example' ELSE (SELECT target_id FROM compute_contexts WHERE context=${context}) END,NULL,NULL,CASE WHEN (${backend})='trusted-example' THEN 1 ELSE 0 END,
COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.generation') ELSE json_extract(r.data,'$.execution.generation') END,0),COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.leaseUntil') ELSE json_extract(r.data,'$.execution.leaseUntil') END,COALESCE(json_extract(r.data,'$.heartbeat'),0)+15000),r.version`;
            const columns='kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,target_id,engine_id,endpoint,bound,generation,lease_until,source_version';
            const live="r.kind IN ('run','sandbox-job') AND json_extract(r.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out')";
            this.db.exec(`INSERT OR IGNORE INTO compute_contexts(context) SELECT DISTINCT ${context} FROM records r WHERE ${live} AND (${backend})='docker';
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE ${live} ORDER BY r.rowid;`);
            const sync=`INSERT OR IGNORE INTO compute_contexts(context) SELECT ${context} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id AND (${backend})='docker';
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id
ON CONFLICT(kind,id) DO UPDATE SET project_id=excluded.project_id,backend=excluded.backend,context_name=excluded.context_name,phase=excluded.phase,held=excluded.held,cpu_millis=excluded.cpu_millis,memory_mb=excluded.memory_mb,generation=excluded.generation,lease_until=excluded.lease_until,source_version=excluded.source_version,
target_id=CASE WHEN compute_queue.bound=1 THEN compute_queue.target_id ELSE excluded.target_id END,
next_attempt_at=CASE WHEN excluded.phase='unknown' AND compute_queue.phase<>'unknown' THEN CAST(strftime('%s','now') AS INTEGER)*1000+5000 ELSE compute_queue.next_attempt_at END;`;
            const newBackend=backend.replaceAll('r.kind','NEW.kind').replaceAll('r.data','NEW.data'),newContext=context.replaceAll('r.kind','NEW.kind').replaceAll('r.data','NEW.data');
            const newTarget=`CASE WHEN (${newBackend})='trusted-example' THEN 'host-example' ELSE (SELECT target_id FROM compute_contexts WHERE context=${newContext}) END`;
            const gate=`SELECT CASE WHEN (SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') IS NOT NULL AND (SELECT count(*) FROM compute_queue WHERE phase='queued')>=(SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM compute_limits l WHERE l.target_id<>'host' AND json_extract(l.data,'$.maxQueued') IS NOT NULL AND (l.target_id=(${newTarget}) OR (${newBackend})='docker' AND (${newTarget}) IS NULL AND l.target_id<>'host-example') AND (SELECT count(*) FROM compute_queue q WHERE q.phase='queued' AND (q.target_id=l.target_id OR l.target_id<>'host-example' AND q.backend='docker' AND q.bound=0))>=json_extract(l.data,'$.maxQueued')) THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;`;
            this.db.exec(`CREATE TRIGGER compute_queue_insert_gate BEFORE INSERT ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state')='queued' BEGIN ${gate} END;
CREATE TRIGGER compute_queue_update_gate BEFORE UPDATE ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state')='queued' AND json_extract(OLD.data,'$.state')<>'queued' BEGIN ${gate} END;
CREATE TRIGGER compute_queue_insert AFTER INSERT ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out') BEGIN ${sync} END;
CREATE TRIGGER compute_queue_update AFTER UPDATE ON records WHEN NEW.kind IN ('run','sandbox-job') AND (EXISTS(SELECT 1 FROM compute_queue WHERE id=NEW.id AND kind=CASE NEW.kind WHEN 'sandbox-job' THEN 'development' ELSE 'run' END) OR json_extract(NEW.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out')) BEGIN ${sync} END;
INSERT INTO schema_migrations VALUES(2,datetime('now'));`);
            this.db.exec('COMMIT');
        }catch(error){this.db.exec('ROLLBACK');throw error;}
    }
    onRollback(fn: () => void) { ensure(this.depth > 0, 'TRANSACTION_REQUIRED', '回滚处理必须绑定事务', 500); this.rollbackCallbacks.push(fn); }
    afterCommit(fn: () => void) { ensure(this.depth > 0, 'TRANSACTION_REQUIRED', '提交处理必须绑定事务', 500); this.commitCallbacks.push(fn); }
    transaction<T>(fn: () => T): T {
        if (this.depth > 0)
            return fn();
        this.db.exec('BEGIN IMMEDIATE');
        this.depth++;
        let committed = false;
        try {
            const result = fn();
            ensure(!(result instanceof Promise), 'ASYNC_TRANSACTION', '事务回调必须同步', 500);
            this.db.exec('COMMIT');
            committed = true;
            return result;
        }
        catch (e) {
            let recoveryFailed = false;
            // Keep the writer lock until filesystem compensation has finished.
            for (const rollback of [...this.rollbackCallbacks].reverse()) {
                try { rollback(); } catch { recoveryFailed = true; }
            }
            this.db.exec('ROLLBACK');
            if (recoveryFailed) throw new DomainError('TRANSACTION_RECOVERY_FAILED', '数据库已回滚，但文件恢复未完成；保留的工作副本需要检查，禁止盲目重试', 500);
            throw e;
        }
        finally {
            this.depth--;
            const afterCommit = this.commitCallbacks;
            this.rollbackCallbacks = [];
            this.commitCallbacks = [];
            if (committed) {
                let cleanupFailed = false;
                for (const callback of afterCommit) { try { callback(); } catch { cleanupFailed = true; } }
                if (cleanupFailed) throw new DomainError('POST_COMMIT_CLEANUP_FAILED', '操作已提交，但临时文件清理未完成；可用原幂等键回查结果', 500);
            }
        }
    }
    create<T extends object>(kind: string, projectId: string | null, data: T, id: string = randomUUID()): Row<T> { const time = now(); const row = { ...data, id, kind, projectId, version: 1, createdAt: time, updatedAt: time } as Row<T>;try{this.db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(kind, id, projectId, 1, JSON.stringify(row));}catch(error){rethrowComputeGate(error);}return row; }
    get<T = Record<string, unknown>>(kind: string, id: string, projectId?: string): Row<T> {
        const r = this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind, id);
        if (!r)
            throw new DomainError('NOT_FOUND', `${kind} 不存在`, 404);
        const row = JSON.parse(r.data as string) as Row<T>;
        if (projectId !== undefined && row.projectId !== projectId)
            throw new DomainError('SCOPE_DENIED', '不能访问其他项目的记录', 403);
        return row;
    }
    maybe<T = Record<string, unknown>>(kind: string, id: string): Row<T> | undefined {
        try {
            return this.get<T>(kind, id);
        }
        catch (e) {
            if (e instanceof DomainError && e.code === 'NOT_FOUND')
                return;
            throw e;
        }
    }
    list<T = Record<string, unknown>>(kind: string, projectId?: string): Row<T>[] { const rows = projectId === undefined ? this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY rowid').all(kind) : this.db.prepare('SELECT data FROM records WHERE kind=? AND project_id=? ORDER BY rowid').all(kind, projectId); return rows.map(x => JSON.parse(x.data as string) as Row<T>); }
    update<T extends object>(kind: string, id: string, version: number, patch: Partial<T>): Row<T> { const previous = this.get<T>(kind, id); ensure(previous.version === version, 'VERSION_CONFLICT', '内容已更新，请刷新后重试'); const row = { ...previous, ...patch, id: previous.id, kind: previous.kind, projectId: previous.projectId, createdAt: previous.createdAt, updatedAt: now(), version: version + 1 };try{const result = this.db.prepare('UPDATE records SET data=?,version=? WHERE kind=? AND id=? AND version=?').run(JSON.stringify(row), row.version, kind, id, version);ensure(result.changes === 1, 'VERSION_CONFLICT', '并发更新冲突');}catch(error){rethrowComputeGate(error);}return row; }
    event(projectId: string | null, type: string, payload: unknown) { const id = randomUUID(); const at = now(); const result = this.db.prepare('INSERT INTO events(id,project_id,type,payload,created_at) VALUES(?,?,?,?,?)').run(id, projectId, type, JSON.stringify(payload), at); return { seq: Number(result.lastInsertRowid), id, projectId, type, payload, createdAt: at }; }
    events(after = 0, projectId?: string, limit = 500) { const rows = projectId === undefined ? this.db.prepare('SELECT * FROM events WHERE seq>? ORDER BY seq LIMIT ?').all(after, limit) : this.db.prepare('SELECT * FROM events WHERE seq>? AND project_id=? ORDER BY seq LIMIT ?').all(after, projectId, limit); return rows.map(r => ({ seq: Number(r.seq), id: r.id, projectId: r.project_id, type: r.type, payload: JSON.parse(r.payload as string), createdAt: r.created_at })); }
    consume(consumer: string, eventId: string, fn: () => void) {
        return this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM inbox WHERE consumer=? AND event_id=?').get(consumer, eventId))
                return false;
            fn();
            this.db.prepare('INSERT INTO inbox VALUES(?,?)').run(consumer, eventId);
            return true;
        });
    }
    operationResult<T>(scope: string, key: string, input: unknown): {
        found: false;
    } | {
        found: true;
        value: T;
    } {
        const old = this.db.prepare('SELECT hash,response FROM operations WHERE scope=? AND key=?').get(scope, key);
        if (!old)
            return { found: false };
        ensure(old.hash === digest(input), 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
        return { found: true, value: JSON.parse(old.response as string) as T };
    }
    /** v0.2 stored operations under lease generations. Reuse a unique historic result,
     * but never silently choose between already-duplicated side effects. */
    agentOperationResult<T>(sessionId: string, key: string, input: unknown): {found: false} | {found: true; value: T} {
        const scope = `agent:${sessionId}`;
        const rows = this.db.prepare("SELECT hash,response FROM operations WHERE key=? AND (scope=? OR substr(scope,1,?)=?)")
            .all(key, scope, scope.length + 1, scope + ':');
        if (!rows.length) return {found: false};
        ensure(rows.every(r => r.hash === digest(input)), 'IDEMPOTENCY_CONFLICT', '相同会话工具标识不能复用于不同请求');
        ensure(new Set(rows.map(r => digest(JSON.parse(r.response as string)))).size === 1,
            'LEGACY_OPERATION_AMBIGUOUS', '旧版本已记录多个不同结果；请人工对账，禁止再次执行');
        return {found: true, value: JSON.parse(rows[0].response as string) as T};
    }
    operation<T>(scope: string, key: string, input: unknown, fn: () => T): T {
        ensure(typeof key === 'string' && key.length > 0 && key.length <= 200, 'OPERATION_ID_REQUIRED', '写操作需要 Idempotency-Key', 400);
        return this.transaction(() => {
            const hash = digest(input);
            const old = this.db.prepare('SELECT hash,response FROM operations WHERE scope=? AND key=?').get(scope, key);
            if (old) {
                ensure(old.hash === hash, 'IDEMPOTENCY_CONFLICT', '相同幂等键不能用于不同请求');
                return JSON.parse(old.response as string) as T;
            }
            const result = fn();
            this.db.prepare('INSERT INTO operations VALUES(?,?,?,?,?)').run(scope, key, hash, JSON.stringify(result), now());
            return result;
        });
    }
    close() { this.db.close(); }
}
