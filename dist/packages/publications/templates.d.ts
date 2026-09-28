import type { PublicationEngine } from './build-types.js';
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
