"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getLessonSummaries } from "@/lib/content";
import type { HSKLevel } from "@/lib/types";

const LEVELS: HSKLevel[] = [1, 2, 3, 4];

// ─── Types matching /api/dashboard ───────────────────────────────────────────

interface TypeStats {
  due_now: number;
  new_total: number;
  learning: number;
  review: number;
  mature: number;
  total: number;
  reviewed_today: number;
}
interface CoverageBlock { mature: number; studied: number; total: number; pct: number; }
interface WeakestWord {
  word_id: number;
  simplified: string;
  pinyin: string;
  hsk2_level: number | null;
  lapses: number;
  card_type: string;
}
interface DashboardData {
  recognition: TypeStats;
  listening: TypeStats;
  streak: number;
  reviews_today: number;
  coverage: { hsk1: CoverageBlock; hsk2: CoverageBlock };
  weakest: WeakestWord[];
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    setFetching(true);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setData(json))
      .finally(() => setFetching(false));
  }, [user, loading]);

  const levelStats = LEVELS.map((lvl) => {
    const summaries = getLessonSummaries(lvl);
    const authored = summaries.filter((s) => !s.stub).length;
    return { level: lvl, lessons: summaries.length, authored };
  });
  const totalAuthored = levelStats.reduce((a, s) => a + s.authored, 0);
  const totalDue = (data?.recognition.due_now ?? 0) + (data?.listening.due_now ?? 0);

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

      {/* Signed-in stats. Signed-out: sign-in nudge. */}
      {user && data && (
        <SignedInStats data={data} fetching={fetching} totalDue={totalDue} />
      )}
      {user && !data && fetching && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Loading stats…</div>
      )}
      {!user && !loading && (
        <SignInPrompt />
      )}

      {/* Level grid */}
      <Section title="Course">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {levelStats.map((s) => (
            <Link key={s.level} href={`/course/${s.level}`}>
              <LevelCard level={s.level} authored={s.authored} total={s.lessons} />
            </Link>
          ))}
        </div>
      </Section>

      {/* Quick actions */}
      <Section title="Practice">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/review" title="Review" sub={totalDue > 0 ? `${totalDue} due` : "FSRS-scheduled"} highlight={totalDue > 0} />
          <QuickAction href="/reader" title="Reader" sub="Tap-to-read texts" />
          <QuickAction href="/vocab" title="Dictionary" sub="Browse all words" />
          <QuickAction href="/chat" title="Tutor" sub="Ask anything" />
        </div>
      </Section>
    </div>
  );
}

// ─── Signed-in widgets ───────────────────────────────────────────────────────

function SignedInStats({ data, fetching, totalDue }: { data: DashboardData; fetching: boolean; totalDue: number }) {
  return (
    <div className="space-y-6">
      {/* Top stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/review">
          <StatCard value={totalDue} label="Due Now" color="var(--accent-rose)" highlight={totalDue > 0} clickable />
        </Link>
        <StatCard value={data.reviews_today} label="Reviewed Today" color="var(--accent-gold)" />
        <StatCard value={data.recognition.mature + data.listening.mature} label="Mature Cards" color="var(--wave)" />
        <StatCard value={data.streak} label={`Day Streak${data.streak >= 7 ? " ✦" : ""}`} color="var(--wave)" />
      </div>

      {/* Due-now banner */}
      {totalDue > 0 && (
        <Link
          href="/review"
          className="flex items-center justify-between px-5 py-4 rounded-xl transition-all"
          style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}
        >
          <div>
            <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif" }}>
              {totalDue} card{totalDue !== 1 ? "s" : ""} ready for review
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {data.recognition.due_now} recognition · {data.listening.due_now} listening
            </div>
          </div>
          <span style={{ color: "var(--accent-rose)", fontSize: "1.25rem" }}>→</span>
        </Link>
      )}

      {/* Per-type breakdown */}
      <Section title="By Card Type">
        <div className="grid sm:grid-cols-2 gap-3">
          <TypeBreakdownCard label="Recognition" stats={data.recognition} href="/review?type=recognition" />
          <TypeBreakdownCard label="Listening"   stats={data.listening}   href="/review?type=listening" />
        </div>
      </Section>

      {/* Coverage */}
      <Section title="Mastery">
        <div className="grid sm:grid-cols-2 gap-3">
          <CoverageCard level={1} block={data.coverage.hsk1} />
          <CoverageCard level={2} block={data.coverage.hsk2} />
        </div>
      </Section>

      {/* Weakest words */}
      {data.weakest.length > 0 && (
        <Section title="Words to Watch">
          <div
            className="rounded-xl divide-y"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderColor: "var(--border-subtle)" }}
          >
            {data.weakest.map((w) => (
              <Link
                key={`${w.word_id}-${w.card_type}`}
                href={`/vocab/${encodeURIComponent(w.simplified)}`}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-display text-lg" style={{ color: "var(--text-primary)" }}>{w.simplified}</span>
                  <span className="font-pinyin text-sm truncate" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{w.pinyin}</span>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="badge-gold" style={{ background: "transparent", borderColor: "var(--accent-rose)", color: "var(--accent-rose)" }}>
                    {w.lapses}× lapsed
                  </span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
                    {w.card_type === "listening" ? "听" : "识"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {fetching && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Refreshing…</div>
      )}
    </div>
  );
}

function SignInPrompt() {
  return (
    <Link
      href="/auth"
      className="block rounded-xl px-5 py-4 transition-all"
      style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.4)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
            Sign in to track progress
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Streaks, FSRS scheduling, and coverage stats sync across devices.
          </div>
        </div>
        <span style={{ color: "var(--accent-gold)", fontSize: "1.25rem" }}>→</span>
      </div>
    </Link>
  );
}

// ─── Small components ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {title}
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
      </div>
      {children}
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

function TypeBreakdownCard({ label, stats, href }: { label: string; stats: TypeStats; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-sm" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stats.total} total</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <Mini value={stats.due_now}   label="Due"      color="var(--accent-rose)" />
        <Mini value={stats.new_total} label="New"      color="var(--wave)" />
        <Mini value={stats.learning}  label="Learning" color="var(--accent-gold)" />
        <Mini value={stats.mature}    label="Mature"   color="var(--ink)" />
      </div>
    </Link>
  );
}

function Mini({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div>
      <div className="text-lg font-bold" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function CoverageCard({ level, block }: { level: number; block: CoverageBlock }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif" }}>
          HSK {level}
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--accent-gold)" }}>{block.pct}%</span>
      </div>
      <div className="progress-ink mb-2">
        <div className="progress-ink-fill" style={{ width: `${block.pct}%` }} />
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {block.mature} mature · {block.studied} studied · {block.total} total
      </div>
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

function QuickAction({ href, title, sub, highlight }: { href: string; title: string; sub: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className="block rounded-xl p-4 transition-all"
      style={{
        background: highlight ? "rgba(196,133,122,0.06)" : "var(--bg-secondary)",
        border: highlight ? "1px solid rgba(196,133,122,0.4)" : "1px solid var(--border-subtle)",
      }}
    >
      <div className="font-semibold text-sm mb-1" style={{ color: highlight ? "var(--accent-rose)" : "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
        {title}
      </div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </Link>
  );
}
