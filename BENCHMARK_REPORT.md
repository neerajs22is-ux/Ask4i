# RAG-4i Enterprise Benchmark Package (2026-10-04)

Benchmark only. Nothing fixed, deployed, committed, or pushed. Zero new
production spend: every number below comes from frozen artifacts recomputed
locally, plus local test/static runs and standing live evidence from the
2026-10-04 deploy gate. Machine data: `BENCHMARK_RESULTS.json`,
`BENCHMARK_PER_CASE.json` (166 rows), `SECURITY_FINDINGS.json`;
client summary: `ENTERPRISE_BENCHMARK_SCORECARD.md`.

System under test: HEAD `430ad39`, prod ask 52 · qc 37 · ingest 38 ·
worker 37 · cleanup 6 · bench 5/3/3 · edit 3, Jina-small 1024 + reranker
v3.5, Mantle Qwen temp 0.0 / 1024 / prompts v2, checker OFF, retrieval
20/20/50/RRF-60/k8 locked.

## 1. Retrieval quality (frozen evidence, recomputed locally)

Answerable-only (n=30/set; refusal cases have empty expected sets by
design). Ranks from fused-order evidence arrays (verified sorted).
Recall@10 = Recall@8 (evidence capped at 8 — stated, not invented).
Genuine RAGBench V2 remains unavailable — this is the RAG-4i frozen
retrieval benchmark, labeled as such.

| Set | Hit@1 | R@3 | R@5 | R@8 | nDCG@8 | MRR* | P@8 |
|---|---|---|---|---|---|---|---|
| Current prod, 34-set | 0.833 | 0.553 | 0.575 | 0.606 | 0.650 | 0.894 | 0.213 |
| Prior 34 Jina-B (18-09) | 0.900 | 0.581 | 0.631 | 0.658 | 0.697 | 0.944 | 0.229 |
| Prior 34 Jina-A | 0.767 | 0.483 | 0.586 | 0.603 | 0.625 | 0.853 | — |
| Prior CA-32 Jina-B | 0.933 | 0.967 | 0.967 | 0.967 | 0.954 | 0.950 | 0.125 |
| Prior CA-32 Jina-A | 0.867 | 0.900 | 0.900 | 0.900 | 0.885 | 0.883 | — |

*MRR recomputed on answerable-only; artifact summaries use 34-case
denominators with refusal scoring — both honest, different conventions.
Current-vs-prior delta confounds corpus growth (563→899 chunks) + prompts
v1→v2 + generation variance; retrieval code is locked, so no config regressed.

## 2. Answer / grounding quality (current-prod 34-run)

34/34 HTTP 200. Citations-ok 28/34 (0.824), citation-guard hard-fails 0,
fabricated sources observed 0. Tripwire: grounded 10 · missing-qualifier 13
· numeric-mismatch 5 · unsupported-claims 3 · clarify/null 3. Gate:
SUPPORTED 9 · PARTIAL 18 · CONFLICTING 4. Refusals F1–F4: 4/4 honest
non-answers, zero fabricated claims (F2/F3 carry 2/4 cites while refusing —
metric edge, not fabrication). The 6 citations-ok=False: B1/B4/D1
clarification-routed 0-cites by design, E3 honest 0-cite non-answer, F2/F3
as above. Claim-level rates (hallucination/unsupported/contradiction/
grounded-claim/entailment/completeness) remain unavailable — no
atomic-claim harness exists; reported as missing, not estimated.

## 3. Security (local suite + static; live attacks BLOCKED)

315/315 shared Deno tests green. Secret-value scan repo-wide: 0 hits.
Committed source verified: v2 UNTRUSTED-DATA prompts (3 modes + test pin),
manager-only on all 3 benchmark fns, 64KB early-reject on all 8 entries,
cost-control wiring (kill/gate/slots/usage). Live injection, cross-tenant,
member-deny-as-non-manager, traversal/enumeration probes: BLOCKED (need
2nd tenant/identity or malicious-corpus window — prerequisites recorded,
nothing faked).

## 4. Cost/abuse regression (no new probes)

315/315 green incl. 18 cost-control tests. Standing 2026-10-04 live
evidence reused (kill 503/zero-records, user-minute 429s, slots busy-503
with 0 stuck, stale reap, member-write 403s, manager-allow 200, exact
accounting). Kill secret present (hashes-only list), code path unchanged
since proof. Denied/busy requests provably never reach providers.

## External Benchmark Alignment (2026-10-04; plan: BENCHMARK_EXPANSION_PLAN.md)

Neither run below is an official benchmark result. Both are ADAPTED /
INTERNAL: external questions executed through the unchanged RAG-4i
benchmark path (benchmark-ingest/retrieval/answer, isolated tables,
manager-only, gated). Production architecture, retrieval, prompts, models,
and gates untouched.

### S1. SciFact-adapted claim verification (30 claims, 20-abstract corpus)

BEIR scifact test split (public 2.8MB zip). 10 SUPPORT (BEIR-qrel pairs I
attested as entailing) + 10 CONTRADICTED (9 natural BEIR refutations + 1
authored negation) + 10 NOINFO (gold abstracts deliberately excluded).
Corpus ingested as one temp document (NULL embeddings — dense skips NULLs),
embedded to isolated run `s1-scifact-01`, then fully deleted with the
document (counts restored 11/899/500, zero residue).

- Retrieval (gold-scoped 20): Hit@1 0.95, Recall@8 0.95, MRR 0.95,
  nDCG@8 0.95. Sole miss: T6, whose gold abstract does not entail its own
  claim (BEIR relevance is topical, not support — recorded, not hidden).
- Verdicts, strict label view: SUPPORTED 3/10, CONFLICTING 0/10,
  INSUFFICIENT 0/10 — the token-literal gate under-labels biomedical prose
  (same conservative family as frozen sets; T23 even gated SUPPORTED while
  correctly disputing — gate/content divergence, content right).
- Verdicts, behavioral view (disclosed human read of all 30 answers):
  10/10 support correct, 9/10 contradictions refuted with citations,
  1 honest abstention (T6), 10/10 NOINFO honest abstentions with zero false
  claims. Affirmed falsehoods 0. Fabricated sources 0.
- Cost: 2 ingest reqs (8,006 Jina tokens measured) + 30 retrieval + 30
  generations (≈370K tokens est. total, ≈1 gold run).

### S2. FEVER-inspired internal claim verification (15 claims, frozen corpus)

5 SUPPORTED + 5 authored CONTRADICTED + 5 NOINFO over incometax/SEBI via
existing populations (no ingest, no persistence, no conversations).

- Retrieval (gold-scoped 10): Hit@1 10/10.
- Strict: SUPPORTED 2/5, CONFLICTING 1/5, INSUFFICIENT 0/5. Behavioral:
  15/15 safe (5 correct, 4 corrected + 1 honest conflict, 5 abstentions).
  Affirmed falsehoods 0. Fabricated sources 0.
- Cost: 15 retrieval + 15 generations (≈170K tokens est.).

### Rejected (reasons in plan)
HotpotQA/2Wiki (D11 traversal conflict + scale; first-hop-only would
masquerade), ELI5/ASQA (generation scale + citation metrics need the
missing claim harness), FEVER-full (scale; SciFact covers the verdict
space), TruthfulQA (parametric, not RAG), StrategyQA (decomposition),
NQ/TriviaQA/SQuAD (deferred), PopQA-tiny (deferred next candidate).

## Claim-level grounding (2026-10-04; full record: CLAIM_LEVEL_EVALUATION.md)
Isolated harness (`eval/claim-level/`), deterministic, zero provider calls.
106 manually annotated claims over 30 answers (S1 52, S2 25, frozen 29):
95 SUPPORTED, 0 REFUTED, 1 UNSUPPORTED, 10 NOT_CHECKABLE. Support rate
0.896; contradiction rate 0; unsupported rate 0.009; checkable coverage
0.906; evidence-supported answers 29/30 (0.967). Cited claims 51/106;
citation-supported 49/51 (0.961); unsupported cited 0/51. The single
UNSUPPORTED is a parametric date leak (G2) that answer-level metrics
scored fine — the find that justifies this layer. Automated scorer
agreement: accuracy 0.538, macro-F1 0.443, SUPPORTED F1 0.703 at P 0.981;
REFUTED metrics not computable (n=0). Conservative detector, fit for
flagging candidates for human review only.

### Grounding run (same day; `eval/runs/grounding-hallucination-20261004.json`)

Human-gold metrics over the 30 answers (scorer never feeds RAG numbers):
support/checkable 0.990, contradiction 0, evidence-supported answers
27/30, refusal P/R/F1 1.0/1.0/1.0 with 0 false NOINFO answers (n=7,
clarifications excluded), citation positions 79/81 entailing, coverage
51/96 cited. Single failure G2c2 (parametric date; retrieval correct,
generation at fault; v2 scorer misses it — documented). Zero REFUTED
instances: contradiction handling unmeasured, explicitly not claimed.
Full record: `GROUNDING_HALLUCINATION_EVALUATION.md`.

### Adversarial hardening round (same day; `eval/claim-level/adversarial.json`)

43 human-authored claims across 18 failure-mode categories over frozen
evidence (self-contained, zero production contact). Hardened evaluator v2
(additive deterministic rules, thresholds intact, 36 regression tests
green): frozen-106 accuracy 0.538→0.660, SUPPORTED F1 0.703→0.788;
adversarial accuracy 0.651, macro 0.630; REFUTED P 1.000 / R 0.385 /
F1 0.556 (13 gold instances — first measurable REFUTED signal, zero false
contradiction alarms on 149 claims); UNSUPPORTED F1 0.636. 15 misses, each
mapped to a judge-requiring capability (antonym/stance, scope,
cross-slot, stated-vs-implied, colloquial paraphrase, hedged synthesis)
— named, never faked. One void run caught en route (empty evidence
arrays from a builder bug; now assertion-guarded). Frozen gold labels
untouched (zero edits; no mislabeled case found).

## Provenance

Every retrieval number recomputed 2026-10-04 from committed files
(`eval/runs/benchmark-jina-34case-01.json`,
`benchmark-jina-ca-32case-01.json`, `baseline-20261004T2913Z.json` +
`eval/mappings/chunk_map_3c4.json`, `chunk_map_ca.json`). No live calls,
no conversations created, no data mutated, nothing committed.
