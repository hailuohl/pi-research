import type { Actor, Role, Row, Session } from '../domain/types.js';
export declare function userOnly(actor: Actor): void;
export declare function scope(actor: Actor, projectId: string): void;
export declare function interactiveCoordinator(actor: Actor, projectId: string, session: Row<Session>): Row<Session>;
export declare const ROLE_TOOLS: Record<Role, string[]>;
export declare function toolAllowed(actor: Actor, name: string): void;
/** An automatic root pass is narrower than the interactive coordinator. */
export declare const AUTOMATION_TOOLS: string[];
