import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import type {ResearchApp} from '../research-app.js';
import type {SandboxJob} from './contracts.js';
import {SANDBOX_TERMINAL} from './contracts.js';
export const LEASE_MS = 60000;
export class ExecutionService {
    constructor(private app: ResearchApp) {}
    launchPending() {
        const store = this.app.store;
        this.app.compute.tick();
        for(const id of this.app.compute.queued('development'))store.transaction(()=>{
            const job=store.get<SandboxJob>('sandbox-job',id);if(job.state!=='queued')return;
            try{this.app.development.assertCurrent(job,false);}
            catch(error){this.app.development.finalize(id,{state:'failed',exitCode:null,error:(error as Error).message,incomplete:true});}
        });
        let claimed:ReturnType<typeof store.get<SandboxJob>>|null=null;
        for(const id of this.app.compute.candidates('development')) {
            claimed=this.app.compute.withAdmission('development',id,()=>{
                const next=store.get<SandboxJob>('sandbox-job',id);
                if(SANDBOX_TERMINAL.includes(next.state)||next.state!=='queued'&&next.leaseUntil>Date.now())return null;
                if(next.state==='queued')this.app.development.assertCurrent(next,false);
                return store.update<SandboxJob>('sandbox-job', next.id, next.version, {state: next.state === 'queued' ? 'starting' : next.state, generation: next.generation + 1, leaseUntil: Date.now() + LEASE_MS, recoveryCount: next.recoveryCount + (next.generation > 0 ? 1 : 0)});
            });
            if(claimed)break;
        }
        const job=claimed;
        if (!job) return;
        const worker = spawn(process.execPath, [fileURLToPath(new URL('../../apps/execution-worker/index.js', import.meta.url)), this.app.context.dataDir, this.app.context.repoRoot, job.id, String(job.generation)], {shell: false, detached: true, windowsHide: true, stdio: 'ignore'});
        worker.on('error', () => {
            try {store.transaction(() => {const current = store.get<SandboxJob>('sandbox-job', job.id); if (current.generation === job.generation) store.update<SandboxJob>('sandbox-job', job.id, current.version, {leaseUntil: 0, error: 'Independent execution worker failed to spawn'});});} catch { /* The server may already be closed; lease expiry permits recovery. */ }
        });
        worker.unref();
    }
}
