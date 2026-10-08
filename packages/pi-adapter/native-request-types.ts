import type {ModelSelection,ModelApi,NativeProfile,EffectiveCapability,ModelDefinitionInput} from './model-management-types.js';
import type {NativeResponse} from './native-response.js';
export interface NativeSourcePick {kind:'document'|'media';id:string;}
export interface NativeSource extends NativeSourcePick {artifactId:string;title:string;digest:string;size:number;mediaType:'application/pdf'|'video/mp4';scope:'whole-file';}
export type NativeState='pending'|'approved'|'rejected'|'stale'|'running'|'completed'|'incomplete'|'failed'|'cancelled'|'unknown';
export interface NativeAvailability {api:ModelApi|null;profile:NativeProfile;pdf:EffectiveCapability;video:EffectiveCapability;nativeWebSearch:EffectiveCapability;maxOutputTokens?:number;reason?:string;}
export type NativePublicResponse=Omit<NativeResponse,'continuation'>;
export interface NativeRequestView {
 id:string;version:number;projectId:string;sessionId:string;createdAt:string;updatedAt:string;
 prompt:string;model:ModelSelection;destination:{baseUrl:string;api:ModelApi;profile:NativeProfile};
 sources:NativeSource[];search:boolean;maxOutputTokens:number;expiresAt:string;state:NativeState;
 dispatchBudget:1;dispatched:0|1;previousRequestId?:string;
 approval:{id:string;version:number;status:'pending'|'approved'|'rejected'|'stale';reason:string};
 response:NativePublicResponse|null;receipt:null|{artifactId:string;digest:string};continuationAvailable:boolean;
 error?:string;
}
export interface NativeRequestList {requests:NativeRequestView[];sources:NativeSource[];availability:NativeAvailability;nextCursor:number|null;}
export interface NativePrepareInput {expectedSessionVersion:number;prompt:string;sources:NativeSourcePick[];search:boolean;maxOutputTokens:number;previousRequestId?:string;}
export interface NativeDecisionInput {expectedVersion:number;expectedApprovalVersion:number;approved:boolean;}
/** One protocol/profile matrix shared by model management and owner request preparation. */
export function nativeAvailability(api:ModelApi|null,model:ModelDefinitionInput|undefined):NativeAvailability {
 const profile=model?.nativeProfile??'none';
 const status=(name:'pdf'|'video'|'nativeWebSearch',supported:boolean,reason:string):EffectiveCapability=>({declared:model?.capabilities[name]??false,state:!model?.capabilities[name]?'disabled':supported?'available':'unsupported',reason:!model?.capabilities[name]?'模型未声明此输入或搜索能力':supported?'仅支持整原件及逐请求显式批准；配置不代表真实接口已验证':reason});
 return {api,profile,...(model?{maxOutputTokens:Math.min(8192,model.maxTokens)}:{}),pdf:status('pdf',profile==='openai'&&api!=='anthropic-messages'&&api!==null||profile==='anthropic'&&api==='anthropic-messages'||profile==='openrouter'&&api==='openai-completions','此原生适配/API未接入PDF；OpenRouter PDF仅Chat且强制native解析'),video:status('video',profile==='qwen'&&api==='openai-completions'||profile==='openrouter'&&(api==='openai-completions'||api==='openai-responses'),'视频仅支持Qwen Chat或OpenRouter Chat/Responses的明确兼容模型'),nativeWebSearch:status('nativeWebSearch',profile==='openai'&&api==='openai-responses'||profile==='anthropic'&&api==='anthropic-messages','原生搜索仅支持OpenAI Responses或Anthropic Messages；Chat无法保证一次搜索回执/预算，OpenRouter不得回退第三方搜索')};
}
