import {existsSync} from 'node:fs';
import {ResearchApp} from '../../dist/packages/research-app.js';
import {USER} from '../../dist/packages/domain/types.js';

const [directory,projectId,sessionId,inputJson,action,gate]=process.argv.slice(2),input=JSON.parse(inputJson),app=new ResearchApp(directory,process.cwd());
const startDeadline=setTimeout(()=>{app.close();process.disconnect();},12000);
process.send({type:'ready'});
process.once('message',message=>{
 clearTimeout(startDeadline);process.send({type:'attempting'});
 try{
  const result=app.store.transaction(()=>{
   if(message.hold){
    process.send({type:'holding'});const deadline=Date.now()+8000;
    while(!existsSync(gate)){if(Date.now()>deadline)throw Error('Synthetic race gate timed out');Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,10);}
   }
   return action==='withdraw'?app.operations.execute(USER,'run_intent_withdraw',input,{projectId,sessionId,idempotencyKey:'race-withdraw'}):app.runs.submit(USER,input.intentId);
  });
  process.send({type:'result',ok:true,result});
 }catch(error){process.send({type:'result',ok:false,code:error.code,message:error.message});}
 finally{app.close();process.disconnect();}
});
