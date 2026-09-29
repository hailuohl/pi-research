import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {setup, USER, approve} from '../support/research.mjs';
import {acceptedSource, change} from '../support/collaboration.mjs';

function queuedDerived(s) {
    const source = acceptedSource(s), proposal = change(s, source), child = s.app.changes.apply(USER, proposal.id);
    const intent = s.app.runs.prepare(USER, child.id);
    approve(s.app, intent.approvalId);
    return {source, intent, run: s.app.runs.submit(USER, intent.id)};
}
function revoke(s, source) {
    s.app.teams.directive(USER, source.team.id, {kind: 'revise', content: 'Withdraw source assumptions before execution', taskIds: [source.producer.task.id]});
}
function supervisor(s, run) {
    const processResult = spawnSync(process.execPath, [join(process.cwd(), 'dist/apps/runner-supervisor/index.js'), s.dir, process.cwd(), run.id], {encoding: 'utf8', timeout: 15000, windowsHide: true});
    assert.equal(processResult.error, undefined);
    assert.equal(processResult.status, 0, processResult.stderr);
}
function cancelledWithoutExecution(s, original, reason) {
    const run = s.app.runs.get(USER, original.id);
    const outputDir = s.app.store.paths.physical(run.outputDir);
    assert.equal(run.state, 'cancelled');
    assert.equal(run.cancelRequested, true);
    assert.equal(run.integrity, 'incomplete');
    assert.ok(run.endedAt);
    assert.match(run.error, reason);
    assert.equal(run.startedAt, undefined);
    assert.equal(run.supervisorPid, undefined);
    assert.equal(run.childPid, undefined);
    assert.deepEqual(run.manifest, original.manifest);
    assert.equal(run.manifestDigest, original.manifestDigest);
    assert.deepEqual(readdirSync(outputDir), [], 'no stdout, metrics or process-produced artifacts');
    assert.equal(existsSync(join(s.dir, 'jobs', run.id, 'control')), false, 'execution never reached supervisor control-file creation');
    assert.equal(s.app.store.events(0, s.project.id).filter(e => e.type === 'run.cancelled_before_launch').length, 1);
    return run;
}

test('real supervisor refuses a queued Run after its accepted source is revoked', () => {
    const s = setup(); try {
        const {source, run} = queuedDerived(s);
        revoke(s, source);
        supervisor(s, run);
        const cancelled = cancelledWithoutExecution(s, run, /CHANGE_SOURCE_STALE/);
        supervisor(s, run);
        assert.deepEqual(s.app.runs.get(USER, run.id), cancelled, 'retry cannot relaunch a refused Run');
    } finally { s.close(); }
});

test('launchPending cancels revoked queued sources before spawning a supervisor', () => {
    const s = setup(); try {
        const {source, run} = queuedDerived(s);
        revoke(s, source);
        s.app.runs.launchPending();
        const cancelled = cancelledWithoutExecution(s, run, /CHANGE_SOURCE_STALE/);
        s.app.runs.launchPending();
        assert.deepEqual(s.app.runs.get(USER, run.id), cancelled);
    } finally { s.close(); }
});

test('source revocation preserves a completed real Run and its immutable outputs', () => {
    const s = setup(); try {
        const {source, run} = queuedDerived(s);
        supervisor(s, run);
        const completed = s.app.runs.get(USER, run.id);
        assert.equal(completed.state, 'succeeded', completed.error);
        assert.equal(completed.integrity, 'complete');
        const outputDir = s.app.store.paths.physical(run.outputDir), outputs = new Map(readdirSync(outputDir).map(file => [file, readFileSync(join(outputDir, file))]));
        assert.ok(outputs.has('metrics.json'));
        revoke(s, source);
        s.app.runs.launchPending();
        supervisor(s, run);
        assert.deepEqual(s.app.runs.get(USER, run.id), completed);
        for (const [file, bytes] of outputs) assert.deepEqual(readFileSync(join(outputDir, file)), bytes);
    } finally { s.close(); }
});

test('launch grant rechecks approval and the intent-to-Run binding at the supervisor boundary', () => {
    for (const mode of ['approval', 'binding']) {
        const s = setup(); try {
            const {intent, run} = queuedDerived(s);
            if (mode === 'approval') s.app.approvals.stale(intent.id);
            else {
                const current = s.app.store.get('run-intent', intent.id);
                s.app.store.update('run-intent', intent.id, current.version, {runId: 'another-run'});
            }
            supervisor(s, run);
            cancelledWithoutExecution(s, run, /APPROVAL_STALE/);
        } finally { s.close(); }
    }
});
