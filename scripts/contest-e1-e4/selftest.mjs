import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {semanticOracle, taskOnlyDAG, cases, percentile,graphExperiment} from './graph.mjs';
const task=(key,extra={})=>({key,role:'analyst',objective:'Engineering fixture',dependencies:[],...extra});
const a=task('a'), b=task('b',{dependencies:['a']}), r=task('r',{role:'reviewer',reviewOf:'a',dependencies:['b']});
assert.equal(semanticOracle([a]).label,'legal');
assert.equal(semanticOracle([a,b,r]).label,'review_deadlock');
assert.equal(taskOnlyDAG([a,b,r]),true);
assert.equal(semanticOracle([task('a',{dependencies:['b']}),b]).label,'ordinary_cycle');
assert.equal(semanticOracle([task('a',{dependencies:['missing']})]).label,'unknown_dependency');
assert.equal(semanticOracle([a,task('r',{role:'reviewer',reviewOf:'a'})]).label,'legal');
assert.equal(percentile([1,2,3,4],.5),2.5);
assert.equal(percentile([1,2,3,4],.95),4);
const generated=cases();
assert.ok(generated.length>=200);
assert.deepEqual(cases(),generated);
for(const c of generated)assert.equal(semanticOracle(c.tasks).label,c.expected,c.id);
assert.deepEqual(new Set(generated.map(c=>c.expected)),new Set(['legal','ordinary_cycle','review_deadlock','unknown_dependency']));
assert.equal(graphExperiment(tasks=>tasks).passed,false,'an accept-everything validator must fail E1');
const temporary=mkdtempSync(join(realpathSync.native(tmpdir()),'contest-runner-negative-'));
try{
 const root=join(temporary,'runtime'),out=join(temporary,'output');
 for(const path of ['dist/packages/collaboration/graph.js','dist/packages/collaboration/team-service.js','dist/packages/evidence/service.js','dist/packages/text-evidence/service.js','dist/packages/publications/reports.js','tests/support/research.mjs']){
  const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,path.endsWith('/graph.js')?'export const validateGraph=tasks=>tasks;':'// Isolated negative-test placeholder; never executed.');
 }
 writeFileSync(join(root,'package.json'),JSON.stringify({type:'module'}));
 const child=spawnSync(process.execPath,[fileURLToPath(new URL('./run.mjs',import.meta.url)),'--root',root,'--out',out,'--phase','graph'],{encoding:'utf8'});
 assert.equal(child.status,1,child.stderr||String(child.error));
 const graph=JSON.parse(readFileSync(join(out,'E1-graph.json'),'utf8')),manifest=JSON.parse(readFileSync(join(out,'manifest.json'),'utf8'));
 assert.equal(graph.passed,false);assert.equal(graph.confusion.production.falseAcceptInvalid,243);assert.equal(manifest.status,'failed');assert.match(manifest.error.message,/Graph experiment failed/);
}finally{rmSync(temporary,{recursive:true,force:true});}
console.log(JSON.stringify({status:'passed',checks:'semantic oracle known counterexamples, fixed-seed cases, percentile; accept-everything validator fails E1 and runner exits 1 with failed manifest',cases:generated.length}));
