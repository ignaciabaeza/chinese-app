"use client";

import type { GradeOutcome } from "@/lib/review-client";

/** One line saying where the last graded card went: "长 · Box 2 → 3". */
export default function BoxMoveNote({ word, outcome }: { word: string; outcome: GradeOutcome | null }) {
  if (!outcome) return null;
  const { from, to, moved } = outcome;
  let text: string;
  let color = "var(--accent-gold)";
  if (!moved) text = `stays in box ${to} · not due yet`;
  else if (to < from || (to === 1 && from <= 1)) { text = from > 1 ? `back to box 1 (was ${from})` : "box 1 · again today"; color = "var(--accent-rose)"; }
  else if (from === to) text = `box ${to} · mastered`;
  else text = from === 0 ? `new → box ${to}` : `box ${from} → ${to}`;
  return (
    <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
      <span className="font-display" style={{ color: "var(--text-primary)" }}>{word}</span>
      {" · "}
      <span style={{ color }}>{text}</span>
    </p>
  );
}
