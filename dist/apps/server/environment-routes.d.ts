import type { ResearchApp } from '../../packages/research-app.js';
export declare function readEnvironment(app: ResearchApp, url: URL): {
    version: number;
    variables: {
        name: string;
        hasValue: true;
    }[];
    scope: "local";
};
export declare function writeEnvironment(app: ResearchApp, url: URL, method: string, body: unknown, key: string): {
    version: number;
    variables: {
        name: string;
        hasValue: true;
    }[];
    scope: "local";
};
