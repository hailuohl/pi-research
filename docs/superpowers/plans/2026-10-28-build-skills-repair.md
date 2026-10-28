# Build and skill history repair

**Scope:** Repair the current application build and skill history. The user chose to keep the unfinished research handoff and scientific-claim modules as drafts. Research data, existing pins, approvals and unrelated working changes remain intact.

**Baseline:** `1776eca34909cff9d6246379a93d3e19ac4e01e7`, including the original untracked source and tests. The original directory was copied and hashed before changes. Implementation uses an isolated worktree; original data is inspected read-only.

## Acceptance

1. Application build and typecheck follow the real application import graph. A disconnected erroneous draft does not prevent release, while importing it does fail typecheck. Drafts have an explicit no-emit check and remain byte-identical.
2. Skill catalog, import and fixed historical reads work. Unknown identities, changed bytes, symlinks, unapproved and revoked input remain rejected.
3. Current skill text and default release remain unchanged. Restore historical content from verified original bytes; never substitute today's text for an old pin.
4. A historical development bundle with unsupported scientific-planning requirements remains readable as history, but new model/worker/task execution is rejected before admission. No data migration or permission relaxation.
5. Run affected checks, one full regression, a clean reproducible build, browser/Docker key paths and an independent Astra/xhigh review. Synchronize the validated runtime package and push this repair on the current branch.

## Execution

- Main agent: build-boundary regression, application and draft tsconfigs, explicit draft typecheck command; restore the 43 committed archives and trusted registry; correct the two test fixtures to use their returned configuration versions.
- Astra/high implementer: recover the existing `3301d03e…` development archive from three byte-identical local sources, retain its identity, and enforce runtime compatibility through the existing skill preflight boundary. Add an isolated regression for readable history and denied execution.
- Main agent: integrate, build from a clean output directory, preserve previous generated WIP output separately, and verify the runtime package against the clean manifest. Default full tests continue to include draft tests; failures in unfinished draft functionality are reported, not suppressed.
- Fresh Astra/xhigh reviewer: immutable patch and source snapshot, archive identity and path validation, startup/admission/permission boundaries, preservation evidence. Review is read-only.
- Main agent: explicitly stage only this repair, commit and push to the existing private repository branch, then verify the remote SHA.

## Evidence and constraints

Original baseline, pre-repair failures and machine results remain in `output/repair-build-skills-20261028-d0a1c7b2` outside Git. Never copy credentials, runtime databases or native conversations into a task snapshot or commit. The `3301d03e…` source worktrees contain unpublished bytes: their base SHAs are provenance context, not proof that the archive was committed there.

The 43 committed archives come from `e2272e0fa134385080b59eb67aeebfe5da0e2b1a`; all manifest/blob identities are checked. Current `skills/piresearch` and `packages/skills/manifest.ts` are protected by the original file hashes. The unresolved draft interfaces remain visible through `npm run typecheck:wip`; this batch does not publish those new research protocols.
