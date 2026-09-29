import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const {DiscoveryGrants,discoveryDraft}=await import('../../dist/web/assets/discovery-grants.js');
const {LiteratureView}=await import('../../dist/web/assets/literature-view.js');
const sync=v=>{synchronousState(v);return v;};
function nodes(node,out=[]){if(node==null||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),out);else nodes(node.props.children,out);return out;}
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props.children);
const data={project:{id:'p'},sessions:[{id:'s',role:'coordinator',title:'Main',state:'active'}],approvals:[],discoveryGrants:[],literatureTasks:[],documents:[],documentParseJobs:[],artifacts:[],evidence:[],claims:[]};
const grant={id:'g',projectId:'p',sessionId:'s',model:{provider:'test',model:'fixed'},version:1,state:'active',effectiveState:'active',validity:'current',reasons:[],approvalId:'a',digest:'d',expiresAt:new Date(Date.now()+3600000).toISOString(),settingsVersion:1,sources:['crossref'],searches:[{query:'exact',sources:['crossref'],limit:2,strategy:'keyword',prioritize:'default'}],targets:[],allowSearchResults:true,formats:['provider-text'],maxResponseBytes:262144,usage:{limit:2,used:1,remaining:1,unit:'http-request-attempt'},calls:[{id:'call',source:'crossref',host:'api.crossref.org',status:'succeeded',startedAt:'now',bytes:123}],searchResults:[{id:'search',query:'exact',status:'complete',sources:[],items:[],retrievedAt:'now'}],papers:[{id:'paper',source:'crossref',idInSource:'doi',title:'Archived title',artifactId:'artifact',contentKind:'abstract',fullTextRead:false,rawArtifactIds:['raw']}]};

test('draft freezes a bounded native form and rejects unsafe limits',()=>{
 const input={sessionId:'s',searches:grant.searches,targets:[],allowSearchResults:true,formats:['provider-text'],maxRequests:2,maxResponseBytes:262144,expiresAt:new Date(Date.now()+3600000).toISOString()};
 assert.equal(discoveryDraft(input).searches[0].query,'exact');
 assert.deepEqual(discoveryDraft({...input,selected:'old',inspection:null,reading:false,error:'',preview:''}),discoveryDraft(input));
 assert.throws(()=>discoveryDraft({...input,maxRequests:101}),/HTTP/);
 assert.throws(()=>discoveryDraft({...input,expiresAt:new Date(Date.now()+25*3600000).toISOString()}),/24小时/);
});

test('grant inspection is project checked and shows actual calls and archived records',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);globalThis.fetch=async()=>({ok:true,json:async()=>grant});
 const view=sync(synchronousState(new DiscoveryGrants({data:{...data,discoveryGrants:[grant]},perform:async fn=>fn()})));await view.inspect('g');
 assert.match(flatten(view.render()),/api.crossref.org/);assert.match(flatten(view.render()),/Archived title/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({...grant,projectId:'other'})});await view.inspect('g');assert.match(view.state.error,/不属于所选项目/);
});

test('only search results carrying the same grant reference offer bound hit retrieval',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[];globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({id:'task'})};};
 const props={data:{...data,discoveryGrants:[grant]},perform:async fn=>fn()};const view=sync(synchronousState(new LiteratureView(props)));view.state.config={enabled:{crossref:true}};
 view.state.result={id:'search',query:'exact',sources:[],items:[{source:'crossref',id:'doi',title:'Hit'}],discoveryGrant:{id:'g',digest:'d',approvalId:'a'}};
 let tree=view.render();assert.match(flatten(tree),/以原检索授权获取此命中/);assert.doesNotMatch(flatten(tree),/提交此文献获取任务/);
 await nodes(tree).find(n=>n.type==='button'&&flatten(n).includes('以原检索授权获取此命中')).props.onClick();
 assert.deepEqual(requests[0].input,{kind:'retrieve',target:{source:'crossref',id:'doi',format:'provider-text'},discoveryGrantId:'g'});
 view.state.result={...view.state.result,discoveryGrant:undefined};tree=view.render();assert.doesNotMatch(flatten(tree),/以原检索授权获取此命中/);assert.match(flatten(tree),/提交此文献获取任务/);
 assert.ok(nodes(tree).every(n=>n.type!==undefined));
});
