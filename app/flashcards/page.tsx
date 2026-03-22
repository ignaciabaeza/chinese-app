"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabulary, Word } from "@/data/vocabulary";
import {
  loadProgress,
  saveProgress,
  saveSession,
  updateCardProgress,
  getDueCards,
  CardProgress,
} from "@/lib/progress";

type LevelFilter = "all" | 1 | 2 | 3 | 4 | 5 | 6;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function FlashcardsPage() {
  const [level, setLevel] = useState<LevelFilter>("all");
  const [mode, setMode] = useState<"due" | "all">("due");
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [finished, setFinished] = useState(false);
  const [showSetup, setShowSetup] = useState(true);

  const loadQueue = useCallback(() => {
    const p = loadProgress();
    setProgress(p);
    const filtered = vocabulary.filter((w) => level === "all" ? true : w.level === level);
    const ids = filtered.map((w) => w.id);
    let selectedIds: string[];
    if (mode === "due") {
      selectedIds = getDueCards(ids, p);
      if (selectedIds.length === 0) selectedIds = ids;
    } else {
      selectedIds = ids;
    }
    const words = shuffle(selectedIds)
      .slice(0, 20)
      .map((id) => filtered.find((w) => w.id === id)!)
      .filter(Boolean);
    setQueue(words);
    setCurrentIndex(0);
    setFlipped(false);
    setTransitioning(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setFinished(false);
    setShowSetup(false);
  }, [level, mode]);

  const currentWord = queue[currentIndex];

  function handleRate(quality: 0 | 3) {
    if (!currentWord || transitioning) return;

    const updated = { ...progress };
    updated[currentWord.id] = updateCardProgress(progress[currentWord.id], currentWord.id, quality);
    saveProgress(updated);
    setProgress(updated);

    const newStats = {
      correct: sessionStats.correct + (quality === 3 ? 1 : 0),
      incorrect: sessionStats.incorrect + (quality === 0 ? 1 : 0),
    };
    setSessionStats(newStats);

    const isLast = currentIndex + 1 >= queue.length;

    // Flip card back first, then advance after animation completes
    setTransitioning(true);
    setFlipped(false);
    setTimeout(() => {
      if (isLast) {
        saveSession({
          date: new Date().toDateString(),
          cardsStudied: queue.length,
          correct: newStats.correct,
          incorrect: newStats.incorrect,
          level,
        });
        setFinished(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
      setTransitioning(false);
    }, 400);
  }

  if (showSetup) {
    return <SetupScreen level={level} setLevel={setLevel} mode={mode} setMode={setMode} onStart={loadQueue} />;
  }
  if (finished) {
    return (
      <FinishedScreen
        stats={sessionStats}
        total={queue.length}
        onRestart={() => setShowSetup(true)}
        onReview={loadQueue}
      />
    );
  }
  if (!currentWord) return null;

  const cardProgress = progress[currentWord.id];
  const chineseFontClass =
    currentWord.chinese.length <= 2 ? "chinese-xl" :
    currentWord.chinese.length <= 4 ? "chinese-lg" :
    "chinese-md";
  const accuracy =
    sessionStats.correct + sessionStats.incorrect > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
      : 0;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-up">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-ink">
          <div
            className="progress-ink-fill"
            style={{ width: `${(currentIndex / queue.length) * 100}%` }}
          />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          {currentIndex + 1} / {queue.length}
        </span>
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "Cinzel, serif" }}>
        <span style={{ color: "var(--accent-gold)" }}>✓ {sessionStats.correct}</span>
        <span style={{ color: "var(--accent-rose)" }}>✗ {sessionStats.incorrect}</span>
        {sessionStats.correct + sessionStats.incorrect > 0 && (
          <span style={{ color: "var(--text-muted)" }}>{accuracy}%</span>
        )}
      </div>

      {/* Card */}
      <div className="card-flip" style={{ height: "400px" }} onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* ── Front: navy + moon circle ── */}
          <div
            className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {/* HSK badge */}
            <div className="badge-gold mb-5" style={{ fontFamily: "Cinzel, serif" }}>
              HSK {currentWord.level} · {currentWord.category}
            </div>

            {/* Moon circle */}
            <div className="moon-circle">
              <div
                className={`${chineseFontClass} text-center leading-none font-bold`}
                style={{ color: "var(--accent-crane-white)", zIndex: 1 }}
              >
                {currentWord.chinese}
              </div>
              <div
                className="mt-2 text-xl tracking-widest font-pinyin text-center"
                style={{ color: "rgba(240,237,228,0.8)", fontStyle: "italic", zIndex: 1, lineHeight: 1.3 }}
              >
                {currentWord.pinyin}
              </div>
            </div>

            <p className="mt-5 text-xs" style={{ color: "var(--text-muted)" }}>
              tap to reveal meaning
            </p>
          </div>

          {/* ── Back: parchment ── */}
          <div
            className="card-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}
          >
            <div className="badge-gold mb-3" style={{ background: "rgba(201,168,76,0.15)" }}>
              HSK {currentWord.level}
            </div>
            <div
              className="chinese-md font-bold mb-1 text-center"
              style={{ color: "var(--text-parchment)", fontFamily: "Noto Serif SC, serif" }}
            >
              {currentWord.chinese}
            </div>
            {currentWord.traditional && currentWord.traditional !== currentWord.chinese && (
              <div className="text-sm mb-1" style={{ color: "#7A6855" }}>
                繁 {currentWord.traditional}
              </div>
            )}
            <div
              className="text-xl mb-3 font-pinyin"
              style={{ color: "#5A3F20", fontStyle: "italic" }}
            >
              {currentWord.pinyin}
            </div>
            <div
              className="text-lg text-center leading-relaxed font-body"
              style={{ color: "var(--text-parchment)", fontFamily: "Lora, serif" }}
            >
              {currentWord.english}
            </div>
            {cardProgress && (
              <div className="mt-4 text-xs" style={{ color: "#A09880" }}>
                {cardProgress.repetitions} reviews · {cardProgress.correct}✓ {cardProgress.incorrect}✗
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate buttons */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRate(0)}
            className="py-4 rounded-xl text-base font-semibold transition-all"
            style={{
              background: "rgba(196,133,122,0.08)",
              border: "1.5px solid rgba(196,133,122,0.5)",
              color: "var(--accent-rose)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,133,122,0.18)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(196,133,122,0.08)")}
          >
            ✗ Hard
          </button>
          <button
            onClick={() => handleRate(3)}
            className="py-4 rounded-xl text-base font-semibold transition-all"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-gold)";
              e.currentTarget.style.color = "var(--bg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(201,168,76,0.08)";
              e.currentTarget.style.color = "var(--accent-gold)";
            }}
          >
            ✓ Easy
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full py-4 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: "transparent",
            border: "1.5px solid var(--accent-gold)",
            color: "var(--accent-gold)",
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.08em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-gold)";
            e.currentTarget.style.color = "var(--bg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--accent-gold)";
          }}
        >
          Reveal Meaning
        </button>
      )}

      <button
        onClick={() => setShowSetup(true)}
        className="w-full text-xs transition-colors py-1"
        style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-crane-white)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        ← Back to setup
      </button>
    </div>
  );
}

function SetupScreen({ level, setLevel, mode, setMode, onStart }: {
  level: LevelFilter;
  setLevel: (l: LevelFilter) => void;
  mode: "due" | "all";
  setMode: (m: "due" | "all") => void;
  onStart: () => void;
}) {
  const p = loadProgress();
  const levelOptions: [LevelFilter, string][] = [
    ["all", "All"],
    [1, "HSK 1"],
    [2, "HSK 2"],
    [3, "HSK 3"],
    [4, "HSK 4"],
    [5, "HSK 5"],
    [6, "HSK 6"],
  ];

  const dueCount = (() => {
    const ids = vocabulary
      .filter((w) => level === "all" ? true : w.level === level)
      .map((w) => w.id);
    return getDueCards(ids, p).length;
  })();

  return (
    <div className="max-w-sm mx-auto space-y-6 animate-fade-up">
      <h1
        className="text-2xl text-center"
        style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", letterSpacing: "0.08em" }}
      >
        Flashcard Practice
      </h1>

      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div>
          <label className="text-xs block mb-3 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {levelOptions.map(([val, label]) => (
              <button
                key={String(val)}
                onClick={() => setLevel(val)}
                className="py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: level === val ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: level === val ? "var(--bg-primary)" : "var(--text-muted)",
                  border: level === val ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs block mb-3 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["due", "all"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="py-3 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: mode === m ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: mode === m ? "var(--bg-primary)" : "var(--text-muted)",
                  border: mode === m ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {m === "due" ? "Due Cards" : "All Cards"}
                <div className="text-xs opacity-70 mt-0.5">
                  {m === "due" ? `${dueCount} ready` : "random 20"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cinzel, serif",
          letterSpacing: "0.1em",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--accent-gold)";
          e.currentTarget.style.color = "var(--bg-primary)";
          e.currentTarget.style.boxShadow = "0 0 20px rgba(201,168,76,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--accent-gold)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Begin Practice
      </button>
    </div>
  );
}

function FinishedScreen({ stats, total, onRestart, onReview }: {
  stats: { correct: number; incorrect: number };
  total: number;
  onRestart: () => void;
  onReview: () => void;
}) {
  const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
  return (
    <div className="max-w-sm mx-auto text-center space-y-6 animate-fade-up">
      <div
        className="text-5xl py-4"
        style={{ color: accuracy >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}
      >
        {accuracy >= 80 ? "✦" : accuracy >= 50 ? "◈" : "◉"}
      </div>
      <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
        Session Complete
      </h2>

      <div
        className="rounded-2xl p-6 grid grid-cols-3 gap-4"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>{total}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Cards</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>{stats.correct}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Correct</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>{accuracy}%</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Accuracy</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onReview}
          className="py-3 rounded-xl text-sm transition-all"
          style={{
            fontFamily: "Cinzel, serif",
            background: "rgba(201,168,76,0.06)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        >
          Practice Again
        </button>
        <button
          onClick={onRestart}
          className="py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            fontFamily: "Cinzel, serif",
            background: "transparent",
            border: "1.5px solid var(--accent-gold)",
            color: "var(--accent-gold)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-gold)";
            e.currentTarget.style.color = "var(--bg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--accent-gold)";
          }}
        >
          New Session
        </button>
      </div>
    </div>
  );
}
