import test from 'node:test';
import assert from 'node:assert/strict';
import {ComposerModelMenu} from '../../dist/web/assets/composer-model-menu.js';
import {synchronousState} from '../support/ui.mjs';
const elements=node=>Array.isArray(node)?node.flatMap(elements):!node||typeof node!=='object'?[]:[node,...elements(node.props?.children)];
const find=(view,predicate)=>elements(view.render()).find(predicate);
const level=(id,label=id)=>({id,label,piLevel:'high',parameters:{}});
const model=(id,levels=[level('low','轻量'),level('deep','深入研究')],defaultLevel='deep')=>({model:id,name:id+' configured name',enabled:true,deletedAt:null,reasoning:{levels,defaultLevel}});
const provider=(id,models)=>({provider:id,name:id+' configured provider',enabled:true,deletedAt:null,models});
const low={provider:'saved',model:'Research',thinking:'low'},high={...low,thinking:'deep'},other={provider:'second',model:'Code',thinking:'custom-default'};
test('an empty model selection remains a configure-later state instead of an unavailable model',()=>{
 const view=synchronousState(new ComposerModelMenu({sessionId:'empty',current:{provider:'',model:'',thinking:'off'},management:{providers:[]},disabled:false,busy:false,locked:false,onSelect:async()=>undefined}));
 const trigger=elements(view.render()).find(node=>node.props?.['aria-label']==='会话模型与思考等级'),label=elements(trigger).find(node=>node.props?.className==='composer-thinking-value');assert.equal(label,undefined);assert.equal(trigger.props.disabled,true);assert.match(trigger.props.title,/设置/);
});
const management=()=>({providers:[provider('saved',[model('Research')]),provider('second',[model('Code',[level('low','Code low'),level('custom-default','Code custom default')],'custom-default')])]});
function picker(overrides={}){const selected=[],view=synchronousState(new ComposerModelMenu({sessionId:'fixture',current:high,management:management(),busy:false,disabled:false,locked:false,onSelect:async selection=>{selected.push(selection);return {id:'fixture',model:selection};},...overrides}));return {view,selected};}

test('configured names and exact reasoning choices are authoritative; models use their configured default',async()=>{
 const {view,selected}=picker(),rows=elements(view.render()).filter(e=>e.props?.role==='menuitemradio');assert.equal(rows.length,2);
 assert.match(JSON.stringify(view.render()),/Research configured name/);assert.match(JSON.stringify(view.render()),/深入研究/);assert.doesNotMatch(JSON.stringify(view.render()),/顶级|最低/);
 await view.choose(high);assert.equal(selected.length,0);await view.choose(low);assert.deepEqual(selected,[low]);
 await view.chooseModel(other.provider,other.model);assert.deepEqual(selected,[low,other]);assert.equal(view.props.current,high,'selection follows confirmed parent state');
 view.setState({modelsOpen:true});await view.chooseModel(high.provider,high.model);assert.equal(view.state.modelsOpen,false);assert.equal(selected.length,2,'reopening the current model preserves its valid level');
});

test('disabled, deleted, missing-credential and history-only models never enter the menu',async()=>{
 const catalog=management();catalog.providers[0].models.push({...model('disabled'),enabled:false},{...model('deleted'),deletedAt:'deleted'});
 catalog.providers.push({...provider('disabled-provider',[model('hidden1')]),enabled:false},{...provider('deleted-provider',[model('hidden2')]),deletedAt:'deleted'},{...provider('credential-provider',[model('hidden3')]),requiresCredential:true});
 const {view,selected}=picker({management:catalog,current:{provider:'history',model:'Past model',thinking:'past'}});
 const rows=elements(view.render()).filter(e=>e.props?.role==='menuitemradio');assert.equal(rows.length,2);assert.equal(rows.some(row=>JSON.stringify(row).includes('Past model')),false);
 await view.choose({provider:'history',model:'Past model',thinking:'past'});assert.equal(selected.length,0);
 for(const metadata of [undefined,null]){view.props={...view.props,management:metadata};assert.equal(find(view,e=>e.props?.className==='composer-model-trigger').props.disabled,true);await view.choose(high);}
 view.props={...view.props,management:catalog,error:'metadata read failed'};await view.choose(high);assert.equal(selected.length,0);assert.match(JSON.stringify(view.render()),/metadata read failed/);
});

test('already-open choices cannot write after locking, removal, or unmount',async t=>{
 const previousWindow=globalThis.window;globalThis.window={removeEventListener(){}};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const {view,selected}=picker(),row=find(view,e=>e.props?.role==='menuitemradio'&&e.props['aria-checked']===false);
 for(const override of [{disabled:true},{locked:true},{busy:true},{management:null}]){view.props={...view.props,...override};row.props.onClick();await view.choose(low);}
 assert.equal(selected.length,0);view.props={...view.props,disabled:false,locked:false,busy:false,management:management()};view.props.management.providers=[];await view.chooseModel(other.provider,other.model);await view.choose(low);assert.equal(selected.length,0);
 view.props={...view.props,management:management()};view.componentWillUnmount();await view.choose(other);assert.equal(selected.length,0);
});

test('custom reasoning IDs and labels including max remain exact, without invented default or fixed labels',async()=>{
 const custom={...low,thinking:'deep-research'},maximum={...low,thinking:'max'},catalog=management();catalog.providers[0].models[0]=model('Research',[level('deep-research','研究自定义'),level('max','配置最高')],'max');
 const {view,selected}=picker({current:custom,management:catalog}),tree=JSON.stringify(view.render());assert.match(tree,/研究自定义/);assert.doesNotMatch(tree,/顶级|undefined/);
 await view.choose(maximum);assert.deepEqual(selected,[maximum]);view.props={...view.props,current:maximum};assert.match(JSON.stringify(view.render()),/配置最高/);
});

test('zero, one and fewer levels keep a complete range and cannot invent selectable levels',async()=>{
 for(const count of [0,1,2,3]){
  const levels=Array.from({length:count},(_,i)=>level('l'+i,'Label '+i)),catalog={providers:[provider('saved',[model('Research',levels,'l0')])]};
  const {view,selected}=picker({management:catalog,current:{...low,thinking:'l0'}}),range=find(view,e=>e.type==='input'&&e.props.type==='range');
  assert.equal(range.props.min,0);assert.equal(range.props.max,Math.max(0,count-1));assert.equal(range.props.disabled,count<2);
  const ticks=find(view,e=>e.props?.className==='composer-thinking-ticks');assert.equal(elements(ticks).filter(e=>e.type==='span').length,count);
  if(count>1){const all=elements(ticks).filter(e=>e.type==='span');assert.equal(all[0].props.style.left,'0%');assert.equal(all.at(-1).props.style.left,'100%');}
  await view.choose({provider:'saved',model:'Research',thinking:'not-configured'});assert.equal(selected.length,0);
  if(!count){await view.chooseModel('saved','Research');assert.equal(selected.length,0);}
 }
});

test('removed current reasoning returns to the configured default only after explicit model choice',async()=>{
 const {view,selected}=picker({current:{...high,thinking:'removed'}});assert.equal(find(view,e=>e.props?.type==='range').props.disabled,true);
 await view.chooseModel('saved','Research');assert.deepEqual(selected,[high]);assert.equal(view.props.current.thinking,'removed');
});

test('save is serialized, keeps the popover during its own busy refresh and closes on external locks',async()=>{
 let resolve;const {view,selected}=picker({onSelect:selection=>{selected.push(selection);return new Promise(done=>resolve=done);}});view.setState({open:true});
 const saving=view.choose(low);assert.equal(view.state.saving,true);await view.choose(other);assert.equal(selected.length,1);
 const previous=view.props;view.props={...view.props,busy:true};view.componentDidUpdate(previous);assert.equal(view.state.open,true);
 const previousBusy=view.props;view.props={...view.props,disabled:true};view.componentDidUpdate(previousBusy);assert.equal(view.state.open,false);
 resolve({id:'fixture',model:low});await saving;assert.equal(view.state.saving,false);assert.deepEqual(view.props.current,high);
});

test('undefined, thrown conflicts and wrong receipts restore the confirmed value',async()=>{
 for(const callback of [async()=>undefined,async()=>{throw Error('VERSION_CONFLICT');},async()=>({id:'other-session',model:low}),async()=>({id:'fixture',model:other})]){
  const {view}=picker({onSelect:callback});view.setState({preview:0,visual:0});await view.choose(low);
  assert.equal(view.props.current,high);assert.equal(view.state.preview,null);assert.equal(view.state.visual,null);assert.equal(view.state.saving,false);assert.ok(view.state.error);
 }
});

test('late responses cannot change a different session or an unmounted menu',async t=>{
 const previousWindow=globalThis.window;globalThis.window={removeEventListener(){}};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 for(const unmount of [false,true]){let resolve;const {view}=picker({onSelect:()=>new Promise(done=>resolve=done)}),saving=view.choose(low);
  if(unmount)view.componentWillUnmount();else {const previous=view.props;view.props={...view.props,sessionId:'new',current:other};view.componentDidUpdate(previous);}
  const before={...view.state};resolve({id:'fixture',model:low});await saving;assert.deepEqual(view.state,before);assert.equal(view.props.current,unmount?high:other);
 }
});

test('rendered handlers from another session or metadata snapshot cannot select or preview',async()=>{
 const {view,selected}=picker(),row=find(view,e=>e.props?.role==='menuitemradio'&&!e.props['aria-checked']),range=find(view,e=>e.props?.type==='range');
 const original=view.props;view.props={...original,sessionId:'next'};row.props.onClick();range.props.onChange({currentTarget:{value:'0'}});assert.equal(selected.length,0);assert.equal(view.state.preview,null);
 view.props={...original,management:management()};row.props.onClick();range.props.onChange({currentTarget:{value:'0'}});assert.equal(selected.length,0);assert.equal(view.state.preview,null);
});

test('click labels and CSS targets update immediately; real drag starts only beyond three pixels and cancels without writing',async t=>{
 const previousWindow=globalThis.window;globalThis.window={matchMedia:()=>({matches:false})};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const {view,selected}=picker();view.preview(0);assert.equal(view.state.preview,0);assert.equal(view.state.visual,0);assert.equal(find(view,e=>e.props?.className==='composer-thinking-picker').props.style['--thinking-progress'],'0%');
 view.resetPreview();const input={setPointerCapture(){},releasePointerCapture(){},getBoundingClientRect:()=>({left:0,width:236})};
 const event=x=>({pointerId:1,button:0,clientX:x,currentTarget:input});view.pointerDown(event(50));view.pointerMove(event(53));assert.equal(view.state.dragging,false);
 view.pointerMove(event(54));assert.equal(view.state.dragging,true);assert.equal(view.state.preview,0.18);assert.equal(view.state.visual,0.18);view.pointerEnd(event(54),true);assert.equal(view.state.preview,null);assert.equal(selected.length,0);
 view.pointerDown(event(50));view.pointerMove(event(190));view.pointerEnd(event(190));await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(selected,[],'drag rounds back to the already confirmed level');
});

test('keyboard commit sends a configured ID, reduced motion is immediate and Tab keeps natural focus',async t=>{
 const previousWindow=globalThis.window;globalThis.window={matchMedia:()=>({matches:true})};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const {view,selected}=picker(),range=find(view,e=>e.props?.type==='range');range.props.onChange({currentTarget:{value:'0'}});assert.equal(view.state.visual,0);
 range.props.onKeyUp({key:'ArrowLeft'});await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(selected,[low]);
 let prevented=false;view.setState({open:true});view.keys({key:'Tab',target:{tagName:'INPUT'},preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(view.state.open,true);
});

test('fast save confirmation preserves the CSS target without treating the preview as confirmed',async t=>{
 const previousWindow=globalThis.window;globalThis.window={matchMedia:()=>({matches:false})};t.after(()=>{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;});
 const {view}=picker({onSelect:async selection=>{const previous=view.props;view.props={...view.props,current:selection};view.componentDidUpdate(previous);return {id:'fixture',model:selection};}});
 view.setState({open:true});view.preview(0);assert.equal(view.props.current,high);assert.equal(view.state.visual,0);await view.commit();assert.deepEqual(view.props.current,low);assert.equal(view.state.visual,0);assert.equal(view.state.open,true);
});

test('model list replaces the strength panel and ultra uses twelve decorative particles',()=>{
 const {view}=picker(),strength=()=>find(view,e=>e.props?.className==='composer-model-strength'),models=()=>find(view,e=>e.props?.className==='composer-model-models-view');
 assert.equal(strength().props['data-expanded'],true);assert.equal(models().props['data-expanded'],false);
 find(view,e=>e.type==='button'&&e.props?.className==='composer-model-name').props.onClick();assert.equal(strength().props['data-expanded'],false);assert.equal(strength().props.inert,true);assert.equal(strength().props['aria-hidden'],true);assert.equal(models().props['data-expanded'],true);
 const stars=find(view,e=>e.props?.className==='composer-thinking-stars'),particles=elements(stars).filter(e=>e!==stars&&e.type==='span');assert.equal(particles.length,12);assert.ok(particles.every(p=>p.props.children===undefined));
});


test('saving reserves one status row and focus requests never scroll the conversation',async()=>{
 let finish;const {view}=picker({onSelect:selection=>new Promise(resolve=>finish=()=>resolve({id:'fixture',model:selection}))});
 const status=()=>find(view,node=>node.props?.className?.startsWith('composer-model-status '));const idle=status();assert.ok(idle);assert.equal(idle.props.children,'\u00a0');
 const saving=view.choose(low);assert.equal(status().type,idle.type);assert.equal(status().props.role,'status');assert.equal(status().props.children,'正在保存…');finish();await saving;assert.equal(status().type,idle.type);assert.equal(status().props.children,'\u00a0');
 const focused=[];view.position=()=>{};view.range.current={disabled:false,focus:options=>focused.push(options)};view.trigger.current={focus:options=>focused.push(options)};
 view.toggle({newState:'open'});view.keys({key:'Escape',preventDefault(){},stopPropagation(){}});assert.deepEqual(focused,[{preventScroll:true},{preventScroll:true}]);
});
