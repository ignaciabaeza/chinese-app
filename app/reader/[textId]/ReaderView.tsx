"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Segment = { t: string; w?: number; p?: true };

interface WordLookup {
  id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  hsk3_level: number | null;
  in_deck: boolean;
  state: "new" | "learning" | "review" | "mature" | "unknown";
}

interface Props {
  segments: Segment[];
  initialKnowledge: Record<number, string>;
  signedIn: boolean;
}

export default function ReaderView({ segments, initialKnowledge, signedIn }: Props) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [active, setActive] = useState<{ wordId: number; anchor: DOMRect } | null>(null);
  const [knowledge, setKnowledge] = useState(initialKnowledge);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() { setActive(null); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onWordClick = useCallback((e: React.MouseEvent<HTMLSpanElement>, wordId: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive({ wordId, anchor: rect });
  }, []);

  // Render: break into paragraphs on \n\n
  const paragraphs: Segment[][] = [];
  let current: Segment[] = [];
  for (const s of segments) {
    if (s.t === "\n\n" || (s.p && s.t.includes("\n\n"))) {
      if (current.length) paragraphs.push(current);
      current = [];
      continue;
    }
    current.push(s);
  }
  if (current.length) paragraphs.push(current);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        <label className="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showPinyin}
            onChange={(e) => setShowPinyin(e.target.checked)}
          />
          <span>Show pinyin</span>
        </label>
        {signedIn && (
          <>
            <Legend color="var(--accent-gold)" label="new" />
            <Legend color="var(--wave)" label="learning" />
            <Legend color="var(--text-muted)" label="mature" />
          </>
        )}
      </div>

      <div
        ref={containerRef}
        className="rounded-2xl p-5 sm:p-6 leading-relaxed"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          fontSize: "1.5rem",
          fontFamily: "Noto Serif SC, serif",
        }}
      >
        {paragraphs.map((para, i) => (
          <p key={i} className="mb-3 whitespace-pre-wrap" style={{ lineHeight: showPinyin ? 2.4 : 1.7 }}>
            {para.map((seg, j) => {
              if (seg.p) return <span key={j}>{seg.t}</span>;
              if (!seg.w) {
                return <span key={j} style={{ color: "var(--text-muted)" }}>{seg.t}</span>;
              }
              const k = knowledge[seg.w] ?? "unknown";
              return (
                <Word
                  key={j}
                  segment={seg}
                  state={k}
                  onClick={(e) => onWordClick(e, seg.w!)}
                />
              );
            })}
          </p>
        ))}
      </div>

      {active && (
        <WordPopover
          wordId={active.wordId}
          anchor={active.anchor}
          onClose={() => setActive(null)}
          onAdded={(state) =>
            setKnowledge((prev) => ({ ...prev, [active.wordId]: state }))
          }
        />
      )}
    </div>
  );
}

// ─── Word span ───────────────────────────────────────────────────────────────

function Word({
  segment, state, onClick,
}: {
  segment: Segment;
  state: string;
  onClick: (e: React.MouseEvent<HTMLSpanElement>) => void;
}) {
  const style: React.CSSProperties = { cursor: "pointer", transition: "background 0.1s" };
  switch (state) {
    case "new":
      style.textDecoration = "underline";
      style.textDecorationColor = "var(--accent-gold)";
      style.textDecorationStyle = "dotted";
      break;
    case "learning":
      style.color = "var(--wave-deep)";
      break;
    case "review":
      style.color = "var(--ink-soft)";
      break;
    case "mature":
      // no decoration
      break;
    case "unknown":
    default:
      // word user hasn't added — soft accent border under it
      style.borderBottom = "1px dashed var(--accent-rose)";
      break;
  }
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      style={style}
    >
      {segment.t}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span style={{ width: 10, height: 4, background: color, borderRadius: 2, display: "inline-block" }} />
      {label}
    </span>
  );
}

// ─── Popover ─────────────────────────────────────────────────────────────────

function WordPopover({
  wordId, anchor, onClose, onAdded,
}: {
  wordId: number;
  anchor: DOMRect;
  onClose: () => void;
  onAdded: (state: string) => void;
}) {
  const [word, setWord] = useState<WordLookup | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWord(null);
    fetch(`/api/words?id=${wordId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          if (data.error) setError(data.error);
          else setWord(data);
        }
      })
      .catch((e) => { if (!cancelled) setError((e as Error).message); });
    return () => { cancelled = true; };
  }, [wordId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const popover = document.getElementById("word-popover");
      if (popover && !popover.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function addToDeck() {
    if (!word) return;
    setAdding(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id }),
      });
      if (res.ok) {
        onAdded("new");
        setWord({ ...word, in_deck: true, state: "new" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Add failed");
      }
    } finally {
      setAdding(false);
    }
  }

  // Position: anchor.top - height above, or below if no space
  const top = anchor.bottom + window.scrollY + 6;
  const left = Math.min(
    Math.max(8, anchor.left + window.scrollX - 120),
    window.scrollX + window.innerWidth - 320,
  );

  return (
    <div
      id="word-popover"
      className="absolute z-50 rounded-xl p-4 shadow-lg"
      style={{
        top, left, width: 300,
        background: "var(--bg-parchment)",
        border: "1px solid var(--accent-gold)",
        color: "var(--ink)",
        fontFamily: "Spectral, serif",
      }}
    >
      {!word && !error && (
        <div className="text-sm" style={{ color: "#7A6855" }}>Loading…</div>
      )}
      {error && (
        <div className="text-sm" style={{ color: "var(--accent-rose)" }}>{error}</div>
      )}
      {word && (
        <div className="space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-3xl" style={{ color: "var(--ink)" }}>{word.simplified}</span>
            <span className="font-pinyin text-lg" style={{ color: "#7A6855", fontStyle: "italic" }}>{word.pinyin}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap text-xs" style={{ fontFamily: "Cormorant Garamond, serif" }}>
            {word.hsk2_level != null && (
              <span className="badge-gold">HSK {word.hsk2_level}</span>
            )}
            <StateBadge state={word.state} />
          </div>
          <ol className="space-y-0.5 text-sm">
            {word.meanings.slice(0, 4).map((m, i) => (
              <li key={i}>
                <span style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>{i + 1}.</span> {m}
              </li>
            ))}
          </ol>
          <div className="flex gap-2 pt-1">
            <Link
              href={`/vocab/${encodeURIComponent(word.simplified)}`}
              className="text-xs px-3 py-1.5 rounded"
              style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}
              onClick={() => onClose()}
            >
              Full detail →
            </Link>
            {!word.in_deck && (
              <button
                onClick={addToDeck}
                disabled={adding}
                className="text-xs px-3 py-1.5 rounded font-semibold"
                style={{ background: "var(--accent-gold)", color: "var(--bg-parchment)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" }}
              >
                {adding ? "Adding…" : "+ Review deck"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: string }) {
  const color =
    state === "new" ? "var(--accent-gold)"
    : state === "learning" ? "var(--wave)"
    : state === "review" ? "var(--ink-soft)"
    : state === "mature" ? "var(--ink-soft)"
    : "var(--accent-rose)";
  return (
    <span className="badge-gold" style={{ background: "transparent", borderColor: color, color }}>
      {state}
    </span>
  );
}
