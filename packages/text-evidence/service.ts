import type { ResearchApp } from '../research-app.js';
import type { Actor, Artifact } from '../domain/types.js';
import { USER } from '../domain/types.js';
import type { DocumentEvidenceLink } from '../documents/types.js';
import type { DocumentParseJob, DocumentParseResult } from '../documents/parse-types.js';
import { ensure, DomainError } from '../domain/errors.js';
import { object, text, integer, bool, strings } from '../contracts/validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertDiscoveryDocument } from '../policy/discovery-grant-validation.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { digest } from '../storage/store.js';
import { verifyDocumentLink } from '../evidence/document-link.js';
import { splitText, rankChunks, PARSER_VERSION, METHOD_VERSION, type Chunk } from './text.js';

type SourceRef = { artifactId: string; digest: string; title: string; size: number };
type DocumentPair = { documentVersionId: string; parseResultId: string };
type DocumentSourceRef = DocumentPair & {
    title: string;
    pageCount: number;
    documentDigest: string;
    resultDigest: string;
    jobId: string;
    approvalId: string;
    manifestDigest: string;
    pages: DocumentParseResult['pages'];
};
type Corpus = { sources: SourceRef[]; documents?: DocumentSourceRef[]; parserVersion: string };
type Configuration = { enabled: boolean; corpusId: string | null };
type DocumentChunk = Chunk & { sourceKind: 'document_page'; page: number; document: DocumentEvidenceLink };
type SearchChunk = Chunk & { sourceKind: 'user_imported_text'; page: null; document: null } | DocumentChunk;
type VerifiedDocument = {
    ref: DocumentSourceRef;
    pages: Array<{ page: DocumentParseResult['pages'][number]; link: DocumentEvidenceLink; chunks: DocumentChunk[]; textBytes: number }>;
    chunks: DocumentChunk[];
    textBytes: number;
};

const LIMITS = { files: 30, fileBytes: 1024 * 1024, totalBytes: 8 * 1024 * 1024, chunks: 2000 };
const pairKey = (pair: DocumentPair) => `${pair.documentVersionId}\0${pair.parseResultId}`;

export class TextEvidenceService {
    constructor(private app: ResearchApp) {}
    private config(projectId: string) { return this.app.store.maybe<Configuration>('text-evidence-settings', projectId); }
    private allowed(actor: Actor, artifactId: string) {
        if (actor.type !== 'agent') return;
        if (actor.taskId) this.app.teams.assertResource(actor, 'artifact', artifactId);
        else if (actor.wakeupId) this.app.wakeups.assertResource(actor, 'artifact', artifactId);
    }
    private load(actor: Actor, projectId: string, id: string) {
        const artifact = this.app.store.get<Artifact>('artifact', id, projectId); this.allowed(actor, id);
        ensure(artifact.origin === 'user' && !artifact.taskId && !artifact.runId && !artifact.wakeupId,
            'TEXT_SOURCE_NOT_ORIGINAL', '此试点仅索引用户导入文本；模型摘要和运行输出不能冒充论文原文', 400);
        ensure(['text/plain', 'text/markdown'].includes(artifact.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(artifact.title),
            'TEXT_SOURCE_UNSUPPORTED', '仅支持已导入的 UTF-8 纯文本/Markdown；不解析 PDF 或生成页码', 415);
        ensure(artifact.size <= LIMITS.fileBytes, 'TEXT_CORPUS_LIMIT', '单份文本最多 1 MiB', 413);
        const { bytes } = this.app.evidence.read(actor, id);
        ensure(bytes.length <= LIMITS.fileBytes && !bytes.includes(0), 'TEXT_SOURCE_UNSUPPORTED', '不是受支持的纯文本', 415);
        let content: string;
        try { content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
        catch { throw new DomainError('TEXT_SOURCE_UNSUPPORTED', '文本不是有效 UTF-8', 415); }
        return { artifact, chunks: splitText(id, artifact.digest, artifact.title, content) };
    }
    private documentPairs(value: unknown): DocumentPair[] {
        if (value === undefined) return [];
        ensure(Array.isArray(value) && value.length <= LIMITS.files, 'INVALID_INPUT', 'documents 必须是最多 30 项的文档解析版本列表', 400);
        const pairs = value.map((item, index) => {
            const x = object(item);
            ensure(Object.keys(x).length === 2 && Object.hasOwn(x, 'documentVersionId') && Object.hasOwn(x, 'parseResultId'),
                'INVALID_INPUT', '每个文档来源必须精确包含 documentVersionId 和 parseResultId', 400);
            return { documentVersionId: text(x.documentVersionId, `documents[${index}].documentVersionId`, 100),
                parseResultId: text(x.parseResultId, `documents[${index}].parseResultId`, 100) };
        });
        return [...new Map(pairs.map(pair => [pairKey(pair), pair])).values()]
            .sort((a, b) => a.documentVersionId.localeCompare(b.documentVersionId) || a.parseResultId.localeCompare(b.parseResultId));
    }
    private verifyDocument(projectId: string, pair: DocumentPair, expected?: DocumentSourceRef): VerifiedDocument {
        const document = this.app.documents.get(USER, projectId, pair.documentVersionId);
        ensure(document.contentKind === 'original-pdf' && document.original.mediaType === 'application/pdf',
            'DOCUMENT_NOT_PDF', '仅原始 PDF 可加入固定文档语料', 415);
        assertDiscoveryDocument(this.app.store, projectId, document);
        const result = this.app.documentParsing.result(USER, projectId, pair.parseResultId);
        ensure(result.documentVersionId === document.id && result.pageCount === result.pages.length && result.pages.every((page, index) => page.pageNumber === index + 1),
            'DOCUMENT_RESULT_INVALID', '解析结果与完整物理页列表不符');
        const job = this.app.store.get<DocumentParseJob>('document-parse-job', result.jobId, projectId);
        ensure(job.state === 'succeeded' && job.integrity === 'complete' && job.resultId === result.id,
            'DOCUMENT_RESULT_INVALID', '只接受完整成功的 PDF 解析结果');
        ensure(digest(job.manifest) === job.manifestDigest, 'DOCUMENT_JOB_CORRUPTED', '解析清单已改变');
        const approval = this.app.approvals.assert(job.approvalId, projectId, job.id, job.manifestDigest, 'document.parse');
        ensure(approval.subjectKind === 'document-parse-job', 'APPROVAL_STALE', '解析审批类型改变');
        const documentDigest = digest(document), resultDigest = digest(result);
        if (expected) ensure(expected.documentVersionId === document.id && expected.parseResultId === result.id &&
            expected.title === document.title && expected.pageCount === result.pageCount && expected.documentDigest === documentDigest &&
            expected.resultDigest === resultDigest && expected.jobId === job.id && expected.approvalId === job.approvalId &&
            expected.manifestDigest === job.manifestDigest && digest(expected.pages) === digest(result.pages),
        'TEXT_DOCUMENT_STALE', '固定 PDF 文档或解析结果已改变');

        const pages = result.pages.map(page => {
            const link: DocumentEvidenceLink = { documentVersionId: document.id, rawDigest: result.rawDigest,
                parseResultId: result.id, pageNumber: page.pageNumber, textArtifactDigest: page.textArtifactDigest };
            const verified = verifyDocumentLink(this.app.context, projectId, link, page.textArtifactId);
            let content: string;
            try { content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(verified.bytes); }
            catch { throw new DomainError('DOCUMENT_RESULT_INVALID', 'PDF 页文本不是有效 UTF-8', 409); }
            const chunks = splitText(page.textArtifactId, page.textArtifactDigest, document.title, content).map(chunk => ({
                ...chunk, chunkId: digest({ documentVersionId: document.id, parseResultId: result.id, pageNumber: page.pageNumber, chunkId: chunk.chunkId }),
                sourceKind: 'document_page' as const, page: page.pageNumber, document: link,
            }));
            return { page, link, chunks, textBytes: verified.bytes.length };
        });
        const textBytes = pages.reduce((sum, page) => sum + page.textBytes, 0);
        const ref: DocumentSourceRef = expected ?? { ...pair, title: document.title, pageCount: result.pageCount, documentDigest, resultDigest,
            jobId: job.id, approvalId: job.approvalId, manifestDigest: job.manifestDigest,
            pages: result.pages.map(page => ({ ...page, paragraphs: page.paragraphs.map(paragraph => ({ ...paragraph })) })) };
        return { ref, pages, chunks: pages.flatMap(page => page.chunks), textBytes };
    }
    status(actor: Actor, projectId: string) {
        scope(actor, projectId); this.app.store.get('project', projectId);
        const config = this.config(projectId), corpus = config?.corpusId ? this.app.store.get<Corpus>('text-corpus', config.corpusId, projectId) : null;
        let sources = corpus?.sources ?? [], documents = corpus?.documents ?? [];
        if (actor.type === 'agent') {
            const grant = actor.taskId ? this.app.teams.resources(actor) : actor.wakeupId ? this.app.wakeups.resources(actor) : null;
            if (grant) sources = sources.filter(s => grant.artifactIds.has(s.artifactId));
            documents = [];
        }
        return { enabled: config?.enabled ?? false, version: config?.version ?? 0, corpusId: config?.corpusId ?? null,
            sources, documents: documents.map(({ documentVersionId, parseResultId, title, pageCount }) => ({ documentVersionId, parseResultId, title, pageCount })),
            method: METHOD_VERSION, parserVersion: PARSER_VERSION, limits: LIMITS, networkCalls: 0, modelCalls: 0 };
    }
    configure(actor: Actor, projectId: string, value: unknown) {
        userOnly(actor); scope(actor, projectId);
        const x = object(value), enabled = bool(x.enabled, 'enabled'), expectedVersion = integer(x.expectedVersion, 'expectedVersion', 0);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, projectId);
            const old = this.config(projectId);
            ensure(expectedVersion === (old?.version ?? 0), 'VERSION_CONFLICT', '文献集合已变化，请刷新后确认');
            let corpusId = old?.corpusId ?? null;
            if (enabled) {
                const ids = [...new Set(x.artifactIds === undefined ? [] : strings(x.artifactIds, 'artifactIds', LIMITS.files))].sort();
                const pairs = this.documentPairs(x.documents);
                ensure(ids.length + pairs.length > 0, 'TEXT_SOURCE_REQUIRED', '请明确选择至少一份文本或完整 PDF 文档', 400);
                ensure(ids.length + pairs.length <= LIMITS.files, 'TEXT_CORPUS_LIMIT', '文本与 PDF 文档合计最多 30 项', 413);
                const loaded = ids.map(id => this.load(actor, projectId, id));
                ensure(loaded.every(source => source.chunks.length > 0), 'TEXT_SOURCE_EMPTY', '不能把空白文本加入集合', 400);
                const documents = pairs.map(pair => this.verifyDocument(projectId, pair));
                ensure(documents.every(document => document.textBytes <= LIMITS.fileBytes), 'TEXT_CORPUS_LIMIT', '单份文本或 PDF 解析文本最多 1 MiB', 413);
                const totalBytes = loaded.reduce((n, source) => n + source.artifact.size, 0) + documents.reduce((n, document) => n + document.textBytes, 0);
                const totalChunks = loaded.reduce((n, source) => n + source.chunks.length, 0) + documents.reduce((n, document) => n + document.chunks.length, 0);
                ensure(totalBytes <= LIMITS.totalBytes && totalChunks <= LIMITS.chunks,
                    'TEXT_CORPUS_LIMIT', '超出文本集合字节或分块上限，请选择较小的资料集合', 413);
                const data: Corpus = { sources: loaded.map(({ artifact: a }) => ({ artifactId: a.id, digest: a.digest, title: a.title, size: a.size })),
                    documents: documents.map(document => document.ref), parserVersion: PARSER_VERSION };
                corpusId = digest({ projectId, ...data });
                if (!this.app.store.maybe('text-corpus', corpusId)) this.app.store.create('text-corpus', projectId, data, corpusId);
            }
            const data = { enabled, corpusId };
            if (old) this.app.store.update<Configuration>('text-evidence-settings', old.id, old.version, data);
            else this.app.store.create<Configuration>('text-evidence-settings', projectId, data, projectId);
            this.app.store.event(projectId, 'text-evidence.configured', { enabled, corpusId });
            return this.status(actor, projectId);
        });
    }
    /** Executed before cached tool replays too: disabling/removing a source must take effect. */
    authorizeSearch(actor: Actor, projectId: string, value: unknown) {
        scope(actor, projectId); assertProjectWritable(this.app.store, projectId);
        const x = object(value), config = this.config(projectId);
        ensure(config?.enabled && config.corpusId, 'TEXT_EVIDENCE_DISABLED', '本地原文检索默认关闭，请用户选择文本并明确启用');
        const corpus = this.app.store.get<Corpus>('text-corpus', config.corpusId, projectId);
        const ids = [...new Set(x.artifactIds === undefined ? [] : strings(x.artifactIds, 'artifactIds', LIMITS.files))].sort();
        const pairs = this.documentPairs(x.documents);
        ensure(ids.length + pairs.length > 0, 'TEXT_SOURCE_REQUIRED', '必须明确指定本次检索的文本或 PDF 文档 ID', 400);
        ensure(ids.length + pairs.length <= LIMITS.files, 'TEXT_CORPUS_LIMIT', '本次检索的文本与 PDF 文档合计最多 30 项', 413);
        if (pairs.length) userOnly(actor);
        const hasCorpusId = x.corpusId !== undefined, hasVersion = x.configurationVersion !== undefined;
        ensure(hasCorpusId === hasVersion && (!pairs.length || hasCorpusId), 'TEXT_CONFIGURATION_REQUIRED', 'PDF 检索必须提供当前 corpusId 和 configurationVersion', 400);
        if (hasCorpusId) ensure(text(x.corpusId, 'corpusId', 100) === config.corpusId &&
            integer(x.configurationVersion, 'configurationVersion', 0) === config.version,
        'TEXT_EVIDENCE_CONFIGURATION_CHANGED', '文献集合已变化，请刷新并重新选择来源', 409);
        const loaded = ids.map(id => {
            ensure(corpus.sources.some(source => source.artifactId === id), 'TEXT_SOURCE_NOT_APPROVED', '文档未在当前用户批准的集合内', 403);
            const source = this.load(actor, projectId, id), saved = corpus.sources.find(item => item.artifactId === id)!;
            ensure(source.artifact.digest === saved.digest, 'TEXT_SOURCE_STALE', '原文版本与批准集合不一致');
            return source;
        });
        const allDocuments = pairs.length ? (corpus.documents ?? []).map(ref => this.verifyDocument(projectId, ref, ref)) : [];
        const byPair = new Map(allDocuments.map(document => [pairKey(document.ref), document]));
        const selectedDocuments = pairs.map(pair => {
            const document = byPair.get(pairKey(pair));
            ensure(document, 'TEXT_SOURCE_NOT_APPROVED', 'PDF 文档与解析版本未在当前所有者批准的集合内', 403);
            return document;
        });
        return { config, corpus, ids, pairs, loaded, selectedDocuments };
    }
    search(actor: Actor, projectId: string, value: unknown) {
        return this.app.store.transaction(() => {
            const x = object(value), query = text(x.query, 'query', 1000), limit = integer(x.limit ?? 5, 'limit', 1, 10);
            const lambda = x.mmrLambda === undefined ? 1 : x.mmrLambda;
            const deduplicateExact = bool(x.deduplicateExact ?? true, 'deduplicateExact');
            ensure(typeof lambda === 'number' && Number.isFinite(lambda) && lambda >= 0 && lambda <= 1, 'INVALID_INPUT', 'mmrLambda 是 0–1 的相关性权重，1关闭MMR选择', 400);
            const { config, ids, pairs, loaded, selectedDocuments } = this.authorizeSearch(actor, projectId, x);
            const documents = pairs.map(({ documentVersionId, parseResultId }) => ({ documentVersionId, parseResultId }));
            const request = { query, limit, mmrLambda: lambda, deduplicateExact, artifactIds: ids, documents,
                corpusId: config.corpusId, configurationVersion: config.version, method: METHOD_VERSION };
            const id = digest({ projectId, ...request }), previous = this.app.store.maybe<any>('text-evidence-search', id);
            if (previous) {
                previous.hits.forEach((hit: { evidenceId: string; alternativeSources?: Array<{ evidenceId?: string | null }> }) => {
                    this.app.evidence.verify(projectId, hit.evidenceId);
                    for (const source of hit.alternativeSources ?? []) if (source.evidenceId) this.app.evidence.verify(projectId, source.evidenceId);
                });
                return previous;
            }
            const chunks: SearchChunk[] = [...loaded.flatMap(source => source.chunks.map(chunk => ({ ...chunk,
                sourceKind: 'user_imported_text' as const, page: null, document: null }))), ...selectedDocuments.flatMap(document => document.chunks)];
            const groups = new Map<string, SearchChunk[]>();
            for (const chunk of chunks) {
                const key = deduplicateExact ? digest(chunk.quote) : chunk.chunkId;
                groups.set(key, [...(groups.get(key) ?? []), chunk]);
            }
            const ranked = rankChunks(chunks, query, limit, lambda, deduplicateExact);
            const hits = ranked.selected.map(selected => {
                const key = deduplicateExact ? digest(selected.quote) : selected.chunkId;
                const group = groups.get(key)!;
                const source = group.find(chunk => chunk.chunkId === selected.chunkId)!;
                const register = (chunk: SearchChunk) => chunk.sourceKind === 'document_page'
                    ? this.app.evidence.registerDocument(actor, projectId, { documentVersionId: chunk.document.documentVersionId,
                        parseResultId: chunk.document.parseResultId, pageNumber: chunk.page, start: chunk.locator.start, end: chunk.locator.end,
                        description: `固定 PDF 原文：${chunk.title}，物理第 ${chunk.page} 页；${PARSER_VERSION}` })
                    : (() => {
                        const link = this.app.store.maybe<{ evidenceId: string }>('text-chunk-link', chunk.chunkId);
                        if (link) return this.app.evidence.verify(projectId, link.evidenceId);
                        const evidence = this.app.evidence.register(actor, projectId, chunk.artifactId, chunk.locator.start, chunk.locator.end,
                            `用户导入文本原文：${chunk.title}，行 ${chunk.lineStart}–${chunk.lineEnd}；${PARSER_VERSION}`);
                        this.app.store.create('text-chunk-link', projectId, { evidenceId: evidence.id }, chunk.chunkId);
                        return evidence;
                    })();
                const evidence = register(source);
                const alternativeSources = group.filter(chunk => chunk.chunkId !== source.chunkId).map(chunk => {
                    const altEvidence = chunk.sourceKind === 'document_page' ? register(chunk) : null;
                    return { artifactId: chunk.artifactId, digest: chunk.digest, title: chunk.title, locator: chunk.locator,
                        lineStart: chunk.lineStart, lineEnd: chunk.lineEnd, sourceKind: chunk.sourceKind, page: chunk.page,
                        document: chunk.document, evidenceId: altEvidence?.id ?? null };
                });
                return { ...source, score: selected.score, evidenceId: evidence.id, alternativeSources, offsetUnit: 'utf16-code-unit' as const };
            });
            const result = this.app.store.create('text-evidence-search', projectId, { ...request,
                status: hits.length ? 'matches' : 'no_lexical_match', hits,
                coverage: { sourceCount: ids.length + pairs.length, totalChunks: chunks.length, matchingChunks: ranked.matchingChunks,
                    exactDuplicatesGrouped: ranked.exactDuplicatesGrouped, uniqueChunks: ranked.uniqueChunks,
                    candidatesConsidered: ranked.candidatesConsidered, candidateLimitReached: ranked.candidateLimitReached,
                    resultsTruncated: ranked.matchingChunks > hits.length },
                usage: { modelCalls: 0, networkCalls: 0 }, limitations: [
                    '仅对显式选定的用户文本和固定 PDF 页文本进行词项检索，不是语义检索或自动回答。',
                    '未匹配不证明文献中没有答案；相关性分数不是正确性或独立证据评分。',
                    'PDF 使用已批准解析结果中的原页文本，不执行 OCR；存在相反结果时应逐条读原文。',
                ] }, id);
            this.app.store.event(projectId, 'text-evidence.searched', { searchId: result.id, sourceCount: ids.length + pairs.length, hitCount: hits.length });
            return result;
        });
    }
}
