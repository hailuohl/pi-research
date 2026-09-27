import type { Store } from '../storage/store.js';
import type { Project, Experiment, ChangeProposal } from '../domain/types.js';
import { ensure } from '../domain/errors.js';

/** Call inside the write transaction at the point a NEW side effect is authorized. */
export function assertProjectWritable(store: Store, projectId: string) {
    const project = store.get<Project>('project', projectId);
    ensure(!project.archived, 'PROJECT_ARCHIVED', '项目已归档；历史仍可读取，不能开始新操作');
    return project;
}

/** Already submitted Runs keep their history; new Runs cannot inherit revoked code approval. */
export function assertExperimentSourceCurrent(store: Store, experiment: Experiment) {
    const seen = new Set<string>();
    let e: Experiment | undefined = experiment;
    while (e) {
        if (e.changeProposalId) {
            const proposal = store.get<ChangeProposal>('change-proposal', e.changeProposalId);
            ensure(proposal.sourceValidity !== 'stale', 'CHANGE_SOURCE_STALE', '实验来源的审查已失效，请重新审查并准备新版本');
        }
        if (!e.parentId) break;
        ensure(!seen.has(e.parentId), 'EXPERIMENT_CYCLE', '实验血缘存在循环');
        seen.add(e.parentId);
        e = store.get<Experiment>('experiment', e.parentId);
    }
}
