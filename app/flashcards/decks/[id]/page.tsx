"use client";

/**
 * /flashcards/decks/[id] — edit one of the user's own flashcard decks:
 * rename/delete it, add dictionary words (search by hanzi, pinyin or
 * English) or custom words, and remove cards. Studying happens on
 * /flashcards?deck=ID.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface DeckCard {
  id: number;
  word_id: number | null;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
  custom: boolean;
}

interface Deck {
  id: number;
  name: string;
  cards: DeckCard[];
}

interface SearchResult {
  id: number;
  simplified: string;
  pinyin: string;
  meanings: string[];
  hsk2_level: number | null;
}

const label = { color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" } as const;
const panel = { background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" } as const;

export default function DeckEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch(`/api/decks/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error("Deck not found.");
        if (!res.ok) throw new Error(`Couldn't load the deck (${res.status}).`);
        const data: Deck = await res.json();
        if (!cancelled) setDeck(data);
      })
      .catch((e: Error) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, [user, id]);

  /** POST a card; returns false (and shows the error) on failure. */
  const addCard = useCallback(async (payload: { wordId: number } | { simplified: string; pinyin: string; meaning: string }) => {
    setError(null);
    try {
      const res = await fetch(`/api/decks/${encodeURIComponent(id)}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Couldn't add the word (${res.status}).`);
      setDeck((d) => (d ? { ...d, cards: [data.card, ...d.cards] } : d));
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }, [id]);

  async function removeCard(cardId: number) {
    setError(null);
    const res = await fetch(`/api/decks/${encodeURIComponent(id)}/cards/${cardId}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) { setError("Couldn't remove the word — try again."); return; }
    setDeck((d) => (d ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d));
  }

  async function rename(name: string) {
    setError(null);
    const res = await fetch(`/api/decks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(data?.error || "Couldn't rename the deck — try again.");
      return false;
    }
    setDeck((d) => (d ? { ...d, name: name.trim() } : d));
    return true;
  }

  async function remove() {
    if (!deck || !window.confirm(`Delete “${deck.name}” and its ${deck.cards.length} word${deck.cards.length === 1 ? "" : "s"}?`)) return;
    const res = await fetch(`/api/decks/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) { setError("Couldn't delete the deck — try again."); return; }
    router.push("/flashcards");
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center pt-10 space-y-4 animate-fade-up">
        <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>Sign in to edit your decks.</p>
        <Link href="/auth" className="inline-block px-4 py-2 rounded-lg text-sm" style={{ border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
          Sign In
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto text-center pt-10 space-y-4 animate-fade-up">
        <p style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{loadError}</p>
        <Link href="/flashcards" className="text-sm" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif" }}>
          ← Back to flashcards
        </Link>
      </div>
    );
  }

  if (!deck) return null;
  const inDeck = new Set(deck.cards.flatMap((c) => (c.word_id != null ? [c.word_id] : [])));

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <Header deck={deck} onRename={rename} onDelete={remove} />

      {error && (
        <div className="rounded-xl p-3" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm text-center" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      <WordSearch inDeck={inDeck} onAdd={(wordId) => addCard({ wordId })} />
      <CustomWordForm onAdd={addCard} />

      <section className="space-y-2">
        <div className="text-xs uppercase tracking-widest" style={label}>
          In this deck · {deck.cards.length}
        </div>
        {deck.cards.length === 0 ? (
          <p className="text-sm text-center py-6 rounded-xl" style={{ ...panel, color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
            No words yet — search above to add some.
          </p>
        ) : (
          <ul className="rounded-xl divide-y" style={{ ...panel, borderColor: "var(--border-subtle)" }}>
            {deck.cards.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="font-display text-xl shrink-0" style={{ color: "var(--text-primary)" }}>{c.simplified}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-pinyin text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{c.pinyin}</div>
                  <div className="text-xs truncate" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
                    {c.meanings.slice(0, 2).join("; ")}
                  </div>
                </div>
                {c.custom && <span className="badge-gold text-[10px] shrink-0">custom</span>}
                <button
                  onClick={() => void removeCard(c.id)}
                  aria-label={`Remove ${c.simplified}`}
                  className="text-lg px-2 shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── Header: name, rename, study, delete ─────────────────────────────────────

function Header({ deck, onRename, onDelete }: {
  deck: Deck;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(deck.name);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await onRename(name)) setEditing(false);
  }

  return (
    <div className="space-y-3">
      <Link href="/flashcards" className="text-xs" style={label}>← Flashcards</Link>
      {editing ? (
        <form onSubmit={save} className="flex gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="input-parchment flex-1 min-w-0"
          />
          <button type="submit" className="text-xs px-3 rounded-lg" style={{ background: "var(--accent-gold)", color: "var(--accent-crane-white)", fontFamily: "Cormorant Garamond, serif" }}>
            Save
          </button>
          <button type="button" onClick={() => { setEditing(false); setName(deck.name); }} className="text-xs px-2" style={label}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl flex-1 min-w-0 truncate" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.06em" }}>
            {deck.name}
          </h1>
          <button onClick={() => setEditing(true)} className="text-xs" style={label}>Rename</button>
          <button onClick={onDelete} className="text-xs" style={{ ...label, color: "var(--accent-rose)" }}>Delete</button>
        </div>
      )}
      {deck.cards.length > 0 ? (
        <Link
          href={`/flashcards?deck=${deck.id}`}
          className="block w-full py-3 rounded-xl text-sm font-semibold text-center"
          style={{ background: "var(--accent-gold)", color: "var(--accent-crane-white)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.1em" }}
        >
          Study this deck · {deck.cards.length} word{deck.cards.length === 1 ? "" : "s"}
        </Link>
      ) : null}
    </div>
  );
}

// ─── Dictionary search ───────────────────────────────────────────────────────

function WordSearch({ inDeck, onAdd }: { inDeck: Set<number>; onAdd: (wordId: number) => Promise<boolean> }) {
  const [query, setQuery] = useState("");
  // Results remember which query they answer; older results stay on screen
  // while the next search is in flight.
  const [found, setFound] = useState<{ q: string; results: SearchResult[] }>({ q: "", results: [] });
  const [adding, setAdding] = useState<number | null>(null);
  const q = query.trim();
  const searching = q !== "" && found.q !== q;
  const results = found.results;

  useEffect(() => {
    if (!q) return;
    // Cleanup cancels this search once the query changes (overlapping fetches).
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let results: SearchResult[] = [];
      try {
        const res = await fetch(`/api/words/search?q=${encodeURIComponent(q)}`);
        if (res.ok) results = (await res.json()).results;
      } catch { /* show "no match" */ }
      if (!cancelled) setFound({ q, results });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [q]);

  async function add(wordId: number) {
    if (adding != null) return;
    setAdding(wordId);
    await onAdd(wordId);
    setAdding(null);
  }

  return (
    <section className="space-y-2">
      <div className="text-xs uppercase tracking-widest" style={label}>Add words</div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search 汉字, pinyin (hanyu, hàn yǔ) or English"
        className="input-parchment w-full"
      />
      {q && (
        <ul className="rounded-xl divide-y max-h-80 overflow-y-auto" style={{ ...panel, borderColor: "var(--border-subtle)" }}>
          {results.map((w) => {
            const added = inDeck.has(w.id);
            return (
              <li key={w.id} className="flex items-center gap-3 px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="font-display text-xl shrink-0" style={{ color: "var(--text-primary)" }}>{w.simplified}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-pinyin text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    {w.pinyin}{w.hsk2_level != null && <span className="not-italic text-[10px] ml-2" style={label}>HSK {w.hsk2_level}</span>}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
                    {w.meanings.slice(0, 2).join("; ")}
                  </div>
                </div>
                <button
                  onClick={() => void add(w.id)}
                  disabled={added || adding != null}
                  className="text-xs px-3 py-1.5 rounded-lg shrink-0"
                  style={{
                    border: `1.5px solid ${added ? "var(--border-subtle)" : "var(--accent-gold)"}`,
                    color: added ? "var(--text-muted)" : "var(--accent-gold)",
                    fontFamily: "Cormorant Garamond, serif",
                    opacity: adding === w.id ? 0.5 : 1,
                  }}
                >
                  {added ? "Added ✓" : "+ Add"}
                </button>
              </li>
            );
          })}
          {!searching && results.length === 0 && (
            <li className="px-3 py-3 text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
              No dictionary match — add it as a custom word below.
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

// ─── Custom word ─────────────────────────────────────────────────────────────

function CustomWordForm({ onAdd }: {
  onAdd: (w: { simplified: string; pinyin: string; meaning: string }) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [simplified, setSimplified] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [meaning, setMeaning] = useState("");
  const [saving, setSaving] = useState(false);
  const valid = simplified.trim() !== "" && meaning.trim() !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    if (await onAdd({ simplified, pinyin, meaning })) {
      setSimplified(""); setPinyin(""); setMeaning("");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs" style={{ ...label, color: "var(--accent-gold)" }}>
        Can&apos;t find a word? Add a custom one →
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl p-4 space-y-3" style={panel}>
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-widest" style={label}>Custom word</div>
        <button type="button" onClick={() => setOpen(false)} className="text-xs" style={label}>Close</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={simplified} onChange={(e) => setSimplified(e.target.value)} maxLength={40} placeholder="Characters, e.g. 奶茶" className="input-parchment" />
        <input value={pinyin} onChange={(e) => setPinyin(e.target.value)} maxLength={120} placeholder="Pinyin (optional), e.g. nǎichá" className="input-parchment" />
      </div>
      <input value={meaning} onChange={(e) => setMeaning(e.target.value)} maxLength={300} placeholder="Meaning, e.g. milk tea" className="input-parchment w-full" />
      <button
        type="submit"
        disabled={!valid || saving}
        className="w-full py-2.5 rounded-xl text-sm"
        style={{ border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em", opacity: !valid || saving ? 0.5 : 1 }}
      >
        {saving ? "Adding…" : "Add to deck"}
      </button>
    </form>
  );
}
