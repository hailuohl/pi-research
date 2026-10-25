import { ensure } from '../domain/errors.js';
export const DEFAULT_MAX_FILE_BYTES = 512 * 1024 * 1024;
export const LEGACY_DOCUMENT_BYTES = 32 * 1024 * 1024;
export const TEXT_PAGE_BYTES = 64 * 1024;
export const STREAM_TEXT_MEDIA_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values', 'application/json', 'application/x-ndjson'];
/** One deployment policy for ordinary text/data originals; transport and media caps remain separate. */
export function filePolicy() {
    const raw = process.env.PI_RESEARCH_MAX_FILE_BYTES;
    const maxFileBytes = raw === undefined ? DEFAULT_MAX_FILE_BYTES : Number(raw);
    ensure(raw === undefined || /^[1-9][0-9]*$/.test(raw), 'FILE_POLICY_INVALID', 'PI_RESEARCH_MAX_FILE_BYTES 必须是正整数字节数', 500);
    ensure(Number.isSafeInteger(maxFileBytes) && maxFileBytes > 0, 'FILE_POLICY_INVALID', 'PI_RESEARCH_MAX_FILE_BYTES 必须是安全正整数字节数', 500);
    return { maxFileBytes, legacyJsonFileBytes: Math.min(LEGACY_DOCUMENT_BYTES, maxFileBytes), textPageBytes: TEXT_PAGE_BYTES, mediaTypes: STREAM_TEXT_MEDIA_TYPES };
}
//# sourceMappingURL=file-policy.js.map