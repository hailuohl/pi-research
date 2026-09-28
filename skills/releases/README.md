# Reviewed builtin skill releases

`index.json` lists maintained releases. Each `<bundleId>/manifest.json` retains
the original ordered skill metadata; `blobs/<digest>` retains exactly the
listed UTF-8 bytes. The generated `packages/skills/releases.ts` is the runtime
trust registry. The application does not discover releases by scanning folders
or trust an adjacent manifest merely because it exists.

The original `6683733f...` release keeps its historical ID. That ID predates the
current `SHA256(JSON.stringify(skills))` release algorithm; its separately pinned
`manifestDigest` verifies the original metadata without renaming old sessions.
Current-release reads verify `skills/openresearch`; historical reads verify the
registered archive. Native Pi skill/file discovery remains disabled.

To publish an update, review the intended source and metadata changes, then run
`node scripts/rebuild-skill-manifest.mjs` from the repository root. The script
first verifies every registered archive and proves that the prior published
`packages/skills/manifest.ts` is recoverable. It refuses to reconstruct missing
old bytes from edited current files. It then archives the new release with
exclusive writes, checks existing same-ID bytes, and updates generated metadata.
Normal build/start never runs this maintenance step. Commit source, archives,
registry and rebuilt distribution together; preserve blob bytes without Git
line-ending conversion.

Project configuration chooses the builtin baseline plus reviewed custom
revisions. Changing custom revisions preserves that baseline unless
`builtinBundleId` is supplied explicitly. Selecting an entire `bundleId` restores
that exact combination. Unconfigured projects default new bindings to the
current release. Existing sessions, attempts and retries retain their recorded
bundle; unknown started histories fail closed instead of adopting today's files.
