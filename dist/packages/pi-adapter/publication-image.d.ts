export declare const PUBLICATION_IMAGE_TOOL = "publication_page_image_read";
export declare const DOCUMENT_IMAGE_TOOL = "document_page_image_read";
export declare const PAGE_IMAGE_BYTES: number, CONTEXT_IMAGE_BYTES: number;
export interface PublicationImageReference {
    actionId: string;
    publicationResultId: string;
    pageNumber: number;
    digest: string;
    bytes: number;
    width: number;
    height: number;
}
export interface DocumentImageReference extends Omit<PublicationImageReference, 'publicationResultId'> {
    kind: 'document-page';
    documentVersionId: string;
    parseResultId: string;
    firstPage: number;
    lastPage: number;
}
export type ImageReference = PublicationImageReference | DocumentImageReference;
/** Only a digest leaves the credential-bearing catalog. Missing catalog means SDK built-ins. */
export declare function publicationImageCatalog(path: string, connections?: {
    models?: ({
        model: string;
        enabled: boolean;
        deletedAt: string | null;
    } | {
        reasoning: {
            defaultLevel: string;
            levels: {
                id: string;
                piLevel: import("./model-management-types.js").PiThinking;
                parameters: Record<string, import("./model-management-types.js").JsonValue>;
            }[];
        };
        enabled: boolean;
        deletedAt: string | null;
        controlOnly?: boolean;
        model: string;
        nativeProfile: import("./model-management-types.js").NativeProfile;
        contextWindow: number;
        maxTokens: number;
        capabilities: import("./model-management-types.js").ModelCapabilities;
        parameters: Record<string, import("./model-management-types.js").JsonValue>;
        structuredOutput: null | {
            name: string;
            schema: Record<string, import("./model-management-types.js").JsonValue>;
            strict: boolean;
        };
    })[] | undefined;
    enabled?: boolean | undefined;
    deletedAt?: string | null | undefined;
    requiresCredential?: boolean | undefined;
    baseUrl?: string | undefined;
    api?: "openai-completions" | "openai-responses" | "anthropic-messages" | undefined;
    provider: string;
}[]): string;
export declare function assertPublicationPng(bytes: Buffer, width: number, height: number): void;
export declare function imageReference(value: unknown): PublicationImageReference;
export declare function documentImageReference(value: unknown): DocumentImageReference;
export declare function documentImageResult(value: unknown): {
    content: ({
        type: "text";
        text: string;
        data?: undefined;
        mimeType?: undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        text?: undefined;
    })[];
    details: {
        documentPage: DocumentImageReference;
    };
};
export declare function publicationImageResult(value: unknown): {
    content: ({
        type: "text";
        text: string;
        data?: undefined;
        mimeType?: undefined;
    } | {
        type: "image";
        data: string;
        mimeType: string;
        text?: undefined;
    })[];
    details: {
        publicationPage: PublicationImageReference;
    };
};
/** Inspect every actual block before provider conversion; repeated images count toward the byte limit. */
export declare function imageContextReferences(context: {
    messages: readonly unknown[];
}, supportsImages: boolean, managed: boolean): ImageReference[];
