// Deterministic local transport fixture. Real fork/IPC; no model or external network.
import {managedModelFetch} from '../../dist/packages/pi-adapter/model-fetch.js';
import {workerDeltaSender} from '../../dist/packages/pi-adapter/worker-delta.js';
const stop=new AbortController(),pending=new Map(),display=workerDeltaSender(m=>process.send(m));let seq=0,flood=false,requests=0;
const rpc=(type,key,result)=>new Promise((resolve,reject)=>{const requestId=++seq,timer=setTimeout(()=>{pending.delete(requestId);reject(Error('MODEL_HTTP_CONTROL_TIMEOUT: '+type));},flood?1500:5000);pending.set(requestId,{resolve,reject,timer});process.send({type,key,result,requestId});});
process.on('message',async m=>{
 if(m.type==='model_http_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(p){clearTimeout(p.timer);m.error?p.reject(Error(m.error.code)):p.resolve(m.result);}return;}
 if(m.type==='delta_ack'){if(!stop.signal.aborted)display.acknowledge(m.deltaId);return;}
 if(m.type==='abort'){display.clear();stop.abort();return;}
 if(m.type!=='start')return;
 flood=m.prompt.includes('flood');const content=flood?'微'.repeat(200):'HTTP IPC fixture complete';
 try{
  const f=managedModelFetch(async()=>{requests++;if(m.prompt.includes('crash'))process.exit(0);if(flood)for(const text of content)display.push(text);return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('fixture bytes'));setTimeout(()=>c.close(),flood?0:600);}}));},key=>rpc('model_http_acquire',key),(key,result)=>rpc('model_http_finish',key,result),stop.signal);
  const response=await f('https://fixture.invalid/no-network');await response.text();display.clear();process.send({type:'fixture_stats',requests});process.send({type:'assistant_message',content,stopReason:'stop',usage:null});process.send({type:'done'});
 }catch(error){display.clear();process.send({type:'fixture_stats',requests});process.send({type:'failure',error:error.message});}
});
process.on('disconnect',()=>{display.clear();stop.abort();process.exit(0);});
