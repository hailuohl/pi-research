import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {SkillManager,skillFileBase64}=await import('../../dist/web/assets/skill-manager.js');
const sync=v=>{synchronousState(v);return v;};
const view=()=>sync(synchronousState(new SkillManager({projectId:'project',sessionId:'session'})));
function nodes(node,out=[]){if(!node||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);nodes(node.props.children,out);return out;}
const text=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(text).join(' '):typeof node!=='object'?String(node):text(node.props.children);
const revision=id=>({revision:{id,packageId:'figure',revisionTag:id,description:'plot',roles:['coordinator'],license:null,requirements:{tools:['plot'],backends:['latex'],artifactIds:[]},files:[{path:'SKILL.md',size:20,digest:'hash'}],contentDigest:'hash',authorization:'text-only'},reviews:[],revocations:[]});
const catalog={configuration:{version:3,bundleId:'bundle',builtinBundleId:'builtin-old',revisionIds:[]},revisions:[revision('r1')],builtinReleases:[{bundleId:'builtin-old',current:false,skillCount:12},{bundleId:'builtin-new',current:true,skillCount:12}]};
function session(v){const element=nodes(v.render()).find(n=>n.type?.name==='SkillSession');return sync(new element.type(element.props));}
const reply=value=>({ok:true,json:async()=>value});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('native controls show unknown license and unavailable declarations without pretending readiness',()=>{
 const v=view();v.state.catalog=catalog;v.state.selected=catalog.revisions[0];const tree=v.render(),all=nodes(tree);
 assert.match(text(tree),/许可证：\s*未知/);assert.match(text(tree),/latex/);assert.match(text(tree),/目录展示不代表执行器已实现/);
 assert.equal(all.find(n=>n.type==='input'&&n.props.type==='checkbox').props.disabled,true);
 assert.equal(all.find(n=>n.type==='button'&&text(n)==='批准此固定版本').props.disabled,true);
 assert.ok(all.every(n=>!n.props.dangerouslySetInnerHTML));
 const element=all.find(n=>n.type?.name==='SkillImport'),form=sync(new element.type(element.props));
 assert.ok(nodes(form.render()).some(n=>n.type==='form'&&n.props.onSubmit));
 assert.ok(nodes(form.render()).some(n=>n.type==='input'&&n.props.type==='file'));
});

test('file import preserves original UTF8 bytes and native form submits a text-only package',async()=>{
 const bytes=Buffer.from('# 技能🙂\r\n');assert.equal(await skillFileBase64(new File([bytes],'SKILL.md')),bytes.toString('base64'));
 await assert.rejects(skillFileBase64({size:2*1024*1024+1}),/2 MiB/);
 let input;const element=nodes(view().render()).find(n=>n.type?.name==='SkillImport'),form=sync(new element.type({...element.props,submit:async value=>{input=value;}}));
 Object.assign(form.state,{packageId:'figure',revisionTag:'v1',description:'plot',files:[new File([bytes],'SKILL.md')],backends:'docker, latex'});
 nodes(form.render()).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});await tick();
 assert.deepEqual(input.requirements.backends,['docker','latex']);assert.equal(input.license,null);assert.equal(input.files[0].contentBase64,bytes.toString('base64'));assert.ok(!input.zipBase64);
});

test('revision and resource late responses cannot overwrite the newly selected fixed revision',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();
 globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,input:JSON.parse(options.body).input,resolve}));
 const first=v.inspect('r1'),second=v.inspect('r2');pending[1].resolve(reply(revision('r2')));await second;pending[0].resolve(reply(revision('r1')));await first;assert.equal(v.state.selected.revision.id,'r2');
 const resource=v.read('SKILL.md'),third=v.inspect('r3');pending[3].resolve(reply(revision('r3')));await third;pending[2].resolve(reply({content:'stale',resource:'SKILL.md',digest:'hash'}));await resource;
 assert.equal(v.state.selected.revision.id,'r3');assert.equal(v.state.content,null);
});

test('configuration uses expected version and only explicitly checked fixed revisions',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();v.state.catalog=catalog;v.state.enabled=['r1'];v.state.builtinBundleId='builtin-old';
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply(url.endsWith('skill_package_list')?catalog:catalog.configuration);};
 await nodes(v.render()).find(n=>n.type==='button'&&text(n).includes('保存启用')).props.onClick();
 assert.deepEqual(requests[0].input,{expectedVersion:3,revisionIds:['r1'],builtinBundleId:'builtin-old'});assert.ok(requests[0].url.endsWith('skill_bundle_configure'));
});

test('review and revocation controls bind the selected revision and retain the written reason',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();v.state.catalog=catalog;v.state.selected=catalog.revisions[0];v.state.note='Checked exact text';
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply(url.endsWith('skill_package_list')?catalog:{});};
 await nodes(v.render()).find(n=>n.type==='button'&&text(n)==='批准此固定版本').props.onClick();
 assert.deepEqual(requests[0].input,{revisionId:'r1',decision:'approved',note:'Checked exact text'});
 await nodes(v.render()).find(n=>n.type==='button'&&text(n)==='撤销此版本').props.onClick();
 assert.deepEqual(requests[2].input,{revisionId:'r1',note:'Checked exact text'});assert.ok(requests[2].url.endsWith('skill_package_revoke'));
 const rejected=revision('r1');rejected.reviews=[{id:'a',decision:'approved'},{id:'b',decision:'rejected'}];v.state.catalog={...catalog,revisions:[rejected]};
 assert.equal(nodes(v.render()).find(n=>n.type==='input'&&n.props.type==='checkbox').props.disabled,true);
});

test('session saves explicit skills, reports preflight reasons, and ignores late results from another session',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=session(view());
 globalThis.fetch=(url,options)=>url.endsWith('/skills')?Promise.resolve(reply({skills:[{id:'figure'}]})):new Promise(resolve=>pending.push({input:JSON.parse(options.body).input,resolve}));
 const first=v.load(),previous=v.props;v.props={...previous,sessionId:'new-session'};v.componentDidUpdate(previous);
 const result={sessionId:'new-session',version:7,skillBundleId:'fixed',skillIds:[],ready:true,missing:[]};pending[1].resolve(reply(result));await tick();pending[0].resolve(reply({...result,sessionId:'session',skillIds:['stale']}));await first;
 assert.equal(v.state.result.sessionId,'new-session');assert.deepEqual(v.state.selected,[]);
 nodes(v.render()).find(n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
 const save=nodes(v.render()).find(n=>n.type==='button'&&text(n).includes('保存显式')).props.onClick();assert.deepEqual(pending[2].input,{sessionId:'new-session',expectedVersion:7,skillIds:['figure']});
 pending[2].resolve(reply({...result,skillIds:['figure'],ready:false,missing:[{skillId:'figure',kind:'backend',value:'latex',reason:'未实现隔离编译'}]}));await save;
 assert.match(text(v.render()),/启动被阻止/);assert.match(text(v.render()),/未实现隔离编译/);v.componentWillUnmount();
});


test('builtin release upgrade is explicit, keeps custom revisions, and leaves old session preflight intact',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view(),configured={...catalog,configuration:{...catalog.configuration,revisionIds:['r1']}};
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply(url.endsWith('skill_package_list')?configured:configured.configuration);};
 await v.refresh();
 let tree=v.render(),select=nodes(tree).find(n=>n.type==='select');
 assert.equal(select.props.value,'builtin-old');assert.equal(nodes(select).filter(n=>n.type==='option').length,2);assert.match(text(tree),/可选发行版本\s+2\s+个/);assert.match(text(tree),/仅影响后续新绑定/);assert.match(text(tree),/未配置项目的新绑定默认使用当前发行/);
 const existing=session(v);existing.state.result={sessionId:'session',version:9,skillBundleId:'old-session-composite',skillIds:['figure'],ready:false,missing:[{skillId:'figure',kind:'tool',value:'plot',reason:'原版本能力不可用'}]};existing.state.selected=['figure'];
 select.props.onChange({target:{value:'builtin-new'}});assert.deepEqual(v.state.enabled,['r1']);assert.equal(requests.length,1);
 await nodes(v.render()).find(n=>n.type==='button'&&text(n).includes('保存启用')).props.onClick();
 assert.deepEqual(requests[1].input,{expectedVersion:3,revisionIds:['r1'],builtinBundleId:'builtin-new'});
 existing.props={...existing.props,catalog:{...configured,configuration:{...configured.configuration,builtinBundleId:'builtin-new'}}};
 assert.match(text(existing.render()),/old-session-composite/);assert.match(text(existing.render()),/原版本能力不可用/);assert.match(text(existing.render()),/启动被阻止/);
});

test('late catalog loads and upgrades cannot replace another project builtin selection',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();
 globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,...JSON.parse(options.body),resolve}));
 const first=v.refresh(),previous=v.props;v.props={projectId:'next-project'};v.componentDidUpdate(previous);
 assert.equal(v.state.catalog,null);assert.equal(v.state.builtinBundleId,'');
 const next={...catalog,configuration:{...catalog.configuration,builtinBundleId:'builtin-new'}};
 pending[1].resolve(reply(next));await tick();pending[0].resolve(reply(catalog));await first;
 assert.equal(v.state.builtinBundleId,'builtin-new');assert.equal(v.state.catalog,next);
 const save=v.mutate('skill_bundle_configure',{expectedVersion:3,revisionIds:[],builtinBundleId:'builtin-old'},'saved'),before=v.props;
 v.props={projectId:'third-project'};v.componentDidUpdate(before);
 pending[3].resolve(reply(catalog));await tick();pending[2].resolve(reply(next.configuration));await tick();
 assert.equal(pending[4].projectId,'next-project');pending[4].resolve(reply(next));await save;
 assert.equal(v.state.catalog,catalog);assert.equal(v.state.builtinBundleId,'builtin-old');assert.equal(v.state.notice,'');assert.equal(v.state.busy,false);
});
