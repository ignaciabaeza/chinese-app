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

const mobileTabs = [
  { href: "/", cn: "家", label: "Home" },
  { href: "/flashcards", cn: "卡", label: "Cards" },
  { href: "/sentences", cn: "句", label: "Sentences" },
  { href: "/vocabulary", cn: "词", label: "Vocab" },
  { href: "/progress", cn: "进", label: "Progress" },
  { href: "/chat", cn: "师", label: "Tutor" },
];

function PlumMotif({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="7"  r="3.2" fill="rgba(212,136,138,0.35)" stroke="rgba(184,104,112,0.5)" strokeWidth="0.6"/>
      <circle cx="15.8" cy="10.5" r="3.2" fill="rgba(212,136,138,0.28)" stroke="rgba(184,104,112,0.4)" strokeWidth="0.6"/>
      <circle cx="14"  cy="16"  r="3.2" fill="rgba(212,136,138,0.32)" stroke="rgba(184,104,112,0.45)" strokeWidth="0.6"/>
      <circle cx="8"   cy="16"  r="3.2" fill="rgba(212,136,138,0.28)" stroke="rgba(184,104,112,0.4)" strokeWidth="0.6"/>
      <circle cx="6.2" cy="10.5" r="3.2" fill="rgba(212,136,138,0.3)" stroke="rgba(184,104,112,0.45)" strokeWidth="0.6"/>
      <circle cx="11" cy="11" r="1.5" fill="rgba(176,144,80,0.5)"/>
    </svg>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop / top nav ── */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{
          background: "rgba(242, 237, 228, 0.95)",
          borderBottom: "1px solid rgba(44,36,22,0.12)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <PlumMotif className="animate-drift opacity-80 shrink-0" />
              <span
                className="text-xl tracking-wide"
                style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 300, color: "var(--ink-dark)" }}
              >
                汉语学习
              </span>
              <span
                className="hidden sm:block text-xs tracking-widest"
                style={{ color: "var(--ink-faint)", fontFamily: "'Cormorant SC', serif", letterSpacing: "0.16em" }}
              >
                HÀNYǓ XUÉXÍ
              </span>
              <span
                className="hidden sm:inline-block text-xs px-1.5 py-0.5 shrink-0"
                style={{
                  border: "1px solid rgba(196,64,48,0.6)",
                  color: "rgba(196,64,48,0.7)",
                  fontFamily: "'Noto Serif SC', serif",
                  transform: "rotate(-2deg)",
                  lineHeight: 1.3,
                }}
              >
                學
              </span>
            </Link>

            {/* Desktop links */}
            <div className="hidden sm:flex items-center gap-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-all"
                    style={{
                      fontFamily: "'Cormorant SC', serif",
                      letterSpacing: "0.06em",
                      color: active ? "var(--blush-deep)" : "var(--ink-medium)",
                      borderBottom: active ? "1.5px solid var(--blush-deep)" : "1.5px solid transparent",
                    }}
                    onMouseEnter={(e) => !active && (e.currentTarget.style.color = "var(--ink-dark)")}
                    onMouseLeave={(e) => !active && (e.currentTarget.style.color = "var(--ink-medium)")}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop auth */}
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: "1px solid var(--border-ink)" }}>
              {user ? (
                <>
                  <span
                    className="text-xs px-2"
                    style={{ color: "var(--ink-faint)", fontFamily: "Lora, serif", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 transition-all"
                    style={{
                      fontFamily: "'Cormorant SC', serif",
                      letterSpacing: "0.1em",
                      color: "var(--ink-faint)",
                      borderBottom: "1px solid var(--border-ink)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--blush-deep)"; e.currentTarget.style.borderBottomColor = "var(--blush-deep)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-faint)"; e.currentTarget.style.borderBottomColor = "var(--border-ink)"; }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="text-xs px-3 py-1.5 transition-all"
                  style={{
                    fontFamily: "'Cormorant SC', serif",
                    letterSpacing: "0.1em",
                    color: "var(--blush-deep)",
                    borderBottom: "1px solid rgba(184,104,112,0.5)",
                  }}
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile: user icon or auth link (compact) */}
            <div className="sm:hidden flex items-center gap-2">
              {!user && (
                <Link
                  href="/auth"
                  className="text-xs px-2 py-1"
                  style={{
                    fontFamily: "'Cormorant SC', serif",
                    letterSpacing: "0.08em",
                    color: "var(--blush-deep)",
                    borderBottom: "1px solid rgba(184,104,112,0.4)",
                  }}
                >
                  Sign In
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="text-xs px-2 py-1"
                  style={{
                    fontFamily: "'Cormorant SC', serif",
                    color: "var(--ink-faint)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom tab bar ── */}
      <div
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "linear-gradient(to top, rgba(242,237,228,1) 70%, rgba(242,237,228,0) 100%)",
          padding: "8px 6px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            background: "rgba(237,229,216,0.92)",
            border: "0.5px solid rgba(44,36,22,0.15)",
            borderRadius: 2,
            padding: "8px 2px",
            boxShadow: "0 4px 16px rgba(44,36,22,0.06)",
            backdropFilter: "blur(10px)",
          }}
        >
          {mobileTabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  padding: "4px 6px",
                  textDecoration: "none",
                  minWidth: 44,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Noto Serif SC', serif",
                    fontWeight: 500,
                    fontSize: 17,
                    color: active ? "var(--blush-deep)" : "var(--ink-medium)",
                    opacity: active ? 1 : 0.6,
                    lineHeight: 1,
                  }}
                >
                  {tab.cn}
                </div>
                <span
                  style={{
                    fontFamily: "'Cormorant SC', serif",
                    fontSize: 9,
                    letterSpacing: 1,
                    color: active ? "var(--blush-deep)" : "var(--ink-faint)",
                    fontWeight: active ? 600 : 500,
                    textTransform: "uppercase",
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <div style={{ width: 14, height: 1.5, background: "var(--blush-deep)", marginTop: 1, borderRadius: 1 }} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
