"use client";

import { BOX_DAYS, boxName } from "@/lib/leitner-rules";

/** Cards per Leitner box (boxes[0] = box 1) by name, with each box's interval. */
export default function BoxStrip({ boxes, newCount }: { boxes: number[]; newCount?: number }) {
  return (
    // Phones: two rows of three so the names fit; wider screens: one row.
    <div className={`grid gap-1.5 grid-cols-3 ${boxes.length + (newCount != null ? 1 : 0) === 6 ? "sm:grid-cols-6" : "sm:grid-cols-5"}`}>
      {newCount != null && (
        <Cell value={newCount} label={boxName(0)} sub="—" color="var(--wave)" />
      )}
      {boxes.map((n, i) => (
        <Cell
          key={i}
          value={n}
          label={boxName(i + 1)}
          sub={`${BOX_DAYS[i + 1]}d`}
          color={i === 0 ? "var(--accent-rose)" : i === boxes.length - 1 ? "var(--ink)" : "var(--accent-gold)"}
        />
      ))}
    </div>
  );
}

function Cell({ value, label, sub, color }: { value: number; label: string; sub: string; color: string }) {
  return (
    <div className="rounded-lg py-2 px-1 text-center min-w-0" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
      <div className="text-lg sm:text-xl font-bold leading-tight" style={{ color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      <div className="text-[10px] sm:text-xs truncate" style={{ color: "var(--text-primary)", fontFamily: "Cormorant Garamond, serif" }}>{label}</div>
      <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}
