/** Display traffic gets one IPC credit; HTTP control never waits for that credit. */
export function workerDeltaSender(send:(message:{type:'delta';deltaId:number;text:string})=>void) {
 let sequence=0,inflight:number|undefined,buffer='',saturated=false;
 const flush=()=>{if(inflight!==undefined||!buffer)return;const text=buffer;buffer='';inflight=++sequence;send({type:'delta',deltaId:inflight,text});};
 return {
  push(text:string){
   if(saturated||!text)return;
   const room=4000-buffer.length;
   buffer+=text.slice(0,room);
   // Pause this message's preview if the host falls behind; its final text is saved in full.
   if(text.length>room){saturated=true;if(/[\uD800-\uDBFF]$/.test(buffer))buffer=buffer.slice(0,-1);}
   flush();
  },
  acknowledge(deltaId:number){if(deltaId!==inflight)return;inflight=undefined;flush();},
  clear(){buffer='';saturated=false;inflight=undefined;}
 };
}
