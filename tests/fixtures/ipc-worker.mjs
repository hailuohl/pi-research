// Deterministic IPC harness only: NOT Pi, NOT an LLM, no scientific conclusions.
let input;const received=[];
process.on('message',m=>{
 if(m.type==='start'){
   if(m.prompt.includes('FIXTURE_EMPTY_OUTPUT')){process.send({type:'done'});return;}
   input=m;process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});
   process.send({type:'tool',tool:'project_inspect',input:{},toolCallId:'inspect',requestId:'inspect'});
 }else if(m.type==='tool_response'){
   if(m.requestId==='inspect'){
     process.send({type:'tool',tool:'run_submit',input:{intentId:'not-real'},toolCallId:'forbidden',requestId:'forbidden'});
   }else if(m.requestId==='forbidden'){
     setTimeout(()=>{process.send({type:'assistant_message',content:JSON.stringify({fixture:true,prompt:input.prompt,tools:input.tools.map(t=>t.name),received,denial:m.error?.code}),usage:{testFixture:true},stopReason:'stop'});process.send({type:'done'});},180);
   }
 }else if(m.type==='steer'||m.type==='follow_up'){
   received.push(m.content);process.send({type:'message_ack',messageId:m.messageId});
 }else if(m.type==='abort'){process.send({type:'done',aborted:true});}
});
