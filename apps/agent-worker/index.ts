import type {JsonSchema} from '../../packages/contracts/operations/schema.js';
import {buildWorkerPrompt} from '../../packages/pi-adapter/prompt.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSessionOptions, buildCustomTools, systemInstruction, assistantFailure } from '../../packages/pi-adapter/options.js';
import { locatePi, inspectPi, piFailure } from '../../packages/pi-adapter/runtime.js';
import type { AgentSession } from '@earendil-works/pi-coding-agent';
import type { Role, ModelConfig } from '../../packages/domain/types.js';
import type { SessionSetup } from '../../packages/pi-adapter/options.js';
import type { HostNotice } from '../../packages/pi-adapter/prompt.js';
type WorkerMessage =
    | {type: 'tool_response'; requestId: number; error?: {code: string; message: string}; result?: unknown}
    | {type: 'abort'}
    | {type: 'steer' | 'follow_up'; content: string; messageId: string}
    | {type: 'start'; repoRoot: string; workspace: string; agentDir: string; sessionDir: string; modelsPath: string; piSessionPath: string | null; role: Role; model: ModelConfig; prompt: string; history: string | null; hostMessages?: HostNotice[]; skillBundle?: {prompt: string; skills: SessionSetup['skills']}; tools: {name: string; description: string; example: unknown; inputSchema: JsonSchema}[]};
let session: AgentSession | undefined;
let providerFailure: string | undefined;
let started = false, stopping = false, turns = 0;
let seq = 0;
const pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (e: Error) => void;
    timer: NodeJS.Timeout;
}>();
function send(value: unknown) {
    if (process.connected)
        process.send?.(value);
}
function rpc(tool: string, input: unknown, toolCallId: string) { return new Promise<unknown>((resolve, reject) => { const requestId = ++seq; const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('受控工具请求超时')); }, 30000); pending.set(requestId, { resolve, reject, timer }); send({ type: 'tool', requestId, tool, input, toolCallId }); }); }
process.on('message', async (message) => {
    const raw = message as WorkerMessage;
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
        const inspection = inspectPi(raw.repoRoot, raw.model);
        if (!inspection.ready) throw new Error(`${inspection.code}: ${inspection.message}`);
        const installed = locatePi(raw.repoRoot);
        if (!installed)
            throw new Error('PI_NOT_INSTALLED');
        const sdk: typeof import('@earendil-works/pi-coding-agent') = await import(pathToFileURL(installed.sdkPath).href);
        mkdirSync(raw.agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(raw.sessionDir, { recursive: true, mode: 0o700 });
        const modelRuntime = await sdk.ModelRuntime.create({ authPath: join(raw.agentDir, 'auth.json'), modelsPath: raw.modelsPath });
        const model = modelRuntime.getModel(raw.model.provider, raw.model.model);
        if (!model)
            throw new Error('MODEL_NOT_FOUND: 模型目录中不存在此供应商/模型，请核对 models.json 和模型 ID');
        if (process.env.PI_API_KEY)
            await modelRuntime.setRuntimeApiKey(raw.model.provider, process.env.PI_API_KEY);
        if (!modelRuntime.hasConfiguredAuth(raw.model.provider)) throw new Error('AUTH_MISSING: 请为所选供应商配置凭据');
        if (raw.tools.some(t => !t.inputSchema || t.inputSchema.type !== 'object')) throw new Error('SDK_CONTRACT_MISMATCH: 工具缺少精确输入 Schema');
        const customTools = buildCustomTools(raw.tools, rpc);
        const opts = buildSessionOptions(sdk, { cwd: raw.workspace, agentDir: raw.agentDir, sessionDir: raw.sessionDir, sessionFile: raw.piSessionPath, systemPrompt: systemInstruction(raw.role) + (raw.skillBundle?.prompt ?? ''), skills: raw.skillBundle?.skills ?? [], thinking: raw.model.thinking }, customTools, modelRuntime, model);
        ({ session } = await sdk.createAgentSession(opts));
        if (session.model?.provider !== raw.model.provider || session.model?.id !== raw.model.model) throw new Error('MODEL_FALLBACK_REFUSED: SDK 尝试切换未经批准的模型');
        send({ type: 'ready', sessionFile: session.sessionFile, sessionId: session.sessionId, activeTools: session.getActiveToolNames(), model: { provider: session.model?.provider, id: session.model?.id } });
        session.subscribe((e) => {
            if (e.type === 'tool_execution_start' || e.type === 'tool_execution_end')
                send({type: e.type, tool: e.toolName, toolCallId: e.toolCallId, ...(e.type === 'tool_execution_end' ? {isError: e.isError} : {})});
            if (e.type === 'message_update' && e.assistantMessageEvent?.type === 'text_delta')
                send({ type: 'delta', text: e.assistantMessageEvent.delta });
            if (e.type === 'message_end' && e.message?.role === 'assistant') {
                providerFailure = e.message.stopReason === 'aborted' && stopping ? providerFailure : assistantFailure(e.message) ?? providerFailure;
                const content = Array.isArray(e.message.content) ? e.message.content.filter(p => p.type === 'text').map(p => p.text).join('') : '';
                send({ type: 'assistant_message', content, usage: e.message.usage ?? null, stopReason: e.message.stopReason ?? null, error: assistantFailure(e.message) ?? null });
            }
            if (e.type === 'turn_start' && ++turns > 12) {
                stopping = true;
                void session?.abort();
            }
            if (e.type === 'agent_settled')
                send({ type: 'settled' });
        });
        if (!stopping) await session.prompt(buildWorkerPrompt(raw.prompt, raw.piSessionPath ? null : raw.history, raw.hostMessages ?? []));
        if (!providerFailure && !stopping && raw.hostMessages?.length)
            send({type: 'context_ack', messageIds: raw.hostMessages.map((m: {id: string}) => m.id)});
        if (providerFailure)
            send({ type: 'failure', error: providerFailure });
        else
            send({ type: 'done', aborted: stopping, sessionFile: session.sessionFile });
    }
    catch (error) {
        send({ type: 'failure', error: piFailure(error) });
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
