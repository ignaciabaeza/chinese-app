import Link from "next/link";
import { notFound } from "next/navigation";
import { getLessonSummaries } from "@/lib/content";
import type { HSKLevel } from "@/lib/types";

export default async function LevelPage({ params }: { params: Promise<{ level: string }> }) {
  const { level: levelParam } = await params;
  const levelNum = Number(levelParam);
  if (![1, 2, 3, 4, 5, 6].includes(levelNum)) notFound();
  const level = levelNum as HSKLevel;
  const summaries = getLessonSummaries(level);

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <Link
          href="/course"
          className="text-xs"
          style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
        >
          ← All levels
        </Link>
        <h1 className="text-2xl sm:text-3xl mt-2 mb-1" style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}>
          HSK {level}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          {summaries.length} lessons
        </p>
      </div>

      {summaries.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <p style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
            HSK {level} content is coming soon.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {summaries.map((s) => (
            <li key={s.id}>
              <Link
                href={`/course/${level}/lesson/${s.number}`}
                className="block rounded-xl p-4 transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  opacity: s.stub ? 0.75 : 1,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: s.stub ? "rgba(160,152,128,0.12)" : "rgba(201,168,76,0.12)",
                      border: `1px solid ${s.stub ? "var(--border-subtle)" : "rgba(201,168,76,0.5)"}`,
                    }}
                  >
                    <span className="text-lg font-bold" style={{ color: s.stub ? "var(--text-muted)" : "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>
                      {s.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
                        {s.title.hanzi}
                      </span>
                      <span className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                        {s.title.pinyin}
                      </span>
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
                      {s.title.english}
                    </div>
                    <div className="text-xs mt-1 flex gap-3" style={{ color: "var(--text-muted)" }}>
                      {s.theme && <span>{s.theme}</span>}
                      <span>· {s.wordCount} words</span>
                      {s.grammarCount > 0 && <span>· {s.grammarCount} grammar</span>}
                    </div>
                  </div>
                  {s.stub ? (
                    <span className="text-xs shrink-0" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
                      outline
                    </span>
                  ) : (
                    <span style={{ color: "var(--accent-gold)" }}>→</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
