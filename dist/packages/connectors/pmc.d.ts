export declare function parsePubmedPmcid(xml: string, requestedPmid: string): string;
export type PmcTextProfile = 'pmc-jats-text-v1' | 'pmc-jats-text-v2';
export interface PmcFullText {
    pmid: string;
    pmcid: string;
    reportedVersion: string;
    title: string;
    license: string;
    content: string;
    pmcTextProfile: PmcTextProfile;
}
export declare function parsePmcFullText(xml: string, requestedPmid: string, requestedPmcid: string, pmcTextProfile?: PmcTextProfile): PmcFullText;
