import type { AppContext } from '../domain/context.js';
import { type Actor, type Project } from '../domain/types.js';
export interface PreparedProjectImport {
    sourceDigest: string;
}
export declare class ProjectService {
    private c;
    private readonly importPlans;
    constructor(c: AppContext);
    get(actor: Actor, id: string): import("../domain/types.js").Row<Project>;
    create(actor: Actor, input: unknown): import("../domain/types.js").Row<Project>;
    private importInput;
    private checkImportSource;
    private captureImport;
    /** Git and source I/O preflight runs before the caller opens its SQLite write transaction. */
    prepareImport(actor: Actor, input: unknown): Promise<PreparedProjectImport>;
    importDirectory(actor: Actor, input: unknown, prepared?: PreparedProjectImport): import("../domain/types.js").Row<Project>;
    update(actor: Actor, id: string, input: unknown): import("../domain/types.js").Row<Project>;
    archive(actor: Actor, id: string, version: number): import("../domain/types.js").Row<Project>;
    settings(actor: Actor, id: string, input: unknown): import("../domain/types.js").Row<Project>;
    listFiles(actor: Actor, id: string): {
        path: string;
        size: number;
        digest?: string;
    }[];
    readFile(actor: Actor, id: string, path: string): {
        path: string;
        content: string;
        digest: string;
        size: number;
    };
    writeFile(actor: Actor, id: string, path: string, content: string, expectedDigest: string | null): {
        path: string;
        digest: string;
        size: number;
    };
}
