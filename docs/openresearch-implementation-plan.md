# OpenResearch skills and connectors implementation plan

Goal: deliver equivalent, independently testable adapters on the fixed and experimental baselines; do not merge their independent evidence-retrieval differences.
Source baseline: alphaXiv/OpenResearch@3037f727e80e0ab20c61a87c613a50dde009a835 (MIT). No ORX runtime, credentials, telemetry or executable extensions.

1. Read upstream skills / provider code and record blob identities and license. Preserve original ZIPs and separate working directories.
2. Add a hash-verified, role-filtered skill registry with explicit unsupported boundaries; root guidance in every Pi turn, on-demand skill reads, CLI and HTTP discovery. Never scan imported .pi / AGENTS / project skill folders.
3. Add independent literature connectors: alphaXiv keyword/embedding and extracted text, OpenAlex metadata/abstract, bioRxiv source-filtered search/native abstract, PubMed ESearch/EFetch; retain Crossref. Explicit source settings, fixed hosts, strict IDs, request caps, post-fetch authorization, typed content levels, immutable originals, bounded XML parser. Do not copy hosted-account/compute API clients.
4. Add capability routes for existing Runner and unsupported remote / Overleaf / publishing operations; do not expose fake success adapters. Preserve approvals and disabled-source policy on legacy paths.
5. Add a focused workbench skills/connectors view and CLI. Do not redesign unrelated pages.
6. Test RED then GREEN: catalog integrity / role / traversal; protocol parsers / date / rankings; disabled sources / ownership / revocation / budgets / payload bounds; IPC prompt injection; HTTP / component checks; all original tests.
7. Port only common additions to enhanced baseline, retain its original retrieval module untouched except necessary build version stamps. Build both, independently unzip and test; publish two ZIPs, patches, mapping and limitations.

Review focus: no credential or arbitrary URL in a tool; no silent source substitution; reports/snippets are not full text; no untrusted skill auto-loading; no regression in lifecycle/acceptance/replay fencing.
Ruling: direct external service validation unavailable when container DNS fails. Deterministic transport fixtures are labelled, not claimed live. Real Pi and remote backend acceptance remain separate.
