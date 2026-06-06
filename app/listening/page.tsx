"use client";

import { useState } from "react";
import DictationDrill from "@/components/DictationDrill";
import ToneDrill from "@/components/ToneDrill";

type Mode = "dictation" | "tones";

export default function ListeningPage() {
  const [mode, setMode] = useState<Mode>("dictation");

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Listening
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {mode === "dictation" ? "Hear it, write it back" : "Hear the tones — identify the pattern"}
        </p>
      </div>

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

      {mode === "dictation" ? <DictationDrill /> : <ToneDrill />}
    </div>
  );
}
