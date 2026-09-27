import test from 'node:test';
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const enabled = process.env.PI_LIVE_TEST === '1';
const configured = ['PI_PROVIDER', 'PI_MODEL', 'PI_API_KEY'].every(key => process.env[key]?.trim());
const reason = !enabled ? 'NOT EXECUTED: set PI_LIVE_TEST=1 to authorize real billable SDK requests' : !configured ? 'NOT EXECUTED: PI_PROVIDER, PI_MODEL and PI_API_KEY are required; personal auth is never read' : false;

test('real pinned Pi worker: tools, stream, steer, usage, exact reopen and abort', {skip: reason, timeout: 240000}, async t => {
    const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
    const home = mkdtempSync(join(tmpdir(), 'pi-research-live-'));
    const workspace = join(home, 'workspace'), agentDir = join(home, 'agent'), sessionDir = join(home, 'sessions');
    for (const dir of [workspace, agentDir, sessionDir]) mkdirSync(dir, {mode: 0o700});
    const token = `live-${Date.now()}`;
    writeFileSync(join(workspace, 'source.txt'), token, {mode: 0o600});
    const model = {provider: process.env.PI_PROVIDER, model: process.env.PI_MODEL, thinking: 'off'};
    const evidence = {sdk: '0.87.1', node: process.versions.node, model, events: [], sessionFile: null, completed: false};
    const evidencePath = resolve(process.env.PI_LIVE_EVIDENCE || join(home, 'evidence.json'));
    const tools = [
        {name: 'live_read', description: 'Read the fixed private source.txt; input must be {}.', example: {}},
        {name: 'live_write', description: 'Write only the private result.txt. Supply input.content equal to the source text.', example: {content: token}}
    ];
    async function run(piSessionPath, abort = false) {
        const events = [];
        const child = fork(join(repoRoot, 'dist/apps/agent-worker/index.js'), [], {
            cwd: workspace, execArgv: [], stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
            env: {PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: home, USERPROFILE: home, PI_API_KEY: process.env.PI_API_KEY, NO_COLOR: '1'}
        });
        let steered = false, aborted = false;
        try {
            return await new Promise((resolveRun, reject) => {
                const timeout = setTimeout(() => { child.kill(); reject(new Error('Live worker timed out')); }, 110000);
                const finish = (error) => { clearTimeout(timeout); error ? reject(error) : resolveRun(events); };
                child.on('error', finish);
                child.on('exit', () => { if (!events.some(e => e.type === 'done' || e.type === 'failure')) finish(new Error('Worker exited without terminal evidence')); });
                child.on('message', event => {
                    // Record only evidence metadata, never credentials or provider error bodies.
                    const record = {type: event.type};
                    for (const key of ['model', 'sessionFile', 'sessionId', 'activeTools', 'usage', 'stopReason', 'aborted', 'tool', 'toolCallId', 'isError', 'messageId']) if (event[key] !== undefined) record[key] = event[key];
                    events.push(record); evidence.events.push(record);
                    if (event.type === 'failure') return finish(new Error(`Live worker failed: ${String(event.error).split(':')[0]}`));
                    if (event.type === 'tool') {
                        try {
                            assert.ok(['live_read', 'live_write'].includes(event.tool), 'only explicit tools are authorized');
                            if (event.tool === 'live_read') {
                                assert.deepEqual(event.input, {});
                                if (!steered) { steered = true; child.send({type: 'steer', content: 'After the authorized write, include STEER_ACK in your final short answer.', messageId: 'live-steer'}); }
                                child.send({type: 'tool_response', requestId: event.requestId, result: {content: readFileSync(join(workspace, 'source.txt'), 'utf8')}});
                            } else {
                                assert.equal(event.input.content, token);
                                assert.deepEqual(Object.keys(event.input), ['content']);
                                writeFileSync(join(workspace, 'result.txt'), event.input.content, {flag: 'wx', mode: 0o600});
                                child.send({type: 'tool_response', requestId: event.requestId, result: {written: true}});
                            }
                        } catch { child.send({type: 'tool_response', requestId: event.requestId, error: {code: 'SCOPE_DENIED', message: 'Live tool input outside explicit grant'}}); }
                    }
                    if (!abort && event.type === 'assistant_message' && event.content?.includes('STEER_ACK')) evidence.steerObserved = true;
                    if (!abort && event.type === 'assistant_message' && /\b4\b/.test(event.content ?? '')) evidence.answerObserved = true;
                    if (abort && event.type === 'delta' && !aborted) { aborted = true; child.send({type: 'abort'}); }
                    if (event.type === 'done') finish();
                });
                child.send({type: 'start', repoRoot, workspace, agentDir, sessionDir, modelsPath: join(home, 'models.json'), piSessionPath,
                    role: 'coordinator', model, tools: abort ? [] : tools, history: null, hostMessages: [],
                    prompt: abort ? 'Write a long numbered list of 500 detailed observations about counting. Do not use tools.' : 'Call live_read with input {}, then live_write exactly once with the returned text as input.content. Then answer briefly: what is 2+2? Follow any subsequent user steering.'});
            });
        } finally { if (child.connected) child.disconnect(); child.kill(); }
    }
    try {
        const first = await run(null);
        const ready = first.find(e => e.type === 'ready');
        assert.deepEqual(ready?.model, {provider: model.provider, id: model.model});
        assert.ok(ready.sessionId);
        assert.deepEqual(ready.activeTools.sort(), ['live_read', 'live_write']);
        assert.ok(ready.sessionFile && existsSync(ready.sessionFile));
        const rel = relative(sessionDir, ready.sessionFile);
        assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel));
        evidence.sessionFile = ready.sessionFile;
        assert.equal(readFileSync(join(workspace, 'result.txt'), 'utf8'), token);
        assert.ok(first.some(e => e.type === 'delta'));
        assert.ok(first.some(e => e.type === 'tool' && e.tool === 'live_read'));
        assert.ok(first.some(e => e.type === 'tool' && e.tool === 'live_write'));
        for (const name of ['live_read', 'live_write']) {
            assert.ok(first.some(e => e.type === 'tool_execution_start' && e.tool === name));
            assert.ok(first.some(e => e.type === 'tool_execution_end' && e.tool === name && e.isError === false));
        }
        assert.ok(first.some(e => e.type === 'message_ack' && e.messageId === 'live-steer'));
        assert.equal(evidence.steerObserved, true);
        assert.equal(evidence.answerObserved, true);
        assert.ok(first.some(e => e.type === 'assistant_message' && e.usage?.totalTokens > 0));
        const before = readFileSync(ready.sessionFile, 'utf8');
        const second = await run(ready.sessionFile, true);
        assert.equal(second.find(e => e.type === 'ready')?.sessionFile, ready.sessionFile);
        assert.equal(second.find(e => e.type === 'ready')?.sessionId, ready.sessionId);
        assert.deepEqual(second.find(e => e.type === 'ready')?.activeTools, []);
        assert.equal(second.find(e => e.type === 'done')?.aborted, true);
        assert.ok(second.some(e => e.type === 'assistant_message' && e.stopReason === 'aborted'));
        assert.ok(readFileSync(ready.sessionFile, 'utf8').startsWith(before), 'exact native session history preserved');
        evidence.completed = true;
    } finally {
        writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), {mode: 0o600});
        t.diagnostic(`Live evidence (no API key): ${evidencePath}`);
    }
});
