import {superviseSshRun} from '../../packages/runners/ssh-supervisor.js';
import {appendFileSync, mkdirSync, writeFileSync, renameSync} from 'node:fs';
import {join} from 'node:path';
import {now} from '../../packages/storage/store.js';
import {TERMINAL} from '../../packages/runners/service.js';
import {ResearchApp} from '../../packages/research-app.js';
import {TrustedExampleAdapter} from '../../packages/runners/trusted-example.js';
import {superviseDockerRun} from '../../packages/runners/docker-supervisor.js';
import type {DockerRun,DockerRunResult,RunExecution,RunnerProcess} from '../../packages/runners/adapter.js';
import type {Run} from '../../packages/domain/types.js';
import {DomainError,ensure} from '../../packages/domain/errors.js';

const [dataDir,repoRoot,runId]=process.argv.slice(2);
if(!dataDir||!repoRoot||!runId)throw new Error('Usage: supervisor DATA REPO RUN');
const app=new ResearchApp(dataDir,repoRoot),{store,compute}=app,service=app.runs;
const controlDir=join(dataDir,'jobs',runId,'control');
if(store.get<Run>('run',runId).state==='queued')try{await compute.verifyTarget('run',runId);}catch{await compute.stop();store.close();process.exit(0);}
const run=compute.withAdmission('run',runId,()=>{
    const r=store.get<Run>('run',runId);if(TERMINAL.includes(r.state))return null;
    const docker=r.manifest.contract.runner!=='trusted-example';
    if(r.state==='queued'){try{service.assertLaunchable(r);}catch(error){service.cancelBeforeLaunch(r,error);return null;}}
    else if(!docker||!r.execution||r.execution.leaseUntil>Date.now())return null;
    if(docker){
        const before:RunExecution=r.execution??{backend:'docker',dockerContext:r.manifest.contract.dockerContext??'default',containerName:`pi-research-${r.id}`,controlDir,generation:0,leaseUntil:0,startRequested:false,recoveryCount:0};
        return store.update<Run>('run',r.id,r.version,{state:r.state==='queued'?'submitting':r.state,supervisorPid:process.pid,heartbeat:Date.now(),execution:{...before,generation:before.generation+1,leaseUntil:Date.now()+60000,recoveryCount:before.recoveryCount+(before.generation>0?1:0)}});
    }
    return store.update<Run>('run',r.id,r.version,{state:'submitting',supervisorPid:process.pid,heartbeat:Date.now()});
});
if(!run){await compute.stop();store.close();process.exit(0);}
mkdirSync(controlDir,{recursive:true,mode:0o700});
function receipt(exitCode:number|null,state:'succeeded'|'failed'|'cancelled',error?:string,facts?:DockerRunResult){
    const name=facts?`terminal-${facts.generation}`:'terminal',value={manifestDigest:run!.manifestDigest,exitCode,state,...(error?{error}:{}),...(facts?{facts}:{})};
    writeFileSync(join(controlDir,`${name}.tmp`),JSON.stringify(value),{mode:0o600});renameSync(join(controlDir,`${name}.tmp`),join(controlDir,`${name}.json`));
    service.finalize(runId,exitCode,state,error,facts);
}
try {
    if(run.execution){
        const generation=run.execution.generation;
        const fence=()=>{const r=store.get<Run>('run',runId);ensure(!TERMINAL.includes(r.state)&&r.execution?.generation===generation&&r.execution.leaseUntil>Date.now(),'LEASE_EXPIRED','监管器已失去作业租约');};
        const callbacks:import('../../packages/runners/adapter.js').DockerSupervisorCallbacks={
            paths:store.paths,read:()=>store.get<Run>('run',runId) as DockerRun,fence,verifyTarget:()=>compute.verifyTarget('run',runId),
            assertGrant:r=>service.assertExecutionGrant(r),
            patch:value=>store.transaction(()=>{fence();const r=store.get<Run>('run',runId);if(value.execution?.startRequested&&!r.execution!.startRequested){ensure(!r.cancelRequested,'RUN_CANCELLED','作业已请求取消');service.assertExecutionGrant(r);}return store.update<Run>('run',runId,r.version,value) as DockerRun;}),
            finalize:facts=>{fence();receipt(facts.exitCode,facts.state,facts.error,facts);},
        };
        if(run.execution.backend==='ssh')await superviseSshRun(run as DockerRun,app.context,callbacks);else await superviseDockerRun(run as DockerRun,callbacks);
    } else {
        const adapter=new TrustedExampleAdapter(run,repoRoot,store.paths);
        let processHandle:RunnerProcess|undefined,timer:NodeJS.Timeout|undefined,timeout:NodeJS.Timeout|undefined,observedCancel=false,timedOut=false,truncated=false,bytes=0,authorityError:string|undefined;
        try {
            await adapter.preflight();await adapter.stage();
            const log=join(store.paths.physical(run.outputDir),'stdout.log');writeFileSync(log,'',{mode:0o600});
            store.transaction(()=>{const current=store.get<Run>('run',runId);if(current.state==='cancelling'&&current.supervisorPid===process.pid&&!current.startRequested&&!current.childPid&&current.cancelRequested)throw new DomainError('RUN_CANCELLED','运行在启动前已取消');ensure(current.state==='submitting'&&current.supervisorPid===process.pid&&!current.startRequested&&!current.childPid&&!current.cancelRequested,'RUN_NOT_LAUNCHABLE','运行不再允许启动');service.assertExecutionGrant(current,true);store.update<Run>('run',current.id,current.version,{startRequested:true,startedAt:now()});});
            processHandle=await adapter.start((_stream,chunk)=>{const remaining=Math.max(0,16*1024*1024-bytes);bytes+=chunk.length;if(remaining)appendFileSync(log,chunk.subarray(0,remaining));if(chunk.length>remaining){truncated=true;void processHandle?.cancel();}});
            store.transaction(()=>{const r=store.get<Run>('run',runId);store.update<Run>('run',r.id,r.version,{state:r.cancelRequested?'cancelling':'running',childPid:processHandle!.pid,heartbeat:Date.now()});});
            timer=setInterval(()=>{const r=service.heartbeat(runId);if(r.cancelRequested&&!observedCancel){observedCancel=true;void processHandle!.cancel();}else if(r.runGrant&&!authorityError){try{service.assertExecutionGrant(r,false);}catch(error){authorityError=(error as Error).message;void processHandle!.cancel();}}},100);
            timeout=setTimeout(()=>{timedOut=true;void processHandle!.cancel();},run.manifest.contract.timeoutSeconds*1000);
            const result=await processHandle.completion;
            const error=result.error??authorityError??(timedOut?'执行超时':truncated?'日志达到上限':result.exitCode===0?undefined:`进程退出：${result.exitCode??result.signal}`);
            receipt(result.exitCode,observedCancel?'cancelled':error?'failed':result.exitCode===0?'succeeded':'failed',error);
        }catch(error){receipt(null,error instanceof DomainError&&error.code==='RUN_CANCELLED'&&!processHandle?'cancelled':'failed',(error as Error).message);}
        finally{if(timer)clearInterval(timer);if(timeout)clearTimeout(timeout);}
    }
} finally {await compute.stop();store.close();}
