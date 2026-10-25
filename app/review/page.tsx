"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import AudioButton from "@/components/AudioButton";
import MoonHanzi from "@/components/MoonHanzi";
import KnowButtons from "@/components/KnowButtons";
import DeckPicker from "@/components/DeckPicker";
import BoxStrip from "@/components/BoxStrip";
import BoxMoveNote from "@/components/BoxMoveNote";
import { boxName } from "@/lib/leitner-rules";
import { useBackFace } from "@/lib/use-back-face";
import { submitGrade, type GradeOutcome } from "@/lib/review-client";

type Mode = "recognition" | "listening";
type Level = "all" | 1 | 2;

interface ReviewCard {
  id: number;
  word_id: number | null;
  deck_card_id: number | null;
  card_type: Mode;
  due: string;
  box: number;
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
  boxes: number[];
  total_cards: number;
  reviewed_today: number;
}

type SessionStats = { missed: number; known: number };
const NO_STATS: SessionStats = { missed: 0, known: 0 };

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewInner />
    </Suspense>
  );
}

function ReviewInner() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<"setup" | "review" | "finished" | "loading">("loading");
  const [mode, setMode] = useState<Mode>(() => (searchParams.get("type") === "listening" ? "listening" : "recognition"));
  const [level, setLevel] = useState<Level>("all");
  // ?deck=ID (from a deck's "Review" link) preselects one of the user's decks.
  const [deckId, setDeckId] = useState<number | null>(() => {
    const d = searchParams.get("deck");
    return d && /^\d+$/.test(d) ? Number(d) : null;
  });
  const [lastMove, setLastMove] = useState<{ word: string; outcome: GradeOutcome | null } | null>(null);
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>(NO_STATS);
  const [transitioning, setTransitioning] = useState(false);
  const [seededCount, setSeededCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  // Synchronous guard against double taps (state updates land a render later).
  const gradingRef = useRef(false);
  const startedAt = useRef<number>(0);

  // ── fetch initial queue for the current mode + level ──
  const loadQueue = useCallback(async (m: Mode = mode, lvl: Level = level, deck: number | null = deckId) => {
    setError(null);
    try {
      const qs = `type=${m}&limit=30${deck != null ? `&deck=${deck}` : lvl !== "all" ? `&level=${lvl}` : ""}`;
      const res = await fetch(`/api/review/queue?${qs}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sign in to track your reviews.");
        } else if (res.status === 404) {
          setError("That deck doesn't exist anymore — pick another one.");
          setQueue([]);
          setStats(null);
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
  }, [mode, level, deckId]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPhase("setup");
      return;
    }
    loadQueue(mode, level, deckId);
  }, [user, loading, mode, level, deckId, loadQueue]);

  // ── grading ──
  const grade = useCallback(
    async (known: boolean) => {
      if (phase !== "review" || !flipped || gradingRef.current) return;
      const card = queue[index];
      if (!card) return;
      gradingRef.current = true;
      setTransitioning(true);
      setGradeError(null);

      const elapsedMs = Date.now() - startedAt.current;
      try {
        const outcome = await submitGrade({ cardId: card.id }, known, elapsedMs);
        setLastMove({ word: card.simplified, outcome });
      } catch (e) {
        // Keep the card on screen so the user can retry.
        setGradeError((e as Error).message);
        gradingRef.current = false;
        setTransitioning(false);
        return;
      }

      setSessionStats((s) => known
        ? { ...s, known: s.known + 1 }
        : { ...s, missed: s.missed + 1 });

      // Flip back and swap in the next card in the same render: the front is
      // facing away at that moment, and the back face keeps showing the graded
      // card until the next reveal (useBackFace). Reveals stay blocked until
      // the 600ms flip-back has finished.
      setFlipped(false);
      if (index + 1 >= queue.length) {
        setPhase("finished");
        gradingRef.current = false;
        setTransitioning(false);
        return;
      }
      setIndex((i) => i + 1);
      startedAt.current = Date.now();
      setTimeout(() => {
        gradingRef.current = false;
        setTransitioning(false);
      }, 600);
    },
    [phase, flipped, queue, index],
  );

  // ── keyboard shortcuts ──
  useEffect(() => {
    if (phase !== "review") return;
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        if (!gradingRef.current) setFlipped(true);
        return;
      }
      // R = replay audio (listening cards). Handled via custom event so the
      // card child can own the <audio> element ref.
      if (e.key === "r" || e.key === "R") {
        window.dispatchEvent(new CustomEvent("review-replay"));
      }
      if (flipped && !transitioning) {
        if (e.key === "1") void grade(false);
        if (e.key === "2") void grade(true);
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
          Sign in to save your progress across sessions.
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
    level={level}
    onLevelChange={(l) => { setLevel(l); setPhase("loading"); }}
    deckId={deckId}
    onDeckChange={(d) => { setDeckId(d); setPhase("loading"); }}
    queue={queue}
    stats={stats}
    seeded={seededCount}
    error={error}
    onStart={() => {
      if (queue.length === 0) return;
      setPhase("review");
      setIndex(0);
      setFlipped(false);
      setSessionStats(NO_STATS);
      setLastMove(null);
      startedAt.current = Date.now();
    }}
  />;

  if (phase === "finished") return (
    <Finished
      stats={sessionStats}
      onAgain={() => { void loadQueue(mode, level, deckId); }}
    />
  );

  // phase === "review"
  const current = queue[index];
  if (!current) return null;
  return (
    <>
      {gradeError && <GradeErrorBanner message={gradeError} />}
      <ReviewCard
        card={current}
        index={index}
        total={queue.length}
        flipped={flipped}
        onReveal={() => { if (!gradingRef.current) setFlipped(true); }}
        onGrade={(known) => void grade(known)}
        sessionStats={sessionStats}
        lastMove={lastMove}
      />
    </>
  );
}

function GradeErrorBanner({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto mb-4 rounded-xl p-3" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
      <p className="text-sm text-center" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{message}</p>
    </div>
  );
}

// ─── Setup screen ────────────────────────────────────────────────────────────

function Setup({
  mode, onModeChange, level, onLevelChange, deckId, onDeckChange, queue, stats, seeded, error, onStart,
}: {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  level: Level;
  onLevelChange: (l: Level) => void;
  deckId: number | null;
  onDeckChange: (d: number | null) => void;
  queue: ReviewCard[];
  stats: ReviewStats | null;
  seeded: number;
  error: string | null;
  onStart: () => void;
}) {
  const subtitle = mode === "listening"
    ? "Audio-first cards — hear, then identify"
    : "See the word, remember the meaning";
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

      <DeckPicker value={deckId} onChange={onDeckChange} />

      {/* HSK level tabs (the HSK list only) */}
      {deckId == null && <LevelTabs level={level} onChange={onLevelChange} />}

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
        <div className="space-y-3">
          <StatCard label="Due now" value={stats.due_now} color="var(--accent-rose)" highlight={stats.due_now > 0} />
          <BoxStrip boxes={stats.boxes} newCount={stats.new_total} />
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

function LevelTabs({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  const items: { key: Level; label: string }[] = [
    { key: "all", label: "All" },
    { key: 1,     label: "HSK 1" },
    { key: 2,     label: "HSK 2" },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      {items.map(({ key, label }) => {
        const active = key === level;
        return (
          <button
            key={String(key)}
            onClick={() => onChange(key)}
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
  card, index, total, flipped, onReveal, onGrade, sessionStats, lastMove,
}: {
  card: ReviewCard;
  index: number;
  total: number;
  flipped: boolean;
  onReveal: () => void;
  onGrade: (known: boolean) => void;
  sessionStats: SessionStats;
  lastMove: { word: string; outcome: GradeOutcome | null } | null;
}) {
  const graded = sessionStats.known + sessionStats.missed;
  const acc = graded > 0 ? Math.round((sessionStats.known / graded) * 100) : 0;
  const isListening = card.card_type === "listening";
  // The answer side never shows the next card while turning back.
  const back = useBackFace(card, flipped);

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
        <span style={{ color: "var(--accent-rose)" }}>↺ {sessionStats.missed}</span>
        <span style={{ color: "var(--accent-gold)" }}>✓ {sessionStats.known}</span>
        {graded > 0 && (
          <span style={{ color: "var(--text-muted)" }}>{acc}%</span>
        )}
      </div>
      {lastMove && <BoxMoveNote word={lastMove.word} outcome={lastMove.outcome} />}

      <div className="card-flip" style={{ height: "420px" }} onClick={onReveal}>
        <div className={`card-inner relative h-full cursor-pointer ${flipped ? "flipped" : ""}`}>
          {/* Front */}
          <div
            className="card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="badge-gold mb-5">
              {card.hsk2_level != null ? `HSK ${card.hsk2_level}` : card.hsk3_level != null ? `HSK 3.0 · ${card.hsk3_level}` : card.deck_card_id != null ? "Your word" : "Vocab"}
              {" · "}
              {boxLabel(card.box)}
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
                <MoonHanzi text={card.simplified} />
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
              {boxLabel(back.box)}
            </div>
            <div className="chinese-md font-bold mb-1 text-center" style={{ color: "var(--text-parchment)", fontFamily: "Noto Serif SC, serif" }}>
              {back.simplified}
            </div>
            {back.traditional && back.traditional !== back.simplified && (
              <div className="text-sm mb-1" style={{ color: "#7A6855" }}>繁 {back.traditional}</div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xl font-pinyin" style={{ color: "#5A3F20", fontStyle: "italic" }}>
                {back.pinyin}
              </div>
              {back.audio_path && flipped && (
                <AudioButton
                  key={`back-${back.id}`}
                  src={back.audio_path}
                  autoPlay={!isListening}  /* recognition: autoplay on flip; listening already played on front */
                  size="sm"
                  label="Play word"
                />
              )}
            </div>
            <ol className="space-y-1 text-base text-center max-w-md" style={{ fontFamily: "Spectral, serif", color: "var(--text-parchment)" }}>
              {back.meanings.slice(0, 4).map((m, i) => (
                <li key={i}>
                  <span style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>{i + 1}.</span>{" "}
                  {m}
                </li>
              ))}
            </ol>
            {back.word_id != null && <Link
              href={`/vocab/${encodeURIComponent(back.simplified)}`}
              // New tab so the review session (queue position, counts) survives.
              target="_blank"
              rel="noopener"
              className="mt-4 text-xs"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
            >
              full detail ↗
            </Link>}
          </div>
        </div>
      </div>

      {flipped ? (
        <KnowButtons onMiss={() => onGrade(false)} onKnow={() => onGrade(true)} />
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

function boxLabel(box: number): string {
  return boxName(box).toLowerCase();
}

// ─── Finished ────────────────────────────────────────────────────────────────

function Finished({
  stats, onAgain,
}: {
  stats: SessionStats;
  onAgain: () => void;
}) {
  const total = stats.missed + stats.known;
  const acc = total > 0 ? Math.round((stats.known / total) * 100) : 0;

  return (
    <div className="max-w-md mx-auto text-center space-y-6 animate-fade-up">
      <div className="text-5xl py-3" style={{ color: acc >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}>
        {acc >= 90 ? "✦" : acc >= 70 ? "◈" : "◉"}
      </div>
      <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
        Session Complete
      </h2>

      <div className="rounded-2xl p-6 grid grid-cols-2 gap-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        {([
          { label: "Don't know", value: stats.missed, color: "var(--accent-rose)" },
          { label: "Know it",    value: stats.known,  color: "var(--accent-gold)" },
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
