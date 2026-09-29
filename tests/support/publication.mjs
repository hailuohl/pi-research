import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {compilerProfile} from '../../dist/packages/publications/build-service.js';
import {PUBLICATION_PROFILE} from '../../dist/packages/publications/build-types.js';
import {digest} from '../../dist/packages/storage/store.js';
import {USER,approve} from './research.mjs';
export const publicationPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2qkAAAAASUVORK5CYII=','base64');
// UNIT fixture only: no Docker, model, network or real compiler execution.
export function publicationFixture(app,pid,{files=[],title='UNIT fixed manuscript'}={}) {
 const imageId='sha256:'+'a'.repeat(64);
 if(!app.store.maybe('publication-compiler-settings','global'))app.store.create('publication-compiler-settings',null,{...compilerProfile(process.cwd()),dockerContext:'default',imageDigest:imageId,imageId},'global');
 const revision=app.publicationBuilds.createRevision(USER,pid,{title,engine:'pdflatex',mainFile:'main.tex',bibliography:'none',files:[{path:'main.tex',contentBase64:Buffer.from('UNIT manuscript source; not a compiled scientific document').toString('base64')},...files]});
 const prepared=app.publicationBuilds.prepare(USER,pid,{revisionId:revision.id});approve(app,prepared.approvalId);
 let job=app.store.get('publication-build-job',prepared.id),controlDir=app.store.paths.physical(job.controlDir);writeFileSync(join(controlDir,'stdout.log'),'UNIT');writeFileSync(join(controlDir,'stderr.log'),'');
 job=app.store.update('publication-build-job',job.id,job.version,{state:'running',startRequested:true,containerId:'unit-container',imageId});
 const pdf=Buffer.from('%PDF-1.7\nUNIT fixture, not a compiled document'),log=Buffer.from('UNIT fixture diagnostic\n'),descriptor=(file,bytes)=>({file,digest:digest(bytes),bytes:bytes.length});
 const output={formatVersion:1,profileId:PUBLICATION_PROFILE,sourceDigest:revision.sourceDigest,engine:'pdflatex',bibliography:'none',engineVersion:'UNIT fixture',status:'succeeded',hadErrors:false,converged:true,passes:2,diagnostics:[],pdf:{...descriptor('document.pdf',pdf),pages:1},previews:[{...descriptor('page-001.png',publicationPng),pageNumber:1,width:1,height:1}],logs:[descriptor('build.log',log)]};
 const outputDir=app.store.paths.physical(job.outputDir);for(const [name,bytes] of [['document.pdf',pdf],['page-001.png',publicationPng],['build.log',log],['build.json',Buffer.from(JSON.stringify(output))]])writeFileSync(join(outputDir,name),bytes);
 job=app.publicationBuilds.finalize(job.id,{state:'succeeded',exitCode:0});return {revision,job,result:app.publicationBuilds.result(USER,pid,job.resultId),pdf};
}
