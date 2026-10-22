import type {ProjectState, Row, Session} from './models.js';

export type SessionWorkOperationStatus =
  | 'confirmed' | 'awaiting_confirmation' | 'awaiting_approval' | 'ready_to_submit'
  | 'running' | 'stopping' | 'completed' | 'completed_with_issue' | 'failed'
  | 'cancelled' | 'blocked' | 'unknown';
export type SessionWorkVerificationStatus = 'pass' | 'fail' | 'skip' | 'not_run' | 'unknown' | 'stale';
export interface SessionWorkValidationEvidence {
  manifestDigest?: string;
  inputDigests?: Array<{id:string;digest:string}>;
  sourceDigest?: string;
  command?: string[];
  exitCode?: number | null;
  integrity?: string;
  startedAt?: string;
  endedAt?: string;
  artifactIds: string[];
  metrics?: Record<string, number>;
}
export interface SessionWorkSummary {
  goal: string;
  scope: string;
  operationStatus: SessionWorkOperationStatus;
  verificationStatus: SessionWorkVerificationStatus;
  recordedVerificationStatus?: SessionWorkVerificationStatus;
  scientificStatus: 'not_assessed' | 'needs_review' | 'reviewed';
  source: {kind: string; id: string};
  snapshotDigest?: string;
  experimentId?: string;
  blocker: string;
  nextAction: string;
  artifactIds: string[];
  validationEvidence?: SessionWorkValidationEvidence;
}

const time = (value: string | undefined): number => {
  const parsed = Date.parse(value ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
};
const newest = <T>(rows: T[]): T[] => [...rows]
  .map((row, index) => ({row, index}))
  .sort((a, b) => time((b.row as any).updatedAt ?? (b.row as any).createdAt) - time((a.row as any).updatedAt ?? (a.row as any).createdAt) || b.index - a.index)
  .map(item => item.row);
const sourceRef = (kind: string, row: {id: string}) => ({kind, id: row.id});
const status = (operationStatus: SessionWorkOperationStatus, verificationStatus: SessionWorkVerificationStatus, fields: Partial<SessionWorkSummary> = {}): SessionWorkSummary => ({
  goal: '', scope: '', source: {kind: 'unknown', id: ''},
  operationStatus, verificationStatus, scientificStatus: 'not_assessed',
  blocker: '', nextAction: '查看当前任务记录与下一步操作。',
  artifactIds: [], ...fields,
});

function briefSummary(data: ProjectState, session: Row<Session>): SessionWorkSummary | null {
  const view = data.researchBrief;
  if (view?.blockedReason) {
    if (!session.researchBriefId || session.researchBriefId !== view.latestId) return null;
    return status('blocked', 'unknown', {
      goal: '研究计划读取受阻', scope: '当前会话绑定的原研究计划',
      source: {kind: 'research-brief', id: session.researchBriefId},
      blocker: '原研究计划当前无法读取或校验，不能确认执行与验证状态。',
      nextAction: '先核对原记录及读取权限；不要自动重跑或创建替代计划。',
    });
  }
  const brief = view?.brief;
  if (!brief || brief.rootSessionId !== session.id || view.latestId !== brief.id) return null;
  const stale = (view.evidenceChecks ?? []).some(check => !check.current);
  if (stale) return status('blocked', 'stale', {
    goal: brief.question, scope: brief.scope, source: sourceRef('research-brief', brief),
    snapshotDigest: brief.digest, blocker: '研究计划引用的来源已失效或发生变化。',
    nextAction: '先刷新并核对失效来源，再决定是否重新确认计划。',
  });
  if (brief.status === 'confirmed') return status('confirmed', 'not_run', {
    goal: brief.question, scope: brief.scope, source: sourceRef('research-brief', brief),
    snapshotDigest: brief.digest, nextAction: '计划已确认；继续研究或查看后续执行记录。',
  });
  return status(brief.status === 'clarifying' ? 'blocked' : 'awaiting_confirmation', 'not_run', {
    goal: brief.question, scope: brief.scope, source: sourceRef('research-brief', brief),
    snapshotDigest: brief.digest,
    blocker: brief.status === 'clarifying' ? '研究问题或范围仍有待澄清事项。' : '',
    nextAction: brief.status === 'clarifying' ? '先回答待澄清问题。' : '核对研究问题、范围和成功标准后再确认。',
  });
}

function runSummary(data: ProjectState, session: Row<Session>): SessionWorkSummary | null {
  const intents = newest((data.intents ?? []).filter(intent => intent.rootSessionId === session.id));
  for (const intent of intents) {
    const run = (data.runs ?? []).find(row => row.id === intent.runId);
    if (run) {
      const experiment = (data.experiments ?? []).find(row => row.id === run.experimentId);
      const staleSource = !!experiment && (
        (typeof run.manifest?.experimentRevision === 'number' && typeof experiment.revision === 'number' && experiment.revision !== run.manifest.experimentRevision)
        || (!!run.manifest?.contractDigest && !!experiment.contractDigest && run.manifest.contractDigest !== experiment.contractDigest)
      );
      const valid = run.state === 'succeeded' && run.integrity === 'complete' && run.exitCode === 0;
      const failed = run.state === 'failed' || run.state === 'cancelled' || (run.exitCode !== undefined && run.exitCode !== null && run.exitCode !== 0);
      const operationStatus = run.state === 'unknown' ? 'unknown'
        : run.state === 'cancelling' ? 'stopping'
        : run.state === 'succeeded' && !valid ? 'completed_with_issue'
        : failed ? (run.state === 'cancelled' ? 'cancelled' : 'failed')
        : valid ? 'completed' : 'running';
      const verificationStatus = run.state === 'unknown' || run.state === 'cancelling' ? 'unknown'
        : run.state === 'cancelled' ? 'not_run'
        : failed ? 'fail'
        : staleSource ? 'stale'
        : valid ? 'pass'
        : run.state === 'succeeded' ? 'unknown' : 'not_run';
      return status(operationStatus, verificationStatus, {
        recordedVerificationStatus:verificationStatus==='stale'?(valid?'pass':run.state==='succeeded'?'unknown':'not_run'):verificationStatus,
        goal: experiment?.title ?? ('正式运行 ' + run.id),
        scope: '固定正式运行 ' + run.id,
        source: sourceRef('run', run), experimentId: run.experimentId,
        snapshotDigest: run.manifest?.snapshotDigest ?? run.manifestDigest ?? intent.manifestDigest,
        artifactIds: [...(run.artifactIds ?? [])],
        validationEvidence: {
          manifestDigest: run.manifestDigest,
          inputDigests: (run.manifest as any)?.dataArtifacts?.map((a:any)=>({id:a.id,digest:a.digest})),
          sourceDigest: run.manifest?.snapshotDigest ?? run.manifestDigest ?? intent.manifestDigest,
          command: run.manifest?.contract?.command,
          exitCode: run.exitCode, integrity: run.integrity,
          startedAt: run.startedAt, endedAt: run.endedAt,
          artifactIds: [...(run.artifactIds ?? [])], metrics: run.metrics,
        },
        blocker: run.error ?? (staleSource ? '当前实验版本与运行快照不一致；历史 Run 仍有效，但不能作为当前版本的验证证据。' : run.state === 'succeeded' && !valid ? '运行结束，但退出码或完整性证据不足。' : ''),
        scientificStatus: valid ? (run.judgment && run.judgment !== 'pending' ? 'reviewed' : 'needs_review') : 'not_assessed',
        nextAction: run.state === 'unknown' || run.state === 'cancelling'
          ? '先核对同一个 Run 的真实状态和回执；不要自动重跑。'
          : ['running', 'queued', 'submitting'].includes(run.state)
            ? '等待原运行结束，再检查退出码、完整性和产物。'
            : staleSource ? '历史运行仍绑定原快照；对当前实验新版本重新执行适用的验证，不能复用旧通过状态。'
              : valid ? '查看固定产物与验证证据；科学判断仍需单独核查。'
                : failed ? '查看原运行日志与失败诊断，确认原因后再决定是否重试。'
                  : '核对原运行的退出码、完整性与产物，当前不能标记验证通过。',
      });
    }
    if (intent.status === 'submitted' && intent.runId && !run) {
      const experiment = (data.experiments ?? []).find(row => row.id === intent.experimentId);
      return status('unknown', 'unknown', {
        goal: experiment?.title ?? ('正式运行意向 ' + intent.id),
        scope: '已提交的固定运行意向 ' + intent.id,
        source: sourceRef('run-intent', intent), experimentId: intent.experimentId,
        snapshotDigest: intent.manifestDigest,
        blocker: '意向已提交，但当前读取结果中没有关联的 Run 记录；不能据此判断运行失败。',
        nextAction: '先按原意向 ID 核对提交回执和运行列表；不要自动重跑或创建替代意向。',
      });
    }
    if (intent.status === 'prepared' && !intent.runId) {
      const approval = (data.approvals ?? []).find(row => row.id === intent.approvalId);
      const approved = approval?.status === 'approved';
      const experiment = (data.experiments ?? []).find(row => row.id === intent.experimentId);
      return status(approval?.status === 'rejected' ? 'blocked' : approved ? 'ready_to_submit' : 'awaiting_confirmation', 'not_run', {
        goal: experiment?.title ?? ('正式运行意向 ' + intent.id),
        scope: '固定运行意向 ' + intent.id,
        source: sourceRef('run-intent', intent), experimentId: intent.experimentId,
        snapshotDigest: intent.manifestDigest,
        blocker: approval?.status === 'rejected' ? '正式运行审批已拒绝。' : '',
        nextAction: approved ? '提交已批准的原运行意向；不要创建替代意向。' : '核对固定运行范围与审批状态。',
      });
    }
  }
  return null;
}

function developmentSummary(data: ProjectState, session: Row<Session>): SessionWorkSummary | null {
  const tasks = newest((data.developmentTasks ?? []).filter(task => task.sessionId === session.id));
  for (const task of tasks) {
    const job = (data.sandboxJobs ?? []).find(row => row.id === task.jobId);
    if (!job) {
      if (task.jobId) return status('unknown', 'unknown', {
        goal: task.title, scope: '已提交的固定开发测试 ' + task.id + ' · 原作业 ' + task.jobId,
        source: sourceRef('development-task', task), snapshotDigest: task.sourceDigest,
        blocker: '开发测试已提交，但当前读取结果中没有关联的原作业记录；不能据此判断未运行或失败。',
        nextAction: '先按原任务与作业 ID 核对提交回执和作业记录；不要自动重跑或创建替代任务。',
      });
      const approval = (data.approvals ?? []).find(row => row.id === task.grantId);
      const effective = task.effectiveState ?? approval?.status;
      const rejected = effective === 'rejected' || approval?.status === 'rejected';
      const expired = effective === 'expired';
      const stale = effective === 'stale' && !rejected;
      const blocked = rejected || expired || stale || (effective === 'approved' && (task.canSubmit === false || !!task.blockedReason));
      const reason = rejected ? '开发测试审批已拒绝。' : expired ? '开发测试授权已过期，尚未运行。' : stale ? '开发测试来源或授权已失效。' : blocked ? '固定开发测试当前不可提交。' : '';
      return status(blocked ? 'blocked' : effective === 'approved' ? 'ready_to_submit' : 'awaiting_confirmation', stale ? 'stale' : 'not_run', {
        goal: task.title, scope: '固定开发测试 ' + task.id,
        source: sourceRef('development-task', task), snapshotDigest: task.sourceDigest,
        validationEvidence: {sourceDigest: task.sourceDigest, command: task.manifest.command, integrity: 'not_run', artifactIds: []},
        blocker: [task.blockedReason, reason].filter(Boolean).join(' — '),
        nextAction: '先核对原开发测试记录、固定源码摘要、命令和审批状态；尚无测试结果。',
      });
    }
    const passed = job.state === 'succeeded' && job.integrity === 'complete' && job.exitCode === 0;
    const stopping = job.cancelRequested && ['queued', 'starting', 'running'].includes(job.state);
    const failed = job.state === 'failed' || job.state === 'timed_out' || (job.exitCode !== undefined && job.exitCode !== null && job.exitCode !== 0);
    const verificationStatus = job.state === 'unknown' || stopping ? 'unknown' : job.state === 'cancelled' ? 'not_run' : failed ? 'fail' : passed ? 'pass' : job.state === 'stale' ? 'stale' : job.state === 'succeeded' ? 'unknown' : 'not_run';
    const operationStatus = job.state === 'unknown' ? 'unknown' : stopping ? 'stopping' : job.state === 'cancelled' ? 'cancelled' : failed ? 'failed' : passed ? 'completed' : job.state === 'succeeded' ? 'completed_with_issue' : 'running';
    return status(operationStatus, verificationStatus, {
      goal: task.title, scope: '固定开发测试 ' + task.id,
      source: sourceRef('development-job', job), snapshotDigest: job.sourceDigest ?? task.sourceDigest,
      artifactIds: [...(job.artifactIds ?? [])],
      validationEvidence: {manifestDigest:job.manifestDigest??task.manifestDigest,inputDigests:task.manifest.dataArtifacts?.map(a=>({id:a.id,digest:a.digest})),sourceDigest: job.sourceDigest ?? task.sourceDigest, command: task.manifest.command, exitCode: job.exitCode, integrity: job.integrity, startedAt:job.startedAt,endedAt:job.endedAt,artifactIds: [...(job.artifactIds ?? [])]},
      blocker: job.error ?? (job.state === 'timed_out' ? '开发测试已超时，不能视为验证通过。' : job.state === 'succeeded' && !passed ? '测试结果的退出码或完整性证据不足。' : ''),
      nextAction: job.state === 'unknown' || stopping ? '核对同一个原测试作业的真实状态与停止回执；不要盲目重新提交。'
        : job.state === 'cancelled' ? '保留原测试作业与取消记录；没有可复用的验证通过证据。'
        : passed ? '测试通过仅证明本次固定源码和命令的检查通过，不代表科学结论成立。'
          : failed ? '查看失败日志和归档产物，定位原因后再决定是否修复。'
            : '等待原测试作业结束后再读取验证结果。',
    });
  }
  return null;
}

function teamSummary(data: ProjectState, session: Row<Session>): SessionWorkSummary | null {
  const teams = (data.teams ?? []).filter(team => team.rootSessionId === session.id);
  const ids = new Set(teams.map(team => team.id));
  const tasks = newest((data.tasks ?? []).filter(task => ids.has(task.teamId)));
  for (const task of tasks) {
    const team = teams.find(row => row.id === task.teamId);
    const attempt = task.attempts?.find(row => row.id === task.attemptId);
    if (['blocked', 'waiting_user', 'superseded'].includes(task.execution)) {
      return status('blocked', 'not_run', {
        goal: task.objective, scope: '协作任务 ' + task.id,
        source: sourceRef('task', task), blocker: task.blockReason ?? team?.blockReason ?? '当前任务等待处理。',
        nextAction: '查看原任务、审批或阻塞原因后再继续。',
      });
    }
    if (['failed', 'running'].includes(task.execution) && attempt?.state === 'unknown') return status('unknown', 'unknown', {
      goal: task.objective, scope: '协作任务 ' + task.id,
      source: sourceRef('task', task), blocker: attempt.error ?? task.blockReason ?? '原任务的执行回执未知。',
      nextAction: '先核对原任务与当前尝试的真实状态和回执；不要自动重试或创建替代任务。',
    });
    if (task.result) return status(task.result.outcome === 'blocked' ? 'blocked' : task.execution === 'failed' ? 'failed' : task.execution === 'cancelled' ? 'cancelled' : 'completed', 'not_run', {
      goal: task.objective, scope: '协作任务 ' + task.id,
      source: sourceRef('task', task), artifactIds: [...(task.result.artifactIds ?? [])],
      blocker: task.result.outcome === 'blocked' ? task.result.summary : '',
      nextAction: '查看原任务结果与引用证据；任务完成或审查接受不自动证明科学结论正确。',
    });
    if (['failed', 'cancelled', 'pending'].includes(task.execution)) return status(
      task.execution === 'failed' ? 'failed' : task.execution === 'cancelled' ? 'cancelled'
        : team?.state === 'awaiting_approval' ? 'awaiting_approval'
          : team?.state === 'active' && team.delegationEnabled !== false ? 'ready_to_submit' : 'blocked',
      'not_run', {
        goal: task.objective, scope: '协作任务 ' + task.id,
        source: sourceRef('task', task), blocker: task.blockReason ?? team?.blockReason ?? '',
        nextAction: task.execution === 'pending' ? '核对原团队的审批与调度状态，等待原任务分配；不要创建替代任务。'
          : '核对原任务的失败或取消记录；尚无任务结果，不能据此认定工程验证通过。',
      });
    if (task.execution === 'running') return status('running', 'not_run', {
      goal: task.objective, scope: '协作任务 ' + task.id,
      source: sourceRef('task', task), blocker: task.blockReason ?? '',
      nextAction: '等待原任务返回结果；不要创建替代任务。',
    });
  }
  return null;
}

export function summarizeSessionWork(data: ProjectState, session: Row<Session>): SessionWorkSummary | null {
  if (!session || session.role !== 'coordinator' || session.taskId) return null;
  const sources: Record<string, Array<{id: string; updatedAt?: string; createdAt?: string}>> = {
    run: data.runs ?? [], 'run-intent': data.intents ?? [],
    'development-task': data.developmentTasks ?? [], 'development-job': data.sandboxJobs ?? [],
    task: data.tasks ?? [], 'research-brief': data.researchBrief?.brief ? [data.researchBrief.brief] : [],
  };
  const sourceTime = (summary: SessionWorkSummary) => {
    const row = sources[summary.source.kind]?.find(row => row.id === summary.source.id);
    const task = summary.source.kind === 'development-job' ? data.developmentTasks?.find(task => task.jobId === summary.source.id) : undefined;
    return time(row?.updatedAt ?? row?.createdAt ?? task?.updatedAt ?? task?.createdAt);
  };
  return [runSummary(data, session), developmentSummary(data, session), teamSummary(data, session), briefSummary(data, session)]
    .filter((summary): summary is SessionWorkSummary => summary !== null)
    .sort((a, b) => sourceTime(b) - sourceTime(a))[0] ?? null;
}
