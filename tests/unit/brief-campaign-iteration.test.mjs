import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setup, USER, approve, campaign, enroll, submit, fixtureFinish } from '../support/research.mjs';
import { actor, result } from '../support/collaboration.mjs';
import { ResearchApp } from '../../dist/packages/research-app.js';
import { digest } from '../../dist/packages/storage/store.js';

function ready(expectedRevisionId = null, question = 'How does the intervention change the measured outcome?') {
    return { expectedRevisionId, question, scope: 'A fixed local comparison.', constraints: [],
        successCriteria: ['Report the measured difference.'], clarificationQuestions: [], literatureSummary: '',
        hypotheses: [], evidenceIds: [], steps: [{ title: 'Measure', description: 'Run the fixed comparison.' }], status: 'ready' };
}
function confirm(s, rootId = s.session.id, question = 'Fixed question') {
    const root = s.app.store.get('session', rootId, s.project.id);
    const draft = s.app.researchBriefs.save(USER, s.project.id, rootId, ready(root.researchBriefId ?? null, question));
    return s.app.researchBriefs.confirm(USER, s.project.id, rootId, { briefId: draft.id, expectedVersion: draft.version });
}
function observed(s) {
    const c = campaign(s, { rootSessionId: s.session.id }), intent = enroll(s, c), run = submit(s, intent);
    fixtureFinish(s, run, { mse: 0.1 });
    s.app.campaigns.observe();
    return { c, run: s.app.runs.get(USER, run.id), observation: s.app.campaigns.observations(USER, c.id)[0] };
}
const configCandidate = (degree = 3) => ({ title: `degree ${degree}`, hypothesis: 'Compare one fixed software factor.', config: { polynomialDegree: degree, ridge: 0.000001 } });
function decide(s, c, observation, action, candidates, extra = {}) {
    return s.app.decisions.propose(USER, c.id, { expectedVersion: s.app.campaigns.get(USER, c.id).version,
        action, reason: 'Use the verified fixture result for one bounded iteration.', observationIds: [observation.id], candidates, ...extra });
}
function apply(s, decision) {
    approve(s.app, decision.approvalId);
    return s.app.decisions.apply(USER, decision.id, decision.version);
}
function plan(controlRun) {
    return { hypothesis: 'A controlled software acceptance experiment', controlRunIds: [controlRun.id],
        changedFactors: ['polynomialDegree'], dataSplit: 'Fixed local example data.', dataArtifactIds: [], primaryMetric: 'mse',
        guardrailMetrics: ['r2'], repetitions: { count: 1, rationale: 'One deterministic software fixture.' },
        successCriteria: 'Inspect verified outputs.', inconclusiveCriteria: 'Missing or unverified output.',
        stoppingCriteria: 'Stop after this bounded comparison.' };
}
function planDecision(s, c, observation, controlRun, candidate) {
    return decide(s, c, observation, 'refill', [candidate], { experimentPlan: plan(controlRun) });
}
function physical(s, reference) { return s.app.store.paths.physical(reference); }
function reviewed(s, candidate) {
    const session = s.app.sessions.create(USER, s.project.id, { title: 'Isolated candidate implementation' });
    s.app.researchPlans.prepareCandidate(USER, s.project.id, { candidateId: candidate.id, sessionId: session.id });
    writeFileSync(join(physical(s, session.workspace), 'acceptance-check.py'), 'assert 1 + 1 == 2\n');
    const task = s.app.development.prepare(USER, s.project.id, session.id,
        { command: ['python', 'acceptance-check.py'], environmentImageDigest: `python@sha256:${'a'.repeat(64)}` });
    approve(s.app, task.grantId);
    const queued = s.app.development.submit(USER, s.project.id, task.id), job = s.app.store.get('sandbox-job', queued.id);
    writeFileSync(join(physical(s, job.controlDir), 'stdout.log'), 'UNIT FIXTURE: no external process started\n');
    writeFileSync(join(physical(s, job.controlDir), 'stderr.log'), '');
    s.app.development.finalize(job.id, { state: 'succeeded', exitCode: 0 });
    const project = s.app.projects.get(USER, s.project.id);
    s.app.projects.settings(USER, project.id, { expectedVersion: project.version, enabled: true });
    const review = s.app.developmentReviews.prepare(USER, s.project.id, { jobId: job.id });
    approve(s.app, review.approvalId); s.app.teams.activate(USER, review.teamId);
    const claim = s.app.teams.claim(review.teamId);
    s.app.teams.submit(actor(claim), result({ verdict: 'accept', evidenceIds: review.requiredEvidenceIds }));
    const proposal = s.app.changes.prepareReviewed(USER, s.project.id,
        { reviewId: review.id, title: candidate.spec.title, hypothesis: candidate.spec.hypothesis });
    approve(s.app, proposal.approvalId);
    return { proposal, experiment: s.app.changes.apply(USER, proposal.id) };
}

test('non-plan refill and promote bind child experiments and Runs to the Campaign root Brief', () => {
    const s = setup();
    try {
        const first = confirm(s), other = s.app.sessions.create(USER, s.project.id, { title: 'Other root' });
        const otherBrief = confirm(s, other.id, 'A different root brief');
        const { c, observation } = observed(s), current = confirm(s, s.session.id, 'Latest Campaign root brief');
        const refill = apply(s, decide(s, c, observation, 'refill', [configCandidate()]));
        const intent = s.app.store.get('run-intent', refill.effects.intentIds[0]), child = s.app.experiments.get(USER, refill.effects.experimentIds[0]);
        assert.equal(child.researchBrief.id, current.id);
        assert.equal(intent.manifest.researchBrief.id, current.id);
        assert.equal(intent.manifest.researchBrief.rootSessionId, c.rootSessionId);
        assert.equal(intent.manifestDigest, digest(intent.manifest));
        assert.notEqual(intent.manifest.researchBrief.id, otherBrief.id);
        assert.notEqual(intent.manifest.researchBrief.id, first.id);
        assert.throws(() => s.app.runs.submit(USER, intent.id), { code: 'APPROVAL_REQUIRED' });

        approve(s.app, intent.approvalId);
        const run = s.app.runs.submit(USER, intent.id);
        fixtureFinish(s, run, { mse: 0.05 }); s.app.campaigns.observe();
        const candidateObservation = s.app.campaigns.observations(USER, c.id).find(o => o.runId === run.id);
        assert.equal(candidateObservation.validation, 'verified');
        const promoted = apply(s, decide(s, c, candidateObservation, 'promote', [configCandidate(4)], { selectedRunId: run.id }));
        const promotedIntent = s.app.store.get('run-intent', promoted.effects.intentIds[0]);
        const next = s.app.experiments.get(USER, promoted.effects.experimentIds[0]);
        assert.equal(next.parentId, run.experimentId);
        assert.equal(next.researchBrief.id, current.id);
        assert.equal(promotedIntent.manifest.researchBrief.id, current.id);
        assert.equal(promotedIntent.manifest.researchBrief.rootSessionId, c.rootSessionId);
        assert.throws(() => s.app.runs.submit(USER, promotedIntent.id), { code: 'APPROVAL_REQUIRED' });

        s.app.close(); s.app = new ResearchApp(s.dir, process.cwd());
        assert.equal(s.app.store.get('run-intent', promotedIntent.id, s.project.id).manifest.researchBrief.id, current.id);
        assert.equal(s.app.store.get('campaign-decision', promoted.id, s.project.id).status, 'applied');
    } finally { s.close(); }
});

test('plan materialize and reviewed-code attach bind the current Campaign root Brief', () => {
    const s = setup();
    try {
        const { c, run: control, observation } = observed(s), first = confirm(s, s.session.id, 'Plan root brief');
        const configDecision = apply(s, planDecision(s, c, observation, control, { ...configCandidate(), implementation: 'config' }));
        const configIntent = s.app.store.get('run-intent', configDecision.effects.intentIds[0]);
        assert.equal(configIntent.manifest.researchBrief.id, first.id);
        assert.equal(configIntent.manifest.researchBrief.rootSessionId, c.rootSessionId);
        assert.throws(() => s.app.runs.submit(USER, configIntent.id), { code: 'APPROVAL_REQUIRED' });

        approve(s.app, configIntent.approvalId);
        const measured = s.app.runs.submit(USER, configIntent.id);
        fixtureFinish(s, measured, { mse: 0.05 }); s.app.campaigns.observe();
        const measuredObservation = s.app.campaigns.observations(USER, c.id).find(o => o.runId === measured.id);
        const reviewedDecision = apply(s, planDecision(s, c, measuredObservation, measured,
            { title: 'reviewed candidate', hypothesis: 'Reviewed code change.', implementation: 'reviewed-code' }));
        const candidate = s.app.store.get('research-candidate', reviewedDecision.effects.candidateIds[0]);
        const fixed = reviewed(s, candidate), latest = confirm(s, s.session.id, 'Latest root brief at attachment');
        const attached = s.app.researchPlans.attachCandidate(USER, s.project.id,
            { candidateId: candidate.id, proposalId: fixed.proposal.id });
        const intent = s.app.store.get('run-intent', attached.intentId);
        assert.equal(intent.manifest.researchBrief.id, latest.id);
        assert.equal(intent.manifest.researchBrief.rootSessionId, c.rootSessionId);
        assert.equal(intent.rootSessionId, c.rootSessionId);
        assert.throws(() => s.app.runs.submit(USER, intent.id), { code: 'APPROVAL_REQUIRED' });
    } finally { s.close(); }
});

test('an unconfirmed Campaign root Brief aborts refill and plan materialization without partial records', () => {
    const s = setup();
    try {
        const confirmed = confirm(s), other = s.app.sessions.create(USER, s.project.id, { title: 'Other confirmed root' });
        confirm(s, other.id, 'Only the other root remains confirmed');
        const { c, run: control, observation } = observed(s);
        const direct = decide(s, c, observation, 'refill', [configCandidate()]);
        const planned = planDecision(s, c, observation, control, { ...configCandidate(4), implementation: 'config' });
        approve(s.app, direct.approvalId); approve(s.app, planned.approvalId);
        const root = s.app.store.get('session', c.rootSessionId, s.project.id);
        s.app.researchBriefs.save(USER, s.project.id, root.id, ready(confirmed.id, 'Unconfirmed latest root revision'));
        const experimentCount = s.app.store.list('experiment', s.project.id).length;
        const intentCount = s.app.store.list('run-intent', s.project.id).length;
        assert.throws(() => s.app.decisions.apply(USER, direct.id, direct.version), { code: 'BRIEF_NOT_CONFIRMED' });
        assert.throws(() => s.app.decisions.apply(USER, planned.id, planned.version), { code: 'BRIEF_NOT_CONFIRMED' });
        assert.equal(s.app.store.list('experiment', s.project.id).length, experimentCount);
        assert.equal(s.app.store.list('run-intent', s.project.id).length, intentCount);
        assert.equal(s.app.store.list('research-candidate', s.project.id).length, 0);

        const foreign = s.app.projects.create(USER, { name: 'Foreign root scope' });
        const foreignRoot = s.app.sessions.create(USER, foreign.id, { title: 'Foreign coordinator' });
        assert.throws(() => s.app.runs.prepare(USER, s.baseline.id, foreignRoot.id), { code: 'SCOPE_DENIED' });
        assert.equal(s.app.store.list('run-intent', s.project.id).length, intentCount);
    } finally { s.close(); }
});

test('legacy Campaign without a confirmed Brief remains unbound and survives reopening', () => {
    const s = setup();
    try {
        const { c, observation } = observed(s), decision = apply(s, decide(s, c, observation, 'refill', [configCandidate()]));
        const intent = s.app.store.get('run-intent', decision.effects.intentIds[0]);
        assert.equal(intent.manifest.researchBrief, undefined);
        assert.throws(() => s.app.runs.submit(USER, intent.id), { code: 'APPROVAL_REQUIRED' });
        s.app.close(); s.app = new ResearchApp(s.dir, process.cwd());
        assert.equal(s.app.store.get('run-intent', intent.id, s.project.id).manifest.researchBrief, undefined);
        assert.equal(s.app.store.get('campaign-decision', decision.id, s.project.id).status, 'applied');
    } finally { s.close(); }
});
