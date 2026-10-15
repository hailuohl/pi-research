import {ensure} from '../domain/errors.js';
import {modelPayload,resolvedThinking} from './model-definition.js';
import type {ModelApi,ModelDefinitionInput,ModelSelection,PiThinking} from './model-management-types.js';
import {nativeAvailability,type NativeSource} from './native-request-types.js';
export {nativeAvailability} from './native-request-types.js';

export const NATIVE_FILE_BYTES=20*1024*1024,NATIVE_REQUEST_BYTES=32*1024*1024,NATIVE_RESPONSE_BYTES=4*1024*1024;
export function nativeEndpoint(baseUrl:string,api:ModelApi){const url=new URL(baseUrl);ensure(!url.username&&!url.password&&!url.search&&!url.hash&&(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)),'NATIVE_ENDPOINT_INVALID','原生请求地址无效',400);return baseUrl.replace(/\/$/,'')+(api==='openai-completions'?'/chat/completions':api==='openai-responses'?'/responses':/\/v1\/?$/.test(baseUrl)?'/messages':'/v1/messages');}
export interface NativeFile {source:NativeSource;bytes:Buffer;}
export interface NativePrevious {prompt:string;blocks:unknown[];}
export interface NativeReasoning {level:PiThinking;value?:string|null;adaptive?:boolean;}
/** Only host-verified bytes can enter these fixed protocol shapes. No arbitrary request body or tools. */
export function nativeRequestBody(api:ModelApi,definition:ModelDefinitionInput,selection:ModelSelection,prompt:string,files:NativeFile[],search:boolean,maxOutputTokens:number,previous?:NativePrevious,reasoning?:NativeReasoning):Record<string,unknown>{
 const availability=nativeAvailability(api,definition);for(const {source,bytes}of files){ensure(bytes.length===source.size&&bytes.length>0&&bytes.length<=NATIVE_FILE_BYTES,'NATIVE_SOURCE_INVALID','原件大小无效',400);ensure((source.mediaType==='application/pdf'?availability.pdf:availability.video).state==='available','NATIVE_UNSUPPORTED','此模型适配不支持选定原件',409);}
 ensure(!search||availability.nativeWebSearch.state==='available','NATIVE_UNSUPPORTED',availability.nativeWebSearch.reason,409);
 ensure(!previous||api==='anthropic-messages'&&search,'NATIVE_CONTINUATION_UNSUPPORTED','此续跑协议未接入',409);
 const content=(text:string)=>[{type:api==='openai-responses'?'input_text':'text',text},...files.map(({source,bytes})=>{
  const data=bytes.toString('base64'),dataUrl=`data:${source.mediaType};base64,${data}`;
  if(source.mediaType==='video/mp4')return api==='openai-responses'?{type:'input_video',video_url:dataUrl}:{type:'video_url',video_url:{url:dataUrl}};
  if(api==='anthropic-messages')return {type:'document',source:{type:'base64',media_type:'application/pdf',data}};
  return api==='openai-responses'?{type:'input_file',filename:source.title,file_data:dataUrl}:{type:'file',file:{filename:source.title,file_data:dataUrl}};
 })];
 const body:Record<string,unknown>={model:selection.model,stream:false};
 if(api==='openai-responses'){body.input=[{role:'user',content:content(prompt)}];body.max_output_tokens=maxOutputTokens;if(search){body.tools=[{type:'web_search'}];body.tool_choice='required';body.max_tool_calls=1;body.include=['web_search_call.action.sources'];}}
 else{body.messages=previous?[{role:'user',content:content(previous.prompt)},{role:'assistant',content:previous.blocks},{role:'user',content:[{type:'text',text:prompt}]}]:[{role:'user',content:content(prompt)}];body.max_tokens=maxOutputTokens;if(search)body.tools=[{type:'web_search_20250305',name:'web_search',max_uses:1}];}
 const thinking=reasoning?.level??resolvedThinking(definition,selection.thinking),wire=reasoning?.value??thinking;ensure(reasoning?.value!==null,'NATIVE_REASONING_UNAVAILABLE','SDK明确不支持此推理等级',409);
 if(thinking!=='off'||reasoning?.value!==undefined){if(api==='openai-responses')body.reasoning={effort:wire};else if(api==='openai-completions')body.reasoning_effort=wire;else if(reasoning?.adaptive){body.thinking={type:'adaptive'};body.output_config={effort:wire};}else if(thinking!=='off')body.thinking={type:'enabled',budget_tokens:Math.max(1024,Math.min(8192,maxOutputTokens-1024))};}
 if(api==='openai-completions'&&definition.nativeProfile==='openai'&&thinking!=='off'){delete body.max_tokens;body.max_completion_tokens=maxOutputTokens;}
 if(definition.nativeProfile==='openrouter'&&files.some(f=>f.source.mediaType==='application/pdf'))body.plugins=[{id:'file-parser',pdf:{engine:'native'}}];
 const result=modelPayload(body,definition,selection.thinking,api) as Record<string,unknown>;
 if(api==='anthropic-messages'&&result.thinking&&typeof result.thinking==='object'&&(result.thinking as {type?:string}).type==='enabled'){const budget=(result.thinking as {budget_tokens?:number}).budget_tokens;ensure(typeof budget==='number'&&budget>=1024&&budget<maxOutputTokens,'NATIVE_OUTPUT_LIMIT','Anthropic thinking预算须至少1024且小于输出上限',400);}
 ensure(Buffer.byteLength(JSON.stringify(result))<=NATIVE_REQUEST_BYTES,'NATIVE_REQUEST_LIMIT','实际模型JSON请求超过32 MiB（包含Base64及历史续跑）',413);return result;
}
