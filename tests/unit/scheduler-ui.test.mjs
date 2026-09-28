import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const vendor={};vm.runInNewContext(readFileSync('apps/web/public/vendor/react.production.min.js','utf8'),vendor);globalThis.React=vendor.React;
const {SchedulerView,ComputeWait,computeReasonLabels}=await import('../../dist/web/assets/scheduler-view.js');
const limits={maxRuns:2,maxDevelopment:2,maxJobs:4,cpus:null,memoryMb:null,maxQueued:null};
const usage={jobs:2,runs:1,development:1,cpus:2,memoryMb:512,unknown:1};
const available={jobs:2,runs:1,development:1,cpus:null,memoryMb:null};
const capacity={version:1,maxWorkers:2,available:0,unit:'pi-worker',httpConcurrencyMeasured:false,counts:{held:2,reserved:0,running:1,stopping:0,unknown:1},queued:[{sessionId:'session',role:'coordinator',reasons:[{code:'global-capacity',message:'等待共享 Worker 容量'}]}]};
const compute={scope:'shared-data-directory',configuration:{version:1,targetId:'global',limits},usage,available,queued:1,targets:[{targetId:'engine',backend:'docker',contexts:['default','desktop-linux'],configuration:{version:0,targetId:'engine',limits},usage,available}],items:[{kind:'run',id:'run',projectId:'project',sequence:1,state:'unknown',held:true,backend:'docker',targetId:'engine',requested:{cpus:1,memoryMb:256},generation:2,leaseUntil:0,nextAttemptAt:0,reason:'recovery_due'}],nextCursor:50};
function view(){const v=new SchedulerView({data:{project:{id:'project'},compute:structuredClone(compute),agentCapacity:structuredClone(capacity)},perform:async f=>{try{return await f();}catch{return undefined;}}});v.setState=(patch,callback)=>{Object.assign(v.state,patch);callback?.();};return v;}
function nodes(node,result=[]){if(!node||typeof node!=='object')return result;if(Array.isArray(node)){node.forEach(n=>nodes(n,result));return result;}assert.ok(typeof node.type==='string'||typeof node.type==='function','React16 element type must be valid');result.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),result);else nodes(node.props.children,result);return result;}
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props.children);

test('real React16 scheduler explains shared budgets, alias identity, unknown subset and worker units',()=>{
 assert.equal(React.Fragment,undefined);const tree=view().render();nodes(tree);const content=flatten(tree);
 assert.match(content,/2 \/ 4 个；可用 2/);assert.match(content,/未设预算；已预留 2 核/);
 assert.match(content,/已包含在上述作业占用中，不重复扣减/);assert.match(content,/default、desktop-linux/);
 assert.equal(computeReasonLabels.manual_recovery_required,'旧宿主作业需要人工核对，保留占用');assert.match(content,/HTTP 并发未测量/);assert.match(content,/等待共享 Worker 容量/);assert.match(content,/待核对原作业并恢复监管/);
 assert.equal(Object.keys(computeReasonLabels).length,13);
});

test('server available capacity is displayed without local recalculation',()=>{const v=view();v.props.data.compute.available={...available,jobs:0};assert.match(flatten(v.render()),/2 \/ 4 个；可用 0/);});

test('missing first-page queue item never claims ready and missing DTO has explicit loading feedback',()=>{
 const text=flatten(ComputeWait({data:{compute},kind:'run',id:'not-on-first-page',onScheduler(){}}));
 assert.match(text,/不在当前队列页/);assert.ok(!text.includes('容量检查通过'));
 const v=view();delete v.props.data.compute;delete v.props.data.agentCapacity;
 assert.match(flatten(v.render()),/Worker 容量待加载/);assert.match(flatten(v.render()),/计算容量与队列待加载/);
});

test('capacity conflict keeps the edited full draft and submits blank budgets as null',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);let request;
 globalThis.fetch=async(_url,options)=>{request=JSON.parse(options.body);return {ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'配置版本冲突'}})};};
 const formElement=nodes(view().render()).find(n=>n.type?.name==='ComputeForm'),form=new formElement.type(formElement.props);
 form.setState=(patch,callback)=>{Object.assign(form.state,patch);callback?.();};form.state.fields={...form.state.fields,maxJobs:'7'};form.state.dirty=true;
 await form.save();assert.equal(request.input.expectedVersion,1);assert.deepEqual(request.input.limits,{...limits,maxJobs:7});
 assert.equal(form.state.fields.maxJobs,'7');assert.equal(form.state.dirty,true);assert.equal(form.state.version,1);assert.match(form.state.error,/冲突/);
 const old=form.props;form.props={...old,configuration:{...old.configuration,version:2,limits:{...limits,maxJobs:9}}};form.componentDidUpdate(old);
 assert.equal(form.state.fields.maxJobs,'7','server refresh must not replace an edited draft');
});

test('queue pages use server cursors and a late refresh cannot replace a newer page',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);const requests=[];
 globalThis.fetch=(url,options)=>new Promise(resolve=>requests.push({url,body:JSON.parse(options.body),resolve}));
 const v=view(),first=v.refresh(0),second=v.refresh(50);assert.equal(requests[2].body.input.cursor,50);
 const reply=(request,value)=>request.resolve({ok:true,json:async()=>value});
 reply(requests[2],{...compute,items:[],nextCursor:null});reply(requests[3],capacity);await second;
 reply(requests[0],compute);reply(requests[1],capacity);await first;
 assert.equal(v.state.cursor,50);assert.deepEqual(v.state.compute.items,[]);assert.equal(v.state.compute.nextCursor,null);
});

test('target probe sends only explicit context, refreshes after success and safely retains errors',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);const requests=[];let refreshes=0,fail=false;
 globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return fail?{ok:false,status:409,json:async()=>({error:{code:'COMPUTE_TARGET_PROBE_REQUIRED',message:'<script>context needs checking</script>'}})}:{ok:true,json:async()=>({context:'desktop-linux',targetId:'engine-1',backend:'docker',observedAt:'2026-09-28T00:00:00Z'})};};
 const element=nodes(view().render()).find(n=>n.type?.name==='TargetProbe'),probe=new element.type({...element.props,onConfirmed:async()=>{refreshes++;}});
 probe.setState=(patch,callback)=>{Object.assign(probe.state,patch);callback?.();};
 await probe.probe();assert.equal(refreshes,1);assert.ok(requests[0].url.endsWith('/compute_target_probe'));
 assert.deepEqual(requests[0].body,{projectId:'project',input:{context:'desktop-linux'}});assert.equal(probe.state.result.targetId,'engine-1');
 fail=true;await probe.probe();assert.equal(refreshes,1);assert.equal(probe.state.result,null);assert.equal(probe.state.context,'desktop-linux');
 assert.equal(probe.state.error,'<script>context needs checking</script>');assert.ok(nodes(probe.render()).every(n=>!n.props.dangerouslySetInnerHTML));assert.equal(requests.length,2);
});
