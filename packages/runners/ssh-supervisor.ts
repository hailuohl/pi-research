import {appendFileSync,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
import type {AppContext} from '../domain/context.js';
import {ensure} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {readStableFile} from '../workspace/stable-file.js';
import {safePath,verifySnapshot} from '../workspace/files.js';
import type {DockerRun,DockerSupervisorCallbacks} from './adapter.js';
import {SshTargetService} from './ssh-targets.js';
import {sshRequest} from './ssh.js';

/** Durable local lease plus a single remote start request; recovery only inspects the frozen handle. */
export async function superviseSshRun(initial:DockerRun,c:AppContext,callbacks:DockerSupervisorCallbacks,request=sshRequest) {
    const generation=initial.execution.generation,targets=new SshTargetService(c),target=initial.manifest.sshTarget!;
    const control=c.store.paths.physical(initial.execution.controlDir),output=c.store.paths.physical(initial.outputDir);
    let possible=initial.execution.startRequested,lost=false;
    const read=()=>{callbacks.fence();return callbacks.read();};
    const patch=(value:Parameters<DockerSupervisorCallbacks['patch']>[0])=>{const r=read();return callbacks.patch({...value,execution:{...r.execution,...value.execution}});};
    const base={handle:initial.execution.sshHandle,manifestDigest:initial.manifestDigest,engineId:target.engineId,protocolDigest:target.protocolDigest};
    const call=async(op:string,extra:Record<string,unknown>={})=>{read();targets.assertFrozen(target);const result=await request(targets.privateTarget(target.id),{...base,op,...extra});read();ensure(result.handle===base.handle&&result.manifestDigest===base.manifestDigest,'SSH_RECEIPT_INVALID','SSH 回执身份不符');if(result.containerId)ensure(/^[a-f0-9]{64}$/.test(result.containerId)&&(!read().execution.containerId||read().execution.containerId===result.containerId),'SSH_RECEIPT_INVALID','SSH 容器身份不符');return result;};
    const decode=(value:unknown,limit:number)=>{ensure(typeof value==='string'&&value.length<=Math.ceil(limit/3)*4&&/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value),'SSH_RECEIPT_INVALID','SSH 字节编码无效');const bytes=Buffer.from(value,'base64');ensure(bytes.length<=limit&&bytes.toString('base64')===value,'SSH_RECEIPT_INVALID','SSH 字节长度无效');return bytes;};
    const logs=(result:Record<string,any>)=>{ensure(result.logs&&typeof result.logs==='object','SSH_RECEIPT_INVALID','SSH 日志缺失');let total=0;for(const name of ['stdout','stderr']){const bytes=decode(result.logs[name],initial.manifest.contract.logBytes!);total+=bytes.length;ensure(total<=initial.manifest.contract.logBytes!,'SSH_RECEIPT_INVALID','SSH 日志超限');const path=join(control,name+'.log'),prior=existsSync(path)?readFileSync(path):Buffer.alloc(0);ensure(bytes.length>=prior.length&&bytes.subarray(0,prior.length).equals(prior),'SSH_RECEIPT_INVALID','SSH 日志历史发生变化');if(bytes.length>prior.length)appendFileSync(path,bytes.subarray(prior.length));}};
    const finish=async(result:Record<string,any>)=>{
        ensure(['succeeded','failed','cancelled'].includes(result.state)&&(result.exitCode===null||Number.isInteger(result.exitCode)),'SSH_RECEIPT_INVALID','SSH 终态无效');
        try {
        logs(result);
        ensure(Array.isArray(result.files)&&Array.isArray(result.missing),'SSH_RECEIPT_INVALID','SSH 产物清单无效');
        const expected=initial.manifest.contract.expectedArtifacts,seen=new Set<string>();let total=0;
        const files=result.files.map((file:Record<string,any>)=>{ensure(typeof file.path==='string'&&expected.includes(file.path)&&!seen.has(file.path),'SSH_RECEIPT_INVALID','未声明或重复 SSH 产物');seen.add(file.path);const bytes=decode(file.data,file.path==='metrics.json'?1024*1024:32*1024*1024);total+=bytes.length;ensure(file.size===bytes.length&&file.digest===digest(bytes)&&total<=initial.manifest.contract.outputBytes!,'SSH_RECEIPT_INVALID','SSH 产物摘要或额度不符');return {path:safePath(output,file.path),bytes};});
        read();for(const file of files){mkdirSync(dirname(file.path),{recursive:true,mode:0o700});writeFileSync(file.path,file.bytes,{mode:0o600});}
        const incomplete=result.missing.length>0||expected.some(p=>!seen.has(p))||!!result.logTruncated||!!result.outputExceeded;
        await callbacks.finalize({state:result.state==='succeeded'&&(incomplete||result.exitCode!==0)?'failed':result.state,exitCode:result.exitCode,error:[result.error,incomplete?'SSH_DECLARED_OUTPUT_INCOMPLETE':undefined].filter(Boolean).join('; ')||undefined,incomplete,logTruncated:!!result.logTruncated,outputExceeded:!!result.outputExceeded,generation});
        } catch(error) {
            if((error as {code?:string}).code!=='SSH_RECEIPT_INVALID')throw error;
            await callbacks.finalize({state:'failed',exitCode:result.exitCode,error:'SSH_OUTPUT_INVALID',incomplete:true,logTruncated:false,outputExceeded:false,generation});
        }
    };
    mkdirSync(control,{recursive:true,mode:0o700});for(const name of ['stdout','stderr'])if(!existsSync(join(control,name+'.log')))writeFileSync(join(control,name+'.log'),'');
    const timer=setInterval(()=>{try{const r=read();patch({heartbeat:Date.now(),execution:{...r.execution,leaseUntil:Date.now()+60000}});}catch{lost=true;}},3000);
    try {
        await callbacks.verifyTarget?.();
        if(!possible){
            targets.assertFrozen(target,true);
            const r=read();ensure(!r.cancelRequested,'RUN_CANCELLED','运行已取消');callbacks.assertGrant(r);
            verifySnapshot(c.store.paths.physical(r.manifest.snapshotPath),r.manifest.sourceFiles);
            const files=r.manifest.sourceFiles.map(f=>readStableFile(c.store.paths.physical(r.manifest.snapshotPath),f.path,f.size).toString('base64'));
            callbacks.assertGrant(read());
            patch({startedAt:new Date().toISOString(),execution:{...read().execution,startRequested:true}});possible=true;
            await call('start',{contract:r.manifest.contract,sourceFiles:r.manifest.sourceFiles,sourceDigest:r.manifest.snapshotDigest,files});
        }
        while(true){
            const r=read();let cancel=r.cancelRequested;
            try{callbacks.assertGrant(r);}catch{cancel=true;}
            const result=await call(cancel?'cancel':'status');
            ensure(!['missing','unknown'].includes(result.state),'SSH_STATE_UNKNOWN','远端作业状态未知；保持资源预留');
            logs(result);patch({state:cancel?'cancelling':result.state==='submitting'?'submitting':'running',heartbeat:Date.now(),execution:{...read().execution,...(result.containerId?{containerId:result.containerId}:{}),...(result.imageId?{imageId:result.imageId}:{})}});
            if(['succeeded','failed','cancelled'].includes(result.state)){await finish(await call('result'));return;}
            await pause(500);
        }
    }catch(error){
        if(!lost){try{const r=read();if(possible)patch({state:'unknown',integrity:'incomplete',error:'SSH_STATE_UNKNOWN: 请按原 handle 对账',execution:{...r.execution,leaseUntil:0}});else await callbacks.finalize({state:r.cancelRequested?'cancelled':'failed',exitCode:null,error:(error as {code?:string}).code??'SSH_PREPARATION_FAILED',incomplete:true,logTruncated:false,outputExceeded:false,generation});}catch{/* A newer lease owns recovery. */}}
    }finally{clearInterval(timer);}
}
