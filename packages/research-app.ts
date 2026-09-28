import {OperationRegistry} from './contracts/operations/registry.js';
import {TextEvidenceService} from './text-evidence/service.js';
import {SkillService} from './skills/service.js';
import {ConnectorService} from './connectors/service.js';
import { ChangeProposalService } from './workspace/change-proposals.js';
import { WakeupService } from './scheduler/wakeups.js';
import { DecisionService } from './research-workflows/decision-service.js';
import { CampaignService } from './research-workflows/campaign-service.js';
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
    readonly operations: OperationRegistry;
    readonly textEvidence: TextEvidenceService;
    readonly skills: SkillService;
    readonly connectors: ConnectorService;
    readonly changes: ChangeProposalService;
    readonly wakeups: WakeupService;
    readonly decisions: DecisionService;
    readonly campaigns: CampaignService;
    readonly literature: LiteratureService;
    readonly reports: ReportService;
    readonly sessions: SessionService;
    readonly teams: TeamService;
    readonly store: Store;
    readonly projects: ProjectService;
    readonly experiments: ExperimentService;
    readonly approvals: ApprovalService;
    readonly evidence: EvidenceService;
    readonly runs: RunService;
    readonly budget: BudgetService;
    readonly context;
    private closed = false;
    constructor(dataDir: string, repoRoot: string) { dataDir = resolve(dataDir); repoRoot = resolve(repoRoot); mkdirSync(dataDir, { recursive: true, mode: 0o700 }); this.store = new Store(join(dataDir, 'state.db')); this.skills = new SkillService(repoRoot); this.context = { store: this.store, dataDir, repoRoot }; this.projects = new ProjectService(this.context); this.approvals = new ApprovalService(this.context); this.evidence = new EvidenceService(this.context); this.connectors = new ConnectorService(this.context,this.evidence); this.budget = new BudgetService(this.store); this.experiments = new ExperimentService(this.context, this.projects); this.runs = new RunService(this.context, this.approvals, this.evidence); this.sessions = new SessionService(this.context); this.teams = new TeamService(this.context, this.sessions, this.approvals, this.budget, this.evidence); this.reports = new ReportService(this.context, this.evidence); this.literature = new LiteratureService(this.context); this.campaigns = new CampaignService(this); this.decisions = new DecisionService(this); this.wakeups = new WakeupService(this); this.changes = new ChangeProposalService(this); this.textEvidence = new TextEvidenceService(this); this.operations = new OperationRegistry(this); }
    close() {
        if (!this.closed) {
            this.closed = true;
            this.store.close();
        }
    }
}
