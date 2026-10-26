"""Claim-level evaluation harness (deterministic, local-only, zero provider calls).

Pipeline:
  answer text (+ evidence array + citation markers)
    -> extract_claims: deterministic sentence split, [Sn] attribution
    -> score_claim (deterministic entailment, frozen thresholds)
    -> classification in {SUPPORTED, REFUTED, UNSUPPORTED, NOT_CHECKABLE}

Nothing here touches production, the network, or any model provider.
Thresholds are fixed a priori (see SCORER_RULES in README); tuning them
against the gold set would be benchmark-driven fitting and is forbidden.
"""
import json
import re
import unicodedata

CIT_RE = re.compile(r"\[S(\d+)\]")
CIT_RANGE_RE = re.compile(r"\[S(\d+)\]\s*(?:through|to|-)\s*\[S(\d+)\]", re.IGNORECASE)
SENT_SPLIT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'])")

# v2 additions (2026-10-04 hardening; frozen rules above unchanged):
# - parse_citations: multi-marker + range attribution
# - normalize_text: date/percent/number-word/acronym canonicalization
# - variants/match: closed morphological closure (NOT stemming, NOT semantic)


CIT_LIST_RE = re.compile(r"\[S(\d+)((?:\s*,\s*S\d+)+)\]")


def parse_citations(sentence):
    """All cited positions in a sentence: [Sn], [Sn, Sm], [Sn][Sm], and
    ranges [Sn] through/to/- [Sm] (inclusive, order-normalized)."""
    out = set(int(n) for n in CIT_RE.findall(sentence))
    for m in CIT_LIST_RE.finditer(sentence):
        out.add(int(m.group(1)))
        out.update(int(n) for n in re.findall(r"S(\d+)", m.group(2)))
    for m in CIT_RANGE_RE.finditer(sentence):
        a, b = int(m.group(1)), int(m.group(2))
        out.update(range(min(a, b), max(a, b) + 1))
    return sorted(out)

FILLER_RE = re.compile(
    r"^(yes|no|hello|hi|thanks|thank you|okay|ok|sure|certainly|of course)[,.!]?\s*$",
    re.IGNORECASE)

ABSENCE_RE = re.compile(
    r"(does not contain|does not address|does not mention|does not establish|"
    r"does not specify|does not support|do not mention|cannot be established|"
    r"cannot be confirmed|no conclusion can be|none of .* mention|"
    r"not possible to det)", re.IGNORECASE)

GUIDANCE_RE = re.compile(
    r"(to determine|to investigate|one would need to consult|relevant stud\w+ "
    r"would need|should consult|please try again|is currently unavailable)",
    re.IGNORECASE)

# Discourse verbs name the act of stating, not the subject matter. In
# absence verification only subject terms are scanned; otherwise
# "mention"/"contain" (absent almost everywhere) would verify any absence
# claim regardless of subject (caught by test_absence_failed, 2026-10-04).
ABSENCE_META = {"mention", "mentions", "mentioned", "contain", "contains",
                "contained", "address", "addresses", "addressed", "discuss",
                "discusses", "discussed", "state", "states", "stated",
                "say", "says", "said", "establish", "support", "refute",
                "confirm", "information", "anything"}

# Meta-correction language talks ABOUT incorrectness ("X is not supported")
# rather than asserting a negated fact. It must not trigger the
# negation-flip rule (fix 2026-10-04: 20 false-REFUTED on gold).
META_RE = re.compile(
    r"(is not supported|not correct|is incorrect|is wrong|incorrect based|"
    r"cannot be established|cannot be confirmed|no conclusion can be|"
    r"not possible to det|does not support the claim|refuted by|"
    r"contradicted by|not fully supported)",
    re.IGNORECASE)


def asciifold(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()


def extract_claims(answer, evidence):
    """Split answer into atomic-ish claims.

    Returns list of {claim_id, text, citations:[n], evidence_total}.
    Sentence = maximal run ending in .?! with citation markers attributed
    to the sentence that carries them. Markers are stripped from text but
    preserved as integers (positional over the evidence array, 1-based).
    """
    text = (answer or "").strip()
    if not text:
        return []
    parts = SENT_SPLIT_RE.split(text)
    claims = []
    for i, p in enumerate(parts):
        p = p.strip()
        if not p:
            continue
        cites = parse_citations(p)
        clean = CIT_RANGE_RE.sub("", p)
        clean = CIT_LIST_RE.sub("", clean)
        clean = CIT_RE.sub("", clean).strip(" ;,")
        if not clean:
            continue
        claims.append({
            "claim_id": "c%d" % (i + 1),
            "text": clean,
            "citations": cites,
            "evidence_total": len(evidence),
        })
    return claims


NUMWORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12", "thirteen": "13",
    "fourteen": "14", "fifteen": "15", "sixteen": "16", "seventeen": "17",
    "eighteen": "18", "nineteen": "19", "twenty": "20", "thirty": "30",
    "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
    "eighty": "80", "ninety": "90", "half": "0.5", "quarter": "0.25",
}
MULTS = {"hundred": 100, "thousand": 1000, "million": 1000000,
         "billion": 1000000000}

MONTHS = {"january": "01", "february": "02", "march": "03", "april": "04",
          "may": "05", "june": "06", "july": "07", "august": "08",
          "september": "09", "october": "10", "november": "11",
          "december": "12"}


def _date_token(day, mon, year):
    return "%04d-%02d-%02d" % (int(year), int(mon), int(day))


def normalize_text(s):
    """Deterministic canonicalization (v2 hardening). Applied symmetrically
    to claims AND evidence. Each rule is mechanical, documented, bounded:
    - number words -> digits ("fifteen" -> "15", "twenty five" -> "25",
      "one hundred" -> "100"; half/quarter -> 0.5/0.25). Tens+units and
      hundred/thousand/million/billion composition only; no fractions
      beyond half/quarter (documented residual).
    - dates -> ISO (D/M/Y corpus convention: "1st April, 2026",
      "April 1, 2026", "1-4-2026", "01/04/2026" -> "2026-04-01").
      US M/D/Y ambiguity accepted as documented assumption.
    - "%" -> " percent"; "per cent" -> "percent".
    - acronym aliases: "Phrase (ACR)" definitions and bare ALLCAPS tokens
      both emit an `abbr:acr` token, so defined Terms match bare uses.
    """
    t = asciifold(s)
    t = re.sub(r"\bper\s+cent\b", "percent", t, flags=re.IGNORECASE)
    t = t.replace("%", " percent ")
    # "1st April, 2026" / "1 April 2026"
    def _dmy(m):
        mon = MONTHS.get(m.group(2).lower())
        return " " + _date_token(m.group(1), mon, m.group(3)) + " " if mon else m.group(0)
    t = re.sub(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})\b", _dmy, t)
    # "April 1, 2026"
    def _mdy(m):
        mon = MONTHS.get(m.group(1).lower())
        return " " + _date_token(m.group(2), mon, m.group(3)) + " " if mon else m.group(0)
    t = re.sub(r"\b([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b", _mdy, t)
    # "1-4-2026" / "01/04/2026" read as D/M/Y (Indian-legal-corpus convention)
    def _num(m):
        a, b, c = m.group(1), m.group(2), m.group(3)
        return " %04d-%02d-%02d " % (int(c), int(b), int(a))
    t = re.sub(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b", _num, t)
    toks = re.findall(r"\d{4}-\d{2}-\d{2}|[a-z0-9]+(?:[.,][a-z0-9]+)*",
                      t.lower())
    # number-word composition over the token stream
    out = []
    i = 0
    while i < len(toks):
        w = toks[i]
        nxt = toks[i + 1] if i + 1 < len(toks) else ""
        if w in NUMWORDS and nxt in NUMWORDS \
                and int(NUMWORDS[w]) % 10 == 0 and int(NUMWORDS[nxt]) < 10:
            # "twenty five" -> 25
            out.append(str(int(NUMWORDS[w]) + int(NUMWORDS[nxt])))
            i += 2
            continue
        if w in NUMWORDS and nxt in MULTS:
            # "one hundred" -> 100
            out.append(str(int(float(NUMWORDS[w]) * MULTS[nxt])))
            i += 2
            continue
        if w in NUMWORDS:
            out.append(NUMWORDS[w])
            i += 1
            continue
        out.append(w)
        i += 1
    # acronym aliases: definitions "Phrase (ACR)" + bare ALLCAPS uses.
    # Title-Case phrases additionally emit their initialism, so
    # "Alternative Investment Fund" matches a bare "AIF" claim-side even
    # when the definition parenthesis is absent (regulatory text rarely
    # repeats it; caught by test initialism_match, 2026-10-04). Bounded:
    # sequences of 2+ capitalized words only.
    aliases = set()
    for m in re.finditer(r"\b([A-Z][A-Za-z-]*(?:\s+[A-Za-z-]+){0,5})\s+\(([A-Z]{2,})\)", s):
        phrase, acr = m.group(1), m.group(2)
        initials = "".join(w[0] for w in phrase.split() if w and w[0].isalpha()).upper()
        if initials == acr or acr in phrase.upper().replace(" ", ""):
            aliases.add("abbr:" + acr.lower())
    for m in re.finditer(r"\b([A-Z]{2,})\b", s):
        aliases.add("abbr:" + m.group(1).lower())
    for m in re.finditer(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b", s):
        initials = "".join(w[0] for w in m.group(1).split()).upper()
        if len(initials) >= 2:
            aliases.add("abbr:" + initials.lower())
    out.extend(sorted(aliases))
    return out


def variants(w):
    """Closed morphological closure for one token (v2). Fixed rule list,
    applied identically both sides; pairwise intersection decides matches.
    Deliberately excludes tense/aspect beyond -ed/-ing strips and excludes
    derivational morphology (association/associate covered via -tion/-e;
    deeper relations need a lemmatizer = future judge, documented)."""
    out = {w}
    if len(w) >= 5:
        if w.endswith("ies"):
            out.add(w[:-3] + "y")
        elif w.endswith("sses"):
            out.add(w[:-2])
        elif w.endswith("es"):
            # Both "express" (expresses) and "case" (cases): e-final stems
            # need the +e form (caught by test es-stems, 2026-10-04).
            out.add(w[:-2])
            out.add(w[:-2] + "e")
        elif w.endswith("s") and not w.endswith("ss"):
            out.add(w[:-1])
        if w.endswith("tion") or w.endswith("sion"):
            out.add(w[:-4] + "t")
        if w.endswith("e"):
            out.add(w[:-1])
        if w.endswith("ed"):
            out.add(w[:-2])
            out.add(w[:-1])
        if w.endswith("ing"):
            out.add(w[:-3])
    return out


def match_terms(claim_terms, evidence_term_set):
    """Count of claim terms with any variant hit in the evidence set.
    Symmetric closure: variants are expanded on BOTH sides, so
    associate/association merge regardless of which side holds which
    form (caught by test association_merge, 2026-10-04)."""
    if not evidence_term_set:
        return 0
    exp = set()
    for e in evidence_term_set:
        exp.add(e)
        if len(e) >= 5:
            exp.update(variants(e))
    n = 0
    for t in claim_terms:
        if t in exp:
            n += 1
            continue
        if any(v in exp for v in variants(t)):
            n += 1
    return n


STOP = set(("the a an and or of to in on for with is are was were be been by "
            "as at from that this these those it its into over such than then "
            "there their they them he she his her you your our ours us we our "
            "not no nor can will would should could may might must shall "
            "what which who whom whose when where why how does did done has "
            "have had than then thus hence while although though about into "
            "through during before after between under also however therefore "
            "further more most other some such only own same so too very can "
            "just don should now via per within without within upon toward "
            "regarding following based using used use following per et al "
            "answer question evidence text provided given following claims "
            "indicate indicates stated states согласно").split())


def content_terms(s):
    return [t for t in normalize_text(s)
            if t not in STOP and (len(t) > 2 or t[:1].isdigit()
                                   or t.startswith("abbr:"))]


def numbers(s):
    """Numeric tokens from the normalized stream (digits, ISO dates)."""
    return [t for t in normalize_text(s) if t[:1].isdigit()]


def significant_numbers(toks):
    """Numbers load-bearing enough to decide a claim: ISO dates, or digit
    strings of length >= 2. Single digits ("one analysis", "step 1", list
    markers) are discourse counters, not facts — using them as
    contradiction anchors caused a false REFUTED on hedged content
    (ADV-43, 2026-10-04). They are ignored for both presence and
    contradiction duty."""
    return [t for t in toks
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", t)
            or len(re.sub(r"\D", "", t)) >= 2]


def num_category(tok, toks, idx):
    """Slot category so alternatives compare like-with-like (a year is not
    an alternative to a quantity). Corpus convention, documented."""
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", tok):
        return "date"
    if re.fullmatch(r"(19|20)\d{2}", tok):
        return "year"
    near = set(toks[max(0, idx - 2):idx + 3])
    if "percent" in near:
        return "percent"
    if near & {"rupee", "rupees", "crore", "crores", "lakh", "lakhs",
               "dollar", "dollars"}:
        return "amount"
    return "quantity"


NEG_RE = re.compile(r"\b(not|no|never|neither|nor|incorrect|wrong|false|disagree|"
                    r"cannot|can't|don't|doesn't|isn't|aren't|wasn't|weren't)\b",
                    re.IGNORECASE)

SUPPORT_RECALL = 0.6


def score_claim(claim_text, evidence):
    """Deterministic entailment judgment. See README SCORER_RULES.

    evidence: list of {chunk_id, text}. Returns
    {label, best_chunk, recall, detail}.
    Labels: SUPPORTED | REFUTED | UNSUPPORTED | NOT_CHECKABLE.
    """
    text = claim_text.strip()
    ctoks = normalize_text(text)
    terms = [t for t in ctoks
             if t not in STOP and (len(t) > 2 or t[:1].isdigit()
                                   or t.startswith("abbr:"))]
    if not terms:
        return {"label": "NOT_CHECKABLE", "best_chunk": None,
                "recall": 0.0, "detail": "no-checkable-terms"}
    if text.endswith("?"):
        # Interrogatives assert nothing (clarification prompts, not claims).
        return {"label": "NOT_CHECKABLE", "best_chunk": None,
                "recall": 0.0, "detail": "interrogative"}
    if FILLER_RE.match(text):
        return {"label": "NOT_CHECKABLE", "best_chunk": None,
                "recall": 0.0, "detail": "conversational-filler"}
    if GUIDANCE_RE.search(text):
        return {"label": "NOT_CHECKABLE", "best_chunk": None,
                "recall": 0.0, "detail": "guidance-filler"}
    cnums = numbers(text)
    # Per-chunk match (best single chunk drives REFUTED anchoring and
    # reporting) AND union match across the supplied set (multi-source
    # claims legitimately compose S1+S2; judging against one chunk only
    # systematically undercalls them — caught on ADV-30/32, 2026-10-04).
    # Union applies to SUPPORTED only; REFUTED stays single-chunk anchored
    # (a contradiction must live somewhere specific, not scattered).
    union = set()
    best = None
    best_rec = 0.0
    best_idx = None
    for i, ev in enumerate(evidence):
        eset = set(content_terms(ev.get("text") or ""))
        union.update(eset)
        rec = match_terms(terms, eset) / len(terms)
        if rec > best_rec:
            best_rec = rec
            best = ev.get("chunk_id")
            best_idx = i
    if not evidence:
        return {"label": "UNSUPPORTED", "best_chunk": None,
                "recall": 0.0, "detail": "empty-evidence"}
    if best_idx is None:
        # No term overlap at all: still a real best chunk (rank 1) so the
        # absence rule below can verify whole-set absence honestly.
        best_idx, best, best_rec = 0, evidence[0].get("chunk_id"), 0.0
    best_text = evidence[best_idx].get("text") or ""
    best_toks = normalize_text(best_text)
    best_tok = set(best_toks)
    # Absence claims ("evidence does not contain X") are checkable by
    # whole-set scan with variant matching: supported iff the subject
    # terms appear nowhere.
    if ABSENCE_RE.search(text):
        anywhere = set()
        for ev in evidence:
            anywhere.update(content_terms(ev.get("text") or ""))
        subj = [t for t in terms if t not in ABSENCE_META]
        if not subj:
            return {"label": "NOT_CHECKABLE", "best_chunk": None,
                    "recall": 0.0, "detail": "absence-no-subject"}
        missing = [t for t in subj
                   if not (t in anywhere or
                           any(t in variants(e) for e in anywhere if len(e) >= 5)
                           or any(v in anywhere for v in variants(t)))]
        if len(missing) >= max(1, len(subj) // 2):
            return {"label": "SUPPORTED", "best_chunk": None,
                    "recall": round(len(missing) / len(subj), 4),
                    "detail": "absence-verified"}
        return {"label": "UNSUPPORTED", "best_chunk": best,
                "recall": round(best_rec, 4), "detail": "absence-failed"}
    # Numbers dominate in number-dense text (tripwire philosophy): a claim
    # carrying significant numbers is decided by them BEFORE the recall
    # floor, so a wrong date/figure cannot hide behind shared vocabulary
    # (caught on ADV-18/26, 2026-10-04). Numberless claims still need the
    # recall floor below.
    signums = significant_numbers(cnums)
    if signums and any(n not in union for n in signums):
        # REFUTED only with a same-slot alternative: another number of the
        # same category (year/date/percent/amount/quantity) in one chunk
        # sharing topical terms. An absent number with no alternative
        # in its slot is UNSUPPORTED (parametric-detail case, e.g. G2).
        hit = False
        for n in signums:
            if n in union:
                continue
            ccat = num_category(n, ctoks, ctoks.index(n))
        # REFUTED only with a same-slot alternative: another number of the
        # same category (year/date/percent/amount/quantity) in one chunk
        # sharing topical terms. An absent number with no alternative
        # in its slot is UNSUPPORTED (parametric-detail case, e.g. G2).
        hit = False
        for n in cnums:
            if n in union:
                continue
            ccat = num_category(n, ctoks, ctoks.index(n))
            for i2, ev2 in enumerate(evidence):
                bt2 = normalize_text(ev2.get("text") or "")
                bset2 = set(content_terms(ev2.get("text") or ""))
                for j, bn in enumerate(bt2):
                    if not bn[:1].isdigit() or bn == n:
                        continue
                    if num_category(bn, bt2, j) == ccat and \
                            match_terms(terms, bset2) >= 2:
                        hit = True
        if hit:
            return {"label": "REFUTED", "best_chunk": best,
                    "recall": round(match_terms(terms, union) / len(terms), 4),
                    "detail": "numeric-mismatch-anchored"}
        return {"label": "UNSUPPORTED", "best_chunk": best,
                "recall": round(match_terms(terms, union) / len(terms), 4),
                "detail": "number-absent"}
    if match_terms(terms, union) / len(terms) < SUPPORT_RECALL:
        return {"label": "UNSUPPORTED", "best_chunk": best,
                "recall": round(match_terms(terms, union) / len(terms), 4),
                "detail": "low-recall"}
    # Negation flip: claim negates while the best chunk affirms the same
    # terms without negation (or vice versa). Meta-correction language is
    # excluded: it discusses incorrectness rather than asserting a negated
    # fact. The flip also requires an anchored numeric or quoted-span
    # difference, mirroring the production gate's anchored-pair discipline;
    # a non-meta flip that fails the anchor bar downgrades to UNSUPPORTED
    # (never SUPPORTED: a polarity mismatch must not read as support).
    flip = bool(NEG_RE.search(text)) != bool(NEG_RE.search(best_text))
    anchored = (any(n not in union for n in cnums) or
                bool(re.search(r"['\"]([^'\"]{4,})['\"]", text)))
    if flip and not META_RE.search(text) and best_rec >= 0.7 and anchored:
        return {"label": "REFUTED", "best_chunk": best,
                "recall": round(best_rec, 4), "detail": "negation-flip"}
    return {"label": "SUPPORTED", "best_chunk": best,
            "recall": round(match_terms(terms, union) / len(terms), 4),
            "detail": "term-recall-union"}


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=True)
