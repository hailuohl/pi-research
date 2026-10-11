// Real IPC lifecycle fixture; no SDK, provider, service or external network.
const pending=new Map();let seq=0;
const rpc=(contextRecovery)=>new Promise((resolve,reject)=>{const requestId=++seq;pending.set(requestId,{resolve,reject});process.send({type:'model_http_acquire',requestId,key:'context-fixture-'+seq,contextRecovery});});
process.on('message',async m=>{
 if(m.type==='model_http_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(p)m.error?p.reject(Error(m.error.code)):p.resolve(m.result);return;}
 if(m.type==='abort'){process.send({type:'done',aborted:true});return;}
 if(m.type!=='start')return;
 process.send({type:'fixture_start',eligible:m.contextRecoveryEligible});
 const mode=m.prompt.match(/RECOVERY (\S+)/)?.[1]??'old';
 if(mode==='sticky')process.send({type:'assistant_message',content:'',stopReason:'error',error:'PROVIDER_FAILED: earlier failure'});
 if(mode==='tool'){process.send({type:'assistant_message',content:'',toolCalls:['workspace_read'],stopReason:'toolUse'});process.send({type:'done'});return;}
 process.send({type:'assistant_message',content:'',stopReason:'length',...(mode==='unknown-tool'?{toolCalls:['unadvertised']}:{})});
 if(mode==='old'||mode==='unknown-tool'){process.send({type:'done'});return;}
 try{
  const phase=mode==='resume'?'resume':'summary',result=await rpc(phase);
  if(!result.allowed)throw Error('FIXTURE_HTTP_WAIT');
  process.send({type:'model_http_finish',requestId:++seq,key:'context-fixture-1',result:{state:'succeeded',status:200,receivedBytes:1,outcome:'body-complete'}});
  process.send({type:'assistant_message',content:'Recovery fixture output',stopReason:'stop'});process.send({type:'done'});
 }catch(error){process.send({type:'failure',error:'CONTEXT_COMPACTION_FAILED: '+error.message});}
});
process.on('disconnect',()=>process.exit(0));
