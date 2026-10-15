import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.env.CFLOW_BASELINE_ROOT??process.cwd());
const {Inspector}=await import(pathToFileURL(join(root,'dist/web/assets/workbench.js')).href);
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'||typeof node==='number'?String(node):'';
const now='2026-10-10T00:00:00Z';
const team={id:'t',rootSessionId:'s',goal:'Fixed approved plan',state:'awaiting_approval',delegationEnabled:true};
const approval={id:'a',subjectKind:'team',subjectId:'t',status:'approved',version:2,reason:'Fixed collaboration only'};
const data=()=>({project:{id:'p',settings:{enabled:true},archived:false},teams:[team],approvals:[approval],tasks:[],budgets:[],runs:[],reviews:[]});
function view(project,perform=async fn=>fn()){return new Inspector({data:project,boot:{runtime:{ready:true}},tab:'chat',sessionId:'s',perform,onDirective(){}});}
const button=(tree,title)=>elements(tree).find(n=>n.type==='button'&&text(n)===title);

test('CFLOW-01 reopened approved plan starts without deciding again and hides active receipts',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});const requests=[],works=[];globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return {ok:true,json:async()=>({})};};
 const project=data(),inspector=view(project,fn=>{const work=fn();works.push(work);return work;});let tree=inspector.render();const start=button(tree,'启动已批准协作');assert.ok(start);assert.equal(start.props.disabled,false);assert.equal(button(tree,'拒绝此计划'),undefined);start.props.onClick();await Promise.all(works);assert.deepEqual(requests,[{url:'/api/teams/t/activate',body:{}}]);
 project.teams=[{...team,state:'active'}];assert.equal(button(inspector.render(),'启动已批准协作'),undefined);
});

test('CFLOW-01 interrupted approve/start resumes only activation after refreshed approved receipt',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});const requests=[],works=[];let fail=true;globalThis.fetch=async(url,init)=>{requests.push(url);return fail&&url.endsWith('/activate')?{ok:false,status:409,json:async()=>({error:{message:'Offline transient activation failure'}})}:{ok:true,json:async()=>({})};};
 const project=data();project.approvals=[{...approval,status:'pending',version:1}];const inspector=view(project,fn=>{const work=fn().catch(error=>error);works.push(work);return work;});button(inspector.render(),'批准并启动协作').props.onClick();await Promise.all(works);assert.deepEqual(requests,['/api/approvals/a/decide','/api/teams/t/activate']);assert.match((await works[0]).message,/Offline transient activation failure/);
 project.approvals=[approval];fail=false;button(inspector.render(),'启动已批准协作').props.onClick();await Promise.all(works);assert.deepEqual(requests,['/api/approvals/a/decide','/api/teams/t/activate','/api/teams/t/activate']);
});

test('CFLOW-01 retry button follows backend eligibility, shows block reason and retained bounded history',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});const requests=[],works=[];globalThis.fetch=async(url,init)=>{requests.push(url);return {ok:true,json:async()=>({})};};const project=data();project.teams=[{...team,state:'partial'}];project.approvals=[];project.tasks=[{id:'task',teamId:'t',key:'a',role:'analyst',execution:'failed',acceptance:'pending',objective:'Failed fixture',dependencies:[],retry:{eligible:false,code:'BUDGET_EXCEEDED',reason:'可用任务额度不足；保留主会话综合额度'},attempts:[{id:'old-attempt',generation:3,state:'unknown',createdAt:now,updatedAt:now,error:'Old lease error preserved'},{id:'partial-attempt',generation:2,state:'finished',createdAt:now,updatedAt:now,result:{outcome:'partial',summary:'Old result excerpt',summaryTruncated:true}}]}];
 const inspector=view(project,fn=>{const work=fn();works.push(work);return work;});let tree=inspector.render(),retry=button(tree,'新尝试重试');assert.equal(retry.props.disabled,true);assert.match(text(tree),/BUDGET_EXCEEDED/);assert.match(text(tree),/保留主会话综合额度/);assert.match(text(tree),/较早记录仍保留/);assert.match(text(tree),/Old lease error preserved/);assert.doesNotMatch(text(tree),/尝试 3/);assert.match(text(tree),/尝试 old-atte/);assert.match(text(tree),/Old result excerpt/);assert.match(text(tree),/历史摘要已截断/);retry.props.onClick();assert.equal(requests.length,0);
 project.tasks[0].retry={eligible:true};retry=button(inspector.render(),'新尝试重试');assert.equal(retry.props.disabled,false);retry.props.onClick();await Promise.all(works);assert.deepEqual(requests,['/api/tasks/task/retry']);project.project.archived=true;assert.equal(button(inspector.render(),'新尝试重试').props.disabled,true);
});
