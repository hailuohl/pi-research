import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createHttpServer } from '../../dist/apps/server/http.js';
import { USER } from '../../dist/packages/domain/types.js';
import { ToolDispatcher } from '../../dist/packages/research-tools/dispatcher.js';

test('HTTP and CLI operations share strict contracts, owner scope and idempotency', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pi-operations-'));
    const server = createHttpServer({ dataDir: dir, repoRoot: process.cwd(), port: 0 });
    const port = await server.listen();
    const request = async (path, body, key = randomUUID()) => {
        const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
            method: body === undefined ? 'GET' : 'POST',
            headers: {  'Content-Type': 'application/json', ...(key === null ? {} : { 'Idempotency-Key': key }) },
            ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        return { status: response.status, value: await response.json() };
    };
    const cli = (...args) => spawnSync(process.execPath, ['dist/apps/cli/index.js', ...args, '--data', dir], { encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1' }, timeout: 15000 });
    try {
        const app = server.app, project = app.projects.create(USER, { name: 'Operations', template: 'curve-fit' });
        const specs = await request('/operations');
        assert.equal(specs.status, 200);
        assert.deepEqual(specs.value.map(s => s.id).sort(), Object.keys(TOOL_DEFINITIONS).sort());
        const httpBefore = await request('/operations/model_http_inspect', {projectId:project.id,input:{limit:10}}, null);
        assert.equal(httpBefore.status,200,JSON.stringify(httpBefore.value));
        assert.equal(httpBefore.value.unit,'pi-http-request');
        assert.equal(httpBefore.value.configuration.maxRequests,2);
        assert.equal(httpBefore.value.items.length,0);
        const httpConfig = await request('/operations/model_http_configure', {projectId:project.id,input:{expectedVersion:httpBefore.value.configuration.version,maxRequests:1}});
        assert.equal(httpConfig.status,200,JSON.stringify(httpConfig.value));
        assert.equal(httpConfig.value.configuration.maxRequests,1);
        const httpCli = cli('operation','model_http_inspect','--project',project.id,'--input','{}');
        assert.equal(httpCli.status,0,httpCli.stderr);
        assert.equal(JSON.parse(httpCli.stdout).configuration.maxRequests,1);
        const httpNoKey = await request('/operations/model_http_configure',{projectId:project.id,input:{expectedVersion:httpConfig.value.configuration.version,maxRequests:2}},null);
        assert.equal(httpNoKey.value.error.code,'OPERATION_ID_REQUIRED');
        const session = app.sessions.create(USER, project.id, {});
        app.store.update('session', session.id, session.version, {state: 'running', generation: 1, leaseUntil: Date.now() + 60000});
        const tools = new ToolDispatcher(app), agent = {type: 'agent', projectId: project.id, sessionId: session.id, role: 'coordinator', generation: 1};
        for (const spec of specs.value) {
            const http = await request(`/operations/${spec.id}`, {projectId: project.id, sessionId: session.id, input: {unexpected: true}});
            const command = cli('operation', spec.id, '--project', project.id, '--session', session.id, '--input', '{"unexpected":true}');
            let toolError;
            try {await tools.execute(agent, spec.id, {unexpected:true}, `invalid-${spec.id}`);} catch (error) {toolError = {code: error.code, message: error.message};}
            assert.equal(http.status, 400);
            assert.equal(command.status, 1);
            assert.deepEqual(JSON.parse(command.stderr).error, http.value.error, spec.id);
            // Owner-only operations reject Agents before validating inputs; other tools retain HTTP/CLI schema parity.
            if(/^(text_corpus_grant_|discovery_grant_|run_grant_|working_grant_|report_|compute_|agent_capacity_|session_(list|view|message_read)$|model_http_|document_(?!page_image_read$)|literature_task_|skill_|publication_(configure|submit|cancel)$)/.test(spec.id)||spec.id==='research_brief_confirm'||spec.id==='run_list'||['campaign_plan_inspect','campaign_candidate_prepare','campaign_candidate_attach','campaign_comparison','local_runtime_configure','gpu_target_probe','ssh_target_configure','ssh_target_probe'].includes(spec.id))assert.equal(toolError.code,'TOOL_DENIED',spec.id);
            else assert.deepEqual(toolError, http.value.error, spec.id);
        }
        // Use valid arguments and matching, live role identities to test the permission boundary.
        for (const role of ['literature','designer','implementer','analyst','reviewer','writer']) {
            const restricted = app.sessions.create(USER, project.id, {}, {role});
            app.store.update('session', restricted.id, restricted.version, {state:'running',generation:1,leaseUntil:Date.now()+60000});
            await assert.rejects(tools.execute({...agent,sessionId:restricted.id,role}, 'document_page_image_read', TOOL_DEFINITIONS.document_page_image_read.example, 'restricted-document-image-'+role), {code:'TOOL_DENIED'});
        }
        const key = randomUUID(), input = { source: 'project', path: 'operation.txt', content: 'shared', expectedDigest: null };
        const envelope = { projectId: project.id, input };
        const written = await request('/operations/workspace_write', envelope, key);
        assert.equal(written.status, 200, JSON.stringify(written.value));
        const replay = cli('operation', 'workspace_write', '--project', project.id, '--input', JSON.stringify(input), '--key', key);
        assert.equal(replay.status, 0, replay.stderr);
        assert.deepEqual(JSON.parse(replay.stdout), written.value);
        const conflict = await request('/operations/workspace_write', { ...envelope, input: { ...input, content: 'different' } }, key);
        assert.equal(conflict.value.error.code, 'IDEMPOTENCY_CONFLICT');
        const read = await request('/operations/workspace_read', { projectId: project.id, input: { source: 'project', path: input.path } }, null);
        assert.equal(read.status, 200, JSON.stringify(read.value));
        assert.equal(read.value.content, 'shared');
        for (const extra of [{ actor: { kind: 'agent' } }, { lease: 'forged' }, { legacy: {} }]) {
            const rejected = await request('/operations/workspace_write', { ...envelope, ...extra });
            assert.equal(rejected.value.error.code, 'INVALID_INPUT');
        }
        for (const path of ['/run-intents', '/operations/run_prepare']) {
            const input = { experimentId: 'missing', surprise: true };
            const rejected = await request(path, path.startsWith('/operations/') ? { projectId: project.id, input } : input);
            assert.equal(rejected.value.error.code, 'INVALID_INPUT');
        }
        const invalid = cli('operation', 'workspace_read', '--project', project.id, '--input', '{');
        assert.equal(invalid.status, 1);
        assert.equal(JSON.parse(invalid.stderr).error.code, 'INVALID_JSON');
        const invalidRequest = cli('request', 'POST', '/projects', '--body', '{');
        assert.equal(invalidRequest.status, 1);
        assert.equal(JSON.parse(invalidRequest.stderr).error.code, 'INVALID_JSON');
        const paper = cli('paper', 'invalid', '--project', project.id, '--source', 'made-up');
        assert.equal(paper.status, 1);
        assert.equal(JSON.parse(paper.stderr).error.code, 'INVALID_INPUT');

        const legacyBody = { path: 'legacy.txt', content: 'historic', expectedDigest: null }, legacyKey = randomUUID();
        const historic = app.store.operation(`POST:/projects/${project.id}/files`, legacyKey, { body: legacyBody, query: '' }, () => app.projects.writeFile(USER, project.id, legacyBody.path, legacyBody.content, null));
        const oldReplay = await request(`/projects/${project.id}/files`, legacyBody, legacyKey);
        assert.equal(oldReplay.status, 200, JSON.stringify(oldReplay.value));
        assert.deepEqual(oldReplay.value, historic);
        const oldConflict = await request(`/projects/${project.id}/files`, { ...legacyBody, content: 'changed' }, legacyKey);
        assert.equal(oldConflict.value.error.code, 'IDEMPOTENCY_CONFLICT');

        const experiment = app.experiments.create(USER, project.id, { title: 'contract experiment', hypothesis: 'workflow check' });
        const prepareBody = { experimentId: experiment.id }, prepareKey = randomUUID();
        const oldIntent = app.store.operation('POST:/run-intents', prepareKey, { body: prepareBody, query: '' }, () => app.runs.prepare(USER, experiment.id));
        const intentReplay = await request('/run-intents', prepareBody, prepareKey);
        assert.equal(intentReplay.status, 200, JSON.stringify(intentReplay.value));
        assert.equal(intentReplay.value.id, oldIntent.id);
        assert.equal(app.store.list('run-intent', project.id).length, 1);
        const other = app.projects.create(USER, { name: 'Other' });
        const queuedAt = '2026-09-29T00:00:00.000Z';
        app.store.create('model-http-request', other.id, {sessionId:'foreign-session',provider:'openai',model:'foreign-model',state:'succeeded',queuedAt}, 'foreign-http');
        app.store.create('model-http-request', project.id, {sessionId:session.id,provider:'openai',model:'local-model',state:'succeeded',queuedAt}, 'local-http');
        const scopedHttp = await request('/operations/model_http_inspect', {projectId:project.id,input:{limit:1}}, null);
        assert.equal(scopedHttp.status,200,JSON.stringify(scopedHttp.value));
        assert.deepEqual(scopedHttp.value.items.map(item=>item.id),['local-http']);
        assert.equal(scopedHttp.value.nextCursor,null);
        const denied = await request('/operations/run_prepare', { projectId: other.id, input: prepareBody });
        assert.equal(denied.value.error.code, 'SCOPE_DENIED');
    } finally {
        await server.close();
        rmSync(dir, { recursive: true, force: true });
    }
});
