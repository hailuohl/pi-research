import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,chmodSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {pmcDocument} from '../support/pmc-corpus.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

function agent(s,content='Handle existing research'){
 const old=s.app.store.get('session',s.session.id),session=s.app.store.update('session',old.id,old.version,{state:'running',generation:old.generation+1,leaseUntil:Date.now()+120000});
 const message=s.app.store.create('message',s.project.id,{sessionId:session.id,role:'user',content,mode:'prompt',status:'running',generation:session.generation});
 return {type:'agent',projectId:s.project.id,sessionId:session.id,role:'coordinator',generation:session.generation,messageId:message.id,researchModelDigest:s.app.researchAutomation.modelIdentity(session)};
}
const op=(s,actor,name,input,key='key-'+name)=>s.app.operations.execute(actor,name,input,{projectId:s.project.id,sessionId:s.session.id,idempotencyKey:key});
const prepare=(s,who,input,key='prepare')=>op(s,who,'research_action_prepare',input,key);
const decide=(s,request,decision,key='decide')=>op(s,USER,'research_action_decide',{requestId:request.id,expectedVersion:1,decision},key);
function claim(s){const a=s.app.evidence.put(s.project.id,'original.txt',Buffer.from('Synthetic exact original statement'),'text/plain','user'),e=s.app.evidence.register(USER,s.project.id,a.id,0,9,'Synthetic evidence');return s.app.evidence.proposeClaim(USER,s.project.id,'Synthetic claim',[e.id],['Only a unit fixture']);}
function textGrant(s){const d=pmcDocument(s);s.app.textEvidence.configure(USER,s.project.id,{enabled:true,documents:[],pmcDocuments:[{documentVersionId:d.id}],expectedVersion:0});return {d,input:{kind:'text_grant',textGrant:{documents:[],pmcDocuments:[{documentVersionId:d.id}],maxSearches:1,expiresAt:new Date(Date.now()+3600000).toISOString()}}};}
const history={kind:'history',history:{kind:'reports'}};
function keys(r){assert.deepEqual(Object.keys(r).sort(),['id','sessionId','kind','state','effectiveState','expiresAt',...(r.resultRef?['resultRef']:[])].sort());}

test('preparation saves one card with no business side effects and cached refusal never revives pending',()=>{const s=setup();try{
 const who=agent(s),c=claim(s),input={kind:'claim_decision',claim:{claimId:c.id,expectedVersion:c.version}},before={grants:s.app.store.list('text-corpus-grant').length,approvals:s.app.store.list('approval').length,reports:s.app.store.list('report').length};
 const r=prepare(s,who,input);keys(r);assert.equal(s.app.store.get('claim',c.id).status,'proposal');assert.deepEqual(before,{grants:s.app.store.list('text-corpus-grant').length,approvals:s.app.store.list('approval').length,reports:s.app.store.list('report').length});
 assert.equal(prepare(s,who,input,'other-call').id,r.id);assert.equal(s.app.store.list('research-action').length,1);
 const closed=decide(s,r,'dismiss');assert.equal(closed.state,'rejected');assert.equal(prepare(s,who,input).state,'rejected');assert.equal(prepare(s,who,input,'third-call').state,'rejected');
 const later=agent(s,'Please reconsider this claim');assert.notEqual(prepare(s,later,input,'new-origin').id,r.id);assert.throws(()=>prepare(s,later,input),{code:'IDEMPOTENCY_CONFLICT'});
}finally{s.close();}});

test('USER claim decisions and report composition preserve exact summaries and reopen history',()=>{const s=setup();let reopened;try{
 const who=agent(s),c=claim(s),r=prepare(s,who,{kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}});assert.throws(()=>op(s,who,'research_action_decide',{requestId:r.id,expectedVersion:1,decision:'accepted'}),{code:'TOOL_DENIED'});
 const accepted=decide(s,r,'accepted');assert.equal(accepted.state,'completed');assert.equal(s.app.store.get('claim',c.id).status,'accepted');assert.deepEqual(decide(s,r,'accepted'),accepted);assert.throws(()=>decide(s,r,'disputed','changed'),{code:'RESEARCH_ACTION_ALREADY_DECIDED'});
 const report=prepare(s,who,{kind:'report_compose',report:{title:'Fixed record',runIds:[],claimIds:[c.id],publicationResultIds:[]}},'compose');assert.equal(s.app.store.list('report').length,0);
 const ready=decide(s,report,'confirm','compose-confirm');keys(ready);assert.deepEqual(Object.keys(ready.resultRef),['reportId']);assert.equal(s.app.store.list('report').length,1);assert.deepEqual(decide(s,report,'confirm','compose-confirm'),ready);assert.equal(s.app.store.list('report').length,1);
 reopened=new ResearchApp(s.dir,process.cwd());const list=reopened.researchActions.list(USER,s.project.id,s.session.id);assert.equal(list.length,2);assert.equal(list.find(x=>x.id===report.id).resultRef.reportId,ready.resultRef.reportId);
 const record=reopened.store.get('report',ready.resultRef.reportId),read=reopened.evidence.read(USER,record.artifactId);assert.match(read.bytes.toString('utf8'),/Synthetic claim/);
}finally{reopened?.close();s.close();}});

test('rejected and disputed claims use existing decisions; report reject and history dismiss are inert',()=>{const s=setup();try{
 const who=agent(s);for(const decision of ['rejected','disputed']){const c=claim(s),r=prepare(s,who,{kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}},'claim-'+decision);decide(s,r,decision,decision);assert.equal(s.app.store.get('claim',c.id).status,decision);}
 const c=claim(s),r=prepare(s,who,{kind:'report_compose',report:{title:'Reject',runIds:[],claimIds:[c.id],publicationResultIds:[]}},'reject-report');assert.equal(decide(s,r,'reject','reject').state,'rejected');assert.equal(s.app.store.list('report').length,0);
 const h=prepare(s,who,history,'history');assert.throws(()=>decide(s,h,'confirm','bad-history'),{code:'INVALID_INPUT'});assert.equal(decide(s,h,'dismiss','dismiss').state,'rejected');
 assert.throws(()=>prepare(s,who,{kind:'report_compose',report:{title:'Empty',runIds:[],claimIds:[],publicationResultIds:[]}},'empty'),{code:'REPORT_EMPTY'});
}finally{s.close();}});

test('text request stays metadata-only, USER grants exact scope, and another grant cannot replace it',()=>{const s=setup();try{
 const {d,input}=textGrant(s),who=agent(s),r=prepare(s,who,input);keys(r);assert.equal(s.app.store.list('text-corpus-grant').length,0);assert.equal(s.app.store.list('approval').length,0);
 const active=decide(s,r,'confirm');keys(active);assert.deepEqual(Object.keys(active.resultRef),['grantId']);assert.equal(s.app.store.get('session',s.session.id).textCorpusGrantId,active.resultRef.grantId);assert.equal(s.app.store.get('approval',s.app.store.get('text-corpus-grant',active.resultRef.grantId).approvalId).status,'approved');
 assert.deepEqual(decide(s,r,'confirm'),active);assert.equal(s.app.store.list('text-corpus-grant').length,1);assert.equal(s.app.store.list('approval').length,1);
 assert.throws(()=>op(s,who,'artifact_read',{artifactId:d.derivedText.artifactId},'raw'),{code:'PMC_OWNER_ONLY'});const e=s.app.evidence.register(USER,s.project.id,d.derivedText.artifactId,0,10,'Old owner quote');assert.throws(()=>op(s,who,'evidence_read',{evidenceId:e.id},'unreturned'),{code:'PMC_OWNER_ONLY'});
 const other=agent(s,'Extend the scope');assert.throws(()=>prepare(s,other,input,'replacement'),{code:'TEXT_GRANT_SESSION_REQUIRED'});assert.equal(s.app.store.list('text-corpus-grant').length,1);
}finally{s.close();}});

test('preparing a text card never reads bytes; failed confirmation rolls back all business rows',()=>{const s=setup();try{
 const {d,input}=textGrant(s),who=agent(s),path=s.app.store.paths.physical(s.app.store.get('artifact',d.derivedText.artifactId).path);chmodSync(path,0o600);writeFileSync(path,'corrupted text');
 const r=prepare(s,who,input);assert.equal(r.effectiveState,'pending');assert.throws(()=>decide(s,r,'confirm'));assert.equal(s.app.store.get('research-action',r.id).state,'pending');assert.equal(s.app.store.list('text-corpus-grant').length,0);assert.equal(s.app.store.list('approval').length,0);assert.equal(s.app.store.get('session',s.session.id).textCorpusGrantId,undefined);
}finally{s.close();}});

test('disabled text sources invalidate the exact card but USER can close it',()=>{const s=setup();try{
 const {input}=textGrant(s),who=agent(s),r=prepare(s,who,input),configuration=s.app.textEvidence.status(USER,s.project.id);
 s.app.textEvidence.configure(USER,s.project.id,{enabled:false,expectedVersion:configuration.version});assert.equal(prepare(s,who,input).effectiveState,'stale');assert.throws(()=>decide(s,r,'confirm'),{code:'RESEARCH_ACTION_STALE'});assert.equal(s.app.store.list('text-corpus-grant').length,0);assert.equal(decide(s,r,'reject','close-disabled').state,'rejected');
}finally{s.close();}});

test('fullAccess text confirmation records only its own permission transition; external epochs still fence replay',()=>{const s=setup();try{
 const {input}=textGrant(s);s.app.sessionPermissions.initialize(s.session.id,'confirm');s.app.hostAccess.enable(USER,s.session.id,{expectedVersion:0,acknowledgedSameUserAccess:true});
 const who=agent(s),r=prepare(s,who,input);assert.equal(s.app.store.get('research-action',r.id).permissionReference.mode,'fullAccess');
 const done=decide(s,r,'confirm','full-click'),stored=s.app.store.get('research-action',r.id);assert.equal(done.effectiveState,'completed');assert.equal(stored.completionPermissionReference.mode,'confirm');assert.equal(stored.completionPermissionReference.epoch,stored.permissionReference.epoch);assert.equal(stored.completionPermissionReference.hostEpoch,stored.permissionReference.hostEpoch);assert.deepEqual(decide(s,r,'confirm','full-click'),done);assert.equal(s.app.store.list('text-corpus-grant').length,1);
 const status=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'autoEdit',expectedVersion:status.version,expectedHostVersion:status.hostAccess.version});assert.equal(s.app.researchActions.list(USER,s.project.id,s.session.id)[0].effectiveState,'stale');assert.throws(()=>decide(s,r,'confirm','full-click'),{code:'RESEARCH_ACTION_STALE'});assert.equal(s.app.store.list('text-corpus-grant').length,1);
}finally{s.close();}});

test('cross-project/root, task, wakeup, removed and special messages cannot prepare or consume cards',()=>{const s=setup();try{
 const who=agent(s),r=prepare(s,who,history),other=s.app.sessions.create(USER,s.project.id,{}),p=s.app.projects.create(USER,{name:'Other'});
 assert.throws(()=>s.app.operations.execute(USER,'research_action_decide',{requestId:r.id,expectedVersion:1,decision:'dismiss'},{projectId:s.project.id,sessionId:other.id,idempotencyKey:'other-root'}),{code:'SCOPE_DENIED'});
 assert.throws(()=>s.app.researchActions.list(USER,p.id,s.session.id),{code:'SCOPE_DENIED'});
 assert.throws(()=>s.app.researchActions.inspect(who,s.project.id,other.id,r.id),{code:'TASK_SCOPE_DENIED'});
 for(const flags of [{wakeupId:'wake'},{taskId:'task',attemptId:'attempt'},{continuationId:'continuation'},{approvalResumeId:'approval'}])assert.throws(()=>s.app.researchActions.prepare({...who,...flags},s.project.id,s.session.id,history),{code:'TASK_SCOPE_DENIED'});
 for(const patch of [{role:'system'},{origin:'automation'},{wakeupId:'wake'},{approvalNoticeId:'approval'},{queueRemoved:true}]){const old=s.app.store.get('message',who.messageId);s.app.store.update('message',old.id,old.version,patch);assert.throws(()=>prepare(s,who,history,'special-'+JSON.stringify(patch)),{code:'RESEARCH_ACTION_ORIGIN_REQUIRED'});s.app.store.update('message',old.id,old.version+1,{role:'user',origin:undefined,wakeupId:undefined,approvalNoticeId:undefined,queueRemoved:undefined});}
 const definitions=new ToolDispatcher(s.app);assert.ok(definitions.definitions('coordinator').some(x=>x.name==='research_action_prepare'));assert.ok(!definitions.definitions('coordinator').some(x=>x.name==='research_action_decide'));for(const mode of [[true,false,false],[true,true,false],[true,false,true]])assert.ok(!definitions.definitions('coordinator',mode[0],s.session.id,mode[1],mode[2]).some(x=>x.name.startsWith('research_action_')));
}finally{s.close();}});

test('ordinary coordinator branches prepare their own cards and cannot read or consume the original dialogue card',()=>{const s=setup();try{
 const who=agent(s),original=prepare(s,who,history),branch=s.app.sessions.branch(USER,s.session.id,who.messageId),b={...s,session:branch},branchActor=agent(b,'Read branch history');
 assert.deepEqual(s.app.researchActions.list(USER,s.project.id,branch.id),[]);const own=prepare(b,branchActor,history,'branch-prepare');assert.equal(own.sessionId,branch.id);assert.equal(s.app.researchActions.list(USER,s.project.id,branch.id).length,1);
 assert.throws(()=>op(b,branchActor,'research_action_inspect',{requestId:original.id},'branch-inspect'),{code:'SCOPE_DENIED'});assert.throws(()=>decide(b,original,'dismiss','branch-other'),{code:'SCOPE_DENIED'});assert.equal(decide(b,own,'dismiss','branch-close').state,'rejected');assert.equal(s.app.researchActions.list(USER,s.project.id,s.session.id)[0].state,'pending');
}finally{s.close();}});

test('readOnly refuses prepare while confirm/autoEdit save a request without a second approval',()=>{const s=setup();try{
 s.app.sessionPermissions.initialize(s.session.id,'confirm');let who=agent(s),r=prepare(s,who,history);assert.equal(r.state,'pending');assert.equal(s.app.store.list('session-action').length,0);assert.equal(s.app.store.list('approval').length,0);
 let status=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'autoEdit',expectedVersion:status.version});who=agent(s,'Auto edit request');assert.equal(prepare(s,who,history,'auto').state,'pending');assert.equal(s.app.store.list('session-action').length,0);
 status=s.app.sessionPermissions.status(USER,s.session.id);s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:status.version});who=agent(s,'Readonly request');assert.throws(()=>prepare(s,who,history,'read-only'),{code:'SESSION_READ_ONLY'});
}finally{s.close();}});

test('stale sources, model, policy, lifecycle and expiry fence decisions and cached state',()=>{for(const reason of ['source','model','policy','lifecycle','expiry']){const s=setup();try{
 const who=agent(s),c=claim(s),input={kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}},r=prepare(s,who,input);
 if(reason==='source')s.app.store.update('claim',c.id,c.version,{limitations:['changed']});
 if(reason==='model'){const old=s.app.store.get('session',s.session.id);s.app.store.update('session',old.id,old.version,{model:{...old.model,model:'changed'}});}
 if(reason==='policy')s.app.sessionPermissions.initialize(s.session.id,'confirm');
 if(reason==='lifecycle'){const p=s.app.store.get('project',s.project.id);s.app.store.update('project',p.id,p.version,{status:'archived'});s.app.store.update('project',p.id,p.version+1,{status:'active'});}
 if(reason==='expiry'){const row=s.app.store.get('research-action',r.id);s.app.store.update('research-action',r.id,row.version,{expiresAt:'2000-01-01T00:00:00Z'});}
 const dto=s.app.researchActions.list(USER,s.project.id,s.session.id)[0];assert.equal(dto.effectiveState,reason==='expiry'?'expired':'stale');assert.throws(()=>decide(s,r,'accepted'),{code:'RESEARCH_ACTION_STALE'});assert.equal(s.app.store.get('claim',c.id).status,'proposal');
 if(reason==='source'||reason==='expiry'){assert.equal(prepare(s,who,input).effectiveState,dto.effectiveState);assert.equal(op(s,who,'research_action_inspect',{requestId:r.id},'inspect').effectiveState,dto.effectiveState);}
}finally{s.close();}}});

test('old generation and expired leases reject Agent calls, but a normally ended session card remains valid',()=>{const s=setup();try{
 const who=agent(s),c=claim(s),r=prepare(s,who,{kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}}),row=s.app.store.get('session',s.session.id);s.app.store.update('session',row.id,row.version,{state:'idle',generation:row.generation+1,leaseUntil:0});
 const m=s.app.store.get('message',who.messageId);s.app.store.update('message',m.id,m.version,{status:'completed'});
 assert.throws(()=>prepare(s,who,history,'old-generation'),{code:'LEASE_EXPIRED'});assert.equal(s.app.researchActions.list(USER,s.project.id,s.session.id)[0].effectiveState,'pending');assert.equal(decide(s,r,'accepted').state,'completed');
 const next=agent(s);const current=s.app.store.get('session',s.session.id);s.app.store.update('session',current.id,current.version,{leaseUntil:Date.now()-1});assert.throws(()=>prepare(s,next,history,'expired-lease'),{code:'LEASE_EXPIRED'});
}finally{s.close();}});

test('USER can dismiss stale or expired requests without executing their business',()=>{for(const reason of ['source','expiry']){const s=setup();try{
 const who=agent(s),c=claim(s),r=prepare(s,who,{kind:'claim_decision',claim:{claimId:c.id,expectedVersion:1}});
 if(reason==='source')s.app.store.update('claim',c.id,1,{limitations:['changed']});else s.app.store.update('research-action',r.id,1,{expiresAt:'2000-01-01T00:00:00Z'});
 const row=s.app.store.get('research-action',r.id),closed=op(s,USER,'research_action_decide',{requestId:r.id,expectedVersion:row.version,decision:'dismiss'},'close');assert.equal(closed.state,'rejected');assert.equal(s.app.store.get('claim',c.id).status,'proposal');
}finally{s.close();}}});

test('two database processes consume an exact grant once and reopen replays its reference',async()=>{const s=setup();try{
 const {input}=textGrant(s),who=agent(s),r=prepare(s,who,input),appUrl=pathToFileURL(resolve('dist/packages/research-app.js')).href;
 const code=`const data=JSON.parse(process.argv[1]);const {ResearchApp}=await import(data.appUrl);const app=new ResearchApp(data.dir,data.repoRoot);try{console.log(JSON.stringify(app.operations.execute({type:'user'},'research_action_decide',{requestId:data.id,expectedVersion:1,decision:'confirm'},{projectId:data.pid,sessionId:data.sid,idempotencyKey:'same-click'})));}finally{app.close();}`;
 const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','--eval',code,JSON.stringify({appUrl,dir:s.dir,repoRoot:process.cwd(),id:r.id,pid:s.project.id,sid:s.session.id})],{windowsHide:true});let output='',error='';child.stdout.on('data',bytes=>{output+=bytes;});child.stderr.on('data',bytes=>{error+=bytes;});child.once('error',reject);child.once('close',code=>{if(code)reject(Error('child exit '+code+': '+error));else try{resolve(JSON.parse(output));}catch(cause){reject(cause);}});});
 const [a,b]=await Promise.all([run(),run()]);assert.deepEqual(a,b);assert.equal(s.app.store.list('text-corpus-grant').length,1);assert.equal(s.app.store.list('approval').length,1);assert.deepEqual(decide(s,r,'confirm','same-click'),a);
}finally{s.close();}});
