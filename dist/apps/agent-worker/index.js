import { taskModelExecution, selectedCatalogDigest } from '../../packages/pi-adapter/thinking-policy.js';
import { digest } from '../../packages/storage/store.js';
import { registerDataProcess } from '../../packages/storage/process-coordination.js';
import { imageContextReferences, publicationImageCatalog, PUBLICATION_IMAGE_TOOL, DOCUMENT_IMAGE_TOOL } from '../../packages/pi-adapter/publication-image.js';
import { applyModelConnection, connectionFetch, safeConnectionStream } from '../../packages/pi-adapter/model-connections.js';
import { resolvedThinking, modelPayload } from '../../packages/pi-adapter/model-definition.js';
import { managedModelFetch } from '../../packages/pi-adapter/model-fetch.js';
import { workerDeltaSender } from '../../packages/pi-adapter/worker-delta.js';
import { attachmentPayload } from '../../packages/pi-adapter/attachment-input.js';
import { MANAGED_HTTP_APIS } from '../../packages/scheduler/model-http.js';
import { s as schema } from '../../packages/contracts/operations/schema.js';
import { toolResultDiagnostic } from '../../packages/pi-adapter/tool-diagnostic.js';
import { PAPER_READ_TIMEOUT_MS, SEARCH_RPC_TIMEOUT_MS } from '../../packages/connectors/transport.js';
import { ARTIFACT_TEXT_PREPARE_TIMEOUT_MS } from '../../packages/contracts/tool-budgets.js';
import { buildWorkerPrompt } from '../../packages/pi-adapter/prompt.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSessionOptions, buildCustomTools, systemInstruction, assistantFailure, emptyLengthAssistant, EMPTY_LENGTH_FAILURE } from '../../packages/pi-adapter/options.js';
import { locatePi, inspectPi, piFailure, MODEL_HTTP_TIMEOUT_MS } from '../../packages/pi-adapter/runtime.js';
let session;
let providerFailure;
let taskModelFailure;
let imageFailure;
let pendingEmptyLength, recoveryFailure;
const COMPACTION_FAILURE = 'CONTEXT_COMPACTION_FAILED: 本次上下文恢复未完成，已停止；原始历史与已完成操作保留，请在原会话核对后继续，避免重复副作用。';
let recoveryEligible = false, recoveryArmed = false, recoveryAttempted = false, compacting = false, summaryCalls = 0;
let started = false, stopping = false, taskSubmitted = false;
const httpStop = new AbortController();
const readDeliveries = new Map();
let seq = 0;
const queuedInputs = [];
const attachmentManifests = [];
let initialUserSeen = false;
const pending = new Map();
function send(value) {
    if (process.connected)
        process.send?.(value);
}
const display = workerDeltaSender(send);
function httpRpc(type, key, result, imageRefs, attachmentRefs, contextRecovery) { return new Promise((resolve, reject) => { const requestId = ++seq, startedAt = Date.now(), timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`MODEL_HTTP_CONTROL_TIMEOUT: HTTP额度控制未响应 (${type}, requestId=${requestId}, elapsedMs=${Date.now() - startedAt})`)); }, 30000); pending.set(requestId, { resolve, reject, timer, attachmentRequest: !!attachmentRefs?.length }); send({ type, requestId, key, result, ...(contextRecovery ? { contextRecovery } : {}), ...(imageRefs ? { imageRefs } : {}), ...(attachmentRefs ? { attachmentRefs } : {}) }); }); }
// Paper reads and host execution need their service budget plus cleanup and IPC delivery.
function rpc(tool, input, toolCallId) { return new Promise((resolve, reject) => { const requestId = ++seq; const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`受控工具请求超时；结果未确认，请核对原调用，不要自动重试 (tool=${tool}, toolCallId=${toolCallId}, requestId=${requestId})`)); }, (tool === 'artifact_text_prepare' || tool === 'workspace_text_prepare') ? ARTIFACT_TEXT_PREPARE_TIMEOUT_MS + 20000 : tool === 'literature_search' || tool === 'literature_discover' ? SEARCH_RPC_TIMEOUT_MS : tool === 'session_action_resume' ? 80000 : tool === 'paper_read' ? PAPER_READ_TIMEOUT_MS + 20000 : tool === 'host_execute' ? 80000 : 30000); pending.set(requestId, { resolve, reject, timer, toolCallId }); send({ type: 'tool', requestId, tool, input, toolCallId }); }); }
function clearPending() {
    for (const p of pending.values()) {
        clearTimeout(p.timer);
        p.reject(new Error('Worker 正在退出'));
    }
    pending.clear();
}
process.on('message', async (message) => {
    const raw = message;
    if (raw?.type === 'delta_ack') {
        if (!stopping)
            display.acknowledge(raw.deltaId);
        return;
    }
    if (raw?.type === 'tool_response' || raw?.type === 'model_http_response') {
        const p = pending.get(raw.requestId);
        if (!p)
            return;
        clearTimeout(p.timer);
        pending.delete(raw.requestId);
        if (raw.type === 'model_http_response' && raw.error && (p.attachmentRequest || raw.error.code.startsWith('MODEL_IMAGE_') || raw.error.code.startsWith('MODEL_ATTACHMENT_')))
            imageFailure = `${raw.error.code}: ${raw.error.message}`;
        if (raw.type === 'model_http_response' && raw.error?.code === 'TASK_MODEL_STALE')
            taskModelFailure = 'TASK_MODEL_STALE: 原批准的任务模型执行定义已变化，请重新建立并批准计划。';
        if (raw.type === 'tool_response' && !raw.error && raw.readDelivery && p.toolCallId)
            readDeliveries.set(p.toolCallId, raw.readDelivery);
        raw.error ? p.reject(new Error(`${raw.error.code}: ${raw.error.message}`)) : p.resolve(raw.result);
        return;
    }
    if (raw?.type === 'abort') {
        stopping = true;
        display.clear();
        httpStop.abort();
        clearPending();
        await session?.abort();
        return;
    }
    if (raw?.type === 'steer' || raw?.type === 'follow_up') {
        if (session && !taskSubmitted && !stopping) {
            try {
                queuedInputs.push({ id: raw.messageId, content: raw.content });
                if (raw.attachmentManifest)
                    attachmentManifests.push(raw.attachmentManifest);
                raw.type === 'steer' ? await session.steer(raw.content) : await session.followUp(raw.content);
                if (taskSubmitted || stopping) {
                    session.clearQueue();
                    send({ type: 'control_error', messageId: raw.messageId, error: 'Worker 已停止接收输入' });
                    return;
                }
                send({ type: 'message_ack', messageId: raw.messageId });
            }
            catch (e) {
                const index = queuedInputs.findIndex(m => m.id === raw.messageId);
                if (index >= 0)
                    queuedInputs.splice(index, 1);
                send({ type: 'control_error', messageId: raw.messageId, error: e instanceof Error ? e.message : String(e) });
            }
        }
        else
            send({ type: 'control_error', messageId: raw.messageId, error: 'Worker 尚未就绪或已停止接收输入' });
        return;
    }
    if (raw?.type !== 'start' || started)
        return;
    started = true;
    attachmentManifests.push(...(raw.attachmentManifests ?? []));
    try {
        registerDataProcess(raw.dataDir, 'agent-worker');
        const inspection = inspectPi(raw.repoRoot, raw.model);
        if (!inspection.ready)
            throw new Error(`${inspection.code}: ${inspection.message}`);
        const installed = locatePi(raw.repoRoot);
        if (!installed)
            throw new Error('PI_NOT_INSTALLED');
        const sdk = await import(pathToFileURL(installed.sdkPath).href);
        const ai = raw.taskModel ? await import(pathToFileURL(installed.aiPath).href) : undefined;
        // The pinned SDK helper also lifts Undici's separate 300-second header/body limit in this Worker only.
        const { configureHttpDispatcher } = await import(new URL('./core/http-dispatcher.js', pathToFileURL(installed.sdkPath)).href);
        if (typeof configureHttpDispatcher !== 'function')
            throw new Error('SDK_HTTP_TIMEOUT_UNAVAILABLE: 固定SDK的HTTP配置接口不可用');
        configureHttpDispatcher(MODEL_HTTP_TIMEOUT_MS);
        mkdirSync(raw.agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(raw.sessionDir, { recursive: true, mode: 0o700 });
        const catalogBefore = publicationImageCatalog(raw.modelsPath);
        const authPath = join(raw.agentDir, 'auth.json');
        let modelRuntime = await sdk.ModelRuntime.create({ authPath, modelsPath: raw.modelsPath, ...(raw.connection || raw.taskModel ? { refreshOnCreate: false, allowModelNetwork: false } : {}) });
        if (raw.connection)
            modelRuntime = await applyModelConnection(sdk, modelRuntime, raw.model, raw.connection, process.env.PI_API_KEY ?? '', authPath);
        const catalogAfter = publicationImageCatalog(raw.modelsPath);
        const checkCatalog = () => { if (raw.managedHttp && (!raw.catalogFingerprint || catalogBefore !== raw.catalogFingerprint || catalogAfter !== raw.catalogFingerprint || publicationImageCatalog(raw.modelsPath) !== raw.catalogFingerprint))
            throw new Error('MODEL_IMAGE_CATALOG_CHANGED: 模型目录已变化，请停止并重新核对授权'); };
        const model = modelRuntime.getModel(raw.model.provider, raw.model.model);
        if (!model)
            throw new Error('MODEL_NOT_FOUND: 模型目录中不存在此供应商/模型，请核对 models.json 和模型 ID');
        if (process.env.PI_API_KEY && !raw.connection)
            await modelRuntime.setRuntimeApiKey(raw.model.provider, process.env.PI_API_KEY);
        if (!modelRuntime.hasConfiguredAuth(raw.model.provider))
            throw new Error('AUTH_MISSING: 请为所选供应商配置凭据');
        if (raw.tools.some(t => !t.inputSchema || t.inputSchema.type !== 'object'))
            throw new Error('SDK_CONTRACT_MISMATCH: 工具缺少精确输入 Schema');
        const customTools = buildCustomTools(raw.tools, async (name, input, callId) => {
            if (name === PUBLICATION_IMAGE_TOOL || name === DOCUMENT_IMAGE_TOOL) {
                if (!raw.managedHttp)
                    throw new Error('MODEL_IMAGE_UNMANAGED: 图片需要受管HTTP');
                if (!model.input?.includes('image'))
                    throw new Error('MODEL_IMAGE_UNSUPPORTED: 当前模型目录未声明图片能力');
                checkCatalog();
            }
            const result = await rpc(name, input, callId);
            if (name === 'task_result_submit')
                taskSubmitted = true;
            return result;
        });
        const definition = raw.connection?.models?.find(m => m.model === raw.model.model && !m.controlOnly), requestedThinking = resolvedThinking(definition, raw.model.thinking), thinking = ai ? ai.clampThinkingLevel(model, requestedThinking) : requestedThinking;
        const actualExecution = raw.taskModel ? taskModelExecution(raw.model, model, definition, selectedCatalogDigest(raw, raw.model, !!raw.connection, thinking), thinking) : undefined;
        if (raw.taskModel && digest(actualExecution) !== raw.taskModel.digest)
            throw new Error('TASK_MODEL_STALE: Worker实际SDK执行映射与原批准不符');
        const opts = buildSessionOptions(sdk, { cwd: raw.workspace, agentDir: raw.agentDir, sessionDir: raw.sessionDir, sessionFile: raw.piSessionPath, systemPrompt: systemInstruction(raw.role, raw.tools.some(tool => tool.name === 'host_execute'), raw.permissionMode, raw.tools.some(tool => tool.name === 'session_action_execute')) + (raw.skillBundle?.prompt ?? ''), skills: raw.skillBundle?.skills ?? [], thinking }, customTools, modelRuntime, model);
        ({ session } = await sdk.createAgentSession(opts));
        if (raw.taskModel && session.thinkingLevel !== thinking)
            throw new Error('TASK_MODEL_STALE: SDK改变了原批准的思考适配，任务已停止');
        recoveryEligible = raw.contextRecoveryEligible === true && raw.managedHttp === true && raw.role === 'coordinator' && raw.permissionMode !== 'readOnly';
        const armRecovery = () => { if (recoveryEligible && !recoveryAttempted && !stopping && !taskSubmitted && !providerFailure && !imageFailure && !recoveryFailure) {
            recoveryArmed = true;
            session.setAutoCompactionEnabled(true);
        } };
        if (raw.managedHttp && !MANAGED_HTTP_APIS.includes(model.api))
            throw new Error('MODEL_HTTP_UNSUPPORTED: 所选SDK传输尚未接入受管HTTP，不会绕过限流');
        const stream = session.agent.streamFunction;
        session.agent.streamFunction = async (chosen, context, options) => {
            if (recoveryFailure || recoveryArmed && !compacting)
                throw new Error(recoveryFailure ?? COMPACTION_FAILURE);
            if (chosen.provider !== raw.model.provider || chosen.id !== raw.model.model || chosen.api !== model.api)
                throw new Error('MODEL_FALLBACK_REFUSED: 请求模型或传输已改变');
            const contextRecovery = compacting ? 'summary' : recoveryAttempted ? 'resume' : undefined;
            if (compacting) {
                const { clampMaxTokensToContext } = await import(new URL('./api/simple-options.js', pathToFileURL(installed.aiPath)).href);
                // Reuse the SDK reserve; an oversized summary must fail before dispatch, never raise model limits.
                if (++summaryCalls > 2 || !options?.maxTokens || clampMaxTokensToContext(chosen, context, options.maxTokens) < options.maxTokens)
                    throw new Error(COMPACTION_FAILURE);
            }
            const refs = imageContextReferences(context, chosen.input?.includes('image') === true, raw.managedHttp === true);
            if (!raw.managedHttp) {
                const response = await stream(chosen, context, options);
                return raw.connection ? safeConnectionStream(response) : response;
            }
            if (refs.length)
                checkCatalog();
            // Each transport closure owns this exact context, including all historical images.
            let attachmentRefs = [];
            const fetcher = managedModelFetch(raw.connection ? connectionFetch(globalThis.fetch, raw.connection.baseUrl) : globalThis.fetch, key => { if (refs.length || attachmentRefs.length)
                checkCatalog(); return httpRpc('model_http_acquire', key, undefined, refs, attachmentRefs, contextRecovery); }, (key, result) => httpRpc('model_http_finish', key, result), httpStop.signal);
            const response = await stream(chosen, context, { ...options, transport: 'sse', fetch: fetcher, onPayload: (body) => { const configured = definition ? modelPayload(body, definition, raw.model.thinking, raw.connection.api) : body; const attached = attachmentPayload(configured, context, model.api, definition, attachmentManifests, chosen.input?.includes('image') === true); attachmentRefs = attached.references; return attached.payload; } });
            const guarded = raw.connection ? safeConnectionStream(response) : response;
            if (contextRecovery === 'summary') {
                const result = guarded.result.bind(guarded);
                guarded.result = async () => { const message = await result(); if (message.stopReason !== 'stop' || !message.content.some(block => block.type === 'text' && block.text.trim()) || message.content.some(block => block.type === 'toolCall'))
                    throw new Error(COMPACTION_FAILURE); return message; };
            }
            return guarded;
        };
        const finishTurn = session.agent.finishTurn;
        session.agent.finishTurn = async (turn, signal) => {
            const decision = await finishTurn?.(turn, signal);
            if (taskSubmitted || stopping) {
                session.clearQueue();
                return { action: 'end' };
            }
            return decision ?? undefined;
        };
        if (session.model?.provider !== raw.model.provider || session.model?.id !== raw.model.model)
            throw new Error('MODEL_FALLBACK_REFUSED: SDK 尝试切换未经批准的模型');
        send({ type: 'ready', sessionFile: session.sessionFile, sessionId: session.sessionId, activeTools: session.getActiveToolNames(), model: { provider: session.model?.provider, id: session.model?.id }, ...(actualExecution ? { thinking: { requested: raw.model.thinking, requestedPiThinking: requestedThinking, piThinking: session.thinkingLevel, parametersDigest: digest(actualExecution.parameters), executionDigest: digest(actualExecution) } } : {}) });
        const initialPrompt = buildWorkerPrompt(raw.prompt, raw.piSessionPath ? null : raw.history, raw.hostMessages ?? []);
        session.subscribe((e) => {
            if (e.type === 'compaction_start') {
                session.setAutoCompactionEnabled(false);
                if (!recoveryEligible || !recoveryArmed || recoveryAttempted || stopping || taskSubmitted || providerFailure || imageFailure) {
                    recoveryFailure = COMPACTION_FAILURE;
                    void session.abortCompaction();
                    return;
                }
                recoveryAttempted = true;
                recoveryArmed = false;
                compacting = true;
            }
            if (e.type === 'compaction_end') {
                compacting = false;
                if (!e.result || e.aborted || e.errorMessage)
                    recoveryFailure = COMPACTION_FAILURE;
            }
            if (e.type === 'message_start' && e.message.role === 'user') {
                const body = typeof e.message.content === 'string' ? e.message.content : e.message.content.filter(p => p.type === 'text').map(p => p.text).join('');
                if (!initialUserSeen) {
                    initialUserSeen = true;
                    if (raw.messageId && body === initialPrompt)
                        send({ type: 'input_consumed', messageId: raw.messageId });
                }
                else {
                    // Controlled resource loader has no skills, templates or input extensions; match only the next raw input.
                    const next = queuedInputs[0];
                    if (next && next.content === body) {
                        queuedInputs.shift();
                        send({ type: 'input_consumed', messageId: next.id });
                    }
                }
            }
            if (e.type === 'tool_execution_start' || e.type === 'tool_execution_end') {
                const definition = raw.tools.find(tool => tool.name === e.toolName);
                const diagnostic = e.type === 'tool_execution_end' && e.isError && definition ? toolResultDiagnostic(schema.object({ input: definition.inputSchema }, ['input']), e.result) : undefined;
                const delivery = e.type === 'tool_execution_end' ? readDeliveries.get(e.toolCallId) : undefined;
                if (e.type === 'tool_execution_end')
                    readDeliveries.delete(e.toolCallId);
                send({ type: e.type, tool: e.toolName, toolCallId: e.toolCallId, ...(e.type === 'tool_execution_end' ? { isError: e.isError, ...(delivery && !e.isError ? { readDelivery: delivery, resultDigest: digest(JSON.stringify(e.result)) } : {}), ...(diagnostic ? { diagnostic } : {}) } : {}) });
            }
            if (!stopping && e.type === 'message_update' && e.assistantMessageEvent?.type === 'text_delta')
                display.push(e.assistantMessageEvent.delta);
            if (e.type === 'message_end' && e.message?.role === 'assistant') {
                display.clear();
                const emptyLength = emptyLengthAssistant(e.message), failure = assistantFailure(e.message);
                if (emptyLength) {
                    pendingEmptyLength = EMPTY_LENGTH_FAILURE;
                    if (recoveryAttempted)
                        recoveryFailure = COMPACTION_FAILURE;
                    else
                        armRecovery();
                }
                else {
                    providerFailure = taskModelFailure ?? imageFailure ?? (e.message.stopReason === 'aborted' && stopping ? providerFailure : failure ?? providerFailure);
                    if (!failure && (e.message.stopReason === 'stop' || e.message.stopReason === 'toolUse') && e.message.content.some(p => p.type === 'toolCall' || p.type === 'text' && p.text.trim()))
                        pendingEmptyLength = undefined;
                }
                const content = Array.isArray(e.message.content) ? e.message.content.filter(p => p.type === 'text').map(p => p.text).join('') : '';
                const toolCalls = Array.isArray(e.message.content) ? e.message.content.filter(p => p.type === 'toolCall').map(p => p.name).slice(0, 64) : [];
                send({ type: 'assistant_message', content, toolCalls, phase: toolCalls.length || e.message.stopReason === 'toolUse' ? 'commentary' : 'final_answer', usage: e.message.usage ?? null, stopReason: e.message.stopReason ?? null, error: taskModelFailure ?? imageFailure ?? assistantFailure(e.message) ?? null });
            }
            if (e.type === 'turn_end' && e.message.role === 'assistant' && emptyLengthAssistant(e.message) && e.toolResults.length) {
                recoveryArmed = false;
                session.setAutoCompactionEnabled(false);
            }
            if (e.type === 'agent_settled')
                send({ type: 'settled' });
        });
        const branch = session.sessionManager.getBranch(), lastAssistant = [...branch].reverse().find(entry => entry.type === 'message' && entry.message.role === 'assistant');
        if (lastAssistant?.type === 'message' && lastAssistant.message.role === 'assistant' && emptyLengthAssistant(lastAssistant.message) && lastAssistant.message.provider === raw.model.provider && lastAssistant.message.model === raw.model.model) {
            const after = branch.slice(branch.indexOf(lastAssistant) + 1);
            if (!after.some(entry => entry.type === 'compaction' || entry.type === 'context_edit' && entry.targetId === lastAssistant.id && entry.replacement === null || entry.type === 'message' && entry.message.role === 'toolResult')) {
                pendingEmptyLength = EMPTY_LENGTH_FAILURE;
                armRecovery();
            }
        }
        try {
            if (!stopping)
                await session.prompt(initialPrompt);
        }
        finally {
            session.setAutoCompactionEnabled(false);
            recoveryArmed = false;
        }
        if (!providerFailure && !pendingEmptyLength && !recoveryFailure && !stopping && raw.hostMessages?.length)
            send({ type: 'context_ack', messageIds: raw.hostMessages.map((m) => m.id) });
        providerFailure = taskModelFailure ?? imageFailure ?? providerFailure ?? recoveryFailure ?? pendingEmptyLength;
        if (providerFailure)
            send({ type: 'failure', error: providerFailure });
        else
            send({ type: 'done', aborted: stopping, sessionFile: session.sessionFile });
    }
    catch (error) {
        const code = error?.code;
        send({ type: 'failure', error: taskModelFailure ?? imageFailure ?? providerFailure ?? recoveryFailure ?? (pendingEmptyLength ? COMPACTION_FAILURE : piFailure(code?.startsWith('MODEL_IMAGE_') ? `${code}: ${error.message}` : error)) });
    }
    finally {
        stopping = true;
        display.clear();
        session?.dispose();
        clearPending();
        setTimeout(() => process.exit(0), 50);
    }
});
process.on('disconnect', () => { stopping = true; display.clear(); httpStop.abort(); clearPending(); void session?.abort(); setTimeout(() => process.exit(1), 500).unref(); });
//# sourceMappingURL=index.js.map