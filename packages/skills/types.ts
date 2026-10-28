import type {Role} from '../domain/types.js';

export interface CapabilityRequirement {tools:string[];backends:string[];artifactIds:string[]}
export interface SkillPrerequisite {skillId:string;resource?:string}
export type MethodRequirement='literature-identity'|'quantitative-decision'|'structured-paired-protocol'|'closed-paired-evidence';
export interface SkillText {id:string;resource:string;content:string;digest:string;bundleId:string;source?:{repository:string;commit:string;path:string;blob:string};methodRequirements?:string[]}
export interface SkillRead extends SkillText {prerequisites?:SkillText[]}
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
export interface SkillDeletion {revisionId:string;contentDigest:string}
export interface SkillBundle {builtinBundleId:string;revisionIds:string[];disabledBuiltinIds?:string[];contentDigest:string}
export interface SkillConfiguration {bundleId:string;revisionIds:string[]}
