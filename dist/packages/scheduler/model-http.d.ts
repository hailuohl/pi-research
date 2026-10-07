import type { Store } from '../storage/store.js';
import type { Actor, Row } from '../domain/types.js';
export declare const MANAGED_HTTP_APIS: readonly ["openai-completions", "openai-responses", "azure-openai-responses", "anthropic-messages"];
export interface ModelHttpIdentity {
    admissionId: string;
    ownerHost: string;
    sessionId: string;
    generation: number;
}
export type ModelHttpState = 'queued' | 'active' | 'unknown' | 'succeeded' | 'failed' | 'cancelled' | 'interrupted';
interface HttpRequest extends ModelHttpIdentity {
    provider: string;
    model: string;
    state: ModelHttpState;
    queuedAt: string;
    startedAt?: string;
    endedAt?: string;
    httpStatus?: number;
    receivedBytes?: number;
    outcome?: string;
}
export type ModelHttpItem = Pick<Row<HttpRequest>, 'id' | 'sessionId' | 'provider' | 'model' | 'state' | 'queuedAt' | 'startedAt' | 'endedAt' | 'httpStatus' | 'receivedBytes' | 'outcome'>;
export interface ModelHttpDTO {
    configuration: {
        version: number;
        maxRequests: null;
    };
    scope: 'shared-data-directory';
    unit: 'pi-http-request';
    counts: {
        queued: number;
        active: number;
        unknown: number;
    };
    available: null;
    coverage: 'managed-fetch' | 'legacy-workers-present';
    legacyWorkerCount: number;
    supportedApis: string[];
    items: ModelHttpItem[];
    nextCursor: number | null;
}
export declare class ModelHttpService {
    private store;
    constructor(store: Store);
    private live;
    private legacy;
    private current;
    private owned;
    acquire(w: ModelHttpIdentity, key: string): {
        allowed: boolean;
        requestId: string;
    };
    finish(w: ModelHttpIdentity, key: string, value: unknown): void;
    /** Called only after a child exit/close event proves the local HTTP connection cannot continue. */
    workerExited(admissionId: string, ownerHost: string, generation: number): void;
    private closeLost;
    recover(): void;
    inspect(actor: Actor, pid?: string, input?: {
        cursor?: number;
        limit?: number;
    }): ModelHttpDTO;
    configure(actor: Actor, _value: unknown, _pid?: string): ModelHttpDTO;
}
export {};
