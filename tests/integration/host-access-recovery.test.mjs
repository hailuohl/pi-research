import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire,syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {ResearchApp} from '../../dist/packages/research-app.js';
const USER={type:'user'};
function setup(){const dir=mkdtempSync(join(tmpdir(),'pi-host-recovery-')),data=join(dir,'data'),app=new ResearchApp(data,process.cwd()),project=app.projects.create(USER,{name:'Host fault fixture',template:'empty'}),session=app.sessions.create(USER,project.id,{title:'Fault fixture'});app.hostAccess.enable(USER,session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});const row=app.store.get('session',session.id);app.store.update('session',row.id,row.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});const actor={type:'agent',role:'coordinator',projectId:project.id,sessionId:session.id,generation:1};return {dir,data,app,project,session,actor};}
const run=(s,id,script,...args)=>s.app.hostAccess.execute(s.actor,{argv:[process.execPath,'-e',script,...args],cwd:s.dir},id);
async function close(s){await s.app.hostAccess.stop();s.app.close();rmSync(s.dir,{recursive:true,force:true});}

for(const outcome of ['slow-success','child-first','failed','spawn-error','no-child-close'])test(`Windows cancellation observes taskkill lifecycle: ${outcome}`,{skip:process.platform!=='win32'},async()=>{
 const s=setup(),require=createRequire(import.meta.url),cp=require('node:child_process'),originalSpawn=cp.spawn;let ownedChild,childClosed,stopTimer,stopStarted,stopFinished,stopAttempts=0;
 try{
  cp.spawn=(program,...args)=>{
   if(program!=='taskkill'){ownedChild=originalSpawn(program,...args);childClosed=new Promise(resolve=>ownedChild.once('close',resolve));return ownedChild;}
   assert.deepEqual(args[0],['/PID',String(ownedChild.pid),'/T','/F']);stopAttempts++;stopStarted=Date.now();const helper=new EventEmitter();helper.kill=()=>{clearTimeout(stopTimer);return true;};
   stopTimer=setTimeout(()=>{stopFinished=Date.now();if(outcome==='slow-success')ownedChild.kill('SIGKILL');if(outcome==='spawn-error')helper.emit('error',Error('INJECTED_TASKKILL_ERROR'));else helper.emit('close',outcome==='failed'?1:0);},['slow-success','child-first'].includes(outcome)?4500:20);return helper;
  };syncBuiltinESMExports();
  const marker=join(s.dir,'started'),script="require('node:fs').writeFileSync(process.argv[1],'started');"+(outcome==='child-first'?'setTimeout(()=>process.exit(0),300)':'setInterval(()=>{},1000)');
  const pending=run(s,'controlled-stop',script,marker),rejected=assert.rejects(pending,/撤销|失效/);
  for(let i=0;i<100&&!existsSync(marker);i++)await delay(20);assert.equal(existsSync(marker),true);
  const grant=s.app.hostAccess.status(USER,s.session.id);s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:grant.version});
  assert.throws(()=>run(s,'controlled-stop',script,marker),/撤销/);assert.throws(()=>run(s,'new-key','console.log(1)'),/撤销/);
  const stopping=Promise.all([s.app.hostAccess.stop(),s.app.hostAccess.stop()]);
  if(outcome==='child-first'){await childClosed;assert.equal(s.app.store.list('host-command')[0].state,'running','child close alone cannot confirm tree cleanup');}
  await rejected;await stopping;const job=s.app.store.list('host-command')[0];assert.equal(stopAttempts,1,'repeated cancellation must not start another taskkill');
  if(['slow-success','child-first'].includes(outcome)){assert.equal(job.state,'cancelled');assert.ok(stopFinished-stopStarted>4000);assert.throws(()=>process.kill(job.pid,0),{code:'ESRCH'});}
  else{assert.equal(job.state,'unknown');assert.equal(job.pid,ownedChild.pid);process.kill(job.pid,0);assert.match(job.error,outcome==='failed'?/taskkill.*1/:outcome==='spawn-error'?/INJECTED_TASKKILL_ERROR/:/受管进程退出未确认/);assert.equal(s.app.hostAccess.status(USER,s.session.id).unknownCommands,1);}
  assert.equal(s.app.store.list('host-command').length,1);assert.equal(s.app.hostAccess.status(USER,s.session.id).enabled,false);
  const finished=s.app.store.db.prepare("SELECT payload FROM events WHERE type='host_command.finished'").all();assert.equal(finished.length,1);assert.equal(JSON.parse(finished[0].payload).state,job.state);
 }finally{clearTimeout(stopTimer);cp.spawn=originalSpawn;syncBuiltinESMExports();if(ownedChild){if(ownedChild.exitCode===null)ownedChild.kill('SIGKILL');await childClosed;}await close(s);}
});

test('terminal audit failure rolls back terminal state, settles without uncaught callback error, and fences future calls',async()=>{
 const s=setup(),original=s.app.store.event.bind(s.app.store);try{s.app.store.event=(pid,type,payload)=>{if(type==='host_command.finished')throw Error('INJECTED_TERMINAL_AUDIT_FAILURE');return original(pid,type,payload);};const pending=run(s,'audit','console.log("actual child finished")');const settled=await Promise.race([pending.then(()=>({ok:true}),error=>({error:error.message})),delay(2000).then(()=>({timeout:true}))]);assert.equal(settled.timeout,undefined);assert.match(settled.error,/未确认|记录|核对/);assert.equal(s.app.store.list('host-command')[0].state,'running','terminal update must roll back together with failed audit');const status=s.app.hostAccess.status(USER,s.session.id);assert.equal(status.enabled,false);assert.equal(status.unknownCommands,1);assert.throws(()=>run(s,'new','console.log(1)'),/未确认|核对|记录/);
 }finally{s.app.store.event=original;await close(s);}
});

test('a normal second ResearchApp connection never rewrites another live controller command or its running count',async()=>{
 const s=setup();let second;try{const marker=join(s.dir,'started');const pending=run(s,'live',"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)",marker);pending.catch(()=>{});for(let i=0;i<100&&!existsSync(marker);i++)await delay(20);assert.equal(existsSync(marker),true);const before=s.app.store.list('host-command')[0];assert.equal(before.state,'running');second=new ResearchApp(s.data,process.cwd());assert.equal(s.app.store.get('host-command',before.id).state,'running');assert.equal(s.app.store.get('host-command',before.id).version,before.version);assert.equal(s.app.hostAccess.status(USER,s.session.id).activeCommands,1);second.close();second=undefined;assert.equal(s.app.hostAccess.status(USER,s.session.id).activeCommands,1);await s.app.hostAccess.stop();await pending.catch(()=>{});
 }finally{second?.close();await close(s);}
});

test('spawn followed by failed startup audit and failed recovery write retains an unknown barrier and PID',async()=>{
 const s=setup(),originalEvent=s.app.store.event.bind(s.app.store),originalUpdate=s.app.store.update.bind(s.app.store);let spawnedPid;
 try{
  s.app.store.event=(pid,type,payload)=>{if(type==='host_command.started'){spawnedPid=s.app.store.list('host-command')[0].pid;throw Error('INJECTED_START_AUDIT_FAILURE');}return originalEvent(pid,type,payload);};
  s.app.store.update=(kind,id,version,patch)=>{if(kind==='host-command'&&patch.state==='unknown')throw Error('INJECTED_RECOVERY_WRITE_FAILURE');return originalUpdate(kind,id,version,patch);};
  assert.throws(()=>run(s,'start-write-failed','setInterval(()=>{},1000)'),/INJECTED_START_AUDIT_FAILURE/);
  assert.equal(s.app.store.list('host-command')[0].state,'starting');const status=s.app.hostAccess.status(USER,s.session.id);assert.equal(status.enabled,false);assert.equal(status.unknownCommands,1);assert.equal(status.jobs[0].pid,spawnedPid);assert.throws(()=>run(s,'new-key','console.log(1)'),/核对|未确认/);
 }finally{s.app.store.event=originalEvent;s.app.store.update=originalUpdate;if(spawnedPid)try{process.kill(spawnedPid,'SIGKILL');}catch{}await close(s);}
});

test('an unconfirmed stop fences new call IDs until explicit owner review; new epoch still cannot replay the unknown command',async()=>{
 const s=setup(),require=createRequire(import.meta.url),cp=require('node:child_process'),originalSpawn=cp.spawn,originalKill=process.kill;let firstPid;
 try{
  if(process.platform==='win32'){cp.spawn=(program,...args)=>program==='taskkill'?new EventEmitter():originalSpawn(program,...args);syncBuiltinESMExports();}else process.kill=(pid,signal)=>pid<0?true:originalKill(pid,signal);
  const marker=join(s.dir,'started');const pending=run(s,'unknown',"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)",marker);const rejected=pending.then(()=>({ok:true}),error=>({error:error.message}));for(let i=0;i<100&&!existsSync(marker);i++)await delay(20);assert.equal(existsSync(marker),true);firstPid=s.app.store.list('host-command')[0].pid;
  const interrupted=s.app.store.get('session',s.session.id);s.app.store.update('session',interrupted.id,interrupted.version,{leaseUntil:0});await rejected;
  originalKill(firstPid,0);assert.equal(s.app.store.list('host-command')[0].state,'unknown');
  const idle=s.app.store.get('session',s.session.id);s.app.store.update('session',idle.id,idle.version,{state:'idle',leaseUntil:0});const status=s.app.hostAccess.status(USER,s.session.id);assert.equal(status.enabled,false);
  assert.throws(()=>s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:status.version,acknowledgedSameUserAccess:true}),/核对|未确认/);
  const running=s.app.store.get('session',s.session.id);s.app.store.update('session',running.id,running.version,{state:'running',leaseUntil:Date.now()+60000});assert.throws(()=>run(s,'different-key','console.log(2)'),/撤销|核对|未确认/);
  originalKill(firstPid,'SIGKILL');firstPid=undefined;cp.spawn=originalSpawn;syncBuiltinESMExports();process.kill=originalKill;
  const ended=s.app.store.get('session',s.session.id);s.app.store.update('session',ended.id,ended.version,{state:'idle',leaseUntil:0});const now=s.app.hostAccess.status(USER,s.session.id);s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:now.version,acknowledgedSameUserAccess:true,acknowledgedUnknownEffects:true});const renewed=s.app.store.get('session',s.session.id);s.app.store.update('session',renewed.id,renewed.version,{state:'running',generation:2,leaseUntil:Date.now()+60000});s.actor={...s.actor,generation:2};assert.throws(()=>run(s,'unknown',"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)",marker),/失效/);const next=await run(s,'owner-reviewed','console.log("owner reviewed unknown effects")');assert.equal(next.state,'succeeded');assert.equal(s.app.store.list('host-command').length,2);
 }finally{cp.spawn=originalSpawn;syncBuiltinESMExports();process.kill=originalKill;if(firstPid)try{originalKill(firstPid,'SIGKILL');}catch{}await close(s);}
});
