import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {isProviderTimeout,PROVIDER_TIMEOUT_FAILURE} from './runtime.js';

/** Count the HTTP transport lifetime, including the streamed body, rather than an SDK turn. */
export function managedModelFetch(fetcher:typeof fetch,acquire:(key:string)=>Promise<{allowed:boolean}>,finish:(key:string,value:{state:'succeeded'|'failed'|'cancelled';httpStatus?:number;receivedBytes?:number})=>Promise<unknown>,stop:AbortSignal):typeof fetch {
 return async(input,init)=>{
  const key=randomUUID(),signal=AbortSignal.any([stop,...(init?.signal?[init.signal]:[]),...(input instanceof Request?[input.signal]:[])]);let sent=false,finished=false,httpStatus:number|undefined,receivedBytes=0;
  const end=async(state:'succeeded'|'failed'|'cancelled')=>{if(finished)return;finished=true;await finish(key,{state,...(httpStatus?{httpStatus}:{}),receivedBytes});};
  let response:Response;
  try{
   signal.throwIfAborted();while(!(await acquire(key)).allowed){signal.throwIfAborted();await delay(100,undefined,{signal});}
   signal.throwIfAborted();sent=true;response=await fetcher(input,{...init,signal});httpStatus=response.status;
  }catch(error){await end(!sent||signal.aborted?'cancelled':'failed');throw error;}
  if(!response.body){await end(response.ok?'succeeded':'failed');return response;}
  const reader=response.body.getReader();let closing:Promise<void>|undefined;
  const close=async()=>{if(closing)return closing;closing=(async()=>{try{await reader.cancel();}finally{await end('cancelled');}})();return closing;};
  const aborted=()=>{void close().catch(()=>{});};signal.addEventListener('abort',aborted,{once:true});
  if(signal.aborted)await close();
  const body=new ReadableStream<Uint8Array>({
   async pull(controller){try{signal.throwIfAborted();const next=await reader.read();signal.throwIfAborted();if(next.done){signal.removeEventListener('abort',aborted);await end(response.ok?'succeeded':'failed');controller.close();}else{receivedBytes+=next.value.byteLength;controller.enqueue(next.value);}}catch(error){signal.removeEventListener('abort',aborted);try{await reader.cancel();}catch{}finally{await end(signal.aborted?'cancelled':'failed');}controller.error(!signal.aborted&&isProviderTimeout(error)?new Error(PROVIDER_TIMEOUT_FAILURE):error);}},
   async cancel(){signal.removeEventListener('abort',aborted);await close();}
  },{highWaterMark:0});
  const wrapped=new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  for(const key of ['url','redirected','type'] as const)Object.defineProperty(wrapped,key,{value:response[key]});
  return wrapped;
 };
}
