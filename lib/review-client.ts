// Client-side helper for POST /api/review/grade, shared by every page that
// grades cards. Throws a user-facing message when the grade wasn't saved, so
// the page can keep the card on screen instead of silently losing the answer.

export type GradeTarget =
  | { cardId: number }
  | { wordId: number; cardType: "recognition" | "listening" | "writing" }
  | { deckCardId: number; cardType: "recognition" | "listening" | "writing" };

/** Where the card went (see lib/leitner-rules.ts). */
export interface GradeOutcome {
  from: number;
  to: number;
  moved: boolean;
}

/** Resolves with the box move, or null for a double tap the server already saved. */
export async function submitGrade(target: GradeTarget, known: boolean, elapsedMs?: number): Promise<GradeOutcome | null> {
  let res: Response;
  try {
    res = await fetch("/api/review/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...target, rating: known ? 3 : 1, elapsedMs }),
    });
  } catch {
    throw new Error("No connection — your answer wasn't saved. Try again.");
  }
  // 409 = this card was already graded a moment ago (double tap): treat as saved.
  if (res.status === 409) return null;
  if (res.ok) {
    const data = await res.json().catch(() => null);
    return data ? { from: data.from, to: data.to, moved: data.moved } : null;
  }
  if (res.status === 401) throw new Error("Your session expired — sign in again to keep saving progress.");
  throw new Error("Couldn't save your answer. Try again.");
}
