@AGENTS.md

---

# 汉语学习 — Chinese Learning App

A mobile-first HSK vocabulary flashcard app with spaced-repetition, an AI tutor, and cross-device progress sync via a PostgreSQL backend.

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
- `.moon-circle` — dusty rose circular hero for flashcard fronts (180×180px)
- `.parchment-panel` — cream/parchment background panel
- `.gold-btn` — gold gradient button with hover glow
- `.progress-ink` / `.progress-ink-fill` — gold ink progress bar
- `.card-flip` / `.card-inner` / `.card-front` / `.card-back` — 3D card flip (CSS `preserve-3d`)
- `.chinese-xl` / `.chinese-lg` / `.chinese-md` — Noto Serif SC at large sizes
- `.font-pinyin` — Cormorant Garamond italic for pinyin
- `animate-float-crane`, `animate-drift-cloud`, `animate-fade-up` — keyframe animations

**Background:** Chrysanthemum SVG pattern encoded as a `data:image/svg+xml` URI in `body { background-image: ... }`, tiled at 200×200px.

---

## Project Structure

```
chinese_app/
├── app/
│   ├── globals.css              # Full design system (fonts, tokens, component classes)
│   ├── layout.tsx               # Root layout: Google Fonts, AuthProvider, Navigation
│   ├── page.tsx                 # Dashboard (stats, due cards, quick actions)
│   ├── auth/
│   │   └── page.tsx             # Login / register page
│   ├── flashcards/
│   │   └── page.tsx             # Flashcard study session with 3D flip
│   ├── vocabulary/
│   │   └── page.tsx             # Vocabulary browser with level filters + detail modal
│   ├── progress/
│   │   └── page.tsx             # Progress tracking: HSK level bars, sessions history
│   ├── chat/
│   │   └── page.tsx             # AI tutor chat (Claude)
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts  # POST — create account, set JWT cookie
│       │   ├── login/route.ts     # POST — verify password, set JWT cookie
│       │   ├── logout/route.ts    # POST — clear JWT cookie
│       │   └── me/route.ts        # GET  — return current user from cookie
│       └── progress/
│           ├── route.ts           # GET (fetch all card progress) / POST (bulk upsert)
│           └── sessions/
│               └── route.ts       # GET (fetch sessions) / POST (save session)
├── components/
│   ├── AuthProvider.tsx          # React context: user, login, register, logout
│   └── Navigation.tsx            # Sticky nav: desktop links + mobile hamburger + auth
├── data/
│   └── vocabulary.ts             # Full HSK 1–6 word list (~5000 words)
├── lib/
│   ├── auth.ts                   # JWT sign/verify, bcrypt hash/compare, cookie helpers
│   ├── db.ts                     # pg connection pool singleton (hot-reload safe)
│   └── progress.ts               # SM-2 algorithm, localStorage read/write, server sync
├── scripts/
│   ├── setup.sh                  # One-time EC2 server setup (Ubuntu 24.04)
│   └── deploy.sh                 # Re-deploy latest code on server
├── .env                          # DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY
└── CLAUDE.md                     # This file
```

---

## Data Model

### `users`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| email | TEXT | Unique |
| password_hash | TEXT | bcrypt, 12 rounds |
| created_at | TIMESTAMPTZ | Auto |
| updated_at | TIMESTAMPTZ | Auto |

### `card_progress`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| user_id | TEXT | FK → users (CASCADE delete) |
| word_id | TEXT | Matches `Word.id` in vocabulary.ts |
| ease_factor | DOUBLE PRECISION | SM-2 ease factor, default 2.5 |
| interval | INTEGER | Days until next review |
| repetitions | INTEGER | Successful review count |
| next_review | BIGINT | Unix timestamp (ms) — pg returns as string, use `Number()` |
| last_review | BIGINT | Unix timestamp (ms) — pg returns as string, use `Number()` |
| correct | INTEGER | Lifetime correct count |
| incorrect | INTEGER | Lifetime incorrect count |
| updated_at | TIMESTAMPTZ | Auto |

**Unique constraint:** `(user_id, word_id)`

**BIGINT note:** `pg` returns BIGINT columns as strings (not JS BigInt). Always wrap with `Number(row.next_review)` before returning JSON.

### `sentences`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| level | INTEGER | HSK level 1–6 |
| chinese | TEXT | Simplified Chinese sentence |
| pinyin | TEXT | Pinyin with tone marks |
| english | TEXT | English translation |
| grammar | TEXT | Grammar point explanation |
| pattern | TEXT | Abstract sentence pattern |
| created_at | TIMESTAMPTZ | Auto |

### `study_sessions`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key, `randomUUID()` |
| user_id | TEXT | FK → users (CASCADE delete) |
| date | TEXT | ISO date string e.g. "2026-03-21" |
| cards_studied | INTEGER | Total cards in session |
| correct | INTEGER | |
| incorrect | INTEGER | |
| level | TEXT | HSK level or "all" |
| created_at | TIMESTAMPTZ | Auto |

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

**Offline-first:** localStorage is the primary store; the server is authoritative on login.

### `lib/progress.ts` exports:
- `loadProgress()` / `saveProgress()` — localStorage read/write for card progress
- `loadSessions()` / `saveSession()` — localStorage read/write for sessions (keeps last 30)
- `syncProgressToServer(progress)` — POST to `/api/progress`, fire-and-forget
- `loadProgressFromServer()` — GET from `/api/progress`, overwrites localStorage, returns merged data
- `saveSessionWithSync(session)` — saves locally then POSTs to `/api/progress/sessions`
- `updateCardProgress(progress, wordId, quality)` — SM-2 algorithm (quality 0–3)
- `getDueCards(wordIds, progress)` — returns cards with `nextReview <= now`
- `getStats(wordIds, progress)` — returns `{ total, seen, learned, due, unseen }`

### Flow:
1. User opens app without account → everything uses localStorage
2. User registers/logs in → `loadProgressFromServer()` fetches server data and overwrites local
3. During study → `saveProgress()` writes locally; `syncProgressToServer()` syncs to server in background
4. At session end → `saveSessionWithSync()` saves locally and POSTs session to server

---

## Vocabulary Data

`data/vocabulary.ts` contains the full HSK 1–6 word list. Each `Word` has:
```ts
interface Word {
  id: string;        // e.g. "hsk1_爱"
  chinese: string;   // simplified character(s)
  pinyin: string;    // with tone marks
  english: string;   // definition
  level: 1|2|3|4|5|6;
  traditional?: string;
  category?: string; // e.g. "verbs", "nouns", "numbers"
}
```

---

## SM-2 Spaced Repetition Algorithm

Quality ratings: `0` = blackout, `1` = wrong, `2` = hard, `3` = easy

- **Correct (quality ≥ 2):** interval grows by ease factor; ease factor adjusts toward 1.3–2.5 range
  - rep 0 → 1 day, rep 1 → 6 days, rep n → `round(interval × easeFactor)`, capped at 30 days
- **Incorrect (quality < 2):** reset to rep 0, next review in 10 minutes
- A card is "learned" when `repetitions >= 3`

---

## AI Tutor

`app/api/chat/route.ts` — streams responses from `claude-opus-4-6` via `@anthropic-ai/sdk`.

System prompt positions Claude as a Chinese language teacher (Mandarin, HSK 1–6, pinyin, grammar, cultural context). Conversation history is kept client-side in `app/chat/page.tsx` state.

---

## Mobile Design

- Viewport meta set in `layout.tsx` via `export const viewport: Viewport` (Next.js 15+ requirement)
- `maximumScale: 1` prevents double-tap zoom on iOS
- Navigation: desktop uses horizontal links; mobile uses hamburger button + dropdown
- Vocabulary detail modal: `items-end sm:items-center` for bottom-sheet pattern on mobile
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

# 2. Fill in .env with real values (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY)

# 3. Create database tables (run against your PostgreSQL instance)
psql $DATABASE_URL < scripts/schema.sql

# 4. Run dev server
npm run dev
```

The schema SQL is also embedded in `scripts/setup.sh` for the EC2 deployment path.

---

## Key Patterns & Gotchas

- **Database client:** `lib/db.ts` exports a `pg` connection pool singleton stored on `globalThis` to survive Next.js hot reloads. Use `pool.query(sql, params)` for simple queries; `pool.connect()` + manual `BEGIN/COMMIT/ROLLBACK` for transactions
- **BIGINT columns:** `pg` returns PostgreSQL BIGINT as a string. Always wrap with `Number(row.next_review)` before returning JSON — do NOT use JS `BigInt`
- **Column naming:** PostgreSQL returns snake_case column names (`word_id`, `ease_factor`, `next_review`). Map to camelCase manually when building response objects
- **IDs:** generated with `randomUUID()` from Node.js built-in `crypto` module
- **Auth in route handlers:** use `getAuthFromRequest(request)` — reads cookie synchronously from `NextRequest`
- **Setting cookies:** only possible on `NextResponse`, not returned from `request`
- **`"use client"` boundary:** `AuthProvider`, `Navigation`, all page components are client components; API routes and `lib/db.ts` / `lib/auth.ts` are server-only
- **No server components that read cookies directly** — auth is handled entirely in API routes + client context
