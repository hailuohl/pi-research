import {s,type JsonSchema} from './schema.js';
const str={type:'string'} as const,num={type:'number'} as const,int={type:'integer'} as const,bool={type:'boolean'} as const;
const array=<const T extends JsonSchema>(items:T)=>({type:'array',items} as const);
const object=<const P extends Record<string,JsonSchema>,const O extends readonly (keyof P & string)[]=[]>(properties:P,optional?:O)=>({type:'object',properties,required:Object.keys(properties).filter(k=>!optional?.includes(k)) as Exclude<keyof P & string,O[number]>[],additionalProperties:false} as const);
const limitFields={maxRuns:s.integer(0,256),maxDevelopment:s.integer(0,256),maxJobs:s.integer(0,256),cpus:s.nullable(s.number(0,1024)),memoryMb:s.nullable(s.integer(0,Number.MAX_SAFE_INTEGER)),maxQueued:s.nullable(s.integer(0,Number.MAX_SAFE_INTEGER))};
const limits=object(limitFields),configuration=object({version:int,targetId:str,limits});
const usage=object({jobs:int,runs:int,development:int,documents:int,publications:int,cpus:num,memoryMb:int,unknown:int});
const available=object({jobs:int,runs:int,development:int,documents:int,publications:int,cpus:s.nullable(num),memoryMb:s.nullable(int)});
const counts=object({reserved:int,running:int,stopping:int,unknown:int,held:int});
const roles=s.enum(['coordinator','literature','designer','implementer','analyst','reviewer','writer']);
const agents=object({version:int,maxWorkers:int,available:int,unit:{const:'pi-worker'},httpConcurrencyMeasured:{const:false},counts,
    queued:array(object({sessionId:str,role:roles,reasons:array(object({code:str,message:str}))})),
    project:object({projectId:str,maxActiveAgents:int,maxConcurrentAssistants:int,effectiveMaxAgents:int,counts,assistantHeld:int,available:int,assistantAvailable:int,byRole:{type:'object',propertyNames:roles,additionalProperties:int},blockedBy:array(str)})},['queued','project']);
const modelHttp=object({configuration:object({version:int,maxRequests:int}),scope:{const:'shared-data-directory'},unit:{const:'pi-http-request'},counts:object({queued:int,active:int,unknown:int}),available:int,coverage:s.enum(['managed-fetch','legacy-workers-present']),legacyWorkerCount:int,supportedApis:array(str),items:array(object({id:str,sessionId:str,provider:str,model:str,state:s.enum(['queued','active','unknown','succeeded','failed','cancelled','interrupted']),queuedAt:str,startedAt:str,endedAt:str,httpStatus:int,receivedBytes:int,outcome:str},['startedAt','endedAt','httpStatus','receivedBytes','outcome'])),nextCursor:s.nullable(int)});
export const SCHEDULER_INPUT_SCHEMAS={
    compute_target_probe:s.object({context:{...s.string(100),pattern:'^[A-Za-z0-9][A-Za-z0-9._-]*$'}},['context']),
    compute_queue_inspect:s.object({cursor:s.integer(0,Number.MAX_SAFE_INTEGER),limit:s.integer(1,256)}),
    compute_capacity_configure:s.object({expectedVersion:s.integer(0,Number.MAX_SAFE_INTEGER),targetId:s.string(100),limits:{...s.object(limitFields),minProperties:1}},['expectedVersion','limits']),
    agent_capacity_inspect:s.object({}),
    agent_capacity_configure:s.object({expectedVersion:s.integer(1,Number.MAX_SAFE_INTEGER),maxWorkers:s.integer(1,32)},['expectedVersion','maxWorkers']),
    model_http_inspect:s.object({cursor:s.integer(0,Number.MAX_SAFE_INTEGER),limit:s.integer(1,100)}),
    model_http_configure:s.object({expectedVersion:s.integer(1,Number.MAX_SAFE_INTEGER),maxRequests:s.integer(0,32)},['expectedVersion','maxRequests']),
} as const satisfies Record<string,JsonSchema>;
export const SCHEDULER_OUTPUT_SCHEMAS={
    compute_target_probe:object({context:str,targetId:str,backend:{const:'docker'},observedAt:str}),
    compute_queue_inspect:object({scope:{const:'shared-data-directory'},configuration,usage,available,queued:int,
        targets:array(object({targetId:str,backend:s.enum(['docker','trusted-example','ssh']),contexts:array(str),configuration,usage,available})),
        items:array(object({kind:s.enum(['run','development','document','publication']),id:str,projectId:str,sequence:int,state:str,held:bool,backend:s.enum(['docker','trusted-example','ssh']),targetId:s.nullable(str),requested:object({cpus:num,memoryMb:int}),generation:int,leaseUntil:int,nextAttemptAt:int,reason:s.enum(['ready','worker_active','recovery_due','target_unresolved','target_unavailable','target_changed','legacy_target_unknown','request_too_large','host_capacity','target_capacity','earlier_job','recovery_backoff','manual_recovery_required'])})),nextCursor:s.nullable(int)}),
    compute_capacity_configure:configuration,agent_capacity_inspect:agents,agent_capacity_configure:agents,
    model_http_inspect:modelHttp,model_http_configure:modelHttp,
} as const satisfies Record<string,JsonSchema>;
