// Real child-process IPC fixture only. No Pi SDK, provider, or model call.
let bundleId;const reads=[],skillId=process.env.SKILL_BINDING_FIXTURE_SKILL??'ipc-binding-fixture';
function read(index){process.send({type:'tool',tool:'research_skill_read',input:{skillId},toolCallId:`read-${index}`,requestId:`read-${index}`});}
process.on('message',m=>{
 if(m.type==='start'){
  bundleId=m.skillBundle.bundleId;
  process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});
  read(1);
 }else if(m.type==='tool_response'){
  if(m.error){process.send({type:'failure',error:`Fixture tool failed: ${m.error.code}`});return;}
  reads.push({bundleId:m.result.bundleId,digest:m.result.digest,content:m.result.content});
  process.send({type:'assistant_message',content:JSON.stringify({fixture:'ipc-only-no-sdk-no-model',phase:reads.length===1?'first':'second',bundleId,reads}),usage:{fixture:true,modelRequests:0}});
  if(reads.length===2)process.send({type:'done'});
 }else if(m.type==='steer'&&m.content==='READ_AFTER_RECONFIGURE'){
  process.send({type:'message_ack',messageId:m.messageId});process.send({type:'input_consumed',messageId:m.messageId});read(2);
 }else if(m.type==='abort')process.send({type:'done',aborted:true});
});
