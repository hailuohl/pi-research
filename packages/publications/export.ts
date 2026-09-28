import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve, sep} from 'node:path';
import type {AppContext} from '../domain/context.js';
import type {Actor, Artifact, Row} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {scope, userOnly} from '../policy/permissions.js';
import {object, text} from '../contracts/validation.js';
import {digest} from '../storage/store.js';
import {safePath} from '../workspace/files.js';
import {readStableFile} from '../workspace/stable-file.js';
import type {EvidenceService} from '../evidence/service.js';
import type {ReportService} from './reports.js';
import type {ReportExportCollection, ReportExportManifest} from './report-types.js';

const run = promisify(execFile), MAX_INPUT = 30 * 1024 * 1024, MAX_ARCHIVE = 32 * 1024 * 1024;
const README = `Pi Research fixed-source export\n\nreport.md contains the saved report. manifest.json binds the selected fixed source, archived results and review evidence. Mutable workspaces and local configuration are not included.\n\nFor PDF evidence, bindings.documents records the acquired version, source, license provenance, parser identity and cited pages. Each artifact descriptor resolves to artifacts/<digest>; verify its size and SHA-256 against manifest.files. The original PDF, cited page text/images and parser output manifest retain their original bytes. Only cited page derivatives are included, so uncited pages listed in the parser manifest may not be packaged. Text ranges use UTF-16 code units and physical page numbers are one-based. An unknown license remains unknown; this local package does not establish redistribution permission.\n\nSource modes are logical Git modes (100644 / 100755) recorded in the manifest. Windows tar headers do not reliably preserve executable bits; restore those modes from the manifest on platforms that support them. A successful process does not prove a scientific hypothesis.\n`;
interface Receipt {reportId: string; requestKey: string; artifactId: string; contentDigest: string; archiveDigest: string;}

export class ExportService {
    constructor(private c: AppContext, private reports: ReportService, private evidence: EvidenceService) {}
    async create(actor: Actor, pid: string, value: unknown, requestKey: string, validate: () => void = () => {}): Promise<Row<Artifact>> {
        userOnly(actor); scope(actor, pid); const input = object(value);
        ensure(Object.keys(input).every(k => k === 'reportId'), 'INVALID_INPUT', '导出只接受报告 ID', 400);
        const reportId = text(input.reportId, 'reportId', 100); text(requestKey, 'requestKey', 200); validate();
        const id = digest({projectId: pid, reportId, requestKey});
        const cached = () => {
            const receipt = this.c.store.maybe<Receipt>('report-export', id);
            if (!receipt) return undefined;
            ensure(receipt.projectId === pid && receipt.reportId === reportId && receipt.requestKey === requestKey, 'IDEMPOTENCY_CONFLICT', '导出回执请求绑定不符');
            const {artifact} = this.evidence.read(actor, receipt.artifactId);
            ensure(artifact.projectId === pid && artifact.digest === receipt.archiveDigest, 'ARTIFACT_CORRUPTED', '导出回执与成果文件不符');
            return artifact;
        };
        const existing = cached(); if (existing) return existing;
        const secretValues = [...new Set(Object.entries(process.env).filter(([key, value]) => /token|password|secret|api[_-]?key/i.test(key) && value && value.length >= 8).flatMap(([, value]) => [value!, JSON.stringify(value).slice(1, -1)]))];
        const checkSecrets = (path: string, bytes: Buffer) => {
            const found = secretValues.some(value => bytes.includes(Buffer.from(value)) || path.includes(value));
            const safeName = secretValues.reduce((name, value) => name.replaceAll(value, '[redacted]'), path);
            ensure(!found, 'EXPORT_SECRET_DETECTED', `导出内容包含当前配置的凭据：${safeName}`, 400);
        };
        const collect = () => {
            const collected: ReportExportCollection = this.reports.collectExport(actor, pid, reportId);
            const manifest = JSON.parse(JSON.stringify(collected.manifest)) as ReportExportManifest;
            const paths = new Set<string>(); let total = 0;
            const files = collected.files.map(file => {
                ensure(file.path && !/[\x00-\x1f\\:]/.test(file.path) && !file.path.startsWith('/') && file.path.split('/').every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p)), 'EXPORT_PATH_DENIED', '导出文件路径不安全', 400);
                ensure(!['manifest.json', 'readme.md'].includes(file.path.toLowerCase()) && !paths.has(file.path.toLowerCase()), 'EXPORT_PATH_DENIED', '导出文件路径冲突', 400); paths.add(file.path.toLowerCase());
                ensure(file.mode === undefined || file.mode === '100644' || file.mode === '100755', 'EXPORT_MODE_DENIED', '导出只接受普通文件模式', 400);
                const bytes = Buffer.from(file.bytes); total += bytes.length; ensure(total <= MAX_INPUT, 'EXPORT_TOO_LARGE', '导出输入超过 30 MiB', 413); checkSecrets(file.path, bytes);
                return {path: file.path, bytes, mode: file.mode, digest: digest(bytes), size: bytes.length};
            }).sort((a,b) => a.path.localeCompare(b.path));
            ensure(files.some(file => file.path === 'report.md'), 'EXPORT_REPORT_MISSING', '导出缺少固定报告正文');
            const manifestBytes = Buffer.from(JSON.stringify({...manifest, files: files.map(({bytes, ...file}) => file)}, null, 2)); checkSecrets('manifest.json', manifestBytes);
            ensure(total + manifestBytes.length + Buffer.byteLength(README) <= MAX_INPUT, 'EXPORT_TOO_LARGE', '导出输入超过 30 MiB', 413);
            const contentDigest = digest({manifest, files: files.map(({bytes, ...file}) => file)});
            return {manifest, manifestBytes, files, contentDigest};
        };
        const collection = collect();
        const root = safePath(resolve(this.c.dataDir), 'exports/tmp'); mkdirSync(root, {recursive: true, mode: 0o700});
        const temporary = mkdtempSync(join(root, 'report-'));
        try {
            const staging = join(temporary, 'files'); mkdirSync(staging, {mode: 0o700});
            const files = [...collection.files, {path: 'manifest.json', bytes: collection.manifestBytes, mode: '100644' as const}, {path: 'README.md', bytes: Buffer.from(README), mode: '100644' as const}];
            for (const file of files) {
                const destination = safePath(staging, file.path); mkdirSync(dirname(destination), {recursive: true, mode: 0o700});
                writeFileSync(destination, file.bytes, {flag: 'wx', mode: file.mode === '100755' ? 0o755 : 0o644});
                chmodSync(destination, file.mode === '100755' ? 0o755 : 0o644);
            }
            const listPath = join(temporary, 'files.list'), archivePath = join(temporary, 'report.tar.gz');
            writeFileSync(listPath, Buffer.from(files.map(file => `./${file.path}\0`).join('')), {flag: 'wx', mode: 0o600});
            const env = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
            try {await run(process.platform === 'win32' ? 'C:/WINDOWS/system32/tar.exe' : 'tar', ['-czf', archivePath, '-C', staging, '--null', '-T', listPath], {shell: false, windowsHide: true, env, timeout: 30000, maxBuffer: 1024 * 1024});}
            catch (error) {ensure((error as NodeJS.ErrnoException).code !== 'ENOENT', 'EXPORT_TAR_UNAVAILABLE', '当前环境未安装可用的原生 tar；成果未发布', 503); ensure(false, 'EXPORT_ARCHIVE_FAILED', '本地 tar 压缩失败；成果未发布', 500);}
            const bytes = readStableFile(temporary, 'report.tar.gz', MAX_ARCHIVE);
            validate(); const published = cached(); if (published) return published;
            const checked = collect();
            ensure(checked.contentDigest === collection.contentDigest, 'EXPORT_SOURCE_CHANGED', '压缩期间报告来源或固定内容发生变化，成果未发布');
            return this.c.store.transaction(() => {
                validate(); const existing = cached(); if (existing) return existing;
                this.reports.assertExportCurrent(actor, pid, reportId, collection.manifest.bindingsDigest, collection.manifest.stateDigest);
                const artifact = this.evidence.put(pid, `report-${reportId}.tar.gz`, bytes, 'application/gzip', 'report-export');
                this.c.store.create<Receipt>('report-export', pid, {reportId, requestKey, artifactId: artifact.id, contentDigest: collection.contentDigest, archiveDigest: artifact.digest}, id);
                this.c.store.event(pid, 'report.exported', {reportId, artifactId: artifact.id, contentDigest: collection.contentDigest});
                return artifact;
            });
        } finally {
            // Resolve and verify the actual temporary directory before recursive cleanup on Windows.
            if (existsSync(temporary)) {
                safePath(resolve(this.c.dataDir), 'exports/tmp');
                const base = realpathSync.native(root), target = realpathSync.native(temporary);
                ensure(!lstatSync(temporary).isSymbolicLink() && target.startsWith(base + sep) && dirname(target) === base, 'EXPORT_CLEANUP_PATH_DENIED', '临时导出目录边界校验失败', 500);
                rmSync(target, {recursive: true, force: true});
            }
        }
    }
}
