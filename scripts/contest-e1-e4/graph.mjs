import assert from 'node:assert/strict';
const spec=(key,extra={})=>({key,role:'analyst',objective:'Machine-learning workflow engineering fixture; no measured ML results',dependencies:[],...extra});
const review=(key,target,extra={})=>spec(key,{role:'reviewer',reviewOf:target,...extra});

// A deliberately weaker comparator: only task dependencies and reviewOf edges.
export function taskOnlyDAG(tasks){
 const done=new Set();
 while(true){const n=done.size;for(const t of tasks)if([...t.dependencies,...(t.reviewOf?[t.reviewOf]:[])].every(k=>done.has(k)))done.add(t.key);if(n===done.size)return done.size===tasks.length;}
}

// Independent operational semantics: no DFS and no event-graph construction.
export function semanticOracle(tasks){
 const keys=new Set(tasks.map(t=>t.key));
 if(tasks.some(t=>[...t.dependencies,...(t.reviewOf?[t.reviewOf]:[])].some(k=>!keys.has(k))))return {label:'unknown_dependency',complete:false,submitted:[],accepted:[]};
 const submitted=new Set(),accepted=new Set(),rounds=[];
 while(true){
  const before=submitted.size+accepted.size,events=[];
  for(const t of tasks)if(!submitted.has(t.key)&&t.dependencies.every(k=>accepted.has(k))&&(!t.reviewOf||submitted.has(t.reviewOf))){submitted.add(t.key);events.push('submitted:'+t.key);}
  for(const t of tasks)if(!accepted.has(t.key)&&submitted.has(t.key)&&tasks.filter(r=>r.reviewOf===t.key).every(r=>accepted.has(r.key))){accepted.add(t.key);events.push('accepted:'+t.key);}
  if(events.length)rounds.push(events);
  if(submitted.size+accepted.size===before)break;
 }
 const complete=accepted.size===tasks.length;
 return {label:complete?'legal':taskOnlyDAG(tasks)?'review_deadlock':'ordinary_cycle',complete,submitted:[...submitted],accepted:[...accepted],rounds};
}

function random(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
export function legalGraph(size,seed){
 const rng=random(seed),tasks=[spec('data'),spec('train',{dependencies:['data']}),review('review_train','train')];
 for(let i=3;i<size;i++){const earlier=tasks.filter(t=>t.role!=='reviewer');tasks.push(spec('stage_'+i,{role:i===size-1?'writer':'analyst',dependencies:earlier.filter(()=>rng()<.35).map(t=>t.key)}));}
 return tasks;
}
export function cases(){
 const result=[
  {id:'hand-ml-legal',expected:'legal',tasks:[spec('data'),spec('train',{dependencies:['data']}),spec('validation',{dependencies:['train']}),review('review_validation','validation'),spec('report',{role:'writer',dependencies:['validation']})]},
  {id:'hand-multiple-reviewers',expected:'legal',tasks:[spec('train'),review('r1','train'),review('r2','train'),spec('report',{dependencies:['train']})]},
  {id:'hand-ordinary-cycle',expected:'ordinary_cycle',tasks:[spec('train',{dependencies:['validation']}),spec('validation',{dependencies:['train']})]},
  {id:'hand-review-hidden-cycle',expected:'review_deadlock',tasks:[spec('train'),spec('validation',{dependencies:['train']}),review('review_train','train',{dependencies:['validation']})]},
  {id:'hand-unknown-dependency',expected:'unknown_dependency',tasks:[spec('train',{dependencies:['unavailable_data']})]}
 ];
 for(let seed=1;seed<=80;seed++){
  const size=4+seed%21,tasks=legalGraph(size,seed);result.push({id:`seed-${seed}-legal`,seed,expected:'legal',tasks});
  const hidden=structuredClone(tasks);hidden.find(t=>t.key==='review_train').dependencies=[hidden.at(-1).key];hidden.at(-1).dependencies=['train'];result.push({id:`seed-${seed}-hidden`,seed,expected:'review_deadlock',tasks:hidden});
  const cycle=structuredClone(tasks);cycle[0].dependencies=['train'];result.push({id:`seed-${seed}-cycle`,seed,expected:'ordinary_cycle',tasks:cycle});
  const unknown=structuredClone(tasks);unknown.at(-1).dependencies.push('missing_seed_'+seed);result.push({id:`seed-${seed}-unknown`,seed,expected:'unknown_dependency',tasks:unknown});
 }
 return result;
}

export function graphExperiment(validateGraph){
 const rows=cases().map(c=>{
  const oracle=semanticOracle(c.tasks);assert.equal(oracle.label,c.expected,c.id);
  let actual;try{const output=validateGraph(c.tasks);actual={accepted:true,output};}catch(e){actual={accepted:false,code:e.code??null,message:e.message};}
  return {...c,oracle,baseline:{accepted:taskOnlyDAG(c.tasks)},actual};
 });
 const confusion=Object.fromEntries(['production','task_only_baseline'].map(name=>{
  const stats={trueLegal:0,falseRejectLegal:0,trueRejectInvalid:0,falseAcceptInvalid:0,reviewDeadlocks:0,missedReviewDeadlocks:0};
  for(const row of rows){const accepted=name==='production'?row.actual.accepted:row.baseline.accepted,legal=row.expected==='legal';stats[legal?(accepted?'trueLegal':'falseRejectLegal'):(accepted?'falseAcceptInvalid':'trueRejectInvalid')]++;if(row.expected==='review_deadlock'){stats.reviewDeadlocks++;if(accepted)stats.missedReviewDeadlocks++;}}
  return [name,stats];
 }));
 return {experiment:'E1',passed:confusion.production.falseRejectLegal===0&&confusion.production.falseAcceptInvalid===0,oracle:'Monotone submitted/accepted fixed-point simulation; all submissions and reviews assumed successful',seedRange:[1,80],caseCount:rows.length,confusion,rows};
}

export function percentile(values,p){const sorted=[...values].sort((a,b)=>a-b);if(p===.5){const mid=sorted.length/2;return Number.isInteger(mid)?(sorted[mid-1]+sorted[mid])/2:sorted[Math.floor(mid)];}return sorted[Math.ceil(sorted.length*p)-1];}
export function benchmark(validateGraph){
 const rows=[];
 for(const size of [4,8,16,24]){
  const graphs=Array.from({length:32},(_,i)=>legalGraph(size,20261025+i));
  for(const tasks of graphs){assert.equal(semanticOracle(tasks).label,'legal');validateGraph(tasks);}
  const implementations={production:validateGraph,task_only_baseline:taskOnlyDAG};
  for(const fn of Object.values(implementations))for(let i=0;i<1024;i++)fn(graphs[i%graphs.length]);
  const samples={production:[],task_only_baseline:[]};
  for(let batch=0;batch<30;batch++)for(const name of batch%2?['task_only_baseline','production']:['production','task_only_baseline']){
   const fn=implementations[name],start=process.hrtime.bigint();for(let i=0;i<1024;i++)fn(graphs[i%graphs.length]);const elapsedNs=Number(process.hrtime.bigint()-start);
   samples[name].push({batch,iterations:1024,elapsedNs,nsPerCall:elapsedNs/1024});
  }
  for(const [implementation,batches] of Object.entries(samples)){const values=batches.map(b=>b.nsPerCall);rows.push({size,implementation,graphs,seedRange:[20261025,20261056],warmupCalls:1024,batches,medianNsPerCall:percentile(values,.5),p95NsPerCall:percentile(values,.95)});}
 }
 return {experiment:'E3',clock:'process.hrtime.bigint',scope:'Synchronous graph validation only; 30 batches of 1024 calls. Baseline omits production schema validation and event checks, so timing ratios do not establish equivalent-work or overall scheduler acceleration.',rows};
}
