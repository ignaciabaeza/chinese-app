import Link from "next/link";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { listTexts } from "@/lib/reader";
import PasteImporter from "./PasteImporter";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get("hanyu_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export default async function ReaderListPage() {
  const userId = await getUserId();
  const texts = await listTexts(userId);

  const shared = texts.filter((t) => t.user_id === null);
  const mine = texts.filter((t) => t.user_id !== null);

  // Group shared texts by source
  const sourceGroups = new Map<string, typeof shared>();
  for (const t of shared) {
    const key = t.source ?? "other";
    const arr = sourceGroups.get(key) ?? [];
    arr.push(t);
    sourceGroups.set(key, arr);
  }
  const SOURCE_LABELS: Record<string, string> = {
    "hsk1-book": "HSK 1 lessons",
    "hsk2-book": "HSK 2 lessons",
    "hsk3-book": "HSK 3 lessons",
    "hsk4-book": "HSK 4 lessons",
  };

  return (
    <div className="space-y-7 animate-fade-up">
      <div>
        <h1
          className="text-2xl sm:text-3xl mb-1"
          style={{ fontFamily: "Cormorant Garamond, serif", color: "var(--accent-gold)", letterSpacing: "0.06em" }}
        >
          Reader
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {shared.length} authored texts {userId ? `· ${mine.length} of yours` : ""}
        </p>
      </div>

      {userId && <PasteImporter />}
      {!userId && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontFamily: "Spectral, serif" }}
        >
          <Link href="/auth" style={{ color: "var(--accent-gold)" }}>Sign in</Link> to paste in your own texts and track knowledge state per word.
        </div>
      )}

      {mine.length > 0 && (
        <section>
          <SectionHeader chinese="我的文本" english="Your texts" />
          <ul className="space-y-2">
            {mine.map((t) => <TextRow key={t.id} text={t} />)}
          </ul>
        </section>
      )}

      {Array.from(sourceGroups.entries()).map(([source, texts]) => (
        <section key={source}>
          <SectionHeader chinese="教材" english={SOURCE_LABELS[source] ?? source} />
          <ul className="space-y-2">
            {texts.map((t) => <TextRow key={t.id} text={t} />)}
          </ul>
        </section>
      ))}
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

function TextRow({ text }: { text: { id: number; title: string; preview: string; hsk_level: number | null; source: string | null } }) {
  return (
    <li>
      <Link
        href={`/reader/${text.id}`}
        className="block rounded-xl p-4 transition-all"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-display text-base flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
            {text.title}
          </div>
          {text.hsk_level && (
            <span className="badge-gold shrink-0">HSK {text.hsk_level}</span>
          )}
        </div>
        <div className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-muted)", fontFamily: "Spectral, serif" }}>
          {text.preview}…
        </div>
      </Link>
    </li>
  );
}
