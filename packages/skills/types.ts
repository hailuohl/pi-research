import type {Role} from '../domain/types.js';

export interface CapabilityRequirement {tools:string[];backends:string[];artifactIds:string[]}
export interface SkillPackageRevision {
    packageId:string;
    revisionTag:string;
    description:string;
    roles:Role[];
    license:string|null;
    requirements:CapabilityRequirement;
    files:Array<{path:string;digest:string;size:number;mediaType?:'image/png'}>;
    contentDigest:string;
    authorization:'text-only'|'text-with-static-assets';
}
export interface ReviewRecord {revisionId:string;contentDigest:string;decision:'approved'|'rejected';note:string}
export interface SkillRevocation {revisionId:string;contentDigest:string;note:string}
export interface SkillBundle {builtinBundleId:string;revisionIds:string[];contentDigest:string}
export interface SkillConfiguration {bundleId:string;revisionIds:string[]}
