// Explicit IPC fixture, not Pi or a model. Records the host envelope and acknowledges context.
process.on('message',m=>{if(m.type==='start'){
 process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model},sessionFile:m.piSessionPath});
 process.send({type:'assistant_message',content:JSON.stringify({fixture:true,prompt:m.prompt,history:m.history,hostMessages:m.hostMessages}),usage:{fixture:true}});
 if(m.hostMessages?.length)process.send({type:'context_ack',messageIds:m.hostMessages.map(x=>x.id)});
 process.send({type:'done'});
}else if(m.type==='abort')process.send({type:'done',aborted:true});});
