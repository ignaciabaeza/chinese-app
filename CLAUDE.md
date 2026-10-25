@AGENTS.md

---

# 汉语学习 — Chinese Learning App

A mobile-first HSK learning app built around the official **HSK Standard Course** curriculum (Beijing Language and Culture University Press). Lessons are the primary unit; vocabulary, grammar points, characters, dialogues, and exercises hang off each lesson. Includes spaced-repetition flashcards and mock exams, with progress sync via PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4.2 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database | PostgreSQL via `pg` (node-postgres) |
| Auth | JWT (jsonwebtoken) in httpOnly cookies |
| Passwords | bcryptjs (12 rounds) |
| React | 19.2.4 |

### Critical Next.js 16 differences from earlier versions
- `cookies()` is **async** — must `await cookies()`
- `params` in route segments is a **Promise**
- `viewport` must be a **separate export** (`export const viewport: Viewport`), not inside `metadata`
- GET route handlers are dynamic by default
- Middleware file is `proxy.ts` (not `middleware.ts`)
- Read `node_modules/next/dist/docs/` before touching routing, middleware, or server APIs

### Tailwind CSS v4 differences
- No `tailwind.config.js` — configuration lives in CSS via `@theme {}` block
- Import with `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Custom tokens defined in `@theme {}` are available as Tailwind utility classes

---

## Architecture Overview

**Content is static; user state is in Postgres.**

- **Lesson content** (vocabulary, dialogues, grammar, characters, exercises, culture notes) lives as JSON files under `data/hsk{N}/lessons/{M}.json` — the source of truth. Each level has an `index.ts` that combines authored lessons with stubs. `lib/content.ts` is the entry point for JSON lookups.
- **Derived DB content:** `npm run db:import-lessons` (scripts/05) copies the JSON into `lessons` / `lesson_dialogues` / `dialogue_lines` / `lesson_words` (course stepper) and `texts` (reader). `words` / `sentences` / `characters` come from the open-data pipeline (scripts 01–03: HSK lists, CC-CEDICT, Tatoeba, makemeahanzi).
- **One study method: Leitner boxes** (`lib/leitner.ts` server, rules in `lib/leitner-rules.ts`) over `cards` + `review_log`. Box 0 = never studied; boxes 1–5 are due again 1/2/4/8/16 local days later. "Know it" on a due card moves it up one box (box 5 stays, next check in 30 days); "Know it" on a card that isn't due yet changes nothing; "Don't know" sends it to box 1, due again today. Card types: `recognition`, `listening`, `writing`, one card per (user, word or custom deck word, type). Everything that grades moves these boxes: /review, /writing, /flashcards drill (recognition), the /listening tone drill (listening). Every study page can be scoped to one of the user's decks (`DeckPicker`, `?deck=ID`). Signed-out users can browse but nothing is saved. The old FSRS columns on `cards` (state, stability, …) are unused since migration 012.
- **"Today" is per-user local time:** `users.timezone` (reported by the browser via `POST /api/auth/timezone` from `AuthProvider`); use `getUserDay(userId)` from `lib/user-time.ts` for anything daily (new-card quota, reviewed today, streak). Never use `date_trunc('day', NOW())` — the server is UTC.

Content source: HSK Standard Course textbooks (PDFs in `/Users/ignaciabaeza/Documents/chino/hsk1/…hsk4/`). Each lesson mirrors the book's 8 sections — Warm-up, Text (4 situational dialogues + new words), Notes (grammar with pattern tables), Exercises, Pinyin/Pronunciation, Characters (strokes + single-component chars + radicals), Application (pair/group work), Culture (every 5 lessons).

---

## Design System

**Aesthetic:** Traditional Chinese ink-wash / blue-and-white porcelain. Navy background with chrysanthemum pattern, gold accents, parchment panels, moon circle flashcard hero.

**Fonts (Google Fonts, loaded in `app/layout.tsx`):**
- `Noto Serif SC` — Chinese characters (display)
- `Cinzel` — navigation and headings
- `Lora` — body text
- `Cormorant Garamond` — pinyin (italic)

**CSS custom properties (defined in `app/globals.css`):**
```
--bg-primary:    #2D3561   (dark navy background)
--bg-secondary:  #3A4275   (card/panel background)
--bg-parchment:  #E8DEC8   (modal / card-back background)
--accent-gold:   #C9A84C   (primary accent, buttons, active states)
--accent-rose:   #C4857A   (dusty rose, moon circle, error states)
--text-primary:  #F0EDE4   (main text on dark)
--text-muted:    #A09880   (secondary text)
--border-subtle: rgba(201,168,76,0.25)  (subtle gold borders)
```

**Tailwind `@theme` tokens** (same values, usable as Tailwind classes):
- `--color-navy-dark`, `--color-navy`, `--color-gold`, `--color-rose-antique`, `--color-parchment`, `--color-crane`
- `--font-display`, `--font-heading`, `--font-body`, `--font-pinyin`

**Key CSS component classes:**
- `.moon-circle` — dusty rose circular hero for flashcard fronts
- `.parchment-panel` — cream/parchment background panel
- `.btn-gold` / `.badge-gold` — gold accents for buttons / tags
- `.progress-ink` / `.progress-ink-fill` — gold ink progress bar
- `.card-flip` / `.card-inner` / `.card-front` / `.card-back` — 3D card flip (CSS `preserve-3d`)
- `.chinese-xl` / `.chinese-lg` / `.chinese-md` — Noto Serif SC at large sizes
- `.font-pinyin` — Cormorant Garamond italic for pinyin
- `animate-float`, `animate-drift`, `animate-fade-up` — keyframe animations

**Background:** Chrysanthemum SVG pattern encoded as a `data:image/svg+xml` URI in `body { background-image: ... }`, tiled at 200×200px.

---

## Project Structure

```
chinese_app/
├── app/
│   ├── page.tsx                  # Home dashboard (due cards, streak, coverage, weakest words)
│   ├── auth/                     # Login / register
│   ├── course/                   # Course tab: levels → lessons → guided LessonStepper
│   ├── workbook/                 # HSK 2 workbook quiz (components/HSK2Quiz.jsx + data/quizData.js)
│   ├── practice/page.tsx         # Practice tab hub
│   ├── review/                   # Leitner review (recognition + listening cards)
│   ├── writing/                  # Leitner stroke-order cards (HanziWriter)
│   ├── listening/                # Dictation + tone drills
│   ├── shadowing/                # Listen / record / compare
│   ├── flashcards/               # Shuffled deck + user-made decks (decks/[id] editor); drill answers move boxes
│   ├── library/page.tsx          # Library tab hub
│   ├── vocab/                    # Dictionary (DB words) + word detail
│   ├── reader/                   # Tap-to-read texts + paste importer
│   ├── grammar/                  # Grammar points + sentence scramble
│   └── api/                      # auth/*, review/*, dashboard, cards, lessons/*, flashcards, …
├── components/                   # Navigation (4 tabs), AuthProvider, HubPage, drills, …
├── data/hsk{1,2}/                # Authored lesson JSON + registries
├── lib/
│   ├── leitner.ts                # Leitner seeding, queue, grading (row-locked), stats
│   ├── leitner-rules.ts          # Box intervals + nextBox() (isomorphic)
│   ├── dashboard.ts              # Dashboard aggregation
│   ├── user-time.ts              # getUserDay(): user's local "today"
│   ├── review-client.ts          # Client submitGrade() — throws a user-facing message on failure
│   ├── rate-limit.ts             # In-memory auth rate limiter
│   ├── content.ts / types.ts     # JSON lesson content lookups + content types
│   └── auth.ts / db.ts           # JWT + bcrypt helpers; pg pool
└── scripts/                      # Data pipeline 01–05, migrations/, deploy.sh, auto-deploy.sh,
                                  # backup.sh, harden.sh, setup.sh
```

**Navigation** (`components/Navigation.tsx`) has four tabs — Home, Course, Practice, Library. Each tool keeps its own URL; a tab's `match` prefixes decide when it's highlighted. New tools go into a hub page (`/practice` or `/library` via `components/HubPage.tsx`), not into the nav.

**Source PDFs** (not in repo): `/Users/ignaciabaeza/Documents/chino/hsk{1,2,3,4}/HSK-N-Textbook.pdf` and `…Workbook.pdf`. HSK 4 ships as 4A and 4B.

---

## Content Model (lib/types.ts)

All types live in `lib/types.ts`. The lesson JSON files are typed against these.

```ts
type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;
type Bilingual = { hanzi: string; pinyin?: string; english: string };

interface Word { id: string; hanzi: string; pinyin: string; pos: string; english: string; traditional?: string; }
interface ProperNoun { id: string; hanzi: string; pinyin: string; english: string; }
interface DialogueLine { speaker: string; hanzi: string; pinyin: string; english?: string; }
interface Text { situationNumber: number; title: Bilingual; audioRef?: string; dialogue: DialogueLine[]; newWords: Word[]; properNouns?: ProperNoun[]; }
interface PatternTable { columns: string[]; rows: string[][]; }
interface GrammarPoint { id: string; number: number; title: Bilingual; explanation: Bilingual; examples?: { hanzi; pinyin; english? }[]; patternTable?: PatternTable; }
interface Exercise { number: number; type: "role_play" | "answer_questions" | "describe_pictures" | "fill_blanks" | "match" | "listening_choice"; prompt: Bilingual; items?: { hanzi?; pinyin?; english?; blank? }[]; }
interface PinyinDrill { number: number; title: Bilingual; explanation?: Bilingual; syllables?: string[]; subRules?: { rule: Bilingual; examples: { pinyin; english? }[] }[]; }
interface Stroke { name: { hanzi; pinyin; english }; shape: string; examples: { hanzi; pinyin; english }[]; }
interface CharacterTaught { id: string; hanzi: string; pinyin: string; meaning: string; etymology?: string; strokeCount?: number; }
interface CharacterSection { strokes?: Stroke[]; singleComponentChars?: CharacterTaught[]; radicals?: { hanzi; pinyin; english; examples: string[] }[]; }
interface ClassroomExpression { hanzi: string; pinyin: string; english: string; }
interface CultureNote { title: Bilingual; body: string; }

interface Lesson {
  id: string;              // e.g. "hsk1-3", "hsk2-5"
  level: HSKLevel;
  number: number;
  title: Bilingual;
  theme?: string;
  warmUp?: WarmUp;
  texts?: Text[];
  notes?: GrammarPoint[];
  exercises?: Exercise[];
  pinyinSection?: { drills: PinyinDrill[] };
  characters?: CharacterSection;
  application?: { prompt: Bilingual; activities?: string[] };
  culture?: CultureNote;
  classroomExpressions?: ClassroomExpression[];  // HSK 1 lessons 1–2 only
  stub?: boolean;          // true for lessons that only have title + theme + word hints
}
```

**Content state (current):**
- HSK 1 and HSK 2: all 15 + 15 lessons authored and **all original** (2026-10-21) — same official word lists and grammar topics per lesson as the HSK Standard Course books (grammar ids unchanged), new dialogues with a recurring cast (安娜, 马克, 王明, 刘老师, 小美), culture notes in HSK 1 L5/L10/L15 and HSK 2 L5/L10/L15. Official per-lesson word lists: `scripts/content/hsk{1,2}-vocab.json`.
- **Still textbook-derived:** the `/workbook` page (`data/quizData.js` questions + `public/hsk2/images/` illustrations from the HSK 2 workbook).
- HSK 3, HSK 4, HSK 5, HSK 6: not started.

**Content lookups** via `lib/content.ts`:
- `getLessonsByLevel(level)` — full Lesson[] for a level
- `getLessonSummaries(level)` — lightweight `LessonSummary[]` for list pages
- `getLesson(level, number)` — single Lesson or undefined
- `getAllWords(level)` — flat Word[] with lessonNumber attached (for vocabulary library)
- `getAllGrammar(level)` — GrammarPoint[] with lessonNumber + lessonTitle
- `getAllCharacters(level)` — taught characters with lessonNumber
- `getTotalLessonCount()` — count of authored (non-stub) lessons across all levels

---

## Data Model (Postgres)

Schema lives in `scripts/migrations/` (001 baseline → 012). Key tables:

| Table | Purpose |
|---|---|
| `users` | id (UUID text), email (lowercased, unique), password_hash, **timezone** (IANA, default `'UTC'`) |
| `words` / `sentences` / `sentence_words` / `characters` | Open-data vocabulary, example sentences, stroke data |
| `cards` | Leitner state per (user_id, word_id or deck_card_id, card_type): box (0–5), due, reps, lapses, last_review. `deck_card_id` = a custom word in a user deck |
| `review_log` | One row per grade (card_id, rating 1–4, reviewed_at, elapsed_ms) — source for streaks and "reviewed today" |
| `lessons` / `lesson_dialogues` / `dialogue_lines` / `lesson_words` | Course stepper content (imported from JSON) |
| `lesson_progress` | Per-user completed stepper steps |
| `texts` | Reader texts (lessons + user-pasted) |
| `user_decks` / `user_deck_cards` | User-made /flashcards decks; a card is a dictionary word (`word_id`) or a custom word (`simplified` + `meaning`, optional `pinyin`). Studied with the same Leitner boxes |
| `exercises` / `exercise_attempts` | Orphaned: from the removed DB-backed workbook (migration 007, not in repo). Still holds data; no code reads it |

`card_progress` and `study_sessions` (the old SM-2 system) were dropped in migration 008.

---

## Auth System

- **Rate limiting:** `lib/rate-limit.ts` is an in-memory fixed-window limiter (valid because PM2 runs a single fork-mode process). Login: 20/15 min per IP + 10/15 min per email; register: 5/hour per IP. Client IP comes from nginx's `X-Real-IP`; `npm start` binds to `127.0.0.1` so the header can't be spoofed by hitting :3000 directly.
- **Emails** are normalized with `normalizeEmail()` (trim + lowercase); lookups use `lower(email)` so legacy mixed-case rows still match. Passwords: min 8 chars.

- JWT stored in an `httpOnly`, `SameSite: lax` cookie named `hanyu_token` (30-day expiry)
- Cookie is set/deleted on `NextResponse` objects: `response.cookies.set(...)` / `response.cookies.delete(...)`
- Cookie is read synchronously from `NextRequest`: `request.cookies.get(COOKIE_NAME)?.value`
- `lib/auth.ts` exports: `signToken`, `verifyToken`, `getAuthFromRequest`, `hashPassword`, `comparePassword`, `COOKIE_NAME`, `COOKIE_MAX_AGE`
- `components/AuthProvider.tsx` provides a React context (`useAuth()`) with `{ user, loading, login, register, logout }`
- On mount, `AuthProvider` fetches `/api/auth/me` to restore session state

---

## Pages & Routes

| Tab | Paths |
|---|---|
| Home | `/` |
| Course | `/course`, `/course/[level]`, `/course/[level]/lesson/[number]`, `/workbook` |
| Practice | `/practice` (hub), `/review`, `/writing`, `/listening`, `/shadowing`, `/flashcards`, `/flashcards/decks/[id]` — `?deck=ID` scopes review/writing/listening/flashcards to a user deck |
| Library | `/library` (hub), `/vocab`, `/vocab/[word]`, `/reader`, `/reader/[textId]`, `/grammar`, `/grammar/[gpId]` |
| — | `/auth` |

**Grading contract:** `POST /api/review/grade` takes `{ cardId, rating }` or `{ wordId | deckCardId, cardType, rating }` (rating 1 = Don't know, 3 = Know it) and returns the box move `{ from, to, moved, due }`; 409 if the same card was graded < 2 s ago (double tap — client treats as saved), 404 for someone else's card, 500 on DB failure. Pages must not advance or count a card until `submitGrade()` resolves.

---

## Mobile Design

- Viewport meta set in `layout.tsx` via `export const viewport: Viewport` (Next.js 16 requirement)
- `maximumScale: 1` prevents double-tap zoom on iOS
- Navigation: `md:` breakpoint — desktop uses horizontal links + auth row; mobile uses hamburger dropdown
- All grids use responsive Tailwind classes (`grid-cols-1 sm:grid-cols-2`, etc.)

---

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="generate with: openssl rand -base64 32"
```

---

## First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Fill in .env with real values

# 3. Apply DB schema. Either run setup.sh on EC2 (which creates the schema directly
#    and pre-records all migrations as already applied), or apply migrations manually
#    in order:
for m in scripts/migrations/*.sql; do psql $DATABASE_URL -f "$m"; done

# 4. Run dev server. Locally, DATABASE_URL points at localhost:5433, an SSH
#    tunnel to the PRODUCTION database — open it first in another terminal:
npm run db:tunnel
npm run dev
```

**Deploys:** `scripts/deploy.sh` detects pending migrations under `scripts/migrations/`, takes a `pg_dump` backup to `/var/backups/chinese-app/`, briefly stops the app, applies them all in **one transaction** (`psql -1`), records each in `schema_migrations`, and restarts. deploy.sh builds into `.next-build` (via `NEXT_DIST_DIR`, read in `next.config.ts`) while the live app keeps serving `.next`, then swaps and health-checks; build/migration/health failures roll back to the previous commit. It also installs `/etc/cron.d/chinese-app-backup` (nightly `scripts/backup.sh`, optional S3 copy via `/etc/chinese-app-backup.env`). **Deploys are pull-based:** CI (`.github/workflows/deploy.yml`, job `check`) only runs `tsc --noEmit`; the server's `chinese-app-autodeploy.timer` runs `scripts/auto-deploy.sh` every 2 min, which deploys a new `origin/main` commit once its `check` run succeeded (a failed deploy is skipped until the next push). Logs: `journalctl -u chinese-app-autodeploy`. Server hardening (fail2ban, sshd, nginx) lives in idempotent `scripts/harden.sh`.

---

## Adding a New Lesson

**Content must be original** (the app will be sold): keep the official HSK word list and grammar topics, but write new dialogues, explanations, examples and exercises — never copy the textbook. Validate HSK 1 lessons with `python3 scripts/content/validate_lesson.py data/hsk1/lessons/N.json` (official words all present and used in their situation, characters limited to vocabulary learned up to that lesson, pinyin matches the hanzi; "tones differ" warnings are usually legit sandhi/neutral tones). After deploying, on the server run `npm run db:import-lessons`, then `npm run db:generate-audio`, then restart the app so the new MP3s are served.

The lesson page is a stepper: Listen → Read → Vocab → Grammar → **Practice** (exercises, pronunciation, characters, application, culture from the JSON; `PracticeStep.tsx`) → Done. Exercise conventions: `fill_blanks` items put the answer in `blank`; `match` items are "question — answer" in hanzi/pinyin/english.

1. Read the source pages from the corresponding HSK textbook PDF.
2. Create `data/hsk{N}/lessons/{M}.json` matching the `Lesson` type. Use an existing lesson (HSK 2 Lesson 3 is a good reference — it has every section) as a template.
3. In `data/hsk{N}/index.ts`, add the `import` and append to `REAL_LESSONS`. Remove the lesson's entry from `STUBS` if it was previously stubbed.
4. Run `npx tsc --noEmit` to verify the JSON satisfies the type.
5. The lesson list page and detail page pick it up automatically.

**Tips when authoring:**
- Stable IDs matter for SRS. Use `hsk{N}_{lessonNumber}_{slug}` for words, `hsk{N}_{lessonNumber}_g_{slug}` for grammar points, `hsk{N}_{lessonNumber}_c_{slug}` for characters.
- The renderer skips absent sections — partial JSON is OK during authoring.
- For HSK 2+, each lesson has **4** dialogue situations, not 3 (HSK 1 has 3).
- HSK 1 Lessons 1–2 use `classroomExpressions` (a special section) and have no `notes`/grammar.
- Culture notes appear in lessons 5, 10, and 15 of each level.

---

## Adding a New HSK Level

1. Create `data/hsk{N}/` with `index.ts` (clone HSK 2's) and `lessons/`.
2. Author lessons as JSON files.
3. In `lib/content.ts`, import the new index and slot it into `LESSONS_BY_LEVEL` and `SUMMARIES_BY_LEVEL`.
4. Update the `LEVELS` array in `app/course/page.tsx` if you want vocab-count / class-hours metadata for the level card.

---

## Key Patterns & Gotchas

- **Polyphonic words:** `words` has one row per simplified form, so each word gets ONE reading. `02-build-vocab-db.ts` picks it with `scripts/lib/word-forms.ts`: the pinyin the lessons / official HSK lists teach, else `scripts/content/word-readings.json` (generated by `gen-word-readings.cjs` from pinyin-pro + curated overrides — edit the OVERRIDES there, not the JSON), never complete-hsk.json's `forms[0]` (often a surname or archaic reading). Fixing existing rows needs a migration (see 010), not just a rebuild.
- **Polyphone audio:** word audio is edge-tts of the bare character, which reads some polyphones alone in another reading (长 zhǎng, 着 zhāo). Those words use committed MP3s in `public/audio-fixed/words/` from `scripts/content/gen-word-audio.py` (texts in `word-audio-overrides.json`, e.g. 长 → 常); `04-generate-audio.py` points them there, existing rows need a migration (see 011). Same voice + same text gives identical audio, so a reading can be checked by comparing against a single-reading homophone.
- **Database client:** `lib/db.ts` exports a `pg` connection pool singleton stored on `globalThis` to survive Next.js hot reloads. Use `pool.query(sql, params)` for simple queries; `pool.connect()` + manual `BEGIN/COMMIT/ROLLBACK` for transactions.
- **BIGINT columns:** `pg` returns PostgreSQL BIGINT as a string. Always wrap with `Number(...)` before returning JSON — do NOT use JS `BigInt`.
- **Column naming:** Postgres returns snake_case; the Leitner/dashboard code passes snake_case straight through to the client types.
- **IDs:** generated with `randomUUID()` from Node.js built-in `crypto` module for DB rows. For lesson content, IDs are hand-chosen stable slugs (see "Adding a New Lesson").
- **Auth in route handlers:** use `getAuthFromRequest(request)` — reads cookie synchronously from `NextRequest`.
- **Setting cookies:** only possible on `NextResponse`, not returned from `request`.
- **`"use client"` boundary:** `AuthProvider`, `Navigation`, all page components are client components; API routes and `lib/db.ts` / `lib/auth.ts` are server-only. `lib/content.ts` and `lib/types.ts` are isomorphic (no `"use client"` needed).
- **JSON imports:** `tsconfig.json` has `resolveJsonModule: true`. Lesson JSON files are imported directly: `import lesson3 from "./lessons/3.json"`.
- **Async route params:** in Next.js 16, route segment params are a Promise. `LessonPage` does `const { level, number } = await params;`.
- **Stub lessons render cleanly:** lessons marked `stub: true` show a small "Outline" notice + the word-hint chips from the warm-up array. Do not render any other section for stub lessons.
- **Double-tap guards:** grading pages guard with a `useRef` flag, not state — two taps in the same tick both see stale state.
- **No server components reading cookies directly** — auth is handled entirely in API routes + client context.
