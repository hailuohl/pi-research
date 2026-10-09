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
test('coordinator instructions advance exact authorized compute and retain manual approval boundaries',()=>{
    const instruction=systemInstruction('coordinator'),steps=['workspace_prepare_from_revision','workspace_write','development_prepare','development_review_prepare','reviewed_change_prepare'];
    for(let i=0;i<steps.length;i++){assert.ok(instruction.includes(steps[i]));if(i)assert.ok(instruction.indexOf(steps[i])>instruction.indexOf(steps[i-1]));}
    assert.match(instruction,/读取返回的approval\/effectiveState\/canSubmit/);
    assert.match(instruction,/准确派生批准为approved且canSubmit=true，立即development_submit/);
    assert.match(instruction,/否则报告批准状态和具体阻断，不忙轮询或假称已批准/);
    assert.match(instruction,/仅当返回的准确批准为approved且依据为本任务明确授权fullAccess时，立即提交该准确意向/);
    assert.match(instruction,/否则向用户说明计算范围并结束回复等待原对话确认，不能自己批准/);
    assert.match(instruction,/expired必须重新prepare，不延长旧清单/);
    assert.match(instruction,/不能自行批准计划、计算、整合或发布/);
    assert.match(instruction,/succeeded 且 integrity=complete/);assert.match(instruction,/审查计划仍需用户批准/);assert.match(instruction,/完整差异.*另行批准整合/);
    assert.match(instruction,/手动 artifact.*change_proposal_prepare/);assert.doesNotMatch(instruction,/新代码须通过 change_proposal_prepare/);
});
test('development reviewers must read the fixed target and cite every required evidence input with a verdict',()=>{
    const instruction=systemInstruction('reviewer');
    for(const tool of ['task_context_read','developmentReview','development_review_source_list','development_review_source_read','evidence_read','artifact_read','task_result_submit'])assert.ok(instruction.includes(tool),tool);
    assert.match(instruction,/基础版本不能替代该候选/);assert.match(instruction,/verdict=accept\/reject\/disputed/);assert.match(instruction,/evidenceIds 中引用全部必需输入证据 ID/);assert.match(instruction,/成功提交后停止/);
});
