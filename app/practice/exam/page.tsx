"use client";

import { useState } from "react";
import Link from "next/link";
import { hsk1Sample1, type ExamQuestion, type MockExam } from "@/data/hsk1/exams/sample1";

const EXAMS: MockExam[] = [hsk1Sample1];

export default function ExamPage() {
  const [examId, setExamId] = useState<string | null>(null);
  const exam = EXAMS.find((e) => e.id === examId);

  if (!exam) return <ExamPicker exams={EXAMS} onPick={setExamId} />;
  return <ExamRunner exam={exam} onExit={() => setExamId(null)} />;
}

function ExamPicker({ exams, onPick }: { exams: MockExam[]; onPick: (id: string) => void }) {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}>
          Mock Exam
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          Practice with sample HSK-format papers.
        </p>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(196,133,122,0.06)", border: "1px solid rgba(196,133,122,0.4)" }}
      >
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--accent-rose)", fontFamily: "Cinzel, serif" }}>
          v1 limitations
        </div>
        <ul className="text-xs space-y-1 list-disc list-inside" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          <li>Listening section requires audio — deferred until lesson audio is wired up.</li>
          <li>Sample paper currently uses HSK 1 Lesson 3 vocabulary. More questions arrive as lessons are authored.</li>
        </ul>
      </div>

      <div className="space-y-3">
        {exams.map((e) => (
          <button
            key={e.id}
            onClick={() => onPick(e.id)}
            className="w-full rounded-2xl p-5 text-left transition-all"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>
                  {e.title}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  HSK {e.level} · {e.section} · {e.questions.length} questions
                </div>
              </div>
              <span style={{ color: "var(--accent-gold)" }}>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExamRunner({ exam, onExit }: { exam: MockExam; onExit: () => void }) {
  const [answers, setAnswers] = useState<Array<number | boolean | null>>(
    () => Array.from({ length: exam.questions.length }, () => null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [index, setIndex] = useState(0);

  const current = exam.questions[index];
  const answered = answers.filter((a) => a !== null).length;

  function setAnswer(value: number | boolean) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function score(): { correct: number; total: number; perQ: boolean[] } {
    const perQ = exam.questions.map((q, i) => {
      const a = answers[i];
      if (a === null) return false;
      if (q.type === "true_false") return a === q.answer;
      return a === q.answer;
    });
    return { correct: perQ.filter(Boolean).length, total: exam.questions.length, perQ };
  }

  if (submitted) return <Results exam={exam} answers={answers} score={score()} onExit={onExit} />;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          ← Exit
        </button>
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          {answered} / {exam.questions.length} answered
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 progress-ink">
          <div className="progress-ink-fill" style={{ width: `${((index + 1) / exam.questions.length) * 100}%` }} />
        </div>
        <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          Q{index + 1} / {exam.questions.length}
        </span>
      </div>

      <QuestionCard q={current} answer={answers[index]} onAnswer={setAnswer} />

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="py-3 rounded-xl text-sm"
          style={{
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.05em",
            background: "rgba(201,168,76,0.06)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)",
            opacity: index === 0 ? 0.4 : 1,
          }}
        >
          ← Previous
        </button>
        {index < exam.questions.length - 1 ? (
          <button
            onClick={() => setIndex((i) => Math.min(exam.questions.length - 1, i + 1))}
            className="py-3 rounded-xl text-sm font-semibold"
            style={{
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
              background: "transparent",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
            }}
          >
            Next →
          </button>
        ) : (
          <button
            onClick={() => setSubmitted(true)}
            disabled={answered === 0}
            className="py-3 rounded-xl text-sm font-semibold"
            style={{
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.05em",
              background: answered === 0 ? "transparent" : "var(--accent-gold)",
              border: "1.5px solid var(--accent-gold)",
              color: answered === 0 ? "var(--accent-gold)" : "var(--bg-primary)",
              opacity: answered === 0 ? 0.5 : 1,
            }}
          >
            Submit
          </button>
        )}
      </div>

      <div className="flex gap-1 flex-wrap justify-center pt-2">
        {exam.questions.map((_, i) => {
          const isAnswered = answers[i] !== null;
          const isCurrent = i === index;
          return (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="w-7 h-7 rounded-md text-xs font-bold"
              style={{
                fontFamily: "Cinzel, serif",
                background: isCurrent ? "var(--accent-gold)" : isAnswered ? "rgba(201,168,76,0.18)" : "transparent",
                color: isCurrent ? "var(--bg-primary)" : isAnswered ? "var(--accent-gold)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  answer,
  onAnswer,
}: {
  q: ExamQuestion;
  answer: number | boolean | null;
  onAnswer: (a: number | boolean) => void;
}) {
  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {q.type === "translate_to_english" && (
        <>
          <div className="text-center">
            <div className="font-display text-5xl mb-2" style={{ color: "var(--text-primary)" }}>{q.prompt.hanzi}</div>
            <div className="font-pinyin text-base" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{q.prompt.pinyin}</div>
            <div className="text-xs mt-3" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>What does this mean?</div>
          </div>
          <ChoiceList choices={q.choices.map((c) => ({ label: c }))} answer={answer} onAnswer={onAnswer} />
        </>
      )}

      {q.type === "translate_to_chinese" && (
        <>
          <div className="text-center">
            <div className="text-2xl mb-2" style={{ color: "var(--text-primary)", fontFamily: "Lora, serif" }}>
              &ldquo;{q.prompt}&rdquo;
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>How do you say this in Chinese?</div>
          </div>
          <ChoiceList
            choices={q.choices.map((c) => ({ label: c.hanzi, sub: c.pinyin }))}
            answer={answer}
            onAnswer={onAnswer}
            chineseChoices
          />
        </>
      )}

      {q.type === "fill_blank" && (
        <>
          <div className="text-center">
            <div className="font-display text-3xl mb-2" style={{ color: "var(--text-primary)" }}>
              {q.sentence.before}
              <span className="mx-2 px-3 py-0.5 rounded" style={{ background: "rgba(201,168,76,0.15)", color: "var(--accent-gold)" }}>____</span>
              {q.sentence.after}
            </div>
            <div className="font-pinyin text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{q.sentence.pinyin}</div>
            <div className="text-xs mt-2" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>{q.translation}</div>
          </div>
          <ChoiceList choices={q.choices.map((c) => ({ label: c }))} answer={answer} onAnswer={onAnswer} chineseChoices />
        </>
      )}

      {q.type === "true_false" && (
        <>
          <div className="text-center">
            <div className="font-display text-3xl mb-2" style={{ color: "var(--text-primary)" }}>{q.prompt.hanzi}</div>
            <div className="font-pinyin text-base" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{q.prompt.pinyin}</div>
            <div className="text-sm mt-3" style={{ color: "var(--text-primary)", fontFamily: "Lora, serif" }}>
              Does this mean: <em>&ldquo;{q.claim}&rdquo;</em>?
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onAnswer(true)}
              className="py-4 rounded-xl text-sm font-semibold"
              style={{
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.05em",
                background: answer === true ? "var(--accent-gold)" : "transparent",
                color: answer === true ? "var(--bg-primary)" : "var(--accent-gold)",
                border: "1.5px solid var(--accent-gold)",
              }}
            >
              ✓ True
            </button>
            <button
              onClick={() => onAnswer(false)}
              className="py-4 rounded-xl text-sm font-semibold"
              style={{
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.05em",
                background: answer === false ? "var(--accent-rose)" : "transparent",
                color: answer === false ? "var(--bg-primary)" : "var(--accent-rose)",
                border: "1.5px solid var(--accent-rose)",
              }}
            >
              ✗ False
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ChoiceList({
  choices, answer, onAnswer, chineseChoices,
}: {
  choices: { label: string; sub?: string }[];
  answer: number | boolean | null;
  onAnswer: (a: number) => void;
  chineseChoices?: boolean;
}) {
  return (
    <div className="space-y-2">
      {choices.map((c, i) => {
        const selected = answer === i;
        return (
          <button
            key={i}
            onClick={() => onAnswer(i)}
            className="w-full px-4 py-3 rounded-lg text-left flex items-center gap-3"
            style={{
              background: selected ? "rgba(201,168,76,0.18)" : "rgba(0,0,0,0.18)",
              border: `1px solid ${selected ? "var(--accent-gold)" : "var(--border-subtle)"}`,
            }}
          >
            <span
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: selected ? "var(--accent-gold)" : "rgba(201,168,76,0.12)",
                color: selected ? "var(--bg-primary)" : "var(--accent-gold)",
                fontFamily: "Cinzel, serif",
              }}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <div className="flex-1">
              <div
                className={chineseChoices ? "font-display text-lg" : "text-sm"}
                style={{ color: "var(--text-primary)", fontFamily: chineseChoices ? undefined : "Lora, serif" }}
              >
                {c.label}
              </div>
              {c.sub && (
                <div className="text-xs font-pinyin mt-0.5" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  {c.sub}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Results({
  exam, answers, score, onExit,
}: {
  exam: MockExam;
  answers: Array<number | boolean | null>;
  score: { correct: number; total: number; perQ: boolean[] };
  onExit: () => void;
}) {
  const pct = Math.round((score.correct / score.total) * 100);
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <div className="text-5xl py-3" style={{ color: pct >= 80 ? "var(--accent-gold)" : "var(--accent-rose)" }}>
          {pct >= 80 ? "✦" : pct >= 60 ? "◈" : "◉"}
        </div>
        <h2 style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", fontSize: "1.4rem", letterSpacing: "0.08em" }}>
          {pct >= 60 ? "Passed" : "Below Passing"}
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          {score.correct} of {score.total} correct · {pct}%
        </p>
      </div>

      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          Question Review
        </div>
        <ol className="space-y-3">
          {exam.questions.map((q, i) => {
            const isRight = score.perQ[i];
            const correctLabel = explainAnswer(q);
            return (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isRight ? "rgba(201,168,76,0.18)" : "rgba(196,133,122,0.18)",
                    color: isRight ? "var(--accent-gold)" : "var(--accent-rose)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div style={{ color: "var(--text-primary)", fontFamily: "Lora, serif" }}>
                    {questionPrompt(q)}
                  </div>
                  {!isRight && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Correct answer: <span style={{ color: "var(--accent-gold)" }}>{correctLabel}</span>
                      {answers[i] !== null && (
                        <> · Your answer: <span style={{ color: "var(--accent-rose)" }}>{userAnswerLabel(q, answers[i]!)}</span></>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <button
        onClick={onExit}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cinzel, serif",
          letterSpacing: "0.08em",
        }}
      >
        Back to Exams
      </button>
      <Link href="/practice/flashcards" className="block text-center text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
        Drill missed words with flashcards →
      </Link>
    </div>
  );
}

function questionPrompt(q: ExamQuestion): string {
  if (q.type === "translate_to_english") return `${q.prompt.hanzi} (${q.prompt.pinyin})`;
  if (q.type === "translate_to_chinese") return `"${q.prompt}"`;
  if (q.type === "fill_blank") return `${q.sentence.before} ___ ${q.sentence.after}`;
  return `${q.prompt.hanzi} = "${q.claim}"?`;
}

function explainAnswer(q: ExamQuestion): string {
  if (q.type === "translate_to_english") return q.choices[q.answer];
  if (q.type === "translate_to_chinese") return `${q.choices[q.answer].hanzi} (${q.choices[q.answer].pinyin})`;
  if (q.type === "fill_blank") return q.choices[q.answer];
  return q.answer ? "True" : "False";
}

function userAnswerLabel(q: ExamQuestion, a: number | boolean): string {
  if (q.type === "true_false") return a ? "True" : "False";
  if (q.type === "translate_to_english") return q.choices[a as number];
  if (q.type === "translate_to_chinese") return q.choices[a as number].hanzi;
  return q.choices[a as number];
}
