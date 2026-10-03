import test from 'node:test';
import assert from 'node:assert/strict';
import {synchronousState} from '../support/ui.mjs';
import {PublicationDialogue} from '../../dist/web/assets/publication-dialogue.js';

const root={id:'root',role:'coordinator',state:'idle'},revision={id:'revision',rootSessionId:'root',title:'Fixed paper',sourceDigest:'source',engine:'pdflatex',files:[]};
const job={id:'job',revisionId:'revision',manifestDigest:'fixed',sourceDigest:'source',approvalId:'approval',state:'prepared',integrity:'pending',engine:'pdflatex',mainFile:'main.tex',resources:{cpus:1,memoryMb:256,timeoutSeconds:60},imageDigest:'image'};
const base=()=>({project:{id:'project',settings:{enabled:true}},manuscripts:[revision],publicationJobs:[job],publicationReviews:[],publicationExports:[],reports:[],approvals:[{id:'approval',subjectId:'job',scope:'publication.build',digest:'fixed',status:'pending',version:1}]});
const view=data=>synchronousState(new PublicationDialogue({data,session:root,disabled:false,perform:fn=>fn()}));
const text=node=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):typeof node==='string'?node:'';

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
