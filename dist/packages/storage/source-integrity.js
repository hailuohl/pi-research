import { lstatSync } from 'node:fs';
import { verifyStreamedBlob, validateStreamedBlobReference } from './streamed-blob.js';
import { ensure } from '../domain/errors.js';
const states = new WeakMap(), scopes = new WeakMap();
const key = (store, b) => JSON.stringify([store.paths.key(b.blobPath), b.digest, b.size]);
export function sourceIntegrityScope(store, id) { return scopes.get(store)?.get(id); }
export function verifiedSourceContext(store, blob) {
    for (const context of scopes.get(store)?.values() ?? []) {
        const state = states.get(context);
        if (state?.active && state.mode === 'full' && state.verified.has(key(store, blob)))
            return context;
    }
}
export function withSourceIntegrity(store, id, mode, blobs, fn) {
    const current = sourceIntegrityScope(store, id);
    if (mode === 'full' && current)
        return fn(current);
    const context = {}, state = { store, active: true, mode, deferred: new Set(blobs.map(b => { validateStreamedBlobReference(store, b); return key(store, b); })), verified: new Map(), failed: new Map() };
    states.set(context, state);
    let map = scopes.get(store);
    if (!map) {
        map = new Map();
        scopes.set(store, map);
    }
    if (mode === 'full')
        map.set(id, context);
    try {
        const result = fn(context);
        ensure(!(result instanceof Promise), 'INTEGRITY_SCOPE_ASYNC', '完整性上下文不能跨await或RPC保留');
        return result;
    }
    finally {
        state.active = false;
        state.verified.clear();
        state.failed.clear();
        if (mode === 'full')
            map.delete(id);
    }
}
export function verifySourceBlob(store, blob, context) {
    if (!context) {
        verifyStreamedBlob(store, blob);
        return;
    }
    const state = states.get(context);
    ensure(state?.active && state.store === store, 'INTEGRITY_SCOPE_INVALID', '完整性上下文不是本次宿主边界');
    const path = validateStreamedBlobReference(store, blob), id = key(store, blob);
    if (state.mode === 'authority' && state.deferred.has(id))
        return;
    if (state.failed.has(id))
        throw state.failed.get(id);
    const before = state.verified.get(id);
    if (before) {
        const after = lstatSync(path);
        ensure(after.isFile() && !after.isSymbolicLink() && ['dev', 'ino', 'size', 'mtimeMs', 'ctimeMs'].every(k => before[k] === after[k]), 'ARTIFACT_CHANGED', '原件在同一次完整校验边界内变化');
        return;
    }
    try {
        state.verified.set(id, verifyStreamedBlob(store, blob));
    }
    catch (error) {
        state.failed.set(id, error);
        throw error;
    }
}
//# sourceMappingURL=source-integrity.js.map