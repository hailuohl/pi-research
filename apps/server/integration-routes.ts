import type {ResearchApp} from '../../packages/research-app.js';
import {USER,type Role} from '../../packages/domain/types.js';
import {object,text,oneOf} from '../../packages/contracts/validation.js';
const ROLES=['coordinator','literature','designer','implementer','analyst','reviewer','writer'] as const;
export function readIntegrationRoute(app:ResearchApp,path:string,url:URL):unknown{
 if(path==='/skills'){const role=oneOf(url.searchParams.get('role')??'coordinator',ROLES,'role');return {bundleId:app.skills.bundleId,skills:app.skills.list(role)};}
 const skill=path.match(/^\/skills\/([a-z0-9-]+)$/);if(skill)return app.skills.read('coordinator',skill[1],url.searchParams.get('resource')??undefined);
 const p=path.match(/^\/projects\/([^/]+)\/(connectors|connector-history)$/);if(p){app.store.get('project',p[1]);if(p[2]==='connectors')return app.connectors.settings(USER,p[1]);return {searches:app.store.list('connector-search',p[1]).slice(-30),papers:app.store.list('paper-read',p[1]).slice(-30),scope:'last-30-per-kind'};}
 return undefined;
}
export function writeIntegrationRoute(app:ResearchApp,path:string,body:unknown):unknown{const p=path.match(/^\/projects\/([^/]+)\/connectors$/);if(p)return app.connectors.configure(USER,p[1],body);return undefined;}
/** This asynchronous branch must run outside Store.operation's synchronous transaction. */
export async function asyncIntegrationRoute(app:ResearchApp,path:string,body:unknown,key:string,signal:AbortSignal){const x=object(body),pid=text(x.projectId,'projectId',100);if(path==='/connectors/discover')return app.connectors.discover(USER,pid,x,`http:${key}`,()=>{},signal);return app.connectors.paper(USER,pid,x,`http:${key}`,()=>{},signal);}
