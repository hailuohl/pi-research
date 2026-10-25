import { existsSync, lstatSync, unlinkSync } from 'node:fs';
import { verifyStreamedBlob } from './streamed-blob.js';
import { ensure } from '../domain/errors.js';
import { assertMaintenance } from './process-coordination.js';
export function textIndexPublication(paths, projectId, value) {
    ensure(typeof projectId === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(projectId) && value.projectId === projectId && value.kind === 'text-index-publication' && value.format === 'text-index-publication-v1' && typeof value.stagingId === 'string' && /^[0-9a-f-]{36}$/.test(value.stagingId) && value.id === value.stagingId, 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引发布归属无效', 409);
    ensure(Object.keys(value).every(k => ['id', 'kind', 'projectId', 'version', 'createdAt', 'updatedAt', 'format', 'stagingId', 'source', 'blobs'].includes(k)) && Array.isArray(value.blobs) && value.blobs.length === 1, 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引发布字段无效', 409);
    const valid = (b) => b && typeof b.digest === 'string' && /^[a-f0-9]{64}$/.test(b.digest) && Number.isSafeInteger(b.size) && b.size >= 0 && typeof b.blobPath === 'string' && paths.key(b.blobPath) === 'artifacts/' + b.digest;
    const source = value.source, blob = value.blobs[0];
    ensure(valid(source) && Object.keys(source).sort().join(',') === 'artifactId,blobPath,digest,size' && typeof source.artifactId === 'string' && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(source.artifactId), 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引源引用无效', 409);
    ensure(valid(blob) && blob.size > 0 && Object.keys(blob).sort().join(',') === 'blobPath,digest,size,stage' && blob.stage && Object.keys(blob.stage).sort().join(',') === 'dev,ino,path' && Number.isInteger(blob.stage.dev) && blob.stage.dev >= 0 && Number.isInteger(blob.stage.ino) && blob.stage.ino >= 0 && typeof blob.stage.path === 'string' && paths.key(blob.stage.path) === `projects/${projectId}/text-index-staging/${value.stagingId}/index`, 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引暂存身份无效', 409);
    return value;
}
export function assertTextIndexSource(db, projectId, publication) {
    const row = db.prepare("SELECT project_id,data FROM records WHERE kind='artifact' AND id=?").get(publication.source.artifactId), source = row ? JSON.parse(String(row.data)) : undefined;
    ensure(row && row.project_id === projectId && source.id === publication.source.artifactId && source.kind === 'artifact' && source.projectId === projectId && source.path === publication.source.blobPath && source.digest === publication.source.digest && source.size === publication.source.size, 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引来源不再属于原项目', 409);
}
export function existingTextIndexBlobs(db, paths, projectId, value) {
    const p = textIndexPublication(paths, projectId, value);
    assertTextIndexSource(db, projectId, p);
    if (existsSync(paths.physical(p.source.blobPath)))
        verifyStreamedBlob({ paths }, p.source);
    return p.blobs.filter(blob => { if (!existsSync(paths.physical(blob.blobPath)))
        return false; verifyStreamedBlob({ paths }, blob); return true; });
}
/** Offline recovery removes only the redundant intent-bound stage link; CAS remains owned. */
export function settleTextIndexLinks(db, paths, permit) {
    assertMaintenance(db, paths.dataDir, permit);
    for (const row of db.prepare("SELECT id,project_id,data FROM records WHERE kind='text-index-publication'").all()) {
        const value = JSON.parse(String(row.data));
        ensure(value.id === row.id, 'TEXT_INDEX_PUBLICATION_INVALID', '文本索引发布ID不符', 409);
        for (const blob of existingTextIndexBlobs(db, paths, row.project_id, value)) {
            const path = paths.physical(blob.stage.path), target = paths.physical(blob.blobPath);
            if (!existsSync(path))
                continue;
            const stage = lstatSync(path), cas = lstatSync(target);
            ensure(stage.isFile() && !stage.isSymbolicLink(), 'TEXT_INDEX_PUBLICATION_INVALID', '索引暂存类型改变', 409);
            if (stage.dev !== cas.dev || stage.ino !== cas.ino)
                continue;
            ensure(stage.dev === blob.stage.dev && stage.ino === blob.stage.ino && stage.size === blob.size, 'TEXT_INDEX_PUBLICATION_INVALID', '索引暂存身份改变', 409);
            assertMaintenance(db, paths.dataDir, permit);
            const before = lstatSync(path), named = lstatSync(target);
            ensure(before.dev === stage.dev && before.ino === stage.ino && before.size === stage.size && before.mtimeMs === stage.mtimeMs && before.ctimeMs === stage.ctimeMs && named.dev === stage.dev && named.ino === stage.ino, 'TEXT_INDEX_PUBLICATION_INVALID', '索引恢复期间身份改变', 409);
            unlinkSync(path);
        }
    }
}
//# sourceMappingURL=text-index-publication.js.map