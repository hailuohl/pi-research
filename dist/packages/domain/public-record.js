/** Execution provenance remains in storage, outside the existing public record contracts. */
export function publicRecord(value) {
    if (!value || typeof value !== 'object')
        return value;
    const row = value, fields = row.kind === 'session' ? ['executionPermission'] : row.kind === 'message' ? ['permission', 'nativeAttachmentContextIds'] : row.kind === 'team' || row.kind === 'team-plan' ? ['permission', 'taskPermissionEffects'] : row.kind === 'run' || row.kind === 'sandbox-job' ? ['permission', 'permissionOrigin'] : row.kind === 'git-operation' ? ['permission', 'permissionOrigin', 'approvedAction', 'workingGrant'] : [];
    if (!fields.length)
        return value;
    const result = { ...row };
    for (const field of fields)
        delete result[field];
    return result;
}
export function publicRecords(value) { return Array.isArray(value) ? value.map(publicRecord) : publicRecord(value); }
//# sourceMappingURL=public-record.js.map