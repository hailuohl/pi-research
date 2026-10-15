import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const built=await build({stdin:{contents:"export {LiteratureView} from './apps/web/src/literature-view.tsx';",resolveDir:fileURLToPath(new URL('../../',import.meta.url)),loader:'ts'},bundle:true,write:false,format:'cjs',platform:'node',packages:'external',jsx:'automatic',logLevel:'silent'});
const module={exports:{}};
new Function('require','module','exports',built.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const {LiteratureView}=module.exports;
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):!node||typeof node!=='object'?[]:[node,...nodes(node.props?.children)];
const raw='a'.repeat(64),png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ZcAAAAASUVORK5CYII=','base64'),imageDigest=createHash('sha256').update(png).digest('hex');
const document={id:'fixed-doc',title:'Public PDF',contentKind:'original-pdf',original:{artifactId:'pdf',digest:raw},source:{},license:{},limitations:[]};
const location={documentVersionId:document.id,parseResultId:'fixed-parse',pageNumber:2,start:1187,end:1631};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function mountedState(view,element){
 const commit=()=>{for(const node of nodes(view.render()))if(node.props?.ref&&typeof node.props.ref==='object')node.props.ref.current=element;};
 view.setState=(update,callback)=>{const previous={...view.state},value=typeof update==='function'?update(view.state,view.props):update;if(value)Object.assign(view.state,value);commit();view.componentDidUpdate?.(view.props,previous);callback?.();};
 commit();return view;
}
function fixture(t){
 const previousFetch=globalThis.fetch,previousDocument=globalThis.document,requests=[],pending=[],scrolls=[],reads=[];
 t.after(()=>{globalThis.fetch=previousFetch;globalThis.document=previousDocument;});
 globalThis.document={getElementById(){throw Error('A jump must not resolve a global duplicate ID');}};
 const json=value=>({ok:true,json:async()=>value});
 globalThis.fetch=async(url,options)=>{
  if(url.includes('/connectors'))return json({enabled:{crossref:true}});
  if(url.endsWith('/document_inspect'))return json(document);
  if(url.includes('/artifacts/'))return {ok:true,blob:async()=>new Blob([png])};
  const input=JSON.parse(options.body).input;requests.push({url,input,signal:options.signal});
  if(url.endsWith('/document_pages'))return json({resultId:'fixed-parse',documentVersionId:document.id,rawDigest:raw,items:[{pageNumber:input.cursor+1},{pageNumber:2},{pageNumber:3}],pageCount:3,cursor:0,end:3,complete:true,quality:{ocr:false}});
  return new Promise(resolve=>pending.push({input,signal:options.signal,resolve:(content='x'.repeat(444))=>resolve(json({resultId:'fixed-parse',documentVersionId:document.id,rawDigest:raw,pageNumber:input.pageNumber,cursor:input.cursor,end:input.cursor+content.length,content,complete:true,imageArtifactId:'page-png',imageArtifactDigest:imageDigest,textArtifactDigest:'b'.repeat(64),paragraphs:[],textStatus:'text-extracted'}))}));
 };
 const data={project:{id:'p'},documents:[document],documentParseJobs:[],artifacts:[],evidence:[],claims:[],approvals:[]};
 const view=mountedState(new LiteratureView({readOnly:true,embedded:true,data,selectedDocument:location,perform:async fn=>fn()}));
 const element={scrollIntoView(options){scrolls.push({options,page:pages.state.page.pageNumber,base:pages.state.base,end:pages.state.cursor,image:pages.state.imageURL});}};
 let pages;
 const mountPages=()=>{const paneNode=nodes(view.render()).find(n=>n.type?.name==='DocumentPane'),pane=mountedState(new paneNode.type(paneNode.props)),pageNode=nodes(pane.render()).find(n=>n.type?.name==='DocumentPages');pages=mountedState(new pageNode.type(pageNode.props),element);const read=pages.readPage.bind(pages);pages.readPage=(...args)=>{const promise=read(...args);reads.push(promise);return promise;};pages.componentDidMount();return pages;};
 t.after(()=>{pages?.componentWillUnmount();view.componentWillUnmount();});
 return {view,mountPages,pending,requests,scrolls,reads};
}

test('initial evidence location mounts the exact page and scrolls its own rendered window once',async t=>{
 const f=fixture(t);f.view.componentDidMount();await flush();const pages=f.mountPages();await flush();
 assert.equal(f.scrolls.length,0,'pending text must not scroll');f.pending[0].resolve();await f.reads[0];
 assert.equal(f.scrolls.length,1,'initial selectedDocument must scroll after the page window is ready');
 assert.equal(f.scrolls[0].page,2);assert.equal(f.scrolls[0].base,1187);assert.equal(f.scrolls[0].end,1631);assert.ok(f.scrolls[0].image);
 pages.componentDidUpdate(pages.props);f.view.props={...f.view.props,data:{...f.view.props.data}};f.view.componentDidUpdate(f.view.props);assert.equal(f.scrolls.length,1,'ordinary polling must preserve reading position');
});

test('same-document page and interval changes seek and scroll only their current rendered target',async t=>{
 const f=fixture(t);f.view.state.document=document;const pages=f.mountPages();await flush();f.pending[0].resolve();await f.reads[0];
 const previous=pages.props;pages.props={...previous,pageNumber:3,start:10,end:20};pages.componentDidUpdate(previous);await flush();
 assert.equal(f.scrolls.length,1,'previous page must not scroll for the new target');f.pending[1].resolve('0123456789');await f.reads[1];
 assert.equal(f.scrolls.length,2);assert.deepEqual([f.scrolls[1].page,f.scrolls[1].base,f.scrolls[1].end],[3,10,20]);
 const old=pages.props;pages.props={...old,start:30,end:40};pages.componentDidUpdate(old);await flush();f.pending[2].resolve('abcdefghij');await f.reads[2];
 assert.equal(f.scrolls.length,3);assert.deepEqual([f.scrolls[2].page,f.scrolls[2].base,f.scrolls[2].end],[3,30,40]);
});

test('a replaced page request cannot scroll after its late response, and incomplete citations wait',async t=>{
 const f=fixture(t);f.view.state.document=document;const pages=f.mountPages();await flush();
 const previous=pages.props;pages.props={...previous,start:2000,end:2010};pages.componentDidUpdate(previous);await flush();assert.equal(f.pending[0].signal.aborted,true);
 f.pending[1].resolve('short');await f.reads[1];assert.equal(f.scrolls.length,0,'citation beyond the loaded window must not scroll');
 f.pending[0].resolve();await f.reads[0];assert.equal(f.scrolls.length,0,'old response must not scroll the new target');assert.equal(pages.state.base,2000);
 const next=pages.readPage();f.pending[2].resolve('1234567890');await next;assert.equal(f.scrolls.length,1);assert.equal(f.scrolls[0].base,2000);
});

test('end-only target changes wait for queued state commits instead of scrolling the old window',async t=>{
 const f=fixture(t);f.view.state.document=document;const pages=f.mountPages();await flush();f.pending[0].resolve();await f.reads[0];
 const commit=pages.setState,queued=[];pages.setState=(update,callback)=>queued.push({update,callback});
 for(const [index,end]of [1200,undefined].entries()){
  const previous=pages.props;pages.props={...previous,end};pages.componentDidUpdate(previous);
  assert.equal(f.scrolls.length,index+1,'the old committed page must not consume the new jump');
  while(queued.length){const {update,callback}=queued.shift();commit(update,callback);}
  if(end===undefined){await f.reads[index+1];while(queued.length){const {update,callback}=queued.shift();commit(update,callback);}assert.equal(f.scrolls.length,index+1);assert.match(pages.state.error,/证据引用区间无效/);continue;}
  f.pending[index+1].resolve();await f.reads[index+1];
  assert.equal(f.scrolls.length,index+1,'new data must not scroll before React commits it');
  while(queued.length){const {update,callback}=queued.shift();commit(update,callback);}
  assert.equal(f.scrolls.length,index+2,'the newly committed exact window scrolls once');
  assert.equal(pages.state.end,end??1631);
 }
});
