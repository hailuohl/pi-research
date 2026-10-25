# Owner streamed text/data originals (batch 1)

This path imports a UTF-8 text/data original, returns the existing immutable `DocumentVersion`, and reads that fixed source in bounded byte pages. It does not enable 512 MiB PDF parsing, model attachments, source-input freezing, Run inputs, agent tools, or reading-completion receipts. Those retain their existing limits and authorization paths.

## Deployment policy

`PI_RESEARCH_MAX_FILE_BYTES` sets the maximum ordinary original size in **bytes**, default `536870912` (512 MiB). It must be a positive decimal safe integer; invalid configuration prevents HTTP server startup. Both streaming import and legacy text import use this policy. Existing files remain readable if the limit is later lowered.

`GET /api/projects/{projectId}/document-file-policy` reports `maxFileBytes`, `legacyJsonFileBytes`, `textPageBytes`, `mediaTypes`, `uploadTimeoutMs`, and `cursorUnit`, behind project/lifecycle guards.

Streamed media types: `text/plain`, `text/markdown`, `text/csv`, `text/tab-separated-values`, `application/json`, `application/x-ndjson`. Import validates UTF-8, not CSV/JSON syntax or scientific validity. NUL and malformed/incomplete UTF-8 are rejected. BOM, CRLF, emoji and very long lines are preserved verbatim.

The existing `document_import` JSON operation retains its 32 MiB original / 48 MiB JSON-body limits; a smaller configured cap also applies to its text input. PDF remains on that existing path, and image/video restrictions remain unchanged (20 MiB native media cap). Old imports keep their existing reader contracts and do not gain an index retroactively.

## Upload

```http
POST /api/projects/{projectId}/documents/upload?title=data.csv&mediaType=text%2Fcsv&license=CC0
Content-Type: application/octet-stream
Idempotency-Key: unique-upload-key

<raw file bytes>
```

`title` and `mediaType` are required; `license` is optional. Duplicate/unknown query parameters are rejected. Content-Length is optional; declared length and actual streamed bytes are checked. Compressed bodies are unsupported. The local Host restriction applies; a supplied Origin must exactly match the HTTP request origin, and cross-site browser requests are rejected. This route is owner-only and is not registered as an agent operation.

Success returns the existing `DocumentVersion`, including `original.artifactId`, `original.digest` (SHA-256 of the **original bytes**), `original.size`, and `original.mediaType`.

The entire body is validated even on an idempotent retry. The same key/content returns the original record; changed metadata/content conflicts before new CAS publication. Corrupted existing CAS bytes are rejected, never overwritten by retries. Invalid UTF-8, abort, exceedance, or project lifecycle changes publish no document/artifact records. Private files live under `projects/{projectId}/document-upload-staging/{id}` and are removed on normal failure/cancellation. A process kill can leave these project-owned temporary files, never a successful document record.

Before linking any CAS file, a durable project-scoped `document-blob-publication` intent records the exact original/index descriptors and staging identities. Cancellation or a failed final transaction retains this ownership, so there is no unowned CAS. The final document/artifact transaction removes the intent only after the staging links are gone. Offline purge validates intent paths, sizes and full hashes; it permits destinations that were never linked and retains CAS referenced by another project. Recovery removes only an intent-bound redundant internal staging link after checking its identity and digest; it never deletes a shared CAS path or relaxes the existing external-hardlink protection. Backup/restore preserves these intents and validates any included CAS destinations.

Uploads have a 15-minute absolute deadline including validation/publication. Other JSON bodies retain a 20-second deadline. The Node request deadline accommodates large uploads instead of cutting them off after 20 seconds.

```ts
await app.documents.importStream(USER, projectId,
  {title: 'data.csv', mediaType: 'text/csv', license: 'CC0'},
  binaryAsyncIterable, idempotencyKey, optionalAbortSignal);
```

## Fixed-source pages and reopening

```http
GET /api/projects/{projectId}/documents/{documentVersionId}/text?sourceDigest={original.digest}&cursor=0&limit=65536
```

```json
{
  "documentVersionId": "...",
  "sourceDigest": "original SHA-256",
  "cursorUnit": "utf8-byte",
  "integrityScope": "delivered-blocks",
  "cursor": 0,
  "end": 65533,
  "totalBytes": 536870912,
  "complete": false,
  "content": "exact original UTF-8 text fragment"
}
```

`cursor` defaults to 0 and must lie on a UTF-8 character boundary. `limit` defaults to 65536 and is 4–65536 bytes. The exclusive `end` may be smaller than `cursor + limit` to preserve a whole character. `Buffer.byteLength(content, 'utf8') === end - cursor`; there is no normalization, replacement character, or truncation marker. Save `documentVersionId`, `sourceDigest`, and `end`; use `end` as the next cursor, including after restart. EOF returns empty content and `complete: true`.

`complete` means this page reaches EOF. It does **not** prove earlier pages were delivered/read and creates no coverage receipt. Every page rechecks owner/project/lifecycle and source binding. Archived owner history remains readable; trashed/purging projects do not. A wrong digest, invalid boundary, corruption, or replacement during reading fails explicitly.

```ts
app.documents.readText(USER, projectId, documentVersionId,
  {sourceDigest, cursor, limit});
```

## Integrity and bounded I/O

Import uses 64 KiB slices and a disk-built authenticated index with 1 MiB source blocks. Each leaf records block SHA-256 and cumulative completed UTF-16 positions before/after the block, including BOM, for later protocol integration. A character straddling a block is counted only when its final bytes arrive.

A project-scoped `document-text-source` record binds the document, original descriptor, index artifact descriptor, source digest/size, and Merkle root. Both files live in the existing `artifacts/` CAS with artifact records recognized by backup/purge. Publication fully verifies SHA-256, including existing deduplicated CAS files. New complete files are linked atomically without replacing destinations.

A page reads at most two 1 MiB source blocks plus Merkle paths and output, never the complete source/index. Proofs authenticate touched blocks: corruption elsewhere is detected when those blocks are read or at a complete-verification boundary. `document_inspect` fully hashes these originals with bounded memory. File type/link/identity checks surround reads in addition to hashes; mtime is never an integrity substitute. Owner originals retain existing user-upload behavior and are not rewritten through agent-output redaction.

## Verification

After building, run `node --test --test-concurrency=1 tests/integration/document-stream*.test.mjs tests/integration/documents-http.test.mjs`.

Capacity: `node scripts/verify-large-file-capacity.mjs --sizes-mib=100,300,512 --output=<outside-repository-output.json>`. The script uses real HTTP streams, independent 192 MiB heap workers, exact digest/pages, and reopening. One-byte-over-configured-limit is covered by the focused suite. The primary acceptance record states which matrix cases actually ran.
