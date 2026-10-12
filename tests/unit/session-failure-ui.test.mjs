import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {renderToStaticMarkup} from 'react-dom/server';
import {synchronousState} from '../support/ui.mjs';

const built=await build({stdin:{contents:"export {Chat} from './apps/web/src/workbench.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {Chat}=module.exports;

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):node==null||typeof node==='boolean'?'':String(node);
const data={project:{id:'p',archived:false,settings:{enabled:false}},campaigns:[],members:[],researchCandidates:[],decisions:[],intents:[],approvals:[],developmentTasks:[],reviews:[],changeProposals:[],researchActions:[],teams:[],sessions:[],experiments:[],runs:[],tasks:[],artifacts:[],evidence:[],claims:[],reports:[],searches:[],usage:[],budgets:[],rounds:[],observations:[],wakeups:[]};
const session=(id,state,lastError)=>({id,version:1,projectId:'p',title:id,role:'coordinator',state,generation:0,model:{provider:'test',model:'test',thinking:'high'},...(lastError===undefined?{}:{lastError})});
const chatProps=session=>({data,boot:{runtime:{ready:true,code:'READY',message:''}},session,messages:[],pendingMessages:[],pendingTotal:0,pendingNextCursor:null,canSteer:false,history:null,historyAnchor:null,onHistory(){},stream:'',busy:false,perform:fn=>fn(),onToggle(){},onNew(){},onExperiments(){},onWorkspace(){},onSession(){},onExperiment(){},onRun(){}});
const alertFor=view=>elements(view.render()).find(node=>node.props?.role==='alert');

test('failed revoked-skill session explains the block and keeps the original error as escaped text',()=>{
 const raw='SKILL_CAPABILITY_MISSING — bundle binding:hash123 — SKILL_REVOKED — 技能版本已撤销，不能启动或启用 <img src=x onerror=alert(1)>';
 const view=synchronousState(new Chat(chatProps(session('failed','failed',raw)))),alert=alertFor(view),nodes=elements(alert),details=nodes.find(node=>node.type==='details'),summary=nodes.find(node=>node.type==='summary');
 assert.ok(alert);
 assert.match(text(alert),/此会话绑定的技能版本已撤销，无法启动。请创建新会话；已有消息与历史保留。/);
 assert.ok(details);
 assert.equal(text(summary),'查看失败原因');
 assert.ok(nodes.some(node=>node.type==='p'&&text(node)===raw));
 assert.ok(nodes.every(node=>!Object.hasOwn(node.props??{},'dangerouslySetInnerHTML')));
 const markup=renderToStaticMarkup(alert);
 assert.match(markup,/&lt;img src=x onerror=alert\(1\)&gt;/);
 assert.doesNotMatch(markup,/<img\b/i);
});

test('other and missing failure reasons get a generic explanation without exposing details by default',()=>{
 const view=synchronousState(new Chat(chatProps(session('failed','failed')))),alert=alertFor(view);
 assert.ok(alert);
 assert.match(text(alert),/此会话已失败。已有消息与历史保留。/);
 assert.doesNotMatch(text(alert),/undefined|null/);
 assert.equal(elements(alert).some(node=>node.type==='details'),false);
 const other=synchronousState(new Chat(chatProps(session('other-failed','failed','worker stopped')))),otherAlert=alertFor(other),details=elements(otherAlert).find(node=>node.type==='details');
 assert.ok(details);
 assert.match(text(otherAlert),/此会话已失败。已有消息与历史保留。/);
 assert.equal(text(elements(details).find(node=>node.type==='p')),'worker stopped');
});

test('old failure details stay hidden outside failed state and after selecting another session',()=>{
 const oldError='SKILL_CAPABILITY_MISSING — SKILL_REVOKED — old session';
 const view=synchronousState(new Chat(chatProps(session('failed','failed',oldError))));
 assert.ok(alertFor(view));
 for(const next of [session('failed','queued',oldError),session('other','running',oldError),session('other','idle',oldError)]){
  view.props=chatProps(next);
  assert.equal(alertFor(view),undefined,next.id+':'+next.state);
  assert.doesNotMatch(text(view.render()),/old session/);
 }
});
