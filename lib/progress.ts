"use client";

export interface CardProgress {
  wordId: string;
  easeFactor: number;  // SRS ease factor (default 2.5)
  interval: number;    // days until next review
  repetitions: number; // number of successful reviews
  nextReview: number;  // timestamp
  lastReview: number;  // timestamp
  correct: number;     // total correct
  incorrect: number;   // total incorrect
}

export interface StudySession {
  date: string;
  cardsStudied: number;
  correct: number;
  incorrect: number;
  level: 1 | 2 | 3 | 4 | 5 | 6 | "all";
  wordIds?: string[];
}

const PROGRESS_KEY = "chinese_app_progress";
const SESSIONS_KEY = "chinese_app_sessions";

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
  // Keep last 30 sessions
  const trimmed = sessions.slice(-30);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
}

// SM-2 spaced repetition algorithm
export function updateCardProgress(
  progress: CardProgress | undefined,
  wordId: string,
  quality: 0 | 1 | 2 | 3  // 0=blackout, 1=wrong, 2=hard, 3=easy
): CardProgress {
  const now = Date.now();
  const card: CardProgress = progress ?? {
    wordId,
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
    if (card.repetitions === 0) {
      newInterval = 1;
    } else if (card.repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(card.interval * card.easeFactor);
    }

    // Clamp interval to max 30 days
    newInterval = Math.min(newInterval, 30);

    const newEaseFactor = Math.max(
      1.3,
      card.easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)
    );

    return {
      ...card,
      easeFactor: newEaseFactor,
      interval: newInterval,
      repetitions: card.repetitions + 1,
      nextReview: now + newInterval * 24 * 60 * 60 * 1000,
      lastReview: now,
      correct: card.correct + 1,
    };
  } else {
    // Failed: reset repetitions, short interval
    return {
      ...card,
      repetitions: 0,
      interval: 1,
      nextReview: now + 10 * 60 * 1000, // 10 minutes
      lastReview: now,
      incorrect: card.incorrect + 1,
    };
  }
}

// ── Server sync ──────────────────────────────────────────────────────────────

/** Push all local progress to the server (fire-and-forget is fine). */
export async function syncProgressToServer(
  progress: Record<string, CardProgress>
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  } catch {
    // offline — ignore silently
  }
}

/** Load progress from the server and merge into localStorage (server wins). */
export async function loadProgressFromServer(): Promise<Record<string, CardProgress>> {
  if (typeof window === "undefined") return {};
  try {
    const res = await fetch("/api/progress");
    if (!res.ok) return loadProgress();
    const { progress } = await res.json() as { progress: Record<string, CardProgress> };
    saveProgress(progress);
    return progress;
  } catch {
    return loadProgress();
  }
}

/** Save a session locally and push it to the server. */
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

/** Load sessions from the server and overwrite localStorage. Returns the sessions. */
export async function loadSessionsFromServer(): Promise<StudySession[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/progress/sessions");
    if (!res.ok) return loadSessions();
    const { sessions } = await res.json() as { sessions: StudySession[] };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return sessions;
  } catch {
    return loadSessions();
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export function getDueCards(
  wordIds: string[],
  progress: Record<string, CardProgress>
): string[] {
  const now = Date.now();
  return wordIds.filter(id => {
    const p = progress[id];
    if (!p) return true; // Never seen = due
    return p.nextReview <= now;
  });
}

export function getStats(
  wordIds: string[],
  progress: Record<string, CardProgress>
) {
  const total = wordIds.length;
  const seen = wordIds.filter(id => progress[id]);
  const learned = wordIds.filter(id => {
    const p = progress[id];
    return p && p.repetitions >= 3;
  });
  const due = getDueCards(wordIds, progress);

  return {
    total,
    seen: seen.length,
    learned: learned.length,
    due: due.length,
    unseen: total - seen.length,
  };
}
