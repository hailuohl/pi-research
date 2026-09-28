import type {SourceSnapshot} from '../domain/types.js';
export const DOCUMENT_PARSER_PROFILE='pdfium-text-pages-v1';
export const DOCUMENT_PARSE_RESOURCES={cpus:1,memoryMb:512,pids:64,timeoutSeconds:180,workMb:128,logBytes:1024*1024,outputBytes:128*1024*1024};
export type DocumentParseState='prepared'|'queued'|'starting'|'running'|'unknown'|'succeeded'|'failed'|'cancelled'|'timed_out';
export const DOCUMENT_PARSE_TERMINAL=['succeeded','failed','cancelled','timed_out'] as const;
export interface DocumentParserConfiguration {dockerContext:string;imageDigest:string;imageId:string;profileId:typeof DOCUMENT_PARSER_PROFILE;lockDigest:string;scriptDigest:string;profileDigest:string;}
export interface DocumentParseManifest {
 purpose:'document-parse';documentVersionId:string;documentDigest:string;rawArtifactId:string;rawDigest:string;rawSize:number;
 profileId:typeof DOCUMENT_PARSER_PROFILE;profileDigest:string;lockDigest:string;scriptDigest:string;
 dockerContext:string;environmentImageDigest:string;command:string[];inputSnapshot:SourceSnapshot;
 dataArtifacts:Array<{id:string;digest:string;size:number;path:string}>;
 resources:typeof DOCUMENT_PARSE_RESOURCES;
}
export interface DocumentParseJob {
 documentVersionId:string;manifest:DocumentParseManifest;manifestDigest:string;approvalId:string;state:DocumentParseState;integrity:'pending'|'complete'|'incomplete'|'invalid';
 containerName:string;containerId?:string;imageId?:string;generation:number;leaseUntil:number;workerPid?:number;startRequested:boolean;cancelRequested:boolean;recoveryCount:number;
 outputDir:string;controlDir:string;startedAt?:string;endedAt?:string;exitCode?:number|null;error?:string;artifactIds:string[];resultId?:string;logTruncated?:boolean;
}
export interface DocumentParagraph {index:number;start:number;end:number;}
export interface DocumentPage {
 pageNumber:number;pageLabel:string|null;width:number;height:number;imageWidth:number;imageHeight:number;
 textArtifactId:string;textArtifactDigest:string;imageArtifactId:string;imageArtifactDigest:string;
 paragraphs:DocumentParagraph[];textStatus:'text-extracted'|'no-text-layer';
}
export interface DocumentParseResult {
 documentVersionId:string;jobId:string;rawDigest:string;manifestDigest:string;profileId:typeof DOCUMENT_PARSER_PROFILE;profileDigest:string;imageId:string;
 pageCount:number;pages:DocumentPage[];manifestArtifactId:string;manifestArtifactDigest:string;
 versionAssurance:'marker-match'|'unverified';requestedVersion:string|null;observedVersion:string|null;
 quality:{readingOrder:'unverified';paragraphs:'heuristic';tables:'unknown';figures:'unknown';ocr:false;score:null};
}
export interface ParserOutput {
 formatVersion:1;profileId:typeof DOCUMENT_PARSER_PROFILE;rawDigest:string;pageCount:number;
 quality:DocumentParseResult['quality'];
 pages:Array<{pageNumber:number;pageLabel:string|null;width:number;height:number;imageWidth:number;imageHeight:number;textFile:string;textDigest:string;textBytes:number;imageFile:string;imageDigest:string;imageBytes:number;paragraphs:DocumentParagraph[];textStatus:'text-extracted'|'no-text-layer'}>;
}
