import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const vendor={};vm.runInNewContext(readFileSync('apps/web/public/vendor/react.production.min.js','utf8'),vendor);globalThis.React=vendor.React;
const {PublicationView,publicationSourcePath,publicationLineRange,publicationBase64}=await import('../../dist/web/assets/publication-view.js');
const digest='a'.repeat(64),revision={id:'revision',title:'Fixed manuscript',engine:'pdflatex',mainFile:'main.tex',bibliography:'none',sourceDigest:digest,manifestArtifactId:'source-manifest',files:[{path:'main.tex',artifactId:'source',digest,mediaType:'text/plain',provenance:{kind:'unknown'}}]};
const job={id:'build',revisionId:'revision',sourceDigest:digest,manifestDigest:digest,approvalId:'approval',state:'prepared',integrity:'pending',resources:{cpus:1},engine:'pdflatex',mainFile:'main.tex',bibliography:'none'};
const sync=v=>{v.setState=(patch,callback)=>{Object.assign(v.state,typeof patch==='function'?patch(v.state,v.props):patch);callback?.();};return v;};
function view(){return sync(new PublicationView({data:{project:{id:'project'},artifacts:[],approvals:[]},perform:async f=>f()}));}
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props.children);
function nodes(node,out=[]){if(node==null||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),out);else nodes(node.props.children,out);return out;}
test('publication paths and source line selection reject traversal and preserve unicode bytes',()=>{
 for(const path of ['../secret.tex','/etc/passwd.tex','https://x/a.tex','a/../b.tex','a\\b.tex','a//b.tex'])assert.equal(publicationSourcePath(path),false,path);
 assert.equal(publicationSourcePath('sections/method.tex'),true);assert.equal(publicationSourcePath('references.bst'),true);
 assert.deepEqual(publicationLineRange('首行\n🙂 line\nlast',2),{start:3,end:10});assert.equal(publicationLineRange('line',2),null);assert.equal(publicationLineRange('line',0),null);
 assert.equal(Buffer.from(publicationBase64('中文🙂'),'base64').toString('utf8'),'中文🙂');
});
test('React16 publication UI preserves separate prepare, approval and submit and safe diagnostics',()=>{
 const v=view();v.state.revision=revision;v.state.job=job;v.state.jobs=[job];v.props.data.approvals=[{id:'approval',status:'pending',version:1}];
 v.state.result={id:'result',jobId:'build',diagnostics:[{severity:'error',code:'MISSING',message:'<script>unsafe</script>',file:'../secret.tex',line:3},{severity:'error',code:'TEX',message:'bad control',file:'main.tex',line:2},{severity:'warning',code:'UNKNOWN',message:'unknown source',file:null,line:null}],status:'failed',converged:false,hadErrors:true,pdf:null,previews:[],logs:[]};
 const tree=v.render(),all=nodes(tree),text=flatten(tree);assert.match(text,/批准此固定文稿构建/);assert.doesNotMatch(text,/提交已批准文稿构建/);assert.match(text,/行号未知/);assert.equal(all.filter(n=>n.type==='button'&&flatten(n).startsWith('定位 ')).length,1);assert.ok(all.every(n=>!n.props.dangerouslySetInnerHTML&&!n.props.href));
 v.props.data.approvals[0].status='approved';assert.match(flatten(v.render()),/提交已批准文稿构建/);assert.doesNotMatch(flatten(v.render()),/批准此固定文稿构建/);
 const editorNode=all.find(n=>n.type?.name==='ManuscriptEditor'),editor=sync(new editorNode.type(editorNode.props));nodes(editor.render());v.componentWillUnmount();
});
test('freezing serializes UTF8 text and asset bindings into immutable revision input',async()=>{
 const v=view(),requests=[];v.call=async(name,input)=>{requests.push({name,input});return revision;};v.openRevision=async()=>{};
 await v.freeze({title:'paper',engine:'xelatex',mainFile:'main.tex',bibliography:'bibtex',files:[{path:'main.tex',content:'中文🙂'}],assets:[{path:'figure.png',artifactId:'archived-plot'}]});
 assert.deepEqual(requests[0],{name:'manuscript_create',input:{title:'paper',engine:'xelatex',mainFile:'main.tex',bibliography:'bibtex',files:[{path:'main.tex',contentBase64:Buffer.from('中文🙂').toString('base64')},{path:'figure.png',artifactId:'archived-plot'}]}});v.componentWillUnmount();
});
test('source clone reads all chunks, preserves assets, and does not freeze a truncated source',async()=>{
 const v=view();v.state.revision={...revision,files:[...revision.files,{path:'figure.png',artifactId:'plot',digest,mediaType:'image/png',provenance:{kind:'unknown'}}]};const requests=[];
 v.call=async(name,input)=>{requests.push(input);return {path:'main.tex',digest,cursor:input.cursor,end:input.cursor+3,content:input.cursor===0?'one':'two',complete:input.cursor!==0};};
 await v.editRevision();assert.equal(v.state.seed.files[0].content,'onetwo');assert.deepEqual(v.state.seed.assets,[{path:'figure.png',artifactId:'plot'}]);assert.deepEqual(requests.map(r=>r.cursor),[0,3]);
 v.state.seed=undefined;v.call=async()=>({path:'main.tex',digest,cursor:0,end:0,content:'',complete:false});await v.editRevision();assert.equal(v.state.seed,undefined);assert.match(v.state.error,/窗口或摘要不匹配/);v.componentWillUnmount();
});
test('late revision and source responses cannot replace a newer selection',async()=>{
 const v=view(),pending=[];v.call=(name,input)=>name==='publication_build_list'?Promise.resolve({items:[],nextCursor:null}):new Promise(resolve=>pending.push({name,input,resolve}));
 const first=v.openRevision('old'),second=v.openRevision('new');pending.find(p=>p.input.revisionId==='new').resolve({...revision,id:'new'});await new Promise(resolve=>setImmediate(resolve));pending.find(p=>p.name==='manuscript_source_read').resolve({path:'main.tex',digest,cursor:0,end:3,content:'new',complete:true});await second;pending.find(p=>p.input.revisionId==='old').resolve({...revision,id:'old'});await first;
 assert.equal(v.state.revision.id,'new');assert.equal(v.state.source,'new');v.componentWillUnmount();
});
test('build result binding mismatch suppresses preview and polling has a finite bound',async()=>{
 const v=view();v.state.revision=revision;v.call=async name=>name==='publication_inspect'?{...job,state:'succeeded',resultId:'result'}:{id:'result',jobId:'other',revisionId:'revision',sourceDigest:digest,manifestDigest:digest};
 await v.openJob('build');assert.equal(v.state.result,null);assert.match(v.state.error,/构建结果绑定/);
 v.call=async()=>({...job,state:'running'});v.polls=40;await v.refreshJob('build');assert.equal(v.state.pollStopped,true);assert.equal(v.polls,41);v.componentWillUnmount();
});
test('page preview verifies authenticated PNG content and never mounts failed-build PDF',()=>{
 const v=view();v.state.revision=revision;v.state.job=job;v.state.result={id:'result',diagnostics:[],status:'failed',hadErrors:true,converged:false,pdf:{artifactId:'bad-pdf'},previews:[],logs:[]};const element=nodes(v.render()).find(n=>n.type?.name==='PublicationPreview'),preview=sync(new element.type(element.props));const all=nodes(preview.render());assert.ok(all.every(n=>n.type!=='iframe'&&n.type!=='object'&&n.type!=='embed'));assert.doesNotMatch(flatten(preview.render()),/下载固定 PDF/);preview.componentWillUnmount();v.componentWillUnmount();
});
test('diagnostic navigation selects only a known text file and the exact line range',async()=>{
 const v=view();v.state.revision=revision;let selected,focused=false,requests=0;v.sourceElement={focus(){focused=true;},setSelectionRange(start,end){selected={start,end};},scrollTop:0};
 v.call=async()=>{requests++;return {path:'main.tex',digest,cursor:0,end:7,content:'one\ntwo',complete:true};};
 await v.readSource('main.tex',2);assert.equal(focused,true);assert.deepEqual(selected,{start:4,end:7});await v.readSource('../secret.tex',1);assert.equal(requests,1);assert.equal(v.state.sourceComplete,false);assert.match(v.state.error,/不属于当前文稿/);v.componentWillUnmount();
});
test('source approval changes recheck only the selected build, preserve source position, and label historical PDFs',async()=>{
 const v=view(),requests=[];v.state.revision=revision;v.state.job={...job,state:'succeeded',integrity:'complete',resultId:'result'};v.state.source='kept source';v.state.sourcePath='main.tex';v.state.sourceLine=7;v.state.sourceComplete=true;v.props.data.approvals=[{id:'approval',version:1,status:'approved'}];
 const result={id:'result',jobId:'build',revisionId:'revision',sourceDigest:digest,manifestDigest:digest,status:'succeeded',converged:true,hadErrors:false,pdf:{artifactId:'pdf'},previews:[],logs:[],diagnostics:[],sourceValidity:'current'};v.state.result=result;
 v.call=async(name)=>{requests.push(name);return name==='publication_inspect'?v.state.job:{...result,sourceValidity:'stale',sourceError:'APPROVAL_REVOKED'};};
 const previous=v.props;v.props={...previous,data:{...previous.data,approvals:[{id:'approval',version:2,status:'revoked'}]}};v.componentDidUpdate(previous);assert.equal(v.state.sourceChecking,true);await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(requests,['publication_inspect','publication_result']);assert.equal(v.state.source,'kept source');assert.equal(v.state.sourceLine,7);assert.equal(v.state.job.id,'build');assert.match(flatten(v.render()),/历史构建，当前来源失效/);assert.match(flatten(v.render()),/APPROVAL_REVOKED/);
 const previewNode=nodes(v.render()).find(n=>n.type?.name==='PublicationPreview'),preview=sync(new previewNode.type(previewNode.props));assert.match(flatten(preview.render()),/下载固定 PDF/);
 const same=v.props;v.props={...same,data:{...same.data,approvals:[...same.data.approvals,{id:'unrelated',version:1,status:'approved'}],artifacts:[...same.data.artifacts]}};v.componentDidUpdate(same);assert.equal(requests.length,2);preview.componentWillUnmount();v.componentWillUnmount();
});
test('late source validity checks cannot replace a newer check or job selection',async()=>{
 const v=view(),pending=[];v.state.revision=revision;v.state.job={...job,state:'succeeded',integrity:'complete',resultId:'result'};
 v.call=async name=>name==='publication_inspect'?v.state.job:new Promise(resolve=>pending.push(resolve));
 const first=v.refreshJob('build');await new Promise(resolve=>setImmediate(resolve));const second=v.refreshJob('build');await new Promise(resolve=>setImmediate(resolve));
 const result={id:'result',jobId:'build',revisionId:'revision',sourceDigest:digest,manifestDigest:digest,sourceValidity:'stale'};pending[1](result);await second;pending[0]({...result,sourceValidity:'current'});await first;assert.equal(v.state.result.sourceValidity,'stale');
 const old=v.refreshJob('build');await new Promise(resolve=>setImmediate(resolve));v.jobEpoch++;v.state.job={...job,id:'new-job'};v.state.result=null;pending[2](result);await old;assert.equal(v.state.job.id,'new-job');assert.equal(v.state.result,null);v.componentWillUnmount();
});
