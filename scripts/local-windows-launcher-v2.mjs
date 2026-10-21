// A detached Node owner keeps libuv's Windows Job alive until the native helper exits.
import {spawn} from 'node:child_process';
import {join} from 'node:path';
import {readFileSync,writeFileSync,renameSync,closeSync} from 'node:fs';
const spec=JSON.parse(readFileSync(process.argv[2],'utf8'));
const child=spawn('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',join(import.meta.dirname,'local-windows-runner-v2.ps1'),process.argv[2]],{windowsHide:true,env:process.env,stdio:['ignore','inherit','inherit']});
child.on('error',error=>{console.error('LOCAL_HELPER_UNAVAILABLE: '+error.code);process.exitCode=1;});
child.on('close',code=>{for(const fd of [1,2])try{closeSync(fd);}catch{}const path=join(spec.control,'native-helper-exit.json');writeFileSync(path+'.tmp',JSON.stringify({version:2,executionId:spec.executionId,manifestDigest:spec.manifestDigest,exitCode:code}),{mode:0o600});renameSync(path+'.tmp',path);process.exitCode=code??1;});
