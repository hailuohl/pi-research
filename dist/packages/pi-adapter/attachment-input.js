import { ensure } from '../domain/errors.js';
import { createHash } from 'node:crypto';
import { nativeAvailability } from './native-request-types.js';
export const NATIVE_ATTACHMENT_BYTES = 20 * 1024 * 1024, ATTACHMENT_REQUEST_BYTES = 32 * 1024 * 1024;
export const ATTACHMENT_MEDIA_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4'];
export const inputEnvelope = (id) => `\n\n<pi-research-input:${id}>`;
const terminalEnvelope = (text) => text.match(/\n\n<pi-research-input:[A-Za-z0-9_-]+>$/)?.[0];
const bodyText = (content) => typeof content === 'string' ? content : Array.isArray(content) ? content.filter(b => b && ['text', 'input_text'].includes(b.type)).map(b => b.text ?? '').join('') : '';
/** Match only the host's final envelope, never IDs or markers quoted inside user data. */
export function attachmentPayload(payload, context, api, definition, manifests, supportsImages = definition?.capabilities.image === true) {
    if (!manifests.some(m => m.files.length))
        return { payload, references: [] };
    const body = payload, envelopes = new Set(context.messages.filter(m => m.role === 'user').map(m => terminalEnvelope(bodyText(m.content))).filter(Boolean)), refs = [];
    const rows = body[api === 'openai-responses' ? 'input' : 'messages'];
    ensure(Array.isArray(rows), 'MODEL_ATTACHMENT_PAYLOAD_INVALID', '模型请求缺少消息数组');
    const messages = rows.map(raw => {
        const m = raw;
        if (m.role !== 'user')
            return raw;
        const envelope = terminalEnvelope(bodyText(m.content)), manifest = envelope && envelopes.has(envelope) ? manifests.find(v => v.envelope === envelope) : undefined;
        if (!manifest?.files.length)
            return raw;
        const blocks = manifest.files.map(({ reference: r, data }) => {
            const bytes = Buffer.from(data, 'base64'), native = nativeAvailability(api, definition);
            ensure(r.inputMode === 'native' && !r.parseResultId && bytes.length > 0 && bytes.length <= NATIVE_ATTACHMENT_BYTES && bytes.length === r.size && bytes.toString('base64') === data && createHash('sha256').update(bytes).digest('hex') === r.digest, 'MODEL_ATTACHMENT_INVALID', '实际原生附件字节与固定摘要不符');
            ensure(r.mediaType.startsWith('image/') && supportsImages || r.mediaType === 'application/pdf' && native.pdf.state === 'available' || r.mediaType === 'video/mp4' && native.video.state === 'available', 'MODEL_ATTACHMENT_UNSUPPORTED', '当前模型或适配器不支持原生附件');
            refs.push(r);
            const url = `data:${r.mediaType};base64,${data}`;
            if (r.mediaType.startsWith('image/'))
                return api === 'anthropic-messages' ? { type: 'image', source: { type: 'base64', media_type: r.mediaType, data } } : api === 'openai-responses' ? { type: 'input_image', image_url: url } : { type: 'image_url', image_url: { url } };
            if (r.mediaType === 'video/mp4')
                return api === 'openai-responses' ? { type: 'input_video', video_url: url } : { type: 'video_url', video_url: { url } };
            return api === 'anthropic-messages' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } } : api === 'openai-responses' ? { type: 'input_file', filename: r.title, file_data: url } : { type: 'file', file: { filename: r.title, file_data: url } };
        });
        return { ...m, content: [...(typeof m.content === 'string' ? [{ type: api === 'openai-responses' ? 'input_text' : 'text', text: m.content }] : m.content), ...blocks] };
    });
    ensure(refs.reduce((n, r) => n + r.size, 0) <= NATIVE_ATTACHMENT_BYTES, 'MODEL_ATTACHMENT_LIMIT', '实际模型上下文原生附件合计最多20 MiB', 413);
    const result = { ...body, [api === 'openai-responses' ? 'input' : 'messages']: messages, ...(definition?.nativeProfile === 'openrouter' && refs.some(r => r.mediaType === 'application/pdf') ? { plugins: [{ id: 'file-parser', pdf: { engine: 'native' } }] } : {}) };
    if (refs.length)
        ensure(Buffer.byteLength(JSON.stringify(result)) <= ATTACHMENT_REQUEST_BYTES, 'MODEL_ATTACHMENT_LIMIT', '实际模型JSON请求超过32 MiB', 413);
    return { payload: result, references: refs };
}
//# sourceMappingURL=attachment-input.js.map