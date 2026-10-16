import type {ModelConfig,Row,SourceSnapshot} from '../domain/types.js';
import type {SandboxManifest,SandboxResources} from '../execution/contracts.js';

export interface WorkingGrant {
    threadLimit?:number;
    developmentTaskId:string; templateManifestDigest:string; sessionId:string; sourceRevisionId:string; model:ModelConfig;
    baselineSnapshot:SourceSnapshot; command:string[]; environmentImageDigest:string; dockerContext:string;
    resources:SandboxResources; dataArtifacts:SandboxManifest['dataArtifacts']; expectedArtifacts:string[];
    editablePaths:string[]; maxTests:number; maxChangedBytes:number; expiresAt:string;
    digest:string; approvalId:string; state:'draft'|'active'|'revoked'; activatedAt?:string; revokedAt?:string;
}
export interface WorkingGrantUse {
    grantId:string; grantDigest:string; grantApprovalId:string; developmentTaskId:string; manifestDigest:string; approvalId:string; jobId:string;
}
export type WorkingGrantDTO=Omit<Row<WorkingGrant>,'baselineSnapshot'|'dataArtifacts'>&{
    baselineSnapshot:Omit<SourceSnapshot,'path'>;
    dataArtifacts:Array<Omit<SandboxManifest['dataArtifacts'][number],'path'>>;
    effectiveState:'draft'|'active'|'expired'|'exhausted'|'revoked'|'stale'; validity:'current'|'stale'; reasons:string[];
    usage:{limit:number;used:number;remaining:number;unit:'test-submission'}; uses:Array<Row<WorkingGrantUse>>;
};
