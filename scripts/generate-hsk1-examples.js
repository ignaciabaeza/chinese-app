// Generates one example sentence (chinese + pinyin + english) for each HSK1 word
// using claude-haiku-4-5-20251001 and writes results back into data/hsk1.ts
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-hsk1-examples.js

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const HSK1_PATH = path.join(__dirname, '..', 'data', 'hsk1.ts');
const BATCH_SIZE = 50;
const MODEL = 'claude-haiku-4-5-20251001';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

// --- Parse current hsk1.ts into an array of word objects ---
function parseWords(content) {
  const wordRegex = /\{([^}]+)\}/g;
  const words = [];
  let match;
  while ((match = wordRegex.exec(content)) !== null) {
    const block = match[1];
    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
      return m ? m[1] : '';
    };
    const getNum = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*(\\d+)`));
      return m ? parseInt(m[1]) : null;
    };
    const id = get('id');
    if (!id.startsWith('hsk1_')) continue;
    words.push({
      id,
      chinese: get('chinese'),
      pinyin: get('pinyin'),
      english: get('english'),
      level: getNum('level'),
      category: get('category'),
      traditional: get('traditional'),
    });
  }
  return words;
}

// --- Call API for a batch of words, returns map: chinese -> {chinese,pinyin,english} ---
async function generateExamples(batch) {
  const wordList = batch.map((w, i) => `${i + 1}. ${w.chinese} (${w.pinyin}) — ${w.english}`).join('\n');

  const prompt = `You are a Chinese language teacher. For each of the following HSK1 vocabulary words, write ONE simple example sentence appropriate for a beginner (HSK1 level vocabulary and grammar).

Return ONLY a JSON array with exactly ${batch.length} objects in the same order as the input list. Each object must have exactly these keys:
- "word": the original simplified Chinese word
- "chinese": the example sentence in simplified Chinese characters
- "pinyin": the full pinyin of the sentence with tone marks
- "english": the English translation of the sentence

Keep sentences short (under 12 words). Use simple, natural, everyday language.

Words:
${wordList}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  // Extract JSON array from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array found in response:\n' + text);
  const parsed = JSON.parse(jsonMatch[0]);

  const result = {};
  for (const item of parsed) {
    result[item.word] = { chinese: item.chinese, pinyin: item.pinyin, english: item.english };
  }
  return result;
}

// --- Rebuild hsk1.ts content with examples injected ---
function buildFileContent(words, examples) {
  const escape = (s) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const lines = words.map((w) => {
    const tradPart = w.traditional ? `, traditional: '${escape(w.traditional)}'` : '';
    const ex = examples[w.chinese];
    const exPart = ex
      ? `, example: { chinese: '${escape(ex.chinese)}', pinyin: '${escape(ex.pinyin)}', english: '${escape(ex.english)}' }`
      : '';
    return `  { id: '${w.id}', chinese: '${escape(w.chinese)}', pinyin: '${escape(w.pinyin)}', english: '${escape(w.english)}', level: ${w.level}, category: '${w.category}'${tradPart}${exPart} },`;
  });

  return `import type { Word } from './vocabulary';\n\nexport const hsk1Words: Word[] = [\n${lines.join('\n')}\n];\n`;
}

async function main() {
  const content = fs.readFileSync(HSK1_PATH, 'utf8');
  const words = parseWords(content);
  console.log(`Loaded ${words.length} words from hsk1.ts`);

  const allExamples = {};
  const batches = Math.ceil(words.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const batch = words.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    console.log(`Batch ${i + 1}/${batches}: words ${i * BATCH_SIZE + 1}–${i * BATCH_SIZE + batch.length}...`);
    try {
      const examples = await generateExamples(batch);
      Object.assign(allExamples, examples);
      console.log(`  ✓ got ${Object.keys(examples).length} examples`);
    } catch (err) {
      console.error(`  ✗ batch ${i + 1} failed:`, err.message);
      console.error('  Retrying once...');
      try {
        const examples = await generateExamples(batch);
        Object.assign(allExamples, examples);
        console.log(`  ✓ retry succeeded, got ${Object.keys(examples).length} examples`);
      } catch (err2) {
        console.error('  ✗ retry also failed, skipping batch:', err2.message);
      }
    }
    // small delay between batches to be polite to the API
    if (i < batches - 1) await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nTotal examples generated: ${Object.keys(allExamples).length}/${words.length}`);

  const newContent = buildFileContent(words, allExamples);
  fs.writeFileSync(HSK1_PATH, newContent, 'utf8');
  console.log('hsk1.ts updated successfully.');
}

main().catch((err) => { console.error(err); process.exit(1); });
