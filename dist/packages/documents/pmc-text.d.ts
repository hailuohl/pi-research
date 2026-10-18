import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import type { DocumentVersion, ProviderTextEvidenceLink } from './types.js';
import { type Store } from '../storage/store.js';
export declare function pmcOwner(actor: Actor): void;
/** Classification is independent of corpus membership and optional evidence bindings. */
export declare function isPmcArtifact(store: Store, pid: string, id: string): boolean;
export declare function assertPmcArtifactRead(store: Store, actor: Actor, pid: string, id: string): void;
/** Verify saved XML and derived bytes locally; never acquire or refresh a provider record. */
export declare function verifyPmcText(c: Pick<AppContext, 'store'>, pid: string, id: string, expected?: ProviderTextEvidenceLink, artifactId?: string): {
    document: import("../domain/types.js").Row<DocumentVersion>;
    link: ProviderTextEvidenceLink;
    bytes: NonSharedBuffer;
    content: string;
};
