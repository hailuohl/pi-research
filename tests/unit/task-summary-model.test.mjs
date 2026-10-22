import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSessionWork } from '../../dist/web/assets/chat-workflows.js';

const session = { id: 's1', role: 'coordinator', state: 'idle', title: 'Research' };
const base = (extra = {}) => ({
  project: { id: 'p1', archived: false },
  researchBrief: null, teams: [], tasks: [], runs: [], intents: [],
  approvals: [], experiments: [], developmentTasks: [], sandboxJobs: [],
  reviews: [], changeProposals: [], artifacts: [], reports: [],
  ...extra,
});

test('shows a no-Run research brief without forcing experimental fields', () => {
  const summary = summarizeSessionWork(base({
    researchBrief: {
      latestId: 'b1',
      brief: { id: 'b1', rootSessionId: 's1', question: 'Explain a theoretical mechanism', scope: 'Use the supplied derivation', status: 'confirmed', digest: 'd1', sourceInputs: [] },
      evidenceChecks: [],
    },
  }), session);
  assert.equal(summary.goal, 'Explain a theoretical mechanism');
  assert.equal(summary.scope, 'Use the supplied derivation');
  assert.equal(summary.operationStatus, 'confirmed');
  assert.equal(summary.verificationStatus, 'not_run');
  assert.equal(summary.scientificStatus, 'not_assessed');
  assert.match(summary.nextAction, /继续|开始/);
});

test('unknown Run remains unknown and recommends inspecting the same Run, never retrying', () => {
  const summary = summarizeSessionWork(base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1', manifestDigest: 'm1' }],
    experiments: [{ id: 'e1', title: 'Fixed experiment', hypothesis: 'H', researchBrief: null }],
    runs: [{ id: 'r1', experimentId: 'e1', intentId: 'i1', state: 'unknown', integrity: 'pending', exitCode: null, manifestDigest: 'm1', artifactIds: [] }],
  }), session);
  assert.equal(summary.source.id, 'r1');
  assert.equal(summary.operationStatus, 'unknown');
  assert.equal(summary.verificationStatus, 'unknown');
  assert.match(summary.nextAction, /核对|检查/);
  assert.match(summary.nextAction, /不要自动重跑|不要自动重试/);
});

test('successful execution is not represented as a scientific conclusion', () => {
  const summary = summarizeSessionWork(base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1', manifestDigest: 'm1' }],
    experiments: [{ id: 'e1', title: 'Fixed experiment', hypothesis: 'H' }],
    runs: [{ id: 'r1', experimentId: 'e1', intentId: 'i1', state: 'succeeded', integrity: 'complete', exitCode: 0, judgment: 'pending', manifestDigest: 'm1', manifest: {contract:{command:['python','run.py']}}, startedAt:'2026-10-22T01:00:00.000Z', endedAt:'2026-10-22T01:01:00.000Z', artifactIds: ['a1'], evidenceIds: [] }],
  }), session);
  assert.equal(summary.operationStatus, 'completed');
  assert.equal(summary.verificationStatus, 'pass');
  assert.equal(summary.scientificStatus, 'needs_review');
  assert.equal(summary.snapshotDigest, 'm1');
  assert.deepEqual(summary.artifactIds, ['a1']);
  assert.deepEqual(summary.validationEvidence.command, ['python','run.py']);
  assert.equal(summary.validationEvidence.exitCode, 0);
  assert.equal(summary.validationEvidence.sourceDigest, 'm1');
});

test('failed development validation is distinct from missing or skipped validation', () => {
  const summary = summarizeSessionWork(base({
    developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'Check implementation', sourceDigest: 'src1', state: 'failed', jobId: 'j1', manifest: { command: ['npm', 'test'] } }],
    sandboxJobs: [{ id: 'j1', developmentTaskId: 'dt1', sessionId: 's1', sourceDigest: 'src1', state: 'failed', integrity: 'complete', exitCode: 1, error: 'assertion failed', artifactIds: [] }],
  }), session);
  assert.equal(summary.operationStatus, 'failed');
  assert.equal(summary.verificationStatus, 'fail');
  assert.equal(summary.snapshotDigest, 'src1');
  assert.match(summary.blocker, /assertion failed/);
  assert.deepEqual(summary.validationEvidence.command, ['npm', 'test']);
  assert.equal(summary.validationEvidence.exitCode, 1);
});

test('stale ResearchBrief sources block continuation and remain explicitly stale', () => {
  const summary = summarizeSessionWork(base({
    researchBrief: {
      latestId: 'b1',
      brief: { id: 'b1', rootSessionId: 's1', question: 'Compare two methods', scope: 'Fixed source only', status: 'confirmed', digest: 'd1', sourceInputs: [] },
      evidenceChecks: [{ current: false, reason: 'source changed' }],
    },
  }), session);
  assert.equal(summary.operationStatus, 'blocked');
  assert.equal(summary.verificationStatus, 'stale');
  assert.match(summary.blocker, /来源|失效/);
  assert.match(summary.nextAction, /核对|刷新|重新确认/);
});

test('does not summarize another session or a team worker as the current owner task', () => {
  assert.equal(summarizeSessionWork(base({
    researchBrief: { latestId: 'b2', brief: { id: 'b2', rootSessionId: 'other', question: 'Foreign', scope: 'Foreign', status: 'confirmed', digest: 'd2' }, evidenceChecks: [] },
    intents: [{ id: 'i2', rootSessionId: 'other', experimentId: 'e2', status: 'submitted', runId: 'r2' }],
  }), session), null);
  assert.equal(summarizeSessionWork(base(), { ...session, role: 'reviewer', taskId: 't1' }), null);
});

test('cancellation in progress is not misreported as a completed validation failure', () => {
  const summary = summarizeSessionWork(base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1', manifestDigest: 'm1' }],
    experiments: [{ id: 'e1', title: 'Fixed experiment' }],
    runs: [{ id: 'r1', experimentId: 'e1', intentId: 'i1', state: 'cancelling', integrity: 'pending', exitCode: null, manifestDigest: 'm1', artifactIds: [] }],
  }), session);
  assert.equal(summary.operationStatus, 'stopping');
  assert.equal(summary.verificationStatus, 'unknown');
  assert.match(summary.nextAction, /不要自动重跑/);
});

test('submitted intent without its Run record is unknown and never treated as absent work', () => {
  const summary = summarizeSessionWork(base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'missing-run', manifestDigest: 'm1' }],
    experiments: [{ id: 'e1', title: 'Fixed experiment' }],
  }), session);
  assert.equal(summary.operationStatus, 'unknown');
  assert.equal(summary.verificationStatus, 'unknown');
  assert.equal(summary.source.id, 'i1');
  assert.match(summary.nextAction, /原意向|原始意向|回执/);
  assert.match(summary.nextAction, /不要自动重跑|不要自动重试/);
});

test('a passed Run snapshot is marked stale when the current experiment revision has changed', () => {
  const summary = summarizeSessionWork(base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1', manifestDigest: 'm1' }],
    experiments: [{ id: 'e1', title: 'Fixed experiment', revision: 3, contractDigest: 'current-contract' }],
    runs: [{ id: 'r1', experimentId: 'e1', intentId: 'i1', state: 'succeeded', integrity: 'complete', exitCode: 0, manifestDigest: 'm1', manifest: {experimentRevision: 2, contractDigest: 'old-contract'}, artifactIds: [] }],
  }), session);
  assert.equal(summary.operationStatus, 'completed');
  assert.equal(summary.verificationStatus, 'stale');
  assert.match(summary.blocker, /版本|快照/);
  assert.match(summary.nextAction, /新版本|重新执行/);
});

test('unreadable bound research briefs retain their original identity with unknown validation', () => {
  for (const blockedReason of ['BRIEF_CORRUPTED', 'EVIDENCE_UNAVAILABLE']) {
    const summary = summarizeSessionWork(base({
      researchBrief: { brief: null, latestId: 'b1', blockedReason, history: [], evidenceChecks: [] },
    }), { ...session, researchBriefId: 'b1' });
    assert.ok(summary, 'an unreadable current brief remains visible');
    assert.deepEqual(summary.source, { kind: 'research-brief', id: 'b1' });
    assert.equal(summary.operationStatus, 'blocked');
    assert.equal(summary.verificationStatus, 'unknown');
    assert.equal(summary.scientificStatus, 'not_assessed');
    assert.equal(summary.snapshotDigest, undefined);
    assert.match(summary.nextAction, /原记录/);
    assert.match(summary.nextAction, /不要自动重跑/);
    assert.deepEqual(summary.artifactIds, []);
  }
});

test('an unreadable brief without a matching current-session binding is not summarized', () => {
  const input = base({ researchBrief: {
    brief: null, latestId: 'foreign-brief', blockedReason: 'BRIEF_CORRUPTED',
    history: [{ id: 'foreign-brief', question: 'Foreign private title' }], evidenceChecks: [],
  } });
  assert.equal(summarizeSessionWork(input, { ...session, researchBriefId: 'b1' }), null);
  assert.equal(summarizeSessionWork(input, session), null);
});

test('development readiness follows the effective authorization and source status', () => {
  for (const [approval, fields, operation, verification, reason] of [
    ['approved', { effectiveState: 'expired', canSubmit: false, blockedReason: 'DEVELOPMENT_EXPIRED' }, 'blocked', 'not_run', /DEVELOPMENT_EXPIRED.*过期/],
    ['approved', { effectiveState: 'stale', canSubmit: false, blockedReason: 'DEVELOPMENT_SOURCE_STALE' }, 'blocked', 'stale', /DEVELOPMENT_SOURCE_STALE.*失效/],
    ['approved', { effectiveState: 'approved', canSubmit: false, blockedReason: 'COMPUTE_QUEUE_FULL' }, 'blocked', 'not_run', /COMPUTE_QUEUE_FULL/],
    ['rejected', { effectiveState: 'rejected', canSubmit: false }, 'blocked', 'not_run', /拒绝/],
    ['pending', { effectiveState: 'pending', canSubmit: false, blockedReason: 'APPROVAL_REQUIRED' }, 'awaiting_confirmation', 'not_run', /APPROVAL_REQUIRED/],
    ['approved', { effectiveState: 'approved', canSubmit: true }, 'ready_to_submit', 'not_run', /^$/],
  ]) {
    const summary = summarizeSessionWork(base({
      developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'Fixed check', sourceDigest: 'source', grantId: 'grant', manifest: { command: ['npm', 'test'] }, ...fields }],
      approvals: [{ id: 'grant', status: approval }],
    }), session);
    assert.equal(summary.operationStatus, operation, JSON.stringify(fields));
    assert.equal(summary.verificationStatus, verification, JSON.stringify(fields));
    assert.match(summary.blocker, reason);
    assert.equal(summary.source.id, 'dt1');
    assert.match(summary.nextAction, /原/);
  }
});

test('a submitted development task with a missing job remains unknown with both original identities', () => {
  const summary = summarizeSessionWork(base({
    developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'Submitted check', jobId: 'missing-job', sourceDigest: 'fixed-source', grantId: 'grant', effectiveState: 'submitted', canSubmit: false, manifest: { command: ['npm', 'test'] } }],
    approvals: [{ id: 'grant', status: 'approved' }],
  }), session);
  assert.equal(summary.operationStatus, 'unknown');
  assert.equal(summary.verificationStatus, 'unknown');
  assert.deepEqual(summary.source, { kind: 'development-task', id: 'dt1' });
  assert.match(summary.scope, /missing-job/);
  assert.match(summary.nextAction, /原.*回执/);
  assert.match(summary.nextAction, /不要自动重跑/);
  assert.equal(summary.scientificStatus, 'not_assessed');
  assert.deepEqual(summary.artifactIds, []);
});

test('sandbox timeout, cancellation and unknown states take precedence over exit codes', () => {
  for (const [state, exitCode, cancelRequested, operation, verification] of [
    ['timed_out', 0, false, 'failed', 'fail'],
    ['cancelled', 137, true, 'cancelled', 'not_run'],
    ['unknown', 137, true, 'unknown', 'unknown'],
    ['running', null, true, 'stopping', 'unknown'],
    ['queued', null, true, 'stopping', 'unknown'],
    ['succeeded', 0, true, 'completed', 'pass'],
    ['failed', 1, true, 'failed', 'fail'],
  ]) {
    const summary = summarizeSessionWork(base({
      developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'Fixed check', sourceDigest: 'source', jobId: 'j1', manifest: { command: ['npm', 'test'] } }],
      sandboxJobs: [{ id: 'j1', developmentTaskId: 'dt1', sessionId: 's1', state, exitCode, cancelRequested, integrity: 'complete', artifactIds: [] }],
    }), session);
    assert.equal(summary.operationStatus, operation, state);
    assert.equal(summary.verificationStatus, verification, state);
    assert.equal(summary.source.id, 'j1');
    if (operation === 'unknown' || operation === 'stopping') assert.match(summary.nextAction, /原|同一个/);
  }
});

test('collaboration tasks without a result retain their failure, cancellation or dispatch status', () => {
  for (const [execution, teamState, operation, verification] of [
    ['failed', 'active', 'failed', 'not_run'],
    ['cancelled', 'active', 'cancelled', 'not_run'],
    ['pending', 'awaiting_approval', 'awaiting_approval', 'not_run'],
    ['pending', 'active', 'ready_to_submit', 'not_run'],
    ['pending', 'paused', 'blocked', 'not_run'],
  ]) {
    const summary = summarizeSessionWork(base({
      teams: [{ id: 'team', rootSessionId: 's1', state: teamState, delegationEnabled: true }],
      tasks: [{ id: 'task', teamId: 'team', objective: 'Fixed collaboration task', execution, blockReason: execution === 'failed' ? 'PROVIDER_FAILED: original failure' : undefined }],
    }), session);
    assert.ok(summary, execution + '/' + teamState);
    assert.equal(summary.operationStatus, operation, execution + '/' + teamState);
    assert.equal(summary.verificationStatus, verification);
    assert.equal(summary.source.id, 'task');
    assert.equal(summary.scientificStatus, 'not_assessed');
    assert.match(summary.nextAction, /原/);
    if (execution === 'failed') assert.match(summary.blocker, /PROVIDER_FAILED: original failure/);
  }
});

test('only the current collaboration attempt can make a task unknown', () => {
  const input = base({
    teams: [{ id: 'team', rootSessionId: 's1', state: 'active' }],
    tasks: [{ id: 'task', teamId: 'team', objective: 'Fixed task', execution: 'failed', attemptId: 'current', attempts: [{ id: 'old', state: 'unknown' }, { id: 'current', state: 'unknown', error: 'Worker receipt missing' }] }],
  });
  const summary = summarizeSessionWork(input, session);
  assert.ok(summary, 'the current unknown attempt remains visible without a result');
  assert.equal(summary.operationStatus, 'unknown');
  assert.equal(summary.verificationStatus, 'unknown');
  assert.match(summary.blocker, /Worker receipt missing/);
  assert.match(summary.nextAction, /原/);
  assert.match(summary.nextAction, /不要/);
  input.tasks[0].execution = 'running';input.tasks[0].attempts[1].state = 'running';
  assert.equal(summarizeSessionWork(input, session).operationStatus, 'running');
  input.tasks[0].execution = 'cancelled';input.tasks[0].attempts[1].state = 'unknown';
  assert.equal(summarizeSessionWork(input, session).operationStatus, 'cancelled');
});

test('the newest original source wins across Run, development, collaboration and brief summaries', () => {
  const input = base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1', updatedAt: '2026-10-22T12:00:00Z' }],
    experiments: [{ id: 'e1', title: 'Old experiment' }],
    runs: [{ id: 'r1', experimentId: 'e1', state: 'succeeded', integrity: 'complete', exitCode: 0, updatedAt: '2026-10-22T01:00:00Z', artifactIds: [] }],
    developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'New check', jobId: 'j1', updatedAt: '2026-10-22T02:00:00Z', manifest: { command: ['npm', 'test'] } }],
    sandboxJobs: [{ id: 'j1', developmentTaskId: 'dt1', sessionId: 's1', state: 'running', startedAt: '2026-10-22T02:00:00Z', artifactIds: [] }],
    teams: [{ id: 'team', rootSessionId: 's1', state: 'active' }],
    tasks: [{ id: 'task', teamId: 'team', objective: 'An older task', execution: 'running', createdAt: '2026-10-22T00:00:00Z' }],
    researchBrief: { latestId: 'b1', brief: { id: 'b1', rootSessionId: 's1', status: 'confirmed', question: 'Old question', scope: 'Fixed scope', createdAt: '2026-10-21T00:00:00Z' }, evidenceChecks: [] },
  });
  const before = structuredClone(input);
  assert.equal(summarizeSessionWork(input, session).source.id, 'j1', 'real HTTP jobs without row timestamps use their original development task time');
  assert.deepEqual(input, before, 'summarizing cannot modify any source record');
  input.sandboxJobs[0].updatedAt = '2026-10-22T00:30:00Z';
  assert.equal(summarizeSessionWork(input, session).source.id, 'r1', 'a present job source time takes precedence over its parent time');
  input.tasks[0].updatedAt = '2026-10-22T03:00:00Z';
  assert.equal(summarizeSessionWork(input, session).source.id, 'task');
  input.researchBrief.brief.updatedAt = '2026-10-22T04:00:00Z';
  assert.equal(summarizeSessionWork(input, session).source.id, 'b1');
});

test('missing or tied source timestamps preserve the established category priority', () => {
  const input = base({
    intents: [{ id: 'i1', rootSessionId: 's1', experimentId: 'e1', status: 'submitted', runId: 'r1' }],
    runs: [{ id: 'r1', experimentId: 'e1', state: 'unknown', artifactIds: [] }],
    developmentTasks: [{ id: 'dt1', sessionId: 's1', title: 'Check', manifest: { command: ['npm', 'test'] } }],
    teams: [{ id: 'team', rootSessionId: 's1', state: 'active' }],
    tasks: [{ id: 'task', teamId: 'team', objective: 'Task', execution: 'running' }],
    researchBrief: { latestId: 'b1', brief: { id: 'b1', rootSessionId: 's1', status: 'confirmed', question: 'Question' }, evidenceChecks: [] },
  });
  for (const timestamp of [undefined, '2026-10-22T00:00:00Z']) {
    for (const row of [input.runs[0], input.developmentTasks[0], input.tasks[0], input.researchBrief.brief]) row.createdAt = timestamp;
    assert.equal(summarizeSessionWork(input, session).source.id, 'r1');
    assert.equal(summarizeSessionWork({ ...input, intents: [] }, session).source.id, 'dt1');
    assert.equal(summarizeSessionWork({ ...input, intents: [], developmentTasks: [] }, session).source.id, 'task');
  }
});
