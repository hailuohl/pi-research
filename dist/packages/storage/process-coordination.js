import { DatabaseSync } from 'node:sqlite';
import { hostname } from 'node:os';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { existsSync, lstatSync } from 'node:fs';
import { ensure } from '../domain/errors.js';
import { assertPhysicalDataRoot, loadDataPaths } from './data-paths.js';
const hostIdentity = `${process.platform}:${hostname()}`;
const tokens = new Map();
const permits = new WeakMap();
const canonical = (root) => process.platform === 'win32' ? resolve(root).toLowerCase() : resolve(root);
export function coordinationSchema(db) {
    db.exec(`CREATE TABLE IF NOT EXISTS normal_process_claims(process_token TEXT PRIMARY KEY,pid INTEGER NOT NULL,host_identity TEXT NOT NULL,role TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS maintenance_gate(id INTEGER PRIMARY KEY CHECK(id=1),owner_token TEXT NOT NULL,owner_pid INTEGER NOT NULL,host_identity TEXT NOT NULL,operation_id TEXT NOT NULL);`);
}
function alive(pid, host) { if (host !== hostIdentity || !Number.isSafeInteger(pid) || pid <= 0)
    return true; try {
    process.kill(pid, 0);
    return true;
}
catch (error) {
    return error.code !== 'ESRCH';
} }
/** Claims deliberately survive Store.close: filesystem work can outlive its SQLite connection. */
export function registerProcess(db, root, role = 'store') {
    const key = canonical(root), token = tokens.get(key) ?? randomUUID();
    db.exec('BEGIN IMMEDIATE');
    try {
        coordinationSchema(db);
        ensure(!db.prepare('SELECT 1 FROM maintenance_gate').get(), 'MAINTENANCE_ACTIVE', '数据目录正在离线维护；请等待维护完成或显式续清', 409);
        db.prepare('INSERT OR IGNORE INTO normal_process_claims VALUES(?,?,?,?)').run(token, process.pid, hostIdentity, role);
        db.exec('COMMIT');
        tokens.set(key, token);
        return token;
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
export function registerDataProcess(root, role) {
    assertPhysicalDataRoot(join(root, 'state.db'));
    ensure(existsSync(join(root, 'state.db')), 'NOT_FOUND', '数据目录尚未初始化', 404);
    const db = new DatabaseSync(join(root, 'state.db'));
    try {
        db.exec('PRAGMA busy_timeout=5000');
        loadDataPaths(db, root);
        return registerProcess(db, root, role);
    }
    finally {
        db.close();
    }
}
export function acquireMaintenance(db, root, operationId, resume, check) {
    assertPhysicalDataRoot(root);
    db.exec('BEGIN IMMEDIATE');
    try {
        coordinationSchema(db);
        const gate = db.prepare('SELECT * FROM maintenance_gate').get();
        if (gate) {
            ensure(resume && gate.operation_id === operationId, 'MAINTENANCE_RESUME_REQUIRED', '原维护未结束，必须续清同一计划');
            ensure(!alive(Number(gate.owner_pid), String(gate.host_identity)), 'MAINTENANCE_BUSY', '原维护进程仍活跃或身份无法证明已退出');
        }
        for (const claim of db.prepare('SELECT * FROM normal_process_claims').all()) {
            ensure(!alive(Number(claim.pid), String(claim.host_identity)), 'PURGE_PROCESS_BUSY', `普通进程仍占用数据目录：PID ${claim.pid} (${claim.role})`);
            db.prepare('DELETE FROM normal_process_claims WHERE process_token=?').run(String(claim.process_token));
        }
        check();
        const ownerToken = randomUUID();
        db.prepare('INSERT INTO maintenance_gate VALUES(1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET owner_token=excluded.owner_token,owner_pid=excluded.owner_pid,host_identity=excluded.host_identity,operation_id=excluded.operation_id').run(ownerToken, process.pid, hostIdentity, operationId);
        db.exec('COMMIT');
        const permit = { maintenance: true };
        const database = lstatSync(join(root, 'state.db'));
        permits.set(permit, { root: canonical(root), ownerToken, operationId, dbDev: database.dev, dbIno: database.ino });
        return permit;
    }
    catch (error) {
        db.exec('ROLLBACK');
        throw error;
    }
}
export function assertMaintenance(db, root, permit) {
    const proof = permits.get(permit);
    ensure(proof && proof.root === canonical(root), 'MAINTENANCE_DENIED', '缺少本进程维护许可');
    assertPhysicalDataRoot(join(root, 'state.db'));
    const database = lstatSync(join(root, 'state.db'));
    ensure(database.dev === proof.dbDev && database.ino === proof.dbIno, 'MAINTENANCE_LOST', '协调数据库身份改变');
    const gate = db.prepare('SELECT * FROM maintenance_gate WHERE id=1').get();
    ensure(gate && gate.owner_token === proof.ownerToken && gate.owner_pid === process.pid && gate.host_identity === hostIdentity && gate.operation_id === proof.operationId, 'MAINTENANCE_LOST', '离线维护许可已失效');
}
export function releaseMaintenance(db, root, permit) { assertMaintenance(db, root, permit); const proof = permits.get(permit); db.prepare('DELETE FROM maintenance_gate WHERE id=1 AND owner_token=?').run(proof.ownerToken); permits.delete(permit); }
/** Only an unpublished backup/restore copy may discard another machine's runtime claims. */
export function clearCopiedCoordination(db) { for (const table of ['normal_process_claims', 'maintenance_gate'])
    if (db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table))
        db.exec(`DELETE FROM ${table}`); }
//# sourceMappingURL=process-coordination.js.map