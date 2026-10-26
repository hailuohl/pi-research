import type {Artifact} from '../domain/types.js';
import type {Store} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
import {withSourceIntegrity,sourceIntegrityScope,type SourceIntegrityContext} from '../storage/source-integrity.js';
import type {ResearchSourceInput} from '../research-workflows/source-inputs.js';
const scopeId=(jobId:string)=>`development-review:${jobId}`;
export const currentReviewIntegrity=(store:Store,jobId:string)=>sourceIntegrityScope(store,scopeId(jobId));
export function withReviewIntegrity<T>(store:Store,pid:string,jobId:string,inputs:ResearchSourceInput[]|undefined,mode:'authority'|'full',fn:(context:SourceIntegrityContext)=>T):T {
 const blobs=(inputs??[]).filter(i=>i.purpose==='dataset-reference').map(i=>{const a=store.get<Artifact>('artifact',i.artifactId,pid);ensure(a.digest===i.digest&&a.size===i.size,'ARTIFACT_CORRUPTED','审查数据引用与原件身份不符');return {blobPath:a.path,digest:a.digest,size:a.size};});
 return withSourceIntegrity(store,scopeId(jobId),mode,blobs,fn);
}
