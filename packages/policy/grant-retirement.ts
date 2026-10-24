import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import {ensure} from '../domain/errors.js';

const kinds=['discovery-grant','working-grant','run-grant','text-corpus-grant'] as const;
type GrantKind=typeof kinds[number];
export function assertGrantAdmission(store:Store,pid:string,grantKind:GrantKind,grantId:string){
 const retired=store.maybe('grant-retirement',digest({grantKind,grantId}));if(retired)store.get('grant-retirement',retired.id,pid);
 ensure(!retired,'GRANT_RETIRED','会话归档已关闭此授权的新操作；历史保留');
}
/** Separate admission retirement from immutable proof used by historical evidence. */
export function retireSessionGrants(store:Store,pid:string,rootSessionId:string){
 for(const grantKind of kinds)for(const grant of store.list<{state:string;sessionId:string;taskBinding?:{teamId:string}}>(grantKind,pid)){
  const team=grant.taskBinding?store.maybe<{rootSessionId:string}>('team',grant.taskBinding.teamId):undefined,owner=grant.taskBinding?team?.projectId===pid?team.rootSessionId:undefined:grant.sessionId;
  if(owner!==rootSessionId||!['draft','active'].includes(grant.state))continue;
  const grantId=grant.id,id=digest({grantKind,grantId});if(!store.maybe('grant-retirement',id))store.create('grant-retirement',pid,{grantKind,grantId,rootSessionId},id);
 }
}
