# RAG-4i Benchmark Expansion Plan (2026-10-04)

References only. BenchRAG is NOT integrated, rag-bench is a catalogue, not a
dependency. Production architecture, retrieval, prompts, models, and gates
stay untouched. No run below may be labeled an official benchmark result —
all external-dataset work is ADAPTED / INTERNAL by construction.

## What our architecture can honestly measure

Single-pass deterministic RAG (dense 20 + lexical 20, RRF-60, k=8, rerank,
evidence gate → grounded generation or honest refusal). No decomposition,
no fan-out, no planner (D11 — measured zero delta, deliberately absent).
Consequence: multi-hop TRAVERSAL benchmarks cannot pass through our
pipeline; multi-CHUNK synthesis already is (frozen sets retrieve 8 chunks,
key-fact recall spans chunks). Claim-level entailment has no harness
(standing gap) — verdict-space alignment is the honest substitute.

## Selected (minimal, high-value)

### S1. SciFact-adapted claim verification (BEIR scifact, 30 claims)
- Capability: retrieval relevance + fact-verification verdicts.
- Why: verdict space maps 1:1 onto our gate (SUPPORT→SUPPORTED,
  CONTRADICT→CONFLICTING, NOINFO→INSUFFICIENT-or-honest-PARTIAL) — the
  highest architectural fit of any external family.
- Size: 30 claims (dev sample), ~30 abstracts as chunks.
- Executable: YES via existing benchmark path (benchmark-ingest →
  benchmark-retrieval → benchmark-answer; isolated tables, manager-only,
  gated). No new framework.
- Metrics: Hit@1/Recall@3/5/8, MRR, nDCG@8 (vs gold abstract ids) +
  verdict accuracy + honest-abstention rate on NOINFO.
- Cost (pre-reported): ~2 ingest calls (~8K embed tokens) + 30 retrieval
  (30 embed + 30 rerank ≈ 150K Jina tokens) + 30 generations (~210K Mantle
  tokens). ≈ 1 gold run. Bounded, single batch.
- Contamination control: external chunks live in prod `chunks` only inside
  the ingest→evaluate→delete window (off-hours); cleanup = delete document
  + `DELETE benchmark_embeddings WHERE run_id`; verify by counts + zero
  `ext-scifact-*` rows after. Window disclosed in the report.

### S2. FEVER-inspired internal claim set (15 claims, frozen corpus)
- Capability: support / refute / no-information handling on OUR documents.
- Why: verdict-space coverage with zero corpus risk; isolates gate +
  grounding from retrieval (caller-supplied gold evidence via
  benchmark-answer: no retrieval spend, no persistence, no conversations).
- Size: 15 hand-built claims (5 SUPPORTED / 5 CONTRADICTED / 5 NOINFO-style)
  over incometax + SEBI content with known-correct verdicts.
- Executable: YES NOW. Adapter = one local JSON file, no code.
- Metrics: verdict accuracy (strict + abstention-quality views), honest
  non-answer rate, fabricated-citation count (must be 0).
- Cost (pre-reported): 15 generations (~100K Mantle tokens), zero retrieval,
  zero persistence. No cleanup needed (benchmark-answer never persists).

## Rejected (with reasons)

- HotpotQA / 2WikiMultihopQA: require multi-hop traversal our pipeline
  deliberately lacks (D11); a first-hop-only subset would masquerade as
  multi-hop evidence — refused on honesty grounds. Corpus scale (100K+
  pairs, Wikipedia dump) is disproportionate. Multi-chunk synthesis already
  covered internally.
- ELI5 / ASQA: long-form generation at scale + citation metrics
  (sentence-level claim→source) need the missing claim harness; ROUGE /
  disambig-F1 mismatch our extractive [Sn] model. Revisit when claim-level
  judging exists.
- FEVER-full (185K): scale; SciFact covers the same verdict space at ~1%.
- TruthfulQA: no-retrieval parametric test; does not isolate RAG grounding.
- StrategyQA: requires decomposition (D11 conflict).
- NQ / TriviaQA / SQuAD / PopQA: span-EM over Wikipedia; PopQA deferred as
  the next candidate (long-tail single-hop EM) pending S1/S2 results.

## Metrics (only where native mapping is clean)

Retrieval: Hit@1, Recall@3/5/8 (=10 capped at 8, stated), MRR, nDCG@8,
Precision@K. Answer: verdict accuracy (strict + abstention views); NO EM/
F1/ROUGE (span/long-form mismatch — recorded, not manufactured). Grounding:
citation correctness (guard pass), fabricated-source count. Refusal: honest
non-answer rate on NOINFO. Claim-level entailment/completeness: still
BLOCKED (no harness).

## Execution order

1. This plan (no spend). 2. S2 internal claims (tiny spend, zero risk).
3. S1 SciFact-adapted (bounded spend, contamination window + verified
cleanup). 4. Scorecard + reports. PopQA-tiny only if S1/S2 leave open
questions.

## Execution record (2026-10-04)

S1 executed as planned (30/20, run `s1-scifact-01`): ingest 2 reqs / 8,006
tokens measured; 30 retrieval + 30 generations; full cleanup verified
(docs 11, chunks 899, benchmark rows 500, zero residue). S2 executed
(15 claims, existing pops, zero persistence). Actual ≈137 provider calls,
≈370K tokens est. — inside estimate. PopQA-tiny remains deferred. No
production code, prompts, models, or limits touched; nothing committed.

## Enterprise value

First external-corpus retrieval evidence + first verdict-space alignment
proof, at ~1.5 gold runs of spend, with zero production residue. Turns two
standing gaps (external validity; NOINFO handling beyond our own F-cases)
into measured numbers without touching the product.
