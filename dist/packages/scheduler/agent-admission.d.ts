import type { AppContext } from '../domain/context.js';
import type { Actor, Role, Row, Session } from '../domain/types.js';
export type AdmissionState = 'reserved' | 'running' | 'stopping' | 'unknown' | 'released';
export interface AgentAdmission {
    httpManagedVersion?: 1;
    sessionId: string;
    generation: number;
    ownerHost: string;
    role: Role;
    teamId?: string;
    state: AdmissionState;
    leaseUntil: number;
    spawnRequested: boolean;
    workerPid?: number;
}
export interface AgentCounts {
    reserved: number;
    running: number;
    stopping: number;
    unknown: number;
    held: number;
}
export interface AgentCapacityDTO {
    version: number;
    maxWorkers: null;
    available: null;
    unit: 'pi-worker';
    httpConcurrencyMeasured: false;
    counts: AgentCounts;
    queued?: Array<{
        sessionId: string;
        role: Role;
        reasons: Array<{
            code: string;
            message: string;
        }>;
    }>;
    project?: {
        projectId: string;
        maxActiveAgents: number;
        maxConcurrentAssistants: number;
        effectiveMaxAgents: number;
        counts: AgentCounts;
        assistantHeld: number;
        available: number;
        assistantAvailable: number;
        byRole: Record<string, number>;
        blockedBy: string[];
    };
}
export declare class AgentAdmissionService {
    private c;
    constructor(c: AppContext);
    private slots;
    sessionHeld(sessionId: string): boolean;
    snapshot(pid?: string): AgentCapacityDTO;
    inspect(actor: Actor, pid?: string): AgentCapacityDTO;
    configure(actor: Actor, _value: unknown): AgentCapacityDTO;
    check(pid: string, role: Role, teamId?: string): boolean;
    tryAcquire(session: Row<Session>, generation: number, ownerHost: string, teamId?: string): Row<AgentAdmission> | null;
    private owned;
    assertOwned(id: string, ownerHost: string, generation: number): Row<AgentAdmission>;
    markSpawnRequested(id: string, owner: string, generation: number): Row<AgentAdmission>;
    markRunning(id: string, owner: string, generation: number, pid: number | undefined): Row<AgentAdmission>;
    heartbeat(id: string, owner: string, generation: number): Row<AgentAdmission>;
    stopping(id: string, owner: string, generation: number): Row<AgentAdmission>;
    release(id: string, owner: string, generation: number, proof: 'confirmed-exit' | 'not-forked' | 'synchronous-fork-failure'): Row<AgentAdmission>;
    recover(): void;
}
