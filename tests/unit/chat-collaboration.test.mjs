import test from 'node:test';
import assert from 'node:assert/strict';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {ToolDispatcher} from '../../dist/packages/research-tools/dispatcher.js';
import {setup, approve, USER} from '../support/research.mjs';
import {actor, result} from '../support/collaboration.mjs';

test('chat task reads the live toggle, submits an approval-bound plan and returns results to its original session', async () => {
  const s = setup();
  try {
    s.app.projects.settings(USER,s.project.id,{expectedVersion:s.project.version,enabled:false});
    const other = s.app.sessions.create(USER, s.project.id, {title: '另一会话'});
    const message = s.app.sessions.send(USER, s.session.id, {content: '核查现有资料中的缺失项，返回核查结果。'});
    const root = s.app.sessions.get(USER, s.session.id);
    s.app.store.update('session', root.id, root.version, {state: 'running', generation: 1, leaseUntil: Date.now() + 120000});
    const coordinator = {type: 'agent', projectId: s.project.id, sessionId: root.id, generation: 1, role: 'coordinator'};
    const tools = new ToolDispatcher(s.app);
    let serial = 0;
    const call = (name, input = {}) => tools.execute(coordinator, name, input, `chat-toggle-${++serial}`);
    const plan = {goal: message.content, tasks: [{key: 'check', role: 'analyst', objective: message.content, dependencies: []}], budget: 3, autoSummarize: true};
    assert.equal((await call('project_inspect')).project.collaborationEnabled, false);
    await assert.rejects(call('collaboration_plan_submit', plan), {code: 'MULTI_AGENT_DISABLED'});
    assert.equal(s.app.store.list('team').length, 0);
    assert.equal(s.app.store.list('session').length, 2);

    let project = s.app.projects.get(USER, s.project.id);
    s.app.projects.settings(USER, project.id, {expectedVersion: project.version, enabled: true});
    assert.equal((await call('project_inspect')).project.collaborationEnabled, true);
    const team = await call('collaboration_plan_submit', plan);
    assert.equal(team.goal, message.content);
    assert.equal(team.rootSessionId, root.id);
    assert.equal(team.autoSummarize, true);
    assert.equal(team.state, 'awaiting_approval');
    assert.equal(s.app.teams.claim(team.id), null);
    assert.throws(() => s.app.teams.activate(USER, team.id), {code: 'APPROVAL_REQUIRED'});
    approve(s.app, team.approvalId);
    s.app.teams.activate(USER, team.id);
    const claimed = s.app.teams.claim(team.id);
    const summary = 'Deterministic fixture: required data is absent; no measurement performed.';
    s.app.teams.submit(actor(claimed), result({summary}));
    s.app.wakeups.reconcile();
    const wakeup = s.app.wakeups.list(USER, project.id).find(w => w.ownerId === team.id);
    assert.equal(wakeup.rootSessionId, root.id);
    assert.equal(wakeup.automatic, true);
    assert.equal(s.app.sessions.messages(USER, other.id).length, 0);
    assert.ok(s.app.sessions.messages(USER, root.id).some(m => m.role === 'system' && m.content.includes('已验收')));

    project = s.app.projects.get(USER, project.id);
    s.app.projects.settings(USER, project.id, {expectedVersion: project.version, enabled: false});
    assert.equal((await call('project_inspect')).project.collaborationEnabled, false);
    s.app.close();
    s.app = new ResearchApp(s.dir, process.cwd());
    assert.equal(s.app.projects.get(USER, project.id).settings.enabled, false);
    assert.equal(s.app.teams.get(USER, team.id).state, 'completed');
    assert.equal(s.app.teams.tasks(USER, team.id)[0].result.summary, summary);
    assert.equal(s.app.store.get('message', message.id).content, message.content);
    assert.equal(s.app.sessions.messages(USER, other.id).length, 0);
  } finally { s.close(); }
});
