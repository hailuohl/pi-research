import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {ResearchApp} from '../dist/packages/research-app.js';
import {USER} from '../dist/packages/domain/types.js';
import {readLogPage} from '../dist/packages/execution/log-page.js';
import {createHash} from 'node:crypto';
const base=resolve('.validation');mkdirSync(base,{recursive:true});const dir=mkdtempSync(join(base,'events-benchmark-'));
const app=new ResearchApp(dir,process.cwd()),evidence={fixture:true,scientificConclusion:false,scope:'event paging, current-session read snapshot and one log page only; not whole-application performance',node:process.version,platform:process.platform,passed:false};
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
 const p=app.projects.create(USER,{name:'Event performance fixture',template:'empty'}),other=app.projects.create(USER,{name:'Other event fixture',template:'empty'}),s=app.sessions.create(USER,p.id,{title:'Stream fixture'});
 app.store.transaction(()=>{for(let i=0;i<20000;i++)app.store.event(other.id,'fixture.history',{index:i,text:'x'.repeat(128)});app.store.update('session',s.id,s.version,{state:'running',generation:1});app.store.event(p.id,'agent.started',{sessionId:s.id,generation:1});for(let i=0;i<1200;i++)app.store.event(p.id,'session.delta',{sessionId:s.id,generation:1,text:'中🙂'.repeat(500)});});
 const log=Buffer.from(('实际字节读取🙂\n').repeat(300000));writeFileSync(join(dir,'stdout.log'),log);
 const page=()=>app.store.eventPage(0,p.id,500),view=()=>app.sessions.view(USER,s.id);
 // A byte offset in the middle of UTF-8 is intentionally invalid; choose a known line boundary.
 const lineBytes=Buffer.byteLength('实际字节读取🙂\n'),offset=Math.floor(1200000/lineBytes)*lineBytes;
 const operations={events:page,sessionView:view,logPage:()=>readLogPage(dir,'stdout.log',offset,{terminal:true})};
 evidence.dataset={otherProjectEvents:20000,currentGenerationDeltas:1200,logBytes:log.length,logReadOffset:offset};evidence.before=process.memoryUsage();evidence.timings={};
 for(const [name,fn] of Object.entries(operations)){for(let i=0;i<20;i++)fn();const times=[];for(let i=0;i<100;i++){const start=performance.now();fn();times.push(performance.now()-start);}times.sort((a,b)=>a-b);evidence.timings[name]={samples:100,p50Ms:times[49],p95Ms:times[94]};}
 const events=page(),snapshot=view(),logs=operations.logPage();assert.ok(Buffer.byteLength(JSON.stringify(events))<400000);assert.equal(events.items.length,500);assert.equal(events.hasMore,true);assert.ok(events.items.some(x=>x.omitted));assert.equal(snapshot.progress.truncated,true);assert.ok(snapshot.progress.content.length<=32000);assert.ok(logs.cursor-logs.start<=65536);assert.equal(logs.content,log.subarray(logs.start,logs.cursor).toString('utf8'));
 evidence.bounds={eventResponseBytes:Buffer.byteLength(JSON.stringify(events)),eventItems:events.items.length,omittedPayloads:events.items.filter(x=>x.omitted).length,sessionPreviewCharacters:snapshot.progress.content.length,logDeliveredBytes:logs.cursor-logs.start,logContentSha256:hash(Buffer.from(logs.content)),logIdentity:logs.identity};
 const queries=[['SELECT seq FROM events WHERE project_id=? AND seq>? ORDER BY seq LIMIT 201',[p.id,0]],["SELECT seq FROM events WHERE project_id=? AND json_extract(payload,'$.sessionId')=? AND type='session.delta' AND seq>? ORDER BY seq DESC LIMIT 257",[p.id,s.id,0]],["SELECT data FROM records WHERE kind='message' AND json_extract(data,'$.sessionId')=? AND project_id=? ORDER BY rowid",[s.id,p.id]]];
 evidence.queryPlans=queries.map(([sql,parameters])=>({sql,plan:app.store.db.prepare('EXPLAIN QUERY PLAN '+sql).all(...parameters)}));evidence.after=process.memoryUsage();evidence.passed=true;
}catch(error){evidence.error=error.message;process.exitCode=1;}finally{await app.compute.stop();await app.git.stop();app.close();writeFileSync(join(dir,'evidence.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify({passed:evidence.passed,path:join(dir,'evidence.json'),timings:evidence.timings,error:evidence.error}));}
