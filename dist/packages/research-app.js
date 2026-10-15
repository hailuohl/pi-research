import { ResearchActionService } from './research-workflows/actions.js';
import { ResearchAutomationService } from './policy/research-automation.js';
import { LocalRuntimeService } from './runners/local-runtime.js';
import { ComputeConnectionMonitor } from './runners/compute-connections.js';
import { NativeRequestService } from './pi-adapter/native-requests.js';
import { GpuService } from './runners/gpu.js';
import { HostAccessService } from './policy/host-access.js';
import { SessionPermissionService } from './policy/session-permissions.js';
import { SshTargetService } from './runners/ssh-targets.js';
import { ModelHttpService } from './scheduler/model-http.js';
import { PublicationBuildService } from './publications/build-service.js';
import { PublicationTemplateLibrary } from './publications/template-library.js';
import { DiscoveryGrantService } from './policy/discovery-grants.js';
import { TextCorpusGrantService } from './policy/text-corpus-grants.js';
import { WorkingGrantService } from './policy/working-grants.js';
import { RunGrantService } from './policy/run-grants.js';
import { PublicationReviewService } from './publications/reviews.js';
import { prepareTaskSkills } from './skills/runtime.js';
import { DevelopmentReviewService } from './development/reviews.js';
import { DocumentService } from './documents/service.js';
import { DocumentParsingService } from './documents/parse-service.js';
import { LiteratureTaskService } from './literature/tasks.js';
import { ExportService } from './publications/export.js';
import { GitHubUploadService } from './workspace/github-upload.js';
import { ComputeQueue } from './scheduler/compute-queue.js';
import { AgentAdmissionService } from './scheduler/agent-admission.js';
import { GitService } from './workspace/git-service.js';
import { DevelopmentService } from './development/service.js';
import { ExecutionService } from './execution/service.js';
import { SourceAccessService } from './workspace/source-access.js';
import { OperationRegistry } from './contracts/operations/registry.js';
import { TextEvidenceService } from './text-evidence/service.js';
import { SkillService } from './skills/service.js';
import { ConnectorService } from './connectors/service.js';
import { ChangeProposalService } from './workspace/change-proposals.js';
import { WakeupService } from './scheduler/wakeups.js';
import { DecisionService } from './research-workflows/decision-service.js';
import { CampaignService } from './research-workflows/campaign-service.js';
import { ResearchBriefService } from './research-workflows/briefs.js';
import { ResearchPlanService } from './research-workflows/plans.js';
import { ReportService } from './publications/reports.js';
import { LiteratureService } from './literature/service.js';
import { SessionService } from './pi-adapter/sessions.js';
import { TeamService } from './collaboration/team-service.js';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { Store } from './storage/store.js';
import { ProjectService } from './workspace/projects.js';
import { ExperimentService } from './workspace/experiments.js';
import { ApprovalService } from './policy/approvals.js';
import { BudgetService } from './policy/budget.js';
import { EvidenceService } from './evidence/service.js';
import { RunService } from './runners/service.js';
export class ResearchApp {
    researchActions;
    computeMonitor;
    nativeRequests;
    localRuntimes;
    gpus;
    sessionPermissions;
    hostAccess;
    discoveryGrants;
    textCorpusGrants;
    workingGrants;
    runGrants;
    publicationBuilds;
    publicationTemplates;
    publicationReviews;
    documents;
    documentParsing;
    literatureTasks;
    compute;
    agentAdmission;
    modelHttp;
    exports;
    github;
    git;
    development;
    developmentReviews;
    execution;
    sources;
    operations;
    textEvidence;
    skills;
    connectors;
    changes;
    wakeups;
    decisions;
    campaigns;
    researchPlans;
    researchBriefs;
    literature;
    reports;
    sessions;
    teams;
    store;
    projects;
    experiments;
    approvals;
    evidence;
    runs;
    sshTargets;
    budget;
    context;
    closed = false;
    closing;
    researchAutomation;
    constructor(dataDir, repoRoot) { dataDir = resolve(dataDir); repoRoot = resolve(repoRoot); mkdirSync(dataDir, { recursive: true, mode: 0o700 }); this.store = new Store(join(dataDir, 'state.db')); this.context = { store: this.store, dataDir, repoRoot }; this.skills = new SkillService(repoRoot, this.context); this.compute = new ComputeQueue(this.context); this.localRuntimes = new LocalRuntimeService(this.context); this.gpus = new GpuService(this.context); this.sshTargets = new SshTargetService(this.context); this.agentAdmission = new AgentAdmissionService(this.context); this.modelHttp = new ModelHttpService(this.store); this.projects = new ProjectService(this.context); this.approvals = new ApprovalService(this.context); this.evidence = new EvidenceService(this.context); this.researchBriefs = new ResearchBriefService(this); this.connectors = new ConnectorService(this.context, this.evidence); this.documents = new DocumentService(this.context, this.evidence, this.connectors); this.budget = new BudgetService(this.store); this.experiments = new ExperimentService(this.context, this.projects, this.researchBriefs); this.runs = new RunService(this.context, this.approvals, this.evidence, this.compute, this.researchBriefs, this.budget); this.sessions = new SessionService(this.context); this.teams = new TeamService(this.context, this.sessions, this.approvals, this.budget, this.evidence); this.reports = new ReportService(this.context, this.evidence, this); this.exports = new ExportService(this.context, this.reports, this.evidence); this.literature = new LiteratureService(this.context); this.campaigns = new CampaignService(this); this.researchPlans = new ResearchPlanService(this); this.runs.researchSourceGuard = (id, stage, intentId) => this.researchPlans.assertRunSource(id, stage, intentId); this.decisions = new DecisionService(this); this.wakeups = new WakeupService(this); this.changes = new ChangeProposalService(this); this.textEvidence = new TextEvidenceService(this); this.workingGrants = new WorkingGrantService(this); this.runGrants = new RunGrantService(this); this.development = new DevelopmentService(this); this.execution = new ExecutionService(this); this.sources = new SourceAccessService(this); this.git = new GitService(this); this.github = new GitHubUploadService(this); this.developmentReviews = new DevelopmentReviewService(this); this.teams.skillPreflight = task => prepareTaskSkills(this, task); this.publicationReviews = new PublicationReviewService(this); this.teams.reviewValidator = task => { this.developmentReviews.assertTaskCurrent(task); this.publicationReviews.assertTaskCurrent(task); }; this.documentParsing = new DocumentParsingService(this); this.publicationBuilds = new PublicationBuildService(this); this.publicationTemplates = new PublicationTemplateLibrary(this); this.literatureTasks = new LiteratureTaskService(this); this.discoveryGrants = new DiscoveryGrantService(this); this.textCorpusGrants = new TextCorpusGrantService(this); this.hostAccess = new HostAccessService({ ...this.context, sessionHeld: id => this.agentAdmission.sessionHeld(id) }); this.sessionPermissions = new SessionPermissionService(this); this.researchAutomation = new ResearchAutomationService(this); this.researchActions = new ResearchActionService(this); this.approvals.onDecided = a => this.wakeups.approvalDecided(a); this.approvals.proofGuard = a => { this.researchAutomation.assertApproval(a); }; this.sessions.onStop = (id, reason) => this.researchAutomation.cancelSession(id, reason); this.sessions.parsedAttachmentMetadata = (actor, session, pair) => this.documentParsing.attachmentMetadata(actor, session, pair); this.sessions.permissionCapture = id => this.sessionPermissions.capture(id); this.sessions.taskPermissionCapture = id => this.sessionPermissions.capture(id, true); this.sessions.permissionBranch = (original, id) => { const p = this.sessionPermissions.capture(original, true); this.sessionPermissions.initialize(id, p.mode === 'legacy' ? 'confirm' : p.mode); }; this.hostAccess.onChanged = (id, previousHostEpoch) => { if (previousHostEpoch !== undefined)
        this.sessionPermissions.hostAccessEnabled(id, previousHostEpoch); this.sessionPermissions.stale(id); this.researchAutomation.cancelSession(id, '会话权限已改变'); }; this.experiments.automation = this.researchAutomation; this.runs.automation = this.researchAutomation; this.runs.permissionCapture = (actor, execution) => actor.type === 'agent' ? this.sessionPermissions.captureJob(actor, execution) : undefined; this.runs.permissionGuard = (permission, execution, sessionId) => this.sessionPermissions.assertJob(permission, execution, sessionId); this.runs.permissionForSession = id => this.sessionPermissions.capture(id); this.operations = new OperationRegistry(this); this.computeMonitor = new ComputeConnectionMonitor(this); this.nativeRequests = new NativeRequestService(this); }
    close() {
        if (this.closing)
            return this.closing;
        if (this.closed)
            return;
        const pendingNative = this.nativeRequests.hasPending, monitor = this.computeMonitor.stop(), native = this.nativeRequests.shutdown();
        this.closed = true;
        const finish = () => { this.hostAccess.close(); this.store.close(); };
        if (pendingNative) {
            this.closing = Promise.all([monitor, native]).then(finish);
            return this.closing;
        }
        // CLI/tests without in-flight native calls retain immediate SQLite/file-handle closure.
        finish();
    }
}
//# sourceMappingURL=research-app.js.map