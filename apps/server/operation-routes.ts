import type { ResearchApp } from '../../packages/research-app.js';
import { USER } from '../../packages/domain/types.js';
import { ensure } from '../../packages/domain/errors.js';
import { object, text } from '../../packages/contracts/validation.js';
import { INPUT_SCHEMAS } from '../../packages/contracts/operations/inputs.js';
import { validateSchema } from '../../packages/contracts/operations/schema.js';

/** Transport fields never become an Actor or an operation argument. */
export function operationRoute(app: ResearchApp, path: string, body: unknown, key: string | undefined, signal: AbortSignal, method: string, query: string) {
    const generic = path.match(/^\/operations\/([^/]+)$/);
    if (generic) {
        ensure(method === 'POST', 'METHOD_NOT_ALLOWED', '操作需要 POST', 405);
        const x = object(body);
        ensure(Object.keys(x).every(k => ['projectId', 'sessionId', 'input'].includes(k)), 'INVALID_INPUT', '操作请求包含未知字段', 400);
        ensure(Object.hasOwn(x, 'input'), 'INVALID_INPUT', '需要 input', 400);
        return { result: app.operations.execute(USER, generic[1], x.input, {
            projectId: text(x.projectId, 'projectId', 100),
            ...(x.sessionId !== undefined ? { sessionId: text(x.sessionId, 'sessionId', 100) } : {}),
            idempotencyKey: key, signal,
        }) };
    }
    const legacyInput = object(body), legacyScope = {scope: `${method}:${path}`, input: {body, query}};
    const projectOperations: Record<string, string> = {'/reports':'report_create','/connectors/discover': 'literature_discover', '/literature-search': 'literature_search', '/text-evidence-search': 'text_evidence_search', '/artifacts': 'artifact_create', '/evidence': 'evidence_register', '/experiments': 'experiment_plan_submit'};
    if (projectOperations[path]) {
        const {projectId, ...input} = legacyInput, id = projectOperations[path];
        return {result: app.operations.execute(USER, id, input, {projectId: text(projectId, 'projectId', 100), idempotencyKey: key, signal, ...(['literature_discover', 'literature_search'].includes(id) ? {} : {legacy: legacyScope})})};
    }
    const campaign = path.match(/^\/campaigns\/([^/]+)\/(members|decisions)$/);
    const team = path.match(/^\/sessions\/([^/]+)\/teams$/);
    const child = path.match(/^\/experiments\/([^/]+)\/children$/);
    if (campaign || team || child) {
        const field = campaign ? 'campaignId' : child ? 'parentId' : undefined;
        ensure(!field || !Object.hasOwn(legacyInput, field), 'INVALID_INPUT', '请求不能覆盖路径标识', 400);
        const row = app.store.get(campaign ? 'campaign' : team ? 'session' : 'experiment', (campaign ?? team ?? child)![1]);
        return {result: app.operations.execute(USER, campaign ? campaign[2] === 'members' ? 'campaign_enroll' : 'campaign_decision_submit' : team ? 'collaboration_plan_submit' : 'experiment_plan_submit', {...legacyInput, ...(field ? {[field]: row.id} : {})}, {projectId: row.projectId!, ...(team ? {sessionId: row.id} : {}), idempotencyKey: key, legacy: legacyScope})};
    }
    const submit = path.match(/^\/run-intents\/([^/]+)\/submit$/);
    const files = path.match(/^\/projects\/([^/]+)\/files$/);
    if (!['/run-intents', '/change-proposals', '/connectors/paper'].includes(path) && !submit && !files) return;
    const x = object(body), legacy = { scope: `${method}:${path}`, input: { body, query } };
    if (path === '/run-intents') {
        validateSchema(INPUT_SCHEMAS.run_prepare, x);
        const projectId = app.store.get('experiment', x.experimentId as string).projectId!;
        return { result: app.operations.execute(USER, 'run_prepare', x, { projectId, idempotencyKey: key, legacy }) };
    }
    if (submit) {
        ensure(Object.keys(x).length === 0, 'INVALID_INPUT', '提交请求必须为空对象', 400);
        const input = { intentId: submit[1] };
        validateSchema(INPUT_SCHEMAS.run_submit, input);
        const projectId = app.store.get('run-intent', submit[1]).projectId!;
        return { result: app.operations.execute(USER, 'run_submit', input, { projectId, idempotencyKey: key, legacy }) };
    }
    if (files) {
        ensure(!Object.hasOwn(x, 'source'), 'INVALID_INPUT', '文件请求包含未知字段 source', 400);
        return { result: app.operations.execute(USER, 'workspace_write', { ...x, source: 'project' }, { projectId: files[1], idempotencyKey: key, legacy }) };
    }
    const { projectId: rawProjectId, ...input } = x, projectId = text(rawProjectId, 'projectId', 100);
    return { result: app.operations.execute(USER, path === '/connectors/paper' ? 'paper_read' : 'change_proposal_prepare', input, {
        projectId, idempotencyKey: key, signal,
        ...(path === '/connectors/paper' ? {} : { legacy }),
    }) };
}
