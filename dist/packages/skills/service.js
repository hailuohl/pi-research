import { readFileSync, lstatSync, realpathSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { crc32, inflateSync } from 'node:zlib';
import { ensure } from '../domain/errors.js';
import { object, text, strings, integer, oneOf } from '../contracts/validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertProjectWritable, assertProjectReadable } from '../policy/lifecycle.js';
import { digest } from '../storage/store.js';
import { SKILL_MANIFEST, BUNDLE_ID } from './manifest.js';
import { BUILTIN_RELEASES } from './releases.js';
import { decodeSkillArchive } from './archive.js';
const ROLES = ['coordinator', 'literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer'];
const MAX_FILE = 128 * 1024, MAX_TOTAL = 2 * 1024 * 1024;
const MAX_PNG_EDGE = 4096, MAX_PNG_PIXELS = 16_777_216, MAX_PNG_DECODED = 32 * 1024 * 1024, PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
function content(bytes) { try {
    const value = utf8.decode(bytes);
    ensure(!value.includes('\0'), 'SKILL_TEXT_INVALID', '技能资源必须是 UTF-8 文本', 400);
    return value;
}
catch {
    ensure(false, 'SKILL_TEXT_INVALID', '技能资源必须是有效 UTF-8 文本', 400);
} }
function base64(value, max) { const s = text(value, 'contentBase64', Math.ceil(max / 3) * 4, true); ensure(s.length % 4 === 0 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s), 'SKILL_ENCODING_INVALID', '需要规范 Base64 内容', 400); const bytes = Buffer.from(s, 'base64'); ensure(bytes.length <= max, 'SKILL_TOO_LARGE', '技能资源超过大小限制', 413); return bytes; }
function resourcePath(value) { const p = text(value, 'path', 200); ensure(!p.includes('\\') && !p.startsWith('/') && !isAbsolute(p) && p === p.normalize('NFC'), 'SKILL_PATH_DENIED', '仅允许规范相对路径', 400); const parts = p.split('/'); ensure(parts.every(s => s && s !== '.' && s !== '..' && !/[\x00-\x1f\x7f:<>"|?*]/.test(s) && !/[. ]$/.test(s) && !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(s)), 'SKILL_PATH_DENIED', '技能路径包含不安全名称', 400); ensure(!parts.some(s => ['.pi', '.git', '.codex', 'hooks', 'extensions'].includes(s.toLowerCase()) || /^agents(?:\.|$)/i.test(s)), 'SKILL_PATH_DENIED', '不能导入项目配置、AGENTS、扩展或 hooks', 400); return p; }
function canonicalPngPath(path) { return /^assets\/(?:[^/]+\/)*[^/]+\.png$/.test(path); }
function validatePng(bytes) {
    const invalid = (ok) => ensure(ok, 'SKILL_IMAGE_INVALID', '静态图像不是结构有效的 PNG 文件', 400);
    invalid(bytes.length >= PNG_SIGNATURE.length + 25 + 12 && bytes.subarray(0, 8).equals(PNG_SIGNATURE));
    let offset = 8, seenHeader = false, seenPalette = false, seenIdat = false, idatEnded = false, idatSize = 0, colorType = 0, bitDepth = 0, width = 0, height = 0, interlace = 0;
    const idat = [];
    while (offset < bytes.length) {
        invalid(offset + 12 <= bytes.length);
        const size = bytes.readUInt32BE(offset), end = offset + 12 + size;
        invalid(end <= bytes.length);
        const type = bytes.toString('latin1', offset + 4, offset + 8), typeBytes = bytes.subarray(offset + 4, offset + 8);
        invalid(/^[A-Za-z]{4}$/.test(type) && typeBytes[2] >= 65 && typeBytes[2] <= 90 && crc32(bytes.subarray(offset + 4, offset + 8 + size)) === bytes.readUInt32BE(offset + 8 + size));
        invalid(!['acTL', 'fcTL', 'fdAT'].includes(type));
        const data = offset + 8;
        if (!seenHeader) {
            invalid(type === 'IHDR' && size === 13);
            width = bytes.readUInt32BE(data);
            height = bytes.readUInt32BE(data + 4);
            bitDepth = bytes[data + 8];
            colorType = bytes[data + 9];
            interlace = bytes[data + 12];
            const depths = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
            invalid(width > 0 && height > 0 && width <= MAX_PNG_EDGE && height <= MAX_PNG_EDGE && width * height <= MAX_PNG_PIXELS && !!depths[colorType]?.includes(bitDepth) && bytes[data + 10] === 0 && bytes[data + 11] === 0 && interlace <= 1);
            seenHeader = true;
        }
        else
            invalid(type !== 'IHDR');
        if (type === 'IDAT') {
            invalid(!idatEnded && (colorType !== 3 || seenPalette));
            seenIdat = true;
            idatSize += size;
            idat.push(bytes.subarray(data, data + size));
        }
        else if (seenIdat)
            idatEnded = true;
        if (type === 'PLTE') {
            invalid(!seenPalette && !seenIdat && colorType !== 0 && colorType !== 4 && size >= 3 && size <= 768 && size % 3 === 0 && (colorType !== 3 || size / 3 <= 2 ** bitDepth));
            seenPalette = true;
        }
        if (type === 'IEND') {
            invalid(size === 0 && seenIdat && idatSize > 0 && (colorType !== 3 || seenPalette) && end === bytes.length);
            const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
            const passes = interlace ? [[0, 0, 8, 8], [4, 0, 8, 8], [0, 4, 4, 8], [2, 0, 4, 4], [0, 2, 2, 4], [1, 0, 2, 2], [0, 1, 1, 2]] : [[0, 0, 1, 1]];
            const rows = [];
            let decodedLength = 0;
            for (const [x, y, dx, dy] of passes) {
                const passWidth = width > x ? Math.ceil((width - x) / dx) : 0, passHeight = height > y ? Math.ceil((height - y) / dy) : 0;
                if (!passWidth || !passHeight)
                    continue;
                const length = 1 + Math.ceil(passWidth * channels[colorType] * bitDepth / 8);
                decodedLength += length * passHeight;
                invalid(decodedLength <= MAX_PNG_DECODED);
                rows.push({ length, count: passHeight });
            }
            try {
                const compressed = Buffer.concat(idat), result = inflateSync(compressed, { info: true, maxOutputLength: decodedLength });
                invalid(result.engine.bytesWritten === compressed.length && result.buffer.length === decodedLength);
                let at = 0;
                for (const row of rows)
                    for (let i = 0; i < row.count; i++, at += row.length)
                        invalid(result.buffer[at] <= 4);
            }
            catch {
                invalid(false);
            }
            return;
        }
        const critical = typeBytes[0] >= 65 && typeBytes[0] <= 90;
        invalid(!critical || ['IHDR', 'PLTE', 'IDAT', 'IEND'].includes(type));
        offset = end;
    }
    invalid(false);
}
function revisionBody(r) { return { packageId: r.packageId, revisionTag: r.revisionTag, description: r.description, roles: r.roles, license: r.license, requirements: r.requirements, files: r.files, authorization: r.authorization }; }
/** Only explicit reviewed packages. Project .pi / AGENTS files are never discovered. */
export class SkillService {
    root;
    context;
    bundleId = BUNDLE_ID;
    constructor(root, context) {
        this.root = root;
        this.context = context;
    }
    get c() { ensure(this.context, 'SKILL_MANAGEMENT_UNAVAILABLE', '当前技能服务未配置持久存储', 503); return this.context; }
    builtin(bundleId) {
        if (bundleId === BUNDLE_ID)
            return { bundleId, skills: SKILL_MANIFEST, archived: false };
        const release = BUILTIN_RELEASES.find(r => r.bundleId === bundleId);
        ensure(release, 'SKILL_BUNDLE_UNKNOWN', '未找到此固定内置技能发行；拒绝替换为当前版本', 404);
        ensure(digest(JSON.stringify(release.skills)) === release.manifestDigest, 'SKILL_INTEGRITY_FAILED', '内置技能发行元数据摘要不匹配');
        this.verified(join('skills/releases', bundleId, 'manifest.json'), digest(Buffer.from(JSON.stringify(release, null, 2) + '\n')));
        return { ...release, archived: true };
    }
    builtinReleases() { return [...new Set([BUNDLE_ID, ...BUILTIN_RELEASES.map(r => r.bundleId)])].map(bundleId => ({ bundleId, current: bundleId === BUNDLE_ID, skillCount: this.builtin(bundleId).skills.length })); }
    list(role, builtinBundleId = BUNDLE_ID) { return this.builtin(builtinBundleId).skills.filter(e => e.roles.includes(role)).map(e => ({ id: e.id, description: e.description, digest: e.digest, resources: e.resources.map(r => r.path), ...('source' in e ? { source: e.source } : {}) })); }
    verifiedBytes(path, expected, rootPath = this.root) { const root = realpathSync(rootPath), target = resolve(root, path), rel = relative(root, target); ensure(rel !== '..' && !rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) && !isAbsolute(rel), 'SKILL_PATH_DENIED', '技能路径不在受管目录', 403); let current = root; for (const segment of rel.split(/[\\/]/)) {
        current = join(current, segment);
        ensure(existsSync(current), 'SKILL_INTEGRITY_FAILED', '固定技能文件缺失；拒绝替换为当前版本');
        ensure(!lstatSync(current).isSymbolicLink(), 'SKILL_PATH_DENIED', '技能路径不能包含符号链接', 403);
    } const stat = lstatSync(target); ensure(stat.isFile(), 'SKILL_PATH_DENIED', '技能不是普通文件', 403); ensure(stat.size <= MAX_FILE, 'SKILL_TOO_LARGE', '技能资源超过大小限制', 413); const bytes = readFileSync(target); ensure(bytes.length <= MAX_FILE && digest(bytes) === expected, 'SKILL_INTEGRITY_FAILED', '受管技能摘要不匹配；拒绝加载未审核内容'); return bytes; }
    verified(path, expected, rootPath = this.root) { return content(this.verifiedBytes(path, expected, rootPath)); }
    builtinText(role, id, resource, builtinBundleId = BUNDLE_ID) { const release = this.builtin(builtinBundleId), e = release.skills.find(e => e.id === id); ensure(e, 'SKILL_NOT_FOUND', '技能不在受管清单内', 404); ensure(e.roles.includes(role), 'SKILL_SCOPE_DENIED', '该角色无此技能入口', 403); const r = resource ? e.resources.find(r => r.path === resource) : undefined; ensure(!resource || r, 'SKILL_RESOURCE_NOT_FOUND', '资源不在受管清单内', 404); const hash = r?.digest ?? e.digest, path = release.archived ? join('skills/releases', builtinBundleId, 'blobs', hash) : resource ? join(dirname(e.path), resource) : e.path; const requirements = r && 'methodRequirements' in r ? r.methodRequirements : undefined; return { id, resource: resource ?? 'SKILL.md', content: this.verified(path, hash), digest: hash, bundleId: builtinBundleId, ...('source' in e ? { source: e.source } : {}), ...(requirements ? { methodRequirements: [...requirements] } : {}) }; }
    bundleMethodRequirements(pid, role, bundleId) { this.ensureBundleRuntimeCompatible(pid, bundleId); const { builtinBundleId, disabledBuiltinIds } = this.resolveBundle(pid, bundleId), requirements = new Set(); for (const skill of this.builtin(builtinBundleId).skills) {
        if (disabledBuiltinIds.includes(skill.id) || !skill.roles.includes(role))
            continue;
        for (const resource of skill.resources)
            if ('methodRequirements' in resource)
                for (const requirement of this.builtinText(role, skill.id, resource.path, builtinBundleId).methodRequirements ?? [])
                    requirements.add(requirement);
    } return [...requirements].sort(); }
    prerequisites(builtinBundleId, id) { const entry = this.builtin(builtinBundleId).skills.find(e => e.id === id); return entry && 'prerequisites' in entry ? entry.prerequisites : []; }
    contextualRead(target, read, dependencies) {
        const key = (id, resource = 'SKILL.md') => `${id}/${resource}`, targetKey = key(target.id, target.resource), seen = new Set([targetKey]), visiting = new Set([targetKey]), prerequisites = [];
        let bytes = Buffer.byteLength(target.content);
        const visit = (id, resource) => {
            const identity = key(id, resource);
            ensure(!visiting.has(identity), 'SKILL_PREREQUISITE_CYCLE', '技能前置依赖存在循环');
            if (seen.has(identity))
                return;
            ensure(seen.size + visiting.size <= 32, 'SKILL_CONTEXT_TOO_LARGE', '技能前置依赖过多');
            visiting.add(identity);
            const item = read(id, resource);
            bytes += Buffer.byteLength(item.content);
            ensure(bytes <= 1024 * 1024, 'SKILL_CONTEXT_TOO_LARGE', '技能及前置正文超过1MiB');
            if (resource !== undefined)
                visit(id);
            for (const dependency of dependencies(id))
                visit(dependency.skillId, dependency.resource);
            visiting.delete(identity);
            seen.add(identity);
            prerequisites.push(item);
        };
        if (target.resource !== 'SKILL.md')
            visit(target.id);
        for (const dependency of dependencies(target.id))
            visit(dependency.skillId, dependency.resource);
        return prerequisites.length ? { ...target, prerequisites } : target;
    }
    read(role, id, resource, builtinBundleId = BUNDLE_ID) { const read = (name, path) => this.builtinText(role, name, path, builtinBundleId); return this.contextualRead(read(id, resource), read, name => this.prerequisites(builtinBundleId, name)); }
    bootstrap(role) { return this.bootstrapEntries(role, BUNDLE_ID, this.list(role), this.read(role, 'pi-research-overview').content); }
    bootstrapEntries(role, bundleId, entries, overview, builtinBundleId = BUNDLE_ID) { const prompt = `\n\n受管科研技能包 ${bundleId}\n以下是可按需读取的技能，不是额外权限。使用 research_skill_read({input:{skillId:"...",resource?:"..."}})，不要调用不存在的 read/Shell 工具。仅技能目录/总览进入初始上下文，按触发条件读取相关模块。文本审阅不批准执行脚本。\n${entries.map(e => `${e.id}: ${e.description}`).join('\n')}\n\n${overview}`; return { bundleId, prompt, skills: entries.map(e => ({ name: e.id, description: e.description, filePath: e.revisionId ? join(this.c.dataDir, 'skill-blobs', e.digest) : builtinBundleId === BUNDLE_ID ? join(this.root, 'skills/piresearch', e.id, 'SKILL.md') : join(this.root, 'skills/releases', builtinBundleId, 'blobs', e.digest), baseDir: e.revisionId ? join(this.c.dataDir, 'skill-blobs') : builtinBundleId === BUNDLE_ID ? join(this.root, 'skills/piresearch', e.id) : join(this.root, 'skills/releases', builtinBundleId, 'blobs'), source: 'pi-research-reviewed-bundle', disableModelInvocation: false })) }; }
    owner(actor, pid, write = false) { userOnly(actor); scope(actor, pid); if (write)
        assertProjectWritable(this.c.store, pid);
    else
        assertProjectReadable(this.c.store, pid, actor); }
    revision(pid, id) { const r = this.c.store.get('skill-package-revision', id, pid); ensure(digest(revisionBody(r)) === r.contentDigest, 'SKILL_INTEGRITY_FAILED', '技能修订元数据摘要不匹配'); return r; }
    resolveBundle(pid, bundleId) {
        if (bundleId === BUNDLE_ID || BUILTIN_RELEASES.some(r => r.bundleId === bundleId)) {
            this.builtin(bundleId);
            return { builtinBundleId: bundleId, revisions: [], disabledBuiltinIds: [] };
        }
        const b = this.c.store.maybe('skill-bundle', bundleId);
        ensure(b, 'SKILL_BUNDLE_UNKNOWN', '未找到此固定技能包；拒绝替换为当前版本', 404);
        ensure(b.projectId === pid, 'SCOPE_DENIED', '技能包不属于当前项目', 403);
        ensure(digest({ projectId: pid, builtinBundleId: b.builtinBundleId, revisionIds: b.revisionIds, ...(b.disabledBuiltinIds?.length ? { disabledBuiltinIds: b.disabledBuiltinIds } : {}) }) === b.contentDigest && b.id === b.contentDigest, 'SKILL_INTEGRITY_FAILED', '技能包清单摘要不匹配');
        this.builtin(b.builtinBundleId);
        const revisions = b.revisionIds.map(id => this.revision(pid, id)), disabledBuiltinIds = this.disabledIds(b.builtinBundleId, b.disabledBuiltinIds ?? []);
        this.noCollisions(b.builtinBundleId, revisions);
        return { builtinBundleId: b.builtinBundleId, revisions, disabledBuiltinIds };
    }
    disabledIds(builtinBundleId, ids) { const builtin = this.builtin(builtinBundleId); ensure(new Set(ids).size === ids.length, 'INVALID_INPUT', '禁用技能不能重复', 400); ensure(ids.every(id => builtin.skills.some(e => e.id === id)), 'SKILL_NOT_FOUND', '禁用技能不在所选内置发行内', 404); return [...ids].sort(); }
    noCollisions(builtinBundleId, revisions) { const builtin = this.builtin(builtinBundleId); ensure(new Set(revisions.map(r => r.packageId)).size === revisions.length && !revisions.some(r => builtin.skills.some(e => e.id === r.packageId)), 'SKILL_DUPLICATE_PACKAGE', '固定技能包不能包含重名技能', 400); }
    approved(pid, r) { const reviews = this.c.store.list('skill-review', pid).filter(x => x.revisionId === r.id); ensure(reviews.at(-1)?.decision === 'approved' && reviews.at(-1)?.contentDigest === r.contentDigest, 'SKILL_NOT_APPROVED', '技能修订尚未通过用户审阅'); ensure(!this.c.store.list('skill-revocation', pid).some(x => x.revisionId === r.id), 'SKILL_REVOKED', '技能版本已撤销，不能启动或启用'); }
    import(actor, pid, input, key) {
        this.owner(actor, pid);
        text(key, 'Idempotency-Key', 200);
        const op = `skill-import:${pid}`, request = { inputDigest: digest(input) }, old = this.c.store.operationResult(op, key, request);
        if (old.found)
            return old.value;
        this.owner(actor, pid, true);
        const x = object(input), packageId = text(x.packageId, 'packageId', 100);
        ensure(/^[a-z][a-z0-9-]{0,99}$/.test(packageId) && ![SKILL_MANIFEST, ...BUILTIN_RELEASES.map(r => r.skills)].some(entries => entries.some(e => e.id === packageId)), 'SKILL_PACKAGE_ID_INVALID', '技能名称必须是小写字母数字连字符，不能覆盖内置技能', 400);
        const roles = strings(x.roles, 'roles', 7).map(r => oneOf(r, ROLES, 'roles'));
        ensure(roles.length > 0 && new Set(roles).size === roles.length, 'INVALID_INPUT', '至少指定一个不重复角色', 400);
        const req = object(x.requirements), requirements = { tools: strings(req.tools, 'tools', 100), backends: strings(req.backends, 'backends', 30), artifactIds: strings(req.artifactIds, 'artifactIds', 64) };
        ensure((x.files !== undefined) !== (x.zipBase64 !== undefined), 'INVALID_INPUT', 'files 与 zipBase64 必须且只能提供一种', 400);
        let raw;
        if (x.zipBase64 !== undefined)
            raw = decodeSkillArchive(base64(x.zipBase64, MAX_TOTAL));
        else {
            ensure(Array.isArray(x.files) && x.files.length <= 64, 'SKILL_FILE_LIMIT', '最多导入 64 个文件', 400);
            raw = x.files.map(value => { const f = object(value); return { path: resourcePath(f.path), bytes: base64(f.contentBase64, MAX_FILE) }; });
        }
        ensure(raw.length > 0 && raw.length <= 64, 'SKILL_FILE_LIMIT', '技能包必须包含 1–64 个文件', 400);
        const names = new Set();
        let total = 0;
        const staged = raw.map(f => { const path = resourcePath(f.path), lower = path.toLowerCase(); ensure(!names.has(lower), 'SKILL_PATH_DENIED', '技能包存在重复或大小写冲突路径', 400); names.add(lower); ensure(f.bytes.length <= MAX_FILE && (total += f.bytes.length) <= MAX_TOTAL, 'SKILL_TOO_LARGE', '单文件最多 128 KiB，技能包展开最多 2 MiB', 413); const mediaType = canonicalPngPath(path) ? 'image/png' : undefined; if (mediaType)
            validatePng(f.bytes);
        else
            content(f.bytes); return { path, bytes: f.bytes, digest: digest(f.bytes), size: f.bytes.length, ...(mediaType ? { mediaType } : {}) }; }).sort((a, b) => a.path.localeCompare(b.path));
        ensure(staged.some(f => f.path === 'SKILL.md' && f.size > 0), 'SKILL_ENTRY_REQUIRED', '技能包需要非空根 SKILL.md', 400);
        for (const name of names) {
            const parts = name.split('/');
            for (let i = 1; i < parts.length; i++)
                ensure(!names.has(parts.slice(0, i).join('/')), 'SKILL_PATH_DENIED', '文件不能同时作为目录', 400);
        }
        const body = { packageId, revisionTag: text(x.revisionTag, 'revisionTag', 100), description: text(x.description, 'description', 2000), roles, license: x.license === null ? null : text(x.license, 'license', 2000), requirements, files: staged.map(({ path, digest, size, mediaType }) => ({ path, digest, size, ...(mediaType ? { mediaType } : {}) })), authorization: staged.some(f => f.mediaType === 'image/png') ? 'text-with-static-assets' : 'text-only' };
        const prepared = { ...body, contentDigest: digest(body) }, dir = join(this.c.dataDir, 'skill-blobs');
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        ensure(lstatSync(dir).isDirectory() && !lstatSync(dir).isSymbolicLink(), 'SKILL_PATH_DENIED', '技能存储目录不能是链接', 403);
        // Bounded hashing and CAS staging happen before SQLite publication. Never execute package bytes.
        for (const f of staged) {
            const path = join(dir, f.digest);
            try {
                writeFileSync(path, f.bytes, { flag: 'wx', mode: 0o444 });
            }
            catch (e) {
                if (e.code !== 'EEXIST')
                    throw e;
            }
            this.verifiedBytes(path, f.digest, this.c.dataDir);
        }
        return this.c.store.operation(op, key, request, () => { this.owner(actor, pid, true); ensure(this.c.store.list('skill-package-revision', pid).length < 128, 'SKILL_REVISION_LIMIT', '每项目最多保存 128 个技能修订', 409); const r = this.c.store.create('skill-package-revision', pid, prepared); this.c.store.event(pid, 'skill.imported', { revisionId: r.id, contentDigest: r.contentDigest }); return r; });
    }
    upload(actor, pid, input, key) {
        this.owner(actor, pid);
        return this.c.store.operation(`skill-upload:${pid}`, key, { inputDigest: digest(input) }, () => {
            this.owner(actor, pid, true);
            const revision = this.import(actor, pid, input, digest({ operation: 'skill-upload', step: 'import', key }));
            return this.enable(actor, pid, { revisionId: revision.id, expectedVersion: this.configuration(pid).version }, digest({ operation: 'skill-upload', step: 'enable', key }));
        });
    }
    enable(actor, pid, value, key) {
        this.owner(actor, pid);
        const x = object(value), input = { revisionId: text(x.revisionId, 'revisionId', 100), expectedVersion: integer(x.expectedVersion, 'expectedVersion', 0) };
        return this.c.store.operation(`skill-enable:${pid}`, key, input, () => {
            this.owner(actor, pid, true);
            const revision = this.revision(pid, input.revisionId), current = this.configuration(pid);
            ensure(current.version === input.expectedVersion, 'VERSION_CONFLICT', '技能配置已更新，请重试');
            ensure(!this.c.store.maybe('skill-deletion', revision.id), 'SKILL_DELETED', '技能版本已从管理列表删除，不能再次启用');
            this.review(actor, pid, { revisionId: revision.id, decision: 'approved', note: '用户通过上传/开启授权加载此固定文本和静态资源，未进行内容审查，不授予脚本、工具、计算、数据或模型权限。' }, digest({ operation: 'skill-enable', step: 'authorize', key }));
            const revisionIds = [...current.revisionIds.filter(id => this.revision(pid, id).packageId !== revision.packageId), revision.id];
            try {
                const configuration = this.configure(actor, pid, { expectedVersion: input.expectedVersion, builtinBundleId: current.builtinBundleId, revisionIds, disabledBuiltinIds: [] }, digest({ operation: 'skill-enable', step: 'configure', key }));
                return { revision, configuration };
            }
            catch (error) {
                if (['SKILL_REVOKED', 'SKILL_NOT_APPROVED', 'SKILL_DELETED'].includes(error.code ?? ''))
                    error.message += '；请先关闭当前配置中不可用的技能';
                throw error;
            }
        });
    }
    review(actor, pid, value, key = randomUUID()) {
        this.owner(actor, pid);
        const x = object(value), input = { revisionId: text(x.revisionId, 'revisionId', 100), decision: oneOf(x.decision, ['approved', 'rejected'], 'decision'), note: text(x.note, 'note', 4000) };
        return this.c.store.operation(`skill-review:${pid}`, key, input, () => { this.owner(actor, pid, true); const r = this.revision(pid, input.revisionId); ensure(!this.c.store.list('skill-revocation', pid).some(v => v.revisionId === r.id), 'SKILL_REVOKED', '撤销的版本不能重新审阅启用'); for (const f of r.files)
            this.revisionBytes(r, f); const record = this.c.store.create('skill-review', pid, { ...input, contentDigest: r.contentDigest }); this.c.store.event(pid, 'skill.reviewed', { revisionId: r.id, reviewId: record.id, decision: input.decision }); return record; });
    }
    revoke(actor, pid, value, key = randomUUID()) {
        this.owner(actor, pid);
        const x = object(value), input = { revisionId: text(x.revisionId, 'revisionId', 100), note: text(x.note, 'note', 4000) };
        return this.c.store.operation(`skill-revoke:${pid}`, key, input, () => { this.owner(actor, pid, true); const r = this.revision(pid, input.revisionId), record = this.c.store.create('skill-revocation', pid, { ...input, contentDigest: r.contentDigest }); this.c.store.event(pid, 'skill.revoked', { revisionId: r.id, revocationId: record.id }); return record; });
    }
    configuration(pid) { this.c.store.get('project', pid); const row = this.c.store.maybe('skill-configuration', pid), bundleId = row?.bundleId ?? BUNDLE_ID; const { builtinBundleId, disabledBuiltinIds } = this.resolveBundle(pid, bundleId); return { version: row?.version ?? 0, bundleId, builtinBundleId, revisionIds: row?.revisionIds ?? [], disabledBuiltinIds }; }
    saveConfiguration(pid, old, builtinBundleId, revisionIds, disabledBuiltinIds, selectedBundleId) {
        const body = { projectId: pid, builtinBundleId, revisionIds, ...(disabledBuiltinIds.length ? { disabledBuiltinIds } : {}) }, bundleId = selectedBundleId ?? (revisionIds.length || disabledBuiltinIds.length ? digest(body) : builtinBundleId);
        if ((revisionIds.length || disabledBuiltinIds.length) && !this.c.store.maybe('skill-bundle', bundleId))
            this.c.store.create('skill-bundle', pid, { builtinBundleId, revisionIds, ...(disabledBuiltinIds.length ? { disabledBuiltinIds } : {}), contentDigest: bundleId }, bundleId);
        const data = { bundleId, revisionIds }, row = old ? this.c.store.update('skill-configuration', pid, old.version, data) : this.c.store.create('skill-configuration', pid, data, pid);
        this.c.store.event(pid, 'skill.configured', { bundleId, builtinBundleId, revisionIds, disabledBuiltinIds, previousBundleId: old?.bundleId ?? BUNDLE_ID });
        return { version: row.version, ...data, builtinBundleId, disabledBuiltinIds };
    }
    configure(actor, pid, value, key = randomUUID()) {
        this.owner(actor, pid);
        const x = object(value), expectedVersion = integer(x.expectedVersion, 'expectedVersion', 0);
        ensure((x.revisionIds !== undefined) !== (x.bundleId !== undefined) && !(x.bundleId !== undefined && (x.builtinBundleId !== undefined || x.disabledBuiltinIds !== undefined)), 'INVALID_INPUT', 'bundleId 与 revisionIds/builtinBundleId/disabledBuiltinIds 不能混用', 400);
        const input = { expectedVersion, ...(x.bundleId !== undefined ? { bundleId: text(x.bundleId, 'bundleId', 100) } : { revisionIds: strings(x.revisionIds, 'revisionIds', 64), ...(x.builtinBundleId !== undefined ? { builtinBundleId: text(x.builtinBundleId, 'builtinBundleId', 100) } : {}), ...(x.disabledBuiltinIds !== undefined ? { disabledBuiltinIds: strings(x.disabledBuiltinIds, 'disabledBuiltinIds', 64) } : {}) }) };
        return this.c.store.operation(`skill-configure:${pid}`, key, input, () => {
            this.owner(actor, pid, true);
            const old = this.c.store.maybe('skill-configuration', pid);
            ensure((old?.version ?? 0) === expectedVersion, 'VERSION_CONFLICT', '技能配置已更新，请刷新');
            let current;
            if (!('bundleId' in input) && old) {
                try {
                    current = this.resolveBundle(pid, old.bundleId);
                }
                catch (e) {
                    if (!input.builtinBundleId || e.code !== 'SKILL_BUNDLE_UNKNOWN')
                        throw e;
                }
            }
            const selected = 'bundleId' in input ? this.resolveBundle(pid, input.bundleId) : { builtinBundleId: input.builtinBundleId ?? this.configuration(pid).builtinBundleId, revisions: input.revisionIds.map(id => this.revision(pid, id)), disabledBuiltinIds: input.disabledBuiltinIds ?? [] };
            ensure(!selected.disabledBuiltinIds.length, 'BUILTIN_SKILL_REQUIRED', '内置技能默认必需，不能关闭', 400);
            const { builtinBundleId, revisions } = selected, disabledBuiltinIds = this.disabledIds(builtinBundleId, selected.disabledBuiltinIds);
            this.noCollisions(builtinBundleId, revisions);
            const removingOnly = !('bundleId' in input) && !!current && builtinBundleId === current.builtinBundleId && revisions.length < current.revisions.length && revisions.every(r => current.revisions.some(previous => previous.id === r.id));
            const restoringOnly = !('bundleId' in input) && !!current && current.disabledBuiltinIds.length > 0 && !disabledBuiltinIds.length && builtinBundleId === current.builtinBundleId && revisions.length === current.revisions.length && revisions.every(r => current.revisions.some(previous => previous.id === r.id));
            for (const r of revisions) {
                ensure(!this.c.store.maybe('skill-deletion', r.id), 'SKILL_DELETED', '技能版本已从管理列表删除，不能再次启用');
                if (!removingOnly && !restoringOnly)
                    this.approved(pid, r);
            }
            return this.saveConfiguration(pid, old, builtinBundleId, revisions.map(r => r.id).sort(), disabledBuiltinIds, 'bundleId' in input ? input.bundleId : undefined);
        });
    }
    delete(actor, pid, value, key = randomUUID()) {
        this.owner(actor, pid);
        const x = object(value), input = { revisionId: text(x.revisionId, 'revisionId', 100), expectedVersion: integer(x.expectedVersion, 'expectedVersion', 0) };
        return this.c.store.operation(`skill-delete:${pid}`, key, input, () => {
            this.owner(actor, pid, true);
            const revision = this.revision(pid, input.revisionId), old = this.c.store.maybe('skill-configuration', pid);
            ensure((old?.version ?? 0) === input.expectedVersion, 'VERSION_CONFLICT', '技能配置已更新，请刷新');
            ensure(!this.c.store.maybe('skill-deletion', revision.id), 'SKILL_DELETED', '技能版本已从管理列表删除');
            const current = this.resolveBundle(pid, old?.bundleId ?? BUNDLE_ID);
            this.c.store.create('skill-deletion', pid, { revisionId: revision.id, contentDigest: revision.contentDigest }, revision.id);
            const configuration = this.saveConfiguration(pid, old, current.builtinBundleId, current.revisions.filter(r => r.id !== revision.id).map(r => r.id).sort(), []);
            this.c.store.event(pid, 'skill.deleted', { revisionId: revision.id, contentDigest: revision.contentDigest, bundleId: configuration.bundleId });
            return configuration;
        });
    }
    inspect(actor, pid, revisionId) { this.owner(actor, pid); const revision = this.revision(pid, revisionId); return { revision, reviews: this.c.store.list('skill-review', pid).filter(r => r.revisionId === revisionId), revocations: this.c.store.list('skill-revocation', pid).filter(r => r.revisionId === revisionId) }; }
    catalog(actor, pid) { this.owner(actor, pid); const configuration = this.configuration(pid); return { configuration, builtinSkills: this.list('coordinator', configuration.builtinBundleId), builtinReleases: this.builtinReleases(), revisions: this.c.store.list('skill-package-revision', pid).filter(r => !this.c.store.maybe('skill-deletion', r.id)).map(r => this.inspect(actor, pid, r.id)) }; }
    readRevision(actor, pid, revisionId, resource = 'SKILL.md') { this.owner(actor, pid); const r = this.revision(pid, revisionId), f = r.files.find(f => f.path === resource); ensure(f, 'SKILL_RESOURCE_NOT_FOUND', '资源不在冻结技能清单内', 404); const bytes = this.revisionBytes(r, f); return f.mediaType === 'image/png' ? { revisionId, resource, digest: f.digest, mediaType: f.mediaType, contentBase64: bytes.toString('base64') } : { revisionId, resource, content: content(bytes), digest: f.digest }; }
    revisionBytes(r, f) { const bytes = this.verifiedBytes(join(this.c.dataDir, 'skill-blobs', f.digest), f.digest, this.c.dataDir); if (f.mediaType === 'image/png') {
        ensure(canonicalPngPath(f.path), 'SKILL_INTEGRITY_FAILED', '固定 PNG 类型与路径不匹配');
        validatePng(bytes);
    }
    else {
        ensure(f.mediaType === undefined, 'SKILL_INTEGRITY_FAILED', '固定技能资源媒体类型无效');
        content(bytes);
    } return bytes; }
    revisionText(r, resource) { const f = r.files.find(f => f.path === resource); ensure(f, 'SKILL_RESOURCE_NOT_FOUND', '资源不在冻结技能清单内', 404); ensure(f.mediaType !== 'image/png', 'SKILL_RESOURCE_BINARY', 'Agent 技能读取仅支持 UTF-8 文本资源', 400); return { resource, content: content(this.revisionBytes(r, f)), digest: f.digest }; }
    entry(r) { return { id: r.packageId, description: r.description, digest: r.files.find(f => f.path === 'SKILL.md').digest, resources: r.files.filter(f => f.path !== 'SKILL.md').map(f => f.path), source: { repository: 'user-import', commit: r.contentDigest, path: 'SKILL.md', blob: r.contentDigest }, revisionId: r.id, requirements: r.requirements }; }
    bundleCatalog(pid, role, bundleId) { const { builtinBundleId, revisions, disabledBuiltinIds } = this.resolveBundle(pid, bundleId); return { bundleId, builtinBundleId, revisionIds: revisions.map(r => r.id), skills: [...this.list(role, builtinBundleId).filter(e => !disabledBuiltinIds.includes(e.id)), ...revisions.filter(r => r.roles.includes(role)).map(r => this.entry(r))] }; }
    bundleRead(pid, role, bundleId, id, resource) {
        const { builtinBundleId, revisions, disabledBuiltinIds } = this.resolveBundle(pid, bundleId);
        const read = (name, path) => {
            ensure(!disabledBuiltinIds.includes(name), 'SKILL_DISABLED', '技能在此固定包中已关闭', 403);
            if (this.builtin(builtinBundleId).skills.some(e => e.id === name))
                return { ...this.builtinText(role, name, path, builtinBundleId), bundleId };
            const r = revisions.find(r => r.packageId === name);
            ensure(r, 'SKILL_NOT_FOUND', '技能不在固定包清单内', 404);
            ensure(r.roles.includes(role), 'SKILL_SCOPE_DENIED', '该角色无此技能入口', 403);
            return { id: name, ...this.revisionText(r, path ?? 'SKILL.md'), bundleId, source: this.entry(r).source };
        };
        return this.contextualRead(read(id, resource), read, name => this.prerequisites(builtinBundleId, name));
    }
    bundleBootstrap(pid, role, bundleId) { const { skills, builtinBundleId } = this.bundleCatalog(pid, role, bundleId); return this.bootstrapEntries(role, bundleId, skills, skills.some(e => e.id === 'pi-research-overview') ? this.bundleRead(pid, role, bundleId, 'pi-research-overview').content : '', builtinBundleId); }
    ensureBundleRuntimeCompatible(pid, bundleId) { const { builtinBundleId } = this.resolveBundle(pid, bundleId); ensure(this.builtin(builtinBundleId).skills.every(skill => skill.resources.every(resource => !('methodRequirements' in resource) || !resource.methodRequirements?.some(requirement => !['literature-identity', 'quantitative-decision', 'structured-paired-protocol', 'closed-paired-evidence'].includes(requirement)))), 'SKILL_RUNTIME_INCOMPATIBLE', '固定技能包包含当前运行时不支持的方法要求；历史正文保留，请使用兼容运行时继续'); }
    ensureBundleStartAllowed(pid, bundleId) { this.ensureBundleRuntimeCompatible(pid, bundleId); const { builtinBundleId, revisions, disabledBuiltinIds } = this.resolveBundle(pid, bundleId); for (const entry of this.builtin(builtinBundleId).skills.filter(e => !disabledBuiltinIds.includes(e.id))) {
        const role = entry.roles[0];
        this.read(role, entry.id, undefined, builtinBundleId);
        for (const resource of entry.resources)
            this.read(role, entry.id, resource.path, builtinBundleId);
    } for (const r of revisions) {
        this.approved(pid, r);
        for (const f of r.files)
            this.revisionBytes(r, f);
    } return { bundleId, revisionIds: revisions.map(r => r.id) }; }
}
//# sourceMappingURL=service.js.map