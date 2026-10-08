import {imageContextReferences,publicationImageCatalog,PUBLICATION_IMAGE_TOOL,DOCUMENT_IMAGE_TOOL} from '../../packages/pi-adapter/publication-image.js';
import {applyModelConnection,connectionFetch,safeConnectionStream,type ModelConnection} from '../../packages/pi-adapter/model-connections.js';
import {resolvedThinking,modelPayload} from '../../packages/pi-adapter/model-definition.js';
import {managedModelFetch} from '../../packages/pi-adapter/model-fetch.js';
import {attachmentPayload,type AttachmentManifest,type NativeAttachmentReference} from '../../packages/pi-adapter/attachment-input.js';
import {MANAGED_HTTP_APIS} from '../../packages/scheduler/model-http.js';
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
    | {type: 'tool_response'|'model_http_response'; requestId: number; error?: {code: string; message: string}; result?: unknown}
    | {type: 'abort'}
    | {type: 'steer' | 'follow_up'; content: string; messageId: string;attachmentManifest?:AttachmentManifest}
    | {type: 'start'; attachmentManifests?:AttachmentManifest[];connection?:Omit<ModelConnection,'apiKey'>; managedHttp?:boolean; catalogFingerprint?:string; permissionMode?:import('../../packages/policy/session-permissions.js').PermissionReference['mode']; repoRoot: string; workspace: string; agentDir: string; sessionDir: string; modelsPath: string; piSessionPath: string | null; role: Role; model: ModelConfig; prompt: string; history: string | null; hostMessages?: HostNotice[]; skillBundle?: {prompt: string; skills: SessionSetup['skills']}; tools: {name: string; description: string; example: unknown; inputSchema: JsonSchema}[]};
let session: AgentSession | undefined;
let providerFailure: string | undefined;
let imageFailure: string | undefined;
let turnLimitFailure: string | undefined;
let started = false, stopping = false, taskSubmitted = false, turns = 0;
const httpStop=new AbortController();
let seq = 0;
const queuedInputs:Array<{id:string;content:string}>=[];
const attachmentManifests:AttachmentManifest[]=[];
let initialUserSeen=false;
const pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (e: Error) => void;
    timer: NodeJS.Timeout;
    attachmentRequest?:boolean;
}>();
function send(value: unknown) {
    if (process.connected)
        process.send?.(value);
}
function httpRpc(type:'model_http_acquire'|'model_http_finish',key:string,result?:unknown,imageRefs?:unknown[],attachmentRefs?:NativeAttachmentReference[]){return new Promise<unknown>((resolve,reject)=>{const requestId=++seq,timer=setTimeout(()=>{pending.delete(requestId);reject(new Error('MODEL_HTTP_CONTROL_TIMEOUT: HTTP额度控制未响应'));},30000);pending.set(requestId,{resolve,reject,timer,attachmentRequest:!!attachmentRefs?.length});send({type,requestId,key,result,...(imageRefs?{imageRefs}:{}),...(attachmentRefs?{attachmentRefs}:{})});});}
function rpc(tool: string, input: unknown, toolCallId: string) { return new Promise<unknown>((resolve, reject) => { const requestId = ++seq; const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('受控工具请求超时')); }, 30000); pending.set(requestId, { resolve, reject, timer }); send({ type: 'tool', requestId, tool, input, toolCallId }); }); }
process.on('message', async (message) => {
    const raw = message as WorkerMessage;
    if (raw?.type === 'tool_response'||raw?.type==='model_http_response') {
        const p = pending.get(raw.requestId);
        if (!p)
            return;
        clearTimeout(p.timer);
        pending.delete(raw.requestId);
        if(raw.type==='model_http_response'&&raw.error&&(p.attachmentRequest||raw.error.code.startsWith('MODEL_IMAGE_')||raw.error.code.startsWith('MODEL_ATTACHMENT_')))imageFailure=`${raw.error.code}: ${raw.error.message}`;
        raw.error ? p.reject(new Error(`${raw.error.code}: ${raw.error.message}`)) : p.resolve(raw.result);
        return;
    }
    if (raw?.type === 'abort') {
        stopping = true;httpStop.abort();
        await session?.abort();
        return;
    }
    if (raw?.type === 'steer' || raw?.type === 'follow_up') {
        if (session && !taskSubmitted && !stopping) {
            try {
                queuedInputs.push({id:raw.messageId,content:raw.content});
                if(raw.attachmentManifest)attachmentManifests.push(raw.attachmentManifest);
                raw.type === 'steer' ? await session.steer(raw.content) : await session.followUp(raw.content);
                if (taskSubmitted || stopping) { session.clearQueue(); send({type:'control_error',messageId:raw.messageId,error:'Worker 已停止接收输入'}); return; }
                send({ type: 'message_ack', messageId: raw.messageId });
            }
            catch (e) {
                const index=queuedInputs.findIndex(m=>m.id===raw.messageId);if(index>=0)queuedInputs.splice(index,1);
                send({ type: 'control_error', messageId: raw.messageId, error: e instanceof Error ? e.message : String(e) });
            }
        }else send({type:'control_error',messageId:raw.messageId,error:'Worker 尚未就绪或已停止接收输入'});
        return;
    }
    if (raw?.type !== 'start' || started)
        return;
    started = true;
    attachmentManifests.push(...(raw.attachmentManifests??[]));
    try {
        const inspection = inspectPi(raw.repoRoot, raw.model);
        if (!inspection.ready) throw new Error(`${inspection.code}: ${inspection.message}`);
        const installed = locatePi(raw.repoRoot);
        if (!installed)
            throw new Error('PI_NOT_INSTALLED');
        const sdk: typeof import('@earendil-works/pi-coding-agent') = await import(pathToFileURL(installed.sdkPath).href);
        mkdirSync(raw.agentDir, { recursive: true, mode: 0o700 });
        mkdirSync(raw.sessionDir, { recursive: true, mode: 0o700 });
        const catalogBefore=publicationImageCatalog(raw.modelsPath);
        const authPath=join(raw.agentDir,'auth.json');
        let modelRuntime = await sdk.ModelRuntime.create({ authPath, modelsPath: raw.modelsPath,...(raw.connection?{refreshOnCreate:false}:{}) });
        if(raw.connection)modelRuntime=await applyModelConnection(sdk,modelRuntime,raw.model,raw.connection,process.env.PI_API_KEY??'',authPath);
        const catalogAfter=publicationImageCatalog(raw.modelsPath);
        const checkCatalog=()=>{if(raw.managedHttp&&(!raw.catalogFingerprint||catalogBefore!==raw.catalogFingerprint||catalogAfter!==raw.catalogFingerprint||publicationImageCatalog(raw.modelsPath)!==raw.catalogFingerprint))throw new Error('MODEL_IMAGE_CATALOG_CHANGED: 模型目录已变化，请停止并重新核对授权');};
        const model = modelRuntime.getModel(raw.model.provider, raw.model.model);
        if (!model)
            throw new Error('MODEL_NOT_FOUND: 模型目录中不存在此供应商/模型，请核对 models.json 和模型 ID');
        if (process.env.PI_API_KEY&&!raw.connection)
            await modelRuntime.setRuntimeApiKey(raw.model.provider, process.env.PI_API_KEY);
        if (!modelRuntime.hasConfiguredAuth(raw.model.provider)) throw new Error('AUTH_MISSING: 请为所选供应商配置凭据');
        if (raw.tools.some(t => !t.inputSchema || t.inputSchema.type !== 'object')) throw new Error('SDK_CONTRACT_MISMATCH: 工具缺少精确输入 Schema');
        const customTools = buildCustomTools(raw.tools, async (name, input, callId) => {
            if(name===PUBLICATION_IMAGE_TOOL||name===DOCUMENT_IMAGE_TOOL){if(!raw.managedHttp)throw new Error('MODEL_IMAGE_UNMANAGED: 图片需要受管HTTP');if(!model.input?.includes('image'))throw new Error('MODEL_IMAGE_UNSUPPORTED: 当前模型目录未声明图片能力');checkCatalog();}
            const result = await rpc(name, input, callId);
            if (name === 'task_result_submit') taskSubmitted = true;
            return result;
        });
        const definition=raw.connection?.models?.find(m=>m.model===raw.model.model&&!m.controlOnly),thinking=resolvedThinking(definition,raw.model.thinking);
        const opts = buildSessionOptions(sdk, { cwd: raw.workspace, agentDir: raw.agentDir, sessionDir: raw.sessionDir, sessionFile: raw.piSessionPath, systemPrompt: systemInstruction(raw.role,raw.tools.some(tool=>tool.name==='host_execute'),raw.permissionMode) + (raw.skillBundle?.prompt ?? ''), skills: raw.skillBundle?.skills ?? [], thinking }, customTools, modelRuntime, model);
        ({ session } = await sdk.createAgentSession(opts));
        if(raw.managedHttp&&!(MANAGED_HTTP_APIS as readonly string[]).includes(model.api))throw new Error('MODEL_HTTP_UNSUPPORTED: 所选SDK传输尚未接入受管HTTP，不会绕过限流');
        const stream=session.agent.streamFunction;
        session.agent.streamFunction=async(chosen,context,options)=>{
            if(chosen.provider!==raw.model.provider||chosen.id!==raw.model.model||chosen.api!==model.api)throw new Error('MODEL_FALLBACK_REFUSED: 请求模型或传输已改变');
            const refs=imageContextReferences(context,chosen.input?.includes('image')===true,raw.managedHttp===true);
            if(!raw.managedHttp){const response=await stream(chosen,context,options);return raw.connection?safeConnectionStream(response):response;}
            if(refs.length)checkCatalog();
            // Each transport closure owns this exact context, including all historical images.
            let attachmentRefs:NativeAttachmentReference[]=[];
            const fetcher=managedModelFetch(raw.connection?connectionFetch(globalThis.fetch,raw.connection.baseUrl):globalThis.fetch,key=>{if(refs.length||attachmentRefs.length)checkCatalog();return httpRpc('model_http_acquire',key,undefined,refs,attachmentRefs) as Promise<{allowed:boolean}>;},(key,result)=>httpRpc('model_http_finish',key,result),httpStop.signal);
            const response=await stream(chosen,context,{...options,transport:'sse',fetch:fetcher,onPayload:(body:unknown)=>{const configured=definition?modelPayload(body,definition,raw.model.thinking,raw.connection!.api):body;const attached=attachmentPayload(configured,context,model.api as import('../../packages/pi-adapter/model-management-types.js').ModelApi,definition,attachmentManifests,chosen.input?.includes('image')===true);attachmentRefs=attached.references;return attached.payload;}});
            return raw.connection?safeConnectionStream(response):response;
        };
        const finishTurn = session.agent.finishTurn;
        session.agent.finishTurn = async (turn, signal) => {
            const decision = await finishTurn?.(turn, signal);
            if (taskSubmitted) { session!.clearQueue(); return {action: 'end'}; }
            return decision ?? undefined;
        };
        if (session.model?.provider !== raw.model.provider || session.model?.id !== raw.model.model) throw new Error('MODEL_FALLBACK_REFUSED: SDK 尝试切换未经批准的模型');
        send({ type: 'ready', sessionFile: session.sessionFile, sessionId: session.sessionId, activeTools: session.getActiveToolNames(), model: { provider: session.model?.provider, id: session.model?.id } });
        session.subscribe((e) => {
            if(e.type==='message_start'&&e.message.role==='user'){
                if(!initialUserSeen)initialUserSeen=true;
                else {
                    const body=typeof e.message.content==='string'?e.message.content:e.message.content.filter(p=>p.type==='text').map(p=>p.text).join('');
                    // Controlled resource loader has no skills, templates or input extensions; match only the next raw input.
                    const next=queuedInputs[0];
                    if(next&&next.content===body){queuedInputs.shift();send({type:'input_consumed',messageId:next.id});}
                }
            }
            if (e.type === 'tool_execution_start' || e.type === 'tool_execution_end')
                send({type: e.type, tool: e.toolName, toolCallId: e.toolCallId, ...(e.type === 'tool_execution_end' ? {isError: e.isError} : {})});
            if (e.type === 'message_update' && e.assistantMessageEvent?.type === 'text_delta')
                send({ type: 'delta', text: e.assistantMessageEvent.delta });
            if (e.type === 'message_end' && e.message?.role === 'assistant') {
                providerFailure = imageFailure ?? turnLimitFailure ?? (e.message.stopReason === 'aborted' && stopping ? providerFailure : assistantFailure(e.message) ?? providerFailure);
                const content = Array.isArray(e.message.content) ? e.message.content.filter(p => p.type === 'text').map(p => p.text).join('') : '';
                const toolCalls = Array.isArray(e.message.content) ? e.message.content.filter(p => p.type === 'toolCall').map(p => p.name).slice(0,64) : [];
                send({ type: 'assistant_message', content, toolCalls, phase: toolCalls.length || e.message.stopReason === 'toolUse' ? 'commentary' : 'final_answer', usage: e.message.usage ?? null, stopReason: e.message.stopReason ?? null, error: imageFailure ?? turnLimitFailure ?? assistantFailure(e.message) ?? null });
            }
            if (e.type === 'turn_start' && ++turns > 12 && !stopping) {
                turnLimitFailure = providerFailure ?? 'AGENT_TURN_LIMIT: 本轮已达到12轮处理上限；已保存内容保留，可在原会话发送“继续”。';
                stopping = true;httpStop.abort();
                void session?.abort();
            }
            if (e.type === 'agent_settled')
                send({ type: 'settled' });
        });
        if (!stopping) await session.prompt(buildWorkerPrompt(raw.prompt, raw.piSessionPath ? null : raw.history, raw.hostMessages ?? []));
        if (!providerFailure && !stopping && raw.hostMessages?.length)
            send({type: 'context_ack', messageIds: raw.hostMessages.map((m: {id: string}) => m.id)});
        providerFailure=imageFailure??turnLimitFailure??providerFailure;
        if (providerFailure)
            send({ type: 'failure', error: providerFailure });
        else
            send({ type: 'done', aborted: stopping, sessionFile: session.sessionFile });
    }
    catch (error) {
        const code=(error as {code?:string})?.code;
        send({ type: 'failure', error: imageFailure??turnLimitFailure??piFailure(code?.startsWith('MODEL_IMAGE_')?`${code}: ${(error as Error).message}`:error) });
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
process.on('disconnect', () => { stopping = true;httpStop.abort(); void session?.abort(); setTimeout(() => process.exit(1), 500).unref(); });
