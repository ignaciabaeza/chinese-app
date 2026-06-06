#!/usr/bin/env python3
"""
04-generate-audio.py — batch TTS for HSK 1-2 words and matched sentences.

Connects to DATABASE_URL (read from .env or environment), pulls every
HSK 1-2 word and every kept Tatoeba sentence (max_hsk_level <= 2) whose
audio_path column is still NULL, generates an MP3 with Microsoft edge-tts,
and writes the resulting public URL path back into the DB.

Files land in:
    public/audio/words/{word_id}.mp3
    public/audio/sentences/{sentence_id}.mp3

Idempotent — files already on disk are skipped, audio_path rows already
populated are skipped. Safe to re-run after adding more words/sentences.

Workflow (Mac → EC2):
    1.  ssh -L 5433:localhost:5432 ec2-user@<your-ec2-host>   # in another shell
    2.  Edit .env so DATABASE_URL points at localhost:5433
    3.  pip install -r scripts/requirements.txt               # first time only
    4.  npm run db:generate-audio
    5.  git add public/audio && git commit -m "audio" && git push
    6.  On EC2: sudo /opt/chinese-app/scripts/deploy.sh
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

import edge_tts
import psycopg2
from psycopg2.extras import RealDictCursor

# Best-effort .env load (the npm script already does this via tsx; the Python
# entrypoint doesn't, so we do it here).
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
WORDS_DIR = ROOT / "public" / "audio" / "words"
SENTS_DIR = ROOT / "public" / "audio" / "sentences"
DIALOGUE_DIR = ROOT / "public" / "audio" / "dialogue"

# Words and Tatoeba sentences use Xiaoxiao. Dialogue lines alternate by
# speaker so HSK textbook dialogues sound like an actual conversation.
VOICE = "zh-CN-XiaoxiaoNeural"
SPEAKER_VOICE = {
    "A": "zh-CN-XiaoxiaoNeural",  # female
    "B": "zh-CN-YunxiNeural",     # male
    "C": "zh-CN-YunyangNeural",   # male (news)
    "D": "zh-CN-XiaoyiNeural",    # female
}
DEFAULT_DIALOGUE_VOICE = "zh-CN-XiaoxiaoNeural"

# Small inter-call delay to be polite to the Edge endpoint.
INTER_CALL_DELAY_S = 0.05

# Commit DB updates in batches so a Ctrl-C doesn't lose all work.
COMMIT_EVERY = 25

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("DATABASE_URL is not set. Add it to .env or export it.", file=sys.stderr)
    sys.exit(1)


async def synthesize(text: str, out_path: Path, voice: str = VOICE) -> None:
    """Run edge-tts to produce out_path. Caller ensures parent dir exists."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(str(out_path))


async def process_dialogue_lines(conn, cur) -> None:
    """Per-line dialogue audio for the section 5.9 Listen step. Voice is
    chosen by speaker letter so A/B dialogues sound like real conversations."""
    cur.execute(
        """SELECT id, simplified, speaker FROM dialogue_lines
           WHERE audio_path IS NULL ORDER BY id"""
    )
    rows = cur.fetchall()
    print(f"[dialogue] {len(rows)} pending")
    if not rows:
        return

    for i, row in enumerate(rows, start=1):
        rid = row["id"]
        text = row["simplified"]
        speaker = (row["speaker"] or "").strip().upper()
        voice = SPEAKER_VOICE.get(speaker, DEFAULT_DIALOGUE_VOICE)
        out = DIALOGUE_DIR / f"{rid}.mp3"
        url = f"/audio/dialogue/{rid}.mp3"
        if not out.exists():
            try:
                await synthesize(text, out, voice)
            except Exception as e:  # noqa: BLE001
                print(f"  ! dialogue {rid} {text!r} failed: {e}", file=sys.stderr)
                continue
            await asyncio.sleep(INTER_CALL_DELAY_S)
        cur.execute("UPDATE dialogue_lines SET audio_path = %s WHERE id = %s", (url, rid))
        if i % COMMIT_EVERY == 0:
            conn.commit()
            print(f"  · {i}/{len(rows)}")
    conn.commit()
    print(f"[dialogue] done — committed {len(rows)} audio_path rows.")


async def process(
    conn,
    cur,
    *,
    label: str,
    select_sql: str,
    update_sql: str,
    out_dir: Path,
    url_prefix: str,
) -> None:
    cur.execute(select_sql)
    rows = cur.fetchall()
    print(f"[{label}] {len(rows)} pending")
    if not rows:
        return

    for i, row in enumerate(rows, start=1):
        rid, text = row["id"], row["simplified"]
        out = out_dir / f"{rid}.mp3"
        url = f"{url_prefix}/{rid}.mp3"
        if not out.exists():
            try:
                await synthesize(text, out)
            except Exception as e:  # noqa: BLE001
                print(f"  ! {label} {rid} {text!r} failed: {e}", file=sys.stderr)
                # Don't update audio_path if generation failed.
                continue
            await asyncio.sleep(INTER_CALL_DELAY_S)
        cur.execute(update_sql, (url, rid))
        if i % COMMIT_EVERY == 0:
            conn.commit()
            print(f"  · {i}/{len(rows)}")
    conn.commit()
    print(f"[{label}] done — committed {len(rows)} audio_path rows.")


async def main() -> None:
    WORDS_DIR.mkdir(parents=True, exist_ok=True)
    SENTS_DIR.mkdir(parents=True, exist_ok=True)
    DIALOGUE_DIR.mkdir(parents=True, exist_ok=True)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)

    await process(
        conn, cur,
        label="words",
        select_sql=(
            "SELECT id, simplified FROM words "
            "WHERE (hsk2_level IN (1, 2) OR hsk3_level IN (1, 2)) "
            "AND audio_path IS NULL ORDER BY id"
        ),
        update_sql="UPDATE words SET audio_path = %s WHERE id = %s",
        out_dir=WORDS_DIR,
        url_prefix="/audio/words",
    )

    await process(
        conn, cur,
        label="sentences",
        select_sql=(
            "SELECT id, simplified FROM sentences "
            "WHERE max_hsk_level <= 2 AND audio_path IS NULL ORDER BY id"
        ),
        update_sql="UPDATE sentences SET audio_path = %s WHERE id = %s",
        out_dir=SENTS_DIR,
        url_prefix="/audio/sentences",
    )

    await process_dialogue_lines(conn, cur)

    cur.close()
    conn.close()


if __name__ == "__main__":
    asyncio.run(main())
