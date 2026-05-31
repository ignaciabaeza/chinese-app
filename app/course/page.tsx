import Link from "next/link";
import { getLessonSummaries } from "@/lib/content";
import type { HSKLevel } from "@/lib/types";

const LEVELS: { level: HSKLevel; words: number; hours: string }[] = [
  { level: 1, words: 150,  hours: "30–34" },
  { level: 2, words: 300,  hours: "30–36" },
  { level: 3, words: 600,  hours: "35–40" },
  { level: 4, words: 1200, hours: "75–80" },
];

export default function CoursePage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="text-center pt-2 pb-2">
        <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}>
          HSK Standard Course
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          标准教程 · Beijing Language and Culture University Press
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {LEVELS.map(({ level, words, hours }) => {
          const summaries = getLessonSummaries(level);
          const authored = summaries.filter((s) => !s.stub).length;
          return (
            <Link
              key={level}
              href={`/course/${level}`}
              className="block rounded-2xl p-5 transition-all"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-3xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
                  HSK {level}
                </span>
                <span className="badge-gold">{summaries.length} lessons</span>
              </div>
              <div className="text-xs space-y-1 mb-3" style={{ color: "var(--text-muted)" }}>
                <div>{words} words · {hours} class hours</div>
                <div>{authored > 0 ? `${authored} of ${summaries.length} authored` : "Outline only"}</div>
              </div>
              <div className="progress-ink">
                <div className="progress-ink-fill" style={{ width: `${(authored / summaries.length) * 100}%` }} />
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
        Lesson content is extracted from your HSK Standard Course textbooks.
        Lessons marked as outline-only are coming soon.
      </p>
    </div>
  );
}
