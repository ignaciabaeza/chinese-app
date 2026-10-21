import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getLessonDetail, getLessonProgress, type StepKey } from "@/lib/lessons";
import { pool } from "@/lib/db";
import LessonStepper from "./LessonStepper";
import { getLesson } from "@/lib/content";
import type { HSKLevel } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get("hanyu_token")?.value;
  if (!token) return null;
  return verifyToken(token)?.userId ?? null;
}

/** ID of the matching row in the `texts` table so we can deep-link to the
 *  reader for tap-to-read of this lesson's dialogue. */
async function findReaderTextId(level: number, lessonNumber: number, lessonTitle: string): Promise<number | null> {
  const title = `HSK ${level} · 第${lessonNumber}课 ${lessonTitle}`;
  const { rows } = await pool.query<{ id: number }>(
    "SELECT id FROM texts WHERE source = $1 AND title = $2 AND user_id IS NULL LIMIT 1",
    [`hsk${level}-book`, title],
  );
  return rows[0]?.id ?? null;
}

/** Exercises, drills, characters, etc. from the authored lesson JSON. */
function extrasFor(level: HSKLevel, number: number) {
  const lesson = getLesson(level, number);
  if (!lesson || lesson.stub) return null;
  const { exercises, pinyinSection, characters, application, culture } = lesson;
  return { exercises, pinyinSection, characters, application, culture };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ level: string; number: string }>;
}) {
  const { level, number } = await params;
  const lvl = parseInt(level, 10);
  const num = parseInt(number, 10);
  if (!Number.isFinite(lvl) || !Number.isFinite(num)) notFound();
  if (lvl !== 1 && lvl !== 2) notFound();

  const userId = await getUserId();
  const detail = await getLessonDetail(lvl as 1 | 2, num, userId);
  if (!detail) notFound();

  const [progress, readerTextId] = await Promise.all([
    userId
      ? getLessonProgress(userId, detail.lesson.id)
      : Promise.resolve({ steps_completed: [] as StepKey[], last_studied: null }),
    findReaderTextId(lvl, num, detail.lesson.title_hanzi),
  ]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      <Link href={`/course/${lvl}`} className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "Cormorant Garamond, serif" }}>
        ← HSK {lvl}
      </Link>
      <h1 className="text-2xl sm:text-3xl mt-2 font-display" style={{ color: "var(--text-primary)" }}>
        第{num}课 · {detail.lesson.title_hanzi}
      </h1>
      {detail.lesson.title_english && (
        <p className="text-sm mt-1" style={{ color: "var(--accent-gold)", fontFamily: "Cormorant Garamond, serif", letterSpacing: "0.05em" }}>
          {detail.lesson.title_english}
        </p>
      )}

      <LessonStepper
        level={lvl}
        number={num}
        detail={detail}
        initialProgress={progress.steps_completed}
        signedIn={Boolean(userId)}
        readerTextId={readerTextId}
        extras={extrasFor(lvl as HSKLevel, num)}
      />
    </div>
  );
}
