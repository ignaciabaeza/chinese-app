"use client";

/**
 * The one self-grading format used by every card page: "Don't know" / "Know it"
 * (keys 1 / 2). Graded cards move between Leitner boxes (lib/leitner-rules.ts).
 */
export default function KnowButtons({
  onMiss, onKnow, disabled = false, suggested,
}: {
  onMiss: () => void;
  onKnow: () => void;
  disabled?: boolean;
  /** Fill the suggested button (writing: based on stroke mistakes). */
  suggested?: "miss" | "know";
}) {
  const buttons = [
    { id: "miss", label: "Don't know", key: "1", color: "var(--accent-rose)", onClick: onMiss },
    { id: "know", label: "Know it",    key: "2", color: "var(--accent-gold)", onClick: onKnow },
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-2">
      {buttons.map((b) => {
        const filled = suggested === b.id;
        return (
          <button
            key={b.id}
            onClick={b.onClick}
            disabled={disabled}
            className="py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              opacity: disabled ? 0.5 : 1,
              background: filled ? b.color : "transparent",
              border: `1.5px solid ${b.color}`,
              color: filled ? "var(--bg-parchment)" : b.color,
              fontFamily: "Cormorant Garamond, serif",
              letterSpacing: "0.05em",
            }}
          >
            <div>{b.label}</div>
            <div className="text-xs opacity-60 mt-0.5">[{b.key}]</div>
          </button>
        );
      })}
    </div>
  );
}
