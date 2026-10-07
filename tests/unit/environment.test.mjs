import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER,submit} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {configureEnvironment,inspectEnvironment,environmentVariables,redactEnvironment,redactEnvironmentChunk,ENVIRONMENT_FILE} from '../../dist/packages/runtime/environment.js';
import {collectRunArtifacts} from '../../dist/packages/runners/artifacts.js';
import {safePath,listFiles} from '../../dist/packages/workspace/files.js';
import {excluded} from '../../dist/packages/publications/reports.js';
import {createDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {startTeam,spec} from '../support/collaboration.mjs';
import {digest} from '../../dist/packages/storage/store.js';
const token='fixture secret with spaces-abcdefghijk';
const save=(s,value=token,expectedVersion=0)=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion,name:'RESEARCH_API_KEY',value},'set-'+expectedVersion);

test('research artifact_create masks active and deleted credentials before CAS while user imports retain their bytes',async()=>{
 const s=setup();try{
  save(s);const session=s.app.store.get('session',s.session.id),generation=session.generation+1;
  s.app.store.update('session',session.id,session.version,{state:'running',generation,leaseUntil:Date.now()+60000});
  const actor={type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation};
  const create=key=>s.app.operations.execute(actor,'artifact_create',{title:token+' research',content:'result '+token,mediaType:'text/plain'},{projectId:s.project.id,sessionId:session.id,idempotencyKey:key});
  const first=await create('active-artifact');configureEnvironment(s.app.context,USER,{action:'delete',expectedVersion:1,name:'RESEARCH_API_KEY'},'delete-artifact-key');
  const second=await create('deleted-artifact');
  for(const artifact of [first,second]){const {bytes}=s.app.evidence.read(USER,artifact.id);assert.equal(bytes.toString(),'result [REDACTED]');assert.equal(artifact.title,'[REDACTED] research');assert.equal(artifact.digest,digest(bytes));assert.equal(artifact.size,bytes.length);}
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(s.app.store.db.prepare('SELECT * FROM '+table).all()).includes(token));
  assert.throws(()=>s.app.evidence.put(s.project.id,'binary',Buffer.concat([Buffer.from([0,255]),Buffer.from(token)]),'application/octet-stream','agent:'+session.id),{code:'ARTIFACT_SECRET_BINARY'});
  assert.throws(()=>s.app.evidence.put(s.project.id,'format',Buffer.from('safe'),token,'agent:'+session.id),{code:'ARTIFACT_SECRET_METADATA'});
  const original=s.app.evidence.put(s.project.id,'user original',Buffer.from(token),'text/plain','user');assert.equal(s.app.evidence.read(USER,original.id).bytes.toString(),token);
 }finally{s.close();}
});

test('private environment CAS, replay, rotation and deletion survive reopen without exposing values or changing history',()=>{
 const s=setup();try{
  const original=JSON.stringify(s.app.sessions.get(USER,s.session.id)),saved=save(s);
  assert.deepEqual(saved,{version:1,variables:[{name:'RESEARCH_API_KEY',hasValue:true}],scope:'local'});assert.deepEqual(save(s),saved);assert.equal(environmentVariables(s.dir).RESEARCH_API_KEY,token);
  assert.throws(()=>configureEnvironment(s.app.context,{type:'agent'},{action:'set',expectedVersion:1,name:'KEY',value:token},'agent'),{code:'PERMISSION_DENIED'});
  assert.throws(()=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'RESEARCH_API_KEY',value:'changed'},'set-0'),{code:'IDEMPOTENCY_CONFLICT'});
  assert.throws(()=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'RESEARCH_API_KEY',value:token},'stale'),{code:'VERSION_CONFLICT'});
  save(s,'rotated-fixture-secret',1);configureEnvironment(s.app.context,USER,{action:'delete',expectedVersion:2,name:'RESEARCH_API_KEY'},'delete');
  assert.deepEqual(environmentVariables(s.dir),{});assert.equal(redactEnvironment(s.dir,token+' rotated-fixture-secret'),'[REDACTED] [REDACTED]');
  for(const table of ['records','events','operations'])assert.ok(!JSON.stringify(s.app.store.db.prepare(`SELECT * FROM ${table}`).all()).includes(token));
  assert.equal(JSON.stringify(s.app.sessions.get(USER,s.session.id)),original);s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  assert.equal(inspectEnvironment(s.app.context,USER).version,3);assert.deepEqual(environmentVariables(s.dir),{});assert.equal(redactEnvironment(s.dir,token),'[REDACTED]');
 }finally{s.close();}
});

test('dangerous names, malformed values and lower-case aliases fail without changing the secret file',()=>{
 const s=setup();try{save(s);const original=readFileSync(join(s.dir,ENVIRONMENT_FILE));
  for(const name of ['research_api_key','PATH','HOME','NODE_OPTIONS','PYTHONPATH','LD_PRELOAD','HTTP_PROXY','PI_DATA_DIR','CUDA_VISIBLE_DEVICES','A-B','__proto__'])assert.throws(()=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name,value:token},name),{code:'INVALID_INPUT'});
  for(const value of ['', '   ','bad\0value','bad\nvalue','x'.repeat(8193)])assert.throws(()=>configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name:'SECOND_KEY',value},'invalid-value'),{code:'INVALID_INPUT'});
  assert.deepEqual(readFileSync(join(s.dir,ENVIRONMENT_FILE)),original);
  const single=configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name:'SINGLE_DIGIT',value:'1'},'short');assert.equal(single.variables.find(v=>v.name==='SINGLE_DIGIT').name,'SINGLE_DIGIT');
 }finally{s.close();}
});

test('stream tails protect split and JSON-escaped secrets without rewriting replacement markers or splitting emoji',()=>{
 const s=setup();try{save(s,'quote"slash\\secret');configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name:'SHORT_VALUE',value:'A'},'short');
  assert.equal(redactEnvironment(s.dir,'A quote"slash\\secret'),'[REDACTED] [REDACTED]');
  const input='before 🧪 quote"slash\\secret then '+JSON.stringify('quote"slash\\secret').slice(1,-1)+' A end';let tail='',published='';
  for(const part of input.split('')){const next=redactEnvironmentChunk(s.dir,tail+part);published+=next.text;tail=next.tail;assert.ok(!/[\uD800-\uDBFF]$/.test(next.text));}
  published+=redactEnvironment(s.dir,tail);assert.equal(published,redactEnvironment(s.dir,input));assert.ok(!published.includes('slash'));
 }finally{s.close();}
});

test('both coordinator and task worker forks receive explicitly configured environment without inheriting unsafe flags',async()=>{
 const s=setup(),seen=[],host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'FIXTURE'}),fork:(_file,_argv,options)=>{seen.push(options);throw new Error('fixture stops before creating a process');}});
 try{save(s);s.app.sessions.send(USER,s.session.id,{content:'fixture coordinator'});host.tick();startTeam(s,[spec('environment-worker')]);host.tick();
  assert.ok(seen.length>=2);for(const options of seen){assert.equal(options.env.RESEARCH_API_KEY,token);assert.equal(options.env.NODE_OPTIONS,undefined);assert.deepEqual(options.execArgv,[]);}
  assert.ok(seen.some(options=>options.cwd===s.app.store.paths.physical(s.app.sessions.get(USER,s.session.id).workspace)),'coordinator fork captured');
  assert.ok(s.app.store.list('session',s.project.id).filter(session=>session.taskId&&session.role!=='coordinator').some(session=>seen.some(options=>options.cwd===s.app.store.paths.physical(session.workspace))),'task worker fork captured');
  configureEnvironment(s.app.context,USER,{action:'delete',expectedVersion:1,name:'RESEARCH_API_KEY'},'delete');const later=s.app.sessions.create(USER,s.project.id,{title:'after delete'});s.app.sessions.send(USER,later.id,{content:'fixture after deletion'});host.tick();assert.equal(seen.at(-1).env.RESEARCH_API_KEY,undefined);
 }finally{await host.stop();s.close();}
});

test('local run logs defer live bytes and mask complete terminal logs after the variable is deleted',()=>{
 const s=setup();try{save(s);const run=submit(s,s.app.runs.prepare(USER,s.baseline.id)),control=join(s.dir,'jobs',run.id,'control');mkdirSync(control,{recursive:true});
  const execution={backend:'local',controlDir:s.app.store.paths.reference(control),generation:1,leaseUntil:Date.now()+60000,startRequested:true,recoveryCount:0,dockerContext:'',containerName:''};
  let row=s.app.store.update('run',run.id,run.version,{state:'running',execution});writeFileSync(join(control,'stdout.log'),'prefix '+token);writeFileSync(join(control,'stderr.log'),'');
  assert.equal(s.app.runs.logs(USER,run.id).content,'');configureEnvironment(s.app.context,USER,{action:'delete',expectedVersion:1,name:'RESEARCH_API_KEY'},'remove');
  s.app.store.update('run',row.id,row.version,{state:'succeeded',execution:{...execution,leaseUntil:0}});
  const page=s.app.runs.logs(USER,run.id);assert.equal(page.content,'prefix [REDACTED]');assert.equal(page.complete,true);assert.equal(readFileSync(join(control,'stdout.log'),'utf8'),'prefix '+token);
 }finally{s.close();}
});

test('new local artifacts mask text before hashing, reject sensitive binary bytes, and retain numeric measurements',()=>{
 const s=setup();try{save(s);configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:1,name:'NUMERIC_OPTION',value:'1'},'numeric');
  const run=submit(s,s.app.runs.prepare(USER,s.baseline.id)),control=join(s.dir,'jobs',run.id,'control'),output=s.app.store.paths.physical(run.outputDir);mkdirSync(control,{recursive:true});
  writeFileSync(join(output,'metrics.json'),JSON.stringify({mse:1,r2:0.9,train_mse:0.1}));writeFileSync(join(output,'model.json'),'{}');writeFileSync(join(output,'predictions.csv'),token);writeFileSync(join(output,'secret.bin'),Buffer.concat([Buffer.from([0]),Buffer.from(token)]));writeFileSync(join(control,'stdout.log'),token);writeFileSync(join(control,'stderr.log'),'');
  const result=collectRunArtifacts({...run,execution:{backend:'local',controlDir:s.app.store.paths.reference(control),startRequested:true}},s.app.evidence,s.app.store.paths);
  assert.equal(result.metrics.mse,1);assert.equal(result.integrity,'invalid');assert.ok(result.errors.some(e=>e.includes('二进制')));
  const archived=result.artifactIds.map(id=>s.app.evidence.read(USER,id));assert.ok(!archived.some(a=>a.artifact.title==='secret.bin'));assert.equal(archived.find(a=>a.artifact.title==='stdout.log').bytes.toString(),'[REDACTED]');
  for(const {bytes} of archived)assert.ok(!bytes.includes(Buffer.from(token)));
 }finally{s.close();}
});

test('environment files and native startup specs are excluded from snapshots and managed backups',async()=>{
 const s=setup(),backup=s.dir+'-backup';let closed=false;try{save(s);writeFileSync(join(s.dir,ENVIRONMENT_FILE+'.fixture.tmp'),token);
  for(const name of [ENVIRONMENT_FILE,ENVIRONMENT_FILE+'.fixture.tmp']){assert.throws(()=>safePath(s.dir,name),{code:'PATH_DENIED'});assert.ok(excluded('nested/'+name));}assert.ok(!listFiles(s.dir).some(f=>f.path.includes('environment-variables')));
  const control=join(s.dir,'jobs','fixture','control');mkdirSync(control,{recursive:true});writeFileSync(join(control,'native-spec.json'),token);writeFileSync(join(control,'native-result.json'),'{}');
  s.app.close();closed=true;const result=await createDataBackup(s.dir,backup,{offline:true});assert.ok(result.excluded.includes(ENVIRONMENT_FILE));assert.ok(result.excluded.includes('jobs/fixture/control/native-spec.json'));assert.ok(!existsSync(join(backup,'data',ENVIRONMENT_FILE)));assert.ok(existsSync(join(backup,'data','jobs','fixture','control','native-result.json')));
 }finally{if(!closed)s.app.close();for(const path of [s.dir,backup])rmSync(path,{recursive:true,force:true});}
});

test('backup restores sanitized archive logs while omitting private local work, output and credential history',async()=>{
 const s=setup(),backup=s.dir+'-backup',restored=s.dir+'-restored';let closed=false;
 try{save(s);const original=submit(s,s.app.runs.prepare(USER,s.baseline.id)),control=join(s.dir,'jobs',original.id,'control'),output=s.app.store.paths.physical(original.outputDir);mkdirSync(join(control,'work'),{recursive:true});mkdirSync(join(control,'tmp'),{recursive:true});
  writeFileSync(join(control,'work','private.txt'),token);writeFileSync(join(control,'tmp','private.txt'),token);writeFileSync(join(control,'stdout.log'),token);writeFileSync(join(control,'stderr.log'),token);writeFileSync(join(control,'native-result.json'),JSON.stringify({manifestDigest:original.manifestDigest,exitCode:0}));
  writeFileSync(join(output,'metrics.json'),'{}');writeFileSync(join(output,'private.bin'),Buffer.concat([Buffer.from([0]),Buffer.from(token)]));
  const execution={backend:'local',controlDir:s.app.store.paths.reference(control),generation:1,leaseUntil:0,startRequested:true,recoveryCount:0,dockerContext:'',containerName:''};const collected=collectRunArtifacts({...original,execution},s.app.evidence,s.app.store.paths);
  s.app.store.update('run',original.id,original.version,{state:'failed',execution,artifactIds:collected.artifactIds,evidenceIds:collected.evidenceIds});s.app.close();closed=true;
  const summary=await createDataBackup(s.dir,backup,{offline:true});assert.ok(summary.excluded.includes(`jobs/${original.id}/output/*`));await restoreDataBackup(backup,restored,{offline:true,relocate:true});
  const app=new ResearchApp(restored,process.cwd());try{assert.equal(existsSync(join(restored,ENVIRONMENT_FILE)),false);assert.equal(existsSync(join(restored,'jobs',original.id,'control','stdout.log')),false);assert.equal(app.runs.logs(USER,original.id,0,'stdout').content,'[REDACTED]');assert.equal(app.runs.logs(USER,original.id,0,'stderr').content,'[REDACTED]');}finally{app.close();}
  assert.equal(readFileSync(join(control,'stdout.log'),'utf8'),token);
 }finally{if(!closed)s.app.close();for(const path of [s.dir,backup,restored])rmSync(path,{recursive:true,force:true});}
});

test('backup refuses credential-bearing native narrative while preserving source and accepts ordinary traces',async()=>{
 const s=setup(),backup=s.dir+'-backup';let closed=false;try{save(s);const dir=join(s.dir,'sessions',s.session.id,'pi');mkdirSync(dir,{recursive:true});const file=join(dir,'fixture.jsonl'),unsafe=JSON.stringify({type:'message',id:'same-id',message:{role:'assistant',content:[{type:'text',text:token}]}})+'\n';writeFileSync(file,unsafe);s.app.close();closed=true;
  await assert.rejects(createDataBackup(s.dir,backup,{offline:true}),{code:'BACKUP_SECRET_TRACE'});assert.equal(readFileSync(file,'utf8'),unsafe);assert.equal(existsSync(backup),false);
  writeFileSync(file,JSON.stringify({type:'message',id:'same-id',message:{role:'assistant',content:[{type:'text',text:'Already [REDACTED]'}],usage:{input:1}}})+'\n');await createDataBackup(s.dir,backup,{offline:true});assert.ok(existsSync(join(backup,'data','sessions',s.session.id,'pi','fixture.jsonl')));
 }finally{if(!closed)s.app.close();for(const path of [s.dir,backup])rmSync(path,{recursive:true,force:true});}
});
