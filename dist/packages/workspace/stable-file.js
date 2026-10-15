import { openSync, closeSync, fstatSync, lstatSync, readSync, constants } from 'node:fs';
import { safePath } from './files.js';
import { ensure } from '../domain/errors.js';
/** Bounded read of one regular file. Detect replacement/growth during collection. */
export function readStableFile(root, path, maxBytes) {
    const file = safePath(root, path), before = lstatSync(file);
    ensure(before.isFile(), 'ARTIFACT_NOT_FILE', `${path}: 必须是普通文件`, 400);
    ensure(before.size <= maxBytes, 'ARTIFACT_TOO_LARGE', `${path}: 文件超过归档大小限制`, 413);
    const fd = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const opened = fstatSync(fd);
        ensure(opened.isFile() && opened.dev === before.dev && opened.ino === before.ino && opened.size === before.size, 'ARTIFACT_CHANGED', `${path}: 收集期间文件被替换`, 409);
        const buffer = Buffer.alloc(opened.size + 1);
        let length = 0;
        while (length < buffer.length) {
            const n = readSync(fd, buffer, length, buffer.length - length, length);
            if (!n)
                break;
            length += n;
        }
        const after = fstatSync(fd), named = lstatSync(safePath(root, path));
        ensure(length === opened.size && after.size === opened.size && after.mtimeMs === opened.mtimeMs &&
            after.ctimeMs === opened.ctimeMs && named.isFile() && named.ino === after.ino && named.dev === after.dev, 'ARTIFACT_CHANGED', `${path}: 收集期间内容改变`, 409);
        return buffer.subarray(0, length);
    }
    finally {
        closeSync(fd);
    }
}
//# sourceMappingURL=stable-file.js.map