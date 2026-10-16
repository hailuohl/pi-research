import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
import {configureEnvironment} from '../../dist/packages/runtime/environment.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {createServer} from 'node:http';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {validateSchema} from '../../dist/packages/contracts/operations/schema.js';
import {OUTPUT_SCHEMAS} from '../../dist/packages/contracts/operations/outputs.js';
import {operationRoute} from '../../dist/apps/server/operation-routes.js';
import {configureModelConnection} from '../../dist/packages/pi-adapter/model-connections.js';

function fixture(){const dir=mkdtempSync(join(tmpdir(),'pi-action-inspect-')),app=new ResearchApp(dir,process.cwd()),project=app.projects.create(USER,{name:'Fixed approval replay',template:'curve-fit'}),session=app.sessions.create(USER,project.id,{});app.sessionPermissions.initialize(session.id,'confirm');return {dir,app,project,session,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};}
function actor(s,id=s.session.id){const row=s.app.store.get('session',id),next=s.app.store.update('session',id,row.version,{state:'running',generation:row.generation+1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.project.id,sessionId:id,role:next.role,generation:next.generation,permission:s.app.sessionPermissions.capture(id)};}
const call=(s,a,name,input,key=crypto.randomUUID())=>s.app.operations.execute(a,name,input,{projectId:a.projectId,sessionId:a.sessionId,idempotencyKey:key});
function prepare(s,a,name,input){assert.throws(()=>call(s,a,name,input),{code:'APPROVAL_REQUIRED'});return s.app.sessionPermissions.status(USER,s.session.id).actions.at(-1);}
function decide(s,row,approved=true){s.app.sessionPermissions.decide(USER,s.session.id,row.id,{expectedVersion:row.version,expectedApprovalVersion:row.approval.version,approved});}
const brief={expectedRevisionId:null,question:'Fixed plan',scope:'Exact replay',constraints:[],successCriteria:[],clarificationQuestions:['Confirm scope'],literatureSummary:'AC-OPF: '+('fixed source evidence; '.repeat(300)),hypotheses:[],evidenceIds:[],steps:[],status:'clarifying'};

test('approval catalogs focus only the exact notice and inspect fixed text validity without updating old records',()=>{
 for(const change of ['valid','network','non-text','missing','other-session','pending','completed','failed','unknown','source','epoch','approval','protected','protection-unavailable']){const s=fixture();try{
  const a=actor(s),operation=change==='network'?'literature_search':change==='non-text'?'experiment_plan_submit':'workspace_write',input=operation==='literature_search'?{query:'fixed search'}:operation==='experiment_plan_submit'?{title:'Fixed candidate'}:{path:'focused.txt',content:'fixed-private-value',expectedDigest:null};
  const pending=prepare(s,a,operation,input);if(change!=='pending')decide(s,pending);
  const neighbor=prepare(s,a,'artifact_create',{title:'Neighbor',content:'separate valid text'});decide(s,neighbor);
  let id=pending.id;
  if(change==='missing')id='missing-action';
  if(change==='other-session'){const row=s.app.store.get('session-action',id);s.app.store.update('session-action',id,row.version,{sessionId:s.app.sessions.create(USER,s.project.id,{}).id});}
  if(['completed','failed','unknown'].includes(change)){const row=s.app.store.get('session-action',id);s.app.store.update('session-action',id,row.version,{state:change});}
  if(change==='source')writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'focused.txt'),'external');
  if(change==='epoch'){const p=s.app.store.get('session-permission',s.session.id);s.app.store.update('session-permission',p.id,p.version,{epoch:p.epoch+1});}
  if(change==='approval')s.app.approvals.stale(id);
  if(change==='protected')configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'FOCUSED_SECRET',value:input.content},'focused-secret');
  if(change==='protection-unavailable')writeFileSync(join(s.dir,'model-connections.json'),'{broken');
  const before=s.app.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY rowid').all(),tools=new ToolDispatcher(s.app),names=tools.definitions('coordinator',false,s.session.id,false,false,id).map(t=>t.name);
  assert.equal(names.includes('session_action_execute'),change==='valid',change);assert.ok(names.includes('session_action_inspect'));assert.equal(names.includes('task_context_read'),false);
  assert.deepEqual(s.app.store.db.prepare('SELECT kind,id,version,data FROM records ORDER BY rowid').all(),before,change+' catalog is read-only');
  assert.ok(tools.definitions('coordinator',false,s.session.id).some(t=>t.name==='session_action_execute'),'ordinary human catalog remains unchanged');
  assert.ok(tools.definitions('coordinator',false,undefined,false,false,id).some(t=>t.name==='session_action_execute'),'static preflight remains unchanged');
 }finally{s.close();}}
});

for(const operation of ['workspace_write','research_brief_save','artifact_create'])test(`F1 receipt race rejects bound ${operation} replay and preserves ordinary caller idempotency`,()=>{
 const s=fixture();let other;try{
  const a=actor(s),secret='receipt-race-protected-fixed-input',input=operation==='workspace_write'?{path:'fixed.txt',content:secret,expectedDigest:null}:operation==='research_brief_save'?{...brief,literatureSummary:secret}:{title:'Fixed text',content:secret},pending=prepare(s,a,operation,input);decide(s,pending);other=new ResearchApp(s.dir,process.cwd());
  const transaction=s.app.store.transaction.bind(s.app.store);let competed=false,competingResult,completedVersion,recordCount;
  s.app.store.transaction=fn=>{const nested=s.app.store.db.isTransaction,value=transaction(fn);if(!nested&&!competed){competed=true;configureEnvironment(other.context,USER,{action:'set',expectedVersion:0,name:'FIXED_RACE_SECRET',value:secret},'receipt-secret');competingResult=other.operations.execute(a,operation,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'ordinary-competing-call'});const completed=other.store.get('session-action',pending.id);assert.equal(completed.state,'completed');completedVersion=completed.version;recordCount=other.store.db.prepare('SELECT count(*) n FROM records').get().n;}return value;};
  let result,failure;try{result=call(s,a,'session_action_execute',{actionId:pending.id});}catch(error){failure=error;}
  const artifactBytes=operation==='artifact_create'?readFileSync(s.app.store.paths.physical(competingResult.path),'utf8'):undefined;
  assert.equal(failure?.code,'SESSION_ACTION_NOT_APPROVED',JSON.stringify({returnedResult:!!result,returnedMaskedArtifact:operation==='artifact_create'&&artifactBytes==='[REDACTED]',state:s.app.store.get('session-action',pending.id).state}));assert.equal(result,undefined);assert.equal(competed,true);
  assert.equal(s.app.store.get('session-action',pending.id).state,'completed');assert.equal(s.app.store.get('session-action',pending.id).version,completedVersion);assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,recordCount);assert.equal(s.app.store.list('session-action').length,1);
  if(operation==='workspace_write')assert.equal(readFileSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt'),'utf8'),secret);
  if(operation==='research_brief_save'){assert.equal(s.app.store.get('research-brief',competingResult.id).literatureSummary,secret);assert.equal(s.app.store.list('research-brief').length,1);}
  if(operation==='artifact_create'){assert.equal(artifactBytes,'[REDACTED]');assert.equal(s.app.store.list('artifact').length,1);}
  assert.deepEqual(other.operations.execute(a,operation,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:'ordinary-competing-call'}),competingResult);assert.equal(s.app.store.get('session-action',pending.id).state,'completed');
 }finally{other?.close();s.close();}
});

for(const stage of ['inspect','binding'])for(const protection of ['environment','model'])for(const operation of ['workspace_write','research_brief_save','artifact_create'])test(`F1 ${operation} rejects a ${protection} secret added by a second App after ${stage}`,()=>{
 const s=fixture();let other;try{
  const a=actor(s),secret='new-protected-fixed-input-12345',input=operation==='workspace_write'?{path:'fixed.txt',content:secret,expectedDigest:null}:operation==='research_brief_save'?{...brief,literatureSummary:secret}:{title:'Fixed text',content:secret},pending=prepare(s,a,operation,input);decide(s,pending);
  other=new ResearchApp(s.dir,process.cwd());let changed=false;const change=()=>{if(changed)return;assert.equal(s.app.store.db.isTransaction,false);changed=true;if(protection==='environment')configureEnvironment(other.context,USER,{action:'set',expectedVersion:0,name:'FIXED_RACE_SECRET',value:secret},'race-secret');else configureModelConnection(other.context,USER,{expectedVersion:0,provider:'fixed-race',name:'Fixed race',api:'openai-completions',baseUrl:'https://example.com/v1',apiKey:secret},'race-model');};
  if(stage==='inspect'){const inspect=s.app.sessionPermissions.inspectAction.bind(s.app.sessionPermissions);s.app.sessionPermissions.inspectAction=(...args)=>{const value=inspect(...args);assert.deepEqual(value.input,input);change();return value;};}
  else{const transaction=s.app.store.transaction.bind(s.app.store);s.app.store.transaction=fn=>{const nested=s.app.store.db.isTransaction,result=transaction(fn);if(!nested)change();return result;};}
  let result,failure;try{result=call(s,a,'session_action_execute',{actionId:pending.id});}catch(error){failure=error;}const observed={state:s.app.store.get('session-action',pending.id).state,artifactCount:s.app.store.list('artifact',s.project.id).length,briefCount:s.app.store.list('research-brief',s.project.id).length,...(operation==='artifact_create'&&result?{savedOriginalBytes:readFileSync(s.app.store.paths.physical(result.result.path),'utf8')===secret}:{})};
  assert.equal(failure?.code,'SESSION_ACTION_INPUT_PROTECTED',JSON.stringify(observed));assert.equal(changed,true);assert.equal(s.app.store.get('session-action',pending.id).state,'failed');assert.equal(s.app.store.list('session-action').length,1);assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(s.app.store.list('research-brief',s.project.id).length,0);assert.equal(s.app.store.get('session',s.session.id).researchBriefId,undefined);assert.equal(existsSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt')),false);assert.equal(existsSync(join(s.dir,'artifacts')),false);
 }finally{other?.close();s.close();}
});

test('F1 detectable out-of-band artifact masking never publishes changed approved bytes',()=>{
 const s=fixture();try{
  const a=actor(s),secret='temporary-protected-fixed-input',input={title:'Original title',content:secret},pending=prepare(s,a,'artifact_create',input);decide(s,pending);const file=join(s.dir,'environment-variables.json'),prepareArtifact=s.app.evidence.prepareArtifact.bind(s.app.evidence);
  s.app.evidence.prepareArtifact=(...args)=>{assert.equal(s.app.store.db.isTransaction,true);writeFileSync(file,JSON.stringify({version:1,variables:{FIXED_RACE_SECRET:secret},history:[secret]}));try{return prepareArtifact(...args);}finally{unlinkSync(file);}};
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'SESSION_ACTION_BYTES_CHANGED'});assert.equal(s.app.store.get('session-action',pending.id).state,'failed');assert.equal(s.app.store.list('artifact',s.project.id).length,0);assert.equal(s.app.store.list('session-action').length,1);
  // Existing CAS staging may leave an unreferenced masked blob; rollback does not delete shared blobs.
  assert.equal(existsSync(join(s.dir,'artifacts')),true);
 }finally{s.close();}
});

test('F1 a detected out-of-band protection change after a physical write rolls back the file',()=>{
 const s=fixture();try{
  const a=actor(s),secret='out-of-band-protected-fixed-input',input={path:'fixed.txt',content:secret,expectedDigest:null},pending=prepare(s,a,'workspace_write',input);decide(s,pending);const write=s.app.store.textWrites.write.bind(s.app.store.textWrites);
  s.app.store.textWrites.write=(...args)=>{write(...args);writeFileSync(join(s.dir,'environment-variables.json'),JSON.stringify({version:1,variables:{FIXED_RACE_SECRET:secret},history:[secret]}));};
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'SESSION_ACTION_INPUT_PROTECTED'});assert.equal(existsSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt')),false);assert.equal(s.app.store.get('session-action',pending.id).state,'failed');assert.equal(s.app.store.list('session-action').length,1);
 }finally{s.close();}
});

test('actionId execution saves all three frozen text operations once, without copying model-drifted input',()=>{
 for(const operation of ['workspace_write','research_brief_save','artifact_create']){const s=fixture();try{
  let a=actor(s);const content='Pipeline\n3. 中文固定文本 🔬 "quoted" \\ exact\n'.repeat(350),input=operation==='workspace_write'?{path:'README.md',content,expectedDigest:null}:operation==='research_brief_save'?{...brief,literatureSummary:content.slice(0,7500)}:{title:'Fixed text',content};
  const pending=prepare(s,a,operation,input);decide(s,pending);
  const drift=structuredClone(input),field=operation==='research_brief_save'?'literatureSummary':'content';drift[field]=drift[field].replace('3.','3');const changed=prepare(s,a,operation,drift);assert.notEqual(changed.id,pending.id);
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());a=actor(s);
  const saved=call(s,a,'session_action_execute',{actionId:pending.id},'execute-fixed');assert.equal(saved.actionId,pending.id);assert.equal(saved.operation,operation);validateSchema(OUTPUT_SCHEMAS.session_action_execute,saved,'output');assert.throws(()=>validateSchema(OUTPUT_SCHEMAS.session_action_execute,{...saved,unexpected:true},'output'));
  if(operation==='workspace_write')assert.equal(readFileSync(join(s.app.store.paths.physical(s.session.workspace),'README.md'),'utf8'),input.content);
  if(operation==='research_brief_save')assert.equal(s.app.store.get('research-brief',saved.result.id).literatureSummary,input.literatureSummary);
  if(operation==='artifact_create')assert.equal(readFileSync(s.app.store.paths.physical(saved.result.path),'utf8'),input.content);
  assert.equal(s.app.store.get('session-action',pending.id).state,'completed');assert.equal(s.app.store.get('session-action',changed.id).state,'pending');
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id},'execute-fixed'),{code:'SESSION_ACTION_NOT_APPROVED'});assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id},'another-call'),{code:'SESSION_ACTION_NOT_APPROVED'});
 }finally{s.close();}}
});

test('actionId execution keeps scope, mode, approval, source, whitelist and input safety fences',()=>{
 const errors={source:'SESSION_ACTION_STALE',mode:'SESSION_READ_ONLY',revoke:'SESSION_ACTION_NOT_APPROVED',pending:'SESSION_ACTION_NOT_APPROVED',rejected:'SESSION_ACTION_NOT_APPROVED',unknown:'SESSION_ACTION_NOT_APPROVED',large:'SESSION_ACTION_INPUT_TOO_LARGE',protected:'SESSION_ACTION_INPUT_PROTECTED',network:'SESSION_ACTION_EXECUTION_DENIED','other-session':'SCOPE_DENIED',user:'TASK_SCOPE_DENIED',wakeup:'AUTOMATION_TOOL_DENIED',lease:'LEASE_EXPIRED',task:'SCOPE_DENIED',project:'SCOPE_DENIED',generation:'LEASE_EXPIRED'};
 for(const change of Object.keys(errors)){const s=fixture();try{
  let a=actor(s);const input={path:'fixed.txt',content:change==='large'?'汉'.repeat(44000):change==='protected'?'private-fixed-token':'fixed',expectedDigest:null},operation=change==='network'?'literature_search':'workspace_write';
  if(change==='protected')configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'REPLAY_SECRET',value:input.content},'secret');
  const pending=prepare(s,a,operation,change==='network'?{query:'fixed research'}:input);if(change!=='pending')decide(s,pending,change!=='rejected');
  if(change==='source')writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt'),'external');
  if(change==='mode'){const p=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});a=actor(s);}
  if(change==='revoke')s.app.approvals.stale(pending.id);
  if(change==='unknown'){const row=s.app.store.get('session-action',pending.id);s.app.store.update('session-action',row.id,row.version,{state:'unknown'});}
  if(change==='other-session')a=actor(s,s.app.sessions.create(USER,s.project.id,{}).id);
  if(change==='user')a={...a,type:'user'};
  if(change==='wakeup')a={...a,wakeupId:'unrelated'};
  if(change==='task')a={...a,taskId:'unrelated'};
  if(change==='project')a={...a,projectId:s.app.projects.create(USER,{name:'Other project',template:'curve-fit'}).id};
  if(change==='generation')a={...a,generation:a.generation-1};
  if(change==='lease'){const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{leaseUntil:0});}
  const count=s.app.store.list('session-action').length;assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:errors[change]},change);assert.equal(s.app.store.list('session-action').length,count,change);assert.notEqual(s.app.store.get('session-action',pending.id).state,'completed',change);assert.equal(existsSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt')),change==='source',change);
 }finally{s.close();}}
});

test('actionId execution preserves expectedDigest and persists a failed underlying save without retry',()=>{
 const s=fixture();try{const a=actor(s),path=join(s.app.store.paths.physical(s.session.workspace),'fixed.txt');writeFileSync(path,'existing');const pending=prepare(s,a,'workspace_write',{path:'fixed.txt',content:'replacement',expectedDigest:null});decide(s,pending);
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'FILE_VERSION_CONFLICT'});assert.equal(readFileSync(path,'utf8'),'existing');assert.equal(s.app.store.get('session-action',pending.id).state,'failed');assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'SESSION_ACTION_NOT_APPROVED'});
 }finally{s.close();}
});

test('fixed execution binding cannot be supplied through tool input, actor fields or HTTP, and source races create no replacement approval',()=>{
 const s=fixture();try{const a=actor(s),input={path:'fixed.txt',content:'approved',expectedDigest:null},pending=prepare(s,a,'workspace_write',input);decide(s,pending);
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id,input:{...input,content:'changed'}}),{code:'INVALID_INPUT'});
  assert.throws(()=>call(s,{...a,approvedActionId:pending.id,permissionActionId:pending.id},'session_action_execute',{actionId:'not-an-action'}),{code:'NOT_FOUND'});
  assert.throws(()=>operationRoute(s.app,'/operations/session_action_execute',{projectId:s.project.id,sessionId:s.session.id,input:{actionId:pending.id},approvedActionId:pending.id},'http-bind',new AbortController().signal,'POST',''),{code:'INVALID_INPUT'});
  assert.throws(()=>operationRoute(s.app,'/operations/session_action_execute',{projectId:s.project.id,sessionId:s.session.id,input:{actionId:pending.id}},'http-user',new AbortController().signal,'POST',''),{code:'TASK_SCOPE_DENIED'});
  const guard=s.app.sessionPermissions.guard.bind(s.app.sessionPermissions),path=join(s.app.store.paths.physical(s.session.workspace),'fixed.txt');s.app.sessionPermissions.guard=(actor,name,x,key)=>{if(name==='workspace_write')writeFileSync(path,'external change');return guard(actor,name,x,key);};
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'APPROVAL_STALE'});assert.equal(s.app.store.list('session-action').length,1);assert.equal(s.app.store.get('session-action',pending.id).state,'approved');assert.equal(readFileSync(path,'utf8'),'external change');
 }finally{s.close();}
});

test('fixed execution rechecks source after binding and rolls back a failed physical write',()=>{
 for(const failure of ['after-binding','after-write']){const s=fixture();try{
  const a=actor(s),input={path:'fixed.txt',content:'approved',expectedDigest:null},pending=prepare(s,a,'workspace_write',input),path=join(s.app.store.paths.physical(s.session.workspace),'fixed.txt');decide(s,pending);
  if(failure==='after-binding'){const validate=s.app.sessionPermissions.validate.bind(s.app.sessionPermissions);let checks=0;s.app.sessionPermissions.validate=(...args)=>{if(++checks===3)writeFileSync(path,'external change');return validate(...args);};}
  else{const write=s.app.store.textWrites.write.bind(s.app.store.textWrites);s.app.store.textWrites.write=(...args)=>{write(...args);throw new Error('isolated physical write failure');};}
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),failure==='after-binding'?{code:'APPROVAL_STALE'}:/isolated physical write failure/);
  assert.equal(s.app.store.get('session-action',pending.id).state,'failed');assert.equal(s.app.store.list('session-action').length,1);assert.equal(existsSync(path),failure==='after-binding');if(failure==='after-binding')assert.equal(readFileSync(path,'utf8'),'external change');
  assert.throws(()=>call(s,a,'session_action_execute',{actionId:pending.id}),{code:'SESSION_ACTION_NOT_APPROVED'});
 }finally{s.close();}}
});

test('approved long inputs are read exactly after reopen and execute once; changed inputs remain unapproved',()=>{
 const s=fixture();try{
  let a=actor(s);const pending=prepare(s,a,'research_brief_save',brief);
  assert.equal(call(s,a,'session_action_inspect',{actionId:pending.id},'inspect').input,null);
  decide(s,pending);const notice=s.app.sessions.messages(USER,s.session.id).filter(m=>m.approvalNoticeId===pending.id).at(-1);
  assert.match(notice.content,/session_action_inspect/);assert.ok(notice.content.length<1000);assert.ok(!notice.content.includes(brief.literatureSummary));
  s.app.close();s.app=new ResearchApp(s.dir,process.cwd());a=actor(s);
  const read=call(s,a,'session_action_inspect',{actionId:pending.id},'inspect');assert.equal(read.blockedReason,null);assert.equal(read.operation,'research_brief_save');assert.deepEqual(read.input,brief);
  const changed={...read.input,literatureSummary:read.input.literatureSummary.replace('AC-OPF','ACN-OPF')};const drift=prepare(s,a,read.operation,changed);assert.notEqual(drift.id,pending.id);assert.equal(s.app.store.list('research-brief').length,0);
  const saved=call(s,a,read.operation,read.input,'fixed-call');assert.equal(saved.literatureSummary,brief.literatureSummary);assert.equal(call(s,a,read.operation,read.input,'fixed-call').id,saved.id);assert.equal(s.app.store.list('research-brief').length,1);
  const consumed=call(s,a,'session_action_inspect',{actionId:pending.id},'inspect');assert.equal(consumed.state,'completed');assert.equal(consumed.input,null);assert.equal(consumed.blockedReason,'SESSION_ACTION_NOT_APPROVED');
 }finally{s.close();}
});

test('fixed input readback denies other sessions, automation, stale source, epochs, revoked approval and uncertain effects',()=>{
 for(const change of ['source','epoch','approval','rejected','failed','unknown','executing']){const s=fixture();try{
  let a=actor(s);const pending=prepare(s,a,'workspace_write',{path:'fixed.txt',content:'fixed',expectedDigest:null});decide(s,pending,change!=='rejected');
  const other=s.app.sessions.create(USER,s.project.id,{}),otherActor=actor(s,other.id);assert.throws(()=>call(s,otherActor,'session_action_inspect',{actionId:pending.id}),{code:'SCOPE_DENIED'});
  const tools=new ToolDispatcher(s.app);assert.ok(tools.definitions('coordinator').some(t=>t.name==='session_action_inspect'));assert.ok(!tools.definitions('coordinator',true).some(t=>t.name==='session_action_inspect'));assert.ok(!tools.definitions('implementer').some(t=>t.name==='session_action_inspect'));
  if(change==='source')writeFileSync(join(s.app.store.paths.physical(s.session.workspace),'fixed.txt'),'external');
  if(change==='epoch'){const p=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'confirm',expectedVersion:p.version,expectedHostVersion:p.hostAccess.version});a=actor(s);}
  if(change==='approval')s.app.approvals.stale(pending.id);
  if(['failed','unknown','executing'].includes(change)){const row=s.app.store.get('session-action',pending.id);s.app.store.update('session-action',row.id,row.version,{state:change});}
  const before=s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,read=call(s,a,'session_action_inspect',{actionId:pending.id});assert.equal(read.input,null,change);assert.ok(read.blockedReason,change);assert.equal(s.app.store.db.prepare('SELECT count(*) n FROM records').get().n,before);
 }finally{s.close();}}
});

test('oversize and protected fixed inputs are blocked whole, without changing their stored values',()=>{
 for(const kind of ['large','environment','model']){const s=fixture();try{
  const secret='fixed-sensitive-quote-"-value',content=kind==='large'?'汉'.repeat(44000):secret;
  if(kind==='environment')configureEnvironment(s.app.context,USER,{action:'set',expectedVersion:0,name:'REPLAY_SECRET',value:secret},'secret');
  if(kind==='model')writeFileSync(join(s.dir,'model-connections.json'),JSON.stringify({version:1,connections:[{provider:'fixed',name:'Fixed',api:'openai-completions',baseUrl:'https://example.com/v1',apiKey:secret}]}));
  const a=actor(s),input={path:'private.txt',content,expectedDigest:null},pending=prepare(s,a,'workspace_write',input);decide(s,pending);
  const read=call(s,a,'session_action_inspect',{actionId:pending.id});assert.equal(read.input,null);assert.equal(read.blockedReason,kind==='large'?'SESSION_ACTION_INPUT_TOO_LARGE':'SESSION_ACTION_INPUT_PROTECTED');assert.ok(!JSON.stringify(read).includes(secret));assert.deepEqual(s.app.store.get('session-action',pending.id).input,input);
 }finally{s.close();}}
});

for(const mode of ['inspect','execute'])test(`real Pi approval notice uses fixed ${mode} through the advertised tool`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-action-replay-http-')),requests=[],calls=[];let replayed;
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const part of req)body+=part;const request=JSON.parse(body);requests.push(request);const last=request.messages.at(-1);let tool;
  if(last?.role!=='tool'){
   const notice=JSON.stringify(last),match=notice.match(/固定操作 ([a-f0-9]{64})/);
   tool=match?{name:'session_action_'+mode,input:{actionId:match[1]}}:{name:'research_brief_save',input:brief};
  }else if(request.messages.at(-2)?.tool_calls?.[0]?.function?.name==='session_action_inspect'){
   const fixed=JSON.parse(last.content);assert.equal(fixed.blockedReason,null);replayed=fixed.input;tool={name:fixed.operation,input:fixed.input};
  }
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'fixed-'+requests.length,object:'chat.completion.chunk',created:1,model:request.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  if(tool){calls.push(tool);chunk({role:'assistant',tool_calls:[{index:0,id:'fixed-call-'+requests.length,type:'function',function:{name:tool.name,arguments:JSON.stringify({input:tool.input})}}]});chunk({},'tool_calls');}else{chunk({role:'assistant',content:'Fixture finished.'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
 const service=createHttpServer({dataDir:join(dir,'data'),repoRoot:process.cwd(),port:0});writeFileSync(join(dir,'data','models.json'),JSON.stringify({providers:{'fixed-replay':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:4096}]}}}));const priorKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{
  const port=await service.listen(),base=`http://127.0.0.1:${port}/api`,call=async(path,body,key=crypto.randomUUID())=>{const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:body===undefined?{}:{'content-type':'application/json','idempotency-key':key},...(body===undefined?{}:{body:JSON.stringify(body)})});const value=await res.json();assert.equal(res.status,200,JSON.stringify(value));return value;};
  const complete=async(id)=>{const end=Date.now()+25000;while(Date.now()<end){const m=service.app.store.get('message',id);if(['completed','failed'].includes(m.status)&&!service.host.active.has(m.sessionId)){assert.equal(m.status,'completed',m.error);return;}await delay(25);}throw new Error('Fixed approval turn timed out');};
  await call('/settings/model',{provider:'fixed-replay',model:'fixture',thinking:'off'});const project=await call('/projects',{name:'Fixed replay HTTP'}),root=await call('/sessions',{projectId:project.id}),first=await call(`/sessions/${root.id}/messages`,{content:'Prepare the fixed plan'});await complete(first.id);
  const pending=(await call(`/sessions/${root.id}/permissions`)).actions.at(-1);assert.equal(pending.state,'pending');assert.equal(service.app.store.list('research-brief').length,0);
  await call(`/sessions/${root.id}/permission-actions/${pending.id}/decide`,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved:true},'decide-once');const follow=service.app.sessions.messages(USER,root.id).filter(m=>m.approvalNoticeId===pending.id).at(-1);await complete(follow.id);
  if(mode==='inspect')assert.deepEqual(replayed,brief);else{assert.deepEqual(calls.map(c=>c.name),['research_brief_save','session_action_execute']);assert.deepEqual(calls[1].input,{actionId:pending.id});}
  assert.equal(service.app.store.list('research-brief').length,1);assert.equal(service.app.store.list('research-brief')[0].literatureSummary,brief.literatureSummary);assert.equal(service.app.store.get('session-action',pending.id).state,'completed');
  assert.ok(requests.some(r=>r.tools.some(t=>t.function.name==='session_action_'+mode)));await call(`/sessions/${root.id}/permission-actions/${pending.id}/decide`,{expectedVersion:pending.version,expectedApprovalVersion:pending.approval.version,approved:true},'decide-once');assert.equal(service.app.store.list('research-brief').length,1);
 }finally{if(priorKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=priorKey;await service.close();await new Promise(r=>fixture.close(r));rmSync(dir,{recursive:true,force:true});}
});

test('resumed real Pi network approval hides fixed text execution on every SDK request beside another approved text action',async()=>{
 const s=fixture(),requests=[],calls=[],input={query:'fixed offline V2G evidence',limit:2};let actionId,replayed;
 const server=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const request=JSON.parse(body);requests.push(request);let tool;
  if(actionId){const last=request.messages.at(-1);if(last?.role!=='tool')tool={name:'session_action_inspect',input:{actionId}};else if(request.messages.at(-2)?.tool_calls?.[0]?.function?.name==='session_action_inspect'){const fixed=JSON.parse(last.content);replayed=fixed.input;tool={name:fixed.operation,input:fixed.input};}}
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write(`data: ${JSON.stringify({id:'network-'+requests.length,object:'chat.completion.chunk',created:1,model:request.model,choices:[{index:0,delta,finish_reason}]})}\n\n`);
  if(tool){calls.push(tool);chunk({role:'assistant',tool_calls:[{index:0,id:'network-call-'+requests.length,type:'function',function:{name:tool.name,arguments:JSON.stringify({input:tool.input})}}]});chunk({},'tool_calls');}else{chunk({role:'assistant',content:'Offline fixture completed.'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 writeFileSync(join(s.dir,'models.json'),JSON.stringify({providers:{'offline-network':{api:'openai-completions',baseUrl:`http://127.0.0.1:${server.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:4096}]}}}));
 const row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{model:{provider:'offline-network',model:'fixture',thinking:'off'}});
 const {AgentHost}=await import('../../dist/packages/scheduler/agent-host.js'),{fork}=await import('node:child_process');const host=new AgentHost(s.app,{fork:(entry,args,options)=>fork(entry,args,{...options,env:{...options.env,PI_API_KEY:undefined,PI_OFFLINE:'1'}})});
 const complete=async()=>{const end=Date.now()+25000;while(Date.now()<end){if(!host.active.size)return;await delay(15);}throw Error('network approval fixture timed out');};
 try{
  const first=s.app.sessions.send(USER,row.id,{content:'Create a persistent native history'});host.tick();await complete();assert.equal(s.app.store.get('message',first.id).status,'completed');const nativePath=s.app.store.get('session',row.id).piSessionPath;assert.ok(nativePath);
  const a=actor(s),network=prepare(s,a,'literature_search',input),text=prepare(s,a,'artifact_create',{title:'Neighbor text',content:'must remain approved'});decide(s,network);decide(s,text);
  const textNotice=s.app.sessions.messages(USER,row.id).find(m=>m.approvalNoticeId===text.id);s.app.sessions.queueAction(USER,row.id,{messageId:textNotice.id,expectedVersion:textNotice.version,action:'cancel'});
  const current=s.app.store.get('session',row.id);s.app.store.update('session',row.id,current.version,{state:'queued',leaseUntil:0});
  s.app.literature.search=async(projectId,query,limit,key,validate)=>{validate?.();assert.equal(projectId,s.project.id);assert.equal(query,input.query);assert.equal(limit,input.limit);return s.app.store.create('literature-search',projectId,{query,source:'crossref',retrievedAt:new Date().toISOString(),coverage:'metadata-only',items:[]});};
  actionId=network.id;const start=requests.length;host.tick();const active=host.active.get(row.id);await complete();
  assert.deepEqual(replayed,input);assert.deepEqual(calls.map(c=>c.name),['session_action_inspect','literature_search']);assert.equal(s.app.store.get('session-action',network.id).state,'completed');assert.equal(s.app.store.get('session-action',text.id).state,'approved');assert.equal(s.app.store.get('session',row.id).piSessionPath,nativePath);
  const resumed=requests.slice(start);assert.equal(resumed.length,3);for(const request of resumed){assert.equal(request.tools.some(t=>t.function.name==='session_action_execute'),false);assert.ok(request.tools.some(t=>t.function.name==='session_action_inspect'));assert.doesNotMatch(JSON.stringify(request.messages.filter(m=>m.role==='system')),/session_action_execute/);}
  assert.equal(active.currentMessageId,null,'approval input is never an ordinary research origin');
 }finally{await host.stop();server.closeAllConnections();await new Promise(r=>server.close(r));s.close();}
});
