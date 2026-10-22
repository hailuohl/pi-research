const drafts = /* @__PURE__ */ new Map();
const key = (projectId, sessionId) => "pi-research-composer-v1:" + JSON.stringify([projectId, sessionId]);
const empty = () => ({ draft: "", draftVersion: 0, attachments: [] });
const text = (value, max) => typeof value === "string" && value.length <= max;
function attachment(value) {
  if (!value || typeof value !== "object") return null;
  const a = value;
  if (!text(a.documentVersionId, 200) || !a.documentVersionId || !text(a.artifactId, 200) || !a.artifactId || typeof a.digest !== "string" || !/^[a-f0-9]{64}$/.test(a.digest) || !text(a.title, 2e3) || !text(a.mediaType, 200) || !Number.isSafeInteger(a.size) || Number(a.size) < 0 || Number(a.size) > 32 * 1024 * 1024) return null;
  if (a.inputMode !== void 0 && a.inputMode !== "native" || a.parseResultId !== void 0 && !text(a.parseResultId, 200) || a.resultDigest !== void 0 && (typeof a.resultDigest !== "string" || !/^[a-f0-9]{64}$/.test(a.resultDigest)) || a.pageCount !== void 0 && (!Number.isSafeInteger(a.pageCount) || Number(a.pageCount) < 1)) return null;
  return { documentVersionId: a.documentVersionId, artifactId: a.artifactId, digest: a.digest, title: a.title, mediaType: a.mediaType, size: Number(a.size), ...a.inputMode === "native" ? { inputMode: "native" } : {}, ...typeof a.parseResultId === "string" ? { parseResultId: a.parseResultId } : {}, ...typeof a.resultDigest === "string" ? { resultDigest: a.resultDigest } : {}, ...typeof a.pageCount === "number" ? { pageCount: a.pageCount } : {} };
}
function readComposerDraft(projectId, sessionId) {
  try {
    if (typeof sessionStorage === "undefined") return empty();
  } catch {
  }
  const id = key(projectId, sessionId), cached = drafts.get(id);
  if (cached) return structuredClone(cached);
  try {
    const saved = JSON.parse(sessionStorage.getItem(id) ?? "null");
    if (!saved || saved.version !== 1 || typeof saved.draft !== "string" || !Number.isSafeInteger(saved.draftVersion) || saved.draftVersion < 0 || !Array.isArray(saved.attachments) || saved.attachments.length > 5) return empty();
    const attachments = saved.attachments.map(attachment);
    if (!attachments.every((a) => a !== null)) return empty();
    const value = { draft: saved.draft, draftVersion: saved.draftVersion, attachments };
    const p = saved.pending;
    if (p && typeof p.key === "string" && /^[a-f0-9-]{36}$/.test(p.key) && ["prompt", "follow_up"].includes(p.mode) && typeof p.draft === "string" && Number.isSafeInteger(p.draftVersion) && p.draftVersion >= 0 && Array.isArray(p.attachmentIds) && p.attachmentIds.length <= 5 && p.attachmentIds.every((id2) => text(id2, 200))) value.pending = { key: p.key, mode: p.mode, draft: p.draft, draftVersion: p.draftVersion, attachmentIds: p.attachmentIds };
    return value;
  } catch {
    return empty();
  }
}
function saveComposerDraft(projectId, sessionId, value) {
  try {
    if (typeof sessionStorage === "undefined") return false;
  } catch {
  }
  const id = key(projectId, sessionId), hasDraft = !!value.draft || value.attachments.length > 0;
  drafts.set(id, structuredClone(value));
  try {
    if (hasDraft) sessionStorage.setItem(id, JSON.stringify({ version: 1, ...value }));
    else {
      sessionStorage.removeItem(id);
      drafts.delete(id);
    }
    return true;
  } catch {
    return false;
  }
}
export {
  readComposerDraft,
  saveComposerDraft
};
