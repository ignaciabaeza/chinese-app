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
import { BlossomBranch } from "@/components/Decor";

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
      (w) => (level === "all" || w.level === level) && (category === "all" || w.category === category)
    );
    const ids = filtered.map((w) => w.id);
    let selectedIds: string[];
    if (mode === "due") {
      selectedIds = getDueCards(ids, p);
      if (selectedIds.length === 0) selectedIds = ids;
    } else {
      selectedIds = ids;
    }
    const words = shuffle(selectedIds).slice(0, size).map((id) => filtered.find((w) => w.id === id)!).filter(Boolean);
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
    if (quality === 3) setLearnedIds((prev) => new Set(prev).add(currentWord.id));
    setTransitioning(true);
    setFlipped(false);
    setShowPinyin(false);
    if (mode === "drill" && quality === 0) {
      setTimeout(() => { setQueue((q) => [...q, currentWord]); setCurrentIndex((i) => i + 1); setTransitioning(false); }, 400);
    } else {
      const newMastered = mode === "drill" ? masteredCount + 1 : masteredCount;
      if (mode === "drill") setMasteredCount(newMastered);
      const isDone = mode === "drill" ? newMastered >= drillTotal : currentIndex + 1 >= queue.length;
      setTimeout(() => {
        if (isDone) {
          saveSessionWithSync({ date: new Date().toDateString(), cardsStudied: mode === "drill" ? drillTotal : queue.length, correct: newStats.correct, incorrect: newStats.incorrect, level, wordIds: sessionWordIds });
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
    return <FinishedScreen stats={sessionStats} total={mode === "drill" ? drillTotal : queue.length} isDrill={mode === "drill"} learnedWords={learnedWords} onRestart={() => setShowSetup(true)} onReview={loadQueue} />;
  }
  if (!currentWord) return null;

  const cardProgress = progress[currentWord.id];
  const chineseFontSize = currentWord.chinese.length <= 2 ? 70 : currentWord.chinese.length <= 4 ? 50 : 36;
  const accuracy = sessionStats.correct + sessionStats.incorrect > 0
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
        <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-medium)" }}>
          {mode === "drill" ? `${masteredCount} / ${drillTotal} mastered` : `${currentIndex + 1} / ${queue.length}`}
        </span>
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "'Cormorant SC', serif", letterSpacing: "0.05em" }}>
        <span style={{ color: "var(--blush-pink)" }}>✓ {sessionStats.correct}</span>
        <span style={{ color: "var(--blush-deep)" }}>✗ {sessionStats.incorrect}</span>
        {sessionStats.correct + sessionStats.incorrect > 0 && (
          <span style={{ color: "var(--ink-faint)" }}>{accuracy}%</span>
        )}
      </div>

      {/* Card */}
      <div className="card-flip" style={{ height: 420 }} onClick={() => !transitioning && setFlipped((f) => !f)}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>

          {/* Front */}
          <div
            className="card-front absolute inset-0 flex flex-col overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2, padding: 24 }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", border: "1px solid rgba(176,144,80,0.5)", padding: "2px 6px", textTransform: "uppercase" }}>
                  HSK {currentWord.level}
                </span>
                <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
                  · {currentWord.category}
                </span>
              </div>
              {/* Audio button */}
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "transparent",
                  border: "1px solid rgba(44,36,22,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", padding: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 20 20">
                  <path d="M8 4L4 7H2v6h2l4 3V4z" fill="var(--ink-dark)" />
                  <path d="M12 7c1 1 1 5 0 6" stroke="var(--ink-dark)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                </svg>
              </button>
            </div>

            {/* Moon circle with blossom decor */}
            <div className="flex-1 flex items-center justify-center relative">
              <div className="absolute top-0 right-0 opacity-40 pointer-events-none">
                <BlossomBranch width={120} height={80} variant="tr" />
              </div>
              <div
                style={{
                  width: 200, height: 200, borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 30%, var(--blush-light), var(--blush-pink))",
                  display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                  boxShadow: "inset 0 0 30px rgba(184,104,112,0.25), 0 4px 16px rgba(212,136,138,0.15)",
                  zIndex: 1, position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontWeight: 500,
                    fontSize: chineseFontSize,
                    color: "#F2EDE4",
                    lineHeight: 1,
                    textAlign: "center",
                    textShadow: "0 2px 8px rgba(44,36,22,0.15)",
                  }}
                >
                  {currentWord.chinese}
                </div>
                {showPinyin && (
                  <div
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 14, color: "#F2EDE4", marginTop: 8, opacity: 0.9 }}
                  >
                    {currentWord.pinyin}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => { e.stopPropagation(); setShowPinyin((v) => !v); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em",
                  color: "var(--ink-medium)", textTransform: "uppercase",
                }}
              >
                {showPinyin ? "hide" : "show"} pinyin
              </button>
              <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "var(--ink-faint)" }}>
                tap to reveal
              </div>
            </div>
          </div>

          {/* Back */}
          <div
            className="card-back absolute inset-0 flex flex-col overflow-hidden"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2, padding: 22, gap: 10 }}
          >
            <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", border: "1px solid rgba(176,144,80,0.5)", padding: "2px 6px", textTransform: "uppercase", alignSelf: "flex-start" }}>
              HSK {currentWord.level}
            </span>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 40, fontWeight: 500, color: "var(--ink-dark)", lineHeight: 1 }}>
              {currentWord.chinese}
            </div>
            {currentWord.traditional && currentWord.traditional !== currentWord.chinese && (
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 12, color: "var(--ink-faint)" }}>繁 {currentWord.traditional}</div>
            )}
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 18, color: "#5A3F20" }}>
              {currentWord.pinyin}
            </div>
            <div style={{ fontFamily: "Lora, serif", fontSize: 16, color: "var(--ink-dark)" }}>
              {currentWord.english}
            </div>

            <div style={{ height: 1, background: "var(--border-ink)", margin: "4px 0" }} />

            {/* Example sentence with left border */}
            {(currentWord as any).example ? (
              <div style={{ background: "rgba(212,136,138,0.06)", padding: "10px 12px", borderLeft: "2px solid var(--blush-pink)", borderRadius: "0 2px 2px 0" }}>
                <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-medium)", textTransform: "uppercase", marginBottom: 4 }}>Example · 例</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: "var(--ink-dark)", lineHeight: 1.4 }}>{(currentWord as any).example.chinese}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "var(--blush-deep)", marginTop: 3 }}>{(currentWord as any).example.pinyin}</div>
                <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 12, color: "var(--ink-medium)", marginTop: 3 }}>{(currentWord as any).example.english}</div>
              </div>
            ) : null}

            {cardProgress && (
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-faint)", textTransform: "uppercase", marginTop: "auto" }}>
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
            style={{
              padding: "14px", border: "1px solid var(--blush-pink)",
              background: "transparent", color: "var(--blush-deep)",
              fontFamily: "'Cormorant SC', serif", fontSize: 12, letterSpacing: 2,
              textTransform: "uppercase", cursor: "pointer", borderRadius: 2, fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(212,136,138,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            ✗ Hard
          </button>
          <button
            onClick={() => handleRate(3)}
            style={{
              padding: "14px", border: "1px solid var(--blush-pink)",
              background: "var(--blush-pink)", color: "var(--bg-primary)",
              fontFamily: "'Cormorant SC', serif", fontSize: 12, letterSpacing: 2,
              textTransform: "uppercase", cursor: "pointer", borderRadius: 2, fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blush-deep)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--blush-pink)")}
          >
            ✓ Easy
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full py-4 text-sm transition-all btn-primary"
          style={{ letterSpacing: "0.15em", textAlign: "center" }}
        >
          Reveal Meaning
        </button>
      )}

      <button
        onClick={() => setShowSetup(true)}
        className="w-full text-xs py-1 transition-colors"
        style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "Lora, serif", fontStyle: "italic", color: "var(--ink-faint)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-medium)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-faint)")}
      >
        ← back to setup
      </button>
    </div>
  );
}

function SetupScreen({ level, setLevel, category, setCategory, mode, setMode, size, setSize, onStart }: {
  level: LevelFilter; setLevel: (l: LevelFilter) => void;
  category: CategoryFilter; setCategory: (c: CategoryFilter) => void;
  mode: "due" | "all" | "drill"; setMode: (m: "due" | "all" | "drill") => void;
  size: 10 | 20; setSize: (s: 10 | 20) => void;
  onStart: () => void;
}) {
  const p = loadProgress();
  const levelOptions: [LevelFilter, string][] = [["all", "All"], [1, "HSK 1"], [2, "HSK 2"], [3, "HSK 3"], [4, "HSK 4"], [5, "HSK 5"], [6, "HSK 6"]];
  const dueCount = vocabulary.filter((w) => (level === "all" || w.level === level) && (category === "all" || w.category === category)).map((w) => w.id);

  return (
    <div className="max-w-sm mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 right-0 opacity-50 pointer-events-none">
          <BlossomBranch width={130} height={90} variant="tr" />
        </div>
        <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 18, color: "var(--ink-dark)", letterSpacing: 1, fontWeight: 500 }}>卡片</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 22, color: "var(--ink-dark)", fontWeight: 500, marginTop: 4 }}>Begin Practice</div>
        <div style={{ fontFamily: "Lora, serif", fontSize: 13, color: "var(--ink-medium)", fontStyle: "italic", marginTop: 2 }}>Configure your study session below.</div>
      </div>

      <div className="space-y-5" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2, padding: 20 }}>
        {/* Level */}
        <div>
          <label style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Level</label>
          <div className="grid grid-cols-4 gap-1.5">
            {levelOptions.map(([val, label]) => (
              <FilterBtn key={String(val)} active={level === val} onClick={() => setLevel(val)}>{label}</FilterBtn>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
          <div className="flex flex-wrap gap-1.5">
            <FilterBtn active={category === "all"} onClick={() => setCategory("all")}>All</FilterBtn>
            {CATEGORIES.map((cat) => (
              <FilterBtn key={cat} active={category === cat} onClick={() => setCategory(cat)} small>{cat}</FilterBtn>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <label style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Mode</label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { val: "due" as const, label: "Due Cards", badge: getDueCards(dueCount, p).length },
              { val: "all" as const, label: "All Cards", badge: undefined },
              { val: "drill" as const, label: "Drill", badge: undefined },
            ]).map(({ val, label, badge }) => (
              <button
                key={val}
                onClick={() => setMode(val)}
                className="py-2.5 text-xs transition-all relative"
                style={{
                  fontFamily: "'Cormorant SC', serif", letterSpacing: "0.1em",
                  background: mode === val ? "var(--blush-pink)" : "transparent",
                  color: mode === val ? "var(--bg-primary)" : "var(--ink-dark)",
                  border: mode === val ? "1px solid var(--blush-pink)" : "1px solid var(--border-ink)",
                  borderRadius: 2, fontWeight: 500, cursor: "pointer", textTransform: "uppercase",
                }}
              >
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{
                    position: "absolute", top: -6, right: -6,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "var(--blush-deep)", color: "var(--bg-primary)",
                    fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Session Size</label>
          <div className="grid grid-cols-2 gap-1.5">
            {([10, 20] as const).map((s) => (
              <FilterBtn key={s} active={size === s} onClick={() => setSize(s)}>{s} cards</FilterBtn>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-3 transition-all btn-primary"
        style={{ letterSpacing: "0.15em", textAlign: "center", color: "var(--blush-deep)", borderBottomColor: "var(--blush-deep)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-dark)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--blush-deep)")}
      >
        Begin Practice
      </button>
    </div>
  );
}

function FilterBtn({ active, onClick, children, small = false }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "5px 10px" : "6px 10px",
        border: `1px solid ${active ? "var(--blush-pink)" : "var(--border-ink)"}`,
        background: active ? "var(--blush-pink)" : "transparent",
        color: active ? "var(--bg-primary)" : "var(--ink-dark)",
        fontFamily: "'Cormorant SC', serif",
        fontSize: 10, letterSpacing: "0.1em",
        textTransform: "uppercase", cursor: "pointer",
        borderRadius: 2, fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

function FinishedScreen({ stats, total, isDrill, learnedWords, onRestart, onReview }: {
  stats: { correct: number; incorrect: number };
  total: number; isDrill?: boolean; learnedWords: Word[];
  onRestart: () => void; onReview: () => void;
}) {
  const totalAttempts = stats.correct + stats.incorrect;
  const accuracy = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0;
  const heroChar = isDrill ? "完" : accuracy >= 80 ? "好" : accuracy >= 50 ? "学" : "练";
  const heroLabel = isDrill ? "All Cards Mastered" : accuracy >= 80 ? "Excellent work" : accuracy >= 50 ? "Keep going" : "Practice makes perfect";

  return (
    <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-up">
      {/* Blossom decor */}
      <div className="relative pt-8">
        <div className="absolute top-4 left-0 opacity-40 pointer-events-none">
          <BlossomBranch width={120} height={80} variant="tl" />
        </div>
        <div className="absolute top-4 right-0 opacity-40 pointer-events-none">
          <BlossomBranch width={120} height={80} variant="tr" />
        </div>
        <div style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, fontSize: 80, color: "var(--blush-deep)", lineHeight: 1 }}>{heroChar}</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 20, color: "var(--ink-dark)", marginTop: 10 }}>{heroLabel}</div>
        <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--ink-medium)", marginTop: 4, fontStyle: "italic" }}>Session complete · 完成</div>
      </div>

      {/* Stats panel */}
      <div className="p-6" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2 }}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { v: total, l: isDrill ? "Mastered" : "Cards" },
            { v: isDrill ? totalAttempts : stats.correct, l: isDrill ? "Attempts" : "Correct", c: "var(--antique-gold)" },
            { v: `${accuracy}%`, l: "Accuracy", c: "var(--blush-deep)" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 500, color: s.c || "var(--ink-dark)", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-medium)", textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onReview}
          style={{ padding: "10px 20px", border: "1px solid var(--border-ink)", background: "transparent", color: "var(--ink-medium)", fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blush-pink)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-ink)")}
        >
          Practice Again
        </button>
        <button
          onClick={onRestart}
          className="btn-primary"
          style={{ padding: "10px 20px", letterSpacing: "0.1em" }}
        >
          New Session
        </button>
      </div>

      {learnedWords.length > 0 && (
        <div className="text-left space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-ink)" }} />
            <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase" }}>
              {isDrill ? "Session Vocabulary" : "Words Learned"} · {learnedWords.length}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-ink)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {learnedWords.map((word) => (
              <div key={word.id} className="p-3 flex flex-col" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2 }}>
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "var(--ink-dark)", fontWeight: 500 }}>{word.chinese}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "var(--blush-deep)", marginTop: 2 }}>{word.pinyin}</span>
                <span style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-medium)", marginTop: 2 }}>{word.english}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
