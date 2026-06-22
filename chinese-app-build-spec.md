# Chinese Study App — Full Build Specification (Next.js)

> **Context for Claude Code:** This is a PERSONAL, non-published app for one user studying Mandarin (currently HSK 1–2, will grow to higher levels). An existing Next.js app already contains static HSK 1–2 book content and static character-only flashcards.
>
> **⚠️ CRITICAL CONSTRAINT — EXTEND, DO NOT REBUILD:** This project must be built **on top of the existing app**. Do NOT scaffold a new Next.js project, do NOT rewrite the app from scratch, and do NOT delete or replace existing pages, components, or content unless explicitly instructed. Before writing any code: explore the existing codebase (folder structure, router type, styling system, where the book content and flashcard data live), summarize what you found back to the user, and propose how each new feature will integrate with or reuse what already exists. Existing static content (book lessons, flashcard data) is the SOURCE DATA for the new system — migrate it into the database, never discard it. When a new feature supersedes an old page (e.g. the interactive reader replacing a static lesson page), keep the old page working until the user confirms the replacement.
>
> The goal is to evolve the current app into a complete study platform covering **reading, listening, speaking (shadowing), writing (stroke order), vocabulary SRS, and grammar**. Build incrementally in the phases described at the end.

---

## 1. Tech Stack & Architecture

- **Framework:** Next.js (App Router preferred; confirm with user which router the existing app uses).
- **Language:** TypeScript.
- **Database:** SQLite via `better-sqlite3` (single user, local-first, zero config) accessed only from server code (Route Handlers / Server Actions). Alternative: Prisma + SQLite if the user prefers an ORM.
- **Styling:** Whatever the app already uses (likely Tailwind). Do not introduce a new styling system.
- **Audio storage:** Pre-generated MP3 files in `/public/audio/words/{word}.mp3` and `/public/audio/sentences/{sentenceId}.mp3`.
- **State:** React state + server actions. No Redux needed.
- **Data pipeline:** One-off Node.js (or Python) scripts in a `/scripts` folder that download sources, build the SQLite DB, and batch-generate TTS audio. These run on the dev machine, not in the app.

### Suggested folder layout
```
/app
  /dashboard            ← stats, streak, due reviews
  /review               ← SRS review session (all card types)
  /vocab                ← browse/search vocabulary
  /vocab/[word]         ← word detail: meanings, sentences, strokes, audio
  /course               ← EXISTING module with HSK book content — extend it (lesson list)
  /course/[lessonId]    ← guided interactive lesson flow (section 5.9)
  /reader               ← list of texts (book lessons + imported texts)
  /reader/[textId]      ← tap-to-read interface
  /writing              ← stroke-order practice queue
  /listening            ← dictation & audio-first drills
  /shadowing            ← sentence shadowing with mic recording
  /grammar              ← grammar points by level with exercises
/lib
  /db.ts                ← better-sqlite3 connection (server-only)
  /fsrs.ts              ← FSRS scheduling logic
  /segment.ts           ← word segmentation helpers
/scripts
  01-download-sources.ts
  02-build-vocab-db.ts
  03-match-sentences.ts
  04-generate-audio.(py|ts)
  05-import-book-content.ts
/public/audio/...
/data                   ← raw downloaded source files (gitignored)
```

---

## 2. Data Sources — Exact Locations

Download these in `scripts/01-download-sources.ts` (or manually) into `/data`:

### 2.1 HSK vocabulary (master word list)
- **Repo:** `https://github.com/drkameleon/complete-hsk-vocabulary`
- **What to use:** `complete.json` (every word, with both HSK 2.0 and 3.0 level tags) or per-level files under `wordlists/inclusive/old/{1..6}.json` (HSK 2.0 — matches the user's HSK 1–2 books) and `wordlists/inclusive/new/{1..7}.json` (HSK 3.0).
- **Fields available:** simplified, traditional, pinyin, level tags (`l`), frequency rank (`q`), part of speech (`p`), cleaned meanings (`m`), classifiers.
- **Raw file example:** `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json`
- Backup/cross-check source for HSK 3.0: `https://github.com/ivankra/hsk30` (`hsk30.csv`, includes traditional + variants, validated against the official chinesetest.cn database).

### 2.2 Dictionary (definitions beyond HSK lists)
- **CC-CEDICT**, the standard open Chinese→English dictionary (~120k entries), CC BY-SA 4.0.
- **Download:** `https://www.mdbg.net/chinese/dictionary?page=cc-cedict` → file `cedict_1_0_ts_utf-8_mdbg.txt.gz`
- **Format:** one entry per line: `Traditional Simplified [pin1 yin1] /meaning 1/meaning 2/`
- Use it to enrich word detail pages and to define unknown words encountered in the reader.

### 2.3 Example sentences
- **Primary (pre-processed, easiest):** `https://github.com/krmanik/Chinese-Example-Sentences` — ~63k Tatoeba sentences as SQLite (`sen_data.db`) and TSV with columns: simplified, traditional, pinyin, English.
- **Primary (fresh, larger):** Tatoeba sentence-pair export: `https://tatoeba.org/en/downloads` → "Sentence pairs" → language A: **Mandarin Chinese (cmn)**, language B: **English (eng)** (or Spanish if preferred). CC BY licensed.
- Tatoeba also has native audio for a subset of sentences: `https://tatoeba.org/en/audio/index/cmn` (audio license varies per contributor; fine for personal use).

### 2.4 Stroke order + character decomposition
- **Hanzi Writer** (JS library for stroke animation + tracing quizzes): `npm install hanzi-writer` — docs at `https://hanziwriter.org`. Character stroke data loads automatically from its CDN (`hanzi-writer-data` package can be installed for offline use: `npm install hanzi-writer-data`).
- **Make Me a Hanzi** (decomposition into components/radicals, etymology): `https://github.com/skishore/makemeahanzi` — use `dictionary.txt` (one JSON object per line with `character`, `decomposition`, `radical`, `etymology`).

### 2.5 Grammar
- **Chinese Grammar Wiki (AllSet Learning):** `https://resources.allsetlearning.com/chinese/grammar/` — grammar points organized by HSK level (A1/A2 ≈ HSK 1–2). For personal use, scrape/copy the HSK 1–2 grammar point lists: `https://resources.allsetlearning.com/chinese/grammar/HSK_1_grammar_points` and `.../HSK_2_grammar_points`. Each point has a structure pattern (e.g. `Subj. + 比 + Obj. + Adj.`) and example sentences.
- **hskhsk.com grammar example sentences** (from official HSK docs, with pinyin + English): `https://hskhsk.com/word-lists` → grammar example TSV files for HSK 1–3.

### 2.6 Audio generation (TTS)
- **edge-tts** (free, no API key, natural Microsoft neural voices): Python package `pip install edge-tts`.
  - Recommended voices: `zh-CN-XiaoxiaoNeural` (female), `zh-CN-YunxiNeural` (male). Generate both for variety.
  - CLI example: `edge-tts --voice zh-CN-XiaoxiaoNeural --text "我喜欢喝茶" --write-media out.mp3`
- Batch-generate one MP3 per vocab word and per selected example sentence (script 04). Rate-limit politely (e.g. small sleep between calls); ~150–300 sentences/minute is realistic.

### 2.7 Word segmentation (for the reader)
- **Node option:** `npm install jieba-js` or `@node-rs/jieba` (fast, native bindings — preferred).
- **Python option (pipeline only):** `pip install jieba`.
- Used to split book lesson text into tappable words and to match sentences to vocab.

### 2.8 FSRS spaced repetition
- **ts-fsrs:** `npm install ts-fsrs` — TypeScript implementation of the FSRS algorithm (`https://github.com/open-spaced-repetition/ts-fsrs`). Use default parameters; expose the four grades: Again / Hard / Good / Easy.

---

## 3. Database Schema (SQLite)

```sql
-- master vocabulary
CREATE TABLE words (
  id INTEGER PRIMARY KEY,
  simplified TEXT NOT NULL UNIQUE,
  traditional TEXT,
  pinyin TEXT NOT NULL,          -- tone marks: nǐ hǎo
  pinyin_numbered TEXT,          -- ni3 hao3 (for typing answers)
  hsk2_level INTEGER,            -- old HSK level (1-6), nullable
  hsk3_level INTEGER,            -- new HSK level (1-7), nullable
  frequency_rank INTEGER,
  pos TEXT,                      -- JSON array of parts of speech
  meanings TEXT NOT NULL,        -- JSON array of English meanings
  audio_path TEXT                -- /audio/words/xxx.mp3
);

-- example sentences
CREATE TABLE sentences (
  id INTEGER PRIMARY KEY,
  simplified TEXT NOT NULL,
  traditional TEXT,
  pinyin TEXT,
  english TEXT NOT NULL,
  source TEXT,                   -- 'tatoeba' | 'hsk-book' | 'grammar-wiki'
  audio_path TEXT,
  max_hsk_level INTEGER          -- highest HSK level of any word it contains (difficulty proxy)
);

-- which words appear in which sentences (built with jieba)
CREATE TABLE sentence_words (
  sentence_id INTEGER REFERENCES sentences(id),
  word_id INTEGER REFERENCES words(id),
  PRIMARY KEY (sentence_id, word_id)
);

-- one SRS card per (word, modality)
CREATE TABLE cards (
  id INTEGER PRIMARY KEY,
  word_id INTEGER NOT NULL REFERENCES words(id),
  card_type TEXT NOT NULL,       -- 'recognition' | 'recall' | 'listening' | 'writing' | 'cloze'
  -- FSRS state:
  due TEXT NOT NULL,             -- ISO datetime
  stability REAL, difficulty REAL,
  elapsed_days INTEGER, scheduled_days INTEGER,
  reps INTEGER DEFAULT 0, lapses INTEGER DEFAULT 0,
  state INTEGER DEFAULT 0,       -- 0 new, 1 learning, 2 review, 3 relearning
  last_review TEXT,
  UNIQUE(word_id, card_type)
);

CREATE TABLE review_log (
  id INTEGER PRIMARY KEY,
  card_id INTEGER REFERENCES cards(id),
  rating INTEGER NOT NULL,       -- 1 again, 2 hard, 3 good, 4 easy
  reviewed_at TEXT NOT NULL,
  elapsed_ms INTEGER             -- time spent on the card
);

-- reader texts (book lessons + anything pasted in)
CREATE TABLE texts (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,            -- raw simplified Chinese
  hsk_level INTEGER,
  source TEXT,                   -- 'hsk1-book' | 'hsk2-book' | 'custom'
  created_at TEXT
);

-- grammar points
CREATE TABLE grammar_points (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,           -- e.g. "Comparisons with 比"
  pattern TEXT NOT NULL,         -- e.g. "A + 比 + B + Adj."
  explanation TEXT,
  hsk_level INTEGER,
  examples TEXT                  -- JSON array of {zh, pinyin, en}
);

-- character decomposition cache (from Make Me a Hanzi)
CREATE TABLE characters (
  char TEXT PRIMARY KEY,
  decomposition TEXT,
  radical TEXT,
  etymology TEXT                 -- JSON
);
```

---

## 4. Data Pipeline Scripts (run once, then occasionally)

### `01-download-sources.ts`
Download into `/data`: complete.json (drkameleon), CC-CEDICT gz, Tatoeba cmn-eng pairs (or krmanik sen_data.db), Make Me a Hanzi dictionary.txt. Unzip where needed.

### `02-build-vocab-db.ts`
1. Parse `complete.json`; insert every word with an old-HSK level 1–2 (and optionally levels 3–6 pre-loaded but inactive) into `words`.
2. Parse CC-CEDICT into a lookup map; where a word's meanings are thin, append CEDICT glosses. Keep CEDICT in a separate table or in-memory only — full import optional.
3. Parse Make Me a Hanzi `dictionary.txt`; insert every character that appears in any HSK 1–2 word into `characters`.
4. Create 3 cards per word initially: `recognition` (字→meaning), `listening` (audio→meaning), `writing` (meaning/pinyin→draw it). `recall` and `cloze` can be enabled later per word.

### `03-match-sentences.ts` — the key script
For each sentence in the Tatoeba set:
1. Segment with jieba → list of words. Strip punctuation.
2. Look up each segment in `words`. Compute coverage = % of segments that are known HSK words, and `max_hsk_level`.
3. Keep the sentence if **coverage ≥ 90%** and length is 4–20 characters; insert into `sentences` + `sentence_words`.
4. For each HSK 1–2 word, ensure at least 2–3 sentences exist where **every** word is HSK ≤ 2 ("i+1" sentences). Log words with zero matches so the user can hand-write or AI-generate examples for them.

### `04-generate-audio.py`
Using edge-tts, generate MP3 for: every word (voice Xiaoxiao), every kept sentence (alternate Xiaoxiao/Yunxi). Save to `/public/audio/...`, update `audio_path` columns. Make idempotent (skip existing files).

### `05-import-book-content.ts`
Take the user's existing static HSK 1–2 lesson content (ask the user where it lives in the repo — likely JSON/TSX/MD) and insert each lesson's dialogues/texts into `texts` with the right level and source. Do **not** delete the original pages until the reader replaces them.

---

## 5. Feature Specifications

### 5.1 SRS Review (`/review`) — build first
- Query cards where `due <= now`, ordered: learning → review → new (cap new cards/day, default 15, configurable).
- Card front depends on `card_type`:
  - **recognition:** show 汉字 → user thinks → reveal pinyin + meaning + 1–2 example sentences (with the word highlighted) + autoplay word audio on reveal.
  - **listening:** autoplay word or sentence audio, hide all text → reveal characters + pinyin + meaning. Replay button. Keyboard shortcut `R` to replay.
  - **writing:** show meaning + pinyin → user draws the character(s) with Hanzi Writer quiz mode (`HanziWriter.create(...).quiz()`); each character graded stroke-by-stroke. Auto-rate: all strokes right on first try = Good, with hints = Hard, gave up = Again (user can override).
  - **cloze (later):** sentence with the word blanked; reveal.
- Grade buttons Again/Hard/Good/Easy → `ts-fsrs` reschedules → write `review_log`.
- Show session progress (x/y) and a finished screen with stats.
- Keyboard shortcuts: Space = reveal, 1–4 = grade.

### 5.2 Word detail (`/vocab/[word]`)
- Big character display, traditional variant, pinyin, meanings, POS, HSK level, frequency.
- Audio play button.
- Hanzi Writer animation per character (loop on click) + component breakdown from `characters` table (e.g. 好 = 女 + 子, with each component linked if it's also a word).
- All example sentences containing the word (from `sentence_words`), each with audio, pinyin toggle, English toggle.
- Buttons: "practice writing now", state of each card type (due dates).

### 5.3 Reader (`/reader/[textId]`)
- Render text segmented into word spans (segment server-side with jieba, cache result).
- Tap/click a word → popover: pinyin, meaning, audio, link to detail, and **"add to review"** if it's a word not yet in the active deck (e.g. an HSK 3+ word encountered early).
- Toggles: show pinyin above all words (ruby text), show translation per paragraph (if available).
- Words colored by knowledge state: new (underlined), learning (amber), mature (no decoration). Read state from `cards`.
- "Listen to text" button: play sentence audio sequentially if available, else generate via TTS on demand (server route calling edge-tts is fine for personal use, or pre-generate during import).
- Paste-in importer at `/reader`: textarea → creates a `texts` row → instantly readable. This lets the user import any article/story.

### 5.4 Shadowing (`/shadowing`)
- Pick a sentence (filtered by HSK level / "due words" / random).
- Flow: play native/TTS audio → user hits record (MediaRecorder API) → stop → UI shows two play buttons: "native" and "you", for A/B comparison. Loop mode: auto-replay native N times.
- Optional later: render simple waveform of both recordings (e.g. `wavesurfer.js`) to visually compare rhythm. No scoring needed — ear comparison is the method.
- Keep a "shadowed today" counter for the dashboard.

### 5.5 Listening drills (`/listening`)
- **Dictation mode:** play sentence audio → user types pinyin or hanzi (IME) → diff against answer, highlight mistakes.
- **Tone drill:** play a word → user picks the tone pattern (e.g. buttons `1-3`, `3-3`, `4-2`...). Generate distractor options. Track per-tone-pair accuracy and bias future drills toward weak pairs.

### 5.6 Writing practice (`/writing`)
- Queue = writing cards due today. Full-screen Hanzi Writer quiz canvas, mobile-friendly (touch).
- After each character: show decomposition + etymology hint from Make Me a Hanzi.

### 5.7 Grammar (`/grammar`)
- List grammar points by HSK level (from `grammar_points`, populated manually or scraped from Grammar Wiki HSK 1–2 lists).
- Each point page: pattern, explanation, examples with audio.
- Exercise type to implement: **sentence scramble** — take an example sentence, segment it, shuffle the word chips, user drags into order, check. Cheap to build, very effective for Chinese word order.

### 5.8 Dashboard (`/`or `/dashboard`)
- Due today (by card type), new remaining, streak (days with ≥1 review), total words by state (new/learning/mature), HSK 1 and HSK 2 coverage % (mature words / level size), weakest words (most lapses), tone-pair accuracy heatmap (5×5 grid).

---

### 5.9 Course module (`/course`, `/course/[lessonId]`) — enhanced HSK book content
> **NAMING:** The existing module in the codebase is named **`course`** — extend that module and its routes/components. Do NOT create a new parallel `/lessons` module or rename `course` to `lessons`. In this spec, "course" = the module containing the HSK book content; a "lesson" = one unit/chapter inside the course (DB tables below keep the `lesson_` prefix because they represent those units, and that's fine — the route and module name stay `course`).

The existing static book lessons must become structured, interactive units. **Migrate, don't discard:** parse the current static lesson content into the schema below.

**Additional schema:**
```sql
CREATE TABLE lessons (
  id INTEGER PRIMARY KEY,
  book TEXT NOT NULL,            -- 'hsk1' | 'hsk2'
  number INTEGER NOT NULL,       -- lesson number within the book
  title TEXT NOT NULL,
  notes TEXT                     -- cultural/usage notes, markdown
);

CREATE TABLE lesson_dialogues (
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id),
  position INTEGER               -- ordering when a lesson has several texts
);

CREATE TABLE dialogue_lines (
  id INTEGER PRIMARY KEY,
  dialogue_id INTEGER REFERENCES lesson_dialogues(id),
  position INTEGER NOT NULL,
  speaker TEXT,                  -- 'A' | 'B' | null for narrative text
  simplified TEXT NOT NULL,
  pinyin TEXT,
  english TEXT,
  audio_path TEXT                -- per-line TTS
);

CREATE TABLE lesson_words (      -- lesson vocab list as references
  lesson_id INTEGER REFERENCES lessons(id),
  word_id INTEGER REFERENCES words(id),
  PRIMARY KEY (lesson_id, word_id)
);

CREATE TABLE lesson_grammar (
  lesson_id INTEGER REFERENCES lessons(id),
  grammar_point_id INTEGER REFERENCES grammar_points(id),
  PRIMARY KEY (lesson_id, grammar_point_id)
);

CREATE TABLE lesson_progress (
  lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id),
  steps_completed TEXT,          -- JSON array of completed step keys
  best_score REAL,
  last_studied TEXT
);

CREATE TABLE lesson_questions (  -- pre-authored/AI-generated comprehension Qs
  id INTEGER PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id),
  question TEXT NOT NULL,        -- in Chinese where possible
  options TEXT NOT NULL,         -- JSON array
  answer_index INTEGER NOT NULL
);
```

**Audio generation:** extend script 04 — per dialogue line, TTS with **two alternating voices by speaker** (A = zh-CN-XiaoxiaoNeural, B = zh-CN-YunxiNeural) so dialogues sound like real conversations. Also build a concatenated "full dialogue" playback (sequential per-line playback is fine; no file merging needed).

**Lesson page = guided flow of steps** (stepper UI, each step skippable, progress saved in `lesson_progress`):
1. **Warm-up:** mini review of due cards belonging to earlier lessons (reuse `/review` session component, capped at ~10 cards).
2. **Listen first:** play full dialogue with text HIDDEN (show only speaker avatars / progress). Replay allowed. Then "show text" advances.
3. **Read:** dialogue rendered with the reader's tap-to-read component (per-word popover: pinyin, meaning, audio, add-to-SRS). Toggles for pinyin (ruby) and English per line. Tap any line to hear it.
4. **Vocab:** lesson word list with state badges (new/learning/mature). Button "add this lesson's words to my review queue" → creates/activates cards for all `lesson_words`.
5. **Grammar:** the lesson's grammar points (pattern + explanation) each followed by a **sentence scramble** exercise built from dialogue lines or grammar examples.
6. **Practice set (auto-generated, no manual authoring):**
   - Cloze: dialogue lines with a lesson word blanked (3–4 distractor options from same lesson).
   - Dictation: play a line's audio → type hanzi or pinyin → diff and highlight errors.
   - Matching: lesson words ↔ meanings.
7. **Role-play / shadowing:** pick speaker A or B; app plays the other speaker's lines and pauses on yours — record via mic, then reveal the line and play native vs. you (reuse the `/shadowing` recorder component).
8. **Comprehension quiz:** questions from `lesson_questions`. Generate these once per lesson via the Anthropic API during import (script 05 extension): prompt Claude with the dialogue + English and ask for 3–5 multiple-choice comprehension questions as JSON; store them — do NOT call the API at study time.
9. **Done screen:** score summary, words added, link to next lesson.

**Integration rules:**
- The lesson reader and the standalone `/reader` share one tap-to-read component.
- Completing step 4 is what introduces lesson vocab into the SRS (lessons drive the queue; the queue links back: review cards show "from HSK1 Lesson 4").
- **Resurfacing:** old dialogue lines feed the `/listening` dictation pool and `/shadowing` sentence pool once their lesson is completed, so book content keeps recurring after completion.
- Update script 05: parse existing static lesson content into `lessons` / `lesson_dialogues` / `dialogue_lines` / `lesson_words` (ask the user for the current content format first); keep old static pages until the new lesson flow is confirmed working.

### 5.10 Workbook-style practice (`/workbook`) — generate equivalent drills from owned/open material
> **IMPORTANT — what this module is and isn't:** This reproduces the *function* of HSK workbooks (drills, answer-checking, audio comprehension) from material the user can legitimately use. It must NOT bundle, scrape, or reproduce the contents of any published workbook (their specific exercises, answer keys, illustrations, or audio are copyrighted). The three legitimate inputs are: (a) audio the user ripped from a workbook they personally own, kept as their private local copy; (b) exercises auto-generated by the app from vocab/sentences already in the DB; (c) openly-licensed images. Exercise *formats* are not copyrightable — only a publisher's specific wording is, so the app authors its own items.

**Schema:**
```sql
CREATE TABLE exercises (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,            -- 'cloze' | 'reorder' | 'dictation' | 'matching' | 'listening_choice' | 'pinyin_tone' | 'translate'
  prompt TEXT,                   -- question text / instruction (app-generated)
  payload TEXT NOT NULL,         -- JSON: items, options, blanked indices, etc.
  answer TEXT NOT NULL,          -- JSON: correct answer(s)
  source_sentence_id INTEGER REFERENCES sentences(id),
  lesson_id INTEGER REFERENCES lessons(id),  -- nullable: links to a course unit
  hsk_level INTEGER,
  audio_path TEXT                -- owned-audio clip OR generated TTS
);

CREATE TABLE exercise_attempts (
  id INTEGER PRIMARY KEY,
  exercise_id INTEGER REFERENCES exercises(id),
  correct INTEGER NOT NULL,      -- 0/1
  user_answer TEXT,
  attempted_at TEXT NOT NULL
);

CREATE TABLE media_assets (      -- openly-licensed images attached to words/exercises
  id INTEGER PRIMARY KEY,
  word_id INTEGER REFERENCES words(id),
  path TEXT NOT NULL,            -- /public/images/...
  source TEXT,                   -- 'unsplash' | 'wikimedia' | 'openverse' | 'generated'
  license TEXT,                  -- e.g. 'CC0', 'CC BY 4.0'
  attribution TEXT               -- author + link, for CC BY
);
```

**Exercise generator (`scripts/06-generate-exercises.ts`) — builds items from DB content, no manual authoring:**
- **cloze:** take a sentence, blank one target word, generate 3 distractors (same POS, similar HSK level, ideally same radical or semantic field). Answer = original word.
- **reorder:** segment a sentence into word chips, store shuffled order in payload, answer = correct order.
- **dictation:** pick a sentence with audio; payload = audio only; answer = hanzi (accept pinyin variant). Reuse the `/listening` diff logic.
- **matching:** N words ↔ N meanings from one lesson/level.
- **listening_choice:** play audio of word/sentence; 4 meaning options.
- **pinyin_tone:** show/play a word; user marks the tone pattern; distractors = other tone combos.
- **translate:** show English; user types Chinese (or assembles from a word bank); fuzzy-check against known sentence translation (exact match not required — accept if all content words present).
- Tag each generated exercise with `hsk_level` and link to a `lesson_id` where the source maps to a course unit, so the workbook can be browsed "by lesson" to mirror the user's study order.

**Answer checking:**
- Objective types (cloze, reorder, matching, listening_choice, pinyin_tone) check exactly.
- Open types (dictation, translate) use normalized comparison: strip punctuation/spaces, compare hanzi; for pinyin accept numbered or marked tones; highlight per-character diffs. Show the model answer after submission. Wrong answers can push the underlying word's SRS card to "Again."

**Using audio the user already owns (their own workbook copy):**
- Provide an import tool at `/workbook/import`: user drops in audio files (or a folder) that came with a workbook they bought; the app stores them under `/public/audio/owned/` and lets the user tag each clip (lesson, track number) and attach it to a `listening_choice` or `dictation` exercise they create.
- Optional: a simple split tool (ffmpeg via a one-off script) to cut a long track into per-question clips by timestamps the user enters. Keep these files local to the user's machine; this is their private copy of media they own.
- Answer keys: provide a small form so the user can type the correct answers from their own book into `exercises.answer` for any exercises they recreate. The app stores the user's transcription; it does not ship publisher answer keys.

**Open-licensed images (`scripts/07-fetch-images.ts`, optional):**
- For concrete/picturable words, fetch a CC0 / CC-BY image and store it in `media_assets` with license + attribution. Sources: Openverse API (`https://api.openverse.org/v1/images/`, aggregates CC-licensed images, filterable by license), Wikimedia Commons API, or Unsplash API (free tier, Unsplash License). Always store `license` and `attribution` and render attribution on the word page for CC-BY assets.
- Alternatively generate simple illustrative images yourself; tag `source='generated'`.
- Show the image on `/vocab/[word]` and as the prompt in picture-matching exercises (workbook-style "match the word to the picture").

**UI (`/workbook`):**
- Browse exercise sets by HSK level or by course lesson; "start set" runs a session like a paper workbook page (several items, then a graded summary with corrections).
- "Mistakes" view: items answered wrong, re-drillable.
- Per-set and per-type accuracy feeds the dashboard.

## 6. Build Phases (do in this order, each phase shippable)

**Phase 0 — Codebase audit (required first step):** Read the existing app. Map out: router type (App vs Pages), styling approach, where HSK 1–2 book content lives and its format, where flashcard data lives and its format, existing components worth reusing (cards, layouts, navigation). Present this map to the user and agree on an integration plan before touching anything.

**Phase 1 — Data foundation:** scripts 01–03, SQLite db created, `/vocab` browse + `/vocab/[word]` detail pages reading from the DB. Reuse existing UI components and navigation where possible. Verify sentence matching quality manually with the user.

**Phase 2 — SRS core:** `ts-fsrs` integration, `cards` + `review_log`, `/review` with recognition cards only. Migrate the user's existing flashcard progress if any exists (ask).

**Phase 3 — Audio:** script 04 (batch TTS), add audio to word pages, sentences, and add the listening card type to `/review`.

**Phase 4 — Writing:** Hanzi Writer integration on word pages + writing card type + `/writing` queue + decomposition display.

**Phase 5 — Reader + Course:** script 05 (parse book lessons into the lessons schema), segmented tap-to-read UI, paste-in importer, knowledge-state coloring. Then the guided lesson flow inside the existing **course** module (section 5.9): listen-first, read, vocab→SRS, auto-generated exercises. Role-play and comprehension quiz steps can land in Phase 6 alongside the recorder.

**Phase 6 — Speaking & listening:** `/shadowing` recorder, dictation, tone drills.

**Phase 7 — Grammar + Workbook + dashboard:** grammar points + sentence scramble; the workbook-style exercise generator (section 5.10) with answer-checking, owned-audio import, and optional open-licensed images; stats dashboard.

---

## 7. Conventions & Notes for Claude Code

- **Extend, never rebuild:** integrate into the existing project. No new scaffolding (`create-next-app`), no framework/styling migrations, no mass deletions. Prefer adding routes and components alongside what exists. Existing flashcard and book data must be migrated into the DB, not thrown away.
- All DB access server-side only (`better-sqlite3` cannot run in the browser). Use Route Handlers or Server Actions; never import `lib/db.ts` into client components.
- Audio filenames: hash or URL-encode the word (Chinese chars in filenames are fine on disk, but URL-encode in `<audio src>`).
- Pinyin display: store tone-marked pinyin; convert numbered→marked with the `pinyin-utils` npm package or a small util.
- Everything offline-capable: no external API calls at runtime except optional on-demand TTS.
- Don't over-engineer: single user, no auth, no multi-tenancy, SQLite file in project root (gitignored), `npm run db:rebuild` script to re-run the pipeline.
- When ambiguous (existing folder structure, router type, styling system, where the current book content lives, daily new-card limit), **ask the user before assuming**.