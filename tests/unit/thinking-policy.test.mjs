import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup,USER} from '../support/research.mjs';
import {configureModelManagement,inspectModelManagement} from '../../dist/packages/pi-adapter/model-management.js';
import {readModelState} from '../../dist/packages/pi-adapter/model-connections.js';
import {defaultModelDefinition} from '../../dist/packages/pi-adapter/model-definition.js';
import {prepareTaskModels,assertTaskModelCurrentSync} from '../../dist/packages/pi-adapter/thinking-policy.js';
import {validateGraph} from '../../dist/packages/collaboration/graph.js';

import {configured} from '../support/thinking.mjs';

test('portable policies use real arbitrary IDs and independent versions without changing execution config',async()=>{
 const s=setup(),other=setup();try{
  const f=await configured(s),connectionVersion=readModelState(s.dir).version;
  await f.save();const view=await inspectModelManagement(s.app.context,USER),entry=view.thinkingPolicies[0];
  assert.deepEqual(entry,{...f.policy,version:1});assert.equal(readModelState(s.dir).version,connectionVersion);
  assert.ok(!JSON.stringify(entry).includes(s.dir));assert.ok(!JSON.stringify(entry).includes('FAKE'));
  await assert.rejects(()=>f.save({...f.policy,candidates:[{id:'max',purpose:'Not a configured ID'}]},1),{code:'MODEL_REASONING_UNAVAILABLE'});
  await assert.rejects(()=>f.save(f.policy,0),{code:'VERSION_CONFLICT'});
  const g=await configured(other);await g.save(f.policy);assert.deepEqual((await inspectModelManagement(other.app.context,USER)).thinkingPolicies[0],entry);
  await f.save({...f.policy,candidates:[]},1);assert.deepEqual((await inspectModelManagement(s.app.context,USER)).thinkingPolicies[0].candidates,[]);
 }finally{s.close();other.close();}
});

test('legacy policy uses resolved SDK capabilities, ignoring unselected maps and display names',async()=>{
 const s=setup();try{
  const provider='legacy-thinking-fixture',model='local-fixture',selection={provider,model,thinking:'off'};let source={id:model,name:'Legacy fixture',reasoning:false,input:['text'],contextWindow:8192,maxTokens:1024,thinkingLevelMap:{high:'precise',low:'short'}};
  const catalog=()=>writeFileSync(join(s.dir,'models.json'),JSON.stringify({providers:{[provider]:{api:'openai-completions',baseUrl:'https://fixture.invalid/v1',models:[source]}}}));catalog();
  const save=candidates=>configureModelManagement(s.app.context,USER,{expectedVersion:0,expectedPolicyVersion:0,action:'model.thinking-policy',provider,model,value:{schemaVersion:1,provider,model,restoreEpoch:0,candidates}},crypto.randomUUID());
  await assert.rejects(()=>save([{id:'high',purpose:'Not actually supported'}]),{code:'MODEL_REASONING_UNAVAILABLE'});
  source={...source,reasoning:true};catalog();await assert.rejects(()=>save([{id:'max',purpose:'SDK does not support this unmapped Pi value'}]),{code:'MODEL_REASONING_UNAVAILABLE'});await save([{id:'high',purpose:'Exact review'},{id:'off',purpose:'Bounded lookup'}]);
  const root={...s.session,model:selection},tasks=validateGraph([{key:'review',role:'reviewer',objective:'Review fixture',dependencies:[],thinking:'high'}]),prepared=await prepareTaskModels(s.app.context,root,tasks),frozen=prepared.resolve(root.model,tasks).review;
  source={...source,name:'Display change',thinkingLevelMap:{...source.thinkingLevelMap,low:'different-but-unselected'}};catalog();assert.doesNotThrow(()=>assertTaskModelCurrentSync(s.app.context,frozen));
  source={...source,thinkingLevelMap:{...source.thinkingLevelMap,high:'changed'}};catalog();assert.throws(()=>assertTaskModelCurrentSync(s.app.context,frozen),{code:'TASK_MODEL_STALE'});
 }finally{s.close();}
});

test('single-candidate policy leaves unspecified tasks inherited and old restore identities cannot import',async()=>{
 const s=setup();try{const f=await configured(s);await f.save({...f.policy,candidates:f.policy.candidates.slice(0,1)});const root=s.app.store.get('session',s.session.id),tasks=validateGraph([{key:'plain',role:'analyst',objective:'Inherit fixture'}]);assert.equal(await prepareTaskModels(s.app.context,root,tasks),undefined);assert.equal(root.model.thinking,'careful');
  await f.edit('model.delete',{provider:f.model.provider,model:f.model.model});await f.edit('model.restore',{provider:f.model.provider,model:f.model.model});await f.edit('model.enabled',{provider:f.model.provider,model:f.model.model,value:{enabled:true}});await assert.rejects(()=>f.save(f.policy,1),{code:'MODEL_RESTORE_STALE'});assert.equal(s.app.store.get('session',s.session.id).model.restoreEpoch,undefined);
 }finally{s.close();}
});
