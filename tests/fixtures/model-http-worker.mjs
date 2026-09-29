// Deterministic local transport fixture. Real fork/IPC; no model or external network.
import {managedModelFetch} from '../../dist/packages/pi-adapter/model-fetch.js';
const stop=new AbortController(),pending=new Map();let seq=0;
const rpc=(type,key,result)=>new Promise((resolve,reject)=>{const requestId=++seq;pending.set(requestId,{resolve,reject});process.send({type,key,result,requestId});});
process.on('message',async m=>{
 if(m.type==='model_http_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(p)m.error?p.reject(Error(m.error.code)):p.resolve(m.result);return;}
 if(m.type==='abort'){stop.abort();return;}
 if(m.type!=='start')return;
 try{
  const f=managedModelFetch(async()=>{if(m.prompt.includes('crash'))process.exit(0);return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('fixture bytes'));setTimeout(()=>c.close(),600);}}));},key=>rpc('model_http_acquire',key),(key,result)=>rpc('model_http_finish',key,result),stop.signal);
  const response=await f('https://fixture.invalid/no-network');await response.text();process.send({type:'assistant_message',content:'HTTP IPC fixture complete',stopReason:'stop',usage:null});process.send({type:'done'});
 }catch{process.send({type:'done',aborted:stop.signal.aborted});}
});
process.on('disconnect',()=>process.exit(0));
