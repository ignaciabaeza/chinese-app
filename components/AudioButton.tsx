"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  /** Try to play the moment this component mounts (or src changes). */
  autoPlay?: boolean;
  /** Visual size. */
  size?: "sm" | "md" | "lg";
  /** Aria-label / title for the button. */
  label?: string;
  className?: string;
}

/**
 * Small play button that loads an audio file lazily and plays it. Replays on
 * each click. Silently swallows the AbortError that browsers throw when a
 * play() promise is interrupted by a new play() — common during autoplay.
 */
export default function AudioButton({ src, autoPlay = false, size = "md", label, className }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    try { el.currentTime = 0; } catch {}
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.then(() => setPlaying(true)).catch(() => { /* swallow autoplay block */ });
    }
  }, []);

  // Autoplay on mount / src change.
  useEffect(() => {
    if (autoPlay && src) play();
  }, [autoPlay, src, play]);

  const px = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const iconPx = size === "sm" ? 12 : size === "lg" ? 20 : 14;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); play(); }}
      aria-label={label ?? "Play audio"}
      title={label ?? "Play audio"}
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: "50%",
        background: playing ? "var(--accent-gold)" : "transparent",
        border: "1.5px solid var(--accent-gold)",
        color: playing ? "var(--bg-parchment)" : "var(--accent-gold)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {/* Speaker icon */}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginLeft: 1 }}
        aria-hidden="true"
      >
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06A7 7 0 0 1 14 18.7v2.07a9 9 0 0 0 0-17.54z" />
      </svg>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </button>
  );
}
