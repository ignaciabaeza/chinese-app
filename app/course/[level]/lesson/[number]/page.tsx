import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson } from "@/lib/content";
import type {
  HSKLevel, Lesson, Bilingual, WarmUp, Text, GrammarPoint,
  Exercise, PinyinDrill, CharacterSection, ClassroomExpression,
} from "@/lib/types";

export default async function LessonPage({ params }: { params: Promise<{ level: string; number: string }> }) {
  const { level: levelParam, number: numberParam } = await params;
  const levelNum = Number(levelParam);
  const lessonNum = Number(numberParam);
  if (![1, 2, 3, 4, 5, 6].includes(levelNum)) notFound();
  const level = levelNum as HSKLevel;
  const lesson = getLesson(level, lessonNum);
  if (!lesson) notFound();

  return (
    <div className="space-y-8 animate-fade-up">
      <LessonHeader level={level} lesson={lesson} />
      {lesson.stub ? (
        <StubNotice level={level} lesson={lesson} />
      ) : (
        <>
          {lesson.warmUp && <WarmUpSection warmUp={lesson.warmUp} />}
          {lesson.texts && lesson.texts.length > 0 && <TextsSection texts={lesson.texts} />}
          {lesson.notes && lesson.notes.length > 0 && <NotesSection notes={lesson.notes} />}
          {lesson.exercises && lesson.exercises.length > 0 && <ExercisesSection exercises={lesson.exercises} />}
          {lesson.pinyinSection && lesson.pinyinSection.drills.length > 0 && (
            <PinyinSection drills={lesson.pinyinSection.drills} />
          )}
          {lesson.classroomExpressions && lesson.classroomExpressions.length > 0 && (
            <ClassroomExpressionsSection items={lesson.classroomExpressions} />
          )}
          {lesson.characters && <CharactersSection chars={lesson.characters} />}
          {lesson.culture && <CultureSection title={lesson.culture.title} body={lesson.culture.body} />}
        </>
      )}
      <PracticeCTA level={level} number={lesson.number} stub={lesson.stub ?? false} />
    </div>
  );
}

// ─── Header & navigation ─────────────────────────────────────────────────────

function LessonHeader({ level, lesson }: { level: HSKLevel; lesson: Lesson }) {
  return (
    <div>
      <Link href={`/course/${level}`} className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        ← HSK {level}
      </Link>
      <div className="flex items-baseline gap-3 mt-3">
        <span
          className="text-3xl font-bold"
          style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}
        >
          {lesson.number}
        </span>
        <h1 className="font-display text-3xl sm:text-4xl" style={{ color: "var(--text-primary)" }}>
          {lesson.title.hanzi}
        </h1>
      </div>
      <div className="mt-1 font-pinyin text-lg" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
        {lesson.title.pinyin}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        {lesson.title.english}{lesson.theme ? ` · ${lesson.theme}` : ""}
      </div>
    </div>
  );
}

function StubNotice({ level, lesson }: { level: HSKLevel; lesson: Lesson }) {
  const wordHints = lesson.warmUp?.items ?? [];
  return (
    <div
      className="rounded-2xl p-6 space-y-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div>
        <span className="badge-gold">Outline</span>
        <p className="text-sm mt-3" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          The full content for HSK {level} Lesson {lesson.number} hasn&apos;t been authored yet. Below is the
          word list from the textbook&apos;s table of contents.
        </p>
      </div>
      {wordHints.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {wordHints.map((w, i) => (
            <span
              key={i}
              className="font-display text-lg px-3 py-1 rounded-md"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
            >
              {w.hanzi}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section: shared header ──────────────────────────────────────────────────

function SectionHeader({ chinese, english }: { chinese: string; english: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span
        className="font-display text-xl"
        style={{ color: "var(--accent-gold)" }}
      >
        {chinese}
      </span>
      <span
        className="text-sm tracking-widest uppercase"
        style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}
      >
        {english}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
    </div>
  );
}

function Bil({ b, hanziSize = "text-base", muted = false }: { b: Bilingual; hanziSize?: string; muted?: boolean }) {
  return (
    <div>
      <div className={`font-display ${hanziSize}`} style={{ color: muted ? "var(--text-muted)" : "var(--text-primary)" }}>
        {b.hanzi}
      </div>
      {b.pinyin && (
        <div className="text-sm font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          {b.pinyin}
        </div>
      )}
      <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        {b.english}
      </div>
    </div>
  );
}

// ─── Warm-up ─────────────────────────────────────────────────────────────────

function WarmUpSection({ warmUp }: { warmUp: WarmUp }) {
  return (
    <section>
      <SectionHeader chinese="热身" english="Warm-up" />
      <p className="text-sm mb-3" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        {warmUp.instruction.english}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {warmUp.items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg p-3 text-center"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="font-display text-xl mb-1" style={{ color: "var(--text-primary)" }}>
              {item.hanzi}
            </div>
            {item.pinyin && (
              <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                {item.pinyin}
              </div>
            )}
            {item.english && (
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {item.english}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Texts (dialogues + new words) ───────────────────────────────────────────

function TextsSection({ texts }: { texts: Text[] }) {
  return (
    <section>
      <SectionHeader chinese="课文" english="Text" />
      <div className="space-y-5">
        {texts.map((t) => <TextBlock key={t.situationNumber} text={t} />)}
      </div>
    </section>
  );
}

function TextBlock({ text }: { text: Text }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Situation title */}
      <div
        className="px-5 py-2.5 flex items-center justify-between"
        style={{ background: "rgba(201,168,76,0.08)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="font-bold text-sm"
            style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}
          >
            {text.situationNumber}
          </span>
          <span className="font-display" style={{ color: "var(--text-primary)" }}>
            {text.title.hanzi}
          </span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{text.title.english}</span>
        </div>
        {text.audioRef && (
          <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            ♪ {text.audioRef}
          </span>
        )}
      </div>

      {/* Dialogue */}
      <div className="px-5 py-4 space-y-3">
        {text.dialogue.map((line, i) => (
          <div key={i} className="flex gap-3">
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{
                background: line.speaker === "A" ? "rgba(201,168,76,0.18)" : "rgba(196,133,122,0.18)",
                color: line.speaker === "A" ? "var(--accent-gold)" : "var(--accent-rose)",
                fontFamily: "Cormorant Garamond, serif",
              }}
            >
              {line.speaker}
            </span>
            <div className="flex-1">
              <div className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
                {line.hanzi}
              </div>
              <div className="text-xs font-pinyin mt-0.5" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                {line.pinyin}
              </div>
              {line.english && (
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {line.english}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New words */}
      <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border-subtle)", background: "rgba(0,0,0,0.12)" }}>
        <div className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          New Words
        </div>
        <div className="space-y-1.5">
          {text.newWords.map((w) => (
            <div key={w.id} className="flex items-baseline gap-3 text-sm">
              <span className="font-display text-base shrink-0" style={{ color: "var(--text-primary)" }}>{w.hanzi}</span>
              <span className="font-pinyin shrink-0" style={{ color: "var(--text-muted)", fontStyle: "italic", minWidth: "5rem" }}>
                {w.pinyin}
              </span>
              <span className="text-xs shrink-0" style={{ color: "var(--accent-gold)", opacity: 0.7, fontFamily: "Cormorant Garamond, serif" }}>
                {w.pos}
              </span>
              <span style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{w.english}</span>
            </div>
          ))}
        </div>
        {text.properNouns && text.properNouns.length > 0 && (
          <>
            <div className="text-xs tracking-widest uppercase mt-3 mb-2" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
              Proper Nouns
            </div>
            <div className="space-y-1.5">
              {text.properNouns.map((p) => (
                <div key={p.id} className="flex items-baseline gap-3 text-sm">
                  <span className="font-display text-base shrink-0" style={{ color: "var(--text-primary)" }}>{p.hanzi}</span>
                  <span className="font-pinyin shrink-0" style={{ color: "var(--text-muted)", fontStyle: "italic", minWidth: "5rem" }}>
                    {p.pinyin}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{p.english}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Grammar notes ───────────────────────────────────────────────────────────

function NotesSection({ notes }: { notes: GrammarPoint[] }) {
  return (
    <section>
      <SectionHeader chinese="注释" english="Notes" />
      <div className="space-y-5">
        {notes.map((n) => <NoteBlock key={n.id} note={n} />)}
      </div>
    </section>
  );
}

function NoteBlock({ note }: { note: GrammarPoint }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
          style={{
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.5)",
            color: "var(--accent-gold)",
            fontFamily: "Cormorant Garamond, serif",
          }}
        >
          {note.number}
        </span>
        <div>
          <div className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            {note.title.hanzi}
          </div>
          <div className="text-sm" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
            {note.title.english}
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
        {note.explanation.english}
      </p>
      {note.examples && note.examples.length > 0 && (
        <div className="space-y-2 mb-3">
          {note.examples.map((ex, i) => (
            <div key={i} className="rounded-md px-3 py-2" style={{ background: "rgba(0,0,0,0.18)" }}>
              <div className="font-display" style={{ color: "var(--text-primary)" }}>{ex.hanzi}</div>
              <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{ex.pinyin}</div>
              {ex.english && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{ex.english}</div>}
            </div>
          ))}
        </div>
      )}
      {note.patternTable && <PatternTableView table={note.patternTable} />}
    </div>
  );
}

function PatternTableView({ table }: { table: { columns: string[]; rows: string[][] } }) {
  return (
    <div className="overflow-x-auto rounded-md mt-2" style={{ border: "1px solid var(--border-subtle)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "rgba(201,168,76,0.1)" }}>
            {table.columns.map((c, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs tracking-widest uppercase"
                style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", borderRight: i < table.columns.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: "1px solid var(--border-subtle)" }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 font-display"
                  style={{
                    color: "var(--text-primary)",
                    borderRight: ci < row.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Exercises ───────────────────────────────────────────────────────────────

function ExercisesSection({ exercises }: { exercises: Exercise[] }) {
  return (
    <section>
      <SectionHeader chinese="练习" english="Exercises" />
      <div className="space-y-4">
        {exercises.map((e) => (
          <div
            key={e.number}
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-baseline gap-3 mb-3">
              <span
                className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm font-bold"
                style={{
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: "var(--accent-gold)",
                  fontFamily: "Cormorant Garamond, serif",
                }}
              >
                {e.number}
              </span>
              <div>
                <div className="font-display text-base" style={{ color: "var(--text-primary)" }}>
                  {e.prompt.hanzi}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
                  {e.prompt.english}
                </div>
              </div>
            </div>
            {e.items && e.items.length > 0 && (
              <ol className="space-y-2 pl-2">
                {e.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>{i + 1}.</span>
                    <div>
                      {item.hanzi && (
                        <div className="font-display" style={{ color: "var(--text-primary)" }}>{item.hanzi}</div>
                      )}
                      {item.pinyin && (
                        <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{item.pinyin}</div>
                      )}
                      {item.english && (
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.english}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Pinyin drills ───────────────────────────────────────────────────────────

function PinyinSection({ drills }: { drills: PinyinDrill[] }) {
  return (
    <section>
      <SectionHeader chinese="拼音" english="Pinyin" />
      <div className="space-y-4">
        {drills.map((d) => <PinyinDrillBlock key={d.number} drill={d} />)}
      </div>
    </section>
  );
}

function PinyinDrillBlock({ drill }: { drill: PinyinDrill }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="mb-3">
        <div className="font-display" style={{ color: "var(--text-primary)" }}>{drill.title.hanzi}</div>
        <div className="text-sm" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>{drill.title.english}</div>
      </div>
      {drill.explanation && (
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {drill.explanation.english}
        </p>
      )}
      {drill.syllables && drill.syllables.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {drill.syllables.map((s, i) => (
            <span
              key={i}
              className="px-2.5 py-1.5 rounded-md text-center font-pinyin text-base"
              style={{ background: "rgba(0,0,0,0.18)", color: "var(--text-primary)", fontStyle: "italic" }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
      {drill.subRules && (
        <div className="space-y-3 mt-2">
          {drill.subRules.map((sr, i) => (
            <div key={i}>
              <div className="text-xs mb-2" style={{ color: "var(--accent-gold)", fontFamily: "Spectral, serif" }}>
                {sr.rule.english}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sr.examples.map((ex, j) => (
                  <div
                    key={j}
                    className="px-2.5 py-1.5 rounded-md"
                    style={{ background: "rgba(0,0,0,0.18)" }}
                  >
                    <div className="font-pinyin text-sm" style={{ color: "var(--text-primary)", fontStyle: "italic" }}>{ex.pinyin}</div>
                    {ex.english && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ex.english}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Characters ──────────────────────────────────────────────────────────────

function CharactersSection({ chars }: { chars: CharacterSection }) {
  return (
    <section>
      <SectionHeader chinese="汉字" english="Characters" />
      {chars.strokes && chars.strokes.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            Strokes
          </div>
          <div className="space-y-3">
            {chars.strokes.map((s, i) => (
              <div key={i} className="flex items-center gap-4 flex-wrap">
                <span className="font-display text-3xl shrink-0" style={{ color: "var(--accent-gold)", minWidth: "2.5rem" }}>
                  {s.shape}
                </span>
                <div className="shrink-0">
                  <div className="font-display" style={{ color: "var(--text-primary)" }}>{s.name.hanzi}</div>
                  <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{s.name.pinyin}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.name.english}</div>
                </div>
                <div className="flex gap-3 flex-wrap ml-auto">
                  {s.examples.map((ex, j) => (
                    <div key={j} className="text-center">
                      <div className="font-display text-2xl" style={{ color: "var(--text-primary)" }}>{ex.hanzi}</div>
                      <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{ex.pinyin}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {chars.singleComponentChars && chars.singleComponentChars.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            Single-Component Characters
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {chars.singleComponentChars.map((c) => (
              <div
                key={c.id}
                className="rounded-lg p-3 flex gap-3"
                style={{ background: "rgba(0,0,0,0.18)" }}
              >
                <div className="shrink-0 text-center">
                  <div className="font-display text-4xl" style={{ color: "var(--accent-gold)" }}>{c.hanzi}</div>
                  <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{c.pinyin}</div>
                </div>
                <div className="text-xs leading-snug" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
                  <div style={{ color: "var(--text-primary)", marginBottom: "0.25rem" }}>{c.meaning}</div>
                  {c.etymology}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Classroom expressions ──────────────────────────────────────────────────

function ClassroomExpressionsSection({ items }: { items: ClassroomExpression[] }) {
  return (
    <section>
      <SectionHeader chinese="课堂用语" english="Classroom Expressions" />
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="space-y-2.5">
          {items.map((e, i) => (
            <div key={i} className="flex items-baseline gap-3 text-sm flex-wrap">
              <span className="font-display text-base shrink-0" style={{ color: "var(--text-primary)", minWidth: "6rem" }}>
                {e.hanzi}
              </span>
              <span className="font-pinyin shrink-0" style={{ color: "var(--text-muted)", fontStyle: "italic", minWidth: "8rem" }}>
                {e.pinyin}
              </span>
              <span style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{e.english}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Culture ─────────────────────────────────────────────────────────────────

function CultureSection({ title, body }: { title: Bilingual; body: string }) {
  return (
    <section>
      <SectionHeader chinese="文化" english="Culture" />
      <div className="parchment-panel p-5">
        <div className="font-display text-lg mb-2" style={{ color: "var(--text-parchment)" }}>{title.hanzi}</div>
        <div className="text-sm mb-3" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>{title.english}</div>
        <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-parchment)", fontFamily: "Spectral, serif" }}>
          {body}
        </div>
      </div>
    </section>
  );
}

// ─── Practice CTA ────────────────────────────────────────────────────────────

function PracticeCTA({ level, number, stub }: { level: HSKLevel; number: number; stub: boolean }) {
  if (stub) return null;
  return (
    <div
      className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.4)" }}
    >
      <div>
        <div className="font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
          Ready to practice?
        </div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          Study this lesson&apos;s vocabulary with spaced-repetition flashcards.
        </div>
      </div>
      <Link
        href={`/practice/flashcards?scope=hsk${level}-lesson-${number}`}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: "transparent",
          border: "1.5px solid var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cormorant Garamond, serif",
          letterSpacing: "0.08em",
        }}
      >
        Start Flashcards →
      </Link>
    </div>
  );
}
