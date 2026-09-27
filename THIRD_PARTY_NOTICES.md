# Third-party notices

## Offline React browser bundles

- `apps/web/public/vendor/react.production.min.js` — React 16.0.0.
- `apps/web/public/vendor/react-dom.production.min.js` — ReactDOM 16.0.1.
- Copies also appear under `dist/web/vendor/`.
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

No OpenResearch runtime code, database, CLI, service or skills are bundled.
The original project design names OpenResearch as a functional reference;
that is not a claim of endorsement, behavioral parity or completed cloning.

## OpenResearch skills and literature protocol adaptation
Copyright (c) 2026 alphaXiv. MIT; full text in `third_party/openresearch/LICENSE`. Based on commit 3037f727e80e0ab20c61a87c613a50dde009a835. `skills/openresearch` rewrites all 13 canonical modules plus the overview for Pi Research tools and safety boundaries. `packages/connectors` ports selected literature protocol behavior from Rust `src/client.rs` to TypeScript and adds independent validation, cancellation, settings and bounded requests. No ORX runtime, hosted account, telemetry, or remote compute implementation is included. Source inventory and intentional differences are in `third_party/openresearch/source-manifest.json`.
