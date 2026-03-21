"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { vocabulary, hsk1Words, hsk2Words, hsk3Words, hsk4Words, hsk5Words, hsk6Words } from "@/data/vocabulary";
import { loadProgress, loadSessions, getStats } from "@/lib/progress";

const LEVEL_WORDS = [hsk1Words, hsk2Words, hsk3Words, hsk4Words, hsk5Words, hsk6Words];
const LEVEL_NAMES = ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"];

type LevelStats = { total: number; seen: number; learned: number; due: number; unseen: number };
const emptyStats = (): LevelStats => ({ total: 0, seen: 0, learned: 0, due: 0, unseen: 0 });

export default function Dashboard() {
  const [levelStats, setLevelStats] = useState<LevelStats[]>(Array.from({ length: 6 }, emptyStats));
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const progress = loadProgress();
    setLevelStats(LEVEL_WORDS.map((words) => getStats(words.map((w) => w.id), progress)));

    const sessions = loadSessions();
    if (sessions.length === 0) { setStreak(0); return; }
    const dates = sessions.map((s) => s.date);
    let count = 0;
    const current = new Date();
    for (let i = 0; i < 365; i++) {
      if (dates.includes(current.toDateString())) {
        count++;
        current.setDate(current.getDate() - 1);
      } else break;
    }
    setStreak(count);
  }, []);

  const totalLearned = levelStats.reduce((a, s) => a + s.learned, 0);
  const totalWords = vocabulary.length;
  const totalDue = levelStats.reduce((a, s) => a + s.due, 0);
  const totalSeen = levelStats.reduce((a, s) => a + s.seen, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="text-center pt-2 pb-4">
        <h1
          className="text-3xl sm:text-4xl mb-2"
          style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)" }}
        >
          你好
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          Welcome to your Chinese learning dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/progress?tab=learned">
          <StatCard value={totalLearned} label="Words Learned" color="var(--accent-gold)" clickable />
        </Link>
        <Link href="/flashcards">
          <StatCard value={totalDue} label="Due for Review" color="var(--accent-rose)" clickable highlight={totalDue > 0} />
        </Link>
        <Link href="/progress">
          <StatCard value={totalSeen} label="Words Seen" color="var(--floral-blue-light, #6070B0)" clickable />
        </Link>
        <StatCard value={streak} label="Day Streak" color="var(--accent-crane-white)" />
      </div>

      {/* Due-now banner */}
      {totalDue > 0 && (
        <Link
          href="/flashcards"
          className="flex items-center justify-between px-5 py-4 rounded-xl transition-all group"
          style={{
            background: "rgba(196,133,122,0.08)",
            border: "1px solid rgba(196,133,122,0.4)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(196,133,122,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(196,133,122,0.4)")}
        >
          <div>
            <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>
              {totalDue} card{totalDue !== 1 ? "s" : ""} ready for review
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Keep your streak going — review now
            </div>
          </div>
          <span style={{ color: "var(--accent-rose)", fontSize: "1.25rem" }}>→</span>
        </Link>
      )}

      {/* HSK level grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {levelStats.map((stats, i) => (
          <LevelCard key={i} name={LEVEL_NAMES[i]} stats={stats} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction href="/flashcards" title="Flashcards" sub={totalDue > 0 ? `${totalDue} due` : "Study cards"} />
        <QuickAction href="/vocabulary" title="Vocabulary" sub={`${totalWords} words`} />
        <QuickAction href="/progress" title="Progress" sub={`${totalLearned} learned`} />
        <QuickAction href="/chat" title="AI Tutor" sub="Ask anything" />
      </div>

      {/* Overall progress */}
      <div
        className="rounded-xl p-5"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif", letterSpacing: "0.06em" }}>
            Overall Progress
          </span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {totalLearned} / {totalWords}
          </span>
        </div>
        <div className="progress-ink">
          <div
            className="progress-ink-fill"
            style={{ width: `${totalWords > 0 ? (totalLearned / totalWords) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          {totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0}% of HSK 1–6 vocabulary mastered
        </p>
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
      onMouseEnter={(e) => clickable && (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")}
      onMouseLeave={(e) => clickable && (e.currentTarget.style.borderColor = highlight ? "rgba(196,133,122,0.4)" : "var(--border-subtle)")}
    >
      <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color, fontFamily: "Cinzel, serif" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function LevelCard({ name, stats }: {
  name: string;
  stats: { total: number; seen: number; learned: number; due: number };
}) {
  const pct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>
          {name}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--accent-gold)" }}>{pct}%</span>
      </div>
      <div className="progress-ink mb-3">
        <div className="progress-ink-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--accent-gold)" }}>{stats.learned}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>learned</div>
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--accent-rose)" }}>{stats.due}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>due</div>
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{stats.total}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>total</div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-4 transition-all group"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
        e.currentTarget.style.boxShadow = "0 0 14px rgba(201,168,76,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="font-semibold text-sm mb-1" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </Link>
  );
}
