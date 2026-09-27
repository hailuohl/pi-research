/** Actual local process stress check, never calls a model. Run after building. */
import {ResearchApp} from '../dist/packages/research-app.js';
import {USER} from '../dist/packages/domain/types.js';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const root=resolve(import.meta.dirname,'..'),outcomes=[];
for(let k=0;k<20;k++){
 const dir=mkdtempSync(join(tmpdir(),'pi-cancel-stress-')),app=new ResearchApp(dir,root);
 try{
  const p=app.projects.create(USER,{name:'race',template:'curve-fit'}),e=app.experiments.create(USER,p.id,{title:'race',config:{polynomialDegree:1,ridge:.000001,sleepMs:5000}}),i=app.runs.prepare(USER,e.id),a=app.store.get('approval',i.approvalId);
  app.approvals.decide(USER,a.id,a.version,true);let r=app.runs.submit(USER,i.id);app.runs.launchPending();
  for(let n=0;n<300&&r.state==='queued';n++){await sleep(2);r=app.runs.get(USER,r.id);}
  await sleep(50);for(let n=0;n<150;n++){app.runs.cancel(USER,r.id);await sleep(1);}
  for(let n=0;n<30;n++){await sleep(100);r=app.runs.get(USER,r.id);if(['succeeded','cancelled','failed'].includes(r.state))break;}
  outcomes.push(r.state);
  if(r.state!=='cancelled')throw new Error(`${dir}: ${r.state}\n${readFileSync(join(dir,'jobs',r.id,'control','supervisor.log'),'utf8')}`);
  app.close();rmSync(dir,{recursive:true,force:true});
 }catch(e){app.close();throw e;}
}
const report={actualProcesses:true,iterations:20,cancelRequestsPerRun:150,states:outcomes,passed:outcomes.every(x=>x==='cancelled')};
writeFileSync(join(root,'docs/acceptance/cancellation-stress.json'),JSON.stringify(report,null,2)+'\n');
console.log('cancellation race stress: 20/20 observed cancelled');
