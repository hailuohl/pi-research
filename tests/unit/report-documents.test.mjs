import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,chmodSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {setup,USER,approve} from '../support/research.mjs';
import {parserProfile} from '../../dist/packages/documents/parse-service.js';
import {digest} from '../../dist/packages/storage/store.js';
import {ExportService} from '../../dist/packages/publications/export.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2qkAAAAASUVORK5CYII=','base64');
function prepared(raw=Buffer.from('%PDF-1.7\nUNIT fixture, not a scientific paper')) {
 const s=setup(),pid=s.project.id;
 const document=s.app.documents.import(USER,pid,{title:'中文固定原件.pdf',mediaType:'application/pdf',contentBase64:raw.toString('base64')},'document');
 const profile=parserProfile(process.cwd()),imageId='sha256:'+'a'.repeat(64);
 s.app.store.create('document-parser-settings',null,{...profile,dockerContext:'default',imageDigest:imageId,imageId},'global');
 const prepared=s.app.documentParsing.prepare(USER,pid,{documentVersionId:document.id});approve(s.app,prepared.approvalId);
 const old=s.app.store.get('document-parse-job',prepared.id),job=s.app.store.update('document-parse-job',old.id,old.version,{imageId}),outputDir=s.app.store.paths.physical(old.outputDir);
 const quality={readingOrder:'unverified',paragraphs:'heuristic',tables:'unknown',figures:'unknown',ocr:false,score:null};
 const pages=['中😀 引用文字，保留UTF-16区间。','未引用页，不能自动加入包。'].map((content,index)=>{
  const prefix=`page-000${index+1}`,bytes=Buffer.from(content),page={pageNumber:index+1,pageLabel:index===0?'i':'ii',width:400,height:200,imageWidth:1,imageHeight:1,textFile:prefix+'.txt',textDigest:digest(bytes),textBytes:bytes.length,imageFile:prefix+'.png',imageDigest:digest(png),imageBytes:png.length,paragraphs:[{index:1,start:0,end:content.length}],textStatus:'text-extracted'};
  writeFileSync(join(outputDir,page.textFile),bytes);writeFileSync(join(outputDir,page.imageFile),png);return page;
 });
 writeFileSync(join(outputDir,'manifest.json'),JSON.stringify({formatVersion:1,profileId:profile.profileId,rawDigest:document.original.digest,pageCount:2,quality,pages}));
 const done=s.app.documentParsing.finalize(job.id,{state:'succeeded',exitCode:0});assert.equal(done.integrity,'complete');
 const result=s.app.documentParsing.result(USER,pid,done.resultId);
 const evidence=[0,4].map(start=>s.app.evidence.registerDocument(USER,pid,{documentVersionId:document.id,parseResultId:result.id,pageNumber:1,start,end:start+1,description:`UNIT 中文页段 ${start}`}));
 const claim=s.app.evidence.proposeClaim(USER,pid,'单元测试结论，不代表科研结果',evidence.map(e=>e.id));s.app.evidence.decideClaim(USER,claim.id,claim.version,'accepted');
 const artifact=s.app.reports.create(USER,pid,{title:'固定PDF页段',claimIds:[claim.id]});
 const report=s.app.store.list('report',pid).find(r=>r.artifactId===artifact.id);
 return {...s,pid,document,result,job,evidence,claim,report,raw};
}

test('PDF report freezes page, source, license and parser provenance; real tar contains only required exact bytes',async()=>{
 const s=prepared();try{
  const inspected=s.app.reports.inspect(USER,s.pid,s.report.id);validateSchema(OUTPUT_SCHEMAS.report_inspect,inspected,'output');assert.equal(inspected.validity,'current');
  const refs=inspected.references.filter(r=>r.document);assert.equal(refs.length,2);assert.deepEqual(refs.map(r=>r.document.start),[0,4]);
  const ref=refs[0];assert.equal(ref.document.pageLabel,'i');assert.equal(ref.document.rawArtifactId,s.document.original.artifactId);
  const frozen=s.app.reports.readReference(USER,s.pid,s.report.id,ref.id);validateSchema(OUTPUT_SCHEMAS.report_reference_read,frozen,'output');
  const provenance=JSON.parse(frozen.content);assert.equal(provenance.locatorUnit,'UTF-16 code units');assert.equal(provenance.provenance[0].document.license.assurance,'unknown');assert.equal(provenance.provenance[0].result.versionAssurance,'unverified');assert.equal(provenance.provenance[0].result.quality.ocr,false);
  s.app.documents.import(USER,s.pid,{title:s.document.title,mediaType:'application/pdf',contentBase64:Buffer.from('%PDF-1.7\nnewer version').toString('base64')},'newer');
  const collection=s.app.reports.collectExport(USER,s.pid,s.report.id),bindings=collection.manifest.bindings;
  assert.equal(bindings.documents.length,1);assert.equal(bindings.documents[0].result.pages.length,1);assert.equal(bindings.artifacts.length,4);
  assert.ok(!bindings.artifacts.some(a=>a.id===s.result.pages[1].textArtifactId));
  assert.doesNotMatch(JSON.stringify(bindings),/snapshotPath|controlDir|outputDir|dockerContext/);
  const service=new ExportService(s.app.context,s.app.reports,s.app.evidence),bundle=await service.create(USER,s.pid,{reportId:s.report.id},'bundle');
  const target=join(s.dir,'unpacked');mkdirSync(target);execFileSync(process.platform==='win32'?'C:/WINDOWS/system32/tar.exe':'tar',['-xf',s.app.store.paths.physical(bundle.path),'-C',target],{windowsHide:true,shell:false});
  for(const file of collection.files)assert.deepEqual(readFileSync(join(target,file.path)),file.bytes);
  assert.deepEqual(readFileSync(join(target,'artifacts',s.document.original.digest)),s.raw);
  const manifest=JSON.parse(readFileSync(join(target,'manifest.json'),'utf8'));assert.equal(manifest.bindings.documents[0].document.source.requestedVersion,null);
  for(const f of manifest.files)assert.equal(digest(readFileSync(join(target,f.path))),f.digest);
  const other=s.app.projects.create(USER,{name:'other'});assert.throws(()=>s.app.reports.readReference(USER,other.id,s.report.id,ref.id));assert.throws(()=>s.app.reports.readReference(USER,s.pid,s.report.id,'unknown'));
 }finally{s.close();}
});

test('PDF tampering and revoked parse approval block new reports and export while retaining frozen historical text',()=>{
 for(const change of ['raw','text','image','manifest','document','pageLabel','quality','version','mediaType','evidence','approval','claim']) {
  const s=prepared();try{
   const before=s.app.evidence.read(USER,s.report.artifactId).bytes,ref=s.report.references.find(r=>r.document),frozen=s.app.reports.readReference(USER,s.pid,s.report.id,ref.id).content;
   const update=(kind,row,patch)=>s.app.store.update(kind,row.id,s.app.store.get(kind,row.id).version,patch);
   if(['raw','text','image','manifest'].includes(change)){
    const id={raw:s.document.original.artifactId,text:s.result.pages[0].textArtifactId,image:s.result.pages[0].imageArtifactId,manifest:s.result.manifestArtifactId}[change],a=s.app.store.get('artifact',id),path=s.app.store.paths.physical(a.path);chmodSync(path,0o600);writeFileSync(path,'corrupted');
   }else if(change==='document')update('document-version',s.document,{license:{value:'forged',assurance:'user-declared'}});
   else if(change==='pageLabel')update('document-parse-result',s.result,{pages:s.result.pages.map((p,i)=>i? p:{...p,pageLabel:'forged'})});
   else if(change==='quality')update('document-parse-result',s.result,{quality:{...s.result.quality,ocr:true}});
   else if(change==='version')update('document-parse-result',s.result,{versionAssurance:'marker-match',observedVersion:'9'});
   else if(change==='mediaType')update('artifact',{id:s.document.original.artifactId},{mediaType:'text/html'});
   else if(change==='evidence')update('evidence',s.evidence[0],{quote:'forged'});
   else if(change==='approval')s.app.approvals.stale(s.job.id);
   else update('claim',s.claim,{status:'rejected'});
   assert.equal(s.app.reports.inspect(USER,s.pid,s.report.id).validity,'stale',change);
   assert.throws(()=>s.app.reports.collectExport(USER,s.pid,s.report.id),undefined,change);
   assert.throws(()=>s.app.reports.create(USER,s.pid,{claimIds:[s.claim.id]}),undefined,change);
   assert.deepEqual(s.app.evidence.read(USER,s.report.artifactId).bytes,before);assert.equal(s.app.reports.readReference(USER,s.pid,s.report.id,ref.id).content,frozen);
   if(change==='approval')assert.doesNotThrow(()=>s.app.documentParsing.pages(USER,s.pid,s.result.id));
  }finally{s.close();}
 }
});

test('document entity changes fence in-flight exports and original PDF remains subject to 30 MiB package limit',()=>{
 for(const kind of ['document-version','document-parse-result','document-parse-job']){const s=prepared();try{
   const collection=s.app.reports.collectExport(USER,s.pid,s.report.id),row=s.app.store.list(kind,s.pid)[0];s.app.store.update(kind,row.id,row.version,{});
   assert.throws(()=>s.app.reports.assertExportCurrent(USER,s.pid,s.report.id,collection.manifest.bindingsDigest,collection.manifest.stateDigest),{code:'REPORT_EXPORT_STALE'});
 }finally{s.close();}}
 const large=Buffer.alloc(30*1024*1024,32);large.write('%PDF-1.7\n');const big=prepared(large);try{assert.throws(()=>big.app.reports.collectExport(USER,big.pid,big.report.id),{code:'EXPORT_TOO_LARGE'});}finally{big.close();}
});
