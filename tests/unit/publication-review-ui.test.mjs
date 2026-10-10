import {synchronousState} from '../support/ui.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {PublicationReviewPanel}=await import('../../dist/web/assets/publication-review-view.js');
const {ReportsView}=await import('../../dist/web/assets/report-view.js');
const {PublicationView}=await import('../../dist/web/assets/publication-view.js');
const sync=v=>{v.setState=(patch,done)=>{Object.assign(v.state,typeof patch==='function'?patch(v.state,v.props):patch);done?.();};return v;};
const result={id:'result',revisionId:'revision',jobId:'job',sourceDigest:'source',pdf:{digest:'pdf'}};
const review={id:'review',publicationResultId:'result',revisionId:'revision',jobId:'job',sourceDigest:'source',pdfDigest:'pdf',rootSessionId:'root',teamId:'team',taskId:'task',approvalId:'approval',digest:'binding',status:'awaiting_approval',validity:'current',requiredEvidenceIds:['source-evidence'],artifactIds:[]};
const data={project:{id:'project'},sessions:[{id:'root',title:'Root',role:'coordinator',state:'idle'}],evidence:[{id:'evidence',description:'Fixed evidence'}],tasks:[],reports:[],runs:[],experiments:[],claims:[],artifacts:[]};
function view(){const v=sync(synchronousState(new PublicationReviewPanel({data,result,ready:true,perform:async f=>f()})));v.state.rootSessionId='root';return v;}
const flatten=node=>node==null||typeof node==='boolean'?'':Array.isArray(node)?node.map(flatten).join(' '):typeof node!=='object'?String(node):flatten(node.props.children);
test('paper review preparation sends the exact result and explicit evidence, never approves or invokes a model',async()=>{
 const v=view(),calls=[];v.state.inputEvidenceIds=['evidence'];v.call=async(name,input)=>{calls.push({name,input});return review;};await v.prepare();
 assert.deepEqual(calls,[{name:'publication_review_prepare',input:{resultId:'result',rootSessionId:'root',inputEvidenceIds:['evidence']}}]);assert.equal(v.state.reviews[0].status,'awaiting_approval');assert.equal(v.state.busy,false);
 assert.match(flatten(v.render()),/不会批准或调用模型/);assert.match(flatten(v.render()),/不代表模型视觉检查了 PDF/);
 v.props.ready=false;await v.prepare();assert.equal(calls.length,1);v.componentWillUnmount();
});
test('all review opinions are visible and pending, rejection, dispute, and no-review stay distinct',async()=>{
 const v=view();v.call=async()=>[];await v.refresh();assert.match(flatten(v.render()),/未审查/);
 v.call=async()=>['pending','passed','rejected','disputed'].map(status=>({...review,id:status,status,summary:`opinion-${status}`}));await v.refresh();const text=flatten(v.render());
 for(const status of ['pending','passed','rejected','disputed'])assert.match(text,new RegExp(`opinion-${status}`));assert.match(text,/待处理/);assert.match(text,/审查通过/);assert.match(text,/未通过/);assert.match(text,/有争议/);assert.match(text,/任务验收与论文审查意见分别记录/);v.componentWillUnmount();
});

test('read-only and archived review viewers preserve existing opinions without preparation controls',async()=>{
 for(const archived of [false,true]){
  const v=view();v.props={...v.props,readOnly:!archived,data:{...data,project:{...data.project,archived}},selectedReviewId:review.id};v.state.reviews=[{...review,summary:'Original fixed opinion'}];v.state.loaded=true;
  v.call=async()=>assert.fail('read-only viewer must not prepare a review');await v.prepare();
  const text=flatten(v.render());assert.match(text,/Original fixed opinion/);assert.match(text,/所选固定审查/);assert.doesNotMatch(text,/准备此固定论文审查|显式附加项目证据|论文审查主协调会话/);v.componentWillUnmount();
 }
});
test('late list and prepare replies cannot populate a different build or an unmounted view',async()=>{
 for(const operation of ['refresh','prepare'])for(const change of ['selection','unmount']){
  const v=view();let resolve;v.call=()=>new Promise(r=>{resolve=r;});const pending=v[operation]();
  if(change==='unmount')v.componentWillUnmount();else {const prev=v.props;v.props={...prev,result:{...result,id:'new-result'}};v.call=async()=>[];v.componentDidUpdate(prev);await new Promise(r=>setImmediate(r));}
  resolve(operation==='refresh'?[review]:review);await pending;assert.deepEqual(v.state.reviews,[]);v.componentWillUnmount();
 }
});
test('mismatched fixed review binding fails closed and stale refreshes cannot win',async()=>{
 const v=view();v.call=async()=>[{...review,pdfDigest:'other'}];await v.refresh();assert.equal(v.state.loaded,false);assert.match(v.state.error,/不一致/);
 let resolve;v.call=()=>new Promise(r=>{resolve=r;});const first=v.refresh();v.call=async()=>[{...review,status:'rejected'}];await v.refresh();resolve([{...review,status:'passed'}]);await first;assert.equal(v.state.reviews[0].status,'rejected');v.componentWillUnmount();
});
test('a list requested during preparation cannot erase the newly prepared review',async()=>{
 const v=view();let finishPrepare,finishList;v.call=name=>new Promise(resolve=>{if(name==='publication_review_prepare')finishPrepare=resolve;else finishList=resolve;});
 const preparing=v.prepare(),listing=v.refresh();finishPrepare(review);await preparing;assert.equal(v.state.reviews[0].id,review.id);finishList([]);await listing;
 assert.deepEqual(v.state.reviews,[review]);assert.equal(v.state.loading,false);assert.equal(v.state.busy,false);v.componentWillUnmount();
});
test('late same-build navigation cannot replace a newer selected review',async()=>{
 const v=sync(synchronousState(new PublicationView({data,perform:async f=>f()}))),pending=[];v.openRevision=()=>{v.selectionEpoch++;return new Promise(resolve=>pending.push(resolve));};
 const older=v.openFixed('revision','job','review-a'),newer=v.openFixed('revision','job','review-b');v.state.revision={id:'revision'};v.state.job={id:'job'};
 pending[1]();await newer;assert.equal(v.state.selectedReviewId,'review-b');pending[0]();await older;assert.equal(v.state.selectedReviewId,'review-b');v.componentWillUnmount();
});
test('report review references are frozen and exact-build navigation rejects unbound IDs',async()=>{
 const v=sync(synchronousState(new ReportsView({data,perform:async f=>f()}))),reference={id:'review-ref',type:'publication-review',targetId:'review',digest:'binding',label:'Fixed review'};
 v.state.report={id:'report',artifactId:'body',title:'Report',formatVersion:6,integrity:'verified',validity:'current',runs:[],reasons:[],references:[reference],publicationReviews:[{resultId:'result',reviewIds:['review'],reviews:[{...review,referenceId:reference.id}]}]};
 let opened;v.publicationView={openFixed:(...args)=>{opened=args;}};v.openPublicationReview('result','other');assert.equal(opened,undefined);v.openPublicationReview('result','review');assert.deepEqual(opened,['revision','job','review']);
 v.call=async(name,input)=>{assert.equal(name,'report_reference_read');assert.equal(input.referenceId,'review-ref');return {reference,content:'frozen snapshot',cursor:0,end:15,complete:true};};await v.readReference('review-ref');assert.equal(v.state.content,'frozen snapshot');assert.match(flatten(v.render()),/报告生成时/);v.componentWillUnmount();
});
