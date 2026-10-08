// Real fork/IPC, deterministic transport; never contacts a provider.
import {managedModelFetch} from '../../dist/packages/pi-adapter/model-fetch.js';
const stop=new AbortController(),pending=new Map();let seq=0;
const rpc=(type,key,result,attachmentRefs)=>new Promise((resolve,reject)=>{const requestId=++seq;pending.set(requestId,{resolve,reject});process.send({type,key,result,requestId,attachmentRefs});});
process.on('message',async m=>{
 if(m.type==='model_http_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(p)m.error?p.reject(Error(m.error.code)):p.resolve(m.result);return;}
 if(m.type==='abort'){stop.abort();return;}if(m.type!=='start')return;
 try{const refs=m.attachmentManifests.at(-1).files.map(f=>f.reference),queued=m.prompt.match(/queued-ref:([A-Za-z0-9_-]+)/);if(queued)refs[0]={...refs[0],messageId:queued[1]};const fetcher=managedModelFetch(async()=>new Response('attachment gate fixture'),key=>rpc('model_http_acquire',key,undefined,refs),(key,result)=>rpc('model_http_finish',key,result),stop.signal);await (await fetcher('https://fixture.invalid/no-network')).text();process.send({type:'assistant_message',content:'Attachment gate allowed',stopReason:'stop'});process.send({type:'done'});}catch(error){process.send({type:'failure',error:error.message});}
});
process.on('disconnect',()=>process.exit(0));
