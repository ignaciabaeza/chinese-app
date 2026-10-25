"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DeckSummary {
  id: number;
  name: string;
  card_count: number;
}

/**
 * "Study from": the HSK word list (null) or one of the signed-in user's decks.
 * Used by every study page so a deck can be reviewed, written and listened to
 * with the same Leitner boxes.
 */
export default function DeckPicker({
  value, onChange, hskLabel = "HSK 1–2 words",
}: {
  value: number | null;
  onChange: (deckId: number | null) => void;
  hskLabel?: string;
}) {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/decks")
      .then((res) => (res.ok ? res.json() : { decks: [] }))
      .then((data) => { if (!cancelled) setDecks(data.decks ?? []); })
      .catch(() => { if (!cancelled) setDecks([]); });
    return () => { cancelled = true; };
  }, []);

  if (decks === null) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor="deck-picker" className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          Study from
        </label>
        <Link href="/flashcards" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {decks.length === 0 ? "Build your own deck →" : "Manage decks →"}
        </Link>
      </div>
      <select
        id="deck-picker"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2.5 rounded-xl text-sm"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          fontFamily: "Spectral, serif",
        }}
      >
        <option value="">{hskLabel}</option>
        {decks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} · {d.card_count} word{d.card_count === 1 ? "" : "s"}
          </option>
        ))}
        {/* A ?deck= link to a deck that isn't in the list (deleted, someone else's). */}
        {value != null && !decks.some((d) => d.id === value) && <option value={value}>Unknown deck</option>}
      </select>
    </div>
  );
}
