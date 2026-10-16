import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {setup,USER,approve} from '../support/research.mjs';
import {configureEnvironment} from '../../dist/packages/runtime/environment.js';

test('environment HTTP accepts cross-origin writes and remains versioned and write-only across restart and deletion',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-environment-http-')),token='fixture-private-http-token';let service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),port=await service.listen();
 const call=async(body,extra={})=>{const response=await fetch(`http://127.0.0.1:${port}/api/settings/environment${extra.query??''}`,{method:extra.method??(body===undefined?'GET':'POST'),headers:{'content-type':'application/json','idempotency-key':extra.key??randomUUID(),...extra.headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const value=await response.json();assert.ok(!JSON.stringify(value).includes(token));return {status:response.status,value};};
 try{assert.deepEqual((await call()).value,{version:0,variables:[],scope:'local'});const input={action:'set',expectedVersion:0,name:'FIXTURE_TOKEN',value:token},saved=await call(input,{key:'saved',headers:{origin:'https://foreign.invalid'}});assert.equal(saved.status,200);assert.deepEqual(await call(input,{key:'saved'}),saved);
  assert.equal((await call(input,{method:'PUT'})).status,405);assert.equal((await call(undefined,{query:'?name=FIXTURE_TOKEN'})).status,400);
  assert.equal((await call(input)).value.error.code,'VERSION_CONFLICT');assert.equal((await call({...input,expectedVersion:1,name:'NODE_OPTIONS'})).status,400);
  await service.close();service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});port=await service.listen();assert.equal((await call()).value.variables[0].hasValue,true);
  assert.equal((await call({action:'delete',expectedVersion:1,name:'FIXTURE_TOKEN'})).status,200);assert.deepEqual((await call()).value.variables,[]);
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(service.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes(token));
 }finally{await service.close();rmSync(dir,{recursive:true,force:true});}
});

test('approved host commands discard raw-cut secret tails per stream and preserve complete ordinary tails',async()=>{
 const s=setup(),token='credential-'+'x'.repeat(69);
 try{assert.equal(token.length,80);configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'RESEARCH_API_KEY',value:token},'repeat-key');s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});const row=s.app.store.get('session',s.session.id),generation=row.generation+1;s.app.store.update('session',row.id,row.version,{state:'running',generation,leaseUntil:Date.now()+120000});const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation};
  for(const [stdout,stderr] of [['repeat','repeat'],['repeat','complete'],['complete','repeat'],['complete','complete']]){
   const result=await s.app.hostAccess.execute(actor,{argv:[process.execPath,'-e','const key=process.env.RESEARCH_API_KEY;const output=kind=>kind==="repeat"?"p".repeat(17)+key.repeat(1000):"start|"+key+"|ordinary tail";process.stdout.write(output(process.argv[1]));process.stderr.write(output(process.argv[2]));',stdout,stderr]},'raw-cut-'+stdout+'-'+stderr);
   assert.equal(result.state,'succeeded');assert.equal(result.outputTruncated,stdout==='repeat'||stderr==='repeat');
   for(const [stream,kind] of [['stdout',stdout],['stderr',stderr]]){assert.ok(!result[stream].includes(token));assert.ok(!result[stream].includes(token.slice(0,-1)));if(kind==='repeat')assert.match(result[stream],/^p{17}(?:\[REDACTED\])+$/);else assert.equal(result[stream],'start|[REDACTED]|ordinary tail');}
  }
 }finally{await s.app.hostAccess.stop();s.close();}
});

test('approved host commands and real local runs receive saved variables, mask output and stop injecting deleted values',async()=>{
 const s=setup(),token='fixture-local-execution-secret';
 const save=value=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'RESEARCH_API_KEY',value},'save');
 const wait=async id=>{const end=Date.now()+30000;while(Date.now()<end){s.app.runs.launchPending();s.app.runs.reconcile();const run=s.app.runs.get(USER,id);if(['succeeded','failed','cancelled','unknown'].includes(run.state))return run;await new Promise(r=>setTimeout(r,50));}throw new Error('Local environment fixture timed out');};
 try{save(token);s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});const row=s.app.store.get('session',s.session.id),generation=row.generation+1;s.app.store.update('session',row.id,row.version,{state:'running',generation,leaseUntil:Date.now()+120000});const actor={type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator',generation};
  const result=await s.app.hostAccess.execute(actor,{argv:[process.execPath,'-e','process.stdout.write(process.env.RESEARCH_API_KEY);process.stderr.write(process.env.RESEARCH_API_KEY)']},'host-output');assert.equal(result.state,'succeeded');assert.equal(result.stdout,'[REDACTED]');assert.equal(result.stderr,'[REDACTED]');
  const utf8='密"'+'\\'.repeat(8190);configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name:'UTF8_TOKEN',value:utf8},'utf8');
  const split=await s.app.hostAccess.execute(actor,{argv:[process.execPath,'-e','const b=Buffer.from(process.env.UTF8_TOKEN);process.stdout.write("x".repeat(65532));process.stdout.write(b.subarray(0,1));setTimeout(()=>{process.stdout.write(b.subarray(1));process.stderr.write(JSON.stringify(process.env.UTF8_TOKEN));},30);']},'split-utf8');
  assert.equal(split.state,'succeeded');assert.equal(split.outputTruncated,true);assert.ok(!split.stdout.includes('密'));assert.ok(!split.stdout.includes('\uFFFD'));assert.equal(split.stdout.length,65536);assert.equal(split.stderr,'"[REDACTED]"');
  s.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});writeFileSync(join(s.app.store.paths.physical(s.project.workspace),'environment.mjs'),'import {writeFileSync} from "node:fs";const key=process.env.RESEARCH_API_KEY;console.log(key??"not configured");writeFileSync(process.env.PI_OUTPUT_DIR+"/metrics.json",JSON.stringify({configured:key?1:0}));writeFileSync(process.env.PI_OUTPUT_DIR+"/token.txt",key??"not configured");');
  const experiment=s.app.experiments.create(USER,s.project.id,{title:'Local environment',contract:{runner:'local',localRuntimeId:'node',command:['node','environment.mjs'],environment:{},networkPolicy:'host',datasetVersion:'fixture-v1',evaluationProtocolVersion:'fixture-v1',metrics:{configured:{unit:'boolean',direction:'max'}},expectedArtifacts:['metrics.json','token.txt'],timeoutSeconds:15,cpus:1,memoryMb:128}});
  const run=()=>{const intent=s.app.runs.prepare(USER,experiment.id);approve(s.app,intent.approvalId);return s.app.runs.submit(USER,intent.id);};
  const first=run(),done=await wait(first.id);assert.equal(done.state,'succeeded',JSON.stringify(done));assert.equal(done.integrity,'complete');assert.equal(done.metrics.configured,1);assert.ok(!s.app.runs.logs(USER,done.id).content.includes(token));
  for(const id of done.artifactIds)assert.ok(!s.app.evidence.read(USER,id).bytes.includes(Buffer.from(token)));assert.ok(!readFileSync(join(s.app.store.paths.physical(done.execution.controlDir),'native-spec.json'),'utf8').includes(token));
  configureEnvironment(s.app.context,USER,{action:'delete',expectedVersion:2,name:'RESEARCH_API_KEY'},'delete');const next=await wait(run().id);assert.equal(next.state,'succeeded',JSON.stringify(next));assert.equal(next.metrics.configured,0);assert.ok(!JSON.stringify(s.app.store.list('run')).includes(token));
 }finally{await s.app.hostAccess.stop();s.close();}
});
