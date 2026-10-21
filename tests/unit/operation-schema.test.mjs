import test from 'node:test';
import assert from 'node:assert/strict';
import { INPUT_SCHEMAS } from '../../dist/packages/contracts/operations/inputs.js';
import { s, validateSchema } from '../../dist/packages/contracts/operations/schema.js';
import { TOOL_DEFINITIONS } from '../../dist/packages/research-tools/definitions.js';
import { ROLE_TOOLS } from '../../dist/packages/policy/permissions.js';

test('every advertised tool example satisfies its exact input contract', () => {
    assert.equal(Object.keys(INPUT_SCHEMAS).length, 171);
    assert.deepEqual(Object.keys(INPUT_SCHEMAS).sort(), Object.keys(TOOL_DEFINITIONS).sort());
    for (const [name, definition] of Object.entries(TOOL_DEFINITIONS)){
        assert.doesNotThrow(() => validateSchema(INPUT_SCHEMAS[name], definition.example), name);
    }
});

test('every Agent tool satisfies the pinned Worker object schema contract',()=>{
    for(const name of new Set(Object.values(ROLE_TOOLS).flat()))
        assert.equal(TOOL_DEFINITIONS[name].inputSchema.type,'object',name);
});

test('operation schemas reject missing/unknown fields and invalid primitive values', () => {
    const invalid = [
        ['publication_citation_check', {}],
        ['publication_citation_check', {revisionId:'r',source:'extra'}],
        ['publication_citation_check', {revisionId:'r',metadataArtifactIds:Array(33).fill('a')}],
        ['run_submit', { intentId: 'i', experimentId: 'extra' }],
        ['workspace_write', { path: 'a', content: 'a' }],
        ['change_proposal_prepare', { baseExperimentId: 'e', expectedRevision: 1, title: 't', hypothesis: 'h', changes: [{ path: 'a', artifactId: 'a', expectedDigest: null, source: 'project' }] }],
        ['task_result_submit', { summary: 'ok', outcome: 'completed', claims: [{ statement: 'x', evidenceIds: [], extra: true }] }],
        ['paper_read', { id: ' ' }],
        ['run_logs', { runId: 'r', cursor: 1.5 }],
        ['experiment_plan_submit', { title: 'x', config: { bad: NaN } }],
        ['experiment_plan_submit', { title: 'x', config: { bad: undefined } }],
        ['model_http_configure', { maxRequests: 33 }],
        ['model_http_configure', { maxRequests: -1 }],
        ['model_http_configure', { maxRequests: 1 }],
        ['model_http_inspect', { limit: 101 }],
        ['research_action_prepare', {kind:'history',history:{kind:'reports'},sessionId:'extra'}],
        ['research_action_prepare', {kind:'history',history:{kind:'reports'},claim:{claimId:'c',expectedVersion:1}}],
        ['research_action_prepare', {kind:'text_grant',textGrant:{documents:[],maxSearches:3,expiresAt:'2099-01-01T00:00:00Z'}}],
        ['research_action_decide', {requestId:'r',expectedVersion:1,decision:'confirm',approved:true}],
    ];
    for (const [name, input] of invalid)
        assert.throws(() => validateSchema(INPUT_SCHEMAS[name], input), { code: 'INVALID_INPUT', status: 400 }, name);
    assert.throws(() => validateSchema(s.string(), 3, 'output'), { code: 'INVALID_OUTPUT', status: 500 });
});

test('RunGrant prepare fixes exactly one coordinator session or analyst Task scope',()=>{
    const common={intentIds:['intent'],maxRuns:1,expiresAt:'2099-01-01T00:00:00.000Z'};
    validateSchema(INPUT_SCHEMAS.run_grant_prepare,{...common,sessionId:'session'});
    validateSchema(INPUT_SCHEMAS.run_grant_prepare,{...common,taskId:'task'});
    for(const input of [common,{...common,sessionId:'session',taskId:'task'},{...common,taskId:'task',extra:true}])
        assert.throws(()=>validateSchema(INPUT_SCHEMAS.run_grant_prepare,input),{code:'INVALID_INPUT'});
});

test('literature page creation accepts only a saved search id as its continuation input',()=>{
    validateSchema(INPUT_SCHEMAS.literature_task_create,{kind:'search',previousSearchId:'saved-search-id'});
    for(const input of [
        {kind:'search',previousSearchId:'saved-search-id',search:{query:'q'}},
        {kind:'search',previousSearchId:'saved-search-id',discoveryGrantId:'grant'},
        {kind:'search',previousSearchId:'saved-search-id',cursor:'arbitrary'},
        {kind:'search',previousSearchId:''},
    ]) assert.throws(()=>validateSchema(INPUT_SCHEMAS.literature_task_create,input),{code:'INVALID_INPUT'});
});

test('open configuration accepts nested JSON and validation neither defaults nor coerces', () => {
    const input = { title: 'x', config: { experimentSpecific: [null, false, 2, { x: 'ok' }] } };
    const original = structuredClone(input);
    validateSchema(INPUT_SCHEMAS.experiment_plan_submit, input);
    assert.deepEqual(input, original);
    validateSchema(INPUT_SCHEMAS.workspace_write, { path: 'a', content: '', expectedDigest: null });
    assert.throws(() => validateSchema(INPUT_SCHEMAS.run_logs, { runId: 'r', cursor: '1' }), { code: 'INVALID_INPUT' });
});

test('explicit null preserves only service-supported nullish defaults', () => {
    for (const [name, input] of [
        ['literature_discover', { query: 'q', sources: null, limit: null, strategy: null, prioritize: null }],
        ['artifact_create', { title: 't', content: '', mediaType: null }],
        ['run_logs', { runId: 'r', cursor: null }],
        ['text_evidence_search', { query: 'q', artifactIds: ['a'], limit: null, deduplicateExact: null }],
        ['collaboration_plan_submit', { goal: 'g', budget: null, autoSummarize: null, tasks: [{ key: 'k', role: 'writer', objective: 'o', dependencies: null, inputEvidenceIds: null, acceptanceRuleIds: null, expectedOutputs: [{ kind: 'report', schemaId: 'report', required: null, minBytes: null }] }] }],
        ['task_result_submit', { summary: 's', outcome: 'completed', claims: null, evidenceIds: null, artifactIds: null, unresolvedQuestions: null }],
    ]) validateSchema(INPUT_SCHEMAS[name], input);
    for (const [name, input] of [
        ['text_evidence_search', { query: 'q', artifactIds: ['a'], mmrLambda: null }],
        ['paper_read', { id: '2401.01234v2', source: null }],
        ['collaboration_plan_submit', { goal: 'g', tasks: [{ key: 'k', role: 'writer', objective: 'o', critical: null }] }],
    ]) assert.throws(() => validateSchema(INPUT_SCHEMAS[name], input), { code: 'INVALID_INPUT' });
});

test('text retrieval accepts either legacy text IDs or exact PDF version/result pairs', () => {
    validateSchema(INPUT_SCHEMAS.text_evidence_search, { query: 'fixed acidity alcohol', documents: [{ documentVersionId: 'v1', parseResultId: 'p1' }], corpusId: 'c1', configurationVersion: 2 });
    validateSchema(INPUT_SCHEMAS.text_evidence_search, { query: 'adsorption', artifactIds: ['text-1'] });
    assert.throws(() => validateSchema(INPUT_SCHEMAS.text_evidence_search, { query: 'q', documents: [{ documentVersionId: 'v1', parseResultId: 'p1', pageNumber: 5 }] }), { code: 'INVALID_INPUT' });
});

test('JSON Schema string length counts Unicode code points', () => {
    validateSchema(s.string(1), '😀');
    assert.throws(() => validateSchema(s.string(1), '😀a'), { code: 'INVALID_INPUT' });
    assert.throws(() => validateSchema(s.string(3, 2), '😀'), { code: 'INVALID_INPUT' });
    validateSchema(s.string(2, 2), '😀a');
});

test('existing-file deletion and null session-workspace selection remain valid inputs', () => {
    validateSchema(INPUT_SCHEMAS.change_proposal_prepare, {
        baseExperimentId: 'e', expectedRevision: 1, title: 'Remove obsolete file', hypothesis: 'Delete unused code',
        changes: [{ path: 'old.py', artifactId: null, expectedDigest: 'existing-file-digest' }],
    });
    validateSchema(INPUT_SCHEMAS.workspace_list, { source: null });
    validateSchema(INPUT_SCHEMAS.workspace_read, { path: 'README.md', source: null });
    validateSchema(INPUT_SCHEMAS.workspace_write, { path: 'new.py', content: '', expectedDigest: null, source: null });
    assert.throws(() => validateSchema(INPUT_SCHEMAS.workspace_read, { path: 'README.md', source: 'another-session' }), { code: 'INVALID_INPUT' });
});
