import type {Run,Row,Experiment} from '../domain/types.js';
import type {Store} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
/** Not a scientific verdict: only determines whether code must be preserved or human review is pending. */
export function answerDisposition(run:Run):'answered'|'unanswered'|'needs_review' {
    if(run.metrics && Object.keys(run.metrics).length)return 'answered';
    if(run.answerDisposition)return run.answerDisposition;
    if(run.state==='cancelled'&&!run.startedAt)return 'unanswered';
    return 'needs_review';
}
export function assertOutcomeBoundary(store:Store,experiment:Row<Experiment>,editing=false) {
    const finished=store.list<Run>('run',experiment.projectId!).filter(r=>r.experimentId===experiment.id && r.manifest.experimentRevision===experiment.revision && ['succeeded','failed','cancelled'].includes(r.state));
    if(editing)ensure(!finished.some(r=>answerDisposition(r)==='answered'),'EXPERIMENT_FROZEN','此节点已有研究结果；请派生新子实验');
    ensure(!finished.some(r=>answerDisposition(r)==='needs_review'),'RESULT_REVIEW_REQUIRED','尚有结果语义不明的运行，请在实验详情确认是否回答研究问题后再修改或重跑');
}
