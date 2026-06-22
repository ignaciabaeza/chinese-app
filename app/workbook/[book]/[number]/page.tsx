"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AudioButton from "@/components/AudioButton";
import { useAuth } from "@/components/AuthProvider";

interface Exercise {
  id: number;
  stable_id: string;
  type:
    | "cloze" | "reorder" | "matching" | "listening_choice"
    | "pinyin_tone" | "translate" | "dictation";
  prompt: string;
  payload: Record<string, unknown>;
  answer: Record<string, unknown>;
  audio_path: string | null;
  source_word_id: number | null;
  source_sentence_id: number | null;
  hsk_level: number | null;
}

interface ExerciseSet {
  lesson: { id: number; book: string; number: number; title_hanzi: string; title_english: string | null };
  exercises: Exercise[];
}

interface AttemptRecord {
  exerciseId: number;
  correct: boolean;
  userAnswer: unknown;
}

const TYPE_LABELS: Record<string, string> = {
  cloze: "Cloze",
  reorder: "Reorder",
  matching: "Matching",
  listening_choice: "Listening",
  pinyin_tone: "Tones",
  translate: "Translate",
  dictation: "Dictation",
};

export default function WorkbookSetPage({ params }: { params: Promise<{ book: string; number: string }> }) {
  const { book, number } = use(params);
  const lessonNumber = parseInt(number, 10);

  const [set, setSet] = useState<ExerciseSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [phase, setPhase] = useState<"loading" | "running" | "summary">("loading");
  const { user } = useAuth();

  useEffect(() => {
    fetch(`/api/workbook/sets/${book}/${number}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<ExerciseSet>;
      })
      .then((d) => {
        setSet(d);
        setPhase(d.exercises.length > 0 ? "running" : "summary");
      })
      .catch((err) => setError(String(err)));
  }, [book, number]);

  const recordAttempt = useCallback(
    async (rec: AttemptRecord) => {
      setAttempts((arr) => [...arr, rec]);
      if (user) {
        fetch("/api/workbook/attempt", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        }).catch(() => {});
      }
    },
    [user],
  );

  const advance = useCallback(() => {
    if (!set) return;
    if (index + 1 >= set.exercises.length) setPhase("summary");
    else setIndex((i) => i + 1);
  }, [set, index]);

  if (error) {
    return (
      <div className="px-4 py-8 max-w-3xl mx-auto">
        <Link href="/workbook" className="text-[var(--accent-gold)] text-sm">← All workbooks</Link>
        <div className="parchment-panel p-6 mt-4 text-[var(--ink)]">
          <p className="font-semibold mb-2">Could not load this set.</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === "loading" || !set) {
    return <div className="px-4 py-12 text-center text-[var(--text-muted)]">Loading workbook…</div>;
  }

  if (phase === "summary") {
    return (
      <SummaryView
        set={set}
        attempts={attempts}
        onRestart={() => {
          setAttempts([]);
          setIndex(0);
          setPhase("running");
        }}
      />
    );
  }

  const ex = set.exercises[index];

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4 text-sm">
        <Link href="/workbook" className="text-[var(--accent-gold)]">← All workbooks</Link>
        <span className="text-[var(--text-muted)]">
          {book.toUpperCase()} L{lessonNumber} · {index + 1} / {set.exercises.length}
        </span>
      </div>
      <h1 className="font-heading text-xl text-[var(--accent-gold)] mb-1">{set.lesson.title_hanzi}</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">{TYPE_LABELS[ex.type] ?? ex.type}</p>

      <ExerciseRunner
        key={ex.id}
        exercise={ex}
        onComplete={(correct, userAnswer) => recordAttempt({ exerciseId: ex.id, correct, userAnswer })}
        onAdvance={advance}
      />
    </div>
  );
}

// ─── Runner shell with Submit / Next ────────────────────────────────────────

function ExerciseRunner({
  exercise,
  onComplete,
  onAdvance,
}: {
  exercise: Exercise;
  onComplete: (correct: boolean, userAnswer: unknown) => void;
  onAdvance: () => void;
}) {
  const [graded, setGraded] = useState<{ correct: boolean; userAnswer: unknown } | null>(null);

  const grade = useCallback(
    (correct: boolean, userAnswer: unknown) => {
      if (graded) return;
      setGraded({ correct, userAnswer });
      onComplete(correct, userAnswer);
    },
    [graded, onComplete],
  );

  const inner = (() => {
    switch (exercise.type) {
      case "cloze": return <ClozeBody exercise={exercise} graded={graded} onGrade={grade} />;
      case "reorder": return <ReorderBody exercise={exercise} graded={graded} onGrade={grade} />;
      case "matching": return <MatchingBody exercise={exercise} graded={graded} onGrade={grade} />;
      case "listening_choice": return <ListeningChoiceBody exercise={exercise} graded={graded} onGrade={grade} />;
      case "pinyin_tone": return <PinyinToneBody exercise={exercise} graded={graded} onGrade={grade} />;
      case "translate": return <TranslateBody exercise={exercise} graded={graded} onGrade={grade} />;
      default:
        return <p className="text-[var(--text-muted)]">Unsupported exercise type: {exercise.type}</p>;
    }
  })();

  return (
    <div className="parchment-panel p-5 text-[var(--ink)]">
      <p className="font-heading text-sm mb-4">{exercise.prompt}</p>
      {inner}
      {graded && (
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center">
          <span className={`font-heading ${graded.correct ? "text-emerald-700" : "text-[var(--accent-rose)]"}`}>
            {graded.correct ? "✓ Correct" : "✗ Wrong"}
          </span>
          <button onClick={onAdvance} className="btn-gold px-6 py-2 rounded">Next →</button>
        </div>
      )}
    </div>
  );
}

// ─── Cloze ───────────────────────────────────────────────────────────────────

function ClozeBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as {
    sentence_blanked: string; sentence_full: string; pinyin?: string; english: string;
    options: { word_id: number; simplified: string; pinyin: string; english: string }[];
  };
  const answer = exercise.answer as { index: number; word_id: number; simplified: string };

  return (
    <div>
      <div className="chinese-md mb-2">{payload.sentence_blanked}</div>
      {payload.pinyin && <div className="font-pinyin italic text-sm mb-1 text-[var(--ink)]/70">{payload.pinyin}</div>}
      <div className="text-sm mb-5 text-[var(--ink)]/70">{payload.english}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {payload.options.map((o, i) => {
          const selected = (graded?.userAnswer as { index?: number } | null)?.index === i;
          const isAnswer = i === answer.index;
          let cls = "border-2 border-[var(--ink)]/15 hover:border-[var(--accent-gold)]";
          if (graded) {
            if (isAnswer) cls = "border-2 border-emerald-600 bg-emerald-50";
            else if (selected) cls = "border-2 border-[var(--accent-rose)] bg-[var(--accent-rose)]/10";
            else cls = "border-2 border-[var(--ink)]/10 opacity-60";
          }
          return (
            <button
              key={o.word_id}
              disabled={!!graded}
              onClick={() => onGrade(i === answer.index, { index: i, word_id: o.word_id })}
              className={`px-3 py-2 rounded text-left transition ${cls}`}
            >
              <div className="chinese-md text-base">{o.simplified}</div>
              <div className="font-pinyin italic text-xs text-[var(--ink)]/60">{o.pinyin}</div>
              {graded && <div className="text-xs mt-1 text-[var(--ink)]/70">{o.english}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reorder ─────────────────────────────────────────────────────────────────

function ReorderBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as { chips_shuffled: string[]; pinyin?: string; english: string };
  const answer = exercise.answer as { ordered: string[]; sentence: string };
  return <ChipAssembler bank={payload.chips_shuffled} answer={answer.ordered} english={payload.english} graded={graded} onGrade={onGrade} />;
}

// ─── Translate ───────────────────────────────────────────────────────────────

function TranslateBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as { english: string; pinyin?: string; chips: string[] };
  const answer = exercise.answer as { ordered: string[]; sentence: string };
  return (
    <ChipAssembler
      bank={payload.chips}
      answer={answer.ordered}
      english={payload.english}
      graded={graded}
      onGrade={onGrade}
      promptOverEnglish
    />
  );
}

/** Shared chip-building UI for reorder + translate. */
function ChipAssembler({
  bank, answer, english, graded, onGrade, promptOverEnglish,
}: {
  bank: string[];
  answer: string[];
  english: string;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
  promptOverEnglish?: boolean;
}) {
  // bank items can repeat; track by index, not value.
  const [used, setUsed] = useState<number[]>([]);

  const assembled = used.map((i) => bank[i]);
  const remaining = bank.map((_, i) => i).filter((i) => !used.includes(i));

  const submit = () => {
    if (graded || used.length === 0) return;
    const arr = used.map((i) => bank[i]);
    const correct = arr.length === answer.length && arr.every((t, i) => t === answer[i]);
    onGrade(correct, { ordered: arr });
  };

  return (
    <div>
      {promptOverEnglish && (
        <div className="mb-3 text-base text-[var(--ink)] font-heading">{english}</div>
      )}
      {!promptOverEnglish && (
        <div className="text-sm mb-3 text-[var(--ink)]/70">{english}</div>
      )}

      <div className="min-h-[3.5rem] mb-3 p-3 rounded bg-[var(--ink)]/5 border border-dashed border-[var(--ink)]/20 flex flex-wrap gap-2">
        {assembled.length === 0 && (
          <span className="text-sm text-[var(--ink)]/40">Tap chips below to build…</span>
        )}
        {assembled.map((t, i) => (
          <button
            key={`a-${i}-${used[i]}`}
            disabled={!!graded}
            onClick={() => setUsed(used.slice(0, i).concat(used.slice(i + 1)))}
            className="px-3 py-1.5 rounded bg-[var(--accent-gold)] text-[var(--ink)] font-heading text-sm"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {remaining.map((i) => (
          <button
            key={`b-${i}`}
            disabled={!!graded}
            onClick={() => setUsed([...used, i])}
            className="px-3 py-1.5 rounded border border-[var(--ink)]/30 text-[var(--ink)] font-heading text-sm hover:border-[var(--accent-gold)]"
          >
            {bank[i]}
          </button>
        ))}
      </div>

      {!graded && (
        <button
          onClick={submit}
          disabled={used.length === 0}
          className="btn-gold px-6 py-2 rounded disabled:opacity-50"
        >
          Submit
        </button>
      )}

      {graded && (
        <div className="text-sm space-y-1 mt-2">
          <div className="text-[var(--ink)]/70">Your answer: <span className="chinese-md">{assembled.join("")}</span></div>
          <div className="text-emerald-700">Correct: <span className="chinese-md">{answer.join("")}</span></div>
        </div>
      )}
    </div>
  );
}

// ─── Matching ────────────────────────────────────────────────────────────────

function MatchingBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as {
    hanzi_column: { word_id: number; simplified: string; pinyin: string }[];
    english_column: { word_id: number; english: string }[];
  };
  const answer = exercise.answer as { pairs: { word_id: number; english: string }[] };

  // Pairs: word_id → english (user's mapping)
  const [pairs, setPairs] = useState<Record<number, string>>({});
  const [selWord, setSelWord] = useState<number | null>(null);
  const [selEng, setSelEng] = useState<string | null>(null);

  // Auto-pair when both ends selected.
  useEffect(() => {
    if (selWord !== null && selEng !== null) {
      setPairs((p) => {
        const np = { ...p };
        // remove any prior assignment to either end
        for (const k of Object.keys(np)) {
          if (Number(k) === selWord || np[Number(k)] === selEng) delete np[Number(k)];
        }
        np[selWord] = selEng;
        return np;
      });
      setSelWord(null); setSelEng(null);
    }
  }, [selWord, selEng]);

  const unpair = (wordId: number) => {
    setPairs((p) => { const np = { ...p }; delete np[wordId]; return np; });
  };

  const submit = () => {
    if (graded || Object.keys(pairs).length < payload.hanzi_column.length) return;
    const correctMap = new Map(answer.pairs.map((p) => [p.word_id, p.english]));
    const allRight = payload.hanzi_column.every((w) => pairs[w.word_id] === correctMap.get(w.word_id));
    onGrade(allRight, { pairs });
  };

  const englishToWord = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [w, e] of Object.entries(pairs)) m[e] = Number(w);
    return m;
  }, [pairs]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {payload.hanzi_column.map((w) => {
            const paired = pairs[w.word_id] !== undefined;
            const isSel = selWord === w.word_id;
            const correctMap = new Map(answer.pairs.map((p) => [p.word_id, p.english]));
            const correctEng = correctMap.get(w.word_id);
            const isRight = graded && pairs[w.word_id] === correctEng;
            return (
              <button
                key={w.word_id}
                disabled={!!graded}
                onClick={() => {
                  if (paired) unpair(w.word_id);
                  else setSelWord((s) => (s === w.word_id ? null : w.word_id));
                }}
                className={`w-full p-2 rounded border-2 text-left ${
                  graded
                    ? isRight
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-[var(--accent-rose)] bg-[var(--accent-rose)]/10"
                    : isSel
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                      : paired
                        ? "border-[var(--accent-gold)]/60"
                        : "border-[var(--ink)]/20"
                }`}
              >
                <div className="chinese-md">{w.simplified}</div>
                <div className="font-pinyin italic text-xs text-[var(--ink)]/60">{w.pinyin}</div>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {payload.english_column.map((e) => {
            const paired = englishToWord[e.english] !== undefined;
            const isSel = selEng === e.english;
            return (
              <button
                key={`${e.word_id}-${e.english}`}
                disabled={!!graded}
                onClick={() => setSelEng((s) => (s === e.english ? null : e.english))}
                className={`w-full p-2 rounded border-2 text-left text-sm ${
                  isSel
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                    : paired
                      ? "border-[var(--accent-gold)]/60"
                      : "border-[var(--ink)]/20"
                }`}
              >
                {e.english}
              </button>
            );
          })}
        </div>
      </div>

      {!graded && (
        <button
          onClick={submit}
          disabled={Object.keys(pairs).length < payload.hanzi_column.length}
          className="btn-gold px-6 py-2 rounded mt-4 disabled:opacity-50"
        >
          Submit
        </button>
      )}
    </div>
  );
}

// ─── Listening choice ────────────────────────────────────────────────────────

function ListeningChoiceBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as {
    word_id: number; simplified: string; pinyin: string;
    audio_path: string; options: { letter: string; english: string }[];
  };
  const answer = exercise.answer as { letter: string; english: string };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        {payload.audio_path && <AudioButton src={payload.audio_path} autoPlay size="lg" />}
        <span className="text-[var(--ink)]/60 text-sm">Tap to replay</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {payload.options.map((o) => {
          const selected = (graded?.userAnswer as { letter?: string } | null)?.letter === o.letter;
          const isAnswer = o.letter === answer.letter;
          let cls = "border-[var(--ink)]/15 hover:border-[var(--accent-gold)]";
          if (graded) {
            if (isAnswer) cls = "border-emerald-600 bg-emerald-50";
            else if (selected) cls = "border-[var(--accent-rose)] bg-[var(--accent-rose)]/10";
            else cls = "border-[var(--ink)]/10 opacity-60";
          }
          return (
            <button
              key={o.letter}
              disabled={!!graded}
              onClick={() => onGrade(o.letter === answer.letter, { letter: o.letter })}
              className={`px-3 py-3 rounded border-2 text-left transition ${cls}`}
            >
              <span className="font-heading text-[var(--accent-gold)] mr-2">{o.letter}</span>
              <span className="text-[var(--ink)]">{o.english}</span>
            </button>
          );
        })}
      </div>

      {graded && (
        <div className="text-sm mt-4 text-[var(--ink)]/70">
          <span className="chinese-md">{payload.simplified}</span>
          <span className="font-pinyin italic ml-2">{payload.pinyin}</span>
        </div>
      )}
    </div>
  );
}

// ─── Pinyin tone ─────────────────────────────────────────────────────────────

function PinyinToneBody({
  exercise, graded, onGrade,
}: {
  exercise: Exercise;
  graded: { correct: boolean; userAnswer: unknown } | null;
  onGrade: (correct: boolean, ua: unknown) => void;
}) {
  const payload = exercise.payload as {
    word_id: number; simplified: string; pinyin: string; english: string;
    audio_path: string | null; options: number[][];
  };
  const answer = exercise.answer as { index: number; pattern: number[] };

  const fmt = (p: number[]) => p.map((n) => (n === 5 ? "·" : String(n))).join("-");

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="chinese-xl">{payload.simplified}</span>
        {payload.audio_path && <AudioButton src={payload.audio_path} size="md" />}
      </div>
      <div className="text-sm text-[var(--ink)]/70 mb-5">{payload.english}</div>

      <div className="grid grid-cols-2 gap-2">
        {payload.options.map((opt, i) => {
          const selected = (graded?.userAnswer as { index?: number } | null)?.index === i;
          const isAnswer = i === answer.index;
          let cls = "border-[var(--ink)]/15 hover:border-[var(--accent-gold)]";
          if (graded) {
            if (isAnswer) cls = "border-emerald-600 bg-emerald-50";
            else if (selected) cls = "border-[var(--accent-rose)] bg-[var(--accent-rose)]/10";
            else cls = "border-[var(--ink)]/10 opacity-60";
          }
          return (
            <button
              key={i}
              disabled={!!graded}
              onClick={() => onGrade(i === answer.index, { index: i, pattern: opt })}
              className={`px-3 py-3 rounded border-2 font-heading text-center transition ${cls}`}
            >
              {fmt(opt)}
            </button>
          );
        })}
      </div>

      {graded && (
        <div className="text-sm mt-4 font-pinyin italic text-[var(--ink)]/70">{payload.pinyin}</div>
      )}
    </div>
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function SummaryView({
  set, attempts, onRestart,
}: {
  set: ExerciseSet;
  attempts: AttemptRecord[];
  onRestart: () => void;
}) {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const byType: Record<string, { total: number; correct: number }> = {};
  for (const a of attempts) {
    const ex = set.exercises.find((e) => e.id === a.exerciseId);
    if (!ex) continue;
    if (!byType[ex.type]) byType[ex.type] = { total: 0, correct: 0 };
    byType[ex.type].total += 1;
    if (a.correct) byType[ex.type].correct += 1;
  }

  return (
    <div className="px-4 py-8 max-w-3xl mx-auto">
      <Link href="/workbook" className="text-[var(--accent-gold)] text-sm">← All workbooks</Link>
      <h1 className="font-heading text-2xl text-[var(--accent-gold)] mt-3 mb-1">{set.lesson.title_hanzi}</h1>
      <p className="text-[var(--text-muted)] mb-6">Set complete.</p>

      {total === 0 ? (
        <div className="parchment-panel p-6 text-[var(--ink)]">
          <p>This set has no exercises yet — run <code className="font-mono">npm run db:generate-exercises</code>.</p>
        </div>
      ) : (
        <>
          <div className="parchment-panel p-6 text-[var(--ink)] text-center mb-4">
            <div className="font-heading text-5xl text-[var(--accent-gold)]">{score}%</div>
            <div className="text-sm mt-2">{correct} / {total} correct</div>
          </div>

          <div className="space-y-2 mb-6">
            {Object.entries(byType).map(([t, s]) => (
              <div key={t} className="flex justify-between text-sm parchment-panel p-3 text-[var(--ink)]">
                <span>{TYPE_LABELS[t] ?? t}</span>
                <span>{s.correct} / {s.total}</span>
              </div>
            ))}
          </div>

          <button onClick={onRestart} className="btn-gold px-6 py-2 rounded mr-3">Try again</button>
        </>
      )}
      <Link href="/workbook" className="text-[var(--text-primary)] underline ml-2">Back to list</Link>
    </div>
  );
}
