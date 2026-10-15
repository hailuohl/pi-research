import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
const text=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(text).join(' '):typeof n!=='object'?String(n):typeof n.type==='function'&&!n.type.prototype?.render?text(n.type(n.props)):text(n.props?.children);

function nodes(node,out=[]){if(!node||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);nodes(node.props.children,out);return out;}
const config={version:4,enabled:{alphaxiv:false,openalex:false,biorxiv:false,pubmed:false,crossref:true},requestLimit:100,requestsUsed:2,credentials:{},capabilities:[]};
const makeView=async(projectId='p')=>{const {IntegrationsView}=await import('../../dist/web/assets/integrations.js');const v=synchronousState(new IntegrationsView({projectId,sessionId:'session'}));return v;};
const makeSkillView=async()=>{const parent=await makeView(),element=nodes(parent.render()).find(n=>n.type?.name==='SkillManager'),v=synchronousState(new element.type(element.props));v.state.catalog={configuration:{version:1,bundleId:'fixed',builtinBundleId:'builtin-old',revisionIds:[]},builtinSkills:[],revisions:[],builtinReleases:[]};return v;};

test('skill and connector tabs keep both panels and keyed manager mounted while local state persists',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let requests=0;globalThis.fetch=()=>{requests++;throw Error('unexpected request');};
 const v=await makeView();Object.assign(v.state,{skillQuery:'local keyword',query:'retained query',selectedSources:['crossref'],selectedSkill:{id:'fixed',resource:'SKILL.md',digest:'hash',content:'original'}});
 const before=nodes(v.render()),tabs=before.filter(n=>n.props.role==='tab'),panels=before.filter(n=>n.props.role==='tabpanel'),manager=before.find(n=>n.type?.name==='SkillManager');
 assert.equal(tabs.length,2);assert.equal(tabs[0].props['aria-selected'],true);assert.equal(tabs[0].props.tabIndex,0);assert.equal(tabs[1].props.tabIndex,-1);assert.equal(panels[0].props.hidden,false);assert.equal(panels[1].props.hidden,true);
 for(const tab of tabs){const panel=panels.find(n=>n.props.id===tab.props['aria-controls']);assert.ok(panel);assert.equal(panel.props['aria-labelledby'],tab.props.id);}
 tabs[1].props.onClick();const after=nodes(v.render()),hiddenManager=after.find(n=>n.type?.name==='SkillManager');
 assert.equal(after.find(n=>n.props.role==='tabpanel'&&n.props.id===panels[0].props.id).props.hidden,true);assert.equal(hiddenManager.type,manager.type);assert.equal(hiddenManager.key,manager.key);assert.deepEqual(hiddenManager.props,manager.props);
 after.find(n=>n.props.role==='tab'&&text(n).includes('技能')).props.onClick();
 assert.equal(v.state.skillQuery,'local keyword');assert.equal(v.state.query,'retained query');assert.deepEqual(v.state.selectedSources,['crossref']);assert.equal(v.state.selectedSkill.content,'original');assert.equal(requests,0);
 const other=nodes((await makeView('other-project')).render()).filter(n=>n.props.role==='tab');assert.ok(other.every(tab=>!tabs.some(n=>n.props.id===tab.props.id)));
});

test('native tab buttons support arrow, Home, End focus and leave Enter and Space native activation',async t=>{
 const prior=globalThis.document;t.after(()=>{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;});const focused=[];globalThis.document={getElementById:id=>({focus:()=>focused.push(id)})};const v=await makeView();
 const tabs=()=>nodes(v.render()).filter(n=>n.props.role==='tab');
 function key(index,value){let prevented=false;tabs()[index].props.onKeyDown({key:value,preventDefault(){prevented=true;}});return prevented;}
 assert.equal(key(0,'ArrowRight'),true);assert.equal(v.state.activePanel,'connectors');assert.equal(focused.at(-1),tabs()[1].props.id);
 assert.equal(key(1,'ArrowLeft'),true);assert.equal(v.state.activePanel,'skills');assert.equal(key(0,'End'),true);assert.equal(v.state.activePanel,'connectors');assert.equal(key(1,'Home'),true);assert.equal(v.state.activePanel,'skills');
 for(const value of ['Enter',' ']){assert.equal(key(1,value),false);tabs()[1].props.onClick();assert.equal(v.state.activePanel,'connectors');tabs()[0].props.onClick();}
 assert.ok(tabs().every(n=>n.type==='button'&&n.props.type==='button'));
});

test('library search is local, preserves canonical descriptions, and falls back for unfamiliar IDs',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);let requests=0;globalThis.fetch=()=>{requests++;throw Error('unexpected request');};const v=await makeSkillView();
 const skills=[{id:'pi-research-overview',description:'Original Workflow text',resources:['reference.txt']},{id:'third-party-special',description:'Unfamiliar tool notes',resources:[]},{id:'pi-research-compute',description:'Use available compute resources',resources:[]}];v.state.catalog.builtinSkills=skills;
 const input=()=>nodes(v.render()).find(n=>n.props['aria-label']==='搜索技能');const rows=()=>nodes(v.render()).filter(n=>n.props.className==='builtin-skill-row');
 assert.match(text(rows()[0]),/研究工作流/);assert.match(text(rows()[0]),/梳理研究目标/);assert.match(text(rows()[1]),/third-party-special/);assert.match(text(v.render()),/3\s+个技能/);
 input().props.onChange({target:{value:' TOOL '}});assert.equal(rows().length,1);assert.match(text(rows()[0]),/third-party-special/);input().props.onChange({target:{value:'Original Workflow'}});assert.equal(rows().length,1);assert.match(text(rows()[0]),/研究工作流/);input().props.onChange({target:{value:'PI-RESEARCH-OVERVIEW'}});assert.equal(rows().length,1);
 input().props.onChange({target:{value:'计算'}});assert.equal(rows().length,1);assert.match(text(rows()[0]),/计算环境/);
 input().props.onChange({target:{value:'unmatched'}});assert.equal(rows().length,0);assert.match(text(v.render()),/没有匹配的技能/);assert.equal(v.state.catalog.builtinSkills,skills);assert.equal(skills.length,3);
 input().props.onChange({target:{value:''}});assert.equal(rows().length,3);assert.ok(!nodes(v.render()).some(n=>n.props['aria-label']==='技能来源'));assert.equal(requests,0);
});

test('built-in resource reading and closing retain original text without implicit source requests',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=await makeSkillView();v.state.catalog.builtinSkills=[{id:'pi-research-overview',description:'text',resources:['ref notes.txt']}];globalThis.fetch=async url=>{requests.push(url);return {ok:true,json:async()=>({id:'pi-research-overview',resource:'ref notes.txt',digest:'fixed-digest',content:'<script>original</script>'})};};
 v.openPanel('detail');await v.readBuiltin('pi-research-overview','ref notes.txt');assert.deepEqual(requests,['/api/skills/pi-research-overview?bundleId=builtin-old&resource=ref+notes.txt']);
 const tree=v.render(),pre=nodes(tree).find(n=>n.type==='pre'&&text(n)==='<script>original</script>');assert.ok(pre);assert.ok(!pre.props.dangerouslySetInnerHTML);assert.match(text(tree),/fixed-digest/);
 nodes(tree).find(n=>n.type==='button'&&n.props['aria-label']==='关闭技能面板').props.onClick();assert.equal(v.state.builtinContent,null);assert.equal(v.state.panel,null);assert.equal(requests.length,1);
});
