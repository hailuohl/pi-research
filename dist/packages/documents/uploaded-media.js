import { ensure } from '../domain/errors.js';
export function assertUploadedMedia(bytes, mediaType) {
    const valid = mediaType === 'application/pdf' ? bytes.subarray(0, 5).toString('ascii') === '%PDF-' : mediaType === 'video/mp4' ? bytes.length >= 24 && bytes.toString('ascii', 4, 8) === 'ftyp' : mediaType === 'image/png' ? bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.toString('ascii', 12, 16) === 'IHDR' : mediaType === 'image/jpeg' ? bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff : mediaType === 'image/webp' ? bytes.length >= 16 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' : mediaType === 'image/gif' ? bytes.length >= 13 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) : false;
    ensure(valid, 'DOCUMENT_FORMAT_INVALID', '原件签名与声明的文件类型不符', 400);
}
//# sourceMappingURL=uploaded-media.js.map