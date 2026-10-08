import type { ModelSelection, ModelApi, NativeProfile, EffectiveCapability, ModelDefinitionInput } from './model-management-types.js';
import type { NativeResponse } from './native-response.js';
export interface NativeSourcePick {
    kind: 'document' | 'media';
    id: string;
}
export interface NativeSource extends NativeSourcePick {
    artifactId: string;
    title: string;
    digest: string;
    size: number;
    mediaType: 'application/pdf' | 'video/mp4';
    scope: 'whole-file';
}
export type NativeState = 'pending' | 'approved' | 'rejected' | 'stale' | 'running' | 'completed' | 'incomplete' | 'failed' | 'cancelled' | 'unknown';
export interface NativeAvailability {
    api: ModelApi | null;
    profile: NativeProfile;
    pdf: EffectiveCapability;
    video: EffectiveCapability;
    nativeWebSearch: EffectiveCapability;
    maxOutputTokens?: number;
    reason?: string;
}
export type NativePublicResponse = Omit<NativeResponse, 'continuation'>;
export interface NativeRequestView {
    id: string;
    version: number;
    projectId: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    prompt: string;
    model: ModelSelection;
    destination: {
        baseUrl: string;
        api: ModelApi;
        profile: NativeProfile;
    };
    sources: NativeSource[];
    search: boolean;
    maxOutputTokens: number;
    expiresAt: string;
    state: NativeState;
    dispatchBudget: 1;
    dispatched: 0 | 1;
    previousRequestId?: string;
    approval: {
        id: string;
        version: number;
        status: 'pending' | 'approved' | 'rejected' | 'stale';
        reason: string;
    };
    response: NativePublicResponse | null;
    receipt: null | {
        artifactId: string;
        digest: string;
    };
    continuationAvailable: boolean;
    error?: string;
}
export interface NativeRequestList {
    requests: NativeRequestView[];
    sources: NativeSource[];
    availability: NativeAvailability;
    nextCursor: number | null;
}
export interface NativePrepareInput {
    expectedSessionVersion: number;
    prompt: string;
    sources: NativeSourcePick[];
    search: boolean;
    maxOutputTokens: number;
    previousRequestId?: string;
}
export interface NativeDecisionInput {
    expectedVersion: number;
    expectedApprovalVersion: number;
    approved: boolean;
}
/** One protocol/profile matrix shared by model management and owner request preparation. */
export declare function nativeAvailability(api: ModelApi | null, model: ModelDefinitionInput | undefined): NativeAvailability;
