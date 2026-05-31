"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadProgress, loadSessions, computeStreak, getDueCards } from "@/lib/progress";
import { getLessonSummaries } from "@/lib/content";
import type { HSKLevel, CardProgress } from "@/lib/types";

const LEVELS: HSKLevel[] = [1, 2, 3, 4];

export default function Dashboard() {
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setProgress(loadProgress());
    setStreak(computeStreak(loadSessions()));
  }, []);

  const levelStats = LEVELS.map((lvl) => {
    const summaries = getLessonSummaries(lvl);
    const authored = summaries.filter((s) => !s.stub).length;
    return { level: lvl, lessons: summaries.length, authored };
  });

  const totalAuthored = levelStats.reduce((a, s) => a + s.authored, 0);
  const totalReviewed = Object.keys(progress).length;
  const totalLearned = Object.values(progress).filter((p) => p.repetitions >= 3).length;
  const totalDue = (() => {
    const ids = Object.keys(progress);
    return getDueCards(ids, progress).length;
  })();

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Header */}
      <div className="text-center pt-2 pb-2">
        <h1 className="text-3xl sm:text-4xl mb-2" style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--accent-gold)" }}>
          你好
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          HSK Standard Course · {totalAuthored} lessons available
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/practice/flashcards">
          <StatCard value={totalDue} label="Due for Review" color="var(--accent-rose)" highlight={totalDue > 0} clickable />
        </Link>
        <StatCard value={totalLearned} label="Cards Learned" color="var(--accent-gold)" />
        <StatCard value={totalReviewed} label="Cards Seen" color="var(--wave)" />
        <StatCard value={streak} label="Day Streak" color="var(--wave)" />
      </div>

      {/* Due-now banner */}
      {totalDue > 0 && (
        <Link
          href="/practice/flashcards"
          className="flex items-center justify-between px-5 py-4 rounded-xl transition-all"
          style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}
        >
          <div>
            <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif" }}>
              {totalDue} card{totalDue !== 1 ? "s" : ""} ready for review
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Keep your streak going
            </div>
          </div>
          <span style={{ color: "var(--accent-rose)", fontSize: "1.25rem" }}>→</span>
        </Link>
      )}

      {/* Level grid */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            Course
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {levelStats.map((s) => (
            <Link key={s.level} href={`/course/${s.level}`}>
              <LevelCard level={s.level} authored={s.authored} total={s.lessons} />
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            Practice
          </span>
          <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/practice/flashcards" title="Flashcards" sub={totalDue > 0 ? `${totalDue} due` : "Spaced repetition"} />
          <QuickAction href="/practice/exam" title="Mock Exam" sub="HSK format" />
          <QuickAction href="/library/vocabulary" title="Vocabulary" sub="Browse all words" />
          <QuickAction href="/chat" title="AI Tutor" sub="Ask anything" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, color, clickable, highlight }: {
  value: number; label: string; color: string; clickable?: boolean; highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: highlight ? "rgba(196,133,122,0.06)" : "var(--bg-secondary)",
        border: highlight ? "1px solid rgba(196,133,122,0.4)" : "1px solid var(--border-subtle)",
        cursor: clickable ? "pointer" : "default",
      }}
    >
      <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function LevelCard({ level, authored, total }: { level: HSKLevel; authored: number; total: number }) {
  const pct = total > 0 ? Math.round((authored / total) * 100) : 0;
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif" }}>
          HSK {level}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--accent-gold)" }}>{authored}/{total}</span>
      </div>
      <div className="progress-ink mb-2">
        <div className="progress-ink-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {authored === 0 ? "Coming soon" : `${total} lessons`}
      </div>
    </div>
  );
}

function QuickAction({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-4 transition-all"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="font-semibold text-sm mb-1" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </Link>
  );
}
