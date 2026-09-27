import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {buildSessionOptions} from '../../dist/packages/pi-adapter/options.js';
import {inspectPi, locatePi, piFailure} from '../../dist/packages/pi-adapter/runtime.js';
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

test('installed real SDK creates isolated session and reopens the exact native file offline', {skip: !locatePi(repoRoot) && 'SDK absent; install locked dependencies for offline SDK contract'}, async () => {
    const installed = locatePi(repoRoot);
    const sdk = await import(pathToFileURL(installed.sdkPath).href);
    const {Type} = await import(pathToFileURL(installed.aiPath).href);
    const home = mkdtempSync(join(tmpdir(), 'pi-sdk-contract-'));
    let session;
    try {
        const cwd = join(home, 'workspace'), agentDir = join(home, 'agent'), sessionDir = join(home, 'sessions');
        for (const dir of [cwd, agentDir, sessionDir]) mkdirSync(dir);
        writeFileSync(join(cwd, 'AGENTS.md'), 'POISON: unexpected workspace instructions');
        const runtime = await sdk.ModelRuntime.create({authPath: join(agentDir, 'auth.json'), modelsPath: join(home, 'models.json'), allowModelNetwork: false, refreshOnCreate: false});
        const model = runtime.getModels().find(m => m.provider === 'anthropic');
        assert.ok(model, 'pinned SDK has its static model catalog');
        const setup = {cwd, agentDir, sessionDir, sessionFile: null, systemPrompt: 'trusted only', thinking: 'off'};
        const damaged = join(sessionDir, 'damaged.jsonl');
        for (const content of ['', '{broken json\n', '{"type":"message","id":"not-a-session"}\n', JSON.stringify({type: 'session', version: 3, id: 'valid-header', cwd, timestamp: new Date().toISOString()}) + '\n{broken tail\n']) {
            writeFileSync(damaged, content);
            assert.throws(() => buildSessionOptions(sdk, {...setup, sessionFile: damaged}, [], runtime, model), /PI_SESSION_INVALID/);
            assert.equal(readFileSync(damaged, 'utf8'), content, 'rejected original bytes must not be repaired or replaced');
        }
        assert.throws(() => buildSessionOptions(sdk, {...setup, sessionFile: join(sessionDir, 'missing.jsonl')}, [], runtime, model), /PI_SESSION_NOT_FOUND/);
        const customTools = [{name: 'contract_read', label: 'contract_read', description: 'offline check', parameters: Type.Object({}), execute: async () => ({content: [{type: 'text', text: 'offline'}], details: {}})}];
        const options = buildSessionOptions(sdk, setup, customTools, runtime, model);
        ({session} = await sdk.createAgentSession(options));
        assert.deepEqual(session.getActiveToolNames(), ['contract_read']);
        assert.deepEqual(options.resourceLoader.getAgentsFiles().agentsFiles, []);
        assert.equal(options.resourceLoader.getSystemPrompt(), 'trusted only');
        // This synthetic persistence fixture is an offline contract check, never live evidence.
        options.sessionManager.appendMessage({role: 'assistant', content: [{type: 'text', text: 'OFFLINE FIXTURE'}], api: model.api, provider: model.provider, model: model.id, stopReason: 'stop', timestamp: Date.now(), usage: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: {input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0}}});
        const exact = session.sessionFile, id = session.sessionId;
        assert.ok(existsSync(exact));
        session.dispose(); session = undefined;
        const restored = buildSessionOptions(sdk, {...setup, sessionFile: exact}, customTools, runtime, model);
        ({session} = await sdk.createAgentSession(restored));
        assert.equal(session.sessionFile, exact);
        assert.equal(session.sessionId, id);
        assert.equal(restored.sessionManager.getEntries().filter(e => e.type === 'message').length, 1);
        assert.deepEqual(session.getActiveToolNames(), ['contract_read']);
    } finally { session?.dispose(); rmSync(home, {recursive: true, force: true}); }
});

test('Pi distinguishes incomplete installation, versions, model configuration, auth, permission and provider failures', () => {
    const home = mkdtempSync(join(tmpdir(), 'pi-errors-'));
    try {
        assert.equal(inspectPi(home, {}).code, 'PI_NOT_INSTALLED');
        for (const name of ['pi-coding-agent', 'pi-ai']) {
            const dir = join(home, 'node_modules', '@earendil-works', name); mkdirSync(dir, {recursive: true});
            writeFileSync(join(dir, 'package.json'), JSON.stringify({name: `@earendil-works/${name}`, version: '0.87.1', main: 'index.js'}));
            writeFileSync(join(dir, 'index.js'), '');
        }
        assert.equal(inspectPi(home, {}).code, 'MODEL_NOT_CONFIGURED');
        const legacy = join(home, '.pi-runtime', 'node_modules', '@earendil-works', 'pi-coding-agent');
        mkdirSync(legacy, {recursive: true});
        writeFileSync(join(legacy, 'package.json'), '{broken legacy install');
        assert.equal(locatePi(home).base, home, 'locked root SDK wins over broken legacy runtime');
        assert.equal(inspectPi(home, {}).code, 'MODEL_NOT_CONFIGURED');
        writeFileSync(join(home, 'node_modules', '@earendil-works', 'pi-ai', 'package.json'), JSON.stringify({version: '0.87.0', main: 'index.js'}));
        assert.equal(inspectPi(home, {}).code, 'PI_VERSION_MISMATCH');
        rmSync(join(home, 'node_modules', '@earendil-works', 'pi-ai', 'package.json'));
        assert.equal(inspectPi(home, {}).code, 'PI_INSTALL_INCOMPLETE');
        assert.match(piFailure(new Error('401 invalid API key')), /^AUTH_FAILED:/);
        assert.match(piFailure(new Error('SCOPE_DENIED: forbidden tool')), /^PERMISSION_DENIED:/);
        assert.match(piFailure(new Error('503 upstream unavailable')), /^PROVIDER_FAILED:/);
        assert.match(piFailure(new Error('MODEL_NOT_FOUND: absent')), /^MODEL_NOT_FOUND:/);
    } finally { rmSync(home, {recursive: true, force: true}); }
});

