import test from 'node:test';
import assert from 'node:assert/strict';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
import {synchronousState} from '../support/ui.mjs';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const low={provider:'saved',model:'Research',thinking:'low'},high={...low,thinking:'high'},other={provider:'second',model:'Code',thinking:'high'};
function picker(){const selected=[],view=synchronousState(new ComposerModelMenu({sessionId:'fixture',current:high,options:[low,high,other],disabled:false,locked:false,onSelect:model=>selected.push(model)}));return {view,selected};}
test('model names are grouped and saved reasoning choices remain exact model configurations',()=>{
 const {view,selected}=picker(),groups=elements(view.render()).filter(e=>e.props?.role==='group');assert.equal(elements(groups[0]).filter(e=>e.props?.role==='menuitemradio').length,2);assert.equal(elements(groups[1]).filter(e=>e.props?.role==='menuitemradio').length,2);
 view.choose(high);assert.equal(selected.length,0);view.choose(low);assert.deepEqual(selected,[low]);view.chooseModel(other);assert.deepEqual(selected,[low,other]);assert.equal(view.props.current,high,'selection follows confirmed parent state');
});
test('already-open choices cannot write after locking, removal, or unmount',t=>{
 const previousWindow=globalThis.window;globalThis.window={removeEventListener(){}};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const {view,selected}=picker(),row=elements(view.render()).find(e=>e.props?.role==='menuitemradio'&&e.props['aria-checked']===false);view.props={...view.props,disabled:true};row.props.onClick();assert.equal(selected.length,0);
 view.props={...view.props,disabled:false,options:[]};view.chooseModel(other);view.choose(low);assert.equal(selected.length,0);view.props={...view.props,options:[low,high,other]};view.componentWillUnmount();view.choose(other);assert.equal(selected.length,0);
});
