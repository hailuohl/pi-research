import { ensure, DomainError } from '../domain/errors.js';
import { object, text, integer, bool, strings } from '../contracts/validation.js';
import { scope, userOnly } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { digest } from '../storage/store.js';
import { splitText, rankChunks, PARSER_VERSION, METHOD_VERSION } from './text.js';
const LIMITS = { files: 30, fileBytes: 1024 * 1024, totalBytes: 8 * 1024 * 1024, chunks: 2000 };
export class TextEvidenceService {
    app;
    constructor(app) {
        this.app = app;
    }
    config(projectId) { return this.app.store.maybe('text-evidence-settings', projectId); }
    allowed(actor, artifactId) {
        if (actor.type !== 'agent')
            return;
        if (actor.taskId)
            this.app.teams.assertResource(actor, 'artifact', artifactId);
        else if (actor.wakeupId)
            this.app.wakeups.assertResource(actor, 'artifact', artifactId);
    }
    load(actor, projectId, id) {
        const artifact = this.app.store.get('artifact', id, projectId);
        this.allowed(actor, id);
        ensure(artifact.origin === 'user' && !artifact.taskId && !artifact.runId && !artifact.wakeupId, 'TEXT_SOURCE_NOT_ORIGINAL', '此试点仅索引用户导入文本；模型摘要和运行输出不能冒充论文原文', 400);
        ensure(['text/plain', 'text/markdown'].includes(artifact.mediaType) && !/\.(pdf|docx|pptx|xlsx|zip)$/i.test(artifact.title), 'TEXT_SOURCE_UNSUPPORTED', '仅支持已导入的 UTF-8 纯文本/Markdown；不解析 PDF 或生成页码', 415);
        ensure(artifact.size <= LIMITS.fileBytes, 'TEXT_CORPUS_LIMIT', '单份文本最多 1 MiB', 413);
        const { bytes } = this.app.evidence.read(actor, id);
        ensure(bytes.length <= LIMITS.fileBytes && !bytes.includes(0), 'TEXT_SOURCE_UNSUPPORTED', '不是受支持的纯文本', 415);
        let content;
        try {
            content = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
        }
        catch {
            throw new DomainError('TEXT_SOURCE_UNSUPPORTED', '文本不是有效 UTF-8', 415);
        }
        return { artifact, chunks: splitText(id, artifact.digest, artifact.title, content) };
    }
    status(actor, projectId) {
        scope(actor, projectId);
        this.app.store.get('project', projectId);
        const config = this.config(projectId), corpus = config?.corpusId ? this.app.store.get('text-corpus', config.corpusId, projectId) : null;
        let sources = corpus?.sources ?? [];
        if (actor.type === 'agent') {
            const grant = actor.taskId ? this.app.teams.resources(actor) : actor.wakeupId ? this.app.wakeups.resources(actor) : null;
            if (grant)
                sources = sources.filter(s => grant.artifactIds.has(s.artifactId));
        }
        return { enabled: config?.enabled ?? false, version: config?.version ?? 0, corpusId: config?.corpusId ?? null,
            sources, method: METHOD_VERSION, parserVersion: PARSER_VERSION, limits: LIMITS, networkCalls: 0, modelCalls: 0 };
    }
    configure(actor, projectId, value) {
        userOnly(actor);
        scope(actor, projectId);
        const x = object(value), enabled = bool(x.enabled, 'enabled'), expectedVersion = integer(x.expectedVersion, 'expectedVersion', 0);
        return this.app.store.transaction(() => {
            assertProjectWritable(this.app.store, projectId);
            const old = this.config(projectId);
            ensure(expectedVersion === (old?.version ?? 0), 'VERSION_CONFLICT', '文献集合已变化，请刷新后确认');
            let corpusId = old?.corpusId ?? null;
            if (enabled) {
                const ids = [...new Set(strings(x.artifactIds, 'artifactIds', LIMITS.files))].sort();
                ensure(ids.length > 0, 'TEXT_SOURCE_REQUIRED', '请明确选择至少一份文本', 400);
                const loaded = ids.map(id => this.load(actor, projectId, id));
                ensure(loaded.every(x => x.chunks.length > 0), 'TEXT_SOURCE_EMPTY', '不能把空白文本加入集合', 400);
                ensure(loaded.reduce((n, x) => n + x.artifact.size, 0) <= LIMITS.totalBytes && loaded.reduce((n, x) => n + x.chunks.length, 0) <= LIMITS.chunks, 'TEXT_CORPUS_LIMIT', '超出文本集合字节或分块上限，请选择较小的资料集合', 413);
                const data = { sources: loaded.map(({ artifact: a }) => ({ artifactId: a.id, digest: a.digest, title: a.title, size: a.size })), parserVersion: PARSER_VERSION };
                corpusId = digest({ projectId, ...data });
                if (!this.app.store.maybe('text-corpus', corpusId))
                    this.app.store.create('text-corpus', projectId, data, corpusId);
            }
            const data = { enabled, corpusId };
            if (old)
                this.app.store.update('text-evidence-settings', old.id, old.version, data);
            else
                this.app.store.create('text-evidence-settings', projectId, data, projectId);
            this.app.store.event(projectId, 'text-evidence.configured', { enabled, corpusId });
            return this.status(actor, projectId);
        });
    }
    /** Executed before cached tool replays too: disabling/removing a source must take effect. */
    authorizeSearch(actor, projectId, value) {
        scope(actor, projectId);
        assertProjectWritable(this.app.store, projectId);
        const x = object(value), config = this.config(projectId);
        ensure(config?.enabled && config.corpusId, 'TEXT_EVIDENCE_DISABLED', '本地原文检索默认关闭，请用户选择文本并明确启用');
        const corpus = this.app.store.get('text-corpus', config.corpusId, projectId);
        const ids = [...new Set(strings(x.artifactIds, 'artifactIds', LIMITS.files))].sort();
        ensure(ids.length > 0, 'TEXT_SOURCE_REQUIRED', '必须明确指定本次检索的文档 ID', 400);
        const loaded = ids.map(id => {
            ensure(corpus.sources.some(s => s.artifactId === id), 'TEXT_SOURCE_NOT_APPROVED', '文档未在当前用户批准的集合内', 403);
            const loaded = this.load(actor, projectId, id), source = corpus.sources.find(s => s.artifactId === id);
            ensure(loaded.artifact.digest === source.digest, 'TEXT_SOURCE_STALE', '原文版本与批准集合不一致');
            return loaded;
        });
        return { config, corpus, ids, loaded };
    }
    search(actor, projectId, value) {
        return this.app.store.transaction(() => {
            const x = object(value), query = text(x.query, 'query', 1000), limit = integer(x.limit ?? 5, 'limit', 1, 10);
            const lambda = x.mmrLambda === undefined ? 1 : x.mmrLambda;
            const deduplicateExact = bool(x.deduplicateExact ?? true, 'deduplicateExact');
            ensure(typeof lambda === 'number' && Number.isFinite(lambda) && lambda >= 0 && lambda <= 1, 'INVALID_INPUT', 'mmrLambda 是 0–1 的相关性权重，1关闭MMR选择', 400);
            const { config, ids, loaded } = this.authorizeSearch(actor, projectId, x);
            const request = { query, limit, mmrLambda: lambda, deduplicateExact, artifactIds: ids, corpusId: config.corpusId, configurationVersion: config.version, method: METHOD_VERSION };
            const id = digest({ projectId, ...request }), previous = this.app.store.maybe('text-evidence-search', id);
            if (previous) {
                previous.hits.forEach((h) => this.app.evidence.verify(projectId, h.evidenceId));
                return previous;
            }
            const chunks = loaded.flatMap(x => x.chunks), ranked = rankChunks(chunks, query, limit, lambda, deduplicateExact);
            const hits = ranked.selected.map(({ vector: _, ...chunk }) => {
                const link = this.app.store.maybe('text-chunk-link', chunk.chunkId);
                const e = link ? this.app.evidence.verify(projectId, link.evidenceId) : this.app.evidence.register(actor, projectId, chunk.artifactId, chunk.locator.start, chunk.locator.end, `用户导入文本原文：${chunk.title}，行 ${chunk.lineStart}–${chunk.lineEnd}；${PARSER_VERSION}`);
                if (!link)
                    this.app.store.create('text-chunk-link', projectId, { evidenceId: e.id }, chunk.chunkId);
                return { ...chunk, evidenceId: e.id, sourceKind: 'user_imported_text', offsetUnit: 'utf16-code-unit', page: null };
            });
            const result = this.app.store.create('text-evidence-search', projectId, { ...request, status: hits.length ? 'matches' : 'no_lexical_match',
                hits, coverage: { sourceCount: ids.length, totalChunks: chunks.length, matchingChunks: ranked.matchingChunks, exactDuplicatesGrouped: ranked.exactDuplicatesGrouped, uniqueChunks: ranked.uniqueChunks,
                    candidatesConsidered: ranked.candidatesConsidered, candidateLimitReached: ranked.candidateLimitReached, resultsTruncated: ranked.matchingChunks > hits.length },
                usage: { modelCalls: 0, networkCalls: 0 }, limitations: ['仅对选定用户文本进行词项检索，不是语义检索或自动回答。', '未匹配不证明文献中没有答案；相关性分数不是正确性或独立证据评分。', '没有 PDF 页级定位、摘要生成或科学结论验收；存在相反结果时应逐条读原文。'] }, id);
            this.app.store.event(projectId, 'text-evidence.searched', { searchId: result.id, sourceCount: ids.length, hitCount: hits.length });
            return result;
        });
    }
}
//# sourceMappingURL=service.js.map