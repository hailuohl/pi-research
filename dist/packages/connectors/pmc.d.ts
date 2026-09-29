export declare function parsePubmedPmcid(xml: string, requestedPmid: string): string;
export interface PmcFullText {
    pmid: string;
    pmcid: string;
    reportedVersion: string;
    title: string;
    license: string;
    content: string;
}
export declare function parsePmcFullText(xml: string, requestedPmid: string, requestedPmcid: string): PmcFullText;
