import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
export declare const CITATION_CHECKER_VERSION = "literal-citations-v2";
export declare const CITATION_LIMITS: {
    readonly textBytes: number;
    readonly depth: 16;
    readonly entries: 1000;
    readonly citations: 2000;
    readonly fields: 40;
    readonly diagnostics: 200;
    readonly reportBytes: number;
};
export interface CitationLocation {
    file: string;
    line: number;
    column: number;
}
interface Diagnostic {
    severity: 'error' | 'incomplete';
    code: string;
    message: string;
    location: CitationLocation;
    related?: CitationLocation[];
}
interface Field {
    name: string;
    value: string;
    literal: boolean;
    location: CitationLocation;
}
interface Entry {
    key: string;
    type: string;
    location: CitationLocation;
    fields: Field[];
}
export interface CitationFile {
    path: string;
    content: string;
}
export interface CitationMetadata {
    artifactId: string;
    paperReadId: string;
    doi: string;
    title: unknown;
    author: unknown;
    years: number[];
}
export declare function readCitationMetadata(app: ResearchApp, actor: Actor, pid: string, artifactId: string): {
    metadata: {
        artifactId: string;
        paperReadId: string;
        doi: string;
        title: any[];
        author: any[] | undefined;
        years: number[];
    };
    binding: {
        artifactId: string;
        artifactDigest: string;
        artifactRecordDigest: string;
        paperReadId: string;
        paperReadDigest: string;
        source: string;
        contentKind: string;
        idInSource: string;
    };
};
export declare function citationDoi(value: string): string | null;
/** Bounded literal analysis only: no TeX execution, network, macro expansion or manuscript changes. */
export declare function checkCitations(files: CitationFile[], mainFile: string, metadata?: CitationMetadata[]): {
    checkerVersion: string;
    reportKind: string;
    scientificClaimSupport: string;
    limitations: string[];
    literalStructure: {
        status: string;
        coverage: string;
        scope: string;
    };
    identityComparison: {
        status: string;
        comparedFields: string[];
        note: string;
        entries: {
            key: string;
            location: CitationLocation;
            artifactId?: string;
            paperReadId?: string;
            fields: Array<{
                field: string;
                status: "matched" | "conflict" | "incomplete";
                actual: string | null;
                expected: string[];
                location: CitationLocation;
            }>;
            status: "matched" | "conflict" | "incomplete";
        }[];
    };
    filesScanned: string[];
    nociteAll: boolean;
    citations: {
        key: string;
        command: string;
        location: CitationLocation;
    }[];
    entries: Entry[];
    diagnostics: Diagnostic[];
    truncated: boolean;
    limits: {
        readonly textBytes: number;
        readonly depth: 16;
        readonly entries: 1000;
        readonly citations: 2000;
        readonly fields: 40;
        readonly diagnostics: 200;
        readonly reportBytes: number;
    };
};
export declare function serializeCitationReport(report: ReturnType<typeof checkCitations> & {
    binding: unknown;
}): string;
export {};
