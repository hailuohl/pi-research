import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {approve} from '../support/research.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {ComputeQueue} from '../../dist/packages/scheduler/compute-queue.js';
import {digest} from '../../dist/packages/storage/store.js';

test('scheduler owner operations share versioned limits, bounded queue DTOs and durable replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-scheduler-http-')),server=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});
 try{
  const app=server.app,p=app.projects.create(USER,{name:'Scheduling transport',template:'curve-fit'}),s=app.sessions.create(USER,p.id,{}),e=app.experiments.create(USER,p.id,{title:'Queue fixture'});
  const initial=app.compute.inspect(USER,p.id);app.compute.configure(USER,{expectedVersion:initial.configuration.version,limits:{maxJobs:0}});
  const port=await server.listen(),headers={'Content-Type':'application/json'};
  const call=async(name,input={},key=randomUUID())=>{const r=await fetch(`http://127.0.0.1:${port}/api/operations/${name}`,{method:'POST',headers:{...headers,'Idempotency-Key':key},body:JSON.stringify({projectId:p.id,input})});return {status:r.status,value:await r.json()};};
  const runs=[];for(let i=0;i<3;i++){const intent=app.runs.prepare(USER,e.id);approve(app,intent.approvalId);runs.push(app.runs.submit(USER,intent.id));}
  const before=runs.map(r=>r.manifestDigest),first=await call('compute_queue_inspect',{limit:2});assert.equal(first.status,200,JSON.stringify(first.value));assert.equal(first.value.items.length,2);assert.ok(first.value.nextCursor);assert.equal(first.value.usage.jobs,0);assert.equal(first.value.available.jobs,0);
  const second=await call('compute_queue_inspect',{limit:2,cursor:first.value.nextCursor});assert.equal(second.status,200);assert.equal(second.value.items.length,1);assert.equal(new Set([...first.value.items,...second.value.items].map(r=>r.id)).size,3);
  const key=randomUUID(),input={expectedVersion:first.value.configuration.version,limits:{maxQueued:1,cpus:1.001,memoryMb:512}},changed=await call('compute_capacity_configure',input,key);assert.equal(changed.status,200,JSON.stringify(changed.value));assert.equal(changed.value.limits.cpus,1.001);assert.deepEqual(await call('compute_capacity_configure',input,key),changed);
  const conflict=await call('compute_capacity_configure',{expectedVersion:input.expectedVersion,limits:{maxJobs:1}});assert.equal(conflict.value.error.code,'VERSION_CONFLICT');
  assert.deepEqual(runs.map(r=>app.store.get('run',r.id).manifestDigest),before,'capacity changes never rewrite approvals or manifests');
  const more=app.runs.prepare(USER,e.id);approve(app,more.approvalId);assert.throws(()=>app.runs.submit(USER,more.id),{code:'COMPUTE_QUEUE_FULL'});assert.equal(app.store.list('run',p.id).length,3,'existing backlog survives a lower cap');
  const capacity=await call('agent_capacity_inspect');assert.equal(capacity.status,200,JSON.stringify(capacity.value));assert.equal(capacity.value.unit,'pi-worker');assert.equal(capacity.value.httpConcurrencyMeasured,false);
  const configured=await call('agent_capacity_configure',{expectedVersion:capacity.value.version,maxWorkers:1});assert.equal(configured.status,200,JSON.stringify(configured.value));assert.equal(configured.value.maxWorkers,1);
  const cli=spawnSync(process.execPath,['dist/apps/cli/index.js','operation','compute_queue_inspect','--project',p.id,'--input','{"limit":2}','--data',dir],{encoding:'utf8',timeout:15000});assert.equal(cli.status,0,cli.stderr);assert.equal(JSON.parse(cli.stdout).items.length,2);
  const actor={type:'agent',projectId:p.id,sessionId:s.id,role:'coordinator',generation:0};await assert.rejects(()=>new ToolDispatcher(app).execute(actor,'compute_capacity_configure',{expectedVersion:changed.value.version,limits:{maxJobs:99}},'forbidden'),{code:'TOOL_DENIED'});
  const invalid=await call('compute_capacity_configure',{expectedVersion:changed.value.version,limits:{maxJobs:257}});assert.equal(invalid.value.error.code,'INVALID_INPUT');
  const state=await fetch(`http://127.0.0.1:${port}/api/projects/${p.id}/state`,{headers});const view=await state.json();assert.equal(view.compute.configuration.version,changed.value.version);assert.equal(view.agentCapacity.maxWorkers,1);
  // Deterministic identity response fixture: this transport check never contacts a Docker engine.
  let probes=0;app.compute=new ComputeQueue(app.context,{probe:async()=>{probes++;return {engineId:'unit-engine',targetId:'docker-'+digest('unit-engine'),endpoint:'unix:///unit-fixture.sock'};}});
  const probeKey=randomUUID(),probe=await call('compute_target_probe',{context:'unit-context'},probeKey);assert.equal(probe.status,200,JSON.stringify(probe.value));assert.equal(probe.value.backend,'docker');assert.equal('endpoint' in probe.value,false);
  assert.deepEqual(await call('compute_target_probe',{context:'unit-context'},probeKey),probe);assert.equal(probes,1);
 }finally{await server.close();assert.ok(resolve(dir).startsWith(resolve(tmpdir())+sep));rmSync(dir,{recursive:true,force:true});}
});
