# DuMate separation implementation plan

**Goal:** Move completed DuMate source, development documents and releases to the sibling `dumate/` directory, archive previous contest submissions separately, and preserve ongoing work and evidence.

**Architecture:** Keep the existing private repository and Git history. Relocate only an explicit, clean file inventory; record original and new paths with SHA-256. Keep raw validation data, temporary working copies, ignored caches, installed platform copies and running services in place. Preserve historical documents unchanged and explain historical paths through the relocation index.

**Spec:** User request in this chat on 2026-10-21; project `AGENTS.md`.

## Acceptance conditions

1. Completed DuMate source/documents/releases and old contest submissions have separate, complete inventories and destinations.
2. Each relocated original retains its bytes and SHA-256; existing destinations are never overwritten, and changed source files stop migration.
3. Existing Git history and original validation records remain recoverable; original logs, databases and native conversations stay in place.
4. Existing staged/dirty/untracked work, temporary copies, worktrees and running jobs are not moved, overwritten, restarted or committed by this batch.
5. Main-project build/runtime/test boundaries remain unchanged; validate relocation, isolated build/regression and relevant standalone checks, then obtain an independent retention review.

## File ownership and destinations

- Move clean tracked `skills/dumate/**` files, excluding ignored caches, to `../dumate/skills/dumate/**`.
- Move `docs/DUMATE-MIGRATION-PLAN.zh-CN.md` and clean tracked `docs/acceptance/flow-dumate-*/**` to the same relative layout under `../dumate/`.
- Move completed `../output/dumate/*.zip` to `../dumate/releases/`.
- Move old application PDFs, previous-contest PDFs, pending-signature application proofs and three existing submission-asset ZIPs to `../archive/legacy-contests-20261021/`.
- Add sibling READMEs and relocation manifests; add a short main-project relocation index and verification evidence.
- Do not edit main application code, dependencies, front-end assets, existing source manifests or prior acceptance text.

## Steps

- [x] Record clean move candidates, Git baseline/index and protected work fingerprints; check active processes and destination containment.
- [x] Validate every source/destination, then move exact files with native PowerShell operations; verify all hashes and protected work.
- [x] Add navigation and historical-path notes; keep historical content unchanged.
- [x] Run isolated applicable checks and record passed, skipped and not-run results without updating the original build outputs.
- [x] Freeze this batch's diff and manifests for an independent Astra/xhigh retention review; address only blockers.
- [x] Prepare the exact stage set on the current branch. Commit, push and remote-containment receipts are recorded at delivery to avoid a self-referencing commit.

## Review focus

- Missing files, changed bytes, ignored caches or shared temporary evidence accidentally moved.
- Historical references mistaken for current paths, especially links back to retained main-project skills.
- Newly written, staged or active files being included through broad directory moves or broad Git staging.
- Local relocation being mistaken for a new remote repository or a backup of raw research data.
- Build/test evidence accidentally claiming validation of platform workflows or unrelated in-flight changes.

## Decisions

- User has authorized execution and routine commit/push. Continue without an extra approval pause.
- This is file relocation, not an application behavior change; use inventory assertions and existing checks rather than adding product tests.
- Source Git history remains in `hailuohl/pi-research`; no new remote repository, history rewrite or branch merge is created.
