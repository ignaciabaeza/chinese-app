"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AudioButton from "@/components/AudioButton";
import type { LessonDetail, LessonWord, StepKey, Dialogue, DialogueLine } from "@/lib/lessons";

const STEPS: { key: StepKey; label: string; description: string }[] = [
  { key: "listen",  label: "Listen",  description: "Hear the dialogue first, text hidden." },
  { key: "read",    label: "Read",    description: "Walk through every line with pinyin + English." },
  { key: "vocab",   label: "Vocab",   description: "Lesson words. Add the whole set to your deck." },
  { key: "grammar", label: "Grammar", description: "New patterns introduced this lesson." },
  { key: "done",    label: "Done",    description: "Wrap up and queue the next lesson." },
];

interface Props {
  level: number;
  number: number;
  detail: LessonDetail;
  initialProgress: StepKey[];
  signedIn: boolean;
  readerTextId: number | null;
}

export default function LessonStepper({ level, number, detail, initialProgress, signedIn, readerTextId }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<StepKey>>(new Set(initialProgress));
  const [words, setWords] = useState<LessonWord[]>(detail.words);

  // Persist step completion to the server (best-effort) every time the
  // user advances past a step. Silently no-ops for signed-out users.
  const markComplete = useCallback(async (step: StepKey) => {
    setCompleted((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev); next.add(step); return next;
    });
    if (!signedIn) return;
    try {
      await fetch(`/api/lessons/${level}/${number}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step }),
      });
    } catch { /* swallow — UI state already reflects completion */ }
  }, [signedIn, level, number]);

  function goTo(idx: number) {
    if (idx < 0 || idx >= STEPS.length) return;
    setActiveIdx(idx);
  }

  function advance() {
    void markComplete(STEPS[activeIdx].key);
    goTo(Math.min(activeIdx + 1, STEPS.length - 1));
  }

  const step = STEPS[activeIdx];

  return (
    <div className="space-y-6 mt-6">
      {/* Stepper rail */}
      <ol className="grid grid-cols-5 gap-1.5">
        {STEPS.map((s, i) => {
          const isActive = i === activeIdx;
          const isDone = completed.has(s.key);
          // Three visual states mirroring the nav language:
          //   active  → solid accent-gold background + cream text
          //   done    → cream background + gold border + gold text (a "stamped" look)
          //   pending → cream 80% background + muted text + subtle border
          const bg = isActive
            ? "var(--accent-gold)"
            : isDone
              ? "rgba(247, 242, 230, 1)"
              : "rgba(247, 242, 230, 0.80)";
          const fg = isActive
            ? "var(--accent-crane-white)"
            : isDone
              ? "var(--accent-gold)"
              : "var(--text-muted)";
          const border = isActive || isDone
            ? "1px solid var(--accent-gold)"
            : "1px solid var(--border-subtle)";
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className="w-full rounded-md px-2 py-2 transition-all text-left"
                style={{
                  background: bg,
                  border,
                  cursor: "pointer",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-widest flex items-center gap-1"
                  style={{ color: fg, fontFamily: "Cormorant Garamond, serif" }}
                >
                  <span>{String(i + 1).padStart(2, "0")} · {s.label}</span>
                  {isDone && !isActive && <span aria-hidden>✓</span>}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}>
            {step.label}
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{step.description}</p>
        </div>

        {step.key === "listen"  && <ListenStep detail={detail} />}
        {step.key === "read"    && <ReadStep detail={detail} readerTextId={readerTextId} />}
        {step.key === "vocab"   && <VocabStep level={level} number={number} words={words} setWords={setWords} signedIn={signedIn} />}
        {step.key === "grammar" && <GrammarStep detail={detail} />}
        {step.key === "done"    && <DoneStep detail={detail} completed={completed} words={words} />}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => goTo(activeIdx - 1)}
          disabled={activeIdx === 0}
          className="px-4 py-2 rounded-lg text-sm"
          style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
        >
          ← Previous
        </button>
        {activeIdx < STEPS.length - 1 && (
          <button
            onClick={advance}
            className="px-5 py-2 rounded-lg text-sm"
            style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}
          >
            {step.key === "done" ? "Finish" : "Continue →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Steps ───────────────────────────────────────────────────────────────────

function ListenStep({ detail }: { detail: LessonDetail }) {
  const [revealed, setRevealed] = useState(false);
  const [playingLineId, setPlayingLineId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Flatten all lines across all dialogues in order; used by "Play full".
  const allPlayable: DialogueLine[] = detail.dialogues.flatMap((d) => d.lines).filter((l) => l.audio_path);

  // Stop playback if the user navigates away from the step.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      setPlayingLineId(null);
    };
  }, []);

  function stop() {
    audioRef.current?.pause();
    setPlayingLineId(null);
  }

  function playSequence(lines: DialogueLine[]) {
    if (lines.length === 0) return;
    const el = audioRef.current;
    if (!el) return;
    let i = 0;
    const playOne = () => {
      const line = lines[i];
      setPlayingLineId(line.id);
      el.src = line.audio_path!;
      el.onended = () => {
        i++;
        if (i < lines.length) {
          // 250ms pause between lines
          setTimeout(playOne, 250);
        } else {
          setPlayingLineId(null);
          el.onended = null;
        }
      };
      el.play().catch(() => { setPlayingLineId(null); });
    };
    playOne();
  }

  if (detail.dialogues.length === 0) {
    return <Empty message="This lesson has no dialogues to listen to." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        Try to follow the dialogue by ear. The lines are masked until you reveal them.
      </p>

      {/* Hidden shared player. */}
      <audio ref={audioRef} className="hidden" />

      {allPlayable.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => playSequence(allPlayable)}
            disabled={playingLineId !== null}
            className="px-3 py-2 rounded-lg text-xs"
            style={{
              background: "transparent",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              fontFamily: "Cormorant Garamond, serif",
              letterSpacing: "0.05em",
            }}
          >
            ▶ Play full dialogue
          </button>
          {playingLineId !== null && (
            <button
              onClick={stop}
              className="px-3 py-2 rounded-lg text-xs"
              style={{
                background: "transparent",
                border: "1.5px solid var(--accent-rose)",
                color: "var(--accent-rose)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.05em",
              }}
            >
              ■ Stop
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {detail.dialogues.map((d) => (
          <DialogueListenCard
            key={d.id}
            dialogue={d}
            revealed={revealed}
            playingLineId={playingLineId}
            onPlaySituation={() => playSequence(d.lines.filter((l) => l.audio_path))}
          />
        ))}
      </div>

      <button
        onClick={() => setRevealed((r) => !r)}
        className="w-full py-2 rounded-lg text-sm"
        style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
      >
        {revealed ? "Hide text" : "Reveal text"}
      </button>

      {allPlayable.length === 0 && (
        <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          No per-line audio yet — re-run <code style={{ color: "var(--accent-gold)" }}>npm run db:generate-audio</code> to populate it.
        </p>
      )}
    </div>
  );
}

function DialogueListenCard({
  dialogue, revealed, playingLineId, onPlaySituation,
}: {
  dialogue: Dialogue;
  revealed: boolean;
  playingLineId: number | null;
  onPlaySituation: () => void;
}) {
  const hasAudio = dialogue.lines.some((l) => l.audio_path);
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-widest" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
          Situation {dialogue.position}{dialogue.title_hanzi ? ` · ${dialogue.title_hanzi}` : ""}
        </div>
        {hasAudio && (
          <button
            onClick={onPlaySituation}
            className="text-xs px-2 py-0.5 rounded"
            style={{ color: "var(--accent-gold)", border: "1px solid var(--accent-gold)", background: "transparent", fontFamily: "Cormorant Garamond, serif" }}
          >
            ▶
          </button>
        )}
      </div>
      {dialogue.lines.map((l) => {
        const isPlaying = playingLineId === l.id;
        return (
          <div
            key={l.id}
            className="flex items-center gap-3 rounded px-1 py-0.5"
            style={isPlaying ? { background: "rgba(162,58,74,0.08)" } : undefined}
          >
            <SpeakerBadge speaker={l.speaker ?? ""} />
            {revealed ? (
              <span className="font-display text-lg" style={{ color: "var(--text-parchment)" }}>{l.simplified}</span>
            ) : (
              <span className="flex gap-1">
                {Array.from(l.simplified).map((_, i) => (
                  <span key={i} className="inline-block rounded-sm" style={{ width: 16, height: 16, background: "rgba(60,48,30,0.10)" }} />
                ))}
              </span>
            )}
            {l.audio_path && <AudioButton src={l.audio_path} size="sm" label="Play line" />}
          </div>
        );
      })}
    </div>
  );
}

function ReadStep({ detail, readerTextId }: { detail: LessonDetail; readerTextId: number | null }) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  if (detail.dialogues.length === 0) {
    return <Empty message="No dialogues in this lesson." />;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />Pinyin
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={showEnglish} onChange={(e) => setShowEnglish(e.target.checked)} />English
        </label>
        {readerTextId && (
          <Link href={`/reader/${readerTextId}`} className="ml-auto" style={{ color: "var(--accent-gold)" }}>
            Open in Reader (tap-to-read) →
          </Link>
        )}
      </div>
      <div className="space-y-4">
        {detail.dialogues.map((d) => (
          <div key={d.id} className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
              Situation {d.position}{d.title_hanzi ? ` · ${d.title_hanzi}` : ""}{d.title_english ? ` — ${d.title_english}` : ""}
            </div>
            {d.lines.map((l) => (
              <div key={l.id} className="grid grid-cols-[auto_1fr_auto] gap-3 items-start py-1">
                <SpeakerBadge speaker={l.speaker ?? ""} />
                <div className="min-w-0">
                  <div className="font-display text-lg" style={{ color: "var(--text-parchment)" }}>{l.simplified}</div>
                  {showPinyin && l.pinyin && (
                    <div className="text-sm font-pinyin" style={{ color: "#7A6855", fontStyle: "italic" }}>{l.pinyin}</div>
                  )}
                  {showEnglish && l.english && (
                    <div className="text-sm" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>{l.english}</div>
                  )}
                </div>
                {l.audio_path && <AudioButton src={l.audio_path} size="sm" label="Play line" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function VocabStep({
  level, number, words, setWords, signedIn,
}: {
  level: number; number: number; words: LessonWord[]; setWords: (w: LessonWord[]) => void; signedIn: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  if (words.length === 0) {
    return <Empty message="No vocab words tagged on this lesson yet." />;
  }
  const unseen = words.filter((w) => w.state === "unseen").length;

  async function addAll() {
    if (!signedIn) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/lessons/${level}/${number}/seed-words`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAdded(data.added ?? 0);
        // Optimistically flip every "unseen" word to "new".
        setWords(words.map((w) => (w.state === "unseen" ? { ...w, state: "new" } : w)));
      }
    } finally { setAdding(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {words.length} word{words.length === 1 ? "" : "s"}{unseen > 0 ? ` · ${unseen} not yet in your deck` : ""}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/flashcards?lesson=hsk${level}-${number}`}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "transparent",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
              fontFamily: "Cormorant Garamond, serif",
              letterSpacing: "0.05em",
            }}
          >
            ▷ Practice as flashcards
          </Link>
          {signedIn && (
            <button
              onClick={addAll}
              disabled={adding || unseen === 0}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "transparent",
                border: "1.5px solid var(--accent-gold)",
                color: "var(--accent-gold)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.05em",
                opacity: unseen === 0 ? 0.4 : 1,
              }}
            >
              {adding ? "Adding…" : unseen === 0 ? "All in deck" : `+ Add ${unseen} to deck`}
            </button>
          )}
        </div>
      </div>

      {added !== null && (
        <p className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Spectral, serif" }}>
          ✓ {added.toLocaleString()} card{added === 1 ? "" : "s"} added to your recognition deck.
        </p>
      )}

      <ul className="grid sm:grid-cols-2 gap-2">
        {words.map((w) => (
          <li key={w.word_id} className="rounded-lg px-3 py-2 flex items-start gap-3"
              style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <Link href={`/vocab/${encodeURIComponent(w.simplified)}`}
                      className="font-display text-base"
                      style={{ color: "var(--text-parchment)" }}>
                  {w.simplified}
                </Link>
                <span className="font-pinyin text-sm" style={{ color: "#7A6855", fontStyle: "italic" }}>{w.pinyin}</span>
                <StateBadge state={w.state} />
              </div>
              <div className="text-xs truncate" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>
                {w.meanings?.slice(0, 2).join("; ")}
              </div>
            </div>
            {w.audio_path && <AudioButton src={w.audio_path} size="sm" label={`Play ${w.simplified}`} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GrammarStep({ detail }: { detail: LessonDetail }) {
  if (detail.grammar.length === 0) {
    return <Empty message="No grammar points in this lesson." />;
  }
  return (
    <div className="space-y-4">
      {detail.grammar.map((g) => (
        <div key={g.gpId} className="rounded-xl p-4" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
            <div>
              <div className="font-display text-lg" style={{ color: "var(--text-parchment)" }}>{g.title_hanzi}</div>
              <div className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>{g.title_english}</div>
            </div>
            <Link href={`/grammar/${encodeURIComponent(g.gpId)}`} className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
              Practice scramble →
            </Link>
          </div>
          {g.pattern && (
            <div className="text-sm font-pinyin mb-2" style={{ color: "#7A6855", fontStyle: "italic" }}>{g.pattern}</div>
          )}
          <p className="text-sm" style={{ color: "#7A6855", fontFamily: "Spectral, serif" }}>{g.point.explanation.english}</p>
          {g.point.examples && g.point.examples.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm" style={{ fontFamily: "Spectral, serif" }}>
              {g.point.examples.slice(0, 3).map((ex, i) => (
                <li key={i} className="flex flex-col">
                  <span className="font-display" style={{ color: "var(--text-parchment)" }}>{ex.hanzi}</span>
                  <span className="text-xs font-pinyin" style={{ color: "#7A6855", fontStyle: "italic" }}>{ex.pinyin}</span>
                  {ex.english && <span className="text-xs" style={{ color: "#7A6855" }}>{ex.english}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function DoneStep({ detail, completed, words }: { detail: LessonDetail; completed: Set<StepKey>; words: LessonWord[] }) {
  const total = 5;
  const done = ["listen", "read", "vocab", "grammar", "done"].filter((k) => completed.has(k as StepKey)).length;
  const inDeck = words.filter((w) => w.state !== "unseen").length;
  return (
    <div className="space-y-5 text-center">
      <div className="text-4xl py-3" style={{ color: "var(--accent-gold)" }}>✦</div>
      <h3 className="text-xl" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
        Lesson complete
      </h3>
      <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        {done}/{total} steps · {inDeck}/{words.length} vocab in your deck
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {detail.prev && (
          <Link href={`/course/${detail.prev.level}/lesson/${detail.prev.number}`}
                className="block rounded-xl p-4 text-left"
                style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>← Previous lesson</div>
            <div className="font-display" style={{ color: "var(--text-parchment)" }}>第{detail.prev.number}课 · {detail.prev.title}</div>
          </Link>
        )}
        {detail.next && (
          <Link href={`/course/${detail.next.level}/lesson/${detail.next.number}`}
                className="block rounded-xl p-4 text-left"
                style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}>
            <div className="text-xs" style={{ color: "var(--accent-gold)" }}>Next lesson →</div>
            <div className="font-display" style={{ color: "var(--text-parchment)" }}>第{detail.next.number}课 · {detail.next.title}</div>
          </Link>
        )}
      </div>
      <Link href="/review" className="inline-block text-sm" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
        Go review your new cards →
      </Link>
    </div>
  );
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function SpeakerBadge({ speaker }: { speaker: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    A: { bg: "rgba(162,58,74,0.10)",  fg: "var(--accent-gold)" },
    B: { bg: "rgba(74,120,143,0.10)", fg: "var(--wave-deep)" },
    C: { bg: "rgba(140,130,104,0.10)",fg: "var(--ink-soft)" },
  };
  const colors = palette[speaker] ?? palette.A;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: colors.bg, color: colors.fg, width: 24, height: 24, fontFamily: "Cormorant Garamond, serif" }}
    >
      {speaker || "·"}
    </span>
  );
}

function StateBadge({ state }: { state: LessonWord["state"] }) {
  const palette: Record<LessonWord["state"], { color: string; label: string }> = {
    unseen:   { color: "var(--text-muted)",   label: "—" },
    new:      { color: "var(--accent-gold)",  label: "new" },
    learning: { color: "var(--wave)",         label: "learning" },
    review:   { color: "var(--ink-soft)",     label: "review" },
    mature:   { color: "var(--ink)",          label: "mature" },
  };
  const p = palette[state];
  return (
    <span className="badge-gold" style={{ background: "transparent", borderColor: p.color, color: p.color }}>
      {p.label}
    </span>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
      {message}
    </p>
  );
}
