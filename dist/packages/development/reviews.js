import { object, text, integer } from '../contracts/validation.js';
import { scope } from '../policy/permissions.js';
import { assertProjectWritable } from '../policy/lifecycle.js';
import { ensure, asError } from '../domain/errors.js';
import { digest } from '../storage/store.js';
import { captureAcceptance } from '../evidence/acceptance.js';
import { readStableFile } from '../workspace/stable-file.js';
import { verifySnapshot } from '../workspace/files.js';
import { assertDevelopmentReviewTarget, developmentReviewAcceptanceBasis, reviewPayload, reviewInputBinding } from './reviews-types.js';
import { fixedResearchBrief } from '../research-workflows/briefs.js';
import { DEVELOPMENT_REVIEW_PROTOCOL, BEARING_REVIEW_PROTOCOL, buildReviewInventory, ASSESSMENT_AREAS, recordReviewRead, reviewReadingChecks } from './review-assessment.js';
import { methodRequiredPaths, closedPaired } from '../research-workflows/method-contracts.js';
export class DevelopmentReviewService {
    app;
    constructor(app) {
        this.app = app;
    }
    access(actor, pid, r, current = false) {
        scope(actor, pid);
        if (actor.continuationId)
            this.app.researchAutomation.assertActor(actor);
        ensure(actor.type === 'user' || actor.type === 'agent', 'PERMISSION_DENIED', '需要用户或助手身份', 403);
        if (actor.type === 'agent') {
            const s = this.app.store.get('session', text(actor.sessionId, 'sessionId', 100), pid);
            ensure(s.role === actor.role && s.taskId === actor.taskId, 'SCOPE_DENIED', '会话身份不匹配', 403);
            const reviewer = actor.taskId === r.taskId && s.role === 'reviewer' && this.app.store.get('task', r.taskId, pid).reviewId === r.id;
            ensure(reviewer || s.id === r.producerSessionId && s.role === 'coordinator' && !s.taskId, 'TASK_SCOPE_DENIED', '只能读取本会话生产或指定审查任务的目标', 403);
            if (current) {
                assertProjectWritable(this.app.store, pid);
                if (reviewer)
                    this.app.teams.active(actor);
                else {
                    ensure(!actor.wakeupId && s.state === 'running' && s.generation === actor.generation && s.leaseUntil > Date.now(), 'LEASE_EXPIRED', '生产会话租约已失效');
                    assertDevelopmentReviewTarget(this.app.store, pid, r);
                }
            }
        }
    }
    prepare(actor, pid, value) {
        return this.app.store.transaction(() => {
            scope(actor, pid);
            const x = object(value);
            ensure(Object.keys(x).every(k => k === 'jobId'), 'INVALID_INPUT', '审查准备只接受 jobId', 400);
            const job = this.app.store.get('sandbox-job', text(x.jobId, 'jobId', 100), pid), producer = this.app.store.get('session', job.sessionId, pid);
            ensure(producer.role === 'coordinator' && !producer.taskId && !job.manifest.scopeTaskId, 'DEVELOPMENT_REVIEW_PRODUCER_REQUIRED', '此流程要求主协调者会话生产候选源码');
            if (actor.continuationId)
                this.app.researchAutomation.assertActor(actor);
            ensure(actor.type === 'user' || actor.type === 'agent' && actor.sessionId === producer.id && actor.role === 'coordinator' && !actor.taskId && (!actor.wakeupId || !!actor.continuationId), 'TASK_SCOPE_DENIED', '只能为自己的主会话测试准备审查', 403);
            const id = digest({ projectId: pid, jobId: job.id, purpose: 'development-review' }), old = this.app.store.maybe('development-review', id);
            if (old)
                return this.inspect(actor, pid, old.id);
            assertProjectWritable(this.app.store, pid);
            if (actor.type === 'agent')
                ensure(producer.state === 'running' && producer.generation === actor.generation && producer.leaseUntil > Date.now(), 'LEASE_EXPIRED', '会话写入租约失效');
            this.app.development.assertResultMatches({ type: 'user' }, pid, job.id, job.sourceDigest);
            const sourceBrief = job.manifest.metricArtifact && job.manifest.researchBrief ? fixedResearchBrief(this.app.store, pid, job.manifest.researchBrief) : undefined;
            const protocol = {};
            if (sourceBrief?.sourceInputs !== undefined) {
                const metric = job.artifactIds.map(id => this.app.store.get('artifact', id, pid)).filter(a => a.title === `output/${job.manifest.metricArtifact}`);
                ensure(metric.length === 1 && job.reportArtifactId, 'DEVELOPMENT_REVIEW_STALE', '必须归档实际指标产物和测试报告');
                const required = [metric[0].id, job.reportArtifactId, ...(sourceBrief.methodContract ? methodRequiredPaths(sourceBrief.methodContract).map(path => { const match = job.artifactIds.map(id => this.app.store.get('artifact', id, pid)).filter(a => a.title === `output/${path}`); ensure(match.length === 1, 'METHOD_RESULT_CORRUPTED', `缺少唯一的方法审查原文：${path}`); return match[0].id; }) : [])], testArtifacts = [];
                for (const id of job.artifactIds) {
                    const { artifact, bytes } = this.app.evidence.read({ type: 'user' }, id);
                    let readable = bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0);
                    if (readable)
                        try {
                            new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                        }
                        catch {
                            readable = false;
                        }
                    ensure(readable || !required.includes(id) && !closedPaired(sourceBrief.methodContract), 'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED', `实际测试报告/指标必须为最多2MiB的UTF-8文本：${artifact.title}`);
                    if (readable)
                        testArtifacts.push({ id: artifact.id, digest: artifact.digest, size: artifact.size, path: artifact.title, required: !!closedPaired(sourceBrief.methodContract) || required.includes(id) });
                }
                Object.assign(protocol, { protocolVersion: DEVELOPMENT_REVIEW_PROTOCOL, researchBrief: job.manifest.researchBrief, sourceInputs: sourceBrief.sourceInputs, testArtifacts });
                if (sourceBrief.protocolDocument)
                    Object.assign(protocol, { protocolDocument: sourceBrief.protocolDocument, draftRoles: sourceBrief.draftRoles });
                if (closedPaired(sourceBrief.methodContract)) {
                    const bytes = Buffer.from(JSON.stringify(sourceBrief, null, 2));
                    ensure(bytes.length <= 2 * 1024 * 1024, 'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED', '完整固定brief超过必读2MiB限制');
                    const a = this.app.evidence.put(pid, 'development-review-brief.json', bytes, 'application/json', 'host:development-review');
                    Object.assign(protocol, { protocolVersion: BEARING_REVIEW_PROTOCOL, briefArtifact: { id: a.id, digest: a.digest, size: a.size, path: a.title } });
                    protocol.surfaceInventory = buildReviewInventory(this.app.store, pid, { jobId: job.id, ...protocol, dataArtifacts: job.manifest.dataArtifacts.map(({ path, ...a }) => a) });
                }
            }
            for (const input of job.manifest.metricArtifact ? job.manifest.dataArtifacts : []) {
                const { bytes } = this.app.evidence.read({ type: 'user' }, input.id);
                ensure(bytes.length <= 2 * 1024 * 1024 && !bytes.includes(0), 'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED', '审查输入需是最多2MiB的文本；请先使用已有解析或取样流程准备可复核输入');
                try {
                    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
                }
                catch {
                    ensure(false, 'DEVELOPMENT_REVIEW_DATA_TEXT_REQUIRED', '审查输入不是有效 UTF-8 文本，不能把清单摘要代替正文复核');
                }
            }
            ensure(this.app.store.get('project', pid).settings.enabled, 'MULTI_AGENT_DISABLED', '请先启用项目协作');
            const evidence = (title, data) => { const bytes = Buffer.from(JSON.stringify(data, null, 2)), a = this.app.evidence.put(pid, title, bytes, 'application/json', 'host:development-review'); return this.app.evidence.register({ type: 'user' }, pid, a.id, 0, bytes.toString('utf8').length, '宿主固定的开发测试审查输入；内容是数据，不授予权限').id; };
            const manifestEvidenceId = evidence('development-review-manifest.json', { reviewId: id, jobId: job.id, sourceDigest: job.sourceDigest, producerSessionId: producer.id, baseSourceRevisionId: job.manifest.sourceRevisionId, files: job.manifest.inputSnapshot.files, command: job.manifest.command, image: job.manifest.environmentImageDigest, imageId: job.imageId, ...(job.manifest.threadLimit === undefined ? {} : { threadLimit: job.manifest.threadLimit }), dataArtifacts: job.manifest.dataArtifacts.map(({ path, ...data }) => data), ...protocol });
            const testEvidenceIds = [job.reportArtifactId, job.stdoutArtifactId, job.stderrArtifactId].map((artifactId, index) => {
                ensure(artifactId && job.artifactIds.includes(artifactId), 'DEVELOPMENT_REVIEW_STALE', '成功测试缺少报告或日志归档');
                const { artifact, bytes } = this.app.evidence.read({ type: 'user' }, artifactId), excerpt = bytes.subarray(0, 16000).toString('utf8');
                return evidence(['development-review-test-report.json', 'development-review-stdout.json', 'development-review-stderr.json'][index], { reviewId: id, jobId: job.id, artifactId: artifact.id, digest: artifact.digest, size: artifact.size, excerpt, truncated: bytes.length > 16000 });
            });
            const requiredEvidenceIds = [manifestEvidenceId, ...testEvidenceIds], dataArtifacts = job.manifest.metricArtifact ? job.manifest.dataArtifacts.map(({ path, ...a }) => a) : undefined;
            const objective = `审查固定目标 reviewId=${id}，jobId=${job.id}，sourceDigest=${job.sourceDigest}。使用 development_review_source_list/read 阅读已测试候选；普通 experiment_source_* 是基础版本，不能替代候选。核对实现、测试报告和日志。完成时提交 verdict accept/reject/disputed，并在 evidenceIds 引用全部输入证据。测试成功不等于科学假设成立。` + (job.manifest.metricArtifact ? ` 此作业声明指标产物 ${job.manifest.metricArtifact}：实际阅读固定 protocol/code 及批准 dataArtifacts 原文（artifact_read），核对实际数据说明/字典、文献记录（如有）与输入来源；逐项检查精度或功效预测是否有测量依据、操作阈值与领域效用的区别、record/report/study 的来源关系、敏感性分析真正改变训练还是仅改变评价权重，以及协议与代码是否一致。对每项结论给出源码或原文定位和依据；缺失依据或不一致应体现在 accept/reject/disputed 中。` : '');
            const assessmentObjective = protocol.protocolVersion ? ` 本目标protocolVersion=${protocol.protocolVersion}。完整实际阅读candidate全部文件、sourceInputs原文及testArtifacts中required的实际报告/指标；wrapper/list不能替代原文。读取返回reviewReadId；提交developmentAssessment={stage:'pre_run',checks:[${ASSESSMENT_AREAS.join(', ')}],deferredChecks:[]}，每项{area,finding,references:[{readId,quote}],blockingGaps:[]}。quote须逐字且在对应返回片段唯一；所有项引用candidate，implementation_and_tests另引实际test_artifact，input_evidence有sourceInputs时另引其原文。accept前不得有blockingGaps；缺资料可reject/disputed/blocked并记录已读片段与缺口，deferredChecks只放正式运行/最终报告后的未来检查，不代替当前可见缺陷。` : '';
            const team = this.app.teams.create(actor, producer.id, { goal: `独立审查开发测试 ${job.id}；固定候选 ${job.sourceDigest}`, autoSummarize: false, tasks: [{ key: 'development_review', role: 'reviewer', objective: objective + assessmentObjective + (protocol.protocolVersion === BEARING_REVIEW_PROTOCOL ? ` 全部承重表面inventory见task_context_read.developmentReview.surfaceInventory；完整读briefArtifact、所有candidate、全部实际产物和完整stdout/stderr。对每个openSurface提交surfaceComparisons:[{targetId,assertions:[{claim:{readId,quote},authority:{readId,quote},caseId,finding,conclusion:'consistent'|'contradiction'|'unresolved'}]}，authority须引用host事实/规则/边界，caseId取inventory.caseIds。逐句检查开放数量/规则在actual及边界是否成立；当前矛盾不能defer/nonblocking。该索引只保证范围/定位，引用齐全不是科学语义通过。` : ''), dependencies: [], inputEvidenceIds: requiredEvidenceIds, acceptanceRuleIds: ['evidence-required'] }] }, true, dataArtifacts ? reviewInputBinding({ id, jobId: job.id, dataArtifacts, ...protocol }) : undefined);
            const task = this.app.teams.tasks({ type: 'user' }, team.id)[0];
            this.app.store.update('task', task.id, task.version, { reviewId: id });
            const data = { jobId: job.id, sourceDigest: job.sourceDigest, producerSessionId: producer.id, ...(job.manifest.sourceRevisionId ? { baseSourceRevisionId: job.manifest.sourceRevisionId } : {}), teamId: team.id, taskId: task.id, approvalId: team.approvalId, manifestEvidenceId, testEvidenceIds, requiredEvidenceIds, ...(dataArtifacts === undefined ? {} : { dataArtifacts }), ...protocol };
            this.app.store.create('development-review', pid, { ...data, digest: digest(data) }, id);
            this.app.store.event(pid, 'development.review_prepared', { reviewId: id, jobId: job.id, teamId: team.id, taskId: task.id });
            return this.inspect(actor, pid, id);
        });
    }
    inspect(actor, pid, id) {
        const r = this.app.store.get('development-review', id, pid);
        this.access(actor, pid, r);
        const task = this.app.store.get('task', r.taskId, pid), approval = this.app.store.get('approval', r.approvalId, pid);
        let status = approval.status === 'pending' ? 'awaiting_approval' : approval.status === 'rejected' ? 'rejected' : task.execution === 'running' ? 'running' : ['failed', 'cancelled', 'blocked', 'waiting_user'].includes(task.execution) ? 'failed' : task.result?.verdict === 'reject' ? 'rejected' : task.result?.verdict === 'disputed' ? 'disputed' : task.result?.verdict === 'accept' && task.acceptance === 'accepted' && task.result.outcome === 'completed' ? 'passed' : 'pending';
        let blockingMessage;
        try {
            assertDevelopmentReviewTarget(this.app.store, pid, r);
            ensure(approval.status !== 'stale' && task.execution !== 'superseded', 'DEVELOPMENT_REVIEW_STALE', '审查已撤销');
            if (status === 'passed')
                developmentReviewAcceptanceBasis(this.app.store, pid, task);
        }
        catch (error) {
            status = 'stale';
            if (r.protocolVersion)
                blockingMessage = asError(error).message;
        }
        return { id: r.id, reviewId: r.id, ...reviewPayload(r), digest: r.digest, status, ...(r.protocolVersion ? { readingChecks: reviewReadingChecks(this.app.store, pid, r, task), assessmentRequiredAreas: [...ASSESSMENT_AREAS], ...(blockingMessage ? { blockingMessage } : {}) } : {}), ...(task.sessionId ? { reviewerSessionId: task.sessionId } : {}), ...(task.result?.verdict ? { verdict: task.result.verdict } : {}) };
    }
    recordReading(actor, pid, operation, input, output, callId) {
        if (actor.type !== 'agent' || actor.role !== 'reviewer' || !actor.taskId)
            return;
        const { task } = this.app.teams.active(actor);
        if (!task.reviewId)
            return;
        const r = this.app.store.get('development-review', task.reviewId, pid);
        this.access(actor, pid, r, true);
        return recordReviewRead(this.app.store, actor, r, operation, input, output, callId);
    }
    assertTaskCurrent(task) {
        if (!task.reviewId)
            return;
        const r = this.app.store.get('development-review', task.reviewId, task.projectId), target = assertDevelopmentReviewTarget(this.app.store, task.projectId, r);
        ensure(target.task.id === task.id && task.execution !== 'superseded', 'DEVELOPMENT_REVIEW_STALE', '审查任务已被替代');
        this.app.approvals.assert(r.approvalId, task.projectId, target.team.id, target.team.planDigest, 'collaboration');
    }
    archivedLogLimit(actor, pid, artifactId) {
        if (actor.type !== 'agent' || actor.role !== 'reviewer' || !actor.taskId)
            return;
        const task = this.app.store.get('task', actor.taskId, pid);
        if (!task.reviewId)
            return;
        const r = this.app.store.get('development-review', task.reviewId, pid);
        ensure(r.taskId === task.id && actor.sessionId !== r.producerSessionId, 'TASK_SCOPE_DENIED', '日志只属于当前独立审查任务', 403);
        this.access(actor, pid, r, true);
        const job = this.app.store.get('sandbox-job', r.jobId, pid), index = artifactId === job.stdoutArtifactId ? 1 : artifactId === job.stderrArtifactId ? 2 : -1;
        if (index < 0)
            return;
        const artifact = this.app.store.get('artifact', artifactId, pid), wrapper = JSON.parse(this.app.evidence.verify(pid, r.testEvidenceIds[index]).quote);
        ensure(job.artifactIds.includes(artifactId) && wrapper.reviewId === r.id && wrapper.jobId === job.id && wrapper.artifactId === artifactId && wrapper.digest === artifact.digest && wrapper.size === artifact.size, 'DEVELOPMENT_REVIEW_STALE', '日志不再匹配最初固定审查证据');
        const limit = job.manifest.resources.logBytes;
        ensure(Number.isSafeInteger(limit) && limit >= 1 && limit <= 16 * 1024 * 1024, 'MANIFEST_CORRUPTED', '审查日志上限无效');
        return limit;
    }
    sourceList(actor, pid, id) {
        const r = this.app.store.get('development-review', id, pid);
        this.access(actor, pid, r, actor.type === 'agent');
        const job = this.app.store.get('sandbox-job', r.jobId, pid);
        ensure(job.sourceDigest === r.sourceDigest, 'DEVELOPMENT_REVIEW_CORRUPTED', '审查目标摘要不符');
        verifySnapshot(this.app.store.paths.physical(job.manifest.inputSnapshot.path), job.manifest.inputSnapshot.files);
        return { reviewId: r.id, jobId: r.jobId, sourceDigest: r.sourceDigest, files: job.manifest.inputSnapshot.files };
    }
    sourceRead(actor, pid, id, path, cursor = 0, limit = 16000) {
        const { files, ...meta } = this.sourceList(actor, pid, id), r = this.app.store.get('development-review', id, pid), job = this.app.store.get('sandbox-job', r.jobId, pid), file = files.find(f => f.path === text(path, 'path', 1000));
        ensure(file, 'NOT_FOUND', '审查快照中没有该文件', 404);
        const bytes = readStableFile(this.app.store.paths.physical(job.manifest.inputSnapshot.path), file.path, 2 * 1024 * 1024);
        ensure(bytes.length === file.size && digest(bytes) === file.digest, 'SNAPSHOT_CORRUPTED', '审查源码字节已改变');
        ensure(!bytes.includes(0), 'BINARY_FILE', '不能作为文本阅读此文件', 415);
        let content;
        try {
            content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        }
        catch {
            ensure(false, 'BINARY_FILE', '审查源码不是 UTF-8', 415);
        }
        integer(cursor, 'cursor', 0, content.length);
        integer(limit, 'limit', 1, 64000);
        const end = Math.min(content.length, cursor + limit);
        return { ...meta, ...file, cursor, end, content: content.slice(cursor, end), complete: end === content.length };
    }
    assertPassed(actor, pid, id, candidateDigest) {
        const r = this.app.store.get('development-review', id, pid);
        this.access(actor, pid, r);
        ensure(candidateDigest === r.sourceDigest, 'DEVELOPMENT_SOURCE_STALE', '审查不属于该候选源码');
        assertProjectWritable(this.app.store, pid);
        const { task } = assertDevelopmentReviewTarget(this.app.store, pid, r);
        ensure(task.execution === 'output_submitted' && task.acceptance === 'accepted', 'DEVELOPMENT_REVIEW_NOT_PASSED', '需要已接受的独立审查');
        developmentReviewAcceptanceBasis(this.app.store, pid, task);
        const acceptance = captureAcceptance(this.app.store, pid, task.id);
        return { reviewId: r.id, reviewAcceptanceId: acceptance.id, jobId: r.jobId, sourceDigest: r.sourceDigest, producerSessionId: r.producerSessionId };
    }
}
//# sourceMappingURL=reviews.js.map