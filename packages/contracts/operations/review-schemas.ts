import {DRAFT_ROLE_SCHEMA,PROTOCOL_DOCUMENT_SCHEMA} from './method-contract-schemas.js';
import {s,type JsonSchema} from './schema.js';
import {RESEARCH_SOURCE_INPUT_SCHEMA,RESEARCH_BRIEF_REFERENCE_SCHEMA} from './research-brief-schemas.js';
import {REVIEW_READING_CHECK_SCHEMA,ASSESSMENT_AREAS_SCHEMA,REVIEW_INVENTORY_SCHEMA,REVIEW_BRIEF_ARTIFACT_SCHEMA} from './development-assessment-schemas.js';
const id=s.string(100),digest={...s.string(64),minLength:64,pattern:'^[a-f0-9]{64}$'},position=s.integer(0,Number.MAX_SAFE_INTEGER);
export const REVIEW_READING_PROTOCOL_SCHEMA={const:'fixed-obligations-v1'};
export const REVIEW_OBLIGATIONS_SCHEMA=s.array(s.object({targetId:s.string(1200),kind:s.enum(['candidate','source_input','test_artifact','brief']),path:s.string(1200),artifactId:id,digest,size:position,required:s.boolean(),obligation:s.enum(['whole-text','dataset-reference']),sourceBinding:s.object({projectId:id,rootSessionId:id,researchBrief:RESEARCH_BRIEF_REFERENCE_SCHEMA,input:RESEARCH_SOURCE_INPUT_SCHEMA},['projectId','rootSessionId','researchBrief','input'])},['targetId','kind','path','digest','size','required','obligation']),5104);
const metadata={reviewId:id,jobId:id,sourceDigest:digest};
const file={path:s.string(1000),size:position,digest,mode:s.enum(['100644','100755'])};
export const REVIEW_TEST_ARTIFACT_SCHEMA=s.object({id,digest,size:position,path:s.string(1000),required:s.boolean()},['id','digest','size','path','required']);
const review=s.object({readingProtocol:REVIEW_READING_PROTOCOL_SCHEMA,readingObligations:REVIEW_OBLIGATIONS_SCHEMA,surfaceInventory:REVIEW_INVENTORY_SCHEMA,briefArtifact:REVIEW_BRIEF_ARTIFACT_SCHEMA,draftRoles:s.array(DRAFT_ROLE_SCHEMA,5000),protocolDocument:PROTOCOL_DOCUMENT_SCHEMA,protocolVersion:s.integer(1,2),researchBrief:RESEARCH_BRIEF_REFERENCE_SCHEMA,sourceInputs:s.array(RESEARCH_SOURCE_INPUT_SCHEMA,32),testArtifacts:s.array(REVIEW_TEST_ARTIFACT_SCHEMA,5011),readingChecks:s.array(REVIEW_READING_CHECK_SCHEMA,5104),assessmentRequiredAreas:ASSESSMENT_AREAS_SCHEMA,blockingMessage:s.string(10000),id,...metadata,producerSessionId:id,baseSourceRevisionId:id,teamId:id,taskId:id,approvalId:id,manifestEvidenceId:id,testEvidenceIds:s.array(id,10),requiredEvidenceIds:s.array(id,20),dataArtifacts:s.array(s.object({id,digest,size:position,sourceAcceptanceId:id},["id","digest","size"]),10),digest,status:s.enum(['awaiting_approval','pending','running','passed','rejected','disputed','failed','stale']),reviewerSessionId:id,verdict:s.enum(['accept','reject','disputed'])},['id','reviewId','jobId','sourceDigest','producerSessionId','teamId','taskId','approvalId','manifestEvidenceId','testEvidenceIds','requiredEvidenceIds','digest','status']);
export const REVIEW_INPUT_SCHEMAS={
    development_review_prepare:s.object({jobId:id,readingProtocol:REVIEW_READING_PROTOCOL_SCHEMA},['jobId']),
    development_review_inspect:s.object({reviewId:id},['reviewId']),
    development_review_source_list:s.object({reviewId:id},['reviewId']),
    development_review_source_read:s.object({reviewId:id,path:s.string(1000),cursor:position,limit:s.integer(1,64000)},['reviewId','path']),
} as const satisfies Record<string,JsonSchema>;
export const REVIEW_OUTPUT_SCHEMAS={
    development_review_prepare:review,development_review_inspect:review,
    development_review_source_list:s.object({...metadata,files:s.array(s.object(file,['path','size','digest']),5000)},['reviewId','jobId','sourceDigest','files']),
    development_review_source_read:s.object({...metadata,...file,cursor:position,end:position,complete:s.boolean(),content:s.string(64000,0),reviewReadId:id,reviewReadingProtocol:REVIEW_READING_PROTOCOL_SCHEMA},['reviewId','jobId','sourceDigest','path','size','digest','cursor','end','complete','content']),
} as const satisfies Record<string,JsonSchema>;
