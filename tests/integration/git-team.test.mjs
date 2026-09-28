import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {setup,USER} from '../support/research.mjs';
import {startTeam,spec} from '../support/collaboration.mjs';
import {AgentHost} from '../../dist/packages/scheduler/agent-host.js';

const hasGit=spawnSync('git',['--version'],{windowsHide:true}).status===0;
const diagnostics=s=>JSON.stringify(s.app.store.list('git-operation').map(({id,state,error,diagnostic})=>({id,state,error,diagnostic})));
async function prepare(s){const source=s.app.sources.prepare(USER,s.project.id,s.session.id,{experimentId:s.baseline.id,revision:1});s.app.git.enable(USER,s.project.id);await s.app.git.drain(s.project.id);assert.equal(s.app.git.inspect(USER,s.project.id,s.session.id).state,'ready',diagnostics(s));return source;}

test('source-bound Git tasks prepare real worktrees before reserving an attempt or requiring a model',{skip:!hasGit},async()=>{
 const s=setup(),host=new AgentHost(s.app,{inspect:()=>({ready:false,code:'FIXTURE_MODEL_UNAVAILABLE',message:'Fixture: no model calls'})});
 try{const source=await prepare(s),team=startTeam(s,[spec('implement',{role:'implementer'})]),budget=s.app.budget.summary(team.id);
  assert.equal(s.app.teams.claim(team.id),null);const pending=s.app.store.list('git-workspace',s.project.id).find(w=>w.sessionId!==s.session.id);assert.ok(pending);assert.equal(pending.state,'pending');
  assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.deepEqual(s.app.budget.summary(team.id),budget);
  // Startup runs Git preparation even though the model-readiness fixture blocks dispatch.
  host.tick();await s.app.git.drain(s.project.id);host.tick();await s.app.git.drain(s.project.id);
  assert.equal(s.app.store.get('git-workspace',pending.id).state,'ready',diagnostics(s));assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.deepEqual(s.app.budget.summary(team.id),budget);assert.equal(host.active.size,0);
  assert.equal(s.app.teams.claim(team.id,true),null);assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);
  const claimed=s.app.teams.claim(team.id);assert.ok(claimed,diagnostics(s));const session=s.app.store.get('session',claimed.attempt.sessionId),workspace=s.app.store.get('git-workspace',session.id);
  assert.equal(workspace.state,'ready');assert.equal(claimed.attempt.workspace,session.workspace);assert.equal(session.workspace,workspace.path);assert.equal(session.role,'implementer');assert.equal(session.taskId,claimed.task.id);assert.equal(session.sourceRevisionId,source.snapshotId);assert.equal(claimed.context.source.snapshotId,source.snapshotId);assert.equal(claimed.context.source.sourceDigest,source.sourceDigest);
  assert.ok(existsSync(join(session.workspace,'.git')));const git=spawnSync('git',['-C',session.workspace,'rev-parse','--is-inside-work-tree'],{encoding:'utf8',windowsHide:true,timeout:15000});assert.equal(git.status,0,git.stderr);assert.equal(git.stdout.trim(),'true');
  assert.equal(s.app.budget.summary(team.id).reserved,budget.reserved+1);assert.equal(s.app.store.list('task-attempt',s.project.id).length,1);assert.equal(s.app.store.list('model-usage',s.project.id).length,0);
 }finally{await host.stop();s.close();}
});

test('cancelling a pending Git task prevents publication of a ready worktree and consumes no attempt budget',{skip:!hasGit},async()=>{
 const s=setup();try{await prepare(s);const team=startTeam(s,[spec('cancel-before-dispatch',{role:'implementer'})]),budget=s.app.budget.summary(team.id);assert.equal(s.app.teams.claim(team.id),null);
  const task=s.app.teams.tasks(USER,team.id)[0],pending=s.app.store.list('git-workspace',s.project.id).find(w=>w.sessionId!==s.session.id);assert.ok(pending);const priorSession=s.app.store.get('session',pending.sessionId);
  s.app.teams.cancel(USER,task.id);await s.app.git.drain(s.project.id);
  const workspace=s.app.store.get('git-workspace',pending.id),operation=s.app.store.get('git-operation',workspace.operationId);assert.notEqual(workspace.state,'ready',diagnostics(s));assert.equal(operation.error,'TASK_INPUT_STALE',diagnostics(s));assert.equal(s.app.store.get('session',pending.sessionId).workspace,priorSession.workspace);
  assert.equal(s.app.store.list('task-attempt',s.project.id).length,0);assert.deepEqual(s.app.budget.summary(team.id),budget);assert.equal(s.app.teams.claim(team.id),null);assert.equal(s.app.store.list('model-usage',s.project.id).length,0);
 }finally{await s.app.git.stop();s.close();}
});
