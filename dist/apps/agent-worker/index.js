import { buildWorkerPrompt } from '../../packages/pi-adapter/prompt.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSessionOptions, systemInstruction, assistantFailure } from '../../packages/pi-adapter/options.js';
import { locatePi } from '../../packages/pi-adapter/runtime.js';
let session;
let providerFailure;
let started = false, stopping = false, toolCalls = 0, turns = 0;
let seq = 0;
const pending = new Map();
function send(value) {
    if (process.connected)
        process.send?.(value);
}
function rpc(tool, input, toolCallId) { return new Promise((resolve, reject) => { const requestId = ++seq; const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('受控工具请求超时')); }, 30000); pending.set(requestId, { resolve, reject, timer }); send({ type: 'tool', requestId, tool, input, toolCallId }); }); }
process.on('message', async (raw) => {
    if (raw?.type === 'tool_response') {
        const p = pending.get(raw.requestId);
        if (!p)
            return;
        clearTimeout(p.timer);
        pending.delete(raw.requestId);
        raw.error ? p.reject(new Error(`${raw.error.code}: ${raw.error.message}`)) : p.resolve(raw.result);
        return;
    }
    if (raw?.type === 'abort') {
        stopping = true;
        await session?.abort();
        return;
    }
    if (raw?.type === 'steer' || raw?.type === 'follow_up') {
        if (session) {
            try {
                raw.type === 'steer' ? await session.steer(raw.content) : await session.followUp(raw.content);
                send({ type: 'message_ack', messageId: raw.messageId });
            }
            catch (e) {
                send({ type: 'control_error', messageId: raw.messageId, error: e instanceof Error ? e.message : String(e) });
            }
        }
        return;
    }
    if (raw?.type !== 'start' || started)
        return;
    started = true;
    try {
        const installed = locatePi(raw.repoRoot);
        if (!installed)
            throw new Error('PI_NOT_INSTALLED');
        const sdk = await import(pathToFileURL(installed.sdkPath).href), ai = await import(pathToFileURL(installed.aiPath).href);
        mkdirSync(raw.agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(raw.sessionDir, { recursive: true, mode: 0o700 });
        const modelRuntime = await sdk.ModelRuntime.create({ authPath: join(raw.agentDir, 'auth.json'), modelsPath: raw.modelsPath });
        if (process.env.PI_API_KEY)
            await modelRuntime.setRuntimeApiKey(raw.model.provider, process.env.PI_API_KEY);
        const model = modelRuntime.getModel(raw.model.provider, raw.model.model);
        if (!model)
            throw new Error('MODEL_NOT_FOUND: 模型目录中不存在此供应商/模型，请核对 models.json 和模型 ID');
        const Type = ai.Type;
        if (!Type)
            throw new Error('SDK_CONTRACT_MISMATCH: 缺少 Type 导出');
        const customTools = raw.tools.map((t) => ({ name: t.name, label: t.name, description: `${t.description}\ninput 示例：${JSON.stringify(t.example)}`, parameters: Type.Object({ input: Type.Record(Type.String(), Type.Unknown()) }), execute: async (toolCallId, args) => {
                if (++toolCalls > 40)
                    throw new Error('TOOL_CALL_LIMIT: 每次会话最多40次工具调用');
                const result = await rpc(t.name, args.input, toolCallId);
                return { content: [{ type: 'text', text: JSON.stringify(result) }], details: {} };
            } }));
        const opts = buildSessionOptions(sdk, { cwd: raw.workspace, agentDir: raw.agentDir, sessionDir: raw.sessionDir, sessionFile: raw.piSessionPath, systemPrompt: systemInstruction(raw.role) + (raw.skillBundle?.prompt ?? ''), skills: raw.skillBundle?.skills ?? [], thinking: raw.model.thinking }, customTools, modelRuntime, model);
        ({ session } = await sdk.createAgentSession(opts));
        send({ type: 'ready', sessionFile: session.sessionFile, model: { provider: session.model?.provider, id: session.model?.id } });
        session.subscribe((e) => {
            if (e.type === 'message_update' && e.assistantMessageEvent?.type === 'text_delta')
                send({ type: 'delta', text: e.assistantMessageEvent.delta });
            if (e.type === 'message_end' && e.message?.role === 'assistant') {
                providerFailure = assistantFailure(e.message) ?? providerFailure;
                const content = Array.isArray(e.message.content) ? e.message.content.filter((p) => p.type === 'text').map((p) => p.text).join('') : '';
                send({ type: 'assistant_message', content, usage: e.message.usage ?? null, stopReason: e.message.stopReason ?? null, error: assistantFailure(e.message) ?? null });
            }
            if (e.type === 'turn_start' && ++turns > 12) {
                stopping = true;
                void session.abort();
            }
            if (e.type === 'agent_settled')
                send({ type: 'settled' });
        });
        await session.prompt(buildWorkerPrompt(raw.prompt, raw.piSessionPath ? null : raw.history, raw.hostMessages ?? []));
        if (!providerFailure && !stopping && raw.hostMessages?.length)
            send({ type: 'context_ack', messageIds: raw.hostMessages.map((m) => m.id) });
        if (providerFailure)
            send({ type: 'failure', error: providerFailure });
        else
            send({ type: 'done', aborted: stopping, sessionFile: session.sessionFile });
    }
    catch (error) {
        send({ type: 'failure', error: error instanceof Error ? error.message : String(error) });
    }
    finally {
        session?.dispose();
        for (const p of pending.values()) {
            clearTimeout(p.timer);
            p.reject(new Error('Worker 正在退出'));
        }
        pending.clear();
        setTimeout(() => process.exit(0), 50);
    }
});
process.on('disconnect', () => { stopping = true; void session?.abort(); setTimeout(() => process.exit(1), 500).unref(); });
//# sourceMappingURL=index.js.map