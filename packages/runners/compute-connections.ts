import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {arch,cpus,freemem,totalmem} from 'node:os';
import {join} from 'node:path';
import type {AppContext} from '../domain/context.js';
import type {Actor} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {integer,object,text} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';
import type {PrivateSshTarget,SshTargetService} from './ssh-targets.js';
import type {GpuDevice} from './gpu.js';
import type {SshHealth} from './ssh-onboarding.js';

export const CONNECTION_TTL_MS=30000;
export interface ConnectionObservation {attempt:string;configurationDigest?:string;status:'unverified'|'verified'|'unavailable';checkedAt?:string;validUntil?:string;errorCode?:string;targetId?:string;serverVersion?:string;cpus?:number;memoryMb?:number;devices?:GpuDevice[];supervisor?:SshHealth['supervisor'];docker?:SshHealth['docker'];workspace?:SshHealth['workspace'];}
export interface ConnectionState {status:'unverified'|'verified'|'stale'|'unavailable';checkedAt?:string;validUntil?:string;errorCode?:string;targetId?:string;}
export interface DockerConnection extends ConnectionState {context:string;serverVersion?:string;cpus?:number;memoryMb?:number;}
export interface SshPreferences {version:number;cpu:boolean;gpu:boolean;}
export interface SshConnection extends ConnectionState {id:string;configurationVersion:number;preferences:SshPreferences;capabilities:{cpu:boolean;gpu:boolean};gpuDevices:GpuDevice[];gpuValidUntil?:string;host?:string;port?:number;user?:string;remoteRoot?:string;managed?:boolean;supervisor?:SshHealth['supervisor'];docker?:SshHealth['docker'];workspace?:SshHealth['workspace'];setup?:'idle'|'installing'|'unknown';}

/** Observations are separate from frozen execution identities and never contain stderr or credentials. */
export class ComputeConnectionService {
    constructor(private c:AppContext){}
    observation(id:string,kind='compute-connection'):ConnectionObservation|undefined{return this.c.store.maybe<{observation:ConnectionObservation}>(kind,id)?.observation;}
    private save(id:string,observation:ConnectionObservation,kind:string){const old=this.c.store.maybe(kind,id);if(old)this.c.store.update(kind,id,old.version,{observation});else this.c.store.create(kind,null,{observation},id);}
    begin(id:string,configurationDigest?:string,kind='compute-connection'):string {return this.c.store.transaction(()=>{const attempt=randomUUID();this.save(id,{attempt,status:'unverified',...(configurationDigest?{configurationDigest}:{})},kind);return attempt;});}
    finish(id:string,attempt:string,value:Omit<ConnectionObservation,'attempt'>,kind='compute-connection'):boolean {return this.c.store.transaction(()=>{if(this.observation(id,kind)?.attempt!==attempt)return false;const checkedAt=new Date().toISOString();this.save(id,{...value,attempt,checkedAt,...(value.status==='verified'?{validUntil:new Date(Date.now()+CONNECTION_TTL_MS).toISOString()}:{})},kind);return true;});}
    invalidateSsh(id:string,configurationDigest:string){this.begin('ssh:'+id,configurationDigest);this.begin('ssh:'+id,configurationDigest,'compute-gpu-observation');}
    preferences(id:string):SshPreferences {const row=this.c.store.maybe<{cpu:boolean;gpu:boolean}>('ssh-target-preferences',id);return {version:row?.version??0,cpu:row?.cpu??true,gpu:row?.gpu??false};}
    configurePreferences(actor:Actor,value:unknown,targets:SshTargetService){userOnly(actor);const x=object(value),id=text(x.id,'id',80);ensure(Object.keys(x).every(k=>['id','expectedVersion','cpu','gpu'].includes(k))&&typeof x.cpu==='boolean'&&typeof x.gpu==='boolean'&&(x.cpu||x.gpu),'INVALID_INPUT','至少选择 CPU 或 GPU 调用偏好',400);return this.c.store.transaction(()=>{targets.inspect(actor,id);const old=this.c.store.maybe('ssh-target-preferences',id);ensure((old?.version??0)===integer(x.expectedVersion,'expectedVersion',0),'VERSION_CONFLICT','SSH 调用偏好已变化');if(old)this.c.store.update('ssh-target-preferences',id,old.version,{cpu:x.cpu,gpu:x.gpu});else this.c.store.create('ssh-target-preferences',null,{cpu:x.cpu,gpu:x.gpu},id);return {id,...this.preferences(id)};});}
    private state(observation?:ConnectionObservation,configurationDigest?:string):ConnectionState {if(!observation||configurationDigest&&observation.configurationDigest!==configurationDigest)return {status:'unverified'};const {checkedAt,validUntil,errorCode,targetId}=observation,status=observation.status==='verified'&&(!validUntil||!Number.isFinite(Date.parse(validUntil))||Date.parse(validUntil)<=Date.now())?'stale':observation.status;return {status,...(checkedAt?{checkedAt}:{}),...(validUntil?{validUntil}:{}),...(errorCode?{errorCode}:{}),...(targetId?{targetId}:{})};}
    private contextState(context:string,state:ConnectionState,endpoint?:string):ConnectionState {const row=this.c.store.db.prepare('SELECT status,target_id,endpoint FROM compute_contexts WHERE context=?').get(context);if(row?.status==='unavailable')return {...state,status:'unavailable',errorCode:state.errorCode??'COMPUTE_TARGET_UNAVAILABLE'};if(state.status==='verified'&&(!row||row.status!=='ready'||row.target_id!==state.targetId||endpoint&&row.endpoint!==endpoint))return {...state,status:'unverified'};return state;}
    docker(context:string):DockerConnection {const observation=this.observation('docker:'+context),state=this.contextState(context,this.state(observation));return {context,...state,...(state.status==='verified'&&observation?.serverVersion?{serverVersion:observation.serverVersion}:{}),...(state.status==='verified'&&observation?.cpus!==undefined?{cpus:observation.cpus}:{}),...(state.status==='verified'&&observation?.memoryMb!==undefined?{memoryMb:observation.memoryMb}:{})};}
    list(actor:Actor,targets:SshTargetService):{docker:DockerConnection[];ssh:SshConnection[]} {
        const contexts=new Set(this.c.store.db.prepare("SELECT context FROM compute_contexts WHERE context NOT LIKE 'ssh:%'").all().map(r=>String(r.context)));
        for(const row of this.c.store.list('compute-connection'))if(row.id.startsWith('docker:'))contexts.add(row.id.slice(7));
        const ssh=targets.directory().map(({target:t,configurationDigest})=>this.ssh(actor,t,configurationDigest));
        return {docker:[...contexts].map(context=>this.docker(context)),ssh};
    }
    private ssh(actor:Actor,t:PrivateSshTarget,configurationDigest:string):SshConnection {
        const state=this.contextState('ssh:'+t.id,this.state(this.observation('ssh:'+t.id),configurationDigest),t.verified?configurationDigest+':'+t.verified.protocolDigest:undefined),gpu=this.observation('ssh:'+t.id,'compute-gpu-observation');
        let currentProtocol=false;try{currentProtocol=t.verified?.protocolDigest===digest(readFileSync(join(this.c.repoRoot,'scripts','ssh-runner-gpu.py')));}catch{/* Missing local protocol cannot advertise execution capability. */}
        const cpu=state.status==='verified'&&t.gpuProtocol===true&&t.verified?.gpuProtocol===true&&t.verified.configDigest===configurationDigest&&t.verified.targetId===state.targetId&&currentProtocol;
        const gpuValid=cpu&&this.state(gpu,configurationDigest).status==='verified'&&gpu?.targetId===state.targetId;
        const gpuDevices=gpuValid?gpu?.devices??[]:[];
        const observation=this.observation('ssh:'+t.id),reservation=this.c.store.maybe<{state:'installing'|'unknown';until:number}>('ssh-setup',t.id),health=observation?.configurationDigest===configurationDigest?{supervisor:observation.supervisor,docker:observation.docker,workspace:observation.workspace}:{};
        return {id:t.id,configurationVersion:t.version,...state,preferences:this.preferences(t.id),capabilities:{cpu,gpu:gpuDevices.length>0},gpuDevices,...(t.managed?{managed:true,...health,setup:reservation?(reservation.until<=Date.now()?'unknown' as const:reservation.state):'idle' as const}:{}),...(gpuValid&&gpu?.validUntil?{gpuValidUntil:gpu.validUntil}:{}),...(actor.type==='user'?{host:t.host,port:t.port,user:t.user,remoteRoot:t.remoteRoot}:{})};
    }
}
export function localHardware(){const devices=cpus();return {cpuModel:devices[0]?.model??'unknown',logicalCpus:devices.length,totalMemoryMb:Math.floor(totalmem()/1048576),freeMemoryMb:Math.floor(freemem()/1048576),arch:arch()};}
