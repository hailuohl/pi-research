import type { PublicationEngine, BibliographyMode } from './build-types.js';
export interface PublicationTemplateFile {
    path: string;
    digest: string;
    size: number;
    mediaType: string;
    content?: string;
}
export interface PublicationTemplate {
    id: string;
    title: string;
    engine: PublicationEngine;
    mainFile: string;
    bibliography: BibliographyMode;
    contentDigest: string;
    files: PublicationTemplateFile[];
    builtin: boolean;
}
export interface PublicationTemplateContent {
    path: string;
    digest: string;
    size: number;
    mediaType: string;
    contentBase64: string;
    content?: string;
}
export declare const MANUSCRIPT_TEMPLATES: {
    id: string;
    title: string;
    engine: PublicationEngine;
    mainFile: string;
    bibliography: "none";
    files: {
        path: string;
        content: string;
    }[];
}[];
