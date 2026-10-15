# Enhanced branch execution record
Base: v0.2.2-fixed (separate frozen source/archive).
Task 4 complete: optional local evidence service, API, Pi tool, UI, paired evaluation script and explicit attribution. Full suite 221/221 and typecheck passed.
Ruling: Port only a narrow Apache-2.0 PaperQA MMR selection loop; do not install a second Agent/LLM pipeline. Cost: no semantic search/PDF/summary answer pipeline, but no hidden calls.
Ruling: Initially tried MMR0.65; fixture showed no benefit alone. Exact duplicate grouping supplies the coverage gain. Default mmrLambda=1; MMR remains optional. Cost: no claim of an optimal relevance/diversity policy; synonym recall remains limited.
Ruling: Original user-imported text only. Derived model/task/run sources are refused instead of being relabeled as original papers. Cost: derived-evidence retrieval needs a separately designed provenance-aware mode.
Final self-review: found BOM decoding shifted offsets; regression failed, preserved BOM, full suite green. No independent reviewer available. Browser test was attempted once; managed navigation blocked, no bypass or fake screenshot.
Deferred: vector embeddings, PDF page parsing, true Pi/provider and Docker validation, large corpus indexing, modern React migration, scientific model evaluation. These are not represented as supported.
