// IPC contract fixture only: no SDK and no model call.
process.on('message',m=>{if(m.type==='start'){
 process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model},sessionFile:m.piSessionPath});
 process.send({type:'assistant_message',content:JSON.stringify({fixture:true,bundleId:m.skillBundle?.bundleId,skills:m.skillBundle?.skills.map(s=>s.name),bootstrap:m.skillBundle?.prompt,tools:m.tools.map(t=>t.name)}),usage:{fixture:true}});
 process.send({type:'done'});
}else if(m.type==='abort')process.send({type:'done',aborted:true});});
