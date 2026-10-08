import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import type { NativeSource, NativeRequestView, NativeRequestList } from './native-request-types.js';
/** Explicit owner requests run independently of Pi's AgentLoop and its image grants. */
export declare class NativeRequestService {
    private app;
    private fetcher;
    private readonly ownerHost;
    private readonly active;
    private readonly drains;
    private stopped;
    get hasPending(): boolean;
    constructor(app: ResearchApp, fetcher?: typeof fetch);
    private owner;
    private selected;
    private redactor;
    private source;
    private files;
    private continuation;
    private validate;
    private refresh;
    private view;
    inspect(actor: Actor, id: string): NativeRequestView;
    list(actor: Actor, sessionId: string, input?: unknown): NativeRequestList;
    importMedia(actor: Actor, sessionId: string, value: unknown, key: string): NativeSource;
    prepare(actor: Actor, sessionId: string, value: unknown, key: string): NativeRequestView;
    decide(actor: Actor, id: string, value: unknown): NativeRequestView;
    cancel(actor: Actor, id: string, value: unknown): NativeRequestView;
    execute(actor: Actor, id: string, value: unknown, key: string, clientSignal?: AbortSignal): Promise<NativeRequestView>;
    shutdown(): Promise<void>;
}
