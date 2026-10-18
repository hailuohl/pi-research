import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {checkCitations,serializeCitationReport,CITATION_LIMITS} from '../../dist/packages/publications/citations.js';
import {setup,USER,approve} from '../support/research.mjs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ConnectorService} from '../../dist/packages/connectors/service.js';
import {ConnectorTransport} from '../../dist/packages/connectors/transport.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {digest} from '../../dist/packages/storage/store.js';
import {startTeam,spec,actor as taskActor} from '../support/collaboration.mjs';

const bib='@article{one,\n title={A {Fixed} Title},\n author="Doe, Jane",\n year=2024,\n doi={10.1000/one}\n}';
const files=(tex='\\cite{one}\\bibliography{refs}',bibliography=bib)=>[{path:'main.tex',content:tex},{path:'refs.bib',content:bibliography}];
const metadata={artifactId:'a',paperReadId:'p',doi:'10.1000/one',title:['A Fixed Title'],author:[{given:'Jane',family:'Doe'}],years:[2023,2024]};
const codes=r=>r.diagnostics.map(d=>d.code);
const cr={DOI:'10.1000/one',title:['A Fixed Title'],author:[{given:'Jane',family:'Doe'}],published:{'date-parts':[[2024]]},'published-online':{'date-parts':[[2023]]}};
function manuscript(s,actor=USER,extra={}){return s.app.publicationBuilds.createRevision(actor,s.project.id,{title:'Citation UNIT fixture',engine:'pdflatex',mainFile:'main.tex',bibliography:'bibtex',files:files().map(f=>({path:f.path,contentBase64:Buffer.from(f.content).toString('base64')})),...extra});}
function agent(s){const r=s.app.store.get('session',s.session.id);const row=s.app.store.update('session',r.id,r.version,{state:'running',generation:r.generation+1,leaseUntil:Date.now()+300000});return {type:'agent',projectId:s.project.id,sessionId:row.id,role:'coordinator',generation:row.generation};}
function brief(s){const b=s.app.researchBriefs.save(USER,s.project.id,s.session.id,{expectedRevisionId:null,question:'Check citations',scope:'Fixed manuscript only',constraints:[],successCriteria:['Check fixed citations'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Check',description:'Inspect fixed bibliography'}],status:'ready'});s.app.researchBriefs.confirm(USER,s.project.id,s.session.id,{briefId:b.id,expectedVersion:b.version});}
function network(s){let calls=0;s.app.connectors=new ConnectorService(s.app.context,s.app.evidence,{transport:new ConnectorTransport({fetcher:async()=>{calls++;return Response.json({message:cr});},minIntervalMs:0}),credentials:()=>({})});return ()=>calls;}
async function paper(s,actor=USER){return s.app.connectors.paper(actor,s.project.id,{source:'crossref',id:cr.DOI},'fixed-paper');}
const op=(s,actor,input,key='check')=>s.app.operations.execute(actor,'publication_citation_check',input,{projectId:s.project.id,idempotencyKey:key});
function report(s,result){return JSON.parse(s.app.evidence.read(USER,result.reportArtifact.artifactId).bytes);}

test('literal optional/star cites, biblatex single-group commands and root-relative inputs ignore comments/verbatim',()=>{
 const r=checkCitations([{path:'doc/main.tex',content:'% \\cite{missing}\n\\input{chapter}\\nocite{*}\\addbibresource{refs.bib}'},{path:'chapter.tex',content:'\\citep*[see][p. 2]{one}\\citet{one}\\autocite{one}\\verb|\\cite{missing}|\n\\begin{verbatim}\n\\cite{missing}\n\\end{verbatim}'},{path:'doc/chapter.tex',content:'\\cite{wrong-root}'},{path:'refs.bib',content:bib}],'doc/main.tex',[metadata]);
 assert.equal(r.literalStructure.status,'passed');assert.equal(r.identityComparison.status,'matched');assert.equal(r.citations.length,3);assert.equal(r.nociteAll,true);assert.deepEqual(r.identityComparison.comparedFields,['doi','title','year','author']);assert.equal(r.scientificClaimSupport,'not_assessed');assert.ok(r.filesScanned.includes('chapter.tex'));assert.ok(!r.filesScanned.includes('doc/chapter.tex'));
});
test('undefined and duplicate keys retain exact locations, every entry and conflicting identities',()=>{
 const r=checkCitations(files('\\cite{missing}\n\\bibliography{refs}',bib+'\n@book{one, title={Different}, author={Roe, Jo}, year=2020, doi={10.1000/two}}'),'main.tex');
 assert.equal(r.literalStructure.status,'failed');assert.equal(r.entries.length,2);for(const code of ['UNDEFINED_KEY','DUPLICATE_KEY','KEY_IDENTITY_CONFLICT'])assert.ok(codes(r).includes(code));assert.deepEqual(r.diagnostics.find(d=>d.code==='UNDEFINED_KEY').location,{file:'main.tex',line:1,column:1});assert.equal(r.diagnostics.find(d=>d.code==='DUPLICATE_KEY').location.line,7);assert.equal(r.diagnostics.find(d=>d.code==='DUPLICATE_KEY').related[0].line,1);
});
test('correct DOI does not hide title/author/year conflicts; online/print dates are candidates',()=>{
 const r=checkCitations(files(undefined,bib.replace('A {Fixed} Title','Wrong title').replace('Doe, Jane','Roe, Jo').replace('2024','2022')),'main.tex',[metadata]);assert.equal(r.identityComparison.status,'conflicts');assert.deepEqual(r.identityComparison.entries[0].fields.filter(f=>f.status==='conflict').map(f=>f.field),['title','year','author']);assert.equal(r.identityComparison.entries[0].fields[0].status,'matched');assert.ok(r.diagnostics.filter(d=>d.code==='METADATA_CONFLICT').every(d=>d.location.file==='refs.bib'));
 const ok=checkCitations(files(undefined,bib.replace('2024','2023')),'main.tex',[metadata]);assert.equal(ok.identityComparison.status,'matched');
 const wrongGiven=checkCitations(files(undefined,bib.replace('Doe, Jane','Doe, Jack')),'main.tex',[metadata]);assert.equal(wrongGiven.identityComparison.entries[0].fields.find(f=>f.field==='author').status,'conflict');
 const corporate=checkCitations(files(undefined,bib.replace('"Doe, Jane"','{{Research and Development}}')),'main.tex',[{...metadata,author:[{name:'Research and Development'}]}]);assert.equal(corporate.identityComparison.status,'matched');
});
test('missing metadata/fields and unknown given names do not become verified identities',()=>{
 const r=checkCitations(files(),'main.tex');assert.equal(r.literalStructure.status,'passed');assert.equal(r.identityComparison.status,'not_compared');assert.deepEqual(r.identityComparison.comparedFields,[]);assert.match(r.identityComparison.note,/No metadata was supplied/);
 for(const b of [bib.replace(' year=2024,',''),bib.replace('Doe, Jane','Doe, J.'),bib.replace(' doi={10.1000/one}',' doi={10.1000/unknown}')])assert.equal(checkCitations(files(undefined,b),'main.tex',[metadata]).identityComparison.status,'incomplete');
});
test('malformed, duplicate fields, concatenation, macros and inheritance never silently pass',()=>{
 for(const [b,code] of [[bib.slice(0,-2),'MALFORMED_BIB'],[bib.replace(' title=', ' title={First},\n title='),'DUPLICATE_FIELD'],[bib.replace('year=2024','year=yearMacro'),'UNSUPPORTED_BIB_MACRO'],[bib.replace('title={A {Fixed} Title}','title={A} # {Title}'),'UNSUPPORTED_CONCATENATION'],[bib.replace('year=2024','crossref={parent},year=2024'),'UNSUPPORTED_INHERITANCE'],[bib.replace('A {Fixed} Title','A \\LaTeX{} Title'),'UNSUPPORTED_BIB_TEX']]){const r=checkCitations(files(undefined,b),'main.tex');assert.ok(codes(r).includes(code),JSON.stringify(r));assert.notEqual(r.literalStructure.status,'passed');}
});
test('dynamic paths, custom cites, conditional/code environments and recursion are incomplete',()=>{
 for(const text of ['\\input{\\dynamic}','\\mycite{one}\\bibliography{refs}','\\iftrue\\cite{one}\\fi\\bibliography{refs}','\\begin{minted}{tex}\\cite{missing}\\end{minted}','\\begin{lstlisting}[escapeinside={(*}{*)}](*\\cite{missing}*)\\end{lstlisting}','\\input{main}'])assert.notEqual(checkCitations(files(text),'main.tex').literalStructure.status,'passed');
 const r=checkCitations(files('\\begin{minted}{tex}\\cite{missing}\\end{minted}'),'main.tex');assert.equal(r.citations.length,0);assert.ok(codes(r).includes('UNSUPPORTED_ENVIRONMENT'));
});
test('text/entry/diagnostic/report bounds disclose truncation without a complete pass',()=>{
 const big=checkCitations([{path:'main.tex',content:'x'.repeat(CITATION_LIMITS.textBytes+1)}],'main.tex');assert.equal(big.literalStructure.status,'incomplete');assert.equal(big.truncated,true);
 const many=checkCitations(files('\\bibliography{refs}',Array.from({length:CITATION_LIMITS.entries+1},(_,i)=>`@misc{k${i},title={Title ${i}}}`).join('\n')),'main.tex');assert.ok(codes(many).includes('ENTRY_LIMIT'));assert.equal(many.truncated,true);
 const output={...checkCitations(files(),'main.tex'),binding:{sourceDigest:'fixed'}};output.entries=Array.from({length:1000},()=>({key:'x'.repeat(2000),type:'misc',location:{file:'refs.bib',line:1,column:1},fields:[]}));output.diagnostics=Array.from({length:CITATION_LIMITS.diagnostics},()=>({severity:'incomplete',code:'FIXTURE',message:'Bounded diagnostic fixture',location:{file:'refs.bib',line:1,column:1}}));const content=serializeCitationReport(output);assert.ok(Buffer.byteLength(content)<=CITATION_LIMITS.reportBytes);const decoded=JSON.parse(content);assert.equal(decoded.truncated,true);assert.notEqual(decoded.literalStructure.status,'passed');assert.ok(decoded.diagnostics.length<=CITATION_LIMITS.diagnostics);
});
test('user operation saves exact report once, binds actual primary paper-read metadata and survives reopen',async()=>{const s=setup();try{
 const calls=network(s),p=await paper(s),r=manuscript(s),before=r.files.map(f=>readFileSync(s.app.store.paths.physical(s.app.store.get('artifact',f.artifactId).path))),input={revisionId:r.id,metadataArtifactIds:[p.artifactId]};
 const out=op(s,USER,input),count=s.app.store.list('artifact',s.project.id).length;assert.equal(out.literalStructure,'passed');assert.equal(out.identityComparison,'matched');assert.deepEqual(op(s,USER,input),out);assert.equal(s.app.store.list('artifact',s.project.id).length,count);assert.equal(calls(),1);
 const saved=report(s,out);assert.equal(saved.binding.metadata[0].paperReadId,p.id);assert.equal(saved.binding.metadata[0].paperReadDigest,digest(p));assert.equal(saved.binding.revisionDigest,digest(r));assert.equal(saved.binding.files.length,2);assert.equal(out.reportArtifact.digest,digest(s.app.evidence.read(USER,out.reportArtifact.artifactId).bytes));assert.equal(s.app.store.get('artifact',out.reportArtifact.artifactId).discoveryGrant,undefined);
 for(let i=0;i<r.files.length;i++)assert.deepEqual(s.app.evidence.read(USER,r.files[i].artifactId).bytes,before[i]);
 const reopened=new ResearchApp(s.dir,process.cwd());try{const result=reopened.operations.execute(USER,'publication_citation_check',input,{projectId:s.project.id,idempotencyKey:'check'});assert.deepEqual(result,out);assert.deepEqual(JSON.parse(reopened.evidence.read(USER,out.reportArtifact.artifactId).bytes),saved);}finally{reopened.close();}
}finally{s.close();}});
test('raw responses, same-name/same-byte forgeries and changed paper-read records are rejected',async()=>{const s=setup();try{
 network(s);const p=await paper(s),r=manuscript(s),primary=s.app.evidence.read(USER,p.artifactId),fake=s.app.evidence.put(s.project.id,primary.artifact.title,primary.bytes,primary.artifact.mediaType,'connector:crossref:metadata');
 for(const id of [fake.id,p.rawArtifactIds[0]])assert.throws(()=>op(s,USER,{revisionId:r.id,metadataArtifactIds:[id]},id),{code:'CITATION_METADATA_INVALID'});
 const input={revisionId:r.id,metadataArtifactIds:[p.artifactId]},out=op(s,USER,input);s.app.store.update('paper-read',p.id,p.version,{retrievedAt:'changed'});for(const key of ['check','fresh'])assert.throws(()=>op(s,USER,input,key),{code:'CITATION_METADATA_INVALID'});assert.equal(report(s,out).binding.metadata[0].paperReadId,p.id);
}finally{s.close();}});
test('metadata/source/report byte corruption and metadata record duplication reject cached replay',async()=>{
 for(const kind of ['metadata','source','report','duplicate']){const s=setup();try{network(s);const p=await paper(s),r=manuscript(s),input={revisionId:r.id,metadataArtifactIds:[p.artifactId]},out=op(s,USER,input);if(kind==='duplicate'){const {id,kind:k,projectId,version,createdAt,updatedAt,...data}=p;s.app.store.create('paper-read',s.project.id,data);}else{const id=kind==='metadata'?p.artifactId:kind==='source'?r.files[0].artifactId:out.reportArtifact.artifactId;const path=s.app.store.paths.physical(s.app.store.get('artifact',id).path);chmodSync(path,0o600);writeFileSync(path,'changed');}assert.throws(()=>op(s,USER,input));}finally{s.close();}}
});
test('natural grant expiry retains archived comparison; revocation rejects new and cached checks but preserves ordinary historical report reads',async()=>{const s=setup();try{
 const calls=network(s),g0=s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[],targets:[{source:'crossref',id:cr.DOI,format:'provider-text'}],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()});approve(s.app,g0.approvalId);const g=s.app.discoveryGrants.activate(USER,s.project.id,{grantId:g0.id,expectedVersion:g0.version}),who=agent(s),p=await paper(s,who),r=manuscript(s),input={revisionId:r.id,metadataArtifactIds:[p.artifactId]},out=op(s,USER,input),bytes=s.app.evidence.read(USER,out.reportArtifact.artifactId).bytes;
 const realNow=Date.now;try{Date.now=()=>Date.parse(g.expiresAt)+1;assert.deepEqual(op(s,USER,input),out);assert.equal(op(s,USER,input,'naturally-expired').identityComparison,'matched');}finally{Date.now=realNow;}
 const row=s.app.store.get('discovery-grant',g.id);s.app.discoveryGrants.revoke(USER,s.project.id,{grantId:g.id,expectedVersion:row.version});for(const key of ['check','revoked-fresh'])assert.throws(()=>op(s,USER,input,key),{code:'DISCOVERY_GRANT_REVOKED'});
 let content='',cursor=0;do{const page=s.app.operations.execute(USER,'artifact_read',{artifactId:out.reportArtifact.artifactId,cursor},{projectId:s.project.id});content+=page.content;cursor=page.cursor;if(page.complete)break;}while(true);assert.deepEqual(Buffer.from(content),bytes);assert.equal(calls(),1);
}finally{s.close();}});
test('interactive coordinator succeeds under real confirmed-brief guards; roles, foreign root/project and read-only mode refuse',async()=>{const s=setup();try{
 brief(s);const who=agent(s),r=manuscript(s,who),tools=new ToolDispatcher(s.app),input={revisionId:r.id};const out=await tools.execute(who,'publication_citation_check',input,'agent-check');assert.equal(out.literalStructure,'passed');assert.equal(out.identityComparison,'not_compared');
 const foreign=s.app.projects.create(USER,{name:'other'});assert.throws(()=>s.app.operations.execute(USER,'publication_citation_check',input,{projectId:foreign.id,idempotencyKey:'foreign'}),{code:'SCOPE_DENIED'});
 for(const role of ['writer','reviewer','literature','analyst'])assert.throws(()=>s.app.publicationBuilds.citationCheck({...who,role},s.project.id,input),{code:'TASK_SCOPE_DENIED'});
 assert.throws(()=>s.app.publicationBuilds.citationCheck({...who,wakeupId:'fake'},s.project.id,input),{code:'TASK_SCOPE_DENIED'});
 const another=s.app.sessions.create(USER,s.project.id,{title:'other root'}),ar=s.app.store.get('session',another.id),updated=s.app.store.update('session',ar.id,ar.version,{state:'running',generation:1,leaseUntil:Date.now()+60000});assert.throws(()=>s.app.publicationBuilds.citationCheck({...who,sessionId:updated.id,generation:1},s.project.id,input),{code:'SCOPE_DENIED'});
 s.app.sessionPermissions.set(USER,s.session.id,{mode:'readOnly',expectedVersion:0});await assert.rejects(tools.execute(who,'publication_citation_check',input,'readonly'),{code:'SESSION_READ_ONLY'});
}finally{s.close();}});
test('confirm mode approves the report-only write; old report is not substituted for a new revision',async()=>{const s=setup();try{
 brief(s);const who=agent(s),r=manuscript(s,who),input={revisionId:r.id},tools=new ToolDispatcher(s.app);s.app.sessionPermissions.set(USER,s.session.id,{mode:'confirm',expectedVersion:0});const before=s.app.store.list('artifact',s.project.id).length;let error;try{await tools.execute(who,'publication_citation_check',input,'pending');}catch(e){error=e;}assert.equal(error.code,'APPROVAL_REQUIRED');assert.equal(s.app.store.list('artifact',s.project.id).length,before);
 const action=s.app.store.get('session-action',error.details.actionId),approval=s.app.store.get('approval',action.approvalId);s.app.sessionPermissions.decide(USER,s.session.id,action.id,{expectedVersion:action.version,expectedApprovalVersion:approval.version,approved:true});const out=await tools.execute(who,'publication_citation_check',input,'pending');assert.deepEqual(await tools.execute(who,'publication_citation_check',input,'pending'),out);assert.equal(s.app.store.list('artifact',s.project.id).length,before+1);
 const next=manuscript(s,who,{previousRevisionId:r.id,title:'New revision'});await assert.rejects(tools.execute(who,'publication_citation_check',{revisionId:next.id},'pending'),{code:'IDEMPOTENCY_CONFLICT'});assert.equal(report(s,out).binding.revisionId,r.id);
}finally{s.close();}});

test('all fixed source files retain their discovery authority even without metadata comparison',async()=>{const s=setup();try{
 network(s);const g0=s.app.discoveryGrants.prepare(USER,s.project.id,{sessionId:s.session.id,searches:[],targets:[{source:'crossref',id:cr.DOI,format:'provider-text'}],allowSearchResults:false,formats:['provider-text'],maxRequests:1,maxResponseBytes:16384,expiresAt:new Date(Date.now()+60000).toISOString()});approve(s.app,g0.approvalId);const g=s.app.discoveryGrants.activate(USER,s.project.id,{grantId:g0.id,expectedVersion:g0.version}),p=await paper(s,agent(s));
 const base=files().map(f=>({path:f.path,contentBase64:Buffer.from(f.content).toString('base64')})),r=manuscript(s,USER,{files:[...base,{path:'archived-metadata.txt',artifactId:p.artifactId}]}),input={revisionId:r.id},out=op(s,USER,input);assert.equal(out.literalStructure,'passed');assert.equal(out.identityComparison,'not_compared');
 const row=s.app.store.get('discovery-grant',g.id);s.app.discoveryGrants.revoke(USER,s.project.id,{grantId:g.id,expectedVersion:row.version});for(const key of ['check','source-revoked-new'])assert.throws(()=>op(s,USER,input,key),{code:'DISCOVERY_GRANT_REVOKED'});assert.equal(report(s,out).reportKind,'historical_snapshot');
}finally{s.close();}});
test('actual task identities cannot check citations or read an unassigned historical report',async()=>{const s=setup();try{
 const out=op(s,USER,{revisionId:manuscript(s).id});const t=startTeam(s,[spec('unassigned',{role:'writer'})]),claimed=s.app.teams.claim(t.id),who=taskActor(claimed),tools=new ToolDispatcher(s.app);
 await assert.rejects(tools.execute(who,'publication_citation_check',{revisionId:report(s,out).binding.revisionId},'task-check'),{code:'TOOL_DENIED'});
 await assert.rejects(tools.execute(who,'artifact_read',{artifactId:out.reportArtifact.artifactId},'task-report'),{code:'TASK_SCOPE_DENIED'});
}finally{s.close();}});
test('v1 receipt fixture cannot masquerade as v2, while its immutable historical Artifact remains readable',()=>{const s=setup();try{
 const input={revisionId:manuscript(s).id},current=op(s,USER,input);assert.equal(current.checkerVersion,'literal-citations-v2');
 // Model a pre-upgrade receipt without running an old checker or altering immutable bytes.
 const oldReport=report(s,current);oldReport.checkerVersion='literal-citations-v1';oldReport.binding.checkerVersion='literal-citations-v1';const bytes=Buffer.from(JSON.stringify(oldReport,null,2)),artifact=s.app.evidence.put(s.project.id,'citation-integrity-report.json',bytes,'application/json','host:publication-citation-check');
 const old={...current,checkerVersion:'literal-citations-v1',bindingDigest:digest(oldReport.binding),reportArtifact:{artifactId:artifact.id,digest:artifact.digest,bytes:artifact.size}},scope=`operation:user:${s.project.id}:project`;
 s.app.store.db.prepare('UPDATE operations SET response=? WHERE scope=? AND key=?').run(JSON.stringify(old),scope,'check');
 const count=s.app.store.list('artifact',s.project.id).length;assert.throws(()=>op(s,USER,input),{code:'CITATION_SOURCE_CHANGED'});assert.equal(s.app.store.list('artifact',s.project.id).length,count);
 const history=s.app.operations.execute(USER,'artifact_read',{artifactId:artifact.id},{projectId:s.project.id});assert.equal(history.complete,true);assert.deepEqual(Buffer.from(history.content),bytes);assert.equal(JSON.parse(history.content).checkerVersion,'literal-citations-v1');
 const fresh=op(s,USER,input,'v2-fresh');assert.equal(fresh.checkerVersion,'literal-citations-v2');assert.notEqual(fresh.reportArtifact.artifactId,artifact.id);assert.deepEqual(s.app.evidence.read(USER,artifact.id).bytes,bytes);
}finally{s.close();}});

for(const [name,tex,bibliography] of [
 ['duplicate key separator','\\cite{one}\\bibliography{refs}',bib.replace('one,','one,,')],
 ['duplicate field separator','\\cite{one}\\bibliography{refs}',bib.replace('year=2024,','year=2024,,')],
 ['unclosed begin argument','\\begin{document\n\\cite{one}\\bibliography{refs}',bib],
 ['missing end argument','\\cite{one}\\bibliography{refs}\\end',bib],
 ['bibliography star','\\cite{one}\\bibliography*{refs}',bib],
 ['input optional argument','\\input[ignored]{child}\\cite{one}\\bibliography{refs}',bib],
 ['nocite star','\\nocite*{one}\\bibliography{refs}',bib],
 ['Bib verb macro','\\cite{one}\\bibliography{refs}',bib.replace('A {Fixed} Title','A \\verb||{Fixed} Title')],
 ['Bib environment macro','\\cite{one}\\bibliography{refs}',bib.replace('A {Fixed} Title','A \\begin{verbatim}\\end{verbatim}{Fixed} Title')]
])test(`parser rejects false complete/matched result: ${name}`,()=>{
 const r=checkCitations([...files(tex,bibliography),{path:'child.tex',content:'Child'}],'main.tex',[metadata]);assert.notEqual(r.literalStructure.status,'passed');assert.notEqual(r.identityComparison.status,'matched');assert.ok(r.diagnostics.length);
});

test('global entry cap holds across repeated includes and accepts the exact supported boundary',()=>{
 const inputs=[{path:'main.tex',content:'\\bibliography{refs}\n'+'\\input{item}\n'.repeat(3)},{path:'refs.bib',content:Array.from({length:CITATION_LIMITS.entries-1},(_,i)=>`@misc{k${i},}`).join('\n')},{path:'item.tex',content:'\\bibitem{one}'}];
 const r=checkCitations(inputs,'main.tex');assert.equal(r.entries.length,CITATION_LIMITS.entries);assert.ok(codes(r).includes('ENTRY_LIMIT'));assert.equal(r.truncated,true);assert.notEqual(r.literalStructure.status,'passed');
 const exact=checkCitations([{path:'main.tex',content:Array.from({length:CITATION_LIMITS.entries},(_,i)=>`\\bibitem{k${i}}`).join('\n')}],'main.tex');assert.equal(exact.entries.length,CITATION_LIMITS.entries);assert.equal(exact.literalStructure.status,'passed');
});
test('stopping at a citation budget does not invent undefined keys before an unscanned bibliography',()=>{
 const r=checkCitations(files('\\cite{one}\n'.repeat(CITATION_LIMITS.citations+1)+'\\bibliography{refs}'),'main.tex',[metadata]);assert.equal(r.truncated,true);assert.equal(r.literalStructure.coverage,'incomplete');assert.equal(r.identityComparison.status,'incomplete');assert.ok(!codes(r).includes('UNDEFINED_KEY'));
});
test('scan coverage excludes failed loads and files stopped before scanning',()=>{
 const missing=checkCitations(files('\\input{missing}\\bibliography{missing-refs}'),'main.tex');assert.deepEqual(missing.filesScanned,['main.tex']);assert.ok(codes(missing).includes('MISSING_FILE'));
 const over=checkCitations([{path:'main.tex',content:'x'.repeat(CITATION_LIMITS.textBytes+1)}],'main.tex');assert.deepEqual(over.filesScanned,[]);
 const child=checkCitations([{path:'main.tex',content:'\\input{child}'},{path:'child.tex',content:'x'.repeat(CITATION_LIMITS.textBytes)}],'main.tex');assert.deepEqual(child.filesScanned,['main.tex']);assert.ok(codes(child).includes('TEXT_LIMIT'));
});
for(const [title,other] of [['Learning C\\#','Learning C'],['Learning C++','Learning C'],['100\\% accuracy','100 accuracy'],['A \\& B','A B'],['x+y = z','xy = z'],['a\\_b','a b'],['亚型-甲','亚型甲'],['ℝ','R']])test(`meaningful title symbols remain distinct: ${title}`,()=>{
 const r=checkCitations(files(undefined,bib.replace('A {Fixed} Title',title)),'main.tex',[{...metadata,title:[other]}]);assert.notEqual(r.identityComparison.status,'matched');assert.notEqual(r.identityComparison.entries[0].fields.find(f=>f.field==='title').status,'matched');
});
test('Bib protection/escapes normalize only the Bib side; raw metadata and name initials remain literal or unknown',()=>{
 for(const [title,expected] of [['Learning C\\#','Learning C#'],['100\\% accuracy','100% accuracy'],['A \\& B','A & B'],['Set \\{x\\}','Set {x}'],['α + β ≠ γ','α + β ≠ γ'],['A {Fixed} Title','A Fixed Title']])assert.equal(checkCitations(files(undefined,bib.replace('A {Fixed} Title',title)),'main.tex',[{...metadata,title:[expected]}]).identityComparison.status,'matched',title);
 assert.notEqual(checkCitations(files(),'main.tex',[{...metadata,title:['A {Fixed} Title']}]).identityComparison.status,'matched');
 for(const given of ['J.','J','J.P.','J.-P.']){const r=checkCitations(files(undefined,bib.replace('Doe, Jane',`Doe, ${given}`)),'main.tex',[metadata]);assert.equal(r.identityComparison.entries[0].fields.find(f=>f.field==='author').status,'incomplete',given);}
 assert.equal(checkCitations(files(undefined,bib.replace('Doe, Jane','王, 明')),'main.tex',[{...metadata,author:[{family:'王',given:'明'}]}]).identityComparison.status,'matched');
 assert.equal(checkCitations(files(undefined,bib.replace('Doe, Jane','Doe, Jane   and\n Roe, John')),'main.tex',[{...metadata,author:[...metadata.author,{family:'Roe',given:'John'}]}]).identityComparison.status,'matched');
});
test('empty identity text remains unknown instead of matching two missing values',()=>{
 for(const value of ['', '   ']){const r=checkCitations(files(undefined,bib.replace('A {Fixed} Title',value)),'main.tex',[{...metadata,title:[value]}]);assert.equal(r.identityComparison.status,'incomplete');assert.equal(r.identityComparison.entries[0].fields.find(f=>f.field==='title').status,'incomplete');assert.ok(!r.identityComparison.comparedFields.includes('title'));}
 for(const author of [[{}],[{name:'   '}]]){const unknownAuthor=checkCitations(files(),'main.tex',[{...metadata,author}]);assert.equal(unknownAuthor.identityComparison.status,'incomplete');assert.ok(!unknownAuthor.identityComparison.comparedFields.includes('author'));}
 for(const [name,author] of [[', Jane',{family:'',given:'Jane'}],[', Jane',{family:'   ',given:'Jane'}],['Jane',{family:'',given:'Jane'}],['Doe',{family:'Doe',given:''}],['Doe',{family:'Doe',given:'   '}],['Doe, ',{family:'Doe',given:''}],['',{name:''}]]){const r=checkCitations(files(undefined,bib.replace('Doe, Jane',name)),'main.tex',[{...metadata,author:[author]}]);assert.equal(r.identityComparison.entries[0].fields.find(f=>f.field==='author').status,'incomplete',JSON.stringify({name,author}));}
});
for(const [kind,count] of [['dense-cites',20000],['dense-cites',40000],['dense-ignored',40000],['duplicate-keys',1000],['author-whitespace',400]])test(`parser work stays bounded under a hard timeout: ${kind}/${count}`,()=>{
 const child=spawnSync(process.execPath,[fileURLToPath(new URL('../fixtures/citation-parser-worker.mjs',import.meta.url)),kind,String(count)],{encoding:'utf8',timeout:3000,maxBuffer:32768,windowsHide:true});
 assert.equal(child.error?.code,undefined,`parser exceeded 3000ms: ${kind}/${count}`);assert.equal(child.status,0,child.stderr);const result=JSON.parse(child.stdout);assert.ok(result.entries<=CITATION_LIMITS.entries);assert.ok(result.citations<=CITATION_LIMITS.citations);assert.ok(result.diagnostics<=CITATION_LIMITS.diagnostics);if(kind==='dense-cites'){assert.equal(result.truncated,true);assert.equal(result.undefinedKeys,0);}if(kind==='author-whitespace')assert.ok(result.elapsedMs<500,`author whitespace took ${result.elapsedMs}ms`);
});
