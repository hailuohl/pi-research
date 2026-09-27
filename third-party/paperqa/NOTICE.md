# PaperQA attribution and modification notice

Upstream: Future-House/paper-qa
Commit: 57e89f7223b0960d5ee5ea048c69e3c47e088572
File: src/paperqa/llms.py
Function: VectorStore.max_marginal_relevance_search (selection portion, lines 133–157 in retrieved source)
Source: https://github.com/Future-House/paper-qa/blob/57e89f7223b0960d5ee5ea048c69e3c47e088572/src/paperqa/llms.py
License: Apache-2.0. Copyright 2024 FutureHouse.

`packages/text-evidence/mmr.ts` is a narrow TypeScript adaptation of that selection flow, with sparse normalized local vectors, explicit argument validation, bounded candidates and deterministic tie handling. NumPy, the PaperQA vector store, Agent, embeddings, summary/answer LLM, provider client, parsing and document loading are NOT bundled or invoked.

The supplied LICENSE contains the Apache License 2.0 text with the upstream copyright attribution. The web tool retrieved the upstream license; raw container download failed, so the standard locally available license text was used with its appendix attribution updated to match upstream. This is not represented as a byte-identical download of the repository LICENSE. The upstream root NOTICE path returned 404 during this check.

The surrounding lexical tokenizer, chunking, corpus authorization, literal evidence persistence, UI and tests are Pi Research code. The evaluation harness borrows the general environment/reset/action/observation evaluation pattern described by Aviary; no Aviary or LDP code is included.

No FutureHouse endorsement is claimed. No scientific benchmark result from PaperQA or Aviary transfers to this implementation.
