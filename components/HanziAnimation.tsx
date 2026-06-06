"use client";

/**
 * Loops the stroke-order animation for a single character using HanziWriter.
 * Stroke data is fetched at runtime from the hanzi-writer CDN — no install
 * of `hanzi-writer-data` needed for development. Click to restart.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  char: string;
  size?: number;
  showOutline?: boolean;
}

export default function HanziAnimation({ char, size = 140, showOutline = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const writerRef = useRef<{ animateCharacter: () => void; loopCharacterAnimation: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const id = `hanzi-${char}-${size}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Dynamic import — HanziWriter is a window-dependent module.
        const { default: HanziWriter } = await import("hanzi-writer");
        if (cancelled || !ref.current) return;
        // Clear any prior render
        ref.current.innerHTML = "";
        const writer = HanziWriter.create(ref.current, char, {
          width: size,
          height: size,
          padding: 4,
          showOutline,
          strokeColor: "#A23A4A",          // seal crimson
          outlineColor: "rgba(60,48,30,0.18)",
          radicalColor: "#4A788F",         // seigaiha blue (when known)
          delayBetweenStrokes: 90,
          strokeAnimationSpeed: 0.9,
        });
        writerRef.current = writer as unknown as typeof writerRef.current;
        writer.loopCharacterAnimation();
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [char, size, showOutline]);

  if (error) {
    return (
      <div
        ref={ref}
        id={id}
        className="font-display rounded-lg flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          fontSize: size * 0.55,
          color: "var(--text-muted)",
        }}
        title={`stroke data unavailable: ${error}`}
      >
        {char}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      id={id}
      role="img"
      aria-label={`Stroke order for ${char}`}
      className="rounded-lg cursor-pointer"
      style={{
        width: size,
        height: size,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
      }}
      onClick={() => writerRef.current?.animateCharacter()}
    />
  );
}
