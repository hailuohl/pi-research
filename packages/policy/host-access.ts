import {spawn, type ChildProcess} from 'node:child_process';
import {existsSync,statSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Actor,Session,Project,Row} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {userOnly,scope} from './permissions.js';

export interface HostAccessGrant {sessionId:string;epoch:number;runtimeId:string;state:'enabled'|'revoked';boundary:'trusted-host';acknowledgedSameUserAccess:true;acknowledgedUnknownJobIds?:string[];}
export interface HostCommand {sessionId:string;generation:number;epoch:number;runtimeId:string;requestDigest:string;argv:string[];cwd:string;timeoutMs:number;state:'starting'|'running'|'succeeded'|'failed'|'cancelled'|'unknown';pid?:number;stdout:string;stderr:string;outputTruncated:boolean;exitCode?:number|null;error?:string;}
interface ActiveCommand {child:ChildProcess;sessionId:string;epoch:number;generation:number;promise:Promise<Row<HostCommand>>;cancel:(reason:string)=>void;}
const clean=(value:string)=>value.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g,'[REDACTED]').replace(/Bearer\s+[^\s"']+/gi,'Bearer [REDACTED]');

/** Trusted same-user host execution, deliberately NOT an OS sandbox or owner-auth boundary. */
export class HostAccessService {
    onChanged?: (sessionId:string)=>void;
    private readonly runtimeId=randomUUID();
    private readonly active=new Map<string,ActiveCommand>();
    private readonly uncertain=new Map<string,Partial<HostCommand>>();
    private stopping=false;
    private closing=false;
    // Background workers and CLI construct ResearchApp too. Connecting must never rewrite a live owner's facts.
    constructor(private c:{store:Store;dataDir:string;repoRoot:string}) {}
    private jobs(session:Row<Session>) {return this.c.store.list<HostCommand>('host-command',session.projectId!).filter(j=>j.sessionId===session.id).map(j=>{
        const uncertain=this.uncertain.get(j.id);
        return uncertain?{...j,...uncertain,state:'unknown' as const}:['starting','running'].includes(j.state)&&j.runtimeId!==this.runtimeId?{...j,state:'unknown' as const,error:'此命令不属于当前执行端；退出与外部效果未确认，不自动重试'}:j;
    });}
    private hasUnreviewed(session:Row<Session>,grant?:Row<HostAccessGrant>) {return this.jobs(session).some(j=>j.state==='unknown'&&!(grant?.acknowledgedUnknownJobIds??[]).includes(j.id));}
    status(actor:Actor,sessionId:string) {
        const session=this.session(actor,sessionId),grant=this.c.store.maybe<HostAccessGrant>('host-access',sessionId);
        const bound=!!(session.workingGrantId||session.runGrantId||session.discoveryGrantId||session.textCorpusGrantId);
        const eligible=session.role==='coordinator'&&!session.taskId&&!session.teamId&&!session.parentSessionId&&!bound&&session.state!=='archived'&&!this.c.store.get<Project>('project',session.projectId!).archived;
        const enabled=eligible&&!!grant&&grant.state==='enabled'&&grant.runtimeId===this.runtimeId&&!this.closing&&!this.stopping&&!this.hasUnreviewed(session,grant);
        const jobs=this.jobs(session);
        return {sessionId,version:grant?.version??0,epoch:grant?.epoch??0,available:eligible&&!this.closing&&!this.stopping,enabled,boundary:'trusted-host' as const,osSandboxVerified:false,
            reason:eligible?'本机可信模式：命令可接触当前系统用户的应用数据、凭据与第三方权限，不提供同用户隔离。':bound?'此会话已有固定范围授权，请使用新的普通主协调会话开启本机完全访问。':'仅未归档的交互主协调会话可启用；子任务和自动唤醒不继承。',
            revokedOnRestart:!!grant&&grant.state==='enabled'&&grant.runtimeId!==this.runtimeId,
            activeCommands:jobs.filter(j=>['starting','running'].includes(j.state)).length,unknownCommands:jobs.filter(j=>j.state==='unknown').length,
            jobs:jobs.slice(-20).map(({id,state,pid,exitCode,error,createdAt,epoch})=>({id,state,pid,exitCode,error,createdAt,epoch}))};
    }
    private session(actor:Actor,id:string) {const session=this.c.store.get<Session>('session',id);scope(actor,session.projectId!);ensure(actor.type==='user'||actor.sessionId===id,'SCOPE_DENIED','只能查看自己的宿主权限',403);return session;}
    enable(actor:Actor,id:string,input:unknown) {
        userOnly(actor);const x=object(input);
        ensure(Object.keys(x).every(k=>['expectedVersion','acknowledgedSameUserAccess','acknowledgedUnknownEffects'].includes(k))&&x.acknowledgedSameUserAccess===true&&(x.acknowledgedUnknownEffects===undefined||typeof x.acknowledgedUnknownEffects==='boolean'),'HOST_ACCESS_ACK_REQUIRED','需要明确接受本机未隔离、同用户应用数据和凭据可达',400);
        const expected=integer(x.expectedVersion,'expectedVersion',0);
        this.c.store.transaction(()=>{
            const session=this.session(actor,id),state=this.status(actor,id),prior=this.c.store.maybe<HostAccessGrant>('host-access',id);
            ensure(state.available,'HOST_ACCESS_UNAVAILABLE',state.reason,403);ensure(!this.c.store.get<Project>('project',session.projectId!).archived&&session.state!=='archived','SESSION_ARCHIVED','归档会话不可启用');
            ensure(!['running','queued'].includes(session.state),'SESSION_BUSY','等待当前执行与队列结束后再启用完全访问');
            ensure(state.version===expected,'VERSION_CONFLICT','权限已变化，请刷新后重试');
            const unknown=this.jobs(session).filter(j=>j.state==='unknown');
            ensure(!unknown.length||x.acknowledgedUnknownEffects===true,'HOST_EFFECTS_REVIEW_REQUIRED','存在退出或记录状态未确认的命令，需用户核对旧进程和外部效果后重新启用',409);
            for(const job of unknown){const raw=this.c.store.get<HostCommand>('host-command',job.id);if(raw.state!=='unknown')this.c.store.update<HostCommand>('host-command',raw.id,raw.version,{...this.uncertain.get(job.id),state:'unknown',error:job.error});}
            const grant:HostAccessGrant={sessionId:id,epoch:(prior?.epoch??0)+1,runtimeId:this.runtimeId,state:'enabled',boundary:'trusted-host',acknowledgedSameUserAccess:true,acknowledgedUnknownJobIds:unknown.map(j=>j.id)};
            if(prior)this.c.store.update<HostAccessGrant>('host-access',id,prior.version,grant);else this.c.store.create('host-access',session.projectId,grant,id);
            this.c.store.event(session.projectId,'host_access.enabled',{sessionId:id,epoch:grant.epoch,boundary:grant.boundary,osSandboxVerified:false});
            this.onChanged?.(id);
        });for(const job of this.jobs(this.session(actor,id)))if(job.state==='unknown')this.uncertain.delete(job.id);return this.status(actor,id);
    }
    revoke(actor:Actor,id:string,input:unknown) {
        userOnly(actor);const x=object(input);ensure(Object.keys(x).every(k=>k==='expectedVersion'),'INVALID_INPUT','撤销只接受 expectedVersion');
        const expected=integer(x.expectedVersion,'expectedVersion',0),session=this.session(actor,id);
        this.c.store.transaction(()=>{const prior=this.c.store.maybe<HostAccessGrant>('host-access',id);ensure((prior?.version??0)===expected,'VERSION_CONFLICT','权限已变化，请刷新后重试');if(prior)this.c.store.update<HostAccessGrant>('host-access',id,prior.version,{state:'revoked',epoch:prior.epoch+1});this.c.store.event(session.projectId,'host_access.revoked',{sessionId:id,epoch:(prior?.epoch??0)+1});});
        this.onChanged?.(id);
        for(const job of this.active.values())if(job.sessionId===id)job.cancel('完全访问已撤销；已发出的网络和文件变更无法撤回');
        return this.status(actor,id);
    }
    assertAgent(actor:Actor,epoch?:number) {
        ensure(actor.type==='agent'&&actor.projectId&&actor.sessionId&&actor.role==='coordinator'&&!actor.taskId&&!actor.attemptId&&!actor.wakeupId&&!(actor as Actor&{teamId?:string}).teamId,'HOST_ACCESS_DENIED','宿主执行只属于获准的交互主协调会话',403);
        const session=this.session(actor,actor.sessionId),grant=this.c.store.maybe<HostAccessGrant>('host-access',session.id);
        ensure(session.role===actor.role&&!session.taskId&&!session.teamId&&!session.parentSessionId&&session.state==='running'&&session.generation===actor.generation&&session.leaseUntil>Date.now(),'LEASE_EXPIRED','宿主执行身份或租约已失效',403);
        ensure(!session.workingGrantId&&!session.runGrantId&&!session.discoveryGrantId&&!session.textCorpusGrantId,'HOST_ACCESS_BOUND','已有固定范围授权的会话不提供宿主执行',403);
        ensure(!this.c.store.get<Project>('project',session.projectId!).archived,'SCOPE_DENIED','项目已归档',403);
        ensure(!this.closing&&!this.stopping&&grant?.state==='enabled'&&grant.runtimeId===this.runtimeId&&(epoch===undefined||grant.epoch===epoch),'HOST_ACCESS_REVOKED','宿主完全访问未开启、已撤销或执行端失效',403);
        ensure(!this.hasUnreviewed(session,grant),'HOST_ACCESS_BLOCKED','宿主命令退出或记录状态未确认；需用户核对后重新启用',409);
        return grant;
    }
    canExpose(sessionId:string,automation=false) {if(automation)return false;const s=this.c.store.get<Session>('session',sessionId);return s.role==='coordinator'&&!s.taskId&&!s.teamId&&!s.parentSessionId&&this.status({type:'user'},sessionId).enabled;}
    execute(actor:Actor,input:unknown,callId:string):Promise<Row<HostCommand>> {
        const grant=this.assertAgent(actor),x=object(input);ensure(Object.keys(x).every(k=>['argv','cwd','timeoutMs'].includes(k)),'INVALID_INPUT','命令包含未知字段');
        ensure(Array.isArray(x.argv)&&x.argv.length>=1&&x.argv.length<=128,'INVALID_INPUT','argv 必须包含可执行程序');
        const argv=x.argv.map((arg,i)=>{ensure(typeof arg==='string'&&!arg.includes('\0')&&arg.length<=32000&&(i>0||arg.trim()),'INVALID_INPUT','命令参数无效');return arg as string;});
        const session=this.c.store.get<Session>('session',actor.sessionId!);
        const cwd=x.cwd===undefined?this.c.store.paths.physical(session.workspace):text(x.cwd,'cwd',32000);
        ensure(isAbsolute(cwd)&&existsSync(cwd)&&statSync(cwd).isDirectory(),'INVALID_INPUT','cwd 需要存在的绝对目录');
        const timeoutMs=x.timeoutMs===undefined?30000:integer(x.timeoutMs,'timeoutMs',1,60000),requestDigest=digest({argv,cwd:resolve(cwd),timeoutMs}),id=digest({sessionId:session.id,callId});
        ensure(typeof callId==='string'&&callId.trim()&&callId.length<=200,'OPERATION_ID_REQUIRED','命令需要调用标识');
        const old=this.c.store.maybe<HostCommand>('host-command',id);
        if(old){ensure(old.requestDigest===requestDigest,'IDEMPOTENCY_CONFLICT','同一调用标识不能用于不同命令');this.assertAgent(actor,old.epoch);ensure(old.runtimeId===this.runtimeId&&old.generation===actor.generation,'LEASE_EXPIRED','旧命令属于已经失效的执行身份');const active=this.active.get(id);return active?active.promise.then(result=>{this.assertAgent(actor,old.epoch);return result;}):Promise.resolve(old);}
        ensure(![...this.active.values()].some(job=>job.sessionId===session.id),'HOST_COMMAND_BUSY','当前会话的上一条宿主命令尚未退出');
        let child:ChildProcess|undefined;
        let row:Row<HostCommand>;
        this.c.store.transaction(()=>{
            this.assertAgent(actor,grant.epoch);
            row=this.c.store.create<HostCommand>('host-command',session.projectId,{sessionId:session.id,generation:actor.generation!,epoch:grant.epoch,runtimeId:this.runtimeId,requestDigest,argv,cwd:resolve(cwd),timeoutMs,state:'starting',stdout:'',stderr:'',outputTruncated:false},id);
        });
        try { this.c.store.transaction(()=>{
            this.assertAgent(actor,grant.epoch);
            // Do not automatically copy PI/model credentials or NODE_OPTIONS into arbitrary commands.
            const env:NodeJS.ProcessEnv={};for(const [name,value] of Object.entries(process.env))if(/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|LANG|LC_ALL)$/i.test(name))env[name]=value;
            child=spawn(argv[0],argv.slice(1),{cwd:resolve(cwd),env,shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
            row=this.c.store.update<HostCommand>('host-command',id,row!.version,{state:'running',...(child.pid?{pid:child.pid}:{})});
            this.c.store.event(session.projectId,'host_command.started',{sessionId:session.id,jobId:id,epoch:grant.epoch});
        }); } catch(error) {
            const unknown:Partial<HostCommand>={state:'unknown',...(child?.pid?{pid:child.pid}:{}),error:child?'启动记录未完成；可能已经产生外部效果，需用户核对原进程后重新启用':'启动记录状态未确认，需用户核对后重新启用'};
            // Preserve the admission barrier BEFORE best-effort cleanup or recovery writes can fail.
            this.uncertain.set(id,unknown);
            try{if(child?.pid){if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}).on('error',()=>{});else process.kill(-child.pid,'SIGTERM');}}catch{}
            if(child)child.on('error',()=>{});
            try{this.c.store.transaction(()=>{const latest=this.c.store.get<HostCommand>('host-command',id);this.c.store.update<HostCommand>('host-command',id,latest.version,{...unknown,state:child?'unknown':'failed'});this.c.store.event(session.projectId,'host_command.start_failed',{sessionId:session.id,jobId:id,state:child?'unknown':'failed'});});if(!child)this.uncertain.delete(id);}catch{}
            throw error;
        }
        let stdout='',stderr='',truncated=false,done=false,cancelReason:string|undefined;
        let resolveResult:(value:Row<HostCommand>)=>void;
        const promise=new Promise<Row<HostCommand>>(resolvePromise=>{resolveResult=resolvePromise;});
        const append=(target:'stdout'|'stderr',chunk:Buffer)=>{const content=chunk.toString('utf8');if(target==='stdout'){if(stdout.length+content.length>65536)truncated=true;stdout=(stdout+content).slice(0,65536);}else{if(stderr.length+content.length>65536)truncated=true;stderr=(stderr+content).slice(0,65536);}};
        child!.stdout!.on('data',chunk=>append('stdout',chunk));child!.stderr!.on('data',chunk=>append('stderr',chunk));
        const finish=(state:HostCommand['state'],exitCode:number|null,error?:string)=>{
            if(done)return;done=true;clearInterval(fence);clearTimeout(deadline);clearTimeout(stopDeadline);
            const result:Partial<HostCommand>={state,exitCode,stdout:clean(stdout),stderr:clean(stderr),outputTruncated:truncated,...(error?{error:clean(error).slice(0,32000)}:{})};
            if(state==='unknown')this.uncertain.set(id,result);
            try {if(!this.closing)this.c.store.transaction(()=>{
                const latest=this.c.store.get<HostCommand>('host-command',id);
                row=this.c.store.update<HostCommand>('host-command',id,latest.version,result);
                this.c.store.event(session.projectId,'host_command.finished',{sessionId:session.id,jobId:id,state,epoch:grant.epoch});
                if(state==='unknown'){const current=this.c.store.maybe<HostAccessGrant>('host-access',session.id);if(current?.state==='enabled'&&current.epoch===grant.epoch){this.c.store.update<HostAccessGrant>('host-access',session.id,current.version,{state:'revoked',epoch:current.epoch+1});this.c.store.event(session.projectId,'host_access.suspended',{sessionId:session.id,jobId:id});}}
            });}
            catch {const unknown={...result,state:'unknown' as const,error:'命令终态记录或审计写入失败；需用户核对实际进程和外部效果后重新启用'};this.uncertain.set(id,unknown);row={...row!,...unknown};}
            finally {this.active.delete(id);resolveResult!(row!);}
        };
        let stopDeadline:ReturnType<typeof setTimeout>|undefined;
        const cancel=(reason:string)=>{
            if(done||cancelReason)return;cancelReason=reason;
            if(child!.pid&&process.platform==='win32')spawn('taskkill',['/PID',String(child!.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}).on('error',()=>{});
            else if(child!.pid)try{process.kill(-child!.pid,'SIGTERM');}catch{child!.kill('SIGTERM');}
            stopDeadline=setTimeout(()=>finish('unknown',null,reason+'；受管进程退出未确认，不能保证清除脱管进程'),4000);stopDeadline.unref();
        };
        const deadline=setTimeout(()=>cancel('命令超过执行时限'),timeoutMs);deadline.unref();
        const fence=setInterval(()=>{try{this.assertAgent(actor,grant.epoch);}catch{cancel('会话、租约或完全访问授权已失效');}},100);fence.unref();
        this.active.set(id,{child:child!,sessionId:session.id,epoch:grant.epoch,generation:actor.generation!,promise,cancel});
        child!.once('error',error=>finish('failed',null,error.message));
        child!.once('close',code=>finish(cancelReason?'cancelled':code===0?'succeeded':'failed',code,cancelReason));
        return promise.then(result=>{this.assertAgent(actor,grant.epoch);return result;});
    }
    async stop() {this.stopping=true;for(const job of this.active.values())job.cancel('服务关闭，完全访问授权将失效');await Promise.allSettled([...this.active.values()].map(job=>job.promise));}
    close() {this.stopping=true;for(const [id,job] of this.active){job.cancel('应用关闭');const unknown={state:'unknown' as const,error:'应用关闭；进程退出与外部效果需核对，不自动重试'};this.uncertain.set(id,unknown);try{const row=this.c.store.get<HostCommand>('host-command',id);this.c.store.update<HostCommand>('host-command',id,row.version,unknown);}catch{}}this.closing=true;}
}
