import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,cpSync,writeFileSync,symlinkSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve,posix} from 'node:path';
import {SkillService} from '../../dist/packages/skills/service.js';
import {buildSessionOptions,buildCustomTools} from '../../dist/packages/pi-adapter/options.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {readSkill,sessionSkillBundle} from '../../dist/packages/skills/runtime.js';
import {setup} from '../support/research.mjs';
const root=resolve('.');
const retiredMarkers=/OpenResearch|科研工作台|PROVENANCE\.md|Copyright[^\n]*alphaXiv/i;
const skillBodies=(service,id)=>[undefined,...service.list('coordinator').find(entry=>entry.id===id).resources].map(resource=>service.read('coordinator',id,resource).content);

test('scientific review reference reaches new paper sessions through the current bundle',()=>{
 const s=setup(),pid=s.project.id,id='pi-research-paper',resource='references/scientific-review.md';
 try{
  const actor=session=>({type:'agent',role:session.role,projectId:pid,sessionId:session.id});
  for(const role of ['coordinator','writer','reviewer']){
   const current=s.app.sessions.create({type:'system'},pid,{title:`Scientific ${role}`},{role}),next=readSkill(s.app,actor(current),pid,id,resource);
   assert.equal(next.bundleId,sessionSkillBundle(s.app,current));
   assert.equal(next.content,readFileSync(join(root,'skills/piresearch',id,resource),'utf8'));
   assert.ok(readSkill(s.app,actor(current),pid,id).content.includes(`](${resource})`));
  }
 }finally{s.close();}
});


test('writing release is read through session binding with exact managed bytes',()=>{
 const s=setup(),pid=s.project.id;
 try{
  const current=s.app.sessions.create({type:'system'},pid,{title:'Current writer'},{role:'writer'}),actor=session=>({type:'agent',role:'writer',projectId:pid,sessionId:session.id});
  for(const [id,resource] of [['pi-research-paper',undefined],['pi-research-paper','references/build-and-review.md'],['pi-research-reports',undefined]]){
   const next=readSkill(s.app,actor(current),pid,id,resource);
   assert.equal(next.bundleId,s.app.skills.bundleId);
   assert.equal(next.content,readFileSync(join(root,'skills/piresearch',id,resource??'SKILL.md'),'utf8'));
  }
  assert.throws(()=>readSkill(s.app,actor(current),pid,'pi-research-paper','../../.env'),{code:'SKILL_RESOURCE_NOT_FOUND'});
 }finally{s.close();}
});

test('current modules keep usable bodies and local debugging provenance',()=>{const s=new SkillService(root);assert.equal(s.list('coordinator').length,14);assert.ok(!s.list('coordinator').some(e=>e.id==='pi-research-instances'));assert.throws(()=>s.read('coordinator','pi-research-instances'),{code:'SKILL_NOT_FOUND'});for(const entry of s.list('coordinator')){const body=s.read('coordinator',entry.id);assert.ok(body.content.length>600);assert.equal(body.digest,entry.digest);assert.match(body.content,/name: pi-research-/);if(entry.id==='pi-research-code-debugging')assert.deepEqual(body.source,{repository:'hailuohl/pi-research',commit:'c087e1b64ad0c8e205d5178602fadfe46b06aab4',path:'skills/piresearch/pi-research-git/SKILL.md',blob:'88551aa3d83bb3a828599b4fd6bf43e7ccfb366c'});else {assert.equal(Object.hasOwn(body,'source'),false);assert.equal(Object.hasOwn(entry,'source'),false);}assert.doesNotMatch(body.content,retiredMarkers);}});
test('skill descriptions are visible; bodies are lazily read with role boundary',()=>{const s=new SkillService(root);assert.ok(s.list('literature').some(x=>x.id==='pi-research-lit-review'));assert.throws(()=>s.read('reviewer','pi-research-agent-delegation'),{code:'SKILL_SCOPE_DENIED'});assert.throws(()=>s.read('coordinator','../../.env'));assert.throws(()=>s.read('coordinator','pi-research-compute','../../LICENSE'));assert.match(s.read('coordinator','pi-research-compute','references/ssh.md').content,/受信 Linux Docker 监管器/);});
test('compute routes local, Docker and SSH separately while historical removed references keep their fixed bytes',()=>{const s=new SkillService(root),id='pi-research-compute';assert.deepEqual(s.list('coordinator').find(e=>e.id===id).resources,['references/local.md','references/docker.md','references/ssh.md']);assert.doesNotMatch(s.read('coordinator',id).content,/slurm|k8s|ray|modal|tinker|managed-compute|\bhf\b/i);const local=s.read('coordinator',id,'references/local.md').content,docker=s.read('coordinator',id,'references/docker.md').content;for(const expected of [/localRuntimeId/,/NVIDIA/,/不回退其他GPU或CPU/])assert.match(local,expected);for(const expected of [/Linux Docker/,/不能扩大为all/,/NVIDIA_VISIBLE_DEVICES=void/])assert.match(docker,expected);assert.doesNotMatch(local,/## Docker正式契约与环境准备/);});

test('tagged compute recipes satisfy actual tool inputs and retain the previous bundle without new scheduling guidance',()=>{
 const s=new SkillService(root),id='pi-research-compute',seen=new Set();
 for(const resource of [undefined,...s.list('coordinator').find(e=>e.id===id).resources]){
  const body=s.read('coordinator',id,resource).content;
  for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
   const value=JSON.parse(match[1]);if(!value.tool)continue;
   assert.ok(TOOL_DEFINITIONS[value.tool],value.tool);const tool=buildCustomTools([{name:value.tool,...TOOL_DEFINITIONS[value.tool]}],async()=>null)[0];assert.doesNotThrow(()=>tool.prepareArguments({input:value.input}));assert.throws(()=>tool.prepareArguments(value.input),/INVALID_INPUT/);seen.add(value.tool);
  }
 }
 assert.deepEqual([...seen].sort(),['execution_environment_list','experiment_plan_submit','project_inspect','run_inspect','run_logs','run_prepare','run_submit']);


});

test('Git receipt recipe keeps exact SHA input wrapping and prior fixed Git guidance',()=>{
 const s=new SkillService(root),body=s.read('coordinator','pi-research-git').content;let count=0;
 for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
  const value=JSON.parse(match[1]);if(!value.tool)continue;
  assert.equal(value.tool,'project_inspect');assert.match(value.input.githubCommit,/^[a-f0-9]{40}$/);
  const tool=buildCustomTools([{name:value.tool,...TOOL_DEFINITIONS[value.tool]}],async()=>null)[0];assert.doesNotThrow(()=>tool.prepareArguments({input:value.input}));count++;
 }
 assert.equal(count,1);
});

test('paper fixed-page image recipe uses real Pi wrapping and does not alter the previous fixed skill',()=>{
 const s=new SkillService(root),body=skillBodies(s,'pi-research-paper').join('\n');let count=0;
 for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
  const value=JSON.parse(match[1]);if(value.tool!=='publication_page_image_read')continue;
  const tool=buildCustomTools([{name:value.tool,...TOOL_DEFINITIONS[value.tool]}],async()=>null)[0];assert.doesNotThrow(()=>tool.prepareArguments({input:value.input}));assert.equal(value.input.pageNumber,1);count++;
 }
 assert.equal(count,1);
});

test('original document visual recipes have mutually exclusive range and reuse forms with Pi wrapping',()=>{
 const s=new SkillService(root),body=skillBodies(s,'pi-research-lit-review').join('\n'),recipes=[];
 for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
  const value=JSON.parse(match[1]);if(value.tool!=='document_page_image_read')continue;
  const tool=buildCustomTools([{name:value.tool,...TOOL_DEFINITIONS[value.tool]}],async()=>null)[0];assert.doesNotThrow(()=>tool.prepareArguments({input:value.input}));recipes.push(value.input);
 }
 assert.equal(recipes.length,2);assert.ok('firstPage' in recipes[0]&&'lastPage' in recipes[0]);assert.ok(!('authorizationActionId' in recipes[0]));assert.ok('authorizationActionId' in recipes[1]&&!('firstPage' in recipes[1])&&!('lastPage' in recipes[1]));
 
});
test('all allowed resources are hashed and treated as text, not executed',()=>{const s=new SkillService(root);for(const e of s.list('coordinator'))for(const p of e.resources){const r=s.read('coordinator',e.id,p);assert.ok(r.content.length>100);assert.ok(r.digest);}});
test('published descriptions, linked resources and tagged recipes agree with the managed catalog and Pi schemas',()=>{
 const s=new SkillService(root);
 for(const entry of s.list('coordinator')){
  const bodies=skillBodies(s,entry.id),description=bodies[0].match(/^description: (.+)$/m);
  assert.ok(description,entry.id);assert.equal(JSON.parse(description[1]),entry.description);
  for(const [index,body] of bodies.entries()){
   const directory=posix.dirname(index?entry.resources[index-1]:'SKILL.md');
   for(const match of body.matchAll(/\]\(((?:references|assets)\/[^)#]+|[^/)#\s]+\.md)\)/g)){
    const resource=posix.join(directory,match[1]);assert.ok(s.read('coordinator',entry.id,resource).content,`${entry.id}/${resource}`);
   }
   for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
    const value=JSON.parse(match[1]);if(!value.tool)continue;
    assert.ok(TOOL_DEFINITIONS[value.tool],value.tool);
    const tool=buildCustomTools([{name:value.tool,...TOOL_DEFINITIONS[value.tool]}],async()=>null)[0];
    assert.doesNotThrow(()=>tool.prepareArguments({input:value.input}),`${entry.id}: ${value.tool}`);
    assert.throws(()=>tool.prepareArguments(value.input),/INVALID_INPUT/);
   }
  }
 }
});
test('tampered bundled text cannot silently enter runtime',()=>{const dir=mkdtempSync(join(tmpdir(),'pi-skills-'));try{cpSync(join(root,'skills/piresearch'),join(dir,'skills/piresearch'),{recursive:true});writeFileSync(join(dir,'skills/piresearch/pi-research-overview/SKILL.md'),'forged grant');const s=new SkillService(dir);assert.throws(()=>s.read('coordinator','pi-research-overview'),{code:'SKILL_INTEGRITY_FAILED'});}finally{rmSync(dir,{recursive:true,force:true});}});
test('symlinked skill paths fail instead of exposing a host file',()=>{const dir=mkdtempSync(join(tmpdir(),'pi-skills-'));try{cpSync(join(root,'skills/piresearch'),join(dir,'skills/piresearch'),{recursive:true});const p=join(dir,'skills/piresearch/pi-research-overview'),outside=join(dir,'outside');cpSync(p,outside,{recursive:true});rmSync(p,{recursive:true});symlinkSync(outside,p,process.platform==='win32'?'junction':'dir');assert.throws(()=>new SkillService(dir).read('coordinator','pi-research-overview'),{code:'SKILL_PATH_DENIED'});}finally{rmSync(dir,{recursive:true,force:true});}});
test('worker bootstrap includes verified overview and role-specific catalog, not all long bodies',()=>{const s=new SkillService(root),b=s.bootstrap('reviewer');assert.equal(b.bundleId,s.bundleId);assert.match(b.prompt,/research_skill_read/);assert.ok(!b.skills.some(e=>e.name==='pi-research-agent-delegation'));assert.ok(b.prompt.length<20000);assert.equal(b.skills.length,s.list('reviewer').length);});
test('Pi ResourceLoader disables native file expansion while the trusted catalog stays in the prompt',()=>{const sdk={SessionManager:{create:()=>null},SettingsManager:{inMemory:()=>null},createExtensionRuntime:()=>null};const s=new SkillService(root),bundle=s.bootstrap('literature');const options=buildSessionOptions(sdk,{cwd:root,agentDir:root,sessionDir:root,sessionFile:null,systemPrompt:bundle.prompt,thinking:'off',skills:bundle.skills},[],null,null);assert.equal(options.resourceLoader.getSkills().skills.length,0);assert.equal(options.resourceLoader.getExtensions().extensions.length,0);assert.match(options.resourceLoader.getSystemPrompt(),/research_skill_read/);});
test('current Git guidance uses implemented operations while the old fixed guidance remains unchanged',()=>{const s=new SkillService(root),current=s.read('coordinator','pi-research-git').content;for(const id of ['workspace_history_commit','development_prepare']){assert.ok(TOOL_DEFINITIONS[id]);assert.ok(current.includes(id));}assert.doesNotMatch(current,/不是 Git 集成|开发测试沙箱未实现/);assert.match(s.read('coordinator','pi-research-feedback').content,/不.*发送|不.*上传/);assert.match(s.read('coordinator','pi-research-paper').content,/未实现|不.*编译/);});
test('resource-read examples resolve through the managed catalog including non-executed source assets',()=>{
 const s=new SkillService(root);let examples=0;
 for(const entry of s.list('coordinator'))for(const resource of [undefined,...entry.resources]){
  const body=s.read('coordinator',entry.id,resource).content;
  for(const match of body.matchAll(/```json\s*\n([\s\S]*?)\n```/g)){
   const value=JSON.parse(match[1]),input=value.input??value;
   if(input.skillId?.startsWith('pi-research-')){assert.ok(s.read('coordinator',input.skillId,input.resource).content);examples++;}
  }
 }
 assert.ok(examples>=2,'No managed resource examples exercised');
 const module=s.read('coordinator','pi-research-figures','assets/pi_figstyle.py');assert.match(module.content,/def use_style\(/);assert.doesNotMatch(module.content,/Copyright[^\n]*alphaXiv|MIT License|PROVENANCE\.md/i);
 assert.throws(()=>s.read('coordinator','pi-research-figures','assets/../../.env'),{code:'SKILL_RESOURCE_NOT_FOUND'});
});
