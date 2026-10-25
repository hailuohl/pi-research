import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {USER} from '../../dist/packages/domain/types.js';

async function fixedAttachmentFlow(size,failAfterSave=false){
 const dir=mkdtempSync(join(tmpdir(),'pi-fixed-attachment-')),requests=[];
 assert.ok(Number.isSafeInteger(size)&&size>0);
 const briefRequest={question:'Dataset integrity',scope:'Offline integration',constraints:[],successCriteria:['Exact reference'],clarificationQuestions:[],literatureSummary:'One inspected page; not whole-text model reading.',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Use explicit dataset reference'}],status:'ready',expectedRevisionId:null};
 let savedBriefId=null,failedMessageId;
 const fixture=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push(input);
  const userIndex=input.messages.findLastIndex(m=>m.role==='user'),user=input.messages[userIndex],prompt=typeof user.content==='string'?user.content:user.content.filter(p=>p.type==='text').map(p=>p.text).join('\n');
  const refs=JSON.parse(prompt.replace(/\n\n<pi-research-input:[A-Za-z0-9_-]+>$/,'').split('\n').at(-1)),a=refs.attachments[0],turn=input.messages.slice(userIndex),readId='fixed-sdk-read-'+refs.messageId,freezeId='fixed-sdk-freeze-'+refs.messageId;
  const saved=turn.find(m=>m.role==='tool'&&m.tool_call_id===freezeId);if(saved){const brief=JSON.parse(saved.content);if(brief.kind==='research-brief')savedBriefId=brief.id;}
  if(failAfterSave&&saved&&!failedMessageId)failedMessageId=refs.messageId;
  if(failedMessageId===refs.messageId){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:'Offline injected failure after durable brief save',type:'service_unavailable'}}));return;}
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'fixed-fixture',object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})+'\n\n');
  if(!turn.some(m=>m.role==='tool'&&m.tool_call_id===readId)){
   chunk({role:'assistant',tool_calls:[{index:0,id:readId,type:'function',function:{name:'session_attachment_read',arguments:JSON.stringify({input:{messageId:refs.messageId,documentVersionId:a.documentVersionId,sourceDigest:a.digest,readProtocol:'fixed-text-v1',purpose:'dataset-reference',cursor:0,limit:64000}})}}]});chunk({},'tool_calls');
  }else if(!saved){
   chunk({role:'assistant',tool_calls:[{index:0,id:freezeId,type:'function',function:{name:'research_brief_save',arguments:JSON.stringify({input:{...briefRequest,expectedRevisionId:savedBriefId}})}}]});chunk({},'tool_calls');
  }else{chunk({role:'assistant',content:'Offline fixture: inspected one delivered page and saved an explicit dataset reference; no whole-text claim.'});chunk({},'stop');}
  res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-fixed':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),savedKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;
 try{
  await service.listen();service.app.sessions.configure(USER,{provider:'offline-fixed',model:'fixture',thinking:'off'});
  const project=service.app.projects.create(USER,{name:'Fixed attachment SDK fixture'}),session=service.app.sessions.create(USER,project.id,{title:'Fixed SDK delivery'});
  const block=Buffer.alloc(64*1024,97),stream=async function*(){for(let position=0;position<size;position+=block.length)yield block.subarray(0,Math.min(block.length,size-position));};
  const doc=await service.app.documents.importStream(USER,project.id,{title:'fixed-data.csv',mediaType:'text/csv'},stream(),'source');
  const message=service.app.sessions.send(USER,session.id,{content:'Inspect fixed dataset, preserve exact reference.',attachmentDocumentIds:[doc.id]});
  const waitMessage=async(id,status)=>{const end=Date.now()+30000;while(Date.now()<end){if(service.app.store.get('message',id).status===status&&service.host.active.size===0)return;await delay(20);}assert.equal(service.app.store.get('message',id).status,status);assert.equal(service.host.active.size,0);};
  await waitMessage(message.id,failAfterSave?'failed':'completed');if(!failAfterSave)assert.equal(requests.length,3);
  const toolResult=id=>requests.flatMap(request=>request.messages).find(m=>m.role==='tool'&&m.tool_call_id===id);
  const raw=toolResult('fixed-sdk-read-'+message.id),page=JSON.parse(raw.content);assert.equal(page.readProtocol,'fixed-text-v1');assert.equal(page.end,Math.min(16000,size));assert.equal(page.total,size);assert.equal(page.content,'a'.repeat(Math.min(16000,size)));assert.ok(Buffer.byteLength(raw.content)<128*1024);
  const receipt=service.app.store.get('attachment-input-read',page.attachmentReadId);assert.equal(receipt.delivery,'delivered');assert.equal(receipt.callId,'fixed-sdk-read-'+message.id);
  const savedTool=toolResult('fixed-sdk-freeze-'+message.id);assert.ok(savedTool,'the actual SDK must receive its brief-save tool result');
  const brief=JSON.parse(savedTool.content);assert.equal(brief.kind,'research-brief');assert.equal(service.app.store.get('research-brief',brief.id).digest,brief.digest);assert.equal(service.app.store.get('session',session.id).researchBriefId,brief.id);
  assert.equal(brief.sourceInputs[0].purpose,'dataset-reference');assert.equal(brief.sourceInputs[0].artifactId,doc.original.artifactId);assert.equal(brief.sourceInputs[0].size,size);assert.equal(service.app.store.list('artifact',project.id).filter(a=>a.origin?.startsWith('research-input:')).length,0);
  if(failAfterSave){
   const oldBrief=service.app.store.get('research-brief',brief.id),oldBinding=service.app.store.get('attachment-input-binding',page.attachmentBindingId),retry=service.app.sessions.retry(USER,session.id,message.id);
   await waitMessage(retry.id,'completed');const retryPage=JSON.parse(toolResult('fixed-sdk-read-'+retry.id).content),retryBrief=JSON.parse(toolResult('fixed-sdk-freeze-'+retry.id).content);
   assert.equal(service.app.store.get('message',message.id).status,'failed');assert.equal(service.app.store.get('attachment-input-read',retryPage.attachmentReadId).delivery,'delivered');assert.notEqual(retryPage.attachmentBindingId,page.attachmentBindingId);
   assert.equal(retryBrief.kind,'research-brief');assert.equal(retryBrief.previousRevisionId,brief.id);assert.equal(retryBrief.sourceInputs[0].readId,retryPage.attachmentBindingId);assert.equal(retryBrief.sourceInputs[0].artifactId,doc.original.artifactId);assert.equal(retryBrief.sourceInputs[0].digest,doc.original.digest);assert.equal(service.app.store.get('session',session.id).researchBriefId,retryBrief.id);
   assert.deepEqual(service.app.store.get('research-brief',brief.id),oldBrief);assert.deepEqual(service.app.store.get('attachment-input-binding',oldBinding.id),oldBinding);assert.deepEqual(service.app.store.get('attachment-input-read',receipt.id),receipt);
  }
  const wireBytes=Buffer.byteLength(JSON.stringify(requests)),peakRssBytes=process.resourceUsage().maxRSS*1024;
  assert.ok(wireBytes<2*1024*1024,'the fixed original must stay outside model request bodies');
  if(process.env.PI_RESEARCH_FIXED_ATTACHMENT_BYTES)assert.ok(peakRssBytes<384*1024*1024,'large attachment import/freeze must have bounded host memory');
  console.log(JSON.stringify({fixedAttachmentBytes:size,sdkPageBytes:Buffer.byteLength(page.content),sdkResultBytes:Buffer.byteLength(raw.content),wireBytes,peakRssBytes,delivery:receipt.delivery,purpose:brief.sourceInputs[0].purpose,freezeVia:'SDK-tool',postSaveRetry:failAfterSave}));
 }finally{
  if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;
  await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));rmSync(dir,{recursive:true,force:true});
 }
}

test('actual pinned SDK ACK delivers a bounded streamed attachment page and freezes an explicit dataset reference',()=>fixedAttachmentFlow(Number(process.env.PI_RESEARCH_FIXED_ATTACHMENT_BYTES??33*1024*1024)));
test('actual SDK saves a brief, observes provider failure, then retries the original document and saves a new fixed revision',()=>fixedAttachmentFlow(4096,true));
