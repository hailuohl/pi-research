import { assertDiscoveryArtifact } from '../policy/discovery-grant-validation.js';
import { assertRunGrantRun } from '../policy/run-grant-validation.js';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, chmodSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { object, text, integer } from '../contracts/validation.js';
import { ensure, DomainError } from '../domain/errors.js';
import { userOnly, scope } from '../policy/permissions.js';
import { assertProjectWritable, assertExperimentSourceCurrent } from '../policy/lifecycle.js';
import { digest } from '../storage/store.js';
import { snapshotDirectory, verifySnapshot, safePath } from '../workspace/files.js';
import { readStableFile } from '../workspace/stable-file.js';
import { docker, preflight, dockerEnv } from '../execution/docker.js';
import { MANUSCRIPT_TEMPLATES } from './templates.js';
import { PUBLICATION_PROFILE, PUBLICATION_RESOURCES, PUBLICATION_TERMINAL } from './build-types.js';
const terminal = (state) => PUBLICATION_TERMINAL.includes(state);
const closed = (x, keys, optional = []) => { const v = object(x); ensure(keys.every(k => k in v) && Object.keys(v).every(k => keys.includes(k) || optional.includes(k)), 'PUBLICATION_INVALID', '字段不符'); return v; };
export function compilerProfile(repoRoot) { const root = join(repoRoot, 'scripts', 'document-build'), lockDigest = digest(readFileSync(join(root, 'debian-packages.lock.json'))), scriptDigest = digest(readFileSync(join(root, 'build.py'))), dockerfileDigest = digest(readFileSync(join(root, 'Dockerfile'))), profileDigest = digest(JSON.stringify({ profileId: PUBLICATION_PROFILE, lockDigest, scriptDigest, dockerfileDigest })); return { profileId: PUBLICATION_PROFILE, lockDigest, scriptDigest, dockerfileDigest, profileDigest }; }
export async function verifyCompilerImage(context, image, profile) { const imageId = await preflight(context, image, { allowLocalImageId: true }), labels = JSON.parse(await docker(context, ['image', 'inspect', '--format', '{{json .Config.Labels}}', image])); ensure(labels?.['pi-research.compiler-profile'] === profile.profileId && labels?.['pi-research.compiler-lock'] === profile.lockDigest && labels?.['pi-research.compiler-script'] === profile.scriptDigest && labels?.['pi-research.compiler-dockerfile'] === profile.dockerfileDigest && labels?.['pi-research.compiler-digest'] === profile.profileDigest, 'PUBLICATION_PROFILE_MISMATCH', '镜像未匹配本机固定编译配置'); return imageId; }
export function manuscriptPath(value) { const p = text(value, 'path', 240); ensure(p.split('/').every(s => /^[A-Za-z0-9_][A-Za-z0-9_. -]*$/.test(s) && !/[. ]$/.test(s) && !/^AGENTS(?:\.|$)/i.test(s) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(s)), 'PUBLICATION_PATH_DENIED', '文稿路径必须为规范相对文件路径'); return p; }
export function manuscriptBytes(path, bytes) {
    const ext = extname(path).toLowerCase();
    let mediaType;
    if (['.tex', '.bib', '.sty', '.cls', '.bst', '.txt', '.csv'].includes(ext)) {
        ensure(bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0), 'PUBLICATION_FILE_LIMIT', '文本文件超过2 MiB或含NUL');
        new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        mediaType = ext === '.csv' ? 'text/csv' : 'text/plain';
    }
    else {
        ensure(bytes.length <= 8 * 1024 * 1024, 'PUBLICATION_FILE_LIMIT', '二进制文件超过8 MiB');
        if (ext === '.png') {
            ensure(bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PUBLICATION_FILE_TYPE', 'PNG头不符');
            mediaType = 'image/png';
        }
        else if (ext === '.jpg' || ext === '.jpeg') {
            ensure(bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255, 'PUBLICATION_FILE_TYPE', 'JPEG头不符');
            mediaType = 'image/jpeg';
        }
        else {
            ensure(ext === '.pdf' && bytes.subarray(0, 5).toString() === '%PDF-', 'PUBLICATION_FILE_TYPE', '仅接受UTF-8文稿文件与PNG/JPG/PDF');
            mediaType = 'application/pdf';
        }
    }
    return mediaType;
}
export function validateBuildOutput(root, sourceDigest, engine, bibliography) {
    const manifestBytes = readStableFile(root, 'build.json', 2 * 1024 * 1024), value = closed(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes)), ['formatVersion', 'profileId', 'sourceDigest', 'engine', 'bibliography', 'engineVersion', 'status', 'hadErrors', 'converged', 'passes', 'diagnostics', 'pdf', 'previews', 'logs']);
    ensure(value.formatVersion === 1 && value.profileId === PUBLICATION_PROFILE && value.sourceDigest === sourceDigest && value.engine === engine && value.bibliography === bibliography, 'PUBLICATION_OUTPUT_INVALID', '编译清单与输入不符');
    text(value.engineVersion, 'engineVersion', 2000, value.status !== 'succeeded');
    ensure(['succeeded', 'failed', 'timed_out', 'non_convergent'].includes(String(value.status)) && typeof value.hadErrors === 'boolean' && typeof value.converged === 'boolean', 'PUBLICATION_OUTPUT_INVALID', '编译状态无效');
    integer(value.passes, 'passes', 0, 6);
    ensure(Array.isArray(value.diagnostics) && value.diagnostics.length <= 1000 && Array.isArray(value.previews) && value.previews.length <= 100 && Array.isArray(value.logs) && value.logs.length === 1, 'PUBLICATION_OUTPUT_INVALID', '诊断或产物清单无效');
    for (const d of value.diagnostics) {
        const x = closed(d, ['severity', 'code', 'message', 'file', 'line', 'pass']);
        ensure(['error', 'warning'].includes(String(x.severity)), 'PUBLICATION_OUTPUT_INVALID', '诊断等级无效');
        text(x.code, 'code', 100);
        text(x.message, 'message', 4000);
        if (x.file !== null)
            manuscriptPath(x.file);
        if (x.line !== null)
            integer(x.line, 'line', 1, 10000000);
        if (x.pass !== null)
            integer(x.pass, 'pass', 1, 6);
    }
    const files = new Map([['build.json', manifestBytes]]);
    let total = manifestBytes.length;
    const load = (x, name, max) => { ensure(x.file === name, 'PUBLICATION_OUTPUT_INVALID', '非固定输出路径'); const bytes = readStableFile(root, name, max); ensure(bytes.length === x.bytes && digest(bytes) === x.digest, 'PUBLICATION_OUTPUT_INVALID', '输出摘要不符'); total += bytes.length; ensure(total <= PUBLICATION_RESOURCES.outputBytes, 'PUBLICATION_OUTPUT_LIMIT', '输出总量超过上限'); files.set(name, bytes); return bytes; };
    if (value.pdf !== null) {
        const p = closed(value.pdf, ['file', 'digest', 'bytes', 'pages']);
        integer(p.pages, 'pages', 1, 100);
        ensure(load(p, 'document.pdf', 32 * 1024 * 1024).subarray(0, 5).toString() === '%PDF-', 'PUBLICATION_OUTPUT_INVALID', 'PDF头无效');
    }
    for (const [i, raw] of value.previews.entries()) {
        const p = closed(raw, ['pageNumber', 'file', 'digest', 'bytes', 'width', 'height']);
        ensure(p.pageNumber === i + 1 && value.pdf !== null && i < Number(value.pdf.pages), 'PUBLICATION_OUTPUT_INVALID', '预览页序不符');
        const w = integer(p.width, 'width', 1, 1600), h = integer(p.height, 'height', 1, 1600), b = load(p, `page-${String(i + 1).padStart(3, '0')}.png`, 16 * 1024 * 1024);
        ensure(b.length >= 33 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && b.toString('ascii', 12, 16) === 'IHDR' && b.readUInt32BE(16) === w && b.readUInt32BE(20) === h, 'PUBLICATION_OUTPUT_INVALID', 'PNG头或尺寸不符');
    }
    const log = closed(value.logs[0], ['file', 'digest', 'bytes']);
    load(log, 'build.log', PUBLICATION_RESOURCES.logBytes);
    if (value.status === 'succeeded')
        ensure(value.hadErrors === false && value.converged === true && value.pdf !== null && value.previews.length === Number(value.pdf.pages) && !value.diagnostics.some((x) => x.severity === 'error'), 'PUBLICATION_OUTPUT_INVALID', '成功状态缺少完整收敛产物');
    const actual = readdirSync(root, { withFileTypes: true });
    ensure(actual.length === files.size && actual.every(f => f.isFile() && !f.isSymbolicLink() && files.has(f.name)), 'PUBLICATION_OUTPUT_INVALID', '出现清单外或非普通文件');
    return { manifest: value, manifestBytes, files };
}
export class PublicationBuildService {
    app;
    stopped = false;
    constructor(app) {
        this.app = app;
    }
    templates(actor, pid) { userOnly(actor); scope(actor, pid); return structuredClone(MANUSCRIPT_TEMPLATES); }
    revisions(actor, pid, cursor = 0, limit = 30) { userOnly(actor); scope(actor, pid); integer(cursor, 'cursor', 0, Number.MAX_SAFE_INTEGER); integer(limit, 'limit', 1, 100); const rows = this.app.store.db.prepare("SELECT rowid,data FROM records WHERE kind='manuscript-revision' AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?").all(pid, cursor, limit + 1); return { items: rows.slice(0, limit).map(r => JSON.parse(r.data)), nextCursor: rows.length > limit ? Number(rows[limit - 1].rowid) : null }; }
    revision(actor, pid, id) { userOnly(actor); scope(actor, pid); const r = this.app.store.get('manuscript-revision', id, pid); this.assertRevision(r, true); return r; }
    readSource(actor, pid, id, path, cursor = 0, limit = 64000) { const r = this.revision(actor, pid, id), file = r.files.find(f => f.path === path); ensure(file, 'NOT_FOUND', '文稿文件不存在', 404); ensure(file.mediaType.startsWith('text/'), 'PUBLICATION_BINARY_FILE', '二进制文件请使用资产下载'); const { artifact, bytes } = this.app.evidence.read(actor, file.artifactId); ensure(artifact.projectId === pid && artifact.digest === file.digest && bytes.length === file.size, 'PUBLICATION_SOURCE_CORRUPTED', '文稿文件摘要不符'); const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); integer(cursor, 'cursor', 0, content.length); integer(limit, 'limit', 1, 64000); let end = Math.min(content.length, cursor + limit); if (end < content.length && /[\uD800-\uDBFF]/.test(content[end - 1])) {
        ensure(end > cursor + 1, 'WINDOW_TOO_SMALL', '读取窗口不能容纳完整字符');
        end--;
    } ensure(cursor === 0 || !/[\uDC00-\uDFFF]/.test(content[cursor]), 'INVALID_INPUT', '游标拆分字符'); return { path, content: content.slice(cursor, end), digest: file.digest, mediaType: file.mediaType, cursor, end, complete: end === content.length }; }
    assertRevision(r, verifyBytes) { const sourceDigest = digest({ engine: r.engine, mainFile: r.mainFile, bibliography: r.bibliography, files: r.files.map(f => ({ path: f.path, digest: f.digest, size: f.size })) }); ensure(sourceDigest === r.sourceDigest, 'PUBLICATION_SOURCE_CORRUPTED', '文稿配置或文件清单摘要改变'); const archived = this.app.store.get('artifact', r.manifestArtifactId, r.projectId); ensure(archived.digest === r.manifestArtifactDigest, 'PUBLICATION_SOURCE_CORRUPTED', '文稿清单资产改变'); if (verifyBytes) {
        const bytes = this.app.evidence.read({ type: 'user' }, archived.id).bytes, fixed = JSON.parse(bytes.toString('utf8'));
        ensure(digest(fixed) === digest({ formatVersion: 1, title: r.title, engine: r.engine, mainFile: r.mainFile, bibliography: r.bibliography, templateId: r.templateId ?? null, sourceDigest: r.sourceDigest, files: r.files.map(({ artifactId, ...f }) => f) }), 'PUBLICATION_SOURCE_CORRUPTED', '文稿原始清单改变');
    } }
    provenance(pid, artifact) { assertDiscoveryArtifact(this.app.store, pid, artifact); if (artifact.runId) {
        const r = this.app.store.get('run', artifact.runId, pid);
        assertRunGrantRun(this.app.store, r);
        ensure(r.artifactIds.includes(artifact.id), 'PUBLICATION_SOURCE_INVALID', 'Run未归档此产物');
        const intent = this.app.store.get('run-intent', r.intentId, pid);
        return { kind: 'run', id: r.id, sourceDigest: r.manifest.snapshotDigest, manifestDigest: r.manifestDigest, approvalId: intent.approvalId };
    } const found = this.app.store.db.prepare("SELECT r.data FROM records r WHERE r.kind='sandbox-job' AND r.project_id=? AND EXISTS(SELECT 1 FROM json_each(r.data,'$.artifactIds') a WHERE a.value=?) LIMIT 2").all(pid, artifact.id); ensure(found.length <= 1, 'PUBLICATION_SOURCE_INVALID', '产物归属不唯一'); if (found.length) {
        const j = JSON.parse(found[0].data);
        return { kind: 'sandbox-job', id: j.id, sourceDigest: j.sourceDigest, manifestDigest: j.manifestDigest, approvalId: j.grantId };
    } return { kind: 'unknown' }; }
    assertSource(pid, file, verifyBytes) { const a = this.app.store.get('artifact', file.artifactId, pid); assertDiscoveryArtifact(this.app.store, pid, a); ensure(a.digest === file.digest && a.size === file.size, 'PUBLICATION_SOURCE_CORRUPTED', '文稿资产记录改变'); if (verifyBytes) {
        const { bytes } = this.app.evidence.read({ type: 'user' }, a.id);
        ensure(bytes.length === file.size, 'PUBLICATION_SOURCE_CORRUPTED', '资产长度改变');
    } const p = file.provenance; if (p.kind === 'run') {
        const r = this.app.store.get('run', p.id, pid), intent = this.app.store.get('run-intent', r.intentId, pid);
        assertRunGrantRun(this.app.store, r);
        ensure(r.artifactIds.includes(a.id) && digest(r.manifest) === p.manifestDigest && r.manifest.snapshotDigest === p.sourceDigest && intent.approvalId === p.approvalId, 'PUBLICATION_SOURCE_STALE', 'Run绑定改变');
        ensure(intent.runId === r.id && intent.status === 'submitted' && intent.manifestDigest === p.manifestDigest && digest(intent.manifest) === p.manifestDigest && digest(r.manifest.sourceFiles) === p.sourceDigest, 'PUBLICATION_SOURCE_STALE', 'Run来源清单改变');
        this.app.approvals.assert(p.approvalId, pid, intent.id, p.manifestDigest, 'run.submit');
        if (verifyBytes)
            verifySnapshot(this.app.store.paths.physical(r.manifest.snapshotPath), r.manifest.sourceFiles);
        assertExperimentSourceCurrent(this.app.store, this.app.store.get('experiment', r.experimentId, pid));
    }
    else if (p.kind === 'sandbox-job') {
        const j = this.app.store.get('sandbox-job', p.id, pid);
        ensure(j.artifactIds.includes(a.id) && j.sourceDigest === p.sourceDigest && digest(j.manifest) === p.manifestDigest && j.grantId === p.approvalId, 'PUBLICATION_SOURCE_STALE', '开发测试绑定改变');
        this.app.development.assertCurrent(j, verifyBytes);
    } }
    createRevision(actor, pid, value, validate = () => { }, key) {
        userOnly(actor);
        scope(actor, pid);
        validate();
        const request = { inputDigest: digest(value) };
        if (key) {
            const old = this.app.store.operationResult('manuscript-create:' + pid, key, request);
            if (old.found)
                return old.value;
        }
        assertProjectWritable(this.app.store, pid);
        const x = closed(value, ['title', 'engine', 'mainFile', 'bibliography', 'files'], ['templateId']), title = text(x.title, 'title', 200), engine = text(x.engine, 'engine', 20), bibliography = text(x.bibliography, 'bibliography', 20), mainFile = manuscriptPath(x.mainFile);
        ensure(['pdflatex', 'xelatex', 'lualatex'].includes(engine) && ['auto', 'none', 'bibtex', 'biber'].includes(bibliography) && mainFile.endsWith('.tex'), 'PUBLICATION_INVALID', '编译设置无效');
        const templateId = x.templateId === undefined ? undefined : text(x.templateId, 'templateId', 100);
        if (templateId)
            ensure(MANUSCRIPT_TEMPLATES.some(t => t.id === templateId), 'PUBLICATION_INVALID', '未知模板');
        ensure(Array.isArray(x.files) && x.files.length >= 1 && x.files.length <= 64, 'PUBLICATION_FILE_LIMIT', '文稿须含1至64个文件');
        let total = 0;
        const seen = [];
        const staged = x.files.map(raw => { const f = closed(raw, ['path'], ['contentBase64', 'artifactId']), path = manuscriptPath(f.path), fold = path.toLowerCase(); ensure(!seen.some(s => s === fold || s.startsWith(fold + '/') || fold.startsWith(s + '/')), 'PUBLICATION_PATH_CONFLICT', '文件路径冲突'); seen.push(fold); ensure((f.contentBase64 !== undefined) !== (f.artifactId !== undefined), 'PUBLICATION_INVALID', '文件须指定一种来源'); let bytes, artifact; if (f.artifactId !== undefined) {
            artifact = this.app.store.get('artifact', text(f.artifactId, 'artifactId', 100), pid);
            ensure(artifact.size <= 8 * 1024 * 1024, 'PUBLICATION_FILE_LIMIT', '资产超过单文件上限');
            bytes = this.app.evidence.read(actor, artifact.id).bytes;
        }
        else {
            ensure(typeof f.contentBase64 === 'string' && f.contentBase64.length <= 12 * 1024 * 1024 && f.contentBase64.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(f.contentBase64), 'PUBLICATION_INVALID', '无效base64');
            bytes = Buffer.from(f.contentBase64, 'base64');
            ensure(bytes.toString('base64') === f.contentBase64, 'PUBLICATION_INVALID', '非规范base64');
        } total += bytes.length; ensure(total <= 16 * 1024 * 1024, 'PUBLICATION_FILE_LIMIT', '文稿总量超过16 MiB'); const mediaType = manuscriptBytes(path, bytes), provenance = artifact ? this.provenance(pid, artifact) : { kind: 'unknown' }; return { path, mediaType, provenance, artifact, prepared: artifact ? undefined : this.app.evidence.prepareArtifact(pid, path, bytes, mediaType, 'manuscript') }; }).sort((a, b) => a.path.localeCompare(b.path));
        ensure(staged.some(f => f.path === mainFile), 'PUBLICATION_INVALID', '主文件不在文稿中');
        const sourceDigest = digest({ engine, mainFile, bibliography, files: staged.map(f => ({ path: f.path, digest: (f.artifact ?? f.prepared).digest, size: (f.artifact ?? f.prepared).size })) });
        const manifestPrepared = this.app.evidence.prepareArtifact(pid, 'manuscript-manifest.json', Buffer.from(JSON.stringify({ formatVersion: 1, title, engine, mainFile, bibliography, templateId: templateId ?? null, sourceDigest, files: staged.map(f => ({ path: f.path, digest: (f.artifact ?? f.prepared).digest, size: (f.artifact ?? f.prepared).size, mediaType: f.mediaType, provenance: f.provenance })) })), 'application/json', 'manuscript');
        return this.app.store.transaction(() => { validate(); assertProjectWritable(this.app.store, pid); const publish = () => { const files = staged.map(f => { const a = f.artifact ?? this.app.evidence.publishPrepared(pid, f.prepared), file = { path: f.path, artifactId: a.id, digest: a.digest, size: a.size, mediaType: f.mediaType, provenance: f.provenance }; this.assertSource(pid, file, false); return file; }); const manifestArtifact = this.app.evidence.publishPrepared(pid, manifestPrepared); const r = this.app.store.create('manuscript-revision', pid, { manifestArtifactId: manifestArtifact.id, manifestArtifactDigest: manifestArtifact.digest, title, engine, mainFile, bibliography, ...(templateId ? { templateId } : {}), sourceDigest, files }); this.app.store.event(pid, 'publication.revision_created', { revisionId: r.id, sourceDigest }); return r; }; return key ? this.app.store.operation('manuscript-create:' + pid, key, request, publish) : publish(); });
    }
    status(actor, pid) { userOnly(actor); if (pid)
        scope(actor, pid); const config = this.app.store.maybe('publication-compiler-settings', 'global'); return { version: config?.version ?? 0, configured: !!config, profileId: PUBLICATION_PROFILE, limits: { maxFiles: 64, maxSourceBytes: 16 * 1024 * 1024, maxPages: 100, ...PUBLICATION_RESOURCES }, ...(config ? { configuration: { dockerContext: config.dockerContext, imageDigest: config.imageDigest, imageId: config.imageId, profileId: config.profileId, lockDigest: config.lockDigest, scriptDigest: config.scriptDigest, dockerfileDigest: config.dockerfileDigest, profileDigest: config.profileDigest } } : {}) }; }
    async configure(actor, value, validate = () => { }, key) { userOnly(actor); if (key) {
        const old = this.app.store.operationResult('publication-compiler-configure', key, value);
        if (old.found)
            return old.value;
    } const x = closed(value, ['expectedVersion', 'dockerContext', 'imageDigest']), version = integer(x.expectedVersion, 'expectedVersion', 0), context = text(x.dockerContext, 'dockerContext', 100), image = text(x.imageDigest, 'imageDigest', 300), profile = compilerProfile(this.app.context.repoRoot); validate(); const imageId = await verifyCompilerImage(context, image, profile); validate(); return this.app.store.transaction(() => { validate(); const update = () => { const old = this.app.store.maybe('publication-compiler-settings', 'global'); ensure((old?.version ?? 0) === version, 'VERSION_CONFLICT', '解析配置已改变'); const fields = { ...profile, dockerContext: context, imageDigest: image, imageId }; if (old)
        this.app.store.update('publication-compiler-settings', 'global', old.version, fields);
    else
        this.app.store.create('publication-compiler-settings', null, fields, 'global'); return this.status(actor); }; return key ? this.app.store.operation('publication-compiler-configure', key, value, update) : update(); }); }
    get(actor, pid, id) { userOnly(actor); scope(actor, pid); return this.app.store.get('publication-build-job', id, pid); }
    prepare(actor, pid, value, key, validate = () => { }) {
        userOnly(actor);
        scope(actor, pid);
        validate();
        if (key) {
            const old = this.app.store.operationResult('publication-build-prepare:' + pid, key, value);
            if (old.found)
                return old.value;
        }
        const x = closed(value, ['revisionId']);
        assertProjectWritable(this.app.store, pid);
        const revision = this.revision(actor, pid, text(x.revisionId, 'revisionId', 100));
        this.assertRevision(revision, true);
        revision.files.forEach(f => this.assertSource(pid, f, true));
        const config = this.app.store.maybe('publication-compiler-settings', 'global');
        ensure(config, 'PUBLICATION_UNCONFIGURED', '先配置固定LaTeX编译镜像');
        const profile = compilerProfile(this.app.context.repoRoot);
        ensure(profile.profileDigest === config.profileDigest, 'PUBLICATION_PROFILE_MISMATCH', '本机编译配置改变，请重新配置镜像');
        const id = randomUUID(), root = join(this.app.context.dataDir, 'publication-jobs', id), controlDir = join(root, 'control'), outputDir = join(root, 'output'), source = join(controlDir, 'input');
        mkdirSync(source, { recursive: true, mode: 0o700 });
        mkdirSync(outputDir, { mode: 0o777 });
        chmodSync(outputDir, 0o777);
        for (const f of revision.files) {
            const bytes = this.app.evidence.read(actor, f.artifactId).bytes;
            ensure(digest(bytes) === f.digest && bytes.length === f.size, 'PUBLICATION_SOURCE_CORRUPTED', '文件字节改变');
            const path = safePath(source, 'source/' + f.path);
            mkdirSync(dirname(path), { recursive: true });
            writeFileSync(path, bytes, { mode: 0o444, flag: 'wx' });
        }
        const inputSnapshot = this.app.store.paths.referenceSnapshot(snapshotDirectory(source, join(this.app.context.dataDir, 'snapshots')));
        const manifest = { purpose: 'publication-build', revisionId: revision.id, revisionDigest: digest(revision), sourceDigest: revision.sourceDigest, engine: revision.engine, mainFile: revision.mainFile, bibliography: revision.bibliography, ...profile, dockerContext: config.dockerContext, environmentImageDigest: config.imageDigest, command: ['python', '-I', '/opt/pi-document-build/build.py', revision.engine, revision.mainFile, revision.bibliography, revision.sourceDigest, '/output'], inputSnapshot, dataArtifacts: [], resources: { ...PUBLICATION_RESOURCES } }, manifestDigest = digest(manifest);
        return this.app.store.transaction(() => { validate(); const publish = () => { validate(); assertProjectWritable(this.app.store, pid); ensure(digest(this.revision(actor, pid, revision.id)) === manifest.revisionDigest && this.app.store.get('publication-compiler-settings', 'global').version === config.version, 'PUBLICATION_SOURCE_STALE', '准备期间版本或配置改变'); revision.files.forEach(f => this.assertSource(pid, f, false)); const approval = this.app.approvals.request(pid, 'publication-build-job', id, manifestDigest, 'publication.build', '仅批准固定文稿、固定编译镜像及资源；编译成功不代表科学正确性'); this.app.store.create('publication-build-job', pid, { revisionId: revision.id, manifest, manifestDigest, approvalId: approval.id, state: 'prepared', integrity: 'pending', containerName: 'pi-publication-' + id, outputDir: this.app.store.paths.reference(outputDir), controlDir: this.app.store.paths.reference(controlDir), generation: 0, leaseUntil: 0, startRequested: false, cancelRequested: false, recoveryCount: 0, artifactIds: [] }, id); this.app.store.event(pid, 'publication.build_prepared', { jobId: id, revisionId: revision.id }); return this.inspect(actor, pid, id); }; return key ? this.app.store.operation('publication-build-prepare:' + pid, key, value, publish) : publish(); });
    }
    assertCurrent(job, verifyBytes = true) { assertProjectWritable(this.app.store, job.projectId); ensure(digest(job.manifest) === job.manifestDigest, 'PUBLICATION_JOB_CORRUPTED', '编译清单改变'); const r = this.revision({ type: 'user' }, job.projectId, job.revisionId); this.assertRevision(r, verifyBytes); ensure(digest(r) === job.manifest.revisionDigest && r.sourceDigest === job.manifest.sourceDigest, 'PUBLICATION_SOURCE_CORRUPTED', '文稿版本改变'); this.app.approvals.assert(job.approvalId, job.projectId, job.id, job.manifestDigest, 'publication.build'); r.files.forEach(f => this.assertSource(job.projectId, f, verifyBytes)); ensure(job.manifest.inputSnapshot.digest === digest(job.manifest.inputSnapshot.files) && job.manifest.inputSnapshot.files.length === r.files.length && r.files.every(f => job.manifest.inputSnapshot.files.some(s => s.path === 'source/' + f.path && s.digest === f.digest && s.size === f.size)), 'PUBLICATION_SOURCE_CORRUPTED', '编译输入快照与固定文稿不符'); if (verifyBytes)
        verifySnapshot(this.app.store.paths.physical(job.manifest.inputSnapshot.path), job.manifest.inputSnapshot.files); return r; }
    submit(actor, pid, id) { const before = this.get(actor, pid, id); if (before.state === 'prepared')
        this.assertCurrent(before, true); return this.app.store.transaction(() => { const job = this.get(actor, pid, id); if (job.state !== 'prepared')
        return this.inspect(actor, pid, id); this.assertCurrent(job, false); this.app.compute.assertEnqueue('publication', pid, job.manifest.dockerContext); this.app.store.update('publication-build-job', id, job.version, { state: 'queued' }); return this.inspect(actor, pid, id); }); }
    inspect(actor, pid, id) { const j = this.get(actor, pid, id), m = j.manifest; return { id: j.id, jobId: j.id, revisionId: j.revisionId, approvalId: j.approvalId, state: j.state, integrity: j.integrity, manifestDigest: j.manifestDigest, sourceDigest: m.sourceDigest, profileId: m.profileId, profileDigest: m.profileDigest, lockDigest: m.lockDigest, scriptDigest: m.scriptDigest, dockerfileDigest: m.dockerfileDigest, engine: m.engine, mainFile: m.mainFile, bibliography: m.bibliography, imageDigest: m.environmentImageDigest, dockerContext: m.dockerContext, resources: m.resources, generation: j.generation, startRequested: j.startRequested, cancelRequested: j.cancelRequested, exitCode: j.exitCode ?? null, artifactIds: j.artifactIds, ...(j.imageId ? { imageId: j.imageId } : {}), ...(j.resultId ? { resultId: j.resultId } : {}), ...(j.error ? { error: j.error } : {}), ...(j.startedAt ? { startedAt: j.startedAt } : {}), ...(j.endedAt ? { endedAt: j.endedAt } : {}) }; }
    jobs(actor, pid, options = {}) { userOnly(actor); scope(actor, pid); const cursor = integer(options.cursor ?? 0, 'cursor', 0, Number.MAX_SAFE_INTEGER), limit = integer(options.limit ?? 30, 'limit', 1, 100); const rows = this.app.store.db.prepare("SELECT rowid,id FROM records WHERE kind='publication-build-job' AND project_id=? AND rowid>? " + (options.revisionId ? "AND json_extract(data,'$.revisionId')=? " : '') + 'ORDER BY rowid LIMIT ?').all(pid, cursor, ...(options.revisionId ? [options.revisionId] : []), limit + 1); return { items: rows.slice(0, limit).map(r => this.inspect(actor, pid, r.id)), nextCursor: rows.length > limit ? Number(rows[limit - 1].rowid) : null }; }
    cancel(actor, pid, id) { return this.app.store.transaction(() => { const j = this.get(actor, pid, id); if (!terminal(j.state)) {
        this.app.store.update('publication-build-job', id, j.version, { cancelRequested: true });
        if (['prepared', 'queued'].includes(j.state) && !j.startRequested && !j.containerId)
            this.finalize(id, { state: 'cancelled', exitCode: null, incomplete: true });
    } return this.inspect(actor, pid, id); }); }
    result(actor, pid, id) { userOnly(actor); scope(actor, pid); const r = this.app.store.get('publication-build-result', id, pid), j = this.get(actor, pid, r.jobId); ensure(r.revisionId === j.revisionId && j.resultId === id && j.manifestDigest === r.manifestDigest && digest(j.manifest) === j.manifestDigest && r.sourceDigest === j.manifest.sourceDigest, 'PUBLICATION_RESULT_INVALID', '结果绑定改变'); ensure([r.manifestArtifactId, ...r.logs.map(a => a.artifactId), ...r.previews.map(a => a.artifactId), ...(r.pdf ? [r.pdf.artifactId] : [])].every(id => j.artifactIds.includes(id)), 'PUBLICATION_RESULT_INVALID', '结果产物不属于固定编译作业'); const { artifact, bytes } = this.app.evidence.read(actor, r.manifestArtifactId); ensure(artifact.projectId === pid && artifact.digest === r.manifestArtifactDigest, 'PUBLICATION_RESULT_INVALID', '输出清单改变'); const fixed = JSON.parse(bytes.toString('utf8')); ensure(r.profileId === fixed.profileId && r.profileDigest === j.manifest.profileDigest && r.imageId === (j.imageId ?? '') && r.engine === fixed.engine && r.bibliography === fixed.bibliography && r.engineVersion === fixed.engineVersion && r.passes === fixed.passes, 'PUBLICATION_RESULT_INVALID', '结果配置绑定改变'); ensure(fixed.sourceDigest === r.sourceDigest && digest(fixed.diagnostics) === digest(r.diagnostics) && fixed.status === r.status && fixed.hadErrors === r.hadErrors && fixed.converged === r.converged, 'PUBLICATION_RESULT_INVALID', '结果诊断绑定改变'); ensure(r.logs.length === fixed.logs.length && r.logs.every((a, i) => a.digest === fixed.logs[i].digest && a.bytes === fixed.logs[i].bytes), 'PUBLICATION_RESULT_INVALID', '日志关联改变'); if (r.pdf)
        ensure(j.state === 'succeeded' && j.integrity === 'complete' && fixed.status === 'succeeded' && !fixed.hadErrors && fixed.converged && r.pdf.digest === fixed.pdf?.digest && r.pdf.bytes === fixed.pdf.bytes && r.pdf.pages === fixed.pdf.pages && r.previews.length === fixed.previews.length, 'PUBLICATION_RESULT_INVALID', 'PDF关联改变');
    else
        ensure(r.previews.length === 0, 'PUBLICATION_RESULT_INVALID', '失败结果不能发布预览'); ensure(r.previews.every((a, i) => { const f = fixed.previews[i]; return f && a.pageNumber === f.pageNumber && a.digest === f.digest && a.bytes === f.bytes && a.width === f.width && a.height === f.height; }), 'PUBLICATION_RESULT_INVALID', '预览关联改变'); for (const a of [...r.logs, ...r.previews, ...(r.pdf ? [r.pdf] : [])]) {
        const actual = this.app.evidence.read(actor, a.artifactId);
        ensure(actual.artifact.projectId === pid && actual.artifact.digest === a.digest && actual.bytes.length === a.bytes, 'PUBLICATION_RESULT_INVALID', '结果资产改变');
    } let sourceValidity = 'current', sourceError; try {
        this.assertCurrent(j, false);
    }
    catch (e) {
        sourceValidity = 'stale';
        sourceError = e instanceof DomainError ? e.code : 'PUBLICATION_SOURCE_STALE';
    } return { ...r, sourceValidity, ...(sourceError ? { sourceError } : {}) }; }
    finalize(id, outcome) {
        let before = this.app.store.get('publication-build-job', id);
        if (terminal(before.state))
            return before;
        let state = outcome.state, integrity = outcome.incomplete ? 'incomplete' : 'complete', error = outcome.error, parsed;
        try {
            if (before.startRequested || state !== 'cancelled')
                this.assertCurrent(before, true);
        }
        catch (e) {
            if (state === 'succeeded')
                state = 'failed';
            integrity = 'invalid';
            error = e instanceof DomainError ? e.code : 'PUBLICATION_SOURCE_STALE';
        }
        try {
            if (existsSync(join(this.app.store.paths.physical(before.outputDir), 'build.json')))
                parsed = validateBuildOutput(this.app.store.paths.physical(before.outputDir), before.manifest.sourceDigest, before.manifest.engine, before.manifest.bibliography);
            if (state === 'failed' && parsed?.manifest.status === 'timed_out')
                state = 'timed_out';
            if (state === 'succeeded')
                ensure(before.startRequested && !!before.containerId && !!before.imageId && outcome.exitCode === 0 && !outcome.incomplete && !outcome.logTruncated && parsed?.manifest.status === 'succeeded', 'PUBLICATION_BUILD_FAILED', '编译未形成完整成功结果');
        }
        catch (e) {
            if (state === 'succeeded')
                state = 'failed';
            integrity = 'invalid';
            error = e instanceof DomainError ? e.code : 'PUBLICATION_OUTPUT_INVALID';
        }
        const staged = [];
        const stage = (name, bytes, mediaType) => staged.push({ name, prepared: this.app.evidence.prepareArtifact(before.projectId, name, bytes, mediaType, 'publication-build') });
        for (const name of ['stdout.log', 'stderr.log'])
            try {
                const path = safePath(this.app.store.paths.physical(before.controlDir), name);
                ensure(existsSync(path) || !before.startRequested, 'PUBLICATION_LOG_MISSING', '编译日志缺失');
                stage(name, existsSync(path) ? readStableFile(this.app.store.paths.physical(before.controlDir), name, PUBLICATION_RESOURCES.logBytes) : Buffer.alloc(0), 'text/plain');
            }
            catch {
                integrity = 'incomplete';
                if (state === 'succeeded')
                    state = 'failed';
            }
        if (!parsed && existsSync(join(this.app.store.paths.physical(before.outputDir), 'build.log')))
            try {
                stage('build.log', readStableFile(this.app.store.paths.physical(before.outputDir), 'build.log', PUBLICATION_RESOURCES.logBytes), 'text/plain');
            }
            catch {
                integrity = 'incomplete';
                if (state === 'succeeded')
                    state = 'failed';
            }
        if (parsed) {
            for (const [name, bytes] of parsed.files)
                if (name === 'build.json' || name === 'build.log' || state === 'succeeded' && integrity === 'complete')
                    stage(name, bytes, name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.png') ? 'image/png' : name.endsWith('.json') ? 'application/json' : 'text/plain');
        }
        return this.app.store.transaction(() => {
            let job = this.app.store.get('publication-build-job', id);
            if (terminal(job.state))
                return job;
            ensure(job.version === before.version && (outcome.generation === undefined || job.generation === outcome.generation && job.leaseUntil > Date.now()), 'LEASE_EXPIRED', '编译监管器失去租约');
            if (job.startRequested)
                try {
                    this.assertCurrent(job, false);
                }
                catch {
                    state = 'failed';
                    integrity = 'invalid';
                    error = 'PUBLICATION_SOURCE_STALE';
                }
            const archived = new Map(staged.map(s => [s.name, this.app.evidence.publishPrepared(job.projectId, s.prepared)])), artifactIds = [...archived.values()].map(a => a.id);
            let resultId;
            if (parsed) {
                const m = parsed.manifest, ma = archived.get('build.json'), good = state === 'succeeded' && integrity === 'complete' && !outcome.logTruncated;
                resultId = digest({ jobId: id, manifestDigest: job.manifestDigest });
                const ref = (f) => ({ artifactId: archived.get(f.file).id, digest: f.digest, bytes: f.bytes });
                this.app.store.create('publication-build-result', job.projectId, { ...m, revisionId: job.revisionId, jobId: id, manifestDigest: job.manifestDigest, profileDigest: job.manifest.profileDigest, imageId: job.imageId ?? '', manifestArtifactId: ma.id, manifestArtifactDigest: ma.digest, pdf: good && m.pdf ? { ...ref(m.pdf), pages: m.pdf.pages } : null, previews: good ? m.previews.map(p => ({ ...ref(p), pageNumber: p.pageNumber, width: p.width, height: p.height })) : [], logs: m.logs.map(ref) }, resultId);
            }
            job = this.app.store.update('publication-build-job', id, job.version, { state, integrity, exitCode: outcome.exitCode, error, artifactIds, ...(resultId ? { resultId } : {}), logTruncated: outcome.logTruncated, endedAt: new Date().toISOString(), leaseUntil: 0 });
            this.app.store.event(job.projectId, 'publication.build_finished', { jobId: id, state, integrity, resultId });
            return job;
        });
    }
    tick() {
        if (this.stopped)
            return;
        this.app.compute.tick();
        for (const id of this.app.compute.queued('publication')) {
            const j = this.app.store.get('publication-build-job', id);
            try {
                this.assertCurrent(j, false);
            }
            catch {
                this.finalize(id, { state: 'failed', exitCode: null, incomplete: true, error: 'PUBLICATION_APPROVAL_OR_SOURCE_STALE' });
            }
        }
        for (const id of this.app.compute.candidates('publication')) {
            const j = this.app.compute.withAdmission('publication', id, () => { const old = this.app.store.get('publication-build-job', id); if (terminal(old.state) || old.state === 'prepared' || old.state !== 'queued' && old.leaseUntil > Date.now())
                return null; if (old.state === 'queued')
                this.assertCurrent(old, false); return this.app.store.update('publication-build-job', id, old.version, { state: old.state === 'queued' ? 'starting' : old.state, generation: old.generation + 1, recoveryCount: old.recoveryCount + (old.generation ? 1 : 0), leaseUntil: Date.now() + 60000 }); });
            if (!j)
                continue;
            const child = spawn(process.execPath, [fileURLToPath(new URL('../../apps/publication-worker/index.js', import.meta.url)), this.app.context.dataDir, this.app.context.repoRoot, j.id, String(j.generation)], { shell: false, windowsHide: true, detached: true, stdio: 'ignore', env: dockerEnv() });
            child.on('error', () => { try {
                this.app.store.transaction(() => { const r = this.app.store.get('publication-build-job', j.id); if (r.generation === j.generation)
                    this.app.store.update('publication-build-job', r.id, r.version, { leaseUntil: 0, error: 'PUBLICATION_WORKER_UNAVAILABLE' }); });
            }
            catch { } });
            child.unref();
            break;
        }
    }
    async stop() { this.stopped = true; }
}
//# sourceMappingURL=build-service.js.map