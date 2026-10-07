export declare const PUBLICATION_IMAGE_TOOL = "publication_page_image_read";
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
/** Only a digest leaves the credential-bearing catalog. Missing catalog means SDK built-ins. */
export declare function publicationImageCatalog(path: string): string;
export declare function assertPublicationPng(bytes: Buffer, width: number, height: number): void;
export declare function imageReference(value: unknown): PublicationImageReference;
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
}, supportsImages: boolean, managed: boolean): PublicationImageReference[];
