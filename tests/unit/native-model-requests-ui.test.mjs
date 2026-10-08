import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {NativeModelRequests} from '../../dist/web/assets/native-model-requests.js';
import {Chat} from '../../dist/web/assets/workbench.js';
import {SessionHistory} from '../../dist/web/assets/session-history.js';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const find=(tree,predicate)=>elements(tree).find(predicate);
const response=data=>({ok:true,json:async()=>data});
const failed=(status,message)=>({ok:false,status,json:async()=>({error:{message}})});
const model={provider:'owner',model:'research',thinking:'deep'};
const session={id:'session',version:1,role:'coordinator',state:'idle',model};
const source={kind:'document',id:'pdf',artifactId:'pdf-artifact',title:'Research.pdf',digest:'a'.repeat(64),size:1024,mediaType:'application/pdf',scope:'whole-file'};
const video={kind:'media',id:'video',artifactId:'video-artifact',title:'Experiment.mp4',digest:'b'.repeat(64),size:2048,mediaType:'video/mp4',scope:'whole-file'};
const available={declared:true,state:'available',reason:'Native adapter available'};
const availability={api:'openai-responses',profile:'openai',pdf:available,video:available,nativeWebSearch:available};
const key=source=>JSON.stringify([source.kind,source.id]);
const request=(overrides={})=>({id:'request',version:1,projectId:'project',sessionId:'session',createdAt:'2026-10-08T00:00:00Z',updatedAt:'2026-10-08T00:00:00Z',prompt:'Analyze the whole PDF',model,destination:{baseUrl:'https://api.example.com/v1',api:'openai-responses',profile:'openai'},sources:[source],search:false,maxOutputTokens:1024,expiresAt:'2099-01-01T00:00:00Z',state:'pending',dispatchBudget:1,dispatched:0,approval:{id:'approval',version:1,status:'pending',reason:''},response:null,receipt:null,continuationAvailable:false,...overrides});
const approved=()=>request({state:'approved',version:2,approval:{id:'approval',version:2,status:'approved',reason:'Exact approval'}});
const panel=(overrides={})=>{const view=synchronousState(new NativeModelRequests({session,projectId:'project',busy:false,perform:async fn=>fn(),...overrides}));view.setState({open:true,prompt:'Analyze the whole PDF',sources:[source],selected:[key(source)],availability});return view;};
function mock(t,fetch){const previous=globalThis.fetch;globalThis.fetch=fetch;t.after(()=>globalThis.fetch=previous);}

test('native operation context remains callable with React context and partial edits retain required draft fields',()=>{
 const view=panel();assert.equal(typeof view.operationContext,'function');assert.deepEqual(view.operationContext(),{sessionId:'session',projectId:'project',epoch:0});view.context={reactContext:true};assert.equal(view.operationContext().sessionId,'session');view.edit({prompt:'Edited'});assert.equal(view.state.search,false);assert.equal(view.state.maxOutputTokens,'1024');assert.equal(view.state.maxOutputDirty,false);assert.deepEqual(view.state.selected,[key(source)]);assert.equal(view.state.draftVersion,1);
});

test('prepare fixes only source IDs and requires separate exact approval and one explicit execution',async t=>{
 const calls=[];mock(t,async(url,init)=>{const body=init?.body?JSON.parse(init.body):undefined;calls.push({url,body});return response(url.endsWith('/decide')?approved():url.endsWith('/execute')?request({state:'completed',version:3,dispatched:1,approval:approved().approval}):request());});const view=panel();await view.prepare();
 assert.deepEqual(calls,[{url:'/api/sessions/session/native-requests',body:{expectedSessionVersion:1,prompt:'Analyze the whole PDF',sources:[{kind:'document',id:'pdf'}],search:false,maxOutputTokens:1024}}]);assert.doesNotMatch(JSON.stringify(calls[0].body),/base64|artifactId|digest|path|apiKey/);assert.equal(view.activeRequest().state,'pending');
 const review=JSON.stringify(view.render());assert.match(review,/整文件全部字节/);assert.match(review,/https:\/\/api.example.com\/v1/);assert.match(review,/仅 1 次供应商 HTTP 请求/);assert.match(review,/a{64}/);assert.match(review,/可能产生模型与联网费用/);
 await view.act('request','approve');assert.equal(calls.length,2);assert.deepEqual(calls[1],{url:'/api/native-requests/request/decide',body:{expectedVersion:1,expectedApprovalVersion:1,approved:true}});assert.equal(view.activeRequest().state,'approved');assert.equal(calls.filter(call=>call.url.endsWith('/execute')).length,0);
 await view.act('request','execute');await view.act('request','execute');assert.equal(calls.filter(call=>call.url.endsWith('/execute')).length,1);assert.equal(view.activeRequest().dispatched,1);
});

test('availability explains unsupported native features and prevents preparing them without fake enabled controls',async t=>{
 let posts=0;mock(t,async()=>{posts++;return response(request());});const view=panel();view.setState({sources:[source,video],availability:{...availability,video:{declared:true,state:'unsupported',reason:'OpenAI profile has no video adapter'},nativeWebSearch:{declared:false,state:'disabled',reason:'Search is not enabled'}}});
 const tree=view.render();assert.equal(find(tree,n=>n.props['aria-label']==='整文件 Experiment.mp4').props.disabled,true);assert.equal(find(tree,n=>n.props['aria-label']==='启用原生联网搜索').props.disabled,true);assert.match(JSON.stringify(tree),/OpenAI profile has no video adapter/);view.edit({selected:[key(video)],search:true});await view.prepare();assert.equal(posts,0);assert.match(view.state.error,/不支持/);
});

test('prepare CAS failure retains prompt and sources and identical manual retries reuse a stable key',async t=>{
 const calls=[];mock(t,async(_url,init)=>{calls.push({body:JSON.parse(init.body),key:init.headers['Idempotency-Key']});return failed(409,'session version conflict');});const view=panel();await view.prepare();await view.prepare();assert.equal(view.state.prompt,'Analyze the whole PDF');assert.deepEqual(view.state.selected,[key(source)]);assert.equal(view.state.pending,false);assert.match(view.state.error,/version conflict/);assert.equal(calls[0].key,calls[1].key);view.edit({prompt:'A new request'});await view.prepare();assert.notEqual(calls[1].key,calls[2].key);
});

test('a rendered approval callback cannot silently accept a newer unseen request or approval version',async t=>{
 let posts=0;mock(t,async()=>{posts++;return response(approved());});const view=panel();view.setState({requests:[request()],active:'request'});const approve=find(view.render(),n=>n.type==='button'&&n.props.children==='批准此固定请求');view.mergeRequest(request({version:2,approval:{id:'approval',version:2,status:'pending',reason:''}}));approve.props.onClick();await new Promise(resolve=>setImmediate(resolve));assert.equal(posts,0);assert.match(view.state.error,/重新核对/);
});

test('late prepare completion stores the fixed old request without overwriting new typing or selection',async t=>{
 let resolve;mock(t,async()=>new Promise(done=>{resolve=done;}));const view=panel(),pending=view.prepare();view.edit({prompt:'New draft',selected:[],search:true,maxOutputTokens:'512'});resolve(response(request()));await pending;assert.equal(view.state.prompt,'New draft');assert.deepEqual(view.state.selected,[]);assert.equal(view.state.maxOutputTokens,'512');assert.equal(view.activeRequest().prompt,'Analyze the whole PDF');assert.deepEqual(view.activeRequest().sources,[source]);assert.match(view.state.message,/当前新编辑保留/);
});

test('foreign-session and unmounted late responses cannot publish old requests or overwrite the new draft',async t=>{
 let resolve;mock(t,async()=>new Promise(done=>{resolve=done;}));const view=panel(),pending=view.prepare(),previous=view.props;view.setState({open:false});view.props={...view.props,session:{...session,id:'other'}};view.componentDidUpdate(previous);view.edit({prompt:'Other session draft'});resolve(response(request()));await pending;assert.equal(view.state.requests.length,0);assert.equal(view.state.prompt,'Other session draft');assert.equal(view.state.pending,false);
 const closed=panel(),late=closed.prepare();closed.componentWillUnmount();resolve(response(request()));await late;assert.equal(closed.state.requests.length,0);
});

test('execute uses the shared long timeout and a lost response only reads status, never re-executes an uncertain request',async t=>{
 const calls=[],timeouts=[],previousTimeout=AbortSignal.timeout;AbortSignal.timeout=ms=>{timeouts.push(ms);return new AbortController().signal;};t.after(()=>AbortSignal.timeout=previousTimeout);mock(t,async(url,init)=>{calls.push({url,method:init.method});if(init.body)throw Error('transport timeout');return response(approved());});const view=panel();view.setState({requests:[approved()],active:'request'});await view.act('request','execute');
 assert.deepEqual(calls,[{url:'/api/native-requests/request/execute',method:'POST'},{url:'/api/native-requests/request',method:'GET'}]);assert.deepEqual(timeouts,[125000,22000]);assert.match(view.state.error,/不会自动重发/);assert.equal(find(view.render(),n=>n.type==='button'&&n.props.children==='执行一次，外发所列原件与请求'),undefined);await view.act('request','execute');assert.equal(calls.length,2);
});

test('unknown, failed, expired, and already dispatched requests never expose or run another execution',async t=>{
 let posts=0;mock(t,async()=>{posts++;return response(request());});for(const row of [request({state:'unknown',dispatched:1}),request({state:'failed',dispatched:1}),approved(),request({state:'approved',approval:approved().approval,dispatched:1}),request({state:'approved',approval:approved().approval,expiresAt:'2000-01-01T00:00:00Z'})]){const view=panel();view.setState({requests:[row],active:row.id});if(row.state==='approved'&&row.dispatched===0&&row.expiresAt.startsWith('2099'))continue;await view.act(row.id,'execute');assert.equal(posts,0);}
});

test('explicit cancellation remains available while a long execute is pending and newer cancellation wins a late old response',async t=>{
 let resolveExecute;const calls=[],running=request({state:'running',version:3,dispatched:1,approval:approved().approval}),cancelled=request({state:'cancelled',version:4,dispatched:1,approval:approved().approval});mock(t,async(url,init)=>{calls.push({url,body:init.body?JSON.parse(init.body):undefined});if(url.endsWith('/execute'))return new Promise(done=>{resolveExecute=done;});return response(url.endsWith('/cancel')?cancelled:running);});const view=panel();view.setState({requests:[approved()],active:'request'});const executing=view.act('request','execute');await view.read('request');const cancel=find(view.render(),n=>n.type==='button'&&n.props.children==='取消此请求');assert.equal(cancel.props.disabled,false);await view.act('request','cancel');assert.equal(view.activeRequest().state,'cancelled');assert.deepEqual(calls.find(call=>call.url.endsWith('/cancel')).body,{expectedVersion:3});resolveExecute(response(request({state:'completed',version:3,dispatched:1,approval:approved().approval})));await executing;assert.equal(view.activeRequest().state,'cancelled');assert.equal(view.activeRequest().version,4);
});

test('one cancel click first reads the running version and then actually cancels, rather than posting its obsolete approved version',async t=>{
 let resolveExecute;const calls=[],running=request({state:'running',version:3,dispatched:1,approval:approved().approval}),cancelled=request({state:'cancelled',version:4,dispatched:1,approval:approved().approval});mock(t,async(url,init)=>{const body=init.body?JSON.parse(init.body):undefined;calls.push({url,body});if(url.endsWith('/execute'))return new Promise(done=>{resolveExecute=done;});if(url.endsWith('/cancel'))return body.expectedVersion===3?response(cancelled):failed(409,'cancel version conflict');return response(running);});const view=panel();view.setState({requests:[approved()],active:'request'});const executing=view.act('request','execute');assert.equal(view.activeRequest().version,2);await view.act('request','cancel',2);assert.equal(view.activeRequest().state,'cancelled');assert.deepEqual(calls.filter(call=>call.url.endsWith('/cancel')),[{url:'/api/native-requests/request/cancel',body:{expectedVersion:3}}]);assert.equal(calls[1].url,'/api/native-requests/request');resolveExecute(response(cancelled));await executing;
});

test('execution-time cancellation only observes a terminal request and rejects a changed fixed scope before cancelling',async t=>{
 for(const latest of [request({state:'completed',version:3,dispatched:1,approval:approved().approval}),request({state:'running',version:3,dispatched:1,prompt:'Changed fixed scope',approval:approved().approval})]){
  let resolveExecute;const calls=[];mock(t,async(url,init)=>{calls.push(url);return url.endsWith('/execute')?new Promise(done=>{resolveExecute=done;}):response(latest);});const view=panel();view.setState({requests:[approved()],active:'request'});const executing=view.act('request','execute');await view.act('request','cancel',2);assert.equal(calls.some(url=>url.endsWith('/cancel')),false);if(latest.state==='completed')assert.match(view.state.message,/没有发送取消/);else assert.match(view.state.error,/固定范围已变化/);resolveExecute(response(latest));await executing;
 }
});

test('readOnly backend denial is shown with a status read and never bypassed by approval or an automatic retry',async t=>{
 const calls=[];mock(t,async(url,init)=>{calls.push({url,method:init.method});return init.body?failed(403,'readOnly forbids external dispatch'):response(approved());});const view=panel();view.setState({requests:[approved()],active:'request'});await view.act('request','execute');assert.match(view.state.error,/readOnly forbids/);assert.equal(calls.filter(call=>call.method==='POST').length,1);assert.equal(calls.filter(call=>call.method==='GET').length,1);assert.equal(view.activeRequest().dispatched,0);
});

test('PDF and MP4 imports preserve successful files and draft if a later file fails',async t=>{
 const calls=[];mock(t,async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return url==='/api/operations/document_import'?response({id:'imported',title:'Imported.pdf',original:{artifactId:'imported-artifact',digest:'c'.repeat(64),size:5,mediaType:'application/pdf'}}):failed(400,'invalid MP4 header');});const view=panel();view.edit({selected:[]});const file=(name,type)=>({name,type,size:5,arrayBuffer:async()=>new TextEncoder().encode('bytes').buffer});await view.importFiles([file('Imported.pdf','application/pdf'),file('Broken.mp4','video/mp4')]);
 assert.deepEqual(calls.map(call=>call.url),['/api/operations/document_import','/api/sessions/session/native-media']);assert.equal(calls[0].body.projectId,'project');assert.equal(calls[1].body.mediaType,'video/mp4');assert.equal(view.state.prompt,'Analyze the whole PDF');assert.deepEqual(view.state.selected,[JSON.stringify(['document','imported'])]);assert.match(view.state.error,/invalid MP4 header/);assert.equal(view.state.pending,false);
});

test('20 MiB whole-file limits reject oversize import and selection before any prepare or upload',async t=>{
 let calls=0;mock(t,async()=>{calls++;return response(request());});const view=panel();await view.importFiles([{name:'Huge.pdf',type:'application/pdf',size:21*1024*1024}]);assert.equal(calls,0);assert.match(view.state.error,/20 MiB/);const huge={...video,size:20*1024*1024};view.setState({sources:[source,huge]});view.chooseSource(huge,true);assert.deepEqual(view.state.selected,[key(source)]);assert.equal(calls,0);view.edit({maxOutputTokens:'8193'});await view.prepare();assert.equal(calls,0);
});

test('reopening and cursor history only GET existing receipts and keep newer row versions',async t=>{
 const calls=[],completed=request({state:'completed',version:4,dispatched:1,approval:approved().approval,receipt:{artifactId:'receipt',digest:'d'.repeat(64)}});mock(t,async url=>{calls.push(url);return response({requests:url.includes('cursor=20')?[request({id:'older',createdAt:'2026-10-07T00:00:00Z'})]:[approved()],sources:[source],availability,nextCursor:url.includes('cursor=20')?null:20});});const view=panel();view.setState({open:false,availability:null,requests:[completed],active:'request'});view.toggle();await new Promise(resolve=>setImmediate(resolve));assert.equal(view.activeRequest().version,4);assert.equal(view.activeRequest().receipt.artifactId,'receipt');await view.load(true);assert.match(calls[1],/cursor=20/);assert.equal(view.state.requests.length,2);assert.equal(view.state.nextCursor,null);assert.match(JSON.stringify(view.render()),/receipt/);assert.equal(calls.some(url=>url.includes('/execute')),false);
});

test('safe citations remain owner-readable links while private continuation is excluded from stored public response',()=>{
 const view=panel(),row=request({state:'incomplete',dispatched:1,continuationAvailable:true,response:{text:'Provider answer',citations:[{url:'https://example.com/paper',title:'Paper'},{url:'javascript:alert(1)',title:'Unsafe'}],searchCalls:[{status:'completed',sources:[{url:'https://u:p@example.com/',title:'Credentials'}]}],usage:{input_tokens:10},stopReason:'pause_turn',status:'incomplete',continuation:[{private:'must-not-display'}]}});view.mergeRequest(row);view.setState({active:row.id});assert.equal(Object.hasOwn(view.activeRequest().response,'continuation'),false);const tree=view.render(),anchors=elements(tree).filter(n=>n.type==='a');assert.deepEqual(anchors.map(n=>n.props.href),['https://example.com/paper']);assert.equal(anchors[0].props.rel,'noreferrer noopener');assert.match(JSON.stringify(tree),/不自动成为已核验/);assert.doesNotMatch(JSON.stringify(tree),/must-not-display/);
});

test('Anthropic incomplete continuation prepares a new fixed request using the original source and search scope only',async t=>{
 const calls=[],paused=request({id:'paused',state:'incomplete',version:3,dispatched:1,search:true,continuationAvailable:true,destination:{baseUrl:'https://anthropic.example.com',api:'anthropic-messages',profile:'anthropic'},response:{text:'Partial answer',citations:[],searchCalls:[],usage:{},stopReason:'pause_turn',status:'incomplete'}});mock(t,async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return response(request({id:'continuation',previousRequestId:'paused',search:true}));});const view=panel();view.edit({prompt:'Changed draft',selected:[],search:false,maxOutputTokens:'512'});view.mergeRequest(paused);await view.prepare(paused);assert.deepEqual(calls,[{url:'/api/sessions/session/native-requests',body:{expectedSessionVersion:1,prompt:'Analyze the whole PDF',sources:[{kind:'document',id:'pdf'}],search:true,maxOutputTokens:1024,previousRequestId:'paused'}}]);assert.equal(view.activeRequest().state,'pending');assert.equal(view.activeRequest().previousRequestId,'paused');assert.equal(view.state.prompt,'Changed draft');assert.equal(calls.some(call=>call.url.endsWith('/execute')),false);
});

test('native dialog uses native modal focus boundaries and closing by Escape retains the draft and never cancels execution',async t=>{
 const calls=[];mock(t,async url=>{calls.push(url);return response({requests:[],sources:[source],availability,nextCursor:null});});const view=panel();view.setState({open:false});let shown=0,closed=0,focused=0;view.dialog.current={open:false,showModal(){this.open=true;shown++;},close(){this.open=false;closed++;}};view.trigger.current={focus(){focused++;}};view.toggle();assert.equal(shown,1);const dialog=find(view.render(),n=>n.type==='dialog');assert.ok(dialog);assert.equal(dialog.props['aria-modal'],'true');dialog.props.onCancel({preventDefault(){}});assert.equal(view.state.open,false);assert.equal(closed,1);assert.equal(focused,1);assert.equal(view.state.prompt,'Analyze the whole PDF');await new Promise(resolve=>setImmediate(resolve));assert.equal(calls.some(url=>url.endsWith('/cancel')||url.endsWith('/execute')),false);
});

test('small model output limits set an untouched default and validate without overwriting a dirty token input',async t=>{
 let limit=16;const posts=[];mock(t,async(_url,init)=>{if(init.body){posts.push(JSON.parse(init.body));return response(request({maxOutputTokens:limit}));}return response({requests:[],sources:[source],availability:{...availability,maxOutputTokens:limit},nextCursor:null});});const view=panel();await view.load();assert.equal(view.state.maxOutputTokens,'16');assert.equal(find(view.render(),n=>n.props['aria-label']==='原生输出 token 上限').props.max,16);await view.prepare();assert.equal(posts[0].maxOutputTokens,16);view.edit({maxOutputTokens:'64'});limit=8;await view.load();assert.equal(view.state.maxOutputTokens,'64');assert.match(JSON.stringify(view.render()),/当前模型输出上限为/);await view.prepare();assert.equal(posts.length,1);assert.match(view.state.error,/1–8/);view.edit({maxOutputTokens:'8'});await view.prepare();assert.equal(posts[1].maxOutputTokens,8);
});

test('Chat mounts the entry in heading outside the composer form, keeps archived history readable and excludes team/task sessions',()=>{
 const props={data:{project:{id:'project',archived:false,settings:{enabled:false}},teams:[],wakeups:[]},boot:{model,models:[model],runtime:{ready:true,hostAccess:{available:false}}},session,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,onHistory(){},stream:'',busy:false,perform:async fn=>fn(),onToggle(){},onNew(){},onExperiments(){},onWorkspace(){},onSession(){},onExperiment(){},onRun(){}};
 const chat=synchronousState(new Chat(props)),tree=chat.render(),heading=find(tree,n=>n.props.className==='chat-heading'),composer=find(tree,n=>n.props.className==='composer'),entry=find(heading,n=>n.type===NativeModelRequests);assert.ok(entry);assert.equal(find(composer,n=>n.type===NativeModelRequests),undefined);assert.equal(entry.props.projectId,'project');assert.deepEqual(entry.props.attachments,[]);
 for(const override of [{role:'reviewer'},{taskId:'task'},{teamId:'team'}]){chat.props={...props,session:{...session,...override}};assert.equal(find(chat.render(),n=>n.type===NativeModelRequests),undefined);}
 const archived=panel({session:{...session,state:'archived'},archived:true});assert.equal(find(archived.render(),n=>n.props.className?.includes('native-panel-trigger')).props.disabled,undefined);assert.equal(archived.blocked(),true);chat.props={...props,session:{...session,state:'archived'},data:{...props.data,project:{...props.data.project,archived:true}}};assert.equal(find(chat.render(),n=>n.type===NativeModelRequests).props.archived,true);
});

test('completed native assistant output has explicit native provenance without raw Agent tool blocks',()=>{
 const history=synchronousState(new SessionHistory({projectId:'project',sessionId:'session',messages:[{id:'message',version:1,role:'assistant',status:'completed',phase:'final_answer',createdAt:'2026-10-08T00:00:00Z',content:'Provider answer',nativeRequestId:'native-request-123'}],history:null,historyAnchor:null,onNavigate(){},perform:async fn=>fn()}));const tree=JSON.stringify(history.render());assert.match(tree,/原生请求/);assert.match(tree,/native-r/);assert.doesNotMatch(tree,/server_tool_use|rawblocks/);
});

test('clearing the global default keeps a valid current session usable, while removed models or aliases cannot send',()=>{
 const props={data:{project:{id:'project',archived:false,settings:{enabled:false}},teams:[],wakeups:[]},boot:{model:{provider:'',model:'',thinking:'off'},models:[model],runtime:{ready:false,code:'MODEL_NOT_CONFIGURED',hostAccess:{available:false}}},session,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,onHistory(){},stream:'',busy:false,perform:async fn=>fn(),onToggle(){},onNew(){},onExperiments(){},onWorkspace(){},onSession(){},onExperiment(){},onRun(){}};
 const chat=synchronousState(new Chat(props)),controls=tree=>find(tree,n=>n.props.canSend!==undefined&&n.props.onSendModel);
 assert.equal(controls(chat.render()).props.canSend,true);
 chat.props={...props,boot:{...props.boot,models:[]}};assert.equal(controls(chat.render()).props.canSend,false);
 chat.props={...props,boot:{...props.boot,models:[{...model,thinking:'off'}]}};assert.equal(controls(chat.render()).props.canSend,false);
 chat.props={...props,boot:{...props.boot,runtime:{...props.boot.runtime,code:'PI_NOT_INSTALLED'}}};assert.equal(controls(chat.render()).props.canSend,false);
});
