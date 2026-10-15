import test from 'node:test';
import assert from 'node:assert/strict';

function mockGlobal(t, name, value) {
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,name);
 Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});
 t.after(()=>descriptor?Object.defineProperty(globalThis,name,descriptor):delete globalThis[name]);
}

test('legacy token cleanup preserves other hash parameters and history state',async t=>{
 const state={keep:true};let removed,replaced;
 mockGlobal(t,'location',{pathname:'/work',search:'?project=1',hash:'#tab=reports&token=fixture&view=full'});
 mockGlobal(t,'sessionStorage',{removeItem:key=>{removed=key;}});
 mockGlobal(t,'history',{state,replaceState:(...args)=>{replaced=args;}});
 await import('../../dist/web/assets/api.js?token-cleanup');
 assert.equal(removed,'pi-research-token');
 assert.deepEqual(replaced,[state,'','/work?project=1#tab=reports&view=full']);
});

test('hash cleanup still works when session storage is unavailable',async t=>{
 const state={keep:true};let replaced;
 mockGlobal(t,'location',{pathname:'/',search:'',hash:'#token=fixture&tab=reports'});
 mockGlobal(t,'sessionStorage',{removeItem(){throw Error('storage unavailable');}});
 mockGlobal(t,'history',{state,replaceState:(...args)=>{replaced=args;}});
 await import('../../dist/web/assets/api.js?storage-unavailable');
 assert.deepEqual(replaced,[state,'','/#tab=reports']);
});

test('API, event stream, and artifact helpers send requests without Authorization',async t=>{
 mockGlobal(t,'location',{pathname:'/',search:'',hash:'#tab=chat'});
 mockGlobal(t,'sessionStorage',{removeItem(){}});
 mockGlobal(t,'history',{state:null,replaceState(){}});
 const oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 t.after(()=>{globalThis.fetch=oldFetch;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
 const requests=[],downloads=[];
 globalThis.fetch=async(url,options={})=>{
  requests.push({url,options});
  return {ok:true,json:async()=>({ok:true}),text:async()=>'artifact text',blob:async()=>new Blob(['artifact']),body:{stream:true},headers:{get:()=> 'text/event-stream'}};
 };
 URL.createObjectURL=()=> 'blob:fixture';URL.revokeObjectURL=()=>{};
 mockGlobal(t,'document',{body:{appendChild(){}},createElement:()=>({click(){downloads.push({href:this.href,name:this.download});},remove(){}})});
 const {api,eventStream,artifactText,artifactBlob,downloadArtifact}=await import('../../dist/web/assets/api.js');
 assert.deepEqual(await api('/bootstrap',undefined,'GET'),{ok:true});
 await api('/change',{value:1});
 assert.deepEqual(await eventStream('/events',new AbortController().signal),{stream:true});
 assert.equal(await artifactText('text/id'),'artifact text');
 assert.ok(await artifactBlob('blob/id') instanceof Blob);
 await downloadArtifact('download/id','fixture.bin');
 assert.equal(requests.length,6);
 assert.ok(requests.every(({options})=>!Object.hasOwn(options.headers??{},'Authorization')));
 assert.equal(requests[0].options.method,'GET');
 assert.equal(requests[1].options.headers['Content-Type'],'application/json');
 assert.equal(requests[1].options.body,'{"value":1}');
 assert.match(requests[1].options.headers['Idempotency-Key'],/^[0-9a-f-]{36}$/i);
 assert.deepEqual(requests[2].options.headers,{Accept:'text/event-stream'});
 assert.deepEqual(requests.slice(3).map(request=>request.url),[
  '/api/artifacts/text%2Fid/content','/api/artifacts/blob%2Fid/content','/api/artifacts/download%2Fid/content'
 ]);
 assert.deepEqual(downloads,[{href:'blob:fixture',name:'fixture.bin'}]);
});
