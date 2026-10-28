import type { Role } from '../domain/types.js';
import type { SkillPrerequisite } from './types.js';
interface ArchivedSkill {
    id: string;
    name: string;
    description: string;
    path: string;
    digest: string;
    roles: readonly Role[];
    resources: readonly {
        path: string;
        digest: string;
        methodRequirements?: readonly string[];
    }[];
    source?: {
        repository: string;
        commit: string;
        path: string;
        blob: string;
    };
    prerequisites?: readonly SkillPrerequisite[];
}
interface ArchivedRelease {
    bundleId: string;
    manifestDigest: string;
    skills: readonly ArchivedSkill[];
}
export declare const BUILTIN_RELEASES: readonly ArchivedRelease[];
export {};
