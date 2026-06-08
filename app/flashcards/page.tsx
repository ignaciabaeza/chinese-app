"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AudioButton from "@/components/AudioButton";

type Level = "all" | 1 | 2;
type Size = 10 | 20 | "all";
type Mode = "drill" | "browse";

interface Sentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  audio_path: string | null;
}

interface Flashcard {
  word_id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  audio_path: string | null;
  example: Sentence | null;
}

export default function FlashcardsPage() {
  return (
    <Suspense fallback={null}>
      <FlashcardsInner />
    </Suspense>
  );
}

interface LessonScope {
  param: string;        // raw param e.g. "hsk1-3"
  title: string | null; // resolved after first fetch
}

function FlashcardsInner() {
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get("lesson");
  const lessonScope: LessonScope | null = lessonParam ? { param: lessonParam, title: null } : null;

  const [phase, setPhase] = useState<"setup" | "card" | "finished">("setup");
  const [level, setLevel] = useState<Level>("all");
  const [size, setSize] = useState<Size>(10);
  const [mode, setMode] = useState<Mode>("drill");
  const [showPinyinFront, setShowPinyinFront] = useState(false);
  const [showEnglishBack, setShowEnglishBack] = useState(true);

  const [deck, setDeck] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ passed: 0, skipped: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState<string | null>(null);

  const loadDeck = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = lessonScope ? `lesson=${encodeURIComponent(lessonScope.param)}` : `level=${level}&size=${size}`;
      const res = await fetch(`/api/flashcards/deck?${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Deck fetch failed: ${res.status}`);
        return;
      }
      const data = await res.json();
      if (!data.deck || data.deck.length === 0) {
        setError(lessonScope
          ? "This lesson has no vocab linked yet — try a different lesson."
          : "No cards matched. Try a different level or larger size.");
        return;
      }
      setDeck(data.deck);
      if (data.scope === "lesson" && data.lesson) {
        setLessonTitle(`HSK ${data.lesson.book.replace("hsk","")} · 第${data.lesson.number}课 ${data.lesson.title_hanzi}`);
      }
      setIndex(0);
      setFlipped(false);
      setStats({ passed: 0, skipped: 0 });
      setPhase("card");
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }, [level, size, lessonScope]);

  function next(record: "passed" | "skipped" | null = null) {
    if (record === "passed") setStats((s) => ({ ...s, passed: s.passed + 1 }));
    else if (record === "skipped") setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    if (index + 1 >= deck.length) { setPhase("finished"); return; }
    setIndex((i) => i + 1);
    setFlipped(false);
  }

  function prev() {
    if (index === 0) return;
    setIndex((i) => i - 1);
    setFlipped(false);
  }

  // Keyboard shortcuts.
  useEffect(() => {
    if (phase !== "card") return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") { e.preventDefault(); setFlipped((f) => !f); return; }
      if (mode === "drill") {
        if (e.key === "1") next("skipped");
        if (e.key === "2") next("passed");
      } else {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft")  prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mode, index, deck.length]);

  if (phase === "setup") {
    return (
      <Setup
        level={level} onLevelChange={setLevel}
        size={size} onSizeChange={setSize}
        mode={mode} onModeChange={setMode}
        lessonScope={lessonScope}
        loading={loading}
        error={error}
        onStart={loadDeck}
      />
    );
  }

  if (phase === "finished") {
    return (
      <Finished
        total={deck.length}
        passed={stats.passed}
        skipped={stats.skipped}
        mode={mode}
        onAgain={() => loadDeck()}
        onChangeDeck={() => setPhase("setup")}
      />
    );
  }

  // phase === "card"
  const card = deck[index];
  if (!card) return null;
  return (
    <CardView
      card={card}
      index={index}
      total={deck.length}
      mode={mode}
      flipped={flipped}
      onFlip={() => setFlipped((f) => !f)}
      showPinyinFront={showPinyinFront}
      onTogglePinyinFront={() => setShowPinyinFront((v) => !v)}
      showEnglishBack={showEnglishBack}
      onToggleEnglishBack={() => setShowEnglishBack((v) => !v)}
      onPrev={prev}
      onNext={(record) => next(record)}
      onQuit={() => setPhase("setup")}
      stats={stats}
      lessonTitle={lessonTitle}
    />
  );
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function Setup({
  level, onLevelChange, size, onSizeChange, mode, onModeChange, lessonScope, loading, error, onStart,
}: {
  level: Level; onLevelChange: (l: Level) => void;
  size: Size; onSizeChange: (s: Size) => void;
  mode: Mode; onModeChange: (m: Mode) => void;
  lessonScope: LessonScope | null;
  loading: boolean; error: string | null;
  onStart: () => void;
}) {
  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Flashcards
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {lessonScope
            ? "Practising the vocab from this lesson — shuffled, no SRS."
            : "One-shot deck — shuffled, no SRS. Pick a level, a size, and a mode."}
        </p>
      </div>

      {lessonScope ? (
        <div className="rounded-xl p-3 flex items-center justify-between"
             style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.4)" }}>
          <div>
            <div className="text-xs uppercase tracking-widest" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
              Lesson scope
            </div>
            <div className="text-sm" style={{ color: "var(--ink)", fontFamily: "Spectral, serif" }}>
              {lessonScope.param.toUpperCase()}
            </div>
          </div>
          <Link href="/flashcards" className="text-xs"
                style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            Use general deck instead →
          </Link>
        </div>
      ) : (
        <>
          <Picker label="HSK level"
            items={[{ k: "all", l: "All" }, { k: 1, l: "HSK 1" }, { k: 2, l: "HSK 2" }]}
            value={level} onChange={(v) => onLevelChange(v as Level)} />

          <Picker label="Deck size"
            items={[{ k: 10, l: "10" }, { k: 20, l: "20" }, { k: "all", l: "All" }]}
            value={size} onChange={(v) => onSizeChange(v as Size)} />
        </>
      )}

      <Picker label="Mode"
        items={[
          { k: "drill",  l: "Drill",  hint: "Pass / Skip to track yourself" },
          { k: "browse", l: "Browse", hint: "Prev / Next, no scoring" },
        ]}
        value={mode} onChange={(v) => onModeChange(v as Mode)} />

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      <button
        onClick={onStart}
        disabled={loading}
        className="w-full py-4 rounded-xl text-sm font-semibold"
        style={{
          background: "var(--accent-gold)", color: "var(--accent-crane-white)",
          border: "1.5px solid var(--accent-gold)",
          fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.1em",
        }}
      >
        {loading ? "Shuffling…" : "Start"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
        For spaced repetition use <Link href="/review" style={{ color: "var(--accent-gold)" }}>Review →</Link>
      </p>
    </div>
  );
}

function Picker<T extends string | number>({
  label, items, value, onChange,
}: {
  label: string;
  items: { k: T; l: string; hint?: string }[];
  value: T;
  onChange: (k: T) => void;
}) {
  const hint = items.find((i) => i.k === value)?.hint;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {label}
        </span>
        {hint && <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{hint}</span>}
      </div>
      <div className={`grid gap-1 p-1 rounded-xl`} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
        {items.map(({ k, l }) => {
          const active = k === value;
          return (
            <button
              key={String(k)}
              onClick={() => onChange(k)}
              className="py-2 rounded-lg text-xs"
              style={{
                background: active ? "var(--accent-gold)" : "transparent",
                color: active ? "var(--accent-crane-white)" : "var(--text-muted)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card view ───────────────────────────────────────────────────────────────

function CardView({
  card, index, total, mode, flipped, onFlip,
  showPinyinFront, onTogglePinyinFront, showEnglishBack, onToggleEnglishBack,
  onPrev, onNext, onQuit, stats, lessonTitle,
}: {
  card: Flashcard;
  index: number;
  total: number;
  mode: Mode;
  flipped: boolean;
  onFlip: () => void;
  showPinyinFront: boolean;
  onTogglePinyinFront: () => void;
  showEnglishBack: boolean;
  onToggleEnglishBack: () => void;
  onPrev: () => void;
  onNext: (record?: "passed" | "skipped" | null) => void;
  onQuit: () => void;
  stats: { passed: number; skipped: number };
  lessonTitle: string | null;
}) {
  const sizeClass = card.simplified.length <= 2 ? "chinese-xl" : card.simplified.length <= 4 ? "chinese-lg" : "chinese-md";

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-up">
      {lessonTitle && (
        <p className="text-xs text-center" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
          {lessonTitle}
        </p>
      )}

      {/* Progress + quit */}
      <div className="flex items-center gap-3">
        <button
          onClick={onQuit}
          className="text-xs"
          style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}
        >
          ← Setup
        </button>
        <div className="flex-1 progress-ink">
          <div className="progress-ink-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {index + 1} / {total}
        </span>
      </div>

      {mode === "drill" && (
        <div className="flex justify-center gap-5 text-xs" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          <span style={{ color: "var(--accent-gold)" }}>✓ {stats.passed}</span>
          <span style={{ color: "var(--accent-rose)" }}>↺ {stats.skipped}</span>
        </div>
      )}

      {/* Card flip surface */}
      <div className="card-flip" style={{ height: "440px" }} onClick={onFlip}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div
            className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            {card.hsk2_level != null && (
              <div className="badge-gold mb-4">HSK {card.hsk2_level}</div>
            )}
            <div className="moon-circle">
              <div className={`${sizeClass} text-center leading-none font-bold`} style={{ color: "var(--accent-crane-white)", zIndex: 1 }}>
                {card.simplified}
              </div>
            </div>
            {showPinyinFront && (
              <div className="text-xl mt-4 font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                {card.pinyin}
              </div>
            )}
            {card.audio_path && (
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                <AudioButton src={card.audio_path} size="sm" label="Play word" />
              </div>
            )}
            <p className="text-xs mt-4" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
              tap or press space to flip
            </p>
          </div>

          {/* Back */}
          <div
            className="card-back absolute inset-0 rounded-2xl flex flex-col p-5 overflow-y-auto"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}
          >
            <div className="flex items-baseline gap-2 mb-2 flex-wrap">
              <span className="font-display text-2xl" style={{ color: "var(--text-parchment)" }}>{card.simplified}</span>
              <span className="font-pinyin text-base" style={{ color: "#7A6855", fontStyle: "italic" }}>{card.pinyin}</span>
              {card.audio_path && (
                <span onClick={(e) => e.stopPropagation()}>
                  <AudioButton src={card.audio_path} size="sm" label="Play word" />
                </span>
              )}
            </div>

            <ol className="space-y-0.5 text-sm mb-3" style={{ fontFamily: "Spectral, serif", color: "var(--text-parchment)" }}>
              {card.meanings.slice(0, 4).map((m, i) => (
                <li key={i}>
                  <span style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>{i + 1}.</span> {m}
                </li>
              ))}
            </ol>

            {card.example ? (
              <div
                className="rounded-lg p-3 space-y-1"
                style={{ background: "rgba(247, 242, 230, 0.6)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="text-[10px] uppercase tracking-widest" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
                  Example
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base" style={{ color: "var(--text-parchment)" }}>
                      {card.example.simplified}
                    </div>
                    {card.example.pinyin && (
                      <div className="text-xs font-pinyin" style={{ color: "#7A6855", fontStyle: "italic" }}>
                        {card.example.pinyin}
                      </div>
                    )}
                    {showEnglishBack && (
                      <div className="text-xs mt-0.5" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>
                        {card.example.english}
                      </div>
                    )}
                  </div>
                  {card.example.audio_path && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <AudioButton src={card.example.audio_path} size="sm" label="Play sentence" />
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>
                No example sentence in DB for this word.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showPinyinFront} onChange={onTogglePinyinFront} />
          Pinyin on front
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showEnglishBack} onChange={onToggleEnglishBack} />
          English on back
        </label>
      </div>

      {/* Action buttons */}
      {mode === "drill" ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNext("skipped")}
            className="py-3 rounded-xl text-sm"
            style={{ background: "transparent", border: "1.5px solid var(--accent-rose)", color: "var(--accent-rose)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
          >
            Skip · 1
          </button>
          <button
            onClick={() => onNext("passed")}
            className="py-3 rounded-xl text-sm"
            style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
          >
            Pass · 2
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPrev}
            disabled={index === 0}
            className="py-3 rounded-xl text-sm"
            style={{
              background: "transparent",
              border: "1.5px solid var(--border-subtle)",
              color: "var(--text-muted)",
              fontFamily: "Cormorant Garamond, serif",
              letterSpacing: "0.06em",
              opacity: index === 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => onNext(null)}
            className="py-3 rounded-xl text-sm"
            style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Finished ────────────────────────────────────────────────────────────────

function Finished({
  total, passed, skipped, mode, onAgain, onChangeDeck,
}: {
  total: number; passed: number; skipped: number; mode: Mode;
  onAgain: () => void; onChangeDeck: () => void;
}) {
  const acc = passed + skipped > 0 ? Math.round((passed / (passed + skipped)) * 100) : 0;
  return (
    <div className="max-w-md mx-auto text-center space-y-5 animate-fade-up">
      <div className="text-5xl py-3" style={{ color: "var(--accent-gold)" }}>✦</div>
      <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
        Deck Complete
      </h2>
      {mode === "drill" ? (
        <div className="rounded-2xl p-6 grid grid-cols-3 gap-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
          <Stat label="Total"   value={total}   color="var(--ink)" />
          <Stat label="Pass"    value={passed}  color="var(--accent-gold)" />
          <Stat label="Skip"    value={skipped} color="var(--accent-rose)" />
          {passed + skipped > 0 && (
            <div className="col-span-3 text-sm" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
              {acc}% pass rate
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {total} card{total === 1 ? "" : "s"} reviewed.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onChangeDeck}
          className="py-3 rounded-xl text-sm"
          style={{ background: "transparent", border: "1.5px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
        >
          New deck
        </button>
        <button
          onClick={onAgain}
          className="py-3 rounded-xl text-sm"
          style={{ background: "var(--accent-gold)", color: "var(--accent-crane-white)", border: "1.5px solid var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
        >
          Shuffle again
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="text-2xl font-bold" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
