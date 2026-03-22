"use client";

import { useState, useEffect, useCallback } from "react";
import { loadProgress, saveProgress, syncProgressToServer, updateCardProgress } from "@/lib/progress";

interface Sentence {
  id: string;
  level: number;
  chinese: string;
  pinyin: string;
  english: string;
  grammar: string;
  pattern: string;
}

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export default function SentencesPage() {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [queue, setQueue] = useState<Sentence[]>([]);
  const [current, setCurrent] = useState<Sentence | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [started, setStarted] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, hard: 0, again: 0 });
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(loadProgress());

  const fetchSentences = useCallback(async (level: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sentences?level=${level}`);
      const data = await res.json();
      setSentences(data.sentences ?? []);
    } catch {
      setSentences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentences(selectedLevel);
  }, [selectedLevel, fetchSentences]);

  function startSession() {
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrent(shuffled[0] ?? null);
    setFlipped(false);
    setShowPinyin(false);
    setSessionStats({ correct: 0, hard: 0, again: 0 });
    setDone(false);
    setStarted(true);
  }

  function handleRate(quality: 0 | 2 | 3) {
    if (!current) return;

    const updated = updateCardProgress(progress[current.id], current.id, quality);
    const newProgress = { ...progress, [current.id]: updated };
    setProgress(newProgress);
    saveProgress(newProgress);
    syncProgressToServer(newProgress);

    setSessionStats((s) => ({
      correct: s.correct + (quality === 3 ? 1 : 0),
      hard: s.hard + (quality === 2 ? 1 : 0),
      again: s.again + (quality === 0 ? 1 : 0),
    }));

    const remaining = queue.slice(1);

    // Flip card back first, then advance after animation completes
    setFlipped(false);
    setShowPinyin(false);
    setTimeout(() => {
      if (remaining.length === 0) {
        setDone(true);
        setCurrent(null);
      } else {
        setQueue(remaining);
        setCurrent(remaining[0]);
      }
    }, 400);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/sentences?level=${selectedLevel}`, { method: "POST" });
      const data = await res.json();
      setSentences(data.sentences ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  const learned = sentences.filter((s) => (progress[s.id]?.repetitions ?? 0) >= 3).length;
  const due = sentences.filter((s) => {
    const p = progress[s.id];
    return !p || p.nextReview <= Date.now();
  }).length;

  // ── Setup screen ─────────────────────────────────────────────────────────────
  if (!started || done) {
    return (
      <div className="max-w-lg mx-auto">
        {done && (
          <div
            className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="text-3xl mb-2" style={{ color: "var(--accent-gold)", fontFamily: "Noto Serif SC, serif" }}>
              完成！
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
              Session complete
            </p>
            <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "Cinzel, serif" }}>
              <span style={{ color: "#6BCB77" }}>Easy: {sessionStats.correct}</span>
              <span style={{ color: "var(--accent-gold)" }}>Hard: {sessionStats.hard}</span>
              <span style={{ color: "var(--accent-rose)" }}>Again: {sessionStats.again}</span>
            </div>
          </div>
        )}

        {/* Level picker */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <h1
            className="text-xl mb-1"
            style={{ fontFamily: "Cinzel, serif", color: "var(--text-primary)", letterSpacing: "0.08em" }}
          >
            Sentence Practice
          </h1>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
            Grammar patterns · Natural sentences · Spaced repetition
          </p>

          <p className="text-xs mb-3 tracking-wider" style={{ fontFamily: "Cinzel, serif", color: "var(--text-muted)" }}>
            SELECT LEVEL
          </p>
          <div className="flex gap-2 flex-wrap mb-6">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => { setSelectedLevel(l); setStarted(false); }}
                className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: selectedLevel === l ? "var(--accent-gold)" : "rgba(201,168,76,0.08)",
                  color: selectedLevel === l ? "var(--bg-primary)" : "var(--accent-gold)",
                  border: `1px solid ${selectedLevel === l ? "var(--accent-gold)" : "rgba(201,168,76,0.3)"}`,
                  fontWeight: selectedLevel === l ? "600" : "400",
                }}
              >
                HSK {l}
              </button>
            ))}
          </div>

          {/* Level stats */}
          {!loading && sentences.length > 0 && (
            <div
              className="flex gap-4 text-xs mb-6 p-3 rounded-xl"
              style={{ background: "rgba(0,0,0,0.2)", fontFamily: "Cinzel, serif" }}
            >
              <span style={{ color: "var(--text-muted)" }}>Total: <span style={{ color: "var(--text-primary)" }}>{sentences.length}</span></span>
              <span style={{ color: "var(--text-muted)" }}>Due: <span style={{ color: "var(--accent-gold)" }}>{due}</span></span>
              <span style={{ color: "var(--text-muted)" }}>Learned: <span style={{ color: "#6BCB77" }}>{learned}</span></span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif", fontSize: "0.85rem" }}>
              Generating sentences with AI… 请稍候
            </div>
          ) : (
            <button
              onClick={startSession}
              disabled={sentences.length === 0}
              className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider transition-all"
              style={{
                fontFamily: "Cinzel, serif",
                background: "linear-gradient(135deg, var(--accent-gold), #E8C76A)",
                color: "var(--bg-primary)",
                opacity: sentences.length === 0 ? 0.5 : 1,
              }}
            >
              Start Session · {sentences.length} cards
            </button>
          )}
        </div>

        {/* Refresh batch */}
        {!loading && sentences.length > 0 && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full py-2.5 rounded-xl text-xs tracking-wider transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
              background: "transparent",
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            {refreshing ? "Generating new sentences…" : "↻ Refresh Sentences (generate new batch)"}
          </button>
        )}
      </div>
    );
  }

  // ── Flashcard ─────────────────────────────────────────────────────────────────
  const remaining = queue.length;
  const total = sentences.length;
  const progressPct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 progress-ink rounded-full">
          <div
            className="progress-ink-fill h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs" style={{ fontFamily: "Cinzel, serif", color: "var(--text-muted)" }}>
          {total - remaining}/{total}
        </span>
        <button
          onClick={() => { setStarted(false); setDone(false); }}
          className="text-xs px-2 py-1 rounded"
          style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif", border: "1px solid var(--border-subtle)" }}
        >
          ✕
        </button>
      </div>

      {/* Card */}
      {current && (
        <div
          className="card-flip w-full mb-6 cursor-pointer"
          style={{ height: "400px" }}
          onClick={() => !flipped && setFlipped(true)}
        >
          <div className={`card-inner relative h-full ${flipped ? "flipped" : ""}`}>
            {/* Front — Chinese sentence + pinyin */}
            <div
              className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 gap-3"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              }}
            >
              <div
                className="text-xs tracking-widest"
                style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)", opacity: 0.7 }}
              >
                HSK {current.level} · SENTENCE
              </div>
              <div
                className="text-center leading-relaxed"
                style={{
                  fontFamily: "Noto Serif SC, serif",
                  fontSize: "clamp(1.4rem, 5vw, 2rem)",
                  color: "var(--text-primary)",
                  letterSpacing: "0.05em",
                }}
              >
                {current.chinese}
              </div>
              {showPinyin ? (
                <div
                  className="text-center"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "clamp(0.95rem, 3vw, 1.15rem)",
                    color: "rgba(201,168,76,0.75)",
                    fontStyle: "italic",
                    letterSpacing: "0.03em",
                  }}
                >
                  {current.pinyin}
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPinyin(true); }}
                  className="text-xs px-3 py-1 rounded-full transition-all"
                  style={{
                    color: "rgba(201,168,76,0.7)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    fontFamily: "Cinzel, serif",
                    background: "transparent",
                    letterSpacing: "0.06em",
                  }}
                >
                  show pinyin
                </button>
              )}
              <div
                className="text-xs mt-2 text-center"
                style={{ color: "var(--text-muted)", fontFamily: "Lora, serif", fontStyle: "italic" }}
              >
                tap to reveal
              </div>
            </div>

            {/* Back — translation, grammar note */}
            <div
              className="card-back absolute inset-0 rounded-2xl flex flex-col justify-between p-8"
              style={{ background: "var(--bg-parchment)" }}
            >
              <div className="flex flex-col gap-3">
                {/* Chinese again for reference */}
                <div
                  className="text-center"
                  style={{
                    fontFamily: "Noto Serif SC, serif",
                    fontSize: "clamp(1.2rem, 4vw, 1.6rem)",
                    color: "#2D3561",
                    letterSpacing: "0.05em",
                  }}
                >
                  {current.chinese}
                </div>
                {/* Pinyin */}
                <div
                  className="text-center"
                  style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem", color: "#7A6A50", fontStyle: "italic" }}
                >
                  {current.pinyin}
                </div>
                {/* English */}
                <div
                  className="text-center font-medium"
                  style={{ fontFamily: "Lora, serif", color: "#3A3020", fontSize: "1rem" }}
                >
                  {current.english}
                </div>
              </div>

              {/* Grammar note */}
              <div
                className="rounded-xl p-4 mt-3"
                style={{ background: "rgba(45,53,97,0.08)", border: "1px solid rgba(45,53,97,0.15)" }}
              >
                <div
                  className="text-xs tracking-wider mb-1"
                  style={{ fontFamily: "Cinzel, serif", color: "#7A6A50" }}
                >
                  GRAMMAR
                </div>
                <div className="text-xs" style={{ fontFamily: "Lora, serif", color: "#3A3020", lineHeight: "1.5" }}>
                  {current.grammar}
                </div>
                <div
                  className="text-xs mt-2 font-mono opacity-70"
                  style={{ color: "#5A4A30", fontSize: "0.7rem" }}
                >
                  {current.pattern}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating buttons — only show when flipped */}
      {flipped && (
        <div className="flex gap-3 animate-fade-up">
          <button
            onClick={() => handleRate(0)}
            className="flex-1 py-3 rounded-xl text-sm transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              background: "rgba(196,133,122,0.15)",
              color: "var(--accent-rose)",
              border: "1px solid rgba(196,133,122,0.35)",
              letterSpacing: "0.05em",
            }}
          >
            Again
          </button>
          <button
            onClick={() => handleRate(2)}
            className="flex-1 py-3 rounded-xl text-sm transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              background: "rgba(201,168,76,0.12)",
              color: "var(--accent-gold)",
              border: "1px solid rgba(201,168,76,0.35)",
              letterSpacing: "0.05em",
            }}
          >
            Hard
          </button>
          <button
            onClick={() => handleRate(3)}
            className="flex-1 py-3 rounded-xl text-sm transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              background: "rgba(107,203,119,0.12)",
              color: "#6BCB77",
              border: "1px solid rgba(107,203,119,0.35)",
              letterSpacing: "0.05em",
            }}
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
}
