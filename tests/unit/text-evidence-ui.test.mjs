import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {existsSync}from'node:fs';
const flatten=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(flatten).join(' '):typeof n!=='object'?String(n):typeof n.type==='function'&&!n.type.prototype?.render?flatten(n.type(n.props)):flatten(n.props?.children);
const find=(n,p)=>n==null||typeof n!=='object'?null:Array.isArray(n)?n.map(v=>find(v,p)).find(Boolean):p(n)?n:find(n.props?.children,p);
test('local evidence panel is explicit opt-in, and excludes agent generated sources',async()=>{
 assert.ok(existsSync('dist/web/assets/text-evidence.js'),'evidence UI missing');const {TextEvidencePanel}=await import('../../dist/web/assets/text-evidence.js');
 const view=synchronousState(new TextEvidencePanel({data:{project:{id:'p'},artifacts:[{id:'a',title:'Allowed.txt',mediaType:'text/plain',origin:'user'},{id:'b',title:'Untrusted.txt',mediaType:'text/plain',origin:'agent:x'}]},perform:async f=>f()}));
 const t=flatten(view.render());assert.match(t,/默认关闭/);assert.match(t,/不调用模型/);assert.match(t,/Allowed.txt/);assert.ok(!t.includes('Untrusted.txt'));
});
test('panel marks results from a replaced corpus as historical instead of fresh search',async()=>{
 assert.ok(existsSync('dist/web/assets/text-evidence.js'));const {TextEvidencePanel}=await import('../../dist/web/assets/text-evidence.js');
 const view=synchronousState(new TextEvidencePanel({data:{project:{id:'p'},artifacts:[],textEvidence:{enabled:true,version:2,sources:[]}},perform:async f=>f()}));view.state.result={configurationVersion:1,hits:[],limitations:[]};assert.match(flatten(view.render()),/集合已变更/);
});
test('fixed PDF hit returns to the exact archived page, and old results survive a closed corpus view',async()=>{
 const {TextEvidencePanel}=await import('../../dist/web/assets/text-evidence.js');let target;
 const document={documentVersionId:'doc-1',parseResultId:'parse-1',rawDigest:'raw',pageNumber:5,textArtifactDigest:'page'};
 const result={id:'search-1',query:'fixed acidity alcohol',configurationVersion:1,status:'matches',coverage:{sourceCount:1,totalChunks:17,matchingChunks:1,exactDuplicatesGrouped:0,resultsTruncated:false},hits:[{chunkId:'chunk-1',title:'paper.pdf',sourceKind:'document_page',page:5,document,locator:{start:223,end:236},quote:'fixed acidity',evidenceId:'ev-1',digest:'page'}],limitations:[]};
 const data={project:{id:'p'},artifacts:[],documents:[{id:'doc-1',title:'paper.pdf',contentKind:'original-pdf'}],documentParseJobs:[{documentVersionId:'doc-1',resultId:'parse-1',state:'succeeded',integrity:'complete'}],textEvidence:{enabled:false,version:2,sources:[],documents:[{documentVersionId:'doc-1',parseResultId:'parse-1',title:'paper.pdf',pageCount:17}]},textEvidenceSearches:[result]};
 const view=synchronousState(new TextEvidencePanel({data,perform:async f=>f(),onDocument:value=>{target=value;}}));
 const tree=view.render();assert.match(flatten(tree),/历史检索/);assert.match(flatten(tree),/集合已变更/);assert.match(flatten(tree),/固定 PDF 物理第 5 页/);
 find(tree,n=>n.type==='button'&&flatten(n.props.children).includes('返回固定 PDF 原页')).props.onClick();
 assert.deepEqual(target,{documentVersionId:'doc-1',parseResultId:'parse-1',pageNumber:5,start:223,end:236});
});
