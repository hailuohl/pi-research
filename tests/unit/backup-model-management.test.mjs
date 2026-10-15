import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync,realpathSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {digest} from '../../dist/packages/storage/store.js';
import {createDataBackup,verifyDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
import {configureModelManagement,inspectModelManagement,availableSelections,probeBinding} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState,assertModelEnabled,configureModelConnection,applyModelConnection} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {probeModel} from '../../dist/packages/pi-adapter/model-probe.js';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';

const secret='!FAKE_backup_managed_key',replacement='!FAKE_restored_owner_key';
const rows=dir=>{const db=new DatabaseSync(join(dir,'state.db'),{readOnly:true});try{return db.prepare('SELECT kind,id,data FROM records ORDER BY kind,id').all();}finally{db.close();}};
async function fixture(){const parent=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-model-backup-')),data=join(parent,'data'),app=new ResearchApp(data,process.cwd());const project=app.projects.create(USER,{name:'Backup model catalog'});const change=(action,fields)=>configureModelManagement(app.context,USER,{expectedVersion:readModelState(data).version,action,...fields},crypto.randomUUID());
 for(const model of ['active','disabled','deleted'])app.sessions.configure(USER,{provider:'managed',model,thinking:'off'});app.sessions.configure(USER,{provider:'legacy-only',model:'old',thinking:'off'});app.sessions.configure(USER,{provider:'deleted-provider',model:'old',thinking:'off'});app.sessions.configure(USER,{provider:'managed',model:'active',thinking:'off'});
 await change('provider.upsert',{provider:'managed',value:{name:'Managed',api:'openai-responses',baseUrl:'https://fixture.invalid/v1',apiKey:secret}});
 for(const model of ['active','disabled','deleted']){const d=defaultModelDefinition(model);d.nativeProfile='openai';d.capabilities.nativeWebSearch=true;await change('model.upsert',{provider:'managed',model,value:d});}
 await change('model.enabled',{provider:'managed',model:'disabled',value:{enabled:false}});await change('model.delete',{provider:'managed',model:'deleted'});await change('provider.enabled',{provider:'legacy-only',value:{enabled:false}});await change('provider.delete',{provider:'deleted-provider'});
 const session=app.sessions.create(USER,project.id,{title:'Preserved default session'}),saved=readModelState(data),p=saved.connections.find(p=>p.provider==='managed'),m=p.models.find(m=>m.model==='active');
 const probeInput={expectedVersion:saved.version,provider:'managed',model:'active',kind:'model',acknowledgedCost:true};app.store.create('model-probe',null,{provider:'managed',model:'active',kind:'model',binding:probeBinding(p,m),inputHash:digest(probeInput),ownerPid:process.pid,state:'passed',category:'success',checkedAt:new Date().toISOString(),durationMs:3,requests:1,httpStatus:200,coverage:'minimal-availability'},digest({scope:'model-probe',key:'saved-probe'}));
 const continuation=app.evidence.put(project.id,'native-continuation.json',Buffer.from('{"opaque":"fixture-continuation"}'),'application/json','native-continuation');
 app.store.create('native-request',project.id,{sessionId:session.id,state:'unknown',dispatched:1,fixture:true,continuation:{artifactId:continuation.id,digest:continuation.digest}},'preserved-native-history');
 const pending=app.nativeRequests.prepare(USER,session.id,{expectedSessionVersion:app.sessions.get(USER,session.id).version,prompt:'Find fixture sources.',sources:[],search:true,maxOutputTokens:128},'prepared-before-backup'),approved=app.nativeRequests.decide(USER,pending.id,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved:true});
 const agentDir=join(data,'sessions',session.id,'agent');mkdirSync(agentDir,{recursive:true});writeFileSync(join(agentDir,'auth.json'),JSON.stringify({managed:{type:'api_key',key:'FAKE_PRIVATE_NATIVE_AUTH'}}));writeFileSync(join(data,'models.json'),'{"providers":{}}');
 return {parent,data,app,project,session,saved,continuation,probeInput,approved,backup:join(parent,'backup'),change};
}

test('backup restores nonsecret definitions/tombstones into one keyless authority and keeps SQL/native history intact',async()=>{
 const s=await fixture();let source=s.app,restored;
 try{
  const originalRows=rows(s.data),beforeSession=source.sessions.get(USER,s.session.id);await source.close();source=null;
  const summary=await createDataBackup(s.data,s.backup,{offline:true});assert.ok(summary.excluded.includes('model-connections.json'));assert.equal(existsSync(join(s.backup,'data','model-connections.json')),false);
  const manifestText=readFileSync(join(s.backup,'manifest.json'),'utf8'),manifest=JSON.parse(manifestText);assert.equal(manifest.modelManagement.format,'pi-model-management-backup-v1');assert.equal(manifest.modelManagement.state.version,s.saved.version);assert.ok(!manifestText.includes(secret));assert.ok(!manifestText.includes('FAKE_PRIVATE_NATIVE_AUTH'));assert.ok(!Object.hasOwn(manifest.modelManagement.state.connections[0],'apiKey'));assert.ok(!Object.hasOwn(manifest.modelManagement.state,'receipt'));
  assert.deepEqual(rows(join(s.backup,'data')),originalRows,'backup does not delete the nonsecret probe journal or other SQL history');
  const target=join(s.parent,'restored');await restoreDataBackup(s.backup,target,{offline:true,relocate:true});const state=readModelState(target),p=state.connections.find(p=>p.provider==='managed');assert.equal(state.version,s.saved.version);assert.equal(p.apiKey,'');assert.equal(p.requiresCredential,true);assert.deepEqual(p.models,s.saved.connections.find(p=>p.provider==='managed').models);assert.deepEqual(state.connections.find(p=>p.provider==='legacy-only'),s.saved.connections.find(p=>p.provider==='legacy-only'));assert.ok(!readFileSync(join(target,'model-connections.json'),'utf8').includes(secret));
  const archivedRows=rows(target).filter(r=>['session','app-settings','model-probe','native-request'].includes(r.kind));assert.deepEqual(archivedRows,originalRows.filter(r=>['session','app-settings','model-probe','native-request'].includes(r.kind)));
  restored=new ResearchApp(target,process.cwd());const current=restored.sessions.get(USER,s.session.id);assert.deepEqual(current,beforeSession);assert.deepEqual(restored.evidence.read(USER,s.continuation.id).bytes,Buffer.from('{"opaque":"fixture-continuation"}'));
  let view=await inspectModelManagement(restored.context,USER);assert.equal(view.defaultUsable,false);assert.equal(view.providers.find(p=>p.provider==='managed').requiresCredential,true);assert.equal(view.providers.find(p=>p.provider==='managed').hasApiKey,false);assert.equal(view.providers.find(p=>p.provider==='managed').models.find(m=>m.model==='active').test.state,'stale');assert.equal(availableSelections(restored.context).length,0);
  assert.throws(()=>assertModelEnabled(target,current.model),{code:'MODEL_CREDENTIAL_REQUIRED'});assert.throws(()=>new AgentHost(restored).ensureReady(current),{code:'MODEL_CREDENTIAL_REQUIRED'});
  let runtimeCreations=0;await assert.rejects(()=>applyModelConnection({ModelRuntime:{create:async()=>{runtimeCreations++;throw Error('must not reach inherited credentials');}}},{getModel:()=>undefined},current.model,p,'FAKE_ENV_FALLBACK',join(target,'sessions',s.session.id,'agent','auth.json')),{code:'MODEL_CREDENTIAL_REQUIRED'});assert.equal(runtimeCreations,0);
  await assert.rejects(()=>probeModel(restored.context,USER,{expectedVersion:state.version,provider:'managed',model:'active',kind:'model',acknowledgedCost:true},'blocked-probe'),{code:'MODEL_CREDENTIAL_REQUIRED'});
  assert.equal((await probeModel(restored.context,USER,s.probeInput,'saved-probe')).state,'stale','replaying an old receipt must not report a current pass after restore');
  assert.throws(()=>restored.nativeRequests.prepare(USER,s.session.id,{expectedSessionVersion:current.version,prompt:'Find fixture sources.',sources:[],search:true,maxOutputTokens:128},'blocked-native'),{code:'MODEL_CREDENTIAL_REQUIRED'});
  const staleNative=restored.nativeRequests.inspect(USER,s.approved.id);assert.equal(staleNative.state,'stale');assert.equal(staleNative.dispatched,0);
  const savedBytes=readFileSync(join(target,'model-connections.json'));assert.throws(()=>configureModelConnection(restored.context,USER,{expectedVersion:state.version,provider:'managed',name:p.name,baseUrl:p.baseUrl,api:p.api},'missing-new-key'),{code:'INVALID_INPUT'});assert.deepEqual(readFileSync(join(target,'model-connections.json')),savedBytes);
  configureModelConnection(restored.context,USER,{expectedVersion:state.version,provider:'managed',name:p.name,baseUrl:p.baseUrl,api:p.api,apiKey:replacement},'owner-key');const rekeyed=readModelState(target),after=rekeyed.connections.find(p=>p.provider==='managed');assert.equal(after.requiresCredential,undefined);assert.equal(after.credentialRevision,p.credentialRevision+1);assert.deepEqual(after.models,p.models);assert.ok(availableSelections(restored.context).some(m=>m.provider==='managed'&&m.model==='active'));assert.ok(!availableSelections(restored.context).some(m=>m.model==='disabled'||m.model==='deleted'||m.provider==='legacy-only'));
  assert.throws(()=>restored.sessions.configure(USER,{provider:'managed',model:'deleted',thinking:'off'}),{code:'MODEL_DISABLED'});assert.throws(()=>assertModelEnabled(target,{provider:'managed',model:'disabled'}),{code:'MODEL_DISABLED'});assert.throws(()=>assertModelEnabled(target,{provider:'deleted-provider',model:'old'}),{code:'MODEL_DISABLED'});view=await inspectModelManagement(restored.context,USER);assert.equal(view.defaultUsable,true);assert.equal(view.providers.find(p=>p.provider==='managed').models.find(m=>m.model==='active').test.state,'stale');assert.deepEqual(restored.sessions.get(USER,s.session.id),beforeSession);
 }finally{if(source)await source.close();if(restored)await restored.close();rmSync(s.parent,{recursive:true,force:true});}
});

test('public model snapshots reject digest tampering and hidden keys even when the outer manifest is recomputed',async()=>{
 const s=await fixture();let open=true;try{await s.app.close();open=false;await createDataBackup(s.data,s.backup,{offline:true});const file=join(s.backup,'manifest.json'),original=readFileSync(file,'utf8');
  const cases=[m=>{m.modelManagement.digest='0'.repeat(64);},m=>{m.modelManagement.state.connections[0].apiKey='INJECTED_SECRET';m.modelManagement.digest=digest(m.modelManagement.state);},m=>{m.modelManagement.state.receipt={key:'private',hash:'a'.repeat(64)};m.modelManagement.digest=digest(m.modelManagement.state);},m=>{m.modelManagement.state.connections[0].requiresCredential=false;m.modelManagement.digest=digest(m.modelManagement.state);}];
  for(const [index,change] of cases.entries()){const m=JSON.parse(original);change(m);delete m.manifestDigest;m.manifestDigest=digest(m);writeFileSync(file,JSON.stringify(m));await assert.rejects(()=>verifyDataBackup(s.backup),{code:'BACKUP_MODEL_MANAGEMENT_INVALID'});const target=join(s.parent,'rejected-'+index);await assert.rejects(()=>restoreDataBackup(s.backup,target,{offline:true,relocate:true}),{code:'BACKUP_MODEL_MANAGEMENT_INVALID'});assert.equal(existsSync(target),false);}
  writeFileSync(file,original);await verifyDataBackup(s.backup);
 }finally{if(open)await s.app.close();rmSync(s.parent,{recursive:true,force:true});}
});

test('older backups without catalog metadata keep their legacy behavior without inventing a model state',async()=>{
 const parent=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-old-model-backup-')),data=join(parent,'data');let app=new ResearchApp(data,process.cwd());try{app.sessions.configure(USER,{provider:'legacy',model:'old-model',thinking:'off'});await app.close();app=null;const backup=join(parent,'backup');await createDataBackup(data,backup,{offline:true});assert.equal(JSON.parse(readFileSync(join(backup,'manifest.json'))).modelManagement,undefined);const target=join(parent,'restored');await restoreDataBackup(backup,target,{offline:true,relocate:true});assert.equal(existsSync(join(target,'model-connections.json')),false);app=new ResearchApp(target,process.cwd());assert.equal(app.sessions.model().model,'old-model');assert.equal(assertModelEnabled(target,app.sessions.model()),undefined);}finally{if(app)await app.close();rmSync(parent,{recursive:true,force:true});}
});

test('backup requires confirmed local transport end for interrupted owner-native HTTP and still rejects ordinary unknown requests',async()=>{
 for(const [ownerKind,state,transportEnded,allowed] of [['owner-native','interrupted',true,true],['owner-native','interrupted',undefined,false],['owner-native','unknown',true,false],['owner-native','active',true,false],[undefined,'unknown',true,false]]){
  const parent=mkdtempSync(join(realpathSync.native(tmpdir()),'pi-http-backup-')),data=join(parent,'data');let app=new ResearchApp(data,process.cwd());try{
   app.store.create('model-http-request',null,{fixture:true,state,...(ownerKind?{ownerKind}:{}),...(transportEnded===undefined?{}:{transportEnded})});await app.close();app=null;const backup=join(parent,'backup');
   if(allowed){await createDataBackup(data,backup,{offline:true});assert.equal(rows(join(backup,'data')).find(r=>r.kind==='model-http-request').data.includes('interrupted'),true);}
   else{await assert.rejects(()=>createDataBackup(data,backup,{offline:true}),{code:'BACKUP_BUSY'});assert.equal(existsSync(backup),false);}
  }finally{if(app)await app.close();rmSync(parent,{recursive:true,force:true});}
 }
});
