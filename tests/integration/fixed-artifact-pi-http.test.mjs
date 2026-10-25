import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as delay} from 'node:timers/promises';
import {createHttpServer} from '../../dist/apps/server/http.js';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';

async function fixedArtifactFlow(confirm=false){
 const size=confirm?32768:Number(process.env.PI_RESEARCH_FIXED_ARTIFACT_BYTES??3*1024*1024),dir=fs.mkdtempSync(join(tmpdir(),'pi-fixed-artifact-')),requests=[],quote='中文🙂完整单页引文',prefix=Buffer.from('\ufeff'+quote+'\r\n');assert.ok(Number.isSafeInteger(size)&&size>prefix.length);
 let artifact,approved=false;const toolErrors=new Map();
 const fixture=createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;const input=JSON.parse(body);requests.push(input);const tool=id=>{const m=input.messages.findLast(m=>m.role==='tool'&&m.tool_call_id===id);if(!m)return;try{return JSON.parse(m.content);}catch{if(!(confirm&&id==='quote'&&m.content.startsWith('APPROVAL_REQUIRED'))){toolErrors.set(id,m.content);console.error('FIXTURE_TOOL_ERROR',id,m.content);}return {fixtureError:m.content};}},prepared=tool('prepare'),page=tool('page'),registered=tool('quote'),resumed=confirm&&approved?tool('resume'):undefined,evidence=confirm&&approved?resumed?.result:registered,verified=tool('verify');
  const next=toolErrors.size?null:confirm&&approved&&!resumed?['resume','session_action_resume',{}]:confirm&&!approved&&registered?.fixtureError?null:!prepared?['prepare','artifact_text_prepare',{artifactId:artifact.id,sourceDigest:artifact.digest}]:!page?['page','artifact_read',{artifactId:artifact.id,readProtocol:'fixed-text-v1',sourceDigest:artifact.digest,textSourceId:prepared.textSourceId,cursor:0,limit:16000}]:!evidence?['quote','evidence_register',{artifactId:artifact.id,readProtocol:'fixed-text-v1',readId:page.artifactReadId,exactQuote:quote}]:!verified?['verify','evidence_read',{evidenceId:evidence.id}]:null;
  res.writeHead(200,{'content-type':'text/event-stream'});const chunk=(delta,finish_reason=null)=>res.write('data: '+JSON.stringify({id:'fixed-artifact',object:'chat.completion.chunk',created:1,model:input.model,choices:[{index:0,delta,finish_reason}]})+'\n\n');
  if(next){chunk({role:'assistant',tool_calls:[{index:0,id:next[0],type:'function',function:{name:next[1],arguments:JSON.stringify({input:next[2]})}}]});chunk({},'tool_calls');}else{chunk({role:'assistant',content:'Offline fixture: exact page delivered and quoted; full source hash verified, no scientific conclusion.'});chunk({},'stop');}res.end('data: [DONE]\n\n');
 });await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 fs.writeFileSync(join(dir,'models.json'),JSON.stringify({providers:{'offline-fixed-artifact':{api:'openai-completions',baseUrl:`http://127.0.0.1:${fixture.address().port}/v1`,apiKey:'offline-dummy',models:[{id:'fixture',contextWindow:32768,maxTokens:1024}]}}}));
 const service=createHttpServer({dataDir:dir,repoRoot:process.cwd(),port:0}),savedKey=process.env.PI_API_KEY,readFile=fs.readFileSync,open=fsp.open;delete process.env.PI_API_KEY;let evidenceId,pid,closed=false,sourcePath;let forbiddenSourceCopies=0;
 try{
  await service.listen();service.app.sessions.configure(USER,{provider:'offline-fixed-artifact',model:'fixture',thinking:'off'});const project=service.app.projects.create(USER,{name:'Fixed artifact SDK'}),session=service.app.sessions.create(USER,project.id,{title:'Exact artifact SDK delivery'});pid=project.id;if(confirm)service.app.sessionPermissions.initialize(session.id,'confirm');
  const block=Buffer.alloc(64*1024,97),stream=async function*(){yield prefix;for(let cursor=prefix.length;cursor<size;cursor+=block.length)yield block.subarray(0,Math.min(block.length,size-cursor));};
  const doc=await service.app.documents.importStream(USER,pid,{title:'fixed.txt',mediaType:'text/plain'},stream(),'source'),original=service.app.store.get('artifact',doc.original.artifactId);
  artifact=service.app.evidence.publishPrepared(pid,{title:'Existing ordinary CAS source',path:original.path,digest:original.digest,size:original.size,mediaType:'text/plain',origin:'user'});sourcePath=service.app.store.paths.physical(artifact.path);
  fs.readFileSync=function(path,...args){assert.notEqual(String(path),sourcePath,'fixed artifact flow must not buffer the complete source');return readFile.call(this,path,...args);};
  fsp.open=async function(path,flags,...args){if(/[/\\]text-index-staging[/\\][^/\\]+[/\\]source$/.test(String(path))){forbiddenSourceCopies++;throw Error('existing source must not be staged again');}if(String(path)===sourcePath)assert.ok(flags==='r'||typeof flags==='number','fixed source is read-only');return open.call(this,path,flags,...args);};syncBuiltinESMExports();
  const message=service.app.sessions.send(USER,session.id,{content:'Prepare the supplied fixed artifact, read its first page, register the exact quote, then verify the evidence. This is an offline transport fixture.'});
  const waitMessage=async id=>{const deadline=Date.now()+Number(process.env.PI_RESEARCH_FIXED_ARTIFACT_TIMEOUT_MS??160000);while(Date.now()<deadline){if(['completed','failed'].includes(service.app.store.get('message',id).status)&&service.host.active.size===0)break;await delay(20);}assert.equal(toolErrors.size,0,[...toolErrors].map(([tool,error])=>`SDK ${tool}: ${error}`).join('\n'));assert.equal(service.app.store.get('message',id).status,'completed',JSON.stringify(service.app.store.get('message',id)));assert.equal(service.host.active.size,0);};
  await waitMessage(message.id);
  let action;
  if(confirm){action=service.app.sessionPermissions.status(USER,session.id).actions.find(a=>a.operation==='evidence_register');assert.equal(action?.state,'pending');assert.equal(service.app.store.list('evidence',pid).length,0);approved=true;service.app.sessionPermissions.decide(USER,session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:action.approval.version,approved:true});const notice=service.app.sessions.messages(USER,session.id).find(m=>m.approvalNoticeId===action.id);assert.ok(notice);await waitMessage(notice.id);assert.equal(service.app.store.get('session-action',action.id).state,'completed');}
  const tool=id=>{const row=requests.flatMap(r=>r.messages).find(m=>m.role==='tool'&&m.tool_call_id===id);assert.ok(row,`SDK did not receive ${id}`);let result;assert.doesNotThrow(()=>{result=JSON.parse(row.content);},`SDK ${id}: ${row.content}`);return result;},prepared=tool('prepare'),page=tool('page'),evidence=confirm?tool('resume').result:tool('quote'),verified=tool('verify');evidenceId=evidence.id;
  assert.equal(prepared.status,'ready');assert.equal(page.sourceDigest,artifact.digest);assert.equal(Buffer.byteLength(page.content),Math.min(size,16000));assert.equal(page.content.charCodeAt(0),0xfeff);assert.equal(evidence.quote,quote);assert.deepEqual(evidence.locator,{start:1,end:1+quote.length});assert.equal(verified.quote,quote);
  const receipt=service.app.store.get('artifact-text-read',page.artifactReadId);assert.equal(receipt.delivery,'delivered');assert.equal(receipt.callId,'page');assert.equal(evidence.fixedText.readId,page.artifactReadId);assert.equal(forbiddenSourceCopies,0);
  const wireBytes=Buffer.byteLength(JSON.stringify(requests)),peakRssBytes=process.resourceUsage().maxRSS*1024;assert.ok(wireBytes<2*1024*1024);assert.equal(requests.length,confirm?7:5);if(confirm){assert.equal(receipt.actor.generation,1);assert.equal(service.app.store.get('session',session.id).generation,2);assert.equal(action.input.readId,page.artifactReadId);}
  if(process.env.PI_RESEARCH_FIXED_ARTIFACT_BYTES)assert.ok(peakRssBytes<384*1024*1024,'existing-source preparation and citation must not buffer the complete original');
  fs.readFileSync=readFile;fsp.open=open;syncBuiltinESMExports();await service.close();closed=true;
  const reopened=new ResearchApp(dir,process.cwd());try{assert.equal(reopened.evidence.verify(pid,evidenceId).quote,quote);}finally{reopened.close();}
  console.log(JSON.stringify({fixedArtifactBytes:size,sdkPageBytes:Buffer.byteLength(page.content),wireBytes,peakRssBytes,delivery:receipt.delivery,evidenceVia:'SDK-tool',existingSourceCopied:false,reopen:true,permissionMode:confirm?'confirm':'legacy'}));
 }catch(error){console.error('FIXED_ARTIFACT_FAILURE',error);throw error;}finally{fs.readFileSync=readFile;fsp.open=open;syncBuiltinESMExports();if(savedKey===undefined)delete process.env.PI_API_KEY;else process.env.PI_API_KEY=savedKey;if(!closed)await service.close();fixture.closeAllConnections();await new Promise(resolve=>fixture.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
}

test('actual pinned SDK prepares an existing CAS source, ACKs a byte page, registers and reads back exact evidence',()=>fixedArtifactFlow());
test('actual pinned SDK confirm approval resumes the original generation-1 delivered quote in generation 2',()=>fixedArtifactFlow(true));
