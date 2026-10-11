import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {synchronousState} from '../support/ui.mjs';
import {PublicationDialogue} from '../../dist/web/assets/publication-dialogue.js';

const root={id:'root',role:'coordinator',state:'idle'},revision={id:'revision',rootSessionId:'root',title:'Fixed paper',sourceDigest:'source',engine:'pdflatex',files:[]};
const job={id:'job',revisionId:'revision',manifestDigest:'fixed',sourceDigest:'source',approvalId:'approval',state:'prepared',integrity:'pending',engine:'pdflatex',mainFile:'main.tex',resources:{cpus:1,memoryMb:256,timeoutSeconds:60},imageDigest:'image'};
const base=()=>({project:{id:'project',settings:{enabled:true}},manuscripts:[revision],publicationJobs:[job],publicationReviews:[],publicationExports:[],reports:[],approvals:[{id:'approval',subjectId:'job',scope:'publication.build',digest:'fixed',status:'pending',version:1}]});
const view=data=>synchronousState(new PublicationDialogue({data,session:root,disabled:false,perform:fn=>fn()}));
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'||typeof node==='number'?String(node):'';
const nodes=node=>Array.isArray(node)?node.flatMap(nodes):node&&typeof node==='object'?[node,...nodes(node.props?.children)]:[];
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5p8AAAAASUVORK5CYII=','base64');
const successfulJob={...job,state:'succeeded',integrity:'complete',resultId:'result'};
const successfulResult=()=>({id:'result',jobId:'job',revisionId:'revision',manifestDigest:'fixed',status:'succeeded',converged:true,hadErrors:false,pdf:{artifactId:'fixed-pdf'},previews:[1,2].map(pageNumber=>({artifactId:'page-'+pageNumber,pageNumber,digest:createHash('sha256').update(png).digest('hex')})),logs:[],diagnostics:[],sourceValidity:'current'});

test('paper dialogue stays empty without own manuscripts and excludes foreign revisions',()=>{
    assert.equal(view({...base(),manuscripts:[]}).render(),null);
    const rendered=text(view({...base(),manuscripts:[revision,{...revision,id:'other',rootSessionId:'other-root',title:'Foreign manuscript'}]}).render());
    assert.match(rendered,/Fixed paper/);assert.doesNotMatch(rendered,/Foreign manuscript/);
});

test('changing dialogue while compilation approval returns never submits in the new dialogue',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let release;const requests=[];
    globalThis.fetch=(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({})});});};
    const ui=view(base()),waiting=ui.submit(job);ui.props={...ui.props,session:{...root,id:'other-root'}};release();
    await assert.rejects(waiting,/当前对话或固定文稿已变化/);assert.deepEqual(requests.map(r=>r.url),['/api/approvals/approval/decide']);
});

test('already approved compilation resumes the same job and mismatched approval digests cannot submit',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);const requests=[];
    globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return {ok:true,json:async()=>({})};};
    const data=base();data.approvals[0].status='approved';const ui=view(data);await ui.submit(job);
    assert.deepEqual(requests,[{url:'/api/operations/publication_submit',body:{projectId:'project',sessionId:'root',input:{jobId:'job'}}}]);
    data.approvals[0].digest='changed';requests.length=0;await assert.rejects(ui.submit(job),/尚未取得有效批准/);assert.equal(requests.length,0);
});

test('dialogue previews verified fixed pages from octet-stream responses and downloads the original PDF',async t=>{
    const oldFetch=globalThis.fetch,oldDocument=globalThis.document,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
    t.after(()=>{globalThis.fetch=oldFetch;globalThis.document=oldDocument;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;});
    const requests=[],blobs=[],revoked=[],downloads=[],result=successfulResult();result.sourceValidity='stale';
    globalThis.fetch=async url=>{requests.push(url);return url.includes('/operations/')?new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json'}}):new Response(url.endsWith('/fixed-pdf/content')?'%PDF-1.7 UNIT download fixture':png,{headers:{'Content-Type':'application/octet-stream'}});};
    URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:unit-'+blobs.length;};URL.revokeObjectURL=url=>revoked.push(url);
    globalThis.document={body:{appendChild(){}},createElement:()=>({click(){downloads.push(this.download);},remove(){}})};
    const ui=view({...base(),publicationJobs:[successfulJob]});await ui.preview(successfulJob);
    const tree=nodes(ui.render());assert.ok(tree.every(n=>!['iframe','object','embed'].includes(n.type)));
    const element=tree.find(n=>n.type?.name==='PublicationPreview');assert.ok(element,'dialogue reuses the fixed page viewer');
    const preview=synchronousState(new element.type(element.props));t.after(()=>preview.componentWillUnmount());
    await preview.load(1);assert.equal(blobs[0].type,'image/png');assert.equal(nodes(preview.render()).find(n=>n.type==='img').props.alt,'固定文稿第 1 页');
    const pageSelect=nodes(preview.render()).find(n=>n.type==='select');assert.equal(pageSelect.props['aria-label'],'文稿物理页');assert.equal(nodes(pageSelect).filter(n=>n.type==='option').length,2);
    await preview.load(2);assert.equal(blobs[1].type,'image/png');assert.equal(preview.state.page,2);assert.deepEqual(revoked,['blob:unit-1']);
    assert.ok(!requests.some(url=>url.includes('/fixed-pdf/content')),'page preview does not send an octet-stream PDF to a frame');
    await nodes(preview.render()).find(n=>n.type==='button'&&text(n)==='下载固定 PDF').props.onClick();assert.deepEqual(downloads,['manuscript.pdf']);assert.equal(requests.at(-1),'/api/artifacts/fixed-pdf/content');
    assert.ok(nodes(preview.render()).every(n=>!['iframe','object','embed','form'].includes(n.type)));assert.ok(!tree.some(n=>['PublicationView','ManuscriptEditor','PublicationReviewPanel'].includes(n.type?.name)));
    nodes(ui.render()).find(n=>n.type==='button'&&text(n)==='关闭预览').props.onClick();assert.ok(!nodes(ui.render()).some(n=>n.type?.name==='PublicationPreview'));
});

test('dialogue rejects failed or incomplete previews and retains old revisions and failure records',async()=>{
    for(const [fixedJob,result] of [[{...successfulJob,state:'failed'},{...successfulResult(),status:'failed',hadErrors:true,pdf:null}], [{...successfulJob,integrity:'incomplete'},successfulResult()], [successfulJob,{...successfulResult(),converged:false}], [successfulJob,{...successfulResult(),hadErrors:true}]]){
        const ui=view({...base(),publicationJobs:[fixedJob]});ui.call=async()=>result;
        await assert.rejects(ui.preview(fixedJob),/没有完整成功 PDF/);assert.equal(ui.state.previewJobId,'');assert.ok(!nodes(ui.render()).some(n=>n.type?.name==='PublicationPreview'));
    }
    const newer={...revision,id:'new-revision',title:'New revision',previousRevisionId:revision.id},failed={...successfulJob,state:'failed',error:'UNIT retained failure'};
    const data={...base(),manuscripts:[revision,newer],publicationJobs:[successfulJob]},ui=view(data);ui.call=async()=>successfulResult();await ui.preview(successfulJob);
    assert.match(text(ui.render()),/历史文稿（1）/);assert.match(text(ui.render()),/Fixed paper/);
    ui.props={...ui.props,data:{...data,publicationJobs:[failed]}};assert.match(text(ui.render()),/UNIT retained failure/);
    const element=nodes(ui.render()).find(n=>n.type?.name==='PublicationPreview'),preview=synchronousState(new element.type(element.props));assert.equal(element.props.ready,false);assert.doesNotMatch(text(preview.render()),/下载固定 PDF|文稿物理页/);preview.componentWillUnmount();
});

test('late preview results cannot populate another dialogue or survive a dialogue switch',async t=>{
    const oldFetch=globalThis.fetch;t.after(()=>globalThis.fetch=oldFetch);let release;
    globalThis.fetch=()=>new Promise(resolve=>{release=()=>resolve(new Response(JSON.stringify(successfulResult())));});
    const ui=view({...base(),publicationJobs:[successfulJob]}),pending=ui.preview(successfulJob),previous=ui.props;
    ui.props={...ui.props,session:{...root,id:'other-root'}};ui.componentDidUpdate(previous);release();await assert.rejects(pending,/当前对话或固定文稿已变化/);
    assert.equal(ui.state.previewJobId,'');assert.deepEqual(ui.state.results,{});assert.ok(!nodes(ui.render()).some(n=>n.type?.name==='PublicationPreview'));
    const own=view({...base(),publicationJobs:[successfulJob]});own.call=async()=>successfulResult();await own.preview(successfulJob);const before=own.props;own.props={...before,session:{...root,id:'other-root'}};assert.ok(!nodes(own.render()).some(n=>n.type?.name==='PublicationPreview'));own.componentDidUpdate(before);assert.equal(own.state.previewJobId,'');
});

test('shared dialogue page viewer preserves PNG signature and digest errors',async t=>{
    const oldFetch=globalThis.fetch,oldCreate=URL.createObjectURL;t.after(()=>{globalThis.fetch=oldFetch;URL.createObjectURL=oldCreate;});URL.createObjectURL=()=>assert.fail('unverified image must not become a URL');
    const ui=view({...base(),publicationJobs:[successfulJob]});ui.call=async()=>successfulResult();await ui.preview(successfulJob);
    const element=nodes(ui.render()).find(n=>n.type?.name==='PublicationPreview'),preview=synchronousState(new element.type(element.props));
    globalThis.fetch=async()=>new Response('not a PNG');await preview.load(1);assert.match(preview.state.error,/不是有效 PNG/);assert.equal(preview.state.imageURL,'');
    globalThis.fetch=async()=>new Response(png);preview.props={...preview.props,result:{...element.props.result,previews:element.props.result.previews.map(p=>({...p,digest:'0'.repeat(64)}))}};await preview.load(2);assert.match(preview.state.error,/摘要不匹配/);assert.equal(preview.state.imageURL,'');preview.componentWillUnmount();
});
