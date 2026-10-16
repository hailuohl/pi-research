import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {buildSessionOptions, buildCustomTools} from '../../dist/packages/pi-adapter/options.js';
import {TOOL_DEFINITIONS} from '../../dist/packages/research-tools/definitions.js';
import {inspectPi, locatePi, piFailure} from '../../dist/packages/pi-adapter/runtime.js';
import {safeToolDiagnostic,toolResultDiagnostic,toolFailureMessage} from '../../dist/packages/pi-adapter/tool-diagnostic.js';
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

test('tool diagnostics expose only fixed reasons and static schema paths from the pinned SDK text result',()=>{
 const [tool]=buildCustomTools([{name:'research_brief_save',...TOOL_DEFINITIONS.research_brief_save}],async()=>{});
 const result=text=>({content:[{type:'text',text}],details:{secret:'never public'}});
 assert.deepEqual(toolResultDiagnostic(tool.parameters,result('INVALID_INPUT: $.input.expectedRevisionId: 缺少必需字段')),{code:'INVALID_INPUT',path:'$.input.expectedRevisionId',reason:'缺少必需字段'});
 assert.deepEqual(toolResultDiagnostic(tool.parameters,result('INVALID_INPUT: $.input.steps[0].title: 文本长度超出范围')),{code:'INVALID_INPUT',path:'$.input.steps[0].title',reason:'文本长度超出范围'});
 for(const index of ['16','999999999999999999999999999999999999999999', '1'.repeat(260)])assert.deepEqual(toolResultDiagnostic(tool.parameters,result(`INVALID_INPUT: $.input.steps[${index}].title: 文本长度超出范围`)),{code:'INVALID_INPUT'});
 assert.deepEqual(toolResultDiagnostic(tool.parameters,result('APPROVAL_REQUIRED: private approval details')),{code:'APPROVAL_REQUIRED'});
 for(const text of ['$.input.private-secret-key: 未知字段','$.input.steps[0].private-secret-key: 类型不正确','$.input.expectedRevisionId: private parameter value','$.input.expectedRevisionId\nprivate-secret: 缺少必需字段','$.input.steps[private-secret].title: 文本格式不正确'])assert.deepEqual(toolResultDiagnostic(tool.parameters,result('INVALID_INPUT: '+text)),{code:'INVALID_INPUT'});
 const [dynamic]=buildCustomTools([{name:'run_prepare',...TOOL_DEFINITIONS.run_prepare}],async()=>{});
 assert.deepEqual(safeToolDiagnostic(dynamic.parameters,'INVALID_INPUT','$.input.config.private-secret: 类型不正确'),{code:'INVALID_INPUT'});
 assert.deepEqual(toolResultDiagnostic(tool.parameters,result('VERSION_CONFLICT: private values')),{code:'VERSION_CONFLICT'});
 for(const text of ['VERSION_CONFLICTsuffix','INVALID_INPUTsuffix','APPROVAL_REQUIREDsuffix','private error text'])assert.equal(toolResultDiagnostic(tool.parameters,result(text)),undefined);
 assert.equal(toolResultDiagnostic(tool.parameters,{content:[{type:'text',text:'INVALID_INPUT: $.input: 类型不正确'},{type:'text',text:'private values'}]}),undefined);
});

test('known workflow failures retain safe codes without forwarding private error details',()=>{
 const [tool]=buildCustomTools([{name:'research_brief_save',...TOOL_DEFINITIONS.research_brief_save}],async()=>{});
 for(const code of ['VERSION_CONFLICT','BRIEF_NOT_CONFIRMED','BRIEF_REFERENCE_MISMATCH','NOT_FOUND','ARTIFACT_TEXT_REQUIRED','TASK_SCOPE_DENIED','LOG_RESET']){
  const diagnostic=safeToolDiagnostic(tool.parameters,code,'private-source-path and private-parameter-value');
  assert.deepEqual(diagnostic,{code});
  assert.deepEqual(toolResultDiagnostic(tool.parameters,{content:[{type:'text',text:code+': private-source-path'}]}),{code});
  assert.doesNotMatch(JSON.stringify(diagnostic),/private/);
  assert.match(toolFailureMessage(tool.name,diagnostic),new RegExp(code));
  assert.doesNotMatch(toolFailureMessage(tool.name,diagnostic),/private/);
 }
 for(const code of ['VERSION_CONFLICTsuffix','__proto__','constructor','UNRECOGNIZED_FAILURE'])assert.equal(safeToolDiagnostic(tool.parameters,code,'private value'),undefined);
 assert.match(toolFailureMessage(tool.name,{code:'VERSION_CONFLICT'}),/重新读取/);
 assert.match(toolFailureMessage(tool.name,{code:'INVALID_INPUT',path:'$.input',reason:'缺少必需字段'}),/\{"input":\{\}\}/);
 assert.match(toolFailureMessage(tool.name),/对应任务的诊断/);
});

test('unknown brief fields identify only their containing object in safe tool diagnostics',()=>{
 const [tool]=buildCustomTools([{name:'research_brief_save',...TOOL_DEFINITIONS.research_brief_save}],async()=>assert.fail('invalid input must not dispatch'));
 for(const key of ['ready','private-secret-key','private.key: value\n[0]']){
  const input=TOOL_DEFINITIONS.research_brief_save.example;
  for(const [args,path] of [[{input,[key]:'private-value'},'$'],[{input:{...input,[key]:'private-value'}},'$.input'],[{input:{...input,steps:[{title:'Step',description:'Fixed description',[key]:'private-value'}]}},'$.input.steps[0]']]){
   assert.throws(()=>tool.prepareArguments(args),error=>{
    assert.equal(error.message,`INVALID_INPUT: ${path}: 未知字段`);
    assert.deepEqual(toolResultDiagnostic(tool.parameters,{content:[{type:'text',text:error.message}]}),{code:'INVALID_INPUT',path,reason:'未知字段'});
    return true;
   });
  }
 }
});

test('Pi receives exact tool schemas and raw validation blocks SDK coercion before dispatch', async () => {
    const installed = locatePi(repoRoot), sdk = await import(pathToFileURL(installed.aiPath).href);
    let calls = 0;
    const tools = buildCustomTools(Object.entries(TOOL_DEFINITIONS).map(([name, definition]) => ({name, ...definition})), async () => {calls++; return {};});
    for (const tool of tools) {
        const valid = {input: TOOL_DEFINITIONS[tool.name].example};
        const example = JSON.parse(tool.description.split('\n完整调用示例：')[1]);
        assert.deepEqual(example, valid, tool.name);
        assert.deepEqual(tool.prepareArguments(example), example);
        assert.deepEqual(tool.prepareArguments(valid), valid);
        assert.deepEqual(sdk.validateToolArguments(tool, {id: 'example', name: tool.name, arguments: valid}), valid);
        assert.throws(() => tool.prepareArguments({...valid, actor: 'forged'}), /INVALID_INPUT/);
    }
    const run = tools.find(tool => tool.name === 'run_prepare');
    assert.throws(() => run.prepareArguments({input: {experimentId: 123}}), /INVALID_INPUT/);
    const read = tools.find(tool => tool.name === 'run_logs');
    assert.throws(() => read.prepareArguments({input: {runId: 'run', cursor: '12'}}), /INVALID_INPUT/);
    const brief = tools.find(tool => tool.name === 'research_brief_save');
    assert.match(brief.description, /初次.*expectedRevisionId.*null/);
    assert.match(brief.description, /research_brief_inspect\.latestId/);
    assert.throws(() => brief.prepareArguments({}), /\$\.input: 缺少必需字段/);
    const {expectedRevisionId, ...missingRevision} = TOOL_DEFINITIONS.research_brief_save.example;
    assert.throws(() => brief.prepareArguments({input: missingRevision}), /\$\.input\.expectedRevisionId: 缺少必需字段/);
    assert.equal(calls, 0);
});

test('controlled tools dispatch more than 40 validated calls without a per-run cutoff', async () => {
    const calls = [];
    const [tool] = buildCustomTools([{name: 'task_context_read', ...TOOL_DEFINITIONS.task_context_read}], async (name, input, callId) => {
        calls.push({name, input, callId});
        return {accepted: true, callId};
    });
    for (let index = 1; index <= 45; index++) {
        const callId = `context-${index}`, receipt = await tool.execute(callId, tool.prepareArguments({input: {}}));
        assert.deepEqual(JSON.parse(receipt.content[0].text), {accepted: true, callId});
    }
    assert.deepEqual(calls, Array.from({length: 45}, (_, index) => ({name: 'task_context_read', input: {}, callId: `context-${index + 1}`})));
});

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
        const skillPath=join(home,'mutable-skill.md');writeFileSync(skillPath,'UNREVIEWED_NEW_BYTES');
        const options = buildSessionOptions(sdk, {...setup,skills:[{name:'reviewed-method',description:'Reviewed earlier',filePath:skillPath,baseDir:home,source:'fixture',disableModelInvocation:false}]}, customTools, runtime, model);
        ({session} = await sdk.createAgentSession(options));
        assert.deepEqual(session.getActiveToolNames(), ['contract_read']);
        assert.deepEqual(options.resourceLoader.getSkills().skills,[]);
        assert.equal(session._expandSkillCommand('/skill:reviewed-method arguments'),'/skill:reviewed-method arguments','pinned SDK cannot bypass controlled reads to load changed bytes');
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

test('provider timeouts have a fixed diagnostic instead of SDK text, credentials or response bodies',()=>{
 const expected='PROVIDER_TIMEOUT: 模型请求等待超时；已完成的工具操作和历史保留，请在原会话核对后继续，避免重复已完成操作。';
 for(const error of [new Error('Request timed out.'),Object.assign(new Error('private credential and body'),{name:'APIConnectionTimeoutError'}),Object.assign(new Error('private credential and body'),{name:'TimeoutError'}),new TypeError('private response body',{cause:{code:'UND_ERR_HEADERS_TIMEOUT'}}),new TypeError('private response body',{cause:{code:'UND_ERR_BODY_TIMEOUT'}}),new Error('PROVIDER_TIMEOUT: private response body')])assert.equal(piFailure(error),expected);
 assert.match(piFailure(new Error('MODEL_NOT_FOUND: absent')),/^MODEL_NOT_FOUND:/);
});
