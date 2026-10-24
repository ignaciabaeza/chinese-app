"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface DeckSummary {
  id: number;
  name: string;
  card_count: number;
}

/** "Your decks" on the /flashcards setup screen: list + "Create your own deck". */
export default function YourDecks() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch("/api/decks")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Couldn't load your decks (${res.status}).`);
        const data = await res.json();
        if (!cancelled) setDecks(data.decks);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [user]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Couldn't create the deck (${res.status}).`);
      router.push(`/flashcards/decks/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <section className="space-y-2">
      <div className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        Your decks
      </div>

      {!user ? (
        <div className="rounded-xl p-4 text-sm text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          <Link href="/auth" style={{ color: "var(--accent-gold)" }}>Sign in</Link> to create your own decks with the words you&apos;re learning.
        </div>
      ) : (
        <>
          {decks?.map((d) => (
            <div
              key={d.id}
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>{d.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
                  {d.card_count} word{d.card_count === 1 ? "" : "s"}
                </div>
              </div>
              <Link
                href={`/flashcards/decks/${d.id}`}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
              >
                Edit
              </Link>
              {d.card_count > 0 && (
                <Link
                  href={`/flashcards?deck=${d.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
                >
                  Study
                </Link>
              )}
            </div>
          ))}

          {creating ? (
            <form onSubmit={create} className="rounded-xl p-3 flex gap-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-gold)" }}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Deck name, e.g. Food words"
                className="input-parchment flex-1 min-w-0 text-sm"
              />
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="text-xs px-3 rounded-lg"
                style={{ background: "var(--accent-gold)", color: "var(--accent-crane-white)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em", opacity: saving || !name.trim() ? 0.5 : 1 }}
              >
                {saving ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setName(""); }}
                className="text-xs px-2"
                style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full py-3 rounded-xl text-sm"
              style={{ background: "transparent", border: "1.5px dashed var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}
            >
              + Create your own deck
            </button>
          )}

          {error && (
            <p className="text-xs text-center" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
          )}
        </>
      )}
    </section>
  );
}
