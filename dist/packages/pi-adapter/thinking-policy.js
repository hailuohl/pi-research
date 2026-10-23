import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { ensure } from '../domain/errors.js';
import { object, text, integer } from '../contracts/validation.js';
import { digest } from '../storage/store.js';
import { userOnly } from '../policy/permissions.js';
import { modelCatalog, modelSdk, recommendedDefinition } from './model-management.js';
import { readModelState, assertModelEnabled, assertModelRestoreCurrent, applyModelConnection } from './model-connections.js';
import { resolvedThinking } from './model-definition.js';
import { locatePi, PI_VERSION } from './runtime.js';
import { sessionTaskModel } from '../collaboration/task-model.js';
const policyId = (model) => digest({ provider: model.provider, model: model.model, restoreEpoch: model.restoreEpoch ?? 0 });
export function thinkingPolicies(c) { return c.store.list('model-thinking-policy').map(({ schemaVersion, provider, model, restoreEpoch, candidates, version }) => ({ schemaVersion, provider, model, restoreEpoch, candidates, version })); }
export function thinkingPolicy(c, model) { return thinkingPolicies(c).find(p => policyId(p) === policyId(model)); }
export async function thinkingDefinition(c, selected) {
    assertModelRestoreCurrent(c.dataDir, selected);
    const managed = assertModelEnabled(c.dataDir, { provider: selected.provider, model: selected.model }), runtime = await modelCatalog(c), source = runtime.getModel(selected.provider, selected.model);
    let definition = managed ?? (source ? recommendedDefinition(selected.model, source) : undefined);
    if (!managed && source && definition) {
        const installed = locatePi(c.repoRoot), ai = await import(pathToFileURL(installed.aiPath).href), supported = ai.getSupportedThinkingLevels(source);
        definition = { ...definition, reasoning: { ...definition.reasoning, levels: definition.reasoning.levels.filter(l => supported.includes(l.piLevel)) } };
    }
    return { runtime, definition };
}
export async function saveThinkingPolicy(c, actor, input, key) {
    userOnly(actor);
    ensure(Object.keys(input).every(k => ['expectedVersion', 'expectedPolicyVersion', 'action', 'provider', 'model', 'value'].includes(k)), 'INVALID_INPUT', '策略命令包含未知字段', 400);
    const expected = integer(input.expectedVersion, 'expectedVersion', 0), expectedPolicy = integer(input.expectedPolicyVersion, 'expectedPolicyVersion', 0), v = object(input.value);
    ensure(Object.keys(v).sort().join(',') === 'candidates,model,provider,restoreEpoch,schemaVersion' && v.schemaVersion === 1, 'INVALID_INPUT', '策略导入格式无效', 400);
    const provider = text(v.provider, 'provider', 100), model = text(v.model, 'model', 160), restoreEpoch = integer(v.restoreEpoch, 'restoreEpoch', 0, Number.MAX_SAFE_INTEGER);
    ensure(provider === input.provider && model === input.model, 'INVALID_INPUT', '策略目标与命令不一致', 400);
    ensure(Array.isArray(v.candidates) && v.candidates.length <= 16, 'INVALID_INPUT', '策略候选最多16项', 400);
    const candidates = v.candidates.map(raw => { const item = object(raw); ensure(Object.keys(item).sort().join(',') === 'id,purpose', 'INVALID_INPUT', '候选包含未知字段', 400); return { id: text(item.id, 'id', 64), purpose: text(item.purpose, 'purpose', 1000) }; });
    ensure(new Set(candidates.map(v => v.id)).size === candidates.length, 'INVALID_INPUT', '候选ID重复', 400);
    const selected = { provider, model, thinking: candidates[0]?.id ?? 'off', ...(restoreEpoch ? { restoreEpoch } : {}) }, state = readModelState(c.dataDir);
    ensure(state.version === expected, 'VERSION_CONFLICT', '模型目录已变化，请刷新后重新保存策略');
    const { definition } = await thinkingDefinition(c, selected);
    ensure(!candidates.length || definition && candidates.every(v => definition.reasoning.levels.some(l => l.id === v.id)), 'MODEL_REASONING_UNAVAILABLE', '策略候选必须是目标模型的真实档位');
    const value = { schemaVersion: 1, provider, model, restoreEpoch, candidates }, id = policyId(selected);
    c.store.transaction(() => {
        ensure(readModelState(c.dataDir).version === expected, 'VERSION_CONFLICT', '模型目录已变化，请刷新后重新保存策略');
        assertModelRestoreCurrent(c.dataDir, selected);
        c.store.operation('model.thinking-policy', text(key, 'Idempotency-Key', 200), input, () => { const prior = c.store.maybe('model-thinking-policy', id); ensure((prior?.version ?? 0) === expectedPolicy, 'VERSION_CONFLICT', '思考用途策略已变化，请刷新'); return prior ? c.store.update('model-thinking-policy', id, prior.version, value) : c.store.create('model-thinking-policy', null, value, id); });
    });
}
export function inspectThinkingPolicy(c, model) {
    const policy = thinkingPolicy(c, model);
    if (!policy)
        return null;
    try {
        assertModelRestoreCurrent(c.dataDir, model);
        const definition = assertModelEnabled(c.dataDir, { provider: model.provider, model: model.model });
        return { ...policy, validation: definition ? 'current-managed-directory' : 'validated-on-save-rechecked-on-prepare', candidates: definition ? policy.candidates.filter(v => definition.reasoning.levels.some(l => l.id === v.id)) : policy.candidates };
    }
    catch {
        return { ...policy, validation: 'unavailable', candidates: [] };
    }
}
/** Match the actual adapter's shallow overrides, retaining only credential-free execution metadata. */
export function taskModelExecution(selected, model, definition, catalogDigest, actualPiThinking) {
    const requestedPiThinking = resolvedThinking(definition, selected.thinking), piThinking = actualPiThinking ?? requestedPiThinking, level = definition?.reasoning.levels.find(l => l.id === selected.thinking);
    const metadata = Object.fromEntries(['provider', 'id', 'reasoning', 'input', 'inputLimits', 'contextWindow', 'maxTokens', 'compat', 'samplingParams', 'promptCache'].filter(k => model[k] !== undefined).map(k => [k, model[k]]));
    const mapped = model.thinkingLevelMap?.[piThinking];
    metadata.thinkingLevelMap = mapped === undefined ? {} : { [piThinking]: mapped };
    return { selection: selected, sdkVersion: PI_VERSION, requestedPiThinking, piThinking, api: model.api, endpointDigest: digest(model.baseUrl), metadata: { ...metadata, headersDigest: digest(model.headers ?? null) }, parameters: { ...definition?.parameters, ...level?.parameters }, structuredOutput: definition?.structuredOutput ?? null, catalogDigest };
}
/** The pinned SDK's own JSONC reader keeps comments/trailing commas and display-only edits out of this guard. */
export function selectedCatalogDigest(c, selected, managed, actualPiThinking, catalogSource) {
    const path = join(c.dataDir, 'models.json'), source = catalogSource === undefined ? (existsSync(path) ? readFileSync(path, 'utf8') : null) : catalogSource;
    if (source === null)
        return digest({ provider: {}, model: {}, override: {} });
    const installed = locatePi(c.repoRoot);
    ensure(installed && installed.version === PI_VERSION, 'PI_NOT_INSTALLED', '需要固定Pi SDK');
    const { stripJsonComments } = createRequire(import.meta.url)(join(dirname(installed.sdkPath), 'utils/json.js'));
    let parsed;
    try {
        parsed = JSON.parse(stripJsonComments(source.replace(/^\uFEFF/, '')));
        ensure(parsed && typeof parsed === 'object' && !Array.isArray(parsed), 'TASK_MODEL_STALE', '模型目录格式无效');
    }
    catch {
        ensure(false, 'TASK_MODEL_STALE', '无法解析模型目录，请核对配置后重新建立批准计划');
    }
    const p = parsed.providers?.[selected.provider];
    const piThinking = actualPiThinking ?? (managed ? resolvedThinking(assertModelEnabled(c.dataDir, selected), selected.thinking) : selected.thinking);
    const clean = (value) => { const result = { ...value }; for (const key of ['name', 'cost', 'apiKey', 'models', 'modelOverrides', ...(managed ? ['api', 'baseUrl', 'headers', 'authHeader', 'reasoning', 'input', 'contextWindow', 'maxTokens', 'samplingParams'] : [])])
        delete result[key]; if (result.thinkingLevelMap)
        result.thinkingLevelMap = { [piThinking]: result.thinkingLevelMap[piThinking] }; if (managed && result.compat) {
        result.compat = { ...result.compat };
        delete result.compat.supportsMidConvoSystemMessages;
    } return result; };
    return digest({ provider: clean(p), model: clean(p?.models?.find((m) => m.id === selected.model)), override: clean(p?.modelOverrides?.[selected.model]) });
}
async function execution(c, selected) {
    assertModelRestoreCurrent(c.dataDir, selected);
    const connection = readModelState(c.dataDir).connections.find(p => p.provider === selected.provider && !p.controlOnly), managed = assertModelEnabled(c.dataDir, selected), path = join(c.dataDir, 'models.json'), catalogSource = existsSync(path) ? readFileSync(path, 'utf8') : null, runtime = await modelCatalog(c), source = runtime.getModel(selected.provider, selected.model), definition = managed ?? (source ? recommendedDefinition(selected.model, source) : undefined);
    const effective = connection ? await applyModelConnection(await modelSdk(c), runtime, selected, connection, 'offline-execution-definition', null) : runtime, model = effective.getModel(selected.provider, selected.model);
    ensure(model && definition?.reasoning.levels.some(l => l.id === selected.thinking), 'MODEL_REASONING_UNAVAILABLE', '无法解析任务模型的真实档位');
    const installed = locatePi(c.repoRoot), ai = await import(pathToFileURL(installed.aiPath).href);
    const piThinking = ai.clampThinkingLevel(model, resolvedThinking(connection ? definition : undefined, selected.thinking)), catalogDigest = selectedCatalogDigest(c, selected, !!connection, piThinking, catalogSource);
    const result = taskModelExecution(selected, model, connection ? definition : undefined, catalogDigest, piThinking);
    assertTaskModelCurrentSync(c, { model: selected, execution: result, digest: digest(result) });
    return result;
}
export async function prepareTaskModels(c, rootSession, tasks) {
    if (!tasks.some(t => t.thinking !== undefined))
        return undefined;
    const root = structuredClone(rootSession.model), taskDigest = digest(tasks), result = Object.create(null), policy = thinkingPolicy(c, root);
    for (const task of tasks) {
        if (task.thinking !== undefined)
            ensure(policy?.candidates.some(v => v.id === task.thinking), 'TASK_THINKING_NOT_ALLOWED', '所选档位未在此模型的用途策略中允许');
        const model = { ...root, thinking: task.thinking ?? root.thinking }, effective = await execution(c, model);
        result[task.key] = { model, execution: effective, digest: digest(effective) };
    }
    return { resolve(rootModel, currentTasks) { ensure(digest(rootModel) === digest(root) && digest(currentTasks) === taskDigest, 'TASK_MODEL_STALE', '准备时的主会话或任务已变化'); ensure(digest(thinkingPolicy(c, root)) === digest(policy), 'TASK_MODEL_STALE', '思考用途策略已变化，请重新准备'); for (const frozen of Object.values(result))
            assertTaskModelCurrentSync(c, frozen); return structuredClone(result); } };
}
export function assertTaskModelCurrentSync(c, frozen) {
    const selected = frozen.model;
    assertModelRestoreCurrent(c.dataDir, selected);
    const definition = assertModelEnabled(c.dataDir, selected), connection = readModelState(c.dataDir).connections.find(p => p.provider === selected.provider && !p.controlOnly);
    ensure(digest(frozen.execution) === frozen.digest && frozen.execution.sdkVersion === PI_VERSION && selectedCatalogDigest(c, selected, !!connection, frozen.execution.piThinking) === frozen.execution.catalogDigest, 'TASK_MODEL_STALE', '所选模型的有效执行映射已变化，请重新建立批准计划');
    if (definition) {
        const level = definition.reasoning.levels.find(l => l.id === selected.thinking), compat = frozen.execution.metadata.compat;
        ensure(level && level.piLevel === frozen.execution.requestedPiThinking && digest({ ...definition.parameters, ...level.parameters }) === digest(frozen.execution.parameters) && digest(definition.structuredOutput) === digest(frozen.execution.structuredOutput) && definition.contextWindow === frozen.execution.metadata.contextWindow && definition.maxTokens === frozen.execution.metadata.maxTokens && definition.capabilities.midConversationSystem === compat?.supportsMidConvoSystemMessages && definition.reasoning.levels.some(l => l.piLevel !== 'off') === frozen.execution.metadata.reasoning && digest(definition.capabilities.image ? ['text', 'image'] : ['text']) === digest(frozen.execution.metadata.input) && connection?.api === frozen.execution.api && digest(connection.baseUrl) === frozen.execution.endpointDigest, 'TASK_MODEL_STALE', '模型或所选档位的执行参数已变化');
    }
}
export async function assertSessionTaskModelCurrent(c, session) { const frozen = sessionTaskModel(c.store, session); if (!frozen)
    return; assertTaskModelCurrentSync(c, frozen); ensure(digest(await execution(c, frozen.model)) === frozen.digest, 'TASK_MODEL_STALE', '实际SDK执行定义与批准选择不符'); return frozen; }
//# sourceMappingURL=thinking-policy.js.map