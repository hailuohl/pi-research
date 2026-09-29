import {USER} from './research.mjs';
export const pmcContent='Adsorption depends on surface defects.\n\nThe control sample used pristine material.';
/** Synthetic local receipt; no HTTP, parser process, model, or Docker. */
export function pmcDocument(s,{oa='yes',license='CC BY 4.0',content=pmcContent,...changes}={}){
 const xml=`<article><front><article-meta><title-group><article-title>Local OA fixture</article-title></title-group><article-id pub-id-type="pmid">12345</article-id><article-id pub-id-type="pmcid">PMC12345</article-id><article-id pub-id-type="pmcid-ver">PMC12345.1</article-id><custom-meta-group><custom-meta><meta-name>pmc-prop-open-access</meta-name><meta-value>${oa}</meta-value></custom-meta></custom-meta-group><permissions><license>${license}</license></permissions></article-meta></front><body>${pmcContent.split('\n\n').map(p=>`<p>${p}</p>`).join('')}</body></article>`;
 const raw=s.app.evidence.put(s.project.id,'PMC12345.1.xml',Buffer.from(xml),'application/xml','connector:pubmed:raw');
 const derived=s.app.evidence.put(s.project.id,'PMC12345.1.txt',Buffer.from(content),'text/plain','connector:pubmed:provider-text');
 const paper=s.app.store.create('paper-read',s.project.id,{source:'pubmed',idInSource:'PMC12345',requestedId:'12345',resolvedId:'PMC12345.1',reportedVersion:'PMC12345.1',versionAssurance:'provider-record',title:'Local OA fixture',contentKind:'full_text',license,pageMapping:'unavailable',rawArtifactIds:[raw.id],artifactId:derived.id,artifactDigest:derived.digest,retrievedAt:new Date().toISOString(),scopeSessionId:null,scopeTaskId:null,...changes});
 const document=s.app.documents.createFromPaper(USER,s.project.id,paper.id,paper.id);return s.app.documents.get(USER,s.project.id,document.id);
}
