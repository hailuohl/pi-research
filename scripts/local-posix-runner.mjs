// Fixed session leader: cancellation is issued only to our own live process group.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,renameSync,existsSync,openSync,closeSync} from 'node:fs';
import {join} from 'node:path';
const spec=JSON.parse(readFileSync(process.argv[2],'utf8'));
const atomic=(name,value)=>{const p=join(spec.control,name);writeFileSync(p+'.tmp',JSON.stringify(value),{mode:0o600});renameSync(p+'.tmp',p);};
process.on('SIGTERM',()=>{});
if(existsSync(join(spec.control,'native-cancel'))){atomic('native-result.json',{manifestDigest:spec.manifestDigest,exitCode:null,cancelled:true});process.kill(-process.pid,'SIGKILL');}
const out=openSync(join(spec.control,'stdout.log'),'a',0o600),err=openSync(join(spec.control,'stderr.log'),'a',0o600);
const child=spawn(spec.executable,spec.argv,{cwd:spec.work,env:spec.env,shell:false,stdio:['ignore',out,err]});closeSync(out);closeSync(err);
let ended=false;
child.on('error',()=>{ended=true;atomic('native-result.json',{manifestDigest:spec.manifestDigest,exitCode:null,error:'LOCAL_SPAWN_FAILED'});process.kill(-process.pid,'SIGKILL');});
child.on('close',(exitCode,signal)=>{if(ended)return;ended=true;atomic('native-result.json',{manifestDigest:spec.manifestDigest,exitCode,signal});process.kill(-process.pid,'SIGKILL');});
atomic('native-start.json',{manifestDigest:spec.manifestDigest,pid:child.pid,leaderPid:process.pid});
const timer=setInterval(()=>{if(existsSync(join(spec.control,'native-cancel'))){atomic('native-result.json',{manifestDigest:spec.manifestDigest,exitCode:null,cancelled:true});process.kill(-process.pid,'SIGKILL');}},100);
timer.unref();
