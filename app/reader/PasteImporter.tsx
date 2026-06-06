"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PasteImporter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function submit() {
    setError(null);
    if (!body.trim()) {
      setError("Paste some Chinese text first.");
      return;
    }
    try {
      const res = await fetch("/api/reader/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Import failed (${res.status})`);
        return;
      }
      const { id } = await res.json();
      startTransition(() => {
        router.push(`/reader/${id}`);
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{
          background: "transparent",
          border: "1.5px dashed var(--accent-gold)",
          color: "var(--accent-gold)",
          fontFamily: "Cormorant Garamond, serif",
          letterSpacing: "0.08em",
        }}
      >
        + Paste in a new text
      </button>
    );
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full px-3 py-2 rounded-md text-sm"
        style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)", color: "var(--ink)", fontFamily: "Spectral, serif" }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Paste Chinese text here…"
        rows={8}
        className="w-full px-3 py-2 rounded-md text-sm font-display"
        style={{ background: "var(--bg-parchment)", border: "1px solid var(--border-subtle)", color: "var(--ink)", resize: "vertical" }}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { setOpen(false); setTitle(""); setBody(""); setError(null); }}
          className="px-3 py-1.5 rounded-md text-xs"
          style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={pending || !body.trim()}
          className="px-4 py-1.5 rounded-md text-xs font-semibold"
          style={{
            background: "var(--accent-gold)",
            color: "var(--bg-primary)",
            fontFamily: "Cormorant Garamond, serif",
            letterSpacing: "0.05em",
            opacity: pending || !body.trim() ? 0.5 : 1,
          }}
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </div>
    </div>
  );
}
