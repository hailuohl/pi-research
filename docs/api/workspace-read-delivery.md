# Small workspace reads and delivery receipts

`workspace_read({path, source?})` retains its complete small-text response. `source` defaults to `session`. Eligible ordinary coordinator reads return a pending `draftReadId` for managed session drafts or a pending `sourceInputReadId` for project inputs. Owner reads do not mint agent delivery evidence.

An existing authorized research continuation also retains its managed session-draft read capability. The host verifies its original human task, current continuation, actual wakeup/message/generation, model, permission and lease; receipts retain that actual identity and immutable continuation reference. This does not grant project input selection or automatic brief approval. Automatic ready/save still needs the separately acknowledged automatic-approval scope and all normal delivered-coverage/current-write checks. A bound approval notice may replay only its exact approved operation; it does not gain draft-reader authority.

For bounded output use:

```json
{"path":"protocol.md","readProtocol":"workspace-text-v1","cursor":0,"limit":16000}
```

The response adds `readBindingId`, `cursorUnit:"utf8-byte"`, `cursor`, `end`, `totalBytes` and `complete`. Draft pages also identify `writeVersion`. Continue with the same `path`, `source` and `readBindingId`, setting `cursor` to the previous `end`. Limits are 4–16000 UTF-8 bytes; cursors must be character boundaries. BOM, CRLF and Unicode bytes are preserved. `digest` and `size` always describe the full file, not the page.

Both modes retain the existing 2MiB text/write budget. Every page verifies the current full small file against its binding. This is a live workspace protocol, not a CAS reader or a large-file writer. Large original texts/datasets use `workspace_text_prepare` and the fixed `artifact_read` protocol.

Only the host's exact actual SDK `tool_execution_end` acknowledgment marks a page delivered. A successful direct operation call or returned ID is insufficient. Full coverage must start at zero with no gaps; EOF alone does not establish coverage. Empty files need a delivered empty page. A cache hit never adds coverage; replaying a pending receipt prevents its late acknowledgment. Retry incomplete delivery with a fresh call ID. Changed bytes or a new managed writeVersion, even with identical bytes, invalidate old current-draft proofs.

Bindings also fix the reader authority: ordinary-root and continuation pages, or different continuation chains, cannot combine partial coverage. A legitimate continuation starts its own binding. Previously delivered facts remain historical facts after execution authority ends; they do not revive that authority.

`research_brief_save.draftFiles` remains `[{path,readId}]`; a page receipt resolves its immutable binding. All current managed drafts must be declared and fully delivered. Project input selections persist across clarifying revisions: incomplete new selections are skipped there, but still block ready. Selection changes, including pending changes, affect approval fingerprints. Existing fixed workspace selections take precedence for the same path.

Original accepted historical briefs and frozen input artifacts retain their exact metadata and digest. Missing legacy delivery is never relabeled as delivered, and legacy unaccepted reads cannot newly freeze. A new ready draft needs actual delivery even if its old receipt appears in a prior brief. Fixed confirmed references remain independent of later repairs; fresh current capture still verifies current managed bytes. Draft history retains metadata, not a new archive of historical draft text.

Externally enlarged content cannot be replaced through the small text writer: new preimages are bounded and write/recovery comparisons stream live bytes. Conflicts retain original files and journals. Existing journal JSON/base64 format remains unchanged; this does not provide a 512MiB draft writer or streaming journal parser.
