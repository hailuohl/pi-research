import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const vendor={};vm.runInNewContext(readFileSync('apps/web/public/vendor/react.production.min.js','utf8'),vendor);globalThis.React=vendor.React;
const {Inspector}=await import('../../dist/web/assets/workbench.js');
const text=node=>node===null||node===undefined||typeof node==='boolean'?'':typeof node==='object'?Array.isArray(node)?node.map(text).join(' '):typeof node.type==='function'&&!node.type.prototype?.render?text(node.type(node.props)):text(node.props.children):String(node);
test('review verdict is distinct from task acceptance and missing legacy verdict never looks passed',()=>{
 const task={id:'review',teamId:'team',key:'paper_review',role:'reviewer',objective:'Review fixed manuscript',execution:'output_submitted',acceptance:'accepted',dependencies:[],result:{summary:'Read fixed text',outcome:'completed'}};
 const data={project:{settings:{enabled:true,maxConcurrentAssistants:3}},teams:[{id:'team',state:'completed',goal:'Paper review'}],tasks:[task],budgets:[],approvals:[],runs:[],intents:[]};
 for(const [verdict,label]of [['accept','接受'],['reject','拒绝'],['disputed','存在争议'],[undefined,'未提供；不能视为通过']]){
  task.result.verdict=verdict;const view=new Inspector({data,boot:{runtime:{ready:true}},tab:'chat',perform:async fn=>fn()});const rendered=text(view.render());assert.match(rendered,new RegExp('审查意见：\\s*'+label));assert.match(rendered,/独立于任务验收状态/);assert.match(rendered,/任务已验收/);
 }
});
