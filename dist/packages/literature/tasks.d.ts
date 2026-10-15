import type { DiscoveryGrantReference } from '../policy/discovery-grant-types.js';
import { spawn } from 'node:child_process';
import type { ResearchApp } from '../research-app.js';
import type { Actor, Row } from '../domain/types.js';
import type { SearchInput } from '../connectors/contracts.js';
import type { SearchPageRequest, SearchRecord } from '../connectors/service.js';
import type { LiteratureDocumentAcquireInput } from '../documents/types.js';
export type LiteratureRequest = {
    kind: 'search';
    search: SearchInput;
    pageRequest?: SearchPageRequest;
} | {
    kind: 'retrieve';
    target: LiteratureDocumentAcquireInput;
};
export interface LiteratureTask {
    discoveryGrant?: DiscoveryGrantReference;
    scopeSessionId?: string;
    kindOfTask: 'search' | 'retrieve';
    request: LiteratureRequest;
    state: 'queued' | 'running' | 'succeeded' | 'partial' | 'failed' | 'cancelled' | 'interrupted';
    phase: 'queued' | 'requesting' | 'publishing' | 'done';
    settingsVersion: number;
    generation: number;
    leaseUntil: number;
    deadline: number;
    cancelRequested: boolean;
    workerPid?: number;
    resultSearchId?: string;
    documentVersionId?: string;
    error?: {
        code: string;
        message: string;
    };
    previousTaskId?: string;
    startedAt?: string;
    endedAt?: string;
}
export type LiteratureTaskDTO = Omit<Row<LiteratureTask>, 'workerPid' | 'leaseUntil' | 'deadline'> & {
    searchResult: Row<SearchRecord> | null;
};
export declare class LiteratureTaskService {
    private app;
    private spawnWorker;
    constructor(app: ResearchApp, spawnWorker?: typeof spawn);
    private parse;
    create(actor: Actor, pid: string, value: unknown, previousTaskId?: string): LiteratureTaskDTO;
    inspect(actor: Actor, pid: string, id: string): LiteratureTaskDTO;
    list(actor: Actor, pid: string, limit?: number): LiteratureTaskDTO[];
    cancel(actor: Actor, pid: string, id: string): LiteratureTaskDTO;
    retry(actor: Actor, pid: string, id: string, expectedVersion: number): LiteratureTaskDTO;
    private validate;
    private recoverPublished;
    tick(): void;
    execute(id: string, generation: number): Promise<void>;
}
