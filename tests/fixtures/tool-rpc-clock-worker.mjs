// Only tool/control RPC budgets use a virtual clock; SDK, IPC and HTTP stay real.
const nativeSetTimeout=globalThis.setTimeout,nativeClearTimeout=globalThis.clearTimeout,timers=new Set(),starts=[];
let elapsed=0,loaded=false;
const send=value=>process.connected&&process.send(value);
globalThis.setTimeout=(callback,ms,...args)=>{
 if(ms!==30000&&ms!==80000)return nativeSetTimeout(callback,ms,...args);
 const timer={at:elapsed+ms,callback:()=>callback(...args),unref(){return this;},ref(){return this;}};
 timers.add(timer);return timer;
};
globalThis.clearTimeout=timer=>timers.delete(timer)||nativeClearTimeout(timer);
process.on('message',message=>{
 if(!loaded&&message.type==='start'){starts.push(message);return;}
 if(message.type==='fixture_tick'){
  elapsed+=message.ms;
  for(const timer of [...timers])if(timer.at<=elapsed){timers.delete(timer);timer.callback();}
 }
 if(message.type?.startsWith('fixture_'))send({fixture:'ack',key:message.key,timers:timers.size});
});
await import('../../dist/apps/agent-worker/index.js');
loaded=true;for(const message of starts)process.emit('message',message);
