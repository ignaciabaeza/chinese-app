import Link from "next/link";
import { listAllGrammar } from "@/lib/grammar";

export default function GrammarPage() {
  const points = listAllGrammar();
  const byLevel = new Map<number, typeof points>();
  for (const p of points) {
    const arr = byLevel.get(p.level) ?? [];
    arr.push(p);
    byLevel.set(p.level, arr);
  }
  const levels = Array.from(byLevel.keys()).sort();

  return (
    <div className="space-y-7 animate-fade-up">
      <div>
        <h1 className="text-2xl mb-1" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Grammar
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {points.length} grammar points from the HSK Standard Course
        </p>
      </div>

      {levels.length === 0 && (
        <div className="rounded-xl p-5" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
            No grammar points authored yet. Add the <code>notes</code> array to lesson JSON files to populate this page.
          </p>
        </div>
      )}

      {levels.map((level) => {
        const pts = byLevel.get(level) ?? [];
        // Group by lesson
        const byLesson = new Map<number, { title: string; pts: typeof pts }>();
        for (const p of pts) {
          const slot = byLesson.get(p.lessonNumber) ?? { title: p.lessonTitle, pts: [] };
          slot.pts.push(p);
          byLesson.set(p.lessonNumber, slot);
        }
        const lessons = Array.from(byLesson.keys()).sort((a, b) => a - b);
        return (
          <section key={level} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
                HSK {level}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pts.length} points</span>
            </div>

            {lessons.map((lessonNumber) => {
              const slot = byLesson.get(lessonNumber)!;
              return (
                <div key={lessonNumber}>
                  <div className="text-xs mb-2" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
                    Lesson {lessonNumber} · <span className="font-display" style={{ color: "var(--text-primary)" }}>{slot.title}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {slot.pts.map((p) => (
                      <Link
                        key={p.gpId}
                        href={`/grammar/${encodeURIComponent(p.gpId)}`}
                        className="block rounded-xl p-4 transition-all"
                        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                      >
                        <div className="font-display text-lg mb-0.5" style={{ color: "var(--text-primary)" }}>
                          {p.title.hanzi}
                        </div>
                        <div className="text-xs mb-2" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
                          {p.title.english}
                        </div>
                        {p.pattern && (
                          <div className="text-xs font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                            {p.pattern}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
