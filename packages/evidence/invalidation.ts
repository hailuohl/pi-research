import type { Store } from '../storage/store.js';
import type { Task, Evidence, Artifact, Claim, AcceptanceRecord, ChangeProposal, Team, SourceRevision, Experiment } from '../domain/types.js';
import {ensure} from '../domain/errors.js';

function sourceTasks(store: Store, projectId: string, evidenceIds: string[]) {
    return evidenceIds.flatMap(id => {
        const e=store.get<Evidence>('evidence',id,projectId),a=store.get<Artifact>('artifact',e.artifactId,projectId);
        return a.taskId ? [a.taskId] : [];
    });
}
function boundSourceTasks(store: Store, projectId: string, team: Team) {
    if(!team.sourceRevisionId) return [];
    const source=store.get<SourceRevision>('source-revision',team.sourceRevisionId,projectId),tasks=new Set<string>(),seen=new Set<string>();
    let experimentId: string|null=source.experimentId;
    while(experimentId) {
        ensure(!seen.has(experimentId),'EXPERIMENT_CYCLE','实验血缘存在循环');seen.add(experimentId);
        const experiment: Experiment=store.get<Experiment>('experiment',experimentId,projectId);
        if(experiment.changeProposalId) {
            const proposal=store.get<ChangeProposal>('change-proposal',experiment.changeProposalId,projectId);
            for(const change of proposal.changes) {
                if(change.taskId) tasks.add(change.taskId);
                if(change.sourceAcceptanceId) for(const id of store.get<AcceptanceRecord>('acceptance-record',change.sourceAcceptanceId,projectId).taskIds) tasks.add(id);
            }
        }
        experimentId=experiment.parentId;
    }
    return [...tasks];
}
/** A review is an acceptance prerequisite: invalidation flows in BOTH directions.
 * Evidence and bound source revisions connect teams within one project.
 */
export function invalidationClosure(store: Store, projectId: string, ids: string[]) {
    const all=store.list<Task>('task',projectId),affected=new Set(ids);
    const boundSources=new Map(store.list<Team>('team',projectId).map(team=>[team.id,boundSourceTasks(store,projectId,team)]));
    let changed=true;
    while(changed) {
        changed=false;
        for(const t of all) {
            if(affected.has(t.id)) continue;
            const dependencies=all.filter(d=>d.teamId===t.teamId &&
                (t.dependencies.includes(d.key) || t.reviewOf===d.key || d.reviewOf===t.key)).map(d=>d.id);
            dependencies.push(...sourceTasks(store,projectId,[...(t.inputEvidenceIds??[]),...(t.result?.evidenceIds??[])]));
            dependencies.push(...(boundSources.get(t.teamId)??[]));
            if(dependencies.some(id=>affected.has(id))) {affected.add(t.id);changed=true;}
        }
    }
    return affected;
}
export function expireDerivations(store: Store, projectId: string, taskIds: Set<string>, directiveId: string) {
    const expired=new Set<string>();
    for(const a of store.list<AcceptanceRecord>('acceptance-record',projectId)) if(a.taskIds.some(id=>taskIds.has(id))) {
        expired.add(a.id);
        if(a.validity!=='stale') store.update<AcceptanceRecord>('acceptance-record',a.id,a.version,{validity:'stale',invalidatedBy:directiveId});
    }
    for(const c of store.list<Claim>('claim',projectId)) if(c.taskId && taskIds.has(c.taskId) ||
        (c.sourceAcceptanceIds??[]).some(id=>expired.has(id)) || sourceTasks(store,projectId,c.evidenceIds).some(id=>taskIds.has(id))) {
        if(c.validity!=='stale') store.update<Claim>('claim',c.id,c.version,{validity:'stale',invalidatedBy:directiveId});
    }
    for(const p of store.list<ChangeProposal>('change-proposal',projectId)) if(p.changes.some(c=>c.taskId && taskIds.has(c.taskId) || c.sourceAcceptanceId && expired.has(c.sourceAcceptanceId))) {
        if(p.sourceValidity!=='stale') store.update<ChangeProposal>('change-proposal',p.id,p.version,{sourceValidity:'stale',invalidatedBy:directiveId});
        // Applied children and existing Runs remain immutable history, never rolled back.
        if(p.state==='prepared') for(const a of store.list<{subjectId:string;status:string}>('approval',projectId).filter(a=>a.subjectId===p.id && a.status!=='stale'))
            store.update('approval',a.id,a.version,{status:'stale'});
    }
    store.event(projectId,'derivations.invalidated',{directiveId,taskIds:[...taskIds],acceptanceIds:[...expired]});
}
