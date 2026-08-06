"""Pulls a random Vocabulary question from Supabase to source "word of the
day" reel content.

There's no standalone `word` column on `public.questions` — every stem
wraps the target word in the LAST quoted substring in `question_text`
(verified against scripts/generators/english/vocabulary.js's
STEMS/CONTEXT_STEMS: context stems quote the source sentence first and the
word second, e.g. `Read this sentence: "..."\n\nWhat does "WORD" mean in
this sentence?`; definitional stems only quote the word at all, e.g.
`What does the word "WORD" mean?`) — so "last quoted substring" reliably
extracts it either way.
"""

from __future__ import annotations

import random
import re
from typing import Any

from reel_common import supabase_select_rows


QUOTED_RE = re.compile(r'"([^"]+)"')


class VocabContentError(RuntimeError):
    pass


def _extract_word(question_text: str) -> str | None:
    matches = QUOTED_RE.findall(question_text)
    return matches[-1] if matches else None


def get_random_vocabulary_word(
    *,
    supabase_url: str,
    service_role_key: str,
    limit: int = 100,
) -> dict[str, Any]:
    """Fetches a batch of Vocabulary rows with a non-null example_sentence
    (only rows enriched with real sentence context are usable — see
    scripts/vocabulary-context-migration.sql) and returns one at random.

    Raises VocabContentError if none are available.
    """
    rows = supabase_select_rows(
        supabase_url=supabase_url,
        service_role_key=service_role_key,
        table="questions",
        params={
            "select": "id,question_text,correct_answer,example_sentence,difficulty",
            "subject": "eq.English",
            "topic": "eq.Vocabulary",
            "type": "eq.mcq",
            "example_sentence": "not.is.null",
            "limit": str(limit),
        },
    )

    candidates = []
    for row in rows:
        word = _extract_word(row.get("question_text", ""))
        meaning = row.get("correct_answer")
        example_sentence = row.get("example_sentence")
        if not word or not meaning or not example_sentence:
            continue
        candidates.append(
            {
                "word": word,
                "meaning": meaning,
                "example_sentence": example_sentence,
                "difficulty": row.get("difficulty"),
            }
        )

    if not candidates:
        raise VocabContentError(
            "No usable Vocabulary rows found (need question_text with a "
            "quoted word, a correct_answer, and a non-null example_sentence)."
        )

    return random.choice(candidates)


if __name__ == "__main__":
    from reel_common import get_env, load_env_files

    load_env_files()
    entry = get_random_vocabulary_word(
        supabase_url=get_env("NEXT_PUBLIC_SUPABASE_URL"),
        service_role_key=get_env("SUPABASE_SERVICE_ROLE_KEY"),
    )
    print(entry)
