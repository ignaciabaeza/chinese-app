"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import DeckPicker from "@/components/DeckPicker";
import DictationDrill from "@/components/DictationDrill";
import ToneDrill from "@/components/ToneDrill";

type Mode = "dictation" | "tones";

export default function ListeningPage() {
  return (
    <Suspense fallback={null}>
      <ListeningInner />
    </Suspense>
  );
}

function ListeningInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("dictation");
  // ?deck=ID preselects one of the user's decks.
  const [deckId, setDeckId] = useState<number | null>(() => {
    const d = searchParams.get("deck");
    return d && /^\d+$/.test(d) ? Number(d) : null;
  });
  const deck = user ? deckId : null;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Listening
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {mode === "dictation"
            ? deck != null ? "Hear sentences that use your deck's words, write them back" : "Hear it, write it back"
            : "Hear the tones — identify the pattern. Answers update the word's listening progress."}
        </p>
      </div>

      {user && <DeckPicker value={deckId} onChange={setDeckId} />}

      {/* Mode tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
        {(["dictation", "tones"] as const).map((m) => {
          const active = m === mode;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="py-2 rounded-lg text-xs"
              style={{
                background: active ? "rgba(201,168,76,0.15)" : "transparent",
                color: active ? "var(--accent-gold)" : "var(--text-muted)",
                fontFamily: "Cormorant Garamond, serif",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {m === "dictation" ? "Dictation" : "Tone Drill"}
            </button>
          );
        })}
      </div>

      {mode === "dictation"
        ? <DictationDrill key={`d-${deck ?? "hsk"}`} deckId={deck} />
        : <ToneDrill key={`t-${deck ?? "hsk"}`} deckId={deck} />}
    </div>
  );
}
