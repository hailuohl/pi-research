import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,USER} from '../support/research.mjs';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';

const input=(extra={})=>({expectedRevisionId:null,question:'Fixed question',scope:'Fixed scope',constraints:[],successCriteria:['Compare actual metrics'],clarificationQuestions:[],literatureSummary:'Derived from fixed evidence',hypotheses:[],evidenceIds:[],steps:[{title:'Baseline',description:'Run after separate approval'}],status:'ready',...extra});
function actor(s){const root=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',root.id,root.version,{state:'running',generation:1,leaseUntil:Date.now()+120000});return {type:'agent',projectId:s.project.id,sessionId:root.id,role:'coordinator',generation:1};}

test('Agent brief inspection always reads the latest revision and save replay rechecks the receipt evidence',async()=>{
 const s=setup();try{
  const root=actor(s),tools=new ToolDispatcher(s.app),source=s.app.evidence.put(s.project.id,'source.txt',Buffer.from('original source'));
  const evidence=s.app.evidence.register(USER,s.project.id,source.id,0,8,'Source'),oldInput=input({evidenceIds:[evidence.id]});
  const old=await tools.execute(root,'research_brief_save',oldInput,'save-original');
  const cached=await tools.execute(root,'research_brief_inspect',{},'inspect-current');assert.equal(cached.brief.id,old.id);
  const latest=await tools.execute(root,'research_brief_save',input({expectedRevisionId:old.id,literatureSummary:'No old evidence retained'}),'save-latest');
  s.app.store.update('evidence',evidence.id,evidence.version,{quote:'damaged'});
  const current=await tools.execute(root,'research_brief_inspect',{},'inspect-current');assert.equal(current.brief.id,latest.id);
  await assert.rejects(tools.execute(root,'research_brief_save',oldInput,'save-original'),{code:'BRIEF_EVIDENCE_UNAVAILABLE'});
  const historical=await tools.execute(root,'research_brief_inspect',{briefId:old.id},'inspect-historical');assert.equal(historical.brief,null);assert.equal(historical.blockedReason,'EVIDENCE_UNAVAILABLE');
  assert.equal(s.app.store.list('research-brief',s.project.id).length,2);
 }finally{s.close();}
});

test('same callId cannot replay brief content after the root lease expires',async()=>{
 const s=setup();try{
  const root=actor(s),tools=new ToolDispatcher(s.app),saved=await tools.execute(root,'research_brief_save',input(),'save-key');
  await tools.execute(root,'research_brief_inspect',{},'read-key');
  const latest=s.app.sessions.get(USER,s.session.id);s.app.store.update('session',latest.id,latest.version,{leaseUntil:Date.now()-1});
  await assert.rejects(tools.execute(root,'research_brief_inspect',{},'read-key'),{code:'LEASE_EXPIRED'});
  await assert.rejects(tools.execute(root,'research_brief_save',input(),'save-key'),{code:'LEASE_EXPIRED'});
  assert.equal(s.app.sessions.get(USER,s.session.id).researchBriefId,saved.id);
 }finally{s.close();}
});
