function sourceTasks(store, projectId, evidenceIds) {
    return evidenceIds.flatMap(id => {
        const e = store.get('evidence', id, projectId), a = store.get('artifact', e.artifactId, projectId);
        return a.taskId ? [a.taskId] : [];
    });
}
/** A review is an acceptance prerequisite: invalidation flows in BOTH directions.
 * Sources explicitly assigned as evidence can connect teams within one project.
 */
export function invalidationClosure(store, projectId, ids) {
    const all = store.list('task', projectId), affected = new Set(ids);
    let changed = true;
    while (changed) {
        changed = false;
        for (const t of all) {
            if (affected.has(t.id))
                continue;
            const dependencies = all.filter(d => d.teamId === t.teamId &&
                (t.dependencies.includes(d.key) || t.reviewOf === d.key || d.reviewOf === t.key)).map(d => d.id);
            dependencies.push(...sourceTasks(store, projectId, [...(t.inputEvidenceIds ?? []), ...(t.result?.evidenceIds ?? [])]));
            if (dependencies.some(id => affected.has(id))) {
                affected.add(t.id);
                changed = true;
            }
        }
    }
    return affected;
}
export function expireDerivations(store, projectId, taskIds, directiveId) {
    const expired = new Set();
    for (const a of store.list('acceptance-record', projectId))
        if (a.taskIds.some(id => taskIds.has(id))) {
            expired.add(a.id);
            if (a.validity !== 'stale')
                store.update('acceptance-record', a.id, a.version, { validity: 'stale', invalidatedBy: directiveId });
        }
    for (const c of store.list('claim', projectId))
        if (c.taskId && taskIds.has(c.taskId) ||
            (c.sourceAcceptanceIds ?? []).some(id => expired.has(id)) || sourceTasks(store, projectId, c.evidenceIds).some(id => taskIds.has(id))) {
            if (c.validity !== 'stale')
                store.update('claim', c.id, c.version, { validity: 'stale', invalidatedBy: directiveId });
        }
    for (const p of store.list('change-proposal', projectId))
        if (p.changes.some(c => c.taskId && taskIds.has(c.taskId) || c.sourceAcceptanceId && expired.has(c.sourceAcceptanceId))) {
            if (p.sourceValidity !== 'stale')
                store.update('change-proposal', p.id, p.version, { sourceValidity: 'stale', invalidatedBy: directiveId });
            // Applied children and existing Runs remain immutable history, never rolled back.
            if (p.state === 'prepared')
                for (const a of store.list('approval', projectId).filter(a => a.subjectId === p.id && a.status !== 'stale'))
                    store.update('approval', a.id, a.version, { status: 'stale' });
        }
    store.event(projectId, 'derivations.invalidated', { directiveId, taskIds: [...taskIds], acceptanceIds: [...expired] });
}
//# sourceMappingURL=invalidation.js.map