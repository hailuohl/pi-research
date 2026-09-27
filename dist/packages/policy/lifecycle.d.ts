import type { Store } from '../storage/store.js';
import type { Project, Experiment } from '../domain/types.js';
/** Call inside the write transaction at the point a NEW side effect is authorized. */
export declare function assertProjectWritable(store: Store, projectId: string): import("../domain/types.js").Row<Project>;
/** Already submitted Runs keep their history; new Runs cannot inherit revoked code approval. */
export declare function assertExperimentSourceCurrent(store: Store, experiment: Experiment): void;
