import type { ResearchApp } from '../research-app.js';
import type { Actor, Row, Session, Task } from '../domain/types.js';
export interface SkillMissing {
    skillId: string;
    kind: 'tool' | 'backend' | 'artifact' | 'binding';
    value: string;
    reason: string;
}
/** A native Pi history is never silently upgraded to today's bundle. */
export declare function sessionSkillBundle(app: ResearchApp, s: Row<Session>): string;
export declare function resolveSkillBinding(app: ResearchApp, actor: Actor, pid: string): {
    session: Row<Session>;
    bundleId: string;
};
export declare function readCatalog(app: ResearchApp, actor: Actor, pid: string): {
    bundleId: string;
    builtinBundleId: string;
    revisionIds: string[];
    skills: {
        id: string;
        description: string;
        digest: string;
        resources: string[];
        source?: {
            repository: string;
            commit: string;
            path: string;
            blob: string;
        };
        revisionId?: string;
        requirements?: import("./types.js").CapabilityRequirement;
    }[];
};
export declare function readSkill(app: ResearchApp, actor: Actor, pid: string, id: string, resource?: string): import("./types.js").SkillRead;
export declare function prepareTaskSkills(app: ResearchApp, task: Row<Task>, preparedSession?: Row<Session>): string;
export declare function prepareSessionSkills(app: ResearchApp, s: Row<Session>, actor?: Actor): string;
export declare function inspectSessionSkills(app: ResearchApp, actor: Actor, pid: string, sessionId: string): {
    sessionId: string;
    version: number;
    skillBundleId: string | null;
    skillIds: string[];
    ready: boolean;
    missing: SkillMissing[];
};
export declare function selectSessionSkills(app: ResearchApp, actor: Actor, pid: string, value: unknown): {
    sessionId: string;
    version: number;
    skillBundleId: string | null;
    skillIds: string[];
    ready: boolean;
    missing: SkillMissing[];
};
