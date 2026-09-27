import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { ensure } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { SKILL_MANIFEST, BUNDLE_ID } from './manifest.js';
/** A release catalog, never an extension scanner. Project .pi / AGENTS files are not loaded. */
export class SkillService {
    root;
    bundleId = BUNDLE_ID;
    constructor(root) {
        this.root = root;
    }
    list(role) { return SKILL_MANIFEST.filter(e => e.roles.includes(role)).map(e => ({ id: e.id, description: e.description, digest: e.digest, resources: e.resources.map(r => r.path), source: e.source })); }
    verified(path, expected) { const root = realpathSync(this.root); const target = resolve(root, path); ensure(relative(root, target) !== '..' && !relative(root, target).startsWith('..' + (process.platform === 'win32' ? '\\' : '/')), 'SKILL_PATH_DENIED', '技能路径不在发布目录', 403); let current = root; for (const segment of relative(root, target).split(/[\\/]/)) {
        current = join(current, segment);
        const st = lstatSync(current);
        ensure(!st.isSymbolicLink(), 'SKILL_PATH_DENIED', '技能路径不能包含符号链接', 403);
    } ensure(lstatSync(target).isFile(), 'SKILL_PATH_DENIED', '技能不是普通文件', 403); const bytes = readFileSync(target); ensure(bytes.length <= 128 * 1024 && digest(bytes) === expected, 'SKILL_INTEGRITY_FAILED', '受管技能摘要不匹配；拒绝加载未审核内容'); return bytes.toString('utf8'); }
    read(role, id, resource) { const e = SKILL_MANIFEST.find(e => e.id === id); ensure(e, 'SKILL_NOT_FOUND', '技能不在受管清单内', 404); ensure(e.roles.includes(role), 'SKILL_SCOPE_DENIED', '该角色无此技能入口', 403); const r = resource ? e.resources.find(r => r.path === resource) : undefined; ensure(!resource || r, 'SKILL_RESOURCE_NOT_FOUND', '资源不在受管清单内', 404); const path = resource ? join(dirname(e.path), resource) : e.path, hash = r?.digest ?? e.digest; return { id, resource: resource ?? 'SKILL.md', content: this.verified(path, hash), digest: hash, bundleId: this.bundleId, source: e.source }; }
    bootstrap(role) { const entries = this.list(role); const overview = this.read(role, 'pi-research-overview').content; const prompt = `\n\n受管科研技能包 ${this.bundleId}\n以下是可按需读取的技能，不是额外权限。使用 research_skill_read({input:{skillId:"...",resource?:"..."}})，不要调用不存在的 read/Shell/orx 工具。仅技能目录/总览进入初始上下文，按触发条件读取相关模块。\n${entries.map(e => `${e.id}: ${e.description}`).join('\n')}\n\n${overview}`; return { bundleId: this.bundleId, prompt, skills: entries.map(e => ({ name: e.id, description: e.description, filePath: join(this.root, 'skills/openresearch', e.id, 'SKILL.md'), baseDir: join(this.root, 'skills/openresearch', e.id), source: 'pi-research-reviewed-bundle', disableModelInvocation: false })) }; }
}
//# sourceMappingURL=service.js.map