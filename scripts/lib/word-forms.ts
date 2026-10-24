/**
 * Picks which reading ("form") of a complete-hsk.json entry becomes the
 * word's row in `words`. Polyphonic entries list every CC-CEDICT reading, and
 * the first is often a surname (白 Bái), an archaic reading (离 chī "mythical
 * beast") or an old variant (帮) — taking forms[0] showed those to learners.
 *
 * Order of preference:
 *   1. the pinyin our lessons / the official HSK 1–2 word lists teach
 *      (exact, then ignoring tones), when the word is in them; else the
 *      common reading in scripts/content/word-readings.json (generated with
 *      pinyin-pro's polyphone dictionary, plus curated neutral-tone and
 *      same-pinyin cases);
 *   2. among what's left, a form that isn't a proper noun (capitalised
 *      pinyin) or a variant/archaic/cross-reference gloss;
 *   3. then the form whose meanings share the most words with the English we
 *      teach (后 hòu "behind", not hòu "empress"); then source order.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface HSKForm {
  traditional?: string;
  transcriptions?: { pinyin?: string; numeric?: string };
  meanings?: string[];
  classifiers?: string[];
}

/** Lowercase, NFC, no spaces/apostrophes/hyphens: "Jué de" → "juéde". */
export function normalizePinyin(p: string): string {
  return p.normalize("NFC").toLowerCase().replace(/[\s'’\-·]/g, "");
}

/** Same, with tone marks stripped: "juéde" → "juede". */
export function tonelessPinyin(p: string): string {
  return normalizePinyin(p).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ü/g, "u");
}

const SECONDARY_GLOSS = new RegExp(
  "^(\\(?(old|unofficial|erhua|archaic|ancient|obsolete|erroneous)\\b.*)?variant of" +
  "|^\\(onom\\.\\)|^surname\\b|^\\(archaic\\)|\\(archaic\\)$|^archaic\\b|^see\\s+\\S*[\\u3400-\\u9fff]|^used in\\b|^\\(old\\)|^\\(dialect\\)|^\\(bound form\\) see\\b",
  "i",
);

/** Capitalised pinyin marks a proper noun: Bái, Ān dìng (tone-marked capitals too). */
function isProperNoun(form: HSKForm): boolean {
  return /^\p{Lu}/u.test((form.transcriptions?.pinyin ?? "").normalize("NFC"));
}

/** Higher = less suitable as the word's main reading. */
function penalty(form: HSKForm): number {
  const pinyin = form.transcriptions?.pinyin ?? "";
  const first = form.meanings?.[0] ?? "";
  let p = 0;
  if (isProperNoun(form)) p += 100; // proper noun / surname
  if (SECONDARY_GLOSS.test(first)) p += 50;
  if (!pinyin) p += 1000;
  return p;
}

export interface Taught {
  pinyin: string;
  english?: string;
}

const STOPWORDS = new Set(["to", "a", "an", "the", "of", "be", "in", "on", "for", "or", "and", "sb", "sth", "etc", "used", "as", "with"]);
function englishWords(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w)));
}

export function pickForm(forms: HSKForm[] | undefined, taught: Taught[] = []): HSKForm | undefined {
  if (!forms || forms.length === 0) return undefined;
  let candidates = forms;
  let english = "";
  for (const t of taught) {
    const exact = forms.filter((f) => normalizePinyin(f.transcriptions?.pinyin ?? "") === normalizePinyin(t.pinyin));
    // Ignoring tones also when the exact match is only a proper noun:
    // 标致 "biāo zhì" must reach biāo zhi "beautiful", not Biāo zhì "Peugeot".
    const loose = exact.some((f) => !isProperNoun(f)) ? exact
      : forms.filter((f) => tonelessPinyin(f.transcriptions?.pinyin ?? "") === tonelessPinyin(t.pinyin));
    if (loose.length) { candidates = loose; english = t.english ?? ""; break; }
  }
  const want = englishWords(english);
  const overlap = (f: HSKForm) => {
    const have = englishWords((f.meanings ?? []).join(" "));
    let n = 0;
    for (const w of want) if (have.has(w)) n++;
    return n;
  };
  return candidates
    .map((f, i) => ({ f, i, p: penalty(f), o: overlap(f) }))
    .sort((a, b) => a.p - b.p || b.o - a.o || a.i - b.i)[0].f;
}

/**
 * hanzi → pinyin (+ English) in priority order: authored lesson JSON
 * (data/hsk{N}/lessons, earliest lesson first), the official per-lesson lists
 * (scripts/content/hsk{N}-vocab.json), then scripts/content/word-readings.json.
 */
export function loadTaught(root: string): Map<string, Taught[]> {
  const taught = new Map<string, Taught[]>();
  const add = (hanzi: string | undefined, pinyin: string | undefined, english: string | undefined) => {
    if (!hanzi || !pinyin) return;
    const list = taught.get(hanzi) ?? [];
    const same = list.find((t) => normalizePinyin(t.pinyin) === normalizePinyin(pinyin));
    if (same) same.english = [same.english, english].filter(Boolean).join("; ");
    else list.push({ pinyin, english });
    taught.set(hanzi, list);
  };
  for (const level of [1, 2, 3, 4, 5, 6]) {
    const dir = join(root, "data", `hsk${level}`, "lessons");
    if (existsSync(dir)) {
      const files = readdirSync(dir).filter((f) => /^\d+\.json$/.test(f))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      for (const file of files) {
        const lesson = JSON.parse(readFileSync(join(dir, file), "utf8"));
        for (const text of lesson.texts ?? []) for (const w of text.newWords ?? []) add(w.hanzi, w.pinyin, w.english);
      }
    }
    const listPath = join(root, "scripts", "content", `hsk${level}-vocab.json`);
    if (existsSync(listPath)) {
      const byLesson: Record<string, { hanzi?: string; pinyin?: string; english?: string }[]> = JSON.parse(readFileSync(listPath, "utf8"));
      for (const key of Object.keys(byLesson).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))) {
        for (const w of byLesson[key]) add(w.hanzi, w.pinyin, w.english);
      }
    }
  }
  const readingsPath = join(root, "scripts", "content", "word-readings.json");
  if (existsSync(readingsPath)) {
    const readings: Record<string, Taught> = JSON.parse(readFileSync(readingsPath, "utf8"));
    for (const [hanzi, t] of Object.entries(readings)) add(hanzi, t.pinyin, t.english);
  }
  return taught;
}

/**
 * Fixes source pinyin quirks: "u:" for ü (略 "lu:è"), a stray neutral-tone dot
 * (闺女 "guī ˙nu:"), and a tone mark that slid off a capital (欧洲 "Oū zhōu").
 */
export function cleanSourcePinyin(p: string): string {
  let out = p.normalize("NFC").replace(/u:/g, "ü").replace(/˙/g, "");
  const m = /^([AEO])([āáǎàēéěèīíǐìōóǒòūúǔù])/.exec(out);
  if (m) {
    const marks = ["\u0304", "\u0301", "\u030C", "\u0300"];
    const mark = marks.find((k) => m[2].normalize("NFD").includes(k))!;
    const bare = m[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    out = (m[1] + mark).normalize("NFC") + bare + out.slice(2);
  }
  return out;
}

/** CC-CEDICT lookup key: simplified + numbered pinyin, case kept (Bai2 ≠ bai2). */
export function cedictKey(simplified: string, numeric: string): string {
  return `${simplified}|${numeric.replace(/u:/g, "ü").replace(/\s+/g, " ").trim()}`;
}

export interface WordRow {
  traditional: string | null;
  pinyin: string;
  pinyin_numbered: string | null;
  meanings: string[];
}

/**
 * The `words` row for one complete-hsk.json entry, or null if it has no usable
 * reading/meaning. `cedict` maps cedictKey() → glosses; extra glosses only come
 * from the same reading, so 离 lí never borrows 离 chī's "mythical beast".
 */
export function buildWordRow(
  entry: { simplified: string; forms?: HSKForm[] },
  cedict: Map<string, string[]>,
  taught: Taught[] = [],
): WordRow | null {
  const form = pickForm(entry.forms, taught);
  const pinyin = cleanSourcePinyin(form?.transcriptions?.pinyin ?? "");
  if (!form || !pinyin) return null;
  const pinyin_numbered = form.transcriptions?.numeric ?? null;

  let meanings = (form.meanings ?? []).filter(Boolean);
  if (meanings.length < 2 && pinyin_numbered) {
    const seen = new Set(meanings.map((m) => m.toLowerCase()));
    for (const m of cedict.get(cedictKey(entry.simplified, pinyin_numbered)) ?? []) {
      if (seen.has(m.toLowerCase())) continue;
      meanings.push(m);
      seen.add(m.toLowerCase());
      if (meanings.length >= 5) break;
    }
  }
  // Only cross-references ("variant of 黏[nian2]")? Borrow the target's
  // glosses for the same reading.
  if (pinyin_numbered && meanings.length > 0 && meanings.every((m) => SECONDARY_GLOSS.test(m))) {
    const seen = new Set(meanings.map((m) => m.toLowerCase()));
    for (const m of meanings.slice()) {
      const ref = /(?:variant of|see)\s+(?:[^\s|[]+\|)?([^\s|[,;()]+)(?:\[([^\]]+)\])?/i.exec(m);
      if (!ref) continue;
      for (const g of cedict.get(cedictKey(ref[1], ref[2] ?? pinyin_numbered)) ?? []) {
        if (seen.has(g.toLowerCase()) || SECONDARY_GLOSS.test(g)) continue;
        meanings.push(g);
        seen.add(g.toLowerCase());
      }
    }
  }
  // Meanings matching the English we teach go first (里: "inside" before
  // "lining"), cross-references like "variant of 黏" last; otherwise source
  // order. Cap to keep payloads sane.
  meanings = meanings.map((m, i) => ({ m, i, s: SECONDARY_GLOSS.test(m) ? 1 : 0 }))
    .sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.m);
  const withEnglish = taught.filter((t) => t.english);
  const english = (withEnglish.find((t) => normalizePinyin(t.pinyin) === normalizePinyin(pinyin))
    ?? withEnglish.find((t) => tonelessPinyin(t.pinyin) === tonelessPinyin(pinyin)))?.english;
  if (english) {
    const want = englishWords(english);
    const score = (m: string) => [...englishWords(m)].filter((w) => want.has(w)).length;
    meanings = meanings.map((m, i) => ({ m, i, s: score(m) }))
      .sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.m);
  }
  meanings = meanings.slice(0, 8);
  if (meanings.length === 0) return null;
  return { traditional: form.traditional ?? null, pinyin, pinyin_numbered, meanings };
}
