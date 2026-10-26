# Ask4i — Enterprise Benchmark Scorecard (2026-10-04)

For SME / client / technical reviewers. Every value measured — see
`BENCHMARK_REPORT.md` for method and `BENCHMARK_PER_CASE.json` (166 rows)
for per-case evidence. Nothing here was estimated.

## Grounding / hallucination (30 curated answers, 106 human-annotated claims)

| Metric | Result | Sample | Status | Evidence |
|---|---|---|---|---|
| checkable claims supported | 0.990 (95/96) | 106 claims | ADAPTED / INTERNAL | `eval/claim-level/gold.json` |
| contradiction rate | 0.000 (0/106) | 106 claims | ADAPTED / INTERNAL | unmeasured class, not proven zero |
| answers fully supported | 0.900 (27/30) | 30 answers | ADAPTED / INTERNAL | run artifact §11 |
| refusal precision / recall | 1.000 / 1.000 (7/7) | 7 NOINFO | ADAPTED / INTERNAL | tiny denominator, stated |
| false answers on NOINFO | 0.000 | 7 NOINFO | ADAPTED / INTERNAL | — |
| citation positions entailing | 0.975 (79/81) | cited subset | ADAPTED / INTERNAL | gold citation mapping |
| checkable claims cited | 0.531 (51/96) | 96 checkable | ADAPTED / INTERNAL | headline restatements uncited |

Full record: `GROUNDING_HALLUCINATION_EVALUATION.md`, run artifact
`eval/runs/grounding-hallucination-20261004.json`. Not traffic-
representative; contradiction handling unmeasured by construction.

## Retrieval (frozen 66-question suites, answerable n=30 each)

| Metric | Current | Previous | Delta | Status |
|---|---|---|---|---|
| Hit@1, general set | 0.833 | 0.900 | −0.067 | PROVEN LOCALLY |
| Recall@8, general set | 0.606 | 0.658 | −0.052 | PROVEN LOCALLY |
| nDCG@8, general set | 0.650 | 0.697 | −0.047 | PROVEN LOCALLY |
| MRR, general set | 0.894 | 0.944 | −0.050 | PROVEN LOCALLY |
| Hit@1, regulation set | 0.933 | 0.933 | 0.000 | PROVEN LOCALLY |
| Recall@8, regulation set | 0.967 | 0.967 | 0.000 | PROVEN LOCALLY |

Deltas trace to corpus growth (563→899 chunks) and prompt v1→v2, not to
retrieval changes (configuration locked: 20/20/50/RRF-60/k8). Recall@10 =
Recall@8 (evidence capped at 8 — stated, not filled in).

## Grounding / hallucination

| Metric | Current | Status |
|---|---|---|
| Answers served (HTTP 200) | 34/34 | PROVEN LIVE (prior gate run) |
| Citations correct | 28/34 (0.824) | PROVEN LOCALLY |
| Fabricated sources observed | 0 | PROVEN LOCALLY |
| Honest refusals (unanswerable) | 4/4, zero invented facts | PROVEN LOCALLY |
| Claim-level hallucination rate | — | BLOCKED (no atomic-claim harness) |

## Citation quality

| Metric | Current | Status |
|---|---|---|
| Citation-guard hard failures | 0 | PROVEN LOCALLY |
| Citation completeness (per-claim) | — | BLOCKED (same harness gap) |

## Security

| Metric | Current | Status |
|---|---|---|
| Shared test suite | 315/315 pass | PROVEN LOCALLY |
| Secret values in code | 0 found | PROVEN LOCALLY |
| Prompt-injection isolation (v2 delimiters) | present + test-pinned | PROVEN LOCALLY |
| Benchmark endpoints manager-only | all 3 enforced in code | PROVEN LOCALLY |
| Live attack battery / cross-tenant proof | — | BLOCKED (needs 2nd tenant/identity) |

## Cost / abuse

| Metric | Current | Status |
|---|---|---|
| Cost-control tests | 18/18 pass (in the 315) | PROVEN LOCALLY |
| Kill switch drill | 503, zero records; OFF re-verified | PROVEN LIVE (prior gate) |
| User-minute 429s | observed with Retry-After | PROVEN LIVE (prior gate) |
| Concurrency bound (~2 proceed, rest busy) | observed, 0 stuck | PROVEN LIVE (prior gate) |
| Denied requests reach providers | 0 (per accounting) | PROVEN LIVE (prior gate) |

## Reliability

| Metric | Current | Status |
|---|---|---|
| End-to-end success, current run | 34/34 HTTP 200 | PROVEN LIVE (prior gate run) |
| Median search / writing time | ~2.1 s / ~2.3 s (frozen runs) | PROVEN LOCALLY |
| Known limit | gate/label gaps are conservative-PARTIAL artifacts, not failures | documented |

## What this does and does not prove

Proves: retrieval ranking on two frozen corpora, honest refusal behavior,
zero observed fabrication, deterministic safety gates, bounded spend
controls, reproducible artifacts. Does not prove: claim-level
hallucination rates, resilience to live adversarial attack, behavior on
your documents (a scoped pilot on client corpus is the honest next step).

## External alignment (2026-10-04, ADAPTED / INTERNAL — not official results)

| Benchmark | Capability | Dataset | Metric | Result | Status | Cost |
|---|---|---|---|---|---|---|
| SciFact-adapted | retrieval + verdicts | 30 claims / 20 abstracts (BEIR scifact) | Hit@1 / R@8 / MRR | 0.95 / 0.95 / 0.95 | ADAPTED / INTERNAL | ~1 gold run |
| SciFact-adapted | contradiction handling | 10 refuted claims | refuted or honestly abstained | 10/10, 0 affirmed falsehoods | ADAPTED / INTERNAL | incl. above |
| SciFact-adapted | abstention | 10 NOINFO claims | honest non-answers, 0 false claims | 10/10 | ADAPTED / INTERNAL | incl. above |
| Internal claim set | verdicts on own corpus | 15 claims (incometax/SEBI) | safe outcomes | 15/15, 0 fabricated | ADAPTED / INTERNAL | ~0.5 gold run |
| Internal claim set | retrieval | 10 gold-scoped | Hit@1 | 10/10 | ADAPTED / INTERNAL | incl. above |

Current vs previous vs external: frozen RAG-4i numbers preserved above;
external rows are not comparable to published leaderboard scores (adapted
corpus scale, our pipeline, our verdict mapping) and are never presented
as such.

## Claim-level grounding (2026-10-04; now measured — harness + human gold)

| Metric | Result | Sample | Status | Evidence |
|---|---|---|---|---|
| claims evaluated | 106 over 30 answers | S1+S2+frozen | ADAPTED / INTERNAL | `eval/claim-level/gold.json` |
| supported % | 89.6% (95) | 106 claims | ADAPTED / INTERNAL | human gold |
| refuted % | 0.0% (0) | 106 claims | ADAPTED / INTERNAL | human gold |
| unsupported % | 0.9% (1, parametric date leak) | 106 claims | ADAPTED / INTERNAL | human gold |
| not-checkable % | 9.4% (10 fillers/clarifications) | 106 claims | ADAPTED / INTERNAL | human gold |
| citation-supported claim rate | 96.1% (49/51 cited) | cited subset | ADAPTED / INTERNAL | human gold |
| evaluator macro-F1 | 0.443 (computable classes) | 106 claims | ADAPTED / INTERNAL | `eval/claim-level/metrics.json` |
| evaluator accuracy | 0.538 (SUPPORTED F1 0.703 @ P 0.981) | 106 claims | ADAPTED / INTERNAL | scorer vs gold (v1 baseline, preserved) |
| evaluator accuracy (v2 hardened) | 0.660 frozen / 0.651 adversarial-43 | 149 claims | ADAPTED / INTERNAL | `eval/claim-level/metrics*.json` |
| REFUTED detector | P 1.000 / R 0.385 (13 gold instances) | adversarial | ADAPTED / INTERNAL | zero false contradiction alarms |
| adversarial misses | 15, each mapped to a judge-requiring capability | 43 claims | ADAPTED / INTERNAL | failure analysis in phase report |
| REFUTED detector sensitivity | — | n=0 in gold | BLOCKED (no instances) | stated, not estimated |

Not representative of production traffic (30 curated answers). The
evaluator is a conservative flagger (98% precise when it says SUPPORTED,
54% recall); autonomous scoring would be misuse.
