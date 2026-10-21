// Client-side helper for POST /api/review/grade, shared by /review and
// /writing. Throws a user-facing message when the grade wasn't saved, so the
// page can keep the card on screen instead of silently losing the answer.

export async function submitGrade(cardId: number, rating: 1 | 2 | 3 | 4, elapsedMs: number): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/review/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId, rating, elapsedMs }),
    });
  } catch {
    throw new Error("No connection — your answer wasn't saved. Try again.");
  }
  // 409 = this card was already graded a moment ago (double tap): treat as saved.
  if (res.ok || res.status === 409) return;
  if (res.status === 401) throw new Error("Your session expired — sign in again to keep saving progress.");
  throw new Error("Couldn't save your answer. Try again.");
}
