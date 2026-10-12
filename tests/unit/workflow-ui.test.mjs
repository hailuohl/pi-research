import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {existsSync}from'node:fs';
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props?.children);
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
test('handoff page makes no automatic test or run claim, and displays actionable empty state',async()=>{assert.ok(existsSync('dist/web/assets/changes.js'));const {ChangesView}=await import('../../dist/web/assets/changes.js');const view=synchronousState(new ChangesView({data:{project:{id:'p'},experiments:[],artifacts:[],tasks:[],approvals:[],changeProposals:[]},perform:async f=>f()}));const t=flatten(view.render());assert.match(t,/变更提案/);assert.match(t,/新子实验/);assert.match(t,/不会自动运行/);assert.match(t,/尚未/);});
test('experiment details retain real contract metrics and read-only controls inside the current dialogue',async()=>{
 const {Inspector}=await import('../../dist/web/assets/workbench.js'),{ConversationPanel}=await import('../../dist/web/assets/conversation-panel.js');
 const contract={command:['python','experiment.py'],runner:'docker',datasetVersion:'fixed',metrics:{accuracy:{direction:'max',unit:'fraction'}}};
 const experiment={id:'e',parentId:null,title:'Classifier',hypothesis:'Compare accuracy',revision:1,contractDigest:'C',lifecycle:'frozen',contract};
 const data={project:{id:'p'},experiments:[experiment],runs:[{id:'r',experimentId:'e',state:'succeeded',integrity:'complete',createdAt:new Date().toISOString(),metrics:{accuracy:0.9},manifest:{contractDigest:'C',contract}}],evidence:[],teams:[],tasks:[],budgets:[],approvals:[]};
 let configured=0;const details=synchronousState(new Inspector({data,boot:{},tab:'experiments',embedded:true,sessionId:'root',experiment,selectedRun:'r',onConfig(){configured++;}})),tree=details.render(),t=flatten(tree);
 assert.match(t,/accuracy/);assert.match(t,/越高越好/);assert.match(t,/fraction/);assert.ok(!t.includes('实测 MSE'));assert.match(t,/0.90000/);assert.match(t,/运行/);
 assert.doesNotMatch(t,/新建实验|创建基线实验|准备运行|派生子实验|有限冻结运行授权/);elements(tree).find(n=>n.type==='button'&&flatten(n)==='查看只读配置').props.onClick();assert.equal(configured,1);
 const panel=synchronousState(new ConversationPanel({data,projectId:'p',active:true,selectedExperiment:'e',experimentDetails:tree,collaboration:null,onExperiment(){},onWorkspace(){},onChooseProject(){},onRetry(){},error:''}));panel.showExperiments();assert.doesNotMatch(flatten(panel.render()),/在研究对话中描述实验目标/);assert.equal(panel.state.view,'experiments');
 const empty=synchronousState(new ConversationPanel({...panel.props,data:{...data,experiments:[],runs:[]},experimentDetails:null}));empty.showExperiments();assert.match(flatten(empty.render()),/暂无实验/);assert.match(flatten(empty.render()),/在对话中描述实验目标/);
});
const outcomeProps=()=>({run:{id:'r',state:'failed',version:1,answerDisposition:'needs_review'},perform:async f=>f()});
const outcomeView=async(props=outcomeProps())=>{const {OutcomeReview}=await import('../../dist/web/assets/workbench.js');return OutcomeReview.prototype?.render?synchronousState(new OutcomeReview(props)):{render:()=>OutcomeReview(props)};};
const outcomeModal=view=>elements(view.render()).find(n=>n.type?.name==='Modal');
test('ambiguous run outcome UI distinguishes freeze from authorization to repair',async()=>{const view=await outcomeView(),t=flatten(view.render());assert.match(t,/回答研究问题/);assert.match(t,/允许准备修复/);assert.match(t,/冻结/);assert.match(t,/不会修改执行状态/);});
test('outcome buttons open the styled application dialog without a browser prompt and cancel without writing',async t=>{
 const previous=globalThis.prompt;globalThis.prompt=()=>{throw Error('browser prompt must not open');};t.after(()=>{if(previous===undefined)delete globalThis.prompt;else globalThis.prompt=previous;});
 const view=await outcomeView();
 for(const [label,disposition] of [['未回答：允许准备修复','unanswered'],['已回答：冻结节点','answered']]){
  elements(view.render()).find(n=>n.type==='button'&&flatten(n)===label).props.onClick();
  const modal=outcomeModal(view);assert.ok(modal);assert.equal(view.state.target.disposition,disposition);assert.equal(modal.props.submitDisabled,true);
  const rendered=synchronousState(new modal.type(modal.props)).render(),dialog=elements(rendered).find(n=>n.props?.role==='dialog');
  assert.equal(dialog.props['aria-modal'],'true');assert.match(flatten(rendered),/评议理由/);
  const input=elements(rendered).find(n=>n.type==='textarea');assert.equal(input.props.required,true);assert.equal(input.props.maxLength,4000);
  const boundary=elements(view.render()).find(n=>n.type==='div'&&n.props.onSubmit);let stopped=false;boundary.props.onSubmit({stopPropagation(){stopped=true;}});assert.equal(stopped,true);
  view.setState({reason:'draft'});modal.props.onClose();assert.equal(outcomeModal(view),undefined);assert.equal(view.state.reason,'');
 }
});
test('outcome save rejects blank reasons and submits the chosen result and fixed run version',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({id:'r',version:2})};});
 for(const disposition of ['unanswered','answered']){
  const view=await outcomeView();view.open(disposition);view.setState({reason:' \n '});await view.save();assert.equal(calls.length,disposition==='unanswered'?0:1);
  view.setState({reason:'  已检查日志与产物。  '});await view.save();assert.equal(view.state.target,null);
  assert.deepEqual(calls.at(-1),{url:'/api/runs/r/outcome-review',body:{expectedVersion:1,disposition,reason:'已检查日志与产物。'}});
 }
});
test('outcome save keeps the reason and inline error when the application handles a failed request',async t=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:false,status:409,json:async()=>({error:{code:'VERSION_CONFLICT',message:'运行记录已变化'}})}));
 const view=await outcomeView({...outcomeProps(),perform:async f=>{try{return await f();}catch{return undefined;}}});
 view.open('unanswered');view.setState({reason:'保留这份判断理由'});await view.save();
 assert.ok(outcomeModal(view));assert.equal(view.state.reason,'保留这份判断理由');assert.equal(view.state.saving,false);
 assert.match(flatten(outcomeModal(view).props.children),/运行记录已变化/);assert.ok(elements(outcomeModal(view).props.children).some(n=>n.props?.role==='alert'));
});
test('outcome save prevents duplicate submission and does not close while saving',async t=>{
 let release,calls=0;t.mock.method(globalThis,'fetch',()=>{calls++;return new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({id:'r'})});});});
 const view=await outcomeView();view.open('unanswered');view.setState({reason:'真实日志核对后确认'});const saving=view.save();await view.save();outcomeModal(view).props.onClose();
 assert.equal(calls,1);assert.equal(view.state.saving,true);assert.ok(outcomeModal(view));
 release();await saving;assert.equal(view.state.target,null);assert.equal(view.state.saving,false);
});
test('outcome draft cannot be applied to another run, a newer version, or an archived project',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw Error('must not submit');});
 for(const changed of [{run:{...outcomeProps().run,id:'other'}},{run:{...outcomeProps().run,version:2}},{readOnly:true}]){
  const view=await outcomeView();view.open('unanswered');view.setState({reason:'当前运行的判断'});view.props={...view.props,...changed};
  assert.equal(outcomeModal(view).props.submitDisabled,true);await view.save();assert.equal(view.state.reason,'当前运行的判断');assert.ok(outcomeModal(view));
 }
 const archived=await outcomeView({...outcomeProps(),readOnly:true});archived.open('answered');assert.equal(outcomeModal(archived),undefined);assert.equal(calls,0);
});
test('stale accepted claims are labelled historical instead of current',async()=>{const {EvidenceView}=await import('../../dist/web/assets/data-views.js');const view=synchronousState(new EvidenceView({data:{project:{id:'p'},artifacts:[],evidence:[],claims:[{id:'c',statement:'Historical claim',status:'accepted',validity:'stale',evidenceIds:[],limitations:[]}]},perform:async f=>f(),onRegister(){},onClaim(){}}));assert.match(flatten(view.render()),/前提或审查已失效/);});
test('a stale proposal has a warning and no create-child action',async()=>{const {ChangesView}=await import('../../dist/web/assets/changes.js');const view=synchronousState(new ChangesView({data:{project:{id:'p'},experiments:[],artifacts:[],tasks:[],approvals:[{id:'a',status:'approved'}],changeProposals:[{id:'c',title:'Draft',sourceValidity:'stale',state:'prepared',changes:[],baseExperimentId:'b',baseRevision:1,approvalId:'a'}]},perform:async f=>f()}));const t=flatten(view.render());assert.match(t,/来源审查已失效/);assert.ok(!t.includes('创建新子实验'));});
