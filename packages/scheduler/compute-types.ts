export type ComputeKind='run'|'development'|'document';
export interface ComputeLimits {maxRuns:number;maxDevelopment:number;maxJobs:number;cpus:number|null;memoryMb:number|null;maxQueued:number|null;}
export interface ComputeUsage {jobs:number;runs:number;development:number;documents:number;cpus:number;memoryMb:number;unknown:number;}
export interface ComputeAvailable {jobs:number;runs:number;development:number;documents:number;cpus:number|null;memoryMb:number|null;}
export type ComputeWaitReason='ready'|'worker_active'|'recovery_due'|'target_unresolved'|'target_unavailable'|'target_changed'|'legacy_target_unknown'|'request_too_large'|'host_capacity'|'target_capacity'|'earlier_job'|'recovery_backoff'|'manual_recovery_required';
export interface ComputeQueueItem {kind:ComputeKind;id:string;projectId:string;sequence:number;state:string;held:boolean;backend:'docker'|'trusted-example';targetId:string|null;requested:{cpus:number;memoryMb:number};generation:number;leaseUntil:number;nextAttemptAt:number;reason:ComputeWaitReason;}
export interface ComputeConfiguration {version:number;targetId:string;limits:ComputeLimits;}
export interface ComputeTargetProbe {context:string;targetId:string;backend:'docker';observedAt:string;}
export interface ComputeQueueInspection {
    scope:'shared-data-directory';configuration:ComputeConfiguration;usage:ComputeUsage;available:ComputeAvailable;queued:number;
    targets:Array<{targetId:string;backend:'docker'|'trusted-example';contexts:string[];configuration:ComputeConfiguration;usage:ComputeUsage;available:ComputeAvailable}>;
    items:ComputeQueueItem[];nextCursor:number|null;
}
