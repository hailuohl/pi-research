import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { readFileSync } from 'node:fs';
/** Verify the entire provenance chain; a matching quote alone cannot establish a PDF page. */
export function verifyDocumentLink(c, pid, link, artifactId) {
    const read = (id, hash) => { const a = c.store.get('artifact', id, pid), bytes = readFileSync(a.path); ensure(a.digest === hash && digest(bytes) === hash && a.size === bytes.length, 'EVIDENCE_INVALID', '文档产物内容或关联已失效'); return bytes; };
    const d = c.store.get('document-version', link.documentVersionId, pid);
    ensure(d.original.digest === link.rawDigest && d.contentKind === 'original-pdf', 'EVIDENCE_INVALID', '证据必须绑定该原始 PDF');
    read(d.original.artifactId, link.rawDigest);
    const r = c.store.get('document-parse-result', link.parseResultId, pid), job = c.store.get('document-parse-job', r.jobId, pid);
    ensure(r.documentVersionId === d.id && r.rawDigest === link.rawDigest && job.documentVersionId === d.id && job.resultId === r.id && job.state === 'succeeded' && job.integrity === 'complete' && job.manifestDigest === r.manifestDigest && digest(job.manifest) === r.manifestDigest && job.manifest.documentDigest === digest(d) && job.manifest.rawDigest === link.rawDigest && job.manifest.rawArtifactId === d.original.artifactId, 'EVIDENCE_INVALID', '文档解析来源绑定已失效');
    const page = r.pages.find(p => p.pageNumber === link.pageNumber);
    ensure(page && page.textArtifactDigest === link.textArtifactDigest && (!artifactId || page.textArtifactId === artifactId), 'EVIDENCE_INVALID', '页文本绑定不匹配');
    const bytes = read(page.textArtifactId, page.textArtifactDigest);
    read(page.imageArtifactId, page.imageArtifactDigest);
    let manifest;
    try {
        manifest = JSON.parse(read(r.manifestArtifactId, r.manifestArtifactDigest).toString('utf8'));
    }
    catch {
        ensure(false, 'EVIDENCE_INVALID', '解析清单无效');
    }
    const fixed = manifest.pages?.find(p => p.pageNumber === link.pageNumber);
    ensure(manifest.rawDigest === link.rawDigest && fixed?.textDigest === page.textArtifactDigest && fixed?.imageDigest === page.imageArtifactDigest && digest(fixed.paragraphs) === digest(page.paragraphs) && fixed.textStatus === page.textStatus, 'EVIDENCE_INVALID', '原页清单与派生产物不匹配');
    return { document: d, result: r, page, bytes, job, manifest: manifest };
}
//# sourceMappingURL=document-link.js.map