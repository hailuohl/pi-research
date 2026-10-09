// Deterministic IPC workflow harness: no LLM and no research data.
import {createHash} from 'node:crypto';
const pending=new Map();let serial=0,prefix='';
const digest=s=>createHash('sha256').update(s).digest('hex');
function tool(name,input){const id=prefix+':'+String(++serial);return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});process.send({type:'tool',tool:name,input,toolCallId:id,requestId:id});});}
async function run(m){
 prefix=m.prompt.match(/<pi-research-input:([^>]+)>$/)?.[1];if(!prefix)throw Error('missing input envelope');
 process.send({type:'ready',model:{provider:m.model.provider,id:m.model.model}});
 const marker=m.prompt.match(/AUTONOMY_FIXTURE\|([a-z0-9-]+)\|([^\s"\\]+)/);if(!marker)throw Error('fixture marker missing');const experimentId=marker[1],image=marker[2];
 const context=m.prompt.includes('【宿主持久化结果通知】')?JSON.parse(m.prompt.slice(m.prompt.indexOf('\n{')+1,m.prompt.lastIndexOf('\n\n<pi-research-input:'))):null;
 let outcome;
 const prepare=()=>tool('development_prepare',{command:['python','main.py'],environmentImageDigest:image,dockerContext:'desktop-linux',resources:{timeoutSeconds:20}});
 if(!context){await tool('workspace_write',{path:'main.py',content:'assert False\n',expectedDigest:null});const t=await prepare();if(t.approval.status!=='approved')throw Error('exact test not approved');const j=await tool('development_submit',{developmentTaskId:t.id});outcome={step:'initial-test',jobId:j.id};}
 else {
   if(m.tools.some(t=>t.name==='host_execute'))throw Error('continuation exposed host execution');
   const result=context.result;
   if(result.developmentTaskId&&result.state==='failed'){await tool('development_logs',{jobId:result.id,stream:'stderr'});await tool('workspace_write',{path:'main.py',content:'assert True\n',expectedDigest:digest('assert False\n')});const t=await prepare(),j=await tool('development_submit',{developmentTaskId:t.id});outcome={step:'repair',jobId:j.id};}
   else if(result.developmentTaskId&&result.state==='succeeded'){const i=await tool('run_prepare',{experimentId});if(i.approval.status!=='approved')throw Error('exact Run not approved');const r=await tool('run_submit',{intentId:i.id});outcome={step:'baseline',runId:r.id};}
   else if(result.experimentId===experimentId){const p=await tool('project_inspect',{}),parent=p.experiments.find(e=>e.id===experimentId),read=await tool('experiment_source_read',{experimentId,revision:parent.revision,path:'config.json'});const config=JSON.parse(read.content);const variant=await tool('experiment_plan_submit',{title:'Bounded config comparison',hypothesis:'Synthetic fixture only',parentId:experimentId,expectedParentRevision:parent.revision,config:{...config,polynomialDegree:2}});const i=await tool('run_prepare',{experimentId:variant.id}),r=await tool('run_submit',{intentId:i.id});outcome={step:'variant',runId:r.id};}
   else {await tool('run_inspect',{runId:result.id});outcome={step:'complete',validation:result.validation,runId:result.id};}
 }
 process.send({type:'assistant_message',content:JSON.stringify({fixture:true,...outcome}),usage:{testFixture:true},stopReason:'stop'});process.send({type:'done'});
}
process.on('message',m=>{if(m.type==='start')run(m).catch(e=>process.send({type:'failure',error:e.message}));else if(m.type==='tool_response'){const p=pending.get(m.requestId);pending.delete(m.requestId);if(m.error)p?.reject(Error(JSON.stringify(m.error)));else p?.resolve(m.result);}else if(m.type==='abort')process.send({type:'done',aborted:true});});
