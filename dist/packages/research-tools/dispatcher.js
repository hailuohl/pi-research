import { ROLE_TOOLS, AUTOMATION_TOOLS } from '../policy/permissions.js';
import { TOOL_DEFINITIONS } from './definitions.js';
export class ToolDispatcher {
    app;
    constructor(app) {
        this.app = app;
    }
    definitions(role, automation = false, sessionId) { return (ROLE_TOOLS[role] ?? []).filter(name => TOOL_DEFINITIONS[name] && (!automation || AUTOMATION_TOOLS.includes(name)) && (name !== 'host_execute' || !!sessionId && this.app.hostAccess.canExpose(sessionId, automation))).map(name => ({ name, ...TOOL_DEFINITIONS[name] })); }
    authorize(actor, name) { return this.app.operations.authorizeAgent(actor, name); }
    async execute(actor, name, raw, callId) {
        return this.app.operations.execute(actor, name, raw, { projectId: actor.projectId, sessionId: actor.sessionId, idempotencyKey: callId });
    }
}
//# sourceMappingURL=dispatcher.js.map