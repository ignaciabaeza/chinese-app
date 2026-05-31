@AGENTS.md

---

# 汉语学习 — Chinese Learning App

A mobile-first HSK learning app built around the official **HSK Standard Course** curriculum (Beijing Language and Culture University Press). Lessons are the primary unit; vocabulary, grammar points, characters, dialogues, and exercises hang off each lesson. Includes spaced-repetition flashcards, mock exams, and an AI tutor, with progress sync via PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.1 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database | PostgreSQL via `pg` (node-postgres) |
| Auth | JWT (jsonwebtoken) in httpOnly cookies |
| Passwords | bcryptjs (12 rounds) |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) — claude-opus-4-6 |
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

- **Lesson content** (vocabulary, dialogues, grammar, characters, exercises, culture notes) lives as JSON files under `data/hsk{N}/lessons/{M}.json`. Each level has an `index.ts` that combines authored lessons with stubs and exports the full lesson list. `lib/content.ts` is the single entry point.
- **User state** (accounts, card progress, study sessions) lives in Postgres. The same SRS engine tracks any reviewable item via `card_id` + `card_type` (`word | character | grammar | sentence`).
- **Offline-first:** unauthenticated users get full functionality via localStorage; on login, server data is fetched and overwrites local.

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
│   ├── globals.css                          # Design system tokens + component classes
│   ├── layout.tsx                           # Root layout (fonts, AuthProvider, Navigation)
│   ├── page.tsx                             # Dashboard (stats, due cards, level grid, quick actions)
│   ├── auth/page.tsx                        # Login / register
│   ├── chat/page.tsx                        # AI tutor chat (Claude)
│   ├── course/
│   │   ├── page.tsx                         # Level picker (HSK 1–4)
│   │   └── [level]/
│   │       ├── page.tsx                     # Lesson list for a level
│   │       └── lesson/[number]/page.tsx     # Full lesson view with all 8 sections
│   ├── library/
│   │   └── vocabulary/page.tsx              # Vocabulary browser (filter by level / lesson, search)
│   ├── practice/
│   │   ├── flashcards/page.tsx              # SRS flashcards, scope = ?scope=hsk1-lesson-3
│   │   └── exam/page.tsx                    # Mock HSK exam runner
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts            # POST — create account, set JWT cookie
│       │   ├── login/route.ts               # POST — verify password, set JWT cookie
│       │   ├── logout/route.ts              # POST — clear JWT cookie
│       │   └── me/route.ts                  # GET  — return current user from cookie
│       ├── chat/route.ts                    # POST — streams Claude responses; system prompt
│       │                                    #        is built from authored lesson content
│       └── progress/
│           ├── route.ts                     # GET fetch all / POST bulk upsert card progress
│           └── sessions/route.ts            # GET fetch sessions / POST save session
├── components/
│   ├── AuthProvider.tsx                     # React context: user, login, register, logout
│   └── Navigation.tsx                       # Sticky nav: Dashboard / Course / Flashcards /
│                                            # Mock Exam / Vocabulary / Tutor
├── data/
│   ├── hsk1/
│   │   ├── index.ts                         # 15-lesson registry (real + stubs)
│   │   ├── lessons/{1..15}.json             # Lessons 1–5 authored; 6–15 are stubs
│   │   └── exams/sample1.ts                 # Sample HSK 1 mock paper (10 questions)
│   └── hsk2/
│       ├── index.ts                         # 15-lesson registry
│       └── lessons/{1..15}.json             # All 15 lessons fully authored
├── lib/
│   ├── auth.ts                              # JWT sign/verify, bcrypt, cookie helpers
│   ├── db.ts                                # pg connection pool singleton (hot-reload safe)
│   ├── types.ts                             # ALL content + progress types — Lesson, Word,
│   │                                        # GrammarPoint, CharacterTaught, CardProgress, etc.
│   ├── content.ts                           # Single entry point for lesson lookups
│   │                                        # (getLesson / getLessonSummaries / getAllWords /
│   │                                        # getAllGrammar / getAllCharacters)
│   └── progress.ts                          # SM-2 algorithm + localStorage + server sync
├── scripts/
│   ├── setup.sh                             # EC2 server setup (embeds the schema SQL)
│   ├── migrations/                          # Versioned SQL migrations applied by deploy.sh
│   │   └── 001_phase0_card_type.sql         # Clean rebuild of card_progress with card_id + card_type
│   │                                        # (drops old sentences / sessions tables)
│   └── deploy.sh                            # Re-deploy latest code on server
├── .env                                     # DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
├── AGENTS.md                                # Top-of-file reminder about Next.js 16 breaking changes
└── CLAUDE.md                                # This file
```

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
- HSK 1: lessons 1, 2, 3, 4, 5 fully authored. Lessons 6–15 are stubs (title + theme + word-hint list from the TOC, rendered with an "Outline" notice).
- HSK 2: all 15 lessons fully authored (including the three culture notes — Table Manners L5, Tea Culture L10, Spring Festival L15).
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

### `users`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| email | TEXT | Unique |
| password_hash | TEXT | bcrypt, 12 rounds |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### `card_progress` (rebuilt in Phase 0)
Generalized SRS — the same row schema tracks vocab, characters, grammar points, and sentences.

| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| user_id | TEXT | FK → users (CASCADE delete) |
| card_id | TEXT | e.g. `"word:hsk1_3_jiao"`, `"character:hsk1_2_c_kou"`, `"grammar:hsk1_3_g_shi"` |
| card_type | TEXT | `'word' | 'character' | 'grammar' | 'sentence'` |
| ease_factor | DOUBLE PRECISION | SM-2 ease factor, default 2.5 |
| interval | INTEGER | Days until next review |
| repetitions | INTEGER | Successful review count |
| next_review | BIGINT | Unix timestamp (ms) — pg returns as string, use `Number()` |
| last_review | BIGINT | Unix timestamp (ms) — pg returns as string, use `Number()` |
| correct | INTEGER | Lifetime correct count |
| incorrect | INTEGER | Lifetime incorrect count |
| updated_at | TIMESTAMPTZ | Auto |

**Unique constraint:** `(user_id, card_id)`
**Indexes:** `(user_id, card_type)` and `(user_id, next_review)`
**Card ID convention:** `${type}:${entity_id}`. Use the helper `cardId(type, entityId)` from `lib/types.ts`.

### `study_sessions`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| user_id | TEXT | FK → users (CASCADE delete) |
| date | TEXT | ISO date "YYYY-MM-DD" (use `todayISO()` from `lib/progress.ts`) |
| cards_studied | INTEGER | Total cards in session |
| correct | INTEGER | |
| incorrect | INTEGER | |
| scope | TEXT | e.g. `"hsk1-lesson-3"`, `"hsk2"`, `"all"` |
| card_type | TEXT | Default `'word'` |
| card_ids | TEXT[] | The cards reviewed in this session |
| created_at | TIMESTAMPTZ | Auto |

**Index:** `(user_id, date DESC)`

**BIGINT note:** `pg` returns BIGINT columns as strings (not JS BigInt). Always wrap with `Number(row.next_review)` before returning JSON.

**No `sentences` table.** Sentences are part of authored lesson dialogues, not a separate DB table.

---

## Auth System

- JWT stored in an `httpOnly`, `SameSite: lax` cookie named `hanyu_token` (30-day expiry)
- Cookie is set/deleted on `NextResponse` objects: `response.cookies.set(...)` / `response.cookies.delete(...)`
- Cookie is read synchronously from `NextRequest`: `request.cookies.get(COOKIE_NAME)?.value`
- `lib/auth.ts` exports: `signToken`, `verifyToken`, `getAuthFromRequest`, `hashPassword`, `comparePassword`, `COOKIE_NAME`, `COOKIE_MAX_AGE`
- `components/AuthProvider.tsx` provides a React context (`useAuth()`) with `{ user, loading, login, register, logout }`
- On mount, `AuthProvider` fetches `/api/auth/me` to restore session state

---

## Progress Sync Strategy

**Offline-first:** localStorage is the primary store (keys `hanyu_progress_v2`, `hanyu_sessions_v2`); the server is authoritative on login.

### `lib/progress.ts` exports
- `loadProgress()` / `saveProgress(progress)` — localStorage read/write, keyed by `cardId`
- `loadSessions()` / `saveSession(session)` — localStorage read/write for sessions (last 60)
- `updateCardProgress(prior, cardId, cardType, quality)` — SM-2 algorithm (quality 0–3)
- `syncProgressToServer(progress)` — POST to `/api/progress`, fire-and-forget
- `loadProgressFromServer()` — GET from `/api/progress`, overwrites localStorage
- `saveSessionWithSync(session)` — saves locally then POSTs to `/api/progress/sessions`
- `loadSessionsFromServer()` — GET sessions, overwrites localStorage
- `getDueCards(cardIds, progress)` — returns cards with `nextReview <= now`
- `getStats(cardIds, progress)` — `{ total, seen, learned, due, unseen }`
- `todayISO()` — local-time ISO date "YYYY-MM-DD" for session records
- `computeStreak(sessions)` — consecutive days ending today

### Flow
1. User opens app without account → everything uses localStorage
2. User registers/logs in → `loadProgressFromServer()` fetches server data and overwrites local
3. During study → `saveProgress()` writes locally; `syncProgressToServer()` syncs in background
4. At session end → `saveSessionWithSync()` saves locally and POSTs the session

---

## SM-2 Spaced Repetition Algorithm

Quality ratings: `0` = blackout, `1` = wrong, `2` = hard, `3` = easy

- **Correct (quality ≥ 2):** interval grows by ease factor; ease factor adjusts toward the 1.3–2.5 range
  - rep 0 → 1 day, rep 1 → 6 days, rep n → `round(interval × easeFactor)`, capped at 30 days
- **Incorrect (quality < 2):** reset to rep 0, next review in 10 minutes
- A card is "learned" when `repetitions >= 3`

Works identically for any `card_type` — the same function handles vocab, characters, grammar, and sentences.

---

## Pages & Routes

| Path | Purpose |
|---|---|
| `/` | Dashboard: due-now banner, level grid (HSK 1–4 progress), quick actions |
| `/auth` | Login / register |
| `/chat` | AI tutor (Claude streamed responses, lesson-aware system prompt) |
| `/course` | Level picker — HSK 1–4 cards with authored / total counts |
| `/course/[level]` | Lesson list for a level (stubs shown with "outline" badge) |
| `/course/[level]/lesson/[number]` | Full lesson view — renders all 8 sections that the JSON provides |
| `/library/vocabulary` | Browse all authored words, filter by level/lesson, free-text search |
| `/practice/flashcards` | SRS flashcards. URL: `?scope=hsk{N}-lesson-{M}` or `?scope=hsk{N}` or `?scope=all` |
| `/practice/exam` | Mock exam runner (currently one HSK 1 Lesson 3 sample paper) |

The lesson detail page (`app/course/[level]/lesson/[number]/page.tsx`) renders sections conditionally — any absent field is skipped, so partial-lesson JSON still renders cleanly.

---

## AI Tutor

`app/api/chat/route.ts` — streams responses from `claude-opus-4-6` via `@anthropic-ai/sdk`.

**Lesson-aware system prompt:** built at request time by walking all authored levels via `getAllWords()` from `lib/content.ts`. Each line is `hanzi (pinyin) = english [HSK{N} L{lessonNumber}]`, so the tutor can cite specific lessons. As more lessons are authored the prompt grows automatically.

Conversation history is kept client-side in `app/chat/page.tsx` state.

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
ANTHROPIC_API_KEY="sk-ant-..."
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

# 4. Run dev server
npm run dev
```

**Existing deployments** running the pre-Phase-0 schema (`card_progress.word_id`) will have the migration applied automatically by `scripts/deploy.sh` — it detects pending migrations under `scripts/migrations/`, takes a `pg_dump` backup to `/var/backups/chinese-app/`, briefly stops the app, applies them in order, records each in `schema_migrations`, and restarts. The Phase 0 migration drops `sentences` and rebuilds `card_progress` + `study_sessions` from scratch — existing card progress is lost (intentional; the old vocab was bad).

---

## Adding a New Lesson

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

- **Database client:** `lib/db.ts` exports a `pg` connection pool singleton stored on `globalThis` to survive Next.js hot reloads. Use `pool.query(sql, params)` for simple queries; `pool.connect()` + manual `BEGIN/COMMIT/ROLLBACK` for transactions.
- **BIGINT columns:** `pg` returns PostgreSQL BIGINT as a string. Always wrap with `Number(row.next_review)` before returning JSON — do NOT use JS `BigInt`.
- **Column naming:** Postgres returns snake_case (`card_id`, `card_type`, `ease_factor`, `next_review`). Map to camelCase manually when building response objects.
- **IDs:** generated with `randomUUID()` from Node.js built-in `crypto` module for DB rows. For lesson content, IDs are hand-chosen stable slugs (see "Adding a New Lesson").
- **Auth in route handlers:** use `getAuthFromRequest(request)` — reads cookie synchronously from `NextRequest`.
- **Setting cookies:** only possible on `NextResponse`, not returned from `request`.
- **`"use client"` boundary:** `AuthProvider`, `Navigation`, all page components are client components; API routes and `lib/db.ts` / `lib/auth.ts` are server-only. `lib/content.ts` and `lib/types.ts` are isomorphic (no `"use client"` needed).
- **JSON imports:** `tsconfig.json` has `resolveJsonModule: true`. Lesson JSON files are imported directly: `import lesson3 from "./lessons/3.json"`.
- **Async route params:** in Next.js 16, route segment params are a Promise. `LessonPage` does `const { level, number } = await params;`.
- **Stub lessons render cleanly:** lessons marked `stub: true` show a small "Outline" notice + the word-hint chips from the warm-up array. Do not render any other section for stub lessons.
- **Flashcard scope:** the flashcards page reads `?scope=` from the URL. Parser is `parseScope` in `app/practice/flashcards/page.tsx` — recognizes `all`, `hsk{N}`, and `hsk{N}-lesson-{M}`. Card pool builder is `buildCardPool`.
- **Session date format:** the new `study_sessions.date` is `"YYYY-MM-DD"`, **not** `Date.toDateString()`. Use `todayISO()` from `lib/progress.ts`.
- **No server components reading cookies directly** — auth is handled entirely in API routes + client context.
