import type { SourceId } from '../connectors/contracts.js';
/** Immutable acquisition record. A provider's version claim is not PDF content verification. */
export interface DocumentVersion {
    discoveryGrant?: import('../policy/discovery-grant-types.js').DiscoveryGrantReference;
    title: string;
    original: {
        artifactId: string;
        digest: string;
        size: number;
        mediaType: string;
    };
    derivedText?: {
        artifactId: string;
        digest: string;
        size: number;
        mediaType: string;
    };
    source: {
        kind: 'connector' | 'upload';
        provider?: SourceId;
        requestedId?: string;
        resolvedId?: string;
        requestedVersion: string | null;
        reportedVersion: string | null;
        versionAssurance: string;
        sourceUrl?: string;
    };
    contentKind: 'metadata' | 'abstract' | 'provider-text' | 'original-pdf' | 'user-text';
    acquiredAt: string;
    license: {
        value: string | null;
        assurance: 'provider-reported' | 'user-declared' | 'unknown';
    };
    rawResponseArtifactIds?: string[];
    pageMapping?: 'unavailable';
    scopeSessionId?: string | null;
    scopeTaskId?: string | null;
    limitations: string[];
}
export interface DocumentAcquireInput {
    source: SourceId;
    id: string;
    format: 'provider-text' | 'original-pdf';
    requestedVersion?: string;
}
export interface LiteratureDocumentAcquireInput {
    source: SourceId;
    id: string;
    format: 'provider-text' | 'original-pdf' | 'oa-full-text';
    requestedVersion?: string;
}
export interface DocumentEvidenceLink {
    documentVersionId: string;
    rawDigest: string;
    parseResultId: string;
    pageNumber: number;
    textArtifactDigest: string;
}
