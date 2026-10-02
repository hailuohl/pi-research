try { sessionStorage.removeItem('pi-research-token'); } catch { }
try {
    const hash = new URLSearchParams(location.hash.slice(1));
    if (hash.has('token')) {
        hash.delete('token');
        const remaining = hash.toString();
        history.replaceState(history.state, '', location.pathname + location.search + (remaining ? `#${remaining}` : ''));
    }
}
catch { }
export class ApiError extends Error {
    constructor(public code: string, message: string, public status: number) { super(message); }
}
export async function api<T = any>(path: string, body?: unknown, method = 'POST', signal?:AbortSignal, idempotencyKey?:string): Promise<T> {
    const timeout=AbortSignal.timeout(22000);
    const response = await fetch('/api' + path, { method: body === undefined ? 'GET' : method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey??crypto.randomUUID() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal:signal?AbortSignal.any([signal,timeout]):timeout });
    const data = await response.json();
    if (!response.ok)
        throw new ApiError(data.error?.code ?? 'HTTP_ERROR', data.error?.message ?? `HTTP ${response.status}`, response.status);
    return data as T;
}
export async function eventStream(path:string,signal:AbortSignal){
    const response=await fetch('/api'+path,{headers:{Accept:'text/event-stream'},signal});
    if(!response.ok)throw new ApiError('EVENT_STREAM_UNAVAILABLE','事件连接暂不可用',response.status);
    if(!response.body||!response.headers.get('content-type')?.includes('text/event-stream'))throw Error('事件连接未返回有效流');
    return response.body;
}
export async function artifactText(id: string) {
    const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`);
    if (!r.ok)
        throw new Error('无法读取产物');
    return r.text();
}
export async function artifactBlob(id:string,signal?:AbortSignal):Promise<Blob>{
    const response=await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(22000)]):AbortSignal.timeout(22000)});
    if(!response.ok)throw new ApiError('ARTIFACT_READ_FAILED','无法读取固定产物',response.status);
    return response.blob();
}
export async function downloadArtifact(id: string, name: string) {
    const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`);
    if (!r.ok)
        throw new Error('下载失败');
    const url = URL.createObjectURL(await r.blob()), a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
