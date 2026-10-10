import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {Chat, Inspector} from '../../dist/web/assets/workbench.js';
import {App} from '../../dist/web/assets/app.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';
const session={id:'root-a',projectId:'p',title:'研究主会话',state:'idle',model:{provider:'test',model:'model'},version:1};
const data=(enabled=false)=>({project:{id:'p',archived:false,version:2,settings:{enabled}},sessions:[],messages:[],teams:[],tasks:[],budgets:[],approvals:[],experiments:[],runs:[],intents:[],runGrants:[]});
const submitted=(content='first message',mode='prompt')=>({id:crypto.randomUUID(),kind:'message',projectId:'p',sessionId:'root-a',version:1,createdAt:'2026-10-10T00:00:00Z',updatedAt:'2026-10-10T00:00:00Z',role:'user',status:'queued',content,mode});
const boot={runtime:{ready:true,message:''}};
function chat({project=data(),current=session,busy=false,onToggle=()=>{},perform=async fn=>fn()}={}){
  return synchronousState(new Chat({data:project,boot,session:current??undefined,busy,messages:[],history:null,historyAnchor:null,onHistory(){},stream:'',perform,onToggle,onNew(){},onExperiments(){},onWorkspace(){},onSession(){}}));
}
const toggleOf=view=>elements(view.render()).find(node=>node.type==='button'&&node.props.role==='switch');

test('queued chat headings say processing while other badges retain their state labels',()=>{
  for(const state of ['queued','idle','running','failed','cancelled','archived','interrupted']){
    const view=chat({current:{...session,state}}),heading=elements(view.render()).find(node=>node.props?.className==='chat-heading'),badge=elements(heading).find(node=>node.type?.name==='Badge');
    assert.equal(badge.props.value,state);
    assert.equal(text(badge.type(badge.props)),state==='queued'?'正在处理':text(badge.type({value:state})));
    assert.equal(text(badge.type({value:'queued'})),'排队中');
  }
});

test('composer sends an ordinary message while collaboration mode remains project-scoped',async t=>{
  const oldFetch=globalThis.fetch;
  t.after(()=>{globalThis.fetch=oldFetch;});
  const calls=[],performed=[];let toggles=0;
  globalThis.fetch=async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>submitted(JSON.parse(init.body).content,JSON.parse(init.body).mode)};};
  const view=chat({onToggle:()=>{toggles++;},perform:fn=>{const work=fn();performed.push(work);return work;}});
  view.state.draft='Compare these results';
  const tree=view.render(),toggle=elements(tree).find(node=>node.type==='button'&&node.props.role==='switch'),form=elements(tree).find(node=>node.type==='form'&&node.props.className==='composer');
  assert.equal(elements(tree).some(node=>node.type==='select'&&node.props['aria-label']==='消息方式'),false);
  assert.equal(toggle.props.type,'button');
  assert.equal(toggle.props['aria-label'],'多智能体模式');
  assert.match(toggle.props.title,/同项目所有研究会话共享/);
  toggle.props.onClick();
  assert.equal(toggles,1);assert.equal(calls.length,0);
  form.props.onSubmit({preventDefault(){}});
  await Promise.all(performed);
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'/api/sessions/root-a/messages');
  assert.deepEqual(JSON.parse(calls[0].init.body),{content:'Compare these results',mode:'prompt'});
});

test('Enter sends; Shift+Enter and composing Enter stay in the textarea',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  const calls=[],performed=[];globalThis.fetch=async(url,init)=>{calls.push({url,init});return{ok:true,json:async()=>submitted(JSON.parse(init.body).content,JSON.parse(init.body).mode)};};
  const view=chat({perform:fn=>{const work=fn();performed.push(work);return work;}}),tree=view.render(),form=elements(tree).find(node=>node.type==='form'&&node.props.className==='composer'),textarea=elements(tree).find(node=>node.type==='textarea'&&node.props['aria-label']==='研究问题');
  let submits=0;const key=(extra={})=>{let prevented=false;textarea.props.onKeyDown({key:'Enter',shiftKey:false,preventDefault(){prevented=true;},currentTarget:{form:{requestSubmit(){submits++;form.props.onSubmit({preventDefault(){}});}}},...extra});return prevented;};
  view.state.draft='line one';assert.equal(key({shiftKey:true}),false);assert.equal(submits,0);
  assert.equal(key({isComposing:true}),false);assert.equal(key({keyCode:229}),false);assert.equal(submits,0);
  assert.equal(key(),true);await Promise.all(performed);
  assert.equal(submits,1);assert.equal(calls.length,1);assert.deepEqual(JSON.parse(calls[0].init.body),{content:'line one',mode:'prompt'});
  for(const modifier of [{ctrlKey:true},{metaKey:true}]){view.state.draft='shortcut message';assert.equal(key(modifier),true);await Promise.all(performed.slice(-1));}
  assert.equal(calls.length,3);assert.deepEqual(JSON.parse(calls[2].init.body),{content:'shortcut message',mode:'prompt'});
});

test('send failure keeps the draft, and a response does not clear newer typing',async t=>{
  const oldFetch=globalThis.fetch;t.after(()=>{globalThis.fetch=oldFetch;});
  let resolve;globalThis.fetch=()=>new Promise(r=>{resolve=r;});
  const performed=[],view=chat({perform:fn=>{const work=fn().catch(error=>error);performed.push(work);return work;}}),form=elements(view.render()).find(node=>node.type==='form'&&node.props.className==='composer');
  view.state.draft='first message';form.props.onSubmit({preventDefault(){}});view.state.draft='next message';
  resolve({ok:true,json:async()=>submitted()});await Promise.all(performed);
  assert.equal(view.state.draft,'next message');
  globalThis.fetch=async()=>({ok:false,status:409,json:async()=>({error:{message:'write failed'}})});
  const retry=elements(view.render()).find(node=>node.type==='form'&&node.props.className==='composer');retry.props.onSubmit({preventDefault(){}});
  await Promise.all(performed.slice(1));assert.equal(view.state.draft,'next message');
});

test('mode switch disables while busy, without a session, on task or archived sessions, and for archived projects',()=>{
  const cases=[
    chat({busy:true}),
    chat({current:null}),
    chat({current:{...session,taskId:'task-a'}}),
    chat({current:{...session,state:'archived'}}),
    chat({project:{...data(),project:{...data().project,archived:true}}}),
  ];
  for(const view of cases)assert.equal(toggleOf(view).props.disabled,true);
});

test('chat Inspector scopes plans and results to its main session and keeps old results when mode is off',()=>{
  const currentTeam={id:'team-a',rootSessionId:'root-a',goal:'当前会话计划',state:'partial',delegationEnabled:false};
  const otherTeam={id:'team-b',rootSessionId:'root-b',goal:'其他会话计划',state:'active'};
  const currentApproval={id:'approval-a',subjectKind:'team',subjectId:'team-a',status:'pending',reason:'当前会话批准原因',version:1};
  const otherApproval={id:'approval-b',subjectKind:'team',subjectId:'team-b',status:'pending',reason:'其他会话批准原因',version:1};
  const project=data(false);
  Object.assign(project,{teams:[currentTeam,otherTeam],approvals:[currentApproval,otherApproval],tasks:[
    {id:'task-a',teamId:'team-a',key:'analysis',role:'analyst',execution:'output_submitted',acceptance:'accepted',objective:'当前会话任务',dependencies:[],result:{summary:'关闭模式后仍保留的旧结果',verdict:'accept'}},
    {id:'task-b',teamId:'team-b',key:'foreign',role:'analyst',execution:'running',acceptance:'pending',objective:'其他会话任务',dependencies:[],result:{summary:'其他会话结果'}},
  ]});
  const operations=[];
  const view=synchronousState(new Inspector({data:project,boot,tab:'chat',sessionId:'root-a',experiment:undefined,perform:work=>{operations.push(work);return Promise.resolve();},onPrepare(){},onChild(){},onConfig(){},onDirective(){}}));
  const tree=view.render(),rendered=text(tree),buttons=elements(tree).filter(node=>node.type==='button');
  assert.equal(buttons.filter(node=>node.props.role==='switch').length,0);
  assert.match(rendered,/当前会话计划/);assert.match(rendered,/当前会话批准原因/);assert.match(rendered,/关闭模式后仍保留的旧结果/);
  assert.match(rendered,/此计划已停止；请在对话中重新提出任务/);
  assert.doesNotMatch(rendered,/其他会话计划|其他会话批准原因|其他会话任务|其他会话结果/);
  const approve=buttons.find(node=>text(node).includes('批准并启动协作'));
  const reject=buttons.find(node=>text(node).includes('拒绝此计划'));
  assert.equal(approve.props.disabled,true);assert.equal(typeof reject.props.disabled,'undefined');
  approve.props.onClick();assert.equal(operations.length,0);
  view.props.data.project.settings.enabled=true;
  const reopened=elements(view.render()).find(node=>node.type==='button'&&text(node).includes('批准并启动协作'));
  assert.equal(reopened.props.disabled,true);
  reopened.props.onClick();assert.equal(operations.length,0);
  reject.props.onClick();assert.equal(operations.length,1);
});

test('manual collaboration plan modal is no longer available',()=>{
  const app=synchronousState(new App({}));
  app.state.modal='team';
  assert.equal(app.modalView(),null);
});

test('project switch writes collaboration settings and leaves its displayed value unchanged on API failure',async t=>{
  const oldFetch=globalThis.fetch;
  t.after(()=>{globalThis.fetch=oldFetch;});
  let fail=false,request;
  globalThis.fetch=async(url,init)=>{request={url,init};return fail?{ok:false,status:409,json:async()=>({error:{message:'version conflict'}})}:{ok:true,json:async()=>({})};};
  const app=synchronousState(new App({}));
  app.state.data={project:{id:'p',version:4,settings:{enabled:false}}};
  app.refresh=async()=>true;
  await app.toggle();
  assert.equal(request.url,'/api/projects/p/collaboration-settings');
  assert.deepEqual(JSON.parse(request.init.body),{expectedVersion:4,enabled:true});
  fail=true;await app.toggle();
  assert.equal(app.state.data.project.settings.enabled,false);
  assert.equal(app.state.error,'version conflict');
  assert.equal(app.state.notice,'');
});
