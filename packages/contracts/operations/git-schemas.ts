import {s,type JsonSchema} from './schema.js';
const id=s.string(100),hash={...s.string(64),minLength:64,pattern:'^[a-f0-9]{64}$'},head={...s.string(40),minLength:40,pattern:'^[a-f0-9]{40}$'},mode=s.enum(['100644','100755']);
const operationState=s.enum(['queued','running','complete','conflict','failed']);
const operation=s.object({operationId:id,action:s.enum(['source','checkout','commit']),state:operationState,sourceRevisionId:id,sessionId:id,sourceDigest:hash,gitCommit:head,error:s.string(200)},['operationId','action','state','sourceRevisionId','sourceDigest']);
export const GIT_INPUT_SCHEMAS={
    workspace_history_inspect:s.object({}),workspace_history_diff:s.object({}),
    workspace_history_commit:s.object({expectedHead:head,message:s.string(1000)},['expectedHead','message']),
    workspace_history_set_mode:s.object({path:s.string(1000),mode,expectedSourceDigest:hash},['path','mode','expectedSourceDigest']),
    workspace_history_operation:s.object({operationId:id},['operationId']),
} as const satisfies Record<string,JsonSchema>;
export const GIT_OUTPUT_SCHEMAS={
    workspace_history_inspect:s.object({sessionId:id,state:s.enum(['unbound','pending','ready','conflict','failed']),sourceRevisionId:id,branch:s.string(300),head,operationId:id,operationState,error:s.string(200),sourceDigest:hash},['sessionId','state']),
    workspace_history_diff:s.object({sessionId:id,head,sourceDigest:hash,files:s.array(s.object({path:s.string(1000),status:s.enum(['added','modified','deleted']),beforeDigest:s.nullable(hash),afterDigest:s.nullable(hash),beforeMode:s.nullable(mode),afterMode:s.nullable(mode)},['path','status','beforeDigest','afterDigest','beforeMode','afterMode']),10000)},['sessionId','head','sourceDigest','files']),
    workspace_history_commit:operation,workspace_history_operation:operation,
    workspace_history_set_mode:s.object({path:s.string(1000),mode,sourceDigest:hash},['path','mode','sourceDigest']),
} as const satisfies Record<string,JsonSchema>;
