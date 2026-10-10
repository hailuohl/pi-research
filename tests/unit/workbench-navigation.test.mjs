import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const response=data=>({ok:true,json:async()=>data});
const projectResponse=url=>url.startsWith('/api/projects/')?response({id:url.split('/')[3],archived:false}):null;
const idleSession=(id,extra={})=>({id,version:1,projectId:'project',title:'研究主会话',role:'coordinator',state:'idle',piSessionPath:null,generation:0,leaseUntil:0,model:{provider:'test',model:'chosen',thinking:'high'},...extra});
const catalog=items=>({items,nextCursor:null});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function sessionApp(){const app=synchronousState(new App({}));app.refresh=async()=>true;Object.assign(app.state,{projectId:'project',sessionId:'current'});return app;}

test('repeated new-session clicks reuse the current empty root and keep the mounted Chat contract',async t=>{
  const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;t.after(()=>{globalThis.fetch=oldFetch;globalThis.localStorage=oldStorage;});
  globalThis.localStorage={getItem:()=>JSON.stringify({projectId:'project',sessionId:'current'}),setItem(){}};
  const app=sessionApp(),session=idleSession('current',{title:'已改名的会话',skillIds:['chosen-skill'],workingGrantId:'grant'});
  Object.assign(app.state,{boot:{projects:[{id:'project',name:'Project'}],runtime:{ready:true}},navigationOpen:true,data:{project:{id:'project',name:'Project',settings:{enabled:false}},sessions:[session],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],wakeups:[],intents:[]}});
  const chatElement=()=>elements(app.render()).find(node=>node.type?.name==='Chat'),before=chatElement(),chat=synchronousState(new before.type(before.props));
  chat.state.draft='unsent draft';chat.state.attachments=[{artifactId:'attached'}];
  const requests=[];globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);requests.push({url,method:options.method,...(options.body?{body:JSON.parse(options.body)}:{})});if(url==='/api/sessions/current')return response(session);if(url==='/api/sessions/current/messages')return response([]);if(url==='/api/sessions'){assert.deepEqual(JSON.parse(options.body),{projectId:'project',reuseSessionId:'current',expectedVersion:1});return response(session);}throw Error('Unexpected create or catalog request');};
  await app.newSession();await app.newSession();
  assert.equal(app.state.sessionId,'current');assert.equal(app.state.navigationOpen,false);assert.equal(app.state.sessionCreationSignal,2);
  assert.equal(chatElement().key,before.key);assert.equal(chatElement().props.data,before.props.data);assert.equal(chatElement().props.session.model,session.model);assert.equal(chatElement().props.session.workingGrantId,'grant');
  chat.props=chatElement().props;assert.equal(chat.state.draft,'unsent draft');assert.deepEqual(chat.state.attachments,[{artifactId:'attached'}]);
  assert.deepEqual(requests.map(r=>r.url),['/api/sessions/current','/api/sessions/current/messages','/api/sessions','/api/sessions/current','/api/sessions/current/messages','/api/sessions']);assert.deepEqual(requests.map(r=>r.method),['GET','GET','POST','GET','GET','POST']);
  app.componentWillUnmount();
});

test('a corrected blank receipt updates its model even when the following refresh fails',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});const app=sessionApp(),old=idleSession('current',{model:{provider:'zai-coding-cn',model:'glm-5.3',thinking:'off'}}),confirmed={...old,version:2,model:{...old.model,thinking:'low'}},history=idleSession('history',{generation:1}),posts=[];
  app.state.data={project:{id:'project'},sessions:[old,history]};app.refresh=async()=>{throw Error('Refresh unavailable');};
  globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);if(url==='/api/sessions/current')return response(old);if(url.endsWith('/messages'))return response([]);posts.push(JSON.parse(options.body));return response(confirmed);};
  await app.newSession();assert.deepEqual(posts,[{projectId:'project',reuseSessionId:'current',expectedVersion:1}]);assert.equal(app.state.sessionId,'current');assert.deepEqual(app.state.data.sessions,[confirmed,history]);assert.equal(app.state.sessionCreationSignal,1);assert.match(app.state.error,/Refresh unavailable/);app.componentWillUnmount();
});

test('confirmed new roots enter the current project while foreign and older receipts cannot replace known rows',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  for(const kind of ['created','foreign','older']){
    const app=sessionApp(),existing=idleSession('current',{version:kind==='older'?3:1,generation:kind==='created'?1:0}),history=idleSession('history',{generation:1}),receipt=idleSession(kind==='created'?'new-root':'current',{version:2,projectId:kind==='foreign'?'foreign':'project',model:{provider:'test',model:'chosen',thinking:'low'}});
    app.state.data={project:{id:'project'},sessions:[existing,history]};app.refresh=async()=>false;
    globalThis.fetch=async(url)=>projectResponse(url)??(url==='/api/sessions/current'?response(existing):url.endsWith('/messages')?response([]):url.endsWith('/session_list')?response(catalog([])):response(receipt));
    await app.newSession();assert.deepEqual(app.state.data.sessions,kind==='created'?[existing,history,receipt]:[existing,history]);app.componentWillUnmount();
  }
});

test('a new-session receipt cannot overwrite a different session selected while its request was pending',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});const app=sessionApp(),existing=idleSession('current'),other=idleSession('other');app.state.data={project:{id:'project'},sessions:[existing,other]};let finish;
  globalThis.fetch=async url=>projectResponse(url)??(url==='/api/sessions/current'?response(existing):url.endsWith('/messages')?response([]):new Promise(resolve=>{finish=resolve;}));
  const creating=app.newSession();await flush();app.selectSession('other');finish(response({...existing,version:2,model:{...existing.model,thinking:'low'}}));await creating;
  assert.equal(app.state.sessionId,'other');assert.deepEqual(app.state.data.sessions,[existing,other]);assert.equal(app.state.sessionCreationSignal,0);app.componentWillUnmount();
});

test('an empty root outside recent state is found through all catalog pages, with fresh metadata',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=sessionApp(),pages=[],messageReads=[],metadataReads=[];
  const firstPage=Array.from({length:50},(_,n)=>idleSession('used-'+n,{generation:1}));
  globalThis.fetch=async(url,options)=>{
    if(projectResponse(url))return projectResponse(url);
    if(url.endsWith('/session_list')){const body=JSON.parse(options.body);pages.push(body);return response(body.input.beforeSessionId?catalog([idleSession('older-empty')]):{items:firstPage,nextCursor:'used-49'});}
    if(url.endsWith('/messages')){messageReads.push(url);return response([]);}
    if(url==='/api/sessions'){assert.deepEqual(JSON.parse(options.body),{projectId:'project',reuseSessionId:'older-empty',expectedVersion:1});return response(idleSession('older-empty'));}
    const id=url.split('/').at(-1);metadataReads.push(id);return response(idleSession(id,{generation:id==='older-empty'?0:1}));
  };
  await app.newSession();
  assert.equal(app.state.sessionId,'older-empty');assert.equal(app.state.error,'');assert.equal(pages.length,2);
  assert.deepEqual(pages[0],{projectId:'project',input:{role:'coordinator',stateFilter:'active',limit:50}});assert.equal(pages[1].input.beforeSessionId,'used-49');
  assert.deepEqual(messageReads,['/api/sessions/older-empty/messages']);assert.equal(metadataReads.length,52);assert.equal(app.state.sessionCreationSignal,1);
  app.componentWillUnmount();
});

test('any saved message excludes an otherwise new root, including removed queue and host messages',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  for(const message of [...['queued','running','completed','failed','cancelled'].map(status=>({id:'m',role:'user',status,...(status==='cancelled'?{queueRemoved:true}:{})})),{id:'m',role:'system',status:'completed'},{id:'m',role:'user',status:'queued',origin:'automation'}]){
    const app=sessionApp(),creates=[],reads=[];
    globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);reads.push(url);if(url==='/api/sessions/current')return response(idleSession('current'));if(url.endsWith('/messages'))return response([message]);if(url.endsWith('/session_list'))return response(catalog([idleSession('current')]));creates.push(JSON.parse(options.body));return response({id:'created'});};
    await app.newSession();assert.equal(app.state.sessionId,'created',JSON.stringify(message));assert.deepEqual(creates,[{projectId:'project',title:'新的研究会话'}]);assert.equal(reads.filter(url=>url==='/api/sessions/current').length,1);assert.equal(reads.filter(url=>url.endsWith('/messages')).length,1);app.componentWillUnmount();
  }
});

test('foreign, archived, task, team, branch, running and previously started roots are never reused',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const blocked=[{projectId:'other'},{state:'archived'},{taskId:'task'},{teamId:'team'},{parentSessionId:'parent'},{state:'running'},{state:'queued'},{role:'analyst'},{piSessionPath:'native.jsonl'},{generation:1},{leaseUntil:1}];
  for(const extra of blocked){
    const app=sessionApp(),reads=[],candidate=idleSession('current',extra);
    globalThis.fetch=async(url)=>{if(projectResponse(url))return projectResponse(url);reads.push(url);if(url==='/api/sessions/current')return response(candidate);if(url.endsWith('/session_list'))return response(catalog([candidate]));if(url.endsWith('/messages'))throw Error('Blocked metadata must not read history');return response({id:'created'});};
    await app.newSession();assert.equal(app.state.sessionId,'created',JSON.stringify(extra));assert.equal(app.state.error,'');assert.ok(!reads.some(url=>url.endsWith('/messages')));assert.equal(reads.filter(url=>url==='/api/sessions/current').length,1);app.componentWillUnmount();
  }
  const app=sessionApp();globalThis.fetch=async url=>projectResponse(url)??(url==='/api/sessions/current'?response(idleSession('current',{generation:1})):url.endsWith('/session_list')?response(catalog([idleSession('changed-branch')])):url==='/api/sessions/changed-branch'?response(idleSession('changed-branch',{parentSessionId:'parent'})):url==='/api/sessions'?response({id:'created'}):Promise.reject(Error('Must reject fresh branch metadata')));
  await app.newSession();assert.equal(app.state.sessionId,'created');assert.equal(app.state.error,'');app.componentWillUnmount();
});

test('lookup failures preserve the view and release the lock for retry without an accidental create',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  for(const stage of ['metadata','messages','malformed-messages','catalog','candidate']){
    const app=sessionApp();Object.assign(app.state,{tab:'reports',navigationOpen:true,messages:[{id:'kept'}],pendingMessages:[{id:'queued'}],historyAnchor:{direction:'before',id:'cursor'}});
    let creates=0;
    globalThis.fetch=async url=>{
      if(projectResponse(url))return projectResponse(url);
      if(url==='/api/sessions'){creates++;return response({id:'created'});}
      if(url==='/api/sessions/current'){if(stage==='metadata')throw Error('lookup failed');return response(idleSession('current',{generation:['catalog','candidate'].includes(stage)?1:0}));}
      if(url.endsWith('/messages')){if(stage==='messages')throw Error('lookup failed');return response({items:[]});}
      if(url.endsWith('/session_list')){if(stage==='catalog')throw Error('lookup failed');return response(catalog([idleSession('candidate')]));}
      throw Error('lookup failed');
    };
    await app.newSession();assert.equal(creates,0,stage);assert.equal(app.state.sessionId,'current');assert.equal(app.state.tab,'reports');assert.equal(app.state.navigationOpen,true);assert.deepEqual(app.state.messages,[{id:'kept'}]);assert.deepEqual(app.state.pendingMessages,[{id:'queued'}]);assert.equal(app.state.historyAnchor.id,'cursor');assert.ok(app.state.error);assert.equal(app.state.busy,false);
    globalThis.fetch=async url=>projectResponse(url)??(url==='/api/sessions/current'||url==='/api/sessions'?response(idleSession('current')):url.endsWith('/messages')?response([]):Promise.reject(Error('Retry should reuse current')));
    await app.newSession();assert.equal(app.state.error,'');assert.equal(app.state.sessionId,'current');assert.equal(app.state.sessionCreationSignal,1);app.componentWillUnmount();
  }
});

test('new-session refuses a freshly archived project and preserves the view on project-read failure',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  for(const archived of [true,false]){
    const app=sessionApp();Object.assign(app.state,{data:{project:{id:'project',archived:false}},tab:'reports',navigationOpen:true,messages:[{id:'kept'}]});
    const requests=[];globalThis.fetch=async url=>{requests.push(url);if(archived)return response({id:'project',archived:true});throw Error('project read failed');};
    await app.newSession();assert.deepEqual(requests,['/api/projects/project']);assert.equal(app.state.sessionId,'current');assert.equal(app.state.tab,'reports');assert.equal(app.state.navigationOpen,true);assert.deepEqual(app.state.messages,[{id:'kept'}]);assert.ok(app.state.error);assert.equal(app.state.sessionCreationSignal,0);app.componentWillUnmount();
  }
});

test('same-tick clicks start one creation flow before React applies busy state',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=sessionApp(),setState=app.setState;app.setState=(update,callback)=>{if(typeof update==='object'&&'busy' in update)queueMicrotask(()=>setState(update,callback));else setState(update,callback);};
  let finish,creates=0;globalThis.fetch=async url=>projectResponse(url)??(url==='/api/sessions/current'?response(idleSession('current',{generation:1})):url.endsWith('/session_list')?response(catalog([])):new Promise(resolve=>{creates++;finish=resolve;}));
  const first=app.newSession(),second=app.newSession();await flush();assert.equal(creates,1);finish(response({id:'created'}));await Promise.all([first,second]);assert.equal(app.state.sessionId,'created');assert.equal(app.state.sessionCreationSignal,1);app.componentWillUnmount();
});

test('a lost new-session response retries the same request and idempotency key',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});const app=sessionApp(),posts=[];let fail=true;
  globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);if(url==='/api/sessions/current')return response(idleSession('current',{generation:1}));if(url.endsWith('/session_list'))return response(catalog([]));posts.push({body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});if(fail)throw Error('Response lost');return response({id:'created-once'});};
  await app.newSession();assert.equal(app.state.sessionId,'current');assert.match(app.state.error,/Response lost/);fail=false;await app.newSession();assert.equal(app.state.sessionId,'created-once');assert.deepEqual(posts[1],posts[0]);assert.equal(posts.length,2);assert.ok(posts[0].key);app.componentWillUnmount();
});

test('late lookup or create responses cannot take over after A to B to A or unmount',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  for(const stage of ['project','metadata','messages','catalog','create'])for(const unmount of [false,true]){
    const app=sessionApp(),requests=[];let finish;
    globalThis.fetch=async url=>{
      const held=stage==='project'?url==='/api/projects/project':stage==='metadata'?url==='/api/sessions/current':stage==='messages'?url.endsWith('/messages'):stage==='catalog'?url.endsWith('/session_list'):url==='/api/sessions';
      if(!held&&projectResponse(url))return projectResponse(url);
      requests.push(url);
      if(held)return new Promise(resolve=>{finish=resolve;});
      if(url==='/api/sessions/current')return response(idleSession('current',{generation:stage==='messages'?0:1}));
      if(url.endsWith('/session_list'))return response(catalog([]));throw Error('Unexpected request');
    };
    const creating=app.newSession();await flush();assert.ok(finish,stage);
    if(unmount)app.componentWillUnmount();else{app.switchProject('other');app.switchProject('project');Object.assign(app.state,{sessionId:'new-selection',error:'new-project-error'});}
    const selection=app.state.sessionId;
    finish(response(stage==='project'?{id:'project',archived:false}:stage==='metadata'?idleSession('current'):stage==='messages'?[]:stage==='catalog'?catalog([]):{id:'stale-created'}));await creating;
    assert.equal(app.state.sessionId,selection);assert.equal(app.state.sessionCreationSignal,0);assert.equal(requests.at(-1),stage==='project'?'/api/projects/project':stage==='metadata'?'/api/sessions/current':stage==='messages'?'/api/sessions/current/messages':stage==='catalog'?'/api/operations/session_list':'/api/sessions');if(!unmount)assert.equal(app.state.error,'new-project-error');app.componentWillUnmount();
  }
});

test('late lookup errors do not appear in the newly selected project',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=sessionApp();let fail;globalThis.fetch=url=>projectResponse(url)??new Promise((_resolve,reject)=>{fail=reject;});
  const creating=app.newSession();await flush();app.switchProject('other');app.switchProject('project');app.state.error='current view';fail(Error('stale failure'));await creating;assert.equal(app.state.error,'current view');assert.equal(app.state.sessionCreationSignal,0);app.componentWillUnmount();
});

test('other workflow buttons preserve project and session while closing mobile navigation',()=>{
  const app=synchronousState(new App({}));
  Object.assign(app.state,{boot:{projects:[]},projectId:'project',sessionId:'session',navigationOpen:true});
  const buttons=elements(app.render()).filter(node=>node.type==='button'&&node.props.onClick&&node.props.children?.[1]?.type==='span');
  const workflowButtons=buttons.filter(node=>text(node.props.children[1])!=='新建会话');
  assert.deepEqual(workflowButtons.map(node=>text(node.props.children[1])).sort(),['项目工作区','技能与连接器','环境','模型与模板'].sort());
  for(const button of workflowButtons){
    app.state.navigationOpen=true;button.props.onClick({currentTarget:{closest:()=>null}});
    assert.equal(app.state.navigationOpen,false);
    assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'session');
    const current=elements(app.render()).filter(node=>node.props?.['aria-current']==='page');
    assert.equal(current.length,1);assert.equal(text(current[0]),text(button));
  }
  app.componentWillUnmount();
});

test('new-session navigation button creates within the current project and preserves the view on failure',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'project',sessionId:'old-session',tab:'reports',navigationOpen:true,messages:[{id:'old-message'}],pendingMessages:[{id:'old-pending'}],pendingTotal:1,pendingNextCursor:'q',canSteer:true,history:{atLatest:false},historyAnchor:{direction:'before',id:'old-cursor'},stream:'old stream'});
  const getCreateButton=()=>elements(app.render()).find(node=>node.type==='button'&&text(node.props.children?.[1])==='新建会话');
  assert.equal(getCreateButton().props.disabled,false);
  app.state.busy=true;assert.equal(getCreateButton().props.disabled,true);
  app.state.busy=false;app.state.projectId='';assert.equal(getCreateButton().props.disabled,true);
  app.state.projectId='project';
  const requests=[];globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);if(url==='/api/sessions/old-session')return response(idleSession('old-session',{generation:1}));if(url.endsWith('/session_list'))return response(catalog([]));requests.push({url,body:JSON.parse(options.body)});return response({id:'new-session'});};
  await getCreateButton().props.onClick();
  assert.deepEqual(requests,[{url:'/api/sessions',body:{projectId:'project',title:'新的研究会话'}}]);
  assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'new-session');assert.equal(app.state.tab,'chat');assert.equal(app.state.navigationOpen,false);
  assert.deepEqual(app.state.messages,[]);assert.deepEqual(app.state.pendingMessages,[]);assert.equal(app.state.historyAnchor,null);assert.equal(app.state.sessionCreationSignal,1);

  Object.assign(app.state,{boot:{runtime:{ready:true},projects:[{id:'project',name:'Project'}]},data:{project:{id:'project',name:'Project',settings:{enabled:false},version:1},sessions:[{id:'new-session',title:'New',state:'open'}],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],tasks:[],wakeups:[]},sessionId:'new-session',tab:'chat',navigationOpen:true,messages:[{id:'keep-message'}],pendingMessages:[{id:'keep-pending'}],pendingTotal:1,pendingNextCursor:'keep-q',canSteer:true,history:{atLatest:false},historyAnchor:{direction:'before',id:'keep-cursor'},stream:'keep stream'});
  const chatKey=()=>elements(app.render()).find(node=>node.type?.name==='Chat')?.key,previousChatKey=chatKey();
  globalThis.fetch=async url=>projectResponse(url)??(url==='/api/sessions/new-session'?response(idleSession('new-session',{generation:1})):url.endsWith('/session_list')?response(catalog([])):({ok:false,status:403,json:async()=>({error:{code:'SCOPE_DENIED',message:'会话不属于此项目'}})}));
  await getCreateButton().props.onClick();
  assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'new-session');assert.equal(app.state.tab,'chat');assert.equal(app.state.navigationOpen,true);
  assert.deepEqual(app.state.messages,[{id:'keep-message'}]);assert.deepEqual(app.state.pendingMessages,[{id:'keep-pending'}]);assert.equal(app.state.pendingTotal,1);assert.equal(app.state.pendingNextCursor,'keep-q');assert.equal(app.state.historyAnchor.id,'keep-cursor');assert.equal(app.state.stream,'keep stream');assert.equal(app.state.sessionCreationSignal,1);assert.equal(chatKey(),previousChatKey);assert.match(app.state.error,/不属于此项目/);
  app.componentWillUnmount();
});

test('a completed create for a previous project cannot replace the newly selected project session',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'old-project',sessionId:'old-session',navigationOpen:true});
  let resolvePost,request;
  globalThis.fetch=async(url,options)=>{if(projectResponse(url))return projectResponse(url);if(url==='/api/sessions/old-session')return response(idleSession('old-session',{projectId:'old-project',generation:1}));if(url.endsWith('/session_list'))return response(catalog([]));request=JSON.parse(options.body);return new Promise(resolve=>{resolvePost=resolve;});};
  const createButton=elements(app.render()).find(node=>node.type==='button'&&text(node.props.children?.[1])==='新建会话');
  const creating=createButton.props.onClick();
  await flush();
  app.switchProject('new-project');
  resolvePost(response({id:'created-in-old-project'}));
  await creating;
  assert.deepEqual(request,{projectId:'old-project',title:'新的研究会话'});
  assert.equal(app.state.projectId,'new-project');assert.equal(app.state.sessionId,'');assert.equal(app.state.sessionCreationSignal,0);
  app.componentWillUnmount();
});

test('legacy workflow tabs reopen in chat and retain their exact campaign selection',t=>{
  const previousStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=previousStorage;});
  for(const tab of ['campaigns','implementation','changes']){
    globalThis.localStorage={getItem:()=>JSON.stringify({projectId:'p',sessionId:'historical-root',tab,selectedCampaign:'historical-campaign',historyAnchor:{projectId:'p',sessionId:'historical-root',anchor:{direction:'before',id:'m10'}}}),setItem(){}};
    const app=synchronousState(new App({}));
    assert.equal(app.state.tab,'chat');assert.equal(app.state.sessionId,'historical-root');assert.equal(app.state.selectedCampaign,'historical-campaign');
    assert.deepEqual(app.state.messages,[]);assert.equal(app.state.history,null);assert.equal(app.state.stream,'');
    assert.deepEqual(app.state.historyAnchor,{direction:'before',id:'m10'});
    app.componentWillUnmount();
  }
});

test('report campaign links select the exact root session even when it is outside recent sessions',()=>{
  const previousStorage=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem(){}};
  try{
    const app=synchronousState(new App({}));app.refresh=async()=>true;
    Object.assign(app.state,{tab:'reports',boot:{projects:[{id:'p'}]},projectId:'p',sessionId:'recent',data:{project:{id:'p',name:'Project'},sessions:[{id:'recent'}],experiments:[],runs:[],teams:[],campaigns:[{id:'historic-campaign',rootSessionId:'historic-root'}]},messages:[{id:'old-body'}],history:{atLatest:false},historyAnchor:{direction:'before',id:'old-cursor'},stream:'old stream'});
    const resources=elements(app.render()).find(node=>node.type?.name==='Chat').props.resources;
    const reports=resources.props.views.reports;assert.ok(reports);
    reports.props.onCampaign('historic-campaign');
    assert.equal(app.state.projectId,'p');assert.equal(app.state.sessionId,'historic-root');assert.equal(app.state.selectedCampaign,'historic-campaign');assert.equal(app.state.tab,'chat');
    assert.deepEqual(app.state.messages,[]);assert.equal(app.state.history,null);assert.equal(app.state.historyAnchor,null);assert.equal(app.state.stream,'');
    app.componentWillUnmount();
  }finally{globalThis.localStorage=previousStorage;}
});

test('experiment selections restore per project and storage failure keeps the current view usable',t=>{
  const previousStorage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=previousStorage;});
  let persisted;
  globalThis.localStorage={getItem:()=>null,setItem:(_key,value)=>{persisted=JSON.parse(value);}};
  const app=synchronousState(new App({}));app.refresh=async()=>true;
  Object.assign(app.state,{projectId:'p',selectedExp:'p-exp',selectedRun:'old-run',data:{project:{id:'p'},experiments:[{id:'p-exp'}]}});
  app.switchProject('q');assert.equal(app.state.selectedExp,'');assert.equal(app.state.selectedRun,'');
  Object.assign(app.state,{selectedExp:'q-exp',data:{project:{id:'q'},experiments:[{id:'q-exp'}]}});
  const previous={...app.state,selectedExp:''};app.componentDidUpdate({},previous);
  assert.deepEqual(persisted.experimentSelections,{p:'p-exp',q:'q-exp'});
  app.switchProject('p');assert.equal(app.state.selectedExp,'p-exp');
  app.switchProject('q');assert.equal(app.state.selectedExp,'q-exp');
  globalThis.localStorage.setItem=()=>{throw Error('storage blocked');};
  assert.doesNotThrow(()=>app.componentDidUpdate({},previous));
  app.componentWillUnmount();
});

test('returning from Experiments restores the same chat session and mounted chat key',()=>{
  const previousStorage=globalThis.localStorage;globalThis.localStorage={getItem:()=>null,setItem(){}};
  try{
    const app=synchronousState(new App({})),session={id:'root-a',role:'coordinator',state:'idle',model:{provider:'test',model:'fixture'}};
    Object.assign(app.state,{boot:{projects:[{id:'p',name:'Project'}],runtime:{ready:true}},projectId:'p',sessionId:session.id,tab:'experiments',data:{project:{id:'p',name:'Project',archived:false,settings:{enabled:false}},sessions:[session],experiments:[],runs:[],teams:[],campaigns:[],evidence:[],intents:[]},messages:[{id:'kept-message'}],pendingMessages:[{id:'kept-pending'}],historyAnchor:{direction:'before',id:'kept-cursor'},stream:'kept draft context'});
    const chatKey=()=>elements(app.render()).find(node=>node.type?.name==='Chat')?.key,experiments=elements(app.render()).find(node=>node.type?.name==='Experiments'),before=chatKey();
    assert.ok(experiments);experiments.props.onChat();
    assert.equal(app.state.tab,'chat');assert.equal(app.state.sessionId,session.id);assert.equal(chatKey(),before);
    assert.deepEqual(app.state.messages,[{id:'kept-message'}]);assert.deepEqual(app.state.pendingMessages,[{id:'kept-pending'}]);assert.deepEqual(app.state.historyAnchor,{direction:'before',id:'kept-cursor'});assert.equal(app.state.stream,'kept draft context');
    app.componentWillUnmount();
  }finally{globalThis.localStorage=previousStorage;}
});
