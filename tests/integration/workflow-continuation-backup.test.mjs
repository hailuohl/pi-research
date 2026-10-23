import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {createDataBackup,restoreDataBackup} from '../../dist/packages/storage/backup.js';
const USER={type:'user'};

test('backup rejects pending workflow work and restored terminal bindings never enqueue another notice',async()=>{
 const parent=mkdtempSync(join(tmpdir(),'pi-workflow-backup-')),data=join(parent,'data'),backup=join(parent,'backup'),destination=join(parent,'restored');let app=new ResearchApp(data,process.cwd()),restored;
 try{
  const project=app.projects.create(USER,{name:'UNIT workflow backup'}),session=app.sessions.create(USER,project.id,{title:'UNIT fixed workflow'}),brief=app.researchBriefs.save(USER,project.id,session.id,{question:'UNIT workflow backup',scope:'Software only',constraints:[],successCriteria:['Preserve history'],clarificationQuestions:[],literatureSummary:'',hypotheses:[],evidenceIds:[],steps:[{title:'Inspect',description:'Inspect fixture'}],status:'ready',expectedRevisionId:null}),input={sourceKind:'brief',sourceId:brief.id,sourceDigest:brief.digest,expectedVersion:brief.version},options={projectId:project.id,sessionId:session.id,idempotencyKey:'confirm'};
  const receipt=app.operations.execute(USER,'workflow_confirm',input,options);app.close();app=undefined;
  await assert.rejects(createDataBackup(data,backup,{offline:true}),{code:'BACKUP_BUSY'});
  app=new ResearchApp(data,process.cwd());const original=app.store.get('workflow-continuation',receipt.id);app.workflowContinuations.fail(app.store.get('message',original.initialMessageId),'WORKFLOW_MODEL_UNAVAILABLE');const saved=app.store.get('workflow-continuation',receipt.id);app.close();app=undefined;
  await createDataBackup(data,backup,{offline:true});await restoreDataBackup(backup,destination,{offline:true,relocate:true});restored=new ResearchApp(destination,process.cwd());
  assert.deepEqual(restored.store.get('workflow-continuation',receipt.id),saved);assert.equal(restored.store.get('message',saved.initialMessageId).status,'cancelled');assert.equal(restored.store.get('research-brief',brief.id).status,'confirmed');
  const replay=restored.operations.execute(USER,'workflow_confirm',input,{...options,idempotencyKey:'after-restore'});assert.equal(replay.id,receipt.id);assert.equal(replay.reasonCode,'WORKFLOW_MODEL_UNAVAILABLE');assert.equal(restored.store.list('workflow-continuation').length,1);assert.equal(restored.store.list('message').length,1);
 }finally{app?.close();restored?.close();rmSync(parent,{recursive:true,force:true});}
});
