import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync,symlinkSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {synchronousState} from '../support/ui.mjs';
import {setup,USER} from '../support/research.mjs';
import {LiteratureView} from '../../dist/web/assets/literature-view.js';
import {ComputeConnections} from '../../dist/web/assets/compute-connections.js';
import {ExecutionEnvironments} from '../../dist/web/assets/execution-environments.js';
import {Inspector} from '../../dist/web/assets/workbench.js';
import {SshTargetService} from '../../dist/packages/runners/ssh-targets.js';
import {GpuService} from '../../dist/packages/runners/gpu.js';
import {fixedResearchBrief} from '../../dist/packages/research-workflows/briefs.js';
import {DomainError,asError} from '../../dist/packages/domain/errors.js';

const nodes=n=>Array.isArray(n)?n.flatMap(nodes):!n||typeof n!=='object'?[]:[n,...nodes(n.props?.children)];
const text=n=>n==null||typeof n==='boolean'?'':Array.isArray(n)?n.map(text).join(' '):typeof n!=='object'?String(n):text(n.props?.children);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const document={id:'pdf',projectId:'project',title:'Fixed PDF',contentKind:'original-pdf',original:{digest:'a'.repeat(64)},source:{},license:{},limitations:[]};
const data={project:{id:'project'},documents:[document],documentParseJobs:[{id:'job',documentVersionId:'pdf',state:'succeeded',integrity:'complete',resultId:'parse',resources:{}}],approvals:[]};
const view=props=>synchronousState(new LiteratureView({data,perform:async fn=>fn(),...props}));
function pane(v){const element=nodes(v.render()).find(n=>n.type?.name==='DocumentPane');return element?synchronousState(new element.type(element.props)):undefined;}
const pages=v=>nodes(pane(v)?.render()).find(n=>n.type?.name==='DocumentPages');

test('uncontrolled settings PDF button retains exact parse and physical page through page navigation',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);globalThis.fetch=async()=>({ok:true,json:async()=>document});
 const v=view({embedded:true,setupOnly:true});await v.loadDocument('pdf');
 const open=nodes(pane(v).render()).find(n=>n.type==='button'&&text(n)==='查看此固定解析结果');open.props.onClick();await tick();
 assert.equal(pages(v)?.props.resultId,'parse');assert.equal(pages(v).props.document.id,'pdf');assert.equal(pages(v).props.pageNumber,1);
 pages(v).props.onPage(3);await tick();assert.equal(pages(v).props.pageNumber,3);
});

test('controlled history stays exact and mismatched document or changed project never renders stale PDF pages',async t=>{
 const old=globalThis.fetch;t.after(()=>globalThis.fetch=old);const pending=[];globalThis.fetch=()=>new Promise(resolve=>pending.push(resolve));
 const location={documentVersionId:'pdf',parseResultId:'history-parse',pageNumber:4},selected=[],v=view({selectedDocument:location,onDocument:value=>selected.push(value)});v.state.document=document;
 assert.equal(pages(v).props.resultId,'history-parse');assert.equal(pages(v).props.pageNumber,4);pages(v).props.onPage(5);assert.deepEqual(selected,[{...location,pageNumber:5}]);
 const before=v.props;v.props={...before,selectedDocument:{documentVersionId:'other',parseResultId:'other-parse',pageNumber:2}};
 assert.equal(pages(v),undefined,'new location must not be paired with the previous document before its effect runs');v.componentDidUpdate(before);
 const other=v.props;v.props={...other,data:{...data,project:{id:'other-project'}}};
 assert.equal(pages(v),undefined,'project switch must hide the previous project immediately');v.componentDidUpdate(other);
 for(const resolve of pending)resolve({ok:true,json:async()=>document});await tick();assert.equal(pages(v),undefined);
});

test('SSH missing and non-file keys return domain input errors before any host scan',async()=>{
 const s=setup();try{const targets=new SshTargetService(s.app.context);let scans=0;targets.scan=async()=>{scans++;assert.fail('invalid key must not scan a host');};
 const directory=join(s.dir,'directory');mkdirSync(directory);const file=join(s.dir,'key');writeFileSync(file,'unit fixture');
 const input=identityFile=>({id:'qa',host:'fixture.invalid',user:'research',remoteRoot:'/srv/pi/jobs',identityFile,expectedVersion:0});
 for(const path of [join(s.dir,'missing'),directory,join(file,'child')])await assert.rejects(targets.challenge(USER,input(path)),error=>{assert.ok(error instanceof DomainError);assert.equal(error.code,'INVALID_INPUT');assert.match(error.message,/SSH.*普通文件/);return true;});
 assert.equal(scans,0);assert.equal(s.app.store.list('approval').length,0);
 const link=join(s.dir,'directory-link');symlinkSync(directory,link,'junction');await assert.rejects(targets.challenge(USER,input(link)),{code:'INVALID_INPUT'});
 assert.throws(()=>targets.configure(USER,{...input(join(s.dir,'missing')),knownHostsFile:file}),{code:'INVALID_INPUT'});
 }finally{s.close();}
});

test('closing or cancelling the SSH editor clears its obsolete error',()=>{
 const v=synchronousState(new ComputeConnections({projectId:'project',active:true}));
 for(const event of ['onCancel','onClose']){v.state.editor={id:'qa',version:0};v.state.error='SSH key missing';const dialog=nodes(v.render()).find(n=>n.type==='dialog'&&n.props['aria-labelledby']==='ssh-editor-title');dialog.props[event]();assert.equal(v.state.error,'');assert.equal(v.state.editor,null);}
});

test('Docker GPU unpinned input returns actionable domain error without launching any process',async()=>{
 const s=setup(),old=childProcess.spawn,oldSync=childProcess.spawnSync;let launches=0;try{
 childProcess.spawn=childProcess.spawnSync=()=>{launches++;assert.fail('invalid image must not execute Docker');};syncBuiltinESMExports();
 await assert.rejects(new GpuService(s.app.context).probe(USER,{backend:'docker',context:'default',image:'python:3.12-slim'}),error=>{assert.ok(error instanceof DomainError);assert.equal(asError(error).code,'INVALID_INPUT');assert.match(error.message,/sha256/);return true;});assert.equal(launches,0);assert.equal(s.app.store.list('gpu-target').length,0);
 }finally{childProcess.spawn=old;childProcess.spawnSync=oldSync;syncBuiltinESMExports();s.close();}
});

test('GPU input errors display the actual message without an Error prefix',async()=>{
 const v=synchronousState(new ExecutionEnvironments({projectId:'project',active:true}));v.mounted=true;v.call=async()=>{throw new Error('Docker image must be pinned by sha256 digest');};v.load=async()=>{};
 await v.mutate('gpu_target_probe',{backend:'docker'},'');assert.equal(v.state.error,'Docker image must be pinned by sha256 digest');
});

test('missing fixed research brief is rejected before storage access or report/approval effects',()=>{
 let accesses=0;const store=new Proxy({},{get(){accesses++;assert.fail('missing reference must be rejected before touching storage');}});
 for(const ref of [undefined,null])assert.throws(()=>fixedResearchBrief(store,'project',ref,'formal'),error=>{assert.ok(error instanceof DomainError);assert.equal(error.code,'BRIEF_REFERENCE_REQUIRED');assert.match(error.message,/固定研究.*引用/);return true;});assert.equal(accesses,0);
});

test('local Run details show local receipt while Docker keeps actual image and legitimate pending preflight',()=>{
 const experiment={id:'experiment',title:'test',revision:1,contract:{runner:'local',command:['python','main.py'],metrics:{}}},run={id:'run',experimentId:'experiment',state:'succeeded',integrity:'complete',judgment:'pending',manifest:{localRuntime:{id:'python',runtimeVersion:'Python 3.12'},contract:experiment.contract},execution:{backend:'local',dockerContext:'local'}};
 const v=synchronousState(new Inspector({tab:'experiments',boot:{runtime:{}},data:{project:{},teams:[],tasks:[],budgets:[],approvals:[],runs:[run]},experiment,perform:async fn=>fn()}));
 let rendered=text(v.render());assert.match(rendered,/本地执行/);assert.match(rendered,/Python 3.12/);assert.doesNotMatch(rendered,/Docker context|等待容器预检|实际镜像 ID/);
 run.execution={backend:'docker',dockerContext:'qa-context',imageId:'sha256:actual'};rendered=text(v.render());assert.match(rendered,/Docker context.*qa-context/);assert.match(rendered,/sha256:actual/);
 delete run.execution.imageId;run.state='queued';assert.match(text(v.render()),/等待容器预检/);
});
