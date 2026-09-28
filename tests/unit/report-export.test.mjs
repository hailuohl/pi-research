import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readdirSync, readFileSync, writeFileSync, chmodSync} from 'node:fs';
import {join} from 'node:path';
import {setup, USER, approve, fixtureFinish} from '../support/research.mjs';
import {ExportService} from '../../dist/packages/publications/export.js';
import {digest} from '../../dist/packages/storage/store.js';
import {setSourceMode} from '../../dist/packages/workspace/files.js';
const tar=process.platform==='win32'?'C:/WINDOWS/system32/tar.exe':'tar';
function prepared(extraOutput,title='Unit report ../../ title stays text') {
 const s=setup(),e=s.app.experiments.get(USER,s.baseline.id);
 s.app.experiments.writeFile(USER,e.id,'helper.sh','#!/bin/sh\necho fixed\n',null,e.version);setSourceMode(e.workspace,'helper.sh','100755');
 const intent=s.app.runs.prepare(USER,e.id);approve(s.app,intent.approvalId);const run=s.app.runs.submit(USER,intent.id);
 if(extraOutput)extraOutput(s,run);
 fixtureFinish(s,run); // Explicit unit fixture: no process, Docker, or model execution.
 const artifact=s.app.reports.create(USER,s.project.id,{title,runIds:[run.id],claimIds:[]});
 const report=s.app.store.list('report',s.project.id).find(r=>r.artifactId===artifact.id),service=new ExportService(s.app.context,s.app.reports,s.app.evidence);
 return {...s,run,report,service};
}
const exportsFor=s=>s.app.store.list('artifact',s.project.id).filter(a=>a.origin==='report-export');
test('native tar export contains every fixed collected byte and logical mode, excludes mutable workspace, and commits once',async()=>{
 const s=prepared();try {
  writeFileSync(join(s.baseline.workspace,'mutable-workspace-only.txt'),'never export current workspace');
  writeFileSync(join(s.baseline.workspace,'.env'),'PRIVATE_TEST_VALUE=not-an-export-input');
  const expected=s.app.reports.collectExport(USER,s.project.id,s.report.id);
  const [first,second]=await Promise.all([s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key'),s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key')]);
  assert.equal(first.id,second.id);assert.equal(exportsFor(s).length,1);assert.equal(s.app.store.list('report-export',s.project.id).length,1);
  assert.equal((await s.service.create(USER,s.project.id,{reportId:s.report.id},'same-key')).id,first.id);
  await assert.rejects(s.service.create({type:'agent',projectId:s.project.id,sessionId:s.session.id,role:'coordinator'},s.project.id,{reportId:s.report.id},'same-key'),{code:'PERMISSION_DENIED'});
  const names=execFileSync(tar,['-tf',first.path],{encoding:'utf8',shell:false,windowsHide:true}).trim().split(/\r?\n/).map(p=>p.replace(/^\.\//,''));
  assert.deepEqual(names.sort(),[...expected.files.map(f=>f.path),'manifest.json','README.md'].sort());assert.ok(!names.some(p=>p.includes('mutable-workspace-only')||p.endsWith('/.env')));
  const extracted=join(s.dir,'extracted');mkdirSync(extracted);execFileSync(tar,['-xf',first.path,'-C',extracted],{shell:false,windowsHide:true});
  for(const file of expected.files)assert.equal(digest(readFileSync(join(extracted,file.path))),digest(file.bytes),file.path);
  const manifest=JSON.parse(readFileSync(join(extracted,'manifest.json'),'utf8'));
  assert.equal(manifest.bindingsDigest,expected.manifest.bindingsDigest);assert.equal(manifest.files.length,expected.files.length);
  assert.ok(manifest.files.some(f=>f.path.endsWith('/helper.sh')&&f.mode==='100755'));
  for(const file of manifest.files)assert.equal(file.digest,digest(readFileSync(join(extracted,file.path))),file.path);
  assert.match(readFileSync(join(extracted,'README.md'),'utf8'),/Windows tar headers do not reliably preserve executable bits/);
  assert.deepEqual(readdirSync(join(s.dir,'exports','tmp')),[]);
 }finally{s.close();}
});
test('configured credential values and collector-detected credential formats are rejected without artifact publication',async()=>{
 const secret='unit-secret-value-92837465',previous=process.env.PI_EXPORT_TEST_API_KEY;process.env.PI_EXPORT_TEST_API_KEY=secret;
 try {
  const s=prepared((_s,r)=>writeFileSync(join(r.outputDir,'config-value.txt'),'test credential '+secret));try{await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},'credential'),error=>{assert.ok(!error.message.includes(secret));return /secret|credential|凭据|密钥/i.test(error.message);});assert.equal(exportsFor(s).length,0);}finally{s.close();}
  const metadata=prepared();try{const original=metadata.app.reports.collectExport.bind(metadata.app.reports);metadata.app.reports.collectExport=(...args)=>{const c=original(...args);return {...c,manifest:{...c.manifest,report:{...c.manifest.report,title:secret}}};};await assert.rejects(metadata.service.create(USER,metadata.project.id,{reportId:metadata.report.id},'manifest-secret'),error=>{assert.ok(!error.message.includes(secret));return error.code==='EXPORT_SECRET_DETECTED';});assert.equal(exportsFor(metadata).length,0);}finally{metadata.close();}
 }finally{if(previous===undefined)delete process.env.PI_EXPORT_TEST_API_KEY;else process.env.PI_EXPORT_TEST_API_KEY=previous;}
 const s=prepared((_s,r)=>writeFileSync(join(r.outputDir,'private-key.txt'),'-----BEGIN PRIVATE KEY-----\nUNIT FIXTURE, NOT A REAL KEY\n-----END PRIVATE KEY-----'));try{await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},'key-file'));assert.equal(exportsFor(s).length,0);}finally{s.close();}
});
test('scope expiry, post-compression content changes and oversized input cannot publish an archive',async()=>{
 for(const scenario of ['scope','tamper','size']) {
  const s=prepared();try {
   let validations=0;const original=s.app.reports.collectExport.bind(s.app.reports);
   if(scenario==='size')s.app.reports.collectExport=(...args)=>{const c=original(...args);return {...c,files:[...c.files,{path:'oversized.bin',bytes:Buffer.alloc(30*1024*1024)}]};};
   const validate=()=>{if(++validations===2){if(scenario==='scope')throw new Error('UNIT scope expired');if(scenario==='tamper'){const source=join(s.run.manifest.snapshotPath,'helper.sh');chmodSync(source,0o600);writeFileSync(source,'tampered immutable source');}}};
   await assert.rejects(s.service.create(USER,s.project.id,{reportId:s.report.id},scenario,validate));assert.equal(exportsFor(s).length,0,scenario);assert.equal(s.app.store.list('report-export',s.project.id).length,0,scenario);
  }finally{s.close();}
 }
});
