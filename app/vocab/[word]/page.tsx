import Link from "next/link";
import { notFound } from "next/navigation";
import { getWordBySimplified, getSentencesForWord, getCharacters } from "@/lib/vocab";
import HanziAnimation from "@/components/HanziAnimation";

export const dynamic = "force-dynamic";

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ word: string }>;
}) {
  const { word: urlWord } = await params;
  const simplified = decodeURIComponent(urlWord);

  const word = await getWordBySimplified(simplified);
  if (!word) notFound();

  const chars = Array.from(simplified).filter((c) => /\p{Script=Han}/u.test(c));
  const [sentences, charMap] = await Promise.all([
    getSentencesForWord(word.id, 15),
    getCharacters(chars),
  ]);

  return (
    <div className="space-y-7 animate-fade-up">
      <Link href="/vocab" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        ← Dictionary
      </Link>

      {/* hero */}
      <div className="space-y-2">
        <div className="font-display" style={{ fontSize: "clamp(4rem, 12vw, 6.5rem)", lineHeight: 1, color: "var(--text-primary)" }}>
          {word.simplified}
        </div>
        {word.traditional && word.traditional !== word.simplified && (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            繁體 <span className="font-display text-lg" style={{ color: "var(--text-primary)" }}>{word.traditional}</span>
          </div>
        )}
        <div className="font-pinyin text-2xl" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
          {word.pinyin}
          {word.pinyin_numbered && (
            <span className="text-sm ml-3" style={{ opacity: 0.6 }}>{word.pinyin_numbered}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {word.hsk2_level != null && (
            <span className="badge-gold">HSK {word.hsk2_level}</span>
          )}
          {word.hsk3_level != null && (
            <span className="badge-gold" style={{ background: "rgba(74, 120, 143, 0.12)", borderColor: "rgba(74, 120, 143, 0.4)", color: "var(--wave-deep)" }}>
              HSK 3.0 · {word.hsk3_level}
            </span>
          )}
          {word.frequency_rank && (
            <span className="badge-gold" style={{ background: "transparent", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              freq #{word.frequency_rank.toLocaleString()}
            </span>
          )}
          {word.pos.map((p) => (
            <span key={p} className="badge-gold" style={{ background: "transparent", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* meanings */}
      <section>
        <SectionHeader chinese="释义" english="Meanings" />
        <ol className="space-y-1.5 ml-1">
          {word.meanings.map((m, i) => (
            <li key={i} className="flex gap-3 text-base" style={{ fontFamily: "Spectral, serif", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", minWidth: "1rem" }}>{i + 1}.</span>
              <span>{m}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* character breakdown */}
      {chars.length > 0 && (
        <section>
          <SectionHeader chinese="汉字" english="Characters" />
          <div className="grid sm:grid-cols-2 gap-3">
            {chars.map((c, i) => {
              const info = charMap.get(c);
              return (
                <div
                  key={`${c}-${i}`}
                  className="rounded-xl p-4 flex gap-4"
                  style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
                >
                  <HanziAnimation char={c} size={120} />
                  <div className="flex-1 min-w-0 text-sm space-y-1" style={{ fontFamily: "Spectral, serif", color: "var(--text-muted)" }}>
                    {info?.etymology?.pinyin && info.etymology.pinyin.length > 0 && (
                      <div className="font-pinyin" style={{ color: "var(--text-primary)", fontStyle: "italic" }}>
                        {info.etymology.pinyin.join(" / ")}
                      </div>
                    )}
                    {info?.etymology?.definition && (
                      <div style={{ color: "var(--text-primary)" }}>{info.etymology.definition}</div>
                    )}
                    {info?.radical && (
                      <div>
                        <span style={{ color: "var(--accent-gold)" }}>radical:</span>{" "}
                        <span className="font-display text-base" style={{ color: "var(--text-primary)" }}>{info.radical}</span>
                      </div>
                    )}
                    {info?.decomposition && info.decomposition !== "？" && (
                      <div>
                        <span style={{ color: "var(--accent-gold)" }}>decomp:</span>{" "}
                        <span className="font-display" style={{ color: "var(--text-primary)" }}>{info.decomposition}</span>
                      </div>
                    )}
                    {!info && (
                      <div className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                        No decomposition data (run db:build-vocab).
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* example sentences */}
      <section>
        <SectionHeader chinese="例句" english="Examples" />
        {sentences.length === 0 ? (
          <div className="rounded-2xl p-5 text-center" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <p style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
              No example sentences yet. Run <code style={{ color: "var(--accent-gold)" }}>npm run db:match-sentences</code> to populate from Tatoeba.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sentences.map((s) => (
              <li
                key={s.id}
                className="rounded-xl p-4 space-y-1"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
              >
                <div className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
                  {highlightTarget(s.simplified, word.simplified)}
                </div>
                {s.pinyin && (
                  <div className="text-sm font-pinyin" style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                    {s.pinyin}
                  </div>
                )}
                <div className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
                  {s.english}
                </div>
                {s.max_hsk_level != null && (
                  <div className="text-xs" style={{ color: "var(--accent-gold)", opacity: 0.6, fontFamily: "Cormorant Garamond, serif" }}>
                    HSK ≤ {s.max_hsk_level}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeader({ chinese, english }: { chinese: string; english: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="font-display text-xl" style={{ color: "var(--accent-gold)" }}>
        {chinese}
      </span>
      <span className="text-sm tracking-widest uppercase" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        {english}
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
    </div>
  );
}

/** Render a sentence with each occurrence of the target word wrapped in a subtle accent. */
function highlightTarget(sentence: string, target: string) {
  if (!target || !sentence.includes(target)) return sentence;
  const parts = sentence.split(target);
  const out: React.ReactNode[] = [];
  parts.forEach((part, i) => {
    out.push(part);
    if (i < parts.length - 1) {
      out.push(
        <span key={i} style={{ color: "var(--seal)", fontWeight: 600 }}>
          {target}
        </span>,
      );
    }
  });
  return out;
}
