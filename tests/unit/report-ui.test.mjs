import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const vendor={};vm.runInNewContext(readFileSync('apps/web/public/vendor/react.production.min.js','utf8'),vendor);
globalThis.React=vendor.React;
const {ReportsView}=await import('../../dist/web/assets/report-view.js');
const {Inspector}=await import('../../dist/web/assets/workbench.js');
const ref=id=>({id,type:'artifact',targetId:`artifact-${id}`,label:`<img src=x onerror=alert(1)> ${id}`,relation:'exact'});
function view(){
 const props={data:{project:{id:'project'},reports:[{id:'report',artifactId:'body'}],runs:[],experiments:[],claims:[],artifacts:[]},perform:async f=>f(),onRun(){}};
 const v=new ReportsView(props);v.setState=(patch,callback)=>{Object.assign(v.state,patch);callback?.();};
 v.state.report={id:'report',artifactId:'body',title:'Fixed report',formatVersion:1,integrity:'verified',validity:'current',reasons:[],references:[ref('a'),ref('b')],runs:[]};
 return v;
}
function elements(node,out=[]){if(Array.isArray(node)){node.forEach(n=>elements(n,out));return out;}if(!node||typeof node!=='object')return out;assert.ok(typeof node.type==='string'||typeof node.type==='function','actual React16 must receive valid element types');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)elements(node.type(node.props),out);else elements(node.props.children,out);return out;}
const response=value=>({ok:true,json:async()=>value});

test('actual React16 report UI treats markup as text and disables legacy/invalid exports',()=>{
 assert.equal(React.version,'16.0.0');assert.equal(React.Fragment,undefined);
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
 const inspector=new Inspector({data:{runs:[{id:'latest',experimentId:'experiment'}]},experiment:{id:'experiment'},selectedRun:'missing'});
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
