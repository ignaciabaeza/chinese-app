"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getAllWords, getLessonSummaries } from "@/lib/content";
import type { HSKLevel } from "@/lib/types";

const LEVELS: HSKLevel[] = [1, 2, 3, 4];

export default function VocabularyPage() {
  const [level, setLevel] = useState<HSKLevel | "all">(1);
  const [lessonNum, setLessonNum] = useState<number | "all">("all");
  const [query, setQuery] = useState("");

  const allWords = useMemo(() => {
    const levels = level === "all" ? LEVELS : [level];
    const out = levels.flatMap((lvl) => getAllWords(lvl).map((w) => ({ ...w, level: lvl })));
    return out;
  }, [level]);

  const filtered = useMemo(() => {
    let list = allWords;
    if (lessonNum !== "all") list = list.filter((w) => w.lessonNumber === lessonNum);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (w) => w.hanzi.includes(q) || w.pinyin.toLowerCase().includes(q) || w.english.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allWords, lessonNum, query]);

  const lessonOptions = level !== "all"
    ? getLessonSummaries(level).filter((s) => !s.stub).map((s) => s.number)
    : [];

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-1" style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}>
          Vocabulary
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>
          {filtered.length} of {allWords.length} words
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search hanzi, pinyin, or English…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontFamily: "Lora, serif",
            outline: "none",
          }}
        />

        <div className="flex gap-2 flex-wrap">
          {(["all", 1, 2, 3, 4] as const).map((lvl) => (
            <button
              key={String(lvl)}
              onClick={() => { setLevel(lvl as HSKLevel | "all"); setLessonNum("all"); }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                fontFamily: "Cinzel, serif",
                background: level === lvl ? "var(--accent-gold)" : "rgba(201,168,76,0.06)",
                color: level === lvl ? "var(--bg-primary)" : "var(--text-muted)",
                border: level === lvl ? "1.5px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
              }}
            >
              {lvl === "all" ? "All Levels" : `HSK ${lvl}`}
            </button>
          ))}
        </div>

        {lessonOptions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setLessonNum("all")}
              className="px-3 py-1 rounded-md text-xs"
              style={{
                fontFamily: "Cinzel, serif",
                background: lessonNum === "all" ? "rgba(201,168,76,0.15)" : "transparent",
                color: lessonNum === "all" ? "var(--accent-gold)" : "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              All
            </button>
            {lessonOptions.map((n) => (
              <button
                key={n}
                onClick={() => setLessonNum(n)}
                className="w-8 h-7 rounded-md text-xs font-bold"
                style={{
                  fontFamily: "Cinzel, serif",
                  background: lessonNum === n ? "rgba(201,168,76,0.15)" : "transparent",
                  color: lessonNum === n ? "var(--accent-gold)" : "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <p style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}>No words match.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="rounded-xl p-3 flex items-baseline gap-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="font-display text-2xl shrink-0" style={{ color: "var(--text-primary)", minWidth: "3rem" }}>
                {w.hanzi}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-pinyin text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    {w.pinyin}
                  </span>
                  <span className="text-xs" style={{ color: "var(--accent-gold)", opacity: 0.7, fontFamily: "Cinzel, serif" }}>
                    {w.pos}
                  </span>
                </div>
                <div className="text-sm mt-0.5" style={{ color: "var(--text-primary)", fontFamily: "Lora, serif" }}>
                  {w.english}
                </div>
              </div>
              <Link
                href={`/course/${w.level}/lesson/${w.lessonNumber}`}
                className="text-xs shrink-0"
                style={{ color: "var(--accent-gold)", fontFamily: "Cinzel, serif" }}
              >
                L{w.lessonNumber}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
