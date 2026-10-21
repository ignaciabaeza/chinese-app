// Hanzi inside the .moon-circle hero (flashcards + review). Always one line:
// the font size is derived from the circle's own width (same clamp() as
// .moon-circle in globals.css, minus its 1.5rem padding on each side) divided
// by the number of characters, so 2-, 3- or 4-character words shrink to fit
// instead of wrapping.

const CIRCLE_INNER = "(clamp(240px, 55vw, 300px) - 3rem)";
const MAX_SINGLE_CHAR_PX = 130;

export default function MoonHanzi({ text }: { text: string }) {
  const chars = Math.max(1, Array.from(text).length);
  return (
    <div
      className="text-center"
      style={{
        // 0.88: each glyph is ~1em wide; leave a little air at the edges.
        fontSize: `min(${MAX_SINGLE_CHAR_PX}px, calc(${CIRCLE_INNER} * 0.88 / ${chars}))`,
        whiteSpace: "nowrap",
        lineHeight: 1,
        color: "var(--accent-crane-white)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        zIndex: 1,
      }}
    >
      {text}
    </div>
  );
}
