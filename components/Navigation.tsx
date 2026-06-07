"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/",                       label: "Dashboard" },
  { href: "/review",                 label: "Review" },
  { href: "/shadowing",              label: "Shadowing" },
  { href: "/listening",              label: "Listening" },
  { href: "/writing",                label: "Writing" },
  { href: "/reader",                 label: "Reader" },
  { href: "/grammar",                label: "Grammar" },
  { href: "/vocab",                  label: "Dictionary" },
  { href: "/chat",                   label: "Tutor" },
];

function CloudMotif({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="24" height="14" viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close the desktop user dropdown on outside click or Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setUserMenuOpen(false); }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [userMenuOpen]);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    setUserMenuOpen(false);
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
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "1280px" }}>
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-2">
            <CloudMotif className="animate-drift opacity-70" />
            <span
              className="text-lg font-bold tracking-wide"
              style={{ fontFamily: "Ma Shan Zheng, serif", color: "var(--ink)" }}
            >
              汉语学习
            </span>
            <span
              className="hidden md:block tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", fontSize: "0.6rem" }}
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
                  className="px-2.5 py-1 text-xs transition-all"
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

          {/* Desktop auth — collapsed into a triple-line dropdown */}
          <div className="hidden md:flex items-center ml-2 pl-3 relative" style={{ borderLeft: "1px solid var(--border-subtle)" }} ref={userMenuRef}>
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={userMenuOpen}
                  className="flex flex-col gap-[3px] p-1.5 rounded"
                  style={{
                    border: `1px solid ${userMenuOpen ? "var(--accent-gold)" : "var(--border-subtle)"}`,
                    background: userMenuOpen ? "rgba(201,168,76,0.08)" : "transparent",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="block" style={{ width: 14, height: 1.5, background: userMenuOpen ? "var(--accent-gold)" : "var(--text-muted)" }} />
                  ))}
                </button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 rounded-lg p-3 z-50"
                    style={{
                      top: "calc(100% + 6px)",
                      width: 220,
                      background: "var(--bg-parchment)",
                      border: "1px solid var(--accent-gold)",
                      boxShadow: "0 10px 30px var(--shadow-ink)",
                    }}
                  >
                    <div
                      className="px-1 pb-2 mb-2"
                      style={{ borderBottom: "1px solid var(--border-subtle)", fontFamily: "Spectral, serif" }}
                    >
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        Signed in as
                      </div>
                      <div
                        style={{ fontSize: "0.7rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={user.email}
                      >
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full py-1.5 rounded text-left px-2"
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        letterSpacing: "0.05em",
                        fontSize: "0.7rem",
                        color: "var(--accent-rose)",
                        border: "1px solid rgba(196,133,122,0.4)",
                        background: "transparent",
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1 rounded transition-all"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  letterSpacing: "0.05em",
                  fontSize: "0.7rem",
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
                  className="px-3 py-2 rounded"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    fontSize: "0.75rem",
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
                    className="truncate"
                    style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "Spectral, serif", maxWidth: "180px" }}
                  >
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 rounded"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "0.65rem",
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
                  className="mx-2 px-3 py-2 rounded flex items-center justify-center"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    fontSize: "0.75rem",
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
