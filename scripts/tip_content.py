"""Two-pass LLM authoring for generic (non-vocabulary) reel tip content: an
author pass drafts a short hook + tip body for a text-card reel, then an
independent verifier pass checks it's genuinely useful, specific 11+ prep
advice (not generic filler) before acceptance.

Same author+verifier shape as the Node-side question-bank generators (e.g.
scripts/generators/lib/llm-vocabulary.js) — the verifier is the quality
gate in place of manual review. Ported to Python since this script runs
alongside the rest of the reel-generation pipeline, which is Python.
"""

from __future__ import annotations

import json
import re

from openai import OpenAI


MODEL = "gpt-4o"

# Same conservative US-spelling guard as scripts/generators/lib/uk-english.js
# on the Node side — only clearly-American forms, since -ise/-ize is
# genuinely ambiguous in British English.
US_SPELLING_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\bcolor(s|ed|ing)?\b", r"\bflavor(s|ed|ing)?\b", r"\bhonor(s|ed|ing)?\b",
        r"\bneighbor(s|hood|ing)?\b", r"\bcenter(s|ed|ing)?\b", r"\btheater(s)?\b",
        r"\bdefense\b", r"\boffense\b", r"\bgray\b", r"\baluminum\b",
        r"\bliter(s)?\b", r"\btraveling\b", r"\btraveled\b", r"\bcanceled\b",
        r"\bfavorite(s)?\b", r"\bjewelry\b", r"\bplow\b", r"\bmath\b", r"\bgotten\b",
    ]
]


class TipContentError(RuntimeError):
    pass


def _client() -> OpenAI:
    # Instantiated fresh per call rather than at module load — avoids the
    # env-var-load-order trap the Node scripts hit earlier this session
    # (a client built at import time can run before dotenv has loaded
    # OPENAI_API_KEY, depending on import order in the calling script).
    return OpenAI()


def is_clean_uk_text(text: str) -> bool:
    return not any(pattern.search(text) for pattern in US_SPELLING_PATTERNS)


def author_tip() -> dict[str, str]:
    prompt = """You are writing a short, punchy tip-card reel for UK parents
preparing their child for the 11+ exam (verbal reasoning, non-verbal
reasoning, maths, English comprehension/vocabulary).

Write:
- a short hook line (max 8 words) that grabs attention on the first card
- a tip body (max 30 words) with ONE genuinely useful, specific piece of
  11+ prep advice for a pupil aged 8-11 — not generic filler like "practice
  more" or "stay positive". It should teach the parent or child something
  concrete they can actually act on.

Use British English spelling throughout.

Respond as valid JSON only, no markdown fences:
{ "hook": "...", "body": "..." }"""

    response = _client().chat.completions.create(
        model=MODEL,
        temperature=0.8,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    return json.loads(response.choices[0].message.content)


def verify_tip(*, hook: str, body: str) -> bool:
    prompt = f"""Fact-check and quality-check this 11+ exam prep tip for a
UK parent audience.

HOOK: {hook}
TIP: {body}

Check BOTH:
1. Is the tip specific and genuinely actionable — not generic filler like
   "practice more" or "believe in yourself"?
2. Is it accurate 11+ exam prep advice (UK grammar school entrance exam
   context) with no factual errors?

Reply with ONLY YES or NO."""

    response = _client().chat.completions.create(
        model=MODEL,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip().upper().startswith("YES")


def get_verified_tip(*, max_attempts: int = 4) -> dict[str, str]:
    """Author + verify, retrying on rejection. Raises TipContentError if no
    attempt passes within max_attempts.
    """
    for _ in range(max_attempts):
        try:
            raw = author_tip()
        except Exception:
            continue

        hook = str(raw.get("hook", "")).strip()
        body = str(raw.get("body", "")).strip()
        if not hook or not body:
            continue
        if len(hook) > 80 or len(body) > 220:
            continue
        if not is_clean_uk_text(hook) or not is_clean_uk_text(body):
            continue

        try:
            if verify_tip(hook=hook, body=body):
                return {"hook": hook, "body": body}
        except Exception:
            continue

    raise TipContentError("Could not generate a verified tip after multiple attempts.")


if __name__ == "__main__":
    from reel_common import load_env_files

    load_env_files()
    print(get_verified_tip())
