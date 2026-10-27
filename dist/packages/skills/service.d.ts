import type { Role, Actor, Row } from '../domain/types.js';
import type { AppContext } from '../domain/context.js';
import type { SkillPackageRevision, ReviewRecord, SkillRevocation, CapabilityRequirement, SkillRead, MethodRequirement } from './types.js';
type CatalogEntry = {
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
    requirements?: CapabilityRequirement;
};
/** Only explicit reviewed packages. Project .pi / AGENTS files are never discovered. */
export declare class SkillService {
    private root;
    private context?;
    readonly bundleId = "92adf4d0f0bfa17cd7c8ff8e00578d556c018feaa921ec31952c104fed70c6e1";
    constructor(root: string, context?: AppContext | undefined);
    private get c();
    private builtin;
    private builtinReleases;
    list(role: Role, builtinBundleId?: string): CatalogEntry[];
    private verifiedBytes;
    private verified;
    private builtinText;
    bundleMethodRequirements(pid: string, role: Role, bundleId: string): MethodRequirement[];
    private prerequisites;
    private contextualRead;
    read(role: Role, id: string, resource?: string, builtinBundleId?: string): SkillRead;
    bootstrap(role: Role): {
        bundleId: string;
        prompt: string;
        skills: {
            name: string;
            description: string;
            filePath: string;
            baseDir: string;
            source: string;
            disableModelInvocation: boolean;
        }[];
    };
    private bootstrapEntries;
    private owner;
    private revision;
    private resolveBundle;
    private disabledIds;
    private noCollisions;
    private approved;
    import(actor: Actor, pid: string, input: unknown, key: string): Row<SkillPackageRevision>;
    upload(actor: Actor, pid: string, input: unknown, key: string): {
        revision: Row<SkillPackageRevision>;
        configuration: {
            builtinBundleId: string;
            disabledBuiltinIds: string[];
            bundleId: string;
            revisionIds: string[];
            version: number;
        };
    };
    enable(actor: Actor, pid: string, value: unknown, key: string): {
        revision: Row<SkillPackageRevision>;
        configuration: {
            builtinBundleId: string;
            disabledBuiltinIds: string[];
            bundleId: string;
            revisionIds: string[];
            version: number;
        };
    };
    review(actor: Actor, pid: string, value: unknown, key?: string): Row<ReviewRecord>;
    revoke(actor: Actor, pid: string, value: unknown, key?: string): Row<SkillRevocation>;
    configuration(pid: string): {
        version: number;
        bundleId: string;
        builtinBundleId: string;
        revisionIds: string[];
        disabledBuiltinIds: string[];
    };
    private saveConfiguration;
    configure(actor: Actor, pid: string, value: unknown, key?: string): {
        builtinBundleId: string;
        disabledBuiltinIds: string[];
        bundleId: string;
        revisionIds: string[];
        version: number;
    };
    delete(actor: Actor, pid: string, value: unknown, key?: string): {
        builtinBundleId: string;
        disabledBuiltinIds: string[];
        bundleId: string;
        revisionIds: string[];
        version: number;
    };
    inspect(actor: Actor, pid: string, revisionId: string): {
        revision: Row<SkillPackageRevision>;
        reviews: Row<ReviewRecord>[];
        revocations: Row<SkillRevocation>[];
    };
    catalog(actor: Actor, pid: string): {
        configuration: {
            version: number;
            bundleId: string;
            builtinBundleId: string;
            revisionIds: string[];
            disabledBuiltinIds: string[];
        };
        builtinSkills: CatalogEntry[];
        builtinReleases: {
            bundleId: string;
            current: boolean;
            skillCount: number;
        }[];
        revisions: {
            revision: Row<SkillPackageRevision>;
            reviews: Row<ReviewRecord>[];
            revocations: Row<SkillRevocation>[];
        }[];
    };
    readRevision(actor: Actor, pid: string, revisionId: string, resource?: string): {
        revisionId: string;
        resource: string;
        digest: string;
        mediaType: "image/png";
        contentBase64: string;
        content?: undefined;
    } | {
        revisionId: string;
        resource: string;
        content: string;
        digest: string;
        mediaType?: undefined;
        contentBase64?: undefined;
    };
    private revisionBytes;
    private revisionText;
    private entry;
    bundleCatalog(pid: string, role: Role, bundleId: string): {
        bundleId: string;
        builtinBundleId: string;
        revisionIds: string[];
        skills: CatalogEntry[];
    };
    bundleRead(pid: string, role: Role, bundleId: string, id: string, resource?: string): SkillRead;
    bundleBootstrap(pid: string, role: Role, bundleId: string): {
        bundleId: string;
        prompt: string;
        skills: {
            name: string;
            description: string;
            filePath: string;
            baseDir: string;
            source: string;
            disableModelInvocation: boolean;
        }[];
    };
    ensureBundleStartAllowed(pid: string, bundleId: string): {
        bundleId: string;
        revisionIds: string[];
    };
}
export {};
