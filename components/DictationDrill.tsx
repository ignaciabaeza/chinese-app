"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Sentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  audio_path: string;
}

export default function DictationDrill() {
  const [sentence, setSentence] = useState<Sentence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState({ correct: 0, total: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadNext = useCallback(async (excludeId?: number) => {
    setError(null);
    setLoading(true);
    setRevealed(false);
    setInput("");
    try {
      const qs = excludeId ? `?exclude=${excludeId}` : "";
      const res = await fetch(`/api/listening/dictation/next${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Fetch failed: ${res.status}`);
        return;
      }
      const data: Sentence = await res.json();
      setSentence(data);
      // Autoplay
      setTimeout(() => {
        audioRef.current?.play().catch(() => {});
        inputRef.current?.focus();
      }, 50);
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

  function check() {
    if (!sentence) return;
    const expected = stripPunct(sentence.simplified);
    const got = stripPunct(input);
    const correct = expected === got;
    setRevealed(true);
    setStreak((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (revealed) loadNext(sentence?.id);
      else check();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        <span>Listen, then type what you heard (Chinese characters).</span>
        {streak.total > 0 && (
          <span>{streak.correct}/{streak.total} · {Math.round((streak.correct / streak.total) * 100)}%</span>
        )}
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      {loading && !sentence && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
      )}

      {sentence && (
        <>
          <audio ref={audioRef} src={sentence.audio_path} preload="auto" className="hidden" />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={replay}
              className="py-3 rounded-xl text-sm"
              style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
            >
              ▶ Replay
            </button>
            {!revealed ? (
              <button
                onClick={check}
                disabled={input.trim().length === 0}
                className="py-3 rounded-xl text-sm"
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--accent-gold)",
                  color: "var(--accent-gold)",
                  fontFamily: "Cormorant Garamond, serif",
                  letterSpacing: "0.05em",
                  opacity: input.trim().length === 0 ? 0.4 : 1,
                }}
              >
                Check
              </button>
            ) : (
              <button
                onClick={() => loadNext(sentence.id)}
                className="py-3 rounded-xl text-sm"
                style={{ background: "transparent", border: "1.5px solid var(--accent-rose)", color: "var(--accent-rose)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
              >
                Next →
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={revealed}
            placeholder="Type what you heard…"
            className="w-full px-4 py-3 rounded-xl text-lg"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              fontFamily: "Noto Serif SC, serif",
            }}
          />

          {revealed && (
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}>
              <div className="text-xs uppercase tracking-widest" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
                {stripPunct(input) === stripPunct(sentence.simplified) ? "✓ Correct" : "Compared"}
              </div>
              <CharDiff expected={sentence.simplified} got={input} />
              {sentence.pinyin && (
                <div className="text-sm font-pinyin" style={{ color: "#7A6855", fontStyle: "italic" }}>{sentence.pinyin}</div>
              )}
              <div className="text-sm" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>{sentence.english}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function stripPunct(s: string): string {
  return s.replace(/[\s。，！？、,.\?!;:'"“”‘’《》()（）]/g, "");
}

function CharDiff({ expected, got }: { expected: string; got: string }) {
  // Character-level diff against the expected answer. Punctuation in the
  // expected string is rendered in muted color but never marked wrong.
  const gotClean = stripPunct(got);
  const expChars = Array.from(expected);
  let gi = 0;
  return (
    <div className="font-display text-xl flex flex-wrap" style={{ color: "var(--text-parchment)" }}>
      {expChars.map((ec, i) => {
        const isPunct = stripPunct(ec) === "";
        if (isPunct) {
          return <span key={i} style={{ color: "#7A6855" }}>{ec}</span>;
        }
        const guess = gotClean[gi];
        gi++;
        const match = guess === ec;
        return (
          <span
            key={i}
            style={{
              color: match ? "var(--accent-gold)" : "var(--accent-rose)",
              borderBottom: match ? "2px solid var(--accent-gold)" : "2px solid var(--accent-rose)",
              padding: "0 2px",
            }}
            title={match ? "" : `you typed: ${guess ?? "—"}`}
          >
            {ec}
          </span>
        );
      })}
    </div>
  );
}
