"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/", label: "Dashboard", icon: "⬡" },
  { href: "/flashcards", label: "Flashcards", icon: "◈" },
  { href: "/sentences", label: "Sentences", icon: "文" },
  { href: "/vocabulary", label: "Vocabulary", icon: "◉" },
  { href: "/progress", label: "Progress", icon: "◎" },
  { href: "/chat", label: "AI Tutor", icon: "⟐" },
];

function CloudMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="16"
      viewBox="0 0 28 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12 Q4 8 7 8 Q7 4 11 4 Q13 2 16 4 Q19 2 22 4 Q26 4 26 8 Q28 8 28 12 Z"
        fill="rgba(201,168,76,0.2)"
        stroke="rgba(201,168,76,0.45)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-sm"
      style={{
        background: "rgba(45, 53, 97, 0.96)",
        borderBottom: "1px solid rgba(201,168,76,0.35)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <CloudMotif className="animate-drift opacity-70" />
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: "Cinzel, serif", color: "var(--accent-gold)" }}
            >
              汉语学习
            </span>
            <span
              className="hidden sm:block text-xs tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "Cinzel, serif" }}
            >
              HÀNYǓ XUÉXÍ
            </span>
            <CloudMotif className="animate-drift opacity-70 scale-x-[-1]" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.06em",
                    color: active ? "var(--accent-gold)" : "var(--text-muted)",
                    borderBottom: active ? "1.5px solid var(--accent-gold)" : "1.5px solid transparent",
                  }}
                  onMouseEnter={(e) =>
                    !active && ((e.currentTarget.style.color = "var(--accent-crane-white)"))
                  }
                  onMouseLeave={(e) =>
                    !active && ((e.currentTarget.style.color = "var(--text-muted)"))
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
            {user ? (
              <>
                <span
                  className="text-xs px-2"
                  style={{ color: "var(--text-muted)", fontFamily: "Lora, serif", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded transition-all"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent-rose)";
                    e.currentTarget.style.borderColor = "var(--accent-rose)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.borderColor = "var(--border-subtle)";
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="text-xs px-3 py-1.5 rounded transition-all"
                style={{
                  fontFamily: "Cinzel, serif",
                  letterSpacing: "0.05em",
                  color: "var(--accent-gold)",
                  border: "1px solid rgba(201,168,76,0.5)",
                }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col gap-1 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-5 h-0.5 transition-all"
                style={{ background: "var(--accent-gold)" }}
              />
            ))}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            className="sm:hidden py-3 border-t flex flex-col gap-1"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm rounded"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.06em",
                    color: active ? "var(--accent-gold)" : "var(--text-muted)",
                    background: active ? "rgba(201,168,76,0.08)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile auth row */}
            <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              {user ? (
                <div className="px-3 flex items-center justify-between">
                  <span
                    className="text-xs truncate"
                    style={{ color: "var(--text-muted)", fontFamily: "Lora, serif", maxWidth: "180px" }}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded"
                    style={{
                      fontFamily: "Cinzel, serif",
                      color: "var(--accent-rose)",
                      border: "1px solid rgba(196,133,122,0.4)",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm rounded flex items-center justify-center"
                  style={{
                    fontFamily: "Cinzel, serif",
                    letterSpacing: "0.06em",
                    color: "var(--accent-gold)",
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    margin: "0 8px",
                  }}
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
