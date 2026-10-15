import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Store } from '../../packages/storage/store.js';
export declare const MAX_EVENT_STREAMS = 32;
export declare function eventQuery(url: URL, stream?: boolean, lastEventId?: string): {
    after: number;
    projectId: string | undefined;
    limit: number;
};
/** Only tiny wakeups are streamed. Durable events and business records remain separate reads. */
export declare class EventStreamHub {
    private store;
    private connections;
    private closed;
    constructor(store: Store);
    get size(): number;
    open(req: IncomingMessage, res: ServerResponse, { after, projectId }: {
        after: number;
        projectId?: string;
    }): void;
    close(): void;
}
