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

const sourceFile = object({ path: string, size: integer, digest: string });
const snapshot = object({ digest: string, path: string, files: array(sourceFile) });
const contract = object({
    command: strings,
    environment: { type: 'object', additionalProperties: string },
    datasetVersion: string, evaluationProtocolVersion: string,
    metrics: { type: 'object', additionalProperties: object({ unit: string, direction: enumeration('min', 'max') }) },
    expectedArtifacts: strings, timeoutSeconds: integer, runner: enumeration('trusted-example', 'docker'),
    image: string, cpus: integer, memoryMb: integer
}, ['image']);
const manifest = object({
    experimentId: string, experimentVersion: integer, experimentRevision: integer,
    contract, contractDigest: string, snapshotDigest: string, snapshotPath: string,
    sourceFiles: array(sourceFile), createdAt: string
});
const taskResult = object({
    summary: string, outcome: enumeration('completed', 'partial', 'blocked'), evidenceIds: strings, artifactIds: strings,
    claims: array(object({ statement: string, evidenceIds: strings, limitations: strings })),
    unresolvedQuestions: strings, verdict: enumeration('accept', 'reject', 'disputed')
}, ['verdict']);

/** Success payloads are the existing service records, including durable replay fields. */
export const OUTPUT_SCHEMAS = {
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
        metrics: { type: 'object', additionalProperties: number }, error: string, artifactIds: strings, evidenceIds: strings
    }, ['answerDisposition', 'answerReviewId', 'supervisorPid', 'childPid', 'heartbeat', 'startedAt', 'endedAt', 'exitCode', 'metrics', 'error']),
    workspace_read: object({ path: string, content: string, digest: string, size: integer }),
    workspace_write: object({ path: string, digest: string, size: integer }),
    change_proposal_prepare: row('change-proposal', {
        baseExperimentId: string, baseRevision: integer, baseSnapshot: snapshot, contractDigest: string,
        title: string, hypothesis: string,
        changes: array(object({
            path: string, expectedDigest: nullableString, artifactId: nullableString, artifactDigest: nullableString,
            taskId: string, taskResultDigest: string, sourceAcceptanceId: string
        }, ['taskId', 'taskResultDigest', 'sourceAcceptanceId'])),
        candidateSnapshot: snapshot, digest: string, approvalId: string, state: enumeration('prepared', 'applied'),
        testsStatus: { const: 'not_run' }, appliedExperimentId: string, sourceValidity: enumeration('current', 'stale'), invalidatedBy: string
    }, ['appliedExperimentId', 'sourceValidity', 'invalidatedBy']),
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
        scopeSessionId: nullableString, scopeAttemptId: nullableString,
        sourceResponses: array(object({ url: string, contentType: string })), limitations: strings
    })
} as const satisfies Record<string, JsonSchema>;

export type OperationOutput<N extends keyof typeof OUTPUT_SCHEMAS> = InferSchema<(typeof OUTPUT_SCHEMAS)[N]>;
