import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {App} from '../../dist/web/assets/app.js';

const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';

test('all twelve workflow buttons preserve project and session while closing mobile navigation',()=>{
  const app=synchronousState(new App({}));
  Object.assign(app.state,{boot:{projects:[]},projectId:'project',sessionId:'session',navigationOpen:true});
  const buttons=elements(app.render()).filter(node=>node.type==='button'&&node.props.onClick&&node.props.children?.[1]?.type==='span');
  assert.deepEqual(buttons.map(node=>text(node.props.children[1])).sort(),['研究会话','实验与运行','研究活动','实现与审查','变更提案','文献检索','项目工作区','资料与证据','报告与成果','技能与连接器','资源与调度','设置与能力'].sort());
  for(const button of buttons){
    app.state.navigationOpen=true;button.props.onClick({currentTarget:{closest:()=>null}});
    assert.equal(app.state.navigationOpen,false);
    assert.equal(app.state.projectId,'project');assert.equal(app.state.sessionId,'session');
    const current=elements(app.render()).filter(node=>node.props?.['aria-current']==='page');
    assert.equal(current.length,1);assert.equal(text(current[0]),text(button));
  }
  app.componentWillUnmount();
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
