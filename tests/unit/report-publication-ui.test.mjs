import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {ReportsView}=await import('../../dist/web/assets/report-view.js');
const {PublicationView}=await import('../../dist/web/assets/publication-view.js');
const sync=v=>{v.setState=(patch,done)=>{Object.assign(v.state,typeof patch==='function'?patch(v.state,v.props):patch);done?.();};return v;};
const result={id:'result-v1',jobId:'job-v1',revisionId:'revision-v1',sourceDigest:'fixed-source',manifestDigest:'fixed-manifest',status:'succeeded',converged:true,hadErrors:false,sourceValidity:'current',pdf:{artifactId:'fixed-pdf'},previews:[],logs:[],diagnostics:[]};
function reports(){return sync(synchronousState(new ReportsView({data:{project:{id:'project'},reports:[],runs:[],experiments:[],claims:[],artifacts:[]},perform:async f=>f()})));}
function publication(){const v=sync(synchronousState(new PublicationView({data:{project:{id:'project'},approvals:[],artifacts:[]},perform:async f=>f()})));v.state.revision={id:result.revisionId,title:'Historical paper',sourceDigest:result.sourceDigest};v.state.job={id:result.jobId,revisionId:result.revisionId,resultId:result.id,state:'succeeded',integrity:'complete'};v.state.result={...result};return v;}
function nodes(node,out=[]){if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}if(!node||typeof node!=='object')return out;assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),out);else nodes(node.props.children,out);return out;}
const reference={id:'figure',type:'artifact',targetId:'fixed-figure',path:'figures/plot.png',digest:'fixed-digest',label:'Original plot'};
const report={id:'report',artifactId:'body',title:'Paper report',integrity:'verified',validity:'stale',reasons:[],references:[reference],runs:[],publications:[{resultId:result.id,jobId:result.jobId,revisionId:result.revisionId,title:'Fixed paper',sourceDigest:result.sourceDigest,pdfArtifactId:'fixed-pdf',pdfDigest:'pdf-digest',pages:1,referenceId:'publication'}]};

test('only successful complete current fixed builds can enter a report; selection is bounded and deduplicated',()=>{
 const p=publication(),v=reports();p.props.onSelectResult=(r,title)=>v.addPublication(r,title);p.selectResult();p.selectResult();assert.equal(v.state.publications.length,1);
 for(const patch of [{sourceChecking:true},{sourceCheckError:'unavailable'},{loading:true},{result:{...result,sourceValidity:'stale'}},{result:{...result,status:'failed'}},{result:{...result,hadErrors:true}},{result:{...result,converged:false}},{result:{...result,pdf:null}},{job:{...p.state.job,integrity:'invalid'}},{job:{...p.state.job,resultId:'different'}}]){const before={...p.state};Object.assign(p.state,patch);assert.equal(p.selectableResult(),null);p.state=before;}
 for(let n=0;n<25;n++)v.addPublication({...result,id:`result-${n}`},'Paper');assert.equal(v.state.publications.length,20);
 const all=nodes(v.render());assert.equal(all.find(n=>n.type==='button'&&n.props.children==='生成固定结果报告').props.disabled,false);assert.ok(all.every(n=>!n.props.dangerouslySetInnerHTML&&!n.props.href));
 p.componentWillUnmount();v.componentWillUnmount();
});

test('publication-only creation sends fixed IDs and a late create cannot select another project',async()=>{
 const v=reports();v.addPublication(result,'Paper');let input,resolve;v.call=(name,value)=>{assert.equal(name,'report_create');input=value;return new Promise(r=>{resolve=r;});};const creating=v.create();assert.deepEqual(input,{title:'研究结果记录',runIds:[],claimIds:[],publicationResultIds:[result.id]});
 const prev=v.props;v.props={...prev,data:{...prev.data,project:{id:'another-project'}}};v.componentDidUpdate(prev);assert.deepEqual(v.state.publications,[]);resolve({id:'old-body'});await creating;assert.equal(v.state.pendingArtifactId,'');v.componentWillUnmount();
});

test('historical report navigation opens exact revision and job, never latest or an unbound ID',()=>{
 const v=reports();v.state.report=report;const calls=[];v.publicationView={openFixed:(...args)=>calls.push(args)};v.openPublication('unknown');assert.deepEqual(calls,[]);v.openPublication(result.id);assert.deepEqual(calls,[[result.revisionId,result.jobId]]);
 v.state.report={...report,integrity:'invalid'};v.openPublication(result.id);assert.equal(calls.length,1);v.componentWillUnmount();
});

test('fixed binary artifact download does not depend on a successful text read and is report-bound',async t=>{
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;t.after(()=>{globalThis.fetch=oldFetch;globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
 const requests=[],downloads=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return {ok:true,blob:async()=>new Blob(['binary'])};};URL.createObjectURL=()=> 'blob:fixed';URL.revokeObjectURL=()=>{};globalThis.document={body:{appendChild(){}},createElement:()=>({click(){downloads.push(this.download);},remove(){}})};
 const v=reports();Object.assign(v.state,{report,reference,referenceError:'BINARY_FILE'});await v.downloadReference();assert.equal(requests[0].url,'/api/artifacts/fixed-figure/content');assert.deepEqual(downloads,['plot.png']);
 v.state.reference={...reference,targetId:'unbound'};await v.downloadReference();assert.equal(requests.length,1);v.state.reference=reference;v.state.checking=true;await v.downloadReference();assert.equal(requests.length,1);v.componentWillUnmount();
});

test('publication and figure producer references read only frozen report-owned IDs with no HTML rendering',async()=>{
 const v=reports();v.state.report={...report,references:['publication','figure-source','figure-source-code'].map(type=>({id:type,type,targetId:'fixed-producer',path:'plot.py',digest:'digest',label:'<script>literal</script>'}))};
 const requests=[];v.call=async(name,input)=>{requests.push({name,input});const ref=v.state.report.references.find(r=>r.id===input.referenceId);return {reference:ref,content:'<script>literal</script>',cursor:0,end:24,complete:true};};
 for(const ref of v.state.report.references){await v.readReference(ref.id);assert.equal(v.state.verifiedReference.id,ref.id);assert.equal(v.state.referenceError,'');}
 assert.equal(requests.length,3);assert.ok(nodes(v.render()).every(n=>!n.props.dangerouslySetInnerHTML&&!n.props.href));v.componentWillUnmount();
});

test('a delayed workspace initialization cannot replace a report-targeted historical build with saved latest',async t=>{
 const oldStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=oldStorage;});globalThis.localStorage={getItem:()=>JSON.stringify({revisionId:'latest',jobId:'latest-job'}),setItem(){}};
 const p=publication(),fixed={...p.state.revision,mainFile:'main.tex',files:[{path:'main.tex',artifactId:'source',digest:'source-digest',mediaType:'text/plain'}]},calls=[];let finishList;
 p.call=async(name,input)=>{calls.push({name,input});if(name==='manuscript_list')return new Promise(resolve=>{finishList=resolve;});if(name==='publication_templates')return [];if(name==='publication_status')return {configured:true};if(name==='manuscript_inspect')return fixed;if(name==='publication_build_list')return {items:[],nextCursor:null};if(name==='manuscript_source_read')return {path:'main.tex',digest:'source-digest',cursor:0,end:3,content:'tex',complete:true};if(name==='publication_inspect')return {...p.state.job,id:result.jobId,revisionId:result.revisionId,sourceDigest:result.sourceDigest,manifestDigest:result.manifestDigest,state:'succeeded',integrity:'complete',resultId:result.id};if(name==='publication_result')return result;throw Error(name);};
 let focused=false;p.workspaceElement={focus(){focused=true;}};const initializing=p.initialize();await p.openFixed(result.revisionId,result.jobId);finishList({items:[],nextCursor:null});await initializing;
 assert.equal(p.state.revision.id,result.revisionId);assert.equal(p.state.job.id,result.jobId);assert.equal(focused,true);assert.ok(calls.every(c=>c.input?.revisionId!=='latest'));p.componentWillUnmount();
});

test('producer state changes reverify manuscript report and preserve historical reference text',()=>{
 const v=reports();v.state.report=report;v.state.content='Fixed graph source';v.props.data.sandboxJobs=[{id:'producer',state:'succeeded',integrity:'complete'}];let checked=0;v.reinspect=async()=>{checked++;};const prev=v.props;v.props={...prev,data:{...prev.data,sandboxJobs:[{id:'producer',state:'failed',integrity:'invalid'}]}};v.componentDidUpdate(prev);assert.equal(checked,1);assert.equal(v.state.content,'Fixed graph source');v.componentWillUnmount();
});
