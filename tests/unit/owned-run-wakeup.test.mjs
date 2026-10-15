import test from 'node:test';
import assert from 'node:assert/strict';
import { approve, fixtureFinish, setup, USER } from '../support/research.mjs';
import { ResearchApp } from '../../dist/packages/research-app.js';

function finishRun(s, autoAnalyze = true, state = 'succeeded', rootSessionId = s.session.id) {
    const root = s.app.sessions.get(USER, rootSessionId);
    s.app.store.update('session', root.id, root.version, { model: { provider: 'test', model: 'fixture', thinking: 'off' } });
    const intent = s.app.runs.prepare(USER, s.baseline.id, rootSessionId, autoAnalyze);
    approve(s.app, intent.approvalId);
    const run = s.app.runs.submit(USER, intent.id);
    fixtureFinish(s, run, { mse: 0.2 }, state);
    return { intent, run: s.app.runs.get(USER, run.id) };
}

function finishBranchedRun(s) {
    const root = s.app.sessions.get(USER, s.session.id);
    s.app.store.update('session', root.id, root.version, { model: { provider: 'test', model: 'fixture', thinking: 'off' } });
    const source = s.app.sessions.send(USER, root.id, { content: 'create a research branch' });
    const branch = s.app.sessions.branch(USER, root.id, source.id);
    return { branch, run: finishRun(s, true, 'succeeded', branch.id).run };
}

function start(s, w) {
    const dispatched = s.app.wakeups.dispatch(w.id, { ready: true });
    assert.ok(dispatched);
    const root = s.app.sessions.get(USER, w.rootSessionId);
    s.app.store.transaction(() => {
        const next = s.app.store.update('session', root.id, root.version,
            { state: 'running', generation: root.generation + 1, leaseUntil: Date.now() + 30_000 });
        s.app.store.update('message', dispatched.message.id, dispatched.message.version, { status: 'running' });
        s.app.wakeups.markStarted(w.id, next.id, next.generation, dispatched.message.id);
    });
    return { dispatched, root: s.app.sessions.get(USER, root.id) };
}

test('opted-in terminal Run queues one root analysis with verified metrics', () => {
    const s = setup();
    try {
        const { intent, run } = finishRun(s);
        s.app.wakeups.reconcile();
        s.app.wakeups.reconcile();
        const notices = s.app.wakeups.list(USER, s.project.id);
        assert.equal(notices.length, 1);
        const w = notices[0];
        assert.equal(w.sourceKind, 'run-result');
        assert.equal(w.sourceId, run.id);
        assert.equal(w.ownerId, intent.id);
        assert.equal(w.rootSessionId, s.session.id);
        assert.equal(w.automatic, true);
        assert.equal(w.maxAttempts, 1);
        assert.equal(s.app.budget.summary(intent.id).available, 1);

        const context = s.app.wakeups.context(w);
        assert.equal(context.run.validation, 'verified');
        assert.deepEqual(context.run.metrics, run.metrics);
        assert.deepEqual(context.run.artifactIds, run.artifactIds);
        assert.deepEqual(context.run.evidenceIds, run.evidenceIds);
        assert.equal(context.run.manifestBrief, null);
        assert.equal('hypothesis' in context.run, false);

        const { dispatched } = start(s, w);
        assert.equal(dispatched.message.sessionId, s.session.id);
        assert.equal(dispatched.message.role, 'system');
        assert.equal(dispatched.message.origin, 'automation');
        const actor = { type: 'agent', role: 'coordinator', projectId: s.project.id,
            sessionId: s.session.id, generation: s.app.sessions.get(USER, s.session.id).generation, wakeupId: w.id };
        const resources = s.app.wakeups.resources(actor);
        assert.deepEqual([...resources.runIds], [run.id]);
        assert.deepEqual([...resources.artifactIds].sort(), [...run.artifactIds].sort());
        assert.deepEqual([...resources.evidenceIds].sort(), [...run.evidenceIds].sort());

        s.app.close();
        s.app = new ResearchApp(s.dir, process.cwd());
        s.app.wakeups.reconcile();
        assert.equal(s.app.wakeups.list(USER, s.project.id).length, 1);
        assert.equal(s.app.wakeups.get(USER, w.id).state, 'running');
    } finally { s.close(); }
});

test('a branched coordinator can own a Run analysis', () => {
    const s = setup();
    try {
        const { branch, run } = finishBranchedRun(s);
        s.app.wakeups.reconcile();
        const w = s.app.wakeups.list(USER, s.project.id)[0];
        assert.equal(w.sourceId, run.id);
        assert.equal(w.ownerId, run.intentId);
        assert.equal(w.rootSessionId, branch.id);
        assert.equal(w.state, 'pending');
        const dispatched = s.app.wakeups.dispatch(w.id, { ready: true });
        assert.equal(dispatched.message.sessionId, branch.id);
    } finally { s.close(); }
});

test('opt-out, changed root, revoked approval, RunGrant, and Campaign membership do not enqueue', () => {
    const s = setup();
    try {
        finishRun(s, false);
        const crossing = finishRun(s);
        let currentIntent = s.app.store.get('run-intent', crossing.intent.id);
        s.app.store.update('run-intent', currentIntent.id, currentIntent.version, { rootSessionId: 'another-root' });

        const revoked = finishRun(s);
        const approval = s.app.store.get('approval', revoked.intent.approvalId);
        s.app.store.update('approval', approval.id, approval.version, { status: 'stale' });

        const granted = finishRun(s);
        const currentRun = s.app.runs.get(USER, granted.run.id);
        s.app.store.update('run', currentRun.id, currentRun.version,
            { runGrant: { id: 'grant', digest: 'grant-digest', approvalId: 'grant-approval' } });

        const member = finishRun(s);
        s.app.store.create('campaign-member', s.project.id, { campaignId: 'campaign', roundId: 'round',
            experimentId: member.run.experimentId, intentId: member.intent.id, required: true });

        s.app.wakeups.reconcile();
        assert.equal(s.app.wakeups.list(USER, s.project.id).length, 0);
        for (const { intent } of [crossing, revoked, granted, member])
            assert.equal(s.app.budget.summary(intent.id).available, 1);
    } finally { s.close(); }
});

test('failed Run is labeled incomplete and never supplies unverified metrics', () => {
    const s = setup();
    try {
        const { run } = finishRun(s, true, 'failed');
        s.app.wakeups.reconcile();
        const w = s.app.wakeups.list(USER, s.project.id)[0];
        const { run: result } = s.app.wakeups.context(w);
        assert.equal(result.state, 'failed');
        assert.equal(result.validation, 'incomplete');
        assert.equal(result.metrics, null);
        assert.equal(result.exitCode, 1);
        assert.equal(result.id, run.id);
    } finally { s.close(); }
});

test('changed result supersedes the single stable notification without a replacement', () => {
    const s = setup();
    try {
        const { run } = finishRun(s);
        s.app.wakeups.reconcile();
        let w = s.app.wakeups.list(USER, s.project.id)[0];
        const root = s.app.sessions.get(USER, w.rootSessionId), approvedModel = structuredClone(root.model);
        s.app.store.update('session', root.id, root.version, { model: { provider: 'other', model: 'changed', thinking: 'off' } });
        s.app.wakeups.reconcile();
        w = s.app.wakeups.get(USER, w.id);
        assert.equal(w.state, 'pending');
        assert.match(w.blockReason, /模型/);
        assert.equal(w.attempts, 0);
        assert.equal(s.app.budget.summary(w.ownerId).reserved, 0);
        const changedRoot = s.app.sessions.get(USER, root.id);
        s.app.store.update('session', root.id, changedRoot.version, { model: approvedModel });
        assert.ok(s.app.wakeups.dispatch(w.id, { ready: true }));
        const current = s.app.runs.get(USER, run.id);
        s.app.store.update('run', run.id, current.version, { error: 'terminal result changed' });
        s.app.wakeups.reconcile();
        assert.equal(s.app.wakeups.list(USER, s.project.id).length, 1);
        assert.equal(s.app.wakeups.get(USER, w.id).state, 'superseded');
        assert.equal(s.app.budget.summary(w.ownerId).available, 1);
    } finally { s.close(); }
});

test('unknown start is permanent; only a proven zero-use pre-fork failure can be manually recovered', () => {
    const s = setup();
    try {
        const { intent } = finishRun(s);
        s.app.wakeups.reconcile();
        let w = s.app.wakeups.list(USER, s.project.id)[0];
        start(s, w);
        s.app.wakeups.finish(w.id, 'worker outcome unknown', true);
        const root = s.app.sessions.get(USER, w.rootSessionId);
        s.app.store.update('session', root.id, root.version, { state: 'idle', leaseUntil: 0 });
        s.app.wakeups.reconcile();
        w = s.app.wakeups.get(USER, w.id);
        assert.equal(s.app.budget.summary(intent.id).unknown, 1);
        assert.throws(() => s.app.wakeups.retry(USER, w.id), { code: 'WAKEUP_NOT_RETRYABLE' });

        const other = finishRun(s);
        s.app.wakeups.reconcile();
        w = s.app.wakeups.list(USER, s.project.id).find(item => item.sourceId === other.run.id);
        const dispatch = s.app.wakeups.dispatch(w.id, { ready: true });
        assert.ok(dispatch);
        const queued = s.app.wakeups.get(USER, w.id);
        s.app.store.transaction(() => {
            const message = s.app.store.get('message', dispatch.message.id);
            s.app.store.update('message', message.id, message.version, { status: 'failed', error: 'fork failed before start' });
            s.app.store.update('wakeup', queued.id, queued.version, { attempts: 0 });
        });
        s.app.wakeups.finish(w.id, 'fork failed before start', false);
        s.app.wakeups.reconcile();
        assert.equal(s.app.wakeups.get(USER, w.id).state, 'failed');
        assert.equal(s.app.budget.summary(other.intent.id).used, 0);
        assert.equal(s.app.wakeups.dispatch(w.id, { ready: true }), null);
        s.app.wakeups.retry(USER, w.id);
        assert.equal(s.app.wakeups.get(USER, w.id).state, 'pending');
        assert.ok(s.app.wakeups.dispatch(w.id, { ready: true }));
    } finally { s.close(); }
});
