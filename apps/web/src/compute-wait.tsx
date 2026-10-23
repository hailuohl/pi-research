import * as React from 'react';
import type {ProjectState,ComputeWaitReason} from './models.js';

export const computeReasonLabels:Record<ComputeWaitReason,string>={gpu_busy:'等待 GPU 设备，或等待 CPU Docker／旧版 SSH 作业结束',ready:'容量检查通过，等待调度',worker_active:'执行器仍持有有效租约',recovery_due:'待核对原作业并恢复监管',target_unresolved:'计算目标尚未解析',target_unavailable:'计算目标暂不可用',target_changed:'目标身份已变化，需要核对',legacy_target_unknown:'旧作业目标未知，保留占用',request_too_large:'请求超过配置总容量，等待不会自动解决',host_capacity:'等待共享宿主容量',target_capacity:'等待此计算目标容量',earlier_job:'等待更早的作业',recovery_backoff:'恢复暂缓，等待下次核对',manual_recovery_required:'旧宿主作业需要人工核对，保留占用'};
export function ComputeWait({data,kind,id}:{data:ProjectState;kind:'run'|'development'|'document'|'publication';id:string}){
 const item=data.compute?.items.find(i=>i.kind===kind&&i.id===id);
 return <div className="small muted"><p>{item?computeReasonLabels[item.reason]:data.compute?'此作业的队列详情暂未加载，等待状态更新。':'调度信息待加载。'}</p>{item?.reason==='target_unavailable'&&item.backend==='docker'?<p>检查所选 Docker context 与连接；若使用本机 Docker Desktop，请确认已启动。</p>:null}{item?<p>需求 {item.requested.cpus} CPU / {item.requested.memoryMb} MiB{item.requested.gpu?` / ${item.requested.gpu.deviceIds.length} NVIDIA GPU`:''} · {item.held?'容量保留中':'尚未预留容量'}{item.state==='unknown'?'；未知状态不会自动释放容量':''}</p>:null}</div>;
}
