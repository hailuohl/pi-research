import {spawn} from 'node:child_process';
import {chmodSync, mkdirSync, lstatSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import type {Manifest, ResearchContract} from '../domain/types.js';
import {assertContainerStartPolicy,createArgs, physicalDockerJob, docker, dockerEnv, inspect, preflight, retireUncertainStart, stageInputs, type Container, type DockerJob} from '../execution/docker.js';
import {safePath} from '../workspace/files.js';
import {readStableFile} from '../workspace/stable-file.js';
import type {DataPaths} from '../storage/data-paths.js';
import type {DockerRun, RunnerAdapter, RunnerCapabilities, RunnerLogSink, RunnerProcess} from './adapter.js';

type DockerContract = ResearchContract & {dockerContext?: string; pids?: number; workMb?: number; logBytes?: number; outputBytes?: number};
export function formalDockerJob(run: DockerRun): DockerJob {
    const c = run.manifest.contract as DockerContract;
    if (c.runner !== 'docker' || !c.image) throw new Error('Formal Docker adapter requires a pinned Docker contract');
    const threadLimit=run.manifest.threadLimit??c.threadLimit;
    if(run.manifest.threadLimit!==undefined&&(!Number.isSafeInteger(run.manifest.threadLimit)||run.manifest.threadLimit<1||run.manifest.threadLimit>64||c.threadLimit!==undefined&&run.manifest.threadLimit!==c.threadLimit))throw new Error('Invalid formal Docker thread limit');
    return {id: run.id, manifestDigest: run.manifestDigest, containerName: run.execution.containerName, containerId: run.execution.containerId, startRequested: run.execution.startRequested, outputDir: run.outputDir, controlDir: run.execution.controlDir,
        manifest: {...(threadLimit===undefined?{}:{threadLimit}),inputSnapshot: {path: run.manifest.snapshotPath, digest: run.manifest.snapshotDigest, files: run.manifest.sourceFiles}, dataArtifacts: (run.manifest as Manifest & {dataArtifacts?: DockerJob['manifest']['dataArtifacts']}).dataArtifacts ?? [], command: c.command, environmentImageDigest: c.image, dockerContext: run.execution.dockerContext,
            resources: {...(c.gpu?{gpu:c.gpu}:{}),cpus: c.cpus, memoryMb: c.memoryMb, pids: c.pids ?? 512, workMb: c.workMb ?? 1024, logBytes: c.logBytes ?? 16 * 1024 * 1024}}};
}
export class DockerAdapter implements RunnerAdapter {
    readonly capabilities: RunnerCapabilities = {backend: 'docker', isolated: true, recoverable: true};
    readonly job: DockerJob;
    imageId?: string;
    constructor(readonly run: DockerRun, private readonly fence: () => void,private readonly verifyTarget?:()=>Promise<void>,paths?:DataPaths) {const job=formalDockerJob(run);this.job = paths?physicalDockerJob(job,paths):job; this.imageId = run.execution.imageId;}
    private async guarded<T>(fn:()=>Promise<T>):Promise<T>{await this.verifyTarget?.();this.fence();const result=await fn();await this.verifyTarget?.();this.fence();return result;}
    async preflight(): Promise<void> {this.imageId = await this.guarded(()=>preflight(this.job.manifest.dockerContext, this.job.manifest.environmentImageDigest));}
    async stage(): Promise<void> {
        this.fence();
        mkdirSync(this.job.outputDir, {recursive: true, mode: 0o777}); chmodSync(this.job.outputDir, 0o777);
        mkdirSync(this.job.controlDir, {recursive: true, mode: 0o700});
        stageInputs(this.job);
    }
    async inspect(): Promise<Container | null> {return this.guarded(()=>inspect(this.job));}
    /** Create-or-adopt only. Starting requires a separately persisted startRequested fence. */
    async submit(): Promise<Container> {
        let container = await this.inspect();
        if (!container) {
            if (this.job.startRequested || this.job.containerId) throw new Error('Formal run container is confirmed missing; never resubmit');
            if (!this.imageId) throw new Error('Docker preflight is required before submission');
            this.fence();
            try {await this.guarded(()=>docker(this.job.manifest.dockerContext, createArgs(this.job)));}
            catch (error) {container = await this.inspect(); if (!container) throw error;}
            container ??= await this.inspect();
            if (!container) throw new Error('Created formal run container cannot be observed');
        }
        if (this.imageId && container.Image !== this.imageId) throw new Error('Formal run container image identity mismatch');
        this.job.containerId = container.Id;
        return container;
    }
    private async capture(args: string[], onLog: RunnerLogSink): Promise<RunnerProcess> {
        await this.verifyTarget?.();
        this.fence();
        const child = spawn('docker', ['--context', this.job.manifest.dockerContext, ...args, this.job.containerId!], {shell: false, windowsHide: true, env: dockerEnv(), stdio: ['ignore', 'pipe', 'pipe']});
        const completion = new Promise<{exitCode: number | null; signal?: NodeJS.Signals | null; error?: string}>(resolve => {
            let error: string | undefined;
            child.stdout.on('data', (chunk: Buffer) => {try {this.fence(); onLog('stdout', chunk);} catch (e) {error = (e as Error).message; child.kill();}});
            child.stderr.on('data', (chunk: Buffer) => {try {this.fence(); onLog('stderr', chunk);} catch (e) {error = (e as Error).message; child.kill();}});
            child.on('error', e => {error = e.message;});
            child.on('close', (exitCode, signal) => resolve({exitCode, signal, ...(error ? {error} : {})}));
        });
        try{await this.verifyTarget?.();this.fence();}catch(error){child.kill();await completion;throw error;}
        return {pid: child.pid, completion, cancel: async () => {await this.cancel();}, detach: async () => {child.kill();}};
    }
    async start(onLog: RunnerLogSink): Promise<RunnerProcess> {
        if (!this.job.startRequested) throw new Error('Start intent must be persisted before Docker start');
        const container = await this.inspect();
        if (!container || container.State.Status !== 'created') throw new Error('Formal run container is not in the one-time start state');
        assertContainerStartPolicy(this.job,container);
        return this.capture(['start', '--attach'], onLog);
    }
    async readLogs(onLog: RunnerLogSink): Promise<RunnerProcess> {
        const container = await this.inspect();
        if (!container) throw new Error('Formal run container is missing during log recovery');
        return this.capture(['logs', '--follow'], onLog);
    }
    async cancel(): Promise<Container | null> {
        const container = await this.inspect();
        if (container?.State.Status === 'created') return this.retireStart();
        if (container?.State.Running) await this.guarded(()=>docker(this.job.manifest.dockerContext, ['kill', container.Id]));
        return this.inspect();
    }
    async reconcile(): Promise<Container | null> {
        const container = await this.inspect();
        if (container?.State.Status === 'created' && this.job.startRequested) return this.retireStart();
        return container;
    }
    private retireStart(){return retireUncertainStart(this.job,this.fence,(context,args)=>this.guarded(()=>docker(context,args)),()=>this.inspect());}
    /** Validate stopped output without granting it evidence authority; RunService archives it. */
    async collect(): Promise<{incomplete: boolean; outputExceeded: boolean; errors: string[]}> {
        const container = await this.inspect();
        if (container && !['exited', 'dead'].includes(container.State.Status)) throw new Error('Cannot collect a formal run before confirmed exit');
        const errors: string[] = [], expected = new Set(this.run.manifest.contract.expectedArtifacts), max = (this.run.manifest.contract as DockerContract).outputBytes ?? 128 * 1024 * 1024;
        let bytes = 0, count = 0, outputExceeded = false;
        const walk = (relative: string, depth: number) => {
            if (depth > 32) throw new Error('Formal output depth limit exceeded');
            for (const entry of readdirSync(safePath(this.job.outputDir, relative, true), {withFileTypes: true})) {
                if (++count > 5000) throw new Error('Formal output count limit exceeded');
                const path = relative ? `${relative}/${entry.name}` : entry.name;
                if (entry.isSymbolicLink()) throw new Error('Formal output cannot contain symlinks');
                if (entry.isDirectory()) {walk(path, depth + 1); continue;}
                const full = safePath(this.job.outputDir, path), stat = lstatSync(full);
                if (!stat.isFile()) throw new Error('Formal output must be a regular file');
                bytes += stat.size;
                if (bytes > max) {outputExceeded = true; throw new Error('Formal output byte limit exceeded');}
                readStableFile(this.job.outputDir, path, Math.min(max, 32 * 1024 * 1024));
                expected.delete(path);
            }
        };
        try {walk('', 0);} catch (error) {errors.push((error as Error).message);}
        for (const path of expected) errors.push(`Missing expected formal artifact: ${path}`);
        return {incomplete: !container || errors.length > 0, outputExceeded, errors};
    }
}
