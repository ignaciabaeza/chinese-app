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
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);

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

  // Close the mobile drawer on outside click, Escape, or route change.
  useEffect(() => {
    if (!mobileOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (!mobileDrawerRef.current?.contains(e.target as Node)) setMobileOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setMobileOpen(false); }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    setMobileOpen(false);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
    <nav
      className="sticky top-0 backdrop-blur-sm"
      style={{
        background: "rgba(247, 242, 230, 0.86)",
        borderBottom: "1px solid var(--paper-edge)",
        zIndex: 50,
      }}
    >
      <div className="mx-auto px-3 sm:px-6" style={{ maxWidth: "1280px" }}>
        <div className="flex items-center justify-between h-12">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => { setMobileOpen(false); setUserMenuOpen(false); }}
          >
            <CloudMotif className="animate-drift opacity-70" />
            <span
              className="text-base sm:text-lg font-bold tracking-wide"
              style={{ fontFamily: "Ma Shan Zheng, serif", color: "var(--ink)" }}
            >
              汉语学习
            </span>
            <span
              className="hidden xl:block tracking-widest"
              style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif", fontSize: "0.6rem" }}
            >
              HÀNYǓ XUÉXÍ
            </span>
            <CloudMotif className="hidden sm:block animate-drift opacity-70 scale-x-[-1]" />
          </Link>

          {/* Desktop nav (≥ lg) */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2.5 py-1 text-xs rounded-md transition-all"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    background: active ? "var(--accent-gold)" : "rgba(247, 242, 230, 0.80)",
                    color: active ? "var(--accent-crane-white)" : "var(--text-muted)",
                    border: active ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                  }}
                  onMouseEnter={(e) => {
                    if (active) return;
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background = "rgba(247, 242, 230, 1)";
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.background = "rgba(247, 242, 230, 0.80)";
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth dropdown (≥ lg) */}
          <div
            className="hidden lg:flex items-center ml-2 pl-3 relative"
            style={{ borderLeft: "1px solid var(--border-subtle)" }}
            ref={userMenuRef}
          >
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
                {userMenuOpen && <UserMenuPanel email={user.email} onSignOut={handleLogout} />}
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

          {/* Mobile / tablet hamburger (< lg) */}
          <button
            className="lg:hidden flex flex-col gap-1 p-2 rounded shrink-0"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            style={{
              background: mobileOpen ? "rgba(201,168,76,0.08)" : "transparent",
              border: `1px solid ${mobileOpen ? "var(--accent-gold)" : "transparent"}`,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="block" style={{ width: 18, height: 2, background: "var(--accent-gold)", borderRadius: 1 }} />
            ))}
          </button>
        </div>

      </div>
    </nav>

    {/* Mobile / tablet drawer (< lg). Rendered OUTSIDE the <nav> so the
        nav's stacking context (created by backdrop-blur) can't trap it
        underneath the page content. Both backdrop and drawer use
        position: fixed with z-index > 50 so they sit above everything. */}
    {mobileOpen && (
      <>
        <div
          className="lg:hidden fixed inset-0"
          style={{ background: "rgba(42, 38, 32, 0.35)", top: 48, zIndex: 90 }}
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
        <div
          ref={mobileDrawerRef}
          className="lg:hidden fixed rounded-xl overflow-hidden"
          style={{
            top: 56,
            left: 8,
            right: 8,
            zIndex: 100,
            background: "var(--bg-parchment)",
            border: "1px solid var(--accent-gold)",
            boxShadow: "0 16px 40px var(--shadow-ink)",
            maxHeight: "calc(100vh - 72px)",
            overflowY: "auto",
          }}
        >
          <div className="flex flex-col py-2 px-2 gap-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md transition-colors flex items-center"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.08em",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    background: active ? "var(--accent-gold)" : "rgba(247, 242, 230, 0.80)",
                    color: active ? "var(--accent-crane-white)" : "var(--ink-soft)",
                    border: active ? "1px solid var(--accent-gold)" : "1px solid var(--border-subtle)",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Account section */}
          <div className="px-3 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            {user ? (
              <div>
                <div
                  style={{ fontSize: "0.55rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Spectral, serif" }}
                >
                  Signed in as
                </div>
                <div
                  className="mb-2"
                  style={{ fontSize: "0.7rem", color: "var(--ink)", fontFamily: "Spectral, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={user.email}
                >
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 rounded"
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    letterSpacing: "0.06em",
                    fontSize: "0.7rem",
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
                className="block w-full py-2 rounded text-center"
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  letterSpacing: "0.08em",
                  fontSize: "0.75rem",
                  color: "var(--accent-gold)",
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.4)",
                }}
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      </>
    )}
    </>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function UserMenuPanel({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div
      className="absolute right-0 rounded-lg p-3 z-50"
      style={{
        top: "calc(100% + 6px)",
        width: 240,
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
          title={email}
        >
          {email}
        </div>
      </div>
      <button
        onClick={onSignOut}
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
  );
}
