"use client";

import type { CardProgress, CardType, StudySession } from "@/lib/types";

const PROGRESS_KEY = "hanyu_progress_v2";
const SESSIONS_KEY = "hanyu_sessions_v2";

// ─── localStorage ────────────────────────────────────────────────────────────

export function loadProgress(): Record<string, CardProgress> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveProgress(progress: Record<string, CardProgress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadSessions(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: StudySession) {
  const sessions = loadSessions();
  sessions.push(session);
  const trimmed = sessions.slice(-60);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
}

// ─── SM-2 spaced repetition ──────────────────────────────────────────────────

export function updateCardProgress(
  prior: CardProgress | undefined,
  cardId: string,
  cardType: CardType,
  quality: 0 | 1 | 2 | 3 // 0 blackout, 1 wrong, 2 hard, 3 easy
): CardProgress {
  const now = Date.now();
  const card: CardProgress = prior ?? {
    cardId,
    cardType,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now,
    lastReview: 0,
    correct: 0,
    incorrect: 0,
  };

  const isCorrect = quality >= 2;

  if (isCorrect) {
    let newInterval: number;
    if (card.repetitions === 0) newInterval = 1;
    else if (card.repetitions === 1) newInterval = 6;
    else newInterval = Math.round(card.interval * card.easeFactor);
    newInterval = Math.min(newInterval, 30);

    const newEase = Math.max(
      1.3,
      card.easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)
    );

    return {
      ...card,
      cardId,
      cardType,
      easeFactor: newEase,
      interval: newInterval,
      repetitions: card.repetitions + 1,
      nextReview: now + newInterval * 24 * 60 * 60 * 1000,
      lastReview: now,
      correct: card.correct + 1,
    };
  }

  return {
    ...card,
    cardId,
    cardType,
    repetitions: 0,
    interval: 1,
    nextReview: now + 10 * 60 * 1000,
    lastReview: now,
    incorrect: card.incorrect + 1,
  };
}

// ─── Server sync ─────────────────────────────────────────────────────────────

export async function syncProgressToServer(progress: Record<string, CardProgress>): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  } catch {
    // offline — local save already happened
  }
}

export async function loadProgressFromServer(): Promise<Record<string, CardProgress>> {
  if (typeof window === "undefined") return {};
  try {
    const res = await fetch("/api/progress");
    if (!res.ok) return loadProgress();
    const { progress } = (await res.json()) as { progress: Record<string, CardProgress> };
    saveProgress(progress);
    return progress;
  } catch {
    return loadProgress();
  }
}

export async function saveSessionWithSync(session: StudySession): Promise<void> {
  saveSession(session);
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/progress/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
  } catch {
    // offline — local save already done
  }
}

export async function loadSessionsFromServer(): Promise<StudySession[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/progress/sessions");
    if (!res.ok) return loadSessions();
    const { sessions } = (await res.json()) as { sessions: StudySession[] };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return sessions;
  } catch {
    return loadSessions();
  }
}

// ─── Selection / stats ───────────────────────────────────────────────────────

export function getDueCards(cardIds: string[], progress: Record<string, CardProgress>): string[] {
  const now = Date.now();
  return cardIds.filter((id) => {
    const p = progress[id];
    if (!p) return true;
    return p.nextReview <= now;
  });
}

export function getStats(cardIds: string[], progress: Record<string, CardProgress>) {
  const total = cardIds.length;
  const seen = cardIds.filter((id) => progress[id]).length;
  const learned = cardIds.filter((id) => {
    const p = progress[id];
    return p && p.repetitions >= 3;
  }).length;
  const due = getDueCards(cardIds, progress).length;
  return { total, seen, learned, due, unseen: total - seen };
}

/** Today's date as ISO YYYY-MM-DD in the user's local time. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Day streak — consecutive days ending today with at least one session. */
export function computeStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const dates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 365; i++) {
    const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    if (dates.has(iso)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
