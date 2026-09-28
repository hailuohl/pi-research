# Literature provider contracts (PR10)

These are bounded retrieval adapters, not exhaustive search engines. Enabling a source is user-owned authorization, not a health check. Actual request observations are kept separately from enablement. Remote text is untrusted data and never an instruction. No acquisition validates scientific claims.

## Search and provider text

| Source | Fixed endpoints | Returned content and version assurance |
|---|---|---|
| alphaXiv | `api.alphaxiv.org/search/v2/paper/discover/{keyword,embedding}`; `www.alphaxiv.org/abs/{arxiv-id}.md` | Search metadata/snippets; fetched Markdown is provider text. An explicit requested `vN` is preserved, but its content version remains `requested-address-unverified`. Snippet reported pages are not PDF page bindings. |
| OpenAlex | `api.openalex.org/works`; `/works/{WID or doi:DOI}` | Metadata or reconstructed abstract. Returned ID/DOI checked. Basic API use can work without a key; does not imply free or anonymous PDF download. |
| bioRxiv | OpenAlex search constrained to bioRxiv source; `api.biorxiv.org/details/biorxiv/{DOI}/na/json` | Abstract or metadata; highest returned positive version, actual version and provider license retained. |
| PubMed | NCBI ESearch and EFetch | XML metadata/structured abstract; requested PMIDs must appear. Not PMC full text. |
| Crossref | `api.crossref.org/works`; `/works/{DOI}` | Metadata with checked DOI. No arbitrary publisher download. |

Search limit is 1–20 per source, one response pool only. Non-default ranking uses up to 100 candidates and is local to that pool; no continuation cursor or exhaustive coverage claim. Date bounds use provider filters where implemented and local conservative filtering (unknown dates excluded when constrained). Embedding strategy is implemented only by alphaXiv; other providers use keyword search. Partial failures are explicit; all-source failure is not an empty literature finding.

## Original PDF

Only these routes are permitted, with redirects disabled:

- alphaXiv source: `https://arxiv.org/pdf/{arxiv-id}vN`, an explicit version is required. Address binding is not content-level verification.
- bioRxiv source: `https://www.biorxiv.org/content/{DOI}vN.full.pdf`, explicit version required. Address binding is not content-level verification.
- OpenAlex source: `https://content.openalex.org/works/WID.pdf`; an OpenAlex key is required for content download. No arbitrary publisher URL or supplied content URL is used. Credentials are removed from persisted source URLs.
- PubMed/Crossref: `FULL_TEXT_UNAVAILABLE`; abstracts and metadata never substitute for original PDF.

PDF byte acquisition checks a PDF signature, retains exact bytes and digest, and does not claim the document is parseable, read, or scientifically valid. PDF parsing is a separate fixed-profile isolated operation. Provider-text raw responses preserve original received bytes including a UTF-8 BOM; normalized abstracts remain separate derived text. Unknown licenses stay unknown. Original PDFs retain their own rights.

## Transport, authorization and persistence

Text requests are at most 2 MiB; PDF acquisition at most 32 MiB. Responses are streamed with a byte cap. Fixed HTTPS hosts only, no redirects, 12-second per-request deadline, three requests per transport instance, default 350 ms NCBI interval per instance. No implicit retry. These are not cross-process/provider-global rate guarantees.

Every HTTP attempt reserves a project request-budget entry before network access. Records retain status, bytes, HTTP status when received, and sanitized numeric/date Retry-After. Credentials and arbitrary remote error bodies are not diagnostics. Authorization/settings versions are rechecked before requests, while waiting/reading, and before committing. Archived projects, cancelled work, disabled sources or expired agent scope cannot commit fresh results. Settings changes invalidate an in-flight acquisition. Durable literature workers also pass their original task authorization callback.

DocumentVersion records are immutable acquisition records with original artifact digest, source identifiers and version assurance, acquisition timestamp, license provenance and limitations. The acquisition service can reuse a matching paper receipt with the same key. Controller recovery completes a task automatically only when its exact search or DocumentVersion publication receipt already exists; an unfinished request without that receipt remains interrupted and is not resent automatically. User imports retain original bytes; neither network documents nor parsed derivatives are silently marked as user-authored evidence or added to a text corpus.

Page evidence binds DocumentVersion/raw digest, successful parse result, fixed parse manifest, page text digest and complete page image digest. Unknown table/figure structure stays unknown. A historical record is not proof that the provider remains enabled or that a newer version has been checked.

## Actual baseline observations

Source evidence: `.validation/literature-preflight-5aZn3D/evidence.json`, 2026-09-28, existing product ConnectorService, explicit USER enablement, 9/25 requests, no retries/models. alphaXiv, OpenAlex (without key), bioRxiv and Crossref search+read returned HTTP 200. PubMed failed before an HTTP response with `CONNECTOR_UNAVAILABLE`; this does not establish authentication failure, 429 or no results. These observations concern provider text/metadata, not the newly added PDF routes or permanent availability.

Official OpenAlex references checked 2026-09-28:
- https://help.openalex.org/api/authentication/ — basic keyless API use and optional bearer/query authentication.
- https://help.openalex.org/access/fulltext/ — fixed content endpoint, key requirement and original-content rights. The content page was last updated 2026-09-18.
