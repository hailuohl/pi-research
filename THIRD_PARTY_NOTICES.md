# Third-party notices

## Current local React browser bundle

React and ReactDOM 19.3.0, and their locked scheduler dependency, are bundled into
`dist/web/assets/main.js`. Copyright (c) Meta Platforms, Inc. and affiliates.
They use the MIT license; its full text is included in `dist/web/LICENSE.react.txt`.
There is no CDN runtime dependency. esbuild 0.28.2 (MIT, Copyright (c) 2020 Evan
Wallace) and the locked React type packages are development tools only.

## Historical React browser baseline

- `apps/web/public/vendor/react.production.min.js` — React 16.0.0.
- `apps/web/public/vendor/react-dom.production.min.js` — ReactDOM 16.0.1.
- These files remain byte-pinned reference inputs and are excluded from `dist`.
- Copyright (c) 2013-present, Facebook, Inc.
- ReactDOM bundle also identifies Modernizr 3.0.0pre (Custom Build), MIT.

These unmodified offline bundles were available in the build environment. They are not supplied as a recommendation to retain these old versions in a production deployment. No font files are included.

## MIT license — React / ReactDOM

Copyright (c) 2013-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Development/runtime packages

TypeScript: Apache-2.0. @types/node and undici-types: MIT. These npm packages
are specified in the development lockfile, not vendored in the distribution.
Pi packages are not bundled. Install the pinned Pi runtime separately and
retain the upstream notices distributed with those packages. Their runtime
and transitive lockfile is generated in `.pi-runtime/` when installed.

No OpenResearch application runtime, database, CLI or hosted service is bundled.
The adapted skills and selected figure resources are described below.
The original project design names OpenResearch as a functional reference;
that is not a claim of endorsement, behavioral parity or completed cloning.

## OpenResearch skills and literature protocol adaptation
Copyright (c) 2026 alphaXiv. MIT; full text in `third_party/openresearch/LICENSE`. Based on commit 3037f727e80e0ab20c61a87c613a50dde009a835. The current `skills/piresearch` release adapts twelve thematic modules plus the overview to existing Pi Research tools and role boundaries; historical releases retain their original scope. Six figure references and the selected matplotlib/TikZ assets are adapted from the same verified upstream revision. The figure assets retain their license notices when copied into a work product. Loading a resource does not execute it. `packages/connectors` ports selected literature protocol behavior from Rust `src/client.rs` to TypeScript and adds independent validation, cancellation, settings and bounded requests. No ORX application runtime, hosted account or telemetry is included. Source identities and the current adaptation scope are recorded in `third_party/openresearch/source-manifest.json`.

## Scientific Agent Skills method adaptation

Copyright (c) 2025 K-Dense Inc. MIT; full text in
`third_party/scientific-agent-skills/LICENSE`. Eight method references are adapted
from `K-Dense-AI/scientific-agent-skills` at commit
`a1043ef544e3a100c28e70a736b6cf32554d0677`: experimental design, statistical power,
exploratory data analysis, statistical analysis, uncertainty and units, hypothesis
generation, scientific critical thinking, and systematic literature review.
One additional reference adapts selected statsmodels/scikit-learn implementation
methods from that same commit. Their SKILL frontmatter says BSD-3-Clause, recorded
separately in the source manifest; the upstream repository MIT notice is retained.
They are rewritten in Chinese for the existing Pi Research roles, tools, evidence
and approval boundaries. Upstream scripts, Python dependencies, hosted services,
image generation and advertising instructions are not bundled. Source paths,
hashes and adapted resource locations are recorded in
`third_party/scientific-agent-skills/source-manifest.json`; the existing skill
modules retain their separate OpenResearch provenance.

The original `examples/regression-libraries` code uses separately installed
scientific libraries only in its optional research image. Package license and
distribution metadata remain in the image; no library binaries or upstream skill
scripts are vendored. Its resolved environment is recorded with each Run.

## Optional isolated PDF parser

`scripts/pdf-parser` uses pypdfium2 5.13.0 (BSD-3-Clause / Apache-2.0 and bundled PDFium dependency licenses) and Pillow 11.3.0 (MIT-CMU). Wheel hashes are fixed in `requirements.lock`; wheels and built images are not committed. The setup script retains the wheels' license directories, including pypdfium2's `LICENSES` and `BUILD_LICENSES`, inside the image. The fixed Python base image retains its upstream notices. See [parser setup](scripts/pdf-parser/README.md) and the upstream [pypdfium2](https://pypi.org/project/pypdfium2/5.13.0/) and [Pillow](https://pypi.org/project/Pillow/11.3.0/) distributions.

Downloaded research documents retain their own licenses; an acquisition record does not grant additional rights. Original test PDFs in `tests/support/pdf-fixture.mjs` use self-contained drawn glyphs and bitmap fixtures, not third-party paper pages.

## Optional isolated manuscript compiler

`scripts/document-build/debian-packages.lock.json` fixes 257 Debian trixie packages by version, size, URL and SHA-256, using the 20260918 Debian/security snapshots and the fixed Python base. TeX Live, BibTeX/Biber, Poppler, Latin Modern and Noto CJK fonts retain their upstream licenses; Debian copyright files remain in the image under `/usr/share/doc/*/copyright`. Their binaries and the built image are not committed to this repository. The setup instructions and primary upstream references are in [compiler setup](scripts/document-build/README.md). Acceptance manuscript text, bibliography fixture and source plot are marked as software test material, not third-party scientific publications.
