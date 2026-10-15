import type { AppContext } from '../domain/context.js';
import type { Actor } from '../domain/types.js';
import type { ModelProbeResult } from './model-management-types.js';
/** Owner-only bounded request journal; never creates a research session or stores model text. */
export declare function probeModel(c: AppContext, actor: Actor, value: unknown, key: string): Promise<ModelProbeResult>;
