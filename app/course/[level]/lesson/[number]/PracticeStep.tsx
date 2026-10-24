"use client";

// "Practice" step of the lesson stepper: everything from the authored lesson
// JSON that isn't dialogue / vocab / grammar — exercises, pinyin drills,
// characters, the pair-work activity and the culture note. Any section the
// lesson doesn't have is skipped.

import { useState } from "react";
import HanziAnimation from "@/components/HanziAnimation";
import type { Lesson, Exercise } from "@/lib/types";

export type LessonExtras = Pick<Lesson, "exercises" | "pinyinSection" | "characters" | "application" | "culture">;

const INK = "var(--text-parchment)";
const SOFT = "#7A6855";

export default function PracticeStep({ extras }: { extras: LessonExtras | null }) {
  const [showPinyin, setShowPinyin] = useState(true);
  if (!extras) {
    return <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>No extra practice for this lesson yet.</p>;
  }
  const { exercises, pinyinSection, characters, application, culture } = extras;
  const hasChars = Boolean(characters?.strokes?.length || characters?.singleComponentChars?.length || characters?.radicals?.length);

  return (
    <div className="space-y-8">
      {exercises && exercises.length > 0 && (
        <Section title="Exercises" hanzi="练习"
          action={
            <button onClick={() => setShowPinyin((v) => !v)} className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
              {showPinyin ? "Hide pinyin" : "Show pinyin"}
            </button>
          }
        >
          {exercises.map((ex) => <ExerciseCard key={ex.number} ex={ex} showPinyin={showPinyin} />)}
        </Section>
      )}

      {pinyinSection && pinyinSection.drills.length > 0 && (
        <Section title="Pronunciation" hanzi="语音">
          {pinyinSection.drills.map((d) => (
            <Card key={d.number}>
              <CardTitle hanzi={d.title.hanzi} english={d.title.english} />
              {d.explanation && <p className="text-sm mb-2" style={{ color: SOFT, fontFamily: "Spectral, serif" }}>{d.explanation.english}</p>}
              {d.syllables && d.syllables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {d.syllables.map((s, i) => (
                    <span key={i} className="font-pinyin px-2 py-1 rounded-md text-sm" style={{ background: "var(--bg-secondary)", color: INK, fontStyle: "italic" }}>{s}</span>
                  ))}
                </div>
              )}
              {d.subRules?.map((r, i) => (
                <div key={i} className="mt-3">
                  <p className="text-sm" style={{ color: INK, fontFamily: "Spectral, serif" }}>{r.rule.english}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {r.examples.map((e, j) => (
                      <span key={j} className="text-xs" style={{ color: SOFT }}>
                        <span className="font-pinyin" style={{ fontStyle: "italic" }}>{e.pinyin}</span>{e.english ? ` (${e.english})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          ))}
        </Section>
      )}

      {hasChars && characters && (
        <Section title="Characters" hanzi="汉字">
          {characters.singleComponentChars && characters.singleComponentChars.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.singleComponentChars.map((c) => (
                <Card key={c.id}>
                  <div className="flex gap-3 items-start">
                    <HanziAnimation char={c.hanzi} size={88} />
                    <div className="min-w-0">
                      <div className="font-display text-2xl" style={{ color: INK }}>{c.hanzi}</div>
                      <div className="text-xs" style={{ color: SOFT }}>
                        <span className="font-pinyin" style={{ fontStyle: "italic" }}>{c.pinyin}</span> · {c.meaning}
                        {c.strokeCount ? ` · ${c.strokeCount} strokes` : ""}
                      </div>
                      {c.etymology && <p className="text-xs mt-1" style={{ color: SOFT, fontFamily: "Spectral, serif" }}>{c.etymology}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          {characters.strokes && characters.strokes.length > 0 && (
            <Card>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>Strokes</div>
              <div className="space-y-2">
                {characters.strokes.map((s, i) => (
                  <div key={i} className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-display text-2xl w-8 text-center" style={{ color: INK }}>{s.shape}</span>
                    <span className="text-sm" style={{ color: INK }}>{s.name.hanzi}</span>
                    <span className="text-xs" style={{ color: SOFT }}>
                      <span className="font-pinyin" style={{ fontStyle: "italic" }}>{s.name.pinyin}</span> · {s.name.english}
                    </span>
                    <span className="text-xs" style={{ color: SOFT }}>e.g. {s.examples.map((e) => e.hanzi).join(" ")}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {characters.radicals && characters.radicals.length > 0 && (
            <Card>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>Radicals</div>
              <div className="space-y-2">
                {characters.radicals.map((r, i) => (
                  <div key={i} className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-display text-2xl w-8 text-center" style={{ color: INK }}>{r.hanzi}</span>
                    <span className="text-xs" style={{ color: SOFT }}>
                      <span className="font-pinyin" style={{ fontStyle: "italic" }}>{r.pinyin}</span> · {r.english}
                    </span>
                    <span className="font-display text-sm" style={{ color: INK }}>{r.examples.join(" ")}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Section>
      )}

      {application && (
        <Section title="Use it" hanzi="运用">
          <Card>
            <p className="text-sm" style={{ color: INK, fontFamily: "Spectral, serif" }}>{application.prompt.english}</p>
            {application.activities && application.activities.length > 0 && (
              <ul className="mt-2 space-y-1 list-disc pl-5 text-sm" style={{ color: SOFT, fontFamily: "Spectral, serif" }}>
                {application.activities.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
          </Card>
        </Section>
      )}

      {culture && (
        <Section title="Culture" hanzi="文化">
          <Card>
            <CardTitle hanzi={culture.title.hanzi} english={culture.title.english} />
            <div className="space-y-2">
              {culture.body.split(/\n\s*\n/).map((para, i) => (
                <p key={i} className="text-sm whitespace-pre-line" style={{ color: SOFT, fontFamily: "Spectral, serif" }}>{para}</p>
              ))}
            </div>
          </Card>
        </Section>
      )}
    </div>
  );
}

// ─── Exercises ───────────────────────────────────────────────────────────────

/** Match items are written "question — answer" (one or two em dashes). */
function splitPair(s: string): [string, string | null] {
  const m = s.split(/\s*—{1,2}\s*/);
  return m.length >= 2 ? [m[0], m.slice(1).join(" — ")] : [s, null];
}

function ExerciseCard({ ex, showPinyin }: { ex: Exercise; showPinyin: boolean }) {
  const items = ex.items ?? [];
  return (
    <Card>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xs font-bold" style={{ color: "var(--accent-gold)" }}>{ex.number}.</span>
        <span className="text-sm" style={{ color: INK, fontFamily: "Spectral, serif" }}>{ex.prompt.english}</span>
      </div>
      {ex.type === "role_play" && items.length === 0 && (
        <p className="text-xs" style={{ color: SOFT, fontFamily: "Spectral, serif" }}>
          Use the Read step: take turns reading speaker A and B aloud, then swap.
        </p>
      )}
      {items.length > 0 && (
        <ol className="space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              {ex.type === "fill_blanks" ? <FillBlank item={it} showPinyin={showPinyin} />
                : ex.type === "match" ? <MatchPair item={it} showPinyin={showPinyin} />
                : <PlainItem item={it} showPinyin={showPinyin} />}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

type Item = NonNullable<Exercise["items"]>[number];

function PlainItem({ item, showPinyin }: { item: Item; showPinyin: boolean }) {
  return (
    <div className="flex flex-col">
      {item.hanzi && <span className="font-display" style={{ color: INK }}>{item.hanzi}</span>}
      {showPinyin && item.pinyin && <span className="text-xs font-pinyin" style={{ color: SOFT, fontStyle: "italic" }}>{item.pinyin}</span>}
      {item.english && <span className="text-xs" style={{ color: SOFT }}>{item.english}</span>}
    </div>
  );
}

function FillBlank({ item, showPinyin }: { item: Item; showPinyin: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const parts = (item.hanzi ?? "").split(/_{2,}/);
  return (
    <div className="flex flex-col">
      <span className="font-display" style={{ color: INK }}>
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 && (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                disabled={!item.blank}
                className="inline-block mx-1 px-2 rounded align-baseline"
                style={{
                  minWidth: "2.5em",
                  borderBottom: "1.5px solid var(--accent-gold)",
                  color: revealed ? "var(--accent-rose)" : "transparent",
                  cursor: item.blank ? "pointer" : "default",
                }}
                aria-label={revealed ? `Answer: ${item.blank}` : "Reveal answer"}
              >
                {item.blank ?? "＿"}
              </button>
            )}
          </span>
        ))}
      </span>
      {showPinyin && item.pinyin && <span className="text-xs font-pinyin" style={{ color: SOFT, fontStyle: "italic" }}>{item.pinyin}</span>}
      {item.english && <span className="text-xs" style={{ color: SOFT }}>{item.english}</span>}
    </div>
  );
}

function MatchPair({ item, showPinyin }: { item: Item; showPinyin: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [q, a] = splitPair(item.hanzi ?? "");
  const [qp, ap] = splitPair(item.pinyin ?? "");
  const [qe, ae] = splitPair(item.english ?? "");
  if (a === null) return <PlainItem item={item} showPinyin={showPinyin} />;
  return (
    <button type="button" onClick={() => setRevealed((v) => !v)} className="w-full text-left flex flex-col" style={{ cursor: "pointer" }}>
      <span className="font-display" style={{ color: INK }}>{q}</span>
      {showPinyin && item.pinyin && <span className="text-xs font-pinyin" style={{ color: SOFT, fontStyle: "italic" }}>{qp}</span>}
      {qe && <span className="text-xs" style={{ color: SOFT }}>{qe}</span>}
      {revealed ? (
        <span className="mt-1 pl-3" style={{ borderLeft: "2px solid var(--accent-gold)" }}>
          <span className="font-display block" style={{ color: "var(--accent-rose)" }}>{a}</span>
          {showPinyin && ap && <span className="text-xs font-pinyin block" style={{ color: SOFT, fontStyle: "italic" }}>{ap}</span>}
          {ae && <span className="text-xs block" style={{ color: SOFT }}>{ae}</span>}
        </span>
      ) : (
        <span className="text-xs mt-1" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>Think of a reply, then tap to check →</span>
      )}
    </button>
  );
}

// ─── Layout atoms ────────────────────────────────────────────────────────────

function Section({ title, hanzi, action, children }: { title: string; hanzi: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}>
          <span className="font-display mr-2" style={{ color: "var(--accent-gold)" }}>{hanzi}</span>{title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)" }}>
      {children}
    </div>
  );
}

function CardTitle({ hanzi, english }: { hanzi: string; english: string }) {
  return (
    <div className="mb-2">
      <div className="font-display text-lg" style={{ color: INK }}>{hanzi}</div>
      <div className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>{english}</div>
    </div>
  );
}
