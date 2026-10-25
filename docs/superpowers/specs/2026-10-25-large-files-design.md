# 512 MiB configurable files

Approved in the project chat on 2026-10-25: support individual ordinary text/data files up to 512 MiB by default, configurable; preserve authorization, immutable evidence and exact reading records; deliver and push validated batches on the existing remote work branch. Frontend layout remains deferred.

## Design

Separate original-file storage, bounded text delivery, parser/runner resources and provider request limits. Large originals use streamed input, hashing and publication into the existing CAS; incomplete input is never published. Text pages refer to a fixed digest and explicit cursor unit. Only the actual delivered range can contribute to reading coverage. Dataset computation is distinct from the model reading every byte.

Retain project/task/source authorization on every operation. Do not enable Pi's default filesystem or shell tools. Reuse public Pi truncation utilities where appropriate; the pinned SDK read tool still materializes the entire file and is unsuitable as the large-file authority. Keep structured result metadata intact.

Use bounded stream buffers and fixed-source indexing for large text. Validate strict UTF-8 and complete Unicode boundaries, including very long lines. Preserve the original SHA-256; a derived block index is trusted only after full source validation and is bound to that source. Per-page verification covers delivered blocks; full stream verification is required at publication and critical fixed-input/run/acceptance boundaries. Do not claim metadata caching or read-only file mode is equivalent to full integrity verification.

Keep old routes, cursor units, evidence IDs and historical receipts interpretable. New protocols are explicit. Existing compact review already has result-digest delivery ACK; extend that mechanism rather than inventing another one.

## Delivery batches

1. Owner large-text/data import, bounded fixed-source reading and reopen: configurable policy, streamed CAS, text range support, HTTP transport and focused capacity tests.
2. Source/draft/artifact reading and fixed inputs: shared bounded reader, actual delivered coverage, exact quotes, old-protocol compatibility, removal of conflicting downstream size gates.
3. Fixed dataset to run, output archive and review: streamed freeze/copy/archive, fixed data references, bounded review readers and integrity validation; preserve code versus dataset reading obligations.
4. Long documents, search and model delivery: bounded parser/index operations, structured output budgets and full-reference recovery; retain explicit provider/resource constraints.

The first batch does not grant an agent new source access or assert that a large document is already supported by later parser/run stages.

## Acceptance common to every batch

- Supported and authorized files within the configured policy have a real continuation path; exceedance fails explicitly before publication/use.
- Import/read/copy/archive has bounded I/O and memory; text is exact for Chinese, emoji, BOM, long single lines and arbitrary valid page boundaries.
- Partial, failed or undelivered reads never become complete-reading evidence; metadata, digest and cursor remain intact.
- Cross-project access, revocation, changed sources and corrupt bytes are rejected; reopening preserves exact fixed-source continuation and historical records.
- Tests distinguish passed/failed/not-run; capacity fixtures include 100, 300 and 512 MiB, plus one-byte-over-limit. Each integrated batch receives one full regression/clean build and independent Astra review before commit/push.
