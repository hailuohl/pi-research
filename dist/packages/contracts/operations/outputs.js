import { PUBLICATION_OUTPUT_SCHEMAS } from './publication-schemas.js';
import { RESEARCH_PLAN_OUTPUT_SCHEMAS, EXPERIMENT_PLAN_SCHEMA, RESEARCH_CANDIDATE_SCHEMA, PLAN_SOURCE_SCHEMA } from './research-plan-schemas.js';
import { SKILL_OUTPUT_SCHEMAS, SKILL_REQUIREMENTS_SCHEMA } from './skill-schemas.js';
import { DOCUMENT_OUTPUT_SCHEMAS, DOCUMENT_EVIDENCE_LINK_SCHEMA, DISCOVERY_OUTPUT_SCHEMA } from './document-schemas.js';
import { GIT_OUTPUT_SCHEMAS } from './git-schemas.js';
import { REPORT_OUTPUT_SCHEMAS } from './report-schemas.js';
import { SCHEDULER_OUTPUT_SCHEMAS } from './scheduler-schemas.js';
import { REVIEW_OUTPUT_SCHEMAS } from './review-schemas.js';
import { DEVELOPMENT_OUTPUT_SCHEMAS } from './development-schemas.js';
import { SOURCE_OUTPUT_SCHEMAS } from './source-schemas.js';
const string = { type: 'string' };
const number = { type: 'number' };
const integer = { type: 'integer' };
const boolean = { type: 'boolean' };
const nullableString = { anyOf: [string, { type: 'null' }] };
const strings = { type: 'array', items: string };
const enumeration = (...values) => ({ type: 'string', enum: values });
const array = (items) => ({ type: 'array', items });
const object = (properties, optional) => ({
    type: 'object', properties, required: Object.keys(properties).filter(key => !optional?.includes(key)), additionalProperties: false
});
const row = (kind, properties, optional) => object({
    id: string, kind: { const: kind }, projectId: nullableString, version: integer, createdAt: string, updatedAt: string,
    ...properties
}, optional);
const sourceFile = object({ path: string, size: integer, digest: string, mode: enumeration('100644', '100755') }, ['mode']);
const snapshot = object({ digest: string, path: string, files: array(sourceFile) });
const contract = object({
    command: strings,
    environment: { type: 'object', additionalProperties: string },
    datasetVersion: string, evaluationProtocolVersion: string,
    metrics: { type: 'object', additionalProperties: object({ unit: string, direction: enumeration('min', 'max') }) },
    expectedArtifacts: strings, timeoutSeconds: integer, runner: enumeration('trusted-example', 'docker'),
    image: string, cpus: integer, memoryMb: integer, dockerContext: string, pids: integer, workMb: integer, logBytes: integer, outputBytes: integer, networkPolicy: { const: 'none' }
}, ['image', 'dockerContext', 'pids', 'workMb', 'logBytes', 'outputBytes', 'networkPolicy']);
const manifest = object({
    experimentId: string, experimentVersion: integer, experimentRevision: integer,
    contract, contractDigest: string, snapshotDigest: string, snapshotPath: string,
    sourceFiles: array(sourceFile), createdAt: string, sourceRevisionId: string, gitCommit: string
}, ['sourceRevisionId', 'gitCommit']);
const runnerExecution = object({ backend: { const: 'docker' }, dockerContext: string, containerName: string, containerId: string, imageId: string, controlDir: string, generation: integer, leaseUntil: number, startRequested: boolean, recoveryCount: integer, logTruncated: boolean, logsIncomplete: boolean, outputExceeded: boolean }, ['containerId', 'imageId', 'logTruncated', 'logsIncomplete', 'outputExceeded']);
const taskResult = object({
    summary: string, outcome: enumeration('completed', 'partial', 'blocked'), evidenceIds: strings, artifactIds: strings,
    claims: array(object({ statement: string, evidenceIds: strings, limitations: strings })),
    unresolvedQuestions: strings, verdict: enumeration('accept', 'reject', 'disputed')
}, ['verdict']);
/** Success payloads are the existing service records, including durable replay fields. */
const CORE_OUTPUT_SCHEMAS = {
    run_prepare: row('run-intent', {
        experimentId: string, manifest, manifestDigest: string, approvalId: string,
        status: enumeration('prepared', 'submitted'), runId: string
    }, ['runId']),
    run_submit: row('run', {
        experimentId: string, intentId: string, manifest, manifestDigest: string,
        state: enumeration('queued', 'submitting', 'running', 'cancelling', 'succeeded', 'failed', 'cancelled', 'unknown'),
        integrity: enumeration('pending', 'complete', 'incomplete', 'invalid'),
        judgment: enumeration('pending', 'supported', 'not_supported', 'inconclusive'),
        answerDisposition: enumeration('answered', 'unanswered', 'needs_review'), answerReviewId: string,
        outputDir: string, supervisorPid: integer, childPid: integer, heartbeat: number, startedAt: string, endedAt: string,
        exitCode: { anyOf: [integer, { type: 'null' }] }, cancelRequested: boolean,
        metrics: { type: 'object', additionalProperties: number }, error: string, artifactIds: strings, evidenceIds: strings, execution: runnerExecution
    }, ['answerDisposition', 'answerReviewId', 'supervisorPid', 'childPid', 'heartbeat', 'startedAt', 'endedAt', 'exitCode', 'metrics', 'error', 'execution']),
    workspace_read: object({ path: string, content: string, digest: string, size: integer }),
    workspace_write: object({ path: string, digest: string, size: integer }),
    change_proposal_prepare: row('change-proposal', {
        baseExperimentId: string, baseRevision: integer, baseSnapshot: snapshot, contractDigest: string,
        title: string, hypothesis: string,
        changes: array(object({
            path: string, expectedDigest: nullableString, artifactId: nullableString, artifactDigest: nullableString,
            taskId: string, taskResultDigest: string, sourceAcceptanceId: string, mode: enumeration('100644', '100755'), beforeMode: enumeration('100644', '100755')
        }, ['taskId', 'taskResultDigest', 'sourceAcceptanceId', 'mode', 'beforeMode'])),
        candidateSnapshot: snapshot, digest: string, approvalId: string, state: enumeration('prepared', 'applied'),
        testsStatus: enumeration('not_run', 'passed'), testJobId: string, appliedExperimentId: string, sourceValidity: enumeration('current', 'stale'), invalidatedBy: string, flow: { const: 'reviewed-development' }, reviewId: string, reviewAcceptanceId: string
    }, ['testJobId', 'appliedExperimentId', 'sourceValidity', 'invalidatedBy', 'flow', 'reviewId', 'reviewAcceptanceId']),
    task_result_submit: row('task-result', {
        taskId: string, attemptId: string, planVersion: integer, directiveVersion: integer,
        inputDigest: string, digest: string, result: taskResult
    }),
    paper_read: row('paper-read', {
        source: enumeration('alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref'),
        idInSource: string, requestedId: string, title: string, sourceUrl: string,
        contentKind: enumeration('metadata', 'abstract', 'full_text'),
        versionAssurance: enumeration('requested-address-unverified', 'provider-record'), pageMapping: { const: 'unavailable' },
        artifactId: string, artifactDigest: string, rawArtifactIds: strings, fullTextRead: boolean, retrievedAt: string,
        scopeSessionId: nullableString, scopeAttemptId: nullableString, scopeTaskId: nullableString, reportedVersion: nullableString, resolvedId: string, license: nullableString,
        sourceResponses: array(object({ url: string, contentType: string })), limitations: strings
    }, ['scopeTaskId', 'reportedVersion', 'resolvedId', 'license'])
};
const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });
const source = enumeration('alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref');
const locator = object({ start: integer, end: integer });
const execution = enumeration('pending', 'running', 'output_submitted', 'failed', 'cancelled', 'blocked', 'superseded', 'waiting_user');
const acceptance = enumeration('pending', 'accepted', 'rejected', 'disputed');
const role = enumeration('literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer');
const settings = object({ enabled: boolean, strategy: enumeration('adaptive', 'manual'), maxActiveAgents: integer, maxConcurrentAssistants: integer, maxTasksPerTeam: integer, maxTaskAttempts: integer, requirePlanConfirmation: boolean, shutdownPolicy: { const: 'drain' } });
const expectedOutput = object({ kind: enumeration('report', 'dataset', 'patch', 'analysis', 'review', 'code', 'text'), schemaId: enumeration('report', 'text', 'csv', 'json', 'patch', 'code', 'review'), required: boolean, title: string, mediaType: string, minBytes: integer }, ['title', 'mediaType', 'minBytes']);
const team = row('team', {
    rootSessionId: string, goal: string, state: enumeration('awaiting_approval', 'active', 'paused', 'draining', 'completed', 'partial', 'failed', 'cancelled'), settings,
    delegationEnabled: boolean, planVersion: integer, directiveVersion: integer, planDigest: string, approvalId: string, summarySent: boolean, autoSummarize: boolean, blockReason: string, sourceRevisionId: string
}, ['autoSummarize', 'blockReason', 'sourceRevisionId']);
const evidence = row('evidence', { type: enumeration('artifact', 'run', 'paper', 'code'), artifactId: string, digest: string, locator, quote: string, description: string, runId: string, document: DOCUMENT_EVIDENCE_LINK_SCHEMA }, ['runId', 'document']);
const skillSource = object({ repository: string, commit: string, path: string, blob: string });
const member = row('campaign-member', { campaignId: string, roundId: string, experimentId: string, intentId: string, required: boolean, repairDecisionId: string, candidateId: string, repairOfMemberId: string, repairRootMemberId: string }, ['repairDecisionId', 'candidateId', 'repairOfMemberId', 'repairRootMemberId']);
const decision = row('campaign-decision', {
    campaignId: string, roundId: string, action: enumeration('repair', 'refill', 'promote', 'stop'), reason: string, observationIds: strings, selectedRunId: string,
    // Candidate configuration is an explicitly user-defined JSON object in DecisionService.
    candidates: array(object({ title: string, hypothesis: string, config: { type: 'object', additionalProperties: {} }, implementation: enumeration('config', 'reviewed-code') }, ['config', 'implementation'])),
    inputDigest: string, approvalId: string, decisionDigest: string, status: enumeration('proposed', 'applied'), appliedAt: string,
    effects: object({ experimentIds: strings, intentIds: strings, roundId: string, stopped: boolean, candidateIds: strings }, ['candidateIds']), planRevisionId: string, planDigest: string
}, ['selectedRunId', 'appliedAt', 'effects', 'planRevisionId', 'planDigest']);
const corpusSource = object({ artifactId: string, digest: string, title: string, size: integer });
const chunkSource = object({ artifactId: string, digest: string, title: string, locator, lineStart: integer, lineEnd: integer });
const contextTask = object({ id: string, key: string, result: taskResult }, ['result']);
const artifact = row('artifact', { title: string, digest: string, size: integer, path: string, mediaType: string, origin: string, wakeupId: string, runId: string, taskId: string }, ['wakeupId', 'runId', 'taskId']);
/** All public tool success bodies. Fixed records are closed; only named service-owned dictionaries are open. */
export const OUTPUT_SCHEMAS = {
    ...RESEARCH_PLAN_OUTPUT_SCHEMAS,
    ...SKILL_OUTPUT_SCHEMAS,
    ...PUBLICATION_OUTPUT_SCHEMAS,
    ...DEVELOPMENT_OUTPUT_SCHEMAS, ...GIT_OUTPUT_SCHEMAS, ...REVIEW_OUTPUT_SCHEMAS, ...REPORT_OUTPUT_SCHEMAS, ...SCHEDULER_OUTPUT_SCHEMAS,
    ...CORE_OUTPUT_SCHEMAS,
    ...SOURCE_OUTPUT_SCHEMAS, ...DOCUMENT_OUTPUT_SCHEMAS,
    run_inspect: CORE_OUTPUT_SCHEMAS.run_submit,
    reviewed_change_prepare: CORE_OUTPUT_SCHEMAS.change_proposal_prepare,
    workspace_list: array(object({ path: string, size: integer, digest: string }, ['digest'])),
    artifact_read: object({ artifactId: string, digest: string, title: string, mediaType: string, content: string, cursor: integer, complete: boolean }),
    artifact_create: artifact,
    report_create: artifact,
    report_export: artifact,
    evidence_register: evidence,
    evidence_read: evidence,
    session_notice_read: object({ messageId: string, content: string, cursor: integer, complete: boolean }),
    run_logs: object({ content: string, cursor: integer, complete: boolean, start: integer, size: integer, identity: nullableString }),
    run_source_list: object({ runId: string, experimentId: string, revision: integer, sourceDigest: string, gitCommit: string, files: array(sourceFile) }, ['gitCommit']),
    run_source_read: object({ runId: string, experimentId: string, revision: integer, sourceDigest: string, gitCommit: string, path: string, size: integer, digest: string, mode: enumeration('100644', '100755'), cursor: integer, end: integer, complete: boolean, content: string }, ['gitCommit', 'mode']),
    approval_request: array(row('approval', { subjectKind: string, subjectId: string, digest: string, scope: string, status: enumeration('pending', 'approved', 'rejected', 'stale'), reason: string, decidedAt: string }, ['decidedAt'])),
    experiment_plan_submit: row('experiment', { title: string, hypothesis: string, parentId: nullableString, lifecycle: enumeration('provisional', 'frozen', 'archived'), changeProposalId: string, contract, contractDigest: string, workspace: string, notes: strings, revision: integer }, ['changeProposalId']),
    collaboration_plan_submit: team,
    agent_delegate: team,
    task_inspect: array(row('task', {
        key: string, role, objective: string, dependencies: strings, critical: boolean, reviewOf: string, required: boolean, inputEvidenceIds: strings, expectedOutputs: array(expectedOutput), acceptanceRuleIds: strings,
        teamId: string, sessionId: string, execution, acceptance, planVersion: integer, directiveVersion: integer, attemptCount: integer, generation: integer, attemptId: string, blockReason: string, result: taskResult, reviewId: string, publicationReviewId: string, skillIds: strings
    }, ['critical', 'reviewOf', 'required', 'inputEvidenceIds', 'expectedOutputs', 'acceptanceRuleIds', 'sessionId', 'attemptId', 'blockReason', 'result', 'reviewId', 'publicationReviewId', 'skillIds'])),
    task_result_read: object({ id: string, key: string, execution, acceptance, result: taskResult }, ['result']),
    task_context_read: nullable(object({ skillBundleId: string, skillIds: strings, schemaVersion: { const: 1 }, taskId: string, teamId: string, goal: string, objective: string, role, planVersion: integer, directiveVersion: integer, inputEvidenceIds: strings, expectedOutputs: array(expectedOutput), acceptanceRuleIds: strings, upstream: array(contextTask), reviewOf: nullable(contextTask), restrictions: strings, stopConditions: strings, source: object({ snapshotId: string, experimentId: string, revision: integer, sourceDigest: string }), developmentReview: object({ reviewId: string, jobId: string, sourceDigest: string, manifestEvidenceId: string, testEvidenceIds: strings }), publicationReview: object({ reviewId: string, publicationResultId: string, revisionId: string, jobId: string, sourceDigest: string, pdfDigest: string, digest: string, requiredEvidenceIds: strings, artifactIds: strings }) }, ['source', 'developmentReview', 'publicationReview', 'skillBundleId', 'skillIds'])),
    task_progress_report: object({ seq: integer, id: string, projectId: nullableString, type: { const: 'task.progress' }, payload: object({ sessionId: string, taskId: string, message: string }, ['taskId']), createdAt: string }),
    research_skill_list: object({ bundleId: string, builtinBundleId: string, revisionIds: strings, skills: array(object({ id: string, description: string, digest: string, resources: strings, source: skillSource, revisionId: string, requirements: SKILL_REQUIREMENTS_SCHEMA }, ['revisionId', 'requirements'])) }, ['builtinBundleId', 'revisionIds']),
    research_skill_read: object({ id: string, resource: string, content: string, digest: string, bundleId: string, source: skillSource }),
    connector_status: object({
        version: integer, enabled: object({ alphaxiv: boolean, openalex: boolean, biorxiv: boolean, pubmed: boolean, crossref: boolean }), requestLimit: integer, requestsUsed: integer,
        credentials: object({ openalexKeyConfigured: boolean, ncbiKeyConfigured: boolean, ncbiEmailConfigured: boolean }),
        capabilities: array(object({ id: string, category: enumeration('literature', 'compute', 'collaboration', 'publication'), operations: strings, implementation: enumeration('http-adapter', 'existing-runner', 'not-implemented', 'existing-service'), verification: enumeration('fixture-only', 'local-example-tested', 'not-live-tested', 'unavailable', 'local-tests'), credential: string, content: string, limitation: string }, ['credential', 'content', 'limitation'])),
        budgetUnit: string, defaults: string, observations: array(object({ id: string, source, host: string, status: string, startedAt: string, httpStatus: nullable(integer), retryAfter: nullable(string), error: nullable(string) }))
    }),
    literature_search: row('literature-search', { query: string, source: { const: 'crossref' }, retrievedAt: string, coverage: { const: 'metadata-only' }, items: array(object({ doi: string, title: string, authors: strings, date: array(integer), journal: string, url: string, fullTextRead: { const: false }, source: { const: 'crossref' } })) }),
    literature_discover: DISCOVERY_OUTPUT_SCHEMA,
    project_inspect: object({
        textCorpus: object({ enabled: boolean, version: integer, corpusId: nullableString, sources: array(corpusSource), method: string, parserVersion: string, limits: object({ files: integer, fileBytes: integer, totalBytes: integer, chunks: integer }), networkCalls: { const: 0 }, modelCalls: { const: 0 } }),
        project: object({ id: string, name: string }), experiments: array(object({ id: string, title: string, lifecycle: enumeration('provisional', 'frozen', 'archived'), revision: integer }, ['revision'])),
        runs: array(object({ id: string, state: CORE_OUTPUT_SCHEMAS.run_submit.properties.state, integrity: CORE_OUTPUT_SCHEMAS.run_submit.properties.integrity, evidenceIds: strings })), evidenceIds: strings
    }),
    text_evidence_search: row('text-evidence-search', {
        query: string, limit: integer, mmrLambda: number, deduplicateExact: boolean, artifactIds: strings, corpusId: string, configurationVersion: integer, method: string, status: enumeration('matches', 'no_lexical_match'),
        hits: array(object({ ...chunkSource.properties, chunkId: string, quote: string, alternativeSources: array(chunkSource), score: number, evidenceId: string, sourceKind: { const: 'user_imported_text' }, offsetUnit: { const: 'utf16-code-unit' }, page: { type: 'null' } })),
        coverage: object({ sourceCount: integer, totalChunks: integer, matchingChunks: integer, exactDuplicatesGrouped: integer, uniqueChunks: integer, candidatesConsidered: integer, candidateLimitReached: boolean, resultsTruncated: boolean }),
        usage: object({ modelCalls: { const: 0 }, networkCalls: { const: 0 } }), limitations: strings
    }),
    campaign_enroll: member,
    campaign_decision_submit: decision,
    campaign_inspect: object({
        campaign: row('campaign', {
            goal: string, rootSessionId: string, rootModel: object({ provider: string, model: string, thinking: enumeration('off', 'minimal', 'low', 'medium', 'high', 'xhigh') }), baselineExperimentId: string, focusExperimentId: string, contractDigest: string, primaryMetric: string, direction: enumeration('min', 'max'), state: enumeration('draft', 'active', 'paused', 'stopped'), currentRoundId: string, roundNumber: integer,
            limits: object({ maxRounds: integer, maxCandidatesPerRound: integer, maxUnansweredRunsPerNode: integer, maxConsecutiveRegressions: integer, maxAnalysisAttempts: integer, deadline: string }, ['deadline']),
            autoAnalyze: boolean, approvalId: string, planDigest: string, consecutiveRegressions: integer, stopReason: string
        }, ['stopReason']),
        members: array(member), rounds: array(row('research-round', { campaignId: string, number: integer, parentExperimentId: string, state: enumeration('open', 'closed'), decisionId: string, parentSource: PLAN_SOURCE_SCHEMA }, ['decisionId', 'parentSource'])), plans: array(EXPERIMENT_PLAN_SCHEMA), candidates: array(RESEARCH_CANDIDATE_SCHEMA),
        observations: array(row('run-observation', { campaignId: string, roundId: string, memberId: string, runId: string, experimentId: string, manifestDigest: string, contentDigest: string, executionState: CORE_OUTPUT_SCHEMAS.run_submit.properties.state, integrity: CORE_OUTPUT_SCHEMAS.run_submit.properties.integrity, metrics: { type: 'object', additionalProperties: number }, evidenceIds: strings, validation: enumeration('verified', 'incomplete', 'invalid'), explanation: string, status: enumeration('pending', 'decided'), decisionId: string }, ['decisionId'])), decisions: array(decision)
    }, ['plans', 'candidates'])
};
export { string, number, integer, boolean, nullableString, strings, enumeration, array, object, row, nullable };
//# sourceMappingURL=outputs.js.map