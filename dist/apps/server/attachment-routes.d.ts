import type { ResearchApp } from '../../packages/research-app.js';
export declare function attachmentRoute(app: ResearchApp, path: string, url: URL, method: string, value?: unknown, key?: string): {
    result: import("../../packages/pi-adapter/attachment-input.js").AttachmentTypes;
} | {
    result: import("../../packages/domain/types.js").Row<import("../../packages/documents/types.js").DocumentVersion>;
} | undefined;
