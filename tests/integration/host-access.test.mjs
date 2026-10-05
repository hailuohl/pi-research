import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
const USER={type:'user'},pause=ms=>new Promise(r=>setTimeout(r,ms));
function fixture(){const dir=mkdtempSync(join(tmpdir(),'pi-host-access-'));const app=new ResearchApp(join(dir,'data'),process.cwd()),project=app.projects.create(USER,{name:'Host access integration fixture',template:'curve-fit'}),session=app.sessions.create(USER,project.id,{title:'Full host fixture'});return {dir,app,project,session,close:async()=>{await app.hostAccess.stop();app.close();rmSync(dir,{recursive:true,force:true});}};}
function enable(s){return s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:s.app.hostAccess.status(USER,s.session.id).version,acknowledgedSameUserAccess:true});}
function actor(s){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+120000});return {type:'agent',sessionId:s.session.id,projectId:s.project.id,role:'coordinator',generation:row.generation+1};}
const invoke=(s,a,key,script,...args)=>s.app.operations.execute(a,'host_execute',{argv:[process.execPath,'-e',script,...args],cwd:s.dir},{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key});

test('host full requires explicit owner acknowledgement/CAS and never exposes itself to ungranted, task or automatic sessions',async()=>{
 const s=fixture();try{const tools=new ToolDispatcher(s.app);assert.equal(tools.definitions('coordinator',false,s.session.id).some(t=>t.name==='host_execute'),false);
 assert.throws(()=>s.app.hostAccess.enable({type:'agent',sessionId:s.session.id,projectId:s.project.id},s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true}),/用户明确授权/);
 assert.throws(()=>s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0}),/明确接受/);assert.throws(()=>s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:2,acknowledgedSameUserAccess:true}),/权限已变化/);
 enable(s);assert.equal(tools.definitions('coordinator',false,s.session.id).some(t=>t.name==='host_execute'),true);assert.equal(tools.definitions('coordinator',true,s.session.id).some(t=>t.name==='host_execute'),false);assert.equal(s.app.hostAccess.status(USER,s.session.id).osSandboxVerified,false);
 const a=actor(s);for(const bad of [{...a,wakeupId:'fake'},{...a,taskId:'fake',attemptId:'fake'},{...a,generation:0},{...a,role:'reviewer'}])assert.throws(()=>s.app.hostAccess.assertAgent(bad));
 const child=s.app.sessions.create(USER,s.project.id,{title:'Child'},{role:'implementer',teamId:'fake',taskId:'fake'});assert.throws(()=>s.app.hostAccess.enable(USER,child.id,{expectedVersion:0,acknowledgedSameUserAccess:true}),{code:'HOST_ACCESS_UNAVAILABLE'});
 assert.throws(()=>enable(s),/等待当前/);
 }finally{await s.close();}
});

test('real host command reads and writes outside the session workspace; argv is literal, and durable replay does not run twice',async()=>{
 const s=fixture();try{enable(s);const a=actor(s),file=join(s.dir,'outside-session.txt'),mark='literal; $(echo should-not-run) & 中文';
 const script="const fs=require('node:fs');const n=fs.existsSync(process.argv[1])?Number(fs.readFileSync(process.argv[1],'utf8'))+1:1;fs.writeFileSync(process.argv[1],String(n));console.log(JSON.stringify({n,arg:process.argv[2],keyPresent:!!process.env.PI_API_KEY,nodeOptionsPresent:!!process.env.NODE_OPTIONS}));";
 const result=await invoke(s,a,'once',script,file,mark);assert.equal(result.state,'succeeded');const out=JSON.parse(result.stdout);assert.equal(out.arg,mark);assert.equal(out.n,1);assert.equal(out.keyPresent,false);assert.equal(out.nodeOptionsPresent,false);assert.equal(readFileSync(file,'utf8'),'1');
 const replay=await invoke(s,a,'once',script,file,mark);assert.equal(replay.id,result.id);assert.equal(readFileSync(file,'utf8'),'1');assert.throws(()=>invoke(s,a,'once',script,file,'changed'),/同一调用标识/);
 const grant=s.app.hostAccess.status(USER,s.session.id);s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:grant.version});assert.throws(()=>invoke(s,a,'once',script,file,mark),/未开启|撤销/);assert.throws(()=>invoke(s,a,'new',script,file,mark),/未开启|撤销/);
 }finally{await s.close();}
});

test('real network request from a host command reaches a local HTTP fixture without any mocked transport',async()=>{
 const s=fixture();let requests=0;const http=createServer((req,res)=>{requests++;res.end('host-network-marker');});await new Promise(r=>http.listen(0,'127.0.0.1',r));
 try{enable(s);const a=actor(s),url=`http://127.0.0.1:${http.address().port}/network`;const result=await invoke(s,a,'network',"fetch(process.argv[1]).then(r=>r.text()).then(console.log)",url);assert.equal(result.state,'succeeded');assert.equal(result.stdout.trim(),'host-network-marker');assert.equal(requests,1);}finally{await new Promise(r=>http.close(r));await s.close();}
});

test('revoke while running fences new and cached calls and stops the tracked process with honest durable state',async()=>{
 const s=fixture();try{enable(s);const a=actor(s),marker=join(s.dir,'started.txt');const pending=invoke(s,a,'long',"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)",marker);const rejected=assert.rejects(pending,/撤销|失效/);
 for(let i=0;i<100&&!existsSync(marker);i++)await pause(20);assert.equal(existsSync(marker),true);
 const status=s.app.hostAccess.status(USER,s.session.id);s.app.hostAccess.revoke(USER,s.session.id,{expectedVersion:status.version});assert.throws(()=>invoke(s,a,'next','console.log(1)'),/撤销/);await rejected;
 const jobs=s.app.store.list('host-command',s.project.id);assert.equal(jobs.length,1);assert.ok(['cancelled','unknown'].includes(jobs[0].state));assert.equal(s.app.hostAccess.status(USER,s.session.id).enabled,false);
 }finally{await s.close();}
});

test('interrupt/generation loss also stops a full command; expired actors cannot replay its output',async()=>{
 const s=fixture();try{enable(s);const a=actor(s),marker=join(s.dir,'started.txt');const pending=invoke(s,a,'interrupted',"require('node:fs').writeFileSync(process.argv[1],'started');setInterval(()=>{},1000)",marker);const rejected=assert.rejects(pending,/身份|租约|写入权/);
 for(let i=0;i<100&&!existsSync(marker);i++)await pause(20);assert.equal(existsSync(marker),true);s.app.sessions.interrupt(USER,s.session.id);await rejected;assert.equal(s.app.store.list('host-command')[0].state,'cancelled');assert.throws(()=>invoke(s,a,'interrupted','console.log(1)'),/写入权/);
 }finally{await s.close();}
});

test('server reopen does not restore full and preserves command receipts; a new grant cannot replay the old epoch',async()=>{
 const s=fixture();try{enable(s);const a=actor(s);const result=await invoke(s,a,'history','console.log("history marker")');const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'idle',leaseUntil:0});s.app.close();s.app=new ResearchApp(join(s.dir,'data'),process.cwd());
 assert.equal(s.app.hostAccess.status(USER,s.session.id).enabled,false);assert.equal(s.app.hostAccess.status(USER,s.session.id).revokedOnRestart,true);assert.equal(s.app.store.get('host-command',result.id).stdout.trim(),'history marker');enable(s);const next=actor(s);assert.throws(()=>invoke(s,next,'history','console.log("history marker")'),/失效/);
 }finally{await s.app.hostAccess.stop();s.app.close();rmSync(s.dir,{recursive:true,force:true});}
});

test('missing executable is recorded as a failed command and is not rerun on the same call identifier',async()=>{
 const s=fixture();try{enable(s);const a=actor(s),raw={argv:[join(s.dir,'missing-executable')],cwd:s.dir};const options={projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'missing'};const first=await s.app.operations.execute(a,'host_execute',raw,options);assert.equal(first.state,'failed');const next=await s.app.operations.execute(a,'host_execute',raw,options);assert.equal(first.id,next.id);assert.equal(s.app.store.list('host-command').length,1);}finally{await s.close();}
});
