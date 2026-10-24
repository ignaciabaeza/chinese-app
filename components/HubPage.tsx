// Shared layout for the top-level hub pages (/practice, /library): a header
// plus a list of large tappable cards, one per tool.

import Link from "next/link";

export interface HubItem {
  href: string;
  hanzi: string;
  title: string;
  sub: string;
  /** Optional right-hand badge, e.g. "12 due". Highlighted cards get the rose accent. */
  badge?: string;
  highlight?: boolean;
}

export default function HubPage({ title, subtitle, items, footer }: {
  title: string;
  subtitle: string;
  items: HubItem[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-up">
      <div className="text-center">
        <h1 className="text-2xl" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.08em" }}>
          {title}
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {subtitle}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-xl px-4 py-4 transition-all"
            style={{
              background: item.highlight ? "rgba(196,133,122,0.06)" : "var(--bg-secondary)",
              border: item.highlight ? "1px solid rgba(196,133,122,0.4)" : "1px solid var(--border-subtle)",
            }}
          >
            <span className="font-display text-3xl shrink-0 w-10 text-center" style={{ color: "var(--ink)" }}>
              {item.hanzi}
            </span>
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-base"
                style={{ color: item.highlight ? "var(--accent-rose)" : "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.04em" }}
              >
                {item.title}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
                {item.sub}
              </div>
              {/* Phones: badge under the text so the description keeps the width. */}
              {item.badge && <Badge item={item} className="sm:hidden inline-block mt-1.5" />}
            </div>
            {item.badge && <Badge item={item} className="hidden sm:inline-block shrink-0" />}
            <span className="shrink-0" style={{ color: item.highlight ? "var(--accent-rose)" : "var(--text-muted)" }}>→</span>
          </Link>
        ))}
      </div>

      {footer}
    </div>
  );
}

function Badge({ item, className }: { item: HubItem; className: string }) {
  return (
    <span
      className={`badge-gold ${className}`}
      style={item.highlight ? { background: "transparent", borderColor: "var(--accent-rose)", color: "var(--accent-rose)" } : undefined}
    >
      {item.badge}
    </span>
  );
}
