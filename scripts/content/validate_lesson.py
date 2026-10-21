"""Validate an authored HSK 1 lesson JSON (data/hsk1/lessons/{N}.json).

Usage (needs `pip install pypinyin`, see scripts/requirements.txt):
    python3 scripts/content/validate_lesson.py data/hsk1/lessons/6.json [...]

The official per-lesson word list lives in hsk1-vocab.json next to this file.

Errors (must fix):
  - schema basics, id patterns, duplicate ids
  - official word list for the lesson != newWords set
  - a new word not appearing in its own situation's dialogue
  - a Han character in learner-facing Chinese (dialogues, examples, exercise
    items, warm-up) that is not in the cumulative vocabulary of lessons 1..N
    (proper nouns of the lesson are allowed)
  - pinyin syllables that don't match the characters (toneless comparison)
Warnings (review):
  - tone differences vs. pypinyin (often legit: 一/不 sandhi, neutral tones)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from pypinyin import lazy_pinyin, Style

HERE = Path(__file__).parent
VOCAB = {int(k): v for k, v in json.load(open(HERE / "hsk1-vocab.json")).items()}
HAN = re.compile(r"[㐀-鿿]")
TONE_DIGITS = str.maketrans("", "", "012345")


def toneless(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z]", "", s).replace("v", "u")
    # Accepted colloquial readings pypinyin doesn't pick by default.
    return s.replace("shei", "shui")


def expected_pinyin(hanzi: str, tones: bool) -> str:
    chars = "".join(HAN.findall(hanzi))
    style = Style.TONE if tones else Style.NORMAL
    syllables = lazy_pinyin(chars, style=style, neutral_tone_with_five=False)
    # Erhua: a 儿 suffix (那儿, 哪儿, 一点儿) is written as a bare "r"; the
    # word 儿 in 儿子 / 女儿 keeps its own syllable "ér".
    for i, c in enumerate(chars):
        if c == "儿" and i > 0 and chars[i - 1] != "女" and chars[i + 1:i + 2] != "子":
            syllables[i] = "r"
    return "".join(syllables)


def main(paths):
    total_err = 0
    for p in paths:
        lesson = json.load(open(p))
        n = lesson["number"]
        errs, warns = [], []
        E, W = errs.append, warns.append

        # ── schema basics
        for k in ("id", "level", "number", "title", "theme", "texts", "notes", "exercises", "characters"):
            if k not in lesson:
                E(f"missing top-level key {k}")
        if lesson.get("id") != f"hsk1-{n}" or lesson.get("level") != 1:
            E("id/level wrong")
        texts = lesson.get("texts", [])
        if len(texts) != 3:
            E(f"expected 3 texts, got {len(texts)}")

        ids = []
        word_ids = []
        proper = set()
        for t in texts:
            for w in t.get("newWords", []):
                ids.append(w.get("id"))
                word_ids.append(w.get("id"))
                for k in ("id", "hanzi", "pinyin", "pos", "english"):
                    if not w.get(k):
                        E(f"word {w} missing {k}")
                if not re.fullmatch(rf"hsk1_{n}_[a-z0-9_]+", w.get("id", "")):
                    E(f"bad word id {w.get('id')}")
            for pn in t.get("properNouns", []) or []:
                ids.append(pn.get("id"))
                proper.add(pn["hanzi"])
        for g in lesson.get("notes", []):
            ids.append(g.get("id"))
            if not re.fullmatch(rf"hsk1_{n}_g_[a-z0-9_]+", g.get("id", "")):
                E(f"bad grammar id {g.get('id')}")
        for c in lesson.get("characters", {}).get("singleComponentChars", []) or []:
            ids.append(c.get("id"))
            if not re.fullmatch(rf"hsk1_{n}_c_[a-z0-9_]+", c.get("id", "")):
                E(f"bad char id {c.get('id')}")
        dup = {i for i in ids if ids.count(i) > 1}
        if dup:
            E(f"duplicate ids {dup}")

        # ── official word list
        official = [w["hanzi"] for w in VOCAB[n]]
        official_words = {h for h, w in zip(official, VOCAB[n]) if w["pos"] != "proper"}
        official_proper = {h for h, w in zip(official, VOCAB[n]) if w["pos"] == "proper"}
        got_words = [w["hanzi"] for t in texts for w in t.get("newWords", [])]
        missing = official_words - set(got_words)
        extra = set(got_words) - official_words
        if missing:
            E(f"official words missing from newWords: {sorted(missing)}")
        if extra:
            E(f"newWords not in official list: {sorted(extra)}")
        if len(got_words) != len(set(got_words)):
            E("a word is listed twice in newWords")
        if official_proper - proper:
            E(f"official proper nouns missing from properNouns: {sorted(official_proper - proper)}")

        # ── each word appears in its situation's dialogue
        for t in texts:
            dlg = "".join(l["hanzi"] for l in t.get("dialogue", []))
            for w in t.get("newWords", []):
                if w["hanzi"] not in dlg:
                    E(f"word {w['hanzi']} not used in situation {t.get('situationNumber')} dialogue")
            for pn in t.get("properNouns", []) or []:
                if pn["hanzi"] not in dlg:
                    W(f"proper noun {pn['hanzi']} not used in situation {t.get('situationNumber')}")

        # ── character coverage
        allowed = set()
        for m in range(1, n + 1):
            for w in VOCAB[m]:
                allowed |= set(HAN.findall(w["hanzi"]))
        for pn in proper:
            allowed |= set(HAN.findall(pn))
        allowed |= set("儿")  # erhua suffix
        # Recurring original cast: 安娜, 王明, 刘老师, 马克, 小美
        allowed |= set("安娜王明刘马克美")

        learner_lines = []  # (where, hanzi, pinyin|None)
        for t in texts:
            for i, l in enumerate(t.get("dialogue", [])):
                learner_lines.append((f"S{t.get('situationNumber')} line {i+1}", l.get("hanzi", ""), l.get("pinyin")))
                if not l.get("pinyin") or not l.get("english"):
                    E(f"S{t.get('situationNumber')} line {i+1} missing pinyin/english")
        for g in lesson.get("notes", []):
            for i, ex in enumerate(g.get("examples", []) or []):
                learner_lines.append((f"{g['id']} ex {i+1}", ex.get("hanzi", ""), ex.get("pinyin")))
            for r, row in enumerate((g.get("patternTable") or {}).get("rows", [])):
                for cell in row:
                    learner_lines.append((f"{g['id']} table row {r+1}", cell, None))
        for ex in lesson.get("exercises", []):
            for i, it in enumerate(ex.get("items", []) or []):
                learner_lines.append((f"exercise {ex['number']} item {i+1}", it.get("hanzi", "") or "", it.get("pinyin")))
        for i, it in enumerate((lesson.get("warmUp") or {}).get("items", [])):
            learner_lines.append((f"warmUp {i+1}", it.get("hanzi", ""), it.get("pinyin")))

        for where, hz, py in learner_lines:
            bad = sorted({c for c in HAN.findall(hz) if c not in allowed})
            if bad:
                E(f"{where}: characters not yet learned {bad} in {hz!r}")
            if py and HAN.search(hz) and not re.search(r"\d", hz) and "_" not in hz and "____" not in hz:
                if toneless(py) != toneless(expected_pinyin(hz, tones=False)):
                    E(f"{where}: pinyin mismatch {hz!r} → {py!r} (expected ~{expected_pinyin(hz, False)})")
                else:
                    exp = toneless_marked = expected_pinyin(hz, tones=True)
                    norm = lambda s: re.sub(r"[^a-zàáǎāèéěēìíǐīòóǒōùúǔūǜǘǚǖü]", "", unicodedata.normalize("NFC", s.lower()))
                    if norm(py) != norm(exp):
                        W(f"{where}: tones differ {hz!r} → {py!r} vs {exp}")

        # ── word pinyin
        for t in texts:
            for w in t.get("newWords", []):
                if toneless(w["pinyin"]) != toneless(expected_pinyin(w["hanzi"], False)):
                    E(f"word {w['hanzi']} pinyin {w['pinyin']!r} looks wrong")

        print(f"\n=== Lesson {n}: {len(errs)} errors, {len(warns)} warnings")
        for e in errs:
            print("  ERROR", e)
        for w in warns:
            print("  warn ", w)
        total_err += len(errs)
    sys.exit(1 if total_err else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
