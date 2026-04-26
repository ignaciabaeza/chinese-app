"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { vocabulary, hsk1Words, hsk2Words, hsk3Words, hsk4Words, hsk5Words, hsk6Words } from "@/data/vocabulary";
import { loadProgress, loadSessions, getStats } from "@/lib/progress";
import { BlossomBranch, InkMountains, SectionTitle } from "@/components/Decor";

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
      {/* Hero greeting */}
      <div className="relative pt-2 pb-4">
        <div className="absolute top-0 right-0 opacity-60 pointer-events-none">
          <BlossomBranch width={160} height={110} variant="tr" />
        </div>
        <h1
          className="mb-2"
          style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, fontSize: "3.5rem", color: "var(--ink-dark)", lineHeight: 1, letterSpacing: 2 }}
        >
          你好
        </h1>
        <p style={{ fontFamily: "Lora, serif", fontSize: 13, color: "var(--ink-medium)", fontStyle: "italic" }}>
          Welcome to your Chinese learning dashboard
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/progress?tab=learned">
          <StatCard value={totalLearned} label="Words Learned" valueColor="var(--blush-deep)" clickable />
        </Link>
        <Link href="/flashcards">
          <StatCard value={totalDue} label="Due for Review" valueColor="var(--blush-deep)" clickable highlight={totalDue > 0} />
        </Link>
        <Link href="/progress">
          <StatCard value={totalSeen} label="Words Seen" clickable />
        </Link>
        <StatCard value={streak} label="Day Streak" valueColor="var(--antique-gold)" />
      </div>

      {/* Due-now banner */}
      {totalDue > 0 && (
        <Link
          href="/flashcards"
          className="flex items-center gap-3 px-4 py-3.5 transition-all"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--blush-pink)",
            borderRadius: 2,
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blush-deep)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--blush-pink)")}
        >
          {/* 复 avatar */}
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "var(--blush-light)",
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 18, color: "var(--blush-deep)",
            }}
          >
            复
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "var(--ink-dark)" }}>
              {totalDue} card{totalDue !== 1 ? "s" : ""} ready for review
            </div>
            <div style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-medium)", fontStyle: "italic" }}>
              Keep your streak going
            </div>
          </div>
          <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em", color: "var(--blush-deep)", textTransform: "uppercase" }}>
            Start →
          </span>
        </Link>
      )}

      {/* HSK level grid */}
      <div>
        <SectionTitle cn="汉语水平" en="HSK Levels" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {levelStats.map((stats, i) => (
            <LevelCard key={i} name={LEVEL_NAMES[i]} stats={stats} />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <SectionTitle cn="快捷" en="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/flashcards", cn: "卡片", label: "Flashcards", sub: totalDue > 0 ? `${totalDue} due` : "Practice with SRS" },
            { href: "/vocabulary", cn: "词库", label: "Vocabulary", sub: `${totalWords} words` },
            { href: "/progress", cn: "进步", label: "Progress", sub: `${totalLearned} learned` },
            { href: "/chat", cn: "老师", label: "AI Tutor", sub: "Ask anything" },
          ].map((a) => (
            <QuickAction key={a.href} href={a.href} cn={a.cn} title={a.label} sub={a.sub} />
          ))}
        </div>
      </div>

      {/* Overall progress */}
      <div
        className="p-5"
        style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2 }}
      >
        <div className="flex justify-between items-baseline mb-2">
          <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase" }}>
            Overall Mastery
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--antique-gold)", fontWeight: 500 }}>
            {totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0}%
          </span>
        </div>
        <div className="progress-ink">
          <div
            className="progress-ink-fill"
            style={{ width: `${totalWords > 0 ? (totalLearned / totalWords) * 100 : 0}%`, background: "var(--antique-gold)" }}
          />
        </div>
        <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "var(--ink-medium)", marginTop: 6 }}>
          {totalLearned} of {totalWords.toLocaleString()} HSK 1–6 words mastered
        </p>
      </div>

      {/* Ink mountains footer decoration */}
      <div className="relative h-12 pointer-events-none overflow-hidden -mx-4">
        <InkMountains width={800} height={48} opacity={0.35} style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", minWidth: 400 }} />
      </div>
    </div>
  );
}

function StatCard({ value, label, valueColor, clickable, highlight }: {
  value: number; label: string; valueColor?: string; clickable?: boolean; highlight?: boolean;
}) {
  return (
    <div
      className="p-4 transition-all"
      style={{
        background: highlight ? "rgba(212,136,138,0.08)" : "var(--bg-secondary)",
        border: `1px solid ${highlight ? "var(--blush-pink)" : "var(--border-ink)"}`,
        borderRadius: 2,
        cursor: clickable ? "pointer" : "default",
      }}
      onMouseEnter={(e) => clickable && (e.currentTarget.style.borderColor = highlight ? "var(--blush-deep)" : "rgba(44,36,22,0.3)")}
      onMouseLeave={(e) => clickable && (e.currentTarget.style.borderColor = highlight ? "var(--blush-pink)" : "var(--border-ink)")}
    >
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: valueColor || "var(--ink-dark)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function LevelCard({ name, stats }: { name: string; stats: { total: number; seen: number; learned: number; due: number } }) {
  const pct = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
  return (
    <div
      className="p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "var(--ink-dark)", fontWeight: 500 }}>{name}</span>
        <span style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-faint)" }}>{pct}%</span>
      </div>
      <div className="progress-ink mb-2">
        <div className="progress-ink-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2" style={{ fontFamily: "Lora, serif", fontSize: 10, color: "var(--ink-medium)" }}>
        <span>{stats.learned} learned</span>
        <span>·</span>
        <span>{stats.due} due</span>
      </div>
    </div>
  );
}

function QuickAction({ href, cn, title, sub }: { href: string; cn: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="block p-4 transition-all"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2, textDecoration: "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(44,36,22,0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(44,36,22,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-ink)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 18, color: "var(--blush-deep)", marginBottom: 4, fontWeight: 500 }}>{cn}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: "var(--ink-dark)", fontWeight: 500 }}>{title}</div>
      <div style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-medium)", marginTop: 2, fontStyle: "italic" }}>{sub}</div>
    </Link>
  );
}
