"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ShadowSentence {
  id: number;
  simplified: string;
  pinyin: string | null;
  english: string;
  audio_path: string;
  max_hsk_level: number | null;
}

type RecState = "idle" | "asking" | "recording" | "have-recording" | "denied";

export default function ShadowingPage() {
  const [sentence, setSentence] = useState<ShadowSentence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [loops, setLoops] = useState(1);
  const [loopsLeft, setLoopsLeft] = useState(0);
  const [recState, setRecState] = useState<RecState>("idle");
  const [userBlobUrl, setUserBlobUrl] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const loadNext = useCallback(async (excludeId?: number) => {
    setError(null);
    setLoading(true);
    setRecState("idle");
    if (userBlobUrl) {
      URL.revokeObjectURL(userBlobUrl);
      setUserBlobUrl(null);
    }
    try {
      const qs = excludeId ? `?exclude=${excludeId}` : "";
      const res = await fetch(`/api/shadowing/next${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Fetch failed: ${res.status}`);
        setSentence(null);
        return;
      }
      const data: ShadowSentence = await res.json();
      setSentence(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userBlobUrl]);

  useEffect(() => { loadNext(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Native playback with loop support.
  const playNative = useCallback(() => {
    const el = nativeAudioRef.current;
    if (!el) return;
    try { el.currentTime = 0; } catch {}
    setLoopsLeft(loops - 1);
    el.play().catch(() => { /* autoplay blocked */ });
  }, [loops]);

  function onNativeEnded() {
    if (loopsLeft > 0) {
      setLoopsLeft((n) => n - 1);
      const el = nativeAudioRef.current;
      if (el) { try { el.currentTime = 0; } catch {}; el.play().catch(() => {}); }
    }
  }

  // Recorder lifecycle.
  async function startRecording() {
    if (recState === "recording") return;
    setRecState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setUserBlobUrl(url);
        setRecState("have-recording");
        setSessionCount((n) => n + 1);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecState("recording");
    } catch {
      setRecState("denied");
    }
  }

  function stopRecording() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }

  function playUser() {
    const el = userAudioRef.current;
    if (!el) return;
    try { el.currentTime = 0; } catch {}
    el.play().catch(() => {});
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (userBlobUrl) URL.revokeObjectURL(userBlobUrl);
    };
  }, [userBlobUrl]);

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          Shadowing
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          Listen, record, compare. Build your ear and your mouth.
        </p>
      </div>

      {error && (
        <div className="rounded-xl p-4" style={{ background: "rgba(196,133,122,0.08)", border: "1px solid rgba(196,133,122,0.4)" }}>
          <p className="text-sm" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>{error}</p>
        </div>
      )}

      {loading && !sentence && (
        <div className="text-center text-xs" style={{ color: "var(--text-muted)" }}>Loading…</div>
      )}

      {sentence && (
        <>
          {/* Sentence display */}
          <div className="rounded-2xl p-5 sm:p-6 space-y-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <div className="font-display text-2xl sm:text-3xl text-center" style={{ color: "var(--text-primary)", fontFamily: "Noto Serif SC, serif", lineHeight: 1.4 }}>
              {sentence.simplified}
            </div>
            {showPinyin && sentence.pinyin && (
              <div className="text-center text-base sm:text-lg font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                {sentence.pinyin}
              </div>
            )}
            {showEnglish && (
              <div className="text-center text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
                {sentence.english}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-center gap-4 text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
              Pinyin
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showEnglish} onChange={(e) => setShowEnglish(e.target.checked)} />
              English
            </label>
            <label className="inline-flex items-center gap-1.5">
              Loops
              <select value={loops} onChange={(e) => setLoops(parseInt(e.target.value, 10))} style={{ background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)", borderRadius: 4, padding: "1px 4px" }}>
                {[1, 2, 3, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>

          {/* Native audio */}
          <audio
            ref={nativeAudioRef}
            src={sentence.audio_path}
            onEnded={onNativeEnded}
            preload="auto"
            className="hidden"
          />

          {/* Player + recorder controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={playNative}
              className="py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
            >
              ▶ Native {loopsLeft > 0 && <span className="text-xs opacity-60">×{loopsLeft + 1}</span>}
            </button>
            {recState === "recording" ? (
              <button
                onClick={stopRecording}
                className="py-4 rounded-xl text-sm font-semibold animate-pulse"
                style={{ background: "var(--accent-rose)", color: "var(--bg-parchment)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em", border: "1.5px solid var(--accent-rose)" }}
              >
                ■ Stop
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={recState === "asking"}
                className="py-4 rounded-xl text-sm font-semibold"
                style={{ background: "transparent", border: "1.5px solid var(--accent-rose)", color: "var(--accent-rose)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
              >
                ● {recState === "have-recording" ? "Record again" : "Record me"}
              </button>
            )}
          </div>

          {recState === "denied" && (
            <p className="text-xs text-center" style={{ color: "var(--accent-rose)", fontFamily: "Spectral, serif" }}>
              Microphone access denied. Allow it in your browser settings to record.
            </p>
          )}

          {/* A/B compare */}
          {userBlobUrl && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-parchment)", border: "1px solid var(--accent-gold)" }}>
              <div className="text-center text-xs uppercase tracking-widest" style={{ color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}>
                A / B compare
              </div>
              <audio ref={userAudioRef} src={userBlobUrl} className="hidden" />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={playNative}
                  className="py-3 rounded-lg text-sm"
                  style={{ background: "transparent", border: "1.5px solid var(--accent-gold)", color: "#7A6855", fontFamily: "Cormorant Garamond, serif" }}
                >
                  ▶ Native
                </button>
                <button
                  onClick={playUser}
                  className="py-3 rounded-lg text-sm"
                  style={{ background: "transparent", border: "1.5px solid var(--accent-rose)", color: "var(--accent-rose)", fontFamily: "Cormorant Garamond, serif" }}
                >
                  ▶ You
                </button>
              </div>
            </div>
          )}

          {/* Next sentence */}
          <button
            onClick={() => loadNext(sentence.id)}
            className="w-full py-3 rounded-xl text-sm"
            style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}
          >
            Next sentence →
          </button>

          {sessionCount > 0 && (
            <p className="text-xs text-center" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
              {sessionCount} shadowed this session
            </p>
          )}
        </>
      )}
    </div>
  );
}
