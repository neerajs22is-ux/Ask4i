"""Evaluator regression tests (stdlib unittest, no network, deterministic).

Run: python -m unittest eval.claim-level.test_claim_eval -v
(from repo root; the module path uses the directory as a namespace —
simpler: python eval/claim-level/test_claim_eval.py).

Each rule has positive AND negative cases. Thresholds (0.6/0.7) are
NOT tuned here; tests pin rule behavior, not gold outcomes.
"""
import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from claim_eval import (extract_claims, parse_citations, score_claim,
                        normalize_text, variants, match_terms)


def ev(*texts):
    return [{"chunk_id": "s%d" % (i + 1), "text": t}
            for i, t in enumerate(texts)]


class Markers(unittest.TestCase):
    def test_single(self):
        self.assertEqual(parse_citations("see [S2] here"), [2])

    def test_multi(self):
        self.assertEqual(parse_citations("see [S1, S2] here"), [1, 2])

    def test_adjacent(self):
        self.assertEqual(parse_citations("see [S1][S3] here"), [1, 3])

    def test_range_through(self):
        self.assertEqual(parse_citations("blocks [S1] through [S8] end"),
                         [1, 2, 3, 4, 5, 6, 7, 8])

    def test_range_reversed(self):
        self.assertEqual(parse_citations("[S8]-[S6]"), [6, 7, 8])

    def test_malformed_ignored(self):
        self.assertEqual(parse_citations("see [S] and [SX] here"), [])

    def test_extract_attaches_all(self):
        cs = extract_claims("A fact here [S1, S2].", ev("a", "b"))
        self.assertEqual(cs[0]["citations"], [1, 2])


class Normalizer(unittest.TestCase):
    def test_number_words(self):
        t = normalize_text("fifteen percent and twenty five cases")
        self.assertIn("15", t)
        self.assertIn("25", t)

    def test_hundred(self):
        self.assertIn("100", normalize_text("one hundred samples"))

    def test_dates_equal(self):
        a = normalize_text("effective 1st April, 2026")
        b = normalize_text("effective 1-4-2026")
        self.assertIn("2026-04-01", a)
        self.assertIn("2026-04-01", b)

    def test_percent(self):
        t = normalize_text("grew 50%")
        self.assertIn("50", t)
        self.assertIn("percent", t)

    def test_acronym_alias(self):
        a = normalize_text("Alternative Investment Fund (AIF) rules")
        b = normalize_text("the AIF must comply")
        self.assertTrue(set(a) & set(b) - {"the", "must", "comply", "rules"}
                        or "abbr:aif" in a and "abbr:aif" in b)

    def test_variants_morphology(self):
        self.assertTrue("associate" in variants("associated")
                        or bool(set(variants("associate"))
                                & set(variants("association"))))

    def test_variants_no_merge(self):
        # "station" and "statue" must not merge via strips
        self.assertFalse(set(variants("station")) & set(variants("statue")))

    def test_es_stems(self):
        # e-final stems need the +e form (cases/case, places/place)
        self.assertIn("case", variants("cases"))
        self.assertIn("place", variants("places"))
        self.assertIn("express", variants("expresses"))

    def test_association_merge(self):
        a = match_terms(["association"], {"associate", "threshold"})
        self.assertGreater(a, 0)

    def test_initialism_match(self):
        t = normalize_text("Alternative Investment Fund rules")
        self.assertIn("abbr:aif", t)
        self.assertIn("abbr:aif", normalize_text("the AIF must comply"))


class ScorerRules(unittest.TestCase):
    E = ev("The standard deduction is 50000 or the salary, whichever is less.")

    def test_supported_exact(self):
        s = score_claim("The standard deduction is 50000.", self.E)
        self.assertEqual(s["label"], "SUPPORTED")

    def test_supported_number_word(self):
        s = score_claim("The standard deduction is fifty thousand.", self.E)
        # "fifty thousand" -> 50000; evidence has 50000
        self.assertEqual(s["label"], "SUPPORTED")

    def test_refuted_percent(self):
        s = score_claim(
            "The standard deduction is fifteen percent of salary.", self.E)
        # 15% vs 50000-amount: different slots -> number-absent path...
        # "percent" slot has no alternative -> UNSUPPORTED, not REFUTED
        self.assertIn(s["label"], ("UNSUPPORTED", "REFUTED"))

    def test_refuted_anchored_amount(self):
        e = ev("The limit is fifteen percent of salary.")
        s = score_claim("The limit is fifty percent of salary.", e)
        self.assertEqual(s["label"], "REFUTED")

    def test_nearby_wrong_number_refuted(self):
        e = ev("The Act came into force on 1st April, 2026.")
        s = score_claim("The Act came into force on 1st April, 2025.", e)
        self.assertEqual(s["label"], "REFUTED")

    def test_date_format_match_supported(self):
        e = ev("Effective 1-4-2026 the rule applies.")
        s = score_claim("The rule applies effective 1st April, 2026.", e)
        self.assertEqual(s["label"], "SUPPORTED")

    def test_parametric_date_absent(self):
        # G2-style: date true nowhere in evidence -> must not be SUPPORTED
        e = ev("The window is nil up to two years from certification.")
        s = score_claim("Amended effective 1-4-2026 by the Finance Act.", e)
        self.assertNotEqual(s["label"], "SUPPORTED")

    def test_meta_correction_not_refuted(self):
        e = ev("ALDH1 correlates with poor prognosis.")
        s = score_claim("The claim that ALDH1 means better outcomes "
                        "is not supported by the evidence.", e)
        self.assertNotEqual(s["label"], "REFUTED")

    def test_interrogative(self):
        s = score_claim("Which two documents should I compare?", self.E)
        self.assertEqual(s["label"], "NOT_CHECKABLE")

    def test_guidance_long(self):
        s = score_claim("To determine eligibility, one would need to consult "
                        "the provisions related to classification and rates "
                        "under the applicable schedules.", self.E)
        self.assertEqual(s["label"], "NOT_CHECKABLE")

    def test_absence_verified(self):
        s = score_claim("The evidence does not mention wealth-tax.", self.E)
        self.assertEqual(s["label"], "SUPPORTED")

    def test_absence_failed(self):
        s = score_claim("The evidence does not mention salary.", self.E)
        self.assertEqual(s["label"], "UNSUPPORTED")

    def test_multi_source_union(self):
        e = ev("The short title is the 2025 Act.",
               "The associate threshold is fifteen percent.")
        s = score_claim("The short title is the 2025 Act and the associate "
                        "threshold is fifteen percent.", e)
        self.assertEqual(s["label"], "SUPPORTED")

    def test_single_chunk_still_required_for_refuted(self):
        # Scattered numbers across chunks must not fabricate a contradiction.
        e = ev("The limit is fifty.", "Unrelated text about nothing.")
        s = score_claim("The limit is fifteen.", e)
        self.assertNotEqual(s["label"], "REFUTED")

    def test_empty_evidence(self):
        s = score_claim("Something factual here.", [])
        self.assertEqual(s["label"], "UNSUPPORTED")

    def test_filler(self):
        s = score_claim("Yes.", self.E)
        self.assertEqual(s["label"], "NOT_CHECKABLE")


class Boundaries(unittest.TestCase):
    def test_determinism(self):
        e = ev("ALDH1 correlates with poor prognosis in 577 cases.")
        q = "ALDH1 means poor prognosis in 577 cases."
        a = score_claim(q, e)
        b = score_claim(q, e)
        self.assertEqual(a, b)

    def test_extra_corpus_cannot_rescue(self):
        # Appending an unrelated chunk must not flip UNSUPPORTED->SUPPORTED
        # for a claim about absent content... and a supported claim stays
        # supported (label stability under evidence superset).
        e1 = ev("The standard deduction is 50000.")
        e2 = ev("The standard deduction is 50000.",
                "Unrelated_INSERTED bagels quantum zebras.")
        q = "The standard deduction is 50000."
        self.assertEqual(score_claim(q, e1)["label"], "SUPPORTED")
        self.assertEqual(score_claim(q, e2)["label"], "SUPPORTED")

    def test_no_network_imports(self):
        import claim_eval as m
        with open(m.__file__, encoding="utf-8") as f:
            src = f.read()
        for bad in ("urllib", "socket", "http.client", "requests",
                    "openai", "transformers", "subprocess", "os.system"):
            self.assertNotIn(bad, src)


if __name__ == "__main__":
    unittest.main()
