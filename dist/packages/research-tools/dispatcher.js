import { CONTINUATION_TOOLS, APPROVAL_RESUME_TOOLS } from '../policy/research-automation.js';
import { ROLE_TOOLS, AUTOMATION_TOOLS } from '../policy/permissions.js';
import { TOOL_DEFINITIONS } from './definitions.js';
export class ToolDispatcher {
    app;
    constructor(app) {
        this.app = app;
    }
    definitions(role, automation = false, sessionId, continuation = false, approvalResume = false, approvalNoticeId) {
        // Calls without a session inspect static role capabilities before task dispatch.
        const taskContext = sessionId === undefined || !!this.app.store.maybe('session', sessionId)?.taskId;
        return (ROLE_TOOLS[role] ?? []).filter(name => TOOL_DEFINITIONS[name] && (!automation || (continuation ? (sessionId ? this.app.automaticApprovals.continuationTools(sessionId) : CONTINUATION_TOOLS) : approvalResume ? APPROVAL_RESUME_TOOLS : AUTOMATION_TOOLS).includes(name)) && (name !== 'research_task_checkpoint' || continuation && !!sessionId && this.app.hostAccess.status({ type: 'user' }, sessionId).researchAutomationScope === 2) && (name !== 'task_context_read' || taskContext) && (name !== 'session_action_resume' || !!sessionId && this.app.sessionPermissions.canExposeResume(sessionId, approvalNoticeId)) && (name !== 'session_action_execute' || sessionId === undefined || this.app.sessionPermissions.canExposeFixedTextExecution(sessionId, approvalNoticeId)) && (name !== 'host_execute' || !!sessionId && this.app.hostAccess.canExpose(sessionId, automation))).map(name => ({ name, ...TOOL_DEFINITIONS[name], ...(name === 'evidence_register' && role === 'coordinator' && !automation ? { inputSchema: { ...TOOL_DEFINITIONS[name].inputSchema, properties: Object.fromEntries(Object.entries(TOOL_DEFINITIONS[name].inputSchema.properties).filter(([key]) => key !== 'description')), required: ['artifactId', 'exactQuote'], anyOf: [TOOL_DEFINITIONS[name].inputSchema.anyOf[0].anyOf[0], TOOL_DEFINITIONS[name].inputSchema.anyOf[1]] } } : {}) }));
    }
    authorize(actor, name) { return this.app.operations.authorizeAgent(actor, name); }
    async execute(actor, name, raw, callId) {
        return this.app.operations.execute(actor, name, raw, { projectId: actor.projectId, sessionId: actor.sessionId, idempotencyKey: callId });
    }
}
//# sourceMappingURL=dispatcher.js.map