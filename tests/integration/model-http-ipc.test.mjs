import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms)),deps={inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No model/network'}),workerEntry:resolve('tests/fixtures/model-http-worker.mjs')};
async function until(fn){const end=Date.now()+10000;while(Date.now()<end){if(fn())return;await pause(20);}throw Error('IPC fixture did not settle');}

test('a catalog edit does not impose image authorization on a queued text-only request',async()=>{
 const s=setup(),h=new AgentHost(s.app,deps);try{s.app.modelHttp.configure(USER,{expectedVersion:1,maxRequests:0});s.app.sessions.send(USER,s.session.id,{content:'text-only catalog control'});h.tick();await until(()=>s.app.modelHttp.inspect(USER,s.project.id).counts.queued===1);writeFileSync(resolve(s.dir,'models.json'),JSON.stringify({providers:{}}));s.app.modelHttp.configure(USER,{expectedVersion:2,maxRequests:1});await until(()=>h.active.size===0);assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items[0].state,'succeeded');assert.equal(s.app.sessions.get(USER,s.session.id).lastError,undefined);}finally{await h.stop();s.close();}
});

for(const crash of [false,true])test(`real IPC shares one HTTP slot across two Hosts and ${crash?'recovers a confirmed child exit':'retains streamed ownership until completion'}`,async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd()),a=new AgentHost(s.app,deps),b=new AgentHost(other,deps);try{
  s.app.modelHttp.configure(USER,{expectedVersion:1,maxRequests:1});const second=s.app.sessions.create(USER,s.project.id,{title:'second HTTP fixture'});
  s.app.sessions.send(USER,s.session.id,{content:crash?'crash after admission':'stream first'});a.tick();s.app.sessions.send(USER,second.id,{content:'stream second'});b.tick();
  let peak=0,waiting=false;await until(()=>{const v=s.app.modelHttp.inspect(USER,s.project.id);peak=Math.max(peak,v.counts.active+v.counts.unknown);waiting ||= v.counts.queued>0;return a.active.size+b.active.size===0;});
  const rows=s.app.modelHttp.inspect(USER,s.project.id).items;assert.equal(rows.length,2);assert.equal(peak,1);assert.equal(rows.filter(r=>r.state==='succeeded').length,crash?1:2);
  assert.equal(rows.filter(r=>r.state==='interrupted').length,crash?1:0);if(!crash)assert.ok(waiting);const ordered=rows.sort((x,y)=>x.startedAt.localeCompare(y.startedAt));assert.ok(Date.parse(ordered[1].startedAt)>=Date.parse(ordered[0].endedAt));assert.equal(s.app.modelHttp.inspect(USER).available,1);
  assert.equal(s.app.sessions.get(USER,second.id).state,'idle');assert.equal(s.app.agentAdmission.snapshot().counts.held,0);
 }finally{await a.stop();await b.stop();other.close();s.close();}
});

test('another controller cannot cancel between task validation and HTTP admission; a committed cancel prevents dispatch',async()=>{
 const s=setup(),other=new ResearchApp(s.dir,process.cwd()),h=new AgentHost(s.app,deps);let blocked=false;try{
  other.store.db.exec('PRAGMA busy_timeout=1');s.app.modelHttp.configure(USER,{expectedVersion:1,maxRequests:0});const team=startTeam(s,[spec('request')]),active=s.app.teams.active.bind(s.app.teams);
  s.app.teams.active=who=>{const result=active(who);if(!blocked){assert.throws(()=>other.teams.cancel(USER,who.taskId),/locked/);blocked=true;}return result;};
  h.tick();await until(()=>s.app.modelHttp.inspect(USER,s.project.id).counts.queued===1);assert.ok(blocked);
  const task=s.app.teams.tasks(USER,team.id)[0];other.teams.cancel(USER,task.id);s.app.modelHttp.configure(USER,{expectedVersion:2,maxRequests:1});await until(()=>h.active.size===0);
  const requests=s.app.modelHttp.inspect(USER,s.project.id).items;assert.equal(requests.length,1);assert.equal(requests[0].startedAt,undefined);assert.equal(requests[0].state,'cancelled');assert.equal(s.app.teams.tasks(USER,team.id)[0].execution,'cancelled');
 }finally{await h.stop();other.close();s.close();}
});
