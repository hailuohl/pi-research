import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync, renameSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, dirname, sep } from 'node:path';
import { digest, stable } from '../storage/store.js';
import { ensure } from '../domain/errors.js';
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const EXCLUDED = new Set(['.git', 'node_modules', '.pi', '.env', '.DS_Store', '.pi-research', '.pi-runtime', '.npmrc', '.pypirc']);
const excluded = (name) => EXCLUDED.has(name) || name.startsWith('.env.');
function assertNotSymlink(path) {
    try {
        ensure(!lstatSync(path).isSymbolicLink(), 'PATH_DENIED', '不允许通过符号链接访问文件', 403);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
}
export function safePath(root, path, allowRoot = false) {
    ensure(typeof path === 'string' && !path.includes('\0') && !path.includes('\\') && !isAbsolute(path) && !path.split('/').some(p => p === '..' || p === '.' || excluded(p)) && (allowRoot || path.length > 0), 'PATH_DENIED', '路径不在授权工作区内', 403);
    const base = resolve(root), target = resolve(base, path);
    ensure(target === base || target.startsWith(base + sep), 'PATH_DENIED', '路径越界', 403);
    assertNotSymlink(base);
    let current = base;
    for (const part of relative(base, target).split(sep).filter(Boolean)) {
        current = join(current, part);
        assertNotSymlink(current);
    }
    return target;
}
export function readText(root, path) { const file = safePath(root, path); ensure(existsSync(file) && lstatSync(file).isFile(), 'NOT_FOUND', '文件不存在', 404); ensure(lstatSync(file).size <= MAX_TEXT_BYTES, 'FILE_TOO_LARGE', '文件过大，不能作为文本打开', 413); const raw = readFileSync(file); ensure(!raw.includes(0), 'BINARY_FILE', '不能作为文本读取二进制文件', 415); return { path, content: raw.toString('utf8'), digest: digest(raw), size: raw.length }; }
export function writeText(root, path, content, expectedDigest) { const file = safePath(root, path); const bytes = Buffer.from(content); ensure(bytes.length <= MAX_TEXT_BYTES, 'FILE_TOO_LARGE', '文件过大', 413); const previous = existsSync(file) ? digest(readFileSync(file)) : null; ensure(previous === expectedDigest, 'FILE_VERSION_CONFLICT', '文件已被其他操作修改，请刷新并比较差异'); mkdirSync(dirname(file), { recursive: true, mode: 0o700 }); const temporary = file + '.tmp-' + process.pid; writeFileSync(temporary, bytes, { mode: 0o600 }); renameSync(temporary, file); return { path, digest: digest(bytes), size: bytes.length }; }
export function listFiles(root, sub = '') {
    const result = [];
    const walk = (dir) => {
        for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            if (excluded(item.name))
                continue;
            const path = join(dir, item.name);
            ensure(!item.isSymbolicLink(), 'PATH_DENIED', '工作区包含符号链接', 403);
            if (item.isDirectory())
                walk(path);
            else if (item.isFile()) {
                result.push({ path: relative(root, path).split(sep).join('/'), size: lstatSync(path).size });
                ensure(result.length <= 5000, 'TOO_MANY_FILES', '工作区文件超过 5000 个', 413);
            }
        }
    };
    const start = safePath(root, sub, true);
    if (existsSync(start))
        walk(start);
    return result;
}
export function snapshotDirectory(root, store) {
    const files = listFiles(root);
    ensure(!files.some(f => f.path.split('/').includes('.gitmodules')), 'UNSUPPORTED_SUBMODULE', '当前版本不展开 Git 子模块；请明确导入已解析的源码而不是遗漏依赖', 422);
    ensure(files.length > 0, 'EMPTY_WORKSPACE', '工作区没有可运行文件', 400);
    let total = 0;
    const data = files.map(f => { total += f.size; ensure(total <= 64 * 1024 * 1024, 'SNAPSHOT_TOO_LARGE', '当前快照限制为 64 MiB；请将大型数据集独立版本化', 413); const bytes = readFileSync(safePath(root, f.path)); ensure(!bytes.subarray(0, 150).toString().startsWith('version https://git-lfs.github.com/spec'), 'UNSUPPORTED_LFS', '必须先解析 Git LFS 文件再建立快照', 422); return { ...f, size: bytes.length, digest: digest(bytes), bytes }; });
    const manifest = data.map(({ path, size, digest }) => ({ path, size, digest })).sort((a, b) => a.path.localeCompare(b.path));
    const hash = digest(stable(manifest));
    const destination = join(store, hash);
    mkdirSync(destination, { recursive: true, mode: 0o700 });
    for (const item of data) {
        const target = safePath(destination, item.path);
        if (!existsSync(target)) {
            mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
            writeFileSync(target, item.bytes, { mode: 0o444, flag: 'wx' });
        }
        else
            ensure(digest(readFileSync(target)) === item.digest, 'SNAPSHOT_CORRUPTED', '已保存快照摘要不一致', 500);
    }
    return { digest: hash, path: destination, files: manifest };
}
export function verifySnapshot(path, files) {
    for (const f of files) {
        const p = safePath(path, f.path);
        ensure(existsSync(p) && digest(readFileSync(p)) === f.digest, 'SNAPSHOT_CORRUPTED', '快照文件校验失败', 409);
    }
    ensure(listFiles(path).length === files.length, 'SNAPSHOT_CORRUPTED', '快照出现额外文件', 409);
}
//# sourceMappingURL=files.js.map