/** Paired deterministic context-packaging evaluation. No model calls, no scientific accuracy claim.
 * Inspired by Aviary's environment/reset/step/observation organization; no Aviary code imported.
 * Usage: node scripts/compare-variants.mjs <fixed-release-dir> <enhanced-release-dir>
 */
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const [baseArg,enhancedArg]=process.argv.slice(2);
if(!baseArg||!enhancedArg)throw Error('Pass fixed and enhanced release directories; use separate data copies.');
const fixture=JSON.parse(readFileSync(new URL('../tests/research-evals/text-evidence-fixture.json',import.meta.url),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const USER={type:'user'};
class EvidenceEnvironment {
 async reset(root){
  this.root=resolve(root);this.dir=mkdtempSync(join(tmpdir(),'pi-ab-'));
  const {ResearchApp}=await import(pathToFileURL(join(this.root,'dist/packages/research-app.js')));
  this.app=new ResearchApp(this.dir,this.root);this.project=this.app.projects.create(USER,{name:'Paired evidence fixture'});
  this.sources=fixture.documents.map(d=>({...d,artifact:this.app.evidence.put(this.project.id,d.name,Buffer.from(d.text),'text/plain','user')}));
  this.trace=[];return this.sources.map(s=>({name:s.name,digest:s.artifact.digest}));
 }
 step(action){
  this.trace.push(action.kind);
  if(action.kind==='read-all')return this.sources.map(s=>({title:s.name,quote:this.app.evidence.read(USER,s.artifact.id).bytes.toString('utf8')}));
  if(action.kind==='enable')return this.app.textEvidence?.configure(USER,this.project.id,{enabled:true,artifactIds:this.sources.map(s=>s.artifact.id),expectedVersion:0})??null;
  if(action.kind==='retrieve')return this.app.textEvidence?.search(USER,this.project.id,{query:action.query,artifactIds:this.sources.map(s=>s.artifact.id),limit:3,mmrLambda:action.lambda,deduplicateExact:action.deduplicateExact??true})??null;
  throw Error('Unsupported evaluation action');
 }
 close(){this.app?.close();rmSync(this.dir,{recursive:true,force:true});}
}
function assess(hits,question,sources){
 const text=hits.map(h=>h.quote).join('\n');
 const groups=[...new Set(hits.map(h=>sources.find(s=>s.name===h.title)?.group).filter(Boolean))];
 return {returnedCharacters:hits.reduce((n,h)=>n+h.quote.length,0),returnedSnippets:hits.length,groups,
  expectedGroupsPresent:question.expectedGroups.filter(g=>groups.includes(g)).length,expectedGroupsTotal:question.expectedGroups.length,
  literalTargetsPresent:question.targets.filter(t=>text.includes(t)).length,literalTargetsTotal:question.targets.length,
  exactSourceQuotes:hits.every(h=>{const s=sources.find(s=>s.name===h.title);return s && (!h.locator ? h.quote===s.text : s.text.slice(h.locator.start,h.locator.end)===h.quote);})};
}
const report={schemaVersion:1,fixtureDigest:hash(JSON.stringify(fixture)),disclosure:fixture.disclosure,
 comparisonKind:'Same supplied text, raw full-file context versus optional lexical/MMR context packaging; not model QA or scientific accuracy.',
 variants:[],limitations:['Small authored fixture; not held-out or external benchmark.','Baseline keeps all text and therefore maximal source coverage; reduced payload can lose useful context.','No LLM, PDF parsing, dense embeddings, answer generation, material models or billed provider calls. Reported characters count quotations only; metadata may make small-corpus JSON larger.','MMR ablation holds corpus/scorer/limit fixed and changes only relevance weight.']};
for(const [label,root] of [['fixed',baseArg],['enhanced',enhancedArg]]){
 const env=new EvidenceEnvironment();
 try {
  const sources=await env.reset(root),version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
  const raw=env.step({kind:'read-all'}),available=!!env.app.textEvidence;
  if(available)env.step({kind:'enable'});
  const cases=fixture.questions.map(q=>{
   const baselineContext=assess(raw,q,env.sources);
   if(!available)return {id:q.id,query:q.query,rawContext:baselineContext,retrieval:'not available; raw reading remains usable'};
   const top=env.step({kind:'retrieve',query:q.query,lambda:1,deduplicateExact:false}),mmrOnly=env.step({kind:'retrieve',query:q.query,lambda:.65,deduplicateExact:false}),grouped=env.step({kind:'retrieve',query:q.query,lambda:1}),mmr=env.step({kind:'retrieve',query:q.query,lambda:.65});
   return {id:q.id,query:q.query,note:q.note??null,rawContext:{...baselineContext,serializedResponseBytes:Buffer.byteLength(JSON.stringify(raw))},
    topK:{status:top.status,...assess(top.hits,q,env.sources),coverage:top.coverage,serializedResponseBytes:Buffer.byteLength(JSON.stringify(top))},
    mmrWithoutGrouping:{status:mmrOnly.status,...assess(mmrOnly.hits,q,env.sources)},
    groupedDefault:{status:grouped.status,...assess(grouped.hits,q,env.sources),coverage:grouped.coverage,serializedResponseBytes:Buffer.byteLength(JSON.stringify(grouped))},
    mmr:{status:mmr.status,...assess(mmr.hits,q,env.sources),coverage:mmr.coverage},
    evidenceVerified:mmr.hits.every(h=>env.app.evidence.verify(env.project.id,h.evidenceId).quote===h.quote)};
  });
  report.variants.push({label,version,sourceDigests:sources,networkCalls:0,modelUsageRecords:env.app.store.list('model-usage').length,
   runsCreated:env.app.store.list('run').length,claimsCreated:env.app.store.list('claim').length,cases});
 } finally {env.close();}
}
report.sameInputBytes=JSON.stringify(report.variants[0].sourceDigests)===JSON.stringify(report.variants[1].sourceDigests);
console.log(JSON.stringify(report,null,2));
