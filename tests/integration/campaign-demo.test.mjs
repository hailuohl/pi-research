import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,mkdtempSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {ResearchApp} from '../../dist/packages/research-app.js';
test('Four actual numerical runs traverse durable Refill and Promote rounds, then Stop',async()=>{
 assert.ok(existsSync('dist/apps/cli/campaign-demo.js'),'actual campaign demo must exist');
 const {campaignDemo}=await import('../../dist/apps/cli/campaign-demo.js'),dir=mkdtempSync(join(tmpdir(),'pi-demo-campaign-'));let app=new ResearchApp(dir,process.cwd());try{
 const result=await campaignDemo(app);assert.equal(result.aiUsed,false);assert.equal(result.runs.length,4);assert.ok(result.runs.every(r=>r.state==='succeeded'&&r.integrity==='complete'&&Number.isFinite(r.metrics.mse)));
 assert.equal(result.campaign.state,'stopped');assert.equal(result.rounds.length,2);assert.deepEqual(result.decisions.map(d=>d.action),['refill','promote','stop']);assert.ok(result.decisions.every(d=>d.status==='applied'));
 const child=app.store.get('experiment',result.nextExperimentId);assert.equal(child.parentId,result.retainedExperimentId);assert.equal(result.rounds[1].parentExperimentId,result.retainedExperimentId);assert.equal(result.observations.length,4);assert.ok(result.observations.every(o=>o.validation==='verified'));
 const count=app.store.list('run').length;app.close();app=new ResearchApp(dir,process.cwd());app.campaigns.observe();app.wakeups.reconcile();assert.equal(app.store.list('run').length,count);assert.equal(app.store.list('run-observation').length,4);assert.equal(app.store.list('campaign-decision').length,3);assert.equal(app.store.list('model-usage').length,0);
 }finally{app.close();rmSync(dir,{recursive:true,force:true});}
});
