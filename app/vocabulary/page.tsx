"use client";

import { useState, useMemo, useEffect } from "react";
import { vocabulary, Word } from "@/data/vocabulary";
import { loadProgress, CardProgress } from "@/lib/progress";

const categories = ["all", ...Array.from(new Set(vocabulary.map((w) => w.category ?? "other"))).sort()];

export default function VocabularyPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const [category, setCategory] = useState("all");
  const [progress, setProgress] = useState<Record<string, CardProgress>>({});
  const [selected, setSelected] = useState<Word | null>(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const filtered = useMemo(() => {
    return vocabulary.filter((w) => {
      if (levelFilter !== 0 && w.level !== levelFilter) return false;
      if (category !== "all" && w.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          w.chinese.includes(q) ||
          w.pinyin.toLowerCase().includes(q) ||
          w.english.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, levelFilter, category]);

  function getStatus(wordId: string) {
    const p = progress[wordId];
    if (!p) return "unseen";
    if (p.repetitions >= 3) return "learned";
    return "seen";
  }

  const statusDot: Record<string, string> = {
    unseen: "rgba(160,152,128,0.4)",
    seen: "#6070B0",
    learned: "var(--accent-gold)",
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif", fontSize: "1.5rem", letterSpacing: "0.08em" }}>
          Vocabulary
        </h1>
        <div className="flex gap-4 text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusDot.unseen }} />Unseen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusDot.seen }} />Seen
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusDot.learned }} />Learned
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search characters, pinyin, or English…"
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

        {/* Level filters */}
        <div className="flex gap-2 flex-wrap">
          {([0, 1, 2, 3, 4, 5, 6] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className="px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.05em",
                background: levelFilter === l ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                color: levelFilter === l ? "var(--bg-primary)" : "var(--text-muted)",
                border: levelFilter === l ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
              }}
            >
              {l === 0 ? "All" : `HSK ${l}`}
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1 rounded-lg text-xs capitalize transition-all"
              style={{
                background: category === cat ? "rgba(201,168,76,0.12)" : "transparent",
                color: category === cat ? "var(--accent-gold)" : "var(--text-muted)",
                border: category === cat ? "1px solid var(--accent-gold)" : "1px solid rgba(160,152,128,0.25)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}>
        {filtered.length} words
      </p>

      {/* Word grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {filtered.map((word) => {
          const status = getStatus(word.id);
          return (
            <button
              key={word.id}
              onClick={() => setSelected(word)}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(201,168,76,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <span
                  className="text-lg font-bold"
                  style={{ color: "var(--accent-crane-white)", fontFamily: "Noto Serif SC, serif" }}
                >
                  {word.chinese}
                </span>
                <span
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ background: statusDot[status] }}
                />
              </div>
              <div className="text-xs font-pinyin" style={{ color: "var(--accent-gold)", fontStyle: "italic" }}>
                {word.pinyin}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {word.english}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(160,152,128,0.5)", fontFamily: "Cinzel, serif" }}>
                HSK {word.level}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-3xl p-7 w-full max-w-sm"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="badge-gold mb-3" style={{ display: "inline-block" }}>
                HSK {selected.level} · {selected.category}
              </div>
              <div
                className="font-bold mb-2"
                style={{ fontSize: "4.5rem", lineHeight: 1, color: "var(--text-parchment)", fontFamily: "Noto Serif SC, serif" }}
              >
                {selected.chinese}
              </div>
              {selected.traditional && selected.traditional !== selected.chinese && (
                <div className="text-sm mb-1" style={{ color: "#7A6855" }}>
                  繁體 {selected.traditional}
                </div>
              )}
              <div
                className="text-xl mb-2 font-pinyin"
                style={{ color: "#5A3F20", fontStyle: "italic" }}
              >
                {selected.pinyin}
              </div>
              <div className="text-lg" style={{ color: "var(--text-parchment)", fontFamily: "Lora, serif" }}>
                {selected.english}
              </div>

              {progress[selected.id] && (
                <div
                  className="mt-4 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-sm"
                  style={{ background: "var(--bg-parchment-dark)" }}
                >
                  <div>
                    <div className="font-bold" style={{ color: "var(--text-parchment)", fontFamily: "Cinzel, serif" }}>
                      {progress[selected.id].repetitions}
                    </div>
                    <div className="text-xs" style={{ color: "#7A6855" }}>Reviews</div>
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "#5A7A3A", fontFamily: "Cinzel, serif" }}>
                      {progress[selected.id].correct}
                    </div>
                    <div className="text-xs" style={{ color: "#7A6855" }}>Correct</div>
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: "#8B3A2A", fontFamily: "Cinzel, serif" }}>
                      {progress[selected.id].incorrect}
                    </div>
                    <div className="text-xs" style={{ color: "#7A6855" }}>Missed</div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="mt-5 w-full py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--accent-gold)",
                  color: "#5A3F20",
                  fontFamily: "Cinzel, serif",
                  letterSpacing: "0.06em",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-gold)";
                  e.currentTarget.style.color = "var(--bg-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#5A3F20";
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
