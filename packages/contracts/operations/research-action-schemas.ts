import {s,type JsonSchema,type InferSchema} from './schema.js';

const id=s.string(100),version=s.integer(1,Number.MAX_SAFE_INTEGER);
export const RESEARCH_ACTION_INPUT_SCHEMA={type:'object',anyOf:[
    s.object({kind:s.enum(['text_grant']),textGrant:s.object({documents:s.array(s.object({documentVersionId:id,parseResultId:id},['documentVersionId','parseResultId']),30),pmcDocuments:s.array(s.object({documentVersionId:id},['documentVersionId']),1),maxSearches:s.integer(1,2),expiresAt:s.string(50)},['documents','maxSearches','expiresAt'])},['kind','textGrant']),
    s.object({kind:s.enum(['claim_decision']),claim:s.object({claimId:id,expectedVersion:version},['claimId','expectedVersion'])},['kind','claim']),
    s.object({kind:s.enum(['report_compose']),report:s.object({title:s.string(200),runIds:s.array(id,100),claimIds:s.array(id,100),publicationResultIds:s.array(id,20),campaignIds:s.array(id,5)},['title','runIds','claimIds','publicationResultIds'])},['kind','report']),
    s.object({kind:s.enum(['history']),history:s.object({kind:s.enum(['documents','evidence','claims','reports'])},['kind'])},['kind','history']),
]} as const satisfies JsonSchema;
export type ResearchActionInput=InferSchema<typeof RESEARCH_ACTION_INPUT_SCHEMA>;
export const RESEARCH_ACTION_INPUT_SCHEMAS={
    research_action_prepare:RESEARCH_ACTION_INPUT_SCHEMA,
    research_action_inspect:s.object({requestId:id},['requestId']),
    research_action_decide:s.object({requestId:id,expectedVersion:version,decision:s.enum(['confirm','reject','accepted','rejected','disputed','dismiss'])},['requestId','expectedVersion','decision']),
} as const satisfies Record<string,JsonSchema>;
export type ResearchActionDecision=InferSchema<typeof RESEARCH_ACTION_INPUT_SCHEMAS.research_action_decide>['decision'];
const summary=s.object({id,sessionId:id,kind:s.enum(['text_grant','claim_decision','report_compose','history']),state:s.enum(['pending','completed','rejected']),effectiveState:s.enum(['pending','completed','rejected','stale','expired']),expiresAt:s.string(50),resultRef:{anyOf:[s.object({grantId:id},['grantId']),s.object({reportId:id},['reportId'])]}},['id','sessionId','kind','state','effectiveState','expiresAt']);
export const RESEARCH_ACTION_OUTPUT_SCHEMAS={research_action_prepare:summary,research_action_inspect:summary,research_action_decide:summary} as const satisfies Record<string,JsonSchema>;
