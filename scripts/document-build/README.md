# Fixed manuscript compiler

Build on the existing Linux/amd64 Docker context:

```powershell
node scripts/setup-document-build.mjs desktop-linux
```

The default downloads only the committed Debian package lock and verifies every
size and SHA-256. Docker installs those packages with `--network none` and
`apt-get --no-download`; running document jobs never download dependencies.
The Python base is pinned to the same digest used by the PDF parser. Debian
trixie and security archives are frozen at `20260918T000000Z`. The authenticated
apt resolution requires 257 packages, 346,595,108 download bytes, and approximately
936 MB installed (including Chinese fonts). These are the minimal requested
Debian packages plus mandatory dependencies, not `texlive-full`.

Explicit dependency maintenance uses `--resolve`, which first saves an apt
simulation and download plan, authenticates packages with Debian's archive keys,
and replaces the lock. Review that change before configuring the new image.
Caches, resolution evidence, build output and `latest.json` remain under
`.validation/document-build-cache`; failures retain evidence. A damaged cache
entry fails closed. Do not reuse a receipt after changing the compiler files.

The profile is `latex-document-v1`. `lockDigest`, `scriptDigest`, and
`dockerfileDigest` hash the raw bytes of the three adjacent files. `profileDigest`
hashes UTF-8 `JSON.stringify({profileId,lockDigest,scriptDigest,dockerfileDigest})`
in that property order. Corresponding labels are
`pi-research.compiler-{profile,lock,script,dockerfile,digest}`.

The immutable command is:

```text
python -I /opt/pi-document-build/build.py ENGINE MAIN_FILE BIBLIOGRAPHY SOURCE_DIGEST /output
```

Engines: `pdflatex`, `xelatex`, `lualatex`. Bibliography: `auto`, `none`,
`bibtex`, `biber`. The input snapshot places approved manuscript files at
`source/<relative path>` and the shared Docker bootstrap stages them into
`/work/source`. Source digest and arguments come from the approved manifest.
The host grants at least 125 seconds; the supervisor's total deadline is 120
seconds, including bibliography and preview rendering. TeX is limited to six
passes. Each build permits 1 MiB captured logs, 100 PDF pages, a 32 MiB PDF,
16 MiB per PNG, a 1600-pixel maximum edge and 128 MiB total exported bytes.
Chinese text with Noto Serif CJK SC is verified on XeLaTeX. Loading that large
font with LuaLaTeX under the 768 MiB live-test budget produced a truthful
failed build (engine killed with signal 9), not a successful PDF. The optional
Lua CJK budget probe accepts that explicit failure or a fully validated result;
it is not evidence that Lua CJK fits this profile. Use XeLaTeX for this template.

`build.json` contains `formatVersion`, `profileId`, `sourceDigest`, `engine`,
`bibliography`, `engineVersion`, `status`, `hadErrors`, `converged`, `passes`,
`diagnostics`, `pdf`, `previews`, and `logs`. Status is `succeeded`, `failed`,
`timed_out`, or `non_convergent`. Diagnostic entries contain severity, code,
message and nullable file/line/pass; unknown locations remain null. Successful
PDF metadata has file/digest/bytes/pages. Preview metadata has
pageNumber/file/digest/bytes/width/height. The single log is `build.log` with
file/digest/bytes metadata. PDF is `document.pdf`, previews are `page-001.png`
onwards. Failure exports diagnostics and log, without a canonical PDF.

The host must check container exit status AND the closed supervisor schema AND
`!hadErrors && converged` AND PDF/PNG bytes/digests before accepting success.
Never use an arbitrary manuscript JSON file or PDF existence as success.
The supervisor captures actual exit codes and emits results only after retiring
all subprocess groups; TeX output cannot reset the accumulated error flag.
Lua's `io.output` can write in the container's writable output mount despite
`openout_any`; a live forgery probe verifies that such JSON is discarded and a
real TeX error remains failed. The export limit and worker output monitoring
are not a hard host-disk quota; that existing runner limitation remains.

Safety uses the existing non-root, read-only-root, capability-free, resource
limited, network-none Docker sandbox. Engine flags prohibit shell escape and
Lua adds nosocket. This fixed LuaHBTeX disables execute/spawn/exec/popen, native
C loading and ffi with shell escape disabled, and strips debug to traceback.
The live probe verifies each of these. `--safer` is intentionally not passed:
the fixed luaotfload explicitly refuses it, since fonts require cache writes.
Font caches stay in `/work/build`; Lua's absolute reads use the container's
read boundary rather than `openin_any`. Biber ignores project configuration; bibliography
sources are explicit local files. `openin_any` is defense in depth only and is
not a filesystem sandbox (TeX Live 2026 removed its effect). No host credentials
or Docker socket are mounted. Packages requiring external commands, remote
bibliography sources or extra packages fail rather than download or execute.

Primary references: [Debian snapshot](https://snapshot.debian.org/),
[Lua engine options](https://github.com/TeX-Live/texlive-source/blob/trunk/texk/web2c/luatexdir/lua/luainit.c),
[Biber options](https://github.com/plk/biber/blob/dev/bin/biber),
[TeX Live security/configuration changes](https://tug.org/texlive/doc/texlive-en/texlive-en.html).
