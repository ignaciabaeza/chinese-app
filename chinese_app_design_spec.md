# Chinese Vocabulary App — Design Specification
## Inspired by: Traditional Chinese 七夕 (Qixi) Aesthetic

---

## 🎨 Visual Identity & Aesthetic Direction

This design draws from **traditional Chinese ink-wash painting (水墨画)** and **blue-and-white porcelain (青花瓷)** aesthetics, evoking the elegance of classical Chinese art. The feeling should be **refined, contemplative, and culturally immersive** — like studying inside a museum of Chinese antiquities.

**Tone:** Luxury / Refined / Cultural / Slightly melancholic romanticism  
**NOT:** Cute, modern-minimal, or generic "Asian restaurant" motifs

---

## 🎨 Color Palette

Use CSS variables:

```css
:root {
  --bg-primary: #2D3561;          /* Deep indigo-navy — dominant background */
  --bg-secondary: #3A4275;        /* Slightly lighter navy for cards/panels */
  --bg-parchment: #E8DEC8;        /* Warm aged parchment/paper tone */
  --bg-parchment-dark: #D4C9A8;   /* Darker parchment for contrast areas */

  --accent-gold: #C9A84C;         /* Antique gold for highlights and borders */
  --accent-rose: #C4857A;         /* Muted terracotta/dusty rose (moon color) */
  --accent-crane-white: #F0EDE4;  /* Off-white for crane illustrations */

  --floral-blue: #4A5A9A;         /* Chrysanthemum pattern blue (slightly brighter than bg) */
  --floral-blue-light: #6070B0;   /* Light version for decorative overlays */

  --text-primary: #F0EDE4;        /* Near-white for main text on dark bg */
  --text-parchment: #2A1F0E;      /* Dark ink on parchment backgrounds */
  --text-muted: #A09880;          /* Muted for secondary text */
  --text-gold: #C9A84C;           /* Gold for labels, headings */

  --border-subtle: rgba(201, 168, 76, 0.25);
  --shadow-ink: rgba(0, 0, 0, 0.4);
}
```

---

## 🖋️ Typography

**Display / Chinese Characters:**
- Font: `"Noto Serif SC"` (Google Fonts) — for Chinese characters. Beautiful, authentic serif strokes.
- Fallback: `"STSong"`, `"SimSun"`, serif

**Headings (Latin/Pinyin):**
- Font: `"Cinzel"` or `"IM Fell English SC"` (Google Fonts) — classical, slightly archaic serif
- Creates a cross-cultural elegance pairing with the Chinese serif

**Body / UI Text:**
- Font: `"Lora"` (Google Fonts) — warm, literary serif for readability
- Fallback: Georgia, serif

**Pinyin / Romanization:**
- Font: `"Cormorant Garamond"` italic — delicate and distinguished

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600;700&family=Cinzel:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@1,400;1,600&display=swap" rel="stylesheet">
```

**Type Scale:**
- Large Chinese character display: `font-size: clamp(4rem, 10vw, 8rem)` — massive, centered, commanding
- Section titles: `font-size: clamp(1.5rem, 3vw, 2.5rem)`
- Body: `1rem / 1.7 line-height`
- Pinyin annotation: `0.85rem` italic, letter-spacing: 0.05em

---

## 🌸 Decorative Elements & Patterns

### 1. Chrysanthemum Floral Background Pattern
The most distinctive element: **large circular chrysanthemum/peony motifs** repeated across the navy background, similar to blue-and-white porcelain.

```css
/* SVG or CSS background pattern */
.floral-bg {
  background-color: var(--bg-primary);
  background-image: url("data:image/svg+xml,..."); /* circular floral motif */
  background-size: 200px 200px;
  opacity: 0.15; /* subtle, should NOT overpower content */
}
```

Implementation options:
- Use an **SVG inline pattern** with circular peony/chrysanthemum outline shapes
- Or use a **CSS radial pattern** with layered box-shadows to suggest the roundness
- The flowers should be **slightly lighter than the background** (var(--floral-blue)), creating a tone-on-tone wallpaper effect

### 2. Ink-Wash Rock / Scholar's Stone (太湖石)
- Appears as a **decorative accent** in bottom-left or corner areas
- Brownish-gray tones: `#7A6855`, `#9A8870`
- Irregular, eroded silhouette shape — use SVG or a clipping path
- Optional: semi-transparent, blending into the background

### 3. Flying Cranes (仙鹤)
- Pairs of white cranes in flight used as **section dividers or top-area decoration**
- Simple silhouette style: white fill (`var(--accent-crane-white)`) with minimal detail
- SVG preferred: elongated neck, wide wings outstretched
- Should feel like they're **floating across the top** of panels

### 4. Circular Moon / Parchment Circle
- A large soft circle (like a full moon or paper medallion) used as the **hero card background** for displaying the main Chinese character
- Color: `var(--accent-rose)` — dusty rose/terracotta
- Apply a subtle noise texture or vignette to make it look aged
- Size: roughly 280–350px diameter

### 5. Traditional Fan (扇子)
- Decorative element for side panels or "hint" areas
- Semi-circular fan shape with parchment background and faint ink brushstroke lines radiating outward
- Use SVG clip-path for the fan shape

### 6. Cloud Motifs (祥云)
- Small stylized **ruyi clouds** floating near the moon circle or crane elements
- White or cream colored: `#F0EDE4`
- Classic Chinese cloud shape: flat-bottomed with layered lobes on top
- Use as pure decoration, sized 40–80px

### 7. Parchment / Scroll Panels
- Content cards that are meant to look like **aged paper or unrolled scrolls**
- Background: `var(--bg-parchment)` with a slight paper texture (CSS noise or SVG filter)
- Border: thin `1px solid var(--accent-gold)` or a double-line frame
- Optional: vertical Chinese text layout for secondary information

### 8. Bamboo / Plum Branch
- Delicate ink-painted branch (梅花枝) as a **sidebar or corner decoration**
- Dark brown branches: `#4A3728`, small white flowers: `#F0EDE4`
- Should look hand-painted, imperfect — use SVG with slightly irregular paths

---

## 📐 Layout Principles

### Overall Structure
- **Left-right split** for many views: dark navy panel (decorative/context) + parchment panel (content)
- **Generous negative space** — don't fill everything; let the design breathe
- **Asymmetric compositions**: decor elements placed off-center, overlapping panel edges

### Card Design (Flashcard)
```
┌─────────────────────────────────────────────────────┐
│  [chrysanthemum bg]                [crane silhouette] │
│                                                       │
│              ╭───────────────╮                       │
│              │  [moon circle] │                       │
│              │                │                       │
│              │      汉        │  ← massive character  │
│              │                │                       │
│              ╰───────────────╯                       │
│                                                       │
│         hàn          ← pinyin (italic, gold)         │
│    Han / Chinese      ← translation (parchment card) │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  [parchment panel]  Example sentence here...   │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Navigation / Header
- **Minimal top bar**: dark navy, with a thin gold bottom border
- App name in Chinese + romanization, centered
- Small cloud motifs flanking the title
- Navigation items spaced with generous padding, gold hover state

### Vocabulary List View
- Items displayed as **vertical Chinese scroll-style list** OR a grid of "tiles"
- Each tile: dark navy background with the Chinese character large and centered, pinyin below, English in small text at bottom
- Hover: the tile brightens slightly, a crane or cloud appears as overlay

---

## ✨ Animations & Interactions

### Page Load
- Characters "brush in" with a **stroke-draw animation** (SVG stroke-dashoffset on the character outline, or opacity fade with slight upward drift)
- Decorative elements stagger in with `animation-delay`: cranes fly in from top-right, rock fades from bottom-left

### Flashcard Flip
- **3D card flip** with perspective transform
- Front: character on moon-circle background (dark navy side)
- Back: parchment-colored with definition, example sentence in vertical layout
- Flip triggered by click; smooth 600ms ease-in-out

```css
.card-flip {
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
```

### Hover States
- Buttons/cards: subtle **gold border glow** appears (`box-shadow: 0 0 12px rgba(201, 168, 76, 0.4)`)
- Crane decorations: slight float animation on hover (`translateY(-4px)`)
- Parchment panels: very subtle paper-texture shimmer

### Progress / Completion
- Fill animation using a **Chinese-style ink brush stroke** (SVG path animation) rather than a generic progress bar
- Completion: flying cranes animation across the screen

---

## 🧩 Component Specifications

### Primary Button
```css
.btn-primary {
  background: transparent;
  border: 1.5px solid var(--accent-gold);
  color: var(--accent-gold);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.1em;
  padding: 0.6em 2em;
  position: relative;
  overflow: hidden;
  /* Ink-wash fill on hover: pseudo-element slides up from bottom */
}
.btn-primary:hover {
  background: var(--accent-gold);
  color: var(--bg-primary);
}
```

### Input Fields (Search / Quiz answer)
- Parchment background: `var(--bg-parchment)`
- Dark ink text: `var(--text-parchment)`
- Gold bottom-border only (no full border box) — like writing on paper
- Focus: gold glow, slight scale-up

### Badge / Tag (HSK Level, Category)
- Small pill shape
- Background: `rgba(201, 168, 76, 0.15)`
- Border: `1px solid var(--accent-gold)`
- Text: `var(--text-gold)`, small caps

### Score / Streak Display
- Use large Chinese numerals (一二三...) as display numbers for flavor
- Surrounded by small cloud motifs
- Gold color, Noto Serif SC font

---

## 📱 Responsive Behavior

- **Mobile**: Single column, moon circle smaller (220px), cranes repositioned to top strip
- **Tablet**: Two-column layout possible for list + detail
- **Desktop**: Full asymmetric layout with side decorations visible

Use `clamp()` extensively for fluid typography and spacing:
```css
font-size: clamp(1rem, 2.5vw, 1.25rem);
padding: clamp(1rem, 3vw, 2.5rem);
```

---

## 🗂️ Suggested File/Component Structure

```
/components
  FlashCard.jsx          — Main card with flip animation + moon circle
  CharacterDisplay.jsx   — Large character with pinyin overlay
  ParchmentPanel.jsx     — Reusable parchment-bg content panel
  CraneDecor.jsx         — SVG crane decoration (animated)
  CloudMotif.jsx         — SVG ruyi cloud
  FloralBackground.jsx   — Tiled chrysanthemum pattern bg
  NavBar.jsx             — Top nav with gold border

/styles
  tokens.css             — All CSS variables above
  animations.css         — Keyframes for cranes, brush-in, card flip
  typography.css         — Font stacks and type scale
```

---

## 🚫 What to Avoid

- ❌ No bright red/crimson ("lucky red") — too clichéd
- ❌ No dragon imagery — overused
- ❌ No Comic Sans or rounded fonts
- ❌ No flat material design cards without texture
- ❌ No purple gradients or modern glassmorphism
- ❌ No confetti or emoji-based animations
- ❌ Do not make it look like a generic "Chinese restaurant menu"

---

## ✅ Summary Checklist for Implementation

- [ ] Deep navy background (`#2D3561`) with tone-on-tone chrysanthemum pattern
- [ ] Parchment panels (`#E8DEC8`) for content/definition areas
- [ ] Noto Serif SC for all Chinese characters
- [ ] Cinzel + Lora for English/UI text
- [ ] Moon circle (dusty rose `#C4857A`) as flashcard hero background
- [ ] Flying crane SVG decorations (white, animated float)
- [ ] Gold (`#C9A84C`) as the accent color for all interactive elements
- [ ] 3D card flip animation for flashcards
- [ ] Ruyi cloud SVG motifs as decorative accents
- [ ] Ink-brush stroke progress indicator
- [ ] Asymmetric layout with decorative elements overlapping panel edges
