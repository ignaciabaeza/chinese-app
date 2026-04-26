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

  useEffect(() => { setProgress(loadProgress()); }, []);

  const filtered = useMemo(() => {
    return vocabulary.filter((w) => {
      if (levelFilter !== 0 && w.level !== levelFilter) return false;
      if (category !== "all" && w.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.chinese.includes(q) || w.pinyin.toLowerCase().includes(q) || w.english.toLowerCase().includes(q);
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

  const statusColor: Record<string, string> = {
    unseen: "rgba(154,144,128,0.4)",
    seen: "var(--mountain-blue)",
    learned: "var(--blush-pink)",
  };

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, fontSize: 32, color: "var(--ink-dark)", letterSpacing: 1, lineHeight: 1 }}>词库</div>
          <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-faint)", textTransform: "uppercase", marginTop: 4 }}>Vocabulary</div>
        </div>
        <div className="flex gap-3 text-xs" style={{ fontFamily: "Lora, serif", color: "var(--ink-medium)" }}>
          {[
            { k: "unseen", label: "Unseen" },
            { k: "seen", label: "Seen" },
            { k: "learned", label: "Learned" },
          ].map(({ k, label }) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: statusColor[k] }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hanzi, pinyin, or meaning…"
          className="w-full text-sm outline-none transition-all"
          style={{
            background: "transparent", border: "none",
            borderBottom: "1px solid var(--border-ink)",
            color: "var(--ink-dark)", fontFamily: "Lora, serif",
            padding: "8px 0",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--blush-deep)")}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--border-ink)")}
        />

        <div className="flex gap-1.5 flex-wrap">
          {([0, 1, 2, 3, 4, 5, 6] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              style={{
                padding: "5px 12px", fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: levelFilter === l ? "var(--blush-pink)" : "transparent",
                color: levelFilter === l ? "var(--bg-primary)" : "var(--ink-medium)",
                border: `1px solid ${levelFilter === l ? "var(--blush-pink)" : "var(--border-ink)"}`,
                borderRadius: 2, cursor: "pointer",
              }}
            >
              {l === 0 ? "All" : `HSK ${l}`}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "4px 10px", fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: "0.06em",
                textTransform: "capitalize",
                background: category === cat ? "rgba(212,136,138,0.1)" : "transparent",
                color: category === cat ? "var(--blush-deep)" : "var(--ink-faint)",
                border: `1px solid ${category === cat ? "var(--blush-pink)" : "var(--border-ink)"}`,
                borderRadius: 2, cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-medium)", textTransform: "uppercase" }}>
        {filtered.length} words
      </p>

      {/* Word grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {filtered.map((word) => {
          const status = getStatus(word.id);
          return (
            <button
              key={word.id}
              onClick={() => setSelected(word)}
              className="p-3 text-left transition-all"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-ink)", borderRadius: 2 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(184,104,112,0.4)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(44,36,22,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-ink)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div className="flex items-start justify-between mb-1">
                <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, fontWeight: 600, color: "var(--ink-dark)", lineHeight: 1 }}>
                  {word.chinese}
                </span>
                <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: statusColor[status] }} />
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "var(--blush-deep)" }}>
                {word.pinyin}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ fontFamily: "Lora, serif", color: "var(--ink-faint)" }}>
                {word.english}
              </div>
              <div className="mt-1.5">
                <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", border: "1px solid rgba(176,144,80,0.4)", padding: "1px 5px", textTransform: "uppercase" }}>
                  HSK {word.level}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4 sm:p-6"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm overflow-y-auto"
            style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-ink)", borderRadius: "8px 8px 0 0", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: 36, height: 3, background: "rgba(44,36,22,0.3)", borderRadius: 2 }} />
            </div>

            <div className="p-6 pt-3 text-center space-y-2">
              <div className="flex justify-center mb-2">
                <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", border: "1px solid rgba(176,144,80,0.5)", padding: "2px 8px", textTransform: "uppercase" }}>
                  HSK {selected.level} · {selected.category}
                </span>
              </div>

              <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 64, fontWeight: 500, color: "var(--ink-dark)", lineHeight: 1 }}>
                {selected.chinese}
              </div>

              {selected.traditional && selected.traditional !== selected.chinese && (
                <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 11, color: "var(--ink-faint)" }}>繁體 {selected.traditional}</div>
              )}

              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 20, color: "var(--blush-deep)" }}>
                {selected.pinyin}
              </div>

              <div style={{ fontFamily: "Lora, serif", fontSize: 16, color: "var(--ink-dark)" }}>
                {selected.english}
              </div>

              {/* Example sentence */}
              {(selected as any).example && (
                <div className="mt-3 text-left" style={{ background: "rgba(212,136,138,0.06)", padding: "10px 12px", borderLeft: "2px solid var(--blush-pink)", borderRadius: "0 2px 2px 0" }}>
                  <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: "var(--ink-dark)", lineHeight: 1.4 }}>{(selected as any).example.chinese}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 11, color: "var(--blush-deep)", marginTop: 3 }}>{(selected as any).example.pinyin}</div>
                  <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 12, color: "var(--ink-medium)", marginTop: 3 }}>{(selected as any).example.english}</div>
                </div>
              )}

              {progress[selected.id] && (
                <div className="grid grid-cols-3 gap-2 pt-3 mt-2" style={{ borderTop: "1px solid var(--border-ink)" }}>
                  {[
                    { v: progress[selected.id].repetitions, l: "Reviews" },
                    { v: progress[selected.id].correct, l: "Correct", c: "var(--antique-gold)" },
                    { v: progress[selected.id].incorrect, l: "Missed", c: "var(--blush-deep)" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: s.c || "var(--ink-dark)", fontWeight: 500 }}>{s.v}</div>
                      <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--ink-medium)", textTransform: "uppercase", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="mt-4 btn-primary"
                style={{ letterSpacing: "0.12em" }}
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
