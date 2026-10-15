import test from 'node:test';import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
const {SkillManager}=await import('../../dist/web/assets/skill-manager.js');
const {IntegrationsView}=await import('../../dist/web/assets/integrations.js');
const reply=value=>({ok:true,json:async()=>value}),tick=()=>new Promise(resolve=>setImmediate(resolve));
const legacy={configuration:{version:5,bundleId:'old-composite',builtinBundleId:'old-baseline',revisionIds:['pending-fixed','revoked-fixed'],disabledBuiltinIds:['pi-research-overview']},revisions:[],builtinSkills:[{id:'pi-research-overview',description:'Original method',resources:[],digest:'original'}]};
const restored={...legacy,configuration:{...legacy.configuration,version:6,bundleId:'restored-composite',disabledBuiltinIds:[]}};
const view=(props={})=>synchronousState(new SkillManager({projectId:'project',...props}));
function nodes(node,out=[]){if(!node||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(value=>nodes(value,out));return out;}out.push(node);nodes(node.props?.children,out);return out;}
const text=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(text).join(' '):typeof node!=='object'?String(node):text(node.props?.children);

test('initial legacy catalog restores automatically with unchanged custom IDs, baseline, CAS and stable key then rereads authority',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();globalThis.fetch=async(url,options)=>{requests.push({url,key:options.headers['Idempotency-Key'],...JSON.parse(options.body)});return reply(requests.length===1?legacy:requests.length===2?restored.configuration:restored);};
 await v.refresh();assert.deepEqual(requests.map(request=>request.url),['/api/operations/skill_package_list','/api/operations/skill_bundle_configure','/api/operations/skill_package_list']);assert.deepEqual(requests[1].input,{expectedVersion:5,revisionIds:['pending-fixed','revoked-fixed'],builtinBundleId:'old-baseline',disabledBuiltinIds:[]});assert.equal(requests[1].projectId,'project');assert.equal(requests[1].key,'skill-restore-old-composite-5');
 assert.equal(v.state.catalog,restored);assert.deepEqual(v.state.enabled,['pending-fixed','revoked-fixed']);assert.equal(legacy.configuration.disabledBuiltinIds.length,1);assert.equal(v.state.busy,false);assert.ok(!nodes(v.render()).some(node=>node.type==='button'&&/恢复|刷新|设置/.test(text(node))));
});

test('quiet legacy detection reacquires the normal lock, rereads current CAS and retains draft and previous messages',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view(),newer={...legacy,configuration:{...legacy.configuration,version:8,bundleId:'newer-composite',revisionIds:['new-fixed']}};v.state.catalog=restored;Object.assign(v.state,{error:'prior error',notice:'prior notice',query:'draft'});v.openPanel('upload');
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply(requests.length===1?legacy:requests.length===2?newer:requests.length===3?{}:{...newer,configuration:{...newer.configuration,disabledBuiltinIds:[],version:9}});};
 await v.refresh(true);assert.deepEqual(requests.map(request=>request.url.split('/').at(-1)),['skill_package_list','skill_package_list','skill_bundle_configure','skill_package_list']);assert.deepEqual(requests[2].input,{expectedVersion:8,revisionIds:['new-fixed'],builtinBundleId:'old-baseline',disabledBuiltinIds:[]});assert.equal(v.state.error,'prior error');assert.equal(v.state.notice,'prior notice');assert.equal(v.state.query,'draft');assert.equal(v.state.panel,'upload');
});

test('locked snapshots and a late quiet legacy response cannot issue restoration concurrently with a user mutation',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();v.state.catalog=restored;globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,...JSON.parse(options.body),resolve}));
 v.locked=true;await v.refresh(true);assert.equal(pending.length,0);v.locked=false;const quiet=v.refresh(true),enabled=v.enable('new-fixed');pending[1].resolve(reply({}));await tick();pending[2].resolve(reply(restored));await enabled;pending[0].resolve(reply(legacy));await quiet;
 assert.deepEqual(pending.map(request=>request.url.split('/').at(-1)),['skill_package_list','skill_package_enable','skill_package_list']);assert.equal(v.state.catalog,restored);
});

test('read-only project passes through the view, shows legacy catalog and original text without restoration or writable controls',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view({readOnly:true});globalThis.fetch=async(url,options)=>{requests.push({url,body:options.body});return reply(url.startsWith('/api/skills/')?{id:'pi-research-overview',resource:'SKILL.md',digest:'original',content:'# Preserved original'}:legacy);};
 await v.refresh();assert.equal(requests.length,1);assert.equal(v.state.catalog,legacy);assert.equal(v.state.error,'');assert.equal(nodes(v.render()).find(node=>node.type==='button'&&text(node).trim()==='上传技能').props.disabled,true);await v.readBuiltin('pi-research-overview');assert.match(text(v.render()),/# Preserved original/);assert.equal(requests.length,2);assert.ok(!requests.some(request=>request.url.endsWith('skill_bundle_configure')));
 const parent=synchronousState(new IntegrationsView({projectId:'project',readOnly:true}));assert.equal(nodes(parent.render()).find(node=>node.type?.name==='SkillManager').props.readOnly,true);
});

test('switching projects before the initial legacy read completes cannot issue an old-project restore',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,...JSON.parse(options.body),resolve}));
 const initial=v.refresh(),previous=v.props;v.props={projectId:'other'};v.componentDidUpdate(previous);pending[1].resolve(reply(restored));await tick();pending[0].resolve(reply(legacy));await initial;assert.equal(v.state.catalog,restored);assert.deepEqual(pending.map(request=>request.projectId),['project','other']);assert.ok(pending.every(request=>request.url.endsWith('skill_package_list')));
});

test('failed automatic restore keeps authority and error and retries once on the next snapshot with the same key',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();globalThis.fetch=async(url,options)=>{requests.push({url,key:options.headers['Idempotency-Key'],...JSON.parse(options.body)});return url.endsWith('skill_bundle_configure')?{ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'configuration changed'}})}:reply(legacy);};
 await v.refresh();assert.equal(v.state.catalog,legacy);assert.equal(v.state.error,'configuration changed');assert.equal(requests.length,2);assert.equal(v.state.busy,false);await v.refresh(true);assert.equal(requests.length,5);assert.equal(requests[4].key,requests[1].key);assert.equal(v.state.error,'configuration changed');assert.equal(v.state.catalog,legacy);
});
