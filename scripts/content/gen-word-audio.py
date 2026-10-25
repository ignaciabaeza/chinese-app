#!/usr/bin/env python3
"""
Word audio for polyphones that edge-tts misreads when the character stands
alone: 长 comes out zhǎng, 教 jiào, 差 chā, 数 shǔ, 哪 něi, 着 zhāo, 得 děi —
not the reading `words.pinyin` teaches. Each is synthesized from a text the
voice reads unambiguously in that reading (word-audio-overrides.json): a
single-reading homophone (常 cháng), or the word plus punctuation (哪？ nǎ).

    python3 scripts/content/gen-word-audio.py

Writes public/audio-fixed/words/{pinyin}.mp3, which is committed (unlike
public/audio/). 04-generate-audio.py and migration 011 point those words'
audio_path there. Add a word: check what the voice says (same voice, text →
byte-identical audio, so compare against homophones), add it to the JSON,
re-run this, and write a migration for existing rows.
"""

import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "public" / "audio-fixed" / "words"
VOICE = "zh-CN-XiaoxiaoNeural"  # same voice as 04-generate-audio.py


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    overrides = json.loads((Path(__file__).parent / "word-audio-overrides.json").read_text("utf8"))
    for word, o in overrides.items():
        out = OUT / f"{o['pinyin']}.mp3"
        await edge_tts.Communicate(o["text"], VOICE).save(str(out))
        print(f"{word} → {o['text']} → {out.relative_to(ROOT)}")


if __name__ == "__main__":
    asyncio.run(main())
