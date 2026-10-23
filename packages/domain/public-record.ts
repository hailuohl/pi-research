/** Execution provenance remains in storage, outside the existing public record contracts. */
export function publicRecord<T>(value:T):T {
    if(!value||typeof value!=='object')return value;
    const row=value as Record<string,unknown>,fields=row.kind==='development-task'?['resume']:row.kind==='session'?['executionPermission','lastConsumedHumanMessageId']:row.kind==='message'?['permission','nativeAttachmentContextIds','approvalNoticeId','workflowContinuationId','workflowConsumedGeneration']:row.kind==='team'||row.kind==='team-plan'?['permission','taskPermissionEffects']:row.kind==='run'||row.kind==='sandbox-job'?['permission','permissionOrigin']:row.kind==='git-operation'?['permission','permissionOrigin','approvedAction','workingGrant']:[];
    if(!fields.length)return value;
    const result={...row};for(const field of fields)delete result[field];return result as T;
}
export function publicRecords<T>(value:T):T {return Array.isArray(value)?value.map(publicRecord) as T:publicRecord(value);}
