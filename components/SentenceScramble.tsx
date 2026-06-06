"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  /** Tokens in their CORRECT order. */
  tokens: string[];
  /** Pinyin shown above each chip, same order as tokens (optional). */
  pinyin?: string[];
  /** English translation shown after a successful check. */
  english?: string;
}

type Verdict = "idle" | "correct" | "wrong";

/**
 * Click-to-arrange sentence scramble. Bottom row is the token bank (shuffled);
 * top row is the user's answer. Tap a chip in the bank to send it up; tap a
 * chip in the answer to send it back. "Check" compares positional equality.
 */
export default function SentenceScramble({ tokens, pinyin, english }: Props) {
  // Each chip carries its original index so we can compare without ambiguity
  // when tokens repeat (e.g. 我 appearing twice).
  type Chip = { idx: number; t: string; p?: string };

  const initial: Chip[] = useMemo(
    () => tokens.map((t, idx) => ({ idx, t, p: pinyin?.[idx] })),
    [tokens, pinyin],
  );

  const [bank, setBank] = useState<Chip[]>([]);
  const [answer, setAnswer] = useState<Chip[]>([]);
  const [verdict, setVerdict] = useState<Verdict>("idle");

  // Shuffle on mount and whenever `tokens` change.
  useEffect(() => {
    const shuffled = [...initial];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // If the shuffle happens to produce the original order, swap the first two
    // chips so the exercise is never a no-op.
    if (shuffled.length >= 2 && shuffled.every((c, i) => c.idx === i)) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    setBank(shuffled);
    setAnswer([]);
    setVerdict("idle");
  }, [initial]);

  function pickFromBank(chip: Chip) {
    if (verdict !== "idle") return;
    setBank((b) => b.filter((c) => c.idx !== chip.idx));
    setAnswer((a) => [...a, chip]);
  }

  function popFromAnswer(chip: Chip) {
    if (verdict !== "idle") return;
    setAnswer((a) => a.filter((c) => c.idx !== chip.idx));
    setBank((b) => [...b, chip]);
  }

  function check() {
    if (answer.length !== tokens.length) return;
    const correct = answer.every((c, i) => c.idx === i);
    setVerdict(correct ? "correct" : "wrong");
  }

  function reset() {
    const shuffled = [...initial];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setBank(shuffled);
    setAnswer([]);
    setVerdict("idle");
  }

  const slotsToFill = tokens.length - answer.length;

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          Arrange the sentence
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {answer.length}/{tokens.length}
        </span>
      </div>

      {/* Answer row */}
      <div
        className="min-h-[64px] p-3 rounded-lg flex flex-wrap gap-2 items-center"
        style={{
          background: verdict === "correct"
            ? "rgba(201,168,76,0.10)"
            : verdict === "wrong"
              ? "rgba(196,133,122,0.10)"
              : "var(--bg-parchment)",
          border: "1px dashed var(--border-subtle)",
        }}
      >
        {answer.map((c) => (
          <Chip key={`a-${c.idx}`} chip={c} onClick={() => popFromAnswer(c)} variant="answer" />
        ))}
        {Array.from({ length: slotsToFill }).map((_, i) => (
          <span key={`slot-${i}`} className="inline-block" style={{ width: 36, height: 1, borderBottom: "1px solid var(--border-subtle)" }} />
        ))}
      </div>

      {/* Bank */}
      <div className="flex flex-wrap gap-2 min-h-[44px]">
        {bank.map((c) => (
          <Chip key={`b-${c.idx}`} chip={c} onClick={() => pickFromBank(c)} variant="bank" />
        ))}
        {bank.length === 0 && verdict === "idle" && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>(all chips placed — tap one in the answer to take it back)</span>
        )}
      </div>

      {/* Result + buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm" style={{ fontFamily: "Spectral, serif" }}>
          {verdict === "correct" && (
            <span style={{ color: "var(--accent-gold)" }}>
              ✓ Correct{english ? ` — ${english}` : ""}
            </span>
          )}
          {verdict === "wrong" && (
            <span style={{ color: "var(--accent-rose)" }}>
              ✗ Not quite — try again
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {verdict === "idle" ? (
            <button
              onClick={check}
              disabled={answer.length !== tokens.length}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: "transparent",
                border: "1.5px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.05em",
                opacity: answer.length === tokens.length ? 1 : 0.4,
                cursor: answer.length === tokens.length ? "pointer" : "default",
              }}
            >
              Check
            </button>
          ) : (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: "transparent",
                border: "1.5px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.05em",
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ chip, onClick, variant }: { chip: { idx: number; t: string; p?: string }; onClick: () => void; variant: "bank" | "answer" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-col items-center px-3 py-1.5 rounded-lg transition-all"
      style={{
        background: variant === "answer" ? "var(--bg-parchment)" : "var(--bg-secondary)",
        border: variant === "answer" ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
        color: variant === "answer" ? "var(--text-parchment)" : "var(--text-primary)",
        minHeight: 40,
        cursor: "pointer",
      }}
    >
      {chip.p && (
        <span className="text-[10px] font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1 }}>
          {chip.p}
        </span>
      )}
      <span className="font-display text-base leading-tight" style={{ fontFamily: "Noto Serif SC, serif" }}>
        {chip.t}
      </span>
    </button>
  );
}
