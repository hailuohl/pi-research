import { digest } from '../storage/store.js';
/** Provenance compatibility only; original text guards independently enforce live reading authority. */
export function automaticTextGrantCompatible(store, s, host) {
    if (!s.textCorpusGrantId)
        return true;
    try {
        const g = store.get('text-corpus-grant', s.textCorpusGrantId, s.projectId), ref = g.automaticApproval;
        if (!ref || host?.automaticApprovalScope !== 1)
            return false;
        const intact = (p) => { const { digest: hash, ...fixed } = p, proof = store.get('automatic-approval-proof', hash, s.projectId); return hash === digest(fixed) && digest(proof.reference) === digest(p); };
        const r = store.get('research-action', ref.subjectId, s.projectId), a = store.get('approval', g.approvalId, s.projectId), grantProof = a.automaticApproval;
        const payload = { sessionId: g.sessionId, model: g.model, corpusId: g.corpusId, configurationVersion: g.configurationVersion, documents: g.documents, maxSearches: g.maxSearches, expiresAt: g.expiresAt, approvalId: g.approvalId, ...(g.pmcDocuments ? { pmcDocuments: g.pmcDocuments } : {}) };
        return g.digest === digest(payload) && a.digest === g.digest && a.subjectKind === 'text-corpus-grant' && a.subjectId === g.id && a.scope === 'text-corpus-grant.activate' && intact(ref) && !!grantProof && intact(grantProof) && grantProof.subjectKind === a.subjectKind && grantProof.subjectId === g.id && grantProof.subjectDigest === g.digest && grantProof.subjectScope === a.scope && ref.subjectKind === 'research-action' && r.automaticApproval?.digest === ref.digest && r.actionKind === 'text_grant' && r.requestDigest === ref.subjectDigest && r.sessionId === s.id && g.sessionId === s.id && r.originMessageId === ref.originMessageId && ref.rootSessionId === s.id && digest(g.model) === digest(s.model) && grantProof.rootSessionId === s.id && grantProof.originMessageId === ref.originMessageId && grantProof.permission.hostEpoch === ref.permission.hostEpoch && grantProof.runtimeId === ref.runtimeId && (r.state === 'pending' || r.state === 'completed' && r.resultRef && 'grantId' in r.resultRef && r.resultRef.grantId === g.id) === true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=automatic-text-grant.js.map