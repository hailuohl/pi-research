import { digest } from '../storage/store.js';
import { dot, selectMMR } from './mmr.js';
export const PARSER_VERSION = 'literal-paragraph-utf16-v1';
export const METHOD_VERSION = 'local-tfidf-exact-dedup-mmr-v1';
export const MAX_CHUNK = 1200;
/** Exact UTF-16 offsets into the original decoded file; no normalized text is stored as evidence. */
export function splitText(artifactId, sourceDigest, title, content) {
    const lines = [0];
    for (let i = 0; i < content.length; i++)
        if (content[i] === '\n')
            lines.push(i + 1);
    const lineAt = (offset) => {
        let left = 0, right = lines.length;
        while (left < right) {
            const middle = (left + right) >>> 1;
            if (lines[middle] <= offset)
                left = middle + 1;
            else
                right = middle;
        }
        return left;
    };
    const chunks = [];
    for (const match of content.matchAll(/\S[\s\S]*?(?=\n[ \t\r]*\n|$)/g)) {
        let start = match.index;
        const end = start + match[0].trimEnd().length;
        while (start < end) {
            let stop = Math.min(start + MAX_CHUNK, end);
            if (stop < end) {
                const blank = content.lastIndexOf(' ', stop - 1);
                if (blank > start + MAX_CHUNK / 2)
                    stop = blank;
                if (content.charCodeAt(stop - 1) >= 0xD800 && content.charCodeAt(stop - 1) <= 0xDBFF)
                    stop--;
            }
            const locator = { start, end: stop };
            chunks.push({ chunkId: digest({ artifactId, sourceDigest, locator, parser: PARSER_VERSION }), artifactId,
                digest: sourceDigest, title, locator, quote: content.slice(start, stop), lineStart: lineAt(start), lineEnd: lineAt(stop - 1) });
            start = stop;
            while (start < end && /\s/.test(content[start]))
                start++;
        }
    }
    return chunks;
}
const stopWords = new Set('the a an and or is are was were to of for in on with at by what which how does do did from as be it this that'.split(' '));
/** Lexical, not semantic: Latin words + Han unigrams/bigrams. Normalization is for scores only. */
export function tokenize(text) {
    const result = [];
    for (const match of text.normalize('NFKC').toLowerCase().matchAll(/[\p{Script=Han}]+|[\p{L}\p{N}_]+/gu)) {
        const word = match[0];
        if (/^[\p{Script=Han}]+$/u.test(word)) {
            const chars = [...word];
            result.push(...chars);
            for (let i = 0; i + 1 < chars.length; i++)
                result.push(chars[i] + chars[i + 1]);
        }
        else if (!stopWords.has(word))
            result.push(word);
    }
    return result;
}
export function rankChunks(rawChunks, query, limit, lambda, deduplicateExact = true) {
    // Group identical quotations, not merely similar claims. Keep every authorized source locator.
    const groups = new Map();
    for (const chunk of rawChunks) {
        const key = deduplicateExact ? digest(chunk.quote) : chunk.chunkId;
        groups.set(key, [...(groups.get(key) ?? []), chunk]);
    }
    const chunks = [...groups.values()].map(group => ({ ...group[0], alternativeSources: group.slice(1).map(c => ({
            artifactId: c.artifactId, digest: c.digest, title: c.title, locator: c.locator, lineStart: c.lineStart, lineEnd: c.lineEnd
        })) }));
    const terms = chunks.map(c => tokenize(c.quote)), df = new Map();
    for (const termsInChunk of terms)
        for (const term of new Set(termsInChunk))
            df.set(term, (df.get(term) ?? 0) + 1);
    const vector = (tokens) => {
        const values = new Map();
        for (const term of tokens)
            values.set(term, (values.get(term) ?? 0) + 1);
        let norm = 0;
        for (const [term, count] of values) {
            const weight = (1 + Math.log(count)) * (1 + Math.log((1 + chunks.length) / (1 + (df.get(term) ?? 0))));
            values.set(term, weight);
            norm += weight * weight;
        }
        norm = Math.sqrt(norm);
        if (norm)
            for (const [term, weight] of values)
                values.set(term, weight / norm);
        return values;
    };
    const queryVector = vector(tokenize(query));
    const ranked = chunks.map((chunk, i) => { const v = vector(terms[i]); return { ...chunk, vector: v, score: dot(v, queryVector) }; })
        .filter(c => c.score > 0).sort((a, b) => b.score - a.score || a.chunkId.localeCompare(b.chunkId));
    const candidateLimit = Math.min(200, Math.max(50, limit * 8));
    return { selected: selectMMR(ranked.slice(0, candidateLimit), limit, lambda), matchingChunks: ranked.length,
        exactDuplicatesGrouped: rawChunks.length - chunks.length, uniqueChunks: chunks.length, candidateLimitReached: ranked.length > candidateLimit, candidatesConsidered: Math.min(candidateLimit, ranked.length) };
}
//# sourceMappingURL=text.js.map