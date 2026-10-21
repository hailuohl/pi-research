// Deterministic IPC transport fixture; no model network request or external computation.
const pending=new Map();let serial=0,prefix='',mode;
function request(type,fields){const requestId=prefix+':'+(++serial);return new Promise(resolve=>{pending.set(requestId,resolve);process.send({type,...fields,requestId,...(type==='tool'?{toolCallId:requestId}:{})});});}
async function tool(name,input){const r=await request('tool',{tool:name,input});if(r.error)throw Error(JSON.stringify(r.error));return r.result;}
function done(content){process.send({type:'assistant_message',content,stopReason:'stop',usage:{fixture:true}});process.send({type:'done'});}
async function start(m){prefix=m.prompt.match(/<pi-research-input:([^>]+)>$/)?.[1];if(!prefix)throw Error('missing input envelope');process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});process.send({type:'input_consumed',messageId:prefix});
 const context=m.prompt.includes('【宿主持久化结果通知】')?JSON.parse(m.prompt.slice(m.prompt.indexOf('\n{')+1,m.prompt.lastIndexOf('\n\n<pi-research-input:'))):undefined;
 if(!context){const match=m.prompt.match(/FENCE_FIXTURE\|(run|development|owner)\|([a-z0-9-]+)/);if(!match)throw Error('fixture marker missing');mode=match[1];
  if(mode==='development'){await tool('workspace_write',{path:'test.py',content:'assert True\n',expectedDigest:null});await tool('development_prepare',{command:['python','test.py'],environmentImageDigest:'python@sha256:'+'a'.repeat(64)});}
  else {const i=await tool('run_prepare',{experimentId:match[2]});if(mode==='owner')await tool('run_submit',{intentId:i.id});}done('FENCE_INITIAL_PREPARED');return;
 }
 if(context.result.authorization){const a=context.result.authorization,development=a.subjectKind==='development-task',j=await tool(development?'development_submit':'run_submit',development?{developmentTaskId:a.subjectId}:{intentId:a.subjectId});await tool(development?'development_inspect':'run_inspect',development?{jobId:j.id}:{runId:j.id});const acquired=await request('model_http_acquire',{key:'prepared-after-submit'});if(acquired.error)throw Error(JSON.stringify(acquired.error));await request('model_http_finish',{key:'prepared-after-submit',result:{state:'succeeded',httpStatus:200,receivedBytes:0}});done('FENCE_PREPARED_SUBMITTED_AND_READ');return;}
 if(context.result.interruptedMessageId){const id=context.result.task.authorizations.find(a=>a.subjectKind==='run-intent'&&a.jobId).jobId;await tool('run_inspect',{runId:id});done('FENCE_OWNER_RECOVERED');return;}
 mode='waiting-owner';
}
process.on('message',m=>{
 if(m.type==='start')start(m).catch(error=>process.send({type:'failure',error:error.message}));
 else if(m.type==='tool_response'||m.type==='model_http_response'){pending.get(m.requestId)?.(m);pending.delete(m.requestId);}
 else if(m.type==='fixture_command')void(async()=>{let result;if(m.command==='acquire'||m.command==='finish')result=await request(m.command==='acquire'?'model_http_acquire':'model_http_finish',{key:m.key,...(m.command==='finish'?{result:{state:'succeeded',httpStatus:200,receivedBytes:0}}:{})});else if(m.command==='emit')process.send({type:'assistant_message',content:'STALE_OWNER_OUTPUT',stopReason:'stop',usage:{fixture:true}});else if(m.command==='done'){process.send({type:'done'});return;}process.send({type:'fixture_reply',token:m.token,result,mode});})();
 // Keep the old worker controllable briefly so a test can observe every fenced boundary before confirmed exit.
 else if(m.type==='abort'&&mode!=='waiting-owner')process.send({type:'done',aborted:true});
});
