// Deterministic IPC fixture: real AgentHost claims and tool transport, no model/provider request.
let sequence=0,prefix='';const pending=new Map();
const tool=(name,input)=>new Promise((resolve,reject)=>{const id=prefix+':durable-restart-'+(++sequence);pending.set(id,{resolve,reject});process.send({type:'tool',tool:name,input,toolCallId:id,requestId:id});});
async function run(m){
 prefix=m.prompt.match(/<pi-research-input:([^>]+)>$/)?.[1];if(!prefix)throw Error('missing input envelope');
 process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});
 if(!m.prompt.includes('【宿主持久化结果通知】')){const id=m.prompt.match(/DURABLE_HOST_FIXTURE\|([a-z0-9-]+)/)?.[1];if(!id)throw Error('fixture target missing');const intent=await tool('run_prepare',{experimentId:id});await tool('run_submit',{intentId:intent.id});process.send({type:'assistant_message',content:'DURABLE_INITIAL_SUBMITTED',usage:{testFixture:true},stopReason:'stop'});process.send({type:'done'});return;}
 if(m.permissionMode!=='fullAccess'||m.tools.some(t=>t.name==='host_execute'))throw Error('durable permission or shell exposure mismatch');
 const context=JSON.parse(m.prompt.slice(m.prompt.indexOf('\n{')+1,m.prompt.lastIndexOf('\n\n<pi-research-input:')));
 const result=await tool('run_inspect',{runId:context.result.id});if(result.state!=='succeeded')throw Error('original Run not reconciled');
 await tool('research_task_checkpoint',{state:'completed',summary:'IPC fixture read the original terminal Run after restart',runIds:[result.id],developmentJobIds:[]});
 process.send({type:'assistant_message',content:'DURABLE_RESTART_READ_COMPLETE',usage:{testFixture:true},stopReason:'stop'});process.send({type:'done'});
}
process.on('message',m=>{if(m.type==='start'){if(m.messageId)process.send({type:'input_consumed',messageId:m.messageId});run(m).catch(error=>process.send({type:'failure',error:error.message}));}else if(m.type==='tool_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.type==='abort')process.send({type:'done',aborted:true});});
