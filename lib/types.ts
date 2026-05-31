// ─────────────────────────────────────────────────────────────────────────────
// Content types — mirror the HSK Standard Course lesson structure.
// All lesson content lives in /data as static JSON; these types describe it.
// ─────────────────────────────────────────────────────────────────────────────

export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** Chinese + pinyin + English triplet (the atom of every HSK page). */
export interface Bilingual {
  hanzi: string;
  pinyin?: string;
  english: string;
}

/** A vocabulary word in a lesson's New Words list. */
export interface Word {
  /** Stable ID, e.g. "hsk1_3_jiao". Used as flashcard key. */
  id: string;
  hanzi: string;
  pinyin: string;
  /** Part of speech as printed in the book: "v.", "n.", "pron.", "part.", … */
  pos: string;
  english: string;
  traditional?: string;
}

/** Proper nouns (names, places) — separated like the books do. */
export interface ProperNoun {
  id: string;
  hanzi: string;
  pinyin: string;
  english: string;
}

/** One line of a dialogue. */
export interface DialogueLine {
  speaker: string;       // "A" | "B" | "C" | narrator label
  hanzi: string;
  pinyin: string;
  english?: string;
}

/** One of the (usually 3) situations in the Text section. */
export interface Text {
  situationNumber: number;
  title: Bilingual;
  /** Audio cue printed in the book, e.g. "03-1". May or may not have a real file. */
  audioRef?: string;
  dialogue: DialogueLine[];
  newWords: Word[];
  properNouns?: ProperNoun[];
}

/** Warm-up section: pictures matched with words. */
export interface WarmUp {
  instruction: Bilingual;
  items: Array<{ hanzi: string; pinyin: string; english: string }>;
}

/** A row in a grammar pattern table (cells are usually short Chinese phrases). */
export type PatternRow = string[];

export interface PatternTable {
  columns: string[];
  rows: PatternRow[];
}

/** A grammar note in the Notes section. */
export interface GrammarPoint {
  /** Stable ID for spaced-repetition tracking. */
  id: string;
  number: number;
  title: Bilingual;
  explanation: Bilingual;
  examples?: Array<{ hanzi: string; pinyin: string; english?: string }>;
  patternTable?: PatternTable;
}

/** Exercise types — mirror HSKK oral test formats. */
export type ExerciseType =
  | "role_play"
  | "answer_questions"
  | "describe_pictures"
  | "fill_blanks"
  | "match"
  | "listening_choice";

export interface Exercise {
  number: number;
  type: ExerciseType;
  prompt: Bilingual;
  /** Items vary by type — questions, prompts, picture refs, etc. */
  items?: Array<{ hanzi?: string; pinyin?: string; english?: string; blank?: string }>;
}

/** Pinyin section: pronunciation drills, tone rules, etc. */
export interface PinyinDrill {
  number: number;
  title: Bilingual;
  explanation?: Bilingual;
  syllables?: string[];
  subRules?: Array<{
    rule: Bilingual;
    examples: Array<{ pinyin: string; english?: string }>;
  }>;
}

/** A Chinese character stroke. */
export interface Stroke {
  name: { hanzi: string; pinyin: string; english: string };
  /** A glyph or short string showing the stroke shape (e.g., "乛"). */
  shape: string;
  examples: Array<{ hanzi: string; pinyin: string; english: string }>;
}

/** A character taught in the Characters section. */
export interface CharacterTaught {
  /** Stable ID for spaced-repetition tracking. */
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  /** Short etymological note as printed in the book. */
  etymology?: string;
  strokeCount?: number;
}

export interface CharacterSection {
  strokes?: Stroke[];
  singleComponentChars?: CharacterTaught[];
  /** Radicals introduced (from Lesson 7+). */
  radicals?: Array<{ hanzi: string; pinyin: string; english: string; examples: string[] }>;
}

/** Cultural note (every 5 lessons in HSK 1). */
export interface CultureNote {
  title: Bilingual;
  body: string; // markdown
}

/** Classroom expressions box — appears in early lessons (HSK 1 lessons 1, 2). */
export interface ClassroomExpression {
  hanzi: string;
  pinyin: string;
  english: string;
}

/** A full lesson — the top-level JSON object in /data/hsk{N}/lessons/{M}.json. */
export interface Lesson {
  /** Stable ID, e.g. "hsk1-3". */
  id: string;
  level: HSKLevel;
  number: number;
  title: Bilingual;
  /** Theme / topic the lesson clusters around. */
  theme?: string;
  warmUp?: WarmUp;
  texts?: Text[];
  notes?: GrammarPoint[];
  exercises?: Exercise[];
  pinyinSection?: { drills: PinyinDrill[] };
  characters?: CharacterSection;
  application?: { prompt: Bilingual; activities?: string[] };
  culture?: CultureNote;
  classroomExpressions?: ClassroomExpression[];
  /** Set when the lesson hasn't been authored yet — page shows a placeholder. */
  stub?: boolean;
}

/** Lightweight lesson summary for list views. */
export interface LessonSummary {
  id: string;
  level: HSKLevel;
  number: number;
  title: Bilingual;
  theme?: string;
  wordCount: number;
  grammarCount: number;
  stub: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress types — what gets stored per-user. Cards can be vocab, characters,
// grammar points, or sentences. The card_id is globally unique across types.
// ─────────────────────────────────────────────────────────────────────────────

export type CardType = "word" | "character" | "grammar" | "sentence";

/** Stable card ID convention: `${type}:${entity_id}` — e.g. "word:hsk1_3_jiao". */
export function cardId(type: CardType, entityId: string): string {
  return `${type}:${entityId}`;
}

export interface CardProgress {
  cardId: string;
  cardType: CardType;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastReview: number;
  correct: number;
  incorrect: number;
}

export interface StudySession {
  date: string;             // ISO date "YYYY-MM-DD"
  cardsStudied: number;
  correct: number;
  incorrect: number;
  /** Where the session was scoped: "hsk1-lesson-3" | "hsk1" | "all" | ... */
  scope: string;
  cardType: CardType;
  cardIds?: string[];
}
