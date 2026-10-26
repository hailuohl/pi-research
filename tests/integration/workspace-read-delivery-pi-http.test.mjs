import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';

async function flow({confirm=false,retry=false,faults=false}={}) {
 const dir=fs.mkdtempSync(join(tmpdir(),'pi-workspace-ack-')),requests=[],errors=[],draft='\ufeffA😀\r\n中文 small draft',source='\ufeffSource😀\r\n小原文',plan={question:'Read delivered workspace bytes',scope:'Offline SDK fixture',constraints:[],successCriteria:['Full delivered coverage'],clarificationQuestions:[],literatureSummary:'Small sources and a fixed dataset reference',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Freeze delivered sources'}],status:'ready'};
 let cycle=0,approved=false,savedId=null,lastWrite=null,injected=0;
 const fixture=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push(input);
  const tool=id=>{const row=input.messages.findLast(m=>m.role==='tool'&&m.tool_call_id===`${id}-${cycle}`);if(!row)return;try{return JSON.parse(row.content);}catch{return {fixtureError:row.content};}};
  const saved=tool('save'),resumed=tool('resume');if(saved?.id)savedId=saved.id;if(resumed?.result?.id)savedId=resumed.result.id;
  if(retry&&cycle===0&&saved?.id){res.writeHead(503,{'content-type':'application/json'});res.end(JSON.stringify({error:{message:'Offline failure after durable workspace brief',type:'service_unavailable'}}));return;}
  let next=null;const want=(id,name,args)=>{const found=tool(id);if(!found&&!next)next=[id,name,args];return found;};
  if(confirm&&approved){const inspection=want('notice-read','workspace_read',{path:'draft.md'});if(inspection?.draftReadId)errors.push(['notice minted a draft receipt',inspection]);const page=want('notice-page','workspace_read',{path:'draft.md',readProtocol:'workspace-text-v1',limit:8});if(page&&!page.fixtureError?.startsWith('TASK_SCOPE_DENIED'))errors.push(['notice obtained page authority',page]);want('resume','session_action_resume',{});}else{
   const fixed=want('fixed','workspace_text_prepare',{path:'dataset.txt',purpose:'dataset-reference'});if(fixed?.artifactId)want('dataset-page','artifact_read',{artifactId:fixed.artifactId,sourceDigest:fixed.sourceDigest,textSourceId:fixed.textSourceId,readProtocol:'fixed-text-v1',limit:16});
   if(faults){want('project-missing','workspace_read',{source:'project',path:'source.txt'});const denied=want('source-denied','research_brief_save',{...plan,expectedRevisionId:savedId});if(denied&&!denied.fixtureError?.startsWith('BRIEF_SOURCE_READ_REQUIRED'))errors.push(['source-denied',denied]);}
   if(!confirm){const written=want('write','workspace_write',{path:'draft.md',content:draft,expectedDigest:lastWrite});if(written?.digest)lastWrite=written.digest;}
   if(faults){const read=want('draft-transformed','workspace_read',{path:'draft.md'});if(read?.draftReadId){const denied=want('draft-denied','research_brief_save',{...plan,expectedRevisionId:savedId,draftFiles:[{path:'draft.md',readId:read.draftReadId}]});if(denied&&!denied.fixtureError?.startsWith('BRIEF_DRAFT_READ_REQUIRED'))errors.push(['draft-denied',denied]);}}
   if(!confirm)want('write-empty','workspace_write',{path:'empty.txt',content:'',expectedDigest:cycle===0?null:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'});
   want('project-default','workspace_read',{source:'project',path:'source.txt'});want('draft-default','workspace_read',{path:'draft.md'});
   want('empty-default','workspace_read',{path:'empty.txt'});const empty=want('empty-page','workspace_read',{path:'empty.txt',readProtocol:'workspace-text-v1',limit:4});
   let finalDraft;for(const [prefix,path,scope]of [['project-page','source.txt','project'],['draft-page','draft.md','session']]){
    let cursor=0,binding;for(let i=0;i<30;i++){const page=want(`${prefix}-${i}`,'workspace_read',{source:scope,path,readProtocol:'workspace-text-v1',limit:8,...(binding?{readBindingId:binding}:{}),cursor});if(!page)break;if(page.fixtureError){errors.push([prefix,page.fixtureError]);break;}binding=page.readBindingId;cursor=page.end;if(page.complete){if(scope==='session')finalDraft=page;break;}}
   }
   if(finalDraft&&empty?.draftReadId){const value=want('save','research_brief_save',{...plan,expectedRevisionId:savedId,draftFiles:[{path:'draft.md',readId:finalDraft.draftReadId},{path:'empty.txt',readId:empty.draftReadId}]});if(value?.fixtureError&&!(confirm&&value.fixtureError.startsWith('APPROVAL_REQUIRED')))errors.push(['save',value]);}
  }
  if(errors.length)next=null;
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'workspace-delivery',object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})+'\n\n');
  if(next){chunk({role:'assistant',tool_calls:[{index:0,id:`${next[0]}-${cycle}`,type:'function',function:{name:next[1],arguments:JSON.stringify({input:next[2]})}}]});chunk({},'tool_calls');}else{chunk({role:'assistant',content:'Offline workspace delivery fixture finished.'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 fs.writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-workspace-ack':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),oldKey=process.env.PI_API_KEY;delete process.env.PI_API_KEY;let closed=false;
 try {await service.listen();service.app.sessions.configure(USER,{provider:'offline-workspace-ack',model:'fixture',thinking:'off'});const project=service.app.projects.create(USER,{name:'Workspace ACK SDK'}),session=service.app.sessions.create(USER,project.id,{title:'Workspace ACK'});
  fs.writeFileSync(join(service.app.store.paths.physical(project.workspace),'source.txt'),source);fs.writeFileSync(join(service.app.store.paths.physical(project.workspace),'dataset.txt'),'dataset '.repeat(512));
  if(confirm){for(const [path,content]of [['draft.md',draft],['empty.txt','']])service.app.operations.execute(USER,'workspace_write',{path,content,expectedDigest:null},{projectId:project.id,sessionId:session.id,idempotencyKey:'owner-'+path});service.app.sessionPermissions.initialize(session.id,'confirm');}
  // Fault injection occurs after the real worker produced its SDK event; successes use the original host path.
  if(faults){const original=service.host.completeReadDelivery.bind(service.host);service.host.completeReadDelivery=(active,tool,callId,message,...rest)=>{if(callId==='project-missing-0'){injected++;return false;}if(callId==='draft-transformed-0'){injected++;return original(active,tool,callId,{...message,resultDigest:'incorrect-sdk-result'},...rest);}return original(active,tool,callId,message,...rest);};}
  const wait=async(id,status='completed')=>{const deadline=Date.now()+180000;while(Date.now()<deadline){if(['completed','failed'].includes(service.app.store.get('message',id).status)&&!service.host.active.size)break;await delay(20);}assert.deepEqual(errors,[]);assert.equal(service.app.store.get('message',id).status,status,JSON.stringify({message:service.app.store.get('message',id),sessionError:service.app.store.get('session',session.id).lastError,requests:requests.length}));assert.equal(service.host.active.size,0);};
  const message=service.app.sessions.send(USER,session.id,{content:'Read the project source and managed draft in default and bounded modes, then save ready.'});await wait(message.id,retry?'failed':'completed');
  if(confirm){const action=service.app.sessionPermissions.status(USER,session.id).actions.find(a=>a.operation==='research_brief_save');assert.equal(action?.state,'pending');assert.equal(service.app.store.list('research-brief',project.id).length,0);approved=true;service.app.sessionPermissions.decide(USER,session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});const notice=service.app.sessions.messages(USER,session.id).find(m=>m.approvalNoticeId===action.id);await wait(notice.id);assert.equal(service.app.store.get('session-action',action.id).state,'completed');}
  assert.ok(savedId);const first=service.app.store.get('research-brief',savedId),firstRaw=service.app.store.db.prepare("SELECT data FROM records WHERE id=?").get(first.id).data;
  if(retry){cycle=1;const retried=service.app.sessions.retry(USER,session.id,message.id);await wait(retried.id);assert.notEqual(savedId,first.id);assert.equal(service.app.store.get('research-brief',savedId).previousRevisionId,first.id);assert.equal(service.app.store.db.prepare('SELECT data FROM records WHERE id=?').get(first.id).data,firstRaw);}
  const latest=service.app.store.get('research-brief',savedId);assert.equal(latest.sourceInputs.length,2);assert.equal(latest.sourceInputs.find(i=>i.path==='dataset.txt').purpose,'dataset-reference');
  for(const kind of ['research-input-read','workspace-draft-read']){const rows=service.app.store.list(kind,project.id);assert.ok(rows.some(r=>r.callId.endsWith(`default-${cycle}`)&&r.delivery==='delivered'));assert.ok(rows.some(r=>r.callId.includes('-page-')&&r.delivery==='delivered'));if(faults){assert.equal(rows.find(r=>r.callId.includes(kind==='research-input-read'?'project-missing':'draft-transformed')).delivery,'pending');}}
  if(faults)assert.equal(injected,2);
  service.app.researchBriefs.confirm(USER,project.id,session.id,{briefId:latest.id,expectedVersion:latest.version});const accepted=service.app.store.get('research-brief',latest.id);await service.close();closed=true;
  const reopened=new ResearchApp(dir,process.cwd());try{assert.deepEqual(reopened.store.get('research-brief',latest.id),accepted);assert.equal(reopened.researchBriefs.capture(USER,project.id,session.id).id,latest.id);}finally{reopened.close();}
  console.log(JSON.stringify({actualPinnedSdk:true,defaultAndPaged:true,projectAndDraft:true,confirm,retry,missingAndTransformedAck:faults,reopen:true,requests:requests.length}));
 }finally{if(oldKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=oldKey;if(!closed)await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
}
test('actual SDK default and paged workspace reads reject missing/transformed ACK, then retry and reopen',()=>flow({faults:true}));
test('actual SDK workspace proof survives exact approved-action recovery in a later generation',()=>flow({confirm:true}));
test('actual SDK normal retry after durable workspace save keeps the old revision',()=>flow({retry:true}));
