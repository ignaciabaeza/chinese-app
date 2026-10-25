"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import HubPage from "@/components/HubPage";
import type { DashboardData } from "@/lib/dashboard";

function dueBadge(n: number | undefined) {
  return n ? `${n} due` : undefined;
}

export default function PracticePage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, loading]);

  const reviewDue = data ? data.recognition.due_now + data.listening.due_now : 0;
  const writingDue = data?.writing.due_now ?? 0;

  return (
    <HubPage
      title="Practice"
      subtitle="Spaced repetition first, then drills"
      items={[
        {
          href: "/review", hanzi: "复", title: "Review",
          sub: "Today's due cards — recognition and listening",
          badge: dueBadge(reviewDue), highlight: reviewDue > 0,
        },
        {
          href: "/writing", hanzi: "写", title: "Writing",
          sub: "Stroke-order practice for the words you study",
          badge: dueBadge(writingDue), highlight: writingDue > 0,
        },
        { href: "/listening", hanzi: "听", title: "Listening", sub: "Dictation and tone drills, from HSK or your decks" },
        { href: "/shadowing", hanzi: "说", title: "Shadowing", sub: "Listen, record yourself, compare" },
        { href: "/flashcards", hanzi: "卡", title: "Flashcards", sub: "Shuffle an HSK deck or build your own — answers count as review" },
      ]}
    />
  );
}
