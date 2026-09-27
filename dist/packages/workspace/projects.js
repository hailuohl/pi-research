import { mkdirSync, copyFileSync, existsSync, readFileSync, writeFileSync, lstatSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DEFAULT_COLLABORATION } from '../domain/types.js';
import { scope, userOnly } from '../policy/permissions.js';
import { bool, integer, object, oneOf, text } from '../contracts/validation.js';
import { ensure } from '../domain/errors.js';
import { listFiles, readText, writeText, safePath } from './files.js';
export class ProjectService {
    c;
    constructor(c) {
        this.c = c;
    }
    get(actor, id) { scope(actor, id); const p = this.c.store.get('project', id); ensure(!p.archived, 'PROJECT_ARCHIVED', '项目已归档', 409); return p; }
    create(actor, input) {
        userOnly(actor);
        const x = object(input);
        const name = text(x.name, 'name', 120);
        return this.c.store.transaction(() => {
            const id = randomUUID();
            const workspace = join(this.c.dataDir, 'projects', id, 'source');
            mkdirSync(workspace, { recursive: true, mode: 0o700 });
            if (x.template === 'curve-fit') {
                for (const file of ['experiment.mjs', 'config.json', 'README.md'])
                    copyFileSync(join(this.c.repoRoot, 'examples', 'curve-fit', file), join(workspace, file));
            }
            else {
                ensure(x.template === undefined || x.template === 'empty', 'INVALID_INPUT', '不支持的模板', 400);
                writeFileSync(join(workspace, 'README.md'), `# ${name}\n\n项目文件由用户导入。\n`, { mode: 0o600 });
            }
            const p = this.c.store.create('project', id, { name, description: text(x.description ?? '', 'description', 2000, true), workspace, archived: false, settings: { ...DEFAULT_COLLABORATION } }, id);
            this.c.store.event(id, 'project.created', { id, name });
            return p;
        });
    }
    importDirectory(actor, input) {
        userOnly(actor);
        const x = object(input), source = resolve(text(x.sourcePath, 'sourcePath', 4096));
        ensure(existsSync(source) && lstatSync(source).isDirectory() && !lstatSync(source).isSymbolicLink(), 'PATH_DENIED', '导入源必须是本机真实目录', 403);
        ensure(source !== this.c.dataDir && !source.startsWith(this.c.dataDir + '/'), 'PATH_DENIED', '不能将应用数据目录作为项目源码导入', 403);
        const files = listFiles(source);
        ensure(files.length > 0, 'EMPTY_WORKSPACE', '导入目录没有可用源码文件', 400);
        ensure(files.reduce((n, f) => n + f.size, 0) <= 64 * 1024 * 1024, 'SNAPSHOT_TOO_LARGE', '当前导入上限为64 MiB；大数据集需单独版本化', 413);
        const entries = files.map(f => ({ path: f.path, bytes: readFileSync(safePath(source, f.path)) }));
        let created;
        try {
            return this.c.store.transaction(() => {
                const p = this.create(actor, { name: x.name, description: x.description ?? '', template: 'empty' });
                created = p.workspace;
                rmSync(join(p.workspace, 'README.md'), { force: true });
                for (const f of entries) {
                    const path = safePath(p.workspace, f.path);
                    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
                    writeFileSync(path, f.bytes, { mode: 0o600, flag: 'wx' });
                }
                this.c.store.create('project-import', p.id, { sourcePath: source, fileCount: entries.length, mode: 'copy-without-git-metadata', excluded: 'Git metadata, credentials, node_modules and Pi runtime data' });
                this.c.store.event(p.id, 'project.imported', { projectId: p.id, fileCount: entries.length });
                return p;
            });
        }
        catch (error) {
            if (created)
                rmSync(created, { recursive: true, force: true });
            throw error;
        }
    }
    update(actor, id, input) { userOnly(actor); const p = this.get(actor, id), x = object(input); const version = integer(x.expectedVersion, 'expectedVersion', 1); return this.c.store.transaction(() => { const next = this.c.store.update('project', id, version, { name: x.name === undefined ? p.name : text(x.name, 'name', 120), description: x.description === undefined ? p.description : text(x.description, 'description', 2000, true) }); this.c.store.event(id, 'project.updated', { id, version: next.version }); return next; }); }
    archive(actor, id, version) {
        userOnly(actor);
        return this.c.store.transaction(() => {
            this.get(actor, id);
            ensure(this.c.store.list('run', id).every(r => ['succeeded', 'failed', 'cancelled'].includes(r.state)), 'PROJECT_BUSY', '项目仍有未结束运行，不能归档');
            ensure(this.c.store.list('session', id).every(s => s.state !== 'running'), 'PROJECT_BUSY', '项目仍有活跃 Agent');
            ensure(this.c.store.list('task', id).every(t => t.execution !== 'running'), 'PROJECT_BUSY', '项目仍有活跃助手');
            const next = this.c.store.update('project', id, version, { archived: true });
            for (const a of this.c.store.list('approval', id).filter(a => ['pending', 'approved'].includes(a.status)))
                this.c.store.update('approval', a.id, a.version, { status: 'stale' });
            for (const m of this.c.store.list('message', id).filter(m => m.status === 'queued'))
                this.c.store.update('message', m.id, m.version, { status: 'cancelled', error: '项目已归档，未开始的请求已取消' });
            for (const s of this.c.store.list('session', id).filter(s => s.state === 'queued'))
                this.c.store.update('session', s.id, s.version, { state: 'idle' });
            for (const t of this.c.store.list('team', id).filter(t => ['active', 'paused', 'awaiting_approval'].includes(t.state)))
                this.c.store.update('team', t.id, t.version, { state: 'paused', blockReason: '项目已归档；禁止新委派' });
            this.c.store.event(id, 'project.archived', { projectId: id });
            return next;
        });
    }
    settings(actor, id, input) {
        userOnly(actor);
        const p = this.get(actor, id), x = object(input);
        const next = { ...p.settings };
        if (x.enabled !== undefined)
            next.enabled = bool(x.enabled, 'enabled');
        if (x.strategy !== undefined)
            next.strategy = oneOf(x.strategy, ['adaptive', 'manual'], 'strategy');
        if (x.maxActiveAgents !== undefined)
            next.maxActiveAgents = integer(x.maxActiveAgents, 'maxActiveAgents', 2, 8);
        if (x.maxConcurrentAssistants !== undefined)
            next.maxConcurrentAssistants = integer(x.maxConcurrentAssistants, 'maxConcurrentAssistants', 1, 7);
        ensure(next.maxConcurrentAssistants < next.maxActiveAgents, 'INVALID_INPUT', '必须给主协调者保留一个名额', 400);
        return this.c.store.transaction(() => { const updated = this.c.store.update('project', id, integer(x.expectedVersion, 'expectedVersion', 1), { settings: next }); this.c.store.event(id, 'project.collaboration_changed', { enabled: next.enabled }); return updated; });
    }
    listFiles(actor, id) { return listFiles(this.get(actor, id).workspace); }
    readFile(actor, id, path) { return readText(this.get(actor, id).workspace, path); }
    writeFile(actor, id, path, content, expectedDigest) { userOnly(actor); const p = this.get(actor, id); const result = writeText(p.workspace, path, content, expectedDigest); this.c.store.event(id, 'workspace.file_changed', { path, digest: result.digest }); return result; }
}
//# sourceMappingURL=projects.js.map