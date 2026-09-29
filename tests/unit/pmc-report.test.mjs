import test from 'node:test';
import assert from 'node:assert/strict';
import {chmodSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {pmcDocument,pmcContent} from '../support/pmc-corpus.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

function prepared(){
 const s=setup(),pid=s.project.id,d=pmcDocument(s);
 const corpus=s.app.textEvidence.configure(USER,pid,{enabled:true,pmcDocuments:[{documentVersionId:d.id}],expectedVersion:0});
 const search=s.app.textEvidence.search(USER,pid,{query:'adsorption',pmcDocuments:[{documentVersionId:d.id}],corpusId:corpus.corpusId,configurationVersion:corpus.version},'pmc-report-search');
 const e=s.app.store.get('evidence',search.hits[0].evidenceId,pid),proposed=s.app.evidence.proposeClaim(USER,pid,'Synthetic fixture claim',[e.id]);
 const claim=s.app.evidence.decideClaim(USER,proposed.id,proposed.version,'accepted');
 const a=s.app.reports.create(USER,pid,{title:'Fixed PMC report',claimIds:[claim.id]});
 const report=s.app.store.list('report',pid).find(r=>r.artifactId===a.id);
 return {...s,pid,d,corpus,search,e,claim,report};
}
const update=(s,kind,id,patch)=>s.app.store.update(kind,id,s.app.store.get(kind,id).version,patch);
const exportsFor=s=>s.app.store.list('artifact',s.pid).filter(a=>a.origin==='report-export');

test('bound PMC claim freezes source, quote and full document row; real tar preserves both bytes offline',async()=>{
 const fetch=globalThis.fetch;globalThis.fetch=()=>{throw Error('Network forbidden');};let s;
 try{
  s=prepared();const inspected=s.app.reports.inspect(USER,s.pid,s.report.id);validateSchema(OUTPUT_SCHEMAS.report_inspect,inspected,'output');
  assert.equal(inspected.integrity,'verified');assert.equal(inspected.validity,'current');
  const ref=inspected.references.find(r=>r.providerText),read=s.app.reports.readReference(USER,s.pid,s.report.id,ref.id);
  validateSchema(OUTPUT_SCHEMAS.report_reference_read,read,'output');
  assert.equal(ref.document,undefined);assert.equal(ref.providerText.reportedVersion,'PMC12345.1');assert.equal(ref.providerText.rawArtifactId,s.d.original.artifactId);assert.equal(ref.providerText.textArtifactId,s.d.derivedText.artifactId);
  const frozen=JSON.parse(read.content),binding=s.report.bindings.providerTexts[0];
  assert.equal(frozen.quote,pmcContent.slice(ref.providerText.start,ref.providerText.end));assert.equal(frozen.locatorUnit,'UTF-16 code units');assert.equal(frozen.pageMapping,'unavailable');assert.equal(frozen.provenance[0].document.license.value,'CC BY 4.0');
  assert.deepEqual(binding.document,s.d);assert.equal(digest(binding.document),binding.documentDigest);assert.equal(s.report.bindings.artifacts.length,2);
  const raw=s.app.evidence.read(USER,s.d.original.artifactId).bytes,derived=s.app.evidence.read(USER,s.d.derivedText.artifactId).bytes;
  const archive=await s.app.exports.create(USER,s.pid,{reportId:s.report.id},'pmc-package'),target=join(s.dir,'unpacked');mkdirSync(target);
  execFileSync(process.platform==='win32'?'C:/WINDOWS/system32/tar.exe':'tar',['-xf',s.app.store.paths.physical(archive.path),'-C',target],{windowsHide:true,shell:false});
  const manifest=JSON.parse(readFileSync(join(target,'manifest.json'),'utf8'));
  assert.deepEqual(readFileSync(join(target,'artifacts',s.d.original.digest)),raw);assert.deepEqual(readFileSync(join(target,'artifacts',s.d.derivedText.digest)),derived);
  assert.deepEqual(manifest.bindings.providerTexts,s.report.bindings.providerTexts);assert.equal(manifest.report.references.find(r=>r.providerText).providerText.reportedVersion,'PMC12345.1');
  for(const file of manifest.files){const bytes=readFileSync(join(target,file.path));assert.equal(bytes.length,file.size);assert.equal(digest(bytes),file.digest);}
  assert.match(readFileSync(join(target,'README.md'),'utf8'),/local export does not grant redistribution permission/);
  for(const kind of ['connector-call','model-usage','sandbox-job','run'])assert.equal(s.app.store.list(kind).length,0);
 }finally{s?.close();globalThis.fetch=fetch;}
});

test('PMC mutations reject new reports and packages without publishing and retain frozen history',async()=>{
 for(const change of ['raw','text','document','version','quote','locator','binding','claim']){
  const s=prepared();try{
   const before=s.app.evidence.read(USER,s.report.artifactId).bytes,ref=s.report.references.find(r=>r.providerText),history=s.app.reports.readReference(USER,s.pid,s.report.id,ref.id).content;
   if(change==='raw'||change==='text'){
    const a=s.app.store.get('artifact',change==='raw'?s.d.original.artifactId:s.d.derivedText.artifactId),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'corrupted');
   }else if(change==='document')update(s,'document-version',s.d.id,{license:{value:'forged',assurance:'provider-reported'}});
   else if(change==='version')update(s,'document-version',s.d.id,{source:{...s.d.source,reportedVersion:'PMC12345.2',resolvedId:'PMC12345.2'}});
   else if(change==='quote')update(s,'evidence',s.e.id,{quote:'forged'});
   else if(change==='locator')update(s,'evidence',s.e.id,{locator:{start:s.e.locator.start+0.1,end:s.e.locator.end}});
   else if(change==='binding')update(s,'evidence',s.e.id,{providerText:null});
   else update(s,'claim',s.claim.id,{status:'rejected'});
   assert.equal(s.app.reports.inspect(USER,s.pid,s.report.id).validity,'stale',change);
   assert.throws(()=>s.app.reports.create(USER,s.pid,{claimIds:[s.claim.id]}),undefined,change);
   await assert.rejects(s.app.exports.create(USER,s.pid,{reportId:s.report.id},change));
   assert.equal(exportsFor(s).length,0);assert.equal(s.app.store.list('report-export',s.pid).length,0);assert.equal(s.app.store.list('report',s.pid).length,1);
   assert.deepEqual(s.app.evidence.read(USER,s.report.artifactId).bytes,before);assert.equal(s.app.reports.readReference(USER,s.pid,s.report.id,ref.id).content,history);
  }finally{s.close();}
 }
});

test('PMC ownership and exact frozen evidence identity reject cross-project and valid replacement references',async()=>{
 const s=prepared();try{
  const other=s.app.projects.create(USER,{name:'Other'});
  assert.throws(()=>s.app.reports.create(USER,other.id,{claimIds:[s.claim.id]}));
  assert.throws(()=>s.app.reports.create({...USER,sessionId:s.session.id},s.pid,{claimIds:[s.claim.id]}),{code:'PMC_OWNER_ONLY'});
  await assert.rejects(s.app.exports.create(USER,other.id,{reportId:s.report.id},'foreign'));
  update(s,'evidence',s.e.id,{locator:{start:0,end:1},quote:pmcContent.slice(0,1)});
  assert.doesNotThrow(()=>s.app.evidence.verify(s.pid,s.e.id));
  assert.equal(s.app.reports.inspect(USER,s.pid,s.report.id).integrity,'invalid');
  await assert.rejects(s.app.exports.create(USER,s.pid,{reportId:s.report.id},'replaced'));
  assert.equal(exportsFor(s).length,0);assert.equal(s.app.store.list('report-export').length,0);
 }finally{s.close();}
});

test('disabling corpus and reopening retain fixed PMC report, package and search identity',async()=>{
 const s=prepared();let reopened;try{
  const artifact=await s.app.exports.create(USER,s.pid,{reportId:s.report.id},'before-disable'),bytes=s.app.evidence.read(USER,artifact.id).bytes;
  const ref=s.report.references.find(r=>r.providerText),history=s.app.reports.readReference(USER,s.pid,s.report.id,ref.id).content;
  s.app.textEvidence.configure(USER,s.pid,{enabled:false,expectedVersion:s.corpus.version});
  reopened=new ResearchApp(s.dir,process.cwd());
  assert.equal(reopened.textEvidence.status(USER,s.pid).enabled,false);assert.deepEqual(reopened.store.get('text-evidence-search',s.search.id),s.search);
  assert.equal(reopened.reports.inspect(USER,s.pid,s.report.id).validity,'current');assert.equal(reopened.reports.readReference(USER,s.pid,s.report.id,ref.id).content,history);
  assert.deepEqual(reopened.evidence.read(USER,artifact.id).bytes,bytes);
  assert.equal((await reopened.exports.create(USER,s.pid,{reportId:s.report.id},'before-disable')).id,artifact.id);
  assert.ok((await reopened.exports.create(USER,s.pid,{reportId:s.report.id},'after-disable')).id);
  assert.equal(reopened.reports.readReference(USER,s.pid,s.report.id,ref.id).reference.providerText.documentVersionId,s.d.id);
 }finally{reopened?.close();s.close();}
});
