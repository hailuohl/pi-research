import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {LocalRuntimeService} from '../../dist/packages/runners/local-runtime.js';
import {superviseLocalRun} from '../../dist/packages/runners/local-supervisor.js';
import {superviseLegacyLocalRun} from '../../dist/packages/runners/local-supervisor-v1.js';
import {safeToolDiagnostic,toolFailureMessage,toolResultDiagnostic} from '../../dist/packages/pi-adapter/tool-diagnostic.js';
import {digest} from '../../dist/packages/storage/store.js';

const contract={runner:'local',localRuntimeId:'node',command:['node','main.mjs'],environment:{},datasetVersion:'preflight-v1',evaluationProtocolVersion:'fixed-v1',metrics:{value:{unit:'count',direction:'max'}},expectedArtifacts:['metrics.json'],networkPolicy:'host',timeoutSeconds:15,cpus:1,memoryMb:128};
function agent(fixture){const permission=fixture.app.sessionPermissions.status(USER,fixture.session.id);fixture.app.sessionPermissions.set(USER,fixture.session.id,{mode:'confirm',expectedVersion:permission.version,expectedHostVersion:permission.hostAccess.version});const row=fixture.app.store.get('session',fixture.session.id),session=fixture.app.store.update('session',row.id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:fixture.project.id,sessionId:session.id,role:'coordinator',generation:session.generation,permission:fixture.app.sessionPermissions.capture(session.id)};}
const call=(fixture,actor,name,input,key)=>fixture.app.operations.execute(actor,name,input,{projectId:fixture.project.id,sessionId:fixture.session.id,idempotencyKey:key});
const snapshots=fixture=>existsSync(join(fixture.dir,'snapshots'))?readdirSync(join(fixture.dir,'snapshots')).sort():[];
function approveAction(fixture){const action=fixture.app.sessionPermissions.status(USER,fixture.session.id).actions.at(-1);fixture.app.sessionPermissions.decide(USER,fixture.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});return action;}

test('invalid experiment contracts fail before a new session approval without requiring source or runtime',()=>{
 const fixture=setup();try{const actor=agent(fixture),before=fixture.app.store.list('experiment').length,approvalCount=fixture.app.store.list('approval').length;
  const {networkPolicy,...missingNetwork}=contract;
  for(const [invalid,code] of [[missingNetwork,'CONTRACT_INVALID'],[{...contract,command:['other','main.mjs']},'LOCAL_RUNTIME_INVALID']]){
   assert.throws(()=>call(fixture,actor,'experiment_plan_submit',{title:'Invalid local contract',contract:invalid},crypto.randomUUID()),{code});
   assert.equal(fixture.app.store.list('session-action').length,0);assert.equal(fixture.app.store.list('approval').length,approvalCount);assert.equal(fixture.app.store.list('experiment').length,before);
  }
  const input={title:'Base before integration',contract};assert.throws(()=>call(fixture,actor,'experiment_plan_submit',input,'base-approval'),{code:'APPROVAL_REQUIRED'});approveAction(fixture);const created=call(fixture,actor,'experiment_plan_submit',input,'base-execute');
  assert.deepEqual(created.contract.command,['node','main.mjs']);assert.equal(created.contractDigest,digest(created.contract));assert.equal(existsSync(join(fixture.app.store.paths.physical(created.workspace),'main.mjs')),false);assert.deepEqual(fixture.app.localRuntimes.list(),[]);
 }finally{fixture.close();}
});

test('child preflight compares the raw parent contract digest before applying defaults',()=>{
 const fixture=setup();try{const parent=fixture.app.experiments.create(USER,fixture.project.id,{title:'Parent',contract}),actor=agent(fixture),before=fixture.app.store.list('approval').length;
  assert.throws(()=>call(fixture,actor,'experiment_plan_submit',{title:'Changed child',parentId:parent.id,contract},'child-invalid'),{code:'CONTRACT_CHANGED'});
  assert.equal(fixture.app.store.list('approval').length,before);assert.equal(fixture.app.store.list('session-action').length,0);
  const input={title:'Exact child',parentId:parent.id,contract:parent.contract};assert.throws(()=>call(fixture,actor,'experiment_plan_submit',input,'child-approval'),{code:'APPROVAL_REQUIRED'});approveAction(fixture);const created=call(fixture,actor,'experiment_plan_submit',input,'child-execute');
  assert.equal(created.contractDigest,parent.contractDigest);assert.deepEqual(created.contract,JSON.parse(JSON.stringify(parent.contract)));assert.equal(call(fixture,actor,'experiment_plan_submit',input,'child-execute').id,created.id);
 }finally{fixture.close();}
});

test('invalid new local Run entries fail before approvals, intents, processes or snapshots',()=>{
 const fixture=setup();try{fixture.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});const actor=agent(fixture);
  for(const command of [['node','missing.mjs'],['node','../outside.mjs'],['node','-e','private-argv-canary'],['node','--unknown','main.mjs']]){
   const experiment=fixture.app.experiments.create(USER,fixture.project.id,{title:'Invalid entry',contract:{...contract,command}}),before=snapshots(fixture),approvals=fixture.app.store.list('approval').length;
   assert.throws(()=>call(fixture,actor,'run_prepare',{experimentId:experiment.id},crypto.randomUUID()),{code:'LOCAL_ENTRY_INVALID'});
   assert.equal(fixture.app.store.list('approval').length,approvals);assert.equal(fixture.app.store.list('session-action').length,0);assert.equal(fixture.app.store.list('run-intent').length,0);assert.equal(fixture.app.store.list('run').length,0);assert.deepEqual(snapshots(fixture),before);
   assert.throws(()=>fixture.app.runs.prepare(USER,experiment.id),{code:'LOCAL_ENTRY_INVALID'});assert.deepEqual(snapshots(fixture),before);
  }
 }finally{fixture.close();}
});

test('missing runtime is rejected before local Run approval but permits creating the base',()=>{
 const fixture=setup();try{const experiment=fixture.app.experiments.create(USER,fixture.project.id,{title:'Base without runtime',contract}),actor=agent(fixture),before=snapshots(fixture),approvals=fixture.app.store.list('approval').length;
  assert.throws(()=>call(fixture,actor,'run_prepare',{experimentId:experiment.id},'missing-runtime'),{code:'LOCAL_RUNTIME_UNAVAILABLE'});
  assert.equal(fixture.app.store.list('approval').length,approvals);assert.equal(fixture.app.store.list('session-action').length,0);assert.equal(fixture.app.store.list('run-intent').length,0);assert.deepEqual(snapshots(fixture),before);
 }finally{fixture.close();}
});

test('local Run approval and historical receipts preserve argv and digests after source and runtime removal',()=>{
 const fixture=setup();try{fixture.app.localRuntimes.configure(USER,{id:'python',executable:'node',expectedVersion:0});writeFileSync(join(fixture.app.store.paths.physical(fixture.project.workspace),'main.mjs'),'export {};');const experiment=fixture.app.experiments.create(USER,fixture.project.id,{title:'Aliased Node',contract:{...contract,localRuntimeId:'python',command:['python','main.mjs','-I','','private-argument']}}),actor=agent(fixture),input={experimentId:experiment.id};
  assert.throws(()=>call(fixture,actor,'run_prepare',input,'run-approval'),{code:'APPROVAL_REQUIRED'});const action=approveAction(fixture),intent=call(fixture,actor,'run_prepare',input,'run-execute');
  assert.deepEqual(intent.manifest.contract.command,['python','main.mjs','-I','','private-argument']);assert.equal(intent.manifest.contractDigest,experiment.contractDigest);assert.equal(intent.manifestDigest,digest(intent.manifest));assert.equal(fixture.app.store.get('approval',intent.approvalId).digest,intent.manifestDigest);
  rmSync(join(fixture.app.store.paths.physical(experiment.workspace),'main.mjs'));writeFileSync(join(fixture.dir,'local-runtimes.json'),'{}');
  assert.equal(call(fixture,actor,'run_prepare',input,'run-execute').id,intent.id);assert.equal(fixture.app.store.get('session-action',action.id).state,'completed');
  fixture.app.close();fixture.app=new ResearchApp(fixture.dir,process.cwd());assert.equal(call(fixture,actor,'run_prepare',input,'run-execute').id,intent.id);assert.equal(fixture.app.store.list('run-intent').length,1);assert.equal(fixture.app.store.list('run').length,0);
 }finally{fixture.close();}
});

test('Python local preparation preserves standalone prefix flags and rejects every other entry form',testContext=>{
 const fixture=setup();try{fixture.app.localRuntimes.configure(USER,{id:'science',executable:'node',expectedVersion:0});const resolve=LocalRuntimeService.prototype.resolve;testContext.mock.method(LocalRuntimeService.prototype,'resolve',function(...args){return {...resolve.apply(this,args),runtimeVersion:'Python 3.12.0'};});writeFileSync(join(fixture.app.store.paths.physical(fixture.project.workspace),'main.py'),'print(1)');
  const command=['science','-I','-S','main.py','input.json'],experiment=fixture.app.experiments.create(USER,fixture.project.id,{title:'Python prefix',contract:{...contract,localRuntimeId:'science',command}}),intent=fixture.app.runs.prepare(USER,experiment.id);
  assert.deepEqual(intent.manifest.contract.command,command);assert.equal(intent.manifest.contractDigest,experiment.contractDigest);assert.equal(intent.manifestDigest,digest(intent.manifest));assert.equal(fixture.app.store.get('approval',intent.approvalId).digest,intent.manifestDigest);
  for(const argv of [['science','-c','main.py'],['science','-m','main.py'],['science','-X','main.py'],['science','-IS','main.py'],['science','-I','-S'],['science','-I','../main.py']]){
   const invalid=fixture.app.experiments.create(USER,fixture.project.id,{title:'Invalid Python entry',contract:{...contract,localRuntimeId:'science',command:argv}}),before=snapshots(fixture),approvals=fixture.app.store.list('approval').length;
   assert.throws(()=>fixture.app.runs.prepare(USER,invalid.id),{code:'LOCAL_ENTRY_INVALID'});assert.deepEqual(snapshots(fixture),before);assert.equal(fixture.app.store.list('run-intent').length,1);assert.equal(fixture.app.store.list('approval').length,approvals);
  }
 }finally{fixture.close();}
});

test('actual preparation rechecks an approved runtime without publishing snapshots or replacing approval',()=>{
 const fixture=setup();try{fixture.app.localRuntimes.configure(USER,{id:'node',executable:'node',expectedVersion:0});writeFileSync(join(fixture.app.store.paths.physical(fixture.project.workspace),'main.mjs'),'export {};');const experiment=fixture.app.experiments.create(USER,fixture.project.id,{title:'Runtime removed after approval',contract}),actor=agent(fixture),input={experimentId:experiment.id};
  assert.throws(()=>call(fixture,actor,'run_prepare',input,'pending-runtime'),{code:'APPROVAL_REQUIRED'});const approved=approveAction(fixture),before=snapshots(fixture),approvals=fixture.app.store.list('approval').length;writeFileSync(join(fixture.dir,'local-runtimes.json'),'{}');
  assert.throws(()=>call(fixture,actor,'run_prepare',input,'consume-runtime'),{code:'LOCAL_RUNTIME_UNAVAILABLE'});assert.equal(fixture.app.store.list('run-intent').length,0);assert.equal(fixture.app.store.list('run').length,0);assert.deepEqual(snapshots(fixture),before);assert.equal(fixture.app.store.list('approval').length,approvals);assert.equal(fixture.app.store.list('session-action').length,1);assert.equal(fixture.app.store.get('session-action',approved.id).state,'failed');
 }finally{fixture.close();}
});

test('both unstarted supervisors accept only supported Python prefixes and the exact approved entry',async testContext=>{
 const fixture=setup();try{testContext.mock.method(LocalRuntimeService.prototype,'resolve',()=>({runtimeVersion:'Python 3.12.0'}));
  for(const supervisor of [superviseLocalRun,superviseLegacyLocalRun])for(const [command,want] of [
   [['py-alias','main.py','-c','private-argv-canary'],'SNAPSHOT_CORRUPTED'],[['py-alias','-I','-S','main.py','input.json'],'SNAPSHOT_CORRUPTED'],[['py-alias','-S','main.py'],'SNAPSHOT_CORRUPTED'],[['py-alias','-I','main.py'],'SNAPSHOT_CORRUPTED'],
   [['py-alias','-I','-S'],'LOCAL_ENTRY_INVALID'],[['py-alias','-c','main.py'],'LOCAL_ENTRY_INVALID'],[['py-alias','-m','main.py'],'LOCAL_ENTRY_INVALID'],[['py-alias','-X','main.py'],'LOCAL_ENTRY_INVALID'],[['py-alias','-IS','main.py'],'LOCAL_ENTRY_INVALID'],[['py-alias','-I','missing.py'],'LOCAL_ENTRY_INVALID'],[['py-alias','-I','../main.py'],'LOCAL_ENTRY_INVALID'],
  ]){
   let run={manifestDigest:'unchanged-digest',manifest:{contract:{...contract,localRuntimeId:'py-alias',command},sourceFiles:[{path:'main.py',digest:'0'.repeat(64),size:1}],snapshotPath:fixture.app.store.paths.reference(join(fixture.dir,'missing-snapshot')),localRuntime:{runtimeVersion:'Python 3.12.0'}},execution:{generation:1,startRequested:false,localExecutionId:supervisor===superviseLocalRun?'execution':undefined,controlDir:fixture.app.store.paths.reference(join(fixture.dir,'control'))},outputDir:fixture.app.store.paths.reference(join(fixture.dir,'output'))};let result;
   const before=JSON.stringify(run.manifest),callbacks={read:()=>run,fence(){},assertGrant(){},patch(value){run={...run,...value};return run;},finalize(value){result=value;}};
   await supervisor(run,fixture.app.context,callbacks);assert.equal(result?.error?.split(': ')[0],want,JSON.stringify(command));if(want==='LOCAL_ENTRY_INVALID'){assert.match(result.error,/源码/);assert.match(result.error,/-I/);assert.match(result.error,/-S/);assert.doesNotMatch(result.error,/private-|D:\//);}assert.equal(run.execution.startRequested,false);assert.equal(JSON.stringify(run.manifest),before);assert.equal(existsSync(join(fixture.dir,'control','native-spec.json')),false);
  }
 }finally{fixture.close();}
});

test('both started supervisors retain unknown barriers before runtime or entry validation',async testContext=>{
 const fixture=setup();try{testContext.mock.method(LocalRuntimeService.prototype,'resolve',()=>assert.fail('started work must not resolve a new runtime'));
  for(const supervisor of [superviseLocalRun,superviseLegacyLocalRun]){
   let run={state:'submitting',manifestDigest:'old-digest',manifest:{contract:{...contract,command:['node','-c','private-argv-canary']},sourceFiles:[],localRuntime:{runtimeVersion:'Python 3.12.0'}},execution:{generation:1,startRequested:true,localExecutionId:supervisor===superviseLocalRun?'execution':undefined,controlDir:fixture.app.store.paths.reference(join(fixture.dir,'prior-control')),leaseUntil:Date.now()+60000},outputDir:fixture.app.store.paths.reference(join(fixture.dir,'prior-output'))};
   const before=JSON.stringify(run.manifest),callbacks={read:()=>run,fence(){},assertGrant(){assert.fail('uncertain start must not reauthorize');},patch(value){run={...run,...value};return run;},finalize(){assert.fail('uncertain start cannot release resources');}};
   await supervisor(run,fixture.app.context,callbacks);assert.equal(run.state,'unknown');assert.equal(run.execution.startRequested,true);assert.equal(run.execution.leaseUntil,0);assert.equal(JSON.stringify(run.manifest),before);assert.equal(existsSync(join(fixture.dir,'prior-control','native-spec.json')),false);
  }
 }finally{fixture.close();}
});

test('entry diagnostics are actionable static hints without private errors or argv',()=>{
 const privateMessage='private-canary D:/private/runtime.exe python -I -S /private/main.py';
 assert.deepEqual(safeToolDiagnostic({},'LOCAL_ENTRY_INVALID',privateMessage),{code:'LOCAL_ENTRY_INVALID'});assert.deepEqual(toolResultDiagnostic({},{content:[{type:'text',text:'LOCAL_ENTRY_INVALID: '+privateMessage}]}),{code:'LOCAL_ENTRY_INVALID'});
 const message=toolFailureMessage('run_prepare',{code:'LOCAL_ENTRY_INVALID'});assert.match(message,/源码/);assert.match(message,/-I/);assert.match(message,/-S/);assert.doesNotMatch(message,/private-|D:\//);
});
