import {spawnSync} from 'node:child_process';
import {existsSync,readFileSync,realpathSync,statSync,writeFileSync,renameSync} from 'node:fs';
import {basename,delimiter,isAbsolute,join} from 'node:path';
import {hostname} from 'node:os';
import type {AppContext} from '../domain/context.js';
import type {Actor} from '../domain/types.js';
import {ensure} from '../domain/errors.js';
import {integer,object,text} from '../contracts/validation.js';
import {userOnly} from '../policy/permissions.js';
import {digest} from '../storage/store.js';

export interface LocalRuntime {protocolVersion?:2;id:string;version:number;executableName:string;runtimeVersion:string;executableDigest:string;hostId:string;platform:string;protocolDigest:string;digest:string;}
interface PrivateRuntime extends LocalRuntime {executable:string;}
export function hostIdentity():string {
    let identity=hostname();
    if(process.platform==='win32'){const result=spawnSync('reg.exe',['query','HKLM\\SOFTWARE\\Microsoft\\Cryptography','/v','MachineGuid'],{encoding:'utf8',windowsHide:true,timeout:5000});ensure(result.status===0,'LOCAL_HOST_UNAVAILABLE','无法核对本机身份');identity=result.stdout.match(/MachineGuid\s+REG_SZ\s+(\S+)/)?.[1]??'';}
    else if(process.platform==='linux'){identity=readFileSync('/etc/machine-id','utf8').trim();}
    else if(process.platform==='darwin'){const result=spawnSync('/usr/sbin/ioreg',['-rd1','-c','IOPlatformExpertDevice'],{encoding:'utf8',timeout:5000});identity=result.stdout?.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)?.[1]??'';}
    ensure(identity,'LOCAL_HOST_UNAVAILABLE','无法核对本机身份');return 'local-'+digest({platform:process.platform,identity});
}
export function executablePath(value:string):string {
    if(value==='node')return realpathSync(process.execPath);
    const candidates=isAbsolute(value)?[value]:(process.env.PATH??'').split(delimiter).flatMap(dir=>process.platform==='win32'?[join(dir,value),join(dir,value+'.exe')]:[join(dir,value)]);
    const file=candidates.find(p=>existsSync(p)&&statSync(p).isFile());ensure(file,'LOCAL_RUNTIME_UNAVAILABLE','程序不存在；请配置本机已有可执行文件',409);
    const resolved=realpathSync(file);ensure(process.platform!=='win32'||/\.exe$/i.test(resolved),'LOCAL_RUNTIME_INVALID','Windows 运行时必须是可执行程序，不能是 Shell 脚本',400);return resolved;
}
export function localEnvironment(control:string,output:string,gpus?:string[]):NodeJS.ProcessEnv {
    return {PATH:process.env.PATH??'',...(process.platform==='win32'?{SystemRoot:process.env.SystemRoot??'',WINDIR:process.env.WINDIR??'',ProgramFiles:process.env.ProgramFiles??''}:{}),HOME:control,USERPROFILE:control,TMP:control,TEMP:control,TMPDIR:control,PI_OUTPUT_DIR:output,OUTPUT_DIR:output,PYTHONDONTWRITEBYTECODE:'1',PYTHONNOUSERSITE:'1',CUDA_VISIBLE_DEVICES:gpus?.join(',')??'-1'};
}
export class LocalRuntimeService {
    constructor(private c:AppContext){}
    private file(){return join(this.c.dataDir,'local-runtimes.json');}
    private protocol(version?:2){return digest((version===2?['local-windows-runner-v2.ps1','local-posix-runner-v2.mjs','local-windows-launcher-v2.mjs']:['local-windows-runner.ps1','local-posix-runner.mjs']).map(name=>digest(readFileSync(join(this.c.repoRoot,'scripts',name)))));}
    private read():Record<string,PrivateRuntime>{return existsSync(this.file())?JSON.parse(readFileSync(this.file(),'utf8')):{};}
    list():LocalRuntime[]{return Object.values(this.read()).map(({executable,...publicRuntime})=>publicRuntime);}
    configure(actor:Actor,value:unknown):LocalRuntime {
        userOnly(actor);const x=object(value),id=text(x.id,'id',80);ensure(/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id),'INVALID_INPUT','运行时名称无效');
        const executable=executablePath(text(x.executable,'executable',2000));
        const result=spawnSync(executable,['--version'],{encoding:'utf8',windowsHide:true,timeout:10000,maxBuffer:65536,env:localEnvironment(this.c.dataDir,this.c.dataDir)});
        ensure(result.status===0,'LOCAL_RUNTIME_UNAVAILABLE','运行时 --version 探测失败',409);
        const runtimeVersion=(result.stdout||result.stderr).trim().slice(0,500);ensure(runtimeVersion,'LOCAL_RUNTIME_UNAVAILABLE','运行时未返回版本');
        return this.c.store.transaction(()=>{const all=this.read(),old=all[id];ensure((old?.version??0)===integer(x.expectedVersion??0,'expectedVersion',0),'VERSION_CONFLICT','运行时配置已变化');
            ensure(!this.c.store.db.prepare("SELECT 1 FROM records WHERE kind='run' AND json_extract(data,'$.manifest.contract.localRuntimeId')=? AND json_extract(data,'$.state') NOT IN ('succeeded','failed','cancelled') LIMIT 1").get(id),'LOCAL_RUNTIME_BUSY','运行时仍有非终态作业，不能更改配置',409);
            const fields={id,version:(old?.version??0)+1,executableName:basename(executable),runtimeVersion,executableDigest:digest(readFileSync(executable)),hostId:hostIdentity(),platform:process.platform,protocolDigest:this.protocol()};
            const runtime={...fields,digest:digest(fields)};all[id]={...runtime,executable};const tmp=this.file()+'.tmp';writeFileSync(tmp,JSON.stringify(all),{mode:0o600});renameSync(tmp,this.file());return runtime;});
    }
    frozen(id:string):LocalRuntime {const p=this.resolve(id);const {executable,digest:oldDigest,...runtime}=p,fields={...runtime,protocolVersion:2 as const,protocolDigest:this.protocol(2)};return {...fields,digest:digest(fields)};}
    resolve(id:string,expected?:LocalRuntime):PrivateRuntime {
        const runtime=this.read()[id];ensure(runtime,'LOCAL_RUNTIME_UNAVAILABLE','请先配置本机运行时',409);
        const {executable,...publicRuntime}=runtime;ensure(runtime.hostId===hostIdentity()&&runtime.protocolDigest===this.protocol()&&existsSync(executable)&&digest(readFileSync(executable))===runtime.executableDigest,'LOCAL_RUNTIME_CHANGED','本机、监管协议或运行时程序已变化，请重新准备运行',409);
        if(expected?.protocolVersion===2){const {digest:oldDigest,...fields}=publicRuntime,derived={...fields,protocolVersion:2 as const,protocolDigest:this.protocol(2)},bound={...derived,digest:digest(derived)};ensure(digest(bound)===digest(expected),'LOCAL_RUNTIME_CHANGED','运行时配置或v2协议与批准清单不同',409);return {...bound,executable};}
        if(expected)ensure(digest(publicRuntime)===digest(expected),'LOCAL_RUNTIME_CHANGED','运行时配置与批准清单不同',409);return runtime;
    }
}
