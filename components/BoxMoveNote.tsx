"use client";

import type { GradeOutcome } from "@/lib/review-client";
import { boxName, MASTERED_DAYS } from "@/lib/leitner-rules";

/** One line saying where the last graded card went: "长 · Familiar → Known". */
export default function BoxMoveNote({ word, outcome }: { word: string; outcome: GradeOutcome | null }) {
  if (!outcome) return null;
  const { from, to, moved } = outcome;
  let text: string;
  let color = "var(--accent-gold)";
  if (!moved) text = `still ${boxName(to)} · not due yet`;
  else if (to < from || (to === 1 && from <= 1)) {
    text = from > 1 ? `back to Learning (was ${boxName(from)})` : "Learning · again today";
    color = "var(--accent-rose)";
  }
  else if (from === to) text = `${boxName(to)} · next check in ${MASTERED_DAYS} days`;
  else text = `${boxName(from)} → ${boxName(to)}`;
  return (
    <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
      <span className="font-display" style={{ color: "var(--text-primary)" }}>{word}</span>
      {" · "}
      <span style={{ color }}>{text}</span>
    </p>
  );
}
