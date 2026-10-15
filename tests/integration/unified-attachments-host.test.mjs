import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {writeFileSync,chmodSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {configureModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
const pdf=Buffer.from('%PDF-1.7\nHTTP admission fence\n'),codes={catalog:'MODEL_ATTACHMENT_CATALOG_CHANGED',bytes:'ARTIFACT_CORRUPTED',permission:'SESSION_PERMISSION_STALE',source:'ATTACHMENT_SOURCE_DENIED',queued:'MODEL_ATTACHMENT_SCOPE_DENIED'};
for(const change of ['allowed','catalog','bytes','permission','source','queued'])test(`native HTTP acquire ${change==='allowed'?'allows explicitly sent files in readOnly chat':'blocks '+change+' changes before any dispatch'}`,async()=>{
 const s=setup();let changed=false,host;
 try{
  const modify=(action,fields)=>configureModelManagement(s.app.context,USER,{expectedVersion:readModelState(s.dir).version,action,...fields},crypto.randomUUID());await modify('provider.upsert',{provider:'gate',value:{name:'Offline gate',baseUrl:'https://fixture.invalid/v1',api:'openai-completions',apiKey:'FAKE_gate'}});const definition=defaultModelDefinition('fixture');definition.nativeProfile='openai';definition.capabilities.pdf=true;await modify('model.upsert',{provider:'gate',model:'fixture',value:definition});s.app.store.update('session',s.session.id,s.session.version,{model:{provider:'gate',model:'fixture',thinking:'off'}});s.app.sessionPermissions.initialize(s.session.id,'readOnly');
  const doc=s.app.documents.import(USER,s.project.id,{title:'gate.pdf',mediaType:'application/pdf',contentBase64:pdf.toString('base64')},'gate-file');const first=s.app.sessions.send(USER,s.session.id,{content:'admission gate',attachmentDocumentIds:[doc.id]});
  if(change==='queued'){const queued=s.app.sessions.send(USER,s.session.id,{content:'not delivered',attachmentDocumentIds:[doc.id]});s.app.sessions.queueAction(USER,s.session.id,{messageId:first.id,expectedVersion:first.version,action:'edit',content:'queued-ref:'+queued.id});}
  host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No provider'}),workerEntry:resolve('tests/fixtures/attachment-http-worker.mjs'),fork:(...args)=>{const child=fork(...args);child.prependListener('message',m=>{if(m.type!=='model_http_acquire'||changed)return;changed=true;if(change==='catalog')writeFileSync(join(s.dir,'models.json'),'{}');if(change==='bytes'){const artifact=s.app.store.get('artifact',doc.original.artifactId),path=s.app.store.paths.physical(artifact.path);chmodSync(path,0o600);writeFileSync(path,'changed bytes');}if(change==='permission')s.app.sessionPermissions.set(USER,s.session.id,{expectedVersion:1,mode:'confirm'});if(change==='source'){const record=s.app.store.get('document-version',doc.id);s.app.store.update('document-version',record.id,record.version,{source:{kind:'connector'}});}});return child;}});
  host.tick();const end=Date.now()+10000;while(host.active.size&&Date.now()<end)await new Promise(resolve=>setTimeout(resolve,20));assert.equal(host.active.size,0);assert.ok(changed);const message=s.app.store.get('message',first.id);assert.equal(message.attachments[0].digest,doc.original.digest);assert.equal(message.status,change==='allowed'?'completed':'failed');
  if(change==='allowed'){assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items[0].state,'succeeded');assert.equal(message.error,undefined);}else{assert.match(message.error,new RegExp(codes[change]));assert.equal(s.app.modelHttp.inspect(USER,s.project.id).items.length,0);}
 }finally{await host?.stop();s.close();}
});
