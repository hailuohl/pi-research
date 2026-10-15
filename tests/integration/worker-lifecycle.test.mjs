import {Store} from '../../dist/packages/storage/store.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createServer} from 'node:http';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const result = outcome => ({summary: 'Offline lifecycle fixture', outcome, evidenceIds: [], artifactIds: [], claims: [], unresolvedQuestions: []});

// Exercise the actual pinned SDK and production worker over child IPC. The only
// model is this loopback SSE server; keys, user config and network refresh are absent.
async function runWorker({outcome = 'completed', rejectFirst = false, controls = false, mode = 'submit', contextReads = 0, reopen = false} = {}) {
    const home = mkdtempSync(join(tmpdir(), 'pi-worker-lifecycle-'));
    const store=new Store(join(home,'state.db'));store.close();
    const events = [], requests = [], toolCalls = [];
    let child, stderr = '', timer, continuing = false;
    const server = createServer(async (req, res) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        requests.push(JSON.parse(body));
        if (mode === 'error') { res.writeHead(503, {'content-type': 'application/json'}); res.end(JSON.stringify({error: {message: 'Offline provider failure'}})); return; }
        if (mode === 'abort') { child.send({type: 'abort'}); return; }
        res.writeHead(200, {'content-type': 'text/event-stream'});
        if (continuing) {
            res.end(`data: ${JSON.stringify({id: 'continued', object: 'chat.completion.chunk', created: 1, model: 'fixture', choices: [{index: 0, delta: {role: 'assistant', content: 'Continued from saved history.'}, finish_reason: 'stop'}]})}\n\ndata: [DONE]\n\n`);
            return;
        }
        const tool = requests.length <= contextReads ? 'task_context_read' : 'task_result_submit';
        const input = tool === 'task_context_read' ? {} : {...result(outcome), ...(rejectFirst && requests.length > 1 ? {summary: 'Corrected offline submission'} : {})};
        const chunk = (delta, finish_reason = null) => res.write(`data: ${JSON.stringify({id: `fixture-${requests.length}`, object: 'chat.completion.chunk', created: 1, model: 'fixture', choices: [{index: 0, delta, finish_reason}]})}\n\n`);
        chunk({role: 'assistant', tool_calls: [{index: 0, id: `call-${requests.length}`, type: 'function', function: {name: tool, arguments: JSON.stringify({input})}}]});
        chunk({}, 'tool_calls');
        res.end('data: [DONE]\n\n');
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        for (const dir of ['workspace', 'agent', 'sessions']) mkdirSync(join(home, dir));
        const modelsPath = join(home, 'models.json');
        writeFileSync(modelsPath, JSON.stringify({providers: {'offline-fixture': {api: 'openai-completions', baseUrl: `http://127.0.0.1:${server.address().port}/v1`, apiKey: 'offline-dummy', models: [{id: 'fixture', contextWindow: 32768, maxTokens: 1024}]}}}));
        const env = {PI_OFFLINE: '1', HOME: home, USERPROFILE: home, APPDATA: home, LOCALAPPDATA: home};
        for (const key of ['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP']) if (process.env[key]) env[key] = process.env[key];
        const execute = async (piSessionPath = null) => {
        const requestStart = requests.length, eventStart = events.length, toolStart = toolCalls.length;
        child = fork(join(repoRoot, 'dist/apps/agent-worker/index.js'), [], {cwd: repoRoot, env, silent: true});
        child.stderr.on('data', chunk => { stderr += chunk; });
        child.stdout.resume();
        const ended = new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`worker timeout: ${stderr}\n${JSON.stringify(events)}`)), 25000);
            child.once('error', reject);
            child.once('exit', (code, signal) => code === 0 ? resolve() : reject(new Error(`worker exited ${code}/${signal}: ${stderr}`)));
        });
        child.on('message', message => {
            events.push(message);
            if (message.type !== 'tool') return;
            toolCalls.push(message);
            if (controls && toolCalls.length === 1) {
                child.send({type: 'steer', content: 'queued steering fixture', messageId: 'before-steer'});
                child.send({type: 'follow_up', content: 'queued follow-up fixture', messageId: 'before-follow'});
            }
            const rejected = rejectFirst && toolCalls.length === 1;
            child.send({type: 'tool_response', requestId: message.requestId, ...(rejected ? {error: {code: 'INVALID_INPUT', message: 'Offline rejection; correct and retry'}} : {result: {accepted: true, outcome}})});
            if (controls && !rejected) {
                child.send({type: 'steer', content: 'late steering fixture', messageId: 'after-steer'});
                child.send({type: 'follow_up', content: 'late follow-up fixture', messageId: 'after-follow'});
            }
        });
        child.send({type: 'start', dataDir:home,repoRoot, workspace: join(home, 'workspace'), agentDir: join(home, 'agent'), sessionDir: join(home, 'sessions'), modelsPath, piSessionPath, role: 'implementer', model: {provider: 'offline-fixture', model: 'fixture', thinking: 'off'}, prompt: continuing ? 'Continue from the saved history.' : 'Offline fixture: submit a result.', history: null, tools: ['task_result_submit', 'task_context_read'].map(name => ({name, ...TOOL_DEFINITIONS[name]}))});
        await ended;
        clearTimeout(timer);
        const ready = events.slice(eventStart).find(e => e.type === 'ready');
        const native = ready ? readFileSync(ready.sessionFile, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line)) : [];
        return {events: events.slice(eventStart), requests: requests.slice(requestStart), toolCalls: toolCalls.slice(toolStart), native};
        };
        const run = await execute();
        if (reopen) {
            continuing = true;
            return {...run, resumed: await execute(run.events.find(e => e.type === 'ready').sessionFile)};
        }
        return run;
    } finally {
        clearTimeout(timer);
        if (child && child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); }
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
        rmSync(home, {recursive: true, force: true});
    }
}

for (const outcome of ['completed', 'partial', 'blocked']) {
    test(`actual worker gracefully ends accepted ${outcome} submit with queued controls`, async () => {
        const run = await runWorker({outcome, controls: true});
        assert.deepEqual(run.events.filter(e => ['done', 'failure'].includes(e.type)).map(e => ({type: e.type, aborted: e.aborted})), [{type: 'done', aborted: false}], JSON.stringify(run.events));
        assert.equal(run.requests.length, 1, 'accepted receipt must prevent any subsequent provider turn');
        assert.equal(run.toolCalls.length, 1);
        assert.equal(run.events.filter(e => e.type === 'message_ack' && e.messageId.startsWith('before-')).length, 2, 'controls really reached SDK queues before submission');
        assert.equal(run.events.some(e => e.type === 'assistant_message' && ['error', 'aborted'].includes(e.stopReason)), false);
        const receipts = run.native.filter(e => e.type === 'message' && e.message.role === 'toolResult');
        assert.equal(receipts.length, 1, 'successful tool receipt must survive in native JSONL');
        assert.equal(receipts[0].message.toolCallId, run.toolCalls[0].toolCallId);
        assert.equal(receipts[0].message.isError, false);
        assert.equal(JSON.parse(receipts[0].message.content[0].text).outcome, outcome);
        assert.equal(run.native.some(e => e.message?.role === 'assistant' && ['error', 'aborted'].includes(e.message.stopReason)), false);
    });
}

test('rejected submit remains recoverable and only accepted retry ends the real worker', async () => {
    const run = await runWorker({rejectFirst: true});
    assert.equal(run.requests.length, 2, JSON.stringify(run.events));
    assert.equal(run.toolCalls.length, 2);
    assert.equal(run.toolCalls[1].input.summary, 'Corrected offline submission');
    assert.equal(run.events.find(e => e.type === 'done')?.aborted, false);
    const receipts = run.native.filter(e => e.message?.role === 'toolResult');
    assert.deepEqual(receipts.map(e => e.message.isError), [true, false]);
    assert.match(JSON.stringify(run.requests[1]), /Offline rejection/);
});

test('actual provider error remains a worker failure', async () => {
    const run = await runWorker({mode: 'error'});
    assert.equal(run.events.some(e => e.type === 'done'), false);
    assert.match(run.events.find(e => e.type === 'failure')?.error ?? '', /PROVIDER_FAILED/);
});

test('host abort remains aborted and cannot become successful completion', async () => {
    const run = await runWorker({mode: 'abort'});
    assert.equal(run.events.find(e => e.type === 'done')?.aborted, true, JSON.stringify(run.events));
    assert.equal(run.toolCalls.length, 0);
});

test('actual worker completes beyond 12 turns and 40 tools, then reopens the same native history', async () => {
    const run = await runWorker({contextReads: 45, reopen: true});
    assert.deepEqual(run.events.filter(e => ['done', 'failure'].includes(e.type)).map(e => ({type: e.type, aborted: e.aborted})), [{type: 'done', aborted: false}], JSON.stringify(run.events));
    assert.equal(run.requests.length, 46, '45 context reads and accepted submit must all reach the provider');
    assert.deepEqual(run.toolCalls.map(e => e.tool), [...Array(45).fill('task_context_read'), 'task_result_submit']);
    assert.equal(run.events.filter(e => e.type === 'tool_execution_end').length, 46);
    assert.ok(run.events.filter(e => e.type === 'tool_execution_end').every(e => e.isError === false));
    assert.equal(run.events.some(e => e.type === 'assistant_message' && e.error), false);
    const receipts = run.native.filter(e => e.message?.role === 'toolResult');
    assert.equal(receipts.length, 46);
    assert.ok(receipts.every(e => e.message.isError === false));
    assert.deepEqual(receipts.map(e => e.message.toolCallId), run.toolCalls.map(e => e.toolCallId));
    assert.equal(JSON.parse(receipts.at(-1).message.content[0].text).accepted, true);
    assert.deepEqual(run.resumed.events.filter(e => ['done', 'failure'].includes(e.type)).map(e => ({type: e.type, aborted: e.aborted})), [{type: 'done', aborted: false}]);
    assert.equal(run.resumed.requests.length, 1);
    assert.equal(run.resumed.toolCalls.length, 0);
    assert.deepEqual(run.resumed.native.slice(0, run.native.length), run.native);
    assert.match(JSON.stringify(run.resumed.requests[0]), /call-45/);
    assert.match(JSON.stringify(run.resumed.requests[0]), /call-46/);
    assert.equal(run.resumed.events.find(e => e.type === 'ready').sessionFile, run.events.find(e => e.type === 'ready').sessionFile);
    assert.equal(run.resumed.events.find(e => e.type === 'ready').sessionId, run.events.find(e => e.type === 'ready').sessionId);
});
