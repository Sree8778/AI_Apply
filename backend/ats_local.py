"""
Deterministic, local ATS match scorer.

Runs entirely in Python with no LLM call — used to re-score a resume
against a job description's keywords as often as the user wants (every
resume edit, every keyword add) at zero token cost. The one thing that
still needs an LLM is extracting the keyword list FROM the job description
in the first place (ai_engine.extract_jd_keywords); the frontend caches
that result per job description so it only happens once.
"""
import re
from rapidfuzz import fuzz

from skills_taxonomy import variants_for

FUZZY_THRESHOLD = 82
FUZZY_MIN_LEN = 4  # below this, edit-distance ratios are too noisy to trust
CONFIDENCE_SKILL_EXACT = 1.0
CONFIDENCE_PROSE_EXACT = 0.9
CONFIDENCE_FUZZY = 0.6


def _normalize(text):
    return re.sub(r"\s+", " ", (text or "")).strip().lower()


def _word_pattern(variant):
    # Custom boundary (rather than \b) so punctuation-bearing terms like
    # "c++", "c#", "node.js", "ci/cd" match correctly: \b doesn't treat
    # '+', '#', '.', '/' as word characters, so it fails on exactly the
    # multi-word tech terms this scorer cares about most.
    escaped = re.escape(variant)
    return re.compile(r"(?<![a-z0-9])" + escaped + r"(?![a-z0-9])", re.IGNORECASE)


def _entry_bullets(entry):
    if not entry:
        return []
    achievements = entry.get("achievements")
    if isinstance(achievements, list) and achievements:
        return [str(a) for a in achievements if a]
    description = entry.get("description")
    if isinstance(description, str) and description.strip():
        return [line.strip() for line in description.split("\n") if line.strip()]
    return []


def _build_corpus(resume_data):
    """
    Split the resume into a skills corpus (exact-match territory) and a
    prose corpus (summary + bullets + project text) scored slightly lower
    on an exact hit, since a skill sitting in the Skills list is a
    stronger, more ATS-visible signal than the same word appearing once
    inside a sentence.
    """
    resume_data = resume_data or {}
    skills_text = _normalize(", ".join(str(s) for s in (resume_data.get("skills") or [])))

    prose_parts = [resume_data.get("summary") or ""]
    for section in ("work_history", "projects"):
        for entry in resume_data.get(section) or []:
            prose_parts.append(entry.get("position") or entry.get("role") or "")
            prose_parts.append(entry.get("name") or "")
            prose_parts.extend(_entry_bullets(entry))
    prose_text = _normalize(" . ".join(p for p in prose_parts if p))

    prose_tokens = [t for t in re.split(r"[^a-z0-9+#./]+", prose_text) if t]
    return skills_text, prose_text, prose_tokens


def _match_keyword(term, skills_text, prose_text, prose_tokens):
    for variant in variants_for(term):
        if not variant:
            continue
        pattern = _word_pattern(variant)
        if pattern.search(skills_text):
            return CONFIDENCE_SKILL_EXACT, "skills"
        if pattern.search(prose_text):
            return CONFIDENCE_PROSE_EXACT, "experience"

    # Fuzzy fallback: catch typos/minor variants rapidfuzz-style, checked
    # against whole prose (for multi-word terms) and individual tokens
    # (for single-word terms, so "Kubernets" still catches "kubernetes").
    best = 0
    for variant in variants_for(term):
        if len(variant) < FUZZY_MIN_LEN:
            continue
        if " " in variant or "-" in variant:
            # Phrase-level fuzzy match against the whole prose blob is safe
            # even for shorter phrases — coincidental collisions across a
            # multi-word span are far rarer than single-word collisions.
            best = max(best, fuzz.partial_ratio(variant, prose_text))
        else:
            for token in prose_tokens:
                if abs(len(token) - len(variant)) > 2:
                    continue  # skip tokens too different in length to be a typo
                best = max(best, fuzz.ratio(variant, token))
    if best >= FUZZY_THRESHOLD:
        return CONFIDENCE_FUZZY, "fuzzy"
    return 0.0, None


def compute_local_ats_score(resume_data, keywords):
    """
    keywords: list of {"term": str, "category": str, "weight": 1-3}
    (as produced by ai_engine.extract_jd_keywords, cached client-side).

    Returns {score, matchedKeywords, weakKeywords, missingKeywords}, where
    matched = confident exact match, weak = fuzzy-only match (present but
    phrased differently — worth tightening), missing = not found at all.
    """
    skills_text, prose_text, prose_tokens = _build_corpus(resume_data)

    matched, weak, missing = [], [], []
    weighted_total = 0.0
    weighted_earned = 0.0

    for kw in keywords or []:
        term = (kw.get("term") or "").strip()
        if not term:
            continue
        weight = kw.get("weight") or 1
        weighted_total += weight
        confidence, source = _match_keyword(term, skills_text, prose_text, prose_tokens)
        weighted_earned += weight * confidence
        if confidence >= CONFIDENCE_PROSE_EXACT:
            matched.append(term)
        elif confidence > 0:
            weak.append(term)
        else:
            missing.append(term)

    score = round((weighted_earned / weighted_total) * 100) if weighted_total > 0 else 0
    return {
        "score": score,
        "matchedKeywords": matched,
        "weakKeywords": weak,
        "missingKeywords": missing,
    }
