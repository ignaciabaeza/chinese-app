"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/",                       label: "Dashboard" },
  { href: "/course",                 label: "Course" },
  { href: "/practice/flashcards",    label: "Flashcards" },
  { href: "/vocab",                  label: "Dictionary" },
  { href: "/library/vocabulary",     label: "Lesson Words" },
  { href: "/chat",                   label: "Tutor" },
];

function CloudMotif({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="28" height="16" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 12 Q4 8 7 8 Q7 4 11 4 Q13 2 16 4 Q19 2 22 4 Q26 4 26 8 Q28 8 28 12 Z"
        fill="rgba(201,168,76,0.2)"
        stroke="rgba(201,168,76,0.45)"
        strokeWidth="0.7"
      />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
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
        background: "rgba(247, 242, 230, 0.86)",
        borderBottom: "1px solid var(--paper-edge)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3">
            <CloudMotif className="animate-drift opacity-70" />
            <span
              className="text-xl font-bold tracking-wide"
              style={{ fontFamily: "Ma Shan Zheng, serif", color: "var(--ink)" }}
            >
              汉语学习
            </span>
            <span
              className="hidden md:block text-xs tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}
            >
              HÀNYǓ XUÉXÍ
            </span>
            <CloudMotif className="animate-drift opacity-70 scale-x-[-1]" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm transition-all"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    color: active ? "var(--accent-gold)" : "var(--text-muted)",
                    borderBottom: active ? "1.5px solid var(--accent-gold)" : "1.5px solid transparent",
                  }}
                  onMouseEnter={(e) => !active && (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => !active && (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2 ml-2 pl-3" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
            {user ? (
              <>
                <span
                  className="text-xs px-2"
                  style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={user.email}
                >
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs px-3 py-1.5 rounded transition-all"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
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
                  fontFamily: "Cormorant Garamond, serif",
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
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="block w-5 h-0.5" style={{ background: "var(--accent-gold)" }} />
            ))}
          </button>
        </div>

        {mobileOpen && (
          <div
            className="md:hidden py-3 border-t flex flex-col gap-1"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 text-sm rounded"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    color: active ? "var(--accent-gold)" : "var(--text-muted)",
                    background: active ? "rgba(201,168,76,0.08)" : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              {user ? (
                <div className="px-3 flex items-center justify-between">
                  <span
                    className="text-xs truncate"
                    style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif", maxWidth: "180px" }}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      color: "var(--accent-rose)",
                      border: "1px solid rgba(196,133,122,0.4)",
                      background: "transparent",
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="mx-2 px-3 py-2.5 text-sm rounded flex items-center justify-center"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    color: "var(--accent-gold)",
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.3)",
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
