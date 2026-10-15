import type {Approval,Artifact,Evidence,Task,TaskAttempt,TaskResult} from '../domain/types.js';

export type ReviewArtifact=Pick<Artifact,'digest'|'size'|'title'|'mediaType'|'taskId'|'runId'>&{id:string};
export type ReviewEvidence=Evidence&{id:string;sourceBindings:Array<{kind:'run'|'document-parse';id:string;approvalId:string;manifestDigest:string;sourceDigest?:string}>};
export interface PublicationReview {
    publicationResultId:string;publicationResultDigest:string;revisionId:string;revisionDigest:string;jobId:string;manifestDigest:string;buildApprovalId:string;sourceDigest:string;pdfDigest:string;
    rootSessionId:string;producerSessionIds:string[];teamId:string;taskId:string;approvalId:string;planDigest:string;taskSpecDigest:string;
    requiredEvidenceIds:string[];artifactIds:string[];artifacts:ReviewArtifact[];evidence:ReviewEvidence[];inputAcceptanceIds:string[];digest:string;
}
export interface PublicationReviewInspection {
    id:string;publicationResultId:string;revisionId:string;jobId:string;sourceDigest:string;pdfDigest:string;rootSessionId:string;teamId:string;taskId:string;approvalId:string;digest:string;
    status:'awaiting_approval'|'pending'|'running'|'passed'|'rejected'|'disputed'|'failed';validity:'current'|'stale';reason?:string;
    requiredEvidenceIds:string[];artifactIds:string[];reviewerSessionId?:string;attemptId?:string;inputDigest?:string;taskResultId?:string;taskResultDigest?:string;verdict?:TaskResult['verdict'];summary?:string;
}
export interface PublicationReviewTaskResult {id:string;taskId:string;attemptId:string;planVersion:number;directiveVersion:number;inputDigest:string;digest:string;result:TaskResult;}
export type ReviewApproval=Pick<Approval,'subjectKind'|'subjectId'|'digest'|'scope'|'status'>&{id:string};
export interface PublicationReviewSnapshot {
    review:PublicationReviewInspection;binding:PublicationReview;approvals:{build:ReviewApproval;review:ReviewApproval};
    task:Pick<Task,'execution'|'acceptance'|'generation'|'planVersion'|'directiveVersion'|'attemptId'|'sessionId'|'result'>&{id:string};
    attempt?:Pick<TaskAttempt,'taskId'|'teamId'|'sessionId'|'generation'|'state'|'inputDigest'>&{id:string};
    taskResult?:PublicationReviewTaskResult;artifacts:ReviewArtifact[];evidence:ReviewEvidence[];
}
