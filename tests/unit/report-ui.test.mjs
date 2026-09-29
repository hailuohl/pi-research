import * as React from 'react';
import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {ReportsView}=await import('../../dist/web/assets/report-view.js');
const {Inspector}=await import('../../dist/web/assets/workbench.js');
const ref=id=>({id,type:'artifact',targetId:`artifact-${id}`,label:`<img src=x onerror=alert(1)> ${id}`,relation:'exact'});
function view(){
 const props={data:{project:{id:'project'},reports:[{id:'report',artifactId:'body'}],runs:[],experiments:[],claims:[],artifacts:[]},perform:async f=>f(),onRun(){}};
 const v=synchronousState(new ReportsView(props));synchronousState(v);
 v.state.report={id:'report',artifactId:'body',title:'Fixed report',formatVersion:1,integrity:'verified',validity:'current',reasons:[],references:[ref('a'),ref('b')],runs:[]};
 return v;
}
function elements(node,out=[]){if(Array.isArray(node)){node.forEach(n=>elements(n,out));return out;}if(!node||typeof node!=='object')return out;assert.ok(typeof node.type==='string'||typeof node.type==='function','actual React must receive valid element types');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)elements(node.type(node.props),out);else elements(node.props.children,out);return out;}
const response=value=>({ok:true,json:async()=>value});

test('actual React report UI treats markup as text and disables legacy/invalid exports',()=>{
 assert.equal(React.version,JSON.parse(readFileSync('package.json','utf8')).dependencies.react);assert.equal(React.Fragment,Symbol.for('react.fragment'));
 const v=view();v.state.body='<script>alert(1)</script> javascript:alert(1)';
 for(const status of ['legacy','stale','current']){
  v.state.report.validity=status;v.state.report.integrity=status==='current'?'invalid':'verified';
  const nodes=elements(v.render());
  assert.ok(nodes.every(n=>!n.props.dangerouslySetInnerHTML&&!n.props.href));
  const button=nodes.find(n=>n.type==='button'&&[].concat(n.props.children).includes('生成离线交付包'));
  assert.equal(button.props.disabled,true);
  assert.ok(nodes.some(n=>n.type==='pre'&&[].concat(n.props.children).includes(v.state.body)));
 }
});

test('reference reads use only report-owned IDs and discard late responses from previous selection',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const requests=[];
 globalThis.fetch=(url,options)=>new Promise(resolve=>requests.push({url,body:JSON.parse(options.body),resolve}));
 const v=view();await v.readReference('not-in-report');assert.equal(requests.length,0);
 const a=v.readReference('a'),b=v.readReference('b');assert.equal(requests.length,2);
 assert.deepEqual(requests[1].body,{projectId:'project',input:{reportId:'report',referenceId:'b',cursor:0,limit:16000}});
 requests[1].resolve(response({reference:ref('b'),content:'B first',mediaType:'text/plain',cursor:0,end:7,complete:false}));await b;
 requests[0].resolve(response({reference:ref('a'),content:'A late',mediaType:'text/plain',cursor:0,end:6,complete:true}));await a;
 assert.equal(v.state.content,'B first');assert.equal(v.state.reference.id,'b');
 const more=v.readReference('b',true);assert.equal(requests[2].body.input.cursor,7);
 requests[2].resolve(response({reference:ref('b'),content:' + end',mediaType:'text/plain',cursor:7,end:13,complete:true}));await more;
 assert.equal(v.state.content,'B first + end');assert.equal(v.state.complete,true);
});

test('mismatched reference identity fails closed and stale export makes no request',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});let calls=0;
 globalThis.fetch=async()=>{calls++;return response({reference:ref('b'),content:'wrong',mediaType:'text/plain',cursor:0,end:5,complete:true});};
 const v=view();await v.readReference('a');assert.equal(v.state.content,'');assert.match(v.state.referenceError,/不属于/);
 v.state.report.validity='stale';await v.exportReport();assert.equal(calls,1);
});

test('new report resolves from refreshed project records and precise Run navigation never falls back',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});globalThis.fetch=async()=>response({id:'new-body'});
 const v=view();let selected='',navigated=false;v.props.onSelect=id=>{selected=id;};v.props.onRun=()=>{navigated=true;};
 await v.create();assert.equal(v.state.pendingArtifactId,'new-body');
 v.props.data.reports.push({id:'new-report',artifactId:'new-body'});v.componentDidUpdate(v.props);assert.equal(selected,'new-report');assert.equal(v.state.pendingArtifactId,'');
 v.openRun('missing','experiment');assert.equal(navigated,false);assert.match(v.state.error,/未跳转/);
 const inspector=synchronousState(new Inspector({data:{runs:[{id:'latest',experimentId:'experiment'}]},experiment:{id:'experiment'},selectedRun:'missing'}));
 assert.equal(inspector.currentRun(),undefined);
});

test('persisted provenance changes recheck status only, preserve reading position, and ignore older checks',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const pending=[];
 globalThis.fetch=(url,options)=>new Promise(resolve=>pending.push({url,input:JSON.parse(options.body).input,resolve}));
 const v=view(),original=v.state.report;
 v.props.data.claims=[{id:'claim',version:1}];v.props.data.approvals=[{id:'approval',version:1}];
 Object.assign(v.state,{body:'Original Markdown',reference:ref('a'),content:'Already read',cursor:12,complete:false});
 let prev=v.props;v.props={...prev,data:structuredClone(prev.data)};v.componentDidUpdate(prev);
 assert.equal(pending.length,0,'array identity changes alone must not trigger blob verification');
 prev=v.props;v.props={...prev,data:{...prev.data,claims:[{id:'claim',version:2}]}};v.componentDidUpdate(prev);
 assert.equal(pending.length,1);assert.equal(v.state.checking,true);
 assert.ok(pending[0].url.endsWith('/report_inspect'));assert.deepEqual(pending[0].input,{reportId:'report'});
 await v.exportReport();assert.equal(pending.length,1,'export waits for current verification');
 prev=v.props;v.props={...prev,data:{...prev.data,approvals:[{id:'approval',version:2}]}};v.componentDidUpdate(prev);
 pending[1].resolve(response({...original,validity:'stale',reasons:['Review revoked']}));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(v.state.report.validity,'stale');assert.deepEqual(v.state.report.reasons,['Review revoked']);
 pending[0].resolve(response(original));await new Promise(resolve=>setImmediate(resolve));
 assert.equal(v.state.report.validity,'stale','late verification cannot restore old current status');
 assert.equal(v.state.body,'Original Markdown');assert.equal(v.state.content,'Already read');assert.equal(v.state.cursor,12);assert.equal(v.state.reference.id,'a');
 prev=v.props;v.props={...prev,data:structuredClone(prev.data)};v.componentDidUpdate(prev);assert.equal(pending.length,2);
});
const documentRef=()=>({...ref('pdf'),type:'evidence',document:{documentVersionId:'fixed-v1',rawDigest:'raw-digest',parseResultId:'parse-v1',pageNumber:2,textArtifactDigest:'text-digest',start:17,end:29,pageLabel:'ii',rawArtifactId:'raw-pdf',imageArtifactId:'page-png'}});
const referenceResponse=reference=>response({reference,content:'{"license":"unknown","sourceUrl":"javascript:alert(1)","quality":"unverified"}',mediaType:'application/json',cursor:0,end:90,complete:true});

test('PDF actions require a completed matching read and preserve the exact nonzero UTF-16 location',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});let resolve;
 globalThis.fetch=()=>new Promise(r=>{resolve=r;});
 const v=view(),reference=documentRef();v.state.report.references=[reference];let target;
 v.props.onDocument=value=>{target=value;};
 const reading=v.readReference(reference.id);
 const actions=()=>elements(v.render()).filter(n=>n.type==='button'&&['回到固定页段','下载原件 PDF','下载引用页 PNG'].includes(n.props.children));
 assert.equal(actions().length,3);assert.ok(actions().every(n=>n.props.disabled));v.openDocument();assert.equal(target,undefined);
 resolve(referenceResponse(reference));await reading;
 assert.ok(actions().every(n=>!n.props.disabled));actions()[0].props.onClick();
 assert.deepEqual(target,{documentVersionId:'fixed-v1',parseResultId:'parse-v1',pageNumber:2,start:17,end:29});
 assert.ok(elements(v.render()).every(n=>!n.props.href&&!n.props.dangerouslySetInnerHTML));
 assert.ok(elements(v.render()).some(n=>n.type==='p'&&n.props.children==='本报告未纳入正式运行；文稿与文档来源不代表运行实测结果。'));
 assert.ok(elements(v.render()).some(n=>n.type==='p'&&String(n.props.children).includes('许可未知不代表获得再分发许可')));
});

test('PDF reference identity binds every location and artifact field; a mismatch cannot navigate or download',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 for(const key of Object.keys(documentRef().document)){
  const v=view(),reference=documentRef();v.state.report.references=[reference];let calls=0,navigated=false;
  v.props.onDocument=()=>{navigated=true;};
  const wrong=structuredClone(reference);wrong.document[key]=typeof wrong.document[key]==='number'?wrong.document[key]+1:'wrong';
  globalThis.fetch=async()=>{calls++;return referenceResponse(wrong);};
  await v.readReference(reference.id);assert.match(v.state.referenceError,/不属于/,key);assert.equal(v.state.verifiedReference,null);
  v.openDocument();await v.downloadDocument('raw');assert.equal(navigated,false);assert.equal(calls,1);
 }
});

test('PDF downloads use authenticated artifact IDs only after explicit clicks and late reads cannot grant actions',async t=>{
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 t.after(()=>{globalThis.fetch=oldFetch;globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
 const pending=[],requests=[],downloads=[];
 globalThis.fetch=(url,options)=>{requests.push({url,options});return new Promise(resolve=>pending.push(resolve));};
 URL.createObjectURL=()=> 'blob:local-download';URL.revokeObjectURL=()=>{};
 globalThis.document={body:{appendChild(){}},createElement:()=>({click(){downloads.push({name:this.download,href:this.href});},remove(){}})};
 const v=view(),reference=documentRef();v.state.report.references=[reference,ref('b')];
 const late=v.readReference(reference.id),current=v.readReference('b');pending[1](referenceResponse(ref('b')));await current;pending[0](referenceResponse(reference));await late;
 assert.equal(v.state.verifiedReference.id,'b');assert.equal(v.documentReference(),null);
 const valid=v.readReference(reference.id);pending[2](referenceResponse(reference));await valid;assert.equal(requests.length,3,'reading never starts downloads');
 for(const [kind,id,name] of [['raw','raw-pdf','fixed-v1.pdf'],['image','page-png','fixed-v1-page-2.png']]){
  const download=v.downloadDocument(kind),request=requests.at(-1);
  assert.equal(request.url,`/api/artifacts/${id}/content`);assert.ok(request.options.headers.Authorization.startsWith('Bearer '));
  pending.at(-1)({ok:true,blob:async()=>new Blob(['fixed bytes'])});await download;
  assert.deepEqual(downloads.at(-1),{name,href:'blob:local-download'});
 }
 v.componentWillUnmount();await v.downloadDocument('raw');assert.equal(requests.length,5);
});

test('document and parse result changes reverify report provenance without resetting the reference cursor',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const pending=[];
 globalThis.fetch=()=>new Promise(resolve=>pending.push(resolve));
 const v=view(),reference=documentRef();v.state.report.references=[reference];
 Object.assign(v.state,{reference,verifiedReference:reference,content:'Fixed source metadata',cursor:123,body:'Original report'});
 v.props.data.documents=[{id:'fixed-v1',version:1}];v.props.data.documentParseJobs=[{id:'parse-job',state:'succeeded',integrity:'complete',resultId:'parse-v1'}];
 for(const patch of [{documents:[{id:'fixed-v1',version:2}]},{documentParseJobs:[{id:'parse-job',state:'succeeded',integrity:'invalid',resultId:'parse-v1'}]},{documentParseJobs:[{id:'parse-job',state:'succeeded',integrity:'invalid',resultId:'parse-v2'}]}]){
  const prev=v.props;v.props={...prev,data:{...prev.data,...patch}};v.componentDidUpdate(prev);
  assert.equal(v.state.checking,true);assert.equal(v.documentReference(),null);
  pending.at(-1)(response({...v.state.report,validity:'stale',reasons:['Fixed document changed']}));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(v.state.cursor,123);assert.equal(v.state.content,'Fixed source metadata');assert.equal(v.state.body,'Original report');
 }
 assert.equal(pending.length,3);
});
const pmcReference=()=>({...ref('pmc'),type:'evidence',providerText:{documentVersionId:'pmc-v1',documentDigest:'document-digest',rawDigest:'raw-digest',textArtifactDigest:'text-digest',reportedVersion:'PMC8270360.1',start:14,end:551,rawArtifactId:'raw-xml',textArtifactId:'derived-text'}});
test('PMC report reference returns to the exact fixed document only after a matching read',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const v=view(),reference=pmcReference();v.state.report.references=[reference];let target;
 v.props.onDocument=value=>{target=value;};
 assert.equal(v.providerTextReference(),null);v.openProviderText();assert.equal(target,undefined);
 const content='{"license":"CC BY 4.0","pageMapping":"unavailable"}';
 globalThis.fetch=async()=>response({reference,content,mediaType:'application/json',cursor:0,end:content.length,complete:true});
 await v.readReference(reference.id);assert.deepEqual(v.providerTextReference(),reference.providerText);
 assert.ok(elements(v.render()).some(n=>n.type==='p'&&String(n.props.children).includes('固定 PMC OA 全文')));
 const button=elements(v.render()).find(n=>n.type==='button'&&n.props.children==='回到固定 PMC 文档');assert.equal(button.props.disabled,false);button.props.onClick();
 assert.deepEqual(target,{documentVersionId:'pmc-v1'});
 for(const key of Object.keys(reference.providerText)){
  target=undefined;const wrong=structuredClone(reference);wrong.providerText[key]=typeof wrong.providerText[key]==='number'?wrong.providerText[key]+1:'wrong';
  globalThis.fetch=async()=>response({reference:wrong,content,mediaType:'application/json',cursor:0,end:content.length,complete:true});
  await v.readReference(reference.id);assert.match(v.state.referenceError,/不属于/,key);assert.equal(v.providerTextReference(),null);v.openProviderText();assert.equal(target,undefined,key);
 }
});
