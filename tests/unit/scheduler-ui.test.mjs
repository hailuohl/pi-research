import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {ComputeWait,computeReasonLabels} from '../../dist/web/assets/compute-wait.js';

test('retained execution wait details explain unknown reservations without linking the removed page',()=>{
 const item={kind:'run',id:'run',state:'unknown',reason:'manual_recovery_required',held:true,requested:{cpus:2,memoryMb:512,gpu:{deviceIds:['GPU-id']}}};
 const html=renderToStaticMarkup(ComputeWait({data:{compute:{items:[item]}},kind:'run',id:'run'}));
 assert.match(html,/旧宿主作业需要人工核对，保留占用/);assert.match(html,/2 CPU \/ 512 MiB \/ 1 NVIDIA GPU/);assert.match(html,/未知状态不会自动释放容量/);assert.doesNotMatch(html,/资源与调度|<button/);
 assert.equal(Object.keys(computeReasonLabels).length,14);
});
test('missing queue details never claim readiness and missing DTO still gives loading feedback',()=>{
 const missing=renderToStaticMarkup(ComputeWait({data:{compute:{items:[]}},kind:'run',id:'missing'}));
 assert.match(missing,/队列详情暂未加载/);assert.doesNotMatch(missing,/容量检查通过|资源与调度/);
 assert.match(renderToStaticMarkup(ComputeWait({data:{},kind:'run',id:'missing'})),/调度信息待加载/);
});
