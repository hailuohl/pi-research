import {existsSync,lstatSync,mkdirSync,readFileSync,renameSync,writeFileSync} from 'node:fs';
import {isAbsolute,join,resolve} from 'node:path';
import type {AppContext} from '../domain/context.js';
import type {Actor} from '../domain/types.js';
import {ensure,DomainError} from '../domain/errors.js';
import {object,text,integer} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';
import {sshRequest} from './ssh.js';
import {ComputeConnectionService} from './compute-connections.js';
import {randomUUID} from 'node:crypto';
import {challengeName,endpoint,hostToken,parseHostKeys,privateJson,savePrivateJson,scanHostKeys,setupError,sshOnboardingRequest,sshPrivateDir,trustName,type HostKey,type SshChallenge,type SshHealth} from './ssh-onboarding.js';

export interface SshTarget {id:string;version:number;hostKeyDigest:string;configDigest:string;engineId:string;protocolDigest:string;targetId:string;gpuProtocol?:boolean;}
export interface PrivateSshTarget {id:string;version:number;host:string;port:number;user:string;identityFile:string;knownHostsFile:string;remoteRoot:string;identityDigest:string;hostKeyDigest:string;gpuProtocol?:boolean;managed?:boolean;verified?:SshTarget;}
interface SetupReservation {token:string;configurationDigest:string;state:'installing'|'unknown';until:number;}
export class SshTargetService {
    constructor(private c:AppContext,private request=sshRequest) {}
    private scan=scanHostKeys;
    private onboarding=(t:PrivateSshTarget,action:'inspect'|'install')=>sshOnboardingRequest(this.c,t,action);
    private file(){return join(this.c.dataDir,'ssh-targets.json');}
    private read():Record<string,PrivateSshTarget>{return existsSync(this.file())?JSON.parse(readFileSync(this.file(),'utf8')):{};}
    private write(all:Record<string,PrivateSshTarget>){mkdirSync(this.c.dataDir,{recursive:true,mode:0o700});const tmp=this.file()+'.tmp';writeFileSync(tmp,JSON.stringify(all),{mode:0o600});renameSync(tmp,this.file());}
    configure(actor:Actor,value:unknown){
        userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['id','host','port','user','identityFile','knownHostsFile','remoteRoot','expectedVersion','gpuProtocol'].includes(k)),'INVALID_INPUT','SSH 目标包含未知字段',400);
        ensure(x.gpuProtocol===undefined||typeof x.gpuProtocol==='boolean','INVALID_INPUT','gpuProtocol 必须为布尔值');
        const id=text(x.id,'id',80),host=text(x.host,'host',253),user=text(x.user,'user',64),remoteRoot=text(x.remoteRoot,'remoteRoot',500);
        ensure(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)&&/^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/.test(host)&&/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(user),'INVALID_INPUT','SSH 目标名称、主机或用户无效',400);
        ensure(/^\/[A-Za-z0-9_./-]+$/.test(remoteRoot)&&!remoteRoot.split('/').slice(1).some(p=>!p||p==='.'||p==='..')&&remoteRoot.split('/').length>2,'INVALID_INPUT','SSH 工作根目录必须是固定规范绝对路径',400);
        const local=(v:unknown,k:string)=>{const p=text(v,k,2000);ensure(isAbsolute(p)&&lstatSync(p).isFile()&&!lstatSync(p).isSymbolicLink(),'INVALID_INPUT','SSH 身份和 known_hosts 必须是宿主普通文件',400);return resolve(p);};
        const identityFile=local(x.identityFile,'identityFile'),knownHostsFile=local(x.knownHostsFile,'knownHostsFile');
        return this.c.store.transaction(()=>{const all=this.read(),before=all[id];ensure((before?.version??0)===integer(x.expectedVersion??0,'expectedVersion',0),'VERSION_CONFLICT','SSH 目标版本已变化');
            this.assertSetupIdle(id);
            ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE context_name=? AND phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get('ssh:'+id),'SSH_TARGET_BUSY','目标仍有等待、运行或未知作业，不能改写配置');
            const target:PrivateSshTarget={id,...(x.gpuProtocol===true?{gpuProtocol:true}:{}),version:(before?.version??0)+1,host,port:integer(x.port??22,'port',1,65535),user,remoteRoot,identityFile,knownHostsFile,identityDigest:digest(readFileSync(identityFile)),hostKeyDigest:digest(readFileSync(knownHostsFile))};
            all[id]=target;this.write(all);new ComputeConnectionService(this.c).invalidateSsh(id,this.configDigest(target));this.c.store.db.prepare("UPDATE compute_contexts SET status='unresolved',next_probe_at=0 WHERE context=?").run('ssh:'+id);
            return {id,version:target.version,verified:false};});
    }
    private configDigest(t:PrivateSshTarget){const {verified,...config}=t;return digest(config);}
    directory(){return Object.values(this.read()).map(target=>({target,configurationDigest:this.configDigest(target)}));}
    inspect(actor:Actor,id:string){userOnly(actor);const t=this.read()[id];ensure(t,'SSH_TARGET_NOT_FOUND','SSH 目标未配置',404);const {host,port,user,identityFile,knownHostsFile,remoteRoot,version}=t;return {id,version,host,port,user,identityFile,knownHostsFile,remoteRoot,gpuProtocol:t.gpuProtocol===true,managed:t.managed===true};}
    privateTarget(id:string){const t=this.read()[id];ensure(t,'SSH_TARGET_NOT_FOUND','SSH 目标未配置',404);ensure(digest(readFileSync(t.identityFile))===t.identityDigest&&digest(readFileSync(t.knownHostsFile))===t.hostKeyDigest,'SSH_TARGET_CHANGED','SSH 身份或固定主机密钥文件已变化');return t;}
    frozen(id:string,currentProtocol=false):SshTarget {const t=this.privateTarget(id);ensure(t.verified&&t.verified.configDigest===this.configDigest(t),'SSH_TARGET_PROBE_REQUIRED','请先由用户验证 SSH 目标');if(currentProtocol){this.assertSetupIdle(id);ensure(t.gpuProtocol===true&&t.verified.gpuProtocol===true,'SSH_PROTOCOL_UPGRADE_REQUIRED','新 SSH 启动（含 CPU）需要独立新版监管协议；旧未启动作业保留待取消，请配置新版目标后重新准备批准',409);ensure(t.verified.protocolDigest===digest(readFileSync(join(this.c.repoRoot,'scripts','ssh-runner-gpu.py'))),'SSH_PROTOCOL_MISMATCH','新运行必须使用当前已验证监管协议；旧 handle 仅允许原协议对账');}return structuredClone(t.verified);}
    assertFrozen(target:SshTarget,currentProtocol=false){ensure(digest(this.frozen(target.id,currentProtocol))===digest(target),'SSH_TARGET_CHANGED','SSH 目标与批准的身份不符');}
    list(actor:Actor){userOnly(actor);return Object.values(this.read()).map(t=>t.verified??{id:t.id,version:t.version,verified:false});}
    get(actor:Actor,id:string){userOnly(actor);return this.frozen(id);}
    async probe(actor:Actor,id:string){userOnly(actor);return this.verify(id);}
    async verify(id:string){
        const saved=this.read()[id];ensure(saved,'SSH_TARGET_NOT_FOUND','SSH 目标未配置',404);
        const configurationDigest=this.configDigest(saved),connections=new ComputeConnectionService(this.c),attempt=connections.begin('ssh:'+id,configurationDigest);
        try{
        const t=this.privateTarget(id);let health:SshHealth|undefined;
        const reply=t.managed?(health=await this.onboarding(t,'inspect')):await this.request(t,{op:'probe'});
        if(health?.errorCode){this.healthFailure(id,configurationDigest,attempt,health);throw new DomainError(health.errorCode,'SSH 环境需要处理：'+health.errorCode,409);}
        if(health)ensure(health.supervisor==='ready'&&health.workspace==='ready'&&health.docker==='ready','SSH_PROTOCOL_INVALID','SSH 环境检查未确认就绪');
        const active=this.c.store.db.prepare("SELECT 1 FROM compute_queue q JOIN records r ON r.kind='run' AND r.id=q.id WHERE q.kind='run' AND q.context_name=? AND q.held=1 AND json_extract(r.data,'$.execution.startRequested')=1 LIMIT 1").get('ssh:'+id);
        const protocolDigest=active&&t.verified?t.verified.protocolDigest:digest(readFileSync(join(this.c.repoRoot,'scripts',t.gpuProtocol?'ssh-runner-gpu.py':'ssh-runner.py')));
        ensure(reply.protocolDigest===protocolDigest&&typeof reply.engineId==='string'&&/^[A-Za-z0-9._:-]{1,200}$/.test(reply.engineId),'SSH_PROTOCOL_MISMATCH','远端监管器或 Linux Docker 引擎身份不符');
        const target:SshTarget={id:t.id,...(t.gpuProtocol?{gpuProtocol:true}:{}),version:t.version,hostKeyDigest:t.hostKeyDigest,configDigest:this.configDigest(t),engineId:reply.engineId,protocolDigest,targetId:'ssh-'+digest(reply.engineId)};
        this.c.store.transaction(()=>{const all=this.read();ensure(all[id]&&this.configDigest(all[id])===target.configDigest&&target.configDigest===configurationDigest&&connections.observation('ssh:'+id)?.attempt===attempt,'SSH_TARGET_CHANGED','验证期间 SSH 配置或观察发生变化');all[id].verified=target;this.write(all);connections.finish('ssh:'+id,attempt,{configurationDigest,status:'verified',targetId:target.targetId,...(health?{supervisor:health.supervisor,docker:health.docker,workspace:health.workspace}:{})});this.c.store.db.prepare("INSERT INTO compute_contexts(context,target_id,engine_id,endpoint,status,next_probe_at) VALUES(?,?,?,?,'ready',?) ON CONFLICT(context) DO UPDATE SET target_id=excluded.target_id,engine_id=excluded.engine_id,endpoint=excluded.endpoint,status='ready',next_probe_at=excluded.next_probe_at,probe_until=0,failures=0,last_error=NULL").run('ssh:'+id,target.targetId,target.engineId,target.configDigest+':'+target.protocolDigest,Date.now()+30000);});
        this.c.store.transaction(()=>{const reservation=this.c.store.maybe<SetupReservation>('ssh-setup',id);if(reservation&&reservation.configurationDigest===configurationDigest&&(reservation.state==='unknown'||reservation.until<=Date.now()))this.c.store.db.prepare("DELETE FROM records WHERE kind='ssh-setup' AND id=?").run(id);});
        return target;
        }catch(error){const code=error instanceof DomainError&&['SSH_PROTOCOL_INVALID','SSH_REMOTE_REJECTED'].includes(error.code)?error.code:setupError(error);this.c.store.transaction(()=>{const current=this.read()[id],prior=connections.observation('ssh:'+id);if(current&&this.configDigest(current)===configurationDigest&&connections.finish('ssh:'+id,attempt,{configurationDigest,status:'unavailable',errorCode:code,...(prior?.attempt===attempt?{supervisor:prior.supervisor,docker:prior.docker,workspace:prior.workspace}:{})}))this.c.store.db.prepare("UPDATE compute_contexts SET status='unavailable',next_probe_at=?,last_error=? WHERE context=?").run(Date.now()+5000,code,'ssh:'+id);});throw new DomainError(code,'无法核对 SSH 目标：'+code,409);}
    }

    private assertSetupIdle(id:string){ensure(!this.c.store.maybe('ssh-setup',id),'SSH_TARGET_BUSY','SSH 环境准备尚在执行或结果未知；请先重试环境准备以核对');}
    private assertAvailable(id:string,version:number){const target=this.read()[id];ensure((target?.version??0)===version,'VERSION_CONFLICT','SSH 目标版本已变化');this.assertSetupIdle(id);ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE context_name=? AND phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get('ssh:'+id),'SSH_TARGET_BUSY','目标仍有等待、运行或未知作业，不能准备或改写配置');}
    private assertTrust(t:{host:string;port:number},key:HostKey){
        const trusted=privateJson<HostKey>(this.c,trustName(t));ensure(!trusted||trusted.keyType===key.keyType&&trusted.key===key.key,'SSH_HOST_KEY_CHANGED','该地址的主机密钥已经变化；禁止自动重新信任');
        for(const old of Object.values(this.read()).filter(v=>endpoint(v)===endpoint(t))){
            ensure(digest(readFileSync(old.knownHostsFile))===old.hostKeyDigest,'SSH_TARGET_CHANGED','已固定的主机密钥文件已经变化');
            const lines=readFileSync(old.knownHostsFile,'utf8').split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('#'));
            const matches=lines.filter(line=>line.split(/\s+/)[0]?.split(',').includes(hostToken(old)));
            ensure(matches.length>0,'SSH_EXISTING_TRUST_UNSUPPORTED','已有目标的主机密钥记录不能自动迁移；请保留手动配置');
            const keys=parseHostKeys(matches.join('\n'));ensure(keys.some(k=>k.keyType===key.keyType&&k.key===key.key),'SSH_HOST_KEY_CHANGED','该地址的主机密钥已经变化；禁止自动重新信任');
        }
    }
    async challenge(actor:Actor,value:unknown){
        userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['id','host','port','user','identityFile','remoteRoot','expectedVersion'].includes(k)),'INVALID_INPUT','SSH 挑战包含未知字段',400);
        const id=text(x.id,'id',80),host=text(x.host,'host',253).toLowerCase().replace(/\.$/,''),user=text(x.user,'user',64),remoteRoot=text(x.remoteRoot,'remoteRoot',500),identityFile=resolve(text(x.identityFile,'identityFile',2000));
        ensure(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)&&/^[a-zA-Z0-9][a-zA-Z0-9.:-]*$/.test(host)&&/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(user),'INVALID_INPUT','SSH 目标名称、主机或用户无效',400);
        ensure(/^\/[A-Za-z0-9_./-]+$/.test(remoteRoot)&&!remoteRoot.split('/').slice(1).some(p=>!p||p==='.'||p==='..')&&remoteRoot.split('/').length>2,'INVALID_INPUT','SSH 工作根目录必须是固定规范绝对路径',400);
        ensure(isAbsolute(String(x.identityFile))&&lstatSync(identityFile).isFile()&&!lstatSync(identityFile).isSymbolicLink(),'INVALID_INPUT','SSH 身份必须是宿主普通文件',400);
        const expectedVersion=integer(x.expectedVersion,'expectedVersion',0),target={id,host,port:integer(x.port??22,'port',1,65535),user,identityFile,remoteRoot,identityDigest:digest(readFileSync(identityFile)),version:expectedVersion+1,gpuProtocol:true,managed:true};
        this.c.store.transaction(()=>this.assertAvailable(id,expectedVersion));const keys=await this.scan(target),trusted=privateJson<HostKey>(this.c,trustName(target));
        const key=trusted?keys.find(k=>k.keyType===trusted.keyType)??keys[0]:keys[0];
        const challenge:SshChallenge={challengeId:randomUUID(),expiresAt:new Date(Date.now()+5*60000).toISOString(),target,expectedVersion,...key};
        this.c.store.transaction(()=>{this.assertAvailable(id,expectedVersion);this.assertTrust(target,key);savePrivateJson(this.c,challengeName(challenge.challengeId),challenge);});
        return {challengeId:challenge.challengeId,id,host,port:target.port,user,remoteRoot,keyType:key.keyType,fingerprint:key.fingerprint,expiresAt:challenge.expiresAt};
    }
    async confirm(actor:Actor,value:unknown){
        userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['challengeId','fingerprint'].includes(k)),'INVALID_INPUT','SSH 确认包含未知字段',400);const name=challengeName(text(x.challengeId,'challengeId',100)),fingerprint=text(x.fingerprint,'fingerprint',100);
        let token:string|undefined;
        const target=this.c.store.transaction(()=>{
            const challenge=privateJson<SshChallenge>(this.c,name);ensure(challenge,'SSH_CHALLENGE_NOT_FOUND','SSH 指纹挑战不存在或已清理',404);ensure(challenge.fingerprint===fingerprint,'SSH_FINGERPRINT_MISMATCH','确认指纹与展示内容不符');
            const {target:t}=challenge;
            if(challenge.confirmedVersion){const saved=this.privateTarget(t.id);ensure(saved.version===challenge.confirmedVersion&&saved.identityDigest===t.identityDigest&&endpoint(saved)===endpoint(t),'SSH_TARGET_CHANGED','此确认属于旧配置');return saved;}
            ensure(Date.parse(challenge.expiresAt)>Date.now(),'SSH_CHALLENGE_EXPIRED','SSH 指纹确认已过期，请重新获取');this.assertAvailable(t.id,challenge.expectedVersion);ensure(digest(readFileSync(t.identityFile))===t.identityDigest,'SSH_TARGET_CHANGED','确认期间本机身份文件已变化');this.assertTrust(t,challenge);
            const knownHostsFile=join(sshPrivateDir(this.c),'known-hosts-'+randomUUID()),line=`${hostToken(t)} ${challenge.keyType} ${challenge.key}\n`;writeFileSync(knownHostsFile,line,{mode:0o600,flag:'wx'});
            const saved:PrivateSshTarget={...t,knownHostsFile,hostKeyDigest:digest(line)};savePrivateJson(this.c,trustName(t),{keyType:challenge.keyType,key:challenge.key,fingerprint:challenge.fingerprint});const all=this.read();all[t.id]=saved;this.write(all);savePrivateJson(this.c,name,{...challenge,confirmedVersion:saved.version});
            new ComputeConnectionService(this.c).invalidateSsh(t.id,this.configDigest(saved));this.c.store.db.prepare("UPDATE compute_contexts SET status='unresolved',next_probe_at=0 WHERE context=?").run('ssh:'+t.id);token=this.reserveSetup(saved);return saved;
        });
        return token?this.runSetup(target,token):this.setupResult(target);
    }
    private reserveSetup(t:PrivateSshTarget){const token=randomUUID(),value:SetupReservation={token,configurationDigest:this.configDigest(t),state:'installing',until:Date.now()+120000},old=this.c.store.maybe('ssh-setup',t.id);if(old)this.c.store.update('ssh-setup',t.id,old.version,value);else this.c.store.create('ssh-setup',null,value,t.id);return token;}
    private setupTarget(t:PrivateSshTarget,token:string){return this.c.store.transaction(()=>{const reservation=this.c.store.maybe<SetupReservation>('ssh-setup',t.id),current=this.privateTarget(t.id);ensure(reservation?.token===token&&reservation.until>Date.now()&&this.configDigest(current)===reservation.configurationDigest,'SSH_TARGET_CHANGED','SSH 环境准备目标或执行权已变化');ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE context_name=? AND phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get('ssh:'+t.id),'SSH_TARGET_BUSY','目标仍有等待、运行或未知作业，不能安装');this.c.store.update('ssh-setup',t.id,reservation.version,{until:Date.now()+120000});return current;});}
    private setupResult(t:PrivateSshTarget){const observation=new ComputeConnectionService(this.c).observation('ssh:'+t.id),verified=observation?.configurationDigest===this.configDigest(t)&&observation.status==='verified'&&Date.parse(observation.validUntil??'')>Date.now();return {id:t.id,version:t.version,verified,...(!verified&&observation?.errorCode?{errorCode:observation.errorCode}:{})};}
    async setup(actor:Actor,value:unknown){userOnly(actor);const x=object(value);ensure(Object.keys(x).every(k=>['id','expectedVersion'].includes(k)),'INVALID_INPUT','SSH 环境准备包含未知字段',400);const id=text(x.id,'id',80),version=integer(x.expectedVersion,'expectedVersion',0);
        const {target,token,recovering}=this.c.store.transaction(()=>{const target=this.privateTarget(id);ensure(target.managed===true,'SSH_SETUP_MANAGED_REQUIRED','旧手动配置保留原部署方式');ensure(target.version===version,'VERSION_CONFLICT','SSH 目标版本已变化');const prior=this.c.store.maybe<SetupReservation>('ssh-setup',id);ensure(!prior||prior.until<=Date.now(),'SSH_TARGET_BUSY','SSH 环境准备正在执行；请稍后重试');ensure(!this.c.store.db.prepare("SELECT 1 FROM compute_queue WHERE context_name=? AND phase NOT IN ('succeeded','failed','cancelled','timed_out') LIMIT 1").get('ssh:'+id),'SSH_TARGET_BUSY','目标仍有等待、运行或未知作业，不能安装');return {target,token:this.reserveSetup(target),recovering:!!prior};});return this.runSetup(target,token,recovering);
    }
    private healthFailure(id:string,configurationDigest:string,attempt:string,health:SshHealth){const connections=new ComputeConnectionService(this.c);this.c.store.transaction(()=>{const t=this.read()[id];if(t&&this.configDigest(t)===configurationDigest&&connections.finish('ssh:'+id,attempt,{configurationDigest,status:'unavailable',supervisor:health.supervisor,docker:health.docker,workspace:health.workspace,errorCode:health.errorCode??'SSH_TARGET_UNAVAILABLE'}))this.c.store.db.prepare("UPDATE compute_contexts SET status='unavailable',next_probe_at=?,last_error=? WHERE context=?").run(Date.now()+5000,health.errorCode??'SSH_TARGET_UNAVAILABLE','ssh:'+id);});}
    private async runSetup(t:PrivateSshTarget,token:string,recovering=false){
        const connections=new ComputeConnectionService(this.c),configurationDigest=this.configDigest(t),attempt=connections.begin('ssh:'+t.id,configurationDigest);let unknown=recovering;
        try{
            const current=this.setupTarget(t,token);ensure(this.configDigest(current)===configurationDigest,'SSH_TARGET_CHANGED','SSH 目标已变化');
            // Even an unknown prior install is reconciled with a read before any exclusive, no-overwrite creation.
            let health=await this.onboarding(current,'inspect');
            if(health.supervisor==='ready'&&health.workspace==='ready')unknown=false;
            if(['ready','missing'].includes(health.supervisor)&&health.workspace!=='invalid'&&(health.supervisor==='missing'||health.workspace==='missing')){const installTarget=this.setupTarget(t,token);unknown=true;health=await this.onboarding(installTarget,'install');unknown=health.errorCode==='SSH_SETUP_UNKNOWN';}
            if(health.errorCode){this.healthFailure(t.id,configurationDigest,attempt,health);return this.setupResult(t);}
            this.setupTarget(t,token);await this.verify(t.id);return this.setupResult(t);
        }catch(error){const code=setupError(error);this.healthFailure(t.id,configurationDigest,attempt,{supervisor:'unknown',docker:'unknown',workspace:'unknown',errorCode:unknown?'SSH_SETUP_UNKNOWN':code});return this.setupResult(t);}
        finally{this.c.store.transaction(()=>{const reservation=this.c.store.maybe<SetupReservation>('ssh-setup',t.id);if(reservation?.token===token){if(unknown)this.c.store.update('ssh-setup',t.id,reservation.version,{state:'unknown',until:Date.now()});else this.c.store.db.prepare("DELETE FROM records WHERE kind='ssh-setup' AND id=?").run(t.id);}});}
    }
}
