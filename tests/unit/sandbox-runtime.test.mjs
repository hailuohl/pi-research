import test from 'node:test';
import assert from 'node:assert/strict';
import {assertContainerStartPolicy,createArgs, BOOTSTRAP, dockerEnv, preflight, stageInputs, retireUncertainStart, docker, inspect} from '../../dist/packages/execution/docker.js';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, statSync, chmodSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {digest} from '../../dist/packages/storage/store.js';
import childProcess from 'node:child_process';
import {registerHooks, syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';

const job = {id: 'job-1', containerName: 'pi-sandbox-job-1', manifestDigest: 'abc', controlDir: 'D:/control', outputDir: 'D:/output', manifest: {
 inputSnapshot: {path: 'D:/immutable source', files: []}, dataArtifacts: [{id: 'data-1', path: 'D:/data.csv'}], command: ['python', '-c', 'print("$(host)")'],
 environmentImageDigest: 'python@sha256:' + 'a'.repeat(64), resources: {pids: 32, cpus: 1, memoryMb: 256, workMb: 64, logBytes: 1048576}
}};
test('Docker argv confines mounts, privileges and shell bootstrap to container', () => {
 const args = createArgs(job);
 assert.ok(args.includes('NVIDIA_VISIBLE_DEVICES=void'));assert.ok(args.includes('CUDA_VISIBLE_DEVICES=-1'));assert.ok(!args.includes('--gpus'));
 for (const flag of ['--read-only', '--cap-drop', '--security-opt', '--pids-limit', '--cpus', '--memory', '--user']) assert.ok(args.includes(flag));
 assert.equal(args[args.indexOf('--network') + 1], 'none');
 assert.equal(args[args.indexOf('--user') + 1], '65532:65532');
 assert.equal(args[args.indexOf('--pull') + 1], 'never');
 assert.equal(args[args.indexOf('--log-driver') + 1], 'local');
 assert.ok(args.includes('max-file=1'));
 assert.ok(args.includes('compress=false'));
 assert.ok(args.includes('/work:rw,nosuid,nodev,exec,uid=65532,gid=65532,mode=1777,size=64m'));
 assert.ok(args.includes(`type=bind,src=${join(job.controlDir, 'source')},dst=/source,readonly`));
 assert.ok(args.includes(`type=bind,src=${join(job.controlDir, 'data', 'data-1')},dst=/data/data-1,readonly`));
 assert.deepEqual(args.slice(-4), ['/pi-bootstrap.sh', ...job.manifest.command]);
 assert.ok(args.includes(`type=bind,src=${join(job.controlDir, 'bootstrap.sh')},dst=/pi-bootstrap.sh,readonly`));
 assert.ok(!args.some(arg => arg === `type=bind,src=${job.controlDir},dst=/control,readonly`));
 assert.ok(!args.includes('--rm'));
 assert.throws(() => createArgs({...job, outputDir: 'x,dst=/host'}), /Unsupported/);
});

test('frozen thread limits override image defaults without changing legacy Docker argv',()=>{
 const keys=['OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','BLIS_NUM_THREADS'];
 const legacy=createArgs(job);assert.ok(!legacy.some(arg=>keys.some(key=>arg.startsWith(key+'='))));
 const args=createArgs({...job,manifest:{...job.manifest,threadLimit:2}});
 for(const key of keys){assert.equal(args.filter(arg=>arg.startsWith(key+'=')).length,1);assert.ok(args.includes(key+'=2'));}
 for(const threadLimit of [0,65,1.5,'2',null])assert.throws(()=>createArgs({...job,manifest:{...job.manifest,threadLimit}}),/thread/i);
});

test('created CPU containers must override inherited image GPU visibility before starting',()=>{
 const container={Config:{Labels:{},Env:['NVIDIA_VISIBLE_DEVICES=all']},HostConfig:{DeviceRequests:[]},State:{Status:'created'}};
 assert.throws(()=>assertContainerStartPolicy(job,container),/GPU_POLICY_MISMATCH/);container.Config.Env=['NVIDIA_VISIBLE_DEVICES=void','CUDA_VISIBLE_DEVICES=-1'];assert.doesNotThrow(()=>assertContainerStartPolicy(job,container));container.HostConfig.DeviceRequests=[{DeviceIDs:['GPU-11111111-1111-1111-1111-111111111111']}];assert.throws(()=>assertContainerStartPolicy(job,container),/GPU_POLICY_MISMATCH/);
 const gpuJob={...job,manifest:{...job.manifest,resources:{...job.manifest.resources,gpu:{vendor:'nvidia',deviceIds:['GPU-11111111-1111-1111-1111-111111111111']}}}},args=createArgs(gpuJob);assert.ok(args.includes('NVIDIA_VISIBLE_DEVICES=GPU-11111111-1111-1111-1111-111111111111'));assert.ok(args.includes('CUDA_VISIBLE_DEVICES=GPU-11111111-1111-1111-1111-111111111111'));assert.equal(args[args.indexOf('--gpus')+1],'device=GPU-11111111-1111-1111-1111-111111111111');
});

test('new-start inspection rejects a legacy created container but observes an already running container unchanged',async()=>{
 const original=childProcess.spawn,calls=[],container={Id:'owned',Config:{Labels:{'pi-research.sandbox-job':job.id,'pi-research.manifest':job.manifestDigest},Env:['NVIDIA_VISIBLE_DEVICES=all']},HostConfig:{DeviceRequests:[]},State:{Status:'created',Running:false}};
 childProcess.spawn=(program,args)=>{assert.equal(program,'docker');assert.equal(args[2],'inspect');calls.push(args);const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>assert.fail('inspection must not kill a workload');queueMicrotask(()=>{child.stdout.end(JSON.stringify([container]));child.stderr.end();child.emit('close',0);});return child;};syncBuiltinESMExports();
 try{const live={...job,startRequested:false,manifest:{...job.manifest,dockerContext:'fixture'}};await assert.rejects(inspect(live),/GPU_POLICY_MISMATCH/);container.State={Status:'running',Running:true};assert.deepEqual(await inspect({...live,startRequested:true}),container);assert.equal(calls.length,2);}finally{childProcess.spawn=original;syncBuiltinESMExports();}
});
test('optional real Docker preserves ordinary and executable source modes', {skip: process.env.PI_TEST_DOCKER_MODES !== '1'}, async () => {
 const validation = join(process.cwd(), '.validation'); mkdirSync(validation, {recursive: true});
 const root = mkdtempSync(join(validation, 'source-modes-')), source = join(root, 'source'), controlDir = join(root, 'control'), outputDir = join(root, 'output');
 for (const path of [source, controlDir, outputDir]) mkdirSync(path); chmodSync(outputDir, 0o777);
 const files = [{path: 'ordinary.sh', mode: '100644'}, {path: "exec'$(echo harmless).sh", mode: '100755'}].map(f => {const bytes = Buffer.from('#!/bin/sh\necho executed\n'); writeFileSync(join(source, f.path), bytes); return {...f, digest: digest(bytes), size: bytes.length};});
 const id = 'mode-' + Date.now(), live = {...job, id, containerName: 'pi-development-' + id, controlDir, outputDir, manifest: {...job.manifest, inputSnapshot: {path: source, files}, dataArtifacts: [], dockerContext: 'desktop-linux', environmentImageDigest: 'python@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f', command: ['python', '-c', 'import os,stat,subprocess; from pathlib import Path; modes=sorted(stat.S_IMODE(p.stat().st_mode) for p in Path("/work").glob("*.sh")); assert modes == [0o644,0o755],modes; p=next(p for p in Path("/work").glob("*.sh") if os.access(p,os.X_OK)); assert subprocess.check_output([str(p)]).strip()==b"executed"; print("modes-ok")']}};
 try {await preflight(live.manifest.dockerContext, live.manifest.environmentImageDigest); stageInputs(live); live.containerId = await docker(live.manifest.dockerContext, createArgs(live)); assert.equal(await docker(live.manifest.dockerContext, ['start', '--attach', live.containerId]), 'modes-ok');}
 finally {if (live.containerId) {const owned = await inspect(live); if (owned?.State.Running) await docker(live.manifest.dockerContext, ['kill', owned.Id]); if (owned) await docker(live.manifest.dockerContext, ['rm', owned.Id]);} rmSync(root, {recursive: true, force: true});}
});
test('private staging verifies bytes, preserves shared inputs, and refuses post-create mutations', () => {
 const root = mkdtempSync(join(tmpdir(), 'sandbox-stage-')), source = join(root, 'original'), controlDir = join(root, 'control');
 mkdirSync(source); mkdirSync(controlDir); writeFileSync(join(source, 'main.py'), 'print(1)', {mode: 0o600});
 const weirdPath = "odd'$(touch bad).sh"; writeFileSync(join(source, weirdPath), '#!/bin/sh\n');
 const staged = {...job, controlDir, manifest: {...job.manifest, dataArtifacts: [], inputSnapshot: {path: source, files: [{path: 'main.py', size: 8, digest: digest('print(1)')}, {path: weirdPath, size: 10, digest: digest('#!/bin/sh\n'), mode: '100755'}]}}};
 try {
  stageInputs(staged);
  const script = readFileSync(join(controlDir, 'bootstrap.sh'), 'utf8');
  assert.ok(script.includes("chmod 755 -- '/work/odd'\\''$(touch bad).sh'"));
  assert.ok(script.includes('find /work -type f -exec chmod 644 {} +'));
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

test('development worker rejects late or unprovable completion but accepts timely late observations', async t => {
 const root = mkdtempSync(join(tmpdir(), 'sandbox-time-')), originalArgv = process.argv;
 const hook = registerHooks({load(url, context, nextLoad) {
  if (url.endsWith('/dist/packages/research-app.js')) return {format: 'module', shortCircuit: true, source: 'export class ResearchApp { constructor() {return globalThis.__sandboxTimeApp;} }'};
  return nextLoad(url, context);
 }});
 try {
  for (const [name, offset, expected, deadlineOffset, expectedIncomplete, oversized, cancel] of [
   ['late exit', 1050, 'timed_out'], ['timely exit observed late', 950, 'succeeded'],
   ['deadline precedes runtime limit', 850, 'timed_out', 800],
   ['missing exit time', undefined, 'failed', undefined, true], ['invalid exit time', 'invalid', 'failed', undefined, true],
   ['zero exit time', '0001-01-01T00:00:00Z', 'failed', undefined, true], ['exit before start', -1, 'failed', undefined, true],
   ['timeout retains priority over excessive output', 1050, 'timed_out', undefined, true, true],
   ['observed cancellation retains priority over excessive output', 1050, 'cancelled', undefined, true, true, true],
  ]) await t.test(name, async t => {
   const base = Date.now(), controlDir = join(root, name, 'control'), outputDir = join(root, name, 'output');
   mkdirSync(controlDir, {recursive: true}); mkdirSync(outputDir, {recursive: true});
   let row = {id: 'job', version: 1, generation: 1, leaseUntil: base + 60000, recoveryCount: 0, state: 'preparing', startRequested: false,
    controlDir, outputDir, containerName: 'fixture', manifestDigest: 'fixture', manifest: {environmentImageDigest: job.manifest.environmentImageDigest, dockerContext: 'fixture',
     deadline: new Date(base + (deadlineOffset ?? 10000)).toISOString(), inputSnapshot: {files: []}, dataArtifacts: [], resources: {timeoutSeconds: 1, logBytes: 10000, outputBytes: 10000}}};
   if (oversized) writeFileSync(join(outputDir, 'oversized'), 'x'.repeat(10001));
   let result, observedNow = base, started = false, runningObservation = false;
   const container = () => {const status = !started ? 'created' : cancel && !runningObservation ? (runningObservation = true, 'running') : 'exited'; return {Id: 'fixture', Image: 'fixture', Config: {Labels: {'pi-research.sandbox-job': 'job', 'pi-research.manifest': 'fixture'}, Env: ['NVIDIA_VISIBLE_DEVICES=void', 'CUDA_VISIBLE_DEVICES=-1']},
    State: {Status: status, Running: status === 'running', ExitCode: 0, StartedAt: row.startedAt,
     ...(offset === undefined || !started ? {} : {FinishedAt: typeof offset === 'number' ? new Date(Date.parse(row.startedAt) + offset).toISOString() : offset})}};};
   const store = {paths: {physical: p => p, physicalSnapshot: s => s}, get: () => row, transaction: fn => fn(), update: (_kind, _id, _version, value) => (row = {...row, ...value, version: row.version + 1}), close: () => {}};
   globalThis.__sandboxTimeApp = {store, compute: {verifyTarget: async () => {}, stop: async () => {}}, development: {assertCurrent: () => {}, finalize: (_id, value) => {result = value; row.state = value.state;}}};
   t.mock.method(Date, 'now', () => observedNow);
   t.mock.method(childProcess, 'spawn', (program, args) => {
    assert.equal(program, 'docker');
    const child = new EventEmitter(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => {};
    queueMicrotask(() => {
     const command = args[2]; let output = '';
     if (command === 'context') output = JSON.stringify([{Endpoints: {docker: {Host: 'unix:///fixture'}}}]);
     else if (command === 'info') output = 'linux';
     else if (command === 'image') output = 'fixture';
     else if (command === 'inspect') output = JSON.stringify([container()]);
     else if (command === 'start') {started = true; if (cancel) row.cancelRequested = true; observedNow = Date.parse(row.startedAt) + 1150; output = 'complete log';}
     else if (command === 'kill') {} else assert.fail('Unexpected Docker operation: ' + command);
     child.stdout.end(output); child.stderr.end(); child.emit('close', 0);
    });
    return child;
   }); syncBuiltinESMExports();
   process.argv = [process.execPath, 'worker', root, root, 'job', '1'];
   try {
    await import(new URL('../../dist/apps/execution-worker/index.js?timing=' + encodeURIComponent(name), import.meta.url));
    assert.equal(result?.state, expected); assert.equal(result.exitCode, 0);
    if (expectedIncomplete) {assert.equal(result.incomplete, true); if (expected === 'failed') assert.match(result.error, /completion time/i);}
    assert.equal(readFileSync(join(controlDir, 'stdout.log'), 'utf8'), 'complete log');
   } finally {t.mock.restoreAll(); syncBuiltinESMExports();}
  });
 } finally {hook.deregister(); process.argv = originalArgv; delete globalThis.__sandboxTimeApp; rmSync(root, {recursive: true, force: true});}
});

test('Docker timing validates fallback starts, exact boundaries and immutable deadline cutoffs', async()=>{
 const {executionTimeStatus:status}=await import('../../dist/packages/execution/completion-time.js');
 const start='2026-10-16T00:00:00.000Z',at=offset=>new Date(Date.parse(start)+offset).toISOString();
 assert.equal(status(undefined,{StartedAt:start,FinishedAt:at(950)},1),'within');
 assert.equal(status(start,{StartedAt:at(500),FinishedAt:at(1050)},1),'exceeded');
 assert.equal(status(start,{FinishedAt:at(1000)},1),'exceeded');
 assert.equal(status(start,{FinishedAt:'2026-10-16T00:00:00.999999999Z'},1),'within');
 assert.equal(status(start,{FinishedAt:at(900)},1,at(800)),'exceeded');
 assert.equal(status(start,{FinishedAt:at(900)},1,new Date(Date.parse(start)+5000).toUTCString()),'within');
 assert.equal(status(start,{},1,undefined,Date.parse(at(1000))),'exceeded');
 for(const startedAt of ['', 'invalid', '0001-01-01T00:00:00Z'])assert.equal(status(startedAt,{StartedAt:start,FinishedAt:at(900)},1),'invalid');
 for(const FinishedAt of [undefined,'','invalid','0','0001-01-01T00:00:00Z',at(-1)])assert.equal(status(start,{FinishedAt},1),'invalid');
 assert.equal(status(undefined,{FinishedAt:at(900)},1),'invalid');
 assert.equal(status(start,{FinishedAt:at(900)},1,'invalid'),'invalid');
 for(const timeout of [NaN,Infinity,0,-1])assert.equal(status(start,{FinishedAt:at(900)},timeout),'invalid');
});
