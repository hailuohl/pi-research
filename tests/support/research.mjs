import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';
export {USER};
export function setup(){
 const dir=mkdtempSync(join(tmpdir(),'pi-v02-'));const app=new ResearchApp(dir,process.cwd());
 const project=app.projects.create(USER,{name:'Campaign测试',template:'curve-fit'});
 const session=app.sessions.create(USER,project.id,{title:'主协调者'});
 const baseline=app.experiments.create(USER,project.id,{title:'基线',hypothesis:'固定数值协议测试'});
 return {dir,app,project,session,baseline,close(){this.app.close();rmSync(dir,{recursive:true,force:true});}};
}
export function approve(app,id){const a=app.store.get('approval',id);return app.approvals.decide(USER,id,a.version,true);}
export function campaign(s,overrides={}){assertService(s);const c=s.app.campaigns.create(USER,s.project.id,{goal:'验证持久化研究流程',rootSessionId:s.session.id,baselineExperimentId:s.baseline.id,...overrides});approve(s.app,c.approvalId);return s.app.campaigns.activate(USER,c.id,c.version);}
function assertService(s){if(!s.app.campaigns) throw new Error('CampaignService is not implemented');}
export function enroll(s,c,e=s.baseline){const i=s.app.runs.prepare(USER,e.id);const current=s.app.campaigns.get(USER,c.id);s.app.campaigns.enroll(USER,c.id,{intentId:i.id,expectedVersion:current.version});return i;}
export function submit(s,i){approve(s.app,i.approvalId);return s.app.runs.submit(USER,i.id);}
/** Deterministic UNIT-TEST data only. Integration tests execute the actual program. */
export function fixtureFinish(s,r,metrics={mse:0.1},state='succeeded'){
 if(metrics){metrics={r2:0.9,train_mse:0.1,...metrics};const outputDir=s.app.store.paths.physical(r.outputDir);writeFileSync(join(outputDir,'model.json'),'{}');writeFileSync(join(outputDir,'metrics.json'),JSON.stringify(metrics));writeFileSync(join(outputDir,'predictions.csv'),'x,y\n0,0\n');}
 return s.app.runs.finalize(r.id,state==='succeeded'?0:1,state,'unit-test fixture');
}
export async function waitRun(s,id){for(let i=0;i<250;i++){s.app.runs.reconcile();s.app.runs.launchPending();const r=s.app.runs.get(USER,id);if(['succeeded','failed','cancelled'].includes(r.state))return r;await new Promise(r=>setTimeout(r,30));}throw new Error('Run timeout');}
