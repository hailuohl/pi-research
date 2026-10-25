import {AUTOMATIC_APPROVAL_REFERENCE_SCHEMA,AUTOMATIC_EXECUTION_SCHEMA} from './automatic-approval-schemas.js';
import { s, type JsonSchema } from './schema.js';
import {METHOD_CONTRACT_INPUT_SCHEMA,FROZEN_METHOD_CONTRACT_SCHEMA,METHOD_REQUIREMENTS_SCHEMA,DRAFT_ROLE_SCHEMA,PROTOCOL_DOCUMENT_SCHEMA} from './method-contract-schemas.js';

const str = { type: 'string' } as const;
const id = s.string(100);
const array = <const T extends JsonSchema>(items: T, max: number) => s.array(items, max);
const object = <const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = readonly []>(properties: P, optional?: O) =>
    s.object(properties, Object.keys(properties).filter(k => !optional?.includes(k as O[number])) as Exclude<keyof P & string, O[number]>[]);
const row = <const K extends string, const P extends Record<string, JsonSchema>, const O extends readonly (keyof P & string)[] = readonly []>(kind: K, properties: P, optional?: O) =>
    object({ id: str, kind: { const: kind }, projectId: s.nullable(str), version: s.integer(1), createdAt: str, updatedAt: str, ...properties }, optional);

const hypothesis = object({ statement: s.string(2000), evidenceIds: array(id, 30) });
const step = object({ title: s.string(200), description: s.string(2000) });
const draftInput=object({path:s.string(1000),readId:id});
const draftFile=object({sessionId:id,workspace:s.string(1000),path:s.string(1000),digest:s.string(64,64),size:s.integer(0,Number.MAX_SAFE_INTEGER),readId:id,writeVersion:s.integer(1,Number.MAX_SAFE_INTEGER)});
export const RESEARCH_SOURCE_INPUT_SCHEMA=object({path:s.string(1000),workspace:s.string(1000),artifactId:id,digest:s.string(64,64),size:s.integer(0,Number.MAX_SAFE_INTEGER),readId:id,readProtocol:{const:'fixed-text-v1'},purpose:s.enum(['whole-text','dataset-reference']),documentVersionId:id,sourceKind:{const:'workspace-snapshot'},textSourceId:id},['readProtocol','purpose','documentVersionId','sourceKind','textSourceId']);
export const RESEARCH_BRIEF_REFERENCE_SCHEMA=object({id,digest:s.string(64,64),revision:s.integer(1),rootSessionId:id});
const brief = row('research-brief', {
    automaticApproval:AUTOMATIC_APPROVAL_REFERENCE_SCHEMA,automaticExecution:AUTOMATIC_EXECUTION_SCHEMA,rootSessionId: id, revision: s.integer(1), previousRevisionId: id, question: s.string(4000), scope: s.string(4000, 0),
    constraints: array(s.string(1000), 16), successCriteria: array(s.string(1000), 12), clarificationQuestions: array(s.string(1000), 12),
    literatureSummary: s.string(8000, 0), hypotheses: array(hypothesis, 12), evidenceIds: array(id, 60), steps: array(step, 16),
    status: s.enum(['clarifying', 'ready', 'confirmed']), digest: s.string(64, 64),draftFiles:array(draftFile,5000),sourceInputs:array(RESEARCH_SOURCE_INPUT_SCHEMA,32),
    methodContract:FROZEN_METHOD_CONTRACT_SCHEMA,methodRequirements:METHOD_REQUIREMENTS_SCHEMA,
    draftRoles:array(DRAFT_ROLE_SCHEMA,5000),protocolDocument:PROTOCOL_DOCUMENT_SCHEMA,
}, ['automaticApproval','automaticExecution','previousRevisionId','draftFiles','sourceInputs','methodContract','methodRequirements','draftRoles','protocolDocument']);

export const RESEARCH_BRIEF_INPUT_SCHEMAS = {
    research_brief_save: object({
        question: s.string(4000), scope: s.string(4000, 0), constraints: array(s.string(1000), 16),
        successCriteria: array(s.string(1000), 12), clarificationQuestions: array(s.string(1000), 12),
        literatureSummary: s.string(8000, 0), hypotheses: array(hypothesis, 12), evidenceIds: array(id, 60), steps: array(step, 16),
        status: s.enum(['clarifying', 'ready']), expectedRevisionId: s.nullable(id),draftFiles:array(draftInput,5000),
        methodContract:METHOD_CONTRACT_INPUT_SCHEMA,
        draftRoles:array(DRAFT_ROLE_SCHEMA,5000),
    },['draftFiles','methodContract','draftRoles']),
    research_brief_inspect: object({ briefId: id }, ['briefId']),
    research_brief_confirm: object({ briefId: id, expectedVersion: s.integer(1, Number.MAX_SAFE_INTEGER) }),
} as const satisfies Record<string, JsonSchema>;

export const RESEARCH_BRIEF_OUTPUT_SCHEMAS = {
    research_brief_save: brief,
    research_brief_inspect: object({
        brief: s.nullable(brief), latestId: s.nullable(id),
        history: array(object({ id, revision: s.integer(1), status: s.enum(['clarifying', 'ready', 'confirmed']), digest: s.string(64, 64) }), 20),
        evidenceChecks: array(object({ evidenceId: id, current: { type: 'boolean' }, code: s.string(100) }, ['code']), 60),
        blockedReason: s.string(100),
    }, ['blockedReason']),
    research_brief_confirm: brief,
} as const satisfies Record<string, JsonSchema>;
