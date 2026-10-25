# Fixed project workspace inputs

`workspace_text_prepare({path, purpose})` is an explicit local read for an ordinary root coordinator session. `path` is a canonical project-relative regular UTF-8 file, with the existing secret/internal-path, symlink and escape exclusions. The default maximum is 512 MiB (`PI_RESEARCH_MAX_FILE_BYTES` controls new intake); JSON/model input limits are unchanged. Preparation streams source and index without buffering the complete file, checks descriptor/path identity throughout acquisition and publication, and has a 120-second service deadline plus a 20-second Worker transport margin.

The ready response contains `artifactId`, `sourceDigest`, `size`, `textSourceId`, `readProtocol: "fixed-text-v1"`, `utf16Length`, `status: "ready"`, `sourceKind: "workspace-snapshot"`, original `workspace`/`path`, `purpose` and `workspaceBindingId`. It contains no source text. Each fresh successful preparation selects a distinct immutable binding and artifact even if CAS bytes deduplicate. Replaying the same call validates its saved snapshot and never reselects it.

Read the returned artifact using `artifact_read` with `readProtocol`, `sourceDigest`, `textSourceId`, and UTF-8 byte `cursor`/`limit` (4–16000). Only the existing exact SDK-delivered ACK supplies reading coverage:

- `whole-text`: contiguous coverage of all bytes. Reading only nonempty-source EOF does not fill gaps. Empty UTF-8 text is valid but needs an actually delivered EOF page.
- `dataset-reference`: at least one nonempty delivered inspection page, with full-source SHA verification at freeze/history boundaries. This does not assert that the model read the whole dataset; an empty dataset cannot meet this purpose.

A brief stores `sourceKind: "workspace-snapshot"` and `readId: workspaceBindingId`, with the fixed artifact/digest/size/textSourceId/purpose. Current selection and the same snapshot metadata enter both approval preparation and save fingerprints. Clarifying may omit an incomplete new selection; ready requires the selected coverage. At most 32 fixed inputs are allowed. Non-literature method inputs use verified references; literature parsing retains its bounded limit and rejects unsupported large sources.

Later changes to the live project file do not alter the explicit snapshot or previous brief/evidence. Prepare again with a new call ID to select newer bytes for a new revision. Legacy `workspace_read(source="project")` retains its live freshness and 2 MiB reading limit. Attachment inputs retain their document identity. Preparation/reading does not grant brief writes, approval, or execution; it remains available in readOnly mode, while saving a brief keeps its own write guard. Task, wakeup and continuation identities cannot prepare new workspace selections.

## Reproducible verification

`tests/integration/fixed-workspace-pi-http.test.mjs` uses the pinned actual Pi SDK and an offline local provider. Its default source is 3 MiB; separate small cases cover confirm approval and a retry after durable save/provider failure. It verifies the original snapshot after live mutation and reopen.

Root-only capacity entry (PowerShell):

```powershell
$env:PI_RESEARCH_FIXED_WORKSPACE_BYTES='536870912'
$env:PI_RESEARCH_FIXED_WORKSPACE_TIMEOUT_MS='240000'
node --max-old-space-size=192 --test --test-name-pattern='fixes workspace bytes' tests/integration/fixed-workspace-pi-http.test.mjs
Remove-Item Env:PI_RESEARCH_FIXED_WORKSPACE_BYTES
Remove-Item Env:PI_RESEARCH_FIXED_WORKSPACE_TIMEOUT_MS
```

The fixture bounds model wire bodies and host peak RSS, prohibits complete-source synchronous reads, and generates its source in 64 KiB chunks. It does not contact an external provider or run Docker/browser checks.
