"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  loadProgress, saveProgress, saveSessionWithSync,
  updateCardProgress, getDueCards, todayISO,
} from "@/lib/progress";
import { getLesson, getAllWords, getLessonSummaries } from "@/lib/content";
import { cardId } from "@/lib/types";
import type { HSKLevel, Word, CardProgress } from "@/lib/types";

type WordCard = Word & { lessonNumber: number; level: HSKLevel };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseScope(scope: string | null): {
  level: HSKLevel | "all";
  lessonNumber: number | null;
  label: string;
} {
  if (!scope || scope === "all") return { level: "all", lessonNumber: null, label: "All HSK" };
  const lessonMatch = scope.match(/^hsk(\d)-lesson-(\d+)$/);
  if (lessonMatch) {
    const lvl = Number(lessonMatch[1]) as HSKLevel;
    const num = Number(lessonMatch[2]);
    return { level: lvl, lessonNumber: num, label: `HSK ${lvl} · Lesson ${num}` };
  }
  const levelMatch = scope.match(/^hsk(\d)$/);
  if (levelMatch) {
    const lvl = Number(levelMatch[1]) as HSKLevel;
    return { level: lvl, lessonNumber: null, label: `HSK ${lvl}` };
  }
  return { level: "all", lessonNumber: null, label: "All HSK" };
}

function buildCardPool(level: HSKLevel | "all", lessonNumber: number | null): WordCard[] {
  const levels: HSKLevel[] = level === "all" ? [1, 2, 3, 4] : [level];
  const out: WordCard[] = [];
  for (const lvl of levels) {
    if (lessonNumber !== null && level !== "all") {
      const lesson = getLesson(lvl, lessonNumber);
      if (!lesson || lesson.stub) continue;
      for (const t of lesson.texts ?? []) {
        for (const w of t.newWords) out.push({ ...w, lessonNumber, level: lvl });
      }
    } else {
      for (const w of getAllWords(lvl)) {
        out.push({ ...w, level: lvl });
      }
    }
  }
  return out;
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={null}>
      <FlashcardsInner />
    </Suspense>
  );
}

function FlashcardsInner() {
  const sp = useSearchParams();
  const scopeParam = sp.get("scope");
  const scope = parseScope(scopeParam);

  const [showSetup, setShowSetup] = useState(true);
  const [pool, setPool] = useState<WordCard[]>([]);
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [queue, setQueue] = useState<WordCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [finished, setFinished] = useState(false);
  const [mode, setMode] = useState<"due" | "all">("due");
  const [size, setSize] = useState<10 | 20 | 50>(20);

  useEffect(() => {
    setPool(buildCardPool(scope.level, scope.lessonNumber));
    setProgress(loadProgress());
  }, [scope.level, scope.lessonNumber]);

  const startSession = useCallback(() => {
    const ids = pool.map((w) => cardId("word", w.id));
    const selectIds = mode === "due" ? getDueCards(ids, progress) : ids;
    const finalIds = selectIds.length > 0 ? selectIds : ids;
    const idToWord = new Map(pool.map((w) => [cardId("word", w.id), w]));
    const cards = shuffle(finalIds).slice(0, size).map((id) => idToWord.get(id)!).filter(Boolean);
    setQueue(cards);
    setIndex(0);
    setFlipped(false);
    setShowPinyin(false);
    setStats({ correct: 0, incorrect: 0 });
    setFinished(false);
    setShowSetup(false);
  }, [pool, progress, mode, size]);

  const current = queue[index];

  function rate(quality: 0 | 3) {
    if (!current || transitioning) return;
    const id = cardId("word", current.id);
    const next = { ...progress };
    next[id] = updateCardProgress(progress[id], id, "word", quality);
    saveProgress(next);
    setProgress(next);

    const newStats = {
      correct: stats.correct + (quality === 3 ? 1 : 0),
      incorrect: stats.incorrect + (quality === 0 ? 1 : 0),
    };
    setStats(newStats);
    setTransitioning(true);
    setFlipped(false);
    setShowPinyin(false);

    const isLast = index + 1 >= queue.length;
    setTimeout(() => {
      if (isLast) {
        saveSessionWithSync({
          date: todayISO(),
          cardsStudied: queue.length,
          correct: newStats.correct,
          incorrect: newStats.incorrect,
          scope: scopeParam ?? "all",
          cardType: "word",
          cardIds: queue.map((w) => cardId("word", w.id)),
        });
        setFinished(true);
      } else {
        setIndex((i) => i + 1);
      }
      setTransitioning(false);
    }, 350);
  }

  if (pool.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center pt-8 space-y-4">
        <h1 className="text-xl" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>
          Nothing to study yet
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          {scope.lessonNumber !== null
            ? "This lesson has no authored vocabulary yet."
            : "No vocabulary has been authored in this scope yet."}
        </p>
        <Link
          href="/course"
          className="inline-block px-4 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}
        >
          Back to Course
        </Link>
      </div>
    );
  }

  if (showSetup) {
    return (
      <Setup
        scope={scope}
        pool={pool}
        progress={progress}
        mode={mode}
        setMode={setMode}
        size={size}
        setSize={setSize}
        onStart={startSession}
      />
    );
  }

  if (finished) {
    return <Finished stats={stats} total={queue.length} onAgain={() => setShowSetup(true)} learnedWords={queue} />;
  }

  if (!current) return null;

  const acc = stats.correct + stats.incorrect > 0
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
    : 0;
  const sizeClass = current.hanzi.length <= 2 ? "chinese-xl" : current.hanzi.length <= 4 ? "chinese-lg" : "chinese-md";

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-ink">
          <div className="progress-ink-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "Cinzel, serif" }}>
        <span style={{ color: "var(--accent-gold)" }}>✓ {stats.correct}</span>
        <span style={{ color: "var(--accent-rose)" }}>✗ {stats.incorrect}</span>
        {stats.correct + stats.incorrect > 0 && (
          <span style={{ color: "var(--text-muted)" }}>{acc}%</span>
        )}
      </div>

      <div className="card-flip" style={{ height: "400px" }} onClick={() => setFlipped((f) => !f)}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div
            className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="badge-gold mb-5">
              HSK {current.level} · L{current.lessonNumber} · {current.pos}
            </div>
            <div className="moon-circle">
              <div className={`${sizeClass} text-center leading-none font-bold`} style={{ color: "var(--accent-crane-white)", zIndex: 1 }}>
                {current.hanzi}
              </div>
              {showPinyin && (
                <div
                  className="mt-2 text-xl tracking-widest font-pinyin text-center"
                  style={{ color: "rgba(240,237,228,0.85)", zIndex: 1, lineHeight: 1.3 }}
                >
                  {current.pinyin}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              {!showPinyin && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowPinyin(true); }}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ color: "rgba(201,168,76,0.7)", border: "1px solid rgba(201,168,76,0.3)", fontFamily: "Cinzel, serif", letterSpacing: "0.06em" }}
                >
                  show pinyin
                </button>
              )}
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>tap to reveal meaning</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="card-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}
          >
            <div className="badge-gold mb-3" style={{ background: "rgba(201,168,76,0.15)" }}>
              HSK {current.level} · L{current.lessonNumber}
            </div>
            <div className="chinese-md font-bold mb-1 text-center" style={{ color: "var(--text-parchment)", fontFamily: "Noto Serif SC, serif" }}>
              {current.hanzi}
            </div>
            {current.traditional && current.traditional !== current.hanzi && (
              <div className="text-sm mb-1" style={{ color: "#7A6855" }}>繁 {current.traditional}</div>
            )}
            <div className="text-xl mb-3 font-pinyin" style={{ color: "#5A3F20", fontStyle: "italic" }}>
              {current.pinyin}
            </div>
            <div className="text-lg text-center leading-relaxed font-body" style={{ color: "var(--text-parchment)" }}>
              {current.english}
            </div>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => rate(0)}
            className="py-4 rounded-xl text-base font-semibold"
            style={{
              background: "rgba(196,133,122,0.08)",
              border: "1.5px solid rgba(196,133,122,0.5)",
              color: "var(--accent-rose)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
            }}
          >
            ✗ Hard
          </button>
          <button
            onClick={() => rate(3)}
            className="py-4 rounded-xl text-base font-semibold"
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
            }}
          >
            ✓ Easy
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full py-4 rounded-xl text-sm font-semibold"
          style={{
            background: "transparent",
            border: "1.5px solid var(--accent-gold)",
            color: "var(--accent-gold)",
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.08em",
          }}
        >
          Reveal Meaning
        </button>
      )}

      <button
        onClick={() => setShowSetup(true)}
        className="w-full text-xs py-1"
        style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
      >
        ← Back to setup
      </button>
    </div>
  );
}

// ─── Setup ───────────────────────────────────────────────────────────────────

function Setup({
  scope, pool, progress, mode, setMode, size, setSize, onStart,
}: {
  scope: { level: HSKLevel | "all"; lessonNumber: number | null; label: string };
  pool: WordCard[];
  progress: Record<string, CardProgress>;
  mode: "due" | "all";
  setMode: (m: "due" | "all") => void;
  size: 10 | 20 | 50;
  setSize: (n: 10 | 20 | 50) => void;
  onStart: () => void;
}) {
  const ids = pool.map((w) => cardId("word", w.id));
  const due = getDueCards(ids, progress).length;
  const summaries = scope.level !== "all" ? getLessonSummaries(scope.level) : [];

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", letterSpacing: "0.08em" }}>
          Flashcards
        </h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
          {scope.label} · {pool.length} word{pool.length === 1 ? "" : "s"}
        </p>
      </div>

      <div
        className="rounded-2xl p-5 space-y-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Quick scope nav (when at the all-HSK level) */}
        {scope.level === "all" && (
          <div>
            <label className="text-xs block mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
              Scope
            </label>
            <div className="flex gap-2 flex-wrap">
              {([1, 2, 3, 4] as HSKLevel[]).map((lvl) => (
                <Link
                  key={lvl}
                  href={`/practice/flashcards?scope=hsk${lvl}`}
                  className="px-3 py-1.5 rounded-lg text-xs"
                  style={{ background: "rgba(201,168,76,0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
                >
                  HSK {lvl}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Lesson picker (when scoped to a level) */}
        {scope.level !== "all" && summaries.length > 0 && (
          <div>
            <label className="text-xs block mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
              By Lesson
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {summaries.filter((s) => !s.stub).map((s) => {
                const active = scope.lessonNumber === s.number;
                return (
                  <Link
                    key={s.number}
                    href={`/practice/flashcards?scope=hsk${scope.level}-lesson-${s.number}`}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{
                      background: active ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                      color: active ? "var(--bg-primary)" : "var(--text-muted)",
                      border: active ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                      fontFamily: "Cinzel, serif",
                    }}
                  >
                    {s.number}
                  </Link>
                );
              })}
              <Link
                href={`/practice/flashcards?scope=hsk${scope.level}`}
                className="px-3 h-9 rounded-md flex items-center text-xs"
                style={{
                  background: scope.lessonNumber === null ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: scope.lessonNumber === null ? "var(--bg-primary)" : "var(--text-muted)",
                  border: scope.lessonNumber === null ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                  fontFamily: "Cinzel, serif",
                }}
              >
                All
              </Link>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs block mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { v: "due", l: "Due", s: `${due} ready` },
              { v: "all", l: "All", s: "Random" },
            ] as const).map(({ v, l, s }) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className="py-3 rounded-lg text-xs"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: mode === v ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: mode === v ? "var(--bg-primary)" : "var(--text-muted)",
                  border: mode === v ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {l}
                <div className="text-xs opacity-70 mt-0.5">{s}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs block mb-2 tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Session Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([10, 20, 50] as const).map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                className="py-2 rounded-lg text-xs"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: size === n ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                  color: size === n ? "var(--bg-primary)" : "var(--text-muted)",
                  border: size === n ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                }}
              >
                {n} cards
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 rounded-xl text-sm font-semibold"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cinzel, serif",
          letterSpacing: "0.1em",
        }}
      >
        Begin Practice
      </button>
    </div>
  );
}

// ─── Finished ────────────────────────────────────────────────────────────────

function Finished({
  stats, total, onAgain, learnedWords,
}: {
  stats: { correct: number; incorrect: number };
  total: number;
  onAgain: () => void;
  learnedWords: WordCard[];
}) {
  const totalAttempts = stats.correct + stats.incorrect;
  const acc = totalAttempts > 0 ? Math.round((stats.correct / totalAttempts) * 100) : 0;
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 animate-fade-up">
      <div className="text-5xl py-4" style={{ color: acc >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}>
        {acc >= 80 ? "✦" : acc >= 50 ? "◈" : "◉"}
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
          <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>{acc}%</div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Accuracy</div>
        </div>
      </div>

      <button
        onClick={onAgain}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cinzel, serif",
          letterSpacing: "0.08em",
        }}
      >
        New Session
      </button>

      {learnedWords.length > 0 && (
        <div className="text-left pt-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
              Reviewed · {learnedWords.length}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {learnedWords.map((w) => (
              <div
                key={w.id}
                className="rounded-xl p-3"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-2xl font-bold leading-none" style={{ color: "var(--accent-crane-white)", fontFamily: "Noto Serif SC, serif" }}>
                    {w.hanzi}
                  </span>
                  <span className="text-xs shrink-0" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>
                    {w.level}
                  </span>
                </div>
                <span className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  {w.pinyin}
                </span>
                <div className="text-xs leading-snug mt-1" style={{ color: "var(--text-primary)", opacity: 0.85, fontFamily: "Lora, serif" }}>
                  {w.english}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
