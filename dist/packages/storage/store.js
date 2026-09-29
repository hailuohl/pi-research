import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { DomainError, ensure } from '../domain/errors.js';
import { TextWriteRecovery } from '../workspace/text-write-recovery.js';
import { assertPhysicalDataRoot, loadDataPaths, readDataLocation, setDataLocation } from './data-paths.js';
export function stable(value) {
    if (Array.isArray(value))
        return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object')
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    return JSON.stringify(value) ?? 'null';
}
export const digest = (value) => createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
export const now = () => new Date().toISOString();
export const EVENT_PAYLOAD_BYTES = 64 * 1024, EVENT_PAGE_PAYLOAD_BYTES = 256 * 1024;
function rethrowComputeGate(error) {
    const message = error.message;
    for (const code of ['COMPUTE_TARGET_PROBE_REQUIRED', 'COMPUTE_TARGET_QUEUE_FULL', 'COMPUTE_QUEUE_FULL'])
        if (message.includes(code))
            throw new DomainError(code, code === 'COMPUTE_TARGET_PROBE_REQUIRED' ? '请先核对 Docker 目标身份' : code === 'COMPUTE_TARGET_QUEUE_FULL' ? '目标等待队列已满；如已更换引擎，请先重新核对' : '计算等待队列已满', 409);
    throw error;
}
export class Store {
    path;
    db;
    paths;
    depth = 0;
    reading = false;
    rollbackCallbacks = [];
    commitCallbacks = [];
    textWrites;
    constructor(path) {
        this.path = path;
        assertPhysicalDataRoot(dirname(path));
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
        this.db = new DatabaseSync(path);
        try {
            this.paths = loadDataPaths(this.db, dirname(path));
        }
        catch (error) {
            this.db.close();
            throw error;
        }
        this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,project_id TEXT,version INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
 CREATE INDEX IF NOT EXISTS records_project ON records(kind,project_id);
 CREATE TABLE IF NOT EXISTS operations(scope TEXT NOT NULL,key TEXT NOT NULL,hash TEXT NOT NULL,response TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(scope,key));
 CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,project_id TEXT,type TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS inbox(consumer TEXT NOT NULL,event_id TEXT NOT NULL,PRIMARY KEY(consumer,event_id));
 INSERT OR IGNORE INTO schema_migrations VALUES(1,datetime('now'));`);
        this.migrateComputeQueue();
        this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=4').get())
                return;
            this.db.exec(`CREATE INDEX IF NOT EXISTS events_project_sequence ON events(project_id,seq);
CREATE INDEX IF NOT EXISTS events_session_type_sequence ON events(project_id,json_extract(payload,'$.sessionId'),type,seq);
CREATE INDEX IF NOT EXISTS records_kind_session ON records(kind,json_extract(data,'$.sessionId'));
INSERT INTO schema_migrations VALUES(4,datetime('now'));`);
        });
        this.migrateDocumentQueue();
        this.migratePublicationQueue();
        this.migrateSshQueue();
        this.transaction(() => { if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=7').get())
            return; this.db.exec("CREATE INDEX records_session_catalog ON records(kind,project_id,json_extract(data,'$.role')) WHERE kind='session'; INSERT INTO schema_migrations VALUES(7,datetime('now'));"); });
        this.transaction(() => { if (!readDataLocation(this.db))
            setDataLocation(this.db, dirname(path)); this.db.exec("INSERT OR IGNORE INTO schema_migrations VALUES(9,datetime('now'));"); });
        this.transaction(() => { this.textWrites = new TextWriteRecovery(this.db, path); this.db.exec("INSERT OR IGNORE INTO schema_migrations VALUES(8,datetime('now'));"); });
        this.transaction(() => { });
    }
    migrateSshQueue() {
        this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=10').get())
                return;
            for (const name of ['compute_queue_insert_gate', 'compute_queue_update_gate', 'compute_queue_insert', 'compute_queue_update']) {
                const row = this.db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name=?").get(name);
                const sql = String(row.sql).replaceAll("THEN 'docker' ELSE 'trusted-example' END", "THEN 'docker' WHEN json_extract(r.data,'$.manifest.contract.runner')='ssh' THEN 'ssh' ELSE 'trusted-example' END")
                    .replaceAll("CASE WHEN r.kind='sandbox-job' THEN COALESCE", "CASE WHEN json_extract(r.data,'$.manifest.contract.runner')='ssh' THEN 'ssh:'||json_extract(r.data,'$.manifest.contract.sshTargetId') WHEN r.kind='sandbox-job' THEN COALESCE")
                    .replaceAll("CASE WHEN NEW.kind='sandbox-job' THEN COALESCE", "CASE WHEN json_extract(NEW.data,'$.manifest.contract.runner')='ssh' THEN 'ssh:'||json_extract(NEW.data,'$.manifest.contract.sshTargetId') WHEN NEW.kind='sandbox-job' THEN COALESCE");
                // Gate triggers use NEW instead of the SELECT alias r.
                const rewritten = name.endsWith('_gate') ? sql.replaceAll("json_extract(r.data,'$.manifest.contract.runner')='ssh'", "json_extract(NEW.data,'$.manifest.contract.runner')='ssh'") : sql;
                this.db.exec(`DROP TRIGGER ${name}`);
                this.db.exec(rewritten.replaceAll("END)='docker'", "END) IN ('docker','ssh')").replaceAll("q.backend='docker'", "q.backend IN ('docker','ssh')"));
            }
            this.db.exec("INSERT INTO schema_migrations VALUES(10,datetime('now'))");
        });
    }
    migratePublicationQueue() {
        this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=6').get())
                return;
            const context = "json_extract(r.data,'$.manifest.dockerContext')", phase = "json_extract(r.data,'$.state')";
            const columns = 'kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,target_id,generation,lease_until,source_version';
            const values = `'publication',r.id,r.project_id,'docker',${context},${phase},CASE WHEN ${phase} IN ('starting','running','unknown') THEN 1 ELSE 0 END,CAST(ROUND(json_extract(r.data,'$.manifest.resources.cpus')*1000) AS INTEGER),json_extract(r.data,'$.manifest.resources.memoryMb'),(SELECT target_id FROM compute_contexts WHERE context=${context}),COALESCE(json_extract(r.data,'$.generation'),0),COALESCE(json_extract(r.data,'$.leaseUntil'),0),r.version`;
            const active = `r.kind='publication-build-job' AND ${phase} IN ('queued','starting','running','unknown')`;
            const sync = `INSERT OR IGNORE INTO compute_contexts(context) SELECT ${context} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id;
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id
ON CONFLICT(kind,id) DO UPDATE SET phase=excluded.phase,held=excluded.held,generation=excluded.generation,lease_until=excluded.lease_until,source_version=excluded.source_version,
target_id=CASE WHEN compute_queue.bound=1 THEN compute_queue.target_id ELSE excluded.target_id END,
next_attempt_at=CASE WHEN excluded.phase='unknown' AND compute_queue.phase<>'unknown' THEN CAST(strftime('%s','now') AS INTEGER)*1000+5000 ELSE compute_queue.next_attempt_at END;`;
            const target = "(SELECT target_id FROM compute_contexts WHERE context=json_extract(NEW.data,'$.manifest.dockerContext'))";
            const gate = `SELECT CASE WHEN (SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') IS NOT NULL AND (SELECT count(*) FROM compute_queue WHERE phase='queued')>=(SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM compute_limits l WHERE l.target_id NOT IN ('host','host-example') AND json_extract(l.data,'$.maxQueued') IS NOT NULL AND (l.target_id=${target} OR ${target} IS NULL) AND (SELECT count(*) FROM compute_queue q WHERE q.phase='queued' AND (q.target_id=l.target_id OR q.backend='docker' AND q.bound=0))>=json_extract(l.data,'$.maxQueued')) THEN RAISE(ABORT,'COMPUTE_TARGET_QUEUE_FULL') END;`;
            this.db.exec(`INSERT OR IGNORE INTO compute_contexts(context) SELECT DISTINCT ${context} FROM records r WHERE ${active};
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE ${active} ORDER BY r.rowid;
CREATE TRIGGER publication_queue_insert_gate BEFORE INSERT ON records WHEN NEW.kind='publication-build-job' AND json_extract(NEW.data,'$.state')='queued' BEGIN ${gate} END;
CREATE TRIGGER publication_queue_update_gate BEFORE UPDATE ON records WHEN NEW.kind='publication-build-job' AND json_extract(NEW.data,'$.state')='queued' AND json_extract(OLD.data,'$.state')<>'queued' BEGIN ${gate} END;
CREATE TRIGGER publication_queue_insert AFTER INSERT ON records WHEN NEW.kind='publication-build-job' AND json_extract(NEW.data,'$.state') IN ('queued','starting','running','unknown') BEGIN ${sync} END;
CREATE TRIGGER publication_queue_update AFTER UPDATE ON records WHEN NEW.kind='publication-build-job' AND (EXISTS(SELECT 1 FROM compute_queue WHERE kind='publication' AND id=NEW.id) OR json_extract(NEW.data,'$.state') IN ('queued','starting','running','unknown')) BEGIN ${sync} END;
INSERT INTO schema_migrations VALUES(6,datetime('now'));`);
        });
    }
    migrateDocumentQueue() {
        this.transaction(() => {
            if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=5').get())
                return;
            const context = "json_extract(r.data,'$.manifest.dockerContext')", phase = "json_extract(r.data,'$.state')";
            const columns = 'kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,target_id,generation,lease_until,source_version';
            const values = `'document',r.id,r.project_id,'docker',${context},${phase},CASE WHEN ${phase} IN ('starting','running','cancelling','unknown') THEN 1 ELSE 0 END,CAST(ROUND(json_extract(r.data,'$.manifest.resources.cpus')*1000) AS INTEGER),json_extract(r.data,'$.manifest.resources.memoryMb'),(SELECT target_id FROM compute_contexts WHERE context=${context}),COALESCE(json_extract(r.data,'$.generation'),0),COALESCE(json_extract(r.data,'$.leaseUntil'),0),r.version`;
            const active = `r.kind='document-parse-job' AND ${phase} IN ('queued','starting','running','cancelling','unknown')`;
            const sync = `INSERT OR IGNORE INTO compute_contexts(context) SELECT ${context} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id;
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id
ON CONFLICT(kind,id) DO UPDATE SET phase=excluded.phase,held=excluded.held,generation=excluded.generation,lease_until=excluded.lease_until,source_version=excluded.source_version,
target_id=CASE WHEN compute_queue.bound=1 THEN compute_queue.target_id ELSE excluded.target_id END,
next_attempt_at=CASE WHEN excluded.phase='unknown' AND compute_queue.phase<>'unknown' THEN CAST(strftime('%s','now') AS INTEGER)*1000+5000 ELSE compute_queue.next_attempt_at END;`;
            const target = "(SELECT target_id FROM compute_contexts WHERE context=json_extract(NEW.data,'$.manifest.dockerContext'))";
            const gate = `SELECT CASE WHEN (SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') IS NOT NULL AND (SELECT count(*) FROM compute_queue WHERE phase='queued')>=(SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM compute_limits l WHERE l.target_id NOT IN ('host','host-example') AND json_extract(l.data,'$.maxQueued') IS NOT NULL AND (l.target_id=${target} OR ${target} IS NULL) AND (SELECT count(*) FROM compute_queue q WHERE q.phase='queued' AND (q.target_id=l.target_id OR q.backend='docker' AND q.bound=0))>=json_extract(l.data,'$.maxQueued')) THEN RAISE(ABORT,'COMPUTE_TARGET_QUEUE_FULL') END;`;
            this.db.exec(`CREATE INDEX records_kind_state ON records(kind,json_extract(data,'$.state'));
INSERT OR IGNORE INTO compute_contexts(context) SELECT DISTINCT ${context} FROM records r WHERE ${active};
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE ${active} ORDER BY r.rowid;
CREATE TRIGGER document_queue_insert_gate BEFORE INSERT ON records WHEN NEW.kind='document-parse-job' AND json_extract(NEW.data,'$.state')='queued' BEGIN ${gate} END;
CREATE TRIGGER document_queue_update_gate BEFORE UPDATE ON records WHEN NEW.kind='document-parse-job' AND json_extract(NEW.data,'$.state')='queued' AND json_extract(OLD.data,'$.state')<>'queued' BEGIN ${gate} END;
CREATE TRIGGER document_queue_insert AFTER INSERT ON records WHEN NEW.kind='document-parse-job' AND json_extract(NEW.data,'$.state') IN ('queued','starting','running','cancelling','unknown') BEGIN ${sync} END;
CREATE TRIGGER document_queue_update AFTER UPDATE ON records WHEN NEW.kind='document-parse-job' AND (EXISTS(SELECT 1 FROM compute_queue WHERE kind='document' AND id=NEW.id) OR json_extract(NEW.data,'$.state') IN ('queued','starting','running','cancelling','unknown')) BEGIN ${sync} END;
INSERT INTO schema_migrations VALUES(5,datetime('now'));`);
        });
    }
    migrateComputeQueue() {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            if (this.db.prepare('SELECT 1 FROM schema_migrations WHERE version=2').get()) {
                this.db.exec('COMMIT');
                return;
            }
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
            const backend = "CASE WHEN r.kind='sandbox-job' OR json_extract(r.data,'$.manifest.contract.runner')='docker' THEN 'docker' ELSE 'trusted-example' END";
            const context = "CASE WHEN r.kind='sandbox-job' THEN COALESCE(json_extract(r.data,'$.manifest.dockerContext'),'default') ELSE COALESCE(json_extract(r.data,'$.manifest.contract.dockerContext'),json_extract(r.data,'$.execution.dockerContext'),'default') END";
            const values = `CASE r.kind WHEN 'sandbox-job' THEN 'development' ELSE 'run' END,r.id,r.project_id,${backend},CASE WHEN (${backend})='docker' THEN ${context} ELSE NULL END,json_extract(r.data,'$.state'),CASE WHEN json_extract(r.data,'$.state') IN ('submitting','starting','running','cancelling','unknown') THEN 1 ELSE 0 END,
CAST(ROUND(COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.manifest.resources.cpus') ELSE json_extract(r.data,'$.manifest.contract.cpus') END,1)*1000) AS INTEGER),COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.manifest.resources.memoryMb') ELSE json_extract(r.data,'$.manifest.contract.memoryMb') END,256),
CASE WHEN (${backend})='trusted-example' THEN 'host-example' ELSE (SELECT target_id FROM compute_contexts WHERE context=${context}) END,NULL,NULL,CASE WHEN (${backend})='trusted-example' THEN 1 ELSE 0 END,
COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.generation') ELSE json_extract(r.data,'$.execution.generation') END,0),COALESCE(CASE r.kind WHEN 'sandbox-job' THEN json_extract(r.data,'$.leaseUntil') ELSE json_extract(r.data,'$.execution.leaseUntil') END,COALESCE(json_extract(r.data,'$.heartbeat'),0)+15000),r.version`;
            const columns = 'kind,id,project_id,backend,context_name,phase,held,cpu_millis,memory_mb,target_id,engine_id,endpoint,bound,generation,lease_until,source_version';
            const live = "r.kind IN ('run','sandbox-job') AND json_extract(r.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out')";
            this.db.exec(`INSERT OR IGNORE INTO compute_contexts(context) SELECT DISTINCT ${context} FROM records r WHERE ${live} AND (${backend})='docker';
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE ${live} ORDER BY r.rowid;`);
            const sync = `INSERT OR IGNORE INTO compute_contexts(context) SELECT ${context} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id AND (${backend})='docker';
INSERT INTO compute_queue(${columns}) SELECT ${values} FROM records r WHERE r.kind=NEW.kind AND r.id=NEW.id
ON CONFLICT(kind,id) DO UPDATE SET project_id=excluded.project_id,backend=excluded.backend,context_name=excluded.context_name,phase=excluded.phase,held=excluded.held,cpu_millis=excluded.cpu_millis,memory_mb=excluded.memory_mb,generation=excluded.generation,lease_until=excluded.lease_until,source_version=excluded.source_version,
target_id=CASE WHEN compute_queue.bound=1 THEN compute_queue.target_id ELSE excluded.target_id END,
next_attempt_at=CASE WHEN excluded.phase='unknown' AND compute_queue.phase<>'unknown' THEN CAST(strftime('%s','now') AS INTEGER)*1000+5000 ELSE compute_queue.next_attempt_at END;`;
            const newBackend = backend.replaceAll('r.kind', 'NEW.kind').replaceAll('r.data', 'NEW.data'), newContext = context.replaceAll('r.kind', 'NEW.kind').replaceAll('r.data', 'NEW.data');
            const newTarget = `CASE WHEN (${newBackend})='trusted-example' THEN 'host-example' ELSE (SELECT target_id FROM compute_contexts WHERE context=${newContext}) END`;
            const gate = `SELECT CASE WHEN (SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') IS NOT NULL AND (SELECT count(*) FROM compute_queue WHERE phase='queued')>=(SELECT json_extract(data,'$.maxQueued') FROM compute_limits WHERE target_id='host') THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM compute_limits l WHERE l.target_id<>'host' AND json_extract(l.data,'$.maxQueued') IS NOT NULL AND (l.target_id=(${newTarget}) OR (${newBackend})='docker' AND (${newTarget}) IS NULL AND l.target_id<>'host-example') AND (SELECT count(*) FROM compute_queue q WHERE q.phase='queued' AND (q.target_id=l.target_id OR l.target_id<>'host-example' AND q.backend='docker' AND q.bound=0))>=json_extract(l.data,'$.maxQueued')) THEN RAISE(ABORT,'COMPUTE_QUEUE_FULL') END;`;
            this.db.exec(`CREATE TRIGGER compute_queue_insert_gate BEFORE INSERT ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state')='queued' BEGIN ${gate} END;
CREATE TRIGGER compute_queue_update_gate BEFORE UPDATE ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state')='queued' AND json_extract(OLD.data,'$.state')<>'queued' BEGIN ${gate} END;
CREATE TRIGGER compute_queue_insert AFTER INSERT ON records WHEN NEW.kind IN ('run','sandbox-job') AND json_extract(NEW.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out') BEGIN ${sync} END;
CREATE TRIGGER compute_queue_update AFTER UPDATE ON records WHEN NEW.kind IN ('run','sandbox-job') AND (EXISTS(SELECT 1 FROM compute_queue WHERE id=NEW.id AND kind=CASE NEW.kind WHEN 'sandbox-job' THEN 'development' ELSE 'run' END) OR json_extract(NEW.data,'$.state') NOT IN ('succeeded','failed','cancelled','timed_out')) BEGIN ${sync} END;
INSERT INTO schema_migrations VALUES(2,datetime('now'));`);
            this.db.exec('COMMIT');
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
    onRollback(fn) { ensure(this.depth > 0, 'TRANSACTION_REQUIRED', '回滚处理必须绑定事务', 500); this.rollbackCallbacks.push(fn); }
    afterCommit(fn) { ensure(this.depth > 0, 'TRANSACTION_REQUIRED', '提交处理必须绑定事务', 500); this.commitCallbacks.push(fn); }
    transaction(fn) {
        ensure(!this.reading, 'READ_ONLY_TRANSACTION', '只读快照中不能开启写事务', 500);
        if (this.depth > 0)
            return fn();
        this.db.exec('BEGIN IMMEDIATE');
        this.depth++;
        let committed = false;
        try {
            this.textWrites?.recover();
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
                try {
                    rollback();
                }
                catch {
                    recoveryFailed = true;
                }
            }
            this.db.exec('ROLLBACK');
            if (recoveryFailed)
                throw new DomainError('TRANSACTION_RECOVERY_FAILED', '数据库已回滚，但文件恢复未完成；保留的工作副本需要检查，禁止盲目重试', 500);
            throw e;
        }
        finally {
            this.textWrites?.release();
            this.depth--;
            const afterCommit = this.commitCallbacks;
            this.rollbackCallbacks = [];
            this.commitCallbacks = [];
            if (committed) {
                let cleanupFailed = false;
                for (const callback of afterCommit) {
                    try {
                        callback();
                    }
                    catch {
                        cleanupFailed = true;
                    }
                }
                if (cleanupFailed)
                    throw new DomainError('POST_COMMIT_CLEANUP_FAILED', '操作已提交，但临时文件清理未完成；可用原幂等键回查结果', 500);
            }
        }
    }
    /** Consistent synchronous reads without reserving SQLite's writer lock. */
    readSnapshot(fn) {
        const invoke = () => { const result = fn(); ensure(!(result instanceof Promise), 'ASYNC_TRANSACTION', '读快照回调必须同步', 500); return result; };
        if (this.db.isTransaction)
            return invoke();
        const queryOnly = Number(this.db.prepare('PRAGMA query_only').get().query_only);
        this.db.exec('PRAGMA query_only=ON; BEGIN');
        this.reading = true;
        try {
            const result = invoke();
            this.db.exec('COMMIT');
            return result;
        }
        catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
        finally {
            this.reading = false;
            this.db.exec(`PRAGMA query_only=${queryOnly ? 'ON' : 'OFF'}`);
        }
    }
    create(kind, projectId, data, id = randomUUID()) { const time = now(); const row = { ...data, id, kind, projectId, version: 1, createdAt: time, updatedAt: time }; try {
        this.db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(kind, id, projectId, 1, JSON.stringify(row));
    }
    catch (error) {
        rethrowComputeGate(error);
    } return row; }
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
    update(kind, id, version, patch) { const previous = this.get(kind, id); ensure(previous.version === version, 'VERSION_CONFLICT', '内容已更新，请刷新后重试'); const row = { ...previous, ...patch, id: previous.id, kind: previous.kind, projectId: previous.projectId, createdAt: previous.createdAt, updatedAt: now(), version: version + 1 }; try {
        const result = this.db.prepare('UPDATE records SET data=?,version=? WHERE kind=? AND id=? AND version=?').run(JSON.stringify(row), row.version, kind, id, version);
        ensure(result.changes === 1, 'VERSION_CONFLICT', '并发更新冲突');
    }
    catch (error) {
        rethrowComputeGate(error);
    } return row; }
    event(projectId, type, payload) { const id = randomUUID(); const at = now(); const result = this.db.prepare('INSERT INTO events(id,project_id,type,payload,created_at) VALUES(?,?,?,?,?)').run(id, projectId, type, JSON.stringify(payload), at); return { seq: Number(result.lastInsertRowid), id, projectId, type, payload, createdAt: at }; }
    events(after = 0, projectId, limit = 500) { const rows = projectId === undefined ? this.db.prepare('SELECT * FROM events WHERE seq>? ORDER BY seq LIMIT ?').all(after, limit) : this.db.prepare('SELECT * FROM events WHERE seq>? AND project_id=? ORDER BY seq LIMIT ?').all(after, projectId, limit); return rows.map(r => ({ seq: Number(r.seq), id: r.id, projectId: r.project_id, type: r.type, payload: JSON.parse(r.payload), createdAt: r.created_at })); }
    eventCursor(projectId) { return Number((projectId === undefined ? this.db.prepare('SELECT COALESCE(max(seq),0) cursor FROM events').get() : this.db.prepare('SELECT COALESCE(max(seq),0) cursor FROM events WHERE project_id=?').get(projectId)).cursor); }
    eventPage(after = 0, projectId, limit = 200) {
        ensure(Number.isSafeInteger(after) && after >= 0, 'INVALID_INPUT', '事件游标必须是非负安全整数', 400);
        ensure(Number.isSafeInteger(limit) && limit >= 1 && limit <= 500, 'INVALID_INPUT', '事件页大小必须为1–500', 400);
        return this.readSnapshot(() => {
            const latestCursor = this.eventCursor(projectId);
            if (after > latestCursor)
                return { items: [], cursor: latestCursor, hasMore: false, latestCursor, reset: true };
            const columns = `seq,id,project_id,type,created_at,length(CAST(payload AS BLOB)) payload_bytes,CASE WHEN length(CAST(payload AS BLOB))<=${EVENT_PAYLOAD_BYTES} THEN payload ELSE NULL END payload`;
            const rows = projectId === undefined ? this.db.prepare(`SELECT ${columns} FROM events WHERE seq>? AND seq<=? ORDER BY seq LIMIT ?`).iterate(after, latestCursor, limit + 1) : this.db.prepare(`SELECT ${columns} FROM events WHERE project_id=? AND seq>? AND seq<=? ORDER BY seq LIMIT ?`).iterate(projectId, after, latestCursor, limit + 1);
            let bytes = 0, hasMore = false;
            const items = [];
            for (const row of rows) {
                if (items.length === limit) {
                    hasMore = true;
                    break;
                }
                const size = Number(row.payload_bytes), omitted = row.payload === null || bytes + size > EVENT_PAGE_PAYLOAD_BYTES;
                if (!omitted)
                    bytes += size;
                items.push({ seq: Number(row.seq), id: String(row.id), projectId: row.project_id === null ? null : String(row.project_id), type: String(row.type), payload: omitted ? null : JSON.parse(row.payload), createdAt: String(row.created_at), ...(omitted ? { omitted: true, payloadBytes: size } : {}) });
            }
            return { items, cursor: items.at(-1)?.seq ?? after, hasMore, latestCursor, reset: false };
        });
    }
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