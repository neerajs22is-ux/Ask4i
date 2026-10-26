# Grounding / Hallucination Evaluation (2026-10-04)

## 1. Executive summary

30 frozen answers (106 human-annotated claims): 99.0% of checkable claims
supported, 0 contradictions, 1 parametric date leak (0.9%), refusals 7/7
correct with 0 confident false answers, citation positions 97.5% entailing.
The single leak (G2 effective-date) is a generation-side parametric
insertion the evidence neither states nor contradicts; retrieval delivered
the right chunks. No REFUTED claim exists in the sample — contradiction
behavior below is therefore unmeasured, not proven.

## 2. Dataset/population

30 gold answers from `eval/claim-level/gold.json` (S1 12, S2 8, frozen 10;
106 claims). Categories covered: grounded answers, mixed (G2),
correct refusals (7: E3, F1/F2, 4× S1-NOI), multi-source (G4, E1, CA08),
G2-leak, T23-style conflict report (CA12), multi-marker cites
(F2/F3/CAX/NOI-8), clarifications (D1/B1, reported separately).
Unavailable by construction (system never did these — marked, not
fabricated): explicit contradictions by the system, numeric/date
hallucinations beyond G2, confident wrong answers on insufficient
evidence, evidence overreach beyond G2.

## 3. Methodology

Human gold truth (annotator read every claim vs full chunk texts).
Deterministic v2 scorer used ONLY for its own agreement measurement, never
for RAG metrics. Refusal = NOINFO-question answer with zero
UNSUPPORTED/REFUTED claims; clarifications (all-NC + "?") excluded from
refusal P/R with rationale. Formulas in
`eval/runs/grounding-hallucination-20261004.json`.

## 4. Claim-level results

106 claims: 95 SUPPORTED, 0 REFUTED, 1 UNSUPPORTED, 10 NOT_CHECKABLE.
Support rate 0.896; support-given-checkable 0.990; contradiction 0;
unsupported 0.009; checkable coverage 0.906.

## 5. Answer-level results

Evidence-supported answers 27/30 (0.900); perfect-grounding 27/30;
any-hallucination 1/30 (G2); any-contradiction 0/30.

## 6. Refusal results

Should-refuse 7, refused-correctly 7, false answers 0, wrong refusals 0;
precision/recall/F1 1.0/1.0/1.0; false-answer rate on NOINFO 0.0.
Clarifications D1/B1 excluded (third behavior, not refusal failure).
n=7: strong signal on a tiny denominator — stated, not generalized.

## 7. Citation results

Precision (positions) 79/81 = 0.975; coverage (checkable claims with a
citation) 51/96 = 0.531; cited-claim support 49/51 = 0.961; unsupported
cited 0/51. Gaps: uncited headline restatements ("Yes, ...") and one
extractor-missed `[S1, S2]` pattern (G2c2, harness-side).

## 8. Failure taxonomy

Single failure G2c2: parametric knowledge leakage (date). Retrieval: not
at fault (correct chunks delivered). Citation selection: markers present
(extractor missed the comma pattern — harness gap, since fixed in
principle and tested). Generation: at fault (inserted unverifiable date).
Evaluator: v2 predicted SUPPORTED (over-acceptance miss, documented).

## 9. Retrieval-vs-generation attribution

Retrieval failures in sample: 0 (every answer's evidence contained what
honest use needed, including refusals where disjointness was the correct
finding). Generation failures: 1 (G2 date). Citation-selection notes:
F2/F3 cited-while-refusing (honest, metric edge only).

## 10. Comparison with previous baseline

Retrieval baseline (frozen, separate layer): Hit@1 0.833, R@8 0.606,
nDCG@8 0.650, MRR 0.894, citations-ok 0.824, fabricated 0, honest
refusals 4/4. Grounding baseline (this run): support/checkable 0.990,
contradiction 0, refusal F1 1.0. Layers kept separate; no combined score.

## 11. Per-case results

`eval/runs/grounding-hallucination-20261004.json` (`per_answer` map).

## 12. Limitations

n=30 answers from curated sets (not traffic); zero REFUTED instances
(contradiction handling unmeasured); refusal n=7; citation coverage
0.531 leaves half of checkable claims uncited (mostly headline
restatements); evaluator agreement 0.538 accuracy (flagger, not grader).

## 13. Enterprise interpretation

What is known: unsupported claims ≈1%, contradictions unobserved,
abstention correct 7/7, cited sources support what they cite 97.5%.
What remains unknown: contradiction rate under adversarial pressure,
refusal behavior at scale, claim quality on client corpora. No
"enterprise-grade" declaration is made here.

## 14. Reproducibility

Offline over frozen files (`gold.json`, `draft_claims.json`); generator
script pattern retained out-of-tree; no credentials, network, spend, or
production contact of any kind.
