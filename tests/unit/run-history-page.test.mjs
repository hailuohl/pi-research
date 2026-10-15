import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {digest} from '../../dist/packages/storage/store.js';

function run(s,experimentId=s.baseline.id){const intent=s.app.runs.prepare(USER,experimentId);approve(s.app,intent.approvalId);const created=s.app.runs.submit(USER,intent.id);return fixtureFinish(s,created,{mse:0.2});}
function list(s,input={},projectId=s.project.id){const page=s.app.operations.execute(USER,'run_list',input,{projectId});validateSchema(OUTPUT_SCHEMAS.run_list,page,'output');return page;}
function counts(s){return {records:s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,events:s.app.store.events().length,operations:s.app.store.db.prepare('SELECT count(*) n FROM operations').get().n};}

test('owner Run history pages stay rowid-stable, bounded, private and resumable after reopen',()=>{
 const s=setup();try{
  const runs=[run(s),run(s),run(s)],other=s.app.projects.create(USER,{name:'Other',template:'curve-fit'}),otherExperiment=s.app.experiments.create(USER,other.id,{title:'Other baseline'}),foreign=run(s,otherExperiment.id);
  const before=counts(s);
  const first=list(s,{limit:2});assert.deepEqual(first.items.map(x=>x.id),runs.slice(0,2).map(x=>x.id));assert.equal(first.items.length,2);assert.equal(first.hasMore,true);
  assert.deepEqual(counts(s),before);
  assert.deepEqual(Object.keys(first).sort(),['cursor','hasMore','items']);
  const fields=['id','projectId','experimentId','intentId','state','integrity','judgment','manifestDigest','createdAt','updatedAt','endedAt','metrics'].sort();
  assert.deepEqual(Object.keys(first.items[0]).sort(),fields);assert.equal(first.items[0].projectId,s.project.id);assert.deepEqual(first.items[0].metrics,runs[0].metrics);
  assert.ok(!('manifest' in first.items[0])&&!('outputDir' in first.items[0])&&!('execution' in first.items[0])&&!('artifactIds' in first.items[0]));
  assert.equal(first.cursor,Number(s.app.store.db.prepare("SELECT rowid FROM records WHERE kind='run' AND id=?").get(runs[1].id).rowid));
  const old=s.app.store.get('run',runs[0].id);s.app.store.update('run',old.id,old.version,{state:'failed'});
  const added=run(s),stableFirst=list(s,{cursor:0,limit:2});assert.deepEqual(stableFirst.items.map(x=>x.id),first.items.map(x=>x.id));assert.equal(stableFirst.items[0].state,'failed');
  const second=list(s,{cursor:first.cursor,limit:2});assert.deepEqual(second.items.map(x=>x.id),[runs[2].id,added.id]);assert.equal(second.hasMore,false);assert.equal(second.items.length,2);
  assert.equal(list(s,{limit:100}).items.length,4);assert.ok(!list(s,{limit:100}).items.some(x=>x.id===foreign.id));
  assert.throws(()=>s.app.operations.execute(USER,'run_inspect',{runId:foreign.id},{projectId:s.project.id}),{code:'SCOPE_DENIED'});
  assert.throws(()=>s.app.runs.list({type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'},s.project.id),{code:'PERMISSION_DENIED'});
  for(const invalid of [{limit:0},{limit:101},{limit:1.5},{limit:null},{cursor:-1},{cursor:1.5},{cursor:Number.MAX_SAFE_INTEGER+1},{projectId:other.id}])
   assert.throws(()=>list(s,invalid),{code:'INVALID_INPUT'});
  assert.equal(list(s,{limit:1}).items.length,1);assert.equal(list(s).items.length,4);
  const inspected=s.app.operations.execute(USER,'run_inspect',{runId:runs[0].id},{projectId:s.project.id});
  assert.equal(inspected.id,first.items[0].id);assert.equal(inspected.manifestDigest,first.items[0].manifestDigest);assert.ok(inspected.manifest);assert.deepEqual(inspected.artifactIds,runs[0].artifactIds);
  const plan=s.app.store.db.prepare('EXPLAIN QUERY PLAN SELECT rowid,data FROM records WHERE kind=? AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?').all('run',s.project.id,first.cursor,3);
  assert.match(plan.map(x=>x.detail).join(' '),/records_project/);
  const bytes=new Map(runs.flatMap(r=>r.artifactIds.map(id=>[id,digest(s.app.evidence.read(USER,id).bytes)])));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  const resumed=list(s,{cursor:first.cursor,limit:2});assert.deepEqual(resumed.items,second.items);assert.equal(resumed.hasMore,false);
  const reopened=s.app.operations.execute(USER,'run_inspect',{runId:runs[0].id},{projectId:s.project.id});assert.equal(reopened.state,'failed');assert.deepEqual(reopened.artifactIds,runs[0].artifactIds);
  for(const [id,hash] of bytes)assert.equal(digest(s.app.evidence.read(USER,id).bytes),hash);
 }finally{s.close();}
});
