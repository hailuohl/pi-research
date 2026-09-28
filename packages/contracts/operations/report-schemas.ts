import {s,type JsonSchema} from './schema.js';

const id=s.string(100),string={type:'string'} as const,number={type:'number'} as const,integer={type:'integer'} as const;
const array=<const T extends JsonSchema>(items:T)=>({type:'array',items} as const);
const object=<const P extends Record<string,JsonSchema>,const O extends readonly (keyof P & string)[]=[]>(properties:P,optional?:O)=>({type:'object',properties,required:Object.keys(properties).filter(k=>!optional?.includes(k)) as Exclude<keyof P & string,O[number]>[],additionalProperties:false} as const);
const document=object({documentVersionId:string,rawDigest:string,parseResultId:string,pageNumber:integer,textArtifactDigest:string,start:integer,end:integer,pageLabel:{anyOf:[string,{type:'null'}]},rawArtifactId:string,imageArtifactId:string});
const reference=object({id:string,type:s.enum(['run','run-source','artifact','evidence','development-job','development-review','claim']),targetId:string,label:string,runId:string,path:string,digest:string,relation:s.enum(['exact','ancestry']),document},['runId','path','digest','relation','document']);
export const REPORT_INPUT_SCHEMAS={
    report_create:s.object({title:s.string(200),runIds:s.array(id,100),claimIds:s.array(id,100)}),
    report_inspect:s.object({reportId:id},['reportId']),
    report_reference_read:s.object({reportId:id,referenceId:id,cursor:s.integer(0,Number.MAX_SAFE_INTEGER),limit:s.integer(1,64000)},['reportId','referenceId']),
    report_export:s.object({reportId:id},['reportId']),
} as const satisfies Record<string,JsonSchema>;
export const REPORT_OUTPUT_SCHEMAS={
    report_inspect:object({id:string,artifactId:string,title:string,formatVersion:s.enum([0,1]),integrity:s.enum(['verified','invalid']),validity:s.enum(['current','stale','legacy']),reasons:array(string),references:array(reference),runs:array(object({runId:string,experimentId:string,revision:integer,state:s.enum(['succeeded','failed','cancelled']),integrity:s.enum(['pending','complete','incomplete','invalid']),judgment:s.enum(['pending','supported','not_supported','inconclusive']),sourceDigest:string,gitCommit:string,metrics:array(object({name:string,value:number,unit:string,referenceId:string}))},['gitCommit']))}),
    report_reference_read:object({reference,content:string,mediaType:string,cursor:integer,end:integer,complete:{type:'boolean'}}),
} as const satisfies Record<string,JsonSchema>;
