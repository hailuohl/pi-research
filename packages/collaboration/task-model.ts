import type {ModelConfig,TaskSpec,Task,Session,Row,Team,Approval} from '../domain/types.js';
import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
import type {TaskModelExecution} from '../pi-adapter/thinking-policy.js';

export interface FrozenTaskModel {model:ModelConfig;execution:TaskModelExecution;digest:string;}
export interface TaskModelPlan {model:ModelConfig;tasks?:TaskSpec[];taskModels?:Record<string,FrozenTaskModel>;digest?:string;goal?:string;settings?:Team['settings'];limit?:number;autoSummarize?:boolean;sourceRevisionId?:string;developmentReviewInputs?:unknown;formalReportReviewInputs?:unknown;taskPermissionEffects?:string[];permission?:Team['permission'];}
const specFields=['thinking','thinkingReason','skillIds','key','role','objective','dependencies','critical','reviewOf','required','inputEvidenceIds','expectedOutputs','acceptanceRuleIds'] as const;
export function taskModelSpec(task:TaskSpec):TaskSpec {return Object.fromEntries(specFields.filter(k=>task[k]!==undefined).map(k=>[k,task[k]])) as unknown as TaskSpec;}
export function assertFrozenTaskPlan(plan:TaskModelPlan){
 ensure(plan.tasks&&plan.settings&&plan.limit!==undefined&&plan.autoSummarize!==undefined&&Object.keys(plan.taskModels??{}).length===plan.tasks.length,'TASK_MODEL_STALE','冻结计划缺少原批准依据');
 const {tasks,taskModels,goal,settings,limit,model,autoSummarize,sourceRevisionId,developmentReviewInputs,formalReportReviewInputs,taskPermissionEffects,permission}=plan;
 ensure(digest({tasks,taskModels,goal,settings,limit,model,autoSummarize,...(sourceRevisionId?{sourceRevisionId}:{}),...(developmentReviewInputs?{developmentReviewInputs}:{}),...(formalReportReviewInputs?{formalReportReviewInputs}:{}),...(taskPermissionEffects?{taskPermissionEffects,permission}:{})})===plan.digest,'TASK_MODEL_STALE','冻结模型或任务规范与原批准摘要不符');
}
export function resolveTaskModel(plan:TaskModelPlan,task:TaskSpec):ModelConfig {
 if(!plan.taskModels){ensure(task.thinking===undefined&&!plan.tasks?.some(t=>t.thinking!==undefined)&&plan.settings===undefined,'TASK_MODEL_STALE','带选档依据的新计划缺少冻结映射');return plan.model;}
 assertFrozenTaskPlan(plan);
 const frozen=Object.hasOwn(plan.taskModels,task.key)?plan.taskModels[task.key]:undefined,spec=plan.tasks?.find(t=>t.key===task.key);
 ensure(frozen&&spec&&digest(frozen.execution)===frozen.digest,'TASK_MODEL_STALE','冻结任务模型缺失或摘要已改变');
 ensure(digest(taskModelSpec(task))===digest(spec),'TASK_MODEL_STALE','任务规范与原批准计划不符');
 ensure(task.thinking===spec.thinking&&task.thinkingReason===spec.thinkingReason&&frozen.model.provider===plan.model.provider&&frozen.model.model===plan.model.model&&(frozen.model.restoreEpoch??0)===(plan.model.restoreEpoch??0)&&frozen.model.thinking===(spec.thinking??plan.model.thinking),'TASK_MODEL_STALE','任务档位与原批准计划不符');
 ensure(digest(frozen.execution.selection)===digest(frozen.model),'TASK_MODEL_STALE','冻结执行定义与任务模型不符');
 return frozen.model;
}
export function sessionTaskModel(store:Store,session:Row<Session>):FrozenTaskModel|undefined {
 if(!session.taskId)return undefined;
 const task=store.get<Task>('task',session.taskId,session.projectId!),plans=store.list<TaskModelPlan&{teamId:string}>('team-plan',session.projectId!).filter(p=>p.teamId===task.teamId);
 ensure(plans.length===1,'TASK_MODEL_STALE','任务没有唯一的原批准计划');
 const plan=plans[0];if(!plan.taskModels){resolveTaskModel(plan,task);return undefined;}
 const team=store.get<Team>('team',task.teamId,session.projectId!),approval=store.get<Approval>('approval',team.approvalId,session.projectId!);
 ensure(plan.digest===team.planDigest&&approval.digest===team.planDigest&&approval.subjectId===team.id&&approval.subjectKind==='team'&&approval.scope==='collaboration'&&approval.status==='approved','TASK_MODEL_STALE','任务执行定义没有原团队批准依据');
 ensure(session.teamId===task.teamId&&digest(resolveTaskModel(plan,task))===digest(session.model),'TASK_MODEL_STALE','助手会话与冻结任务模型不符');
 return plan.taskModels[task.key];
}
