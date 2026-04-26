"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { vocabulary, Word } from "@/data/vocabulary";
import { loadProgress, loadProgressFromServer, loadSessions, loadSessionsFromServer, CardProgress, StudySession } from "@/lib/progress";
import { useAuth } from "@/components/AuthProvider";
import { SectionTitle } from "@/components/Decor";

const LEVELS = [1, 2, 3, 4, 5, 6] as const;

export default function ProgressPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tab, setTab] = useState<"overview" | "learned" | "history">("overview");

  useEffect(() => {
    if (user) {
      loadProgressFromServer().then(setProgress);
      loadSessionsFromServer().then((s) => setSessions([...s].reverse()));
    } else {
      setProgress(loadProgress());
      setSessions(loadSessions().slice().reverse());
    }
  }, [user]);

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
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, fontSize: 32, color: "var(--ink-dark)", letterSpacing: 1, lineHeight: 1 }}>进步</div>
          <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-faint)", textTransform: "uppercase", marginTop: 4 }}>My Progress</div>
        </div>
        {due.length > 0 && (
          <button
            onClick={() => window.location.href = "/flashcards"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em",
              color: "var(--antique-gold)", textTransform: "uppercase",
              borderBottom: "1px solid var(--antique-gold)", padding: "4px 0",
            }}
          >
            Review {due.length} due →
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile value={learned.length} label="Learned" accent="var(--blush-deep)" />
        <StatTile value={seen.length} label="In Progress" accent="var(--mountain-blue)" />
        <StatTile value={due.length} label="Due Now" accent="var(--blush-deep)" />
        <StatTile value={`${overallAccuracy}%`} label="Accuracy" accent="var(--antique-gold)" />
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border-ink)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-xs transition-all -mb-px border-b-2"
            style={{
              fontFamily: "'Cormorant SC', serif",
              letterSpacing: "0.06em",
              background: "none", border: "none", cursor: "pointer",
              color: tab === t.id ? "var(--antique-gold)" : "var(--ink-faint)",
              borderBottom: `2px solid ${tab === t.id ? "var(--antique-gold)" : "transparent"}`,
              fontWeight: tab === t.id ? 600 : 500,
              textTransform: "uppercase",
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
      className="p-4"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2 }}
    >
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase", marginTop: 6 }}>{label}</div>
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
          className="p-4"
          style={{ background: "rgba(212,136,138,0.06)", border: "1px solid var(--blush-pink)", borderRadius: 2 }}
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em", color: "var(--blush-deep)", textTransform: "uppercase" }}>
                Due Now · {due.length}
              </div>
              <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--ink-medium)", marginTop: 2 }}>
                {due.length} cards need your attention
              </div>
            </div>
            <Link
              href="/flashcards"
              style={{
                fontFamily: "'Cormorant SC', serif", fontSize: 11, letterSpacing: "0.1em",
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--antique-gold)", textTransform: "uppercase",
                borderBottom: "1px solid var(--antique-gold)", padding: "4px 0",
                textDecoration: "none",
              }}
            >
              Start →
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {due.slice(0, 12).map((w) => (
              <span
                key={w.id}
                style={{
                  fontFamily: "'Noto Serif SC', serif", fontSize: 18, color: "var(--ink-dark)", fontWeight: 500,
                  padding: "4px 10px", background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2,
                }}
              >
                {w.chinese}
              </span>
            ))}
            {due.length > 12 && (
              <span style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--ink-faint)", padding: "4px 6px" }}>
                +{due.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {due.length === 0 && seen.length > 0 && (
        <div className="p-5 text-center" style={{ background: "rgba(212,136,138,0.05)", border: "1px solid rgba(212,136,138,0.25)", borderRadius: 2 }}>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 24, color: "var(--antique-gold)", marginBottom: 6 }}>✦</div>
          <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 12, letterSpacing: "0.05em", color: "var(--ink-dark)" }}>All caught up!</div>
          <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--ink-medium)", marginTop: 4, fontStyle: "italic" }}>No cards due right now. Check back later.</div>
        </div>
      )}

      {/* Level progress */}
      <div>
        <SectionTitle cn="水平" en="Level Progress" />
        <div style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2 }}>
          {LEVELS.map((lvl, i) => {
            const lvlLearned = learned.filter((w) => w.level === lvl).length;
            const lvlTotal = vocabulary.filter((w) => w.level === lvl).length;
            return (
              <div
                key={lvl}
                style={{
                  padding: "10px 16px",
                  borderBottom: i < 5 ? "1px solid var(--border-ink)" : "none",
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "var(--ink-dark)", fontWeight: 500 }}>HSK {lvl}</span>
                  <span style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-faint)" }}>{lvlLearned} / {lvlTotal}</span>
                </div>
                <div className="progress-ink">
                  <div className="progress-ink-fill" style={{ width: `${lvlTotal > 0 ? (lvlLearned / lvlTotal) * 100 : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming reviews */}
      {upcoming.length > 0 && (
        <div>
          <SectionTitle cn="下次复习" en="Coming Up Next" />
          <div style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2 }}>
            {upcoming.map((w, i) => {
              const p = progress[w.id];
              const msUntil = (p?.nextReview ?? 0) - Date.now();
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{ borderBottom: i < upcoming.length - 1 ? "1px solid var(--border-ink)" : "none" }}
                >
                  <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, color: "var(--ink-dark)", fontWeight: 500, minWidth: 40 }}>
                    {w.chinese}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "var(--blush-deep)" }}>{w.pinyin}</div>
                    <div className="truncate" style={{ fontFamily: "Lora, serif", fontSize: 11, color: "var(--ink-faint)" }}>{w.english}</div>
                  </div>
                  <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, color: "var(--ink-medium)", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
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
        <div>
          <SectionTitle cn="最近" en="Recent Sessions" />
          <div style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: 2 }}>
            {sessions.slice(0, 5).map((s, i) => {
              const acc = s.cardsStudied > 0 ? Math.round((s.correct / s.cardsStudied) * 100) : 0;
              const barColor = acc >= 80 ? "var(--antique-gold)" : acc >= 50 ? "#c9a960" : "var(--blush-pink)";
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < 4 ? "1px solid var(--border-ink)" : "none" }}
                >
                  <div style={{ width: 3, height: 30, background: barColor, borderRadius: 2, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "Lora, serif", fontSize: 12, color: "var(--ink-dark)" }}>{s.date}</div>
                    <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.08em", color: "var(--ink-faint)", textTransform: "uppercase" }}>
                      HSK {s.level} · {s.cardsStudied} cards
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: barColor, fontWeight: 500 }}>{acc}%</div>
                    <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, color: "var(--ink-faint)" }}>{s.correct}✓ {s.incorrect}✗</div>
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
              fontFamily: "'Cormorant SC', serif",
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
        className="w-full px-4 py-3 text-sm outline-none transition-all"
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1.5px solid var(--border-ink)",
          color: "var(--ink-dark)",
          fontFamily: "Lora, serif",
          borderRadius: 0,
        }}
        onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--blush-deep)")}
        onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--border-ink)")}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'Cormorant SC', serif" }}>{filtered.length} words</p>
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
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(184,104,112,0.35)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-ink)")}
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
                <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'Cormorant SC', serif" }}>
                  {p?.repetitions ?? 0} reviews
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{
                    color: isDue ? "var(--accent-rose)" : "rgba(160,152,128,0.6)",
                    fontFamily: "'Cormorant SC', serif",
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
            <div className="text-2xl font-bold" style={{ color: "var(--accent-gold)", fontFamily: "'Cormorant SC', serif" }}>{v}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sessions.map((s, i) => {
          const acc = s.cardsStudied > 0 ? Math.round((s.correct / s.cardsStudied) * 100) : 0;
          const isOpen = expandedIndex === i;
          const sessionWords = s.wordIds
            ? vocabulary.filter((w) => s.wordIds!.includes(w.id))
            : [];

          return (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: "var(--bg-secondary)", border: `1px solid ${isOpen ? "rgba(184,104,112,0.4)" : "var(--border-subtle)"}`, transition: "border-color 0.2s" }}
            >
              {/* Session row — clickable */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                onClick={() => setExpandedIndex(isOpen ? null : i)}
              >
                <div
                  className="w-1.5 rounded-full shrink-0"
                  style={{
                    height: "2.5rem",
                    background: acc >= 80 ? "var(--accent-gold)" : acc >= 50 ? "#B09050" : "var(--accent-rose)",
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.date}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    HSK {s.level} · {s.cardsStudied} cards
                    {sessionWords.length > 0 && (
                      <span style={{ color: "rgba(184,104,112,0.5)" }}> · tap to see vocabulary</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-sm font-bold"
                    style={{
                      color: acc >= 80 ? "var(--accent-gold)" : acc >= 50 ? "#B09050" : "var(--accent-rose)",
                      fontFamily: "'Cormorant SC', serif",
                    }}
                  >
                    {acc}%
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {s.correct}✓ {s.incorrect}✗
                  </div>
                </div>
                {sessionWords.length > 0 && (
                  <span
                    className="text-xs shrink-0 ml-1 transition-transform"
                    style={{
                      color: "var(--text-muted)",
                      display: "inline-block",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▾
                  </span>
                )}
              </button>

              {/* Expanded vocabulary grid */}
              {isOpen && sessionWords.length > 0 && (
                <div className="px-4 pb-4 pt-1">
                  <div
                    className="h-px mb-4"
                    style={{ background: "var(--border-subtle)" }}
                  />
                  <p
                    className="text-xs mb-3 tracking-widest uppercase"
                    style={{ color: "var(--text-muted)", fontFamily: "'Cormorant SC', serif" }}
                  >
                    Session Vocabulary · {sessionWords.length} cards
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sessionWords.map((word) => (
                      <div
                        key={word.id}
                        className="rounded-xl p-3 flex flex-col"
                        style={{
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span
                            className="text-2xl font-bold leading-none"
                            style={{ color: "var(--accent-crane-white)", fontFamily: "Noto Serif SC, serif" }}
                          >
                            {word.chinese}
                          </span>
                          <span
                            className="text-xs shrink-0 mt-0.5"
                            style={{ color: "var(--accent-gold)", fontFamily: "'Cormorant SC', serif", opacity: 0.7 }}
                          >
                            {word.level}
                          </span>
                        </div>
                        <span
                          className="text-xs mb-1 font-pinyin"
                          style={{ color: "var(--text-muted)", fontStyle: "italic" }}
                        >
                          {word.pinyin}
                        </span>
                        <span
                          className="text-xs leading-snug"
                          style={{ color: "var(--text-primary)", opacity: 0.85, fontFamily: "Lora, serif" }}
                        >
                          {word.english}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
