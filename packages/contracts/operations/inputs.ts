import {FORMAL_REPORT_INPUT_SCHEMAS,FORMAL_REPORT_ASSESSMENT_SCHEMA} from './formal-report-review-schemas.js';
import {RESEARCH_ACTION_INPUT_SCHEMAS} from './research-action-schemas.js';
import {METHOD_INPUT_SCHEMAS} from './method-contract-schemas.js';
import {EXECUTION_ENVIRONMENT_INPUT_SCHEMAS,GPU_SCHEMA,LOCAL_RUNTIME_SCHEMA,LOCAL_EXECUTION_SCHEMA,GPU_TARGET_SCHEMA} from './execution-environment-schemas.js';
import {HOST_EXECUTION_INPUT_SCHEMA} from './host-access-schemas.js';
import {RESEARCH_BRIEF_INPUT_SCHEMAS} from './research-brief-schemas.js';
import {SESSION_HISTORY_INPUT_SCHEMAS} from './session-schemas.js';
import {PUBLICATION_INPUT_SCHEMAS} from './publication-schemas.js';
import {RESEARCH_PLAN_INPUT_SCHEMAS,EXPERIMENT_PLAN_INPUT_SCHEMA,RESEARCH_CANDIDATE_INPUT_SCHEMA} from './research-plan-schemas.js';
import {SKILL_INPUT_SCHEMAS} from './skill-schemas.js';
import {DOCUMENT_INPUT_SCHEMAS,DISCOVERY_INPUT_SCHEMA} from './document-schemas.js';
import {GIT_INPUT_SCHEMAS} from './git-schemas.js';
import {REPORT_INPUT_SCHEMAS} from './report-schemas.js';
import {SCHEDULER_INPUT_SCHEMAS} from './scheduler-schemas.js';
import {REVIEW_INPUT_SCHEMAS} from './review-schemas.js';
import {DEVELOPMENT_INPUT_SCHEMAS} from './development-schemas.js';
import {WORKING_GRANT_INPUT_SCHEMAS} from './working-grant-schemas.js';
import {RUN_GRANT_INPUT_SCHEMAS} from './run-grant-schemas.js';
import {DISCOVERY_GRANT_INPUT_SCHEMAS} from './discovery-grant-schemas.js';
import {SOURCE_INPUT_SCHEMAS} from './source-schemas.js';
import { s, type JsonSchema, type InferSchema } from './schema.js';
import {DEVELOPMENT_ASSESSMENT_SCHEMA} from './development-assessment-schemas.js';

const id = s.string(100), version = s.integer(1), cursor = s.nullable(s.integer(0)), source = s.nullable(s.enum(['session', 'project']));
const strings = (max = 100) => s.array(s.string(1000), max);
const sources = s.enum(['alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref']);
const campaignLimits = s.object({ maxRounds: s.integer(1, 20), maxCandidatesPerRound: s.integer(1, 24), maxUnansweredRunsPerNode: s.integer(1, 5), maxConsecutiveRegressions: s.integer(1, 10), maxAnalysisAttempts: s.integer(0, 100), deadline: s.string(80) });
const config = { type: 'object', additionalProperties: s.json('Experiment-specific configuration values; arbitrary keys and nested JSON are intentional because each runner owns its configuration contract.'), description: 'Runner-specific experiment configuration; schema validation does not apply defaults or coerce values.' } as const;
const contract = s.object({
    runner: s.enum(['trusted-example', 'local', 'docker', 'ssh']), sshTargetId: id, image: s.string(250), command: s.array({...s.string(1000,0),pattern:'^[^\u0000]*$'}, 30, 1),
    localRuntimeId:id,gpu:GPU_SCHEMA,
    environment: s.object({}),
    datasetVersion: s.string(200), evaluationProtocolVersion: s.string(200),
    metrics: { type: 'object', minProperties: 1, propertyNames: s.string(80), additionalProperties: s.object({ unit: s.string(100), direction: s.enum(['min', 'max']) }, ['unit', 'direction']) },
    expectedArtifacts: strings(30), timeoutSeconds: s.nullable(s.integer(1, 86400)), cpus: s.nullable(s.integer(1, 64)), memoryMb: s.nullable(s.integer(64, 65536)),
    dockerContext:{...s.string(100),pattern:'^[A-Za-z0-9][A-Za-z0-9_.-]*$'},pids:s.integer(16,512),workMb:s.integer(16,1024),logBytes:s.integer(1,16*1024*1024),outputBytes:s.integer(1,128*1024*1024),networkPolicy:{enum:['none','host']},
}, ['runner', 'command', 'datasetVersion', 'evaluationProtocolVersion', 'metrics', 'expectedArtifacts']);
const output = s.object({
    kind: s.enum(['report', 'dataset', 'patch', 'analysis', 'review', 'code', 'text']),
    schemaId: s.enum(['report', 'text', 'csv', 'json', 'patch', 'code', 'review']),
    required: s.nullable(s.boolean()), minBytes: s.nullable(s.integer(1, 32 * 1024 * 1024)), title: s.string(200), mediaType: s.string(100),
}, ['kind', 'schemaId']);
const task = s.object({
    thinking:s.string(64),thinkingReason:s.string(1000),
    key: { ...s.string(60), pattern: '^[a-zA-Z0-9_-]+$' },
    role: s.enum(['literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer']),
    objective: s.string(), dependencies: s.nullable(strings(24)), critical: s.boolean(), required: s.boolean(), inputEvidenceIds: s.nullable(strings()),
    skillIds:s.array(id,32), reviewOf: s.string(60), expectedOutputs: s.array(output, 24),
    acceptanceRuleIds: s.nullable(s.array(s.enum(['artifact-required', 'evidence-required', 'claims-evidenced']), 10)),
}, ['key', 'role', 'objective']);
const plan = s.object({ goal: s.string(8000), tasks: s.array(task, 24, 1), budget: s.nullable(s.integer(1, 100)), autoSummarize: s.nullable(s.boolean()) }, ['goal', 'tasks']);
const candidate = RESEARCH_CANDIDATE_INPUT_SCHEMA;

/** Shape/primitive validation is shared; permissions, filesystem checks and state-dependent limits stay in services. */
export const INPUT_SCHEMAS = {
    ...METHOD_INPUT_SCHEMAS,
    ...RESEARCH_ACTION_INPUT_SCHEMAS,
    ...EXECUTION_ENVIRONMENT_INPUT_SCHEMAS,
    research_task_checkpoint:s.object({state:s.enum(['completed','waiting','needs_attention']),summary:s.string(4000),runIds:s.array(id,30),developmentJobIds:s.array(id,30)}),
    host_execute:HOST_EXECUTION_INPUT_SCHEMA,
    ...RESEARCH_BRIEF_INPUT_SCHEMAS,
    ...RESEARCH_PLAN_INPUT_SCHEMAS,
    ...SKILL_INPUT_SCHEMAS,
    ...PUBLICATION_INPUT_SCHEMAS,
    ...DEVELOPMENT_INPUT_SCHEMAS, ...WORKING_GRANT_INPUT_SCHEMAS, ...RUN_GRANT_INPUT_SCHEMAS, ...DISCOVERY_GRANT_INPUT_SCHEMAS, ...GIT_INPUT_SCHEMAS, ...REVIEW_INPUT_SCHEMAS, ...FORMAL_REPORT_INPUT_SCHEMAS, ...REPORT_INPUT_SCHEMAS,...SCHEDULER_INPUT_SCHEMAS, ...SESSION_HISTORY_INPUT_SCHEMAS,
    ...SOURCE_INPUT_SCHEMAS,...DOCUMENT_INPUT_SCHEMAS,
    research_skill_list: s.object({}),
    research_skill_read: s.object({ skillId: id, resource: s.string(200) }, ['skillId']),
    connector_status: s.object({}),
    literature_discover: DISCOVERY_INPUT_SCHEMA,
    paper_read: s.object({ id: s.string(300), source: sources }, ['id']),
    campaign_prepare: s.object({ goal: s.string(8000), baselineExperimentId: id, primaryMetric: s.string(100), limits: campaignLimits, autoAnalyze: s.boolean() }, ['goal', 'baselineExperimentId']),
    campaign_inspect: s.object({ campaignId: id }, ['campaignId']),
    campaign_enroll: s.object({ campaignId: id, intentId: id, expectedVersion: version, required: s.nullable(s.boolean()), repairDecisionId: id }, ['campaignId', 'intentId', 'expectedVersion']),
    campaign_decision_submit: s.object({ campaignId: id, expectedVersion: version, action: s.enum(['repair', 'refill', 'promote', 'stop']), observationIds: { ...strings(), minItems: 1, uniqueItems: true }, reason: s.string(8000), selectedRunId: id, candidates: s.nullable(s.array(candidate, 24)),experimentPlan:EXPERIMENT_PLAN_INPUT_SCHEMA }, ['campaignId', 'expectedVersion', 'action', 'observationIds', 'reason']),
    change_proposal_prepare: s.object({ testJobId: id, baseExperimentId: id, expectedRevision: version, title: s.string(200), hypothesis: s.string(), changes: s.array(s.object({ path: s.string(1000), artifactId: s.nullable(id), expectedDigest: s.nullable(s.string(64)) }, ['path', 'artifactId', 'expectedDigest']), 50, 1) }, ['baseExperimentId', 'expectedRevision', 'title', 'hypothesis', 'changes']),
    reviewed_change_prepare:s.object({reviewId:id,title:s.string(200),hypothesis:s.string()},['reviewId','title','hypothesis']),
    artifact_read: s.object({ artifactId: id, cursor: s.nullable(s.integer(0, 16 * 1024 * 1024)) }, ['artifactId']),
    session_action_execute: s.object({actionId:id},['actionId']),
    session_action_resume: s.object({}),
    session_action_inspect: s.object({actionId:id},['actionId']),
    session_notice_read: s.object({ messageId: id, cursor: s.nullable(s.integer(0, Number.MAX_SAFE_INTEGER)) }, ['messageId']),
    project_inspect: s.object({runIntentId:id,githubCommit:{...s.string(40,40),pattern:'^[0-9a-f]{40}$'}}),
    workspace_list: s.object({ source }),
    text_evidence_search: s.object({ query: s.string(1000), artifactIds: strings(30),
        pmcDocuments:s.array(s.object({documentVersionId:id},['documentVersionId']),30),
        documents: s.array(s.object({ documentVersionId: id, parseResultId: id }, ['documentVersionId', 'parseResultId']), 30),
        corpusId: id, configurationVersion: s.integer(0), limit: s.nullable(s.integer(1, 10)),
        mmrLambda: s.number(0, 1), deduplicateExact: s.nullable(s.boolean()) }, ['query']),
    text_corpus_grant_prepare:s.object({sessionId:id,documents:s.array(s.object({documentVersionId:id,parseResultId:id},['documentVersionId','parseResultId']),30),pmcDocuments:s.array(s.object({documentVersionId:id},['documentVersionId']),1),corpusId:id,configurationVersion:s.integer(0),maxSearches:s.integer(1,2),expiresAt:s.string(50)},['sessionId','documents','corpusId','configurationVersion','maxSearches','expiresAt']),
    text_corpus_grant_inspect:s.object({grantId:id},['grantId']),
    text_corpus_grant_activate:s.object({grantId:id,expectedVersion:s.integer(1)},['grantId','expectedVersion']),
    text_corpus_grant_revoke:s.object({grantId:id,expectedVersion:s.integer(1)},['grantId','expectedVersion']),
    workspace_read: s.object({ path: s.string(1000), source }, ['path']),
    workspace_write: s.object({ path: s.string(1000), content: s.string(2 * 1024 * 1024, 0), expectedDigest: s.nullable(s.string(64)), source: { ...source, description: 'Project writes require a user actor; agents can write only their session workspace.' } }, ['path', 'content', 'expectedDigest']),
    evidence_read: s.object({ evidenceId: id }, ['evidenceId']),
    evidence_register: {...s.object({artifactId:id,exactQuote:s.string(16000),start:s.integer(0),end:s.integer(1),description:s.string(2000)},['artifactId']),anyOf:[s.object({artifactId:id,exactQuote:s.string(16000),start:s.integer(0),end:s.integer(1)},['artifactId','exactQuote']),s.object({ artifactId: id, start: s.integer(0), end: s.integer(1), description: s.string(2000) }, ['artifactId', 'start', 'end', 'description'])]},
    artifact_create: s.object({ title: s.string(200), content: s.string(2 * 1024 * 1024, 0), mediaType: s.nullable(s.string(100)) }, ['title', 'content']),
    literature_search: s.object({ query: s.string(500), limit: s.nullable(s.integer(1, 20)) }, ['query']),
    experiment_plan_submit: s.object({ title: s.string(200), hypothesis: s.nullable(s.string()), parentId: s.nullable(s.string()), expectedParentRevision:s.integer(1), repair:s.object({runId:id,jobId:id,reviewId:id},['runId','jobId']), config, contract: s.nullable(contract) }, ['title']),
    run_prepare: s.object({ experimentId: id, autoAnalyze:s.boolean() }, ['experimentId']),
    run_submit: s.object({ intentId: id }, ['intentId']),
    run_inspect: s.object({ runId: id, includeScheduling: s.boolean() }, ['runId']),
    run_list: s.object({ cursor: s.integer(0, Number.MAX_SAFE_INTEGER), limit: s.integer(1, 100) }),
    research_history_list: s.object({ kind: s.enum(['documents', 'evidence', 'claims', 'reports']), cursor: s.integer(0, Number.MAX_SAFE_INTEGER), limit: s.integer(1, 100) }, ['kind']),
    run_logs: s.object({ runId: id, cursor:s.nullable(s.integer(0,Number.MAX_SAFE_INTEGER)),stream:s.enum(['stdout','stderr']),identity:s.nullable(s.string(100)) }, ['runId']),
    run_source_list:s.object({runId:id},['runId']),
    run_source_read:s.object({runId:id,path:s.string(1000),cursor:s.integer(0),limit:s.integer(1,64000)},['runId','path']),
    approval_request: s.object({}),
    collaboration_plan_submit: plan,
    agent_delegate: plan,
    task_inspect: s.object({ teamId: id }),
    task_result_read: s.object({ taskId: id }, ['taskId']),
    task_context_read: s.object({}),
    task_progress_report: s.object({ message: s.string(2000) }, ['message']),
    task_result_submit: s.object({ formalReportAssessment:FORMAL_REPORT_ASSESSMENT_SCHEMA,developmentAssessment:DEVELOPMENT_ASSESSMENT_SCHEMA,summary: s.string(16000), outcome: s.enum(['completed', 'partial', 'blocked']), evidenceIds: s.nullable(strings()), artifactIds: s.nullable(strings()), claims: s.nullable(s.array(s.object({ statement: s.string(8000), evidenceIds: strings(), limitations: s.nullable(strings(30)) }, ['statement', 'evidenceIds']), 24)), unresolvedQuestions: s.nullable(strings(30)), verdict: s.enum(['accept', 'reject', 'disputed']) }, ['summary', 'outcome']),
} as const satisfies Record<string, JsonSchema>;

export type OperationInput<N extends keyof typeof INPUT_SCHEMAS> = InferSchema<(typeof INPUT_SCHEMAS)[N]>;
