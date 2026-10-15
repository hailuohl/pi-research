// Offline test clock only; the real Worker, Pi SDK and HTTP parser remain in use.
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {locatePi} from '../../dist/packages/pi-adapter/runtime.js';
const installed=locatePi(process.env.PI_TIMEOUT_FIXTURE_REPO),require=createRequire(installed.sdkPath),transportTimers=require(join(dirname(require.resolve('undici')),'lib/util/timers.js'));
// Load before the fixture replaces fetch, so the SDK recognizes a deliberate custom transport.
await import(new URL('./core/http-dispatcher.js',pathToFileURL(installed.sdkPath)).href);
const send=value=>process.connected&&process.send(value),nativeSetTimeout=globalThis.setTimeout,nativeClearTimeout=globalThis.clearTimeout,budgets=new Set(),starts=[];let elapsed=0,pending,loaded=false;
globalThis.setTimeout=(callback,ms,...args)=>{
 if(ms!==120000&&ms!==600000)return nativeSetTimeout(callback,ms,...args);
 const timer={at:elapsed+ms,callback:()=>callback(...args),unref(){return this;},ref(){return this;}};budgets.add(timer);send({fixture:'budget',ms});return timer;
};
globalThis.clearTimeout=timer=>budgets.delete(timer)||nativeClearTimeout(timer);
if(process.env.PI_TIMEOUT_FIXTURE_MODE==='virtual')globalThis.fetch=async(_url,init)=>new Promise((resolve,reject)=>{
 const abort=()=>{pending=undefined;reject(new DOMException('FAKE_PRIVATE_TIMEOUT_BODY','AbortError'));};
 if(init.signal.aborted)return abort();init.signal.addEventListener('abort',abort,{once:true});
 pending=text=>{init.signal.removeEventListener('abort',abort);resolve(new Response(text,{headers:{'content-type':'text/event-stream'}}));};send({fixture:'request',body:JSON.parse(init.body)});
});
process.on('message',message=>{
 if(!loaded&&message.type==='start'){starts.push(message);return;}
 if(message.type==='fixture_sdk_tick'){elapsed+=message.ms;for(const timer of [...budgets])if(timer.at<=elapsed){budgets.delete(timer);timer.callback();}}
 if(message.type==='fixture_transport_tick')transportTimers.tick(message.ms);
 if(message.type==='fixture_response'){const respond=pending;pending=undefined;respond?.(message.text);}
 if(message.type?.startsWith('fixture_'))send({fixture:'ack',key:message.key,pending:!!pending});
});
await import('../../dist/apps/agent-worker/index.js');
loaded=true;for(const message of starts)process.emit('message',message);
