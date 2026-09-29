import type { ResearchApp } from '../research-app.js';
import type { Actor } from '../domain/types.js';
import type { DiscoveryGrantDTO } from './discovery-grant-types.js';
export type { DiscoveryGrantDTO } from './discovery-grant-types.js';
export declare class DiscoveryGrantService {
    private app;
    constructor(app: ResearchApp);
    inspect(actor: Actor, pid: string, id: string): DiscoveryGrantDTO;
    prepare(actor: Actor, pid: string, value: unknown): DiscoveryGrantDTO;
    activate(actor: Actor, pid: string, value: unknown): DiscoveryGrantDTO;
    revoke(actor: Actor, pid: string, value: unknown): DiscoveryGrantDTO;
    owner(actor: Actor, pid: string, id: string): Actor;
}
