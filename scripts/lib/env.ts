/** Minimal .env loader for standalone scripts (Next.js loads .env in-app). */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function loadEnv(file = ".env"): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  for (const raw of content.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
