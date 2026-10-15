import type {ResearchPlanService} from '../research-workflows/plans.js';
import type {PublicationReviewInspection,PublicationReviewSnapshot} from './reviews-types.js';
import type {ManuscriptRevision,PublicationBuildResult,PublicationManifest} from './build-types.js';
import type {Run,SourceSnapshot,Row} from '../domain/types.js';
import type {DocumentVersion,DocumentEvidenceLink,ProviderTextEvidenceLink} from '../documents/types.js';
import type {DocumentParseResult,DocumentParseManifest} from '../documents/parse-types.js';
export interface ReportReference {
    id:string;type:'run'|'run-source'|'artifact'|'evidence'|'development-job'|'development-review'|'claim'|'publication'|'figure-source'|'figure-source-code'|'publication-review'|'research-comparison'|'experiment-plan';targetId:string;label:string;
    runId?:string;path?:string;digest?:string;relation?:'exact'|'ancestry';
    document?:DocumentEvidenceLink&{start:number;end:number;pageLabel:string|null;rawArtifactId:string;imageArtifactId:string};
    providerText?:ProviderTextEvidenceLink&{start:number;end:number;rawArtifactId:string;textArtifactId:string};
}
export interface ReportRun {
    runId:string;experimentId:string;revision:number;state:Run['state'];integrity:Run['integrity'];judgment:Run['judgment'];sourceDigest:string;gitCommit?:string;
    metrics:Array<{name:string;value:number;unit:string;referenceId:string}>;
}
export interface ReportPublication {resultId:string;revisionId:string;jobId:string;title:string;sourceDigest:string;pdfArtifactId:string;pdfDigest:string;pages:number;referenceId:string;}
export interface ReportResearchCampaign {campaignId:string;state:string;primaryMetric:string;unit:string;conclusion:'requires_review';referenceId:string;planReferences:Array<{planRevisionId:string;referenceId:string}>;}
export interface ReportInspection {
    researchCampaigns?:ReportResearchCampaign[];
    publications?:ReportPublication[];
    publicationReviews?:Array<{resultId:string;reviewIds:string[];reviews:Array<PublicationReviewInspection&{referenceId:string}>}>;
    id:string;artifactId:string;title:string;formatVersion:0|1;integrity:'verified'|'invalid';validity:'current'|'stale'|'legacy';reasons:string[];references:ReportReference[];runs:ReportRun[];
}
export interface ReportBindings {
    providerTexts?:Array<{documentVersionId:string;documentDigest:string;document:Row<DocumentVersion>}>;
    researchCampaigns?:Array<{campaignId:string;snapshot:ReturnType<ResearchPlanService['reportSnapshot']>;snapshotDigest:string;referenceId:string;planReferences:Array<{planRevisionId:string;referenceId:string}>}>;
    publicationReviews?:Array<{resultId:string;reviewIds:string[];reviews:Array<{snapshot:PublicationReviewSnapshot;snapshotDigest:string;referenceId:string}>}>;
    publications?:Array<{resultId:string;resultDigest:string;revisionId:string;revisionDigest:string;revision:ManuscriptRevision;result:PublicationBuildResult;compiler:Pick<PublicationManifest,'profileId'|'profileDigest'|'lockDigest'|'scriptDigest'|'dockerfileDigest'|'environmentImageDigest'|'command'|'resources'>&{imageId:string;approvalId:string};referenceId:string}>;
    figureSources?:Array<{jobId:string;manifestDigest:string;sourceDigest:string;files:SourceSnapshot['files'];artifactIds:string[];dataArtifacts:Array<{id:string;digest:string;size:number;sourceAcceptanceId?:string}>}>;
    documents?:Array<{documentVersionId:string;documentDigest:string;parseResultId:string;resultDigest:string;document:DocumentVersion;result:DocumentParseResult;parser:Pick<DocumentParseManifest,'profileId'|'profileDigest'|'lockDigest'|'scriptDigest'|'environmentImageDigest'|'resources'>&{approvalId:string}}>;
    runs:Array<{runId:string;manifestDigest:string;sourceDigest:string;contractDigest:string;artifactIds:string[];evidenceIds:string[]}>;
    sources:Array<{runId:string;sourceDigest:string;files:SourceSnapshot['files']}>;
    artifacts:Array<{id:string;digest:string;size:number;title:string;mediaType:string}>;
    claims:Array<{id:string;contentDigest:string;acceptanceIds:string[]}>;
    proposals:Array<{id:string;digest:string;reviewAcceptanceId?:string;reviewId?:string;jobId?:string;sourceDigest:string}>;
    objects:Array<{referenceId:string;mediaType:string;content:string}>;
}
export interface ReportRecord {
    artifactId:string;artifactDigest?:string;title?:string;formatVersion?:1;runIds:string[];claimIds:string[];evidenceIds:string[];
    references?:ReportReference[];runs?:ReportRun[];bindings?:ReportBindings;bindingsDigest?:string;
}
export interface ReportExportManifest {formatVersion:1;report:ReportInspection;bindingsDigest:string;stateDigest:string;bindings:ReportBindings;}
export interface ReportExportCollection {manifest:ReportExportManifest;files:Array<{path:string;bytes:Buffer;mode?:'100644'|'100755'}>;}
