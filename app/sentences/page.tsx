"use client";

import { useState, useEffect, useCallback } from "react";

interface Sentence {
  id: string;
  level: number;
  chinese: string;
  pinyin: string;
  english: string;
  grammar: string;
  pattern: string;
}

export default function SentencesPage() {
  const [levelFilter, setLevelFilter] = useState<"all" | number>("all");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchSentences = useCallback(async (level: "all" | number) => {
    setLoading(true);
    try {
      const url = level === "all" ? "/api/sentences" : `/api/sentences?level=${level}`;
      const res = await fetch(url);
      const data = await res.json();
      setSentences(data.sentences ?? []);
    } catch {
      setSentences([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSentences(levelFilter); }, [levelFilter, fetchSentences]);

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div>
        <div style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, fontSize: 32, color: "var(--ink-dark)", letterSpacing: 1, lineHeight: 1 }}>例句</div>
        <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: 2, color: "var(--ink-faint)", textTransform: "uppercase", marginTop: 4 }}>Sentences · Tap to reveal</div>
      </div>

      {/* Level filters */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", 1, 2, 3, 4, 5, 6] as const).map((l) => (
          <button
            key={String(l)}
            onClick={() => { setLevelFilter(l); setOpenId(null); }}
            style={{
              padding: "5px 12px",
              fontFamily: "'Cormorant SC', serif", fontSize: 10, letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: levelFilter === l ? "var(--blush-pink)" : "transparent",
              color: levelFilter === l ? "var(--bg-primary)" : "var(--ink-medium)",
              border: `1px solid ${levelFilter === l ? "var(--blush-pink)" : "var(--border-ink)"}`,
              borderRadius: 2, cursor: "pointer",
            }}
          >
            {l === "all" ? "All" : `HSK ${l}`}
          </button>
        ))}
      </div>

      {/* Sentence list */}
      {loading ? (
        <div className="text-center py-12" style={{ fontFamily: "Lora, serif", fontStyle: "italic", color: "var(--ink-faint)" }}>
          Loading…
        </div>
      ) : sentences.length === 0 ? (
        <div className="text-center py-12">
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 32, color: "var(--ink-faint)" }}>无</div>
          <p style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 13, color: "var(--ink-faint)", marginTop: 8 }}>
            No sentences available for this level yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sentences.map((s) => {
            const open = openId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setOpenId(open ? null : s.id)}
                className="cursor-pointer transition-all"
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${open ? "rgba(184,104,112,0.4)" : "var(--border-ink)"}`,
                  borderRadius: 2,
                  padding: 16,
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", border: "1px solid rgba(176,144,80,0.45)", padding: "2px 6px", textTransform: "uppercase", flexShrink: 0 }}>
                    HSK {s.level}
                  </span>
                  {/* Audio icon */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "transparent", border: "1px solid rgba(44,36,22,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 20 20">
                      <path d="M8 4L4 7H2v6h2l4 3V4z" fill="var(--ink-dark)" />
                      <path d="M12 7c1 1 1 5 0 6" stroke="var(--ink-dark)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                    </svg>
                  </div>
                </div>

                {/* Chinese sentence */}
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "var(--ink-dark)", lineHeight: 1.5, fontWeight: 500 }}>
                  {s.chinese}
                </div>

                {/* Revealed content */}
                {open ? (
                  <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--border-ink)" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "var(--blush-deep)" }}>
                      {s.pinyin}
                    </div>
                    <div style={{ fontFamily: "Lora, serif", fontSize: 14, color: "var(--ink-dark)" }}>
                      {s.english}
                    </div>
                    {s.grammar && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(176,144,80,0.07)", borderLeft: "2px solid var(--antique-gold)", borderRadius: "0 2px 2px 0" }}>
                        <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 9, letterSpacing: "0.1em", color: "var(--antique-gold)", textTransform: "uppercase", marginBottom: 3 }}>Grammar</div>
                        <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "var(--ink-medium)" }}>{s.grammar}</div>
                        {s.pattern && (
                          <div style={{ fontFamily: "'Cormorant SC', serif", fontSize: 10, color: "var(--ink-faint)", marginTop: 4, letterSpacing: "0.05em" }}>
                            Pattern: {s.pattern}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily: "Lora, serif", fontStyle: "italic", fontSize: 11, color: "var(--ink-faint)", marginTop: 8 }}>
                    tap to reveal translation
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
