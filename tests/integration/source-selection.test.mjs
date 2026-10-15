import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, readFileSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID, createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {setup, USER, approve} from '../support/research.mjs';
import {acceptedSource, change} from '../support/collaboration.mjs';

test('HTTP, CLI and Pi dispatcher select degree-2 child source while project remains degree-1', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'pi-selected-source-')), server = createHttpServer({repoRoot: process.cwd(), dataDir: dir, port: 0});
  try {
    const port = await server.listen(), app = server.app;
    const request = async (path, body) => {
      const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID()}, ...(body === undefined ? {} : {body: JSON.stringify(body)})});
      return {status: response.status, data: await response.json()};
    };
    const ok = async (path, body) => {const r = await request(path, body); assert.equal(r.status, 200, JSON.stringify(r.data)); return r.data;};
    const project = await ok('/projects', {name: 'Source selection', template: 'curve-fit'});
    const parent = await ok('/experiments', {projectId: project.id, title: 'degree one'});
    const child = await ok(`/experiments/${parent.id}/children`, {title: 'degree two', config: {polynomialDegree: 2, ridge: 0.000001}});
    const session = await ok('/sessions', {projectId: project.id});
    const permission = await ok(`/sessions/${session.id}/permissions`);
    assert.equal(permission.mode, 'confirm');
    await ok(`/sessions/${session.id}/permissions`, {mode: 'autoEdit', expectedVersion: permission.version});
    const sessionWorkspace = app.store.paths.physical(session.workspace);
    const selected = {experimentId: child.id, revision: 1};
    const operation = (name, input, sessionId) => ok(`/operations/${name}`, {projectId: project.id, ...(sessionId ? {sessionId} : {}), input});
    const projectFile = await ok(`/projects/${project.id}/files?path=config.json`);
    assert.equal(JSON.parse(projectFile.content).polynomialDegree, 1);
    const refused = await request(`/projects/${project.id}/files?path=config.json&experimentId=${child.id}`);
    assert.equal(refused.data.error.code, 'INVALID_INPUT');
    const files = await operation('experiment_source_list', selected);
    const chosen = await operation('experiment_source_read', {...selected, path: 'config.json'});
    assert.equal(JSON.parse(chosen.content).polynomialDegree, 2);
    assert.equal(chosen.sourceDigest, files.sourceDigest);
    assert.equal(chosen.digest, createHash('sha256').update(chosen.content).digest('hex'));
    assert.equal(chosen.snapshotId, files.snapshotId);
    assert.equal(JSON.stringify(chosen).includes(dir), false, 'source output must not expose host roots');
    const cli = spawnSync(process.execPath, ['dist/apps/cli/index.js', 'operation', 'experiment_source_read', '--project', project.id, '--input', JSON.stringify({snapshotId: files.snapshotId, path: 'config.json'}), '--data', dir], {encoding: 'utf8', timeout: 15000, env: {...process.env, NODE_NO_WARNINGS: '1'}});
    assert.equal(cli.status, 0, cli.stderr); assert.deepEqual(JSON.parse(cli.stdout), chosen);
    const diff = await operation('experiment_source_diff', {from: {experimentId: parent.id, revision: 1}, to: selected});
    assert.deepEqual(diff.files.map(f => [f.path, f.status]), [['config.json', 'modified']]);
    const prepared = await operation('workspace_prepare_from_revision', selected, session.id);
    assert.equal(prepared.sourceDigest, chosen.sourceDigest);
    assert.ok(app.sessions.pendingNotices(session.id).some(notice => notice.content.includes(chosen.snapshotId) && notice.content.includes(chosen.sourceDigest)), 'the next Pi prompt receives the selected source identity');
    assert.equal(JSON.parse(readFileSync(join(sessionWorkspace, 'config.json'), 'utf8')).polynomialDegree, 2);
    const row = app.store.get('session', session.id);
    app.store.update('session', row.id, row.version, {state: 'running', generation: 1, leaseUntil: Date.now() + 60000});
    const actor = {type: 'agent', projectId: project.id, sessionId: session.id, role: 'coordinator', generation: 1}, tools = new ToolDispatcher(app);
    const index = await tools.execute(actor, 'project_inspect', {}, 'source-index');
    assert.equal(index.experiments.find(e => e.id === child.id).revision, 1, 'a coordinator can discover the revision without guessing');
    assert.deepEqual(await tools.execute(actor, 'experiment_source_read', {...selected, path: 'config.json'}, 'selected-read'), chosen);
    const privateFile = await tools.execute(actor, 'workspace_read', {path: 'config.json'}, 'private-read');
    await tools.execute(actor, 'workspace_write', {path: 'config.json', content: '{"polynomialDegree":3}', expectedDigest: privateFile.digest}, 'private-write');
    assert.equal(JSON.parse((await operation('experiment_source_read', {...selected, path: 'config.json'})).content).polynomialDegree, 2);
    assert.equal(JSON.parse((await ok(`/projects/${project.id}/files?path=config.json`)).content).polynomialDegree, 1);
    const other = await ok('/projects', {name: 'other'});
    const cross = await request('/operations/experiment_source_read', {projectId: other.id, input: {snapshotId: chosen.snapshotId, path: 'config.json'}});
    assert.equal(cross.data.error.code, 'SCOPE_DENIED');
    for (const path of ['../config.json', sessionWorkspace]) {
      const denied = await request('/operations/experiment_source_read', {projectId: project.id, input: {...selected, path}});
      assert.equal(denied.data.error.code, 'PATH_DENIED');
    }
    const latest = app.store.get('session', session.id);
    app.store.update('session', latest.id, latest.version, {leaseUntil: 0});
    await assert.rejects(tools.execute(actor, 'experiment_source_read', {...selected, path: 'config.json'}, 'selected-read'), {code: 'LEASE_EXPIRED'});
  } finally {await server.close(); rmSync(dir, {recursive: true, force: true});}
});

test('source cache cannot outlive revoked lineage and Registry failure restores prepared workspace', async () => {
  const s = setup();
  try {
    const source = acceptedSource(s, true), proposal = change(s, source), child = s.app.changes.apply(USER, proposal.id);
    const selected = {experimentId: child.id, revision: 1}, key = 'prepare-source';
    const event = s.app.store.event.bind(s.app.store);
    s.app.store.event = (pid, type, payload) => {if (type === 'operation.executed') throw Error('injected outer registry failure'); return event(pid, type, payload);};
    assert.throws(() => s.app.operations.execute(USER, 'workspace_prepare_from_revision', selected, {projectId: s.project.id, sessionId: s.session.id, idempotencyKey: key}), /injected outer registry failure/);
    assert.deepEqual(readdirSync(s.app.store.paths.physical(s.session.workspace)), []);
    assert.equal(s.app.store.get('session', s.session.id).sourceRevisionId, undefined);
    s.app.store.event = event;
    const prepared = s.app.operations.execute(USER, 'workspace_prepare_from_revision', selected, {projectId: s.project.id, sessionId: s.session.id, idempotencyKey: key});
    assert.equal(prepared.prepared, true);
    const row = s.app.store.get('session', s.session.id);
    s.app.store.update('session', row.id, row.version, {state: 'running', generation: 1, leaseUntil: Date.now() + 60000});
    const actor = {type: 'agent', projectId: s.project.id, sessionId: s.session.id, role: 'coordinator', generation: 1}, tools = new ToolDispatcher(s.app);
    const read = {...selected, path: 'analysis.py'};
    await tools.execute(actor, 'experiment_source_read', read, 'fixed-read');
    s.app.teams.directive(USER, source.team.id, {kind: 'revise', content: 'Withdraw the earlier review', taskIds: [source.review.task.id]});
    await assert.rejects(tools.execute(actor, 'experiment_source_read', read, 'fixed-read'), {code: 'CHANGE_SOURCE_STALE'});
    assert.throws(() => s.app.operations.execute(USER, 'experiment_source_list', selected, {projectId: s.project.id}), {code: 'CHANGE_SOURCE_STALE'});
  } finally {s.close();}
});
