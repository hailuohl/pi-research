import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {formalDockerJob, DockerAdapter} from '../../dist/packages/runners/docker.js';
import {superviseDockerRun} from '../../dist/packages/runners/docker-supervisor.js';
import {createArgs, docker, inspect} from '../../dist/packages/execution/docker.js';
import {digest} from '../../dist/packages/storage/store.js';
const IMAGE = 'python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f';
function fixture(root, body, overrides = {}) {
 const id = randomUUID(), source = join(root, id, 'source'), outputDir = join(root, id, 'output'), controlDir = join(root, id, 'control');
 for (const path of [source, outputDir, controlDir]) mkdirSync(path, {recursive: true});
 writeFileSync(join(source, 'main.py'), body);
 return {id, version: 1, state: 'submitting', manifestDigest: digest(body), outputDir, cancelRequested: false,
  manifest: {snapshotPath: source, snapshotDigest: digest(body), sourceFiles: [{path: 'main.py', digest: digest(body), size: Buffer.byteLength(body), mode: '100644'}], contract: {runner: 'docker', image: IMAGE, command: ['python', 'main.py'], cpus: 1, memoryMb: 256, timeoutSeconds: 10, expectedArtifacts: ['metrics.json'], ...overrides}},
  execution: {backend: 'docker', dockerContext: 'desktop-linux', containerName: 'pi-formal-test-' + id, controlDir, startRequested: false, generation: 1, leaseUntil: Date.now() + 60000, recoveryCount: 0}};
}
function controls(initial) {
 let row = initial, result, checks = 0;
 return {callbacks: {read: () => row, patch: value => (row = {...row, ...value, version: row.version + 1}), assertGrant: () => {checks++;}, fence: () => {assert.equal(row.execution.generation, initial.execution.generation); assert.ok(row.execution.leaseUntil > Date.now());}, finalize: value => {result = value; row = {...row, state: value.state};}}, get row() {return row;}, get result() {return result;}, get checks() {return checks;}};
}
test('formal Docker mapping shares sandbox protection and keeps formal identity/log control separate', () => {
 const run = {id: 'formal-id', manifestDigest: 'digest', outputDir: 'D:/out', manifest: {snapshotPath: 'D:/source', snapshotDigest: 'src', sourceFiles: [], contract: {runner: 'docker', image: IMAGE, command: ['python', 'main.py'], cpus: 2, memoryMb: 512}}, execution: {containerName: 'pi-run-formal-id', controlDir: 'D:/control', dockerContext: 'desktop-linux', startRequested: false}};
 const job = formalDockerJob(run), args = createArgs(job);
 assert.equal(job.id, run.id); assert.equal(job.manifest.resources.logBytes, 16 * 1024 * 1024); assert.equal(job.manifest.resources.pids, 512);
 assert.equal(args[args.indexOf('--network') + 1], 'none'); assert.equal(args[args.indexOf('--pull') + 1], 'never');
 assert.ok(args.includes(`type=bind,src=${join(run.execution.controlDir, 'bootstrap.sh')},dst=/pi-bootstrap.sh,readonly`));
 assert.ok(!args.some(value => value.includes('dst=/control')));
 assert.throws(() => formalDockerJob({...run, manifest: {...run.manifest, contract: {...run.manifest.contract, runner: 'trusted-example'}}}), /Docker contract/);
});
test('optional formal Docker supervisor: success, integrity limits, cancellation, timeout and created recovery', {skip: process.env.PI_TEST_FORMAL_DOCKER !== '1'}, async () => {
 const validation = join(process.cwd(), '.validation'); mkdirSync(validation, {recursive: true}); const root = mkdtempSync(join(validation, 'formal-adapter-'));
 const runs = [];
 try {
  const good = fixture(root, 'from pathlib import Path\nPath("/output/metrics.json").write_text("{\\"score\\":1}")\nprint("formal-log")\n'); runs.push(good);
  const success = controls(good); await superviseDockerRun(good, success.callbacks);
  assert.equal(success.result.state, 'succeeded'); assert.equal(success.result.incomplete, false); assert.ok(success.row.execution.containerId); assert.ok(success.row.execution.imageId); assert.ok(success.checks >= 2);
  assert.equal(readFileSync(join(good.execution.controlDir, 'stdout.log'), 'utf8').trim(), 'formal-log'); assert.equal(existsSync(join(good.outputDir, 'stdout.log')), false);
  const missing = fixture(root, 'print("missing expected result")\n'); runs.push(missing); const noOutput = controls(missing); await superviseDockerRun(missing, noOutput.callbacks);
  assert.equal(noOutput.result.exitCode, 0); assert.equal(noOutput.result.state, 'failed'); assert.equal(noOutput.result.incomplete, true);
  const noisy = fixture(root, 'from pathlib import Path\nPath("/output/metrics.json").write_text("{\\"score\\":1}")\nprint("x" * 100000)\n', {logBytes: 1024}); runs.push(noisy); const limited = controls(noisy); await superviseDockerRun(noisy, limited.callbacks);
  assert.equal(limited.result.state, 'failed'); assert.equal(limited.result.logTruncated, true); assert.equal(limited.result.incomplete, true); assert.ok(readFileSync(join(noisy.execution.controlDir, 'stdout.log')).length <= 1024);
  const slow = fixture(root, 'import time\ntime.sleep(15)\n', {timeoutSeconds: 1}); runs.push(slow); const timeout = controls(slow); await superviseDockerRun(slow, timeout.callbacks);
  assert.equal(timeout.result.state, 'failed'); assert.match(timeout.result.error, /timeout/);
  const cancelled = fixture(root, 'import time\ntime.sleep(15)\n', {timeoutSeconds: 20}); runs.push(cancelled); const cancel = controls(cancelled);
  const timer = setInterval(() => {if (cancel.row.state === 'running') cancel.callbacks.patch({cancelRequested: true});}, 50);
  try {await superviseDockerRun(cancelled, cancel.callbacks);} finally {clearInterval(timer);}
  assert.equal(cancel.result.state, 'cancelled');
  const recovered = fixture(root, 'from pathlib import Path\nPath("/output/started").write_text("must not run")\n'); runs.push(recovered);
  const adapter = new DockerAdapter(recovered, () => {}); await adapter.preflight(); await adapter.stage(); const created = await adapter.submit();
  recovered.execution = {...recovered.execution, containerId: created.Id, imageId: adapter.imageId, startRequested: true, recoveryCount: 1};
  const recovery = controls(recovered); await superviseDockerRun(recovered, recovery.callbacks);
  assert.equal(recovery.result.state, 'failed'); assert.equal(recovery.result.incomplete, true); assert.equal(existsSync(join(recovered.outputDir, 'started')), false);
 } finally {
  for (const run of runs) {
   const job = formalDockerJob(run), container = await inspect(job);
   if (container?.State.Running) await docker(job.manifest.dockerContext, ['kill', container.Id]);
   if (container) await docker(job.manifest.dockerContext, ['rm', container.Id]);
  }
  rmSync(root, {recursive: true, force: true});
 }
});

test('formal Docker completion uses actual exit time rather than delayed polling', async t => {
 mkdirSync(join(process.cwd(), '.validation'), {recursive: true});
 const root = mkdtempSync(join(process.cwd(), '.validation', 'formal-time-'));
 try {
  for (const [name, finishedOffset, expected, error] of [
   ['late exit', 1050, 'failed', /timeout/],
   ['timely exit observed late', 950, 'succeeded'],
   ['missing exit time', undefined, 'failed', /completion time/i],
   ['invalid exit time', 'invalid', 'failed', /completion time/i],
   ['exit before start', -1, 'failed', /completion time/i],
  ]) await t.test(name, async t => {
   const run = fixture(root, 'fixture', {timeoutSeconds: 1}), control = controls(run);
   writeFileSync(join(run.outputDir, 'metrics.json'), '{}');
   let started = false, observedNow = Date.now();
   const container = {Id: 'fixture', State: {Status: 'created', Running: false, ExitCode: 0, StartedAt: '', FinishedAt: ''}};
   t.mock.method(Date, 'now', () => observedNow);
   t.mock.method(DockerAdapter.prototype, 'preflight', async function () {this.imageId = 'fixture';});
   t.mock.method(DockerAdapter.prototype, 'inspect', async () => container);
   t.mock.method(DockerAdapter.prototype, 'submit', async () => container);
   t.mock.method(DockerAdapter.prototype, 'start', async () => {
    assert.equal(started, false); started = true;
    const start = Date.parse(control.row.startedAt); observedNow = start + 1150;
    container.State = {Status: 'exited', Running: false, ExitCode: 0, StartedAt: control.row.startedAt,
     ...(finishedOffset === undefined ? {} : {FinishedAt: typeof finishedOffset === 'number' ? new Date(start + finishedOffset).toISOString() : finishedOffset})};
    return {completion: Promise.resolve({exitCode: 0}), detach: async () => {}};
   });
   await superviseDockerRun(run, control.callbacks);
   assert.equal(control.result.state, expected);
   assert.equal(control.result.exitCode, 0);
   if (error) assert.match(control.result.error, error);
   t.mock.restoreAll();
  });
 } finally {rmSync(root, {recursive: true, force: true});}
});

test('formal Docker argv uses only a frozen thread field, including the formal 64 CPU bound',()=>{
 const run=fixture(join(process.cwd(),'.validation'),'fixture',{cpus:64,threadLimit:64});
 try {
  const mapped=formalDockerJob(run),args=createArgs(mapped);assert.equal(mapped.manifest.threadLimit,64);
  for(const key of ['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','BLIS_NUM_THREADS'])assert.ok(args.includes(key+'=64'));
  delete run.manifest.contract.threadLimit;const legacy=formalDockerJob(run);assert.equal(Object.hasOwn(legacy.manifest,'threadLimit'),false);assert.ok(!createArgs(legacy).some(arg=>arg.startsWith('OMP_NUM_THREADS=')));
 }finally{rmSync(join(process.cwd(),'.validation',run.id),{recursive:true,force:true});}
});

test('formal Docker manifest threads are applied and conflicts reject before container creation',()=>{
 const run=fixture(join(process.cwd(),'.validation'),'fixture',{cpus:2});
 try {
  run.manifest.threadLimit=2;const mapped=formalDockerJob(run);assert.equal(mapped.manifest.threadLimit,2);assert.ok(createArgs(mapped).includes('OMP_NUM_THREADS=2'));
  for(const threadLimit of [0,65,1.5,'2',null]){run.manifest.threadLimit=threadLimit;assert.throws(()=>formalDockerJob(run),/thread/i);}
  run.manifest.threadLimit=2;run.manifest.contract.threadLimit=1;assert.throws(()=>new DockerAdapter(run,()=>{}),/thread/i);
  run.manifest.contract.threadLimit=2;assert.equal(formalDockerJob(run).manifest.threadLimit,2);
  delete run.manifest.threadLimit;assert.equal(formalDockerJob(run).manifest.threadLimit,2);
  delete run.manifest.contract.threadLimit;assert.equal(Object.hasOwn(formalDockerJob(run).manifest,'threadLimit'),false);
 }finally{rmSync(join(process.cwd(),'.validation',run.id),{recursive:true,force:true});}
});
