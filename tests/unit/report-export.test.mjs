import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, writeFileSync, chmodSync} from 'node:fs';
import {join} from 'node:path';
import {setup, USER, approve, fixtureFinish} from '../support/research.mjs';
import {ExportService} from '../../dist/packages/publications/export.js';
import {safeExportBytes} from '../../dist/packages/publications/reports.js';
import {digest} from '../../dist/packages/storage/store.js';
import {setSourceMode} from '../../dist/packages/workspace/files.js';
import {crc32,deflateSync} from 'node:zlib';
const tar=process.platform==='win32'?'C:/WINDOWS/system32/tar.exe':'tar';
const physical=(s,reference)=>s.app.store.paths.physical(reference);
function prepared(extraOutput,title='Unit report ../../ title stays text') {
 const s=setup(),e=s.app.experiments.get(USER,s.baseline.id);
 s.app.experiments.writeFile(USER,e.id,'helper.sh','#!/bin/sh\necho fixed\n',null,e.version);setSourceMode(physical(s,e.workspace),'helper.sh','100755');
 const intent=s.app.runs.prepare(USER,e.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
 if(extraOutput)extraOutput(s,run);
 fixtureFinish(s,run); // Explicit unit fixture: no process, Docker, or model execution.
 const artifact=s.app.reports.create(USER,s.project.id,{title,runIds:[run.id],claimIds:[]});
 const report=s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id),service=new ExportService(s.app.context,s.app.reports,s.app.evidence);
 return {...s,run,report,service};
}
const exportsFor=s=>s.app.store.list('artifact',s.project.id).filter(a=>a.origin==='report-export');
const pngChunk=(name,data)=>{const type=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data]))>>>0);return Buffer.concat([length,type,data,crc]);};
const pngWithIdat=(idat,metadata=false)=>{const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(8,0);ihdr.writeUInt32BE(1,4);ihdr[8]=8;ihdr[9]=2;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',ihdr),...(metadata?[pngChunk('tEXt',Buffer.from('Comment\0C:\\private\\report.pdf'))]:[]),pngChunk('IDAT',idat),pngChunk('IEND',Buffer.alloc(0))]);};
const pngWithPathLikePixels=(metadata)=>{const row=Buffer.alloc(25,32);row[0]=0;Buffer.from(' //host/share/file ').copy(row,1);return pngWithIdat(deflateSync(row,{level:0}),metadata);};
test('plain PNG pixel bytes do not trigger host-path false positives, while metadata and damaged PNGs keep the guard',async()=>{
 const plain=pngWithPathLikePixels(false);assert.ok(plain.includes(Buffer.from(' //host/share/file ')));
 const payload=Buffer.from(' C:\\private\\report.pdf '),row=Buffer.alloc(25,32),badFilter=Buffer.alloc(25,32),badLength=Buffer.alloc(26,32);row[0]=0;badFilter[0]=5;badLength[0]=0;payload.copy(badFilter,1);payload.copy(badLength,1);const stream=deflateSync(row,{level:0});
 const variants=[['plain',plain,null],['metadata',pngWithPathLikePixels(true),'EXPORT_HOST_PATH_DETECTED'],['trailing',Buffer.concat([plain,Buffer.from('x')]),'EXPORT_HOST_PATH_DETECTED'],['invalid-idat',pngWithIdat(payload),'EXPORT_HOST_PATH_DETECTED'],['extra-idat-payload',pngWithIdat(Buffer.concat([stream,payload])),'EXPORT_HOST_PATH_DETECTED'],['bad-filter',pngWithIdat(deflateSync(badFilter,{level:0})),'EXPORT_HOST_PATH_DETECTED'],['bad-row-length',pngWithIdat(deflateSync(badLength,{level:0})),'EXPORT_HOST_PATH_DETECTED']];
 const damaged=Buffer.from(plain),idatAt=damaged.indexOf(Buffer.from('IDAT'));damaged[idatAt+4]^=1;variants.push(['bad-crc',damaged,'EXPORT_HOST_PATH_DETECTED']);
 for(const [label,bytes,code] of variants){const s=prepared((s,r)=>writeFileSync(join(physical(s,r.outputDir),'page.png'),bytes));try{if(code){await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},label),{code});assert.equal(exportsFor(s).length,0);}else{const collected=s.app.reports.collectExport(USER,s.project.id,s.report.id);assert.ok(collected.files.some(f=>f.bytes.equals(bytes)));assert.ok((await s.service.create(USER,s.project.id,{reportId:s.report.id},label)).digest);}}finally{s.close();}}
});
test('binary noise is not treated as a host path, while readable paths and secrets still block export',async()=>{
 for(const [label,content,code] of [
  ['compressed noise','A:/',null],
  ['drive metadata','C:\\private\\report.pdf','EXPORT_HOST_PATH_DETECTED'],
  ['UNC metadata','\\\\host\\share\\report.pdf','EXPORT_HOST_PATH_DETECTED'],
  ['host marker','snapshotPath: /private/research/report.pdf','EXPORT_HOST_PATH_DETECTED'],
  ['credential','api_key = "sk-unit-test-value-0123456789"','EXPORT_SENSITIVE_CONTENT']
 ]){
  const bytes=Buffer.concat([Buffer.from([255,254]),Buffer.from(content),Buffer.from([255,254])]);
  const s=prepared((s,r)=>writeFileSync(join(physical(s,r.outputDir),'binary-fixture.bin'),bytes));
  try{
   if(code){await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},label),{code});assert.equal(exportsFor(s).length,0);}
   else{const collected=s.app.reports.collectExport(USER,s.project.id,s.report.id);assert.ok(collected.files.some(f=>f.bytes.equals(bytes)));assert.ok((await s.service.create(USER,s.project.id,{reportId:s.report.id},label)).digest);}
  }finally{s.close();}
 }
});

test('native tar export contains every fixed collected byte and logical mode, excludes mutable workspace, and commits once',async()=>{
 const s=prepared();try {
  const baselineWorkspace=physical(s,s.baseline.workspace);writeFileSync(join(baselineWorkspace,'mutable-workspace-only.txt'),'never export current workspace');
  writeFileSync(join(baselineWorkspace,'.env'),'PRIVATE_TEST_VALUE=not-an-export-input');
  const expected=s.app.reports.collectExport(USER,s.project.id,s.report.id);
  const [first,second]=await Promise.all([s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key'),s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key')]);
  assert.equal(first.id,second.id);assert.equal(exportsFor(s).length,1);assert.equal(s.app.store.list('report-export',s.project.id).length,1);
  assert.equal((await s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key')).id,first.id);
  await assert.rejects(s.service.create({type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'},s.project.id,{reportId:s.report.id},'same-key'),{code:'PERMISSION_DENIED'});
  const archive=physical(s,first.path),names=execFileSync(tar,['-tf',archive],{encoding:'utf8',shell:false,windowsHide:true}).trim().split(/\r?\n/).map(p=>p.replace(/^\.\//,''));
  assert.deepEqual(names.sort(),[...expected.files.map(f=>f.path),'manifest.json','README.md'].sort());assert.ok(!names.some(p=>p.includes('mutable-workspace-only')||p.endsWith('/.env')));
  const extracted=join(s.dir,'extracted');mkdirSync(extracted);execFileSync(tar,['-xf',archive,'-C',extracted],{shell:false,windowsHide:true});
  for(const file of expected.files)assert.equal(digest(readFileSync(join(extracted,file.path))),digest(file.bytes),file.path);
  const manifest=JSON.parse(readFileSync(join(extracted,'manifest.json'),'utf8'));
  assert.equal(manifest.bindingsDigest,expected.manifest.bindingsDigest);assert.equal(manifest.files.length,expected.files.length);
  assert.ok(manifest.files.some(f=>f.path.endsWith('/helper.sh')&&f.mode==='100755'));
  for(const file of manifest.files)assert.equal(file.digest,digest(readFileSync(join(extracted,file.path))),file.path);
  assert.match(readFileSync(join(extracted,'README.md'),'utf8'),/Windows tar headers do not reliably preserve executable bits/);
  assert.deepEqual(readdirSync(join(s.dir,'exports','tmp')),[]);
 }finally{s.close();}
});
test('TeX division followed by thin spacing exports fixed source and container logs byte-for-byte',async()=>{
 const s=setup(),tex=Buffer.from(String.raw`\documentclass{article}
\begin{document}
\[q = a /\,\sqrt{b}\]
\end{document}
`),log=Buffer.from('File /work/main.py reads /tmp/cache and writes /output/metrics.json\n');
 try{
  const e=s.app.experiments.get(USER,s.baseline.id);s.app.experiments.writeFile(USER,e.id,'paper.tex',tex.toString(),null,e.version);
  const intent=s.app.runs.prepare(USER,e.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);writeFileSync(join(physical(s,run.outputDir),'build.log'),log);fixtureFinish(s,run);
  const artifact=s.app.reports.create(USER,s.project.id,{runIds:[run.id]}),report=s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id),before=readFileSync(physical(s,artifact.path)),expected=s.app.reports.collectExport(USER,s.project.id,report.id);
  assert.ok(expected.files.some(f=>f.path===`sources/${run.manifest.snapshotDigest}/paper.tex`&&f.bytes.equals(tex)));assert.ok(expected.files.some(f=>f.bytes.equals(log)));
  const archive=await s.app.exports.create(USER,s.project.id,{reportId:report.id},'tex-spacing'),extracted=join(s.dir,'extracted');mkdirSync(extracted);execFileSync(tar,['-xf',physical(s,archive.path),'-C',extracted],{shell:false,windowsHide:true});
  const manifest=JSON.parse(readFileSync(join(extracted,'manifest.json'),'utf8'));assert.equal(manifest.files.length,expected.files.length);
  for(const file of expected.files){const bytes=readFileSync(join(extracted,file.path));assert.deepEqual(bytes,file.bytes,file.path);assert.equal(manifest.files.find(f=>f.path===file.path).digest,digest(bytes),file.path);}
  assert.deepEqual(readFileSync(join(physical(s,run.manifest.snapshotPath),'paper.tex')),tex);assert.deepEqual(readFileSync(physical(s,artifact.path)),before);
  const frozenLog=s.app.store.list('artifact',s.project.id).find(a=>a.title==='build.log');assert.ok(frozenLog);assert.deepEqual(readFileSync(physical(s,frozenLog.path)),log);
 }finally{s.close();}
});
test('UNC guard retains Unicode, device and mixed paths and comma shares through JSON decoding',()=>{
 const context={dataDir:'C:/unit-data',repoRoot:'C:/unit-repo',store:{paths:{legacyRoots:['C:/unit-legacy']}}};
 const paths=[String.raw`\\服务器\共享\paper.tex`,String.raw`\\?\UNC\server\share\paper.tex`,String.raw`\\.\pipe\unit`,String.raw`/\server/share\paper.tex`,String.raw`\/server\share/paper.tex`,String.raw`\\server\share,part\paper.tex`,'C:/unit-data/file','C:/unit-repo/file','C:/unit-legacy/file',String.raw`Z:\private\paper.tex`,'host_path: /private/source','--mount type=bind,src=/private/source'];
 for(const path of paths)for(const content of [path,JSON.stringify({message:JSON.stringify({path})})])assert.throws(()=>safeExportBytes(Buffer.from(content),context),{code:'EXPORT_HOST_PATH_DETECTED'},path);
 assert.throws(()=>safeExportBytes(Buffer.from('api_key = "sk-unit-test-value-0123456789"'),context),{code:'EXPORT_SENSITIVE_CONTENT'});
});
test('configured credential values and collector-detected credential formats are rejected without artifact publication',async()=>{
 const secret='unit-secret-value-92837465',previous=process.env.PI_EXPORT_TEST_API_KEY;process.env.PI_EXPORT_TEST_API_KEY=secret;
 try {
  const s=prepared((s,r)=>writeFileSync(join(physical(s,r.outputDir),'config-value.txt'),'test credential '+secret));try{await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},'credential'),error=>{assert.ok(!error.message.includes(secret));return /secret|credential|凭据|密钥/i.test(error.message);});assert.equal(exportsFor(s).length,0);}finally{s.close();}
  const metadata=prepared();try{const original=metadata.app.reports.collectExport.bind(metadata.app.reports);metadata.app.reports.collectExport=(...args)=>{const c=original(...args);return {...c,manifest:{...c.manifest,report:{...c.manifest.report,title:secret}}};};await assert.rejects(metadata.service.create(USER,metadata.project.id,{reportId:metadata.report.id},'manifest-secret'),error=>{assert.ok(!error.message.includes(secret));return error.code==='EXPORT_SECRET_DETECTED';});assert.equal(exportsFor(metadata).length,0);}finally{metadata.close();}
 }finally{if(previous===undefined)delete process.env.PI_EXPORT_TEST_API_KEY;else process.env.PI_EXPORT_TEST_API_KEY=previous;}
 const s=prepared((s,r)=>writeFileSync(join(physical(s,r.outputDir),'private-key.txt'),'-----BEGIN PRIVATE KEY-----\nUNIT FIXTURE, NOT A REAL KEY\n-----END PRIVATE KEY-----'));try{await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},'key-file'));assert.equal(exportsFor(s).length,0);}finally{s.close();}
});
test('scope expiry, post-compression content changes and oversized input cannot publish an archive',async()=>{
 for(const scenario of ['scope','tamper','size']) {
  const s=prepared();try {
   let validations=0;const original=s.app.reports.collectExport.bind(s.app.reports);
   if(scenario==='size')s.app.reports.collectExport=(...args)=>{const c=original(...args);return {...c,files:[...c.files,{path:'oversized.bin',bytes:Buffer.alloc(30*1024*1024)}]};};
   const validate=()=>{if(++validations===2){if(scenario==='scope')throw new Error('UNIT scope expired');if(scenario==='tamper'){const source=join(physical(s,s.run.manifest.snapshotPath),'helper.sh');chmodSync(source,0o600);writeFileSync(source,'tampered immutable source');}}};
   await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},scenario,validate));assert.equal(exportsFor(s).length,0,scenario);assert.equal(s.app.store.list('report-export',s.project.id).length,0,scenario);
  }finally{s.close();}
 }
});
