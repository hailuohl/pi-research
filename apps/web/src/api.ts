let token = '';
try {
    const fromHash = new URLSearchParams(location.hash.slice(1)).get('token');
    token = fromHash ?? sessionStorage.getItem('pi-research-token') ?? '';
    if (fromHash) {
        sessionStorage.setItem('pi-research-token', fromHash);
        history.replaceState(null, '', location.pathname + location.search);
    }
}
catch { }
export function setToken(value: string) { token = value.trim(); sessionStorage.setItem('pi-research-token', token); }
export function hasToken() { return !!token; }
export class ApiError extends Error {
    constructor(public code: string, message: string, public status: number) { super(message); }
}
export async function api<T = any>(path: string, body?: unknown, method = 'POST', signal?:AbortSignal): Promise<T> {
    const timeout=AbortSignal.timeout(22000);
    const response = await fetch('/api' + path, { method: body === undefined ? 'GET' : method, headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal:signal?AbortSignal.any([signal,timeout]):timeout });
    const data = await response.json();
    if (!response.ok)
        throw new ApiError(data.error?.code ?? 'HTTP_ERROR', data.error?.message ?? `HTTP ${response.status}`, response.status);
    return data as T;
}
export async function eventStream(path:string,signal:AbortSignal){
    const response=await fetch('/api'+path,{headers:{Authorization:`Bearer ${token}`,Accept:'text/event-stream'},signal});
    if(!response.ok)throw new ApiError('EVENT_STREAM_UNAVAILABLE','事件连接暂不可用',response.status);
    if(!response.body||!response.headers.get('content-type')?.includes('text/event-stream'))throw Error('事件连接未返回有效流');
    return response.body;
}
export async function artifactText(id: string) {
    const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok)
        throw new Error('无法读取产物');
    return r.text();
}
export async function downloadArtifact(id: string, name: string) {
    const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${token}` } });
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
