import {SshTargetService} from '../runners/ssh-targets.js';
import type {AppContext} from '../domain/context.js';
import type {Actor} from '../domain/types.js';
import {userOnly,scope} from '../policy/permissions.js';
import {object,integer,text} from '../contracts/validation.js';
import {ensure,DomainError} from '../domain/errors.js';
import {docker,probeDockerTarget,JOB_LABEL,MANIFEST_LABEL} from '../execution/docker.js';
import type {ComputeKind,ComputeLimits,ComputeUsage,ComputeAvailable,ComputeConfiguration,ComputeQueueInspection,ComputeWaitReason,ComputeTargetProbe} from './compute-types.js';

interface QueueRow {sequence:number;kind:ComputeKind;id:string;project_id:string;backend:'docker'|'trusted-example'|'ssh';context_name:string|null;phase:string;held:number;cpu_millis:number;memory_mb:number;target_id:string|null;engine_id:string|null;endpoint:string|null;bound:number;generation:number;lease_until:number;next_attempt_at:number;last_error:string|null;source_version:number;}
interface ContextRow {context:string;target_id:string|null;engine_id:string|null;endpoint:string|null;status:string;next_probe_at:number;probe_until:number;failures:number;}
type Identity=Awaited<ReturnType<typeof probeDockerTarget>>;
interface Dependencies {probe?:typeof probeDockerTarget;inspect?:(context:string,id:string)=>Promise<{Id:string;Config:{Labels?:Record<string,string>}}|null>;}
const TERMINAL=['succeeded','failed','cancelled','timed_out'];
const DEFAULTS:ComputeLimits={maxRuns:1,maxDevelopment:1,maxJobs:2,cpus:null,memoryMb:null,maxQueued:null};
const sourceKind=(kind:ComputeKind)=>kind==='publication'?'publication-build-job':kind==='document'?'document-parse-job':kind==='development'?'sandbox-job':'run';

/** One SQLite-backed budget for formal Runs and development jobs; leases never release resources. */
export class ComputeQueue {
    private pending?:Promise<void>;
    private stopped=false;
    private cursors=new Map<string,number>();
    private readonly probe:typeof probeDockerTarget;
    private readonly inspectContainer:NonNullable<Dependencies['inspect']>;
    constructor(private c:AppContext,dependencies:Dependencies={}) {
        this.probe=dependencies.probe??(async context=>{if(!context.startsWith('ssh:'))return probeDockerTarget(context);const t=await new SshTargetService(this.c).verify(context.slice(4));return {targetId:t.targetId,engineId:t.engineId,endpoint:t.configDigest+':'+t.protocolDigest};});
        this.inspectContainer=dependencies.inspect??(async(context,id)=>{try{return JSON.parse(await docker(context,['inspect','--type','container',id]))[0];}catch(error){if(/No such (object|container)/i.test((error as Error).message))return null;throw error;}});
    }
    private row(kind:ComputeKind,id:string) {const r=this.c.store.db.prepare('SELECT * FROM compute_queue WHERE kind=? AND id=?').get(kind,id) as unknown as QueueRow|undefined;ensure(r,'COMPUTE_JOB_NOT_FOUND','计算队列记录不存在',404);return r;}
    private context(name:string) {return this.c.store.db.prepare('SELECT * FROM compute_contexts WHERE context=?').get(name) as unknown as ContextRow|undefined;}
    private config(targetId='host'):ComputeConfiguration {
        const host=this.c.store.db.prepare("SELECT version,data FROM compute_limits WHERE target_id='host'").get()!,row=targetId==='host'?host:this.c.store.db.prepare('SELECT version,data FROM compute_limits WHERE target_id=?').get(targetId);
        return {targetId,version:Number(row?.version??0),limits:{...DEFAULTS,...JSON.parse(host.data as string),...(targetId!=='host'&&row?JSON.parse(row.data as string):{})}};
    }
    private usage(targetId='host'):ComputeUsage {
        const where=targetId==='host'?'held=1':"held=1 AND (target_id=? OR (?<>'host-example' AND backend IN ('docker','ssh') AND bound=0))",params=targetId==='host'?[]:[targetId,targetId];
        const r=this.c.store.db.prepare(`SELECT count(*) jobs,COALESCE(sum(kind='run'),0) runs,COALESCE(sum(kind='development'),0) development,COALESCE(sum(kind='document'),0) documents,COALESCE(sum(kind='publication'),0) publications,COALESCE(sum(cpu_millis),0) cpu,COALESCE(sum(memory_mb),0) memory,COALESCE(sum(phase='unknown'),0) unknown FROM compute_queue WHERE ${where}`).get(...params)!;
        return {jobs:Number(r.jobs),runs:Number(r.runs),development:Number(r.development),documents:Number(r.documents),publications:Number(r.publications),cpus:Number(r.cpu)/1000,memoryMb:Number(r.memory),unknown:Number(r.unknown)};
    }
    private targetReady(r:QueueRow,fresh=false) {
        if(r.backend==='trusted-example')return true;
        const ctx=this.context(r.context_name!);return !!(r.bound&&ctx?.status==='ready'&&ctx.engine_id===r.engine_id&&ctx.endpoint===r.endpoint&&(!fresh||ctx.next_probe_at>Date.now()));
    }
    private fits(r:QueueRow,limits:ComputeLimits,used:ComputeUsage) {return used.jobs+1<=limits.maxJobs&&(r.kind==='publication'?used.publications<1:r.kind==='document'?used.documents<1:used[r.kind==='run'?'runs':'development']+1<=limits[r.kind==='run'?'maxRuns':'maxDevelopment'])&&(limits.cpus===null||Math.round(used.cpus*1000)+r.cpu_millis<=Math.round(limits.cpus*1000))&&(limits.memoryMb===null||used.memoryMb+r.memory_mb<=limits.memoryMb);}
    private available(limits:ComputeLimits,usage:ComputeUsage):ComputeAvailable {return {jobs:Math.max(0,limits.maxJobs-usage.jobs),runs:Math.max(0,limits.maxRuns-usage.runs),development:Math.max(0,limits.maxDevelopment-usage.development),documents:Math.max(0,1-usage.documents),publications:Math.max(0,1-usage.publications),cpus:limits.cpus===null?null:Math.max(0,Math.round(limits.cpus*1000)-Math.round(usage.cpus*1000))/1000,memoryMb:limits.memoryMb===null?null:Math.max(0,limits.memoryMb-usage.memoryMb)};}
    private effectiveAvailable(host:ComputeAvailable,target:ComputeAvailable):ComputeAvailable {const min=(a:number|null,b:number|null)=>a===null?b:b===null?a:Math.min(a,b);return {jobs:Math.min(host.jobs,target.jobs),runs:Math.min(host.runs,target.runs),development:Math.min(host.development,target.development),documents:Math.min(host.documents,target.documents),publications:Math.min(host.publications,target.publications),cpus:min(host.cpus,target.cpus),memoryMb:min(host.memoryMb,target.memoryMb)};}
    private tooLarge(r:QueueRow) {const empty:ComputeUsage={jobs:0,runs:0,development:0,documents:0,publications:0,cpus:0,memoryMb:0,unknown:0};return !this.fits(r,this.config().limits,empty)||!this.fits(r,this.config(r.target_id!).limits,empty);}
    private capacity(r:QueueRow):ComputeWaitReason|undefined {if(!this.fits(r,this.config().limits,this.usage()))return 'host_capacity';if(!this.fits(r,this.config(r.target_id!).limits,this.usage(r.target_id!)))return 'target_capacity';}
    private bindCachedQueued() {
        this.c.store.db.prepare(`UPDATE compute_queue SET target_id=(SELECT target_id FROM compute_contexts WHERE context=context_name),engine_id=(SELECT engine_id FROM compute_contexts WHERE context=context_name),endpoint=(SELECT endpoint FROM compute_contexts WHERE context=context_name),bound=1 WHERE phase='queued' AND held=0 AND bound=0 AND EXISTS(SELECT 1 FROM compute_contexts WHERE context=context_name AND status='ready' AND next_probe_at>?)`).run(Date.now());
    }
    /** Earliest non-oversized job per target: temporarily blocked large jobs cannot be overtaken there. */
    private heads():QueueRow[] {
        const effective=(key:string)=>`CASE WHEN json_type(t.data,'$.${key}') IS NULL THEN json_extract(h.data,'$.${key}') ELSE json_extract(t.data,'$.${key}') END`;
        const acceptable=(key:string,column:string,factor=1)=>`((${effective(key)}) IS NULL OR ${column}<=(${effective(key)})*${factor}) AND (json_extract(h.data,'$.${key}') IS NULL OR ${column}<=json_extract(h.data,'$.${key}')*${factor})`;
        return this.c.store.db.prepare(`WITH eligible AS (
SELECT q.* FROM compute_queue q JOIN compute_limits h ON h.target_id='host' LEFT JOIN compute_limits t ON t.target_id=q.target_id
WHERE q.phase='queued' AND q.bound=1 AND q.next_attempt_at<=? AND (q.backend='trusted-example' OR EXISTS(SELECT 1 FROM compute_contexts c WHERE c.context=q.context_name AND c.status='ready' AND c.engine_id=q.engine_id AND c.endpoint=q.endpoint AND c.next_probe_at>?))
AND ${acceptable('cpus','q.cpu_millis',1000)} AND ${acceptable('memoryMb','q.memory_mb')}
AND (${effective('maxJobs')})>=1 AND json_extract(h.data,'$.maxJobs')>=1
AND (q.kind='run' AND (${effective('maxRuns')})>=1 AND json_extract(h.data,'$.maxRuns')>=1 OR q.kind='development' AND (${effective('maxDevelopment')})>=1 AND json_extract(h.data,'$.maxDevelopment')>=1 OR q.kind IN ('document','publication'))),
heads AS (SELECT target_id,min(sequence) sequence FROM eligible GROUP BY target_id)
SELECT e.* FROM eligible e JOIN heads h ON h.sequence=e.sequence ORDER BY e.sequence LIMIT 256`).all(Date.now(),Date.now()) as unknown as QueueRow[];
    }
    private next() {return this.heads().find(r=>!this.capacity(r));}
    candidates(kind:ComputeKind,limit=8):string[] {
        integer(limit,'limit',1,256);this.bindCachedQueued();
        const recovered=this.c.store.db.prepare("SELECT * FROM compute_queue WHERE kind=? AND held=1 AND backend IN ('docker','ssh') AND lease_until<=? AND next_attempt_at<=? ORDER BY sequence LIMIT ?").all(kind,Date.now(),Date.now(),limit) as unknown as QueueRow[];
        const ids=recovered.filter(r=>this.targetReady(r)).map(r=>r.id),next=this.next();if(ids.length<limit&&next?.kind===kind)ids.push(next.id);return ids;
    }
    private page(kind:ComputeKind,active:boolean,limit:number) {
        integer(limit,'limit',1,256);const key=kind+':'+active,cursor=this.cursors.get(key)??0,sql=`SELECT id,sequence FROM compute_queue WHERE kind=? AND ${active?'held=1':"phase='queued'"} AND sequence>? ORDER BY sequence LIMIT ?`;
        let rows=this.c.store.db.prepare(sql).all(kind,cursor,limit);if(!rows.length&&cursor)rows=this.c.store.db.prepare(sql).all(kind,0,limit);this.cursors.set(key,rows.length?Number(rows.at(-1)!.sequence):0);return rows.map(r=>String(r.id));
    }
    queued(kind:ComputeKind,limit=32):string[] {return this.page(kind,false,limit);}
    active(kind:ComputeKind,limit=256):string[] {return this.page(kind,true,limit);}
    withAdmission<T>(kind:ComputeKind,id:string,fn:()=>T):T|null {
        return this.c.store.transaction(()=>{
            this.bindCachedQueued();const q=this.row(kind,id);
            if(q.held){if(q.backend==='trusted-example'||q.lease_until>Date.now()||q.next_attempt_at>Date.now()||!this.targetReady(q))return null;}
            else {if(q.phase!=='queued')return null;const next=this.next();if(next?.kind!==kind||next.id!==id)return null;}
            this.c.store.db.prepare('UPDATE compute_queue SET next_attempt_at=?,last_error=NULL WHERE kind=? AND id=?').run(Date.now()+10000,kind,id);
            const result=fn(),after=this.row(kind,id);
            if(result===null||result===undefined){if(after.phase==='queued')this.c.store.db.prepare('UPDATE compute_queue SET next_attempt_at=? WHERE kind=? AND id=?').run(q.next_attempt_at,kind,id);return result??null;}
            ensure(after.held===1||TERMINAL.includes(after.phase),'COMPUTE_ADMISSION_NOT_CLAIMED','领取回调必须原子更新业务执行状态');return result;
        });
    }
    assertEnqueue(kind:ComputeKind,_projectId:string,context?:string) {
        const limit=this.config().limits.maxQueued;if(limit!==null)ensure(Number(this.c.store.db.prepare("SELECT count(*) n FROM compute_queue WHERE phase='queued'").get()!.n)<limit,'COMPUTE_QUEUE_FULL','计算等待队列已满');
        const name=context??(kind!=='run'?'default':undefined),ctx=name?this.context(name):undefined;
        if(name){const capped=this.c.store.db.prepare("SELECT 1 FROM compute_limits WHERE target_id NOT IN ('host','host-example') AND json_extract(data,'$.maxQueued') IS NOT NULL LIMIT 1").get();ensure(!capped||ctx?.status==='ready'&&ctx.next_probe_at>Date.now()&&ctx.target_id,'COMPUTE_TARGET_PROBE_REQUIRED','存在目标队列配额；请先核对 Docker context 的当前引擎身份',409);}
        const target=name?ctx?.target_id:'host-example';if(!target)return;
        const targetLimit=this.config(target).limits.maxQueued;if(targetLimit===null)return;
        const used=Number(this.c.store.db.prepare("SELECT count(*) n FROM compute_queue WHERE phase='queued' AND (target_id=? OR (?<>'host-example' AND backend IN ('docker','ssh') AND bound=0))").get(target,target)!.n);
        ensure(used<targetLimit,'COMPUTE_TARGET_QUEUE_FULL','目标等待队列已满；若 context 已更换引擎，请先重新核对目标',409);
    }
    /** Owner-only identity discovery; does not create a job, bind old jobs or grant execution. */
    async probeContext(actor:Actor,context:string,validate:()=>void=()=>{}):Promise<ComputeTargetProbe> {
        userOnly(actor);text(context,'context',100);ensure(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(context),'INVALID_INPUT','Docker context 名称无效',400);validate();
        let identity:Identity;try{identity=await this.probe(context);}catch{throw new DomainError('COMPUTE_TARGET_UNAVAILABLE','无法核对本机 Docker 目标身份',409);}validate();
        return this.c.store.transaction(()=>{validate();this.remember(context,identity);return {context,targetId:identity.targetId,backend:'docker' as const,observedAt:new Date().toISOString()};});
    }
    private remember(context:string,identity:Identity) {
        this.c.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES(?,?,?,?,'ready',?) ON CONFLICT(context) DO UPDATE SET target_id=excluded.target_id,engine_id=excluded.engine_id,endpoint=excluded.endpoint,status='ready',next_probe_at=excluded.next_probe_at,probe_until=0,failures=0,last_error=NULL").run(context,identity.targetId,identity.engineId,identity.endpoint,Date.now()+30000);
    }
    private async ownsLegacy(q:QueueRow):Promise<boolean> {
        const record=this.c.store.get<Record<string,any>>(sourceKind(q.kind),q.id,q.project_id),execution=q.kind==='run'?record.execution:record;
        const name=q.kind==='run'?`pi-research-${q.id}`:q.kind==='document'?`pi-document-${q.id}`:q.kind==='publication'?`pi-publication-${q.id}`:`pi-development-${q.id}`,id=execution?.containerId as string|undefined,container=await this.inspectContainer(q.context_name!,id??name);
        return !!(container&&(!id||container.Id===id)&&container.Config?.Labels?.[JOB_LABEL]===q.id&&container.Config?.Labels?.[MANIFEST_LABEL]===record.manifestDigest);
    }
    async verifyTarget(kind:ComputeKind,id:string):Promise<void> {
        const before=this.row(kind,id);if(before.backend==='trusted-example')return;
        let identity:Identity;
        try{identity=await this.probe(before.context_name!);}catch{this.c.store.db.prepare("UPDATE compute_contexts SET status='unavailable',next_probe_at=?,last_error='COMPUTE_TARGET_UNAVAILABLE' WHERE context=?").run(Date.now()+5000,before.context_name!);throw new DomainError('COMPUTE_TARGET_UNAVAILABLE','不能确认原计算目标身份；保持资源预留',409);}
        let owned=true;try{if(!before.bound&&before.held)owned=await this.ownsLegacy(before);}catch{throw new DomainError('COMPUTE_LEGACY_TARGET_UNKNOWN','不能确认旧作业容器归属；保持资源预留',409);}
        if(!before.bound&&before.held&&owned){const again=await this.probe(before.context_name!);ensure(again.engineId===identity.engineId&&again.endpoint===identity.endpoint,'COMPUTE_TARGET_CHANGED','计算目标在身份核验期间变化');}
        const allowed=this.c.store.transaction(()=>{const current=this.row(kind,id);ensure(current.generation===before.generation&&current.context_name===before.context_name&&!TERMINAL.includes(current.phase),'COMPUTE_LEASE_EXPIRED','作业已被其他执行器接管或结束');
            this.remember(current.context_name!,identity);
            if(current.bound&&(current.engine_id!==identity.engineId||current.endpoint!==identity.endpoint)){this.c.store.db.prepare("UPDATE compute_queue SET last_error='COMPUTE_TARGET_CHANGED' WHERE kind=? AND id=?").run(kind,id);return false;}
            if(!current.bound&&!owned){this.c.store.db.prepare("UPDATE compute_queue SET last_error='COMPUTE_LEGACY_TARGET_UNKNOWN' WHERE kind=? AND id=?").run(kind,id);return false;}
            ensure(!before.bound||!current.held||current.lease_until>Date.now(),'COMPUTE_LEASE_EXPIRED','目标探测后作业租约已失效');
            this.c.store.db.prepare('UPDATE compute_queue SET target_id=?,engine_id=?,endpoint=?,bound=1,last_error=NULL WHERE kind=? AND id=?').run(identity.targetId,identity.engineId,identity.endpoint,kind,id);return true;
        });
        ensure(allowed,before.bound?'COMPUTE_TARGET_CHANGED':'COMPUTE_LEGACY_TARGET_UNKNOWN','无法确认原计算目标；不得把其他目标的缺失容器当成已终止',409);
    }
    tick():void {if(!this.stopped&&!this.pending)this.pending=this.probeNext().catch(()=>{}).finally(()=>{this.pending=undefined;});}
    private async probeNext() {
        const context=this.c.store.transaction(()=>{const row=this.c.store.db.prepare("SELECT c.* FROM compute_contexts c WHERE c.next_probe_at<=? AND c.probe_until<=? AND EXISTS(SELECT 1 FROM compute_queue q WHERE q.context_name=c.context AND q.phase NOT IN ('succeeded','failed','cancelled','timed_out')) ORDER BY c.next_probe_at,c.context LIMIT 1").get(Date.now(),Date.now()) as unknown as ContextRow|undefined;if(!row)return;this.c.store.db.prepare('UPDATE compute_contexts SET probe_until=? WHERE context=?').run(Date.now()+120000,row.context);return row;});
        if(!context)return;
        try{const identity=await this.probe(context.context);this.c.store.transaction(()=>{this.remember(context.context,identity);this.bindCachedQueued();});
            const legacy=this.c.store.db.prepare("SELECT kind,id FROM compute_queue WHERE context_name=? AND held=1 AND bound=0 ORDER BY sequence LIMIT 8").all(context.context);for(const job of legacy)try{await this.verifyTarget(job.kind as ComputeKind,String(job.id));}catch{/* Unproven old workloads retain host and possible-target reservations. */}
        }catch{this.c.store.db.prepare("UPDATE compute_contexts SET status='unavailable',failures=failures+1,probe_until=0,next_probe_at=?,last_error='COMPUTE_TARGET_UNAVAILABLE' WHERE context=?").run(Date.now()+Math.min(60000,1000*2**Math.min(context.failures+1,6)),context.context);}
    }
    async stop():Promise<void> {this.stopped=true;await this.pending;}
    configure(actor:Actor,value:unknown):ComputeConfiguration {
        userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['expectedVersion','targetId','limits'].includes(k)),'INVALID_INPUT','计算配额字段无效',400);const targetId=x.targetId===undefined?'host':text(x.targetId,'targetId',100),patch=object(x.limits);
        ensure(Object.keys(patch).length>0&&Object.keys(patch).every(k=>Object.hasOwn(DEFAULTS,k)),'INVALID_INPUT','计算配额字段无效',400);
        for(const [key,v] of Object.entries(patch)){if(['cpus','memoryMb','maxQueued'].includes(key)&&v===null)continue;if(key==='cpus')ensure(typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1024&&Math.abs(v*1000-Math.round(v*1000))<1e-7,'INVALID_INPUT','CPU 配额需为 0–1024，最多三位小数',400);else integer(v,key,0,['maxRuns','maxDevelopment','maxJobs'].includes(key)?256:Number.MAX_SAFE_INTEGER);}
        return this.c.store.transaction(()=>{ensure(targetId==='host'||targetId==='host-example'||!!this.c.store.db.prepare('SELECT 1 FROM compute_contexts WHERE target_id=? UNION SELECT 1 FROM compute_queue WHERE target_id=? LIMIT 1').get(targetId,targetId),'NOT_FOUND','计算目标尚未识别',404);const current=this.config(targetId);ensure(current.version===integer(x.expectedVersion,'expectedVersion',0),'VERSION_CONFLICT','配额已更新');const old=this.c.store.db.prepare('SELECT data FROM compute_limits WHERE target_id=?').get(targetId),data={...(old?JSON.parse(old.data as string):{}),...patch};this.c.store.db.prepare('INSERT INTO compute_limits VALUES(?,?,?) ON CONFLICT(target_id) DO UPDATE SET version=excluded.version,data=excluded.data').run(targetId,current.version+1,JSON.stringify(data));return this.config(targetId);});
    }
    private reason(r:QueueRow,heads:QueueRow[],next?:QueueRow):ComputeWaitReason {
        if(r.held&&r.lease_until>Date.now())return 'worker_active';
        if(r.held&&r.next_attempt_at>Date.now())return 'recovery_backoff';
        if(r.backend!=='trusted-example'){if(!r.bound)return r.held?'legacy_target_unknown':'target_unresolved';const context=this.context(r.context_name!);if(context?.status==='unavailable')return 'target_unavailable';if(context?.engine_id!==r.engine_id||context?.endpoint!==r.endpoint)return 'target_changed';if(!this.targetReady(r,!r.held))return 'target_unresolved';}
        if(r.held)return r.backend!=='trusted-example'?'recovery_due':'manual_recovery_required';
        if(this.tooLarge(r))return 'request_too_large';const capacity=this.capacity(r);if(capacity)return capacity;
        return heads.some(h=>h.target_id===r.target_id&&h.sequence<r.sequence)||next&&next.sequence<r.sequence?'earlier_job':'ready';
    }
    inspect(actor:Actor,pid?:string,options:{cursor?:number;limit?:number}={}):ComputeQueueInspection {
        userOnly(actor);if(pid){scope(actor,pid);this.c.store.get('project',pid);}const cursor=integer(options.cursor??0,'cursor',0,Number.MAX_SAFE_INTEGER),limit=integer(options.limit??50,'limit',1,256);
        const rows=this.c.store.db.prepare(`SELECT * FROM compute_queue WHERE phase NOT IN ('succeeded','failed','cancelled','timed_out') AND sequence>? ${pid?'AND project_id=?':''} ORDER BY sequence LIMIT ?`).all(...(pid?[cursor,pid,limit+1]:[cursor,limit+1])) as unknown as QueueRow[];
        const targets=this.c.store.db.prepare("SELECT target_id FROM compute_contexts WHERE target_id IS NOT NULL UNION SELECT target_id FROM compute_queue WHERE held=1 AND target_id IS NOT NULL UNION SELECT target_id FROM compute_queue WHERE phase='queued' AND target_id IS NOT NULL UNION SELECT 'host-example' target_id ORDER BY target_id LIMIT 256").all(),heads=this.heads(),next=heads.find(r=>!this.capacity(r));
        const configuration=this.config(),usage=this.usage(),available=this.available(configuration.limits,usage);
        return {scope:'shared-data-directory',configuration,usage,available,queued:Number(this.c.store.db.prepare("SELECT count(*) n FROM compute_queue WHERE phase='queued'").get()!.n),targets:targets.map(t=>{const id=String(t.target_id),configuration=this.config(id),usage=this.usage(id);return {targetId:id,backend:id==='host-example'?'trusted-example' as const:id.startsWith('ssh-')?'ssh' as const:'docker' as const,contexts:this.c.store.db.prepare('SELECT context FROM compute_contexts WHERE target_id=? ORDER BY context').all(id).map(c=>String(c.context)),configuration,usage,available:this.effectiveAvailable(available,this.available(configuration.limits,usage))};}),items:rows.slice(0,limit).map(r=>({kind:r.kind,id:r.id,projectId:r.project_id,sequence:r.sequence,state:r.phase,held:!!r.held,backend:r.backend,targetId:r.bound?r.target_id:null,requested:{cpus:r.cpu_millis/1000,memoryMb:r.memory_mb},generation:r.generation,leaseUntil:r.lease_until,nextAttemptAt:r.next_attempt_at,reason:this.reason(r,heads,next)})),nextCursor:rows.length>limit?rows[limit-1].sequence:null};
    }
}
