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
};
//# sourceMappingURL=outputs.js.map