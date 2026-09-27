import { USER } from '../../packages/domain/types.js';
import { integer, text } from '../../packages/contracts/validation.js';
export function readCampaignRoute(app, path) {
    const [kind, id, action] = path.split('/').filter(Boolean);
    if (kind === 'wakeups' && id && !action)
        return app.wakeups.get(USER, id);
    if (kind === 'campaign-decisions' && id && !action)
        return app.store.get('campaign-decision', id);
    if (kind !== 'campaigns' || !id)
        return undefined;
    if (!action)
        return app.campaigns.get(USER, id);
    if (action === 'members')
        return app.campaigns.members(USER, id);
    if (action === 'rounds')
        return app.campaigns.rounds(USER, id);
    if (action === 'observations')
        return app.campaigns.observations(USER, id);
    if (action === 'decisions')
        return app.campaigns.decisions(USER, id);
    return undefined;
}
export function writeCampaignRoute(app, path, x) {
    const [kind, id, action] = path.split('/').filter(Boolean);
    if (path === '/campaigns')
        return app.campaigns.create(USER, text(x.projectId, 'projectId', 100), x);
    if (kind === 'campaigns' && id) {
        if (action === 'activate')
            return app.campaigns.activate(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
        if (action === 'pause')
            return app.campaigns.pause(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
        if (action === 'resume')
            return app.campaigns.resume(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
        if (action === 'stop')
            return app.campaigns.stop(USER, id, x);
        if (action === 'members')
            return app.campaigns.enroll(USER, id, x);
        if (action === 'decisions')
            return app.decisions.propose(USER, id, x);
    }
    if (kind === 'campaign-decisions' && id && action === 'apply')
        return app.decisions.apply(USER, id, integer(x.expectedVersion, 'expectedVersion', 1));
    if (kind === 'wakeups' && id) {
        if (action === 'request')
            return app.wakeups.request(USER, id);
        if (action === 'retry')
            return app.wakeups.retry(USER, id);
        if (action === 'cancel')
            return app.wakeups.cancel(USER, id);
    }
    return undefined;
}
//# sourceMappingURL=campaign-routes.js.map