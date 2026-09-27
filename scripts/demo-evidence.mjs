/** Explicitly invoked fixture: local corpus only; no network, model or formal experiment. */
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ResearchApp} from '../dist/packages/research-app.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const index=process.argv.indexOf('--data'),dir=resolve(index>=0?process.argv[index+1]:process.env.PI_DATA_DIR??resolve(root,'.pi-research'));
const fixture=JSON.parse(readFileSync(new URL('../tests/research-evals/text-evidence-fixture.json',import.meta.url),'utf8'));
const app=new ResearchApp(dir,root),USER={type:'user'};
try {
 const project=app.projects.create(USER,{name:'原文检索 · 固定测试资料',description:fixture.disclosure});
 const files=fixture.documents.map(d=>({...d,artifact:app.evidence.put(project.id,d.name,Buffer.from(d.text),'text/plain','user')}));
 app.textEvidence.configure(USER,project.id,{enabled:true,artifactIds:files.map(f=>f.artifact.id),expectedVersion:0});
 const results=['adsorption protocol','吸附构型','calibration constant'].map(query=>{
  const r=app.textEvidence.search(USER,project.id,{query,artifactIds:files.map(f=>f.artifact.id),limit:3});
  return {query,searchId:r.id,groups:[...new Set(r.hits.map(h=>files.find(f=>f.name===h.title).group))],quotesVerified:r.hits.every(h=>app.evidence.verify(project.id,h.evidenceId).quote===h.quote)};
 });
 console.log(JSON.stringify({version:JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version,projectId:project.id,aiUsed:false,documents:files.length,runsCreated:app.store.list('run',project.id).length,results,disclosure:fixture.disclosure},null,2));
}finally{app.close();}
