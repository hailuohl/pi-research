import { ensure } from '../domain/errors.js';
// Only these callsites operate on application-wide resources rather than research projects.
const GLOBAL_SCOPES = new Set(['POST:/settings/model', 'POST:/settings/environment', 'POST:/settings/model-connections', 'POST:/settings/model-management', 'POST:/settings/model-tests', 'document-parser-configure', 'publication-compiler-configure', 'publication-template-import:user', 'POST:/publication-templates']);
const PROJECT_SCOPES = new Set(['skill-import', 'skill-upload', 'skill-enable', 'skill-review', 'skill-revoke', 'skill-configure', 'skill-delete', 'document-import', 'document-paper', 'document-acquire', 'document-parse-prepare', 'manuscript-create', 'publication-build-prepare', 'connector-search', 'connector-paper', 'connector-pdf', 'connector-oa-full-text', 'literature', 'native-media-import']);
const ROUTE_KINDS = { 'projects': 'project', 'sessions': 'session', 'experiments': 'experiment', 'run-intents': 'run-intent', 'runs': 'run', 'approvals': 'approval', 'teams': 'team', 'tasks': 'task', 'campaigns': 'campaign', 'campaign-decisions': 'campaign-decision', 'change-proposals': 'change-proposal', 'wakeups': 'wakeup', 'claims': 'claim', 'evidence': 'evidence', 'artifacts': 'artifact' };
const RECORD_KEYS = ['sessionId', 'reuseSessionId', 'rootSessionId', 'experimentId', 'intentId', 'runId', 'taskId', 'teamId', 'approvalId', 'grantId', 'revisionId', 'jobId', 'reportId', 'artifactId', 'evidenceId', 'campaignId', 'decisionId', 'operationId', 'documentVersionId'];
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
/** Exact identifiers only: receipt bodies and scope tokens must agree on their owner. */
export function inferOperationOwner(db, scope, input, response, trusted) {
    const projects = new Set();
    let missing = false, global = GLOBAL_SCOPES.has(scope);
    const project = (value) => { if (typeof value !== 'string')
        return; const found = db.prepare("SELECT id FROM records WHERE kind='project' AND id=?").get(value); if (found)
        projects.add(value);
    else
        missing = true; };
    const record = (value, kind) => { if (typeof value !== 'string')
        return; const rows = kind ? db.prepare('SELECT kind,id,project_id FROM records WHERE kind=? AND id=?').all(kind, value) : db.prepare('SELECT kind,id,project_id FROM records WHERE id=?').all(value); for (const row of rows) {
        if (row.kind === 'project')
            project(row.id);
        else if (row.project_id !== null)
            project(row.project_id);
    } };
    const parts = scope.split(':');
    if (parts[0] === 'operation' && parts[1] === 'user')
        project(parts[2]);
    else if (PROJECT_SCOPES.has(parts[0]))
        project(parts[1]);
    else if (parts[0] === 'agent')
        record(parts[1], 'session');
    else if (parts[0] === 'native-prepare')
        record(parts[1], 'session');
    else if (parts[0] === 'native-execute')
        record(parts[1], 'native-request');
    else if (parts[0] === 'publication-template-import' && parts[1] === 'agent')
        record(parts[2], 'session');
    const route = scope.match(/^(?:user:)?(?:POST|PUT|PATCH|DELETE):\/([^/]+)\/([^/]+)(?:\/.*)?$/);
    if (route && ROUTE_KINDS[route[1]])
        record(route[2], ROUTE_KINDS[route[1]]);
    const inspect = (value, isResponse = false) => { const x = object(value); if (!x)
        return; if (x.projectId !== undefined && x.projectId !== null)
        project(x.projectId); for (const key of RECORD_KEYS)
        record(x[key]); if (isResponse)
        record(x.id); };
    inspect(input);
    const request = object(input);
    inspect(request?.body);
    inspect(request?.input);
    inspect(response, true);
    if (trusted?.kind === 'project')
        project(trusted.projectId);
    else if (trusted?.kind === 'global')
        global = true;
    ensure(projects.size <= 1 && !(global && projects.size), 'OPERATION_OWNERSHIP_CONFLICT', '回执的项目归属不一致，拒绝返回历史内容');
    ensure(!missing, 'OPERATION_OWNERSHIP_UNKNOWN', '回执声明的项目不存在，不能证明历史归属');
    const projectId = [...projects][0];
    return projectId ? { kind: 'project', projectId } : global ? { kind: 'global' } : { kind: 'unknown' };
}
export function storedOperationOwner(row) {
    return row.owner_kind === 'project' && typeof row.project_id === 'string' ? { kind: 'project', projectId: row.project_id } : row.owner_kind === 'global' ? { kind: 'global' } : { kind: 'unknown' };
}
export function assertOperationReceipt(db, scope, input, value, stored, trusted) {
    const inferred = inferOperationOwner(db, scope, input, value, trusted);
    if (stored.kind !== 'unknown' && inferred.kind !== 'unknown')
        ensure(stored.kind === inferred.kind && (stored.kind !== 'project' || inferred.kind === 'project' && stored.projectId === inferred.projectId), 'OPERATION_OWNERSHIP_CONFLICT', '旧回执归属与当前请求不符');
    const owner = stored.kind === 'unknown' ? inferred : stored;
    ensure(owner.kind !== 'unknown', 'OPERATION_OWNERSHIP_UNKNOWN', '无法证明旧回执属于可读取项目或全局配置，未返回历史内容');
    if (owner.kind === 'global')
        return;
    const row = db.prepare("SELECT data FROM records WHERE kind='project' AND id=?").get(owner.projectId);
    ensure(row, 'NOT_FOUND', '项目不存在', 404);
    const management = scope.match(/^POST:\/projects\/([^/]+)\/(trash|restore)$/), view = object(value);
    if (management && management[1] === owner.projectId && view) {
        const allowed = ['id', 'name', 'version', 'status', 'lifecycleEpoch', 'archived', 'createdAt', 'updatedAt', 'deletedAt', 'restoreStatus'];
        ensure(view.id === owner.projectId && Object.keys(view).every(key => allowed.includes(key)) && typeof view.name === 'string' && Number.isInteger(view.version) && Number.isInteger(view.lifecycleEpoch) && ['active', 'archived', 'trashed', 'purging'].includes(String(view.status)) && typeof view.archived === 'boolean' && typeof view.createdAt === 'string' && typeof view.updatedAt === 'string', 'OPERATION_RECEIPT_INVALID', '生命周期回执不是管理摘要');
        return;
    }
    const project = JSON.parse(String(row.data));
    ensure(!['trashed', 'purging'].includes(project.status), 'PROJECT_DELETED', '项目已移入回收站；普通内容不可访问', 410);
}
//# sourceMappingURL=operation-ownership.js.map