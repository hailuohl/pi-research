import type { Campaign, ResearchRound, CampaignMember, RunObservation, CampaignDecision } from '../../../dist/packages/research-workflows/types.js';
import type { Wakeup } from '../../../dist/packages/scheduler/wakeups.js';
import type {ComputeQueueInspection} from '../../../dist/packages/scheduler/compute-types.js';
import type {AgentCapacityDTO} from '../../../dist/packages/scheduler/agent-admission.js';
export type {ComputeQueueInspection,ComputeLimits,ComputeConfiguration,ComputeQueueItem,ComputeWaitReason,ComputeUsage,ComputeAvailable} from '../../../dist/packages/scheduler/compute-types.js';
export type {AgentCapacityDTO} from '../../../dist/packages/scheduler/agent-admission.js';
export type { Campaign, ResearchRound, CampaignMember, RunObservation, CampaignDecision, Wakeup };
import type { Row, Project, Session, Message, Experiment, Run, RunIntent, Approval, Team, Task, Artifact, Evidence, Claim, ChangeProposal, ModelConfig } from '../../../dist/packages/domain/types.js';
export type { Row, Project, Session, Message, Experiment, Run, RunIntent, Approval, Team, Task, Artifact, Evidence, Claim, ChangeProposal, ModelConfig };
export interface DevelopmentManifestDTO {
    command:string[]; environmentImageDigest:string; dockerContext:string; deadline:string;
    resources:Record<string,number>; expectedArtifacts:string[]; sourceRevisionId?:string;
}
export interface DevelopmentTaskDTO {
    id:string; sessionId:string; title:string; sourceDigest:string; grantId:string;
    state:string; jobId?:string; manifest:DevelopmentManifestDTO;
}
export interface SandboxJobDTO {
    id:string; jobId?:string; developmentTaskId:string; sessionId:string; sourceDigest:string;
    state:string; integrity:string; exitCode?:number|null; error?:string; artifactIds:string[];
    manifest:DevelopmentManifestDTO;
}
export interface DevelopmentReviewDTO {
    id:string; jobId:string; sourceDigest:string; producerSessionId:string;
    teamId:string; taskId:string; approvalId:string;
    status:'awaiting_approval'|'pending'|'running'|'passed'|'rejected'|'disputed'|'failed'|'stale';
}
export interface ReportReference {
    id:string; type:'run'|'run-source'|'artifact'|'evidence'|'development-job'|'development-review'|'claim';
    targetId:string; label:string; runId?:string; path?:string; digest?:string; relation?:'exact'|'ancestry';
}
export interface ReportRecord {id:string;artifactId:string;runIds:string[];claimIds:string[];evidenceIds?:string[];}
export interface ReportInspection {
    id:string;artifactId:string;title:string;formatVersion:0|1;integrity:'verified'|'invalid';validity:'current'|'stale'|'legacy';reasons:string[];references:ReportReference[];
    runs:Array<{runId:string;experimentId:string;revision:number;state:string;integrity:string;judgment:string;sourceDigest:string;gitCommit?:string;metrics:Array<{name:string;value:number;unit:string;referenceId:string}>}>;
}
export interface ProjectState {
    compute?:ComputeQueueInspection;
    agentCapacity?:AgentCapacityDTO;
    developmentTasks?:DevelopmentTaskDTO[];
    sandboxJobs?:SandboxJobDTO[];
    reviews?:DevelopmentReviewDTO[];
    textEvidence?: {enabled:boolean;version:number;corpusId?:string|null;sources:Array<{artifactId:string;title:string;digest:string}>};
    project: Row<Project>;
    sessions: Row<Session>[];
    experiments: Row<Experiment>[];
    runs: Row<Run>[];
    intents: Row<RunIntent>[];
    approvals: Row<Approval>[];
    teams: Row<Team>[];
    tasks: Row<Task>[];
    artifacts: Row<Artifact>[];
    evidence: Row<Evidence>[];
    claims: Row<Claim>[];
    reports: ReportRecord[];
    changeProposals: Row<ChangeProposal>[];
    searches: any[];
    usage: any[];
    budgets: any[];
    campaigns: Row<Campaign>[];
    rounds: Row<ResearchRound>[];
    members: Row<CampaignMember>[];
    observations: Row<RunObservation>[];
    decisions: Row<CampaignDecision>[];
    wakeups: Row<Wakeup>[];
}
export interface Bootstrap {
    version: string;
    projects: Row<Project>[];
    model: ModelConfig;
    runtime: {
        ready: boolean;
        code: string;
        message: string;
        activeWorkers: number;
        expectedVersion: string;
        installedVersion: string | null;
        node: string;
        maxModelWorkers: number;
    };
    capabilities: Array<{
        id: string;
        name: string;
        stage: string;
        status: string;
        verification: string;
        notes: string;
    }>;
}
export const short = (id: string | undefined | null) => id ? id.slice(0, 8) : '—';
export const number = (value: number | undefined) => value === undefined ? '—' : Math.abs(value) < 0.001 ? value.toExponential(3) : value.toFixed(5);
export const date = (value: string) => new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const names: Record<string, string> = { draft: '草案', stopped: '已停止', proposed: '待批准提案', applied: '已应用', repair: '原节点修复', refill: '补充候选', promote: '晋级下一轮', stop: '停止研究', open: '进行中', closed: '已结束', decided: '已决策', pending: '待处理', queued: '排队中', running: '运行中', succeeded: '执行成功', failed: '失败', cancelled: '已取消', cancelling: '取消中', unknown: '待对账', provisional: '准备中', frozen: '已冻结', archived: '已归档', complete: '完整', incomplete: '不完整', invalid: '无效', accepted: '已验收', rejected: '未通过', disputed: '有争议', output_submitted: '已提交成果', waiting_user: '待人工处理', superseded: '旧版本', blocked: '已阻塞', awaiting_approval: '待批准', active: '进行中', paused: '已暂停', draining: '正在收尾', completed: '已完成', partial: '部分完成', approved: '已批准', stale: '已失效', idle: '空闲', interrupted: '已中止', waiting: '等待中', literature: '文献', designer: '设计', implementer: '实现', analyst: '分析', reviewer: '审查', writer: '写作', coordinator: '主协调者', proposal: '候选', implemented: '已实现', verified: '已实测', integration_unverified: '待真实接入验证', not_implemented: '未实现' };
export const label = (value: string) => names[value] ?? value;
export function comparisonMetric(data:ProjectState,selected:string) {
    const e=data.experiments.find(e=>e.id===selected)??data.experiments[0];
    const definitions=e?.contract?.metrics??data.runs.find(r=>r.manifest.contractDigest===e?.contractDigest)?.manifest.contract?.metrics;
    const key=Object.keys(definitions??{})[0]??'mse'; // compatibility for legacy fixtures without a contract
    return {key,unit:definitions?.[key]?.unit??'',direction:definitions?.[key]?.direction??'min',contractDigest:e?.contractDigest};
}
export function comparableRuns(data:ProjectState,selected:string) {
    const m=comparisonMetric(data,selected);
    return data.runs.filter(r=>r.state==='succeeded'&&r.integrity==='complete'&&Number.isFinite(r.metrics?.[m.key])&&r.manifest.contractDigest===m.contractDigest);
}
