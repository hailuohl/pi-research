let token = "";
try {
  const fromHash = new URLSearchParams(location.hash.slice(1)).get("token");
  token = fromHash ?? sessionStorage.getItem("pi-research-token") ?? "";
  if (fromHash) {
    sessionStorage.setItem("pi-research-token", fromHash);
    history.replaceState(null, "", location.pathname + location.search);
  }
} catch {
}
function setToken(value) {
  token = value.trim();
  sessionStorage.setItem("pi-research-token", token);
}
function hasToken() {
  return !!token;
}
class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
async function api(path, body, method = "POST", signal) {
  const timeout = AbortSignal.timeout(22e3);
  const response = await fetch("/api" + path, { method: body === void 0 ? "GET" : method, headers: { Authorization: `Bearer ${token}`, ...body === void 0 ? {} : { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() } }, ...body === void 0 ? {} : { body: JSON.stringify(body) }, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(data.error?.code ?? "HTTP_ERROR", data.error?.message ?? `HTTP ${response.status}`, response.status);
  return data;
}
async function eventStream(path, signal) {
  const response = await fetch("/api" + path, { headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" }, signal });
  if (!response.ok) throw new ApiError("EVENT_STREAM_UNAVAILABLE", "\u4E8B\u4EF6\u8FDE\u63A5\u6682\u4E0D\u53EF\u7528", response.status);
  if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) throw Error("\u4E8B\u4EF6\u8FDE\u63A5\u672A\u8FD4\u56DE\u6709\u6548\u6D41");
  return response.body;
}
async function artifactText(id) {
  const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok)
    throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u4EA7\u7269");
  return r.text();
}
async function artifactBlob(id, signal) {
  const response = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${token}` }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(22e3)]) : AbortSignal.timeout(22e3) });
  if (!response.ok) throw new ApiError("ARTIFACT_READ_FAILED", "\u65E0\u6CD5\u8BFB\u53D6\u56FA\u5B9A\u4EA7\u7269", response.status);
  return response.blob();
}
async function downloadArtifact(id, name) {
  const r = await fetch(`/api/artifacts/${encodeURIComponent(id)}/content`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok)
    throw new Error("\u4E0B\u8F7D\u5931\u8D25");
  const url = URL.createObjectURL(await r.blob()), a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
export {
  ApiError,
  api,
  artifactBlob,
  artifactText,
  downloadArtifact,
  eventStream,
  hasToken,
  setToken
};
