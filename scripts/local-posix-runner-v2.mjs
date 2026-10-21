// Fixed session leader: cancellation is issued only to our own live process group.
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,renameSync,existsSync,openSync,closeSync} from 'node:fs';
import {join} from 'node:path';
const spec=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(spec.version!==2||!spec.executionId)throw Error('LOCAL_PROTOCOL_INVALID');
let generation=spec.generation;
const identity={version:2,executionId:spec.executionId,manifestDigest:spec.manifestDigest,leaderPid:process.pid};
const control=()=>{try{const c=JSON.parse(readFileSync(join(spec.control,'native-control.json'),'utf8'));if(c.version===2&&c.executionId===spec.executionId&&c.manifestDigest===spec.manifestDigest&&Number.isSafeInteger(c.generation)&&c.generation>=generation){generation=c.generation;return c.cancel===true;}}catch{}return false;};
const atomic=(name,value)=>{const p=join(spec.control,name);writeFileSync(p+'.tmp',JSON.stringify(value),{mode:0o600});renameSync(p+'.tmp',p);};
process.on('SIGTERM',()=>{});
const initialCancel=control(),initialTimeout=Date.now()>spec.deadline;
if(initialCancel||initialTimeout){atomic('native-result.json',{...identity,exitCode:null,cancelled:initialCancel,timedOut:initialTimeout});process.kill(-process.pid,'SIGKILL');}
const out=openSync(join(spec.control,'stdout.log'),'a',0o600),err=openSync(join(spec.control,'stderr.log'),'a',0o600);
const child=spawn(spec.executable,spec.argv,{cwd:spec.work,env:spec.env,shell:false,stdio:['ignore',out,err]});closeSync(out);closeSync(err);
let ended=false;
child.on('error',()=>{ended=true;atomic('native-result.json',{...identity,exitCode:null,error:'LOCAL_SPAWN_FAILED'});process.kill(-process.pid,'SIGKILL');});
child.on('close',(exitCode,signal)=>{if(ended)return;ended=true;atomic('native-result.json',{...identity,exitCode,signal});process.kill(-process.pid,'SIGKILL');});
atomic('native-start.json',{...identity,pid:child.pid});
const timer=setInterval(()=>{const timedOut=Date.now()>spec.deadline,cancelled=control();atomic('native-heartbeat.json',{...identity,generation,observedAt:Date.now()});if(cancelled||timedOut){atomic('native-result.json',{...identity,exitCode:null,cancelled,timedOut});process.kill(-process.pid,'SIGKILL');}},100);
timer.unref();
