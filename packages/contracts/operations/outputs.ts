import {EXECUTION_ENVIRONMENT_OUTPUT_SCHEMAS,GPU_SCHEMA,LOCAL_RUNTIME_SCHEMA,LOCAL_EXECUTION_SCHEMA,GPU_TARGET_SCHEMA} from './execution-environment-schemas.js';
import {HOST_EXECUTION_OUTPUT_SCHEMA} from './host-access-schemas.js';
import {RESEARCH_BRIEF_OUTPUT_SCHEMAS} from './research-brief-schemas.js';
import {SESSION_HISTORY_OUTPUT_SCHEMAS} from './session-schemas.js';
import {PUBLICATION_OUTPUT_SCHEMAS} from './publication-schemas.js';
import {RESEARCH_PLAN_OUTPUT_SCHEMAS,EXPERIMENT_PLAN_SCHEMA,RESEARCH_CANDIDATE_SCHEMA,PLAN_SOURCE_SCHEMA} from './research-plan-schemas.js';
import {SKILL_OUTPUT_SCHEMAS,SKILL_REQUIREMENTS_SCHEMA} from './skill-schemas.js';
import {DOCUMENT_OUTPUT_SCHEMAS,DOCUMENT_EVIDENCE_LINK_SCHEMA,DISCOVERY_OUTPUT_SCHEMA} from './document-schemas.js';
import {GIT_OUTPUT_SCHEMAS} from './git-schemas.js';
import {REPORT_OUTPUT_SCHEMAS} from './report-schemas.js';
import {SCHEDULER_OUTPUT_SCHEMAS} from './scheduler-schemas.js';
import {REVIEW_OUTPUT_SCHEMAS} from './review-schemas.js';
import {DEVELOPMENT_OUTPUT_SCHEMAS} from './development-schemas.js';
import {WORKING_GRANT_OUTPUT_SCHEMAS,WORKING_GRANT_REFERENCE_SCHEMA} from './working-grant-schemas.js';
import {RUN_GRANT_OUTPUT_SCHEMAS,RUN_GRANT_REFERENCE_SCHEMA} from './run-grant-schemas.js';
import {DISCOVERY_GRANT_OUTPUT_SCHEMAS} from './discovery-grant-schemas.js';
import {DISCOVERY_GRANT_REFERENCE_SCHEMA} from './document-schemas.js';
import { SOURCE_OUTPUT_SCHEMAS } from './source-schemas.js';
import type { InferSchema, JsonSchema } from './schema.js';

const string = { type: 'string' } as const;
const number = { type: 'number' } as const;
const integer = { type: 'integer' } as const;
const boolean = { type: 'boolean' } as const;
const nullableString = { anyOf: [string, { type: 'null' }] } as const;
const strings = { type: 'array', items: string } as const;
const enumeration = <const V extends string[]>(...values: V) => ({ type: 'string', enum: values } as const);
const array = <const I extends JsonSchema>(items: I) => ({ type: 'array', items } as const);
const object = <const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = []>(properties: P, optional?: O) => ({
    type: 'object', properties, required: Object.keys(properties).filter(key => !optional?.includes(key)) as Exclude<keyof P & string, O[number]>[], additionalProperties: false
} as const);
const row = <const K extends string, const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = []>(kind: K, properties: P, optional?: O) => object({
    id: string, kind: { const: kind }, projectId: nullableString, version: integer, createdAt: string, updatedAt: string,
    ...properties
}, optional);
const queueItem = SCHEDULER_OUTPUT_SCHEMAS.compute_queue_inspect.properties.items.items.properties;
const runScheduling = object({observedAt:string,queue:{anyOf:[object({state:queueItem.state,held:queueItem.held,backend:queueItem.backend,targetId:queueItem.targetId,requested:queueItem.requested,nextAttemptAt:queueItem.nextAttemptAt,reason:queueItem.reason}),{type:'null'}]},unavailableReason:enumeration('terminal','not_recorded')},['unavailableReason']);

const sourceFile = object({ path: string, size: integer, digest: string,mode:enumeration('100644','100755') },['mode']);
const snapshot = object({ digest: string, path: string, files: array(sourceFile) });
const contract = object({
    localRuntimeId:string,gpu:GPU_SCHEMA,
    command: strings,
    environment: { type: 'object', additionalProperties: string },
    datasetVersion: string, evaluationProtocolVersion: string,
    metrics: { type: 'object', additionalProperties: object({ unit: string, direction: enumeration('min', 'max') }) },
    expectedArtifacts: strings, timeoutSeconds: integer, runner: enumeration('trusted-example', 'local', 'docker', 'ssh'),
    sshTargetId:string,image: string, cpus: integer, memoryMb: integer,dockerContext:string,pids:integer,workMb:integer,logBytes:integer,outputBytes:integer,networkPolicy:{enum:['none','host']}
}, ['localRuntimeId','gpu','sshTargetId','image','dockerContext','pids','workMb','logBytes','outputBytes','networkPolicy']);
const sshTarget=object({id:string,version:integer,hostKeyDigest:string,configDigest:string,engineId:string,protocolDigest:string,targetId:string,gpuProtocol:boolean},['gpuProtocol']);
const researchBriefRef=object({id:string,digest:string,revision:integer,rootSessionId:string});
const runAnalysis=object({rootSessionId:string,model:object({provider:string,model:string,thinking:enumeration('off','minimal','low','medium','high','xhigh')}),maxAttempts:{const:1}});
const manifest = object({
    localRuntime:LOCAL_RUNTIME_SCHEMA,localExecution:LOCAL_EXECUTION_SCHEMA,gpuTarget:GPU_TARGET_SCHEMA,
    analysis:runAnalysis,
    researchBrief:researchBriefRef,
    experimentId: string, experimentVersion: integer, experimentRevision: integer,
    contract, contractDigest: string, snapshotDigest: string, snapshotPath: string,
    sourceFiles: array(sourceFile), createdAt: string,sourceRevisionId:string,gitCommit:string,sshTarget
},['localRuntime','localExecution','gpuTarget','sourceRevisionId','gitCommit','sshTarget','researchBrief','analysis']);
const runnerExecution=object({backend:enumeration('local','docker','ssh'),sshHandle:string,dockerContext:string,containerName:string,containerId:string,imageId:string,controlDir:string,generation:integer,leaseUntil:number,startRequested:boolean,recoveryCount:integer,logTruncated:boolean,logsIncomplete:boolean,outputExceeded:boolean},['sshHandle','containerId','imageId','logTruncated','logsIncomplete','outputExceeded']);
const taskResult = object({
    summary: string, outcome: enumeration('completed', 'partial', 'blocked'), evidenceIds: strings, artifactIds: strings,
    claims: array(object({ statement: string, evidenceIds: strings, limitations: strings })),
    unresolvedQuestions: strings, verdict: enumeration('accept', 'reject', 'disputed')
}, ['verdict']);
const campaign = row('campaign', {
    goal: string, rootSessionId: string, rootModel: object({ provider: string, model: string, thinking: enumeration('off', 'minimal', 'low', 'medium', 'high', 'xhigh') }), baselineExperimentId: string, focusExperimentId: string, contractDigest: string, primaryMetric: string, direction: enumeration('min', 'max'), state: enumeration('draft', 'active', 'paused', 'stopped'), currentRoundId: string, roundNumber: integer,
    limits: object({ maxRounds: integer, maxCandidatesPerRound: integer, maxUnansweredRunsPerNode: integer, maxConsecutiveRegressions: integer, maxAnalysisAttempts: integer, deadline: string }, ['deadline']),
    autoAnalyze: boolean, approvalId: string, planDigest: string, consecutiveRegressions: integer, stopReason: string
}, ['stopReason']);

/** Success payloads are the existing service records, including durable replay fields. */
const CORE_OUTPUT_SCHEMAS = {
    ...EXECUTION_ENVIRONMENT_OUTPUT_SCHEMAS,
    run_prepare: row('run-intent', {
        experimentId: string, manifest, manifestDigest: string, approvalId: string,
        status: enumeration('prepared', 'submitted'), runId: string,runGrant:RUN_GRANT_REFERENCE_SCHEMA,rootSessionId:string
    }, ['runId','runGrant','rootSessionId']),
    run_submit: row('run', {
        experimentId: string, intentId: string, manifest, manifestDigest: string,
        state: enumeration('queued', 'submitting', 'running', 'cancelling', 'succeeded', 'failed', 'cancelled', 'unknown'),
        integrity: enumeration('pending', 'complete', 'incomplete', 'invalid'),
        judgment: enumeration('pending', 'supported', 'not_supported', 'inconclusive'),
        answerDisposition: enumeration('answered', 'unanswered', 'needs_review'), answerReviewId: string,
        outputDir: string, supervisorPid: integer, childPid: integer, heartbeat: number, startedAt: string, endedAt: string,
        exitCode: { anyOf: [integer, { type: 'null' }] }, cancelRequested: boolean,
        metrics: { type: 'object', additionalProperties: number }, error: string, artifactIds: strings, evidenceIds: strings,execution:runnerExecution,runGrant:RUN_GRANT_REFERENCE_SCHEMA,startRequested:boolean
    }, ['answerDisposition', 'answerReviewId', 'supervisorPid', 'childPid', 'heartbeat', 'startedAt', 'endedAt', 'exitCode', 'metrics', 'error','execution','runGrant','startRequested']),
    run_list: object({
        items: array(object({
            id: string, projectId: string, experimentId: string, intentId: string,
            state: enumeration('queued', 'submitting', 'running', 'cancelling', 'succeeded', 'failed', 'cancelled', 'unknown'),
            integrity: enumeration('pending', 'complete', 'incomplete', 'invalid'),
            judgment: enumeration('pending', 'supported', 'not_supported', 'inconclusive'),
            manifestDigest: string, createdAt: string, updatedAt: string, startedAt: string, endedAt: string,
            metrics: { type: 'object', additionalProperties: number }
        }, ['startedAt', 'endedAt', 'metrics'])),
        cursor: integer, hasMore: boolean
    }),
    workspace_read: object({ path: string, content: string, digest: string, size: integer }),
    workspace_write: object({ path: string, digest: string, size: integer }),
    change_proposal_prepare: row('change-proposal', {
        baseExperimentId: string, baseRevision: integer, baseSnapshot: snapshot, contractDigest: string,
        title: string, hypothesis: string, rootSessionId: string,
        changes: array(object({
            path: string, expectedDigest: nullableString, artifactId: nullableString, artifactDigest: nullableString,
            taskId: string, taskResultDigest: string, sourceAcceptanceId: string,mode:enumeration('100644','100755'),beforeMode:enumeration('100644','100755')
        }, ['taskId', 'taskResultDigest', 'sourceAcceptanceId','mode','beforeMode'])),
        candidateSnapshot: snapshot, digest: string, approvalId: string, state: enumeration('prepared', 'applied'),
        testsStatus: enumeration('not_run', 'passed'), testJobId: string, appliedExperimentId: string, sourceValidity: enumeration('current', 'stale'), invalidatedBy: string,flow:{const:'reviewed-development'},reviewId:string,reviewAcceptanceId:string
    }, ['rootSessionId','testJobId', 'appliedExperimentId', 'sourceValidity', 'invalidatedBy','flow','reviewId','reviewAcceptanceId']),
    campaign_prepare: campaign,
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
        scopeSessionId: nullableString, scopeAttemptId: nullableString,scopeTaskId:nullableString,reportedVersion:nullableString,resolvedId:string,license:nullableString,
        sourceResponses: array(object({ url: string, contentType: string })), limitations: strings,
        discoveryGrant:DISCOVERY_GRANT_REFERENCE_SCHEMA,discoveryCallIds:strings,discoveryRequestDigest:string
    },['scopeTaskId','reportedVersion','resolvedId','license','discoveryGrant','discoveryCallIds','discoveryRequestDigest'])
} as const satisfies Record<string, JsonSchema>;

const nullable = <const S extends JsonSchema>(schema: S) => ({ anyOf: [schema, { type: 'null' }] } as const);
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
const providerTextLink=object({documentVersionId:string,documentDigest:string,rawDigest:string,textArtifactDigest:string,reportedVersion:string});
const evidence = row('evidence', { type: enumeration('artifact', 'run', 'paper', 'code'), artifactId: string, digest: string, locator, quote: string, description: string, runId: string,document:DOCUMENT_EVIDENCE_LINK_SCHEMA,providerText:providerTextLink }, ['runId','document','providerText']);
const skillSource = object({ repository: string, commit: string, path: string, blob: string });
const member = row('campaign-member', { campaignId: string, roundId: string, experimentId: string, intentId: string, required: boolean, repairDecisionId: string,candidateId:string,repairOfMemberId:string,repairRootMemberId:string }, ['repairDecisionId','candidateId','repairOfMemberId','repairRootMemberId']);
const decision = row('campaign-decision', {
    campaignId: string, roundId: string, action: enumeration('repair', 'refill', 'promote', 'stop'), reason: string, observationIds: strings, selectedRunId: string,
    // Candidate configuration is an explicitly user-defined JSON object in DecisionService.
    candidates: array(object({ title: string, hypothesis: string, config: { type: 'object', additionalProperties: {} },implementation:enumeration('config','reviewed-code') },['config','implementation'])),
    inputDigest: string, approvalId: string, decisionDigest: string, status: enumeration('proposed', 'applied'), appliedAt: string,
    effects: object({ experimentIds: strings, intentIds: strings, roundId: string, stopped: boolean,candidateIds:strings },['candidateIds']),planRevisionId:string,planDigest:string
}, ['selectedRunId', 'appliedAt', 'effects','planRevisionId','planDigest']);
const corpusSource = object({ artifactId: string, digest: string, title: string, size: integer });
const documentPair = object({ documentVersionId: string, parseResultId: string });
const corpusDocument = object({ documentVersionId: string, parseResultId: string, title: string, pageCount: integer });
const pmcDocument=object({documentVersionId:string,title:string,reportedVersion:string});
const pmcPair=object({documentVersionId:string});
const chunkSource = object({ artifactId: string, digest: string, title: string, locator, lineStart: integer, lineEnd: integer });
const nullableDocumentLink = { anyOf: [DOCUMENT_EVIDENCE_LINK_SCHEMA, { type: 'null' }] } as const;
const nullablePage = { anyOf: [integer, { type: 'null' }] } as const;
const searchSource = object({ ...chunkSource.properties, sourceKind: enumeration('user_imported_text', 'document_page','pmc_oa_text'),
    page: nullablePage, document: nullableDocumentLink, evidenceId: nullableString,providerText:providerTextLink }, ['sourceKind', 'page', 'document', 'evidenceId','providerText']);
const searchHit = object({ ...chunkSource.properties, chunkId: string, quote: string, alternativeSources: array(searchSource), score: number,
    evidenceId: string, sourceKind: enumeration('user_imported_text', 'document_page','pmc_oa_text'), offsetUnit: { const: 'utf16-code-unit' },
    page: nullablePage, document: nullableDocumentLink,providerText:providerTextLink }, ['sourceKind', 'offsetUnit', 'page', 'document','providerText']);
const textCorpusGrantReference=object({id:string,digest:string,approvalId:string});
const textEvidenceSearch=row('text-evidence-search', {
    query:string,limit:integer,mmrLambda:number,deduplicateExact:boolean,artifactIds:strings,documents:array(documentPair),pmcDocuments:array(pmcPair),corpusId:string,configurationVersion:integer,method:string,status:enumeration('matches','no_lexical_match'),textCorpusGrant:textCorpusGrantReference,
    hits:array(searchHit),coverage:object({sourceCount:integer,totalChunks:integer,matchingChunks:integer,exactDuplicatesGrouped:integer,uniqueChunks:integer,candidatesConsidered:integer,candidateLimitReached:boolean,resultsTruncated:boolean}),usage:object({modelCalls:{const:0},networkCalls:{const:0}}),limitations:strings
},['documents','textCorpusGrant','pmcDocuments']);
const textCorpusGrant=row('text-corpus-grant',{
    sessionId:string,model:object({provider:string,model:string,thinking:enumeration('off','minimal','low','medium','high','xhigh')}),corpusId:string,configurationVersion:integer,
    documents:array(object({documentVersionId:string,parseResultId:string,sourceDigest:string})),pmcDocuments:array(object({documentVersionId:string,sourceDigest:string})),maxSearches:integer,expiresAt:string,approvalId:string,digest:string,state:enumeration('draft','active','revoked'),activatedAt:string,revokedAt:string,
    effectiveState:enumeration('draft','active','revoked','stale','expired','exhausted'),validity:enumeration('current','stale'),reasons:strings,usage:object({limit:integer,used:integer,remaining:integer,unit:{const:'search'}}),
    uses:array(row('text-corpus-grant-use',{grantId:string,grantDigest:string,sessionId:string,requestDigest:string,searchId:string})),searchResults:array(textEvidenceSearch)
},['activatedAt','revokedAt','pmcDocuments']);
const contextTask = object({ id: string, key: string, result: taskResult }, ['result']);
const artifact = row('artifact', { title: string, digest: string, size: integer, path: string, mediaType: string, origin: string, wakeupId: string, runId: string, taskId: string,discoveryGrant:DISCOVERY_GRANT_REFERENCE_SCHEMA }, ['wakeupId', 'runId', 'taskId','discoveryGrant']);

/** All public tool success bodies. Fixed records are closed; only named service-owned dictionaries are open. */
export const OUTPUT_SCHEMAS = {
    host_execute:HOST_EXECUTION_OUTPUT_SCHEMA,
    ...RESEARCH_BRIEF_OUTPUT_SCHEMAS,
    text_corpus_grant_prepare:textCorpusGrant,text_corpus_grant_inspect:textCorpusGrant,text_corpus_grant_activate:textCorpusGrant,text_corpus_grant_revoke:textCorpusGrant,
    ...RESEARCH_PLAN_OUTPUT_SCHEMAS,
    ...SKILL_OUTPUT_SCHEMAS,
    ...PUBLICATION_OUTPUT_SCHEMAS,
    ...DEVELOPMENT_OUTPUT_SCHEMAS, ...WORKING_GRANT_OUTPUT_SCHEMAS, ...RUN_GRANT_OUTPUT_SCHEMAS, ...DISCOVERY_GRANT_OUTPUT_SCHEMAS, ...GIT_OUTPUT_SCHEMAS, ...REVIEW_OUTPUT_SCHEMAS, ...REPORT_OUTPUT_SCHEMAS,...SCHEDULER_OUTPUT_SCHEMAS, ...SESSION_HISTORY_OUTPUT_SCHEMAS,
    ...CORE_OUTPUT_SCHEMAS,
    ...SOURCE_OUTPUT_SCHEMAS,...DOCUMENT_OUTPUT_SCHEMAS,
    run_inspect: {...CORE_OUTPUT_SCHEMAS.run_submit,properties:{...CORE_OUTPUT_SCHEMAS.run_submit.properties,scheduling:runScheduling}},
    reviewed_change_prepare:CORE_OUTPUT_SCHEMAS.change_proposal_prepare,
    workspace_list: array(object({ path: string, size: integer, digest: string }, ['digest'])),
    artifact_read: object({ artifactId: string, digest: string, title: string, mediaType: string, content: string, cursor: integer, complete: boolean }),
    artifact_create: artifact,
    report_create:artifact,
    report_export:artifact,
    evidence_register: evidence,
    evidence_read: evidence,
    session_notice_read: object({ messageId: string, content: string, cursor: integer, complete: boolean }),
    run_logs: object({ content: string, cursor: integer, complete: boolean,start:integer,size:integer,identity:nullableString }),
    run_source_list:object({runId:string,experimentId:string,revision:integer,sourceDigest:string,gitCommit:string,files:array(sourceFile)},['gitCommit']),
    run_source_read:object({runId:string,experimentId:string,revision:integer,sourceDigest:string,gitCommit:string,path:string,size:integer,digest:string,mode:enumeration('100644','100755'),cursor:integer,end:integer,complete:boolean,content:string},['gitCommit','mode']),
    approval_request: array(row('approval', { subjectKind: string, subjectId: string, digest: string, scope: string, status: enumeration('pending', 'approved', 'rejected', 'stale'), reason: string, decidedAt: string,workingGrant:WORKING_GRANT_REFERENCE_SCHEMA,runGrant:RUN_GRANT_REFERENCE_SCHEMA }, ['decidedAt','workingGrant','runGrant'])),
    experiment_plan_submit: row('experiment', {researchBrief:researchBriefRef, title: string, hypothesis: string, parentId: nullableString, lifecycle: enumeration('provisional', 'frozen', 'archived'), changeProposalId: string, contract, contractDigest: string, workspace: string, notes: strings, revision: integer }, ['changeProposalId','researchBrief']),
    collaboration_plan_submit: team,
    agent_delegate: team,
    task_inspect: array(row('task', {
        key: string, role, objective: string, dependencies: strings, critical: boolean, reviewOf: string, required: boolean, inputEvidenceIds: strings, expectedOutputs: array(expectedOutput), acceptanceRuleIds: strings,
        teamId: string, sessionId: string, discoveryGrantId:string,runGrantId:string, execution, acceptance, planVersion: integer, directiveVersion: integer, attemptCount: integer, generation: integer, attemptId: string, blockReason: string, result: taskResult,reviewId:string,publicationReviewId:string,skillIds:strings
    }, ['critical', 'reviewOf', 'required', 'inputEvidenceIds', 'expectedOutputs', 'acceptanceRuleIds', 'sessionId', 'discoveryGrantId','runGrantId', 'attemptId', 'blockReason', 'result','reviewId','publicationReviewId','skillIds'])),
    task_result_read: object({ id: string, key: string, execution, acceptance, result: taskResult }, ['result']),
    task_context_read: nullable(object({ skillBundleId:string,skillIds:strings,discoveryGrant:DISCOVERY_GRANT_REFERENCE_SCHEMA,runGrant:RUN_GRANT_REFERENCE_SCHEMA,runIntentIds:strings,schemaVersion: { const: 1 }, taskId: string, teamId: string, goal: string, objective: string, role, planVersion: integer, directiveVersion: integer, inputEvidenceIds: strings, expectedOutputs: array(expectedOutput), acceptanceRuleIds: strings, upstream: array(contextTask), reviewOf: nullable(contextTask), restrictions: strings, stopConditions: strings, source: object({ snapshotId: string, experimentId: string, revision: integer, sourceDigest: string }),developmentReview:object({reviewId:string,jobId:string,sourceDigest:string,manifestEvidenceId:string,testEvidenceIds:strings}),publicationReview:object({reviewId:string,publicationResultId:string,revisionId:string,jobId:string,sourceDigest:string,pdfDigest:string,digest:string,requiredEvidenceIds:strings,artifactIds:strings}) }, ['source','developmentReview','publicationReview','skillBundleId','skillIds','discoveryGrant','runGrant','runIntentIds'])),
    task_progress_report: object({ seq: integer, id: string, projectId: nullableString, type: { const: 'task.progress' }, payload: object({ sessionId: string, taskId: string, message: string }, ['taskId']), createdAt: string }),
    research_skill_list: object({ bundleId: string,builtinBundleId:string,revisionIds:strings, skills: array(object({ id: string, description: string, digest: string, resources: strings, source: skillSource,revisionId:string,requirements:SKILL_REQUIREMENTS_SCHEMA },['revisionId','requirements'])) },['builtinBundleId','revisionIds']),
    research_skill_read: object({ id: string, resource: string, content: string, digest: string, bundleId: string, source: skillSource }),
    connector_status: object({
        version: integer, enabled: object({ alphaxiv: boolean, openalex: boolean, biorxiv: boolean, pubmed: boolean, crossref: boolean }), requestLimit: integer, requestsUsed: integer,
        credentials: object({ openalexKeyConfigured: boolean, ncbiKeyConfigured: boolean, ncbiEmailConfigured: boolean }),
        capabilities: array(object({ id: string, category: enumeration('literature', 'compute', 'collaboration', 'publication'), operations: strings, implementation: enumeration('http-adapter', 'existing-runner', 'not-implemented', 'existing-service'), verification: enumeration('fixture-only', 'local-example-tested', 'not-live-tested', 'unavailable', 'local-tests'), credential: string, content: string, limitation: string }, ['credential', 'content', 'limitation'])),
        budgetUnit: string, defaults: string,observations:array(object({id:string,source,host:string,status:string,startedAt:string,httpStatus:nullable(integer),retryAfter:nullable(string),error:nullable(string)}))
    }),
    literature_search: row('literature-search', { query: string, source: { const: 'crossref' }, retrievedAt: string, coverage: { const: 'metadata-only' }, items: array(object({ doi: string, title: string, authors: strings, date: array(integer), journal: string, url: string, fullTextRead: { const: false }, source: { const: 'crossref' } })),discoveryGrant:DISCOVERY_GRANT_REFERENCE_SCHEMA,discoveryCallIds:strings,discoveryRequestDigest:string,scopeSessionId:string,scopeTaskId:string,scopeAttemptId:string },['discoveryGrant','discoveryCallIds','discoveryRequestDigest','scopeSessionId','scopeTaskId','scopeAttemptId']),
    literature_discover: DISCOVERY_OUTPUT_SCHEMA,
    project_inspect: object({
        github:object({commit:{...string,pattern:'^[0-9a-f]{40}$'},enabled:boolean,observedAt:string,receipts:{...array(object({jobId:string,operationId:string,ref:string,state:enumeration('queued','creating','uploading','synced','failed','unknown','paused'),errorCode:string,recordedAt:string},['operationId','errorCode'])),maxItems:20},hasMore:boolean}),
        textCorpus: object({ enabled: boolean, version: integer, corpusId: nullableString, sources: array(corpusSource), documents: array(corpusDocument),pmcDocuments:array(pmcDocument), method: string, parserVersion: string, limits: object({ files: integer, fileBytes: integer, totalBytes: integer, chunks: integer }), networkCalls: { const: 0 }, modelCalls: { const: 0 } }, ['documents','pmcDocuments']),
        project: object({ id: string, name: string, collaborationEnabled: boolean }), experiments: array(object({ id: string, title: string, lifecycle: enumeration('provisional', 'frozen', 'archived'), revision: integer }, ['revision'])),
        projectSource: {anyOf:[object({files:array(object({path:string,size:integer})),hasMore:boolean}),{type:'null'}]},
        runs: array(object({ id: string, state: CORE_OUTPUT_SCHEMAS.run_submit.properties.state, integrity: CORE_OUTPUT_SCHEMAS.run_submit.properties.integrity, evidenceIds: strings })), evidenceIds: strings,
        campaigns: array(object({ id: string, goal: string, state: enumeration('draft', 'active', 'paused', 'stopped') })),
        runIntents:object({items:array(object({id:string,experimentId:string,approvalId:string,manifestDigest:string,status:enumeration('prepared','submitted'),approvalStatus:enumeration('pending','approved','rejected','stale','missing'),runId:string,runGrant:RUN_GRANT_REFERENCE_SCHEMA},['runId','runGrant'])),hasMore:boolean})
    },['projectSource','github']),
    text_evidence_search:textEvidenceSearch,
    campaign_enroll: member,
    campaign_decision_submit: decision,
    campaign_inspect: object({
        campaign,
        members: array(member), rounds: array(row('research-round', { campaignId: string, number: integer, parentExperimentId: string, state: enumeration('open', 'closed'), decisionId: string,parentSource:PLAN_SOURCE_SCHEMA }, ['decisionId','parentSource'])),plans:array(EXPERIMENT_PLAN_SCHEMA),candidates:array(RESEARCH_CANDIDATE_SCHEMA),
        observations: array(row('run-observation', { campaignId: string, roundId: string, memberId: string, runId: string, experimentId: string, manifestDigest: string, contentDigest: string, executionState: CORE_OUTPUT_SCHEMAS.run_submit.properties.state, integrity: CORE_OUTPUT_SCHEMAS.run_submit.properties.integrity, metrics: { type: 'object', additionalProperties: number }, evidenceIds: strings, validation: enumeration('verified', 'incomplete', 'invalid'), explanation: string, status: enumeration('pending', 'decided'), decisionId: string }, ['decisionId'])), decisions: array(decision)
    },['plans','candidates'])
} as const satisfies Record<string, JsonSchema>;

export { string, number, integer, boolean, nullableString, strings, enumeration, array, object, row, nullable };

export type OperationOutput<N extends keyof typeof OUTPUT_SCHEMAS> = InferSchema<(typeof OUTPUT_SCHEMAS)[N]>;
