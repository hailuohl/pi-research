import { lstatSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { ensure } from '../domain/errors.js';
const sameRoot = (a, b) => process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
const under = (root, path) => { const prefix = root.endsWith(sep) ? root : root + sep; return process.platform === 'win32' ? path.toLowerCase().startsWith(prefix.toLowerCase()) : path.startsWith(prefix); };
function rootPath(value) { ensure(typeof value === 'string' && !value.includes('\0') && isAbsolute(value) && resolve(value) === value, 'STORAGE_LOCATION_INVALID', '数据位置必须是规范绝对目录', 409); return value; }
function keyPath(value) {
    ensure(value.length > 0 && !isAbsolute(value) && !value.includes('\\') && value.split('/').every(p => p && p !== '.' && p !== '..' && !/[\x00-\x1f:]/.test(p) && !/[. ]$/.test(p) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'STORAGE_PATH_INVALID', '受管资源键无效', 403);
    return value;
}
function noLinks(path) { const chain = []; for (let current = path;;) {
    chain.push(current);
    const parent = dirname(current);
    if (parent === current)
        break;
    current = parent;
} for (const current of chain.reverse()) {
    try {
        ensure(!lstatSync(current).isSymbolicLink(), 'STORAGE_PATH_INVALID', '受管存储不能经过链接', 403);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
} }
export function assertPhysicalDataRoot(path) { noLinks(rootPath(resolve(path))); }
/** Logical references never probe an old root. All filesystem access belongs to this Store instance. */
export class DataPaths {
    dataDir;
    legacyRoots;
    constructor(dataDir, legacyRoots = []) {
        this.dataDir = rootPath(resolve(dataDir));
        ensure(legacyRoots.length <= 32, 'STORAGE_LOCATION_INVALID', '历史位置过多', 409);
        const roots = legacyRoots.map(rootPath);
        ensure(roots.every((r, i) => !sameRoot(r, this.dataDir) && !under(r, this.dataDir) && !under(this.dataDir, r) && roots.slice(0, i).every(other => !sameRoot(other, r) && !under(other, r) && !under(r, other))), 'STORAGE_LOCATION_INVALID', '历史位置重复或重叠', 409);
        this.legacyRoots = roots;
    }
    key(reference) {
        ensure(typeof reference === 'string' && !reference.includes('\0'), 'STORAGE_PATH_INVALID', '受管路径无效', 403);
        let key;
        if (reference.startsWith('pi-data:/')) {
            const encoded = reference.slice(9);
            let decoded;
            try {
                decoded = encoded.split('/').map(p => decodeURIComponent(p));
            }
            catch {
                ensure(false, 'STORAGE_PATH_INVALID', '资源键编码无效', 403);
            }
            ensure(decoded.every(p => !p.includes('/') && !p.includes('\\')) && decoded.map(encodeURIComponent).join('/') === encoded, 'STORAGE_PATH_INVALID', '资源键必须使用规范编码', 403);
            key = keyPath(decoded.join('/'));
        }
        else {
            ensure(isAbsolute(reference) && resolve(reference) === reference, 'STORAGE_PATH_INVALID', '旧受管路径必须是规范绝对路径', 403);
            const root = [this.dataDir, ...this.legacyRoots].find(r => under(r, reference));
            ensure(root, 'STORAGE_REFERENCE_OUTSIDE', '文件引用不属于当前数据集的受管位置', 403);
            key = keyPath(relative(root, reference).split(sep).join('/'));
        }
        return key;
    }
    physical(reference) { const path = join(this.dataDir, this.key(reference)); noLinks(path); return path; }
    reference(path) { const physical = this.physical(path), key = relative(this.dataDir, physical).split(sep).join('/'); return 'pi-data:/' + key.split('/').map(encodeURIComponent).join('/'); }
    same(a, b) { return sameRoot(this.physical(a), this.physical(b)); }
    physicalSnapshot(snapshot) { return { ...snapshot, path: this.physical(snapshot.path) }; }
    referenceSnapshot(snapshot) { return { ...snapshot, path: this.reference(snapshot.path) }; }
}
export function readDataLocation(db) {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='data_location'").get()) {
        const schema = !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'").get();
        ensure(!schema || !db.prepare('SELECT 1 FROM schema_migrations WHERE version=9').get(), 'STORAGE_LOCATION_INVALID', '数据位置元数据缺失，拒绝猜测历史根', 409);
        return null;
    }
    const row = db.prepare('SELECT data FROM data_location WHERE id=1').get();
    ensure(row && typeof row.data === 'string', 'STORAGE_LOCATION_INVALID', '数据位置记录缺失', 409);
    let value;
    try {
        value = JSON.parse(row.data);
    }
    catch {
        ensure(false, 'STORAGE_LOCATION_INVALID', '数据位置记录损坏', 409);
    }
    ensure(value !== null && typeof value === 'object' && !Array.isArray(value), 'STORAGE_LOCATION_INVALID', '数据位置格式无效', 409);
    const location = value;
    ensure(location.format === 1 && Array.isArray(location.legacyRoots) && Object.keys(location).sort().join(',') === 'activeRoot,format,legacyRoots', 'STORAGE_LOCATION_INVALID', '数据位置格式无效', 409);
    const checked = new DataPaths(rootPath(location.activeRoot), location.legacyRoots);
    return { format: 1, activeRoot: checked.dataDir, legacyRoots: [...checked.legacyRoots] };
}
export function loadDataPaths(db, dataDir) {
    const location = readDataLocation(db), root = resolve(dataDir);
    if (!location)
        return new DataPaths(root);
    ensure(sameRoot(location.activeRoot, root), 'STORAGE_RELOCATION_REQUIRED', '数据目录已移动；请使用受控异址恢复，不直接复制数据库启动', 409);
    return new DataPaths(root, location.legacyRoots);
}
/** Administrative operation on an unpublished restore database, never a model capability. */
export function setDataLocation(db, dataDir, legacyRoots = []) {
    const paths = new DataPaths(resolve(dataDir), legacyRoots), location = { format: 1, activeRoot: paths.dataDir, legacyRoots: [...paths.legacyRoots] };
    db.exec('CREATE TABLE IF NOT EXISTS data_location(id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL)');
    db.prepare('INSERT INTO data_location VALUES(1,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(JSON.stringify(location));
    return paths;
}
//# sourceMappingURL=data-paths.js.map