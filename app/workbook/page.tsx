"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Level = "all" | 1 | 2;

interface SetSummary {
  lesson_id: number;
  book: string;
  number: number;
  title_hanzi: string;
  title_english: string | null;
  item_count: number;
  type_counts: Record<string, number>;
  last_attempted: string | null;
  recent_attempts: number;
  recent_correct: number;
}

const TYPE_LABELS: Record<string, string> = {
  cloze: "Cloze",
  reorder: "Reorder",
  matching: "Matching",
  listening_choice: "Listening",
  pinyin_tone: "Tones",
  translate: "Translate",
  dictation: "Dictation",
};

export default function WorkbookLanding() {
  const [sets, setSets] = useState<SetSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("all");

  useEffect(() => {
    fetch("/api/workbook/sets", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<{ sets: SetSummary[] }>;
      })
      .then((d) => setSets(d.sets))
      .catch((err) => setError(String(err)));
  }, []);

  const filtered = useMemo(() => {
    if (!sets) return null;
    if (level === "all") return sets;
    return sets.filter((s) => s.book === `hsk${level}`);
  }, [sets, level]);

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl text-[var(--accent-gold)] mb-2">Workbook</h1>
      <p className="text-[var(--text-muted)] mb-6">
        Cloze, reorder, matching, listening, tone, and translation drills generated from the lesson vocabulary you&rsquo;ve already studied.
      </p>

      <LevelTabs level={level} setLevel={setLevel} />

      {error && (
        <div className="parchment-panel p-4 my-6 text-[var(--accent-rose)]">
          Could not load sets: {error}
        </div>
      )}

      {sets === null && !error && (
        <div className="text-[var(--text-muted)] my-12 text-center">Loading…</div>
      )}

      {filtered !== null && filtered.length === 0 && (
        <div className="parchment-panel p-6 my-6 text-[var(--bg-primary)]">
          <p className="font-semibold mb-2">No exercises yet for this level.</p>
          <p className="text-sm">Run <code className="font-mono">npm run db:generate-exercises</code> to create them from your lesson vocabulary.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered?.map((s) => (
          <SetCard key={s.lesson_id} s={s} />
        ))}
      </div>
    </div>
  );
}

function LevelTabs({ level, setLevel }: { level: Level; setLevel: (l: Level) => void }) {
  const opts: { value: Level; label: string }[] = [
    { value: "all", label: "All" },
    { value: 1, label: "HSK 1" },
    { value: 2, label: "HSK 2" },
  ];
  return (
    <div className="flex gap-2 mb-4">
      {opts.map((o) => (
        <button
          key={o.label}
          onClick={() => setLevel(o.value)}
          className={`px-4 py-2 rounded font-heading text-sm transition ${
            level === o.value
              ? "bg-[var(--accent-gold)] text-[var(--bg-primary)]"
              : "bg-[var(--bg-secondary)]/80 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SetCard({ s }: { s: SetSummary }) {
  const accuracy =
    s.recent_attempts > 0 ? Math.round((s.recent_correct / s.recent_attempts) * 100) : null;
  const typeBadges = Object.entries(s.type_counts).filter(([, n]) => n > 0);
  return (
    <Link
      href={`/workbook/${s.book}/${s.number}`}
      className="parchment-panel p-4 block transition hover:scale-[1.02] hover:shadow-lg"
    >
      <div className="flex justify-between items-baseline mb-1">
        <span className="badge-gold text-xs">{s.book.toUpperCase()} L{s.number}</span>
        {accuracy !== null && (
          <span className="text-xs text-[var(--bg-primary)]/70">
            {accuracy}% · {s.recent_attempts} attempts
          </span>
        )}
      </div>
      <div className="chinese-md text-[var(--bg-primary)] mb-1">{s.title_hanzi}</div>
      {s.title_english && (
        <div className="text-sm text-[var(--bg-primary)]/70 mb-3">{s.title_english}</div>
      )}
      <div className="flex flex-wrap gap-1 text-xs">
        {typeBadges.map(([t, n]) => (
          <span key={t} className="px-2 py-0.5 rounded bg-[var(--bg-primary)]/10 text-[var(--bg-primary)]/80">
            {TYPE_LABELS[t] ?? t} · {n}
          </span>
        ))}
      </div>
      <div className="mt-3 text-sm font-heading text-[var(--accent-gold)]">Start →</div>
    </Link>
  );
}
