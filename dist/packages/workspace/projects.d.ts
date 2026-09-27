import type { AppContext } from '../domain/context.js';
import { type Actor, type Project } from '../domain/types.js';
export declare class ProjectService {
    private c;
    constructor(c: AppContext);
    get(actor: Actor, id: string): import("../domain/types.js").Row<Project>;
    create(actor: Actor, input: unknown): import("../domain/types.js").Row<Project>;
    importDirectory(actor: Actor, input: unknown): import("../domain/types.js").Row<Project>;
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
