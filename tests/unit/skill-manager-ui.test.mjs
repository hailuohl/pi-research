import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
const {SkillManager,skillFileBase64}=await import('../../dist/web/assets/skill-manager.js');
const view=()=>synchronousState(new SkillManager({projectId:'project',sessionId:'session'}));
function nodes(node,out=[]){if(!node||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);nodes(node.props.children,out);return out;}
const text=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(text).join(' '):typeof node!=='object'?String(node):text(node.props.children);
const revision=id=>({revision:{id,packageId:'figure',revisionTag:id,description:'plot',roles:['coordinator'],license:null,requirements:{tools:['plot'],backends:['latex'],artifactIds:[]},files:[{path:'SKILL.md',size:20,digest:'hash'}],contentDigest:'hash',authorization:'text-only'},reviews:[],revocations:[]});
const catalog={configuration:{version:3,bundleId:'bundle',builtinBundleId:'builtin-old',revisionIds:[]},revisions:[revision('r1')],builtinSkills:[{id:'pi-research-overview',description:'Original workflow',resources:[],digest:'hash'}],builtinReleases:[]};
const reply=value=>({ok:true,json:async()=>value}),tick=()=>new Promise(resolve=>setImmediate(resolve));
const uploadForm=v=>{const element=nodes(v.render()).find(n=>n.type?.name==='SkillImport');return synchronousState(new element.type(element.props));};

test('library exposes only search, upload, names and custom switches with no advanced management GUI',()=>{
 const v=view();v.state.catalog=catalog;const all=nodes(v.render()),row=all.find(n=>n.props.className==='builtin-skill-row'),toolbar=all.find(n=>n.props.className==='skill-toolbar');
 assert.ok(!nodes(row).some(n=>n.type==='input'||n.type==='details'));assert.match(text(row),/梳理研究目标/);assert.match(text(v.render()),/内置技能始终由系统提供/);
 assert.equal(nodes(toolbar).filter(n=>n.type==='button').length,1);assert.ok(!all.some(n=>n.type==='select'||n.type==='textarea'||n.type?.name==='SkillSession'||n.type?.name==='Badge'));
 assert.ok(!all.some(n=>n.type==='button'&&/设置|刷新|恢复|批准|拒绝|撤销|查看$/.test(text(n))));assert.equal(all.filter(n=>n.type==='dialog').length,1);
 assert.ok(all.findIndex(n=>n.props.className==='skill-revision-row')<all.findIndex(n=>n.props.className==='builtin-skill-row'));
 assert.equal(all.find(n=>n.props.className==='skill-panel skill-detail-panel').props.hidden,true);assert.ok(!all.some(n=>n.props['aria-label']==='删除技能 pi-research-overview'));
});

test('legacy disabled builtins do not create GUI controls; off preserves authoritative baseline and clears legacy disabling',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view(),legacy={...catalog,configuration:{...catalog.configuration,revisionIds:['r1'],disabledBuiltinIds:['pi-research-overview']}};let authority=legacy;
 globalThis.fetch=async(url,options)=>{const request={url,...JSON.parse(options.body)};requests.push(request);if(url.endsWith('skill_bundle_configure'))authority={...authority,configuration:{...authority.configuration,version:authority.configuration.version+1,revisionIds:request.input.revisionIds,disabledBuiltinIds:[]}};return reply(authority);};await v.refresh();
 const restore=requests.find(request=>request.url.endsWith('skill_bundle_configure'));assert.deepEqual(restore.input,{expectedVersion:3,revisionIds:['r1'],builtinBundleId:'builtin-old',disabledBuiltinIds:[]});assert.deepEqual(v.state.enabled,['r1']);
 assert.ok(!nodes(v.render()).some(n=>n.props['aria-label']==='启用内置技能 pi-research-overview'));v.state.builtinBundleId='unsaved-other-baseline';
 await v.configure([]);const off=requests.find(request=>request.url.endsWith('skill_bundle_configure')&&request.input.revisionIds.length===0);assert.deepEqual(off.input,{expectedVersion:4,revisionIds:[],builtinBundleId:'builtin-old'});assert.ok(off.url.endsWith('skill_bundle_configure'));assert.deepEqual(v.state.enabled,[]);
});

test('old pending and rejected versions enable atomically; revoked versions can only turn off',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view(),rejected=revision('rejected'),revoked=revision('revoked');rejected.reviews=[{decision:'rejected'}];revoked.revocations=[{id:'revoke',note:'retained'}];
 v.state.catalog={...catalog,revisions:[revision('pending'),rejected,revoked]};v.state.enabled=['revoked'];const checkbox=id=>nodes(v.render()).find(n=>n.props['aria-label']===`配置启用 figure ${id}`);
 assert.equal(checkbox('pending').props.disabled,false);assert.equal(checkbox('rejected').props.disabled,false);assert.equal(checkbox('revoked').props.disabled,false);
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply({...v.state.catalog,configuration:{...catalog.configuration,version:4,revisionIds:['pending']}});};
 await checkbox('pending').props.onChange({target:{checked:true}});assert.deepEqual(requests[0].input,{revisionId:'pending',expectedVersion:3});assert.ok(requests[0].url.endsWith('skill_package_enable'));assert.equal(checkbox('pending').props.checked,true);
 assert.equal(checkbox('revoked').props.disabled,true);await checkbox('pending').props.onChange({target:{checked:false}});assert.deepEqual(requests[2].input,{expectedVersion:4,revisionIds:[],builtinBundleId:'builtin-old'});
});

test('failed enabling retains authoritative state and displays conflict without success',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const v=view();v.state.catalog=catalog;globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'配置已更新'}})});
 await nodes(v.render()).find(n=>n.props['aria-label']==='配置启用 figure r1').props.onChange({target:{checked:true}});
 assert.deepEqual(v.state.enabled,[]);assert.match(text(v.render()),/配置已更新/);assert.equal(v.state.notice,'');assert.equal(v.state.busy,false);
});

test('upload form preserves original bytes, minimal payload and stable retry key until success or editing',async()=>{
 const bytes=Buffer.from('# 技能🙂\r\n');assert.equal(await skillFileBase64(new File([bytes],'SKILL.md')),bytes.toString('base64'));await assert.rejects(skillFileBase64({size:2*1024*1024+1}),/2 MiB/);
 const form=uploadForm(view()),calls=[];let saved=false,resets=0;nodes(form.render()).find(n=>n.type==='form').props.ref.current={reset(){resets++;}};form.props={...form.props,submit:async(input,key)=>{calls.push({input,key});return saved;}};
 Object.assign(form.state,{packageId:'figure',files:[new File([bytes],'SKILL.md')]});await form.submit();await form.submit();assert.equal(calls[0].key,calls[1].key);assert.deepEqual(calls[0].input,calls[1].input);
 assert.deepEqual(calls[0].input.requirements,{tools:[],backends:[],artifactIds:[]});assert.deepEqual(calls[0].input.roles,['coordinator']);assert.equal(calls[0].input.license,null);assert.equal(calls[0].input.description,'用户上传的研究技能');assert.equal(calls[0].input.files[0].contentBase64,bytes.toString('base64'));assert.ok(!calls[0].input.zipBase64);
 form.change('description','edited');await form.submit();assert.notEqual(calls[2].key,calls[1].key);assert.equal(form.state.description,'edited');assert.equal(form.state.files.length,1);assert.equal(resets,0);saved=true;await form.submit();assert.equal(form.state.packageId,'');assert.equal(form.state.description,'');assert.deepEqual(form.state.files,[]);assert.equal(resets,1);
 Object.assign(form.state,{packageId:'figure',files:[new File([bytes],'SKILL.md')]});await form.submit();assert.notEqual(calls[4].key,calls[3].key);
 const all=nodes(form.render());assert.equal(all.filter(n=>n.type==='input').length,3);assert.ok(!all.some(n=>n.type==='select'||n.type==='fieldset'));assert.match(text(form.render()),/上传后自动开启/);
 await form.choose([new File(['---\nname: next-method\ndescription: next description\n---\n# Original'],'SKILL.md')]);assert.equal(form.state.packageId,'next-method');assert.equal(form.state.description,'next description');
});

test('late upload success cannot clear a newer draft or touch an unmounted file input',async()=>{
 const form=uploadForm(view());Object.assign(form.state,{packageId:'figure',files:[new File(['# Original'],'SKILL.md')]});let finish,resets=0;nodes(form.render()).find(n=>n.type==='form').props.ref.current={reset(){resets++;}};form.props={...form.props,submit:()=>new Promise(resolve=>finish=resolve)};
 const pending=form.submit();await tick();await form.choose([new File(['# Next'],'SKILL.md')]);form.change('packageId','next-method');finish(true);await pending;assert.equal(form.state.packageId,'next-method');assert.equal(form.state.files[0].name,'SKILL.md');assert.equal(resets,0);
 const second=form.submit();await tick();form.componentWillUnmount();finish(true);await second;assert.equal(resets,0);
});

test('optional single-line frontmatter hints do not replace original files and file validation remains enforced',async()=>{
 const form=uploadForm(view()),original=new File(['---\nname: "method"\ndescription: quick method\n---\n# 原文'],'SKILL.md');await form.choose([original]);assert.equal(form.state.packageId,'method');assert.equal(form.state.description,'quick method');assert.equal(form.state.files[0],original);
 let submits=0;form.props={...form.props,submit:async()=>{submits++;return false;}};form.state.files=[original,new File(['x'],'a.zip')];await form.submit();assert.match(form.state.error,/ZIP 必须单独/);
 form.state.files=Array(65).fill(original);await form.submit();assert.match(form.state.error,/1–64/);form.state.files=[{name:'big.zip',size:2*1024*1024+1}];await form.submit();assert.match(form.state.error,/2 MiB/);assert.equal(submits,0);
 for(const marker of ['>','|','>-','|+']){const fresh=uploadForm(view());await fresh.choose([new File([`---\nname: next-method\ndescription: ${marker}\n  block content\n---\n# Original`],'SKILL.md')]);assert.equal(fresh.state.packageId,'next-method');assert.equal(fresh.state.description,'');}
});

test('upload calls one atomic operation with stable Idempotency-Key and reads authoritative catalog before success',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();v.state.catalog=catalog;v.openPanel('upload');const input={packageId:'figure',files:[]};
 globalThis.fetch=async(url,options)=>{requests.push({url,key:options.headers['Idempotency-Key'],...JSON.parse(options.body)});return reply(url.endsWith('skill_package_list')?{...catalog,configuration:{...catalog.configuration,revisionIds:['r1']}}:{revision:revision('r1').revision,configuration:catalog.configuration});};
 assert.equal(await v.upload(input,'fixed-retry-key'),true);assert.deepEqual(requests[0],{url:'/api/operations/skill_package_upload',key:'fixed-retry-key',projectId:'project',input});assert.ok(requests[1].url.endsWith('skill_package_list'));assert.deepEqual(v.state.enabled,['r1']);assert.equal(v.state.panel,null);assert.match(v.state.notice,/上传并开启/);
 globalThis.fetch=async()=>({ok:false,status:400,json:async()=>({error:{code:'INVALID',message:'不允许该资源'}})});v.openPanel('upload');assert.equal(await v.upload(input,'failed-key'),false);assert.equal(v.state.panel,'upload');assert.equal(v.state.notice,'');assert.match(v.state.error,/不允许该资源/);
});

test('revision and resource late responses cannot overwrite a newer fixed selection',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,input:JSON.parse(options.body).input,resolve}));
 const first=v.inspect('r1'),second=v.inspect('r2');pending[1].resolve(reply(revision('r2')));await second;pending[0].resolve(reply(revision('r1')));await first;assert.equal(v.state.selected.revision.id,'r2');
 const resource=v.read('SKILL.md'),third=v.inspect('r3');pending[3].resolve(reply(revision('r3')));await third;pending[2].resolve(reply({content:'stale',resource:'SKILL.md',digest:'hash'}));await resource;assert.equal(v.state.selected.revision.id,'r3');assert.equal(v.state.content,null);
});

test('clicking a skill name opens original text and closing discards a late response',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();v.state.catalog=catalog;globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,input:JSON.parse(options.body).input,resolve}));
 const button=nodes(v.render()).find(n=>n.props['aria-label']==='查看技能 figure r1');assert.equal(text(button),'figure');button.props.onClick();assert.equal(v.state.panel,'detail');pending[0].resolve(reply(revision('r1')));await tick();assert.deepEqual(pending[1].input,{revisionId:'r1',resource:'SKILL.md'});
 v.closePanel();pending[1].resolve(reply({resource:'SKILL.md',digest:'hash',content:'late original'}));await tick();assert.equal(v.state.panel,null);assert.equal(v.state.selected,null);assert.equal(v.state.content,null);assert.equal(v.state.reading,false);assert.equal(pending.length,2);
});

test('native dialog cancel closes one panel while upload draft remains mounted across reopen',()=>{
 const v=view(),dialog={open:false,shows:0,showModal(){this.open=true;this.shows++;},close(){this.open=false;}};const initial=nodes(v.render()),native=initial.find(n=>n.type==='dialog');native.props.ref.current=dialog;
 const imported=initial.find(n=>n.type?.name==='SkillImport'),form=uploadForm(v);form.state.description='local draft';v.openPanel('upload');assert.equal(dialog.open,true);assert.equal(dialog.shows,1);
 let prevented=false;nodes(v.render()).find(n=>n.type==='dialog').props.onCancel({preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(dialog.open,false);v.openPanel('detail');v.closePanel();v.openPanel('upload');const reopened=nodes(v.render()),importElement=reopened.find(n=>n.type?.name==='SkillImport');
 assert.equal(reopened.filter(n=>n.type==='dialog').length,1);assert.equal(importElement.type,imported.type);assert.equal(importElement.key,imported.key);assert.equal(form.state.description,'local draft');assert.equal(reopened.find(n=>n.props.className==='skill-panel skill-upload-panel').props.hidden,false);
});

test('detail keeps technical declarations read-only, no duplicate one-file reader and no approval controls',()=>{
 const v=view();v.state.catalog=catalog;v.state.selected=catalog.revisions[0];v.openPanel('detail');v.state.content={resource:'SKILL.md',digest:'hash',content:'<script>original</script>'};const all=nodes(v.render()),detail=all.find(n=>n.props.className==='skill-panel skill-detail-panel');
 assert.match(text(detail),/许可证：\s*未知/);assert.match(text(detail),/latex/);assert.match(text(detail),/声明不会授予/);assert.ok(nodes(detail).some(n=>n.type==='details'&&/Revision\s+r1/.test(text(n))));assert.ok(!nodes(detail).some(n=>n.type==='textarea'||n.type==='button'&&/批准|拒绝|撤销|SKILL.md/.test(text(n))));assert.ok(all.every(n=>!n.props.dangerouslySetInnerHTML));
});

test('deleting a selected revision uses configuration version and returns to the updated list retaining history notice',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();v.state.catalog=catalog;v.state.selected=catalog.revisions[0];v.openPanel('detail');globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply({...catalog,revisions:[]});};
 await nodes(v.render()).find(n=>n.props['aria-label']==='删除技能 figure r1').props.onClick();assert.deepEqual(requests[0].input,{revisionId:'r1',expectedVersion:3});assert.ok(requests[0].url.endsWith('skill_package_delete'));assert.equal(v.state.catalog.revisions.length,0);assert.equal(v.state.panel,null);assert.match(v.state.notice,/历史原文.*保留/);
});

test('snapshot token quietly refreshes local catalog without clearing errors, notices, query or draft panels',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();v.state.catalog=catalog;Object.assign(v.state,{error:'retained failure',notice:'retained notice',query:'local'});v.openPanel('upload');const imported=nodes(v.render()).find(n=>n.type?.name==='SkillImport');
 globalThis.fetch=async(url,options)=>{requests.push({url,...JSON.parse(options.body)});return reply({...catalog,configuration:{...catalog.configuration,revisionIds:['r1']}});};const previous=v.props;v.props={...previous,refreshToken:{}};v.componentDidUpdate(previous);await tick();
 assert.deepEqual(v.state.enabled,['r1']);assert.equal(v.state.error,'retained failure');assert.equal(v.state.notice,'retained notice');assert.equal(v.state.query,'local');assert.equal(v.state.panel,'upload');assert.equal(nodes(v.render()).find(n=>n.type?.name==='SkillImport').key,imported.key);assert.deepEqual(requests,[{url:'/api/operations/skill_package_list',projectId:'project',input:{}}]);
});

test('quiet reads do not swallow a user toggle and cannot overwrite the mutation readback',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();v.state.catalog=catalog;globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,...JSON.parse(options.body),resolve}));
 const quiet=v.refresh(true),enabled=v.enable('r1');assert.equal(pending[1].url,'/api/operations/skill_package_enable');pending[1].resolve(reply({}));await tick();const current={...catalog,configuration:{...catalog.configuration,revisionIds:['r1'],version:4}};pending[2].resolve(reply(current));await enabled;pending[0].resolve(reply(catalog));await quiet;assert.equal(v.state.catalog,current);assert.deepEqual(v.state.enabled,['r1']);
});

test('late catalog and mutations retain their original project scope and cannot overwrite a new project',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=view();globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,...JSON.parse(options.body),resolve}));
 const first=v.refresh(),previous=v.props;v.props={projectId:'next-project'};v.componentDidUpdate(previous);assert.equal(v.state.catalog,null);const next={...catalog,configuration:{...catalog.configuration,builtinBundleId:'builtin-new'}};pending[1].resolve(reply(next));await tick();pending[0].resolve(reply(catalog));await first;assert.equal(v.state.catalog,next);
 v.openPanel('detail');v.state.selected=next.revisions[0];const save=v.remove('r1'),before=v.props;v.props={projectId:'third-project'};v.componentDidUpdate(before);v.openPanel('upload');pending[3].resolve(reply(catalog));await tick();pending[2].resolve(reply({}));await tick();assert.equal(pending[4].projectId,'next-project');pending[4].resolve(reply(next));await save;
 assert.equal(v.state.catalog,catalog);assert.equal(v.state.panel,'upload');assert.equal(v.state.notice,'');assert.equal(v.state.busy,false);
});
