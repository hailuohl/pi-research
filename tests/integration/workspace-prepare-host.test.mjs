import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';
import {locatePi} from '../../dist/packages/pi-adapter/runtime.js';
import {selectSessionSkills} from '../../dist/packages/skills/runtime.js';
import {setup,USER} from '../support/research.mjs';

test('a live Worker leaves its workspace replaceable while SDK restore retains exact native history',async()=>{
 const s=setup(),worker=join(s.dir,'workspace-prepare-worker.mjs'),home=join(s.dir,'sessions',s.session.id),workspace=s.app.store.paths.physical(s.session.workspace),sessionDir=join(home,'pi');
 mkdirSync(sessionDir,{recursive:true});
 const sdkUrl=pathToFileURL(locatePi(process.cwd()).sdkPath).href,sdk=await import(sdkUrl),nativePath=join(sessionDir,'retained.jsonl'),nativeId=randomUUID();
 const native=JSON.stringify({type:'session',version:sdk.CURRENT_SESSION_VERSION,id:nativeId,timestamp:new Date().toISOString(),cwd:join(s.dir,'historical-workspace')})+'\n'+JSON.stringify({type:'message',id:'retained-input',parentId:null,timestamp:new Date().toISOString(),message:{role:'user',content:'Offline IPC history marker',timestamp:Date.now()}})+'\n';
 writeFileSync(nativePath,native);
 selectSessionSkills(s.app,USER,s.project.id,{sessionId:s.session.id,expectedVersion:s.session.version,skillIds:[]});
 const session=s.app.store.get('session',s.session.id);s.app.store.update('session',session.id,session.version,{piSessionPath:s.app.store.paths.reference(nativePath)});
 const policy=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'autoEdit',expectedVersion:policy.version});
 const optionsUrl=new URL('../../dist/packages/pi-adapter/options.js',import.meta.url).href;
 // Real fork and pinned SessionManager; no model request or scientific execution.
 writeFileSync(worker,`import * as sdk from ${JSON.stringify(sdkUrl)};import {buildSessionOptions} from ${JSON.stringify(optionsUrl)};
 process.on('message',m=>{if(m.type==='start'){const options=buildSessionOptions(sdk,{cwd:m.workspace,agentDir:m.agentDir,sessionDir:m.sessionDir,sessionFile:m.piSessionPath,systemPrompt:'Offline IPC fixture',thinking:'off'},[],{},{});process.send({type:'fixture_context',processCwd:process.cwd(),sdkCwd:options.cwd,sessionCwd:options.sessionManager.getCwd(),sessionId:options.sessionManager.getSessionId()});process.send({type:'ready',sessionFile:options.sessionManager.getSessionFile(),model:{provider:m.model.provider,id:m.model.model}});process.send({type:'tool',tool:'workspace_prepare_from_revision',toolCallId:'prepare-fixed-source',requestId:1,input:{experimentId:${JSON.stringify(s.baseline.id)},revision:1}});}if(m.type==='tool_response')process.send({type:'fixture_response',result:m.result,error:m.error});if(m.type==='fixture_finish'){process.send({type:'assistant_message',content:'Offline initialization fixture completed',stopReason:'stop'});process.send({type:'done'});}if(m.type==='abort')process.send({type:'done',aborted:true});});`);
 const host=new AgentHost(s.app,{inspect:()=>({ready:true,code:'IPC_FIXTURE',message:'No model'}),workerEntry:worker});let context,response,preparationError;
 const prepare=s.app.sources.prepare.bind(s.app.sources);s.app.sources.prepare=(...args)=>{try{return prepare(...args);}catch(error){preparationError=error;throw error;}};
 try{
  s.app.sessions.send(USER,s.session.id,{content:'Initialize the fixed fixture source'});host.tick();
  const active=host.active.get(s.session.id);assert.ok(active,s.app.store.get('session',s.session.id).lastError);const child=active.child;
  let stderr='';child.stderr.on('data',chunk=>{stderr+=chunk;});child.on('message',m=>{if(m.type==='fixture_context')context=m;if(m.type==='fixture_response')response=m;});
  const end=Date.now()+15000;while(!response&&host.active.has(s.session.id)&&Date.now()<end)await delay(10);
  assert.ok(response,stderr||s.app.store.get('session',s.session.id).lastError||'Worker initialization response timed out');assert.equal(response.error,undefined,preparationError?.message??JSON.stringify(response));
  assert.equal(child.exitCode,null,'source initialization completes while the Worker remains alive');assert.ok(response.result.prepared);
  const source=s.app.sources.list(USER,s.project.id,{experimentId:s.baseline.id,revision:1}),bound=s.app.store.get('session',s.session.id);
  assert.equal(bound.sourceRevisionId,source.snapshotId);assert.equal(bound.sourceDigest,source.sourceDigest);assert.equal(bound.workspace,s.session.workspace);
  for(const file of source.files)assert.deepEqual(readFileSync(join(workspace,file.path)),readFileSync(join(s.app.store.paths.physical(s.app.store.get('source-revision',source.snapshotId).snapshot.path),file.path)));
  assert.equal(context.processCwd,home);assert.equal(context.sdkCwd,workspace);assert.equal(context.sessionCwd,workspace);assert.equal(context.sessionId,nativeId);
  assert.equal(bound.piSessionPath,s.app.store.paths.reference(nativePath));assert.equal(readFileSync(nativePath,'utf8'),native,'initialization and SDK restore do not rewrite retained native history');
  child.send({type:'fixture_finish'});const done=Date.now()+5000;while(host.active.size&&Date.now()<done)await delay(10);assert.equal(host.active.size,0);
 }finally{await host.stop();s.close();}
});
