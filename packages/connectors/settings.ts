import type {Store} from '../storage/store.js';
import {ensure} from '../domain/errors.js';
import type {SourceId} from './contracts.js';
export interface ConnectorSettings {enabled:Record<SourceId,boolean>;requestLimit:number;}
export const DEFAULT_CONNECTORS:ConnectorSettings={enabled:{alphaxiv:true,openalex:true,biorxiv:true,pubmed:true,crossref:true},requestLimit:100};
export function connectorSettings(store:Store,pid:string){const row=store.list<ConnectorSettings>('connector-settings',pid)[0];return {version:row?.version??0,...(row?{enabled:row.enabled,requestLimit:row.requestLimit}:structuredClone(DEFAULT_CONNECTORS))};}
/** Used by the old Crossref entry as well: disabling a source is not bypassed by its legacy tool. */
export function assertSourceEnabled(store:Store,pid:string,source:SourceId){ensure(connectorSettings(store,pid).enabled[source],'SOURCE_DISABLED',`${source} 已禁用；需要用户明确启用`,403);}
