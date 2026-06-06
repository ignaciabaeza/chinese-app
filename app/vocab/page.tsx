import Link from "next/link";
import { searchWords, getLevelCounts, type LevelFilter } from "@/lib/vocab";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function VocabPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; level?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q?.trim() ?? "";
  const level = (sp.level as LevelFilter) ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ rows, total }, levelCounts] = await Promise.all([
    searchWords({ query, level, limit: PAGE_SIZE, offset }),
    getLevelCounts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1
          className="text-2xl sm:text-3xl mb-1"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}
        >
          Dictionary
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {total.toLocaleString()} {query || level !== "all" ? "matching" : "total"} words
          {" · "}
          <Link href="/library/vocabulary" style={{ color: "var(--accent-gold)" }}>
            view authored lesson words →
          </Link>
        </p>
      </div>

      <form className="space-y-3" action="/vocab" method="get">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search hanzi, pinyin, or English…"
          className="w-full px-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontFamily: "Spectral, serif",
            outline: "none",
          }}
        />

        <div className="flex gap-1.5 flex-wrap items-center">
          <LevelButton current={level} value="all" label="All" />
          <span className="text-xs ml-2" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            HSK 2.0:
          </span>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <LevelButton
              key={`h2-${n}`}
              current={level}
              value={`hsk2-${n}` as LevelFilter}
              label={`${n}`}
              count={levelCounts.hsk2[n]}
            />
          ))}
          <span className="text-xs ml-3" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
            HSK 3.0:
          </span>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <LevelButton
              key={`h3-${n}`}
              current={level}
              value={`hsk3-${n}` as LevelFilter}
              label={`${n}`}
              count={levelCounts.hsk3[n]}
            />
          ))}
        </div>

        {/* preserve filters across the search submit */}
        {level !== "all" && <input type="hidden" name="level" value={level} />}

        <noscript>
          <button type="submit" className="px-3 py-1.5 rounded-md text-xs" style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)" }}>
            Search
          </button>
        </noscript>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
          <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
            No words match this filter. {query && <Link href="/vocab" style={{ color: "var(--accent-gold)" }}>Clear search</Link>}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {rows.map((w) => (
            <Link
              key={w.id}
              href={`/vocab/${encodeURIComponent(w.simplified)}`}
              className="rounded-xl p-3 flex items-baseline gap-3 transition-all"
              style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <span className="font-display text-2xl shrink-0" style={{ color: "var(--text-primary)", minWidth: "3rem" }}>
                {w.simplified}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-pinyin text-sm" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    {w.pinyin}
                  </span>
                  {w.hsk2_level != null && (
                    <span className="text-xs" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", opacity: 0.85 }}>
                      HSK {w.hsk2_level}
                    </span>
                  )}
                  {w.hsk2_level == null && w.hsk3_level != null && (
                    <span className="text-xs" style={{ color: "var(--wave)", fontFamily: "Cormorant Garamond, serif", opacity: 0.85 }}>
                      HSK3.0 {w.hsk3_level}
                    </span>
                  )}
                  {w.pos.length > 0 && (
                    <span className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                      {w.pos.slice(0, 2).join(", ")}
                    </span>
                  )}
                </div>
                <div className="text-sm mt-0.5 line-clamp-2" style={{ color: "var(--text-primary)", fontFamily: "Spectral, serif" }}>
                  {w.meanings.slice(0, 3).join("; ")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          <span style={{ color: "var(--text-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ q: query, level, page: page - 1 })}
                className="px-3 py-1.5 rounded-md"
                style={{ border: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ q: query, level, page: page + 1 })}
                className="px-3 py-1.5 rounded-md"
                style={{ border: "1px solid var(--accent-gold)", color: "var(--accent-gold)" }}
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelButton({
  current,
  value,
  label,
  count,
}: {
  current: LevelFilter;
  value: LevelFilter;
  label: string;
  count?: number;
}) {
  const active = current === value;
  return (
    <Link
      href={value === "all" ? "/vocab" : `/vocab?level=${value}`}
      className="px-2 py-1 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1"
      style={{
        fontFamily: "Cormorant Garamond, serif",
        background: active ? "var(--accent-gold)" : "transparent",
        color: active ? "var(--bg-primary)" : "var(--text-muted)",
        border: "1px solid var(--border-subtle)",
        minWidth: "1.75rem",
        justifyContent: "center",
      }}
    >
      {label}
      {count != null && (
        <span style={{ opacity: 0.65, fontWeight: 400 }}>({count})</span>
      )}
    </Link>
  );
}

function buildHref(params: { q?: string; level?: string; page?: number }): string {
  const u = new URLSearchParams();
  if (params.q) u.set("q", params.q);
  if (params.level && params.level !== "all") u.set("level", params.level);
  if (params.page && params.page > 1) u.set("page", String(params.page));
  const qs = u.toString();
  return qs ? `/vocab?${qs}` : "/vocab";
}
