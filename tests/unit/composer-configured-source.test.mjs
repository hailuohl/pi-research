import test from 'node:test';
import assert from 'node:assert/strict';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
import {synchronousState} from '../support/ui.mjs';

const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const definition=(id,source)=>({model:id,name:id,source,enabled:true,deletedAt:null,reasoning:{defaultLevel:'configured-depth',levels:[{id:'configured-depth',label:'已保存档位',piLevel:'high',parameters:{}}]}});
const provider=(id,source,models)=>({provider:id,name:id,source,enabled:true,deletedAt:null,models});

test('existing local models follow the same settings catalogue without adding SDK or history-only choices',async()=>{
  const selected=[],management={providers:[provider('saved','managed',[definition('saved-model','managed'),definition('configured-compat','legacy')]),provider('native','legacy',[definition('native-configured','legacy')])]};
  const current={provider:'history',model:'history-only',thinking:'configured-depth'};
  const menu=synchronousState(new ComposerModelMenu({sessionId:'session',current,management,busy:false,disabled:false,locked:false,onSelect:async model=>{selected.push(model);return {id:'session',model};}}));
  const options=nodes(menu.render()).filter(node=>node.props?.role==='menuitemradio');
  assert.deepEqual(options.map(node=>nodes(node).find(child=>child.type==='strong').props.children),['saved-model','configured-compat','native-configured']);
  const trigger=nodes(menu.render()).find(node=>node.props?.className==='composer-model-trigger');
  assert.match(JSON.stringify(trigger),/history-only/);
  assert.match(JSON.stringify(trigger),/不可用/);
  for(const [provider,model] of [['saved','sdk-only'],['history','history-only'],['native','unconfigured']]){
    await menu.chooseModel(provider,model);
    await menu.choose({provider,model,thinking:'configured-depth'});
  }
  assert.deepEqual(selected,[]);
  await menu.chooseModel('saved','saved-model');
  await menu.chooseModel('native','native-configured');
  assert.deepEqual(selected,[{provider:'saved',model:'saved-model',thinking:'configured-depth'},{provider:'native',model:'native-configured',thinking:'configured-depth'}]);
  const previous=menu.props;menu.props={...previous,current:selected.at(-1)};menu.componentDidUpdate(previous);
  const range=nodes(menu.render()).find(node=>node.props?.type==='range');
  assert.equal(range.props['aria-valuetext'],'已保存档位');
  assert.equal(range.props.max,0);
  assert.equal(range.props.disabled,true);
});
