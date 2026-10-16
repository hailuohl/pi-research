import { randomUUID, createHash } from 'node:crypto';
import { lstatSync, mkdirSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { safePath } from '../workspace/files.js';
import { TOOL_DEFINITIONS } from '../research-tools/definitions.js';
const names = new Set(['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'URIError', 'EvalError', 'AggregateError']);
const codes = new Set(['EACCES', 'EPERM', 'ENOENT', 'EBUSY', 'ENOTEMPTY', 'EEXIST', 'ENOSPC', 'EMFILE', 'ENFILE', 'EROFS', 'EIO', 'ETIMEDOUT', 'ENAMETOOLONG', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ERR_ENCODING_INVALID_ENCODED_DATA', 'ERR_INVALID_ARG_TYPE', 'ERR_OUT_OF_RANGE']);
const syscalls = new Set(['open', 'read', 'write', 'stat', 'lstat', 'fstat', 'scandir', 'rename', 'mkdir', 'rmdir', 'unlink', 'readlink', 'realpath', 'connect', 'getaddrinfo']);
/** Keep structural diagnostics only: exception text, arbitrary properties and raw stack lines may contain secrets. */
export function saveLocalToolDiagnostic(dataDir, repoRoot, sessionId, tool, callId, error) {
    try {
        const original = error instanceof Error ? error : undefined;
        const stack = original?.stack, name = original?.name, code = original?.code, syscall = original?.syscall;
        const frames = [];
        if (typeof stack === 'string')
            for (const entry of stack.slice(0, 65536).split('\n').slice(1)) {
                const match = entry.match(/\(?((?:file:\/\/\/)?(?:[A-Za-z]:[\\/]|\/).+):([0-9]+):([0-9]+)\)?$/);
                if (!match)
                    continue;
                const file = relative(repoRoot, match[1].startsWith('file:') ? fileURLToPath(match[1]) : match[1]).replaceAll('\\', '/'), line = Number(match[2]), column = Number(match[3]);
                if (!/^(?:dist\/)?(?:packages|apps)\/[A-Za-z0-9_./-]+\.(?:js|mjs|cjs|ts|tsx)$/.test(file) || !Number.isSafeInteger(line) || line < 1 || line > 10000000 || !Number.isSafeInteger(column) || column < 1 || column > 10000000)
                    continue;
                try {
                    if (!lstatSync(safePath(repoRoot, file)).isFile())
                        continue;
                }
                catch {
                    continue;
                }
                frames.push({ file, line, column });
                if (frames.length === 12)
                    break;
            }
        const id = randomUUID(), record = { formatVersion: 1, id, createdAt: new Date().toISOString(), sessionId, tool: Object.hasOwn(TOOL_DEFINITIONS, tool) ? tool : 'unknown', callIdHash: createHash('sha256').update(callId).digest('hex'), error: { name: original ? typeof name === 'string' && names.has(name) ? name : 'Error' : 'UnknownThrown', ...(typeof code === 'string' && codes.has(code) ? { code } : {}), ...(typeof syscall === 'string' && syscalls.has(syscall) ? { syscall } : {}), frames } };
        const bytes = JSON.stringify(record, null, 2) + '\n';
        if (Buffer.byteLength(bytes) > 8192)
            return;
        const directory = `sessions/${sessionId}/diagnostics`;
        mkdirSync(safePath(dataDir, directory), { recursive: true, mode: 0o700 });
        writeFileSync(safePath(dataDir, `${directory}/${id}.json`), bytes, { mode: 0o600, flag: 'wx' });
        return id;
    }
    catch {
        return;
    }
}
//# sourceMappingURL=local-tool-diagnostic.js.map