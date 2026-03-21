"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function AuthPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = mode === "login"
      ? await login(email, password)
      : await register(email, password);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="text-4xl mb-2"
            style={{ fontFamily: "Noto Serif SC, serif", color: "var(--accent-gold)" }}
          >
            汉语学习
          </div>
          <p
            className="text-xs tracking-widest"
            style={{ fontFamily: "Cinzel, serif", color: "var(--text-muted)" }}
          >
            HÀNYǓ XUÉXÍ
          </p>
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-lg mb-6 p-1"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2 text-sm rounded-md transition-all"
              style={{
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.05em",
                background: mode === m ? "var(--accent-gold)" : "transparent",
                color: mode === m ? "var(--bg-primary)" : "var(--text-muted)",
                fontWeight: mode === m ? "600" : "400",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs tracking-wider"
              style={{ fontFamily: "Cinzel, serif", color: "var(--text-muted)" }}
            >
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: "Lora, serif",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs tracking-wider"
              style={{ fontFamily: "Cinzel, serif", color: "var(--text-muted)" }}
            >
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: "Lora, serif",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            />
          </div>

          {error && (
            <p
              className="text-sm text-center rounded-lg py-2 px-4"
              style={{
                color: "var(--accent-rose)",
                background: "rgba(196,133,122,0.12)",
                border: "1px solid rgba(196,133,122,0.3)",
                fontFamily: "Lora, serif",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-semibold tracking-wider transition-all mt-2"
            style={{
              fontFamily: "Cinzel, serif",
              background: loading
                ? "rgba(201,168,76,0.5)"
                : "linear-gradient(135deg, var(--accent-gold), #E8C76A)",
              color: "var(--bg-primary)",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "请稍候…"
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {mode === "register" && (
          <p
            className="text-center text-xs mt-6"
            style={{ color: "var(--text-muted)", fontFamily: "Lora, serif" }}
          >
            Your progress will sync across all your devices.
          </p>
        )}
      </div>
    </div>
  );
}
