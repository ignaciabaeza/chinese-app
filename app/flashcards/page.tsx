"use client";

import { useState, useEffect, useCallback } from "react";
import { vocabulary, Word } from "@/data/vocabulary";
import {
  loadProgress,
  saveProgress,
  saveSessionWithSync,
  updateCardProgress,
  getDueCards,
  CardProgress,
} from "@/lib/progress";

type LevelFilter = "all" | 1 | 2 | 3 | 4 | 5 | 6;
type CategoryFilter = "all" | string;

const CATEGORIES: string[] = [
  "verbs", "nouns", "adjectives", "adverbs", "pronouns",
  "numbers", "time", "places", "directions", "conjunctions",
  "particles", "prepositions", "measure words", "idioms", "proper nouns", "other",
];

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
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [mode, setMode] = useState<"due" | "all" | "drill">("due");
  const [size, setSize] = useState<10 | 20>(20);
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [finished, setFinished] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);
  const [drillTotal, setDrillTotal] = useState(0);
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [sessionWordIds, setSessionWordIds] = useState<string[]>([]);

  const loadQueue = useCallback(() => {
    const p = loadProgress();
    setProgress(p);
    const filtered = vocabulary.filter(
      (w) =>
        (level === "all" || w.level === level) &&
        (category === "all" || w.category === category)
    );
    const ids = filtered.map((w) => w.id);
    let selectedIds: string[];
    if (mode === "due") {
      selectedIds = getDueCards(ids, p);
      if (selectedIds.length === 0) selectedIds = ids;
    } else {
      selectedIds = ids;
    }
    const words = shuffle(selectedIds)
      .slice(0, size)
      .map((id) => filtered.find((w) => w.id === id)!)
      .filter(Boolean);
    setQueue(words);
    setCurrentIndex(0);
    setFlipped(false);
    setShowPinyin(false);
    setTransitioning(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    setMasteredCount(0);
    setDrillTotal(words.length);
    setLearnedIds(new Set());
    setSessionWordIds(words.map((w) => w.id));
    setFinished(false);
    setShowSetup(false);
  }, [level, category, mode, size]);

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

    if (quality === 3) {
      setLearnedIds((prev) => new Set(prev).add(currentWord.id));
    }

    setTransitioning(true);
    setFlipped(false);
    setShowPinyin(false);

    if (mode === "drill" && quality === 0) {
      // Hard in drill mode: send card to back of queue
      setTimeout(() => {
        setQueue((q) => [...q, currentWord]);
        setCurrentIndex((i) => i + 1);
        setTransitioning(false);
      }, 400);
    } else {
      // Easy, or any non-drill mode: advance normally
      const newMastered = mode === "drill" ? masteredCount + 1 : masteredCount;
      if (mode === "drill") setMasteredCount(newMastered);

      const isDone =
        mode === "drill"
          ? newMastered >= drillTotal
          : currentIndex + 1 >= queue.length;

      setTimeout(() => {
        if (isDone) {
          saveSessionWithSync({
            date: new Date().toDateString(),
            cardsStudied: mode === "drill" ? drillTotal : queue.length,
            correct: newStats.correct,
            incorrect: newStats.incorrect,
            level,
            wordIds: sessionWordIds,
          });
          setFinished(true);
        } else {
          setCurrentIndex((i) => i + 1);
        }
        setTransitioning(false);
      }, 400);
    }
  }

  if (showSetup) {
    return <SetupScreen level={level} setLevel={setLevel} category={category} setCategory={setCategory} mode={mode} setMode={setMode} size={size} setSize={setSize} onStart={loadQueue} />;
  }
  if (finished) {
    const learnedWords = vocabulary.filter((w) => learnedIds.has(w.id));
    return (
      <FinishedScreen
        stats={sessionStats}
        total={mode === "drill" ? drillTotal : queue.length}
        isDrill={mode === "drill"}
        learnedWords={learnedWords}
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
            style={{
              width: mode === "drill"
                ? `${(masteredCount / drillTotal) * 100}%`
                : `${(currentIndex / queue.length) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          {mode === "drill"
            ? `${masteredCount} / ${drillTotal} mastered`
            : `${currentIndex + 1} / ${queue.length}`}
        </span>
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "Cinzel, serif" }}>
        <span style={{ color: "var(--accent-gold)" }}>✓ {sessionStats.correct}</span>
        <span style={{ color: "var(--accent-rose)" }}>✗ {sessionStats.incorrect}</span>
        {sessionStats.correct + sessionStats.incorrect > 0 && (
          <span style={{ color: "var(--text-muted)" }}>{accuracy}%</span>
        )}
        {mode === "drill" && queue.length - currentIndex - 1 > drillTotal - masteredCount && (
          <span style={{ color: "var(--text-muted)" }}>
            {queue.length - currentIndex - 1} left
          </span>
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
              {showPinyin && (
                <div
                  className="mt-2 text-xl tracking-widest font-pinyin text-center"
                  style={{ color: "rgba(240,237,228,0.8)", fontStyle: "italic", zIndex: 1, lineHeight: 1.3 }}
                >
                  {currentWord.pinyin}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-2">
              {!showPinyin && (
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
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                tap to reveal meaning
              </p>
            </div>
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

function SetupScreen({ level, setLevel, category, setCategory, mode, setMode, size, setSize, onStart }: {
  level: LevelFilter;
  setLevel: (l: LevelFilter) => void;
  category: CategoryFilter;
  setCategory: (c: CategoryFilter) => void;
  mode: "due" | "all" | "drill";
  setMode: (m: "due" | "all" | "drill") => void;
  size: 10 | 20;
  setSize: (s: 10 | 20) => void;
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
      .filter(
        (w) =>
          (level === "all" || w.level === level) &&
          (category === "all" || w.category === category)
      )
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
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              key="all"
              onClick={() => setCategory("all")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                fontFamily: "Cinzel, serif",
                background: category === "all" ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                color: category === "all" ? "var(--bg-primary)" : "var(--text-muted)",
                border: category === "all" ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
              }}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: category === cat ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: category === cat ? "var(--bg-primary)" : "var(--text-muted)",
                  border: category === cat ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs block mb-3 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { val: "due", label: "Due Cards", sub: `${dueCount} ready` },
              { val: "all", label: "All Cards", sub: "random" },
              { val: "drill", label: "Drill", sub: "repeat hard" },
            ] as const).map(({ val, label, sub }) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className="py-3 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: mode === val ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: mode === val ? "var(--bg-primary)" : "var(--text-muted)",
                  border: mode === val ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {label}
                <div className="text-xs opacity-70 mt-0.5">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs block mb-3 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Cards per session
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([10, 20] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className="py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: size === s ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: size === s ? "var(--bg-primary)" : "var(--text-muted)",
                  border: size === s ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {s} cards
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

function FinishedScreen({ stats, total, isDrill, learnedWords, onRestart, onReview }: {
  stats: { correct: number; incorrect: number };
  total: number;
  isDrill?: boolean;
  learnedWords: Word[];
  onRestart: () => void;
  onReview: () => void;
}) {
  const totalAttempts = stats.correct + stats.incorrect;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0;
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-up">
      <div
        className="text-5xl py-4"
        style={{ color: accuracy >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}
      >
        {isDrill ? "⬡" : accuracy >= 80 ? "✦" : accuracy >= 50 ? "◈" : "◉"}
      </div>
      <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
        {isDrill ? "All Cards Mastered" : "Session Complete"}
      </h2>

      <div
        className="rounded-2xl p-6 grid grid-cols-3 gap-4"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>{total}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{isDrill ? "Mastered" : "Cards"}</div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>{isDrill ? totalAttempts : stats.correct}</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{isDrill ? "Attempts" : "Correct"}</div>
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

      {learnedWords.length > 0 && (
        <div className="text-left space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
              {isDrill ? "Session Vocabulary" : "Words Learned"} · {learnedWords.length}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {learnedWords.map((word) => (
              <div
                key={word.id}
                className="rounded-xl p-3 flex flex-col"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span
                    className="text-2xl font-bold leading-none"
                    style={{ color: "var(--accent-crane-white)", fontFamily: "Noto Serif SC, serif" }}
                  >
                    {word.chinese}
                  </span>
                  <span
                    className="text-xs shrink-0 mt-0.5"
                    style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", opacity: 0.7 }}
                  >
                    {word.level}
                  </span>
                </div>
                <span
                  className="text-xs mb-1 font-pinyin"
                  style={{ color: "var(--text-muted)", fontStyle: "italic" }}
                >
                  {word.pinyin}
                </span>
                <span
                  className="text-xs leading-snug"
                  style={{ color: "var(--text-primary)", opacity: 0.85, fontFamily: "Lora, serif" }}
                >
                  {word.english}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
