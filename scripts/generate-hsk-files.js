const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const data = JSON.parse(fs.readFileSync(path.join(dataDir, 'complete.json'), 'utf8'));

const posMap = {
  n: 'nouns', nr: 'nouns', ns: 'places', nt: 'nouns', nz: 'proper nouns',
  v: 'verbs', vn: 'verbs',
  a: 'adjectives', ad: 'adjectives', an: 'adjectives', b: 'adjectives',
  d: 'adverbs',
  p: 'prepositions',
  c: 'conjunctions', cc: 'conjunctions',
  m: 'measure words', mq: 'measure words', Mg: 'measure words',
  q: 'measure words', qt: 'measure words', qv: 'measure words',
  r: 'pronouns', Rg: 'pronouns',
  u: 'particles',
  i: 'idioms', l: 'idioms',
  f: 'directions',
  s: 'places',
  t: 'time', tg: 'time',
  e: 'other', y: 'other', o: 'other', z: 'other', g: 'other', h: 'other', k: 'other',
};

const byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

for (const w of data) {
  const newLevels = (w.level || [])
    .map(l => { const m = l.match(/^new-([1-6])$/); return m ? parseInt(m[1]) : null; })
    .filter(Boolean);

  if (newLevels.length === 0) continue;

  const lvl = newLevels[0];
  const form = (w.forms || [])[0] || {};
  const trad = form.traditional || '';
  const pinyin = ((form.transcriptions || {}).pinyin) || '';
  const meanings = (form.meanings || []).join('; ');
  const pos = (w.pos || [])[0] || '';

  byLevel[lvl].push({
    simplified: w.simplified,
    traditional: trad !== w.simplified ? trad : '',
    pinyin,
    english: meanings,
    category: posMap[pos] || 'other',
  });
}

function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

for (const [lvl, words] of Object.entries(byLevel)) {
  const lines = words.map((w, i) => {
    const id = `hsk${lvl}_${String(i + 1).padStart(3, '0')}`;
    const tradPart = w.traditional ? `, traditional: '${escapeStr(w.traditional)}'` : '';
    return `  { id: '${id}', chinese: '${escapeStr(w.simplified)}', pinyin: '${escapeStr(w.pinyin)}', english: '${escapeStr(w.english)}', level: ${lvl}, category: '${w.category}'${tradPart} },`;
  });

  const content = `import type { Word } from './vocabulary';\n\nexport const hsk${lvl}Words: Word[] = [\n${lines.join('\n')}\n];\n`;
  fs.writeFileSync(path.join(dataDir, `hsk${lvl}.ts`), content, 'utf8');
  console.log(`Wrote hsk${lvl}.ts with ${words.length} words`);
}
