import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as pause} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';
import {docker,JOB_LABEL} from '../../dist/packages/execution/docker.js';
const image=process.env.PI_DEVELOPMENT_IMAGE,context=process.env.PI_DEVELOPMENT_CONTEXT||'desktop-linux';
const skip=process.env.PI_EVENTS_LIVE!=='1'?'NOT EXECUTED: set PI_EVENTS_LIVE=1':!image?'NOT EXECUTED: supply a locally available PI_DEVELOPMENT_IMAGE@sha256 digest':false;
const hash=b=>createHash('sha256').update(b).digest('hex');
const terminal=row=>['succeeded','failed','cancelled','timed_out'].includes(row.state);

test('real Docker long UTF-8 logs and durable events survive closing and reopening the HTTP controller',{skip,timeout:180000},async()=>{
 const base=resolve('.validation');mkdirSync(base,{recursive:true});const dir=mkdtempSync(join(base,'events-logs-live-'));
 let service,apiBase,headers,stream,runId,jobId,pid;const evidence={fixture:true,scientificConclusion:false,passed:false,image,context,checks:[]};
 const open=async()=>{service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0});apiBase=`http://127.0.0.1:${await service.listen()}/api`;headers={Authorization:`Bearer ${service.token}`};};
 const get=async path=>{const response=await fetch(apiBase+path,{headers,signal:AbortSignal.timeout(10000)}),value=await response.json();assert.equal(response.status,200,JSON.stringify(value));return value;};
 const wait=async(label,fn)=>{const end=Date.now()+75000;while(Date.now()<end){const value=fn();if(value)return value;await pause(150);}throw Error(label);};
 const approve=id=>{const row=service.app.store.get('approval',id);service.app.approvals.decide(USER,id,row.version,true);};
 const expected=Buffer.concat([Buffer.alloc(65535,97),Buffer.from('中🙂\n'),Buffer.from('真实日志🙂 abcdefghijklmnop\n'.repeat(45000))]);
 const readLogs=async(kind,id)=>{let cursor=0,identity=null,text='',pages=0,maxDelivered=0;for(let n=0;n<100;n++){
  let result;if(kind==='run')result=await get(`/runs/${id}/logs?cursor=${cursor}${identity?`&identity=${identity}`:''}`);
  else result=await service.app.operations.execute(USER,'development_logs',{jobId:id,stream:'stdout',cursor,...(identity?{identity}:{})},{projectId:pid});
  assert.equal(result.start,cursor);assert.ok(result.cursor-cursor<=65536);if(identity)assert.equal(result.identity,identity);identity=result.identity;maxDelivered=Math.max(maxDelivered,result.cursor-cursor);text+=result.content;cursor=result.cursor;pages++;if(result.complete)return {cursor,pages,maxDelivered,sha256:hash(Buffer.from(text)),bytes:Buffer.byteLength(text)};
 }throw Error('Log paging did not finish within fixed page bound');};
 try{
  await docker(context,['image','inspect','--format','{{.Id}}',image]);await open();
  const app=service.app,p=app.projects.create(USER,{name:'Long log and reconnect fixture',template:'empty'});pid=p.id;
  app.projects.writeFile(USER,p.id,'main.py',`import sys,time,json,pathlib,os\npayload=b'a'*65535+'中🙂\\n'.encode()+('真实日志🙂 abcdefghijklmnop\\n'*45000).encode()\nsys.stdout.buffer.write(payload[:65536]);sys.stdout.buffer.flush()\ntime.sleep(0.2)\nsys.stdout.buffer.write(payload[65536:]);sys.stdout.buffer.flush()\nsys.stderr.write('独立错误流：验收标记\\n');sys.stderr.flush()\ntime.sleep(1 if '--development' in sys.argv else 12)\nout=pathlib.Path(os.environ.get('PI_OUTPUT_DIR','/output'))\n(out/'metrics.json').write_text(json.dumps({'lines':45000}))\n`,null);
  const e=app.experiments.create(USER,p.id,{title:'Real large-log fixture',hypothesis:'Verifies logs only',contract:{runner:'docker',image,dockerContext:context,command:['python','-u','main.py'],environment:{},datasetVersion:'log-fixture-v1',evaluationProtocolVersion:'utf8-pages-v1',metrics:{lines:{unit:'lines',direction:'max'}},expectedArtifacts:['metrics.json'],timeoutSeconds:60,cpus:1,memoryMb:256,logBytes:4*1024*1024}});
  const config=app.compute.inspect(USER).configuration;app.compute.configure(USER,{expectedVersion:config.version,limits:{maxJobs:1,cpus:1}});
  const start=app.store.eventCursor(p.id),intent=app.runs.prepare(USER,e.id);approve(intent.approvalId);runId=app.runs.submit(USER,intent.id).id;
  const session=app.sessions.create(USER,p.id,{title:'Development log fixture'});app.sources.prepare(USER,p.id,session.id,{experimentId:e.id,revision:1});
  const task=app.development.prepare(USER,p.id,session.id,{command:['python','-u','main.py','--development'],environmentImageDigest:image,dockerContext:context,resources:{cpus:1,memoryMb:256,timeoutSeconds:60,logBytes:4*1024*1024},expectedArtifacts:['metrics.json']});approve(task.grantId);jobId=app.development.submit(USER,p.id,task.id).id;
  const response=await fetch(apiBase+`/events/stream?projectId=${p.id}&after=${start}`,{headers});assert.equal(response.status,200);stream=response.body.getReader();const handshake=await stream.read();assert.ok(new TextDecoder().decode(handshake.value).includes('event: wake'));
  const running=await wait('Run did not start',()=>{const r=app.store.get('run',runId);return r.state==='running'?r:terminal(r)?(()=>{throw Error(r.error||r.state);})():null;});
  const container=running.execution.containerId,inspection=JSON.parse(await docker(context,['inspect',container]))[0],first=await get(`/runs/${runId}/logs?cursor=0`);assert.ok(first.cursor<=65536);assert.equal(first.complete,false);
  await service.close();await stream.cancel().catch(()=>{});stream=null;service=null;evidence.checks.push({name:'closed-with-active-sse-and-running-container',runId,containerId:container,firstPageBytes:first.cursor});
  await open();const reopened=service.app.store.get('run',runId);assert.equal(reopened.execution.containerId,container);
  const finished=await wait('Both real jobs did not finish',()=>{const r=service.app.store.get('run',runId),j=service.app.store.get('sandbox-job',jobId);return terminal(r)&&terminal(j)?{r,j}:null;});
  for(const row of [finished.r,finished.j]){assert.equal(row.state,'succeeded',row.error);assert.equal(row.integrity,'complete');}
  const formal=await readLogs('run',runId),development=await readLogs('development',jobId);for(const result of [formal,development]){assert.equal(result.bytes,expected.length);assert.equal(result.sha256,hash(expected));assert.ok(result.cursor>1000000);}
  const replay=await get(`/events?projectId=${p.id}&after=${start}&limit=500`);assert.ok(replay.items.some(e=>e.type==='run.completed'&&e.payload?.runId===runId));assert.ok(replay.items.some(e=>e.type==='development.finalized'&&e.payload?.jobId===jobId));
  const after=JSON.parse(await docker(context,['inspect',container]))[0];assert.equal(after.State.StartedAt,inspection.State.StartedAt);assert.equal(after.RestartCount,0);
  for(const id of [runId,jobId])assert.equal((await docker(context,['ps','-a','--filter',`label=${JOB_LABEL}=${id}`,'--format','{{.ID}}'])).split(/\r?\n/).filter(Boolean).length,1);
  assert.equal(service.app.store.list('model-usage',p.id).length,0);evidence.checks.push({name:'reopened-controller-restored-real-terminal-state-with-identical-log-bytes',runId,jobId,formal,development,expectedSha256:hash(expected),expectedBytes:expected.length,originalStartedAt:inspection.State.StartedAt,finalStartedAt:after.State.StartedAt,eventStart:start,eventEnd:replay.cursor,runState:finished.r.state,developmentState:finished.j.state});evidence.passed=true;
 }catch(error){evidence.error=error.message;throw error;}finally{await stream?.cancel().catch(()=>{});if(service){for(const [kind,id] of [['run',runId],['sandbox-job',jobId]])if(id){const row=service.app.store.get(kind,id);if(!terminal(row)){try{if(kind==='run')service.app.runs.cancel(USER,id);else service.app.development.cancel(USER,pid,id);}catch{/* Retain the uncertain job and evidence for explicit reconciliation. */}}}await service.close();}writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));}
});
