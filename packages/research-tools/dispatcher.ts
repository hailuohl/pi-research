import type {ResearchApp} from '../research-app.js';
import type {Actor,Session} from '../domain/types.js';
import {CONTINUATION_TOOLS,APPROVAL_RESUME_TOOLS} from '../policy/research-automation.js';
import {ROLE_TOOLS, AUTOMATION_TOOLS} from '../policy/permissions.js';
import {TOOL_DEFINITIONS} from './definitions.js';
export class ToolDispatcher {
    constructor(private app: ResearchApp) {}
    definitions(role: NonNullable<Actor['role']>, automation = false,sessionId?:string,continuation=false,approvalResume=false) {
        // Calls without a session inspect static role capabilities before task dispatch.
        const taskContext=sessionId===undefined||!!this.app.store.maybe<Session>('session',sessionId)?.taskId;
        return (ROLE_TOOLS[role] ?? []).filter(name => TOOL_DEFINITIONS[name] && (!automation || (continuation?CONTINUATION_TOOLS:approvalResume?APPROVAL_RESUME_TOOLS:AUTOMATION_TOOLS).includes(name))&&(name!=='task_context_read'||taskContext)&&(name!=='host_execute'||!!sessionId&&this.app.hostAccess.canExpose(sessionId,automation))).map(name => ({name, ...TOOL_DEFINITIONS[name]}));
    }
    authorize(actor: Actor, name: string) { return this.app.operations.authorizeAgent(actor, name); }
    async execute(actor: Actor, name: string, raw: unknown, callId: string) {
        return this.app.operations.execute(actor, name, raw, {projectId: actor.projectId!, sessionId: actor.sessionId, idempotencyKey: callId});
    }
}
