import { compilerProfile } from '../publications/build-service.js';
import { ensure, asError } from '../domain/errors.js';
import { userOnly, scope } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { integer, object, strings, text } from '../contracts/validation.js';
import { ToolDispatcher } from '../research-tools/dispatcher.js';
/** A native Pi history is never silently upgraded to today's bundle. */
export function sessionSkillBundle(app, s) {
    if (s.skillBundleId)
        return s.skillBundleId;
    const rows = app.store.db.prepare("SELECT DISTINCT json_extract(payload,'$.bundleId') bundle FROM events WHERE project_id=? AND json_extract(payload,'$.sessionId')=? AND type='session.skill_bundle_bound' LIMIT 2").all(s.projectId, s.id);
    if (!rows.length && !s.piSessionPath && s.generation === 0)
        return app.skills.configuration(s.projectId).bundleId;
    ensure(rows.length === 1 && typeof rows[0].bundle === 'string', 'SKILL_BINDING_UNKNOWN', '旧 Pi 会话无法证明唯一技能包；请创建新会话，原生历史保持不变');
    return String(rows[0].bundle);
}
export function resolveSkillBinding(app, actor, pid) {
    scope(actor, pid);
    ensure(actor.sessionId, 'SKILL_SESSION_REQUIRED', '技能读取需要会话身份');
    const session = app.store.get('session', actor.sessionId, pid), bundleId = sessionSkillBundle(app, session);
    if (actor.attemptId) {
        const a = app.store.get('task-attempt', actor.attemptId, pid);
        ensure(a.sessionId === session.id && a.skillBundleId === bundleId, 'SKILL_BINDING_MISMATCH', '任务与会话技能包不一致');
    }
    return { session, bundleId };
}
export function readCatalog(app, actor, pid) { const { session, bundleId } = resolveSkillBinding(app, actor, pid); return app.skills.bundleCatalog(pid, session.role, bundleId); }
export function readSkill(app, actor, pid, id, resource) { const { session, bundleId } = resolveSkillBinding(app, actor, pid); return app.skills.bundleRead(pid, session.role, bundleId, id, resource); }
function missingSkills(app, pid, role, bundleId, skillIds, automation = false, allowedArtifacts, continuation = false) {
    const missing = [], catalog = app.skills.bundleCatalog(pid, role, bundleId), tools = new Set(new ToolDispatcher(app).definitions(role, automation, undefined, continuation).map(t => t.name));
    try {
        app.skills.ensureBundleStartAllowed(pid, bundleId);
    }
    catch (e) {
        const x = asError(e);
        missing.push({ skillId: '', kind: 'binding', value: bundleId, reason: `${x.code} — ${x.message}` });
    }
    for (const id of skillIds) {
        const entry = catalog.skills.find(s => s.id === id);
        if (!entry) {
            missing.push({ skillId: id, kind: 'binding', value: id, reason: '技能不在固定包或当前角色可选目录中' });
            continue;
        }
        for (const tool of entry.requirements?.tools ?? [])
            if (!tools.has(tool))
                missing.push({ skillId: id, kind: 'tool', value: tool, reason: '当前角色/自动化实际工具列表未提供此工具' });
        for (const backend of entry.requirements?.backends ?? []) {
            const compiler = backend === 'latex' ? app.store.maybe('publication-compiler-settings', 'global') : undefined;
            let configured = false;
            try {
                configured = !!compiler && compiler.profileDigest === compilerProfile(app.context.repoRoot).profileDigest;
            }
            catch { }
            const context = backend === 'latex' ? compiler?.dockerContext : 'default', ready = (backend === 'docker' || backend === 'latex' && configured) && !!context && !!app.store.db.prepare("SELECT 1 FROM compute_contexts WHERE context=? AND status='ready' AND target_id IS NOT NULL AND engine_id IS NOT NULL AND next_probe_at>? LIMIT 1").get(context, Date.now());
            if (!ready)
                missing.push({ skillId: id, kind: 'backend', value: backend, reason: backend === 'docker' ? '默认 Docker 目标未核验或核验已过期；请先核对计算目标' : backend === 'latex' ? '固定文稿编译镜像未配置、内容已变或目标核验已过期' : '后端未实现或没有已核验配置' });
        }
        for (const artifactId of entry.requirements?.artifactIds ?? []) {
            const a = app.store.maybe('artifact', artifactId);
            if (!a || a.projectId !== pid || allowedArtifacts && !allowedArtifacts.has(artifactId))
                missing.push({ skillId: id, kind: 'artifact', value: artifactId, reason: '数据不存在或不在当前任务/自动分析授权资源范围' });
        }
    }
    return missing;
}
function requireReady(missing) { ensure(!missing.length, 'SKILL_CAPABILITY_MISSING', missing.map(m => `${m.skillId || 'bundle'} ${m.kind}:${m.value} — ${m.reason}`).join('; ')); }
export function prepareTaskSkills(app, task) {
    const previous = task.attemptId ? app.store.get('task-attempt', task.attemptId, task.projectId) : undefined;
    ensure(!previous || previous.skillBundleId, 'SKILL_BINDING_UNKNOWN', '旧任务尝试未记录技能包；请建立新任务');
    const bundleId = previous?.skillBundleId ?? app.skills.configuration(task.projectId).bundleId;
    requireReady(missingSkills(app, task.projectId, task.role, bundleId, task.skillIds ?? [], false, app.teams.resourcesForTask(task).artifactIds));
    return bundleId;
}
export function prepareSessionSkills(app, s, actor) {
    const bundleId = sessionSkillBundle(app, s), allowed = actor?.taskId ? app.teams.resources(actor).artifactIds : actor?.wakeupId ? app.wakeups.resources(actor).artifactIds : undefined;
    requireReady(missingSkills(app, s.projectId, s.role, bundleId, s.skillIds ?? [], !!actor?.wakeupId, allowed, !!actor?.continuationId));
    return bundleId;
}
export function inspectSessionSkills(app, actor, pid, sessionId) {
    scope(actor, pid);
    const s = app.store.get('session', sessionId, pid);
    let bundleId = s.skillBundleId ?? null, missing = [];
    try {
        bundleId = sessionSkillBundle(app, s);
        missing = missingSkills(app, pid, s.role, bundleId, s.skillIds ?? [], false, s.taskId ? app.teams.resourcesForTask(app.store.get('task', s.taskId, pid)).artifactIds : undefined);
    }
    catch (e) {
        const x = asError(e);
        missing = [{ skillId: '', kind: 'binding', value: bundleId ?? '', reason: `${x.code} — ${x.message}` }];
    }
    return { sessionId: s.id, version: s.version, skillBundleId: bundleId, skillIds: s.skillIds ?? [], ready: missing.length === 0, missing };
}
export function selectSessionSkills(app, actor, pid, value) {
    userOnly(actor);
    const x = object(value), sessionId = text(x.sessionId, 'sessionId'), version = integer(x.expectedVersion, 'expectedVersion', 1), skillIds = strings(x.skillIds, 'skillIds', 32);
    return app.store.transaction(() => {
        assertProjectWritable(app.store, pid);
        const s = app.store.get('session', sessionId, pid);
        ensure(s.version === version, 'VERSION_CONFLICT', '会话已更新');
        ensure(!s.taskId && !s.piSessionPath && s.generation === 0 && !['running', 'archived'].includes(s.state), 'SKILL_SESSION_ALREADY_STARTED', '只有尚未启动 Pi 的非任务会话可以选择技能；升级请创建新会话');
        const bundleId = app.skills.configuration(pid).bundleId, catalog = app.skills.bundleCatalog(pid, s.role, bundleId);
        app.skills.ensureBundleStartAllowed(pid, bundleId);
        ensure(skillIds.every(id => catalog.skills.some(s => s.id === id)), 'SKILL_SCOPE_DENIED', '选用技能不在当前角色目录中');
        app.store.update('session', s.id, s.version, { skillBundleId: bundleId, skillIds: [...new Set(skillIds)] });
        return inspectSessionSkills(app, actor, pid, s.id);
    });
}
//# sourceMappingURL=runtime.js.map