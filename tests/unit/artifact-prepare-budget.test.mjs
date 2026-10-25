import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';

test('fixed preparation has an absolute deadline before a ready descriptor or index publication',async()=>{
 const s=setup(),realNow=Date.now;try{const a=s.app.evidence.put(s.project.id,'deadline',Buffer.alloc(3*1024*1024,97));let clock=realNow(),checks=0;Date.now=()=>clock;
 await assert.rejects(s.app.artifactTexts.prepare(USER,s.project.id,{artifactId:a.id,sourceDigest:a.digest},()=>{if(++checks===2)clock+=120001;}),{code:'ARTIFACT_TEXT_PREPARE_TIMEOUT'});assert.equal(s.app.store.list('artifact-text-source',s.project.id).length,0);assert.equal(s.app.store.list('text-index-publication',s.project.id).length,0);
 }finally{Date.now=realNow;s.close();}
});
test('fixed preparation checks cancellation during machine I/O without weakening current source fences',async()=>{
 const s=setup();try{const a=s.app.evidence.put(s.project.id,'cancel',Buffer.alloc(3*1024*1024,97)),controller=new AbortController();let checks=0;
 await assert.rejects(s.app.artifactTexts.prepare(USER,s.project.id,{artifactId:a.id,sourceDigest:a.digest},()=>{if(++checks===2)controller.abort();},controller.signal),{code:'CONNECTOR_CANCELLED'});assert.equal(s.app.store.list('artifact-text-source',s.project.id).length,0);
 }finally{s.close();}
});
