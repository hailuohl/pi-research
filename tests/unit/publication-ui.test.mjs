import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {PublicationView,publicationSourcePath,publicationLineRange,publicationBase64}=await import('../../dist/web/assets/publication-view.js');
const digest='a'.repeat(64),revision={id:'revision',title:'Fixed manuscript',engine:'pdflatex',mainFile:'main.tex',bibliography:'none',sourceDigest:digest,manifestArtifactId:'source-manifest',files:[{path:'main.tex',artifactId:'source',digest,mediaType:'text/plain',provenance:{kind:'unknown'}}]};
const job={id:'build',revisionId:'revision',sourceDigest:digest,manifestDigest:digest,approvalId:'approval',state:'prepared',integrity:'pending',resources:{cpus:1},engine:'pdflatex',mainFile:'main.tex',bibliography:'none'};
const sync=v=>{synchronousState(v);return v;};
function view(){return sync(synchronousState(new PublicationView({data:{project:{id:'project'},artifacts:[],approvals:[]},perform:async f=>f()})));}
test('fixed report return survives deferred React revision and build commits',async()=>{
 const v=view(),commit=v.setState.bind(v),result={id:'result',jobId:'build',revisionId:'revision',sourceDigest:digest,manifestDigest:digest,status:'succeeded',converged:true,hadErrors:false,pdf:{artifactId:'pdf'},previews:[],logs:[],diagnostics:[],sourceValidity:'current'};
 v.setState=(update,callback)=>{const patch=typeof update==='function'?update(v.state,v.props):update;if(patch?.revision?.id||patch?.job?.id)setImmediate(()=>commit(patch,callback));else commit(patch,callback);};
 v.call=async(name)=>name==='manuscript_inspect'?revision:name==='publication_build_list'?{items:[job],nextCursor:null}:name==='manuscript_source_read'?{path:'main.tex',digest,cursor:0,end:3,content:'tex',complete:true}:name==='publication_inspect'?{...job,state:'succeeded',integrity:'complete',resultId:'result'}:name==='publication_result'?result:assert.fail(name);
 try{await v.openFixed('revision','build','review');assert.equal(v.state.revision?.id,'revision');assert.equal(v.state.job?.id,'build');assert.equal(v.state.result?.id,'result');assert.equal(v.state.selectedReviewId,'review');assert.equal(v.state.source,'tex');}finally{v.componentWillUnmount();}
});
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):typeof node.type==='function'&&!node.type.prototype?.render?flatten(node.type(node.props)):flatten(node.props.children);
function nodes(node,out=[]){if(node==null||typeof node!=='object')return out;if(Array.isArray(node)){node.forEach(n=>nodes(n,out));return out;}assert.ok(typeof node.type==='string'||typeof node.type==='function');out.push(node);if(typeof node.type==='function'&&!node.type.prototype?.render)nodes(node.type(node.props),out);else nodes(node.props.children,out);return out;}
test('publication paths and source line selection reject traversal and preserve unicode bytes',()=>{
 for(const path of ['../secret.tex','/etc/passwd.tex','https://x/a.tex','a/../b.tex','a\\b.tex','a//b.tex','AGENTS.tex','nul.tex','sections./a.tex','sections /a.tex'])assert.equal(publicationSourcePath(path),false,path);
 assert.equal(publicationSourcePath('sections/method.tex'),true);assert.equal(publicationSourcePath('references.bst'),true);
 assert.deepEqual(publicationLineRange('首行\n🙂 line\nlast',2),{start:3,end:10});assert.equal(publicationLineRange('line',2),null);assert.equal(publicationLineRange('line',0),null);
 assert.equal(Buffer.from(publicationBase64('中文🙂'),'base64').toString('utf8'),'中文🙂');
});

function editor(){const v=view(),element=nodes(v.render()).find(n=>n.type?.name==='ManuscriptEditor'),e=sync(new element.type({...element.props,data:{...element.props.data,artifacts:[{id:'writer-tex',projectId:'project',digest,size:32,title:'main.tex',mediaType:'text/plain',origin:'agent:writer',taskId:'writer-task'}]}}));e.state.assetId='writer-tex';return e;}
const textPart={artifactId:'writer-tex',digest,content:'fixed source',cursor:12,complete:true};
test('archived TeX is a read-only main file and freezes the original artifact binding without compilation',async()=>{
 const e=editor(),requests=[];e.readArtifact=async id=>{requests.push(id);return textPart;};await e.addAsset();
 assert.deepEqual(requests,['writer-tex']);assert.deepEqual(e.state.files,[]);assert.deepEqual(e.state.assets,[{path:'main.tex',artifactId:'writer-tex'}]);assert.equal(e.state.preview,'fixed source');
 const tree=e.render(),text=flatten(tree),all=nodes(tree);assert.match(text,/writer-tex/);assert.match(text,new RegExp(digest));assert.match(text,/agent:writer/);assert.match(text,/writer-task/);assert.match(text,/既有登记信息/);
 assert.equal(all.find(n=>n.type==='textarea'&&n.props['aria-label']==='固定文本预览（只读）').props.readOnly,true);
 assert.equal(all.find(n=>n.type==='button'&&/^移除\s+main.tex$/.test(flatten(n))).props.disabled,true);
 const freeze=all.find(n=>n.type==='button'&&flatten(n)==='冻结为新文稿修订');assert.equal(freeze.props.disabled,false);
 const v=view(),calls=[];v.call=async(name,input)=>{calls.push({name,input});return revision;};v.openRevision=async()=>{};e.props.onFreeze=draft=>v.freeze(draft);await freeze.props.onClick();
 assert.deepEqual(calls.map(c=>c.name),['manuscript_create']);assert.deepEqual(calls[0].input.files,[{path:'main.tex',artifactId:'writer-tex'}]);v.componentWillUnmount();e.componentWillUnmount();
});
test('fixed text rejects invalid identity, digest, windows, size, foreign projects and backend validation errors',async()=>{
 for(const patch of [{artifactId:'other'},{digest:'b'.repeat(64)},{cursor:1},{complete:false},{content:'\0',cursor:1}]){const e=editor();e.readArtifact=async()=>({...textPart,...patch});await e.addAsset();assert.equal(e.state.assets.length,0);assert.match(e.state.error,/不匹配/);}
 for(const patch of [{size:2*1024*1024+1},{projectId:'other'}]){const e=editor();Object.assign(e.props.data.artifacts[0],patch);let calls=0;e.readArtifact=async()=>{calls++;return textPart;};await e.addAsset();assert.equal(calls,0);assert.equal(e.state.assets.length,0);assert.ok(e.state.error);}
 for(const message of ['invalid UTF-8','NUL rejected','ARTIFACT_CORRUPTED']){const e=editor();e.readArtifact=async()=>{throw Error(message);};await e.addAsset();assert.equal(e.state.assets.length,0);assert.match(e.state.error,new RegExp(message));assert.equal(e.state.checking,false);}
 const e=editor();e.readArtifact=async()=>({...textPart,content:'x'.repeat(16000),cursor:16000,complete:false});await e.addAsset();assert.equal(e.state.assets.length,1);assert.match(flatten(e.render()),/仅显示前 16,000 字符/);assert.equal(e.state.files.length,0);
});
test('fixed sources and editable files share path conflicts and template conflicts never overwrite',async()=>{
 for(const path of ['MAIN.tex','main.tex/section.tex','sections']){const e=editor();e.state.files=[{path:path==='sections'?'sections/method.tex':'main.tex',content:'keep'}];e.state.assetPath=path;e.readArtifact=async()=>{throw Error('must not read');};await e.addAsset();assert.equal(e.state.assets.length,0);assert.equal(e.state.files[0].content,'keep');assert.ok(e.state.error);}
 const e=editor();e.state.assets=[{path:'MAIN.tex',artifactId:'writer-tex'}];e.state.newPath='main.tex';e.addFile();assert.equal(e.state.files.length,0);
 e.props.templates=[{id:'template',engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',content:'replacement'}]}];e.template('template');assert.equal(e.state.templateId,'');assert.equal(e.state.files.length,0);assert.deepEqual(e.state.assets,[{path:'MAIN.tex',artifactId:'writer-tex'}]);assert.match(e.state.error,/现有草稿未改变/);
});
test('late artifact reads cannot add after selection, path, template, project, metadata or lifecycle changes',async()=>{
 for(const change of [e=>e.changeAsset({assetId:'other'}),e=>e.changeAsset({assetPath:'other.tex'}),e=>e.template(''),e=>{e.props.data.project={id:'other'};},e=>{e.props.data.artifacts=[];},e=>e.componentWillUnmount(),e=>{e.state.files=[{path:'MAIN.tex',content:'new'}];}]){
  const e=editor();let resolve;e.readArtifact=()=>new Promise(r=>{resolve=r;});const pending=e.addAsset();assert.equal(e.state.checking,true);assert.equal(nodes(e.render()).find(n=>n.type==='button'&&flatten(n)==='冻结为新文稿修订').props.disabled,true);change(e);resolve(textPart);await pending;assert.equal(e.state.assets.length,0);
 }
});
test('React publication UI preserves separate prepare, approval and submit and safe diagnostics',()=>{
 const v=view();v.state.revision=revision;v.state.job=job;v.state.jobs=[job];v.props.data.approvals=[{id:'approval',status:'pending',version:1}];
 v.state.result={id:'result',jobId:'build',diagnostics:[{severity:'error',code:'MISSING',message:'<script>unsafe</script>',file:'../secret.tex',line:3},{severity:'error',code:'TEX',message:'bad control',file:'main.tex',line:2},{severity:'warning',code:'UNKNOWN',message:'unknown source',file:null,line:null}],status:'failed',converged:false,hadErrors:true,pdf:null,previews:[],logs:[]};
 const tree=v.render(),all=nodes(tree),text=flatten(tree);assert.match(text,/批准此固定文稿构建/);assert.doesNotMatch(text,/提交已批准文稿构建/);assert.match(text,/行号未知/);assert.equal(all.filter(n=>n.type==='button'&&flatten(n).startsWith('定位 ')).length,1);assert.ok(all.every(n=>!n.props.dangerouslySetInnerHTML&&!n.props.href));
 v.props.data.approvals[0].status='approved';assert.match(flatten(v.render()),/提交已批准文稿构建/);assert.doesNotMatch(flatten(v.render()),/批准此固定文稿构建/);
 const editorNode=all.find(n=>n.type?.name==='ManuscriptEditor'),editor=sync(new editorNode.type(editorNode.props));nodes(editor.render());v.componentWillUnmount();
});

test('read-only and archived fixed viewers hide every write action and preserve the original historical PDF download',async t=>{
 const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;t.after(()=>{globalThis.fetch=oldFetch;globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
 const requests=[],downloads=[];globalThis.fetch=async url=>{requests.push(url);return {ok:true,blob:async()=>new Blob(['original PDF'])};};URL.createObjectURL=()=> 'blob:fixed';URL.revokeObjectURL=()=>{};globalThis.document={body:{appendChild(){}},createElement:()=>({click(){downloads.push(this.download);},remove(){}})};
 for(const archived of [false,true]){
  const v=view();v.props={...v.props,readOnly:!archived,data:{...v.props.data,project:{id:'project',archived}},onSelectResult:()=>assert.fail('read-only result selection')};v.state.revision=revision;v.state.result={id:'historical-result',revisionId:revision.id,jobId:job.id,sourceDigest:digest,sourceValidity:'stale',status:'succeeded',converged:true,hadErrors:false,pdf:{artifactId:'original-fixed-pdf'},previews:[],logs:[],diagnostics:[]};
  for(const [state,status] of [['prepared','pending'],['prepared','approved'],['running','approved'],['succeeded','approved']]){
   v.state.job={...job,state,integrity:'complete',resultId:v.state.result.id};v.props.data.approvals=[{id:'approval',status}];const tree=v.render(),all=nodes(tree);
   assert.ok(!all.some(n=>n.type==='form'||n.type?.name==='ManuscriptEditor'));assert.doesNotMatch(flatten(tree),/显式保存编译配置|固定编译环境配置|复制文本到可编辑新草稿|准备固定文稿构建|批准此固定文稿构建|拒绝文稿构建|提交已批准文稿构建|请求取消文稿构建|纳入此固定构建/);
   assert.equal(all.find(n=>n.type?.name==='PublicationReviewPanel').props.readOnly,true);
  }
  v.call=async()=>assert.fail('read-only methods cannot mutate');await v.freeze({});await v.editRevision();v.selectResult();
  if(v.props.readOnly)await v.initialize();
  const previewNode=nodes(v.render()).find(n=>n.type?.name==='PublicationPreview'),preview=sync(new previewNode.type(previewNode.props));
  await nodes(preview.render()).find(n=>n.type==='button'&&flatten(n)==='下载固定 PDF').props.onClick();assert.match(flatten(v.render()),/历史构建，当前来源失效/);preview.componentWillUnmount();v.componentWillUnmount();
 }
 assert.deepEqual(requests,['/api/artifacts/original-fixed-pdf/content','/api/artifacts/original-fixed-pdf/content']);assert.deepEqual(downloads,['manuscript.pdf','manuscript.pdf']);
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

test('publication result siblings have unique stable keys and reset separately when the fixed result changes',()=>{
 const v=view();v.props={...v.props,readOnly:true};v.state.revision=revision;v.state.job=job;v.state.result={id:'fixed-result',diagnostics:[],status:'failed',converged:false,hadErrors:true,pdf:null,previews:[],logs:[]};
 const inspect=()=>{
  const all=nodes(v.render());for(const parent of all){const children=Array.isArray(parent.props.children)?parent.props.children.flat(Infinity):[parent.props.children],keys=children.filter(child=>child&&typeof child==='object'&&child.key!==null&&child.key!==undefined).map(child=>child.key);assert.equal(new Set(keys).size,keys.length,'sibling keys must be unique');}
  const keyed=all.filter(n=>['PublicationReviewPanel','PublicationPreview'].includes(n.type?.name));assert.equal(keyed.length,2);assert.ok(keyed.every(n=>n.key!==null));return keyed.map(n=>n.key);
 };
 const first=inspect();v.props={...v.props,data:{...v.props.data}};assert.deepEqual(inspect(),first,'project polling preserves each result viewer');
 v.state.result={...v.state.result,id:'other-fixed-result'};const changed=inspect();assert.ok(changed.every((key,index)=>key!==first[index]),'each viewer resets for a different fixed result');v.componentWillUnmount();
});
