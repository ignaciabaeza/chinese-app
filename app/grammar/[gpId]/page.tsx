import Link from "next/link";
import { notFound } from "next/navigation";
import { getGrammarPoint, pickScrambleExample } from "@/lib/grammar";
import { segmentTokens } from "@/lib/segment";
import SentenceScramble from "@/components/SentenceScramble";

export const dynamic = "force-dynamic";

export default async function GrammarDetailPage({
  params,
}: {
  params: Promise<{ gpId: string }>;
}) {
  const { gpId } = await params;
  const decoded = decodeURIComponent(gpId);
  const detail = getGrammarPoint(decoded);
  if (!detail) notFound();
  const { point } = detail;

  // Pick one example and pre-segment server-side for the scramble.
  const example = pickScrambleExample(point);
  const scrambleTokens = example ? await segmentTokens(example.hanzi) : [];
  const scrambleViable = scrambleTokens.length >= 2 && scrambleTokens.length <= 10;

  return (
    <div className="space-y-7 animate-fade-up">
      <div>
        <Link href="/grammar" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          ← Grammar
        </Link>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-display" style={{ color: "var(--text-primary)" }}>
            {point.title.hanzi}
          </h1>
          <span className="badge-gold">HSK {detail.level}</span>
          <span className="badge-gold" style={{ background: "transparent", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            Lesson {detail.lessonNumber}
          </span>
        </div>
        <div className="text-sm mt-1" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
          {point.title.english}
        </div>
      </div>

      {/* Pattern table */}
      {point.patternTable && point.patternTable.columns.length > 0 && (
        <section>
          <SectionHeader chinese="结构" english="Pattern" />
          <div className="rounded-xl overflow-x-auto" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <table className="w-full text-sm" style={{ fontFamily: "Spectral, serif" }}>
              <thead>
                <tr>
                  {point.patternTable.columns.map((c, i) => (
                    <th key={i} className="text-left px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)", color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {point.patternTable.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 border-b font-display" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Explanation */}
      <section>
        <SectionHeader chinese="解释" english="Explanation" />
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-base" style={{ color: "var(--text-primary)", fontFamily: "Noto Serif SC, serif" }}>
            {point.explanation.hanzi}
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
            {point.explanation.english}
          </p>
        </div>
      </section>

      {/* Examples */}
      {point.examples && point.examples.length > 0 && (
        <section>
          <SectionHeader chinese="例句" english="Examples" />
          <ul className="space-y-3">
            {point.examples.map((e, i) => (
              <li key={i} className="rounded-xl p-4 space-y-1" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
                <div className="font-display text-lg" style={{ color: "var(--text-primary)" }}>{e.hanzi}</div>
                <div className="text-sm font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{e.pinyin}</div>
                {e.english && (
                  <div className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>{e.english}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sentence scramble */}
      {scrambleViable && example && (
        <section>
          <SectionHeader chinese="练习" english="Practice" />
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
            Tap chips to arrange them into a correct sentence. Translation: <em>{example.english ?? "—"}</em>
          </p>
          <SentenceScramble tokens={scrambleTokens} english={example.english} />
        </section>
      )}
    </div>
  );
}

function SectionHeader({ chinese, english }: { chinese: string; english: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="font-display text-xl" style={{ color: "var(--accent-gold)" }}>{chinese}</span>
      <span className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>{english}</span>
      <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
    </div>
  );
}
