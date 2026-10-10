import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';
import {ResearchActionCards,ResearchActionCard} from '../../dist/web/assets/research-action-cards.js';
import {EvidenceView,LiteratureView,ReportsView} from '../../dist/web/assets/data-views.js';
import {SettingsView} from '../../dist/web/assets/settings-view.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const data=()=>({project:{id:'p',name:'Project',settings:{enabled:false}},sessions:[],experiments:[],runs:[],teams:[],campaigns:[],wakeups:[],intents:[],artifacts:[],evidence:[],claims:[{id:'claim',version:1,statement:'Fixed candidate',evidenceIds:['evidence'],limitations:['Synthetic'],status:'proposal'}],reports:[],researchActions:[]});
const session={id:'s',projectId:'p',role:'coordinator',state:'idle',title:'Main',model:{provider:'test',model:'model'}};
const input={kind:'claim_decision',claim:{claimId:'claim',expectedVersion:1}};
const request=(extra={})=>({id:'request',version:1,projectId:'p',sessionId:'s',kind:'research-action',actionKind:input.kind,input,state:'pending',effectiveState:'pending',reasons:[],expiresAt:'2099-01-01T00:00:00Z',...extra});
const props=(extra={})=>({data:data(),session,busy:false,perform:async f=>f(),onSession(){},onRun(){},...extra});

test('an idle conversation has no resource area; stored legacy classifications do not reopen it',t=>{
    assert.equal(new ResearchActionCards(props()).render(),null);
    const storage=globalThis.localStorage;t.after(()=>{globalThis.localStorage=storage;});
    for(const tab of ['literature','evidence','reports','chat']){
        globalThis.localStorage={getItem:()=>JSON.stringify({projectId:'p',sessionId:'s',tab,resourceTab:'reports',selectedReport:'old-report'})};
        const app=synchronousState(new App({}));Object.assign(app.state,{boot:{projects:[{id:'p'}],runtime:{ready:true}},data:data()});
        assert.equal(app.state.tab,'chat');assert.equal('resourceTab' in app.state,false);assert.equal(app.state.selectedReport,'old-report');
        const nodes=elements(app.render()),chat=nodes.find(n=>n.type?.name==='Chat');assert.ok(chat);assert.equal(chat.props.resources,undefined);assert.equal(nodes.some(n=>n.type?.name==='ConversationResources'||n.props?.id==='workspace-tool-menu'),false);app.componentWillUnmount();
    }
});

test('only own project and session cards appear; completed decisions remain in collapsed history',()=>{
    const own=request(),closed=request({id:'completed',state:'completed',effectiveState:'completed'}),foreign=request({id:'foreign',sessionId:'other'}),otherProject=request({id:'other-project',projectId:'other'}),view=new ResearchActionCards(props({data:{...data(),researchActions:[own,foreign,otherProject,closed]}})),nodes=elements(view.render());
    assert.deepEqual(nodes.filter(n=>n.type===ResearchActionCard).map(n=>n.props.request.id),['request','completed']);
    assert.ok(nodes.some(n=>n.type==='details'&&n.props.className==='workflow-history'&&!n.props.open));
    assert.equal(new ResearchActionCards(props({session:{...session,taskId:'task'}})).render(),null);
});

test('manual decisions send only the fixed request tuple; same-tick double click sends once',async t=>{
    const prior=globalThis.fetch;t.after(()=>{globalThis.fetch=prior;});const calls=[];let finish;
    globalThis.fetch=(url,options)=>{calls.push({url,body:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return new Promise(resolve=>{finish=()=>resolve({ok:true,json:async()=>({state:'completed'})});});};
    const card=synchronousState(new ResearchActionCard({...props(),request:request()}));
    const first=card.decide('accepted'),duplicate=card.decide('accepted');assert.equal(calls.length,1);assert.deepEqual(calls[0].body,{projectId:'p',sessionId:'s',input:{requestId:'request',expectedVersion:1,decision:'accepted'}});assert.ok(calls[0].key);finish();await Promise.all([first,duplicate]);assert.equal(card.state.saving,false);
    assert.equal(card.props.session.state,'idle','normal model completion does not hide confirmation');
});

test('stale or expired cards cannot confirm but the owner can dismiss; wrong context makes no call',async t=>{
    const prior=globalThis.fetch;t.after(()=>{globalThis.fetch=prior;});const calls=[];globalThis.fetch=async(url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,json:async()=>({state:'rejected'})};};
    for(const state of ['stale','expired']){const card=synchronousState(new ResearchActionCard({...props(),request:request({effectiveState:state,reasons:['SOURCE_CHANGED']})}));await card.decide('accepted');assert.ok(!elements(card.render()).some(n=>n.type==='button'&&n.props.children==='采纳此结论'));await card.decide('dismiss');}
    assert.equal(calls.length,2);assert.ok(calls.every(c=>c.input.decision==='dismiss'));
    const foreign=synchronousState(new ResearchActionCard({...props(),request:request({sessionId:'other'})}));assert.equal(foreign.render(),null);await foreign.decide('accepted');assert.equal(calls.length,2);
});

test('history and report inspectors mount only for a requested card or an explicit result click',()=>{
    const pending=request({actionKind:'history',input:{kind:'history',history:{kind:'reports'}}}),card=synchronousState(new ResearchActionCard({...props(),request:pending}));
    assert.equal(elements(card.render()).find(n=>n.type?.name==='ReportsView').props.readOnly,true);card.props={...card.props,request:{...pending,effectiveState:'stale',reasons:['PROJECT_LIFECYCLE_STALE']},data:{...data(),project:{...data().project,archived:true}}};assert.equal(elements(card.render()).find(n=>n.type?.name==='ReportsView').props.readOnly,true);
    const report=request({actionKind:'report_compose',input:{kind:'report_compose',report:{title:'Fixed report',runIds:[],claimIds:['claim'],publicationResultIds:[]}},state:'completed',effectiveState:'completed',resultRef:{reportId:'report'}}),result=synchronousState(new ResearchActionCard({...props(),request:report}));
    assert.ok(!elements(result.render()).some(n=>n.type?.name==='ReportsView'));elements(result.render()).find(n=>n.type==='button'&&n.props.children==='查看或导出固定报告').props.onClick();assert.equal(elements(result.render()).find(n=>n.type?.name==='ReportsView').props.selectedReport,'report');
});

test('late failed decisions do not update a different session card',async t=>{
    const prior=globalThis.fetch;t.after(()=>{globalThis.fetch=prior;});let reject;globalThis.fetch=()=>new Promise((_resolve,fail)=>{reject=fail;});
    const app=synchronousState(new App({}));Object.assign(app.state,{data:data(),projectId:'p',sessionId:'s'});app.refresh=async()=>true;
    const card=synchronousState(new ResearchActionCard({...props({perform:app.perform}),request:request()})),pending=card.decide('accepted');card.componentWillUnmount();app.state.sessionId='other';app.state.error='new session error';reject(Error('old session error'));await pending;assert.equal(card.state.error,'');assert.equal(app.state.error,'new session error');app.componentWillUnmount();
});

test('history inspectors omit mutations and source setup remains in settings without standalone grants',()=>{
    const d=data(),evidence=new EvidenceView({data:d,perform:async f=>f(),readOnly:true,onRegister(){throw Error('no registration');},onClaim(){throw Error('no claim');}}),report=new ReportsView({data:d,perform:async f=>f(),readOnly:true}),literature=new LiteratureView({data:d,perform:async f=>f(),readOnly:true});
    for(const v of [evidence,report,literature]){const nodes=elements(v.render());assert.ok(!nodes.some(n=>n.type==='input'&&n.props.type==='file'));assert.ok(!nodes.some(n=>n.type==='button'&&['登记为证据','提出结论候选','人工确认采纳','生成固定结果报告','提交检索任务'].includes(n.props.children)));}
    assert.ok(!elements(report.render()).some(n=>n.type?.name==='PublicationView'));
    assert.ok(!elements(literature.render()).some(n=>n.type?.name==='TextEvidencePanel'||n.type?.name==='DiscoveryGrants'));
    const settings=synchronousState(new SettingsView({boot:{},data:d,perform:async f=>f()}));settings.state.section='sources';const setup=elements(settings.render()).find(n=>n.type?.name==='LiteratureView');assert.equal(setup.props.setupOnly,true);assert.ok(elements(settings.render()).some(n=>n.type?.name==='PublicationCompilerConfiguration'));
});

test('source settings show failed and running literature tasks and saved hits without retry, cancel or retrieval actions',()=>{
    const d={...data(),literatureTasks:[{id:'failed-task',state:'failed',version:1,request:{kind:'search',search:{query:'Fixed query'}}},{id:'running-task',state:'running',version:1,request:{kind:'search',search:{query:'Fixed query'}}}]};
    const setup=synchronousState(new LiteratureView({data:d,perform:async()=>assert.fail('settings must not start literature work'),setupOnly:true}));
    setup.state.result={id:'saved-search',query:'Fixed query',status:'succeeded',sources:[{source:'crossref',status:'succeeded',count:1}],items:[{id:'saved-hit',source:'crossref',title:'Saved paper'}],page:{number:1,nextCursor:'next',nextCursorExpiresAt:'2099-01-01T00:00:00Z',rawItemCount:1}};
    const nodes=elements(setup.render()),buttons=nodes.filter(n=>n.type==='button').map(n=>n.props.children);
    assert.equal(nodes.filter(n=>n.type==='button'&&Array.isArray(n.props.children)&&n.props.children[0]==='读取已保存任务 ').length,2);
    assert.ok(nodes.some(n=>n.type==='li'&&n.props.children==='Saved paper'));
    for(const action of ['提交检索任务','请求取消任务','显式重试','显式获取下一页','提交此文献获取任务','以原检索授权获取此命中'])assert.ok(!buttons.includes(action),action);
    setup.componentWillUnmount();
});

test('archived projects can open a read-only history card without an Agent or stored request',()=>{
    const app=synchronousState(new App({}));Object.assign(app.state,{boot:{projects:[{id:'p'}],runtime:{ready:true}},data:{...data(),project:{...data().project,archived:true}},projectId:'p',sessionId:'s'});
    const open=elements(app.render()).find(n=>n.type==='button'&&n.props.children==='查看历史资料');assert.ok(open);open.props.onClick();const chat=elements(app.render()).find(n=>n.type?.name==='Chat');assert.equal(chat.props.archivedHistory.type.name,'ArchivedResearchHistory');assert.equal(app.state.archiveHistoryOpen,true);app.componentWillUnmount();
});
