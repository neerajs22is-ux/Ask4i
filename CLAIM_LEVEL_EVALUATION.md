# Claim-Level Evaluation (2026-10-04)

## 1. Why claim-level evaluation exists

Answer-level scores (citations-ok, gate verdicts) can hide single
unsupported sentences inside otherwise good answers. Claim-level judging
asks, per factual claim: does the evidence RAG-4i supplied for THIS answer
entail THIS claim? It is the finest-grained honesty probe in the benchmark
package, and the prerequisite for any future citation-completeness work.

## 2. Claim definition

One declarative sentence from the generated answer (deterministic split on
`.?!`), with `[Sn]` citation markers attributed positionally. 30 answers →
106 claims (S1 52, S2 25, frozen 29).

## 3. Label definitions

- SUPPORTED: supplied evidence entails the claim.
- REFUTED: supplied evidence contradicts the claim.
- UNSUPPORTED: factual/checkable, but supplied evidence does not support it.
- NOT_CHECKABLE: opinion, filler, guidance, or clarification questions.
- Real-world truth is NOT sufficient; support by supplied evidence decides.

## 4. Gold-set methodology

Human annotation: every claim read against its evidence array, with
full chunk texts consulted for load-bearing specifics (numbers, quotes,
577-case counts, bleomycin/metformin, dearness/14%). Verdicts: 95
SUPPORTED, 10 NOT_CHECKABLE, 1 UNSUPPORTED (G2 effective-date leak),
0 REFUTED. Absence claims record whole-set scans. No REFUTED instance
exists because the system never affirmed a falsehood in these 30 answers
— a finding about the sample, stated plainly.

## 5. Evaluator methodology

Frozen deterministic scorer (`claim_eval.py`, SCORER_RULES in README):
term-recall ≥ 0.6, token-matched significant numbers, anchored-conflict
REFUTED, whole-set absence verification, meta-correction exclusion.
Zero provider calls. One principled fix round after first measurement
(meta-negation exclusion, guidance-cap removal, token number matching);
no threshold tuning against gold.

## 6. Evidence boundary

Supplied evidence arrays only (fused-order, as served). Corpus-wide
rescue forbidden.

## 7. Metrics and formulas

RAG-4i (human gold, n=106 claims / 30 answers):
claim count 106 · supported 95 · refuted 0 · unsupported 1 ·
not-checkable 10 · support rate 95/106 = 0.896 · contradiction rate
0/106 = 0 · unsupported rate 1/106 = 0.009 · checkable coverage
96/106 = 0.906 · evidence-supported answer rate 29/30 = 0.967 (answers
with no REFUTED/UNSUPPORTED claim).
Citation-aware: claims with citation 51/106 = 0.481 · supporting cited
evidence 49 · citation-supported claim rate 49/51 = 0.961 · unsupported
cited-claim rate 0/51 = 0.000.

Evaluator agreement (scorer vs gold): accuracy 57/106 = 0.538 ·
SUPPORTED P 0.981 / R 0.547 / F1 0.703 · NOT_CHECKABLE P 0.833 / R 0.500 /
F1 0.625 · UNSUPPORTED F1 0.0 (n=1, predicted SUPPORTED) · macro-F1 over
computable classes 0.443 · REFUTED P/R/F1 not computable (n=0).

## 8. Evaluator accuracy (reading)

High precision, weak recall: when the scorer says SUPPORTED it is right
98% of the time, but paraphrase-heavy claims fall below the 0.6 recall
floor (36 misses), 6 residual negation false-REFUTED, 5 guidance misses.
The scorer is a conservative detector, not a grader — fit for flagging
candidate-unsupported claims for human review, unfit for autonomous
scoring.

## 9. RAG-4i claim-level results

95/106 supported, 0 refuted, 1 unsupported (parametric date leak in G2 —
the single most valuable find: answer-level metrics scored that answer
fine), 10 fillers correctly non-factual. Citation discipline: 96% of
cited claims are supported by what they cite; zero cited falsehoods.

## 10. Known limitations

- REFUTED detector sensitivity unproven (n=0 in gold by luck of a clean
  sample, not by design coverage).
- Extractor misses multi-marker patterns (`[S1, S2]`, ranges) — 1 claim
  affected (G2c2).
- Absence convention (empty supporting_source_ids) complicates
  citation-completeness accounting.
- 30 answers are NOT representative of production traffic (stated, not
  generalized).
- LLM judge intentionally not built (no local key; negative prior at
  small scale); costed as future work (~$0 for deterministic v1 as built).

## 11. Reproducibility

`python eval/claim-level` equivalents: extractor + scorer are pure stdlib
(`claim_eval.py`); rerun via the scoring script pattern (predictions +
metrics regenerate byte-identically); gold is frozen (`gold.json`);
thresholds frozen in README. No credentials, no network, no spend.

## 12. Adversarial hardening round (2026-10-04)

- Evaluator v2 (same file, additive rules, thresholds 0.6/0.7 intact):
  multi-marker + range attribution, number-words/dates/percent/acronym
  normalization, symmetric morphological closure, slot-aware numeric
  contradiction with numbers-first ordering, multi-chunk union support,
  single-digit exclusion, interrogative rule, absence subject filtering.
  Each rule has positive + negative regression tests (36 tests green).
- Frozen-106 with v2: accuracy 0.660 (v1 0.538), SUPPORTED F1 0.788
  (P 0.969), NOT_CHECKABLE F1 0.778, macro 0.522. One reverted change
  documented: unanchored-negation downgrade (net −17 on frozen for +2
  adversarial — evidence decides, reverted).
- Adversarial set (`adversarial.json`, 43 cases / 18 failure-mode
  categories, human-authored over frozen evidence, self-contained):
  accuracy 0.651, macro 0.630; SUPPORTED F1 0.696; REFUTED P 1.000 /
  R 0.385 / F1 0.556 (13 gold instances — first measurable REFUTED
  signal, precision-perfect by design); UNSUPPORTED F1 0.636.
- Failure analysis: 15 misses, every one mapped — colloquial paraphrase,
  antonym/stance without numbers, scope/supersession, cross-slot
  confusion, stated-vs-implied, sparse acronym overlap, hedged
  concessives. All require semantic judgment; all named, none faked.
  The path from v1 (0.466) ran through one caught void run (empty
  evidence arrays from a builder bug — now guarded by assertion) and
  two evidence-backed reversions.
- What v2 proves: deterministic judging can be a high-precision
  contradiction flagger (zero false REFUTED alarms on 149 claims) and a
  recall aid, but not an autonomous grader. The enumerate-and-name
  discipline above is the deliverable as much as the numbers.
