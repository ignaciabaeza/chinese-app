"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import AudioButton from "@/components/AudioButton";

type Mode = "recognition" | "listening";

interface ReviewCard {
  id: number;
  word_id: number;
  card_type: Mode;
  due: string;
  state: 0 | 1 | 2 | 3;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
  audio_path: string | null;
}

interface ReviewStats {
  due_now: number;
  new_total: number;
  learning: number;
  mature: number;
  total_cards: number;
  reviewed_today: number;
}

const RATING_LABELS: Record<number, { label: string; key: string; color: string }> = {
  1: { label: "Again",  key: "1", color: "var(--accent-rose)" },
  2: { label: "Hard",   key: "2", color: "var(--wave)" },
  3: { label: "Good",   key: "3", color: "var(--accent-gold)" },
  4: { label: "Easy",   key: "4", color: "var(--accent-gold)" },
};

export default function ReviewPage() {
  const { user, loading } = useAuth();

  const [phase, setPhase] = useState<"setup" | "review" | "finished" | "loading">("loading");
  const [mode, setMode] = useState<Mode>("recognition");
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
  const [transitioning, setTransitioning] = useState(false);
  const [seededCount, setSeededCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());

  // ── fetch initial queue for the current mode ──
  const loadQueue = useCallback(async (m: Mode = mode) => {
    setError(null);
    try {
      const res = await fetch(`/api/review/queue?type=${m}&limit=30`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sign in to track your reviews.");
        } else {
          setError(`Queue failed: ${res.status}`);
        }
        setPhase("setup");
        return;
      }
      const data = await res.json();
      setQueue(data.queue);
      setStats(data.stats);
      setSeededCount(data.seeded);
      setPhase("setup");
    } catch (e) {
      setError(`Network error: ${(e as Error).message}`);
      setPhase("setup");
    }
  }, [mode]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPhase("setup");
      return;
    }
    loadQueue(mode);
  }, [user, loading, mode, loadQueue]);

  // ── grading ──
  const grade = useCallback(
    async (rating: 1 | 2 | 3 | 4) => {
      if (phase !== "review" || !flipped || transitioning) return;
      const card = queue[index];
      if (!card) return;
      setTransitioning(true);

      // optimistic counter bump
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
          body: JSON.stringify({ cardId: card.id, rating, elapsedMs }),
        });
      } catch {
        // ignore — server-side error will surface on next queue load
      }

      // advance
      setTimeout(() => {
        if (index + 1 >= queue.length) {
          setPhase("finished");
        } else {
          setIndex((i) => i + 1);
          setFlipped(false);
          startedAt.current = Date.now();
        }
        setTransitioning(false);
      }, 220);
    },
    [phase, flipped, transitioning, queue, index],
  );

  // ── keyboard shortcuts ──
  useEffect(() => {
    if (phase !== "review") return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped(true);
        return;
      }
      // R = replay audio (listening cards). Handled via custom event so the
      // card child can own the <audio> element ref.
      if (e.key === "r" || e.key === "R") {
        window.dispatchEvent(new CustomEvent("review-replay"));
      }
      if (flipped && !transitioning) {
        if (e.key === "1") void grade(1);
        if (e.key === "2") void grade(2);
        if (e.key === "3") void grade(3);
        if (e.key === "4") void grade(4);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, flipped, transitioning, grade]);

  // ── render ──
  if (loading || phase === "loading") return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center pt-10 space-y-4 animate-fade-up">
        <h1
          className="text-2xl"
          style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}
        >
          Review
        </h1>
        <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          Sign in to track FSRS-scheduled vocabulary review across sessions.
        </p>
        <Link
          href="/auth"
          className="inline-block px-4 py-2 rounded-lg text-sm"
          style={{ border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (phase === "setup") return <Setup
    mode={mode}
    onModeChange={(m) => { setMode(m); setPhase("loading"); }}
    queue={queue}
    stats={stats}
    seeded={seededCount}
    error={error}
    onStart={() => {
      if (queue.length === 0) return;
      setPhase("review");
      setIndex(0);
      setFlipped(false);
      setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
      startedAt.current = Date.now();
    }}
  />;

  if (phase === "finished") return (
    <Finished
      stats={sessionStats}
      onAgain={() => { void loadQueue(mode); }}
    />
  );

  // phase === "review"
  const current = queue[index];
  if (!current) return null;
  return (
    <ReviewCard
      card={current}
      index={index}
      total={queue.length}
      flipped={flipped}
      onReveal={() => setFlipped(true)}
      onGrade={(r) => void grade(r)}
      sessionStats={sessionStats}
    />
  );
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function Setup({
  mode, onModeChange, queue, stats, seeded, error, onStart,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  queue: ReviewCard[];
  stats: ReviewStats | null;
  seeded: number;
  error: string | null;
  onStart: () => void;
}) {
  const subtitle = mode === "listening"
    ? "Audio-first cards — hear, then identify"
    : "FSRS-scheduled recognition cards";
  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Review
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {subtitle}
        </p>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        {(["recognition", "listening"] as const).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
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
              {m === "recognition" ? "Recognition" : "Listening"}
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
          <StatCard label="Due Now"        value={stats.due_now}        color="var(--accent-rose)" highlight={stats.due_now > 0} />
          <StatCard label="New Available"  value={stats.new_total}      color="var(--wave)" />
          <StatCard label="Learning"       value={stats.learning}       color="var(--accent-gold)" />
          <StatCard label="Mature"         value={stats.mature}         color="var(--ink)" />
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
          cursor: queue.length === 0 ? "default" : "pointer",
        }}
      >
        {queue.length === 0
          ? (mode === "listening" ? "No listening cards due — run audio script?" : "Nothing due right now")
          : `Begin · ${queue.length} card${queue.length === 1 ? "" : "s"}`}
      </button>

      {stats && stats.reviewed_today > 0 && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {stats.reviewed_today} reviewed today
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, color, highlight }: { label: string; value: number; color: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight ? "rgba(196,133,122,0.06)" : "var(--bg-secondary)",
        border: highlight ? "1px solid rgba(196,133,122,0.4)" : "1px solid var(--border-subtle)",
      }}
    >
      <div className="text-3xl font-bold mb-1" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({
  card, index, total, flipped, onReveal, onGrade, sessionStats,
}: {
  card: ReviewCard;
  index: number;
  total: number;
  flipped: boolean;
  onReveal: () => void;
  onGrade: (r: 1 | 2 | 3 | 4) => void;
  sessionStats: { again: number; hard: number; good: number; easy: number };
}) {
  const sizeClass = card.simplified.length <= 2 ? "chinese-xl" : card.simplified.length <= 4 ? "chinese-lg" : "chinese-md";
  const totalCorrect = sessionStats.good + sessionStats.easy + sessionStats.hard;
  const acc = totalCorrect + sessionStats.again > 0
    ? Math.round((totalCorrect / (totalCorrect + sessionStats.again)) * 100)
    : 0;
  const isListening = card.card_type === "listening";

  // Replay shortcut (keyboard 'R'): re-fire the underlying <audio> by toggling key.
  const [replayKey, setReplayKey] = useState(0);
  useEffect(() => {
    function onReplay() { setReplayKey((k) => k + 1); }
    window.addEventListener("review-replay", onReplay as EventListener);
    return () => window.removeEventListener("review-replay", onReplay as EventListener);
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="flex-1 progress-ink">
          <div className="progress-ink-fill" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {index + 1} / {total}
        </span>
      </div>

      <div className="flex justify-center gap-6 text-sm" style={{ fontFamily: "Cormorant Garamond, serif" }}>
        <span style={{ color: "var(--accent-rose)" }}>↺ {sessionStats.again}</span>
        <span style={{ color: "var(--wave)" }}>⌽ {sessionStats.hard}</span>
        <span style={{ color: "var(--accent-gold)" }}>✓ {sessionStats.good + sessionStats.easy}</span>
        {totalCorrect + sessionStats.again > 0 && (
          <span style={{ color: "var(--text-muted)" }}>{acc}%</span>
        )}
      </div>

      <div className="card-flip" style={{ height: "420px" }} onClick={onReveal}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div
            className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="badge-gold mb-5">
              {card.hsk2_level != null ? `HSK ${card.hsk2_level}` : card.hsk3_level != null ? `HSK 3.0 · ${card.hsk3_level}` : "Vocab"}
              {" · "}
              {stateLabel(card.state)}
              {isListening && <span> · 听</span>}
            </div>
            {isListening ? (
              <div className="moon-circle flex items-center justify-center">
                {card.audio_path ? (
                  <AudioButton
                    key={`${card.id}-${replayKey}`}
                    src={card.audio_path}
                    autoPlay
                    size="lg"
                    label="Replay (R)"
                  />
                ) : (
                  <span style={{ color: "var(--accent-crane-white)" }}>—</span>
                )}
              </div>
            ) : (
              <div className="moon-circle">
                <div className={`${sizeClass} text-center leading-none font-bold`} style={{ color: "var(--accent-crane-white)", zIndex: 1 }}>
                  {card.simplified}
                </div>
              </div>
            )}
            <p className="text-xs mt-5" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
              {isListening ? "press R to replay · space to reveal" : "tap or press space to reveal"}
            </p>
          </div>

          {/* Back */}
          <div
            className="card-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-6 overflow-y-auto"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}
          >
            <div className="badge-gold mb-3" style={{ background: "rgba(201,168,76,0.15)" }}>
              {stateLabel(card.state)}
            </div>
            <div className="chinese-md font-bold mb-1 text-center" style={{ color: "var(--text-parchment)", fontFamily: "Noto Serif SC, serif" }}>
              {card.simplified}
            </div>
            {card.traditional && card.traditional !== card.simplified && (
              <div className="text-sm mb-1" style={{ color: "#7A6855" }}>繁 {card.traditional}</div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xl font-pinyin" style={{ color: "#5A3F20", fontStyle: "italic" }}>
                {card.pinyin}
              </div>
              {card.audio_path && flipped && (
                <AudioButton
                  key={`back-${card.id}`}
                  src={card.audio_path}
                  autoPlay={!isListening}  /* recognition: autoplay on flip; listening already played on front */
                  size="sm"
                  label="Play word"
                />
              )}
            </div>
            <ol className="space-y-1 text-base text-center max-w-md" style={{ fontFamily: "Spectral, serif", color: "var(--text-parchment)" }}>
              {card.meanings.slice(0, 4).map((m, i) => (
                <li key={i}>
                  <span style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>{i + 1}.</span>{" "}
                  {m}
                </li>
              ))}
            </ol>
            <Link
              href={`/vocab/${encodeURIComponent(card.simplified)}`}
              className="mt-4 text-xs"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
            >
              full detail →
            </Link>
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4] as const).map((r) => {
            const meta = RATING_LABELS[r];
            return (
              <button
                key={r}
                onClick={() => onGrade(r)}
                className="py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: "transparent",
                  border: `1.5px solid ${meta.color}`,
                  color: meta.color,
                  fontFamily: "Cormorant Garamond, serif",
                  letterSpacing: "0.05em",
                }}
              >
                <div>{meta.label}</div>
                <div className="text-xs opacity-60 mt-0.5">[{meta.key}]</div>
              </button>
            );
          })}
        </div>
      ) : (
        <button
          onClick={onReveal}
          className="w-full py-4 rounded-xl text-sm font-semibold"
          style={{
            background: "transparent",
            border: "1.5px solid var(--accent-gold)",
            color: "var(--accent-gold)",
            fontFamily: "Cormorant Garamond, serif",
            letterSpacing: "0.08em",
          }}
        >
          Reveal · Space
        </button>
      )}
    </div>
  );
}

function stateLabel(state: 0 | 1 | 2 | 3): string {
  switch (state) {
    case 0: return "new";
    case 1: return "learning";
    case 2: return "review";
    case 3: return "relearning";
  }
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
        Session Complete
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
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cormorant Garamond, serif",
          letterSpacing: "0.08em",
        }}
      >
        Check Queue Again
      </button>
    </div>
  );
}
