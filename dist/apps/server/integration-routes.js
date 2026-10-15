import { USER } from '../../packages/domain/types.js';
import { object, text, oneOf } from '../../packages/contracts/validation.js';
const ROLES = ['coordinator', 'literature', 'designer', 'implementer', 'analyst', 'reviewer', 'writer'];
export function readIntegrationRoute(app, path, url) {
    if (path === '/skills') {
        const role = oneOf(url.searchParams.get('role') ?? 'coordinator', ROLES, 'role');
        return { bundleId: app.skills.bundleId, skills: app.skills.list(role) };
    }
    const skill = path.match(/^\/skills\/([a-z0-9-]+)$/);
    if (skill)
        return app.skills.read('coordinator', skill[1], url.searchParams.get('resource') ?? undefined, url.searchParams.has('bundleId') ? text(url.searchParams.get('bundleId'), 'bundleId', 100) : app.skills.bundleId);
    const p = path.match(/^\/projects\/([^/]+)\/(connectors|connector-history)$/);
    if (p) {
        app.store.get('project', p[1]);
        if (p[2] === 'connectors')
            return app.operations.execute(USER, 'connector_status', {}, { projectId: p[1] });
        return { observations: app.connectors.observations(USER, p[1]), searches: app.store.list('connector-search', p[1]).slice(-30), papers: app.store.list('paper-read', p[1]).slice(-30), scope: 'last-30-per-kind' };
    }
    return undefined;
}
export function writeIntegrationRoute(app, path, body) { const p = path.match(/^\/projects\/([^/]+)\/connectors$/); if (p)
    return app.connectors.configure(USER, p[1], body); return undefined; }
/** This asynchronous branch must run outside Store.operation's synchronous transaction. */
export async function asyncIntegrationRoute(app, path, body, key, signal) { const { projectId, ...input } = object(body); return app.operations.execute(USER, path === '/connectors/discover' ? 'literature_discover' : 'paper_read', input, { projectId: text(projectId, 'projectId', 100), idempotencyKey: key, signal }); }
//# sourceMappingURL=integration-routes.js.map