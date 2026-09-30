import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve,fixtureFinish} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {digest} from '../../dist/packages/storage/store.js';

function claim(s,pid,label){
 const artifact=s.app.evidence.put(pid,'observation.txt',Buffer.from('measured observation'),'text/plain'),evidence=s.app.evidence.register(USER,pid,artifact.id,0,19,'fixed source');
 const proposed=s.app.evidence.proposeClaim(USER,pid,label,[evidence.id]);return s.app.evidence.decideClaim(USER,proposed.id,proposed.version,'accepted');
}
function run(s){const intent=s.app.runs.prepare(USER,s.baseline.id);approve(s.app,intent.approvalId);return fixtureFinish(s,s.app.runs.submit(USER,intent.id),{mse:0.2});}
function report(s,pid,title,claimId,runIds=[]){const artifact=s.app.reports.create(USER,pid,{title,claimIds:[claimId],runIds}),row=s.app.store.list('report',pid).find(item=>item.artifactId===artifact.id);return {row,artifact};}
function list(s,input={},pid=s.project.id){const page=s.app.operations.execute(USER,'report_list',input,{projectId:pid});validateSchema(OUTPUT_SCHEMAS.report_list,page,'output');return page;}
function counts(s){return {records:s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,events:s.app.store.events().length,operations:s.app.store.db.prepare('SELECT count(*) n FROM operations').get().n,runs:s.app.store.list('run').length,modelUsage:s.app.store.list('model-usage').length};}

test('owner report history pages are bounded, private, rowid-stable and resumable after reopen',()=>{
 const s=setup();try{
  const accepted=claim(s,s.project.id,'Fixed observation'),measured=run(s),rows=[
   report(s,s.project.id,'First report',accepted.id,[measured.id]),
   report(s,s.project.id,'Second report',accepted.id),
   report(s,s.project.id,'Third report',accepted.id)
  ];
  const other=s.app.projects.create(USER,{name:'Other'}),foreign=report(s,other.id,'Foreign report',claim(s,other.id,'Other observation').id);
  const legacy=report(s,s.project.id,'Legacy report',accepted.id),legacyData={...legacy.row};delete legacyData.title;delete legacyData.formatVersion;
  s.app.store.db.prepare('UPDATE records SET data=? WHERE kind=? AND id=?').run(JSON.stringify(legacyData),'report',legacy.row.id);
  const before=counts(s),first=list(s,{cursor:0,limit:1}),firstItem=first.items[0];
  assert.deepEqual(Object.keys(first).sort(),['cursor','hasMore','items']);assert.equal(first.items.length,1);assert.equal(first.hasMore,true);
  assert.deepEqual(Object.keys(firstItem).sort(),['artifactId','claimCount','createdAt','formatVersion','id','projectId','runCount','title','updatedAt'].sort());
  assert.equal(firstItem.id,rows[0].row.id);assert.equal(firstItem.projectId,s.project.id);assert.equal(firstItem.runCount,1);assert.equal(firstItem.claimCount,1);assert.equal(firstItem.formatVersion,1);
  assert.equal('bindings' in firstItem,false);assert.equal('body' in firstItem,false);assert.equal('path' in firstItem,false);assert.equal('validity' in firstItem,false);
  assert.equal(first.cursor,Number(s.app.store.db.prepare("SELECT rowid FROM records WHERE kind='report' AND id=?").get(firstItem.id).rowid));assert.deepEqual(counts(s),before);
  const original=s.app.store.get('report',firstItem.id),rowid=first.cursor;s.app.store.update('report',original.id,original.version,{references:structuredClone(original.references)});
  assert.equal(Number(s.app.store.db.prepare("SELECT rowid FROM records WHERE kind='report' AND id=?").get(original.id).rowid),rowid);
  const added=report(s,s.project.id,'Added report',accepted.id),second=list(s,{cursor:first.cursor,limit:2});
  assert.deepEqual(second.items.map(item=>item.id),rows.slice(1).map(item=>item.row.id));assert.equal(second.hasMore,true);assert.equal(second.items.length,2);
  const inspected=s.app.operations.execute(USER,'report_inspect',{reportId:second.items[0].id},{projectId:s.project.id});
  assert.equal(inspected.id,second.items[0].id);assert.equal(inspected.integrity,'verified');assert.equal(inspected.validity,'current');assert.equal(inspected.formatVersion,1);assert.ok(inspected.references.some(ref=>ref.type==='claim'));
  assert.ok(!list(s,{limit:100}).items.some(item=>item.id===foreign.row.id));assert.throws(()=>s.app.operations.execute(USER,'report_inspect',{reportId:foreign.row.id},{projectId:s.project.id}),{code:'SCOPE_DENIED'});
  assert.throws(()=>s.app.reports.list({type:'agent'},s.project.id),{code:'PERMISSION_DENIED'});
  const beforeInvalid=counts(s);
  for(const invalid of [{limit:0},{limit:101},{limit:1.5},{limit:null},{cursor:-1},{cursor:1.5},{cursor:Number.MAX_SAFE_INTEGER+1},{projectId:other.id}])
   assert.throws(()=>list(s,invalid),{code:'INVALID_INPUT'});
  assert.deepEqual(counts(s),beforeInvalid);
  const end=list(s,{cursor:second.cursor,limit:2});assert.deepEqual(end.items.map(item=>item.id),[legacy.row.id,added.row.id]);assert.equal(end.hasMore,false);
  const defaults=list(s);assert.equal(defaults.items.length,5);assert.equal(defaults.hasMore,false);assert.deepEqual(defaults.items.map(item=>item.id),[...rows.map(item=>item.row.id),legacy.row.id,added.row.id]);
  const oldTitle=s.app.store.get('artifact',legacy.row.artifactId,s.project.id).title;assert.equal(end.items[0].title,oldTitle);assert.equal(end.items[0].formatVersion,0);assert.equal('validity' in end.items[0],false);
  const oldInspection=s.app.operations.execute(USER,'report_inspect',{reportId:legacy.row.id},{projectId:s.project.id});assert.equal(oldInspection.title,oldTitle);assert.equal(oldInspection.formatVersion,0);assert.equal(oldInspection.validity,'legacy');
  const queryPlan=s.app.store.db.prepare('EXPLAIN QUERY PLAN SELECT rowid,data FROM records WHERE kind=? AND project_id=? AND rowid>? ORDER BY rowid LIMIT ?').all('report',s.project.id,first.cursor,3);
  assert.match(queryPlan.map(row=>row.detail).join(' '),/records_project/);
  const reportRows=[...rows.map(item=>item.row),legacy.row,added.row],artifactBytes=new Map(reportRows.map(item=>[item.artifactId,digest(s.app.evidence.read(USER,item.artifactId).bytes)])),runBefore=structuredClone(measured),runBytes=new Map(measured.artifactIds.map(id=>[id,digest(s.app.evidence.read(USER,id).bytes)]));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
  const resumed=list(s,{cursor:first.cursor,limit:2});assert.deepEqual(resumed.items,second.items);
  assert.deepEqual(s.app.store.get('run',measured.id),runBefore);
  for(const [id,hash] of artifactBytes)assert.equal(digest(s.app.evidence.read(USER,id).bytes),hash);
  for(const [id,hash] of runBytes)assert.equal(digest(s.app.evidence.read(USER,id).bytes),hash);
  assert.deepEqual(list(s,{cursor:second.cursor,limit:2}),end);
 }finally{s.close();}
});
