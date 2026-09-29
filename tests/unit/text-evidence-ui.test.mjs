import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {existsSync}from'node:fs';
const flatten=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(flatten).join(' '):typeof n!=='object'?String(n):typeof n.type==='function'&&!n.type.prototype?.render?flatten(n.type(n.props)):flatten(n.props?.children);
test('local evidence panel is explicit opt-in, and excludes agent generated sources',async()=>{
 assert.ok(existsSync('dist/web/assets/text-evidence.js'),'evidence UI missing');const {TextEvidencePanel}=await import('../../dist/web/assets/text-evidence.js');
 const view=synchronousState(new TextEvidencePanel({data:{project:{id:'p'},artifacts:[{id:'a',title:'Allowed.txt',mediaType:'text/plain',origin:'user'},{id:'b',title:'Untrusted.txt',mediaType:'text/plain',origin:'agent:x'}]},perform:async f=>f()}));
 const t=flatten(view.render());assert.match(t,/默认关闭/);assert.match(t,/不调用模型/);assert.match(t,/Allowed.txt/);assert.ok(!t.includes('Untrusted.txt'));
});
test('panel marks results from a replaced corpus as historical instead of fresh search',async()=>{
 assert.ok(existsSync('dist/web/assets/text-evidence.js'));const {TextEvidencePanel}=await import('../../dist/web/assets/text-evidence.js');
 const view=synchronousState(new TextEvidencePanel({data:{project:{id:'p'},artifacts:[],textEvidence:{enabled:true,version:2,sources:[]}},perform:async f=>f()}));view.state.result={configurationVersion:1,hits:[],limitations:[]};assert.match(flatten(view.render()),/集合已变更/);
});
