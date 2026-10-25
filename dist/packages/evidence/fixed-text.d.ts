import type { ResearchApp } from '../research-app.js';
import type { Actor, Artifact, Evidence, Row } from '../domain/types.js';
import type { Store } from '../storage/store.js';
import { type FixedTextIndex } from '../storage/streamed-blob.js';
import type { PermissionReference } from '../policy/session-permissions.js';
export interface ArtifactTextSource {
    artifactId: string;
    sourceDigest: string;
    size: number;
    indexArtifactId: string;
    index: FixedTextIndex;
}
export interface ArtifactTextRead {
    artifactId: string;
    textSourceId: string;
    sourceDigest: string;
    actor: ReturnType<typeof readerIdentity>;
    permission?: PermissionReference;
    callId: string;
    cursor: number;
    end: number;
    utf16Start: number;
    utf16End: number;
    contentDigest: string;
    delivery: 'pending' | 'delivered' | 'owner-read';
    offered?: boolean;
    replayed?: boolean;
}
declare function readerIdentity(actor: Actor): {
    [k: string]: string | number | undefined;
};
export declare function verifyFixedTextEvidence(store: Store, pid: string, a: Row<Artifact>, e: Row<Evidence>): Row<Evidence>;
export declare class ArtifactTextService {
    private app;
    constructor(app: ResearchApp);
    /** Every entry/replay/ACK starts at original authority, never at the derived token. */
    authorize(actor: Actor, pid: string, artifactId: string): Row<Artifact>;
    descriptor(actor: Actor, pid: string, input: {
        artifactId: string;
        sourceDigest: string;
        textSourceId: string;
    }): {
        artifactId: string;
        sourceDigest: string;
        size: number;
        textSourceId: string;
        readProtocol: "fixed-text-v1";
        utf16Length: number;
        status: "ready";
    };
    prepare(actor: Actor, pid: string, input: {
        artifactId: string;
        sourceDigest: string;
    }, validate: () => void, signal?: AbortSignal): Promise<{
        artifactId: string;
        sourceDigest: string;
        size: number;
        textSourceId: string;
        readProtocol: "fixed-text-v1";
        utf16Length: number;
        status: "ready";
    }>;
    page(actor: Actor, pid: string, input: {
        artifactId: string;
        sourceDigest: string;
        textSourceId: string;
        cursor?: number;
        limit?: number;
    }): {
        utf16Start: number;
        utf16End: number;
        content: string;
        cursor: number;
        end: number;
        totalBytes: number;
        complete: boolean;
        artifactId: string;
        digest: string;
        sourceDigest: string;
        title: string;
        mediaType: string;
        textSourceId: string;
        readProtocol: "fixed-text-v1";
        cursorUnit: "utf8-byte";
        integrityScope: "delivered-blocks";
    };
    record(actor: Actor, pid: string, page: ReturnType<ArtifactTextService['page']>, callId: string): {
        artifactReadId: string;
    };
    markReplay(actor: Actor, pid: string, id: string): void;
    offer(actor: Actor, pid: string, id: string, callId: string): boolean;
    deliver(actor: Actor, pid: string, id: string, callId: string): void;
    private checkRead;
    register(actor: Actor, pid: string, input: {
        artifactId: string;
        readId: string;
        exactQuote: string;
    }): Row<Evidence>;
    replayQuote(actor: Actor, pid: string, input: {
        artifactId: string;
        readId: string;
        exactQuote: string;
    }, id: string): Row<Evidence>;
}
export {};
