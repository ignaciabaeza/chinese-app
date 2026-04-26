"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BlossomBranch } from "@/components/Decor";

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
        className="w-full max-w-sm p-8 relative overflow-hidden"
        style={{
          background: "var(--bg-parchment)",
          border: "1px solid var(--border-ink)",
          borderRadius: "2px",
          boxShadow: "0 8px 32px rgba(44,36,22,0.1)",
        }}
      >
        {/* Blossom decoration */}
        <div className="absolute top-0 right-0 opacity-25 pointer-events-none">
          <BlossomBranch width={130} height={90} variant="tr" />
        </div>

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div
            className="text-4xl mb-2"
            style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, color: "var(--ink-dark)" }}
          >
            汉语学习
          </div>
          <p
            className="text-xs tracking-widest"
            style={{ fontFamily: "'Cormorant SC', serif", color: "var(--ink-faint)", letterSpacing: "0.16em" }}
          >
            HÀNYǓ XUÉXÍ
          </p>
        </div>

        {/* Mode toggle */}
        <div
          className="flex mb-6"
          style={{ borderBottom: "1px solid var(--border-ink)" }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 py-2.5 text-sm transition-all -mb-px border-b-2"
              style={{
                fontFamily: "'Cormorant SC', serif",
                letterSpacing: "0.1em",
                background: "transparent",
                color: mode === m ? "var(--blush-deep)" : "var(--ink-faint)",
                borderBottomColor: mode === m ? "var(--blush-deep)" : "transparent",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs tracking-wider uppercase"
              style={{ fontFamily: "'Cormorant SC', serif", color: "var(--ink-faint)" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full py-2 text-sm outline-none transition-all"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-ink)",
                color: "var(--ink-dark)",
                fontFamily: "Lora, serif",
                borderRadius: 0,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--blush-deep)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--border-ink)")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs tracking-wider uppercase"
              style={{ fontFamily: "'Cormorant SC', serif", color: "var(--ink-faint)" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={mode === "register" ? "Min. 6 characters" : "••••••••"}
              className="w-full py-2 text-sm outline-none transition-all"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-ink)",
                color: "var(--ink-dark)",
                fontFamily: "Lora, serif",
                borderRadius: 0,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--blush-deep)")}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--border-ink)")}
            />
          </div>

          {error && (
            <p
              className="text-sm text-center py-2 px-4"
              style={{
                color: "var(--blush-deep)",
                background: "rgba(184,104,112,0.08)",
                border: "1px solid rgba(184,104,112,0.25)",
                fontFamily: "Lora, serif",
                borderRadius: "2px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm tracking-wider transition-all mt-2"
            style={{
              fontFamily: "'Cormorant SC', serif",
              background: "transparent",
              border: "none",
              borderBottom: loading ? "1px solid var(--ink-faint)" : "1.5px solid var(--ink-dark)",
              color: loading ? "var(--ink-faint)" : "var(--ink-dark)",
              letterSpacing: "0.15em",
              opacity: loading ? 0.6 : 1,
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
            style={{ color: "var(--ink-faint)", fontFamily: "Lora, serif", lineHeight: 1.85 }}
          >
            Your progress will sync across all your devices.
          </p>
        )}
      </div>
    </div>
  );
}
