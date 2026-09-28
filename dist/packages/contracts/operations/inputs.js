import { GIT_INPUT_SCHEMAS } from './git-schemas.js';
import { DEVELOPMENT_INPUT_SCHEMAS } from './development-schemas.js';
import { SOURCE_INPUT_SCHEMAS } from './source-schemas.js';
import { s } from './schema.js';
const id = s.string(100), version = s.integer(1), cursor = s.nullable(s.integer(0)), source = s.nullable(s.enum(['session', 'project']));
const strings = (max = 100) => s.array(s.string(1000), max);
const sources = s.enum(['alphaxiv', 'openalex', 'biorxiv', 'pubmed', 'crossref']);
const config = { type: 'object', additionalProperties: s.json('Experiment-specific configuration values; arbitrary keys and nested JSON are intentional because each runner owns its configuration contract.'), description: 'Runner-specific experiment configuration; schema validation does not apply defaults or coerce values.' };
const contract = s.object({
    runner: s.enum(['trusted-example', 'docker']), image: s.string(250), command: s.array(s.string(1000), 30, 1),
    environment: { type: 'object', additionalProperties: s.json('Runner environment metadata; the service currently supplies an empty execution environment.') },
    datasetVersion: s.string(200), evaluationProtocolVersion: s.string(200),
    metrics: { type: 'object', minProperties: 1, propertyNames: s.string(80), additionalProperties: s.object({ unit: s.string(100), direction: s.enum(['min', 'max']) }, ['unit', 'direction']) },
    expectedArtifacts: strings(30), timeoutSeconds: s.nullable(s.integer(1, 86400)), cpus: s.nullable(s.integer(1, 64)), memoryMb: s.nullable(s.integer(64, 65536)),
}, ['runner', 'command', 'datasetVersion', 'evaluationProtocolVersion', 'metrics', 'expectedArtifacts']);
const output = s.object({
    kind: s.enum(['report', 'dataset', 'patch', 'analysis', 'review', 'code', 'text']),
    schemaId: s.enum(['report', 'text', 'csv', 'json', 'patch', 'code', 'review']),
    required: s.nullable(s.boolean()), minBytes: s.nullable(s.integer(1, 32 * 1024 * 1024)), title: s.string(200), mediaType: s.string(100),
}, ['kind', 'schemaId']);
const task = s.object({
    key: { ...s.string(60), pattern: '^[a-zA-Z0-9_-]+$' },
    role: s.enum(['literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer']),
    objective: s.string(), dependencies: s.nullable(strings(24)), critical: s.boolean(), required: s.boolean(), inputEvidenceIds: s.nullable(strings()),
    reviewOf: s.string(60), expectedOutputs: s.array(output, 24),
    acceptanceRuleIds: s.nullable(s.array(s.enum(['artifact-required', 'evidence-required', 'claims-evidenced']), 10)),
}, ['key', 'role', 'objective']);
const plan = s.object({ goal: s.string(8000), tasks: s.array(task, 24, 1), budget: s.nullable(s.integer(1, 100)), autoSummarize: s.nullable(s.boolean()) }, ['goal', 'tasks']);
const candidate = s.object({ title: s.string(200), hypothesis: s.string(), config }, ['title', 'hypothesis', 'config']);
/** Shape/primitive validation is shared; permissions, filesystem checks and state-dependent limits stay in services. */
export const INPUT_SCHEMAS = {
    ...DEVELOPMENT_INPUT_SCHEMAS, ...GIT_INPUT_SCHEMAS,
    ...SOURCE_INPUT_SCHEMAS,
    research_skill_list: s.object({}),
    research_skill_read: s.object({ skillId: id, resource: s.string(200) }, ['skillId']),
    connector_status: s.object({}),
    literature_discover: s.object({ query: s.string(500), sources: s.nullable(s.array(sources, 5, 1)), limit: s.nullable(s.integer(1, 20)), strategy: s.nullable(s.enum(['keyword', 'embedding'])), prioritize: s.nullable(s.enum(['default', 'recency', 'historical', 'popular'])), publishedAfter: { ...s.string(10), format: 'date' }, publishedBefore: { ...s.string(10), format: 'date' } }, ['query']),
    paper_read: s.object({ id: s.string(300), source: sources }, ['id']),
    campaign_inspect: s.object({ campaignId: id }, ['campaignId']),
    campaign_enroll: s.object({ campaignId: id, intentId: id, expectedVersion: version, required: s.nullable(s.boolean()), repairDecisionId: id }, ['campaignId', 'intentId', 'expectedVersion']),
    campaign_decision_submit: s.object({ campaignId: id, expectedVersion: version, action: s.enum(['repair', 'refill', 'promote', 'stop']), observationIds: { ...strings(), minItems: 1, uniqueItems: true }, reason: s.string(8000), selectedRunId: id, candidates: s.nullable(s.array(candidate, 24)) }, ['campaignId', 'expectedVersion', 'action', 'observationIds', 'reason']),
    change_proposal_prepare: s.object({ testJobId: id, baseExperimentId: id, expectedRevision: version, title: s.string(200), hypothesis: s.string(), changes: s.array(s.object({ path: s.string(1000), artifactId: s.nullable(id), expectedDigest: s.nullable(s.string(64)) }, ['path', 'artifactId', 'expectedDigest']), 50, 1) }, ['baseExperimentId', 'expectedRevision', 'title', 'hypothesis', 'changes']),
    artifact_read: s.object({ artifactId: id, cursor: s.nullable(s.integer(0, 2 * 1024 * 1024)) }, ['artifactId']),
    session_notice_read: s.object({ messageId: id, cursor: s.nullable(s.integer(0, Number.MAX_SAFE_INTEGER)) }, ['messageId']),
    project_inspect: s.object({}),
    workspace_list: s.object({ source }),
    text_evidence_search: s.object({ query: s.string(1000), artifactIds: { ...strings(30), minItems: 1 }, limit: s.nullable(s.integer(1, 10)), mmrLambda: s.number(0, 1), deduplicateExact: s.nullable(s.boolean()) }, ['query', 'artifactIds']),
    workspace_read: s.object({ path: s.string(1000), source }, ['path']),
    workspace_write: s.object({ path: s.string(1000), content: s.string(2 * 1024 * 1024, 0), expectedDigest: s.nullable(s.string(64)), source: { ...source, description: 'Project writes require a user actor; agents can write only their session workspace.' } }, ['path', 'content', 'expectedDigest']),
    evidence_read: s.object({ evidenceId: id }, ['evidenceId']),
    evidence_register: s.object({ artifactId: id, start: s.integer(0), end: s.integer(1), description: s.string(2000) }, ['artifactId', 'start', 'end', 'description']),
    artifact_create: s.object({ title: s.string(200), content: s.string(2 * 1024 * 1024, 0), mediaType: s.nullable(s.string(100)) }, ['title', 'content']),
    literature_search: s.object({ query: s.string(500), limit: s.nullable(s.integer(1, 20)) }, ['query']),
    experiment_plan_submit: s.object({ title: s.string(200), hypothesis: s.nullable(s.string()), parentId: s.nullable(s.string()), config, contract: s.nullable(contract) }, ['title']),
    run_prepare: s.object({ experimentId: id }, ['experimentId']),
    run_submit: s.object({ intentId: id }, ['intentId']),
    run_inspect: s.object({ runId: id }, ['runId']),
    run_logs: s.object({ runId: id, cursor }, ['runId']),
    approval_request: s.object({}),
    collaboration_plan_submit: plan,
    agent_delegate: plan,
    task_inspect: s.object({ teamId: id }),
    task_result_read: s.object({ taskId: id }, ['taskId']),
    task_context_read: s.object({}),
    task_progress_report: s.object({ message: s.string(2000) }, ['message']),
    task_result_submit: s.object({ summary: s.string(16000), outcome: s.enum(['completed', 'partial', 'blocked']), evidenceIds: s.nullable(strings()), artifactIds: s.nullable(strings()), claims: s.nullable(s.array(s.object({ statement: s.string(8000), evidenceIds: strings(), limitations: s.nullable(strings(30)) }, ['statement', 'evidenceIds']), 24)), unresolvedQuestions: s.nullable(strings(30)), verdict: s.enum(['accept', 'reject', 'disputed']) }, ['summary', 'outcome']),
};
//# sourceMappingURL=inputs.js.map