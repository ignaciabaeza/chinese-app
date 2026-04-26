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

---

## App Screens, Sections & Workflows (for Design)

This section describes every screen in the app — what it shows, what components it uses, and how the user flows through it. Use this as the source of truth when redesigning or extending any page.

---

### Current Design System (actual values in `globals.css`)

The aesthetic is **ink-wash / rice paper** — light backgrounds, dark ink, blush-pink accents. Not dark navy (that was the old design).

**Background & Paper:**
```
--bg-primary:    #F2EDE4   (aged rice paper — main page background)
--bg-secondary:  #EDE5D8   (warm paper — cards, panels, nav)
--bg-parchment:  #EAE8E0   (cool parchment — modals, card backs)
```

**Ink (text/borders):**
```
--ink-dark:      #2C2416   (main text, headings, borders)
--ink-medium:    #5A4F3E   (secondary text, nav links)
--ink-faint:     #9A9080   (labels, hints, muted info)
--border-ink:    rgba(44,36,22,0.15)   (default border color)
```

**Accents:**
```
--blush-pink:    #D4888A   (primary accent — active states, dots, send button)
--blush-deep:    #B86870   (hover accent — active nav, error, Hard button)
--blush-light:   #E8B4B5   (light blush)
--sage-circle:   #A8B8B0   (AI tutor avatar ring, "in progress" dot)
--antique-gold:  #B09050   (accuracy badge, gold stars, streak)
--seal-red:      #C44030   (seal stamp on logo — 學 character)
--mountain-blue: #8A9BAA   (mountain/sky accent, "seen" status dot)
```

**Fonts:**
```
Noto Serif SC     — Chinese characters (display, headings)
Cormorant Garamond — English headings, pinyin (italic)
Cormorant SC      — Labels, nav links, uppercase tags
Lora              — Body text, descriptions, messages
```

**Key reusable CSS classes:**
```
.moon-circle       — Dusty rose circle, used as flashcard front hero (180×180px)
.parchment-panel   — Panel with bg-parchment + border-ink
.gold-btn          — Gold gradient button with hover glow (legacy)
.progress-ink      — Slim progress bar track
.progress-ink-fill — Fill element inside .progress-ink
.card-flip         — 3D flip container (perspective + transform-style: preserve-3d)
.card-inner        — Rotates on .flipped class
.card-front        — Front face (navy with moon circle)
.card-back         — Back face (parchment with definition)
.chinese-xl        — Noto Serif SC ~5rem (1–2 characters)
.chinese-lg        — Noto Serif SC ~3.5rem (3–4 characters)
.chinese-md        — Noto Serif SC ~2.5rem (5+ characters)
.font-pinyin       — Cormorant Garamond italic
.badge-gold        — Small inline HSK level / category tag
.animate-fade-up   — Page entrance animation (slide up + fade)
.animate-drift     — Slow floating drift (logo plum motif)
```

---

### Navigation (`components/Navigation.tsx`)

**Layout:** Sticky top bar, `background: rgba(242,237,228,0.95)` with `backdrop-blur-sm`. `border-bottom: 1px solid rgba(44,36,22,0.12)`. Height: `h-14`.

**Logo (left):**
- Animated plum blossom SVG (5 petals, blush-pink fill, antique-gold center)
- `汉语学习` in Noto Serif SC weight 300
- `HÀNYǓ XUÉXÍ` in Cormorant SC (hidden on mobile)
- Red seal stamp: `學` character, slightly rotated, `border: 1px solid rgba(196,64,48,0.6)`

**Desktop links (center-right):** Dashboard · Flashcards · Sentences · Vocabulary · Progress · AI Tutor
- Cormorant SC, letter-spacing 0.06em
- Active: `color: --blush-deep`, `border-bottom: 1.5px solid --blush-deep`
- Inactive: `color: --ink-medium`, hover → `--ink-dark`

**Auth section (far right, desktop):**
- Not logged in: "Sign In" link (blush-deep, underline border)
- Logged in: truncated email + "Sign Out" button

**Mobile:** Hamburger (3 lines, ink-medium) → dropdown below header with vertical links + auth row
- Active link: `border-left: 2px solid --blush-deep`

---

### Dashboard (`app/page.tsx`)

**Purpose:** Overview of all learning progress, entry point to study.

**Sections (top to bottom):**

1. **Header**
   - `你好` in Noto Serif SC weight 300, ~3–4rem, `--ink-dark`
   - Subtitle: "Welcome to your Chinese learning dashboard" in Lora

2. **Stat Cards** — 2×2 grid (sm: 4 columns)
   - Words Learned (→ `/progress?tab=learned`)
   - Due for Review (→ `/flashcards`, highlighted if `> 0`)
   - Words Seen (→ `/progress`)
   - Day Streak (non-clickable)
   - Each card: `background: #b7c9c9` (teal — legacy), `border-radius: 2px`
   - Number in Cormorant Garamond 500, label in Cormorant SC uppercase

3. **Due-Now Banner** (only shown when `totalDue > 0`)
   - Full-width clickable strip → `/flashcards`
   - `background: #b7c9c9`, border on hover
   - "{N} cards ready for review" + "Keep your streak going"

4. **HSK Level Grid** — 2 columns (sm: 3 columns)
   - One card per HSK level (1–6)
   - Shows: level name, % progress bar (gold fill), learned / due / total counts

5. **Quick Actions** — 2 columns (sm: 4 columns)
   - Flashcards / Vocabulary / Progress / AI Tutor
   - Each: title in Cormorant Garamond, subtitle in Lora, hover raises border color

6. **Overall Progress Bar**
   - Gold ink progress bar showing `totalLearned / totalWords`
   - "X% of HSK 1–6 vocabulary mastered" label

---

### Flashcards (`app/flashcards/page.tsx`)

Three distinct screens controlled by `showSetup` and `finished` state:

#### Screen 1 — Setup Screen

**Purpose:** Configure the study session before starting.

**Layout:** `max-w-sm mx-auto`, centered, fade-up animation.

**Controls (inside a single panel card):**
- **Level selector:** "All" + "HSK 1–6" — 4-column button grid
- **Category selector:** "All" + 16 category tags (verbs, nouns, adjectives, etc.) — wrapping flex row
- **Mode selector:** 3-column grid
  - "Due Cards" — only cards with `nextReview <= now`; shows count badge
  - "All Cards" — random from filtered set
  - "Drill" — repeat Hard cards until all mastered
- **Session size:** 10 or 20 cards — 2-column grid
- **Active state for all buttons:** `background: --blush-pink`, `color: --bg-primary`

**Start button:** Full-width, underline-only style (no fill), `letterSpacing: 0.15em`, "Begin Practice"

#### Screen 2 — Study Card

**Layout:** `max-w-xl mx-auto`.

**Progress bar:** Slim gold `.progress-ink-fill` bar + "X / Y" counter (Cormorant SC)

**Session stats row:** ✓ correct count, ✗ incorrect count, accuracy %, cards remaining (drill only)

**Card (400px tall, `.card-flip`):**
- **Front face** (`--bg-secondary`, border `--border-ink`):
  - HSK badge + category tag at top
  - `.moon-circle` (blush-pink circle, 180×180px) containing the Chinese character(s)
  - Optional pinyin inside the moon circle (hidden by default, revealed by "show pinyin" button)
  - "tap to reveal meaning" hint text
- **Back face** (`--bg-parchment`):
  - HSK badge
  - Chinese character in `chinese-md` (ink dark, Noto Serif SC)
  - Traditional character (if different), in smaller size + `#7A6855`
  - Pinyin in `.font-pinyin` italic, `#5A3F20`
  - English definition in Lora
  - Example sentence block (if word has `.example`): Chinese + pinyin + English, slight tinted background
  - Card stats footer: "N reviews · N✓ N✗"

**Rate buttons (shown only after flip):**
- "✗ Hard" — blush-pink border, transparent fill; hover deepens fill
- "✓ Easy" — blush-pink border; hover fills with `--blush-pink`

**Pre-flip button:** "Reveal Meaning" — underline-only, no fill

**Back to setup link:** Small text link at bottom

#### Screen 3 — Finished Screen

**Layout:** `max-w-xl mx-auto text-center`.

**Chinese character hero:** `好` (≥80% accuracy) / `学` (50–79%) / `练` (<50%) / `完` (drill mode)
- Large (3rem), weight 300, Noto Serif SC, blush-pink color

**Summary panel:** 3-column grid — total cards / correct count / accuracy %

**Action buttons:**
- "Practice Again" — same session settings
- "New Session" — back to setup screen

**Words Learned list** (if any rated Easy):
- Divider with "Words Learned · N" label
- 2-column grid of word mini-cards: Chinese + pinyin + English + HSK level

---

### Vocabulary Browser (`app/vocabulary/page.tsx`)

**Purpose:** Browse all ~5000 HSK words with filtering and detail lookup.

**Sections:**

1. **Header row**
   - Title: "Vocabulary" in Noto Serif SC weight 300
   - Legend: ● Unseen (rgba) · ● Seen (mountain-blue) · ● Learned (blush-pink)

2. **Filter bar**
   - Text search input: underline-only style, searches `chinese`, `pinyin`, `english`
   - Level filter buttons: All, HSK 1–6 (pill style, blush-pink active)
   - Category filter tags: All + 16 categories (smaller, blush-tinted active)

3. **Results count:** "N words" in Cormorant SC

4. **Word grid:** Responsive columns (2 → 3 → 4 → 5 at breakpoints)
   - Each word card:
     - Chinese character (Noto Serif SC, ink-dark, bold)
     - Status dot (top-right corner, colored by learned/seen/unseen)
     - Pinyin (blush-deep, italic, Cormorant Garamond)
     - English definition (truncated, ink-faint, Lora)
     - "HSK N" tag (light, Cormorant SC)
   - Hover: blush border + subtle shadow

5. **Detail modal** (on word click):
   - Overlay: `background: rgba(0,0,0,0.75)`
   - Panel: `bg-parchment`, `border-ink`, `border-radius: 2px`
   - Bottom-sheet on mobile (`items-end`), centered on desktop
   - Large character (~4.5rem), traditional form if different
   - Pinyin (blush-deep italic), English definition (Lora)
   - If studied: 3-column stats (Reviews · Correct · Missed)
   - "Close" button: underline-only style

---

### Progress (`app/progress/page.tsx`)

**Purpose:** Deep-dive into learning progress across 3 tabs.

**Header:** "My Progress" + "Review N due →" button (if due cards exist)

**Summary stat tiles** (2×2 grid, sm: 4 columns):
- Learned · In Progress · Due Now · Accuracy %

**Tabs:** Overview · Learned (N) · Sessions (N)
- Active tab: `--accent-gold` color + border-bottom
- Inactive: `--text-muted`

#### Tab: Overview

1. **Due-now panel** (if cards due): Shows up to 12 character chips + "Start →" link
2. **All-caught-up state** (if no due but cards seen): Gold ✦ icon + message
3. **Level Progress:** HSK 1–6 bars — `LevelBar` component with label, N/total, progress fill
4. **Coming Up Next:** Next 5 cards with time-until-review (e.g. "2d", "3h")
5. **Recent Sessions:** Last 5 sessions — date, level, cards, accuracy %, ✓✗ counts
6. **Empty state:** If no progress yet — "Start Studying" button

#### Tab: Learned

- Search filter (same underline style)
- Word count
- List of learned words: Chinese + pinyin + English + review count + next review timing
  - "due now" in `--accent-rose` if overdue

#### Tab: Sessions (History)

- Summary row: total sessions / total cards / overall accuracy
- Expandable session list: each row shows date, level, accuracy %, ✓✗
  - Vertical color bar: gold (≥80%) / mid-gold (50–79%) / rose (<50%)
  - Click to expand: shows vocabulary grid for that session (2–3 columns)

---

### AI Chat (`app/chat/page.tsx`)

**Purpose:** Streaming chat with Claude as a Chinese tutor.

**Layout:** `max-w-2xl mx-auto`, full viewport height minus nav (`calc(100vh - 8rem)`), flex column.

**Header:**
- Sage-green circle avatar with `先` character (Noto Serif SC)
- "AI Chinese Tutor" in Cormorant Garamond
- "Powered by Claude · Knows HSK 1–6 vocabulary" subtitle

**Message area (scrollable flex-1):**

Empty state:
- `学` character large, ink-dark, Noto Serif SC
- "Ask me anything about Chinese!" subtitle
- 6 suggestion chips in 1–2 column grid (click to send)
  - e.g. "How do I say 'I am hungry'?", "What's the difference between 是 and 有?"

Chat messages:
- User messages: right-aligned, `rgba(184,104,112,0.07)` tinted background, blush border
- Assistant messages: left-aligned, sage avatar, `--bg-secondary` background
- Both: `border-radius: 2px`, Lora font, max-width 85%
- "Thinking…" italic placeholder while streaming
- Inline formatting: `**bold**` → blush-deep bold, `` `code` `` → tinted code span

**Input area (bottom):**
- Panel: `--bg-secondary` background, border-ink
- Auto-resizing `<textarea>` (max 8rem tall), Enter to send, Shift+Enter for newline
- Send button: circular, `--blush-pink` when active, gray when disabled
- Loading spinner: spinning `◌` character

---

### Auth (`app/auth/page.tsx`)

**Purpose:** Login and registration, single page with tab toggle.

**Layout:** Centered vertically (`min-h-[80vh]`), `max-w-sm` card.

**Card:** `--bg-secondary` background, border-ink, `border-radius: 2px`, subtle shadow.

**Logo header:**
- `汉语学习` large (4rem), Noto Serif SC weight 300
- `HÀNYǓ XUÉXÍ` in Cormorant SC small-caps, ink-faint

**Mode toggle:**
- "Sign In" / "Register" tabs
- Active: blush-deep color + border-bottom underline
- Underline-tab style (border-bottom on the row, no background fill)

**Form fields:** Email + Password
- Underline-only inputs (no box border, just `border-bottom`)
- Focus: `--blush-deep` underline
- Labels: Cormorant SC uppercase tracking

**Error message:** Blush tinted box (if auth fails)

**Submit button:** Full-width underline-only, "Sign In" / "Create Account", shows `请稍候…` while loading

**Register footer:** "Your progress will sync across all your devices."

---

### Sentences (`app/sentences/page.tsx`)

A study page for HSK example sentences. Fetches from the `sentences` PostgreSQL table. Allows browsing by HSK level with card-flip reveal of English/grammar.

---

### User Flows

#### New User Flow
1. Lands on **Dashboard** → sees 0 progress, streak 0
2. Clicks "Flashcards" quick action
3. **Flashcard Setup** → picks level/mode → "Begin Practice"
4. Studies cards → rates each Easy/Hard
5. **Finished Screen** → sees accuracy + words learned
6. Returns to Dashboard → stats updated

#### Returning User Flow
1. Dashboard shows "N cards ready for review" banner
2. Clicks banner → Flashcard Setup pre-selects "Due Cards"
3. Reviews due cards
4. Checks **Progress** tab for streak/level bars

#### Account Registration Flow
1. Clicks "Sign In" in nav → **Auth page**
2. Switches to "Register" tab → enters email + password
3. On success → redirected to Dashboard
4. Progress from localStorage is synced to server on login

#### Vocabulary Lookup Flow
1. **Vocabulary** page → search or filter by level/category
2. Clicks a word → **Detail modal** slides up (bottom-sheet on mobile)
3. Sees character, traditional form, pinyin, definition, study stats
4. Dismisses modal → continues browsing

#### AI Tutor Flow
1. **Chat** page → sees suggestion chips
2. Clicks a suggestion or types a question
3. Response streams in token by token (SSE)
4. Conversation history kept in component state (not persisted)

---

### Reusable UI Patterns

These patterns appear across multiple pages and should remain consistent:

| Pattern | Usage |
|---|---|
| Underline button | Primary actions (Begin Practice, Reveal Meaning, Sign In, Close) — no fill, just border-bottom 1.5px |
| Pill/toggle button | Level filters, category filters, mode selectors — blush-pink fill when active |
| Progress bar | `.progress-ink` + `.progress-ink-fill` — used on Dashboard, Flashcards, Progress |
| Status dot | 2×2px circle: rgba (unseen), mountain-blue (seen), blush-pink (learned) |
| Badge tag | `.badge-gold` — HSK level + category label on flashcard fronts |
| Parchment modal | `--bg-parchment` panel, border-ink, border-radius 2px, bottom-sheet on mobile |
| Expandable row | Sessions history — click to reveal vocabulary grid |
| Stat tile | Number (large, colored) + label (small, Cormorant SC uppercase) |
| Section divider | `h-px` with `--border-ink` + centered label in Cormorant SC |
