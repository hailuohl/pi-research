import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ResearchBriefService} from '../../dist/packages/research-workflows/briefs.js';

function service(s){return new ResearchBriefService(s.app);}
function input(overrides={}){return {
 question:'How does the intervention change the measured outcome?',scope:'Published evidence in the selected field.',constraints:[],successCriteria:[],
 clarificationQuestions:['Which population should be included?'],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[],status:'clarifying',expectedRevisionId:null,...overrides,
};}
function save(s,value,actor=USER,session=s.session){return service(s).save(actor,s.project.id,session.id,value);}
function evidence(s){const bytes=Buffer.from('reported data');const artifact=s.app.evidence.put(s.project.id,'source.txt',bytes);return s.app.evidence.register(USER,s.project.id,artifact.id,0,bytes.length,'fixture source').id;}
function ready(overrides={}){return input({successCriteria:['The estimate is reported with its uncertainty.'],clarificationQuestions:[],steps:[{title:'Review sources',description:'Compare methods and reported estimates.'}],status:'ready',...overrides});}
function agent(s,generation=3){let root=s.app.store.get('session',s.session.id,s.project.id);root=s.app.store.update('session',root.id,root.version,{state:'running',generation,leaseUntil:Date.now()+30000});return {type:'agent',projectId:s.project.id,sessionId:root.id,role:'coordinator',generation};}

test('clarifying drafts can be revised into ready plans only after questions are resolved',()=>{const s=setup();try{
 const drafts=service(s),first=save(s,input());assert.equal(first.status,'clarifying');assert.equal(first.revision,1);
 assert.throws(()=>save(s,ready({expectedRevisionId:first.id,clarificationQuestions:['Still unclear']})),{code:'BRIEF_NOT_READY'});
 assert.equal(s.app.store.list('research-brief',s.project.id).length,1);
 const plan=save(s,ready({expectedRevisionId:first.id}));assert.equal(plan.status,'ready');assert.equal(plan.revision,2);assert.equal(plan.previousRevisionId,first.id);
 assert.deepEqual(drafts.inspect(USER,s.project.id,s.session.id).history.map(x=>x.id),[plan.id,first.id]);
 assert.ok(s.app.store.events(0,s.project.id).some(e=>e.type==='session.research_brief_saved'&&e.payload.sessionId===s.session.id&&e.payload.briefId===plan.id));
 assert.equal(s.app.store.list('run',s.project.id).length,0);assert.equal(s.app.store.list('claim',s.project.id).length,0);
 assert.throws(()=>save(s,{...ready({expectedRevisionId:plan.id}),approved:true}),{code:'INVALID_INPUT'});
}finally{s.close();}});

test('evidence must be local, current, authorized, and hypotheses may only cite listed evidence',()=>{const s=setup();try{
 const id=evidence(s),other=s.app.projects.create(USER,{name:'foreign evidence'}),foreignBytes=Buffer.from('outside evidence'),artifact=s.app.evidence.put(other.id,'outside.txt',foreignBytes),foreign=s.app.evidence.register(USER,other.id,artifact.id,0,foreignBytes.length,'foreign fixture');
 assert.throws(()=>save(s,ready({evidenceIds:[foreign.id]})),{code:'SCOPE_DENIED'});
 assert.throws(()=>save(s,ready({evidenceIds:[id],hypotheses:[{statement:'Supported hypothesis',evidenceIds:['missing-evidence']}]})),{code:'INVALID_INPUT'});
 assert.equal(s.app.store.list('research-brief',s.project.id).length,0);
 const plan=save(s,ready({evidenceIds:[id],hypotheses:[{statement:'A sourced hypothesis',evidenceIds:[id]}]}));assert.deepEqual(plan.evidenceIds,[id]);
 const row=s.app.store.get('evidence',id,s.project.id);s.app.store.update('evidence',id,row.version,{quote:'changed quote'});
 const inspected=service(s).inspect(USER,s.project.id,s.session.id);assert.equal(inspected.brief.id,plan.id);assert.deepEqual(inspected.evidenceChecks,[{evidenceId:id,current:false,code:'EVIDENCE_INVALID'}]);
}finally{s.close();}});

test('expected revision conflicts leave the pointer and immutable history untouched',()=>{const s=setup();try{
 const first=save(s,input()),count=s.app.store.list('research-brief',s.project.id).length,root=s.app.store.get('session',s.session.id,s.project.id);
 assert.throws(()=>save(s,ready({expectedRevisionId:null})),{code:'VERSION_CONFLICT'});
 assert.equal(s.app.store.list('research-brief',s.project.id).length,count);assert.equal(s.app.store.get('session',root.id,s.project.id).researchBriefId,first.id);
 const second=save(s,ready({expectedRevisionId:first.id}));assert.equal(second.revision,2);assert.equal(s.app.store.get('research-brief',first.id,s.project.id).status,'clarifying');
 assert.throws(()=>service(s).confirm(USER,s.project.id,s.session.id,{briefId:first.id,expectedVersion:1}),{code:'BRIEF_NOT_LATEST'});
 assert.throws(()=>service(s).confirm(USER,s.project.id,s.session.id,{briefId:second.id,expectedVersion:999}),{code:'VERSION_CONFLICT'});
 const confirmed=service(s).confirm(USER,s.project.id,s.session.id,{briefId:second.id,expectedVersion:second.version});
 assert.equal(confirmed.status,'confirmed');assert.equal(confirmed.digest,second.digest);assert.equal(s.app.store.events(0,s.project.id).at(-1).type,'session.research_brief_confirmed');
 assert.equal(s.app.store.get('session',root.id,s.project.id).researchBriefId,second.id);
}finally{s.close();}});

test('agents need their own live coordinator lease and cannot confirm or inspect unavailable evidence content',()=>{const s=setup();try{
 const id=evidence(s),writer=agent(s),plan=save(s,ready({evidenceIds:[id],literatureSummary:'derived notes',hypotheses:[{statement:'hidden derived statement',evidenceIds:[id]}]}),writer);
 assert.throws(()=>service(s).confirm(writer,s.project.id,s.session.id,{briefId:plan.id,expectedVersion:plan.version}),{code:'PERMISSION_DENIED'});
 const source=s.app.store.get('evidence',id,s.project.id);s.app.store.update('evidence',id,source.version,{quote:'revoked quote'});
 const blocked=service(s).inspect(writer,s.project.id,s.session.id);assert.equal(blocked.brief,null);assert.equal(blocked.blockedReason,'EVIDENCE_UNAVAILABLE');assert.equal(blocked.history[0].id,plan.id);assert.equal(blocked.evidenceChecks[0].current,false);
 assert.throws(()=>service(s).inspect({...writer,generation:writer.generation+1},s.project.id,s.session.id),{code:'LEASE_EXPIRED'});
 assert.throws(()=>service(s).inspect({...writer,taskId:'task-fixture'},s.project.id,s.session.id),{code:'TASK_SCOPE_DENIED'});
 assert.throws(()=>service(s).inspect({...writer,wakeupId:'wake-fixture'},s.project.id,s.session.id),{code:'TASK_SCOPE_DENIED'});
 const second=s.app.sessions.create(USER,s.project.id,{title:'other coordinator'});
 assert.throws(()=>service(s).inspect(writer,s.project.id,second.id),{code:'TASK_SCOPE_DENIED'});
 const userView=service(s).inspect(USER,s.project.id,s.session.id);assert.equal(userView.brief.literatureSummary,'derived notes');
}finally{s.close();}});

test('brief revisions and invalid-source markers survive reopening; user can read archived history',()=>{const s=setup();try{
 const id=evidence(s),first=save(s,ready({evidenceIds:[id]})),second=save(s,ready({expectedRevisionId:first.id,evidenceIds:[id],literatureSummary:'revised notes'}));
 s.app.close();s.app=new ResearchApp(s.dir,process.cwd());const reopened=service(s),current=reopened.inspect(USER,s.project.id,s.session.id);
 assert.equal(current.latestId,second.id);assert.deepEqual(current.history.map(x=>x.revision),[2,1]);assert.equal(reopened.inspect(USER,s.project.id,s.session.id,first.id).brief.id,first.id);
 const source=s.app.store.get('evidence',id,s.project.id);s.app.store.update('evidence',id,source.version,{quote:'invalid after reopen'});
 let root=s.app.store.get('session',s.session.id,s.project.id);s.app.store.update('session',root.id,root.version,{state:'archived'});
 const history=reopened.inspect(USER,s.project.id,s.session.id);assert.equal(history.brief.id,second.id);assert.equal(history.evidenceChecks[0].current,false);
 assert.throws(()=>save(s,ready({expectedRevisionId:second.id})),{code:'SESSION_ARCHIVED'});
}finally{s.close();}});

test('a branched coordinator owns an independent brief pointer and history',()=>{const s=setup();try{
 const branch=s.app.sessions.create(USER,s.project.id,{title:'message branch'}),stored=s.app.store.get('session',branch.id,s.project.id);
 s.app.store.update('session',branch.id,stored.version,{parentSessionId:s.session.id});
 const row=save(s,input(),USER,branch);
 assert.equal(row.rootSessionId,branch.id);assert.equal(s.app.store.get('session',branch.id,s.project.id).researchBriefId,row.id);
 assert.equal(s.app.store.get('session',s.session.id,s.project.id).researchBriefId,undefined);
 assert.equal(service(s).inspect(USER,s.project.id,branch.id).history[0].id,row.id);
 assert.equal(service(s).inspect(USER,s.project.id,s.session.id).brief,null);
}finally{s.close();}});
