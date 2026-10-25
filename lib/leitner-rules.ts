// The Leitner rules, shared by the server scheduler (lib/leitner.ts) and the
// pages that explain boxes. Isomorphic: no DB, no "server-only".
//
//   Box 0      never studied
//   Box 1–5    due again after 1, 2, 4, 8, 16 days
//   Know it    on a due card: up one box (box 5 stays, next check in 30 days)
//              on a card that isn't due yet: nothing moves
//   Don't know back to box 1, due again today

export const TOP_BOX = 5;
/** Days until a card in box N is due again (index = box). */
export const BOX_DAYS = [0, 1, 2, 4, 8, 16] as const;
/** Box 5 cards known again come back after this many days. */
export const MASTERED_DAYS = 30;

/**
 * What the UI calls each box (index = box). Users never see "box N": the
 * names say how well they know the word.
 */
export const BOX_NAMES = ["New", "Learning", "Familiar", "Known", "Strong", "Mastered"] as const;

export function boxName(box: number): string {
  return BOX_NAMES[Math.min(Math.max(box, 0), TOP_BOX)];
}

export interface BoxMove {
  box: number;
  /** Whole local days from today until it's due; 0 = due again today. */
  days: number;
}

/** Where a card goes after a grade, or null when it stays put. */
export function nextBox(box: number, known: boolean, isDue: boolean): BoxMove | null {
  if (!known) return { box: 1, days: 0 };
  if (!isDue) return null;
  // A new card (box 0) counts as box 1: known at first sight goes to box 2.
  const from = Math.max(box, 1);
  if (from >= TOP_BOX) return { box: TOP_BOX, days: MASTERED_DAYS };
  return { box: from + 1, days: BOX_DAYS[from + 1] };
}

export type KnowledgeState = "new" | "learning" | "review" | "mature";

/** Coarse label for word lists: box 0 new, 1–2 learning, 3–4 review, 5 mature. */
export function knowledgeFromBox(box: number): KnowledgeState {
  if (box <= 0) return "new";
  if (box <= 2) return "learning";
  if (box < TOP_BOX) return "review";
  return "mature";
}
