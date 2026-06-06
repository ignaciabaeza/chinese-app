import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getText, getUserKnowledgeMap, type Segment } from "@/lib/reader";
import ReaderView from "./ReaderView";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get("hanyu_token")?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

export default async function TextPage({
  params,
}: {
  params: Promise<{ textId: string }>;
}) {
  const { textId } = await params;
  const id = parseInt(textId, 10);
  if (!Number.isFinite(id)) notFound();

  const userId = await getUserId();
  const text = await getText(id, userId);
  if (!text) notFound();

  // Build the knowledge map only if the user is signed in.
  const segments: Segment[] = Array.isArray(text.segments) ? text.segments : [];
  let knowledge: Record<number, string> = {};
  if (userId) {
    const wordIds = Array.from(new Set(segments.filter((s) => s.w).map((s) => s.w!)));
    const map = await getUserKnowledgeMap(userId, wordIds);
    knowledge = Object.fromEntries(map.entries());
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <Link href="/reader" className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          ← Reader
        </Link>
        <h1
          className="text-xl sm:text-2xl mt-2 mb-1 font-display"
          style={{ color: "var(--text-primary)" }}
        >
          {text.title}
        </h1>
        <div className="flex gap-2 items-center text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
          {text.hsk_level != null && <span className="badge-gold">HSK {text.hsk_level}</span>}
          <span>{text.body.length} chars · {segments.filter((s) => !s.p).length} tokens</span>
        </div>
      </div>

      <ReaderView segments={segments} initialKnowledge={knowledge} signedIn={Boolean(userId)} />
    </div>
  );
}
