import type { ResearchApp } from '../research-app.js';
export declare const LEASE_MS = 60000;
export declare class ExecutionService {
    private app;
    constructor(app: ResearchApp);
    launchPending(): void;
}
