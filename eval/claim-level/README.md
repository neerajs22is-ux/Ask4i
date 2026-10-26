# Claim-level evaluation harness (local-only)

Deterministic, zero-provider-call harness that judges whether individual
factual claims in RAG-4i answers are supported by the evidence RAG-4i
actually supplied for that answer. Evaluation capability only — not a
production feature; production is untouched.

## Files

- `claim_eval.py` — extractor + frozen deterministic scorer (stdlib only).
- `schema.json` — gold/prediction artifact contract.
- `gold.json` — 106 manually annotated claims over 30 answers (human read
  every claim against its evidence 2026-10-04; see Reasoning below).
- `predictions.json` — scorer output over the gold set.
- `metrics.json` — evaluator-agreement metrics + formulas.
- `draft_claims.json` — working file (answers + evidence + extracted
  claims); the annotator's input, kept for reproducibility.

## SCORER_RULES (frozen v1; v2 hardening additive, 2026-10-04)

v1 base: sentence split with `[Sn]` attribution; filler/guidance →
NOT_CHECKABLE; absence claims verified by whole-set scan; term-recall ≥
0.6 for SUPPORTED; significant numbers must match; anchored-conflict
REFUTED; meta-correction exclusion.

v2 hardening (each rule mechanical, tested, with stated limits):
1. Multi-marker attribution: `[Sn]`, `[Sn, Sm]`, `[Sn][Sm]`, and ranges
   `[Sn] through/to/- [Sm]` (inclusive, order-normalized). Justification:
   real answers cite ranges; losing them corrupts citation metrics.
   Limit: malformed markers (`[S]`, `[SX]`) still unattributed.
2. Number words → digits ("fifteen"→15, "twenty five"→25, "one
   hundred"→100, half/quarter→0.5/0.25). Justification: biomedical/legal
   prose spells quantities; without this, "fifteen percent" vs "15%"
   never matches. Limit: compounds beyond tens+units and hundred/
   thousand/million/billion multipliers unhandled (documented residual).
3. Dates → ISO under the D/M/Y corpus convention ("1st April, 2026",
   "April 1, 2026", "1-4-2026" → "2026-04-01"); "%"→"percent".
   Justification: the corpus mixes all three date shapes for the same
   events. Limit: US M/D/Y ambiguity accepted and documented.
4. Acronym aliases: `Phrase (ACR)` definitions, bare ALLCAPS tokens, and
   Title-Case-phrase initialisms all emit `abbr:acr`. Justification:
   regulatory text rarely repeats definitions; without initialisms a bare
   "AIF" never matches "Alternative Investment Fund". Limit: undefined
   acronyms match only each other; cross-chunk acronym resolution without
   expansion needs a judge (ADV-35).
5. Closed morphological closure, applied SYMMETRICALLY both sides:
   s/es(+e-form)/ies/tion/sion→t/trailing-e/ed/ing strips (length-guarded),
   pairwise intersection. es→{base, base+e} fixed cases/case. Justification:
   associate/associated/association gaps without any model. Limit:
   irregular verbs (came/come), comparatives (lower/less), and deeper
   derivation need a lemmatizer (ADV-04 class).
6. Slot-aware numeric contradiction + numbers-first ordering: claims
   carrying significant numbers are decided by them before the recall
   floor (tripwire philosophy); alternatives compare within
   year/date/percent/amount/quantity slots. Single digits are discourse
   counters, excluded from both duties (ADV-43 false alarm).
   Justification: a year is not an alternative to a quantity; wrong
   dates must not hide behind shared vocabulary (ADV-18/26).
7. Multi-chunk union recall for SUPPORTED (legitimate S1+S2 composition;
   caught ADV-30/32); REFUTED stays single-chunk anchored. Cost: some
   over-acceptance on truisms (ADV-24/25/36) — documented, judge-bound.
8. Interrogatives (`?`-final) → NOT_CHECKABLE. Justification: questions
   assert nothing (D1/B1 clarification prompts).
9. Absence matching uses variant closure; subject terms exclude discourse
   verbs (mention/contain/state); subject-less absence → NOT_CHECKABLE.

Deliberately NOT implemented (require semantic/model judgment, each with
adversarial witnesses): antonym + stance refutations without numbers
(ADV-11/12/19/20), scope/supersession scoping (ADV-15/16/31),
cross-slot confusion (ADV-34), stated-vs-implied relations
(ADV-24/25/36), colloquial paraphrase (ADV-04), hedged concessive
synthesis (ADV-42/43). Named here, never heuristically faked.

1. Sentence split on `.?!`; `[Sn]`, `[Sn, Sm]`, `[Sn][Sm]`, and
   `[Sn] through/to/- [Sm]` ranges stripped but attributed (positional
   over the evidence array, 1-based). Malformed markers (`[S]`, `[SX]`)
   remain unattributed (tested).
2. Empty / filler / guidance-only sentences → NOT_CHECKABLE.
3. Absence claims ("evidence does not contain X") are checkable by
   whole-set scan → SUPPORTED iff ≥ half the subject terms appear nowhere.
4. Else term-recall vs best chunk: SUPPORTED iff recall ≥ 0.6 AND every
   significant number (≥3 digits, token-matched) is present.
5. REFUTED only on anchored conflict: numeric/quoted-span difference with
   shared topical terms (mirrors the production gate's anchored-pair
   discipline). Bare negation mismatch → UNSUPPORTED, never REFUTED.
6. Meta-correction language ("X is not supported/correct") never triggers
   the negation rule (fix 2026-10-04: 20 false-REFUTED on first run).

## Reasoning (why this shape)

- Deterministic first: a scorer that cannot surprise us is auditable, free,
  and reproducible. An LLM judge is documented as future work with a cost
  estimate, not executed (no local provider key; prior local-LM evidence
  at 1.7B scale was negative — H3F).
- Gold is human: the annotator (not the scorer) is the authority; the
  scorer is measured against gold, never the reverse.
- Evidence boundary: only the supplied evidence array. Rescuing claims via
  the wider corpus is forbidden by design.
- Truth ≠ support: a real-world-true claim with no supplied evidence is
  UNSUPPORTED here, by definition.
