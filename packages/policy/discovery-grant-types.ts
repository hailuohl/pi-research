import type {ModelConfig,Row} from '../domain/types.js';
import type {SearchInput,SourceId} from '../connectors/contracts.js';
import type {SearchRecord} from '../connectors/service.js';
import type {DocumentAcquireInput} from '../documents/types.js';

export interface DiscoveryGrantReference {id:string;digest:string;approvalId:string;}
export interface DiscoveryTaskBinding {taskId:string;teamId:string;teamApprovalId:string;planDigest:string;planVersion:number;directiveVersion:number;taskSpecDigest:string;teamPlanId:string;teamPlanVersion:number;teamPlanDigest:string;role:'literature';}
export interface DiscoveryGrant {
 sessionId:string;taskBinding?:DiscoveryTaskBinding;model:ModelConfig;settingsVersion:number;sources:SourceId[];searches:SearchInput[];targets:DocumentAcquireInput[];
 allowSearchResults:boolean;formats:Array<'provider-text'|'original-pdf'>;maxRequests:number;maxResponseBytes:number;expiresAt:string;
 approvalId:string;digest:string;state:'draft'|'active'|'revoked';activatedAt?:string;revokedAt?:string;
}
export interface DiscoveryCall {
 source:SourceId;host:string;status:'reserved'|'succeeded'|'failed-or-unknown';startedAt:string;
 discoveryGrant?:DiscoveryGrantReference;scopeSessionId?:string;scopeTaskId?:string;scopeAttemptId?:string;scopeGeneration?:number;requestDigest?:string;operationKeyDigest?:string;requestUrlDigest?:string;
 bytes?:number;httpStatus?:number;retryAfter?:string|null;error?:string;
}
export interface DiscoveryPaper {
 source:SourceId;idInSource:string;requestedId?:string;title:string;artifactId:string;artifactDigest:string;rawArtifactIds:string[];
 contentKind:string;fullTextRead:boolean;retrievedAt:string;discoveryGrant?:DiscoveryGrantReference;
}
export type DiscoveryGrantDTO=Row<DiscoveryGrant>&{
 effectiveState:'draft'|'active'|'expired'|'exhausted'|'revoked'|'stale';validity:'current'|'stale';reasons:string[];
 usage:{limit:number;used:number;remaining:number;unit:'http-request-attempt'};
 calls:Array<Row<DiscoveryCall>>;searchResults:Array<Row<SearchRecord>>;papers:Array<Row<DiscoveryPaper>>;
};
export type DiscoveryOperation={kind:'search';search:SearchInput}|{kind:'retrieve';target:DocumentAcquireInput};
export interface DiscoveryContext {reference:DiscoveryGrantReference;sessionId:string;taskId?:string;attemptId?:string;generation?:number;operation:DiscoveryOperation;operationKey:string;callIds:string[];}
