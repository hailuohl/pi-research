import type { Actor, Artifact, Row } from '../domain/types.js';
import type { ResearchApp } from '../research-app.js';
import { type Store } from '../storage/store.js';
export declare const FIXTURE_PROFILE = "numeric-regression-v1";
export declare const FIXTURE_INPUT_FORMAT: {
    readonly format: "json-object-rows-v1";
    readonly recordsPointer: "/rows";
    readonly fields: {
        readonly rowId: "rowId";
        readonly partition: "partition";
        readonly predictor: "x";
        readonly observed: "observed";
    };
    readonly partitions: {
        readonly train: "train";
        readonly test: "test";
    };
};
export interface SyntheticFixtureRef {
    id: string;
    digest: string;
    size: number;
    generatorVersion: typeof FIXTURE_PROFILE;
    profile: typeof FIXTURE_PROFILE;
    seed: string;
    splitDigest: string;
}
export interface SyntheticFixtureBinding {
    fixtureRef: SyntheticFixtureRef;
    inputPath: string;
    inputArgumentIndex: number;
}
export interface FixtureRow {
    rowId: string;
    partition: 'train' | 'test';
    x: number;
    observed: number;
}
export interface SyntheticFixture {
    generatorVersion: typeof FIXTURE_PROFILE;
    profile: typeof FIXTURE_PROFILE;
    seed: string;
    splitDigest: string;
    rows: FixtureRow[];
}
export interface SyntheticFixtureContext {
    fixtureRef: SyntheticFixtureRef;
    bytes: Buffer;
    fixture: SyntheticFixture;
    artifact: Row<Artifact>;
}
export declare function generateSyntheticFixture(seed: string): SyntheticFixture;
export declare function parseSyntheticFixtureRef(value: unknown): SyntheticFixtureRef;
export declare function hasSyntheticFixture(store: Store, pid: string, rootSessionId: string): boolean;
export declare function assertSyntheticFixture(store: Store, pid: string, ref: SyntheticFixtureRef, rootSessionId?: string): SyntheticFixtureContext;
export declare function syntheticFixtureBinding(ref: SyntheticFixtureRef, inputArgumentIndex: number): SyntheticFixtureBinding;
export declare function assertSyntheticManifest(store: Store, pid: string, rootSessionId: string, expected: SyntheticFixtureBinding, actual: SyntheticFixtureBinding | undefined, command: string[], data: Array<{
    id: string;
    digest: string;
    size: number;
    path: string;
}>): SyntheticFixtureContext;
export declare class SyntheticFixtureService {
    private app;
    constructor(app: ResearchApp);
    prepare(actor: Actor, pid: string, rootSessionId: string, value: unknown): {
        inputFormat?: {
            readonly format: "json-object-rows-v1";
            readonly recordsPointer: "/rows";
            readonly fields: {
                readonly rowId: "rowId";
                readonly partition: "partition";
                readonly predictor: "x";
                readonly observed: "observed";
            };
            readonly partitions: {
                readonly train: "train";
                readonly test: "test";
            };
        } | undefined;
        fixtureRef: SyntheticFixtureRef;
        inputPath: string;
    };
}
