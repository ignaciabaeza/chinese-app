"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTonePattern } from "@/lib/pinyin";

interface Drill {
  word_id: number;
  simplified: string;
  pinyin: string;
  english: string;
  audio_path: string;
  answerIndex: number;
  options: number[][];
}

export default function ToneDrill() {
  const [drill, setDrill] = useState<Drill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadNext = useCallback(async (excludeId?: number) => {
    setError(null);
    setLoading(true);
    setPicked(null);
    try {
      const qs = excludeId ? `?exclude=${excludeId}` : "";
      const res = await fetch(`/api/listening/tones/next${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Fetch failed: ${res.status}`);
        return;
      }
      const data: Drill = await res.json();
      setDrill(data);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNext(); }, [loadNext]);

  function replay() {
    const el = audioRef.current;
    if (!el) return;
    try { el.currentTime = 0; } catch {}
    el.play().catch(() => {});
  }

  function pick(i: number) {
    if (picked !== null || !drill) return;
    setPicked(i);
    setScore((s) => ({ correct: s.correct + (i === drill.answerIndex ? 1 : 0), total: s.total + 1 }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        <span>Listen, then pick the matching tone pattern.</span>
        {score.total > 0 && (
          <span>{score.correct}/{score.total} · {Math.round((score.correct / score.total) * 100)}%</span>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      {loading && !drill && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
      )}

      {drill && (
        <>
          <audio ref={audioRef} src={drill.audio_path} preload="auto" className="hidden" />

          <button
            onClick={replay}
            className="w-full py-4 rounded-xl text-sm"
            style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
          >
            ▶ Replay
          </button>

          <div className="grid grid-cols-2 gap-3">
            {drill.options.map((opt, i) => {
              const isAnswer = i === drill.answerIndex;
              const isPicked = i === picked;
              const showResult = picked !== null;
              let color = "var(--accent-gold)";
              let bg = "transparent";
              if (showResult) {
                if (isAnswer) { color = "var(--accent-gold)"; bg = "rgba(201,168,76,0.10)"; }
                else if (isPicked) { color = "var(--accent-rose)"; bg = "rgba(196,133,122,0.10)"; }
                else { color = "var(--text-muted)"; }
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className="py-4 rounded-xl flex flex-col items-center gap-1"
                  style={{
                    background: bg,
                    border: `1.5px solid ${color}`,
                    color,
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.08em",
                    cursor: picked === null ? "pointer" : "default",
                  }}
                >
                  <div className="flex items-center gap-1">
                    {opt.map((t, ti) => (
                      <ToneBar key={ti} tone={t} />
                    ))}
                  </div>
                  <div className="text-base font-bold">{formatTonePattern(opt)}</div>
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="rounded-2xl p-5 space-y-2" style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}>
              <div className="text-xs uppercase tracking-widest" style={{ color: picked === drill.answerIndex ? "var(--accent-gold)" : "var(--accent-rose)", fontFamily: "Cormorant Garamond, serif" }}>
                {picked === drill.answerIndex ? "✓ Correct" : "✗ Not quite"}
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-2xl" style={{ color: "var(--text-parchment)" }}>{drill.simplified}</span>
                <span className="font-pinyin text-base" style={{ color: "#7A6855", fontStyle: "italic" }}>{drill.pinyin}</span>
              </div>
              <div className="text-sm" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>{drill.english}</div>
              <button
                onClick={() => loadNext(drill.word_id)}
                className="mt-2 w-full py-2 rounded-lg text-sm"
                style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** A tiny graphical hint for each tone (1 high, 2 rising, 3 dip, 4 falling, 5 flat). */
function ToneBar({ tone }: { tone: number }) {
  const PATHS: Record<number, string> = {
    1: "M2 8 L18 8",         // high flat
    2: "M2 14 L18 4",        // rising
    3: "M2 6 Q10 18 18 6",   // dip
    4: "M2 4 L18 14",        // falling
    5: "M2 11 L18 11",       // neutral (mid flat)
  };
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" aria-hidden="true">
      <path d={PATHS[tone] ?? PATHS[5]} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
