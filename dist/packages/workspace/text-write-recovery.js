import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { chmodSync, closeSync, constants, existsSync, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { ensure } from '../domain/errors.js';
import { readStableFile } from './stable-file.js';
import { MAX_TEXT_BYTES } from './files.js';
const active = new Map();
const marker = (root) => resolve(root) + '.text-write-pending';
export function assertTextWriteSettled(root) {
    ensure(active.has(resolve(root)) || !existsSync(marker(root)), 'TEXT_WRITE_RECOVERY_CONFLICT', '工作区有未完成的文本写入恢复；请保留恢复数据并检查外部文件修改', 409);
}
const identity = (path) => { const s = lstatSync(path); ensure(s.isDirectory() && !s.isSymbolicLink(), 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复目录已被替换', 409); return `${s.dev}:${s.ino}:${s.birthtimeMs}`; };
function plainFile(path) { try {
    ensure(lstatSync(path).isFile() && !lstatSync(path).isSymbolicLink(), 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复文件不是普通文件', 409);
}
catch (error) {
    if (error.code !== 'ENOENT')
        throw error;
} }
const fileStatIdentity = (s) => `${s.dev}:${s.ino}:${s.birthtimeMs}:${s.mode}:${s.mtimeMs}`;
function fileIdentity(path) { plainFile(path); if (!existsSync(path))
    return null; return fileStatIdentity(lstatSync(path)); }
const sameFile = (a, b) => a.isFile() && b.isFile() && !a.isSymbolicLink() && !b.isSymbolicLink() && a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mode === b.mode && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
/** Compare live bytes without allocating the live file, including during legacy-journal recovery. */
function matchesBytes(path, expected, expectedIdentity, expectedMode) {
    if (!existsSync(path))
        return expected === null && expectedIdentity === null;
    if (expected === null)
        return false;
    plainFile(path);
    const before = lstatSync(path);
    if (before.size !== expected.length)
        return false;
    const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const opened = fstatSync(fd);
        if (!sameFile(opened, before))
            return false;
        const block = Buffer.alloc(Math.min(64 * 1024, expected.length + 1));
        let offset = 0;
        while (offset < expected.length) {
            const n = readSync(fd, block, 0, Math.min(block.length, expected.length - offset), offset);
            if (!n || !block.subarray(0, n).equals(expected.subarray(offset, offset + n)))
                return false;
            offset += n;
        }
        if (readSync(fd, block, 0, 1, offset) !== 0)
            return false;
        const after = fstatSync(fd), named = lstatSync(path);
        return sameFile(after, opened) && sameFile(named, after) && fileStatIdentity(named) === expectedIdentity && (expectedMode === undefined || (named.mode & 0o777) === expectedMode);
    }
    finally {
        closeSync(fd);
    }
}
export function captureWritePreimage(root, path, metadata = false) {
    root = resolve(root);
    const target = metadata ? root + '.source-modes.json' : resolve(root, path), parents = [];
    let parent = metadata ? root : dirname(target);
    while (true) {
        if (existsSync(parent))
            parents.push({ path: parent, identity: identity(parent) });
        if (parent === dirname(root))
            break;
        const next = dirname(parent);
        ensure(next !== parent, 'PATH_DENIED', '写入路径越界', 403);
        parent = next;
    }
    const beforeIdentity = fileIdentity(target), bytes = beforeIdentity === null ? null : readStableFile(dirname(target), basename(target), metadata ? 8 * 1024 * 1024 : MAX_TEXT_BYTES), mode = beforeIdentity === null ? 0o600 : lstatSync(target).mode & 0o777;
    ensure(fileIdentity(target) === beforeIdentity, 'FILE_VERSION_CONFLICT', '读取期间文件已变化', 409);
    return { bytes, identity: beforeIdentity, mode, parents };
}
function durable(path, bytes, mode = 0o600) {
    const tmp = path + '.tmp-' + randomUUID();
    try {
        const fd = openSync(tmp, 'wx', mode);
        try {
            writeFileSync(fd, bytes);
            fsyncSync(fd);
        }
        finally {
            closeSync(fd);
        }
        renameSync(tmp, path);
    }
    finally {
        if (existsSync(tmp))
            unlinkSync(tmp);
    }
}
/** A text-write undo log only. SQLite's writer lock owns every journal transition. */
export class TextWriteRecovery {
    db;
    directory;
    dataRoot;
    key;
    current;
    conflicts = [];
    constructor(db, path) {
        this.db = db;
        this.directory = resolve(path) + '.text-writes';
        this.dataRoot = resolve(dirname(path));
        db.exec('CREATE TABLE IF NOT EXISTS text_write_receipts(id TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS text_write_key(key TEXT NOT NULL);');
        if (!db.prepare('SELECT key FROM text_write_key').get())
            db.prepare('INSERT INTO text_write_key VALUES(?)').run(randomBytes(32).toString('hex'));
        this.key = String(db.prepare('SELECT key FROM text_write_key').get().key);
    }
    save(journal) {
        const data = JSON.stringify(journal), mac = createHmac('sha256', this.key).update(data).digest('hex');
        durable(join(this.directory, journal.id + '.json'), Buffer.from(JSON.stringify({ data, mac })));
    }
    target(entry) {
        ensure(resolve(entry.root) === entry.root && entry.parents.length > 0, 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复记录路径无效', 409);
        for (const parent of entry.parents)
            ensure(identity(parent.path) === parent.identity, 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复目录身份已变化', 409);
        const target = entry.metadata ? entry.root + '.source-modes.json' : resolve(entry.root, entry.path);
        ensure(entry.metadata || target.startsWith(entry.root + sep), 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复路径越界', 409);
        plainFile(target);
        return target;
    }
    write(root, path, bytes, mode, metadata = false, preimage) {
        root = resolve(root);
        assertTextWriteSettled(root);
        ensure(!active.has(root) || active.get(root) === this.current?.id, 'TEXT_WRITE_RECOVERY_CONFLICT', '工作区已有文本写入事务', 409);
        mkdirSync(this.directory, { recursive: true, mode: 0o700 });
        const target = metadata ? root + '.source-modes.json' : resolve(root, path);
        plainFile(target);
        const unchanged = () => fileIdentity(target) === preimage.identity && matchesBytes(target, preimage.bytes, preimage.identity);
        for (const parent of preimage.parents)
            ensure(identity(parent.path) === parent.identity, 'TEXT_WRITE_RECOVERY_CONFLICT', '写入前目录已变化', 409);
        ensure(unchanged(), 'FILE_VERSION_CONFLICT', '写入前文件已变化', 409);
        const parents = [];
        let parent = metadata ? root : dirname(target);
        while (true) {
            parents.push({ path: parent, identity: identity(parent) });
            if (parent === dirname(root))
                break;
            const next = dirname(parent);
            ensure(next !== parent, 'PATH_DENIED', '恢复路径越界', 403);
            parent = next;
        }
        const entry = { root, path, metadata, parents, before: preimage.bytes?.toString('base64') ?? null, after: bytes.toString('base64'), mode: preimage.mode, beforeIdentity: preimage.identity, stage: root + '.text-write-stage-' + randomUUID(), backup: root + '.text-write-backup-' + randomUUID() };
        const journal = this.current ?? { id: randomUUID(), roots: [], entries: [] };
        if (!journal.roots.includes(root))
            journal.roots.push(root);
        journal.entries.push(entry);
        this.save(journal);
        this.current = journal;
        if (!active.has(root)) {
            // An exclusive marker also fences writers using another database.
            const fd = openSync(marker(root), 'wx', 0o600);
            try {
                writeFileSync(fd, journal.id);
                fsyncSync(fd);
            }
            finally {
                closeSync(fd);
            }
            active.set(root, journal.id);
        }
        this.db.prepare('INSERT OR IGNORE INTO text_write_receipts VALUES(?)').run(journal.id);
        const fd = openSync(entry.stage, 'wx', mode);
        try {
            writeFileSync(fd, bytes);
            fsyncSync(fd);
        }
        finally {
            closeSync(fd);
        }
        chmodSync(entry.stage, mode);
        entry.afterIdentity = fileIdentity(entry.stage);
        this.save(journal);
        this.target(entry);
        ensure(unchanged(), 'TEXT_WRITE_RECOVERY_CONFLICT', '写入前文件已变化', 409);
        if (entry.before !== null)
            linkSync(target, entry.backup);
        renameSync(entry.stage, target);
    }
    release() { if (this.current)
        for (const root of this.current.roots)
            active.delete(root); this.current = undefined; }
    rollback() { if (this.current) {
        this.finish(this.current, false);
        this.release();
    } }
    finish(journal, committed) {
        const roots = journal.roots;
        for (const entry of [...journal.entries].reverse()) {
            if (!committed) {
                const target = this.target(entry), before = entry.before === null ? null : Buffer.from(entry.before, 'base64'), after = Buffer.from(entry.after, 'base64');
                // A manually restored prewrite value needs no mutation, even if its inode changed.
                const currentIdentity = fileIdentity(target), original = matchesBytes(target, before, currentIdentity, entry.mode);
                ensure(original || (currentIdentity === entry.afterIdentity && matchesBytes(target, after, currentIdentity)), 'TEXT_WRITE_RECOVERY_CONFLICT', '事务外文件或权限修改需要人工恢复', 409);
                if (!original) {
                    if (entry.before === null)
                        unlinkSync(target);
                    else {
                        ensure(fileIdentity(entry.backup) === entry.beforeIdentity && matchesBytes(entry.backup, before, entry.beforeIdentity), 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复备份已变化', 409);
                        renameSync(entry.backup, target);
                    }
                }
            }
            for (const file of [entry.stage, entry.backup]) {
                plainFile(file);
                if (existsSync(file))
                    unlinkSync(file);
            }
            // Save progress so repeated writes to one path remain replayable after another crash.
            journal.entries.pop();
            this.save(journal);
        }
        for (const root of roots) {
            plainFile(marker(root));
            if (existsSync(marker(root))) {
                ensure(readFileSync(marker(root), 'utf8') === journal.id, 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复标记已变化', 409);
                unlinkSync(marker(root));
            }
        }
        unlinkSync(join(this.directory, journal.id + '.json'));
        this.db.prepare('DELETE FROM text_write_receipts WHERE id=?').run(journal.id);
    }
    recover() {
        this.conflicts.length = 0;
        if (!existsSync(this.directory))
            return;
        for (const name of readdirSync(this.directory).filter(n => /^[0-9a-f-]{36}\.json$/.test(n))) {
            try {
                const file = join(this.directory, name);
                plainFile(file);
                const { data, mac } = JSON.parse(readFileSync(file, 'utf8'));
                ensure(typeof data === 'string' && createHmac('sha256', this.key).update(data).digest('hex') === mac, 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复记录校验失败', 409);
                const journal = JSON.parse(data);
                ensure(name === journal.id + '.json', 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复记录标识无效', 409);
                ensure(journal.roots.every(root => { const parent = this.dataRoot + sep; return process.platform === 'win32' ? root.toLowerCase().startsWith(parent.toLowerCase()) : root.startsWith(parent); }), 'TEXT_WRITE_RECOVERY_CONFLICT', '恢复记录不属于当前数据目录，不能触碰旧目录', 409);
                this.finish(journal, !!this.db.prepare('SELECT 1 FROM text_write_receipts WHERE id=?').get(journal.id));
            }
            catch {
                this.conflicts.push(name);
            }
        }
    }
}
//# sourceMappingURL=text-write-recovery.js.map