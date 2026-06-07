"use client";

/**
 * /writing — stroke-order practice queue.
 *
 * Mirrors /review but uses `writing` card type. Each card asks the user to
 * draw every character of the word in turn via HanziWriter's quiz mode.
 * Per-character mistake counts are aggregated into an auto-rating:
 *   0 mistakes total → Good (3)
 *   1-2 mistakes     → Hard (2)
 *   ≥3 mistakes      → Again (1)
 * The user can override before submitting.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import HanziQuiz from "@/components/HanziQuiz";

interface WritingCard {
  id: number;
  word_id: number;
  card_type: string;
  due: string;
  state: 0 | 1 | 2 | 3;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
}

interface ReviewStats {
  due_now: number;
  new_total: number;
  learning: number;
  mature: number;
  total_cards: number;
  reviewed_today: number;
}

export default function WritingPage() {
  const { user, loading } = useAuth();

  const [phase, setPhase] = useState<"setup" | "review" | "finished" | "loading">("loading");
  const [level, setLevel] = useState<"all" | 1 | 2>("all");
  const [queue, setQueue] = useState<WritingCard[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [seeded, setSeeded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [perCharMistakes, setPerCharMistakes] = useState<number[]>([]);
  const [resetKey, setResetKey] = useState(0);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const startedAt = useRef<number>(Date.now());

  const loadQueue = useCallback(async (lvl: "all" | 1 | 2 = level) => {
    setError(null);
    try {
      const qs = `type=writing&limit=20${lvl !== "all" ? `&level=${lvl}` : ""}`;
      const res = await fetch(`/api/review/queue?${qs}`);
      if (!res.ok) {
        if (res.status === 401) setError("Sign in to track your writing reviews.");
        else setError(`Queue failed: ${res.status}`);
        setPhase("setup");
        return;
      }
      const data = await res.json();
      setQueue(data.queue);
      setStats(data.stats);
      setSeeded(data.seeded);
      setPhase("setup");
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
      setPhase("setup");
    }
  }, [level]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPhase("setup");
      return;
    }
    loadQueue(level);
  }, [user, loading, level, loadQueue]);

  const current = queue[index];
  const chars = current ? Array.from(current.simplified).filter((c) => /\p{Script=Han}/u.test(c)) : [];
  const isLastChar = chars.length > 0 && charIndex >= chars.length - 1;
  const allCharsDone = chars.length > 0 && charIndex >= chars.length;

  const handleCharComplete = useCallback(
    ({ totalMistakes }: { totalMistakes: number }) => {
      setPerCharMistakes((prev) => [...prev, totalMistakes]);
      // small delay so the user sees the completed stroke
      setTimeout(() => {
        if (isLastChar) {
          setCharIndex((i) => i + 1); // moves to "all chars done" → grade buttons
        } else {
          setCharIndex((i) => i + 1);
          setResetKey((k) => k + 1);
        }
      }, 350);
    },
    [isLastChar],
  );

  const grade = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (!current) return;
      setSessionStats((s) => ({
        ...s,
        again: rating === 1 ? s.again + 1 : s.again,
        hard:  rating === 2 ? s.hard + 1  : s.hard,
        good:  rating === 3 ? s.good + 1  : s.good,
        easy:  rating === 4 ? s.easy + 1  : s.easy,
      }));
      const elapsedMs = Date.now() - startedAt.current;
      try {
        await fetch("/api/review/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: current.id, rating, elapsedMs }),
        });
      } catch {
        // ignore
      }
      if (index + 1 >= queue.length) {
        setPhase("finished");
      } else {
        setIndex((i) => i + 1);
        setCharIndex(0);
        setPerCharMistakes([]);
        setResetKey((k) => k + 1);
        startedAt.current = Date.now();
      }
    },
    [current, index, queue.length],
  );

  if (loading || phase === "loading") return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center pt-10 space-y-4 animate-fade-up">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Writing
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          Sign in to track stroke-order practice across sessions.
        </p>
        <Link href="/auth" className="inline-block px-4 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
          Sign In
        </Link>
      </div>
    );
  }

  if (phase === "setup") return (
    <Setup
      level={level}
      onLevelChange={(l) => { setLevel(l); setPhase("loading"); }}
      queue={queue}
      stats={stats}
      seeded={seeded}
      error={error}
      onStart={() => {
        if (queue.length === 0) return;
        setPhase("review");
        setIndex(0);
        setCharIndex(0);
        setPerCharMistakes([]);
        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
        startedAt.current = Date.now();
      }}
    />
  );

  if (phase === "finished") return <Finished stats={sessionStats} onAgain={() => { void loadQueue(level); }} />;

  // phase === "review"
  if (!current) return null;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-ink">
          <div className="progress-ink-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {index + 1} / {queue.length}
        </span>
      </div>

      <div className="text-center space-y-1">
        <div className="font-pinyin text-xl" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          {current.pinyin}
        </div>
        <div className="text-base" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
          {current.meanings.slice(0, 2).join("; ")}
        </div>
        {chars.length > 1 && !allCharsDone && (
          <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            character {charIndex + 1} of {chars.length}
          </div>
        )}
      </div>

      {!allCharsDone ? (
        <div className="flex justify-center">
          <HanziQuiz
            char={chars[charIndex]}
            size={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 64 : 320)}
            resetKey={resetKey}
            onComplete={handleCharComplete}
          />
        </div>
      ) : (
        <GradeButtons
          mistakes={perCharMistakes.reduce((a, b) => a + b, 0)}
          totalChars={chars.length}
          word={current.simplified}
          onGrade={grade}
        />
      )}
    </div>
  );
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function Setup({
  level, onLevelChange, queue, stats, seeded, error, onStart,
}: {
  level: "all" | 1 | 2;
  onLevelChange: (l: "all" | 1 | 2) => void;
  queue: WritingCard[];
  stats: ReviewStats | null;
  seeded: number;
  error: string | null;
  onStart: () => void;
}) {
  const items: { key: "all" | 1 | 2; label: string }[] = [
    { key: "all", label: "All" },
    { key: 1,     label: "HSK 1" },
    { key: 2,     label: "HSK 2" },
  ];
  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Writing
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          Stroke-order practice · FSRS-scheduled
        </p>
      </div>

      {/* HSK level tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        {items.map(({ key, label }) => {
          const active = key === level;
          return (
            <button
              key={String(key)}
              onClick={() => onLevelChange(key)}
              className="py-2 rounded-lg text-xs"
              style={{
                background: active ? "rgba(201,168,76,0.15)" : "transparent",
                color: active ? "var(--accent-gold)" : "var(--text-muted)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      {seeded > 0 && (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.4)", color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
          ✦ Seeded {seeded.toLocaleString()} new card{seeded === 1 ? "" : "s"} for HSK 1–2 words.
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Due Now"        value={stats.due_now}        color="var(--accent-rose)" highlight={stats.due_now > 0} />
          <Stat label="New Available"  value={stats.new_total}      color="var(--wave)" />
          <Stat label="Learning"       value={stats.learning}       color="var(--accent-gold)" />
          <Stat label="Mature"         value={stats.mature}         color="var(--ink)" />
        </div>
      )}

      <button
        onClick={onStart}
        disabled={queue.length === 0}
        className="w-full py-4 rounded-xl text-sm font-semibold"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cormorant Garamond, serif",
          letterSpacing: "0.1em",
          opacity: queue.length === 0 ? 0.4 : 1,
        }}
      >
        {queue.length === 0 ? "Nothing due right now" : `Begin · ${queue.length} card${queue.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}

function Stat({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: highlight ? "rgba(196,133,122,0.06)" : "var(--bg-secondary)", border: highlight ? "1px solid rgba(196,133,122,0.4)" : "1px solid var(--border-subtle)" }}>
      <div className="text-3xl font-bold mb-1" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

// ─── Grade buttons ───────────────────────────────────────────────────────────

function GradeButtons({
  mistakes, totalChars, word, onGrade,
}: {
  mistakes: number;
  totalChars: number;
  word: string;
  onGrade: (r: 1 | 2 | 3 | 4) => void;
}) {
  // suggested rating based on mistake count
  const suggested: 1 | 2 | 3 = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
  const labels = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" } as const;
  const colors = { 1: "var(--accent-rose)", 2: "var(--wave)", 3: "var(--accent-gold)", 4: "var(--accent-gold)" } as const;

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}>
      <div className="text-center space-y-1">
        <div className="font-display" style={{ fontSize: "3rem", color: "var(--text-parchment)", lineHeight: 1 }}>{word}</div>
        <div className="text-sm" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>
          {mistakes === 0 ? "Perfect — no mistakes" : `${mistakes} mistake${mistakes === 1 ? "" : "s"} across ${totalChars} character${totalChars === 1 ? "" : "s"}`}
        </div>
        <div className="text-xs" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
          Suggested: <span style={{ color: colors[suggested] }}>{labels[suggested]}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {([1, 2, 3, 4] as const).map((r) => (
          <button
            key={r}
            onClick={() => onGrade(r)}
            className="py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: r === suggested ? colors[r] : "transparent",
              border: `1.5px solid ${colors[r]}`,
              color: r === suggested ? "var(--bg-parchment)" : colors[r],
              fontFamily: "Cormorant Garamond, serif",
              letterSpacing: "0.05em",
            }}
          >
            <div>{labels[r]}</div>
            <div className="text-xs opacity-60 mt-0.5">[{r}]</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Finished ────────────────────────────────────────────────────────────────

function Finished({
  stats, onAgain,
}: {
  stats: { again: number; hard: number; good: number; easy: number };
  onAgain: () => void;
}) {
  const total = stats.again + stats.hard + stats.good + stats.easy;
  const correct = stats.hard + stats.good + stats.easy;
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="max-w-md mx-auto text-center space-y-6 animate-fade-up">
      <div className="text-5xl py-3" style={{ color: acc >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}>
        {acc >= 90 ? "✦" : acc >= 70 ? "◈" : "◉"}
      </div>
      <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
        Writing Session Complete
      </h2>
      <div className="rounded-2xl p-6 grid grid-cols-4 gap-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        {([
          { label: "Again", value: stats.again, color: "var(--accent-rose)" },
          { label: "Hard",  value: stats.hard,  color: "var(--wave)" },
          { label: "Good",  value: stats.good,  color: "var(--accent-gold)" },
          { label: "Easy",  value: stats.easy,  color: "var(--accent-gold)" },
        ] as const).map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-bold" style={{ color: s.color, fontFamily: "Cormorant Garamond, serif" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={onAgain}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}
      >
        Check Queue Again
      </button>
    </div>
  );
}
