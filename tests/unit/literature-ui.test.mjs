import * as React from 'react';
import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {LiteratureView,literatureSourceURL,literatureRequestedVersion,verifiedPageImage}=await import('../../dist/web/assets/literature-view.js');
const raw='a'.repeat(64),document={id:'doc-v2',title:'Fixed PDF',contentKind:'original-pdf',acquiredAt:'2026-09-28T00:00:00Z',original:{artifactId:'raw-pdf',digest:raw,size:100,mediaType:'application/pdf'},source:{kind:'connector',provider:'alphaxiv',requestedId:'2401.00001v2',requestedVersion:'2',reportedVersion:null,versionAssurance:'requested-address-unverified'},license:{value:null,assurance:'unknown'},limitations:['Not a scientific validation']};
const sync=v=>{synchronousState(v);return v;};
function view(){return sync(synchronousState(new LiteratureView({data:{project:{id:'project'},literatureTasks:[],documents:[],documentParseJobs:[],artifacts:[],evidence:[],claims:[],approvals:[]},perform:async f=>f(),selectedDocument:{documentVersionId:'doc-v2',parseResultId:'parse-v2',pageNumber:2},onDocument(){}})));}
function nodes(node,out=[]){if(node==null||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function','React element type must be valid');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),out);else nodes(node.props.children,out);return out;}
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props.children);
function pages(){const v=view();v.state.document=document;const paneNode=nodes(v.render()).find(n=>n.type?.name==='DocumentPane'),pane=sync(new paneNode.type(paneNode.props)),pageNode=nodes(pane.render()).find(n=>n.type?.name==='DocumentPages');return sync(new pageNode.type(pageNode.props));}

test('React literature UI shows source errors distinctly and never links unsafe provider URLs',()=>{
 assert.equal(React.Fragment,Symbol.for('react.fragment'));assert.equal(literatureSourceURL('javascript:alert(1)'),undefined);assert.equal(literatureSourceURL('https://u:p@example.com'),undefined);
 const v=view();v.props.data.literatureTasks=[{id:'task',kindOfTask:'search',request:{kind:'search',search:{query:'paper'}},state:'failed',phase:'done',error:{code:'CONNECTOR_FAILED',message:'PubMed unreachable'}}];
 const tree=v.render();nodes(tree);assert.match(flatten(tree),/PubMed unreachable/);assert.match(flatten(tree),/失败不会写成零结果/);
 v.state.result={query:'fixed',sources:[{source:'pubmed',status:'failed',count:0,error:'NETWORK_UNAVAILABLE'}],items:[{source:'crossref',id:'doi',title:'<script>title</script>',url:'javascript:alert(1)'}]};
 assert.ok(nodes(v.render()).every(n=>!n.props.dangerouslySetInnerHTML&&n.props.href!=='javascript:alert(1)'));
});

test('a completed search task reads its durable result without depending on last-30 history',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view(),search={id:'old-search',query:'preserved',items:[],sources:[]};
 globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({id:'task',resultSearchId:'old-search',searchResult:search})};};
 await v.inspectTask({id:'task'});assert.equal(requests.length,1);assert.ok(requests[0].url.endsWith('/literature_task_inspect'));assert.equal(v.state.result.id,'old-search');
});

test('Crossref next-page control submits only the fixed previous result ID and avoids duplicate tasks',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[],v=view();
 v.state.config={enabled:{crossref:true}};
 v.state.result={id:'page-1',query:'wine quality',status:'complete',sources:[{source:'crossref',status:'succeeded',count:5}],items:[],
  page:{number:1,previousSearchId:null,nextCursor:'opaque-from-server',nextCursorExpiresAt:new Date(Date.now()+60000).toISOString(),rawItemCount:5}};
 globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({id:'task-2'})};};
 let tree=v.render(),next=nodes(tree).find(n=>n.type==='button'&&flatten(n)==='显式获取下一页');
 assert.equal(next.props.disabled,false);next.props.onClick();await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(requests[0].body,{projectId:'project',input:{kind:'search',previousSearchId:'page-1'}});
 v.props.data.literatureTasks=[{id:'task-2',kindOfTask:'search',request:{kind:'search',search:{query:'wine quality'},pageRequest:{number:2,previousSearchId:'page-1'}},state:'queued',phase:'queued'}];
 tree=v.render();next=nodes(tree).find(n=>n.type==='button'&&flatten(n)==='显式获取下一页');
 assert.equal(next.props.disabled,true);assert.match(flatten(tree),/第 2 页/);
 v.props.data.literatureTasks=[];v.state.config.enabled.crossref=false;
 assert.equal(nodes(v.render()).find(n=>n.type==='button'&&flatten(n)==='显式获取下一页').props.disabled,true);
});

test('page images require both PNG magic and the bound digest before producing a display blob',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ZcAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex');
 assert.equal((await verifiedPageImage(new Blob([png]),hash)).type,'image/png');
 await assert.rejects(verifiedPageImage(new Blob([png]),'0'.repeat(64)),/摘要不匹配/);
 await assert.rejects(verifiedPageImage(new Blob(['<script>PDF is not a page image</script>']),hash),/PNG/);
});

test('page reads reject a different raw version and page evidence includes exact version/result/UTF16 positions',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const v=pages();
 globalThis.fetch=async()=>({ok:true,json:async()=>({resultId:'parse-v2',documentVersionId:'doc-v2',rawDigest:'wrong',pageNumber:2})});
 await v.readPage();assert.equal(v.state.page,null);assert.match(v.state.error,/不属于所选固定原件/);
 const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:true,json:async()=>({id:'evidence'})};};
 Object.assign(v.state,{page:{pageNumber:2,pageLabel:null,textArtifactDigest:'b'.repeat(64),paragraphs:[],textStatus:'text-extracted'},content:'a🙂字',cursor:4,complete:true,loading:false,error:'',start:1,end:3,description:'Exact emoji range'});
 const form=nodes(v.render()).find(n=>n.type==='form');form.props.onSubmit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(requests[0].body,{projectId:'project',input:{documentVersionId:'doc-v2',parseResultId:'parse-v2',pageNumber:2,start:1,end:3,description:'Exact emoji range'}});
 v.componentWillUnmount();
});


test('task version labels prefer the explicit request and recognize only alphaXiv address versions',()=>{
 assert.equal(literatureRequestedVersion({source:'alphaxiv',id:'1706.03762v1'}),'地址指定 v1');
 assert.equal(literatureRequestedVersion({source:'alphaxiv',id:'1706.03762v1',requestedVersion:'v2'}),'请求版本 v2');
 assert.equal(literatureRequestedVersion({source:'alphaxiv',id:'1706.03762'}),'未指定版本');
 assert.equal(literatureRequestedVersion({source:'crossref',id:'10.1234/examplev2'}),'未指定版本');
});

test('non-PDF previews prefer derived text while original downloads remain separate',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const requests=[];
 globalThis.fetch=async url=>{requests.push(url);return {ok:true,text:async()=> 'Reconstructed abstract'};};
 const v=view();v.state.document={...document,contentKind:'abstract',original:{...document.original,artifactId:'raw-json',mediaType:'application/json'},derivedText:{artifactId:'derived-text',digest:'b'.repeat(64),size:22,mediaType:'text/plain'}};
 const element=nodes(v.render()).find(n=>n.type?.name==='DocumentPane'),pane=sync(new element.type(element.props));
 let tree=pane.render();assert.match(flatten(tree),/下载固定原始文件/);assert.match(flatten(tree),/单独下载派生文本/);
 const preview=nodes(tree).find(n=>n.type==='button'&&flatten(n).includes('无 PDF 页映射'));
 await preview.props.onClick();assert.deepEqual(requests,['/api/artifacts/derived-text/content']);assert.equal(pane.state.text,'Reconstructed abstract');
 pane.props={...pane.props,document:{...pane.props.document,derivedText:undefined}};tree=pane.render();
 await nodes(tree).find(n=>n.type==='button'&&flatten(n).includes('无 PDF 页映射')).props.onClick();
 assert.equal(requests[1],'/api/artifacts/raw-json/content');
 assert.ok(!flatten(tree).includes('单独下载派生文本'));
});

test('evidence jumps preserve UTF16 range and page 25 restores the containing list with a bounded text seek',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);
 const {EvidenceView}=await import('../../dist/web/assets/data-views.js');let location;
 const evidence={id:'ev',type:'document',description:'Quoted span',quote:'引用🙂段落',artifactId:'text',locator:{start:17020,end:17026},document:{documentVersionId:'doc-v2',parseResultId:'parse-v2',pageNumber:25,rawDigest:raw,textArtifactDigest:'b'.repeat(64)}};
 const e=synchronousState(new EvidenceView({data:{project:{id:'project'},artifacts:[],claims:[],evidence:[evidence]},perform:async f=>f(),onDocument:value=>{location=value;}}));
 nodes(e.render()).find(n=>n.type==='button'&&flatten(n).includes('回查固定文档页')).props.onClick();
 assert.deepEqual(location,{documentVersionId:'doc-v2',parseResultId:'parse-v2',pageNumber:25,start:17020,end:17026});
 const v=pages();v.props={...v.props,pageNumber:25,start:location.start,end:location.end};
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ZcAAAAASUVORK5CYII=','base64'),hash=createHash('sha256').update(png).digest('hex'),requests=[];
 globalThis.fetch=async(url,options)=>{if(url.includes('/artifacts/'))return {ok:true,blob:async()=>new Blob([png])};const input=JSON.parse(options.body).input;requests.push({url,input});return {ok:true,json:async()=>url.endsWith('/document_pages')?{resultId:'parse-v2',documentVersionId:'doc-v2',rawDigest:raw,pageCount:30,items:[{pageNumber:25,pageLabel:'25'}],cursor:20,end:30,complete:true,quality:{readingOrder:'unverified',paragraphs:'heuristic',tables:'unknown',figures:'unknown',ocr:false},versionAssurance:'unverified'}:{resultId:'parse-v2',documentVersionId:'doc-v2',rawDigest:raw,pageNumber:25,pageLabel:'25',content:'引用🙂段落'+'x'.repeat(15994),cursor:input.cursor,end:input.cursor+16000,complete:false,imageArtifactId:'png',imageArtifactDigest:hash,textArtifactDigest:'b'.repeat(64),paragraphs:[],textStatus:'text-extracted'}};};
 await v.loadList();await v.readPage();assert.equal(requests[0].input.cursor,20);assert.equal(requests[1].input.cursor,17020);assert.equal(requests[1].input.limit,16000);
 assert.equal(v.state.base,17020);assert.equal(v.state.start,17020);assert.equal(v.state.end,17026);assert.equal(v.state.content.length,16000);
 const tree=v.render();assert.equal(nodes(tree).find(n=>n.type==='select'&&n.props['aria-label']==='固定物理页').props.value,25);
 assert.equal(flatten(nodes(tree).find(n=>n.type==='blockquote')),'引用🙂段落');assert.match(flatten(tree),/本窗口不包含此前原文/);v.componentWillUnmount();
});

test('a late page-range response cannot replace a newly selected evidence interval',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[],v=pages();
 v.props={...v.props,start:17000,end:17006};
 globalThis.fetch=(url,options)=>{if(url.includes('/artifacts/'))return Promise.resolve({ok:false,status:404});return new Promise(resolve=>pending.push({input:JSON.parse(options.body).input,signal:options.signal,resolve}));};
 const first=v.readPage(),previous=v.props;v.props={...previous,start:22000,end:22006};v.componentDidUpdate(previous);
 assert.equal(pending[0].signal.aborted,true);assert.equal(pending[1].input.cursor,22000);
 const reply=(item,content)=>item.resolve({ok:true,json:async()=>({resultId:'parse-v2',documentVersionId:'doc-v2',rawDigest:raw,pageNumber:2,content,cursor:item.input.cursor,end:item.input.cursor+content.length,complete:true,imageArtifactId:'png',imageArtifactDigest:'b'.repeat(64),paragraphs:[],textStatus:'text-extracted'})});
 reply(pending[1],'latest');await new Promise(resolve=>setImmediate(resolve));reply(pending[0],'stale!');await first;
 assert.equal(v.state.content,'latest');assert.equal(v.state.base,22000);assert.equal(v.state.start,22000);assert.equal(v.state.end,22006);v.componentWillUnmount();
});
