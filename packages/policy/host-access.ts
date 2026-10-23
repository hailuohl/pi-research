import {automaticTextGrantCompatible} from './automatic-text-grant.js';
import {spawn, type ChildProcess} from 'node:child_process';
import {StringDecoder} from 'node:string_decoder';
import {existsSync,statSync} from 'node:fs';
import {resolve,isAbsolute} from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Store} from '../storage/store.js';
import {digest} from '../storage/store.js';
import type {Actor,Session,Project,Row} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {userOnly,scope} from './permissions.js';
import {environmentVariables,environmentSecrets,redactEnvironment,redactEnvironmentChunk} from '../runtime/environment.js';

export interface ResearchAutomationPolicy {version:2;limits:{development:number|null;run:number|null;continuations:number|null;durationMs:number|null};recoverAfterRestart:boolean;}
export interface HostAccessGrant {automaticApprovalScope?:1;automaticApprovalAcknowledgedAt?:string;researchAutomationScope?:1|2;researchAutomationPolicy?:ResearchAutomationPolicy;researchAutomationAcknowledgedAt?:string;sessionId:string;epoch:number;runtimeId:string;state:'pending'|'enabled'|'revoked';boundary:'trusted-host';acknowledgedSameUserAccess:true;acknowledgedUnknownJobIds?:string[];}
function automationPolicy(input:unknown):ResearchAutomationPolicy {const p=object(input),limits=object(p.limits);ensure(Object.keys(p).every(k=>['version','limits','recoverAfterRestart'].includes(k))&&p.version===2&&typeof p.recoverAfterRestart==='boolean'&&Object.keys(limits).length===4&&Object.keys(limits).every(k=>['development','run','continuations','durationMs'].includes(k)),'INVALID_INPUT','持续研究授权需要完整范围和恢复选择',400);for(const value of Object.values(limits))ensure(value===null||typeof value==='number'&&Number.isSafeInteger(value)&&value>=0,'INVALID_INPUT','总额度必须为非负整数或明确的 null 无上限',400);ensure(limits.durationMs===null||typeof limits.durationMs==='number'&&limits.durationMs<=8.64e15-Date.now(),'INVALID_INPUT','任务时长超出可表示范围',400);return {version:2,limits:limits as ResearchAutomationPolicy['limits'],recoverAfterRestart:p.recoverAfterRestart};}
export interface HostCommand {sessionId:string;generation:number;epoch:number;runtimeId:string;requestDigest:string;argv:string[];cwd:string;timeoutMs:number;state:'starting'|'running'|'succeeded'|'failed'|'cancelled'|'unknown';pid?:number;stdout:string;stderr:string;outputTruncated:boolean;exitCode?:number|null;error?:string;}
interface ActiveCommand {child:ChildProcess;sessionId:string;epoch:number;generation:number;promise:Promise<Row<HostCommand>>;cancel:(reason:string)=>void;}
const clean=(value:string)=>value.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g,'[REDACTED]').replace(/Bearer\s+[^\s"']+/gi,'Bearer [REDACTED]');

/** Trusted same-user host execution, deliberately NOT an OS sandbox or owner-auth boundary. */
export class HostAccessService {
    onChanged?: (sessionId:string,previousHostEpoch?:number)=>void;
    private readonly runtimeId=randomUUID();
    researchRuntimeId(){return this.runtimeId;}
    private readonly active=new Map<string,ActiveCommand>();
    private readonly uncertain=new Map<string,Partial<HostCommand>>();
    private stopping=false;
    private closing=false;
    // Background workers and CLI construct ResearchApp too. Connecting must never rewrite a live owner's facts.
    constructor(private c:{store:Store;dataDir:string;repoRoot:string;sessionHeld:(sessionId:string)=>boolean}) {}
    private jobs(session:Row<Session>) {return this.c.store.list<HostCommand>('host-command',session.projectId!).filter(j=>j.sessionId===session.id).map(j=>{
        const uncertain=this.uncertain.get(j.id);
        return uncertain?{...j,...uncertain,state:'unknown' as const}:['starting','running'].includes(j.state)&&j.runtimeId!==this.runtimeId?{...j,state:'unknown' as const,error:'此命令不属于当前执行端；退出与外部效果未确认，不自动重试'}:j;
    });}
    private hasUnreviewed(session:Row<Session>,grant?:Row<HostAccessGrant>) {return this.jobs(session).some(j=>j.state==='unknown'&&!(grant?.acknowledgedUnknownJobIds??[]).includes(j.id));}
    status(actor:Actor,sessionId:string) {
        const session=this.session(actor,sessionId),grant=this.c.store.maybe<HostAccessGrant>('host-access',sessionId);
        const bound=!!(session.workingGrantId||session.runGrantId||session.discoveryGrantId||!automaticTextGrantCompatible(this.c.store,session,grant));
        const eligible=session.role==='coordinator'&&!session.taskId&&!session.teamId&&!session.parentSessionId&&!bound&&session.state!=='archived'&&!this.c.store.get<Project>('project',session.projectId!).archived;
        const enabled=eligible&&!!grant&&grant.state==='enabled'&&grant.runtimeId===this.runtimeId&&!this.closing&&!this.stopping&&!this.hasUnreviewed(session,grant);
        const jobs=this.jobs(session);
        const researchAutomation=eligible&&grant?.state==='enabled'&&!this.hasUnreviewed(session,grant)&&(grant.researchAutomationScope===2||enabled&&grant.researchAutomationScope===1);
        return {automaticApprovalScope:grant?.automaticApprovalScope??0,researchAutomation,researchAutomationScope:grant?.researchAutomationScope??0,researchAutomationPolicy:grant?.researchAutomationPolicy,sessionId,version:grant?.version??0,epoch:grant?.epoch??0,available:eligible&&!this.closing&&!this.stopping,enabled,pending:grant?.state==='pending'&&grant.runtimeId===this.runtimeId&&!this.closing&&!this.stopping,boundary:'trusted-host' as const,osSandboxVerified:false,
            reason:eligible?'本机可信模式：命令可接触当前系统用户的应用数据、凭据与第三方权限，不提供同用户隔离。':bound?'此会话已有固定范围授权，请使用新的普通主协调会话开启本机完全访问。':'仅未归档的交互主协调会话可启用；子任务和自动唤醒不继承。',
            revokedOnRestart:!!grant&&grant.state!=='revoked'&&grant.runtimeId!==this.runtimeId,
            activeCommands:jobs.filter(j=>['starting','running'].includes(j.state)).length,unknownCommands:jobs.filter(j=>j.state==='unknown').length,
            jobs:jobs.slice(-20).map(({id,state,pid,exitCode,error,createdAt,epoch})=>({id,state,pid,exitCode,error,createdAt,epoch}))};
    }
    private session(actor:Actor,id:string) {const session=this.c.store.get<Session>('session',id);scope(actor,session.projectId!);ensure(actor.type==='user'||actor.sessionId===id,'SCOPE_DENIED','只能查看自己的宿主权限',403);return session;}
    private executionActive(session:Row<Session>) {return session.state==='running'||this.c.sessionHeld(session.id)||[...this.active.values()].some(job=>job.sessionId===session.id);}
    enable(actor:Actor,id:string,input:unknown) {
        userOnly(actor);const x=object(input);
        ensure(Object.keys(x).every(k=>['expectedVersion','acknowledgedSameUserAccess','acknowledgedUnknownEffects','acknowledgedResearchAutomation','researchAutomationPolicy','acknowledgedAutomaticApprovals'].includes(k))&&x.acknowledgedSameUserAccess===true&&(x.acknowledgedUnknownEffects===undefined||typeof x.acknowledgedUnknownEffects==='boolean'),'HOST_ACCESS_ACK_REQUIRED','需要明确接受本机未隔离、同用户应用数据和凭据可达',400);
        ensure(x.acknowledgedResearchAutomation===undefined||x.acknowledgedResearchAutomation===true,'INVALID_INPUT','自主计算范围需要显式确认');
        ensure(x.researchAutomationPolicy===undefined||x.acknowledgedResearchAutomation===true,'HOST_ACCESS_ACK_REQUIRED','持续授权范围需要明确确认',400);
        const policy=x.researchAutomationPolicy===undefined?undefined:automationPolicy(x.researchAutomationPolicy);
        ensure(x.acknowledgedAutomaticApprovals===undefined||x.acknowledgedAutomaticApprovals===true&&policy?.version===2,'HOST_ACCESS_ACK_REQUIRED','自动审批需要明确确认新的持续研究范围',400);
        const expected=integer(x.expectedVersion,'expectedVersion',0);
        this.c.store.transaction(()=>{
            const session=this.session(actor,id),state=this.status(actor,id),prior=this.c.store.maybe<HostAccessGrant>('host-access',id);
            ensure(!session.textCorpusGrantId||!automaticTextGrantCompatible(this.c.store,session,prior)||x.acknowledgedAutomaticApprovals===true,'HOST_ACCESS_ACK_REQUIRED','持有自动原文绑定的主会话重新启用时，需要明确确认自动审批范围',400);
            ensure(state.available,'HOST_ACCESS_UNAVAILABLE',state.reason,403);ensure(!this.c.store.get<Project>('project',session.projectId!).archived&&session.state!=='archived','SESSION_ARCHIVED','归档会话不可启用');
            ensure(state.version===expected,'VERSION_CONFLICT','权限已变化，请刷新后重试');
            const unknown=this.jobs(session).filter(j=>j.state==='unknown');
            ensure(!unknown.length||x.acknowledgedUnknownEffects===true,'HOST_EFFECTS_REVIEW_REQUIRED','存在退出或记录状态未确认的命令，需用户核对旧进程和外部效果后重新启用',409);
            if(state.enabled){ensure(x.acknowledgedAutomaticApprovals!==true||prior?.automaticApprovalScope===1,'HOST_ACCESS_REENABLE_REQUIRED','新增自动审批范围需要撤销后明确重新启用');ensure(x.acknowledgedResearchAutomation!==true||prior?.researchAutomationScope===(policy?2:1)&&digest(prior.researchAutomationPolicy)===digest(policy),'HOST_ACCESS_REENABLE_REQUIRED','新增或改变自主计算范围需要先撤销，再明确重新启用');return;}
            for(const job of unknown){const raw=this.c.store.get<HostCommand>('host-command',job.id);if(raw.state!=='unknown')this.c.store.update<HostCommand>('host-command',raw.id,raw.version,{...this.uncertain.get(job.id),state:'unknown',error:job.error});}
            const pending=this.executionActive(session),previousHostEpoch=prior?.epoch??0;
            const grant:HostAccessGrant={...(x.acknowledgedAutomaticApprovals===true?{automaticApprovalScope:1 as const,automaticApprovalAcknowledgedAt:new Date().toISOString()}:{}),...(x.acknowledgedResearchAutomation===true?{researchAutomationScope:policy?2 as const:1 as const,...(policy?{researchAutomationPolicy:policy}:{}),researchAutomationAcknowledgedAt:new Date().toISOString()}:{}),sessionId:id,epoch:previousHostEpoch+(pending?0:1),runtimeId:this.runtimeId,state:pending?'pending':'enabled',boundary:'trusted-host',acknowledgedSameUserAccess:true,acknowledgedUnknownJobIds:unknown.map(j=>j.id)};
            if(prior)this.c.store.update<HostAccessGrant>('host-access',id,prior.version,{automaticApprovalScope:undefined,automaticApprovalAcknowledgedAt:undefined,researchAutomationScope:undefined,researchAutomationPolicy:undefined,researchAutomationAcknowledgedAt:undefined,...grant});else this.c.store.create('host-access',session.projectId,grant,id);
            this.c.store.event(session.projectId,pending?'host_access.requested':'host_access.enabled',{sessionId:id,epoch:grant.epoch,boundary:grant.boundary,osSandboxVerified:false});
            if(!pending)this.onChanged?.(id,previousHostEpoch);
        });for(const job of this.jobs(this.session(actor,id)))if(job.state==='unknown')this.uncertain.delete(job.id);return this.status(actor,id);
    }
    activatePending(id:string) {
        return this.c.store.transaction(()=>{
            const grant=this.c.store.maybe<HostAccessGrant>('host-access',id);
            if(grant?.state!=='pending'||grant.runtimeId!==this.runtimeId)return false;
            const session=this.c.store.get<Session>('session',id),state=this.status({type:'user'},id);
            if(!state.available||this.executionActive(session)||this.hasUnreviewed(session,grant))return false;
            this.c.store.update<HostAccessGrant>('host-access',id,grant.version,{state:'enabled',epoch:grant.epoch+1});
            this.c.store.event(session.projectId,'host_access.enabled',{sessionId:id,epoch:grant.epoch+1,boundary:grant.boundary,osSandboxVerified:false});
            this.onChanged?.(id,grant.epoch);
            return true;
        });
    }
    revoke(actor:Actor,id:string,input:unknown) {
        userOnly(actor);const x=object(input);ensure(Object.keys(x).every(k=>k==='expectedVersion'),'INVALID_INPUT','撤销只接受 expectedVersion');
        const expected=integer(x.expectedVersion,'expectedVersion',0),session=this.session(actor,id);
        this.c.store.transaction(()=>{const prior=this.c.store.maybe<HostAccessGrant>('host-access',id);ensure((prior?.version??0)===expected,'VERSION_CONFLICT','权限已变化，请刷新后重试');const epoch=(prior?.epoch??0)+(prior?.state==='pending'?0:1);if(prior)this.c.store.update<HostAccessGrant>('host-access',id,prior.version,{state:'revoked',epoch});this.c.store.event(session.projectId,'host_access.revoked',{sessionId:id,epoch});if(prior?.state!=='pending')this.onChanged?.(id);});
        for(const job of this.active.values())if(job.sessionId===id)job.cancel('完全访问已撤销；已发出的网络和文件变更无法撤回');
        return this.status(actor,id);
    }
    assertAgent(actor:Actor,epoch?:number) {
        ensure(actor.type==='agent'&&actor.projectId&&actor.sessionId&&actor.role==='coordinator'&&!actor.taskId&&!actor.attemptId&&!actor.wakeupId&&!(actor as Actor&{teamId?:string}).teamId,'HOST_ACCESS_DENIED','宿主执行只属于获准的交互主协调会话',403);
        const session=this.session(actor,actor.sessionId),grant=this.c.store.maybe<HostAccessGrant>('host-access',session.id);
        ensure(session.role===actor.role&&!session.taskId&&!session.teamId&&!session.parentSessionId&&session.state==='running'&&session.generation===actor.generation&&session.leaseUntil>Date.now(),'LEASE_EXPIRED','宿主执行身份或租约已失效',403);
        ensure(!session.workingGrantId&&!session.runGrantId&&!session.discoveryGrantId&&automaticTextGrantCompatible(this.c.store,session,grant),'HOST_ACCESS_BOUND','已有固定范围授权的会话不提供宿主执行',403);
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
            row=this.c.store.create<HostCommand>('host-command',session.projectId,{sessionId:session.id,generation:actor.generation!,epoch:grant.epoch,runtimeId:this.runtimeId,requestDigest,argv:argv.map(value=>redactEnvironment(this.c.dataDir,value)),cwd:resolve(cwd),timeoutMs,state:'starting',stdout:'',stderr:'',outputTruncated:false},id);
        });
        try { this.c.store.transaction(()=>{
            this.assertAgent(actor,grant.epoch);
            // Only explicitly saved local variables join the base environment.
            const env:NodeJS.ProcessEnv={};for(const [name,value] of Object.entries(process.env))if(/^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|SYSTEMDRIVE|NUMBER_OF_PROCESSORS|PROCESSOR_ARCHITECTURE|LANG|LC_ALL)$/i.test(name))env[name]=value;
            child=spawn(argv[0],argv.slice(1),{cwd:resolve(cwd),env:{...environmentVariables(this.c.dataDir),...env},shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
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
        const decoders={stdout:new StringDecoder('utf8'),stderr:new StringDecoder('utf8')},rawCut={stdout:false,stderr:false},tail=Math.max(0,...environmentSecrets(this.c.dataDir).map(value=>value.length));
        let resolveResult:(value:Row<HostCommand>)=>void;
        const promise=new Promise<Row<HostCommand>>(resolvePromise=>{resolveResult=resolvePromise;});
        const append=(target:'stdout'|'stderr',chunk:Buffer,flush=false)=>{const content=flush?decoders[target].end():decoders[target].write(chunk),value=(target==='stdout'?stdout:stderr)+content;if(value.length>65536)truncated=true;if(value.length>65536+tail)rawCut[target]=true;if(target==='stdout')stdout=value.slice(0,65536+tail);else stderr=value.slice(0,65536+tail);};
        child!.stdout!.on('data',chunk=>append('stdout',chunk));child!.stderr!.on('data',chunk=>append('stderr',chunk));
        const finish=(state:HostCommand['state'],exitCode:number|null,error?:string)=>{
            if(done)return;done=true;clearInterval(fence);clearTimeout(deadline);clearTimeout(stopDeadline);
            append('stdout',Buffer.alloc(0),true);append('stderr',Buffer.alloc(0),true);
            const mask=(value:string)=>redactEnvironment(this.c.dataDir,clean(value));
            // A raw cutoff can leave a credential prefix even when redaction shrinks output below the public limit.
            const output=(target:'stdout'|'stderr',value:string)=>mask(rawCut[target]?redactEnvironmentChunk(this.c.dataDir,value).text:value).slice(0,65536);
            const result:Partial<HostCommand>={state,exitCode,stdout:output('stdout',stdout),stderr:output('stderr',stderr),outputTruncated:truncated,...(error?{error:mask(error).slice(0,32000)}:{})};
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
        let stopDeadline:ReturnType<typeof setTimeout>|undefined,stopProcess:ChildProcess|undefined,stopCompleted=false,childClosed=false,childExitCode:number|null=null;
        const finishClosed=()=>{if(childClosed&&(!stopProcess||stopCompleted))finish(cancelReason?'cancelled':childExitCode===0?'succeeded':'failed',childExitCode,cancelReason);};
        const waitForStop=(ms:number,detail:string)=>{
            clearTimeout(stopDeadline);stopDeadline=setTimeout(()=>{
                if(stopProcess&&!stopCompleted)try{stopProcess.kill('SIGKILL');}catch{}
                finish('unknown',null,cancelReason+'；'+detail+'，不能保证清除脱管进程');
            },ms);stopDeadline.unref();
        };
        const cancel=(reason:string)=>{
            if(done||cancelReason)return;cancelReason=reason;
            if(child!.pid&&process.platform==='win32'){
                // taskkill enumerates the tree asynchronously; its completion is distinct from the target's close.
                waitForStop(10000,'taskkill 执行超时，受管进程退出未确认');
                try{
                    stopProcess=spawn('taskkill',['/PID',String(child!.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});
                    stopProcess.once('error',error=>finish('unknown',null,reason+'；taskkill 启动失败：'+error.message));
                    stopProcess.once('close',code=>{
                        if(done)return;
                        if(code!==0){finish('unknown',null,reason+'；taskkill 未成功完成（退出码 '+String(code)+'），进程树退出未确认');return;}
                        stopCompleted=true;waitForStop(4000,'受管进程退出未确认');finishClosed();
                    });
                }catch(error){finish('unknown',null,reason+'；taskkill 启动失败：'+String(error));}
            }else{
                if(child!.pid)try{process.kill(-child!.pid,'SIGTERM');}catch{child!.kill('SIGTERM');}
                waitForStop(4000,'受管进程退出未确认');
            }
        };
        const deadline=setTimeout(()=>cancel('命令超过执行时限'),timeoutMs);deadline.unref();
        const fence=setInterval(()=>{try{this.assertAgent(actor,grant.epoch);}catch{cancel('会话、租约或完全访问授权已失效');}},100);fence.unref();
        this.active.set(id,{child:child!,sessionId:session.id,epoch:grant.epoch,generation:actor.generation!,promise,cancel});
        child!.once('error',error=>finish('failed',null,error.message));
        child!.once('close',code=>{childClosed=true;childExitCode=code;finishClosed();});
        return promise.then(result=>{this.assertAgent(actor,grant.epoch);return result;});
    }
    async stop() {this.stopping=true;for(const job of this.active.values())job.cancel('服务关闭，完全访问授权将失效');await Promise.allSettled([...this.active.values()].map(job=>job.promise));}
    close() {this.stopping=true;for(const [id,job] of this.active){job.cancel('应用关闭');const unknown={state:'unknown' as const,error:'应用关闭；进程退出与外部效果需核对，不自动重试'};this.uncertain.set(id,unknown);try{const row=this.c.store.get<HostCommand>('host-command',id);this.c.store.update<HostCommand>('host-command',id,row.version,unknown);}catch{}}this.closing=true;}
}
