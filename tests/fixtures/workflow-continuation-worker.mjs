const request=(tool,input,id)=>{process.send({type:'tool_execution_start',tool,toolCallId:id});process.send({type:'tool',tool,input,toolCallId:id,requestId:id});};
const finish=result=>{process.send({type:'assistant_message',content:JSON.stringify({fixture:true,result}),stopReason:'stop'});process.send({type:'done'});};
process.on('message',message=>{
 if(message.type==='start'){
  process.send({type:'input_consumed',messageId:message.messageId});
  if(message.prompt.includes('UNIT superseding question')){finish({human:true});return;}
  if(message.tools.some(tool=>tool.name==='session_action_resume'))request('session_action_resume',{},'resume');
  else request('artifact_create',{title:'UNIT first',content:'Synthetic fixed first artifact'},'first');
 }else if(message.type==='tool_response'){
  if(message.requestId==='resume'&&!message.error&&message.result?.result?.title==='UNIT first')request('artifact_create',{title:'UNIT second',content:'Synthetic fixed second artifact'},'second');
  else finish({requestId:message.requestId,result:message.result,error:message.error});
 }else if(message.type==='steer'||message.type==='follow_up')throw Error('Workflow fixture must not consume another input');
 else if(message.type==='abort')process.send({type:'done',aborted:true});
});
