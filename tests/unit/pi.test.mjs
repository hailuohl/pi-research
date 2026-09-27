import test from 'node:test';import assert from 'node:assert/strict';import {buildSessionOptions,systemInstruction} from '../../dist/packages/pi-adapter/options.js';
import {inspectPi} from '../../dist/packages/pi-adapter/runtime.js';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('Pi options enable custom tools but never built-in bash/read or project resource discovery',()=>{const sdk={createExtensionRuntime:()=>({}),SettingsManager:{inMemory:x=>x},SessionManager:{create:(cwd,path)=>({cwd,path}),open:p=>({exact:p})}};const opts=buildSessionOptions(sdk,{cwd:'/tmp/w',agentDir:'/tmp/a',sessionDir:'/tmp/s',sessionFile:null,systemPrompt:'trusted instructions',thinking:'off'},[{name:'evidence_read'}],{},{});assert.deepEqual(opts.tools,['evidence_read']);assert.equal(opts.noTools,'builtin');assert.deepEqual(opts.resourceLoader.getAgentsFiles(),{agentsFiles:[]});assert.deepEqual(opts.resourceLoader.getExtensions().extensions,[]);assert.equal(opts.settingsManager.retry.enabled,false);assert.equal(opts.settingsManager.cacheWarming,'off');});
test('Pi restore uses exact stored session path, never most recent',()=>{
    const home=mkdtempSync(join(tmpdir(),'pi-exact-')), file=join(home,'exact.jsonl');
    try {
        writeFileSync(file,JSON.stringify({type:'session',version:3,id:'exact-id',cwd:home,timestamp:new Date().toISOString()})+'\n');
        const sdk={CURRENT_SESSION_VERSION:3,createExtensionRuntime:()=>({}),SettingsManager:{inMemory:x=>x},SessionManager:{open:p=>({exact:p,getSessionId:()=> 'exact-id'}),create:()=>{throw Error('unexpected create')}}};
        const opts=buildSessionOptions(sdk,{cwd:home,agentDir:home,sessionDir:home,sessionFile:file,systemPrompt:'test',thinking:'off'},[],{},{});
        assert.equal(opts.sessionManager.exact,file);
    } finally {rmSync(home,{recursive:true,force:true});}
});
test('missing Pi package is reported, never replaced by simulated AI',()=>{const result=inspectPi('/definitely-not-installed',{provider:'',model:'',thinking:'off'});assert.equal(result.ready,false);assert.equal(result.code,'PI_NOT_INSTALLED');assert.equal(result.liveVerified,false);});
test('research instructions separate model guesses from measured evidence',()=>{assert.match(systemInstruction('analyst'),/未运行/);assert.match(systemInstruction('reviewer'),/独立/);assert.match(systemInstruction('coordinator'),/不能自行批准/);});
