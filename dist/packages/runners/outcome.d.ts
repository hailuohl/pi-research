import type { Run, Row, Experiment } from '../domain/types.js';
import type { Store } from '../storage/store.js';
/** Not a scientific verdict: only determines whether code must be preserved or human review is pending. */
export declare function answerDisposition(run: Run): 'answered' | 'unanswered' | 'needs_review';
export declare function assertOutcomeBoundary(store: Store, experiment: Row<Experiment>, editing?: boolean): void;
