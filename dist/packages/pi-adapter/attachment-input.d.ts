import type { MessageAttachment } from '../domain/types.js';
import type { ModelApi, ModelDefinitionInput } from './model-management-types.js';
export declare const NATIVE_ATTACHMENT_BYTES: number, ATTACHMENT_REQUEST_BYTES: number;
export declare const ATTACHMENT_MEDIA_TYPES: readonly ["text/plain", "text/markdown", "application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4"];
export interface NativeAttachmentReference extends MessageAttachment {
    messageId: string;
    inputMode: 'native';
}
export interface NativeAttachmentFile {
    reference: NativeAttachmentReference;
    data: string;
}
export interface AttachmentManifest {
    envelope: string;
    files: NativeAttachmentFile[];
}
export interface AttachmentTypes {
    model: {
        provider: string;
        model: string;
    };
    types: Array<{
        mediaType: string;
        extensions: string[];
        maxBytes: number;
        native: boolean;
    }>;
    maxFiles: 5;
    nativeBytes: number;
    fileCapabilityReason: string;
}
export declare const inputEnvelope: (id: string) => string;
/** Match only the host's final envelope, never IDs or markers quoted inside user data. */
export declare function attachmentPayload(payload: unknown, context: {
    messages: readonly unknown[];
}, api: ModelApi, definition: ModelDefinitionInput | undefined, manifests: readonly AttachmentManifest[], supportsImages?: boolean): {
    payload: unknown;
    references: NativeAttachmentReference[];
};
