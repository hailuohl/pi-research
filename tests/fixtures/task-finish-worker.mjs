// Deterministic Host IPC fixture; no SDK, provider, or scientific output.
let mode, output, committedId;
const send=value=>process.connected&&process.send(value);
process.on('message',m=>{
 if(m.type==='start'){
  const parts=m.prompt.match(/HOST_FINISH (\w+) (\w+)/);mode=parts[1];
  output={summary:'Host lifecycle fixture',outcome:parts[2],artifactIds:[],evidenceIds:[],claims:[],unresolvedQuestions:[]};
  send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});
  if(mode==='hold')return;
  if(mode==='missing'){send({type:'done'});return;}
  send({type:'tool',tool:'task_result_submit',requestId:1,toolCallId:'fixed-submit',input:output});
 }else if(m.type==='tool_response'&&m.requestId===1){
  committedId=m.result?.id;
  send({type:'tool',tool:'task_result_submit',requestId:2,toolCallId:'fixed-submit',input:output});
 }else if(m.type==='tool_response'&&m.requestId===2){
  if(m.result?.id!==committedId)throw Error('Committed replay changed');
  send({type:'tool',tool:'task_progress_report',requestId:3,toolCallId:'late-new-write',input:{message:'Must not persist after submit'}});
 }else if(m.type==='tool_response'&&m.requestId===3){
  if(m.error?.code!=='LEASE_EXPIRED')throw Error('Late side effect was not fenced');
  setTimeout(()=>{
   if(mode==='crash'){process.exit(7);return;}
   if(mode==='provider')send({type:'assistant_message',content:'',error:'PROVIDER_FAILED: fixture failure after commit',stopReason:'error',usage:{fixture:true}});
   else if(mode==='aborted')send({type:'assistant_message',content:'partial fixture',error:'模型请求已中止',stopReason:'aborted',usage:{fixture:true}});
   else send({type:'assistant_message',content:'Fixture drain complete',stopReason:'stop',usage:{fixture:true}});
   send({type:'done',aborted:mode==='aborted'});
  },200);
 }else if(m.type==='abort'){
  send({type:'delta',text:'LATE_ABORT_DELTA'});
  send({type:'assistant_message',content:'LATE_ABORT_MESSAGE',error:'模型请求已中止',stopReason:'aborted',usage:{fixture:true}});
  send({type:'tool',tool:'task_progress_report',requestId:99,toolCallId:'late-after-abort',input:{message:'LATE_ABORT_WRITE'}});
  send({type:'done',aborted:true});
 }
});
