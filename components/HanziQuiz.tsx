"use client";

/**
 * HanziWriter quiz mode for a single character. Reports a rating-derived
 * stroke-correctness summary up to the parent when the character is finished.
 *
 *   onComplete({ totalMistakes, strokesNumber }) — fired once per char.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  char: string;
  size?: number;
  onComplete: (summary: { totalMistakes: number; strokesNumber: number }) => void;
  resetKey?: number; // bump to force re-mount of quiz on the same char
}

export default function HanziQuiz({ char, size = 280, onComplete, resetKey = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsHint, setNeedsHint] = useState(false);
  const writerRef = useRef<{ showHintAfterMisses?: (n: number) => void; quiz: (opts: object) => void; animateCharacter: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: HanziWriter } = await import("hanzi-writer");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        const writer = HanziWriter.create(ref.current, char, {
          width: size,
          height: size,
          padding: 6,
          showCharacter: false,
          showOutline: true,
          strokeColor: "#A23A4A",
          outlineColor: "rgba(60,48,30,0.22)",
          drawingColor: "#4A788F",
          drawingWidth: 30,
          highlightColor: "#A23A4A",
        });
        writerRef.current = writer as unknown as typeof writerRef.current;
        writer.quiz({
          showHintAfterMisses: 3,
          onComplete: (summary: { totalMistakes: number; strokesNumber?: number }) => {
            onComplete({
              totalMistakes: summary.totalMistakes ?? 0,
              strokesNumber: summary.strokesNumber ?? 0,
            });
          },
          onMistake: () => setNeedsHint(true),
          onCorrectStroke: () => setNeedsHint(false),
        });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [char, size, onComplete, resetKey]);

  if (error) {
    return (
      <div
        className="rounded-lg flex flex-col items-center justify-center gap-2 p-4"
        style={{ width: size, height: size, background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="font-display" style={{ fontSize: size * 0.4, color: "var(--text-muted)" }}>{char}</div>
        <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          stroke data unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        role="img"
        aria-label={`Practice writing ${char}`}
        className="rounded-lg touch-none"
        style={{
          width: size,
          height: size,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      />
      {needsHint && (
        <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          A hint will appear after 3 missed attempts on this stroke.
        </p>
      )}
    </div>
  );
}
