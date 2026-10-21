import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {digest} from '../../dist/packages/storage/store.js';
import {actor,startTeam,spec} from '../support/collaboration.mjs';

function ready(expectedRevisionId=null,overrides={}){return {expectedRevisionId,question:'How does the intervention change the measured outcome?',scope:'A fixed local comparison.',constraints:[],successCriteria:['Report the measured difference.'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Measure',description:'Run the fixed comparison.'}],status:'ready',...overrides};}
function confirm(s,rootId=s.session.id,question='Fixed question',evidenceIds=[]){const root=s.app.store.get('session',rootId,s.project.id),row=s.app.researchBriefs.save(USER,s.project.id,rootId,ready(root.researchBriefId??null,{question,evidenceIds}));return s.app.researchBriefs.confirm(USER,s.project.id,rootId,{briefId:row.id,expectedVersion:row.version});}
function source(s){const bytes=Buffer.from('A readable source quote.');const artifact=s.app.evidence.put(s.project.id,'source.txt',bytes);return s.app.evidence.register(USER,s.project.id,artifact.id,0,bytes.length,'fixture source').id;}
function agent(s,sessionId=s.session.id){let root=s.app.store.get('session',sessionId,s.project.id);root=s.app.store.update('session',root.id,root.version,{state:'running',generation:root.generation+1,leaseUntil:Date.now()+60000});return {type:'agent',projectId:s.project.id,sessionId:root.id,role:'coordinator',generation:root.generation};}
function experiment(s,rootId=s.session.id){return s.app.experiments.create(USER,s.project.id,{title:'Brief-bound candidate',hypothesis:'A fixed measurement.',parentId:s.baseline.id},rootId);}

test('root experiment creation and Run preparation capture the latest confirmed brief into the approved digest',()=>{const s=setup();try{
 const first=confirm(s),who=agent(s),e=s.app.experiments.create(who,s.project.id,{title:'Root candidate',hypothesis:'A fixed measurement.',parentId:s.baseline.id,researchBrief:{id:'forged'} });
 assert.equal(e.researchBrief.id,first.id);assert.throws(()=>s.app.experiments.create({...who,attemptId:'task-attempt'},s.project.id,{title:'Invalid root actor',hypothesis:'Fixture.'}),{code:'TASK_SCOPE_DENIED'});
 const latest=confirm(s,s.session.id,'Latest question'),intent=s.app.runs.prepare(who,e.id);
 assert.equal(intent.manifest.researchBrief.id,latest.id);assert.equal(intent.manifestDigest,digest(intent.manifest));
}finally{s.close();}});

test('an unconfirmed or corrupted latest brief cannot fall back to an unbound Run',()=>{const s=setup();try{
 const e=s.app.experiments.create(USER,s.project.id,{title:'Legacy until a brief appears',hypothesis:'Fixture.'},s.session.id),pending=s.app.researchBriefs.save(USER,s.project.id,s.session.id,ready());
 assert.equal(pending.status,'ready');assert.throws(()=>s.app.runs.prepare(USER,e.id,s.session.id),{code:'BRIEF_NOT_CONFIRMED'});
 const confirmed=confirm(s,s.session.id,'Corrupt this');let row=s.app.store.get('research-brief',confirmed.id,s.project.id);s.app.store.update('research-brief',row.id,row.version,{digest:'0'.repeat(64)});
 assert.throws(()=>s.app.runs.prepare(USER,e.id,s.session.id),{code:'BRIEF_CORRUPTED'});
}finally{s.close();}});

test('an unreadable latest brief cannot be captured',()=>{const s=setup();try{
 const id=source(s),brief=confirm(s,s.session.id,'Source-bound question',[id]),e=experiment(s);let row=s.app.store.get('evidence',id,s.project.id);
 s.app.store.update('evidence',row.id,row.version,{quote:'revoked quote'});assert.throws(()=>s.app.runs.prepare(USER,e.id,s.session.id),{code:'EVIDENCE_INVALID'});assert.equal(brief.status,'confirmed');
}finally{s.close();}});

test('a fixed confirmed intent remains submit-able after a newer brief revision is confirmed',()=>{const s=setup();try{
 const original=confirm(s),e=experiment(s),intent=s.app.runs.prepare(USER,e.id,s.session.id);confirm(s,s.session.id,'A later question');approve(s.app,intent.approvalId);
 const run=s.app.runs.submit(USER,intent.id);assert.equal(run.state,'queued');assert.equal(run.manifest.researchBrief.id,original.id);
}finally{s.close();}});

test('revoked source blocks queued admission but does not invalidate a run after start',()=>{const s=setup();try{
 const id=source(s),brief=confirm(s,s.session.id,'Admission-bound question',[id]),e=experiment(s),before=s.app.runs.prepare(USER,e.id,s.session.id),after=s.app.runs.prepare(USER,e.id,s.session.id);
 approve(s.app,before.approvalId);approve(s.app,after.approvalId);const started=s.app.runs.submit(USER,before.id),queued=s.app.runs.submit(USER,after.id),evidence=s.app.store.get('evidence',id,s.project.id);
 s.app.store.update('evidence',id,evidence.version,{quote:'revoked after submit'});
 assert.throws(()=>s.app.runs.assertLaunchable(queued),{code:'EVIDENCE_INVALID'});
 const running=s.app.store.update('run',started.id,started.version,{state:'running',startedAt:new Date().toISOString(),startRequested:true});
 assert.doesNotThrow(()=>s.app.runs.assertExecutionGrant(running,false));assert.equal(s.app.runs.get(USER,started.id).manifest.researchBrief.id,brief.id);assert.equal(s.app.runs.get(USER,started.id).state,'running');
}finally{s.close();}});

test('a different root can reuse baseline source only with its own current brief; input fields and omitted roots cannot bind one',()=>{const s=setup();try{
 const first=confirm(s,s.session.id,'Original root'),e=experiment(s),other=s.app.sessions.create(USER,s.project.id,{title:'Second coordinator'}),second=confirm(s,other.id,'Second root');
 const derived=s.app.experiments.create(USER,s.project.id,{title:'Second-root child',hypothesis:'Fixture.',parentId:e.id},other.id),intent=s.app.runs.prepare(USER,derived.id,other.id);
 assert.equal(e.parentId,s.baseline.id);assert.equal(derived.researchBrief.id,second.id);assert.equal(intent.manifest.researchBrief.id,second.id);assert.notEqual(intent.manifest.researchBrief.id,first.id);
 assert.throws(()=>s.app.runs.prepare(USER,e.id),{code:'RUN_SESSION_REQUIRED'});
 const emptyRoot=s.app.sessions.create(USER,s.project.id,{title:'No confirmed brief'});
 assert.throws(()=>s.app.experiments.create(USER,s.project.id,{title:'Missing root binding',hypothesis:'Fixture.',parentId:e.id}),{code:'RUN_SESSION_REQUIRED'});
 assert.throws(()=>s.app.experiments.create(USER,s.project.id,{title:'Empty root binding',hypothesis:'Fixture.',parentId:e.id},emptyRoot.id),{code:'BRIEF_REQUIRED'});
 const forged=s.app.experiments.create(USER,s.project.id,{title:'Forged binding',hypothesis:'Fixture.',parentId:s.baseline.id,rootSessionId:s.session.id,researchBrief:first});assert.equal(forged.researchBrief,undefined);
 const foreign=s.app.runs.prepare(USER,e.id,s.session.id);approve(s.app,foreign.approvalId);assert.throws(()=>s.app.runs.submit(agent(s,other.id),foreign.id),{code:'RUN_SESSION_DENIED'});
}finally{s.close();}});

test('a dropped intermediate brief binding still requires a fresh confirmed root before Run preparation',()=>{const s=setup();try{
 const first=confirm(s),parent=experiment(s),team=startTeam(s,[spec('designer-key',{role:'designer'})]),claim=s.app.teams.claim(team.id),designer=actor(claim),designerSession=s.app.store.get('session',designer.sessionId,s.project.id);
 assert.equal(designerSession.role,'designer');assert.equal(designerSession.taskId,claim.task.id);assert.notEqual(designer.sessionId,s.session.id);
 const child=s.app.experiments.create(designer,s.project.id,{title:'Unbound designer child',hypothesis:'Fixture.',parentId:parent.id});assert.equal(child.researchBrief,undefined);
 const emptyRoot=s.app.sessions.create(USER,s.project.id,{title:'Empty root'});
 assert.throws(()=>s.app.runs.prepare(USER,child.id),{code:'RUN_SESSION_REQUIRED'});
 assert.throws(()=>s.app.runs.prepare(USER,child.id,emptyRoot.id),{code:'BRIEF_REQUIRED'});
 const intent=s.app.runs.prepare(USER,child.id,s.session.id);assert.equal(intent.manifest.researchBrief.id,first.id);
 const pending=s.app.researchBriefs.save(USER,s.project.id,s.session.id,ready(first.id,{question:'Unconfirmed newer brief'}));assert.equal(pending.status,'ready');
 const intentsBefore=s.app.store.list('run-intent').length,approvalsBefore=s.app.store.list('approval').length;
 assert.throws(()=>s.app.runs.prepare(USER,child.id,s.session.id),{code:'BRIEF_NOT_CONFIRMED'});assert.equal(s.app.store.list('run-intent').length,intentsBefore);assert.equal(s.app.store.list('approval').length,approvalsBefore);
 const latest=s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:pending.id,expectedVersion:pending.version}),latestIntent=s.app.runs.prepare(USER,child.id,s.session.id);
 assert.equal(latestIntent.manifest.researchBrief.id,latest.id);assert.equal(s.app.store.get('run-intent',intent.id).manifest.researchBrief.id,first.id);
}finally{s.close();}});

test('tampered ref digest is rejected and fixed refs survive reopening',()=>{const s=setup();try{
 confirm(s);const e=experiment(s),bad=s.app.runs.prepare(USER,e.id,s.session.id),stored=s.app.store.get('run-intent',bad.id,s.project.id);
 s.app.store.update('run-intent',stored.id,stored.version,{manifest:{...stored.manifest,researchBrief:{...stored.manifest.researchBrief,digest:'0'.repeat(64)}}});
 assert.throws(()=>s.app.runs.submit(USER,bad.id),{code:'MANIFEST_CORRUPTED'});
 const good=s.app.runs.prepare(USER,e.id,s.session.id);approve(s.app,good.approvalId);s.app.close();s.app=new ResearchApp(s.dir,process.cwd());
 assert.equal(s.app.store.get('experiment',e.id,s.project.id).researchBrief.id,good.manifest.researchBrief.id);assert.equal(s.app.store.get('run-intent',good.id,s.project.id).manifest.researchBrief.id,good.manifest.researchBrief.id);
 const run=s.app.runs.submit(USER,good.id);assert.equal(run.manifest.researchBrief.id,good.manifest.researchBrief.id);
}finally{s.close();}});
