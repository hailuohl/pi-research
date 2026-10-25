import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve,join,relative,isAbsolute,sep} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseArgs} from 'node:util';
import {cpus,release,totalmem,availableParallelism} from 'node:os';
import {graphExperiment,benchmark} from './graph.mjs';
import {serviceExperiments} from './service.mjs';
const {values}=parseArgs({options:{root:{type:'string'},out:{type:'string'},phase:{type:'string',default:'all'}}});
assert.ok(values.root&&values.out,'Usage: node scripts/contest-e1-e4/run.mjs --root <frozen-runtime-root> --out <new-output-dir> [--phase graph|service|benchmark|all]');
assert.ok(['all','graph','service','benchmark'].includes(values.phase),'Invalid --phase');
const root=resolve(values.root),out=resolve(values.out);
assert.ok(existsSync(join(root,'dist/packages/collaboration/graph.js')),'Build the isolated runtime first');
const rootFromOut=relative(out,root);
assert.ok(rootFromOut==='..'||rootFromOut.startsWith('..'+sep)||isAbsolute(rootFromOut),'Output must not contain runtime root');
assert.ok(!existsSync(out),'Refusing to overwrite an existing evidence directory; use a new phase subdirectory');
mkdirSync(out,{recursive:true});
process.chdir(root);
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const json=(name,value)=>writeFileSync(join(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
let gitHead=null;try{gitHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
const scriptDir=fileURLToPath(new URL('.',import.meta.url));
const manifest={formatVersion:1,startedAt:new Date().toISOString(),root,out,phase:values.phase,node:process.version,platform:process.platform,arch:process.arch,hardware:{osRelease:release(),cpuModel:cpus()[0]?.model??null,logicalCpus:cpus().length,availableParallelism:availableParallelism(),totalMemoryBytes:totalmem()},gitHead,status:'running',inputHashes:Object.fromEntries(['dist/packages/collaboration/graph.js','dist/packages/collaboration/team-service.js','dist/packages/evidence/service.js','dist/packages/text-evidence/service.js','dist/packages/publications/reports.js','tests/support/research.mjs'].map(p=>[p,hash(join(root,p))])),runnerHashes:Object.fromEntries(['run.mjs','graph.mjs','service.mjs','selftest.mjs'].map(p=>[p,hash(join(scriptDir,p))])),limitations:['No LLM invocation or empirical ML measurement.','No browser, Docker, Pi model or PDF parser execution.','E3 graph-validator timing does not establish overall scheduler acceleration.']};
json('manifest.started.json',manifest);
try{
 const {validateGraph}=await import(pathToFileURL(join(root,'dist/packages/collaboration/graph.js')).href);
 if(['all','graph'].includes(values.phase)){const graph=graphExperiment(validateGraph);json('E1-graph.json',graph);assert.ok(graph.passed,'Graph experiment failed; inspect E1-graph.json');}
 if(['all','service'].includes(values.phase)){
  const helpers=await import(pathToFileURL(join(root,'tests/support/research.mjs')).href),{ResearchApp}=await import(pathToFileURL(join(root,'dist/packages/research-app.js')).href);
  const service=serviceExperiments({...helpers,ResearchApp});json('E2-E4-service.json',service);assert.ok(service.passed,'Service experiment failed; inspect E2-E4-service.json');
 }
 if(['all','benchmark'].includes(values.phase))json('E3-benchmark.json',benchmark(validateGraph));
 json('manifest.json',{...manifest,status:'passed',finishedAt:new Date().toISOString()});
 console.log(JSON.stringify({status:'passed',out,phase:values.phase}));
}catch(e){json('manifest.json',{...manifest,status:'failed',finishedAt:new Date().toISOString(),error:{code:e.code??null,message:e.message,stack:e.stack}});console.error(e);process.exitCode=1;}
