import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SANDBOX_TERMINAL } from './contracts.js';
export const LEASE_MS = 60000;
export class ExecutionService {
    app;
    constructor(app) {
        this.app = app;
    }
    launchPending() {
        const store = this.app.store;
        const job = store.transaction(() => {
            const jobs = store.list('sandbox-job');
            // ponytail: one development sandbox globally; PR07 adds project quotas.
            const active = jobs.find(j => !SANDBOX_TERMINAL.includes(j.state) && j.state !== 'queued');
            if (active && active.leaseUntil > Date.now())
                return null;
            const next = active ?? jobs.find(j => j.state === 'queued');
            if (!next)
                return null;
            return store.update('sandbox-job', next.id, next.version, { state: next.state === 'queued' ? 'starting' : next.state, generation: next.generation + 1, leaseUntil: Date.now() + LEASE_MS, recoveryCount: next.recoveryCount + (next.generation > 0 ? 1 : 0) });
        });
        if (!job)
            return;
        const worker = spawn(process.execPath, [fileURLToPath(new URL('../../apps/execution-worker/index.js', import.meta.url)), this.app.context.dataDir, this.app.context.repoRoot, job.id, String(job.generation)], { shell: false, detached: true, windowsHide: true, stdio: 'ignore' });
        worker.on('error', () => {
            try {
                store.transaction(() => { const current = store.get('sandbox-job', job.id); if (current.generation === job.generation)
                    store.update('sandbox-job', job.id, current.version, { leaseUntil: 0, error: 'Independent execution worker failed to spawn' }); });
            }
            catch { /* The server may already be closed; lease expiry permits recovery. */ }
        });
        worker.unref();
    }
}
//# sourceMappingURL=service.js.map