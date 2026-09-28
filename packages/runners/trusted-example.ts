import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import type {Row,Run} from '../domain/types.js';
import type {RunnerAdapter,RunnerCapabilities,RunnerLogSink,RunnerProcess} from './adapter.js';
import {ensure} from '../domain/errors.js';
import {digest} from '../storage/store.js';
import {verifySnapshot} from '../workspace/files.js';
import {verifyTrustedExample} from './contracts.js';

/** This host backend runs only the bundled, hash-verified numerical example. */
export class TrustedExampleAdapter implements RunnerAdapter {
    readonly capabilities:RunnerCapabilities={backend:'trusted-example',isolated:false,recoverable:false};
    private started=false;
    private readonly controlDir:string;
    constructor(private readonly run:Row<Run>,private readonly repoRoot:string) {this.controlDir=join(dirname(run.outputDir),'control');}
    async preflight() {
        ensure(this.run.manifest.contract.runner==='trusted-example','UNTRUSTED_HOST_EXECUTION','可信示例适配器不能执行其他运行器',403);
        verifyTrustedExample(this.run.manifest,this.repoRoot);
        ensure(digest(this.run.manifest)===this.run.manifestDigest&&digest(this.run.manifest.contract)===this.run.manifest.contractDigest&&digest(this.run.manifest.sourceFiles)===this.run.manifest.snapshotDigest,'MANIFEST_CORRUPTED','运行清单摘要不一致');
        verifySnapshot(this.run.manifest.snapshotPath,this.run.manifest.sourceFiles);
    }
    async stage() {mkdirSync(this.controlDir,{recursive:true,mode:0o700});mkdirSync(this.run.outputDir,{recursive:true,mode:0o700});}
    async start(onLog:RunnerLogSink):Promise<RunnerProcess> {
        await this.preflight();await this.stage();
        ensure(!this.started,'RUN_ALREADY_STARTED','同一适配器不能重复启动宿主进程');this.started=true;
        const child=spawn(process.execPath,[join(this.run.manifest.snapshotPath,'experiment.mjs')],{
            cwd:this.run.manifest.snapshotPath,detached:process.platform!=='win32',shell:false,windowsHide:true,stdio:['ignore','pipe','pipe'],
            env:{PATH:process.env.PATH??'',SystemRoot:process.env.SystemRoot??'',HOME:this.controlDir,PI_OUTPUT_DIR:this.run.outputDir},
        });
        let closed=false,error:string|undefined,forceKill:NodeJS.Timeout|undefined;
        const kill=(signal:NodeJS.Signals)=>{if(closed)return;try{if(process.platform!=='win32'&&child.pid)process.kill(-child.pid,signal);else child.kill(signal);}catch{/* A process that exited between inspection and signal needs no further signal. */}};
        const stop=()=>{if(closed||forceKill)return;kill('SIGTERM');forceKill=setTimeout(()=>kill('SIGKILL'),1500);};
        const completion:RunnerProcess['completion']=new Promise(resolve=>{
            child.once('error',e=>{error=e.message;});
            child.once('close',(exitCode,signal)=>{closed=true;if(forceKill)clearTimeout(forceKill);resolve({exitCode,signal,...(error?{error}:{})});});
        });
        for(const [stream,name] of [[child.stdout,'stdout'],[child.stderr,'stderr']] as const)stream.on('data',(chunk:Buffer)=>{try{onLog(name,chunk);}catch(e){error=(e as Error).message;stop();}});
        return {pid:child.pid,completion,cancel:async()=>{stop();await completion;}};
    }
}
