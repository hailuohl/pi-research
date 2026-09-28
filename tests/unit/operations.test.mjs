import {operationRoute} from '../../dist/apps/server/operation-routes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {setup, USER, approve, fixtureFinish} from '../support/research.mjs';
import {startTeam, spec, actor, result} from '../support/collaboration.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {digest} from '../../dist/packages/storage/store.js';

const context = (s, key, session = false) => ({projectId: s.project.id, idempotencyKey: key, ...(session ? {sessionId: s.session.id} : {})});
function coordinator(s) {
  const old = s.app.store.get('session', s.session.id);
  s.app.store.update('session', old.id, old.version, {state: 'running', generation: 1, leaseUntil: Date.now() + 30000});
  return {type: 'agent', projectId: s.project.id, sessionId: s.session.id, generation: 1, role: 'coordinator'};
}
function connector(s, fetcher) {
  s.app.connectors = new ConnectorService(s.app.context, s.app.evidence, {transport: new ConnectorTransport({fetcher, minIntervalMs: 0}), credentials: () => ({})});
  const cfg = s.app.connectors.settings(USER, s.project.id);
  s.app.connectors.configure(USER, s.project.id, {expectedVersion: cfg.version, enabled: {openalex: true}});
}
const paper = {id: 'https://openalex.org/W123', title: 'Fixture paper', abstract_inverted_index: {Original: [0], text: [1]}};

test('registered inputs reject silent experiment overrides; user reads do not write records or events', async () => {
  const s = setup();
  try {
    const a = coordinator(s), tools = new ToolDispatcher(s.app);
    const input = {path: 'config.json', source: 'project', experimentId: s.baseline.id};
    assert.throws(() => s.app.operations.execute(USER, 'workspace_read', input, context(s)), {code: 'INVALID_INPUT'});
    await assert.rejects(tools.execute(a, 'workspace_read', input, 'read'), {code: 'INVALID_INPUT'});
    const events = s.app.store.events().length, operations = s.app.store.db.prepare('SELECT count(*) AS n FROM operations').get().n;
    const read = s.app.operations.execute(USER, 'workspace_read', {path: 'config.json', source: 'project'}, context(s));
    validateSchema(OUTPUT_SCHEMAS.workspace_read, read, 'output');
    assert.equal(s.app.store.events().length, events);
    assert.equal(s.app.store.db.prepare('SELECT count(*) AS n FROM operations').get().n, operations);
  } finally {s.close();}
});

test('workspace operations retain role, lease, generation and legal replay boundaries', async () => {
  const s = setup();
  try {
    const a = coordinator(s), tools = new ToolDispatcher(s.app), input = {path: 'private.txt', content: 'one', expectedDigest: null};
    await assert.rejects(tools.execute(a, 'workspace_write', {...input, source: 'project'}, 'denied'), {code: 'SCOPE_DENIED'});
    const written = await tools.execute(a, 'workspace_write', input, 'stable');
    let session = s.app.store.get('session', a.sessionId);
    s.app.store.update('session', session.id, session.version, {leaseUntil: 0});
    assert.deepEqual(await tools.execute(a, 'workspace_write', input, 'stable'), written);
    await assert.rejects(tools.execute(a, 'workspace_write', {...input, path: 'late.txt'}, 'new'), {code: 'LEASE_EXPIRED'});
    session = s.app.store.get('session', a.sessionId);
    s.app.store.update('session', session.id, session.version, {generation: 2});
    await assert.rejects(tools.execute(a, 'workspace_write', input, 'stable'), {code: 'LEASE_EXPIRED'});
  } finally {s.close();}
});

test('archive blocks new mutations while preserving historical owner replay and final Run outputs', () => {
  const s = setup();
  try {
    const input = {experimentId: s.baseline.id}, intent = s.app.operations.execute(USER, 'run_prepare', input, context(s, 'prepare'));
    assert.throws(() => s.app.operations.execute(USER, 'run_submit', {intentId: intent.id}, context(s, 'unapproved')), {code: 'APPROVAL_REQUIRED'});
    approve(s.app, intent.approvalId);
    const run = s.app.operations.execute(USER, 'run_submit', {intentId: intent.id}, context(s, 'submit'));
    fixtureFinish(s, run);
    const project = s.app.store.get('project', s.project.id);
    s.app.projects.archive(USER, project.id, project.version);
    assert.equal(s.app.operations.execute(USER, 'run_prepare', input, context(s, 'prepare')).id, intent.id);
    assert.throws(() => s.app.operations.execute(USER, 'run_prepare', input, context(s, 'fresh')), {code: 'PROJECT_ARCHIVED'});
    const history = s.app.operations.execute(USER, 'run_submit', {intentId: intent.id}, context(s, 'history'));
    assert.equal(history.state, 'succeeded');
    validateSchema(OUTPUT_SCHEMAS.run_submit, history, 'output');
  } finally {s.close();}
});

test('legacy run preparation is adopted even when first replay is directly through the canonical operation', () => {
  const s = setup();
  try {
    const input = {experimentId: s.baseline.id}, key = 'old-key';
    const old = s.app.store.operation('POST:/run-intents', key, {body: input, query: ''}, () => s.app.runs.prepare(USER, s.baseline.id));
    assert.equal(s.app.operations.execute(USER, 'run_prepare', input, context(s, key)).id, old.id);
    assert.equal(s.app.store.list('run-intent').length, 1);
    assert.equal(s.app.store.list('approval').length, 1);
    const other = s.app.projects.create(USER, {name: 'other'});
    assert.throws(() => s.app.operations.execute(USER, 'run_prepare', input, {projectId: other.id, idempotencyKey: key}), {code: 'SCOPE_DENIED'});
  } finally {s.close();}
});

test('task submission is host-identity only and finished attempts replay without duplicate acceptance', async () => {
  const s = setup();
  try {
    const team = startTeam(s, [spec('analysis')]), claimed = s.app.teams.claim(team.id), a = actor(claimed), tools = new ToolDispatcher(s.app);
    assert.throws(() => s.app.operations.execute(USER, 'task_result_submit', result(), context(s, 'owner')), {code: 'PERMISSION_DENIED'});
    const first = await tools.execute(a, 'task_result_submit', result(), 'result');
    assert.equal(first.kind, 'task-result');
    assert.deepEqual(await tools.execute(a, 'task_result_submit', result(), 'result'), first);
    assert.equal(s.app.store.list('task-result').length, 1);
    await assert.rejects(tools.execute(a, 'task_result_submit', result({summary: 'changed'}), 'result'), {code: 'IDEMPOTENCY_CONFLICT'});
  } finally {s.close();}
});

test('proposals preserve deletion, approval staleness, strict output and transactional rollback', () => {
  const s = setup();
  try {
    const file = s.app.experiments.readFile(USER, s.baseline.id, 'README.md');
    const proposal = s.app.operations.execute(USER, 'change_proposal_prepare', {baseExperimentId: s.baseline.id, expectedRevision: 1, title: 'Remove readme', hypothesis: 'contract only', changes: [{path: 'README.md', artifactId: null, expectedDigest: file.digest}]}, context(s, 'proposal'));
    validateSchema(OUTPUT_SCHEMAS.change_proposal_prepare, proposal, 'output');
    assert.throws(() => validateSchema(OUTPUT_SCHEMAS.change_proposal_prepare, {...proposal, injected: 1}, 'output'), {code: 'INVALID_OUTPUT'});
    const intent = s.app.operations.execute(USER, 'run_prepare', {experimentId: s.baseline.id}, context(s, 'intent'));
    approve(s.app, intent.approvalId);
    const experiment = s.app.experiments.get(USER, s.baseline.id);
    s.app.store.update('experiment', experiment.id, experiment.version, {revision: experiment.revision + 1});
    assert.throws(() => s.app.operations.execute(USER, 'run_submit', {intentId: intent.id}, context(s, 'submit')), {code: 'APPROVAL_STALE'});
    const prepare = s.app.runs.prepare.bind(s.app.runs), before = s.app.store.list('run-intent').length;
    s.app.runs.prepare = (...args) => ({...prepare(...args), unexpected: true});
    assert.throws(() => s.app.operations.execute(USER, 'run_prepare', {experimentId: s.baseline.id}, context(s, 'bad-output')), {code: 'INVALID_OUTPUT'});
    assert.equal(s.app.store.list('run-intent').length, before);
  } finally {s.close();}
});

test('paper legacy/canonical replay and simultaneous callers share one provider request; revocation is rechecked', async () => {
  const s = setup();
  let calls = 0;
  try {
    connector(s, async () => {calls++; return Response.json(paper);});
    const input = {id: 'W123'}, key = 'paper';
    const [one, two] = await Promise.all([
      operationRoute(s.app, '/connectors/paper', {projectId: s.project.id, ...input}, key, new AbortController().signal, 'POST', '').result,
      s.app.operations.execute(USER, 'paper_read', input, context(s, key)),
    ]);
    assert.deepEqual(two, one);
    assert.equal((await s.app.operations.execute(USER, 'paper_read', input, context(s, key))).id, one.id);
    assert.equal(calls, 1);
    assert.equal(s.app.store.list('paper-read').length, 1);
    const cfg = s.app.connectors.settings(USER, s.project.id);
    s.app.connectors.configure(USER, s.project.id, {expectedVersion: cfg.version, enabled: {openalex: false}});
    await assert.rejects(s.app.operations.execute(USER, 'paper_read', input, context(s, key)), {code: 'SOURCE_DISABLED'});
    assert.equal(calls, 1);
  } finally {s.close();}
});

test('historical http paper cache is reused and cancellation cannot commit a newly fetched paper', async () => {
  const s = setup();
  let calls = 0;
  try {
    connector(s, async () => {calls++; return Response.json(paper);});
    const old = await s.app.connectors.paper(USER, s.project.id, {id: 'W123'}, 'http:history');
    assert.equal((await s.app.operations.execute(USER, 'paper_read', {id: 'W123'}, context(s, 'history'))).id, old.id);
    assert.equal(calls, 1);
    const controller = new AbortController();
    connector(s, async () => {controller.abort(); return Response.json(paper);});
    await assert.rejects(s.app.operations.execute(USER, 'paper_read', {id: 'W123'}, {...context(s, 'cancel'), signal: controller.signal}));
    assert.equal(s.app.store.list('paper-read').length, 1);
    assert.equal(s.app.store.list('operation-pending').length, 0);
  } finally {s.close();}
});

test('unresolved external reads block duplicate callers; a persisted receipt recovers after process interruption', async () => {
  const s = setup();
  let calls = 0;
  try {
    connector(s, async () => {calls++; return Response.json(paper);});
    const key = 'interrupted', input = {id: 'W123'}, request = {name: 'paper_read', input};
    const pendingId = digest({scope: `operation:user:${s.project.id}:project`, key});
    s.app.store.create('operation-pending', s.project.id, {hash: digest(request), operation: 'paper_read'}, pendingId);
    assert.throws(() => s.app.operations.execute(USER, 'paper_read', input, context(s, key)), {code: 'OPERATION_IN_PROGRESS'});
    assert.equal(calls, 0);
    const receipt = await s.app.connectors.paper(USER, s.project.id, input, key);
    const resumed = await s.app.operations.execute(USER, 'paper_read', input, context(s, key));
    assert.equal(resumed.id, receipt.id);
    assert.equal(calls, 1);
    assert.equal(s.app.store.list('operation-pending').length, 0);
  } finally {s.close();}
});

test('an in-flight external key cannot be reused for a synchronous mutation', async () => {
  const s = setup();
  let release, entered;
  const started = new Promise(resolve => {entered = resolve;});
  try {
    connector(s, () => {entered(); return new Promise(resolve => {release = () => resolve(Response.json(paper));});});
    const read = s.app.operations.execute(USER, 'paper_read', {id: 'W123'}, context(s, 'shared-key'));
    await started;
    assert.throws(() => s.app.operations.execute(USER, 'run_prepare', {experimentId: s.baseline.id}, context(s, 'shared-key')), {code: 'IDEMPOTENCY_CONFLICT'});
    assert.equal(s.app.store.list('run-intent').length, 0);
    release();
    assert.equal((await read).kind, 'paper-read');
    assert.equal(s.app.store.list('paper-read').length, 1);
  } finally {release?.(); s.close();}
});

test('separate processes serialize simultaneous run_prepare before side effects', async () => {
  const s = setup(), children = [];
  try {
    const module = pathToFileURL(resolve('dist/packages/research-app.js')).href;
    const program = `import {ResearchApp} from ${JSON.stringify(module)};
      const app=new ResearchApp(process.env.TEST_DATA,process.env.TEST_ROOT);
      process.send('ready'); process.on('message',()=>{try{const r=app.operations.execute({type:'user'},'run_prepare',{experimentId:process.env.TEST_EXPERIMENT},{projectId:process.env.TEST_PROJECT,idempotencyKey:'concurrent'});process.send({id:r.id});}catch(e){process.send({error:e.code??e.message});}finally{app.close();process.disconnect();}});`;
    const ready = [], done = [];
    for (let i = 0; i < 2; i++) {
      const child = fork('-e', [program], {execArgv: ['--input-type=module'], env: {...process.env, TEST_DATA: s.dir, TEST_ROOT: process.cwd(), TEST_EXPERIMENT: s.baseline.id, TEST_PROJECT: s.project.id}, stdio: ['ignore', 'ignore', 'pipe', 'ipc']});
      children.push(child);
      ready.push(new Promise((res, rej) => {child.once('error', rej); child.once('message', res);}));
      done.push(new Promise((res, rej) => {const timer = setTimeout(() => rej(Error('child timed out')), 15000); child.on('message', x => {if (typeof x === 'object') {clearTimeout(timer); res(x);}}); child.once('error', e => {clearTimeout(timer); rej(e);});}));
    }
    await Promise.all(ready);
    children.forEach(child => child.send('start'));
    const [a, b] = await Promise.all(done);
    assert.ok(a.id, JSON.stringify(a)); assert.equal(a.id, b.id, JSON.stringify(b));
    assert.equal(s.app.store.list('run-intent').length, 1);
    assert.equal(s.app.store.list('approval').length, 1);
  } finally {children.forEach(child => child.kill()); s.close();}
});
