import test from 'node:test';
import assert from 'node:assert/strict';
import {createArgs, BOOTSTRAP, dockerEnv, preflight, stageInputs, retireUncertainStart} from '../../dist/packages/execution/docker.js';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, chmodSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {digest} from '../../dist/packages/storage/store.js';

const job = {id: 'job-1', containerName: 'pi-sandbox-job-1', manifestDigest: 'abc', controlDir: 'D:/control', outputDir: 'D:/output', manifest: {
 inputSnapshot: {path: 'D:/immutable source'}, dataArtifacts: [{id: 'data-1', path: 'D:/data.csv'}], command: ['python', '-c', 'print("$(host)")'],
 environmentImageDigest: 'python@sha256:' + 'a'.repeat(64), resources: {pids: 32, cpus: 1, memoryMb: 256, workMb: 64, logBytes: 1048576}
}};
test('Docker argv confines mounts, privileges and shell bootstrap to container', () => {
 const args = createArgs(job);
 for (const flag of ['--read-only', '--cap-drop', '--security-opt', '--pids-limit', '--cpus', '--memory', '--user']) assert.ok(args.includes(flag));
 assert.equal(args[args.indexOf('--network') + 1], 'none');
 assert.equal(args[args.indexOf('--user') + 1], '65532:65532');
 assert.equal(args[args.indexOf('--pull') + 1], 'never');
 assert.equal(args[args.indexOf('--log-driver') + 1], 'local');
 assert.ok(args.includes('max-file=1'));
 assert.ok(args.includes('compress=false'));
 assert.ok(args.includes('/work:rw,nosuid,nodev,uid=65532,gid=65532,mode=1777,size=64m'));
 assert.ok(args.includes(`type=bind,src=${join(job.controlDir, 'source')},dst=/source,readonly`));
 assert.ok(args.includes(`type=bind,src=${join(job.controlDir, 'data', 'data-1')},dst=/data/data-1,readonly`));
 assert.deepEqual(args.slice(-6), ['-c', BOOTSTRAP, '--', ...job.manifest.command]);
 assert.ok(!args.includes('--rm'));
 assert.throws(() => createArgs({...job, outputDir: 'x,dst=/host'}), /Unsupported/);
});
test('private staging verifies bytes, preserves shared inputs, and refuses post-create mutations', () => {
 const root = mkdtempSync(join(tmpdir(), 'sandbox-stage-')), source = join(root, 'original'), controlDir = join(root, 'control');
 mkdirSync(source); mkdirSync(controlDir); writeFileSync(join(source, 'main.py'), 'print(1)', {mode: 0o600});
 const staged = {...job, controlDir, manifest: {...job.manifest, dataArtifacts: [], inputSnapshot: {path: source, files: [{path: 'main.py', size: 8, digest: digest('print(1)')}]}}};
 try {
  stageInputs(staged);
  assert.equal(readFileSync(join(controlDir, 'source', 'main.py'), 'utf8'), 'print(1)');
  if (process.platform !== 'win32') {assert.equal(statSync(join(controlDir, 'source', 'main.py')).mode & 0o777, 0o444); assert.equal(statSync(join(source, 'main.py')).mode & 0o777, 0o600);}
  assert.throws(() => stageInputs({...staged, containerId: 'created'}), /Cannot modify/);
  chmodSync(join(controlDir, 'source', 'main.py'), 0o600); writeFileSync(join(controlDir, 'source', 'main.py'), 'print(2)');
  assert.throws(() => stageInputs(staged), /digest mismatch/);
 } finally {rmSync(root, {recursive: true, force: true});}
});
test('Docker preflight rejects floating images and environment excludes secrets and endpoint overrides', async () => {
 await assert.rejects(preflight('default', 'python:latest'), /pinned/);
 await assert.rejects(preflight('--host=evil', job.manifest.environmentImageDigest), /context/);
 process.env.PI_TEST_SECRET = 'hidden'; process.env.DOCKER_HOST = 'tcp://evil:2375';
 try {assert.equal(dockerEnv().PI_TEST_SECRET, undefined); assert.equal(dockerEnv().DOCKER_HOST, undefined);} finally {delete process.env.PI_TEST_SECRET; delete process.env.DOCKER_HOST;}
});
test('ambiguous start recovery removes created container without restarting and resolves start race', async () => {
 const created = {Id: 'owned-id', State: {Status: 'created', Running: false}}, running = {...created, State: {Status: 'running', Running: true}}, exited = {...created, State: {Status: 'exited', Running: false}};
 const calls = []; let reads = [created, null];
 assert.equal(await retireUncertainStart(job, () => {}, async (_context, args) => {calls.push(args); return '';}, async () => reads.shift()), null);
 assert.deepEqual(calls, [['rm', 'owned-id']]);
 calls.length = 0; reads = [created, running, exited];
 assert.equal(await retireUncertainStart(job, () => {}, async (_context, args) => {calls.push(args); if (args[0] === 'rm') throw new Error('now running'); return '';}, async () => reads.shift()), exited);
 assert.deepEqual(calls, [['rm', 'owned-id'], ['kill', 'owned-id']]);
 await assert.rejects(retireUncertainStart(job, () => {}, async () => '', async () => {throw new Error('daemon unavailable');}), /daemon unavailable/);
 await assert.rejects(retireUncertainStart(job, () => {throw new Error('lease lost');}, async () => {throw new Error('must not execute');}, async () => created), /lease lost/);
});
