import type { Actor, Approval, Row, Session, RunIntent } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import type { PermissionReference } from './session-permissions.js';
import type { CampaignDecision } from '../research-workflows/types.js';
import type { ResearchContinuation } from './research-automation.js';
export interface AutomaticApprovalReference {
    scopeVersion: 1;
    rootSessionId: string;
    originMessageId: string;
    originDigest: string;
    permission: PermissionReference;
    runtimeId: string;
    modelDigest: string;
    lifecycleEpoch: number;
    sourceRevisionId?: string;
    subjectKind: string;
    subjectId: string;
    subjectDigest: string;
    subjectScope: string;
    requestDigest: string;
    digest: string;
}
export interface AutomaticExecution {
    state: 'completed' | 'failed' | 'unknown' | 'needs_attention' | 'waiting';
    reason?: string;
}
type Subject = {
    subjectKind: string;
    subjectId: string;
    digest: string;
    scope: string;
};
export declare class AutomaticApprovalService {
    private app;
    constructor(app: ResearchApp);
    continuationTools(sessionId: string): string[];
    isContinuation(actor: Actor): boolean;
    coordinator(actor: Actor, pid: string, s: Row<Session>): Row<Session>;
    private origin;
    reference(actor: Actor, subject: Subject, request: unknown): AutomaticApprovalReference | undefined;
    assert(ref: AutomaticApprovalReference, current?: boolean): void;
    /** Only explicit host-delegated service entries receive this identity, after exact proof validation. */
    delegate(actor: Actor, ref: AutomaticApprovalReference, subjectKind: string, subjectId: string): Actor;
    integratedExperiment(c: import('./research-automation.js').ResearchContinuation, id: string): boolean;
    assertApproval(a: Row<Approval>): void;
    approve(actor: Actor, a: Row<Approval>, request: unknown): Row<Approval> | undefined;
    private execution;
    private effect;
    bindDecisionRun(c: Row<ResearchContinuation>, ref: AutomaticApprovalReference, d: Row<CampaignDecision>, intent: Row<RunIntent>): {
        digest: string;
        continuationId: string;
        continuationDigest: string;
        decisionId: string;
        decisionApprovalId: string;
        decisionDigest: string;
        decisionProofDigest: string;
        campaignId: string;
        roundId: string;
        parentSource: {
            snapshotId: string;
            experimentId: string;
            revision: number;
            sourceDigest: string;
        };
        experimentId: string;
        experimentRevision: number;
        intentId: string;
        approvalId: string;
        manifestDigest: string;
        contractDigest: string;
        sourceDigest: string;
    };
    private assertDecisionBinding;
    decisionExperiment(c: ResearchContinuation, id: string): boolean;
    assertDecisionRun(c: ResearchContinuation, a: Row<Approval>, current: boolean): void;
    private decisionCompletion;
    decisionRunConsumed(a: Row<Approval>): void;
    preparedDecisionWait(intentId: string): "等待本任务在途或未知计算终态；准确候选保持自动批准，不消费新的续接尝试" | "前次计算结果或归档不完整，保留真实阻断，不派发新的计算续接" | undefined;
    private continueDecision;
    postPrepare(actor: Actor, operation: string, input: Record<string, unknown>, value: unknown, preparedAfter: number): unknown;
}
export {};
