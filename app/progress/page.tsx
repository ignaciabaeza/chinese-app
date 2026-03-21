"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { vocabulary, Word } from "@/data/vocabulary";
import { loadProgress, loadSessions, CardProgress, StudySession } from "@/lib/progress";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export default function ProgressPage() {
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tab, setTab] = useState<"overview" | "learned" | "history">("overview");

  useEffect(() => {
    setProgress(loadProgress());
    setSessions(loadSessions().slice().reverse());
  }, []);

  const learned = vocabulary.filter((w) => {
    const p = progress[w.id];
    return p && p.repetitions >= 3;
  });
  const seen = vocabulary.filter((w) => {
    const p = progress[w.id];
    return p && p.repetitions > 0 && p.repetitions < 3;
  });
  const due = vocabulary.filter((w) => {
    const p = progress[w.id];
    if (!p) return false;
    return p.nextReview <= Date.now();
  });

  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);
  const totalStudied = sessions.reduce((a, s) => a + s.cardsStudied, 0);
  const overallAccuracy = totalStudied > 0 ? Math.round((totalCorrect / totalStudied) * 100) : 0;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "learned", label: `Learned (${learned.length})` },
    { id: "history", label: `Sessions (${sessions.length})` },
  ] as const;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", fontSize: "1.5rem", letterSpacing: "0.08em" }}>
          My Progress
        </h1>
        {due.length > 0 && (
          <Link
            href="/flashcards"
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              background: "transparent",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-gold)";
              e.currentTarget.style.color = "var(--bg-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--accent-gold)";
            }}
          >
            Review {due.length} due →
          </Link>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile value={learned.length} label="Learned" accent="var(--accent-gold)" />
        <StatTile value={seen.length} label="In Progress" accent="#6070B0" />
        <StatTile value={due.length} label="Due Now" accent="var(--accent-rose)" />
        <StatTile value={`${overallAccuracy}%`} label="Accuracy" accent="var(--accent-crane-white)" />
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs transition-all -mb-px border-b-2"
            style={{
              fontFamily: "Cinzel, serif",
              letterSpacing: "0.06em",
              color: tab === t.id ? "var(--accent-gold)" : "var(--text-muted)",
              borderBottomColor: tab === t.id ? "var(--accent-gold)" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab learned={learned} seen={seen} due={due} progress={progress} sessions={sessions} />
      )}
      {tab === "learned" && <LearnedTab words={learned} progress={progress} />}
      {tab === "history" && <HistoryTab sessions={sessions} />}
    </div>
  );
}

function StatTile({ value, label, accent }: { value: number | string; label: string; accent: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="text-2xl font-bold mb-1" style={{ color: accent, fontFamily: "Cinzel, serif" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function OverviewTab({ learned, seen, due, progress, sessions }: {
  learned: Word[];
  seen: Word[];
  due: Word[];
  progress: Record<string, CardProgress>;
  sessions: StudySession[];
}) {
  const upcoming = vocabulary
    .filter((w) => {
      const p = progress[w.id];
      return p && p.nextReview > Date.now();
    })
    .sort((a, b) => (progress[a.id]?.nextReview ?? 0) - (progress[b.id]?.nextReview ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Due now */}
      {due.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(196,133,122,0.06)", border: "1px solid rgba(196,133,122,0.35)" }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>
                Ready for review
              </div>
              <div className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {due.length} cards need your attention
              </div>
            </div>
            <Link
              href="/flashcards"
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0"
              style={{
                fontFamily: "Cinzel, serif",
                background: "transparent",
                border: "1.5px solid var(--accent-gold)",
                color: "var(--accent-gold)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-gold)";
                e.currentTarget.style.color = "var(--bg-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--accent-gold)";
              }}
            >
              Start →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {due.slice(0, 12).map((w) => (
              <span
                key={w.id}
                className="text-sm px-2 py-1 rounded-lg"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontFamily: "Noto Serif SC, serif",
                }}
              >
                {w.chinese}
              </span>
            ))}
            {due.length > 12 && (
              <span className="text-sm px-2 py-1" style={{ color: "var(--text-muted)" }}>
                +{due.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {due.length === 0 && seen.length > 0 && (
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.3)" }}
        >
          <div className="text-2xl mb-2" style={{ color: "var(--accent-gold)" }}>✦</div>
          <div className="font-semibold" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>
            All caught up!
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            No cards due right now. Check back later.
          </div>
        </div>
      )}

      {/* Level progress */}
      <div className="space-y-3">
        <h2
          className="text-xs tracking-widest uppercase"
          style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
        >
          Level Progress
        </h2>
        {LEVELS.map((lvl) => {
          const lvlLearned = learned.filter((w) => w.level === lvl).length;
          const lvlTotal = vocabulary.filter((w) => w.level === lvl).length;
          return (
            <LevelBar key={lvl} label={`HSK ${lvl}`} learned={lvlLearned} total={lvlTotal} />
          );
        })}
      </div>

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Coming Up Next
          </h2>
          <div className="space-y-2">
            {upcoming.map((w) => {
              const p = progress[w.id];
              const msUntil = (p?.nextReview ?? 0) - Date.now();
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl px-4 py-2.5"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base font-bold shrink-0" style={{ color: "var(--text-primary)", fontFamily: "Noto Serif SC, serif" }}>
                      {w.chinese}
                    </span>
                    <span className="text-sm font-pinyin shrink-0" style={{ color: "var(--accent-gold)", fontStyle: "italic" }}>
                      {w.pinyin}
                    </span>
                    <span className="text-sm truncate" style={{ color: "var(--text-muted)" }}>{w.english}</span>
                  </div>
                  <span className="text-xs shrink-0 ml-2" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
                    {formatDuration(msUntil)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => {
              const acc = s.cardsStudied > 0 ? Math.round((s.correct / s.cardsStudied) * 100) : 0;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.date}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      HSK {s.level} · {s.cardsStudied} cards
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-sm font-bold"
                      style={{
                        color: acc >= 80 ? "var(--accent-gold)" : acc >= 50 ? "#E8C76A" : "var(--accent-rose)",
                        fontFamily: "Cinzel, serif",
                      }}
                    >
                      {acc}%
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {s.correct}✓ {s.incorrect}✗
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {seen.length === 0 && due.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4" style={{ color: "var(--accent-gold)" }}>◈</div>
          <p className="mb-4" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
            No progress yet. Start with some flashcards!
          </p>
          <Link
            href="/flashcards"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              fontFamily: "Cinzel, serif",
              background: "transparent",
              border: "1.5px solid var(--accent-gold)",
              color: "var(--accent-gold)",
            }}
          >
            Start Studying
          </Link>
        </div>
      )}
    </div>
  );
}

function LevelBar({ label, learned, total }: { label: string; learned: number; total: number }) {
  const pct = total > 0 ? (learned / total) * 100 : 0;
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm" style={{ color: "var(--text-primary)", fontFamily: "Cinzel, serif" }}>{label}</span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{learned} / {total}</span>
      </div>
      <div className="progress-ink">
        <div className="progress-ink-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LearnedTab({ words, progress }: { words: Word[]; progress: Record<string, CardProgress> }) {
  const [search, setSearch] = useState("");
  const filtered = words.filter(
    (w) =>
      !search ||
      w.chinese.includes(search) ||
      w.pinyin.toLowerCase().includes(search.toLowerCase()) ||
      w.english.toLowerCase().includes(search.toLowerCase()),
  );

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4" style={{ color: "var(--accent-gold)" }}>◉</div>
        <p style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          No words learned yet. Rate a card "Easy" 3+ times to mark it as learned.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter learned words…"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          fontFamily: "Lora, serif",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>{filtered.length} words</p>
      <div className="space-y-2">
        {filtered.map((w) => {
          const p = progress[w.id];
          const nextDue = p ? new Date(p.nextReview) : null;
          const isDue = p && p.nextReview <= Date.now();
          return (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition-all"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className="text-lg font-bold shrink-0 w-10"
                  style={{ color: "var(--text-primary)", fontFamily: "Noto Serif SC, serif" }}
                >
                  {w.chinese}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-pinyin" style={{ color: "var(--accent-gold)", fontStyle: "italic" }}>
                    {w.pinyin}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{w.english}</div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
                  {p?.repetitions ?? 0} reviews
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: isDue ? "var(--accent-rose)" : "rgba(160,152,128,0.6)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  {isDue ? "due now" : nextDue ? `in ${formatDuration(nextDue.getTime() - Date.now())}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryTab({ sessions }: { sessions: StudySession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4" style={{ color: "var(--accent-gold)" }}>◎</div>
        <p style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>No sessions recorded yet.</p>
      </div>
    );
  }

  const totalCards = sessions.reduce((a, s) => a + s.cardsStudied, 0);
  const totalCorrect = sessions.reduce((a, s) => a + s.correct, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { v: sessions.length, l: "Sessions" },
          { v: totalCards, l: "Cards Reviewed" },
          { v: `${totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0}%`, l: "Overall Accuracy" },
        ].map(({ v, l }) => (
          <div
            key={l}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}>{v}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sessions.map((s, i) => {
          const acc = s.cardsStudied > 0 ? Math.round((s.correct / s.cardsStudied) * 100) : 0;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div
                className="w-1.5 h-10 rounded-full shrink-0"
                style={{
                  background: acc >= 80 ? "var(--accent-gold)" : acc >= 50 ? "#E8C76A" : "var(--accent-rose)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.date}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  HSK {s.level} · {s.cardsStudied} cards
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-sm font-bold"
                  style={{
                    color: acc >= 80 ? "var(--accent-gold)" : acc >= 50 ? "#E8C76A" : "var(--accent-rose)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  {acc}%
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {s.correct}✓ {s.incorrect}✗
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 0) return "now";
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "soon";
}
